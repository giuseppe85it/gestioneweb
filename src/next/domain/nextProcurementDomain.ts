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

type NextReadQuality = "certo" | "parziale" | "da_verificare";

export type NextProcurementCloneTab =
  | "ordine-materiali"
  | "ordini"
  | "arrivi"
  | "preventivi"
  | "listino";

export type NextProcurementListTab = "ordini" | "arrivi";
export type NextProcurementOrderState = "in_attesa" | "parziale" | "arrivato";

export const NEXT_PROCUREMENT_DOMAIN = {
  code: "D06",
  name: "Procurement, ordini e fornitori",
  logicalDatasets: [ORDINI_KEY] as const,
  activeReadOnlyDataset: ORDINI_KEY,
  normalizationStrategy: "LAYER NEXT READ-ONLY PROCUREMENT SU @ordini",
} as const;

export type NextProcurementMaterialItem = {
  id: string;
  descrizione: string;
  quantita: number | null;
  unita: string | null;
  arrived: boolean;
  arrivalDateLabel: string | null;
  arrivalTimestamp: number | null;
  note: string | null;
  photoUrl: string | null;
  photoStoragePath: string | null;
  unitPrice: number | null;
  currency: string | null;
  unitPriceUnit: string | null;
  lineTotal: number | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof ORDINI_KEY;
  quality: NextReadQuality;
  flags: string[];
};

