# CONTINUITY REPORT - Audit e rafforzamento report mezzo IA interno

## Contesto generale
- Il sottosistema IA interna vive solo nel clone `/next/ia/interna*`, in sola lettura e senza backend IA reale.
- Dopo il rafforzamento del lato autista badge-first, il task si e concentrato sul lato mezzo per verificare se il report targa perdesse record o presentasse come completa una copertura in realta parziale.

## Modulo/area su cui si stava lavorando
- report mezzo / targa read-only
- facade `internalAiVehicleReportFacade`
- composito `nextDossierMezzoDomain` e layer mezzo gia riusati dal report

## Stato attuale
- Il report mezzo continua a leggere:
  - lavori;
  - manutenzioni / gomme;
  - rifornimenti;
  - materiali / movimenti;
  - documenti / costi;
  - analisi economica salvata.
- La preview e ora piu corretta nei casi in cui l'unica copertura reale arriva da:
  - movimenti materiali;
  - analisi economica legacy salvata.
- La sezione `Documenti, costi e analisi` non viene piu marcata come vuota quando l'analisi economica salvata esiste davvero ma i documenti/costi nel periodo sono assenti.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- report mezzo read-only
- report autista read-only
- report combinato mezzo + autista + periodo
- filtri periodo
- archivio artifact locale
- memoria locale
- matching autista badge-first

## Prossimo step di migrazione
- Aprire un task dedicato se si vuole rafforzare davvero il lato mezzo su:
  - eventi gomme fuori `@manutenzioni`;
  - criterio temporale dei materiali;
  - eventuale convergenza documentale aggiuntiva oltre il perimetro clone-safe attuale.

## Moduli impattati
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`

## Contratti dati coinvolti
- `storage/@mezzi_aziendali`
- `storage/@lavori`
- `storage/@manutenzioni`
- `storage/@rifornimenti`
- `storage/@rifornimenti_autisti_tmp`
- `storage/@materialiconsegnati`
- `storage/@costiMezzo`
- `@documenti_mezzi`
- `@documenti_magazzino`
- `@documenti_generici`
- `@analisi_economica_mezzi`

## Ultime modifiche eseguite
- Audit tecnico del report mezzo e dei layer realmente usati dal facade.
- Corretto il criterio di copertura della preview, che ora considera anche materiali e analisi economica salvata.
- Riallineata la sezione `Documenti, costi e analisi` per non dichiararla vuota quando esiste solo la parte analisi fuori filtro.
- Aggiornata la tracciabilita documentale del clone e della checklist IA.

## File coinvolti
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Nessun ampliamento improvvisato dei layer mezzo.
- Nessun uso di nuove fonti procurement o writer business.
- Nessun tentativo di forzare un filtro periodo sui materiali finche il dominio resta esplicitamente misto e legacy.

## Vincoli da non rompere
- Nessuna scrittura business.
- Nessun riuso runtime IA legacy.
- Tutti i testi visibili nel gestionale devono restare in italiano.
- Meglio dichiarare una copertura parziale che promuovere a completa una lettura incompleta.

## Parti da verificare
- Quanti eventi gomme reali restano fuori dal report mezzo perche oggi non entrano nel reader `nextManutenzioniGommeDomain`.
- Quanto pesa davvero la quota di movimenti materiali collegati solo via `destinatario.label` o `destinatario.refId`.
- Se esistono casi reali in cui l'analisi economica salvata e l'unica copertura mezzo utile per l'utente finale.

## Rischi aperti
- Gli eventi gomme fuori `@manutenzioni` restano assenti dal report mezzo finche non si apre un task dedicato sul layer.
- Il blocco materiali resta utile ma strutturalmente parziale.
- Il blocco documenti/costi non copre ancora il perimetro procurement completo del gestionale.

## Punti da verificare collegati
- nessuno esplicito in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Priorita 1: task dedicato sulla copertura gomme del report mezzo.
- Priorita 2: task dedicato sulla strategia materiali/periodo del report mezzo.
- Priorita 3: verificare se la convergenza procurement debba restare fuori dal report mezzo IA o essere coperta da un layer clone-safe futuro.

## Cosa NON fare nel prossimo task
- Non forzare eventi gomme da dataset non ancora normalizzati direttamente nel facade IA.
- Non introdurre filtri periodo “finti” sui materiali solo per mostrare piu numeri.
- Non aprire `@preventivi` o approvazioni nel report mezzo senza un task dominio dedicato.

## Commit/hash rilevanti
- `NON ESEGUITO`

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

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
