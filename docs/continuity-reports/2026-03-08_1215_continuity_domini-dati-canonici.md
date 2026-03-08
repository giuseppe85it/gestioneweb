# CONTINUITY REPORT - Domini dati canonici

## Contesto generale
- il progetto resta in fase di riordino architetturale e documentale per preparare una migrazione NEXT guidata dai domini reali e non da chiavi sparse
- dopo il censimento Step 1 esiste ora un file principale dominio-centrico che organizza i dataset fisici gia mappati nei documenti dati esistenti

## Modulo/area su cui si stava lavorando
- documentazione dati canonica
- costruzione della base dominio-centrica per la futura importazione dei moduli nella NEXT

## Stato attuale
- `docs/data/DOMINI_DATI_CANONICI.md` esiste ed e il riferimento principale di livello dominio
- `docs/data/MAPPA_COMPLETA_DATI.md` resta la mappa fisica dataset/chiavi
- `docs/data/REGOLE_STRUTTURA_DATI.md` resta il riferimento entity-level e contrattuale
- alcuni domini restano sensibili o bloccanti per importazione e richiedono approfondimento successivo

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- N/A

## Cosa e gia stato importato/migrato
- niente lato runtime
- documentazione riordinata per governare la migrazione futura

## Prossimo step di migrazione
- usare `docs/data/DOMINI_DATI_CANONICI.md` per lo Step 3: approfondimento entity-level mirato sui domini con stato `BLOCCANTE PER IMPORTAZIONE` o `DA VERIFICARE`

## Moduli impattati
- documentazione dati
- pianificazione importazione NEXT
- governance dati cross-modulo

## Contratti dati coinvolti
- `@mezzi_aziendali`
- `@colleghi`
- `@lavori`
- `@manutenzioni`
- `@autisti_sessione_attive`
- `@storico_eventi_operativi`
- `autisti_eventi`
- `@rifornimenti_autisti_tmp`
- `@rifornimenti`
- `@inventario`
- `@materialiconsegnati`
- `@ordini`
- `@preventivi`
- `@fornitori`
- `@documenti_mezzi`
- `@documenti_magazzino`
- `@documenti_generici`
- `@costiMezzo`
- `@analisi_economica_mezzi`
- `@documenti_cisterna`
- `@cisterna_schede_ia`
- `@cisterna_parametri_mensili`

## Ultime modifiche eseguite
- creato `docs/data/DOMINI_DATI_CANONICI.md`
- aggiornato `docs/INDICE_DOCUMENTAZIONE_PROGETTO.md` per registrare il nuovo file come riferimento operativo
- documentate regole di normalizzazione globali, priorita di importazione e relazioni cross-dominio

## File coinvolti
- docs/data/DOMINI_DATI_CANONICI.md
- docs/INDICE_DOCUMENTAZIONE_PROGETTO.md
- docs/data/CENSIMENTO_DOMINI_DATI_STEP1.md
- docs/data/MAPPA_COMPLETA_DATI.md
- docs/data/REGOLE_STRUTTURA_DATI.md

## Decisioni gia prese
- il repo va governato per domini logici e non per chiavi sparse
- dataset fisico e dominio logico devono restare distinti in ogni task futuro
- la NEXT non deve importare moduli in scrittura prima della normalizzazione del dominio corrispondente
- `DOMINI_DATI_CANONICI.md` e la nuova base dominio-centrica da consultare prima degli altri documenti dati operativi

## Vincoli da non rompere
- non toccare runtime legacy o codice applicativo in task documentali
- non trattare `tmp`, stream eventi paralleli o path Storage multipli come canonici senza chiusura dei punti aperti
- non aggiornare `AGENTS.md` in questo filone finche non richiesto esplicitamente

## Parti da verificare
- scelta della sorgente canonica unica per lo stream eventi autisti
- contratto finale allegati preventivi e relativi path Storage
- coerenza writer/reader di inventario e materiali consegnati
- rapporto canonico tra rifornimenti temporanei e rifornimenti consolidati
- governance documenti IA e analisi economica aggregate

## Rischi aperti
- importazioni NEXT premature su domini sensibili possono consolidare incoerenze gia presenti
- i domini piu densi hanno writer multipli e punti di convergenza con Dossier e Centro di Controllo

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`: Stream eventi autisti canonico definitivo
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`: Contratto finale allegati preventivi
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`: Coerenza flusso inventario / materiali

## Prossimo passo consigliato
- aprire uno Step 3 di approfondimento mirato per i domini `Autisti, sessioni ed eventi di campo`, `Rifornimenti e consumi`, `Magazzino, inventario e movimenti materiali`, `Procurement, ordini, preventivi e fornitori`, `Documentale IA, libretti e configurazione IA`

## Cosa NON fare nel prossimo task
- non migrare moduli NEXT in scrittura partendo solo da nomi chiave o collection
- non aggiornare dataset o regole runtime senza passare dal dominio e dalle relative incoerenze gia marcate nel file canonico

## Commit/hash rilevanti
- `NON ESEGUITO`

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- `docs/data/CENSIMENTO_DOMINI_DATI_STEP1.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
