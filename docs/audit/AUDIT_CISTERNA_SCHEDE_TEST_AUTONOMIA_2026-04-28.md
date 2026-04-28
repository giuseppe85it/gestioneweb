# AUDIT CISTERNA SCHEDE TEST AUTONOMIA 2026-04-28

Audit di sola lettura di `/next/cisterna/schede-test`.

## 0. Snapshot ambiente

- HEAD: `e9c7fabdd2e9898bbab016dbf04162aae7f09cf3`.
- Branch: `master`.
- Stato git: branch avanti di 1 commit rispetto a `origin/master`; worktree gia' sporco prima dell'audit con modifiche non staged in `backend/internal-ai/server/internal-ai-adapter.js`, `backend/internal-ai/server/internal-ai-document-extraction.js`, `src/next/NextCentroControlloPage.tsx`, `src/next/NextCisternaIAPage.tsx`, `src/next/NextCisternaPage.tsx`, `src/utils/cloneWriteBarrier.ts`, piu' file `.bak.20260428.cisterna`, `src/next/nextCisternaIaClient.ts`, `src/next/nextCisternaWriter.ts` e backup sidebar.
- Node: `v20.20.0`.
- npm: `10.8.2`.
- Mappa schede NEXT: `src/next/NextCisternaSchedeTestPage.tsx` presente in `src/next` e route costante `NEXT_CISTERNA_SCHEDE_TEST_PATH = "/next/cisterna/schede-test"` in `src/next/nextStructuralPaths.ts:35`.
- Function Gemini schede madre: `functions-schede/estrazioneSchedaCisterna.js` e export `estrazioneSchedaCisterna` in `functions-schede/index.js:5-8`.
- Precedente Cisterna Caravate OpenAI: profilo `documento_cisterna` presente in `backend/internal-ai/server/internal-ai-document-extraction.js:44-70`, `:1965-1972`, `:2224-2229`, `:2607-2652`; endpoint Express `/internal-ai-backend/documents/documento-cisterna-analyze` presente in `backend/internal-ai/server/internal-ai-adapter.js:1900-1984`; client `src/next/nextCisternaIaClient.ts:3-166`; writer `src/next/nextCisternaWriter.ts:13-64`.

## 1. Stato attuale `/next/cisterna/schede-test`

- Mount route: sotto router NEXT, `path="cisterna/schede-test"` monta `NextCisternaSchedeTestPage` dentro `NextRoleGuard areaId="cisterna"` in `src/App.tsx:545-550`.
- Wrapper UI: la pagina importa CSS madre `../pages/CisternaCaravate/CisternaSchedeTest.css` in `src/next/NextCisternaSchedeTestPage.tsx:11`; non usa `NextClonePageScaffold` in `src/next/NextCisternaSchedeTestPage.tsx` (`NON TROVATO IN REPO` per import o JSX del scaffold).
- Lettura dati principale: `readNextCisternaSnapshot(selectedMonth || requestedMonth || undefined, { includeCloneOverlays: false })` in `src/next/NextCisternaSchedeTestPage.tsx:316-325`.
- Lettura dettaglio edit: `readNextCisternaSchedaDetail(editId, { includeCloneOverlays: false })` in `src/next/NextCisternaSchedeTestPage.tsx:359-383`.
- Dataset letti dal domain: `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`, `@rifornimenti_autisti_tmp` dichiarati in `src/next/domain/nextCisternaDomain.ts:70-80`; schede lette da `getDocs(collection(db, CISTERNA_SCHEDE_COLLECTION))` in `src/next/domain/nextCisternaDomain.ts:573-582`; autisti letti da `getDoc(doc(db, "storage", RIFORNIMENTI_AUTISTI_KEY))` in `src/next/domain/nextCisternaDomain.ts:564-570`; snapshot aggregato in `src/next/domain/nextCisternaDomain.ts:1240-1251`.

CTA / pulsanti visibili:

