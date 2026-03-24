# CONTINUITY REPORT - Verifica finale live minimo Firebase/Storage IA

## Contesto generale
- La NEXT resta clone `read-only` con madre intoccabile.
- Il backend IA separato resta l'unico perimetro ammesso per readiness e futuri bridge read-only stretti.

## Modulo/area su cui si stava lavorando
- readiness Firebase/Storage del backend IA separato
- dominio `mezzo_dossier`
- verifica credenziali server-side reali

## Stato attuale
- Stabile: supporto codice lato server a `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_CONFIG`.
- Stabile: `firebase-admin` risolvibile nel checkout locale.
- Stabile: nessuna credenziale server-side reale nel processo corrente.
- Stabile: Firestore `not_ready`, Storage `not_ready`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- backend IA separato
- readiness CLI locale
- retrieval clone-seeded ufficiale su `mezzo_dossier`
- boundary futuro stretto su `storage/@mezzi_aziendali` + `librettoStoragePath`

## Prossimo step di migrazione
- Aprire un live minimo solo quando esistono insieme:
  - credenziale server-side reale nel processo;
  - `firestore.rules` versionato o evidenza equivalente verificabile;
  - access layer Firestore live stretto in `backend/internal-ai`;
  - chiarimento deploy-safe del conflitto `storage.rules`.

## Contratti dati coinvolti
- Firestore candidato: `storage/@mezzi_aziendali`
- Storage candidato: path esatto `librettoStoragePath`
- nessun contratto business live attivato

## Ultime modifiche eseguite
- aggiornati i documenti di stato per fissare il verdetto finale sul live minimo;
- confermato che il `mezzo_dossier` non cambia canale e resta su retrieval clone-seeded;
- evitata qualsiasi patch che fingesse un bridge live non realmente sostenibile.

## File coinvolti
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-23_1848_verifica-finale-live-minimo-firebase-storage-ia.md

## Decisioni gia prese
- Nessun live bridge viene aperto in questo task.
- Nessuna scrittura business.
- Nessuna modifica alla madre.
- Nessun uso del legacy come backend canonico.

## Vincoli da non rompere
- niente query larghe Firestore
- niente listAll o prefix scan su Storage
- niente segreti lato client
- niente secondo canale sporco nel `mezzo_dossier`

## Rischi aperti
- credenziale server-side assente nel processo corrente
- `firestore.rules` assente dal repo
- `storage.rules` in conflitto con l'uso legacy
- access layer Firestore live dedicato ancora assente

## Prossimo passo consigliato
- Restare sul retrieval clone-seeded del `mezzo_dossier` finche non si chiudono davvero identity, policy e access layer.

## Cosa NON fare nel prossimo task
- Non dichiarare attivo il live minimo solo perche il supporto credenziale esiste nel codice.
- Non aprire Firestore o Storage business senza traceability stretta e whitelist runtime.
- Non usare la madre o i backend legacy come scorciatoia.

## Commit/hash rilevanti
- NON ESEGUITO
