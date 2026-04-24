# MAPPA FUNZIONI IA LEGACY DA ASSORBIRE

Ultimo aggiornamento: 2026-04-23
Fonte: codice IA legacy reale (`src/pages/IA/`, `functions/`, `functions-schede/`, `server.js`, `api/`) + cross-check con `AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md`

---

## 1. Capability IA legacy presenti oggi nella madre

| # | Nome capability | File legacy principale | Provider / Modello | Descrizione operativa |
|---|---|---|---|---|
| L1 | Estrazione libretto mezzo | `src/pages/IA/IALibretto.tsx:223` | Cloud Run `estrazione-libretto-7bo6jdsreq-uc.a.run.app` (Gemini) | Upload foto libretto → estrazione strutturata targa/mezzo → salvataggio in `@mezzi_aziendali` |
| L2 | Estrazione documenti magazzino/mezzo | `src/pages/IA/IADocumenti.tsx:382` | Cloud Function `estrazioneDocumenti` (`functions/estrazioneDocumenti.js:67`, Gemini `gemini-2.5-flash`) | Upload PDF/immagine fattura/DDT → estrazione header + righe → salvataggio in `@documenti_mezzi`/`@documenti_magazzino` |
| L3 | Analisi economica mezzo | `functions/analisiEconomica.js:10` | Cloud Function `analisi_economica_mezzo` (Gemini `gemini-2.5-flash`) | Lettura costi mezzo dal Dossier → analisi trend e report economico strutturato |
| L4 | Estrazione preventivo IA (callable) | `functions/index.js:588` | Cloud Function `estraiPreventivoIA` (Gemini `gemini-2.5-flash`) | Upload PDF preventivo → estrazione fornitore/articoli/prezzi → salvataggio `storage/@preventivi` + listino |
| L5 | Generazione PDF ordini/lavori | `functions/index.js:690` | Cloud Function `stamp_pdf` (nessun provider IA — PDF puro) | Genera PDF formattato da template per ordini e documenti operativi |
| L6 | Estrazione libretto (replica CF) | `functions/index.js:794` | Cloud Function `estrazione_libretto` (Gemini `gemini-2.5-flash`) | Replica server-side della stessa capability L1 via Cloud Function |
| L7 | IA Cisterna extract | `functions/iaCisternaExtract.js:128` | Cloud Function `ia_cisterna_extract` (Gemini `gemini-2.5-flash`) | Estrazione dati da immagini/PDF documenti cisterna AdBlue |
| L8 | Estrazione schede cisterna | `functions-schede/estrazioneSchedaCisterna.js:5` | Cloud Function `estrazioneSchedaCisterna` (Gemini `gemini-2.5-pro`) | Parsing OCR/IA di schede cisterna da immagini per celle e righe strutturate |
| L9 | Estrazione documenti cisterna | `functions-schede/cisternaDocumentiExtract.js:10` | Cloud Function `cisterna_documenti_extract` (Gemini `gemini-2.5-pro`) | Estrazione documenti cisterna da PDF/immagini → `@documenti_cisterna` |
| L10 | PDF AI Enhance (edge) | `api/pdf-ai-enhance.ts:2` | Edge Function Vercel, OpenAI `gpt-4o` | Miglioramento testuale di dati grezzi per inserimento in PDF professionali |
| L11 | PDF AI Enhance (server locale) | `server.js:31` | Express porta 3001, OpenAI `gpt-4o-mini` | Stessa capability L10 ma come processo locale — usato da Euromecc NEXT in sviluppo |
| L12 | Copertura libretti (coverage check) | `src/pages/IA/IACoperturaLibretti.tsx:58` | Nessun provider IA — `fetch HEAD/GET` | Verifica quali targhe hanno il libretto mezzo caricato su Storage |
| L13 | Config API Key Gemini | `src/pages/IA/IAApiKey.tsx` | Nessun provider IA — Firestore `@impostazioni_app/gemini` | Lettura/scrittura della API Key Gemini usata da tutti i moduli legacy |

---

## 2. Stato di assorbimento nella NEXT

