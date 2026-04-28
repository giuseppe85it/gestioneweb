# SPEC CISTERNA CARAVATE NEXT — Autonomia 100% scrivente con IA su OpenAI

## 0. Metadati

- Data: 2026-04-28.
- Branch: `master` da `git status`.
- HEAD commit: `cc019fdd3383e7939dde932048f9732b877150d2` da `git rev-parse HEAD`.
- Autore: Codex.
- Modulo: Cisterna Caravate NEXT.
- Route coperte: `/next/cisterna` e `/next/cisterna/ia` (`src/App.tsx:578-593`).
- Route fuori scope: `/next/cisterna/schede-test`; la route esiste nel router NEXT ma non viene analizzata ne' implementata in questa SPEC (`src/App.tsx:594-595`).
- File audit di partenza letto: `docs/audit/AUDIT_CISTERNA_CARAVATE_AUTONOMIA_2026-04-28.md`.
- Stato worktree al momento della SPEC: presenti modifiche pendenti pregresse; questa SPEC deve creare solo `docs/product/SPEC_CISTERNA_CARAVATE_NEXT.md` e non toccare codice runtime.

## 1. Decisioni architetturali vincolanti (D1...D16)

D1. Perimetro: solo `/next/cisterna` e `/next/cisterna/ia`; `/next/cisterna/schede-test` resta fuori scope. Le CTA che oggi puntano alle schede test devono restare pura navigazione, senza implementare logica scheda (`src/App.tsx:578-595`, `src/next/NextCisternaPage.tsx:245-252`, `src/next/NextCisternaPage.tsx:574-585`).

D2. Pagina principale: replicare 1:1 le due scritture madre: `setDoc` su `@cisterna_parametri_mensili/<mese>` con merge true per cambio EUR/CHF (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1095-1108`) e `updateDoc` su `@documenti_cisterna/<docId>` per conferma duplicati con `dupGroupKey`, `dupChosen`, `dupIgnored`, `updatedAt` (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:932-955`).

D3. Esporta PDF: resta locale client-side identico alla madre, con `jsPDF`, `autoTable` e `pdf.save(...)`; nessuna scrittura Firestore o Storage (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1117-1286`).

D4. Sotto-pagina IA: replicare il flusso madre upload Storage -> chiamata IA -> compilazione form -> save; sostituire solo provider IA da Gemini a OpenAI, mantenendo path Storage, shape payload, validazioni mime e messaggi utente della madre (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:237-272`, `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:294-358`).

D5. Path Storage invariato: `documenti_pdf/cisterna/<yyyy>/<mm>/<timestamp>_<safeName>` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:253-260`).

D6. Save Firestore: collection invariata `@documenti_cisterna` (`src/cisterna/collections.ts:5`), shape invariata rispetto alla madre (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:330-356`), `fonte: "IA"` mantenuto (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:350`) e unico campo additivo nuovo ammesso `iaEngine: "openai-responses"`.

D7'. Backend OpenAI: aggiungere il profilo `documento_cisterna` esattamente come e' stato fatto per gli altri profili documentali esistenti. Questo significa due interventi paralleli, entrambi obbligatori: (a) estendere `backend/internal-ai/server/internal-ai-document-extraction.js` con system prompt, user instructions e normalizzazione output per `documento_cisterna`, accanto a `manutenzione`, `documento_mezzo`, `preventivo_magazzino`, `preventivo_price_extract` (`backend/internal-ai/server/internal-ai-document-extraction.js:1748-2038`); (b) registrare un nuovo endpoint hardcoded nell'adapter `backend/internal-ai/server/internal-ai-adapter.js` per il profilo Cisterna, analogo strutturalmente alle route gia' presenti (`backend/internal-ai/server/internal-ai-adapter.js:1521`, `backend/internal-ai/server/internal-ai-adapter.js:1670`, `backend/internal-ai/server/internal-ai-adapter.js:1795`, `backend/internal-ai/server/internal-ai-adapter.js:1900`). NON e' "endpoint dedicato Cisterna" nel senso vietato dal prompt originale: "endpoint dedicato" voleva dire file backend separato fuori dal parser o architettura parallela. Aggiungere una route hardcoded nell'adapter coerente con le altre route documentali e' invece il pattern del repo.

D8. Contratto profilo OpenAI: output normalizzato con gli stessi campi della function Gemini `cisterna_documenti_extract`, nello stesso ordine e tipo (`functions-schede/cisternaDocumentiExtract.js:257-271`). Input server con PDF via `input_file` o immagine via `input_image`, come pattern esistente (`backend/internal-ai/server/internal-ai-document-extraction.js:2140-2207`). Modello default: `process.env.INTERNAL_AI_OPENAI_MODEL?.trim() || "gpt-5-mini"` (`backend/internal-ai/server/internal-ai-adapter.js:374-379`).

D9'. Client NEXT: `/next/cisterna/ia` non deve piu' chiamare la Cloud Function Gemini `cisterna_documenti_extract` (`src/cisterna/iaClient.ts:67-101`). Deve aggiungere un wrapper client Cisterna-specifico lato `src/next/`, coerente con i wrapper di profilo gia' presenti. Il wrapper vive in `src/next/nextCisternaIaClient.ts` (DEDOTTO PER ANALOGIA da `src/next/nextPreventivoIaClient.ts:1-148`, da confermare in implementazione), riusa la base URL gia' gestita da `VITE_INTERNAL_AI_BACKEND_URL` + fallback localhost seguendo i client `src/next/internal-ai/internalAiServerChatClient.ts:13-29` e `src/next/internal-ai/internalAiChatAttachmentsClient.ts:56-77`, esporta due funzioni tipate `extractCisternaDocumentoFromPdf` e `extractCisternaDocumentoFromImage` (DEDOTTE PER ANALOGIA, da confermare in implementazione), non una classe e non una factory, e chiama la nuova route Express hardcoded `documento_cisterna` prevista da D7'(b). Il riferimento a `src/next/nextPreventivoIaClient.ts:117-146` vale solo per il pattern firma wrapper, conversione File->base64 interna e ritorno diretto; il riferimento a `src/next/nextPreventivoIaClient.ts:13-20` vale per gli errori via eccezione. NON e' "client REST custom" nel senso vietato dal prompt originale: "custom" voleva dire client che bypassi l'infrastruttura NEXT. Un wrapper di profilo coerente col pattern esistente e' invece il pattern del repo.

D10. La function Gemini legacy `cisterna_documenti_extract` resta deployata e usata dalla madre; non viene deprecata, rimossa o modificata (`functions-schede/index.js:10-13`, `functions-schede/cisternaDocumentiExtract.js:316-358`, `src/cisterna/iaClient.ts:67-101`).

D11. Writer NEXT: creare `src/next/nextCisternaWriter.ts`, coerente con writer NEXT esistenti. Il pattern con wrapper `firestoreWriteOps` e `storageWriteOps` e' visibile in `src/next/nextAttrezzatureCantieriWriter.ts:8-16`, `src/next/nextAttrezzatureCantieriWriter.ts:236-255`.

D12. Barriera scritture: deroghe granulari in `src/utils/cloneWriteBarrier.ts`, una per route/operazione/collection o path Storage, seguendo il pattern esistente (`src/utils/cloneWriteBarrier.ts:335-568`). Vietato blocco unico per route.

D13. Domain `src/next/domain/nextCisternaDomain.ts` resta read-only e invariato; legge documenti, rifornimenti, schede e parametri (`src/next/domain/nextCisternaDomain.ts:508-533`, `src/next/domain/nextCisternaDomain.ts:560-633`) e non contiene writer.

D14. Refresh dati post-scrittura: dopo ogni scrittura riuscita la pagina NEXT deve rileggere `readNextCisternaSnapshot(..., { includeCloneOverlays: false })`, come gia' fa il load iniziale (`src/next/NextCisternaPage.tsx:140-142`, `src/next/domain/nextCisternaDomain.ts:1240-1251`). Vietato aggiornamento solo locale divergente.

D15. Gestione errori utente: usare messaggi identici alla madre quando esistono, per esempio cambio salvato/errore (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1109-1111`), file mancante/HEIC (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:237-244`), save documento (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:294-365`).

