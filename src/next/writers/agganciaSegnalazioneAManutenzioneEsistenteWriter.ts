/**
 * PROMPT 47 T1 — Writer "Aggancia segnalazione/controllo a manutenzione esistente"
 * (flusso lato Centro Controllo / Archivio Storico, inverso di PROMPT 45 T1 admin).
 *
 * A differenza di `agganciaSorgenteAManutenzioneEsistente` (PROMPT 45) che filtra solo
 * manutenzioni daFare/programmata, questo writer:
 *   - accetta target con QUALUNQUE stato (anche `eseguita`/`chiusa_da_evento`)
 *   - se target ha gia' uno stato di chiusura, **propaga automaticamente la chiusura**
 *     alla sorgente via `chiudiSegnalazioneDaEvento`/`chiudiControlloDaEvento`
 *   - scrive anche il back-link `origineTipo/origineRefId/origineRefKey` sul target
 *     solo se il target e' stand-alone (`origineTipo == null`); altrimenti rifiuta
 *     con errore esplicito (no sovrascrittura silenziosa)
 *   - supporta il caso "cambia legame" / "sostituisci link orfano": sovrascrive
 *     `linkedLavoroId` sulla sorgente
 *
 * Idempotenza: se la sorgente e' gia' linked al target, ritorna `alreadyLinked: true`.
 * Scope barrier: `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE` (nuovo, dedicato).
 */

import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  assertCloneWriteAllowed,
  CloneWriteBlockedError,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";
import {
  addLegameOrigine,
  readLegameLavoro,
  readLegamiOrigine,
  removeLegameOrigine,
  writeLegameLavoro,
  type LegameOrigineRef,
} from "../helpers/cicloLegame";
import {
  chiudiControlloDaEvento,
  chiudiSegnalazioneDaEvento,
} from "./nextChiusuraEventoWriter";

export const CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE = "centro_controllo_legame_write";

const MANUTENZIONI_KEY = "@manutenzioni";
const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";

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

function targaFromRecord(record: RawRecord): string {
  return (
    normalizeTargaUp(record.targa) ||
    normalizeTargaUp(record.targaCamion) ||
    normalizeTargaUp(record.targaMotrice) ||
    normalizeTargaUp(record.targaRimorchio)
  );
}

function isTargetEseguitaOChiusa(target: RawRecord): boolean {
  const stato = normalizeText(target.stato).toLowerCase();
  if (stato === "eseguita" || stato === "chiusa_da_evento") return true;
  if (normalizeText(target.chiusuraDi)) return true;
  return false;
}

/**
 * PROMPT 50 R1 — Ricava il timestamp di chiusura da propagare alla sorgente.
 *
 * Priorita':
 *   1. `target.chiusuraData` (ms) — quando il target e' gia' `chiusa_da_evento` con
 *      timestamp esplicito.
 *   2. `target.data` (ISO "yyyy-mm-dd" o legacy) — la data della manutenzione,
 *      semanticamente corretta come "data esecuzione" da ereditare sulla sorgente.
 *   3. `undefined` (lascia che il chiamante NON usi Date.now() come fallback).
 *
 * **Nessun fallback a Date.now()**: la regola PROMPT 50 R1 dice esplicitamente che
 * `chiusuraData` deve EREDITARE dal record manutenzione, mai venire dall'ora del
 * click. Se nemmeno `target.data` e' parsabile, il writer chiamato gestira'
 * l'assenza in modo coerente (vedi `buildChiusuraPatch` che usa ancora Date.now()
 * solo se chiamato senza argomenti — caso non piu' applicabile qui).
 */
function readChiusuraDataMs(target: RawRecord): number | undefined {
  const raw = target.chiusuraData;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  // PROMPT 50 R1: eredita dalla `data` della manutenzione target (campo ISO canonico).
  const dataRaw = target.data;
  if (typeof dataRaw === "string" && dataRaw.trim()) {
    // ISO breve "2026-05-12" → parse a mezzanotte locale
    const iso = dataRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const dt = new Date(
        Number(iso[1]),
        Number(iso[2]) - 1,
        Number(iso[3]),
        0,
        0,
        0,
        0,
      );
      if (Number.isFinite(dt.getTime())) return dt.getTime();
    }
    const parsed = Date.parse(dataRaw);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof dataRaw === "number" && Number.isFinite(dataRaw)) return dataRaw;
  return undefined;
}

