// D-SCAD — Scadenze di manutenzione ricorrenti (cronotachigrafo, tagliandi, estintore…).
//
// FASE A (logica e dati). Questo modulo NON disegna interfaccia: espone
//  - il modello dati persistito (`NextManutenzioneScadenzaRecord`),
//  - il calcolo PURO dello stato (`evaluateScadenzaManutenzione`), testabile da solo,
//  - il reader read-only (`readNextManutenzioniScadenzeSnapshot`) che assembla gli item
//    leggendo `@manutenzioni_scadenze` e i km correnti per targa dai rifornimenti.
//
// Coerenza con l'esistente:
//  - soglia "in scadenza" = 30 giorni, come `evaluateScheduledStatus`
//    (nextManutenzioniDomain.ts) e le revisioni (nextCentroControlloDomain.ts);
//  - `giorniDaOggi` replica la stessa logica UTC-a-mezzanotte già usata nei due domini;
//  - il km corrente riusa la stessa idea del Dossier (ultimo rifornimento con km valido).
//
// Le date di business arrivano dai dati salvati (input utente). Qui non si scrive nulla
// e non si generano timestamp di business: il reader è in sola lettura.

import { parseAnyDate, toISO } from "../helpers/dateUnica";
import { getItemSync } from "../../utils/storageSync";
import { readNextRifornimentiReadOnlySnapshot } from "./nextRifornimentiDomain";

export const MANUTENZIONI_SCADENZE_KEY = "@manutenzioni_scadenze" as const;

const DAY_MS = 24 * 60 * 60 * 1000;

// Soglie di preavviso. A tempo riusiamo i 30 giorni dell'esistente; per km/ore
// definiamo un residuo oltre il quale la scadenza è "in scadenza".
export const SOGLIA_GIORNI = 30;
export const SOGLIA_KM_RESIDUO = 1000;
export const SOGLIA_ORE_RESIDUO = 50;

export type ScadenzaBase = "tempo" | "km" | "ore";

// Settore di visualizzazione di una scadenza. I tipi predefiniti hanno un settore
// fisso; per "altro" (o tipi sconosciuti) il settore è dato dal NOME (label), così
// ogni nome personalizzato diventa una categoria a sé (card home, filtri pagina, PDF).
export type ScadenzaSettore = { key: string; label: string };

export const SETTORE_CRONOTACHIGRAFO = "cronotachigrafo";
export const SETTORE_TAGLIANDI = "tagliandi";
export const SETTORE_ESTINTORE = "estintore";

export function settoreScadenza(tipo: string, label: string): ScadenzaSettore {
  if (tipo === "cronotachigrafo") return { key: SETTORE_CRONOTACHIGRAFO, label: "Cronotachigrafo" };
  if (tipo === "estintore") return { key: SETTORE_ESTINTORE, label: "Estintore" };
  if (tipo === "tagliando_mezzo" || tipo === "tagliando_compressore") {
    return { key: SETTORE_TAGLIANDI, label: "Tagliandi" };
  }
  const nome = (label ?? "").trim() || "Altro";
  return { key: `custom:${nome.toLocaleLowerCase("it")}`, label: nome };
}

// Ordine dei settori di manutenzione: prima i 3 predefiniti, poi i personalizzati.
export function ordineSettore(key: string): number {
  if (key === SETTORE_CRONOTACHIGRAFO) return 0;
  if (key === SETTORE_TAGLIANDI) return 1;
  if (key === SETTORE_ESTINTORE) return 2;
  return 3;
}

export type NextScadenzaStato =
  | "ok"
  | "in_scadenza"
  | "scaduta"
  | "data_mancante"
  | "valore_non_disponibile";

export type NextScadenzaTone = "neutral" | "warning" | "danger";

// Record persistito in storage/@manutenzioni_scadenze.
export type NextManutenzioneScadenzaRecord = {
  id: string;
  targa: string;
  tipo: string; // APERTO: "cronotachigrafo" | "tagliando_mezzo" | "tagliando_compressore" | "estintore" | …
  label: string;
  base: ScadenzaBase[];
  intervalloMesi?: number | null;
  intervalloKm?: number | null;
  intervalloOre?: number | null;
  ultimaEsecuzioneData?: string | null;
  ultimaEsecuzioneKm?: number | null;
  ultimaEsecuzioneOre?: number | null;
  prossimaScadenzaDataManuale?: string | null;
  prossimaScadenzaKmManuale?: number | null;
  prossimaScadenzaOreManuale?: number | null;
  note?: string | null;
  // Marca la voce come "assente" sul mezzo (es. estintore non presente):
  // non si calcolano date/km di scadenza e nell'elenco compare un badge rosso.
  assente?: boolean;
  attiva: boolean;
  updatedAt?: number;
};

