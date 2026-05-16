/**
 * PROMPT 50 R2 — Writer esplicito "Segna presa in carico" su una segnalazione.
 *
 * Questa e' l'**unica funzione** autorizzata a scrivere `dataPresaInCarico` sui record
 * di `@segnalazioni_autisti_tmp`. Va invocata SOLO da un'azione utente esplicita
 * (bottone "Prendi in carico" — UI da costruire dove necessario).
 *
 * Storicamente (PROMPT 44 D7) `dataPresaInCarico` veniva scritta come effetto
 * collaterale di `patchSegnalazione` (creazione daFare da segnalazione) e poi anche
 * dell'aggancio inverso PROMPT 47. Il risultato: il timestamp finiva per essere
 * "data click admin", non "data reale di presa in carico". La regola PROMPT 50:
 *
 *   TIMESTAMP-MAI-DA-CLICK — i timestamp utente non sono effetti collaterali di
 *   operazioni non temporali. Solo azioni esplicite producono timestamp.
 *
 * Idempotente: se `dataPresaInCarico` e' gia' valorizzata, ritorna `alreadyMarked`.
 * Scope barrier: `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE` (riusa la deroga PROMPT 47/48).
 */

import { getItemSync, setItemSync } from "../../utils/storageSync";
import {
  assertCloneWriteAllowed,
  CloneWriteBlockedError,
  runWithCloneWriteScopedAllowance,
} from "../../utils/cloneWriteBarrier";
import { toISO } from "../helpers/dateUnica";
import { CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE } from "./agganciaSegnalazioneAManutenzioneEsistenteWriter";

const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";

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

export type SegnaPresaInCaricoInput = {
  segnalazioneId: string;
  /**
   * Timestamp ISO o ms della presa in carico. Default: `toISO(new Date())` —
   * accettato solo perche' questa funzione e' invocata da azione utente esplicita
   * (il click dell'admin "Prendi in carico" e' semanticamente "ora").
   */
  dataPresaInCarico?: string;
};

export type SegnaPresaInCaricoResult = {
  ok: boolean;
  error?: string;
  alreadyMarked?: boolean;
};

function blockedResult(error: unknown): SegnaPresaInCaricoResult {
  if (error instanceof CloneWriteBlockedError) {
    return {
      ok: false,
      error: "Scrittura bloccata dal barrier clone (presa in carico segnalazione).",
    };
  }
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Errore presa in carico segnalazione.",
  };
}

export async function segnaPresaInCaricoSegnalazione(
  input: SegnaPresaInCaricoInput,
): Promise<SegnaPresaInCaricoResult> {
  const id = normalizeText(input.segnalazioneId);
  if (!id) return { ok: false, error: "ID segnalazione mancante." };

  const dataPresaInCarico = input.dataPresaInCarico ?? toISO(new Date());

  try {
    return await runWithCloneWriteScopedAllowance(
      CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE,
      async () => {
        const raw = await getItemSync(SEGNALAZIONI_KEY);
        const list = unwrapList(raw);
        const idx = list.findIndex((r) => normalizeText(r.id) === id);
        if (idx < 0) {
          return { ok: false, error: "Segnalazione non trovata." } as SegnaPresaInCaricoResult;
        }
        const existing = normalizeText(list[idx].dataPresaInCarico);
        if (existing) {
          return { ok: true, alreadyMarked: true } as SegnaPresaInCaricoResult;
        }
        const next: RawRecord = {
          ...list[idx],
          dataPresaInCarico,
          letta: true,
        };
        // Mantieni stato coerente: se gia' "presa_in_carico" o "chiusa", lascia.
        // Se "nuova", promuovi a "presa_in_carico".
        const stato = normalizeText(list[idx].stato).toLowerCase();
        if (stato === "nuova" || stato === "") {
          next.stato = "presa_in_carico";
        }
        const nextList = [...list];
        nextList[idx] = next;
        assertCloneWriteAllowed("storageSync.setItemSync", { key: SEGNALAZIONI_KEY });
        await setItemSync(SEGNALAZIONI_KEY, nextList);
        return { ok: true } as SegnaPresaInCaricoResult;
      },
    );
  } catch (error: unknown) {
    return blockedResult(error);
  }
}
