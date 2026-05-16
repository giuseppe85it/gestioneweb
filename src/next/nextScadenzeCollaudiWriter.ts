import { runWithCloneWriteScopedAllowance } from "../utils/cloneWriteBarrier";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { parseAnyDate, toDisplay, toISO } from "./helpers/dateUnica";

const MEZZI_KEY = "@mezzi_aziendali";
const SCADENZE_COLLAUDI_WRITE_SCOPE = "scadenze_collaudi_write_scope";

export type PrenotazioneCollaudoPayload = {
  data: string;
  ora: string;
  luogo?: string;
  note?: string;
};

export type PreCollaudoPayload = {
  data: string;
  officina: string;
  lavoriPrevisti?: string;
};

export type RevisioneCompletataPayload = {
  data: string;
  esito: string;
  note?: string;
};

type PrenotazioneCollaudoRecord = {
  data?: string;
  ora?: string;
  luogo?: string;
  note?: string;
  completata?: boolean;
  completataIl?: string;
  esito?: string;
  noteEsito?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapMezziArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value;
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items;
  throw new Error("Dataset mezzi non trovato o in formato non valido.");
}

async function readMezziRecords(): Promise<unknown[]> {
  const raw = await getItemSync(MEZZI_KEY);
  return unwrapMezziArray(raw);
}

function normalizeTarga(targa: string): string {
  return String(targa ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

function findMezzoIndexByTarga(records: unknown[], targa: string): number {
  const key = normalizeTarga(targa);
  if (!key) return -1;
  return records.findIndex(
    (record) => isRecord(record) && normalizeTarga(String(record.targa ?? "")) === key,
  );
}

async function writeMezziRecords(records: unknown[]): Promise<void> {
  await runWithCloneWriteScopedAllowance(SCADENZE_COLLAUDI_WRITE_SCOPE, () =>
    setItemSync(MEZZI_KEY, records),
  );
}

function assertTarga(targa: string): string {
  const normalized = String(targa ?? "").trim();
  if (!normalized) {
    throw new Error("Targa mancante.");
  }
  return normalized;
}

function parseDateFlexible(value: string): Date | null {
  return parseAnyDate(value);
}

function formatDateForInput(date: Date): string {
  return toISO(date) ?? "";
}

function formatDateForDisplay(date: Date): string {
  return toDisplay(date) || "";
}

export async function setPrenotazioneCollaudo(
  targa: string,
  payload: PrenotazioneCollaudoPayload | null,
): Promise<void> {
  const normalizedTarga = assertTarga(targa);
  const records = await readMezziRecords();
  const targetIndex = findMezzoIndexByTarga(records, normalizedTarga);

  if (targetIndex < 0) {
    throw new Error("Mezzo non trovato.");
  }

  const current = records[targetIndex];
  if (!isRecord(current)) {
    throw new Error("Record mezzo non valido.");
  }

  let nextPrenotazione: PrenotazioneCollaudoRecord | null;
  if (payload === null) {
    nextPrenotazione = null;
  } else {
    nextPrenotazione = {
      data: payload.data,
      ora: payload.ora,
      ...(payload.luogo ? { luogo: payload.luogo } : {}),
      ...(payload.note ? { note: payload.note } : {}),
    };
  }

  const updated = { ...current, prenotazioneCollaudo: nextPrenotazione };
  const nextRecords = [...records];
  nextRecords[targetIndex] = updated;

  await writeMezziRecords(nextRecords);
}

export async function setPreCollaudo(
  targa: string,
  payload: PreCollaudoPayload,
): Promise<void> {
  const normalizedTarga = assertTarga(targa);
  const records = await readMezziRecords();
  const targetIndex = findMezzoIndexByTarga(records, normalizedTarga);

  if (targetIndex < 0) {
    throw new Error("Mezzo non trovato.");
  }

  const current = records[targetIndex];
  if (!isRecord(current)) {
    throw new Error("Record mezzo non valido.");
  }

  const lavoriPrevisti = String(payload.lavoriPrevisti ?? "").trim();
  const updated = {
    ...current,
    preCollaudo: {
      data: payload.data,
      officina: payload.officina,
      ...(lavoriPrevisti ? { lavoriPrevisti } : {}),
    },
  };
  const nextRecords = [...records];
  nextRecords[targetIndex] = updated;

  await writeMezziRecords(nextRecords);
}

export async function markRevisioneCompletata(
  targa: string,
  payload: RevisioneCompletataPayload,
): Promise<void> {
  const normalizedTarga = assertTarga(targa);
  const records = await readMezziRecords();
  const targetIndex = findMezzoIndexByTarga(records, normalizedTarga);

  if (targetIndex < 0) {
    throw new Error("Mezzo non trovato.");
  }

  const current = records[targetIndex];
  if (!isRecord(current)) {
    throw new Error("Record mezzo non valido.");
  }

  const parsedDate = parseDateFlexible(payload.data);
  if (!parsedDate) {
    throw new Error("Data revisione non valida.");
  }

  const revisioneDateValue = formatDateForInput(parsedDate);
  const revisioneDateLabel = formatDateForDisplay(parsedDate);
  const scadenzaDate = new Date(parsedDate);
  scadenzaDate.setHours(12, 0, 0, 0);
  scadenzaDate.setFullYear(scadenzaDate.getFullYear() + 1);
  const scadenzaValue = formatDateForInput(scadenzaDate);
  const noteEsito = String(payload.note ?? "").trim();

  const prenotazioneBase: PrenotazioneCollaudoRecord = isRecord(current.prenotazioneCollaudo)
    ? (current.prenotazioneCollaudo as PrenotazioneCollaudoRecord)
    : { data: "" };

  const nextPrenotazione: PrenotazioneCollaudoRecord = {
    ...prenotazioneBase,
    completata: true,
    completataIl: revisioneDateValue,
    esito: payload.esito,
    ...(noteEsito ? { noteEsito } : {}),
  };

  let nextNote = current.note as string | undefined;
  if (noteEsito) {
    const noteLine = `REVISIONE ${revisioneDateLabel}: ${payload.esito} - ${noteEsito}`;
    const noteBase = String(current.note ?? "").trim();
    nextNote = noteBase ? `${noteBase}\n${noteLine}` : noteLine;
  }

  const updated = {
    ...current,
    dataUltimoCollaudo: revisioneDateValue,
    dataScadenzaRevisione: scadenzaValue,
    prenotazioneCollaudo: nextPrenotazione,
    ...(noteEsito ? { note: nextNote } : {}),
  };
  const nextRecords = [...records];
  nextRecords[targetIndex] = updated;

  await writeMezziRecords(nextRecords);
}
