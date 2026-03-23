# CONTINUITY REPORT - IA interna / ri-verifica bridge live Firebase Storage

## Contesto generale
- Il progetto resta nella fase clone read-only della NEXT con madre intoccabile e sottosistema IA interno isolato sotto `/next/ia/interna*`.
- Il backend IA separato ha gia retrieval server-side clone-seeded, artifact dedicati, observer runtime e hook mezzo-centrico governato, ma non ha ancora un bridge Firebase/Storage business live.

## Modulo/area su cui si stava lavorando
- backend IA separato
- readiness Firebase/Storage
- boundary futuro del bridge live

## Stato attuale
- Stabile:
  - retrieval clone-seeded su `mezzo_dossier`;
  - fallback locale clone-safe esplicito;
  - boundary futuro stretto codificato per il solo perimetro D01/libretto.
- In corso:
  - eventuale bridge Firebase/Storage business live resta bloccato.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- retrieval server-side clone-seeded
- hook mezzo-centrico Dossier
- capability rifornimenti governata
- readiness Firebase/Storage tipizzata

## Prossimo step di migrazione
- Aprire un vero adapter live solo dopo `firebase-admin` governato dal package dedicato, credenziale server-side Google e policy Firestore/Storage verificabili.

## Moduli impattati
- backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- documentazione IA/NEXT/clone

## Contratti dati coinvolti
- boundary futuro Firestore `storage/@mezzi_aziendali`
- boundary futuro Storage `librettoStoragePath`
- nessun contratto business live attivato

## Ultime modifiche eseguite
- Codificato un boundary futuro machine-readable per il primo bridge live ammissibile.
- Rafforzata la readiness per dichiarare il bridge Firestore/Storage come non attivo e non ancora apribile in modo verificabile.
- Aggiornati checklist, stato IA, stato NEXT, registro clone e stato progetto.

## File coinvolti
- backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- backend/internal-ai/README.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Decisioni gia prese
- Nessun bridge Firestore/Storage business live viene aperto in questo task.
- Il fallback ufficiale resta il retrieval clone-seeded del `mezzo_dossier`.
- Il primo live futuro, se e quando sara sicuro, dovra restare limitato a `storage/@mezzi_aziendali` e al path esatto `librettoStoragePath`.

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business
- nessun segreto lato client
- nessun backend legacy come canale canonico

## Parti da verificare
- presenza reale di `firebase-admin` nel package dedicato del backend IA
- credenziale server-side Google dedicata al processo backend IA
- policy Firestore versionate o evidenza equivalente
- decisione infrastrutturale sul conflitto `storage.rules` vs uso legacy

## Rischi aperti
- Aprire un live bridge prima di chiudere questi prerequisiti produrrebbe un boundary opaco e non verificabile.
- D04 rifornimenti, documenti/costi, procurement e verticale `Cisterna` non devono entrare nel primo bridge live.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Fare un task separato solo quando saranno disponibili `firebase-admin` governato, credenziale server-side dedicata e file/policy verificabili; a quel punto aprire un adapter live strettissimo e tracciato sul solo D01/libretto.

## Cosa NON fare nel prossimo task
- Non usare `functions/*` o `functions-schede/*` come backend canonico del bridge.
- Non aprire query larghe, `listAll`, scansioni prefix o path arbitrari.
- Non portare `@rifornimenti`, `@documenti_*`, `@preventivi` o `documenti_pdf/*` dentro il primo live bridge.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