| Testo UI | Handler NEXT attuale | Comportamento NEXT attuale | Riga NEXT | Madre equivalente |
| --- | --- | --- | --- | --- |
| Logo | `navigate("/next/centro-controllo")` | Navigazione locale NEXT | `src/next/NextCisternaSchedeTestPage.tsx:640-643` | Madre usa navigazioni Cisterna/madre nella header, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2151-2162` |
| `Annulla` header edit | `navigate(cisternaPath)` | Naviga a `/next/cisterna?...` | `src/next/NextCisternaSchedeTestPage.tsx:656-659` | Madre `navigate(cisternaPath)`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2152-2155` |
| `Torna a Cisterna` | `navigate(cisternaPath)` | Naviga a pagina principale NEXT | `src/next/NextCisternaSchedeTestPage.tsx:661-663` | Madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2157-2159` |
| `IA Cisterna` | `navigate(cisternaIaPath)` | Naviga a `/next/cisterna/ia?...` | `src/next/NextCisternaSchedeTestPage.tsx:664-666` | Madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2160-2162` |
| `Mese scheda` select | `handleMonthChange` | Cambia mese e, se in edit, riscrive query string; nessuna scrittura | `src/next/NextCisternaSchedeTestPage.tsx:477-483`, `:670-685` | Madre `handleYearMonthChange`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:872`, UI `:2166-2181` |
| `EDIT MODE` | badge, nessun handler | Solo stato visivo da query `edit` | `src/next/NextCisternaSchedeTestPage.tsx:688-706` | Madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2184-2197` |
| `Apri/Modifica` | `navigate("/next/cisterna/schede-test?edit=...")` | Apre dettaglio reale in sola lettura/modifica locale | `src/next/NextCisternaSchedeTestPage.tsx:756-766` | Madre apre edit e poi puo' salvare update, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1057-1142`, `:1844-1867` |
| `Inserimento manuale` | `setMode("manual")` | Cambia tab locale | `src/next/NextCisternaSchedeTestPage.tsx:776-784` | Madre `handleModeChange("manual")`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2199-2206` |
| `Da foto (IA)` | `setMode("ia")` | Cambia tab locale | `src/next/NextCisternaSchedeTestPage.tsx:786-795` | Madre `handleModeChange("ia")`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2207-2213` |
| `Precompila da Autisti (supporto)` | inline `setManualError(...)` | Bloccato read-only; non legge direttamente Autisti e non precompila | `src/next/NextCisternaSchedeTestPage.tsx:806-815` | Madre `handlePrefillFromAutisti`, legge `storage/@rifornimenti_autisti_tmp` e compila righe locali, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1974-2074`, UI `:2224-2233` |
| `Aggiungi riga` | `addManualRow` | Scrive solo stato React locale | `src/next/NextCisternaSchedeTestPage.tsx:493-496`, `:817-819` | Madre aggiunge riga locale, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2234-2240` |
| `Oggi` | `updateManualRow(...data oggi...)` | Scrive solo stato React locale | `src/next/NextCisternaSchedeTestPage.tsx:878-887` | Madre comportamento locale analogo, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2336-2346` |
| `Ieri` | `updateManualRow(...data ieri...)` | Scrive solo stato React locale | `src/next/NextCisternaSchedeTestPage.tsx:888-899` | Madre comportamento locale analogo, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2347-2359` |
| `Rimuovi` | `removeManualRow` | Scrive solo stato React locale | `src/next/NextCisternaSchedeTestPage.tsx:498-501`, `:1015-1017` | Madre rimuove riga locale, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2493-2499` |
| `Estrai da ritaglio` | `handleExtract` | Bloccato: mostra messaggio read-only, nessun upload e nessuna IA | `src/next/NextCisternaSchedeTestPage.tsx:583-590`, UI `:1041-1047` | Madre genera celle da crop e chiama Gemini `callEstrattiSchedaCisternaCells`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1597-1715`, UI `:2606-2613` |
| `Estrai rapido (senza upload)` | `handleQuickTest` | Bloccato: nessuna chiamata IA | `src/next/NextCisternaSchedeTestPage.tsx:593-600`, UI `:1048-1054` | Madre delega a `handleExtract`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2076-2082`, UI `:2614-2620` |
| `Conferma e salva` / `Salva modifiche` in tab IA | `openIaConfirm` | Apre modale riepilogo se esistono righe IA, ma non salva | `src/next/NextCisternaSchedeTestPage.tsx:603-616`, UI `:1055-1061` | Madre valida e prepara pending save reale, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1780-1842`, UI `:2621-2631` |
| `Annulla` tab IA | `resetIaLocalState` | Reset stato locale | `src/next/NextCisternaSchedeTestPage.tsx:559-577`, UI `:1062-1064` | Madre `handleReset`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1940-1956`, UI `:2632-2639` |
| `Adatta alla tabella` | `setCroppedPreview(previewUrl)` | Stato locale preview; non crop reale persistito | `src/next/NextCisternaSchedeTestPage.tsx:1115-1117` | Madre `handleFitCrop`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1471-1484`, UI `:2765-2767` |
| `Salva ritaglio` | inline `setIaError(...)` | Bloccato read-only; nessun Storage upload | `src/next/NextCisternaSchedeTestPage.tsx:1118-1127` | Madre `handleSaveCrop`, upload Storage `documenti_pdf/cisterna_schede/...`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2084-2124`, UI `:2768-2774` |
| `Calibra colonne (prospettiva)` | set stati calibrazione | Solo stato locale | `src/next/NextCisternaSchedeTestPage.tsx:1141-1151` | Madre `startCalibration`, UI `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2785-2787` |
| `Cancella calibrazione` | reset stati calibrazione | Solo stato locale; non chiama localStorage | `src/next/NextCisternaSchedeTestPage.tsx:1152-1163` | Madre `clearCalibration` rimuove localStorage key, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1502-1508`, UI `:2788-2790` |
| `Mostra griglia` | `setShowGrid` | Stato locale | `src/next/NextCisternaSchedeTestPage.tsx:1164-1174` | Madre stato locale, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2791-2798` |
| `Annulla ultimo punto` | decrementa step/flag locali | Stato locale | `src/next/NextCisternaSchedeTestPage.tsx:1190-1200` | Madre `undoLastPoint`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2814-2821` |
| `Reset colonna` | reset flag locale | Stato locale, implementazione NEXT non equivalente alla madre per punti colonna | `src/next/NextCisternaSchedeTestPage.tsx:1201-1210` | Madre `resetCurrentColumn`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1515-1518`, UI `:2822-2824` |
| `Reset tutto` | reset flag locale | Stato locale, implementazione NEXT non equivalente alla madre per punti colonna | `src/next/NextCisternaSchedeTestPage.tsx:1211-1221` | Madre `resetAllCalibration`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1510-1513`, UI `:2825-2827` |
| `Salva calibrazione` | inline `setIaError(...)` | Bloccato read-only; non salva localStorage | `src/next/NextCisternaSchedeTestPage.tsx:1222-1230` | Madre `saveCalibration`, `localStorage.setItem("cisterna_schede_calib_v1", ...)`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1531-1547`, UI `:2828-2830` |
| `Avanza nella preview` | incrementa step locale | Stato locale | `src/next/NextCisternaSchedeTestPage.tsx:1232-1245` | Madre non ha testo equivalente trovato nello snippet UI; avanzamento avviene da click/punti calibrazione (`NON TROVATO IN REPO` come label madre) |
| Thumbnail riga | `setActivePreview(...)` | Apre modale preview locale | `src/next/NextCisternaSchedeTestPage.tsx:1401-1412` | Madre usa `activeCell` per preview celle, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:3070-3081` |
| `Chiudi` modale preview | `setActivePreview(null)` | Chiude modale locale | `src/next/NextCisternaSchedeTestPage.tsx:1439-1452` | Madre modale preview analoga, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:NON TROVATO IN REPO` nello snippet letto |
| `Chiudi` modale riepilogo | `setPendingSave(null)` | Chiude modale locale | `src/next/NextCisternaSchedeTestPage.tsx:1456-1469` | Madre modale riepilogo con salvataggio reale, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:3180-3200` |
| `Annulla` modale riepilogo | `setPendingSave(null)` | Chiude senza scrivere | `src/next/NextCisternaSchedeTestPage.tsx:1491-1498` | Madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:3182-3189` |
| `Conferma modifiche` / `Conferma e salva` modale | `confirmBlockedSave` | Bloccato read-only; non scrive Firestore | `src/next/NextCisternaSchedeTestPage.tsx:618-630`, UI `:1499-1501` | Madre `confirmSave`, `addDoc` o `updateDoc` su `@cisterna_schede_ia`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1844-1894`, UI `:3190-3200` |
| `Conferma e salva` savebar manuale | `openManualConfirm` | Apre modale solo se valido; non salva finche' conferma, poi blocco | `src/next/NextCisternaSchedeTestPage.tsx:503-519`, UI `:1521-1527` | Madre `handleSaveManual` + `confirmSave`, `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1722-1778`, `:1844-1894` |

