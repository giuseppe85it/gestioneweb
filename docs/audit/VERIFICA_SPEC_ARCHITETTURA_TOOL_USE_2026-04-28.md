# VERIFICA SPEC ARCHITETTURA TOOL USE CHAT IA NEXT

Data: 2026-04-28  
File verificato: `docs/product/SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md`  
Metodo: confronto puntuale con codice reale e documenti citati.  
Archivista: non analizzato.  
Divergenze totali: 0  
Divergenze critiche: 0  
Divergenze medie: 0  
Divergenze minori: 0  
Verdetto: APPROVATO

## 1. INTRO

La verifica ha controllato le affermazioni tecniche della SPEC contro il repository reale, senza modificare codice o SPEC.

La SPEC distingue correttamente tra:

- componenti gia esistenti, con riferimenti a righe reali;
- infrastruttura nuova da implementare, come endpoint `/internal-ai-backend/chat/tool-use`;
- estensioni previste, come `src/next/chat-ia/tools/`, `ChatIaAssistantFinalMessage`, blocchi `chart` e `ui_action`.

Non sono state trovate divergenze tra claim tecnici e stato del codice.

## 2. CLAIM BACKEND

### 2.1 Endpoint esistenti

| Claim SPEC / Prompt | Codice reale | Esito |
| --- | --- | --- |
| Express app esistente | `const app = express();` in `backend/internal-ai/server/internal-ai-adapter.js:54` | OK |
| CORS/metodi backend | `GET,POST,OPTIONS` in `backend/internal-ai/server/internal-ai-adapter.js:57-60` | OK |
| Envelope standard `sendEnvelope` | `backend/internal-ai/server/internal-ai-adapter.js:83-90` | OK |
| `/internal-ai-backend/health` | `backend/internal-ai/server/internal-ai-adapter.js:1105` | OK |
| `/internal-ai-backend/documents/manutenzione-analyze` | `backend/internal-ai/server/internal-ai-adapter.js:1521` | OK |
| `/internal-ai-backend/documents/documento-mezzo-analyze` | `backend/internal-ai/server/internal-ai-adapter.js:1670` | OK |
| `/internal-ai-backend/documents/preventivo-magazzino-analyze` | `backend/internal-ai/server/internal-ai-adapter.js:1795` | OK |
| `/internal-ai-backend/documents/documento-cisterna-analyze` | `backend/internal-ai/server/internal-ai-adapter.js:1900` | OK |
| `/internal-ai-backend/documents/scheda-cisterna-analyze` | `backend/internal-ai/server/internal-ai-adapter.js:2026` | OK |
| `/internal-ai-backend/orchestrator/chat` | `backend/internal-ai/server/internal-ai-adapter.js:2363` | OK |
| `/internal-ai-backend/artifacts/repository` | `backend/internal-ai/server/internal-ai-adapter.js:2498` | OK |
| `/internal-ai-backend/memory/repository` | `backend/internal-ai/server/internal-ai-adapter.js:2709` | OK |
| `/internal-ai-backend/retrieval/read` | `backend/internal-ai/server/internal-ai-adapter.js:2801` | OK |

### 2.2 Helper backend esistenti

| Claim | Codice reale | Esito |
| --- | --- | --- |
| `getProviderTarget` esiste | `backend/internal-ai/server/internal-ai-adapter.js:374` | OK |
| Provider attuale `openai`, API `responses` | `backend/internal-ai/server/internal-ai-adapter.js:376-378` | OK |
| Default documentale attuale `INTERNAL_AI_OPENAI_MODEL || "gpt-5-mini"` | `backend/internal-ai/server/internal-ai-adapter.js:378` | OK |
| `isProviderConfigured` esiste | `backend/internal-ai/server/internal-ai-adapter.js:402-403` | OK |
| `getProviderClient` esiste | `backend/internal-ai/server/internal-ai-adapter.js:406-412` | OK |
| Traceability helper usato dal backend | import `appendTraceabilityEntry` in `backend/internal-ai/server/internal-ai-adapter.js:9`; `buildTraceabilityEntry` in `backend/internal-ai/server/internal-ai-adapter.js:70-80` | OK |

### 2.3 Endpoint nuovo assente oggi

