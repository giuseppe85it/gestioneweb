// src/utils/homeEvents.ts
// =======================================================
// HOME – Lettura e normalizzazione dati (SOLO READ)
// =======================================================

import { getItemSync } from "./storageSync";

/* =======================================================
   TYPE EVENTI HOME
======================================================= */
export type HomeEvent = {
  id: string;
  tipo: "rifornimento" | "segnalazione" | "controllo" | "cambio_mezzo";
  targa: string | null;
  autista: string | null;
  timestamp: number;
  payload: any;
};

/* =======================================================
   TYPE STATO RIMORCHI
======================================================= */
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

/* =======================================================
   CHIAVI STORAGE REALI
======================================================= */
const KEY_RIFORNIMENTI = "@rifornimenti_autisti_tmp";
const KEY_SEGNALAZIONI = "@segnalazioni_autisti_tmp";
const KEY_CONTROLLI = "@controlli_mezzo_autisti";
const KEY_CAMBI_MOTRICE = "@storico_cambi_motrice";
const KEY_SGANCIO_RIMORCHI = "@storico_sganci_rimorchi";
const KEY_SESSIONI = "@autisti_sessione_attive";

/* =======================================================
   UTILITY DATA
======================================================= */
function isSameDay(ts: number, day: Date): boolean {
  const d = new Date(ts);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
}

/* =======================================================
   EVENTI HOME (CARD GIORNALIERE)
======================================================= */
export async function loadHomeEvents(day: Date): Promise<HomeEvent[]> {
  const events: HomeEvent[] = [];

  const rifornimenti = (await getItemSync(KEY_RIFORNIMENTI)) || [];
  if (Array.isArray(rifornimenti)) {
    for (const r of rifornimenti) {
      if (!r?.data || !isSameDay(r.data, day)) continue;
      events.push({
        id: r.id ?? crypto.randomUUID(),
        tipo: "rifornimento",
        targa: r.targa ?? null,
        autista: r.autistaNome ?? null,
        timestamp: r.data,
        payload: r,
      });
    }
  }

  const segnalazioni = (await getItemSync(KEY_SEGNALAZIONI)) || [];
  if (Array.isArray(segnalazioni)) {
    for (const s of segnalazioni) {
      if (!s?.data || !isSameDay(s.data, day)) continue;
      events.push({
        id: s.id ?? crypto.randomUUID(),
        tipo: "segnalazione",
        targa: s.targa ?? null,
        autista: s.autistaNome ?? null,
        timestamp: s.data,
        payload: s,
      });
    }
  }

  const controlli = (await getItemSync(KEY_CONTROLLI)) || [];
  if (Array.isArray(controlli)) {
    for (const c of controlli) {
      if (!c?.timestamp || !isSameDay(c.timestamp, day)) continue;
      events.push({
        id: crypto.randomUUID(),
        tipo: "controllo",
        targa: c.targaCamion ?? c.targaRimorchio ?? null,
        autista: c.autistaNome ?? null,
        timestamp: c.timestamp,
        payload: c,
      });
    }
  }

  const cambi = (await getItemSync(KEY_CAMBI_MOTRICE)) || [];
  if (Array.isArray(cambi)) {
    for (const m of cambi) {
      if (!m?.timestampCambio || !isSameDay(m.timestampCambio, day)) continue;
      events.push({
        id: crypto.randomUUID(),
        tipo: "cambio_mezzo",
        targa: m.targaMotrice ?? null,
        autista: m.autista ?? null,
        timestamp: m.timestampCambio,
        payload: m,
      });
    }
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

/* =======================================================
   STATO RIMORCHI (COLONNA DESTRA)
======================================================= */
export async function loadRimorchiStatus(): Promise<RimorchioStatus[]> {
  const sessioni = (await getItemSync(KEY_SESSIONI)) || [];
  const sganci = (await getItemSync(KEY_SGANCIO_RIMORCHI)) || [];

  const risultati: RimorchioStatus[] = [];
  const inUso = new Set<string>();

  // Rimorchi AGGANCIATI (sessioni attive)
  if (Array.isArray(sessioni)) {
    for (const s of sessioni) {
      if (!s?.targaRimorchio) continue;

      inUso.add(s.targaRimorchio);

      risultati.push({
        targa: s.targaRimorchio,
        stato: "AGGANCIATO",
        colore: "green",
        autista: s.autistaNome ?? null,
        motrice: s.targaMotrice ?? null,
        luogo: "IN USO",
        statoCarico: null,
        timestamp: s.timestamp ?? Date.now(),
      });
    }
  }

  // Rimorchi LIBERI (ultimo sgancio)
  if (Array.isArray(sganci)) {
    const last = new Map<string, any>();

    for (const s of sganci) {
      if (!s?.targaRimorchio || !s?.timestampSgancio) continue;
      const prev = last.get(s.targaRimorchio);
      if (!prev || s.timestampSgancio > prev.timestampSgancio) {
        last.set(s.targaRimorchio, s);
      }
    }

    for (const [targa, s] of last.entries()) {
      if (inUso.has(targa)) continue;

      risultati.push({
        targa,
        stato: "LIBERO",
        colore: "red",
        autista: s.autista ?? null,
        motrice: null,
        luogo: s.luogo ?? null,
        statoCarico: s.statoCarico ?? null,
        timestamp: s.timestampSgancio,
      });
    }
  }

  return risultati.sort((a, b) => b.timestamp - a.timestamp);
}
