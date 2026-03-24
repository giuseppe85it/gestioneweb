# CHANGE REPORT - Classificazione domini chat IA

## Data
- 2026-03-24 08:44

## Tipo task
- patch

## Obiettivo
- Rendere `/next/ia/interna` capace di riconoscere il dominio corretto della richiesta, mantenere forte la prima verticale `D01 + D10 + D02` e rispondere in modo utile ma prudente sugli altri domini del gestionale.

## File modificati
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-24_0844_classificazione-domini-chat-ia.md`
- `docs/continuity-reports/2026-03-24_0844_continuity_classificazione-domini-chat-ia.md`

## Riassunto modifiche
- Introdotta una classificazione prudente per i domini `D03`-`D09`, usando i nomi canonici dei domini e file/moduli NEXT realmente presenti.
- Mantenuto il comportamento forte della prima verticale `D01 + D10 + D02` gia consolidata nel task precedente.
- Riallineato il selettore output per usare `chat_structured` prudente sui domini non consolidati, invece di una semplice risposta breve di rifiuto.
- Migliorata la resa del thread mostrando dominio riconosciuto, affidabilita e formato output in modo sobrio.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- La chat ragiona per domini e non solo per schermate sparse.
- Le richieste fuori prima verticale non inventano report o incroci non consolidati.
- La pagina rende piu leggibile il tipo di risposta prodotta e il livello di affidabilita dichiarato.

## Rischio modifica
- ELEVATO

## Moduli impattati
- IA interna NEXT
- Chat `/next/ia/interna`
- Orchestrazione intent/output del thread IA

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
- La classificazione dominio-first non rende ancora deep-operativi i domini fuori prima verticale.
- Nel repo non emerge un file esplicitamente etichettato come report finale del Prompt 66 o del Prompt 68; il task usa i documenti canonici e i report del `2026-03-24` presenti nel repo.

## Build/Test eseguiti
- `npx eslint src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
