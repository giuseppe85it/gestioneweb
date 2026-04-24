# STATO AVANZAMENTO IA INTERNA

Ultimo aggiornamento: 2026-04-23
Fonte primaria: `docs/audit/AUDIT_GAP_NEXT_VS_MADRE_2026-04-22.md` §2.8 e §5.5 + codice `src/next/internal-ai/**` e `backend/internal-ai/**`

---

## 1. Moduli IA NEXT attivi oggi

Fonte: §2.8 audit.

| Modulo NEXT | Route | Stato | Note |
|---|---|---|---|
| NextIntelligenzaArtificialePage | `/next/ia` | 🔵 READ-ONLY | Hub navigazione IA NEXT |
| NextIAApiKeyPage | `/next/ia/apikey` | 🔵 READ-ONLY | Config API Key Gemini su Firestore `@impostazioni_app/gemini` |
| NextIALibrettoPage | `/next/ia/libretto` | 🟡 PARZIALE | Write autorizzata su `mezzi_aziendali/` + `@mezzi_aziendali`; endpoint: `https://estrazione-libretto-7bo6jdsreq-uc.a.run.app`; verifica browser save reale DA VERIFICARE |
| NextIADocumentiPage | `/next/ia/documenti` | 🟡 PARZIALE | Write autorizzata: `firestore.deleteDoc @documenti_mezzi/`, `firestore.updateDoc @documenti_mezzi/`, `@documenti_magazzino/`, `@documenti_generici/`, `@costiMezzo`; verifica browser DA VERIFICARE |
| NextIACoperturaLibrettiPage | `/next/ia/copertura-libretti` | 🔵 READ-ONLY | Verifica copertura libretti — nessuna write |
| NextLibrettiExportPage | `/next/libretti-export` | 🔵 READ-ONLY | Export PDF libretti — nessuna write |
| NextIAArchivistaPage | `/next/ia/archivista` | 🟡 PARZIALE | Write autorizzata: `firestore.addDoc @documenti_magazzino/@documenti_mezzi`, `firestore.setDoc storage/@preventivi`, `storage.uploadBytes documenti_pdf/` e `preventivi/`, `storageSync @mezzi_aziendali/@manutenzioni/@inventario/@materialiconsegnati`; 5 rami attivi; verifica browser DA VERIFICARE |
| NextInternalAiPage | `/next/ia/interna` | 🟡 PARZIALE | Chat + analisi documentale; write autorizzata: `fetch.runtime → estrazioneDocumenti` CF; backend locale 4310; verifica browser end-to-end DA VERIFICARE |

---

## 2. Backend IA NEXT

Fonte: §5.5 audit + `backend/internal-ai/server/internal-ai-adapter.js`.

Il backend IA separato NEXT è `backend/internal-ai/` — un server Express in ascolto su porta `4310` (default, configurabile via `PORT`). Provider: **OpenAI** (modello configurabile via `INTERNAL_AI_OPENAI_MODEL`, default `gpt-5-mini`). Esegue analisi documentale solo lato server: il client NEXT non riceve mai la chiave OpenAI.

**Route principali del backend IA interno:**

| Route | Tipo | Descrizione |
|---|---|---|
| `POST /internal-ai-backend/documents/manutenzione-analyze` | OpenAI | Analisi fattura/DDT manutenzione |
| `POST /internal-ai-backend/documents/documento-mezzo-analyze` | OpenAI | Analisi documento mezzo / libretto |
| `POST /internal-ai-backend/documents/preventivo-magazzino-analyze` | OpenAI | Analisi preventivo magazzino |
| `POST /internal-ai-backend/documents/preventivo-extract` | OpenAI | Estrazione dati preventivo (usata da Acquisti NEXT) |
| `POST /internal-ai-backend/orchestrator/chat` | OpenAI | Chat IA interna |
| `POST /internal-ai-backend/euromecc/pdf-analyze` | OpenAI | Analisi PDF Euromecc |
| `GET /internal-ai-backend/health` | — | Health check |
| `POST /internal-ai-backend/attachments/repository` | — | Gestione allegati |
| `POST /internal-ai-backend/approvals/prepare` | — | Preparazione approvazioni |

**Stato deploy:** il backend `backend/internal-ai/` non ha piano di deploy documentato; attualmente funziona solo come processo locale `npm run internal-ai-backend:start`. La NEXT in produzione non può usare capability dipendenti da questo backend senza una soluzione di deploy separata.

---

## 3. Capability IA NEXT reali

