import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import { readNextInternalAiCloneDocumenti } from "../internal-ai/nextInternalAiCloneState";
import { readNextProcurementSnapshot } from "./nextProcurementDomain";

const STORAGE_COLLECTION = "storage";
const COSTI_DATASET_KEY = "@costiMezzo";
const PROCUREMENT_PREVENTIVI_DATASET_KEY = "@preventivi";
const PROCUREMENT_APPROVALS_DATASET_KEY = "@preventivi_approvazioni";
const PROCUREMENT_LISTINO_DATASET_KEY = "@listino_prezzi";
const DOCUMENTI_COLLECTION_KEYS = [
  "@documenti_mezzi",
  "@documenti_magazzino",
  "@documenti_generici",
] as const;
const DIRECT_DOCUMENT_SOURCE_KEYS = new Set<string>([
  COSTI_DATASET_KEY,
  ...DOCUMENTI_COLLECTION_KEYS,
]);

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "preventivi"
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

type NextDocumentiCostiSourceType =
  | "costo_mezzo"
  | "documento_mezzo"
  | "documento_magazzino"
  | "documento_generico";

type NextDocumentiCostiCategory = "preventivo" | "fattura" | "documento_utile";

export type NextDocumentiCostiCurrency = "EUR" | "CHF" | "UNKNOWN";

export type NextDocumentiCostiFieldQuality = "certo" | "ricostruito" | "non_disponibile";

export type NextDocumentiCostiPeriodFilterStatus =
  | "affidabile"
  | "parziale"
  | "non_dimostrabile";

export type NextDocumentiCostiDecisionReliability =
  | "affidabile"
  | "prudente"
  | "da_verificare";

export type NextDocumentiCostiBusinessLinkClassification = "diretto" | "prudente";

export type NextDocumentiCostiProcurementMatchLevel = "forte" | "non_dimostrabile";

export type NextDocumentiCostiProcurementPerimeterDecision =
  | "fuori_perimetro"
  | "parziale"
  | "forte";

export type NextDocumentiCostiLegacyViewItem = {
  id: string;
  mezzoTarga: string;
  targa: string;
  tipo: "PREVENTIVO" | "FATTURA";
  data: string;
  timestamp: number | null;
  descrizione: string;
  importo?: number;
  valuta: NextDocumentiCostiCurrency;
  currency: NextDocumentiCostiCurrency;
  fornitoreLabel: string;
  fileUrl: string | null;
  sourceKey: string;
  sourceDocId: string | null;
  quality: NextDocumentiCostiFieldQuality;
  flags: string[];
  dedupGroup: string | null;
};

export type NextDocumentiMagazzinoSupportRow = {
  descrizione: string | null;
  prezzoUnitario: number | null;
  importo: number | null;
  quantita: number | null;
};

export type NextDocumentiMagazzinoSupportDocument = {
  id: string;
  sourceCollection: "@documenti_magazzino";
  sourceDocId: string;
  fornitore: string | null;
  data: string | null;
  voci: NextDocumentiMagazzinoSupportRow[];
};

export const NEXT_DOCUMENTI_COSTI_DOMAIN = {
  code: "D07-D08",
  name: "Documenti e costi mezzo",
  logicalDatasets: [COSTI_DATASET_KEY, ...DOCUMENTI_COLLECTION_KEYS] as const,
  activeReadOnlyDatasets: [COSTI_DATASET_KEY, ...DOCUMENTI_COLLECTION_KEYS] as const,
  normalizationStrategy: "NORMALIZER DEDICATO NEXT DOCUMENTI + COSTI MEZZO-CENTRICI",
  outputContract: {
    categories: ["preventivo", "fattura", "documento_utile"] as const,
    previewGroups: ["preventivi", "fatture", "documentiUtili"] as const,
    traceability: [
      "sourceCollection",
      "sourceDocId",
      "sourceRecordId",
      "sourceType",
      "sourceLabel",
    ] as const,
  },
} as const;

export type NextDocumentiCostiReadOnlyItem = {
  id: string;
  mezzoTarga: string;
  targa: string;
  category: NextDocumentiCostiCategory;
  categoria: NextDocumentiCostiCategory;
  documentTypeLabel: string;
  tipoDocumento: string;
  title: string;
  descrizione: string;
  supplier: string | null;
  dateLabel: string | null;
  data: string | null;
  sortTimestamp: number | null;
  timestamp: number | null;
  amount: number | null;
  importo: number | null;
  currency: NextDocumentiCostiCurrency;
  valuta: NextDocumentiCostiCurrency;
  fileUrl: string | null;
  sourceCollection: string;
  sourceKey: string;
  sourceDocId: string | null;
  sourceRecordId: string | null;
  sourceType: NextDocumentiCostiSourceType;
  sourceLabel: string;
  archiveCategory: string | null;
  fieldQuality: {
    date: NextDocumentiCostiFieldQuality;
    amount: NextDocumentiCostiFieldQuality;
    supplier: NextDocumentiCostiFieldQuality;
    fileUrl: NextDocumentiCostiFieldQuality;
  };
  quality: NextDocumentiCostiFieldQuality;
  dedupGroup: string | null;
  flags: string[];
};

type NextDocumentiCostiAmountTotals = {
  eur: number;
  chf: number;
  unknownCount: number;
  withAmount: number;
};

export type NextMezzoDocumentiCostiPeriodInput = {
  label: string;
  appliesFilter: boolean;
  fromTimestamp: number | null;
  toTimestamp: number | null;
};

export type NextMezzoDocumentiCostiPeriodView = {
  mezzoTarga: string;
  period: {
    label: string;
    appliesFilter: boolean;
    coverage: NextDocumentiCostiPeriodFilterStatus;
    note: string;
  };
  items: NextDocumentiCostiReadOnlyItem[];
  counts: {
    total: number;
    totalAvailable: number;
    direct: number;
    prudential: number;
    preventivi: number;
    fatture: number;
    documentiUtili: number;
    withAmount: number;
    withoutAmount: number;
    withFile: number;
    withoutFile: number;
    withReliableDate: number;
    withoutReliableDate: number;
    daVerificare: number;
    outsidePeriod: number;
    excludedMissingDate: number;
  };
  totals: {
    preventivi: NextDocumentiCostiAmountTotals;
    fatture: NextDocumentiCostiAmountTotals;
  };
  highlights: {
    costi: NextDocumentiCostiReadOnlyItem[];
    documenti: NextDocumentiCostiReadOnlyItem[];
    storico: NextDocumentiCostiReadOnlyItem[];
  };
  reliability: {
    source: NextDocumentiCostiDecisionReliability;
    filter: NextDocumentiCostiDecisionReliability;
    final: NextDocumentiCostiDecisionReliability;
  };
  limitations: string[];
  actionHint: string;
};

export type NextMezzoDocumentiCostiSnapshot = {
  domainCode: typeof NEXT_DOCUMENTI_COSTI_DOMAIN.code;
  domainName: typeof NEXT_DOCUMENTI_COSTI_DOMAIN.name;
  mezzoTarga: string;
  logicalDatasets: readonly string[];
  activeReadOnlyDatasets: readonly string[];
  normalizationStrategy: typeof NEXT_DOCUMENTI_COSTI_DOMAIN.normalizationStrategy;
  outputContract: typeof NEXT_DOCUMENTI_COSTI_DOMAIN.outputContract;
  datasetShapes: {
    costiMezzo: NextLegacyDatasetShape;
  };
  items: NextDocumentiCostiReadOnlyItem[];
  groups: {
    preventivi: NextDocumentiCostiReadOnlyItem[];
    fatture: NextDocumentiCostiReadOnlyItem[];
    documentiUtili: NextDocumentiCostiReadOnlyItem[];
  };
  counts: {
    total: number;
    preventivi: number;
    fatture: number;
    documentiUtili: number;
    withFile: number;
    withAmount: number;
    withReliableDate: number;
    withoutReliableDate: number;
  };
  totals: {
    preventivi: NextDocumentiCostiAmountTotals;
    fatture: NextDocumentiCostiAmountTotals;
  };
  latestLabels: {
    preventivo: string | null;
    fattura: string | null;
    documentoUtile: string | null;
  };
  sourceCounts: {
    costiMezzo: number;
    documentiMezzo: number;
    documentiMagazzino: number;
    documentiGenerici: number;
  };
  materialCostSupport: {
    documents: NextDocumentiMagazzinoSupportDocument[];
    documentCount: number;
    rowCount: number;
  };
  limitations: string[];
};

export type NextDocumentiCostiProcurementSupportSnapshot = {
  mezzoTarga: string;
  datasets: readonly string[];
  datasetShapes: {
    preventivi: NextLegacyDatasetShape;
    approvazioni: NextLegacyDatasetShape;
  };
  counts: {
    preventiviGlobali: number;
    preventiviConTargaDiretta: number;
    preventiviMatchForte: number;
    approvazioniGlobali: number;
    approvazioniMezzo: number;
    approvazioniSuPreventiviGlobali: number;
    approvazioniSuDocumentiDiretti: number;
  };
  matching: {
    preventivi: NextDocumentiCostiProcurementMatchLevel;
    approvazioni: NextDocumentiCostiProcurementMatchLevel;
  };
  perimeterDecision: NextDocumentiCostiProcurementPerimeterDecision;
  limitations: string[];
};

export type NextProcurementReadOnlySurfaceState = "navigabile" | "preview" | "bloccata";

export type NextProcurementReadOnlySnapshot = {
  domainCode: "D06";
  domainName: "Procurement read-only";
  generatedAt: string;
  datasets: readonly string[];
  datasetShapes: {
    ordini: NextLegacyDatasetShape;
    preventivi: NextLegacyDatasetShape;
    approvazioni: NextLegacyDatasetShape;
    listino: NextLegacyDatasetShape;
  };
  counts: {
    ordiniTotali: number;
    ordiniInAttesa: number;
    ordiniParziali: number;
    ordiniArrivati: number;
    righeOrdineTotali: number;
    righeOrdinePendenti: number;
    righeOrdineArrivate: number;
    preventiviTotali: number;
    preventiviConPdf: number;
    preventiviConTargaDiretta: number;
    approvazioniTotali: number;
    approvazioniPending: number;
    approvazioniApproved: number;
    approvazioniRejected: number;
    listinoVoci: number;
    listinoConFornitore: number;
  };
  surfaces: {
    ordini: { state: NextProcurementReadOnlySurfaceState; reason: string };
    arrivi: { state: NextProcurementReadOnlySurfaceState; reason: string };
    dettaglioOrdine: { state: NextProcurementReadOnlySurfaceState; reason: string };
    ordineMateriali: { state: NextProcurementReadOnlySurfaceState; reason: string };
    preventivi: { state: NextProcurementReadOnlySurfaceState; reason: string };
    listino: { state: NextProcurementReadOnlySurfaceState; reason: string };
    approvazioniCapoCosti: { state: NextProcurementReadOnlySurfaceState; reason: string };
    pdfTimbrato: { state: NextProcurementReadOnlySurfaceState; reason: string };
  };
  limitations: string[];
  actionHint: string;
};

