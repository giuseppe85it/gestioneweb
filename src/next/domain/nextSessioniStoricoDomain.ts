import { getItemSync } from "../../utils/storageSync";

const STORICO_EVENTI_KEY = "@storico_eventi_operativi";
const SESSIONI_ATTIVE_KEY = "@autisti_sessione_attive";

export type NextSessioneStoricoEventTipo =
  | "INIZIO_ASSETTO"
  | "CAMBIO_ASSETTO"
  | string;

export type NextSessioneStoricoAssetto = {
  targaMotrice: string | null;
  targaRimorchio: string | null;
};

export type NextSessioneStoricoEvent = {
  id: string;
  tipo: NextSessioneStoricoEventTipo;
  timestamp: number;
  autistaNome: string | null;
  badgeAutista: string | null;
  prima: NextSessioneStoricoAssetto;
  dopo: NextSessioneStoricoAssetto;
  luogo: string | null;
  statoCarico: string | null;
};

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toTargaUpper(value: unknown): string | null {
  const t: string | null = toText(value);
  return t ? t.toUpperCase() : null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed: number = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readAssettoBlock(raw: unknown): NextSessioneStoricoAssetto {
  if (!isRecord(raw)) {
    return { targaMotrice: null, targaRimorchio: null };
  }
  const motrice: string | null =
    toTargaUpper(raw.targaMotrice) ?? toTargaUpper(raw.motrice);
  const rimorchio: string | null =
    toTargaUpper(raw.targaRimorchio) ?? toTargaUpper(raw.rimorchio);
  return { targaMotrice: motrice, targaRimorchio: rimorchio };
}

function normalizeEvent(record: RawRecord, index: number): NextSessioneStoricoEvent | null {
  const ts: number | null = toNumber(record.timestamp);
  if (ts === null) return null;
  const id: string = toText(record.id) ?? `evt:${ts}:${index}`;
  const tipo: string = toText(record.tipo) ?? "EVENTO";
  return {
    id,
    tipo,
    timestamp: ts,
    autistaNome: toText(record.nomeAutista) ?? toText(record.autistaNome) ?? toText(record.autista),
    badgeAutista: toText(record.badgeAutista),
    prima: readAssettoBlock(record.prima),
    dopo: readAssettoBlock(record.dopo),
    luogo: toText(record.luogo),
    statoCarico: toText(record.statoCarico),
  };
}

function matchesTarga(event: NextSessioneStoricoEvent, targaUp: string): boolean {
  return (
    event.prima.targaMotrice === targaUp ||
    event.prima.targaRimorchio === targaUp ||
    event.dopo.targaMotrice === targaUp ||
    event.dopo.targaRimorchio === targaUp
  );
}

export async function readNextSessioniStoricoPerTarga(
  targa: string,
): Promise<NextSessioneStoricoEvent[]> {
  const targaUp: string = String(targa ?? "").trim().toUpperCase();
  if (!targaUp) return [];
  const raw: unknown = await getItemSync(STORICO_EVENTI_KEY);
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.value)
      ? raw.value
      : [];
  const events: NextSessioneStoricoEvent[] = [];
  list.forEach((entry: unknown, index: number) => {
    if (!isRecord(entry)) return;
    const normalized: NextSessioneStoricoEvent | null = normalizeEvent(entry, index);
    if (!normalized) return;
    if (!matchesTarga(normalized, targaUp)) return;
    events.push(normalized);
  });
  events.sort(
    (a: NextSessioneStoricoEvent, b: NextSessioneStoricoEvent) =>
      b.timestamp - a.timestamp,
  );
  return events;
}

// Sessione attiva (chi sta usando il mezzo ADESSO) per una targa: legge la lista
// @autisti_sessione_attive e trova la sessione con motrice o rimorchio = targa.
// Sola lettura, nessuna scrittura.
export type NextSessioneAttiva = {
  nomeAutista: string | null;
  badgeAutista: string | null;
  targaMotrice: string | null;
  targaRimorchio: string | null;
  timestamp: number | null;
};

export async function readNextSessioneAttivaPerTarga(
  targa: string,
): Promise<NextSessioneAttiva | null> {
  const targaUp: string = String(targa ?? "").trim().toUpperCase();
  if (!targaUp) return null;
  const raw: unknown = await getItemSync(SESSIONI_ATTIVE_KEY);
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : isRecord(raw) && Array.isArray(raw.value)
      ? raw.value
      : [];
  for (const entry of list) {
    if (!isRecord(entry)) continue;
    const motrice: string | null =
      toTargaUpper(entry.targaMotrice) ?? toTargaUpper(entry.targaCamion) ?? toTargaUpper(entry.motrice);
    const rimorchio: string | null =
      toTargaUpper(entry.targaRimorchio) ?? toTargaUpper(entry.rimorchio);
    if (motrice === targaUp || rimorchio === targaUp) {
      return {
        nomeAutista: toText(entry.nomeAutista) ?? toText(entry.autistaNome) ?? toText(entry.autista),
        badgeAutista: toText(entry.badgeAutista) ?? toText(entry.badge),
        targaMotrice: motrice,
        targaRimorchio: rimorchio,
        timestamp: toNumber(entry.timestamp),
      };
    }
  }
  return null;
}
