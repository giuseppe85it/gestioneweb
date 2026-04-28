# VERIFICA SPEC OSSATURA CHAT IA NEXT

## 1. INTRO

Data verifica: 2026-04-28

File verificato: `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`

Fonte unica di verita applicata: codice reale del repository.

Risultato sintetico: DIVERGENZE = 11

Verdetto: DA CORREGGERE

Nota vincolante: Archivista non analizzato. Sono state lette solo occorrenze testuali o route adiacenti quando presenti nei file richiesti dalla spec; nessun file Archivista e stato aperto come oggetto di audit.

## 2. CLAIM TECNICI VERIFICATI

### A. Path di file citati

| Claim | Riga spec | Esito | Verifica |
|---|---:|---|---|
| A01 | 30 | OK | `docs/product/MAPPA_IA_CHAT_NEXT.md` esiste ed e stato aperto. |
| A02 | 31 | OK | `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md` esiste ed e stato aperto. |
| A03 | 45-95 | OK | `src/next/chat-ia/` non esiste oggi, coerente con "cartella nuova" e "albero previsto". |
| A04 | 49 | OK | `src/next/internal-ai/` esiste; non e stato usato per analizzare Archivista. |
| A05 | 50, 871 | OK | `src/pages/` esiste. |
| A06 | 101-120 | OK | I file `src/next/chat-ia/**` sono dichiarati "da creare", quindi la loro assenza attuale non e divergenza. |
| A07 | 161-165 | OK | File esistenti aperti: `src/next/NextInternalAiPage.tsx`, `src/next/internal-ai/internalAiChatOrchestrator.ts`, `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`. |
| A08 | 175-179 | OK | `src/next/internal-ai/internalAiTypes.ts` esiste ed e stato aperto sui range citati. |
| A09 | 363-364 | OK | `src/App.tsx` e `src/next/nextStructuralPaths.ts` esistono ed e stato aperto il range citato. |
| A10 | 425-426, 859-860 | OK | `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` esiste ed e stato aperto sui range citati. |
| A11 | 595-600, 821-825 | OK | I file backend/client citati esistono ed e stato aperto il range citato. |
| A12 | 752-757, 852-855 | OK | `firestoreWriteOps.ts`, `storageWriteOps.ts`, `cloneWriteBarrier.ts`, `firebase.ts`, `storageSync.ts` esistono ed e stato aperto il range citato. |
| A13 | 767-771, 834-836 | OK | `internalAiReportPdf.ts` e `pdfPreview.ts` esistono ed e stato aperto il range citato. |
| A14 | 840-848 | OK | Tutti i file reader D01-D10 esistono ed e stato aperto il range citato. |
| A15 | 864-865 | OK | `InternalAiMezzoCard.tsx` e `internalAiMezzoCard.css` esistono ed e stato aperto il riferimento. |
| A16 | 1011-1039 | OK | I path dell'appendice esistono; `src/utils/pdfEngine.ts` e stato aperto per esistenza reale. |

Esito categoria A: nessuna divergenza di esistenza path sui file dichiarati esistenti. I path futuri sotto `src/next/chat-ia/**` sono assenti ma la spec li dichiara da creare.

### B. Numeri di riga citati

