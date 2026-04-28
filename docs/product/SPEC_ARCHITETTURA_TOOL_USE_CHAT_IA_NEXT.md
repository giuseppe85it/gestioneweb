# SPEC ARCHITETTURA TOOL USE CHAT IA NEXT

Versione: 2026-04-28  
Autore: Codex  
Modulo: Chat IA NEXT `/next/chat`  
Oggetto: infrastruttura OpenAI function calling per tool use  
Fuori scope: lista dettagliata dei tool, implementazione dei singoli tool, Archivista

## 0. INTRODUZIONE

Questa SPEC definisce l'architettura infrastrutturale della chat IA NEXT in modalita OpenAI function calling. Il documento non replica la lista dei tool candidati: quella resta nell'audit dedicato `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md`, dove sono censiti 41 tool candidati, con 25 fattibili subito, 14 con estensione e 2 con nuovo reader (`docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:676-689`).

Riferimenti principali:

- Telaio aggiornato: la chat IA NEXT usa OpenAI function calling/tool use (`docs/product/MAPPA_IA_CHAT_NEXT.md:22-28`).
- Il telaio vieta scritture business nei tool (`docs/product/MAPPA_IA_CHAT_NEXT.md:28`).
- La vecchia ossatura era router + runner settoriali (`docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md:136-157`).
- Il backend Express esiste gia e usa envelope standard `sendEnvelope` (`backend/internal-ai/server/internal-ai-adapter.js:54-60`, `backend/internal-ai/server/internal-ai-adapter.js:83-90`).
- Il client chat esistente usa `VITE_INTERNAL_AI_BACKEND_URL` con fallback localhost (`src/next/internal-ai/internalAiServerChatClient.ts:13-29`).
- Il bridge attuale chiama il backend solo dopo il runner locale (`src/next/chat-ia/backend/chatIaBackendBridge.ts:60-85`).

## 1. ARCHITETTURA AD ALTO LIVELLO

Diagramma v1:

```text
utente
  -> UI /next/chat
  -> chatIaBackendBridge.ts
  -> tool registry client-side
  -> backend Express /internal-ai-backend/chat/tool-use
  -> OpenAI Responses API con tools dichiarati
  -> risposta: final oppure tool_calls
  -> bridge esegue tool client-side clone-safe
  -> bridge rimanda tool_results al backend
  -> OpenAI compone risposta finale
  -> ChatIaMessageItem renderizza testo, card, tabella, grafico, report, archivio o azione UI
```

Differenza rispetto al pattern attuale:

- Prima: `ChatIaRouter` decideva il settore, poi un runner settoriale leggeva dati e il backend rifiniva il testo (`docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md:152-157`).
- Ora: OpenAI riceve domanda e tool disponibili, decide quali tool usare, riceve risultati tool e compone la risposta.
- Il settore Mezzi router+runner resta fallback di sicurezza durante la migrazione, come stabilito nel telaio (`docs/product/MAPPA_IA_CHAT_NEXT.md:141-145`).
- La divisione futura non e piu "settore con runner", ma "tool piccoli e dichiarati" (`docs/product/MAPPA_IA_CHAT_NEXT.md:104-111`).

## 2. ESTENSIONE BACKEND

### 2.1 Endpoint scelto

Decisione D-ARCH-1: il nuovo endpoint e:

```text
POST /internal-ai-backend/chat/tool-use
```

Motivo: il backend esistente registra gia endpoint sotto prefisso `/internal-ai-backend`, per esempio `/internal-ai-backend/orchestrator/chat` (`backend/internal-ai/server/internal-ai-adapter.js:2363`) e gli endpoint documentali (`backend/internal-ai/server/internal-ai-adapter.js:1521`, `backend/internal-ai/server/internal-ai-adapter.js:1900`, `backend/internal-ai/server/internal-ai-adapter.js:2026`). Usare lo stesso prefisso evita una seconda famiglia `/api/*`.

