# Continuity Report - `Capo Mezzi` loop fix

- Timestamp: `2026-03-31 10:23 Europe/Rome`
- Stato lasciato dal run:
  - `/next/capo/mezzi` monta `NextCapoMezziPage` madre-like;
  - il runtime ufficiale legge `readNextCapoMezziSnapshot({ includeCloneDocuments: false })`, quindi senza documenti clone-only nel riepilogo costi;
  - il modulo resta di sola lettura e apre solo il dettaglio costi NEXT per targa.
- Audit separato: `PASS`
- Tracker aggiornato: `Capo Mezzi -> CLOSED`
- Prossimo modulo da affrontare: `Capo Costi`
