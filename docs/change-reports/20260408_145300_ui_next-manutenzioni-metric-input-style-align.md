# Change Report - 2026-04-08 14:53

## Obiettivo
Riallineare solo la resa visiva dei campi `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica` del modulo `Manutenzioni`, riusando la stessa base di `Tipo` e `Sottotipo`.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- i tre wrapper separati riusano ora anche la classe base `man2-field`;
- i tre input ereditano la stessa resa visiva dei controlli del form già corretti;
- allineato anche il placeholder nel perimetro metriche.

## Impatto
- Solo JSX/CSS locale.
- Nessun impatto su layout, logica dati, salvataggio, PDF, foto, dettaglio o routing.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`
