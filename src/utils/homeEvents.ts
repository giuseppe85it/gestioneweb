import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../firebase";
import { getItemSync } from "./storageSync";

export type HomeEvent = {
  id: string;
  tipo:
    | "rifornimento"
    | "segnalazione"
    | "controllo"
    | "cambio_mezzo"
    | "richiesta_attrezzature";
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

type FirestoreAutistiEvento = {
  tipo?: string;
  autistaNome?: string;
  badgeAutista?: string;
  targaMotrice?: string | null;
  targaRimorchio?: string | null;
  luogo?: string | null;
  statoCarico?: string | null;
  condizioni?: string | null;
  timestamp?: number;
  createdAt?: any;
};

const KEY_RIFORNIMENTI = "@rifornimenti_autisti_tmp";
const KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp";
const KEY_CONTROLLI = "@controlli_mezzo_autisti";
const KEY_RICHIESTE_ATTREZZATURE = "@richieste_attrezzature_autisti_tmp";
const KEY_CAMBI_MOTRICE = "@storico_cambi_motrice";
const KEY_SGANCIO_RIMORCHI = "@storico_sganci_rimorchi";
const KEY_SESSIONI = "@autisti_sessione_attive";
const KEY_STORICO_EVENTI_OPERATIVI = "@storico_eventi_operativi";

function genId() {
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toTs(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  if (v && typeof v === "object") {
    if (typeof v.toMillis === "function") {
      const t = v.toMillis();
      return typeof t === "number" && Number.isFinite(t) ? t : null;
    }
  }
  return null;
}

function toStrOrNull(v: any): string | null {
  if (v === undefined || v === null || v === "") return null;
  return String(v);
}

function normKey(v: any): string {
  return toStrOrNull(v)?.trim().toUpperCase() ?? "";
}

function isSameDay(ts: number, day: Date): boolean {
  const d = new Date(ts);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

export async function loadHomeEvents(day: Date): Promise<HomeEvent[]> {
  const events: HomeEvent[] = [];

  const rifornimenti = (await getItemSync(KEY_RIFORNIMENTI)) || [];
  if (Array.isArray(rifornimenti)) {
    for (const r of rifornimenti) {
      const ts = toTs(r?.timestamp ?? r?.data);
      if (!ts || !isSameDay(ts, day)) continue;
      events.push({
        id: r.id ?? genId(),
        tipo: "rifornimento",
        targa: r.targa ?? null,
        autista: r.autistaNome ?? r.nomeAutista ?? null,
        timestamp: ts,
        payload: r,
      });
    }
  }

  const segnalazioni = (await getItemSync(KEY_SEGNALAZIONI)) || [];
  if (Array.isArray(segnalazioni)) {
    for (const s of segnalazioni) {
      const ts = toTs(s?.timestamp ?? s?.data);
      if (!ts || !isSameDay(ts, day)) continue;
      events.push({
        id: s.id ?? genId(),
        tipo: "segnalazione",
        targa: s.targa ?? null,
        autista: s.autistaNome ?? s.nomeAutista ?? null,
        timestamp: ts,
        payload: s,
      });
    }
  }

  const controlli = (await getItemSync(KEY_CONTROLLI)) || [];
  if (Array.isArray(controlli)) {
    for (const c of controlli) {
      const ts = toTs(c?.timestamp);
      if (!ts || !isSameDay(ts, day)) continue;

      const target = String(c?.target ?? "").toLowerCase();
      const targaMotrice = c?.targaMotrice ?? c?.targaCamion ?? null;
      const targaRimorchio = c?.targaRimorchio ?? null;

      let targa: string | null = null;
      if (target === "rimorchio") targa = targaRimorchio ? String(targaRimorchio) : null;
      else if (target === "motrice") targa = targaMotrice ? String(targaMotrice) : null;
      else if (target === "entrambi") {
        const a = targaMotrice ? String(targaMotrice) : "";
        const b = targaRimorchio ? String(targaRimorchio) : "";
        targa = a && b ? `${a} + ${b}` : a || b || null;
      } else {
        targa = (targaRimorchio ?? targaMotrice)
          ? String(targaRimorchio ?? targaMotrice)
          : null;
      }

      events.push({
        id: c.id ?? genId(),
        tipo: "controllo",
        targa,
        autista: c.autistaNome ?? c.nomeAutista ?? null,
        timestamp: ts,
        payload: c,
      });
    }
  }

  const richieste = (await getItemSync(KEY_RICHIESTE_ATTREZZATURE)) || [];
  if (Array.isArray(richieste)) {
    for (const r of richieste) {
      const ts = toTs(r?.timestamp ?? r?.data);
      if (!ts || !isSameDay(ts, day)) continue;
      events.push({
        id: r.id ?? genId(),
        tipo: "richiesta_attrezzature",
        targa: r.targa ?? null,
        autista: r.autistaNome ?? r.nomeAutista ?? null,
        timestamp: ts,
        payload: r,
      });
    }
  }

  const cambiMezzoEvents: HomeEvent[] = [];
  const completiIndex: Array<{
    badge: string;
    timestamp: number;
    primaMotrice: string;
    dopoMotrice: string;
  }> = [];
  const dedupWindowMs = 5 * 60 * 1000;

  const operativi = (await getItemSync(KEY_STORICO_EVENTI_OPERATIVI)) || [];
  if (Array.isArray(operativi)) {
    for (const evt of operativi) {
      const tipo = String(evt?.tipo ?? evt?.tipoOperativo ?? "");
      if (tipo !== "CAMBIO_MEZZO") continue;

      const ts = toTs(evt?.timestamp);
      if (!ts || !isSameDay(ts, day)) continue;

      const primaMotrice =
        toStrOrNull(evt?.prima?.motrice ?? evt?.prima?.targaMotrice ?? evt?.prima?.targaCamion) ??
        null;
      const dopoMotrice =
        toStrOrNull(evt?.dopo?.motrice ?? evt?.dopo?.targaMotrice ?? evt?.dopo?.targaCamion) ??
        null;
      const primaRimorchio =
        toStrOrNull(evt?.prima?.rimorchio ?? evt?.prima?.targaRimorchio) ?? null;
      const dopoRimorchio =
        toStrOrNull(evt?.dopo?.rimorchio ?? evt?.dopo?.targaRimorchio) ?? null;

      if (!dopoMotrice && !dopoRimorchio) continue;

      const badge = toStrOrNull(evt?.badgeAutista ?? evt?.badge) ?? null;
      const autista = toStrOrNull(evt?.autistaNome ?? evt?.nomeAutista) ?? null;
      const luogo = toStrOrNull(evt?.luogo) ?? null;
      const condizioni = evt?.condizioni ?? null;
      const statoCarico = evt?.statoCarico ?? null;
      const targa =
        toStrOrNull(dopoMotrice ?? primaMotrice ?? dopoRimorchio ?? primaRimorchio) ?? null;

      cambiMezzoEvents.push({
        id: evt?.id ?? genId(),
        tipo: "cambio_mezzo",
        targa,
        autista,
        timestamp: ts,
        payload: {
          primaMotrice,
          dopoMotrice,
          primaRimorchio,
          dopoRimorchio,
          badgeAutista: badge,
          autista,
          luogo,
          statoCarico,
          condizioni,
          timestamp: ts,
          source: "storico",
          raw: evt,
        },
      });

      const badgeKey = normKey(badge);
      const primaKey = normKey(primaMotrice);
      const dopoKey = normKey(dopoMotrice);
      if (badgeKey) {
        completiIndex.push({
          badge: badgeKey,
          timestamp: ts,
          primaMotrice: primaKey,
          dopoMotrice: dopoKey,
        });
      }
    }
  }

  const cambiMotrice = (await getItemSync(KEY_CAMBI_MOTRICE)) || [];
  if (Array.isArray(cambiMotrice)) {
    for (const m of cambiMotrice) {
      const ts = toTs(m?.timestampCambio);
      if (!ts || !isSameDay(ts, day)) continue;

      const badge = toStrOrNull(m?.badgeAutista ?? m?.badge) ?? null;
      const autista = toStrOrNull(m?.autista ?? m?.nomeAutista) ?? null;
      const targaLegacy = toStrOrNull(m?.targaMotrice ?? m?.targaCamion) ?? null;

      const badgeKey = normKey(badge);
      const targaKey = normKey(targaLegacy);
      const hasComplete =
        !!badgeKey &&
        !!targaKey &&
        completiIndex.some(
          (c) =>
            c.badge === badgeKey &&
            Math.abs(ts - c.timestamp) <= dedupWindowMs &&
            (targaKey === c.primaMotrice || targaKey === c.dopoMotrice)
        );

      if (hasComplete) continue;

      const luogo = toStrOrNull(m?.luogo) ?? null;
      const condizioni = m?.condizioni ?? null;
      const statoCarico = m?.statoCarico ?? null;

      cambiMezzoEvents.push({
        id: m.id ?? genId(),
        tipo: "cambio_mezzo",
        targa: targaLegacy,
        autista,
        timestamp: ts,
        payload: {
          primaMotrice: targaLegacy,
          dopoMotrice: null,
          primaRimorchio: null,
          dopoRimorchio: null,
          badgeAutista: badge,
          autista,
          luogo,
          statoCarico,
          condizioni,
          timestamp: ts,
          source: "legacy",
          raw: m,
        },
      });
    }
  }

  events.push(...cambiMezzoEvents);

  const fs = await loadFirestoreAutistiEventi(day).catch(() => []);
  events.push(...fs);

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

export async function loadFirestoreAutistiEventi(day: Date): Promise<HomeEvent[]> {
  const snapshot = await getDocs(query(collection(db, "autisti_eventi")));
  const events: HomeEvent[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data() as FirestoreAutistiEvento;
    const ts = toTs(data?.timestamp);
    if (!ts || !isSameDay(ts, day)) return;

    const fsTipo = data?.tipo ? String(data.tipo) : "";
    let targa: string | null = null;
    if (fsTipo === "CAMBIO_MOTRICE") {
      targa = data.targaMotrice ?? null;
    } else if (fsTipo === "SGANCIO_RIMORCHIO" || fsTipo === "AGGANCIO_RIMORCHIO") {
      targa = data.targaRimorchio ?? data.targaMotrice ?? null;
    } else {
      targa = data.targaRimorchio ?? data.targaMotrice ?? null;
    }

    events.push({
      id: docSnap.id,
      tipo: "cambio_mezzo",
      targa,
      autista: data.autistaNome ?? null,
      timestamp: ts,
      payload: { ...data, fsTipo, source: "firestore_autisti_eventi" },
    });
  });

  return events;
}

export async function loadActiveSessions(): Promise<ActiveSession[]> {
  const raw = (await getItemSync(KEY_SESSIONI)) || [];
  const list = Array.isArray(raw)
    ? raw
    : raw?.value && Array.isArray(raw.value)
    ? raw.value
    : [];

  const sessions: ActiveSession[] = [];
  for (const s of list) {
    const badge = s?.badgeAutista ?? s?.badge ?? "";
    const nome = s?.nomeAutista ?? s?.autistaNome ?? s?.autista ?? "";
    const targaMotrice = s?.targaMotrice ?? s?.targaCamion ?? null;
    const targaRimorchio = s?.targaRimorchio ?? null;
    const timestamp = toTs(s?.timestamp) ?? null;

    sessions.push({
      badgeAutista: badge ? String(badge) : "",
      nomeAutista: nome ? String(nome) : "",
      targaMotrice: targaMotrice ? String(targaMotrice) : null,
      targaRimorchio: targaRimorchio ? String(targaRimorchio) : null,
      timestamp,
    });
  }

  return sessions.sort((a, b) => {
    if (a.timestamp == null && b.timestamp == null) return 0;
    if (a.timestamp == null) return 1;
    if (b.timestamp == null) return -1;
    return b.timestamp - a.timestamp;
  });
}

export async function loadRimorchiStatus(): Promise<RimorchioStatus[]> {
  const sessioni = (await getItemSync(KEY_SESSIONI)) || [];
  const sganci = (await getItemSync(KEY_SGANCIO_RIMORCHI)) || [];

  const risultati: RimorchioStatus[] = [];
  const inUso = new Set<string>();

  if (Array.isArray(sessioni)) {
    for (const s of sessioni) {
      if (!s?.targaRimorchio) continue;

      const targa = String(s.targaRimorchio);
      inUso.add(targa);

      risultati.push({
        targa,
        stato: "AGGANCIATO",
        colore: "green",
        autista: s.nomeAutista ?? s.autistaNome ?? s.autista ?? null,
        motrice: s.targaMotrice ?? null,
        luogo: null,
        statoCarico: null,
        timestamp: toTs(s.timestamp) ?? 0,
      });
    }
  }

  if (Array.isArray(sganci)) {
    for (const s of sganci) {
      const targa = String(s.targaRimorchio ?? "");
      if (!targa) continue;
      if (inUso.has(targa)) continue;

      risultati.push({
        targa,
        stato: "LIBERO",
        colore: "red",
        autista: s.nomeAutista ?? s.autistaNome ?? s.autista ?? null,
        motrice: null,
        luogo: s.luogo ?? null,
        statoCarico: s.statoCarico ?? null,
        timestamp: toTs(s.timestampSgancio) ?? 0,
      });
    }
  }

  return risultati.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
}
