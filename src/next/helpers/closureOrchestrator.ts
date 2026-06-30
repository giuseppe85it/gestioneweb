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

import { getItemSync } from "../../utils/storageSync";
import { readLegameLavoro, readLegamiOrigine, type LegameOrigineRef } from "./cicloLegame";
import {
  chiudiControlloDaEvento,
  chiudiSegnalazioneDaEvento,
  type ChiusuraDaEventoResult,
} from "../writers/nextChiusuraEventoWriter";

type RawRecord = Record<string, unknown>;

const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const MANUTENZIONI_KEY = "@manutenzioni";

function isRecord(value: unknown): value is RawRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function unwrapList(raw: unknown): RawRecord[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.value)) return (raw.value as unknown[]).filter(isRecord);
  if (isRecord(raw) && Array.isArray(raw.items)) return (raw.items as unknown[]).filter(isRecord);
  return [];
}

function isManutenzioneFatta(record: RawRecord): boolean {
  const stato = normalizeText(record.stato).toLowerCase();
  if (stato === "eseguita" || stato === "chiusa_da_evento" || stato === "chiusa") return true;
  return normalizeText(record.chiusuraDi).length > 0;
}

/**
 * BUG B — un controllo "entrambi"/multi-KO ha N manutenzioni collegate e va chiuso
 * SOLO quando TUTTE sono fatte. La manutenzione che innesca la propagazione
 * (`justClosedId`) conta come fatta anche se non ancora persistita. Se una collegata
 * non esiste piu' (cancellata) non blocca. Reader puro.
 */
async function tutteLeManutenzioniDelControlloChiuse(
  controlloId: string,
  justClosedId: string,
): Promise<boolean> {
  const controllo = unwrapList(await getItemSync(CONTROLLI_KEY)).find(
    (c) => normalizeText(c.id) === controlloId,
  );
  if (!controllo) return true;
  const altriIds = readLegameLavoro(controllo).filter((id) => id && id !== justClosedId);
  if (altriIds.length === 0) return true;
  const byId = new Map(
    unwrapList(await getItemSync(MANUTENZIONI_KEY)).map((m) => [normalizeText(m.id), m] as const),
  );
  for (const id of altriIds) {
    const rec = byId.get(id);
    if (rec && !isManutenzioneFatta(rec)) return false;
  }
  return true;
}

export type PropagazioneEsito =
  | {
      ok: true;
      propagated: false;
      reason: "no-legame";
      propagatedCount: 0;
      failures: [];
    }
  | {
      ok: true;
      propagated: true;
      propagatedCount: number;
      targets: Array<{ targetTipo: LegameOrigineRef["tipo"]; targetId: string }>;
      failures: [];
      targetTipo?: LegameOrigineRef["tipo"];
      targetId?: string;
    }
  | {
      ok: false;
      propagated: boolean;
      reason: string;
      propagatedCount: number;
      targets: Array<{ targetTipo: LegameOrigineRef["tipo"]; targetId: string }>;
      failures: Array<{ targetTipo: LegameOrigineRef["tipo"]; targetId: string; reason: string }>;
      targetTipo?: LegameOrigineRef["tipo"];
      targetId?: string;
    };

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
    return { ok: true, propagated: false, reason: "no-legame", propagatedCount: 0, failures: [] };
  }
  const manutenzioneId = normalizeText(manutenzioneRecord.id);
  if (!manutenzioneId) {
    return { ok: true, propagated: false, reason: "no-legame", propagatedCount: 0, failures: [] };
  }
  const legami = readLegamiOrigine(manutenzioneRecord);
  if (legami.length === 0) {
    return { ok: true, propagated: false, reason: "no-legame", propagatedCount: 0, failures: [] };
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

  const targets: Array<{ targetTipo: LegameOrigineRef["tipo"]; targetId: string }> = [];
  const failures: Array<{ targetTipo: LegameOrigineRef["tipo"]; targetId: string; reason: string }> = [];

  for (const legame of legami) {
    let result: ChiusuraDaEventoResult;
    if (legame.tipo === "segnalazione") {
      result = await chiudiSegnalazioneDaEvento(
        legame.refId,
        "manutenzione",
        manutenzioneId,
        chiusuraData,
      );
    } else {
      // BUG B — chiudi il controllo SOLO se tutte le sue manutenzioni collegate sono
      // fatte: un controllo "entrambi" (motrice+rimorchio) non deve sparire quando si
      // esegue solo una delle due manutenzioni (l'altra resterebbe da fare e orfana).
      if (!(await tutteLeManutenzioniDelControlloChiuse(legame.refId, manutenzioneId))) {
        continue;
      }
      result = await chiudiControlloDaEvento(
        legame.refId,
        "manutenzione",
        manutenzioneId,
        chiusuraData,
      );
    }

    if (result.ok) {
      targets.push({ targetTipo: legame.tipo, targetId: legame.refId });
    } else {
      failures.push({
        targetTipo: legame.tipo,
        targetId: legame.refId,
        reason: result.error || "Propagazione chiusura sorgente fallita.",
      });
    }
  }

  const firstTarget = targets[0] ?? failures[0] ?? null;
  if (failures.length > 0) {
    return {
      ok: false,
      propagated: targets.length > 0,
      reason: failures.map((failure) => `${failure.targetTipo}/${failure.targetId}: ${failure.reason}`).join("; "),
      propagatedCount: targets.length,
      targets,
      failures,
      ...(firstTarget ? { targetTipo: firstTarget.targetTipo, targetId: firstTarget.targetId } : {}),
    };
  }
  if (targets.length === 0) {
    return { ok: true, propagated: false, reason: "no-legame", propagatedCount: 0, failures: [] };
  }
  return {
    ok: true,
    propagated: true,
    propagatedCount: targets.length,
    targets,
    failures: [],
    targetTipo: targets[0].targetTipo,
    targetId: targets[0].targetId,
  };
}
