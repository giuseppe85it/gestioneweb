# CHANGE REPORT - Chat reale controllata e repo/UI understanding IA interna

## Data
- 2026-03-22 15:33

## Tipo task
- patch

## Obiettivo
- Estendere l'uso reale di OpenAI dalla sola sintesi report alla chat interna controllata della nuova IA e aprire un primo livello read-only di comprensione repository/UI, senza scritture business e senza backend legacy canonici.

## File modificati
- backend/internal-ai/README.md
- backend/internal-ai/server/internal-ai-adapter.js
- backend/internal-ai/server/internal-ai-repo-understanding.js
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internalAiChatOrchestratorBridge.ts
- src/next/internal-ai/internalAiContracts.ts
- src/next/internal-ai/internalAiServerChatClient.ts
- src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts
- src/next/internal-ai/internalAiLibrettoPreviewBridge.ts
- src/next/internal-ai/internalAiTypes.ts
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/change-reports/2026-03-22_1533_patch_chat-reale-repo-understanding-ia.md
- docs/continuity-reports/2026-03-22_1533_continuity_chat-reale-repo-understanding-ia.md

## Riassunto modifiche
- Portata la chat interna su `orchestrator.chat` server-side reale, con fallback locale clone-safe esplicito.
- Aperto il primo retrieval read-only di comprensione repository/UI tramite snapshot curata `read_repo_understanding_snapshot`.
- Aggiunto nell'overview di `/next/ia/interna` un pannello che espone perimetro, fonti e limiti della comprensione repo/UI.
- Aggiornata la documentazione IA/NEXT/stato progetto e creati i report di tracciatura del task.
- Rifinito il bootstrap dell'adapter per accettare anche alias `host`/`port` nello start programmatico usato nei test.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- La chat interna puo usare davvero OpenAI solo lato server per spiegare report e perimetro repo/UI, senza scritture business automatiche.
- Il clone IA dispone di un primo livello strutturato di comprensione della UI e del repository, utile per spiegazioni e suggerimenti controllati.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- backend IA separato
- NEXT `/next/ia/interna`
- documentazione architettura/stato IA

## Contratti dati toccati?
- PARZIALE

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
- SI

## Rischi / attenzione
- La comprensione repo/UI e curata e parziale, non una scansione completa del repository.
- La shell locale puo non ereditare automaticamente `OPENAI_API_KEY` a livello utente Windows e richiedere bootstrap esplicito del processo server-side.

## Build/Test eseguiti
- `npx tsc -p backend/internal-ai/tsconfig.json --noEmit` -> OK
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiServerChatClient.ts src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiLibrettoPreviewBridge.ts` -> OK
- `node --check backend/internal-ai/server/internal-ai-adapter.js` -> OK
- smoke test adapter `retrieval.read` + `orchestrator.chat` senza segreto nel processo server-side -> OK
- smoke test reale `health` + `retrieval.read(read_repo_understanding_snapshot)` + `orchestrator.chat` repo/UI-aware + `orchestrator.chat` con `reportContext` su processo server-side dedicato con `OPENAI_API_KEY` -> OK
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
