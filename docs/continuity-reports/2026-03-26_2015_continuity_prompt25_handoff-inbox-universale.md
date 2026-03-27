# CONTINUITY REPORT - Gateway universale IA interna NEXT

## Contesto generale
- il clone/NEXT resta il solo perimetro di evoluzione
- `/next/ia/interna` e ora il gateway universale del clone, con registry totale, resolver, orchestrator, handoff standard e inbox documentale

## Modulo/area su cui si stava lavorando
- IA interna universale
- chiusura dei gap operativi residui su handoff, prefill, inbox documentale, D06, D09 e governance moduli futuri

## Stato attuale
- stabile:
  - payload standard `iaHandoff`
  - prefill canonico
  - inbox documentale universale
  - bridge chat che persiste handoff e inbox
  - gate runtime di conformita per moduli futuri
- in corso:
  - consumo nativo del payload `iaHandoff` dentro i moduli target fuori dal perimetro IA interna

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- shell e runtime IA interna
- lettura dati clone-safe
- routing documenti
- handoff standard e repository locale isolato
- documentazione ufficiale di registry, matrice, contract, entity model e scenari E2E

## Prossimo step di migrazione
- far leggere `iaHandoff=<id>` ai moduli target principali del clone per applicare il prefill anche fuori dall'IA interna

## Moduli impattati
- `next.ia_interna`
- `next.procurement`
- `next.cisterna`
- `next.autisti`
- `next.ia_hub`
- `next.libretti_export`

## Contratti dati coinvolti
- payload standard `iaHandoff`
- registry totale clone/NEXT
- contract standard adapter
- repository locale isolato handoff/inbox

## Ultime modifiche eseguite
- introdotto handoff standard uniforme per richieste testuali e documentali
- attivata inbox documentale universale su `/next/ia/interna/richieste`
- aggiornati registry, matrice copertura, piano residui e scenari E2E

## File coinvolti
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`
- `src/next/internal-ai/internalAiUniversalRequestsRepository.ts`
- `docs/product/SCENARI_E2E_IA_UNIVERSALE_NEXT.md`

## Decisioni gia prese
- la madre resta intoccabile
- il live-read business lato backend IA resta chiuso
- i domini verticali non sono piu obiettivo finale: sono adapter sotto il gateway universale
- il gate moduli futuri esiste gia a livello runtime/documentale e non va rimosso

## Vincoli da non rompere
- nessuna scrittura business nel clone
- nessun riuso runtime sporco dei backend legacy come canale canonico
- nessuna modifica fuori whitelist senza dichiarazione `SERVE FILE EXTRA`

## Parti da verificare
- consumo del payload `iaHandoff` nei moduli target fuori da `/next/ia/interna`
- eventuale estensione del gate di conformita anche a CI o checklist di rilascio automatizzate

## Rischi aperti
- overpromise sul fatto che i moduli target siano gia auto-prefillati senza leggere `iaHandoff`
- riaprire per errore il live-read business mentre si lavora sui moduli target

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- patch mirata ai moduli target principali del clone per leggere `iaHandoff`, mostrare il prefill e gestire `campiDaVerificare` in modo uniforme

## Cosa NON fare nel prossimo task
- non rifare il registry o il contract standard da zero
- non toccare la madre
- non riaprire il live-read business o writer legacy per simulare un handoff piu completo

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/REGISTRY_TOTALE_CLONE_NEXT.md`
- `docs/product/MATRICE_COPERTURA_UNIVERSALE_IA_NEXT.md`
- `docs/product/SCENARI_E2E_IA_UNIVERSALE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