export type NextDocumentiCostiFleetSnapshot = {
  domainCode: typeof NEXT_DOCUMENTI_COSTI_DOMAIN.code;
  domainName: typeof NEXT_DOCUMENTI_COSTI_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDatasets: readonly string[];
  normalizationStrategy: typeof NEXT_DOCUMENTI_COSTI_DOMAIN.normalizationStrategy;
  outputContract: typeof NEXT_DOCUMENTI_COSTI_DOMAIN.outputContract;
  datasetShapes: {
    costiMezzo: NextLegacyDatasetShape;
  };
  items: NextDocumentiCostiReadOnlyItem[];
  counts: {
    total: number;
    mezziConDocumenti: number;
    preventivi: number;
    fatture: number;
    documentiUtili: number;
    withFile: number;
    withAmount: number;
    withReliableDate: number;
    withoutReliableDate: number;
  };
  totals: {
    preventivi: NextDocumentiCostiAmountTotals;
    fatture: NextDocumentiCostiAmountTotals;
  };
  sourceCounts: {
    costiMezzo: number;
    documentiMezzo: number;
    documentiMagazzino: number;
    documentiGenerici: number;
  };
  materialCostSupport: {
    documents: NextDocumentiMagazzinoSupportDocument[];
    documentCount: number;
    rowCount: number;
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
  return normalizeNextMezzoTarga(value).replace(/[^A-Z0-9]/g, "");
}

function normalizeTipoDocumento(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/\s+/g, "");
}

function detectCurrencyFromText(value: unknown): NextDocumentiCostiCurrency {
  if (!value) return "UNKNOWN";
  const text = String(value).toUpperCase();
  if (text.includes("CHF") || text.includes("FR.")) return "CHF";
  if (text.includes("EUR") || text.includes("EURO")) return "EUR";
  return "UNKNOWN";
}

function resolveCurrencyFromRecord(record: RawRecord): NextDocumentiCostiCurrency {
  const direct = detectCurrencyFromText(record.valuta ?? record.currency);
  if (direct !== "UNKNOWN") return direct;

  const source = [
    record.totaleDocumento,
    record.importo,
    record.totale,
    record.importoTotale,
    record.totaleFattura,
    record.totale_con_iva,
    record.importoTotaleDocumento,
    record.testo,
    record.imponibile,
    record.ivaImporto,
    record.importoPagamento,
    record.numeroDocumento,
    record.fornitore,
    record.fornitoreLabel,
    record.descrizione,
  ]
    .filter(Boolean)
    .join(" ");

  return detectCurrencyFromText(source);
}

