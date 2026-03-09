import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { normalizeNextMezzoTarga } from "./nextAnagraficheFlottaDomain";

const STORAGE_COLLECTION = "storage";
const RIFORNIMENTI_DATASET_KEY = "@rifornimenti";

type NextRifornimentoRaw = Record<string, unknown>;
type NextCanonicalDatasetShape = "items" | "missing" | "unsupported";

// D04 in NEXT legge solo la proiezione canonica ridotta `@rifornimenti.items`.
// Nessuna UI NEXT puo leggere `tmp` o shape legacy alternative fuori da questo layer.
export const NEXT_RIFORNIMENTI_CONSUMI_DOMAIN = {
  code: "D04",
  name: "Rifornimenti e consumi",
  logicalDatasets: [RIFORNIMENTI_DATASET_KEY] as const,
  activeReadOnlyDataset: RIFORNIMENTI_DATASET_KEY,
  normalizationStrategy: "CANONICO RIDOTTO",
  nextReadOnlyFields: {
    guaranteed: [
      "id",
      "mezzoTarga",
      "data",
      "litri",
      "distributore",
      "note",
    ] as const,
    optional: ["km", "costo"] as const,
    excluded: [
      "timestamp",
      "autistaNome",
      "badgeAutista",
      "source",
      "validation",
    ] as const,
  },
} as const;

export type NextRifornimentoGuaranteedField =
  (typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.nextReadOnlyFields.guaranteed)[number];

export type NextRifornimentoOptionalField =
  (typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.nextReadOnlyFields.optional)[number];

export type NextRifornimentoExcludedField =
  (typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.nextReadOnlyFields.excluded)[number];

export type NextRifornimentoReadOnlyItem = {
  id: string;
  mezzoTarga: string;
  data: string | null;
  litri: number | null;
  km: number | null;
  costo: number | null;
  distributore: string | null;
  note: string | null;
  fieldQuality: {
    data: "display-only";
    km: "optional";
    costo: "optional";
  };
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof RIFORNIMENTI_DATASET_KEY;
};

export type NextMezzoRifornimentiSnapshot = {
  domainCode: typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.code;
  domainName: typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.name;
  mezzoTarga: string;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.normalizationStrategy;
  datasetShape: NextCanonicalDatasetShape;
  fields: {
    guaranteed: readonly NextRifornimentoGuaranteedField[];
    optional: readonly NextRifornimentoOptionalField[];
    excluded: readonly NextRifornimentoExcludedField[];
  };
  items: NextRifornimentoReadOnlyItem[];
  counts: {
    total: number;
    withKm: number;
    withCosto: number;
  };
  totals: {
    litri: number;
  };
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
    const normalized = value.replace(",", ".").trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function parseDateLabelToTimestamp(value: string | null): number {
  if (!value) return 0;

  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return direct;

  const match = value
    .trim()
    .match(
      /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );

  if (!match) return 0;

  const [, dayRaw, monthRaw, yearRaw, hoursRaw, minutesRaw, secondsRaw] = match;
  const year =
    yearRaw.length === 2 ? `20${yearRaw}` : yearRaw.padStart(4, "0");
  const hours = hoursRaw ?? "00";
  const minutes = minutesRaw ?? "00";
  const seconds = secondsRaw ?? "00";
  const isoLike = `${year}-${monthRaw.padStart(2, "0")}-${dayRaw.padStart(
    2,
    "0"
  )}T${hours.padStart(2, "0")}:${minutes}:${seconds}`;
  const parsed = Date.parse(isoLike);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildRifornimentoId(raw: NextRifornimentoRaw, index: number): string {
  const id = normalizeText(raw.id);
  if (id) return id;

  const mezzoTarga = normalizeNextMezzoTarga(raw.mezzoTarga);
  if (mezzoTarga) return `rifornimento:${mezzoTarga}:${index}`;

  return `rifornimento:${index}`;
}

function toNextRifornimentoReadOnlyItem(
  raw: NextRifornimentoRaw,
  index: number
): NextRifornimentoReadOnlyItem | null {
  const mezzoTarga = normalizeNextMezzoTarga(raw.mezzoTarga);
  if (!mezzoTarga) return null;

  return {
    id: buildRifornimentoId(raw, index),
    mezzoTarga,
    data: normalizeOptionalText(raw.data),
    litri: normalizeNumber(raw.litri),
    km: normalizeNumber(raw.km),
    costo: normalizeNumber(raw.costo),
    distributore: normalizeOptionalText(raw.distributore),
    note: normalizeOptionalText(raw.note),
    fieldQuality: {
      data: "display-only",
      km: "optional",
      costo: "optional",
    },
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: RIFORNIMENTI_DATASET_KEY,
  };
}

async function readCanonicalRifornimentiDataset(): Promise<{
  datasetShape: NextCanonicalDatasetShape;
  items: unknown[];
}> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, RIFORNIMENTI_DATASET_KEY));
  if (!snapshot.exists()) {
    return {
      datasetShape: "missing",
      items: [],
    };
  }

  const rawDoc = snapshot.data() as Record<string, unknown>;
  if (Array.isArray(rawDoc.items)) {
    return {
      datasetShape: "items",
      items: rawDoc.items,
    };
  }

  return {
    datasetShape: "unsupported",
    items: [],
  };
}

function sortRifornimenti(items: NextRifornimentoReadOnlyItem[]): NextRifornimentoReadOnlyItem[] {
  return [...items].sort((left, right) => {
    const dateOrder = parseDateLabelToTimestamp(right.data) - parseDateLabelToTimestamp(left.data);
    if (dateOrder !== 0) return dateOrder;
    return right.id.localeCompare(left.id, "it", { sensitivity: "base" });
  });
}

export async function readNextMezzoRifornimentiSnapshot(
  targa: string
): Promise<NextMezzoRifornimentiSnapshot> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  const { datasetShape, items: rawItems } = await readCanonicalRifornimentiDataset();

  const items = sortRifornimenti(
    rawItems
      .map((entry, index) => {
        if (!entry || typeof entry !== "object") return null;
        return toNextRifornimentoReadOnlyItem(entry as NextRifornimentoRaw, index);
      })
      .filter((entry): entry is NextRifornimentoReadOnlyItem => Boolean(entry))
      .filter((entry) => entry.mezzoTarga === mezzoTarga)
  );

  return {
    domainCode: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.code,
    domainName: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.name,
    mezzoTarga,
    logicalDatasets: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.normalizationStrategy,
    datasetShape,
    fields: NEXT_RIFORNIMENTI_CONSUMI_DOMAIN.nextReadOnlyFields,
    items,
    counts: {
      total: items.length,
      withKm: items.filter((entry) => entry.km !== null).length,
      withCosto: items.filter((entry) => entry.costo !== null).length,
    },
    totals: {
      litri: items.reduce((sum, entry) => sum + (entry.litri ?? 0), 0),
    },
  };
}
