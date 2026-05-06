# DIAGNOSI ERRORI CHAT TOOL USE - 2026-04-28

## 1. INTRO

Data: 2026-04-28.

Oggetto: diagnosi statica dell'errore utente "La chat tool use non riesce a contattare il backend OpenAI. Usa /next/chat come rete di sicurezza." nella chat IA NEXT tool use.

Scenari problematici dichiarati:

1. `dossier mezzo TI 315407`
2. `lista mezzi e incrociala con quella dei colleghi`

Scenari funzionanti dichiarati:

- `TI282780`
- `dammi il report di TI136914`
- `situazione cisterna`
- `eventi 136914`

Perimetro: sola lettura codice. Nessuna patch runtime.

## 2. ANALISI STATICA: punti dove appare il fallback

### 2.1 Bridge frontend

File: `src/next/chat-ia/backend/chatIaBackendBridge.ts`.

Il messaggio esatto nasce in `runToolUseConversation`, quando `backendResponse` e' `null`:

- endpoint tool-use: `src/next/chat-ia/backend/chatIaBackendBridge.ts:45`
- timeout frontend backend: `src/next/chat-ia/backend/chatIaBackendBridge.ts:47`
- wrapper timeout che risolve `null`: `src/next/chat-ia/backend/chatIaBackendBridge.ts:83-89`
- fetch POST al backend: `src/next/chat-ia/backend/chatIaBackendBridge.ts:141-148`
- parsing JSON risposta backend; se non JSON torna `null`: `src/next/chat-ia/backend/chatIaBackendBridge.ts:149-150`
- catch fetch; se fetch fallisce torna `null`: `src/next/chat-ia/backend/chatIaBackendBridge.ts:151-153`
- punto esatto del fallback utente: `src/next/chat-ia/backend/chatIaBackendBridge.ts:225-229`

Conclusione: il messaggio visto dall'utente NON indica direttamente un tool `ok:false`. Indica che il bridge non ha ricevuto una risposta JSON valida dal backend entro 20 secondi, oppure che la fetch e' fallita, oppure che manca una base URL valida.

### 2.2 Altri casi gestiti dal bridge

Se il backend risponde JSON con `ok:false`, il bridge usa `backendResponse.message`, non il fallback generico:

- `src/next/chat-ia/backend/chatIaBackendBridge.ts:232-236`

Se il backend arriva alla risposta finale, torna `finalMessage`:

- `src/next/chat-ia/backend/chatIaBackendBridge.ts:239-240`

Se OpenAI continua a chiedere tool oltre il limite, il messaggio e' diverso:

- limite iterazioni: `src/next/chat-ia/backend/chatIaBackendBridge.ts:46`
- loop `0..3`: `src/next/chat-ia/backend/chatIaBackendBridge.ts:208`
- fallback specifico loop: `src/next/chat-ia/backend/chatIaBackendBridge.ts:252-255`

Quindi lo scenario riportato non sembra il caso "loop oltre 4 iterazioni", salvo che in UI venga letto un altro messaggio rispetto a quello dichiarato.

### 2.3 Endpoint backend tool-use

File: `backend/internal-ai/server/internal-ai-adapter.js`.

Casi status diversi da 200:

- request non valida: HTTP 400, `validation_error`, `backend/internal-ai/server/internal-ai-adapter.js:2676-2690`
- provider non configurato: HTTP 503, `provider_not_configured`, `backend/internal-ai/server/internal-ai-adapter.js:2693-2707`
- tool mancanti o provider mancante: HTTP 400/503, `backend/internal-ai/server/internal-ai-adapter.js:2713-2728`
- tool results senza `responseId`: HTTP 400, `validation_error`, `backend/internal-ai/server/internal-ai-adapter.js:2731-2749`
- errore provider/OpenAI: HTTP 502, `upstream_error`, `backend/internal-ai/server/internal-ai-adapter.js:2829-2844`

L'endpoint non ha un timeout proprio nel blocco tool-use. Il timeout osservabile lato UI e' quello frontend da 20 secondi (`src/next/chat-ia/backend/chatIaBackendBridge.ts:47`, `:208-223`).

