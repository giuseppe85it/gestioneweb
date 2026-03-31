import {
  createEmptyAlertsState,
  isMetaChanged,
  normalizeTargaForAlertId,
  parseAlertsState,
  pruneAlertsState,
  stableHash32,
  type AlertMeta,
  type AlertsState,
} from "../../utils/alertsState";
import { formatDateTimeUI, formatDateUI } from "../nextDateFormat";
import type { HomeEvent } from "../../utils/homeEvents";
import { normalizeNextMezzoTarga } from "../nextAnagraficheFlottaDomain";
import { readNextUnifiedStorageDocument } from "./nextUnifiedReadRegistryDomain";

const ALERTS_STATE_KEY = "@alerts_state";
const MEZZI_KEY = "@mezzi_aziendali";
const SESSIONI_KEY = "@autisti_sessione_attive";
const EVENTI_KEY = "@storico_eventi_operativi";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const DAY_MS = 24 * 60 * 60 * 1000;

const CATEGORIE_RIMORCHI_HOME = [
  "biga",
  "vasca",
  "centina",
  "semirimorchio asse fisso",
  "semirimorchio asse sterzante",
] as const;
const CATEGORIE_RIMORCHI_HOME_SET = new Set(
  CATEGORIE_RIMORCHI_HOME.map((value) => value.trim().toLowerCase())
);

type MezzoRecord = Record<string, unknown>;
type SessioneRecord = Record<string, unknown>;
type StoricoEventoRecord = Record<string, unknown>;
type SegnalazioneRecord = Record<string, unknown>;
type ControlloRecord = Record<string, unknown>;

type D10BuildInput = {
  alertsStateRaw: unknown;
  mezziRaw: unknown;
  sessioniRaw: unknown;
  eventiRaw: unknown;
  segnalazioniRaw: unknown;
  controlliRaw: unknown;
  now?: number;
};

export const NEXT_CENTRO_CONTROLLO_DOMAIN = {
  code: "D10",
  name: "Centro di controllo, eventi e focus operativi",
  logicalDatasets: [
    ALERTS_STATE_KEY,
    MEZZI_KEY,
    SESSIONI_KEY,
    EVENTI_KEY,
    SEGNALAZIONI_KEY,
    CONTROLLI_KEY,
  ] as const,
  allowedAlertKinds: [
    "revisione",
    "conflitto_sessione",
    "segnalazione_nuova",
    "eventi_importanti_autisti",
  ] as const,
  allowedFocusKinds: ["controllo_ko", "mezzo_incompleto"] as const,
} as const;

export const NEXT_STATO_OPERATIVO_DOMAIN = NEXT_CENTRO_CONTROLLO_DOMAIN;

export type D10Severity = "danger" | "warning" | "info";
export type D10Quality =
  | "source_direct"
  | "derived_acceptable"
  | "mixed_support"
  | "excluded_from_v1";
export type D10AlertKind =
  (typeof NEXT_CENTRO_CONTROLLO_DOMAIN.allowedAlertKinds)[number];
export type D10FocusKind =
  (typeof NEXT_CENTRO_CONTROLLO_DOMAIN.allowedFocusKinds)[number];
export type D10TargetRouteKind = "dossier" | "mezzi" | "none";

export type D10PrenotazioneCollaudo = {
  data: string | null;
  ora: string | null;
  luogo: string | null;
  note: string | null;
  esito: string | null;
  noteEsito: string | null;
  completata: boolean;
  completataIl: string | null;
};

export type D10PreCollaudo = {
  data: string | null;
  officina: string | null;
};

export type D10MezzoItem = {
  id: string;
  targa: string | null;
  categoria: string | null;
  autistaNome: string | null;
  marca: string | null;
  modello: string | null;
  dataImmatricolazioneTs: number | null;
  dataUltimoCollaudoTs: number | null;
  dataScadenzaRevisioneTs: number | null;
  prenotazioneCollaudo: D10PrenotazioneCollaudo | null;
  preCollaudo: D10PreCollaudo | null;
  note: string | null;
  manutenzioneProgrammata: boolean;
  manutenzioneDataFineTs: number | null;
  sourceDataset: string;
  quality: D10Quality;
  flags: string[];
};

export type D10SessionItem = {
  id: string;
  targaMotrice: string | null;
  targaRimorchio: string | null;
  nomeAutista: string | null;
  badgeAutista: string | null;
  statoSessione: string | null;
  timestamp: number | null;
  sourceDataset: string;
  quality: D10Quality;
  flags: string[];
};

export type D10StoricoEventoItem = {
  id: string;
  tipo: string | null;
  timestamp: number | null;
  luogo: string | null;
  badgeAutista: string | null;
  nomeAutista: string | null;
  statoCarico: string | null;
  condizioni: unknown;
  targaMotricePrima: string | null;
  targaMotriceDopo: string | null;
  targaRimorchioPrima: string | null;
  targaRimorchioDopo: string | null;
  targasCoinvolte: string[];
  sourceDataset: string;
  sourceRecordId: string | null;
  quality: D10Quality;
  flags: string[];
};

export type D10RevisionItem = {
  id: string;
  targa: string | null;
  marca: string | null;
  modello: string | null;
  autistaNome: string | null;
  scadenzaTs: number | null;
  giorni: number | null;
  classe: string;
  prenotazioneCollaudo: D10PrenotazioneCollaudo | null;
  preCollaudo: D10PreCollaudo | null;
  sourceDataset: string;
  sourceRecordId: string;
  quality: D10Quality;
  flags: string[];
  targetRoute: string | null;
};

export type D10AssetLocationItem = {
  id: string;
  targa: string;
  categoria: string | null;
  autistaNome: string | null;
  inUso: boolean;
  luogo: string;
  luogoRaw: string;
  luogoTimestamp: number | null;
  luogoEventId: string | null;
  luogoEventIndex: number | null;
  statusLabel: string;
  assetKind: "rimorchio" | "motrice_o_trattore";
  sourceDataset: string;
  quality: D10Quality;
  flags: string[];
  targetRoute: string;
};

export type D10MissingMezzoItem = {
  id?: string;
  targa: string;
  categoria: string;
  autistaNome: string;
  missing: {
    targa: boolean;
    categoria: boolean;
    autista: boolean;
  };
  quality: D10Quality;
  flags: string[];
  targetRoute: string;
};

export type D10AlertItem = {
  id: string;
  kind: D10AlertKind;
  title: string;
  detailText: string;
  meta: AlertMeta;
  severity: D10Severity;
  quality: D10Quality;
  mezzoTarga: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  eventTs: number | null;
  dueTs: number | null;
  dateLabel: string | null;
  sourceDataset: string;
  sourceRecordId: string | null;
  targetRouteKind: D10TargetRouteKind;
  targetRoute: string | null;
  flags: string[];
  ackAt: number | null;
  snoozeUntil: number | null;
  lastShownAt: number | null;
};