| Claim | Riga spec | Esito | Verifica |
|---|---:|---|---|
| B01 | 161 | DIVERGENZA | Le quattro surface esistono come quattro punti, ma due riferimenti puntano al renderer del testo, non al container surface. Vedi DVG-005. |
| B02 | 162 | OK | `src/next/NextInternalAiPage.tsx:7605-7638` contiene `handleChatSubmit` e chiamata al backend. |
| B03 | 163 | OK | `src/next/internal-ai/internalAiChatOrchestrator.ts:2035-2039` intercetta il motore unificato prima dello switch. |
| B04 | 164, 490 | OK | `src/next/internal-ai/internalAiChatOrchestrator.ts:1648-1677` contiene `buildGenericResponse` con elenco di capacita. |
| B05 | 165, 675 | OK | `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:148-151` contiene `persistenceMode` e `runtimeDataRoot`. |
| B06 | 175-179 | OK | I tipi esistenti sono nei range dichiarati di `internalAiTypes.ts`. |
| B07 | 363, 816 | OK | `src/App.tsx:506-525` contiene `ia/report` e inizio `ia/interna` nel blocco route NEXT. |
| B08 | 364, 817 | OK | `src/next/nextStructuralPaths.ts:27-32` contiene `NEXT_IA_PATH` e costanti IA interna. |
| B09 | 425, 859 | OK | `SCOPE_PATTERNS` e in `internalAiUnifiedIntelligenceEngine.ts:483-515`. |
| B10 | 426 | OK | `SCOPE_SOURCE_MAP` e in `internalAiUnifiedIntelligenceEngine.ts:517-553`. |
| B11 | 595-600, 821-825 | OK | I range backend/client dichiarati corrispondono a port, route, client, app Express, payload e system prompt. |
| B12 | 674 | DIVERGENZA | Il range `50-56` contiene la shape state, ma non il literal `server_file_isolated`. Vedi DVG-007. |
| B13 | 676 | OK | `backend/internal-ai/server/internal-ai-adapter.js:2236-2318` e l'endpoint artifact repository. |
| B14 | 755, 852-853 | OK | I wrapper chiamano `assertCloneWriteAllowed` nei range dichiarati. |
| B15 | 757 | OK | `src/utils/cloneWriteBarrier.ts:547-549` e il punto di controllo `assertCloneWriteAllowed`. |
| B16 | 767-769, 834-835 | OK con nota | Il motore PDF esiste nei range dichiarati; il fallback jsPDF ritorna anche `text`. Vedi DVG-011. |
| B17 | 770-771 | DIVERGENZA | `sharePdfFile` esiste, ma `createPdfPreviewUrl` non esiste. Vedi DVG-003. |
| B18 | 840-848 | OK | I path:riga D01-D10 corrispondono a funzioni reali o al punto di ingresso del reader indicato. |
| B19 | 854-855 | OK | `firebase.ts` e `storageSync.ts` confermano Storage config e collection Firestore `storage`. |
| B20 | 860 | DIVERGENZA | Il range `555-600` contiene 44 descriptor, non 45. Vedi DVG-008. |
| B21 | 864 | OK | `InternalAiMezzoCard.tsx:60` contiene il componente card. |

### C. Nomi di funzioni, costanti e tipi citati

| Claim | Riga spec | Esito | Verifica |
|---|---:|---|---|
| C01 | 175 | OK | `InternalAiReportType` esiste a `src/next/internal-ai/internalAiTypes.ts:112`. |
| C02 | 176, 445 | OK | `InternalAiReportPeriodInput` esiste a `src/next/internal-ai/internalAiTypes.ts:121`. |
| C03 | 177 | OK | `InternalAiReportPreview` esiste a `src/next/internal-ai/internalAiTypes.ts:441`. |
| C04 | 178 | OK | `MezzoDossierStructuredCard` esiste a `src/next/internal-ai/internalAiTypes.ts:784-787`. |
| C05 | 179 | OK | `InternalAiChatMessage` esiste a `src/next/internal-ai/internalAiTypes.ts:789-801`. |
| C06 | 162 | OK | `handleChatSubmit` esiste a `src/next/NextInternalAiPage.tsx:7605`. |
| C07 | 425-426 | OK | `SCOPE_PATTERNS` e `SCOPE_SOURCE_MAP` esistono e non sono esportati. |
| C08 | 597 | OK | `runInternalAiServerControlledChat` esiste a `src/next/internal-ai/internalAiServerChatClient.ts:72`. |
| C09 | 599 | OK | `buildControlledChatUserPayload` esiste a `backend/internal-ai/server/internal-ai-adapter.js:626`. |
| C10 | 767 | OK | `generateInternalAiReportPdfBlob` esiste a `src/next/internal-ai/internalAiReportPdf.ts:219`. |
| C11 | 769 | OK | `buildInternalAiReportPdfFileName` esiste a `src/next/internal-ai/internalAiReportPdf.ts:118`. |
| C12 | 770 | DIVERGENZA | `createPdfPreviewUrl` non esiste in `src/utils/pdfPreview.ts`; il nome reale e `openPreview`. Vedi DVG-003. |
| C13 | 771 | OK | `sharePdfFile` esiste a `src/utils/pdfPreview.ts:73`. |
| C14 | 755, 757 | OK | `assertCloneWriteAllowed` esiste e viene chiamato dai wrapper. |
| C15 | 364 | OK | `NEXT_IA_PATH` e `NEXT_INTERNAL_AI_PATH` esistono con i valori dichiarati; `NEXT_CHAT_IA_PATH` e dichiarata come futura. |
| C16 | T3.8 | OK | `PRIORITY_HIGH_THRESHOLD` e `PREVIEW_LIMIT` non sono citate dalla spec verificata; non esiste claim da correggere su queste due costanti. |

