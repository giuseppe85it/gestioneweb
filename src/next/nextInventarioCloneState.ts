const NEXT_INVENTARIO_CLONE_KEY = "@next_clone:inventario";
const NEXT_INVENTARIO_CLONE_DELETED_KEY = "@next_clone:inventario:deleted";

export type NextInventarioCloneRecord = {
  id: string;
  descrizione: string;
  quantita: number;
  unita: string;
  fornitore: string | null;
  fotoUrl: string | null;
  fotoStoragePath: string | null;
  __nextCloneOnly: true;
  __nextCloneSavedAt: number;
};

type NextInventarioCloneDeletedRecord = {
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

export function readNextInventarioCloneRecords(): NextInventarioCloneRecord[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  return parseCloneArray<NextInventarioCloneRecord>(
    window.localStorage.getItem(NEXT_INVENTARIO_CLONE_KEY),
  ).filter((entry) => Boolean(entry?.id));
}

function readNextInventarioCloneDeletedRecords(): NextInventarioCloneDeletedRecord[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  return parseCloneArray<NextInventarioCloneDeletedRecord>(
    window.localStorage.getItem(NEXT_INVENTARIO_CLONE_DELETED_KEY),
  ).filter((entry) => Boolean(entry?.id) && entry?.deleted === true);
}

function writeNextInventarioCloneDeletedRecords(
  records: NextInventarioCloneDeletedRecord[],
) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(
    NEXT_INVENTARIO_CLONE_DELETED_KEY,
    JSON.stringify(records),
  );
}

export function readNextInventarioCloneDeletedIds(): string[] {
  return readNextInventarioCloneDeletedRecords().map((entry) => entry.id);
}

export function upsertNextInventarioCloneRecord(record: NextInventarioCloneRecord) {
  if (!canUseLocalStorage()) {
    return;
  }

  const current = readNextInventarioCloneRecords().filter(
    (entry) => entry.id !== record.id,
  );
  window.localStorage.setItem(
    NEXT_INVENTARIO_CLONE_KEY,
    JSON.stringify([record, ...current]),
  );
  writeNextInventarioCloneDeletedRecords(
    readNextInventarioCloneDeletedRecords().filter((entry) => entry.id !== record.id),
  );
}

export function markNextInventarioCloneDeleted(id: string) {
  if (!canUseLocalStorage()) {
    return;
  }

  if (!id) {
    return;
  }

  window.localStorage.setItem(
    NEXT_INVENTARIO_CLONE_KEY,
    JSON.stringify(
      readNextInventarioCloneRecords().filter((entry) => entry.id !== id),
    ),
  );
  const nextDeleted = readNextInventarioCloneDeletedRecords().filter(
    (entry) => entry.id !== id,
  );
  writeNextInventarioCloneDeletedRecords([
    {
      id,
      deleted: true,
      updatedAt: Date.now(),
    },
    ...nextDeleted,
  ]);
}
