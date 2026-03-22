# CHANGE REPORT - Report combinato mezzo + autista + periodo IA interna

## Data
- 2026-03-13 13:04

## Tipo task
- patch

## Obiettivo
- Aggiungere nel sottosistema IA interna del clone una preview combinata read-only che unisca mezzo reale, autista reale e periodo, mantenendo separati i report singoli e dichiarando in modo trasparente l'affidabilita del legame mezzo-autista.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiCombinedReportFacade.ts`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-13_1304_patch_report-combinato-mezzo-autista-periodo-ia-interna.md`
- `docs/continuity-reports/2026-03-13_1304_continuity_report-combinato-ia-interna.md`

## Riassunto modifiche
- Introdotto un nuovo facade `internalAiCombinedReportFacade` che riusa i report singoli mezzo/autista gia esistenti e aggiunge solo il matching read-only sui layer NEXT gia verificati (`D01`, `D10`, `D04`).
- Estesi i tipi locali del sottosistema IA con `reportType = combinato`, preview combinata, intent chat combinato e tracking/memoria per ultime coppie mezzo/autista.
- Aggiornata la UI `/next/ia/interna` con un blocco dedicato per la preview combinata, distinto dai due flussi singoli e alimentato dalle stesse selezioni guidate di mezzo, autista e periodo.
- Aggiornati archivio artifact locale e tracking locale per salvare anche report combinati e relativo periodo.
- Riallineata la chat mock con supporto minimo a richieste combinate mezzo + autista.
- Aggiornati checklist, stato avanzamento IA, stato migrazione NEXT e registro modifiche clone.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Il modulo IA interno puo ora ragionare su mezzo + autista + periodo senza uscire dal perimetro read-only del clone.
- L'utente vede chiaramente se il legame mezzo-autista e forte, plausibile o non dimostrabile, evitando inferenze presentate come verita.

## Rischio modifica
- NORMALE

## Moduli impattati
- sottosistema IA interna `/next/ia/interna*`
- tracking locale IA
- archivio artifact locale IA
- chat mock IA interna

## Contratti dati toccati?
- SI

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
- Il legame mezzo-autista resta forte solo con `autistaId` sul mezzo; tutti gli altri casi sono dichiarati come plausibili o non dimostrabili.
- La qualita del report combinato dipende dalla copertura reale dei layer D10 e D04 nel periodo richiesto.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiTracking.ts src/next/internal-ai/internalAiMockRepository.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiCombinedReportFacade.ts` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
