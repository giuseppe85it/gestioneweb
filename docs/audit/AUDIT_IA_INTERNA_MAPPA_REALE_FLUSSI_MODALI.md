# AUDIT IA INTERNA - MAPPA REALE FLUSSI, MODALI E DIVERGENZE

Data audit: 2026-04-14  
Modalita: audit reale del repo, nessuna patch runtime

Perimetro letto davvero:
- `src/next/NextInternalAiPage.tsx`
- `src/pages/IA/IADocumenti.tsx`
- `src/next/internal-ai/internalAiChatAttachmentsClient.ts`
- `src/next/internal-ai/internalAiDocumentAnalysis.ts`
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`
- `src/next/strumenti/pendingMergeStore.ts`
- `src/next/NextStrumentiUnisciDocumentiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `src/App.tsx`
- ricerca mirata su `src/next/NextIADocumentiPage.tsx` per `reviewDocumentId` / `reviewSourceKey`

## A. PANORAMICA

Scopo reale di `/next/ia/interna`:
- La route reale monta `NextInternalAiPage` su `/next/ia/interna` e sulle varianti tecniche `sessioni`, `richieste`, `artifacts`, `audit` (`src/App.tsx:479-517`).
- La pagina non usa un motore documentale NEXT autonomo: riusa il motore shared `useIADocumentiEngine()` dal legacy `src/pages/IA/IADocumenti.tsx` per il caso documento singolo (`src/next/NextInternalAiPage.tsx:4247`, `src/pages/IA/IADocumenti.tsx:183-454`).
- Sopra quel motore shared la pagina aggiunge un secondo layer NEXT con chat, allegati IA-only, orchestratore universale, history modal, review modal full screen e handoff verso Magazzino / Procurement / Libretto / inbox documentale (`src/next/NextInternalAiPage.tsx:4300-4469`, `6860-6939`, `13838-14447`).

Componenti principali coinvolti:
- Motore singolo file: `useIADocumentiEngine()` (`src/pages/IA/IADocumenti.tsx:183-454`).
- Dispatcher / shell documentale e chat: `NextInternalAiPage` (`src/next/NextInternalAiPage.tsx:4238-14452`).
- Upload allegati IA-only e fallback locale/server isolato: `internalAiChatAttachmentsClient.ts` (`src/next/internal-ai/internalAiChatAttachmentsClient.ts:32-64`, `210-352`).
- Aggregazione multi-file: `buildInternalAiLogicalDocumentAggregate()` (`src/next/internal-ai/internalAiDocumentAnalysis.ts:267-397`).
- Routing documentale multi-file/chat: `routeInternalAiUniversalDocuments()` (`src/next/internal-ai/internalAiUniversalDocumentRouter.ts:94-240`, `292-325`).
- Handoff e prefill target: `buildDocumentHandoffPayload()` (`src/next/internal-ai/internalAiUniversalHandoff.ts:443-727`).
- Orchestrazione finale: `orchestrateInternalAiUniversalRequest()` (`src/next/internal-ai/internalAiUniversalOrchestrator.ts:82-180`).
- Pending merge route -> IA interna: `NextStrumentiUnisciDocumentiPage` + `pendingMergeStore` (`src/next/NextStrumentiUnisciDocumentiPage.tsx:1-28`, `src/next/strumenti/pendingMergeStore.ts:1-9`).

## B. ENTRATE REALI DELLA PAGINA

### 1. Card alta dispatcher `Tipo atteso / Documento / Analizza`

Superficie:
- Testi visibili: `Tipo atteso`, `Documento`, `Analizza`, `Motore in uso: Documenti IA` (`src/next/NextInternalAiPage.tsx:9527-9595`).
- Variante duplicata nello shell documentale classico con gli stessi controlli (`src/next/NextInternalAiPage.tsx:9787-9867`).

Handler reali:
- Upload: `handleUnifiedDocumentFileChange` (`src/next/NextInternalAiPage.tsx:8361-8388`).
- Analisi: `handleUnifiedDocumentAnalyze` (`src/next/NextInternalAiPage.tsx:8390-8429`).

Stati usati davvero:
- `documentExpectedType` (`src/next/NextInternalAiPage.tsx:4453-4454`).
- `documentEntryPendingFiles` (`4343`).
- `documentEntryTreatFilesAsSingleDocument` (`4344-4345`).
- `documentEntryUsesMultiFileFlow` (`4346`).
- `documentSelectedFile`, `documentResults`, `documentErrorMessage` dal motore shared (`4431-4450`).

Output atteso:
- Con `1 file`: entra nel motore shared `handleDocumentAnalyze()` e produce `documentResults` separati per singolo documento (`8390-8429`, ramo `8427-8429`; `src/pages/IA/IADocumenti.tsx:416-454`).
- Con `2+ file`: non entra nel motore shared; carica gli allegati nella chat IA-only e lascia che l'orchestrazione automatica costruisca la proposal/review (`8394-8424`, `6860-6939`).

### 2. Composer chat + allegati

