# Change Report - 2026-04-07 22:28

## Obiettivo
Riallineare la UI del modulo `/next/manutenzioni` al mockup master finale, trattando i tab come superfici distinte della stessa famiglia senza toccare business, writer o domain.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/next-mappa-storico.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Risultato
- Tab finali del modulo: `Dashboard`, `Nuova / Modifica`, `Dettaglio`, `Quadro manutenzioni PDF`.
- `Storico` rimosso dalla navigazione.
- `Dashboard` confermata come superficie di ricerca + accesso rapido.
- `Nuova / Modifica` full-width con blocco `Tagliando completo` visibile solo quando il tipo intervento selezionato e `Tagliando`.
- `Dettaglio` riallineato come vista a due card root:
  - card principale foto / hotspot / zone;
  - card secondaria riepilogo mezzo / azioni / ultime manutenzioni / cronologia.
- `Quadro manutenzioni PDF` confermato come filtro + elenco, con `Apri dettaglio` che porta al tab `Dettaglio`.

## Verifiche
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> OK
- `npm run build` -> OK
- Runtime locale su `http://127.0.0.1:4173/next/manutenzioni`:
  - tab corretti e `Storico` assente;
  - ricerca rapida con query `TI` e preview risultati presente;
  - `Tagliando completo` nascosto di default e visibile solo dopo selezione `Tagliando`;
  - `Dettaglio` con 2 card root vere;
  - `Quadro manutenzioni PDF` con `Step 1`, `Step 2`, elenco righe e `Apri dettaglio` funzionante.

## Note
- Nessuna modifica a domain business, writer, clone barrier, PDF engine, route o storage logic.