### D. Shape di tipi e interfacce citate

| Claim | Riga spec | Esito | Verifica |
|---|---:|---|---|
| D01 | 183-348 | OK con divergenza interna | Le shape nuove sono future. Coerenza interna non completa: manca `sources` su `ChatIaRunnerResult`. Vedi DVG-004. |
| D02 | 335-347, 541-545 | DIVERGENZA | La regola del runner richiede un risultato con `sources`, ma il tipo richiesto non lo contiene. Vedi DVG-004. |
| D03 | 510-523, 477-478 | DIVERGENZA | La firma `fallbackContext(args)` non coincide con la chiamata testuale `fallbackContext(prompt, decision)`. Vedi DVG-006. |
| D04 | 610-630 | DIVERGENZA | La shape `ChatIaBackendRequest` non coincide con `InternalAiServerOrchestratorChatRequestBody`. Vedi DVG-001 e DVG-002. |
| D05 | 697-714, 730-737 | OK | Le funzioni archivio e la shape Firestore sono future ma coerenti con `ChatIaArchiveEntry`. |
| D06 | 775-782 | OK | Il contratto adapter PDF futuro `blob + fileName` e coerente come sottoinsieme utile. |

### E. Comportamenti dichiarati

| Claim | Riga spec | Esito | Verifica |
|---|---:|---|---|
| E01 | 151-157 | OK | Ruoli dichiarati sono futuri; non confliggono con il codice letto. |
| E02 | 161 | OK con divergenza di riga | Il codice contiene quattro punti di rendering/surface chat, ma due linee citate non sono i container. Vedi DVG-005. |
| E03 | 163 | OK | Il motore unificato viene tentato prima dello switch sugli intent. |
| E04 | 164, 490 | OK | Il fallback generico esistente elenca molte capacita. |
| E05 | 600, 642-649 | OK | Il backend dichiara confine chiuso: `CONTROLLED_CHAT_DATA_BOUNDARY` e system prompt negano live-read business e scritture business. |
| E06 | 653-656 | OK | Il client puo tornare `null`; gli status `provider_not_configured` e `upstream_error` sono previsti. Il timeout e futuro. |
| E07 | 668-670 | OK | Firestore + Storage per il nuovo archivio sono decisione futura, non claim di runtime esistente. |
| E08 | 754-756 | OK | I wrapper reali passano da `assertCloneWriteAllowed`; nessuna deroga `/next/chat` o `chat_ia_reports` esiste oggi. |
| E09 | 674-676 | OK con divergenza di range | Artifact repository server-side esiste, ma il range `50-56` non prova da solo `server_file_isolated`. Vedi DVG-007. |
| E10 | 660-661 | DIVERGENZA | La spec dice che il backend non puo cambiare `archiveEntry`, ma il tipo definito usa `archiveEntries` sul messaggio e non espone `archiveEntry` nel runner. Vedi DVG-009. |
| E11 | 756-757, 883-885, 956-965 | DIVERGENZA | Lo stato autorizzativo della deroga barriera e incoerente tra sezioni. Vedi DVG-010. |
| E12 | 802-808, 872-879, 905-907 | OK | Sono vincoli futuri; nessun file vietato e stato modificato da questa verifica. Archivista non analizzato. |

