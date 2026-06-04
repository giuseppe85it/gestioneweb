/**
 * PROMPT 45 T1 — Helper per leggere le manutenzioni "candidate al merge" da una
 * segnalazione/controllo KO: stessa targa, stato aperto (daFare / programmata),
 * finestra temporale configurabile (default 90 giorni).
 *
 * Non scrive nulla. Reader puro su `@manutenzioni`.
 * Decisione PROMPT 45 (confermata da Giuseppe): le manutenzioni gia' eseguite o
 * chiuse_da_evento NON sono candidate. Per allineare record storici (es. TI298409)
 * Giuseppe interviene a mano via form Modifica (T4), non via merge.
 */

import { getItemSync } from "../../utils/storageSync";
import { parseAnyDate, toISO } from "./dateUnica";
import { readLegamiOrigine } from "./cicloLegame";

export type ManutenzioneCandidataMerge = {
  id: string;
  targa: string;
  descrizione: string;
  stato: "daFare" | "programmata";
  dataInserimentoIso: string | null;
  dataProgrammataIso: string | null;
  origineTipo: string | null;
  origineRefId: string | null;
  origineRefsCount: number;
};

const MANUTENZIONI_KEY = "@manutenzioni";
const DEFAULT_FINESTRA_GG = 90;
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

function readStato(record: RawRecord): "daFare" | "programmata" | null {
  const stato = normalizeText(record.stato).toLowerCase();
  if (stato === "dafare") return "daFare";
  if (stato === "programmata") return "programmata";
  return null;
}

function readDataApertura(record: RawRecord): Date | null {
  const candidates = [
    record.dataInserimento,
    record.createdAt,
    record.timestamp,
    record.dataProgrammata,
    record.data,
  ];
  for (const candidate of candidates) {
    const parsed = parseAnyDate(candidate);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * Restituisce le manutenzioni candidabili al merge per la targa indicata.
 *
 * Filtri:
 *  - targa normalizzata uppercase === input
 *  - stato in {"daFare", "programmata"} (non eseguite/chiuse)
 *  - dataInserimento/createdAt/timestamp/dataProgrammata entro `finestraGiorni`
 *    a partire da ora (record senza alcuna data sono comunque inclusi: meglio
 *    mostrarli e farli scartare dall'utente che escluderli silenziosamente)
 *
 * Sort: piu' recenti prima (dataInserimento desc, null in fondo).
 */
export async function getManutenzioniCandidateMerge(
  targa: string,
  finestraGiorni: number = DEFAULT_FINESTRA_GG,
): Promise<ManutenzioneCandidataMerge[]> {
  const targaNorm = normalizeTargaUp(targa);
  if (!targaNorm) return [];

  const raw = await getItemSync(MANUTENZIONI_KEY);
  const list = unwrapList(raw);
  const cutoff = Date.now() - finestraGiorni * MS_PER_DAY;

  const filtered: Array<{ candidato: ManutenzioneCandidataMerge; sortKey: number }> = [];
  for (const record of list) {
    const recordTarga = normalizeTargaUp(record.targa);
    if (recordTarga !== targaNorm) continue;
    const stato = readStato(record);
    if (!stato) continue;
    const dataApertura = readDataApertura(record);
    if (dataApertura && dataApertura.getTime() < cutoff) continue;

    const id = normalizeText(record.id);
    if (!id) continue;
    const descrizione = normalizeText(record.descrizione) || "(senza descrizione)";
    const origineTipo = normalizeText(record.origineTipo) || null;
    const origineRefId = normalizeText(record.origineRefId) || null;

    filtered.push({
      candidato: {
        id,
        targa: recordTarga,
        descrizione,
        stato,
        dataInserimentoIso: dataApertura ? toISO(dataApertura) : null,
        dataProgrammataIso: toISO(record.dataProgrammata),
        origineTipo,
        origineRefId,
        origineRefsCount: readLegamiOrigine(record).length,
      },
      sortKey: dataApertura ? dataApertura.getTime() : 0,
    });
  }

  filtered.sort((a, b) => b.sortKey - a.sortKey);
  return filtered.map((entry) => entry.candidato);
}
