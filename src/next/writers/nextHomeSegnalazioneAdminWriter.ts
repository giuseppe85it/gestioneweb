import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  NEXT_HOME_SEGNALAZIONI_ADMIN_WRITE_SCOPE,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";

const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";

type RawRecord = Record<string, unknown>;

export type NextHomeSegnalazioneAdminPatch = {
  id: string;
  autistaNome?: string | null;
  badgeAutista?: string | null;
  targaCamion?: string | null;
  targaRimorchio?: string | null;
  targa?: string | null;
  ambito?: string | null;
  tipoProblema?: string | null;
  descrizione?: string | null;
  note?: string | null;
  stato?: string | null;
  letta?: boolean | null;
  flagVerifica?: boolean | null;
  motivoVerifica?: string | null;
  foto?: unknown[] | null;
  adminNote?: string | null;
};

export type NextHomeSegnalazioneAdminResult =
  | { ok: true; recordId: string; changed: boolean }
  | { ok: false; reason: "id_mancante" | "record_non_trovato" | "shape_non_supportata" };

type UnwrappedSegnalazioni = {
  items: RawRecord[];
  rebuild: (items: RawRecord[]) => unknown;
};

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeNullableText(value: unknown): string | null {
  const text = normalizeText(value);
  return text || null;
}

function normalizeTarga(value: unknown): string | null {
  const targa = normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  return targa || null;
}

function unwrapSegnalazioni(raw: unknown): UnwrappedSegnalazioni | null {
  if (Array.isArray(raw)) {
    return {
      items: raw.filter(isRecord),
      rebuild: (items) => items,
    };
  }

  if (!isRecord(raw)) {
    return {
      items: [],
      rebuild: (items) => items,
    };
  }

  if (Array.isArray(raw.value)) {
    return {
      items: raw.value.filter(isRecord),
      rebuild: (items) => ({ ...raw, value: items }),
    };
  }

  if (Array.isArray(raw.items)) {
    return {
      items: raw.items.filter(isRecord),
      rebuild: (items) => ({ ...raw, items }),
    };
  }

  if (isRecord(raw.value)) {
    const nested = raw.value;
    if (!Array.isArray(nested.items)) return null;
    return {
      items: nested.items.filter(isRecord),
      rebuild: (items) => ({ ...raw, value: { ...nested, items } }),
    };
  }

  return null;
}

function assignTextPatch(
  target: RawRecord,
  patch: NextHomeSegnalazioneAdminPatch,
  key: keyof NextHomeSegnalazioneAdminPatch,
  targetKey: string = key,
): void {
  if (!(key in patch)) return;
  target[targetKey] = normalizeNullableText(patch[key]);
}

function buildPatch(original: RawRecord, next: RawRecord): Record<string, { from: unknown; to: unknown }> {
  const patch: Record<string, { from: unknown; to: unknown }> = {};
  const fields = [
    "autistaNome",
    "badgeAutista",
    "targaCamion",
    "targaMotrice",
    "targaRimorchio",
    "targa",
    "ambito",
    "target",
    "tipoProblema",
    "descrizione",
    "note",
    "stato",
    "letta",
    "flagVerifica",
    "motivoVerifica",
    "foto",
  ];

  fields.forEach((field) => {
    if (original[field] !== next[field]) {
      patch[field] = { from: original[field] ?? null, to: next[field] ?? null };
    }
  });

  return patch;
}

function applySegnalazionePatch(
  original: RawRecord,
  patch: NextHomeSegnalazioneAdminPatch,
): { next: RawRecord; changed: boolean } {
  const next: RawRecord = { ...original };

  assignTextPatch(next, patch, "autistaNome");
  assignTextPatch(next, patch, "badgeAutista");
  if ("targaCamion" in patch) {
    const targaCamion = normalizeTarga(patch.targaCamion);
    next.targaCamion = targaCamion;
    next.targaMotrice = targaCamion;
  }
  if ("targaRimorchio" in patch) next.targaRimorchio = normalizeTarga(patch.targaRimorchio);
  if ("targa" in patch) next.targa = normalizeTarga(patch.targa);
  if ("ambito" in patch) {
    const ambito = normalizeNullableText(patch.ambito);
    next.ambito = ambito;
    next.target = ambito;
  }
  assignTextPatch(next, patch, "tipoProblema");
  assignTextPatch(next, patch, "descrizione");
  assignTextPatch(next, patch, "note");
  assignTextPatch(next, patch, "stato");
  if ("letta" in patch && patch.letta !== null) next.letta = patch.letta === true;
  if ("flagVerifica" in patch && patch.flagVerifica !== null) {
    next.flagVerifica = patch.flagVerifica === true;
  }
  assignTextPatch(next, patch, "motivoVerifica");
  if ("foto" in patch && Array.isArray(patch.foto)) next.foto = patch.foto;

  const adminPatch = buildPatch(original, next);
  const changed = Object.keys(adminPatch).length > 0;
  next.adminEdit = {
    ...(isRecord(original.adminEdit) ? original.adminEdit : {}),
    edited: true,
    editedAt: Date.now(),
    editedBy: "admin",
    note: normalizeNullableText(patch.adminNote),
    patch: adminPatch,
  };

  return { next, changed };
}

export async function updateNextHomeSegnalazioneAdmin(
  patch: NextHomeSegnalazioneAdminPatch,
): Promise<NextHomeSegnalazioneAdminResult> {
  const id = normalizeText(patch.id);
  if (!id) return { ok: false, reason: "id_mancante" };

  const raw = await getItemSync(SEGNALAZIONI_KEY);
  const unwrapped = unwrapSegnalazioni(raw);
  if (!unwrapped) return { ok: false, reason: "shape_non_supportata" };

  const index = unwrapped.items.findIndex((record) => normalizeText(record.id) === id);
  if (index < 0) return { ok: false, reason: "record_non_trovato" };

  const nextItems = unwrapped.items.slice();
  const result = applySegnalazionePatch(nextItems[index], patch);
  nextItems[index] = result.next;

  await runWithCloneWriteScopedAllowance(NEXT_HOME_SEGNALAZIONI_ADMIN_WRITE_SCOPE, () =>
    setItemSync(SEGNALAZIONI_KEY, unwrapped.rebuild(nextItems)),
  );

  return { ok: true, recordId: id, changed: result.changed };
}
