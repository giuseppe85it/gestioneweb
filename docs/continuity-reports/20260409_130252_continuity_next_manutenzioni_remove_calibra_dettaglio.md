# Continuity Report - 2026-04-09 13:02:52

## Stato iniziale
- Il tab `Dettaglio` di `/next/manutenzioni` montava nel ramo embedded un viewer con `Calibra`, marker tecnici e override clone-side persistiti.
- La vista risultava piu simile a un workbench tecnico che a una schermata pulita di consultazione.

## Stato finale
- Il ramo embedded mostra ora solo:
  - tab vista del mezzo
  - foto/placeholder della vista attiva
  - riepilogo della manutenzione selezionata
  - card destra con dati mezzo e storico
- Il flusso `Calibra` non esiste piu nel dettaglio embedded.
- Gli override tecnici clone-side non esistono piu nel domain usato dal dettaglio.

## File di continuita
- `src/next/NextMappaStoricoPage.tsx`: ramo embedded ripulito e statico.
- `src/next/domain/nextMappaStoricoDomain.ts`: override tecnici rimossi.
- `src/next/NextManutenzioniPage.tsx`: copy del form riallineata.
- `src/next/next-mappa-storico.css`: aggiunto styling per il riepilogo manutenzione selezionata.

## Verifiche eseguite
- ESLint mirato: OK
- Build root: OK

## Rischi residui
- Le note storiche su `Calibra` restano presenti nei documenti di tracciabilita passati; fanno storia, non stato corrente.
- Il modulo `Manutenzioni` resta `PARZIALE` e richiede ancora audit separato prima di qualsiasi promozione di stato.
