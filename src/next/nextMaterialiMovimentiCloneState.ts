const NEXT_MATERIALI_MOVIMENTI_CLONE_KEY = "@next_clone:materiali_movimenti";
const NEXT_MATERIALI_MOVIMENTI_CLONE_DELETED_KEY =
  "@next_clone:materiali_movimenti:deleted";

export type NextMaterialiMovimentiCloneRecord = {
  id: string;
  targa?: string | null;
  mezzoTarga?: string | null;
  inventarioRefId?: string | null;
  destinatario:
    | {
        type?: "MEZZO" | "COLLEGA" | "MAGAZZINO" | null;
        refId?: string | null;
        label?: string | null;
      }
    | string
    | null;
  descrizione?: string | null;
  materialeLabel?: string | null;
  quantita?: number | null;
  unita?: string | null;
  data?: string | null;
  timestamp?: number | null;
  fornitore?: string | null;
  motivo?: string | null;
  direzione?: "IN" | "OUT" | null;
  __nextCloneOnly: true;
  __nextCloneSavedAt: number;
};

type NextMaterialiMovimentiCloneDeletedRecord = {
  id: string;
  deleted: true;
  updatedAt: number;
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function parseCloneArray<T>(raw: string | null): T[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCloneArray<T>(key: string, records: T[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(records));
}

export function readNextMaterialiMovimentiCloneRecords(): NextMaterialiMovimentiCloneRecord[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  return parseCloneArray<NextMaterialiMovimentiCloneRecord>(
    window.localStorage.getItem(NEXT_MATERIALI_MOVIMENTI_CLONE_KEY),
  ).filter((entry) => Boolean(entry?.id));
}

function readNextMaterialiMovimentiCloneDeletedRecords(): NextMaterialiMovimentiCloneDeletedRecord[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  return parseCloneArray<NextMaterialiMovimentiCloneDeletedRecord>(
    window.localStorage.getItem(NEXT_MATERIALI_MOVIMENTI_CLONE_DELETED_KEY),
  ).filter((entry) => Boolean(entry?.id) && entry?.deleted === true);
}

export function readNextMaterialiMovimentiCloneDeletedIds(): string[] {
  return readNextMaterialiMovimentiCloneDeletedRecords().map((entry) => entry.id);
}

export function appendNextMaterialiMovimentiCloneRecord(
  record: NextMaterialiMovimentiCloneRecord,
) {
  if (!canUseLocalStorage()) {
    return;
  }

  const current = readNextMaterialiMovimentiCloneRecords().filter(
    (entry) => entry.id !== record.id,
  );
  writeCloneArray(NEXT_MATERIALI_MOVIMENTI_CLONE_KEY, [record, ...current]);
  writeCloneArray(
    NEXT_MATERIALI_MOVIMENTI_CLONE_DELETED_KEY,
    readNextMaterialiMovimentiCloneDeletedRecords().filter(
      (entry) => entry.id !== record.id,
    ),
  );
}

export function markNextMaterialiMovimentiCloneDeleted(id: string) {
  if (!canUseLocalStorage() || !id) {
    return;
  }

  writeCloneArray(
    NEXT_MATERIALI_MOVIMENTI_CLONE_KEY,
    readNextMaterialiMovimentiCloneRecords().filter((entry) => entry.id !== id),
  );
  const currentDeleted = readNextMaterialiMovimentiCloneDeletedRecords().filter(
    (entry) => entry.id !== id,
  );
  writeCloneArray(NEXT_MATERIALI_MOVIMENTI_CLONE_DELETED_KEY, [
    {
      id,
      deleted: true,
      updatedAt: Date.now(),
    },
    ...currentDeleted,
  ]);
}