Superficie:
- CTA `+`, textarea, invio `->`, lista allegati con `Apri` / `Rimuovi`, toggle `Tratta questi file come un unico documento` quando gli allegati sono almeno 2 (`src/next/NextInternalAiPage.tsx:9694-9753`, `7371-7426`).

Handler reali:
- Apertura picker: `handleChatAttachmentPicker` (`6563-6564`).
- Upload allegati: `handleChatAttachmentSelection` (`6566-6644`).
- Rimozione allegati: `handleRemoveChatAttachment` (`6679-6741`).
- Submit: `handleChatSubmit` (`7583-7898`).

Stati usati davvero:
- `chatInput`, `chatAttachments`, `treatAttachmentsAsSingleDocument`, `chatStatus`, `chatDocumentProposalState`, `chatAttachmentRepositoryState` (`4300-4327`, `4422-4429`).

Output atteso:
- Se ci sono allegati, una `proposal` automatica viene preparata via orchestratore universale senza bisogno di submit esplicito della chat (`6860-6939`).
- Il submit della chat usa il bridge backend controllato `runInternalAiChatTurnThroughBackend()` e puo aprire report preview PDF, non il review engine shared (`7616-7780`, `14309-14438`).

### 3. Pending merge / merge store

Superficie:
- Non e una UI dentro la pagina; e un ingresso indiretto dalla route strumenti merge.

Catena reale:
- `NextStrumentiUnisciDocumentiPage` riceve `onPdfReady`, salva `File` in `setPendingMergeFile(file)` e naviga a `/next/ia/interna` (`src/next/NextStrumentiUnisciDocumentiPage.tsx:11-19`).
- `pendingMergeStore` conserva in memoria un solo `File` (`src/next/strumenti/pendingMergeStore.ts:1-9`).
- `NextInternalAiPage` lo consuma al mount e lo inoltra a `handleChatAttachmentSelectionRef.current?.([pending])` (`src/next/NextInternalAiPage.tsx:4541-4545`).

Output atteso:
- Il file mergiato non entra nella card alta documento; entra nel ramo chat/allegati.

### 4. Deep-link review da query param

Superficie:
- Ingresso non visibile: `reviewDocumentId` e `reviewSourceKey` nella URL.

Catena reale:
- La pagina legge i query param con `URLSearchParams(location.search)` (`src/next/NextInternalAiPage.tsx:4471-4482`).
- Quando trova il documento, apre review storica, imposta tab `verify` o `saved`, aggiorna destinazione e poi rimuove i parametri dalla URL (`8305-8341`).
- La query viene creata da `NextIADocumentiPage` con `params.set("reviewDocumentId", item.sourceDocId)` e `params.set("reviewSourceKey", item.sourceKey)` (`src/next/NextIADocumentiPage.tsx:173-174`, ricerca mirata).

Output atteso:
- Riapertura review storica del motore documentale shared, non del ramo chat/orchestrator.

### 5. Launcher navigation state

Superficie:
- Ingresso non URL ma `location.state`: `initialPrompt`, `triggerUpload`.

Catena reale:
- `launcherNavigationState` viene letto da `location.state` (`src/next/NextInternalAiPage.tsx:4470`).
- Se `initialPrompt` esiste, popola `chatInput`; se `triggerUpload` e `fattura` / `preventivo` / `manutenzione`, imposta `documentExpectedType` e apre il file picker documento (`4484-4521`).
- Dopo la gestione, la pagina azzera `state` con `navigate(..., { replace: true, state: null })` (`4523-4533`).

Output atteso:
- Precompilazione chat oppure apertura picker della card alta.

## C. FLUSSO SINGOLO

Percorso reale con `1 file`:
1. La card alta salva il file nel motore shared tramite `handleDocumentFileSelection(event)` (`src/next/NextInternalAiPage.tsx:8384-8387`; `src/pages/IA/IADocumenti.tsx:323-342`).
2. `handleUnifiedDocumentAnalyze()` prende il ramo singolo e chiama `handleDocumentAnalyze()` (`src/next/NextInternalAiPage.tsx:8427-8429`).
3. `handleAnalyze()` del motore shared converte il file in base64 (`src/pages/IA/IADocumenti.tsx:347-369`), chiama la Cloud Function `estrazioneDocumenti` (`374-411`) e salva il risultato in `results` con `categoriaArchivio` (`433-443`).
4. La shell NEXT costruisce la destinazione suggerita da `documentExpectedType`, `documentResults` e `documentResolvedTarga` con `buildUnifiedDocumentDestinationSummary()` (`src/next/NextInternalAiPage.tsx:356-462`, `8236-8256`).
5. La review visualizzata e `renderUnifiedReviewColumns()` con campi separati editabili `Fornitore`, `Tipo doc`, `Numero`, `Data`, `Targa`, righe materiali, destinazione di salvataggio e bottone `Salva` / `Salva e importa` (`8622-8724` e blocco successivo).

Engine usato:
- Solo `useIADocumentiEngine()` (`src/next/NextInternalAiPage.tsx:4247`, `4431-4450`).

