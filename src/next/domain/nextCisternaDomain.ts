import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import {
  CISTERNA_DOCUMENTI_COLLECTION,
  CISTERNA_PARAMETRI_COLLECTION,
  CISTERNA_REFUEL_TAG,
  CISTERNA_SCHEDE_COLLECTION,
  RIFORNIMENTI_AUTISTI_KEY,
  currentMonthKey,
  monthKeyFromDate,
  monthLabel,
} from "../../cisterna/collections";
import type {
  CisternaDocumento,
  CisternaParametroMensile,
  RifornimentoAutistaRecord,
} from "../../cisterna/types";

const STORAGE_COLLECTION = "storage";

type AziendaKey = "cementi" | "import";

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

type CisternaSchedaRow = {
  data?: string | null;
  targa?: string | null;
  litri?: number | string | null;
  nome?: string | null;
  azienda?: string | null;
  statoRevisione?: string | null;
};

type CisternaSchedaDoc = {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  source?: "manual" | "ia" | string | null;
  rowCount?: number | null;
  rows?: CisternaSchedaRow[] | null;
  needsReview?: boolean;
  mese?: string | null;
  yearMonth?: string | null;
};

type VeritaRow = {
  id: string;
  dataKey: string;
  targa: string;
  litri: number;
  nome: string;
  autista: string;
  azienda: AziendaKey;
  timestamp: number;
  source: "manuale" | "autisti";
};

export const NEXT_CISTERNA_DOMAIN = {
  code: "D09-CISTERNA-BASE",
  name: "Cisterna base clone-safe",
  logicalDatasets: [
    CISTERNA_DOCUMENTI_COLLECTION,
    CISTERNA_SCHEDE_COLLECTION,
    CISTERNA_PARAMETRI_COLLECTION,
    RIFORNIMENTI_AUTISTI_KEY,
  ] as const,
  normalizationStrategy:
    "LAYER NEXT READ-ONLY CHE RICOSTRUISCE ARCHIVIO, REPORT MENSILE E RIPARTIZIONI CISTERNA SENZA WRITER",
} as const;

export type NextCisternaQuality = "certo" | "parziale" | "da_verificare";

export type NextCisternaSupportItem = {
  id: string;
  dateLabel: string;
  targa: string;
  litri: number;
  autista: string;
};

export type NextCisternaDocumentItem = {
  id: string;
  dateLabel: string;
  timestamp: number | null;
  tipoDocumento: string | null;
  fornitore: string | null;
  prodotto: string | null;
  litriLabel: string;
  luogoConsegna: string | null;
  fileUrl: string | null;
  duplicateState: "single" | "value" | "ignored";
};

export type NextCisternaDuplicateGroup = {
  key: string;
  dateLabel: string;
  resolution: "persisted" | "fallback-max-litri";
  note: string;
  items: NextCisternaDocumentItem[];
};

export type NextCisternaSchedaItem = {
  id: string;
  dateLabel: string;
  sourceLabel: string;
  rowCount: number;
  targa: string | null;
  needsReview: boolean;
};

export type NextCisternaSchedaDetailRow = {
  index: number;
  data: string;
  targa: string;
  litri: number | null;
  nome: string;
  azienda: string;
  statoRevisione: string;
  note: string;
};

export type NextCisternaSchedaDetail = {
  id: string;
  sourceLabel: string;
  monthKey: string | null;
  rowCount: number;
  targa: string | null;
  needsReview: boolean;
  createdAtLabel: string | null;
  rows: NextCisternaSchedaDetailRow[];
};

export type NextCisternaPerTargaItem = {
  targa: string;
  aziendaLabel: string;
  litri: number;
  costoStimatoValuta: number | null;
  costoStimatoChf: number | null;
};

export type NextCisternaDetailRow = {
  id: string;
  data: string;
  targa: string;
  litri: number;
  nome: string;
  autista: string;
  aziendaLabel: string;
  supportLitri: number | null;
  supportCount: number;
  supportStatus: "MATCH" | "DIFFERENZA" | "-";
  diff: number | null;
};

