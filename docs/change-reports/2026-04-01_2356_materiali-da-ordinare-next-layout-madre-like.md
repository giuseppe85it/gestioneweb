# Change Report

## Data
2026-04-01

## Ambito
Riallineamento UI/layout del modulo procurement NEXT `Materiali da ordinare`.

## File toccati
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-04-01_2356_materiali-da-ordinare-next-layout-madre-like.md`
- `docs/continuity-reports/2026-04-01_2356_continuity_materiali-da-ordinare-next-layout-madre-like.md`

## Sintesi
Confrontato il runtime NEXT con il modulo procurement madre-like reale:

- `src/pages/MaterialiDaOrdinare.tsx`
- `src/pages/MaterialiDaOrdinare.css`
- `src/pages/Acquisti.tsx`
- `src/pages/Acquisti.css`

La patch mantiene `/next/materiali-da-ordinare` come unico ingresso procurement top-level, ma corregge le rotture layout visibili:

- shell procurement piu coerente con la madre;
- workspace con proporzioni piu stabili;
- pannello destro non piu collassato quando il dataset temporaneo e vuoto;
- barra finale non piu sticky/sovrapposta, quindi non copre i campi del form.

## Modifiche runtime
Solo layout/composizione in `src/next/NextMaterialiDaOrdinarePage.tsx`.

## Verifica
- `npm run build` -> OK