Modello finale mostrato:
- `DocumentoAnalizzato` singolo, non aggregato (`src/pages/IA/IADocumenti.tsx:39-77`).

Modello corretto del caso singolo buono:
- Un file -> una chiamata a `estrazioneDocumenti` -> un `DocumentoAnalizzato` -> review con campi separati e destinazione calcolata dopo l'estrazione (`src/pages/IA/IADocumenti.tsx:416-454`; `src/next/NextInternalAiPage.tsx:8236-8256`, `8622-8724`).

## D. FLUSSO MULTI-FILE

Percorso reale con `2+ file` dalla card alta:
1. `handleUnifiedDocumentFileChange()` non passa i file al motore shared; li mette in `documentEntryPendingFiles` e fa `return` (`src/next/NextInternalAiPage.tsx:8374-8381`).
2. `handleUnifiedDocumentAnalyze()` rileva `documentEntryPendingFiles.length > 1` e non chiama `handleDocumentAnalyze()` (`8394-8424`).
3. Invece carica gli allegati nel repository chat con `handleChatAttachmentSelection(documentEntryPendingFiles, { replaceExisting: true })` (`8407-8410`).
4. Quando `chatAttachments` cambia, parte l'effetto automatico che invoca `orchestrateInternalAiUniversalRequest({ prompt, attachments, preferredTarga, treatAttachmentsAsSingleDocument })` (`6860-6890`).
5. L'orchestratore chiama router e handoff (`src/next/internal-ai/internalAiUniversalOrchestrator.ts:82-125`).
6. Se il toggle e attivo, il router costruisce una classificazione unica con `buildLogicalDocumentClassificationAttachment()` e `buildInternalAiLogicalDocumentAggregate()` (`src/next/internal-ai/internalAiUniversalDocumentRouter.ts:73-92`, `292-325`; `src/next/internal-ai/internalAiDocumentAnalysis.ts:267-397`).
7. La review finale visibile non e la review singola del motore shared: e la `documentReviewModalState` della proposal chat/orchestrator, con header `Documento logico unificato` quando `logicalDocumentGroupingEnabled && documentReviewRoutes.length > 1` (`src/next/NextInternalAiPage.tsx:5456-5468`, `7238-7339`, `13852-13884`).

Stato che cambia davvero:
- `documentEntryPendingFiles`, `documentEntryTreatFilesAsSingleDocument`, `documentEntryUsesMultiFileFlow` (`4343-4347`, `8374-8381`, `8420`).
- `chatAttachments`, `treatAttachmentsAsSingleDocument`, `chatDocumentProposalState` (`4314-4315`, `4422-4426`, `6860-6939`).

Modello finale mostrato:
- Non piu `DocumentoAnalizzato` singolo.
- Diventa `InternalAiLogicalDocumentAggregate`: `attachmentIds`, `attachmentCount`, `fileNames`, `textExcerpt`, `documentAnalysis`, `conflictFields` (`src/next/internal-ai/internalAiDocumentAnalysis.ts:258-265`, `389-396`).

## E. MODALI / VIEW / REVIEW STATE

| Nome | Tipo | Quando si apre | Chi lo apre | Dominio reale |
|---|---|---|---|---|
| `renderUnifiedReviewColumns()` | review view in-page | quando esiste `documentResults` o `openedHistoryDocument` | card alta singolo file o storico | manutenzione / magazzino / preventivo / generico, ma sempre nel motore shared (`src/next/NextInternalAiPage.tsx:8505-8512`, `8622-8724`) |
| `documentReviewModalState` | modale full screen review | quando l'utente apre la proposal del router chat | `openDocumentReviewModal(routeKey)` (`5456-5460`, `7560-7566`) | soprattutto magazzino / preventivi / inbox documentale / cisterna / libretto secondo `route.classification` (`13838-14447`) |
| `documentHistoryOpen` | modale storico documenti | click `Apri storico` | bottoni `setDocumentHistoryOpen(true)` (`9776-9781`) | storico motore shared (`13789-13837`) |
| `reportPreviewModalState` | modale PDF report IA | apertura di report artifact / chat report | render condizionale (`14309-14438`) | report targa / autista / combinato |
| `documentWorkspaceTab` | view state `inbox/verify/saved/chat` | sempre in overview/page | click tab o effetti automatici (`4451-4452`, `9875-9917`) | motore shared + chat |
| `openedHistoryDocumentId` | review state storico | deep-link o click `Riapri review` | effect query / `handleOpenUnifiedHistoryReview()` (`8305-8341`, `8474-8479`) | manutenzione / magazzino / generico secondo archivio |
| `requestedHistoryReviewQuery` | deep-link state | URL con `reviewDocumentId` | query param (`4471-4482`) | review documento shared |
| `isMergeToolOpen` | mount tool merge | quando lo stato locale viene attivato | render condizionale `UnisciDocumentiTool` (`14439-14446`) | generico; reimmette un PDF nel ramo chat |

## F. ROUTING / HANDOFF

### Come viene deciso manutenzione vs magazzino vs altro

