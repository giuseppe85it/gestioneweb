# VERIFICA SPEC SETTORE MEZZI POST READER - 2026-04-28

## 1. INTRO

Data verifica: 2026-04-28.

File verificato: `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md`.

Fonte unica di verita': codice reale del repository, con focus sui reader implementati:

- `src/next/domain/nextSegnalazioniControlliDomain.ts`
- `src/next/domain/nextDocumentiMezzoDomain.ts`

Vincoli rispettati:

- Audit puro: nessuna modifica a codice runtime.
- Spec verificata ma non modificata.
- Nessun comando git eseguito.
- Archivista non analizzato.

Divergenze totali: 5.

- Critiche: 0.
- Medie: 3.
- Minori: 2.

Verdetto: DA CORREGGERE.

La spec resta implementabile come direzione funzionale, ma non e' ancora allineata ai contratti reali dei due reader ora esistenti.

## 2. CLAIM SUI READER NUOVI

### Reader 1 - D11-MEZ-EVENTI

Esito: PARZIALE.

Codice reale:

- File esiste: `src/next/domain/nextSegnalazioniControlliDomain.ts`.
- Costante dominio: `NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN` a `src/next/domain/nextSegnalazioniControlliDomain.ts:10`.
- Domain code reale: `"D11-MEZ-EVENTI"` a `src/next/domain/nextSegnalazioniControlliDomain.ts:11`.
- Dataset reali: `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti` a `src/next/domain/nextSegnalazioniControlliDomain.ts:5-6`.
- Tipo snapshot reale: `NextMezzoSegnalazioniControlliSnapshot` a `src/next/domain/nextSegnalazioniControlliDomain.ts:61-74`.
- Timeline item reale: `NextMezzoSegnalazioniControlliTimelineItem` a `src/next/domain/nextSegnalazioniControlliDomain.ts:76-81`.
- Normalizzazione targa: `normalizeNextSegnalazioniControlliTarga` a `src/next/domain/nextSegnalazioniControlliDomain.ts:92-94`.
- Match targa esportato: `isNextSegnalazioniControlliSameTarga` a `src/next/domain/nextSegnalazioniControlliDomain.ts:120-124`.
- Funzione principale: `readNextMezzoSegnalazioniControlliSnapshot` a `src/next/domain/nextSegnalazioniControlliDomain.ts:297-350`.
- Lettura clone-safe: `readNextUnifiedStorageDocument` usata a `src/next/domain/nextSegnalazioniControlliDomain.ts:307-308`.
- Nessun import da `src/pages/**` trovato nel file.
- Nessun `firestoreWriteOps` o `storageWriteOps` trovato nel file.

Confronto con spec:

- La spec cita il path `src/next/domain/nextSegnalazioniControlliDomain.ts`, ma lo descrive ancora come "Reader nuovo da implementare PRIMA" e "Path previsto" a `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:170-172`.
- La spec non cita `D11-MEZ-EVENTI`.
- La spec non cita `NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN`.
- La spec non cita `readNextMezzoSegnalazioniControlliSnapshot`.
- La spec non cita `NextMezzoSegnalazioniControlliSnapshot`.

### Reader 2 - D12-MEZ-DOCUMENTI

Esito: PARZIALE.

Codice reale:

- File esiste: `src/next/domain/nextDocumentiMezzoDomain.ts`.
- Costante dominio: `NEXT_DOCUMENTI_MEZZO_DOMAIN` a `src/next/domain/nextDocumentiMezzoDomain.ts:16`.
- Domain code reale: `"D12-MEZ-DOCUMENTI"` a `src/next/domain/nextDocumentiMezzoDomain.ts:17`.
- Collection reali: `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` a `src/next/domain/nextDocumentiMezzoDomain.ts:11-13`.
- Tipo item reale: `NextDocumentoMezzoItem` a `src/next/domain/nextDocumentiMezzoDomain.ts:30-53`.
- Tipo snapshot reale: `NextMezzoDocumentiSnapshot` a `src/next/domain/nextDocumentiMezzoDomain.ts:61-73`.
- Normalizzazione targa: `normalizeNextDocumentiMezzoTarga` a `src/next/domain/nextDocumentiMezzoDomain.ts:84-86`.
- Match targa esportato: `isNextDocumentiMezzoSameTarga` a `src/next/domain/nextDocumentiMezzoDomain.ts:100-104`.
- Funzione principale: `readNextMezzoDocumentiSnapshot` a `src/next/domain/nextDocumentiMezzoDomain.ts:252-299`.
- Lettura clone-safe reale: `readNextUnifiedCollection` importata a `src/next/domain/nextDocumentiMezzoDomain.ts:1` e usata a `src/next/domain/nextDocumentiMezzoDomain.ts:257-258`.
- Riferimento correlato non importato: `readNextMezzoDocumentiCostiSnapshot` citato nel commento a `src/next/domain/nextDocumentiMezzoDomain.ts:3-7`.
- Nessun import da `src/pages/**` trovato nel file.
- Nessun `firestoreWriteOps` o `storageWriteOps` trovato nel file.

