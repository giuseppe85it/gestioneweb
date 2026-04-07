# Continuity Report - 2026-04-06 12:15

## Contesto
Il prompt richiedeva di superare il vecchio assetto clone-safe del modulo `Lavori`, mantenendo pero il comportamento reale della madre e senza aprire in modo generale la write barrier del clone.

## Decisione tecnica
- UI unificata costruita dentro `src/next/NextLavoriDaEseguirePage.tsx`;
- route `In attesa` e `Eseguiti` convertite in wrapper sottili della stessa dashboard;
- dettaglio lavoro reale spostato in un componente condiviso dentro `src/next/NextDettaglioLavoroPage.tsx`;
- write-path aperto in modo chirurgico in `src/utils/cloneWriteBarrier.ts` solo per `storageSync.setItemSync("@lavori")` sui pathname Lavori/dettaglio.

## Perche la deroga e stretta
- non apre tutto `/next`;
- non apre altri dataset oltre `@lavori`;
- non apre `fetch.runtime`;
- non sblocca altri moduli NEXT fuori dai pathname Lavori.

## Verifica eseguita
- build completata con successo;
- record di prova creato via tab `Aggiungi`, poi modificato, eseguito ed eliminato via dettaglio reale;
- route diretta `/next/dettagliolavori/:lavoroId` verificata;
- tentativo di write su `@lavori` da `/next/autisti-inbox` rimasto bloccato.

## Stato da mantenere nel prossimo prompt
- `Lavori` resta `PARZIALE`, non `CHIUSO`;
- il prossimo passo corretto e un audit separato sul modulo dopo il redesign e dopo la deroga chirurgica;
- se si estendono in futuro altri flussi scriventi nel clone, non riusare questa deroga come scorciatoia generale.