Stato attuale di scrittura:

- La pagina dichiara esplicitamente blocco read-only in UI: `src/next/NextCisternaSchedeTestPage.tsx:648-651`.
- `handleBlockedAction` e i blocchi IA/save sono in `src/next/NextCisternaSchedeTestPage.tsx:579-630`.
- `NextClonePageScaffold` non e' usato nella pagina (`NON TROVATO IN REPO` in `src/next/NextCisternaSchedeTestPage.tsx`).
- `upsertNextCisternaCloneScheda` esiste in `src/next/nextCisternaCloneState.ts:138-141`, ma non e' importato o chiamato da `src/next/NextCisternaSchedeTestPage.tsx` (`NON TROVATO IN REPO` nella pagina).
- Il domain puo' leggere overlay clone da `readNextCisternaCloneSchede()` in `src/next/domain/nextCisternaDomain.ts:595-605`, ma la pagina usa `includeCloneOverlays: false` sia per snapshot sia per detail (`src/next/NextCisternaSchedeTestPage.tsx:322-325`, `:371-373`).

## 2. Madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`

Scritture Firestore reali:

| Op | Collection / doc | Shape minima | Riga sorgente |
| --- | --- | --- | --- |
| `updateDoc` | `@cisterna_schede_ia/<editDocId>` tramite `doc(db, CISTERNA_SCHEDE_COLLECTION, editDocId)` | `{ rows, rowCount, needsReview, yearMonth, updatedAt: serverTimestamp() }` | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1855-1867` |
| `addDoc` | `@cisterna_schede_ia` tramite `collection(db, CISTERNA_SCHEDE_COLLECTION)` | `{ createdAt: serverTimestamp(), source, rowCount, rows, needsReview, yearMonth, ...meta }` | `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1873-1887` |

Shape righe e meta:

- Manuale: rows con `{ data, targa, nome, azienda, litri, statoRevisione }`, meta `{ fonte: "manual" }` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1743-1777`.
- IA: rows con `{ data, targa, nome: "", litri, statoRevisione }`; meta edit `{ fonte: "IA" }`; meta new `{ fileUrl, nomeFile, rawLines, summary: { rowsExtracted, rowsWithIssues }, fonte: "IA" }` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1805-1841`.

Upload Storage reali:

- `uploadBytes` su path `documenti_pdf/cisterna_schede/<yyyy>/<mm>/<timestamp>_<safeName>_crop.jpg`, poi `getDownloadURL`, in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2093-2110`.
- Path esatto costruito in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2100-2105`.

Invocazioni IA Gemini:

- Client madre importato: `callEstrattiSchedaCisternaCells` da `../../cisterna/iaClient` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:37`.
- Endpoint legacy nel client: `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneSchedaCisterna` in `src/cisterna/iaClient.ts:10-11`.
- Payload da UI: celle per riga `{ rowIndex, data_b64, targa_b64, litri_b64 }` piu' `meta: { source: "schede-carburante", rows: rowCount }` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1688-1696`.
- Wrapper client invia `POST` con `{ mode: "cells", ...input }` in `src/cisterna/iaClient.ts:246-263`.
- Output atteso dal client: envelope con `ok/success`, `needsReview`, `rows`, `rawText`, normalizzato in `src/cisterna/iaClient.ts:265-308`.
- Output consumato dalla pagina: `rows` con campi `data_raw`, `targa_raw`, `litri_raw`, status `data_status`, `targa_status`, `litri_status`, e note/flags; mapping in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1294-1340`.

Side effect non-Firestore:

- `localStorage.getItem("cisterna_schede_calib_v1")` per caricare calibrazione in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1149-1164`.
- `localStorage.removeItem("cisterna_schede_calib_v1")` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1502-1508`.
- `localStorage.setItem("cisterna_schede_calib_v1", JSON.stringify(payload))` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1531-1547`.
- PDF export: `NON TROVATO IN REPO` in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` per `jsPDF`, `autoTable`, `pdf.save`.

## 3. Function Gemini schede madre

- Path file: `functions-schede/estrazioneSchedaCisterna.js`.
- Nome export effettivo v2: `exports.estrazioneSchedaCisterna = onRequest(...)` in `functions-schede/index.js:5-8`.
- Export diretto legacy nello stesso file: `exports.estrazioneSchedaCisternaHandler` e `exports.estrazioneSchedaCisterna = functions.https.onRequest(...)` in `functions-schede/estrazioneSchedaCisterna.js:495-496`.
- Modello Gemini: `gemini-2.5-pro` in commento e costante `MODEL_NAME` in `functions-schede/estrazioneSchedaCisterna.js:1-4`, `:69-72`.
- API key Gemini letta da Firestore admin `@impostazioni_app/gemini` in `functions-schede/estrazioneSchedaCisterna.js:16-24`.
- Prompt row generico `PROMPT_SCHEDA_CISTERNA`: tre immagini DATA/TARGA/LITRI, risposta JSON array con `data_raw`, `targa_raw`, `litri_raw`, regole di trascrizione senza normalizzare in `functions-schede/estrazioneSchedaCisterna.js:27-44`.
- Prompt cells `PROMPT_CELLS`: tre immagini distinte, risposta JSON oggetto con `data_raw`, `targa_raw`, `litri_raw`, usa `INCERTO` o vuoto; regole targa/litri in `functions-schede/estrazioneSchedaCisterna.js:46-66`.
- Schema input mode `cells`: body `{ mode: "cells", cells: [...] }`, validazione `Array.isArray(cells)` in `functions-schede/estrazioneSchedaCisterna.js:417-430`; ogni cella usa `data_b64`, `targa_b64`, `litri_b64` in `functions-schede/estrazioneSchedaCisterna.js:294-311`.
- Schema input mode rows: body `{ rows: [...] }` o mode `cells_v1`; usa `dataImg`, `targaImg`, `litriImg` in `functions-schede/estrazioneSchedaCisterna.js:201-226`, validazione `functions-schede/estrazioneSchedaCisterna.js:450-463`.
- Output normalizzato cells: `{ ok: true, needsReview, rows, stats: { total, okRows, reviewRows }, rawText }` in `functions-schede/estrazioneSchedaCisterna.js:131-149`.
- Row cells normalizzata: `{ rowIndex, data_raw, targa_raw, litri_raw, data_status, targa_status, litri_status }` in `functions-schede/estrazioneSchedaCisterna.js:115-128`.
- Output normalizzato rows: `{ ok: true, needsReview, rows, stats, rawText }` in `functions-schede/estrazioneSchedaCisterna.js:178-191`; row estesa in `functions-schede/estrazioneSchedaCisterna.js:152-175`.
- Side effect interni: lettura Firestore admin per API key, chiamate HTTP Gemini, log `console.log`/`console.error` in `functions-schede/estrazioneSchedaCisterna.js:18-24`, `:236-243`, `:321-328`, `:435-443`, `:476-483`. Scritture Firestore o Storage nella function: `NON TROVATO IN REPO`.
- Funzione `fetchFileBase64(fileUrl)` definita con fetch e sharp in `functions-schede/estrazioneSchedaCisterna.js:371-399`, ma non chiamata nel file (`NON TROVATO IN REPO` oltre alla definizione).

## 4. Domain `nextCisternaDomain.ts` - parte schede

- Tipi scheda interni: `CisternaSchedaRow` e `CisternaSchedaDoc` in `src/next/domain/nextCisternaDomain.ts:37-56`.
- Tipi esportati usati dalla pagina: `NextCisternaSchedaItem` in `src/next/domain/nextCisternaDomain.ts:115-122`, `NextCisternaSchedaDetailRow` in `:124-133`, `NextCisternaSchedaDetail` in `:135-144`, `NextCisternaSnapshot` con `archive.schede` in `:168-193`.
- `readSchede(includeCloneOverlays = true)`: legge `@cisterna_schede_ia` con `getDocs(collection(db, CISTERNA_SCHEDE_COLLECTION))`, ordina, e opzionalmente aggiunge overlay clone; `src/next/domain/nextCisternaDomain.ts:573-613`.
- `buildSchedeMonthItems(schede, selectedMonth)`: filtra per mese e produce archivio schede; `src/next/domain/nextCisternaDomain.ts:803-840`.
- `readNextCisternaSchedaDetail(schedaId, options?)`: firma e lettura detail in `src/next/domain/nextCisternaDomain.ts:842-852`, mapping righe in `:870-888`.
- `readNextCisternaSnapshot(monthInput?, options?)`: legge documenti, rifornimenti, schede, parametri in parallelo e include `schedeItems`; `src/next/domain/nextCisternaDomain.ts:1240-1274`.
- Supporto autisti: `readRefuels()` legge `storage/@rifornimenti_autisti_tmp` in `src/next/domain/nextCisternaDomain.ts:564-570`; `buildSupportRows` usa `CISTERNA_REFUEL_TAG` in `src/next/domain/nextCisternaDomain.ts:647-692`.

Gap writer:

- Serve writer `addDoc` su `@cisterna_schede_ia` con shape madre new save: `createdAt`, `source`, `rowCount`, `rows`, `needsReview`, `yearMonth`, meta manuale/IA; madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1873-1887`.
- Serve writer `updateDoc` su `@cisterna_schede_ia/<id>` con `rows`, `rowCount`, `needsReview`, `yearMonth`, `updatedAt`; madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1855-1867`.
- Serve writer Storage `uploadBytes` + `getDownloadURL` per `documenti_pdf/cisterna_schede/<yyyy>/<mm>/<timestamp>_<safeName>_crop.jpg`; madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2093-2110`.
- Serve eventuale wrapper local calibration se si vuole replicare la persistenza madre `localStorage` per `cisterna_schede_calib_v1`; madre `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1502-1547`.
- Nessun writer reale per schede e' presente in `src/next/nextCisternaWriter.ts:13-64`; il writer attuale copre parametri mensili, duplicati documenti, upload documenti e record documenti IA.

