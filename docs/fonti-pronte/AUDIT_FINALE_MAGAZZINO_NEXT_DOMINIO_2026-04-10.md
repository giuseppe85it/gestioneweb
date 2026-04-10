# AUDIT FINALE MAGAZZINO NEXT - DOMINIO COMPLETO

- DATA: 2026-04-10
- TIPO: audit strutturale finale, sola lettura
- TARGET:
  - route e wiring reali di `/next/magazzino`
  - `src/next/NextMagazzinoPage.tsx`
  - domain NEXT collegati a inventario, materiali, dossier, costi e procurement
  - writer e lettori legacy/NEXT che usano `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`, `@documenti_magazzino`
- RUNTIME PATCH: nessuna

## 1. Obiettivo
Verificare se il dominio reale oggi collegato a `/next/magazzino` possa essere considerato chiuso nella NEXT.

L'audit usa solo fatti verificati nel repo. La UI visibile non viene considerata prova sufficiente di parity.

## 2. File letti piu importanti
- `src/App.tsx`
- `src/next/NextMagazzinoPage.tsx`
- `src/next/nextData.ts`
- `src/next/NextHomePage.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/NextLegacyStorageBoundary.tsx`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/pages/Inventario.tsx`
- `src/pages/MaterialiConsegnati.tsx`
- `src/pages/Acquisti.tsx`
- `src/pages/DettaglioOrdine.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Mezzo360.tsx`
- `src/pages/AnalisiEconomica.tsx`
- `src/pages/CapoCostiMezzo.tsx`
- `src/pages/CapoMezzi.tsx`
- `src/utils/cloneWriteBarrier.ts`

## 3. Dataset reali mappati
- `@inventario`
  - dataset storage-style multi-writer in `storage/@inventario`
  - shape reali lette nel repo: array diretto, `value`, `items`, `value.items`
- `@materialiconsegnati`
  - dataset storage-style multi-writer in `storage/@materialiconsegnati`
  - shape reali miste: `destinatario` string legacy, `destinatario` oggetto, payload ricchi da writer NEXT
- `@cisterne_adblue`
  - dataset storage-style usato dal modulo `Magazzino NEXT`
  - nessun altro writer/reader business rilevato nel repo
- `@documenti_magazzino`
  - collection Firestore documentale
  - usata come archivio documenti e supporto costi materiali, non come ledger canonico stock
- dataset collegati verificati:
  - `@mezzi_aziendali`
  - `@colleghi`
  - `@fornitori`
  - `@manutenzioni`
  - `@ordini`
  - `@preventivi`
  - `@preventivi_approvazioni`
  - `@listino_prezzi`
  - `@costiMezzo`

## 4. Writer reali mappati

### `@inventario`
- `src/pages/Inventario.tsx`
- `src/pages/MaterialiConsegnati.tsx`
- `src/pages/Acquisti.tsx`
- `src/pages/DettaglioOrdine.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/next/NextMagazzinoPage.tsx`

### `@materialiconsegnati`
- `src/pages/MaterialiConsegnati.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/next/NextMagazzinoPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`

### `@cisterne_adblue`
- `src/next/NextMagazzinoPage.tsx`

### `@documenti_magazzino`
- `src/pages/IA/IADocumenti.tsx`
- writer documentali legacy collegati alle collection IA
- nessun writer in `NextMagazzinoPage.tsx`

## 5. Lettori reali mappati

### Inventario e materiali
- `src/pages/GestioneOperativa.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Mezzo360.tsx`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `src/next/NextLegacyStorageBoundary.tsx`

### Documenti e costi materiali
- `src/pages/DossierMezzo.tsx`
- `src/pages/AnalisiEconomica.tsx`
- `src/pages/CapoCostiMezzo.tsx`
- `src/pages/CapoMezzi.tsx`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/NextMagazzinoPage.tsx`

