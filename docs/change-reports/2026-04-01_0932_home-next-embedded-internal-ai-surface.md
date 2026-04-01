# Change Report - Home NEXT con chat IA interna montata

- Timestamp: `2026-04-01 09:32 Europe/Rome`
- Tipo intervento: correzione runtime mirata + tracciamento documentale
- Scope:
  - `src/next/NextCentroControlloPage.tsx`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Esito
- Il blocco alto della Home non usa piu un link alla chat IA interna.
- La Home monta la vera superficie della chat IA interna gia esistente nel progetto.
- `Alert`, modale revisione e sezione `Revisioni` restano invariati rispetto alla patch precedente.

## Verifiche
- `npm run build` -> `OK`
- Warning presenti ma non nuovi:
  - `jspdf` importato in modo misto dinamico/statico
  - avviso Vite su dimensione chunk

