# AUDIT IA INTERNA / DOCUMENTALE - STATO REALE AL 2026-04-12

Data audit: 2026-04-12
Perimetro: solo audit, nessuna patch runtime
Route verificate nel browser: `/next`, `/next/ia/interna`, `/next/ia/documenti`
Prove usate: codice reale del repo, runtime locale, console browser, network browser, report gia presenti del 2026-04-12

## SEZIONE 1 - RIASSUNTO ESECUTIVO

### COSA FA
- Oggi la IA interna e soprattutto un ingresso documentale unico dentro la NEXT.
- La pagina principale e `/next/ia/interna`.
- Da li si possono caricare PDF o immagini, lanciare l'analisi, vedere una review a 3 colonne, aprire lo storico e usare la chat come supporto secondario.
- La Home `/next` non apre piu un modale custom: porta direttamente alla route vera `/next/ia/interna`.
- La pagina `/next/ia/documenti` esiste ancora, ma oggi serve soprattutto come storico secondario del motore documentale.
- Il flusso base oggi funziona davvero: Home -> ingresso pulito -> upload -> `Analizza` -> review -> `Apri originale` -> `Vai a` -> storico.
- Le destinazioni utente oggi sono gia instradate: Inventario per i documenti magazzino, Manutenzioni per i documenti mezzo con targa, Dossier/Preventivi per i preventivi con targa, review per i casi da verificare.
- La review oggi non si apre piu da sola all'ingresso normale.
- Lo storico espone filtri e pulsanti utili (`Apri originale`, `Riapri review`, `Vai a`).
- La chat e ancora presente, ma non e piu il centro del flusso documentale.

### COME LO FA
- La UI nuova vive in `src/next/NextInternalAiPage.tsx`.
- Il motore documentale reale non e nuovo: e il motore condiviso estratto da `src/pages/IA/IADocumenti.tsx` tramite `useIADocumentiEngine()`.
- Quindi la nuova IA interna usa la UI NEXT per il percorso utente, ma il cuore upload/analisi/salvataggio/storico resta quello di `Documenti IA`.
- Lo storico reale viene letto dalle collection reali `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`.
- La review storica si riapre tramite query `reviewDocumentId` e `reviewSourceKey`, poi la URL viene ripulita.
- L'analisi documento passa da una Cloud Function esterna (`estrazioneDocumenti`).
- La chat e le memorie IA scrivono invece su storage locale namespaced e, se disponibile, su un adapter server-side isolato dalla parte business.

### LIMITI / PROBLEMI
- Il sistema non ha ancora un motore documentale nuovo e indipendente: dipende ancora dal motore condiviso di `IADocumenti`.
- Questo rende facile confondere nuova UI e logica vecchia: la UI e unificata, ma il cuore documentale e ancora shared.
- Nel runtime restano errori console reali: `403` sui listing Storage Firebase e ricorrenze `Maximum update depth exceeded`.
- Il flusso di analisi oggi e sbloccato, ma la parte di salvataggio reale non e stata esercitata in questo audit per non alterare i dati.
- La pagina `/next/ia/documenti` e utile, ma come seconda porta puo ancora confondere chi non ha chiaro che l'ingresso principale e `/next/ia/interna`.
- La stessa pagina `/next/ia/interna` ospita sia il flusso documentale sia aree piu tecniche (`sessioni`, `richieste`, `artifacts`, `audit`): questo aiuta l'implementazione, ma oggi mescola piani diversi.

## SEZIONE 2 - MAPPA DELLE PAGINE IA

### `/next`
- COSA FA: e la Home NEXT. Oggi contiene un pannello `IA interna` che serve solo come launcher verso l'ingresso unico reale.
- COME LO FA: il bottone `Apri IA interna` usa `HomeInternalAiLauncher` e chiama `navigate("/next/ia/interna")`.
- LIMITI / PROBLEMI: come pagina IA non fa altro. Il vantaggio e che non apre piu modali incoerenti; il limite e che la Home non spiega ancora tutto il sistema, fa solo da porta.

### `/next/ia/interna`
- COSA FA: e la pagina principale della IA interna oggi attiva. E il punto unico per nuovi upload, review, storico interno e chat secondaria.
- COME LO FA: monta `NextInternalAiPage`, che riusa `useIADocumentiEngine()` per il motore documentale e aggiunge shell, tab, routing `Vai a`, storico unificato, tracking e superfici chat/artefatti.
- LIMITI / PROBLEMI: e una pagina molto potente ma anche molto ampia. Dentro convivono flusso documentale, chat, tracking, artifact e sezioni piu tecniche.

