# CONTINUITY REPORT - NEXT Flotta read-only

## Contesto generale
- la NEXT ha ora shell runtime separata e il primo ingresso dati reale `read-only`
- la legacy resta il sistema operativo attivo; nessuna route legacy e stata sostituita

## Modulo/area su cui si stava lavorando
- `/next/mezzi-dossier`
- dominio `Anagrafiche flotta e persone` (`D01`)

## Stato attuale
- stabile: esiste un reader canonico NEXT dedicato che legge solo `storage/@mezzi_aziendali`
- in corso: il Dossier Mezzo resta solo UI e non legge ancora convergenze di altri domini

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- shell UI della macro-area `Mezzi / Dossier`
- elenco mezzi reale `read-only`
- ricerca locale e filtro categoria

## Prossimo step di migrazione
- aprire il primo dettaglio/Dossier `read-only` riusando il pivot `targa/id` del reader canonico, senza importare ancora lavori, rifornimenti, documenti o costi

## Moduli impattati
- `src/next/NextMezziDossierPage.tsx`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/next-shell.css`

## Contratti dati coinvolti
- `storage/@mezzi_aziendali`
- dominio logico `Anagrafiche flotta e persone`
- `@colleghi` mappato a livello dominio ma non letto in questo step

## Ultime modifiche eseguite
- creato il reader canonico NEXT `read-only` per `D01`
- collegata la pagina `/next/mezzi-dossier` a dati reali del solo dataset stabile
- aggiornati `STATO_MIGRAZIONE_NEXT`, `STATO_ATTUALE_PROGETTO` e `STORICO_DECISIONI_PROGETTO`

## File coinvolti
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/NextMezziDossierPage.tsx`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Decisioni gia prese
- il dominio `D01` e `IMPORTABILE READ-ONLY`
- la prima sorgente fisica canonica per la NEXT e `storage/@mezzi_aziendali`
- `@colleghi` non entra finche non serve a una vista successiva dichiarata

## Vincoli da non rompere
- non importare writer legacy o introdurre scritture nella NEXT
- non leggere domini extra o chiavi sparse fuori dal perimetro dichiarato
- non trasformare l'elenco mezzi in un Dossier implicito o in un clone della pagina legacy

## Parti da verificare
- quando e come includere `@colleghi` nelle viste NEXT
- ordine di convergenza dei prossimi domini verso il Dossier Mezzo

## Rischi aperti
- campi incompleti del dataset (`marca`, `modello`, `autistaNome`) restano visibili e non vanno corretti lato UI
- il Dossier non e ancora operativo: chi lo estende deve restare nel perimetro `read-only`

## Punti da verificare collegati
- nessun nuovo punto aperto aggiunto; restano validi i punti generali in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- implementare il primo dettaglio mezzo `read-only` partendo dallo stesso reader canonico e dal documento `docs/data/DOMINI_DATI_CANONICI.md`

## Cosa NON fare nel prossimo task
- non importare ancora `lavori`, `rifornimenti`, `documenti`, `costi` o sessioni autisti
- non leggere `@colleghi` se non esiste un bisogno funzionale dichiarato e documentato

## Commit/hash rilevanti
- NON ESEGUITO - patch locale next flotta read-only

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
