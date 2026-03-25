# CHANGE REPORT - Assistente repo, flussi e integrazione per sviluppo interno

## Data
- 2026-03-25 15:45

## Tipo task
- patch

## Obiettivo
- rafforzare la IA interna NEXT come assistente tecnico interno su repo, flussi reali, moduli collegati, file impattati e punto corretto di integrazione di nuovi moduli o capability IA.

## File modificati
- `backend/internal-ai/server/internal-ai-repo-understanding.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-25_1545_assistente-repo-flussi-sviluppo-interno-ia-next.md`
- `docs/continuity-reports/2026-03-25_1545_continuity_assistente-repo-flussi-sviluppo-interno-ia-next.md`

## Riassunto modifiche
- esteso il repo understanding server-side con layer architetturali espliciti e playbook operativi su flussi, impatti e integrazione;
- aggiunta risposta deterministica lato backend per le richieste repo/flussi, indipendente dal provider reale;
- ampliato l'orchestrator locale con nuovi casi `repo_understanding` su flusso rifornimenti, impatto Dossier Mezzo, nuovo modulo, perimetri logici e integrazione di funzioni IA;
- corretto il routing locale per dare precedenza ai prompt repo/flussi rispetto al motore business unificato;
- aggiornata la UI della console IA con etichetta intent piu chiara, copy piu esplicito e 5 prompt bussola nei suggerimenti rapidi.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- la IA interna distingue meglio madre / NEXT / backend IA / domain-read-model / renderer e restituisce output tecnici piu concreti;
- le richieste su moduli collegati, file impattati e inserimento di nuovi moduli diventano operative senza riaprire il perimetro business o la madre.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- IA interna NEXT
- backend IA separato
- repo understanding / orchestrazione chat

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

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
- la capability repo/flussi resta guidata da playbook curati e non sostituisce una analisi completa di ogni edge case del runtime legacy;
- la UI preview locale del runner non e risultata stabile per lo smoke browser end-to-end, quindi la verifica finale e stata chiusa sul canale reale server-side `orchestrator.chat`.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js` -> OK
- smoke test reali su `http://127.0.0.1:4310/internal-ai-backend/orchestrator/chat` con i 5 prompt bussola -> OK, `intent=repo_understanding`, sezioni complete, `usedRealProvider=false`

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