Endpoint ID:

```text
chat.tool-use
```

### 2.2 Request shape

```ts
type ChatToolUseRequestBody = {
  operation: "run_tool_use_turn";
  requestId: string;
  actorId?: string;
  sessionId: string;
  iteration: number;
  prompt: string;
  messages: Array<{
    role: "user" | "assistant" | "tool";
    content: string;
    toolCallId?: string;
    name?: string;
  }>;
  tools: ChatIaToolDefinition[];
  toolResults?: ChatIaToolResult[];
  responseId?: string | null;
};
```

Il client manda i tool disponibili a ogni iterazione. Il backend non importa reader business e non esegue tool.

### 2.3 Tool definition shape

```ts
type ChatIaToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties: false;
  };
  outputKindHint?: "text" | "card" | "table" | "chart" | "report" | "archive_list" | "ui_action";
};
```

### 2.4 Tool result shape

```ts
type ChatIaToolResult = {
  toolCallId: string;
  name: string;
  ok: boolean;
  data?: unknown;
  error?: {
    code: "validation_error" | "not_found" | "timeout" | "tool_error";
    message: string;
  };
  outputKind?: "text" | "card" | "table" | "chart" | "report" | "archive_list" | "ui_action";
};
```

Nota: `ok` qui e ammesso per il protocollo tool use interno, non e un wrapper dei client IA documentali. Serve a OpenAI per distinguere esecuzione tool riuscita da fallita.

### 2.5 Response shape

```ts
type ChatToolUseResponseData =
  | {
      mode: "tool_calls";
      responseId: string | null;
      model: string;
      toolCalls: Array<{
        id: string;
        name: string;
        arguments: Record<string, unknown>;
      }>;
      usage: ChatIaOpenAiUsage | null;
      costEstimate: ChatIaCostEstimate | null;
    }
  | {
      mode: "final";
      responseId: string | null;
      model: string;
      finalMessage: ChatIaAssistantFinalMessage;
      usage: ChatIaOpenAiUsage | null;
      costEstimate: ChatIaCostEstimate | null;
    };
```

Envelope HTTP:

```ts
{
  ok: boolean;
  endpointId: "chat.tool-use";
  status: "ok" | "validation_error" | "provider_not_configured" | "upstream_error";
  message: string;
  data: ChatToolUseResponseData;
}
```

La forma envelope segue `sendEnvelope` (`backend/internal-ai/server/internal-ai-adapter.js:83-90`).

### 2.6 Cosa aggiungere all'adapter

Nel file `backend/internal-ai/server/internal-ai-adapter.js`:

- aggiungere `app.post("/internal-ai-backend/chat/tool-use", ...)` vicino a `/internal-ai-backend/orchestrator/chat` (`backend/internal-ai/server/internal-ai-adapter.js:2363`);
- validare `operation === "run_tool_use_turn"`;
- validare `tools` come array non vuoto;
- validare `iteration` come intero tra 0 e limite massimo;
- usare `getProviderClient` e controllo `isProviderConfigured` (`backend/internal-ai/server/internal-ai-adapter.js:402-412`);
- chiamare OpenAI Responses API con tool definitions inviate dal client;
- restituire `tool_calls` oppure `final`;
- non leggere Firestore business e non scrivere dati business.

Endpoint esistenti da lasciare intatti:

- `/internal-ai-backend/orchestrator/chat` (`backend/internal-ai/server/internal-ai-adapter.js:2363`);
- endpoint documentali manutenzione/documento mezzo/preventivo/cisterna/schede (`backend/internal-ai/server/internal-ai-adapter.js:1521`, `backend/internal-ai/server/internal-ai-adapter.js:1670`, `backend/internal-ai/server/internal-ai-adapter.js:1795`, `backend/internal-ai/server/internal-ai-adapter.js:1900`, `backend/internal-ai/server/internal-ai-adapter.js:2026`);
- artifact, memory, retrieval e health gia registrati nell'adapter (`backend/internal-ai/server/internal-ai-adapter.js:1105`, `backend/internal-ai/server/internal-ai-adapter.js:2498`, `backend/internal-ai/server/internal-ai-adapter.js:2709`, `backend/internal-ai/server/internal-ai-adapter.js:2801`).

