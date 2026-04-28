# VERIFICA SPEC SETTORE MEZZI CHAT IA NEXT - 2026-04-28

## 1. INTRO

Data verifica: 2026-04-28.

File verificato: `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md`.

Fonte unica di verita': codice reale del repository.

Perimetro: audit puro della spec settore Mezzi Chat IA NEXT. Nessuna modifica a codice o spec.

Esclusione: Archivista non analizzato. Sono stati letti solo file non-Archivista esplicitamente necessari alla verifica; eventuali menzioni documentali ad Archivista non sono state usate come base tecnica.

Risultato:

- Divergenze totali: 2
- Critiche: 0
- Medie: 1
- Minori: 1

Verdetto: DA CORREGGERE.

Motivo: la spec e' quasi implementabile, ma contiene un riferimento riga sfalsato e una promessa timeline non pienamente sostenuta dai reader esposti oggi.

## 2. CLAIM TECNICI VERIFICATI

### A. Path file citati

Verificati come esistenti:

- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`
- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`
- `src/pages/Mezzo360.tsx`
- `src/App.tsx`
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
- `src/next/domain/nextDocumentiCostiDomain.ts`

Verificati come da creare, quindi corretti come file futuri:

- `src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziTypes.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziTarga.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziTimeline.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziReport.ts`
- `src/next/chat-ia/sectors/mezzi/ChatIaMezzoCard.tsx`
- `src/next/chat-ia/sectors/mezzi/ChatIaMezzoTimeline.tsx`
- `src/next/chat-ia/sectors/mezzi/ChatIaMezzoMaterialsTable.tsx`
- `src/next/chat-ia/sectors/mezzi/ChatIaMezzoDocumentsPlaceholder.tsx`

Il path `src/next/chat-ia/sectors/mezzi/` e il `README.md` esistono.

### B. Numeri di riga

Riferimenti confermati:

- `src/App.tsx:11`, `src/App.tsx:515-518`: import e route `/next/chat`.
- `src/next/chat-ia/core/chatIaTypes.ts:7-168`: tipi comuni Chat IA.
- `src/next/chat-ia/core/chatIaRouter.ts:21-50`, `:56-68`, `:84-140`: keyword, scoring e routing.
- `src/next/chat-ia/core/chatIaText.ts:18-83`: normalize, targa, periodo.
- `src/next/chat-ia/core/chatIaSectorRegistry.ts:10-15`: `getRunner` oggi ritorna `null`.
- `src/next/chat-ia/sectors/sectorTypes.ts:9-22`: contratto `ChatIaSectorRunner`.
- `src/next/internal-ai/InternalAiMezzoCard.tsx:60`: componente card.
- `src/next/internal-ai/internalAiTypes.ts:756-787`: dati e structured card mezzo.
- `src/next/internal-ai/internalAiChatOrchestrator.ts:1798-1799`: costruzione structured card esistente.
- `src/next/nextAnagraficheFlottaDomain.ts:763-890`: D01 flotta e mezzo per targa.
- `src/next/nextOperativitaTecnicaDomain.ts:223-250`: D02 operativita' tecnica.
- `src/next/domain/nextLavoriDomain.ts:1066-1095`: D02 lavori mezzo.
- `src/next/domain/nextRifornimentiDomain.ts:1304-1324`: D04 rifornimenti mezzo.
- `src/next/domain/nextMaterialiMovimentiDomain.ts:26`, `:1125-1165`, `:1194`: D05 materiali.
- `src/next/domain/nextCentroControlloDomain.ts:1627-1660`: D10 lettura stato operativo.
- `src/next/chat-ia/reports/chatIaReportPdf.ts:23-70`: PDF adapter e fallback.
- `src/next/chat-ia/reports/chatIaReportArchive.ts:44-123`: archivio report.
- `src/pages/Mezzo360.tsx:13-30`, `:66-72`, `:135-148`, `:231-236`, `:374-615`: dataset, normalizzazione, fuzzy, documenti live, timeline.

Riferimento non confermato:

- `src/next/domain/nextDocumentiCostiDomain.ts:2017` e `:2254` nella spec sono sfalsati. Nel codice reale post-5D sono `:2010` e `:2247`.