### F. Numeri di riferimento

| Claim | Riga spec | Esito | Verifica |
|---|---:|---|---|
| F01 | 161 | OK con divergenza di riga | Quattro punti chat individuati nel file; linee reali dei container: 9655, 9974, 10315, 10815. |
| F02 | 425, 859 | OK | `SCOPE_PATTERNS` contiene 17 scope reali. |
| F03 | 860 | DIVERGENZA | `UNIFIED_SOURCE_DESCRIPTORS` contiene 44 `sourceId`, non 45. Vedi DVG-008. |
| F04 | 595 | OK | Porta backend `4310` confermata a `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:36`. |
| F05 | 656 | OK | Timeout 8 secondi e requisito futuro dell'ossatura; non esiste codice da verificare oggi. |
| F06 | 941-1007 | OK con divergenza di coerenza | Le decisioni D1-D5 sono 5; D2 e incoerente con sezioni 8/12. Vedi DVG-010. |
| F07 | Audit di supporto | OK | `src/next/NextInternalAiPage.tsx` ha 14903 righe reali. La spec non usa questo numero come claim diretto. |

## 3. DIVERGENZE TROVATE

### CRITICHE

#### DVG-001 - Payload backend senza `operation`

- Sezione/riga spec: sezione 7, righe 610-630.
- Cosa dice la spec: `ChatIaBackendRequest` contiene `prompt`, `localTurn`, `attachments`, `memoryHints`.
- Codice reale: `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:261-266` richiede `operation: "run_controlled_chat"` dentro `InternalAiServerOrchestratorChatRequestBody`; `src/next/internal-ai/internalAiServerChatClient.ts:72-74` omette solo `requestId` e `actorId`, non `operation`.
- Severita: CRITICA.
- Motivo: un bridge implementato seguendo la shape della spec non soddisfa il contratto TypeScript del client esistente.

#### DVG-002 - `memoryHints` backend con shape sbagliata

- Sezione/riga spec: sezione 7, righe 625-629.
- Cosa dice la spec: `memoryHints` contiene `sessionOnly`, `sector`, `entities`.
- Codice reale: `src/next/internal-ai/internalAiTypes.ts:704-711` definisce `InternalAiChatMemoryHints` con `repoUiRequested`, `memoryFreshness`, `screenHint`, `focusKind`, `attachmentsCount`, `runtimeObserverObserved`.
- Severita: CRITICA.
- Motivo: la shape proposta non e compatibile con il backend/client esistente e verrebbe normalizzata come default o respinta dal tipo.

#### DVG-003 - `createPdfPreviewUrl` non esiste

- Sezione/riga spec: sezione 9, riga 770.
- Cosa dice la spec: `createPdfPreviewUrl` e riutilizzabile in `src/utils/pdfPreview.ts:47-69`.
- Codice reale: `src/utils/pdfPreview.ts:46-70` esporta `openPreview`; `rg` su `src/utils/pdfPreview.ts` non trova `createPdfPreviewUrl`. `sharePdfFile` esiste a `src/utils/pdfPreview.ts:73`.
- Severita: CRITICA.
- Motivo: l'import con il nome indicato dalla spec fallirebbe.

#### DVG-004 - `ChatIaRunnerResult` non contiene `sources`