export type NextCisternaSnapshot = {
  domainCode: typeof NEXT_CISTERNA_DOMAIN.code;
  domainName: typeof NEXT_CISTERNA_DOMAIN.name;
  logicalDatasets: readonly string[];
  normalizationStrategy: typeof NEXT_CISTERNA_DOMAIN.normalizationStrategy;
  monthKey: string;
  monthLabel: string;
  availableMonths: string[];
  refuelsDatasetShape: NextLegacyDatasetShape;
  counts: {
    documents: number;
    fatture: number;
    bollettini: number;
    duplicateGroups: number;
    schede: number;
    supportRefuels: number;
  };
  archive: {
    supportRefuels: NextCisternaSupportItem[];
    fatture: NextCisternaDocumentItem[];
    bollettini: NextCisternaDocumentItem[];
    bollettiniEffective: NextCisternaDocumentItem[];
    duplicateGroups: NextCisternaDuplicateGroup[];
    documents: NextCisternaDocumentItem[];
    schede: NextCisternaSchedaItem[];
  };
  report: {
    sourceTruth: "scheda-manuale" | "autisti-support";
    sourceTruthLabel: string;
    hasManualTruth: boolean;
    litriTotaliMese: number;
    litriDocumentiMese: number;
    litriSupportoMese: number;
    deltaLitriSupporto: number | null;
    cambioEurChf: number | null;
    costi: {
      baseCurrency: "EUR" | "CHF" | null;
      totalFatturaValuta: number | null;
      totalChfNormalized: number | null;
      costoPerLitroValuta: number | null;
      costoPerLitroChf: number | null;
      hasFatture: boolean;
      hasValidFattura: boolean;
      missingTotalCount: number;
      unknownCurrencyCount: number;
      mixedCurrency: boolean;
      needsCambioForChf: boolean;
    };
    ripartizioneAzienda: {
      cementi: {
        litri: number;
        costoValuta: number | null;
        costoChf: number | null;
      };
      import: {
        litri: number;
        costoValuta: number | null;
        costoChf: number | null;
      };
    };
    perTarga: NextCisternaPerTargaItem[];
    detailRows: NextCisternaDetailRow[];
    notes: string[];
  };
  quality: NextCisternaQuality;
  derivationNotes: string[];
  blockedActions: string[];
  limitations: string[];
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const text = String(value).trim();
  if (!text) return null;
  const normalized = text
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateFromUnknown(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "number") {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "string") {
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;

    const match = value.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    if (!match) return null;
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
    const date = new Date(year, month, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object") {
    const maybeTimestamp = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybeTimestamp.toDate === "function") {
      const date = maybeTimestamp.toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof maybeTimestamp.seconds === "number") {
      const date = new Date(maybeTimestamp.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof maybeTimestamp._seconds === "number") {
      const date = new Date(maybeTimestamp._seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  return null;
}

function formatDateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

function normalizeDateKey(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);
  if (match[3].length === 2) year += 2000;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }

  return formatDateKey(date);
}

function formatLitri(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "-";
  const rounded = Math.round(value * 100) / 100;
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

function normalizeCurrency(value: unknown): "EUR" | "CHF" | "UNKNOWN" {
  const raw = String(value ?? "").trim().toUpperCase();
  if (!raw) return "UNKNOWN";
  if (raw.includes("CHF") || raw.includes("FR")) return "CHF";
  if (raw.includes("EUR") || raw.includes("EURO")) return "EUR";
  return "UNKNOWN";
}

function normalizeAziendaKey(value: unknown): AziendaKey {
  const raw = String(value ?? "").trim().toLowerCase();
  if (raw === "import" || raw === "ghielmiimport" || raw === "ghielmimport") {
    return "import";
  }
  return "cementi";
}

function formatAziendaLabel(value: AziendaKey): string {
  return value === "import" ? "GHIELMIIMPORT" : "GHIELMICEMENTI";
}

function normalizeYearMonth(value: unknown): string | null {
  const text = String(value ?? "").trim();
  const match = text.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const month = Number(match[2]);
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;
  return text;
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

function getDocDate(docItem: CisternaDocumento): Date | null {
  const fromData = toDateFromUnknown(docItem.dataDocumento);
  if (fromData) return fromData;
  return toDateFromUnknown(docItem.createdAt);
}

function getDocumentoLitri(docItem: CisternaDocumento): number | null {
  return toNumberOrNull(
    docItem.litriTotali ?? docItem.litri15C ?? docItem.litriAmbiente ?? null,
  );
}

function isFatturaDoc(docItem: CisternaDocumento): boolean {
  const tipo = String(docItem.tipoDocumento ?? "").trim().toLowerCase();
  const nomeFile = String(docItem.nomeFile ?? "").trim().toLowerCase();
  return tipo.includes("fattur") || nomeFile.includes("fattur");
}

function isBollettinoDoc(docItem: CisternaDocumento): boolean {
  const tipo = String(docItem.tipoDocumento ?? "").trim().toLowerCase();
  const nomeFile = String(docItem.nomeFile ?? "").trim().toLowerCase();
  return (
    tipo.includes("bollett") ||
    tipo.includes("bolla") ||
    tipo.includes("ddt") ||
    nomeFile.includes("bollett") ||
    nomeFile.includes("bolla") ||
    nomeFile.includes("ddt")
  );
}

function getRefuelDate(record: RifornimentoAutistaRecord): Date | null {
  return toDateFromUnknown(record.data) || toDateFromUnknown(record.timestamp) || null;
}

function getRefuelTarga(record: RifornimentoAutistaRecord): string {
  const raw = record.targaCamion ?? record.targaMotrice ?? record.mezzoTarga ?? "";
  return String(raw).trim().toUpperCase();
}

function getRefuelAutista(record: RifornimentoAutistaRecord): string {
  const direct = [
    record.autistaNome,
    record.nomeAutista,
    typeof record.autista === "string" ? record.autista : null,
    typeof record.autista === "object" && record.autista ? record.autista.nome : null,
  ]
    .map((value) => String(value ?? "").trim())
    .find((value) => value !== "");

  return direct || "-";
}

function getSchedaDate(docItem: CisternaSchedaDoc): Date | null {
  const fromCreated = toDateFromUnknown(docItem.createdAt);
  if (fromCreated) return fromCreated;
  const firstRow = Array.isArray(docItem.rows) ? docItem.rows[0] : null;
  if (firstRow?.data) return toDateFromUnknown(firstRow.data);
  return null;
}

function getSchedaRecencyMs(docItem: CisternaSchedaDoc): number {
  const updated = toDateFromUnknown(docItem.updatedAt)?.getTime() ?? 0;
  if (updated > 0) return updated;
  return toDateFromUnknown(docItem.createdAt)?.getTime() ?? 0;
}

function getSchedaTarga(docItem: CisternaSchedaDoc): string {
  const firstRow = Array.isArray(docItem.rows) ? docItem.rows[0] : null;
  return String(firstRow?.targa ?? "").trim().toUpperCase();
}

function isManualScheda(docItem: CisternaSchedaDoc): boolean {
  const source = String(docItem.source ?? "").trim().toLowerCase();
  return source === "manual";
}

function toArchiveDocumentItem(
  docItem: CisternaDocumento,
  duplicateState: NextCisternaDocumentItem["duplicateState"],
): NextCisternaDocumentItem {
  const date = getDocDate(docItem);
  return {
    id: docItem.id,
    dateLabel: date ? date.toLocaleDateString("it-CH") : "-",
    timestamp: date?.getTime() ?? null,
    tipoDocumento: normalizeOptionalText(docItem.tipoDocumento),
    fornitore: normalizeOptionalText(docItem.fornitore),
    prodotto: normalizeOptionalText(docItem.prodotto),
    litriLabel: `${formatLitri(getDocumentoLitri(docItem))} L`,
    luogoConsegna: normalizeOptionalText(docItem.luogoConsegna),
    fileUrl: normalizeOptionalText(docItem.fileUrl),
    duplicateState,
  };
}

async function readDocuments(): Promise<CisternaDocumento[]> {
  const snapshot = await getDocs(collection(db, CISTERNA_DOCUMENTI_COLLECTION));
  const rows: CisternaDocumento[] = [];
  snapshot.forEach((docSnap) => {
    const raw = docSnap.data() as Partial<CisternaDocumento>;
    rows.push({
      id: docSnap.id,
      ...raw,
      litri15C: toNumberOrNull(raw.litri15C),
      litriAmbiente: toNumberOrNull(raw.litriAmbiente),
      litriTotali: toNumberOrNull(raw.litriTotali),
      totaleDocumento: toNumberOrNull(raw.totaleDocumento),
    });
  });

  rows.sort((left, right) => {
    const leftMs = getDocDate(left)?.getTime() ?? 0;
    const rightMs = getDocDate(right)?.getTime() ?? 0;
    return rightMs - leftMs;
  });

  return rows;
}

async function readRefuels(): Promise<{
  datasetShape: NextLegacyDatasetShape;
  items: RifornimentoAutistaRecord[];
}> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, RIFORNIMENTI_AUTISTI_KEY));
  const rawDoc = snapshot.exists() ? ((snapshot.data() as Record<string, unknown>) ?? null) : null;
  const dataset = unwrapStorageArray(rawDoc);
  return {
    datasetShape: dataset.datasetShape,
    items: dataset.items as RifornimentoAutistaRecord[],
  };
}

async function readSchede(): Promise<CisternaSchedaDoc[]> {
  const snapshot = await getDocs(collection(db, CISTERNA_SCHEDE_COLLECTION));
  const rows: CisternaSchedaDoc[] = [];
  snapshot.forEach((docSnap) => {
    const raw = docSnap.data() as Partial<CisternaSchedaDoc>;
    rows.push({
      id: docSnap.id,
      ...raw,
    });
  });

  rows.sort((left, right) => {
    const leftMs = getSchedaDate(left)?.getTime() ?? 0;
    const rightMs = getSchedaDate(right)?.getTime() ?? 0;
    if (rightMs !== leftMs) return rightMs - leftMs;
    return getSchedaTarga(left).localeCompare(getSchedaTarga(right));
  });

  return rows;
}

async function readParametriMensili(): Promise<Map<string, CisternaParametroMensile>> {
  const snapshot = await getDocs(collection(db, CISTERNA_PARAMETRI_COLLECTION));
  const entries = new Map<string, CisternaParametroMensile>();
  snapshot.forEach((docSnap) => {
    const raw = docSnap.data() as Partial<CisternaParametroMensile>;
    const key = normalizeYearMonth(raw.mese) ?? normalizeYearMonth(docSnap.id);
    if (!key) return;
    entries.set(key, {
      mese: key,
      cambioEurChf: toNumberOrNull(raw.cambioEurChf),
      updatedAt: raw.updatedAt,
    });
  });
  return entries;
}

function buildAvailableMonths(args: {
  selectedMonth: string;
  documents: CisternaDocumento[];
  refuels: RifornimentoAutistaRecord[];
  schede: CisternaSchedaDoc[];
  parametri: Map<string, CisternaParametroMensile>;
}): string[] {
  const months = new Set<string>();
  months.add(args.selectedMonth);
  months.add(currentMonthKey());

  args.documents.forEach((item) => {
    const date = getDocDate(item);
    if (!date) return;
    months.add(monthKeyFromDate(date));
  });

  args.refuels.forEach((item) => {
    const date = getRefuelDate(item);
    if (!date) return;
    months.add(monthKeyFromDate(date));
  });

  args.schede.forEach((item) => {
    const key = normalizeYearMonth(item.yearMonth ?? item.mese);
    if (key) {
      months.add(key);
      return;
    }
    const date = getSchedaDate(item);
    if (!date) return;
    months.add(monthKeyFromDate(date));
  });

  args.parametri.forEach((_, key) => months.add(key));

  return Array.from(months)
    .filter((value) => Boolean(value))
    .sort((left, right) => right.localeCompare(left));
}

function buildSupportRows(
  refuels: RifornimentoAutistaRecord[],
  selectedMonth: string,
): NextCisternaSupportItem[] {
  return refuels
    .filter((item) => {
      const tipo = String(item.tipo ?? "").trim().toLowerCase();
      if (tipo !== CISTERNA_REFUEL_TAG) return false;
      const date = getRefuelDate(item);
      if (!date) return false;
      return monthKeyFromDate(date) === selectedMonth;
    })
    .map((item, index) => {
      const date = getRefuelDate(item);
      const dateLabel = date ? date.toLocaleDateString("it-CH") : "-";
      return {
        id: String(item.id ?? `${index}_${dateLabel}_${getRefuelTarga(item)}`),
        dateLabel,
        targa: getRefuelTarga(item) || "NON INDICATA",
        litri: toNumberOrNull(item.litri) ?? 0,
        autista: getRefuelAutista(item),
      };
    })
    .sort((left, right) => {
      if (right.dateLabel !== left.dateLabel) {
        return right.dateLabel.localeCompare(left.dateLabel);
      }
      return left.targa.localeCompare(right.targa);
    });
}

function buildBollettiniResolution(
  bollettiniDocs: CisternaDocumento[],
  selectedMonth: string,
): {
  bollettiniEffective: NextCisternaDocumentItem[];
  duplicateGroups: NextCisternaDuplicateGroup[];
  fallbackCount: number;
} {
  const groupsByKey = new Map<
    string,
    { key: string; dateLabel: string; docs: CisternaDocumento[] }
  >();

  bollettiniDocs.forEach((item) => {
    const dataKey = String(item.dataDocumento ?? "").trim();
    if (!dataKey) return;
    const groupKey = `${selectedMonth}__${dataKey}`;
    const group = groupsByKey.get(groupKey) ?? { key: groupKey, dateLabel: dataKey, docs: [] };
    group.docs.push(item);
    groupsByKey.set(groupKey, group);
  });

  const duplicateGroups = Array.from(groupsByKey.values()).filter((group) => group.docs.length > 1);
  const duplicateInfo = new Map<
    string,
    { chosenId: string; resolution: "persisted" | "fallback-max-litri" }
  >();

  duplicateGroups.forEach((group) => {
    const chosenDoc = group.docs.find((item) => item.dupChosen);
    const fallbackDoc = group.docs.reduce((best, current) => {
      const bestLitri = getDocumentoLitri(best) ?? -Infinity;
      const currentLitri = getDocumentoLitri(current) ?? -Infinity;
      return currentLitri > bestLitri ? current : best;
    }, group.docs[0]);

    duplicateInfo.set(group.key, {
      chosenId: chosenDoc?.id ?? fallbackDoc.id,
      resolution: chosenDoc ? "persisted" : "fallback-max-litri",
    });
  });

  const effective: NextCisternaDocumentItem[] = [];
  bollettiniDocs.forEach((item) => {
    if (item.dupIgnored) return;
    const dataKey = String(item.dataDocumento ?? "").trim();
    if (!dataKey) {
      effective.push(toArchiveDocumentItem(item, "single"));
      return;
    }

    const groupKey = `${selectedMonth}__${dataKey}`;
    const info = duplicateInfo.get(groupKey);
    if (!info) {
      effective.push(toArchiveDocumentItem(item, "single"));
      return;
    }

    if (item.id === info.chosenId) {
      effective.push(toArchiveDocumentItem(item, "value"));
    }
  });

  const duplicateGroupItems = duplicateGroups.map((group) => {
    const info = duplicateInfo.get(group.key);
    const chosenId = info?.chosenId ?? group.docs[0].id;
    return {
      key: group.key,
      dateLabel: group.dateLabel,
      resolution: info?.resolution ?? "fallback-max-litri",
      note:
        info?.resolution === "persisted"
          ? "Scelta duplicati gia persistita nella madre; il clone la mostra in sola lettura."
          : "Nessuna scelta duplicati persistita: il clone usa in modo deterministico il bollettino con piu litri.",
      items: group.docs.map((item) =>
        toArchiveDocumentItem(item, item.id === chosenId ? "value" : "ignored"),
      ),
    } satisfies NextCisternaDuplicateGroup;
  });

  return {
    bollettiniEffective: effective.sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0)),
    duplicateGroups: duplicateGroupItems,
    fallbackCount: duplicateGroupItems.filter((item) => item.resolution === "fallback-max-litri").length,
  };
}

