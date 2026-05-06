# SPEC CHAT ZERO-INVENZIONI NEXT

## 1. Identita del documento

- **Titolo:** Spec Chat Zero-Invenzioni NEXT
- **Versione:** 1.0
- **Data:** 2026-05-04
- **Revisione:** 1.4 — allineamento audit tecnico Fase 1 e split implementativo (2026-05-04)
- **Stato:** BOZZA
- **Modulo:** Chat IA NEXT `/next/chat`
- **Autore:** Claude Code (operatore), su decisioni vincolanti deliberate in chat con Giuseppe.

### Fonti citate

- Audit ricognitivo eseguito ad aprile 2026 sui file:
  - `src/next/chat-ia/tools/index.ts:64-128`
  - `src/next/chat-ia/tools/chatIaToolRegistry.ts:3-10`
  - `backend/internal-ai/server/internal-ai-adapter.js:675-819` (schema strict CHAT_TOOL_USE_FINAL_MESSAGE_JSON_SCHEMA)
  - `backend/internal-ai/server/internal-ai-adapter.js:821-828`, `:3497-3504` (applicazione schema)
  - `backend/internal-ai/server/internal-ai-adapter.js:831-884` (system prompt)
  - `backend/internal-ai/server/internal-ai-adapter.js:3545-3563`, `:3590-3606` (rigenerazione/fallback fingerprint)
  - `backend/internal-ai/server/internal-ai-adapter.js:3678-3710` (invio finalMessage)
  - `backend/internal-ai/server/lib/fingerprint-validator.js:22-28`, `:174`, `:267-281`
  - `src/next/chat-ia/agents/flottaAgent.ts:33-34`
  - `src/next/chat-ia/agents/operazioniAgent.ts:32-33`
  - `src/next/chat-ia/agents/documentiAgent.ts:31-32`
  - `src/next/chat-ia/agents/cantieriMagazzinoAgent.ts:27-28`
  - `src/next/chat-ia/agents/cisternaRifornimentiAgent.ts:27-28`
  - `src/next/chat-ia/ChatIaToolUsePage.tsx:62-101`
  - `src/next/chat-ia/components/ChatIaMessageItem.tsx:30-35`, `:200`, `:201-204`
  - `src/next/chat-ia/components/ChatIaVisualizationBlocks.tsx:20-36`
  - `src/next/chat-ia/core/chatIaTypes.ts:301-328`
  - `src/next/nextAnagraficheFlottaDomain.ts:130-131`, `:533-536`, `:608-618`
  - `tests/e2e/12-fingerprintIntegrity.spec.ts:97-130`
  - `docs/DIARIO_DECISIONI.md:1-16`
  - `src/next/chat-ia/backend/chatIaBackendBridge.ts:337-349` (bypass multi-agente frontend)
  - `src/next/chat-ia/agents/orchestrator.ts:723-763` (produzione old finalMessage multi-agente)
  - `src/next/chat-ia/agents/visualization.ts:229-289` (old-shape con `text: analytics.narrative`)
  - `src/next/chat-ia/core/chatIaText.ts:26-35`, `:61-87` (riconoscimenti frontend esistenti)
  - `src/next/chat-ia/core/chatIaRouter.ts:84-145` (router frontend esistente)
  - `src/next/chat-ia/agents/orchestrator.ts:104-106` (regex targa multi-agente)
  - `backend/internal-ai/server/internal-ai-adapter.js:3490-3504` (ingresso backend prima della Responses API)
  - `backend/internal-ai/server/internal-ai-adapter.js:537,575,624,633,655,684,788` (campi narrativi residui `description`, `summary`, `text`)
- Decisioni vincolanti D1-D15 deliberate in chat (riportate testualmente in §2 e applicate per tutto il documento).

### Relazione con spec esistenti

Questa spec **rafforza, non sostituisce**:

- `docs/product/MAPPA_IA_CHAT_NEXT.md` resta il telaio costituzionale ad alto livello. La presente spec ne irrigidisce il vincolo "una sola chat senza invenzioni" e specifica come si traduce in schema strict, validator e viste.
- `docs/product/SPEC_OSSATURA_CHAT_IA_NEXT.md` resta valida per la struttura cartelle e i tipi comuni gia introdotti. Questa spec aggiunge `views/` e `relations/` come nuove sotto-cartelle.
- `docs/product/SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md` rimane riferimento per il bridge backend-OpenAI e l'endpoint `chat.tool-use`. Cambia il **paradigma di output**: da "tool use con risposta narrativa" a "intent routing senza risposta narrativa". I conflitti puntuali sono elencati in §18.

---

## 2. Decisione e principio

### 2.1 Dichiarazione formale

La Chat IA NEXT entra nella modalita **Zero-Invenzioni IA** (D1).

**Regola fondamentale:** l'LLM perde il permesso tecnico di scrivere dati business nell'output verso l'utente (D1, D2). La garanzia non e affidata a istruzioni di prompt, e' imposta dallo **schema strict** dell'output, dal **catalogo intent versionato** e dal **rendering certificato** lato React.

### 2.2 Cosa l'LLM NON puo' generare

L'output strutturato dell'LLM **non puo' contenere** alcuna delle seguenti categorie di dato:

- **Targhe** (es. `TI113387`, `TI313387`).
- **Nomi e cognomi** di persone (autisti, colleghi, fornitori, referenti).
- **Date** (di rifornimento, manutenzione, scadenza, evento).
- **Importi** (in qualsiasi valuta, sotto qualsiasi unita).
- **Codici** (id Firestore, badge, codici interni, numeri di documento, IBAN, telai, numeri matricola).
- **Relazioni dato-dato** (autista X guida mezzo Y, fornitore X ha fornito materiale Y, mezzo X ha ricevuto manutenzione Y).
- **Riassunti narrativi sui dati** (es. "Sandro ha effettuato 3 rifornimenti", "il mezzo TI324633 e di tipo motrice").

### 2.3 Cosa l'LLM PUO' generare

L'LLM puo' produrre **solo** quanto consentito dal nuovo schema strict (§5):

- Un'**azione** scelta da una enum chiusa (`view_open`, `disambiguation_request`, `clarification_request`, `error`, `report_request`).
- Una **vista** scelta da una enum chiusa (`Driver360`, `Vehicle360`, `Site360`, `Euromecc360`, `Ricerca360`).
- Un oggetto **filtri** vincolato per shape (vedi §5): solo `searchText`, `entityKind`, `periodPreset`.
- Una **richiesta di disambiguazione** tramite flag; la lista candidati con id reali e label certificati e' popolata dal backend.
- Una **frase di accompagnamento** scelta da whitelist (kind enum + parametri non testuali).

### 2.4 Perimetro della garanzia

- **Garantito:** anti-invenzione IA al 100% sui dati visualizzati. Nessun dato business mostrato all'utente puo' provenire da una generazione LLM. Tutti i dati passano per reader interni clone-safe e renderer certificati.
- **NON garantito:** correttezza dei dati su Firestore (data quality), assenza di bug nel codice del Relation Resolver, assenza di bug nel renderer certificato, copertura funzionale (intent fuori catalogo). Questi sono rischi residui dichiarati in §17.

---

## 3. Stato attuale e buco da chiudere

### 3.1 Sintesi dell'audit

Architettura attuale (fotografia, non interpretazione):

| Aspetto | Riferimento | Stato |
|---|---|---|
| Tool registrati | `src/next/chat-ia/tools/index.ts:64-128` via `register(tool)` (`chatIaToolRegistry.ts:3-10`) | 59 tool attivi (58 importati + 1 file orfano `toolGetWheelGeometryConfig`, blocked) |
| Schema strict OpenAI | `internal-ai-adapter.js:675-819` (`CHAT_TOOL_USE_FINAL_MESSAGE_JSON_SCHEMA`) | Contiene `text` libero (riga 676), `status` (677), `blocks[]` senza minItems (678-802), `entities` (803-809), `sources` (810-817), `notices` (818) |
| Applicazione schema | `internal-ai-adapter.js:821-828`, `:3497-3504` | json_schema strict alla Responses API |
| System prompt | `internal-ai-adapter.js:831-884` | Riga 862-863: "per liste semplici preferisci blocks: []" — non vieta dati in `text` |
| Specialisti agenti | `flottaAgent.ts:33-34`, `operazioniAgent.ts:32-33`, `documentiAgent.ts:31-32`, `cantieriMagazzinoAgent.ts:27-28`, `cisternaRifornimentiAgent.ts:27-28` | Non contengono vincoli "fingerprint" o "dati certificati" |
| Fingerprint validator | `lib/fingerprint-validator.js:22-28` | Valida solo blocchi record (`table.rows`, `ranking_table.rows`, `timeline.items`, `data_table_styled.table.rows`, `nested_list.groups.items`) |
| Estrazione id risposta | `lib/fingerprint-validator.js:174` | `extractResponseRecordIds` parte da `finalResponse?.blocks` — **NON ispeziona `finalResponse.text`** |
| Calcolo `valid` | `lib/fingerprint-validator.js:267-281` | `valid` calcolato senza considerare `fingerprintCoverageWarning` |
| Rigenerazione/fallback | `internal-ai-adapter.js:3545-3563`, `:3590-3606` | Si attiva solo se `!fingerprintValidation.valid` |
| Invio finalMessage | `internal-ai-adapter.js:3678-3710` | Inviato cosi com'e al client |
| Renderer | `ChatIaToolUsePage.tsx:62-101` converte finalMessage in ChatIaMessage; `ChatIaMessageItem.tsx:200` mostra **sempre `message.text` prima dei blocchi** (`:201-204`) | Testo libero LLM mostrato all'utente |
| Blocchi visualizzazione | `ChatIaVisualizationBlocks.tsx:20-36` (dispatcher); kind in `chatIaTypes.ts:301-328` | `profile_card` non esiste come kind; `ChatIaMezzoCard` invocato fuori sistema blocchi (`ChatIaMessageItem.tsx:30-35`) |
| Relazioni autista-mezzo | `nextAnagraficheFlottaDomain.ts:130-131`, `:533-536`, `:608-618` | Basata su `autistaId`. **Nessun campo "fonte relazione" propagato** (`relationProof` non esiste) |

