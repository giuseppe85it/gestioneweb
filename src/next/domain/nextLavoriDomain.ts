import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  normalizeNextMezzoTarga,
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaMezzoItem,
} from "../nextAnagraficheFlottaDomain";

const STORAGE_COLLECTION = "storage";
const LAVORI_DATASET_KEY = "@lavori";
const MAGAZZINO_GROUP_KEY = "MAGAZZINO";

type RawRecord = Record<string, unknown>;

type NextLegacyDatasetShape =
  | "items"
  | "value.items"
  | "value"
  | "array"
  | "missing"
  | "unsupported";

type NextLavoriGroupKind = "mezzo" | "magazzino";
export type NextLavoriListaRouteId = "lavori-in-attesa" | "lavori-eseguiti";
export type NextLavoriDetailResolution = "group-by-gruppo-id" | "single-record";

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

type NextLavoroBaseReadOnlyItem = {
  id: string;
  gruppoId: string | null;
  mezzoTarga: string | null;
  targa: string | null;
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
  groupKind: NextLavoriGroupKind;
  groupKey: string;
  groupLabel: string;
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

export type NextLavoroReadOnlyItem = NextLavoroBaseReadOnlyItem & {
  mezzoTarga: string;
  targa: string;
  groupKind: "mezzo";
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

export type NextLavoriLegacyDatasetRecord = {
  id: string;
  gruppoId: string;
  tipo: "magazzino" | "targa";
  descrizione: string;
  dettagli?: string;
  dataInserimento: string;
  eseguito: boolean;
  targa?: string;
  urgenza?: "bassa" | "media" | "alta";
  segnalatoDa?: string;
  chiHaEseguito?: string;
  dataEsecuzione?: string;
  sottoElementi: unknown[];
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

export type NextLavoriListaRow = {
  id: string;
  gruppoId: string | null;
  targa: string | null;
  mezzoTarga: string | null;
  descrizione: string;
  dettagli: string | null;
  dataInserimento: string | null;
  timestampInserimento: number | null;
  dataEsecuzione: string | null;
  timestampEsecuzione: number | null;
  eseguito: boolean;
  urgenza: NextLavoroUrgenza;
  segnalatoDa: string | null;
  chiHaEseguito: string | null;
  sottoElementiCount: number;
  quality: NextLavoroRecordQuality;
  flags: string[];
};

export type NextLavoriListaGroup = {
  key: string;
  label: string;
  kind: NextLavoriGroupKind;
  mezzo: {
    targa: string;
    categoria: string | null;
    marcaModello: string | null;
    fotoUrl: string | null;
  } | null;
  items: NextLavoriListaRow[];
  counts: {
    total: number;
    alta: number;
    media: number;
    bassa: number;
  };
};

export type NextLavoriListaSnapshot = {
  domainCode: typeof NEXT_LAVORI_DOMAIN.code;
  domainName: typeof NEXT_LAVORI_DOMAIN.name;
  routeId: NextLavoriListaRouteId;
  title: string;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_LAVORI_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_LAVORI_DOMAIN.normalizationStrategy;
  outputContract: typeof NEXT_LAVORI_DOMAIN.outputContract;
  datasetShape: NextLegacyDatasetShape;
  groups: NextLavoriListaGroup[];
  counts: {
    totalLavori: number;
    totalGruppi: number;
    gruppiMezzo: number;
    gruppiMagazzino: number;
    conTarga: number;
    senzaTarga: number;
  };
  limitations: string[];
};

export type NextLavoriDetailItem = NextLavoriListaRow & {
  groupKind: NextLavoriGroupKind;
  groupKey: string;
  groupLabel: string;
  isPrimary: boolean;
};

export type NextLavoriDetailSnapshot = {
  domainCode: typeof NEXT_LAVORI_DOMAIN.code;
  domainName: typeof NEXT_LAVORI_DOMAIN.name;
  routePattern: "/next/dettagliolavori/:lavoroId";
  lavoroId: string;
  logicalDatasets: readonly string[];
  activeReadOnlyDataset: typeof NEXT_LAVORI_DOMAIN.activeReadOnlyDataset;
  normalizationStrategy: typeof NEXT_LAVORI_DOMAIN.normalizationStrategy;
  outputContract: typeof NEXT_LAVORI_DOMAIN.outputContract;
  datasetShape: NextLegacyDatasetShape;
  target: NextLavoriDetailItem;
  items: NextLavoriDetailItem[];
  detailGroup: {
    resolution: NextLavoriDetailResolution;
    gruppoId: string | null;
    key: string;
    label: string;
    kind: NextLavoriGroupKind;
    mezzo: {
      targa: string;
      categoria: string | null;
      marcaModello: string | null;
      fotoUrl: string | null;
    } | null;
    warnings: string[];
  };
  counts: {
    totalItems: number;
    aperti: number;
    eseguiti: number;
    conDettagli: number;
    senzaTarga: number;
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

function buildLavoroId(raw: RawRecord, mezzoTarga: string | null, index: number): string {
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
  groupKind: NextLavoriGroupKind;
}): NextLavoroRecordQuality {
  const hasCoreData =
    Boolean(item.descrizione) &&
    (item.groupKind === "magazzino" || item.targaQuality !== "non_disponibile") &&
    Boolean(item.dataInserimento);

  const executionGap = item.eseguito && !item.dataEsecuzione && !item.chiHaEseguito;

  if (hasCoreData && !executionGap && (item.groupKind === "magazzino" || item.gruppoId)) {
    return item.sourceQuality === "non_disponibile" ? "parziale" : "certo";
  }

  if (hasCoreData || item.sourceQuality !== "non_disponibile") {
    return "parziale";
  }

  return "da_verificare";
}

function normalizeGroupKind(
  tipo: NextLavoroTipo,
  mezzoTarga: string | null
): NextLavoriGroupKind {
  if (tipo === "magazzino" || !mezzoTarga) return "magazzino";
  return "mezzo";
}

function normalizeGroupKey(kind: NextLavoriGroupKind, mezzoTarga: string | null): string {
  if (kind === "magazzino") return MAGAZZINO_GROUP_KEY;
  return mezzoTarga || MAGAZZINO_GROUP_KEY;
}

function normalizeGroupLabel(kind: NextLavoriGroupKind, mezzoTarga: string | null): string {
  if (kind === "magazzino") return "MAGAZZINO";
  return mezzoTarga || "MAGAZZINO";
}

function toBaseLavoroReadOnlyItem(
  raw: RawRecord,
  index: number
): NextLavoroBaseReadOnlyItem {
  const targaDirect = normalizeNextMezzoTarga(raw.targa);
  const targaAlias = normalizeNextMezzoTarga(raw.mezzoTarga);
  const mezzoTarga = targaDirect || targaAlias || null;
  const tipo = normalizeTipoLavoro(raw.tipo);
  const groupKind = normalizeGroupKind(tipo, mezzoTarga);
  const groupKey = normalizeGroupKey(groupKind, mezzoTarga);
  const groupLabel = normalizeGroupLabel(groupKind, mezzoTarga);
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
  if (!mezzoTarga) flags.push("missing_targa");
  if (groupKind === "magazzino") flags.push("grouped_as_magazzino");
  if (!eseguito && !gruppoId) flags.push("aperto_senza_gruppo");
  if (eseguito && !dataEsecuzione) flags.push("eseguito_senza_data");
  if (eseguito && !normalizeOptionalText(raw.chiHaEseguito)) flags.push("eseguito_senza_esecutore");

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
  } satisfies NextLavoroBaseReadOnlyItem["fieldQuality"];

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
    statoVista: eseguito ? "eseguito" : groupKind === "mezzo" && gruppoId ? "in_attesa" : "da_eseguire",
    matchesGlobalOpenView: eseguito !== true,
    matchesDossierInAttesaView:
      eseguito !== true && groupKind === "mezzo" && Boolean(gruppoId),
    groupKind,
    groupKey,
    groupLabel,
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
      groupKind,
    }),
    flags,
  };
}