Confronto con spec:

- La spec cita il path `src/next/domain/nextDocumentiMezzoDomain.ts`, ma lo descrive ancora come "Path previsto" e "nome esatto da decidere" a `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:181-183`.
- La spec non cita `D12-MEZ-DOCUMENTI`.
- La spec non cita `NEXT_DOCUMENTI_MEZZO_DOMAIN`.
- La spec non cita `readNextMezzoDocumentiSnapshot`.
- La spec non cita `NextMezzoDocumentiSnapshot`.
- La spec non dice che Reader 2 usa `readNextUnifiedCollection`, dato reale vincolante post implementazione.

### Compatibilita' shape verso settore Mezzi

Esito: PARZIALE.

Il codice espone shape reali e importabili:

- `NextMezzoSegnalazioniControlliSnapshot` a `src/next/domain/nextSegnalazioniControlliDomain.ts:61-74`.
- `NextMezzoDocumentiSnapshot` a `src/next/domain/nextDocumentiMezzoDomain.ts:61-73`.

La spec usa invece `unknown` in `ChatIaMezzoSnapshot`:

- `segnalazioniControlliCompleti: unknown` a `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:214`.
- `documentiCompleti: unknown` a `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:215`.

Questo non e' piu' allineato allo stato reale del codice post-reader.

## 3. CLAIM PRECEDENTI ANCORA VALIDI

### Ossatura Chat IA NEXT

Esito: OK con una nota minore su range.

- `ChatIaSectorId`, `ChatIaReport`, `ChatIaRunnerContext`, `ChatIaRunnerResult` esistono in `src/next/chat-ia/core/chatIaTypes.ts:7-169`.
- `ChatIaReport` e' a `src/next/chat-ia/core/chatIaTypes.ts:61-82`, coerente con la spec.
- `ChatIaRunnerResult` contiene `sources?: ChatIaSectorId[]` a `src/next/chat-ia/core/chatIaTypes.ts:156-169`.
- `ChatIaSectorRunner` esiste in `src/next/chat-ia/sectors/sectorTypes.ts:9-22`.
- `getRunner` oggi ritorna `null` in `src/next/chat-ia/core/chatIaSectorRegistry.ts:10-15`, come dichiarato dalla spec.
- Route `/next/chat`: import `ChatIaPage` a `src/App.tsx:11`; route `path="chat"` a `src/App.tsx:514-521`. Il range spec `src/App.tsx:515-518` cattura path e componente, ma non tutto il blocco route.
- Router: parole chiave mezzi in `src/next/chat-ia/core/chatIaRouter.ts:21-25`, scoring a `src/next/chat-ia/core/chatIaRouter.ts:56-68`, `routeChatIaPrompt` a `src/next/chat-ia/core/chatIaRouter.ts:84-146`.
- Helper testo: `extractTarga` a `src/next/chat-ia/core/chatIaText.ts:26-31`; `extractPeriodHint` a `src/next/chat-ia/core/chatIaText.ts:56-83`.

### Card mezzo Step Zero e tipi IA interna

Esito: OK.

- `InternalAiMezzoCard` esiste ed e' esportato come default a `src/next/internal-ai/InternalAiMezzoCard.tsx:60`.
- `MezzoDossierCardData` esiste a `src/next/internal-ai/internalAiTypes.ts:756-782`.
- `MezzoDossierStructuredCard` esiste a `src/next/internal-ai/internalAiTypes.ts:784-787`.
- La costruzione della card Step Zero parte da `const structuredCard: MezzoDossierStructuredCard` a `src/next/internal-ai/internalAiChatOrchestrator.ts:1798-1799`.