| # | Capability legacy | Stato assorbimento | File NEXT equivalente | Note |
|---|---|---|---|---|
| L1 | Estrazione libretto mezzo | 🟡 ASSORBITA PARZIALMENTE | `src/next/NextIALibrettoPage.tsx` + `NextEstrazioneLibretto.tsx` | Usa stesso endpoint Cloud Run; write autorizzata; verifica browser DA VERIFICARE |
| L2 | Estrazione documenti | 🟡 ASSORBITA PARZIALMENTE | `src/next/NextInternalAiPage.tsx` + `backend/internal-ai/server/internal-ai-adapter.js:1521` | NEXT usa backend interno OpenAI (porta 4310) invece di Gemini CF legacy; CF `estrazioneDocumenti` usata come fallback; write autorizzata con `fetch.runtime` |
| L3 | Analisi economica mezzo | ❌ NON ASSORBITA | `src/next/NextAnalisiEconomicaPage.tsx` (read-only) | La pagina NEXT mostra dati ma non chiama `analisi_economica_mezzo`; nessun equivalente nel backend interno |
| L4 | Estrazione preventivo IA | 🟡 ASSORBITA PARZIALMENTE | `src/next/nextPreventivoIaClient.ts` + `backend/internal-ai/server/internal-ai-adapter.js:1900` | NEXT usa backend interno OpenAI (`/documents/preventivo-extract`) invece di CF Gemini; provider diverso ma funzionalità equivalente; write autorizzata; DA VERIFICARE |
| L5 | Generazione PDF ordini/lavori | ❌ NON ASSORBITA | — | NEXT usa `jspdf` locale (`NextManutenzioniPage`, `NextLavoriEseguitiPage`); `stamp_pdf` CF non è chiamata dalla NEXT; non è una capability IA |
| L6 | Estrazione libretto (replica CF) | 🟡 ASSORBITA PARZIALMENTE | (vedi L1) | Assorbita via Cloud Run diretto da L1; la replica CF `estrazione_libretto` non è usata dalla NEXT |
| L7 | IA Cisterna extract | ❌ NON ASSORBITA | `src/next/NextCisternaIAPage.tsx` (read-only) | Nessun write authorization, nessun chiamata al backend per l'estrazione |
| L8 | Estrazione schede cisterna | ❌ NON ASSORBITA | `src/next/NextCisternaSchedeTestPage.tsx` (read-only) | Nessun equivalente nel backend interno |
| L9 | Estrazione documenti cisterna | ❌ NON ASSORBITA | — | Nessun equivalente NEXT |
| L10 | PDF AI Enhance (edge) | 🟡 ASSORBITA PARZIALMENTE | `src/next/NextEuromeccPage.tsx` (usa `/api/pdf-ai-enhance`) | Solo Euromecc NEXT la usa; il barrier la autorizza su `/next/euromecc`; non è unificata come capability generica |
| L11 | PDF AI Enhance (server locale) | 🟡 ASSORBITA PARZIALMENTE | (vedi L10) | Il backend interno `backend/internal-ai/` usa `server.js`-style per Euromecc; DA VERIFICARE in produzione |
| L12 | Copertura libretti | ✅ ASSORBITA | `src/next/NextIACoperturaLibrettiPage.tsx` | Read-only, nessun provider IA — assorbita completamente |
| L13 | Config API Key | FUORI PERIMETRO | `src/next/NextIAApiKeyPage.tsx` | Config operativa, non una capability IA da assorbire |

---

## 3. Priorità di assorbimento

| Priorità | Capability | Motivazione |
|---|---|---|
| 🔴 ALTA | L3 — Analisi economica mezzo | `NextAnalisiEconomicaPage` è read-only; la madre chiama la CF; senza questa capability la NEXT non può generare analisi economiche per targa |
| 🔴 ALTA | L7 — IA Cisterna extract | `NextCisternaIAPage` è read-only; la cisterna è un modulo operativo critico con write in madre; il gap IA blocca la parità funzionale |
| 🔴 ALTA | L8 — Estrazione schede cisterna | Stesso motivo di L7; `NextCisternaSchedeTestPage` è read-only; `gemini-2.5-pro` richiede rifacimento nel backend interno |
| 🔴 ALTA | L9 — Estrazione documenti cisterna | Stessa logica di L7/L8 |
| 🟠 MEDIA | L4 — Estrazione preventivo (verifica) | Parzialmente assorbita con backend OpenAI; DA VERIFICARE con file reali; il gap tra provider Gemini↔OpenAI potrebbe generare output diversi |
| 🟠 MEDIA | L2 — Estrazione documenti (verifica) | Parzialmente assorbita; DA VERIFICARE end-to-end su `/next/ia/archivista` e `/next/ia/interna` con documenti reali |
| 🟡 BASSA | L1 — Estrazione libretto (verifica) | Parzialmente assorbita; DA VERIFICARE save reale; endpoint identico alla madre |
| 🟡 BASSA | L10/L11 — PDF AI Enhance | Solo Euromecc la usa; non è una capability generica; bassa priorità di generalizzazione |
| — | L5 — stamp_pdf | Non è una capability IA; PDF generati con `jspdf` locale nella NEXT |
| — | L6 — Estrazione libretto CF replica | Già coperta da L1 via Cloud Run |
| — | L12 — Copertura libretti | ASSORBITA, nessuna azione |
| — | L13 — Config API Key | FUORI PERIMETRO |

---

## 4. Capability legacy fuori perimetro di assorbimento

Le seguenti capability legacy **non vanno assorbite** nella NEXT per decisione strutturale:

| Capability | Motivazione |
|---|---|
| `stamp_pdf` (CF `functions/index.js:690`) | Non è una capability IA; è un generatore PDF puro. La NEXT usa `jspdf` locale e `api/pdf-ai-enhance` per l'enhance testuale. |
| Config API Key Gemini (`src/pages/IA/IAApiKey.tsx`) | La NEXT usa OpenAI lato server tramite `INTERNAL_AI_OPENAI_MODEL`; la chiave Gemini è una configurazione operativa del motore legacy, non una capability da portare. |
| `server.js` come entrypoint | È un Express locale di sviluppo per `/api/pdf-ai-enhance`; in produzione la NEXT usa `api/pdf-ai-enhance.ts` Edge Function o il backend interno. Non va consolidato nel backend IA interno. |
| `estrazione_libretto` CF replica (`functions/index.js:794`) | Duplicato della L1 via Cloud Run diretto. La NEXT usa già il Cloud Run originale. |

