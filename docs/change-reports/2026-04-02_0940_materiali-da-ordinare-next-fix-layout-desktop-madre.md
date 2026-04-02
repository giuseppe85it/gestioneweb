# Change Report

- Data: 2026-04-02
- Ambito: procurement NEXT
- Target: `/next/materiali-da-ordinare`

## Obiettivo
- Riallineare il layout desktop del procurement convergente NEXT alla madre reale, eliminando shell stretta, pannello destro spezzato e barra scura overlay.

## File toccati
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifica applicata
- Sostituito il ramo desktop `Fabbisogni` standalone con la variante embedded/single-card della madre.
- Rimossi dal runtime della pagina:
  - `mdo-workspace`
  - pannello laterale separato
  - `mdo-sticky-bar` overlay
- Introdotti nel runtime della pagina:
  - `mdo-page--embedded mdo-page--single`
  - `mdo-card--embedded mdo-card--single`
  - `mdo-single-card`
  - `mdo-card-footer-bar`

## Verifica
- `npm run build` OK

