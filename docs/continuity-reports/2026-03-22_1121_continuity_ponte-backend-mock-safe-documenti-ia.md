# CONTINUITY REPORT - Ponte mock-safe documenti IA

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre.
- Il sottosistema IA interna vive sotto `/next/ia/interna*` e dispone ora sia del backend separato scaffoldato sia del primo ponte attivo verso di esso.

## Modulo/area su cui si stava lavorando
- IA interna `/next/ia/interna`
- Primo collegamento mock-safe frontend -> backend separato

## Stato attuale
- La capability `documents-preview` passa ora dal frontend al backend separato in modalita mock-safe.
- Il ponte e in-process, senza endpoint deployato reale, e mantiene fallback locale esplicito.
- Build del repo, lint mirato e type-check del backend separato passano.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI clone `/next/ia/interna*` con preview, artifact locale e chat controllata
- Blocchi preview-first per analisi economica, documenti, libretto e preventivi
- Backend IA separato scaffoldato in `backend/internal-ai/*`
- Primo ponte attivo solo per `documents-preview`

## Prossimo step di migrazione
- Aprire un task separato per scegliere se estendere il ponte mock-safe a una seconda capability (`analisi economica` o `report targa`) oppure per introdurre il primo adapter server-side reale del backend separato.

## Moduli impattati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiDocumentsPreviewBridge.ts
- backend/internal-ai/tsconfig.json
- backend/internal-ai/src/internalAiBackendContracts.ts
- backend/internal-ai/src/internalAiBackendHandlers.ts
- backend/internal-ai/src/internalAiBackendService.ts
- registri docs del clone e dell'IA interna

## Contratti dati coinvolti
- Contratto tecnico `orchestrator.preview` del backend IA separato
- Contratto tecnico `documents-preview` del sottosistema IA interno
- Nessun contratto business modificato

## Ultime modifiche eseguite
- Attivato nel backend separato il primo handler mock-safe per `documents-preview`.
- Creato un bridge frontend che usa il dispatcher del backend separato e ricade sul facade locale solo in fallback esplicito.
- Aggiornata la UI della home IA interna per mostrare il canale attivo della preview documenti e il catalogo contratti allineato.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiDocumentsPreviewBridge.ts
- backend/internal-ai/tsconfig.json
- backend/internal-ai/src/internalAiBackendContracts.ts
- backend/internal-ai/src/internalAiBackendHandlers.ts
- backend/internal-ai/src/internalAiBackendService.ts
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Il primo ponte attivo usa `documents-preview` perche e la capability piu sicura da instradare nel backend separato senza OCR, upload o provider reali.
- Il canale corretto nel repo attuale e il dispatcher del backend separato, non `functions/*`, `api/*`, `server.js` o altri backend legacy.
- Il fallback locale resta voluto e trasparente finche non esiste un adapter server-side reale.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business nel clone o nel backend separato.
- Nessun riuso runtime dei backend IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.

## Parti da verificare
- Se il primo adapter server-side reale del backend separato dovra essere Cloud Run, wrapper Functions o altro.
- Quale capability convenga spostare come seconda sul ponte mock-safe dopo `documents-preview`.

## Rischi aperti
- Il ponte e ancora in-process: definisce il canale corretto ma non rappresenta ancora il deploy server-side finale.
- Le altre capability IA interne restano locali e possono divergere se non vengono migrate progressivamente con task separati.

## Punti da verificare collegati
- Governance endpoint IA/PDF multipli nel repo
- Strategia segreti lato server
- Policy Firestore/Storage effettive

## Prossimo passo consigliato
- Aprire un task separato per estendere il ponte mock-safe a una seconda capability clone-safe oppure per scegliere l'adapter deploy reale del backend IA separato.

## Cosa NON fare nel prossimo task
- Non riusare `functions/index.js`, `api/pdf-ai-enhance.ts`, `server.js` o altri backend legacy come scorciatoia per velocizzare il ponte.
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