Claim: `/internal-ai-backend/chat/tool-use` deve essere nuovo.

Verifica: `Select-String` su `backend/internal-ai/server/internal-ai-adapter.js` non trova `app.post("/internal-ai-backend/chat/tool-use"`.

Esito: OK. L'endpoint non esiste oggi ed e correttamente specificato come da aggiungere.

### 2.4 Coerenza path scelto

La SPEC sceglie `/internal-ai-backend/chat/tool-use`, non `/api/internal-ai/chat-tool-use`.

Esito: OK. Il prefisso e coerente con il backend reale, che usa gia `/internal-ai-backend/*` per health, documenti, orchestrator, artifact, memory e retrieval.

## 3. CLAIM CLIENT

### 3.1 Cartella tool registry

Claim: `src/next/chat-ia/tools/` e cartella prevista, da creare in implementazione.

Verifica: `Test-Path src/next/chat-ia/tools` restituisce `False`.

Esito: OK. La cartella non esiste oggi ed e correttamente descritta come nuova.

### 3.2 Bridge esistente

| Claim | Codice reale | Esito |
| --- | --- | --- |
| `chatIaBackendBridge.ts` esiste | `src/next/chat-ia/backend/chatIaBackendBridge.ts` | OK |
| Il bridge attuale importa `runInternalAiServerControlledChat` | `src/next/chat-ia/backend/chatIaBackendBridge.ts:1` | OK |
| Firma attuale `refineChatIaRunnerResult` | `src/next/chat-ia/backend/chatIaBackendBridge.ts:60-62` | OK |
| Il bridge invia prompt/risultato runner al backend | `src/next/chat-ia/backend/chatIaBackendBridge.ts:63-85` | OK |
| Il bridge gestisce fallback se backend non risponde | `src/next/chat-ia/backend/chatIaBackendBridge.ts:87-107` | OK |

Esito complessivo: OK. La SPEC propone correttamente di trasformare questo bridge in orchestratore del ciclo tool use.

### 3.3 Client backend URL

| Claim | Codice reale | Esito |
| --- | --- | --- |
| Usa `VITE_INTERNAL_AI_BACKEND_URL` | `src/next/internal-ai/internalAiServerChatClient.ts:13-17` | OK |
| Fallback localhost `127.0.0.1:${INTERNAL_AI_SERVER_ADAPTER_PORT}` | `src/next/internal-ai/internalAiServerChatClient.ts:23-26` | OK |
| `postToServer` fa POST JSON | `src/next/internal-ai/internalAiServerChatClient.ts:31-47` | OK |
| Se fetch fallisce ritorna `null` | `src/next/internal-ai/internalAiServerChatClient.ts:50-57` | OK |

### 3.4 Tipi chat attuali

| Claim | Codice reale | Esito |
| --- | --- | --- |
| `ChatIaOutputKind` supporta `text`, `card`, `table`, `report_modal`, `archive_list`, `fallback` | `src/next/chat-ia/core/chatIaTypes.ts:25-31` | OK |
| `ChatIaStructuredCard` esiste | `src/next/chat-ia/core/chatIaTypes.ts:41-51` | OK |
| `ChatIaTable` esiste | `src/next/chat-ia/core/chatIaTypes.ts:53-59` | OK |
| `ChatIaReport` esiste | `src/next/chat-ia/core/chatIaTypes.ts:61-82` | OK |
| `ChatIaArchiveEntry` esiste | `src/next/chat-ia/core/chatIaTypes.ts:84-111` | OK |
| `ChatIaMessage` esiste e contiene text/card/table/report/archive/error | `src/next/chat-ia/core/chatIaTypes.ts:114-128` | OK |

Nota: `ChatIaAssistantFinalMessage`, `chart` e `ui_action` non esistono oggi. Non e divergenza: la SPEC li presenta come nuovo contratto/estensione. La stessa SPEC dichiara che `chart` e `ui_action` richiedono estensione UI.

### 3.5 Rendering attuale

