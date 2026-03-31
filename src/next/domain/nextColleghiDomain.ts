import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  readNextColleghiCloneRecords,
  readNextDeletedCollegaIds,
} from "../nextAnagraficheCloneState";

const STORAGE_COLLECTION = "storage";
const COLLEGHI_KEY = "@colleghi";

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export const NEXT_COLLEGHI_DOMAIN = {
  code: "D01-COLLEGHI",
  name: "Anagrafica colleghi clone-safe",
  logicalDatasets: [COLLEGHI_KEY] as const,
  activeReadOnlyDataset: COLLEGHI_KEY,
  normalizationStrategy: "LAYER NEXT READ-ONLY COLLEGHI SU storage/@colleghi",
} as const;

export type NextCollegaFuelCard = {
  id: string;
  nomeCarta: string | null;
  pinCarta: string | null;
  flags: string[];
};

export type NextCollegaReadOnlyItem = {
  id: string;
  nome: string;
  telefono: string | null;
  telefonoPrivato: string | null;
  badge: string | null;
  codice: string | null;
  descrizione: string | null;
  pinSim: string | null;
  pukSim: string | null;
  schedeCarburante: NextCollegaFuelCard[];
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof COLLEGHI_KEY;
  quality: "certo" | "parziale" | "da_verificare";
  flags: string[];
};

export type NextColleghiSnapshot = {
  domainCode: typeof NEXT_COLLEGHI_DOMAIN.code;
  domainName: typeof NEXT_COLLEGHI_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_COLLEGHI_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_COLLEGHI_DOMAIN.normalizationStrategy;
  datasetShape: NextLegacyDatasetShape;
  items: NextCollegaReadOnlyItem[];
  counts: {
    total: number;
    withBadge: number;
    withTelefono: number;
    withTelefonoPrivato: number;
    withFuelCards: number;
  };
  limitations: string[];
};

export type ReadNextColleghiSnapshotOptions = {
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

function buildCollegaId(raw: RawRecord, index: number): string {
  return (
    normalizeOptionalText(raw.id) ??
    normalizeOptionalText(raw.badge) ??
    `collega:${index}`
  );
}

function normalizeFuelCards(raw: RawRecord): NextCollegaFuelCard[] {
  const value = raw.schedeCarburante;
  if (!Array.isArray(value)) return [];

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const fuelRaw = entry as RawRecord;
      const nomeCarta =
        normalizeOptionalText(fuelRaw.nomeCarta) ??
        normalizeOptionalText(fuelRaw.nome) ??
        normalizeOptionalText(fuelRaw.label);
      const pinCarta = normalizeOptionalText(fuelRaw.pinCarta) ?? normalizeOptionalText(fuelRaw.pin);
      const flags: string[] = [];
      if (!normalizeOptionalText(fuelRaw.id)) flags.push("id_scheda_ricostruito");
      if (!nomeCarta) flags.push("nome_carta_assente");
      if (!pinCarta) flags.push("pin_carta_assente");

      if (!nomeCarta && !pinCarta) return null;

      return {
        id: normalizeOptionalText(fuelRaw.id) ?? `scheda:${index}`,
        nomeCarta,
        pinCarta,
        flags,
      };
    })
    .filter((entry): entry is NextCollegaFuelCard => Boolean(entry));
}

function toCollegaItem(raw: RawRecord, index: number): NextCollegaReadOnlyItem | null {
  const nome =
    normalizeOptionalText(raw.nome) ??
    normalizeOptionalText(raw.nomeCompleto) ??
    normalizeOptionalText(raw.label);

  if (!nome) return null;

  const telefono = normalizeOptionalText(raw.telefono);
  const telefonoPrivato = normalizeOptionalText(raw.telefonoPrivato);
  const badge = normalizeOptionalText(raw.badge);
  const codice = normalizeOptionalText(raw.codice);
  const descrizione = normalizeOptionalText(raw.descrizione);
  const pinSim = normalizeOptionalText(raw.pinSim);
  const pukSim = normalizeOptionalText(raw.pukSim);
  const schedeCarburante = normalizeFuelCards(raw);
  const flags: string[] = [];

  if (!normalizeOptionalText(raw.id)) flags.push("id_ricostruito");
  if (!badge) flags.push("badge_assente");
  if (!telefono) flags.push("telefono_assente");
  if (!telefonoPrivato) flags.push("telefono_privato_assente");
  if (schedeCarburante.length === 0) flags.push("schede_carburante_assenti");

  return {
    id: buildCollegaId(raw, index),
    nome,
    telefono,
    telefonoPrivato,
    badge,
    codice,
    descrizione,
    pinSim,
    pukSim,
    schedeCarburante,
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: COLLEGHI_KEY,
    quality:
      badge || telefono || telefonoPrivato || schedeCarburante.length > 0
        ? "certo"
        : codice || descrizione || pinSim || pukSim
        ? "parziale"
        : "da_verificare",
    flags,
  };
}

