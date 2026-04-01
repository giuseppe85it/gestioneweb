# Change Report - Home NEXT con Alert unico filtrabile per categorie reali

- Timestamp: `2026-04-01 10:34 Europe/Rome`
- Tipo intervento: composizione UI + tracciamento documentale
- Scope:
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/components/HomeAlertCard.tsx`
  - `src/pages/Home.css`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Esito
- La card `Alert` della Home NEXT resta unica.
- Sopra la lista e stata aggiunta una barra filtro visibile.
- Il filtro usa solo categorie gia presenti nel runtime: `Tutti`, `Revisioni`, `Segnalazioni`, `Eventi autisti`, `Conflitti sessione`.
- Le revisioni continuano ad aprire il modale esistente; gli altri alert mantengono il loro comportamento corrente.

## Verifiche
- `npm run build` -> `OK`
- Warning presenti ma non nuovi:
  - `jspdf` importato in modo misto dinamico/statico
  - avviso Vite su dimensione chunk
