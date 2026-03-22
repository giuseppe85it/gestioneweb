# CHANGE REPORT - Quinto, sesto e settimo ponte mock-safe frontend-backend report IA

## Data
- 2026-03-22 12:14

## Tipo task
- feature

## Obiettivo
- Portare insieme le capability `report targa`, `report autista` e `report combinato` dal solo frontend/mock al nuovo backend IA separato, in modalita mock-safe e senza provider reali o backend legacy come canale canonico.

## File modificati
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
- docs/change-reports/2026-03-22_1214_ponte-backend-mock-safe-report-ia.md
- docs/continuity-reports/2026-03-22_1214_continuity_ponte-backend-report-ia.md

## Riassunto modifiche
- Attivati nel backend IA separato i tre nuovi handler mock-safe per `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview` sul contratto `orchestrator.preview`.
- Creati i bridge frontend `internalAiVehicleReportPreviewBridge`, `internalAiDriverReportPreviewBridge` e `internalAiCombinedReportPreviewBridge` che instradano le richieste verso il backend separato e ricadono in modo esplicito sui facade locali se i ponti non sono disponibili.
- Aggiornata la pagina `/next/ia/interna` per mostrare il canale attivo dei tre report e riallineato il catalogo contratti IA interni.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il clone usa ora sette canali strutturali frontend -> backend separato senza dipendere dai backend IA legacy.
- Nessun impatto sui flussi correnti della madre e nessuna scrittura business aggiuntiva.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Sottosistema IA interna `/next/ia/interna`
- Backend IA separato `backend/internal-ai/*`

## Contratti dati toccati?
- SI
- Solo contratti tecnici interni dei ponti mock-safe `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview`; nessun contratto business operativo modificato.

## Punto aperto collegato?
- SI
- Restano aperti l'adapter deploy reale del backend IA separato, la strategia segreti lato server e la migrazione della chat interna dal frontend locale.

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
- Il progetto ora ha tutti i report read-only del clone gia instradati nel backend IA separato mock-safe.

## Rischi / attenzione
- I ponti non sono ancora adapter server-side reali: restano in-process e servono solo a fissare il canale corretto.
- La chat interna e i lookup/autosuggest di supporto restano ancora frontend/mock locale.

## Build/Test eseguiti
- `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiVehicleReportPreviewBridge.ts src/next/internal-ai/internalAiDriverReportPreviewBridge.ts src/next/internal-ai/internalAiCombinedReportPreviewBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
