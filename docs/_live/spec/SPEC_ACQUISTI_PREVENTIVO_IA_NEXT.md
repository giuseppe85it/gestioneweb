# SPEC_ACQUISTI_PREVENTIVO_IA_NEXT — v1.1 (BOZZA DA VERIFICARE)

> **Stato:** BOZZA. Non implementare prima del prompt di verifica spec-vs-codice a Codex e della chiusura con divergenze = 0.
>
> **Fonte primaria di verità** per l'aggiunta di una nuova capability IA nel backend NEXT che replichi l'estrazione dati dai preventivi oggi gestita dalla callable Firebase `estraiPreventivoIA` (Gemini) della madre, sostituendo il provider con OpenAI, in coerenza con il backend IA NEXT già operativo.
>
> Questo documento è redatto a partire dall'**audit duplice Codex del 2026-04-22** (PROMPT 14) e corretto dopo la verifica spec-vs-codice Codex del 2026-04-22 (PROMPT 15) che ha rilevato 3 divergenze. Ogni affermazione tecnica è ancorata a `path:riga` ed è verificabile. In caso di divergenza tra spec e codice reale, il codice reale prevale: l'implementatore deve fermarsi e segnalare, non reinterpretare.
>
> **Perimetro di questa fase:** **SOLO BACKEND**. Il consumer NEXT frontend (pagina, bridge, barrier) è fuori scope e sarà oggetto di una SPEC separata in fase successiva.
>
> **Versione:** v1.1 bozza del 2026-04-22.
>
> **Changelog v1 → v1.1 (correzioni post-verifica Codex PROMPT 15):**
> - D7 (§2): rimosso riferimento a Responses API structured output; dichiarato il pattern reale usato dagli altri `/documents/*-analyze` (JSON via prompt + `parseProviderJson(response.output_text)`).
> - §4.4 e §5.3: rimossa la chiave `notes` dall'envelope 200 di successo (non presente nei tre `/documents/*-analyze` esistenti).
> - §3 punto 9, §6.3 e §7 punto 6: corretto l'affermazione "stateless"; la capability scrive 1 entry su `backend/internal-ai/runtime-data/ai_traceability_log.json` via `appendTraceabilityEntry`, coerentemente con gli altri `/documents/*-analyze`.

---

## 1. OBIETTIVO FUNZIONALE

Aggiungere al backend IA NEXT (`backend/internal-ai/**`) una nuova capability HTTP dedicata all'estrazione dati strutturati da preventivi (PDF o fino a 10 immagini), che:

1. usa **OpenAI Responses API** lato server, coerentemente con le altre capability `/documents/*-analyze` già presenti;
2. restituisce un **contratto JSON identico** a quello prodotto oggi dalla callable Gemini madre `estraiPreventivoIA`, ovvero `schemaVersion: "preventivo_price_extract_v1"` con shape `{ document, supplier, items, warnings }`;
3. è **funzionalmente sostitutiva** della callable Gemini per i consumer NEXT futuri, senza richiedere al frontend di adattarsi a una nuova shape.

La capability **non sostituisce** la callable Gemini per la madre: `src/pages/Acquisti.tsx` continua a usare `estraiPreventivoIA`. La nuova capability è pensata per essere consumata da un futuro flusso NEXT.

---

## 2. DECISIONI DI DESIGN (NON NEGOZIABILI)

| # | Decisione | Valore |
|---|-----------|--------|
| D1 | Contratto output | **Identico** a `preventivo_price_extract_v1` della madre (§4.1). Nessuna variante, nessun campo aggiuntivo, nessun rename. |
| D2 | Endpoint | Nuovo route dedicato `POST /internal-ai-backend/documents/preventivo-extract` |
| D3 | Pattern upload | **Base64 diretto HTTP**, come gli altri `/documents/*-analyze`. Nessun Firebase Storage intermedio. |
| D4 | Input | PDF singolo **oppure** fino a 10 immagini via `pages[]`. I due input sono **mutuamente esclusivi**. |
| D5 | Workflow preview/approval | **Nessuno**. La capability ritorna il JSON direttamente, come la callable Gemini. |
| D6 | Provider | OpenAI Responses API. Modello = `INTERNAL_AI_OPENAI_MODEL` env, default `gpt-5-mini`, invariato rispetto agli altri endpoint. |
| D7 | JSON enforcement | Il JSON è richiesto **via prompt** e parsato lato server con `parseProviderJson(response.output_text)`, coerentemente con gli altri `/documents/*-analyze` (`backend/internal-ai/server/internal-ai-document-extraction.js:1802-1831, 1901-1920`). Nessun uso di `response_format` o `json_schema` su OpenAI Responses API. Nessun fallback heuristic locale. Il normalizer server-side (§5.5) è la guardia finale di conformità al contratto. |
| D8 | Error envelope | Stesso pattern degli altri `/documents/*-analyze`: HTTP 400 `validation_error`, 503 `provider_not_configured`, 502 `upstream_error`, 200 ok. |

