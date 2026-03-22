# CHANGE REPORT - Report autista IA interna read-only

## Data
- 2026-03-13 11:59

## Tipo task
- patch

## Obiettivo
- Estendere il sottosistema IA interno del clone con ricerca guidata autisti reali, preview report autista read-only e distinzione chiara dal flusso report targa.

## File modificati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiTracking.ts
- src/next/internal-ai/internalAiMockRepository.ts
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- src/next/internal-ai/internalAiDriverLookup.ts
- src/next/internal-ai/internalAiDriverReportFacade.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Riassunto modifiche
- Aggiunto lookup autisti read-only basato su `storage/@colleghi` con autosuggest guidato e contesto minimo sui mezzi associati.
- Introdotto un nuovo facade `report autista` che legge solo layer NEXT gia esistenti per anagrafica, mezzi associati, segnali operativi D10 e rifornimenti D04.
- Estesi UI, artifact locali, memoria recente, tracking e chat mock per gestire anche il nuovo flusso autista senza rompere il report targa.
- Aggiornati checklist IA, stato avanzamento, stato migrazione NEXT e registro modifiche clone.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il modulo `/next/ia/interna` supporta ora sia `report targa` sia `report autista`, con flussi distinti e tutti i testi visibili in italiano.
- Memoria locale, archivio artifact e chat mock del sottosistema IA distinguono ora anche ricerche e preview di tipo autista.
- Nessun impatto sui dataset business o sui moduli madre.

## Rischio modifica
- NORMALE

## Moduli impattati
- Sottosistema IA interna clone `/next/ia/interna*`
- Layer documentali di stato e tracciabilita NEXT/clone

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI: Stream eventi autisti canonico definitivo

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
- Il report autista usa il dominio autisti solo tramite layer D10 gia esistente e con limiti espliciti; non rende canonico il dominio D03.
- Le associazioni autista -> mezzo restano certe solo su `autistaId`; il match su nome dichiarato e marcato come parziale.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiDriverLookup.ts src/next/internal-ai/internalAiDriverReportFacade.ts src/next/internal-ai/internalAiVehicleReportFacade.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
