/**
 * PROMPT 47 T1 — Reader per il dropdown "Aggancia segnalazione/controllo a manutenzione
 * esistente" lato Centro Controllo / Archivio Storico.
 *
 * A differenza di `manutenzioniCandidatiMerge.ts` (PROMPT 45, filtra solo daFare/programmata
 * con finestra 90gg per il flusso admin di creazione daFare), questo helper:
 *   - Non filtra per stato: accetta TUTTI gli stati (daFare, programmata, eseguita,
 *     chiusa_da_evento, e qualsiasi altro), perche' il flusso PROMPT 47 e' il
 *     "rimedio retroattivo" su record gia' eseguiti (es. cambio gomme stand-alone).
 *   - Finestra default 365 giorni (vs 90).
 *   - Espone anche `fornitore` per distinguere visivamente i record nel dropdown
 *     (es. "VALTELLINA PNEUMATICI" aiuta a riconoscere il cambio gomme).
 *   - Sort per data desc (piu' recenti prima).
 *
 * Reader puro: niente scritture.
 */

import { getItemSync } from "../../utils/storageSync";
import { parseAnyDate, toISO } from "./dateUnica";
import { readLegamiOrigine } from "./cicloLegame";

export type ManutenzioneCandidataAggancio = {
  id: string;
  targa: string;
  descrizione: string;
  stato: string;
  dataIso: string | null;
  fornitore: string | null;
  origineTipo: string | null;
  origineRefId: string | null;
  origineRefsCount: number;
};

const MANUTENZIONI_KEY = "@manutenzioni";
const DEFAULT_FINESTRA_GG = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) {
    return (raw.value as unknown[]).filter(isRecord);
  }
  if (isRecord(raw) && Array.isArray(raw.items)) {
    return (raw.items as unknown[]).filter(isRecord);
  }
  return [];
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeTargaUp(value: unknown): string {
  return normalizeText(value).toUpperCase();
}

function readDataPrincipale(record: RawRecord): Date | null {
  // Per le manutenzioni, `data` e' il campo canonico (ISO yyyy-mm-dd).
  // Fallback su altri campi se data manca.
  const candidates = [record.data, record.dataInserimento, record.createdAt, record.timestamp, record.dataProgrammata];
  for (const candidate of candidates) {
    const parsed = parseAnyDate(candidate);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * Restituisce le manutenzioni candidabili per l'aggancio inverso (qualunque stato).
 *
 * Filtri:
 *   - targa normalizzata uppercase === input
 *   - data principale entro `finestraGiorni` (default 365). Record senza data sono inclusi.
 *
 * Sort: data desc (piu' recenti prima, null in fondo).
 */
export async function getManutenzioniPerAggancio(
  targa: string,
  finestraGiorni: number = DEFAULT_FINESTRA_GG,
): Promise<ManutenzioneCandidataAggancio[]> {
  const targaNorm = normalizeTargaUp(targa);
  if (!targaNorm) return [];

  const raw = await getItemSync(MANUTENZIONI_KEY);
  const list = unwrapList(raw);
  const cutoff = Date.now() - finestraGiorni * MS_PER_DAY;

  const out: Array<{ candidato: ManutenzioneCandidataAggancio; sortKey: number }> = [];
  for (const record of list) {
    if (normalizeTargaUp(record.targa) !== targaNorm) continue;
    const id = normalizeText(record.id);
    if (!id) continue;
    const dataApertura = readDataPrincipale(record);
    if (dataApertura && dataApertura.getTime() < cutoff) continue;

    out.push({
      candidato: {
        id,
        targa: targaNorm,
        descrizione: normalizeText(record.descrizione) || "(senza descrizione)",
        stato: normalizeText(record.stato) || "(senza stato)",
        dataIso: dataApertura ? toISO(dataApertura) : null,
        fornitore: normalizeText(record.fornitore) || null,
        origineTipo: normalizeText(record.origineTipo) || null,
        origineRefId: normalizeText(record.origineRefId) || null,
        origineRefsCount: readLegamiOrigine(record).length,
      },
      sortKey: dataApertura ? dataApertura.getTime() : 0,
    });
  }

  out.sort((a, b) => b.sortKey - a.sortKey);
  return out.map((entry) => entry.candidato);
}
