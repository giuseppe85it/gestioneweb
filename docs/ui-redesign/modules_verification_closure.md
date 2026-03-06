# Chiusura moduli "DA VERIFICARE"

Data verifica: 2026-03-06  
Ambito: chiusura dei 6 moduli marcati "DA VERIFICARE" nel censimento precedente.

## Elenco moduli verificati (6)
1. `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
2. `functions-schede/index.js`
3. `functions-schede/estrazioneSchedaCisterna.js`
4. `functions-schede/cisternaDocumentiExtract.js`
5. `api/pdf-ai-enhance.ts`
6. Route alias `/acquisti/dettaglio/:ordineId` (`src/App.tsx`)

## 1) `CisternaSchedeTest`
- Stato finale: **ATTIVO MA SECONDARIO**
- Classificazione: **ibrido** (UI IA + CRUD dataset cisterna)
- Prove dal repo:
  - Route dedicata registrata in [src/App.tsx](../../src/App.tsx) (`import` a riga 53, route `/cisterna/schede-test` a riga 153).
  - Accesso dalla dashboard cisterna via `navigate('/cisterna/schede-test?...')` in [src/pages/CisternaCaravate/CisternaCaravatePage.tsx](../../src/pages/CisternaCaravate/CisternaCaravatePage.tsx:1314).
  - Lettura/scrittura Firestore nel file stesso:
    - `getDoc(doc(db, CISTERNA_SCHEDE_COLLECTION, ...))` ([src/pages/CisternaCaravate/CisternaSchedeTest.tsx](../../src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1043))
    - `getDocs(query(collection(db, CISTERNA_SCHEDE_COLLECTION)...))` ([src/pages/CisternaCaravate/CisternaSchedeTest.tsx](../../src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1153))
    - `updateDoc(... CISTERNA_SCHEDE_COLLECTION ...)` ([src/pages/CisternaCaravate/CisternaSchedeTest.tsx](../../src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1834))
    - `addDoc(collection(db, CISTERNA_SCHEDE_COLLECTION), ...)` ([src/pages/CisternaCaravate/CisternaSchedeTest.tsx](../../src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1854))
- Dati coinvolti:
  - Legge `@cisterna_schede_ia` e `storage/@rifornimenti_autisti_tmp` (via `RIFORNIMENTI_AUTISTI_KEY`).
  - Scrive `@cisterna_schede_ia`.
  - Carica immagini ritagliate su Firebase Storage (`uploadBytes`) ([src/pages/CisternaCaravate/CisternaSchedeTest.tsx](../../src/pages/CisternaCaravate/CisternaSchedeTest.tsx:2075)).
- Collocazione futura proposta:
  - **Sistema/Supporto (tool specialistico)**, non come modulo core utente finale.
- Impatto nuova app:
  - Mantenere come tool interno solo se la pipeline cisterna resta operativa; altrimenti candidabile a deprecazione controllata.

## 2) `functions-schede/index.js`
- Stato finale: **SUPPORTO TECNICO**
- Classificazione: **supporto backend**
- Prove dal repo:
  - Export endpoint HTTP:
    - `estrazioneSchedaCisterna` ([functions-schede/index.js](../../functions-schede/index.js:5))
    - `cisterna_documenti_extract` ([functions-schede/index.js](../../functions-schede/index.js:10))
  - Endpoint effettivamente referenziati dal client cisterna in [src/cisterna/iaClient.ts](../../src/cisterna/iaClient.ts:10) e [src/cisterna/iaClient.ts](../../src/cisterna/iaClient.ts:12).
- Dati coinvolti:
  - File router: non persiste dati; inoltra alle handler specializzate.
- Collocazione futura proposta:
  - **RESTA SISTEMA / SUPPORTO**.
- Impatto nuova app:
  - Va mantenuto finché i moduli cisterna usano gli endpoint HTTP dedicati.

## 3) `functions-schede/estrazioneSchedaCisterna.js`
- Stato finale: **SUPPORTO TECNICO**
- Classificazione: **supporto IA backend**
- Prove dal repo:
  - Legge API key Gemini da Firestore: `db.doc("@impostazioni_app/gemini").get()` in [functions-schede/estrazioneSchedaCisterna.js](../../functions-schede/estrazioneSchedaCisterna.js:19).
  - Handler esportata e deployabile: [functions-schede/estrazioneSchedaCisterna.js](../../functions-schede/estrazioneSchedaCisterna.js:495).
  - Endpoint chiamata dal frontend cisterna: [src/cisterna/iaClient.ts](../../src/cisterna/iaClient.ts:10).
- Dati coinvolti:
  - Legge `@impostazioni_app/gemini`.
  - Legge payload richiesta (immagini/base64/righe).
  - Nessuna scrittura Firestore dimostrata nel file (solo risposta HTTP).
- Collocazione futura proposta:
  - **RESTA SISTEMA / SUPPORTO**.
- Impatto nuova app:
  - Resta componente infrastrutturale se la pipeline OCR cisterna è mantenuta.

## 4) `functions-schede/cisternaDocumentiExtract.js`
- Stato finale: **SUPPORTO TECNICO**
- Classificazione: **supporto IA backend**
- Prove dal repo:
  - Legge API key Gemini da `@impostazioni_app/gemini` in [functions-schede/cisternaDocumentiExtract.js](../../functions-schede/cisternaDocumentiExtract.js:201).
  - Endpoint esposto da `functions-schede/index.js` ([functions-schede/index.js](../../functions-schede/index.js:10)).
  - Endpoint chiamato da client cisterna in [src/cisterna/iaClient.ts](../../src/cisterna/iaClient.ts:12).
- Dati coinvolti:
  - Legge `@impostazioni_app/gemini`.
  - Legge input file (`fileUrl` / `fileBase64`) e restituisce JSON estratto.
  - Nessuna scrittura Firestore dimostrata nel file.
- Collocazione futura proposta:
  - **RESTA SISTEMA / SUPPORTO**.
- Impatto nuova app:
  - Mantenere solo se persiste la pipeline documentale cisterna separata.

## 5) `api/pdf-ai-enhance.ts`
- Stato finale: **NON DIMOSTRATO**
- Classificazione: **globale (endpoint IA separato)**
- Prove dal repo:
  - Endpoint Vercel presente e attivo a livello file in [api/pdf-ai-enhance.ts](../../api/pdf-ai-enhance.ts:1), usa `OPENAI_API_KEY` ([api/pdf-ai-enhance.ts](../../api/pdf-ai-enhance.ts:9)).
  - Nel frontend `src/**` non risultano chiamate a `pdf-ai-enhance` (`rg` senza match su `src`).
  - È presente solo un server locale di supporto in [server.js](../../server.js:11).
- Dati coinvolti:
  - Legge request body e variabile ambiente `OPENAI_API_KEY`.
  - Nessuna lettura/scrittura Firestore dimostrata nel file.
- Collocazione futura proposta:
  - **LEGACY / DA ESCLUDERE** finché non emerge un consumer reale in app.
- Impatto nuova app:
  - Non inserirlo in architettura target senza prova d'uso end-to-end.

## 6) Route alias `/acquisti/dettaglio/:ordineId`
- Stato finale: **ATTIVO MA SECONDARIO**
- Classificazione: **globale (compat route)**
- Prove dal repo:
  - Route registrata in [src/App.tsx](../../src/App.tsx:120) e punta a `<Acquisti />` (non a `DettaglioOrdine`).
  - Navigazione interna usata dal modulo acquisti: `navigate('/acquisti/dettaglio/...')` in [src/pages/Acquisti.tsx](../../src/pages/Acquisti.tsx:6274).
  - `Acquisti` entra in modalità dettaglio con `useParams<{ ordineId?: string }>()` in [src/pages/Acquisti.tsx](../../src/pages/Acquisti.tsx:6248).
- Dati coinvolti:
  - Usa lo stesso perimetro dati di `Acquisti`: `@ordini`, `@preventivi`, `@listino_prezzi`, `@fornitori`, `@inventario` (letture/scritture in [src/pages/Acquisti.tsx](../../src/pages/Acquisti.tsx)).
- Collocazione futura proposta:
  - **LEGACY / DA ESCLUDERE** (mantenere temporaneamente solo per backward compatibility URL).
- Impatto nuova app:
  - Preferibile convergere su una sola route di dettaglio ordine.

---

## Moduli confermati
- `CisternaSchedeTest`: **ATTIVO MA SECONDARIO**
- `functions-schede/index.js`: **SUPPORTO TECNICO**
- `functions-schede/estrazioneSchedaCisterna.js`: **SUPPORTO TECNICO**
- `functions-schede/cisternaDocumentiExtract.js`: **SUPPORTO TECNICO**
- Route alias `/acquisti/dettaglio/:ordineId`: **ATTIVO MA SECONDARIO**

## Moduli legacy
- Nessun modulo dei 6 risulta già morto nel runtime attuale; due elementi sono però candidati a deprecazione in target (`/acquisti/dettaglio/:ordineId` e `api/pdf-ai-enhance.ts`).

## Moduli ancora non dimostrati
- `api/pdf-ai-enhance.ts`