function buildSchedeMonthItems(
  schede: CisternaSchedaDoc[],
  selectedMonth: string,
): NextCisternaSchedaItem[] {
  const monthSchede = schede.filter((item) => {
    const key = normalizeYearMonth(item.yearMonth ?? item.mese);
    if (key) return key === selectedMonth;
    const date = getSchedaDate(item);
    if (!date) return false;
    return monthKeyFromDate(date) === selectedMonth;
  });

  return monthSchede
    .sort((left, right) => {
      const leftMs = getSchedaDate(left)?.getTime() ?? 0;
      const rightMs = getSchedaDate(right)?.getTime() ?? 0;
      if (rightMs !== leftMs) return rightMs - leftMs;
      return right.id.localeCompare(left.id);
    })
    .map((item) => {
      const created = getSchedaDate(item);
      const sourceLabel =
        item.source === "manual"
          ? "Manuale"
          : item.source === "ia"
            ? "IA"
            : normalizeOptionalText(item.source) ?? "-";
      return {
        id: item.id,
        dateLabel: created
          ? created.toLocaleString("it-CH")
          : normalizeOptionalText(item.yearMonth ?? item.mese) ?? "-",
        sourceLabel,
        rowCount: item.rowCount ?? (Array.isArray(item.rows) ? item.rows.length : 0),
        targa: getSchedaTarga(item) || null,
        needsReview: Boolean(item.needsReview),
      } satisfies NextCisternaSchedaItem;
    });
}

