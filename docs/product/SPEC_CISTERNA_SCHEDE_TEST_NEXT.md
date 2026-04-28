# SPEC CISTERNA SCHEDE TEST NEXT

## 0. Metadati

- Data: 2026-04-28.
- Branch: `master`.
- HEAD: `e9c7fabdd2e9898bbab016dbf04162aae7f09cf3`.
- Autore: Codex.
- Modulo: Cisterna Caravate NEXT, sotto-pagina schede carburante di test.
- Route coperta: `/next/cisterna/schede-test`.
- Route fuori scope: `/next/cisterna`, `/next/cisterna/ia`, ogni route madre sotto `/cisterna/*`, ogni altra route NEXT.
- Stato git rilevato prima della redazione: worktree gia' sporco con modifiche non staged e file untracked non appartenenti a questa SPEC; questa SPEC non richiede commit e non modifica codice.

## 1. Decisioni architetturali vincolanti (D1-D18)

D1. Perimetro: solo `/next/cisterna/schede-test`. Tutto il resto Cisterna NEXT gia' chiuso.

- Riferimenti: route NEXT schede in `src/App.tsx:545-550`; route strutturale in `src/next/nextStructuralPaths.ts:35`; SPEC precedente dichiara schede-test fuori scope in `docs/product/SPEC_CISTERNA_CARAVATE_NEXT.md`.

D2. UI invariata: nessun redesign, nessun nuovo CSS, nessun nuovo prefisso. La pagina importa gia' `CisternaSchedeTest.css` madre. Solo riconnessione handler ai bottoni esistenti.

- Riferimenti: import CSS madre in `src/next/NextCisternaSchedeTestPage.tsx:11`; handler bloccanti da riconnettere in `src/next/NextCisternaSchedeTestPage.tsx:579-630`; CTA esistenti in `src/next/NextCisternaSchedeTestPage.tsx:806-815`, `:1041-1061`, `:1118-1127`, `:1152-1163`, `:1222-1230`, `:1456-1501`, `:1521-1527`.

D3. Madre intoccabile: zero modifiche a `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`, `src/cisterna/iaClient.ts`, `functions-schede/estrazioneSchedaCisterna.js`, `functions-schede/index.js`.

- Riferimenti: madre runtime in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1-3238`; client legacy in `src/cisterna/iaClient.ts:8-13`, `:246-308`; function Gemini in `functions-schede/estrazioneSchedaCisterna.js:1-498`; export function in `functions-schede/index.js:5-8`.

D4. Function Gemini legacy resta deployata e usata dalla madre. NEXT smette di puntarci. Nessuna deprecazione.

- Riferimenti: endpoint Gemini legacy `estrazioneSchedaCisterna` in `src/cisterna/iaClient.ts:10-11`; chiamata legacy madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1688-1696`; export ancora attivo in `functions-schede/index.js:5-8`.

D5. Domain `nextCisternaDomain.ts` resta read-only e invariato. Non si aggiungono writer dentro il domain.

- Riferimenti: domain legge schede e autisti in `src/next/domain/nextCisternaDomain.ts:564-613`, costruisce schede mese in `src/next/domain/nextCisternaDomain.ts:803-840`, detail in `src/next/domain/nextCisternaDomain.ts:842-888`, snapshot in `src/next/domain/nextCisternaDomain.ts:1240-1274`.

D6. Refresh post-scrittura: `readNextCisternaSnapshot(..., { includeCloneOverlays: false })` per snapshot, `readNextCisternaSchedaDetail(id, { includeCloneOverlays: false })` per detail in edit. Identico al pattern precedente.

- Riferimenti: snapshot gia' letto senza overlay in `src/next/NextCisternaSchedeTestPage.tsx:316-325`; detail edit gia' letto senza overlay in `src/next/NextCisternaSchedeTestPage.tsx:359-383`; funzioni domain in `src/next/domain/nextCisternaDomain.ts:842-852`, `:1240-1274`.

D7. Backend OpenAI: estendere `backend/internal-ai/server/internal-ai-document-extraction.js` con nuovo profilo `scheda_cisterna`, accanto ai 5 profili gia' presenti (`manutenzione`, `documento_mezzo`, `preventivo_magazzino`, `preventivo_price_extract`, `documento_cisterna`). Pattern identico al profilo `documento_cisterna` gia' implementato.

- Riferimenti: profili esistenti nel system prompt in `backend/internal-ai/server/internal-ai-document-extraction.js:1907-1972`; branch `documento_cisterna` in user instructions `backend/internal-ai/server/internal-ai-document-extraction.js:2224-2229`; dispatcher `documento_cisterna` in `backend/internal-ai/server/internal-ai-document-extraction.js:2607-2652`; profilo `scheda_cisterna` oggi `NON TROVATO IN REPO`.

D8. Endpoint Express hardcoded in `backend/internal-ai/server/internal-ai-adapter.js`, analogo strutturalmente all'endpoint `/internal-ai-backend/documents/documento-cisterna-analyze`. Path raccomandato: `/internal-ai-backend/documents/scheda-cisterna-analyze`. Nessuna costante condivisa in `internalAiServerPersistenceContracts.ts` (le altre 5 route documentali non sono registrate li').

- Riferimenti: endpoint `documento-cisterna-analyze` in `backend/internal-ai/server/internal-ai-adapter.js:1900-1984`; route documentali hardcoded esistenti in `backend/internal-ai/server/internal-ai-adapter.js:1521`, `:1670`, `:1795`, `:1900`; path `scheda-cisterna-analyze` oggi `NON TROVATO IN REPO`.

D9. Contratto endpoint OpenAI schede: input batch celle, identico semantica madre. Payload server: `{ profile: "scheda_cisterna", cells: [{ rowIndex: number, dataBase64: string, targaBase64: string, litriBase64: string }], providerRequired: true }`. Una sola immagine per cella, niente PDF (le celle sono crop JPEG generati lato client).

- Riferimenti: madre genera tre crop per riga in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1637-1684`; madre chiama client con `rowIndex`, `data_b64`, `targa_b64`, `litri_b64` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1688-1696`; client legacy posta `{ mode: "cells", ...input }` in `src/cisterna/iaClient.ts:246-263`; function legacy legge `mode`, `rows`, `cells` in `functions-schede/estrazioneSchedaCisterna.js:417-430`.

