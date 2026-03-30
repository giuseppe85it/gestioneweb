/* eslint-disable @typescript-eslint/no-explicit-any */
import { getItemSync } from "./nextAutistiStorageSync";

export type HomeEvent = {
  id: string;
  tipo:
    | "rifornimento"
    | "segnalazione"
    | "controllo"
    | "cambio_mezzo"
    | "richiesta_attrezzature"
    | "gomme";
  targa: string | null;
  autista: string | null;
  timestamp: number;
  payload: any;
};

export type RimorchioStatus = {
  targa: string;
  stato: "AGGANCIATO" | "LIBERO";
  colore: "green" | "red";
  autista: string | null;
  motrice: string | null;
  luogo: string | null;
  statoCarico: string | null;
  timestamp: number;
};

export type ActiveSession = {
  badgeAutista: string;
  nomeAutista: string;
  targaMotrice: string | null;
  targaRimorchio: string | null;
  timestamp: number | null;
};

const KEY_RIFORNIMENTI = "@rifornimenti_autisti_tmp";
const KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp";
const KEY_CONTROLLI = "@controlli_mezzo_autisti";
const KEY_RICHIESTE_ATTREZZATURE = "@richieste_attrezzature_autisti_tmp";
const KEY_GOMME = "@cambi_gomme_autisti_tmp";
const KEY_SESSIONI = "@autisti_sessione_attive";
const KEY_STORICO_EVENTI_OPERATIVI = "@storico_eventi_operativi";
const CAMBIO_ASSETTO_TIPO = "CAMBIO_ASSETTO";

