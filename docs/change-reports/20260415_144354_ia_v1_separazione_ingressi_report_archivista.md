# CHANGE REPORT

- Timestamp: `2026-04-15 14:43:54`
- Task: `PROMPT 20`
- Titolo: `IA V1 - separazione ingressi Report / Archivista`

## Obiettivo
- separare davvero nel runtime NEXT la parte `IA Report` dalla nuova entrata `Archivista documenti`
- creare una nuova route pulita `/next/ia/archivista`
- mantenere `/next/ia/interna` compatibile, ma riposizionata come area report/chat
- non toccare backend, functions, api, barrier, writer business o madre

## File runtime toccati
- `src/App.tsx`
- `src/next/components/HomeInternalAiLauncher.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `src/next/NextIAArchivistaPage.tsx`

## File documentali toccati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/*`

## Cosa e stato fatto davvero
- aggiunta la route `/next/ia/archivista`
- aggiunto l'alias leggibile `/next/ia/report`
- creata `NextIAArchivistaPage.tsx` come pagina non chat, guidata, con scelta `Tipo`, `Contesto`, upload e `Analizza documento`
- riscritto `HomeInternalAiLauncher` per mostrare due strumenti distinti dalla Home
- riallineata `NextHomePage` per spiegare la presenza di due strumenti
- riposizionata `NextInternalAiPage` come area report/chat, con callout esplicito verso l'Archivista
- aggiunte le classi CSS necessarie a separazione launcher, callout report e nuova pagina Archivista

## Vincoli rispettati
- nessuna modifica a `backend/*`
- nessuna modifica a `functions/*`
- nessuna modifica a `api/*`
- nessuna modifica a `firestore.rules` o `storage.rules`
- nessuna modifica a `src/utils/cloneWriteBarrier.ts`
- nessun nuovo writer business
- nessun refactor largo

## Verifiche eseguite
- `npx eslint src/App.tsx src/next/components/HomeInternalAiLauncher.tsx src/next/NextInternalAiPage.tsx src/next/NextHomePage.tsx src/next/NextIAArchivistaPage.tsx` -> `OK`
- `npm run build` -> `OK`

## Stato onesto finale
- separazione visibile IA 1 / IA 2: `FATTO`
- nuova forma prodotto coerente con spec guida: `FATTO`
- analisi guidata profonda Archivista: `NON FATTO`
- review finale Archivista: `NON FATTO`
- scritture business Archivista: `NON FATTO`

## Rischi residui
- `NextInternalAiPage` conserva ancora i flussi documentali tecnici preesistenti come supporto allegati temporaneo
- `NextIAArchivistaPage` in questa patch e volutamente una shell credibile, non ancora l'intera V1 profonda