function parseAmountAny(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  let raw = String(value).trim();
  if (!raw) return null;

  raw = raw.toUpperCase();
  raw = raw.replace(/CHF|EUR|EURO/g, "");
  raw = raw.replace(/[\s'\u00A0]/g, "");

  if (raw.includes(",") && raw.includes(".")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",")) {
    raw = raw.replace(",", ".");
  }

  raw = raw.replace(/[^0-9.-]/g, "");
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractImportoFromRaw(record: RawRecord): number | null {
  const candidates = [
    record.importo,
    record.totaleDocumento,
    record.totale,
    record.importoTotale,
    record.totaleFattura,
    record.totale_con_iva,
    record.importoTotaleDocumento,
  ];

  for (const candidate of candidates) {
    const parsed = parseAmountAny(candidate);
    if (parsed !== null) return parsed;
  }

  return null;
}

function parseDateFlexible(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object" && value !== null) {
    const timestampLike = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof timestampLike.toDate === "function") {
      const date = timestampLike.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }

    if (typeof timestampLike.seconds === "number") {
      const date = new Date(timestampLike.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof timestampLike._seconds === "number") {
      const date = new Date(timestampLike._seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const dmyMatch = raw.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
  );
  if (dmyMatch) {
    const yearRaw = Number(dmyMatch[3]);
    const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
    const month = Number(dmyMatch[2]) - 1;
    const day = Number(dmyMatch[1]);
    const hours = Number(dmyMatch[4] ?? "12");
    const minutes = Number(dmyMatch[5] ?? "00");
    const date = new Date(year, month, day, hours, minutes, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
}

function formatLegacyDateLabel(timestamp: number | null): string | null {
  if (timestamp === null) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${dd} ${mm} ${yyyy}`;
}

function resolveDateFields(args: {
  primary: unknown;
  fallbacks?: unknown[];
}): {
  dateLabel: string | null;
  sortTimestamp: number | null;
  quality: NextDocumentiCostiFieldQuality;
} {
  const { primary, fallbacks = [] } = args;
  const sortTimestamp = [primary, ...fallbacks]
    .map((value) => toTimestamp(value))
    .find((value): value is number => value !== null) ?? null;
  const rawDateLabel = normalizeOptionalText(primary);
  const dateLabel = rawDateLabel ?? formatLegacyDateLabel(sortTimestamp);

  return {
    dateLabel,
    sortTimestamp,
    quality: rawDateLabel ? "certo" : sortTimestamp !== null ? "ricostruito" : "non_disponibile",
  };
}

function unwrapStorageArray(
  rawDoc: Record<string, unknown> | null
): { datasetShape: NextLegacyDatasetShape; items: unknown[] } {
  return unwrapStorageArrayWithPreferredKeys(rawDoc);
}

function unwrapStorageArrayWithPreferredKeys(
  rawDoc: Record<string, unknown> | null,
  preferredKeys: string[] = []
): { datasetShape: NextLegacyDatasetShape; items: unknown[] } {
  if (!rawDoc) {
    return { datasetShape: "missing", items: [] };
  }

  for (const key of preferredKeys) {
    const candidate = rawDoc[key];
    if (Array.isArray(candidate)) {
      return {
        datasetShape: key === PROCUREMENT_PREVENTIVI_DATASET_KEY.slice(1) ? "preventivi" : "array",
        items: candidate,
      };
    }
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

function extractApprovalSourceKey(approvalKey: string | null): string | null {
  if (!approvalKey) return null;
  const parts = approvalKey.split("__");
  return parts.length >= 3 ? normalizeText(parts[1]) || null : null;
}

function extractApprovalTarga(approvalKey: string | null): string {
  if (!approvalKey) return "";
  const [rawTarga = ""] = approvalKey.split("__");
  return normalizeTarga(rawTarga);
}

function classifyCategory(tipoDocumento: string): NextDocumentiCostiCategory {
  if (tipoDocumento === "PREVENTIVO") return "preventivo";
  if (tipoDocumento === "FATTURA") return "fattura";
  return "documento_utile";
}

function getSourceTypeFromCollection(
  collectionKey: string
): NextDocumentiCostiSourceType {
  switch (collectionKey) {
    case "@documenti_mezzi":
      return "documento_mezzo";
    case "@documenti_magazzino":
      return "documento_magazzino";
    default:
      return "documento_generico";
  }
}

function getSourceLabel(sourceType: NextDocumentiCostiSourceType): string {
  switch (sourceType) {
    case "costo_mezzo":
      return "Costo mezzo";
    case "documento_mezzo":
      return "Documento mezzo";
    case "documento_magazzino":
      return "Documento magazzino";
    default:
      return "Documento generico";
  }
}

function buildItemTitle(args: {
  category: NextDocumentiCostiCategory;
  documentTypeLabel: string;
  supplier: string | null;
  fallbackName: string | null;
}): string {
  const { category, documentTypeLabel, supplier, fallbackName } = args;
  const categoryLabel =
    documentTypeLabel ||
    (category === "preventivo"
      ? "Preventivo"
      : category === "fattura"
      ? "Fattura"
      : "Documento utile");

  if (supplier) {
    return `${categoryLabel} - ${supplier}`;
  }

  return fallbackName || categoryLabel;
}

function deriveRecordQuality(fieldQuality: {
  date: NextDocumentiCostiFieldQuality;
  amount: NextDocumentiCostiFieldQuality;
  supplier: NextDocumentiCostiFieldQuality;
  fileUrl: NextDocumentiCostiFieldQuality;
}): NextDocumentiCostiFieldQuality {
  const values = Object.values(fieldQuality);
  if (values.every((value) => value === "certo")) {
    return "certo";
  }

  if (values.some((value) => value === "certo" || value === "ricostruito")) {
    return "ricostruito";
  }

  return "non_disponibile";
}

function normalizeUrlDedupKey(value: string | null): string | null {
  if (!value) return null;

  try {
    const parsed = new URL(value);
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return value.trim().toLowerCase().split("?")[0] || null;
  }
}

function buildSafeCrossSourceDedupKey(item: NextDocumentiCostiReadOnlyItem): string | null {
  const sourceRecordId =
    item.sourceRecordId && !item.sourceRecordId.startsWith("costo-mezzo:")
      ? item.sourceRecordId
      : null;
  if (sourceRecordId) {
    return `record:${item.mezzoTarga}:${item.category}:${sourceRecordId}`;
  }

  const fileKey = normalizeUrlDedupKey(item.fileUrl);
  if (fileKey) {
    return `file:${item.mezzoTarga}:${item.category}:${fileKey}`;
  }

  return null;
}

function buildPotentialDedupGroup(item: NextDocumentiCostiReadOnlyItem): string {
  const supplier = (item.supplier ?? "").trim().toUpperCase() || "NO_SUPPLIER";
  const amount = item.amount !== null ? item.amount.toFixed(2) : "NO_AMOUNT";
  const dateKey =
    item.sortTimestamp !== null
      ? new Date(item.sortTimestamp).toISOString().slice(0, 10)
      : "NO_DATE";
  return `${item.mezzoTarga}:${item.category}:${dateKey}:${amount}:${supplier}`;
}

function preferDocumentSource(sourceType: NextDocumentiCostiSourceType): number {
  switch (sourceType) {
    case "documento_mezzo":
      return 0;
    case "documento_magazzino":
      return 1;
    case "documento_generico":
      return 2;
    default:
      return 3;
  }
}

function pickPreferredItem(items: NextDocumentiCostiReadOnlyItem[]): NextDocumentiCostiReadOnlyItem {
  return [...items].sort((left, right) => {
    const sourceRank = preferDocumentSource(left.sourceType) - preferDocumentSource(right.sourceType);
    if (sourceRank !== 0) return sourceRank;

    const fileRank = Number(Boolean(right.fileUrl)) - Number(Boolean(left.fileUrl));
    if (fileRank !== 0) return fileRank;

    const amountRank = Number(right.amount !== null) - Number(left.amount !== null);
    if (amountRank !== 0) return amountRank;

    const supplierRank = Number(Boolean(right.supplier)) - Number(Boolean(left.supplier));
    if (supplierRank !== 0) return supplierRank;

    const dateRank = Number(right.sortTimestamp !== null) - Number(left.sortTimestamp !== null);
    if (dateRank !== 0) return dateRank;

    return right.id.localeCompare(left.id, "it", { sensitivity: "base" });
  })[0];
}

function mergeDuplicateGroup(
  items: NextDocumentiCostiReadOnlyItem[],
  dedupGroup: string
): NextDocumentiCostiReadOnlyItem {
  const preferred = pickPreferredItem(items);
  const merged = { ...preferred };

  for (const candidate of items) {
    if (candidate.id === preferred.id) continue;

    if (!merged.supplier && candidate.supplier) {
      merged.supplier = candidate.supplier;
      merged.fieldQuality = { ...merged.fieldQuality, supplier: candidate.fieldQuality.supplier };
    }

    if (!merged.fileUrl && candidate.fileUrl) {
      merged.fileUrl = candidate.fileUrl;
      merged.fieldQuality = { ...merged.fieldQuality, fileUrl: candidate.fieldQuality.fileUrl };
    }

    if (!merged.dateLabel && candidate.dateLabel) {
      merged.dateLabel = candidate.dateLabel;
      merged.data = candidate.data;
      merged.sortTimestamp = candidate.sortTimestamp;
      merged.timestamp = candidate.timestamp;
      merged.fieldQuality = { ...merged.fieldQuality, date: candidate.fieldQuality.date };
    }

    if (
      (merged.amount === null && candidate.amount !== null) ||
      (merged.currency === "UNKNOWN" &&
        candidate.amount !== null &&
        candidate.currency !== "UNKNOWN")
    ) {
      merged.amount = candidate.amount;
      merged.importo = candidate.importo;
      merged.currency = candidate.currency;
      merged.valuta = candidate.valuta;
      merged.fieldQuality = { ...merged.fieldQuality, amount: candidate.fieldQuality.amount };
    }
  }

  const mergedFlags = Array.from(
    new Set([
      ...items.flatMap((item) => item.flags),
      dedupGroup.startsWith("record:")
        ? "merged_cross_source_record_id"
        : "merged_cross_source_file_url",
    ])
  );

  return {
    ...merged,
    quality: deriveRecordQuality(merged.fieldQuality),
    dedupGroup,
    flags: mergedFlags,
  };
}

function mapMaterialSupportDocument(
  raw: RawRecord,
  sourceDocId: string
): NextDocumentiMagazzinoSupportDocument | null {
  const rawRows = Array.isArray(raw.voci) ? raw.voci : [];
  if (rawRows.length === 0) return null;

  const dateFields = resolveDateFields({
    primary: raw.dataDocumento,
    fallbacks: [raw.createdAt, raw.updatedAt],
  });

  const voci = rawRows
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as RawRecord;
      const importo = parseAmountAny(row.importo);
      const quantita = parseAmountAny(row.quantita);
      const prezzoUnitario =
        parseAmountAny(row.prezzoUnitario) ??
        (importo !== null && quantita !== null && quantita > 0 ? importo / quantita : null);
      const descrizione = normalizeOptionalText(row.descrizione);

      if (!descrizione && importo === null && quantita === null && prezzoUnitario === null) {
        return null;
      }

      return {
        descrizione,
        prezzoUnitario,
        importo,
        quantita,
      } satisfies NextDocumentiMagazzinoSupportRow;
    })
    .filter((entry): entry is NextDocumentiMagazzinoSupportRow => Boolean(entry));

  if (voci.length === 0) return null;

  return {
    id: `@documenti_magazzino:${sourceDocId}`,
    sourceCollection: "@documenti_magazzino",
    sourceDocId,
    fornitore: normalizeOptionalText(raw.fornitore),
    data: dateFields.dateLabel,
    voci,
  };
}

function sortItems(items: NextDocumentiCostiReadOnlyItem[]): NextDocumentiCostiReadOnlyItem[] {
  return [...items].sort((left, right) => {
    const byTimestamp = (right.sortTimestamp ?? 0) - (left.sortTimestamp ?? 0);
    if (byTimestamp !== 0) return byTimestamp;
    return right.id.localeCompare(left.id, "it", { sensitivity: "base" });
  });
}

function buildAmountTotals(items: NextDocumentiCostiReadOnlyItem[]): NextDocumentiCostiAmountTotals {
  return items.reduce<NextDocumentiCostiAmountTotals>(
    (accumulator, item) => {
      if (item.amount === null) return accumulator;

      accumulator.withAmount += 1;
      if (item.currency === "CHF") {
        accumulator.chf += item.amount;
      } else if (item.currency === "EUR") {
        accumulator.eur += item.amount;
      } else {
        accumulator.unknownCount += 1;
      }

      return accumulator;
    },
    {
      eur: 0,
      chf: 0,
      unknownCount: 0,
      withAmount: 0,
    }
  );
}

function derivePeriodFilterCoverage(args: {
  total: number;
  withReliableDate: number;
}): NextDocumentiCostiPeriodFilterStatus {
  const { total, withReliableDate } = args;
  if (total <= 0 || withReliableDate <= 0) return "non_dimostrabile";
  if (withReliableDate < total) return "parziale";
  return "affidabile";
}

function isItemInPeriod(
  item: NextDocumentiCostiReadOnlyItem,
  period: NextMezzoDocumentiCostiPeriodInput,
): boolean {
  if (!period.appliesFilter) {
    return true;
  }

  if (item.sortTimestamp === null) {
    return false;
  }

  if (period.fromTimestamp !== null && item.sortTimestamp < period.fromTimestamp) {
    return false;
  }

  if (period.toTimestamp !== null && item.sortTimestamp > period.toTimestamp) {
    return false;
  }

  return true;
}

function classifyBusinessLink(
  item: NextDocumentiCostiReadOnlyItem,
): NextDocumentiCostiBusinessLinkClassification {
  return item.sourceType === "costo_mezzo" || item.sourceType === "documento_mezzo"
    ? "diretto"
    : "prudente";
}

function hasVerificationFlag(item: NextDocumentiCostiReadOnlyItem): boolean {
  return item.flags.includes("da_verificare") || item.flags.includes("motivo_verifica_presente");
}

function buildPeriodCoverageNote(args: {
  period: NextMezzoDocumentiCostiPeriodInput;
  coverage: NextDocumentiCostiPeriodFilterStatus;
  totalAvailable: number;
  outsidePeriod: number;
  excludedMissingDate: number;
}): string {
  if (!args.period.appliesFilter) {
    return "Nessun filtro periodo attivo: il layer mostra tutto lo storico leggibile della targa.";
  }

  if (args.totalAvailable === 0) {
    return `Periodo ${args.period.label}: nessun costo o documento leggibile da confrontare con il filtro richiesto.`;
  }

  if (args.coverage === "affidabile") {
    return `Periodo ${args.period.label} applicato in modo affidabile ai record con data leggibile.`;
  }

  if (args.coverage === "parziale") {
    return `Periodo ${args.period.label} applicato in modo prudente: ${args.excludedMissingDate} elementi senza data leggibile restano fuori dal conteggio e ${args.outsidePeriod} risultano fuori intervallo.`;
  }

  return `Periodo ${args.period.label} non pienamente dimostrabile: manca una data leggibile sulla maggior parte dei record storici della targa.`;
}

function derivePeriodReliability(args: {
  directCount: number;
  prudentialCount: number;
  totalCount: number;
  coverage: NextDocumentiCostiPeriodFilterStatus;
  appliesFilter: boolean;
  unverifiableCount: number;
  missingAmountCount: number;
}): NextMezzoDocumentiCostiPeriodView["reliability"] {
  const source: NextDocumentiCostiDecisionReliability =
    args.totalCount === 0
      ? "da_verificare"
      : args.prudentialCount > 0
        ? "prudente"
        : "affidabile";
  const filter: NextDocumentiCostiDecisionReliability =
    !args.appliesFilter
      ? "affidabile"
      : args.coverage === "affidabile"
        ? "affidabile"
        : args.coverage === "parziale"
          ? "prudente"
          : "da_verificare";

  const final: NextDocumentiCostiDecisionReliability =
    args.totalCount === 0
      ? "da_verificare"
      : filter === "da_verificare"
        ? "da_verificare"
        : source === "prudente" || args.unverifiableCount > 0 || args.missingAmountCount > 0
          ? "prudente"
          : "affidabile";

  return { source, filter, final };
}

function buildPeriodActionHint(args: {
  totalCount: number;
  directCount: number;
  prudentialCount: number;
  fattureWithAmount: number;
  documentiDaVerificare: number;
  coverage: NextDocumentiCostiPeriodFilterStatus;
}): string {
  if (args.totalCount === 0) {
    return "Se ti serve una decisione economica o documentale, conviene prima verificare se esistono allegati o costi leggibili nel periodo richiesto.";
  }

  if (args.documentiDaVerificare > 0) {
    return "Conviene controllare prima i documenti marcati da verificare, cosi eviti di basare la decisione su allegati incompleti.";
  }

  if (args.prudentialCount > 0 && args.directCount === 0) {
    return "I collegamenti del periodo sono prudenziali: prima di decidere conviene confermare i documenti direttamente associati alla targa.";
  }

  if (args.coverage !== "affidabile") {
    return "Il filtro periodo resta prudente: usa il quadro come supporto rapido, ma verifica prima i record senza data leggibile.";
  }

  if (args.fattureWithAmount > 0) {
    return "Conviene partire dalle fatture con importo leggibile e dalle voci di costo piu recenti.";
  }

  return "Usa questo quadro per verificare prima i documenti allegati e poi allargare solo gli approfondimenti davvero necessari.";
}

function buildPeriodViewLimitations(args: {
  snapshot: NextMezzoDocumentiCostiSnapshot;
  period: NextMezzoDocumentiCostiPeriodInput;
  periodNote: string;
  prudentialCount: number;
  unverifiableCount: number;
  missingAmountCount: number;
  missingFileCount: number;
}): string[] {
  return [
    args.periodNote,
    args.prudentialCount > 0
      ? `Nel periodo richiesto sono presenti ${args.prudentialCount} collegamenti prudenziali da documenti magazzino o generici: non vanno letti come match certi.`
      : null,
    args.unverifiableCount > 0
      ? `Nel periodo richiesto risultano ${args.unverifiableCount} elementi marcati da verificare o con motivazione di verifica presente.`
      : null,
    args.missingAmountCount > 0
      ? `Una parte di preventivi o fatture del periodo non espone un importo leggibile: i totali restano prudenziali.`
      : null,
    args.missingFileCount > 0
      ? `Una parte dei documenti del periodo non espone un allegato leggibile dal clone: conviene verificarne la completezza prima di usarli come base documentale.`
      : null,
    ...args.snapshot.limitations,
  ].filter((entry): entry is string => Boolean(entry));
}

function deriveNextMezzoDocumentiCostiPeriodView(args: {
  snapshot: NextMezzoDocumentiCostiSnapshot;
  period: NextMezzoDocumentiCostiPeriodInput;
}): NextMezzoDocumentiCostiPeriodView {
  const allItems = args.snapshot.items;
  const items = allItems.filter((item) => isItemInPeriod(item, args.period));
  const preventivi = items.filter((item) => item.category === "preventivo");
  const fatture = items.filter((item) => item.category === "fattura");
  const documentiUtili = items.filter((item) => item.category === "documento_utile");
  const directItems = items.filter((item) => classifyBusinessLink(item) === "diretto");
  const prudentialItems = items.filter((item) => classifyBusinessLink(item) === "prudente");
  const daVerificareItems = items.filter((item) => hasVerificationFlag(item));
  const outsidePeriod = args.period.appliesFilter
    ? allItems.filter(
        (item) => item.sortTimestamp !== null && !isItemInPeriod(item, args.period),
      ).length
    : 0;
  const excludedMissingDate = args.period.appliesFilter
    ? allItems.filter((item) => item.sortTimestamp === null).length
    : 0;
  const coverage = derivePeriodFilterCoverage({
    total: allItems.length,
    withReliableDate: args.snapshot.counts.withReliableDate,
  });
  const periodNote = buildPeriodCoverageNote({
    period: args.period,
    coverage,
    totalAvailable: allItems.length,
    outsidePeriod,
    excludedMissingDate,
  });
  const reliability = derivePeriodReliability({
    directCount: directItems.length,
    prudentialCount: prudentialItems.length,
    totalCount: items.length,
    coverage,
    appliesFilter: args.period.appliesFilter,
    unverifiableCount: daVerificareItems.length,
    missingAmountCount: preventivi.filter((item) => item.amount === null).length +
      fatture.filter((item) => item.amount === null).length,
  });
  const sortedByAmount = [...items].sort((left, right) => {
    const amountDelta = (right.amount ?? -1) - (left.amount ?? -1);
    if (amountDelta !== 0) return amountDelta;
    return (right.sortTimestamp ?? 0) - (left.sortTimestamp ?? 0);
  });
  const sortedByRecency = sortItems(items);

  return {
    mezzoTarga: args.snapshot.mezzoTarga,
    period: {
      label: args.period.label,
      appliesFilter: args.period.appliesFilter,
      coverage,
      note: periodNote,
    },
    items,
    counts: {
      total: items.length,
      totalAvailable: allItems.length,
      direct: directItems.length,
      prudential: prudentialItems.length,
      preventivi: preventivi.length,
      fatture: fatture.length,
      documentiUtili: documentiUtili.length,
      withAmount: items.filter((item) => item.amount !== null).length,
      withoutAmount: preventivi.filter((item) => item.amount === null).length +
        fatture.filter((item) => item.amount === null).length,
      withFile: items.filter((item) => Boolean(item.fileUrl)).length,
      withoutFile: items.filter((item) => !item.fileUrl).length,
      withReliableDate: items.filter((item) => item.sortTimestamp !== null).length,
      withoutReliableDate: items.filter((item) => item.sortTimestamp === null).length,
      daVerificare: daVerificareItems.length,
      outsidePeriod,
      excludedMissingDate,
    },
    totals: {
      preventivi: buildAmountTotals(preventivi),
      fatture: buildAmountTotals(fatture),
    },
    highlights: {
      costi: sortedByAmount.filter((item) => item.category !== "documento_utile").slice(0, 4),
      documenti: sortedByRecency
        .filter((item) => item.category === "documento_utile")
        .slice(0, 4),
      storico: sortedByRecency.slice(0, 6),
    },
    reliability,
    limitations: buildPeriodViewLimitations({
      snapshot: args.snapshot,
      period: args.period,
      periodNote,
      prudentialCount: prudentialItems.length,
      unverifiableCount: daVerificareItems.length,
      missingAmountCount: preventivi.filter((item) => item.amount === null).length +
        fatture.filter((item) => item.amount === null).length,
      missingFileCount: items.filter((item) => !item.fileUrl).length,
    }),
    actionHint: buildPeriodActionHint({
      totalCount: items.length,
      directCount: directItems.length,
      prudentialCount: prudentialItems.length,
      fattureWithAmount: buildAmountTotals(fatture).withAmount,
      documentiDaVerificare: daVerificareItems.length,
      coverage,
    }),
  };
}

function mapCostoMezzoRecordAny(
  raw: RawRecord,
  index: number
): NextDocumentiCostiReadOnlyItem | null {
  const itemTarga = normalizeTarga(raw.mezzoTarga ?? raw.targa);
  if (!itemTarga) return null;

  const tipoDocumento = normalizeTipoDocumento(raw.tipo);
  const category = classifyCategory(tipoDocumento);
  const dateFields = resolveDateFields({ primary: raw.data });
  const amount = parseAmountAny(raw.importo);
  const supplier = normalizeOptionalText(raw.fornitoreLabel ?? raw.fornitore);
  const fileUrl = normalizeOptionalText(raw.fileUrl);
  const sourceDocId = normalizeOptionalText(raw.id);
  const sourceRecordId = sourceDocId ?? `costo-mezzo:${itemTarga}:${index}`;
  const title = buildItemTitle({
    category,
    documentTypeLabel: tipoDocumento || "",
    supplier,
    fallbackName: normalizeOptionalText(raw.descrizione),
  });
  const fieldQuality = {
    date: dateFields.quality,
    amount: amount !== null ? "certo" : "non_disponibile",
    supplier: supplier ? "certo" : "non_disponibile",
    fileUrl: fileUrl ? "certo" : "non_disponibile",
  } satisfies NextDocumentiCostiReadOnlyItem["fieldQuality"];
  const currency = resolveCurrencyFromRecord(raw);

  return {
    id: sourceRecordId,
    mezzoTarga: itemTarga,
    targa: itemTarga,
    category,
    categoria: category,
    documentTypeLabel: tipoDocumento || "Documento costo",
    tipoDocumento: tipoDocumento || "DOCUMENTO_COSTO",
    title,
    descrizione: title,
    supplier,
    dateLabel: dateFields.dateLabel,
    data: dateFields.dateLabel,
    sortTimestamp: dateFields.sortTimestamp,
    timestamp: dateFields.sortTimestamp,
    amount,
    importo: amount,
    currency,
    valuta: currency,
    fileUrl,
    sourceCollection: `${STORAGE_COLLECTION}/${COSTI_DATASET_KEY}`,
    sourceKey: "@costiMezzo",
    sourceDocId,
    sourceRecordId,
    sourceType: "costo_mezzo",
    sourceLabel: getSourceLabel("costo_mezzo"),
    archiveCategory: null,
    fieldQuality,
    quality: deriveRecordQuality(fieldQuality),
    dedupGroup: null,
    flags: [
      "source_storage_costi_mezzo",
      category === "documento_utile" ? "tipo_non_standard_da_costi" : "tipo_standard_costi",
    ],
  };
}

function mapDocumentoRecordAny(args: {
  raw: RawRecord;
  collectionKey: string;
  sourceDocId: string;
}): NextDocumentiCostiReadOnlyItem | null {
  const { raw, collectionKey, sourceDocId } = args;
  const itemTarga = normalizeTarga(raw.targa);
  if (!itemTarga) return null;

  const tipoDocumento = normalizeTipoDocumento(raw.tipoDocumento);
  const category = classifyCategory(tipoDocumento);
  const sourceType = getSourceTypeFromCollection(collectionKey);
  const dateFields = resolveDateFields({
    primary: raw.dataDocumento,
    fallbacks: [raw.createdAt, raw.updatedAt],
  });
  const amount = extractImportoFromRaw(raw);
  const supplier = normalizeOptionalText(raw.fornitore);
  const fileUrl = normalizeOptionalText(raw.fileUrl);
  const sourceRecordId = normalizeOptionalText(raw.id) ?? sourceDocId;
  const archiveCategory = normalizeOptionalText(raw.categoriaArchivio);
  const fallbackName = normalizeOptionalText(raw.nomeFile ?? raw.numeroDocumento);
  const title = buildItemTitle({
    category,
    documentTypeLabel: tipoDocumento || "",
    supplier,
    fallbackName,
  });
  const flags = [
    "source_firestore_documenti",
    archiveCategory ? `archivio_${archiveCategory.toLowerCase()}` : "archivio_non_valorizzato",
  ];

  if (raw.daVerificare === true) {
    flags.push("da_verificare");
  }
  if (normalizeOptionalText(raw.motivoVerifica)) {
    flags.push("motivo_verifica_presente");
  }
  const fieldQuality = {
    date: dateFields.quality,
    amount: amount !== null ? "certo" : "non_disponibile",
    supplier: supplier ? "certo" : "non_disponibile",
    fileUrl: fileUrl ? "certo" : "non_disponibile",
  } satisfies NextDocumentiCostiReadOnlyItem["fieldQuality"];
  const currency = resolveCurrencyFromRecord(raw);

  return {
    id: `${collectionKey}:${sourceDocId}`,
    mezzoTarga: itemTarga,
    targa: itemTarga,
    category,
    categoria: category,
    documentTypeLabel:
      tipoDocumento ||
      (category === "documento_utile" ? "Documento utile" : "Documento costo"),
    tipoDocumento:
      tipoDocumento || (category === "documento_utile" ? "DOCUMENTO_UTILE" : "DOCUMENTO_COSTO"),
    title,
    descrizione: title,
    supplier,
    dateLabel: dateFields.dateLabel,
    data: dateFields.dateLabel,
    sortTimestamp: dateFields.sortTimestamp,
    timestamp: dateFields.sortTimestamp,
    amount,
    importo: amount,
    currency,
    valuta: currency,
    fileUrl,
    sourceCollection: collectionKey,
    sourceKey: collectionKey,
    sourceDocId,
    sourceRecordId,
    sourceType,
    sourceLabel: getSourceLabel(sourceType),
    archiveCategory,
    fieldQuality,
    quality: deriveRecordQuality(fieldQuality),
    dedupGroup: null,
    flags,
  };
}

type NextDocumentiCostiSources = {
  costiDataset: {
    datasetShape: NextLegacyDatasetShape;
    items: unknown[];
  };
  documentSnapshots: Array<Awaited<ReturnType<typeof getDocs>> | null>;
  cloneDocuments: ReturnType<typeof readNextInternalAiCloneDocumenti>;
  readFailures: string[];
};

export type ReadNextDocumentiCostiSnapshotOptions = {
  includeCloneDocuments?: boolean;
};

export type NextIADocumentiArchiveItem = {
  id: string;
  sourceKey: string;
  sourceDocId: string;
  tipoDocumento: string;
  categoriaArchivio: string | null;
  targa: string | null;
  dataDocumento: string | null;
  sortTimestamp: number | null;
  totaleDocumento: string | number | null;
  fornitore: string | null;
  fileUrl: string | null;
  valuta: NextDocumentiCostiCurrency;
  currency: NextDocumentiCostiCurrency;
  testo: string | null;
  imponibile: string | null;
  ivaImporto: string | null;
  importoPagamento: string | null;
  numeroDocumento: string | null;
  daVerificare: boolean;
};

export type NextIADocumentiArchiveSnapshot = {
  domainCode: "D08-IA-DOCUMENTI";
  domainName: "Archivio documenti IA read-only";
  logicalDatasets: readonly string[];
  activeReadOnlyDatasets: readonly string[];
  items: NextIADocumentiArchiveItem[];
  counts: {
    total: number;
    documentiMezzo: number;
    documentiMagazzino: number;
    documentiGenerici: number;
    withFile: number;
    withoutFile: number;
    valutaDaVerificare: number;
    documentiDaVerificare: number;
  };
  limitations: string[];
};

function resolveArchiveTotalValue(raw: RawRecord): string | number | null {
  const parsed = extractImportoFromRaw(raw);
  if (parsed !== null) {
    return parsed;
  }

  return (
    normalizeOptionalText(raw.totaleDocumento) ??
    normalizeOptionalText(raw.importo) ??
    normalizeOptionalText(raw.totale) ??
    normalizeOptionalText(raw.importoTotale) ??
    normalizeOptionalText(raw.importoTotaleDocumento) ??
    null
  );
}

function mapIADocumentiArchiveRecord(args: {
  raw: RawRecord;
  collectionKey: string;
  sourceDocId: string;
}): NextIADocumentiArchiveItem {
  const { raw, collectionKey, sourceDocId } = args;
  const dateFields = resolveDateFields({
    primary: raw.dataDocumento,
    fallbacks: [raw.createdAt, raw.updatedAt],
  });
  const tipoDocumento = normalizeTipoDocumento(raw.tipoDocumento) || "DOCUMENTO";
  const currency = resolveCurrencyFromRecord(raw);

  return {
    id: `${collectionKey}:${sourceDocId}`,
    sourceKey: collectionKey,
    sourceDocId,
    tipoDocumento,
    categoriaArchivio: normalizeOptionalText(raw.categoriaArchivio),
    targa: normalizeOptionalText(raw.targa ?? raw.mezzoTarga),
    dataDocumento: dateFields.dateLabel,
    sortTimestamp: dateFields.sortTimestamp,
    totaleDocumento: resolveArchiveTotalValue(raw),
    fornitore: normalizeOptionalText(raw.fornitore),
    fileUrl: normalizeOptionalText(raw.fileUrl),
    valuta: currency,
    currency,
    testo: normalizeOptionalText(raw.testo),
    imponibile: normalizeOptionalText(raw.imponibile),
    ivaImporto: normalizeOptionalText(raw.ivaImporto),
    importoPagamento: normalizeOptionalText(raw.importoPagamento),
    numeroDocumento: normalizeOptionalText(raw.numeroDocumento ?? raw.nomeFile),
    daVerificare:
      raw.daVerificare === true || Boolean(normalizeOptionalText(raw.motivoVerifica)),
  };
}

function sortIADocumentiArchiveItems(items: NextIADocumentiArchiveItem[]): NextIADocumentiArchiveItem[] {
  return [...items].sort((left, right) => {
    const timestampOrder = (right.sortTimestamp ?? -1) - (left.sortTimestamp ?? -1);
    if (timestampOrder !== 0) return timestampOrder;

    const dateOrder = (right.dataDocumento ?? "").localeCompare(left.dataDocumento ?? "", "it", {
      sensitivity: "base",
    });
    if (dateOrder !== 0) return dateOrder;

    const typeOrder = left.tipoDocumento.localeCompare(right.tipoDocumento, "it", {
      sensitivity: "base",
    });
    if (typeOrder !== 0) return typeOrder;

    return left.id.localeCompare(right.id, "it", { sensitivity: "base" });
  });
}

function mapCloneDocumentoToRaw(
  record: ReturnType<typeof readNextInternalAiCloneDocumenti>[number],
): RawRecord {
  return {
    id: record.id,
    categoriaArchivio: record.categoriaArchivio,
    tipoDocumento: record.tipoDocumento,
    targa: record.targa ?? record.mezzoTarga,
    mezzoTarga: record.mezzoTarga ?? record.targa,
    fornitore: record.fornitore,
    numeroDocumento: record.numeroDocumento,
    nomeFile: record.numeroDocumento,
    dataDocumento: record.dataDocumento,
    totaleDocumento: record.totaleDocumento,
    valuta: record.valuta,
    testo: record.testo,
    fileUrl: record.fileUrl,
    daVerificare: record.needsReview,
    motivoVerifica: record.needsReview ? "documento_clone_locale" : null,
    righe: record.righe.map((row) => ({
      id: row.id,
      descrizione: row.descrizione,
      quantita: row.quantita,
      unita: row.unita,
      prezzoUnitario: row.prezzoUnitario,
      importo: row.importo,
    })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    source: record.source,
  };
}

async function readDocumentiCostiSources(
  options: ReadNextDocumentiCostiSnapshotOptions = {},
): Promise<NextDocumentiCostiSources> {
  const includeCloneDocuments = options.includeCloneDocuments !== false;
  const [costiResult, ...documentResults] = await Promise.allSettled([
    readCostiMezzoDataset(),
    ...DOCUMENTI_COLLECTION_KEYS.map((collectionKey) => getDocs(collection(db, collectionKey))),
  ]);
  const readFailures: string[] = [];
  const costiDataset =
    costiResult.status === "fulfilled"
      ? costiResult.value
      : ((readFailures.push("storage/@costiMezzo"), {
          datasetShape: "missing",
          items: [],
        }) as { datasetShape: NextLegacyDatasetShape; items: unknown[] });
  const documentSnapshots = documentResults.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    readFailures.push(DOCUMENTI_COLLECTION_KEYS[index]);
    return null;
  });

  return {
    costiDataset,
    documentSnapshots,
    cloneDocuments: includeCloneDocuments ? readNextInternalAiCloneDocumenti() : [],
    readFailures,
  };
}

function buildAllDocumentiCostiItems(args: {
  costiDataset: NextDocumentiCostiSources["costiDataset"];
  documentSnapshots: NextDocumentiCostiSources["documentSnapshots"];
  cloneDocuments: NextDocumentiCostiSources["cloneDocuments"];
}): {
  items: NextDocumentiCostiReadOnlyItem[];
  materialSupportDocuments: NextDocumentiMagazzinoSupportDocument[];
} {
  const { costiDataset, documentSnapshots, cloneDocuments } = args;

  const costiItems = costiDataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return mapCostoMezzoRecordAny(entry as RawRecord, index);
    })
    .filter((entry): entry is NextDocumentiCostiReadOnlyItem => Boolean(entry));

  const documentItems = documentSnapshots.flatMap((snapshot, index) => {
    if (!snapshot) return [];
    const collectionKey = DOCUMENTI_COLLECTION_KEYS[index];
    return snapshot.docs
      .map((docSnapshot) =>
        mapDocumentoRecordAny({
          raw: (docSnapshot.data() ?? {}) as RawRecord,
          collectionKey,
          sourceDocId: docSnapshot.id,
        })
      )
      .filter((entry): entry is NextDocumentiCostiReadOnlyItem => Boolean(entry));
  });

  const cloneDocumentItems = cloneDocuments
    .map((record) =>
      mapDocumentoRecordAny({
        raw: mapCloneDocumentoToRaw(record),
        collectionKey: record.collectionKey,
        sourceDocId: record.id,
      }),
    )
    .filter((entry): entry is NextDocumentiCostiReadOnlyItem => Boolean(entry));

  const materialSupportDocuments = (documentSnapshots[1]?.docs ?? [])
    .map((docSnapshot) =>
      mapMaterialSupportDocument((docSnapshot.data() ?? {}) as RawRecord, docSnapshot.id)
    )
    .filter((entry): entry is NextDocumentiMagazzinoSupportDocument => Boolean(entry))
    .concat(
      cloneDocuments
        .filter((record) => record.collectionKey === "@documenti_magazzino")
        .map((record) => mapMaterialSupportDocument(mapCloneDocumentoToRaw(record), record.id))
        .filter((entry): entry is NextDocumentiMagazzinoSupportDocument => Boolean(entry)),
    );

  return {
    items: sortItems(dedupItems([...costiItems, ...documentItems, ...cloneDocumentItems])),
    materialSupportDocuments,
  };
}

function dedupItems(items: NextDocumentiCostiReadOnlyItem[]): NextDocumentiCostiReadOnlyItem[] {
  const seen = new Set<string>();
  const exactDeduped = items.filter((item) => {
    const key = `${item.sourceCollection}:${item.sourceDocId ?? item.sourceRecordId ?? item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const safeGroups = new Map<string, NextDocumentiCostiReadOnlyItem[]>();
  const passthrough: NextDocumentiCostiReadOnlyItem[] = [];

  for (const item of exactDeduped) {
    const safeKey = buildSafeCrossSourceDedupKey(item);
    if (!safeKey) {
      passthrough.push({
        ...item,
        dedupGroup: buildPotentialDedupGroup(item),
      });
      continue;
    }

    const group = safeGroups.get(safeKey) ?? [];
    group.push(item);
    safeGroups.set(safeKey, group);
  }

  const merged = [
    ...passthrough,
    ...Array.from(safeGroups.entries()).map(([safeKey, group]) =>
      group.length === 1
        ? {
            ...group[0],
            dedupGroup: safeKey,
          }
        : mergeDuplicateGroup(group, safeKey)
    ),
  ];

  return merged.map((item) =>
    item.dedupGroup
      ? item
      : {
          ...item,
          dedupGroup: buildPotentialDedupGroup(item),
        }
  );
}

function buildLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  groups: NextMezzoDocumentiCostiSnapshot["groups"];
  counts: NextMezzoDocumentiCostiSnapshot["counts"];
  sourceCounts: NextMezzoDocumentiCostiSnapshot["sourceCounts"];
  materialCostSupport: NextMezzoDocumentiCostiSnapshot["materialCostSupport"];
  readFailures: string[];
}): string[] {
  const { datasetShape, groups, counts, sourceCounts, materialCostSupport, readFailures } = args;

  return [
    "Il layer legge solo `@costiMezzo` e le collezioni `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, sempre con filtro targa e output mezzo-centrico pulito.",
    "Il layer non incorpora `@analisi_economica_mezzi`: quello snapshot resta separato e viene letto dall'aggregatore dossier, non come documento/costo base.",
    "Il layer non legge `@preventivi` e non apre il workflow globale Acquisti: contratto allegati e convergenza D06 verso Dossier restano `DA VERIFICARE`.",
    "Il layer non legge `@preventivi_approvazioni`, non espone approvazioni, non replica `CapoCostiMezzo` e non apre `AnalisiEconomica` completa.",
    counts.documentiUtili > 0
      ? "Gli altri documenti utili sono inclusi solo se hanno una `targa` leggibile nel repo reale; nessuna inferenza debole da file name o testo libero."
      : null,
    sourceCounts.documentiMagazzino > 0
      ? "I documenti magazzino entrano solo come lettura documentale correlata al mezzo: nessun ingresso del dominio stock/movimenti nel Dossier."
      : null,
    materialCostSupport.documentCount > 0
      ? "Per il costo materiali del Dossier il layer espone anche un supporto read-only derivato dalle righe `voci` di `@documenti_magazzino`, senza aprire il dominio ordini/inventario."
      : null,
    counts.withAmount < groups.preventivi.length + groups.fatture.length
      ? "Una parte di preventivi o fatture non espone un importo parsabile: i totali restano prudenziali e non forzano ricostruzioni."
      : null,
    counts.total > 0 &&
    derivePeriodFilterCoverage({
      total: counts.total,
      withReliableDate: counts.withReliableDate,
    }) !== "affidabile"
      ? "Una parte dei documenti/costi collegati non espone una data evento parsabile: il filtro periodo resta prudenziale."
      : null,
    datasetShape === "unsupported"
      ? "Il dataset `@costiMezzo` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
      : null,
    ...readFailures.map(
      (entry) => `Lettura parziale: la sorgente ${entry} non e stata letta dal layer e viene trattata come non disponibile.`
    ),
  ].filter((entry): entry is string => Boolean(entry));
}

function buildFleetLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  counts: NextDocumentiCostiFleetSnapshot["counts"];
  sourceCounts: NextDocumentiCostiFleetSnapshot["sourceCounts"];
  materialCostSupport: NextDocumentiCostiFleetSnapshot["materialCostSupport"];
  readFailures: string[];
}): string[] {
  const { datasetShape, counts, sourceCounts, materialCostSupport, readFailures } = args;

  return [
    "Il layer globale legge solo `@costiMezzo` e le collezioni `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, sempre in sola lettura.",
    "La vista flotta aggrega solo record con `targa` leggibile: nessuna inferenza debole da testo libero o file name.",
    "Il layer globale non incorpora `@analisi_economica_mezzi`: quello snapshot resta separato e non va confuso con i documenti/costi base.",
    "Il layer non legge `@preventivi`, non apre il workflow Acquisti e non riattiva PDF o approvazioni scriventi.",
    "Il layer globale non incorpora `@preventivi_approvazioni`: quello stato resta un supporto separato dell'Area Capo e va trattato in sola lettura.",
    counts.withAmount < counts.preventivi + counts.fatture
      ? "Una parte di preventivi o fatture non espone un importo parsabile: i totali flotta restano prudenziali e non forzano ricostruzioni."
      : null,
    counts.total > 0 &&
    derivePeriodFilterCoverage({
      total: counts.total,
      withReliableDate: counts.withReliableDate,
    }) !== "affidabile"
      ? "Una parte dei documenti/costi aggregati non espone una data evento parsabile: il filtro periodo resta prudenziale."
      : null,
    sourceCounts.documentiMagazzino > 0
      ? "I documenti magazzino entrano solo come lettura documentale/costi correlata al mezzo: nessun ingresso del dominio stock o movimenti."
      : null,
    materialCostSupport.documentCount > 0
      ? "Il supporto righe `voci` di `@documenti_magazzino` resta disponibile solo come ausilio read-only; non apre inventario o procurement."
      : null,
    datasetShape === "unsupported"
      ? "Il dataset `@costiMezzo` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
      : null,
    ...readFailures.map(
      (entry) => `Lettura parziale: la sorgente ${entry} non e stata letta dal layer e viene trattata come non disponibile.`
    ),
  ].filter((entry): entry is string => Boolean(entry));
}

async function readCostiMezzoDataset(): Promise<{
  datasetShape: NextLegacyDatasetShape;
  items: unknown[];
}> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, COSTI_DATASET_KEY));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  return unwrapStorageArray(rawDoc);
}

