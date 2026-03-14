# CONTINUITY REPORT - Documenti costi report mezzo IA interno

## Contesto generale
- Il progetto resta nella fase clone fedele `read-only` della madre, con sottosistema IA interno isolato sotto `/next/ia/interna*`.
- Le scritture business, i backend IA reali e il riuso runtime dei moduli IA legacy restano fuori perimetro.

## Modulo/area su cui si stava lavorando
- Blocco `DOCUMENTI / COSTI / PERIMETRO ECONOMICO` del report mezzo IA interno.
- Perimetro limitato a dominio documenti-costi clone-safe, aggregatore dossier clone e facade del report IA.

## Stato attuale
- Il report mezzo distingue ora documenti/costi diretti, snapshot analitico legacy salvato e workflow procurement/approvazioni fuori perimetro.
- Il filtro periodo dei documenti/costi viene esposto solo sui record diretti davvero databili.
- Il blocco economico resta trasparente sul fatto che la copertura non coincide con l'intero workflow procurement della madre.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Lettura read-only di `@costiMezzo` e `@documenti_*` nel layer clone dedicato.
- Supporto separato allo snapshot `@analisi_economica_mezzi` nell'aggregatore dossier clone.
- Trasparenza UI su filtro periodo diretto e su dataset economici fuori perimetro del report mezzo.

## Prossimo step di migrazione
- Task dominio separato solo se serve decidere se e come far convergere in futuro procurement/preventivi/approvazioni dentro una lettura economica mezzo-centrica spiegabile.

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
- Separato il perimetro del report tra documenti/costi diretti e snapshot analitico.
- Dichiarato nel report che procurement e approvazioni esistono ma restano fuori dal blocco base.
- Aggiunta trasparenza sul filtro periodo dei soli documenti/costi diretti.

## File coinvolti
- src/next/domain/nextDocumentiCostiDomain.ts
- src/next/domain/nextDossierMezzoDomain.ts
- src/next/internal-ai/internalAiVehicleReportFacade.ts
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Il report mezzo IA interno non deve fondere documenti diretti, snapshot analitico e workflow procurement come se fossero un unico blocco omogeneo.
- `@preventivi` e `@preventivi_approvazioni` restano fuori dal perimetro base del report mezzo finche non esiste una decisione dominio dedicata.

## Vincoli da non rompere
- Nessuna scrittura reale su Firestore business o Storage business.
- Nessuna modifica alla madre o ai flussi correnti del gestionale.
- Tutti i testi visibili del clone devono restare in italiano.

## Parti da verificare
- Se in dati futuri `@costiMezzo` tornera a popolarsi, va ricontrollato il peso relativo tra costi manuali e documenti IA.
- Se in futuro si vorra far convergere `@preventivi` nel perimetro mezzo, servira un task dedicato sul contratto allegati e sul link mezzo/procurement.

## Rischi aperti
- `@documenti_magazzino` resta fonte parziale senza targa diretta e non va usata come documento economico certo del mezzo.
- Il contratto allegati preventivi resta incoerente e impedisce di trattare `@preventivi` come estensione banale del blocco economico del report.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Contratto finale allegati preventivi

## Prossimo passo consigliato
- Tenere il report mezzo sul perimetro attuale e aprire solo dopo, se serve, un task dedicato su procurement/preventivi/approvazioni come dominio separato.

## Cosa NON fare nel prossimo task
- Non far entrare `@preventivi` o `@preventivi_approvazioni` nel report mezzo con match deboli o scorciatoie lato UI.
- Non usare `updatedAt` dello snapshot analitico come se fosse la data evento di un documento/costo base.

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