---

## 3. VINCOLI ARCHITETTURALI ASSOLUTI

1. **NON MODIFICARE** `functions/index.js` (callable Gemini madre): la callable `estraiPreventivoIA` deve rimanere identica.
2. **NON MODIFICARE** `src/pages/Acquisti.tsx` (madre).
3. **NON MODIFICARE** gli endpoint esistenti `/documents/manutenzione-analyze`, `/documents/documento-mezzo-analyze`, `/documents/preventivo-magazzino-analyze`, `/documents/euromecc/pdf-analyze`.
4. **NON MODIFICARE** `src/utils/cloneWriteBarrier.ts`: in questa fase non c'è consumer frontend, quindi non è necessaria nessuna whitelist.
5. **NON MODIFICARE** nessun file sotto `src/**`: questa fase è solo backend.
6. **NON MODIFICARE** i contratti del layer mock-safe in `backend/internal-ai/src/**`: la nuova capability è HTTP-only, non mock-safe in-process (coerente con `manutenzione-analyze`, `documento-mezzo-analyze`, `preventivo-magazzino-analyze`).
7. **NON INTRODURRE** nuove env var oltre quelle già presenti (`OPENAI_API_KEY`, `INTERNAL_AI_OPENAI_MODEL`).
8. **NON INTRODURRE** librerie nuove. Usare `openai` già presente in `backend/internal-ai/package.json`.
9. **NON SCRIVERE** dati business. L'**unica** scrittura runtime consentita è l'append di una entry su `backend/internal-ai/runtime-data/ai_traceability_log.json` tramite il medesimo helper `appendTraceabilityEntry(...)` già usato dagli altri `/documents/*-analyze` (`backend/internal-ai/server/internal-ai-persistence.js:11, 210-218`; invocazioni di riferimento: `backend/internal-ai/server/internal-ai-adapter.js:1614-1623, 1726-1734, 1846-1855`). **Nessun altro file** in `backend/internal-ai/runtime-data/**` deve essere creato o modificato.

---

## 4. FATTI TECNICI DAL CODICE REALE (AUDIT CODEX 2026-04-22)

### 4.1 Contratto output legacy `preventivo_price_extract_v1` (fonte: madre)

Prompt integrale Gemini in `functions/index.js:393-435`. Shape output normalizzato in `functions/index.js:444-579` (funzione `normalizePreventivoOutput`). Shape finale:

```json
{
  "schemaVersion": "preventivo_price_extract_v1",
  "document": {
    "number": "string|null",
    "date": "dd/mm/yyyy|null",
    "currency": "CHF|EUR|null",
    "confidence": 0.0
  },
  "supplier": {
    "name": "string|null",
    "confidence": 0.0
  },
  "items": [
    {
      "description": "string|null",
      "articleCode": "string|null",
      "uom": "string|null",
      "unitPrice": "number|null",
      "currency": "CHF|EUR|null",
      "confidence": 0.0
    }
  ],
  "warnings": [
    {
      "code": "MISSING_CURRENCY|MISSING_UNIT_PRICE|LIKELY_TOTAL_PRICE|PARTIAL_TABLE|LOW_CONFIDENCE",
      "severity": "info|warn|error",
      "message": "string"
    }
  ]
}
```

Regole del contratto (da prompt madre):
- Mai `undefined`: usare `null` se il dato non è disponibile.
- Date `dd/mm/yyyy`.
- Valute ammesse: `CHF` o `EUR`. Ogni altra valuta → `null` + warning `MISSING_CURRENCY`.
- Enum warning **chiuso**: solo i 5 codici elencati.

