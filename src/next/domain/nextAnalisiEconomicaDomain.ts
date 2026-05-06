import { readNextUnifiedCollection } from "./nextUnifiedReadRegistryDomain";

type RawRecord = Record<string, unknown>;

const ANALISI_ECONOMICA_COLLECTION = "@analisi_economica_mezzi" as const;

export const NEXT_ANALISI_ECONOMICA_DOMAIN = {
  code: "D17-IA-ANALISI-ECONOMICA",
  name: "Analisi economiche mezzi salvate",
  logicalDatasets: [ANALISI_ECONOMICA_COLLECTION] as const,
  activeReadOnlyDataset: ANALISI_ECONOMICA_COLLECTION,
  normalizationStrategy: "LAYER NEXT READ-ONLY SU collection @analisi_economica_mezzi",
} as const;

export type NextAnalisiEconomicaQuality = "certo" | "parziale" | "da_verificare";

export type NextAnalisiEconomicaSavedItem = {
  id: string;
  targa: string | null;
  riepilogoBreve: string | null;
  analisiCosti: string | null;
  anomalie: string | null;
  fornitoriNotevoli: string | null;
  updatedAtLabel: string | null;
  updatedAtTimestamp: number | null;
  sourceCollection: typeof ANALISI_ECONOMICA_COLLECTION;
  sourceDocId: string;
  quality: NextAnalisiEconomicaQuality;
  flags: string[];
  raw: RawRecord;
};

export type NextAnalisiEconomicaSavedSnapshot = {
  domainCode: typeof NEXT_ANALISI_ECONOMICA_DOMAIN.code;
  domainName: typeof NEXT_ANALISI_ECONOMICA_DOMAIN.name;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_ANALISI_ECONOMICA_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_ANALISI_ECONOMICA_DOMAIN.normalizationStrategy;
  sourceStatus: "ready" | "missing" | "error";
  sourceId: string;
  items: NextAnalisiEconomicaSavedItem[];
  counts: {
    total: number;
    withTarga: number;
    withUpdatedAt: number;
    complete: number;
  };
  limitations: string[];
};

export type ReadNextAnalisiEconomicaSavedOptions = {
  targa?: string | null;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeTarga(value: unknown): string | null {
  const normalized = normalizeOptionalText(value)?.toUpperCase().replace(/\s+/g, "") ?? null;
  return normalized || null;
}

function toTimestamp(value: unknown): number | null {
  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isNaN(millis) ? null : millis;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }

  if (value && typeof value === "object") {
    const maybe = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof maybe.toDate === "function") {
      return toTimestamp(maybe.toDate());
    }
    if (typeof maybe.seconds === "number") return maybe.seconds * 1000;
    if (typeof maybe._seconds === "number") return maybe._seconds * 1000;
  }

  const normalized = normalizeOptionalText(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

function formatTimestamp(timestamp: number | null): string | null {
  if (timestamp === null) return null;
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function deriveQuality(flags: string[]): NextAnalisiEconomicaQuality {
  if (flags.length === 0) return "certo";
  return flags.length <= 2 ? "parziale" : "da_verificare";
}

function mapSavedAnalysis(raw: RawRecord): NextAnalisiEconomicaSavedItem {
  const sourceDocId = normalizeOptionalText(raw.__docId) ?? "analisi_economica_senza_id";
  const targa = normalizeTarga(raw.targa) ?? normalizeTarga(sourceDocId);
  const riepilogoBreve = normalizeOptionalText(raw.riepilogoBreve);
  const analisiCosti = normalizeOptionalText(raw.analisiCosti);
  const anomalie = normalizeOptionalText(raw.anomalie);
  const fornitoriNotevoli = normalizeOptionalText(raw.fornitoriNotevoli);
  const updatedAtTimestamp = toTimestamp(raw.updatedAt);
  const flags: string[] = [];

  if (!targa) flags.push("targa_assente");
  if (!riepilogoBreve) flags.push("riepilogo_assente");
  if (!analisiCosti) flags.push("analisi_costi_assente");
  if (!anomalie) flags.push("anomalie_assenti");
  if (!fornitoriNotevoli) flags.push("fornitori_notevoli_assenti");
  if (updatedAtTimestamp === null) flags.push("updated_at_assente");

  return {
    id: sourceDocId,
    targa,
    riepilogoBreve,
    analisiCosti,
    anomalie,
    fornitoriNotevoli,
    updatedAtLabel:
      normalizeOptionalText(raw.updatedAtLabel) ??
      normalizeOptionalText(raw.dataAggiornamento) ??
      formatTimestamp(updatedAtTimestamp),
    updatedAtTimestamp,
    sourceCollection: ANALISI_ECONOMICA_COLLECTION,
    sourceDocId,
    quality: deriveQuality(flags),
    flags,
    raw,
  };
}

export async function readNextAnalisiEconomicaSavedSnapshot(
  options: ReadNextAnalisiEconomicaSavedOptions = {},
): Promise<NextAnalisiEconomicaSavedSnapshot> {
  const readResult = await readNextUnifiedCollection({
    collectionName: ANALISI_ECONOMICA_COLLECTION,
  });
  const requestedTarga = normalizeTarga(options.targa);
  const items = readResult.records
    .map((record) => mapSavedAnalysis(record))
    .filter((item) => !requestedTarga || item.targa === requestedTarga);

  return {
    domainCode: NEXT_ANALISI_ECONOMICA_DOMAIN.code,
    domainName: NEXT_ANALISI_ECONOMICA_DOMAIN.name,
    logicalDatasets: NEXT_ANALISI_ECONOMICA_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_ANALISI_ECONOMICA_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_ANALISI_ECONOMICA_DOMAIN.normalizationStrategy,
    sourceStatus: readResult.status,
    sourceId: readResult.sourceId,
    items,
    counts: {
      total: items.length,
      withTarga: items.filter((item) => Boolean(item.targa)).length,
      withUpdatedAt: items.filter((item) => item.updatedAtTimestamp !== null).length,
      complete: items.filter((item) => item.quality === "certo").length,
    },
    limitations: [
      ...readResult.notes,
      requestedTarga && items.length === 0
        ? "Nessuna analisi economica salvata trovata per la targa richiesta."
        : null,
      items.some((item) => item.flags.includes("updated_at_assente"))
        ? "Una parte delle analisi salvate non espone un updatedAt leggibile."
        : null,
      "Il reader espone solo analisi economiche gia salvate: non rigenera IA e non scrive su Firestore.",
    ].filter((entry): entry is string => Boolean(entry)),
  };
}
