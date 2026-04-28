# AUDIT CISTERNA CARAVATE AUTONOMIA NEXT

Data: 2026-04-28  
Modalita: sola lettura  
Perimetro: `/next/cisterna`, `/next/cisterna/ia`, domain Cisterna, barriera scritture, function Gemini madre, stack OpenAI NEXT esistente  
Verifiche vietate dal prompt: build, lint, test, dev server, chiamate reali Gemini/OpenAI

---

## 0. Snapshot ambiente

### Comandi iniziali obbligatori

#### `git status`

```text
On branch master
Your branch is up to date with 'origin/master'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md
	modified:   src/App.tsx
	modified:   src/next/NextIAArchivistaPage.tsx
	modified:   src/next/NextIADocumentiPage.tsx
	modified:   src/next/components/HomeInternalAiLauncher.tsx
	modified:   src/next/domain/nextDocumentiCostiDomain.ts
	modified:   src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx
	modified:   src/next/internal-ai/ArchivistaMagazzinoBridge.tsx
	modified:   src/next/internal-ai/ArchivistaManutenzioneBridge.tsx
	modified:   src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx
	modified:   src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx
	modified:   src/utils/cloneWriteBarrier.ts

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	docs/audit/VERIFICA_SPEC_OSSATURA_CHAT_IA_NEXT_2026-04-27_v2.md
	docs/audit/VERIFICA_SPEC_SETTORE_MEZZI_CHAT_IA_NEXT_2026-04-28.md
	docs/product/SPEC_READER_PREREQUISITI_SETTORE_MEZZI_CHAT_IA_NEXT.md
	docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md
	src/next/NextIAArchivistaPage.tsx.bak.20260428.5b
	src/next/NextIAArchivistaPage.tsx.bak.20260428.5d
	src/next/NextIADocumentiPage.tsx.bak.20260428.5b
	src/next/NextIADocumentiPage.tsx.bak.20260428.5d
	src/next/chat-ia/
	src/next/domain/nextDocumentiCostiDomain.ts.bak.20260428.5b
	src/next/domain/nextDocumentiCostiDomain.ts.bak.20260428.5d
	src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak.20260428.5b
	src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak.20260428.5b-fix
	src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak.20260428.5c
	src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak.20260428.5d
	src/next/internal-ai/ArchivistaMagazzinoBridge.tsx.bak.20260428.5b
	src/next/internal-ai/ArchivistaMagazzinoBridge.tsx.bak.20260428.5c
	src/next/internal-ai/ArchivistaMagazzinoBridge.tsx.bak.20260428.5d
	src/next/internal-ai/ArchivistaManutenzioneBridge.tsx.bak.20260428.5b
	src/next/internal-ai/ArchivistaManutenzioneBridge.tsx.bak.20260428.5c
	src/next/internal-ai/ArchivistaManutenzioneBridge.tsx.bak.20260428.5d
	src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx.bak.20260428.5b
	src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx.bak.20260428.5c
	src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx.bak.20260428.5d
	src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx.bak.20260428.5b
	src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx.bak.20260428.5c
	src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx.bak.20260428.5d

no changes added to commit (use "git add" and/or "git commit -a")
```

#### `git rev-parse HEAD`

```text
cc019fdd3383e7939dde932048f9732b877150d2
```

#### `node -v && npm -v`

Ambiente PowerShell: eseguito come `node -v; npm -v`.

```text
v20.20.0
10.8.2
```

#### `ls -la src/next | grep -i cisterna`

`bash` non e' disponibile in questa shell (`bash : Termine 'bash' non riconosciuto...`). Output equivalente PowerShell:

```text
Mode   Length LastWriteTime       Name
----   ------ -------------       ----
-a----   3943 30/03/2026 08:40:20 nextCisternaCloneState.ts
-a----  12762 31/03/2026 12:13:54 NextCisternaIAPage.tsx
-a----  36331 31/03/2026 12:00:18 NextCisternaPage.tsx
-a----  58140 31/03/2026 13:01:56 NextCisternaSchedeTestPage.tsx
```

#### `ls -la src/next/domain | grep -i cisterna`

Output equivalente PowerShell:

```text
Mode   Length LastWriteTime       Name
----   ------ -------------       ----
-a----  45363 31/03/2026 12:52:19 nextCisternaDomain.ts
```

#### Localizzazione function Gemini madre

Ricerca sorgente `extractCisternaDocumento|cisterna.*gemini|gemini.*cisterna`:

```text
src\cisterna\iaClient.ts:67:export async function extractCisternaDocumento(input: {
src\pages\CisternaCaravate\CisternaCaravateIA.tsx:10:import { extractCisternaDocumento } from "../../cisterna/iaClient";
src\pages\CisternaCaravate\CisternaCaravateIA.tsx:265:const extracted = await extractCisternaDocumento({
```

`find . -type d -name "functions" -not -path "*/node_modules/*"` non e' eseguibile in PowerShell come comando Unix. Output equivalente PowerShell:

```text
functions
```

Contenuto `functions/`:

```text
Mode   Length LastWriteTime       Name
----   ------ -------------       ----
-a----     22 03/03/2026 08:38:40 .gitignore
-a----   3623 03/03/2026 08:38:40 analisiEconomica.js
-a----   4458 03/03/2026 08:38:40 estrazioneDocumenti.js
-a----   6246 03/03/2026 08:38:40 iaCisternaExtract.js
-a----  28180 19/04/2026 22:34:39 index.js
-a---- 269869 03/03/2026 08:38:40 package-lock.json
-a----    641 03/03/2026 08:38:40 package.json
```