function buildOrigineRef(
  sorgenteTipo: "segnalazione" | "controllo",
  sorgenteId: string,
  sourceKey: string,
): LegameOrigineRef {
  return {
    tipo: sorgenteTipo,
    refId: sorgenteId,
    refKey: sourceKey,
  };
}

function hasOrigineRef(record: RawRecord, legame: LegameOrigineRef): boolean {
  return readLegamiOrigine(record).some(
    (entry) =>
      entry.tipo === legame.tipo &&
      entry.refId === legame.refId &&
      normalizeText(entry.refKey) === normalizeText(legame.refKey),
  );
}

function removeSourceFromMaintenance(record: RawRecord, legame: LegameOrigineRef): RawRecord {
  return {
    ...record,
    ...removeLegameOrigine(record, legame),
  };
}

function addSourceToMaintenance(record: RawRecord, legame: LegameOrigineRef): RawRecord {
  return {
    ...record,
    ...addLegameOrigine(record, legame),
  };
}

export type AgganciaSegnalazioneInput = {
  /** ID della segnalazione o controllo da agganciare. */
  sorgenteId: string;
  /** Tipo di sorgente. */
  sorgenteTipo: "segnalazione" | "controllo";
  /** ID della manutenzione esistente a cui agganciare. */
  manutenzioneTargetId: string;
};

export type AgganciaSegnalazioneResult = {
  ok: boolean;
  error?: string;
  manutenzioneId?: string;
  alreadyLinked?: boolean;
  chiusuraPropagata?: boolean;
  /** Quando si "cambia legame", id del legame precedente. */
  previousLinkedId?: string | null;
  previousLinkedIds?: string[];
};

export type AgganciaSegnalazioniBatchInput = {
  sorgenti: Array<Pick<AgganciaSegnalazioneInput, "sorgenteId" | "sorgenteTipo">>;
  manutenzioneTargetId: string;
};

export type AgganciaSegnalazioniBatchResult = {
  ok: boolean;
  manutenzioneId: string;
  successes: AgganciaSegnalazioneResult[];
  failures: Array<{ sorgenteId: string; sorgenteTipo: "segnalazione" | "controllo"; error: string }>;
};

function blockedResult(error: unknown): AgganciaSegnalazioneResult {
  if (error instanceof CloneWriteBlockedError) {
    return {
      ok: false,
      error:
        "Scrittura bloccata dal barrier clone (centro controllo aggancia legame). Verificare che la pagina sia nel perimetro autorizzato.",
    };
  }
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Errore aggancio segnalazione a manutenzione esistente.",
  };
}

/**
 * Aggancia una segnalazione (o controllo) a una manutenzione esistente per la stessa targa.
 *
 * Path principali:
 *  - sorgente senza legame -> aggancia: scrivi forward-link + back-link (se target stand-alone)
 *  - sorgente con legame al medesimo target -> alreadyLinked
 *  - sorgente con legame ad altro target -> sostituisce il forward-link (caso "cambia legame")
 *  - target gia' chiuso/eseguito -> propaga la chiusura sulla sorgente
 *  - target con back-link a sorgente diversa -> rifiuto esplicito (no sovrascrittura silenziosa)
 *  - targa non coerente sorgente/target -> rifiuto esplicito (safety net)
 */