function isMezzoScopedLavoro(item: NextLavoroBaseReadOnlyItem): item is NextLavoroReadOnlyItem {
  return item.groupKind === "mezzo" && Boolean(item.mezzoTarga) && Boolean(item.targa);
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

function sortOpenItems<T extends { urgenza: NextLavoroUrgenza; timestampInserimento: number | null }>(
  items: T[]
): T[] {
  return [...items].sort((left, right) => {
    const byUrgenza = getUrgenzaWeight(right.urgenza) - getUrgenzaWeight(left.urgenza);
    if (byUrgenza !== 0) return byUrgenza;

    return (right.timestampInserimento ?? 0) - (left.timestampInserimento ?? 0);
  });
}

function sortExecutedItems<
  T extends {
    urgenza: NextLavoroUrgenza;
    timestampInserimento: number | null;
    timestampEsecuzione: number | null;
  },
>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const rightTs = right.timestampEsecuzione ?? right.timestampInserimento ?? 0;
    const leftTs = left.timestampEsecuzione ?? left.timestampInserimento ?? 0;
    if (rightTs !== leftTs) return rightTs - leftTs;
    return getUrgenzaWeight(right.urgenza) - getUrgenzaWeight(left.urgenza);
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

function buildListaLimitations(args: {
  routeId: NextLavoriListaRouteId;
  datasetShape: NextLegacyDatasetShape;
  counts: NextLavoriListaSnapshot["counts"];
}): string[] {
  const routeLabel =
    args.routeId === "lavori-in-attesa" ? "Lavori in attesa" : "Lavori eseguiti";

  return [
    `La lista clone \`${routeLabel}\` legge solo \`@lavori\` tramite il layer NEXT e apre il dettaglio solo sulla controparte clone-safe dedicata.`,
    args.counts.senzaTarga > 0
      ? "I record senza targa o marcati `magazzino` vengono raggruppati sotto `MAGAZZINO`, come nelle viste legacy della madre."
      : null,
    args.datasetShape === "unsupported"
      ? "Il dataset `@lavori` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
      : null,
    args.routeId === "lavori-in-attesa"
      ? "La madre usa `/lavori-da-eseguire` come writer di creazione; questa lista clone apre solo il backlog globale read-only (`eseguito !== true`)."
      : "La lista clone espone solo consultazione dei lavori chiusi e lascia fuori PDF, share e qualsiasi drill-down legacy scrivente.",
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

async function readNormalizedLavoriDataset(): Promise<{
  datasetShape: NextLegacyDatasetShape;
  items: NextLavoroBaseReadOnlyItem[];
}> {
  const dataset = await readLavoriDataset();
  const items = dataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return toBaseLavoroReadOnlyItem(entry as RawRecord, index);
    })
    .filter((entry): entry is NextLavoroBaseReadOnlyItem => Boolean(entry));

  return {
    datasetShape: dataset.datasetShape,
    items,
  };
}

function toListaRow(item: NextLavoroBaseReadOnlyItem): NextLavoriListaRow {
  return {
    id: item.id,
    gruppoId: item.gruppoId,
    targa: item.targa,
    mezzoTarga: item.mezzoTarga,
    descrizione: item.descrizione ?? "-",
    dettagli: item.dettagli,
    dataInserimento: item.dataInserimento,
    timestampInserimento: item.timestampInserimento,
    dataEsecuzione: item.dataEsecuzione,
    timestampEsecuzione: item.timestampEsecuzione,
    eseguito: item.eseguito,
    urgenza: item.urgenza,
    segnalatoDa: item.segnalatoDa,
    chiHaEseguito: item.chiHaEseguito,
    sottoElementiCount: item.sottoElementiCount,
    quality: item.quality,
    flags: item.flags,
  };
}

function toDetailItem(item: NextLavoroBaseReadOnlyItem, targetId: string): NextLavoriDetailItem {
  return {
    ...toListaRow(item),
    groupKind: item.groupKind,
    groupKey: item.groupKey,
    groupLabel: item.groupLabel,
    isPrimary: item.id === targetId,
  };
}

function buildMezzoIndex(
  items: NextAnagraficheFlottaMezzoItem[]
): Map<string, NextAnagraficheFlottaMezzoItem> {
  const index = new Map<string, NextAnagraficheFlottaMezzoItem>();
  items.forEach((item) => {
    const targa = normalizeNextMezzoTarga(item.targa);
    if (!targa || index.has(targa)) return;
    index.set(targa, item);
  });
  return index;
}

function sortListaGroups(groups: NextLavoriListaGroup[]): NextLavoriListaGroup[] {
  return [...groups].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "mezzo" ? -1 : 1;
    }
    return left.label.localeCompare(right.label, "it", { sensitivity: "base" });
  });
}