export type D10FocusItem = {
  id: string;
  kind: D10FocusKind;
  title: string;
  detailText: string;
  severity: D10Severity;
  quality: D10Quality;
  mezzoTarga: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  eventTs: number | null;
  dateLabel: string | null;
  sourceDataset: string;
  sourceRecordId: string | null;
  targetRouteKind: D10TargetRouteKind;
  targetRoute: string | null;
  flags: string[];
};

export type D10ImportantAutistiEventItem = {
  id: string;
  event: HomeEvent;
  ts: number;
  targa: string;
  tipo: string;
  preview: string;
  sourceDataset: string;
  quality: D10Quality;
  flags: string[];
  targetRoute: string | null;
};

export type D10Snapshot = {
  domainCode: typeof NEXT_CENTRO_CONTROLLO_DOMAIN.code;
  domainName: typeof NEXT_CENTRO_CONTROLLO_DOMAIN.name;
  generatedAt: number;
  logicalDatasets: readonly string[];
  counters: {
    alertsVisible: number;
    revisioniScadute: number;
    revisioniInScadenza: number;
    conflittiSessione: number;
    segnalazioniNuove: number;
    controlliKo: number;
    sessioniAttive: number;
    mezziIncompleti: number;
    eventiImportanti: number;
  };
  mezzi: D10MezzoItem[];
  sessioni: D10SessionItem[];
  eventiStorici: D10StoricoEventoItem[];
  revisioni: D10RevisionItem[];
  revisioniUrgenti: D10RevisionItem[];
  alerts: D10AlertItem[];
  focusItems: D10FocusItem[];
  importantAutistiItems: D10ImportantAutistiEventItem[];
  rimorchiDaMostrare: D10AssetLocationItem[];
  motriciTrattoriDaMostrare: D10AssetLocationItem[];
  missingMezzi: D10MissingMezzoItem[];
  limitations: string[];
};

type D10SegnalazioneItem = {
  id: string;
  timestamp: number | null;
  targa: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  tipoProblema: string | null;
  descrizione: string | null;
  note: string | null;
  ambito: string | null;
  isNuova: boolean;
  isImportante: boolean;
  preview: string;
  sourceDataset: string;
  sourceRecordId: string | null;
  quality: D10Quality;
  flags: string[];
  raw: SegnalazioneRecord;
};

type D10ControlloItem = {
  id: string;
  timestamp: number | null;
  target: string | null;
  targaMotrice: string | null;
  targaRimorchio: string | null;
  targaLabel: string | null;
  autistaNome: string | null;
  badgeAutista: string | null;
  koItems: string[];
  preview: string;
  isKo: boolean;
  sourceDataset: string;
  sourceRecordId: string | null;
  quality: D10Quality;
  flags: string[];
  raw: ControlloRecord;
};

type D10BaseAlertCandidate = Omit<
  D10AlertItem,
  "ackAt" | "snoozeUntil" | "lastShownAt"
> & {
  meta: AlertMeta;
  sortBucket: number;
  sortValue: number;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeOptionalTarga(value: unknown): string | null {
  const normalized = normalizeNextMezzoTarga(value);
  return normalized || null;
}

function normalizeFreeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function truncateText(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  const sliceLen = Math.max(0, maxLen - 3);
  return `${value.slice(0, sliceLen).trimEnd()}...`;
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

  const isoLike = Date.parse(raw);
  if (!Number.isNaN(isoLike)) return new Date(isoLike);

  const dmyMatch = raw.match(
    /^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
  );
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]) - 1;
    const yearRaw = Number(dmyMatch[3]);
    const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
    const hh = Number(dmyMatch[4] ?? "12");
    const mm = Number(dmyMatch[5] ?? "00");
    const date = new Date(year, month, day, hh, mm, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function toTimestamp(value: unknown): number | null {
  const parsed = parseDateFlexible(value);
  return parsed ? parsed.getTime() : null;
}

function formatDateLabel(ts: number | null): string | null {
  return ts === null ? null : formatDateUI(ts);
}

function formatDateTimeLabel(ts: number | null): string | null {
  return ts === null ? null : formatDateTimeUI(ts);
}

function formatGiorniLabel(days: number): string {
  if (days === 0) return "oggi";
  const abs = Math.abs(days);
  const base = abs === 1 ? "1 giorno" : `${abs} giorni`;
  return days < 0 ? `${base} fa` : `tra ${base}`;
}

function giorniDaOggi(target: Date | null, now: number): number | null {
  if (!target) return null;
  const today = new Date(now);
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((utcTarget - utcToday) / DAY_MS);
}

function calcolaProssimaRevisione(
  dataImmatricolazione: Date | null,
  dataUltimoCollaudo: Date | null,
  now: number
): Date | null {
  if (!dataImmatricolazione) {
    return dataUltimoCollaudo ? new Date(dataUltimoCollaudo) : null;
  }

  const immDate = new Date(dataImmatricolazione);
  immDate.setHours(12, 0, 0, 0);

  const today = new Date(now);
  today.setHours(12, 0, 0, 0);

  const firstRevision = new Date(immDate);
  firstRevision.setFullYear(firstRevision.getFullYear() + 4);

  if (!dataUltimoCollaudo) {
    if (firstRevision > today) return firstRevision;

    const afterFirst = new Date(firstRevision);
    while (afterFirst <= today) {
      afterFirst.setFullYear(afterFirst.getFullYear() + 2);
    }
    return afterFirst;
  }

  const lastCollaudo = new Date(dataUltimoCollaudo);
  lastCollaudo.setHours(12, 0, 0, 0);

  const nextFromCollaudo = new Date(lastCollaudo);
  nextFromCollaudo.setFullYear(nextFromCollaudo.getFullYear() + 2);

  const nextFromImmatricolazione = new Date(immDate);
  while (nextFromImmatricolazione <= today) {
    nextFromImmatricolazione.setFullYear(nextFromImmatricolazione.getFullYear() + 2);
  }

  return nextFromCollaudo > nextFromImmatricolazione
    ? nextFromCollaudo
    : nextFromImmatricolazione;
}

function unwrapArrayValue(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];

  const record = raw as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.value)) return record.value;

  if (record.value && typeof record.value === "object") {
    const nested = record.value as Record<string, unknown>;
    if (Array.isArray(nested.items)) return nested.items;
  }

  return [];
}

function unwrapObjectValue(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}

function getDossierRoute(targa: string | null): string | null {
  return targa ? `/next/dossier/${encodeURIComponent(targa)}` : "/next/dossiermezzi";
}

function getMezzoId(record: MezzoRecord, index: number): string {
  const rawId = normalizeText(record.id);
  if (rawId) return rawId;
  const targa = normalizeOptionalTarga(record.targa);
  if (targa) return `mezzo:${targa}`;
  return `mezzo:${index}`;
}

function getSessionId(record: SessioneRecord, index: number): string {
  const rawId = normalizeOptionalText(record.id);
  if (rawId) return rawId;
  const badge = normalizeOptionalText(record.badgeAutista ?? record.badge) ?? "no-badge";
  const motrice = normalizeOptionalTarga(record.targaMotrice ?? record.targaCamion) ?? "no-motrice";
  const rimorchio = normalizeOptionalTarga(record.targaRimorchio) ?? "no-rimorchio";
  return `sessione:${badge}:${motrice}:${rimorchio}:${index}`;
}

