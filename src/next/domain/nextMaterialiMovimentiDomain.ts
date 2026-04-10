import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import {
  readNextMaterialiMovimentiCloneDeletedIds,
  readNextMaterialiMovimentiCloneRecords,
} from "../nextMaterialiMovimentiCloneState";
import {
  readNextAttrezzatureCantieriSnapshot,
  type NextAttrezzatureCantieriSnapshot,
} from "./nextAttrezzatureCantieriDomain";
import {
  buildNextMagazzinoStockKey,
  normalizeNextMagazzinoStockUnitLoose,
} from "./nextMagazzinoStockContract";
import {
  readNextInventarioSnapshot,
  type NextInventarioSnapshot,
} from "./nextInventarioDomain";
import type {
  NextDocumentiCostiCurrency,
  NextDocumentiMagazzinoSupportDocument,
} from "./nextDocumentiCostiDomain";

const STORAGE_COLLECTION = "storage";
const MATERIALI_MOVIMENTI_DATASET_KEY = "@materialiconsegnati";
const CISTERNE_ADBLUE_DATASET_KEY = "@cisterne_adblue";

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export type NextMaterialeMovimentoFieldQuality =
  | "certo"
  | "ricostruito"
  | "non_disponibile";

export type NextMaterialeMovimentoRecordQuality =
  | "certo"
  | "parziale"
  | "da_verificare";

export type NextMaterialeMovimentoDestinatarioType =
  | "MEZZO"
  | "COLLEGA"
  | "MAGAZZINO"
  | null;

export type NextMaterialeMovimentoMezzoMatchKind =
  | "direct_targa"
  | "destinatario_label_targa"
  | "destinatario_ref_targa"
  | "destinatario_ref_id"
  | null;

export type NextMaterialeMovimentoMezzoMatchReliability =
  | "forte"
  | "plausibile";

export type NextMaterialiMovimentiCoverageMatch =
  | "forte"
  | "mista"
  | "plausibile"
  | "vuota";

export type NextMaterialiMovimentiPeriodFilterStatus =
  | "affidabile"
  | "parziale"
  | "non_dimostrabile";

export const NEXT_MATERIALI_MOVIMENTI_DOMAIN = {
  code: "D05-MATERIALI",
  name: "Materiali e movimenti mezzo-centrici",
  logicalDatasets: [MATERIALI_MOVIMENTI_DATASET_KEY] as const,
  activeReadOnlyDataset: MATERIALI_MOVIMENTI_DATASET_KEY,
  normalizationStrategy: "NORMALIZER DEDICATO NEXT MATERIALI / MOVIMENTI READ-ONLY",
  outputContract: {
    certain: ["id", "source", "quality", "flags"] as const,
    optional: [
      "targa",
      "mezzoTarga",
      "destinatario",
      "target",
      "tipoDestinatario",
      "materiale",
      "descrizione",
      "quantita",
      "unita",
      "data",
      "timestamp",
      "fornitore",
      "costoUnitario",
      "costoTotale",
    ] as const,
    mezzoMatchKinds: [
      "direct_targa",
      "destinatario_label_targa",
      "destinatario_ref_targa",
      "destinatario_ref_id",
    ] as const,
  },
} as const;

type NextNormalizedDestinatario = {
  label: string | null;
  refId: string | null;
  type: NextMaterialeMovimentoDestinatarioType;
  rawShape: "object" | "string" | "missing";
};

export type NextMaterialeMovimentoReadOnlyItem = {
  id: string;
  targa: string | null;
  mezzoTarga: string | null;
  inventarioRefId: string | null;
  stockKey: string | null;
  destinatario: NextNormalizedDestinatario;
  target: string | null;
  tipoDestinatario: NextMaterialeMovimentoDestinatarioType;
  materiale: string | null;
  descrizione: string | null;
  quantita: number | null;
  unita: string | null;
  data: string | null;
  timestamp: number | null;
  fornitore: string | null;
  motivo: string | null;
  direzione: "IN" | "OUT" | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof MATERIALI_MOVIMENTI_DATASET_KEY;
  source: {
    dataset: typeof MATERIALI_MOVIMENTI_DATASET_KEY;
    sourceRecordId: string | null;
    destinatarioShape: NextNormalizedDestinatario["rawShape"];
  };
  fieldQuality: {
    mezzoLink: NextMaterialeMovimentoFieldQuality;
    destinatario: NextMaterialeMovimentoFieldQuality;
    descrizione: NextMaterialeMovimentoFieldQuality;
    quantita: NextMaterialeMovimentoFieldQuality;
    data: NextMaterialeMovimentoFieldQuality;
    fornitore: NextMaterialeMovimentoFieldQuality;
  };
  quality: NextMaterialeMovimentoRecordQuality;
  flags: string[];
};

export type NextMaterialeMovimentoCostSnapshot = {
  costoUnitario: number | null;
  costoTotale: number | null;
  costoCurrency: NextDocumentiCostiCurrency;
  costoSourceCollection: "@documenti_magazzino" | null;
  costoSourceDocId: string | null;
  costoMatchedDescription: string | null;
  quality: NextMaterialeMovimentoFieldQuality;
  flags: string[];
};

export type NextMezzoMaterialeMovimentoReadOnlyItem =
  NextMaterialeMovimentoReadOnlyItem & {
    mezzoMatchKind: Exclude<NextMaterialeMovimentoMezzoMatchKind, null>;
    mezzoMatchReliability: NextMaterialeMovimentoMezzoMatchReliability;
    costoUnitario: number | null;
    costoTotale: number | null;
    costoCurrency: NextDocumentiCostiCurrency;
    costoSourceCollection: "@documenti_magazzino" | null;
    costoSourceDocId: string | null;
    costoMatchedDescription: string | null;
    fieldQuality: NextMaterialeMovimentoReadOnlyItem["fieldQuality"] & {
      costo: NextMaterialeMovimentoFieldQuality;
    };
  };

export type NextMaterialiMovimentiSnapshot = {
  domainCode: typeof NEXT_MATERIALI_MOVIMENTI_DOMAIN.code;
  domainName: typeof NEXT_MATERIALI_MOVIMENTI_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_MATERIALI_MOVIMENTI_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_MATERIALI_MOVIMENTI_DOMAIN.normalizationStrategy;
  outputContract: typeof NEXT_MATERIALI_MOVIMENTI_DOMAIN.outputContract;
  datasetShape: NextLegacyDatasetShape;
  items: NextMaterialeMovimentoReadOnlyItem[];
  counts: {
    total: number;
    conDestinatarioOggetto: number;
    conDestinatarioStringa: number;
    versoMezzo: number;
    versoCollega: number;
    versoMagazzino: number;
    conTargaEsplicita: number;
    conFornitore: number;
    conData: number;
  };
  limitations: string[];
};

export type NextMaterialiMovimentiReadOptions = {
  includeCloneOverlays?: boolean;
};

