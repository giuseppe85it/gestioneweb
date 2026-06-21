// =============================================================================
// Registratore Orari e Note — reader gestionale (read-only) per @orari_autisti.
// Pattern: read*Snapshot da getDoc(storage/<key>) + unwrap array, come gli altri
// domini NEXT (rif. nextMaterialiMovimentiDomain.ts). Calcolo totali/aggregati via
// helper PURI in src/utils/orariCalc.ts. Fonte: SPEC_ORARI_NOTE_NEXT.md §2.2/§3/§5.
// La RIAPERTURA (scrittura @orari_autisti_chiusure) vive in nextOrariChiusuraWriter.ts.
// =============================================================================

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import {
  aggregatiMese,
  calcTotaleNettoMinuti,
  formatDataDisplay,
  formatMinutesToHHMM,
  getChiusuraMese,
  giornoSettimanaShort,
  isMeseChiuso,
  meseAnnoKey,
  pausaLabel,
  selectRecordsForMonth,
  TIPO_GIORNO_LABEL,
  type AggregatiMese,
  type ChiusuraMese,
  type ChiusureDoc,
  type OrarioGiornoRecord,
  type TipoGiorno,
} from "../../utils/orariCalc";

const STORAGE_COLLECTION = "storage";
export const ORARI_AUTISTI_KEY = "@orari_autisti";
export const ORARI_AUTISTI_CHIUSURE_KEY = "@orari_autisti_chiusure";
const COLLEGHI_KEY = "@colleghi";

const TIPI_VALIDI: TipoGiorno[] = ["lavoro", "ferie", "malattia", "infortunio", "festivita"];

type RawRecord = Record<string, unknown>;

export type OrarioCollega = {
  badge: string;
  nome: string;
};

export type OrarioCartellinoRow = {
  data: string; // "YYYY-MM-DD"
  dataDisplay: string; // "DD/MM/YYYY"
  giorno: string; // "Lun"/"Mar"...
  tipo: TipoGiorno;
  tipoLabel: string;
  isAssenza: boolean;
  inizio: string; // "HH:MM" o "-"
  fine: string; // "HH:MM" o "-"
  totale: string; // "H:MM" o "-"
  pausa: string; // "Sì"/"No"/"X min"/"-"
  note: string;
  notte: boolean;
};

export type OrarioCartellinoSnapshot = {
  badge: string;
  year: number;
  month1: number;
  rows: OrarioCartellinoRow[];
  records: OrarioGiornoRecord[]; // record grezzi del mese (per editing admin)
  aggregati: AggregatiMese;
  stato: "APERTO" | "CHIUSO";
  chiusura: ChiusuraMese | null;
  recordCount: number;
};

