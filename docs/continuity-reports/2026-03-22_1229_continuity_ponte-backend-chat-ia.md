# CONTINUITY REPORT - Ponte mock-safe chat IA

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre.
- Il sottosistema IA interna vive sotto `/next/ia/interna*` e usa ora il backend separato mock-safe per chat, report e preview gia attive.

## Modulo/area su cui si stava lavorando
- IA interna `/next/ia/interna`
- Ottavo collegamento mock-safe frontend -> backend separato

## Stato attuale
- La chat interna controllata passa ora prima dal backend separato tramite il contratto `orchestrator.chat`.
- Il ponte e in-process, senza endpoint deployato reale, e mantiene fallback locale esplicito.
- Type-check backend, lint mirato e build completa passano.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- UI clone `/next/ia/interna*` con chat controllata, preview, report e artifact locale
- Backend IA separato scaffoldato in `backend/internal-ai/*`
- Ponti attivi per chat interna, report e preview-first read-only del clone

## Prossimo step di migrazione
- Chiudere type-check, lint e build del task e poi valutare se backend-first debba coprire anche lookup/autosuggest o se aprire il primo adapter server-side reale.

## Moduli impattati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiChatOrchestratorBridge.ts
- backend/internal-ai/src/internalAiBackendContracts.ts
- backend/internal-ai/src/internalAiBackendHandlers.ts
- backend/internal-ai/src/internalAiBackendService.ts
- registri docs del clone e dell'IA interna

## Contratti dati coinvolti
- Contratto tecnico `chat-orchestrator` del sottosistema IA interno
- Contratto tecnico `orchestrator.chat` del backend IA separato
- Nessun contratto business modificato

## Ultime modifiche eseguite
- Aggiunto nel backend separato l'handler mock-safe `orchestrator.chat`.
- Creato il bridge frontend della chat che usa il dispatcher del backend separato e ricade sull'orchestratore locale solo in fallback esplicito.
- Aggiornata la UI della home IA interna per mostrare il canale attivo della chat e il catalogo contratti riallineato.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiChatOrchestratorBridge.ts
- backend/internal-ai/src/internalAiBackendContracts.ts
- backend/internal-ai/src/internalAiBackendHandlers.ts
- backend/internal-ai/src/internalAiBackendService.ts
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- La chat usa un contratto dedicato `orchestrator.chat` per distinguere orchestrazione conversazionale e preview capability-specific.
- Il canale corretto nel repo attuale resta il dispatcher del backend separato, non `functions/*`, `api/*`, `server.js` o altri backend legacy.
- Il fallback locale resta voluto e trasparente finche non esiste un adapter server-side reale.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business nel clone o nel backend separato.
- Nessun riuso runtime dei backend IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.

## Parti da verificare
- Se i lookup/autosuggest debbano restare locali oppure seguire lo stesso canale backend-first in un task successivo.

## Rischi aperti
- Il ponte e ancora in-process: definisce il canale corretto ma non rappresenta ancora il deploy server-side finale.
- Messaggi chat, tracking e lookup restano locali e possono divergere dal futuro adapter reale se non vengono migrati con un task separato.

## Punti da verificare collegati
- Governance endpoint IA/PDF multipli nel repo
- Strategia segreti lato server
- Policy Firestore/Storage effettive

## Prossimo passo consigliato
- Chiudere le verifiche tecniche del task e poi decidere se migrare lookup/autosuggest o aprire il primo adapter deploy reale del backend IA separato.

## Cosa NON fare nel prossimo task
- Non riusare `functions/index.js`, `functions/analisiEconomica.js`, `functions/estrazioneDocumenti.js`, `api/pdf-ai-enhance.ts`, `server.js` o altri backend legacy come scorciatoia.
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
