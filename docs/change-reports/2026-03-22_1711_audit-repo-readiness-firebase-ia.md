# CHANGE REPORT - Audit repo understanding esteso e readiness Firebase IA

## Data
- 2026-03-22 17:11

## Tipo task
- patch
- audit

## Obiettivo
- verificare cosa manca davvero per far leggere alla nuova IA piu codice, CSS e UI del repo e chiarire, senza inventare, se Firestore/Storage read-only lato server siano gia apribili nel backend IA separato.

## File modificati
- backend/internal-ai/server/internal-ai-repo-understanding.js
- backend/internal-ai/server/internal-ai-adapter.js
- backend/internal-ai/server/internal-ai-persistence.js
- backend/internal-ai/src/internalAiServerRetrievalContracts.ts
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiContracts.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- Estesa la snapshot repo/UI del backend IA separato con indice filesystem controllato di codice, componenti, route-like file e CSS collegati.
- Aggiunte relazioni curate madre vs NEXT e audit di readiness Firestore/Storage read-only basato su evidenze reali del repo.
- Estesa la overview di `/next/ia/interna` per mostrare in italiano indice repo, relazioni di perimetro e blocchi reali prima di future letture business lato server.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Migliora la comprensione controllata del repo usabile dalla chat e dalla UI senza trasformarla in scansione indiscriminata.
- Chiarisce in modo verificato che Firestore/Storage read-only lato server non sono ancora pronti nel backend IA separato.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- IA interna NEXT
- backend IA separato
- pannello repo/UI understanding

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI: policy Firestore/Storage effettive e governance endpoint IA/PDF

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
- L'indice repo resta metadata-driven e non copre ancora AST, dipendenze runtime o tutte le relazioni tra moduli.
- Firestore/Storage read-only lato server restano fuori: mancano access layer dedicato, credenziali server-side dimostrate e policy verificabili.

## Build/Test eseguiti
- node --check backend/internal-ai/server/internal-ai-repo-understanding.js -> OK
- node --check backend/internal-ai/server/internal-ai-adapter.js -> OK
- npx tsc -p backend/internal-ai/tsconfig.json --noEmit -> OK
- npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiContracts.ts src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-adapter.js backend/internal-ai/server/internal-ai-repo-understanding.js -> OK
- smoke test buildRepoUnderstandingSnapshot() -> OK
- smoke test POST /internal-ai-backend/retrieval/read con read_repo_understanding_snapshot -> OK
- npm run build -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