// Contesto runtime per il calcolo (valori correnti del mezzo). In Fase 1 le ore
// non hanno una fonte affidabile: oreAttuali resta null e la base "ore" risulta
// "valore_non_disponibile".
export type NextScadenzaContestoMezzo = {
  kmAttuali: number | null;
  oreAttuali: number | null;
};

// Esito del calcolo per una singola base.
export type NextScadenzaComponente = {
  base: ScadenzaBase;
  stato: NextScadenzaStato;
  // base tempo
  prossimaData: string | null; // ISO
  giorni: number | null;
  // base km/ore
  prossimoValore: number | null;
  valoreCorrente: number | null;
  residuo: number | null;
};

// Read-model esposto alla UI.
export type NextManutenzioneScadenzaItem = {
  id: string;
  targa: string;
  tipo: string;
  label: string;
  attiva: boolean;
  note: string | null;
  assente: boolean; // voce marcata come non presente sul mezzo
  base: ScadenzaBase[];
  componenti: NextScadenzaComponente[];
  stato: NextScadenzaStato; // peggiore tra le componenti
  tone: NextScadenzaTone;
  giorniMin: number | null; // minimo giorni tra le componenti a tempo (per ordinamento)
  record: NextManutenzioneScadenzaRecord; // dati grezzi (per la modifica nel form)
};

export type NextManutenzioniScadenzeSnapshot = {
  sourceKey: typeof MANUTENZIONI_SCADENZE_KEY;
  items: NextManutenzioneScadenzaItem[];
  counters: {
    totali: number; // record attivi
    scadute: number;
    inScadenza: number;
    // Ripartizione per settore (anche personalizzati), ordinata, per la card home "Scadenze".
    perSettore: { key: string; label: string; scadute: number; inScadenza: number }[];
  };
};

// ————————————————————————————————————————————————————————————————
// Helper puri
// ————————————————————————————————————————————————————————————————

