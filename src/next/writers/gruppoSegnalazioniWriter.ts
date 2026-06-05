import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  assertCloneWriteAllowed,
  CloneWriteBlockedError,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";

export const GRUPPO_SEGNALAZIONI_WRITE_SCOPE = "next_gruppo_segnalazioni_write_scope";

const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";

type RawRecord = Record<string, unknown>;

export type GruppoSegnalazioniResult = {
  ok: boolean;
  error?: string;
  gruppoId?: string;
  segnalazioneIds?: string[];
  updated?: number;
};

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items.filter(isRecord);
  return [];
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeTarga(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeIds(ids: readonly string[]): string[] {
  return Array.from(new Set(ids.map((id) => normalizeText(id)).filter(Boolean)));
}

function recordId(record: RawRecord): string {
  return normalizeText(record.id);
}

function recordTarga(record: RawRecord): string {
  return (
    normalizeTarga(record.targa) ||
    normalizeTarga(record.targaCamion) ||
    normalizeTarga(record.targaMotrice) ||
    normalizeTarga(record.targaRimorchio)
  );
}

function recordGruppoId(record: RawRecord): string | null {
  return normalizeText(record.gruppoSegnalazioneId) || null;
}

function isRecordChiusa(record: RawRecord): boolean {
  return (
    record.chiusa === true ||
    normalizeText(record.stato).toLowerCase() === "chiusa" ||
    Boolean(normalizeText(record.chiusuraRefId)) ||
    Boolean(normalizeText(record.chiusuraData))
  );
}

function hasLinkedLavoro(record: RawRecord): boolean {
  if (normalizeText(record.linkedLavoroId)) return true;
  if (!Array.isArray(record.linkedLavoroIds)) return false;
  return record.linkedLavoroIds.some((entry) => Boolean(normalizeText(entry)));
}

function generateGruppoId(): string {
  const cryptoRef: Crypto | undefined =
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
      ? (globalThis.crypto as Crypto)
      : undefined;
  if (cryptoRef) return cryptoRef.randomUUID();
  return `gruppo_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function blockedResult(error: unknown): GruppoSegnalazioniResult {
  if (error instanceof CloneWriteBlockedError) {
    return {
      ok: false,
      error:
        "Scrittura bloccata dal barrier clone (gruppo segnalazioni). Verificare che la pagina sia nel perimetro autorizzato.",
    };
  }
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Errore gruppo segnalazioni.",
  };
}

function assertSelectedRecords(args: {
  list: RawRecord[];
  ids: string[];
  allowExistingGroupId?: string | null;
  requireNoGroup?: boolean;
}): { ok: true; records: RawRecord[]; targa: string } | { ok: false; error: string } {
  if (args.ids.length === 0) return { ok: false, error: "Seleziona almeno una segnalazione." };
  const byId = new Map(args.list.map((record) => [recordId(record), record] as const));
  const records: RawRecord[] = [];
  for (const id of args.ids) {
    const record = byId.get(id);
    if (!record) return { ok: false, error: `Segnalazione non trovata: ${id}` };
    records.push(record);
  }

  let targa = "";
  for (const record of records) {
    const id = recordId(record);
    const recordTargaValue = recordTarga(record);
    if (!recordTargaValue) return { ok: false, error: `Targa mancante sulla segnalazione ${id}.` };
    if (!targa) targa = recordTargaValue;
    if (recordTargaValue !== targa) {
      return { ok: false, error: "Le segnalazioni selezionate devono avere la stessa targa." };
    }
    if (isRecordChiusa(record)) return { ok: false, error: `Segnalazione chiusa: ${id}` };
    if (hasLinkedLavoro(record)) return { ok: false, error: `Segnalazione gia collegata: ${id}` };
    const groupId = recordGruppoId(record);
    if (args.requireNoGroup && groupId) {
      return { ok: false, error: `Segnalazione gia in un gruppo: ${id}` };
    }
    if (args.allowExistingGroupId && groupId && groupId !== args.allowExistingGroupId) {
      return { ok: false, error: `Segnalazione gia in un altro gruppo: ${id}` };
    }
  }
  return { ok: true, records, targa };
}

async function writeSegnalazioniList(
  nextList: RawRecord[],
  result: GruppoSegnalazioniResult,
): Promise<GruppoSegnalazioniResult> {
  assertCloneWriteAllowed("storageSync.setItemSync", { key: SEGNALAZIONI_KEY });
  await setItemSync(SEGNALAZIONI_KEY, nextList);
  return result;
}

export async function creaGruppoSegnalazioni(
  segnalazioneIds: string[],
): Promise<GruppoSegnalazioniResult> {
  const ids = normalizeIds(segnalazioneIds);
  try {
    return await runWithCloneWriteScopedAllowance(GRUPPO_SEGNALAZIONI_WRITE_SCOPE, async () => {
      const list = unwrapList(await getItemSync(SEGNALAZIONI_KEY));
      const validation = assertSelectedRecords({ list, ids, requireNoGroup: true });
      if (!validation.ok) return validation;
      const gruppoId = generateGruppoId();
      const selected = new Set(ids);
      const nextList = list.map((record) =>
        selected.has(recordId(record)) ? { ...record, gruppoSegnalazioneId: gruppoId } : record,
      );
      return writeSegnalazioniList(nextList, {
        ok: true,
        gruppoId,
        segnalazioneIds: ids,
        updated: ids.length,
      });
    });
  } catch (error) {
    return blockedResult(error);
  }
}

export async function aggiungiAGruppo(
  gruppoIdInput: string,
  segnalazioneIds: string[],
): Promise<GruppoSegnalazioniResult> {
  const gruppoId = normalizeText(gruppoIdInput);
  const ids = normalizeIds(segnalazioneIds);
  if (!gruppoId) return { ok: false, error: "ID gruppo mancante." };
  try {
    return await runWithCloneWriteScopedAllowance(GRUPPO_SEGNALAZIONI_WRITE_SCOPE, async () => {
      const list = unwrapList(await getItemSync(SEGNALAZIONI_KEY));
      const groupRecords = list.filter((record) => recordGruppoId(record) === gruppoId);
      if (groupRecords.length === 0) return { ok: false, error: "Gruppo non trovato." };
      const groupTarga = recordTarga(groupRecords[0]);
      if (!groupTarga) return { ok: false, error: "Targa gruppo non disponibile." };
      if (groupRecords.some((record) => recordTarga(record) !== groupTarga)) {
        return { ok: false, error: "Gruppo con targhe incoerenti." };
      }

      const validation = assertSelectedRecords({ list, ids, requireNoGroup: true });
      if (!validation.ok) return validation;
      if (validation.targa !== groupTarga) {
        return { ok: false, error: "La segnalazione da aggiungere deve avere la stessa targa del gruppo." };
      }
      const selected = new Set(ids);
      const nextList = list.map((record) =>
        selected.has(recordId(record)) ? { ...record, gruppoSegnalazioneId: gruppoId } : record,
      );
      return writeSegnalazioniList(nextList, {
        ok: true,
        gruppoId,
        segnalazioneIds: ids,
        updated: ids.length,
      });
    });
  } catch (error) {
    return blockedResult(error);
  }
}

export async function rimuoviDaGruppo(
  segnalazioneIds: string[],
): Promise<GruppoSegnalazioniResult> {
  const ids = normalizeIds(segnalazioneIds);
  if (ids.length === 0) return { ok: false, error: "Seleziona almeno una segnalazione." };
  try {
    return await runWithCloneWriteScopedAllowance(GRUPPO_SEGNALAZIONI_WRITE_SCOPE, async () => {
      const list = unwrapList(await getItemSync(SEGNALAZIONI_KEY));
      const byId = new Map(list.map((record) => [recordId(record), record] as const));
      for (const id of ids) {
        if (!byId.has(id)) return { ok: false, error: `Segnalazione non trovata: ${id}` };
      }
      const selected = new Set(ids);
      const nextList = list.map((record) =>
        selected.has(recordId(record)) ? { ...record, gruppoSegnalazioneId: null } : record,
      );
      return writeSegnalazioniList(nextList, {
        ok: true,
        segnalazioneIds: ids,
        updated: ids.length,
      });
    });
  } catch (error) {
    return blockedResult(error);
  }
}