### 4.2 Prompt madre (testo letterale)

Letterale da `functions/index.js:393-435`:

```
Leggi il documento di preventivo allegato (PDF o immagini).
Estrai SOLO dati prezzo utili e rispondi SOLO con JSON valido.
Non usare mai undefined: usa null se il dato non e disponibile.
Date nel formato dd/mm/yyyy.
Valute ammesse: CHF o EUR.

Schema obbligatorio:
{ ...schema sopra... }
File originale: <nome file se presente>
```

Il prompt OpenAI della nuova capability **può essere testualmente diverso** dal prompt Gemini (Codex sceglierà il wording più adatto al provider OpenAI), ma deve produrre output **semanticamente e strutturalmente identico** al contratto §4.1. Le regole (no `undefined`, date `dd/mm/yyyy`, enum warning chiuso, valute `CHF|EUR`) devono essere preservate letteralmente.

### 4.3 Pattern OpenAI esistente nel backend NEXT

Fonte: audit Codex §B4 e §B3.
- Libreria: `openai` in `backend/internal-ai/package.json`.
- Client: `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })` in `backend/internal-ai/server/internal-ai-adapter.js:4,401-412`.
- API: **sempre Responses API** (`providerTarget` dichiarato come tale in `backend/internal-ai/server/internal-ai-adapter.js:373-378`).
- Modello default: `gpt-5-mini`, override via env `INTERNAL_AI_OPENAI_MODEL` (`backend/internal-ai/server/internal-ai-adapter.js:373-378`).
- Multimodale: PDF come `input_file`, immagini come `input_image`, helper in `backend/internal-ai/server/internal-ai-document-extraction.js:1842-1899`, gestione `pages[]` in `backend/internal-ai/server/internal-ai-document-extraction.js:2040-2067`.
- Testo passato al provider tagliato a 18.000 caratteri (`backend/internal-ai/server/internal-ai-document-extraction.js:1824`).
- Limite body JSON Express: 12 MB (`backend/internal-ai/server/internal-ai-adapter.js:55`).

### 4.4 Pattern endpoint `/documents/*-analyze` esistenti (riferimento)

Codex conferma tre endpoint strutturati dello stesso pattern:
- `/internal-ai-backend/documents/manutenzione-analyze` (`backend/internal-ai/server/internal-ai-adapter.js:1520-1667`)
- `/internal-ai-backend/documents/documento-mezzo-analyze` (`backend/internal-ai/server/internal-ai-adapter.js:1669-1792`)
- `/internal-ai-backend/documents/preventivo-magazzino-analyze` (`backend/internal-ai/server/internal-ai-adapter.js:1794-1897`)

Questi endpoint sono il **riferimento di stile** per il nuovo route. In particolare:
- `preventivo-magazzino-analyze` è la baseline strutturale più vicina.
- `manutenzione-analyze` è il riferimento per il supporto `pages[]` multi-immagine.

Elementi ricorrenti:
- Validazione input → 400 `validation_error`.
- Provider non configurato (`OPENAI_API_KEY` assente) → 503 `provider_not_configured`.
- Errore upstream OpenAI → 502 `upstream_error`.
- Risposta ok → 200 con envelope `{ ok: true, endpointId, status: "ok", message, data: { analysis, providerTarget, traceEntryId } }` (verificato su `backend/internal-ai/server/internal-ai-adapter.js:1631-1649, 1759-1774, 1864-1879`).

**Deviazione consapevole della nuova capability rispetto al pattern:** la chiave dentro `data` per la nuova capability è `result` (contenente il payload `preventivo_price_extract_v1` puro), **non** `analysis` come negli altri endpoint. Questa scelta è voluta per esporre al consumer futuro il contratto legacy "pulito", senza wrapping intermedio `analysis`.

### 4.5 Helper extraction esistente

Fonte: audit Codex §B3.1, §B4.3.
File: `backend/internal-ai/server/internal-ai-document-extraction.js`.

Codex ha osservato che questo file contiene:
- la funzione principale di estrazione (chiamata dagli endpoint `/documents/*-analyze`);
- i prompt system dedicati per ciascun tipo documento (`manutenzione`, `documento_mezzo`, `preventivo_magazzino`);
- gli schema JSON associati;
- il parser multimodale `input_file` / `input_image` / `pages[]`;
- il fallback heuristic locale per `attachments.repository`.