Caso singolo file:
- La decisione finale non avviene nel router universale.
- Avviene in `buildUnifiedDocumentDestinationSummary()` usando `documentExpectedType`, `documentResults` e `documentResolvedTarga` (`src/next/NextInternalAiPage.tsx:356-462`, `8236-8256`).
- Regole chiave:
  - `PREVENTIVO` o tipo estratto `PREVENTIVO` -> `mezzo_preventivi` se c'e targa, altrimenti `review` (`365-391`).
  - `MANUTENZIONE` o fattura con targa -> `mezzo_manutenzioni` (`394-420`).
  - `MAGAZZINO` o fattura senza targa ma con righe -> `magazzino_inventario` (`423-438`).
  - `GENERICO` -> `archivio_generico` (`440-450`).

Caso multi-file / chat:
- La decisione passa al router universale.
- I segnali che pesano davvero sono `attachment.kind`, `attachment.documentAnalysis`, righe estratte, `textExcerpt`, nome file e prompt (`src/next/internal-ai/internalAiUniversalDocumentRouter.ts:94-132`).
- Se ci sono segnali materiali + segnali fattura/DDT, il router classifica `tabella_materiali` e manda a `Magazzino` (`152-193`).
- L'handoff traduce `tabella_materiali` in `routeTarget = /next/magazzino?tab=documenti-costi` o `/next/magazzino?tab=inventario`, con `warehouseInvoiceMode = riconcilia_o_verifica` oppure `carica_stock_adblue` (`src/next/internal-ai/internalAiUniversalHandoff.ts:577-630`).

### Quali detector pesano davvero

Nel router multi-file/chat pesano davvero:
- `hasExtractedRows` / righe materiali (`src/next/internal-ai/internalAiUniversalDocumentRouter.ts:115-129`).
- parole chiave inventario/materiali/adblue/magazzino/ricambi (`35-39`).
- parole chiave fattura/ddt/bolla/imponibile/iva (`40-45`).
- segnali preventivo/offerta/fornitore (`195-228`).
- segnali libretto / cisterna / targa (`134-150`, `231-249`, `130-132`).

### Dove entra `tipo atteso`

Entra solo nella shell singolo-file:
- stato `documentExpectedType` (`src/next/NextInternalAiPage.tsx:4453-4454`);
- mapping verso `CategoriaArchivio` (`318-323`, `8215-8218`, `8370`, `8392`);
- suggerimento destinazione post-estrazione (`356-462`, `8236-8256`).

### Dove `tipo atteso` viene ignorato o sovrascritto

Ignorato nel multi-file:
- `handleUnifiedDocumentAnalyze()` ramo multi-file non passa `documentExpectedType` all'orchestratore (`src/next/NextInternalAiPage.tsx:8394-8424`).
- `orchestrateInternalAiUniversalRequest()` riceve solo `prompt`, `attachments`, `preferredTarga`, `treatAttachmentsAsSingleDocument` (`src/next/internal-ai/internalAiUniversalOrchestrator.ts:82-98`).
- Il router universale non accetta `expectedType` in input (`src/next/internal-ai/internalAiUniversalDocumentRouter.ts:292-325`).

Sovrascritto di fatto:
- Nel singolo file, anche con `Tipo atteso = MANUTENZIONE`, se l'estrazione produce `MAGAZZINO` o righe materiali senza targa, la destinazione puo finire su `magazzino_inventario` (`src/next/NextInternalAiPage.tsx:423-438`).
- Nel multi-file, i segnali materiali/fattura vincono sul `Tipo atteso` perche quel valore non arriva proprio al router.

## G. CSS E SUPERFICI UI

File CSS che governano davvero `/next/ia/interna`:
- `src/next/internal-ai/internal-ai.css`
- `src/next/next-shell.css` e importato dalla pagina ma in questo audit non emerge come foglio specifico delle superfici IA documentali.
- `src/pages/IA/IADocumenti.css` appartiene al componente legacy `IADocumenti`, non alla route `/next/ia/interna` che usa solo il hook (`src/pages/IA/IADocumenti.tsx:5`, `844-878`).

Classi principali:
- Card alta / dispatcher documento:
  - `.internal-ai-dispatcher__document-entry` (`src/next/internal-ai/internal-ai.css:2990`)
  - `.internal-ai-unified-documents__upload` (`503`)
  - `.internal-ai-search__button` / `--secondary` (`2288`, `1400`)
- Composer chat / allegati:
  - `.internal-ai-chat__composer` (`866`)
  - `.internal-ai-chat__composer-input` (`883`)
  - `.internal-ai-chat__attachments` (`898`)
  - `.internal-ai-chat__attachment-row` (`904`)
- Proposal / result card:
  - `.internal-ai-chat__document-proposal-shell` (`965`)
  - `.internal-ai-chat__dispatcher-banner` (`3115-3143`)
- Review in-page singolo file:
  - `.internal-ai-unified-documents__review-shell` (`3149`)
- Modale review orchestrator:
  - `.internal-ai-review-modal*` (`1457-1944`)
- Modale PDF report:
  - `.internal-ai-document-modal*` (`1956-2034`)
