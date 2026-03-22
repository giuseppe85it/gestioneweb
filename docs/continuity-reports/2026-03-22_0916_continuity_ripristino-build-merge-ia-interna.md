# CONTINUITY REPORT - Ripristino build merge IA interna

## Contesto generale
- Il progetto resta nella fase clone `read-only` della madre.
- Il sottosistema IA interna vive sotto `/next/ia/interna*` e deve restare isolato, in italiano e senza scritture business.

## Modulo/area su cui si stava lavorando
- IA interna del clone NEXT
- Ripristino urgente build dopo merge incompleto con conflict marker residui

## Stato attuale
- La pagina `src/next/NextInternalAiPage.tsx` e i file IA interni/documentali strettamente collegati sono di nuovo compilabili.
- Build e lint mirato passano.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Route IA interna clone-safe
- Report targa/autista/combinato in sola lettura
- Archivio locale isolato e tracking locale del modulo
- Registri documentali obbligatori riallineati dopo il fix merge

## Prossimo step di migrazione
- Tenere separati i futuri miglioramenti funzionali/UI dalla semplice stabilizzazione build.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/*` strettamente collegati
- Registri docs del clone e dell'IA interna

## Contratti dati coinvolti
- Nessuno nuovo
- Solo compatibilita tipizzata del subtree IA interno

## Ultime modifiche eseguite
- Rimossi marker `<<<<<<< / ======= / >>>>>>>` dal runtime IA interno e dalla documentazione collegata.
- Riallineati `internalAiTypes` e `internalAiVehicleReportFacade` alla build attuale.
- Aggiornati `CHECKLIST_IA_INTERNA`, `STATO_AVANZAMENTO_IA_INTERNA`, `STATO_MIGRAZIONE_NEXT` e `REGISTRO_MODIFICHE_CLONE`.

## File coinvolti
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internalAiTypes.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- src/next/internal-ai/internalAiChatOrchestrator.ts
- src/next/internal-ai/internal-ai.css
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Il fix e solo di ripristino/stabilita: nessun redesign e nessuna modifica ai flussi dati.
- Il clone IA interna resta `read-only` e non riapre writer business o backend IA legacy.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business nel clone.
- Tutti i testi visibili nel gestionale devono restare in italiano.

## Parti da verificare
- Eventuali altri file del worktree fuori whitelist gia modificati dal merge precedente.
- Eventuali evoluzioni funzionali della home IA interna non coperte da questo fix.

## Rischi aperti
- Un successivo merge sporco potrebbe riproporre conflitti nei registri docs se non vengono chiusi e tracciati subito.
- Il subtree IA interno ha piu file collegati tra loro; futuri merge vanno verificati sempre con build completa.

## Punti da verificare collegati
- Nessun nuovo punto aperto aggiunto in questo task.

## Prossimo passo consigliato
- Se serve evolvere la UX o riesporre capability aggiuntive, aprire un task separato partendo da questo stato build verde.

## Cosa NON fare nel prossimo task
- Non mischiare miglioramenti funzionali e nuove merge resolution nello stesso intervento.
- Non toccare writer business o layer dati della madre per estendere il modulo IA interno.

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
