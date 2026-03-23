# CHANGE REPORT - Readiness Firebase read-only tipizzata per IA interna

## Data
- 2026-03-22 19:22

## Tipo task
- patch
- audit

## Obiettivo
- verificare se il backend IA separato possa gia aprire Firestore/Storage read-only in modo sicuro e, non essendo ancora dimostrabile, rendere espliciti prerequisiti e whitelist candidate senza attivare letture business.

## File modificati
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- backend/internal-ai/server/internal-ai-repo-understanding.js
- backend/internal-ai/src/internalAiServerRetrievalContracts.ts
- src/next/NextInternalAiPage.tsx
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- Centralizzata la readiness Firebase del backend IA separato in un modulo dedicato basato su evidenze reali del repo e dell'ambiente del processo.
- Estesi i contratti della snapshot repo/UI con prerequisiti condivisi e whitelist candidate non attive per Firestore e Storage.
- Aggiornata `/next/ia/interna` per mostrare in italiano blocchi, prerequisiti e perimetro candidate del futuro bridge read-only.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Migliora la trasparenza tecnica sul fatto che Firestore/Storage read-only lato server non sono ancora aperti.
- Prepara il passo successivo senza fingere un bridge business gia operativo.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- backend IA separato
- overview `/next/ia/interna`
- documentazione di stato IA/NEXT

## Contratti dati toccati?
- SI

## Punto aperto collegato?
- SI: policy Firestore/Storage effettive, credenziali server-side dedicate, governance del bridge Firebase read-only

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
- Il task NON apre un bridge Firebase/Storage business read-only reale.
- Le whitelist candidate (`storage/@mezzi_aziendali` e path esatto da `librettoStoragePath`) restano non attive finche non esistono adapter, credenziali e policy verificabili.
- `firestore.rules` assente e `storage.rules` confliggente restano bloccanti reali.

## Build/Test eseguiti
- node --check backend/internal-ai/server/internal-ai-firebase-readiness.js -> OK
- node --check backend/internal-ai/server/internal-ai-repo-understanding.js -> OK
- npx tsc -p backend/internal-ai/tsconfig.json --noEmit -> OK
- npx eslint src/next/NextInternalAiPage.tsx backend/internal-ai/src/internalAiServerRetrievalContracts.ts -> OK
- smoke test buildFirebaseReadinessSnapshot() -> OK
- smoke test POST /internal-ai-backend/retrieval/read con read_repo_understanding_snapshot -> OK
- npm run build -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
