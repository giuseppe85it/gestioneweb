const NEXT_CLONE_COLLEGHI_KEY = "@next_clone:colleghi";
const NEXT_CLONE_COLLEGHI_DELETED_KEY = "@next_clone:colleghi:deleted";
const NEXT_CLONE_FORNITORI_KEY = "@next_clone:fornitori";
const NEXT_CLONE_FORNITORI_DELETED_KEY = "@next_clone:fornitori:deleted";

export type NextAnagraficaCloneFuelCard = {
  id: string;
  nomeCarta: string;
  pinCarta: string;
};

export type NextCollegaCloneRecord = {
  id: string;
  nome: string;
  telefono: string | null;
  telefonoPrivato: string | null;
  badge: string | null;
  codice: string | null;
  descrizione: string | null;
  pinSim: string | null;
  pukSim: string | null;
  schedeCarburante: NextAnagraficaCloneFuelCard[];
  __nextCloneOnly: true;
  __nextCloneSavedAt: number;
};

export type NextFornitoreCloneRecord = {
  id: string;
  nome: string;
  telefono: string | null;
  badge: string | null;
  codice: string | null;
  descrizione: string | null;
  __nextCloneOnly: true;
  __nextCloneSavedAt: number;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function readDeletedIds(key: string): string[] {
  const parsed = readJson<unknown[]>(key, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
}

function markDeleted(key: string, id: string) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) {
    return;
  }

  const next = Array.from(new Set([...readDeletedIds(key), normalizedId]));
  writeJson(key, next);
}

function clearDeleted(key: string, id: string) {
  const normalizedId = String(id ?? "").trim();
  if (!normalizedId) {
    return;
  }

  writeJson(
    key,
    readDeletedIds(key).filter((entry) => entry !== normalizedId),
  );
}

export function readNextColleghiCloneRecords(): NextCollegaCloneRecord[] {
  const parsed = readJson<unknown[]>(NEXT_CLONE_COLLEGHI_KEY, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (entry): entry is NextCollegaCloneRecord =>
      Boolean(entry) &&
      typeof entry === "object" &&
      (entry as { __nextCloneOnly?: boolean }).__nextCloneOnly === true &&
      typeof (entry as { id?: unknown }).id === "string",
  );
}

export function upsertNextCollegaCloneRecord(record: NextCollegaCloneRecord) {
  const current = readNextColleghiCloneRecords().filter((entry) => entry.id !== record.id);
  writeJson(NEXT_CLONE_COLLEGHI_KEY, [record, ...current]);
  clearDeleted(NEXT_CLONE_COLLEGHI_DELETED_KEY, record.id);
}

export function readNextDeletedCollegaIds(): string[] {
  return readDeletedIds(NEXT_CLONE_COLLEGHI_DELETED_KEY);
}

export function markNextCollegaCloneDeleted(id: string) {
  markDeleted(NEXT_CLONE_COLLEGHI_DELETED_KEY, id);
  writeJson(
    NEXT_CLONE_COLLEGHI_KEY,
    readNextColleghiCloneRecords().filter((entry) => entry.id !== id),
  );
}

export function readNextFornitoriCloneRecords(): NextFornitoreCloneRecord[] {
  const parsed = readJson<unknown[]>(NEXT_CLONE_FORNITORI_KEY, []);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (entry): entry is NextFornitoreCloneRecord =>
      Boolean(entry) &&
      typeof entry === "object" &&
      (entry as { __nextCloneOnly?: boolean }).__nextCloneOnly === true &&
      typeof (entry as { id?: unknown }).id === "string",
  );
}

export function upsertNextFornitoreCloneRecord(record: NextFornitoreCloneRecord) {
  const current = readNextFornitoriCloneRecords().filter((entry) => entry.id !== record.id);
  writeJson(NEXT_CLONE_FORNITORI_KEY, [record, ...current]);
  clearDeleted(NEXT_CLONE_FORNITORI_DELETED_KEY, record.id);
}

export function readNextDeletedFornitoreIds(): string[] {
  return readDeletedIds(NEXT_CLONE_FORNITORI_DELETED_KEY);
}

export function markNextFornitoreCloneDeleted(id: string) {
  markDeleted(NEXT_CLONE_FORNITORI_DELETED_KEY, id);
  writeJson(
    NEXT_CLONE_FORNITORI_KEY,
    readNextFornitoriCloneRecords().filter((entry) => entry.id !== id),
  );
}
