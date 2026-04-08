# Change Report - 2026-04-08 15:41

## Obiettivo
Bloccare la riga `Data / KM-Ore / Fornitore` della tab NEXT `Nuova / Modifica` del modulo `Manutenzioni` a larghezze fisse e compatte.

## File toccati
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- `grid-template-columns: 190px 140px 260px`
- `gap: 16px`
- `justify-content: start`
- `width: fit-content`
- rimosso l'uso di `1fr` per `Fornitore` su desktop

## Impatto
- Solo CSS locale.
- Nessun impatto su logica dati, salvataggio, routing, PDF, foto o dettaglio.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`
