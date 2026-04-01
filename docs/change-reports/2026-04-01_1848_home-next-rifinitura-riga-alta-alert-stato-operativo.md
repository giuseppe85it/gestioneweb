# Change Report - 2026-04-01 18:48

## Modifica
- Rifinitura del layout della riga alta Home NEXT per allineare meglio `Alert` e `Stato operativo`.

## File toccati
- `src/next/NextCentroControlloPage.tsx`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Dettaglio operativo
- Introdotti wrapper locali dedicati per le due card della riga alta.
- Applicato stretch verticale coerente tra le due colonne.
- Estesa l'altezza delle card al wrapper disponibile.
- Reso scrollabile il body interno dove serve, senza altezze fisse rigide.

## Verifica
- `npm run build`
