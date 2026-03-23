# Backend IA separato

## Scopo
- Questo perimetro ospita il primo scaffold del backend server-side dedicato al nuovo sottosistema IA interno.
- Il codice qui presente e separato da:
  - `functions/*`
  - `functions-schede/*`
  - `api/*`
  - `server.js`
- Il perimetro resta volutamente controllato e reversibile:
  - nessuna scrittura business;
  - nessun segreto lato client;
  - nessun backend legacy reso canonico;
  - provider reale ammesso solo lato server, solo via variabile ambiente e solo per preview/proposte o chat controllate.

## Perche vive qui
- Il backend IA separato deve essere fuori sia dalla UI clone `/next/*` sia dai canali backend legacy gia attivi o ambiguamente deployati.
- Un path top-level dedicato rende esplicito che il futuro backend IA:
  - non coincide con le Functions legacy;
  - non coincide con l'edge API attuale;
  - non coincide con il server Express locale;
  - potra in futuro essere adattato a Cloud Run o altro runtime senza rendere canonico uno dei canali legacy.

## Cosa non fa in questo step
- Non espone segreti o chiavi lato client.
- Non scrive su Firestore business.
- Non scrive su Storage business.
- Non riusa `aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, `estraiPreventivoIA` o Cloud Run libretto come backend canonico.

## Struttura iniziale
- `src/internalAiBackendContracts.ts`
  - contratti base server-side, route, guard rail e manifest.
- `src/internalAiBackendHandlers.ts`
  - handler stub non operativi e risposte mock-safe.
- `src/internalAiBackendService.ts`
  - servizio canonico del nuovo backend IA separato con dispatcher framework-agnostico.
- `src/index.ts`
  - entrypoint di export.
- `tsconfig.json`
  - verifica TypeScript isolata del perimetro backend.
- `package.json`
  - governance dedicata del perimetro `backend/internal-ai`, separata dal runtime root e dai package legacy; prepara il futuro adapter Firebase/Storage read-only senza dichiararlo ancora attivo.
- `server/internal-ai-adapter.js`
  - primo adapter server-side reale, separato dai runtime legacy, con endpoint `health`, repository artifact, memoria IA, primo retrieval read-only controllato e primo workflow preview/approval/rollback con provider lato server.
- `server/internal-ai-persistence.js`
  - persistenza locale server-side dedicata della nuova IA su file JSON in `runtime-data/`.
- `runtime-data/`
  - contenitore locale isolato per `analysis_artifacts`, memoria operativa IA, traceability del backend, primo snapshot read-only dei mezzi e workflow preview/approval/rollback, separato dai dataset business.

## Primo retrieval server-side attivo
- Il primo retrieval server-side controllato vive su `POST /internal-ai-backend/retrieval/read`.
- Perimetro attivo:
  - solo dominio mezzo-centrico `D01` su `@mezzi_aziendali`;
  - snapshot read-only seedato dal clone NEXT gia validato;
  - uso iniziale sulla capability `libretto-preview`.
- Perimetro escluso:
  - Firestore server-side diretto;
  - Storage business diretto;
  - domini documenti/costi/procurement completi;
  - backend IA legacy come canale canonico.
- Il retrieval salva e legge il file locale `runtime-data/fleet_readonly_snapshot.json`, separato dai dataset business e reversibile.

## Readiness Firebase / Storage read-only
- Il backend IA separato ha ora una governance minima dedicata anche a livello package, ma il bridge Firebase/Storage business read-only NON e ancora attivo.
- Stato reale verificabile oggi:
  - `backend/internal-ai/package.json` esiste e governa il perimetro futuro del backend IA;
  - `firebase-admin` non e ancora dichiarato in questo package;
  - `firestore.rules` non e presente nel repo;
  - `storage.rules` versionato resta in conflitto con l'uso legacy di Storage;
  - credenziali server-side dedicate del backend IA non risultano dimostrate nel processo corrente.
- Whitelist candidate non attive:
  - Firestore: solo `storage/@mezzi_aziendali`;
  - Storage: solo path esatto derivato da `librettoStoragePath`, senza `listAll`, senza prefix scan e senza path arbitrari.
- Prossimo passo corretto:
  - dichiarare `firebase-admin` nel package dedicato del backend IA;
  - configurare credenziale server-side separata;
  - chiarire policy Firestore/Storage effettive;
  - aprire solo dopo un adapter read-only reale con whitelist runtime e traceability.

## Primo provider reale e workflow controllato
- Provider scelto: `OpenAI` via `Responses API`, solo server-side.
- Modello di default: `gpt-5-mini`, configurabile via `INTERNAL_AI_OPENAI_MODEL`.
- Segreto ammesso: solo `OPENAI_API_KEY` lato server, mai lato client e mai in Firestore business.
- Primo caso d'uso attivo nel codice:
  - sintesi guidata di un report gia letto e visibile nel clone;
  - generazione via `POST /internal-ai-backend/artifacts/preview` con operazione `generate_report_summary_preview`;
  - approvazione, rifiuto e rollback via `POST /internal-ai-backend/approvals/prepare`.
- Cosa salva davvero:
  - preview testuale del provider;
  - contesto report strutturato usato per la preview;
  - stati `preview_ready` / `approved` / `rejected` / `rolled_back`;
  - traceability minima delle operazioni server-side.
- Cosa resta fuori:
  - qualunque scrittura business automatica;
  - qualunque applicazione su Firestore/Storage business;
  - OCR, upload, parsing documentale reale e backend legacy come canale canonico.

## Chat reale controllata e comprensione repo/UI
- Il backend IA separato espone ora anche `POST /internal-ai-backend/orchestrator/chat`.
- Il canale e `backend-first`:
  - il frontend `/next/ia/interna` calcola comunque un fallback locale clone-safe;
  - se l'adapter e raggiungibile e `OPENAI_API_KEY` e disponibile nel processo server-side, la chat usa `OpenAI Responses API` solo lato server;
  - se il provider o l'adapter falliscono, il clone resta sul fallback locale senza side effect business.
- La chat reale puo lavorare in due modalita controllate:
  - spiegazione/sintesi di un report gia letto nel clone, tramite `reportContext` strutturato;
  - risposta repo/UI-aware usando una snapshot curata e read-only del repository.
- Il primo livello di comprensione repository/UI usa `POST /internal-ai-backend/retrieval/read` con operazione `read_repo_understanding_snapshot` e legge solo:
  - documenti architetturali/stato chiave del repo;
  - route rappresentative della NEXT;
  - macro-aree modulo;
  - pattern UI e relazioni principali tra schermate;
  - file rappresentativi della UI.
- La snapshot e volutamente limitata:
  - non e una scansione completa del repository;
  - non autorizza patch automatiche;
  - non autorizza scritture business;
  - non sostituisce il controllo umano o i task Codex.

## Verifica locale
```powershell
npx tsc -p backend/internal-ai/tsconfig.json --noEmit
npx eslint backend/internal-ai/src/*.ts
node backend/internal-ai/server/internal-ai-adapter.js
```

## Nota operativa
- Eventuali adapter futuri verso Cloud Run, Functions o altro runtime dovranno limitarsi a incapsulare questo dispatcher.
- Nessun adapter futuro dovra rendere canonici i canali backend legacy gia presenti nel repository.
- Il primo adapter reale aperto in questo step non usa Firestore o Storage business: persiste solo file JSON locali del backend IA separato.
- Se `OPENAI_API_KEY` non e configurata, il workflow reale resta disattivato e il clone deve continuare a usare i fallback mock-safe gia esistenti.
- L'adapter legge il segreto solo da `process.env.OPENAI_API_KEY`.
- Verifica reale eseguita il `2026-03-22`:
  - `OPENAI_API_KEY` presente a livello utente Windows;
  - processo server-side avviato su porta dedicata `4311` con la variabile propagata solo al processo adapter;
  - `health` con `providerEnabled: true`;
  - `artifacts.preview` con `gpt-5-mini` -> OK;
  - `approve_preview`, `reject_preview` e `rollback_preview` -> OK;
  - nessuna scrittura business.
- Verifica reale aggiuntiva eseguita il `2026-03-22`:
  - `retrieval.read` con `read_repo_understanding_snapshot` -> snapshot repo/UI costruita e letta correttamente;
  - `orchestrator.chat` con prompt repo/UI -> risposta reale del provider con snapshot curata lato server;
  - `orchestrator.chat` con `reportContext` -> sintesi reale del report attivo lato server;
  - fallback `provider_not_configured` confermato quando il processo server-side non eredita `OPENAI_API_KEY`.
- Se la shell corrente non eredita ancora la variabile utente, avviare l'adapter da una shell aggiornata o valorizzare la variabile solo nel processo server-side prima del bootstrap.
- Il primo retrieval server-side aperto in questo step non equivale a un retrieval business completo: usa ancora uno snapshot seedato dal clone, con fallback locale esplicito nel frontend.
