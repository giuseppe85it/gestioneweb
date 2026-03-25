# CONTINUITY REPORT - IA interna NEXT / planner multi-dominio

## Contesto generale
- il clone NEXT resta `read-only` e la console `/next/ia/interna` continua a lavorare sopra il motore unificato gia consolidato nei task del `2026-03-24` e `2026-03-25`.
- il punto chiuso in questo step non e il dominio dati a monte: e il planner che decide se la richiesta utente va su fuel, scadenze, quadro completo o classifica priorita multi-dominio.

## Modulo/area su cui si stava lavorando
- planner della console IA interna
- request understanding e precedenze intenti
- output focus e regressione sui prompt reali

## Stato attuale
- il planner riconosce meglio `top-N`, `priorita`, `classifica`, `azione consigliata` e richieste esplicitamente multi-dominio.
- il prompt `Dimmi quali sono oggi i 3 mezzi che richiedono piu attenzione...` non collassa piu sul solo ramo `scadenze/collaudi`, ma entra in `classifica priorita` multi-mezzo.
- il prompt fuel con `genera pdf` resta `fuel-first`.
- il prompt `prossimi 30 giorni + collaudo/pre-collaudo` resta focalizzato su scadenze/collaudi/pre-collaudi.
- il prompt `quadro completo` continua ad aprire overview mezzo solo quando e richiesto in modo esplicito.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- console IA unica
- motore unificato read-only
- planner gestionale business-first
- controllo periodo/calcolo rifornimenti
- regressione prompt reali del planner

## Prossimo step di migrazione
- unificare meglio il livello di affidabilita nei casi multi-dominio e ampliare il priority engine operativo oltre `D10 + D02`, senza riaprire overview generali o refactor larghi.

## Moduli impattati
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- readers NEXT `D04`
- readers NEXT `D10`
- readers NEXT `D02`

## Ultime modifiche eseguite
- introdotto riconoscimento esplicito di `rankingLimit`, ordinamento/priorita e azione consigliata.
- rafforzate le precedenze intenti per i prompt ampi su attenzione operativa.
- aggiornati output focus e composer flotte per classifica priorita e top-N.
- riallineati capability keywords e prompt suggeriti della console.

## File coinvolti
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- una richiesta ampia con top-N e incrocio esplicito deve prevalere sul ramo mono-dominio.
- una richiesta specifica non va allargata a overview mezzo solo per hint console o fallback generici.
- la regressione va guidata da prompt reali, non da esempi astratti.

## Vincoli da non rompere
- madre intoccabile.
- nessuna scrittura business o segreto lato client.
- niente refactor largo del motore IA o della UI.
- niente interventi sul dominio rifornimenti a monte in questo step.

## Parti da verificare
- se i dati del giorno/periodo sono poveri, la classifica priorita resta corretta nel ramo ma puo produrre contenuto `Da verificare` o `Nessun elemento rilevante`.
- i domini fuori asse forte restano piu prudenti del planner migliorato.

## Rischi aperti
- il planner e piu robusto, ma non sostituisce ancora un vero priority engine multi-dominio completo con pesi business formalizzati.
- il thread espone ancora alcune etichette tecniche (`D10`, `D02`, `Affidabilita`) che non sono pienamente business-first.

## Punti da verificare collegati
- NO

## Prossimo passo consigliato
- chiudere il priority engine operativo su `top-N`, `cosa conviene fare` e ranking multi-dominio con regole business spiegabili sopra `D10 + D02` e segnali collegati.

## Cosa NON fare nel prossimo task
- non rifare il motore unificato o la console da zero.
- non riaprire il dominio rifornimenti a monte se il problema riguarda solo planner e ranking.
- non allargare ogni richiesta ampia a `quadro completo mezzo`.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
