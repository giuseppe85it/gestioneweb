# CHANGE REPORT - Dependency map repo per IA interna NEXT

## Data
- 2026-03-26 13:11

## Tipo task
- patch

## Obiettivo
- rafforzare l'assistente `repo/flussi` della IA interna NEXT con una dependency map piu strutturale, cosi da rispondere meglio su file impattati, moduli collegati, route, layer, read model e punto corretto di integrazione.

## File modificati
- `backend/internal-ai/server/internal-ai-repo-understanding.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-26_1311_dependency-map-repo-ia-next.md`
- `docs/continuity-reports/2026-03-26_1311_continuity_dependency-map-repo-ia-next.md`

## Riassunto modifiche
- aggiunta nel backend IA separato una dependency map strutturale per 6 casi chiave, con domini, route, file UI, file domain/read-model, file backend IA, moduli a monte/a valle e note di perimetro;
- rese piu concrete le risposte deterministiche `repo_understanding` del backend, che ora distinguono esplicitamente route, file UI, read model, backend IA, lettori dominio, rischio impatto e punto di integrazione;
- riallineato il fallback locale dell'orchestratore sui prompt repo/flussi principali, cosi la struttura pratica resta coerente anche senza provider o adapter attivo;
- aggiornata la console `/next/ia/interna` per mostrare anche il conteggio e una vista sintetica della dependency map, senza redesign largo.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- la IA sa motivare meglio quali file leggere o toccare e distingue in modo piu chiaro madre, NEXT, backend IA e read model;
- i prompt bussola su rifornimenti, Dossier Mezzo, nuovo modulo, perimetro layer e nuova funzione IA diventano piu concreti e utili;
- nessuna scrittura business viene aperta e il boundary live-read resta chiuso.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- backend IA separato
- IA interna NEXT
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
- la dependency map resta metadata-driven e non sostituisce una analisi AST completa del runtime legacy;
- il glob `backend/internal-ai/*.js` non matcha file nel repo: per il lint reale serve `--no-error-on-unmatched-pattern`;
- il canale repo/flussi resta read-only e non autorizza patch automatiche del repository.

## Build/Test eseguiti
- `npx eslint src/next/internal-ai/*.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/*.js backend/internal-ai/*.js` -> KO tecnico per glob vuoto `backend/internal-ai/*.js`
- `npx eslint --no-error-on-unmatched-pattern src/next/internal-ai/*.ts src/next/NextInternalAiPage.tsx backend/internal-ai/server/*.js backend/internal-ai/*.js` -> OK
- `npm run build` -> OK
- `GET /internal-ai-backend/health` -> OK
- `POST /internal-ai-backend/orchestrator/chat` sui 5 prompt bussola -> OK, `intent=repo_understanding`, `status=completed`, `usedRealProvider=false`, sezioni strutturate presenti
- `POST /internal-ai-backend/retrieval/read` con `read_repo_understanding_snapshot` -> OK, `dependencyMaps=6`

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