### 3.2 Identificazione esatta del buco architetturale

Il buco attuale e' che:

1. **Lo schema strict ammette `text` libero** (`internal-ai-adapter.js:676`). L'LLM puo' scrivere dati arbitrari in quel campo.
2. **Lo schema strict ammette `blocks[]` vuoto** (`internal-ai-adapter.js:678-680`, no `minItems`). Quindi una risposta solo testo passa lo schema.
3. **Il system prompt incoraggia ma non vieta** dati nel testo (`internal-ai-adapter.js:862-863`).
4. **Il fingerprint validator non ispeziona `text`** (`fingerprint-validator.js:174`). Se l'LLM scrive una targa in `text`, il validator non se ne accorge.
5. **Il validator considera `valid=true` anche con `fingerprintCoverageWarning=true`** (`fingerprint-validator.js:267-281`). Quindi una risposta solo testo che mostra una targa inventata produce solo un warning, non un blocco.
6. **Il renderer mostra `message.text` per primo** (`ChatIaMessageItem.tsx:200-204`). L'utente vede prima il testo libero LLM dei blocchi certificati.

### 3.3 Test che gia' documenta il buco

Il test `tests/e2e/12-fingerprintIntegrity.spec.ts:97-130` documenta esplicitamente che una risposta con dato in `text` (e blocchi vuoti) passa il validator con `valid=true` e produce solo `fingerprintCoverageWarning=true`. Il buco e' noto e tracciato.

### 3.4 Scoperte audit tecnico Fase 1

- Esiste un bypass multi-agente frontend in `src/next/chat-ia/backend/chatIaBackendBridge.ts:337-349`: `runChatIaMultiAgentIfHandled` puo' restituire un `finalMessage` prima della chiamata backend e quindi bypassare schema OpenAI e Catalog Validator.
- `src/next/chat-ia/agents/orchestrator.ts:723-763` e `src/next/chat-ia/agents/visualization.ts:229-289` possono produrre old-shape; `visualization.ts` costruisce `text: analytics.narrative`.
- La pipeline pre-LLM deterministica backend non risulta implementata. Esistono riconoscimenti frontend/agent (`chatIaText.ts:26-35`, `:61-87`, `chatIaRouter.ts:84-145`, `orchestrator.ts:104-106`), ma il punto backend tool-use prima di OpenAI e' `backend/internal-ai/server/internal-ai-adapter.js:3490-3504`.
- Lo schema attuale contiene campi narrativi residui: `summary` (`internal-ai-adapter.js:624,633,655`), `description` (`:537,575`) e `text` nei blocchi (`:684,788`). Non risultano trovati `comment`, `explanation`, `reasoning`, `narrative` nello schema backend auditato.
- Conseguenza operativa: la Fase 1 non va implementata in modo monolitico. Viene spezzata in Fase 1A backend, Fase 1B frontend/bypass multi-agente e Fase 1C test.

---

## 4. Architettura target

### 4.1 Flusso end-to-end

```text
        +----------------------------+
        |          Utente            |
        |  (campo libero chat NEXT)  |
        +-------------+--------------+
                      |
                      v
        +----------------------------+
        |    LLM Action Router       |
        |  (OpenAI Responses API     |
        |   con NUOVO schema strict) |
        | output: action + view +    |
        | filters + clarification +  |
        | disambiguation +           |
        | accompaniment              |
        +-------------+--------------+
                      |
                      v
        +----------------------------+
        |    Catalog Validator       |
        | (verifica conformita'      |
        |  catalogo intent +         |
        |  shape filtri + view)      |
        +-------------+--------------+
                      |
        +-------------+--------------+
        | conforme?                  |
        +-------+----------+---------+
            si  |          | no
                v          v
   +----------------------+  +-----------------------+
   |  Vista certificata   |  |  fallback             |
   |  (Driver360,         |  |  accompaniment.kind = |
   |   Vehicle360, ...)   |  |  error_intent_not_in_ |
   |                      |  |  catalog              |
   +----------+-----------+  +-----------------------+
              |
              v
   +----------------------+
   | Reader interni       |
   | (i 59 tool del       |
   |  registry attuale,   |
   |  declassati a reader)|
   +----------+-----------+
              |
              v
   +----------------------+
   | Relation Resolver    |
   | deterministico       |
   | (regole forti, no    |
   |  fuzzy match)        |
   +----------+-----------+
              |
              v
   +----------------------+
   | Renderer React       |
   | certificato          |
   | (NON legge           |
   |  message.text)       |
   +----------------------+
```

### 4.2 Ruoli precisi

- **LLM Action Router:** capisce la frase utente, classifica l'intent, sceglie l'azione e la vista, precompila i filtri, chiede disambiguazione/chiarimento se serve. Output limitato dal nuovo schema strict (§5).
- **Catalog Validator:** confronta l'output LLM contro il catalogo intent versionato (§6). Output fuori catalogo => fallback con `accompaniment.kind = error_intent_not_in_catalog`.
- **Vista certificata:** componente React (`Driver360`, `Vehicle360`, `Site360`, `Euromecc360`, `Ricerca360`) che riceve filtri, chiama i reader interni, applica il Relation Resolver, renderizza solo dati certificati. Non riceve mai testo dall'LLM.
- **Reader interni:** i 59 tool del registry attuale (D6) restano dove sono; cambia solo chi li chiama. Non sono piu' "function calling targets" dell'LLM, sono "reader interni" delle viste.
- **Relation Resolver deterministico:** modulo TypeScript (non LLM) che applica le regole forti di relazione (D10, D11). Mai fuzzy.
- **Renderer React certificato:** non legge `message.text`, dispatcha sulla vista in base a `message.action` (D15).

### 4.3 Cosa l'LLM PUO' fare (lista chiusa)

1. Classificare l'intent della frase utente in una `action` (enum chiuso §5).
2. Scegliere una `view` (enum chiuso §5).
3. Precompilare `filters` rispettando shape vincolata (§5).
4. Richiedere `clarification` (kind enum + params, §5, §10).
5. Richiedere `disambiguation` producendo solo il flag `disambiguation_required: true`. La lista candidati con id reali e label certificati e' popolata dal backend; l'LLM non sceglie ne' tocca id.
6. Scegliere `accompaniment.kind` da whitelist (§10).

### 4.4 Cosa l'LLM NON puo' fare (lista chiusa)

1. Scrivere testo libero su dati (targhe, nomi, date, importi, codici, relazioni, riassunti).
2. Inventare id, refId, targhe, badge.
3. Inferire relazioni autista-mezzo o autista-rifornimento.
4. Generare contenuto narrativo sui risultati di un reader.
5. Scegliere candidati di disambiguazione (l'utente clicca, non l'LLM).
6. Selezionare template PDF non in whitelist (§13).
7. Aggiungere viste o azioni non in catalogo (§6).
8. Produrre id, targhe, date finali o label certificati: l'LLM produce solo `searchText`, `entityKind`, `periodPreset` e flag di richiesta.

---

## 5. Schema strict del nuovo output LLM

### 5.1 Principio

Lo schema strict sostituisce il `CHAT_TOOL_USE_FINAL_MESSAGE_JSON_SCHEMA` attuale (`internal-ai-adapter.js:675-819`). **Nessun campo dello schema deve ammettere testo libero su dati**. Il campo `text` libero scompare. E' sostituito da `accompaniment` strutturato (D3).

### 5.2 Shape testuale (TypeScript-like, non codice eseguibile)

```text
ChatZeroInvenzioniMessage = {
  action: ActionEnum,
  view: ViewEnum | null,
  filters: FiltersShape | null,
  clarification: ClarificationShape | null,
  disambiguation: DisambiguationShape | null,
  report: ReportRequestShape | null,
  accompaniment: AccompanimentShape
}

ChatZeroInvenzioniMessage backend->frontend aggiunge:
  resolvedFilters: ResolvedFiltersShape | null

ActionEnum = "view_open" | "disambiguation_request" | "clarification_request"
           | "error" | "report_request"

ViewEnum = "Driver360" | "Vehicle360" | "Site360"
         | "Euromecc360" | "Ricerca360" | null

FiltersShape = {
  searchText: string | null,          // frase normalizzata, eco utente, mai dato certificato
  entityKind: "driver" | "vehicle" | "site" | "supplier" | "euromecc" | null,
  periodPreset: "all" | "last_7d" | "last_30d" | "last_90d"
              | "this_month" | "this_year" | "custom" | null
}

ResolvedFiltersShape = {
  driverId?: string,
  vehiclePlate?: string,
  siteId?: string,
  period?: { from: string, to: string } | null
}

ClarificationShape = {
  kind: ClarificationKindEnum,
  params: { fieldHint?: "period" | "subject" | "scope" }
}
ClarificationKindEnum = "missing_subject" | "missing_period" | "ambiguous_scope"

DisambiguationShape = {
  disambiguation_required: true
}

AccompanimentShape = {
  kind: AccompanimentKindEnum,
  params: { count?: number } | null
}
AccompanimentKindEnum = "view_opened" | "no_results"
                     | "disambiguation_required"
                     | "clarify_too_many_results"
                     | "clarify_period_required"
                     | "error_intent_not_in_catalog"
                     | "error_view_unavailable"
```