### C. Nomi funzioni, costanti e tipi

Confermati:

- `routeChatIaPrompt`
- `extractTarga`
- `extractPeriodHint`
- `getRunner`
- `ChatIaSectorRunner`
- `ChatIaRunnerContext`
- `ChatIaRunnerResult`
- `ChatIaReport`
- `MezzoDossierCardData`
- `MezzoDossierStructuredCard`
- `readNextAnagraficheFlottaSnapshot`
- `readNextMezzoByTarga`
- `readNextMezzoOperativitaTecnicaSnapshot`
- `readNextMezzoLavoriSnapshot`
- `readNextMezzoRifornimentiSnapshot`
- `readNextMaterialiMovimentiSnapshot`
- `buildNextMezzoMaterialiMovimentiSnapshot`
- `readNextCentroControlloSnapshot`
- `readNextStatoOperativoSnapshot`
- `readNextIADocumentiArchiveSnapshot`
- `readNextDocumentiCostiFleetSnapshot`
- `generateChatIaReportPdf`
- `createChatIaReportArchiveEntry`
- `listChatIaReportArchiveEntries`
- `readChatIaReportArchiveEntry`
- `markChatIaReportArchiveEntryDeleted`

### D. Shape di tipi

Confermate:

- `ChatIaReport` contiene `sector`, `type: "puntuale" | "mensile" | "periodico"`, target targa/autista, `period`, `preview`, `sections`, `sources`, `missingData`.
- `ChatIaRunnerResult` contiene `status`, `sector`, `sources?`, `text`, `outputKind`, `entities`, `card`, `table`, `report`, `fallback`, `backendContext`, `error`.
- `ChatIaSectorRunner` usa `id`, `label`, `canHandle`, `run`, `fallbackContext`.
- `MezzoDossierStructuredCard` ha `kind: "mezzo_dossier"` e `data: MezzoDossierCardData`.
- `D10Snapshot` espone `eventiStorici`, `alerts`, `focusItems`, `importantAutistiItems`, ma non espone array raw separati `segnalazioni` e `controlli`.

### E. Comportamenti dichiarati

Confermati:

- Il router assegna punteggio alto al settore `mezzi` quando trova una entity targa.
- Mezzo 360 usa fuzzy match targa con differenza massima di 1 carattere e lunghezza differente al massimo di 1.
- Mezzo 360 legge documenti live con `getDocs(collection(db, colName))`.
- Mezzo 360 costruisce timeline da eventi, segnalazioni, controlli, rifornimenti e gomme.
- La card Step Zero e' riusabile come componente React separato.
- L'archivio Chat IA calcola `targetKind`, `targetValue`, `targetBadge` dal target del report.
- Per target `targa`, `targetBadge` risulta `null`.

Da correggere/precisare:

- La timeline v1 della spec elenca `segnalazioni` e `controlli` come sorgenti dirette, ma i reader clone-safe citati non espongono oggi gli array raw completi. D10 espone segnali derivati.

### F. Numeri di riferimento

Confermati:

- 4 decisioni vincolanti in sezione 15.
- 17 criteri DoD in sezione 13.
- 7 step di test utente in sezione 14.
- 5 sorgenti timeline v1 dichiarate.
- 10 file nuovi da creare sotto settore Mezzi, oltre al README esistente.

## 3. DIVERGENZE TROVATE

### DVG-MEZ-001 - MINORE - riferimenti riga Documenti/Costi sfalsati

Spec: `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:176`.

Claim:

- `readNextIADocumentiArchiveSnapshot` in `src/next/domain/nextDocumentiCostiDomain.ts:2017`.
- `readNextDocumentiCostiFleetSnapshot` in `src/next/domain/nextDocumentiCostiDomain.ts:2254`.

Codice reale:

- `readNextIADocumentiArchiveSnapshot` e' a `src/next/domain/nextDocumentiCostiDomain.ts:2010`.
- `readNextDocumentiCostiFleetSnapshot` e' a `src/next/domain/nextDocumentiCostiDomain.ts:2247`.

Impatto: basso. Il nome funzione e il file sono corretti, ma i numeri riga non sono piu' allineati.

Correzione richiesta: aggiornare i due riferimenti nella spec.