Ricerca `cisterna|gemini|extractCisternaDocumento` in `functions/`:

```text
functions\iaCisternaExtract.js:10:const MODEL_NAME = "gemini-2.5-flash";
functions\iaCisternaExtract.js:13:async function getGeminiApiKey() {
functions\iaCisternaExtract.js:14:const snap = await db.doc("@impostazioni_app/gemini").get();
functions\iaCisternaExtract.js:16:if (!apiKey) throw new Error("API Key Gemini mancante");
functions\iaCisternaExtract.js:34:function parseGeminiPart(result) {
functions\iaCisternaExtract.js:71:Leggi il documento di carico carburante cisterna.
functions\iaCisternaExtract.js:128:exports.ia_cisterna_extract = functions.https.onRequest(async (req, res) => {
functions\iaCisternaExtract.js:143:const apiKey = await getGeminiApiKey();
functions\iaCisternaExtract.js:177:error: result?.error?.message || "Errore API Gemini",
functions\iaCisternaExtract.js:181:const raw = parseGeminiPart(result);
functions\iaCisternaExtract.js:206:error: err?.message || "Errore interno ia_cisterna_extract",
functions\index.js:586:exports.ia_cisterna_extract = require("./iaCisternaExtract").ia_cisterna_extract;
```

Nota: la ricerca successiva ha trovato anche `functions-schede/`, che non emerge dal comando `find ... -name "functions"` perche' la directory non si chiama `functions`.

```text
functions-schede\cisternaDocumentiExtract.js
functions-schede\estrazioneSchedaCisterna.js
functions-schede\index.js
```

#### Localizzazione stack OpenAI NEXT

Ricerca in `src/next`:

```text
src\next\chat-ia\backend\chatIaBackendBridge.ts:1:import { runInternalAiServerControlledChat } from "../../internal-ai/internalAiServerChatClient";
src\next\chat-ia\backend\chatIaBackendBridge.ts:64:runInternalAiServerControlledChat({
src\next\internal-ai\internalAiServerChatClient.ts:14:const configured = import.meta.env.VITE_INTERNAL_AI_BACKEND_URL?.trim();
src\next\internal-ai\internalAiServerChatClient.ts:41:const response = await fetch(`${baseUrl}${path}`, {
src\next\internal-ai\internalAiServerChatClient.ts:72:export async function runInternalAiServerControlledChat(
src\next\internal-ai\internalAiChatOrchestratorBridge.ts:7:runInternalAiServerControlledChat,
src\next\internal-ai\internalAiChatOrchestratorBridge.ts:191:const serverResponse = await runInternalAiServerControlledChat({
src\next\internal-ai\internalAiChatAttachmentsClient.ts:57:const configured = import.meta.env.VITE_INTERNAL_AI_BACKEND_URL?.trim();
src\next\internal-ai\internalAiChatAttachmentsClient.ts:89:const response = await fetch(`${baseUrl}${path}`, {
```

Ricerca backend OpenAI, esclusi `node_modules`:

```text
backend\internal-ai\server\internal-ai-adapter.js:4:import OpenAI from "openai";
backend\internal-ai\server\internal-ai-adapter.js:376:provider: "openai",
backend\internal-ai\server\internal-ai-adapter.js:378:model: process.env.INTERNAL_AI_OPENAI_MODEL?.trim() || "gpt-5-mini",
backend\internal-ai\server\internal-ai-adapter.js:403:return Boolean(process.env.OPENAI_API_KEY?.trim());
backend\internal-ai\server\internal-ai-adapter.js:411:return new OpenAI({
backend\internal-ai\server\internal-ai-adapter.js:412:apiKey: process.env.OPENAI_API_KEY,
backend\internal-ai\server\internal-ai-adapter.js:734:const response = await providerClient.responses.create({
backend\internal-ai\server\internal-ai-adapter.js:883:const response = await providerClient.responses.create({
backend\internal-ai\server\internal-ai-document-extraction.js:2109:const response = await args.providerClient.responses.create({
backend\internal-ai\server\internal-ai-document-extraction.js:2207:const response = await args.providerClient.responses.create({
```

#### Localizzazione barriera scritture

Ricerca:

```text
src\cisterna\iaClient.ts:6:import { assertCloneWriteAllowed } from "../utils/cloneWriteBarrier";
src\pages\CisternaCaravate\CisternaCaravateIA.tsx:15:} from "../../utils/cloneWriteBarrier";
src\utils\aiCore.ts:3:import { assertCloneWriteAllowed } from "./cloneWriteBarrier";
src\utils\cloneWriteBarrier.ts:123:__cloneWriteBarrierFetchInstalled__?: boolean;
src\utils\cloneWriteBarrier.ts:124:__cloneWriteBarrierOriginalFetch__?: typeof window.fetch;
src\utils\firestoreWriteOps.ts:7:import { assertCloneWriteAllowed } from "./cloneWriteBarrier";
src\utils\storageWriteOps.ts:6:import { assertCloneWriteAllowed } from "./cloneWriteBarrier";
src\main.tsx:5:import { installCloneFetchBarrier } from "./utils/cloneWriteBarrier";
```

Deroghe/barriera con stringa `cisterna`:

```text
src\utils\cloneWriteBarrier.ts:59:"cloudfunctions.net/ia_cisterna_extract",
src\utils\cloneWriteBarrier.ts:60:"cloudfunctions.net/estrazioneschedacisterna",
src\utils\cloneWriteBarrier.ts:61:"cloudfunctions.net/cisterna_documenti_extract",
```