export async function readNextCisternaSchedaDetail(
  schedaId: string,
): Promise<NextCisternaSchedaDetail | null> {
  const targetId = normalizeText(schedaId);
  if (!targetId) {
    return null;
  }

  const schede = await readSchede();
  const item = schede.find((entry) => entry.id === targetId);
  if (!item) {
    return null;
  }

  const sourceLabel =
    item.source === "manual"
      ? "Manuale"
      : item.source === "ia"
        ? "IA"
        : normalizeOptionalText(item.source) ?? "-";
  const createdAt = getSchedaDate(item);
  const monthKey =
    normalizeYearMonth(item.yearMonth ?? item.mese) ??
    (createdAt ? monthKeyFromDate(createdAt) : null);
  const rows = Array.isArray(item.rows) ? item.rows : [];

  return {
    id: item.id,
    sourceLabel,
    monthKey,
    rowCount: item.rowCount ?? rows.length,
    targa: getSchedaTarga(item) || null,
    needsReview: Boolean(item.needsReview),
    createdAtLabel: createdAt ? createdAt.toLocaleString("it-CH") : null,
    rows: rows.map((row, index) => ({
      index,
      data: normalizeText(row.data) || "-",
      targa: normalizeText(row.targa).toUpperCase() || "-",
      litri: toNumberOrNull(row.litri),
      nome: normalizeText(row.nome) || "-",
      azienda: normalizeText(row.azienda).toUpperCase() || "-",
      statoRevisione: normalizeText(row.statoRevisione) || "n/d",
      note: "",
    })),
  };
}

