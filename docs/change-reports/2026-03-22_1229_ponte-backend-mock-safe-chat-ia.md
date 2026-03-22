# CHANGE REPORT - Ottavo ponte mock-safe frontend-backend chat IA interna

## Data
- 2026-03-22 12:29

## Tipo task
- feature

## Obiettivo
- Portare la chat interna del sottosistema IA su orchestrazione backend-first mock-safe, senza provider reali, senza segreti e senza scritture business.

## File modificati
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
- docs/change-reports/2026-03-22_1229_ponte-backend-mock-safe-chat-ia.md
- docs/continuity-reports/2026-03-22_1229_continuity_ponte-backend-chat-ia.md

## Riassunto modifiche
- Aggiunto nel backend IA separato il nuovo endpoint mock-safe `orchestrator.chat` per la chat interna.
- Creato il bridge frontend `internalAiChatOrchestratorBridge` che instrada i prompt verso il backend separato e ricade in modo esplicito sull'orchestratore locale se il ponte non e disponibile.
- Aggiornata la pagina `/next/ia/interna` per mostrare il canale attivo della chat e riallineato il catalogo contratti IA interni.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il clone usa ora un canale backend-first mock-safe anche per la chat interna controllata.
- Nessun impatto sui flussi correnti della madre e nessuna scrittura business aggiuntiva.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Sottosistema IA interna `/next/ia/interna`
- Backend IA separato `backend/internal-ai/*`

## Contratti dati toccati?
- SI
- Solo contratti tecnici interni `chat-orchestrator` e `orchestrator.chat`; nessun contratto business operativo modificato.

## Punto aperto collegato?
- SI
- Restano aperti l'adapter deploy reale del backend IA separato, la strategia segreti lato server e l'eventuale migrazione backend-first dei lookup/autosuggest.

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
- Il progetto ora ha anche la chat interna instradata nel backend IA separato mock-safe.

## Rischi / attenzione
- Il ponte non e ancora un adapter server-side reale: resta in-process e serve solo a fissare il canale corretto.
- Lookup/autosuggest e persistenza messaggi/tracking restano locali e non diventano ancora backend canonico.

## Build/Test eseguiti
- `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
