# CONTINUITY REPORT - Analisi Economica route clone

## Contesto generale
- Il progetto resta nella fase di clone fedele `read-only` della madre su `src/next/*`.
- La patch recente non amplia il perimetro del modulo: riallinea solo il routing clone a una route madre reale gia coperta in lettura.

## Modulo/area su cui si stava lavorando
- `Analisi Economica`
- Perimetro recente: trasformare la pagina clone gia esistente da sottovista embedded del dossier a route clone reale dedicata.

## Stato attuale
- `Analisi Economica` clone e ora apribile anche su `/next/analisi-economica/:targa`.
- Il vecchio ingresso `?view=analisi` del dossier non e stato rimosso brutalmente: viene riallineato via redirect tecnico alla nuova route.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Pagina clone read-only `NextAnalisiEconomicaPage`
- Lettura dati tramite domain clone del dossier
- Route clone dedicata
- Ingresso dal dossier clone

## Prossimo step di migrazione
- Valutare se chiudere il gap residuo del blocco mezzo con route dedicate anche per le viste oggi ancora interne (`Gomme`, `Rifornimenti`), partendo prima dall'audit di convenienza.

## Moduli impattati
- `Mezzi / Dossier`
- `Analisi Economica`

## Contratti dati coinvolti
- `@costiMezzo`
- `@analisi_economica_mezzi`
- `@documenti_mezzi`
- `@documenti_magazzino`
- `@documenti_generici`
- `@mezzi_aziendali`

## Ultime modifiche eseguite
- Aggiunta la route `/next/analisi-economica/:targa` nel runtime clone.
- Aggiornato il dossier clone per aprire `Analisi Economica` sulla route dedicata.
- Sostituito il vecchio rendering embedded `?view=analisi` con redirect tecnico alla nuova route.

## File coinvolti
- `src/App.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Il modulo resta read-only: nessuna rigenerazione IA, nessuna scrittura su `@analisi_economica_mezzi`, nessuna riattivazione endpoint esterno.
- La pagina clone esistente va riusata, non riscritta.
- La convivenza embedded/route dedicata va risolta con una sola fonte di rendering: la route dedicata.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna lettura raw nella UI clone.
- Nessuna integrazione cieca del runtime IA `analisi_economica_mezzo`.
- Aggiornare sempre `REGISTRO_MODIFICHE_CLONE.md` e `STATO_MIGRAZIONE_NEXT.md` per ogni patch clone.

## Parti da verificare
- Se le azioni locali PDF/share/WhatsApp di `NextAnalisiEconomicaPage` vadano lasciate cosi o ristrette in una patch futura dedicata.
- Se convenga dare route dedicate anche a `Gomme` e `Rifornimenti` oppure lasciarle interne al dossier.

## Rischi aperti
- L'area continua ad appoggiarsi a dataset e snapshot documentali legacy eterogenei, anche se confinati nel domain clone.
- La governance degli endpoint IA/PDF multipli resta un punto aperto di progetto, anche se questa patch non li riattiva.

## Punti da verificare collegati
- `Governance endpoint IA/PDF multipli` in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Se si vuole chiudere un altro gap di routing mezzo-centrico, fare un audit mirato sulla convenienza di route dedicate clone per `Gomme` o `Rifornimenti`.

## Cosa NON fare nel prossimo task
- Non mischiare `Analisi Economica` con `Cisterna` o `Materiali da Ordinare` nello stesso task.
- Non riattivare rigenerazione IA o salvataggi backend dentro `NextAnalisiEconomicaPage`.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`
- `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/security/SICUREZZA_E_PERMESSI.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