D10. Output OpenAI schede: envelope identico alla function Gemini madre `functions-schede/estrazioneSchedaCisterna.js:131-149`: `{ ok: true, needsReview: boolean, rows: [{ rowIndex, data_raw, targa_raw, litri_raw, data_status, targa_status, litri_status }], stats: { total, okRows, reviewRows }, rawText: string }`. Status per campo: `"OK" | "INCERTO" | "VUOTO"`. Identica semantica della madre.

- Riferimenti: `buildCellRow` in `functions-schede/estrazioneSchedaCisterna.js:115-128`; `buildCellsResponse` in `functions-schede/estrazioneSchedaCisterna.js:131-149`; status usati in NEXT in `src/next/NextCisternaSchedeTestPage.tsx:15`, `:455-463`.

D11. Prompt OpenAI: ripreso 1:1 da `PROMPT_CELLS` (`functions-schede/estrazioneSchedaCisterna.js:46-66`), riadattato solo provider mechanics (Gemini inlineData -> OpenAI Responses input_image, una immagine per ogni colonna data/targa/litri della singola cella).

- Riferimenti: testo prompt madre in `functions-schede/estrazioneSchedaCisterna.js:46-66`; provider Gemini attuale usa tre `inlineData` in `functions-schede/estrazioneSchedaCisterna.js:303-319`; OpenAI precedente usa pattern `documento_cisterna` in `backend/internal-ai/server/internal-ai-document-extraction.js:2224-2229`, `:2625-2636`.

D12. Modello default: `process.env.INTERNAL_AI_OPENAI_MODEL?.trim() || "gpt-5-mini"`, identico al precedente.

- Riferimenti: default modello in `backend/internal-ai/server/internal-ai-adapter.js:374-379`; configurazione provider con `OPENAI_API_KEY` in `backend/internal-ai/server/internal-ai-adapter.js:402-412`.

D13. Client NEXT: ESTENDERE `src/next/nextCisternaIaClient.ts` con una funzione exported aggiuntiva `extractCisternaSchedeCells`. Niente nuovo file client. Base URL via `VITE_INTERNAL_AI_BACKEND_URL` con fallback localhost (pattern `internalAiServerChatClient.ts:13-29` / `internalAiServerRepoUnderstandingClient.ts:12-28`). Conversione immagini base64 interna al wrapper. Errori via throw, no discriminator `ok`.

- Riferimenti: client Cisterna esistente in `src/next/nextCisternaIaClient.ts:1-166`; base URL esistente nel client Cisterna in `src/next/nextCisternaIaClient.ts:32-45`; pattern base URL chat in `src/next/internal-ai/internalAiServerChatClient.ts:13-29`; helper base URL riusabile in `src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts:12-28`; conversione base64 nel client documento Cisterna in `src/next/nextCisternaIaClient.ts:142-164`; pattern conversione immagini in `src/next/nextPreventivoIaClient.ts:130-146`.

D14. Firma wrapper schede: `extractCisternaSchedeCells(cells: Array<{ rowIndex: number, dataImage: File | Blob, targaImage: File | Blob, litriImage: File | Blob }>): Promise<CisternaSchedeExtractResult>`. `CisternaSchedeExtractResult` rispecchia 1:1 envelope D10.

- Riferimenti: tipo output madre in `functions-schede/estrazioneSchedaCisterna.js:131-149`; envelope legacy normalizzato dal client madre in `src/cisterna/iaClient.ts:265-308`; output status usati dalla pagina NEXT in `src/next/NextCisternaSchedeTestPage.tsx:27-36`, `:541-556`.

D15. Writer NEXT: ESTENDERE `src/next/nextCisternaWriter.ts` con 3 funzioni nuove esportate. Niente nuovo file writer.
- `createNextCisternaSchedaRecord({ payload }): Promise<{ id: string }>` -> `addDoc` su `@cisterna_schede_ia` con shape madre new save (`createdAt`, `source`, `rowCount`, `rows`, `needsReview`, `yearMonth`, meta).
- `updateNextCisternaSchedaRecord({ schedaId, payload }): Promise<void>` -> `updateDoc` su `@cisterna_schede_ia/<schedaId>` con shape madre edit (`rows`, `rowCount`, `needsReview`, `yearMonth`, `updatedAt`).
- `uploadNextCisternaSchedaCropImage({ blob, storagePath }): Promise<{ storagePath, fileUrl }>` -> `uploadBytes` + `getDownloadURL` su `documenti_pdf/cisterna_schede/<yyyy>/<mm>/<timestamp>_<safeName>_crop.jpg`. Path identico madre.

- Riferimenti: writer attuale da estendere in `src/next/nextCisternaWriter.ts:1-65`; collection schede in `src/cisterna/collections.ts:6`; wrapper Firestore in `src/utils/firestoreWriteOps.ts:15-35`; wrapper Storage in `src/utils/storageWriteOps.ts:20-25`; shape create/update madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1855-1887`; path upload madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2100-2108`.

D16. Calibrazione persistente: replicare 1:1 `localStorage` madre con key `cisterna_schede_calib_v1`. Stesso payload. Stesse 3 operazioni: `getItem` al mount, `setItem` su `Salva calibrazione`, `removeItem` su `Cancella calibrazione`. Nessuna scrittura Firestore per calibrazione.

- Riferimenti: key madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:95`; lettura `localStorage.getItem` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1149-1164`; cancellazione `localStorage.removeItem` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1502-1508`; salvataggio `localStorage.setItem` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1531-1547`; bottoni NEXT attuali bloccati in `src/next/NextCisternaSchedeTestPage.tsx:1152-1163`, `:1222-1230`.

D17. Deroghe barriera granulari in `src/utils/cloneWriteBarrier.ts`:
- `/next/cisterna/schede-test` + `firestore.addDoc` + collection `@cisterna_schede_ia`
- `/next/cisterna/schede-test` + `firestore.updateDoc` + path prefix `@cisterna_schede_ia/`
- `/next/cisterna/schede-test` + `storage.uploadBytes` + path prefix `documenti_pdf/cisterna_schede/`
- `/next/cisterna/schede-test` + `fetch.runtime` + `/internal-ai-backend/documents/scheda-cisterna-analyze`
La scrittura su `localStorage` per calibrazione NON richiede deroga barriera (la barriera copre Firestore/Storage/fetch, non localStorage diretto, come nei moduli precedenti).