function sortDetailItems(items: NextLavoroBaseReadOnlyItem[]): NextLavoroBaseReadOnlyItem[] {
  return [...items].sort((left, right) => {
    const leftTs = left.timestampInserimento ?? Number.MAX_SAFE_INTEGER;
    const rightTs = right.timestampInserimento ?? Number.MAX_SAFE_INTEGER;
    if (leftTs !== rightTs) return leftTs - rightTs;

    const leftDate = left.dataInserimento ?? "";
    const rightDate = right.dataInserimento ?? "";
    const byDate = leftDate.localeCompare(rightDate, "it", { sensitivity: "base" });
    if (byDate !== 0) return byDate;

    return left.id.localeCompare(right.id, "it", { sensitivity: "base" });
  });
}

function buildDetailLimitations(args: {
  datasetShape: NextLegacyDatasetShape;
  resolution: NextLavoriDetailResolution;
  target: NextLavoroBaseReadOnlyItem;
  groupWarnings: string[];
}): string[] {
  return [
    "Il dettaglio clone legge solo `@lavori` tramite il layer NEXT e non riusa la pagina legacy scrivente.",
    args.resolution === "single-record"
      ? "Il record non espone un `gruppoId` affidabile: il clone mostra solo il lavoro richiesto e non aggrega altri record senza gruppo."
      : "Il gruppo viene ricostruito solo quando il `gruppoId` e presente nel dato legacy.",
    args.target.groupKind === "magazzino"
      ? "Il lavoro appartiene al raggruppamento `MAGAZZINO` o non espone una targa affidabile."
      : null,
    args.datasetShape === "unsupported"
      ? "Il dataset `@lavori` non e in una shape pienamente leggibile dal layer e viene trattato come non conforme."
      : null,
    ...args.groupWarnings,
  ].filter((entry): entry is string => Boolean(entry));
}

