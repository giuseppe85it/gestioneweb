# REPORT FINGERPRINT ARCHITECTURE CHAT IA NEXT 2026-04-30

## 1. Stato
- Esito: `PARZIALE`
- Motivo del parziale: architettura implementata e verifiche statiche/unitarie verdi; la suite browser Playwright completa non e rieseguibile in questa sessione per blocco ambiente `Firebase: Error (auth/too-many-requests)` prima del render di `/next/chat-tool`.
- Perimetro rispettato: nessuna modifica a reader, madre, Archivista, Firestore o ossatura registry/executor.

## 2. Architettura implementata
- I risultati tool vengono arricchiti con `_id` tramite `backend/internal-ai/server/lib/fingerprint-validator.js`.
- Lo schema strict backend richiede `_id` nei blocchi che mostrano record: `table`, `ranking_table`, `timeline`, `data_table_styled`, `nested_list`.
- Il backend valida ogni `_id` e ogni data visibile nei record della risposta finale contro i dati ritornati dai tool.
- Se la validazione fallisce, il backend rigenera una volta con istruzione esplicita; al secondo fallimento restituisce fallback con soli dati raw verificati.
- Le risposte testuali senza blocchi record restano consentite: generano warning di copertura, non fallback, per evitare regressioni sui prompt descrittivi.

## 3. Tool aggiornati direttamente
Tool registry con propagazione `_id` aggiunta direttamente:
- `toolGetRefuelings.ts`
- `toolSearchMaintenances.ts`
- `toolSearchDocumentsAndInvoices.ts`
- `toolSearchWorkOrders.ts`
- `toolSearchOperationalEvents.ts`
- `toolListVehicles.ts`
- `toolGetCostAggregates.ts`
- `toolGetRefuelingsAggregated.ts`
- `toolGetCosts.ts`
- `toolGetMaterialMovements.ts`
- `toolGetVehicleEvents.ts`
- `toolListInventory.ts`
- `toolGetDocumentCostsByVehicle.ts`
- `toolFindInvoiceSupplier.ts`
- `toolListDrivers.ts`
- `toolListSuppliers.ts`
- `toolListWorkshops.ts`
- `toolListScheduledMaintenanceDue.ts`
- `toolGetVehicleMaterialMovements.ts`
- `toolGetVehicleDocuments.ts`
- `toolGetAdBlueTankEvents.ts`
- `toolGetEuromeccSnapshot.ts`
- `toolGetHistoricalOperationalEvents.ts`
- `toolGetProcurementCosts.ts`
- `toolGetCisternaDocuments.ts`
- `toolSearchVehiclesByAttribute.ts`
- `toolGetVehicleByPlate.ts`

Totale tool aggiornati direttamente: 27.
Il backend applica inoltre enrichment sistemico a tutti i tool outputs ricevuti.

## 4. Agenti e UI
- `src/next/chat-ia/agents/orchestrator.ts`, `analytics.ts` e `visualization.ts` preservano `_id` nelle righe analitiche.
- I blocchi React `DataTableStyled`, `RankingTable`, `Timeline` e `NestedList` espongono `data-chat-ia-fingerprint` sul DOM senza mostrare `_id` come colonna utente.
- `ChatIaEntityLink` usa l'id entita per generare fallback URL specifici verso dossier, manutenzioni, lavori, documenti, cantieri e anagrafiche quando disponibili.

## 5. Test e verifiche
- `node --check backend/internal-ai/server/internal-ai-adapter.js`: PASS
- `node --check backend/internal-ai/server/lib/fingerprint-validator.js`: PASS
- `npx tsc --noEmit --pretty false`: PASS
- lint mirato sui file toccati: PASS
- `npm run build`: PASS
- `npm run test:e2e -- tests/e2e/12-fingerprintIntegrity.spec.ts`: 3/3 PASS

Suite browser:
- `tests/e2e/11-antiAllucinazione.spec.ts`: BLOCCATO in questa sessione per `auth/too-many-requests` prima del render della chat.
- suite completa: DA VERIFICARE dopo reset/raffreddamento auth Firebase anonima.

## 6. Rischi residui
- Alcuni tool non aggiornati direttamente potrebbero dipendere dall'enrichment backend per `_id`: comportamento previsto, ma da verificare con E2E browser quando l'autenticazione torna disponibile.
- I prompt che generano solo testo non espongono fingerprint nel DOM; il validator li consente per non bloccare risposte descrittive, ma continua a bloccare ID inventati e date inventate nei blocchi record.

