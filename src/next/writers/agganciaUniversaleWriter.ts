/**
 * BUG 65 — "Aggancia universale" (Fase 3: writer).
 *
 * Aggancia, PARTENDO DA UNA MANUTENZIONE, un record qualsiasi:
 *   - target "segnalazione"/"controllo" → DELEGA al writer collaudato
 *     `agganciaSegnalazioneAManutenzioneEsistente` (gestisce gia' back-link,
 *     presa-in-carico e propagazione chiusura). Nessuna logica duplicata.
 *   - target "manutenzione" → scrive il campo nuovo `collegamenti` su ENTRAMBE
 *     le manutenzioni (legame simmetrico), senza toccare gli schemi legame esistenti.
 *   - target "documento" (fattura) → scrive `collegamenti` SOLO lato manutenzione
 *     (asimmetrico): la collezione @documenti_mezzi non e' nel perimetro di scrittura
 *     del barrier per questo path, quindi non la tocchiamo.
 *
 * Nessuna propagazione di chiusura per i casi manutenzione/documento: il
 * collegamento universale e' un semplice legame, separato dalla traccia di chiusura.
 *
 * Scope barrier: riusa `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE` (gia' abilitato per
 * @manutenzioni + @segnalazioni_autisti_tmp + @controlli_mezzo_autisti sui path
 * /next/manutenzioni e /next/centro-controllo).
 */

import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  assertCloneWriteAllowed,
  CloneWriteBlockedError,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";
import {
  CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE,
  agganciaSegnalazioneAManutenzioneEsistente,
} from "./agganciaSegnalazioneAManutenzioneEsistenteWriter";
import { chiudiManutenzioneDaEvento } from "./nextChiusuraEventoWriter";
import {
  addCollegamento,
  defaultRefKeyForTipo,
  removeCollegamento,
  type LegameUniversaleTipo,
} from "../helpers/legamiUniversali";
import { parseAnyDate } from "../helpers/dateUnica";

const MANUTENZIONI_KEY = "@manutenzioni";

const STATI_OPERATIVI = new Set(["dafare", "programmata"]);
const STATI_CHIUSI = new Set(["eseguita", "chiusa", "chiusa_da_evento"]);

function statoOf(record: RawRecord): string {
  return normalizeText(record.stato).toLowerCase();
}

function chiusuraDataMs(record: RawRecord): number | undefined {
  for (const value of [record.dataEsecuzione, record.data, record.chiusuraData]) {
    const parsed = parseAnyDate(value);
    if (parsed) return parsed.getTime();
  }
  return undefined;
}

/**
 * Se delle due manutenzioni una e' operativa (da fare/programmata) e l'altra e'
 * chiusa/eseguita, l'operativa va chiusa: il lavoro e' coperto dall'altra. Eredita
 * la data dalla manutenzione chiusa (mai timestamp da click).
 */
function resolveAutoChiusura(
  recA: RawRecord,
  recB: RawRecord,
): { operativaId: string; altraId: string; chiusuraData?: number } | null {
  const sa = statoOf(recA);
  const sb = statoOf(recB);
  if (STATI_OPERATIVI.has(sa) && STATI_CHIUSI.has(sb)) {
    return { operativaId: normalizeText(recA.id), altraId: normalizeText(recB.id), chiusuraData: chiusuraDataMs(recB) };
  }
  if (STATI_OPERATIVI.has(sb) && STATI_CHIUSI.has(sa)) {
    return { operativaId: normalizeText(recB.id), altraId: normalizeText(recA.id), chiusuraData: chiusuraDataMs(recA) };
  }
  return null;
}

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

export type AgganciaUniversaleTarget = {
  tipo: LegameUniversaleTipo;
  refId: string;
  refKey?: string | null;
};

export type AgganciaUniversaleInput = {
  manutenzioneId: string;
  target: AgganciaUniversaleTarget;
};

export type AgganciaUniversaleResult =
  | { ok: true; alreadyLinked?: boolean }
  | { ok: false; error: string };