### `/next/ia/documenti`
- COSA FA: e la pagina secondaria del motore `Documenti IA`. Oggi serve soprattutto come storico, consultazione originali e riapertura review.
- COME LO FA: monta `NextIADocumentiPage`, usa lo stesso motore condiviso e mostra filtri storici, valuta e pulsanti di rientro all'ingresso unico.
- LIMITI / PROBLEMI: non e piu la porta principale, ma esiste ancora. Se il prodotto non chiarisce bene i ruoli, puo sembrare una seconda entrata.

### `/next/ia/interna/sessioni`
- COSA FA: mostra la sezione tecnica delle sessioni IA.
- COME LO FA: usa la stessa `NextInternalAiPage` con `sectionId="sessions"`.
- LIMITI / PROBLEMI: e una sezione tecnica, non adatta come ingresso documentale per utenti normali.

### `/next/ia/interna/richieste`
- COSA FA: mostra la sezione tecnica delle richieste IA.
- COME LO FA: usa la stessa `NextInternalAiPage` con `sectionId="requests"`.
- LIMITI / PROBLEMI: e utile per tracing interno, ma puo confondere se trattata come pagina utente finale.

### `/next/ia/interna/artifacts`
- COSA FA: mostra archivio artifact IA e bozze.
- COME LO FA: usa la stessa `NextInternalAiPage` con `sectionId="artifacts"`.
- LIMITI / PROBLEMI: parla piu di memoria/traceability che di documenti operativi.

### `/next/ia/interna/audit`
- COSA FA: mostra il registro audit interno del sottosistema IA.
- COME LO FA: usa la stessa `NextInternalAiPage` con `sectionId="audit"`.
- LIMITI / PROBLEMI: e chiaramente una sezione tecnica e non un pezzo del flusso documentale quotidiano.

## SEZIONE 3 - FLUSSO REALE ATTUALE

### Dalla Home
- COSA FA: cliccando `Apri IA interna` dalla Home si entra nella pagina vera `/next/ia/interna`.
- COME LO FA: `HomeInternalAiLauncher` usa solo `navigate(NEXT_INTERNAL_AI_PATH)`.
- LIMITI / PROBLEMI: nel codice di `NextInternalAiPage` esiste ancora la variante `home-modal`, ma oggi il launcher della Home non la usa piu.

### Entrando direttamente in `/next/ia/interna`
- COSA FA: la pagina si apre pulita, senza review preaperta.
- COME LO FA: parte su tab `Inbox`, senza documento storico selezionato; il browser non mostra query review e non ci sono chiavi storage che riaprono da sole una review documentale.
- LIMITI / PROBLEMI: se si entra con query `reviewDocumentId`, la pagina prova a riaprire la review storica. Questo e voluto, ma va tenuto sotto controllo quando altri launcher costruiscono link profondi.

### Quando allego un file
- COSA FA: il file viene preso in carico dalla pagina e il bottone `Analizza` si abilita.
- COME LO FA: `handleFile` del motore documentale salva il file selezionato e, per le immagini, prepara anche una preview.
- LIMITI / PROBLEMI: per i PDF la pagina non mostra una vera preview inline del contenuto; mostra soprattutto il nome file e poi i campi estratti dopo l'analisi.

### Quando clicco `Analizza`
- COSA FA: la pagina invia il documento alla Cloud Function di estrazione e aspetta il risultato.
- COME LO FA: il file viene convertito in base64 e inviato con `POST` a `https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti`.
- LIMITI / PROBLEMI: questo passaggio dipende ancora da un endpoint esterno legacy-ish e non da un motore documentale nuovo della NEXT.

### Quando arriva il risultato
- COSA FA: si apre la review documento nella stessa pagina.
- COME LO FA: la review mostra 3 colonne: file ricevuto, dati estratti, consiglio IA con scelta utente e destinazione finale.
- LIMITI / PROBLEMI: la review oggi e leggibile e centrata sul documento, ma il runtime continua a generare errori console che vanno separati da questo flusso.

