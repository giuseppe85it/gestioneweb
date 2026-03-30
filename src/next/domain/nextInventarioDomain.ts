import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  readNextInventarioCloneDeletedIds,
  readNextInventarioCloneRecords,
} from "../nextInventarioCloneState";

const STORAGE_COLLECTION = "storage";
const INVENTARIO_KEY = "@inventario";

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export const NEXT_INVENTARIO_DOMAIN = {
  code: "D05-INVENTARIO",
  name: "Inventario magazzino clone-safe",
  logicalDatasets: [INVENTARIO_KEY] as const,
  activeReadOnlyDataset: INVENTARIO_KEY,
  normalizationStrategy: "LAYER NEXT READ-ONLY INVENTARIO SU @inventario",
} as const;

export type NextInventarioReadOnlyItem = {
  id: string;
  descrizione: string;
  quantita: number | null;
  unita: string | null;
  fornitore: string | null;
  fotoUrl: string | null;
  fotoStoragePath: string | null;
  stockStatus: "disponibile" | "critico" | "non_dimostrabile";
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof INVENTARIO_KEY;
  quality: "certo" | "parziale" | "da_verificare";
  flags: string[];
};

export type NextInventarioSnapshot = {
  domainCode: typeof NEXT_INVENTARIO_DOMAIN.code;
  domainName: typeof NEXT_INVENTARIO_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_INVENTARIO_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_INVENTARIO_DOMAIN.normalizationStrategy;
  datasetShape: NextLegacyDatasetShape;
  items: NextInventarioReadOnlyItem[];
  counts: {
    total: number;
    critical: number;
    withReliableQuantity: number;
    withSupplier: number;
    withPhoto: number;
  };
  limitations: string[];
};

export type NextInventarioReadOnlyFilter = {
  query?: string | null;
  criticalOnly?: boolean;
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
    const normalized = value.trim().replace(/\s+/g, "").replace(",", ".");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
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

function buildInventoryId(raw: RawRecord, index: number): string {
  return normalizeOptionalText(raw.id) ?? `inventario:${index}`;
}

function deriveStockStatus(quantita: number | null): NextInventarioReadOnlyItem["stockStatus"] {
  if (quantita === null) {
    return "non_dimostrabile";
  }

  if (quantita <= 0) {
    return "critico";
  }

  return "disponibile";
}

function toInventoryItem(raw: RawRecord, index: number): NextInventarioReadOnlyItem | null {
  const descrizione =
    normalizeOptionalText(raw.descrizione) ??
    normalizeOptionalText(raw.label) ??
    normalizeOptionalText(raw.nome);
  if (!descrizione) return null;

  const quantita =
    normalizeNumber(raw.quantitaTotale) ?? normalizeNumber(raw.quantita) ?? null;
  const unita = normalizeOptionalText(raw.unita) ?? "pz";
  const fornitore =
    normalizeOptionalText(raw.fornitore) ??
    normalizeOptionalText(raw.fornitoreLabel) ??
    normalizeOptionalText(raw.nomeFornitore);
  const fotoUrl = normalizeOptionalText(raw.fotoUrl);
  const fotoStoragePath = normalizeOptionalText(raw.fotoStoragePath);
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (quantita === null) flags.push("quantita_non_valida");
  if (!fornitore) flags.push("fornitore_assente");
  if (!fotoUrl) flags.push("foto_assente");

  return {
    id: buildInventoryId(raw, index),
    descrizione,
    quantita,
    unita,
    fornitore,
    fotoUrl,
    fotoStoragePath,
    stockStatus: deriveStockStatus(quantita),
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: INVENTARIO_KEY,
    quality:
      quantita !== null && unita
        ? "certo"
        : quantita !== null || Boolean(fornitore)
        ? "parziale"
        : "da_verificare",
    flags,
  };
}

function sortInventoryItems(items: NextInventarioReadOnlyItem[]): NextInventarioReadOnlyItem[] {
  return [...items].sort((left, right) => {
    const leftCritical = left.quantita !== null && left.quantita <= 0 ? 1 : 0;
    const rightCritical = right.quantita !== null && right.quantita <= 0 ? 1 : 0;
    if (leftCritical !== rightCritical) return rightCritical - leftCritical;
    return left.descrizione.localeCompare(right.descrizione, "it", { sensitivity: "base" });
  });
}

function buildLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  items: NextInventarioReadOnlyItem[];
  skippedRawRecords: number;
}): string[] {
  const { datasetShape, items, skippedRawRecords } = args;
  return [
    datasetShape === "unsupported"
      ? "Il dataset `@inventario` non espone una shape supportata fuori dai formati `array/value/items`."
      : null,
    skippedRawRecords > 0
      ? "Una parte di `@inventario` e stata esclusa dal clone perche non esponeva i campi minimi leggibili dell'articolo."
      : null,
    items.some((item) => item.flags.includes("quantita_non_valida"))
      ? "Una parte di `@inventario` non espone una quantita numerica pulita e resta marcata con flag espliciti."
      : null,
    items.some((item) => item.flags.includes("fornitore_assente"))
      ? "Il fornitore non e valorizzato su tutti gli articoli inventario."
      : null,
    "Nel clone non esiste ancora una scorta minima canonica: i segnali stock sono affidabili solo quando la quantita e zero o negativa.",
    "Nel clone NEXT sono ammessi solo overlay locali su articolo, foto, quantita e PDF: nessuna variazione inventario viene scritta sulla madre.",
  ].filter((entry): entry is string => Boolean(entry));
}