## 3. CLIENT TOOL REGISTRY

Decisione D-ARCH-3: si sceglie l'opzione A, cioe tool tutti lato client in `src/next/chat-ia/tools/`.

Motivazione:

- I reader clone-safe oggi vivono lato NEXT/client, non nel backend.
- Il backend attuale dichiara il live-read business chiuso e vieta live Firestore/Storage lato server (`backend/internal-ai/server/internal-ai-adapter.js:382-394`).
- L'audit dati censisce reader e tool basati su funzioni NEXT, per esempio `readChatIaMezzoSnapshot` e reader documenti/rifornimenti/cisterna (`docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:358-363`, `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:402-426`, `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:530-554`).
- Il backend resta sottile: riceve tool schema, chiama OpenAI, restituisce tool calls o risposta finale.

Cartella prevista:

```text
src/next/chat-ia/tools/
  chatIaToolTypes.ts
  chatIaToolRegistry.ts
  readers/
  calculators/
  generators/
  ui-actions/
```

Formato tool:

```ts
export type ChatIaToolHandler<TInput = unknown, TOutput = unknown> = {
  name: string;
  descriptionForOpenAi: string;
  parameters: ChatIaJsonSchema;
  outputKindHint: ChatIaToolOutputKind;
  timeoutMs?: number;
  run(input: TInput, context: ChatIaToolExecutionContext): Promise<TOutput>;
};
```

Registry:

```ts
export function listChatIaTools(): ChatIaToolDefinition[];
export function getChatIaToolHandler(name: string): ChatIaToolHandler | null;
```

Regole registry:

- niente tool con scritture business;
- tool generatori ammessi solo per PDF/grafici/archivio report;
- tool UI ammessi solo come azioni client-side, per esempio route/modal marker;
- ogni tool deve citare il reader/funzione reale nella propria documentazione tecnica, come richiesto dall'audit tool (`docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:316-322`).

## 4. BRIDGE FRONTEND CICLO TOOL

Il file centrale resta `src/next/chat-ia/backend/chatIaBackendBridge.ts`. Oggi il bridge invia un risultato runner gia pronto a `runInternalAiServerControlledChat` (`src/next/chat-ia/backend/chatIaBackendBridge.ts:60-85`). Con tool use diventa orchestratore del ciclo.

Pseudocodice:

```ts
const MAX_TOOL_ITERATIONS = 4;
const BACKEND_TIMEOUT_MS = 20000;
const TOOL_TIMEOUT_MS = 12000;

async function runChatIaToolUse(prompt, history) {
  let iteration = 0;
  let messages = buildInitialMessages(prompt, history);
  let responseId = null;
  const tools = listChatIaTools();
  const collectedBlocks = [];

  while (iteration < MAX_TOOL_ITERATIONS) {
    const backendResponse = await postChatToolUse({
      operation: "run_tool_use_turn",
      prompt,
      messages,
      tools,
      responseId,
      iteration,
    });

    if (backendResponse.mode === "final") {
      return mapFinalMessageToChatIaMessage(backendResponse.finalMessage, collectedBlocks);
    }

    const toolResults = [];
    for (const call of backendResponse.toolCalls) {
      const handler = getChatIaToolHandler(call.name);
      if (!handler) {
        toolResults.push(buildToolError(call, "not_found", "Tool non disponibile nel client NEXT."));
        continue;
      }
      toolResults.push(await runToolWithTimeout(handler, call.arguments, TOOL_TIMEOUT_MS));
    }

    messages = appendToolResults(messages, backendResponse.toolCalls, toolResults);
    responseId = backendResponse.responseId;
    iteration += 1;
  }

  return buildLoopFallbackMessage();
}
```