### Quando apro lo storico
- COSA FA: vedo i documenti gia salvati con filtri e azioni.
- COME LO FA: la pagina legge l'archivio reale e mostra righe con `Apri originale`, `Riapri review` e `Vai a`.
- LIMITI / PROBLEMI: lo storico e utile, ma continua a vivere in due superfici: nella pagina principale e nella pagina secondaria `/next/ia/documenti`.

### Quando clicco `Riapri review`
- COSA FA: torno nella review del documento salvato.
- COME LO FA: viene costruita una URL con `reviewDocumentId` e `reviewSourceKey`; la pagina la legge, riapre il documento giusto e poi ripulisce la URL.
- LIMITI / PROBLEMI: la riapertura dipende dal fatto che l'item sia davvero presente nello snapshot archivio gia caricato.

### Quando clicco `Vai a`
- COSA FA: la pagina prova a portarmi nel modulo finale piu giusto per il documento.
- COME LO FA: usa route builder reali della NEXT:
- `/next/magazzino?tab=inventario`
- `/next/manutenzioni?targa=<targa>`
- `/next/dossier/<targa>#preventivi`
- LIMITI / PROBLEMI: il wiring e chiaro, ma non tutti i rami sono stati esercitati in questo audit con lo stesso livello di profondita.

## SEZIONE 4 - COSA LEGGE LA IA

### Letture documentali
- COSA FA: legge file locali caricati dall'utente, PDF e immagini.
- COME LO FA: usa il file input della pagina e passa il contenuto al motore condiviso `useIADocumentiEngine()`.
- LIMITI / PROBLEMI: per i PDF il contenuto non viene mostrato davvero inline nella review standard; la lettura visibile avviene soprattutto attraverso i campi estratti.

- COSA FA: legge i documenti gia salvati nello storico reale.
- COME LO FA: usa `readNextIADocumentiArchiveSnapshot()` per leggere `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`.
- LIMITI / PROBLEMI: in `/next/ia/interna` l'archivio esclude volutamente gli eventuali documenti locali overlay del clone (`includeCloneDocuments: false`).

- COSA FA: legge l'elenco mezzi per validare o associare una targa.
- COME LO FA: il motore documentale legge `storage/@mezzi_aziendali`.
- LIMITI / PROBLEMI: se la targa non e riconosciuta, il documento viene spinto verso review o scelta manuale.

- COSA FA: legge la presenza della chiave/config IA documentale.
- COME LO FA: controlla il documento Firestore `@impostazioni_app/gemini`.
- LIMITI / PROBLEMI: il report non entra nel merito della qualita/configurazione Gemini; constata solo che il controllo esiste.

### Letture di stato UI
- COSA FA: legge la URL per capire se deve riaprire una review.
- COME LO FA: usa `reviewDocumentId` e `reviewSourceKey`.
- LIMITI / PROBLEMI: la review non viene ripresa da `sessionStorage`; dipende dalla URL e dallo snapshot archivio.

- COSA FA: legge memoria locale della parte IA.
- COME LO FA: usa `localStorage` con queste chiavi viste davvero nel browser:
- `@next_internal_ai:universal_requests_v1`
- `@next_internal_ai:tracking_memory_v1`
- `@next_internal_ai:artifact_archive_v1`
- LIMITI / PROBLEMI: queste chiavi non riaprono la review documentale, ma tengono comunque viva una memoria laterale del sottosistema.

### Letture di storico / review
- COSA FA: riapre review di documenti salvati e carica i dati essenziali del documento storico.
- COME LO FA: legge lo snapshot archivio e cerca per `id` o `sourceDocId`.
- LIMITI / PROBLEMI: i dettagli di riga completi del documento salvato non sono sempre ricchi quanto quelli di una review appena analizzata.

### Letture di contesto
- COSA FA: legge tracking, artifact, richieste universali e allegati chat della IA interna.
- COME LO FA: usa moduli locali `internalAiTracking`, `internalAiMockRepository`, `internalAiUniversalRequestsRepository`, `internalAiChatAttachmentsClient` e una hydration iniziale da adapter server-side, se disponibile.
- LIMITI / PROBLEMI: questa parte allarga molto lo scope della pagina rispetto al solo uso documentale.

## SEZIONE 5 - COSA SCRIVE LA IA

### Scritture documentali

### Analisi documento
- COSA SCRIVE: invia una richiesta di analisi del file.
- DOVE: Cloud Function `estrazioneDocumenti`.
- QUANDO: al click su `Analizza`.
- PERCHE: per estrarre tipo documento, targa, fornitore, importi e righe.
- STATO: attivo e verificato davvero in runtime.