function normalizePrenotazione(value: unknown): D10PrenotazioneCollaudo | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    data: normalizeOptionalText(record.data),
    ora: normalizeOptionalText(record.ora),
    luogo: normalizeOptionalText(record.luogo),
    note: normalizeOptionalText(record.note),
    esito: normalizeOptionalText(record.esito),
    noteEsito: normalizeOptionalText(record.noteEsito),
    completata: record.completata === true,
    completataIl: normalizeOptionalText(record.completataIl),
  };
}

function normalizePreCollaudo(value: unknown): D10PreCollaudo | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    data: normalizeOptionalText(record.data),
    officina: normalizeOptionalText(record.officina),
  };
}

function normalizeMezzoRecord(record: MezzoRecord, index: number): D10MezzoItem {
  const targa = normalizeOptionalTarga(record.targa);
  const flags: string[] = [];
  if (!targa) flags.push("missing_targa");
  if (!normalizeOptionalText(record.categoria)) flags.push("missing_categoria");
  if (!normalizeOptionalText(record.autistaNome)) flags.push("missing_autista");

  return {
    id: getMezzoId(record, index),
    targa,
    categoria: normalizeOptionalText(record.categoria),
    autistaNome: normalizeOptionalText(record.autistaNome),
    marca: normalizeOptionalText(record.marca),
    modello: normalizeOptionalText(record.modello),
    dataImmatricolazioneTs: toTimestamp(record.dataImmatricolazione),
    dataUltimoCollaudoTs: toTimestamp(record.dataUltimoCollaudo),
    dataScadenzaRevisioneTs: toTimestamp(record.dataScadenzaRevisione),
    prenotazioneCollaudo: normalizePrenotazione(record.prenotazioneCollaudo),
    preCollaudo: normalizePreCollaudo(record.preCollaudo),
    note: normalizeOptionalText(record.note),
    manutenzioneProgrammata: record.manutenzioneProgrammata === true,
    manutenzioneDataFineTs: toTimestamp(record.manutenzioneDataFine),
    sourceDataset: MEZZI_KEY,
    quality: "source_direct",
    flags,
  };
}

function normalizeSessionRecord(record: SessioneRecord, index: number): D10SessionItem {
  const targaMotrice = normalizeOptionalTarga(record.targaMotrice ?? record.targaCamion);
  const targaRimorchio = normalizeOptionalTarga(record.targaRimorchio);
  const flags: string[] = [];
  if (!targaMotrice && !targaRimorchio) flags.push("missing_targa");

  return {
    id: getSessionId(record, index),
    targaMotrice,
    targaRimorchio,
    nomeAutista: normalizeOptionalText(record.nomeAutista ?? record.autistaNome ?? record.autista),
    badgeAutista: normalizeOptionalText(record.badgeAutista ?? record.badge),
    statoSessione: normalizeOptionalText(record.statoSessione ?? record.stato ?? record.sessione),
    timestamp: toTimestamp(record.timestamp),
    sourceDataset: SESSIONI_KEY,
    quality: "source_direct",
    flags,
  };
}

function normalizeStoricoEventoRecord(
  record: StoricoEventoRecord,
  index: number
): D10StoricoEventoItem {
  const prima = unwrapObjectValue(record.prima);
  const dopo = unwrapObjectValue(record.dopo);
  const targaMotricePrima = normalizeOptionalTarga(
    record.primaMotrice ?? prima?.motrice ?? prima?.targaMotrice ?? prima?.targaCamion
  );
  const targaMotriceDopo = normalizeOptionalTarga(
    record.dopoMotrice ?? dopo?.motrice ?? dopo?.targaMotrice ?? dopo?.targaCamion
  );
  const targaRimorchioPrima = normalizeOptionalTarga(
    record.primaRimorchio ?? prima?.rimorchio ?? prima?.targaRimorchio
  );
  const targaRimorchioDopo = normalizeOptionalTarga(
    record.dopoRimorchio ?? dopo?.rimorchio ?? dopo?.targaRimorchio
  );
  const targasCoinvolte = Array.from(
    new Set(
      [
        targaMotricePrima,
        targaMotriceDopo,
        targaRimorchioPrima,
        targaRimorchioDopo,
      ].filter((value): value is string => Boolean(value))
    )
  );
  const timestamp = toTimestamp(record.timestamp);
  const flags: string[] = [];
  if (!timestamp) flags.push("missing_timestamp");
  if (targasCoinvolte.length === 0) flags.push("missing_targa");

  const rawId = normalizeOptionalText(record.id) ?? `evento:${index}`;

  return {
    id: rawId,
    tipo: normalizeOptionalText(record.tipo ?? record.tipoOperativo ?? record.source),
    timestamp,
    luogo: normalizeOptionalText(record.luogo),
    badgeAutista: normalizeOptionalText(record.badgeAutista ?? record.badge),
    nomeAutista: normalizeOptionalText(record.nomeAutista ?? record.autistaNome ?? record.autista),
    statoCarico: normalizeOptionalText(record.statoCarico),
    condizioni: record.condizioni ?? null,
    targaMotricePrima,
    targaMotriceDopo,
    targaRimorchioPrima,
    targaRimorchioDopo,
    targasCoinvolte,
    sourceDataset: EVENTI_KEY,
    sourceRecordId: rawId,
    quality: targasCoinvolte.length > 0 ? "source_direct" : "derived_acceptable",
    flags,
  };
}

function isHighSeverity(value: string): boolean {
  return (
    value.includes("alta") ||
    value.includes("high") ||
    value.includes("urgent") ||
    value.includes("urgente") ||
    value.includes("crit") ||
    value.includes("grave")
  );
}

function isSegnalazioneNuova(record: SegnalazioneRecord): boolean {
  return record.stato === "nuova" || record.letta === false;
}

function isSegnalazioneImportante(record: SegnalazioneRecord): boolean {
  if (record.flagVerifica === true) return true;
  const fields = [
    record.urgenza,
    record.priorita,
    record.gravita,
    record.severity,
    record.livello,
  ];
  return fields.some((value) => isHighSeverity(normalizeFreeText(value).toLowerCase()));
}

function buildSegnalazionePreview(record: SegnalazioneRecord): string {
  const tipo = normalizeFreeText(record.tipoProblema);
  const descrizione = normalizeFreeText(record.descrizione);
  const note = normalizeFreeText(record.note ?? record.messaggio);
  const preview = descrizione || note || tipo || "Segnalazione";
  return truncateText(preview, 96);
}

