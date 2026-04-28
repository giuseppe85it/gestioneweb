import { readNextUnifiedStorageDocument } from "./nextUnifiedReadRegistryDomain";

type RawRecord = Record<string, unknown>;

const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp" as const;
const CONTROLLI_KEY = "@controlli_mezzo_autisti" as const;
const SEGNALAZIONI_ARRAY_KEYS = ["items", "value", "segnalazioni"] as const;
const CONTROLLI_ARRAY_KEYS = ["items", "value", "controlli"] as const;

export const NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN = {
  code: "D11-MEZ-EVENTI",
  name: "Segnalazioni e controlli completi per mezzo",
  logicalDatasets: [SEGNALAZIONI_KEY, CONTROLLI_KEY] as const,
  activeReadOnlyDatasets: [SEGNALAZIONI_KEY, CONTROLLI_KEY] as const,
} as const;

export type NextMezzoSegnalazioniControlliMatchKind = "exact" | "fuzzy" | "none";

export type NextMezzoSegnalazioneItem = {
  id: string;
  sourceKey: "@segnalazioni_autisti_tmp";
  sourceRecordId: string | null;
  targaRichiesta: string;
  targaMatch: string | null;
  matchKind: NextMezzoSegnalazioniControlliMatchKind;
  targaFields: { targa: string | null; targaCamion: string | null; targaRimorchio: string | null };
  data: string | null;
  timestamp: number | null;
  titolo: string;
  descrizione: string | null;
  categoria: string | null;
  ambito: string | null;
  stato: string | null;
  severita: "info" | "warning" | "critical" | "unknown";
  raw: Record<string, unknown>;
};

export type NextMezzoControlloItem = {
  id: string;
  sourceKey: "@controlli_mezzo_autisti";
  sourceRecordId: string | null;
  targaRichiesta: string;
  targaMatch: string | null;
  matchKind: NextMezzoSegnalazioniControlliMatchKind;
  targaFields: { targa: string | null; targaCamion: string | null; targaRimorchio: string | null };
  data: string | null;
  timestamp: number | null;
  titolo: string;
  descrizione: string | null;
  target: string | null;
  esito: "ok" | "ko" | "unknown";
  note: string | null;
  raw: Record<string, unknown>;
};

export type NextMezzoSegnalazioniControlliCounts = {
  segnalazioniTotali: number; controlliTotali: number; controlliOk: number; controlliKo: number;
  segnalazioniCritical: number; segnalazioniWarning: number; fuzzyMatches: number; unreadableRecords: number;
};

export type NextMezzoSegnalazioniControlliSnapshot = {
  domainCode: "D11-MEZ-EVENTI";
  domainName: "Segnalazioni e controlli completi per mezzo";
  generatedAt: string;
  targa: string;
  targaNormalized: string;
  logicalDatasets: readonly ["@segnalazioni_autisti_tmp", "@controlli_mezzo_autisti"];
  activeReadOnlyDatasets: readonly ["@segnalazioni_autisti_tmp", "@controlli_mezzo_autisti"];
  segnalazioni: NextMezzoSegnalazioneItem[];
  controlli: NextMezzoControlloItem[];
  counts: NextMezzoSegnalazioniControlliCounts;
  timelineItems: NextMezzoSegnalazioniControlliTimelineItem[];
  limitations: string[];
};

export type NextMezzoSegnalazioniControlliTimelineItem = {
  id: string; source: "segnalazione" | "controllo";
  sourceKey: "@segnalazioni_autisti_tmp" | "@controlli_mezzo_autisti";
  timestamp: number | null; data: string | null; title: string;
  subtitle: string | null; detail: string | null; raw: Record<string, unknown>;
};