### Salvataggio documento analizzato
- COSA SCRIVE: salva il file originale e il record documento analizzato.
- DOVE: Storage `documenti_pdf/<timestamp>_<nomefile>` e Firestore in `@documenti_mezzi`, `@documenti_magazzino` o `@documenti_generici`.
- QUANDO: al click su `Salva nel motore Documenti IA`.
- PERCHE: per archiviare il documento nel motore reale.
- STATO: scrittura reale presente nel codice; non esercitata in questo audit per non alterare i dati.

### Importazione materiali in inventario
- COSA SCRIVE: aggiorna `@inventario` con le righe del documento magazzino.
- DOVE: dataset storage-style `@inventario`.
- QUANDO: dopo il salvataggio, tramite bottone `Importa materiali in Inventario`.
- PERCHE: per trasformare le righe documento in materiale di stock.
- STATO: scrittura reale presente nel codice; non esercitata in questo audit.

### Valuta da verificare
- COSA SCRIVE: aggiorna il campo `valuta` di un documento gia salvato.
- DOVE: documento Firestore gia esistente nella collection di origine.
- QUANDO: dalla pagina secondaria `/next/ia/documenti`, con il bottone `Valuta da verificare`.
- PERCHE: per correggere EUR/CHF quando il motore non e sicuro.
- STATO: scrittura reale presente nel codice; non esercitata in questo audit.

### Scritture review / storico
- COSA SCRIVE: non salva una review documentale pulita in `localStorage` o `sessionStorage`.
- DOVE: non scrive nulla di review nel browser storage del flusso documentale corrente.
- QUANDO: la riapertura review avviene da URL e stato React, non da persistenza review locale.
- PERCHE: la review viene ricostruita da archivio o da risultato corrente.
- STATO: non scrive review locale persistita.

### Scritture solo UI / tracking

### Tracking memoria IA
- COSA SCRIVE: cronologia e stato di tracking del sottosistema.
- DOVE: `localStorage/@next_internal_ai:tracking_memory_v1`.
- QUANDO: durante l'uso della IA interna.
- PERCHE: per mantenere memoria operativa minima del modulo IA.
- STATO: attivo nel codice e coerente con le chiavi viste nel browser.

### Archivio artifact IA
- COSA SCRIVE: artifact, bozze e metadati di archivio IA.
- DOVE: `localStorage/@next_internal_ai:artifact_archive_v1`.
- QUANDO: quando si generano o archiviano artifact della IA.
- PERCHE: per tenere uno storico IA separato dai dati business.
- STATO: attivo nel codice.

### Richieste universali IA
- COSA SCRIVE: repository locale delle richieste universali.
- DOVE: `localStorage/@next_internal_ai:universal_requests_v1`.
- QUANDO: durante uso delle richieste/chat IA.
- PERCHE: per riaprire contesto e richieste.
- STATO: attivo nel codice e chiave visibile nel browser.

### Mirror server-side isolato
- COSA SCRIVE: snapshot tracking e artifact, se l'adapter backend e disponibile.
- DOVE: adapter server-side della IA interna, separato dai dati business.
- QUANDO: durante hydration e aggiornamento del sottosistema IA.
- PERCHE: per avere persistenza isolata della memoria IA.
- STATO: presente nel codice; attivazione dipendente dall'adapter.

### Scritture business inline
- COSA SCRIVE: alcune azioni inline IA Magazzino possono scrivere inventario.
- DOVE: `@inventario`, tramite scope controllato.
- QUANDO: solo in casi inline specifici di riconciliazione/carico.
- PERCHE: per chiudere alcuni casi documentali magazzino senza uscire dalla IA.
- STATO: codice presente; non esercitato in questo audit.

### Scritture bloccate dal clone barrier
- COSA SCRIVE: il barrier blocca ancora i fetch mutanti generici del clone.
- DOVE: boundary `cloneWriteBarrier.ts`.
- QUANDO: quando una fetch mutante non rientra nelle eccezioni ammesse.
- PERCHE: per evitare aperture di scrittura non deliberate nel clone.
- STATO: il caso `Analizza` su `/next/ia/interna` oggi e autorizzato in modo stretto; il resto resta protetto.

