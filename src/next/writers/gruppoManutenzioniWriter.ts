import { getItemSync, setItemSync } from "../../utils/storageSync";
import { assertCloneWriteAllowed, CloneWriteBlockedError } from "../../utils/cloneWriteBarrier";

const MANUTENZIONI_KEY = "@manutenzioni";
const GRUPPO_FIELD = "gruppoManutenzioneId";

type RawRecord = Record<string, unknown>;

export type GruppoManutenzioniResult = {
  ok: boolean;
  error?: string;
  gruppoId?: string;
  manutenzioneIds?: string[];
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
  return Array.from(new Set(ids.map((id) => normalizeText(id))));
}

function recordId(record: RawRecord): string {
  return normalizeText(record.id);
}

function hasRealRecordId(record: RawRecord): boolean {
  const id = recordId(record);
  return Boolean(id) && !id.startsWith("manutenzione:");
}

function recordTarga(record: RawRecord): string {
  return (
    normalizeTarga(record.targa) ||
    normalizeTarga(record.targaCamion) ||
    normalizeTarga(record.targaMotrice) ||
    normalizeTarga(record.targaRimorchio)
  );
}

function recordStato(record: RawRecord): string {
  return normalizeText(record.stato);
}

function recordGruppoId(record: RawRecord): string | null {
  return normalizeText(record[GRUPPO_FIELD]) || null;
}

function generateGruppoId(): string {
  const cryptoRef: Crypto | undefined =
    typeof globalThis !== "undefined" &&
    "crypto" in globalThis &&
    globalThis.crypto
      ? (globalThis.crypto as Crypto)
      : undefined;
  if (cryptoRef && typeof cryptoRef.randomUUID === "function") return cryptoRef.randomUUID();
  if (cryptoRef && typeof cryptoRef.getRandomValues === "function") {
    const bytes = cryptoRef.getRandomValues(new Uint8Array(16));
    return `gruppo_manutenzioni_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  }
  return `gruppo_manutenzioni_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
}

function blockedResult(error: unknown): GruppoManutenzioniResult {
  if (error instanceof CloneWriteBlockedError) {
    return {
      ok: false,
      error:
        "Scrittura bloccata dal barrier clone (gruppo manutenzioni). Verificare che la pagina sia nel perimetro autorizzato.",
    };
  }
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Errore gruppo manutenzioni.",
  };
}

function assertSelectedRecords(args: {
  list: RawRecord[];
  ids: string[];
  requireMinTwo?: boolean;
  requireNoGroup?: boolean;
}): { ok: true; records: RawRecord[]; targa: string } | { ok: false; error: string } {
  if (args.ids.length === 0) return { ok: false, error: "Seleziona almeno una manutenzione." };
  if (args.requireMinTwo && args.ids.length < 2) {
    return { ok: false, error: "Seleziona almeno due manutenzioni da fare." };
  }

  const byId = new Map(args.list.map((record) => [recordId(record), record] as const));
  const records: RawRecord[] = [];
  for (const id of args.ids) {
    const record = byId.get(id);
    if (!record) return { ok: false, error: `Manutenzione non trovata: ${id}` };
    records.push(record);
  }

  let targa = "";
  for (const record of records) {
    const id = recordId(record);
    if (!hasRealRecordId(record)) return { ok: false, error: `ID manutenzione reale mancante: ${id || "(senza id)"}` };
    const stato = recordStato(record);
    if (stato !== "daFare") {
      return {
        ok: false,
        error:
          "Questa manutenzione non è «Da fare» e non si può raggruppare. Per legarla allo stesso problema (anche se è già chiusa) usa il comando «Collega…».",
      };
    }
    const recordTargaValue = recordTarga(record);
    if (!recordTargaValue) return { ok: false, error: `Targa mancante sulla manutenzione ${id}.` };
    if (!targa) targa = recordTargaValue;
    if (recordTargaValue !== targa) {
      return { ok: false, error: "Le manutenzioni selezionate devono avere la stessa targa." };
    }
    const groupId = recordGruppoId(record);
    if (args.requireNoGroup && groupId) {
      return { ok: false, error: `Manutenzione gia in un gruppo: ${id}` };
    }
  }
  return { ok: true, records, targa };
}

function assertGroupTarget(
  list: RawRecord[],
  gruppoId: string,
): { ok: true; targa: string } | { ok: false; error: string } {
  const groupRecords = list.filter((record) => recordGruppoId(record) === gruppoId);
  if (groupRecords.length === 0) return { ok: false, error: "Gruppo non trovato." };

  let groupTarga = "";
  for (const record of groupRecords) {
    const id = recordId(record);
    if (!hasRealRecordId(record)) return { ok: false, error: `ID manutenzione reale mancante nel gruppo: ${id || "(senza id)"}` };
    const stato = recordStato(record);
    if (stato !== "daFare") {
      return {
        ok: false,
        error:
          "Il gruppo contiene una manutenzione già chiusa: il raggruppamento vale solo per i lavori «Da fare». Per legare manutenzioni di stati diversi usa il comando «Collega…».",
      };
    }
    const targa = recordTarga(record);
    if (!targa) return { ok: false, error: "Targa gruppo non disponibile." };
    if (!groupTarga) groupTarga = targa;
    if (targa !== groupTarga) {
      return { ok: false, error: "Gruppo target incoerente: contiene targhe diverse." };
    }
  }

  return { ok: true, targa: groupTarga };
}

