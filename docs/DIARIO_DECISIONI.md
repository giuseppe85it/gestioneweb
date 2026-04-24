# DIARIO DECISIONI STRATEGICHE

Ultimo aggiornamento: 2026-04-23
Responsabile: Giuseppe

## Come funziona questo file

Qui vivono le decisioni strategiche prese dal proprietario del progetto. Non sono stato tecnico (quello sta nel codice). Sono scelte di prodotto e perimetro.

Regole:
- ogni decisione ha una data
- le decisioni non vengono mai corrette retroattivamente
- se cambio idea, aggiungo una nuova entry sotto con la nuova decisione e il motivo
- cosi si vede l'evoluzione del pensiero nel tempo
- il file non va tenuto allineato al codice: e un registro storico, non una fotografia del presente

## Entries

### 2026-04-23 — Mezzo360 e Autista360: non portati nella NEXT
Decisione: non porto `Mezzo360` e `Autista360` dalla madre alla NEXT.
Motivo del momento: voglio sostituirli con capability IA + chat unificata invece di replicare due pagine custom.
Status: scelta attiva ma non definitiva, Giuseppe ha dichiarato "non so quanto adesso sia conveniente".
Conseguenza per gli audit: questi due moduli NON vanno trattati come gap tecnici di migrazione, ma come moduli a obsolescenza pianificata in valutazione.

### 2026-04-23 — Dettaglio Ordine inglobato in Materiali da ordinare
Decisione: `Dettaglio Ordine` non e piu un modulo separato.
Motivo del momento: pulizia UX, tab unico piu chiaro, meno frammentazione.
Status: gia fatto nel codice. `NextDettaglioOrdinePage` e solo un redirect, la logica vive in `NextMaterialiDaOrdinarePage` + `NextProcurementReadOnlyPanel`.
Conseguenza per gli audit: negli audit futuri, `Dettaglio Ordine` NON va valutato come modulo autonomo.

### 2026-04-23 — Materiali da ordinare non ancora sistemato
Decisione: nessuna decisione di perimetro, solo presa d'atto.
Stato reale: pensavo fosse sistemato, in realta la verifica del 2026-04-23 mostra che e ancora read-only. Il `CONFERMA ORDINE` blocca le scritture con alert e le foto stanno solo in locale.
Conseguenza: resta nella lista dei gap scriventi da chiudere.

### 2026-04-23 — Materiali da ordinare NEXT chiuso al 100%
Decisione: primo modulo NEXT davvero scrivente.
Writer attivi: salvaOrdine, foto fabbisogno (upload+delete), salva dettaglio+arrivato, elimina ordine, foto dettaglio.
File toccati: src/utils/cloneWriteBarrier.ts, src/next/NextMaterialiDaOrdinarePage.tsx, src/next/NextProcurementReadOnlyPanel.tsx, storage.rules.
Storage rules deployate manualmente con firebase deploy --only storage.
Known issue accettato: file orfani su Storage se l'utente carica foto nel dettaglio e chiude senza salvare.
Conseguenza: il conteggio gap scriventi della NEXT passa da 7 a 6 con la sola chiusura di Materiali da ordinare.

### 2026-04-23 — Acquisti NEXT e alias URL di Materiali da ordinare
Decisione: presa d'atto, non nuova scelta. Acquisti NEXT non e un modulo separato.
NextAcquistiPage e un wrapper di 5 righe + NextProcurementStandalonePage fa Navigate replace a /next/materiali-da-ordinare?tab=ordini.
Writer: ereditati al 100% da Materiali da ordinare. Per effetto della chiusura odierna, Acquisti e gia scrivente senza altri interventi.
Cosa resta da testare: il flusso IA preventivi (estrazione da PDF tramite endpoint preventivo-extract) dovrebbe funzionare perche le deroghe barriera sono gia attive, ma non e stato testato nel browser il 2026-04-23. Da verificare.
Conseguenza per gli audit: il conteggio gap scriventi della NEXT passa da 6 a 5. L'audit del 2026-04-22 leggeva Acquisti come modulo autonomo, lettura errata.

## Convenzioni per future entries

Template:
### YYYY-MM-DD — Titolo corto della decisione
Decisione: cosa decido
Motivo del momento: perche lo decido oggi
Status: scelta attiva / in valutazione / rivalutata
Conseguenza: cosa cambia per il codice / per gli audit / per la roadmap