| Capability | File NEXT principale | Endpoint/Provider | Write barrier | Stato |
|---|---|---|---|---|
| Estrazione libretto mezzo | `src/next/NextIALibrettoPage.tsx` | Cloud Run `estrazione-libretto-7bo6jdsreq-uc.a.run.app` | `mezzi_aziendali/`, `@mezzi_aziendali` | 🟡 DA VERIFICARE |
| Estrazione documenti (fatture/DDT) | `src/next/NextInternalAiPage.tsx` + `internal-ai/*` | Cloud Function `estrazioneDocumenti` + backend 4310 | `fetch.runtime → estrazioneDocumenti` | 🟡 PARZIALE |
| Archivista documenti (5 rami) | `src/next/NextIAArchivistaPage.tsx` + bridge `*Bridge.tsx` | Backend 4310 (OpenAI) | `@documenti_magazzino`, `@documenti_mezzi`, `storage/@preventivi`, `documenti_pdf/` | 🟡 DA VERIFICARE |
| Estrazione preventivo IA | `src/next/nextPreventivoIaClient.ts` | Backend 4310 `/documents/preventivo-extract` | `storage/@preventivi`, `preventivi/ia/` | 🟡 DA VERIFICARE |
| Chat IA interna | `src/next/NextInternalAiPage.tsx` | Backend 4310 `/orchestrator/chat` (OpenAI) | nessuna write diretta | 🟡 PARZIALE |
| Analisi IA Euromecc | `src/next/NextEuromeccPage.tsx` | Backend 4310 `/euromecc/pdf-analyze` + `/api/pdf-ai-enhance` | `storage.uploadBytes euromecc/relazioni/` | 🟡 DA VERIFICARE |
| Storico documenti + delete | `src/next/NextIADocumentiPage.tsx` | nessun provider IA | `firestore.deleteDoc @documenti_mezzi/` | 🟡 DA VERIFICARE |

---

## 4. Gap IA rispetto alla madre

Capability presenti nella madre che non sono ancora state assorbite completamente nella NEXT:

| Capability madre | File madre | Stato assorbimento NEXT |
|---|---|---|
| Analisi economica mezzo (Gemini) | `functions/analisiEconomica.js` | ❌ NON ASSORBITA — `NextAnalisiEconomicaPage` è read-only, non chiama la Cloud Function |
| Estrazione schede cisterna (Gemini) | `functions-schede/estrazioneSchedaCisterna.js` | ❌ NON ASSORBITA — `NextCisternaSchedeTestPage` è read-only |
| Estrazione documenti cisterna (Gemini) | `functions-schede/cisternaDocumentiExtract.js` | ❌ NON ASSORBITA — `NextCisternaIAPage` è read-only |
| IA cisterna extract (Gemini) | `functions/iaCisternaExtract.js` | ❌ NON ASSORBITA |
| Estrazione preventivo IA (Gemini callable) | `functions/index.js:588` | 🟡 PARZ. ASSORBITA — NEXT usa backend 4310 OpenAI invece della CF Gemini |
| PDF enhance (OpenAI GPT-4o) | `api/pdf-ai-enhance.ts` | 🟡 PARZ. ASSORBITA — Euromecc NEXT la usa via `/api/pdf-ai-enhance`; non unificata |

---

## 5. Bloccanti IA

1. **`storage.rules` deny-all** — i path `mezzi_aziendali/`, `documenti_pdf/`, `preventivi/ia/`, `mezzi_foto/` non hanno `allow write` esplicito; tutti gli upload IA NEXT in produzione restituiscono `storage/unauthorized`
2. **Auth anonima** — le write IA (es. Archivista, Libretto) avvengono sotto UID anonimo; in produzione è un rischio sicurezza senza claims di ruolo reali
3. **Backend IA non deployato** — `backend/internal-ai/` funziona solo come processo locale; senza deploy, le capability che dipendono dalla porta 4310 non sono disponibili in produzione

---

## 6. Cosa serve per dichiarare l'IA NEXT pronta

1. **Storage rules** per tutti i path IA: `mezzi_aziendali/`, `documenti_pdf/`, `preventivi/manuali/`, `preventivi/ia/`
2. **Auth reale** con claims di ruolo prima di aprire write su documenti business
3. **Deploy del backend** `backend/internal-ai/` su infrastruttura stabile (non solo `localhost:4310`)
4. **Verifica browser end-to-end** di Archivista (5 rami), Libretto (save reale), Preventivo IA (save con file reale), IA Documenti (delete + update)
5. **Assorbimento Cisterna IA** — `NextCisternaIAPage` e `NextCisternaSchedeTestPage` devono ottenere write authorization se si vuole parità con la madre
6. **Assorbimento AnalisiEconomica IA** — `NextAnalisiEconomicaPage` deve poter chiamare `analisi_economica_mezzo` o equivalente NEXT
