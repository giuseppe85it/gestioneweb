# SPEC_ACQUISTI_PREVENTIVO_IA_CONSUMER_NEXT — v1 (BOZZA DA VERIFICARE)

> **Stato:** BOZZA. Non implementare prima del prompt di verifica spec-vs-codice a Codex e della chiusura con divergenze = 0.
>
> **Fonte primaria di verità** per il consumer frontend NEXT della capability IA preventivi. Il backend è già implementato (endpoint `POST /internal-ai-backend/documents/preventivo-extract`, contratto `preventivo_price_extract_v1`, SPEC_ACQUISTI_PREVENTIVO_IA_NEXT v1.1 implementata nel PROMPT 19 e verificata nei PROMPT 20+21).
>
> Questo documento è redatto a partire dall'**audit Codex PROMPT 22 del 2026-04-23**. Ogni affermazione tecnica è ancorata a `path:riga` ed è verificabile. In caso di divergenza tra spec e codice reale, il codice reale prevale: l'implementatore deve fermarsi e segnalare, non reinterpretare.
>
> **Perimetro di questa fase:** **CONSUMER FRONTEND + ESTENSIONE WRITER + ESTENSIONE BARRIER**. Il backend è chiuso e NON va toccato.
>
> **Versione:** v1 bozza del 2026-04-23.

---

## 1. OBIETTIVO FUNZIONALE

Permettere all'utente, dal tab NEXT **"Prezzi & Preventivi"** (route `/next/materiali-da-ordinare?tab=preventivi`), di:

1. caricare un PDF di preventivo **oppure** fino a 10 immagini;
2. ottenere l'estrazione strutturata delle righe tramite la capability backend NEXT OpenAI;
3. rivedere le righe estratte in una tabella editabile (stessa UX della madre `src/pages/Acquisti.tsx`);
4. confermare e salvare in **un unico atto**: il preventivo finisce in `storage/@preventivi` e il listino `storage/@listino_prezzi` viene aggiornato di conseguenza;
5. i file allegati vengono caricati su Firebase Storage in `preventivi/ia/*` e referenziati dal record Firestore.

Il consumer è funzionalmente equivalente al flusso IA della madre che oggi usa la callable Gemini `estraiPreventivoIA`, sostituita dalla nuova capability OpenAI. La madre resta invariata.

---

## 2. DECISIONI DI DESIGN (NON NEGOZIABILI)

| # | Decisione | Valore |
|---|-----------|--------|
| D1 | Paradigma UI | **Modale popup** dedicata (coerente con `NextPreventivoManualeModal.tsx` e `ArchivistaPreventivoMagazzinoBridge.tsx`). NON form inline come la madre. |
| D2 | Posizione pulsante | Sostituzione del placeholder **"CARICA PREVENTIVO"** oggi presente in `src/next/NextProcurementConvergedSection.tsx:404-406` (clone-safe con `alert`). Il nuovo pulsante diventa il trigger reale del consumer IA. |
| D3 | Granularità atto | **Atto unico**: review → conferma → salvataggio preventivo + aggiornamento listino in una sola transazione UX. Nessun workflow "bozza listino + conferma import" separato come nella madre. |
| D4 | Writer | **Estensione additiva** di `src/next/nextPreventivoManualeWriter.ts` (W1). Il manuale continua a funzionare invariato; il consumer IA passa parametri extra (`pdfStoragePath/pdfUrl/imageStoragePaths/imageUrls`) che il manuale oggi passa `null` hardcoded. |
| D5 | Endpoint backend | `POST http://127.0.0.1:4310/internal-ai-backend/documents/preventivo-extract` (stesso adapter locale già usato per Euromecc). |
| D6 | Input supportati | PDF singolo **oppure** fino a 10 immagini. I due input sono mutuamente esclusivi, coerenti con la madre (`src/pages/Acquisti.tsx:3431-3446`) e col backend (SPEC backend §5.2). |
| D7 | Upload path | `preventivi/ia/<preventivoId>.pdf` per il PDF; `preventivi/ia/<preventivoId>_<n>.<ext>` per le immagini. Stesso prefisso della madre (`src/pages/Acquisti.tsx:3458, 3487`), diverso da `preventivi/manuali/`. |
| D8 | Matching fornitore | Come madre `resolveFornitoreFromExtract` (`src/pages/Acquisti.tsx:3219`): prima match esatto su `normalizeDescrizione(nome) === normalizedSupplier`, poi match `includes` bidirezionale. Nessuna creazione al volo. Nessun modale di scelta. Se match trovato → preseleziona; se non trovato → l'utente sceglie dalla select. |
| D9 | Confronto con listino storico | In tabella di review mostrare lo stato per riga: `NUOVO`, `GIA ESISTE (codice)`, `GIA ESISTE (descrizione)`, + badge delta `+/-/=` e prezzo precedente, come madre `iaRowsAnalysis` (`src/pages/Acquisti.tsx:3238-3302`). |
| D10 | Editabilità review | Righe editabili: `descrizione`, `unita`, `prezzoUnitario`, `codiceArticolo`, `note`. Possibilità di rimuovere righe. Possibilità di aggiungere riga manuale. Pre-filtro lato client come madre: solo righe con `description` non vuota e `unitPrice > 0` entrano in review (`src/pages/Acquisti.tsx:3527`). |
| D11 | Salvataggio | Il click su "Salva preventivo e aggiorna listino" esegue in ordine: upload Storage → `saveAndUpsert` esteso → refresh snapshot. Se upload fallisce → nessuna scrittura Firestore. Se preventivo fallisce → nessun upsert listino. Se upsert listino fallisce **dopo** salvataggio preventivo → errore bloccante segnalato all'utente, ma il preventivo resta salvato (comportamento attuale di `saveAndUpsert` in `nextPreventivoManualeWriter.ts:357-375`). |
| D12 | Valuta | Select **CHF / EUR**, prefillata dall'estrazione IA se la currency è tra le ammesse. Default `CHF` se nulla o fuori enum. |
| D13 | Pre-compilazione | `numeroPreventivo` e `dataPreventivo` prefillati dall'estrazione IA quando presenti (stessa logica madre `src/pages/Acquisti.tsx:3523`). Campi editabili dall'utente. |

