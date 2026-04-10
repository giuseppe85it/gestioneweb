# AUDIT MAGAZZINO NEXT VS MADRE - LOGICA DOMINIO

- DATA: 2026-04-09
- TIPO: audit strutturale cross-modulo, sola lettura
- TARGET:
  - `src/pages/Inventario.tsx`
  - `src/pages/MaterialiConsegnati.tsx`
  - moduli legacy/NEXT collegati a `@inventario`, `@materialiconsegnati`, `@documenti_magazzino`
  - `src/next/NextMagazzinoPage.tsx`
- RUNTIME PATCH: nessuna

## 1. Obiettivo
Ricostruire la logica reale della madre per `Inventario` e `MaterialiConsegnati`, mappare i dataset e i collegamenti cross-modulo, e confrontare questi fatti con il nuovo modulo unificato `src/next/NextMagazzinoPage.tsx`.

L'audit non usa la UI come prova di parity. Conta solo il codice reale del repo.

## 2. File letti piu importanti
- `src/pages/Inventario.tsx`
- `src/pages/MaterialiConsegnati.tsx`
- `src/pages/DettaglioOrdine.tsx`
- `src/pages/Acquisti.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Mezzo360.tsx`
- `src/pages/GestioneOperativa.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/pages/AnalisiEconomica.tsx`
- `src/pages/CapoCostiMezzo.tsx`
- `src/pages/CapoMezzi.tsx`
- `src/next/NextMagazzinoPage.tsx`
- `src/next/NextLegacyStorageBoundary.tsx`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `src/utils/storageSync.ts`

## 3. Dataset reali mappati
- `@inventario`
  - dataset storage-style in `storage/@inventario`
  - shape letta in modi misti: array diretto, `value`, `items`
  - dominio multi-writer
- `@materialiconsegnati`
  - dataset storage-style in `storage/@materialiconsegnati`
  - shape mista: record con `destinatario` string legacy, record con `destinatario` oggetto, record scritti da `Manutenzioni`
  - dominio multi-writer
- `@documenti_magazzino`
  - collection Firestore dedicata ai documenti magazzino
  - usata come archivio documentale e supporto costi, non come ledger canonico di stock
- Dataset di supporto reali collegati:
  - `@mezzi_aziendali`
  - `@colleghi`
  - `@fornitori`
  - `@manutenzioni`

## 4. Writer reali mappati

### `@inventario`
- `src/pages/Inventario.tsx`
- `src/pages/MaterialiConsegnati.tsx`
- `src/pages/DettaglioOrdine.tsx`
- `src/pages/Acquisti.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/next/NextMagazzinoPage.tsx`

### `@materialiconsegnati`
- `src/pages/MaterialiConsegnati.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/next/NextMagazzinoPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`

### `@documenti_magazzino`
- writer legacy documentali e IA documenti
- nessun writer nel nuovo `NextMagazzinoPage.tsx`

## 5. Lettori reali mappati

