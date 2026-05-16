/**
 * PROMPT 44 — D6: etichetta "Storico" per stati di manutenzione vuoti/null.
 *
 * 55/73 record `@manutenzioni` hanno `stato` "(vuoto)": sono record legacy
 * migrati pre-stato. Decisione (Giuseppe): etichetta SOLO display, zero
 * scritture Firestore. Questo helper centralizza il fallback.
 *
 * Uso esclusivo per la PRESENTAZIONE: non passare il risultato a writer/filter
 * (perderesti il valore reale "" / null).
 */

export function formatStatoManutenzione(stato: unknown): string {
  if (stato === null || stato === undefined) return "Storico";
  if (typeof stato !== "string") return "Storico";
  const trimmed = stato.trim();
  if (trimmed === "") return "Storico";
  return trimmed;
}