- Sezione/riga spec: sezione 6, righe 541-545; tipo richiesto in sezione 3, righe 335-347.
- Cosa dice la spec: un runner che legge dati di un altro settore deve dichiararlo nel risultato `sources`.
- Codice/spec reale verificata: la nuova ossatura non esiste ancora nel repo; nella definizione richiesta dalla stessa spec `ChatIaRunnerResult` contiene `status`, `sector`, `text`, `outputKind`, `entities`, `card`, `table`, `report`, `fallback`, `backendContext`, `error`, ma non `sources`.
- Severita: CRITICA.
- Motivo: il contratto non permette di rispettare una regola vincolante dichiarata dalla stessa spec.

### MEDIE

#### DVG-005 - Due riferimenti delle quattro surface chat puntano al renderer, non al container

- Sezione/riga spec: sezione 2, riga 161.
- Cosa dice la spec: le quattro surface chat sono a `src/next/NextInternalAiPage.tsx:9697`, `9974-10005`, `10315-10358`, `10875`.
- Codice reale: i container/punti surface reali sono `src/next/NextInternalAiPage.tsx:9655`, `9974`, `10315`, `10815`; le righe `9697` e `10875` sono chiamate a `renderChatMessageText(message.text)`.
- Severita: MEDIA.
- Motivo: il numero "quattro" e corretto, ma due `path:riga` non identificano la surface come dichiarato.

#### DVG-006 - Chiamata `fallbackContext` incoerente con la firma

- Sezione/riga spec: sezione 5, righe 477-478; sezione 6, righe 519-522.
- Cosa dice la spec: algoritmo: `runner.fallbackContext(prompt, decision)`.
- Codice/spec reale verificata: l'interfaccia richiesta e `fallbackContext(args: { prompt: string; decision: ChatIaRouterDecision }): ChatIaFallbackResponse`; l'esempio a riga 568 usa correttamente oggetto argomento.
- Severita: MEDIA.
- Motivo: la chiamata testuale e sbagliata rispetto al contratto dichiarato.

#### DVG-007 - Range artifact repository non prova `server_file_isolated`

- Sezione/riga spec: sezione 8, riga 674.
- Cosa dice la spec: artifact repository server-file isolated esiste in `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:50-56`.
- Codice reale: `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:50-56` contiene `InternalAiServerArtifactRepositoryState`; il literal `server_file_isolated` e definito a `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:16` e compare nelle response dell'endpoint, ad esempio `backend/internal-ai/server/internal-ai-adapter.js:2261`.
- Severita: MEDIA.
- Motivo: il range citato e incompleto per la parte "server-file isolated".

#### DVG-008 - I source descriptor sono 44, non 45

- Sezione/riga spec: sezione 11, riga 860.
- Cosa dice la spec: `45 source descriptor` in `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:555-600`.
- Codice reale: nel range `555-600` ci sono 44 righe con `sourceId:` dentro `UNIFIED_SOURCE_DESCRIPTORS`.
- Severita: MEDIA.
- Motivo: claim numerico errato su tassonomia esistente.

#### DVG-009 - `archiveEntry` singolare non esiste nel contratto definito

- Sezione/riga spec: sezione 7, righe 660-661.
- Cosa dice la spec: il backend non puo cambiare `sector`, `card`, `table`, `report`, `archiveEntry`.
- Codice/spec reale verificata: `ChatIaRunnerResult` non contiene `archiveEntry`; `ChatIaMessage` contiene `archiveEntries: ChatIaArchiveEntry[]` a righe 293-306 della spec.
- Severita: MEDIA.
- Motivo: nome/shape incoerente per un campo dichiarato immutabile lato backend.

#### DVG-010 - Stato autorizzazione deroga barriera incoerente tra sezioni

- Sezione/riga spec: sezione 8, righe 756-757; sezione 12, righe 883-885; sezione 15, righe 956-965.
- Cosa dice la spec: sezione 8 dice che prima della patch completa "serve approvare" una deroga; sezione 12 dice "Se Giuseppe non autorizza"; sezione 15 D2 dice invece che la deroga stretta e gia autorizzata.
- Codice reale: `src/utils/cloneWriteBarrier.ts` non contiene oggi `chat_ia_reports` o `/next/chat`, quindi la deroga non e applicata.
- Severita: MEDIA.
- Motivo: la spec deve distinguere autorizzazione gia concessa da implementazione non ancora applicata.