### Reader esistenti D01, D02, D04, D05, D10

Esito: OK.

- D01 flotta: `readNextAnagraficheFlottaSnapshot` a `src/next/nextAnagraficheFlottaDomain.ts:763-878`.
- D01 mezzo puntuale: `readNextMezzoByTarga` a `src/next/nextAnagraficheFlottaDomain.ts:880-890`.
- D02 operativita' tecnica: `readNextMezzoOperativitaTecnicaSnapshot` a `src/next/nextOperativitaTecnicaDomain.ts:223-250`.
- D02 lavori mezzo: `readNextMezzoLavoriSnapshot` a `src/next/domain/nextLavoriDomain.ts:1066-1095`.
- D04 rifornimenti mezzo: `readNextMezzoRifornimentiSnapshot` a `src/next/domain/nextRifornimentiDomain.ts:1304-1324`.
- D05 materiali: `readNextMaterialiMovimentiSnapshot` a `src/next/domain/nextMaterialiMovimentiDomain.ts:1125-1165`.
- D05 vista mezzo materiali: `buildNextMezzoMaterialiMovimentiSnapshot` a `src/next/domain/nextMaterialiMovimentiDomain.ts:1194-1238`.
- D10 stato operativo: `readNextCentroControlloSnapshot` a `src/next/domain/nextCentroControlloDomain.ts:1627-1655`; alias `readNextStatoOperativoSnapshot` a `src/next/domain/nextCentroControlloDomain.ts:1657-1660`.

### Mezzo 360 madre come riferimento

Esito: OK.

- Dataset Mezzo 360: `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, documenti e altri dataset a `src/pages/Mezzo360.tsx:13-30`.
- `normalizeTarga` a `src/pages/Mezzo360.tsx:70-73`.
- Fuzzy `isSameTarga` a `src/pages/Mezzo360.tsx:135-148`.
- Lettura documenti live `getDocs(collection(db, colName))` a `src/pages/Mezzo360.tsx:231-237`.
- Timeline madre eventi/segnalazioni/controlli/rifornimenti/gomme a `src/pages/Mezzo360.tsx:543-615`.

### Report e archivio Chat IA

Esito: PARZIALE per range PDF.

- `generateChatIaReportPdf` esiste a `src/next/chat-ia/reports/chatIaReportPdf.ts:23-77`.
- Il ramo preview usa `generateInternalAiReportPdfBlob` a `src/next/chat-ia/reports/chatIaReportPdf.ts:26-34`.
- Il fallback jsPDF inizia a `src/next/chat-ia/reports/chatIaReportPdf.ts:37`, ma il return `blob/fileName` e' a `src/next/chat-ia/reports/chatIaReportPdf.ts:73-76`.
- La spec cita fallback a `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:332` con range `37-70`, che non include il return del fallback.
- `createChatIaReportArchiveEntry` esiste a `src/next/chat-ia/reports/chatIaReportArchive.ts:44-91`.
- Lista/riapertura/cancellazione soft sono a `src/next/chat-ia/reports/chatIaReportArchive.ts:94-123`.

## 4. DECISIONI VINCOLANTI

### D1 - Documenti completi

Esito: PARZIALE.

La decisione funzionale e' coerente: documenti completi in v1 tramite reader dedicato. Il reader esiste e legge le tre collection reali:

- `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` a `src/next/domain/nextDocumentiMezzoDomain.ts:11-13`.
- Funzione `readNextMezzoDocumentiSnapshot` a `src/next/domain/nextDocumentiMezzoDomain.ts:252-299`.

La spec pero' resta formulata come prerequisito futuro:

- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:468`.

### D2 - Fuzzy targa

Esito: OK.

La spec chiede replica locale nel settore, senza importare `src/pages/Mezzo360.tsx`:

- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:122-139`.

La logica madre citata esiste:

- `src/pages/Mezzo360.tsx:135-148`.

Nota: i due reader implementati hanno anche helper fuzzy locali propri (`src/next/domain/nextSegnalazioniControlliDomain.ts:108-124`, `src/next/domain/nextDocumentiMezzoDomain.ts:88-104`). Questo non contraddice la spec del settore, perche' il settore deve comunque avere la propria utility di risoluzione/routing targa.

### D3 - Timeline v1 completa per 5 sorgenti

Esito: PARZIALE.

La decisione e' coerente con i reader implementati:

- D10 eventi: `src/next/domain/nextCentroControlloDomain.ts:1641`.
- D11 segnalazioni/controlli completi: `src/next/domain/nextSegnalazioniControlliDomain.ts:5-6`, `src/next/domain/nextSegnalazioniControlliDomain.ts:297-350`.
- D04 rifornimenti: `src/next/domain/nextRifornimentiDomain.ts:1304-1324`.
- D02 manutenzioni/lavori: `src/next/nextOperativitaTecnicaDomain.ts:223-250`, `src/next/domain/nextLavoriDomain.ts:1066-1095`.

La spec pero' continua a parlare di "nuovo reader clone-safe" come dipendenza futura a `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:249-266` e `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:470`.

Inoltre il test utente dice "timeline parziale" a `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:462`, mentre la decisione D3 parla di timeline v1 completa per le 5 sorgenti dichiarate.

### D4 - Report v1 obbligatorio

Esito: OK.

- `ChatIaReport` supporta `sector`, `type`, `target`, `period`, `preview`, `sections`, `sources`, `missingData` a `src/next/chat-ia/core/chatIaTypes.ts:61-82`.
- PDF adapter esiste a `src/next/chat-ia/reports/chatIaReportPdf.ts:23-77`.
- Archivio report esiste a `src/next/chat-ia/reports/chatIaReportArchive.ts:44-123`.

## 5. VERIFICHE COERENZA INTERNA

### Tipi

Esito: PARZIALE.

I tipi generali della Chat IA sono coerenti, ma `ChatIaMezzoSnapshot` nella spec non usa ancora i tipi reali dei due reader implementati:

- `unknown` a `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:214-215`.
- Tipi reali disponibili a `src/next/domain/nextSegnalazioniControlliDomain.ts:61-74` e `src/next/domain/nextDocumentiMezzoDomain.ts:61-73`.

### File da riusare

Esito: PARZIALE.

La sezione 11 include i reader D01, D02, D04, D05, D10 e i componenti ossatura, ma non include i due reader nuovi:

- Sezione 11: `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:402-421`.
- Reader reali assenti dalla lista: `src/next/domain/nextSegnalazioniControlliDomain.ts`, `src/next/domain/nextDocumentiMezzoDomain.ts`.

### File da non toccare

Esito: OK.

La sezione 12 resta coerente con il perimetro: madre, Step Zero, tipi IA interna, reader D01-D10, vecchia chat e backend non vanno modificati (`docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:423-432`).

### Definition of Done

Esito: PARZIALE.

I criteri 17 e 18 dichiarano correttamente che i due reader devono essere disponibili come import prima del settore:

- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:452-453`.

Post implementazione, pero', la DoD dovrebbe citare i nomi reali degli import e i domain code:

- `readNextMezzoSegnalazioniControlliSnapshot`, `D11-MEZ-EVENTI`.
- `readNextMezzoDocumentiSnapshot`, `D12-MEZ-DOCUMENTI`.

### Test utente

Esito: PARZIALE.

I test sono coerenti per card, materiali, documenti e report. Il test timeline usa pero' "timeline parziale" (`docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:462`) mentre la decisione D3 richiede timeline v1 completa per le 5 sorgenti dichiarate (`docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:470`).

## 6. DIVERGENZE TROVATE

### DVG-MEZ-POST-001 - MEDIA - Reader ancora descritti come futuri e non come contratti reali

Spec:

- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:170-183`
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:249-266`
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:383`
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:452-453`
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:468-470`

Codice reale:

- Reader 1 esiste con `NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN`, code `D11-MEZ-EVENTI`, e funzione `readNextMezzoSegnalazioniControlliSnapshot` a `src/next/domain/nextSegnalazioniControlliDomain.ts:10-15`, `src/next/domain/nextSegnalazioniControlliDomain.ts:297-350`.
- Reader 2 esiste con `NEXT_DOCUMENTI_MEZZO_DOMAIN`, code `D12-MEZ-DOCUMENTI`, e funzione `readNextMezzoDocumentiSnapshot` a `src/next/domain/nextDocumentiMezzoDomain.ts:16-21`, `src/next/domain/nextDocumentiMezzoDomain.ts:252-299`.

Problema:

La spec non e' aggiornata allo stato post-implementazione. Continua a usare parole come "Path previsto", "nome da decidere", "prerequisito separato" e non cita i nomi importabili reali.

### DVG-MEZ-POST-002 - MEDIA - Shape `ChatIaMezzoSnapshot` non allineata ai tipi reali

Spec:

- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:214-215`