---

## 3. VINCOLI ARCHITETTURALI ASSOLUTI

1. **NON MODIFICARE** il backend IA NEXT: `backend/internal-ai/**` è chiuso e verificato. Nessun endpoint aggiunto, modificato o rinominato.
2. **NON MODIFICARE** `src/pages/Acquisti.tsx` (madre): continua a usare la callable Gemini.
3. **NON MODIFICARE** `functions/index.js`: la callable Gemini `estraiPreventivoIA` resta invariata.
4. **NON MODIFICARE** la shape di `Preventivo`, `PreventivoRiga`, `ListinoVoce`, `Fornitore`, `Valuta`.
5. **NON MODIFICARE** la logica di lettura NEXT (`readNextProcurementSnapshot`, `mapPreventivoRecord`, `mapListinoRecord`).
6. **NON MODIFICARE** `NextPreventivoManualeModal.tsx`: il flusso manuale resta invariato.
7. **NON DUPLICARE** il writer manuale: la logica è estesa additivamente, non copiata (vedi §6).
8. **NON INTRODURRE** librerie npm nuove.
9. **NON INTRODURRE** env var nuove.
10. Tutte le scritture passano dai wrapper `src/utils/firestoreWriteOps.ts` e `src/utils/storageWriteOps.ts` (già usati dal writer manuale).

---

## 4. FATTI TECNICI DAL CODICE REALE (AUDIT CODEX PROMPT 22)

### 4.1 Endpoint backend da consumare

```
POST http://127.0.0.1:4310/internal-ai-backend/documents/preventivo-extract
```

Request body variante PDF singolo:
```json
{
  "fileName": "string",
  "mimeType": "application/pdf",
  "contentBase64": "string",
  "originalFileName": "string|null"
}
```

Request body variante multi-immagine:
```json
{
  "pages": [
    { "fileName": "string", "mimeType": "image/jpeg", "contentBase64": "string" }
  ],
  "originalFileName": "string|null"
}
```

Response 200 (envelope verificato in PROMPT 20):
```json
{
  "ok": true,
  "endpointId": "documents.preventivo-extract",
  "status": "ok",
  "message": "Estrazione preventivo completata.",
  "data": {
    "result": { "schemaVersion": "preventivo_price_extract_v1", "document": {...}, "supplier": {...}, "items": [...], "warnings": [...] },
    "providerTarget": {...},
    "traceEntryId": "string"
  }
}
```

Errori:
- 400 `validation_error`
- 503 `provider_not_configured`
- 502 `upstream_error`

### 4.2 Pattern fetch autorizzato dal barrier (riferimento Euromecc)

Il barrier oggi autorizza una sola rotta locale `127.0.0.1/internal-ai-backend/*`: Euromecc. Pattern da `src/utils/cloneWriteBarrier.ts:41-42, 228-238, 328-339`. Per il consumer IA preventivi va aggiunta una whitelist analoga per `/next/materiali-da-ordinare` verso `127.0.0.1/internal-ai-backend/documents/preventivo-extract`. Dettagli in §8.

### 4.3 Writer NEXT esistente

