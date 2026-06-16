import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  NEXT_HOME_LUOGO_MEZZO_WRITE_SCOPE,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";

const EVENTI_KEY = "@storico_eventi_operativi";

type RawRecord = Record<string, unknown>;

export type NextHomeLuogoMezzoAssetKind = "rimorchio" | "motrice_o_trattore";

export type SaveNextHomeLuogoMezzoInput = {
  targa: string;
  luogo: string;
  assetKind: NextHomeLuogoMezzoAssetKind;
  eventId?: string | null;
  eventIndex?: number | null;
};

export type SaveNextHomeLuogoMezzoResult =
  | { ok: true; mode: "updated" | "created"; recordId: string | null }
  | { ok: false; reason: "targa_mancante" | "luogo_mancante" | "shape_non_supportata" };

type UnwrappedEventi = {
  items: RawRecord[];
  rebuild: (items: RawRecord[]) => unknown;
};

function normalizeTarga(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function unwrapEventi(raw: unknown): UnwrappedEventi | null {
  if (Array.isArray(raw)) {
    return {
      items: raw.filter((entry): entry is RawRecord => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry)),
      rebuild: (items) => items,
    };
  }

  if (!raw || typeof raw !== "object") {
    return {
      items: [],
      rebuild: (items) => items,
    };
  }

  const record = raw as RawRecord;
  if (Array.isArray(record.value)) {
    return {
      items: record.value.filter((entry): entry is RawRecord => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry)),
      rebuild: (items) => ({ ...record, value: items }),
    };
  }

  if (Array.isArray(record.items)) {
    return {
      items: record.items.filter((entry): entry is RawRecord => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry)),
      rebuild: (items) => ({ ...record, items }),
    };
  }

  if (record.value && typeof record.value === "object" && !Array.isArray(record.value)) {
    const nested = record.value as RawRecord;
    if (Array.isArray(nested.items)) {
      return {
        items: nested.items.filter((entry): entry is RawRecord => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry)),
        rebuild: (items) => ({ ...record, value: { ...nested, items } }),
      };
    }
  }

  return null;
}

function findEventIndex(items: RawRecord[], eventId: string | null, eventIndex: number | null): number {
  if (eventId) {
    const byId = items.findIndex((entry) => normalizeText(entry.id) === eventId);
    if (byId >= 0) return byId;
  }

  if (Number.isInteger(eventIndex) && eventIndex !== null && eventIndex >= 0 && eventIndex < items.length) {
    return eventIndex;
  }

  return -1;
}

function buildAdminAssetEvent(args: {
  targa: string;
  luogo: string;
  assetKind: NextHomeLuogoMezzoAssetKind;
}): RawRecord {
  const now = Date.now();
  const isRimorchio = args.assetKind === "rimorchio";
  const assetto = isRimorchio
    ? {
        targaRimorchio: args.targa,
        rimorchio: args.targa,
        targaMotrice: null,
        motrice: null,
        targaCamion: null,
      }
    : {
        targaRimorchio: null,
        rimorchio: null,
        targaMotrice: args.targa,
        motrice: args.targa,
        targaCamion: args.targa,
      };

  return {
    id: `CAMBIO_ASSETTO-ADMIN-${now}-${args.targa}`,
    tipo: "CAMBIO_ASSETTO",
    timestamp: now,
    badgeAutista: "ADMIN",
    autistaNome: "UFFICIO",
    luogo: args.luogo,
    prima: { ...assetto },
    dopo: { ...assetto },
    source: "Home NEXT",
  };
}

export async function saveNextHomeLuogoMezzo(
  input: SaveNextHomeLuogoMezzoInput,
): Promise<SaveNextHomeLuogoMezzoResult> {
  const targa = normalizeTarga(input.targa);
  if (!targa) return { ok: false, reason: "targa_mancante" };

  const luogo = normalizeText(input.luogo);
  if (!luogo) return { ok: false, reason: "luogo_mancante" };

  const raw = await getItemSync(EVENTI_KEY);
  const unwrapped = unwrapEventi(raw);
  if (!unwrapped) return { ok: false, reason: "shape_non_supportata" };

  const nextItems = unwrapped.items.slice();
  const eventId = normalizeText(input.eventId) || null;
  const eventIndex =
    typeof input.eventIndex === "number" && Number.isInteger(input.eventIndex)
      ? input.eventIndex
      : null;
  const existingIndex = findEventIndex(nextItems, eventId, eventIndex);

  if (existingIndex >= 0) {
    const existing = nextItems[existingIndex] ?? {};
    nextItems[existingIndex] = {
      ...existing,
      luogo,
    };
    const recordId = normalizeText(existing.id) || eventId;
    await runWithCloneWriteScopedAllowance(NEXT_HOME_LUOGO_MEZZO_WRITE_SCOPE, () =>
      setItemSync(EVENTI_KEY, unwrapped.rebuild(nextItems)),
    );
    return { ok: true, mode: "updated", recordId };
  }

  const created = buildAdminAssetEvent({ targa, luogo, assetKind: input.assetKind });
  nextItems.push(created);
  await runWithCloneWriteScopedAllowance(NEXT_HOME_LUOGO_MEZZO_WRITE_SCOPE, () =>
    setItemSync(EVENTI_KEY, unwrapped.rebuild(nextItems)),
  );
  return { ok: true, mode: "created", recordId: normalizeText(created.id) };
}
