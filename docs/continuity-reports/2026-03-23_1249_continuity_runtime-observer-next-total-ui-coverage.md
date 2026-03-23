# CONTINUITY REPORT - Runtime observer NEXT e copertura UI totale verificabile

## Contesto generale
- Il progetto resta nella fase di clone NEXT `read-only` con madre intoccabile.
- Il sottosistema `/next/ia/interna*` e oggi il perimetro ufficiale per tooling IA, observer runtime e guida di integrazione sopra il clone.
- La priorita recente e stata portare la nuova IA alla massima copertura UI runtime verificabile della NEXT senza scritture business e senza usare la madre.

## Modulo/area su cui si stava lavorando
- IA interna NEXT
- observer runtime NEXT
- mapping schermata -> file/modulo/flusso per integrazioni future

## Stato attuale
- Stabile: observer runtime read-only esteso a 53 route candidate della NEXT con 52 route osservate davvero, 70 screenshot e 18 stati interni osservati su 26 tentati.
- Stabile: `/next/ia/interna` mostra tutte le route e tutti gli stati osservati, con conteggi osservati/tentati/non disponibili e breakdown per tipo di stato.
- Stabile: la chat server-side riceve una vista runtime compatta ma completa di tutte le route osservate, insieme a `integrationGuidance`, `representativeRoutes` e `screenRelations` completi.
- In corso: restano alcune lacune data-dependent o guard-rail-dependent su `Acquisti`, `Home`, `Dossier` e `Capo costi`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- observer runtime Playwright governato e passivo
- snapshot repo/UI server-side controllata
- guida integrazione UI/file/flusso
- hook mezzo-centrico governato su Dossier
- retrieval Dossier clone-seeded server-side

## Prossimo step di migrazione
- Chiudere solo i gap runtime ancora sicuri da osservare, intervenendo su selettori o su dati/fixture clone-safe se e solo se non introducono scritture o scorciatoie sul runtime madre.

## Moduli impattati
- backend IA separato
- pagina `/next/ia/interna`
- observer runtime NEXT
- repo understanding controllato

## Contratti dati coinvolti
- `InternalAiServerRuntimeObserverSnapshot`
- `InternalAiServerRuntimeObserverRouteObservation`
- `InternalAiServerRuntimeObserverStateObservation`
- snapshot `repo_ui_understanding`

## Ultime modifiche eseguite
- Esteso il catalogo runtime NEXT con route annidate, dinamiche e stati interni whitelist-safe.
- Rigenerata la copertura reale con esito verificato `52/53` route, `70` screenshot, `18/26` stati.
- Estesa la vista compatta usata dalla chat per includere tutte le route runtime osservate e la mappa completa `schermata -> file/modulo/flusso`.
- Aggiornata la pagina IA per non troncare piu route e stati ai primi elementi.

## File coinvolti
- `backend/internal-ai/server/internal-ai-next-runtime-observer.js`
- `backend/internal-ai/server/internal-ai-repo-understanding.js`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/src/internalAiServerRetrievalContracts.ts`
- `scripts/internal-ai-observe-next-runtime.mjs`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/change-reports/2026-03-22_2137_ui_runtime-observer-next-integration-guidance-ia.md`
- `docs/change-reports/2026-03-22_2204_hook-mezzo-centrico-dossier-capability-catalog-ia.md`
- `docs/change-reports/2026-03-22_2303_deep-runtime-observer-output-selector-next-ia.md`
- `docs/change-reports/2026-03-23_0659_estensione-hook-dossier-retrieval-rifornimenti-ia.md`
- `docs/change-reports/2026-03-23_0909_riverifica-bridge-live-firebase-storage-ia.md`
- `docs/change-reports/2026-03-23_0942_governance-package-backend-ia-readiness-live.md`
- `docs/change-reports/2026-03-23_1249_ui_total-runtime-coverage-next-ia.md`

## Decisioni gia prese
- L'observer runtime resta solo read-only, manifest-driven e confinato a `/next/*`.
- Ogni limite di copertura deve restare esplicito: niente copertura stimata o simulata.
- La madre non si tocca e il backend legacy non diventa canale canonico della nuova IA.
- Le integrazioni future devono appoggiarsi a mapping verificato `schermata -> file/modulo/flusso`, non a deduzioni generiche.

## Vincoli da non rompere
- Nessuna scrittura business, submit, upload o click distruttivo nel clone.
- Nessun uso della madre per coprire lacune runtime della NEXT.
- Nessun segreto lato client e nessun riuso runtime dei moduli IA legacy.
- Aggiornare sempre `STATO_MIGRAZIONE_NEXT.md`, `REGISTRO_MODIFICHE_CLONE.md`, checklist IA e report quando si tocca il clone IA.

## Parti da verificare
- Se la route dinamica `Acquisti` dettaglio puo emergere in modo affidabile con un selettore piu robusto ma ancora non distruttivo.
- Se gli stati `Home`, `Dossier` e `Capo costi` mancanti sono veramente invisibili nel clone corrente o richiedono dati/ruoli specifici non ancora riproducibili in sicurezza.
- Se conviene introdurre fixture/seed clone-safe dedicate per osservare alcuni stati oggi hidden/data-dependent senza sporcare il runtime reale.

## Rischi aperti
- Alcune lacune runtime dipendono da dati o controlli disabilitati e non si chiudono con semplice crawling.
- Aumentare ancora il payload chat oltre questa forma compatta rischia di degradare chiarezza e costo senza vero guadagno.
- Forzare i controlli disabilitati del clone romperebbe il guard rail read-only e falserebbe la copertura.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- Policy Firestore/Storage effettive e governance finale endpoint IA/PDF restano aperte.
- Standard UI canonico cross-modulo della NEXT resta da consolidare mentre cresce la copertura runtime.

## Prossimo passo consigliato
- Fare un micro-task mirato solo sui gap residui davvero chiudibili in sicurezza: 1 route dinamica (`Acquisti` dettaglio) e gli stati interni ancora hidden/data-dependent, con prova runtime esplicita e senza toccare la madre.

## Cosa NON fare nel prossimo task
- Non cliccare controlli disabilitati dal clone per simulare copertura.
- Non usare la madre come scorciatoia per osservare schermate mancanti.
- Non aprire bridge Firestore/Storage business live per coprire limiti del crawler.
- Non raccontare come totale cio che resta ancora solo potenzialmente osservabile.

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
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