## 5. Barriera scritture

Deroghe Cisterna gia' presenti dopo SPEC Cisterna Caravate:

1. Route `/next/cisterna`, op `firestore.setDoc`, target path prefix `@cisterna_parametri_mensili/`: `src/utils/cloneWriteBarrier.ts:42-47`, `:202-207`, `:384-387`.
2. Route `/next/cisterna`, op `firestore.updateDoc`, target path prefix `@documenti_cisterna/`: `src/utils/cloneWriteBarrier.ts:45-47`, `:384-391`.
3. Route `/next/cisterna/ia`, op `storage.uploadBytes`, target path prefix `documenti_pdf/cisterna/`: `src/utils/cloneWriteBarrier.ts:43-49`, `:396-399`.
4. Route `/next/cisterna/ia`, op `firestore.addDoc`, target collection `@documenti_cisterna`: `src/utils/cloneWriteBarrier.ts:43-49`, `:401-403`.
5. Route `/next/cisterna/ia`, op `fetch.runtime`, target `/internal-ai-backend/documents/documento-cisterna-analyze`: `src/utils/cloneWriteBarrier.ts:48-49`, `:232-238`, `:405-407`.

Deroghe mancanti per schede-test:

1. Route `/next/cisterna/schede-test`, op `firestore.addDoc`, target collection `@cisterna_schede_ia`.
2. Route `/next/cisterna/schede-test`, op `firestore.updateDoc`, target path prefix `@cisterna_schede_ia/`.
3. Route `/next/cisterna/schede-test`, op `storage.uploadBytes`, target path prefix `documenti_pdf/cisterna_schede/`.
4. Route `/next/cisterna/schede-test`, op `fetch.runtime`, target endpoint OpenAI schede da definire; endpoint attuale Gemini e' `estrazioneSchedaCisterna` in `src/cisterna/iaClient.ts:10-11`, ma va dismesso per NEXT.
5. Route `/next/cisterna/schede-test`, op `storageSync.setItemSync` o equivalente localStorage, target key `cisterna_schede_calib_v1`, solo se la persistenza calibrazione locale madre deve essere replicata sotto barriera; key madre in `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:95`, side effect in `:1502-1547`.