function buildProcurementSupportLimitations(args: {
  counts: NextDocumentiCostiProcurementSupportSnapshot["counts"];
  matching: NextDocumentiCostiProcurementSupportSnapshot["matching"];
  perimeterDecision: NextDocumentiCostiProcurementSupportSnapshot["perimeterDecision"];
  datasetShapes: NextDocumentiCostiProcurementSupportSnapshot["datasetShapes"];
  readFailures: string[];
}): string[] {
  const { counts, matching, perimeterDecision, datasetShapes, readFailures } = args;

  return [
    "`@preventivi` appartiene al workflow procurement globale: non e un dataset mezzo-centrico e non va fuso nel blocco documenti/costi diretti.",
    counts.preventiviConTargaDiretta > 0
      ? `Il dataset \`@preventivi\` espone ${counts.preventiviConTargaDiretta} record con targa diretta, ma resta comunque solo supporto parziale finche non esiste un layer mezzo-centrico dedicato.`
      : "Il dataset `@preventivi` non espone oggi una targa diretta sui record letti: il matching col mezzo non e dimostrabile.",
    counts.approvazioniMezzo > 0
      ? `Le approvazioni lette per la targa sono ${counts.approvazioniMezzo}; di queste ${counts.approvazioniSuDocumentiDiretti} annotano documenti/costi diretti gia mezzo-centrici e ${counts.approvazioniSuPreventiviGlobali} puntano al dataset procurement globale.`
      : "Nessuna approvazione letta per questa targa in `@preventivi_approvazioni`.",
    matching.approvazioni === "forte"
      ? "`@preventivi_approvazioni` puo avere un collegamento forte alla targa, ma rappresenta solo stato approvativo read-only e non un documento/costo base."
      : null,
    perimeterDecision === "fuori_perimetro"
      ? "Decisione corrente: il procurement resta fuori dal report mezzo IA come blocco economico diretto."
      : perimeterDecision === "parziale"
      ? "Decisione corrente: il procurement puo entrare solo come supporto parziale separato, non come blocco economico diretto."
      : "Decisione corrente: il procurement puo entrare con match forte.",
    datasetShapes.preventivi === "unsupported"
      ? "Il dataset `@preventivi` non e in una shape pienamente leggibile dal supporto clone-safe."
      : null,
    datasetShapes.approvazioni === "unsupported"
      ? "Il dataset `@preventivi_approvazioni` non e in una shape pienamente leggibile dal supporto clone-safe."
      : null,
    ...readFailures.map(
      (entry) => `Lettura parziale: la sorgente ${entry} non e stata letta e viene trattata come non disponibile.`
    ),
  ].filter((entry): entry is string => Boolean(entry));
}