L'endpoint logga solo successi usage/cost:

- `backend/internal-ai/server/internal-ai-adapter.js:2791-2797`

Nel catch `upstream_error` non c'e' `console.error`; l'errore viene solo serializzato nella envelope HTTP 502:

- `backend/internal-ai/server/internal-ai-adapter.js:2829-2844`

### 2.4 Ciclo Responses API tool output

Il backend costruisce correttamente i `function_call_output`:

- serializzazione output tool: `backend/internal-ai/server/internal-ai-adapter.js:500-508`
- blocco `function_call_output`: `backend/internal-ai/server/internal-ai-adapter.js:511-528`
- seconda chiamata con `previous_response_id`: `backend/internal-ai/server/internal-ai-adapter.js:2731-2769`

Il parser risposta finale e' robusto su JSON puro, code block JSON e substring `{...}`:

- `backend/internal-ai/server/internal-ai-adapter.js:607-645`

Se il parsing finale fallisce, il backend non genera il fallback "non riesce a contattare". Incapsula la risposta provider:

- `backend/internal-ai/server/internal-ai-adapter.js:647-674`

Quindi il caso "parsing risposta fallito" non e' compatibile con il messaggio utente dichiarato.

### 2.5 Executor tool client-side

File: `src/next/chat-ia/tools/chatIaToolExecutor.ts`.

- timeout tool singolo: 12 secondi, `src/next/chat-ia/tools/chatIaToolExecutor.ts:8-14`
- tool non registrato: ritorna `ok:false`, `not_found`, `src/next/chat-ia/tools/chatIaToolExecutor.ts:39-49`
- esecuzione tool: `src/next/chat-ia/tools/chatIaToolExecutor.ts:59-71`
- errore tool o timeout: ritorna `ok:false`, `tool_error|timeout`, `src/next/chat-ia/tools/chatIaToolExecutor.ts:72-84`

Il bridge non abortisce quando un tool torna `ok:false`. Serializza comunque il risultato e lo rimanda al backend:

- esecuzione tool calls: `src/next/chat-ia/backend/chatIaBackendBridge.ts:244-248`
- append dei risultati tool: `src/next/chat-ia/backend/chatIaBackendBridge.ts:167-180`, `:249`

Conclusione: un tool che non trova un dato o va in errore non dovrebbe da solo produrre il fallback generico "non riesce a contattare il backend OpenAI".

## 3. SCENARIO 1: `dossier mezzo TI 315407`

### 3.1 Flusso ricostruito

1. Il frontend invia il prompt a `runToolUseConversation`.
2. Il backend riceve prompt e lista dei 37 tool registrati (`src/next/chat-ia/tools/index.ts:42-83`).
3. OpenAI puo scegliere almeno uno tra:
   - `get_vehicle_dossier_snapshot`, registrato in `src/next/chat-ia/tools/index.ts:72`
   - `get_vehicle_by_plate`, registrato in `src/next/chat-ia/tools/index.ts:70`
   - `open_dossier_page`, registrato in `src/next/chat-ia/tools/index.ts:80`
4. Se riceve `TI 315407`, i tool principali normalizzano togliendo spazi:
   - `get_vehicle_by_plate`: `src/next/chat-ia/tools/registry/toolGetVehicleByPlate.ts:8-9`
   - `get_vehicle_dossier_snapshot`: `src/next/chat-ia/tools/registry/toolGetVehicleDossierSnapshot.ts:6-8`
   - `open_dossier_page`: `src/next/chat-ia/tools/registry/toolOpenDossierPage.ts:6-8`
5. Il reader anagrafica normalizza a sua volta:
   - `src/next/nextAnagraficheFlottaDomain.ts:287-289`
   - `src/next/nextAnagraficheFlottaDomain.ts:880-889`
