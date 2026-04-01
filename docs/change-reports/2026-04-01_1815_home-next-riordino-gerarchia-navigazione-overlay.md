# Change Report - 2026-04-01 18:15

## Modifica
- Riordino gerarchico della Home NEXT con `Alert` + `Stato operativo` in alto, `Navigazione rapida` minimale al centro e `IA interna` in basso.

## File toccati
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/QuickNavigationCard.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Dettaglio operativo
- `Alert` e `Stato operativo` montati nello stesso blocco alto tramite griglia locale responsive.
- `Navigazione rapida` alleggerita in Home a cerca + preferiti + CTA `Tutte le sezioni`.
- Menu completo spostato in overlay full-screen con blocco scroll pagina e una sola sezione aperta per volta.
- `IA interna` riposizionata sotto `Navigazione rapida`.

## Verifica
- `npm run build`