function normalizeProcurementApprovalStatus(value: unknown): "pending" | "approved" | "rejected" {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "approved" || normalized === "rejected") {
    return normalized;
  }
  return "pending";
}

function buildProcurementReadOnlyLimitations(args: {
  ordiniShape: NextLegacyDatasetShape;
  preventiviShape: NextLegacyDatasetShape;
  approvazioniShape: NextLegacyDatasetShape;
  listinoShape: NextLegacyDatasetShape;
  counts: NextProcurementReadOnlySnapshot["counts"];
  readFailures: string[];
}): string[] {
  const { ordiniShape, preventiviShape, approvazioniShape, listinoShape, counts, readFailures } = args;
  return [
    "Nel perimetro NEXT il procurement resta clone-safe: ordini, arrivi e dettaglio ordine sono consultabili e aggiornabili solo localmente, senza scritture business sulla madre.",
    counts.preventiviTotali > 0
      ? `I preventivi letti sono ${counts.preventiviTotali}, ma restano supporto prudente: il clone non riapre upload, parsing IA, salvataggi o workflow approvativi reali.`
      : "Il dataset `@preventivi` non restituisce oggi preventivi leggibili nel clone-safe letto da questo task.",
    counts.approvazioniTotali > 0
      ? `Le approvazioni lette sono ${counts.approvazioniTotali}, ma restano solo stato preview/read-only: nessun tasto approva, rifiuta o PDF timbrato e operativo nella NEXT.`
      : "Il dataset `@preventivi_approvazioni` non restituisce oggi stati approvativi leggibili per questo riepilogo.",
    counts.listinoVoci > 0
      ? `Il listino espone ${counts.listinoVoci} voci leggibili, ma la superficie NEXT non apre edit, import o consolidamento listino.`
      : "Il dataset `@listino_prezzi` non restituisce oggi voci leggibili abbastanza stabili per una superficie operativa.",
    ordiniShape === "unsupported"
      ? "Il dataset `@ordini` non e in una shape pienamente leggibile dal layer clone-safe."
      : null,
    preventiviShape === "unsupported"
      ? "Il dataset `@preventivi` non e in una shape pienamente leggibile dal layer clone-safe."
      : null,
    approvazioniShape === "unsupported"
      ? "Il dataset `@preventivi_approvazioni` non e in una shape pienamente leggibile dal layer clone-safe."
      : null,
    listinoShape === "unsupported"
      ? "Il dataset `@listino_prezzi` non e in una shape pienamente leggibile dal layer clone-safe."
      : null,
    ...readFailures.map(
      (entry) => `Lettura parziale: la sorgente ${entry} non e stata letta e viene trattata come non disponibile.`,
    ),
  ].filter((entry): entry is string => Boolean(entry));
}

