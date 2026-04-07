# Continuity Report - 2026-04-07 20:24

## Stato raggiunto
- `/next/manutenzioni` usa ora un header comune e tratta i tab come superfici della stessa famiglia, non come pagine con identica impaginazione laterale.
- Il tab `Storico` non e piu presente; la consultazione ricade nel `Quadro manutenzioni PDF`.

## Invarianti preservate
- Nessuna modifica a `src/next/domain/nextManutenzioniDomain.ts`
- Nessuna modifica a `src/next/domain/nextMappaStoricoDomain.ts`
- Nessuna modifica a `src/utils/cloneWriteBarrier.ts`
- Nessuna modifica a writer business, logica hotspot, upload/storage logic, route, PDF engine o madre legacy

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx` -> OK
- `npm run build` -> OK
- Runtime reale:
  - header compatto presente con ricerca rapida e contesto mezzo
  - tab visibili: `Dashboard`, `Nuova / Modifica`, `Quadro manutenzioni PDF`, `Mappa storico`
  - `.mx-side-column` assente nei tab non-mappa
  - `Quadro manutenzioni PDF` ancora elenco-first con `Step 1`, `Step 2` e righe risultato

## Stato modulo
- `Manutenzioni` resta `PARZIALE`