6. Il reader composito Mezzi normalizza anche caratteri non alfanumerici:
   - `src/next/chat-ia/sectors/mezzi/chatIaMezziTarga.ts:4-8`
   - risoluzione targa: `src/next/chat-ia/sectors/mezzi/chatIaMezziTarga.ts:40-75`
7. Se la targa non esiste, `readChatIaMezzoSnapshot` ritorna `{ ok:false, snapshot:null }`, non lancia eccezione:
   - `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:61-72`

### 3.2 Ipotesi valutate

Ipotesi A: OpenAI estrae `"TI 315407"` con spazio, il tool lo passa al reader, il reader non trova nulla e il bridge interpreta come errore backend.

Esito: poco probabile. La normalizzazione rimuove spazi nei tool e nei reader (`toolGetVehicleDossierSnapshot.ts:6-8`, `nextAnagraficheFlottaDomain.ts:287-289`, `chatIaMezziTarga.ts:4-8`). Inoltre un tool con dato non trovato non genera direttamente il fallback generico (`chatIaToolExecutor.ts:65-83`, `chatIaBackendBridge.ts:167-180`).

Ipotesi B: il tool crasha quando riceve spazi.

Esito: smentita per i tool principali. Le funzioni `normalizeTarga` gestiscono stringhe con spazi (`toolGetVehicleByPlate.ts:8-9`, `toolGetVehicleDossierSnapshot.ts:6-8`, `toolOpenDossierPage.ts:6-8`).

Ipotesi C: OpenAI normalizza ma la targa `TI315407` non esiste, il tool ritorna not found.

Esito: possibile come dato runtime, ma non spiega il fallback generico. In repo statico `TI315407` compare solo come placeholder UI, non come dump dati verificabile. Se il dato non esiste, il flusso dovrebbe comunque arrivare a una risposta finale o a un messaggio di limite, non a "backend non contattabile".

### 3.3 Causa piu probabile scenario 1

La causa piu probabile non e' lo spazio nella targa. E' il timeout frontend da 20 secondi o una risposta non-JSON/fetch failure durante il secondo giro OpenAI, probabilmente dopo una tool call pesante come `get_vehicle_dossier_snapshot`.

Supporto:

- fallback esatto solo su `backendResponse === null`: `src/next/chat-ia/backend/chatIaBackendBridge.ts:225-229`
- timeout frontend 20s: `src/next/chat-ia/backend/chatIaBackendBridge.ts:47`, `:208-223`
- `get_vehicle_dossier_snapshot` chiama `readChatIaMezzoSnapshot`: `src/next/chat-ia/tools/registry/toolGetVehicleDossierSnapshot.ts:21-24`
- `readChatIaMezzoSnapshot` aggrega molti dataset in parallelo: `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:74-90`

## 4. SCENARIO 2: `lista mezzi e incrociala con quella dei colleghi`

### 4.1 Flusso ricostruito

1. OpenAI riceve un prompt multi-intent.
2. I tool candidati sono:
   - `list_vehicles`: registrato in `src/next/chat-ia/tools/index.ts:78`
   - `list_drivers`: registrato in `src/next/chat-ia/tools/index.ts:77`
   - eventualmente `get_driver_by_name` o altri tool autisti: registrati in `src/next/chat-ia/tools/index.ts:62-64`
3. Il backend imposta `parallel_tool_calls:false`:
   - `backend/internal-ai/server/internal-ai-adapter.js:2761-2763`
4. Se OpenAI restituisce piu tool call nello stesso turno, il bridge le esegue comunque in parallelo con `Promise.all`:
   - `src/next/chat-ia/backend/chatIaBackendBridge.ts:244-248`
5. `list_vehicles` ritorna tutti gli item flotta filtrati:
   - reader: `src/next/chat-ia/tools/registry/toolListVehicles.ts:40`
   - output full `items`: `src/next/chat-ia/tools/registry/toolListVehicles.ts:52`
6. `list_drivers` ritorna tutti gli item colleghi/autisti:
   - reader: `src/next/chat-ia/tools/registry/toolListDrivers.ts:25`
   - output full `items`: `src/next/chat-ia/tools/registry/toolListDrivers.ts:28`