## 6. Pattern di reuse dal precedente Cisterna Caravate

- Il profilo OpenAI `documento_cisterna` esistente non copre direttamente schede-test: il prompt e lo schema sono per fattura/bollettino/DAS con campi `tipoDocumento`, `fornitore`, `numeroDocumento`, `litriTotali`, ecc. (`backend/internal-ai/server/internal-ai-document-extraction.js:44-70`), mentre schede-test richiede OCR per celle ritagliate `data_raw`, `targa_raw`, `litri_raw` e status per riga (`functions-schede/estrazioneSchedaCisterna.js:46-66`, `:115-149`). Fotografia: serve un secondo profilo OpenAI dedicato, nome da decidere tra `scheda_cisterna`, `scheda_carburante_cisterna` o altro; `NON TROVATO IN REPO` un profilo OpenAI schede gia' implementato.
- Il client `src/next/nextCisternaIaClient.ts` puo' essere esteso solo come contenitore tecnico di profili Cisterna, perche' oggi espone esclusivamente `extractCisternaDocumentoFromPdf` e `extractCisternaDocumentoFromImage` verso `/internal-ai-backend/documents/documento-cisterna-analyze` (`src/next/nextCisternaIaClient.ts:3-4`, `:142-164`). Fotografia: per schede serve almeno una nuova funzione client che invii una singola riga/celle o batch celle a un endpoint OpenAI schede; se tenerla nello stesso file o in un secondo client e' decisione aperta.
- Il writer `src/next/nextCisternaWriter.ts` puo' essere esteso con funzioni schede, perche' gia' centralizza wrapper Firestore/Storage Cisterna (`src/next/nextCisternaWriter.ts:1-9`), ma oggi non contiene funzioni per `@cisterna_schede_ia` o `documenti_pdf/cisterna_schede/` (`src/next/nextCisternaWriter.ts:13-64`). Fotografia: possibile estensione del writer esistente oppure writer dedicato schede; decisione aperta.
- Pattern backend riusabile: profilo documentale aggiunto in `internal-ai-document-extraction.js` e route hardcoded in `internal-ai-adapter.js` come per `documento_cisterna` (`backend/internal-ai/server/internal-ai-document-extraction.js:1965-1972`, `:2224-2229`, `:2607-2652`; `backend/internal-ai/server/internal-ai-adapter.js:1900-1984`). Fotografia: per schede il pattern e' riusabile, ma il contratto input/output non e' quello documenti.

