# Continuity Report - 2026-04-08 13:42:10

## Contesto iniziale
La tab `Nuova / Modifica` del runtime reale di `/next/manutenzioni` mostrava ancora una sezione foto completa, con preview e upload, che allungava troppo la schermata e toglieva focus ai dati principali della manutenzione.

## Intervento eseguito
La UI foto e stata rimossa interamente dal form. Al suo posto resta solo una nota sintetica che rimanda alla tab `Dettaglio`, che continua a essere la sede corretta per la gestione foto e hotspot.

## Stato finale
La tab `Nuova / Modifica` contiene ora solo:
- mezzo attivo;
- campi base;
- descrizione / note;
- componenti inclusi / materiali;
- nota breve sul fatto che le foto stanno in `Dettaglio`;
- salvataggio finale.

## Vincoli rispettati
- nessuna modifica a business, writer, domain o routing;
- nessuna modifica a Firestore, PDF engine o logica foto del `Dettaglio`;
- nessuna modifica al CSS legacy `src/pages/Manutenzioni.css`.

## Rischi residui
- nessun rischio logico introdotto;
- resta utile un controllo browser finale per confermare che il form risulti effettivamente piu corto e focalizzato nel flusso reale.
