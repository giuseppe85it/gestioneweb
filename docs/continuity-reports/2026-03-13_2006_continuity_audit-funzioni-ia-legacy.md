# CONTINUITY REPORT - Audit funzioni IA legacy da assorbire nella nuova IA

## Contesto generale
- Il progetto resta nella fase clone fedele `read-only` della madre, con sottosistema IA interno isolato sotto `/next/ia/interna*`.
- Nessun backend IA legacy puo diventare runtime canonico della nuova IA interna, ma il valore business gia presente nel legacy non deve andare perso.

## Modulo/area su cui si stava lavorando
- Audit strategico e documentale delle funzioni IA legacy della madre gia presenti nel repo.
- Perimetro limitato a censimento capability, decisioni di assorbimento e allineamento checklist/stato/registri.

## Stato attuale
- Esiste ora una mappa permanente in `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`.
- La mappa distingue:
  - capability da assorbire rifacendo il flusso;
  - capability da tenere in wave o perimetro separato;
  - riferimenti tecnici utili ma non canonici;
  - elementi da lasciare fuori dal perimetro iniziale.
- Le capability business da non perdere sono state fissate con priorita alta:
  - estrazione libretto mezzo;
  - estrazione documenti;
  - analisi economica mezzo;
  - estrazione preventivi.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Nessuna nuova feature runtime.
- Solo documentazione permanente che definisce cosa il nuovo sottosistema IA deve assorbire dal legacy senza riusarne i canali a runtime.

## Prossimo step di migrazione
- Usare la mappa legacy come base obbligatoria prima di ogni task che propone una nuova capability IA nel clone.
- Aprire task separati solo sulle capability ad alta priorita, senza mischiare domini diversi nello stesso intervento.

## Moduli impattati
- docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Contratti dati coinvolti
- Nessun contratto dati modificato.
- Richiamati solo come contesto i dataset e backend legacy gia esistenti:
  - `@impostazioni_app`
  - `@documenti_*`
  - `@analisi_economica_mezzi`
  - `@preventivi`
  - `@preventivi_approvazioni`
  - `@documenti_cisterna`
  - `storage/@mezzi_aziendali`

## Ultime modifiche eseguite
- Creata la matrice decisionale permanente delle funzioni IA legacy del repo.
- Reso obbligatorio il richiamo a questa matrice nelle linee guida del sottosistema IA.
- Aggiornati checklist, stato avanzamento e stato migrazione NEXT per registrare priorita e limiti.

## File coinvolti
- docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Decisioni gia prese
- Il nuovo sottosistema IA deve assorbire il valore di business di `libretto`, `documenti`, `analisi economica` e `preventivi`.
- Nessun writer business, segreto lato client o backend legacy della madre puo essere riusato come runtime canonico.
- `cisterna` e `stamp_pdf` non entrano nel core iniziale senza task separato e backend/perimetro dedicato.

## Vincoli da non rompere
- Nessuna scrittura reale su Firestore business o Storage business.
- Nessuna modifica alla madre o ai flussi correnti del gestionale.
- Tutti i testi visibili del clone devono restare in italiano.

## Parti da verificare
- Ownership finale del backend dedicato che sostituira le capability legacy ad alta priorita.
- Contratto allegati preventivi e governance finale dei canali IA multipli.
- Scelta della wave in cui far entrare il dominio `cisterna`.

## Rischi aperti
- Saltare questa mappa nei task futuri potrebbe far perdere capability legacy importanti o, al contrario, riportare dentro il clone backend impropri.
- La semplice presenza di una funzione nel repo non prova che quel canale sia sano o canonico da adottare nella nuova IA.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> Governance finale endpoint IA multipli

## Prossimo passo consigliato
- Aprire task separati e piccoli sulle capability ad alta priorita, partendo da `documenti`, `libretto`, `analisi economica` o `preventivi`, senza riusare backend legacy a runtime.

## Cosa NON fare nel prossimo task
- Non collegare direttamente la nuova IA a `aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, Cloud Run libretto o `server.js`.
- Non riaprire scritture business della madre per replicare velocemente le capability legacy.
- Non mescolare nello stesso task i domini `documenti`, `libretto`, `preventivi`, `cisterna` e workflow approvativi.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