function normalizeText(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeOptionalText(value: unknown): string | null {
  const normalized = normalizeText(value).replace(/\s+/g, " ");
  return normalized || null;
}

export function normalizeNextSegnalazioniControlliTarga(value: unknown): string {
  return normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function resolveTargaMatch(candidates: Array<string | null>, target: string): {
  value: string | null;
  kind: NextMezzoSegnalazioniControlliMatchKind;
} {
  const normalized = candidates.map((entry) => normalizeNextSegnalazioniControlliTarga(entry));
  const exact = normalized.find((entry) => entry && entry === target);
  if (exact) return { value: exact, kind: "exact" };

  const fuzzy = normalized.find((entry) => entry && isFuzzySameTarga(entry, target));
  return fuzzy ? { value: fuzzy, kind: "fuzzy" } : { value: null, kind: "none" };
}

function isFuzzySameTarga(candidate: string, target: string): boolean {
  if (!candidate || !target || candidate === target) return false;
  if (Math.abs(candidate.length - target.length) > 1) return false;
  const minLength = Math.min(candidate.length, target.length);
  let diff = 0;
  for (let index = 0; index < minLength; index += 1) {
    if (candidate[index] !== target[index]) diff += 1;
    if (diff > 1) return false;
  }
  return true;
}

export function isNextSegnalazioniControlliSameTarga(candidate: unknown, target: unknown): boolean {
  const normalizedCandidate = normalizeNextSegnalazioniControlliTarga(candidate);
  const normalizedTarget = normalizeNextSegnalazioniControlliTarga(target);
  return normalizedCandidate === normalizedTarget || isFuzzySameTarga(normalizedCandidate, normalizedTarget);
}

function toTimestamp(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (value && typeof value === "object" && "toMillis" in value) {
    const toMillis = (value as { toMillis?: unknown }).toMillis;
    if (typeof toMillis === "function") return Number(toMillis.call(value));
  }
  if (value && typeof value === "object" && "seconds" in value) {
    const seconds = Number((value as { seconds?: unknown }).seconds);
    return Number.isFinite(seconds) ? seconds * 1000 : null;
  }
  const raw = normalizeOptionalText(value);
  if (!raw) return null;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveDateValue(record: RawRecord): unknown {
  return record.data ?? record.dataDocumento ?? record.createdAt ?? record.timestamp ?? record.updatedAt;
}

function sortByTimestampDesc<T extends { timestamp: number | null }>(items: T[]): T[] {
  return [...items].sort((left, right) => (right.timestamp ?? -1) - (left.timestamp ?? -1));
}

function rawEntries(
  raw: Record<string, unknown> | unknown[] | null,
  preferredKeys: readonly string[],
): unknown[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  for (const key of preferredKeys) {
    const candidate = raw[key];
    if (Array.isArray(candidate)) return candidate;
  }
  if (Array.isArray(raw.items)) return raw.items;
  const value = raw.value;
  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown[] }).items)) {
    return (value as { items: unknown[] }).items;
  }
  if (Array.isArray(value)) return value;
  return [raw];
}

function sourceRecordId(record: RawRecord): string | null {
  return normalizeOptionalText(record.id ?? record.sourceRecordId ?? record.__docId);
}

function targaFields(record: RawRecord) {
  return {
    targa: normalizeNextSegnalazioniControlliTarga(record.targa) || null,
    targaCamion: normalizeNextSegnalazioniControlliTarga(record.targaCamion ?? record.targaMotrice) || null,
    targaRimorchio: normalizeNextSegnalazioniControlliTarga(record.targaRimorchio) || null,
  };
}

function resolveSegnalazioneSeverity(record: RawRecord): NextMezzoSegnalazioneItem["severita"] {
  const text = normalizeText([record.severita, record.stato, record.tipoProblema, record.categoria].join(" ")).toLowerCase();
  if (/(critical|critico|critica|grave|ko|blocc)/.test(text)) return "critical";
  if (/(warning|attenzione|verifica|nuov)/.test(text)) return "warning";
  if (text) return "info";
  return "unknown";
}

function resolveControlloEsito(record: RawRecord): NextMezzoControlloItem["esito"] {
  if (Array.isArray(record.controlliKo) && record.controlliKo.length > 0) return "ko";
  const text = normalizeText([record.esito, record.stato, record.note].join(" ")).toLowerCase();
  if (/(ko|non ok|problema|errore|failed|fail)/.test(text)) return "ko";
  if (/(ok|positivo|superato|pass)/.test(text)) return "ok";
  return "unknown";
}

function mapSegnalazioni(records: RawRecord[], target: string, limitations: string[]): NextMezzoSegnalazioneItem[] {
  const seen = new Set<string>();
  return sortByTimestampDesc(records.flatMap((record, index) => {
    const id = sourceRecordId(record);
    if (id && seen.has(id)) {
      limitations.push(`Record duplicato ignorato in ${SEGNALAZIONI_KEY}: ${id}.`);
      return [];
    }
    if (id) seen.add(id);
    const fields = targaFields(record);
    const match = resolveTargaMatch([fields.targaCamion, fields.targaRimorchio, fields.targa], target);
    if (match.kind === "none") return [];
    const dataRaw = resolveDateValue(record);
    const tipo = normalizeOptionalText(record.tipoProblema ?? record.tipo ?? record.categoria);
    return [{
      id: id ?? `${SEGNALAZIONI_KEY}:${index}`,
      sourceKey: SEGNALAZIONI_KEY,
      sourceRecordId: id,
      targaRichiesta: target,
      targaMatch: match.value,
      matchKind: match.kind,
      targaFields: fields,
      data: normalizeOptionalText(dataRaw),
      timestamp: toTimestamp(dataRaw),
      titolo: tipo ? `Segnalazione ${tipo}` : "Segnalazione",
      descrizione: normalizeOptionalText(record.descrizione ?? record.note ?? record.testo),
      categoria: normalizeOptionalText(record.categoria ?? record.tipoProblema ?? record.tipo),
      ambito: normalizeOptionalText(record.ambito),
      stato: normalizeOptionalText(record.stato),
      severita: resolveSegnalazioneSeverity(record),
      raw: record,
    }];
  }));
}