export type NextMezzoMaterialiMovimentiSnapshot = {
  domainCode: typeof NEXT_MATERIALI_MOVIMENTI_DOMAIN.code;
  domainName: typeof NEXT_MATERIALI_MOVIMENTI_DOMAIN.name;
  mezzoTarga: string;
  mezzoId: string | null;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_MATERIALI_MOVIMENTI_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_MATERIALI_MOVIMENTI_DOMAIN.normalizationStrategy;
  outputContract: typeof NEXT_MATERIALI_MOVIMENTI_DOMAIN.outputContract;
  datasetShape: NextLegacyDatasetShape;
  items: NextMezzoMaterialeMovimentoReadOnlyItem[];
  counts: {
    total: number;
    matchedByExplicitTarga: number;
    matchedByDestinatarioLabelTarga: number;
    matchedByDestinatarioRefTarga: number;
    matchedByDestinatarioRefId: number;
    matchedStrong: number;
    matchedPlausible: number;
    withCost: number;
    withoutCost: number;
    withFornitore: number;
    withReliableDate: number;
    withoutReliableDate: number;
  };
  coverage: {
    match: NextMaterialiMovimentiCoverageMatch;
    periodFilter: NextMaterialiMovimentiPeriodFilterStatus;
  };
  materialCostSupport: {
    documentCount: number;
    rowCount: number;
  };
  limitations: string[];
};

export type NextMaterialiMovimentiLegacyDossierItem = {
  id: string;
  targa?: string;
  mezzoTarga?: string;
  inventarioRefId?: string;
  stockKey?: string;
  destinatario?: {
    type?: string;
    refId?: string;
    label?: string;
  };
  materialeLabel?: string;
  descrizione?: string;
  fornitore?: string;
  motivo?: string;
  quantita?: number;
  unita?: string;
  direzione?: "IN" | "OUT";
  data?: string;
  fornitoreLabel?: string;
  costoUnitario?: number | null;
  costoTotale?: number | null;
  costoCurrency?: NextDocumentiCostiCurrency;
  flags?: string[];
};

export type NextMaterialiMovimentiOperativitaPreviewItem = {
  id: string;
  descrizione: string;
  quantita: number | null;
  data: string | null;
};

export type NextMaterialiConsegnatiDestinatarioView = {
  id: string;
  label: string;
  type: NextMaterialeMovimentoDestinatarioType;
  totalQuantita: number;
  movementCount: number;
  items: NextMaterialeMovimentoReadOnlyItem[];
};

export type NextMagazzinoVehicleLinkSummary = {
  key: string;
  targa: string | null;
  label: string;
  reliability: NextMaterialeMovimentoMezzoMatchReliability;
  movementCount: number;
  latestDate: string | null;
  latestTimestamp: number | null;
  materiali: string[];
  provenienze: string[];
};

export type NextMagazzinoAttentionSignal = {
  id: string;
  kind:
    | "stock_critico"
    | "collegamento_mezzo_prudente"
    | "tracciamento_attrezzature_parziale";
  severity: "alta" | "media";
  title: string;
  summary: string;
  sourceArea: "inventario" | "materiali" | "attrezzature";
  reliability: "alta" | "media";
};

export type NextMagazzinoAdBlueReadOnlyEvent = {
  id: string;
  data: string | null;
  timestamp: number | null;
  quantitaLitri: number | null;
  inventarioRefId: string | null;
  stockKey: string | null;
  numeroCisterna: string | null;
  note: string | null;
  quality: NextMaterialeMovimentoRecordQuality;
  flags: string[];
};

export type NextMagazzinoAdBlueSnapshot = {
  domainCode: "D05-ADBLUE";
  domainName: "AdBlue magazzino clone-safe";
  logicalDatasets: readonly [typeof CISTERNE_ADBLUE_DATASET_KEY];
  activeReadOnlyDataset: typeof CISTERNE_ADBLUE_DATASET_KEY;
  datasetShape: NextLegacyDatasetShape;
  items: NextMagazzinoAdBlueReadOnlyEvent[];
  counts: {
    total: number;
    withReliableDate: number;
    withReliableQuantity: number;
    withInventoryLink: number;
    totalLitriRegistrati: number;
  };
  limitations: string[];
};

export type NextMagazzinoRealeSnapshot = {
  domainCode: "D05";
  domainName: "Magazzino reale del clone NEXT";
  normalizationStrategy: string;
  inventory: NextInventarioSnapshot;
  materials: NextMaterialiMovimentiSnapshot;
  attrezzature: NextAttrezzatureCantieriSnapshot;
  adBlue: NextMagazzinoAdBlueSnapshot;
  vehicleLinks: NextMagazzinoVehicleLinkSummary[];
  attentionSignals: NextMagazzinoAttentionSignal[];
  counts: {
    inventoryItems: number;
    inventoryCritical: number;
    materialMovements: number;
    vehicleLinksStrong: number;
    vehicleLinksPlausible: number;
    attrezzatureMovements: number;
    attrezzatureTrackingGap: number;
    adBlueEvents: number;
    adBlueLitriRegistrati: number;
    attentionSignals: number;
  };
  operationalStatus: {
    mode: "read_only";
    writesEnabled: false;
    label: "Solo lettura";
    summary: string;
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

function dedupeStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0),
    ),
  );
}

function normalizeMatchTarga(value: unknown): string {
  return normalizeNextMezzoTarga(value).replace(/[^A-Z0-9]/g, "");
}

function looksLikeVehicleTarga(value: string | null): boolean {
  if (!value) return false;
  return /^[A-Z0-9]{5,10}$/.test(value) && /\d/.test(value);
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    let normalized = value.trim();
    if (!normalized) return null;
    normalized = normalized.replace(/\s+/g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeDirection(value: unknown): "IN" | "OUT" | null {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === "IN" || normalized === "OUT") return normalized;
  return null;
}

function normalizeDestinatarioType(value: unknown): NextMaterialeMovimentoDestinatarioType {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === "MEZZO" || normalized === "COLLEGA" || normalized === "MAGAZZINO") {
    return normalized;
  }
  return null;
}