async function readNextLavoriListaSnapshot(
  routeId: NextLavoriListaRouteId
): Promise<NextLavoriListaSnapshot> {
  const [{ datasetShape, items }, anagrafiche] = await Promise.all([
    readNormalizedLavoriDataset(),
    readNextAnagraficheFlottaSnapshot(),
  ]);

  const mezzoIndex = buildMezzoIndex(anagrafiche.items);
  const relevantItems =
    routeId === "lavori-in-attesa"
      ? sortOpenItems(items.filter((item) => item.matchesGlobalOpenView))
      : sortExecutedItems(items.filter((item) => item.eseguito === true));

  const groupsMap = new Map<string, NextLavoroBaseReadOnlyItem[]>();
  relevantItems.forEach((item) => {
    const list = groupsMap.get(item.groupKey) ?? [];
    list.push(item);
    groupsMap.set(item.groupKey, list);
  });

  const groups = sortListaGroups(
    Array.from(groupsMap.entries()).map(([key, groupItems]) => {
      const first = groupItems[0];
      const mezzo =
        first.groupKind === "mezzo" && first.mezzoTarga
          ? mezzoIndex.get(first.mezzoTarga) ?? null
          : null;

      return {
        key,
        label: first.groupLabel,
        kind: first.groupKind,
        mezzo: mezzo
          ? {
              targa: mezzo.targa,
              categoria: normalizeOptionalText(mezzo.categoria),
              marcaModello: normalizeOptionalText(mezzo.marcaModello),
              fotoUrl: mezzo.fotoUrl ?? null,
            }
          : null,
        items: groupItems.map(toListaRow),
        counts: {
          total: groupItems.length,
          alta: groupItems.filter((item) => item.urgenza === "alta").length,
          media: groupItems.filter((item) => item.urgenza === "media" || item.urgenza == null).length,
          bassa: groupItems.filter((item) => item.urgenza === "bassa").length,
        },
      } satisfies NextLavoriListaGroup;
    })
  );

  const counts = {
    totalLavori: relevantItems.length,
    totalGruppi: groups.length,
    gruppiMezzo: groups.filter((group) => group.kind === "mezzo").length,
    gruppiMagazzino: groups.filter((group) => group.kind === "magazzino").length,
    conTarga: relevantItems.filter((item) => Boolean(item.mezzoTarga)).length,
    senzaTarga: relevantItems.filter((item) => !item.mezzoTarga).length,
  };

  return {
    domainCode: NEXT_LAVORI_DOMAIN.code,
    domainName: NEXT_LAVORI_DOMAIN.name,
    routeId,
    title: routeId === "lavori-in-attesa" ? "Lavori in attesa" : "Lavori eseguiti",
    logicalDatasets: NEXT_LAVORI_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_LAVORI_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_LAVORI_DOMAIN.normalizationStrategy,
    outputContract: NEXT_LAVORI_DOMAIN.outputContract,
    datasetShape,
    groups,
    counts,
    limitations: buildListaLimitations({ routeId, datasetShape, counts }),
  };
}