function blocked(error: unknown): AgganciaUniversaleResult {
  if (error instanceof CloneWriteBlockedError) {
    return {
      ok: false,
      error:
        "Scrittura bloccata dal barrier clone (aggancia universale). Verificare che la pagina sia nel perimetro autorizzato.",
    };
  }
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Errore aggancio.",
  };
}

/**
 * Aggancia un record (qualsiasi tipo) a una manutenzione esistente, partendo da
 * quella manutenzione. Dispatcher: delega o scrive il campo `collegamenti`.
 */
export async function agganciaUniversaleDaManutenzione(
  input: AgganciaUniversaleInput,
): Promise<AgganciaUniversaleResult> {
  const manutenzioneId = normalizeText(input.manutenzioneId);
  if (!manutenzioneId) return { ok: false, error: "ID manutenzione mancante." };
  const targetId = normalizeText(input.target?.refId);
  if (!targetId) return { ok: false, error: "ID record da agganciare mancante." };
  const tipo = input.target.tipo;

  if (tipo === "segnalazione" || tipo === "controllo") {
    const res = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: targetId,
      sorgenteTipo: tipo,
      manutenzioneTargetId: manutenzioneId,
    });
    return res.ok
      ? { ok: true, alreadyLinked: res.alreadyLinked }
      : { ok: false, error: res.error ?? "Aggancio non riuscito." };
  }

  if (tipo === "manutenzione") {
    if (targetId === manutenzioneId) {
      return { ok: false, error: "Una manutenzione non puo' agganciarsi a se stessa." };
    }
    return collegaManutenzioni(manutenzioneId, targetId);
  }

  if (tipo === "documento") {
    return collegaDocumento(manutenzioneId, targetId, input.target.refKey ?? null);
  }

  return { ok: false, error: "Tipo di record non agganciabile." };
}

/** Legame simmetrico manutenzione↔manutenzione sul campo `collegamenti`. */
async function collegaManutenzioni(
  idA: string,
  idB: string,
): Promise<AgganciaUniversaleResult> {
  try {
    const linkResult = await runWithCloneWriteScopedAllowance(
      CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE,
      async (): Promise<
        | { ok: true; recA: RawRecord; recB: RawRecord }
        | { ok: false; error: string }
      > => {
        const list = unwrapList(await getItemSync(MANUTENZIONI_KEY));
        const recA = list.find((r) => normalizeText(r.id) === idA);
        const recB = list.find((r) => normalizeText(r.id) === idB);
        if (!recA) return { ok: false, error: "Manutenzione di partenza non trovata." };
        if (!recB) return { ok: false, error: "Manutenzione da agganciare non trovata." };

        const next = list.map((record) => {
          const id = normalizeText(record.id);
          if (id === idA) {
            return {
              ...record,
              ...addCollegamento(record, { tipo: "manutenzione", refId: idB, refKey: MANUTENZIONI_KEY }),
            };
          }
          if (id === idB) {
            return {
              ...record,
              ...addCollegamento(record, { tipo: "manutenzione", refId: idA, refKey: MANUTENZIONI_KEY }),
            };
          }
          return record;
        });

        assertCloneWriteAllowed("storageSync.setItemSync", { key: MANUTENZIONI_KEY });
        await setItemSync(MANUTENZIONI_KEY, next);
        return { ok: true, recA, recB };
      },
    );

    if (!linkResult.ok) return linkResult;

    // Se una delle due e' operativa e l'altra chiusa/eseguita, chiudi l'operativa
    // (il lavoro e' coperto dall'altra) cosi' sparisce dai "Da fare".
    const chiusura = resolveAutoChiusura(linkResult.recA, linkResult.recB);
    if (chiusura && chiusura.operativaId && chiusura.altraId) {
      const chiusuraRes = await chiudiManutenzioneDaEvento(
        chiusura.operativaId,
        "manutenzione_collegata",
        chiusura.altraId,
        chiusura.chiusuraData,
      );
      if (!chiusuraRes.ok) {
        // Il legame e' scritto, ma la da-fare NON e' stata chiusa: avvisa, non
        // dichiarare un falso "ok" (altrimenti resterebbe nei Da fare senza motivo).
        return {
          ok: false,
          error:
            "Collegamento creato, ma la chiusura della manutenzione da fare non e' riuscita: " +
            (chiusuraRes.error ?? "errore sconosciuto."),
        };
      }
    }
    return { ok: true };
  } catch (error: unknown) {
    return blocked(error);
  }
}

