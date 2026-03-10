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
  category: NextDocumentiCostiCategory;
  documentTypeLabel: string;
  title: string;
  supplier: string | null;
  dateLabel: string | null;
  sortTimestamp: number | null;
  amount: number | null;
  currency: NextDocumentiCostiCurrency;
  fileUrl: string | null;
  sourceCollection: string;
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

function mapCostoMezzoRecord(
  raw: RawRecord,
  mezzoTarga: string,
  index: number
): NextDocumentiCostiReadOnlyItem | null {
  const itemTarga = normalizeTarga(raw.mezzoTarga ?? raw.targa);
  if (!itemTarga || itemTarga !== mezzoTarga) return null;

  const tipoDocumento = normalizeTipoDocumento(raw.tipo);
  const category = classifyCategory(tipoDocumento);
  const dateLabel = normalizeOptionalText(raw.data);
  const sortTimestamp = toTimestamp(raw.data);
  const amount = parseAmountAny(raw.importo);
  const supplier = normalizeOptionalText(raw.fornitoreLabel ?? raw.fornitore);
  const fileUrl = normalizeOptionalText(raw.fileUrl);
  const sourceDocId = normalizeOptionalText(raw.id);
  const sourceRecordId = sourceDocId ?? `costo-mezzo:${mezzoTarga}:${index}`;
  const title = buildItemTitle({
    category,
    documentTypeLabel: tipoDocumento || "",
    supplier,
    fallbackName: normalizeOptionalText(raw.descrizione),
  });

  return {
    id: sourceRecordId,
    mezzoTarga,
    category,
    documentTypeLabel: tipoDocumento || "Documento costo",
    title,
    supplier,
    dateLabel,
    sortTimestamp,
    amount,
    currency: resolveCurrencyFromRecord(raw),
    fileUrl,
    sourceCollection: `${STORAGE_COLLECTION}/${COSTI_DATASET_KEY}`,
    sourceDocId,
    sourceRecordId,
    sourceType: "costo_mezzo",
    sourceLabel: getSourceLabel("costo_mezzo"),
    archiveCategory: null,
    fieldQuality: {
      date: dateLabel ? "certo" : sortTimestamp !== null ? "ricostruito" : "non_disponibile",
      amount: amount !== null ? "certo" : "non_disponibile",
      supplier: supplier ? "certo" : "non_disponibile",
      fileUrl: fileUrl ? "certo" : "non_disponibile",
    },
    flags: [
      "source_storage_costi_mezzo",
      category === "documento_utile" ? "tipo_non_standard_da_costi" : "tipo_standard_costi",
    ],
  };
}

function mapDocumentoRecord(args: {
  raw: RawRecord;
  mezzoTarga: string;
  collectionKey: string;
  sourceDocId: string;
}): NextDocumentiCostiReadOnlyItem | null {
  const { raw, mezzoTarga, collectionKey, sourceDocId } = args;
  const itemTarga = normalizeTarga(raw.targa);
  if (!itemTarga || itemTarga !== mezzoTarga) return null;

  const tipoDocumento = normalizeTipoDocumento(raw.tipoDocumento);
  const category = classifyCategory(tipoDocumento);
  const sourceType = getSourceTypeFromCollection(collectionKey);
  const dateLabel = normalizeOptionalText(raw.dataDocumento);
  const sortTimestamp =
    toTimestamp(raw.dataDocumento) ??
    toTimestamp(raw.createdAt) ??
    toTimestamp(raw.updatedAt);
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

  return {
    id: `${collectionKey}:${sourceDocId}`,
    mezzoTarga,
    category,
    documentTypeLabel:
      tipoDocumento ||
      (category === "documento_utile" ? "Documento utile" : "Documento costo"),
    title,
    supplier,
    dateLabel,
    sortTimestamp,
    amount,
    currency: resolveCurrencyFromRecord(raw),
    fileUrl,
    sourceCollection: collectionKey,
    sourceDocId,
    sourceRecordId,
    sourceType,
    sourceLabel: getSourceLabel(sourceType),
    archiveCategory,
    fieldQuality: {
      date: dateLabel ? "certo" : sortTimestamp !== null ? "ricostruito" : "non_disponibile",
      amount: amount !== null ? "certo" : "non_disponibile",
      supplier: supplier ? "certo" : "non_disponibile",
      fileUrl: fileUrl ? "certo" : "non_disponibile",
    },
    flags,
  };
}

function dedupItems(items: NextDocumentiCostiReadOnlyItem[]): NextDocumentiCostiReadOnlyItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.sourceCollection}:${item.sourceDocId ?? item.sourceRecordId ?? item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  groups: NextMezzoDocumentiCostiSnapshot["groups"];
  counts: NextMezzoDocumentiCostiSnapshot["counts"];
  sourceCounts: NextMezzoDocumentiCostiSnapshot["sourceCounts"];
}): string[] {
  const { datasetShape, groups, counts, sourceCounts } = args;

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
    counts.withAmount < groups.preventivi.length + groups.fatture.length
      ? "Una parte di preventivi o fatture non espone un importo parsabile: i totali restano prudenziali e non forzano ricostruzioni."
      : null,
    datasetShape === "unsupported"
      ? "Il dataset `@costiMezzo` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
      : null,
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

export async function readNextMezzoDocumentiCostiSnapshot(
  targa: string
): Promise<NextMezzoDocumentiCostiSnapshot> {
  const mezzoTarga = normalizeTarga(targa);
  const [costiDataset, ...documentSnapshots] = await Promise.all([
    readCostiMezzoDataset(),
    ...DOCUMENTI_COLLECTION_KEYS.map((collectionKey) => getDocs(collection(db, collectionKey))),
  ]);

  const costiItems = costiDataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return mapCostoMezzoRecord(entry as RawRecord, mezzoTarga, index);
    })
    .filter((entry): entry is NextDocumentiCostiReadOnlyItem => Boolean(entry));

  const documentItems = documentSnapshots.flatMap((snapshot, index) => {
    const collectionKey = DOCUMENTI_COLLECTION_KEYS[index];
    return snapshot.docs
      .map((docSnapshot) =>
        mapDocumentoRecord({
          raw: (docSnapshot.data() ?? {}) as RawRecord,
          mezzoTarga,
          collectionKey,
          sourceDocId: docSnapshot.id,
        })
      )
      .filter((entry): entry is NextDocumentiCostiReadOnlyItem => Boolean(entry));
  });

  const items = sortItems(dedupItems([...costiItems, ...documentItems]));
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
    limitations: buildLimitations({
      datasetShape: costiDataset.datasetShape,
      groups,
      counts,
      sourceCounts,
    }),
  };
}
