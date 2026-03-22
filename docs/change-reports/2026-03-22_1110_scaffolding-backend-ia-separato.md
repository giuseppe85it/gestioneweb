# CHANGE REPORT - Scaffolding backend IA separato

## Data
- 2026-03-22 11:10

## Tipo task
- feature

## Obiettivo
- Aprire il primo scaffold del backend IA separato per la nuova IA interna, definendo il canale server-side corretto senza collegarlo ancora a provider reali o a scritture business.

## File modificati
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
- docs/change-reports/2026-03-22_1110_scaffolding-backend-ia-separato.md
- docs/continuity-reports/2026-03-22_1110_continuity_scaffolding-backend-ia-separato.md

## Riassunto modifiche
- Creato il nuovo perimetro `backend/internal-ai/*` come sede canonica del futuro backend server-side del sottosistema IA interno.
- Definiti contratti base, route, guard rail e manifest del servizio.
- Introdotti dispatcher e handler stub non operativi per:
  - `health`
  - `orchestrator.preview`
  - `retrieval.read`
  - `artifacts.preview`
  - `approvals.prepare`
- Fissato nei documenti che `functions/*`, `functions-schede/*`, `api/*` e `server.js` restano solo canali legacy o di confronto, non backend canonico del nuovo sottosistema.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il repository ha ora un punto univoco e separato dove far crescere il backend IA interno senza accoppiarlo ai runtime legacy.
- Nessun impatto sui flussi correnti della madre e nessuna dipendenza nuova per il clone `/next`.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Backend IA separato del sottosistema IA interno
- Documentazione architetturale e operativa clone/IA interna

## Contratti dati toccati?
- SI
- Solo contratti tecnici interni del nuovo backend IA separato; nessun contratto business operativo modificato.

## Punto aperto collegato?
- SI
- Restano aperti il deploy canonico del backend, la strategia segreti lato server e le policy Firestore/Storage effettive.

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- IA interna / fondazione backend separato a supporto di `/next/ia/interna`

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI, consigliato
- Il repository ora contiene un primo perimetro backend IA separato che merita di entrare negli avanzamenti macro del progetto.

## Rischi / attenzione
- Lo scaffold non decide ancora l'adapter di deploy reale; Cloud Run/Functions wrapper restano tema successivo.
- Nessun access layer backend verso repo, Firestore o Storage e ancora collegato: il perimetro e corretto, ma non operativo.

## Build/Test eseguiti
- `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
- `npx eslint backend/internal-ai/src/*.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