export async function readNextDocumentiCostiProcurementSupportSnapshot(
  targa: string
): Promise<NextDocumentiCostiProcurementSupportSnapshot> {
  const mezzoTarga = normalizeTarga(targa);
  const [preventiviResult, approvalsResult] = await Promise.allSettled([
    getDoc(doc(db, STORAGE_COLLECTION, PROCUREMENT_PREVENTIVI_DATASET_KEY)),
    getDoc(doc(db, STORAGE_COLLECTION, PROCUREMENT_APPROVALS_DATASET_KEY)),
  ]);
  const readFailures: string[] = [];

  const preventiviDataset =
    preventiviResult.status === "fulfilled"
      ? unwrapStorageArrayWithPreferredKeys(
          preventiviResult.value.exists()
            ? ((preventiviResult.value.data() as Record<string, unknown>) ?? null)
            : null,
          ["preventivi"]
        )
      : ((readFailures.push(`storage/${PROCUREMENT_PREVENTIVI_DATASET_KEY}`), {
          datasetShape: "missing",
          items: [],
        }) as { datasetShape: NextLegacyDatasetShape; items: unknown[] });

  const approvalsDataset =
    approvalsResult.status === "fulfilled"
      ? unwrapStorageArray(
          approvalsResult.value.exists()
            ? ((approvalsResult.value.data() as Record<string, unknown>) ?? null)
            : null
        )
      : ((readFailures.push(`storage/${PROCUREMENT_APPROVALS_DATASET_KEY}`), {
          datasetShape: "missing",
          items: [],
        }) as { datasetShape: NextLegacyDatasetShape; items: unknown[] });

  const preventiviItems = preventiviDataset.items.filter(
    (entry): entry is RawRecord => Boolean(entry) && typeof entry === "object"
  );
  const approvalItems = approvalsDataset.items.filter(
    (entry): entry is RawRecord => Boolean(entry) && typeof entry === "object"
  );

  const preventiviConTargaDiretta = preventiviItems.filter((entry) =>
    Boolean(normalizeTarga(entry.targa ?? entry.mezzoTarga))
  );
  const preventiviMatchForte = preventiviConTargaDiretta.filter(
    (entry) => normalizeTarga(entry.targa ?? entry.mezzoTarga) === mezzoTarga
  );

  const approvalsMezzo = approvalItems.filter((entry) => {
    const approvalKey = normalizeOptionalText(entry.id);
    const entryTarga = normalizeTarga(entry.targa ?? entry.mezzoTarga);
    return entryTarga === mezzoTarga || extractApprovalTarga(approvalKey) === mezzoTarga;
  });

  const approvazioniSuPreventiviGlobali = approvalsMezzo.filter(
    (entry) => extractApprovalSourceKey(normalizeOptionalText(entry.id)) === PROCUREMENT_PREVENTIVI_DATASET_KEY
  ).length;
  const approvazioniSuDocumentiDiretti = approvalsMezzo.filter((entry) => {
    const sourceKey = extractApprovalSourceKey(normalizeOptionalText(entry.id));
    return sourceKey ? DIRECT_DOCUMENT_SOURCE_KEYS.has(sourceKey) : false;
  }).length;

  const matching = {
    preventivi: preventiviMatchForte.length > 0 ? "forte" : "non_dimostrabile",
    approvazioni: approvalsMezzo.length > 0 ? "forte" : "non_dimostrabile",
  } satisfies NextDocumentiCostiProcurementSupportSnapshot["matching"];

  const perimeterDecision: NextDocumentiCostiProcurementPerimeterDecision =
    preventiviMatchForte.length > 0 ? "parziale" : "fuori_perimetro";

  const counts = {
    preventiviGlobali: preventiviItems.length,
    preventiviConTargaDiretta: preventiviConTargaDiretta.length,
    preventiviMatchForte: preventiviMatchForte.length,
    approvazioniGlobali: approvalItems.length,
    approvazioniMezzo: approvalsMezzo.length,
    approvazioniSuPreventiviGlobali,
    approvazioniSuDocumentiDiretti,
  } satisfies NextDocumentiCostiProcurementSupportSnapshot["counts"];

  return {
    mezzoTarga,
    datasets: [PROCUREMENT_PREVENTIVI_DATASET_KEY, PROCUREMENT_APPROVALS_DATASET_KEY],
    datasetShapes: {
      preventivi: preventiviDataset.datasetShape,
      approvazioni: approvalsDataset.datasetShape,
    },
    counts,
    matching,
    perimeterDecision,
    limitations: buildProcurementSupportLimitations({
      counts,
      matching,
      perimeterDecision,
      datasetShapes: {
        preventivi: preventiviDataset.datasetShape,
        approvazioni: approvalsDataset.datasetShape,
      },
      readFailures,
    }),
  };
}

