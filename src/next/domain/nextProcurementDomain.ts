import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const STORAGE_COLLECTION = "storage";
const ORDINI_KEY = "@ordini";

type RawOrderRecord = Record<string, unknown>;
type RawMaterialRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export type NextProcurementOrderState = "in_attesa" | "parziale" | "arrivato";

export const NEXT_PROCUREMENT_DOMAIN = {
  code: "D06",
  name: "Procurement, ordini e fornitori",
  logicalDatasets: [ORDINI_KEY] as const,
  activeReadOnlyDataset: ORDINI_KEY,
  normalizationStrategy: "LAYER NEXT READ-ONLY ORDINI GLOBALI",
} as const;

export type NextProcurementOrderItem = {
  id: string;
  supplierId: string | null;
  supplierName: string;
  orderDateLabel: string | null;
  orderTimestamp: number | null;
  totalRows: number;
  arrivedRows: number;
  pendingRows: number;
  latestArrivalLabel: string | null;
  state: NextProcurementOrderState;
  materialPreview: string[];
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof ORDINI_KEY;
};

export type NextProcurementSnapshot = {
  domainCode: typeof NEXT_PROCUREMENT_DOMAIN.code;
  domainName: typeof NEXT_PROCUREMENT_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_PROCUREMENT_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_PROCUREMENT_DOMAIN.normalizationStrategy;
  datasetShape: NextLegacyDatasetShape;
  counts: {
    totalOrders: number;
    pendingOrders: number;
    partialOrders: number;
    arrivedOrders: number;
    totalRows: number;
    pendingRows: number;
    arrivedRows: number;
  };
  groups: {
    pending: NextProcurementOrderItem[];
    partial: NextProcurementOrderItem[];
    arrived: NextProcurementOrderItem[];
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

function unwrapStorageArray(
  rawDoc: Record<string, unknown> | null
): { datasetShape: NextLegacyDatasetShape; items: unknown[] } {
  if (!rawDoc) {
    return { datasetShape: "missing", items: [] };
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

  if (Array.isArray(rawDoc)) {
    return { datasetShape: "array", items: rawDoc };
  }

  return { datasetShape: "unsupported", items: [] };
}

function parseDateFlexible(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const parsed = new Date(millis);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const parsedIso = new Date(raw);
  if (!Number.isNaN(parsedIso.getTime())) {
    return parsedIso;
  }

  const match = raw.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const yearRaw = Number(match[3]);
  const year = match[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
  const parsed = new Date(year, month, day, 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
}

function buildOrderId(raw: RawOrderRecord, index: number): string {
  return normalizeOptionalText(raw.id) ?? `ordine:${index}`;
}

function extractMaterials(raw: RawOrderRecord): RawMaterialRecord[] {
  return Array.isArray(raw.materiali)
    ? raw.materiali.filter(
        (entry): entry is RawMaterialRecord => Boolean(entry) && typeof entry === "object"
      )
    : [];
}

function deriveOrderState(args: {
  totalRows: number;
  arrivedRows: number;
  ordineArrivato: boolean;
}): NextProcurementOrderState {
  const { totalRows, arrivedRows, ordineArrivato } = args;
  if (totalRows > 0) {
    if (arrivedRows === 0) return "in_attesa";
    if (arrivedRows < totalRows) return "parziale";
    return "arrivato";
  }

  return ordineArrivato ? "arrivato" : "in_attesa";
}

function mapOrderRecord(raw: RawOrderRecord, index: number): NextProcurementOrderItem {
  const materials = extractMaterials(raw);
  const arrivedRows = materials.filter((entry) => entry.arrivato === true).length;
  const latestArrivalTimestamp = materials.reduce<number | null>((current, entry) => {
    if (entry.arrivato !== true) return current;
    const timestamp = toTimestamp(entry.dataArrivo);
    if (timestamp === null) return current;
    return current === null || timestamp > current ? timestamp : current;
  }, null);

  return {
    id: buildOrderId(raw, index),
    supplierId: normalizeOptionalText(raw.idFornitore),
    supplierName: normalizeOptionalText(raw.nomeFornitore) ?? "Fornitore non valorizzato",
    orderDateLabel: normalizeOptionalText(raw.dataOrdine),
    orderTimestamp: toTimestamp(raw.dataOrdine),
    totalRows: materials.length,
    arrivedRows,
    pendingRows: Math.max(materials.length - arrivedRows, 0),
    latestArrivalLabel: normalizeOptionalText(
      latestArrivalTimestamp ? new Date(latestArrivalTimestamp).toLocaleDateString("it-IT") : null
    ),
    state: deriveOrderState({
      totalRows: materials.length,
      arrivedRows,
      ordineArrivato: raw.arrivato === true,
    }),
    materialPreview: materials
      .map((entry) => normalizeOptionalText(entry.descrizione))
      .filter((entry): entry is string => Boolean(entry))
      .slice(0, 3),
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: ORDINI_KEY,
  };
}

function sortOrders(items: NextProcurementOrderItem[]): NextProcurementOrderItem[] {
  return [...items].sort((left, right) => {
    const timestampDelta = (right.orderTimestamp ?? 0) - (left.orderTimestamp ?? 0);
    if (timestampDelta !== 0) return timestampDelta;
    return right.id.localeCompare(left.id, "it", { sensitivity: "base" });
  });
}

async function readOrdersDataset(): Promise<{
  datasetShape: NextLegacyDatasetShape;
  items: unknown[];
}> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, ORDINI_KEY));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  return unwrapStorageArray(rawDoc);
}

export async function readNextProcurementSnapshot(): Promise<NextProcurementSnapshot> {
  const dataset = await readOrdersDataset();

  const orders = sortOrders(
    dataset.items
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        return mapOrderRecord(entry as RawOrderRecord, index);
      })
      .filter((entry): entry is NextProcurementOrderItem => Boolean(entry))
  );

  const groups = {
    pending: orders.filter((entry) => entry.state === "in_attesa"),
    partial: orders.filter((entry) => entry.state === "parziale"),
    arrived: orders.filter((entry) => entry.state === "arrivato"),
  };

  return {
    domainCode: NEXT_PROCUREMENT_DOMAIN.code,
    domainName: NEXT_PROCUREMENT_DOMAIN.name,
    logicalDatasets: NEXT_PROCUREMENT_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_PROCUREMENT_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_PROCUREMENT_DOMAIN.normalizationStrategy,
    datasetShape: dataset.datasetShape,
    counts: {
      totalOrders: orders.length,
      pendingOrders: groups.pending.length,
      partialOrders: groups.partial.length,
      arrivedOrders: groups.arrived.length,
      totalRows: orders.reduce((total, entry) => total + entry.totalRows, 0),
      pendingRows: orders.reduce((total, entry) => total + entry.pendingRows, 0),
      arrivedRows: orders.reduce((total, entry) => total + entry.arrivedRows, 0),
    },
    groups,
    limitations: [
      "Il layer D06 legge solo `@ordini` e si limita a liste/stati globali read-only: nessun preventivo, allegato o workflow approvativo entra in pagina.",
      "Il blocco non tocca `@inventario`, `@materialiconsegnati`, `@preventivi`, `@listino_prezzi` o `@fornitori`: il dominio resta volutamente stretto.",
      dataset.datasetShape === "unsupported"
        ? "Il dataset `@ordini` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
        : null,
      orders.some((entry) => entry.totalRows === 0)
        ? "Una parte degli ordini legacy non espone righe materiali leggibili; il workbench mostra comunque lo stato generale senza ricostruzioni forzate."
        : null,
      "Nessun dettaglio ordine NEXT, nessun passaggio a stock e nessun clone di `Acquisti`: il workbench globale prepara solo l'ingresso corretto dell'area.",
    ].filter((entry): entry is string => Boolean(entry)),
  };
}
