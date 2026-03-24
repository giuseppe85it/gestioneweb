# CHANGE REPORT - Unified Intelligence Engine e console unica

## Data
- 2026-03-24 11:28

## Tipo task
- patch

## Obiettivo
- Riprendere una patch interrotta sul worktree locale e chiudere il motore unificato read-only della IA interna NEXT, senza rifare da zero il lavoro gia coerente.

## File modificati
- `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-24_1128_unified-intelligence-engine-console.md`
- `docs/continuity-reports/2026-03-24_1128_continuity_unified-intelligence-engine-console.md`

## Riassunto modifiche
- Confermato e tenuto il lavoro gia presente sul registry read-only e sull'engine unificato.
- Completato il wiring del motore in orchestratore, bridge e output selector per non perdere artifact/report quando la query passa dal motore unificato.
- Esposta in pagina una console unica con targa, ambiti e output, piu stato sintetico del registry.
- Rifinito il parser del motore per rispettare meglio query libere come `pdf`, `modale`, `report` e per dichiarare gli ambiti richiesti anche quando non c'e una targa.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Una sola console IA puo ora leggere e intrecciare piu fonti nella stessa richiesta.
- Le fonti raw o sporche non vengono escluse: entrano con adapter read-only prudente e limiti espliciti.
- Il clone resta interamente no-write e la madre non viene toccata.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- IA interna NEXT
- Domain layer read-only clone-safe
- Console `/next/ia/interna`

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- altro

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Una parte dei link cross-fonte resta forte solo dove il repo espone chiavi strutturali coerenti; altrove il motore resta prudente.
- La fonte `@impostazioni_app/gemini` resta censita ma non viene letta lato client.
- La copertura totale del registry non equivale a normalizzazione completa dei domini sporchi.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/domain/nextUnifiedReadRegistryDomain.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