D16. Gate implementazione futura: `npm run build` verde e `eslint` delta zero sui file toccati; questo task e' solo redazione SPEC e non esegue build/lint.

Nota: D7 e D9 sono stati sostituiti rispettivamente da D7' e D9' in data 2026-04-28 a risoluzione del blocco B1. Vedi sezione 14.

## 2. Stato di partenza (riassunto da audit)

Pagina principale NEXT:

- Montata su `/next/cisterna` con `NextRoleGuard areaId="cisterna"` (`src/App.tsx:578-584`).
- Legge lo snapshot con `readNextCisternaSnapshot(selectedMonth || requestedMonth || undefined, { includeCloneOverlays: false })` (`src/next/NextCisternaPage.tsx:140-142`).
- Funzionano consultazione mese, tab, archivio, report e link PDF esistenti (`src/next/NextCisternaPage.tsx:133-166`, `src/next/NextCisternaPage.tsx:318-335`, `src/next/NextCisternaPage.tsx:470-485`, `src/next/NextCisternaPage.tsx:595-607`).
- Sono bloccati o read-only: `Apri IA Cisterna`, `Scheda carburante`, `Salva` cambio, `Conferma scelta`, `Apri/Modifica`, `Esporta PDF` (`src/next/NextCisternaPage.tsx:197-218`, `src/next/NextCisternaPage.tsx:237-252`, `src/next/NextCisternaPage.tsx:322-334`, `src/next/NextCisternaPage.tsx:574-607`).

Sotto-pagina IA NEXT:

- Montata su `/next/cisterna/ia` con `NextRoleGuard areaId="cisterna"` (`src/App.tsx:586-592`).
- UI e CSS sono quelli della madre (`src/next/NextCisternaIAPage.tsx:5`, `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:18`).
- `handleFile` gestisce file e preview locale (`src/next/NextCisternaIAPage.tsx:115-129`).
- `handleAnalyze` oggi crea solo preview fittizia e messaggio read-only, senza upload e senza IA (`src/next/NextCisternaIAPage.tsx:131-151`).
- `handleSave` oggi mostra errore read-only e non scrive (`src/next/NextCisternaIAPage.tsx:164-178`).

Stack OpenAI NEXT esistente:

- Client chat controllata: `runInternalAiServerControlledChat` in `src/next/internal-ai/internalAiServerChatClient.ts:72-124`.
- Client allegati IA: `uploadInternalAiServerChatAttachment` in `src/next/internal-ai/internalAiChatAttachmentsClient.ts:298-373`.
- Backend OpenAI: `OpenAI` importato in `backend/internal-ai/server/internal-ai-adapter.js:4`; provider target `openai/responses` con modello default `gpt-5-mini` in `backend/internal-ai/server/internal-ai-adapter.js:374-379`.
- Parser documentale OpenAI: `extractInternalAiDocumentAnalysis` in `backend/internal-ai/server/internal-ai-document-extraction.js:2361-2535`.
- Profili documentali gia' presenti: system prompt `manutenzione`, `documento_mezzo`, `preventivo_magazzino`, `preventivo_price_extract` in `backend/internal-ai/server/internal-ai-document-extraction.js:1748-1805`.

Function Gemini madre:

- Endpoint client `cisterna_documenti_extract` in `src/cisterna/iaClient.ts:12-13`.
- Wrapper madre `extractCisternaDocumento` in `src/cisterna/iaClient.ts:67-101`.
- Function export `cisterna_documenti_extract` in `functions-schede/index.js:10-13`.
- Handler `cisternaDocumentiExtractHandler` in `functions-schede/cisternaDocumentiExtract.js:316-358`.
- Modello Gemini `gemini-2.5-pro` e base URL Google in `functions-schede/cisternaDocumentiExtract.js:10-11`.
- Prompt `PROMPT_DOCUMENTI` in `functions-schede/cisternaDocumentiExtract.js:13-39`.

## 3. Pagina principale `/next/cisterna` — interventi necessari

