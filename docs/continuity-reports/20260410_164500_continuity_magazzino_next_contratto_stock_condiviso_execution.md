# Continuity Report - 2026-04-10 16:45:00

## Contesto
Follow-up esecutivo successivo all'audit finale `Magazzino NEXT`, focalizzato non sulla UI ma sul contratto logico condiviso di stock nel perimetro NEXT.

## Stato prima
- `/next/magazzino` era gia l'ingresso canonico del dominio e copriva `Inventario`, `Materiali consegnati`, `Cisterne AdBlue` e `Documenti e costi`.
- Il dominio restava `PARZIALE` anche perche il contratto stock condiviso non era ancora esplicito:
  - UDM non strettamente governate;
  - matching materiale ancora troppo descrittivo;
  - AdBlue non ancora writer ufficiale di scarico inventario;
  - deduplica documenti/arrivi non formalizzata;
  - writer `Manutenzioni` non allineato allo stesso contratto di stock.

## Stato dopo
- Il lato NEXT del dominio usa ora un helper condiviso `nextMagazzinoStockContract.ts`.
- Le UDM stock automatiche sono limitate a `pz`, `lt`, `kg`, `mt`; il legacy `m` viene canonicalizzato a `mt`.
- Il matching stock usa una chiave pratica stabile (`descrizione + fornitore + unita`) e valorizza `inventarioRefId` quando disponibile.
- I carichi documentali dentro `Documenti e costi` sono controllati:
  - richiedono unita coerente;
  - si deduplicano contro arrivi procurement gia coperti;
  - si marcano con `stockLoadKeys` per evitare doppi carichi successivi.
- Il cambio cisterna AdBlue registra `quantitaLitri` e scala davvero `@inventario`.
- `Manutenzioni` usa ora mismatch unita esplicito, controllo stock insufficiente e rollback reale dei side effect.

## Vincoli mantenuti
- Madre legacy invariata
- Nessuna apertura di writer su costi/documenti
- Nessuna modifica ai moduli legacy fuori whitelist
- Nessuna promozione del dominio a `CHIUSO`

## Verifiche
- Lint mirato `OK`
- Build `OK`
- Preview live verificata sui path canonici e sulle nuove superfici visibili del contratto stock
- Nessuna scrittura browser eseguita su dataset reali durante la verifica runtime

## Continuita per task futuri
- Il dominio `Magazzino NEXT` va ora considerato dotato di un contratto stock locale piu coerente, ma non ancora equivalente al dominio complessivo della madre.
- Restano aperti:
  - writer legacy fuori perimetro (`Acquisti`, `DettaglioOrdine`, `IADocumenti`);
  - parity PDF del dominio;
  - costo materiali canonico;
  - storico AdBlue senza `quantitaLitri` affidabile.
- Il prossimo step corretto e un audit separato di rivalidazione del dominio, non una nuova auto-certificazione esecutiva.
