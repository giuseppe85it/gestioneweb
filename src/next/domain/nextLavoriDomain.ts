import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";

const STORAGE_COLLECTION = "storage";
const LAVORI_DATASET_KEY = "@lavori";

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

export type NextLavoroFieldQuality = "certo" | "ricostruito" | "non_disponibile";
export type NextLavoroRecordQuality = "certo" | "parziale" | "da_verificare";
export type NextLavoroTipo = "magazzino" | "targa" | null;
export type NextLavoroUrgenza = "bassa" | "media" | "alta" | null;
export type NextLavoroStatoVista = "da_eseguire" | "in_attesa" | "eseguito";

export const NEXT_LAVORI_DOMAIN = {
  code: "D02-LAVORI",
  name: "Lavori mezzo-centrici",
  logicalDatasets: [LAVORI_DATASET_KEY] as const,
  activeReadOnlyDataset: LAVORI_DATASET_KEY,
  normalizationStrategy: "NORMALIZER DEDICATO NEXT LAVORI READ-ONLY",
  outputContract: {
    certain: ["id", "targa", "eseguito", "statoVista", "source", "quality", "flags"] as const,
    optional: [
      "gruppoId",
      "descrizione",
      "dettagli",
      "tipo",
      "dataInserimento",
      "dataEsecuzione",
      "urgenza",
      "segnalatoDa",
      "chiHaEseguito",
    ] as const,
    classification: ["da_eseguire", "in_attesa", "eseguito"] as const,
  },
} as const;

export type NextLavoroReadOnlyItem = {
  id: string;
  gruppoId: string | null;
  mezzoTarga: string;
  targa: string;
  descrizione: string | null;
  dettagli: string | null;
  tipo: NextLavoroTipo;
  dataInserimento: string | null;
  timestampInserimento: number | null;
  dataEsecuzione: string | null;
  timestampEsecuzione: number | null;
  eseguito: boolean;
  urgenza: NextLavoroUrgenza;
  segnalatoDa: string | null;
  chiHaEseguito: string | null;
  sottoElementiCount: number;
  sottoElementiPresent: boolean;
  statoVista: NextLavoroStatoVista;
  matchesGlobalOpenView: boolean;
  matchesDossierInAttesaView: boolean;
  sourceCollection: typeof STORAGE_COLLECTION;
  sourceKey: typeof LAVORI_DATASET_KEY;
  source: {
    dataset: typeof LAVORI_DATASET_KEY;
    originType: string | null;
    originKey: string | null;
    originId: string | null;
  };
  fieldQuality: {
    targa: NextLavoroFieldQuality;
    descrizione: NextLavoroFieldQuality;
    dettagli: NextLavoroFieldQuality;
    dataInserimento: NextLavoroFieldQuality;
    dataEsecuzione: NextLavoroFieldQuality;
    urgenza: NextLavoroFieldQuality;
    source: NextLavoroFieldQuality;
  };
  quality: NextLavoroRecordQuality;
  flags: string[];
};

export type NextLavoriLegacyViewItem = {
  id: string;
  targa?: string;
  mezzoTarga?: string;
  descrizione: string;
  dettagli?: string;
  dataInserimento?: string;
  dataEsecuzione?: string;
  eseguito?: boolean;
  urgenza?: string;
  gruppoId?: string;
  chiHaEseguito?: string;
};

export type NextMezzoLavoriSnapshot = {
  domainCode: typeof NEXT_LAVORI_DOMAIN.code;
  domainName: typeof NEXT_LAVORI_DOMAIN.name;
  mezzoTarga: string;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_LAVORI_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_LAVORI_DOMAIN.normalizationStrategy;
  outputContract: typeof NEXT_LAVORI_DOMAIN.outputContract;
  datasetShape: NextLegacyDatasetShape;
  items: NextLavoroReadOnlyItem[];
  daEseguire: NextLavoroReadOnlyItem[];
  inAttesa: NextLavoroReadOnlyItem[];
  eseguiti: NextLavoroReadOnlyItem[];
  counts: {
    total: number;
    daEseguire: number;
    inAttesa: number;
    eseguiti: number;
    apertiSenzaGruppo: number;
    withDettagli: number;
    withDataEsecuzione: number;
    withChiHaEseguito: number;
    sourceSegnalazioni: number;
    sourceControlli: number;
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

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().toLowerCase() === "true";
  return false;
}

function normalizeTipoLavoro(value: unknown): NextLavoroTipo {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "magazzino" || normalized === "targa") return normalized;
  return null;
}

