# Change Report - Home NEXT top area semplificata

- Timestamp: `2026-04-01 09:20 Europe/Rome`
- Tipo intervento: patch runtime mirata + tracciamento documentale
- Scope:
  - `src/next/NextCentroControlloPage.tsx`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Esito
- Entry legacy `360` sostituita con accesso alla chat IA interna.
- Blocco `Alert` limitato alle sole revisioni dei mezzi.
- Le righe revisione dentro `Alert` aprono il modale revisione gia esistente.
- La sezione `Revisioni` separata non resta visibile nel layout principale.

## Verifiche
- `npm run build` -> `OK`
- Warning presenti ma non nuovi:
  - `jspdf` importato in modo misto dinamico/statico
  - avviso Vite su dimensione chunk

