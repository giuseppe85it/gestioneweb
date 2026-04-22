import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { readNextProcurementCloneOrders } from "../nextProcurementCloneState";

const STORAGE_COLLECTION = "storage";
const ORDINI_KEY = "@ordini";
const PREVENTIVI_KEY = "@preventivi";
const APPROVALS_KEY = "@preventivi_approvazioni";
const LISTINO_KEY = "@listino_prezzi";

type RawOrderRecord = Record<string, unknown>;
type RawMaterialRecord = Record<string, unknown>;
type RawGenericRecord = Record<string, unknown>;

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
export type NextProcurementOrderState = "in_attesa" | "parziale" | "arrivato" | "vuoto";
export type NextProcurementApprovalStatus = "pending" | "approved" | "rejected";

export const NEXT_PROCUREMENT_DOMAIN = {
  code: "D06",
  name: "Procurement, ordini e fornitori",
  logicalDatasets: [ORDINI_KEY, PREVENTIVI_KEY, APPROVALS_KEY, LISTINO_KEY] as const,
  activeReadOnlyDataset: ORDINI_KEY,
  normalizationStrategy: "LAYER NEXT READ-ONLY PROCUREMENT SU @ordini/@preventivi/@listino_prezzi",
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

export type NextProcurementApprovalItem = {
  id: string;
  approvalKey: string;
  targa: string | null;
  sourceKey: string | null;
  sourceDocId: string | null;
  status: NextProcurementApprovalStatus;
  updatedAtLabel: string | null;
  updatedAtTimestamp: number | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKeyLabel: typeof APPROVALS_KEY;
  quality: NextReadQuality;
  flags: string[];
};

export type NextProcurementPreventivoItem = {
  id: string;
  supplierId: string | null;
  supplierName: string;
  numeroPreventivo: string;
  dataPreventivoLabel: string | null;
  dataPreventivoTimestamp: number | null;
  pdfUrl: string | null;
  pdfStoragePath: string | null;
  imageUrls: string[];
  imageStoragePaths: string[];
  righeCount: number;
  rows: NextProcurementPreventivoRow[];
  materialsPreview: string[];
  totalAmount: number | null;
  currency: string | null;
  approvalStatus: NextProcurementApprovalStatus;
  approvalUpdatedAtLabel: string | null;
  approvalUpdatedAtTimestamp: number | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof PREVENTIVI_KEY;
  quality: NextReadQuality;
  flags: string[];
};

export type NextProcurementListinoItem = {
  id: string;
  supplierId: string | null;
  supplierName: string;
  articoloCanonico: string;
  codiceArticolo: string | null;
  note: string | null;
  unita: string | null;
  valuta: string | null;
  prezzoAttuale: number | null;
  trend: "down" | "up" | "same" | "new";
  updatedAtLabel: string | null;
  updatedAtTimestamp: number | null;
  fontePreventivoId: string | null;
  fonteNumeroPreventivo: string | null;
  fonteDataPreventivo: string | null;
  pdfUrl: string | null;
  pdfStoragePath: string | null;
  imageUrls: string[];
  imageStoragePaths: string[];
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof LISTINO_KEY;
  quality: NextReadQuality;
  flags: string[];
};

export type NextProcurementPreventivoRow = {
  id: string;
  descrizione: string;
  unita: string | null;
  note: string | null;
  prezzoUnitario: number | null;
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
  datasetShapes: {
    ordini: NextLegacyDatasetShape;
    preventivi: NextLegacyDatasetShape;
    approvazioni: NextLegacyDatasetShape;
    listino: NextLegacyDatasetShape;
  };
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
    preventiviTotali: number;
    preventiviConPdf: number;
    preventiviApprovati: number;
    preventiviRifiutati: number;
    listinoVoci: number;
    listinoConDocumento: number;
  };
  orders: NextProcurementOrderItem[];
  preventivi: NextProcurementPreventivoItem[];
  approvals: NextProcurementApprovalItem[];
  listino: NextProcurementListinoItem[];
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
    ordineMateriali: { enabled: boolean; reason: string };
    ordini: { enabled: boolean; reason: null };
    arrivi: { enabled: boolean; reason: null };
    preventivi: { enabled: boolean; reason: string };
    listino: { enabled: boolean; reason: string };
    dettaglioOrdine: { enabled: boolean; reason: string };
  };
  limitations: string[];
};

