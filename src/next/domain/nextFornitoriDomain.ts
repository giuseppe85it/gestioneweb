import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  readNextDeletedFornitoreIds,
  readNextFornitoriCloneRecords,
} from "../nextAnagraficheCloneState";

const STORAGE_COLLECTION = "storage";
const FORNITORI_KEY = "@fornitori";

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export const NEXT_FORNITORI_DOMAIN = {
  code: "D05-FORNITORI",
  name: "Anagrafica fornitori clone-safe",
  logicalDatasets: [FORNITORI_KEY] as const,
  activeReadOnlyDataset: FORNITORI_KEY,
  normalizationStrategy: "LAYER NEXT READ-ONLY FORNITORI SU storage/@fornitori",
} as const;

export type NextFornitoreReadOnlyItem = {
  id: string;
  nome: string;
  telefono: string | null;
  badge: string | null;
  codice: string | null;
  descrizione: string | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof FORNITORI_KEY;
  quality: "certo" | "parziale" | "da_verificare";
  flags: string[];
};

export type NextFornitoriSnapshot = {
  domainCode: typeof NEXT_FORNITORI_DOMAIN.code;
  domainName: typeof NEXT_FORNITORI_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_FORNITORI_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_FORNITORI_DOMAIN.normalizationStrategy;
  datasetShape: NextLegacyDatasetShape;
  items: NextFornitoreReadOnlyItem[];
  counts: {
    total: number;
    withTelefono: number;
    withBadge: number;
    withCodice: number;
  };
  limitations: string[];
};

export type NextFornitoriReadOptions = {
  includeCloneOverlays?: boolean;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
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

function buildFornitoreId(raw: RawRecord, index: number): string {
  return (
    normalizeOptionalText(raw.id) ??
    normalizeOptionalText(raw.codice) ??
    `fornitore:${index}`
  );
}

function toFornitoreItem(raw: RawRecord, index: number): NextFornitoreReadOnlyItem | null {
  const nome =
    normalizeOptionalText(raw.nome) ??
    normalizeOptionalText(raw.ragioneSociale) ??
    normalizeOptionalText(raw.fornitore) ??
    normalizeOptionalText(raw.label);
  if (!nome) return null;

  const telefono = normalizeOptionalText(raw.telefono);
  const badge = normalizeOptionalText(raw.badge);
  const codice = normalizeOptionalText(raw.codice);
  const descrizione = normalizeOptionalText(raw.descrizione);
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (!telefono) flags.push("telefono_assente");
  if (!codice) flags.push("codice_assente");

  return {
    id: buildFornitoreId(raw, index),
    nome,
    telefono,
    badge,
    codice,
    descrizione,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: FORNITORI_KEY,
    quality:
      telefono || badge || codice
        ? "certo"
        : descrizione
        ? "parziale"
        : "da_verificare",
    flags,
  };
}

function sortItems(items: NextFornitoreReadOnlyItem[]): NextFornitoreReadOnlyItem[] {
  return [...items].sort((left, right) =>
    left.nome.localeCompare(right.nome, "it", { sensitivity: "base" })
  );
}

function mapCloneFornitoreItem(raw: {
  id: string;
  nome: string;
  telefono: string | null;
  badge: string | null;
  codice: string | null;
  descrizione: string | null;
}): NextFornitoreReadOnlyItem {
  return {
    id: raw.id,
    nome: raw.nome,
    telefono: raw.telefono,
    badge: raw.badge,
    codice: raw.codice,
    descrizione: raw.descrizione,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: FORNITORI_KEY,
    quality: "certo",
    flags: ["clone_only"],
  };
}

function buildLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  items: NextFornitoreReadOnlyItem[];
  skippedRawRecords: number;
  includeCloneOverlays: boolean;
}): string[] {
  const { datasetShape, items, skippedRawRecords, includeCloneOverlays } = args;

  return [
    includeCloneOverlays
      ? "Il layer fornitori puo integrare overlay locali del clone solo su richiesta esplicita del chiamante."
      : "La lettura ufficiale del clone usa solo `@fornitori` reale senza overlay locali.",
    datasetShape === "unsupported"
      ? "Il dataset `@fornitori` non espone una shape supportata fuori dai formati `array/value/items`."
      : null,
    skippedRawRecords > 0
      ? "Una parte dei record `@fornitori` e stata esclusa dal clone perche priva del nome minimo leggibile."
      : null,
    items.some((item) => item.flags.includes("telefono_assente"))
      ? "Il telefono non e valorizzato su tutti i fornitori."
      : null,
    items.some((item) => item.flags.includes("codice_assente"))
      ? "Il codice non e valorizzato su tutti i fornitori."
      : null,
    includeCloneOverlays
      ? "Il clone mantiene aggiunta, modifica ed eliminazione solo nel layer locale NEXT; la madre resta intatta."
      : null,
  ].filter((entry): entry is string => Boolean(entry));
}

export async function readNextFornitoriSnapshot(
  options: NextFornitoriReadOptions = {},
): Promise<NextFornitoriSnapshot> {
  const includeCloneOverlays = options.includeCloneOverlays ?? true;
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, FORNITORI_KEY));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  const { datasetShape, items: rawItems } = unwrapStorageArray(rawDoc);
  const deletedIds = new Set(
    includeCloneOverlays ? readNextDeletedFornitoreIds() : [],
  );
  const cloneItems = includeCloneOverlays
    ? readNextFornitoriCloneRecords().map(mapCloneFornitoreItem)
    : [];

  const mappedItems = rawItems.map((entry, index) => {
    if (!entry || typeof entry !== "object") return null;
    return toFornitoreItem(entry as RawRecord, index);
  });

  const baseItems = mappedItems.filter((entry): entry is NextFornitoreReadOnlyItem => Boolean(entry));
  const items = sortItems(
    [...baseItems.filter((entry) => !deletedIds.has(entry.id)), ...cloneItems].reduce<
      NextFornitoreReadOnlyItem[]
    >((accumulator, entry) => {
      const next = accumulator.filter((item) => item.id !== entry.id);
      next.push(entry);
      return next;
    }, [])
  );
  const skippedRawRecords = rawItems.length - baseItems.length;

  return {
    domainCode: NEXT_FORNITORI_DOMAIN.code,
    domainName: NEXT_FORNITORI_DOMAIN.name,
    logicalDatasets: NEXT_FORNITORI_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_FORNITORI_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_FORNITORI_DOMAIN.normalizationStrategy,
    datasetShape,
    items,
    counts: {
      total: items.length,
      withTelefono: items.filter((item) => Boolean(item.telefono)).length,
      withBadge: items.filter((item) => Boolean(item.badge)).length,
      withCodice: items.filter((item) => Boolean(item.codice)).length,
    },
    limitations: buildLimitations({
      datasetShape,
      items,
      skippedRawRecords,
      includeCloneOverlays,
    }),
  };
}
