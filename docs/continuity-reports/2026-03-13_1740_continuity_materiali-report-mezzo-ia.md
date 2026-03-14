# CONTINUITY REPORT - Materiali report mezzo IA interno

## Contesto generale
- Il progetto resta nella fase clone fedele `read-only` della madre, con sottosistema IA interno isolato sotto `/next/ia/interna*`.
- Le scritture business, i backend IA reali e il riuso runtime dei moduli IA legacy restano fuori perimetro.

## Modulo/area su cui si stava lavorando
- Blocco `MATERIALI / MOVIMENTI` del report mezzo IA interno.
- Perimetro limitato a dominio materiali clone-safe, aggregatore dossier clone e facade del report IA.

## Stato attuale
- Il report mezzo distingue ora match materiali `forti` e `plausibili` e dichiara la copertura reale del blocco.
- Il filtro periodo materiali viene esposto come `affidabile`, `parziale` o `non dimostrabile` in base ai record davvero databili.
- Il supporto costi materiali resta presente ma ancora descrittivo, derivato da `@documenti_magazzino`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Lettura read-only di `@materialiconsegnati` nel layer clone dedicato.
- Aggregazione materiali nel dossier clone e nel report mezzo IA interno.
- Trasparenza UI sui livelli di affidabilita del match e sulla copertura periodo.

## Prossimo step di migrazione
- Audit dominio dedicato se si vuole rendere piu forte il collegamento materiali/costi oltre il supporto descrittivo attuale.

## Moduli impattati
- src/next/domain/nextMaterialiMovimentiDomain.ts
- src/next/domain/nextDossierMezzoDomain.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts

## Contratti dati coinvolti
- `storage/@materialiconsegnati`
- `storage/@mezzi_aziendali`
- `@documenti_magazzino`

## Ultime modifiche eseguite
- Classificato il match mezzo/materiale in `forte` o `plausibile`.
- Bloccati i casi conflittuali o non dimostrabili dal report materiali.
- Aggiunta trasparenza esplicita sulla copertura del filtro periodo e sui limiti del supporto costi.

## File coinvolti
- src/next/domain/nextMaterialiMovimentiDomain.ts
- src/next/domain/nextDossierMezzoDomain.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Nessun matching debole deve essere presentato come certo nel report mezzo IA interno.
- Il clone deve restare `read-only` e non puo riusare runtime IA legacy o riaprire writer business.

## Vincoli da non rompere
- Nessuna scrittura reale su Firestore business o Storage business.
- Nessuna modifica alla madre o ai flussi correnti del gestionale.
- Tutti i testi visibili del clone devono restare in italiano.

## Parti da verificare
- Se in dati futuri compariranno record materiali collegati solo con `destinatario.refId = id mezzo`, il percorso plausibile andra rivalutato su casi reali.
- Il legame costi materiali `@documenti_magazzino -> mezzo` resta non transazionale e va confermato prima di ampliarlo.

## Rischi aperti
- Doppia semantica legacy di `destinatario.refId` tra `MaterialiConsegnati` e `Manutenzioni`.
- Assenza di una chiave forte dedicata nei documenti magazzino per collegare in modo certo ogni costo materiali al mezzo.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Coerenza flusso inventario / materiali

## Prossimo passo consigliato
- Task dominio separato sui costi materiali e sui writer legacy del magazzino, solo se serve aumentare la precisione oltre l'audit attuale del report IA.

## Cosa NON fare nel prossimo task
- Non introdurre merge euristici in UI o facade IA per recuperare record non dimostrati.
- Non toccare writer legacy, Firestore business o Storage business senza un audit dati dedicato.

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