export type NextProcurementOrderItem = {
  id: string;
  supplierId: string | null;
  supplierName: string;
  orderDateLabel: string | null;
  orderTimestamp: number | null;
  orderReference: string;
  totalRows: number;
  arrivedRows: number;
  pendingRows: number;
  latestArrivalLabel: string | null;
  state: NextProcurementOrderState;
  materialPreview: string[];
  materials: NextProcurementMaterialItem[];
  orderNote: string | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof ORDINI_KEY;
  quality: NextReadQuality;
  flags: string[];
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
    ordiniTabOrders: number;
    arriviTabOrders: number;
  };
  orders: NextProcurementOrderItem[];
  groups: {
    pending: NextProcurementOrderItem[];
    partial: NextProcurementOrderItem[];
    arrived: NextProcurementOrderItem[];
  };
  legacyViews: {
    ordini: NextProcurementOrderItem[];
    arrivi: NextProcurementOrderItem[];
  };
  navigability: {
    ordineMateriali: { enabled: false; reason: string };
    ordini: { enabled: true; reason: null };
    arrivi: { enabled: true; reason: null };
    preventivi: { enabled: false; reason: string };
    listino: { enabled: false; reason: string };
    dettaglioOrdine: { enabled: true; reason: string };
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

function normalizeCurrency(value: unknown): string | null {
  const normalized = normalizeOptionalText(value);
  return normalized ? normalized.toUpperCase() : null;
}

function unwrapStorageArray(rawDoc: unknown): {
  datasetShape: NextLegacyDatasetShape;
  items: unknown[];
} {
  if (!rawDoc) {
    return { datasetShape: "missing", items: [] };
  }

  if (Array.isArray(rawDoc)) {
    return { datasetShape: "array", items: rawDoc };
  }

  if (typeof rawDoc !== "object") {
    return { datasetShape: "unsupported", items: [] };
  }

  const record = rawDoc as Record<string, unknown>;

  if (Array.isArray(record.items)) {
    return { datasetShape: "items", items: record.items };
  }

  if (Array.isArray((record.value as { items?: unknown[] } | undefined)?.items)) {
    return {
      datasetShape: "value.items",
      items: (record.value as { items: unknown[] }).items,
    };
  }

  if (Array.isArray(record.value)) {
    return { datasetShape: "value", items: record.value };
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

  if (typeof value === "object" && value !== null) {
    const maybe = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybe.toDate === "function") {
      const parsed = maybe.toDate();
      return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
    }

    if (typeof maybe.seconds === "number") {
      const parsed = new Date(maybe.seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof maybe._seconds === "number") {
      const parsed = new Date(maybe._seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const parsedIso = new Date(raw);
  if (!Number.isNaN(parsedIso.getTime())) {
    return parsedIso;
  }

  const match = raw.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
  );
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const yearRaw = Number(match[3]);
  const year = match[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
  const hours = Number(match[4] ?? "12");
  const minutes = Number(match[5] ?? "00");
  const parsed = new Date(year, month, day, hours, minutes, 0, 0);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
}

function formatTimestampDateLabel(timestamp: number | null): string | null {
  if (timestamp === null) return null;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return null;
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  return `${day} ${month} ${year}`;
}

function normalizeLegacyDateLabel(value: unknown): string | null {
  const timestamp = toTimestamp(value);
  if (timestamp !== null) return formatTimestampDateLabel(timestamp);
  return normalizeOptionalText(value);
}

function buildOrderId(raw: RawOrderRecord, index: number): string {
  return normalizeOptionalText(raw.id) ?? `ordine:${index}`;
}

function buildMaterialId(raw: RawMaterialRecord, index: number): string {
  return normalizeOptionalText(raw.id) ?? `riga:${index}`;
}

function extractMaterials(raw: RawOrderRecord): RawMaterialRecord[] {
  return Array.isArray(raw.materiali)
    ? raw.materiali.filter(
        (entry): entry is RawMaterialRecord => Boolean(entry) && typeof entry === "object"
      )
    : [];
}

function extractNoteByMaterialId(raw: RawOrderRecord): Record<string, string> {
  if (!raw.noteByMaterialeId || typeof raw.noteByMaterialeId !== "object") {
    return {};
  }

  return Object.entries(raw.noteByMaterialeId as Record<string, unknown>).reduce<Record<string, string>>(
    (accumulator, [key, value]) => {
      const normalizedKey = String(key || "").trim();
      const normalizedValue = normalizeOptionalText(value);
      if (!normalizedKey || !normalizedValue) return accumulator;
      accumulator[normalizedKey] = normalizedValue;
      return accumulator;
    },
    {}
  );
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

function deriveQuality(flags: string[], fallbackToVerify?: boolean): NextReadQuality {
  if (fallbackToVerify || flags.some((flag) => flag.endsWith("_assente"))) {
    return "da_verificare";
  }
  if (flags.length > 0) return "parziale";
  return "certo";
}

function buildOrderReference(raw: RawOrderRecord, orderId: string, orderDateLabel: string | null): string {
  const explicitReference =
    normalizeOptionalText(raw.numeroOrdine) ??
    normalizeOptionalText(raw.progressivo) ??
    normalizeOptionalText(raw.numero);

  if (explicitReference) {
    return explicitReference;
  }

  const dateLabel = orderDateLabel ?? "00 00 0000";
  const idTail = orderId.slice(-5).toUpperCase();
  return `ORD DEL ${dateLabel} - ${idTail || "0000"}`;
}

function mapMaterialRecord(
  raw: RawMaterialRecord,
  noteByMaterialId: Record<string, string>,
  index: number
): NextProcurementMaterialItem {
  const materialId = buildMaterialId(raw, index);
  const quantitaRaw = raw.quantita ?? raw.qta ?? raw.quantitaRichiesta;
  const quantita = normalizeNumber(quantitaRaw);
  const arrivalRaw = raw.dataArrivo ?? raw.dataConsegna;
  const arrivalTimestamp = toTimestamp(arrivalRaw);
  const descrizioneRaw =
    normalizeOptionalText(raw.descrizione) ??
    normalizeOptionalText(raw.materiale) ??
    normalizeOptionalText(raw.materialeLabel) ??
    normalizeOptionalText(raw.label) ??
    normalizeOptionalText(raw.nome);
  const descrizione = descrizioneRaw ?? "Materiale non valorizzato";
  const note =
    noteByMaterialId[materialId] ??
    normalizeOptionalText(raw.note) ??
    normalizeOptionalText(raw.nota) ??
    normalizeOptionalText(raw.noteRiga);
  const unitPrice =
    normalizeNumber(raw.prezzoUnitario) ??
    normalizeNumber(raw.prezzoManuale) ??
    normalizeNumber(raw.prezzo) ??
    normalizeNumber(raw.costoUnitario);
  const currency =
    normalizeCurrency(raw.valuta) ?? normalizeCurrency(raw.currency) ?? normalizeCurrency(raw.moneta);
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (!descrizioneRaw) flags.push("descrizione_assente");
  if (quantitaRaw !== undefined && quantita === null) flags.push("quantita_non_valida");
  if (arrivalRaw !== undefined && arrivalRaw !== null && arrivalTimestamp === null) {
    flags.push("data_arrivo_non_parseabile");
  }
  if (unitPrice !== null && !currency) flags.push("valuta_assente");

  return {
    id: materialId,
    descrizione,
    quantita,
    unita:
      normalizeOptionalText(raw.unita) ??
      normalizeOptionalText(raw.udm) ??
      normalizeOptionalText(raw.unitaMisura),
    arrived: raw.arrivato === true,
    arrivalDateLabel: normalizeLegacyDateLabel(arrivalRaw),
    arrivalTimestamp,
    note,
    photoUrl: normalizeOptionalText(raw.fotoUrl),
    photoStoragePath: normalizeOptionalText(raw.fotoStoragePath),
    unitPrice,
    currency,
    unitPriceUnit:
      normalizeOptionalText(raw.unitaPrezzo) ??
      normalizeOptionalText(raw.unita) ??
      normalizeOptionalText(raw.udm),
    lineTotal: quantita !== null && unitPrice !== null ? quantita * unitPrice : null,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: ORDINI_KEY,
    quality: deriveQuality(flags, !descrizioneRaw),
    flags,
  };
}

function mapOrderRecord(raw: RawOrderRecord, index: number): NextProcurementOrderItem {
  const orderId = buildOrderId(raw, index);
  const notesByMaterialId = extractNoteByMaterialId(raw);
  const materials = extractMaterials(raw).map((entry, materialIndex) =>
    mapMaterialRecord(entry, notesByMaterialId, materialIndex)
  );
  const arrivedRows = materials.filter((entry) => entry.arrived).length;
  const latestArrivalTimestamp = materials.reduce<number | null>((current, entry) => {
    if (entry.arrivalTimestamp === null) return current;
    return current === null || entry.arrivalTimestamp > current ? entry.arrivalTimestamp : current;
  }, null);
  const orderDateRaw = raw.dataOrdine ?? raw.createdAt ?? raw.timestamp;
  const orderTimestamp = toTimestamp(orderDateRaw);
  const orderDateLabel = normalizeLegacyDateLabel(orderDateRaw);
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (!normalizeOptionalText(raw.nomeFornitore)) flags.push("fornitore_assente");
  if (orderDateRaw !== undefined && orderDateRaw !== null && orderTimestamp === null) {
    flags.push("data_ordine_non_parseabile");
  }
  if (materials.length === 0) flags.push("righe_materiali_assenti");
  if (materials.some((entry) => entry.quality !== "certo")) {
    flags.push("righe_materiali_parziali");
  }

  return {
    id: orderId,
    supplierId: normalizeOptionalText(raw.idFornitore),
    supplierName: normalizeOptionalText(raw.nomeFornitore) ?? "Fornitore non valorizzato",
    orderDateLabel,
    orderTimestamp,
    orderReference: buildOrderReference(raw, orderId, orderDateLabel),
    totalRows: materials.length,
    arrivedRows,
    pendingRows: Math.max(materials.length - arrivedRows, 0),
    latestArrivalLabel: formatTimestampDateLabel(latestArrivalTimestamp),
    state: deriveOrderState({
      totalRows: materials.length,
      arrivedRows,
      ordineArrivato: raw.arrivato === true,
    }),
    materialPreview: materials.map((entry) => entry.descrizione).slice(0, 3),
    materials,
    orderNote: normalizeOptionalText(raw.ordineNote),
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: ORDINI_KEY,
    quality: deriveQuality(flags, materials.length === 0),
    flags,
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

export function buildNextProcurementListView(
  snapshot: NextProcurementSnapshot,
  tab: NextProcurementListTab
): NextProcurementOrderItem[] {
  return tab === "arrivi" ? snapshot.legacyViews.arrivi : snapshot.legacyViews.ordini;
}

export function findNextProcurementOrder(
  snapshot: NextProcurementSnapshot,
  orderId: string | null
): NextProcurementOrderItem | null {
  if (!orderId) return null;
  return snapshot.orders.find((entry) => entry.id === orderId) ?? null;
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

  const legacyViews = {
    ordini: orders.filter((entry) => entry.pendingRows > 0),
    arrivi: orders.filter((entry) => entry.arrivedRows > 0),
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
      ordiniTabOrders: legacyViews.ordini.length,
      arriviTabOrders: legacyViews.arrivi.length,
    },
    orders,
    groups,
    legacyViews,
    navigability: {
      ordineMateriali: {
        enabled: false,
        reason:
          "Ordine materiali resta bloccato nel clone: il flusso madre scrive bozze e conferme su `@ordini`, carica foto e apre side effect non compatibili col perimetro read-only.",
      },
      ordini: { enabled: true, reason: null },
      arrivi: { enabled: true, reason: null },
      preventivi: {
        enabled: false,
        reason:
          "Prezzi & Preventivi resta bloccato nel clone: usa `@preventivi`, allegati Storage, IA di estrazione e cancellazioni/upload che oggi non entrano nel perimetro clone-safe.",
      },
      listino: {
        enabled: false,
        reason:
          "Listino Prezzi resta bloccato nel clone: il runtime legacy miscela edit, import e consolidamento sopra `@listino_prezzi` e `@fornitori`.",
      },
      dettaglioOrdine: {
        enabled: true,
        reason:
          "Il dettaglio ordine clone legge solo `@ordini` in read-only: nessun passaggio a stock, PDF operativo, foto o salvataggio viene riattivato.",
      },
    },
    limitations: [
      "Il layer D06 clone-safe legge solo `@ordini` e non riapre preventivi, listino, allegati, approvazioni o import del procurement legacy.",
      "Le viste `Ordini` e `Arrivi` replicano la semantica della madre su `Acquisti`: gli ordini parziali compaiono in entrambe perche hanno sia righe pendenti sia righe arrivate.",
      "Il dettaglio clone resta read-only: pulsanti di modifica, PDF operativo, foto, toggle arrivo e aggiunta materiali non vengono eseguiti.",
      dataset.datasetShape === "unsupported"
        ? "Il dataset `@ordini` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
        : null,
      orders.some((entry) => entry.flags.includes("righe_materiali_assenti"))
        ? "Una parte degli ordini legacy non espone righe materiali leggibili; il clone mostra comunque l'ordine senza ricostruire dati mancanti."
        : null,
      orders.some((entry) => entry.flags.includes("fornitore_assente"))
        ? "Una parte degli ordini non espone un fornitore leggibile e resta marcata con flag espliciti."
        : null,
      orders.some((entry) => entry.flags.includes("data_ordine_non_parseabile"))
        ? "Una parte degli ordini non espone una data parseabile; il layer conserva il valore legacy e lo segnala."
        : null,
      orders.some((entry) =>
        entry.materials.some((material) => material.flags.includes("valuta_assente"))
      )
        ? "Le eventuali informazioni prezzo presenti su `@ordini` possono essere parziali: il clone non ricostruisce listino o preventivi mancanti."
        : null,
    ].filter((entry): entry is string => Boolean(entry)),
  };
}
