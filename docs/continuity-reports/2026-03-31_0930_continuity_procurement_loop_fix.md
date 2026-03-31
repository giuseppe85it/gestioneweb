# Continuity Report - `Acquisti / Ordini / Preventivi / Listino` loop fix

- Timestamp: `2026-03-31 09:30 Europe/Rome`
- Stato lasciato dal run:
  - `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati` e `/next/dettaglio-ordine/:ordineId` montano `NextProcurementStandalonePage` madre-like;
  - la route ufficiale legge `readNextProcurementSnapshot({ includeCloneOverlays: false })`, quindi senza overlay clone-only sugli ordini;
  - `NextProcurementReadOnlyPanel` mostra solo la superficie read-only della madre e non contiene piu modali edit/add, PDF locali o writer clone-side;
  - le CTA scriventi restano visibili ma bloccate con motivazione read-only esplicita.
- Audit separato: `PASS`
- Tracker aggiornato: `Acquisti / Ordini / Preventivi / Listino -> CLOSED`
- Prossimo modulo da affrontare: `Lavori`
