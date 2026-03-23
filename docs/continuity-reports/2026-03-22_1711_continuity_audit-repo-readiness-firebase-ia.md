# CONTINUITY REPORT - IA interna / repo understanding / readiness Firebase

## Contesto generale
- Il progetto e nella fase clone read-only della NEXT con madre intoccabile e sottosistema IA interno isolato sotto `/next/ia/interna*`.
- Il backend IA separato esiste gia con chat reale controllata, artifact server-side dedicati, retrieval read-only limitato e provider OpenAI solo lato server.

## Modulo/area su cui si stava lavorando
- IA interna NEXT
- comprensione controllata repository/UI
- audit readiness Firestore/Storage lato server

## Stato attuale
- La snapshot repo/UI del backend IA separato non e piu solo curata a mano: include ora anche un indice filesystem controllato di codice/CSS e relazioni madre vs NEXT.
- Firestore e Storage read-only lato server NON sono ancora aperti nel backend IA separato; esiste ora solo un audit verificato dei prerequisiti mancanti.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- chat reale controllata lato server
- overview IA con pannello repo/UI
- indice repository controllato
- audit readiness Firestore/Storage

## Prossimo step di migrazione
- aprire un access layer server-side dedicato e separato per Firestore read-only solo dopo aver definito credenziale server-side, matrice collection/query consentite e policy verificabili

## Moduli impattati
- backend/internal-ai/server/internal-ai-repo-understanding.js
- backend/internal-ai/server/internal-ai-adapter.js
- src/next/NextInternalAiPage.tsx

## Contratti dati coinvolti
- nessuno business in scrittura
- snapshot repo/UI server-side
- audit readiness Firestore/Storage solo descrittivo

## Ultime modifiche eseguite
- Estesa la snapshot repo/UI con indice filesystem controllato per `src/next`, `src/pages`, `src/components` e `backend/internal-ai`.
- Aggiunte relazioni CSS importate e relazioni curate madre vs NEXT.
- Aggiunto audit di readiness Firestore/Storage e visualizzazione dedicata nella overview IA.

## File coinvolti
- backend/internal-ai/server/internal-ai-repo-understanding.js
- backend/internal-ai/server/internal-ai-adapter.js
- backend/internal-ai/server/internal-ai-persistence.js
- backend/internal-ai/src/internalAiServerRetrievalContracts.ts
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiContracts.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Decisioni gia prese
- Nessuna lettura Firestore/Storage business lato server viene aperta finche non esistono access layer dedicato, credenziale server-side e policy verificabili.
- Il repo understanding deve restare controllato e tracciabile, non una scansione indiscriminata dell'intero repository.

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business
- nessun backend legacy come canale canonico della nuova IA
- nessun segreto lato client

## Parti da verificare
- presenza reale di credenziali server-side dedicate per Firebase nel target di deploy del backend IA separato
- matrice collection/query/path ammessi per future letture read-only

## Rischi aperti
- `firestore.rules` assente nel repo: policy Firestore effettive non verificabili da codice versionato
- `storage.rules` versionate e runtime legacy risultano in tensione e impediscono un'apertura sicura di Storage read-only canonico senza decisione infrastrutturale

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- creare nel backend IA separato un adapter Firestore read-only dedicato, ma solo dopo aver formalizzato credenziale server-side, policy effettive e whitelist collection/query ammesse

## Cosa NON fare nel prossimo task
- non riusare `functions/*` o `functions-schede/*` come backend canonico del reader Firebase della nuova IA
- non aprire Storage read-only “di prova” senza path ammessi, audit e traceability

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