### MINORI

#### DVG-011 - Range fallback jsPDF omette parte del return

- Sezione/riga spec: sezione 9, riga 768.
- Cosa dice la spec: il fallback jsPDF diretto costruisce un PDF e ritorna `blob` + `fileName` in `src/next/internal-ai/internalAiReportPdf.ts:271-394`.
- Codice reale: il return e a `src/next/internal-ai/internalAiReportPdf.ts:392-396` e contiene `blob`, `fileName` e anche `text`; la chiusura funzione e a riga 397.
- Severita: MINORE.
- Motivo: il claim non e falso sui campi `blob` e `fileName`, ma e incompleto e il range non copre tutto il return.

## 4. VERIFICHE MIRATE OBBLIGATORIE

### 3.1 Path "da riusare" sezione 11

Esito: OK con divergenze gia censite su contenuto/range.

Tutti i file citati nella sezione 11 esistono:

- `src/App.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/internal-ai/internalAiServerChatClient.ts`
- `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/utils/pdfPreview.ts`
- reader D01-D10
- `src/utils/firestoreWriteOps.ts`
- `src/utils/storageWriteOps.ts`
- `src/firebase.ts`
- `src/utils/storageSync.ts`
- `src/next/internal-ai/InternalAiMezzoCard.tsx`
- `src/next/internal-ai/internalAiMezzoCard.css`

### 3.2 Path "da non toccare" sezione 12

Esito: OK.

Path espliciti esistenti:

- `src/pages/**`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- Reader D01-D10 della sezione 11

Voci generiche non path-specific: writer business, moduli madre Mezzo 360/Autista 360/Centro Controllo, sottosistema Archivista. Archivista non analizzato.

### 3.3 Reader D01-D10

Esito: OK.

- D01: `readNextAnagraficheFlottaSnapshot` reale a `src/next/nextAnagraficheFlottaDomain.ts:763`.
- D02: `readNextMezzoOperativitaTecnicaSnapshot` reale a `src/next/nextOperativitaTecnicaDomain.ts:223`.
- D03: `readNextAutistiReadOnlySnapshot` reale a `src/next/domain/nextAutistiDomain.ts:1176`.
- D04: `readNextRifornimentiReadOnlySnapshot` reale a `src/next/domain/nextRifornimentiDomain.ts:1291`; `readNextMezzoRifornimentiSnapshot` reale a riga 1304.
- D05: `readNextInventarioSnapshot` reale a `src/next/domain/nextInventarioDomain.ts:235`; `readNextMaterialiMovimentiSnapshot` reale a `src/next/domain/nextMaterialiMovimentiDomain.ts:1125`; `readNextMagazzinoRealeSnapshot` reale a riga 1630.
- D06: `readNextProcurementSnapshot` reale a `src/next/domain/nextProcurementDomain.ts:906`.
- D07/D08: `readNextIADocumentiArchiveSnapshot` reale a `src/next/domain/nextDocumentiCostiDomain.ts:1925`; `readNextDocumentiCostiFleetSnapshot` reale a riga 2146.
- D09: `readNextCisternaSchedaDetail` reale a `src/next/domain/nextCisternaDomain.ts:842`; `readNextCisternaSnapshot` reale a riga 1240.
- D10: `readNextCentroControlloSnapshot` reale a `src/next/domain/nextCentroControlloDomain.ts:1627`.

### 3.4 Backend OpenAI sezione 7

Esito: DIVERGENZA su payload shape, OK sui path:riga backend.

