# SPEC OSSATURA CHAT IA NEXT

Versione: 2026-04-27
Stato: specifica di base per implementazione successiva.

## 0. INTRODUZIONE

Questa spec definisce l'ossatura comune del rifacimento della chat IA NEXT.

L'ossatura e' la base infrastrutturale sopra cui verranno costruite le verticali settoriali:

- UI chat unica.
- Router prompt unico.
- Contratto comune dei runner settoriali.
- Bridge controllato verso il backend OpenAI esistente.
- Archivio report Firestore + Storage.
- Tipi comuni.
- Motore report/PDF comune.

Cosa non copre questa spec:

- Non definisce la logica completa dei settori Mezzi, Autisti, Manutenzioni, Materiali, Costi, Documenti, Cisterna.
- Non riscrive i reader D01-D10.
- Non modifica il backend IA.
- Non integra il sottosistema Archivista.
- Non spegne la vecchia route `/next/ia/report`.

Riferimenti:

- Telaio vincolante: `docs/product/MAPPA_IA_CHAT_NEXT.md`.
- Audit tecnico: `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`.
- Scenario scelto dall'audit: scenario B, cioe' UI nuova, router nuovo, runner settoriali nuovi, riuso reader clone-safe, backend OpenAI controllato, report/PDF e card mezzo Step Zero.

Decisioni gia' vincolanti:

- Una sola chat.
- Solo campo libero.
- Nessun elenco generico quando la chat non capisce.
- Nessuno storico conversazioni persistente.
- Archivio report su Firestore + Storage, non localStorage.
- Backend IA esistente riusato senza aprire live-read business lato server.

## 1. STRUTTURA CARTELLE

Cartella nuova scelta: `src/next/chat-ia/`.

Motivo:

- Non si lavora dentro `src/next/internal-ai/`, perche' quello contiene il sistema attuale da mantenere vivo durante il rifacimento.
- Non si lavora dentro `src/pages/**`, perche' la madre resta intatta.
- Il nome `chat-ia` rende evidente che e' la nuova chat, non Archivista, non hub IA legacy, non motore unificato esistente.

Albero previsto:

```text
src/next/chat-ia/
  ChatIaPage.tsx
  chatIa.css
  components/
    ChatIaShell.tsx
    ChatIaMessageList.tsx
    ChatIaMessageItem.tsx
    ChatIaComposerInput.tsx
    ChatIaReportModal.tsx
    ChatIaArchivePanel.tsx
    ChatIaLoadingIndicator.tsx
  core/
    chatIaTypes.ts
    chatIaRouter.ts
    chatIaSectorRegistry.ts
    chatIaSessionStore.ts
    chatIaText.ts
  backend/
    chatIaBackendBridge.ts
  reports/
    chatIaReportArchive.ts
    chatIaReportPdf.ts
  sectors/
    sectorTypes.ts
    sectorFallbacks.ts
    mezzi/
      README.md
    autisti/
      README.md
    manutenzioni-scadenze/
      README.md
    materiali/
      README.md
    costi-fatture/
      README.md
    documenti/
      README.md
    cisterna/
      README.md
```

File da creare nell'ossatura:

| File | Ruolo | Dimensione attesa |
|---|---|---|
| `ChatIaPage.tsx` | Route wrapper, importa shell e CSS | 40-80 righe |
| `chatIa.css` | Stile solo nuova chat, prefisso `.chat-ia-` | 300-500 righe |
| `components/ChatIaShell.tsx` | Stato pagina, submit prompt, modali | 180-280 righe |
| `components/ChatIaMessageList.tsx` | Lista messaggi | 60-120 righe |
| `components/ChatIaMessageItem.tsx` | Rendering testo/card/table/report link | 120-200 righe |
| `components/ChatIaComposerInput.tsx` | Campo libero + submit | 80-140 righe |
| `components/ChatIaReportModal.tsx` | Modale report + PDF | 180-260 righe |
| `components/ChatIaArchivePanel.tsx` | Output archivio quando richiesto via chat | 160-260 righe |
| `components/ChatIaLoadingIndicator.tsx` | Testo "sto leggendo i dati..." | 20-60 righe |
| `core/chatIaTypes.ts` | Tipi comuni | 220-320 righe |
| `core/chatIaRouter.ts` | Classificazione settore e fallback | 200-320 righe |
| `core/chatIaSectorRegistry.ts` | Registro runner settoriali | 100-180 righe |
| `core/chatIaSessionStore.ts` | Memoria solo React/sessione corrente | 60-120 righe |
| `core/chatIaText.ts` | Helper testo italiano, no prompt generici | 60-120 righe |
| `backend/chatIaBackendBridge.ts` | Adapter verso backend esistente | 120-200 righe |
| `reports/chatIaReportArchive.ts` | Firestore + Storage archive repository | 220-340 righe |
| `reports/chatIaReportPdf.ts` | Adapter PDF sopra motore esistente | 80-140 righe |
| `sectors/sectorTypes.ts` | Contratto runner settoriale | 80-140 righe |
| `sectors/sectorFallbacks.ts` | Fallback contestuali minimi | 100-180 righe |
| `sectors/*/README.md` | Segnaposto documentale del settore | 10-30 righe cad. |

Convenzioni:

