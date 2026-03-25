# CHANGE REPORT - Priority engine operativo flotta IA NEXT

## Data
- 2026-03-25 07:37

## Tipo task
- patch

## Obiettivo
- trasformare la console `/next/ia/interna` in un assistente operativo piu stabile sulle richieste flotta, con classifica priorita spiegabile, top-N deterministico e azione consigliata.

## File modificati
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- introdotto un priority engine operativo che ordina i mezzi con criterio fisso e leggibile: scaduti, poi entro 7 giorni, poi alert critici/KO e lavori urgenti, poi segnalazioni/pre-collaudi, infine backlog tecnico/manutenzioni.
- ogni riga classifica espone ora targa, livello priorita, motivi sintetici e azione consigliata.
- il planner non lascia piu che i prompt settimanali/top-1 ricadano nel fallback generico.
- i prompt deadline-focused con `priorita` restano nel ramo `Scadenze flotta`, evitando il collasso sulla classifica operativa generale.
- aggiornati capability catalog e suggerimenti della console sui casi reali di priorita giornaliera e settimanale.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- la IA risponde in modo piu utile alle domande `quali mezzi richiedono piu attenzione`, `quale mezzo e piu critico`, `quale controllare per primo` e `cosa conviene fare`.
- la classifica flotta non appare piu magica: il thread dichiara segnali usati, criterio di priorita e azione consigliata.
- i casi `collaudo/pre-collaudo` mantengono il loro ramo dedicato e non vengono peggiorati dal nuovo engine.

## Rischio modifica
- ELEVATO

## Moduli impattati
- motore unificato IA read-only
- planner/renderer del thread `/next/ia/interna`
- capability catalog e suggerimenti operativi della console

## Contratti dati toccati?
- NO
- nessun nuovo contratto dati o reader; il ranking usa solo segnali gia letti dal motore su `D10 + D02`

## Punto aperto collegato?
- SI
- audit validazione `2026-03-25`
- audit pianificazione finale `2026-03-25`

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
- il ranking resta prudente quando nel periodo non emergono segnali abbastanza forti; il sistema non deve inventare priorita per riempire il top-N.
- il perimetro forte resta `D10 + D02`; questo step non rende automaticamente deep-operativi altri domini.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/NextInternalAiPage.tsx` -> OK
- smoke UI `/next/ia/interna` via Playwright locale:
  - `oggi + top 3 + incrocio multi-dominio` -> `Priorita flotta`, prudente per assenza di segnali forti nel giorno
  - `Quale mezzo e piu critico questa settimana?` -> `Priorita flotta`, `TI180147` in testa con motivi e azione
  - `un solo mezzo da controllare oggi` -> top-1 nel ramo `Priorita flotta`
  - `prossimi 30 giorni + collaudo/pre-collaudo + priorita` -> `Scadenze flotta`, ordinato e focalizzato

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