- Porta `4310`: OK a `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:36`.
- Route `orchestratorChat`: OK a `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:39-48`.
- Client `runInternalAiServerControlledChat`: OK a `src/next/internal-ai/internalAiServerChatClient.ts:72-124`.
- Adapter Express: OK a `backend/internal-ai/server/internal-ai-adapter.js:54`.
- `buildControlledChatUserPayload`: OK a `backend/internal-ai/server/internal-ai-adapter.js:626-648`.
- System prompt server: OK a `backend/internal-ai/server/internal-ai-adapter.js:741-750`.
- Shape richiesta dalla spec: DIVERGENZA, vedi DVG-001 e DVG-002.

### 3.5 Motore PDF sezione 9

Esito: DIVERGENZA su `createPdfPreviewUrl`, nota minore su return fallback.

- `generateInternalAiReportPdfBlob`: OK a `src/next/internal-ai/internalAiReportPdf.ts:219`.
- Fallback jsPDF: OK come esistenza, ma return incompleto nella spec. Vedi DVG-011.
- `buildInternalAiReportPdfFileName`: OK a `src/next/internal-ai/internalAiReportPdf.ts:118`.
- `createPdfPreviewUrl`: DIVERGENZA, non esiste. Vedi DVG-003.
- `sharePdfFile`: OK a `src/utils/pdfPreview.ts:73`.

### 3.6 `firestoreWriteOps`, `storageWriteOps`, `cloneWriteBarrier`

Esito: OK.

- `src/utils/firestoreWriteOps.ts:15-39` chiama `assertCloneWriteAllowed`.
- `src/utils/storageWriteOps.ts:20-53` chiama `assertCloneWriteAllowed`.
- `src/utils/cloneWriteBarrier.ts:547-549` e il punto di controllo.
- `rg` su `src/utils/cloneWriteBarrier.ts` non trova `chat_ia_reports` o `/next/chat`.

### 3.7 Quattro surface chat sezione 2

Esito: DIVERGENZA di precisione riga, numero OK.

Il codice contiene quattro punti/surface chat:

- `src/next/NextInternalAiPage.tsx:9655` container `internal-ai-home-modal__messages`.
- `src/next/NextInternalAiPage.tsx:9974` container `internal-ai-dispatcher__messages`.
- `src/next/NextInternalAiPage.tsx:10315` container `data-primary-chat`.
- `src/next/NextInternalAiPage.tsx:10815` container `internal-ai-chat__messages`.

La spec cita `9697` e `10875`, che sono renderer del testo. Vedi DVG-005.

### 3.8 Costanti citate

Esito: OK con non applicabile per gli esempi del prompt.

- `NEXT_IA_PATH = "/next/ia"` reale a `src/next/nextStructuralPaths.ts:27`.
- `NEXT_INTERNAL_AI_PATH = "/next/ia/interna"` reale a `src/next/nextStructuralPaths.ts:28`.
- `NEXT_CHAT_IA_PATH = "/next/chat"` e dichiarata futura, non esiste oggi.
- `SCOPE_PATTERNS` reale a `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:483`.
- `SCOPE_SOURCE_MAP` reale a `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:517`.
- `PRIORITY_HIGH_THRESHOLD` e `PREVIEW_LIMIT` non sono citate nel file spec verificato.

### 3.9 Le 17 scope del motore unificato

Esito: OK.

Conteggio reale in `SCOPE_PATTERNS`: 17 scope.

### 3.10 I 45 source descriptor

Esito: DIVERGENZA.

Conteggio reale in `UNIFIED_SOURCE_DESCRIPTORS`: 44 source descriptor. Vedi DVG-008.

## 5. VERIFICHE COERENZA INTERNA

### 4.1 Tipi dichiarati nella sezione 3 usati coerentemente

Esito: DIVERGENZA.