File: `src/next/nextPreventivoManualeWriter.ts`. Funzioni esportate (audit PROMPT 22 §2.1):
- `saveNextPreventivoManuale(input: SaveNextPreventivoManualeInput): Promise<Preventivo>` — salva preventivo, carica solo `foto[]` in `preventivi/manuali/`.
- `upsertListinoFromPreventivoManuale(preventivo, valuta, codiciArticoloPerRiga): Promise<void>` — aggiorna `@listino_prezzi`.
- `saveAndUpsert(params: SaveAndUpsertParams): Promise<void>` — orchestra i due e rilancia errori.

Limiti rilevati rispetto al flusso IA:
- L'input accetta solo `foto: File[]`. Non gestisce PDF.
- L'upload avviene solo in `preventivi/manuali/`. Hardcoded.
- `pdfUrl` e `pdfStoragePath` sono scritti a `null` sia nel `Preventivo` sia nel `fonteAttuale` del listino (`src/next/nextPreventivoManualeWriter.ts:221-222, 293, 343`).

### 4.4 Funzioni madre da replicare nel consumer NEXT

Dall'audit PROMPT 22 §1.11, tutte locali al componente `Acquisti.tsx`, non esportate. Le seguenti servono al consumer IA:

- `normalizeDescrizione` (`src/pages/Acquisti.tsx:634-640`) — già replicata nel writer manuale NEXT.
- `normalizeUnita` (`src/pages/Acquisti.tsx:642-644`) — già replicata.
- `normalizeArticoloCanonico` (`src/pages/Acquisti.tsx:724-726`) — già replicata.
- `computeTrend` (`src/pages/Acquisti.tsx:763-771`) — già replicata.
- `listinoKey` (`src/pages/Acquisti.tsx:749-761`) — già replicata.
- `resolveFornitoreFromExtract` (`src/pages/Acquisti.tsx:3219`) — **da replicare** nel componente IA (o in un helper condiviso del consumer).
- `mapExtractedRowsToPreventivo` (`src/pages/Acquisti.tsx:3359`) — **da replicare**.
- `iaRowsAnalysis` (`src/pages/Acquisti.tsx:3238`) — **da replicare** (logica confronto con listino).
- `formatExtractDateForInput` (`src/pages/Acquisti.tsx:3381` e dintorni) e `normalizeExtractCurrency` (`src/pages/Acquisti.tsx:3381`) — **da replicare** o incorporare nella logica di prefill.

Le funzioni "già replicate" sono disponibili internamente a `nextPreventivoManualeWriter.ts` ma **non esportate**. La loro replica avviene o nel componente modale IA, o in un helper dedicato (vedi §6.1).

### 4.5 Contratto output IA (già noto)

Come da SPEC backend §4.1 e confermato da `functions/index.js:444-579`:
- `schemaVersion: "preventivo_price_extract_v1"` (hardcoded server-side).
- `document: { number, date: "dd/mm/yyyy"|null, currency: "CHF"|"EUR"|null, confidence }`.
- `supplier: { name, confidence }`.
- `items: [{ description, articleCode, uom, unitPrice, currency, confidence }]`.
- `warnings: [{ code: "MISSING_CURRENCY"|"MISSING_UNIT_PRICE"|"LIKELY_TOTAL_PRICE"|"PARTIAL_TABLE"|"LOW_CONFIDENCE", severity, message }]`.

Il client **filtra** righe con `description` non vuota e `unitPrice > 0` prima di mostrarle in review (stessa regola madre `src/pages/Acquisti.tsx:3527`).

### 4.6 Shape Firestore target

Dalla SPEC manuale v2 §4.2. Nessuna modifica: il consumer IA produce `Preventivo` e `ListinoVoce` identici per shape, diversi solo per `pdfStoragePath`, `pdfUrl`, `imageStoragePaths`, `imageUrls` che ora possono essere popolati (non più `null`).

---

## 5. UI — MODALE CONSUMER IA

### 5.1 Trigger

Nel tab "Prezzi & Preventivi" (`src/next/NextProcurementConvergedSection.tsx`), sostituire il pulsante placeholder **"CARICA PREVENTIVO"** esistente (`src/next/NextProcurementConvergedSection.tsx:404-406`) con un pulsante reale che apre la modale IA. Il pulsante "PREVENTIVO MANUALE" del flusso manuale resta invariato.

Label nuovo pulsante: **`CARICA PREVENTIVO IA`** (stesso styling di "PREVENTIVO MANUALE").

### 5.2 Layout modale — step 1: upload

Titolo: `Estrazione preventivo con IA`.

