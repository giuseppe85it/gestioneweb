# CONTINUITY REPORT - NEXT Dossier D02 read-only

## Contesto generale
- la NEXT ha ora il primo Dossier Mezzo con doppio ingresso dati controllato: `D01` per identita mezzo e `D02` per il primo blocco tecnico
- la legacy resta attiva e invariata; nessuna route o writer legacy e stata sostituita

## Modulo/area su cui si stava lavorando
- `Mezzi / Dossier`
- convergenza minima del dominio `D02 Operativita tecnica mezzo` nel Dossier NEXT

## Stato attuale
- stabile: il dettaglio `/next/mezzi-dossier/:targa` legge identita mezzo, backlog lavori, lavori chiusi e manutenzioni essenziali
- in corso: il blocco tecnico resta volutamente minimo e non copre workflow completi, materiali, costi o origini autisti ricostruite

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- reader canonico `D01` su `storage/@mezzi_aziendali`
- reader canonico `D02` su `@lavori` e `@manutenzioni`
- blocco tecnico nel Dossier con conteggi e liste iniziali read-only

## Prossimo step di migrazione
- estendere il Dossier solo se un altro dominio risulta importabile da `docs/data/DOMINI_DATI_CANONICI.md`
- in caso di nuovo lavoro su `D02`, restare nel perimetro read-only e chiarire meglio relazioni con materiali, costi e origini autisti prima di qualsiasi estensione forte

## Moduli impattati
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextMezziDossierPage.tsx`
- `src/next/nextOperativitaTecnicaDomain.ts`

## Contratti dati coinvolti
- `storage/@mezzi_aziendali`
- `storage/@lavori`
- `storage/@manutenzioni`
- domini logici `D01` e `D02`

## Ultime modifiche eseguite
- creato il reader canonico NEXT `D02`
- aggiunto nel Dossier il primo riepilogo tecnico read-only
- aggiornati `STATO_MIGRAZIONE_NEXT`, `STATO_ATTUALE_PROGETTO` e `STORICO_DECISIONI_PROGETTO`

## File coinvolti
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextMezziDossierPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Decisioni gia prese
- `D02` e importabile solo come convergenza minima `read-only`
- il Dossier non deve diventare writer dei lavori o delle manutenzioni
- il blocco tecnico non deve trascinare dentro materiali, costi o logica legacy di orchestrazione

## Vincoli da non rompere
- non importare domini ulteriori nel Dossier senza verifica preventiva in `docs/data/DOMINI_DATI_CANONICI.md`
- non trasformare `D02` in scrittura NEXT senza chiudere le incoerenze gia note del dominio
- non usare `DossierMezzo` legacy come sorgente funzionale del dettaglio NEXT

## Parti da verificare
- legame canonico tra lavori, manutenzioni, materiali e costo finale
- presenza e qualita dei campi origine per i record derivati da flussi autisti
- eventuale estensione del Dossier a viste tecniche piu profonde senza superare il livello di rischio ammesso

## Rischi aperti
- `D02` resta `SENSIBILE`
- un'estensione frettolosa del blocco tecnico puo reintrodurre accoppiamenti legacy che questo step ha evitato

## Punti da verificare collegati
- restano validi i punti generali di `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`; nessun nuovo punto aperto dedicato e stato aggiunto in questo step

## Prossimo passo consigliato
- scegliere il prossimo dominio del Dossier solo se risulta davvero importabile o, in alternativa, consolidare meglio la lettura `D02` senza uscire dal read-only

## Cosa NON fare nel prossimo task
- non introdurre scritture su lavori o manutenzioni
- non importare rifornimenti, documenti o costi solo per riempire il Dossier
- non collegare materiali e costi a `D02` senza una normalizzazione documentata

## Commit/hash rilevanti
- NON ESEGUITO - patch locale next dossier d02 read-only

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
