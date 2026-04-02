# Continuity Report - 2026-04-01 23:40

## Stato iniziale
- La card `Acquisti e ordini` in `Gestione Operativa` puntava a ingressi procurement che i test runtime hanno riportato come pagine bianche o non affidabili.

## Stato finale
- La card procurement usa ora come ingresso principale `/next/materiali-da-ordinare`.
- I deep link procurement `Ordini in attesa` e `Ordini arrivati` non sono piu esposti nella card famiglia.

## Continuita garantita
- Nessuna modifica a Home o ad altre famiglie.
- Nessuna modifica a writer, dati o logica business procurement.
- Nessun restyling.
- Le route procurement restano montate nel runtime NEXT; viene cambiato solo l'uso che ne fa la card famiglia.

## Verifica raccomandata
- Aprire `/next/gestione-operativa`.
- Verificare che `Acquisti e ordini` apra `Materiali da ordinare`.
- Verificare che la card non esponga piu link procurement secondari non affidabili.
- Eseguire `npm run build`.