export type NextProcurementReadOptions = {
  includeCloneOverlays?: boolean;
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

function unwrapStorageArrayWithPreferredKeys(
  rawDoc: unknown,
  preferredKeys: string[] = []
): {
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

  for (const key of preferredKeys) {
    const candidate = record[key];
    if (Array.isArray(candidate)) {
      return { datasetShape: "array", items: candidate };
    }
  }

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
  const { totalRows, arrivedRows } = args;
  if (totalRows > 0) {
    if (arrivedRows === 0) return "in_attesa";
    if (arrivedRows < totalRows) return "parziale";
    return "arrivato";
  }

  return "vuoto";
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

function normalizeApprovalStatus(value: unknown): NextProcurementApprovalStatus {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "approved" || normalized === "rejected") {
    return normalized;
  }
  return "pending";
}

function extractApprovalMeta(approvalKey: string | null): {
  targa: string | null;
  sourceKey: string | null;
  sourceDocId: string | null;
} {
  if (!approvalKey) {
    return { targa: null, sourceKey: null, sourceDocId: null };
  }

  const parts = approvalKey.split("__");
  if (parts.length < 3) {
    return { targa: null, sourceKey: null, sourceDocId: approvalKey };
  }

  return {
    targa: normalizeOptionalText(parts[0]),
    sourceKey: normalizeOptionalText(parts[1]),
    sourceDocId: normalizeOptionalText(parts.slice(2).join("__")),
  };
}

function mapApprovalRecord(raw: RawGenericRecord, index: number): NextProcurementApprovalItem {
  const approvalKey = normalizeOptionalText(raw.id) ?? `approval:${index}`;
  const meta = extractApprovalMeta(approvalKey);
  const updatedAtTimestamp = toTimestamp(raw.updatedAt ?? raw.timestamp ?? raw.data);
  const updatedAtLabel =
    normalizeLegacyDateLabel(raw.updatedAt ?? raw.timestamp ?? raw.data) ??
    normalizeOptionalText(raw.updatedAt);
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (!meta.sourceDocId) flags.push("source_doc_assente");

  return {
    id: approvalKey,
    approvalKey,
    targa: meta.targa,
    sourceKey: meta.sourceKey,
    sourceDocId: meta.sourceDocId,
    status: normalizeApprovalStatus(raw.status),
    updatedAtLabel,
    updatedAtTimestamp,
    sourceCollection: STORAGE_COLLECTION,
    sourceKeyLabel: APPROVALS_KEY,
    quality: deriveQuality(flags, !meta.sourceDocId),
    flags,
  };
}

function computePreventivoTotal(raw: RawGenericRecord, flags: string[]): number | null {
  const direct =
    normalizeNumber(raw.totale) ??
    normalizeNumber(raw.importoTotale) ??
    normalizeNumber(raw.totalePreventivo) ??
    normalizeNumber(raw.importo);
  if (direct !== null) {
    return direct;
  }

  const righe = Array.isArray(raw.righe)
    ? raw.righe.filter((entry): entry is RawGenericRecord => Boolean(entry) && typeof entry === "object")
    : [];

  if (!righe.length) {
    return null;
  }

  let hasAny = false;
  const total = righe.reduce((sum, row) => {
    const qty = normalizeNumber(row.quantita) ?? 1;
    const unit = normalizeNumber(row.prezzoUnitario);
    if (unit === null) {
      return sum;
    }
    hasAny = true;
    return sum + qty * unit;
  }, 0);

  if (hasAny) {
    flags.push("totale_ricostruito_da_righe");
    return total;
  }

  return null;
}

function buildPreventivoApprovalIndex(
  items: NextProcurementApprovalItem[]
): Map<string, NextProcurementApprovalItem> {
  const map = new Map<string, NextProcurementApprovalItem>();
  items.forEach((item) => {
    if (item.sourceDocId) {
      map.set(item.sourceDocId, item);
    }
  });
  return map;
}

function mapPreventivoRow(
  raw: RawGenericRecord,
  index: number
): NextProcurementPreventivoRow {
  const descrizioneRaw =
    normalizeOptionalText(raw.descrizione) ??
    normalizeOptionalText(raw.materiale) ??
    normalizeOptionalText(raw.materialeLabel) ??
    normalizeOptionalText(raw.label) ??
    normalizeOptionalText(raw.nome);
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (!descrizioneRaw) flags.push("descrizione_assente");

  return {
    id: normalizeOptionalText(raw.id) ?? `preventivo-riga:${index}`,
    descrizione: descrizioneRaw ?? "Riga preventivo non valorizzata",
    unita:
      normalizeOptionalText(raw.unita) ??
      normalizeOptionalText(raw.udm) ??
      normalizeOptionalText(raw.unitaMisura),
    note: normalizeOptionalText(raw.note) ?? normalizeOptionalText(raw.nota),
    prezzoUnitario:
      normalizeNumber(raw.prezzoUnitario) ??
      normalizeNumber(raw.prezzo) ??
      normalizeNumber(raw.costoUnitario),
    quality: deriveQuality(flags, !descrizioneRaw),
    flags,
  };
}

function mapPreventivoRecord(
  raw: RawGenericRecord,
  index: number,
  approvalIndex: Map<string, NextProcurementApprovalItem>
): NextProcurementPreventivoItem {
  const id = normalizeOptionalText(raw.id) ?? `preventivo:${index}`;
  const righeRaw = Array.isArray(raw.righe)
    ? raw.righe.filter((entry): entry is RawGenericRecord => Boolean(entry) && typeof entry === "object")
    : [];
  const rows = righeRaw.map((entry, rowIndex) => mapPreventivoRow(entry, rowIndex));
  const materialsPreview = rows
    .map((entry) => normalizeOptionalText(entry.descrizione))
    .filter((entry): entry is string => Boolean(entry))
    .slice(0, 3);
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (!normalizeOptionalText(raw.fornitoreNome)) flags.push("fornitore_assente");
  if (!normalizeOptionalText(raw.numeroPreventivo)) flags.push("numero_assente");
  if (!rows.length) flags.push("righe_assenti");
  if (rows.some((entry) => entry.quality !== "certo")) flags.push("righe_parziali");

  const approval =
    approvalIndex.get(id) ??
    approvalIndex.get(normalizeOptionalText(raw.numeroPreventivo) ?? "") ??
    null;

  return {
    id,
    supplierId: normalizeOptionalText(raw.fornitoreId),
    supplierName: normalizeOptionalText(raw.fornitoreNome) ?? "Fornitore non valorizzato",
    numeroPreventivo:
      normalizeOptionalText(raw.numeroPreventivo) ?? `PREV-${String(index + 1).padStart(3, "0")}`,
    dataPreventivoLabel: normalizeLegacyDateLabel(raw.dataPreventivo),
    dataPreventivoTimestamp: toTimestamp(raw.dataPreventivo),
    pdfUrl: normalizeOptionalText(raw.pdfUrl),
    pdfStoragePath: normalizeOptionalText(raw.pdfStoragePath),
    imageUrls: Array.isArray(raw.imageUrls)
      ? raw.imageUrls.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [],
    imageStoragePaths: Array.isArray(raw.imageStoragePaths)
      ? raw.imageStoragePaths.filter(
          (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
        )
      : [],
    righeCount: rows.length,
    rows,
    materialsPreview,
    totalAmount: computePreventivoTotal(raw, flags),
    currency:
      normalizeCurrency(raw.valuta) ??
      normalizeCurrency(raw.currency) ??
      normalizeCurrency(righeRaw.find((row) => normalizeCurrency(row.valuta))?.valuta),
    approvalStatus: approval?.status ?? "pending",
    approvalUpdatedAtLabel: approval?.updatedAtLabel ?? null,
    approvalUpdatedAtTimestamp: approval?.updatedAtTimestamp ?? null,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: PREVENTIVI_KEY,
    quality: deriveQuality(flags, !normalizeOptionalText(raw.fornitoreNome)),
    flags,
  };
}

function normalizeTrend(value: unknown): "down" | "up" | "same" | "new" {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "down" || normalized === "up" || normalized === "same") {
    return normalized;
  }
  return "new";
}

function mapListinoRecord(raw: RawGenericRecord, index: number): NextProcurementListinoItem {
  const fonteAttuale =
    raw.fonteAttuale && typeof raw.fonteAttuale === "object" ? (raw.fonteAttuale as RawGenericRecord) : {};
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (!normalizeOptionalText(raw.fornitoreNome)) flags.push("fornitore_assente");
  if (!normalizeOptionalText(raw.articoloCanonico)) flags.push("articolo_assente");
  if (normalizeNumber(raw.prezzoAttuale) === null) flags.push("prezzo_assente");

  return {
    id: normalizeOptionalText(raw.id) ?? `listino:${index}`,
    supplierId: normalizeOptionalText(raw.fornitoreId),
    supplierName: normalizeOptionalText(raw.fornitoreNome) ?? "Fornitore non valorizzato",
    articoloCanonico: normalizeOptionalText(raw.articoloCanonico) ?? "Articolo non valorizzato",
    codiceArticolo: normalizeOptionalText(raw.codiceArticolo),
    note: normalizeOptionalText(raw.note),
    unita: normalizeOptionalText(raw.unita),
    valuta: normalizeCurrency(raw.valuta),
    prezzoAttuale: normalizeNumber(raw.prezzoAttuale),
    trend: normalizeTrend(raw.trend),
    updatedAtLabel: normalizeLegacyDateLabel(raw.updatedAt ?? fonteAttuale.dataPreventivo),
    updatedAtTimestamp: toTimestamp(raw.updatedAt ?? fonteAttuale.dataPreventivo),
    fontePreventivoId: normalizeOptionalText(fonteAttuale.preventivoId),
    fonteNumeroPreventivo: normalizeOptionalText(fonteAttuale.numeroPreventivo),
    fonteDataPreventivo: normalizeLegacyDateLabel(fonteAttuale.dataPreventivo),
    pdfUrl: normalizeOptionalText(fonteAttuale.pdfUrl),
    pdfStoragePath: normalizeOptionalText(fonteAttuale.pdfStoragePath),
    imageUrls: Array.isArray(fonteAttuale.imageUrls)
      ? fonteAttuale.imageUrls.filter(
          (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
        )
      : [],
    imageStoragePaths: Array.isArray(fonteAttuale.imageStoragePaths)
      ? fonteAttuale.imageStoragePaths.filter(
          (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
        )
      : [],
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: LISTINO_KEY,
    quality: deriveQuality(flags, !normalizeOptionalText(raw.articoloCanonico)),
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

function sortPreventivi(items: NextProcurementPreventivoItem[]): NextProcurementPreventivoItem[] {
  return [...items].sort((left, right) => {
    const timeDelta = (right.dataPreventivoTimestamp ?? 0) - (left.dataPreventivoTimestamp ?? 0);
    if (timeDelta !== 0) return timeDelta;
    return left.supplierName.localeCompare(right.supplierName, "it", { sensitivity: "base" });
  });
}

function sortListino(items: NextProcurementListinoItem[]): NextProcurementListinoItem[] {
  return [...items].sort((left, right) => {
    const supplierDelta = left.supplierName.localeCompare(right.supplierName, "it", {
      sensitivity: "base",
    });
    if (supplierDelta !== 0) return supplierDelta;
    return left.articoloCanonico.localeCompare(right.articoloCanonico, "it", {
      sensitivity: "base",
    });
  });
}

async function readStorageDataset(
  key: string,
  preferredKeys: string[] = []
): Promise<{
  datasetShape: NextLegacyDatasetShape;
  items: unknown[];
}> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, key));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  return unwrapStorageArrayWithPreferredKeys(rawDoc, preferredKeys);
}

async function readOrdersDataset(
  options: NextProcurementReadOptions = {},
): Promise<{
  datasetShape: NextLegacyDatasetShape;
  items: unknown[];
  cloneOrdersCount: number;
}> {
  const includeCloneOverlays = options.includeCloneOverlays ?? true;
  const dataset = await readStorageDataset(ORDINI_KEY);
  const cloneOrders = includeCloneOverlays ? readNextProcurementCloneOrders() : [];
  const baseItems = dataset.items.filter((entry): entry is RawOrderRecord => Boolean(entry) && typeof entry === "object");
  const byId = new Map<string, RawOrderRecord>();

  baseItems.forEach((entry, index) => {
    byId.set(buildOrderId(entry, index), entry);
  });
  cloneOrders.forEach((entry) => {
    byId.set(entry.id, entry as unknown as RawOrderRecord);
  });

  return {
    datasetShape: dataset.datasetShape,
    items: Array.from(byId.values()),
    cloneOrdersCount: cloneOrders.length,
  };
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

export async function readNextProcurementSnapshot(
  options: NextProcurementReadOptions = {},
): Promise<NextProcurementSnapshot> {
  const includeCloneOverlays = options.includeCloneOverlays ?? true;
  const [dataset, preventiviDataset, approvalsDataset, listinoDataset] = await Promise.all([
    readOrdersDataset({ includeCloneOverlays }),
    readStorageDataset(PREVENTIVI_KEY, ["preventivi"]),
    readStorageDataset(APPROVALS_KEY),
    readStorageDataset(LISTINO_KEY, ["voci"]),
  ]);

  const approvals = approvalsDataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return mapApprovalRecord(entry as RawGenericRecord, index);
    })
    .filter((entry): entry is NextProcurementApprovalItem => Boolean(entry));
  const approvalIndex = buildPreventivoApprovalIndex(approvals);

  const orders = sortOrders(
    dataset.items
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        return mapOrderRecord(entry as RawOrderRecord, index);
      })
      .filter((entry): entry is NextProcurementOrderItem => Boolean(entry))
  );

  const preventivi = sortPreventivi(
    preventiviDataset.items
      .filter(
        (entry): entry is RawGenericRecord =>
          Boolean(entry) &&
          typeof entry === "object" &&
          (entry as RawGenericRecord).ambitoPreventivo !== "manutenzione"
      )
      .map((entry, index) => mapPreventivoRecord(entry, index, approvalIndex))
      .filter((entry): entry is NextProcurementPreventivoItem => Boolean(entry))
  );

  const listino = sortListino(
    listinoDataset.items
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        return mapListinoRecord(entry as RawGenericRecord, index);
      })
      .filter((entry): entry is NextProcurementListinoItem => Boolean(entry))
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
    datasetShapes: {
      ordini: dataset.datasetShape,
      preventivi: preventiviDataset.datasetShape,
      approvazioni: approvalsDataset.datasetShape,
      listino: listinoDataset.datasetShape,
    },
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
      preventiviTotali: preventivi.length,
      preventiviConPdf: preventivi.filter(
        (entry) => Boolean(entry.pdfUrl) || entry.imageUrls.length > 0
      ).length,
      preventiviApprovati: preventivi.filter((entry) => entry.approvalStatus === "approved").length,
      preventiviRifiutati: preventivi.filter((entry) => entry.approvalStatus === "rejected").length,
      listinoVoci: listino.length,
      listinoConDocumento: listino.filter(
        (entry) => Boolean(entry.pdfUrl) || entry.imageUrls.length > 0
      ).length,
    },
    orders,
    preventivi,
    approvals,
    listino,
    groups,
    legacyViews,
    navigability: {
      ordineMateriali: {
        enabled: false,
        reason:
          "La bozza ordine materiali della madre resta fuori perimetro nel clone: la tab resta visibile, ma conferme, allegati, PDF e salvataggi sono bloccati in sola lettura; nel perimetro NEXT il writer stock canonico vive in `/next/magazzino`.",
      },
      ordini: { enabled: true, reason: null },
      arrivi: { enabled: true, reason: null },
      preventivi: {
        enabled: false,
        reason:
          "La scheda `Prezzi & Preventivi` resta una preview prudenziale: documenti e stato approvativo sono leggibili, ma upload, OCR IA, salvataggi e delete restano bloccati nel clone.",
      },
      listino: {
        enabled: false,
        reason:
          "La scheda `Listino Prezzi` resta contesto read-only: voci, prezzo corrente e fonte documento sono leggibili, ma edit, import e consolidamento restano bloccati.",
      },
      dettaglioOrdine: {
        enabled: true,
        reason:
          "Il dettaglio ordine resta consultabile in sola lettura: stato arrivo, righe, note, foto e PDF mantengono la UI della madre ma restano bloccati sotto; il consolidamento stock degli arrivi passa da `/next/magazzino`.",
      },
    },
    limitations: [
      includeCloneOverlays
        ? "Il layer D06 puo ancora ammettere overlay locali opzionali quando richiesto in modo esplicito da runtime legacy del clone."
        : "Questa lettura ufficiale del procurement usa solo i dati reali della madre, senza overlay clone-only su ordini o righe.",
      "Nel perimetro NEXT ordini e arrivi procurement restano supporto read-only: il carico stock canonico degli arrivi si consolida da `/next/magazzino?tab=documenti-costi` usando il contratto `nextMagazzinoStockContract.ts`.",
      "Le viste `Ordini` e `Arrivi` replicano la semantica della madre su `Acquisti`: gli ordini parziali compaiono in entrambe perche hanno sia righe pendenti sia righe arrivate.",
      "Nel clone ufficiale il dettaglio ordine resta navigabile, ma edit, toggle arrivo, aggiunta righe, foto e PDF sono bloccati in modo esplicito.",
      dataset.datasetShape === "unsupported"
        ? "Il dataset `@ordini` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
        : null,
      preventiviDataset.datasetShape === "unsupported"
        ? "Il dataset `@preventivi` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
        : null,
      listinoDataset.datasetShape === "unsupported"
        ? "Il dataset `@listino_prezzi` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
        : null,
      orders.some((entry) => entry.flags.includes("righe_materiali_assenti"))
        ? "Una parte degli ordini legacy non espone righe materiali leggibili; il clone mostra comunque l'ordine senza ricostruire dati mancanti."
        : null,
      preventivi.some((entry) => entry.flags.includes("fornitore_assente"))
        ? "Una parte dei preventivi non espone un fornitore leggibile e resta marcata con flag espliciti."
        : null,
      listino.some((entry) => entry.flags.includes("prezzo_assente"))
        ? "Una parte del listino non espone un prezzo corrente leggibile e resta marcata con flag espliciti."
        : null,
      includeCloneOverlays && dataset.cloneOrdersCount > 0
        ? `Il clone integra ${dataset.cloneOrdersCount} ordini confermati localmente senza scrivere su @ordini nella madre.`
        : null,
    ].filter((entry): entry is string => Boolean(entry)),
  };
}