function normalizeSegnalazioneRecord(
  record: SegnalazioneRecord,
  index: number
): D10SegnalazioneItem {
  const timestamp = toTimestamp(record.timestamp) ?? toTimestamp(record.data);
  const targa = normalizeOptionalTarga(
    record.targa ?? record.targaCamion ?? record.targaRimorchio
  );
  const rawId =
    normalizeOptionalText(record.id) ??
    stableHash32(
      [
        String(timestamp ?? 0),
        targa ?? "",
        normalizeFreeText(record.badgeAutista),
        normalizeFreeText(record.tipoProblema),
        normalizeFreeText(record.descrizione),
        String(index),
      ].join("|")
    );
  const flags: string[] = [];
  if (!timestamp) flags.push("missing_timestamp");
  if (!targa) flags.push("missing_targa");
  if (!isSegnalazioneNuova(record)) flags.push("already_read_or_closed");

  return {
    id: rawId,
    timestamp,
    targa,
    autistaNome: normalizeOptionalText(record.autistaNome ?? record.nomeAutista),
    badgeAutista: normalizeOptionalText(record.badgeAutista),
    tipoProblema: normalizeOptionalText(record.tipoProblema),
    descrizione: normalizeOptionalText(record.descrizione),
    note: normalizeOptionalText(record.note ?? record.messaggio),
    ambito: normalizeOptionalText(record.ambito),
    isNuova: isSegnalazioneNuova(record),
    isImportante: isSegnalazioneImportante(record),
    preview: buildSegnalazionePreview(record),
    sourceDataset: SEGNALAZIONI_KEY,
    sourceRecordId: normalizeOptionalText(record.id) ?? rawId,
    quality: "source_direct",
    flags,
    raw: record,
  };
}

function extractKoItems(record: ControlloRecord): string[] {
  const items: string[] = [];
  const check = record.check;

  if (check && typeof check === "object" && !Array.isArray(check)) {
    Object.entries(check as Record<string, unknown>).forEach(([key, value]) => {
      if (value === false) items.push(String(key).toUpperCase());
    });
  }

  const buckets = [
    record.koList,
    record.koItems,
    record.anomalie,
    record.problemi,
    record.difetti,
    record.errori,
    record.controlliKo,
    record.koDetails,
  ];

  buckets.forEach((bucket) => {
    if (!Array.isArray(bucket)) return;
    bucket.forEach((entry) => {
      if (typeof entry === "string") {
        const trimmed = entry.trim();
        if (trimmed) items.push(trimmed);
        return;
      }

      if (entry && typeof entry === "object") {
        const recordEntry = entry as Record<string, unknown>;
        const label =
          normalizeOptionalText(recordEntry.label) ??
          normalizeOptionalText(recordEntry.nome) ??
          normalizeOptionalText(recordEntry.titolo) ??
          normalizeOptionalText(recordEntry.descrizione) ??
          normalizeOptionalText(recordEntry.name) ??
          normalizeOptionalText(recordEntry.testo);
        if (label) items.push(label);
      }
    });
  });

  return Array.from(new Set(items));
}

function getControlloKoQuality(record: ControlloRecord): D10Quality {
  if (record.ko === true) return "source_direct";
  if (record.ok === false || record.tuttoOk === false || record.outcome === false) {
    return "source_direct";
  }
  if (record.esito === false) return "source_direct";

  const esito = normalizeText(record.esito ?? record.stato ?? record.outcome).toUpperCase();
  if (esito === "KO") return "source_direct";

  const check = record.check;
  if (check && typeof check === "object" && !Array.isArray(check)) {
    if (Object.values(check as Record<string, unknown>).some((value) => value === false)) {
      return "derived_acceptable";
    }
  }

  return extractKoItems(record).length > 0 ? "derived_acceptable" : "excluded_from_v1";
}

function buildControlloPreview(record: ControlloRecord): string {
  const koItems = extractKoItems(record);
  if (koItems.length > 0) {
    return truncateText(`KO: ${koItems.slice(0, 4).join(", ")}`, 96);
  }

  const note = normalizeFreeText(record.note ?? record.dettaglio ?? record.messaggio);
  if (note) return truncateText(note, 96);
  return "Controllo KO";
}

function buildControlloDisplayTarga(record: ControlloRecord): {
  mezzoTarga: string | null;
  motrice: string | null;
  rimorchio: string | null;
  label: string | null;
} {
  const target = normalizeText(record.target).toLowerCase();
  const targaMotrice = normalizeOptionalTarga(record.targaMotrice ?? record.targaCamion);
  const targaRimorchio = normalizeOptionalTarga(record.targaRimorchio);

  if (target === "rimorchio") {
    return {
      mezzoTarga: targaRimorchio ?? targaMotrice,
      motrice: targaMotrice,
      rimorchio: targaRimorchio,
      label: targaRimorchio ?? targaMotrice,
    };
  }

  if (target === "motrice") {
    return {
      mezzoTarga: targaMotrice ?? targaRimorchio,
      motrice: targaMotrice,
      rimorchio: targaRimorchio,
      label: targaMotrice ?? targaRimorchio,
    };
  }

  if (target === "entrambi") {
    const label = [targaMotrice, targaRimorchio].filter(Boolean).join(" + ");
    return {
      mezzoTarga: targaMotrice ?? targaRimorchio,
      motrice: targaMotrice,
      rimorchio: targaRimorchio,
      label: label || targaMotrice || targaRimorchio,
    };
  }

  return {
    mezzoTarga: targaRimorchio ?? targaMotrice,
    motrice: targaMotrice,
    rimorchio: targaRimorchio,
    label: targaRimorchio ?? targaMotrice,
  };
}

function normalizeControlloRecord(record: ControlloRecord, index: number): D10ControlloItem {
  const timestamp = toTimestamp(record.timestamp) ?? toTimestamp(record.data);
  const display = buildControlloDisplayTarga(record);
  const koItems = extractKoItems(record);
  const rawId =
    normalizeOptionalText(record.id) ??
    stableHash32(
      [
        String(timestamp ?? 0),
        display.label ?? "",
        normalizeFreeText(record.badgeAutista ?? record.nomeAutista),
        normalizeFreeText(record.target),
        String(index),
      ].join("|")
    );
  const quality = getControlloKoQuality(record);
  const flags: string[] = [];
  if (!timestamp) flags.push("missing_timestamp");
  if (!display.mezzoTarga) flags.push("missing_targa");
  if (quality !== "excluded_from_v1" && koItems.length === 0) flags.push("ko_inferred_from_status");

  return {
    id: rawId,
    timestamp,
    target: normalizeOptionalText(record.target),
    targaMotrice: display.motrice,
    targaRimorchio: display.rimorchio,
    targaLabel: display.label,
    autistaNome: normalizeOptionalText(record.autistaNome ?? record.nomeAutista),
    badgeAutista: normalizeOptionalText(record.badgeAutista),
    koItems,
    preview: buildControlloPreview(record),
    isKo: quality !== "excluded_from_v1",
    sourceDataset: CONTROLLI_KEY,
    sourceRecordId: normalizeOptionalText(record.id) ?? rawId,
    quality,
    flags,
    raw: record,
  };
}

function getSessionLabel(record: D10SessionItem): string {
  const badgeLabel = record.badgeAutista ? `badge ${record.badgeAutista}` : "badge -";
  const nomeLabel = record.nomeAutista ?? "-";
  return `${badgeLabel} (${nomeLabel})`;
}