function toSupportVeritaRows(items: NextCisternaSupportItem[]): VeritaRow[] {
  return items
    .map((item) => {
      const date = toDateFromUnknown(item.dateLabel);
      return {
        id: item.id,
        dataKey: normalizeDateKey(item.dateLabel),
        targa: normalizeText(item.targa).toUpperCase(),
        litri: item.litri,
        nome: "",
        autista: item.autista,
        azienda: "cementi" as AziendaKey,
        timestamp: date?.getTime() ?? 0,
        source: "autisti" as const,
      };
    })
    .filter((item) => item.dataKey && item.targa && item.litri > 0)
    .sort((left, right) => {
      if (right.timestamp !== left.timestamp) return right.timestamp - left.timestamp;
      return left.targa.localeCompare(right.targa);
    });
}

function buildVeritaRows(
  schede: CisternaSchedaDoc[],
  selectedMonth: string,
  supportItems: NextCisternaSupportItem[],
): {
  sourceTruth: "scheda-manuale" | "autisti-support";
  sourceTruthLabel: string;
  hasManualTruth: boolean;
  latestManualSchedaId: string | null;
  latestManualSchedaLabel: string | null;
  veritaRows: VeritaRow[];
  supportRows: VeritaRow[];
  droppedManualRows: number;
} {
  const supportRows = toSupportVeritaRows(supportItems);
  const monthSchede = schede.filter((item) => {
    const key = normalizeYearMonth(item.yearMonth ?? item.mese);
    if (key) return key === selectedMonth;
    const date = getSchedaDate(item);
    if (!date) return false;
    return monthKeyFromDate(date) === selectedMonth;
  });

  const manualSchede = monthSchede
    .filter((item) => isManualScheda(item))
    .sort((left, right) => {
      const leftMs = getSchedaRecencyMs(left);
      const rightMs = getSchedaRecencyMs(right);
      if (rightMs !== leftMs) return rightMs - leftMs;
      return right.id.localeCompare(left.id);
    });

  const latestManualScheda = manualSchede[0] ?? null;
  if (!latestManualScheda || !Array.isArray(latestManualScheda.rows)) {
    return {
      sourceTruth: "autisti-support",
      sourceTruthLabel: "Supporto autisti",
      hasManualTruth: false,
      latestManualSchedaId: null,
      latestManualSchedaLabel: null,
      veritaRows: supportRows,
      supportRows: [],
      droppedManualRows: 0,
    };
  }

  const manualRows = latestManualScheda.rows
    .map((row, index) => {
      const dateKey = normalizeDateKey(row.data);
      const targa = normalizeText(row.targa).toUpperCase();
      const litri = toNumberOrNull(row.litri);
      const timestamp = (() => {
        if (!dateKey) return 0;
        const [day, month, year] = dateKey.split("/");
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(date.getTime()) ? 0 : date.getTime();
      })();

      return {
        id: `${latestManualScheda.id}_${index}`,
        dataKey: dateKey,
        targa,
        litri: litri ?? 0,
        nome: normalizeText(row.nome),
        autista: "",
        azienda: normalizeAziendaKey(row.azienda),
        timestamp,
        source: "manuale" as const,
      };
    })
    .filter((row) => row.dataKey && row.targa && row.litri > 0)
    .sort((left, right) => {
      if (right.timestamp !== left.timestamp) return right.timestamp - left.timestamp;
      return left.targa.localeCompare(right.targa);
    });

  const createdAt = getSchedaDate(latestManualScheda);
  return {
    sourceTruth: "scheda-manuale",
    sourceTruthLabel: "Scheda manuale",
    hasManualTruth: true,
    latestManualSchedaId: latestManualScheda.id,
    latestManualSchedaLabel: createdAt
      ? createdAt.toLocaleString("it-CH")
      : normalizeOptionalText(latestManualScheda.yearMonth ?? latestManualScheda.mese),
    veritaRows: manualRows,
    supportRows,
    droppedManualRows:
      (Array.isArray(latestManualScheda.rows) ? latestManualScheda.rows.length : 0) -
      manualRows.length,
  };
}

