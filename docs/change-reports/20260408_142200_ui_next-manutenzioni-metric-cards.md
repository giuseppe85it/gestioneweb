# Change Report - 2026-04-08 14:22

## Obiettivo
Rendere definitiva la riga `Data / KM-Ore / Fornitore` nella tab NEXT `Nuova / Modifica` del modulo `Manutenzioni`, trasformandola in tre mini-card separate vere.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- sostituita la riga metrica con il wrapper `man2-metric-cards`;
- introdotte tre card dedicate:
  - `man2-metric-card--date`
  - `man2-metric-card--metric`
  - `man2-metric-card--supplier`
- input interni resi subordinati alla card;
- `Mezzo attivo` rialzato e distanziato in modo piu evidente.

## Impatto
- Solo UI/CSS e micro-composizione JSX locale.
- Nessun impatto su logica dati, salvataggio, PDF, foto, dettaglio o routing.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`