function parseDateFlexible(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === "object" && value !== null) {
    const maybe = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof maybe.toDate === "function") {
      const date = maybe.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }

    if (typeof maybe.seconds === "number") {
      const date = new Date(maybe.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof maybe._seconds === "number") {
      const date = new Date(maybe._seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const dmyMatch = raw.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
  );
  if (!dmyMatch) return null;

  const yearRaw = Number(dmyMatch[3]);
  const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
  const month = Number(dmyMatch[2]) - 1;
  const day = Number(dmyMatch[1]);
  const hours = Number(dmyMatch[4] ?? "12");
  const minutes = Number(dmyMatch[5] ?? "00");
  const date = new Date(year, month, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
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

function buildItemId(raw: RawRecord, index: number): string {
  const directId = normalizeText(raw.id);
  if (directId) return directId;

  const descrizione = normalizeText(raw.descrizione ?? raw.materialeLabel);
  const data = normalizeText(raw.data);
  const destinatario = normalizeText(
    typeof raw.destinatario === "string"
      ? raw.destinatario
      : (raw.destinatario as { label?: unknown } | null | undefined)?.label
  );

  const fingerprint = [destinatario, descrizione, data].filter(Boolean).join(":");
  return fingerprint ? `materiale:${fingerprint}:${index}` : `materiale:${index}`;
}

function parseDestinatario(value: unknown): NextNormalizedDestinatario {
  if (typeof value === "string") {
    return {
      label: normalizeOptionalText(value),
      refId: null,
      type: null,
      rawShape: "string",
    };
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const raw = value as RawRecord;
    return {
      label: normalizeOptionalText(raw.label),
      refId: normalizeOptionalText(raw.refId),
      type: normalizeDestinatarioType(raw.type),
      rawShape: "object",
    };
  }

  return {
    label: null,
    refId: null,
    type: null,
    rawShape: "missing",
  };
}

function inferDestinatarioTypeFromContent(args: {
  destinatario: NextNormalizedDestinatario;
  explicitTarga: string | null;
}): NextMaterialeMovimentoDestinatarioType {
  if (args.destinatario.type) {
    return args.destinatario.type;
  }

  const label = normalizeText(args.destinatario.label).toUpperCase();
  const refId = normalizeText(args.destinatario.refId).toUpperCase();
  if (label === "MAGAZZINO" || refId === "MAGAZZINO") {
    return "MAGAZZINO";
  }

  const labelTarga = normalizeMatchTarga(args.destinatario.label);
  const refTarga = normalizeMatchTarga(args.destinatario.refId);
  if (
    args.explicitTarga ||
    looksLikeVehicleTarga(labelTarga) ||
    looksLikeVehicleTarga(refTarga)
  ) {
    return "MEZZO";
  }

  if (args.destinatario.label || args.destinatario.refId) {
    return "COLLEGA";
  }

  return null;
}

function deriveFieldQuality(item: {
  explicitTarga: string | null;
  destinatario: NextNormalizedDestinatario;
  descrizione: string | null;
  materiale: string | null;
  quantita: number | null;
  hasQuantitaRaw: boolean;
  data: string | null;
  hasDataRaw: boolean;
  fornitore: string | null;
}): NextMaterialeMovimentoReadOnlyItem["fieldQuality"] {
  return {
    mezzoLink: item.explicitTarga
      ? "certo"
      : item.destinatario.label || item.destinatario.refId
      ? "ricostruito"
      : "non_disponibile",
    destinatario:
      item.destinatario.rawShape === "object"
        ? item.destinatario.label || item.destinatario.refId || item.destinatario.type
          ? "certo"
          : "non_disponibile"
        : item.destinatario.rawShape === "string"
        ? item.destinatario.label
          ? "ricostruito"
          : "non_disponibile"
        : "non_disponibile",
    descrizione: item.descrizione
      ? "certo"
      : item.materiale
      ? "ricostruito"
      : "non_disponibile",
    quantita:
      item.quantita !== null
        ? "certo"
        : item.hasQuantitaRaw
        ? "ricostruito"
        : "non_disponibile",
    data:
      item.data !== null
        ? item.hasDataRaw
          ? "certo"
          : "ricostruito"
        : "non_disponibile",
    fornitore: item.fornitore ? "certo" : "non_disponibile",
  };
}

function deriveRecordQuality(item: {
  fieldQuality: NextMaterialeMovimentoReadOnlyItem["fieldQuality"];
  descrizione: string | null;
  materiale: string | null;
  quantita: number | null;
  data: string | null;
}): NextMaterialeMovimentoRecordQuality {
  const hasCoreData = Boolean(item.descrizione || item.materiale) && item.quantita !== null && Boolean(item.data);

  if (
    hasCoreData &&
    item.fieldQuality.mezzoLink === "certo" &&
    item.fieldQuality.destinatario === "certo"
  ) {
    return "certo";
  }

  if (hasCoreData || item.fieldQuality.destinatario !== "non_disponibile") {
    return "parziale";
  }

  return "da_verificare";
}

function toNextMaterialeMovimentoReadOnlyItem(
  raw: RawRecord,
  index: number
): NextMaterialeMovimentoReadOnlyItem {
  const parsedDestinatario = parseDestinatario(
    raw.destinatario ?? raw.target ?? raw.destinatarioLabel
  );
  const descrizione = normalizeOptionalText(raw.descrizione);
  const materiale =
    normalizeOptionalText(raw.materialeLabel) ??
    normalizeOptionalText(raw.materiale) ??
    descrizione;
  const quantita = normalizeNumber(raw.quantita);
  const rawDataLabel = normalizeOptionalText(raw.data);
  const timestamp =
    [raw.timestamp, raw.data, raw.createdAt, raw.updatedAt]
      .map((entry) => toTimestamp(entry))
      .find((entry): entry is number => entry !== null) ?? null;
  const data = rawDataLabel ?? formatLegacyDateLabel(timestamp);
  const fornitore =
    normalizeOptionalText(raw.fornitore) ?? normalizeOptionalText(raw.fornitoreLabel);
  const explicitTarga =
    normalizeOptionalText(raw.mezzoTarga)
      ? normalizeMatchTarga(raw.mezzoTarga)
      : normalizeOptionalText(raw.targa)
      ? normalizeMatchTarga(raw.targa)
      : null;
  const mezzoTarga = explicitTarga || null;
  const destinatarioType = inferDestinatarioTypeFromContent({
    destinatario: parsedDestinatario,
    explicitTarga: mezzoTarga,
  });
  const destinatario: NextNormalizedDestinatario = {
    ...parsedDestinatario,
    label:
      parsedDestinatario.label ??
      (destinatarioType === "MAGAZZINO" ? "MAGAZZINO" : mezzoTarga),
    refId:
      parsedDestinatario.refId ??
      (destinatarioType === "MAGAZZINO" ? "MAGAZZINO" : mezzoTarga),
    type: destinatarioType,
  };
  const flags: string[] = [];

  if (destinatario.rawShape === "string") flags.push("destinatario_string_legacy");
  if (destinatario.rawShape === "missing") flags.push("destinatario_assente");
  if (!descrizione && !materiale) flags.push("descrizione_assente");
  if (quantita === null) flags.push("quantita_non_valida");
  if (!data) flags.push("data_assente");
  if (!fornitore) flags.push("fornitore_assente");
  if (!mezzoTarga && (destinatario.label || destinatario.refId)) {
    flags.push("link_mezzo_da_destinatario");
  }
  if (destinatario.type === "COLLEGA") flags.push("destinatario_collega");
  if (destinatario.type === "MAGAZZINO") flags.push("destinatario_magazzino");
  if (mezzoTarga) flags.push("targa_esplicita");
  if (destinatario.type === "MEZZO" && destinatario.refId) {
    const refIdTarga = normalizeMatchTarga(destinatario.refId);
    if (!refIdTarga) flags.push("destinatario_refid_non_targa");
  }

  const fieldQuality = deriveFieldQuality({
    explicitTarga: mezzoTarga,
    destinatario,
    descrizione,
    materiale,
    quantita,
    hasQuantitaRaw: raw.quantita != null,
    data,
    hasDataRaw: raw.data != null,
    fornitore,
  });

  return {
    id: buildItemId(raw, index),
    targa: mezzoTarga,
    mezzoTarga,
    inventarioRefId: normalizeOptionalText(raw.inventarioRefId),
    stockKey:
      buildNextMagazzinoStockKey({
        stockKey: raw.stockKey,
        descrizione,
        fornitore,
        unita: raw.unita,
      }) ?? null,
    destinatario,
    target: destinatario.label,
    tipoDestinatario: destinatario.type,
    materiale,
    descrizione,
    quantita,
    unita: normalizeNextMagazzinoStockUnitLoose(raw.unita) || normalizeOptionalText(raw.unita),
    data,
    timestamp,
    fornitore,
    motivo: normalizeOptionalText(raw.motivo),
    direzione: normalizeDirection(raw.direzione),
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: MATERIALI_MOVIMENTI_DATASET_KEY,
    source: {
      dataset: MATERIALI_MOVIMENTI_DATASET_KEY,
      sourceRecordId: normalizeOptionalText(raw.id),
      destinatarioShape: destinatario.rawShape,
    },
    fieldQuality,
    quality: deriveRecordQuality({
      fieldQuality,
      descrizione,
      materiale,
      quantita,
      data,
    }),
    flags,
  };
}

function sortItems<T extends { id: string; timestamp: number | null }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const byTimestamp = (right.timestamp ?? 0) - (left.timestamp ?? 0);
    if (byTimestamp !== 0) return byTimestamp;
    return right.id.localeCompare(left.id, "it", { sensitivity: "base" });
  });
}