- History modal:
  - `.internal-ai-unified-documents__history-modal` (`832`)
- Badge / CTA tipo `Apri in Magazzino`:
  - nessuna classe dedicata al testo;
  - usa i bottoni condivisi `.internal-ai-search__button` / `--secondary` e i pill `.internal-ai-pill*` (`2288-2444`).

## H. CODICE MORTO / DUPLICAZIONI / RAMI SOSPETTI

### Duplicazioni dimostrabili

1. Due stati separati per lo stesso concetto di grouping multi-file
- `treatAttachmentsAsSingleDocument` nel ramo chat (`src/next/NextInternalAiPage.tsx:4315`, `4805-4815`).
- `documentEntryTreatFilesAsSingleDocument` nella card alta (`4344-4345`, `4817-4827`).
- I due stati si sincronizzano solo nel momento del click `Analizza` multi-file (`8398-8400`).

2. Due collezioni file diverse
- `documentEntryPendingFiles` per la card alta (`4343`, `8374-8381`).
- `chatAttachments` per il ramo chat/orchestrator (`4314`, `6566-6644`).
- Il passaggio da una all'altra avviene solo nel ramo multi-file di `handleUnifiedDocumentAnalyze()` (`8407-8420`).

3. Due review surface distinte
- Review in-page del motore shared: `renderUnifiedReviewColumns()` (`8622-8724`).
- Review modal full screen del router/orchestrator: `documentReviewModalState` (`5456-5468`, `13838-14447`).

### Codice morto certo nel route graph attuale

1. Prop `surfaceVariant="home-modal"` e ramo home-modal
- `NextInternalAiPage` dichiara `surfaceVariant?: "page" | "home-modal"` (`src/next/NextInternalAiPage.tsx:194-197`).
- Tutte le route reali in `App.tsx` montano `NextInternalAiPage` senza `surfaceVariant` (`src/App.tsx:479-517`).
- Ricerca repo: nessun call site passa `surfaceVariant=` a `NextInternalAiPage`.
- Conseguenza: il ramo `isHomeModalSurface` (`src/next/NextInternalAiPage.tsx:9229-9313`) e le duplicazioni home-modal collegate sono non agganciate nel route graph corrente.

2. Prop `initialChatInput`, `initialChatAttachments`, `autoSubmitInitialChat`
- Sono dichiarate nel componente (`src/next/NextInternalAiPage.tsx:194-197`) e usate da effetti locali (`4300`, `6647-6668`, `7904-7931`).
- Nessun call site in `src/App.tsx` o nel resto del repo passa questi prop.
- Stato: morto certo nel route graph attuale di `/next/ia/interna`; non morto certo a livello teorico del file, perche il supporto e ancora presente nel componente.

### Rami sospetti / `DA VERIFICARE`

1. Produzione reale di `attachment.documentAnalysis` negli allegati chat
- Il multi-file aggrega `attachment.documentAnalysis` (`src/next/internal-ai/internalAiDocumentAnalysis.ts:274-397`).
- `internalAiChatAttachmentsClient.ts` carica o legge allegati ma non calcola client-side quell'analisi (`src/next/internal-ai/internalAiChatAttachmentsClient.ts:210-352`).
- La sorgente server-side del campo esiste fuori dal perimetro letto qui.
- Stato: `DA VERIFICARE`.

2. Backing store reale di `tracking.sessionState`
- La pagina legge e scrive `tracking.sessionState` e `rememberInternalAiArtifactArchiveState(...)` (`src/next/NextInternalAiPage.tsx:4375-4393`, `5681-5699`).
- L'implementazione dello store e fuori dal perimetro letto in questo audit.
- Stato: `DA VERIFICARE`.

## I. PRIMO PUNTO DI DIVERGENZA REALE

Primo punto tecnico:
- `handleUnifiedDocumentFileChange()` con `selectedFiles.length > 1` non chiama `handleDocumentFileSelection`; salva i file in `documentEntryPendingFiles`, svuota la review shared e ritorna subito (`src/next/NextInternalAiPage.tsx:8374-8381`).

Primo punto di bypass del caso singolo buono:
- `handleUnifiedDocumentAnalyze()` nel ramo multi-file non chiama `handleDocumentAnalyze()` del motore shared; carica invece gli allegati nel ramo chat IA-only (`8394-8424`).

Primo punto in cui nasce il modello `Documento logico unificato`:
- Il router, quando `treatAttachmentsAsSingleDocument` e vero, costruisce `groupedClassificationAttachment` con `buildLogicalDocumentClassificationAttachment()` (`src/next/internal-ai/internalAiUniversalDocumentRouter.ts:73-92`, `292-325`).
- Quella funzione usa `buildInternalAiLogicalDocumentAggregate()`, che unifica righe, nulla i campi header in conflitto e aggiunge warning `Campi da verificare nel riepilogo unico` (`src/next/internal-ai/internalAiDocumentAnalysis.ts:298-397`).
- La review modal usa poi il titolo `Documento logico unificato` (`src/next/NextInternalAiPage.tsx:13855-13863`).