L'implementatore, prima di scrivere, **deve leggere il file reale** per capire il pattern esatto di definizione prompt + schema + chiamata. La nuova capability deve seguire lo stesso pattern, aggiungendo:
- un nuovo system prompt `preventivo_price_extract` (nome interno proposto, l'implementatore verificherà che non collida con identificatori esistenti);
- un nuovo schema JSON coerente con §4.1;
- un nuovo normalizer che garantisca l'output §4.1 byte-identico al contratto legacy.

### 4.6 Ciò che il backend NEXT **non** ha oggi (gap confermato)

Confermato da audit Codex §C:
- Nessun endpoint che emetta il contratto `preventivo_price_extract_v1`.
- Nessun prompt OpenAI dedicato a questo shape.
- `/preventivo-magazzino-analyze` emette shape diversa (`analysis { ..., voci }`), quindi non è riusabile as-is.
- `pages[]` fino a 10 immagini è supportato dall'helper ma non esposto dal route preventivo attuale.

---

## 5. CONTRATTO HTTP DELLA NUOVA CAPABILITY

### 5.1 Endpoint

```
POST /internal-ai-backend/documents/preventivo-extract
```

### 5.2 Request body

Due varianti mutuamente esclusive, esattamente come la callable Gemini madre (`functions/index.js:600-620`).

**Variante PDF singolo:**
```json
{
  "fileName": "string",
  "mimeType": "application/pdf",
  "contentBase64": "string",
  "originalFileName": "string|null"
}
```

**Variante multi-immagine (fino a 10 immagini):**
```json
{
  "pages": [
    { "fileName": "string", "mimeType": "image/jpeg|image/png|...", "contentBase64": "string" }
  ],
  "originalFileName": "string|null"
}
```

Regole validazione:
- Deve essere presente **esattamente una** delle due varianti (`contentBase64` singolo XOR `pages[]`). Se entrambi o nessuno → 400 `validation_error`.
- `pages.length` ≤ 10 (coerente con madre `functions/index.js:609-614`).
- `pages[].mimeType` deve iniziare con `image/`. PDF in `pages[]` → 400.
- Variante singola: `mimeType` = `application/pdf` OPPURE inizia con `image/` (per compatibilità single-image).
- `contentBase64` non vuoto per ciascun file.

### 5.3 Response body — successo (HTTP 200)

Envelope HTTP coerente con gli altri endpoint, verificato su `backend/internal-ai/server/internal-ai-adapter.js:1631-1649, 1759-1774, 1864-1879`:

```json
{
  "ok": true,
  "endpointId": "documents.preventivo-extract",
  "status": "ok",
  "message": "Estrazione preventivo completata.",
  "data": {
    "result": { /* payload preventivo_price_extract_v1 §4.1 */ },
    "providerTarget": { /* oggetto providerTarget coerente con altri endpoint */ },
    "traceEntryId": "string"
  }
}
```

La chiave `result` dentro `data` contiene **esattamente** lo shape `preventivo_price_extract_v1` (§4.1), senza wrapping ulteriore. **Nessuna chiave `notes`** nell'envelope 200 di successo (coerente con gli altri `/documents/*-analyze`). La chiave `notes` è ammessa solo negli envelope di errore dove già presente negli endpoint esistenti.

### 5.4 Response body — errori

- **HTTP 400 `validation_error`**: input non valido (shape, XOR violato, limite 10 immagini superato, mime non ammesso, base64 vuoto).
- **HTTP 503 `provider_not_configured`**: `OPENAI_API_KEY` assente o client non inizializzato.
- **HTTP 502 `upstream_error`**: errore OpenAI Responses API, risposta non parseable, risposta non conforme allo schema.
- In tutti gli errori: envelope coerente con gli altri `/documents/*-analyze` (`{ ok: false, endpointId: "documents.preventivo-extract", status, message, data }`).

### 5.5 Normalizzazione output

Prima di restituire, applicare normalizer che garantisce:
- `schemaVersion === "preventivo_price_extract_v1"` (hardcoded, non dipendente dall'LLM).
- `document.currency`, `items[].currency`: se non `"CHF"` né `"EUR"` → `null` + push warning `MISSING_CURRENCY`.
- `document.date`: se non `dd/mm/yyyy` valido → `null`.
- `items[].unitPrice`: numero finito positivo, altrimenti `null` + push warning `MISSING_UNIT_PRICE`.
- `confidence`: numero in `[0, 1]`, default `0.0`.
- `warnings[].code`: solo enum §4.1, qualsiasi altro codice → filtrato fuori.
- `warnings[].severity`: solo `info|warn|error`.
- Nessun campo `undefined` in nessun punto della risposta (convertito a `null`).

Riferimento comportamentale madre: `functions/index.js:444-579`. Il normalizer NEXT deve replicare le stesse regole; non è richiesto di copiare il codice byte-per-byte, ma il **risultato osservabile** deve essere indistinguibile.

---

## 6. PERIMETRO FILE

### 6.1 CREA

Nessun file nuovo strettamente obbligatorio. L'implementazione naturale è aggiungere codice a file esistenti (§6.2). Se l'implementatore ritiene indispensabile separare in un file dedicato (es. `backend/internal-ai/server/internal-ai-preventivo-extract.js`) per pulizia, è consentito **solo** se:
- Il file sta dentro `backend/internal-ai/server/`;
- Non introduce dipendenze esterne nuove;
- Non duplica codice già presente in `internal-ai-document-extraction.js` (preferire estensione dell'helper esistente).

Change-report e continuity-report: come da convenzione progetto (pattern SPEC manuale §8.1), se rilevante per il workflow corrente. Se non richiesto dal workflow, saltare.

### 6.2 MODIFICA

- `backend/internal-ai/server/internal-ai-adapter.js` — aggiungere il route `POST /internal-ai-backend/documents/preventivo-extract` seguendo lo stile degli altri `/documents/*-analyze` (`backend/internal-ai/server/internal-ai-adapter.js:1520-1897`).
- `backend/internal-ai/server/internal-ai-document-extraction.js` — aggiungere il nuovo prompt system + schema JSON + normalizer per `preventivo_price_extract_v1`. Estendere il pattern già presente per `manutenzione`, `documento_mezzo`, `preventivo_magazzino`.

### 6.3 VIETATI

- `src/pages/Acquisti.tsx` (madre)
- `functions/index.js` (callable Gemini madre)
- `src/utils/cloneWriteBarrier.ts`
- Qualsiasi file sotto `src/**`
- `backend/internal-ai/src/**` (layer mock-safe TypeScript)
- Endpoint esistenti `/documents/manutenzione-analyze`, `/documents/documento-mezzo-analyze`, `/documents/preventivo-magazzino-analyze`, `/documents/euromecc/pdf-analyze`, `/orchestrator/*`, `/artifacts/*`, `/approvals/*`, `/retrieval/*`, `/attachments/*`, `/memory/*`
- `backend/internal-ai/runtime-data/**` (nessuna persistenza)
- `backend/internal-ai/package.json` (nessuna nuova dipendenza)

---

## 7. REGOLE DI IMPLEMENTAZIONE (BACKEND)

1. **Coerenza stilistica**: il nuovo route deve essere indistinguibile per stile, logging, envelope, gestione errori dai tre endpoint `/documents/*-analyze` esistenti. In caso di dubbio, prevale la forma di `preventivo-magazzino-analyze` per la struttura, e di `manutenzione-analyze` per la parte `pages[]`.
2. **Provider target**: usare lo stesso helper `getProviderTarget()` già in uso (`backend/internal-ai/server/internal-ai-adapter.js:373-378`).
3. **Trace entry**: usare lo stesso meccanismo di `traceEntryId` già in uso negli altri `/documents/*-analyze`.
4. **Testo tagliato a 18.000 caratteri**: se il pattern esistente applica questo limite al testo passato al provider, mantenerlo anche qui (`backend/internal-ai/server/internal-ai-document-extraction.js:1824`).
5. **Nessun fallback heuristic locale**: a differenza di `attachments.repository`, qui se il provider fallisce si restituisce 502, non si produce un output sintetico locale.
6. **Scrittura runtime-data limitata al trace log**: la capability scrive esattamente una entry su `backend/internal-ai/runtime-data/ai_traceability_log.json` tramite `appendTraceabilityEntry(...)` (`backend/internal-ai/server/internal-ai-persistence.js:11, 210-218`), identicamente a quanto fanno gli altri `/documents/*-analyze` (`backend/internal-ai/server/internal-ai-adapter.js:1614-1623, 1726-1734, 1846-1855`). **Nessun altro file** in `backend/internal-ai/runtime-data/**` va creato o modificato. Il `traceEntryId` restituito nell'envelope 200 proviene da questo append.
7. **Nessuna modifica di `INTERNAL_AI_BACKEND_HANDLERS`** nel layer mock-safe TypeScript: la nuova capability è HTTP-only, coerente con gli altri `/documents/*-analyze` che non sono registrati nel dispatcher mock-safe (`backend/internal-ai/src/internalAiBackendHandlers.ts:588-660`).

---

## 8. CHECKLIST POST-IMPLEMENTAZIONE

1. [ ] `npx eslint` sui file toccati → OK
2. [ ] Il backend parte (`npm --prefix backend/internal-ai start`) senza errori
3. [ ] `GET /internal-ai-backend/health` risponde ok (smoke test endpoint esistente non regredito)
4. [ ] `POST /internal-ai-backend/documents/preventivo-extract` senza body → 400 `validation_error`
5. [ ] Stesso endpoint con `contentBase64` + `pages[]` entrambi popolati → 400 `validation_error`
6. [ ] Stesso endpoint con `pages[]` di 11 elementi → 400 `validation_error`
7. [ ] Senza `OPENAI_API_KEY` → 503 `provider_not_configured`
8. [ ] Chiamata valida con PDF reale di preventivo → 200, `data.result.schemaVersion === "preventivo_price_extract_v1"`, `data.result.document/supplier/items/warnings` presenti, zero campi `undefined`
9. [ ] Chiamata valida con `pages[]` di 3 immagini reali → 200, stesso contratto
10. [ ] Currency diversa da CHF/EUR nel PDF → output con `currency: null` + warning `MISSING_CURRENCY`
11. [ ] PDF privo di prezzi unitari chiari → warning `MISSING_UNIT_PRICE` o `LIKELY_TOTAL_PRICE` presenti
12. [ ] Smoke test: `POST /internal-ai-backend/documents/preventivo-magazzino-analyze` con la stessa richiesta continua a funzionare come prima (no regressione)
13. [ ] Smoke test: `POST /internal-ai-backend/documents/manutenzione-analyze` continua a funzionare come prima
14. [ ] Console server: nessun errore rosso non-preesistente
15. [ ] `git diff` tocca solo i file in §6.2 (più eventuali file §6.1 se creati)

---

## 9. ANTI-PATTERN

- ❌ Cambiare lo `schemaVersion` o aggiungere campi fuori contratto §4.1
- ❌ Wrappare il payload legacy sotto `analysis` invece di `result`
- ❌ Usare un nome chiave diverso da `result` in `data.result`
- ❌ Accettare payload con Firebase Storage path invece di base64
- ❌ Chiamare Firebase Storage dal backend NEXT per questo endpoint
- ❌ Superare il limite di 10 immagini
- ❌ Accettare PDF dentro `pages[]`
- ❌ Introdurre workflow preview/approval per questa capability
- ❌ Registrare la capability nel dispatcher mock-safe (`INTERNAL_AI_BACKEND_HANDLERS`)
- ❌ Modificare gli endpoint `/documents/*-analyze` esistenti
- ❌ Modificare `functions/index.js` o la callable Gemini madre
- ❌ Toccare `src/**` in questa fase
- ❌ Toccare `cloneWriteBarrier.ts` in questa fase
- ❌ Introdurre nuove env var
- ❌ Introdurre nuove dipendenze npm
- ❌ Introdurre un fallback heuristic locale
- ❌ Persistere file sotto `backend/internal-ai/runtime-data/**`
- ❌ Reinterpretare l'enum warning aggiungendo codici nuovi
- ❌ Cambiare il formato data da `dd/mm/yyyy`
- ❌ Emettere `undefined` in qualsiasi punto dell'output

---

**Fine spec v1 (bozza).** Questa spec **non è approvata** finché Codex non esegue il prompt di verifica spec-vs-codice e conferma divergenze = 0.
