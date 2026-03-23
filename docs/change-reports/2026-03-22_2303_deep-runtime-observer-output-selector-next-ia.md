# CHANGE REPORT - Deep runtime observer NEXT e selettore formato output IA

## Data
- 2026-03-22 23:03

## Tipo task
- runtime

## Obiettivo
- Portare la nuova IA a una comprensione runtime della NEXT molto piu vicina all'utente reale, aggiungendo stati whitelist-safe e route dinamiche osservate, e introdurre una logica piu intelligente e trasparente di scelta del formato output e della proposta di integrazione.

## File modificati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiOutputSelector.ts
- src/next/internal-ai/internal-ai.css
- backend/internal-ai/src/internalAiServerRetrievalContracts.ts
- backend/internal-ai/server/internal-ai-next-runtime-observer.js
- backend/internal-ai/server/internal-ai-repo-understanding.js
- backend/internal-ai/server/internal-ai-adapter.js
- scripts/internal-ai-observe-next-runtime.mjs
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- Esteso l'osservatore runtime NEXT:
  - route figlie `IA interna` osservate direttamente;
  - route dinamiche dossier/analisi economica/gomme/rifornimenti risolte in modo governato;
  - stati read-only whitelist-safe su `Acquisti`;
  - struttura runtime piu ricca con `coverageLevel`, `surfaceEntries` e `stateObservations`.
- Introdotto un selettore formato output lato pagina IA che usa prompt, risultato e contesto recente della sessione per scegliere tra:
  - risposta breve in chat;
  - analisi strutturata in chat;
  - report PDF;
  - proposta di integrazione NEXT;
  - richiesta di conferma per integrazione stabile.
- Aggiornata `/next/ia/interna` per mostrare:
  - formato scelto e motivo della scelta;
  - osservazione runtime con route, stati, superfici e screenshot;
  - guida integrazione piu motivata con superficie primaria, alternative, confidenza, evidenze runtime e anti-pattern.
- Rafforzato il refresh server-side delle snapshot repo/UI per evitare il riuso di snapshot vecchie prive dei nuovi campi.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- La nuova IA vede la NEXT in modo piu profondo ma sempre nel perimetro read-only.
- La nuova IA sa motivare meglio se rispondere in chat, aprire un report PDF o proporre un punto di integrazione.
- Nessun impatto sulla madre, nessuna scrittura business e nessun bridge Firebase/Storage live attivato.

## Rischio modifica
- ELEVATO

## Moduli impattati
- IA interna NEXT
- backend IA separato
- observer runtime NEXT
- guida integrazione UI/flow/file

## Contratti dati toccati?
- SI

## Punto aperto collegato?
- SI: copertura runtime ancora non totale e bridge Firestore/Storage business read-only ancora non attivo

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
- La copertura runtime e piu profonda ma non e ancora completa: resta limitata a route e stati whitelist-safe.
- Il selettore formato output non deve essere raccontato come autonomia di modifica della NEXT: formula solo output o proposta, mai patch strutturali.
- Firestore/Storage business read-only lato server restano fuori perimetro.

## Build/Test eseguiti
- node --check backend/internal-ai/server/internal-ai-next-runtime-observer.js -> OK
- node --check scripts/internal-ai-observe-next-runtime.mjs -> OK
- node --check backend/internal-ai/server/internal-ai-repo-understanding.js -> OK
- node --check backend/internal-ai/server/internal-ai-adapter.js -> OK
- npm run internal-ai:observe-next -> OK
- rebuild snapshot repo/UI server-side -> OK
- smoke test `retrieval.read` -> `routeCount = 19`, `stateCount = 4`, asset screenshot servito -> OK
- npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internalAiTypes.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/internal-ai/internalAiContracts.ts backend/internal-ai/src/internalAiServerRetrievalContracts.ts backend/internal-ai/server/internal-ai-next-runtime-observer.js backend/internal-ai/server/internal-ai-repo-understanding.js backend/internal-ai/server/internal-ai-adapter.js scripts/internal-ai-observe-next-runtime.mjs -> OK
- npx tsc -p backend/internal-ai/tsconfig.json --noEmit -> OK
- npm run build -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
