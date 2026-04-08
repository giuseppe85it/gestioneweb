# Continuity Report - 2026-04-08 07:45

## Stato consegnato
- `/next/manutenzioni` non usa piu una shell shared-left-column.
- L'header comune del modulo e compatto e non contiene piu preview risultati o contesti a card.
- Tab finali visibili:
  - `Dashboard`
  - `Nuova / Modifica`
  - `Dettaglio`
  - `Quadro manutenzioni PDF`
- `Storico` non compare.
- `Dettaglio` parte direttamente con 2 card root vere.
- `Quadro manutenzioni PDF` e filtro sopra + elenco full-width sotto.

## Perimetro rispettato
- Nessun file fuori whitelist toccato.
- Nessuna modifica a:
  - `src/next/domain/nextManutenzioniDomain.ts`
  - `src/next/domain/nextMappaStoricoDomain.ts`
  - `src/utils/cloneWriteBarrier.ts`
  - writer business
  - PDF engine
  - storage logic
  - route legacy

## Verifiche da ripetere se serve
- Aprire `http://127.0.0.1:4173/next/manutenzioni`
- Verificare:
  - header comune compatto
  - assenza di `Storico`
  - `Dashboard` senza shell laterale e usata come ingresso rapido
  - `Tagliando completo` visibile solo dopo selezione `Tagliando`
  - `Dettaglio` con 2 card root vere e senza topbar/hero duplicati
  - `Quadro manutenzioni PDF` con `Step 1`, `Step 2`, elenco e `Apri dettaglio` funzionante