function buildReportData(args: {
  selectedMonth: string;
  sourceTruth: "scheda-manuale" | "autisti-support";
  sourceTruthLabel: string;
  hasManualTruth: boolean;
  veritaRows: VeritaRow[];
  supportRows: VeritaRow[];
  docsOfMonth: CisternaDocumento[];
  fattureDocs: CisternaDocumento[];
  bollettiniResolution: {
    bollettiniEffective: NextCisternaDocumentItem[];
    duplicateGroups: NextCisternaDuplicateGroup[];
    fallbackCount: number;
  };
  cambioEurChf: number | null;
}): NextCisternaSnapshot["report"] {
  const litriDocumentiNonBollettini = args.docsOfMonth
    .filter((item) => !isBollettinoDoc(item))
    .reduce((sum, item) => sum + (toNumberOrNull(item.litri15C) ?? 0), 0);

  const litriBollettini = args.bollettiniResolution.bollettiniEffective.reduce((sum, item) => {
    const sourceDoc = args.docsOfMonth.find((docItem) => docItem.id === item.id);
    return sum + (sourceDoc ? getDocumentoLitri(sourceDoc) ?? 0 : 0);
  }, 0);

  const litriDocumentiMese = litriDocumentiNonBollettini + litriBollettini;
  const litriTotaliMese = args.veritaRows.reduce((sum, item) => sum + item.litri, 0);
  const litriSupportoMese = args.supportRows.reduce((sum, item) => sum + item.litri, 0);
  const deltaLitriSupporto =
    args.hasManualTruth && args.supportRows.length > 0
      ? litriTotaliMese - litriSupportoMese
      : null;

  let totalEur = 0;
  let totalChf = 0;
  let missingTotalCount = 0;
  let unknownCurrencyCount = 0;
  const currencySet = new Set<"EUR" | "CHF">();

  args.fattureDocs.forEach((item) => {
    const total = toNumberOrNull(item.totaleDocumento);
    if (total == null) {
      missingTotalCount += 1;
      return;
    }

    const currency = normalizeCurrency(item.valuta ?? item.currency);
    if (currency !== "EUR" && currency !== "CHF") {
      unknownCurrencyCount += 1;
      return;
    }

    currencySet.add(currency);
    if (currency === "EUR") totalEur += total;
    if (currency === "CHF") totalChf += total;
  });

  const baseCurrency = currencySet.size === 1 ? Array.from(currencySet)[0] : null;
  const mixedCurrency = currencySet.size > 1;
  const totalFatturaValuta =
    baseCurrency === "EUR" ? totalEur : baseCurrency === "CHF" ? totalChf : null;
  const hasFatture = args.fattureDocs.length > 0;
  const hasValidFattura =
    hasFatture &&
    !mixedCurrency &&
    missingTotalCount === 0 &&
    unknownCurrencyCount === 0 &&
    totalFatturaValuta != null;

  const costoPerLitroValuta =
    hasValidFattura && litriTotaliMese > 0 && totalFatturaValuta != null
      ? totalFatturaValuta / litriTotaliMese
      : null;

  const totalChfNormalized =
    baseCurrency === "EUR"
      ? args.cambioEurChf && args.cambioEurChf > 0 && totalFatturaValuta != null
        ? totalFatturaValuta * args.cambioEurChf
        : null
      : baseCurrency === "CHF"
        ? totalFatturaValuta
        : null;

  const costoPerLitroChf =
    baseCurrency === "EUR"
      ? args.cambioEurChf && args.cambioEurChf > 0 && costoPerLitroValuta != null
        ? costoPerLitroValuta * args.cambioEurChf
        : null
      : baseCurrency === "CHF"
        ? costoPerLitroValuta
        : null;

  const needsCambioForChf = baseCurrency === "EUR" && !(args.cambioEurChf && args.cambioEurChf > 0);

  const ripartizioneAzienda = args.veritaRows.reduce(
    (acc, row) => {
      acc[row.azienda].litri += row.litri;
      return acc;
    },
    {
      cementi: { litri: 0, costoValuta: null as number | null, costoChf: null as number | null },
      import: { litri: 0, costoValuta: null as number | null, costoChf: null as number | null },
    },
  );

  (Object.keys(ripartizioneAzienda) as AziendaKey[]).forEach((key) => {
    const bucket = ripartizioneAzienda[key];
    bucket.costoValuta =
      costoPerLitroValuta == null ? null : bucket.litri * costoPerLitroValuta;
    bucket.costoChf = costoPerLitroChf == null ? null : bucket.litri * costoPerLitroChf;
  });

  const perTargaMap = new Map<
    string,
    { litri: number; litriCementi: number; litriImport: number }
  >();
  args.veritaRows.forEach((row) => {
    const key = row.targa || "NON INDICATA";
    const current = perTargaMap.get(key) ?? { litri: 0, litriCementi: 0, litriImport: 0 };
    current.litri += row.litri;
    if (row.azienda === "import") {
      current.litriImport += row.litri;
    } else {
      current.litriCementi += row.litri;
    }
    perTargaMap.set(key, current);
  });

  const perTarga = Array.from(perTargaMap.entries())
    .map(([targa, stats]) => {
      const aziendaLabel =
        stats.litriImport > 0 && stats.litriCementi > 0
          ? "MISTA"
          : stats.litriImport > 0
            ? formatAziendaLabel("import")
            : formatAziendaLabel("cementi");

      return {
        targa,
        aziendaLabel,
        litri: stats.litri,
        costoStimatoValuta:
          costoPerLitroValuta == null ? null : stats.litri * costoPerLitroValuta,
        costoStimatoChf: costoPerLitroChf == null ? null : stats.litri * costoPerLitroChf,
      } satisfies NextCisternaPerTargaItem;
    })
    .sort((left, right) => left.targa.localeCompare(right.targa));

  const supportByDateTarga = new Map<string, { litri: number; count: number }>();
  args.supportRows.forEach((row) => {
    const key = `${row.dataKey}__${row.targa}`;
    const current = supportByDateTarga.get(key) ?? { litri: 0, count: 0 };
    current.litri += row.litri;
    current.count += 1;
    supportByDateTarga.set(key, current);
  });

  const detailRows = args.veritaRows.map((row) => {
    const support = supportByDateTarga.get(`${row.dataKey}__${row.targa}`) ?? null;
    const diff = support ? row.litri - support.litri : null;
    const isMatch = support ? Math.abs(diff ?? 0) <= 2 : false;

    return {
      id: row.id,
      data: row.dataKey,
      targa: row.targa,
      litri: row.litri,
      nome: row.nome || "-",
      autista: row.autista || "-",
      aziendaLabel: formatAziendaLabel(row.azienda),
      supportLitri: support?.litri ?? null,
      supportCount: support?.count ?? 0,
      supportStatus: support ? (isMatch ? "MATCH" : "DIFFERENZA") : "-",
      diff,
    } satisfies NextCisternaDetailRow;
  });

  const notes: string[] = [];
  if (!args.hasManualTruth) {
    notes.push(
      "Nessuna scheda manuale trovata nel mese: il clone usa in sola lettura il supporto autisti come fonte verita.",
    );
  }
  if (args.bollettiniResolution.fallbackCount > 0) {
    notes.push(
      `Per ${args.bollettiniResolution.fallbackCount} gruppi di bollettini duplicati il clone usa il fallback deterministico al documento con piu litri.`,
    );
  }
  if (mixedCurrency) {
    notes.push("Le fatture del mese usano valute miste: i costi aggregati restano non deterministici.");
  }
  if (missingTotalCount > 0) {
    notes.push(`${missingTotalCount} fatture non espongono un totale valido e non entrano nel calcolo costi.`);
  }
  if (unknownCurrencyCount > 0) {
    notes.push(`${unknownCurrencyCount} fatture non espongono una valuta riconoscibile.`);
  }
  if (needsCambioForChf) {
    notes.push("Manca il cambio EUR/CHF del mese: i valori normalizzati in CHF restano parziali.");
  }
  if (detailRows.length === 0) {
    notes.push("Nessuna riga di dettaglio ricostruibile in modo affidabile per il mese selezionato.");
  }

  return {
    sourceTruth: args.sourceTruth,
    sourceTruthLabel: args.sourceTruthLabel,
    hasManualTruth: args.hasManualTruth,
    litriTotaliMese,
    litriDocumentiMese,
    litriSupportoMese,
    deltaLitriSupporto,
    cambioEurChf: args.cambioEurChf,
    costi: {
      baseCurrency,
      totalFatturaValuta,
      totalChfNormalized,
      costoPerLitroValuta,
      costoPerLitroChf,
      hasFatture,
      hasValidFattura,
      missingTotalCount,
      unknownCurrencyCount,
      mixedCurrency,
      needsCambioForChf,
    },
    ripartizioneAzienda,
    perTarga,
    detailRows,
    notes,
  };
}

