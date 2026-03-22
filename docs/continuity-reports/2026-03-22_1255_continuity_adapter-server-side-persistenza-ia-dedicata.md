# CONTINUITY REPORT - Backend IA separato

## Contesto generale
- il progetto resta nella fase di clone NEXT `read-only` della madre, con sottosistema IA interno isolato sotto `/next/ia/interna*`
- il backend IA separato esisteva gia come scaffold mock-safe; con questo task ha ricevuto il primo adapter server-side reale e una persistenza IA dedicata

## Modulo/area su cui si stava lavorando
- backend IA separato
- persistenza artifact e memoria IA dedicate
- integrazione frontend minima e sicura del clone IA interno

## Stato attuale
- esiste un adapter HTTP locale reale in `backend/internal-ai/server/internal-ai-adapter.js`
- esiste una persistenza IA dedicata e separata in `backend/internal-ai/runtime-data/*`
- il frontend IA interno prova hydration e mirror server-side con fallback locale esplicito
- preview e chat restano sulle capability clone-safe gia attive; non e stato aperto retrieval business lato server

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- ponti preview/chat verso backend IA separato mock-safe
- adapter server-side reale ma locale
- persistenza IA dedicata per artifact, memoria operativa e traceability minima

## Prossimo step di migrazione
- aprire un retrieval server-side controllato per dati del clone IA, senza usare backend legacy come canale canonico e senza aprire scritture business

## Moduli impattati
- `backend/internal-ai/*`
- `src/next/internal-ai/*`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- `analysis_artifacts.json`
- `ai_operational_memory.json`
- `ai_traceability_log.json`

## Ultime modifiche eseguite
- creato l'adapter server-side reale e separato del backend IA
- creata la persistenza file-based IA dedicata e isolata
- collegato il frontend IA a hydration e mirror mock-safe server-side con fallback locale
- aggiornati checklist, stato IA, stato NEXT, registro clone e stato progetto

## File coinvolti
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-persistence.js`
- `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
- `src/next/internal-ai/internalAiServerPersistenceClient.ts`
- `src/next/internal-ai/internalAiServerPersistenceBridge.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internalAiTracking.ts`
- `src/next/NextInternalAiPage.tsx`

## Decisioni gia prese
- il backend IA separato vive in `backend/internal-ai/*` e non nei runtime legacy
- la prima persistenza reale della nuova IA usa solo file JSON locali dedicati, non Firestore o Storage business
- i fallback locali del clone restano obbligatori finche l'adapter non e sempre disponibile

## Vincoli da non rompere
- nessuna scrittura business su Firestore o Storage
- nessun provider reale o segreto reale
- nessun riuso runtime dei backend IA legacy come canale canonico
- testi visibili nel clone in italiano

## Parti da verificare
- target deploy condiviso dell'adapter oltre il localhost
- strategia identita utente e permessi server-side
- policy Firestore/Storage effettive se in futuro si aprira retrieval server-side

## Rischi aperti
- l'adapter e ancora locale e mock-safe, non un runtime condiviso di produzione
- retrieval server-side di repo o dati business non ancora attivo
- traceability minima presente, ma non ancora audit applicativo completo

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- progettare il primo retrieval server-side controllato per una capability IA gia clonata, mantenendo i layer clone-safe e senza aprire provider reali

## Cosa NON fare nel prossimo task
- non collegare Firestore o Storage business direttamente all'adapter senza policy dimostrate
- non rendere canonici `functions/*`, `functions-schede/*`, `api/*` o `server.js`
- non rimuovere i fallback locali del clone finche l'adapter non ha disponibilita dimostrata

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