---

## 5. Decisioni strutturali

1. **Provider diversi per legacy vs NEXT**: il codice legacy usa Gemini (`gemini-2.5-flash`/`gemini-2.5-pro`) tramite Cloud Functions; il backend IA interno NEXT usa OpenAI (`gpt-5-mini` / modello configurabile). Le due pipeline non vanno mescolate a runtime.
2. **Nuove capability IA NEXT non devono chiamare direttamente Cloud Functions legacy**: devono usare endpoint del `backend/internal-ai/` o, in casi eccezionali documentati, il Cloud Run `estrazione-libretto-7bo6jdsreq-uc.a.run.app` (già autorizzato nel barrier per `/next/ia/libretto`).
3. **Le CF legacy restano in produzione per la madre** finché i moduli madre non sono spenti; la NEXT non deve dipendere da esse.
4. **`api/pdf-ai-enhance.ts`** è usabile dalla NEXT solo come fallback/enhance testuale (es. Euromecc), non come motore primario di estrazione documentale.

---

## Appendice A — Flussi di scrittura delle capability legacy attive

Dettaglio input/output/storage per le capability legacy con write reale, con riferimenti codice.

| Capability | Input utente | Write principale | Riga codice |
|---|---|---|---|
| L1 — Estrazione libretto | Foto libretto (`data_url`) | `uploadString(storageRef, preview, "data_url")` → `setItemSync("@mezzi_aziendali", mezzi)` | `IALibretto.tsx:437`, `IALibretto.tsx:473` |
| L2 — Estrazione documenti | PDF/immagine fattura/DDT | `uploadBytes(fileRef, selectedFile)` → `addDoc(collection(db, targetCollection), payload)` → optional `updateDoc` valuta | `IADocumenti.tsx:503`, `IADocumenti.tsx:537`, `IADocumenti.tsx:773` |
| L3 — Analisi economica | Targa + snapshot costi | Cloud Function `analisi_economica_mezzo` → nessuna write lato client (risultato visualizzato) | `functions/analisiEconomica.js:20` |
| L4 — Preventivo IA (callable) | PDF preventivo | CF `estraiPreventivoIA` → `setItemSync("@preventivi", ...)` + `setItemSync("@listino_prezzi", ...)` | `functions/index.js:588` |
| L7 — IA Cisterna extract | Immagine/PDF cisterna | CF `ia_cisterna_extract` → record su `@documenti_cisterna` | `functions/iaCisternaExtract.js:128` |
| L8 — Schede cisterna | Immagine/PDF scheda | CF `estrazioneSchedaCisterna` → record su `@cisterna_schede_ia` | `functions-schede/estrazioneSchedaCisterna.js:5` |
| L9 — Documenti cisterna | PDF documento cisterna | CF `cisterna_documenti_extract` → record su `@documenti_cisterna` | `functions-schede/cisternaDocumentiExtract.js:10` |
| L10 — PDF AI Enhance | Testo grezzo + kind | Edge Function Vercel → JSON `{ enhancedText, enhancedNotes }` (nessuna write diretta) | `api/pdf-ai-enhance.ts:54` |

---

## Appendice B — Canali di accesso alle capability legacy dalla madre

| Capability | Canale di accesso dalla madre | URL/Funzione |
|---|---|---|
| L1 | Chiamata `fetch` diretta dal client | `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app` |
| L2 | Chiamata `fetch` diretta dal client | `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti` |
| L3 | Cloud Function HTTPS trigger | `analisi_economica_mezzo` (deployata in `us-central1`) |
| L4 | Cloud Function callable | `estraiPreventivoIA` (callable `onCall`) |
| L5 | Cloud Function HTTPS trigger | `stamp_pdf` (deployata in `us-central1`) |
| L7 | Cloud Function HTTPS trigger | `ia_cisterna_extract` (deployata in `us-central1`) |
| L8 | Cloud Function HTTPS trigger | `estrazioneSchedaCisterna` (deployata separatamente da `functions-schede/`) |
| L9 | Cloud Function HTTPS trigger | `cisterna_documenti_extract` (deployata separatamente da `functions-schede/`) |
| L10 | Edge Function Vercel | `/api/pdf-ai-enhance` (POST) |
| L11 | Express locale porta 3001 | `POST http://localhost:3001/api/pdf-ai-enhance` |

---

## 6. Storico aggiornamenti

| Data | Evento |
|---|---|
| 2026-04-23 | Creazione da zero basata su lettura diretta di `src/pages/IA/**`, `functions/**`, `functions-schede/**`, `api/pdf-ai-enhance.ts`, `server.js`. Cross-check con `AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md` per lo stato di assorbimento. |
