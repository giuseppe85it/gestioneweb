# Continuity Report - `Lavori` loop fix

- Timestamp: `2026-03-31 10:14 Europe/Rome`
- Stato lasciato dal run:
  - `/next/lavori-da-eseguire`, `/next/lavori-in-attesa`, `/next/lavori-eseguiti` e `/next/dettagliolavori/:lavoroId` montano runtime NEXT madre-like;
  - la route ufficiale legge `@lavori` tramite `readNextLavori*Snapshot(..., { includeCloneOverlays: false })`, quindi senza overlay clone-only;
  - `NextLavoriDaEseguirePage` non usa piu append locali del clone;
  - `NextDettaglioLavoroPage` non usa piu override o delete clone-side;
  - le CTA scriventi restano visibili ma bloccate con motivazione read-only esplicita.
- Audit separato: `PASS`
- Tracker aggiornato: `Lavori -> CLOSED`
- Prossimo modulo da affrontare: `Capo Mezzi`