function normalizeAdBlueEvent(
  raw: unknown,
  index: number,
): NextMagazzinoAdBlueReadOnlyEvent | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as RawRecord;
  const timestamp =
    [
      toTimestamp(record.data),
      toTimestamp(record.dataCambio),
      toTimestamp(record.createdAt),
      toTimestamp(record.updatedAt),
    ].find((entry): entry is number => entry !== null) ?? null;
  const data =
    normalizeOptionalText(record.data) ??
    normalizeOptionalText(record.dataCambio) ??
    formatLegacyDateLabel(timestamp);
  const quantitaLitri =
    normalizeNumber(record.quantitaLitri) ??
    normalizeNumber(record.quantita) ??
    normalizeNumber(record.litri);
  const descrizione =
    normalizeOptionalText(record.descrizione) ??
    normalizeOptionalText(record.materialeLabel) ??
    "AdBlue";
  const inventarioRefId = normalizeOptionalText(record.inventarioRefId);
  const stockKey =
    buildNextMagazzinoStockKey({
      stockKey: record.stockKey,
      descrizione,
      fornitore: record.fornitore,
      unita: "lt",
    }) ?? null;
  const flags: string[] = [];

  if (!data) flags.push("data_assente");
  if (quantitaLitri === null) flags.push("quantita_litri_non_valida");
  if (!inventarioRefId) flags.push("inventario_ref_assente");
  if (!stockKey) flags.push("stock_key_assente");

  return {
    id: normalizeOptionalText(record.id) ?? `adblue:${index}`,
    data,
    timestamp,
    quantitaLitri,
    inventarioRefId,
    stockKey,
    numeroCisterna:
      normalizeOptionalText(record.numeroCisterna) ??
      normalizeOptionalText(record.cisterna),
    note: normalizeOptionalText(record.note),
    quality:
      data && quantitaLitri !== null
        ? "certo"
        : data || quantitaLitri !== null
          ? "parziale"
          : "da_verificare",
    flags,
  };
}

function buildGlobalLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  items: NextMaterialeMovimentoReadOnlyItem[];
  counts: NextMaterialiMovimentiSnapshot["counts"];
}): string[] {
  const { datasetShape, items, counts } = args;

  return [
    datasetShape === "unsupported"
      ? "Il dataset `@materialiconsegnati` non espone una shape supportata fuori dai formati `array/value/items`."
      : null,
    "Nel repo i writer legacy non sono uniformi: `MaterialiConsegnati` salva il mezzo con `destinatario.label = targa` e `destinatario.refId = id mezzo`, mentre `Manutenzioni` genera consegne con `destinatario.label = targa` e `destinatario.refId = targa`.",
    counts.conDestinatarioStringa > 0
      ? "Una parte di `@materialiconsegnati` usa ancora `destinatario` come stringa legacy invece che come oggetto strutturato."
      : null,
    counts.conTargaEsplicita === 0
      ? "Il dataset non offre una targa esplicita affidabile sui movimenti: il collegamento mezzo dipende spesso da `destinatario.label` o `destinatario.refId`."
      : null,
    items.some((item) => item.flags.includes("destinatario_refid_non_targa"))
      ? "Il campo `destinatario.refId` non e coerente: in repo puo contenere sia la targa sia l'id mezzo legacy."
      : null,
    counts.versoMagazzino > 0
      ? "Nel dataset convivono movimenti verso mezzo, collega e magazzino: il reader mezzo-centrico espone solo i record collegabili davvero alla targa."
      : null,
  ].filter((entry): entry is string => Boolean(entry));
}

function resolveMezzoMatch(args: {
  item: NextMaterialeMovimentoReadOnlyItem;
  mezzoTarga: string;
  mezzoId: string | null;
}): NextMaterialeMovimentoMezzoMatchKind {
  const { item, mezzoTarga, mezzoId } = args;

  const explicitTarga = item.mezzoTarga
    ? normalizeMatchTarga(item.mezzoTarga)
    : null;
  const destinatarioLabelTarga = looksLikeVehicleTarga(
    normalizeMatchTarga(item.destinatario.label)
  )
    ? normalizeMatchTarga(item.destinatario.label)
    : null;
  const destinatarioRefTarga = looksLikeVehicleTarga(
    normalizeMatchTarga(item.destinatario.refId)
  )
    ? normalizeMatchTarga(item.destinatario.refId)
    : null;

  const aliasTargets = [...new Set(
    [explicitTarga, destinatarioLabelTarga, destinatarioRefTarga].filter(
      (entry): entry is string => Boolean(entry)
    )
  )];
  if (aliasTargets.length > 1) {
    return null;
  }

  if (explicitTarga === mezzoTarga) {
    return "direct_targa";
  }

  if (destinatarioLabelTarga === mezzoTarga) {
    return "destinatario_label_targa";
  }

  if (destinatarioRefTarga === mezzoTarga) {
    return "destinatario_ref_targa";
  }

  if (mezzoId && item.destinatario.refId === mezzoId) {
    return "destinatario_ref_id";
  }

  return null;
}

function deriveMezzoMatchReliability(
  mezzoMatchKind: Exclude<NextMaterialeMovimentoMezzoMatchKind, null>
): NextMaterialeMovimentoMezzoMatchReliability {
  return mezzoMatchKind === "destinatario_ref_id" ? "plausibile" : "forte";
}