/** Legame asimmetrico documento→manutenzione (solo lato manutenzione). */
async function collegaDocumento(
  manutenzioneId: string,
  documentoId: string,
  refKey: string | null,
): Promise<AgganciaUniversaleResult> {
  try {
    return await runWithCloneWriteScopedAllowance(
      CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE,
      async () => {
        const list = unwrapList(await getItemSync(MANUTENZIONI_KEY));
        const target = list.find((r) => normalizeText(r.id) === manutenzioneId);
        if (!target) return { ok: false, error: "Manutenzione non trovata." };

        const next = list.map((record) =>
          normalizeText(record.id) === manutenzioneId
            ? {
                ...record,
                ...addCollegamento(record, {
                  tipo: "documento",
                  refId: documentoId,
                  refKey: refKey || defaultRefKeyForTipo("documento"),
                }),
              }
            : record,
        );

        assertCloneWriteAllowed("storageSync.setItemSync", { key: MANUTENZIONI_KEY });
        await setItemSync(MANUTENZIONI_KEY, next);
        return { ok: true };
      },
    );
  } catch (error: unknown) {
    return blocked(error);
  }
}

/**
 * Sgancia un collegamento del campo `collegamenti` (manutenzione o documento).
 * Per segnalazione/controllo l'unlink resta gestito dai flussi esistenti.
 */
export async function scollegaUniversaleDaManutenzione(
  input: AgganciaUniversaleInput,
): Promise<AgganciaUniversaleResult> {
  const manutenzioneId = normalizeText(input.manutenzioneId);
  if (!manutenzioneId) return { ok: false, error: "ID manutenzione mancante." };
  const targetId = normalizeText(input.target?.refId);
  if (!targetId) return { ok: false, error: "ID record mancante." };
  const tipo = input.target.tipo;
  if (tipo !== "manutenzione" && tipo !== "documento") {
    return { ok: false, error: "Sgancio non supportato per questo tipo." };
  }

  try {
    return await runWithCloneWriteScopedAllowance(
      CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE,
      async () => {
        const list = unwrapList(await getItemSync(MANUTENZIONI_KEY));
        const next = list.map((record) => {
          const id = normalizeText(record.id);
          if (id === manutenzioneId) {
            const cleaned = { ...record, ...removeCollegamento(record, { tipo, refId: targetId }) };
            return reopenIfChiusaDaCollegamento(cleaned, targetId);
          }
          // Lato reciproco solo per manutenzione↔manutenzione.
          if (tipo === "manutenzione" && id === targetId) {
            const cleaned = {
              ...record,
              ...removeCollegamento(record, { tipo: "manutenzione", refId: manutenzioneId }),
            };
            return reopenIfChiusaDaCollegamento(cleaned, manutenzioneId);
          }
          return record;
        });
        assertCloneWriteAllowed("storageSync.setItemSync", { key: MANUTENZIONI_KEY });
        await setItemSync(MANUTENZIONI_KEY, next);
        return { ok: true };
      },
    );
  } catch (error: unknown) {
    return blocked(error);
  }
}

/**
 * Se la manutenzione era stata chiusa proprio da questo aggancio
 * (chiusuraDi="manutenzione_collegata" verso l'altro id), scollegandola la riapre.
 */
function reopenIfChiusaDaCollegamento(record: RawRecord, altroId: string): RawRecord {
  const chiusuraDi = normalizeText(record.chiusuraDi);
  const chiusuraRefId = normalizeText(record.chiusuraRefId);
  if (chiusuraDi === "manutenzione_collegata" && chiusuraRefId === normalizeText(altroId)) {
    return { ...record, stato: "daFare", chiusuraDi: null, chiusuraRefId: null, chiusuraData: null };
  }
  return record;
}
