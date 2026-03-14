# CONTINUITY REPORT - Procurement preventivi approvazioni report mezzo IA interno

## Contesto generale
- Il progetto resta nella fase clone fedele `read-only` della madre, con sottosistema IA interno isolato sotto `/next/ia/interna*`.
- Le scritture business, i backend IA reali e il riuso runtime dei moduli IA legacy restano fuori perimetro.

## Modulo/area su cui si stava lavorando
- Perimetro `procurement / preventivi / approvazioni` rispetto al report mezzo IA interno.
- Perimetro limitato a dominio documenti-costi clone-safe, aggregatore dossier clone e facade del report IA.

## Stato attuale
- Il report mezzo distingue ora in modo esplicito:
  - documenti/costi diretti del mezzo;
  - snapshot analitico `@analisi_economica_mezzi`;
  - procurement/preventivi/approvazioni come dominio separato.
- La decisione strutturale corrente e che `storage/@preventivi` resta fuori dal blocco economico diretto del report mezzo.
- `storage/@preventivi_approvazioni` puo comparire solo come supporto read-only separato, e sui dati correnti annota un documento diretto in `@documenti_mezzi`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Audit read-only di `storage/@preventivi` e `storage/@preventivi_approvazioni` dentro il dominio documenti-costi clone.
- Nuovo stato `procurementPerimeter` nell'aggregatore dossier clone.
- Testi e conteggi del report IA aggiornati per dichiarare `fuori_perimetro` o `solo parziale` senza falsa completezza economica.

## Prossimo step di migrazione
- Solo se richiesto, aprire un task dominio separato per decidere se costruire in futuro un layer mezzo-centrico dedicato al procurement.

## Moduli impattati
- src/next/domain/nextDocumentiCostiDomain.ts
- src/next/domain/nextDossierMezzoDomain.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts

## Contratti dati coinvolti
- `storage/@costiMezzo`
- `@documenti_mezzi`
- `@documenti_magazzino`
- `@documenti_generici`
- `@analisi_economica_mezzi`
- `storage/@preventivi`
- `storage/@preventivi_approvazioni`

## Ultime modifiche eseguite
- Aggiunta lettura audit read-only dei dataset procurement reali.
- Resa esplicita la decisione di perimetro nel report mezzo IA e nel riepilogo dossier clone.
- Corretta la compilazione del composito dossier dopo l'introduzione del nuovo campo `procurementPerimeter`.

## File coinvolti
- src/next/domain/nextDocumentiCostiDomain.ts
- src/next/domain/nextDossierMezzoDomain.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- `storage/@preventivi` non entra oggi nel report mezzo IA come blocco economico diretto.
- `storage/@preventivi_approvazioni` non va trattato come copertura procurement del mezzo, ma solo come overlay read-only su record diretti gia collegati alla targa.
- Documenti/costi diretti, snapshot analitici e procurement devono restare separati nel report.

## Vincoli da non rompere
- Nessuna scrittura reale su Firestore business o Storage business.
- Nessuna modifica alla madre o ai flussi correnti del gestionale.
- Tutti i testi visibili del clone devono restare in italiano.

## Parti da verificare
- Se in futuro `storage/@preventivi` iniziera a esporre `targa` o `mezzoTarga` forte, va rivalutata la decisione di perimetro con task separato.
- Se il workflow capo comincera ad approvare record nativi di procurement e non solo documenti diretti, va ricontrollato il senso del supporto `@preventivi_approvazioni`.

## Rischi aperti
- Il contratto allegati preventivi resta incoerente e impedisce di trattare `@preventivi` come estensione banale del blocco economico mezzo-centrico.
- Un ingresso affrettato del procurement nel report mezzo creerebbe falsa completezza economica e match non dimostrati.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Contratto finale allegati preventivi

## Prossimo passo consigliato
- Lasciare il procurement fuori dal report mezzo IA finche non esiste una base mezzo-centrica forte e dimostrabile.

## Cosa NON fare nel prossimo task
- Non far entrare `storage/@preventivi` nel report mezzo con euristiche lato testo, nome file o allegati.
- Non usare `@preventivi_approvazioni` come scorciatoia per dire che il procurement del mezzo e coperto.

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
- `docs/product/CHECKLIST_IA_INTERNA.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
