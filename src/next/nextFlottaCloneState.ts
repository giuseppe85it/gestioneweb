const NEXT_FLOTTA_CLONE_PATCHES_KEY = "@next_clone:flotta:patches";

export type NextFlottaClonePatchRecord = {
  mezzoId?: string | null;
  targa: string;
  anno?: string | null;
  categoria?: string | null;
  tipo?: "motrice" | "cisterna" | null;
  marca?: string | null;
  modello?: string | null;
  telaio?: string | null;
  colore?: string | null;
  cilindrata?: string | null;
  potenza?: string | null;
  massaComplessiva?: string | null;
  proprietario?: string | null;
  assicurazione?: string | null;
  dataImmatricolazione?: string | null;
  dataScadenzaRevisione?: string | null;
  dataUltimoCollaudo?: string | null;
  manutenzioneProgrammata?: boolean;
  manutenzioneDataInizio?: string | null;
  manutenzioneDataFine?: string | null;
  manutenzioneKmMax?: string | null;
  manutenzioneContratto?: string | null;
  note?: string | null;
  autistaId?: string | null;
  autistaNome?: string | null;
  fotoUrl?: string | null;
  fotoPath?: string | null;
  fotoStoragePath?: string | null;
  librettoUrl?: string | null;
  librettoStoragePath?: string | null;
  deleted?: boolean;
  updatedAt: number;
  source: "ia-libretto" | "ia-copertura" | "mezzi";
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

function normalizeTarga(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function readNextFlottaClonePatches(): NextFlottaClonePatchRecord[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  return parseCloneArray<NextFlottaClonePatchRecord>(
    window.localStorage.getItem(NEXT_FLOTTA_CLONE_PATCHES_KEY),
  ).filter((entry) => Boolean(normalizeTarga(entry?.targa)));
}

export function upsertNextFlottaClonePatch(record: NextFlottaClonePatchRecord) {
  if (!canUseLocalStorage()) {
    return;
  }

  const normalizedTarga = normalizeTarga(record.targa);
  if (!normalizedTarga) {
    return;
  }

  const previous =
    readNextFlottaClonePatches().find(
      (entry) => normalizeTarga(entry.targa) === normalizedTarga,
    ) ?? null;
  const nextRecord: NextFlottaClonePatchRecord = {
    ...previous,
    ...record,
    deleted: false,
    targa: normalizedTarga,
  };

  const current = readNextFlottaClonePatches().filter(
    (entry) => normalizeTarga(entry.targa) !== normalizedTarga,
  );

  window.localStorage.setItem(
    NEXT_FLOTTA_CLONE_PATCHES_KEY,
    JSON.stringify([nextRecord, ...current]),
  );
}

export function markNextFlottaCloneDeleted(targa: string) {
  if (!canUseLocalStorage()) {
    return;
  }

  const normalizedTarga = normalizeTarga(targa);
  if (!normalizedTarga) {
    return;
  }

  const previous =
    readNextFlottaClonePatches().find(
      (entry) => normalizeTarga(entry.targa) === normalizedTarga,
    ) ?? null;
  const current = readNextFlottaClonePatches().filter(
    (entry) => normalizeTarga(entry.targa) !== normalizedTarga,
  );

  window.localStorage.setItem(
    NEXT_FLOTTA_CLONE_PATCHES_KEY,
    JSON.stringify([
      {
        ...previous,
        targa: normalizedTarga,
        deleted: true,
        updatedAt: Date.now(),
        source: "mezzi",
      } satisfies NextFlottaClonePatchRecord,
      ...current,
    ]),
  );
}