export async function readNextIADocumentiArchiveSnapshot(
  options: ReadNextDocumentiCostiSnapshotOptions = {},
): Promise<NextIADocumentiArchiveSnapshot> {
  const includeCloneDocuments = options.includeCloneDocuments !== false;
  const { documentSnapshots, cloneDocuments, readFailures } = await readDocumentiCostiSources({
    includeCloneDocuments,
  });

  const documentItems = documentSnapshots.flatMap((snapshot, index) => {
    if (!snapshot) return [];
    const collectionKey = DOCUMENTI_COLLECTION_KEYS[index];
    return snapshot.docs.map((docSnapshot) =>
      mapIADocumentiArchiveRecord({
        raw: (docSnapshot.data() ?? {}) as RawRecord,
        collectionKey,
        sourceDocId: docSnapshot.id,
      }),
    );
  });

  const cloneDocumentItems = cloneDocuments.map((record) =>
    mapIADocumentiArchiveRecord({
      raw: mapCloneDocumentoToRaw(record),
      collectionKey: record.collectionKey,
      sourceDocId: record.id,
    }),
  );

  const items = sortIADocumentiArchiveItems([
    ...documentItems,
    ...cloneDocumentItems,
  ]);

  return {
    domainCode: "D08-IA-DOCUMENTI",
    domainName: "Archivio documenti IA read-only",
    logicalDatasets: DOCUMENTI_COLLECTION_KEYS,
    activeReadOnlyDatasets: DOCUMENTI_COLLECTION_KEYS,
    items,
    counts: {
      total: items.length,
      documentiMezzo: items.filter((item) => item.sourceKey === "@documenti_mezzi").length,
      documentiMagazzino: items.filter((item) => item.sourceKey === "@documenti_magazzino").length,
      documentiGenerici: items.filter((item) => item.sourceKey === "@documenti_generici").length,
      withFile: items.filter((item) => Boolean(item.fileUrl)).length,
      withoutFile: items.filter((item) => !item.fileUrl).length,
      valutaDaVerificare: items.filter((item) => item.valuta === "UNKNOWN").length,
      documentiDaVerificare: items.filter((item) => item.daVerificare).length,
    },
    limitations: [
      includeCloneDocuments
        ? "Il chiamante ha scelto di includere i documenti locali opzionali del clone nell'archivio IA."
        : "L'archivio IA legge solo le collection reali `@documenti_mezzi`, `@documenti_magazzino` e `@documenti_generici`, senza overlay locali del clone.",
      readFailures.length > 0
        ? `Lettura parziale: ${readFailures.join(", ")} non e disponibile in questo snapshot.`
        : null,
      items.some((item) => item.valuta === "UNKNOWN")
        ? "Alcuni documenti non espongono una valuta affidabile e restano da verificare."
        : null,
      items.some((item) => !item.fileUrl)
        ? "Una parte dell'archivio non espone ancora un PDF leggibile e resta consultabile solo come metadato."
        : null,
    ].filter((entry): entry is string => Boolean(entry)),
  };
}

export async function readNextProcurementReadOnlySnapshot(): Promise<NextProcurementReadOnlySnapshot> {
  const [procurement, preventiviResult, approvalsResult, listinoResult] = await Promise.all([
    readNextProcurementSnapshot(),
    getDoc(doc(db, STORAGE_COLLECTION, PROCUREMENT_PREVENTIVI_DATASET_KEY)),
    getDoc(doc(db, STORAGE_COLLECTION, PROCUREMENT_APPROVALS_DATASET_KEY)),
    getDoc(doc(db, STORAGE_COLLECTION, PROCUREMENT_LISTINO_DATASET_KEY)),
  ]);

  const readFailures: string[] = [];
  const preventiviDataset = unwrapStorageArrayWithPreferredKeys(
    preventiviResult.exists()
      ? ((preventiviResult.data() as Record<string, unknown>) ?? null)
      : null,
    ["preventivi"],
  );
  const approvalsDataset = unwrapStorageArray(
    approvalsResult.exists()
      ? ((approvalsResult.data() as Record<string, unknown>) ?? null)
      : null,
  );
  const listinoDataset = unwrapStorageArrayWithPreferredKeys(
    listinoResult.exists()
      ? ((listinoResult.data() as Record<string, unknown>) ?? null)
      : null,
    ["voci"],
  );

  const preventiviItems = preventiviDataset.items.filter(
    (entry): entry is RawRecord => Boolean(entry) && typeof entry === "object",
  );
  const approvalItems = approvalsDataset.items.filter(
    (entry): entry is RawRecord => Boolean(entry) && typeof entry === "object",
  );
  const listinoItems = listinoDataset.items.filter(
    (entry): entry is RawRecord => Boolean(entry) && typeof entry === "object",
  );

  const counts = {
    ordiniTotali: procurement.counts.totalOrders,
    ordiniInAttesa: procurement.counts.pendingOrders,
    ordiniParziali: procurement.counts.partialOrders,
    ordiniArrivati: procurement.counts.arrivedOrders,
    righeOrdineTotali: procurement.counts.totalRows,
    righeOrdinePendenti: procurement.counts.pendingRows,
    righeOrdineArrivate: procurement.counts.arrivedRows,
    preventiviTotali: preventiviItems.length,
    preventiviConPdf: preventiviItems.filter(
      (entry) =>
        Boolean(normalizeOptionalText(entry.pdfUrl)) ||
        Boolean(normalizeOptionalText(entry.pdfStoragePath)),
    ).length,
    preventiviConTargaDiretta: preventiviItems.filter((entry) =>
      Boolean(normalizeTarga(entry.targa ?? entry.mezzoTarga)),
    ).length,
    approvazioniTotali: approvalItems.length,
    approvazioniPending: approvalItems.filter(
      (entry) => normalizeProcurementApprovalStatus(entry.status) === "pending",
    ).length,
    approvazioniApproved: approvalItems.filter(
      (entry) => normalizeProcurementApprovalStatus(entry.status) === "approved",
    ).length,
    approvazioniRejected: approvalItems.filter(
      (entry) => normalizeProcurementApprovalStatus(entry.status) === "rejected",
    ).length,
    listinoVoci: listinoItems.length,
    listinoConFornitore: listinoItems.filter((entry) =>
      Boolean(normalizeOptionalText(entry.fornitoreNome ?? entry.fornitoreId ?? entry.fornitore)),
    ).length,
  } satisfies NextProcurementReadOnlySnapshot["counts"];

  const detailReason =
    procurement.navigability.dettaglioOrdine.reason ??
    "Il dettaglio ordine clone resta consultabile solo in sola lettura.";
  const surfaces = {
    ordini: {
      state: procurement.navigability.ordini.enabled ? "navigabile" : "bloccata",
      reason:
        procurement.navigability.ordini.reason ??
        "La vista ordini legge `@ordini` e non riattiva salvataggi o side effect.",
    },
    arrivi: {
      state: procurement.navigability.arrivi.enabled ? "navigabile" : "bloccata",
      reason:
        procurement.navigability.arrivi.reason ??
        "La vista arrivi legge `@ordini` e non riattiva salvataggi o side effect.",
    },
    dettaglioOrdine: {
      state: procurement.navigability.dettaglioOrdine.enabled ? "navigabile" : "bloccata",
      reason: detailReason,
    },
    ordineMateriali: {
      state: "navigabile",
      reason: procurement.navigability.ordineMateriali.reason,
    },
    preventivi: {
      state: counts.preventiviTotali > 0 ? "preview" : "bloccata",
      reason:
        counts.preventiviTotali > 0
          ? "I preventivi sono leggibili come contesto read-only e convivono con allegati locali al clone."
          : procurement.navigability.preventivi.reason,
    },
    listino: {
      state: counts.listinoVoci > 0 ? "preview" : "bloccata",
      reason:
        counts.listinoVoci > 0
          ? "Il listino e leggibile come supporto prezzi, mentre edit e consolidamento restano fuori dalla madre e solo di contesto."
          : procurement.navigability.listino.reason,
    },
    approvazioniCapoCosti: {
      state: counts.approvazioniTotali > 0 ? "preview" : "bloccata",
      reason:
        counts.approvazioniTotali > 0
          ? "Capo Costi mostra stati e documenti in sola lettura, senza eseguire approvazioni reali sulla madre."
          : "Capo Costi nel clone resta una vista read-only: senza stati approvativi leggibili non va presentato come workflow attivo.",
    },
    pdfTimbrato: {
      state: "bloccata",
      reason: "PDF timbrati e conferme finali restano fuori dalla madre; il clone genera solo PDF locali.",
    },
  } satisfies NextProcurementReadOnlySnapshot["surfaces"];

  return {
    domainCode: "D06",
    domainName: "Procurement read-only",
    generatedAt: new Date().toISOString(),
    datasets: [
      "@ordini",
      PROCUREMENT_PREVENTIVI_DATASET_KEY,
      PROCUREMENT_APPROVALS_DATASET_KEY,
      PROCUREMENT_LISTINO_DATASET_KEY,
    ],
    datasetShapes: {
      ordini: procurement.datasetShape,
      preventivi: preventiviDataset.datasetShape,
      approvazioni: approvalsDataset.datasetShape,
      listino: listinoDataset.datasetShape,
    },
    counts,
    surfaces,
    limitations: buildProcurementReadOnlyLimitations({
      ordiniShape: procurement.datasetShape,
      preventiviShape: preventiviDataset.datasetShape,
      approvazioniShape: approvalsDataset.datasetShape,
      listinoShape: listinoDataset.datasetShape,
      counts,
      readFailures,
    }),
    actionHint:
      surfaces.preventivi.state === "preview" ||
      surfaces.approvazioniCapoCosti.state === "preview"
        ? "Usare D06 per controllo e contesto: nel clone conviene aprire ordini o arrivi per leggere lo stato reale, mentre preventivi, approvazioni e PDF timbrati vanno trattati come preview o bloccati."
        : "Usare il workbench D06 in sola lettura per capire ordini, arrivi e stato preventivi senza eseguire scritture.",
  };
}

