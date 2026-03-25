# CHANGE REPORT - Planner multi-dominio e regressione prompt reali IA NEXT

## Data
- 2026-03-25 06:27

## Tipo task
- patch

## Obiettivo
- blindare il planner della console `/next/ia/interna` per richieste umane ampie, trasversali, orientate ad azione e top-N, senza rifare il motore unificato o la UI.

## File modificati
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- esteso il request understanding con `rankingLimit`, richiesta di ordinamento/priorita, azione consigliata e segnali multi-dominio.
- rafforzate le precedenze intenti per impedire che i prompt ampi su attenzione operativa collassino su un solo dominio.
- riallineato il planner `fleet_attention` per lavorare come caso multi-dominio sopra `D10 + D02`, lasciando separati i rami fuel, scadenze/collaudi e quadro completo.
- resi i composer flotte coerenti con top-N e `Azione consigliata`.
- aggiornati capability catalog e suggerimenti chat per usare i quattro prompt reali come bussola del planner.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- le richieste ampie non collassano piu automaticamente sul solo ramo `scadenze/collaudi`.
- le richieste specifiche continuano a restare focalizzate nel loro dominio.
- i prompt bussola entrano in rami coerenti con priorita, output e ampiezza richiesti.

## Rischio modifica
- ELEVATO

## Moduli impattati
- console `/next/ia/interna`
- planner/orchestrazione IA read-only
- catalogo capability e suggerimenti chat

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI
- audit pianificazione finale e audit validazione del `2026-03-25`

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
- il planner ora sceglie meglio il ramo corretto, ma i domini fuori asse forte restano prudenti e non diventano automaticamente deep-operativi.
- il prompt multi-dominio puo ancora restituire `Da verificare` o `Parziale` se il dato del giorno/periodo e povero.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/NextInternalAiPage.tsx` -> OK
- smoke UI `/next/ia/interna` via Playwright locale:
  - prompt 1 `questo mese + km/l + genera pdf` -> `Report PDF` fuel-first su `D04`
  - prompt 2 `oggi + top 3 + incrocio multi-dominio` -> `classifica priorita` su `D10 + D02`
  - prompt 3 `prossimi 30 giorni + collaudo/pre-collaudo + priorita` -> thread focalizzato su scadenze/collaudi
  - prompt 4 `quadro completo TI233827` -> analisi strutturata multi-dominio utile alla decisione

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
