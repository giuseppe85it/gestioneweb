# CONTINUITY REPORT - Parita strutturale clone = madre

## Contesto generale
- La fase attiva resta il clone `read-only` fedele della madre sotto `/next`.
- Con questo task la priorita non era piu aprire moduli nuovi, ma riallineare la struttura del clone alla madre: pagine vere, route vere, ingressi veri.

## Modulo/area su cui si stava lavorando
- Routing e navigazione clone
- Home / Centro Controllo
- Gestione Operativa / Procurement
- Mezzi / Dossier
- Lavori
- IA

## Stato attuale
- `/next` e ora una vera `Home` clone.
- `/next/centro-controllo` e ora una vera controparte autonoma della pagina madre `CentroControllo`.
- `Gestione Operativa` non vive piu solo nella route compressa `/next/operativita-globale`: esistono ora route autonome per inventario, materiali, attrezzature, manutenzioni, acquisti, ordini, dettaglio ordine e lavori da eseguire.
- `Mezzi` e `Dossier Mezzi` sono separati su `/next/mezzi` e `/next/dossiermezzi`.
- `Dossier Gomme` e `Dossier Rifornimenti` sono raggiungibili come vere route clone.
- L'hub IA apre anche le child route strutturali `/next/ia/apikey`, `/next/ia/libretto`, `/next/ia/documenti`, `/next/ia/copertura-libretti`.
- I path compressi legacy `/next/operativita-globale*` e `/next/mezzi-dossier*` restano solo come redirect tecnici di compatibilita.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Home clone separata
- Centro Controllo clone separato
- Famiglia Gestione Operativa con route strutturali
- Famiglia Mezzi / Dossier con route strutturali
- Lavori Da Eseguire come pagina autonoma clone-safe
- Child route IA strutturali

## Prossimo step di migrazione
- Chiudere i debiti residui di integrazione e parity fine-grain:
- merge reader `legacy + @next_clone_autisti:*` per `Autisti Inbox` e `Autisti Admin`
- adapter aggiuntivi dove wrapper madre ancora riportano a path Home legacy del clone precedente

## Moduli impattati
- `src/App.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloClonePage.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/NextDossierListaPage.tsx`
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/nextData.ts`
- `src/next/nextAccess.ts`

## Contratti dati coinvolti
- Nessun contratto dati nuovo
- Riuso degli stessi layer / dataset gia aperti
- Nessun merge reader nuovo introdotto in questo task

## Ultime modifiche eseguite
- Route canoniche clone aggiunte per le aree strutturalmente mancanti
- Redirect legacy aggiunti per non rompere i vecchi deep link `/next`
- Topbar e quick link riallineati alla nuova mappa madre-like
- Metadata NEXT riallineati alla nuova struttura

## File coinvolti
- `src/App.tsx`
- `src/next/**`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Decisioni gia prese
- Le scritture restano bloccate: la parita richiesta in questa fase e strutturale, non operativa lato writer.
- `Autista 360` e `Mezzo 360` restano fuori come bucket di rifondazione, non come semplice buco di routing.
- Le child route IA devono esistere come pagine vere anche se restano neutralizzate.

## Vincoli da non rompere
- Madre intoccabile
- Tutto il runtime clone resta sotto `/next`
- Nessuna falsa impressione di scrittura riuscita
- Nessuna compressione futura di moduli madre in mega-page query-driven dove la madre ha pagine autonome

## Parti da verificare
- Eventuali ritorni residui dentro wrapper madre usati nel clone che puntano ancora a `/next/centro-controllo` invece che a `/next`
- Coerenza completa di tutti i deep link interni tra Home clone, Centro Controllo clone e le nuove route canoniche
- Necessita o meno di route clone aggiuntive per parity fine-grain su dettagli procurement ancora condivisi

## Rischi aperti
- Alcune pagine clone continuano a riusare componenti madre non pensati per la nuova separazione Home/Centro Controllo; potranno richiedere adapter ulteriori.
- `Autisti Admin` resta reader-first e non vede ancora i record clone-local `@next_clone_autisti:*`.
- Le child route IA sono strutturalmente aperte ma ancora limitate a perimetro neutralizzato.

## Punti da verificare collegati
- `Parita strutturale clone = madre`
- `Merge reader clone + legacy per famiglia Autisti`

## Prossimo passo consigliato
- Mini-task di rifinitura routing/adapter sui wrapper madre ancora agganciati alla vecchia Home clone, poi debito integrazione dati Autisti.

## Cosa NON fare nel prossimo task
- Non riaprire writer reali.
- Non importare 1:1 `Autista 360` o `Mezzo 360`.
- Non ricomprimere in hub query-driven le route che ora sono state separate.

## Commit/hash rilevanti
- `NON ESEGUITO`

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
