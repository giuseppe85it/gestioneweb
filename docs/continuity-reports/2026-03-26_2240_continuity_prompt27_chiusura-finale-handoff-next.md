# CONTINUITY REPORT - IA universale clone/NEXT

## Contesto generale
- il clone/NEXT resta il solo perimetro di evoluzione
- la chat `/next/ia/interna` e il cervello operativo universale del clone

## Modulo/area su cui si stava lavorando
- sistema universale IA interno
- chiusura finale dei consumer `iaHandoff` nei moduli target correnti

## Stato attuale
- il perimetro operativo corrente del sistema universale e chiuso end-to-end
- i moduli target consumano `iaHandoff`, applicano prefill reale e aggiornano lo stato consumo

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- gateway universale, registry, resolver, orchestrator, inbox documentale, conformance gate
- consumer handoff reali su procurement, inventario/materiali, mezzi/dossier, IA libretto/documenti, libretti export, cisterna IA, autisti inbox/admin

## Prossimo step di migrazione
- mantenere il gate contract per i moduli futuri e impedire ingressi fuori standard

## Moduli impattati
- next.ia_interna
- next.procurement
- next.operativita
- next.dossier
- next.ia_hub
- next.libretti_export
- next.cisterna
- next.autisti

## Contratti dati coinvolti
- payload standard `iaHandoff`
- registry totale clone/NEXT
- contract standard adapter IA NEXT

## Ultime modifiche eseguite
- introdotto lifecycle persistito del payload `iaHandoff`
- chiusi i consumer standard nei moduli target correnti
- riallineati registry, matrice e scenari E2E a nessun gap aperto nel perimetro corrente

## File coinvolti
- `src/next/internal-ai/internalAiUniversalHandoff.ts`
- `src/next/internal-ai/internalAiUniversalHandoffLifecycle.ts`
- `src/next/internal-ai/internalAiUniversalHandoffConsumer.ts`
- `src/next/internal-ai/InternalAiUniversalRequestsPanel.tsx`
- `src/next/internal-ai/internalAiUniversalRequestsRepository.ts`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextInventarioPage.tsx`
- `src/next/NextMaterialiConsegnatiPage.tsx`
- `src/next/NextMezziPage.tsx`
- `src/next/NextIALibrettoPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextLibrettiExportPage.tsx`
- `src/next/NextCisternaIAPage.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`

## Decisioni gia prese
- madre intoccabile
- live-read business lato backend IA resta fuori perimetro
- ogni modulo futuro deve entrare con contract standard e supporto reale a `iaHandoff`

## Vincoli da non rompere
- nessuna scrittura business nel clone
- nessun riuso runtime sporco dei backend legacy come canale canonico
- nessuna modifica fuori whitelist senza `SERVE FILE EXTRA`

## Parti da verificare
- nessun gap aperto nel perimetro operativo corrente
- verificare solo futuri ingressi modulo rispetto al gate di conformita

## Rischi aperti
- un nuovo modulo NEXT puo degradare il sistema se viene introdotto senza contract standard e senza consumer handoff
- eventuali futuri writer UI non devono aggirare il boundary read-only attuale

## Punti da verificare collegati
- nessun nuovo punto aperto; restano validi solo i punti storici extra-perimetro su live-read/policy in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- applicare il gate di conformita a ogni modulo futuro del clone/NEXT prima di considerarlo pronto per la chat universale

## Cosa NON fare nel prossimo task
- non riaprire il live-read business per compensare richieste non coperte da nuovi moduli
- non aggiungere nuovi target chat con logiche ad hoc fuori dal consumer standard

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/REGISTRY_TOTALE_CLONE_NEXT.md`
- `docs/product/MATRICE_COPERTURA_UNIVERSALE_IA_NEXT.md`
- `docs/product/SCENARI_E2E_IA_UNIVERSALE_NEXT.md`
- `docs/architecture/CONTRATTO_STANDARD_ADAPTER_IA_NEXT.md`
