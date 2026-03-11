import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";

const STORAGE_COLLECTION = "storage";
const COSTI_DATASET_KEY = "@costiMezzo";
const DOCUMENTI_COLLECTION_KEYS = [
  "@documenti_mezzi",
  "@documenti_magazzino",
  "@documenti_generici",
] as const;

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
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
  readFailures: string[];
};

async function readDocumentiCostiSources(): Promise<NextDocumentiCostiSources> {
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
    readFailures,
  };
}

function buildAllDocumentiCostiItems(args: {
  costiDataset: NextDocumentiCostiSources["costiDataset"];
  documentSnapshots: NextDocumentiCostiSources["documentSnapshots"];
}): {
  items: NextDocumentiCostiReadOnlyItem[];
  materialSupportDocuments: NextDocumentiMagazzinoSupportDocument[];
} {
  const { costiDataset, documentSnapshots } = args;

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

  const materialSupportDocuments = (documentSnapshots[1]?.docs ?? [])
    .map((docSnapshot) =>
      mapMaterialSupportDocument((docSnapshot.data() ?? {}) as RawRecord, docSnapshot.id)
    )
    .filter((entry): entry is NextDocumentiMagazzinoSupportDocument => Boolean(entry));

  return {
    items: sortItems(dedupItems([...costiItems, ...documentItems])),
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
    "Il layer non legge `@preventivi`, non apre il workflow Acquisti e non riattiva PDF o approvazioni scriventi.",
    "Il layer globale non incorpora `@preventivi_approvazioni`: quello stato resta un supporto separato dell'Area Capo e va trattato in sola lettura.",
    counts.withAmount < counts.preventivi + counts.fatture
      ? "Una parte di preventivi o fatture non espone un importo parsabile: i totali flotta restano prudenziali e non forzano ricostruzioni."
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

export async function readNextDocumentiCostiFleetSnapshot(): Promise<NextDocumentiCostiFleetSnapshot> {
  const { costiDataset, documentSnapshots, readFailures } = await readDocumentiCostiSources();
  const { items, materialSupportDocuments } = buildAllDocumentiCostiItems({
    costiDataset,
    documentSnapshots,
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
  targa: string
): Promise<NextMezzoDocumentiCostiSnapshot> {
  const mezzoTarga = normalizeTarga(targa);
  const { costiDataset, documentSnapshots, readFailures } = await readDocumentiCostiSources();
  const { items: fleetItems, materialSupportDocuments } = buildAllDocumentiCostiItems({
    costiDataset,
    documentSnapshots,
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
