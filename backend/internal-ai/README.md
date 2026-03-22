# Backend IA separato

## Scopo
- Questo perimetro ospita il primo scaffold del backend server-side dedicato al nuovo sottosistema IA interno.
- Il codice qui presente e separato da:
  - `functions/*`
  - `functions-schede/*`
  - `api/*`
  - `server.js`
- Il perimetro resta volutamente `mock-safe`: nessun provider reale, nessun segreto reale e nessuna scrittura business.
  Nota aggiornata: il primo provider reale puo ora essere collegato solo lato server, solo via variabile ambiente e solo per preview/proposte IA senza scritture business automatiche.

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
- Il primo retrieval server-side aperto in questo step non equivale a un retrieval business completo: usa ancora uno snapshot seedato dal clone, con fallback locale esplicito nel frontend.