### 5.3 Regole su come l'LLM deve produrre output

- **Nessun campo narrativo `text`, `summary`, `narrative`, `description`, `comment`, `explanation`, `reasoning`** ammesso nello schema.
- I campi `summary` e `description` sono stati trovati nello schema attuale dall'audit Fase 1 e devono essere esplicitamente vietati nel nuovo schema.
- L'LLM **non puo' produrre id, targhe, date finali o displayLabel**. Puo' produrre solo `searchText`, `entityKind`, `periodPreset` e flag di richiesta.
- `resolvedFilters` non e' nello schema OpenAI strict: viene popolato dal backend dopo risoluzione deterministica.
- `disambiguation` nello schema LLM e' solo `disambiguation_required: true`. La lista candidati con id reali e `displayLabel` reali viene popolata dal backend, che non passa id candidati all'LLM.
- `report` e' presente solo quando `action = report_request`. Per altre azioni e' `null`.
- `report` NON contiene id reali, targhe, date finali o label certificati. Contiene solo `template`, `subjectKind` e `periodPreset`. Il soggetto reale e il periodo finale sono risolti dal backend in `resolvedFilters`.
- `searchText` NON e' un dato business: e' la frase utente normalizzata. Non viene MAI rimostrato come dato certificato; puo' essere rimostrato solo come eco input utente, separata dai dati.
- `entityKind` e `periodPreset` sono enum chiusi. `periodPreset = custom` richiede risoluzione UI/backend, non date prodotte dall'LLM.
- `additionalProperties: false` su tutti gli oggetti.
- Tutti i campi enum sono chiusi.

### 5.4 Pipeline pre-LLM e post-LLM

**Pre-LLM (lato backend, prima di chiamare OpenAI):**

1. Riceve frase utente.
2. Esegue NER lessicale leggero deterministico, senza LLM: cerca pattern di targa (`TI\d{6}`), date in formato comune e `periodPreset` noti. Risultato: hint `entityKind` e `periodPreset` se rilevati.
3. Costruisce un context informativo per il system prompt che dichiara solo le viste e gli intent disponibili. NON passa all'LLM dati Firestore o id.
4. L'LLM produce output con `searchText`, `entityKind`, `periodPreset`.

Nota audit Fase 1: la pipeline pre-LLM backend non risulta ancora implementata. In Fase 1A va introdotta prima della chiamata OpenAI in `internal-ai-adapter.js:3490-3504`.

Decisione operativa Fase 1A: la pipeline pre-LLM backend viene introdotta come modulo dedicato in `backend/internal-ai/server/lib/`. Le logiche frontend esistenti (`chatIaText.ts`, `chatIaRouter.ts`) NON vengono importate ne' riusate. Il backend e' fonte di verita' per il NER deterministico. Le logiche frontend possono restare come hint UX ma non sono parte della pipeline ufficiale.

**Post-LLM (lato backend, dopo output LLM e dopo Catalog Validator):**

1. Resolver deterministico: `(searchText, entityKind) -> candidati Firestore`. Soglia: max N candidati, default proposto 20. Se piu' di N: `accompaniment.kind = clarify_too_many_results`.
2. Se 0 candidati: `accompaniment.kind = no_results`.
3. Se 1 candidato: backend popola `resolvedFilters.<id>` direttamente; `action = view_open`.
4. Se 2..N candidati: backend popola `disambiguation.candidates` con id reali e `displayLabel` reali; `action = disambiguation_request`.
5. Resolver `periodPreset -> resolvedFilters.period { from, to }` deterministico (es. `last_30d` -> oggi-30 .. oggi).
6. Per `periodPreset = custom`: il backend richiede UI calendar lato React. L'LLM non puo' calcolare date custom. Fallback: `clarification_request` con `kind = missing_period` e `accompaniment.kind = clarify_period_required`.

---

## 6. Catalogo Intent

### 6.1 Decisione

Il catalogo intent e' un **file versionato** (D4) nel repo. Path proposto:

```text
src/next/chat-ia/intent-catalog.json
```

E' fonte di verita' per il Catalog Validator. Modifiche al catalogo passano per code review come ogni altro file di codice.

### 6.2 Shape del catalogo (TypeScript-like)

```text
IntentCatalog = {
  version: string,
  intents: Array<IntentDefinition>
}

IntentDefinition = {
  id: string,                           // es. "driver360.view_by_id"
  action: ActionEnum,
  view: ViewEnum | null,
  requiredFilters: Array<FilterFieldKey>,
  optionalFilters: Array<FilterFieldKey>,
  examples: Array<string>,              // frasi utente esemplificative, solo per training prompt
  clarificationsAllowed: Array<ClarificationKindEnum>
}

FilterFieldKey = "searchText" | "entityKind" | "periodPreset"
ResolvedFilterFieldKey = "driverId" | "vehiclePlate" | "siteId" | "period"
```

### 6.3 Intent MVP per Driver360 (Fase 2, caso Sandro)

Intent inclusi nell'MVP:

- `driver360.view_by_id` — apre Driver360 con `resolvedFilters.driverId` univoco popolato dal backend.
- `driver360.disambiguate_by_name` — l'LLM ha riconosciuto un nome ma trova piu' candidati. Output: `disambiguation_request`.
- `driver360.clarify_period` — l'utente ha chiesto attivita' senza periodo, vista richiede periodo: `clarification_request` con `kind = missing_period`.

Filtri LLM: `searchText`, `entityKind`, `periodPreset`. Filtri risolti backend: `driverId` (richiesto per `view_by_id`), `period` (opzionale).

### 6.4 Fallback

Se l'output LLM:

- ha `action` non in catalogo, oppure
- ha `view` non compatibile con l'`action` per quell'intent, oppure
- ha filtri richiesti mancanti senza una `clarification` corrispondente, oppure
- il resolver backend trova troppi candidati per la soglia consentita

allora il Validator forza `accompaniment.kind = error_intent_not_in_catalog`, `action = error`, `view = null`; nel caso troppi candidati forza `accompaniment.kind = clarify_too_many_results`. Il renderer mostra la frase di whitelist corrispondente (§10).

### 6.5 Regola di evoluzione del catalogo

- Aggiunte al catalogo richiedono PR e code review.
- Ogni nuovo intent deve avere: id, action, view, requiredFilters, esempi.
- Aggiunta di una nuova `view` richiede contestuale aggiunta del componente vista (§7) e dei reader interni necessari.
- Rimozioni dal catalogo richiedono verifica di non rottura dei test E2E.

---

## 7. Viste certificate

### 7.1 Definizione

Una **vista certificata** e' un componente React in `src/next/chat-ia/views/` che:

1. Riceve come input `filters` validati dal Catalog Validator.
2. Chiama reader interni clone-safe (i 59 tool del registry attuale).
3. Applica il Relation Resolver deterministico (§8) per arricchire i risultati con relazioni certificate.
4. Renderizza solo dati provenienti dai reader. **Non riceve mai e non legge mai testo dall'LLM**.
5. Accompagna il rendering con la frase di whitelist scelta (§10).

### 7.2 Lista viste in scope

| Vista | Path proposto | Soggetto principale |
|---|---|---|
| Driver360 | `src/next/chat-ia/views/Driver360.tsx` | autista (id) |
| Vehicle360 | `src/next/chat-ia/views/Vehicle360.tsx` | mezzo (targa exact match) |
| Site360 | `src/next/chat-ia/views/Site360.tsx` | cantiere |
| Euromecc360 | `src/next/chat-ia/views/Euromecc360.tsx` | task / area Euromecc |
| Ricerca360 | `src/next/chat-ia/views/Ricerca360.tsx` | orchestratore di ricerca generica |

### 7.3 Shape comune (TypeScript-like)

```text
CertifiedViewProps = {
  filters: FiltersShape,
  resolvedFilters: ResolvedFiltersShape,
  accompaniment: AccompanimentShape
}

CertifiedViewOutput = renderizza:
  - header con soggetto certificato (label da reader, non da LLM)
  - sezioni dati strutturati (card, tabelle, blocchi visualizzazione esistenti)
  - eventuale relationProof dove richiesto (§14, fase 2)
  - frase di accompagnamento da whitelist (§10)
```

Le viste certificate operano su `resolvedFilters` per id, targhe, periodi. `filters` e' eco utente, non fonte di verita'.

### 7.4 Reader interni per vista (riferimento ai 59 tool reali)

Citazione nominale dei tool dell'audit (path reale `src/next/chat-ia/tools/registry/`):

