# Continuity Report - 2026-04-10 12:52:34

## Contesto
Follow-up esecutivo successivo al contratto stock condiviso e all'audit finale `Magazzino NEXT`, focalizzato sull'autonomia operativa lato NEXT del dominio stock.

## Stato prima
- `/next/magazzino` era gia il punto pubblico canonico del dominio.
- Il contratto stock NEXT esisteva gia (`nextMagazzinoStockContract.ts`), ma gli arrivi procurement erano ancora soprattutto supporto read-only e il procurement NEXT manteneva copy che non chiariva bene il ruolo canonico di `Magazzino`.
- Il dominio `Magazzino NEXT` restava `PARZIALE`, anche perche il lato NEXT non aveva ancora assorbito nel proprio centro operativo il carico stock degli arrivi procurement.

## Stato dopo
- `/next/magazzino` governa ora nel perimetro NEXT anche il carico stock degli arrivi procurement, tramite la vista `Documenti e costi`.
- Gli arrivi procurement restano leggibili nelle route procurement, ma il loro consolidamento stock passa da `Magazzino`.
- `nextProcurementDomain.ts`, `NextProcurementReadOnlyPanel.tsx` e `nextData.ts` dichiarano ora in modo coerente che procurement/documenti sono supporto o preview, non writer canonici del dominio stock.
- La shell mette `Magazzino` davanti a `Materiali da ordinare` e presenta `Operativita Globale` come `Operativo parziale`.

## Vincoli mantenuti
- Madre legacy non toccata
- Nessuna nuova scrittura su costi/documenti
- Nessuna modifica ai writer legacy fuori whitelist
- Nessuna promozione del dominio a `CHIUSO`

## Verifiche
- Lint mirato `OK`
- Build `OK`
- Preview locale verificata sui path canonici `Magazzino`, sulle tab principali e sul procurement arrivi come superficie di supporto
- Nessuna scrittura browser eseguita su dataset reali

## Continuita per task futuri
- Il dominio stock NEXT va ora considerato centralizzato operativamente in `/next/magazzino`.
- Restano pero aperti per audit separato:
  - writer legacy fuori perimetro (`Acquisti`, `DettaglioOrdine`, `IADocumenti`)
  - parity PDF del dominio
  - rischi multi-writer repo-wide
  - costo materiali canonico
- Il prossimo step corretto e un audit separato di rivalidazione del dominio `Magazzino NEXT`, non una nuova auto-certificazione esecutiva.
