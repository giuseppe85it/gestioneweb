# CHANGE REPORT - Filtri temporali report IA interna read-only

## Data
- 2026-03-13 12:40

## Tipo task
- patch

## Obiettivo
- Estendere i report read-only del sottosistema IA interno con un contesto periodo condiviso, applicato in modo sicuro solo alle sezioni che espongono date leggibili nei layer NEXT gia usati dal clone.

## File modificati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiTracking.ts
- src/next/internal-ai/internalAiMockRepository.ts
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- src/next/internal-ai/internalAiDriverReportFacade.ts
- src/next/internal-ai/internalAiReportPeriod.ts
- src/next/internal-ai/internal-ai.css
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Riassunto modifiche
- Introdotto un modello periodo riusabile con preset rapidi, intervallo personalizzato e metadati di applicazione.
- Estesi i facade `report targa` e `report autista` per filtrare solo le sezioni con data leggibile e segnare in preview quelle fuori filtro o non abbastanza affidabili.
- Aggiornata la UI `/next/ia/interna` con blocco periodo condiviso, badge periodo in preview, note di applicazione e integrazione con artifact/memoria locale.
- Riallineata la chat mock per supportare prompt con periodo esplicito e, se assente, riusare il periodo attivo in UI.
- Aggiornati checklist IA, stato avanzamento, stato migrazione NEXT e registro clone.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il modulo IA interno produce report targa/autista piu utili, con periodo attivo chiaro e filtraggio solo dove tecnicamente corretto.
- Memoria recente e archivio artifact locali tracciano ora anche il periodo usato.
- Nessun impatto sui dataset business, sulla madre o sui backend IA legacy.

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
- Il filtro periodo resta intenzionalmente selettivo: identita anagrafiche, mezzi associati e alcuni blocchi di contesto restano fuori filtro per non introdurre coerenza temporale finta.
- Nel report autista il periodo sui segnali operativi dipende ancora dal layer D10 gia esistente e non canonizza il dominio D03.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiVehicleReportFacade.ts src/next/internal-ai/internalAiDriverReportFacade.ts src/next/internal-ai/internalAiReportPeriod.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