function buildHomeEventFromSegnalazione(record: D10SegnalazioneItem): HomeEvent {
  return {
    id: record.id,
    tipo: "segnalazione",
    targa: record.targa,
    autista: record.autistaNome,
    timestamp: record.timestamp ?? 0,
    payload: record.raw,
  };
}

function buildHomeEventFromControllo(record: D10ControlloItem): HomeEvent {
  return {
    id: record.id,
    tipo: "controllo",
    targa: record.targaLabel ?? record.targaMotrice ?? record.targaRimorchio,
    autista: record.autistaNome,
    timestamp: record.timestamp ?? 0,
    payload: record.raw,
  };
}

function buildRevisionItems(mezzi: D10MezzoItem[], now: number): D10RevisionItem[] {
  return mezzi.map((mezzo) => {
    const scadenzaPrimaria =
      mezzo.dataScadenzaRevisioneTs === null ? null : new Date(mezzo.dataScadenzaRevisioneTs);
    const immatricolazione =
      mezzo.dataImmatricolazioneTs === null ? null : new Date(mezzo.dataImmatricolazioneTs);
    const ultimoCollaudo =
      mezzo.dataUltimoCollaudoTs === null ? null : new Date(mezzo.dataUltimoCollaudoTs);
    const computed = scadenzaPrimaria
      ? null
      : calcolaProssimaRevisione(immatricolazione, ultimoCollaudo, now);
    const scadenza = scadenzaPrimaria ?? computed;
    const giorni = giorniDaOggi(scadenza, now);
    const flags = [...mezzo.flags];
    if (!scadenzaPrimaria && computed) flags.push("scadenza_calcolata");

    return {
      id: `revisione:${mezzo.id}`,
      targa: mezzo.targa,
      marca: mezzo.marca,
      modello: mezzo.modello,
      autistaNome: mezzo.autistaNome,
      scadenzaTs: scadenza ? scadenza.getTime() : null,
      giorni,
      classe: giorni !== null && giorni <= 30 ? "deadline-danger" : "",
      prenotazioneCollaudo: mezzo.prenotazioneCollaudo,
      preCollaudo: mezzo.preCollaudo,
      sourceDataset: MEZZI_KEY,
      sourceRecordId: mezzo.id,
      quality: scadenzaPrimaria ? "source_direct" : computed ? "derived_acceptable" : mezzo.quality,
      flags,
      targetRoute: getDossierRoute(mezzo.targa),
    };
  });
}

function buildMissingMezzi(mezzi: D10MezzoItem[]): D10MissingMezzoItem[] {
  return mezzi
    .map((mezzo) => {
      const targa = mezzo.targa ?? "";
      const categoria = mezzo.categoria ?? "";
      const autistaNome = mezzo.autistaNome ?? "";
      const missing = {
        targa: !mezzo.targa,
        categoria: !mezzo.categoria,
        autista: !mezzo.autistaNome,
      };

      return {
        id: mezzo.id,
        targa,
        categoria,
        autistaNome,
        missing,
        quality: "source_direct" as const,
        flags: [...mezzo.flags],
        targetRoute: getDossierRoute(mezzo.targa) ?? "/next/dossiermezzi",
      };
    })
    .filter((mezzo) => mezzo.missing.targa || mezzo.missing.categoria || mezzo.missing.autista)
    .sort((left, right) => {
      if (left.missing.targa !== right.missing.targa) return left.missing.targa ? -1 : 1;
      return left.targa.localeCompare(right.targa);
    });
}

function buildImportantAutistiItems(
  segnalazioni: D10SegnalazioneItem[],
  controlli: D10ControlloItem[]
): D10ImportantAutistiEventItem[] {
  const items: D10ImportantAutistiEventItem[] = [];

  segnalazioni.forEach((record) => {
    if (!record.isImportante) return;
    items.push({
      id: `segnalazione:${record.id}`,
      event: buildHomeEventFromSegnalazione(record),
      ts: record.timestamp ?? 0,
      targa: record.targa ?? "",
      tipo: truncateText(record.tipoProblema ?? "Segnalazione", 40),
      preview: record.preview,
      sourceDataset: record.sourceDataset,
      quality: record.quality,
      flags: [...record.flags],
      targetRoute: getDossierRoute(record.targa),
    });
  });

  controlli.forEach((record) => {
    if (!record.isKo) return;
    items.push({
      id: `controllo:${record.id}`,
      event: buildHomeEventFromControllo(record),
      ts: record.timestamp ?? 0,
      targa: record.targaLabel ?? "",
      tipo: "Controllo KO",
      preview: record.preview,
      sourceDataset: record.sourceDataset,
      quality: record.quality,
      flags: [...record.flags],
      targetRoute: getDossierRoute(record.targaMotrice ?? record.targaRimorchio),
    });
  });

  return items.sort((left, right) => right.ts - left.ts);
}

function isRimorchioCategoria(categoria: string | null): boolean {
  if (!categoria) return false;
  return CATEGORIE_RIMORCHI_HOME_SET.has(categoria.trim().toLowerCase());
}

function buildAssetLocationLists(
  mezzi: D10MezzoItem[],
  sessioni: D10SessionItem[],
  eventi: D10StoricoEventoItem[]
): {
  rimorchiDaMostrare: D10AssetLocationItem[];
  motriciTrattoriDaMostrare: D10AssetLocationItem[];
} {
  const inUsoRimorchio = new Set(
    sessioni
      .map((sessione) => sessione.targaRimorchio)
      .filter((value): value is string => Boolean(value))
  );
  const inUsoMotrice = new Set(
    sessioni
      .map((sessione) => sessione.targaMotrice)
      .filter((value): value is string => Boolean(value))
  );

  const ultimoLuogo = new Map<
    string,
    { timestamp: number | null; luogo: string | null; eventId: string | null; eventIndex: number | null }
  >();

  eventi.forEach((evento, index) => {
    const timestamp = evento.timestamp ?? 0;
    evento.targasCoinvolte.forEach((targa) => {
      const prev = ultimoLuogo.get(targa);
      if (
        !prev ||
        timestamp > (prev.timestamp ?? 0) ||
        (timestamp === (prev.timestamp ?? 0) && index > (prev.eventIndex ?? -1))
      ) {
        ultimoLuogo.set(targa, {
          timestamp: evento.timestamp,
          luogo: evento.luogo,
          eventId: evento.sourceRecordId,
          eventIndex: index,
        });
      }
    });
  });

  const rimorchiDaMostrare: D10AssetLocationItem[] = [];
  const motriciTrattoriDaMostrare: D10AssetLocationItem[] = [];

  mezzi.forEach((mezzo) => {
    const targa = mezzo.targa;
    if (!targa) return;

    const rimorchio = isRimorchioCategoria(mezzo.categoria);
    const inUso = rimorchio ? inUsoRimorchio.has(targa) : inUsoMotrice.has(targa);
    if (inUso) return;

    const luogoInfo = ultimoLuogo.get(targa);
    const luogoRaw = luogoInfo?.luogo ?? "";
    const luogo = luogoRaw || "Luogo non impostato";
    const entry: D10AssetLocationItem = {
      id: `${rimorchio ? "rimorchio" : "motrice"}:${targa}`,
      targa,
      categoria: mezzo.categoria,
      autistaNome: mezzo.autistaNome,
      inUso,
      luogo,
      luogoRaw,
      luogoTimestamp: luogoInfo?.timestamp ?? null,
      luogoEventId: luogoInfo?.eventId ?? null,
      luogoEventIndex: luogoInfo?.eventIndex ?? null,
      statusLabel: rimorchio ? "SGANCIATO" : "LIBERO",
      assetKind: rimorchio ? "rimorchio" : "motrice_o_trattore",
      sourceDataset: `${MEZZI_KEY}+${EVENTI_KEY}`,
      quality: luogoInfo ? "derived_acceptable" : "source_direct",
      flags: luogoInfo ? [] : ["missing_storico_luogo"],
      targetRoute: getDossierRoute(targa) ?? "/next/dossiermezzi",
    };

    if (rimorchio) rimorchiDaMostrare.push(entry);
    else motriciTrattoriDaMostrare.push(entry);
  });

  rimorchiDaMostrare.sort((left, right) => left.targa.localeCompare(right.targa));
  motriciTrattoriDaMostrare.sort((left, right) => left.targa.localeCompare(right.targa));
  return { rimorchiDaMostrare, motriciTrattoriDaMostrare };
}