- **Driver360** — usa: `toolGetDriverByName`, `toolGetDriverByBadge`, `toolGetDriverActivity`, `toolGetDriverOperationalProfile`, `toolListVehicles` (per relation autista-mezzo), `toolGetRefuelings` (per attivita' rifornimenti).
- **Vehicle360** — usa: `toolGetVehicleByPlate`, `toolGetVehicleDossierSnapshot`, `toolGetVehicleEvents`, `toolGetVehicleMaintenanceHistory`, `toolGetVehicleDocuments`, `toolGetVehicleCostSummary`, `toolGetVehicleTimeline360`, `toolGetVehicleStatus`.
- **Site360** — usa: `toolGetSiteEquipment`, `toolGetMaterialMovements`.
- **Euromecc360** — usa: `toolGetEuromeccSnapshot`.
- **Ricerca360** — orchestra: `toolSearchVehiclesByAttribute`, `toolSearchDocumentsAndInvoices`, `toolSearchMaintenances`, `toolSearchOperationalEvents`, `toolSearchWorkOrders`, `toolFindInvoiceSupplier`, `toolFindOutliers`.

Tutti questi tool **continuano ad esistere** (D6). Cambia solo il chiamante: prima era OpenAI via function calling, ora e' il codice della vista.

### 7.5 Convenzione naming

- Cartella: `src/next/chat-ia/views/`
- File: `<NomeVista>.tsx` (CamelCase, es. `Driver360.tsx`)
- CSS associato: `<nomeVista>.css` (camelCase, es. `driver360.css`) — opzionale, allineato a convenzione esistente di `chatIa.css`.

### 7.6 Layer di normalizzazione tool result

Ogni vista certificata applica un layer di normalizzazione tra il reader interno (tool del registry) e il renderer/Relation Resolver. La normalizzazione:

1. converte campi in shape attesa dalla vista;
2. rimuove campi non ammessi;
3. applica regole di filtering business della vista;
4. rifiuta record che non hanno i campi minimi richiesti, es. record senza `id` o `targa`.

I tool del registry NON sono fidati direttamente. Catena: tool result -> normalizzazione -> Relation Resolver -> renderer.

Naming proposto: `src/next/chat-ia/views/<vista>/normalizers/<entityKind>Normalizer.ts`. Posizione finale da decidere in Fase 2.

---

## 8. Relation Resolver deterministico

### 8.1 Principio

**Nessuna relazione e' inferita dall'LLM** (D10). Tutte le relazioni autista-mezzo, autista-rifornimento, autista-attivita' sono calcolate da un modulo TypeScript dedicato in `src/next/chat-ia/relations/`. Il modulo applica regole forti, esplicite, testabili. Nessun fuzzy match, nessuna deduzione.

### 8.2 Regole forti per relazione autista-mezzo (D10)

Una relazione autista-mezzo e' valida se e solo se almeno una delle seguenti condizioni e' rispettata:

1. **`autistaId` esplicito** sul record mezzo (`nextAnagraficheFlottaDomain.ts:130-131`, `:533-536`, `:608-618`).
2. **Assegnazione attiva** in `@autisti_sessione_attive` con `autistaId` e `mezzoTarga` coerenti.
3. **Evento cambio mezzo confermato** in `@storico_eventi_operativi` con `tipo` ∈ {`INIZIO_ASSETTO`, `CAMBIO_ASSETTO`} e `confermatoAutista = true` (se il campo esiste; altrimenti regola degenera a 1 e 2).
4. **Rifornimento con `autistaId` e `targaCamion` coerenti** in `@rifornimenti_autisti_tmp`.

**Mai**:

- Match per nome simile.
- Match per targa simile.
- Deduzione da note libere.
- Deduzione da contiguita' temporale senza evento esplicito.

### 8.3 Regola exact match targhe (D11)

Le targhe sono **exact match only**. `TI113387` e' diverso da `TI313387`. Il Relation Resolver e il Catalog Validator scartano qualsiasi match non esatto. Normalizzazione consentita: trim spazi, uppercase. **Niente** di piu'.

### 8.4 Shape input/output (TypeScript-like)

```text
RelationResolverInput = {
  subjectKind: "driver" | "vehicle" | "site",
  subjectId: string,
  relationKind: "driver_vehicle" | "driver_refueling"
              | "driver_activity" | "vehicle_documents"
              | "vehicle_maintenances" | ...,
  period?: { from: string, to: string } | null
}

RelationResolverOutput = {
  matches: Array<{
    relatedId: string,
    relatedKind: "driver" | "vehicle" | "site" | "document" | ...,
    rule: RuleNameEnum,                         // regola che ha matchato
    sourceCollection: string,                   // es. "@mezzi_aziendali"
    sourceRecordId: string,                     // id record nella collection
    sourceField: string,                        // es. "autistaId"
    certainty: "exact" | "explicit_assignment"
  }>,
  unresolvedReason?: "no_match" | "ambiguous" | "no_proof"   // se matches.length === 0
}
```

### 8.5 Testabilita'

Ogni regola = un test unitario nel modulo `src/next/chat-ia/relations/`. Test casi:

- Caso Sandro: input `subjectKind=driver, subjectId=<id Sandro>` non deve mai produrre `relatedId = TI313387` se la regola 1-2-3-4 non porta a quella targa.
- Targhe simili: `TI113387` vs `TI313387` non devono mai matchare a vicenda.
- `autistaId` mancante: produce `unresolvedReason = no_match`, non match degenerato.

### 8.6 Relazioni MVP per Driver360

- `driver_vehicle` (regole 1-4 §8.2).
- `driver_refueling` (regola 4 §8.2 estesa per rifornimento singolo).
- `driver_activity` (regola: record in `@storico_eventi_operativi` con `autistaId` o `badgeAutista` corrispondente all'autista subject).

`driver_vehicle`, `driver_refueling` e `driver_activity` rientrano tra le relazioni critiche (§14.4) e quindi richiedono `relationProof`. Se il Relation Resolver non puo' costruire `relationProof`, il match e' scartato con `unresolvedReason = no_proof`.

---

## 9. Disambiguazione

### 9.1 Regola

Se la risoluzione lato backend trova **piu' di 1 candidato**, l'LLM **non sceglie** (D5). L'LLM produce solo `action = disambiguation_request` e `disambiguation.disambiguation_required = true`. Il backend popola `disambiguation.candidates` con id reali e label gia' recuperati lato codice.

### 9.2 Shape

Vedi `DisambiguationShape` in §5.2.

### 9.3 UX prevista (testuale)

- Il renderer mostra:
  - frase di whitelist `disambiguation_required` (§10);
  - lista cliccabile di candidati con `displayLabel` backend e meta-informazione `kind`;
  - al click, l'utente scatena un nuovo turno con `resolvedFilters.<...Id> = candidate.id` precompilato — **l'utente, non l'LLM**.

### 9.4 Candidato univoco risolto dal backend

Se la risoluzione lato backend trova 1 solo candidato, e' il backend a precompilare `resolvedFilters.<id>` e a impostare `action = view_open`. L'LLM non riceve l'id, non lo sceglie, non lo tocca. Il flusso degrada deterministicamente alla vista certificata. L'LLM ha gia' prodotto `searchText` e `entityKind` nel turno corrente; il backend usa quelli per risolvere.

---

## 10. Frasi accompagnamento (whitelist)

### 10.1 Principio

**Nessun testo libero generato dall'LLM viene mostrato all'utente** (D2). Le frasi accompagnamento sono renderizzate **lato frontend** in base a `accompaniment.kind`. La traduzione kind -> frase italiana e' nel codice React, non nell'LLM.

### 10.2 Lista chiusa di kind

| `kind` | Frase italiana proposta (rendering frontend) |
|---|---|
| `view_opened` | "Apro la vista." |
| `no_results` | "Nessun risultato per i filtri specificati." |
| `disambiguation_required` | "Ho trovato piu' candidati. Scegli quale aprire." |
| `clarify_too_many_results` | "Ho trovato troppi risultati. Specifica meglio la richiesta." |
| `clarify_period_required` | "Per questa vista serve un periodo. Sceglilo dal calendario." |
| `error_intent_not_in_catalog` | "Non ho capito la richiesta. Riformula con un soggetto piu' preciso." |
| `error_view_unavailable` | "La vista richiesta non e' disponibile." |

### 10.3 Vincolo

Il rendering della frase NON puo' essere influenzato dall'LLM oltre a `kind` e `params.count` (intero, opzionale, usato solo per messaggi tipo "n risultati"). Nessun parametro stringa libero.

---

## 11. Validator nuovo

### 11.0 Posizione del Catalog Validator

Il Catalog Validator gira lato backend (Node.js, `backend/internal-ai/server/`) come difesa primaria. Una versione frontend puo' esistere come check secondario per UX, ma non e' fonte di verita' della validazione. Se il Catalog Validator backend rifiuta, il client riceve esclusivamente la struttura di errore §11.4. Mai si torna al vecchio schema narrativo come fallback (vietato).

### 11.1 Cambio natura

Il **fingerprint validator** attuale (`backend/internal-ai/server/lib/fingerprint-validator.js:22-28`, `:174`, `:267-281`) e' declassato a **guardrail di regressione** (D8). Non e' piu' difesa primaria.

La nuova **difesa primaria** e' il Catalog Validator: non valida piu' i dati nei blocchi, valida la **conformita' dell'azione** rispetto al catalogo intent (§6).

### 11.2 Input

```text
CatalogValidatorInput = {
  llmOutput: ChatZeroInvenzioniMessage,
  candidatePool: {
    drivers: Array<{ id, displayLabel }>,
    vehicles: Array<{ plate, displayLabel }>,  // `plate` e' business key primaria
    sites: Array<{ id, displayLabel }>,
    suppliers: Array<{ id, displayLabel }>
  },
  catalog: IntentCatalog
}
```

Per i mezzi, `plate` (targa) e' la business key primaria usata come identificatore. Le regole exact match (D11) si applicano.

`candidatePool` e' recuperato lato backend dopo l'output LLM e non viene passato all'LLM. Viene usato dal resolver deterministico e dal Catalog Validator per popolare `resolvedFilters` e candidati di disambiguazione backend.

### 11.3 Regole di validazione

1. `action` ∈ enum chiuso.
2. Se `action = view_open`: `view` non null e ∈ enum chiuso; deve esistere un intent in catalogo che combina `(action, view)`.
3. `filters` puo' contenere solo `searchText`, `entityKind`, `periodPreset`.
4. `filters` non puo' contenere `driverId`, `vehiclePlate`, `siteId`, `period`, `displayLabel` o date finali.
5. `resolvedFilters.driverId`, se popolato dal backend, deve appartenere a `candidatePool.drivers`.
6. `resolvedFilters.vehiclePlate`, se popolato dal backend, deve essere exact match in `candidatePool.vehicles`.
7. `resolvedFilters.siteId`, se popolato dal backend, deve appartenere a `candidatePool.sites`.
8. `resolvedFilters.period`, se popolato dal backend, formato ISO valido e `from <= to`.
9. `clarification.kind`, se presente, ∈ enum chiuso e ∈ `intent.clarificationsAllowed`.
10. `disambiguation` LLM, se presente, puo' contenere solo `disambiguation_required = true`.
11. `disambiguation.candidates[*].id`, se popolati dal backend, devono appartenere al `candidatePool` corrispondente.
12. `disambiguation.candidates[*].displayLabel` viene popolato dal backend dal valore di `candidatePool`.
13. `accompaniment.kind` ∈ enum chiuso.
14. `report`, se presente: `template` ∈ enum chiuso; `subjectKind` ∈ enum chiuso; `periodPreset` ∈ enum chiuso o null. Il report puo' essere generato solo se il backend ha popolato `resolvedFilters` coerenti con `subjectKind` e periodo. L'LLM non puo' produrre `subjectId`, targhe, id reali o date finali dentro `report`.

### 11.4 Comportamento su mismatch

Se una qualsiasi regola fallisce, il backend forza:

```text
{
  action: "error",
  view: null,
  filters: null,
  resolvedFilters: null,
  clarification: null,
  disambiguation: null,
  report: null,
  accompaniment: { kind: "error_intent_not_in_catalog", params: null }
}
```

Nessun residuo di `searchText`, `entityKind`, `periodPreset` o `report` puo' sopravvivere quando il Catalog Validator forza l'errore. L'azzeramento e' totale.

Il backend logga l'output originale per debugging, ma **non** lo invia al client.

### 11.5 Relazione con fingerprint validator esistente

Il fingerprint validator (`fingerprint-validator.js`) resta in vita come **guardrail di regressione** sui blocchi residui (se in fase di transizione i blocchi continuano a esistere temporaneamente per le viste interne). Smette di essere difesa primaria. Non viene rimosso in Fase 1 per non creare regressioni; eventualmente smantellato in Fase 5 (cleanup) — **decisione futura**, non oggetto di questa spec.

### 11.6 Vietato fallback narrativo

In caso di fallimento del Catalog Validator, e' vietato restituire al client una risposta col vecchio schema `CHAT_TOOL_USE_FINAL_MESSAGE_JSON_SCHEMA`. L'unica risposta ammessa e' la struttura strutturata di errore (§11.4). Questa regola sopravvive a tutte le fasi di transizione.

---

## 12. Cosa cambia nel codice esistente (perimetro)

**NESSUN codice in questa sezione. Solo elenco path e descrizione del cambio.**

### 12.1 Path da MODIFICARE

| Path | Cambio |
|---|---|
| `backend/internal-ai/server/internal-ai-adapter.js:675-819` | Sostituire `CHAT_TOOL_USE_FINAL_MESSAGE_JSON_SCHEMA` con `CHAT_ZERO_INVENZIONI_MESSAGE_JSON_SCHEMA` (nuovo schema §5). Eliminare campi `text` libero, `blocks`, `entities`, `sources`, `notices`. |
| `backend/internal-ai/server/internal-ai-adapter.js:821-828`, `:3497-3504` | Aggiornare riferimento allo schema strict applicato. |
| `backend/internal-ai/server/internal-ai-adapter.js:831-884` | Riscrivere system prompt: vietato ogni dato in output, vietato narrativa, comportamento "intent router". |
| `backend/internal-ai/server/internal-ai-adapter.js:3545-3563`, `:3590-3606` | Sostituire la rigenerazione fingerprint con la pipeline Catalog Validator (§11). |
| `backend/internal-ai/server/internal-ai-adapter.js:3678-3710` | Adattare invio finalMessage al nuovo shape `ChatZeroInvenzioniMessage`. |
| `src/next/chat-ia/ChatIaToolUsePage.tsx:62-101` | Adattare conversione finalMessage -> ChatIaMessage al nuovo shape. Rimuovere lettura di `message.text`. |
| `src/next/chat-ia/components/ChatIaMessageItem.tsx:200-204` | Rimuovere `<p>{message.text}</p>` o equivalente. Sostituire con dispatcher su `message.action -> view component`. |
| `src/next/chat-ia/components/ChatIaMessageItem.tsx:30-35` | `ChatIaMezzoCard` resta come componente, ma viene invocato dalla vista Vehicle360 (§7), non da `ChatIaMessageItem`. |
| `src/next/chat-ia/core/chatIaTypes.ts` | Aggiungere `ChatZeroInvenzioniMessage`, `ActionEnum`, `ViewEnum`, `FiltersShape`, `ResolvedFiltersShape`, `ClarificationShape`, `DisambiguationShape`, `AccompanimentShape`, `AccompanimentKindEnum`. Mantenere tipi precedenti finche' presenti (transizione). |

### 12.2 Path da CREARE

| Path | Ruolo |
|---|---|
| `src/next/chat-ia/intent-catalog.json` | Catalogo intent versionato (§6). |
| `src/next/chat-ia/views/Driver360.tsx` | Vista certificata Driver360 (§7). |
| `src/next/chat-ia/views/Vehicle360.tsx` | Vista certificata Vehicle360 (Fase 3). |
| `src/next/chat-ia/views/Site360.tsx` | Vista certificata Site360 (Fase 3). |
| `src/next/chat-ia/views/Euromecc360.tsx` | Vista certificata Euromecc360 (Fase 3). |
| `src/next/chat-ia/views/Ricerca360.tsx` | Vista orchestratore Ricerca360 (Fase 4). |
| `src/next/chat-ia/relations/relationResolver.ts` | Relation Resolver deterministico (§8). |
| `src/next/chat-ia/relations/rules/<ruleName>.ts` | Una regola per file, testabile (§8.5). |
| `backend/internal-ai/server/lib/catalog-validator.js` | Catalog Validator backend (difesa primaria, §11.0). |
| `src/next/chat-ia/core/catalogValidator.ts` | Helper frontend/shared per validazione UX, NON difesa primaria. |

Il Catalog Validator backend e' fonte di verita'. Il Catalog Validator frontend e' opzionale, per UX immediata, e non puo' sostituire il backend.

### 12.3 Path da NON MODIFICARE

- `src/next/chat-ia/tools/registry/*.ts` (i 59 tool restano dove sono — D6).
- `src/next/chat-ia/tools/index.ts`, `chatIaToolRegistry.ts` (registry resta).
- `src/next/nextAnagraficheFlottaDomain.ts` e altri reader business (perimetro chiuso).
- `backend/internal-ai/server/lib/fingerprint-validator.js` (resta come guardrail di regressione).

### 12.4 Path da DECLASSARE (non cancellati subito, smantellati in Fase 5)

| Path | Stato target |
|---|---|
| `src/next/chat-ia/agents/flottaAgent.ts` | Declassato. Multi-agente smantellato in Fase 5 (D7). |
| `src/next/chat-ia/agents/operazioniAgent.ts` | Declassato. |
| `src/next/chat-ia/agents/documentiAgent.ts` | Declassato. |
| `src/next/chat-ia/agents/cantieriMagazzinoAgent.ts` | Declassato. |
| `src/next/chat-ia/agents/cisternaRifornimentiAgent.ts` | Declassato. |
| `src/next/chat-ia/agents/orchestrator.ts` | Declassato. Produce/coordina old finalMessage multi-agente; smantellamento Fase 5, bypass da chiudere in Fase 1B. |
| `src/next/chat-ia/agents/analytics.ts` | Declassato. Alimenta narrative/analytics del multi-agente; smantellamento Fase 5. |
| `src/next/chat-ia/agents/visualization.ts` | Declassato. Produce old-shape con `text: analytics.narrative`; smantellamento Fase 5, output diretto da impedire in Fase 1B. |
| `src/next/chat-ia/backend/chatIaBackendBridge.ts:337-349` | Bypass multi-agente frontend da chiudere in Fase 1B: non puo' piu' restituire old finalMessage direttamente al client. |

### 12.5 Convenzione nuove directory

- `src/next/chat-ia/views/` — viste certificate.
- `src/next/chat-ia/relations/` — Relation Resolver e regole.

Stesso livello gerarchico di `src/next/chat-ia/components/`, `core/`, `tools/`.

---

## 13. Report PDF

### 13.1 Principio

I template PDF sono **fissi nel codice** (D12). L'LLM non scrive contenuto del report. L'LLM puo' solo richiedere la generazione di un report scegliendo template e soggetto.

### 13.2 Shape richiesta LLM

L'LLM produce, per `action = report_request`, solo la richiesta strutturata senza id e senza date finali:

```text
ReportRequestShape = {
  template: ReportTemplateEnum,
  subjectKind: "driver" | "vehicle" | "site" | "euromecc",
  periodPreset: "all" | "last_7d" | "last_30d" | "last_90d"
              | "this_month" | "this_year" | "custom" | null
}

ReportTemplateEnum = "driver_monthly" | "vehicle_monthly"
                  | "vehicle_costs" | "site_activity"
                  | "euromecc_status"
```

`template` e' enum chiuso, validato dal Catalog Validator. Il soggetto del report viene preso da `resolvedFilters` backend come per `view_open`; il periodo finale viene calcolato dal backend da `periodPreset`.

`report` e' campo top-level di `ChatZeroInvenzioniMessage` (vedi §5.2). Catalog Validator §11 valida `report.template`, `report.subjectKind` e `report.periodPreset`. `subjectId`, `vehiclePlate`, `driverId`, `siteId` e `period.from/to` NON sono prodotti dall'LLM: vengono popolati dal backend in `resolvedFilters`.

### 13.3 Pipeline

1. LLM produce `report_request` con `template`, `subjectKind`, `periodPreset` (mai `subjectId`, mai date finali).
2. Catalog Validator approva o fallback.
3. Codice della vista (Driver360, Vehicle360, ...) esegue il template PDF deterministico leggendo soggetto e periodo da `resolvedFilters`.
4. La pipeline PDF **non passa piu' dall'LLM** (D12).

### 13.4 Relazione con tool esistenti

I tool del registry attuale relativi a report:

- `toolGenerateReportPdf` — declassato a funzione interna invocata dalle viste, non e' piu' "function calling target" dell'LLM.
- `toolSaveReportToArchive` — invocato dalle viste per archiviare l'output PDF generato.
- `toolListArchivedReports` — invocato dalla vista Ricerca360 sezione archivio.
- `toolRetrieveArchivedReport` — invocato all'apertura di un report archiviato.
- `toolDeleteArchivedReport` — invocato da UI archivio (con conferma utente).

### 13.5 Vincolo

L'LLM **non puo'** popolare il body del report. Il body e' costruito dal codice della vista a partire dai dati dei reader, esattamente come per il rendering a video.

---

## 14. `relationProof` (fase 2)

### 14.1 Dichiarazione

Il campo `relationProof` e' **obbligatorio per relazioni critiche, opzionale per relazioni informative**. Serve per UX di trasparenza ("perche' Sandro e' associato a TI324633?"), debugging e scarto deterministico dei match senza prova.

### 14.2 Shape proposta

```text
relationProof = {
  collection: string,         // es. "@mezzi_aziendali"
  recordId: string,
  field: string,              // es. "autistaId"
  kind: RelationKindEnum,
  certainty: "exact" | "explicit_assignment"
}

RelationKindEnum = "driver_vehicle" | "driver_refueling"
                | "driver_activity" | "vehicle_documents"
                | "vehicle_maintenances" | "vehicle_site"
```

L'enum copre le relazioni critiche §14.4 piu' `driver_activity` come relazione informativa con `relationProof` opzionale per coerenza di shape. Estensioni future passano per code review.

### 14.3 Quando viene introdotta

Roadmap: **Fase 2** (Driver360, caso Sandro). Inizialmente come campo arricchito dal Relation Resolver (§8.4) e mostrato in una sezione "perche' questa relazione" della vista. Non viene serializzato nello schema strict OpenAI: e' un dato del lato vista, non LLM.

### 14.4 Relazioni critiche con relationProof obbligatorio

Relazioni critiche:

- autista-mezzo;
- mezzo-documento;
- mezzo-manutenzione;
- autista-rifornimento;
- mezzo-cantiere.

Per queste, il Relation Resolver DEVE produrre `relationProof`. Se `relationProof` non puo' essere costruito, il match e' scartato (`unresolvedReason = no_proof`).

**Vincolo permanente:** `relationProof` e' obbligatorio per le 5 relazioni critiche (autista-mezzo, mezzo-documento, mezzo-manutenzione, autista-rifornimento, mezzo-cantiere). Questo vincolo NON puo' essere reso opzionale in fasi successive senza riscrittura della spec. Se in fase implementativa una di queste relazioni non puo' produrre `relationProof`, il match e' scartato (`unresolvedReason = no_proof`), mai degradato a match senza prova.

### 14.5 Relazioni informative

Relazioni informative:

- mezzo-tipo;
- mezzo-marca;
- autista-badge.

Sono relazioni anagrafiche dirette, non incroci. `relationProof` e' opzionale.

---

## 15. Sequenza implementazione

Ordine vincolante (D9). Per ogni fase: deliverable, criterio di chiusura, perimetro file ad alto livello.

### Fase 0 — Spec + audit conferma + decisione `DIARIO_DECISIONI.md`

- **Deliverable:** questo documento, conferma audit, decisione registrata in `DIARIO_DECISIONI.md` (testo pronto §19).
- **Criterio di chiusura:** spec approvata da Giuseppe; voce `DIARIO_DECISIONI.md` pubblicata.
- **Perimetro file:** solo `docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md` e (in patch separata) `docs/DIARIO_DECISIONI.md`.

### Fase 1A — Backend Zero-Invenzioni

- **Deliverable:** schema strict, prompt Action Router, pipeline pre-LLM backend dedicata, Catalog Validator backend, intent catalog MVP, fallback solo strutturato.
- **Criterio chiusura:** backend non produce piu' old-shape e non usa fallback narrativo.
- **Perimetro:** `internal-ai-adapter.js`, `backend/internal-ai/server/lib/catalog-validator.js`, modulo pre-LLM dedicato sotto `backend/internal-ai/server/lib/`, `intent-catalog.json`.

**Vincolo Fase 1A:** e' vietato qualsiasi fallback al vecchio schema narrativo `CHAT_TOOL_USE_FINAL_MESSAGE_JSON_SCHEMA`. Se il nuovo schema fallisce in qualunque modo, l'unica risposta ammessa e' la struttura strutturata di errore §11.4. Mai tornare a `text` libero. La regola e' enforced sia nel codice backend sia nei test §16.

### Fase 1B — Frontend + bypass multi-agente

- **Deliverable:** tipi frontend, bridge aggiornato, `message.text` non renderizzato, bypass multi-agente old-shape chiuso.
- **Criterio chiusura:** nessun percorso frontend puo' produrre o mostrare `finalMessage.text`.
- **Perimetro:** `chatIaBackendBridge.ts`, `chatIaTypes.ts`, `ChatIaToolUsePage.tsx`, `ChatIaMessageItem.tsx`, `ChatIaMessageList.tsx`, eventuale helper frontend `catalogValidator.ts`.

Durante Fase 1B, il percorso `runChatIaMultiAgentIfHandled` non puo' piu' restituire old `finalMessage` direttamente al frontend.

Strategia scelta:

- Disabilitare/intercettare temporaneamente il ritorno old-shape del multi-agente.
- Forzare il passaggio dalla pipeline Zero-Invenzioni backend.
- Se il multi-agente produce un output non convertibile al nuovo schema, il client riceve solo errore strutturato §11.4.
- NON convertire creativamente narrative/analytics in testo utente.
- NON lasciare alla patch implementativa la scelta tra piu' strategie.

### Fase 1C — Test

- **Deliverable:** test schema, Catalog Validator, fallback strutturato, no `message.text`, bypass chiuso.
- **Criterio chiusura:** test buco attuale invertito da "buco aperto" a "buco chiuso".
- **Perimetro:** `tests/e2e/12-fingerprintIntegrity.spec.ts`, `tests/e2e/11-antiAllucinazione.spec.ts`, `tests/e2e/helpers/chatHelpers.ts`, eventuale test backend/unit.

In Fase 1 NON nascono Driver360, Ricerca360 o Relation Resolver. I 59 tool NON vengono modificati in Fase 1; restano nel registry attuale e diventano reader interni in fasi successive.

### Fase 2 — Vista Driver360 + Relation Resolver autista-mezzo (caso Sandro)

- **Deliverable:** `views/Driver360.tsx`, `relations/relationResolver.ts`, regole forti §8.2, integrazione con i tool autisti citati in §7.4.
- **Criterio di chiusura:** caso Sandro chiuso (50 esecuzioni: TI313387 mai associata se non per regola esplicita, vedi §16). `relationProof` obbligatorio per relazioni critiche popolato.
- **Perimetro file:** `src/next/chat-ia/views/Driver360.tsx`, `src/next/chat-ia/relations/`, intent-catalog.json (intent driver360.*), `ChatIaToolUsePage.tsx`, `ChatIaMessageItem.tsx`.

### Fase 3 — Viste Vehicle360, Site360, Euromecc360

- **Deliverable:** 3 viste certificate, Relation Resolver esteso a relazioni vehicle/site/euromecc.
- **Criterio di chiusura:** test E2E coperti per ciascuna vista, intent in catalogo, regole testate.
- **Perimetro file:** `views/Vehicle360.tsx`, `views/Site360.tsx`, `views/Euromecc360.tsx`, `relations/rules/*`, intent-catalog.json esteso.

### Fase 4 — Vista Ricerca360 + viste residue

- **Deliverable:** orchestratore Ricerca360 che richiama le altre viste in base a query libera; eventuali viste residue se emergono.
- **Criterio di chiusura:** test E2E ricerca generica.
- **Perimetro file:** `views/Ricerca360.tsx`, intent-catalog.json esteso.

### Fase 5 — Smantellamento multi-agente + cleanup

- **Deliverable:** rimozione di `agents/flottaAgent.ts`, `operazioniAgent.ts`, `documentiAgent.ts`, `cantieriMagazzinoAgent.ts`, `cisternaRifornimentiAgent.ts`, eventuali orchestrator/analytics/visualization agent (D7). Pulizia codice morto.
- **Criterio di chiusura:** build verde, test E2E verdi, nessun chiamante residuo.
- **Perimetro file:** `src/next/chat-ia/agents/`, eventuali file di orchestrazione, riferimenti in `chatIaBackendBridge.ts`, ChatIaToolUsePage.

### Fase 6 — PDF da template per ogni vista

- **Deliverable:** template PDF per `driver_monthly`, `vehicle_monthly`, `vehicle_costs`, `site_activity`, `euromecc_status`.
- **Criterio di chiusura:** ogni vista produce PDF deterministico con dati dai reader; test E2E PDF.
- **Perimetro file:** `src/next/chat-ia/views/<vista>/templates/`, integrazione con `toolGenerateReportPdf` declassato.

---

## 16. Test di chiusura modalita Zero-Invenzioni

### 16.1 Test statici

- **Schema strict:** test che lo schema `CHAT_ZERO_INVENZIONI_MESSAGE_JSON_SCHEMA` non contiene proprieta' di tipo `string` libera con descrizione che ammetta dati. Solo enum chiusi e oggetti vincolati.
- **System prompt:** test che il system prompt non contiene istruzioni a "rispondere con i dati" o "scrivere un riassunto"; contiene istruzioni a classificare intent e produrre JSON conforme allo schema.

### 16.2 Test E2E

- **Caso Sandro:** 50 esecuzioni della query "cosa ha fatto Sandro ad aprile". TI313387 mai associata a Sandro (a meno che le regole 1-4 §8.2 lo dimostrino). Tracking risultati per stabilita'.
- **Targhe simili:** query "rifornimenti TI113387" non deve mai produrre dati di TI313387 e viceversa. Exact match (D11).
- **Nomi parziali:** query "Sandro" con piu' candidati produce `action = disambiguation_request`, non sceglie l'LLM.
- **Catalog completo intent:** per ogni intent in catalogo, una query d'esempio produce l'output corretto.
- **Renderer non legge `message.text`:** test statico (grep / AST) su `ChatIaMessageItem.tsx` che verifica assenza di `message.text` o equivalente.
- **Test su 20-30 query reali:** lista da definire in Fase 2 con Giuseppe (riferimento: query tipiche su Sandro, mezzi noti, periodi recenti).
- **Test schema LLM:** l'output OpenAI grezzo (prima del backend post-processing) NON contiene mai id, targhe, date finali, displayLabel. Solo `searchText`, `entityKind`, `periodPreset`.
- **Test backend resolver:** `searchText='Sandro'` con N candidati >1 produce sempre `disambiguation_request`, mai auto-selezione.
- **Test backend resolver exact match:** `vehiclePlate='TI113387'` non matcha mai `TI313387` e viceversa (exact match D11).
- **Test fallback:** se Catalog Validator fallisce, il client riceve solo la struttura di errore §11.4. Mai vecchio schema narrativo.
- **Test relationProof obbligatorio:** una relazione critica (autista-mezzo, mezzo-documento, mezzo-manutenzione, autista-rifornimento, mezzo-cantiere) senza `relationProof` deve essere scartata dal Resolver.
- **Test rendering:** `searchText` e' rimostrato in UI esclusivamente come "eco input utente" (es. "Hai cercato: ..."), mai come dato certificato.
- **Test Fase 1 minimale:** caso Sandro produce `searchText='Sandro Calabrese'`, `entityKind='driver'`, `periodPreset` (se rilevato), e nessun id, targa o data nell'output LLM grezzo.
- **Test schema campi narrativi residui:** il nuovo schema non contiene `summary`, `description` o `text` nei blocchi, oltre a non contenere `text` top-level.
- **Test bypass multi-agente:** nessun old-shape puo' arrivare al client da `runChatIaMultiAgentIfHandled`.
- **Test orchestrator/visualization:** `orchestrator.ts` e `visualization.ts` non possono mandare old `finalMessage` al client in Fase 1B.
- **Test pipeline backend:** se la pipeline o il Catalog Validator falliscono, il client riceve solo la struttura §11.4.

---

## 17. Rischi residui dichiarati

| Rischio | Descrizione | Mitigazione prevista |
|---|---|---|
| Bug Relation Resolver | Una regola scritta male puo' produrre relazioni sbagliate (anche se non inventate dall'LLM, sono comunque sbagliate). | Test unitario per ogni regola §8.5. Code review regole. Telemetria su `relationProof` con `certainty` esposta in UI. |
| Dati Firestore gia' sporchi | `autistaId` mancante o errato a monte porta a relazioni mancanti o degeneri. | Resolver risponde `unresolvedReason = no_match` invece di degenerare a un match arbitrario. UI mostra accompaniment `no_results`. |
| Disambiguazione mal calibrata | Soglie troppo strette = troppe disambiguazioni; troppo larghe = scelte arbitrarie. | Soglia chiara (>1 candidato => disambiguazione). Logging delle disambiguazioni per tuning Fase 3-4. |
| Intent fuori catalogo | L'utente fa una richiesta non prevista, fallback `error_intent_not_in_catalog` puo' frustrare. | Catalogo evolutivo (§6.5). Logging intent fuori catalogo per priorita' aggiunte. |
| Ricerca360 troppo generica | Orchestratore puo' non riuscire a scegliere vista. | Mitigazione: fallback strutturato `error_intent_not_in_catalog` o `clarify_too_many_results` fino a Fase 4. |
| `searchText` come vettore di iniezione | L'utente potrebbe scrivere dati nella query (es. "profilo Sandro guida TI313387") e vedere quella stringa rimostrata come dato. | Il renderer mostra `searchText` SOLO con prefisso visivo "Hai cercato:" o equivalente, MAI come dato certificato. La regola e' enforced lato React (mai inline con dati). Test obbligatorio in §16.2. |
| Bypass multi-agente non chiuso | `runChatIaMultiAgentIfHandled` puo' restituire old-shape prima del backend. | Fase 1B obbligatoria: chiusura bypass, passaggio forzato dalla pipeline Zero-Invenzioni backend o errore strutturato §11.4. |
| Compatibilita' strict schema con null union | Il nuovo schema usa union `null`; lo schema attuale usa `anyOf`, ma la shape nuova va verificata empiricamente. | Verifica in Fase 1A con test schema/Responses API. |
| Pipeline pre-LLM backend da creare | Oggi esistono solo riconoscimenti frontend/agent, non una pipeline backend ufficiale. | Fase 1A introduce modulo dedicato in `backend/internal-ai/server/lib/`. |
| Helper test basati su `.chat-ia-message-text` | Gli helper E2E leggono ancora testo libero renderizzato. | Fase 1C aggiorna helper e test al nuovo rendering strutturato. |

---

## 18. Conflitti e allineamento con spec esistenti

### 18.1 Relazione con `MAPPA_IA_CHAT_NEXT.md`

- §4 dice "Risposte strutturate dove serve, in linguaggio naturale dove serve". La presente spec **rafforza, non revisiona**. La nuova posizione e': il "linguaggio naturale" residuo e' limitato alle frasi di whitelist (§10), e non veicola dati. Questo non contraddice il telaio: il telaio non ha mai autorizzato l'LLM a scrivere dati liberi sui dati business; ha autorizzato "linguaggio naturale" come elemento di UX.
- §5 ("Quando la chat non capisce") prescrive di restare nel contesto della richiesta. Questa spec implementa la prescrizione tramite `accompaniment.kind = error_intent_not_in_catalog` e fallback (§10, §11.4).
- §1.18 (cartelle previste) — la presente spec aggiunge `src/next/chat-ia/views/` e `src/next/chat-ia/relations/`. Coerente con `src/next/chat-ia/components/`, `core/`, `tools/`, `backend/`, `reports/`, `sectors/`.

### 18.2 Relazione con `SPEC_OSSATURA_CHAT_IA_NEXT.md`

- L'ossatura definisce la struttura cartelle, i tipi comuni, il bridge backend, l'archivio report. Questa spec **non revisiona** quei punti.
- L'ossatura cita `sectors/` con sotto-cartelle settoriali (`mezzi`, `autisti`, ecc.). Le viste introdotte da questa spec **non sono in conflitto** con `sectors/`: le viste sono orientate a "subject-360" (Driver, Vehicle, Site, ...), non a settori funzionali. Possono coesistere; settori restano per eventuale logica condivisa cross-vista. Da chiarire nella roadmap se `sectors/` viene assorbita o resta come libreria.

### 18.3 Relazione con `SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md`

- La spec architettura tool use definisce endpoint, request shape, tool definition shape, bridge backend. Tutto questo **resta** (D6: i tool restano, cambia chi li chiama).
- **Conflitto di paradigma sul ruolo dell'LLM:** la spec architettura tool use prevede che l'LLM riceva risultati tool e componga la risposta. La presente spec dice che l'LLM **non compone risposte sui dati**. Cambio paradigma da "tool use con risposta narrativa" a "intent routing senza risposta narrativa". Questo conflitto e' deliberato (D1, D2, D3). L'evoluzione e':
  - Pre Fase 1: l'LLM decide tool, riceve risultati, compone testo.
  - Da Fase 1: l'LLM decide intent + view + filtri. I tool sono chiamati dal codice della vista. L'LLM non riceve i risultati dei tool.
- Da Fase 1, la richiesta `chat.tool-use` come definita in `SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md` resta valida come endpoint tecnico ma cambia semantica: il client manda solo frase utente e contesto UI minimo. Il backend carica intent catalog e costruisce `candidatePool` da reader/Firestore. Il `candidatePool` non e' mai fornito dal client.

---

## 19. Decisione da registrare in `DIARIO_DECISIONI.md`

Testo pronto per copia (la modifica del diario e' patch separata, fuori scope di questo task):

```text
### 2026-05-04 — Chat IA NEXT: modalita Zero-Invenzioni IA
Decisione: la Chat IA NEXT entra in modalita Zero-Invenzioni IA. L'LLM perde il permesso tecnico di scrivere dati business nell'output verso l'utente (targhe, nomi, date, importi, codici, relazioni, riassunti narrativi sui dati). L'LLM puo solo: capire la richiesta, classificare intent, scegliere vista, produrre `searchText`/`entityKind`/`periodPreset`, chiedere disambiguazione tramite flag, accompagnare con frasi parametriche da whitelist. L'LLM non produce `driverId`, `vehiclePlate`, `siteId`, date finali o `displayLabel`; questi vengono risolti e popolati dal backend in `resolvedFilters` o nei candidati certificati. Lo schema strict OpenAI viene riscritto eliminando il campo text libero; sostituito da accompaniment con kind enum e params. Il catalogo intent diventa file versionato (src/next/chat-ia/intent-catalog.json). I 59 tool del registry restano (vengono declassati a reader interni delle viste). Multi-agente specialisti smantellati. Fingerprint validator declassato a guardrail di regressione. Sequenza: Driver360 -> Vehicle360 -> Site360 -> Euromecc360 -> Ricerca360 -> smantellamento multi-agente -> PDF da template. Riferimento: docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md.
Motivo: il buco architetturale documentato dall'audit del 2026-04 e dal test tests/e2e/12-fingerprintIntegrity.spec.ts:97-130 mostra che lo schema strict attuale ammette text libero su dati e che il fingerprint validator non ispeziona text. La difesa attuale e' incentivante (system prompt) ma non strutturale. Il rischio di invenzione (es. caso Sandro -> TI313387 inventata) resta latente. La modalita Zero-Invenzioni sposta la difesa dal prompt allo schema strict + Catalog Validator + rendering certificato. La garanzia diventa imposta dall'architettura, non dal comportamento dell'LLM.
Conseguenza: schema strict riscritto (internal-ai-adapter.js:675-819), system prompt riscritto (831-884), validator fingerprint declassato (lib/fingerprint-validator.js), rendering testo libero rimosso (ChatIaMessageItem.tsx:200-204), nuove cartelle src/next/chat-ia/views/ e src/next/chat-ia/relations/, catalogo intent versionato, viste certificate Driver360/Vehicle360/Site360/Euromecc360/Ricerca360 da implementare in fasi successive. PDF da template, mai dal LLM. `relationProof` obbligatorio per relazioni critiche e opzionale per relazioni informative. Multi-agente smantellati in fase 5.
```

Data prevista per la registrazione: contestuale all'approvazione di questa spec.
Riferimento: questa spec (`docs/product/SPEC_CHAT_ZERO_INVENZIONI_NEXT.md`).

---

## 20. Glossario

- **Zero-Invenzioni IA** — modalita operativa della Chat IA NEXT in cui l'LLM perde il permesso tecnico di scrivere dati business nell'output. La garanzia e' imposta da schema strict + Catalog Validator + rendering certificato.
- **Action Router** — ruolo dell'LLM nella nuova modalita: classificare intent e produrre azione, vista, filtri. Non scrive dati.
- **Catalog Validator** — modulo che confronta l'output LLM contro il catalogo intent versionato. Output fuori catalogo => fallback.
- **Certified View** — componente React in `src/next/chat-ia/views/` che riceve filtri validati, chiama reader interni, renderizza solo dati provenienti da reader. Non legge testo dall'LLM.
- **Reader interno** — i 59 tool del registry attuale, declassati da "function calling target" a "reader interno" delle viste. Stesso codice, stessa interfaccia, chiamante diverso.
- **Relation Resolver** — modulo TypeScript deterministico che applica regole forti per le relazioni dato-dato (autista-mezzo, autista-rifornimento, ...). Mai LLM, mai fuzzy.
- **`relationProof`** — campo che documenta la fonte di una relazione (collection, recordId, field, kind, certainty). Obbligatorio per relazioni critiche, opzionale per relazioni informative.
- **Disambiguazione** — quando piu' di 1 candidato matcha la query, l'LLM non sceglie. Produce solo flag di richiesta; il backend popola candidati con id reali e label certificati. L'utente clicca.
- **Whitelist accompagnamento** — lista chiusa di kind enum (`view_opened`, `no_results`, ...) che mappa a frasi italiane renderizzate frontend.
- **Guardrail di regressione** — il fingerprint validator esistente, declassato. Non e' piu' difesa primaria; resta come check secondario sui blocchi residui (se presenti in transizione).
- **`searchText`** — frase utente normalizzata prodotta dall'LLM come input di risoluzione. Non e' dato certificato e puo' essere mostrata solo come eco input utente.
- **`entityKind`** — enum chiuso prodotto dall'LLM per indicare il tipo di soggetto cercato (`driver`, `vehicle`, `site`, `supplier`, `euromecc`).
- **`periodPreset`** — enum chiuso prodotto dall'LLM per indicare un periodo relativo o noto. Le date finali sono risolte dal backend.
- **`resolvedFilters`** — filtri popolati dal backend dopo risoluzione deterministica (`driverId`, `vehiclePlate`, `siteId`, `period`). Non fanno parte dello schema OpenAI strict.
- **`ReportRequestShape`** — shape top-level dello schema per `action = report_request`. Contiene solo `template`, `subjectKind`, `periodPreset`; soggetto reale e periodo finale sono risolti dal backend in `resolvedFilters`.
- **Pipeline pre-LLM** — fase backend che legge la frase utente, estrae hint lessicali deterministici e costruisce un context senza dati Firestore o id.
- **Layer di normalizzazione** — passaggio tra tool result e Relation Resolver/renderer che converte shape, rimuove campi non ammessi, applica filtri business e scarta record minimi invalidi.

---

## FATTI NON VERIFICATI

I seguenti punti hanno richiesto un'assunzione perche' l'audit non li copriva direttamente. Sono dichiarati esplicitamente per non inventare:

1. **Path proposto `src/next/chat-ia/intent-catalog.json`** — assunzione di nome file e formato JSON. Decisione vincolante D4 dice "file versionato (`src/next/chat-ia/intent-catalog.json` o equivalente da decidere nella spec)". La spec sceglie il path proposto; in fase 1 puo' essere rinegoziato (es. TS file invece di JSON).
2. **Path proposto `src/next/chat-ia/views/` e `src/next/chat-ia/relations/`** — assunzione di nome cartelle. Coerente con esistenti `components/`, `core/`, `tools/`, ma non confermato da audit perche' non esistono ancora.
3. **Esistenza precisa del campo `confermatoAutista` su `@storico_eventi_operativi`** (regola §8.2 punto 3) — il sample audit ha mostrato campi `tipo`/`timestamp`/`autistaNome`/`badgeAutista`/`autista`/`nomeAutista`/`prima`/`dopo`/`luogo`/`statoCarico`. La presenza del campo `confermatoAutista` e' assunta in analogia a `@rifornimenti_autisti_tmp:confermatoAutista` (presente al 100%). Da verificare in Fase 2 prima di codificare la regola.
4. **Stato implementativo preciso di orchestrator / analytics / visualization** — l'audit Fase 1 ha identificato `src/next/chat-ia/agents/orchestrator.ts`, `src/next/chat-ia/agents/analytics.ts` e `src/next/chat-ia/agents/visualization.ts` come percorsi reali. Resta da verificare in Fase 1B se per chiudere il bypass basti intercettare `chatIaBackendBridge.ts:337-349` o se serva patchare anche i produttori old-shape.
5. **Nome esatto del componente che oggi rende `message.text`** — l'audit cita `ChatIaMessageItem.tsx:200-204`. La rimozione esatta del lettore di `message.text` puo' coinvolgere altri componenti vicini (es. `ChatIaMessageList.tsx`). Da verificare in Fase 1 prima della patch.
6. **Compatibilita' del nuovo schema strict con OpenAI Responses API json_schema strict** — la spec assume che enum chiusi, `additionalProperties: false`, oggetti annidati e null union (`view: ViewEnum | null`) siano supportati da Responses API json_schema strict. Audit non copre questo punto specifico per il nuovo shape; e' assunto in analogia allo schema attuale che gia' usa enum + `additionalProperties: false`. Verifica empirica in Fase 1.
7. **Effetti di `sectors/` introdotta da `SPEC_OSSATURA_CHAT_IA_NEXT.md`** — la presente spec dichiara che le `views/` e `sectors/` possono coesistere ma non chiude se `sectors/` viene assorbita. Decisione rimandata a Fase 5 insieme allo smantellamento multi-agente.
8. **Numero esatto di tool al momento di Fase 5** — la spec usa "59 tool" come numero attuale (audit aprile 2026). In Fase 5 il numero potrebbe essere cambiato; resta valido il principio (i tool diventano reader interni), non il numero specifico.
9. **Soglia N=20 candidati nel resolver post-LLM** — valore proposto per `clarify_too_many_results`, da validare in Fase 1 con dati reali e UX.
10. **Path proposto normalizzatori `src/next/chat-ia/views/<vista>/normalizers/<entityKind>Normalizer.ts`** — naming proposto per il layer di normalizzazione tool result. Posizione finale da decidere in Fase 2.
11. **Compatibilita' effettiva del nuovo schema strict con `null` union** — resta da verificare in Fase 1A contro la Responses API reale. L'audit ha trovato pattern `anyOf` e `additionalProperties: false` nello schema attuale, ma non ha eseguito test.
12. **Path definitivo della pipeline pre-LLM backend** — la decisione e' modulo dedicato sotto `backend/internal-ai/server/lib/`; il nome file/funzione resta da decidere in Fase 1A.
13. **Strategia tecnica esatta per chiudere `runChatIaMultiAgentIfHandled`** — da implementare in Fase 1B secondo la scelta vincolante "nessun old-shape al client". Non e' ammesso lasciare il bypass attivo.
14. **Patch effettiva di `analytics.ts` e `visualization.ts`** — lo stato reale come produttori old-shape e' stato individuato, ma in Fase 1B va confermato se patcharli o solo bypassarli dal bridge.

Nessun altro punto e' stato inventato. Dove mancavano dati, la spec ha citato la decisione vincolante o ha lasciato il punto come "da decidere" rimandando a una fase successiva.