export async function agganciaSegnalazioneAManutenzioneEsistente(
  input: AgganciaSegnalazioneInput,
): Promise<AgganciaSegnalazioneResult> {
  const sorgenteId = normalizeText(input.sorgenteId);
  if (!sorgenteId) return { ok: false, error: "ID sorgente mancante." };
  const targetId = normalizeText(input.manutenzioneTargetId);
  if (!targetId) return { ok: false, error: "ID manutenzione target mancante." };
  if (input.sorgenteTipo !== "segnalazione" && input.sorgenteTipo !== "controllo") {
    return { ok: false, error: "Tipo sorgente non valido." };
  }

  const sourceKey = input.sorgenteTipo === "segnalazione" ? SEGNALAZIONI_KEY : CONTROLLI_KEY;

  // Step 1 — patch sorgente + (eventuale) back-link target. Tutto in un solo scope.
  let propagaChiusura = false;
  let chiusuraDataMs: number | undefined;
  let previousLinkedId: string | null = null;
  let alreadyLinked = false;

  try {
    const stepResult = await runWithCloneWriteScopedAllowance(
      CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE,
      async () => {
        // Leggi target
        const manutenzioniRaw = await getItemSync(MANUTENZIONI_KEY);
        const manutenzioniList = unwrapList(manutenzioniRaw);
        const targetIndex = manutenzioniList.findIndex(
          (record) => normalizeText(record.id) === targetId,
        );
        if (targetIndex < 0) {
          return { ok: false, error: "Manutenzione target non trovata." } as AgganciaSegnalazioneResult;
        }
        const target = manutenzioniList[targetIndex];
        const targaTarget = normalizeTargaUp(target.targa);

        // Leggi sorgente
        const sourceRaw = await getItemSync(sourceKey);
        const sourceList = unwrapList(sourceRaw);
        const sourceIndex = sourceList.findIndex((record) => normalizeText(record.id) === sorgenteId);
        if (sourceIndex < 0) {
          return { ok: false, error: "Sorgente non trovata." } as AgganciaSegnalazioneResult;
        }
        const sourceRecord = sourceList[sourceIndex];
        const targaSorgente = targaFromRecord(sourceRecord);
        if (!targaSorgente) {
          return { ok: false, error: "Targa sorgente non disponibile." } as AgganciaSegnalazioneResult;
        }
        if (targaTarget && targaTarget !== targaSorgente) {
          return {
            ok: false,
            error: `Targa target (${targaTarget}) diversa dalla sorgente (${targaSorgente}).`,
          } as AgganciaSegnalazioneResult;
        }

        const origineRef = buildOrigineRef(input.sorgenteTipo, sorgenteId, sourceKey);

        // Idempotenza: se sorgente gia' linked al target e il target ha gia' il back-link -> no-op
        const linkedExisting = readLegameLavoro(sourceRecord);
        if (
          linkedExisting.length === 1 &&
          linkedExisting[0] === targetId &&
          hasOrigineRef(target, origineRef)
        ) {
          alreadyLinked = true;
          return {
            ok: true,
            manutenzioneId: targetId,
            alreadyLinked: true,
          } as AgganciaSegnalazioneResult;
        }

        // Salva precedente per il result (caso "cambia legame")
        previousLinkedId = linkedExisting.length > 0 ? linkedExisting[0] : null;
        const previousLinkedIds = linkedExisting.filter((id) => id !== targetId);
        let nextManutenzioniList = [...manutenzioniList];
        let manutenzioniChanged = false;

        for (const oldId of previousLinkedIds) {
          const oldIndex = nextManutenzioniList.findIndex(
            (record) => normalizeText(record.id) === oldId,
          );
          if (oldIndex < 0) continue;
          nextManutenzioniList[oldIndex] = removeSourceFromMaintenance(
            nextManutenzioniList[oldIndex],
            origineRef,
          );
          manutenzioniChanged = true;
        }

        const currentTarget = nextManutenzioniList[targetIndex];
        nextManutenzioniList[targetIndex] = addSourceToMaintenance(currentTarget, origineRef);
        manutenzioniChanged = true;

        // Patch sorgente: forward-link + flag stato.
        // PROMPT 50 R2: `dataPresaInCarico` NON viene scritta qui (era effetto
        // collaterale dell'aggancio). E' valorizzata solo da
        // `segnaPresaInCaricoSegnalazione` (azione utente esplicita "Prendi in carico").
        // Lo stato "presa_in_carico" resta scritto perche' e' lo stato logico del
        // record dopo l'aggancio (= ha una manutenzione collegata in lavorazione),
        // ma non implica un timestamp di presa in carico.
        const sourceBasePatch: RawRecord = {
          ...sourceRecord,
          ...writeLegameLavoro([targetId]),
          letta: true,
        };
        if (input.sorgenteTipo === "segnalazione") {
          sourceBasePatch.stato = "presa_in_carico";
        }

        // Scrivi
        const nextSourceList = [...sourceList];
        nextSourceList[sourceIndex] = sourceBasePatch;
        assertCloneWriteAllowed("storageSync.setItemSync", { key: sourceKey });
        await setItemSync(sourceKey, nextSourceList);

        if (manutenzioniChanged) {
          assertCloneWriteAllowed("storageSync.setItemSync", { key: MANUTENZIONI_KEY });
          await setItemSync(MANUTENZIONI_KEY, nextManutenzioniList);
        }

        // Decide se propagare la chiusura: NON la facciamo qui (apriamo un altro scope dopo)
        if (isTargetEseguitaOChiusa(target)) {
          propagaChiusura = true;
          chiusuraDataMs = readChiusuraDataMs(target);
        }

        return {
          ok: true,
          manutenzioneId: targetId,
          previousLinkedId,
          previousLinkedIds,
        } as AgganciaSegnalazioneResult;
      },
    );

    if (!stepResult.ok || stepResult.alreadyLinked) {
      return stepResult;
    }
  } catch (error: unknown) {
    return blockedResult(error);
  }

  // Step 2 — propagazione chiusura (apre il proprio scope CHIUSURA_DA_EVENTO_WRITE_SCOPE).
  // Idempotente: se la sorgente e' gia' chiusa, scrive lo stesso patch (no errore).
  if (propagaChiusura) {
    try {
      const propRes =
        input.sorgenteTipo === "segnalazione"
          ? await chiudiSegnalazioneDaEvento(sorgenteId, "manutenzione", targetId, chiusuraDataMs)
          : await chiudiControlloDaEvento(sorgenteId, "manutenzione", targetId, chiusuraDataMs);
      if (!propRes.ok) {
        // Forward-link gia' scritto; segnaliamo errore parziale.
        return {
          ok: false,
          error: `Aggancio scritto ma propagazione chiusura fallita: ${propRes.error ?? "errore sconosciuto"}.`,
          manutenzioneId: targetId,
          previousLinkedId: alreadyLinked ? undefined : previousLinkedId,
        };
      }
    } catch (error: unknown) {
      return blockedResult(error);
    }
  }

  return {
    ok: true,
    manutenzioneId: targetId,
    alreadyLinked: false,
    chiusuraPropagata: propagaChiusura,
    previousLinkedId,
    previousLinkedIds: previousLinkedId ? [previousLinkedId] : [],
  };
}

export async function agganciaSegnalazioniAManutenzioneEsistenteBatch(
  input: AgganciaSegnalazioniBatchInput,
): Promise<AgganciaSegnalazioniBatchResult> {
  const targetId = normalizeText(input.manutenzioneTargetId);
  const successes: AgganciaSegnalazioneResult[] = [];
  const failures: AgganciaSegnalazioniBatchResult["failures"] = [];

  for (const sorgente of input.sorgenti) {
    const result = await agganciaSegnalazioneAManutenzioneEsistente({
      sorgenteId: sorgente.sorgenteId,
      sorgenteTipo: sorgente.sorgenteTipo,
      manutenzioneTargetId: targetId,
    });
    if (result.ok) {
      successes.push(result);
    } else {
      failures.push({
        sorgenteId: sorgente.sorgenteId,
        sorgenteTipo: sorgente.sorgenteTipo,
        error: result.error || "Errore aggancio sorgente.",
      });
    }
  }

  return {
    ok: failures.length === 0,
    manutenzioneId: targetId,
    successes,
    failures,
  };
}