function mapControlli(records: RawRecord[], target: string, limitations: string[]): NextMezzoControlloItem[] {
  const seen = new Set<string>();
  return sortByTimestampDesc(records.flatMap((record, index) => {
    const id = sourceRecordId(record);
    if (id && seen.has(id)) {
      limitations.push(`Record duplicato ignorato in ${CONTROLLI_KEY}: ${id}.`);
      return [];
    }
    if (id) seen.add(id);
    const fields = targaFields(record);
    const match = resolveTargaMatch([fields.targaCamion, fields.targaRimorchio, fields.targa], target);
    if (match.kind === "none") return [];
    const dataRaw = resolveDateValue(record);
    return [{
      id: id ?? `${CONTROLLI_KEY}:${index}`,
      sourceKey: CONTROLLI_KEY,
      sourceRecordId: id,
      targaRichiesta: target,
      targaMatch: match.value,
      matchKind: match.kind,
      targaFields: fields,
      data: normalizeOptionalText(dataRaw),
      timestamp: toTimestamp(dataRaw),
      titolo: normalizeOptionalText(record.titolo) ?? "Controllo mezzo",
      descrizione: normalizeOptionalText(record.descrizione ?? record.note),
      target: normalizeOptionalText(record.target),
      esito: resolveControlloEsito(record),
      note: normalizeOptionalText(record.note),
      raw: record,
    }];
  }));
}

function buildTimelineItems(
  segnalazioni: NextMezzoSegnalazioneItem[],
  controlli: NextMezzoControlloItem[],
): NextMezzoSegnalazioniControlliTimelineItem[] {
  return sortByTimestampDesc([
    ...segnalazioni.map((item) => ({
      id: `segnalazione:${item.id}`,
      source: "segnalazione" as const,
      sourceKey: SEGNALAZIONI_KEY,
      timestamp: item.timestamp,
      data: item.data,
      title: item.titolo,
      subtitle: item.descrizione,
      detail: item.ambito ? `Ambito: ${item.ambito}` : item.stato,
      raw: item.raw,
    })),
    ...controlli.map((item) => ({
      id: `controllo:${item.id}`,
      source: "controllo" as const,
      sourceKey: CONTROLLI_KEY,
      timestamp: item.timestamp,
      data: item.data,
      title: item.titolo,
      subtitle: item.target ? `Target: ${item.target}` : item.descrizione,
      detail: item.note,
      raw: item.raw,
    })),
  ]);
}

export async function readNextMezzoSegnalazioniControlliSnapshot(
  targa: string,
): Promise<NextMezzoSegnalazioniControlliSnapshot> {
  const targaNormalized = normalizeNextSegnalazioniControlliTarga(targa);
  const limitations: string[] = [];
  if (!targaNormalized) {
    limitations.push("Targa non valida o assente.");
  }

  const [segnalazioniRead, controlliRead] = await Promise.all([
    readNextUnifiedStorageDocument({ key: SEGNALAZIONI_KEY, preferredArrayKeys: [...SEGNALAZIONI_ARRAY_KEYS] }),
    readNextUnifiedStorageDocument({ key: CONTROLLI_KEY, preferredArrayKeys: [...CONTROLLI_ARRAY_KEYS] }),
  ]);

  for (const result of [segnalazioniRead, controlliRead]) {
    if (result.status !== "ready") limitations.push(`${result.sourceId}: ${result.notes.join(" ") || "fonte non leggibile"}.`);
    if (result.datasetShape === "object" && result.records.length > 0) {
      limitations.push(`${result.sourceId}: shape oggetto usata come singolo record leggibile.`);
    }
  }

  const unreadableRecords =
    rawEntries(segnalazioniRead.rawDocument, SEGNALAZIONI_ARRAY_KEYS).filter((entry) => !entry || typeof entry !== "object" || Array.isArray(entry)).length +
    rawEntries(controlliRead.rawDocument, CONTROLLI_ARRAY_KEYS).filter((entry) => !entry || typeof entry !== "object" || Array.isArray(entry)).length;
  if (unreadableRecords > 0) limitations.push(`${unreadableRecords} record non oggetto ignorati.`);

  const segnalazioni = targaNormalized ? mapSegnalazioni(segnalazioniRead.records, targaNormalized, limitations) : [];
  const controlli = targaNormalized ? mapControlli(controlliRead.records, targaNormalized, limitations) : [];
  const timelineItems = buildTimelineItems(segnalazioni, controlli);

  return {
    domainCode: NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN.code,
    domainName: NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN.name,
    generatedAt: new Date().toISOString(),
    targa,
    targaNormalized,
    logicalDatasets: NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN.logicalDatasets,
    activeReadOnlyDatasets: NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN.activeReadOnlyDatasets,
    segnalazioni,
    controlli,
    counts: {
      segnalazioniTotali: segnalazioni.length,
      controlliTotali: controlli.length,
      controlliOk: controlli.filter((item) => item.esito === "ok").length,
      controlliKo: controlli.filter((item) => item.esito === "ko").length,
      segnalazioniCritical: segnalazioni.filter((item) => item.severita === "critical").length,
      segnalazioniWarning: segnalazioni.filter((item) => item.severita === "warning").length,
      fuzzyMatches: [...segnalazioni, ...controlli].filter((item) => item.matchKind === "fuzzy").length,
      unreadableRecords,
    },
    timelineItems,
    limitations,
  };
}
