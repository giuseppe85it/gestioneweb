# CHANGE REPORT - Supporto FIREBASE_SERVICE_ACCOUNT_JSON nel backend IA

## Data
- 2026-03-23 18:32

## Tipo task
- patch
- sicurezza
- readiness

## Obiettivo
- completare il supporto server-side ai canali credenziali Firebase Admin del backend IA separato e verificare in modo onesto se il primo bridge live read-only sia davvero apribile.

## File modificati
- backend/internal-ai/server/internal-ai-firebase-admin.js
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- backend/internal-ai/src/internalAiServerPersistenceContracts.ts
- backend/internal-ai/README.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- Esteso il backend IA separato a riconoscere anche `FIREBASE_SERVICE_ACCOUNT_JSON`, oltre a `GOOGLE_APPLICATION_CREDENTIALS` e `FIREBASE_CONFIG`.
- Aggiornata la readiness per dichiarare in modo esplicito il nuovo canale credenziali supportato senza esporre segreti.
- Aggiornati i documenti di stato per registrare che il live minimo resta non apribile nel checkout corrente.

## Impatti attesi
- Il backend IA puo essere configurato lato server con un ulteriore canale standard senza hardcoding o segreti lato client.
- Il dominio `mezzo_dossier` non cambia canale operativo: il fallback ufficiale resta il retrieval clone-seeded gia governato.
- Nessuna lettura business live viene aperta e nessuna scrittura business viene attivata.

## Rischio modifica
- EXTRA ELEVATO

## Rischi / attenzione
- Il task NON apre un bridge Firestore live o Storage live.
- Nel processo corrente non risultano `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_JSON` o `FIREBASE_CONFIG`.
- `firestore.rules` resta assente dal repo e `storage.rules` resta deny-all in conflitto con l'uso legacy.
- Manca ancora un access layer read-only dedicato per Firestore/Storage nel backend IA.

## Build/Test eseguiti
- node --check backend/internal-ai/server/internal-ai-firebase-admin.js -> OK
- node --check backend/internal-ai/server/internal-ai-firebase-readiness.js -> OK
- npx tsc -p backend/internal-ai/tsconfig.json --noEmit -> OK
- npm --prefix backend/internal-ai run firebase-readiness -> OK
- smoke test probeInternalAiFirebaseAdminRuntime() -> OK (`modulesReady: true`, `credentialMode: missing`, `canAttemptLiveRead: false`)

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