## 7. Verdetto perimetro (fotografia, no decisioni)

Stima taglia:

- Scritture Firestore base (`addDoc`/`updateDoc` su `@cisterna_schede_ia`): M.
- Upload ritaglio Storage + salvataggio `fileUrl`: M.
- IA estrazione documento intero: NON TROVATO IN REPO come flusso attivo schede-test; la madre usa celle ritagliate, non documento intero.
- IA estrazione da ritaglio/crop/calibrazione con OpenAI: L.
- Edit mode con update reale e refresh dati: M.
- Precompila da Autisti: S/M.
- Conferma modifiche con modale riepilogo: S/M.
- Persistenza calibrazione locale: S.

File presumibilmente da toccare in implementazione:

Scrittura nuova:
- `src/next/nextCisternaSchedeIaClient.ts` oppure estensione di `src/next/nextCisternaIaClient.ts` per profilo schede OpenAI.
- Eventuale estensione di `src/next/nextCisternaWriter.ts` con writer schede.

Modifica:
- `src/next/NextCisternaSchedeTestPage.tsx`.
- `src/utils/cloneWriteBarrier.ts`.
- `backend/internal-ai/server/internal-ai-document-extraction.js`.
- `backend/internal-ai/server/internal-ai-adapter.js`.
- Eventuale `src/next/nextCisternaWriter.ts`.
- Eventuale `src/next/nextCisternaIaClient.ts`.

