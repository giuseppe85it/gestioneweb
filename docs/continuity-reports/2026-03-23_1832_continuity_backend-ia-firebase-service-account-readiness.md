# CONTINUITY REPORT - Backend IA / credenziali Firebase server-side

## Contesto generale
- Il progetto resta nella fase clone NEXT `read-only` con madre intoccabile.
- Il backend IA separato resta il solo perimetro ammesso per readiness e futuri bridge read-only stretti.

## Modulo/area su cui si stava lavorando
- backend IA separato
- readiness Firebase/Storage
- credenziali server-side

## Stato attuale
- Stabile: `firebase-admin` risolvibile dal runtime del backend IA.
- Stabile: supporto codice per `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_CONFIG`.
- Stabile: `credentialMode: missing` nel processo corrente.
- Stabile: Firestore `not_ready`, Storage `not_ready`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- package backend IA dedicato
- bootstrap Firebase Admin separato
- readiness CLI locale
- retrieval clone-seeded ufficiale su `mezzo_dossier`

## Prossimo step di migrazione
- Aprire un vero bridge live solo quando esistono insieme:
  - credenziale server-side Google reale nel processo;
  - `firestore.rules` versionato o policy equivalente verificabile;
  - chiarimento deploy-safe del conflitto `storage.rules`;
  - access layer read-only dedicato con whitelist runtime stretta.

## Contratti dati coinvolti
- boundary futuro Firestore: `storage/@mezzi_aziendali`
- boundary futuro Storage: path esatto `librettoStoragePath`
- nessun contratto business live attivato

## Ultime modifiche eseguite
- aggiunto supporto server-side a `FIREBASE_SERVICE_ACCOUNT_JSON`;
- aggiornata la readiness per riflettere i tre canali credenziali supportati;
- confermato che il fallback ufficiale del dominio `mezzo_dossier` resta clone-seeded.

## File coinvolti
- backend/internal-ai/server/internal-ai-firebase-admin.js
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- backend/internal-ai/src/internalAiServerPersistenceContracts.ts
- backend/internal-ai/README.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/change-reports/2026-03-23_1832_backend-ia-firebase-service-account-readiness.md

## Decisioni gia prese
- Nessun bridge live viene aperto in questo task.
- Nessuna scrittura business.
- Nessun backend legacy come canale canonico.
- Nessuna modifica alla madre.

## Vincoli da non rompere
- niente query larghe Firestore
- niente `listAll` o prefix scan su Storage
- niente segreti lato client
- niente uso live di domini fuori `storage/@mezzi_aziendali` e `librettoStoragePath`

## Rischi aperti
- credenziali server-side Google assenti nel processo corrente
- `firestore.rules` assente dal repo
- `storage.rules` deny-all in conflitto con l'uso legacy
- access layer read-only dedicato ancora mancante

## Prossimo passo consigliato
- Restare su retrieval clone-seeded nel `mezzo_dossier` finche non si chiudono insieme identity, policy e adapter live stretto.

## Cosa NON fare nel prossimo task
- Non usare `functions/*` o `functions-schede/*` come backend canonico.
- Non aprire live Firestore/Storage solo perche il codice ora supporta un canale credenziali in piu.
- Non raccontare il bridge minimo come attivo finche `credentialMode` resta `missing`.

## Commit/hash rilevanti
- NON ESEGUITO
