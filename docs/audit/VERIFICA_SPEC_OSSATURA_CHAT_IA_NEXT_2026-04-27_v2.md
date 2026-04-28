# VERIFICA SPEC OSSATURA CHAT IA NEXT - V2

## 1. INTRO

Data verifica: 2026-04-28

File verificato: `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`

Fonte unica di verita applicata: codice reale del repository nel workspace corrente.

Risultato sintetico: DIVERGENZE TOTALI = 3

Verdetto: DA CORREGGERE

Nota vincolante: Archivista non analizzato. Non sono stati aperti file sorgente del sottosistema Archivista; le eventuali occorrenze in documenti generali o route adiacenti non sono state oggetto di verifica funzionale.

## 2. CLAIM TECNICI VERIFICATI

### A. Path e file citati

Esito: OK con divergenze di riga censite in sezione 3.

- `docs/product/MAPPA_IA_CHAT_NEXT.md` esiste ed e stato aperto.
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md` esiste ed e stato aperto come documento citato.
- `src/next/chat-ia/` non esiste oggi, coerente con la spec che lo dichiara "cartella nuova" e "file da creare nell'ossatura".
- I file esistenti citati in sezioni 2, 3, 7, 8, 9 e 11 esistono e sono stati aperti sui range indicati.
- I file `src/pages/**`, `src/next/NextInternalAiPage.tsx`, orchestratore, motore unificato, backend adapter, reader D01-D10 e wrapper write esistono.
- `src/next/internal-ai/InternalAiMezzoCard.tsx` e `src/next/internal-ai/internalAiMezzoCard.css` esistono.
- `src/utils/pdfEngine.ts` esiste ed e stato aperto per conferma appendice.

### B. Numeri di riga e riferimenti esistenti

Esito: OK salvo 3 divergenze in sezione 3.

- Le quattro surface chat sono veri container in `src/next/NextInternalAiPage.tsx:9655`, `9974`, `10315`, `10815`.
- `handleChatSubmit` e reale in `src/next/NextInternalAiPage.tsx:7605-7641`.
- Il motore unificato intercetta prima dello switch in `src/next/internal-ai/internalAiChatOrchestrator.ts:2035-2039`.
- `buildGenericResponse` e reale in `src/next/internal-ai/internalAiChatOrchestrator.ts:1648-1677`.
- `InternalAiServerPersistenceMode = "server_file_isolated"` e reale a `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:16`.
- Lo state artifact repository e reale a `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:50-56`.
- `persistenceMode` e `runtimeDataRoot` sono reali a `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:148-151`.
- L'endpoint artifact repository e reale a `backend/internal-ai/server/internal-ai-adapter.js:2236-2318` e usa `persistenceMode: "server_file_isolated"` a riga 2261.
- Il punto di controllo della barriera non e piu al range indicato dalla spec: vedi DVG-V2-001.
- Il range D07/D08 del reader Documenti/Costi non e piu aggiornato: vedi DVG-V2-002.
- Il range aggregato PDF preview/share in sezione 11 e parziale: vedi DVG-V2-003.

### C. Nomi di funzioni, costanti e tipi

Esito: OK.

- `InternalAiReportType` esiste a `src/next/internal-ai/internalAiTypes.ts:112`.
- `InternalAiReportPeriodInput` esiste a `src/next/internal-ai/internalAiTypes.ts:121`.
- `InternalAiReportPreview` esiste a `src/next/internal-ai/internalAiTypes.ts:441`.
- `MezzoDossierStructuredCard` esiste a `src/next/internal-ai/internalAiTypes.ts:784-787`.
- `InternalAiChatMessage` esiste a `src/next/internal-ai/internalAiTypes.ts:789-801`.
- `runInternalAiServerControlledChat` esiste a `src/next/internal-ai/internalAiServerChatClient.ts:72`.
- `buildControlledChatUserPayload` esiste a `backend/internal-ai/server/internal-ai-adapter.js:626`.
- `generateInternalAiReportPdfBlob` esiste a `src/next/internal-ai/internalAiReportPdf.ts:219`.
- `buildInternalAiReportPdfFileName` esiste a `src/next/internal-ai/internalAiReportPdf.ts:118`.
- `openPreview` esiste a `src/utils/pdfPreview.ts:46`.
- `sharePdfFile` esiste a `src/utils/pdfPreview.ts:73`.
- `assertCloneWriteAllowed` esiste a `src/utils/cloneWriteBarrier.ts:552`.
- `NEXT_IA_PATH` e `NEXT_INTERNAL_AI_PATH` esistono a `src/next/nextStructuralPaths.ts:27-28`.
- `NEXT_CHAT_IA_PATH` non esiste oggi, coerente con "costante futura".

### D. Shape di tipi e contratti

Esito: OK.

- `ChatIaRunnerResult` nella spec contiene `sources?: ChatIaSectorId[]`.
- `ChatIaMessage` usa `archiveEntries: ChatIaArchiveEntry[]`; non ci sono occorrenze singolari `archiveEntry` nella spec.
- `fallbackContext` usa sempre la forma a oggetto `{ prompt, decision }` nelle occorrenze testuali della spec.
- `InternalAiChatMemoryHints` reale ha 6 campi: `repoUiRequested`, `memoryFreshness`, `screenHint`, `focusKind`, `attachmentsCount`, `runtimeObserverObserved`.
- Il payload backend della spec include `operation: "run_controlled_chat"` ed e coerente con `InternalAiServerOrchestratorChatRequestBody`.

### E. Comportamenti dichiarati

Esito: OK.

- I file futuri sotto `src/next/chat-ia/**` sono dichiarati da creare, quindi la loro assenza attuale non e divergenza.
- La vecchia route `/next/ia/report` resta presente in `src/App.tsx:506-512`.
- Le route IA interne esistenti restano nel blocco `/next` in `src/App.tsx:522-557`.
- Il backend controllato puo tornare `null` o status `provider_not_configured` / `upstream_error`, coerente con la strategia fallback locale della spec.
- La deroga barriera per `/next/chat`, `chat_ia_reports` e `chat_ia_reports/` e dichiarata autorizzata ma non ancora applicata; `rg` su `src/utils/cloneWriteBarrier.ts` non trova quei token.
- `storageSync` dimostra l'uso della collection Firestore `storage` a `src/utils/storageSync.ts:27-35` e `139-149`.

### F. Numeri di riferimento

Esito: OK salvo divergenze gia censite.

- `SCOPE_PATTERNS` contiene 17 scope reali nel range `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:483-515`.
- `UNIFIED_SOURCE_DESCRIPTORS` contiene 44 occorrenze reali di `sourceId` nel range `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:555-600`.
- Porta backend `4310` confermata a `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:36`.
- `InternalAiMezzoCard` e il componente reale a `src/next/internal-ai/InternalAiMezzoCard.tsx:60`.

## 3. DIVERGENZE TROVATE

### CRITICHE

Nessuna.

### MEDIE

#### DVG-V2-002 - Range D07/D08 Documenti/Costi non aggiornato

- Sezione/riga spec: sezione 11, riga 853.
- Cosa dice la spec: D07/D08 vive in `src/next/domain/nextDocumentiCostiDomain.ts:1925-2218`.
- Codice reale: `readNextIADocumentiArchiveSnapshot` inizia a `src/next/domain/nextDocumentiCostiDomain.ts:2010`; `readNextDocumentiCostiFleetSnapshot` inizia a `src/next/domain/nextDocumentiCostiDomain.ts:2247`.
- Impatto: il range della spec non identifica piu correttamente il blocco D07/D08 completo; in particolare non copre l'entry point fleet snapshot.
- Severita: MEDIA.

### MINORI

#### DVG-V2-001 - Range del punto di controllo `assertCloneWriteAllowed` non aggiornato

- Sezione/riga spec: sezione 8, riga 764.
- Cosa dice la spec: punto di controllo attuale in `src/utils/cloneWriteBarrier.ts:547-549`.
- Codice reale: `src/utils/cloneWriteBarrier.ts:547-549` contiene `isCloneRuntime`; `assertCloneWriteAllowed` inizia a `src/utils/cloneWriteBarrier.ts:552` e il blocco di controllo e a `552-559`.
- Impatto: stato della deroga corretto, path:riga impreciso.
- Severita: MINORE.

#### DVG-V2-003 - Range PDF preview/share in sezione 11 parziale

- Sezione/riga spec: sezione 11, riga 843; sezione 9, riga 778.
- Cosa dice la spec: `src/utils/pdfPreview.ts:47-85` copre anteprima e share PDF; `sharePdfFile` e in `src/utils/pdfPreview.ts:73-85`.
- Codice reale: `openPreview` parte a `src/utils/pdfPreview.ts:46` e chiude a `70`; `sharePdfFile` parte a `73` e chiude a `103`.
- Impatto: i nomi sono corretti, ma il range della share non copre l'intera funzione e il range aggregato salta l'export di `openPreview`.
- Severita: MINORE.

## 4. VERIFICA EX-DIVERGENZE

### DVG-001 - Payload backend senza `operation`

Stato: RISOLTA.

La spec include `operation: "run_controlled_chat"` a riga 614. Il contratto reale richiede lo stesso campo in `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:261-266`; il bridge esistente lo passa a `src/next/internal-ai/internalAiChatOrchestratorBridge.ts:191-193`.

### DVG-002 - `memoryHints` backend con shape sbagliata

Stato: RISOLTA.

La spec usa i 6 campi reali a righe 628-635. Il tipo reale e `InternalAiChatMemoryHints` in `src/next/internal-ai/internalAiTypes.ts:704-711`.

### DVG-003 - Nome preview PDF errato

Stato: RISOLTA.

La spec usa `openPreview` a riga 777. Il codice reale esporta `openPreview` in `src/utils/pdfPreview.ts:46-70`; `createPdfPreviewUrl` non e citato nella spec verificata.

### DVG-004 - `ChatIaRunnerResult` senza `sources`

Stato: RISOLTA.

La spec definisce `sources?: ChatIaSectorId[]` in `ChatIaRunnerResult` a riga 338 e lo usa come regola a righe 532 e 545.

### DVG-005 - Riferimenti delle quattro surface chat

Stato: RISOLTA.

La spec cita i quattro container reali: `src/next/NextInternalAiPage.tsx:9655`, `9974`, `10315`, `10815`. Il codice aperto conferma che sono punti surface reali della chat esistente.

### DVG-006 - Forma chiamata `fallbackContext`

Stato: RISOLTA.

Tutte le occorrenze operative nella spec usano la forma a oggetto: `runner.fallbackContext({ prompt, decision })` e `this.fallbackContext({ prompt, decision })`.

### DVG-007 - Riferimento a `server_file_isolated`

Stato: RISOLTA.

La spec cita il literal a `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:16`, lo state a `50-56`, il runtime root a `148-151` e l'endpoint adapter con response `persistenceMode: "server_file_isolated"` a `backend/internal-ai/server/internal-ai-adapter.js:2261`.

### DVG-008 - Conteggio source descriptor

Stato: RISOLTA.

La spec dice 44 source descriptor a riga 867. Nel range `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:555-600` ci sono 44 occorrenze reali di `sourceId`.

### DVG-009 - `archiveEntry` singolare

Stato: RISOLTA.

La spec usa `archiveEntries` plurale a righe 305, 394 e 667. `rg` non trova `archiveEntry` singolare come token autonomo.

### DVG-010 - Stato deroga barriera

Stato: RISOLTA.

Le sezioni 8, 12 e 15 sono coerenti: deroga stretta autorizzata da Giuseppe, non ancora applicata nel codice. Il codice reale conferma assenza di `/next/chat`, `chat_ia_reports` e `chat_ia_reports/` in `src/utils/cloneWriteBarrier.ts`.

### DVG-011 - Return fallback jsPDF

Stato: RISOLTA.

La spec cita il range `src/next/internal-ai/internalAiReportPdf.ts:271-397` e dichiara `blob`, `fileName` e `text`. Il codice reale ritorna esattamente quei campi a `392-396`.

## 5. VERIFICHE COERENZA INTERNA

### Tipi usati in modo coerente

Esito: OK.

- `ChatIaMessage`, `ChatIaArchiveEntry`, `ChatIaRunnerResult`, `ChatIaRouterDecision`, `ChatIaRunnerContext` sono coerenti tra sezioni 3, 4, 5, 6, 7, 8 e 9.
- `sources` e presente nel tipo e nella regola runner.
- `archiveEntries` e plurale in tutti i punti verificati.
- `fallbackContext` ha firma e chiamate coerenti.

### File dichiarati in sezione 1 coerenti con sezioni successive

Esito: OK.

I file futuri usati nelle sezioni successive sono tutti presenti nell'albero previsto della sezione 1. Non risultano file futuri citati fuori dall'albero `src/next/chat-ia/**`.

### Decisioni D1-D5 coerenti con le altre sezioni

Esito: OK.

- D1 e coerente con sezione 8: `chat_ia_reports`, `chat_ia_reports/{sector}/{yyyy}/{entryId}.pdf`, `pdfStoragePath`, `pdfUrl`.
- D2 e coerente con sezioni 8 e 12: deroga autorizzata, non ancora applicata.
- D3 e coerente con sezione 8: soft delete con `status = "deleted"` e `deletedAt`.
- D4 e coerente con sezioni 4 e 8: accesso archivio solo via prompt libero.
- D5 e coerente con Definition of Done: report dummy come validazione ossatura.

## 6. RIEPILOGO RACCOMANDAZIONI

Verdetto: DA CORREGGERE.

Raccomandazioni:

1. Aggiornare il range D07/D08 Documenti/Costi in sezione 11 ai riferimenti reali attuali: `readNextIADocumentiArchiveSnapshot` a riga 2010 e `readNextDocumentiCostiFleetSnapshot` a riga 2247.
2. Aggiornare il range del punto di controllo barriera da `547-549` a `552-559`.
3. Aggiornare il range PDF preview/share in sezione 11: `openPreview` a `46-70` e `sharePdfFile` a `73-103`.

Nota: le 11 ex-divergenze DVG-001 ... DVG-011 risultano tutte risolte.

## 7. APPENDICE: FILE LETTI

File di contesto operativo:

- `docs/_live/STATO_ATTUALE_PROGETTO.md`

Spec e documenti citati:

- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`
- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`
- `docs/audit/VERIFICA_SPEC_OSSATURA_CHAT_IA_NEXT_2026-04-27.md`

Codice e risorse aperti:

- `src/App.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/next/internal-ai/internalAiServerChatClient.ts`
- `src/next/internal-ai/InternalAiMezzoCard.tsx`
- `src/next/internal-ai/internalAiMezzoCard.css`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
- `src/utils/pdfPreview.ts`
- `src/utils/pdfEngine.ts`
- `src/utils/storageSync.ts`
- `src/utils/firestoreWriteOps.ts`
- `src/utils/storageWriteOps.ts`
- `src/utils/cloneWriteBarrier.ts`
- `src/firebase.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`

Conferme finali:

- Archivista non analizzato.
- Nessun file di codice modificato.
- Spec non modificata.
