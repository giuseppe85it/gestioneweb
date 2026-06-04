/**
 * PROMPT 49 — Hook per leggere il record sorgente (segnalazione/controllo) collegato
 * a una manutenzione tramite back-link `origineRefId`/`origineRefKey`/`origineTipo`.
 *
 * Usato dalle superfici che renderizzano la frase storia di una manutenzione, per
 * cross-leggere data apertura + autore dalla segnalazione/controllo originale.
 *
 * Hook leggero, sincrono al primo render (ritorna null), async-fetch on mount.
 * Quando la manutenzione e' stand-alone (no back-link) o la sorgente non esiste
 * (legame orfano), ritorna null — il chiamante usa il fallback comportamento P45.
 */

import { useEffect, useState } from "react";
import { getItemSync } from "../../utils/storageSync";
import { readLegamiOrigine } from "./cicloLegame";

type RawRecord = Record<string, unknown>;

const SEGNALAZIONI_KEY = "@segnalazioni_autisti_tmp";
const CONTROLLI_KEY = "@controlli_mezzo_autisti";

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

function pickSourceKey(origineTipo: string, origineRefKey: string): string | null {
  // Preferenza: origineRefKey (canonico PROMPT 44 D3). Fallback su origineTipo.
  const key = origineRefKey || "";
  if (key === SEGNALAZIONI_KEY || key === CONTROLLI_KEY) return key;
  const tipo = origineTipo.toLowerCase();
  if (tipo === "segnalazione") return SEGNALAZIONI_KEY;
  if (tipo === "controllo") return CONTROLLI_KEY;
  return null;
}

/**
 * Carica il record sorgente collegato alla manutenzione (se back-link presente).
 *
 * Ritorna:
 *   - `null` quando la manutenzione e' stand-alone o la sorgente non esiste piu' (orfana)
 *   - `RawRecord` quando la sorgente esiste
 */
export function useSorgenteManutenzione(
  manutenzione: RawRecord | null | undefined,
): RawRecord | null {
  return useSorgentiManutenzione(manutenzione)[0] ?? null;
}

export function useSorgentiManutenzione(
  manutenzione: RawRecord | null | undefined,
): RawRecord[] {
  const [sourceRecords, setSourceRecords] = useState<RawRecord[]>([]);
  const legami = readLegamiOrigine(manutenzione);
  const legamiKey = JSON.stringify(legami);

  useEffect(() => {
    let cancelled = false;
    if (legami.length === 0) {
      setSourceRecords([]);
      return undefined;
    }
    (async () => {
      try {
        const foundRecords: RawRecord[] = [];
        for (const legame of legami) {
          const sourceKey = pickSourceKey(legame.tipo, legame.refKey ?? "");
          if (!sourceKey) continue;
          const raw = await getItemSync(sourceKey);
          if (cancelled) return;
          const list = unwrapList(raw);
          const found = list.find((r) => normalizeText(r.id) === legame.refId);
          if (found) {
            foundRecords.push({
              ...found,
              __origineTipo: legame.tipo,
              __origineRefId: legame.refId,
              __origineRefKey: sourceKey,
            });
          }
        }
        if (cancelled) return;
        setSourceRecords(foundRecords);
      } catch {
        // best-effort: il fallback in recordChiusoFromRaw usa il record manutenzione stesso
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [legamiKey]);

  return sourceRecords;
}