Contenuto:
- Select **Fornitore** (opzionale in questo step; verrà eventualmente prefillata dopo estrazione dal match). Popolata da `readNextFornitoriSnapshot({ includeCloneOverlays: false })` — stesso meccanismo del manuale (`src/next/NextPreventivoManualeModal.tsx:54, 141`).
- Radio button mutuamente esclusivi: **PDF** | **Immagini (max 10)**.
- In base alla scelta, input file corrispondente:
  - `accept="application/pdf"` per PDF singolo.
  - `accept="image/*" multiple` per immagini, massimo 10.
- Elenco file selezionati con possibilità di rimozione singola.
- Pulsanti footer: **`Annulla`** (chiude modale), **`Esegui estrazione IA`** (abilitato quando almeno 1 file selezionato).

### 5.3 Layout modale — step 2: review (dopo estrazione riuscita)

Titolo invariato.

Sezione header:
- **Fornitore** (select, prefillata se match trovato, altrimenti editabile).
- **Numero preventivo** (input text, prefillato da `document.number`).
- **Data preventivo** (input date, prefillata da `document.date` convertita in `yyyy-mm-dd`).
- **Valuta** (select CHF/EUR, prefillata da `document.currency`; default CHF).

Sezione righe estratte (tabella editabile):
- Colonne: `Descrizione`, `Codice articolo`, `Unità`, `Prezzo unitario`, `Stato`, `Delta`, `Azioni`.
- `Stato`: badge `NUOVO` | `GIA ESISTE (codice)` | `GIA ESISTE (descrizione)`, calcolato per riga confrontando con il listino corrente del fornitore selezionato.
- `Delta`: se stato è "GIA ESISTE" e valuta compatibile, mostrare `+X.XX` o `-X.XX` con riferimento al prezzo precedente (funzione equivalente a `iaRowsAnalysis` madre `src/pages/Acquisti.tsx:3238-3302`).
- `Azioni`: `Modifica` (apre editor inline della riga), `Elimina` (rimuove dalla review).
- Footer tabella: pulsante **`Aggiungi riga`** (aggiunge riga vuota manuale alla review).

Pulsanti footer modale:
- **`Annulla`** (chiude modale senza salvare; file già caricati su Storage restano come orfani — vedi §7.3).
- **`Salva preventivo e aggiorna listino`** (esegue il flusso §7).

### 5.4 Stati di loading ed errore

- Durante estrazione: overlay con testo `Estrazione IA in corso...`. Disabilita tutti i controlli.
- Errore estrazione: banner rosso con messaggio.
  - Per response 400 `validation_error`: `File non valido. Verifica che sia un PDF o un'immagine supportata.`
  - Per response 503 `provider_not_configured`: `Servizio IA non configurato. Contatta l'amministratore.`
  - Per response 502 `upstream_error`: `Estrazione IA non riuscita. Verifica file e riprova.`
  - Per errore di rete: `Servizio IA non raggiungibile. Verifica la connessione.`
- Durante salvataggio: overlay con testo `Salvataggio in corso...`. Disabilita tutti i controlli.
- Errore salvataggio: `window.alert` (coerente con §9.5 della SPEC manuale v2) con il messaggio specifico (upload fallito / preventivo fallito / listino fallito).
- Successo: chiude modale e chiama callback `onPreventivoSaved` per refresh snapshot.

### 5.5 Validazioni bloccanti al salvataggio (step 2)

- `fornitoreId` obbligatorio.
- `numeroPreventivo` non vuoto.
- `dataPreventivo` valido.
- Almeno 1 riga in review.
- Ogni riga deve avere `descrizione` non vuota, `unita` non vuota, `prezzoUnitario > 0`.

Stile validazione: inline (colore bordo rosso + messaggio sotto il campo). **Vietato** `window.alert` per validazione di form (coerente con SPEC manuale v2 §9.5).

---

## 6. ESTENSIONE WRITER `nextPreventivoManualeWriter.ts`

### 6.1 Strategia: estensione additiva (W1)

Il writer manuale esistente (`src/next/nextPreventivoManualeWriter.ts`) va **esteso additivamente**. Ciò significa:

- I tipi `SaveNextPreventivoManualeInput` e `SaveAndUpsertParams` ricevono nuovi campi **opzionali**.
- La logica esistente continua a funzionare invariata se i nuovi campi sono assenti o `null`.
- Il flusso IA passa i nuovi campi valorizzati.

**Il manuale non deve cambiare comportamento osservabile.** La checklist post-impl §10 include la verifica di non-regressione.

### 6.2 Estensioni ai tipi

#### `SaveNextPreventivoManualeInput` (oggi in `src/next/nextPreventivoManualeWriter.ts`)