## SEZIONE 6 - RUOLO DI DOCUMENTI IA

### COSA FA
- `Documenti IA` oggi e il motore reale del flusso documentale.
- La nuova `IA interna` non ha un motore documentale suo: usa questo motore.
- La pagina `/next/ia/documenti` resta soprattutto come storico e superficie secondaria.

### COME LO FA
- `src/pages/IA/IADocumenti.tsx` espone `useIADocumentiEngine()`.
- `NextInternalAiPage.tsx` consuma quel hook per upload file, analisi, apertura originale, salvataggio, storico, valuta e import inventario.
- `NextIADocumentiPage.tsx` usa lo stesso motore per la pagina storica.

### LIMITI / PROBLEMI
- Non c'e duplicazione del motore, ma c'e una forte dipendenza dal file legacy/shared.
- Questo significa che il nuovo ingresso documentale e elegante a livello UI, ma eredita ancora comportamento, rischi e scritture del vecchio motore.
- La coerenza prodotto e migliorata, ma l'architettura non e ancora completamente separata.

## SEZIONE 7 - DESTINAZIONI FINALI

### Fattura magazzino
- CONSIGLIO IA ATTUALE: `Magazzino -> Inventario`.
- DESTINAZIONE ATTUALE: modulo Magazzino, sezione Inventario.
- ROUTE `VAI A` ATTUALE: `/next/magazzino?tab=inventario`.
- GIUDIZIO: corretto. Verificato davvero in runtime con click `Vai a Inventario`.

### Fattura manutenzione
- CONSIGLIO IA ATTUALE: `Manutenzioni <targa>`.
- DESTINAZIONE ATTUALE: modulo Manutenzioni gia filtrato sulla targa.
- ROUTE `VAI A` ATTUALE: `/next/manutenzioni?targa=<targa>`.
- GIUDIZIO: parziale. Il wiring codice e chiaro; in questo audit non e stato cliccato questo ramo specifico.

### Preventivo per targa
- CONSIGLIO IA ATTUALE: `Dossier <targa> -> Preventivi`.
- DESTINAZIONE ATTUALE: dossier mezzo sulla sezione preventivi.
- ROUTE `VAI A` ATTUALE: `/next/dossier/<targa>#preventivi`.
- GIUDIZIO: corretto. Il click cambia davvero URL verso quella route e la route diretta e stata verificata nel browser.

### Documento ambiguo
- CONSIGLIO IA ATTUALE: restare in review / `Da verificare`.
- DESTINAZIONE ATTUALE: review documento.
- ROUTE `VAI A` ATTUALE: nessuna route esterna; si riapre la review.
- GIUDIZIO: corretto come presidio prudente.

### Documento generico
- CONSIGLIO IA ATTUALE: `Archivio generico / Documenti IA`.
- DESTINAZIONE ATTUALE: superficie storica `Documenti IA`.
- ROUTE `VAI A` ATTUALE: `/next/ia/documenti`.
- GIUDIZIO: parziale. Funziona come archivio, ma continua a tenere viva una seconda superficie IA.

### Documento Euromecc
- CONSIGLIO IA ATTUALE: rientra nel flusso generico, non in un motore separato.
- DESTINAZIONE ATTUALE: archivio generico / `Documenti IA`.
- ROUTE `VAI A` ATTUALE: `/next/ia/documenti`.
- GIUDIZIO: parziale. Il codice e la UI dichiarano esplicitamente che Euromecc oggi non ha un flusso documentale dedicato.

## SEZIONE 8 - ERRORI REALI OGGI

### `403` Firebase Storage sui listing
- DOVE SUCCEDE: nel browser, gia entrando in `/next/ia/interna` e anche su altre route collegate.
- IMPATTO SULL'UTENTE: medio. Il flusso documentale principale continua, ma alcune letture/listing Storage non sono disponibili.
- BLOCCA TUTTO O NO: non blocca `Analizza`, non blocca l'apertura della pagina, ma sporca il runtime e puo togliere completezza ad alcune viste.

### `Maximum update depth exceeded`
- DOVE SUCCEDE: console browser su `/next`, `/next/ia/interna` e durante percorsi collegati.
- IMPATTO SULL'UTENTE: medio. Non ha fermato il percorso base verificato, ma indica un loop di render o un ricalcolo troppo aggressivo.
- BLOCCA TUTTO O NO: non blocca tutto, ma e il rumore tecnico piu serio oggi osservato.

