# CHANGE REPORT - Osservatore runtime NEXT passivo e guida integrazione IA

## Data
- 2026-03-22 21:37

## Tipo task
- ui

## Obiettivo
- Aprire nel sottosistema IA interno una prima osservazione runtime reale ma non distruttiva della NEXT e una guida strutturale per suggerire dove integrare future funzioni nel gestionale.

## File modificati
- package.json
- package-lock.json
- backend/internal-ai/runtime-data/.gitignore
- backend/internal-ai/server/internal-ai-adapter.js
- backend/internal-ai/server/internal-ai-next-runtime-observer.js
- backend/internal-ai/server/internal-ai-repo-understanding.js
- backend/internal-ai/src/internalAiServerRetrievalContracts.ts
- scripts/internal-ai-observe-next-runtime.mjs
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internal-ai.css
- src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- Aggiunto un observer Playwright read-only per route `/next/*` whitelistate, con screenshot e DOM snapshot passivo salvati nel contenitore IA dedicato.
- Estesa la snapshot repo/UI del backend IA separato con `runtimeObserver` e `integrationGuidance`.
- Aggiornata `/next/ia/interna` per mostrare copertura runtime reale, screenshot riapribili e consigli su dove integrare modali, pagine, tab, card, bottoni o file.
- Mantenuto il perimetro sicuro: nessun click operativo, nessuna modifica alla madre, nessun bridge business live.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Migliora la capacita della nuova IA di vedere la NEXT quasi come l’utente, almeno sulle schermate osservate passivamente.
- Migliora la qualita dei suggerimenti di integrazione futura, perche la IA ha ora mapping concreto modulo/superficie/file.
- Nessun impatto su dati business, Firestore/Storage live o runtime legacy.

## Rischio modifica
- ELEVATO

## Moduli impattati
- IA interna NEXT
- backend IA separato
- repo understanding controllato
- tooling runtime NEXT

## Contratti dati toccati?
- SI

## Punto aperto collegato?
- SI: policy Firestore/Storage effettive e futuro bridge Firebase/Storage read-only nel backend IA separato

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
- SI

## Rischi / attenzione
- La copertura runtime resta intenzionalmente parziale e non va raccontata come visione completa della NEXT.
- Le route dinamiche `Dossier` e `Analisi Economica` non sono garantite finche non emergono via link visibili senza click distruttivi.
- Playwright e aggiunto solo come observer passivo; non deve diventare un canale di automazione applicativa libera.

## Build/Test eseguiti
- node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js -> OK
- node --check scripts/internal-ai-observe-next-runtime.mjs -> OK
- node --check backend/internal-ai/server/internal-ai-adapter.js -> OK
- npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiServerRepoUnderstandingClient.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs -> OK
- npx tsc -p backend/internal-ai/tsconfig.json --noEmit -> OK
- npm run internal-ai:observe-next -> OK
- smoke test read_repo_understanding_snapshot + asset screenshot su adapter locale -> OK
- npm run build -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