| CTA / elemento | Riga NEXT oggi | Handler attuale | Comportamento finale richiesto | Scrittura / effetto | Writer | Deroga barriera |
|---|---:|---|---|---|---|---|
| `Apri IA Cisterna` | `src/next/NextCisternaPage.tsx:237-244` | `handleBlockedAction(...)` | Naviga a `/next/cisterna/ia?month=<selectedMonth>` mantenendo UI bottone | Nessuna scrittura | Nessuna | Nessuna |
| `Scheda carburante` | `src/next/NextCisternaPage.tsx:245-252` | `handleBlockedAction(...)` | Naviga soltanto a `/next/cisterna/schede-test?month=<selectedMonth>`; logica scheda fuori scope D1 | Nessuna scrittura in questa SPEC | Nessuna | Nessuna |
| `Salva` cambio EUR/CHF | `src/next/NextCisternaPage.tsx:201-210`, `src/next/NextCisternaPage.tsx:322-334` | `handleSaveCambio` read-only | Replica madre `handleSaveCambio` | `setDoc(doc(db, "@cisterna_parametri_mensili", selectedMonth), { mese, cambioEurChf, updatedAt }, { merge: true })` da `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1095-1108` | `saveNextCisternaMonthlyExchange` | `/next/cisterna`, `firestore.setDoc`, `@cisterna_parametri_mensili/<mese>` |
| `Conferma scelta` duplicati | `src/next/NextCisternaPage.tsx:212-218`, `src/next/NextCisternaPage.tsx:479-481` | `handleConfirmDuplicateChoice` read-only | Replica madre `handleConfirmDupChoice` | `updateDoc` su ogni doc duplicato con `dupGroupKey`, `dupChosen`, `dupIgnored`, `updatedAt` (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:932-955`) | `updateNextCisternaDuplicateChoice` | `/next/cisterna`, `firestore.updateDoc`, `@documenti_cisterna/<docId>` |
| `Apri/Modifica` scheda | `src/next/NextCisternaPage.tsx:574-585` | `handleBlockedAction(...)` | Naviga soltanto a `/next/cisterna/schede-test?edit=<id>&month=<selectedMonth>`; logica scheda fuori scope D1 | Nessuna scrittura in questa SPEC | Nessuna | Nessuna |
| `Esporta PDF` | `src/next/NextCisternaPage.tsx:599-607` | `handleBlockedAction(...)` | Esegue export locale come madre | `jsPDF`, `autoTable`, `pdf.save(...)`; nessun Firestore/Storage (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1117-1286`) | Nessuna | Nessuna |

Refresh snapshot post-scrittura:

- Dopo `saveNextCisternaMonthlyExchange` riuscito, la pagina deve richiamare `readNextCisternaSnapshot(selectedMonth, { includeCloneOverlays: false })` e aggiornare `snapshot`, `cambioInput`, `dupChoiceByGroup` come nel load corrente (`src/next/NextCisternaPage.tsx:140-150`).
- Dopo `updateNextCisternaDuplicateChoice` riuscito, stesso refresh dello snapshot. Non aggiornare solo `dupStatusByGroup` o `snapshot.archive.duplicateGroups` localmente.
- In caso errore cambio, usare messaggio madre `Errore salvataggio cambio EUR->CHF.` quando non c'e' `err.message` (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1109-1111`).

Gestione PDF export D3:

- Copiare nel handler NEXT la logica client-side madre: `new jsPDF(...)` (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1117-1119`), `autoTable(...)` (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1162-1177`, `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1182-1229`, `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1238-1275`), `pdf.save(...)` (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1286`).
- Vietate scritture Firestore/Storage per export PDF.

## 4. Sotto-pagina IA `/next/cisterna/ia` — interventi necessari

| CTA / elemento | Riga NEXT oggi | Handler attuale | Comportamento finale richiesto |
|---|---:|---|---|
| `Vai a Cisterna` | `src/next/NextCisternaIAPage.tsx:199-201` | `navigate(/next/cisterna?month=...)` | Invariato |
| `Torna a IA` | `src/next/NextCisternaIAPage.tsx:202-204` | `navigate("/next/ia")` | Invariato |
| Input file | `src/next/NextCisternaIAPage.tsx:210-217` | `handleFile` | Invariato come UI; stato deve anche permettere upload reale |
| `Analizza documento (IA)` | `src/next/NextCisternaIAPage.tsx:233-240` | `handleAnalyze` fittizio | Upload Storage, chiamata OpenAI NEXT, compilazione form |
| `Salva in archivio cisterna` | `src/next/NextCisternaIAPage.tsx:241-247` | `handleSave` read-only | `addDoc` su `@documenti_cisterna` con shape madre + `iaEngine` |
| Campi form | `src/next/NextCisternaIAPage.tsx:265-386` | `handleFormChange` | Invariati |

Flusso completo nuovo:

1. Validazione file identica: file mancante `Seleziona un file prima dell'analisi.` e HEIC/HEIF `Formato HEIC/HEIF non supportato. Converti in JPG/PNG o PDF.` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:237-244`).
2. Calcolo path Storage identico: `documenti_pdf/cisterna/${yyyy}/${mm}/${Date.now()}_${safeName}` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:253-257`).
3. Upload con wrapper `uploadBytes` in writer NEXT e `getDownloadURL` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:258-263`, pattern wrapper in `src/next/nextAttrezzatureCantieriWriter.ts:242-255`).
4. Scelta del wrapper in base al mime del file selezionato: PDF -> `extractCisternaDocumentoFromPdf(selectedFile, selectedFile.name)`, immagine -> `extractCisternaDocumentoFromImage(selectedFile, selectedFile.name)`. La conversione File->base64 e' interna al wrapper, come nel pattern `src/next/nextPreventivoIaClient.ts:117-146`; il chiamante non passa `contentBase64`.
5. Chiamata backend OpenAI NEXT: `extractCisternaDocumentoFromPdf` o `extractCisternaDocumentoFromImage` inviano HTTP `POST` verso la nuova route Express hardcoded Cisterna prevista da D7'(b), dedotta per analogia come `/internal-ai-backend/documents/documento-cisterna-analyze` (DEDOTTO PER ANALOGIA, da confermare in implementazione). Payload interno al wrapper: `{ fileName, mimeType, contentBase64 }`, senza parametro `profile`, perche' il wrapper e' Cisterna-specifico. Pattern route esistenti: `manutenzione-analyze`, `documento-mezzo-analyze`, `preventivo-magazzino-analyze`, `preventivo-extract` (`backend/internal-ai/server/internal-ai-adapter.js:1521`, `backend/internal-ai/server/internal-ai-adapter.js:1670`, `backend/internal-ai/server/internal-ai-adapter.js:1795`, `backend/internal-ai/server/internal-ai-adapter.js:1900`).
6. Il backend restituisce output normalizzato con campi del contratto sezione 5.
7. Compilazione form con stessa logica madre di `buildFormFromExtract` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:171-185`).
8. Save Firestore con `addDoc(collection(db, "@documenti_cisterna"), payload)` come madre (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:330-357`), aggiungendo solo `iaEngine: "openai-responses"`.

Client NEXT da riusare:

- Base URL backend gia' gestita da `VITE_INTERNAL_AI_BACKEND_URL` e fallback localhost in `src/next/internal-ai/internalAiServerChatClient.ts:13-29` e `src/next/internal-ai/internalAiChatAttachmentsClient.ts:56-77`. Il wrapper Cisterna deve seguire questo pattern per la base URL, non un URL hardcoded esterno a quel pattern.
- `runInternalAiServerControlledChat` non e' adatto al documento Cisterna perche' chiama solo `INTERNAL_AI_SERVER_ADAPTER_ROUTES.orchestratorChat` (`src/next/internal-ai/internalAiServerChatClient.ts:72-99`).
- `uploadInternalAiServerChatAttachment` non e' sufficiente da solo perche' carica allegati IA, ma non invoca profilo `documento_cisterna` (`src/next/internal-ai/internalAiChatAttachmentsClient.ts:298-373`).
- Specifica richiesta: aggiungere un wrapper di profilo Cisterna-specifico in `src/next/nextCisternaIaClient.ts` (DEDOTTO PER ANALOGIA da `src/next/nextPreventivoIaClient.ts:1-148`, da confermare in implementazione), usando la base URL interna NEXT dei client `src/next/internal-ai/` e la nuova route Express hardcoded D7'(b). `src/next/nextPreventivoIaClient.ts:117-146` resta reference solo per firma con `File`, conversione base64 interna, ritorno diretto ed errori via eccezione.

Firma proposta del wrapper client Cisterna-specifico:

```ts
export type CisternaDocumentoExtractResult = {
  tipoDocumento: "fattura" | "bollettino" | null;
  fornitore: string | null;
  destinatario: string | null;
  numeroDocumento: string | null;
  dataDocumento: string | null;
  yearMonth: string | null;
  litriTotali: number | null;
  totaleDocumento: number | null;
  valuta: "EUR" | "CHF" | null;
  prodotto: string | null;
  testo: string | null;
  daVerificare: boolean;
  motivoVerifica: string | null;
};

export async function extractCisternaDocumentoFromPdf(
  pdfFile: File,
  originalFileName?: string,
): Promise<CisternaDocumentoExtractResult>;

export async function extractCisternaDocumentoFromImage(
  imageFile: File,
  originalFileName?: string,
): Promise<CisternaDocumentoExtractResult>;
```

Note firma:

- Il wrapper riceve direttamente `File`, esegue internamente la conversione File->base64 e ritorna `CisternaDocumentoExtractResult` diretto, coerentemente con `src/next/nextPreventivoIaClient.ts:117-146`.
- Gli errori si propagano via eccezione `Error`, non tramite discriminator `ok: boolean`, come nel pattern `PreventivoIaClientError` (`src/next/nextPreventivoIaClient.ts:13-20`).
- `extractCisternaDocumentoFromImage` accetta una sola immagine per chiamata: la madre IA Cisterna gestisce un singolo `selectedFile`, non array di immagini (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:237-272`).

Esempio chiamata attesa:

```ts
const extracted = selectedFile.type === "application/pdf"
  ? await extractCisternaDocumentoFromPdf(selectedFile, selectedFile.name)
  : await extractCisternaDocumentoFromImage(selectedFile, selectedFile.name);
```

Gestione errori utente:

- Upload fallito: mostrare errore aderente alla madre, fallback `Errore durante l'analisi.` se non c'e' messaggio (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:272-279`).
- IA non configurata: messaggio utente semplice, coerente con pattern backend `provider_not_configured` (`backend/internal-ai/server/internal-ai-adapter.js:1584-1596`, `backend/internal-ai/server/internal-ai-adapter.js:2032-2045`).
- Risposta IA non valida: mantenere `Risposta IA cisterna non valida.` come messaggio compatibile con client madre (`src/cisterna/iaClient.ts:96-100`).
- Save fallito: mantenere fallback madre `Errore durante il salvataggio.` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:359-365`).

## 5. Backend OpenAI — nuovo profilo `documento_cisterna`

Path file da modificare nell'implementazione futura:

- `backend/internal-ai/server/internal-ai-document-extraction.js`.

Pattern di estensione:

- System prompt per profili in `buildProviderSystemPrompt` (`backend/internal-ai/server/internal-ai-document-extraction.js:1748-1805`).
- User instructions per `manutenzione` con schema e guardrail (`backend/internal-ai/server/internal-ai-document-extraction.js:1819-1871`).
- User instructions per `documento_mezzo` con schema e guardrail (`backend/internal-ai/server/internal-ai-document-extraction.js:1911-1953`).
- User instructions per `preventivo_magazzino` con schema e guardrail (`backend/internal-ai/server/internal-ai-document-extraction.js:1955-2003`).
- Input PDF/immagine provider in `runProviderBinaryExtraction` (`backend/internal-ai/server/internal-ai-document-extraction.js:2140-2207`).
- Dispatch provider in `extractInternalAiDocumentAnalysis` (`backend/internal-ai/server/internal-ai-document-extraction.js:2361-2535`).

Schema input contratto profilo Cisterna:

```ts
{
  profile: "documento_cisterna";
  fileName: string;
  mimeType: string;
  contentBase64: string;
  providerRequired: true;
}
```

Campi input supportati dal parser esistente:

- `fileName`, `mimeType`, `contentBase64`, `pages`, `textExcerpt`, `providerClient`, `providerTarget`, `profile`, `providerRequired` sono letti da `extractInternalAiDocumentAnalysis` (`backend/internal-ai/server/internal-ai-document-extraction.js:2361-2406`, `backend/internal-ai/server/internal-ai-document-extraction.js:2438-2497`).

Schema output contratto profilo Cisterna, stesso ordine della function Gemini madre:

| Campo | Tipo | Sorgente madre |
|---|---|---|
| `tipoDocumento` | `"fattura" | "bollettino" | null` | `functions-schede/cisternaDocumentiExtract.js:257-258` |
| `fornitore` | `string | null` | `functions-schede/cisternaDocumentiExtract.js:257-260` |
| `destinatario` | `string | null` | `functions-schede/cisternaDocumentiExtract.js:257-261` |
| `numeroDocumento` | `string | null` | `functions-schede/cisternaDocumentiExtract.js:257-262` |
| `dataDocumento` | `string | null`, formato `gg/mm/aaaa` quando leggibile | `functions-schede/cisternaDocumentiExtract.js:257-263`, `functions-schede/cisternaDocumentiExtract.js:31-32` |
| `yearMonth` | `string | null` | `functions-schede/cisternaDocumentiExtract.js:257-264` |
| `litriTotali` | `number | null` | `functions-schede/cisternaDocumentiExtract.js:257-265` |
| `totaleDocumento` | `number | null` | `functions-schede/cisternaDocumentiExtract.js:257-266` |
| `valuta` | `"EUR" | "CHF" | null` | `functions-schede/cisternaDocumentiExtract.js:257-267`, `functions-schede/cisternaDocumentiExtract.js:36` |
| `prodotto` | `string | null` | `functions-schede/cisternaDocumentiExtract.js:257-268` |
| `testo` | `string | null` | `functions-schede/cisternaDocumentiExtract.js:257-269` |
| `daVerificare` | `boolean` | `functions-schede/cisternaDocumentiExtract.js:257-270` |
| `motivoVerifica` | `string | null` | `functions-schede/cisternaDocumentiExtract.js:257-271` |

Prompt di estrazione:

- Riprendere 1:1 il contenuto funzionale di `PROMPT_DOCUMENTI` (`functions-schede/cisternaDocumentiExtract.js:13-39`).
- Riadattare solo provider mechanics: da Gemini `inlineData` (`functions-schede/cisternaDocumentiExtract.js:274-288`) a OpenAI Responses API con `input_file` / `input_image` (`backend/internal-ai/server/internal-ai-document-extraction.js:2140-2207`).

Variabili env:

- `OPENAI_API_KEY` (`backend/internal-ai/server/internal-ai-adapter.js:402-413`).
- `INTERNAL_AI_OPENAI_MODEL` (`backend/internal-ai/server/internal-ai-adapter.js:374-379`).
- `VITE_INTERNAL_AI_BACKEND_URL` lato frontend (`src/next/internal-ai/internalAiServerChatClient.ts:13-17`, `src/next/internal-ai/internalAiChatAttachmentsClient.ts:56-60`).

Tocchi richiesti a `backend/internal-ai/server/internal-ai-adapter.js`:

- Aggiungere una nuova route hardcoded nell'adapter per `documento_cisterna`, analoga strutturalmente alle route esistenti per `manutenzione`, `documento_mezzo`, `preventivo_magazzino`, `preventivo-extract` (`backend/internal-ai/server/internal-ai-adapter.js:1521`, `backend/internal-ai/server/internal-ai-adapter.js:1670`, `backend/internal-ai/server/internal-ai-adapter.js:1795`, `backend/internal-ai/server/internal-ai-adapter.js:1900`).
- Nome route dedotto: `/internal-ai-backend/documents/documento-cisterna-analyze` e `endpointId: "documents.documento-cisterna-analyze"` (DEDOTTO PER ANALOGIA, da confermare in implementazione).
- La route deve validare `fileName`, `mimeType`, `contentBase64`, verificare `isProviderConfigured()`, chiamare `extractInternalAiDocumentAnalysis({ profile: "documento_cisterna", providerRequired: true, ... })`, normalizzare i 13 campi della sezione 5 e restituire envelope con `analysis`, `providerTarget`, `traceEntryId`, come le route esistenti.
- Le 4 route documentali esistenti NON sono registrate in `INTERNAL_AI_SERVER_ADAPTER_ROUTES` (`backend/internal-ai/src/internalAiServerPersistenceContracts.ts:39-48`). La nuova route Cisterna segue lo stesso pattern e NON viene registrata in costanti condivise.

## 6. Writer NEXT `src/next/nextCisternaWriter.ts`

File da creare nell'implementazione futura:

- `src/next/nextCisternaWriter.ts`.

Pattern di reference:

- Import wrapper Firestore/Storage: `src/next/nextAttrezzatureCantieriWriter.ts:8-16`.
- Upload Storage + `getDownloadURL`: `src/next/nextAttrezzatureCantieriWriter.ts:242-255`.
- Scrittura con `setDoc`: `src/next/nextAttrezzatureCantieriWriter.ts:236-239`.
- Wrapper Firestore disponibili: `addDoc`, `setDoc`, `updateDoc`, `deleteDoc` in `src/utils/firestoreWriteOps.ts:15-43`.
- Wrapper Storage disponibili: `uploadBytes`, `uploadString`, `deleteObject` in `src/utils/storageWriteOps.ts:20-57`.

Funzioni esportate richieste:

```ts
export async function saveNextCisternaMonthlyExchange(args: {
  monthKey: string;
  cambioEurChf: number | null;
}): Promise<void>;
```

- Target: `@cisterna_parametri_mensili/<monthKey>` (`src/cisterna/collections.ts:7`).
- Operazione: `setDoc(..., { merge: true })`.
- Shape: `{ mese: monthKey, cambioEurChf, updatedAt: serverTimestamp() }`, identica alla madre (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1095-1108`).
- Wrapper: `setDoc` da `src/utils/firestoreWriteOps.ts:29-35`.

```ts
export async function updateNextCisternaDuplicateChoice(args: {
  groupKey: string;
  chosenDocumentId: string;
  documentIds: string[];
}): Promise<void>;
```

- Target: `@documenti_cisterna/<docId>` (`src/cisterna/collections.ts:5`).
- Operazione: `updateDoc` per ogni `docId`.
- Shape: `{ dupGroupKey, dupChosen: docId === chosenDocumentId, dupIgnored: docId !== chosenDocumentId, updatedAt: serverTimestamp() }`, identica alla madre (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:941-955`).
- Wrapper: `updateDoc` da `src/utils/firestoreWriteOps.ts:22-27`.

```ts
export async function uploadNextCisternaDocumentFile(args: {
  file: File;
  storagePath: string;
}): Promise<{ storagePath: string; fileUrl: string }>;
```

