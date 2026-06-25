/**
 * BUG 65 — "Aggancia universale" (Fase 2: lettore candidati, READ-ONLY).
 *
 * A differenza di `manutenzioniPerAggancio.ts` (solo manutenzioni), questo lettore
 * raccoglie i candidati agganciabili da PIU' sorgenti per una targa:
 *   - manutenzioni (@manutenzioni)        — qualunque stato (da fare / eseguita / ...)
 *   - segnalazioni (@segnalazioni_autisti_tmp)
 *   - controlli KO (@controlli_mezzo_autisti)
 *
 * Espone anche la CATEGORIA del mezzo (da @mezzi_aziendali), cosi' il modale puo'
 * raggruppare per targa + categoria + tipo. Reader puro: nessuna scrittura.
 */

import { getItemSync } from "../../utils/storageSync";
import { parseAnyDate, toISO } from "./dateUnica";

const MANUTENZIONI_KEY = "@manutenzioni";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const MEZZI_KEY = "@mezzi_aziendali";
const DEFAULT_FINESTRA_GG = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type CandidatoAggancioTipo = "manutenzione" | "segnalazione" | "controllo";

export type CandidatoAggancioUniversale = {
  tipo: CandidatoAggancioTipo;
  refKey: string;
  id: string;
  targa: string;
  categoria: string | null;
  descrizione: string;
  stato: string;
  dataIso: string | null;
};

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return (raw.value as unknown[]).filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.items)) return (raw.items as unknown[]).filter(isRecord);
  return [];
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeTargaUp(value: unknown): string {
  return normalizeText(value).toUpperCase();
}

function firstText(record: RawRecord, keys: readonly string[]): string {
  for (const key of keys) {
    const v = normalizeText(record[key]);
    if (v) return v;
  }
  return "";
}

function readData(record: RawRecord, keys: readonly string[]): Date | null {
  for (const key of keys) {
    const parsed = parseAnyDate(record[key]);
    if (parsed) return parsed;
  }
  return null;
}

/** Mappa targa(uppercase) → categoria, letta da @mezzi_aziendali (alias tolleranti). */
async function buildCategoriaByTarga(): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const list = unwrapList(await getItemSync(MEZZI_KEY));
  for (const record of list) {
    const targa = normalizeTargaUp(record.targa);
    if (!targa) continue;
    const categoria =
      firstText(record, ["categoria", "tipologia", "tipo"]) || null;
    if (!map.has(targa)) map.set(targa, categoria);
  }
  return map;
}

const TARGA_KEYS_MANUTENZIONE = ["targa"] as const;
const TARGA_KEYS_SORGENTE = [
  "targa",
  "targaCamion",
  "targaMotrice",
  "targaRimorchio",
  "mezzoTarga",
] as const;

/** Un controllo e' "KO" se ha un esito negativo o almeno un check a false. */
function isControlloKo(record: RawRecord): boolean {
  if (record.ko === true || record.ok === false || record.tuttoOk === false) return true;
  if (normalizeText(record.esito).toLowerCase() === "ko") return true;
  const check = record.check;
  if (isRecord(check)) {
    for (const value of Object.values(check)) {
      if (value === false) return true;
    }
  }
  return false;
}

type SorgenteConfig = {
  tipo: CandidatoAggancioTipo;
  refKey: string;
  targaKeys: readonly string[];
  descrizioneKeys: readonly string[];
  dataKeys: readonly string[];
  /** Filtro opzionale: include solo i record che soddisfano la condizione. */
  filtro?: (record: RawRecord) => boolean;
};

const SORGENTI: SorgenteConfig[] = [
  {
    tipo: "manutenzione",
    refKey: MANUTENZIONI_KEY,
    targaKeys: TARGA_KEYS_MANUTENZIONE,
    descrizioneKeys: ["descrizione"],
    dataKeys: ["data", "dataInserimento", "createdAt", "timestamp", "dataProgrammata"],
  },
  {
    tipo: "segnalazione",
    refKey: SEGNALAZIONI_KEY,
    targaKeys: TARGA_KEYS_SORGENTE,
    descrizioneKeys: ["descrizione", "note", "messaggio", "tipoProblema", "titolo"],
    dataKeys: ["timestamp", "data", "createdAt"],
  },
  {
    tipo: "controllo",
    refKey: CONTROLLI_KEY,
    targaKeys: TARGA_KEYS_SORGENTE,
    descrizioneKeys: ["descrizione", "note", "titolo"],
    dataKeys: ["timestamp", "data", "createdAt"],
    // Solo controlli KO: i controlli "tutto ok" sono rumore per l'aggancio.
    filtro: isControlloKo,
  },
];

export type CandidatiAggancioOptions = {
  /** Se valorizzata, filtra ai soli record di quella targa. */
  targa?: string | null;
  /** Escludi un id specifico (es. la manutenzione da cui si apre il modale). */
  escludiId?: string | null;
  /** Finestra temporale in giorni (default 365). I record senza data sono inclusi. */
  finestraGiorni?: number;
};

/**
 * Restituisce i candidati agganciabili (manutenzioni + segnalazioni + controlli),
 * filtrati per targa/finestra, con categoria del mezzo risolta. Ordina per data desc.
 */
export async function getCandidatiAggancioUniversale(
  options: CandidatiAggancioOptions = {},
): Promise<CandidatoAggancioUniversale[]> {
  const targaFiltro = options.targa ? normalizeTargaUp(options.targa) : null;
  const escludiId = normalizeText(options.escludiId);
  const finestra = options.finestraGiorni ?? DEFAULT_FINESTRA_GG;
  const cutoff = Date.now() - finestra * MS_PER_DAY;

  const categoriaByTarga = await buildCategoriaByTarga();

  const out: Array<{ candidato: CandidatoAggancioUniversale; sortKey: number }> = [];

  for (const sorgente of SORGENTI) {
    const list = unwrapList(await getItemSync(sorgente.refKey));
    for (const record of list) {
      if (sorgente.filtro && !sorgente.filtro(record)) continue;
      const id = normalizeText(record.id);
      if (!id || (escludiId && id === escludiId)) continue;
      const targa = normalizeTargaUp(firstText(record, sorgente.targaKeys));
      if (!targa) continue;
      if (targaFiltro && targa !== targaFiltro) continue;
      const data = readData(record, sorgente.dataKeys);
      if (data && data.getTime() < cutoff) continue;

      out.push({
        candidato: {
          tipo: sorgente.tipo,
          refKey: sorgente.refKey,
          id,
          targa,
          categoria: categoriaByTarga.get(targa) ?? null,
          descrizione: firstText(record, sorgente.descrizioneKeys) || "(senza descrizione)",
          stato: normalizeText(record.stato) || "(senza stato)",
          dataIso: data ? toISO(data) : null,
        },
        sortKey: data ? data.getTime() : 0,
      });
    }
  }

  out.sort((a, b) => b.sortKey - a.sortKey);
  return out.map((entry) => entry.candidato);
}
