# CHANGE REPORT - Primo ponte mock-safe frontend-backend documenti IA

## Data
- 2026-03-22 11:21

## Tipo task
- feature

## Obiettivo
- Collegare in modo mock-safe il frontend del sottosistema IA interna al nuovo backend IA separato, senza provider reali, senza segreti e senza scritture business, facendo transitare la capability `documents-preview`.

## File modificati
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
- docs/change-reports/2026-03-22_1121_ponte-frontend-backend-mock-safe-documenti-ia.md
- docs/continuity-reports/2026-03-22_1121_continuity_ponte-backend-mock-safe-documenti-ia.md

## Riassunto modifiche
- Attivato nel backend IA separato il primo handler mock-safe per `documents-preview` sul contratto `orchestrator.preview`.
- Creato il bridge frontend `internalAiDocumentsPreviewBridge` che instrada la richiesta verso il backend separato e ricade in modo esplicito sul facade locale se il ponte non e disponibile.
- Aggiornata la pagina `/next/ia/interna` per mostrare il canale attivo della preview documenti e riallineato il catalogo contratti IA interni.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il clone usa ora un primo canale strutturale frontend -> backend separato senza dipendere dai backend IA legacy.
- Nessun impatto sui flussi correnti della madre e nessuna scrittura business aggiuntiva.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Sottosistema IA interna `/next/ia/interna`
- Backend IA separato `backend/internal-ai/*`

## Contratti dati toccati?
- SI
- Solo contratti tecnici interni del ponte mock-safe `documents-preview`; nessun contratto business operativo modificato.

## Punto aperto collegato?
- SI
- Restano aperti l'adapter deploy reale del backend IA separato, la strategia segreti lato server e la progressiva migrazione delle altre capability dal frontend locale.

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- IA interna / overview `/next/ia/interna`

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI, consigliato
- Il progetto ora ha il primo ponte verificabile tra frontend IA interno e backend IA separato, anche se ancora mock-safe e in-process.

## Rischi / attenzione
- Il ponte non e ancora un adapter server-side reale: resta in-process e serve solo a fissare il canale corretto.
- Solo `documents-preview` passa ora nel backend separato; le altre capability IA interne restano ancora frontend/mock locale.

## Build/Test eseguiti
- `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiDocumentsPreviewBridge.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
