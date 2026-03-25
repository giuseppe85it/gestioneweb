# CHANGE REPORT - Planner gestionale e composer business-first della console IA NEXT

## Data
- 2026-03-24 22:35

## Tipo task
- patch

## Obiettivo
- completare il layer interpretativo/orchestrativo sopra il motore unificato gia esistente, senza rifare UI, backend o renderer PDF.

## File modificati
- src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts
- src/next/NextInternalAiPage.tsx
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Riassunto modifiche
- aggiunto request understanding robusto con parsing di intento business, periodo, metriche, filtri console e output finale.
- aggiunto planner gestionale che seleziona i domini corretti e non allarga piu le richieste specifiche a `stato mezzo`.
- aggiunti calcoli deterministici per rifornimenti/consumi, criticita/priorita e scadenze/collaudi/pre-collaudi.
- riscritto il composer finale in ottica business-first e riallineato il report/PDF al ramo corretto per richieste `report`.
- corretta la normalizzazione dei filtri console vuoti (`Targa: -`) che falsava le query senza targa.
- aggiornati capability catalog, suggerimenti UI e registri documentali obbligatori.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- la chat `/next/ia/interna` capisce meglio richieste ampie e sceglie i domini corretti senza rumore laterale.
- i rifornimenti restano focalizzati su D04, le richieste flotte lavorano su D10 + D02, il quadro completo si apre solo se esplicitamente richiesto.
- il report/PDF esistente viene riusato correttamente per richieste reportistiche senza rifare il renderer.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- IA interna NEXT
- Console `/next/ia/interna`
- Unified intelligence engine read-only

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- sistema

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- le query flotte `oggi` dipendono strettamente dal periodo odierno e possono risultare povere se nel giorno corrente ci sono pochi segnali.
- i domini fuori asse forte `D10 + D02` restano ancora parziali e vanno dichiarati come limite quando il dato non basta.
- il PDF continua a usare il renderer esistente; resta fuori scopo il debito storico di `src/utils/pdfEngine.ts`.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/NextInternalAiPage.tsx` -> OK
- smoke UI reale via Playwright locale su `/next/ia/interna` con 6 prompt richiesti -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

