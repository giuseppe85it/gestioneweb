# Change Report - 2026-04-01 18:35

## Modifica
- Correzione del mount reale della Home NEXT per rispettare l'ordine `Alert` + `Stato operativo`, poi `Navigazione rapida`, poi `IA interna`.

## File toccati
- `src/next/NextCentroControlloPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Dettaglio operativo
- Aggiunti wrapper di layout espliciti per la prima riga della Home.
- `Alert` e `Stato operativo` sono ora due colonne reali nello stesso blocco alto.
- `Navigazione rapida` resta sotto il blocco alto.
- `IA interna` resta sotto `Navigazione rapida`.

## Verifica
- `npm run build`
