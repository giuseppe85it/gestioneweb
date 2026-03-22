# CONTINUITY REPORT - Scaffolding backend IA separato

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre.
- Il sottosistema IA interna vive sotto `/next/ia/interna*`, ma ora dispone anche di un primo perimetro backend server-side separato nel repository.

## Modulo/area su cui si stava lavorando
- Backend dedicato del sottosistema IA interno
- Primo scaffold server-side separato dai canali legacy

## Stato attuale
- Esiste il nuovo perimetro `backend/internal-ai/*`.
- Il perimetro e framework-agnostico, non operativo e `mock-safe`.
- Non e collegato a provider reali, segreti, Firestore business o Storage business.
- Build del repo, lint backend e type-check del backend separato passano.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI clone `/next/ia/interna*` con preview, artifact locale e chat controllata
- Blocchi preview-first per analisi economica, documenti, libretto e preventivi
- Primo scaffold backend separato in `backend/internal-ai/*`

## Prossimo step di migrazione
- Aprire un task separato per scegliere l'adapter di deploy reale del backend IA separato, senza rendere canonici `functions/*`, `api/*` o `server.js`.

## Moduli impattati
- `backend/internal-ai/README.md`
- `backend/internal-ai/tsconfig.json`
- `backend/internal-ai/src/internalAiBackendContracts.ts`
- `backend/internal-ai/src/internalAiBackendHandlers.ts`
- `backend/internal-ai/src/internalAiBackendService.ts`
- registri docs del clone e dell'IA interna

## Contratti dati coinvolti
- Contratti tecnici interni del backend IA separato
- Route server-side stub e guard rail del nuovo perimetro
- Nessun contratto business modificato

## Ultime modifiche eseguite
- Creato il nuovo path repo `backend/internal-ai/*` come sede canonica del futuro backend IA separato.
- Definiti manifest, route, guard rail e dispatcher framework-agnostico.
- Introdotti handler stub non operativi per salute servizio, orchestrazione preview, retrieval controllato, preview artifact e preparazione approvazioni.
- Aggiornati `CHECKLIST_IA_INTERNA`, `STATO_AVANZAMENTO_IA_INTERNA`, `STATO_MIGRAZIONE_NEXT` e `REGISTRO_MODIFICHE_CLONE`.

## File coinvolti
- backend/internal-ai/README.md
- backend/internal-ai/tsconfig.json
- backend/internal-ai/src/internalAiBackendContracts.ts
- backend/internal-ai/src/internalAiBackendHandlers.ts
- backend/internal-ai/src/internalAiBackendService.ts
- backend/internal-ai/src/index.ts
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Il backend IA separato vive fuori da `src/next/*` e fuori da tutti i backend legacy gia presenti.
- `functions/*`, `functions-schede/*`, `api/*` e `server.js` restano solo riferimento tecnico o legacy, non backend canonico.
- Nessun provider reale, nessun segreto lato server, nessuna scrittura business e nessun adapter deploy reale vengono attivati in questo step.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business nel clone o nel nuovo backend.
- Nessun riuso runtime dei backend IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.

## Parti da verificare
- Se il deploy reale del backend separato dovra avvenire via Cloud Run, via wrapper Functions o con altro adapter.
- Come introdurre in seguito access layer backend verso repo, Firestore e Storage senza violare preview-first e approval-first.

## Rischi aperti
- Lo scaffold definisce il perimetro giusto, ma non chiude ancora ownership backend, segreti o policy dati.
- Le policy Firestore/Storage effettive restano fuori repo o non versionate, quindi nessuna persistenza server-side reale va attivata senza task dedicato.

## Punti da verificare collegati
- Governance endpoint IA/PDF multipli nel repo
- Strategia segreti lato server
- Policy Firestore/Storage effettive

## Prossimo passo consigliato
- Aprire un task separato per scegliere e implementare l'adapter deploy del backend IA separato, mantenendo invariati i guard rail di questo scaffold.

## Cosa NON fare nel prossimo task
- Non collegare `functions/index.js`, `api/pdf-ai-enhance.ts` o `server.js` come backend canonico del nuovo sottosistema.
- Non introdurre provider reali, segreti veri o scritture business solo per "provare" lo scaffold.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- docs/STATO_ATTUALE_PROGETTO.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
