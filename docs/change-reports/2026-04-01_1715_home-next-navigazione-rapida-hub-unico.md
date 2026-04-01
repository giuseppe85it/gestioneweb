# Change Report - 2026-04-01 17:15

## Modifica
- Home NEXT: sostituzione di `Collegamenti rapidi` con `Navigazione rapida` come hub unico di navigazione.

## File toccati
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/QuickNavigationCard.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Dettaglio operativo
- Rimossi dal layout principale della Home i collegamenti rapidi alti vicino a `Dashboard`.
- Montata una nuova card `Navigazione rapida` con:
  - barra cerca unica;
  - `Preferiti` con massimo 6 elementi;
  - pin disponibili solo dentro i preferiti;
  - macro-sezioni compatte e richiudibili;
  - una sola sezione aperta per volta.
- Riutilizzati solo link e route gia presenti nel runtime NEXT.

## Verifica
- `npm run build`