### Doppio piano prodotto: ingresso unico piu pagina secondaria
- DOVE SUCCEDE: tra `/next/ia/interna` e `/next/ia/documenti`.
- IMPATTO SULL'UTENTE: medio-basso. Chi conosce il sistema capisce la differenza; chi arriva per la prima volta puo vedere due pagine simili.
- BLOCCA TUTTO O NO: non blocca il flusso, ma complica il messaggio prodotto.

### Motore condiviso con file legacy
- DOVE SUCCEDE: `NextInternalAiPage.tsx` dipende da `useIADocumentiEngine()` in `src/pages/IA/IADocumenti.tsx`.
- IMPATTO SULL'UTENTE: indiretto ma alto a livello di manutenzione. Una patch sul motore puo spostare piu superfici insieme.
- BLOCCA TUTTO O NO: non blocca l'uso quotidiano, ma e il nodo architetturale piu delicato.

## SEZIONE 9 - COSA E GIA BUONO

### COSA FA
- L'ingresso principale oggi e chiaro: Home -> `/next/ia/interna`.
- La pagina principale parte pulita.
- L'upload e semplice.
- `Analizza` oggi parte davvero.
- La review e leggibile e centrata sul documento.
- `Apri originale` funziona.
- Lo storico reale e visibile.
- `Riapri review` funziona.
- Le destinazioni finali sono gia pensate con logica business concreta.

### COME LO FA
- Con una shell NEXT unica per il percorso utente.
- Con un motore documentale reale gia esistente, invece di un mock.
- Con route builder espliciti e non con scorciatoie vaghe.
- Con un boundary clone che resta stretto dove serve.

### LIMITI / PROBLEMI
- Il buono di oggi convive ancora con rumore tecnico e scope troppo largo nella stessa pagina.
- Non conviene buttare via il flusso attuale: conviene chiarirlo e rifinirlo.

## SEZIONE 10 - COSA VA DECISO PRIMA DI ALTRA UI

### COSA FA
- Questa sezione non descrive una funzione runtime: descrive le decisioni che servono prima di un altro redesign.

### COME LO FA
- Le decisioni da prendere sono queste:
- ingresso unico: si, da mantenere su `/next/ia/interna`
- `Documenti IA` come motore unico: si o no, da esplicitare
- storico unico: si o no, da decidere se resta in pagina o se la pagina secondaria sopravvive
- review unica: si o no, da mantenere in una sola superficie e con un solo linguaggio
- gestione `Da verificare`: si o no, da chiarire se resta tab dedicato o stato archivistico
- scope della chat: solo supporto o anche seconda porta prodotto
- scope delle sezioni tecniche (`sessioni`, `richieste`, `artifacts`, `audit`): visibili all'utente finale oppure no

### LIMITI / PROBLEMI
- Se si continua a fare UI senza fissare queste decisioni, ogni patch rischia di riaprire il conflitto tra pagina documentale, chat, storico secondario e sezioni tecniche.

## SEZIONE 11 - VERDETTO FINALE

### COSA FA
- Oggi la IA interna funziona davvero come ingresso documentale unico della NEXT.
- Da Home si entra nel posto giusto.
- Il percorso upload -> analisi -> review -> storico -> destinazione esiste ed e reale.
- `Documenti IA` e ancora il motore reale dietro le quinte.

### COME LO FA
- Lo fa con una UI nuova e piu ordinata, ma sopra un motore documentale condiviso.
- Lo fa con route business gia piuttosto chiare.
- Lo fa con memorie IA locali e con un adapter separato per tracking/artifact.

### LIMITI / PROBLEMI
- Il problema principale oggi non e piu "non funziona niente".
- Il problema principale e che il sistema funziona, ma funziona dentro un perimetro ancora misto:
- UI unificata nuova
- motore documentale condiviso
- pagina secondaria ancora viva
- errori console reali ancora presenti
- sezioni tecniche e prodotto finale ancora nello stesso contenitore

### CONCLUSIONE OPERATIVA
- Il prossimo passo giusto non e rifare tutto.
- Il prossimo passo giusto e decidere il perimetro definitivo del prodotto:
- una sola entrata
- una sola review
- una sola sede ufficiale dello storico
- una decisione chiara sul ruolo futuro di `Documenti IA`
- solo dopo ha senso fare un altro redesign UI.