function normalizeMaterialMatchText(value: unknown): string {
  return normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeDescriptionMatchScore(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 300;
  if (left.includes(right)) return 200;
  if (right.includes(left)) return 100;
  return 0;
}

function resolveMaterialCost(
  item: NextMaterialeMovimentoReadOnlyItem,
  supportDocuments: NextDocumentiMagazzinoSupportDocument[]
): NextMaterialeMovimentoCostSnapshot {
  const target = normalizeMaterialMatchText(item.descrizione ?? item.materiale ?? "");
  if (!target || supportDocuments.length === 0) {
    return {
      costoUnitario: null,
      costoTotale: null,
      costoCurrency: "UNKNOWN",
      costoSourceCollection: null,
      costoSourceDocId: null,
      costoMatchedDescription: null,
      quality: "non_disponibile",
      flags: [],
    };
  }

  let bestCandidate:
    | (NextMaterialeMovimentoCostSnapshot & { score: number; timestamp: number | null })
    | null = null;

  for (const supportDocument of supportDocuments) {
    const documentTimestamp = toTimestamp(supportDocument.data);

    for (const row of supportDocument.voci) {
      const rowDescription = normalizeMaterialMatchText(row.descrizione);
      const score = computeDescriptionMatchScore(target, rowDescription);
      if (score === 0) continue;

      const costoUnitario =
        normalizeNumber(row.prezzoUnitario) ??
        (normalizeNumber(row.importo) !== null &&
        normalizeNumber(row.quantita) !== null &&
        normalizeNumber(row.quantita)! > 0
          ? normalizeNumber(row.importo)! / normalizeNumber(row.quantita)!
          : null);
      if (costoUnitario === null) continue;

      const costoTotale =
        item.quantita !== null ? Number((costoUnitario * item.quantita).toFixed(2)) : null;
      const candidate: NextMaterialeMovimentoCostSnapshot & {
        score: number;
        timestamp: number | null;
      } = {
        costoUnitario,
        costoTotale,
        costoCurrency: "UNKNOWN",
        costoSourceCollection: "@documenti_magazzino",
        costoSourceDocId: supportDocument.sourceDocId,
        costoMatchedDescription: row.descrizione,
        quality: "ricostruito",
        flags: [
          "costo_da_documento_magazzino",
          ...(score < 300 ? ["costo_match_descrizione_morbido"] : []),
        ],
        score,
        timestamp: documentTimestamp,
      };

      if (!bestCandidate) {
        bestCandidate = candidate;
        continue;
      }

      const bestTimestamp = bestCandidate.timestamp ?? 0;
      const candidateTimestamp = candidate.timestamp ?? 0;
      if (
        candidate.score > bestCandidate.score ||
        (candidate.score === bestCandidate.score && candidateTimestamp > bestTimestamp)
      ) {
        bestCandidate = candidate;
      }
    }
  }

  if (!bestCandidate) {
    return {
      costoUnitario: null,
      costoTotale: null,
      costoCurrency: "UNKNOWN",
      costoSourceCollection: null,
      costoSourceDocId: null,
      costoMatchedDescription: null,
      quality: "non_disponibile",
      flags: [],
    };
  }

  return {
    costoUnitario: bestCandidate.costoUnitario,
    costoTotale: bestCandidate.costoTotale,
    costoCurrency: bestCandidate.costoCurrency,
    costoSourceCollection: bestCandidate.costoSourceCollection,
    costoSourceDocId: bestCandidate.costoSourceDocId,
    costoMatchedDescription: bestCandidate.costoMatchedDescription,
    quality: bestCandidate.quality,
    flags: [...bestCandidate.flags],
  };
}

function buildPerMezzoLimitations(args: {
  items: NextMezzoMaterialeMovimentoReadOnlyItem[];
  mezzoId: string | null;
  supportDocuments: NextDocumentiMagazzinoSupportDocument[];
}): string[] {
  const { items, mezzoId, supportDocuments } = args;
  const withReliableDate = items.filter((item) => item.timestamp !== null).length;

  return [
    !mezzoId
      ? "Il reader mezzo-centrico non ha un id mezzo canonico in input: i match `destinatario.refId` restano limitati ai casi in cui il ref contiene gia la targa."
      : null,
    items.some((item) => item.mezzoMatchKind === "destinatario_label_targa")
      ? "Una parte dei movimenti mezzo non usa un campo `targa` dedicato ma salva comunque la targa esatta in `destinatario.label`; il layer la tratta come match forte, non come inferenza testuale."
      : null,
    items.some((item) => item.mezzoMatchKind === "destinatario_ref_targa")
      ? "Una parte dei movimenti mezzo salva la targa esatta in `destinatario.refId`; il layer la tratta come match forte finche non emergono alias conflittuali."
      : null,
    items.some((item) => item.mezzoMatchKind === "destinatario_ref_id")
      ? "Una parte dei movimenti mezzo viene collegata solo tramite `destinatario.refId = id mezzo`: questi record restano match plausibili, non certi."
      : null,
    items.length > 0 && withReliableDate === items.length
      ? "Sui movimenti inclusi il filtro periodo e applicabile: tutte le righe matched espongono una data parsabile dal layer read-only."
      : null,
    items.length > 0 && withReliableDate > 0 && withReliableDate < items.length
      ? "Il filtro periodo sui materiali resta solo parziale: non tutte le righe matched espongono una data parsabile."
      : null,
    items.length > 0 && withReliableDate === 0
      ? "Il filtro periodo sui materiali non e dimostrabile: le righe matched non espongono una data parsabile."
      : null,
    supportDocuments.length === 0
      ? "Nessun supporto `@documenti_magazzino` disponibile per ricostruire i costi materiali del mezzo."
      : null,
    items.some((item) => item.costoUnitario !== null)
      ? "I costi materiali restano derivati da match descrittivo sulle righe `voci` di `@documenti_magazzino`; non sono costi inventariali transazionali."
      : null,
  ].filter((entry): entry is string => Boolean(entry));
}

function deriveMatchCoverage(counts: NextMezzoMaterialiMovimentiSnapshot["counts"]): NextMaterialiMovimentiCoverageMatch {
  if (counts.total === 0) return "vuota";
  if (counts.matchedStrong > 0 && counts.matchedPlausible > 0) return "mista";
  if (counts.matchedPlausible > 0) return "plausibile";
  return "forte";
}

function derivePeriodFilterCoverage(
  counts: NextMezzoMaterialiMovimentiSnapshot["counts"]
): NextMaterialiMovimentiPeriodFilterStatus {
  if (counts.total === 0 || counts.withReliableDate === 0) {
    return "non_dimostrabile";
  }

  if (counts.withoutReliableDate > 0) {
    return "parziale";
  }

  return "affidabile";
}

export async function readNextMaterialiMovimentiSnapshot(
  options: NextMaterialiMovimentiReadOptions = {},
): Promise<NextMaterialiMovimentiSnapshot> {
  const includeCloneOverlays = options.includeCloneOverlays ?? true;
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, MATERIALI_MOVIMENTI_DATASET_KEY));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  const { datasetShape, items: rawItems } = unwrapStorageArray(rawDoc);
  const cloneRecords = includeCloneOverlays ? readNextMaterialiMovimentiCloneRecords() : [];
  const deletedIds = new Set(
    includeCloneOverlays ? readNextMaterialiMovimentiCloneDeletedIds() : [],
  );
  const cloneIds = new Set(cloneRecords.map((entry) => entry.id));
  const mergedRawItems = [
    ...rawItems.filter((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return true;
      }
      const itemId = buildItemId(entry as RawRecord, index);
      return !cloneIds.has(itemId) && !deletedIds.has(itemId);
    }),
    ...cloneRecords.filter((entry) => !deletedIds.has(entry.id)),
  ];

  const items = sortItems(
    mergedRawItems
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        return toNextMaterialeMovimentoReadOnlyItem(entry as RawRecord, index);
      })
      .filter((entry): entry is NextMaterialeMovimentoReadOnlyItem => Boolean(entry))
  );

  const counts = {
    total: items.length,
    conDestinatarioOggetto: items.filter((item) => item.destinatario.rawShape === "object").length,
    conDestinatarioStringa: items.filter((item) => item.destinatario.rawShape === "string").length,
    versoMezzo: items.filter((item) => item.tipoDestinatario === "MEZZO").length,
    versoCollega: items.filter((item) => item.tipoDestinatario === "COLLEGA").length,
    versoMagazzino: items.filter((item) => item.tipoDestinatario === "MAGAZZINO").length,
    conTargaEsplicita: items.filter((item) => Boolean(item.mezzoTarga)).length,
    conFornitore: items.filter((item) => Boolean(item.fornitore)).length,
    conData: items.filter((item) => Boolean(item.data)).length,
  };

  return {
    domainCode: NEXT_MATERIALI_MOVIMENTI_DOMAIN.code,
    domainName: NEXT_MATERIALI_MOVIMENTI_DOMAIN.name,
    logicalDatasets: NEXT_MATERIALI_MOVIMENTI_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_MATERIALI_MOVIMENTI_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_MATERIALI_MOVIMENTI_DOMAIN.normalizationStrategy,
    outputContract: NEXT_MATERIALI_MOVIMENTI_DOMAIN.outputContract,
    datasetShape,
    items,
    counts,
    limitations: [
      ...buildGlobalLimitations({ datasetShape, items, counts }),
      includeCloneOverlays
        ? "Il layer materiali puo integrare overlay locali del clone solo su richiesta esplicita del chiamante."
        : "La lettura ufficiale del clone usa solo `@materialiconsegnati` reale senza overlay locali.",
      includeCloneOverlays && cloneRecords.length > 0
        ? `Il clone integra ${cloneRecords.length} movimenti materiali locali senza scrivere su @materialiconsegnati nella madre.`
        : null,
      includeCloneOverlays && deletedIds.size > 0
        ? `Il clone nasconde ${deletedIds.size} movimenti materiali in modo locale senza cancellarli dalla madre.`
        : null,
    ].filter((entry): entry is string => Boolean(entry)),
  };
}

