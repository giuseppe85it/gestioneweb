// Writer delle scadenze di manutenzione (storage/@manutenzioni_scadenze).
//
// Modello: nextScadenzeCollaudiWriter.ts. Tutte le scritture passano per la
// write-barrier (runWithCloneWriteScopedAllowance), come ogni writer NEXT.
//
// TIMESTAMP-MAI-DA-CLICK: le date di business (ultima esecuzione, prossima scadenza
// manuale) provengono dal payload del form (input utente) e vengono solo normalizzate a
// ISO; non vengono mai generate da Date.now(). `updatedAt` e l'`id` di un nuovo record
// sono gli unici usi ammessi di Date.now() (audit-stamp / identità tecnica).

import { runWithCloneWriteScopedAllowance } from "../utils/cloneWriteBarrier";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { fromUserInput, toISO } from "./helpers/dateUnica";
import {
  MANUTENZIONI_SCADENZE_KEY,
  type NextManutenzioneScadenzaRecord,
  type ScadenzaBase,
} from "./domain/nextManutenzioniScadenzeDomain";

export const MANUTENZIONI_SCADENZE_WRITE_SCOPE = "manutenzioni_scadenze_write_scope";

const BASI_VALIDE: ScadenzaBase[] = ["tempo", "km", "ore"];

export type ScadenzaManutenzionePayload = {
  id?: string | null;
  targa: string;
  tipo: string;
  label: string;
  base: ScadenzaBase[];
  intervalloMesi?: number | null;
  intervalloKm?: number | null;
  intervalloOre?: number | null;
  ultimaEsecuzioneData?: string | null;
  ultimaEsecuzioneKm?: number | null;
  ultimaEsecuzioneOre?: number | null;
  prossimaScadenzaDataManuale?: string | null;
  prossimaScadenzaKmManuale?: number | null;
  prossimaScadenzaOreManuale?: number | null;
  note?: string | null;
  assente?: boolean;
  attiva?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value;
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items;
  if (isRecord(raw) && isRecord(raw.value) && Array.isArray(raw.value.items)) {
    return raw.value.items;
  }
  return [];
}

async function readRecords(): Promise<NextManutenzioneScadenzaRecord[]> {
  const raw = await getItemSync(MANUTENZIONI_SCADENZE_KEY);
  return unwrapArray(raw).filter((entry): entry is NextManutenzioneScadenzaRecord =>
    isRecord(entry),
  );
}

async function writeRecords(records: NextManutenzioneScadenzaRecord[]): Promise<void> {
  await runWithCloneWriteScopedAllowance(MANUTENZIONI_SCADENZE_WRITE_SCOPE, () =>
    setItemSync(MANUTENZIONI_SCADENZE_KEY, records),
  );
}

function normalizeTarga(targa: string): string {
  return String(targa ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

// Date di business: normalizzate a ISO dall'input utente. Mai da Date.now().
function normalizeDateForStorage(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  return fromUserInput(raw) ?? toISO(raw);
}

function normalizeNumber(value: number | null | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = (value as string).trim().replace(",", ".");
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeBase(raw: ScadenzaBase[] | undefined): ScadenzaBase[] {
  if (!Array.isArray(raw)) return [];
  const out: ScadenzaBase[] = [];
  for (const entry of raw) {
    if (BASI_VALIDE.includes(entry) && !out.includes(entry)) out.push(entry);
  }
  return out;
}

function generateId(): string {
  // Identità tecnica del record, non una data di business.
  return `scad-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Costruisce il record finale dal payload (niente chiavi undefined: solo valori o null).
function buildRecord(
  payload: ScadenzaManutenzionePayload,
  id: string,
  now: number,
): NextManutenzioneScadenzaRecord {
  return {
    id,
    targa: normalizeTarga(payload.targa),
    tipo: String(payload.tipo ?? "").trim() || "altro",
    label: String(payload.label ?? "").trim() || "Scadenza",
    base: normalizeBase(payload.base),
    intervalloMesi: normalizeNumber(payload.intervalloMesi),
    intervalloKm: normalizeNumber(payload.intervalloKm),
    intervalloOre: normalizeNumber(payload.intervalloOre),
    ultimaEsecuzioneData: normalizeDateForStorage(payload.ultimaEsecuzioneData),
    ultimaEsecuzioneKm: normalizeNumber(payload.ultimaEsecuzioneKm),
    ultimaEsecuzioneOre: normalizeNumber(payload.ultimaEsecuzioneOre),
    prossimaScadenzaDataManuale: normalizeDateForStorage(payload.prossimaScadenzaDataManuale),
    prossimaScadenzaKmManuale: normalizeNumber(payload.prossimaScadenzaKmManuale),
    prossimaScadenzaOreManuale: normalizeNumber(payload.prossimaScadenzaOreManuale),
    note: String(payload.note ?? "").trim() || null,
    assente: payload.assente === true,
    attiva: payload.attiva !== false,
    updatedAt: now,
  };
}

/**
 * Crea o aggiorna una scadenza. Se `payload.id` corrisponde a un record esistente, lo
 * aggiorna in-place (stesso id); altrimenti crea un nuovo record. Restituisce il record salvato.
 */
export async function saveScadenzaManutenzione(
  payload: ScadenzaManutenzionePayload,
): Promise<NextManutenzioneScadenzaRecord> {
  const targa = normalizeTarga(payload.targa);
  if (!targa) {
    throw new Error("Targa mancante.");
  }
  const base = normalizeBase(payload.base);
  // Una voce marcata "assente" non calcola scadenze: la base non è richiesta.
  if (base.length === 0 && payload.assente !== true) {
    throw new Error("Seleziona almeno una base (tempo, km o ore).");
  }

  const records = await readRecords();
  const existingId = String(payload.id ?? "").trim();
  const targetIndex = existingId
    ? records.findIndex((record) => String(record.id ?? "").trim() === existingId)
    : -1;

  const id = targetIndex >= 0 ? existingId : generateId();
  const record = buildRecord({ ...payload, base }, id, Date.now());

  const nextRecords = [...records];
  if (targetIndex >= 0) {
    nextRecords[targetIndex] = record;
  } else {
    nextRecords.push(record);
  }

  await writeRecords(nextRecords);
  return record;
}

/** Elimina una scadenza per id. Restituisce true se il record esisteva. */
export async function deleteScadenzaManutenzione(id: string): Promise<boolean> {
  const target = String(id ?? "").trim();
  if (!target) {
    throw new Error("Id scadenza mancante.");
  }
  const records = await readRecords();
  const nextRecords = records.filter((record) => String(record.id ?? "").trim() !== target);
  if (nextRecords.length === records.length) {
    return false;
  }
  await writeRecords(nextRecords);
  return true;
}