Limiti v1:

- massimo 4 iterazioni tool;
- timeout backend 20 secondi per step;
- timeout tool 12 secondi per tool;
- massimo 8 tool calls per iterazione;
- se OpenAI chiede un tool non registrato, il bridge rimanda errore tool a OpenAI una sola volta;
- se dopo il quarto giro non c'e risposta finale, il bridge mostra fallback esplicito.

Gestione errore tool:

- Il tool fallito viene rimandato a OpenAI come `ChatIaToolResult` con `ok: false`.
- OpenAI puo comporre una risposta parziale spiegando cosa non e riuscito.
- Il bridge non rilancia errori non gestiti alla UI.

## 5. PROMPT DI SISTEMA

Decisione D-ARCH-4: system prompt letterale v1.

```text
Sei l'assistente IA del gestionale GestioneManutenzione nella nuova applicazione NEXT.

Rispondi sempre in italiano, con tono operativo, chiaro e prudente.

Puoi aiutare l'utente leggendo dati aziendali tramite tool dichiarati dal frontend NEXT. I tool disponibili leggono snapshot clone-safe, generano output strutturati, preparano grafici o PDF, consultano l'archivio report o propongono azioni UI client-side.

Non puoi eseguire scritture business. Non puoi creare, modificare o cancellare dati aziendali come mezzi, documenti, costi, rifornimenti, cisterna, lavori, manutenzioni, autisti o magazzino. Se un tool di archivio report e disponibile, puo salvare o leggere solo report della chat IA, mai dati business.

Non devi inventare dati. Se un dato non e presente nei risultati dei tool, dichiaralo esplicitamente. Non dedurre targhe, importi, date, litri o scadenze senza fonte.

Scegli i tool solo quando sono necessari per rispondere. Se la richiesta e gia chiara ma richiede dati, chiama prima il tool adatto. Se servono piu passaggi, usa i tool in ordine logico: identificazione entita, lettura dati, calcolo o generazione output.

Se non capisci la richiesta, non tentare una risposta approssimativa. Rispondi esattamente:
"Non capisco questa richiesta sul gestionale. Posso aiutarti con mezzi, flotta, autisti, rifornimenti, documenti, costi, cisterna, segnalazioni, report PDF, grafici e apertura pagine NEXT."

Quando produci la risposta finale, restituisci un JSON valido conforme al contratto ChatIaAssistantFinalMessage. Il campo text contiene la risposta leggibile. Il campo blocks contiene eventuali card, tabelle, grafici, report, archivio o azioni UI. Non aggiungere testo fuori dal JSON.

Se un tool fallisce, usa gli altri risultati disponibili e spiega il limite. Se tutti i tool falliscono, rispondi con fallback chiaro e non inventare.
```

Scelte:

- Il prompt ribadisce sola lettura business, coerente con telaio e audit (`docs/product/MAPPA_IA_CHAT_NEXT.md:28`, `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:6`).
- Il fallback "non capisco" e esplicito per evitare risposte approssimative.
- La risposta finale JSON consente rendering controllato.

## 6. MODELLO E PARAMETRI OPENAI

Decisione D-ARCH-2:

- modello default: `gpt-4o-mini`;
- API: OpenAI Responses API, coerente con backend attuale che usa provider `openai` e `api: "responses"` (`backend/internal-ai/server/internal-ai-adapter.js:374-379`);
- temperatura: `0.2`;
- `max_output_tokens`: `1200` per ogni step;
- `tool_choice`: `auto`;
- parallel tool calls: `false` in v1, per tenere il ciclo deterministico e semplice da debuggare;
- fallback automatico a GPT-4o: no in v1.

Motivo del no a GPT-4o automatico:

- Giuseppe ha accettato il costo API quotidiano, ma la v1 deve restare prevedibile.
- Il fallback modello complicherebbe monitoraggio costi e debug.
- La spec consente override manuale via env server futura, ma non escalation automatica.