function genId() {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toTs(value: any): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object" && typeof value.toMillis === "function") {
    const parsed = value.toMillis();
    return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStrOrNull(value: any): string | null {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

function isSameDay(ts: number, day: Date) {
  const date = new Date(ts);
  return (
    date.getFullYear() === day.getFullYear()
    && date.getMonth() === day.getMonth()
    && date.getDate() === day.getDate()
  );
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object" && Array.isArray((value as { value?: unknown[] }).value)) {
    return (value as { value: T[] }).value;
  }

  return [];
}

export async function loadHomeEvents(day: Date): Promise<HomeEvent[]> {
  const events: HomeEvent[] = [];
  const gommeEvents: HomeEvent[] = [];

  const rifornimenti = asArray<any>((await getItemSync(KEY_RIFORNIMENTI)) ?? []);
  for (const record of rifornimenti) {
    const ts = toTs(record?.timestamp ?? record?.data);
    if (!ts || !isSameDay(ts, day)) continue;
    const targaFallback =
      record?.targaCamion ?? record?.targaMotrice ?? record?.mezzoTarga ?? record?.targa ?? "-";
    events.push({
      id: record?.id ?? genId(),
      tipo: "rifornimento",
      targa: targaFallback ? String(targaFallback) : "-",
      autista: record?.autistaNome ?? record?.nomeAutista ?? null,
      timestamp: ts,
      payload: record,
    });
  }

  const segnalazioni = asArray<any>((await getItemSync(KEY_SEGNALAZIONI)) ?? []);
  for (const record of segnalazioni) {
    const ts = toTs(record?.timestamp ?? record?.data);
    if (!ts || !isSameDay(ts, day)) continue;
    events.push({
      id: record?.id ?? genId(),
      tipo: "segnalazione",
      targa: record?.targa ?? null,
      autista: record?.autistaNome ?? record?.nomeAutista ?? null,
      timestamp: ts,
      payload: record,
    });
  }

  const controlli = asArray<any>((await getItemSync(KEY_CONTROLLI)) ?? []);
  for (const record of controlli) {
    const ts = toTs(record?.timestamp);
    if (!ts || !isSameDay(ts, day)) continue;

    const target = String(record?.target ?? "").toLowerCase();
    const targaMotrice = record?.targaMotrice ?? record?.targaCamion ?? null;
    const targaRimorchio = record?.targaRimorchio ?? null;

    let targa: string | null = null;
    if (target === "rimorchio") targa = targaRimorchio ? String(targaRimorchio) : null;
    else if (target === "motrice") targa = targaMotrice ? String(targaMotrice) : null;
    else if (target === "entrambi") {
      const motrice = targaMotrice ? String(targaMotrice) : "";
      const rimorchio = targaRimorchio ? String(targaRimorchio) : "";
      targa = motrice && rimorchio ? `${motrice} + ${rimorchio}` : motrice || rimorchio || null;
    } else {
      targa = targaRimorchio ?? targaMotrice ? String(targaRimorchio ?? targaMotrice) : null;
    }

    events.push({
      id: record?.id ?? genId(),
      tipo: "controllo",
      targa,
      autista: record?.autistaNome ?? record?.nomeAutista ?? null,
      timestamp: ts,
      payload: record,
    });
  }

  const richieste = asArray<any>((await getItemSync(KEY_RICHIESTE_ATTREZZATURE)) ?? []);
  for (const record of richieste) {
    const ts = toTs(record?.timestamp ?? record?.data);
    if (!ts || !isSameDay(ts, day)) continue;
    events.push({
      id: record?.id ?? genId(),
      tipo: "richiesta_attrezzature",
      targa: record?.targa ?? null,
      autista: record?.autistaNome ?? record?.nomeAutista ?? null,
      timestamp: ts,
      payload: record,
    });
  }

  const gomme = asArray<any>((await getItemSync(KEY_GOMME)) ?? []);
  for (const record of gomme) {
    const ts = toTs(record?.data ?? record?.timestamp);
    if (!ts || !isSameDay(ts, day)) continue;
    const targa =
      record?.targetTarga ?? record?.targa ?? record?.targaCamion ?? record?.targaRimorchio ?? null;
    const autista = record?.autista?.nome ?? record?.autistaNome ?? record?.nomeAutista ?? null;
    const event: HomeEvent = {
      id: record?.id ?? genId(),
      tipo: "gomme",
      targa: targa ? String(targa) : null,
      autista: autista ? String(autista) : null,
      timestamp: ts,
      payload: record,
    };
    events.push(event);
    gommeEvents.push(event);
  }

  const operativi = asArray<any>((await getItemSync(KEY_STORICO_EVENTI_OPERATIVI)) ?? []);
  for (const record of operativi) {
    const tipo = String(record?.tipo ?? record?.tipoOperativo ?? "");
    if (tipo !== CAMBIO_ASSETTO_TIPO) continue;

    const ts = toTs(record?.timestamp);
    if (!ts || !isSameDay(ts, day)) continue;

    const primaMotrice = toStrOrNull(
      record?.prima?.motrice ?? record?.prima?.targaMotrice ?? record?.prima?.targaCamion,
    );
    const dopoMotrice = toStrOrNull(
      record?.dopo?.motrice ?? record?.dopo?.targaMotrice ?? record?.dopo?.targaCamion,
    );
    const primaRimorchio = toStrOrNull(record?.prima?.rimorchio ?? record?.prima?.targaRimorchio);
    const dopoRimorchio = toStrOrNull(record?.dopo?.rimorchio ?? record?.dopo?.targaRimorchio);
    const badge = toStrOrNull(record?.badgeAutista ?? record?.badge);
    const autista = toStrOrNull(record?.autista ?? record?.autistaNome ?? record?.nomeAutista);
    const luogo = toStrOrNull(record?.luogo);
    const condizioni = record?.condizioni ?? null;
    const statoCarico = record?.statoCarico ?? null;
    const targa = toStrOrNull(dopoMotrice ?? dopoRimorchio ?? primaMotrice ?? primaRimorchio);

    events.push({
      id: record?.id ?? genId(),
      tipo: "cambio_mezzo",
      targa: targa ?? null,
      autista: autista ?? null,
      timestamp: ts,
      payload: {
        tipo,
        primaMotrice: primaMotrice ?? null,
        dopoMotrice: dopoMotrice ?? null,
        primaRimorchio: primaRimorchio ?? null,
        dopoRimorchio: dopoRimorchio ?? null,
        badgeAutista: badge ?? null,
        autista: autista ?? null,
        luogo: luogo ?? null,
        statoCarico,
        condizioni,
        timestamp: ts,
      },
    });
  }

  const sorted = events.sort((left, right) => right.timestamp - left.timestamp);
  const sortedGomme = gommeEvents.sort((left, right) => right.timestamp - left.timestamp);
  (sorted as HomeEvent[] & { gomme?: HomeEvent[] }).gomme = sortedGomme;
  return sorted;
}

export async function loadActiveSessions(): Promise<ActiveSession[]> {
  const list = asArray<any>((await getItemSync(KEY_SESSIONI)) ?? []);

  const sessions: ActiveSession[] = list.map((session) => ({
    badgeAutista: session?.badgeAutista ? String(session.badgeAutista) : String(session?.badge ?? ""),
    nomeAutista:
      session?.nomeAutista
        ? String(session.nomeAutista)
        : String(session?.autistaNome ?? session?.autista ?? ""),
    targaMotrice:
      session?.targaMotrice
        ? String(session.targaMotrice)
        : String(session?.targaCamion ?? "") || null,
    targaRimorchio: session?.targaRimorchio ? String(session.targaRimorchio) : null,
    timestamp: toTs(session?.timestamp) ?? null,
  }));

  return sessions.sort((left, right) => {
    if (left.timestamp == null && right.timestamp == null) return 0;
    if (left.timestamp == null) return 1;
    if (right.timestamp == null) return -1;
    return right.timestamp - left.timestamp;
  });
}

export async function loadRimorchiStatus(): Promise<RimorchioStatus[]> {
  const sessioni = asArray<any>((await getItemSync(KEY_SESSIONI)) ?? []);
  const items: RimorchioStatus[] = [];

  for (const sessione of sessioni) {
    if (!sessione?.targaRimorchio) continue;

    items.push({
      targa: String(sessione.targaRimorchio),
      stato: "AGGANCIATO",
      colore: "green",
      autista: sessione?.nomeAutista ?? sessione?.autistaNome ?? sessione?.autista ?? null,
      motrice: sessione?.targaMotrice ?? null,
      luogo: null,
      statoCarico: null,
      timestamp: toTs(sessione?.timestamp) ?? 0,
    });
  }

  return items.sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0));
}
