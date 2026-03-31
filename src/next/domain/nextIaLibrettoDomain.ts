import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const STORAGE_COLLECTION = "storage";
const MEZZI_KEY = "@mezzi_aziendali";

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export const NEXT_IA_LIBRETTO_DOMAIN = {
  code: "D12-IA-LIBRETTO",
  name: "Archivio libretti IA clone-safe",
  logicalDatasets: [MEZZI_KEY] as const,
  activeReadOnlyDataset: MEZZI_KEY,
  normalizationStrategy:
    "LAYER NEXT READ-ONLY SU @mezzi_aziendali PER ARCHIVIO LIBRETTI IA",
} as const;

export type NextIaLibrettoArchiveItem = {
  id: string;
  targa: string;
  categoria: string | null;
  marca: string | null;
  modello: string | null;
  label: string;
  librettoUrl: string;
  librettoStoragePath: string | null;
  datasetShape: NextLegacyDatasetShape;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof MEZZI_KEY;
  flags: string[];
};

export type NextIaLibrettoArchiveSnapshot = {
  domainCode: typeof NEXT_IA_LIBRETTO_DOMAIN.code;
  domainName: typeof NEXT_IA_LIBRETTO_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_IA_LIBRETTO_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_IA_LIBRETTO_DOMAIN.normalizationStrategy;
  datasetShape: NextLegacyDatasetShape;
  items: NextIaLibrettoArchiveItem[];
  counts: {
    totalMezzi: number;
    withLibretto: number;
  };
  limitations: string[];
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeTarga(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/\s+/g, "");
}

function unwrapStorageArray(
  rawDoc: Record<string, unknown> | unknown[] | null,
): { datasetShape: NextLegacyDatasetShape; items: unknown[] } {
  if (!rawDoc) {
    return { datasetShape: "missing", items: [] };
  }

  if (Array.isArray(rawDoc)) {
    return { datasetShape: "array", items: rawDoc };
  }

  if (Array.isArray(rawDoc.items)) {
    return { datasetShape: "items", items: rawDoc.items };
  }

  if (Array.isArray((rawDoc.value as { items?: unknown[] } | undefined)?.items)) {
    return {
      datasetShape: "value.items",
      items: (rawDoc.value as { items: unknown[] }).items,
    };
  }

  if (Array.isArray(rawDoc.value)) {
    return { datasetShape: "value", items: rawDoc.value };
  }

  return { datasetShape: "unsupported", items: [] };
}

function resolveLabel(raw: RawRecord): string {
  const categoria = normalizeText(raw.categoria);
  if (categoria) return categoria;

  const marca = normalizeText(raw.marca);
  const modello = normalizeText(raw.modello);
  const marcaModello = [marca, modello].filter(Boolean).join(" ").trim();
  if (marcaModello) return marcaModello;

  const tipo = normalizeText(raw.tipo).toLowerCase();
  if (tipo === "motrice") return "Motrice";
  if (tipo === "cisterna") return "Cisterna";

  return "-";
}

function mapArchiveItem(
  entry: unknown,
  index: number,
  datasetShape: NextLegacyDatasetShape,
): NextIaLibrettoArchiveItem | null {
  if (!entry || typeof entry !== "object") return null;

  const raw = entry as RawRecord;
  const targa = normalizeTarga(raw.targa);
  const librettoUrl = normalizeText(raw.librettoUrl);

  if (!targa || !librettoUrl) return null;

  const flags: string[] = [];
  if (!normalizeOptionalText(raw.librettoStoragePath)) flags.push("libretto_storage_path_assente");
  if (!normalizeOptionalText(raw.categoria)) flags.push("categoria_assente");
  if (datasetShape === "unsupported") flags.push("dataset_shape_non_supportata");

  return {
    id: normalizeText(raw.id) || `mezzo:${targa}:${index}`,
    targa,
    categoria: normalizeOptionalText(raw.categoria),
    marca: normalizeOptionalText(raw.marca),
    modello: normalizeOptionalText(raw.modello),
    label: resolveLabel(raw),
    librettoUrl,
    librettoStoragePath: normalizeOptionalText(raw.librettoStoragePath),
    datasetShape,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: MEZZI_KEY,
    flags,
  };
}

export async function readNextIaLibrettoArchiveSnapshot(): Promise<NextIaLibrettoArchiveSnapshot> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, MEZZI_KEY));
  const rawDoc = snapshot.exists()
    ? ((snapshot.data() as Record<string, unknown>) ?? null)
    : null;
  const dataset = unwrapStorageArray(rawDoc);

  const items = dataset.items
    .map((entry, index) => mapArchiveItem(entry, index, dataset.datasetShape))
    .filter((entry): entry is NextIaLibrettoArchiveItem => Boolean(entry))
    .sort((left, right) => left.targa.localeCompare(right.targa, "it", { sensitivity: "base" }));

  return {
    domainCode: NEXT_IA_LIBRETTO_DOMAIN.code,
    domainName: NEXT_IA_LIBRETTO_DOMAIN.name,
    logicalDatasets: NEXT_IA_LIBRETTO_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_IA_LIBRETTO_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_IA_LIBRETTO_DOMAIN.normalizationStrategy,
    datasetShape: dataset.datasetShape,
    items,
    counts: {
      totalMezzi: dataset.items.length,
      withLibretto: items.length,
    },
    limitations: [
      dataset.datasetShape === "unsupported"
        ? "Il dataset `@mezzi_aziendali` non espone una shape supportata fuori dai formati `array/items/value/value.items`."
        : null,
      items.some((item) => item.flags.includes("libretto_storage_path_assente"))
        ? "Una parte dei libretti non espone `librettoStoragePath`: la pagina usa il solo `librettoUrl` disponibile in lettura."
        : null,
      "Il modulo NEXT legge lo stesso archivio reale della madre in sola lettura e non applica patch clone-only al mezzo.",
    ].filter((entry): entry is string => Boolean(entry)),
  };
}