export async function readNextCisternaSnapshot(
  monthInput?: string | null,
): Promise<NextCisternaSnapshot> {
  const requestedMonth = normalizeYearMonth(monthInput) ?? currentMonthKey();
  const [documents, refuelsState, schede, parametri] = await Promise.all([
    readDocuments(),
    readRefuels(),
    readSchede(),
    readParametriMensili(),
  ]);

  const availableMonths = buildAvailableMonths({
    selectedMonth: requestedMonth,
    documents,
    refuels: refuelsState.items,
    schede,
    parametri,
  });
  const monthKey = availableMonths.includes(requestedMonth)
    ? requestedMonth
    : availableMonths[0] ?? requestedMonth;

  const docsOfMonth = documents.filter((item) => {
    const date = getDocDate(item);
    return Boolean(date) && monthKeyFromDate(date as Date) === monthKey;
  });

  const supportRefuels = buildSupportRows(refuelsState.items, monthKey);
  const fattureDocs = docsOfMonth.filter((item) => isFatturaDoc(item));
  const bollettiniDocs = docsOfMonth.filter((item) => isBollettinoDoc(item));
  const bollettiniResolution = buildBollettiniResolution(bollettiniDocs, monthKey);
  const schedeItems = buildSchedeMonthItems(schede, monthKey);
  const veritaState = buildVeritaRows(schede, monthKey, supportRefuels);
  const cambioEurChf = parametri.get(monthKey)?.cambioEurChf ?? null;
  const report = buildReportData({
    selectedMonth: monthKey,
    sourceTruth: veritaState.sourceTruth,
    sourceTruthLabel: veritaState.sourceTruthLabel,
    hasManualTruth: veritaState.hasManualTruth,
    veritaRows: veritaState.veritaRows,
    supportRows: veritaState.supportRows,
    docsOfMonth,
    fattureDocs,
    bollettiniResolution,
    cambioEurChf,
  });

  const derivationNotes = [
    veritaState.hasManualTruth
      ? `Il mese usa come fonte verita l'ultima scheda manuale disponibile (${veritaState.latestManualSchedaLabel ?? veritaState.latestManualSchedaId ?? "scheda"}).`
      : "Nessuna scheda manuale disponibile: il clone usa il supporto autisti come fonte verita read-only.",
    bollettiniResolution.fallbackCount > 0
      ? "Per i bollettini duplicati senza scelta persistita il clone applica il fallback deterministico al documento con piu litri."
      : "Per i bollettini duplicati il clone mostra la scelta gia persistita nella madre quando presente.",
    cambioEurChf == null
      ? "Il cambio EUR/CHF del mese non e salvato: i valori normalizzati in CHF possono restare parziali."
      : `Cambio EUR/CHF del mese letto in sola lettura: ${cambioEurChf}.`,
  ];

  const blockedActions = [
    "Conferma duplicati bollettini",
    "Salvataggio cambio EUR/CHF",
    "Apertura operativa di Cisterna IA",
    "Apertura operativa di Schede Test",
    "Edit schede esistenti",
    "Export PDF report",
  ];

  const limitations = [
    refuelsState.datasetShape === "unsupported"
      ? "Il dataset `@rifornimenti_autisti_tmp` non espone una shape supportata fuori dai formati array/items/value/value.items."
      : null,
    veritaState.droppedManualRows > 0
      ? `${veritaState.droppedManualRows} righe della scheda manuale del mese sono state escluse dal report per dati incompleti o non normalizzabili.`
      : null,
    report.detailRows.length === 0
      ? "Il dettaglio mese non e pienamente ricostruibile: il clone mostra solo archivio e riepiloghi disponibili."
      : null,
    report.costi.mixedCurrency
      ? "Le fatture del mese usano valute miste: il clone mostra i litri ma non consolida un costo unico deterministico."
      : null,
    report.costi.needsCambioForChf
      ? "Manca il parametro mensile EUR/CHF: le colonne CHF restano parziali."
      : null,
  ].filter((item): item is string => Boolean(item));

  const quality: NextCisternaQuality =
    report.litriTotaliMese <= 0 && docsOfMonth.length === 0 && schedeItems.length === 0
      ? "da_verificare"
      : limitations.length > 0 || report.notes.length > 0
        ? "parziale"
        : "certo";

  return {
    domainCode: NEXT_CISTERNA_DOMAIN.code,
    domainName: NEXT_CISTERNA_DOMAIN.name,
    logicalDatasets: NEXT_CISTERNA_DOMAIN.logicalDatasets,
    normalizationStrategy: NEXT_CISTERNA_DOMAIN.normalizationStrategy,
    monthKey,
    monthLabel: monthLabel(monthKey),
    availableMonths,
    refuelsDatasetShape: refuelsState.datasetShape,
    counts: {
      documents: docsOfMonth.length,
      fatture: fattureDocs.length,
      bollettini: bollettiniDocs.length,
      duplicateGroups: bollettiniResolution.duplicateGroups.length,
      schede: schedeItems.length,
      supportRefuels: supportRefuels.length,
    },
    archive: {
      supportRefuels,
      fatture: fattureDocs.map((item) => toArchiveDocumentItem(item, "single")),
      bollettini: bollettiniDocs.map((item) => toArchiveDocumentItem(item, "single")),
      bollettiniEffective: bollettiniResolution.bollettiniEffective,
      duplicateGroups: bollettiniResolution.duplicateGroups,
      documents: docsOfMonth.map((item) => toArchiveDocumentItem(item, "single")),
      schede: schedeItems,
    },
    report,
    quality,
    derivationNotes,
    blockedActions,
    limitations,
  };
}