Aggiungere campi opzionali:
- `pdfFile?: File | null` — PDF da caricare, se presente.
- `pdfStoragePath?: string | null` — path Storage già noto (se già caricato altrove, non ri-upload).
- `pdfUrl?: string | null` — URL pubblico, se già noto.
- `imageStoragePrefix?: string | null` — prefisso Storage alternativo a `preventivi/manuali/`. Se popolato con `"preventivi/ia/"`, le `foto` vengono caricate lì invece che nel prefisso manuale.

Regole di coesistenza:
- Se `pdfFile` popolato → upload in `{imageStoragePrefix ?? "preventivi/manuali/"}/<preventivoId>.pdf`. Il path è deciso dal prefisso; se il prefisso è `"preventivi/ia/"`, il PDF va in `preventivi/ia/<preventivoId>.pdf` coerentemente con la madre (`src/pages/Acquisti.tsx:3458`).
- Se `pdfFile` assente ma `pdfStoragePath` popolato → il writer non fa upload, referenzia il path esistente.
- Se `foto` popolato e `imageStoragePrefix` popolato → upload in `<imageStoragePrefix><preventivoId>_<n>.<ext>`.
- Se `foto` popolato e `imageStoragePrefix` assente → comportamento invariato (prefisso `preventivi/manuali/`).

#### `SaveAndUpsertParams`

Aggiungere campo opzionale:
- `fonteAttualePdfFields?: { pdfStoragePath: string | null; pdfUrl: string | null } | null`

Se popolato, la funzione `upsertListinoFromPreventivoManuale` usa questi valori in `fonteAttuale.pdfStoragePath` e `fonteAttuale.pdfUrl` invece di `null` hardcoded (oggi `src/next/nextPreventivoManualeWriter.ts:293`).

Se assente o `null`, comportamento invariato (valori a `null`).

### 6.3 Estensioni alla logica interna

#### `saveNextPreventivoManuale`

- Se `pdfFile` popolato: upload via `uploadBytes` wrapper in `{imageStoragePrefix ?? "preventivi/manuali/"}<preventivoId>.pdf`. Ottenere `pdfStoragePath` e `pdfUrl` via `getDownloadURL`.
- Se `pdfFile` assente ma `pdfStoragePath` fornito: usare quello, non fare upload del PDF.
- Se `pdfStoragePath` esterno e `pdfUrl` assente: non provare a derivare l'URL; lasciare `pdfUrl: null`. (Caso raro, documentato come antipattern.)
- Costruire `Preventivo.pdfStoragePath` e `Preventivo.pdfUrl` di conseguenza, invece di `null` hardcoded (oggi `src/next/nextPreventivoManualeWriter.ts:221-222`).

#### `upsertListinoFromPreventivoManuale`

- Accettare parametro aggiuntivo `fonteAttualePdfFields`.
- Se popolato: usare i valori forniti nei campi `fonteAttuale.pdfStoragePath` e `fonteAttuale.pdfUrl`.
- Altrimenti: comportamento invariato.

#### `saveAndUpsert`

Orchestra invariato. Si limita a propagare `fonteAttualePdfFields` a `upsertListinoFromPreventivoManuale`.

### 6.4 Barrier compatibility

Il writer manuale oggi autorizza upload solo su `preventivi/manuali/` (barrier `src/utils/cloneWriteBarrier.ts:29, 382`). Dopo la modifica §8 del barrier, anche `preventivi/ia/` sarà autorizzato per `/next/materiali-da-ordinare`. Il writer userà il prefisso passato via `imageStoragePrefix`; il barrier lo validerà.

---

## 7. FLUSSO END-TO-END DEL CONSUMER IA

### 7.1 Step 1 — Upload e chiamata estrazione

1. Utente apre modale, sceglie PDF o immagini, seleziona file.
2. Al click su "Esegui estrazione IA":
   - Il componente costruisce il request body come §4.1.
   - I file vengono letti via `FileReader.readAsDataURL()` e convertiti in base64 (senza prefisso `data:...;base64,`).
   - `fetch` POST a `http://127.0.0.1:4310/internal-ai-backend/documents/preventivo-extract` con `Content-Type: application/json`.
   - Nota: i file in questa fase **non** vengono caricati su Storage. L'upload Storage avviene solo al salvataggio finale (§7.3).
3. Response 200: passa a step 2 con `data.result` come input.
4. Response ≠ 200 o errore di rete: mostra errore in modale (§5.4). Utente può riprovare o annullare.

### 7.2 Step 2 — Review e correzioni

1. Il componente popola lo stato:
   - `supplierMatch = resolveFornitoreFromExtract(result.supplier.name)` → se match, pre-seleziona `fornitoreId`.
   - `numeroPreventivo = result.document.number ?? ""`.
   - `dataPreventivo = formatExtractDateForInput(result.document.date)` — conversione `dd/mm/yyyy` → `yyyy-mm-dd`.
   - `valuta = normalizeExtractCurrency(result.document.currency) ?? "CHF"`.
   - `rigeEditabili = result.items.filter(i => i.description && i.unitPrice > 0).map(mapExtractedRowToRigaEditabile)`.
