# CONTINUITY REPORT - Checklist unica IA interna

## Contesto generale
- il sottosistema IA interna esiste gia come perimetro isolato sotto `/next/ia/interna*`
- i task precedenti hanno prodotto audit, linee guida, stato avanzamento, scaffolding isolato, fix crash e primo use case report targa
- mancava una fonte operativa unica che tenesse insieme questi avanzamenti senza doppia verita

## Modulo/area su cui si stava lavorando
- governance documentale della IA interna
- checklist unica di stato operativo

## Stato attuale
- esiste ora `docs/product/CHECKLIST_IA_INTERNA.md` come fonte di verita operativa
- la checklist ricostruisce retroattivamente i blocchi gia chiusi o aperti con soli fatti verificabili
- il filone futuro `Modello camion con IA` e registrato come `NON FATTO`

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY per lo scaffolding IA interno

## Cosa e gia stato importato/migrato
- audit architetturale IA interna
- decisione di innesto lato clone/NEXT
- linee guida IA interna
- stato avanzamento IA interna
- subtree isolato `/next/ia/interna*`
- model/types locali
- contratti stub e repository mock
- tracking isolato non invasivo
- fix crash tracking snapshot
- primo use case report targa in anteprima

## Prossimo step di migrazione
- usare la checklist unica come punto di ingresso obbligatorio prima di ogni nuovo task IA
- aggiornare la checklist in parallelo ai prossimi task IA senza aprire checklist duplicate

## Moduli impattati
- documentazione IA interna
- registri clone/NEXT

## Contratti dati coinvolti
- nessuno modificato

## Ultime modifiche eseguite
- creata checklist unica con stati `FATTO`, `IN CORSO`, `NON FATTO`, `BLOCCATO`
- allineati `STATO_AVANZAMENTO_IA_INTERNA`, `LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA` e `STATO_MIGRAZIONE_NEXT`
- registrata la nuova regola: ogni futuro task IA deve aggiornare la checklist unica

## File coinvolti
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-12_2219_docs_checklist-ia-interna-unica.md
- docs/continuity-reports/2026-03-12_2219_continuity_checklist-ia-interna-unica.md

## Decisioni gia prese
- la checklist unica e la nuova fonte di verita operativa del sottosistema IA interno
- i documenti di stato e linee guida devono referenziarla, non duplicarla
- `Modello camion con IA` resta filone futuro e non va segnato come avanzato senza task/documentazione verificabili

## Vincoli da non rompere
- nessuna modifica runtime in task documentali come questo
- nessuna invenzione di avanzamenti non dimostrati
- tutti i testi visibili nei markdown devono restare in italiano

## Parti da verificare
- policy Firestore effettive
- policy Storage effettive
- backend IA dedicato e gestione segreti lato server
- workflow approvazione/rollback e archivio persistente artifact

## Rischi aperti
- rischio di doppia verita se in futuro si torna a mantenere checklist locali dentro altri documenti
- rischio di marcare come avanzato il filone `Modello camion con IA` senza prima creare documentazione o task dedicati

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- nel prossimo task IA, partire da `docs/product/CHECKLIST_IA_INTERNA.md`, aggiornare la voce pertinente e solo dopo estendere stato avanzamento o linee guida se serve contesto aggiuntivo

## Cosa NON fare nel prossimo task
- non toccare runtime solo per sincronizzare la checklist
- non creare una seconda checklist IA in un altro file
- non spostare `Modello camion con IA` da `NON FATTO` senza prove concrete nel repo

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