- Tutte le classi CSS nuove iniziano con `.chat-ia-`.
- Tutti i tipi pubblici iniziano con `ChatIa`.
- I runner settoriali esportano una sola costante: `chatIa<SectorName>Runner`.
- Nessun file dell'ossatura supera 350 righe, salvo `chatIa.css` che puo' arrivare a 500 righe.
- Nessun settore importa direttamente componenti UI della shell; i settori restituiscono solo `ChatIaRunnerResult`.

## 2. ARCHITETTURA AD ALTO LIVELLO

Flusso testuale:

```text
Utente
  -> /next/chat
  -> ChatIaShell
  -> ChatIaRouter
  -> Runner del settore
  -> Reader clone-safe D01-D10
  -> Risultato strutturato locale
  -> ChatIaBackendBridge verso backend OpenAI esistente
  -> Risposta finale
  -> UI chat unica
  -> eventuale ChatIaReportArchive
  -> eventuale ChatIaReportPdf
```

Ruoli:

- `ChatIaShell`: tiene lo stato della sessione corrente, non persiste conversazioni.
- `ChatIaRouter`: decide settore, entita' e output richiesto.
- `Runner settore`: legge dati tramite reader clone-safe e produce un risultato strutturato.
- `Reader`: sono quelli gia' esistenti D01-D10; non si modificano.
- `ChatIaBackendBridge`: manda al backend solo dati gia' letti e gia' selezionati dal runner.
- `ChatIaReportArchive`: salva report approvati in Firestore + Storage.
- `ChatIaReportPdf`: genera PDF riusando il motore esistente.

Cosa cambia rispetto all'attuale:

- Oggi ci sono quattro surface chat in `src/next/NextInternalAiPage.tsx` (`src/next/NextInternalAiPage.tsx:9697`, `src/next/NextInternalAiPage.tsx:9974-10005`, `src/next/NextInternalAiPage.tsx:10315-10358`, `src/next/NextInternalAiPage.tsx:10875`). La nuova chat ne avra' una sola.
- Oggi il submit passa da `handleChatSubmit` in `src/next/NextInternalAiPage.tsx:7605-7638`. La nuova chat avra' submit isolato in `ChatIaShell`.
- Oggi il motore unificato puo' intercettare prima dello switch sugli intent (`src/next/internal-ai/internalAiChatOrchestrator.ts:2035-2039`). La nuova chat usera' un router unico e prevedibile.
- Oggi il fallback generico elenca molte capacita' (`src/next/internal-ai/internalAiChatOrchestrator.ts:1648-1677`). La nuova chat usera' solo fallback contestuali di settore.
- Oggi l'archivio artifact e' server-file isolated (`backend/internal-ai/src/internalAiServerPersistenceContracts.ts:148-151`). Il nuovo archivio report vive su Firestore + Storage.

## 3. TIPI COMUNI

File: `src/next/chat-ia/core/chatIaTypes.ts`.

I tipi nuovi non sostituiscono subito i tipi esistenti in `src/next/internal-ai/internalAiTypes.ts`. Li usano come riferimento e, dove serve, come payload.

Riferimenti esistenti:

- `InternalAiReportType` esiste in `src/next/internal-ai/internalAiTypes.ts:112`.
- `InternalAiReportPeriodInput` esiste in `src/next/internal-ai/internalAiTypes.ts:121`.
- `InternalAiReportPreview` esiste in `src/next/internal-ai/internalAiTypes.ts:441`.
- `MezzoDossierStructuredCard` esiste in `src/next/internal-ai/internalAiTypes.ts:784-787`.
- `InternalAiChatMessage` esiste in `src/next/internal-ai/internalAiTypes.ts:789-801`.

Definizione TypeScript richiesta:

```ts
import type {
  InternalAiReportPeriodInput,
  InternalAiReportPreview,
  MezzoDossierStructuredCard,
} from "../../internal-ai/internalAiTypes";

export type ChatIaSectorId =
  | "mezzi"
  | "autisti"
  | "manutenzioni_scadenze"
  | "materiali"
  | "costi_fatture"
  | "documenti"
  | "cisterna";

export type ChatIaMessageRole = "utente" | "assistente" | "sistema";

export type ChatIaExecutionStatus =
  | "idle"
  | "reading"
  | "completed"
  | "partial"
  | "failed";

export type ChatIaOutputKind =
  | "text"
  | "card"
  | "table"
  | "report_modal"
  | "archive_list"
  | "fallback";

export type ChatIaEntityRef =
  | { kind: "targa"; value: string }
  | { kind: "autista"; value: string; badge?: string | null }
  | { kind: "fornitore"; value: string }
  | { kind: "materiale"; value: string }
  | { kind: "cisterna"; value: string }
  | { kind: "unknown"; value: string };

export type ChatIaStructuredCard =
  | MezzoDossierStructuredCard
  | {
      kind: "summary_card";
      title: string;
      rows: Array<{ label: string; value: string; tone?: "neutral" | "ok" | "warning" | "danger" }>;
    };

export type ChatIaTable = {
  id: string;
  title: string;
  columns: Array<{ key: string; label: string; align?: "left" | "right" | "center" }>;
  rows: Array<Record<string, string | number | null>>;
  emptyText: string;
};

export type ChatIaReport = {
  id: string;
  sector: ChatIaSectorId;
  type: "puntuale" | "mensile" | "periodico";
  target:
    | { kind: "targa"; value: string }
    | { kind: "autista"; value: string; badge?: string | null };
  title: string;
  summary: string;
  generatedAt: string;
  period: InternalAiReportPeriodInput | null;
  preview: InternalAiReportPreview | null;
  sections: Array<{
    id: string;
    title: string;
    summary: string;
    bullets: string[];
    status: "complete" | "partial" | "empty";
  }>;
  sources: Array<{ label: string; path?: string; domainCode?: string }>;
  missingData: string[];
};

export type ChatIaArchiveEntry = {
  id: string;
  version: 1;
  status: "active" | "deleted";
  sector: ChatIaSectorId;
  reportType: ChatIaReport["type"];
  targetKind: "targa" | "autista";
  targetValue: string;
  targetBadge: string | null;
  title: string;
  summary: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  periodLabel: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  firestorePath: string;
  pdfStoragePath: string | null;
  pdfUrl: string | null;
  reportPayload: ChatIaReport;
  metadata: {
    sourceCount: number;
    missingDataCount: number;
    appVersion: "next";
    createdBy: "chat-ia";
  };
};

export type ChatIaMessage = {
  id: string;
  role: ChatIaMessageRole;
  createdAt: string;
  text: string;
  status: ChatIaExecutionStatus;
  sector: ChatIaSectorId | null;
  outputKind: ChatIaOutputKind;
  entities: ChatIaEntityRef[];
  card: ChatIaStructuredCard | null;
  table: ChatIaTable | null;
  report: ChatIaReport | null;
  archiveEntries: ChatIaArchiveEntry[];
  error: string | null;
};

export type ChatIaRouterDecision = {
  sector: ChatIaSectorId | null;
  confidence: "alta" | "media" | "bassa" | "nessuna";
  entities: ChatIaEntityRef[];
  period: InternalAiReportPeriodInput | null;
  asksReport: boolean;
  asksArchive: boolean;
  reason: string;
};

export type ChatIaRunnerContext = {
  nowIso: string;
  previousMessages: ChatIaMessage[];
  period: InternalAiReportPeriodInput | null;
  backend: {
    enabled: boolean;
    timeoutMs: number;
  };
};

export type ChatIaFallbackResponse = {
  sector: ChatIaSectorId | null;
  text: string;
  examples: string[];
};

export type ChatIaRunnerResult = {
  status: "completed" | "partial" | "not_handled" | "failed";
  sector: ChatIaSectorId;
  text: string;
  outputKind: ChatIaOutputKind;
  entities: ChatIaEntityRef[];
  card: ChatIaStructuredCard | null;
  table: ChatIaTable | null;
  report: ChatIaReport | null;
  fallback: ChatIaFallbackResponse | null;
  backendContext: Record<string, unknown>;
  error: string | null;
};
```

Regole:

- `ChatIaMessage[]` resta solo in memoria React. Non si salva in Firestore.
- `ChatIaArchiveEntry` e' l'unico oggetto persistente dell'ossatura.
- `reportPayload` contiene il report completo riapribile.
- `pdfUrl` e' comodo ma non autoritativo; `pdfStoragePath` e' il riferimento stabile.

## 4. UI CHAT UNIFICATA

Route nuova:

- Path: `/next/chat`.
- Componente route: `src/next/chat-ia/ChatIaPage.tsx`.
- Aggiunta futura in `src/App.tsx` dentro il blocco `/next`, vicino alle route IA esistenti `ia/report` e `ia/interna` (`src/App.tsx:506-525`).
- Costante futura: `NEXT_CHAT_IA_PATH = "/next/chat"` in `src/next/nextStructuralPaths.ts`, dove oggi vivono `NEXT_IA_PATH` e `NEXT_INTERNAL_AI_PATH` (`src/next/nextStructuralPaths.ts:27-32`).
- La vecchia `/next/ia/report` resta attiva durante lo sviluppo.

Componenti:

- `ChatIaPage`: wrapper route, importa CSS e `ChatIaShell`.
- `ChatIaShell`: contiene stato sessione, messaggi, submit, loading, modale report, output archivio.
- `ChatIaMessageList`: mostra i messaggi in ordine cronologico.
- `ChatIaMessageItem`: renderizza testo, card, tabella, report link, archivio.
- `ChatIaComposerInput`: un solo campo libero, textarea o input multi-riga, submit con Enter o pulsante invio.
- `ChatIaLoadingIndicator`: mostra esattamente il testo `Sto leggendo i dati...`.
- `ChatIaReportModal`: mostra report strutturato e pulsanti `Scarica PDF`, `Chiudi`.
- `ChatIaArchivePanel`: non e' un menu sempre visibile; appare solo come risposta a una richiesta tipo `mostra archivio report TI282780`.

Layout:

- Prima schermata: thread vuoto + campo libero.
- Nessun bottone di scorciatoia.
- Nessun menu a tendina.
- Nessun filtro precaricato.
- Nessuna lista di capability in home.
- Se il thread e' vuoto, il placeholder del campo deve essere breve: `Scrivi una targa, un autista o una domanda`.

Stati locali:

- `messages: ChatIaMessage[]`
- `inputValue: string`
- `status: "idle" | "reading"`
- `activeReport: ChatIaReport | null`
- `archiveEntries: ChatIaArchiveEntry[]`
- `errorMessage: string | null`

