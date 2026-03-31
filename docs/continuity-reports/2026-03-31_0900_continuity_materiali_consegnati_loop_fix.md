# Continuity Report - `Materiali consegnati` loop fix

- Timestamp: `2026-03-31 09:00 Europe/Rome`
- Stato lasciato dal run:
  - `/next/materiali-consegnati` monta `NextMaterialiConsegnatiPage` madre-like sopra layer NEXT read-only;
  - la route ufficiale legge `@materialiconsegnati` e `@inventario` senza overlay clone-only;
  - `Registra consegna` ed `Elimina` restano visibili ma bloccati con messaggio read-only esplicito;
  - PDF preview/download restano disponibili sui dati reali.
- Audit separato: `PASS`
- Tracker aggiornato: `Materiali consegnati -> CLOSED`
- Prossimo modulo da affrontare: `Materiali da ordinare`
