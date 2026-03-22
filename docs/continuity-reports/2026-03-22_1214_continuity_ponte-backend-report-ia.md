# CONTINUITY REPORT - Ponti mock-safe report IA

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre.
- Il sottosistema IA interna vive sotto `/next/ia/interna*` e dispone ora di sette ponti attivi verso il backend separato: `documents-preview`, `economic-analysis-preview`, `libretto-preview`, `preventivi-preview`, `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview`.

## Modulo/area su cui si stava lavorando
- IA interna `/next/ia/interna`
- Quinto, sesto e settimo collegamento mock-safe frontend -> backend separato

## Stato attuale
- Le capability `report targa`, `report autista` e `report combinato` passano ora dal frontend al backend separato in modalita mock-safe.
- I ponti sono in-process, senza endpoint deployato reale, e mantengono fallback locale esplicito.
- Build del repo, lint mirato e type-check del backend separato passano.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI clone `/next/ia/interna*` con preview, artifact locale e chat controllata
- Blocchi preview-first per report, analisi economica, documenti, libretto e preventivi
- Backend IA separato scaffoldato in `backend/internal-ai/*`
- Ponti attivi per tutte le capability preview-first read-only del clone

## Prossimo step di migrazione
- Aprire un task separato per scegliere se spostare la chat interna su backend mock-safe oppure per introdurre il primo adapter server-side reale del backend separato.

## Moduli impattati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiVehicleReportPreviewBridge.ts
- src/next/internal-ai/internalAiDriverReportPreviewBridge.ts
- src/next/internal-ai/internalAiCombinedReportPreviewBridge.ts
- backend/internal-ai/src/internalAiBackendContracts.ts
- backend/internal-ai/src/internalAiBackendHandlers.ts
- backend/internal-ai/src/internalAiBackendService.ts
- registri docs del clone e dell'IA interna

## Contratti dati coinvolti
- Contratto tecnico `orchestrator.preview` del backend IA separato
- Contratti tecnici `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview` del sottosistema IA interno
- Nessun contratto business modificato

## Ultime modifiche eseguite
- Attivati nel backend separato i tre nuovi handler mock-safe per `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview`.
- Creati tre bridge frontend che usano il dispatcher del backend separato e ricadono sui facade locali solo in fallback esplicito.
- Aggiornata la UI della home IA interna per mostrare il canale attivo dei tre report e il catalogo contratti allineato.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiVehicleReportPreviewBridge.ts
- src/next/internal-ai/internalAiDriverReportPreviewBridge.ts
- src/next/internal-ai/internalAiCombinedReportPreviewBridge.ts
- backend/internal-ai/src/internalAiBackendContracts.ts
- backend/internal-ai/src/internalAiBackendHandlers.ts
- backend/internal-ai/src/internalAiBackendService.ts
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Le tre capability report usano lo stesso contratto `orchestrator.preview` per mantenere un canale backend unico, reversibile e coerente.
- Il canale corretto nel repo attuale resta il dispatcher del backend separato, non `functions/*`, `api/*`, `server.js` o altri backend legacy.
- Il fallback locale resta voluto e trasparente finche non esiste un adapter server-side reale.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business nel clone o nel backend separato.
- Nessun riuso runtime dei backend IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.

## Parti da verificare
- Se il primo adapter server-side reale del backend separato dovra essere Cloud Run, wrapper Functions o altro.
- Se la chat interna debba diventare il prossimo ponte mock-safe oppure restare locale fino all'adapter reale.

## Rischi aperti
- I ponti sono ancora in-process: definiscono il canale corretto ma non rappresentano ancora il deploy server-side finale.
- La chat interna e i lookup/autosuggest restano locali e possono divergere se non vengono migrati progressivamente con task separati.

## Punti da verificare collegati
- Governance endpoint IA/PDF multipli nel repo
- Strategia segreti lato server
- Policy Firestore/Storage effettive

## Prossimo passo consigliato
- Aprire un task separato per estendere il backend mock-safe alla chat interna oppure per scegliere l'adapter deploy reale del backend IA separato.

## Cosa NON fare nel prossimo task
- Non riusare `functions/index.js`, `functions/analisiEconomica.js`, `functions/estrazioneDocumenti.js`, `api/pdf-ai-enhance.ts`, `server.js` o altri backend legacy come scorciatoia per velocizzare il ponte.
- Non introdurre provider reali, segreti veri o scritture business solo per simulare una integrazione piu "vera".

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- docs/STATO_ATTUALE_PROGETTO.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
