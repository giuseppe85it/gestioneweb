# CONTINUITY REPORT - Readiness Firebase read-only IA interna

## Contesto generale
- Il progetto resta nella fase clone read-only della NEXT con madre intoccabile.
- Il sottosistema IA interno vive sotto `/next/ia/interna*` con backend separato in `backend/internal-ai/*`.
- Chat reale controllata, artifact IA dedicati, provider server-side e repo understanding sono gia attivi; Firestore/Storage business read-only lato server non lo sono ancora.

## Modulo/area su cui si stava lavorando
- backend IA separato
- pannello repo/UI understanding di `/next/ia/interna`
- readiness Firebase read-only

## Stato attuale
- Esiste ora un modulo dedicato `backend/internal-ai/server/internal-ai-firebase-readiness.js`.
- La snapshot repo/UI include:
  - prerequisiti condivisi del futuro bridge Firebase read-only;
  - whitelist candidate non attive per Firestore e Storage;
  - blocchi reali che impediscono oggi l'apertura sicura del bridge business read-only.
- La UI `/next/ia/interna` mostra tutto in italiano dentro `Comprensione controllata repo e UI`.

## Cosa e stato verificato
- `firebase-admin` e governato solo nei runtime legacy `functions/*` e `functions-schede/*`, non dal backend IA separato root.
- `backend/internal-ai` non ha ancora un proprio `package.json`.
- `firestore.rules` non esiste nel repo.
- `storage.rules` esiste ma blocca tutto, in tensione con l'uso legacy esteso di Storage.
- Nel processo corrente non risultano variabili dedicate per credenziale/identita Firebase server-side del backend IA separato.

## Whitelist candidate dichiarate ma NON attive
- Firestore: solo documento `storage/@mezzi_aziendali`
- Storage: solo path esatto ricavato da `librettoStoragePath` nel bucket `gestionemanutenzione-934ef.firebasestorage.app`

## Cosa resta fuori perimetro
- qualunque lettura diretta Firestore business lato server
- qualunque lettura diretta Storage business lato server
- query/scansioni libere di collection o bucket
- `listAll`, prefix scan, upload, delete
- qualunque riuso del backend legacy come canale canonico
- qualunque modifica della madre

## Prossimo passo consigliato
1. creare un vero adapter Firebase read-only in `backend/internal-ai/*`
2. governare `firebase-admin` dal backend IA separato con package proprio
3. definire credenziale server-side dedicata e verificabile per il deploy target
4. versionare o chiarire le policy Firestore effettive
5. risolvere il conflitto tra `storage.rules` versionato e uso legacy reale prima di aprire Storage read-only

## Verifiche eseguite
- node --check backend/internal-ai/server/internal-ai-firebase-readiness.js -> OK
- node --check backend/internal-ai/server/internal-ai-repo-understanding.js -> OK
- npx tsc -p backend/internal-ai/tsconfig.json --noEmit -> OK
- npx eslint src/next/NextInternalAiPage.tsx backend/internal-ai/src/internalAiServerRetrievalContracts.ts -> OK
- smoke test buildFirebaseReadinessSnapshot() -> OK
- smoke test POST /internal-ai-backend/retrieval/read con read_repo_understanding_snapshot -> OK
- npm run build -> OK

## Rischi residui
- Alto rischio di introdurre un bridge Firebase opaco se il passo successivo salta la governance di credenziali e policy.
- La UI ora e piu chiara, ma il bridge vero non e ancora aperto: non va raccontato come gia attivo.