- Riferimenti: deroghe Cisterna gia' presenti in `src/utils/cloneWriteBarrier.ts:42-49`, `:202-207`, `:232-238`, `:384-407`; wrapper Firestore/Storage chiamano la barriera in `src/utils/firestoreWriteOps.ts:15-35` e `src/utils/storageWriteOps.ts:20-25`; deroga schede-test oggi `NON TROVATO IN REPO`.

D18. Shape Firestore parity 1:1 madre. Unico campo additivo ammesso `iaEngine: "openai-responses"` su record salvati con fonte IA, coerente col precedente Cisterna Caravate (D6 SPEC precedente). Per record fonte `manual` nessun campo `iaEngine`.

- Riferimenti: payload madre add/edit in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1855-1887`; meta IA madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1824-1841`; meta manuale madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1769-1777`; collection in `src/cisterna/collections.ts:6`.

## 2. Stato di partenza (riassunto da audit)

La route `/next/cisterna/schede-test` e' gia' montata nel router NEXT e protetta da `NextRoleGuard areaId="cisterna"` in `src/App.tsx:545-550`. La pagina NEXT importa il CSS madre `../pages/CisternaCaravate/CisternaSchedeTest.css` in `src/next/NextCisternaSchedeTestPage.tsx:11`, quindi la SPEC non richiede CSS nuovi.

La lettura dati e' gia' autonoma: la pagina chiama `readNextCisternaSnapshot(..., { includeCloneOverlays: false })` in `src/next/NextCisternaSchedeTestPage.tsx:316-325` e `readNextCisternaSchedaDetail(editId, { includeCloneOverlays: false })` in `src/next/NextCisternaSchedeTestPage.tsx:359-383`. Il domain legge `@cisterna_schede_ia` in `src/next/domain/nextCisternaDomain.ts:573-613`, costruisce la lista schede in `src/next/domain/nextCisternaDomain.ts:803-840` e dettaglio edit in `src/next/domain/nextCisternaDomain.ts:842-888`.

La scrittura e' ancora bloccata da handler read-only: `handleBlockedAction`, `handleExtract`, `handleQuickTest` e `confirmBlockedSave` in `src/next/NextCisternaSchedeTestPage.tsx:579-630`, piu' i blocchi inline su `Precompila da Autisti`, `Salva ritaglio` e `Salva calibrazione` in `src/next/NextCisternaSchedeTestPage.tsx:806-815`, `:1118-1127`, `:1222-1230`.

Lo stack OpenAI riusabile esiste gia' per Cisterna Caravate principale: profilo `documento_cisterna` in `backend/internal-ai/server/internal-ai-document-extraction.js:1965-1972`, istruzioni in `backend/internal-ai/server/internal-ai-document-extraction.js:2224-2229`, dispatcher in `backend/internal-ai/server/internal-ai-document-extraction.js:2607-2652`, endpoint Express `/internal-ai-backend/documents/documento-cisterna-analyze` in `backend/internal-ai/server/internal-ai-adapter.js:1900-1984`, client NEXT in `src/next/nextCisternaIaClient.ts:3-166`, writer in `src/next/nextCisternaWriter.ts:13-64`.

La madre usa ancora Gemini per schede-test: endpoint `estrazioneSchedaCisterna` in `src/cisterna/iaClient.ts:10-11`, chiamata `callEstrattiSchedaCisternaCells` in `src/cisterna/iaClient.ts:246-308`, function `functions-schede/estrazioneSchedaCisterna.js:1-498` ed export in `functions-schede/index.js:5-8`. NEXT deve smettere di puntare a quel client legacy senza deprecare la function.

## 3. Pagina `/next/cisterna/schede-test` - interventi necessari

| CTA / UI | Riga NEXT | Handler attuale | Comportamento finale richiesto | Scrittura / IA | Writer / client | Deroga barriera |
| --- | --- | --- | --- | --- | --- | --- |
| `Apri/Modifica` | `src/next/NextCisternaSchedeTestPage.tsx:756-766` | `navigate(...)` gia' reale | Mantenere navigazione a `?edit=<id>&month=<mese>`; in edit rileggere detail reale dopo update | Nessuna scrittura all'apertura; update su conferma | `readNextCisternaSchedaDetail(editId, { includeCloneOverlays: false })` dopo update | Nessuna per apertura; `firestore.updateDoc` per conferma |
| `Precompila da Autisti (supporto)` | `src/next/NextCisternaSchedeTestPage.tsx:806-815` | inline `setManualError(...)` read-only | Replicare logica madre: leggere dataset supporto autisti gia' presente nello snapshot/domain, filtrare mese e `tipo === "caravate"`, riempire righe manuali locali | Nessuna scrittura Firestore; solo stato React | Nessun writer; usare `snapshot.archive.supportRefuels` o helper locale derivato dal domain `src/next/domain/nextCisternaDomain.ts:684-692` | Nessuna |
| `Conferma e salva` manuale, savebar | `src/next/NextCisternaSchedeTestPage.tsx:1521-1527` | `openManualConfirm` apre modale | Dopo modale, creare record nuovo in `@cisterna_schede_ia` con shape manuale madre | `firestore.addDoc` collection `@cisterna_schede_ia`; payload: `createdAt`, `source: "manual"`, `rowCount`, `rows`, `needsReview`, `yearMonth`, `fonte: "manual"`; niente `iaEngine` | `createNextCisternaSchedaRecord({ payload })` | `/next/cisterna/schede-test` + `firestore.addDoc` + `@cisterna_schede_ia` |
| `Conferma modifiche` manuale in edit | `src/next/NextCisternaSchedeTestPage.tsx:1456-1501`, `:1521-1527` | `confirmBlockedSave` blocca | Aggiornare record esistente e poi rileggere snapshot/detail senza overlay | `firestore.updateDoc` path `@cisterna_schede_ia/<schedaId>`; payload: `rows`, `rowCount`, `needsReview`, `yearMonth`, `updatedAt` | `updateNextCisternaSchedaRecord({ schedaId, payload })` | `/next/cisterna/schede-test` + `firestore.updateDoc` + `@cisterna_schede_ia/` |
| Upload file foto | `src/next/NextCisternaSchedeTestPage.tsx:1030-1037` | `handleFile` locale | Mantenere selezione e preview locale; nessun upload automatico al cambio file | Nessuna scrittura | Nessun writer | Nessuna |
| `Salva ritaglio` | `src/next/NextCisternaSchedeTestPage.tsx:1118-1127` | inline `setIaError(...)` read-only | Generare blob crop JPEG, caricare su Storage, salvare `fileUrl` e preview ritaglio | `storage.uploadBytes` su `documenti_pdf/cisterna_schede/<yyyy>/<mm>/<timestamp>_<safeName>_crop.jpg`; poi `getDownloadURL` | `uploadNextCisternaSchedaCropImage({ blob, storagePath })` | `/next/cisterna/schede-test` + `storage.uploadBytes` + `documenti_pdf/cisterna_schede/` |
| `Estrai da ritaglio` | `src/next/NextCisternaSchedeTestPage.tsx:1041-1047` | `handleExtract` blocca prima di IA | Full flow: validare foto/crop/calibrazione, assicurare crop salvato, generare celle data/targa/litri per riga, chiamare OpenAI, riempire `iaRows` | `fetch.runtime` verso OpenAI; eventuale `storage.uploadBytes` se il crop non e' stato ancora salvato | `uploadNextCisternaSchedaCropImage` + `extractCisternaSchedeCells` | `storage.uploadBytes` e `fetch.runtime` su endpoint schede |
| `Estrai rapido (senza upload)` | `src/next/NextCisternaSchedeTestPage.tsx:1048-1054` | `handleQuickTest` blocca | Eseguire solo estrazione locale+OpenAI senza upload Storage; utile per test visivo. Il salvataggio IA resta consentito solo dopo full flow con `fileUrl` disponibile | Solo `fetch.runtime`, nessuno Storage | `extractCisternaSchedeCells` | `/next/cisterna/schede-test` + `fetch.runtime` + `/internal-ai-backend/documents/scheda-cisterna-analyze` |
| `Conferma e salva` IA | `src/next/NextCisternaSchedeTestPage.tsx:1055-1061`, `:1456-1501` | `openIaConfirm` apre modale, poi `confirmBlockedSave` blocca | Salvare record IA nuovo con shape madre, `fileUrl`, `nomeFile`, `rawLines`, `summary`, `fonte: "IA"`, additivo `iaEngine: "openai-responses"` | `firestore.addDoc` collection `@cisterna_schede_ia` | `createNextCisternaSchedaRecord({ payload })` | `/next/cisterna/schede-test` + `firestore.addDoc` + `@cisterna_schede_ia` |
| `Conferma modifiche` IA in edit | `src/next/NextCisternaSchedeTestPage.tsx:1055-1061`, `:1456-1501` | `confirmBlockedSave` blocca | Aggiornare righe/stato review del record esistente; non riscrivere fileUrl se gia' presente e non necessario | `firestore.updateDoc` path `@cisterna_schede_ia/<schedaId>` | `updateNextCisternaSchedaRecord({ schedaId, payload })` | `/next/cisterna/schede-test` + `firestore.updateDoc` + `@cisterna_schede_ia/` |
| `Cancella calibrazione` | `src/next/NextCisternaSchedeTestPage.tsx:1152-1163` | reset locale incompleto, niente localStorage | Replicare madre: reset stato calibrazione e `localStorage.removeItem("cisterna_schede_calib_v1")` | Nessuna Firestore/Storage/fetch | Nessun writer | Nessuna, localStorage fuori barriera |
| `Salva calibrazione` | `src/next/NextCisternaSchedeTestPage.tsx:1222-1230` | inline `setIaError(...)` read-only | Replicare madre: validare 4 punti per data/targa/litri, payload `{ version: 1, columns: { data, targa, litri } }`, `localStorage.setItem(...)` | Nessuna Firestore/Storage/fetch | Nessun writer | Nessuna, localStorage fuori barriera |

Dopo ogni `addDoc` o `updateDoc` riuscito si deve ricaricare `readNextCisternaSnapshot(selectedMonth, { includeCloneOverlays: false })`; se `editId` e' presente si deve ricaricare anche `readNextCisternaSchedaDetail(editId, { includeCloneOverlays: false })`. I riferimenti gia' esistenti sono `src/next/NextCisternaSchedeTestPage.tsx:316-325` e `src/next/NextCisternaSchedeTestPage.tsx:359-383`.

## 4. Flusso IA da ritaglio

1. Caricamento immagine: mantenere `handleFile` NEXT, che accetta `image/*`, crea preview con `URL.createObjectURL` e inizializza `croppedPreview` in `src/next/NextCisternaSchedeTestPage.tsx:521-539`.
2. Crop locale: usare la logica gia' presente nella pagina NEXT per preview/crop e il riferimento madre `handleSaveCrop` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2084-2124`.
3. Upload Storage: il full flow deve caricare il blob crop con `uploadNextCisternaSchedaCropImage`. Il path deve restare `documenti_pdf/cisterna_schede/<yyyy>/<mm>/<timestamp>_<safeName>_crop.jpg`, come madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2100-2108`.
4. Calibrazione 4 punti prospettiva: replicare il payload madre su tre colonne `data`, `targa`, `litri`, ciascuna con 4 punti. La madre salva `{ version: 1, columns: { data, targa, litri } }` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1531-1547`.
5. Persistenza calibrazione: al mount leggere `localStorage.getItem("cisterna_schede_calib_v1")` come madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1149-1164`; su `Salva calibrazione` fare `localStorage.setItem` come `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1531-1547`; su `Cancella calibrazione` fare `localStorage.removeItem` come `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1502-1508`.
6. Generazione celle per riga: caricare immagine ritaglio, calcolare `rowCount`, bounds colonne `data/targa/litri`, e generare tre crop JPEG per ogni riga seguendo la madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1620-1684`.
7. Chiamata wrapper: passare a `extractCisternaSchedeCells` un array `{ rowIndex, dataImage, targaImage, litriImage }`. La conversione a base64 resta interna al wrapper secondo D13/D14.
8. Endpoint OpenAI: il wrapper posta a `/internal-ai-backend/documents/scheda-cisterna-analyze` il payload D9, non chiama `src/cisterna/iaClient.ts` e non usa `estrazioneSchedaCisterna`.
9. Ricezione envelope: il risultato deve rispettare D10 e la madre `functions-schede/estrazioneSchedaCisterna.js:131-149`.
10. Mapping UI: convertire ogni row `{ rowIndex, data_raw, targa_raw, litri_raw, data_status, targa_status, litri_status }` in `iaRows` NEXT, rispettando `RowStatus = "OK" | "INCERTO" | "VUOTO"` in `src/next/NextCisternaSchedeTestPage.tsx:15`, il tipo `IaRow` in `src/next/NextCisternaSchedeTestPage.tsx:27-36` e la normalizzazione campo in `src/next/NextCisternaSchedeTestPage.tsx:541-556`.
11. Modale riepilogo: `openIaConfirm` deve continuare ad aprire la modale esistente in `src/next/NextCisternaSchedeTestPage.tsx:603-616`, `:1456-1501`; cambia solo il salvataggio finale.
12. Save Firestore: `Conferma e salva` IA crea o aggiorna record con writer. I campi derivano da madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1780-1842`, `:1855-1887`, con additivo `iaEngine: "openai-responses"` solo su record IA.

`Estrai rapido (senza upload)` deve restare coerente con il nome: esegue i passi di calibrazione, generazione celle e chiamata OpenAI, ma non chiama `uploadNextCisternaSchedaCropImage`. Serve per prova veloce; per un salvataggio IA nuovo serve comunque avere `fileUrl` da full flow o da `Salva ritaglio`, coerente con il controllo madre `if (!isEditMode && !fileUrl)` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1785-1787`.

## 5. Backend OpenAI - nuovo profilo `scheda_cisterna`

File da modificare in implementazione:

- `backend/internal-ai/server/internal-ai-document-extraction.js`.
- `backend/internal-ai/server/internal-ai-adapter.js`.

Pattern di estensione:

- Aggiungere `scheda_cisterna` a `buildProviderSystemPrompt`, accanto ai profili esistenti in `backend/internal-ai/server/internal-ai-document-extraction.js:1907-1972`.
- Aggiungere user instructions per `scheda_cisterna` accanto al ramo `documento_cisterna` in `backend/internal-ai/server/internal-ai-document-extraction.js:2224-2229`.
- Estendere `extractInternalAiDocumentAnalysis` con un branch `profile === "scheda_cisterna"` accanto al branch `documento_cisterna` in `backend/internal-ai/server/internal-ai-document-extraction.js:2607-2652`.
- Il branch schede deve normalizzare `args.cells` prima del parsing binario generico, perche' il contratto D9 non invia un singolo `contentBase64` documento. Nel codice attuale `extractInternalAiDocumentAnalysis` calcola `effectiveContentBase64` e `Buffer.from(effectiveContentBase64, "base64")` in `backend/internal-ai/server/internal-ai-document-extraction.js:2537-2582`; il branch `scheda_cisterna` deve evitare dipendenza da PDF/testo e lavorare sul batch celle.

Schema input server D9:

```ts
{
  profile: "scheda_cisterna";
  cells: Array<{
    rowIndex: number;
    dataBase64: string;
    targaBase64: string;
    litriBase64: string;
  }>;
  providerRequired: true;
}
```

Schema output D10:

```ts
{
  ok: true;
  needsReview: boolean;
  rows: Array<{
    rowIndex: number;
    data_raw: string;
    targa_raw: string;
    litri_raw: string;
    data_status: "OK" | "INCERTO" | "VUOTO";
    targa_status: "OK" | "INCERTO" | "VUOTO";
    litri_status: "OK" | "INCERTO" | "VUOTO";
  }>;
  stats: {
    total: number;
    okRows: number;
    reviewRows: number;
  };
  rawText: string;
}
```

Prompt D11:

- Copiare 1:1 `PROMPT_CELLS` da `functions-schede/estrazioneSchedaCisterna.js:46-66`.
- L'unico adattamento ammesso e' provider mechanics: Gemini `inlineData` in `functions-schede/estrazioneSchedaCisterna.js:303-319` diventa OpenAI Responses `input_image` per data, targa e litri della singola cella.

Env vars:

- `OPENAI_API_KEY`, verificata da `isProviderConfigured` in `backend/internal-ai/server/internal-ai-adapter.js:402-403`.
- `INTERNAL_AI_OPENAI_MODEL`, default `gpt-5-mini` in `backend/internal-ai/server/internal-ai-adapter.js:374-379`.

Endpoint adapter:

- Aggiungere `app.post("/internal-ai-backend/documents/scheda-cisterna-analyze", ...)` in `backend/internal-ai/server/internal-ai-adapter.js`.
- Deve essere analogo strutturalmente all'endpoint documento Cisterna in `backend/internal-ai/server/internal-ai-adapter.js:1900-1984`.
- Validazioni minime: `profile === "scheda_cisterna"`, `cells` array non vuoto, ogni cella con `rowIndex` numerico e tre base64 string non vuote, provider configurato.
- Errori: usare envelope con `validation_error`, `provider_not_configured`, `upstream_error`, come endpoint documento Cisterna in `backend/internal-ai/server/internal-ai-adapter.js:1915-1971`, `:1999-2013`.
- Chiamare `extractInternalAiDocumentAnalysis({ profile: "scheda_cisterna", cells, providerClient, providerTarget, providerRequired: true })`.

## 6. Estensioni Writer NEXT

File da estendere: `src/next/nextCisternaWriter.ts`.

Import richiesti:

- `CISTERNA_SCHEDE_COLLECTION` da `src/cisterna/collections.ts:6`.
- `collection`, `doc`, `serverTimestamp` sono gia' usati o disponibili nel writer in `src/next/nextCisternaWriter.ts:1-9`.
- `addDoc`, `updateDoc` dai wrapper in `src/utils/firestoreWriteOps.ts:15-27`.
- `uploadBytes` dal wrapper in `src/utils/storageWriteOps.ts:20-25`.

Funzione 1:

```ts
export type NextCisternaSchedaRecordPayload = Record<string, unknown>;

export async function createNextCisternaSchedaRecord(args: {
  payload: NextCisternaSchedaRecordPayload;
}): Promise<{ id: string }>;
```

- Target: `collection(db, CISTERNA_SCHEDE_COLLECTION)`, dove `CISTERNA_SCHEDE_COLLECTION = "@cisterna_schede_ia"` in `src/cisterna/collections.ts:6`.
- Operazione: `addDoc`.
- Shape: nuova save madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1873-1887`, cioe' `createdAt`, `source`, `rowCount`, `rows`, `needsReview`, `yearMonth`, meta.
- Wrapper obbligatorio: `addDoc` da `src/utils/firestoreWriteOps.ts:15-19`.
- Nota IA: il chiamante aggiunge `iaEngine: "openai-responses"` solo se `fonte: "IA"`; manuale non deve avere `iaEngine`.

Funzione 2:

```ts
export async function updateNextCisternaSchedaRecord(args: {
  schedaId: string;
  payload: NextCisternaSchedaRecordPayload;
}): Promise<void>;
```

- Target: `doc(db, CISTERNA_SCHEDE_COLLECTION, args.schedaId)`.
- Operazione: `updateDoc`.
- Shape: edit madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1855-1867`, cioe' `rows`, `rowCount`, `needsReview`, `yearMonth`, `updatedAt`.
- Wrapper obbligatorio: `updateDoc` da `src/utils/firestoreWriteOps.ts:22-27`.
- Il payload deve includere `updatedAt: serverTimestamp()`.

Funzione 3:

```ts
export async function uploadNextCisternaSchedaCropImage(args: {
  blob: Blob;
  storagePath: string;
}): Promise<{ storagePath: string; fileUrl: string }>;
```

- Target: `ref(storage, args.storagePath)`.
- Operazione: `uploadBytes(storageReference, args.blob, { contentType: "image/jpeg" })`, poi `getDownloadURL(storageReference)`.
- Path: `documenti_pdf/cisterna_schede/<yyyy>/<mm>/<timestamp>_<safeName>_crop.jpg`.
- Riferimento madre: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2084-2124`, path esatto in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2100-2108`.
- Wrapper obbligatorio: `uploadBytes` da `src/utils/storageWriteOps.ts:20-25`.

## 7. Estensione Client IA NEXT

File da estendere: `src/next/nextCisternaIaClient.ts`.

Nuovi tipi:

```ts
export type CisternaSchedeCellInput = {
  rowIndex: number;
  dataImage: File | Blob;
  targaImage: File | Blob;
  litriImage: File | Blob;
};

export type CisternaSchedeExtractRow = {
  rowIndex: number;
  data_raw: string;
  targa_raw: string;
  litri_raw: string;
  data_status: "OK" | "INCERTO" | "VUOTO";
  targa_status: "OK" | "INCERTO" | "VUOTO";
  litri_status: "OK" | "INCERTO" | "VUOTO";
};

export type CisternaSchedeExtractResult = {
  ok: true;
  needsReview: boolean;
  rows: CisternaSchedeExtractRow[];
  stats: {
    total: number;
    okRows: number;
    reviewRows: number;
  };
  rawText: string;
};
```

Nuova funzione:

```ts
export async function extractCisternaSchedeCells(
  cells: Array<{
    rowIndex: number;
    dataImage: File | Blob;
    targaImage: File | Blob;
    litriImage: File | Blob;
  }>,
): Promise<CisternaSchedeExtractResult>;
```

Payload server:

```ts
{
  profile: "scheda_cisterna",
  cells: [
    {
      rowIndex,
      dataBase64,
      targaBase64,
      litriBase64
    }
  ],
  providerRequired: true
}
```

Vincoli:

- Endpoint: `/internal-ai-backend/documents/scheda-cisterna-analyze`.
- Base URL: stesso pattern di `src/next/nextCisternaIaClient.ts:32-45` e `src/next/internal-ai/internalAiServerChatClient.ts:13-29`; se `VITE_INTERNAL_AI_BACKEND_URL` e' valorizzato, usarlo senza slash finali; in localhost usare `INTERNAL_AI_SERVER_ADAPTER_PORT`; altrimenti throw.
- Conversione File/Blob -> base64 interna al wrapper, come `extractCisternaDocumentoFromPdf`/`extractCisternaDocumentoFromImage` in `src/next/nextCisternaIaClient.ts:142-164` e pattern immagini in `src/next/nextPreventivoIaClient.ts:130-146`.
- Errori: `throw new Error(...)`; nessun result discriminator `ok: boolean` lato wrapper. Il result riuscito e' l'envelope D10.
- Validazione output: se `rows` non e' array, se `stats` manca o se lo status non e' uno fra `OK`, `INCERTO`, `VUOTO`, lanciare errore "Risposta IA non valida. Riprova." o fallback coerente.
- Divieto: nessun import da `src/cisterna/iaClient.ts`, nessuna chiamata a `estrazioneSchedaCisterna`.

## 8. Deroghe `cloneWriteBarrier.ts`

Pattern di ancoraggio: deroghe Cisterna Caravate gia' presenti in `src/utils/cloneWriteBarrier.ts:384-407`, costanti in `src/utils/cloneWriteBarrier.ts:42-49`, fetch documenti in `src/utils/cloneWriteBarrier.ts:232-238`.

Deroga 1:

- Route: `/next/cisterna/schede-test`.
- Operazione: `firestore.addDoc`.
- Target: collection `@cisterna_schede_ia`.
- Motivazione: salvataggio nuovo record manuale o IA.
- Riga di ancoraggio: aggiungere vicino a `src/utils/cloneWriteBarrier.ts:384-407`.

Deroga 2:

- Route: `/next/cisterna/schede-test`.
- Operazione: `firestore.updateDoc`.
- Target: path prefix `@cisterna_schede_ia/`.
- Motivazione: conferma modifiche in edit manuale o IA.
- Riga di ancoraggio: aggiungere vicino a `src/utils/cloneWriteBarrier.ts:384-407`.

Deroga 3:

- Route: `/next/cisterna/schede-test`.
- Operazione: `storage.uploadBytes`.
- Target: path prefix `documenti_pdf/cisterna_schede/`.
- Motivazione: salvataggio ritaglio scheda carburante in Storage.
- Riga di ancoraggio: aggiungere vicino a `src/utils/cloneWriteBarrier.ts:384-407`.

Deroga 4:

- Route: `/next/cisterna/schede-test`.
- Operazione: `fetch.runtime`.
- Target: `/internal-ai-backend/documents/scheda-cisterna-analyze`.
- Motivazione: estrazione celle con profilo OpenAI `scheda_cisterna`.
- Riga di ancoraggio: aggiungere funzione fetch analoga a `isAllowedCisternaDocumentAnalyzeFetch` in `src/utils/cloneWriteBarrier.ts:232-238` e ramo nel blocco eccezioni vicino a `src/utils/cloneWriteBarrier.ts:405-407`.

Nota: la calibrazione su `localStorage` non richiede deroga, come stabilito da D17. I wrapper Firestore e Storage invocano la barriera in `src/utils/firestoreWriteOps.ts:15-35` e `src/utils/storageWriteOps.ts:20-25`.

## 9. Shape Firestore - parity con madre

Collection: `@cisterna_schede_ia`, dichiarata in `src/cisterna/collections.ts:6`.

| Campo | Tipo | Manuale | IA | Riga madre / note |
| --- | --- | --- | --- | --- |
| `createdAt` | `serverTimestamp()` | Si, create | Si, create | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1874-1876` |
| `source` | `"manual"` oppure `"ia"` | `"manual"` | `"ia"` | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1875-1877`; domain mostra `Manuale`/`IA` in `src/next/domain/nextCisternaDomain.ts:823-828` |
| `rowCount` | number | Si | Si | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1876-1878`; edit `:1857-1860` |
| `rows` | array righe | Si | Si | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1757-1764`, `:1813-1819`, `:1877-1879` |
| `needsReview` | boolean | Si | Si | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1766-1773`, `:1821-1828`, `:1878-1880` |
| `yearMonth` | string `YYYY-MM` | Si | Si | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1860-1862`, `:1879-1881` |
| `fonte` | `"manual"` oppure `"IA"` | `"manual"` | `"IA"` | manual meta in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1769-1777`; IA meta in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1829-1840` |
| `fileUrl` | string | No | Si su nuovo record IA | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1831-1834` |
| `nomeFile` | string/null | No | Si su nuovo record IA | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1831-1834` |
| `rawLines` | string[] | No | Si su nuovo record IA | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1834-1835`; NEXT calcola raw lines in `src/next/NextCisternaSchedeTestPage.tsx:464-470` |
| `summary.rowsExtracted` | number | No | Si | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1835-1837` |
| `summary.rowsWithIssues` | number | No | Si | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1835-1838`; NEXT conta problemi IA in `src/next/NextCisternaSchedeTestPage.tsx:455-463` |
| `updatedAt` | `serverTimestamp()` | Solo edit | Solo edit | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1857-1863` |
| `iaEngine` | `"openai-responses"` | No | Si, solo record fonte IA NEXT | Campo additivo ammesso da D18; `NON TROVATO IN REPO` nella madre perche' la madre resta Gemini |

Shape riga manuale:

| Campo riga | Tipo | Origine |
| --- | --- | --- |
| `data` | string | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1743-1758` |
| `targa` | string | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1744-1759` |
| `nome` | string | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1746-1760` |
| `azienda` | string normalizzata | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1747-1761` |
| `litri` | number/null | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1748-1762` |
| `statoRevisione` | `"verificato"` / `"da_verificare"` | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1753-1764` |

Shape riga IA:

| Campo riga | Tipo | Origine |
| --- | --- | --- |
| `data` | string | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1805-1814` |
| `targa` | string | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1806-1815` |
| `nome` | string vuota | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1813-1817` |
| `litri` | number/null | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1808-1817` |
| `statoRevisione` | `"verificato"` / `"da_verificare"` | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1811-1819` |

Path Storage invariato: `documenti_pdf/cisterna_schede/<yyyy>/<mm>/<timestamp>_<safeName>_crop.jpg`, derivato da `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2100-2108`.

## 10. CSS / UI

Nessun nuovo CSS.

Nessun nuovo prefisso.

Nessuna modifica visiva.

La pagina NEXT deve continuare a usare `../pages/CisternaCaravate/CisternaSchedeTest.css` importato in `src/next/NextCisternaSchedeTestPage.tsx:11`. Gli interventi sono solo riconnessione degli handler ai bottoni gia' presenti e sostituzione dei messaggi read-only con flussi reali.

## 11. Fasi di implementazione consigliate

Fase 1: estensione writer + deroghe barriera + scritture base manuale.

- File toccati: `src/next/nextCisternaWriter.ts`, `src/utils/cloneWriteBarrier.ts`, `src/next/NextCisternaSchedeTestPage.tsx`.
- Cosa: aggiungere 3 funzioni writer D15; aggiungere le 4 deroghe D17; collegare `Conferma e salva` manuale, `Apri/Modifica` edit gia' navigante, `Conferma modifiche` manuale.
- Gate: `npm run build` verde; `npx eslint` sui file toccati delta 0; refresh snapshot/detail post-write.

Fase 2: precompila da Autisti.

- File toccati: `src/next/NextCisternaSchedeTestPage.tsx`.
- Cosa: sostituire blocco inline su `Precompila da Autisti (supporto)` con logica locale che usa i support rows gia' letti dal domain; nessuna scrittura Firestore.
- Gate: build verde; lint delta 0; nessuna nuova deroga.

Fase 3: backend profilo `scheda_cisterna` + endpoint adapter.

- File toccati: `backend/internal-ai/server/internal-ai-document-extraction.js`, `backend/internal-ai/server/internal-ai-adapter.js`.
- Cosa: prompt D11, schema input D9, output D10, endpoint `/internal-ai-backend/documents/scheda-cisterna-analyze`.
- Gate: se presenti script backend build/lint, eseguirli; altrimenti `node --check` sui due file; nessuna route condivisa in `internalAiServerPersistenceContracts.ts`.

Fase 4: estensione client IA.

- File toccati: `src/next/nextCisternaIaClient.ts`.
- Cosa: aggiungere tipi schede e `extractCisternaSchedeCells`; conversione Blob/File -> base64 interna; POST a endpoint D8.
- Gate: build verde; lint delta 0; grep che non ci siano import da `src/cisterna/iaClient.ts`.

Fase 5: flusso IA ritaglio + calibrazione persistente.

- File toccati: `src/next/NextCisternaSchedeTestPage.tsx`.
- Cosa: collegare `Salva ritaglio`, `Estrai da ritaglio`, `Estrai rapido`, `Conferma e salva` IA; replicare localStorage D16; mapping envelope D10 su `iaRows`.
- Gate: build verde; lint delta 0; refresh snapshot/detail dopo save.

Fase 6: verifica finale.

- File toccati: nessuno oltre quelli gia' previsti.
- Gate: `npm run build` verde; `npx eslint` sui file toccati delta 0; grep sicurezza:
  - nessun `handleBlockedAction` residuo in `src/next/NextCisternaSchedeTestPage.tsx`;
  - nessun testo read-only bloccante residuo per schede-test;
  - nessun riferimento runtime a `estrazioneSchedaCisterna` o `src/cisterna/iaClient.ts` sotto `src/next`;
  - quattro deroghe schede-test presenti in `src/utils/cloneWriteBarrier.ts`.
- Test browser pending utente: caricamento immagine, crop, calibrazione, estrazione, save manuale, save IA, edit.

## 12. Test manuale di accettazione (10-point checklist NEXT)

1. Aprire `/next/cisterna/schede-test` e verificare che UI, tab e archivio siano invariati rispetto a prima della patch.
2. Selezionare un mese, usare `Precompila da Autisti (supporto)` e verificare che le righe locali vengano popolate dai support refuels del mese senza scrivere Firestore.
3. Compilare una scheda manuale nuova e premere `Conferma e salva`: deve creare un record in `@cisterna_schede_ia` con `source: "manual"`, `fonte: "manual"`, senza `iaEngine`.
4. Aprire una scheda con `Apri/Modifica`, cambiare righe e premere `Conferma modifiche`: deve aggiornare `rows`, `rowCount`, `needsReview`, `yearMonth`, `updatedAt` e ricaricare snapshot/detail reali.
5. Caricare immagine, fare ritaglio e premere `Salva ritaglio`: deve caricare in `documenti_pdf/cisterna_schede/<yyyy>/<mm>/..._crop.jpg` e valorizzare `fileUrl`.
6. Calibrare colonne, premere `Salva calibrazione`, ricaricare la pagina e verificare che la calibrazione venga ripristinata da `localStorage` key `cisterna_schede_calib_v1`.
7. Premere `Cancella calibrazione`, ricaricare la pagina e verificare che la calibrazione non venga ripristinata.
8. Premere `Estrai da ritaglio`: deve chiamare `/internal-ai-backend/documents/scheda-cisterna-analyze`, riempire `iaRows`, mostrare status `OK/INCERTO/VUOTO` e aprire il salvataggio IA solo se ci sono righe.
9. Salvare una scheda IA nuova: il record deve avere shape madre, `fonte: "IA"`, `source: "ia"`, `iaEngine: "openai-responses"`, `fileUrl`, `nomeFile`, `rawLines`, `summary`.
10. Verificare barriera: tutte le scritture passano solo dalle 4 deroghe D17; nessuna chiamata diretta Firebase bypassa `firestoreWriteOps` o `storageWriteOps`.

## 13. Out of scope esplicito

- Madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`.
- Madre `src/cisterna/iaClient.ts`.
- Function Gemini `functions-schede/estrazioneSchedaCisterna.js`, che resta deployata.
- `functions-schede/index.js`.
- Modifiche a `src/next/domain/nextCisternaDomain.ts`.
- Redesign UI, nuovo CSS, nuovi prefissi.
- Altre route Cisterna gia' chiuse: `/next/cisterna`, `/next/cisterna/ia`.
- Qualsiasi route madre sotto `/cisterna/*`.

## 14. Tracciabilita'

- Route NEXT schede-test: `src/App.tsx:545-550`; costante route `src/next/nextStructuralPaths.ts:35`.
- Pagina NEXT schede-test: `src/next/NextCisternaSchedeTestPage.tsx:1-1532`.
- CSS madre riusato: `src/next/NextCisternaSchedeTestPage.tsx:11`.
- Lettura snapshot/detail senza overlay: `src/next/NextCisternaSchedeTestPage.tsx:316-325`, `:359-383`.
- Handler bloccanti NEXT: `src/next/NextCisternaSchedeTestPage.tsx:579-630`.
- CTA principali NEXT: `src/next/NextCisternaSchedeTestPage.tsx:756-766`, `:806-815`, `:1041-1061`, `:1118-1127`, `:1152-1163`, `:1222-1230`, `:1456-1501`, `:1521-1527`.
- Madre schede-test: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1-3238`.
- Calibrazione madre: key `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:95`; get `:1149-1164`; remove `:1502-1508`; set `:1531-1547`.
- Flusso IA madre: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1597-1715`.
- Save manuale madre: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1722-1778`.
- Save IA madre: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1780-1842`.
- Conferma save madre add/update: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1844-1894`.
- Precompila Autisti madre: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1974-2074`.
- Upload crop madre: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2084-2124`.
- Client legacy schede: endpoint `src/cisterna/iaClient.ts:10-11`; chiamata `src/cisterna/iaClient.ts:246-308`.
- Function Gemini schede: prompt `functions-schede/estrazioneSchedaCisterna.js:46-66`; row/output `:115-149`; provider Gemini `:294-354`; mode cells `:417-447`; export `:495-496`.
- Export v2 function: `functions-schede/index.js:5-8`.
- Collection Cisterna: `src/cisterna/collections.ts:5-9`.
- Domain schede: tipi `src/next/domain/nextCisternaDomain.ts:37-56`, `:115-144`; letture `:564-613`; support rows `:684-692`; build schede `:803-840`; detail `:842-888`; snapshot `:1240-1274`.
- Writer Cisterna attuale: `src/next/nextCisternaWriter.ts:1-65`.
- Client Cisterna OpenAI attuale: `src/next/nextCisternaIaClient.ts:1-166`.
- Base URL chat pattern: `src/next/internal-ai/internalAiServerChatClient.ts:13-29`; helper base URL riusabile `src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts:12-28`.
- Pattern preventivo immagini: `src/next/nextPreventivoIaClient.ts:130-146`.
- Wrapper Firestore: `src/utils/firestoreWriteOps.ts:15-35`.
- Wrapper Storage: `src/utils/storageWriteOps.ts:20-25`.
- Barriera Cisterna esistente: `src/utils/cloneWriteBarrier.ts:42-49`, `:202-207`, `:232-238`, `:384-407`.
- Backend OpenAI provider target/env: `backend/internal-ai/server/internal-ai-adapter.js:374-379`, `:402-412`.
- Backend profili documentali esistenti: `backend/internal-ai/server/internal-ai-document-extraction.js:1907-1972`.
- Backend documento Cisterna prompt/instructions/dispatcher: `backend/internal-ai/server/internal-ai-document-extraction.js:1965-1972`, `:2224-2229`, `:2607-2652`.
- Backend endpoint documento Cisterna: `backend/internal-ai/server/internal-ai-adapter.js:1900-1984`.
- Profilo `scheda_cisterna`: `NON TROVATO IN REPO`, da creare.
- Endpoint `/internal-ai-backend/documents/scheda-cisterna-analyze`: `NON TROVATO IN REPO`, da creare.
- Deroghe `/next/cisterna/schede-test`: `NON TROVATO IN REPO`, da creare.

## 15. Blocchi decisionali

0 blocchi aperti
