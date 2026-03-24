# CHANGE REPORT - Reality check live minimo IA read-only

## Data
- 2026-03-23 18:33

## Tipo task
- audit
- sicurezza
- backend

## Obiettivo
- verificare in modo definitivo se il backend IA separato possa aprire davvero il primo bridge live read-only minimo su `storage/@mezzi_aziendali` e sul path esatto `librettoStoragePath`, oppure fermarsi in modo onesto sul fallback clone-seeded.

## File modificati
- package.json
- package-lock.json
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Riassunto modifiche
- Rafforzata la readiness del backend IA per distinguere package dichiarato da runtime davvero risolvibile nel checkout corrente.
- Riallineata la documentazione del backend IA al checkout corrente.
- Registrato che oggi il runtime del backend IA separato risolve `firebase-admin`, ma questo non basta ancora ad aprire il live minimo.
- Registrato che il bootstrap server-side dedicato supporta `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_JSON` e `FIREBASE_CONFIG`, ma nel processo corrente non risultano comunque credenziali Google server-side.
- Confermato che il fallback ufficiale resta il retrieval clone-seeded del `mezzo_dossier`; nessun live Firestore/Storage viene aperto.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Verdetto piu onesto e verificabile sul live minimo del backend IA separato.
- Nessun cambiamento runtime su madre, clone o flussi business.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- documentazione backend IA
- documentazione IA/NEXT/clone

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: credenziali Google server-side, runtime dedicato materializzato, `firestore.rules`, conflitto `storage.rules`

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
- Il live minimo resta bloccato anche se il boundary futuro e gia codificato.
- Aprire il bridge prima di chiudere credenziali/policy e prima di aprire l'access layer dedicato produrrebbe un boundary opaco e non verificabile.

## Build/Test eseguiti
- probe presenza env server-side senza stampa segreti -> `GOOGLE_APPLICATION_CREDENTIALS/FIREBASE_SERVICE_ACCOUNT_JSON/FIREBASE_CONFIG/GOOGLE_CLOUD_PROJECT/GCLOUD_PROJECT` tutti assenti
- `npm --prefix backend/internal-ai run firebase-readiness` -> OK (`firestoreReadOnly: not_ready`, `storageReadOnly: not_ready`)
- smoke test `probeInternalAiFirebaseAdminRuntime()` -> OK (`modulesReady: true`, `credentialMode: missing`, `canAttemptLiveRead: false`)

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
