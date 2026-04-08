# Change Report - 2026-04-08 14:42

## Obiettivo
Sostituire in modo definitivo il blocco `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica` del modulo `Manutenzioni` con una struttura compatta a tre field-group separati.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- rimossi i residui del tentativo precedente;
- applicata la struttura JSX finale con `man2-metric-row` e tre `man2-metric-group`;
- applicate le colonne desktop `180px 180px minmax(360px, 1fr)`;
- applicato `gap: 16px` e `margin-top: 10px`.

## Impatto
- Solo JSX/CSS locale.
- Nessun impatto su logica dati, salvataggio, PDF, foto, dettaglio o routing.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`