function sortItems(items: NextCollegaReadOnlyItem[]): NextCollegaReadOnlyItem[] {
  return [...items].sort((left, right) =>
    left.nome.localeCompare(right.nome, "it", { sensitivity: "base" })
  );
}

function mapCloneCollegaItem(raw: {
  id: string;
  nome: string;
  telefono: string | null;
  telefonoPrivato: string | null;
  badge: string | null;
  codice: string | null;
  descrizione: string | null;
  pinSim: string | null;
  pukSim: string | null;
  schedeCarburante: { id: string; nomeCarta: string; pinCarta: string }[];
}): NextCollegaReadOnlyItem {
  return {
    id: raw.id,
    nome: raw.nome,
    telefono: raw.telefono,
    telefonoPrivato: raw.telefonoPrivato,
    badge: raw.badge,
    codice: raw.codice,
    descrizione: raw.descrizione,
    pinSim: raw.pinSim,
    pukSim: raw.pukSim,
    schedeCarburante: raw.schedeCarburante.map((entry) => ({
      id: entry.id,
      nomeCarta: entry.nomeCarta || null,
      pinCarta: entry.pinCarta || null,
      flags: ["clone_only"],
    })),
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: COLLEGHI_KEY,
    quality: "certo",
    flags: ["clone_only"],
  };
}

function buildLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  items: NextCollegaReadOnlyItem[];
  skippedRawRecords: number;
  includeCloneOverlays: boolean;
}): string[] {
  const { datasetShape, items, skippedRawRecords, includeCloneOverlays } = args;

  return [
    datasetShape === "unsupported"
      ? "Il dataset `@colleghi` non espone una shape supportata fuori dai formati `array/value/items`."
      : null,
    skippedRawRecords > 0
      ? "Una parte dei record `@colleghi` e stata esclusa dal clone perche priva del nome minimo leggibile."
      : null,
    items.some((item) => item.flags.includes("badge_assente"))
      ? "Il badge non e valorizzato su tutti i colleghi."
      : null,
    items.some((item) => item.flags.includes("schede_carburante_assenti"))
      ? "Le schede carburante non sono presenti su tutti i colleghi."
      : null,
    includeCloneOverlays
      ? "Il clone mantiene aggiunta, modifica ed eliminazione solo nel layer locale NEXT; la madre resta intatta."
      : "Il runtime ufficiale NEXT legge `@colleghi` in sola lettura senza applicare overlay locali del clone.",
  ].filter((entry): entry is string => Boolean(entry));
}

export async function readNextColleghiSnapshot(
  options: ReadNextColleghiSnapshotOptions = {}
): Promise<NextColleghiSnapshot> {
  const { includeCloneOverlays = true } = options;
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, COLLEGHI_KEY));
  const rawDoc = snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  const { datasetShape, items: rawItems } = unwrapStorageArray(rawDoc);
  const deletedIds = includeCloneOverlays ? new Set(readNextDeletedCollegaIds()) : new Set<string>();
  const cloneItems = includeCloneOverlays
    ? readNextColleghiCloneRecords().map(mapCloneCollegaItem)
    : [];

  const mappedItems = rawItems.map((entry, index) => {
    if (!entry || typeof entry !== "object") return null;
    return toCollegaItem(entry as RawRecord, index);
  });

  const baseItems = mappedItems.filter((entry): entry is NextCollegaReadOnlyItem => Boolean(entry));
  const items = sortItems(
    [...baseItems.filter((entry) => !deletedIds.has(entry.id)), ...cloneItems].reduce<
      NextCollegaReadOnlyItem[]
    >((accumulator, entry) => {
      const next = accumulator.filter((item) => item.id !== entry.id);
      next.push(entry);
      return next;
    }, [])
  );
  const skippedRawRecords = rawItems.length - baseItems.length;

  return {
    domainCode: NEXT_COLLEGHI_DOMAIN.code,
    domainName: NEXT_COLLEGHI_DOMAIN.name,
    logicalDatasets: NEXT_COLLEGHI_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_COLLEGHI_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_COLLEGHI_DOMAIN.normalizationStrategy,
    datasetShape,
    items,
    counts: {
      total: items.length,
      withBadge: items.filter((item) => Boolean(item.badge)).length,
      withTelefono: items.filter((item) => Boolean(item.telefono)).length,
      withTelefonoPrivato: items.filter((item) => Boolean(item.telefonoPrivato)).length,
      withFuelCards: items.filter((item) => item.schedeCarburante.length > 0).length,
    },
    limitations: buildLimitations({
      datasetShape,
      items,
      skippedRawRecords,
      includeCloneOverlays,
    }),
  };
}