function getAlertStateForCandidate(
  state: AlertsState,
  candidate: D10BaseAlertCandidate,
  now: number
): {
  visible: boolean;
  ackAt: number | null;
  snoozeUntil: number | null;
  lastShownAt: number | null;
} {
  const item = state.items[candidate.id];
  if (!item || isMetaChanged(item.meta, candidate.meta)) {
    return { visible: true, ackAt: null, snoozeUntil: null, lastShownAt: null };
  }

  if (item.ackAt !== null) {
    return {
      visible: false,
      ackAt: item.ackAt,
      snoozeUntil: item.snoozeUntil,
      lastShownAt: item.lastShownAt,
    };
  }

  if (item.snoozeUntil !== null && now < item.snoozeUntil) {
    return {
      visible: false,
      ackAt: item.ackAt,
      snoozeUntil: item.snoozeUntil,
      lastShownAt: item.lastShownAt,
    };
  }

  return {
    visible: true,
    ackAt: item.ackAt,
    snoozeUntil: item.snoozeUntil,
    lastShownAt: item.lastShownAt,
  };
}

function buildRevisionAlertCandidates(
  revisioni: D10RevisionItem[]
): {
  candidates: D10BaseAlertCandidate[];
  revisioniScadute: number;
  revisioniInScadenza: number;
} {
  const candidates: D10BaseAlertCandidate[] = [];
  let revisioniScadute = 0;
  let revisioniInScadenza = 0;

  revisioni.forEach((item) => {
    if (!item.targa || item.giorni === null || item.giorni > 30) return;
    if (item.prenotazioneCollaudo?.completata) return;

    if (item.giorni < 0) revisioniScadute += 1;
    else revisioniInScadenza += 1;

    const prenData = item.prenotazioneCollaudo?.data;
    const prenOra = item.prenotazioneCollaudo?.ora;
    const prenDateTs = toTimestamp(prenData);
    const prenLabel = prenData
      ? ` | Prenotata ${formatDateLabel(prenDateTs) ?? prenData}${prenOra ? ` ${prenOra}` : ""}`
      : "";
    const targaId = normalizeTargaForAlertId(item.targa);
    const title = item.giorni < 0 ? "Revisione scaduta" : "Revisione in scadenza";
    const detailText = `${item.targa} | ${item.giorni < 0 ? "Scaduta" : "Scade"} ${formatGiorniLabel(
      item.giorni
    )}${item.scadenzaTs ? ` | ${formatDateLabel(item.scadenzaTs)}` : ""}${prenLabel}`;

    candidates.push({
      id: `revisione:${targaId}`,
      kind: "revisione",
      title,
      detailText,
      severity: item.giorni < 0 ? "danger" : "warning",
      quality: item.quality,
      mezzoTarga: item.targa,
      autistaNome: item.autistaNome,
      badgeAutista: null,
      eventTs: null,
      dueTs: item.scadenzaTs,
      dateLabel: formatDateLabel(item.scadenzaTs),
      sourceDataset: item.sourceDataset,
      sourceRecordId: item.sourceRecordId,
      targetRouteKind: "dossier",
      targetRoute: item.targetRoute,
      flags: [...item.flags],
      meta: { type: "revisione", ref: String(item.scadenzaTs ?? "") },
      sortBucket: item.giorni < 0 ? 0 : 1,
      sortValue: item.giorni,
    });
  });

  return { candidates, revisioniScadute, revisioniInScadenza };
}

function buildConflittoAlertCandidates(
  sessioni: D10SessionItem[]
): { candidates: D10BaseAlertCandidate[]; conflittiSessione: number } {
  const motrici = new Map<string, D10SessionItem[]>();
  const rimorchi = new Map<string, D10SessionItem[]>();

  sessioni.forEach((record) => {
    if (record.targaMotrice) {
      const list = motrici.get(record.targaMotrice) ?? [];
      list.push(record);
      motrici.set(record.targaMotrice, list);
    }

    if (record.targaRimorchio) {
      const list = rimorchi.get(record.targaRimorchio) ?? [];
      list.push(record);
      rimorchi.set(record.targaRimorchio, list);
    }
  });

  const candidates: D10BaseAlertCandidate[] = [];

  const pushConflict = (
    scope: "motrice" | "rimorchio",
    targa: string,
    items: D10SessionItem[]
  ) => {
    if (items.length <= 1) return;

    const labels = Array.from(new Set(items.map((entry) => getSessionLabel(entry)))).sort(
      (left, right) => left.localeCompare(right)
    );
    const topTs =
      items
        .map((entry) => entry.timestamp)
        .filter((value): value is number => value !== null)
        .sort((left, right) => right - left)[0] ?? null;

    candidates.push({
      id: `conflitto:${scope}:${targa}`,
      kind: "conflitto_sessione",
      title:
        scope === "motrice" ? "Conflitto agganci (motrice)" : "Conflitto agganci (rimorchio)",
      detailText: `${targa} | In uso da ${labels.length} sessioni | ${truncateText(
        labels.join(", "),
        120
      )}`,
      severity: "danger",
      quality: labels.length > 1 ? "derived_acceptable" : "excluded_from_v1",
      mezzoTarga: targa,
      autistaNome: null,
      badgeAutista: null,
      eventTs: topTs,
      dueTs: null,
      dateLabel: formatDateTimeLabel(topTs),
      sourceDataset: SESSIONI_KEY,
      sourceRecordId: targa,
      targetRouteKind: "dossier",
      targetRoute: getDossierRoute(targa),
      flags: [],
      meta: {
        type: "conflitto",
        ref: `v1:${stableHash32([scope, targa, String(labels.length), labels.join("|")].join("|"))}`,
      },
      sortBucket: 0,
      sortValue: -(topTs ?? 0),
    });
  };

  Array.from(motrici.entries())
    .filter(([, items]) => items.length > 1)
    .forEach(([targa, items]) => pushConflict("motrice", targa, items));

  Array.from(rimorchi.entries())
    .filter(([, items]) => items.length > 1)
    .forEach(([targa, items]) => pushConflict("rimorchio", targa, items));

  return { candidates, conflittiSessione: candidates.length };
}

