# CHANGE REPORT - Capability canonica stato operativo mezzo

## Data
- 2026-03-24 09:15

## Tipo task
- patch

## Obiettivo
- Introdurre e rendere prioritaria la capability clone-only `stato_operativo_mezzo`, usando solo `D01 + D10 + D02` come fonti canoniche e mantenendo il `report targa` come percorso distinto e secondario.

## File modificati
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-24_0915_capability-canonica-stato-operativo-mezzo.md`
- `docs/continuity-reports/2026-03-24_0915_continuity_capability-canonica-stato-operativo-mezzo.md`

## Riassunto modifiche
- Inserito un routing prioritario `stato_operativo_mezzo` per richieste di stato mezzo/targa.
- La capability compone direttamente solo i reader canonici `readNextMezzoByTarga`, `readNextStatoOperativoSnapshot` e `readNextMezzoOperativitaTecnicaSnapshot`.
- L'output e sempre `chat_structured` con blocchi leggibili e limiti espliciti.
- Il `report targa` continua a esistere ma come capability distinta e secondaria.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- La prima verticale ha ora una capability centrale piccola e spiegabile.
- Il thread distingue meglio tra stato operativo mezzo e report PDF.
- I limiti D10 vengono dichiarati quando il segnale non e pienamente collegabile alla targa.

## Rischio modifica
- ELEVATO

## Moduli impattati
- IA interna NEXT
- Chat `/next/ia/interna`
- Catalogo capability mezzo-centriche

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
- Il collegamento D10 resta prudente se alert/focus/revisione non risultano associabili in modo pienamente affidabile alla targa.
- Il task non riapre i domini `D03-D09` e non deve essere letto come estensione del perimetro IA oltre la prima verticale.

## Build/Test eseguiti
- `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts src/next/NextInternalAiPage.tsx` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