Primo punto in cui nasce la CTA `Apri in Magazzino`
- Il router classifica `tabella_materiali` quando vede segnali materiali + fattura/DDT (`src/next/internal-ai/internalAiUniversalDocumentRouter.ts:23-55`, `152-193`).
- L'handoff traduce quel caso in `vistaTarget = "documenti-costi"` e `warehouseInvoiceMode = "riconcilia_o_verifica"` (`src/next/internal-ai/internalAiUniversalHandoff.ts:577-630`).
- La UI converte quel prefill in:
  - action label `Riconcilia documento` (`src/next/NextInternalAiPage.tsx:2722-2741`);
  - pill status `Riconciliazione proposta` (`3192-3199`);
  - CTA finale `Apri in Magazzino` (`2797-2803`);
  - bottone renderizzato nel modale review (`14251-14261`).

## J. FILE DA TOCCARE IN UNA PATCH SUCCESSIVA

Solo elenco tecnico, nessuna patch ora:
- `src/next/NextInternalAiPage.tsx`
  - punto di divergenza tra singolo e multi-file; contiene stati duplicati, doppia review surface e ignora `documentExpectedType` nel ramo orchestrator.
- `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`
  - oggi il router multi-file decide senza ricevere `tipo atteso`; i segnali materiali/fattura possono spingere a Magazzino anche su casi manutentivi.
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
  - qui nasce il prefill `vistaTarget=documenti-costi` / `warehouseInvoiceMode`, da cui poi derivano `Riconciliazione proposta` e `Apri in Magazzino`.
