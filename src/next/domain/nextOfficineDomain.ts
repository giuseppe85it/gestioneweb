import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  readNextDeletedOfficinaIds,
  readNextOfficineCloneRecords,
} from "../nextAnagraficheCloneState";

const STORAGE_COLLECTION = "storage";
const OFFICINE_KEY = "@officine";

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export const NEXT_OFFICINE_DOMAIN = {
  code: "D13-OFFICINE",
  name: "Anagrafica officine clone-safe",
  logicalDatasets: [OFFICINE_KEY] as const,
  activeReadOnlyDataset: OFFICINE_KEY,
  normalizationStrategy: "LAYER NEXT OFFICINE SU storage/@officine",
} as const;

export type NextOfficinaReadOnlyItem = {
  id: string;
  nome: string;
  telefono: string | null;
  telefoniAggiuntivi: string[];
  citta: string | null;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof OFFICINE_KEY;
  quality: "certo" | "parziale" | "da_verificare";
  flags: string[];
};

export type NextOfficineSnapshot = {
  domainCode: typeof NEXT_OFFICINE_DOMAIN.code;
  domainName: typeof NEXT_OFFICINE_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_OFFICINE_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_OFFICINE_DOMAIN.normalizationStrategy;
  datasetShape: NextLegacyDatasetShape;
  items: NextOfficinaReadOnlyItem[];
  counts: {
    total: number;
    withTelefono: number;
    withCitta: number;
    withTelefoniAggiuntivi: number;
  };
  limitations: string[];
};

export type NextOfficineReadOptions = {
  includeCloneOverlays?: boolean;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => normalizeText(entry))
    .filter((entry) => entry.length > 0);
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

function buildOfficinaId(raw: RawRecord, index: number): string {
  return (
    normalizeOptionalText(raw.id) ??
    normalizeOptionalText(raw.nome) ??
    `officina:${index}`
  );
}

function toOfficinaItem(raw: RawRecord, index: number): NextOfficinaReadOnlyItem | null {
  const nome =
    normalizeOptionalText(raw.nome) ??
    normalizeOptionalText(raw.ragioneSociale) ??
    normalizeOptionalText(raw.officina) ??
    normalizeOptionalText(raw.label);

  if (!nome) return null;

  const telefono = normalizeOptionalText(raw.telefono);
  const telefoniAggiuntivi = normalizeStringArray(raw.telefoniAggiuntivi);
  const citta = normalizeOptionalText(raw.citta);
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (!telefono) flags.push("telefono_assente");
  if (!citta) flags.push("citta_assente");
  if (telefoniAggiuntivi.length === 0) flags.push("telefoni_aggiuntivi_assenti");

  return {
    id: buildOfficinaId(raw, index),
    nome,
    telefono,
    telefoniAggiuntivi,
    citta,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: OFFICINE_KEY,
    quality:
      telefono || citta || telefoniAggiuntivi.length > 0
        ? "certo"
        : "da_verificare",
    flags,
  };
}

function sortItems(items: NextOfficinaReadOnlyItem[]): NextOfficinaReadOnlyItem[] {
  return [...items].sort((left, right) =>
    left.nome.localeCompare(right.nome, "it", { sensitivity: "base" }),
  );
}

function mapCloneOfficinaItem(raw: {
  id: string;
  nome: string;
  telefono: string | null;
  telefoniAggiuntivi: string[];
  citta: string | null;
}): NextOfficinaReadOnlyItem {
  return {
    id: raw.id,
    nome: raw.nome,
    telefono: raw.telefono,
    telefoniAggiuntivi: raw.telefoniAggiuntivi,
    citta: raw.citta,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: OFFICINE_KEY,
    quality: "certo",
    flags: ["clone_only"],
  };
}

function buildLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  items: NextOfficinaReadOnlyItem[];
  skippedRawRecords: number;
  includeCloneOverlays: boolean;
}): string[] {
  const { datasetShape, items, skippedRawRecords, includeCloneOverlays } = args;

  return [
    datasetShape === "missing"
      ? "Il dataset `@officine` non esiste ancora: la lista officine NEXT parte vuota."
      : null,
    datasetShape === "unsupported"
      ? "Il dataset `@officine` non espone una shape supportata fuori dai formati `array/value/items`."
      : null,
    skippedRawRecords > 0
      ? "Una parte dei record `@officine` e stata esclusa dal clone perche priva del nome minimo leggibile."
      : null,
    items.some((item) => item.flags.includes("telefono_assente"))
      ? "Il telefono non e valorizzato su tutte le officine."
      : null,
    includeCloneOverlays
      ? "Il layer officine puo integrare overlay locali del clone solo su richiesta esplicita del chiamante."
      : "La lettura ufficiale del clone usa solo `@officine` reale senza overlay locali.",
  ].filter((entry): entry is string => Boolean(entry));
}

export async function readNextOfficineSnapshot(
  options: NextOfficineReadOptions = {},
): Promise<NextOfficineSnapshot> {
  const includeCloneOverlays = options.includeCloneOverlays ?? true;
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, OFFICINE_KEY));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  const { datasetShape, items: rawItems } = unwrapStorageArray(rawDoc);
  const deletedIds = new Set(
    includeCloneOverlays ? readNextDeletedOfficinaIds() : [],
  );
  const cloneItems = includeCloneOverlays
    ? readNextOfficineCloneRecords().map(mapCloneOfficinaItem)
    : [];

  const mappedItems = rawItems.map((entry, index) => {
    if (!entry || typeof entry !== "object") return null;
    return toOfficinaItem(entry as RawRecord, index);
  });

  const baseItems = mappedItems.filter((entry): entry is NextOfficinaReadOnlyItem =>
    Boolean(entry),
  );
  const items = sortItems(
    [...baseItems.filter((entry) => !deletedIds.has(entry.id)), ...cloneItems].reduce<
      NextOfficinaReadOnlyItem[]
    >((accumulator, entry) => {
      const next = accumulator.filter((item) => item.id !== entry.id);
      next.push(entry);
      return next;
    }, []),
  );
  const skippedRawRecords = rawItems.length - baseItems.length;

  return {
    domainCode: NEXT_OFFICINE_DOMAIN.code,
    domainName: NEXT_OFFICINE_DOMAIN.name,
    logicalDatasets: NEXT_OFFICINE_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_OFFICINE_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_OFFICINE_DOMAIN.normalizationStrategy,
    datasetShape,
    items,
    counts: {
      total: items.length,
      withTelefono: items.filter((item) => Boolean(item.telefono)).length,
      withCitta: items.filter((item) => Boolean(item.citta)).length,
      withTelefoniAggiuntivi: items.filter((item) => item.telefoniAggiuntivi.length > 0)
        .length,
    },
    limitations: buildLimitations({
      datasetShape,
      items,
      skippedRawRecords,
      includeCloneOverlays,
    }),
  };
}