Da mantenere:
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`.
- `src/cisterna/iaClient.ts`.
- `functions-schede/estrazioneSchedaCisterna.js`.
- `functions-schede/index.js`.
- `src/next/domain/nextCisternaDomain.ts`, salvo gap dimostrato in SPEC futura.
- `src/App.tsx`, route gia' presente.

Decisioni che l'utente deve prendere prima della SPEC:

1. Nome profilo OpenAI schede: `scheda_cisterna`, `scheda_carburante_cisterna` o altro.
2. Contratto endpoint OpenAI schede: batch di celle `{ cells: [{ rowIndex, data_b64, targa_b64, litri_b64 }] }` come madre, oppure riga singola, oppure immagine ritaglio intera con calibrazione lato backend.
3. Client NEXT: estendere `src/next/nextCisternaIaClient.ts` o creare client dedicato schede.
4. Writer: estendere `src/next/nextCisternaWriter.ts` o creare writer dedicato schede.
5. Salvataggio calibrazione: replicare `localStorage` madre su key `cisterna_schede_calib_v1` oppure lasciare solo stato locale.
6. Upload ritaglio: mantenere path madre `documenti_pdf/cisterna_schede/<yyyy>/<mm>/..._crop.jpg` oppure introdurre path NEXT diverso.
7. Refresh post-scrittura: applicare stesso pattern Cisterna principale con rilettura `readNextCisternaSnapshot(..., { includeCloneOverlays: false })` anche per schede-test.
8. Output OpenAI schede: mantenere envelope madre `ok`, `needsReview`, `rows`, `stats`, `rawText` e status `OK/INCERTO/VUOTO`, oppure introdurre contratto nuovo con adapter UI.

## 8. Divergenze rispetto a docs/product e docs/audit

- `docs/product/SPEC_CISTERNA_CARAVATE_NEXT.md:9-17` dichiara esplicitamente `/next/cisterna/schede-test` fuori scope della SPEC precedente. Runtime coerente: route presente in `src/App.tsx:545-550`, ma pagina ancora read-only/bloccata in `src/next/NextCisternaSchedeTestPage.tsx:579-630`. Divergenza: 0.
- `docs/audit/AUDIT_CISTERNA_CARAVATE_AUTONOMIA_2026-04-28.md:488-491` dichiarava non trovato un profilo OpenAI `documento_cisterna`. Runtime attuale diverge perche' il profilo e l'endpoint ora esistono in `backend/internal-ai/server/internal-ai-document-extraction.js:1965-1972`, `:2224-2229`, `:2607-2652` e `backend/internal-ai/server/internal-ai-adapter.js:1900-1984`.
- `docs/audit/AUDIT_CISTERNA_CARAVATE_AUTONOMIA_2026-04-28.md:535-536` indicava come mancanti deroghe schede-test su `@cisterna_schede_ia` e IA. Runtime attuale conferma ancora mancanti per `/next/cisterna/schede-test` in `src/utils/cloneWriteBarrier.ts:384-407`. Divergenza: 0 per schede-test.

## 9. Tracciabilita'

- Route NEXT schede-test: `src/App.tsx:545-550`.
- Pagina NEXT schede-test: `src/next/NextCisternaSchedeTestPage.tsx:1-1532`.
- CSS madre riusato: `src/next/NextCisternaSchedeTestPage.tsx:11`.
- Lettura snapshot/detail: `src/next/NextCisternaSchedeTestPage.tsx:316-325`, `:359-383`.
- Handler bloccanti NEXT: `src/next/NextCisternaSchedeTestPage.tsx:579-630`.
- CTA principali NEXT: `src/next/NextCisternaSchedeTestPage.tsx:640-666`, `:756-819`, `:1030-1064`, `:1110-1230`, `:1456-1527`.
- Madre schede-test: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1-3205`.
- Scritture madre: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1844-1894`.
- Upload madre: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2084-2124`.
- IA madre da celle: `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1597-1715`; client `src/cisterna/iaClient.ts:246-308`.
- Function Gemini schede: `functions-schede/estrazioneSchedaCisterna.js:1-496`; export v2 `functions-schede/index.js:5-8`.
- Collection canoniche Cisterna: `src/cisterna/collections.ts:5-9`.
- Domain schede: `src/next/domain/nextCisternaDomain.ts:37-80`, `:573-613`, `:803-888`, `:1240-1274`.
- Barriera Cisterna principale: `src/utils/cloneWriteBarrier.ts:42-49`, `:202-207`, `:232-238`, `:384-407`.
- Writer Cisterna esistente: `src/next/nextCisternaWriter.ts:13-64`.
- Client Cisterna OpenAI esistente: `src/next/nextCisternaIaClient.ts:3-166`.
- Backend OpenAI profilo documenti Cisterna: `backend/internal-ai/server/internal-ai-document-extraction.js:44-70`, `:1965-1972`, `:2224-2229`, `:2607-2652`; adapter `backend/internal-ai/server/internal-ai-adapter.js:1900-1984`.
