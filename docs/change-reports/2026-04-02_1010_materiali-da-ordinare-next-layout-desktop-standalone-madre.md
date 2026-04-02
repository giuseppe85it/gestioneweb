# Change Report

- Data: 2026-04-02
- Ambito: procurement NEXT
- Target: `/next/materiali-da-ordinare`

## Obiettivo
- Riportare il modulo canonico procurement sul layout desktop standalone reale della madre.

## Verifica causa reale
- `NextShell` e `App.css` non impongono il layout stretto.
- Il vincolo errato era nel top-level di `src/next/NextMaterialiDaOrdinarePage.tsx`, che usava ancora classi embedded della madre.

## Modifica applicata
- Rimosse dal top-level:
  - `mdo-page--embedded`
  - `mdo-card--embedded`
  - `mdo-page--single`
  - `mdo-card--single`
- Ripristinata la shell standalone della madre:
  - `mdo-page`
  - `mdo-card`
  - `mdo-workspace`
  - `mdo-sticky-bar`
- Nessun cambio alle tab convergenti secondarie.

## Verifica
- `npm run build` OK

