# CONTINUITY REPORT - Governance package backend IA e readiness live

## Contesto generale
- Il progetto resta nella fase clone read-only della NEXT con madre intoccabile e sottosistema IA interno isolato sotto `/next/ia/interna*`.
- Il backend IA separato ha gia adapter server-side, retrieval clone-seeded, hook mezzo-centrico governato e boundary futuro stretto per il primo live bridge, ma nessun bridge Firebase/Storage business attivo.

## Modulo/area su cui si stava lavorando
- package `backend/internal-ai`
- readiness Firebase/Storage
- health endpoint server-side

## Stato attuale
- Stabile:
  - package backend IA con dipendenze runtime governate;
  - probe locale `firebase-admin` nel solo perimetro backend IA;
  - snapshot readiness ripetibile via CLI locale;
  - fallback ufficiale sul retrieval clone-seeded del `mezzo_dossier`.
- Bloccato:
  - live Firestore read-only;
  - live Storage/file read-only.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- package dedicato backend IA
- adapter server-side mock-safe
- readiness Firebase/Storage
- boundary futuro machine-readable
- hook mezzo-centrico Dossier

## Prossimo step di migrazione
- Aprire un vero bridge live solo quando esistono insieme:
  - credenziale Google server-side dedicata al backend IA;
  - `firestore.rules` versionato o evidenza equivalente delle policy effettive;
  - chiarimento deploy-safe del conflitto `storage.rules`.

## Moduli impattati
- backend/internal-ai/package.json
- backend/internal-ai/server/internal-ai-firebase-admin.js
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- backend/internal-ai/server/internal-ai-firebase-readiness-cli.js
- backend/internal-ai/server/internal-ai-adapter.js

## Contratti dati coinvolti
- boundary futuro Firestore `storage/@mezzi_aziendali`
- boundary futuro Storage `librettoStoragePath`
- nessun contratto business live attivato

## Ultime modifiche eseguite
- Governa il package backend IA le dipendenze runtime dell'adapter, incluso `firebase-admin`.
- Esposta nell'health una sintesi read-only della readiness Firebase/Storage e della probe runtime `firebase-admin`.
- Aggiunta una CLI locale per ripetere la readiness senza toccare dati business.
- Verificato localmente il bootstrap del package backend IA con `firebase-admin` risolvibile dal solo perimetro dedicato.

## File coinvolti
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

## Decisioni gia prese
- Nessuna modifica a `firebase.json`, `firestore.rules` o `storage.rules` in questo task.
- Nessun bridge live viene aperto finche mancano credenziali Google server-side e policy verificabili.
- Il backend legacy resta fuori dal canale canonico del nuovo sottosistema IA.

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business
- nessun segreto lato client
- nessun backend legacy come canale canonico

## Parti da verificare
- provisioning reale di credenziali Google server-side per il backend IA
- `firestore.rules` o evidenza equivalente delle policy effettive
- decisione infrastrutturale sul boundary Storage deployato

## Rischi aperti
- Aprire il live bridge prima di chiudere questi prerequisiti renderebbe opaco il boundary read-only.
- Modificare ora le rules globali rischierebbe di sporcare il perimetro della madre e dei flussi legacy.

## Punti da verificare collegati
- docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md

## Prossimo passo consigliato
- Usare il package/backend IA ora piu governato per il prossimo task solo quando saranno disponibili credenziali Google server-side e policy verificabili; a quel punto aprire il primo bridge live strettissimo sul solo D01/libretto.

## Cosa NON fare nel prossimo task
- Non usare `functions/*` o `functions-schede/*` come backend canonico.
- Non aprire query larghe, `listAll`, scansioni prefix o path arbitrari.
- Non portare `@rifornimenti`, `@documenti_*`, `@preventivi` o `documenti_pdf/*` nel primo live bridge.

## Commit/hash rilevanti
- NON ESEGUITO
