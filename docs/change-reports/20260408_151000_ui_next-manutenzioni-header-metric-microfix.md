# Change Report - 2026-04-08 15:10

## Obiettivo
Applicare un micro-fix UI locale su `Manutenzioni` NEXT per pulire la testata e riequilibrare la riga `Data / KM-Ore / Fornitore`.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- rimosso il kicker sopra il titolo `Nuova manutenzione`;
- aumentato il padding sinistro del modulo per ridurre l'invasivita visiva del menu flottante;
- riequilibrata la griglia metriche a `176px 192px minmax(360px, 1fr)`.

## Impatto
- Solo JSX/CSS locale.
- Nessun impatto su logica dati, routing, PDF, foto, dettaglio o dominio.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`
