# Continuity Report - 2026-04-15 18:18:16

## Stato consegnato
- `Archivista` chiude ora il solo lato documenti / archiviazione del V1.
- Le sole famiglie operative sono:
  - `Fattura / DDT + Magazzino`
  - `Fattura / DDT + Manutenzione`
  - `Documento mezzo`
  - `Preventivo + Magazzino`
- Le famiglie fuori V1 restano fuori o non attive.

## Cosa e stato chiuso davvero
- review completa e non chat per tutte e quattro le famiglie V1
- controllo duplicati prudente con scelta utente obbligatoria sui match forti
- archiviazione finale vera con upload originale e record archivio coerente
- link all'originale archiviato
- update mezzo solo nel ramo `Documento mezzo` e solo su conferma esplicita

## Cosa NON e stato chiuso
- IA Report
- collegamento a manutenzione esistente
- creazione nuova manutenzione
- carico stock
- aggiornamento listino
- workflow approvativi
- verticali fuori V1

## Target finali attivi
- `Magazzino` -> `@documenti_magazzino`
- `Manutenzione` -> `@documenti_mezzi`
- `Documento mezzo` -> `@documenti_mezzi` + possibile update `@mezzi_aziendali` confermato
- `Preventivo + Magazzino` -> `storage/@preventivi`

## Barrier aperta in modo stretto
- upload originali Archivista V1
- `@documenti_magazzino`
- `@documenti_mezzi`
- `storage/@preventivi`
- `@mezzi_aziendali` solo nel passaggio confermato del ramo `Documento mezzo`

## Rischi residui
- la regola duplicati e prudente ma dipende dalla qualita dei campi letti dal documento
- `Versione migliore` mantiene il comportamento non distruttivo e non tenta migrazioni o sostituzioni globali
- il ramo `Preventivo + Magazzino` archivia senza ancora aprire nessun passo procurement/listino
- il ramo `Documento mezzo` non forza update automatici del mezzo: resta intenzionalmente esplicito

## Verifiche eseguite
- `npx eslint` sui file runtime/backend toccati -> `OK`
- `npx eslint src/next/internal-ai/internal-ai.css` -> file ignorato dalla config
- `npm run build` -> `OK`

## Punto di ripartenza consigliato
- se il prossimo task tocca il post-archivio, trattarlo come fase separata e non estendere questa patch
- se il prossimo task tocca il matching duplicati, preservare la scelta esplicita utente e il comportamento non distruttivo
- se il prossimo task tocca `Documento mezzo`, mantenere l'update mezzo dietro conferma e senza aperture generiche della barrier
