# CONTINUITY REPORT - Base universale IA clone NEXT

## Contesto generale
- la strategia ufficiale resta clone/NEXT read-only sopra la madre intoccabile
- il sottosistema `/next/ia/interna` non va piu trattato come console verticale soltanto mezzo-centrica: ora esiste una base runtime e documentale del sistema universale clone/NEXT

## Modulo/area su cui si stava lavorando
- IA interna universale del clone/NEXT
- perimetro task recente: registry totale, contract standard, entity/request resolver, orchestrator, router documenti, riuso capability IA gia deployate

## Stato attuale
- esiste un registry universale seedato con 10 moduli, 30 route, 11 adapter, 13 capability IA e 6 gap dichiarati
- esiste un gateway runtime in `/next/ia/interna` che produce piano universale, action intent, routing allegati e selezione adapter
- restano aperti handoff UI standard, inbox documentale, procurement prefill, fusione cisterna nel planner e gate moduli futuri

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- registry totale documentato e seed runtime
- contract standard adapter
- entity model e resolver universale iniziale
- request resolver universale iniziale
- orchestrator/composer/router documenti iniziali
- aggancio della base universale alla pagina `/next/ia/interna`

## Prossimo step di migrazione
- chiudere il contract UI handoff e la inbox documentale universale prima di estendere altri verticali

## Moduli impattati
- next.ia_interna
- next.dossier
- next.procurement
- next.operativita
- next.autisti
- next.cisterna
- next.ia_hub

## Contratti dati coinvolti
- contract adapter universale
- registry totale clone/NEXT
- routing documentale clone-safe
- mapping capability IA riusabili

## Ultime modifiche eseguite
- introdotto il seed `internalAiUniversalContracts` con registry, adapter, capability e gap
- introdotti entity resolver, request resolver, document router, composer e orchestrator universali
- agganciata la workbench universale a `/next/ia/interna` e al bridge chat
- creati documenti permanenti per registry, copertura, contract standard, entity model e piano residui

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiChatOrchestratorBridge.ts
- src/next/internal-ai/InternalAiUniversalWorkbench.tsx
- src/next/internal-ai/internalAiUniversalTypes.ts
- src/next/internal-ai/internalAiUniversalContracts.ts
- src/next/internal-ai/internalAiUniversalRegistry.ts
- src/next/internal-ai/internalAiUniversalEntityResolver.ts
- src/next/internal-ai/internalAiUniversalRequestResolver.ts
- src/next/internal-ai/internalAiUniversalDocumentRouter.ts
- src/next/internal-ai/internalAiUniversalComposer.ts
- src/next/internal-ai/internalAiUniversalOrchestrator.ts
- docs/product/REGISTRY_TOTALE_CLONE_NEXT.md
- docs/product/MATRICE_COPERTURA_UNIVERSALE_IA_NEXT.md
- docs/architecture/CONTRATTO_STANDARD_ADAPTER_IA_NEXT.md
- docs/architecture/ENTITY_MODEL_RESOLVER_UNIVERSALE_IA_NEXT.md
- docs/product/PIANO_ASSORBIMENTO_MODULI_RESIDUI_IA_NEXT.md

## Decisioni gia prese
- i domini gia chiusi vanno trattati come adapter specializzati, non come prodotto finale
- la madre non e il perimetro di evoluzione del nuovo cervello operativo
- il clone/NEXT deve assorbire anche le capability IA gia deployate quando coerenti con il nuovo perimetro
- i moduli futuri devono nascere con contract standard e registry entry

## Vincoli da non rompere
- madre intoccabile
- nessuna scrittura business reale nel clone
- tutto il visibile del gestionale resta in italiano
- nessun riuso runtime sporco dei backend legacy come canale canonico della nuova IA

## Parti da verificare
- payload standard handoff chat -> modulo target
- inbox documentale autonoma
- strategia finale di integrazione `Cisterna` nel planner universale
- gate processo/CI per rendere il contract standard obbligatorio

## Rischi aperti
- facile ricadere in una roadmap a isole se i moduli futuri vengono integrati senza contract standard
- facile creare deviazioni sul dominio forte sbagliato se il resolver non cresce insieme al registry
- procurement e documenti possono sembrare piu chiusi di quanto siano se non viene completato il payload standard

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- implementare `WP01 - Contract UI handoff universale` e `WP02 - Inbox documentale universale` descritti in `docs/product/PIANO_ASSORBIMENTO_MODULI_RESIDUI_IA_NEXT.md`

## Cosa NON fare nel prossimo task
- non tornare a introdurre verticali come prodotto finale separato
- non aprire live-read business lato backend IA senza prerequisiti reali
- non riusare runtime legacy sporchi come backend canonico del sistema universale

## Commit/hash rilevanti
- d058a64c - stato repo precedente al task
- b2923064 - stato repo precedente al task

## Documenti di riferimento da leggere
- docs/STATO_ATTUALE_PROGETTO.md
- docs/STRUTTURA_COMPLETA_GESTIONALE.md
- docs/product/STORICO_DECISIONI_PROGETTO.md
- docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md
- docs/architecture/CONTRATTO_STANDARD_ADAPTER_IA_NEXT.md
- docs/architecture/ENTITY_MODEL_RESOLVER_UNIVERSALE_IA_NEXT.md
- docs/product/REGISTRY_TOTALE_CLONE_NEXT.md
- docs/product/MATRICE_COPERTURA_UNIVERSALE_IA_NEXT.md
- docs/product/PIANO_ASSORBIMENTO_MODULI_RESIDUI_IA_NEXT.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/CHECKLIST_IA_INTERNA.md

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