2. Per ogni riga, calcola `rowAnalysis` confrontando con `storage/@listino_prezzi` letto dallo snapshot corrente (stesso meccanismo madre).
3. Utente può:
   - Modificare header (fornitore, numero, data, valuta).
   - Modificare righe (descrizione, codice, unita, prezzo).
   - Rimuovere righe.
   - Aggiungere righe manuali.

### 7.3 Step 3 — Salvataggio atomico

Al click su "Salva preventivo e aggiorna listino":

1. **Validazione** (§5.5). Se KO → feedback inline, non procede.
2. **Upload Storage** dei file originali:
   - Se PDF: `uploadBytes` wrapper su `preventivi/ia/<preventivoId>.pdf`. Ottiene `pdfStoragePath` e `pdfUrl`.
   - Se immagini: `uploadBytes` wrapper per ciascuna su `preventivi/ia/<preventivoId>_<n>.<ext>`. Ottiene `imageStoragePaths[]` e `imageUrls[]`.
   - Se upload fallisce → `window.alert` con errore, nessuna scrittura Firestore, i file parzialmente caricati restano come orfani (accettabile, coerente con madre §1.10 audit).
3. **Chiamata writer esteso**:
   ```ts
   await saveAndUpsert({
     input: {
       fornitoreId,
       fornitoreNome,
       numeroPreventivo,
       dataPreventivo,
       foto: [],  // nessuna foto da uploadare, già caricato sopra
       pdfStoragePath, pdfUrl,  // popolati dallo step 2
       imageStoragePaths, imageUrls,  // popolati dallo step 2
       imageStoragePrefix: "preventivi/ia/",  // per coerenza, anche se foto=[] significa no-op
       righe,
     },
     valuta,
     codiciArticoloPerRiga,
     fonteAttualePdfFields: { pdfStoragePath, pdfUrl },
   });
   ```
4. **Errori**:
   - Upload fallito: errore bloccante, nessuna scrittura Firestore.
   - Preventivo fallito: errore bloccante, nessun upsert listino.
   - Upsert listino fallito dopo preventivo salvato: errore segnalato, preventivo resta salvato (comportamento attuale `saveAndUpsert`).
5. **Successo**: chiude modale, chiama `onPreventivoSaved()` per refresh snapshot (stesso pattern manuale `NextMaterialiDaOrdinarePage.tsx`).

Nota sull'alternativa considerata: era possibile **non** caricare su Storage prima dell'estrazione e caricare tutto solo al save. Questa è la scelta adottata qui (più semplice, meno orfani, coerente con §7.1 che non fa upload pre-estrazione). La madre invece fa upload pre-estrazione perché Gemini legge da Storage; OpenAI riceve base64 via HTTP e non richiede upload pre-estrazione.

### 7.4 Annulla dopo estrazione

Se l'utente clicca "Annulla" dopo step 1 o durante step 2: la modale si chiude, nessun file è stato caricato su Storage, nessuna scrittura Firestore. Zero sporcizia.

---

## 8. ESTENSIONE `cloneWriteBarrier.ts`

### 8.1 Aggiungere prefisso Storage `preventivi/ia/` per `/next/materiali-da-ordinare`

Oggi (`src/utils/cloneWriteBarrier.ts:29`):
```ts
const MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES = ["preventivi/manuali/"] as const;
```

Estendere a:
```ts
const MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES = ["preventivi/manuali/", "preventivi/ia/"] as const;
```

### 8.2 Aggiungere whitelist fetch per endpoint backend IA

Modellare sull'esempio Euromecc (`src/utils/cloneWriteBarrier.ts:41-42, 228-238, 328-339`). Serve:

- Un set costante con l'URL completo autorizzato: `http://127.0.0.1:4310/internal-ai-backend/documents/preventivo-extract`.
- Un predicato helper `isAllowedMaterialiDaOrdinareIaFetch(url)` che ritorna true solo per l'URL esatto (o match del path equivalente su host `127.0.0.1`, coerente con come è fatto Euromecc).
- Integrazione del predicato nel dispatcher `isAllowedCloneWriteException` (`src/utils/cloneWriteBarrier.ts:275` e dintorni), nel branch pertinente a `/next/materiali-da-ordinare`.

**L'implementatore leggerà il codice reale di Euromecc e replicherà la stessa forma, adattando i nomi**. La SPEC non prescrive i nomi esatti per evitare collisioni che solo la lettura del file può rivelare.

### 8.3 Nessuna modifica al predicato generico di blocco