- Target Storage: `documenti_pdf/cisterna/<yyyy>/<mm>/<timestamp>_<safeName>` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:253-260`).
- Operazione: `uploadBytes` + `getDownloadURL`.
- Wrapper: `uploadBytes` da `src/utils/storageWriteOps.ts:20-28`; `getDownloadURL` e `ref` da Firebase Storage come nel pattern `src/next/nextAttrezzatureCantieriWriter.ts:246-252`.

```ts
export async function createNextCisternaIaDocumentRecord(args: {
  payload: NextCisternaIaDocumentPayload;
}): Promise<{ id: string }>;
```

- Target: collection `@documenti_cisterna` (`src/cisterna/collections.ts:5`).
- Operazione: `addDoc`.
- Shape: sezione 8, con unico campo additivo `iaEngine: "openai-responses"`.
- Wrapper: `addDoc` da `src/utils/firestoreWriteOps.ts:15-20`.

## 7. Deroghe `cloneWriteBarrier.ts`

Ancoraggio file:

- Costanti route/dataset in alto al file, vicino ai blocchi gia' presenti per Chat IA e Archivista (`src/utils/cloneWriteBarrier.ts:83-118`).
- Funzione `isAllowedCloneWriteException` dove aggiungere ramo Cisterna granulare (`src/utils/cloneWriteBarrier.ts:335-568`).
- Lettori meta disponibili: `readMetaPath`, `readMetaUrl`, `readMetaMethod` (`src/utils/cloneWriteBarrier.ts:224-249`).

Deroghe richieste:

| Route | Operazione | Target | Motivazione |
|---|---|---|---|
| `/next/cisterna` | `firestore.setDoc` | path esatto/prefix `@cisterna_parametri_mensili/` | Salvataggio cambio EUR/CHF mensile, parity madre (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1095-1108`) |
| `/next/cisterna` | `firestore.updateDoc` | prefix `@documenti_cisterna/` | Conferma scelta duplicati bollettini (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:932-955`) |
| `/next/cisterna/ia` | `storage.uploadBytes` | prefix `documenti_pdf/cisterna/` | Upload documento PDF/immagine prima dell'analisi (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:253-260`) |
| `/next/cisterna/ia` | `firestore.addDoc` | collection `@documenti_cisterna` | Salvataggio documento estratto (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:330-357`) |
| `/next/cisterna/ia` | `fetch.runtime` | `/internal-ai-backend/documents/documento-cisterna-analyze` (DEDOTTO PER ANALOGIA, da confermare in implementazione) | Chiamata profilo `documento_cisterna` secondo D7'/D9', vietata verso Gemini (`src/cisterna/iaClient.ts:67-101`) |

Nota:

- Le stringhe `cloudfunctions.net/ia_cisterna_extract`, `cloudfunctions.net/estrazioneschedacisterna`, `cloudfunctions.net/cisterna_documenti_extract` sono oggi pattern di fetch mutante noto, non deroghe (`src/utils/cloneWriteBarrier.ts:55-63`, `src/utils/cloneWriteBarrier.ts:625-645`).
- Il ramo `isAllowedCloneWriteException` non contiene oggi `/next/cisterna` o `/next/cisterna/ia` (`src/utils/cloneWriteBarrier.ts:335-568`).

## 8. Shape Firestore — parity con madre

### `@cisterna_parametri_mensili`

| Campo | Tipo | Madre | Modifiche NEXT |
|---|---|---|---|
| `mese` | `string` | `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1101-1104`; type `src/cisterna/types.ts:50-52` | Zero |
| `cambioEurChf` | `number | null` | `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1099-1105`; type `src/cisterna/types.ts:50-52` | Zero |
| `updatedAt` | server timestamp / unknown | `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1105`; type `src/cisterna/types.ts:50-53` | Zero |

### `@documenti_cisterna`

| Campo | Tipo | Madre | Modifiche NEXT |
|---|---|---|---|
| `tipoDocumento` | `"fattura" | "bollettino"` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:330-332`; type `src/cisterna/types.ts:21-23` | Zero |
| `fornitore` | `string | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:331-333`; type `src/cisterna/types.ts:21-25` | Zero |
| `destinatario` | `string | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:331-334`; type `src/cisterna/types.ts:21-26` | Zero |
| `numeroDocumento` | `string | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:331-335`; type `src/cisterna/types.ts:21-35` | Zero |
| `dataDocumento` | `string | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:304-307`, `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:331-336`; type `src/cisterna/types.ts:21-24` | Zero |
| `yearMonth` | `string` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:305-308`, `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:336-337`; type `src/cisterna/types.ts:21-36` | Zero |
| `mese` | `string` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:336-338` | Zero |
| `litriTotali` | `number | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:309`, `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:338`; type `src/cisterna/types.ts:21-29` | Zero |
| `litri15C` | `number | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:338-340`; type `src/cisterna/types.ts:21-30` | Zero |
| `totaleDocumento` | `number | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:310`, `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:340`; type `src/cisterna/types.ts:21-34` | Zero |
| `valuta` | `"EUR" | "CHF" | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:311`, `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:341`; type `src/cisterna/types.ts:21-32` | Zero |
| `currency` | `"EUR" | "CHF" | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:341-342`; type `src/cisterna/types.ts:21-33` | Zero |
| `prodotto` | `string | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:343`; type `src/cisterna/types.ts:21-28` | Zero |
| `testo` | `string | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:344`; type `src/cisterna/types.ts:21-41` | Zero |
| `daVerificare` | `boolean` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:327-328`, `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:345`; type `src/cisterna/types.ts:21-46` | Zero |
| `motivoVerifica` | `string | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:346`; type `src/cisterna/types.ts:21-47` | Zero |
| `fileUrl` | `string | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:347`; type `src/cisterna/types.ts:21-42` | Zero |
| `storagePath` | `string | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:348`; type esistente non dichiarato in `src/cisterna/types.ts:21-48` ma usato runtime madre | Zero |
| `nomeFile` | `string | null` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:349`; type `src/cisterna/types.ts:21-43` | Zero |
| `fonte` | `"IA"` | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:350`; type `src/cisterna/types.ts:21-44` | Zero, mantenere `"IA"` |
| `createdAt` | server timestamp / unknown | `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:351`; type `src/cisterna/types.ts:21-45` | Zero |
| `iaEngine` | `"openai-responses"` | NON TROVATO IN REPO nella madre; additivo imposto da D6 | Unico campo nuovo ammesso |
| `dupGroupKey` | `string | null` | duplicati madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:941-955`; type `src/cisterna/types.ts:21-37` | Zero |
| `dupChosen` | `boolean` | duplicati madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:941-955`; type `src/cisterna/types.ts:21-38` | Zero |
| `dupIgnored` | `boolean` | duplicati madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:941-955`; type `src/cisterna/types.ts:21-39` | Zero |
| `updatedAt` | server timestamp / unknown | duplicati madre `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:941-955`; type `src/cisterna/types.ts:21-40` | Zero |

Nota di parity: i campi `luogoConsegna` e `litriAmbiente` esistono nel tipo canonico `src/cisterna/types.ts:21-48` ma la save IA madre NON li valorizza (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:330-357`). Per parity 1:1 con la madre IA, anche la save NEXT li omette. Altri flussi Cisterna (schede test, edit manuali) possono valorizzarli, ma sono fuori scope di questa SPEC.

## 9. CSS / UI

- Nessun nuovo file CSS.
- Nessun nuovo prefisso CSS.
- Nessuna modifica visiva richiesta.
- La pagina principale usa gia' CSS madre `src/next/NextCisternaPage.tsx:9`.
- La sotto-pagina IA usa gia' CSS madre `src/next/NextCisternaIAPage.tsx:5`.
- L'implementazione deve solo riconnettere handler e stati ai bottoni gia' presenti: `Salva`, `Conferma scelta`, `Esporta PDF`, `Analizza documento (IA)`, `Salva in archivio cisterna` (`src/next/NextCisternaPage.tsx:322-334`, `src/next/NextCisternaPage.tsx:479-481`, `src/next/NextCisternaPage.tsx:599-607`, `src/next/NextCisternaIAPage.tsx:233-247`).

## 10. Fasi di implementazione consigliate

Fase 1 - Writer e barriera pagina principale:

- File toccati: `src/next/nextCisternaWriter.ts`, `src/utils/cloneWriteBarrier.ts`, `src/next/NextCisternaPage.tsx`.
- Cosa: `saveNextCisternaMonthlyExchange`, `updateNextCisternaDuplicateChoice`, deroghe `setDoc/updateDoc`, refresh snapshot.
- Gate: `npm run build`, eslint sui file toccati, smoke test `Salva` cambio e `Conferma scelta`.

Fase 2 - PDF locale:

- File toccati: `src/next/NextCisternaPage.tsx`.
- Cosa: portare `handleExportReportPdf` madre con `jsPDF`, `autoTable`, `pdf.save(...)` (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1117-1286`).
- Gate: build, eslint, browser download PDF. Nessuna deroga barriera.

Fase 3 - Backend profilo `documento_cisterna`:

- File toccati: `backend/internal-ai/server/internal-ai-document-extraction.js`, `backend/internal-ai/server/internal-ai-adapter.js`.
- Cosa: system prompt, user instructions, normalizzazione output nello stesso ordine di `functions-schede/cisternaDocumentiExtract.js:257-271`; nuova route hardcoded `/internal-ai-backend/documents/documento-cisterna-analyze` (nome DEDOTTO PER ANALOGIA, da confermare in implementazione).
- Gate: test manuale backend locale senza chiamate da UI finche' non esiste client; build/lint se previsti dal repo.

Fase 4 - Client OpenAI NEXT per profilo documentale:

- File toccati: `src/next/nextCisternaIaClient.ts` (file da creare, DEDOTTO PER ANALOGIA da `src/next/nextPreventivoIaClient.ts:1-148`, da confermare in implementazione).
- Cosa: funzione exported `extractCisternaDocumentoOpenAi` per chiamare la route `documento_cisterna` con payload base64.
- Gate: eslint file client, smoke test provider not configured e risposta ok.

Fase 5 - Sotto-pagina IA scrivente:

- File toccati: `src/next/NextCisternaIAPage.tsx`, `src/next/nextCisternaWriter.ts`, `src/utils/cloneWriteBarrier.ts`.
- Cosa: upload Storage, chiamata OpenAI, form, save `@documenti_cisterna`, campo `iaEngine`.
- Gate: build, eslint, browser upload+analisi+save, refresh su `/next/cisterna`.

Fase 6 - Verifica finale:

- File toccati: nessuno oltre quelli sopra.
- Gate finale obbligatorio: `npm run build` verde; eslint delta zero sui file toccati; test manuale sezione 11.

## 11. Test manuale di accettazione (10-point checklist NEXT)

1. Aprire `/next/cisterna`: route montata da `src/App.tsx:578-584`, UI invariata rispetto a prima.
2. Cambiare mese dal selettore e verificare che la lettura resti `readNextCisternaSnapshot(..., { includeCloneOverlays: false })` (`src/next/NextCisternaPage.tsx:140-142`).
3. Inserire cambio EUR/CHF valido e cliccare `Salva`: atteso `@cisterna_parametri_mensili/<mese>` con `mese`, `cambioEurChf`, `updatedAt` come madre (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1095-1108`).
4. Confermare un gruppo duplicati: atteso update su ogni `@documenti_cisterna/<docId>` con `dupGroupKey`, `dupChosen`, `dupIgnored`, `updatedAt` (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:941-955`).
5. Dopo cambio o duplicati, verificare refresh dati da Firestore reale, non solo stato locale (`src/next/NextCisternaPage.tsx:140-150`).
6. Cliccare `Esporta PDF`: atteso download locale `cisterna-report-mensile-<mese>.pdf`, nessuna scrittura Firestore/Storage (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1117-1286`).
7. Aprire `/next/cisterna/ia`, selezionare PDF/JPG/PNG/WEBP e cliccare `Analizza documento (IA)`: atteso upload sotto `documenti_pdf/cisterna/` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:253-260`).
8. Verificare che la chiamata IA non punti piu' a `cisterna_documenti_extract` (`src/cisterna/iaClient.ts:67-101`) ma al backend OpenAI NEXT risolto da B1.
9. Cliccare `Salva in archivio cisterna`: atteso `addDoc` su `@documenti_cisterna` con shape madre e unico campo additivo `iaEngine: "openai-responses"` (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx:330-357`).
10. Tornare a `/next/cisterna`: il nuovo documento appare nello snapshot e nei conteggi (`src/next/domain/nextCisternaDomain.ts:508-533`, `src/next/domain/nextCisternaDomain.ts:1335-1366`).

## 12. Out of scope esplicito

- `/next/cisterna/schede-test`: fuori scope; le CTA devono solo navigare, senza implementare logica scheda in questa SPEC.
- `estrazioneSchedaCisterna` lato Gemini: fuori scope; client legacy in `src/cisterna/iaClient.ts:138-170`, `src/cisterna/iaClient.ts:246-280`.
- Madre: nessuna modifica a `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`, `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`, `src/cisterna/iaClient.ts`, `functions-schede/cisternaDocumentiExtract.js`.
- Function legacy `functions/iaCisternaExtract.js`: fuori scope; audit la identifica come legacy diversa da `cisterna_documenti_extract` (`docs/audit/AUDIT_CISTERNA_CARAVATE_AUTONOMIA_2026-04-28.md:415-420`).
- Redesign UI Cisterna: vietato; CSS e componenti visuali restano invariati (`src/next/NextCisternaPage.tsx:9`, `src/next/NextCisternaIAPage.tsx:5`).
- Modifiche a `src/next/domain/nextCisternaDomain.ts`: vietate; domain resta read-only (`src/next/domain/nextCisternaDomain.ts:508-633`, `src/next/domain/nextCisternaDomain.ts:1240-1367`).

## 13. Tracciabilita'

- Route NEXT Cisterna: `src/App.tsx:578-593`.
- Route madre Cisterna: `src/App.tsx:759-760`.
- NEXT pagina principale: `src/next/NextCisternaPage.tsx:79-815`.
- NEXT IA: `src/next/NextCisternaIAPage.tsx:64-393`.
- Domain read-only: `src/next/domain/nextCisternaDomain.ts:70-80`, `src/next/domain/nextCisternaDomain.ts:508-633`, `src/next/domain/nextCisternaDomain.ts:1240-1367`.
- Madre pagina principale scritture: `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:932-955`, `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1095-1108`.
- Madre PDF locale: `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1117-1286`.
- Madre IA upload e save: `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:237-272`, `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:294-358`.
- Collection Cisterna: `src/cisterna/collections.ts:5-8`.
- Tipi Cisterna: `src/cisterna/types.ts:5-19`, `src/cisterna/types.ts:21-54`.
- Function Gemini documenti: `functions-schede/cisternaDocumentiExtract.js:13-39`, `functions-schede/cisternaDocumentiExtract.js:257-271`, `functions-schede/cisternaDocumentiExtract.js:316-358`.
- Export function Gemini: `functions-schede/index.js:10-13`.
- Client Gemini legacy: `src/cisterna/iaClient.ts:67-101`.
- Backend OpenAI target: `backend/internal-ai/server/internal-ai-adapter.js:374-413`.
- Profili parser OpenAI: `backend/internal-ai/server/internal-ai-document-extraction.js:1748-1805`, `backend/internal-ai/server/internal-ai-document-extraction.js:1819-2038`.
- Input OpenAI file/immagine: `backend/internal-ai/server/internal-ai-document-extraction.js:2140-2207`.
- Parser OpenAI main: `backend/internal-ai/server/internal-ai-document-extraction.js:2361-2535`.
- Route backend attuali: `backend/internal-ai/server/internal-ai-adapter.js:1521`, `backend/internal-ai/server/internal-ai-adapter.js:1670`, `backend/internal-ai/server/internal-ai-adapter.js:1795`, `backend/internal-ai/server/internal-ai-adapter.js:1900`.
- Route constants backend: `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:39-48`; le 4 route documentali esistenti NON sono registrate in costanti condivise e la nuova route Cisterna segue lo stesso pattern.
- Client internal-ai chat: `src/next/internal-ai/internalAiServerChatClient.ts:31-58`, `src/next/internal-ai/internalAiServerChatClient.ts:72-124`.
- Client internal-ai attachments: `src/next/internal-ai/internalAiChatAttachmentsClient.ts:298-373`.
- Writer reference: `src/next/nextAttrezzatureCantieriWriter.ts:8-16`, `src/next/nextAttrezzatureCantieriWriter.ts:236-255`.
- Wrapper Firestore: `src/utils/firestoreWriteOps.ts:15-43`.
- Wrapper Storage: `src/utils/storageWriteOps.ts:20-57`.
- Barriera: `src/utils/cloneWriteBarrier.ts:55-63`, `src/utils/cloneWriteBarrier.ts:83-118`, `src/utils/cloneWriteBarrier.ts:224-249`, `src/utils/cloneWriteBarrier.ts:335-568`, `src/utils/cloneWriteBarrier.ts:625-645`.
- Audit di partenza: `docs/audit/AUDIT_CISTERNA_CARAVATE_AUTONOMIA_2026-04-28.md:220-676`.

## 14. Blocchi decisionali

B1 (RISOLTO 2026-04-28). Decisione utente applicata: D7 sostituita da D7', D9 sostituita da D9' (vedi sezione 1). Pattern di riferimento: i profili documentali esistenti (`manutenzione`, `documento_mezzo`, `preventivo_magazzino`, `preventivo_price_extract`) seguono lo stesso schema endpoint hardcoded + wrapper client di profilo o chiamata di profilo lato NEXT (`backend/internal-ai/server/internal-ai-adapter.js:1521`, `backend/internal-ai/server/internal-ai-adapter.js:1670`, `backend/internal-ai/server/internal-ai-adapter.js:1795`, `backend/internal-ai/server/internal-ai-adapter.js:1900`, `src/next/nextPreventivoIaClient.ts:117-146`). La SPEC e' ora implementabile end-to-end senza ulteriori decisioni utente.

Verifica chiusura B1:

- Backend: profilo `documento_cisterna` nel parser esistente, nessun file backend parallelo.
- Adapter: route hardcoded Cisterna analoga alle route documentali gia' presenti.
- Contratti condivisi: nessuna registrazione in `INTERNAL_AI_SERVER_ADAPTER_ROUTES`; la route Cisterna segue il pattern reale degli endpoint Express hardcoded.
- Frontend: wrapper di profilo Cisterna-specifico, non wrapper generico con parametro `profile`.
- Route dedotta: `/internal-ai-backend/documents/documento-cisterna-analyze`, da confermare in implementazione.
- Stato: nessun blocco decisionale residuo per avviare le fasi 3 e 4.

Sintesi: 0 blocchi aperti.

C1 e C2 (correzioni di pattern adapter, applicate 2026-04-28) integrate. La SPEC riflette ora il pattern reale: endpoint Express hardcoded nell'adapter, niente costante condivisa.

R1, R2 e R3 (correzioni base URL wrapper, firma wrapper e nota parity campi canonici non salvati dalla madre IA, applicate 2026-04-28) integrate.

- R1: base URL Cisterna allineata ai client `src/next/internal-ai/`.
- R2: firma wrapper Cisterna allineata al pattern File->base64 interno.
- R3: parity esplicitata per `luogoConsegna` e `litriAmbiente`.
