# CONTINUITY REPORT - IA interna NEXT / priority engine operativo flotta

## Contesto generale
- il clone NEXT resta `read-only` e la console `/next/ia/interna` continua a lavorare sopra il motore unificato, dopo il planner multi-dominio e il trust model D04 chiusi nei task precedenti del `2026-03-25`.
- questo step non riapre PDF, D04 o infrastruttura: chiude il salto di valore operativo sulla flotta, cioe la capacita di produrre una classifica spiegabile e un'azione consigliata.

## Modulo/area su cui si stava lavorando
- richieste flotta `top-N`, `priorita`, `mezzo piu critico`, `quale controllare per primo`
- rendering business-first del thread su classifica e azione consigliata

## Stato attuale
- il motore IA ordina ora i mezzi con criterio fisso e spiegabile, basato su scaduti, entro 7 giorni, alert/KO e lavori urgenti, segnalazioni/pre-collaudi, backlog/manutenzioni.
- il thread `Priorita flotta` espone targa, priorita, motivi e `fare ora`.
- il ramo `Scadenze flotta` resta separato e viene ancora scelto quando il prompt e davvero focalizzato su collaudi/pre-collaudi prossimi.
- i prompt settimanali e top-1 non cadono piu nel fallback generico.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- planner multi-dominio
- fiducia unificata D04 su fuel
- priority engine operativo flotta

## Prossimo step di migrazione
- chiudere il quadro mezzo utile alla decisione e riallineare definitivamente chat, modale, report e PDF sullo stesso payload business-first.

## Moduli impattati
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- nessun nuovo contratto dati
- riuso dei segnali gia letti dal motore su `D10 Stato operativo` e `D02 backlog tecnico`

## Ultime modifiche eseguite
- aggiunta estrazione piu robusta di top-N, top-1 e action advice nei prompt flotta.
- introdotto ranking deterministico con criteri operativi dichiarati.
- aggiunti motivi sintetici e `fare ora` per ogni mezzo in classifica.
- corretto il routing dei prompt deadline-focused con `priorita`.
- aggiornate etichette use-case e suggerimenti chat per i casi reali di priorita.

## File coinvolti
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- il ranking deve restare spiegabile e deterministicamente ordinato.
- meglio dichiarare prudenza o assenza di segnali che inventare una top-3 cosmetica.
- i casi `collaudo/pre-collaudo` restano un ramo dedicato, anche quando il prompt contiene parole come `priorita`.

## Vincoli da non rompere
- madre intoccabile.
- nessuna scrittura business o segreto lato client.
- nessun ranking opaco o numeri arbitrari.
- nessun refactor largo del motore unificato o della UI generale.

## Parti da verificare
- i domini fuori asse forte `D10 + D02` non partecipano ancora con lo stesso peso al ranking.
- il thread mostra ancora qualche metadato tecnico di supporto (`Affidabilita`, perimetro) che in futuro potra essere reso piu business-first.

## Rischi aperti
- nelle finestre temporali strette, come `oggi`, il ranking puo dover restare prudente per scarsita di segnali reali.
- se in futuro si allarga il ranking ad altri domini senza regole chiare, si rischia di perdere spiegabilita.

## Punti da verificare collegati
- NO

## Prossimo passo consigliato
- chiudere il quadro mezzo utile e gli output allineati, cosi la stessa base dati business-first governa chat, modale, report e PDF senza residui rumorosi.

## Cosa NON fare nel prossimo task
- non rifare il planner multi-dominio gia chiuso.
- non riaprire D04 o il PDF engine fuori dallo stretto necessario.
- non introdurre nuove metriche di priorita non dimostrabili dai segnali disponibili.

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
