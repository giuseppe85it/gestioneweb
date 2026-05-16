/**
 * PROMPT 47 T2 — Writer "Sgancia legame orfano" sulla sorgente (segnalazione/controllo).
 *
 * Scenario: la sorgente ha `linkedLavoroId`/`linkedLavoroIds` valorizzato a un id di
 * manutenzione che NON esiste in `@manutenzioni` (record cancellato manualmente in
 * passato come "record fantasma" PROMPT 41/42). L'UI mostra la sorgente come
 * `presa_in_carico` senza azione possibile.
 *
 * Questo writer:
 *  1. Verifica che il legame sia EFFETTIVAMENTE orfano (re-check anti-race)
 *  2. Cancella `linkedLavoroId/Ids/Multiple` e `dataPresaInCarico` sulla sorgente
 *  3. Riporta lo stato:
 *     - segnalazione: stato="nuova", letta=false
 *     - controllo: letta=false (no campo stato)
 *  4. NON tocca `chiusuraDi/chiusuraRefId/chiusuraData` (campi separati di traccia chiusura,
 *     non gestiti da questo writer)
 *  5. NON tocca descrizione, targa, autistaNome, ecc.
 *
 * Idempotente: se la sorgente non ha legami, ritorna `alreadyClean: true`.
 * Se il legame esiste ma NON e' orfano (target presente), errore esplicito: l'utente
 * deve usare "Cambia legame" invece.
 *
 * Scope barrier: `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE` (condiviso con il writer T1).
 */

import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  assertCloneWriteAllowed,
  CloneWriteBlockedError,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";
import { isLegameOrfano, readLegameLavoro } from "../helpers/cicloLegame";
import { CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE } from "./agganciaSegnalazioneAManutenzioneEsistenteWriter";

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

export type SganciaLegameOrfanoInput = {
  sorgenteId: string;
  sorgenteTipo: "segnalazione" | "controllo";
};

export type SganciaLegameOrfanoResult = {
  ok: boolean;
  error?: string;
  alreadyClean?: boolean;
};

function blockedResult(error: unknown): SganciaLegameOrfanoResult {
  if (error instanceof CloneWriteBlockedError) {
    return {
      ok: false,
      error:
        "Scrittura bloccata dal barrier clone (sgancio legame orfano). Verificare che la pagina sia nel perimetro autorizzato.",
    };
  }
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Errore sgancio legame orfano.",
  };
}

export async function sganciaLegameOrfano(
  input: SganciaLegameOrfanoInput,
): Promise<SganciaLegameOrfanoResult> {
  const sorgenteId = normalizeText(input.sorgenteId);
  if (!sorgenteId) return { ok: false, error: "ID sorgente mancante." };
  if (input.sorgenteTipo !== "segnalazione" && input.sorgenteTipo !== "controllo") {
    return { ok: false, error: "Tipo sorgente non valido." };
  }

  const sourceKey = input.sorgenteTipo === "segnalazione" ? SEGNALAZIONI_KEY : CONTROLLI_KEY;

  try {
    return await runWithCloneWriteScopedAllowance(
      CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE,
      async () => {
        const sourceRaw = await getItemSync(sourceKey);
        const sourceList = unwrapList(sourceRaw);
        const sourceIndex = sourceList.findIndex(
          (record) => normalizeText(record.id) === sorgenteId,
        );
        if (sourceIndex < 0) {
          return { ok: false, error: "Sorgente non trovata." } as SganciaLegameOrfanoResult;
        }
        const sourceRecord = sourceList[sourceIndex];

        const linked = readLegameLavoro(sourceRecord);
        if (linked.length === 0) {
          return { ok: true, alreadyClean: true } as SganciaLegameOrfanoResult;
        }

        // Re-check anti-race: ricarica @manutenzioni e verifica orfanita'.
        const manuRaw = await getItemSync(MANUTENZIONI_KEY);
        const manuList = unwrapList(manuRaw);
        if (!isLegameOrfano(sourceRecord, manuList)) {
          return {
            ok: false,
            error:
              "Il legame non e' orfano: la manutenzione collegata esiste. Usa 'Cambia legame' invece di 'Sgancia'.",
          } as SganciaLegameOrfanoResult;
        }

        // Patch: cancella linkedLavoroId/Ids/Multiple + dataPresaInCarico + ripristina stato.
        const next: RawRecord = {
          ...sourceRecord,
          linkedLavoroId: null,
          linkedLavoroIds: null,
          linkedMultiple: false,
          dataPresaInCarico: null,
          letta: false,
        };
        if (input.sorgenteTipo === "segnalazione") {
          next.stato = "nuova";
        }

        const nextList = [...sourceList];
        nextList[sourceIndex] = next;
        assertCloneWriteAllowed("storageSync.setItemSync", { key: sourceKey });
        await setItemSync(sourceKey, nextList);

        return { ok: true } as SganciaLegameOrfanoResult;
      },
    );
  } catch (error: unknown) {
    return blockedResult(error);
  }
}