export async function readNextLavoriInAttesaSnapshot(): Promise<NextLavoriListaSnapshot> {
  return readNextLavoriListaSnapshot("lavori-in-attesa");
}

export async function readNextLavoriEseguitiSnapshot(): Promise<NextLavoriListaSnapshot> {
  return readNextLavoriListaSnapshot("lavori-eseguiti");
}

export function buildNextDettaglioLavoroPath(args: {
  lavoroId: string;
  search?: string;
  from?: NextLavoriListaRouteId;
}): string {
  const encodedId = encodeURIComponent(args.lavoroId);
  const params = new URLSearchParams(args.search ?? "");
  if (args.from) {
    params.set("from", args.from);
  } else {
    params.delete("from");
  }

  const serialized = params.toString();
  return serialized
    ? `/next/dettagliolavori/${encodedId}?${serialized}`
    : `/next/dettagliolavori/${encodedId}`;
}

export async function readNextDettaglioLavoroSnapshot(
  lavoroId: string
): Promise<NextLavoriDetailSnapshot | null> {
  const normalizedLavoroId = normalizeOptionalText(lavoroId);
  if (!normalizedLavoroId) return null;

  const [{ datasetShape, items }, anagrafiche] = await Promise.all([
    readNormalizedLavoriDataset(),
    readNextAnagraficheFlottaSnapshot(),
  ]);

  const target = items.find((item) => item.id === normalizedLavoroId);
  if (!target) return null;

  const mezzoIndex = buildMezzoIndex(anagrafiche.items);
  const resolution: NextLavoriDetailResolution = target.gruppoId
    ? "group-by-gruppo-id"
    : "single-record";

  // Se il gruppo non e esplicitato nel dato legacy, il clone resta deterministico
  // e mostra solo il record richiesto invece di aggregare tutti gli "orfani".
  const relatedItems =
    resolution === "group-by-gruppo-id"
      ? sortDetailItems(items.filter((item) => item.gruppoId === target.gruppoId))
      : [target];

  const detailItems = relatedItems.map((item) => toDetailItem(item, target.id));
  const uniqueGroupKeys = new Set(relatedItems.map((item) => item.groupKey));
  const uniqueKinds = new Set(relatedItems.map((item) => item.groupKind));
  const uniqueTarghe = new Set(relatedItems.map((item) => item.mezzoTarga ?? MAGAZZINO_GROUP_KEY));
  const mezzo =
    target.groupKind === "mezzo" && target.mezzoTarga
      ? mezzoIndex.get(target.mezzoTarga) ?? null
      : null;

  const groupWarnings = [
    uniqueGroupKeys.size > 1
      ? "Il gruppo espone chiavi di raggruppamento eterogenee nel dato legacy: il clone mantiene il gruppo solo per `gruppoId` senza dedurre ulteriori relazioni."
      : null,
    uniqueKinds.size > 1
      ? "Il gruppo contiene record sia mezzo-centrici sia `MAGAZZINO`: il clone li mostra insieme solo perche condividono lo stesso `gruppoId`."
      : null,
    uniqueTarghe.size > 1
      ? "Il gruppo contiene piu targhe o record senza targa: il clone non forza un mezzo principale diverso dal record richiesto."
      : null,
  ].filter((entry): entry is string => Boolean(entry));

  const detailGroupLabel =
    resolution === "single-record"
      ? target.groupLabel
      : uniqueGroupKeys.size === 1
        ? target.groupLabel
        : "Gruppo lavoro";

  return {
    domainCode: NEXT_LAVORI_DOMAIN.code,
    domainName: NEXT_LAVORI_DOMAIN.name,
    routePattern: "/next/dettagliolavori/:lavoroId",
    lavoroId: target.id,
    logicalDatasets: NEXT_LAVORI_DOMAIN.logicalDatasets,
    activeReadOnlyDataset: NEXT_LAVORI_DOMAIN.activeReadOnlyDataset,
    normalizationStrategy: NEXT_LAVORI_DOMAIN.normalizationStrategy,
    outputContract: NEXT_LAVORI_DOMAIN.outputContract,
    datasetShape,
    target: detailItems.find((item) => item.isPrimary) ?? detailItems[0],
    items: detailItems,
    detailGroup: {
      resolution,
      gruppoId: target.gruppoId,
      key: resolution === "group-by-gruppo-id" ? target.gruppoId ?? target.id : target.id,
      label: detailGroupLabel,
      kind: target.groupKind,
      mezzo: mezzo
        ? {
            targa: mezzo.targa,
            categoria: normalizeOptionalText(mezzo.categoria),
            marcaModello: normalizeOptionalText(mezzo.marcaModello),
            fotoUrl: mezzo.fotoUrl ?? null,
          }
        : null,
      warnings: groupWarnings,
    },
    counts: {
      totalItems: detailItems.length,
      aperti: detailItems.filter((item) => !item.eseguito).length,
      eseguiti: detailItems.filter((item) => item.eseguito).length,
      conDettagli: detailItems.filter((item) => Boolean(item.dettagli)).length,
      senzaTarga: detailItems.filter((item) => !item.targa).length,
    },
    limitations: buildDetailLimitations({
      datasetShape,
      resolution,
      target,
      groupWarnings,
    }),
  };
}