export function buildNextMezzoMaterialiMovimentiSnapshot(args: {
  baseSnapshot: NextMaterialiMovimentiSnapshot;
  targa: string;
  mezzoId?: string | null;
  materialCostSupportDocuments?: NextDocumentiMagazzinoSupportDocument[];
}): NextMezzoMaterialiMovimentiSnapshot {
  const mezzoTarga = normalizeMatchTarga(args.targa);
  const mezzoId = normalizeOptionalText(args.mezzoId) ?? null;
  const supportDocuments = args.materialCostSupportDocuments ?? [];

  const items = sortItems(
    args.baseSnapshot.items
      .map((item) => {
        const mezzoMatchKind = resolveMezzoMatch({ item, mezzoTarga, mezzoId });
        if (!mezzoMatchKind) return null;

        const cost = resolveMaterialCost(item, supportDocuments);
        return {
          ...item,
          mezzoMatchKind,
          mezzoMatchReliability: deriveMezzoMatchReliability(mezzoMatchKind),
          costoUnitario: cost.costoUnitario,
          costoTotale: cost.costoTotale,
          costoCurrency: cost.costoCurrency,
          costoSourceCollection: cost.costoSourceCollection,
          costoSourceDocId: cost.costoSourceDocId,
          costoMatchedDescription: cost.costoMatchedDescription,
          fieldQuality: {
            ...item.fieldQuality,
            costo: cost.quality,
          },
          flags: [...new Set([...item.flags, `match_${mezzoMatchKind}`, ...cost.flags])],
        } satisfies NextMezzoMaterialeMovimentoReadOnlyItem;
      })
      .filter((entry): entry is NextMezzoMaterialeMovimentoReadOnlyItem => Boolean(entry))
  );

  const counts = {
    total: items.length,
    matchedByExplicitTarga: items.filter((item) => item.mezzoMatchKind === "direct_targa").length,
    matchedByDestinatarioLabelTarga: items.filter(
      (item) => item.mezzoMatchKind === "destinatario_label_targa"
    ).length,
    matchedByDestinatarioRefTarga: items.filter(
      (item) => item.mezzoMatchKind === "destinatario_ref_targa"
    ).length,
    matchedByDestinatarioRefId: items.filter(
      (item) => item.mezzoMatchKind === "destinatario_ref_id"
    ).length,
    matchedStrong: items.filter((item) => item.mezzoMatchReliability === "forte").length,
    matchedPlausible: items.filter((item) => item.mezzoMatchReliability === "plausibile").length,
    withCost: items.filter((item) => item.costoTotale !== null).length,
    withoutCost: items.filter((item) => item.costoTotale === null).length,
    withFornitore: items.filter((item) => Boolean(item.fornitore)).length,
    withReliableDate: items.filter((item) => item.timestamp !== null).length,
    withoutReliableDate: items.filter((item) => item.timestamp === null).length,
  };

  return {
    domainCode: NEXT_MATERIALI_MOVIMENTI_DOMAIN.code,
    domainName: NEXT_MATERIALI_MOVIMENTI_DOMAIN.name,
    mezzoTarga,
    mezzoId,
    logicalDatasets: NEXT_MATERIALI_MOVIMENTI_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_MATERIALI_MOVIMENTI_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_MATERIALI_MOVIMENTI_DOMAIN.normalizationStrategy,
    outputContract: NEXT_MATERIALI_MOVIMENTI_DOMAIN.outputContract,
    datasetShape: args.baseSnapshot.datasetShape,
    items,
    counts,
    coverage: {
      match: deriveMatchCoverage(counts),
      periodFilter: derivePeriodFilterCoverage(counts),
    },
    materialCostSupport: {
      documentCount: supportDocuments.length,
      rowCount: supportDocuments.reduce((total, document) => total + document.voci.length, 0),
    },
    limitations: [...args.baseSnapshot.limitations, ...buildPerMezzoLimitations({
      items,
      mezzoId,
      supportDocuments,
    })],
  };
}

export function buildNextMaterialiMovimentiLegacyDossierView(
  snapshot: NextMezzoMaterialiMovimentiSnapshot
): NextMaterialiMovimentiLegacyDossierItem[] {
  return snapshot.items.map((item) => ({
    id: item.id,
    targa: item.targa ?? undefined,
    mezzoTarga: item.mezzoTarga ?? undefined,
    inventarioRefId: item.inventarioRefId ?? undefined,
    stockKey: item.stockKey ?? undefined,
    destinatario:
      item.destinatario.label || item.destinatario.refId || item.destinatario.type
        ? {
            type: item.destinatario.type ?? undefined,
            refId: item.destinatario.refId ?? undefined,
            label: item.destinatario.label ?? undefined,
          }
        : undefined,
    materialeLabel: item.materiale ?? undefined,
    descrizione: item.descrizione ?? undefined,
    fornitore: item.fornitore ?? undefined,
    motivo: item.motivo ?? undefined,
    quantita: item.quantita ?? undefined,
    unita: item.unita ?? undefined,
    direzione: item.direzione ?? undefined,
    data: item.data ?? undefined,
    fornitoreLabel: item.fornitore ?? undefined,
    costoUnitario: item.costoUnitario,
    costoTotale: item.costoTotale,
    costoCurrency: item.costoCurrency,
    flags: item.flags,
  }));
}