- `src/next/internal-ai/internalAiDocumentAnalysis.ts`
  - qui nasce il modello aggregato `documento logico unico`; e il punto da correggere se si vuole evitare l'unificazione forzata dei campi.
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`
  - va toccato se il fix richiede propagare `tipo atteso` o cambiare la strategia di collapse/dedupe action intents.
- `src/next/internal-ai/internalAiChatAttachmentsClient.ts`
  - va toccato solo se il fix richiede cambiare la forma o il trasporto degli allegati che alimentano il ramo multi-file.
- `src/pages/IA/IADocumenti.tsx`
  - non e l'origine del bug multi-file, ma resta il modello corretto del caso singolo e il file da preservare/integrare se si vuole riallineare i due flussi senza rompere il comportamento buono.

## K. MATRICE INGRESSO -> USCITA

| Ingresso UI | File / linee | Handler | Stato modificato | Orchestratore / engine | Review / modale / view finale | CTA finale mostrata | Target finale effettivo |
|---|---|---|---|---|---|---|---|
| Card alta, 1 file | `src/next/NextInternalAiPage.tsx:9527-9595`, `8390-8429` | `handleUnifiedDocumentFileChange`, `handleUnifiedDocumentAnalyze` | `documentSelectedFile`, `documentResults`, `documentWorkspaceTab`, `documentUserDestination` | `useIADocumentiEngine().handleAnalyze()` (`src/pages/IA/IADocumenti.tsx:416-454`) | review in-page `renderUnifiedReviewColumns()` (`8622-8724`) | `Salva` / `Salva e importa`, poi destinazione da summary | manutenzione / magazzino / preventivo / generico secondo `buildUnifiedDocumentDestinationSummary()` |
| Card alta, 2+ file | `src/next/NextInternalAiPage.tsx:9527-9595`, `8394-8424` | `handleUnifiedDocumentAnalyze` | `documentEntryPendingFiles`, `chatAttachments`, `documentEntryUsesMultiFileFlow`, `chatDocumentProposalState` | `orchestrateInternalAiUniversalRequest()` (`6860-6939`; orchestrator `82-180`) | proposal banner + `documentReviewModalState` (`7517-7577`, `13838-14447`) | `Apri review unica ->`, poi in modal `Apri in Magazzino` o altra CTA | dipende dal router; puo diventare Magazzino anche se `Tipo atteso` era manutenzione |
| Chat + allegato singolo | `src/next/NextInternalAiPage.tsx:9694-9753`, `6860-6939` | `handleChatAttachmentSelection`, auto-effect orchestrator, `handleChatSubmit` | `chatAttachments`, `chatDocumentProposalState`, `chatMessages` | orchestrator universale; submit opzionale backend chat | proposal banner o thread chat; review modal se l'utente apre | `Apri review ->` / `Apri originale` | modulo da router/handoff |
| Chat + 2+ allegati con toggle | `src/next/NextInternalAiPage.tsx:7409-7424`, `6860-6939`, `13855-13863` | auto-effect orchestrator | `treatAttachmentsAsSingleDocument`, `chatDocumentProposalState` | orchestrator + aggregate multi-file | review modal `Documento logico unificato` | `Apri review unica ->`, poi CTA route-based | target collassato dal router/handoff |
| Pending merge | `src/next/NextStrumentiUnisciDocumentiPage.tsx:11-19`, `src/next/NextInternalAiPage.tsx:4541-4545` | `setPendingMergeFile`, consume al mount | `pendingFile` store in-memory -> `chatAttachments` | `handleChatAttachmentSelection` + eventuale orchestrator auto | ramo chat/proposal, non card alta | dipende dalla proposal | target route-based |
| Query `reviewDocumentId` | `src/next/NextInternalAiPage.tsx:4471-4482`, `8305-8341` | effect query review | `openedHistoryDocumentId`, `documentWorkspaceTab`, `documentUserDestination` | nessun orchestrator; storico shared | review storica in-page | `Riapri review` / `Vai a ...` da storico | target archivio reale |
| Navigation state `initialPrompt` / `triggerUpload` | `src/next/NextInternalAiPage.tsx:4484-4533` | effect launcher | `chatInput` oppure `documentExpectedType` + click picker | nessuno subito | chat precompilata oppure picker documento | nessuna CTA finale diretta | apre il ramo scelto |

## L. MATRICE `TIPO ATTESO` -> TARGET REALE

| Tipo atteso | Dove entra | Dove viene letto | Dove pesa davvero | Dove puo essere ignorato / sovrascritto |
|---|---|---|---|---|
| `MANUTENZIONE` | select card alta (`src/next/NextInternalAiPage.tsx:9528-9543`, `9793-9807`) | `documentExpectedType` (`4453-4454`) | summary singolo-file: se c'e targa va a `mezzo_manutenzioni` (`394-420`) | multi-file: non arriva all'orchestratore (`8394-8424`, orchestrator `82-98`); puo quindi finire `tabella_materiali -> Magazzino` |
| `MAGAZZINO` | non esiste come opzione esplicita; e inferito via `buildUnifiedDocumentDestinationSummary()` da `results.categoriaArchivio`, `tipoDocumento`, righe (`423-438`) | post-estrazione singolo-file | pesa nel singolo-file dopo `documentResults` | multi-file: pesa solo se l'aggregate / router produce segnali materiali |
| `LIBRETTO` | non esiste nel select card alta; entra solo dal router documentale tramite segnali `libretto` / `carta di circolazione` (`src/next/internal-ai/internalAiUniversalDocumentRouter.ts:134-150`) | router/handoff | pesa solo nel ramo orchestrator | card alta singolo-file non ha un `tipo atteso` libretto dedicato |
| `GENERICO` | select card alta (`9528-9543`, `9793-9807`) | `documentExpectedType` (`4453-4454`) | summary singolo-file: `archivio_generico` (`440-450`) | puo essere superato da `results` che suggeriscono manutenzione o magazzino |
| `PREVENTIVO` | select card alta (`9528-9543`, `9793-9807`) | `documentExpectedType` (`4453-4454`) | summary singolo-file: `mezzo_preventivi` con targa (`365-391`) | multi-file: ignorato dal router se non viene riflesso nei segnali attachment/prompt |

Nota chiave:
- Nel ramo multi-file il `Tipo atteso` non e parte del contratto di `orchestrateInternalAiUniversalRequest()` (`src/next/internal-ai/internalAiUniversalOrchestrator.ts:82-98`).

## M. COMPONENTI FIGLI REALMENTE MONTATI

| Componente | Import path | Condizione di mount | Funzione reale |
|---|---|---|---|
| `InternalAiUniversalWorkbench` | `./internal-ai/InternalAiUniversalWorkbench` | `documentWorkspaceTab === "chat"` (`src/next/NextInternalAiPage.tsx:10723-10729`) | pannello workbench tecnico della chat universale |
| `InternalAiUniversalRequestsPanel` | `./internal-ai/InternalAiUniversalRequestsPanel` | `sectionId === "requests"` (`src/next/NextInternalAiPage.tsx:13350-13353`) | pannello richieste tecniche del sottosistema IA |
| `InternalAiProfessionalVehicleReportView` | `./internal-ai/InternalAiProfessionalVehicleReportView` | `report.reportType === "targa"` dentro il modale report (`src/next/NextInternalAiPage.tsx:2214-2220`) | render del report targa professionale |
| `UnisciDocumentiTool` | `./strumenti/UnisciDocumentiTool` | `isMergeToolOpen` (`src/next/NextInternalAiPage.tsx:14439-14446`) | tool merge PDF interno alla pagina |
| `UnisciDocumentiTool` wrapper esterno | `./strumenti/UnisciDocumentiTool` in `NextStrumentiUnisciDocumentiPage` | route strumenti merge (`src/next/NextStrumentiUnisciDocumentiPage.tsx:11-28`) | produce un PDF e lo inoltra a `/next/ia/interna` via `pendingMergeStore` |

## N. USESTATE / USEEFFECT / STORE CRITICI

### Stati critici

- Allegati chat:
  - `chatAttachments` (`src/next/NextInternalAiPage.tsx:4314`)
  - `treatAttachmentsAsSingleDocument` (`4315`)
  - `chatAttachmentRepositoryState` (`4319-4326`)
- Card alta documento:
  - `documentExpectedType` (`4453-4454`)
  - `documentEntryPendingFiles` (`4343`)
  - `documentEntryTreatFilesAsSingleDocument` (`4344-4345`)
  - `documentEntryUsesMultiFileFlow` (`4346`)
  - `documentResults`, `documentSelectedFile`, `documentErrorMessage` via motore shared (`4431-4450`)
- Review state:
  - `documentWorkspaceTab` (`4451-4452`)
  - `openedHistoryDocumentId` (`4467`)
  - `documentUserDestination` (`4468-4469`)
  - `documentReviewModalState` (`4333-4338`)
  - `documentReviewSelectionState` (`4339-4341`)
- Modali:
  - `reportPreviewModalState` (`4328-4332`)
  - `documentHistoryOpen` (`4466`)
  - `isMergeToolOpen` (`4348`)
- Pending store:
  - store in-memory `pendingFile` (`src/next/strumenti/pendingMergeStore.ts:1-9`)
- Query / deep-link:
  - `requestedHistoryReviewQuery` (`src/next/NextInternalAiPage.tsx:4471-4482`)
- Tracking / archive filters:
  - `artifactSearchQuery`, `artifactTypeFilter`, `artifactStatusFilter`, `artifactFamilyFilter`, `artifactTargaFilter`, `artifactAutistaFilter`, `artifactPeriodFilter` (`4374-4394`)

### Effect critici

- Launcher state -> prompt/picker (`4484-4533`)
- Pending merge -> allegato chat (`4541-4545`)
- Sync default grouping chat (`4805-4815`)
- Sync default grouping card alta (`4817-4827`)
- Auto orchestration proposta documento quando cambiano gli allegati (`6860-6939`)
- Auto apply destinazione suggerita nel caso singolo dopo l'analisi shared (`8246-8256`)
- Query review -> apertura documento storico e cleanup URL (`8305-8341`)

### Store / persistenza

- `pendingMergeStore`:
  - in-memory puro, nessun `localStorage` / `sessionStorage` (`src/next/strumenti/pendingMergeStore.ts:1-9`)
- Allegati chat:
  - repository server isolato oppure fallback browser locale via object URL (`src/next/internal-ai/internalAiChatAttachmentsClient.ts:32-64`, `210-352`)
- Tracking / archive memory:
  - la pagina usa `useSyncExternalStore(subscribeInternalAiTracking, readInternalAiTrackingSummary, ...)` (`src/next/NextInternalAiPage.tsx:4257-4260`)
  - la pagina persiste i filtri archivio via `rememberInternalAiArtifactArchiveState(...)` (`5681-5699`)
  - backing store concreto `localStorage` / altro: `DA VERIFICARE` in questo audit perimetro
- Accesso diretto a `sessionStorage` nella pagina:
  - non trovato nei file letti

## O. CODICE MORTO CON CRITERIO CHIARO

| File | Simbolo / ramo | Motivo dimostrabile | Stato |
|---|---|---|---|
| `src/next/NextInternalAiPage.tsx` | prop `surfaceVariant`, ramo `home-modal` (`194-197`, `9229-9313`, `9757-9930`) | nessuna route in `src/App.tsx:479-517` passa `surfaceVariant`; ricerca repo non trova call site che monti `NextInternalAiPage` con quel prop | morto certo nel route graph corrente |
| `src/next/NextInternalAiPage.tsx` | prop `initialChatInput` | usata solo internamente (`4300`, `7915-7921`), ma nessun call site la passa | morto certo nel route graph corrente |
| `src/next/NextInternalAiPage.tsx` | prop `initialChatAttachments` | usata solo internamente (`6647-6668`), ma nessun call site la passa | morto certo nel route graph corrente |
| `src/next/NextInternalAiPage.tsx` | prop `autoSubmitInitialChat` | usata solo nell'effect `7906-7931`, ma nessun call site la passa | morto certo nel route graph corrente |
| `src/next/internal-ai/internal-ai.css` | classi `.internal-ai-home-modal*` (`922-957`, `1344-1355`) | servono solo al ramo `home-modal`, che non ha call site attivi nel route graph corrente | morto certo nel route graph corrente |
| `src/next/internal-ai/internalAiDocumentAnalysis.ts` | uso di `attachment.documentAnalysis` come input aggregato (`274-397`) | il file la consuma ma non la produce; senza backend attachment auditato, la catena completa resta incompleta | `DA VERIFICARE` |

## P. LINEE PRECISE

Regola applicata in questo report:
- Ogni claim strutturale sopra e accompagnato da file e linee.
- Dove la linea non basta per chiudere la prova completa del runtime, il punto e marcato `DA VERIFICARE`.

## Q. VERIFICA RUNTIME MINIMA

`RUNTIME NON VERIFICATO`.

Tentativo eseguito davvero:
- URL provata: `http://127.0.0.1:4174/next/ia/interna`
- Data: 2026-04-14
- Esito Playwright: `ERR_CONNECTION_REFUSED`

Conseguenza:
- Non e stato possibile confermare in browser, in questo turno, quale vista compaia con `1 file`, quale con `2 file`, e se la CTA `Apri in Magazzino` compaia davvero nel runtime locale attuale.
- Il report resta quindi basato solo sul codice reale letto sopra.