Il predicato `shouldBlockFetchInClone(...)` (`src/utils/cloneWriteBarrier.ts:481-507`) elenca pattern mutating noti. Il nuovo endpoint `internal-ai-backend/documents/preventivo-extract` **non** va aggiunto lì: quel predicato blocca per default tutto ciò che non è esplicitamente autorizzato, e la whitelist §8.2 è la via corretta.

### 8.4 Firestore: nessuna estensione

La whitelist Firestore per `/next/materiali-da-ordinare` già autorizza `storage/@preventivi` e `storage/@listino_prezzi` (`src/utils/cloneWriteBarrier.ts:25, 378`). Nessuna modifica necessaria.

---

## 9. PERIMETRO FILE

### 9.1 CREA

- `src/next/NextPreventivoIaModal.tsx` — componente modale consumer IA (§5).
- `src/next/nextPreventivoIaClient.ts` — helper dedicato per la chiamata HTTP all'endpoint backend (`fetch` con costruzione body, parsing envelope, mappatura errori a messaggi UI). Mantiene il componente modale pulito da dettagli di transport.
- `src/next/nextPreventivoIaHelpers.ts` — helper di business: `resolveFornitoreFromExtract`, `mapExtractedRowsToPreventivo`, `computeRowAnalysis`, `formatExtractDateForInput`, `normalizeExtractCurrency`. Replica delle funzioni madre (§4.4) nel perimetro NEXT.
- `docs/change-reports/<YYYY-MM-DD_HHMM>_preventivo_ia_consumer_next.md` — change report standard.
- `docs/continuity-reports/<YYYY-MM-DD_HHMM>_continuity_preventivo_ia_consumer_next.md` — continuity report standard.

### 9.2 MODIFICA

- `src/next/nextPreventivoManualeWriter.ts` — estensione additiva §6.
- `src/next/NextProcurementConvergedSection.tsx` — sostituzione placeholder "CARICA PREVENTIVO" + rendering modale IA + propagazione callback `onPreventivoSaved`.
- `src/next/NextMaterialiDaOrdinarePage.tsx` — se serve estrarre loader snapshot come callable per refresh post-save (stesso pattern SPEC manuale v2 §9.2). Se già pronto, nessuna modifica.
- `src/utils/cloneWriteBarrier.ts` — §8.1 + §8.2.
- `docs/product/STATO_MIGRAZIONE_NEXT.md` — APPEND ONLY.
- `docs/product/REGISTRO_MODIFICHE_CLONE.md` — APPEND ONLY.
- `CONTEXT_CLAUDE.md` — APPEND ONLY.

### 9.3 VIETATI

- `src/pages/Acquisti.tsx` (madre).
- `functions/index.js` (callable Gemini madre).
- `backend/internal-ai/**` (backend chiuso).
- `src/next/domain/nextProcurementDomain.ts`.
- `src/next/domain/nextFornitoriDomain.ts`.
- `src/next/NextPreventivoManualeModal.tsx` (manuale invariato).
- `src/utils/firestoreWriteOps.ts` (solo import).
- `src/utils/storageWriteOps.ts` (solo import).
- Qualsiasi altra spec in `docs/product/` o `docs/_live/spec/`.
- Qualsiasi change-report o continuity-report preesistente: solo append, mai modifica.

---

## 10. CHECKLIST POST-IMPLEMENTAZIONE

### 10.1 Lint e build

1. [ ] `npx eslint` sui file toccati → OK.
2. [ ] `npm run build` → OK.

### 10.2 Non-regressione flusso manuale

3. [ ] Aprire `/next/materiali-da-ordinare?tab=preventivi`.
4. [ ] Pulsante "PREVENTIVO MANUALE" presente e funzionante.
5. [ ] Salvare un preventivo manuale senza foto → preventivo appare, listino aggiornato, `pdfStoragePath: null`, `pdfUrl: null` (comportamento pre-modifica preservato).
6. [ ] Salvare un preventivo manuale con 2 foto → foto su `preventivi/manuali/<id>_1.jpg`, `<id>_2.jpg` (prefisso manuale invariato).
7. [ ] Console: zero `[CLONE_NO_WRITE]` preesistenti.

### 10.3 Flusso IA — step 1

8. [ ] Pulsante "CARICA PREVENTIVO IA" presente (sostituisce il placeholder).
9. [ ] Click apre modale titolata "Estrazione preventivo con IA".
10. [ ] Radio PDF / Immagini visibile e funzionante.
11. [ ] Selezione PDF: accettato solo `application/pdf`.
12. [ ] Selezione Immagini: accettate solo `image/*`, massimo 10.
13. [ ] Al click "Esegui estrazione IA" con PDF reale → request al backend va a buon fine, passa a step 2.
14. [ ] Backend spento → messaggio `Servizio IA non raggiungibile. Verifica la connessione.`
15. [ ] Backend senza OPENAI_API_KEY → messaggio `Servizio IA non configurato. Contatta l'amministratore.`
16. [ ] Estrazione fallita upstream → messaggio `Estrazione IA non riuscita. Verifica file e riprova.`