function unwrapArray(rawDoc: Record<string, unknown> | null): unknown[] {
  if (!rawDoc) return [];
  if (Array.isArray(rawDoc)) return rawDoc;
  if (Array.isArray((rawDoc as { value?: unknown }).value)) {
    return (rawDoc as { value: unknown[] }).value;
  }
  if (Array.isArray((rawDoc as { items?: unknown }).items)) {
    return (rawDoc as { items: unknown[] }).items;
  }
  const nestedItems = (rawDoc as { value?: { items?: unknown } }).value?.items;
  if (Array.isArray(nestedItems)) return nestedItems;
  return [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}

function asNullableHHMM(value: unknown): string | null {
  const s = asString(value).trim();
  return s ? s : null;
}

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Minuti di pausa REALI se presenti sul doc, altrimenti null (→ il calcolo userà il
// fallback retrocompat su `noPausa` via pausaEffettivaMinuti). NON iniettare un default
// qui: la regola di fallback vive in un solo posto (orariCalc.pausaEffettivaMinuti).
function asPausaMin(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

function normalizeRecord(raw: RawRecord): OrarioGiornoRecord | null {
  const badge = asString(raw.badge).trim();
  const data = asString(raw.data).trim();
  const tipoRaw = asString(raw.tipo).trim() as TipoGiorno;
  if (!badge || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const tipo: TipoGiorno = TIPI_VALIDI.includes(tipoRaw) ? tipoRaw : "lavoro";
  return {
    badge,
    data,
    tipo,
    inizio: asNullableHHMM(raw.inizio),
    fine: asNullableHHMM(raw.fine),
    notte: raw.notte === true,
    noPausa: raw.noPausa === true,
    pausaMin: asPausaMin(raw.pausaMin), // pausa parziale: preserva il valore reale salvato
    note: asString(raw.note),
    createdAt: asNumber(raw.createdAt),
    updatedAt: asNumber(raw.updatedAt),
  };
}

// Dedup difensivo per (badge,data): tiene il record con updatedAt più recente.
function dedupeByBadgeData(records: OrarioGiornoRecord[]): OrarioGiornoRecord[] {
  const map = new Map<string, OrarioGiornoRecord>();
  for (const r of records) {
    const key = `${r.badge}__${r.data}`;
    const prev = map.get(key);
    if (!prev || r.updatedAt >= prev.updatedAt) map.set(key, r);
  }
  return Array.from(map.values());
}

export async function readAllOrariRecords(): Promise<OrarioGiornoRecord[]> {
  const snap = await getDoc(doc(db, STORAGE_COLLECTION, ORARI_AUTISTI_KEY));
  const rawDoc = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
  const rawItems = unwrapArray(rawDoc);
  const records = rawItems
    .map((entry) => (entry && typeof entry === "object" ? normalizeRecord(entry as RawRecord) : null))
    .filter((entry): entry is OrarioGiornoRecord => Boolean(entry));
  return dedupeByBadgeData(records);
}

export async function readChiusureDoc(): Promise<ChiusureDoc> {
  const snap = await getDoc(doc(db, STORAGE_COLLECTION, ORARI_AUTISTI_CHIUSURE_KEY));
  if (!snap.exists()) return {};
  const data = snap.data() as Record<string, unknown>;
  const value = (data?.value ?? data) as unknown;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ChiusureDoc) : {};
}

export async function readOrariColleghi(): Promise<OrarioCollega[]> {
  const snap = await getDoc(doc(db, STORAGE_COLLECTION, COLLEGHI_KEY));
  const rawDoc = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
  const rawItems = unwrapArray(rawDoc);
  const colleghi = rawItems
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const raw = entry as RawRecord;
      const badge = asString(raw.badge).trim();
      if (!badge) return null;
      return { badge, nome: asString(raw.nome).trim() || badge };
    })
    .filter((entry): entry is OrarioCollega => Boolean(entry));
  // Dedup per badge, ordine alfabetico per nome.
  const map = new Map<string, OrarioCollega>();
  colleghi.forEach((c) => {
    if (!map.has(c.badge)) map.set(c.badge, c);
  });
  return Array.from(map.values()).sort((a, b) =>
    a.nome.localeCompare(b.nome, "it", { sensitivity: "base" })
  );
}

function buildRow(record: OrarioGiornoRecord): OrarioCartellinoRow {
  const isAssenza = record.tipo !== "lavoro";
  const totaleMin = calcTotaleNettoMinuti(record);
  return {
    data: record.data,
    dataDisplay: formatDataDisplay(record.data),
    giorno: giornoSettimanaShort(record.data),
    tipo: record.tipo,
    tipoLabel: TIPO_GIORNO_LABEL[record.tipo],
    isAssenza,
    inizio: isAssenza ? "-" : record.inizio ?? "-",
    fine: isAssenza ? "-" : record.fine ?? "-",
    totale: isAssenza ? "-" : formatMinutesToHHMM(totaleMin),
    pausa: pausaLabel(record),
    note: record.note ?? "",
    notte: record.notte === true,
  };
}

// SPEC §2.2 — cartellino di un autista (badge) per un mese. Read-only.
export async function readNextOrariCartellinoSnapshot(params: {
  badge: string;
  year: number;
  month1: number;
}): Promise<OrarioCartellinoSnapshot> {
  const { badge, year, month1 } = params;
  const [allRecords, chiusure] = await Promise.all([readAllOrariRecords(), readChiusureDoc()]);

  const monthRecords = selectRecordsForMonth(allRecords, badge, year, month1);
  const rows = monthRecords.map(buildRow);
  const aggregati = aggregatiMese(monthRecords);
  const chiuso = isMeseChiuso(chiusure, badge, year, month1);

  return {
    badge,
    year,
    month1,
    rows,
    records: monthRecords,
    aggregati,
    stato: chiuso ? "CHIUSO" : "APERTO",
    chiusura: getChiusuraMese(chiusure, badge, year, month1),
    recordCount: monthRecords.length,
  };
}

export type OrarioMassivoEntry = {
  badge: string;
  nome: string;
  stato: "APERTO" | "CHIUSO";
  rows: OrarioCartellinoRow[];
  aggregati: AggregatiMese;
};

// SPEC §2.2/§7 — un'entry per OGNI autista che ha REGISTRATO orari nel mese (non solo
// i chiusi), con stato del mese. Una sola lettura dello storage, poi build per badge.
export async function readNextOrariMassivoSnapshots(params: {
  year: number;
  month1: number;
}): Promise<OrarioMassivoEntry[]> {
  const { year, month1 } = params;
  const [allRecords, chiusure, colleghi] = await Promise.all([
    readAllOrariRecords(),
    readChiusureDoc(),
    readOrariColleghi(),
  ]);
  const nomeByBadge = new Map(colleghi.map((c) => [c.badge, c.nome]));
  const prefix = `${meseAnnoKey(year, month1)}-`;
  const badges = Array.from(
    new Set(allRecords.filter((r) => String(r.data).startsWith(prefix)).map((r) => r.badge))
  );

  const entries: OrarioMassivoEntry[] = badges.map((badge) => {
    const monthRecords = selectRecordsForMonth(allRecords, badge, year, month1);
    return {
      badge,
      nome: nomeByBadge.get(badge) ?? badge,
      stato: isMeseChiuso(chiusure, badge, year, month1) ? "CHIUSO" : "APERTO",
      rows: monthRecords.map(buildRow),
      aggregati: aggregatiMese(monthRecords),
    };
  });

  return entries.sort((a, b) => a.nome.localeCompare(b.nome, "it", { sensitivity: "base" }));
}
