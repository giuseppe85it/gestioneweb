// =============================================================================
// Registratore Orari e Note — helper di calcolo PURI (no Firebase, no React).
// Fonte: docs/product/SPEC_ORARI_NOTE_NEXT.md (v0.3) — §3 forma dato, §4 calcolo
// totale/flag, §5 footer conteggi. Nessun campo/regola inventato: tutto da SPEC.
// Condiviso fra app autista (src/autisti) e gestionale NEXT (src/next).
// =============================================================================

export type TipoGiorno =
  | "lavoro"
  | "ferie"
  | "malattia"
  | "infortunio"
  | "festivita";

// SPEC §3 — record giorno salvato. Il Totale NON si salva: si calcola in lettura.
export type OrarioGiornoRecord = {
  badge: string; // chiave autista
  data: string; // "YYYY-MM-DD"
  tipo: TipoGiorno;
  inizio: string | null; // "HH:MM" (null se assenza)
  fine: string | null; // "HH:MM" (null se assenza)
  notte: boolean; // flag, default false
  noPausa: boolean; // flag: true ⟺ pausa effettiva = 0 (nessuna pausa). Mantenuto per
  // retrocompat e per i lettori binari (colonna). Default false.
  pausaMin?: number | null; // SPEC §4 — minuti di pausa REALI scalati dal lordo (pausa
  // parziale). Se assente si applica il fallback su `noPausa` (vedi pausaEffettivaMinuti).
  note: string; // testo libero, "" se vuoto
  createdAt: number; // epoch ms, creazione record
  updatedAt: number; // epoch ms, ultima modifica
};

// SPEC §3 — stato chiusura mensile (documento separato @orari_autisti_chiusure).
export type ChiusuraMese = {
  chiuso: boolean;
  chiusoAt: number;
  riapertoAt: number | null;
};

// `{ [badge]: { [meseAnno "YYYY-MM"]: ChiusuraMese } }`
export type ChiusureDoc = Record<string, Record<string, ChiusuraMese>>;

// SPEC §5 — aggregati del mese.
export type AggregatiMese = {
  totaleMinuti: number; // somma netti dei giorni "lavoro"
  giorniLavorati: number; // conteggio giorni "lavoro"
  mediaMinuti: number; // totale / giorni lavorati (0 se nessun giorno)
  monteOrePositiviMinuti: number; // SPEC §4bis v0.7: somma scarti positivi (NON compensata)
  monteOreNegativiMinuti: number; // somma firmata (≤0) degli scarti negativi (NON compensata)
  notti: number; // conteggio giorni con flag NOTTE
  ferie: number;
  malattia: number;
  infortunio: number;
  festivita: number;
};

export const MINUTI_PAUSA_FISSA = 60; // SPEC §4 — pausa 1h fissa
const MINUTI_GIORNO = 24 * 60;

export const TIPO_GIORNO_LABEL: Record<TipoGiorno, string> = {
  lavoro: "Lavoro",
  ferie: "Ferie",
  malattia: "Malattia",
  infortunio: "Infortunio",
  festivita: "Festività",
};

const GIORNI_SETTIMANA_SHORT = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const GIORNI_SETTIMANA_LONG = [
  "domenica",
  "lunedì",
  "martedì",
  "mercoledì",
  "giovedì",
  "venerdì",
  "sabato",
];
const MESI_SHORT = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];
const MESI_LONG = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// "HH:MM" -> minuti dall'inizio giornata, o null se non valido.
export function parseHHMMtoMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