function normalizeUrgenza(value: unknown): NextLavoroUrgenza {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "alta" || normalized === "media" || normalized === "bassa") {
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

  const dmyWithTime = raw.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
  );
  if (dmyWithTime) {
    const day = Number(dmyWithTime[1]);
    const month = Number(dmyWithTime[2]) - 1;
    const yearRaw = Number(dmyWithTime[3]);
    const year = dmyWithTime[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
    const hh = Number(dmyWithTime[4] ?? "12");
    const mm = Number(dmyWithTime[5] ?? "00");
    const date = new Date(year, month, day, hh, mm, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
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

function buildLavoroId(raw: RawRecord, mezzoTarga: string, index: number): string {
  const id = normalizeText(raw.id);
  if (id) return id;
  if (mezzoTarga) return `lavoro:${mezzoTarga}:${index}`;
  return `lavoro:${index}`;
}

function countSottoElementi(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function deriveRecordQuality(item: {
  descrizione: string | null;
  targaQuality: NextLavoroFieldQuality;
  dataInserimento: string | null;
  eseguito: boolean;
  dataEsecuzione: string | null;
  chiHaEseguito: string | null;
  gruppoId: string | null;
  sourceQuality: NextLavoroFieldQuality;
}): NextLavoroRecordQuality {
  const hasCoreData =
    Boolean(item.descrizione) &&
    item.targaQuality !== "non_disponibile" &&
    Boolean(item.dataInserimento);

  const executionGap =
    item.eseguito && !item.dataEsecuzione && !item.chiHaEseguito;

  if (hasCoreData && !executionGap && item.gruppoId) {
    return item.sourceQuality === "non_disponibile" ? "parziale" : "certo";
  }

  if (hasCoreData || item.sourceQuality !== "non_disponibile") {
    return "parziale";
  }

  return "da_verificare";
}

function toNextLavoroReadOnlyItem(
  raw: RawRecord,
  index: number
): NextLavoroReadOnlyItem | null {
  const targaDirect = normalizeNextMezzoTarga(raw.targa);
  const targaAlias = normalizeNextMezzoTarga(raw.mezzoTarga);
  const mezzoTarga = targaDirect || targaAlias;
  if (!mezzoTarga) return null;

  const descrizione = normalizeOptionalText(raw.descrizione);
  const dettagli = normalizeOptionalText(raw.dettagli);
  const dataInserimento = normalizeOptionalText(raw.dataInserimento);
  const dataEsecuzione = normalizeOptionalText(raw.dataEsecuzione);
  const eseguito = normalizeBoolean(raw.eseguito);
  const gruppoId = normalizeOptionalText(raw.gruppoId);
  const sourceRecord =
    raw.source && typeof raw.source === "object" && !Array.isArray(raw.source)
      ? (raw.source as RawRecord)
      : null;
  const sourceQuality: NextLavoroFieldQuality = sourceRecord ? "certo" : "non_disponibile";
  const flags: string[] = [];

  if (!descrizione) flags.push("missing_descrizione");
  if (!dataInserimento) flags.push("missing_data_inserimento");
  if (!gruppoId) flags.push("missing_gruppo_id");
  if (!sourceRecord) flags.push("source_non_tracciata");
  if (targaDirect === "" && targaAlias !== "") flags.push("targa_da_mezzoTarga");
  if (!eseguito && !gruppoId) flags.push("aperto_senza_gruppo");
  if (eseguito && !dataEsecuzione) flags.push("eseguito_senza_data");
  if (eseguito && !normalizeOptionalText(raw.chiHaEseguito)) flags.push("eseguito_senza_esecutore");

  const tipo = normalizeTipoLavoro(raw.tipo);
  if (!tipo && raw.tipo != null) flags.push("tipo_non_standard");

  const urgenza = normalizeUrgenza(raw.urgenza);
  if (!urgenza && raw.urgenza != null) flags.push("urgenza_non_standard");

  const sourceType = normalizeOptionalText(sourceRecord?.type);
  const sourceKey = normalizeOptionalText(sourceRecord?.key);
  const sourceId = normalizeOptionalText(sourceRecord?.id);
  if (sourceType === "segnalazione") flags.push("source_segnalazione");
  if (sourceType === "controllo") flags.push("source_controllo");
  if (dettagli) flags.push("dettagli_presenti");

  const sottoElementiCount = countSottoElementi(raw.sottoElementi);
  if (sottoElementiCount > 0) flags.push("sottoelementi_presenti");

  const fieldQuality = {
    targa: targaDirect ? "certo" : targaAlias ? "ricostruito" : "non_disponibile",
    descrizione: descrizione ? "certo" : "non_disponibile",
    dettagli: dettagli ? "certo" : "non_disponibile",
    dataInserimento: dataInserimento ? "certo" : "non_disponibile",
    dataEsecuzione: dataEsecuzione ? "certo" : "non_disponibile",
    urgenza: urgenza ? "certo" : raw.urgenza != null ? "ricostruito" : "non_disponibile",
    source: sourceQuality,
  } satisfies NextLavoroReadOnlyItem["fieldQuality"];

  return {
    id: buildLavoroId(raw, mezzoTarga, index),
    gruppoId,
    mezzoTarga,
    targa: mezzoTarga,
    descrizione,
    dettagli,
    tipo,
    dataInserimento,
    timestampInserimento: toTimestamp(raw.dataInserimento),
    dataEsecuzione,
    timestampEsecuzione: toTimestamp(raw.dataEsecuzione),
    eseguito,
    urgenza,
    segnalatoDa: normalizeOptionalText(raw.segnalatoDa),
    chiHaEseguito: normalizeOptionalText(raw.chiHaEseguito),
    sottoElementiCount,
    sottoElementiPresent: sottoElementiCount > 0,
    statoVista: eseguito ? "eseguito" : gruppoId ? "in_attesa" : "da_eseguire",
    matchesGlobalOpenView: eseguito !== true,
    matchesDossierInAttesaView: eseguito !== true && Boolean(gruppoId),
    sourceCollection: STORAGE_COLLECTION,
    sourceKey: LAVORI_DATASET_KEY,
    source: {
      dataset: LAVORI_DATASET_KEY,
      originType: sourceType,
      originKey: sourceKey,
      originId: sourceId,
    },
    fieldQuality,
    quality: deriveRecordQuality({
      descrizione,
      targaQuality: fieldQuality.targa,
      dataInserimento,
      eseguito,
      dataEsecuzione,
      chiHaEseguito: normalizeOptionalText(raw.chiHaEseguito),
      gruppoId,
      sourceQuality,
    }),
    flags,
  };
}

function getUrgenzaWeight(value: NextLavoroUrgenza): number {
  switch (value) {
    case "alta":
      return 3;
    case "media":
      return 2;
    case "bassa":
      return 1;
    default:
      return 0;
  }
}

function sortOpenItems(items: NextLavoroReadOnlyItem[]): NextLavoroReadOnlyItem[] {
  return [...items].sort((left, right) => {
    const byUrgenza = getUrgenzaWeight(right.urgenza) - getUrgenzaWeight(left.urgenza);
    if (byUrgenza !== 0) return byUrgenza;

    return (right.timestampInserimento ?? 0) - (left.timestampInserimento ?? 0);
  });
}

function sortExecutedItems(items: NextLavoroReadOnlyItem[]): NextLavoroReadOnlyItem[] {
  return [...items].sort((left, right) => {
    const rightTs = right.timestampEsecuzione ?? right.timestampInserimento ?? 0;
    const leftTs = left.timestampEsecuzione ?? left.timestampInserimento ?? 0;
    return rightTs - leftTs;
  });
}

function buildLimitations(snapshot: {
  datasetShape: NextLegacyDatasetShape;
  counts: NextMezzoLavoriSnapshot["counts"];
}): string[] {
  return [
    "Il layer Lavori legge solo `@lavori` e mantiene nel dominio la distinzione tra backlog aperto (`eseguito !== true`), vista Dossier `In attesa` (`gruppoId` presente) e chiusi.",
    snapshot.counts.apertiSenzaGruppo > 0
      ? "Una parte dei lavori aperti non ha `gruppoId`: il clone li conserva nel backlog read-only ma non li forza dentro la vista legacy `In attesa` del Dossier."
      : null,
    snapshot.counts.withDataEsecuzione < snapshot.counts.eseguiti
      ? "Alcuni lavori eseguiti non espongono `dataEsecuzione` nel dato legacy."
      : null,
    snapshot.counts.withChiHaEseguito < snapshot.counts.eseguiti
      ? "Alcuni lavori eseguiti non espongono `chiHaEseguito` nel dato legacy."
      : null,
    snapshot.datasetShape === "unsupported"
      ? "Il dataset `@lavori` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
      : null,
    "Il layer non deduce stati avanzamento da `sottoElementi`: il repo reale usa solo `eseguito` e `gruppoId` come discriminanti verificabili nelle viste legacy.",
  ].filter((entry): entry is string => Boolean(entry));
}

async function readLavoriDataset(): Promise<{
  datasetShape: NextLegacyDatasetShape;
  items: unknown[];
}> {
  const snapshot = await getDoc(doc(db, STORAGE_COLLECTION, LAVORI_DATASET_KEY));
  const rawDoc = snapshot.exists()
    ? ((snapshot.data() as Record<string, unknown>) ?? null)
    : null;

  return unwrapStorageArray(rawDoc);
}

export async function readNextMezzoLavoriSnapshot(
  targa: string
): Promise<NextMezzoLavoriSnapshot> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  const dataset = await readLavoriDataset();

  const items = dataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return toNextLavoroReadOnlyItem(entry as RawRecord, index);
    })
    .filter((entry): entry is NextLavoroReadOnlyItem => Boolean(entry))
    .filter((entry) => entry.mezzoTarga === mezzoTarga);

  const daEseguire = sortOpenItems(items.filter((entry) => entry.matchesGlobalOpenView));
  const inAttesa = sortOpenItems(items.filter((entry) => entry.matchesDossierInAttesaView));
  const eseguiti = sortExecutedItems(items.filter((entry) => entry.eseguito === true));

  const counts = {
    total: items.length,
    daEseguire: daEseguire.length,
    inAttesa: inAttesa.length,
    eseguiti: eseguiti.length,
    apertiSenzaGruppo: daEseguire.filter((entry) => !entry.gruppoId).length,
    withDettagli: items.filter((entry) => Boolean(entry.dettagli)).length,
    withDataEsecuzione: eseguiti.filter((entry) => Boolean(entry.dataEsecuzione)).length,
    withChiHaEseguito: eseguiti.filter((entry) => Boolean(entry.chiHaEseguito)).length,
    sourceSegnalazioni: items.filter((entry) => entry.source.originType === "segnalazione").length,
    sourceControlli: items.filter((entry) => entry.source.originType === "controllo").length,
  };

  return {
    domainCode: NEXT_LAVORI_DOMAIN.code,
    domainName: NEXT_LAVORI_DOMAIN.name,
    mezzoTarga,
    logicalDatasets: NEXT_LAVORI_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_LAVORI_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_LAVORI_DOMAIN.normalizationStrategy,
    outputContract: NEXT_LAVORI_DOMAIN.outputContract,
    datasetShape: dataset.datasetShape,
    items,
    daEseguire,
    inAttesa,
    eseguiti,
    counts,
    limitations: buildLimitations({
      datasetShape: dataset.datasetShape,
      counts,
    }),
  };
}

export function mapNextLavoriItemsToLegacyView(
  items: NextLavoroReadOnlyItem[]
): NextLavoriLegacyViewItem[] {
  return items.map((item) => ({
    id: item.id,
    targa: item.targa,
    mezzoTarga: item.mezzoTarga,
    descrizione: item.descrizione ?? "-",
    dettagli: item.dettagli ?? undefined,
    dataInserimento: item.dataInserimento ?? undefined,
    dataEsecuzione: item.dataEsecuzione ?? undefined,
    eseguito: item.eseguito,
    urgenza: item.urgenza ?? undefined,
    gruppoId: item.gruppoId ?? undefined,
    chiHaEseguito: item.chiHaEseguito ?? undefined,
  }));
}

export function buildNextLavoriLegacyDossierView(
  snapshot: NextMezzoLavoriSnapshot
): {
  lavoriDaEseguire: NextLavoriLegacyViewItem[];
  lavoriInAttesa: NextLavoriLegacyViewItem[];
  lavoriEseguiti: NextLavoriLegacyViewItem[];
} {
  return {
    lavoriDaEseguire: mapNextLavoriItemsToLegacyView(snapshot.daEseguire),
    lavoriInAttesa: mapNextLavoriItemsToLegacyView(snapshot.inAttesa),
    lavoriEseguiti: mapNextLavoriItemsToLegacyView(snapshot.eseguiti),
  };
}
