/**
 * PROMPT 44 — D1: closure orchestrator.
 *
 * Quando una manutenzione viene chiusa (qualunque modalita' — officina, manuale,
 * evento autisti), propaga la chiusura alla segnalazione/controllo collegato,
 * cosi' che la sorgente non resti "presa_in_carico" per sempre.
 *
 * Il legame viene risolto via `readLegameOrigine` (campi canonici
 * `origineTipo/origineRefId`). La scrittura sulla sorgente riusa i writer
 * `chiudiSegnalazioneDaEvento`/`chiudiControlloDaEvento`: stesso barrier scope,
 * stessi campi `chiusuraDi/chiusuraRefId/chiusuraData`, niente codice nuovo che
 * scriva campi a mano. `tipoEvento="manutenzione"` distingue questa propagazione
 * dalle chiusure native da `gomme_evento`.
 */

import { readLegameOrigine } from "./cicloLegame";
import {
  chiudiControlloDaEvento,
  chiudiSegnalazioneDaEvento,
  type ChiusuraDaEventoResult,
} from "../writers/nextChiusuraEventoWriter";

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

export type PropagazioneEsito =
  | { ok: true; propagated: false; reason: "no-legame" }
  | { ok: true; propagated: true; targetTipo: "segnalazione" | "controllo"; targetId: string }
  | { ok: false; reason: string; targetTipo?: "segnalazione" | "controllo"; targetId?: string };

/**
 * Propaga la chiusura di una manutenzione alla sorgente collegata, se presente.
 *
 * Idempotente: chiamare due volte di seguito scrive lo stesso patch sul record
 * sorgente (i writer `chiudi*DaEvento` si basano su id, no errore).
 */
export async function propagateChiusuraToLegame(
  manutenzioneRecord: unknown,
  options: { chiusuraData?: number } = {},
): Promise<PropagazioneEsito> {
  if (!isRecord(manutenzioneRecord)) {
    return { ok: true, propagated: false, reason: "no-legame" };
  }
  const manutenzioneId = normalizeText(manutenzioneRecord.id);
  if (!manutenzioneId) {
    return { ok: true, propagated: false, reason: "no-legame" };
  }
  const legame = readLegameOrigine(manutenzioneRecord);
  if (!legame || !legame.refId) {
    return { ok: true, propagated: false, reason: "no-legame" };
  }
  // PROMPT 50 R1: chiusuraData EREDITA dalla manutenzione, MAI Date.now() come
  // fallback silenzioso. Priorita': options.chiusuraData (caller esplicito) →
  // manutenzioneRecord.data (campo ISO della manutenzione) → manutenzioneRecord.chiusuraData
  // → Date.now() solo come ultimissima rete (record senza alcun timestamp parsabile).
  let chiusuraData: number;
  if (typeof options.chiusuraData === "number" && Number.isFinite(options.chiusuraData)) {
    chiusuraData = options.chiusuraData;
  } else {
    const dataRaw = manutenzioneRecord.data;
    let derived: number | null = null;
    if (typeof dataRaw === "string" && dataRaw.trim()) {
      const iso = dataRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (iso) {
        const dt = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 0, 0, 0, 0);
        if (Number.isFinite(dt.getTime())) derived = dt.getTime();
      } else {
        const parsed = Date.parse(dataRaw);
        if (Number.isFinite(parsed)) derived = parsed;
      }
    } else if (typeof dataRaw === "number" && Number.isFinite(dataRaw)) {
      derived = dataRaw;
    }
    if (derived === null) {
      const ts = manutenzioneRecord.chiusuraData;
      if (typeof ts === "number" && Number.isFinite(ts)) derived = ts;
    }
    chiusuraData = derived ?? Date.now();
  }

  let result: ChiusuraDaEventoResult;
  let targetTipo: "segnalazione" | "controllo";
  if (legame.tipo === "segnalazione") {
    targetTipo = "segnalazione";
    result = await chiudiSegnalazioneDaEvento(
      legame.refId,
      "manutenzione",
      manutenzioneId,
      chiusuraData,
    );
  } else if (legame.tipo === "controllo") {
    targetTipo = "controllo";
    result = await chiudiControlloDaEvento(
      legame.refId,
      "manutenzione",
      manutenzioneId,
      chiusuraData,
    );
  } else {
    // origineTipo "manuale" o "evento": niente sorgente da chiudere.
    return { ok: true, propagated: false, reason: "no-legame" };
  }

  if (!result.ok) {
    return {
      ok: false,
      reason: result.error || "Propagazione chiusura sorgente fallita.",
      targetTipo,
      targetId: legame.refId,
    };
  }
  return { ok: true, propagated: true, targetTipo, targetId: legame.refId };
}