// minuti -> "H:MM" (ore NON zero-padded, minuti 2 cifre). Es. 569 -> "9:29",
// 8413 -> "140:13". SPEC §4/§5.
export function formatMinutesToHHMM(totalMinutes: number | null | undefined): string {
  if (totalMinutes === null || totalMinutes === undefined || !Number.isFinite(totalMinutes)) {
    return "-";
  }
  const safe = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}:${pad2(m)}`;
}

// SPEC §4 — Minuti di pausa EFFETTIVI da scalare dal lordo. SINGLE SOURCE usata da
// app autista, gestionale e PDF: nessuno deve duplicare questa regola di fallback.
//  - se `pausaMin` è un numero valido (≥ 0) → vale quello (pausa parziale reale);
//  - altrimenti retrocompat sui record già salvati (solo `noPausa`): true → 0, false → 60.
// Va passato SEMPRE l'intero record (non il solo `noPausa`), così i record vecchi e nuovi
// danno lo stesso risultato in ogni contesto.
export function pausaEffettivaMinuti(record: {
  noPausa?: boolean;
  pausaMin?: number | null;
}): number {
  const pm = record.pausaMin;
  if (typeof pm === "number" && Number.isFinite(pm) && pm >= 0) {
    return Math.round(pm);
  }
  return record.noPausa === true ? 0 : MINUTI_PAUSA_FISSA;
}

// SPEC §4 — Totale netto del giorno (solo tipo "lavoro").
// Base = Fine − Inizio; se Fine < Inizio attraversa la mezzanotte (+24h);
// pausa scalata = minuti REALI (pausaEffettivaMinuti): 60 di default, 0 se "No pausa",
// valore parziale se inserito dall'autista. Ritorna minuti, o null se non calcolabile.
export function calcTotaleNettoMinuti(record: {
  tipo: TipoGiorno;
  inizio: string | null;
  fine: string | null;
  noPausa?: boolean;
  pausaMin?: number | null;
}): number | null {
  if (record.tipo !== "lavoro") return null;
  const inizio = parseHHMMtoMinutes(record.inizio);
  const fine = parseHHMMtoMinutes(record.fine);
  if (inizio === null || fine === null) return null;

  let base = fine - inizio;
  if (base < 0) base += MINUTI_GIORNO; // turno oltre mezzanotte
  const netto = base - pausaEffettivaMinuti(record);
  return Math.max(0, netto);
}

// ----- Monte ore contrattuale (SPEC §4bis) ---------------------------------
// Base contrattuale: 9h lavorate/giorno. Monte ore giorno = netto − 9:00.
export const MINUTI_MONTE_ORE_BASE = 540;

// Scarto del giorno sul contratto. Assenze → 0 (neutro, mai negativo). Lavoro senza
// orari calcolabili → null. Il netto è quello di §4 (riuso calcTotaleNettoMinuti).
export function monteOreGiornoMinuti(record: {
  tipo: TipoGiorno;
  inizio: string | null;
  fine: string | null;
  noPausa?: boolean;
  pausaMin?: number | null;
}): number | null {
  if (record.tipo !== "lavoro") return 0;
  const netto = calcTotaleNettoMinuti(record);
  if (netto === null) return null;
  return netto - MINUTI_MONTE_ORE_BASE;
}

// Variante display-based: ricava lo scarto dal Totale netto già formattato ("H:MM").
// Usata da gestionale/PDF (che hanno solo le righe display). Equivale a netto − 9:00.
export function monteOreMinutiDaTotale(totale: string, isAssenza: boolean): number | null {
  if (isAssenza) return 0;
  const netto = parseHHMMtoMinutes(totale);
  if (netto === null) return null;
  return netto - MINUTI_MONTE_ORE_BASE;
}

// SPEC §4bis v0.7: DUE saldi mensili separati, NON compensati. Assenze (0) e lavoro
// senza orari ("—", null) NON entrano in nessuno dei due.
// Positivi: somma dei soli scarti > 0 dei giorni "lavoro".
export function monteOrePositiviMeseMinuti(records: OrarioGiornoRecord[]): number {
  let tot = 0;
  for (const r of records) {
    const m = monteOreGiornoMinuti(r);
    if (m !== null && m > 0) tot += m;
  }
  return tot;
}
// Negativi: somma FIRMATA (≤ 0) dei soli scarti < 0 dei giorni "lavoro".
export function monteOreNegativiMeseMinuti(records: OrarioGiornoRecord[]): number {
  let tot = 0;
  for (const r of records) {
    const m = monteOreGiornoMinuti(r);
    if (m !== null && m < 0) tot += m;
  }
  return tot;
}

// Display monte ore: "+H:MM" / "−H:MM" (meno tipografico U+2212) / "0:00"; "—" se null.
export function formatMonteOre(min: number | null): string {
  if (min === null) return "—";
  if (min === 0) return "0:00";
  const sign = min > 0 ? "+" : "−";
  return `${sign}${formatMinutesToHHMM(Math.abs(min))}`;
}

// "YYYY-MM-DD" → "GG/MM" (senza anno) per la tabella compatta riepilogo.
export function formatDataGGMM(data: string): string {
  const s = String(data ?? "");
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : s;
}

// SPEC §4 — la pausa è applicata se i minuti effettivi sono > 0. Solo per i giorni
// "lavoro"; per le assenze non si applica.
export function pausaApplicata(record: {
  tipo: TipoGiorno;
  noPausa?: boolean;
  pausaMin?: number | null;
}): boolean | null {
  if (record.tipo !== "lavoro") return null;
  return pausaEffettivaMinuti(record) > 0;
}

// SPEC §4 — etichetta pausa: "No" (0 min), "Sì" (1h piena), "X min" (pausa parziale),
// "-" per le assenze. Usata da hint app, form gestionale, colonna tabella e PDF.
export function pausaLabel(record: {
  tipo: TipoGiorno;
  noPausa?: boolean;
  pausaMin?: number | null;
}): string {
  if (record.tipo !== "lavoro") return "-";
  const min = pausaEffettivaMinuti(record);
  if (min <= 0) return "No";
  if (min >= MINUTI_PAUSA_FISSA) return "Sì";
  return `${min} min`;
}

// SPEC §5 — footer conteggi del mese.
export function aggregatiMese(records: OrarioGiornoRecord[]): AggregatiMese {
  let totaleMinuti = 0;
  let giorniLavorati = 0;
  let monteOrePositiviMinuti = 0;
  let monteOreNegativiMinuti = 0;
  let notti = 0;
  let ferie = 0;
  let malattia = 0;
  let infortunio = 0;
  let festivita = 0;

  for (const r of records) {
    if (r.tipo === "lavoro") {
      giorniLavorati += 1;
      const netto = calcTotaleNettoMinuti(r);
      if (netto !== null) {
        totaleMinuti += netto;
        const scarto = netto - MINUTI_MONTE_ORE_BASE; // §4bis: scarto su 9h
        if (scarto > 0) monteOrePositiviMinuti += scarto;
        else if (scarto < 0) monteOreNegativiMinuti += scarto; // NON compensati
      }
    } else if (r.tipo === "ferie") {
      ferie += 1;
    } else if (r.tipo === "malattia") {
      malattia += 1;
    } else if (r.tipo === "infortunio") {
      infortunio += 1;
    } else if (r.tipo === "festivita") {
      festivita += 1;
    }
    if (r.notte === true) notti += 1;
  }

  const mediaMinuti = giorniLavorati > 0 ? Math.round(totaleMinuti / giorniLavorati) : 0;

  return { totaleMinuti, giorniLavorati, mediaMinuti, monteOrePositiviMinuti, monteOreNegativiMinuti, notti, ferie, malattia, infortunio, festivita };
}

// SPEC §5 — footer DINAMICO: Totale, Giorni lavorati e Media sempre presenti;
// Notti/Ferie/Malattia/Infortunio/Festività solo se valore > 0. Una voce a 0 non
// compare. Usato sia in app (vista riepilogo) sia nel PDF, per coerenza.
export type FooterRow = { label: string; value: string; variant?: "positive" | "negative" };

export function buildFooterRows(agg: AggregatiMese): FooterRow[] {
  const rows: FooterRow[] = [
    { label: "Totale", value: formatMinutesToHHMM(agg.totaleMinuti) },
    { label: "Giorni lavorati", value: String(agg.giorniLavorati) },
    { label: "Media", value: formatMinutesToHHMM(agg.mediaMinuti) },
    // §5 v0.7: due saldi separati NON compensati, sempre visibili.
    { label: "Monte ore +", value: formatMonteOre(agg.monteOrePositiviMinuti), variant: "positive" },
    { label: "Monte ore −", value: formatMonteOre(agg.monteOreNegativiMinuti), variant: "negative" },
  ];
  if (agg.notti > 0) rows.push({ label: "Notti", value: String(agg.notti) });
  if (agg.ferie > 0) rows.push({ label: "Ferie", value: String(agg.ferie) });
  if (agg.malattia > 0) rows.push({ label: "Malattia", value: String(agg.malattia) });
  if (agg.infortunio > 0) rows.push({ label: "Infortunio", value: String(agg.infortunio) });
  if (agg.festivita > 0) rows.push({ label: "Festività", value: String(agg.festivita) });
  return rows;
}

// ----- Helper calendario / chiavi -------------------------------------------

// "YYYY-MM" da anno e mese 1-based. SPEC §3.
export function meseAnnoKey(year: number, month1: number): string {
  return `${year}-${pad2(month1)}`;
}

export type GiornoMese = {
  data: string; // "YYYY-MM-DD"
  giorno: number; // 1..31
  dow: number; // 0=domenica .. 6=sabato
  isWeekend: boolean; // sabato o domenica (SPEC §2.1)
};

// Tutti i giorni del mese (month1 1-based). SPEC §2.1 — lista di TUTTI i giorni.
export function buildGiorniMese(year: number, month1: number): GiornoMese[] {
  const giorni: GiornoMese[] = [];
  const totalGiorni = new Date(year, month1, 0).getDate(); // giorno 0 del mese dopo
  for (let g = 1; g <= totalGiorni; g++) {
    const d = new Date(year, month1 - 1, g);
    const dow = d.getDay();
    giorni.push({
      data: `${year}-${pad2(month1)}-${pad2(g)}`,
      giorno: g,
      dow,
      isWeekend: dow === 0 || dow === 6,
    });
  }
  return giorni;
}

// SPEC §2.1 — giorni FERIALI (lun–ven) del mese SENZA record. Sabato e domenica NON
// contano mai come mancanti. Helper PURO: il conteggio "Mancanti (feriali)" è la sua
// length; le date servono anche all'alert di chiusura (§6). `records` = record del mese.
export function listaMancantiFeriali(
  records: OrarioGiornoRecord[],
  year: number,
  month1: number
): string[] {
  const conRecord = new Set(records.map((r) => String(r.data)));
  return buildGiorniMese(year, month1)
    .filter((g) => !g.isWeekend && !conRecord.has(g.data))
    .map((g) => g.data);
}

export function giornoSettimanaShort(data: string): string {
  const d = parseDataISO(data);
  return d ? GIORNI_SETTIMANA_SHORT[d.getDay()] : "-";
}

export function giornoSettimanaLong(data: string): string {
  const d = parseDataISO(data);
  return d ? GIORNI_SETTIMANA_LONG[d.getDay()] : "-";
}

export function meseLabelShort(month1: number): string {
  return MESI_SHORT[month1 - 1] ?? "-";
}

export function meseLabelLong(month1: number): string {
  return MESI_LONG[month1 - 1] ?? "-";
}

// "YYYY-MM-DD" -> "DD/MM/YYYY"
export function formatDataDisplay(data: string): string {
  const d = parseDataISO(data);
  if (!d) return data;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function parseDataISO(data: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(data ?? "").trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const g = Number(match[3]);
  const d = new Date(y, m - 1, g);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Date locale -> "YYYY-MM-DD" (giorno del telefono).
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Sposta una data "YYYY-MM-DD" di delta giorni (rollover mese/anno gestito da Date).
export function addDaysISO(data: string, delta: number): string {
  const d = parseDataISO(data);
  if (!d) return data;
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

// ----- Selezione / upsert su lista record -----------------------------------

// Record del badge per uno specifico mese (month1 1-based), ordinati per data.
export function selectRecordsForMonth(
  list: OrarioGiornoRecord[],
  badge: string,
  year: number,
  month1: number
): OrarioGiornoRecord[] {
  const prefix = `${meseAnnoKey(year, month1)}-`;
  const badgeKey = String(badge ?? "").trim();
  return list
    .filter((r) => String(r.badge ?? "").trim() === badgeKey && String(r.data ?? "").startsWith(prefix))
    .sort((a, b) => String(a.data).localeCompare(String(b.data)));
}

export function findGiorno(
  list: OrarioGiornoRecord[],
  badge: string,
  data: string
): OrarioGiornoRecord | null {
  const badgeKey = String(badge ?? "").trim();
  return (
    list.find(
      (r) => String(r.badge ?? "").trim() === badgeKey && String(r.data ?? "") === String(data)
    ) ?? null
  );
}

// Update-in-place per (badge, data): un giorno è unico per autista. Se esiste
// lo sostituisce, altrimenti append. SPEC §2: l'autista modifica i giorni.
export function upsertGiornoRecord(
  list: OrarioGiornoRecord[],
  record: OrarioGiornoRecord
): OrarioGiornoRecord[] {
  const badgeKey = String(record.badge ?? "").trim();
  const idx = list.findIndex(
    (r) => String(r.badge ?? "").trim() === badgeKey && String(r.data ?? "") === String(record.data)
  );
  if (idx < 0) return [...list, record];
  return list.map((r, i) => (i === idx ? record : r));
}

// ----- Stato chiusura (pure transforms su ChiusureDoc) -----------------------

export function isMeseChiuso(
  doc: ChiusureDoc | null | undefined,
  badge: string,
  year: number,
  month1: number
): boolean {
  if (!doc) return false;
  const voce = doc[String(badge ?? "").trim()]?.[meseAnnoKey(year, month1)];
  return voce?.chiuso === true;
}

export function getChiusuraMese(
  doc: ChiusureDoc | null | undefined,
  badge: string,
  year: number,
  month1: number
): ChiusuraMese | null {
  if (!doc) return null;
  return doc[String(badge ?? "").trim()]?.[meseAnnoKey(year, month1)] ?? null;
}

// Imposta CHIUSO (chiusoAt) per badge+mese. Pure: il caller passa `now`.
export function withMeseChiuso(
  doc: ChiusureDoc | null | undefined,
  badge: string,
  year: number,
  month1: number,
  now: number
): ChiusureDoc {
  const badgeKey = String(badge ?? "").trim();
  const key = meseAnnoKey(year, month1);
  const base: ChiusureDoc = doc ? { ...doc } : {};
  const perBadge = { ...(base[badgeKey] ?? {}) };
  perBadge[key] = { chiuso: true, chiusoAt: now, riapertoAt: null };
  base[badgeKey] = perBadge;
  return base;
}

// Imposta RIAPERTO (riapertoAt) per badge+mese. Pure: il caller passa `now`.
export function withMeseRiaperto(
  doc: ChiusureDoc | null | undefined,
  badge: string,
  year: number,
  month1: number,
  now: number
): ChiusureDoc {
  const badgeKey = String(badge ?? "").trim();
  const key = meseAnnoKey(year, month1);
  const base: ChiusureDoc = doc ? { ...doc } : {};
  const perBadge = { ...(base[badgeKey] ?? {}) };
  const prev = perBadge[key];
  perBadge[key] = {
    chiuso: false,
    chiusoAt: prev?.chiusoAt ?? 0,
    riapertoAt: now,
  };
  base[badgeKey] = perBadge;
  return base;
}
