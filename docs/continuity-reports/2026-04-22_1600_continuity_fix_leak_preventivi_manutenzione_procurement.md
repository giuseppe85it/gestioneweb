# CONTINUITY REPORT - Fix leak preventivi manutenzione nel layer procurement

## Contesto generale

Il progetto NEXT e in fase di apertura chirurgica delle scritture modulo per modulo. Il sottosistema IA interna (`Archivista`) gestisce l'importazione di documenti su due rami distinti: `Magazzino` e `Manutenzione`. I preventivi del ramo Manutenzione venivano salvati nello stesso documento Firestore dei preventivi Magazzino (`storage/@preventivi`) con un campo discriminante `ambitoPreventivo: "manutenzione"`, ma il domain procurement e il registry IA non applicavano alcun filtro su questo campo.

## Modulo/area su cui si stava lavorando

- Layer procurement NEXT: `readNextProcurementSnapshot()` in `nextProcurementDomain.ts`
- Pipeline documenti costi dossier: `readNextDocumentiCostiProcurementSupportSnapshot()` in `nextDocumentiCostiDomain.ts`
- Registry universale IA: `snapshotFromRawStorage()` per `storage/@preventivi` in `internalAiUnifiedIntelligenceEngine.ts`

## Stato attuale

- Fix applicato e build/lint verificati.
- I tre punti di leakage identificati nell'audit sono stati chiusi.
- Il dossier mezzo ha un bug ortogonale (campo `entry.targa` vs `entry.metadatiMezzo.targa`) registrato nell'audit come debito separato — non chiuso in questo task.

## Legacy o Next

- NEXT

## Stato area/modulo nella NEXT

- NEXT Procurement: `PARZIALE` (scrittura aperta, leak chiuso, dossier targa-matching debito aperto)
- NEXT IA Interna / Archivista: `PARZIALE`

## Cosa e gia stato importato/migrato

- Lettura procurement da `storage/@preventivi` con filtro ambito
- Filtro `ambitoPreventivo` applicato a tutte le pipeline di lettura autorizzate

## Prossimo step di migrazione

- Verifica runtime: aprire `/next/materiali-da-ordinare?tab=preventivi` dopo aver archiviato un preventivo manutenzione e confermare che non compare nella lista
- Verifica runtime `/next/magazzino?tab=documenti-costi`: idem
- Valutare se correggere il bug ortogonale `entry.targa` vs `entry.metadatiMezzo.targa` in `nextDocumentiCostiDomain.ts` come task separato

## Moduli impattati

- NEXT Procurement (`nextProcurementDomain.ts`)
- NEXT Documenti Costi (`nextDocumentiCostiDomain.ts`)
- NEXT IA Interna — registry universale (`internalAiUnifiedIntelligenceEngine.ts`)

## Contratti dati coinvolti

- `storage/@preventivi` (doc Firestore): campo `ambitoPreventivo` ("manutenzione" | "magazzino" | assente)

## Ultime modifiche eseguite

- `nextProcurementDomain.ts`: aggiunto filtro `ambitoPreventivo !== "manutenzione"` nella pipeline `readNextProcurementSnapshot()`
- `nextDocumentiCostiDomain.ts`: esteso filtro `preventiviItems` con la stessa condizione in `readNextDocumentiCostiProcurementSupportSnapshot()`
- `internalAiUnifiedIntelligenceEngine.ts`: filtro specifico per `sourceId === "storage/@preventivi"` nel loop `raw_storage_doc`

## File coinvolti

- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `docs/product/AUDIT_PREVENTIVO_MANUTENZIONE_LEAK_PROCUREMENT.md`
- `docs/product/AUDIT_LEAK_PREVENTIVO_MANUTENZIONE_COMPLETO.md`

## Decisioni gia prese

- Filtro su `ambitoPreventivo === "manutenzione"` (uguaglianza stretta) — non su `famigliaArchivista`
- Retrocompatibilita: record senza `ambitoPreventivo` (pre-2026-04-22) restano inclusi
- Dossier mezzo: fuori perimetro di questo fix

## Vincoli da non rompere

- Non toccare i bridge Archivista, `cloneWriteBarrier.ts`, `storage.rules`
- Non toccare le pipeline di scrittura
- Non modificare il campo `ambitoPreventivo` scritto da `archiveArchivistaPreventivoRecord()`
- La condizione di esclusione deve essere SOLO `=== "manutenzione"` (stretta), mai `!= null` o analoghi

## Parti da verificare

- Verifica runtime effettiva (non certificata in questa sessione per assenza browser MCP)
- Bug ortogonale `entry.targa` vs `entry.metadatiMezzo.targa` nel dossier mezzo

## Rischi aperti

- Nessun rischio noto sulle pipeline di lettura modificate
- Il dossier mezzo non riconoscera mai i preventivi manutenzione come "targa-matching" fino a fix separato

## Prossimo passo consigliato

- Verifica runtime delle tre superfici impattate (Materiali da ordinare, Magazzino documenti-costi, IA interna)
- Eventuale task separato per il bug `entry.targa` nel dossier

## Cosa NON fare nel prossimo task

- Non riaprire il filtro di esclusione per includere i preventivi manutenzione nel layer procurement
- Non modificare il writer `archiveArchivistaPreventivoRecord()` o il campo `ambitoPreventivo`
- Non toccare `storage.rules` o barrier in questo contesto

## Commit/hash rilevanti

- NON ESEGUITO in questa sessione

## Documenti di riferimento da leggere

- `docs/product/AUDIT_PREVENTIVO_MANUTENZIONE_LEAK_PROCUREMENT.md`
- `docs/product/AUDIT_LEAK_PREVENTIVO_MANUTENZIONE_COMPLETO.md`
- `docs/change-reports/2026-04-22_1600_fix_leak_preventivi_manutenzione_procurement.md`
- `docs/change-reports/2026-04-22_1430_fix_storage-rules_preventivi.md`