Queste tre righe sono pattern di fetch mutante noto da bloccare o intercettare; non sono deroghe di scrittura autorizzata. Nel ramo `isAllowedCloneWriteException` non esiste blocco autorizzativo per route `/next/cisterna` o `/next/cisterna/ia` (`src/utils/cloneWriteBarrier.ts:335-568`).

---

## A. NextCisternaPage.tsx (pagina principale)

### Route e mount

- Import NEXT: `src/App.tsx:18`.
- Route `/next/cisterna`: `src/App.tsx:578-584`.
- Wrapper reale: `NextRoleGuard areaId="cisterna"` (`src/App.tsx:581-583`).
- Componente montato: `src/next/NextCisternaPage.tsx`.
- La route madre `/cisterna` resta montata su `src/pages/CisternaCaravate/CisternaCaravatePage.tsx` (`src/App.tsx:759`).

### Lettura dati runtime

La pagina chiama `readNextCisternaSnapshot(selectedMonth || requestedMonth || undefined, { includeCloneOverlays: false })` in `src/next/NextCisternaPage.tsx:140-142`.

Il domain legge:

- `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`, `@rifornimenti_autisti_tmp` dichiarati in `src/next/domain/nextCisternaDomain.ts:70-80`.
- `@documenti_cisterna` via `getDocs(collection(db, CISTERNA_DOCUMENTI_COLLECTION))` in `src/next/domain/nextCisternaDomain.ts:508-533`.
- `storage/@rifornimenti_autisti_tmp` via `getDoc(doc(db, "storage", RIFORNIMENTI_AUTISTI_KEY))` in `src/next/domain/nextCisternaDomain.ts:564-566`.
- `@cisterna_schede_ia` via `getDocs(collection(db, CISTERNA_SCHEDE_COLLECTION))` in `src/next/domain/nextCisternaDomain.ts:573-595`.
- `@cisterna_parametri_mensili` via `getDocs(collection(db, CISTERNA_PARAMETRI_COLLECTION))` in `src/next/domain/nextCisternaDomain.ts:617-633`.

### CTA visibili e comportamento attuale

| Testo UI | Handler NEXT | Cosa fa oggi | Madre / comportamento per autonomia | Linee |
|---|---|---|---|---|
| Logo header | `navigate("/next")` | Torna alla Home NEXT | Madre usa `navigate("/")` | NEXT `src/next/NextCisternaPage.tsx:225-230`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1298-1299` |
| `Apri IA Cisterna` | `handleBlockedAction(...)` | Mostra messaggio read-only, non naviga | Madre naviga a `/cisterna/ia` | NEXT `src/next/NextCisternaPage.tsx:237-244`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1308-1310` |
| `Scheda carburante` | `handleBlockedAction(...)` | Mostra messaggio read-only, non apre schede | Madre naviga a `/cisterna/schede-test?month=<mese>` | NEXT `src/next/NextCisternaPage.tsx:245-252`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1311-1318` |
| `Home` | `navigate("/next")` | Torna Home NEXT | Madre naviga a `/` | NEXT `src/next/NextCisternaPage.tsx:253-255`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1319-1321` |
| Mese corrente | `setMonthPickerOpen(...)` | Apre/chiude selettore mese | Stesso comportamento consultivo madre | NEXT `src/next/NextCisternaPage.tsx:265-276`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1328-1339` |
| `<` anno precedente | `setMonthPickerYear(previous - 1)` | Navigazione locale anno | Stesso comportamento consultivo madre | NEXT `src/next/NextCisternaPage.tsx:281-288`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1344-1351` |
| `>` anno successivo | `setMonthPickerYear(previous + 1)` | Navigazione locale anno | Stesso comportamento consultivo madre | NEXT `src/next/NextCisternaPage.tsx:290-297`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1353-1360` |
| Nome mese | `setSelectedMonth(monthKey)` | Cambia mese visualizzato | Stesso comportamento consultivo madre | NEXT `src/next/NextCisternaPage.tsx:303-314`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1367-1377` |
| `Salva` cambio EUR->CHF | `handleSaveCambio` | Valida input, poi blocca con messaggio read-only | Madre fa `setDoc(doc(db, @cisterna_parametri_mensili, selectedMonth), { mese, cambioEurChf, updatedAt }, { merge: true })` | NEXT `src/next/NextCisternaPage.tsx:201-210`, `:322-334`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1095-1112`, `:1395-1401` |
| `Archivio` | `setActiveTab("archivio")` | Cambia tab locale | Stesso comportamento consultivo madre | NEXT `src/next/NextCisternaPage.tsx:346-348`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1415-1421` |
| `Report Mensile` | `setActiveTab("report")` | Cambia tab locale | Stesso comportamento consultivo madre | NEXT `src/next/NextCisternaPage.tsx:349-351`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1422-1428` |
| `Targhe + Dettaglio` | `setActiveTab("targhe")` | Cambia tab locale | Stesso comportamento consultivo madre | NEXT `src/next/NextCisternaPage.tsx:352-354`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1429-1435` |
| `Conferma scelta` | `handleConfirmDuplicateChoice(group)` | Blocca e mostra messaggio read-only | Madre fa `updateDoc` su ogni documento duplicato in `@documenti_cisterna` con `dupGroupKey`, `dupChosen`, `dupIgnored`, `updatedAt` | NEXT `src/next/NextCisternaPage.tsx:212-218`, `:479-481`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:932-955`, `:1615-1623` |
| Link `Apri PDF` documenti | link `<a href={item.fileUrl}>` | Apre file esistente | Stesso comportamento consultivo madre | NEXT `src/next/NextCisternaPage.tsx:405`, `:466`, `:501`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1505`, `:1594`, `:1651` |
| `Apri/Modifica` scheda | `handleBlockedAction(...)` | Blocca e mostra messaggio read-only | Madre naviga a `/cisterna/schede-test?edit=<id>&month=<mese>` | NEXT `src/next/NextCisternaPage.tsx:574-585`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1766-1777` |
| `Esporta PDF` | `handleBlockedAction(...)` | Blocca export locale | Madre genera PDF client-side con `jsPDF` + `autoTable` e `pdf.save(...)` | NEXT `src/next/NextCisternaPage.tsx:599-607`; madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1117-1286`, `:1792-1798` |

