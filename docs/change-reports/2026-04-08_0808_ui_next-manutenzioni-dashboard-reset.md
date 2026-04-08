# Change Report - 2026-04-08 08:08

## Modifica
- Reset UI della `Dashboard` di `/next/manutenzioni` per allinearla a un ingresso rapido leggero.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Cosa cambia
- rimossa la resa a macro-pannello del contesto mezzo nella `Dashboard`;
- lasciati solo risultati rapidi, navigazione veloce e contesto attivo compatto;
- confermati `Dettaglio` a 2 card vere e `Quadro manutenzioni PDF` come filtro + elenco.

## Esclusioni esplicite
- nessuna modifica a business, writer, domain business, clone barrier, PDF engine, storage logic o route legacy.

## Verifiche richieste
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx`
- `npm run build`
- verifica runtime reale su `/next/manutenzioni`