| Claim | Codice reale | Esito |
| --- | --- | --- |
| `ChatIaMessageItem` esiste | `src/next/chat-ia/components/ChatIaMessageItem.tsx:103` | OK |
| Render testo | `src/next/chat-ia/components/ChatIaMessageItem.tsx:115` | OK |
| Render card | `src/next/chat-ia/components/ChatIaMessageItem.tsx:26-49`, uso in `:116` | OK |
| Render table | `src/next/chat-ia/components/ChatIaMessageItem.tsx:51-93`, uso in `:117` | OK |
| Render timeline Mezzi | `src/next/chat-ia/components/ChatIaMessageItem.tsx:96-100`, uso in `:118` | OK |
| Render report button | `src/next/chat-ia/components/ChatIaMessageItem.tsx:119-126` | OK |
| Render archivio come meta count | `src/next/chat-ia/components/ChatIaMessageItem.tsx:128-130` | OK |

Esito: OK. La SPEC e coerente: i renderer base esistono, chart/ui_action sono da estendere.

### 3.6 Recharts e grafici

| Claim | Codice reale | Esito |
| --- | --- | --- |
| `recharts` disponibile | `package.json:31` | OK |
| Wrapper chart chat IA non trovato | ricerca `recharts|LineChart|BarChart|PieChart|ChatIaChart|chart` in `src/next/chat-ia` non trova wrapper chart | OK |

### 3.7 Settore Mezzi fallback

| Claim | Codice reale | Esito |
| --- | --- | --- |
| Registry runner attuale registra Mezzi | `src/next/chat-ia/core/chatIaSectorRegistry.ts:11-19` | OK |
| Runner Mezzi ha `canHandle` | `src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts:110-111` | OK |
| Runner Mezzi ha `run` | `src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts:113` | OK |
| Runner usa `readChatIaMezzoSnapshot` | `src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts:133` | OK |
| Reader composito Mezzi esiste | `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:61` | OK |
| SPEC settore Mezzi descrive runner settoriale reale | `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:7`, `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:70-80` | OK |

## 4. COERENZA DECISIONI VINCOLANTI

### D-ARCH-1 - Endpoint backend nuovo

Esito: OK.

Il path scelto `/internal-ai-backend/chat/tool-use` e coerente con il prefisso reale backend. L'endpoint non esiste oggi, come richiesto, e va aggiunto accanto a `/internal-ai-backend/orchestrator/chat`.

### D-ARCH-2 - Modello OpenAI

Esito: OK.

La SPEC sceglie `gpt-4o-mini` per tool use. Il backend documentale attuale usa `INTERNAL_AI_OPENAI_MODEL || "gpt-5-mini"` (`backend/internal-ai/server/internal-ai-adapter.js:374-379`). La proposta di helper dedicato `INTERNAL_AI_TOOL_USE_MODEL || "gpt-4o-mini"` evita regressioni sugli endpoint esistenti.

### D-ARCH-3 - Tool registry client-side

Esito: OK.

La scelta client-side e praticabile perche:

- i reader clone-safe sono in `src/next/**`;
- il backend attuale dichiara live-read business chiuso (`backend/internal-ai/server/internal-ai-adapter.js:382-394`);
- il bridge frontend e gia il punto di integrazione verso backend (`src/next/chat-ia/backend/chatIaBackendBridge.ts:60-85`).

### D-ARCH-4 - Prompt di sistema

Esito: OK.

Il prompt e in italiano, ribadisce sola lettura business e fallback esplicito. Coerente con telaio tool use (`docs/product/MAPPA_IA_CHAT_NEXT.md:22-28`) e vincolo no scritture business (`docs/product/MAPPA_IA_CHAT_NEXT.md:28`).

### D-ARCH-5 - Ciclo tool

Esito: OK.

I limiti scelti nella SPEC sono ragionevoli e implementabili:

- massimo 4 iterazioni;
- timeout backend 20s;
- timeout tool 12s;
- errore tool rimandato come risultato strutturato.

Non ci sono conflitti con codice attuale perche il ciclo e nuovo.

### D-ARCH-6 - Output strutturato

Esito: OK.

`ChatIaMessage` attuale supporta gia testo, card, table, report e archive entries (`src/next/chat-ia/core/chatIaTypes.ts:114-128`). `ChatIaAssistantFinalMessage`, `chart` e `ui_action` sono estensioni dichiarate dalla SPEC e coerenti con la struttura attuale.

