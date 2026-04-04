# Continuity Report - 2026-04-03 2106 - next-home-magazzino-inventario

## Stato iniziale
- La Home NEXT mostrava nel widget `Magazzino` tre righe placeholder con semantica mista inventario/procurement.

## Stato finale
- Il widget `Magazzino` della Home NEXT legge solo `readNextInventarioSnapshot({ includeCloneOverlays: false })`.
- La CTA del widget punta a `/next/inventario`.
- Il widget mostra fino a 4 righe reali inventario in forma compatta.

## Boundary preservato
- nessuna modifica a `src/next/domain/*`;
- nessuna modifica a `NextShell.tsx`, route o file madre;
- nessuna scrittura business introdotta;
- nessun uso del domain procurement nel widget.

## Verifiche di continuita
- `eslint` su `src/next/NextHomePage.tsx` -> `OK`
- `npm run build` -> `OK`
- verifica runtime su `/next`, `/next/inventario`, `/next/materiali-da-ordinare` -> `OK`
