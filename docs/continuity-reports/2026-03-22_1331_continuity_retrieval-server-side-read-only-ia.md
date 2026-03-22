# CONTINUITY REPORT - Primo retrieval server-side IA

## Contesto generale
- il progetto resta nella fase di clone NEXT `read-only` della madre
- il backend IA separato ha gia adapter server-side locale e persistenza IA dedicata
- con questo task e stato aperto il primo retrieval server-side controllato e read-only

## Modulo/area su cui si stava lavorando
- backend IA separato
- retrieval server-side read-only
- capability `libretto-preview`

## Stato attuale
- esiste l'endpoint `POST /internal-ai-backend/retrieval/read`
- esiste il contenitore `backend/internal-ai/runtime-data/fleet_readonly_snapshot.json`
- il frontend puo seedare il contesto D01 dal clone e poi leggere lato server il contesto mezzo per `libretto-preview`
- se il retrieval server-side non e disponibile, il clone usa il ponte mock-safe o il fallback locale gia esistente

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- adapter server-side locale del backend IA
- persistenza IA dedicata per artifact, memoria e traceability
- primo retrieval read-only mezzo-centrico su snapshot seedato dal clone
- primo uso reale del retrieval server-side sulla capability `libretto-preview`

## Prossimo step di migrazione
- decidere se portare sul retrieval server-side anche lookup mezzi o altre capability mezzo-centriche senza uscire dal perimetro D01

## Moduli impattati
- `backend/internal-ai/*`
- `src/next/internal-ai/internalAiLibrettoPreviewFacade.ts`
- `src/next/internal-ai/internalAiLibrettoPreviewBridge.ts`
- `src/next/internal-ai/internalAiServerRetrievalClient.ts`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- `fleet_readonly_snapshot.json`
- `internalAiServerRetrievalContracts.ts`
- `retrieval.read`

## Ultime modifiche eseguite
- aperto il contratto server-side del retrieval read-only
- aggiunto il seed del contesto D01 dal clone al contenitore IA dedicato
- instradata `libretto-preview` sul retrieval server-side con fallback esplicito
- aggiornati checklist, stato IA, stato NEXT, registro clone e stato progetto

## File coinvolti
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-persistence.js`
- `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
- `src/next/internal-ai/internalAiServerRetrievalClient.ts`
- `src/next/internal-ai/internalAiLibrettoPreviewFacade.ts`
- `src/next/internal-ai/internalAiLibrettoPreviewBridge.ts`
- `src/next/NextInternalAiPage.tsx`

## Decisioni gia prese
- il primo retrieval server-side attivo non usa Firestore o Storage business diretti
- il perimetro iniziale server-side e solo `D01/@mezzi_aziendali`
- il seed del retrieval avviene dal clone NEXT gia validato, non dai runtime legacy
- `libretto-preview` e la prima capability adatta per validare il nuovo canale

## Vincoli da non rompere
- nessuna scrittura business su Firestore o Storage
- nessun provider reale o segreto reale
- nessun riuso runtime dei backend IA legacy come canale canonico
- testi visibili nel clone in italiano

## Parti da verificare
- strategia di refresh/invalidation dello snapshot server-side
- estensione prudente del retrieval ad altre capability mezzo-centriche senza uscire dal perimetro D01

## Rischi aperti
- snapshot seedato dal clone, non ancora retrieval business completo
- una sola capability usa oggi il retrieval server-side
- nessuna auth server-side o policy infrastrutturale reale ancora chiusa

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- chiudere build e smoke test del retrieval e poi valutare l'estensione prudente ad altre capability mezzo-centriche o al lookup veicoli

## Cosa NON fare nel prossimo task
- non collegare Firestore o Storage business direttamente all'adapter senza policy dimostrate
- non rendere canonici `functions/*`, `functions-schede/*`, `api/*` o `server.js`
- non allargare il retrieval a documenti/costi/procurement senza un perimetro e contratti separati

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
