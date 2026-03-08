import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { normalizeNextMezzoTarga } from "./nextAnagraficheFlottaDomain";

const STORAGE_COLLECTION = "storage";
const LAVORI_DATASET_KEY = "@lavori";
const MANUTENZIONI_DATASET_KEY = "@manutenzioni";

type NextOperativitaTecnicaRaw = Record<string, unknown>;

export const NEXT_OPERATIVITA_TECNICA_DOMAIN = {
  code: "D02",
  name: "Operativita tecnica mezzo",
  logicalDatasets: [LAVORI_DATASET_KEY, MANUTENZIONI_DATASET_KEY] as const,
  nextReadOnlyFields: {
    lavori: [
      "id",
      "targa",
      "descrizione",
      "eseguito",
      "urgenza",
      "dataInserimento",
    ] as const,
    manutenzioni: [
      "id",
      "targa",
      "descrizione",
      "tipo",
      "data",
      "km",
      "ore",
    ] as const,
  },
} as const;

export type NextLavoroTecnicoField =
  (typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.nextReadOnlyFields.lavori)[number];

export type NextManutenzioneTecnicaField =
  (typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.nextReadOnlyFields.manutenzioni)[number];

export type NextLavoroTecnicoItem = {
  id: string;
  targa: string;
  descrizione: string | null;
  eseguito: boolean;
  urgenza: string | null;
  dataInserimento: string | null;
  gruppoId: string | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof LAVORI_DATASET_KEY;
};

export type NextManutenzioneTecnicaItem = {
  id: string;
  targa: string;
  descrizione: string | null;
  tipo: string | null;
  data: string | null;
  km: number | null;
  ore: number | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof MANUTENZIONI_DATASET_KEY;
};

export type NextMezzoOperativitaTecnicaSnapshot = {
  domainCode: typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.code;
  domainName: typeof NEXT_OPERATIVITA_TECNICA_DOMAIN.name;
  mezzoTarga: string;
  logicalDatasets: readonly string[];
  fields: {
    lavori: readonly NextLavoroTecnicoField[];
    manutenzioni: readonly NextManutenzioneTecnicaField[];
  };
  lavoriAperti: NextLavoroTecnicoItem[];
  lavoriChiusi: NextLavoroTecnicoItem[];
  manutenzioni: NextManutenzioneTecnicaItem[];
  counts: {
    lavoriAperti: number;
    lavoriChiusi: number;
    manutenzioni: number;
  };
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return false;
}

function parseDateToTimestamp(value: string | null): number {
  if (!value) return 0;

  const isoLike = Date.parse(value);
  if (!Number.isNaN(isoLike)) return isoLike;

  const parts = value.trim().split(/\s+/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const parsed = Date.parse(`${year}-${month}-${day}T00:00:00`);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
}

function getUrgenzaWeight(value: string | null): number {
  switch ((value ?? "").toLowerCase()) {
    case "alta":
      return 3;
    case "media":
      return 2;
    case "bassa":
      return 1;
    default:
      return 0;
  }
}

function unwrapStorageArray(rawDoc: Record<string, unknown> | null): unknown[] {
  if (Array.isArray(rawDoc)) return rawDoc;
  if (Array.isArray(rawDoc?.value)) return rawDoc.value;
  if (Array.isArray(rawDoc?.items)) return rawDoc.items;
  return [];
}

async function readStorageDataset(key: string): Promise<unknown[]> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, key));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  return unwrapStorageArray(rawDoc);
}

function buildLavoroId(raw: NextOperativitaTecnicaRaw, index: number): string {
  const id = normalizeText(raw.id);
  if (id) return id;

  const targa = normalizeNextMezzoTarga(raw.targa ?? raw.mezzoTarga);
  if (targa) return `lavoro:${targa}:${index}`;

  return `lavoro:${index}`;
}

function buildManutenzioneId(raw: NextOperativitaTecnicaRaw, index: number): string {
  const id = normalizeText(raw.id);
  if (id) return id;

  const targa = normalizeNextMezzoTarga(raw.targa);
  if (targa) return `manutenzione:${targa}:${index}`;

  return `manutenzione:${index}`;
}