Codice reale:

- `NextMezzoSegnalazioniControlliSnapshot` a `src/next/domain/nextSegnalazioniControlliDomain.ts:61-74`.
- `NextMezzoDocumentiSnapshot` a `src/next/domain/nextDocumentiMezzoDomain.ts:61-73`.

Problema:

La spec usa `unknown` per i due campi che ora hanno tipi reali disponibili. Il consumatore settore Mezzi deve poter importare quei tipi e non restare ambiguo.

### DVG-MEZ-POST-003 - MEDIA - Sezione 11 non include i due reader nuovi tra i file da riusare

Spec:

- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:402-421`

Codice reale:

- `src/next/domain/nextSegnalazioniControlliDomain.ts`
- `src/next/domain/nextDocumentiMezzoDomain.ts`

Problema:

La lista dei file da riusare non include i due prerequisiti ora implementati. Questo e' incoerente con il compito del settore Mezzi, che deve consumarli senza modificarli.

### DVG-MEZ-POST-004 - MINORE - Test utente parla di timeline parziale

Spec:

- Test utente: `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:462`
- Decisione D3: `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:470`

Problema:

Il test utente dice "timeline parziale", mentre la decisione D3 richiede timeline v1 completa per le 5 sorgenti dichiarate. Va riallineato il testo del test alla decisione D3.

### DVG-MEZ-POST-005 - MINORE - Range PDF fallback non include il return reale

Spec:

- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:332`
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:419`

Codice reale:

- `generateChatIaReportPdf` e' a `src/next/chat-ia/reports/chatIaReportPdf.ts:23-77`.
- Fallback jsPDF inizia a `src/next/chat-ia/reports/chatIaReportPdf.ts:37`.
- Return fallback `blob/fileName` a `src/next/chat-ia/reports/chatIaReportPdf.ts:73-76`.

Problema:

Il range `37-70` non include il return reale del fallback. Il range completo corretto e' `37-77` oppure il riferimento aggregato `23-77`.

## 7. RIEPILOGO RACCOMANDAZIONI

1. Aggiornare la spec settore Mezzi per sostituire il linguaggio "reader futuro/prerequisito" con riferimenti reali ai due reader implementati.
2. Inserire in sezione 5 e 10 gli import previsti:
   - `readNextMezzoSegnalazioniControlliSnapshot`
   - `NextMezzoSegnalazioniControlliSnapshot`
   - `NEXT_SEGNALAZIONI_CONTROLLI_DOMAIN`
   - `readNextMezzoDocumentiSnapshot`
   - `NextMezzoDocumentiSnapshot`
   - `NEXT_DOCUMENTI_MEZZO_DOMAIN`
3. Sostituire `unknown` in `ChatIaMezzoSnapshot` con i tipi snapshot reali.
4. Aggiungere i due reader nuovi nella sezione 11 "FILE ESISTENTI DA RIUSARE" e nell'appendice file letti.
5. Aggiornare il test utente timeline da "parziale" a "completa per le 5 sorgenti dichiarate".
6. Correggere il range PDF fallback a `src/next/chat-ia/reports/chatIaReportPdf.ts:37-77` o `23-77`.

## 8. APPENDICE: file letti

- `docs/_live/STATO_ATTUALE_PROGETTO.md`
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md`
- `src/next/domain/nextSegnalazioniControlliDomain.ts`
- `src/next/domain/nextDocumentiMezzoDomain.ts`
- `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/chat-ia/core/chatIaTypes.ts`
- `src/next/chat-ia/core/chatIaRouter.ts`
- `src/next/chat-ia/core/chatIaText.ts`
- `src/next/chat-ia/core/chatIaSectorRegistry.ts`
- `src/next/chat-ia/sectors/sectorTypes.ts`
- `src/next/chat-ia/reports/chatIaReportPdf.ts`
- `src/next/chat-ia/reports/chatIaReportArchive.ts`
- `src/next/internal-ai/InternalAiMezzoCard.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/next/domain/nextLavoriDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/App.tsx`
- `src/pages/Mezzo360.tsx`
