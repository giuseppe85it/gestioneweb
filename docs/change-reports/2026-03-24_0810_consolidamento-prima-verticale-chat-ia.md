# CHANGE REPORT - Consolidamento prima verticale chat IA

## Data
- 2026-03-24 08:10

## Tipo task
- patch

## Obiettivo
- Consolidare la chat IA interna solo sulla prima verticale `D01 + D10 + D02`, rendendo piu coerenti intenti, reader canonici, output e limiti nel thread.

## File modificati
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/internal-ai/internalAiVehicleDossierHookFacade.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-24_0810_consolidamento-prima-verticale-chat-ia.md`
- `docs/continuity-reports/2026-03-24_0810_continuity_consolidamento-prima-verticale-chat-ia.md`

## Riassunto modifiche
- Stretti gli intenti della chat ai casi reali della prima verticale: stato mezzo, report targa, analisi Home operativa, spiegazione alert/revisione/stato operativo, file/moduli da toccare e variante tecnica su lavori/manutenzioni.
- Riallineati catalogo capability, orchestrator e output selector per evitare capability o output fuori verticale nel thread V1.
- Sostituito il percorso logico primario della chat con reader NEXT read-only di `D01`, `D10` e `D02`, evitando il composito Dossier largo come sorgente primaria.
- Migliorata la chiarezza del thread in `/next/ia/interna` con suggerimenti, etichette, chip contesto e limiti dichiarati.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- La chat risponde in modo piu coerente e spiegabile sulle richieste mezzo/Home/tecnica.
- Le richieste fuori verticale vengono fermate con limite esplicito invece di sembrare supportate.
- Il report targa continua a usare l'artifact/PDF gia esistente ma con base dati piu prudente e canonica.

## Rischio modifica
- ELEVATO

## Moduli impattati
- IA interna NEXT
- Chat `/next/ia/interna`
- Reader mezzo/Home/tecnica della prima verticale

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

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
- La pagina contiene ancora pannelli secondari storici fuori prima verticale, ma il thread principale non li promuove piu.
- I domini esterni restano disponibili nel repo ma non devono essere riattivati nella chat senza nuovo audit.

## Build/Test eseguiti
- `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiVehicleDossierHookFacade.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