export function buildNextInventarioReadOnlyView(
  snapshot: NextInventarioSnapshot,
  filter?: NextInventarioReadOnlyFilter
): NextInventarioReadOnlyItem[] {
  const query = normalizeText(filter?.query).toLowerCase();
  const criticalOnly = Boolean(filter?.criticalOnly);

  return snapshot.items.filter((item) => {
    if (criticalOnly && !(item.quantita !== null && item.quantita <= 0)) return false;
    if (!query) return true;
    const haystack = `${item.descrizione} ${item.fornitore ?? ""}`.toLowerCase();
    return haystack.includes(query);
  });
}

export async function readNextInventarioSnapshot(): Promise<NextInventarioSnapshot> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, INVENTARIO_KEY));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  const { datasetShape, items: rawItems } = unwrapStorageArray(rawDoc);
  const cloneRecords = readNextInventarioCloneRecords();
  const deletedIds = new Set(readNextInventarioCloneDeletedIds());
  const cloneIds = new Set(cloneRecords.map((entry) => entry.id));
  const mergedRawItems = [
    ...rawItems.filter((entry, index) => {
      if (!entry || typeof entry !== "object") return true;
      const itemId = buildInventoryId(entry as RawRecord, index);
      return !cloneIds.has(itemId) && !deletedIds.has(itemId);
    }),
    ...cloneRecords.filter((entry) => !deletedIds.has(entry.id)),
  ];

  const mappedItems = mergedRawItems.map((entry, index) => {
    if (!entry || typeof entry !== "object") return null;
    return toInventoryItem(entry as RawRecord, index);
  });

  const items = sortInventoryItems(
    mappedItems.filter((entry): entry is NextInventarioReadOnlyItem => Boolean(entry))
  );
  const skippedRawRecords = mappedItems.length - items.length;

  return {
    domainCode: NEXT_INVENTARIO_DOMAIN.code,
    domainName: NEXT_INVENTARIO_DOMAIN.name,
    logicalDatasets: NEXT_INVENTARIO_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_INVENTARIO_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_INVENTARIO_DOMAIN.normalizationStrategy,
    datasetShape,
    items,
    counts: {
      total: items.length,
      critical: items.filter((item) => item.stockStatus === "critico").length,
      withReliableQuantity: items.filter((item) => item.quantita !== null).length,
      withSupplier: items.filter((item) => Boolean(item.fornitore)).length,
      withPhoto: items.filter((item) => Boolean(item.fotoUrl)).length,
    },
    limitations: [
      ...buildLimitations({ datasetShape, items, skippedRawRecords }),
      cloneRecords.length > 0
        ? `Il clone integra ${cloneRecords.length} articoli locali senza scrivere su @inventario nella madre.`
        : null,
      deletedIds.size > 0
        ? `Il clone nasconde ${deletedIds.size} articoli in modo locale senza cancellarli dalla madre.`
        : null,
    ].filter((entry): entry is string => Boolean(entry)),
  };
}
