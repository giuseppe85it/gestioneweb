# CHANGE REPORT - Ri-verifica bridge live Firebase/Storage IA

## Data
- 2026-03-23 09:09

## Tipo task
- patch
- sicurezza
- audit

## Obiettivo
- verificare se il backend IA separato possa aprire davvero un primo bridge Firebase/Storage business live read-only e, se non ancora sicuro, chiudere il task con un boundary futuro esplicito e con una readiness piu onesta.

## File modificati
- backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js
- backend/internal-ai/server/internal-ai-firebase-readiness.js
- backend/internal-ai/README.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- Introdotto un boundary futuro machine-readable che limita il primo bridge live ammissibile al solo documento `storage/@mezzi_aziendali` e al solo oggetto Storage esatto puntato da `librettoStoragePath`.
- Rafforzata `internal-ai-firebase-readiness.js` per dichiarare il bridge Firestore/Storage come `not_ready` finche mancano governance backend, credenziali server-side e policy verificabili.
- Aggiornata la documentazione di stato IA/NEXT/clone per registrare che il fallback ufficiale resta il retrieval clone-seeded del `mezzo_dossier`.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il backend IA separato espone un perimetro futuro piu stretto e verificabile senza fingere un live bridge gia attivo.
- La UI clone che legge la readiness resta coerente: nessuna nuova lettura business viene aperta e nessuna scrittura viene riattivata.

## Rischio modifica
- EXTRA ELEVATO

## Moduli impattati
- backend IA separato
- readiness Firebase/Storage della IA interna
- documentazione di stato IA/NEXT/clone

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI: policy Firestore effettive

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
- Il task NON apre alcun bridge Firestore/Storage business live.
- Restano bloccanti reali `firebase-admin` non governato nel package dedicato, credenziali server-side Google assenti nel processo corrente, `firestore.rules` assente e `storage.rules` versionato in conflitto.

## Build/Test eseguiti
- node --check backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js -> OK
- node --check backend/internal-ai/server/internal-ai-firebase-readiness.js -> OK
- npx eslint backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js backend/internal-ai/server/internal-ai-firebase-readiness.js -> OK
- smoke test buildFirebaseReadinessSnapshot() -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