export function normalizeScadenzaTarga(targa: unknown): string {
  return String(targa ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim().replace(",", ".");
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function giorniDaOggi(target: Date | null, now: number): number | null {
  if (!target) return null;
  const today = new Date(now);
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((utcTarget - utcToday) / DAY_MS);
}

// ultimaEsecuzioneData + intervalloMesi → data ISO (mezzogiorno per evitare derive DST).
function aggiungiMesiISO(dataISO: string | null | undefined, mesi: number | null | undefined): string | null {
  const parsed = parseAnyDate(dataISO);
  if (!parsed || mesi == null || !Number.isFinite(mesi)) return null;
  const next = new Date(parsed.getTime());
  next.setHours(12, 0, 0, 0);
  next.setMonth(next.getMonth() + mesi);
  return toISO(next);
}

function statoFromGiorni(giorni: number | null): NextScadenzaStato {
  if (giorni === null) return "data_mancante";
  if (giorni < 0) return "scaduta";
  if (giorni <= SOGLIA_GIORNI) return "in_scadenza";
  return "ok";
}

function statoFromResiduo(residuo: number | null, soglia: number): NextScadenzaStato {
  if (residuo === null) return "data_mancante";
  if (residuo < 0) return "scaduta";
  if (residuo <= soglia) return "in_scadenza";
  return "ok";
}

const SEVERITY: Record<NextScadenzaStato, number> = {
  scaduta: 4,
  in_scadenza: 3,
  ok: 2,
  valore_non_disponibile: 1,
  data_mancante: 0,
};

export function toneFromStato(stato: NextScadenzaStato): NextScadenzaTone {
  if (stato === "scaduta") return "danger";
  if (stato === "in_scadenza") return "warning";
  return "neutral";
}

function emptyComponente(base: ScadenzaBase, stato: NextScadenzaStato): NextScadenzaComponente {
  return {
    base,
    stato,
    prossimaData: null,
    giorni: null,
    prossimoValore: null,
    valoreCorrente: null,
    residuo: null,
  };
}

// ————————————————————————————————————————————————————————————————
// Calcolo PURO dello stato di una scadenza
// ————————————————————————————————————————————————————————————————

function valutaTempo(
  record: NextManutenzioneScadenzaRecord,
  now: number,
): NextScadenzaComponente {
  // L'override manuale prevale sul calcolo da regola.
  const manualeISO = toISO(record.prossimaScadenzaDataManuale);
  const prossimaData =
    manualeISO ?? aggiungiMesiISO(record.ultimaEsecuzioneData, record.intervalloMesi);
  const giorni = giorniDaOggi(parseAnyDate(prossimaData), now);
  return {
    base: "tempo",
    stato: statoFromGiorni(giorni),
    prossimaData: prossimaData ?? null,
    giorni,
    prossimoValore: null,
    valoreCorrente: null,
    residuo: null,
  };
}

function valutaContatore(
  base: "km" | "ore",
  manuale: number | null,
  ultima: number | null,
  intervallo: number | null,
  corrente: number | null,
  soglia: number,
): NextScadenzaComponente {
  // prossimoValore: override manuale, altrimenti ultima esecuzione + intervallo.
  const prossimoValore =
    manuale != null
      ? manuale
      : ultima != null && intervallo != null
        ? ultima + intervallo
        : null;

  if (prossimoValore === null) {
    return emptyComponente(base, "data_mancante");
  }
  if (corrente === null) {
    // Nessun valore corrente affidabile (in Fase 1: ore senza contaore).
    return { ...emptyComponente(base, "valore_non_disponibile"), prossimoValore };
  }

  const residuo = prossimoValore - corrente;
  return {
    base,
    stato: statoFromResiduo(residuo, soglia),
    prossimaData: null,
    giorni: null,
    prossimoValore,
    valoreCorrente: corrente,
    residuo,
  };
}

/**
 * Calcolo puro: dato un record e i valori correnti del mezzo, produce l'item read-model
 * con lo stato per ogni base attiva e lo stato complessivo (il peggiore).
 */
export function evaluateScadenzaManutenzione(
  record: NextManutenzioneScadenzaRecord,
  contesto: NextScadenzaContestoMezzo,
  now: number,
): NextManutenzioneScadenzaItem {
  // Voce marcata "assente": non si calcola nulla, si mostra solo lo stato ASSENTE.
  if (record.assente) {
    return {
      id: record.id,
      targa: record.targa,
      tipo: record.tipo,
      label: record.label,
      attiva: record.attiva,
      note: record.note ?? null,
      assente: true,
      base: record.base,
      componenti: [],
      stato: "data_mancante",
      tone: "neutral",
      giorniMin: null,
      record,
    };
  }

  const componenti: NextScadenzaComponente[] = [];

  for (const base of record.base) {
    if (base === "tempo") {
      componenti.push(valutaTempo(record, now));
    } else if (base === "km") {
      componenti.push(
        valutaContatore(
          "km",
          record.prossimaScadenzaKmManuale ?? null,
          record.ultimaEsecuzioneKm ?? null,
          record.intervalloKm ?? null,
          contesto.kmAttuali,
          SOGLIA_KM_RESIDUO,
        ),
      );
    } else if (base === "ore") {
      componenti.push(
        valutaContatore(
          "ore",
          record.prossimaScadenzaOreManuale ?? null,
          record.ultimaEsecuzioneOre ?? null,
          record.intervalloOre ?? null,
          contesto.oreAttuali,
          SOGLIA_ORE_RESIDUO,
        ),
      );
    }
  }

  // Stato complessivo = componente con severità massima. Senza componenti → data_mancante.
  const peggiore = componenti.reduce<NextScadenzaStato>((acc, componente) => {
    return SEVERITY[componente.stato] > SEVERITY[acc] ? componente.stato : acc;
  }, "data_mancante");

  const giorniValidi = componenti
    .map((componente) => componente.giorni)
    .filter((giorni): giorni is number => giorni !== null);
  const giorniMin = giorniValidi.length ? Math.min(...giorniValidi) : null;

  return {
    id: record.id,
    targa: record.targa,
    tipo: record.tipo,
    label: record.label,
    attiva: record.attiva,
    note: record.note ?? null,
    assente: false,
    base: record.base,
    componenti,
    stato: componenti.length ? peggiore : "data_mancante",
    tone: toneFromStato(componenti.length ? peggiore : "data_mancante"),
    giorniMin,
    record,
  };
}

// ————————————————————————————————————————————————————————————————
// Lettura / normalizzazione record persistiti
// ————————————————————————————————————————————————————————————————

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (isRecord(raw) && Array.isArray(raw.value)) return raw.value;
  if (isRecord(raw) && Array.isArray(raw.items)) return raw.items;
  if (isRecord(raw) && isRecord(raw.value) && Array.isArray(raw.value.items)) {
    return raw.value.items;
  }
  return [];
}

const BASI_VALIDE: ScadenzaBase[] = ["tempo", "km", "ore"];

function normalizeBase(raw: unknown): ScadenzaBase[] {
  if (!Array.isArray(raw)) return [];
  const out: ScadenzaBase[] = [];
  for (const entry of raw) {
    const value = String(entry ?? "").trim();
    if ((BASI_VALIDE as string[]).includes(value) && !out.includes(value as ScadenzaBase)) {
      out.push(value as ScadenzaBase);
    }
  }
  return out;
}

function normalizeStringOrNull(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

/** Normalizza un record grezzo (anche legacy/parziale) nel modello tipizzato. */
export function normalizeScadenzaRecord(raw: unknown): NextManutenzioneScadenzaRecord | null {
  if (!isRecord(raw)) return null;
  const id = normalizeStringOrNull(raw.id);
  const targa = normalizeStringOrNull(raw.targa);
  if (!id || !targa) return null;

  return {
    id,
    targa,
    tipo: String(raw.tipo ?? "").trim() || "altro",
    label: String(raw.label ?? "").trim() || "Scadenza",
    base: normalizeBase(raw.base),
    intervalloMesi: toFiniteNumber(raw.intervalloMesi),
    intervalloKm: toFiniteNumber(raw.intervalloKm),
    intervalloOre: toFiniteNumber(raw.intervalloOre),
    ultimaEsecuzioneData: normalizeStringOrNull(raw.ultimaEsecuzioneData),
    ultimaEsecuzioneKm: toFiniteNumber(raw.ultimaEsecuzioneKm),
    ultimaEsecuzioneOre: toFiniteNumber(raw.ultimaEsecuzioneOre),
    prossimaScadenzaDataManuale: normalizeStringOrNull(raw.prossimaScadenzaDataManuale),
    prossimaScadenzaKmManuale: toFiniteNumber(raw.prossimaScadenzaKmManuale),
    prossimaScadenzaOreManuale: toFiniteNumber(raw.prossimaScadenzaOreManuale),
    note: normalizeStringOrNull(raw.note),
    assente: raw.assente === true,
    attiva: raw.attiva !== false, // default true se non specificato
    updatedAt: toFiniteNumber(raw.updatedAt) ?? undefined,
  };
}

async function readScadenzeRecords(): Promise<NextManutenzioneScadenzaRecord[]> {
  const raw = await getItemSync(MANUTENZIONI_SCADENZE_KEY);
  return unwrapArray(raw)
    .map(normalizeScadenzaRecord)
    .filter((record): record is NextManutenzioneScadenzaRecord => record !== null);
}

/** Mappa targa → km corrente (ultimo rifornimento con km valido), una sola lettura. */
export async function readKmCorrentiByTarga(): Promise<Map<string, number>> {
  const snapshot = await readNextRifornimentiReadOnlySnapshot();
  const latest = new Map<string, { km: number; ts: number }>();
  for (const item of snapshot.items) {
    const km = typeof item.km === "number" && Number.isFinite(item.km) ? item.km : null;
    if (km === null) continue;
    const targa = normalizeScadenzaTarga(item.mezzoTarga ?? item.targa);
    if (!targa) continue;
    const ts = item.timestamp ?? 0;
    const prev = latest.get(targa);
    if (!prev || ts >= prev.ts) latest.set(targa, { km, ts });
  }
  const out = new Map<string, number>();
  for (const [targa, value] of latest) out.set(targa, value.km);
  return out;
}

// ————————————————————————————————————————————————————————————————
// Snapshot read-only
// ————————————————————————————————————————————————————————————————

export async function readNextManutenzioniScadenzeSnapshot(
  now: number = Date.now(),
): Promise<NextManutenzioniScadenzeSnapshot> {
  const [records, kmByTarga] = await Promise.all([readScadenzeRecords(), readKmCorrentiByTarga()]);

  const items = records.map((record) => {
    const kmAttuali = kmByTarga.get(normalizeScadenzaTarga(record.targa)) ?? null;
    // Fase 1: nessun contaore affidabile → oreAttuali null (base "ore" non calcolabile).
    return evaluateScadenzaManutenzione(record, { kmAttuali, oreAttuali: null }, now);
  });

  const attivi = items.filter((item) => item.attiva);
  const settoriMap = new Map<string, { key: string; label: string; scadute: number; inScadenza: number }>();
  for (const item of attivi) {
    const settore = settoreScadenza(item.tipo, item.label);
    const entry = settoriMap.get(settore.key) ?? {
      key: settore.key,
      label: settore.label,
      scadute: 0,
      inScadenza: 0,
    };
    if (item.stato === "scaduta") entry.scadute += 1;
    else if (item.stato === "in_scadenza") entry.inScadenza += 1;
    settoriMap.set(settore.key, entry);
  }
  const perSettore = [...settoriMap.values()].sort(
    (left, right) =>
      ordineSettore(left.key) - ordineSettore(right.key) || left.label.localeCompare(right.label, "it"),
  );
  return {
    sourceKey: MANUTENZIONI_SCADENZE_KEY,
    items,
    counters: {
      totali: attivi.length,
      scadute: attivi.filter((item) => item.stato === "scaduta").length,
      inScadenza: attivi.filter((item) => item.stato === "in_scadenza").length,
      perSettore,
    },
  };
}
