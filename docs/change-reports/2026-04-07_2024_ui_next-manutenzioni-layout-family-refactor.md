# Change Report - 2026-04-07 20:24

## Obiettivo
Ristrutturare solo la UI di `/next/manutenzioni` trattando i tab come superfici distinte della stessa famiglia, senza toccare business, writer, domain, barrier o route.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- Header comune compatto con titolo `MANUTENZIONI`, selezione mezzo, ricerca rapida e tab.
- Rimosso il tab `Storico` dalla navigazione.
- `Dashboard` semplificata e resa full-width con KPI chiari, accessi rapidi e timeline breve.
- `Nuova / Modifica` resa full-width senza card laterali fisse.
- `Quadro manutenzioni PDF` confermato full-width e elenco-first.
- `Mappa storico` lasciata specialistica e separata.

## Verifiche
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> OK
- `npm run build` -> OK
- Runtime su `http://127.0.0.1:4173/next/manutenzioni`:
  - header compatto presente
  - tab `Storico` assente
  - `Dashboard`, `Nuova / Modifica` e `Quadro manutenzioni PDF` senza `.mx-side-column`
  - `Quadro manutenzioni PDF` con `Step 1`, `Step 2` e `10` righe elenco

## Limiti
- Nessuna modifica a business, writer, domain business, `cloneWriteBarrier.ts`, route, PDF engine o madre legacy.
