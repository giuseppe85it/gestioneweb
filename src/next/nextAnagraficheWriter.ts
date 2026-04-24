import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { setDoc } from "../utils/firestoreWriteOps";

const STORAGE_COLLECTION = "storage";
const COLLEGHI_KEY = "@colleghi";
const FORNITORI_KEY = "@fornitori";
const OFFICINE_KEY = "@officine";

type RawRecord = Record<string, unknown>;

export type NextCollegaFuelCardRecord = {
  id?: string | null;
  nomeCarta?: string | null;
  pinCarta?: string | null;
};

export type NextCollegaRecord = {
  id?: string | null;
  nome: string;
  telefono?: string | null;
  telefonoPrivato?: string | null;
  badge?: string | null;
  codice?: string | null;
  descrizione?: string | null;
  pinSim?: string | null;
  pukSim?: string | null;
  schedeCarburante?: NextCollegaFuelCardRecord[];
};

export type NextFornitoreRecord = {
  id?: string | null;
  nome: string;
  telefono?: string | null;
  badge?: string | null;
  codice?: string | null;
  descrizione?: string | null;
};

export type NextOfficinaRecord = {
  id?: string | null;
  nome: string;
  telefono?: string | null;
  telefoniAggiuntivi?: string[];
  citta?: string | null;
};

const generaId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeRequiredName(value: unknown): string {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) {
    throw new Error("Il nome e obbligatorio.");
  }

  return normalized;
}

function normalizeRequiredId(value: unknown): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    throw new Error("Id non valido.");
  }

  return normalized;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => normalizeText(entry))
    .filter((entry) => entry.length > 0);
}

function normalizeFuelCards(value: unknown): Array<{
  id: string;
  nomeCarta: string | null;
  pinCarta: string | null;
}> {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as RawRecord;
      const nomeCarta = normalizeOptionalText(raw.nomeCarta);
      const pinCarta = normalizeOptionalText(raw.pinCarta);
      if (!nomeCarta && !pinCarta) return null;

      return {
        id: normalizeOptionalText(raw.id) ?? generaId(),
        nomeCarta,
        pinCarta,
      };
    })
    .filter((entry): entry is { id: string; nomeCarta: string | null; pinCarta: string | null } =>
      Boolean(entry),
    );
}

async function readStorageArray<T>(key: string): Promise<T[]> {
  const refDoc = doc(collection(db, STORAGE_COLLECTION), key);
  const snap = await getDoc(refDoc);
  const rawValue = snap.exists() ? snap.data()?.value : [];
  return Array.isArray(rawValue) ? (rawValue as T[]) : [];
}

async function writeStorageArray<T>(key: string, value: T[]): Promise<void> {
  const refDoc = doc(collection(db, STORAGE_COLLECTION), key);
  await setDoc(refDoc, { value }, { merge: true });
}

function readRecordId(record: { id?: string | null }): string {
  return normalizeOptionalText(record.id) ?? generaId();
}

function sanitizeCollega(record: NextCollegaRecord, id: string) {
  return {
    id,
    nome: normalizeRequiredName(record.nome),
    telefono: normalizeOptionalText(record.telefono),
    telefonoPrivato: normalizeOptionalText(record.telefonoPrivato),
    badge: normalizeOptionalText(record.badge),
    codice: normalizeOptionalText(record.codice),
    descrizione: normalizeOptionalText(record.descrizione),
    pinSim: normalizeOptionalText(record.pinSim),
    pukSim: normalizeOptionalText(record.pukSim),
    schedeCarburante: normalizeFuelCards(record.schedeCarburante),
  };
}

function sanitizeFornitore(
  record: NextFornitoreRecord,
  id: string,
  original?: RawRecord | null,
) {
  const originalBadge = normalizeOptionalText(original?.badge);
  const originalCodice = normalizeOptionalText(original?.codice);

  return {
    id,
    nome: normalizeRequiredName(record.nome),
    telefono: normalizeOptionalText(record.telefono),
    badge: originalBadge ?? normalizeOptionalText(record.badge),
    codice: originalCodice ?? normalizeOptionalText(record.codice),
    descrizione: normalizeOptionalText(record.descrizione),
  };
}

function sanitizeOfficina(record: NextOfficinaRecord, id: string) {
  return {
    id,
    nome: normalizeRequiredName(record.nome),
    telefono: normalizeOptionalText(record.telefono),
    telefoniAggiuntivi: normalizeStringArray(record.telefoniAggiuntivi),
    citta: normalizeOptionalText(record.citta),
  };
}

export async function saveNextCollega(record: NextCollegaRecord): Promise<string> {
  const current = await readStorageArray<RawRecord>(COLLEGHI_KEY);
  const id = readRecordId(record);
  const nextRecord = sanitizeCollega(record, id);
  const exists = current.some((entry) => normalizeOptionalText(entry.id) === id);
  const updated = exists
    ? current.map((entry) => (normalizeOptionalText(entry.id) === id ? nextRecord : entry))
    : [...current, nextRecord];

  await writeStorageArray(COLLEGHI_KEY, updated);
  return id;
}

export async function deleteNextCollega(id: string): Promise<void> {
  const normalizedId = normalizeRequiredId(id);
  const current = await readStorageArray<RawRecord>(COLLEGHI_KEY);
  await writeStorageArray(
    COLLEGHI_KEY,
    current.filter((entry) => normalizeOptionalText(entry.id) !== normalizedId),
  );
}

export async function saveNextFornitore(record: NextFornitoreRecord): Promise<string> {
  const current = await readStorageArray<RawRecord>(FORNITORI_KEY);
  const id = readRecordId(record);
  const original =
    current.find((entry) => normalizeOptionalText(entry.id) === id) ?? null;
  const nextRecord = sanitizeFornitore(record, id, original);
  const exists = Boolean(original);
  const updated = exists
    ? current.map((entry) => (normalizeOptionalText(entry.id) === id ? nextRecord : entry))
    : [...current, nextRecord];

  await writeStorageArray(FORNITORI_KEY, updated);
  return id;
}

export async function deleteNextFornitore(id: string): Promise<void> {
  const normalizedId = normalizeRequiredId(id);
  const current = await readStorageArray<RawRecord>(FORNITORI_KEY);
  await writeStorageArray(
    FORNITORI_KEY,
    current.filter((entry) => normalizeOptionalText(entry.id) !== normalizedId),
  );
}

export async function saveNextOfficina(record: NextOfficinaRecord): Promise<string> {
  const current = await readStorageArray<RawRecord>(OFFICINE_KEY);
  const id = readRecordId(record);
  const nextRecord = sanitizeOfficina(record, id);
  const exists = current.some((entry) => normalizeOptionalText(entry.id) === id);
  const updated = exists
    ? current.map((entry) => (normalizeOptionalText(entry.id) === id ? nextRecord : entry))
    : [...current, nextRecord];

  await writeStorageArray(OFFICINE_KEY, updated);
  return id;
}

export async function deleteNextOfficina(id: string): Promise<void> {
  const normalizedId = normalizeRequiredId(id);
  const current = await readStorageArray<RawRecord>(OFFICINE_KEY);
  await writeStorageArray(
    OFFICINE_KEY,
    current.filter((entry) => normalizeOptionalText(entry.id) !== normalizedId),
  );
}