export function buildNextMaterialiMovimentiOperativitaPreview(
  snapshot: NextMaterialiMovimentiSnapshot,
  limit = 5
): NextMaterialiMovimentiOperativitaPreviewItem[] {
  return snapshot.items.slice(0, Math.max(0, limit)).map((item) => ({
    id: item.id,
    descrizione: item.descrizione ?? item.materiale ?? "-",
    quantita: item.quantita,
    data: item.data,
  }));
}

export function buildNextMaterialiConsegnatiDestinatariView(
  snapshot: NextMaterialiMovimentiSnapshot
): NextMaterialiConsegnatiDestinatarioView[] {
  const groups = new Map<string, NextMaterialiConsegnatiDestinatarioView>();

  snapshot.items.forEach((item) => {
    const explicitTarga = item.mezzoTarga ? normalizeMatchTarga(item.mezzoTarga) : null;
    const labelTarga = looksLikeVehicleTarga(normalizeMatchTarga(item.destinatario.label))
      ? normalizeMatchTarga(item.destinatario.label)
      : null;
    const refTarga = looksLikeVehicleTarga(normalizeMatchTarga(item.destinatario.refId))
      ? normalizeMatchTarga(item.destinatario.refId)
      : null;
    const canonicalVehicleTarga = explicitTarga ?? labelTarga ?? refTarga;
    const groupId =
      item.tipoDestinatario === "MEZZO" && canonicalVehicleTarga
        ? `mezzo:${canonicalVehicleTarga}`
        : item.tipoDestinatario === "MAGAZZINO"
          ? "magazzino"
          : item.destinatario.refId ??
            item.destinatario.label ??
            item.target ??
            `movimento:${item.id}`;
    const groupLabel =
      item.tipoDestinatario === "MEZZO" && canonicalVehicleTarga
        ? canonicalVehicleTarga
        : item.tipoDestinatario === "MAGAZZINO"
          ? "MAGAZZINO"
          : item.destinatario.label ??
            item.target ??
            item.destinatario.refId ??
            "Destinatario non definito";

    const current =
      groups.get(groupId) ??
      ({
        id: groupId,
        label: groupLabel,
        type: item.tipoDestinatario,
        totalQuantita: 0,
        movementCount: 0,
        items: [],
      } satisfies NextMaterialiConsegnatiDestinatarioView);

    current.items.push(item);
    current.movementCount += 1;
    current.totalQuantita += item.quantita ?? 0;
    groups.set(groupId, current);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      items: [...group.items].sort((left, right) => {
        const byTimestamp = (left.timestamp ?? 0) - (right.timestamp ?? 0);
        if (byTimestamp !== 0) return byTimestamp;
        return left.id.localeCompare(right.id, "it", { sensitivity: "base" });
      }),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "it", { sensitivity: "base" }));
}

function resolveGlobalVehicleLink(
  item: NextMaterialeMovimentoReadOnlyItem
): Omit<NextMagazzinoVehicleLinkSummary, "movementCount" | "latestDate" | "latestTimestamp" | "materiali" | "provenienze"> | null {
  if (item.mezzoTarga) {
    return {
      key: item.mezzoTarga,
      targa: item.mezzoTarga,
      label: item.mezzoTarga,
      reliability: "forte",
    };
  }

  const destinatarioLabelTarga = normalizeMatchTarga(item.destinatario.label);
  if (item.tipoDestinatario === "MEZZO" && looksLikeVehicleTarga(destinatarioLabelTarga)) {
    return {
      key: destinatarioLabelTarga,
      targa: destinatarioLabelTarga,
      label: destinatarioLabelTarga,
      reliability: "forte",
    };
  }

  const destinatarioRefTarga = normalizeMatchTarga(item.destinatario.refId);
  if (item.tipoDestinatario === "MEZZO" && looksLikeVehicleTarga(destinatarioRefTarga)) {
    return {
      key: destinatarioRefTarga,
      targa: destinatarioRefTarga,
      label: destinatarioRefTarga,
      reliability: "forte",
    };
  }

  if (item.tipoDestinatario === "MEZZO") {
    const label =
      item.destinatario.label ??
      item.target ??
      item.destinatario.refId ??
      item.materiale ??
      item.descrizione ??
      item.id;
    return {
      key: `plausibile:${label.toUpperCase()}`,
      targa: null,
      label,
      reliability: "plausibile",
    };
  }

  return null;
}

function buildVehicleLinksView(
  snapshot: NextMaterialiMovimentiSnapshot
): NextMagazzinoVehicleLinkSummary[] {
  const groups = new Map<string, NextMagazzinoVehicleLinkSummary>();

  snapshot.items.forEach((item) => {
    const link = resolveGlobalVehicleLink(item);
    if (!link) {
      return;
    }

    const current =
      groups.get(link.key) ??
      ({
        ...link,
        movementCount: 0,
        latestDate: null,
        latestTimestamp: null,
        materiali: [],
        provenienze: [],
      } satisfies NextMagazzinoVehicleLinkSummary);

    current.movementCount += 1;
    current.materiali = Array.from(
      new Set([
        ...current.materiali,
        item.materiale ?? item.descrizione ?? item.id,
      ]),
    );
    current.provenienze = Array.from(
      new Set([
        ...current.provenienze,
        item.destinatario.rawShape === "object"
          ? "destinatario strutturato"
          : item.destinatario.rawShape === "string"
            ? "destinatario testuale"
            : "record base",
      ]),
    );

    if ((item.timestamp ?? 0) >= (current.latestTimestamp ?? 0)) {
      current.latestTimestamp = item.timestamp;
      current.latestDate = item.data;
    }

    groups.set(link.key, current);
  });

  return Array.from(groups.values()).sort((left, right) => {
    if (left.reliability !== right.reliability) {
      return left.reliability === "forte" ? -1 : 1;
    }

    const byMovements = right.movementCount - left.movementCount;
    if (byMovements !== 0) {
      return byMovements;
    }

    return left.label.localeCompare(right.label, "it", { sensitivity: "base" });
  });
}

function buildMagazzinoAttentionSignals(args: {
  inventory: NextInventarioSnapshot;
  vehicleLinks: NextMagazzinoVehicleLinkSummary[];
  attrezzature: NextAttrezzatureCantieriSnapshot;
}): NextMagazzinoAttentionSignal[] {
  const inventorySignals = args.inventory.items
    .filter((item) => item.stockStatus === "critico")
    .slice(0, 6)
    .map((item) => ({
      id: `stock:${item.id}`,
      kind: "stock_critico",
      severity: "alta",
      title: `Stock critico: ${item.descrizione}`,
      summary: item.quantita !== null
        ? `Quantita attuale ${item.quantita}${item.unita ?? ""}; conviene verificare se il lavoro dipende da questo articolo.`
        : "Quantita non leggibile in modo affidabile, ma il record risulta in area critica.",
      sourceArea: "inventario",
      reliability: item.quantita !== null ? "alta" : "media",
    } satisfies NextMagazzinoAttentionSignal));

  const plausibleVehicleLinks = args.vehicleLinks.filter((entry) => entry.reliability === "plausibile");
  const linkSignal =
    plausibleVehicleLinks.length > 0
      ? ({
          id: "materiali:collegamenti-prudenti",
          kind: "collegamento_mezzo_prudente",
          severity: "media",
          title: "Collegamenti materiali verso mezzo da confermare",
          summary: `${plausibleVehicleLinks.length} destinatari mezzo usano un aggancio solo prudente: il dominio resta utile, ma questi legami non vanno presentati come certi.`,
          sourceArea: "materiali",
          reliability: "media",
        } satisfies NextMagazzinoAttentionSignal)
      : null;

  const trackingGapCount = args.attrezzature.counts.withTrackingGap;
  const trackingSignal =
    trackingGapCount > 0
      ? ({
          id: "attrezzature:tracking-parziale",
          kind: "tracciamento_attrezzature_parziale",
          severity: "media",
          title: "Tracciamento attrezzature parziale",
          summary: `${trackingGapCount} movimenti attrezzature non espongono tutti i dati minimi di tracking: serve prudenza se li usi per blocchi operativi o assegnazioni.`,
          sourceArea: "attrezzature",
          reliability: "media",
        } satisfies NextMagazzinoAttentionSignal)
      : null;

  return [...inventorySignals, ...(linkSignal ? [linkSignal] : []), ...(trackingSignal ? [trackingSignal] : [])];
}

