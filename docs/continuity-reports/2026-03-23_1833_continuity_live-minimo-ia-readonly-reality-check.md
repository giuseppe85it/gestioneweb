# CONTINUITY REPORT - Reality check live minimo IA read-only

## Contesto generale
- Il progetto resta nella fase clone read-only della NEXT con madre intoccabile e sottosistema IA interno isolato sotto `/next/ia/interna*`.
- Il backend IA separato mantiene il fallback ufficiale sul retrieval clone-seeded del `mezzo_dossier`; nessun bridge Firebase/Storage business live e attivo.

## Modulo/area su cui si stava lavorando
- backend IA separato
- readiness Firebase/Storage
- boundary del primo live minimo

## Stato attuale
- Stabile:
  - boundary futuro stretto gia codificato su `storage/@mezzi_aziendali` e `librettoStoragePath`;
  - fallback ufficiale sul retrieval clone-seeded del `mezzo_dossier`.
- Bloccato:
  - live Firestore read-only minimo;
  - live Storage/file read-only minimo.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- backend IA separato
- readiness Firebase/Storage
- boundary futuro machine-readable
- hook mezzo-centrico Dossier

## Prossimo step di migrazione
- Non aprire alcun live finche non esistono insieme:
  - credenziale Google server-side dedicata;
  - supporto esplicito al canale credenziale definitivo;
  - `firestore.rules` versionato o evidenza equivalente;
  - chiarimento deploy-safe del conflitto `storage.rules`.

## Moduli impattati
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- backend/internal-ai/README.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Contratti dati coinvolti
- nessun contratto business live attivato
- boundary futuro Firestore `storage/@mezzi_aziendali`
- boundary futuro Storage `librettoStoragePath`

## Ultime modifiche eseguite
- Allineata la documentazione al verdetto reale del checkout corrente.
- Registrato che il runtime backend IA ora risolve `firebase-admin`, ma il live minimo resta comunque bloccato.
- Registrato che il bootstrap server-side dedicato supporta `FIREBASE_SERVICE_ACCOUNT_JSON`, ma il canale resta inutilizzabile senza credenziali reali nel processo.

## Decisioni gia prese
- Nessun bridge live viene aperto in questo task.
- Nessuna modifica alla madre.
- Nessuna scrittura business.
- Nessun backend legacy viene promosso a canale canonico.

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business
- nessun segreto lato client
- nessuna query larga o path arbitrari

## Parti da verificare
- provisioning credenziale Google server-side reale
- supporto esplicito al canale credenziale definitivo
- `firestore.rules` o evidenza equivalente
- boundary Storage deployato reale

## Rischi aperti
- Dichiarare il live come apribile oggi sarebbe falso.
- Toccate le rules globali o aperto l'access layer live senza task dedicato si rischierebbe di sporcare il perimetro.

## Punti da verificare collegati
- docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md

## Prossimo passo consigliato
- Tenere il `mezzo_dossier` sul retrieval clone-seeded e riaprire il bridge live solo con prerequisiti infrastrutturali chiusi davvero.

## Cosa NON fare nel prossimo task
- Non usare la madre come scorciatoia.
- Non usare `functions/*` o `functions-schede/*` come backend canonico.
- Non aprire query larghe, `listAll`, prefix scan o path arbitrari.

## Commit/hash rilevanti
- NON ESEGUITO