### D-ARCH-7 - Streaming v2

Esito: OK.

La UI attuale renderizza messaggi completi (`src/next/chat-ia/components/ChatIaMessageItem.tsx:103-132`). Single-shot v1 e coerente.

### D-ARCH-8 - Logging costi

Esito: OK.

Il backend ha gia traceability helper (`backend/internal-ai/server/internal-ai-adapter.js:70-80`) e lo usa tramite `appendTraceabilityEntry` (`backend/internal-ai/server/internal-ai-adapter.js:9`). La SPEC richiede usage/cost nel response envelope e nella traceability server-side. In implementazione andra deciso se estendere il payload trace con campi strutturati o serializzare la stima nel `note`; questa e una raccomandazione operativa, non una divergenza.

## 5. COERENZA INTERNA

### 5.1 Tipi tra sezioni 2, 3, 4, 7

Esito: OK.

- `ChatIaToolDefinition` e usato nel request backend e nel registry client.
- `ChatIaToolResult` e usato nel ciclo bridge e nella gestione errori.
- `ChatToolUseResponseData` distingue `tool_calls` e `final`.
- `ChatIaAssistantFinalMessage` produce `blocks`, mappati a `ChatIaMessage`.

### 5.2 Esempi end-to-end

Esito: OK.

| Esempio | Tool audit coerente | Esito |
| --- | --- | --- |
| `TI282780` -> dossier mezzo | `get_vehicle_dossier_snapshot` in `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:358-363` | OK |
| `rifornimenti aprile 2026` -> aggregazione | `get_refuelings_aggregated` in `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:410-417` | OK |
| grafico rifornimenti | `generate_chart` in `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:606-611` | OK |
| fallback non capisco | coerente con prompt e vincoli telaio | OK |

### 5.3 DoD

Esito: OK.

La Definition of Done riprende le sezioni precedenti:

- endpoint nuovo;
- modello `gpt-4o-mini`;
- registry client;
- massimo 4 iterazioni;
- output strutturato;
- renderer base;
- usage/cost;
- fallback Mezzi;
- nessuna scrittura business.

### 5.4 Migrazione settore Mezzi

Esito: OK.

La SPEC e coerente con il telaio, che mantiene il settore Mezzi router+runner come rete di sicurezza (`docs/product/MAPPA_IA_CHAT_NEXT.md:141-145`). E coerente anche con la SPEC Mezzi, che descrive il runner come primo settore reale (`docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:7`) e vieta scritture business (`docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md:15`).

## 6. DIVERGENZE TROVATE

0 divergenze.

| Severita | Conteggio | Dettaglio |
| --- | ---: | --- |
| CRITICA | 0 | Nessuna |
| MEDIA | 0 | Nessuna |
| MINORE | 0 | Nessuna |

## 7. RIEPILOGO RACCOMANDAZIONI

1. In implementazione, creare `src/next/chat-ia/tools/` solo quando si apre la patch runtime.
2. In implementazione, aggiungere endpoint `POST /internal-ai-backend/chat/tool-use` senza toccare gli endpoint esistenti.
3. Usare helper modello dedicato `INTERNAL_AI_TOOL_USE_MODEL || "gpt-4o-mini"` per non alterare il default documentale.
4. Estendere i tipi chat con `ChatIaAssistantFinalMessage`, `chart` e `ui_action` in modo compatibile con `ChatIaMessage`.
5. Per logging costi, scegliere in patch se estendere `buildTraceabilityEntry` con campi strutturati o includere usage/cost nel `note`.

Nessuna raccomandazione richiede correzione della SPEC prima dell'implementazione.

## 8. APPENDICE: FILE LETTI

- `docs/product/SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md`
- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md`
- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`
- `docs/product/SPEC_SETTORE_MEZZI_CHAT_IA_NEXT.md`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `src/next/internal-ai/internalAiServerChatClient.ts`
- `src/next/chat-ia/backend/chatIaBackendBridge.ts`
- `src/next/chat-ia/core/chatIaTypes.ts`
- `src/next/chat-ia/components/ChatIaMessageItem.tsx`
- `src/next/chat-ia/core/chatIaSectorRegistry.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts`
- `package.json`