### DVG-MEZ-002 - MEDIA - timeline v1 promette sorgenti non esposte integralmente dai reader citati

Spec: `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:225-231`, `:242-261`, `:357`.

Claim:

- Timeline v1 con sorgenti `segnalazioni` e `controlli`.
- `ChatIaMezzoSnapshot` composto con D01, D02, D04, D05 e D10.
- D10 viene usato come reader per stato operativo.

Codice reale:

- D10 legge `@segnalazioni_autisti_tmp` e `@controlli_mezzo_autisti` internamente (`src/next/domain/nextCentroControlloDomain.ts:1641-1643`, `:1650-1652`).
- D10 espone pero' in `D10Snapshot` `eventiStorici`, `alerts`, `focusItems`, `importantAutistiItems`, non array raw completi `segnalazioni` e `controlli` (`src/next/domain/nextCentroControlloDomain.ts:262-287`).
- I `focusItems` coprono controlli KO e mezzi incompleti; `importantAutistiItems` deriva da segnalazioni/controlli importanti, non da tutta la sorgente.

Impatto: medio. Un implementatore potrebbe credere di poter produrre una timeline completa di segnalazioni e controlli usando solo D10, ma il contratto esposto oggi non lo garantisce.

Correzione richiesta: scegliere una delle due strade nella spec:

- limitare la timeline v1 ai segnali D10 effettivamente esposti (`eventiStorici`, `alerts`, `focusItems`, `importantAutistiItems`) piu' D04/D02;
- oppure dichiarare esplicitamente la necessita' di un reader clone-safe aggiuntivo per segnalazioni e controlli prima dell'implementazione.

## 4. VERIFICHE MIRATE OBBLIGATORIE

### 2.1 Sezione 11 - file da riusare

Esito: PASS con una nota.

Tutti i path esistono e quasi tutti i path:riga corrispondono. La nota e' DVG-MEZ-001 sui riferimenti Documenti/Costi, che sono citati in sezione 5 e appendice, non nella lista sezione 11.

### 2.2 Sezione 12 - file da non toccare

Esito: PASS.

Il perimetro vietato e' coerente:

- madre `src/pages/**` intoccabile;
- `src/pages/Mezzo360.tsx` solo riferimento;
- card Step Zero riusabile senza modifica;
- reader D01-D10 solo import;
- vecchia chat, backend e Archivista fuori perimetro.

### 2.3 Reader D01, D02, D04, D05, D10

Esito: PASS con nota timeline.

Reader e funzioni esistono:

- D01 flotta e mezzo puntuale: PASS.
- D02 operativita' e lavori mezzo: PASS.
- D04 rifornimenti mezzo: PASS.
- D05 materiali e vista mezzo: PASS.
- D10 stato operativo: PASS.

Nota: D10 non espone raw completi di segnalazioni/controlli; vedere DVG-MEZ-002.

### 2.4 InternalAiMezzoCard.tsx e import path

Esito: PASS.

`src/next/internal-ai/InternalAiMezzoCard.tsx:60` esporta default component. Dal futuro file `src/next/chat-ia/sectors/mezzi/ChatIaMezzoCard.tsx`, il path `../../../internal-ai/InternalAiMezzoCard` risolve verso `src/next/internal-ai/InternalAiMezzoCard.tsx`.

Il componente importa gia' il proprio CSS interno (`src/next/internal-ai/InternalAiMezzoCard.tsx:3`).

### 2.5 Tipi citati

Esito: PASS.

Esistono e corrispondono:

- `ChatIaSectorRunner`: `src/next/chat-ia/sectors/sectorTypes.ts:9-22`.
- `ChatIaRunnerContext`: `src/next/chat-ia/core/chatIaTypes.ts:140-148`.
- `ChatIaRunnerResult`: `src/next/chat-ia/core/chatIaTypes.ts:156-168`.
- `ChatIaReport`: `src/next/chat-ia/core/chatIaTypes.ts:61-82`.
- `MezzoDossierStructuredCard`: `src/next/internal-ai/internalAiTypes.ts:784-787`.

### 2.6 Fuzzy match Mezzo360

Esito: PASS.

`src/pages/Mezzo360.tsx:135-148` contiene davvero la logica fuzzy:

- normalizza entrambe le targhe;
- ritorna true su match esatto;
- ammette differenza lunghezza <= 1;
- conta al massimo 1 carattere diverso nel prefisso comune;
- al secondo carattere diverso ritorna false.

`normalizeTarga` e' a `src/pages/Mezzo360.tsx:70-72` e rimuove caratteri non alfanumerici.

### 2.7 PDF report e archivio

Esito: PASS.

`src/next/chat-ia/reports/chatIaReportPdf.ts:23-70`:

- chiama `generateInternalAiReportPdfBlob` se `report.preview` esiste;
- usa fallback jsPDF se manca `preview`.

`src/next/chat-ia/reports/chatIaReportArchive.ts:44-123`:

- crea record archivio;
- salva PDF opzionale;
- lista record;
- legge record singolo;
- marca deleted senza rimozione fisica.

### 2.8 Decisioni vincolanti

Esito: PASS con una correzione richiesta.

- Documenti=B: coerente tra sezioni 5, 6, 9, 13, 15.
- Fuzzy=A: coerente tra sezioni 4, 10, 13, 15.
- Timeline=B: coerente come decisione, ma da precisare sulla copertura reale D10; vedere DVG-MEZ-002.
- Report=v1 obbligatorio: coerente tra sezioni 8, 10, 13, 14, 15.

## 5. VERIFICHE COERENZA INTERNA

### 3.1 Tipi usati coerentemente

Esito: PASS.

I tipi `ChatIaReport`, `ChatIaRunnerResult`, `ChatIaSectorRunner`, `MezzoDossierCardData`, `MezzoDossierStructuredCard`, `D10Snapshot` sono usati in modo coerente con il codice reale.

### 3.2 File dichiarati in sezione 1

Esito: PASS.

I file dichiarati come futuri sono riusati nelle sezioni successive in modo coerente:

- runner;
- tipi;
- utility targa;
- data composer;
- timeline;
- report;
- card;
- tabella materiali;
- placeholder documenti.

Nessun file fantasma: tutti sono dichiarati come file da creare.

### 3.3 Decisioni D1-D4 coerenti con sezioni 4, 5, 7, 8

Esito: PASS con nota.

Le decisioni sono coerenti internamente. Nota: D3 timeline deve precisare la differenza fra "sorgente legacy esiste" e "reader D10 espone tutte le righe".

### 3.4 Definition of Done coerente con sezioni 2-10

Esito: PASS.

I 17 criteri DoD derivano dai flussi descritti:

- registrazione runner;
- prompt card/materiali/timeline/documenti/report;
- fuzzy match;
- fallback contestuale;
- report PDF e archivio;
- divieto di toccare madre/Archivista/backend/reader.

### 3.5 Test utente coerenti con DoD

Esito: PASS.

I 7 step utente coprono:

- route `/next/chat`;
- card mezzo;
- stato mezzo;
- materiali;
- timeline;
- documenti placeholder;
- report mensile esportabile e salvabile.

## 6. RIEPILOGO RACCOMANDAZIONI

1. Correggere `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:176`:
   - vecchio `src/next/domain/nextDocumentiCostiDomain.ts:2017`;
   - nuovo `src/next/domain/nextDocumentiCostiDomain.ts:2010`;
   - vecchio `src/next/domain/nextDocumentiCostiDomain.ts:2254`;
   - nuovo `src/next/domain/nextDocumentiCostiDomain.ts:2247`.

2. Correggere le sezioni timeline (`:225-231`, `:242-261`, `:357`) scegliendo una formulazione implementabile:
   - v1 basata sui segnali D10 esposti (`eventiStorici`, `alerts`, `focusItems`, `importantAutistiItems`) piu' D04/D02;
   - oppure nuovo reader clone-safe per segnalazioni/controlli prima della fase implementativa.

3. Dopo le due correzioni, rieseguire una verifica rapida dei soli punti DVG-MEZ-001 e DVG-MEZ-002.

## 7. APPENDICE: file letti

- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md`
- `docs/_live/STATO_ATTUALE_PROGETTO.md`
- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`
- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`
- `src/App.tsx`
- `src/pages/Mezzo360.tsx`
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
- `src/next/domain/nextDocumentiCostiDomain.ts`