async function verifyPostWrite(
  expected: Map<string, string | null>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const afterList = unwrapList(await getItemSync(MANUTENZIONI_KEY));
  const byId = new Map(afterList.map((record) => [recordId(record), record] as const));

  for (const [id, expectedGroupId] of expected) {
    const record = byId.get(id);
    if (!record) return { ok: false, error: `Verifica post-write fallita: manutenzione non riletta ${id}.` };
    const actualGroupId = recordGruppoId(record);
    if (actualGroupId !== expectedGroupId) {
      return { ok: false, error: "Verifica post-write fallita: gruppo manutenzione non persistito." };
    }
  }

  return { ok: true };
}

async function writeManutenzioniList(
  nextList: RawRecord[],
  result: GruppoManutenzioniResult,
  expected: Map<string, string | null>,
): Promise<GruppoManutenzioniResult> {
  assertCloneWriteAllowed("storageSync.setItemSync", { key: MANUTENZIONI_KEY });
  await setItemSync(MANUTENZIONI_KEY, nextList);
  const verified = await verifyPostWrite(expected);
  if (!verified.ok) return verified;
  return result;
}

export async function creaGruppoManutenzioni(
  manutenzioneIds: string[],
): Promise<GruppoManutenzioniResult> {
  const ids = normalizeIds(manutenzioneIds);
  try {
    const list = unwrapList(await getItemSync(MANUTENZIONI_KEY));
    const validation = assertSelectedRecords({ list, ids, requireMinTwo: true, requireNoGroup: true });
    if (!validation.ok) return validation;
    const gruppoId = generateGruppoId();
    const selected = new Set(ids);
    const nextList = list.map((record) =>
      selected.has(recordId(record)) ? { ...record, [GRUPPO_FIELD]: gruppoId } : record,
    );
    return writeManutenzioniList(
      nextList,
      {
        ok: true,
        gruppoId,
        manutenzioneIds: ids,
        updated: ids.length,
      },
      new Map(ids.map((id) => [id, gruppoId] as const)),
    );
  } catch (error) {
    return blockedResult(error);
  }
}

export async function aggiungiAGruppoManutenzioni(
  gruppoIdInput: string,
  manutenzioneIds: string[],
): Promise<GruppoManutenzioniResult> {
  const gruppoId = normalizeText(gruppoIdInput);
  const ids = normalizeIds(manutenzioneIds);
  if (!gruppoId) return { ok: false, error: "ID gruppo mancante." };
  try {
    const list = unwrapList(await getItemSync(MANUTENZIONI_KEY));
    const groupValidation = assertGroupTarget(list, gruppoId);
    if (!groupValidation.ok) return groupValidation;
    const validation = assertSelectedRecords({ list, ids, requireNoGroup: true });
    if (!validation.ok) return validation;
    if (validation.targa !== groupValidation.targa) {
      return { ok: false, error: "La manutenzione da aggiungere deve avere la stessa targa del gruppo." };
    }

    const selected = new Set(ids);
    const nextList = list.map((record) =>
      selected.has(recordId(record)) ? { ...record, [GRUPPO_FIELD]: gruppoId } : record,
    );
    return writeManutenzioniList(
      nextList,
      {
        ok: true,
        gruppoId,
        manutenzioneIds: ids,
        updated: ids.length,
      },
      new Map(ids.map((id) => [id, gruppoId] as const)),
    );
  } catch (error) {
    return blockedResult(error);
  }
}

export async function rimuoviDaGruppoManutenzioni(
  manutenzioneIds: string[],
): Promise<GruppoManutenzioniResult> {
  const ids = normalizeIds(manutenzioneIds);
  if (ids.length === 0) return { ok: false, error: "Seleziona almeno una manutenzione." };
  try {
    const list = unwrapList(await getItemSync(MANUTENZIONI_KEY));
    const byId = new Map(list.map((record) => [recordId(record), record] as const));
    for (const id of ids) {
      const record = byId.get(id);
      if (!record) return { ok: false, error: `Manutenzione non trovata: ${id}` };
      if (!hasRealRecordId(record)) return { ok: false, error: `ID manutenzione reale mancante: ${id || "(senza id)"}` };
      if (!recordGruppoId(record)) return { ok: false, error: `Manutenzione non in gruppo: ${id}` };
    }

    const selected = new Set(ids);
    const nextList = list.map((record) =>
      selected.has(recordId(record)) ? { ...record, [GRUPPO_FIELD]: null } : record,
    );
    return writeManutenzioniList(
      nextList,
      {
        ok: true,
        manutenzioneIds: ids,
        updated: ids.length,
      },
      new Map(ids.map((id) => [id, null] as const)),
    );
  } catch (error) {
    return blockedResult(error);
  }
}