function toNextLavoroTecnicoItem(
  raw: NextOperativitaTecnicaRaw,
  index: number
): NextLavoroTecnicoItem | null {
  const targa = normalizeNextMezzoTarga(raw.targa ?? raw.mezzoTarga);
  if (!targa) return null;

  return {
    id: buildLavoroId(raw, index),
    targa,
    descrizione: normalizeOptionalText(raw.descrizione),
    eseguito: normalizeBoolean(raw.eseguito),
    urgenza: normalizeOptionalText(raw.urgenza),
    dataInserimento: normalizeOptionalText(raw.dataInserimento),
    gruppoId: normalizeOptionalText(raw.gruppoId),
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: LAVORI_DATASET_KEY,
  };
}

function toNextManutenzioneTecnicaItem(
  raw: NextOperativitaTecnicaRaw,
  index: number
): NextManutenzioneTecnicaItem | null {
  const targa = normalizeNextMezzoTarga(raw.targa);
  if (!targa) return null;

  return {
    id: buildManutenzioneId(raw, index),
    targa,
    descrizione: normalizeOptionalText(raw.descrizione),
    tipo: normalizeOptionalText(raw.tipo),
    data: normalizeOptionalText(raw.data),
    km: normalizeNumber(raw.km),
    ore: normalizeNumber(raw.ore),
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: MANUTENZIONI_DATASET_KEY,
  };
}

function sortLavoriAperti(items: NextLavoroTecnicoItem[]): NextLavoroTecnicoItem[] {
  return [...items].sort((left, right) => {
    const urgenzaOrder = getUrgenzaWeight(right.urgenza) - getUrgenzaWeight(left.urgenza);
    if (urgenzaOrder !== 0) return urgenzaOrder;

    return parseDateToTimestamp(right.dataInserimento) - parseDateToTimestamp(left.dataInserimento);
  });
}

function sortByDateDesc<T extends { data?: string | null; dataInserimento?: string | null }>(
  items: T[]
): T[] {
  return [...items].sort((left, right) => {
    const rightDate = parseDateToTimestamp(right.data ?? right.dataInserimento ?? null);
    const leftDate = parseDateToTimestamp(left.data ?? left.dataInserimento ?? null);
    return rightDate - leftDate;
  });
}

export async function readNextMezzoOperativitaTecnicaSnapshot(
  targa: string
): Promise<NextMezzoOperativitaTecnicaSnapshot> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);

  const [lavoriRaw, manutenzioniRaw] = await Promise.all([
    readStorageDataset(LAVORI_DATASET_KEY),
    readStorageDataset(MANUTENZIONI_DATASET_KEY),
  ]);

  const lavoriPerMezzo = lavoriRaw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return toNextLavoroTecnicoItem(entry as NextOperativitaTecnicaRaw, index);
    })
    .filter((entry): entry is NextLavoroTecnicoItem => Boolean(entry))
    .filter((entry) => entry.targa === mezzoTarga);

  const manutenzioniPerMezzo = manutenzioniRaw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return toNextManutenzioneTecnicaItem(entry as NextOperativitaTecnicaRaw, index);
    })
    .filter((entry): entry is NextManutenzioneTecnicaItem => Boolean(entry))
    .filter((entry) => entry.targa === mezzoTarga);

  const lavoriAperti = sortLavoriAperti(
    lavoriPerMezzo.filter((entry) => entry.eseguito !== true)
  );
  const lavoriChiusi = sortByDateDesc(
    lavoriPerMezzo.filter((entry) => entry.eseguito === true)
  );
  const manutenzioni = sortByDateDesc(manutenzioniPerMezzo);

  return {
    domainCode: NEXT_OPERATIVITA_TECNICA_DOMAIN.code,
    domainName: NEXT_OPERATIVITA_TECNICA_DOMAIN.name,
    mezzoTarga,
    logicalDatasets: NEXT_OPERATIVITA_TECNICA_DOMAIN.logicalDatasets,
    fields: NEXT_OPERATIVITA_TECNICA_DOMAIN.nextReadOnlyFields,
    lavoriAperti,
    lavoriChiusi,
    manutenzioni,
    counts: {
      lavoriAperti: lavoriAperti.length,
      lavoriChiusi: lavoriChiusi.length,
      manutenzioni: manutenzioni.length,
    },
  };
}
