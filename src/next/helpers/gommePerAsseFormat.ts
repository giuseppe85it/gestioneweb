import type { NextGommePerAsseStatus } from "../domain/nextManutenzioniGommeDomain";

type GommePerAsseLike = Pick<
  NextGommePerAsseStatus,
  "dataCambio" | "dataCambioPrecedente" | "kmDurataSetPrecedente"
>;

/**
 * Card "Stato gomme per asse" condivisa da Dossier (Centro di comando) e Scheda
 * mezzo, cosi' le due pagine mostrano LA STESSA card.
 *
 * Set ATTUALE: solo quando e' stato montato. I km percorsi finora NON si mostrano
 * (le gomme sono ancora su): la durata interessa solo quando vengono cambiate, e
 * compare allora come "set precedente".
 */
export function gommePerAsseSetAttualeMeta(
  item: GommePerAsseLike,
  formatDate: (value: string) => string,
): string {
  const dataLabel = item.dataCambio ? formatDate(item.dataCambio) : null;
  return dataLabel ? `Montate il ${dataLabel} · in uso` : "Gomme attuali in uso";
}

/**
 * Durata del set di gomme PRECEDENTE sull'asse (quello sostituito all'ultimo
 * cambio): "Precedenti (ANNO): durate X km". Null se non c'e' un cambio
 * precedente o i km non sono disponibili.
 */
export function gommePerAsseSetPrecedenteMeta(item: GommePerAsseLike): string | null {
  if (
    typeof item.kmDurataSetPrecedente !== "number" ||
    !Number.isFinite(item.kmDurataSetPrecedente)
  ) {
    return null;
  }
  const km = item.kmDurataSetPrecedente.toLocaleString("it-CH");
  const match = String(item.dataCambioPrecedente ?? "").match(/(\d{4})/);
  const anno = match ? match[1] : null;
  return anno ? `Precedenti (${anno}): durate ${km} km` : `Precedenti: durate ${km} km`;
}
