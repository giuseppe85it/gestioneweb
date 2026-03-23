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
  - governance dedicata del perimetro `backend/internal-ai`, separata dal runtime root e dai package legacy; dichiara ora anche le dipendenze runtime effettive dell'adapter e uno script dedicato di readiness Firebase/Storage.
- `server/internal-ai-adapter.js`
  - primo adapter server-side reale, separato dai runtime legacy, con endpoint `health`, repository artifact, memoria IA, primo retrieval read-only controllato e primo workflow preview/approval/rollback con provider lato server.
- `server/internal-ai-firebase-admin.js`
  - probe dedicato del runtime `firebase-admin` del backend IA separato, con verifica di risoluzione moduli dal package dedicato, credenziali server-side e contesto futuro per un eventuale bridge read-only stretto.
- `server/internal-ai-firebase-readiness-cli.js`
  - runner locale read-only che stampa la snapshot di readiness Firebase/Storage senza leggere dati business.
- `server/internal-ai-persistence.js`
  - persistenza locale server-side dedicata della nuova IA su file JSON in `runtime-data/`.
- `runtime-data/`
  - contenitore locale isolato per `analysis_artifacts`, memoria operativa IA, traceability del backend, primo snapshot read-only dei mezzi e workflow preview/approval/rollback, separato dai dataset business.

## Primo retrieval server-side attivo
- Il primo retrieval server-side controllato vive su `POST /internal-ai-backend/retrieval/read`.
- Perimetro attivo:
  - solo dominio mezzo-centrico `D01` su `@mezzi_aziendali`;
  - snapshot read-only seedato dal clone NEXT gia validato;
  - snapshot `Dossier Mezzo` clone-seeded per singola targa, persistita nel contenitore IA dedicato;
  - uso iniziale su `libretto-preview` e sul primo hook mezzo-centrico governato per stato dossier, costi e rifornimenti.
- Perimetro escluso:
  - Firestore server-side diretto;
  - Storage business diretto;
  - domini documenti/costi/procurement completi;
  - backend IA legacy come canale canonico.
- Il retrieval salva e legge i file locali:
  - `runtime-data/fleet_readonly_snapshot.json`
  - `runtime-data/vehicle_dossier_readonly_snapshot.json`
- Entrambi restano separati dai dataset business e reversibili.

## Readiness Firebase / Storage read-only
- Il backend IA separato ha ora una governance minima dedicata anche a livello package, ma il bridge Firebase/Storage business read-only NON e ancora attivo.
- Stato reale verificabile oggi:
  - `backend/internal-ai/package.json` esiste e governa ora anche le dipendenze runtime gia usate dal suo adapter server-side (`body-parser`, `dotenv`, `express`, `openai`, `firebase-admin`);
  - `backend/internal-ai/server/internal-ai-firebase-admin.js` prepara il bootstrap server-side dedicato e separato, ma non apre letture business finche la probe non risulta davvero pronta;
  - `firestore.rules` non e presente nel repo e `firebase.json` non espone ancora alcun boundary Firestore verificabile;
  - `storage.rules` versionato resta in conflitto con l'uso legacy di Storage;
  - credenziali server-side dedicate del backend IA non risultano dimostrate nel processo corrente.
- Probe locale ripetibile:
  - `npm --prefix backend/internal-ai run firebase-readiness`
  - il comando stampa solo la snapshot di readiness del bridge, senza leggere Firestore o Storage business.
  - nel checkout locale verificato in questo task la probe risolve `firebase-admin` dal solo package `backend/internal-ai`, ma il bridge resta `not_ready` per assenza di credenziali Google server-side e policy Firestore verificabili.
- Whitelist candidate non attive:
  - Firestore: solo `storage/@mezzi_aziendali`;
  - Storage: solo path esatto derivato da `librettoStoragePath`, senza `listAll`, senza prefix scan e senza path arbitrari.
- Boundary futuro codificato ma non attivo:
  - `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` dichiara in modo machine-readable l'unico primo perimetro live ammissibile;
  - Firestore: solo documento esatto `storage/@mezzi_aziendali`, con projection futura limitata ai campi D01/libretto;
  - Storage: solo bucket `gestionemanutenzione-934ef.firebasestorage.app` e solo oggetto esatto puntato da `librettoStoragePath`;
  - restano esplicitamente fuori `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@costiMezzo`, `@documenti_*`, `@preventivi`, `@preventivi_approvazioni`, `documenti_pdf/*`, `preventivi/*`, `autisti/*`.
- Prossimo passo corretto:
  - configurare credenziale server-side separata;
  - versionare/collegare davvero `firestore.rules` o un'evidenza equivalente delle policy effettive;
  - chiarire in modo definitivo il boundary deployato di `storage.rules`;
  - aprire solo dopo un adapter read-only reale con whitelist runtime e traceability.
- Nota importante:
  - il nuovo snapshot `Dossier Mezzo` server-side NON equivale a un bridge Firebase live;
  - resta un retrieval IA dedicato, clone-seeded e read-only sopra i layer NEXT gia governati.
  - `firebase.json`, `firestore.rules` e `storage.rules` non vengono toccati in questo step perche il repo li marca ancora come punti critici da chiarire prima di qualunque modifica deploy-sensitive.
  - `GET /internal-ai-backend/health` espone ora anche una sintesi read-only della readiness Firebase/Storage e della probe runtime `firebase-admin`, senza attivare il live bridge.

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