Stato persistito:

- Solo `ChatIaArchiveEntry`.
- Nessuna conversazione persistente.
- Nessun localStorage per report.
- Nessun localStorage per messaggi.

Regola di accesso archivio:

- L'utente apre l'archivio scrivendo nel campo libero.
- Esempi validi: `mostra archivio report TI282780`, `riapri report autista Rossi aprile 2026`.
- La UI puo' mostrare il pannello archivio come output, ma non deve esporre bottoni permanenti tipo `Archivio`, `Filtri`, `Report rapidi`.

## 5. ROUTER PROMPT

File: `src/next/chat-ia/core/chatIaRouter.ts`.

Input:

- `prompt: string`
- `previousMessages: ChatIaMessage[]`
- `now: Date`

Output:

- `ChatIaRouterDecision`

Fonti di progettazione:

- Il motore unificato attuale ha 17 scope in `SCOPE_PATTERNS` (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:483-515`).
- Il mapping scope -> source vive in `SCOPE_SOURCE_MAP` (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:517-553`).
- Il motore attuale non esporta questi dati; la nuova ossatura deve creare una tassonomia propria, copiando solo il concetto, non importando il file monolitico.

Settori riconosciuti:

| Settore | Keyword minime | Note |
|---|---|---|
| `mezzi` | targa, mezzo, dossier, stato operativo, revisione, libretto | Include prompt con sola targa |
| `autisti` | autista, autisti, badge, collega, sessione autista | Deve gestire badge/nome |
| `manutenzioni_scadenze` | manutenzioni, scadenze, lavori, gomme, collaudo, attenzione oggi | Cross-mezzo e periodo |
| `materiali` | magazzino, stock, materiali, attrezzature, adblue, inventario | Solo lettura nell'ossatura |
| `costi_fatture` | costi, fatture, spese, preventivi, ordini, fornitori | Report e incroci economici |
| `documenti` | documenti, allegati, pdf, libretti | Nessuna integrazione Archivista |
| `cisterna` | cisterna, caravate, schede test | Verticale specialistica |

Estrazione entita':

- Targa: pattern alfanumerico compatibile con targhe usate nei moduli, poi normalizzazione senza spazi.
- Badge/autista: parole dopo `autista`, `badge`, `collega`.
- Periodo: riusare forma compatibile con `InternalAiReportPeriodInput`, gia' esistente in `src/next/internal-ai/internalAiTypes.ts:121`.

Algoritmo:

```text
1. Normalizza prompt: trim, lower-case, rimuovi doppie spaziature.
2. Se prompt vuoto: non creare messaggio.
3. Estrai targa, badge/autista, fornitore/materiale, periodo.
4. Se trova richiesta archivio:
   - asksArchive = true
   - settore = settore dedotto da target: targa -> mezzi, autista/badge -> autisti
5. Se trova richiesta report:
   - asksReport = true
6. Calcola punteggio per settore:
   - +5 se entita forte del settore e' presente.
   - +3 per keyword primaria del settore.
   - +1 per keyword secondaria.
7. Se una targa e' presente e nessun altro settore ha punteggio maggiore:
   - settore = mezzi
   - confidence = alta
8. Se un settore ha punteggio >= 5:
   - confidence = alta
9. Se un settore ha punteggio 2-4:
   - confidence = media
10. Se nessun settore:
   - sector = null
   - confidence = nessuna
11. Non chiamare mai un runner generico.
12. Se sector = null:
   - ritorna fallback ossatura neutro, senza elenco totale di capability.
13. Se sector != null:
   - chiama il runner del settore.
14. Se runner.status = not_handled:
   - usa runner.fallbackContext(prompt, decision).
```

Fallback contestuale:

- Se il prompt contiene `rifornimenti` ma manca dettaglio, risponde solo su rifornimenti.
- Se contiene `manutenzioni`, risponde solo su manutenzioni/scadenze.
- Se contiene una targa ma non capisce la domanda, risponde solo su cosa puo' leggere del mezzo.
- Se il prompt e' `ciao`, risposta neutra: `Dimmi una targa, un autista o il tema operativo che vuoi controllare.` Nessun elenco completo.

Divieto:

- Non ricreare il branch generico attuale di `buildGenericResponse` (`src/next/internal-ai/internalAiChatOrchestrator.ts:1648-1677`).

## 6. CONTRATTO RUNNER SETTORIALE

File:

- `src/next/chat-ia/sectors/sectorTypes.ts`
- `src/next/chat-ia/core/chatIaSectorRegistry.ts`

Interfaccia comune:

```ts
import type {
  ChatIaFallbackResponse,
  ChatIaRouterDecision,
  ChatIaRunnerContext,
  ChatIaRunnerResult,
  ChatIaSectorId,
} from "../core/chatIaTypes";

export type ChatIaSectorRunner = {
  id: ChatIaSectorId;
  label: string;
  canHandle(decision: ChatIaRouterDecision): boolean;
  run(args: {
    prompt: string;
    decision: ChatIaRouterDecision;
    context: ChatIaRunnerContext;
  }): Promise<ChatIaRunnerResult>;
  fallbackContext(args: {
    prompt: string;
    decision: ChatIaRouterDecision;
  }): ChatIaFallbackResponse;
};
```

Metodi obbligatori:

- `canHandle`: ritorna `true` solo se il settore e' davvero quello del runner.
- `run`: legge dati, produce testo/card/table/report.
- `fallbackContext`: spiega cosa puo' fare solo dentro quel settore.

Output ammessi:

- `text`: risposta naturale breve.
- `card`: scheda strutturata.
- `table`: tabella.
- `report_modal`: report strutturato.
- `archive_list`: elenco report salvati.
- `fallback`: risposta contestuale.

Regola:

- Un runner non puo' leggere dati di un altro settore senza dichiararlo nel risultato `sources`.
- Un runner non puo' scrivere dati business.
- Un runner puo' chiedere al motore report di salvare solo un `ChatIaReport`.

Esempio concreto per settore Mezzi:

```ts
export const chatIaMezziRunner: ChatIaSectorRunner = {
  id: "mezzi",
  label: "Mezzi",
  canHandle(decision) {
    return decision.sector === "mezzi";
  },
  async run({ prompt, decision, context }) {
    // La spec Mezzi definira' letture e output reali.
    // L'ossatura accetta gia' output card tipo "mezzo_dossier".
    return {
      status: "not_handled",
      sector: "mezzi",
      text: "",
      outputKind: "fallback",
      entities: decision.entities,
      card: null,
      table: null,
      report: null,
      fallback: this.fallbackContext({ prompt, decision }),
      backendContext: {},
      error: null,
    };
  },
  fallbackContext({ decision }) {
    return {
      sector: "mezzi",
      text: "Ho riconosciuto un contesto mezzo, ma questa parte del settore Mezzi non e' ancora implementata nella nuova chat.",
      examples: decision.entities.some((entity) => entity.kind === "targa")
        ? ["Posso partire dalla scheda mezzo e dallo stato operativo nella spec Mezzi."]
        : ["Scrivi una targa per aprire il contesto mezzo."],
    };
  },
};
```

Nota:

- L'esempio non e' un TODO. E' il comportamento minimo dell'ossatura finche' la spec Mezzi non implementa il runner reale.

## 7. BRIDGE BACKEND OPENAI

File: `src/next/chat-ia/backend/chatIaBackendBridge.ts`.

Backend esistente da riusare:

- Porta `4310` in `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:36`.
- Route `orchestratorChat` in `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:39-48`.
- Client esistente `runInternalAiServerControlledChat` in `src/next/internal-ai/internalAiServerChatClient.ts:72-124`.
- Adapter Express in `backend/internal-ai/server/internal-ai-adapter.js:54`.
- Payload controllato costruito da `buildControlledChatUserPayload` (`backend/internal-ai/server/internal-ai-adapter.js:626-648`).
- System prompt server: italiano, solo contesto strutturato, niente invenzioni, niente scritture business, niente live-read business (`backend/internal-ai/server/internal-ai-adapter.js:741-750`).

Regola di riuso:

- Non modificare `backend/internal-ai/server/internal-ai-adapter.js`.
- Non aggiungere endpoint backend nella prima ossatura.
- Il bridge nuovo adatta `ChatIaRunnerResult` al formato accettato da `runInternalAiServerControlledChat`.

Payload verso backend:

```ts
type ChatIaBackendRequest = {
  prompt: string;
  localTurn: {
    intent: "richiesta_generica";
    status: "completed" | "partial";
    assistantText: string;
    references: Array<{
      type: "architecture_doc" | "report_preview" | "safe_mode_notice" | "capabilities";
      label: string;
      targa: string | null;
    }>;
    reportContext: null;
  };
  attachments: [];
  memoryHints: {
    sessionOnly: true;
    sector: ChatIaSectorId | null;
    entities: ChatIaEntityRef[];
  };
};
```

Cosa includere:

- Prompt utente.
- Settore scelto.
- Entita' normalizzate.
- Testo deterministico prodotto dal runner.
- Estratti strutturati gia' letti dal runner, in forma ridotta.
- Limiti e fonti.

Cosa escludere:

- File binari.
- Chiavi API.
- Snapshot Firestore completi non necessari.
- Oggetti `File`, `Blob`, immagini o PDF.
- Dati di conversazioni precedenti oltre la sessione corrente.
- Qualunque richiesta di scrittura business.

Gestione errori:

- Se `runInternalAiServerControlledChat` ritorna `null`, usare testo locale del runner.
- Se ritorna `provider_not_configured`, usare testo locale del runner.
- Se ritorna `upstream_error`, usare testo locale del runner e mostrare nota breve: `Risposta locale: il servizio di rifinitura IA non e' disponibile.`
- Timeout ossatura: 8 secondi con `Promise.race`. Se il backend non risponde entro 8 secondi, non bloccare la chat.

Output:

- Il backend puo' rifinire il testo naturale.
- Il backend non puo' cambiare `sector`, `card`, `table`, `report`, `archiveEntry`.
- La verita' dati resta nel runner locale.

## 8. ARCHIVIO REPORT

Decisione vincolante:

- I report vivono nello stesso ambiente dei dati del progetto: Firestore + Storage.
- Non usare localStorage.
- Non usare l'artifact repository server-file isolated come archivio definitivo.

Riferimento attuale da sostituire:

- Artifact repository server-file isolated esiste in `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:50-56`.
- Runtime data root server-file isolated dichiarato in `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:148-151`.
- Endpoint artifact repository esistente e' `backend/internal-ai/server/internal-ai-adapter.js:2236-2318`.