### `@inventario`
- `src/pages/Inventario.tsx`
- `src/pages/MaterialiConsegnati.tsx`
- `src/pages/DettaglioOrdine.tsx`
- `src/pages/Acquisti.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/pages/GestioneOperativa.tsx`
- `src/next/NextMagazzinoPage.tsx`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`

### `@materialiconsegnati`
- `src/pages/MaterialiConsegnati.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Mezzo360.tsx`
- `src/pages/GestioneOperativa.tsx`
- `src/next/NextMagazzinoPage.tsx`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `src/next/NextLegacyStorageBoundary.tsx` come adapter di compatibilita

### `@documenti_magazzino`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Mezzo360.tsx`
- `src/pages/AnalisiEconomica.tsx`
- `src/pages/CapoCostiMezzo.tsx`
- `src/pages/CapoMezzi.tsx`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`

## 6. Inventario madre - logica reale
- Il modulo legacy legge `@inventario` direttamente da `storage/@inventario`.
- Il CRUD e diretto: nuovo articolo, modifica articolo, elimina articolo, variazione rapida quantita, input quantita manuale.
- L'upload foto usa Storage su path `inventario/<itemId>/foto.jpg`.
- Il PDF esiste nel modulo legacy.
- Esiste il campo `fornitore` con suggerimenti da `@fornitori`.
- La shape reale usata dalla madre e:
  - `id`
  - `descrizione`
  - `quantita`
  - `unita`
  - `fornitore?`
  - `fotoUrl?`
  - `fotoStoragePath?`
- La madre non usa un contratto canonico verificato per `sogliaMinima`.
- `Inventario.tsx` non e l'unico writer del dataset:
  - `MaterialiConsegnati` decrementa e ripristina stock
  - `Acquisti` e `DettaglioOrdine` aggiornano lo stock dagli arrivi
  - `Manutenzioni` scarica materiali
  - `IADocumenti` puo importare righe nel dataset
- Il matching stock nei moduli legacy non e basato in modo uniforme su `id`: ricorrono match per `descrizione + unita`, e in alcuni casi anche `fornitore`.
- Il dominio non e transazionale.

## 7. Materiali consegnati madre - logica reale
- Il modulo legacy legge `@materialiconsegnati`, `@inventario`, `@mezzi_aziendali`, `@colleghi`.
- La consegna richiede materiale da inventario e destinatario.
- Il destinatario viene normalizzato in:
  - `MEZZO`
  - `COLLEGA`
  - `MAGAZZINO`
- La shape reale del record e:
  - `id`
  - `descrizione`
  - `quantita`
  - `unita`
  - `destinatario { type, refId, label }`
  - `motivo?`
  - `data`
  - `fornitore?`
- Ordine logico legacy reale:
  1. scrive `@materialiconsegnati`
  2. poi decrementa `@inventario`
- In eliminazione:
  1. rimuove il movimento da `@materialiconsegnati`
  2. poi ripristina `@inventario`
- Se l'articolo non esiste piu in inventario, la madre lo ricrea in modo minimale.
- Esistono PDF, preview, share e storico raggruppato per destinatario.
- Non esiste rollback transazionale reale.
- Non esiste un blocco forte su stock insufficiente verificato nel modulo legacy.
- Il collegamento a mezzo e fragile:
  - i writer salvano `destinatario.refId`
  - alcuni lettori legacy filtrano soprattutto su `destinatario.label === targa`

## 8. Cross-modulo - mappa collegamenti reali

### Collegamenti forti verificati
- `DettaglioOrdine` e `Acquisti`
  - scrivono `@inventario`
  - influenzano lo stock reale
- `Manutenzioni`
  - scrive `@inventario`
  - scrive `@materialiconsegnati`
- `IADocumenti`
  - scrive `@inventario`
  - usa `@documenti_magazzino` nel proprio dominio documentale
- `DossierMezzo`
  - legge `@materialiconsegnati`
  - legge `@documenti_magazzino`
  - ricostruisce costi materiali da `voci` dei documenti
- `Mezzo360`
  - legge `@materialiconsegnati`
  - legge i documenti magazzino/costi tramite i flussi documentali
- `GestioneOperativa`
  - legge preview di `@inventario` e `@materialiconsegnati`

### Collegamenti descrittivi o parziali
- `AnalisiEconomica`, `CapoCostiMezzo`, `CapoMezzi`
  - leggono `@documenti_magazzino`
  - il loro legame col dominio magazzino e sul costo documentale, non sul ledger stock
- NEXT `nextDocumentiCostiDomain.ts`
  - usa `@documenti_magazzino` come supporto costi, non come stock domain

### Natura del dominio
- Il dominio magazzino reale della madre e multi-writer e non transazionale.
- I costi materiali non derivano da un ledger unico di movimenti: vengono spesso ricostruiti dai documenti (`@documenti_magazzino`) con matching descrittivo.
- Il rischio di drift cross-modulo e alto.

## 9. Nuovo Magazzino NEXT - logica reale
- La route pubblica canonica e `/next/magazzino`.
- I vecchi path `/next/inventario` e `/next/materiali-consegnati` restano solo come redirect di compatibilita.
- `NextMagazzinoPage.tsx` copre tre aree:
  - `Inventario`
  - `Materiali consegnati`
  - `Cisterne AdBlue`
- Dataset letti/scritti:
  - `@inventario`
  - `@materialiconsegnati`
  - `@cisterne_adblue`
  - supporto da `@mezzi_aziendali`, `@colleghi`, `@fornitori`
- Writer reale:
  - `setItemSync` con rilettura di verifica
  - upload foto inventario su `inventario/<itemId>-<timestamp>.<ext>`
- Coperture reali del modulo:
  - CRUD inventario
  - filtri inventario
  - upload foto
  - quantita rapida
  - consegna materiali con blocco stock insufficiente
  - rollback compensativo se fallisce la seconda scrittura
  - delete consegna con tentativo di ripristino coerente
  - storico e gruppi per destinatario
  - query `tab` per ingressi compatibili
- Logiche non presenti nel modulo:
  - nessuna lettura o scrittura di `@documenti_magazzino`
  - nessun aggancio a `IADocumenti`
  - nessuna superficie costi / fatture / preventivi materiali
  - nessun aggancio applicativo a `Acquisti` o `DettaglioOrdine`
  - nessun PDF/export del dominio legacy inventario/materiali consegnati
- Il modulo e piu prudente della madre sulla coerenza locale della doppia scrittura, ma non rende il dominio transazionale.

## 10. Comparazione madre vs NEXT

### Coperture reali
- CRUD base `@inventario`: presente
- upload foto inventario: presente
- consegna materiali con decremento stock: presente
- delete consegna con ripristino stock: presente
- storico per destinatario: presente
- compatibilita dataset `@inventario` / `@materialiconsegnati`: presente

### Coperture solo parziali
- compatibilita con lettori legacy mezzo-centrici:
  - presente via dataset condivisi
  - fragile perche diversi lettori legacy usano `destinatario.label` come chiave mezzo
- allineamento cross-modulo stock:
  - presente solo per la parte diretta del modulo
  - non integra i flussi ordine/arrivi, IA documenti o manutenzioni oltre la compatibilita passiva del dataset

### Coperture non presenti nel nuovo modulo
- `@documenti_magazzino`
- costi materiali ricostruiti dai documenti
- documenti/fatture/preventivi del dominio magazzino
- aggancio operativo esplicito con `IADocumenti`
- aggancio operativo esplicito con `Acquisti` / `DettaglioOrdine`
- parity dei PDF legacy

## 11. Gap reali ancora aperti
- Manca un contratto canonico unico per il matching di `@inventario` tra `Magazzino`, `Acquisti`, `DettaglioOrdine`, `Manutenzioni`, `IADocumenti`.
- Manca un contratto uniforme dei writer di `@materialiconsegnati` su:
  - `destinatario.refId`
  - `destinatario.label`
  - eventuale `targa`
  - eventuale riferimento all'item inventario origine
- `@documenti_magazzino` resta fuori dal nuovo modulo, ma continua a pesare su Dossier e costi.
- Il nuovo modulo non copre i flussi costi/fatture/preventivi materiali.
- Il dominio reale resta non transazionale anche dopo il modulo NEXT.
- `Acquisti` e `DettaglioOrdine` hanno un flusso di aggiornamento stock che richiede verifica aggiuntiva sul rischio di doppio decremento in alcuni percorsi di delete/rollback.

## 12. Verdetto finale per blocco
- `Inventario logica madre` -> `COPERTO`
  - la logica reale e stata ricostruita dal codice
- `Materiali consegnati logica madre` -> `COPERTO`
  - la logica reale e stata ricostruita dal codice
- `Cross-modulo magazzino` -> `PARZIALE`
  - i collegamenti principali sono mappati, ma il dominio resta fragile e multi-writer
- `Nuovo Magazzino NEXT` -> `PARZIALE`
  - copre il core CRUD/storage del dominio, non gli agganci documentali/costi/procurement
- `Compatibilita con Dossier / IA / costi / documenti` -> `PARZIALE`
  - Dossier e Mezzo360 leggono i dataset condivisi
  - `@documenti_magazzino`, costi materiali e IA documenti non sono coperti dal nuovo modulo

## 13. Punti da aggiungere a `REGISTRO_PUNTI_DA_VERIFICARE`
- Uniformare il contratto writer di `@materialiconsegnati` per tutti i moduli che scrivono movimenti materiali.
- Definire una chiave canonica di riconciliazione di `@inventario` condivisa tra `Magazzino`, `Acquisti`, `DettaglioOrdine`, `Manutenzioni`, `IADocumenti`.
- Decidere se i costi materiali devono continuare a derivare da `@documenti_magazzino` o entrare in un ledger esplicito del dominio.
- Verificare se `NextMagazzinoPage.tsx` deve includere almeno una superficie read-only per documenti/costi materiali.
- Verificare in `Acquisti` e `DettaglioOrdine` il rischio di doppio decremento stock nei percorsi di rimozione materiale gia arrivato.

## 14. Build / test
- Non eseguiti.
- Motivo: task audit-only, nessuna patch runtime.

## 15. Esito sintetico
Il nuovo `Magazzino NEXT` copre bene il cuore operativo locale di `Inventario` e `Materiali consegnati`, ma non replica ancora la logica cross-modulo completa che nella madre passa anche da ordini/arrivi, import IA documenti e ricostruzione costi tramite `@documenti_magazzino`.

Il dominio reale della madre non e pulito: e multi-writer, non transazionale e usa matching eterogenei. Per questo il modulo `Magazzino NEXT` non puo essere dichiarato `COPERTO` oltre il suo core storage e resta `PARZIALE`.
