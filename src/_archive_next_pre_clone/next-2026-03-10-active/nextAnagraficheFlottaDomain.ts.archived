import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const STORAGE_COLLECTION = "storage";
const MEZZI_DATASET_KEY = "@mezzi_aziendali";
const COLLEGHI_DATASET_KEY = "@colleghi";

type NextAnagraficheFlottaRaw = Record<string, unknown>;

export const NEXT_ANAGRAFICHE_FLOTTA_DOMAIN = {
  code: "D01",
  name: "Anagrafiche flotta e persone",
  logicalDatasets: [MEZZI_DATASET_KEY, COLLEGHI_DATASET_KEY] as const,
  activeReadOnlyDataset: MEZZI_DATASET_KEY,
  nextListFields: [
    "id",
    "targa",
    "categoria",
    "marca",
    "modello",
    "autistaNome",
  ] as const,
} as const;

export type NextMezzoListField =
  (typeof NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.nextListFields)[number];

export type NextMezzoListItem = {
  id: string;
  targa: string;
  categoria: string;
  marca: string;
  modello: string;
  autistaNome: string | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof MEZZI_DATASET_KEY;
};

export type NextAnagraficheFlottaSnapshot = {
  domainCode: typeof NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.code;
  domainName: typeof NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.activeReadOnlyDataset;
  fields: readonly NextMezzoListField[];
  items: NextMezzoListItem[];
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTarga(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/\s+/g, "");
}

export function normalizeNextMezzoTarga(value: unknown): string {
  return normalizeTarga(value);
}

function normalizeCategoria(value: unknown): string {
  const categoria = normalizeText(value);
  return categoria || "Senza categoria";
}

function buildFallbackId(raw: NextAnagraficheFlottaRaw, index: number) {
  const id = normalizeText(raw.id);
  if (id) return id;

  const targa = normalizeTarga(raw.targa);
  if (targa) return `targa:${targa}`;

  return `mezzo:${index}`;
}

function toNextMezzoListItem(
  raw: NextAnagraficheFlottaRaw,
  index: number
): NextMezzoListItem | null {
  const targa = normalizeTarga(raw.targa);
  if (!targa) return null;

  return {
    id: buildFallbackId(raw, index),
    targa,
    categoria: normalizeCategoria(raw.categoria),
    marca: normalizeText(raw.marca),
    modello: normalizeText(raw.modello),
    autistaNome: normalizeText(raw.autistaNome) || null,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: MEZZI_DATASET_KEY,
  };
}

function sortMezzi(items: NextMezzoListItem[]) {
  return [...items].sort((left, right) => {
    const categoryOrder = left.categoria.localeCompare(right.categoria, "it", {
      sensitivity: "base",
    });

    if (categoryOrder !== 0) return categoryOrder;
    return left.targa.localeCompare(right.targa, "it", { sensitivity: "base" });
  });
}

export async function readNextAnagraficheFlottaSnapshot(): Promise<NextAnagraficheFlottaSnapshot> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, MEZZI_DATASET_KEY));
  const rawDoc = snapshot.exists() ? snapshot.data() : null;
  const rawValue = Array.isArray(rawDoc?.value) ? rawDoc.value : [];

  const items = sortMezzi(
    rawValue
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        return toNextMezzoListItem(entry as NextAnagraficheFlottaRaw, index);
      })
      .filter((entry): entry is NextMezzoListItem => Boolean(entry))
  );

  return {
    domainCode: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.code,
    domainName: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.name,
    logicalDatasets: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.activeReadOnlyDataset,
    fields: NEXT_ANAGRAFICHE_FLOTTA_DOMAIN.nextListFields,
    items,
  };
}

export async function readNextMezzoByTarga(
  targa: string
): Promise<NextMezzoListItem | null> {
  const normalizedTarga = normalizeTarga(targa);
  if (!normalizedTarga) {
    return null;
  }

  const snapshot = await readNextAnagraficheFlottaSnapshot();
  return snapshot.items.find((item) => item.targa === normalizedTarga) ?? null;
}