export async function readNextDocumentiCostiFleetSnapshot(
  options: ReadNextDocumentiCostiSnapshotOptions = {},
): Promise<NextDocumentiCostiFleetSnapshot> {
  const { costiDataset, documentSnapshots, cloneDocuments, readFailures } =
    await readDocumentiCostiSources(options);
  const { items, materialSupportDocuments } = buildAllDocumentiCostiItems({
    costiDataset,
    documentSnapshots,
    cloneDocuments,
  });
  const groups = {
    preventivi: items.filter((item) => item.category === "preventivo"),
    fatture: items.filter((item) => item.category === "fattura"),
    documentiUtili: items.filter((item) => item.category === "documento_utile"),
  };
  const counts = {
    total: items.length,
    mezziConDocumenti: new Set(items.map((item) => item.mezzoTarga)).size,
    preventivi: groups.preventivi.length,
    fatture: groups.fatture.length,
    documentiUtili: groups.documentiUtili.length,
    withFile: items.filter((item) => Boolean(item.fileUrl)).length,
    withAmount: items.filter((item) => item.amount !== null).length,
    withReliableDate: items.filter((item) => item.sortTimestamp !== null).length,
    withoutReliableDate: items.filter((item) => item.sortTimestamp === null).length,
  };
  const sourceCounts = {
    costiMezzo: items.filter((item) => item.sourceType === "costo_mezzo").length,
    documentiMezzo: items.filter((item) => item.sourceType === "documento_mezzo").length,
    documentiMagazzino: items.filter((item) => item.sourceType === "documento_magazzino").length,
    documentiGenerici: items.filter((item) => item.sourceType === "documento_generico").length,
  };
  const materialCostSupport = {
    documents: materialSupportDocuments,
    documentCount: materialSupportDocuments.length,
    rowCount: materialSupportDocuments.reduce((total, entry) => total + entry.voci.length, 0),
  };

  return {
    domainCode: NEXT_DOCUMENTI_COSTI_DOMAIN.code,
    domainName: NEXT_DOCUMENTI_COSTI_DOMAIN.name,
    logicalDatasets: NEXT_DOCUMENTI_COSTI_DOMAIN.logicalDatasets,
    activeReadOnlyDatasets: NEXT_DOCUMENTI_COSTI_DOMAIN.activeReadOnlyDatasets,
    normalizationStrategy: NEXT_DOCUMENTI_COSTI_DOMAIN.normalizationStrategy,
    outputContract: NEXT_DOCUMENTI_COSTI_DOMAIN.outputContract,
    datasetShapes: {
      costiMezzo: costiDataset.datasetShape,
    },
    items,
    counts,
    totals: {
      preventivi: buildAmountTotals(groups.preventivi),
      fatture: buildAmountTotals(groups.fatture),
    },
    sourceCounts,
    materialCostSupport,
    limitations: buildFleetLimitations({
      datasetShape: costiDataset.datasetShape,
      counts,
      sourceCounts,
      materialCostSupport,
      readFailures,
    }),
  };
}

export async function readNextMezzoDocumentiCostiSnapshot(
  targa: string,
  options: ReadNextDocumentiCostiSnapshotOptions = {},
): Promise<NextMezzoDocumentiCostiSnapshot> {
  const mezzoTarga = normalizeTarga(targa);
  const { costiDataset, documentSnapshots, cloneDocuments, readFailures } =
    await readDocumentiCostiSources(options);
  const { items: fleetItems, materialSupportDocuments } = buildAllDocumentiCostiItems({
    costiDataset,
    documentSnapshots,
    cloneDocuments,
  });
  const items = fleetItems.filter((item) => item.mezzoTarga === mezzoTarga);
  const groups = {
    preventivi: items.filter((item) => item.category === "preventivo"),
    fatture: items.filter((item) => item.category === "fattura"),
    documentiUtili: items.filter((item) => item.category === "documento_utile"),
  };

  const counts = {
    total: items.length,
    preventivi: groups.preventivi.length,
    fatture: groups.fatture.length,
    documentiUtili: groups.documentiUtili.length,
    withFile: items.filter((item) => Boolean(item.fileUrl)).length,
    withAmount: items.filter((item) => item.amount !== null).length,
    withReliableDate: items.filter((item) => item.sortTimestamp !== null).length,
    withoutReliableDate: items.filter((item) => item.sortTimestamp === null).length,
  };

  const sourceCounts = {
    costiMezzo: items.filter((item) => item.sourceType === "costo_mezzo").length,
    documentiMezzo: items.filter((item) => item.sourceType === "documento_mezzo").length,
    documentiMagazzino: items.filter((item) => item.sourceType === "documento_magazzino").length,
    documentiGenerici: items.filter((item) => item.sourceType === "documento_generico").length,
  };
  const materialCostSupport = {
    documents: materialSupportDocuments,
    documentCount: materialSupportDocuments.length,
    rowCount: materialSupportDocuments.reduce((total, entry) => total + entry.voci.length, 0),
  };

  return {
    domainCode: NEXT_DOCUMENTI_COSTI_DOMAIN.code,
    domainName: NEXT_DOCUMENTI_COSTI_DOMAIN.name,
    mezzoTarga,
    logicalDatasets: NEXT_DOCUMENTI_COSTI_DOMAIN.logicalDatasets,
    activeReadOnlyDatasets: NEXT_DOCUMENTI_COSTI_DOMAIN.activeReadOnlyDatasets,
    normalizationStrategy: NEXT_DOCUMENTI_COSTI_DOMAIN.normalizationStrategy,
    outputContract: NEXT_DOCUMENTI_COSTI_DOMAIN.outputContract,
    datasetShapes: {
      costiMezzo: costiDataset.datasetShape,
    },
    items,
    groups,
    counts,
    totals: {
      preventivi: buildAmountTotals(groups.preventivi),
      fatture: buildAmountTotals(groups.fatture),
    },
    latestLabels: {
      preventivo: groups.preventivi[0]?.dateLabel ?? null,
      fattura: groups.fatture[0]?.dateLabel ?? null,
      documentoUtile: groups.documentiUtili[0]?.dateLabel ?? null,
    },
    sourceCounts,
    materialCostSupport,
    limitations: buildLimitations({
      datasetShape: costiDataset.datasetShape,
      groups,
      counts,
      sourceCounts,
      materialCostSupport,
      readFailures,
    }),
  };
}

export async function readNextMezzoDocumentiCostiPeriodView(
  targa: string,
  period: NextMezzoDocumentiCostiPeriodInput,
): Promise<NextMezzoDocumentiCostiPeriodView> {
  const snapshot = await readNextMezzoDocumentiCostiSnapshot(targa);
  return deriveNextMezzoDocumentiCostiPeriodView({
    snapshot,
    period,
  });
}

export function mapNextDocumentiCostiItemsToLegacyView(
  items: NextDocumentiCostiReadOnlyItem[]
): NextDocumentiCostiLegacyViewItem[] {
  return items
    .filter((item) => item.category === "preventivo" || item.category === "fattura")
    .map((item) => ({
      id: item.id,
      mezzoTarga: item.mezzoTarga,
      targa: item.targa,
      tipo: item.category === "preventivo" ? "PREVENTIVO" : "FATTURA",
      data: item.data ?? "",
      timestamp: item.timestamp,
      descrizione: item.descrizione,
      importo: item.importo ?? undefined,
      valuta: item.valuta,
      currency: item.valuta,
      fornitoreLabel: item.supplier ?? "",
      fileUrl: item.fileUrl,
      sourceKey: item.sourceKey,
      sourceDocId: item.sourceDocId,
      quality: item.quality,
      flags: [...item.flags],
      dedupGroup: item.dedupGroup,
    }));
}