### 10.4 Flusso IA — step 2 review

17. [ ] Header prefillato: fornitore pre-selezionato se match trovato, numero e data prefillati, valuta prefillata.
18. [ ] Righe filtrate (solo `description` non vuota e `unitPrice > 0`).
19. [ ] Per ogni riga, badge stato coerente (`NUOVO` / `GIA ESISTE (codice)` / `GIA ESISTE (descrizione)`).
20. [ ] Per righe "GIA ESISTE" con valuta compatibile: badge delta `+/-/=` visibile.
21. [ ] Editing inline di una riga funziona e aggiorna lo stato.
22. [ ] `Elimina riga` funziona.
23. [ ] `Aggiungi riga` funziona (riga vuota modificabile).

### 10.5 Flusso IA — salvataggio

24. [ ] Validazione senza fornitore → feedback inline, salva bloccato.
25. [ ] Validazione riga con prezzo 0 → feedback inline.
26. [ ] Salva con PDF:
      - `preventivi/ia/<id>.pdf` presente su Storage.
      - Documento in `storage/@preventivi` con `pdfStoragePath` e `pdfUrl` popolati.
      - Listino aggiornato con `fonteAttuale.pdfStoragePath` e `pdfUrl` popolati (non più `null`).
27. [ ] Salva con 2 immagini:
      - `preventivi/ia/<id>_1.jpg`, `<id>_2.jpg` su Storage.
      - Documento in `storage/@preventivi` con `imageStoragePaths[]` e `imageUrls[]` popolati.
28. [ ] Modale si chiude dopo salvataggio.
29. [ ] Snapshot NEXT refresh: il nuovo preventivo compare immediatamente in elenco.
30. [ ] Aprire `/acquisti` madre: preventivo IA compare, "APRI DOCUMENTO" apre il PDF / la prima foto correttamente.
31. [ ] Aprire listino madre: voce aggiornata mostra trend e prezzi correttamente.

### 10.6 Barrier

32. [ ] Console: zero `[CLONE_NO_WRITE]` durante tutto il flusso IA.
33. [ ] Console: zero `[CLONE_NO_FETCH]` durante la chiamata al backend IA.

### 10.7 Annulla

34. [ ] Cliccare "Annulla" a modale aperta, prima di estrazione → chiude, zero modifiche.
35. [ ] Cliccare "Annulla" dopo estrazione, prima di salvare → chiude, zero scritture Firestore, zero upload Storage.

---

## 11. ANTI-PATTERN

- ❌ Modificare il backend IA NEXT (`backend/internal-ai/**`).
- ❌ Modificare la callable Gemini madre (`functions/index.js`).
- ❌ Modificare `src/pages/Acquisti.tsx`.
- ❌ Duplicare il writer manuale: usare estensione additiva W1.
- ❌ Modificare `NextPreventivoManualeModal.tsx`.
- ❌ Aggiungere campi non opzionali ai tipi del writer manuale (romperebbe il flusso manuale).
- ❌ Usare Gemini o qualsiasi altro provider: la capability backend NEXT usa solo OpenAI.
- ❌ Caricare file su Storage prima dell'estrazione (pattern madre, non adatto a OpenAI base64).
- ❌ Usare prefisso Storage diverso da `preventivi/ia/` per il flusso IA.
- ❌ Autorizzare nel barrier URL diversi da `http://127.0.0.1:4310/internal-ai-backend/documents/preventivo-extract`.
- ❌ Saltare la whitelist del barrier e usare `fetch` diretto: violerebbe il pattern clone-safe.
- ❌ Usare `window.alert` per validazione form.
- ❌ Scrivere direttamente su Firestore senza passare dai wrapper.
- ❌ Replicare il flusso bozza listino + "Conferma import" della madre: atto unico come da D3.
- ❌ Accettare response con `schemaVersion` diverso da `"preventivo_price_extract_v1"`.
- ❌ Prefillare righe con `unitPrice` ≤ 0 (pre-filtro obbligatorio).
- ❌ Creare fornitori al volo durante il match (match o scelta utente, niente altro).
- ❌ Introdurre librerie nuove.
- ❌ Introdurre env var nuove.
- ❌ Modificare voci esistenti in registro/stato/context: solo append.

---

**Fine spec v1 (bozza).** Questa spec **non è approvata** finché Codex non esegue il prompt di verifica spec-vs-codice e conferma divergenze = 0.