function buildSegnalazioneAlertCandidates(
  segnalazioni: D10SegnalazioneItem[]
): { candidates: D10BaseAlertCandidate[]; segnalazioniNuove: number } {
  const candidates = segnalazioni
    .filter((record) => record.isNuova)
    .map<D10BaseAlertCandidate>((record) => {
      const targaId = normalizeTargaForAlertId(record.targa);
      const contentSignature = stableHash32(
        [
          String(record.timestamp ?? 0),
          targaId,
          record.badgeAutista ?? "",
          record.tipoProblema ?? "",
          record.descrizione ?? "",
          record.note ?? "",
        ].join("|")
      );

      return {
        id: `segnalazione:${record.id}`,
        kind: "segnalazione_nuova",
        title: record.isImportante
          ? "Segnalazione importante non letta"
          : "Segnalazione non letta",
        detailText: `${record.targa ?? "Senza targa"} | ${
          formatDateTimeLabel(record.timestamp) ?? "Data non disponibile"
        } | ${truncateText(record.tipoProblema ?? "Segnalazione", 48)} | ${record.preview}`,
        severity: "warning",
        quality: record.quality,
        mezzoTarga: record.targa,
        autistaNome: record.autistaNome,
        badgeAutista: record.badgeAutista,
        eventTs: record.timestamp,
        dueTs: null,
        dateLabel: formatDateTimeLabel(record.timestamp),
        sourceDataset: record.sourceDataset,
        sourceRecordId: record.sourceRecordId,
        targetRouteKind: record.targa ? "dossier" : "none",
        targetRoute: getDossierRoute(record.targa),
        flags: [...record.flags],
        meta: {
          type: "segnalazione",
          ref: `v1:${record.timestamp ?? 0}:${contentSignature}`,
        },
        sortBucket: 2,
        sortValue: -(record.timestamp ?? 0),
      };
    })
    .sort((left, right) => (right.eventTs ?? 0) - (left.eventTs ?? 0));

  return { candidates, segnalazioniNuove: candidates.length };
}

function buildImportantEventsAlertCandidate(
  importantItems: D10ImportantAutistiEventItem[]
): D10BaseAlertCandidate | null {
  if (importantItems.length === 0) return null;

  const topItems = importantItems.slice(0, 5);
  const metaRef = stableHash32(
    importantItems.map((item) => `${item.id}:${item.ts || 0}`).join("|")
  );
  const hasKo = importantItems.some((item) => item.event.tipo === "controllo");
  const detailText = topItems
    .map(
      (item) =>
        `${item.targa || "-"} | ${formatDateTimeLabel(item.ts) ?? "-"} | ${item.tipo} | ${item.preview}`
    )
    .join(" || ");

  return {
    id: "autisti-eventi-importanti",
    kind: "eventi_importanti_autisti",
    title: `Eventi importanti autisti (${importantItems.length})`,
    detailText,
    severity: hasKo ? "danger" : "warning",
    quality: "mixed_support",
    mezzoTarga: null,
    autistaNome: null,
    badgeAutista: null,
    eventTs: topItems[0]?.ts ?? null,
    dueTs: null,
    dateLabel: formatDateTimeLabel(topItems[0]?.ts ?? null),
    sourceDataset: `${SEGNALAZIONI_KEY}+${CONTROLLI_KEY}`,
    sourceRecordId: null,
    targetRouteKind: "none",
    targetRoute: null,
    flags: ["aggregated_important_events"],
    meta: { type: "segnalazione", ref: `v1:${metaRef}` },
    sortBucket: 1,
    sortValue: -(topItems[0]?.ts ?? 0),
  };
}

function buildControlloFocusItems(controlli: D10ControlloItem[]): D10FocusItem[] {
  return controlli
    .filter((record) => record.isKo)
    .map<D10FocusItem>((record) => {
      const mezzoTarga = record.targaMotrice ?? record.targaRimorchio;
      return {
        id: `controllo:${record.id}`,
        kind: "controllo_ko",
        title: "Controllo KO",
        detailText: `${record.targaLabel ?? "Senza targa"} | ${
          formatDateTimeLabel(record.timestamp) ?? "Data non disponibile"
        } | ${record.preview}`,
        severity: "danger",
        quality: record.quality,
        mezzoTarga,
        autistaNome: record.autistaNome,
        badgeAutista: record.badgeAutista,
        eventTs: record.timestamp,
        dateLabel: formatDateTimeLabel(record.timestamp),
        sourceDataset: record.sourceDataset,
        sourceRecordId: record.sourceRecordId,
        targetRouteKind: mezzoTarga ? "dossier" : "none",
        targetRoute: getDossierRoute(mezzoTarga),
        flags: [...record.flags],
      };
    })
    .sort((left, right) => (right.eventTs ?? 0) - (left.eventTs ?? 0));
}

function buildMezzoIncompletoFocusItems(missingMezzi: D10MissingMezzoItem[]): D10FocusItem[] {
  return missingMezzi.map((mezzo) => {
    const parts: string[] = [];
    if (mezzo.missing.targa) parts.push("targa");
    if (mezzo.missing.categoria) parts.push("categoria");
    if (mezzo.missing.autista) parts.push("autista");

    return {
      id: `mezzo_incompleto:${(mezzo.id ?? mezzo.targa) || "senza-id"}`,
      kind: "mezzo_incompleto",
      title: "Mezzo incompleto",
      detailText: `${mezzo.targa || "Senza targa"} | Campi mancanti: ${parts.join(", ")}`,
      severity: mezzo.missing.targa ? "danger" : "warning",
      quality: mezzo.quality,
      mezzoTarga: mezzo.targa || null,
      autistaNome: mezzo.autistaNome || null,
      badgeAutista: null,
      eventTs: null,
      dateLabel: null,
      sourceDataset: MEZZI_KEY,
      sourceRecordId: mezzo.id ?? null,
      targetRouteKind: "mezzi",
      targetRoute: mezzo.targetRoute,
      flags: [...mezzo.flags],
    };
  });
}

function sortAlertCandidates(items: D10BaseAlertCandidate[]): D10BaseAlertCandidate[] {
  return [...items].sort((left, right) => {
    if (left.sortBucket !== right.sortBucket) return left.sortBucket - right.sortBucket;
    if (left.sortValue !== right.sortValue) return left.sortValue - right.sortValue;
    return left.title.localeCompare(right.title);
  });
}