### Scritture reali presenti nella madre

1. `@cisterna_parametri_mensili/<selectedMonth>`:
   - funzione: `handleSaveCambio`;
   - scrittura: `setDoc(..., { merge: true })`;
   - shape minima: `mese`, `cambioEurChf`, `updatedAt`;
   - riferimenti: `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1095-1108`;
   - collection costante: `src/cisterna/collections.ts:7`.

2. `@documenti_cisterna/<docId>`:
   - funzione: `handleConfirmDupChoice`;
   - scrittura: `updateDoc`;
   - shape minima: `dupGroupKey`, `dupChosen`, `dupIgnored`, `updatedAt`;
   - riferimenti: `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:932-955`;
   - collection costante: `src/cisterna/collections.ts:5`.

3. Export PDF:
   - funzione: `handleExportReportPdf`;
   - side effect: download locale browser tramite `pdf.save(...)`;
   - non scrive Firestore o Storage nel codice madre letto;
   - riferimenti: `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1117-1286`.

4. Navigazione schede carburante:
   - dalla pagina principale madre non scrive direttamente;
   - apre `/cisterna/schede-test`, che e' un verticale separato;
   - riferimento CTA: `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1311-1318`, `:1766-1777`;
   - collection schede dichiarata: `@cisterna_schede_ia` in `src/cisterna/collections.ts:6`.

### Upload Storage pagina principale madre

NON TROVATO IN REPO nella pagina principale `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`. L'upload cisterna rilevato e' nella sotto-pagina IA, non nella pagina principale.

### Lookups read-only esposti dal domain

1. `readNextCisternaSnapshot(monthInput?, options?)`:
   - firma: `src/next/domain/nextCisternaDomain.ts:1240-1243`;
   - legge documenti, rifornimenti, schede, parametri in parallelo (`src/next/domain/nextCisternaDomain.ts:1246-1251`);
   - restituisce archivio, report, counts, derivation notes e limitations (`src/next/domain/nextCisternaDomain.ts:1335-1366`).

2. `readNextCisternaSchedaDetail(id, options?)`:
   - firma: `src/next/domain/nextCisternaDomain.ts:842-845`;
   - ricostruisce dettaglio scheda da `@cisterna_schede_ia` e supporto autisti;
   - e' read-only.

---

## B. NextCisternaIAPage.tsx (sotto-pagina IA)

### Route e mount

- Import NEXT: `src/App.tsx:19`.
- Route `/next/cisterna/ia`: `src/App.tsx:586-592`.
- Wrapper reale: `NextRoleGuard areaId="cisterna"` (`src/App.tsx:589-591`).
- Componente montato: `src/next/NextCisternaIAPage.tsx`.
- Route madre `/cisterna/ia`: `src/App.tsx:760`.

### CTA visibili e comportamento attuale

| Testo UI | Handler NEXT | Cosa fa oggi | Madre / comportamento per autonomia | Linee |
|---|---|---|---|---|
| `Vai a Cisterna` | `navigate(/next/cisterna?month=...)` | Torna alla pagina NEXT Cisterna | Madre naviga al path cisterna ricevuto (`cisternaPath`) | NEXT `src/next/NextCisternaIAPage.tsx:199-201`; madre `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:391-393` |
| `Torna a IA` | `navigate("/next/ia")` | Torna all'hub IA NEXT | Madre naviga a `iaHubPath` | NEXT `src/next/NextCisternaIAPage.tsx:202-204`; madre `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:394-396` |
| Input file `File documento (PDF o immagine)` | `handleFile` | Memorizza file e preview locale; nessun upload | Madre stesso input, poi upload reale nel bottone analisi | NEXT `src/next/NextCisternaIAPage.tsx:115-130`, `:210-217`; madre `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:219-231`, `:402-409` |
| `Analizza documento (IA)` | `handleAnalyze` | Non carica file, non chiama IA; crea form fittizio da nome file e mostra errore read-only | Madre carica file su Storage, ottiene URL, invoca `extractCisternaDocumento({ fileUrl, mimeType, nomeFile })`, poi compila form | NEXT `src/next/NextCisternaIAPage.tsx:131-151`, `:233-240`; madre `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:237-272`, `:425-432` |
| `Salva in archivio cisterna` | `handleSave` | Blocca con messaggio read-only | Madre normalizza form e fa `addDoc(collection(db, @documenti_cisterna), payload)` | NEXT `src/next/NextCisternaIAPage.tsx:164-178`, `:241-247`; madre `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:294-358`, `:433-439` |
| Campi form estrazione | `handleFormChange` | Edit locale dello stato form, nessuna persistenza | Madre usa stessi campi per costruire payload Firestore | NEXT `src/next/NextCisternaIAPage.tsx:153-162`, `:271-386`; madre `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:283-291`, `:463-576` |