7. Il bridge serializza tutti i risultati tool dentro `messages`:
   - `src/next/chat-ia/backend/chatIaBackendBridge.ts:167-180`
8. Il backend riceve `toolResults`, crea `function_call_output` e li rimanda a OpenAI:
   - `backend/internal-ai/server/internal-ai-adapter.js:511-528`
   - `backend/internal-ai/server/internal-ai-adapter.js:2731-2769`

### 4.2 Ipotesi valutate

Ipotesi A: il loop supera 4 iterazioni.

Esito: possibile in astratto, ma non compatibile con il messaggio dichiarato. Il codice produrrebbe "La chat tool use ha raggiunto il limite di iterazioni senza risposta finale.", non "non riesce a contattare il backend OpenAI" (`src/next/chat-ia/backend/chatIaBackendBridge.ts:252-255`).

Ipotesi B: la risposta JSON aggregata e' troppo grande o il payload tool result e' troppo grande.

Esito: probabile. I tool `list_vehicles` e `list_drivers` restituiscono array completi (`toolListVehicles.ts:52`, `toolListDrivers.ts:28`). La richiesta successiva a OpenAI contiene i risultati serializzati come `function_call_output` (`internal-ai-adapter.js:511-528`). Questo puo' aumentare molto input, latenza e probabilita' di timeout lato frontend da 20 secondi.

Ipotesi C: timeout totale 20s superato.

Esito: probabile. Il bridge ha timeout frontend fisso a 20 secondi (`chatIaBackendBridge.ts:47`, `:208-223`). Il backend non ha timeout proprio nell'endpoint e puo' continuare a lavorare oltre la finestra UI. Se la seconda chiamata OpenAI con due dataset grandi supera 20s, il bridge vede `backendResponse === null` e mostra il fallback esatto (`chatIaBackendBridge.ts:225-229`).

### 4.3 Causa piu probabile scenario 2

La causa piu probabile e' combinazione di payload troppo ampio + timeout frontend da 20s. Il prompt chiede incrocio tra liste, ma i tool esistenti restituiscono record completi e non una shape compatta pensata per incroci. Questo rende la seconda chiamata OpenAI piu lenta e fragile.

## 5. CAUSE PIU PROBABILI

### Scenario 1

Priorita 1: timeout/fetch non conclusa entro 20s durante tool use con `get_vehicle_dossier_snapshot`, non errore di normalizzazione targa.

Motivi:

- il fallback esatto si attiva solo se `backendResponse` e' `null` (`chatIaBackendBridge.ts:225-229`);
- la targa con spazio viene normalizzata in tool e reader (`toolGetVehicleDossierSnapshot.ts:6-8`, `nextAnagraficheFlottaDomain.ts:287-289`, `chatIaMezziTarga.ts:4-8`);
- il reader composito carica molti dataset (`chatIaMezziData.ts:74-90`).

Priorita 2: backend risponde non-JSON o connessione interrotta. Possibile, ma non dimostrabile staticamente senza log backend o Network tab.

### Scenario 2

Priorita 1: timeout frontend da 20s sulla seconda iterazione dopo risultati `list_vehicles` + `list_drivers` troppo grandi.

Motivi:

- `list_vehicles` ritorna `items` completi (`toolListVehicles.ts:52`);
- `list_drivers` ritorna `items` completi (`toolListDrivers.ts:28`);
- tool results vengono serializzati e reinviati a OpenAI (`chatIaBackendBridge.ts:167-180`, `internal-ai-adapter.js:511-528`);
- timeout frontend e' 20s (`chatIaBackendBridge.ts:47`, `:208-223`).

Priorita 2: mismatch sequenziale/parallelo. Il backend chiede `parallel_tool_calls:false` (`internal-ai-adapter.js:2761-2763`), ma se arrivano piu call il client le esegue in parallelo (`chatIaBackendBridge.ts:244-248`). Non e' necessariamente causa primaria, ma va reso coerente.

## 6. FIX PROPOSTI