### Procurement di supporto
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/NextMagazzinoPage.tsx`

## 6. Route / wiring - VERDETTO `CHIUSO`
- `/next/magazzino` monta davvero `NextMagazzinoPage.tsx` come ingresso pubblico canonico del dominio.
- `/next/inventario` e `/next/materiali-consegnati` in `src/App.tsx` sono solo redirect `replace` verso `/next/magazzino?tab=...`.
- sidebar e Home NEXT puntano al modulo canonico `/next/magazzino`.
- restano riferimenti tecnici a `/next/inventario`, per esempio in `internalAiUniversalDocumentRouter.ts`, ma atterrano comunque sul redirect compatibile e non riaprono un runtime separato.
- non risultano altri entrypoint NEXT pubblici che montino un secondo runtime magazzino.

## 7. Inventario - VERDETTO `PARZIALE`

### Fatti verificati
- `NextMagazzinoPage.tsx` copre CRUD locale, quantita rapide, filtri, upload foto e gestione stock del modulo.
- il modulo preserva wrapper storage-style e campi raw dei record esistenti invece di riscrivere tutto in forma semplificata.
- le nuove scritture inventario mantengono compatibilita migliore con writer esterni grazie a `inventarioRefId`, `fornitore`, foto e campi extra preservati.
- il modulo tollera shape reali piu larghe dei writer legacy/NEXT.

### Gap reali
- la parity PDF del legacy `Inventario.tsx` non e stata replicata nel modulo NEXT.
- il contratto di matching stock del dominio resta eterogeneo:
  - `Acquisti.tsx` e `DettaglioOrdine.tsx` usano `descrizione + unita + fornitore`
  - `IADocumenti.tsx` importa per sola `descrizione`
  - `MaterialiConsegnati.tsx` legacy scala per `descrizione + unita`
- il modulo NEXT e piu prudente localmente ma non rende il dominio inventario transazionale.

## 8. Materiali consegnati - VERDETTO `PARZIALE`

### Fatti verificati
- il nuovo modulo copre nuova consegna, decremento stock, storico, grouping destinatari e delete con ripristino stock.
- prima di salvare una consegna blocca stock insufficiente.
- se fallisce la seconda scrittura applica rollback compensativo sul dataset consegne.
- il payload scritto e piu compatibile della madre:
  - `inventarioRefId`
  - `materialeLabel`
  - `direzione`
  - `tipo`
  - `origine`
  - `targa` / `mezzoTarga`
  - `destinatario` strutturato

### Gap reali
- il dominio resta multi-writer e con payload storici eterogenei; il modulo li tollera ma non li rende uniformi.
- il legame mezzo/collega/magazzino e piu robusto nel layer NEXT, ma i reader legacy dipendono ancora spesso da `destinatario.label = targa`.
- delete/ripristino e piu solido della madre per il percorso locale, ma il fallback descrizione+unita+fornitore resta prudenziale e non canonico.
- manca ancora la parity PDF del legacy `MaterialiConsegnati.tsx`.

## 9. Cisterne AdBlue - VERDETTO `CHIUSO`
- la sezione legge e scrive il dataset reale `@cisterne_adblue` come storage-style dedicato.
- nel repo non emergono altri writer o lettori business che rendano il sottodominio dipendente da contratti esterni.
- il flusso e isolato e coerente con il dominio `Magazzino NEXT`, senza riaprire runtime legacy o collezioni Firestore non dimostrate.
- non emergono agganci obbligatori mancanti verso altri moduli.

## 10. Documenti e costi - VERDETTO `PARZIALE`

### Fatti verificati
- la quarta vista `Documenti e costi` usa layer reali del repo:
  - `readNextIADocumentiArchiveSnapshot({ includeCloneDocuments: false })`
  - `readNextDocumentiCostiFleetSnapshot({ includeCloneDocuments: false })`
  - `readNextProcurementSnapshot({ includeCloneOverlays: false })`
  - `readNextMagazzinoRealeSnapshot()`
- la lettura di `@documenti_magazzino` e reale e non decorativa: archivio IA, supporto righe `voci`, link PDF se presenti, preview ordini/preventivi/listino e collegamenti dossier.
- il modulo dichiara correttamente che i costi materiali sono solo supporto derivato e non ledger inventariale canonico.

### Gap reali
- il costo materiali resta ricostruito da documenti e match descrittivo; non diventa un dato transazionale canonico.
- una parte dei documenti puo non esporre `fileUrl`, quindi la vista resta a volte solo metadata-driven.
- la vista e utile e reale, ma non chiude il tema costi materiali come sorgente canonica.

## 11. Compatibilita con Dossier / lettori - VERDETTO `PARZIALE`

### Fatti verificati
- `nextMaterialiMovimentiDomain.ts` normalizza meglio i payload eterogenei e inferisce `MEZZO` / `MAGAZZINO` con piu prudenza.
- `nextDossierMezzoDomain.ts` e i reader NEXT consumano il layer normalizzato invece di appoggiarsi direttamente ai record grezzi.
- `NextLegacyStorageBoundary.tsx` puo restituire `@inventario` e `@materialiconsegnati` in forma legacy-shaped per consumer che vivono ancora su contratti storici.
- i nuovi payload scritti da `NextMagazzinoPage.tsx` espongono `targa`, `mezzoTarga`, `inventarioRefId` e `materialeLabel`, quindi aiutano i lettori esistenti invece di romperli.

### Gap reali
- `DossierMezzo.tsx` e `Mezzo360.tsx` legacy filtrano ancora i materiali mezzo-centrici soprattutto con `destinatario.label === targa`.
- una parte dello storico reale nasce da writer con `destinatario.refId = id mezzo`, altra da writer con `destinatario.refId = targa`, altra ancora da `destinatario` string.
- il layer NEXT compensa, ma la compatibilita completa dipende ancora da normalizzazione e non da un contratto dati uniforme.

## 12. Compatibilita con writer esterni - VERDETTO `PARZIALE`

### Fatti verificati
- `NextMagazzinoPage.tsx` preserva meglio raw e wrapper, quindi tollera di piu i writer esterni reali.
- `nextManutenzioniDomain.ts` scrive oggi un payload materiali piu ricco e allineato al dominio.
- `@documenti_magazzino` non viene scritto dal modulo NEXT, quindi la vista documentale non apre nuovi conflitti.

### Gap reali confermati
- `Acquisti.tsx` e `DettaglioOrdine.tsx` mantengono un rischio concreto di doppio decremento inventario quando viene eliminato un materiale gia arrivato:
  - sottraggono manualmente la quantita dal record inventario
  - poi richiamano ancora la logica differenziale `aggiornaInventario(old,new)`
- `IADocumenti.tsx` continua a importare inventario con matching solo su `descrizione`, senza contratto forte su `id` o `inventarioRefId`.
- `MaterialiConsegnati.tsx` legacy continua a scrivere un payload povero rispetto al nuovo modulo.
- la compatibilita esiste davvero, ma resta passiva e prudenziale; non e una compatibilita canonica chiusa.

## 13. PDF / legacy contracts - VERDETTO `APERTO`
- `Inventario.tsx` legacy genera anteprima/export PDF.
- `MaterialiConsegnati.tsx` legacy genera anteprima/export PDF per destinatario e globale.
- `NextMagazzinoPage.tsx` non replica questi export del dominio.
- nella quarta vista il modulo puo aprire PDF gia esistenti di documenti, preventivi o ordini, ma questo non equivale alla parity PDF del dominio magazzino.
- il contratto legacy PDF del dominio resta quindi scoperto.

## 14. Comparazione madre vs NEXT

### Coperture reali dimostrate nella NEXT
- ingresso pubblico canonico unico del dominio
- CRUD operativo locale inventario
- consegne materiali con blocco stock insufficiente
- rollback compensativo locale della doppia scrittura consegna/inventario
- sezione `Cisterne AdBlue` completa sul suo dataset
- vista read-only documenti/costi/procurement davvero collegata ai layer reali

### Coperture parziali
- compatibilita con dossier e lettori materiali/costi
- compatibilita con writer esterni
- parity logica cross-modulo con la madre

### Coperture mancanti
- parity PDF `Inventario` / `Materiali consegnati`
- contratto transazionale unico per lo stock
- costo materiali canonico condiviso

## 15. Gap reali rimasti
- manca ancora la parity PDF del dominio `Magazzino`.
- manca un contratto canonico unico per il matching inventario tra `Magazzino`, `Acquisti`, `DettaglioOrdine`, `Manutenzioni`, `IADocumenti`.
- il dominio resta multi-writer e non transazionale tra ordini, arrivi, consegne, manutenzioni e import IA.
- `@documenti_magazzino` resta supporto documentale/costi, non ledger canonico.
- `nextOperativitaGlobaleDomain.ts` continua a descrivere inventario/materiali come read-only nel riepilogo globale: non rompe `/next/magazzino`, ma resta una copia di stato non riallineata al runtime reale del dominio.

## 16. Verdetto finale per blocco

| Blocco | Verdetto | Motivazione sintetica |
|---|---|---|
| Route e wiring Magazzino NEXT | `CHIUSO` | `/next/magazzino` e canonico, vecchi path solo redirect compatibili, sidebar/home allineati. |
| Inventario | `PARZIALE` | Core operativo coperto e shape preservate, ma mancano parity PDF e contratto stock condiviso. |
| Materiali consegnati | `PARZIALE` | Flusso locale coperto meglio della madre, ma payload storici e writer eterogenei mantengono fragilita. |
| Cisterne AdBlue | `CHIUSO` | Sottodominio isolato, dataset reale coerente, nessun aggancio esterno critico emerso nel repo. |
| Documenti e costi | `PARZIALE` | Integrazione reale e utile, ma costi materiali ancora solo supporto derivato read-only. |
| Compatibilita con Dossier / lettori | `PARZIALE` | Layer NEXT e adapter aiutano, ma i contratti legacy su `destinatario` restano eterogenei. |
| Compatibilita con writer esterni | `PARZIALE` | Compatibilita reale ma prudenziale; confermati rischi procurement e matching IA descrittivo. |
| Parity logica con la madre | `PARZIALE` | Copertura molto piu ampia del pre-audit, ma non chiude PDF e multi-writer. |
| Dominio Magazzino NEXT complessivo | `PARZIALE` | Modulo credibile e centrale nella NEXT, ma non certificabile `CHIUSO`. |

## 17. Verdetto finale sul dominio `Magazzino NEXT`
`Magazzino NEXT` non puo essere promosso a `CHIUSO`.

Il modulo e davvero il centro operativo canonico della NEXT per il dominio, ma la prova nel repo non chiude ancora:
- parity PDF del dominio
- contratto stock condiviso tra writer esterni
- costo materiali canonico
- transazionalita cross-modulo

Lo stato corretto del dominio dopo questo audit finale resta `PARZIALE`.