### Scritture e upload madre

1. Upload Storage:
   - funzione: `handleAnalyze`;
   - path: `documenti_pdf/cisterna/${yyyy}/${mm}/${Date.now()}_${safeName}`;
   - upload: `uploadBytes(storageRef, selectedFile)`;
   - URL: `getDownloadURL(storageRef)`;
   - riferimenti: `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:252-263`.

2. Chiamata IA Gemini:
   - funzione client: `extractCisternaDocumento`;
   - payload client: `fileUrl`, `mimeType`, `nomeFile`;
   - riferimenti: `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:265-269`, `src/cisterna/iaClient.ts:67-80`.

3. Scrittura Firestore:
   - collection: `@documenti_cisterna`;
   - funzione: `handleSave`;
   - wrapper usato: `addDoc` da `src/utils/firestoreWriteOps.ts`;
   - shape minima: `tipoDocumento`, `fornitore`, `destinatario`, `numeroDocumento`, `dataDocumento`, `yearMonth`, `mese`, `litriTotali`, `litri15C`, `totaleDocumento`, `valuta`, `currency`, `prodotto`, `testo`, `daVerificare`, `motivoVerifica`, `fileUrl`, `storagePath`, `nomeFile`, `fonte: "IA"`, `createdAt`;
   - riferimenti: `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:330-356`.

### Cloud Function Gemini madre

Il client madre corrente chiama l'endpoint:

- `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/cisterna_documenti_extract`;
- costante in `src/cisterna/iaClient.ts:12-13`;
- wrapper `extractCisternaDocumento` in `src/cisterna/iaClient.ts:67-101`.

File lato function trovato:

- `functions-schede/cisternaDocumentiExtract.js`;
- export in `functions-schede/index.js:10-13`;
- handler `cisternaDocumentiExtractHandler` in `functions-schede/cisternaDocumentiExtract.js:316-358`.

Nome export:

- `cisterna_documenti_extract` (`functions-schede/index.js:10-13`).

Schema input:

- `fileUrl?: string`;
- `fileBase64?: string`;
- `mimeType: string`;
- `nomeFile?: string`;
- riferimenti: `src/cisterna/iaClient.ts:67-72`, `functions-schede/cisternaDocumentiExtract.js:327-331`.

Validazioni input:

- HEIC/HEIF rifiutato (`functions-schede/cisternaDocumentiExtract.js:333-337`);
- mime supportati: PDF, JPG/JPEG, PNG, WEBP (`functions-schede/cisternaDocumentiExtract.js:177-185`, `:339-343`);
- richiede `fileUrl` o `fileBase64` (`functions-schede/cisternaDocumentiExtract.js:210-225`).

Schema output normalizzato:

- `tipoDocumento`;
- `fornitore`;
- `destinatario`;
- `numeroDocumento`;
- `dataDocumento`;
- `yearMonth`;
- `litriTotali`;
- `totaleDocumento`;
- `valuta`;
- `prodotto`;
- `testo`;
- `daVerificare`;
- `motivoVerifica`;
- riferimenti: `functions-schede/cisternaDocumentiExtract.js:257-271`.

Side effects dentro la function:

- Legge `@impostazioni_app/gemini` per API key (`functions-schede/cisternaDocumentiExtract.js:200-207`);
- se riceve `fileUrl`, scarica il file (`functions-schede/cisternaDocumentiExtract.js:220-225`);
- chiama Gemini (`functions-schede/cisternaDocumentiExtract.js:274-314`);
- NON TROVATO IN REPO: scritture Firestore o Storage dentro `cisternaDocumentiExtractHandler`.

Dipendenze Gemini:

- modello: `gemini-2.5-pro` (`functions-schede/cisternaDocumentiExtract.js:10`);
- endpoint REST: `generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent` (`functions-schede/cisternaDocumentiExtract.js:11`);
- key: `@impostazioni_app/gemini` (`functions-schede/cisternaDocumentiExtract.js:200-207`);
- prompt: `PROMPT_DOCUMENTI` (`functions-schede/cisternaDocumentiExtract.js:13-39`);
- generation config: `responseMimeType: "application/json"`, `temperature: 0` (`functions-schede/cisternaDocumentiExtract.js:285-288`).

Funzione Gemini legacy correlata:

- `functions/iaCisternaExtract.js` esporta `ia_cisterna_extract` (`functions/iaCisternaExtract.js:128-209`);
- modello `gemini-2.5-flash` (`functions/iaCisternaExtract.js:10`);
- output diverso, con campi `litri15C`, `litriAmbiente`, `currency`, ecc. (`functions/iaCisternaExtract.js:96-125`);
- il client `extractCisternaDocumento` attuale NON punta a questo endpoint, ma a `cisterna_documenti_extract` (`src/cisterna/iaClient.ts:67-80`).

---

## C. Stack OpenAI NEXT esistente (riusabile)

### Client/wrapper NEXT

Client principale chat controllata:

- `src/next/internal-ai/internalAiServerChatClient.ts`.

Funzioni esposte:

- `hasInternalAiServerChatAdapterCandidate(): boolean` (`src/next/internal-ai/internalAiServerChatClient.ts:68-70`);
- `runInternalAiServerControlledChat(requestBody): Promise<...>` (`src/next/internal-ai/internalAiServerChatClient.ts:72-120`).

Base URL:

- env frontend: `VITE_INTERNAL_AI_BACKEND_URL` (`src/next/internal-ai/internalAiServerChatClient.ts:13-17`);
- fallback locale: `http://127.0.0.1:${INTERNAL_AI_SERVER_ADAPTER_PORT}` su `localhost` o `127.0.0.1` (`src/next/internal-ai/internalAiServerChatClient.ts:23-26`).

Wrapper allegati:

- `src/next/internal-ai/internalAiChatAttachmentsClient.ts`;
- legge `VITE_INTERNAL_AI_BACKEND_URL` (`src/next/internal-ai/internalAiChatAttachmentsClient.ts:56-67`);
- espone upload/list/remove allegati lato backend (`src/next/internal-ai/internalAiChatAttachmentsClient.ts:253-392`).

Bridge Chat IA NEXT nuova:

- `src/next/chat-ia/backend/chatIaBackendBridge.ts`;
- usa `runInternalAiServerControlledChat` (`src/next/chat-ia/backend/chatIaBackendBridge.ts:1`, `:64`);
- invia `operation: "run_controlled_chat"`, `attachments: []`, `memoryHints`, `localTurn` (`src/next/chat-ia/backend/chatIaBackendBridge.ts:64-83`).

### Backend OpenAI

Adapter server:

- `backend/internal-ai/server/internal-ai-adapter.js`.

Provider:

- import SDK OpenAI: `backend/internal-ai/server/internal-ai-adapter.js:4`;
- target provider: `provider: "openai"`, `api: "responses"` (`backend/internal-ai/server/internal-ai-adapter.js:374-379`);
- modello default: `process.env.INTERNAL_AI_OPENAI_MODEL?.trim() || "gpt-5-mini"` (`backend/internal-ai/server/internal-ai-adapter.js:378`);
- API key: `OPENAI_API_KEY` lato server (`backend/internal-ai/server/internal-ai-adapter.js:402-413`);
- chiamata Responses API: `providerClient.responses.create(...)` (`backend/internal-ai/server/internal-ai-adapter.js:734-745`).

Gestione chiavi:

- `OPENAI_API_KEY`: required lato server per provider reale (`backend/internal-ai/server/internal-ai-adapter.js:402-413`);
- `INTERNAL_AI_OPENAI_MODEL`: override modello, fallback `gpt-5-mini` (`backend/internal-ai/server/internal-ai-adapter.js:378`);
- `VITE_INTERNAL_AI_BACKEND_URL`: URL client verso backend separato (`src/next/internal-ai/internalAiServerChatClient.ts:13-17`).

Esempi reali di uso:

1. Chat IA NEXT nuova: `src/next/chat-ia/backend/chatIaBackendBridge.ts:64-83`.
2. IA interna orchestrator bridge: `src/next/internal-ai/internalAiChatOrchestratorBridge.ts:191-204`.
3. Backend documento manutenzione OpenAI: `backend/internal-ai/server/internal-ai-adapter.js:1584-1633`.

### Supporto PDF/immagine + estrazione strutturata

Presente per profili documentali gia' implementati:

- prompt provider per `manutenzione`, `documento_mezzo`, `preventivo_magazzino`, `preventivo_price_extract` in `backend/internal-ai/server/internal-ai-document-extraction.js:1748-1805`;
- input PDF come `input_file` e immagini come `input_image` in `backend/internal-ai/server/internal-ai-document-extraction.js:2140-2207`;
- scelta provider image/pdf/text in `backend/internal-ai/server/internal-ai-document-extraction.js:2438-2497`.

Gap per Cisterna:

- NON TROVATO IN REPO: profilo OpenAI specifico `cisterna`, `documento_cisterna` o endpoint backend dedicato alla sostituzione di `cisterna_documenti_extract`;
- quindi la migrazione Gemini -> OpenAI richiede almeno un contratto backend nuovo o l'estensione esplicita del parser documentale OpenAI con profilo Cisterna.

---

## D. cloneWriteBarrier — stato attuale per Cisterna

Path reale:

- `src/utils/cloneWriteBarrier.ts`.

Deroghe o riferimenti esistenti con stringa `cisterna`:

```text
src\utils\cloneWriteBarrier.ts:59:"cloudfunctions.net/ia_cisterna_extract",
src\utils\cloneWriteBarrier.ts:60:"cloudfunctions.net/estrazioneschedacisterna",
src\utils\cloneWriteBarrier.ts:61:"cloudfunctions.net/cisterna_documenti_extract",
```

Interpretazione:

- sono pattern in `MUTATING_FETCH_URL_PATTERNS` (`src/utils/cloneWriteBarrier.ts:55-63`);
- servono alla barriera fetch per riconoscere chiamate mutanti note (`src/utils/cloneWriteBarrier.ts:625-645`);
- NON autorizzano le chiamate su `/next/cisterna` o `/next/cisterna/ia`.

Stato autorizzazioni:

- `isAllowedCloneWriteException` non contiene route `/next/cisterna` o `/next/cisterna/ia` (`src/utils/cloneWriteBarrier.ts:335-568`);
- `firestoreWriteOps` chiama `assertCloneWriteAllowed` prima di `addDoc`, `setDoc`, `updateDoc`, `deleteDoc` (`src/utils/firestoreWriteOps.ts:15-42`);
- `storageWriteOps` chiama `assertCloneWriteAllowed` prima di `uploadBytes`, `uploadString`, `deleteObject` (`src/utils/storageWriteOps.ts:20-56`).

Deroghe mancanti per rendere scrivente la pagina principale:

1. Route `/next/cisterna`, `firestore.setDoc` su `@cisterna_parametri_mensili/<mese>`.
2. Route `/next/cisterna`, `firestore.updateDoc` su `@documenti_cisterna/<docId>` per duplicati bollettini.
3. Route `/next/cisterna`, eventuale permesso per export PDF solo se si decide di salvarlo in archivio; il codice madre oggi fa solo `pdf.save(...)`, quindi NON serve deroga Storage se si mantiene export client-side.

Deroghe mancanti per rendere scrivente `/next/cisterna/ia`:

1. Route `/next/cisterna/ia`, `storage.uploadBytes` sotto `documenti_pdf/cisterna/`.
2. Route `/next/cisterna/ia`, `firestore.addDoc` su `@documenti_cisterna`.
3. Route `/next/cisterna/ia`, `fetch.runtime` verso il nuovo endpoint OpenAI NEXT, se implementato come endpoint HTTP backend.

Deroghe probabilmente necessarie se si include anche `Scheda carburante` come parte del 100% autonomia:

1. Route `/next/cisterna/schede-test`, `firestore.addDoc` / `firestore.updateDoc` su `@cisterna_schede_ia`.
2. Route `/next/cisterna/schede-test`, `fetch.runtime` verso endpoint OpenAI o migrazione dell'attuale `estrazioneSchedaCisterna`.

---

## E. Domain `nextCisternaDomain.ts`

### Export e funzioni

1. `NEXT_CISTERNA_DOMAIN`
   - `code: "D09-CISTERNA-BASE"`;
   - dataset: `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`, `@rifornimenti_autisti_tmp`;
   - riferimento: `src/next/domain/nextCisternaDomain.ts:70-80`.

2. Tipi export:
   - `NextCisternaQuality` (`src/next/domain/nextCisternaDomain.ts:83`);
   - `NextCisternaSupportItem` (`src/next/domain/nextCisternaDomain.ts:85`);
   - `NextCisternaDocumentItem` (`src/next/domain/nextCisternaDomain.ts:93`);
   - `NextCisternaDuplicateGroup` (`src/next/domain/nextCisternaDomain.ts:107`);
   - `NextCisternaSchedaItem` (`src/next/domain/nextCisternaDomain.ts:115`);
   - `NextCisternaSchedaDetailRow` (`src/next/domain/nextCisternaDomain.ts:124`);
   - `NextCisternaSchedaDetail` (`src/next/domain/nextCisternaDomain.ts:135`);
   - `NextCisternaPerTargaItem` (`src/next/domain/nextCisternaDomain.ts:146`);
   - `NextCisternaDetailRow` (`src/next/domain/nextCisternaDomain.ts:154`);
   - `NextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:168`);
   - `ReadNextCisternaSnapshotOptions` (`src/next/domain/nextCisternaDomain.ts:238`);
   - `ReadNextCisternaSchedaDetailOptions` (`src/next/domain/nextCisternaDomain.ts:242`).

3. `readNextCisternaSchedaDetail(id, options?)`
   - firma: `src/next/domain/nextCisternaDomain.ts:842-845`;
   - scopo: dettaglio read-only scheda carburante.

4. `readNextCisternaSnapshot(monthInput?, options?)`
   - firma: `src/next/domain/nextCisternaDomain.ts:1240-1243`;
   - scopo: snapshot read-only pagina principale.

### Read vs gap writer

Tutto il domain e' read-only:

- legge documenti (`src/next/domain/nextCisternaDomain.ts:508-533`);
- legge rifornimenti (`src/next/domain/nextCisternaDomain.ts:564-566`);
- legge schede (`src/next/domain/nextCisternaDomain.ts:573-595`);
- legge parametri (`src/next/domain/nextCisternaDomain.ts:617-633`);
- ricostruisce report e archivio (`src/next/domain/nextCisternaDomain.ts:1240-1367`).

Gap writer da affiancare:

- writer cambio EUR/CHF mensile;
- writer scelta duplicati bollettini;
- writer documento cisterna IA (`uploadBytes` + `addDoc`);
- writer scheda carburante se `/next/cisterna/schede-test` entra nel perimetro 100%.

Il pattern di writer dedicato esiste in `src/next/nextAttrezzatureCantieriWriter.ts`, che usa wrapper `setDoc` da `src/utils/firestoreWriteOps.ts` e `uploadBytes` da `src/utils/storageWriteOps.ts` (`src/next/nextAttrezzatureCantieriWriter.ts:8-16`).

---

## F. Verdetto perimetro consigliato (no decisioni, solo fotografia)

### Stima taglia

- Pagina principale scrivente: `M`
  - motivi: poche scritture reali (`setDoc` parametri, `updateDoc` duplicati) ma serve writer dedicato, deroga barriera, refresh snapshot e verifica UI.
- Sotto-pagina IA scrivente: `M`
  - motivi: upload Storage + salvataggio documento sono chiari, ma servono writer dedicato, deroga Storage/Firestore e gestione errori.
- Switch Gemini -> OpenAI: `L`
  - motivi: manca profilo/endpoint OpenAI Cisterna nel backend; bisogna definire contratto input/output equivalente a `cisterna_documenti_extract`, supportare PDF/immagini e integrare il client NEXT senza chiamare provider dal browser.
- Eventuale inclusione completa `Scheda carburante`: `XL`
  - motivi: la CTA principale e l'edit schede portano a `/next/cisterna/schede-test`; il task corrente non ne ha chiesto l'audit completo, ma per "100%" autonomia del verticale e' presumibilmente rilevante.

### File sorgente presumibilmente da toccare in implementazione

Scrittura nuova:

- `src/next/nextCisternaWriter.ts` oppure `src/next/writers/nextCisternaWriter.ts` se si decide di introdurre cartella writer.
- Eventuale `src/next/nextCisternaIaOpenAiClient.ts` o equivalente se non si riusa direttamente un client interno IA esistente.

Modifica:

- `src/next/NextCisternaPage.tsx`.
- `src/next/NextCisternaIAPage.tsx`.
- `src/utils/cloneWriteBarrier.ts`.
- `backend/internal-ai/server/internal-ai-adapter.js`.
- `backend/internal-ai/server/internal-ai-document-extraction.js`.
- Eventuali contratti TypeScript backend in `backend/internal-ai/src/*` se il nuovo endpoint OpenAI richiede contratto tipizzato.
- Eventuale `src/App.tsx` solo se cambia route o wrapper; al codice attuale la route esiste gia'.
- Eventuale `src/next/NextCisternaSchedeTestPage.tsx` se il perimetro "100%" include davvero schede carburante operative.

Da mantenere:

- `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`.
- `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`.
- `functions/iaCisternaExtract.js`.
- `functions-schede/cisternaDocumentiExtract.js`.
- `functions-schede/estrazioneSchedaCisterna.js`.
- `src/next/domain/nextCisternaDomain.ts`, salvo necessità futura non emersa in questo audit.
- UI/CSS attuale della pagina, da non ridisegnare.

### Decisioni che l'utente deve prendere prima della SPEC

1. Il "100% scrivente Cisterna" include anche `/next/cisterna/schede-test` oppure solo `/next/cisterna` + `/next/cisterna/ia`?
2. Il writer Cisterna deve vivere in `src/next/nextCisternaWriter.ts` come altri writer NEXT esistenti, oppure si introduce la cartella `src/next/writers/`?
3. Le deroghe barriera devono essere una per collection/operazione o un blocco unico per route Cisterna?
4. `Esporta PDF` resta export locale client-side come madre, oppure va salvato in archivio Firestore/Storage?
5. La vecchia Cloud Function Gemini `cisterna_documenti_extract` resta disponibile in parallelo durante la transizione o viene deprecata subito dalla NEXT?
6. La sostituzione OpenAI riguarda solo documenti cisterna (`cisterna_documenti_extract`) o anche schede carburante (`estrazioneSchedaCisterna`)?
7. Il backend OpenAI deve avere endpoint dedicato Cisterna o estendere il parser documentale esistente con un nuovo profilo `cisterna`?
8. I documenti salvati da NEXT devono mantenere `fonte: "IA"` come madre o distinguere `fonte: "OPENAI_NEXT"`?

---

## G. Divergenze rispetto a docs/product e docs/audit

### DVG-CIS-001 — Stato "CHIUSO" non significa autonomia scrivente

- Claim: `Cisterna -> CHIUSO` e `Cisterna IA -> CHIUSO` in `docs/product/MATRICE_ESECUTIVA_NEXT.md:750-779`.
- Realta' runtime: il codice conferma il senso read-only di quel claim: `Salva`, `Conferma scelta`, `Apri IA Cisterna`, `Scheda carburante`, `Apri/Modifica`, `Esporta PDF`, `Analizza documento (IA)` e `Salva in archivio cisterna` restano bloccati (`src/next/NextCisternaPage.tsx:197-218`, `:237-252`, `:332-334`, `:479-481`, `:574-607`; `src/next/NextCisternaIAPage.tsx:131-178`, `:233-247`).
- Divergenza: nessuna divergenza testuale se "CHIUSO" e' inteso come clone fedele read-only. Per l'obiettivo di questo audit, invece, il modulo NON e' scrivente e NON e' autonomo business.

### DVG-CIS-002 — Adapter D09 "Assorbito" ma verticale read-only

- Claim: `adapter.d09` Cisterna "Assorbito" in `docs/product/MATRICE_COPERTURA_UNIVERSALE_IA_NEXT.md:16`.
- Realta' runtime: la stessa riga dice "verticale read-only"; il codice conferma read-only su `/next/cisterna/ia` (`src/next/NextCisternaIAPage.tsx:131-178`).
- Divergenza: nessuna divergenza runtime se il claim e' letto come assorbimento router/handoff, non come sostituzione IA Gemini con OpenAI.

### DVG-CIS-003 — Stato IA interna segnala correttamente non assorbito

- Claim: `functions-schede/cisternaDocumentiExtract.js` e `NextCisternaIAPage` read-only in `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md:70-72`.
- Realta' runtime: file presente (`functions-schede/cisternaDocumentiExtract.js`), export presente (`functions-schede/index.js:10-13`), NEXT read-only (`src/next/NextCisternaIAPage.tsx:131-178`).
- Divergenza: 0.

### DVG-CIS-004 — Documenti precedenti che dicono "reader ufficiale senza overlay"

- Claim: `readNextCisternaSnapshot(..., { includeCloneOverlays: false })` in `docs/_live/STATO_MIGRAZIONE_NEXT.md:5628-5632`.
- Realta' runtime: chiamata reale in `src/next/NextCisternaPage.tsx:140-142`.
- Divergenza: 0.

### Sintesi divergenze

0 divergenze runtime nette rispetto ai claim documentali letti, se i claim vengono interpretati nel loro perimetro originale read-only/clone fedele.

Nota operativa: i documenti storici possono dare l'impressione di "modulo chiuso", ma il codice dimostra che la chiusura non equivale a modulo scrivente. Per la richiesta corrente, Cisterna resta da implementare come scrivente.