export async function readNextMezzoLavoriSnapshot(
  targa: string
): Promise<NextMezzoLavoriSnapshot> {
  const mezzoTarga = normalizeNextMezzoTarga(targa);
  const dataset = await readNormalizedLavoriDataset();

  const items = dataset.items.filter(isMezzoScopedLavoro).filter((entry) => entry.mezzoTarga === mezzoTarga);

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

export async function readNextLavoriLegacyDataset(): Promise<NextLavoriLegacyDatasetRecord[]> {
  const dataset = await readNormalizedLavoriDataset();

  return dataset.items.map((item) => ({
    id: item.id,
    gruppoId: item.gruppoId ?? item.groupKey,
    tipo: item.groupKind === "magazzino" ? "magazzino" : "targa",
    descrizione: item.descrizione ?? "-",
    dettagli: item.dettagli ?? undefined,
    dataInserimento: item.dataInserimento ?? "",
    eseguito: item.eseguito,
    targa: item.targa ?? undefined,
    urgenza: item.urgenza ?? undefined,
    segnalatoDa: item.segnalatoDa ?? undefined,
    chiHaEseguito: item.chiHaEseguito ?? undefined,
    dataEsecuzione: item.dataEsecuzione ?? undefined,
    sottoElementi: [],
  }));
}