Nessun fix implementato in questa diagnosi.

### Fix diagnostici prioritari

1. Distinguere nel bridge i casi oggi fusi in `backendResponse === null`:
   - base URL assente;
   - fetch/network error;
   - HTTP non JSON;
   - timeout 20s.
   Riferimento: `src/next/chat-ia/backend/chatIaBackendBridge.ts:133-153`, `:208-229`.

2. Aggiungere log backend su catch dell'endpoint tool-use:
   - loggare `requestId`, `iteration`, `providerTarget`, `error.message`;
   - oggi esiste solo `console.info` su successo (`backend/internal-ai/server/internal-ai-adapter.js:2791-2797`), non su errore (`:2829-2844`).

3. Nei log frontend o nel messaggio tecnico interno, indicare se il fallback e' timeout. Il timeout viene deciso da `withTimeout` (`chatIaBackendBridge.ts:83-89`), ma oggi ritorna solo `null` come fetch failure.

### Fix funzionali scenario 1

1. Per prompt `dossier mezzo <targa>`, preferire tool leggero `open_dossier_page` o `get_vehicle_by_plate` quando l'utente vuole aprire/vedere dossier, e usare `get_vehicle_dossier_snapshot` solo se chiede analisi completa.
2. Ridurre output di `get_vehicle_dossier_snapshot` o creare una variante compatta per OpenAI. Il reader composito puo' restare intatto, ma il tool non deve reinviare sempre tutto il payload se basta una card.
3. Mantenere normalizzazione targa: e' gia presente e non risulta il problema.

### Fix funzionali scenario 2

1. Rendere `list_vehicles` e `list_drivers` compatti per default:
   - campi minimi per incrocio: targa, categoria, autistaNome, id/autista/badge se disponibile;
   - limit e conteggio totale;
   - niente record full di default.
2. Creare un tool dedicato di incrocio, ad esempio `cross_vehicles_with_drivers`, che legge entrambi i dataset lato client e torna gia' la tabella incrociata. Evita due tool calls e payload intermedi grandi.
3. Se OpenAI restituisce piu tool calls, scegliere se rispettare davvero `parallel_tool_calls:false` anche lato client oppure documentare ed eseguire parallelo in modo consapevole.
4. Valutare aumento timeout solo dopo compattazione payload. Aumentare oltre 20s senza ridurre payload nasconde il problema e peggiora UX.

## 7. RACCOMANDAZIONE ORDINE FIX

1. Fix diagnostico bridge: distinguere timeout/fetch/non-JSON/base URL.
2. Log backend `catch` endpoint `/internal-ai-backend/chat/tool-use`.
3. Compattare output `list_vehicles`, `list_drivers`, `get_vehicle_dossier_snapshot`.
4. Aggiungere tool dedicato per incrocio flotta-colleghi.
5. Solo dopo, ritarare `BACKEND_TIMEOUT_MS` se i log dimostrano latenze OpenAI ancora legittime.

## 8. APPENDICE: file letti

- `src/next/chat-ia/backend/chatIaBackendBridge.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `src/next/chat-ia/tools/chatIaToolExecutor.ts`
- `src/next/chat-ia/ChatIaToolUsePage.tsx`
- `src/next/chat-ia/tools/chatIaToolRegistry.ts`
- `src/next/chat-ia/tools/index.ts`
- `src/next/chat-ia/tools/registry/toolGetVehicleByPlate.ts`
- `src/next/chat-ia/tools/registry/toolGetVehicleDossierSnapshot.ts`
- `src/next/chat-ia/tools/registry/toolOpenDossierPage.ts`
- `src/next/chat-ia/tools/registry/toolListVehicles.ts`
- `src/next/chat-ia/tools/registry/toolListDrivers.ts`
- `src/next/chat-ia/tools/registry/toolGetDriverByName.ts`
- `src/next/chat-ia/tools/registry/toolGetVehicleEvents.ts`
- `src/next/chat-ia/tools/registry/toolGenerateReportPdf.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziTarga.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`

Archivista non analizzato.