Helper backend consigliato:

```js
function getToolUseProviderTarget() {
  return {
    provider: "openai",
    api: "responses",
    model: process.env.INTERNAL_AI_TOOL_USE_MODEL?.trim() || "gpt-4o-mini",
  };
}
```

Questo evita di cambiare il default documentale esistente, che oggi usa `INTERNAL_AI_OPENAI_MODEL` e fallback `gpt-5-mini` (`backend/internal-ai/server/internal-ai-adapter.js:374-379`).

## 7. OUTPUT STRUTTURATO E RENDERING

Decisione D-ARCH-6: la risposta finale non e solo testo. Il backend restituisce JSON finale strutturato, il frontend lo mappa in `ChatIaMessage`.

Contratto:

```ts
type ChatIaAssistantFinalMessage = {
  text: string;
  status: "completed" | "partial" | "failed";
  blocks: ChatIaOutputBlock[];
  entities: Array<{ kind: string; value: string }>;
  sources: Array<{ label: string; toolName?: string; path?: string }>;
  notices: string[];
};

type ChatIaOutputBlock =
  | { kind: "text"; text: string }
  | { kind: "card"; card: ChatIaStructuredCard }
  | { kind: "table"; table: ChatIaTable }
  | { kind: "chart"; chart: ChatIaChartBlock }
  | { kind: "report"; report: ChatIaReport }
  | { kind: "archive_list"; entries: ChatIaArchiveEntry[] }
  | { kind: "ui_action"; action: ChatIaUiActionBlock };
```

Rendering:

- `text` va nel campo `ChatIaMessage.text`, oggi gia renderizzato da `ChatIaMessageItem` (`src/next/chat-ia/components/ChatIaMessageItem.tsx:115`).
- `card` mappa su `ChatIaMessage.card`, gia previsto nei tipi (`src/next/chat-ia/core/chatIaTypes.ts:41-51`) e renderizzato (`src/next/chat-ia/components/ChatIaMessageItem.tsx:26-49`).
- `table` mappa su `ChatIaMessage.table`, gia previsto (`src/next/chat-ia/core/chatIaTypes.ts:53-59`) e renderizzato (`src/next/chat-ia/components/ChatIaMessageItem.tsx:51-93`).
- `report` mappa su `ChatIaMessage.report`, gia previsto (`src/next/chat-ia/core/chatIaTypes.ts:61-82`) e aperto con bottone `Apri report` (`src/next/chat-ia/components/ChatIaMessageItem.tsx:119-126`).
- `archive_list` mappa su `archiveEntries`, gia previsto (`src/next/chat-ia/core/chatIaTypes.ts:84-111`, `src/next/chat-ia/components/ChatIaMessageItem.tsx:128-130`).
- `chart` richiede estensione UI: `recharts` e gia disponibile, ma l'audit conferma che manca un wrapper chart chat IA (`docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:290-292`, `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:697`).
- `ui_action` richiede bottone controllato e whitelist route/modal; l'audit segnala che alcune aperture modal sono stato React locale e richiedono route-state/query param (`docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:698`).

## 8. FLUSSI END-TO-END

### Esempio 1 - Utente: "TI282780"

1. UI invia prompt e tool definitions.
2. OpenAI sceglie `get_vehicle_dossier_snapshot`.
3. Bridge esegue il tool client-side, basato sul reader composito Mezzi gia esistente (`docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:358-363`).
4. Bridge rimanda il risultato a OpenAI.
5. OpenAI restituisce `finalMessage` con testo e block `card`.
6. UI renderizza card usando i renderer gia presenti (`src/next/chat-ia/components/ChatIaMessageItem.tsx:26-49`).

### Esempio 2 - Utente: "rifornimenti aprile 2026"