function buildMagazzinoLimitations(args: {
  inventory: NextInventarioSnapshot;
  materials: NextMaterialiMovimentiSnapshot;
  attrezzature: NextAttrezzatureCantieriSnapshot;
  adBlue: NextMagazzinoAdBlueSnapshot;
  vehicleLinks: NextMagazzinoVehicleLinkSummary[];
}): string[] {
  const nestedLimitations = [
    ...args.inventory.limitations.slice(0, 2),
    ...args.materials.limitations.slice(0, 2),
    ...args.attrezzature.limitations.slice(0, 2),
    ...args.adBlue.limitations.slice(0, 2),
  ].filter(
    (entry) =>
      !/scorta minima canonica/i.test(entry) && !/reader clone e solo read-only/i.test(entry),
  );

  return dedupeStrings([
    "L'area magazzino nel clone NEXT non scrive mai la madre: le uniche variazioni ammesse restano overlay locali del clone su stock, consegne e foto.",
    "Nel clone non esiste ancora una scorta minima canonica: gli stock bassi affidabili coincidono solo con quantita zero o negativa.",
    "Il legame tra inventario, consegne materiali, manutenzioni e ordini non e transazionale: la IA puo leggere segnali utili, ma non una catena causale completa.",
    args.vehicleLinks.some((entry) => entry.reliability === "plausibile")
      ? "Una parte dei materiali verso mezzo resta collegata in modo prudente tramite destinatario, non con un legame targa pienamente canonico."
      : null,
    args.adBlue.counts.total > 0 && args.adBlue.counts.withReliableQuantity < args.adBlue.counts.total
      ? "Una parte degli eventi `@cisterne_adblue` non espone litri affidabili: i totali AdBlue restano parziali e vanno marcati `DA VERIFICARE`."
      : null,
    ...nestedLimitations,
  ]);
}

export async function readNextMagazzinoAdBlueSnapshot(): Promise<NextMagazzinoAdBlueSnapshot> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, CISTERNE_ADBLUE_DATASET_KEY));
  const rawDoc = snapshot.exists() ? ((snapshot.data() as Record<string, unknown>) ?? null) : null;
  const { datasetShape, items: rawItems } = unwrapStorageArray(rawDoc);
  const items = sortItems(
    rawItems
      .map((entry, index) => normalizeAdBlueEvent(entry, index))
      .filter((entry): entry is NextMagazzinoAdBlueReadOnlyEvent => Boolean(entry)),
  );
  const totalLitriRegistrati = items.reduce(
    (total, item) => total + (item.quantitaLitri ?? 0),
    0,
  );

  return {
    domainCode: "D05-ADBLUE",
    domainName: "AdBlue magazzino clone-safe",
    logicalDatasets: [CISTERNE_ADBLUE_DATASET_KEY],
    activeReadOnlyDataset: CISTERNE_ADBLUE_DATASET_KEY,
    datasetShape,
    items,
    counts: {
      total: items.length,
      withReliableDate: items.filter((item) => Boolean(item.data)).length,
      withReliableQuantity: items.filter((item) => item.quantitaLitri !== null).length,
      withInventoryLink: items.filter(
        (item) => Boolean(item.inventarioRefId) || Boolean(item.stockKey),
      ).length,
      totalLitriRegistrati,
    },
    limitations: dedupeStrings([
      datasetShape === "unsupported"
        ? "Il dataset `@cisterne_adblue` non espone una shape supportata fuori dai formati `array/value/items`."
        : null,
      items.length === 0
        ? "Il dataset `@cisterne_adblue` non restituisce oggi eventi leggibili nel clone NEXT."
        : null,
      items.some((item) => item.flags.includes("quantita_litri_non_valida"))
        ? "Una parte degli eventi AdBlue non espone litri leggibili e resta `DA VERIFICARE`."
        : null,
      items.some((item) => item.flags.includes("inventario_ref_assente"))
        ? "Una parte dello storico AdBlue non espone il legame esplicito con l'articolo inventario."
        : null,
      "Gli eventi AdBlue rappresentano cambi cisterna letti in sola lettura: per la IA valgono come supporto a consumi e scarichi inventario, non come writer business.",
    ]),
  };
}

export async function readNextMagazzinoRealeSnapshot(): Promise<NextMagazzinoRealeSnapshot> {
  const [inventory, materials, attrezzature, adBlue] = await Promise.all([
    readNextInventarioSnapshot(),
    readNextMaterialiMovimentiSnapshot(),
    readNextAttrezzatureCantieriSnapshot(),
    readNextMagazzinoAdBlueSnapshot(),
  ]);
  const vehicleLinks = buildVehicleLinksView(materials);
  const attentionSignals = buildMagazzinoAttentionSignals({
    inventory,
    vehicleLinks,
    attrezzature,
  });

  return {
    domainCode: "D05",
    domainName: "Magazzino reale del clone NEXT",
    normalizationStrategy:
      "SNAPSHOT D05 READ-ONLY CHE UNISCE inventario, movimenti materiali e attrezzature sopra i reader NEXT dedicati",
    inventory,
    materials,
    attrezzature,
    adBlue,
    vehicleLinks,
    attentionSignals,
    counts: {
      inventoryItems: inventory.counts.total,
      inventoryCritical: inventory.counts.critical,
      materialMovements: materials.counts.total,
      vehicleLinksStrong: vehicleLinks.filter((entry) => entry.reliability === "forte").length,
      vehicleLinksPlausible: vehicleLinks.filter((entry) => entry.reliability === "plausibile").length,
      attrezzatureMovements: attrezzature.counts.totalMovements,
      attrezzatureTrackingGap: attrezzature.counts.withTrackingGap,
      adBlueEvents: adBlue.counts.total,
      adBlueLitriRegistrati: adBlue.counts.totalLitriRegistrati,
      attentionSignals: attentionSignals.length,
    },
    operationalStatus: {
      mode: "read_only",
      writesEnabled: false,
      label: "Solo lettura",
      summary:
        "D05 e leggibile nel clone NEXT e nella IA interna; gli unici aggiornamenti ammessi restano overlay locali del clone e non toccano la madre.",
    },
    limitations: buildMagazzinoLimitations({
      inventory,
      materials,
      attrezzature,
      adBlue,
      vehicleLinks,
    }),
  };
}
