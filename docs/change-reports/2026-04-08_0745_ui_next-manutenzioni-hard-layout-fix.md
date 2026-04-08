# Change Report - 2026-04-08 07:45

## Obiettivo
Eliminare definitivamente la struttura shared con colonna laterale persistente e contesto duplicato nel modulo `/next/manutenzioni`, mantenendo solo UI/layout/gerarchia visiva e minima navigazione interna dei tab.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Correzioni applicate
- Header comune ridotto a:
  - titolo
  - selezione mezzo
  - ricerca rapida
  - metadati sintetici
  - tab navigazione
- Rimossi dall'header:
  - preview risultati duplicate
  - card contesto duplicate
- `Dashboard` semplificata come puro ingresso rapido con:
  - risultati rapidi
  - navigazione veloce
  - contesto mezzo minimo
- `Nuova / Modifica` lasciata full-width e pulita, con `Tagliando completo` solo condizionale.
- `Dettaglio` ripulito da topbar interna, blocco hero e riepilogo duplicato nella colonna sinistra:
  - 2 card root vere
  - card principale foto / hotspot / zone
  - card secondaria riepilogo / ultime manutenzioni / azioni
- `Quadro manutenzioni PDF` lasciato come filtro + elenco full-width, senza blocchi secondari da dashboard.

## Verifiche
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> OK
- `npm run build` -> OK
- Runtime locale su `http://127.0.0.1:4173/next/manutenzioni`:
  - header comune compatto con `1` input ricerca e `0` blocchi `.mx-header-search-results` / `.mx-header-context`
  - tab visibili: `Dashboard`, `Nuova / Modifica`, `Dettaglio`, `Quadro manutenzioni PDF`
  - `Storico` assente
  - `Dashboard` senza `.mx-side-column`, senza `.mx-kpi-grid--dashboard`, senza `.mx-timeline-block`
  - `Nuova / Modifica` senza `.mx-side-column`, con `Tagliando completo` nascosto di default e visibile solo dopo selezione `Tagliando`
  - `Dettaglio` con `2` card root vere, `0` `.ms-topbar`, `0` blocchi hero bianchi sopra il contenuto
  - `Quadro manutenzioni PDF` con `Step 1`, `Step 2`, `10` righe elenco, `0` `.mx-pdf-secondary`, `Apri dettaglio` funzionante

## Note
- Nessuna modifica a writer, domain business, clone barrier, PDF engine, storage logic o route legacy.