- `ChatIaMessage`, `ChatIaReport`, `ChatIaArchiveEntry`, `ChatIaRouterDecision`, `ChatIaRunnerContext` sono usati in modo coerente nelle sezioni 4, 5, 8 e 9.
- `ChatIaRunnerResult` non e coerente con la regola `sources` della sezione 6. Vedi DVG-004.
- `fallbackContext` non e coerente tra algoritmo e firma. Vedi DVG-006.
- `archiveEntry` singolare non e coerente con i tipi dichiarati. Vedi DVG-009.

### 4.2 File dichiarati nella sezione 1 coerenti con le sezioni successive

Esito: OK.

I file futuri citati nelle sezioni successive sono presenti nell'albero previsto della sezione 1:

- `ChatIaPage.tsx`
- `chatIa.css`
- `components/ChatIaShell.tsx`
- `components/ChatIaMessageList.tsx`
- `components/ChatIaMessageItem.tsx`
- `components/ChatIaComposerInput.tsx`
- `components/ChatIaReportModal.tsx`
- `components/ChatIaArchivePanel.tsx`
- `components/ChatIaLoadingIndicator.tsx`
- `core/chatIaTypes.ts`
- `core/chatIaRouter.ts`
- `core/chatIaSectorRegistry.ts`
- `core/chatIaSessionStore.ts`
- `core/chatIaText.ts`
- `backend/chatIaBackendBridge.ts`
- `reports/chatIaReportArchive.ts`
- `reports/chatIaReportPdf.ts`
- `sectors/sectorTypes.ts`
- `sectors/sectorFallbacks.ts`

Nessun file futuro usato nelle sezioni successive risulta fantasma rispetto alla sezione 1.

### 4.3 Decisioni D1-D5 coerenti con sezioni 8 e 12

Esito: DIVERGENZA.

- D1 e coerente con sezione 8: `chat_ia_reports`, prefix Storage, `pdfStoragePath`, `pdfUrl`.
- D2 non e coerente nel testo: sezione 15 dice deroga autorizzata, mentre sezioni 8 e 12 parlano ancora di autorizzazione da ottenere o possibile mancata autorizzazione. Codice reale conferma che la deroga non e ancora applicata.
- D3 e coerente con sezione 8: soft delete `status = "deleted"` e `deletedAt`.
- D4 e coerente con sezioni 4 e 8: accesso archivio solo via prompt libero.
- D5 e coerente con Definition of Done: report dummy come validazione ossatura.

## 6. RIEPILOGO RACCOMANDAZIONI

Verdetto: DA CORREGGERE.

Correzioni necessarie prima di procedere con l'implementazione:

1. Correggere la shape del payload backend: aggiungere `operation: "run_controlled_chat"` e riallineare `memoryHints` a `InternalAiChatMemoryHints`.
2. Sostituire `createPdfPreviewUrl` con il nome reale `openPreview`, oppure aggiungere esplicitamente un adapter futuro con quel nome.
3. Aggiungere `sources` a `ChatIaRunnerResult` oppure rimuovere/modificare la regola che obbliga i runner a dichiarare cross-sector data nel risultato.
4. Correggere il conteggio `45 source descriptor` in `44 source descriptor`, oppure aggiornare il motore se davvero manca un descriptor.
5. Allineare i riferimenti alle quattro surface chat ai container reali: `9655`, `9974`, `10315`, `10815`.
6. Correggere la chiamata testuale `fallbackContext(prompt, decision)` in `fallbackContext({ prompt, decision })`.
7. Aggiornare il testo sulla deroga barriera: autorizzazione gia concessa, implementazione non ancora applicata.
8. Correggere `archiveEntry` in un nome coerente con il contratto scelto.
9. Sistemare il range artifact repository o citare anche `InternalAiServerPersistenceMode` e l'endpoint adapter.
10. Annotare che il fallback PDF esistente ritorna anche `text`.

## 7. APPENDICE: FILE LETTI PER LA VERIFICA

File di contesto operativo:

- `docs/_live/STATO_ATTUALE_PROGETTO.md`

Spec e documenti citati:

- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`
- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`

Codice e risorse aperti:

- `src/App.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
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
