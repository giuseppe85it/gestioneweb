import { doc, getDoc } from "firebase/firestore";
import {
  generateLibrettiPhotosPDFBlob,
  type LibrettiPhotosSection,
} from "../../utils/pdfEngine";
import { db } from "../../firebase";
import {
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaMezzoItem,
} from "../nextAnagraficheFlottaDomain";

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

export const NEXT_LIBRETTI_EXPORT_DOMAIN = {
  code: "D07-LIBRETTI-EXPORT",
  name: "Libretti Export clone-safe",
  logicalDatasets: [MEZZI_KEY] as const,
  activeReadOnlyDataset: MEZZI_KEY,
  normalizationStrategy:
    "LAYER NEXT READ-ONLY SU @mezzi_aziendali PER LISTA LIBRETTI E PREVIEW LOCALE",
} as const;

export type NextLibrettiExportItem = {
  id: string;
  targa: string;
  categoria: string;
  label: string;
  librettoUrl: string;
  librettoStoragePath: string | null;
  datasetShape: NextLegacyDatasetShape;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof MEZZI_KEY;
  flags: string[];
};

export type NextLibrettiExportSnapshot = {
  domainCode: typeof NEXT_LIBRETTI_EXPORT_DOMAIN.code;
  domainName: typeof NEXT_LIBRETTI_EXPORT_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_LIBRETTI_EXPORT_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_LIBRETTI_EXPORT_DOMAIN.normalizationStrategy;
  datasetShape: NextLegacyDatasetShape;
  items: NextLibrettiExportItem[];
  counts: {
    totalMezzi: number;
    withLibretto: number;
    withStorageFallback: number;
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
  rawDoc: Record<string, unknown> | unknown[] | null
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

function resolveDisplayLabel(item: NextAnagraficheFlottaMezzoItem): string {
  if (!item.flags.includes("categoria_assente") && item.categoria.trim()) {
    return item.categoria.trim();
  }

  if (item.tipo === "motrice") return "Motrice";
  if (item.tipo === "cisterna") return "Cisterna";

  const marcaModello = [item.marca, item.modello].filter(Boolean).join(" ").trim();
  if (marcaModello) return marcaModello;

  return item.categoria.trim() || "-";
}

async function readStorageFallbackMap(): Promise<{
  datasetShape: NextLegacyDatasetShape;
  storagePathByTarga: Map<string, string>;
}> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, MEZZI_KEY));
  const rawDoc = snapshot.exists()
    ? ((snapshot.data() as Record<string, unknown>) ?? null)
    : null;
  const dataset = unwrapStorageArray(rawDoc);

  const storagePathByTarga = new Map<string, string>();
  dataset.items.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const raw = entry as RawRecord;
    const targa = normalizeTarga(raw.targa);
    const librettoStoragePath = normalizeOptionalText(raw.librettoStoragePath);

    if (!targa || !librettoStoragePath || storagePathByTarga.has(targa)) return;
    storagePathByTarga.set(targa, librettoStoragePath);
  });

  return {
    datasetShape: dataset.datasetShape,
    storagePathByTarga,
  };
}

function sortItems(items: NextLibrettiExportItem[]): NextLibrettiExportItem[] {
  return [...items].sort((left, right) =>
    left.targa.localeCompare(right.targa, "it", { sensitivity: "base" })
  );
}

function formatFileDate(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export async function readNextLibrettiExportSnapshot(): Promise<NextLibrettiExportSnapshot> {
  const [flottaSnapshot, fallbackState] = await Promise.all([
    readNextAnagraficheFlottaSnapshot(),
    readStorageFallbackMap(),
  ]);

  const items = sortItems(
    flottaSnapshot.items
      .filter((item) => Boolean(item.librettoUrl))
      .map((item) => {
        const librettoStoragePath = fallbackState.storagePathByTarga.get(item.targa) ?? null;
        const flags = [...item.flags];
        if (librettoStoragePath) {
          flags.push("storage_fallback_disponibile");
        } else {
          flags.push("storage_fallback_assente");
        }

        return {
          id: item.id,
          targa: item.targa,
          categoria: item.categoria,
          label: resolveDisplayLabel(item),
          librettoUrl: item.librettoUrl ?? "",
          librettoStoragePath,
          datasetShape: fallbackState.datasetShape,
          sourceCollection: STORAGE_COLLECTION,
          sourceKey: MEZZI_KEY,
          flags,
        } satisfies NextLibrettiExportItem;
      })
  );

  return {
    domainCode: NEXT_LIBRETTI_EXPORT_DOMAIN.code,
    domainName: NEXT_LIBRETTI_EXPORT_DOMAIN.name,
    logicalDatasets: NEXT_LIBRETTI_EXPORT_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_LIBRETTI_EXPORT_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_LIBRETTI_EXPORT_DOMAIN.normalizationStrategy,
    datasetShape: fallbackState.datasetShape,
    items,
    counts: {
      totalMezzi: flottaSnapshot.counts.totalMezzi,
      withLibretto: items.length,
      withStorageFallback: items.filter((item) => Boolean(item.librettoStoragePath)).length,
    },
    limitations: [
      fallbackState.datasetShape === "unsupported"
        ? "Il dataset `@mezzi_aziendali` non espone una shape supportata fuori dai formati `array/items/value/value.items`."
        : null,
      items.some((item) => item.flags.includes("storage_fallback_assente"))
        ? "Una parte dei libretti non espone `librettoStoragePath`: la preview prova il solo `librettoUrl` quando il fallback non e disponibile."
        : null,
      "Il clone esporta i libretti in sola lettura sopra il layer NEXT, senza modificare `@mezzi_aziendali` o riaprire scritture business.",
    ].filter((entry): entry is string => Boolean(entry)),
  };
}

export async function generateNextLibrettiExportPreview(
  items: NextLibrettiExportItem[]
): Promise<{ blob: Blob; fileName: string; sectionCount: number }> {
  const sections: LibrettiPhotosSection[] = items
    .map((item) => ({
      targa: item.targa,
      label: item.label,
      images: [
        {
          url: item.librettoUrl || null,
          storagePath: item.librettoStoragePath || null,
        },
      ],
    }))
    .filter((section) =>
      section.images.some((image) =>
        typeof image === "string"
          ? Boolean(String(image).trim())
          : Boolean(image.url || image.storagePath)
      )
    );

  if (sections.length === 0) {
    throw new Error("Nessun libretto disponibile nelle targhe selezionate.");
  }

  const fileDate = formatFileDate();
  const preview = await generateLibrettiPhotosPDFBlob({
    title: "Libretti mezzi",
    sections,
    fileName: `libretti_${fileDate}_${sections.length}`,
  });

  return {
    ...preview,
    sectionCount: sections.length,
  };
}