1. OpenAI sceglie `get_refuelings_aggregated`.
2. Bridge esegue tool aggregazione rifornimenti, candidato censito nell'audit (`docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:410-417`).
3. OpenAI chiede `generate_chart` per grafico semplice.
4. Bridge esegue il tool chart, che in v1 richiede wrapper Recharts (`docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:606-611`).
5. Risposta finale: testo, tabella, grafico.
6. UI renderizza tabella con renderer esistente e grafico con nuovo renderer previsto.

### Esempio 3 - Utente: "non capisco"

1. OpenAI non sceglie tool perche la richiesta non contiene obiettivo operativo.
2. Risposta finale `fallback`:

```text
Non capisco questa richiesta sul gestionale. Posso aiutarti con mezzi, flotta, autisti, rifornimenti, documenti, costi, cisterna, segnalazioni, report PDF, grafici e apertura pagine NEXT.
```

3. UI mostra solo testo, senza tool trace visibile all'utente.

## 9. GESTIONE ERRORI E FALLBACK

### Backend down

Se `postToServer` non raggiunge il backend, il client deve tornare `null`, come fa oggi il client esistente in caso di errore fetch (`src/next/internal-ai/internalAiServerChatClient.ts:31-57`). Il bridge usa fallback router+runner esistente per Mezzi durante la migrazione.

### OpenAI down o non configurato

Il backend risponde:

- `provider_not_configured` se manca `OPENAI_API_KEY`, come pattern attuale (`backend/internal-ai/server/internal-ai-adapter.js:402-412`);
- `upstream_error` se la chiamata provider fallisce, come endpoint orchestrator corrente (`backend/internal-ai/server/internal-ai-adapter.js:2457-2495`).

La UI mostra messaggio operativo e fallback locale se disponibile.

### Tool fallisce

Il bridge genera un `ChatIaToolResult` con `ok: false` e lo rimanda a OpenAI. OpenAI deve rispondere con dato parziale o fallback. Il tool non deve generare scritture business in nessun caso.

### Loop tool infinito

Limite rigido: 4 iterazioni. Se OpenAI continua a chiedere tool, il bridge interrompe e produce:

```text
Non riesco a chiudere questa richiesta con i dati disponibili. Riformula indicando mezzo, periodo o tipo di dato.
```

### Tool non registrato

Il bridge risponde a OpenAI con errore `not_found`. Se OpenAI richiede ancora lo stesso tool, il bridge interrompe il ciclo.

## 10. STREAMING

Decisione D-ARCH-7: v1 single-shot.

Motivazione:

- Il ciclo tool use e gia multi-step.
- Lo streaming complica gestione tool_calls, errori e rendering blocchi.
- La UI attuale renderizza messaggi completi tramite `ChatIaMessageItem` (`src/next/chat-ia/components/ChatIaMessageItem.tsx:103-132`).

V2 possibile:

- streaming solo per la risposta finale;
- nessuno streaming durante tool calls;
- indicatore "sto leggendo dati" lato UI.

## 11. LOGGING COSTI

Decisione D-ARCH-8: loggare usage e stima costo per ogni chiamata backend tool use.

Campi:

```ts
type ChatIaOpenAiUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};

type ChatIaCostEstimate = {
  currency: "USD";
  inputUsd: number | null;
  outputUsd: number | null;
  totalUsd: number | null;
  pricingVersion: string;
};
```

Dove:

- nel response envelope, cosi il frontend puo mostrare o salvare diagnostica;
- nella traceability server-side tramite `appendTraceabilityEntry`, gia usato dall'adapter (`backend/internal-ai/server/internal-ai-adapter.js:9`, `backend/internal-ai/server/internal-ai-adapter.js:70-80`);
- non in Firestore business.

La stima costo e diagnostica, non contabilita fiscale.

## 12. MIGRAZIONE DAL PATTERN ATTUALE

Coesistenza:

- Tool use diventa percorso primario per `/next/chat`.
- Il settore Mezzi router+runner resta fallback se backend tool use non risponde o se tool registry non e pronto.
- Il registry runner attuale registra Mezzi (`src/next/chat-ia/core/chatIaSectorRegistry.ts:11-19`).
- Il runner Mezzi attuale gestisce `canHandle` e `run` (`src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts:107-113`).
- Il reader composito Mezzi resta riusabile come tool `get_vehicle_dossier_snapshot` (`src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:61`).

Quando cancellare il vecchio settore Mezzi:

1. I tool Mezzi coprono card, timeline, materiali, documenti e report oggi prodotti dal runner.
2. I prompt browser di accettazione passano.
3. Il fallback router+runner non viene usato per almeno una tornata di test.
4. La rimozione viene fatta in una patch separata.

## 13. DEFINITION OF DONE ARCHITETTURA

L'architettura tool use e pronta quando:

1. esiste endpoint `POST /internal-ai-backend/chat/tool-use`;
2. endpoint valida request e risponde envelope `chat.tool-use`;
3. modello default v1 e `gpt-4o-mini`;
4. backend riceve tool definitions dal client e non importa reader business;
5. registry client espone tool definitions e handler;
6. bridge esegue ciclo massimo 4 iterazioni;
7. tool results falliti vengono rimandati a OpenAI come errori strutturati;
8. risposta finale ha `ChatIaAssistantFinalMessage`;
9. renderer supporta almeno testo, card, table, report, archive list;
10. chart e ui_action sono o implementati o marcati come output non supportato in v1;
11. usage token e costEstimate vengono restituiti;
12. settore Mezzi router+runner resta fallback durante migrazione;
13. nessuna scrittura business passa dalla chat.

## 14. TEST DI ACCETTAZIONE PER UTENTE

1. Aprire `/next/chat` e chiedere `TI282780`.
2. Verificare che la risposta usi dati Mezzi e mostri una card o riepilogo, non testo inventato.
3. Chiedere `rifornimenti aprile 2026`.
4. Verificare risposta con totale numerico e tabella; se grafico non ancora implementato, deve comparire nota chiara.
5. Chiedere `questa segnalazione e gia successa? guasto motore TI282780`.
6. Verificare che il sistema usi ricerca eventi o dichiari dati insufficienti, senza inventare.
7. Spegnere backend o usare URL backend non configurato: la chat deve mostrare fallback locale, non pagina rotta.
8. Chiedere una scrittura business, per esempio `modifica i litri del rifornimento`: la risposta deve rifiutare la scrittura business.

## 15. DECISIONI VINCOLANTI

- D-ARCH-1: endpoint backend nuovo scelto: `POST /internal-ai-backend/chat/tool-use`, endpointId `chat.tool-use`.
- D-ARCH-2: modello default `gpt-4o-mini`, temperature `0.2`, `max_output_tokens` 1200, nessun fallback automatico a GPT-4o in v1.
- D-ARCH-3: tool registry lato client in `src/next/chat-ia/tools/`; backend sottile, nessun reader business server-side.
- D-ARCH-4: system prompt italiano completo incluso in sezione 5.
- D-ARCH-5: ciclo massimo 4 iterazioni, backend timeout 20s, tool timeout 12s, errori tool rimandati a OpenAI come risultati strutturati.
- D-ARCH-6: output finale strutturato `ChatIaAssistantFinalMessage` con `blocks`, non solo testo libero.
- D-ARCH-7: streaming rinviato a v2; v1 single-shot.
- D-ARCH-8: usage token e stima costo loggati in response e traceability server-side, mai in Firestore business.

## 16. APPENDICE: FILE LETTI

- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md`
- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `src/next/internal-ai/internalAiServerChatClient.ts`
- `src/next/chat-ia/backend/chatIaBackendBridge.ts`
- `src/next/chat-ia/core/chatIaTypes.ts`
- `src/next/chat-ia/components/ChatIaMessageItem.tsx`
- `src/next/chat-ia/core/chatIaSectorRegistry.ts`
- `src/next/chat-ia/core/chatIaRouter.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziRunner.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts`