export function buildNextCentroControlloSnapshot(input: D10BuildInput): D10Snapshot {
  const now = input.now ?? Date.now();
  const mezzi = unwrapArrayValue(input.mezziRaw)
    .filter((entry): entry is MezzoRecord => Boolean(entry) && typeof entry === "object")
    .map(normalizeMezzoRecord);
  const sessioni = unwrapArrayValue(input.sessioniRaw)
    .filter((entry): entry is SessioneRecord => Boolean(entry) && typeof entry === "object")
    .map(normalizeSessionRecord);
  const eventiStorici = unwrapArrayValue(input.eventiRaw)
    .filter((entry): entry is StoricoEventoRecord => Boolean(entry) && typeof entry === "object")
    .map(normalizeStoricoEventoRecord);
  const segnalazioni = unwrapArrayValue(input.segnalazioniRaw)
    .filter((entry): entry is SegnalazioneRecord => Boolean(entry) && typeof entry === "object")
    .map(normalizeSegnalazioneRecord);
  const controlli = unwrapArrayValue(input.controlliRaw)
    .filter((entry): entry is ControlloRecord => Boolean(entry) && typeof entry === "object")
    .map(normalizeControlloRecord);

  const rawAlertsState = unwrapObjectValue(input.alertsStateRaw);
  const parsedAlertsState = parseAlertsState(rawAlertsState ?? createEmptyAlertsState());

  const revisioni = buildRevisionItems(mezzi, now);
  const revisioniUrgenti = [...revisioni]
    .filter((item) => item.giorni !== null)
    .sort((left, right) => (left.giorni ?? 0) - (right.giorni ?? 0))
    .slice(0, 6);
  const missingMezzi = buildMissingMezzi(mezzi);
  const importantAutistiItems = buildImportantAutistiItems(segnalazioni, controlli);

  const revisioniResult = buildRevisionAlertCandidates(revisioni);
  const conflittiResult = buildConflittoAlertCandidates(sessioni);
  const segnalazioniResult = buildSegnalazioneAlertCandidates(segnalazioni);
  const importantAlert = buildImportantEventsAlertCandidate(importantAutistiItems);
  const allAlertCandidates = sortAlertCandidates([
    ...revisioniResult.candidates,
    ...conflittiResult.candidates,
    ...segnalazioniResult.candidates,
    ...(importantAlert ? [importantAlert] : []),
  ]);

  const candidateAlertIds = new Set(allAlertCandidates.map((item) => item.id));
  const alertsState = pruneAlertsState(parsedAlertsState, now, candidateAlertIds).state;

  const alerts = allAlertCandidates
    .map((candidate) => {
      const state = getAlertStateForCandidate(alertsState, candidate, now);
      if (!state.visible) return null;
      return {
        id: candidate.id,
        kind: candidate.kind,
        title: candidate.title,
        detailText: candidate.detailText,
        meta: candidate.meta,
        severity: candidate.severity,
        quality: candidate.quality,
        mezzoTarga: candidate.mezzoTarga,
        autistaNome: candidate.autistaNome,
        badgeAutista: candidate.badgeAutista,
        eventTs: candidate.eventTs,
        dueTs: candidate.dueTs,
        dateLabel: candidate.dateLabel,
        sourceDataset: candidate.sourceDataset,
        sourceRecordId: candidate.sourceRecordId,
        targetRouteKind: candidate.targetRouteKind,
        targetRoute: candidate.targetRoute,
        flags: candidate.flags,
        ackAt: state.ackAt,
        snoozeUntil: state.snoozeUntil,
        lastShownAt: state.lastShownAt,
      };
    })
    .filter((item): item is D10AlertItem => Boolean(item));

  const focusItems = [
    ...buildControlloFocusItems(controlli),
    ...buildMezzoIncompletoFocusItems(missingMezzi),
  ];
  const assetLocations = buildAssetLocationLists(mezzi, sessioni, eventiStorici);

  return {
    domainCode: NEXT_CENTRO_CONTROLLO_DOMAIN.code,
    domainName: NEXT_CENTRO_CONTROLLO_DOMAIN.name,
    generatedAt: now,
    logicalDatasets: NEXT_CENTRO_CONTROLLO_DOMAIN.logicalDatasets,
    counters: {
      alertsVisible: alerts.length,
      revisioniScadute: revisioniResult.revisioniScadute,
      revisioniInScadenza: revisioniResult.revisioniInScadenza,
      conflittiSessione: conflittiResult.conflittiSessione,
      segnalazioniNuove: segnalazioniResult.segnalazioniNuove,
      controlliKo: controlli.filter((record) => record.isKo).length,
      sessioniAttive: sessioni.length,
      mezziIncompleti: missingMezzi.length,
      eventiImportanti: importantAutistiItems.length,
    },
    mezzi,
    sessioni,
    eventiStorici,
    revisioni,
    revisioniUrgenti,
    alerts,
    focusItems,
    importantAutistiItems,
    rimorchiDaMostrare: assetLocations.rimorchiDaMostrare,
    motriciTrattoriDaMostrare: assetLocations.motriciTrattoriDaMostrare,
    missingMezzi,
    limitations: [
      "Il clone legge direttamente i dataset reali della madre in sola lettura, senza overlay locali Home per alert, mezzi o eventi.",
      "Eventi storici e luoghi mezzo derivano da @storico_eventi_operativi: se il feed non contiene luogo o targa, il limite resta esplicito nel layer.",
      "Alert e focus supportati in D10 riguardano revisioni, conflitti sessione, segnalazioni nuove, eventi autisti importanti, controlli KO e mezzi incompleti.",
      "Richieste attrezzature, gomme, rifornimenti e altri feed legacy restano fuori da questo layer per non introdurre aggregazioni non usate oggi dalla Home clone.",
      "Le sessioni e i controlli KO restano feed operativi legacy: il layer li normalizza e li espone come segnali read-only, senza renderli canonici o scrivibili.",
    ],
  };
}

export function buildNextStatoOperativoSnapshot(input: D10BuildInput): D10Snapshot {
  return buildNextCentroControlloSnapshot(input);
}

export async function readNextCentroControlloSnapshot(
  now: number = Date.now()
): Promise<D10Snapshot> {
  const [
    alertsStateResult,
    mezziResult,
    sessioniResult,
    eventiResult,
    segnalazioniResult,
    controlliResult,
  ] = await Promise.all([
    readNextUnifiedStorageDocument({ key: ALERTS_STATE_KEY }),
    readNextUnifiedStorageDocument({ key: MEZZI_KEY }),
    readNextUnifiedStorageDocument({ key: SESSIONI_KEY }),
    readNextUnifiedStorageDocument({ key: EVENTI_KEY }),
    readNextUnifiedStorageDocument({ key: SEGNALAZIONI_KEY }),
    readNextUnifiedStorageDocument({ key: CONTROLLI_KEY }),
  ]);

  return buildNextCentroControlloSnapshot({
    alertsStateRaw: alertsStateResult.rawDocument,
    mezziRaw: mezziResult.rawDocument,
    sessioniRaw: sessioniResult.rawDocument,
    eventiRaw: eventiResult.rawDocument,
    segnalazioniRaw: segnalazioniResult.rawDocument,
    controlliRaw: controlliResult.rawDocument,
    now,
  });
}

export async function readNextStatoOperativoSnapshot(
  now: number = Date.now()
): Promise<D10Snapshot> {
  return readNextCentroControlloSnapshot(now);
}
