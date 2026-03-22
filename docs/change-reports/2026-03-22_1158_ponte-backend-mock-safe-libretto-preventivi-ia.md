# CHANGE REPORT - Terzo e quarto ponte mock-safe frontend-backend libretto e preventivi IA

## Data
- 2026-03-22 11:58

## Tipo task
- feature

## Obiettivo
- Portare insieme le capability `libretto preview` e `preventivi preview` dal solo frontend/mock al nuovo backend IA separato, in modalita mock-safe e senza provider reali o backend legacy come canale canonico.

## File modificati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiLibrettoPreviewBridge.ts
- src/next/internal-ai/internalAiPreventiviPreviewBridge.ts
- backend/internal-ai/tsconfig.json
- backend/internal-ai/src/internalAiBackendContracts.ts
- backend/internal-ai/src/internalAiBackendHandlers.ts
- backend/internal-ai/src/internalAiBackendService.ts
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-22_1158_ponte-backend-mock-safe-libretto-preventivi-ia.md
- docs/continuity-reports/2026-03-22_1158_continuity_ponte-backend-libretto-preventivi-ia.md

## Riassunto modifiche
- Attivati nel backend IA separato i due nuovi handler mock-safe per `libretto-preview` e `preventivi-preview` sul contratto `orchestrator.preview`.
- Creati i bridge frontend `internalAiLibrettoPreviewBridge` e `internalAiPreventiviPreviewBridge` che instradano le richieste verso il backend separato e ricadono in modo esplicito sui facade locali se i ponti non sono disponibili.
- Aggiornata la pagina `/next/ia/interna` per mostrare il canale attivo di `libretto` e `preventivi` preview e riallineato il catalogo contratti IA interni.
- Aggiornato il `tsconfig` del backend separato per tipizzare correttamente il mock in-process che riusa facade clone-safe con tipi DOM e `vite/client`.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il clone usa ora quattro canali strutturali frontend -> backend separato senza dipendere dai backend IA legacy.
- Nessun impatto sui flussi correnti della madre e nessuna scrittura business aggiuntiva.

## Rischio modifica
- ELEVATO

## Moduli impattati
- Sottosistema IA interna `/next/ia/interna`
- Backend IA separato `backend/internal-ai/*`

## Contratti dati toccati?
- SI
- Solo contratti tecnici interni dei ponti mock-safe `libretto-preview` e `preventivi-preview`; nessun contratto business operativo modificato.

## Punto aperto collegato?
- SI
- Restano aperti l'adapter deploy reale del backend IA separato, la strategia segreti lato server e la progressiva migrazione di `report targa`, `report autista`, `report combinato` e chat dal frontend locale.

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
- Il progetto ora ha quattro ponti verificabili tra frontend IA interno e backend IA separato, sempre mock-safe e in-process.

## Rischi / attenzione
- I ponti non sono ancora adapter server-side reali: restano in-process e servono solo a fissare il canale corretto.
- `report targa`, `report autista`, `report combinato` e chat interna restano ancora frontend/mock locale.

## Build/Test eseguiti
- `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts src/next/internal-ai/internalAiPreventiviPreviewBridge.ts backend/internal-ai/src/internalAiBackendContracts.ts backend/internal-ai/src/internalAiBackendHandlers.ts backend/internal-ai/src/internalAiBackendService.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
