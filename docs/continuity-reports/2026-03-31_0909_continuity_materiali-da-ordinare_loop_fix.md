# Continuity Report - `Materiali da ordinare` loop fix

- Timestamp: `2026-03-31 09:09 Europe/Rome`
- Stato lasciato dal run:
  - `/next/materiali-da-ordinare` monta `NextMaterialiDaOrdinarePage` madre-like sopra lettura fornitori read-only;
  - la route ufficiale legge `@fornitori` senza overlay clone-only;
  - le CTA scriventi restano visibili ma bloccate con messaggi read-only espliciti;
  - placeholder panel e modale restano coerenti alla madre.
- Audit separato: `PASS`
- Tracker aggiornato: `Materiali da ordinare -> CLOSED`
- Prossimo modulo da affrontare: `Acquisti / Ordini / Preventivi / Listino`