Nuovo storage scelto dalla spec:

- Firestore collection: `chat_ia_reports`.
- Storage prefix PDF: `chat_ia_reports/{sector}/{yyyy}/{entryId}.pdf`.
- Campo Firestore stabile: `pdfStoragePath`.
- Campo URL derivato: `pdfUrl`.

Motivo:

- Collection dedicata evita di mischiare i report chat con `storage/@...`.
- Prefix Storage dedicato evita collisioni con `documenti_pdf/`, `preventivi/`, `mezzi_aziendali/`.
- La catalogazione per targa/autista diventa query diretta su `targetKind` + `targetValue`.

File repository:

- `src/next/chat-ia/reports/chatIaReportArchive.ts`.

Operazioni:

```ts
export async function createChatIaReportArchiveEntry(args: {
  prompt: string;
  report: ChatIaReport;
  pdfBlob: Blob | null;
}): Promise<ChatIaArchiveEntry>;

export async function listChatIaReportArchiveEntries(args: {
  targetKind?: "targa" | "autista";
  targetValue?: string;
  sector?: ChatIaSectorId;
  includeDeleted?: boolean;
}): Promise<ChatIaArchiveEntry[]>;

export async function readChatIaReportArchiveEntry(id: string): Promise<ChatIaArchiveEntry | null>;

export async function markChatIaReportArchiveEntryDeleted(id: string): Promise<void>;
```

Lifecycle:

1. Runner produce `ChatIaReport`.
2. UI apre `ChatIaReportModal`.
3. Utente sceglie `Salva report` dentro il modale.
4. `chatIaReportPdf.ts` genera `Blob` PDF.
5. `chatIaReportArchive.ts` carica PDF su Storage se il blob esiste.
6. `chatIaReportArchive.ts` crea documento Firestore in `chat_ia_reports`.
7. La chat mostra messaggio: `Report salvato nell'archivio chat`.
8. Riapertura: prompt libero tipo `riapri report TI282780 aprile 2026`.
9. Eliminazione v1: soft delete, cioe' `status = "deleted"` e `deletedAt` valorizzato. Il PDF resta in Storage per evitare perdita accidentale.

Shape Firestore:

```ts
type ChatIaReportArchiveFirestoreDoc = Omit<
  ChatIaArchiveEntry,
  "id" | "firestorePath"
> & {
  version: 1;
};
```

Indici logici da prevedere:

- `status + targetKind + targetValue + createdAt`
- `status + sector + createdAt`
- `status + reportType + createdAt`

UI archivio:

- Nessun bottone fisso `Archivio`.
- Output archivio appare dopo prompt libero.
- Filtri ammessi solo come testo dell'utente, non come menu precaricato.
- Esempi: `mostra report salvati per TI282780`, `mostra report autista Rossi`.

Nota sicurezza:

- Le write Firestore/Storage devono passare dai wrapper esistenti `firestoreWriteOps` e `storageWriteOps`.
- I wrapper chiamano `assertCloneWriteAllowed` (`src/utils/firestoreWriteOps.ts:15-39`, `src/utils/storageWriteOps.ts:20-53`).
- La barriera attuale non contiene ancora una deroga `/next/chat` per `chat_ia_reports` o `chat_ia_reports/`.
- Prima della patch implementativa completa serve approvare una deroga stretta su `src/utils/cloneWriteBarrier.ts`, oggi punto di controllo in `src/utils/cloneWriteBarrier.ts:547-549`.

## 9. ESPORTAZIONE PDF

File adapter nuovo:

- `src/next/chat-ia/reports/chatIaReportPdf.ts`.

Motore esistente da riusare:

- `generateInternalAiReportPdfBlob` esiste in `src/next/internal-ai/internalAiReportPdf.ts:219-266`.
- Per il fallback jsPDF diretto, lo stesso file costruisce un PDF e ritorna `blob` + `fileName` (`src/next/internal-ai/internalAiReportPdf.ts:271-394`).
- Nome file esistente: `buildInternalAiReportPdfFileName` (`src/next/internal-ai/internalAiReportPdf.ts:118-119`).
- Preview browser riutilizzabile: `createPdfPreviewUrl` in `src/utils/pdfPreview.ts:47-69`.
- Share PDF browser riutilizzabile: `sharePdfFile` in `src/utils/pdfPreview.ts:73-85`.

Contratto adapter:

```ts
export async function generateChatIaReportPdf(args: {
  report: ChatIaReport;
}): Promise<{
  blob: Blob;
  fileName: string;
}>;
```

Regola:

- Se `report.preview` e' un `InternalAiReportPreview`, chiamare `generateInternalAiReportPdfBlob`.
- Se `report.preview` e' `null`, generare PDF semplice da `ChatIaReport.sections` con `jsPDF` oppure bloccare con messaggio chiaro: `Questo report non contiene ancora una preview esportabile`.
- Il PDF non salva automaticamente. Salvataggio avviene solo tramite `createChatIaReportArchiveEntry`.

## 10. COSA NON FA L'OSSATURA

L'ossatura non fa:

- Non implementa il report completo Mezzi.
- Non implementa la timeline Mezzo 360.
- Non implementa il matching Autista 360.
- Non implementa lo scoring Centro Controllo.
- Non implementa rifornimenti/dedup.
- Non implementa analisi costi/fatture.
- Non implementa lettura profonda documenti.
- Non implementa Cisterna.
- Non modifica reader D01-D10.
- Non modifica il backend IA.
- Non spegne `/next/ia/report`.
- Non crea bottoni rapidi o menu di scorciatoia.
- Non salva conversazioni.
- Non accetta allegati.
- Non integra Archivista.

Ogni punto sopra vive in una spec settoriale successiva.

## 11. FILE ESISTENTI DA RIUSARE

UI/route:

- `src/App.tsx:506-525`: posizione attuale delle route IA NEXT; la nuova route `/next/chat` va aggiunta senza spegnere queste.
- `src/next/nextStructuralPaths.ts:27-32`: pattern delle costanti path NEXT IA.

Backend:

- `src/next/internal-ai/internalAiServerChatClient.ts:13-28`: logica base URL backend.
- `src/next/internal-ai/internalAiServerChatClient.ts:72-124`: chiamata controllata al backend.
- `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:36-48`: porta e route backend.
- `backend/internal-ai/server/internal-ai-adapter.js:626-648`: payload chat controllata.
- `backend/internal-ai/server/internal-ai-adapter.js:741-750`: system prompt server vincolato.

Tipi/report:

- `src/next/internal-ai/internalAiTypes.ts:112`: tipo report esistente.
- `src/next/internal-ai/internalAiTypes.ts:121`: periodo report.
- `src/next/internal-ai/internalAiTypes.ts:183-208`: preview report targa.
- `src/next/internal-ai/internalAiTypes.ts:441`: union `InternalAiReportPreview`.
- `src/next/internal-ai/internalAiTypes.ts:784-787`: card mezzo Step Zero.
- `src/next/internal-ai/internalAiReportPdf.ts:118-119`: filename PDF.
- `src/next/internal-ai/internalAiReportPdf.ts:219-266`: generazione PDF report.
- `src/utils/pdfPreview.ts:47-85`: anteprima e share PDF.

Reader clone-safe:

- D01: `src/next/nextAnagraficheFlottaDomain.ts:763-880`.
- D02: `src/next/nextOperativitaTecnicaDomain.ts:223-229`.
- D03: `src/next/domain/nextAutistiDomain.ts:1176-1195`.
- D04: `src/next/domain/nextRifornimentiDomain.ts:1291-1304`.
- D05: `src/next/domain/nextInventarioDomain.ts:235-239`, `src/next/domain/nextMaterialiMovimentiDomain.ts:1125-1645`.
- D06: `src/next/domain/nextProcurementDomain.ts:891-906`.
- D07/D08: `src/next/domain/nextDocumentiCostiDomain.ts:1925-2218`.
- D09: `src/next/domain/nextCisternaDomain.ts:842-1240`.
- D10: `src/next/domain/nextCentroControlloDomain.ts:1627-1657`.

Scritture archivio:

- Firestore write wrapper: `src/utils/firestoreWriteOps.ts:15-39`.
- Storage write wrapper: `src/utils/storageWriteOps.ts:20-53`.
- Firebase Storage config: `src/firebase.ts:26-27`.
- `storageSync` dimostra che `storage` Firestore e' una collection reale, non browser localStorage (`src/utils/storageSync.ts:27-35`, `src/utils/storageSync.ts:139-149`).

Tassonomia:

- 17 scope del motore unificato: `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:483-515`.
- 45 source descriptor: `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:555-600`.

Card mezzo:

- Componente card: `src/next/internal-ai/InternalAiMezzoCard.tsx:60`.
- CSS card: `src/next/internal-ai/internalAiMezzoCard.css`.

## 12. FILE ESISTENTI DA NON TOCCARE

Durante implementazione dell'ossatura non toccare:

- `src/pages/**`: madre intatta.
- `src/next/NextInternalAiPage.tsx`: vecchia chat IA resta in piedi.
- `src/next/internal-ai/internalAiChatOrchestrator.ts`: non aggiungere fix al vecchio orchestratore.
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`: non modificare il motore unificato; copiare solo concetti nella nuova tassonomia.
- `backend/internal-ai/server/internal-ai-adapter.js`: backend esistente riusato senza modifiche.
- Reader D01-D10 elencati in sezione 11: solo import/uso, nessuna modifica.
- Writer business esistenti, inclusi writer Mezzi, Magazzino, Procurement, Dossier.
- Moduli madre Mezzo 360, Autista 360, Centro Controllo.
- Sottosistema Archivista.

Nota sulla barriera:

- `src/utils/cloneWriteBarrier.ts` non va toccato per runner settoriali o logiche di lettura.
- Per salvare davvero report su Firestore + Storage, la patch implementativa dell'ossatura dovra' avere un'autorizzazione esplicita e stretta su `/next/chat`, collection `chat_ia_reports` e prefix Storage `chat_ia_reports/`.
- Se Giuseppe non autorizza quella deroga, l'ossatura potra' mostrare report e generare PDF, ma non potra' completare il salvataggio persistente.

## 13. DEFINITION OF DONE OSSATURA

L'ossatura e' completata solo se tutti questi criteri sono veri:

1. Route `/next/chat` navigabile nel browser.
2. Route vecchia `/next/ia/report` ancora navigabile.
3. Prima schermata con un solo campo libero e nessun bottone di scorciatoia.
4. Submit di `ciao` produce risposta neutra senza elenco completo di capability.
5. Submit di una targa produce decisione router settore `mezzi`, anche se il runner reale Mezzi e' ancora fallback.
6. Submit `rifornimenti aprile 2026` produce fallback contestuale del settore corretto, non elenco generico.
7. Indicatore `Sto leggendo i dati...` visibile durante una richiesta.
8. Messaggi non persistiti dopo reload pagina.
9. Archivio vuoto consultabile tramite prompt libero `mostra archivio report TI282780`.
10. Report dummy generabile in modale strutturato.
11. PDF dummy esportabile con `generateChatIaReportPdf`.
12. Se backend `127.0.0.1:4310` e' spento, la chat risponde con fallback locale senza crash.
13. Build verde.
14. Lint zero errori sui nuovi file `src/next/chat-ia/**`.
15. Nessun file Archivista modificato.
16. Nessun reader D01-D10 modificato.
17. Nessun backend modificato.

Verifiche tecniche minime future:

```text
npm run build
npx eslint src/next/chat-ia
```

Verifiche browser minime future:

- Aprire `/next/chat`.
- Scrivere `ciao`.
- Scrivere `TI282780`.
- Scrivere `rifornimenti aprile 2026`.
- Spegnere backend IA e riprovare un prompt.
- Generare PDF dummy da report modale.

## 14. TEST DI ACCETTAZIONE PER UTENTE

Test che Giuseppe puo' eseguire in browser:

1. Apri `/next/chat`.
2. Verifica che ci sia solo il campo libero, senza bottoni rapidi o menu di filtri.
3. Scrivi `ciao`: la chat deve rispondere in modo neutro, senza elenco generale di tutto quello che sa fare.
4. Scrivi una targa reale, per esempio `TI282780`: la chat deve riconoscere il settore Mezzi e non andare nel vecchio layout IA.
5. Scrivi `rifornimenti aprile 2026`: la chat deve restare nel tema rifornimenti e non mostrare capacita' fuori contesto.
6. Scrivi `mostra archivio report TI282780`: deve apparire un pannello archivio, anche se vuoto.
7. Apri un report dummy e scarica il PDF: il PDF deve aprirsi o scaricarsi senza errori.

Criterio di approvazione utente:

- Giuseppe deve poter dire: `la nuova chat e' una sola, risponde senza menu, non inventa, e l'archivio report e' pronto come struttura`.

## 15. DECISIONI VINCOLANTI

Le 5 voci che la versione precedente lasciava aperte sono state
confermate da Giuseppe in chat il 2026-04-27. Ogni decisione e
vincolante per la fase di implementazione.

### D1. Nomi storage report

Decisione: confermati i nomi proposti dalla spec.

- Collection Firestore: `chat_ia_reports`.
- Prefix Storage PDF: `chat_ia_reports/{sector}/{yyyy}/{entryId}.pdf`.
- Campo Firestore stabile: `pdfStoragePath`.
- Campo URL derivato: `pdfUrl`.

### D2. Deroga barriera per salvataggio report

Decisione: deroga stretta autorizzata.

La patch implementativa dell'ossatura aggiungera in
`src/utils/cloneWriteBarrier.ts` una deroga limitata a:

- origine `/next/chat`,
- collection Firestore `chat_ia_reports`,
- prefix Storage `chat_ia_reports/`.

Nessun'altra collection o prefix viene aperto. Il resto della barriera
resta invariato.

### D3. Cancellazione report

Decisione: soft delete in versione 1.

Comportamento:

- Eliminazione di un report imposta `status = "deleted"` sul documento
  Firestore e valorizza `deletedAt`.
- Il PDF associato resta in Storage e non viene cancellato.
- La cancellazione fisica del documento Firestore e del PDF Storage
  resta una scelta futura separata, fuori dalla versione 1
  dell'ossatura.

### D4. Accesso archivio dalla UI

Decisione: solo via prompt libero, nessun bottone fisso.

L'archivio report e accessibile esclusivamente scrivendo nel campo
chat. Esempi accettati:

- `mostra report TI282780`
- `mostra report autista Rossi`
- `riapri report TI282780 aprile 2026`

Nessun pulsante "Archivio" e nessun menu fisso in UI.

### D5. Report dummy nell'ossatura

Decisione: report dummy accettato come strumento di validazione.

Comportamento:

- L'ossatura include un report tecnico dummy che permette di validare
  end-to-end modale + PDF + archivio prima delle verticali settoriali.
- Quando il primo settore reale (Mezzi) sara implementato e produrra
  report veri, il dummy verra rimosso o nascosto via flag tecnico.
- Il dummy non e un feature di prodotto: e infrastruttura di test
  interna alla fase ossatura.

## 16. APPENDICE: file letti per scrivere questa spec

- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `docs/audit/AUDIT_CHAT_IA_NEXT_RIFACIMENTO_2026-04-27.md`
- `src/App.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/next/internal-ai/internalAiServerChatClient.ts`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
- `src/utils/pdfPreview.ts`
- `src/utils/pdfEngine.ts`
- `src/utils/storageSync.ts`
- `src/utils/firestoreWriteOps.ts`
- `src/utils/storageWriteOps.ts`
- `src/utils/cloneWriteBarrier.ts`
- `src/firebase.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
