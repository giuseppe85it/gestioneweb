# CONTINUITY REPORT - Censimento domini dati

## Contesto generale
- il progetto resta in fase di consolidamento documentale con legacy attiva e NEXT ancora guidata da blueprint/read-only
- questo task ha eseguito solo censimento dati e pre-normalizzazione documentale, senza toccare il runtime

## Modulo/area su cui si stava lavorando
- area principale: documentazione dati
- perimetro task recente: identificazione domini dati reali, moduli pivot, aree critiche e struttura del futuro file canonico

## Stato attuale
- esiste ora un report intermedio di censimento pronto a guidare lo step 2
- i domini piu densi risultano Autisti, Acquisti/Magazzino, Dossier/Analisi e Documentale IA

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- N/A

## Cosa e gia stato importato/migrato
- niente a livello runtime
- prodotto solo un report docs-only di base per la normalizzazione

## Prossimo step di migrazione
- N/A

## Moduli impattati
- documentazione dati
- pianificazione normalizzazione

## Contratti dati coinvolti
- `@mezzi_aziendali`
- `@lavori`
- `@manutenzioni`
- `@rifornimenti`
- `@rifornimenti_autisti_tmp`
- `@inventario`
- `@materialiconsegnati`
- `@ordini`
- `@preventivi`
- `@listino_prezzi`
- `@fornitori`
- `@autisti_sessione_attive`
- `@storico_eventi_operativi`
- `@segnalazioni_autisti_tmp`
- `@controlli_mezzo_autisti`
- `@richieste_attrezzature_autisti_tmp`
- `@cambi_gomme_autisti_tmp`
- `@gomme_eventi`
- `@documenti_mezzi`
- `@documenti_magazzino`
- `@documenti_generici`
- `@costiMezzo`
- `@analisi_economica_mezzi`

## Ultime modifiche eseguite
- creato report intermedio `docs/data/CENSIMENTO_DOMINI_DATI_STEP1.md`
- proposta la struttura del futuro file canonico `docs/data/DOMINI_DATI_CANONICI.md`
- evidenziati 5 punti critici che non vanno normalizzati alla cieca

## File coinvolti
- docs/data/CENSIMENTO_DOMINI_DATI_STEP1.md
- docs/change-reports/2026-03-08_1153_docs_censimento-domini-dati-step1.md
- docs/continuity-reports/2026-03-08_1153_continuity_censimento-domini-dati.md

## Decisioni gia prese
- step 1 resta un censimento e non il contratto finale
- per lo step 2 conviene creare un nuovo file principale dominio-centrico, non limitarsi ad ampliare `MAPPA_COMPLETA_DATI.md`

## Vincoli da non rompere
- nessuna modifica a `src/` o alla legacy runtime in questo filone
- mantenere separati fatti confermati e punti `DA VERIFICARE`
- non aggiornare `STATO_MIGRAZIONE_NEXT.md` se non cambia lo stato reale della NEXT

## Parti da verificare
- stream eventi autisti canonico definitivo
- contratto allegati preventivi
- coerenza writer/reader su inventario e materiali
- normalizzazione finale rifornimenti tmp/canonico

## Rischi aperti
- documentare come canonico un dominio ancora incoerente
- sottostimare i punti di convergenza tra Documentale IA, Costi e Magazzino

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- costruire nello step 2 il file `docs/data/DOMINI_DATI_CANONICI.md` usando come ordine i domini emersi dal censimento e non l'elenco alfabetico delle chiavi

## Cosa NON fare nel prossimo task
- non partire da refactor codice o rinomina dataset
- non chiudere implicitamente i punti aperti su autisti, preventivi, inventario o rifornimenti

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`
- `docs/flow-master/FLUSSI_OPERATIVI_CRITICI.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
