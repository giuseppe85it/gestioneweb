# CHANGE REPORT - Home NEXT Alert madre-like per categoria

- DATA: 2026-04-01
- CONTESTO: Correzione della card `Alert` della Home NEXT mantenendo il filtro visibile gia introdotto.
- FILE TOCCATI:
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/components/HomeAlertCard.tsx`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- COSA E STATO CAMBIATO:
  - `Revisioni` usa il modal revisione e conserva il supporto al pre-collaudo sul mezzo;
  - `Segnalazioni` apre il dettaglio evento nella vera esperienza eventi autisti invece di un redirect diretto;
  - `Eventi autisti` mostra i primi elementi ordinati e permette di aprire il modal lista completo;
  - `Conflitti sessione` continua a usare il collegamento gia esistente.
- VERIFICA:
  - `npm run build` -> `OK`.
- NOTE:
  - nessun writer nuovo;
  - nessuna shape dati nuova;
  - la card `Alert` resta unica e filtrabile.
