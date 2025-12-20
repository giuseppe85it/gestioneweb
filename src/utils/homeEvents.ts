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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

const KEY_RIFORNIMENTI = "@rifornimenti_autisti_tmp";
const KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp";
const KEY_CONTROLLI = "@controlli_mezzo_autisti";
const KEY_CAMBI_MOTRICE = "@cambi_mezzo_autisti_tmp";
const KEY_RICHIESTE_ATTREZZATURE = "@richieste_attrezzature_autisti_tmp";

const KEY_SESSIONI = "@autisti_sessione_attive";
const KEY_SGANCIO_RIMORCHI = "@storico_sganci_rimorchi";

function genId() {
  return `evt_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function isSameDay(ts: number, day: Date) {
  const d = new Date(ts);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

function toTs(val: any): number | null {
  if (!val) return null;
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const n = Number(val);
    if (Number.isFinite(n) && n > 0) return n;
    const t = Date.parse(val);
    if (!Number.isNaN(t)) return t;
  }
  if (val?.seconds && typeof val.seconds === "number") return val.seconds * 1000;
  return null;
}

export async function loadHomeEvents(day: Date): Promise<HomeEvent[]> {
  const events: HomeEvent[] = [];

  const rifornimenti = (await getItemSync(KEY_RIFORNIMENTI)) || [];
  if (Array.isArray(rifornimenti)) {
    for (const r of rifornimenti) {
      const ts = toTs(r?.data);
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
      const ts = toTs(s?.timestamp) ?? toTs(s?.data);
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

      const target = String(c?.target || "").toLowerCase();

      const targa =
        target === "rimorchio"
          ? c.targaRimorchio ?? null
          : target === "motrice"
          ? c.targaCamion ?? null
          : target === "entrambi"
          ? c.targaCamion && c.targaRimorchio
            ? `${c.targaCamion} + ${c.targaRimorchio}`
            : c.targaCamion ?? c.targaRimorchio ?? null
          : c.targaCamion && c.targaRimorchio
          ? `${c.targaCamion} + ${c.targaRimorchio}`
          : c.targaCamion ?? c.targaRimorchio ?? null;

      events.push({
        id: c.id ?? genId(),
        tipo: "controllo",
        targa,
        autista: c.autistaNome ?? c.nomeAutista ?? c.autista ?? null,
        timestamp: ts,
        payload: c,
      });
    }
  }

  const richieste = (await getItemSync(KEY_RICHIESTE_ATTREZZATURE)) || [];
  if (Array.isArray(richieste)) {
    for (const r of richieste) {
      const ts = toTs(r?.timestamp) ?? toTs(r?.data);
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

  const cambiMotrice = (await getItemSync(KEY_CAMBI_MOTRICE)) || [];
  if (Array.isArray(cambiMotrice)) {
    for (const m of cambiMotrice) {
      const ts = toTs(m?.timestampCambio);
      if (!ts || !isSameDay(ts, day)) continue;
      events.push({
        id: m.id ?? genId(),
        tipo: "cambio_mezzo",
        targa: m.targaMotrice ?? null,
        autista: m.autista ?? m.nomeAutista ?? null,
        timestamp: ts,
        payload: m,
      });
    }
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
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
        statoCarico: s.statoCarico ?? null,
        timestamp: toTs(s.timestampAggancio) ?? toTs(s.timestamp) ?? 0,
      });
    }
  }

  const lastByTarga = new Map<string, any>();
  if (Array.isArray(sganci)) {
    for (const s of sganci) {
      const targa = s?.targaRimorchio ? String(s.targaRimorchio) : null;
      if (!targa) continue;

      const prev = lastByTarga.get(targa);
      const curTs = toTs(s.timestampSgancio) ?? 0;
      const prevTs = prev ? (toTs(prev.timestampSgancio) ?? 0) : 0;

      if (!prev || curTs > prevTs) lastByTarga.set(targa, s);
    }
  }

  for (const [targa, s] of lastByTarga.entries()) {
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

  return risultati.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
}
