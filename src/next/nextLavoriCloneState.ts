type NextLavoriCloneTipo = "magazzino" | "targa";
type NextLavoriCloneUrgenza = "bassa" | "media" | "alta";

export type NextLavoriCloneRawRecord = {
  id: string;
  gruppoId: string;
  tipo: NextLavoriCloneTipo;
  descrizione: string;
  dettagli?: string;
  dataInserimento: string;
  eseguito: boolean;
  targa?: string;
  urgenza?: NextLavoriCloneUrgenza;
  segnalatoDa?: string;
  chiHaEseguito?: string;
  dataEsecuzione?: string;
  sottoElementi: unknown[];
  __nextCloneOnly: true;
  __nextCloneSavedAt: number;
};

export type NextLavoriCloneOverrideRecord = {
  id: string;
  patch: Partial<
    Omit<NextLavoriCloneRawRecord, "__nextCloneOnly" | "__nextCloneSavedAt">
  >;
  deleted?: boolean;
  updatedAt: number;
};

const NEXT_LAVORI_CLONE_RECORDS_KEY = "@next_clone_lavori:records";
const NEXT_LAVORI_CLONE_OVERRIDES_KEY = "@next_clone_lavori:overrides";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readState<T>(key: string): T[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeState<T>(key: string, next: T[]) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(next));
}

export function readNextLavoriCloneRecords(): NextLavoriCloneRawRecord[] {
  return readState<NextLavoriCloneRawRecord>(NEXT_LAVORI_CLONE_RECORDS_KEY).filter(
    (entry): entry is NextLavoriCloneRawRecord =>
      Boolean(entry) &&
      typeof entry === "object" &&
      entry.__nextCloneOnly === true &&
      typeof entry.id === "string" &&
      typeof entry.gruppoId === "string" &&
      typeof entry.descrizione === "string",
  );
}

export function appendNextLavoriCloneRecords(records: NextLavoriCloneRawRecord[]) {
  const current = readNextLavoriCloneRecords();
  const nextMap = new Map<string, NextLavoriCloneRawRecord>();

  current.forEach((entry) => {
    nextMap.set(entry.id, entry);
  });
  records.forEach((entry) => {
    nextMap.set(entry.id, entry);
  });

  writeState(
    NEXT_LAVORI_CLONE_RECORDS_KEY,
    Array.from(nextMap.values()).sort(
      (left, right) => (right.__nextCloneSavedAt ?? 0) - (left.__nextCloneSavedAt ?? 0),
    ),
  );
}

export function readNextLavoriCloneOverrides(): NextLavoriCloneOverrideRecord[] {
  return readState<NextLavoriCloneOverrideRecord>(NEXT_LAVORI_CLONE_OVERRIDES_KEY).filter(
    (entry): entry is NextLavoriCloneOverrideRecord =>
      Boolean(entry) &&
      typeof entry === "object" &&
      typeof entry.id === "string" &&
      Boolean(entry.patch) &&
      typeof entry.patch === "object",
  );
}

export function upsertNextLavoriCloneOverride(
  id: string,
  patch: NextLavoriCloneOverrideRecord["patch"],
) {
  const current = readNextLavoriCloneOverrides();
  const nextMap = new Map<string, NextLavoriCloneOverrideRecord>();

  current.forEach((entry) => {
    nextMap.set(entry.id, entry);
  });

  const previous = nextMap.get(id);
  nextMap.set(id, {
    id,
    patch: {
      ...(previous?.patch ?? {}),
      ...patch,
    },
    deleted: false,
    updatedAt: Date.now(),
  });

  writeState(
    NEXT_LAVORI_CLONE_OVERRIDES_KEY,
    Array.from(nextMap.values()).sort((left, right) => right.updatedAt - left.updatedAt),
  );
}

export function markNextLavoriCloneDeleted(id: string) {
  const current = readNextLavoriCloneOverrides();
  const nextMap = new Map<string, NextLavoriCloneOverrideRecord>();

  current.forEach((entry) => {
    nextMap.set(entry.id, entry);
  });

  const previous = nextMap.get(id);
  nextMap.set(id, {
    id,
    patch: previous?.patch ?? {},
    deleted: true,
    updatedAt: Date.now(),
  });

  writeState(
    NEXT_LAVORI_CLONE_OVERRIDES_KEY,
    Array.from(nextMap.values()).sort((left, right) => right.updatedAt - left.updatedAt),
  );
}
