# CHANGE REPORT - Governance package backend IA e readiness live

## Data
- 2026-03-23 09:42

## Tipo task
- patch
- sicurezza
- backend

## Obiettivo
- preparare davvero il backend IA separato a ospitare un futuro bridge Firebase/Storage read-only serio, senza aprire il live finche credenziali Google e policy restano non verificabili.

## File modificati
- backend/internal-ai/package.json
- backend/internal-ai/server/internal-ai-firebase-admin.js
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- backend/internal-ai/server/internal-ai-firebase-readiness-cli.js
- backend/internal-ai/server/internal-ai-adapter.js
- backend/internal-ai/README.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- Il package `backend/internal-ai` governa ora le dipendenze runtime effettive dell'adapter server-side, incluso `firebase-admin`.
- La readiness Firebase/Storage del backend IA distingue in modo esplicito tra package dichiarato, moduli runtime risolti, credenziali server-side e rules/policy versionate.
- L'endpoint `GET /internal-ai-backend/health` espone anche una sintesi read-only di readiness Firebase e della probe runtime `firebase-admin`.
- E stata aggiunta una CLI locale di readiness che non legge Firestore o Storage business.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il backend IA separato e piu autonomo e meno ambiguo rispetto al runtime root o ai package legacy.
- Il live bridge resta correttamente chiuso finche mancano credenziali Google server-side e policy Firestore/Storage verificabili.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- backend IA separato
- readiness Firebase/Storage
- health endpoint server-side
- documentazione IA/NEXT/clone

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI: credenziali server-side Google, `firestore.rules`, conflitto `storage.rules`

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- IA interna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- Il task NON apre alcun bridge Firestore business live.
- Il task NON apre alcun bridge Storage/file live.
- `firebase.json`, `firestore.rules` e `storage.rules` non vengono toccati perche il repo non consente ancora un aggiornamento deploy-safe e verificabile.

## Build/Test eseguiti
- npm install --prefix backend/internal-ai --no-package-lock -> OK
- npm --prefix backend/internal-ai run firebase-readiness -> OK
- node -e import probeInternalAiFirebaseAdminRuntime -> OK
- node --check backend/internal-ai/server/internal-ai-firebase-admin.js -> OK
- node --check backend/internal-ai/server/internal-ai-firebase-readiness.js -> OK
- node --check backend/internal-ai/server/internal-ai-firebase-readiness-cli.js -> OK
- node --check backend/internal-ai/server/internal-ai-adapter.js -> OK
- npx eslint backend/internal-ai/server/internal-ai-firebase-admin.js backend/internal-ai/server/internal-ai-firebase-readiness.js backend/internal-ai/server/internal-ai-firebase-readiness-cli.js backend/internal-ai/server/internal-ai-adapter.js -> OK
- smoke test startInternalAiAdapterServer({ port: 4317, host: '127.0.0.1' }) + GET /internal-ai-backend/health -> firestore: not_ready, storage: not_ready, adminRuntimeReady: true

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
