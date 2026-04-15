# MAPPA IA INTERNA PER UTENTE

Questo documento spiega la IA interna come esiste oggi nel codice reale del progetto. I documenti di continuità sono serviti solo come memoria storica: quando c'era un dubbio, ha contato il codice.[1][2]

## 1. Cos'è la IA interna, in due righe

La IA interna è una pagina del gestionale che prova a trasformare richieste scritte, foto e PDF in una risposta utile o in una proposta di lavoro già indirizzata verso il modulo giusto.

Oggi non è un blocco unico e semplice: è più simile a un banco con due motori vicini. Uno legge bene il file singolo dei documenti. L'altro gestisce la chat, i gruppi di file e gli smistamenti verso gli altri moduli.[2][3][4]

## 2. Quanti modi hai di aprirla oggi

Oggi, nel perimetro letto, i punti di ingresso dimostrabili sono questi.

### 2.1 Dalla Home del gestionale

Nella card `Assistente IA` puoi entrare in due modi.[1]

- Se scrivi nel campo e premi la freccia, si apre la pagina della IA interna con la tua frase già pronta.
- Se premi `+`, ti si apre un piccolo menu con 5 voci attive:
  - `Fattura / DDT`
  - `Libretto mezzo`
  - `Cisterna Caravate`
  - `Preventivo fornitore`
  - `Documento manutenzione`

Cosa succede dopo il click:

- `Fattura / DDT`, `Preventivo fornitore` e `Documento manutenzione` portano tutte nella stessa pagina IA e ti aprono subito la scelta file, cambiando solo il tipo di documento che la pagina si aspetta.
- `Libretto mezzo` non resta nella pagina IA interna generale: ti manda alla pagina dedicata al libretto.
- `Cisterna Caravate` non resta nella pagina IA interna generale: ti manda alla pagina dedicata cisterna.

La card ha anche il link `Storico →`, ma quello non apre la IA interna principale: apre lo storico documenti separato.[1]

### 2.2 Dallo strumento “unisci documenti”

Esiste anche un ingresso indiretto: quando usi lo strumento che unisce più documenti in un PDF unico, appena il PDF è pronto il sistema lo passa alla IA interna e ti ci porta da solo.[10]

In pratica è come fare così:

`unisci i file → crea un PDF unico → consegna il PDF alla IA interna`

### 2.3 In pratica quanti ingressi reali portano alla stessa stanza

La situazione mentale corretta oggi è questa:

- Hai un ingresso vero dalla Home.
- Hai un ingresso di servizio dallo strumento “unisci documenti”.
- Dentro la stessa stanza poi puoi partire in due modi diversi: dalla card alta del documento oppure dalla chat in basso.[1][2][10]

Quindi gli ingressi non sono molti, ma una volta entrato il sistema ti propone più binari paralleli.

## 3. Come è fatta la schermata della IA quando la apri

Quando apri la IA interna vedi una pagina con tre zone ben riconoscibili.[2]

In alto:

- il titolo `Assistente IA`
- un bollino che dice se il motore dietro è attivo oppure solo “controllato”
- il pulsante `Chiudi`

Al centro, nella parte grande:

- una card alta con `Tipo atteso`
- sotto la zona `Documento`
- il pulsante `Analizza`
- quando ci sono più file, una casella `Tratta questi file come un unico documento`

Se non c'è ancora una revisione aperta, sotto quella card vedi la conversazione:

- i tuoi messaggi
- le risposte dell'assistente
- eventuali blocchi che spiegano cosa ha capito del documento

A destra vedi una colonna più stretta:

- elenco delle funzioni attive
- link `Storico analisi`

In basso c'è il compositore della chat:

- pulsante `+` per allegare file
- campo dove scrivi
- freccia per inviare

Quando invece la IA entra in fase di controllo documento, la pagina cambia faccia:

- oppure mostra una revisione a colonne dentro la stessa pagina
- oppure apre una grande finestra sopra tutto il resto, con anteprima file, dati letti, proposta finale e pulsanti per aprire il modulo di destinazione[2]

È come avere una scrivania che, quando trova un documento interessante, si trasforma in banco di verifica.

## 4. I 3-5 flussi principali che fa

### 4.1 Carico una foto o un PDF di fattura materiali di magazzino

Tu fai questo:

- scegli `Fattura` come tipo atteso
- carichi un solo file
- premi `Analizza`

Dietro le quinte succede questo:

- la pagina usa il motore storico dei documenti, quello che oggi è il ramo più concreto per il caso singolo[2][3]
- il file viene letto dal servizio documenti già esistente
- il sistema prova a trovare intestazione, fornitore, data, totale e righe
- se le righe somigliano a materiali di magazzino, la proposta finale punta verso il mondo magazzino[2][3][7][8]

Tu vedi questo:

- i dati letti del documento
- le righe trovate
- una destinazione coerente con il magazzino

Dopo puoi:

- confermare il salvataggio del documento
- in certi casi importare anche le righe in inventario
- aprire il modulo finale di magazzino[2][3]

Questo è oggi il flusso più vicino a “funziona davvero”.

### 4.2 Carico una fattura di manutenzione di un camion

Tu fai questo:

- scegli `Manutenzione` come tipo atteso
- carichi un file

Dietro le quinte succede una cosa importante:

- se il file resta nel binario del documento singolo, il sistema prova ancora a trattarlo come documento del mezzo
- però il nuovo binario universale pesa molto quando il testo del file assomiglia a righe materiali, quantità, ricambi o AdBlue
- in quel caso il sistema può considerarlo più “magazzino” che “manutenzione”[2][7][8]

In parole semplici:

- se vede bene la targa e il contesto del mezzo, può indirizzarti verso manutenzioni
- se vede soprattutto righe materiali e segnali da magazzino, può farti finire verso magazzino anche se tu avevi in testa una spesa officina

Tu vedi questo:

- oppure una proposta coerente con il mezzo
- oppure una proposta tipo `Apri in Magazzino`
- oppure un caso lasciato `DA VERIFICARE`

È qui che oggi nasce la sensazione di errore: tu pensi “fattura di officina”, il sistema spesso pensa “documento materiali”.

### 4.3 Scrivo una domanda in chat senza allegati

Tu fai questo:

- scrivi una domanda
- premi invio

Dietro le quinte succede questo:

- la pagina prova prima a capire la domanda con il motore locale prudente
- se il server separato della IA è disponibile, gli passa anche la richiesta
- se il server non è disponibile, resta sul ramo locale senza bloccarsi[4][9]

Tu vedi questo:

- una risposta in chat
- eventuali riferimenti a report, targa, autista o modulo
- nessun salvataggio operativo automatico nei dati del gestionale

Questo flusso oggi serve più a orientare e a spiegare che a chiudere un lavoro operativo.

### 4.4 Carico più file insieme come un unico documento

Tu fai questo:

- selezioni due o più file
- compare la casella `Tratta questi file come un unico documento`
- lasci la casella attiva e premi `Analizza`

Dietro le quinte succede questo:

- il sistema non usa più il binario semplice del file singolo
- sposta i file nel binario chat/documenti della IA
- li conserva come allegati separati
- prova a leggerli uno per uno
- poi costruisce un riepilogo unico, come quando metti più fogli in una cartellina e chiedi: “fammi la sintesi di tutto”[2][5][6][7][8][9]

Tu vedi questo:

- una revisione che può chiamarsi `Documento logico unificato`
- le anteprime dei singoli file
- un solo riepilogo finale

Il punto delicato è qui:

- l'unione avviene solo nel riassunto finale
- il sistema non “capisce davvero” un nuovo documento fisico unico
- se i file raccontano cose diverse, alcuni campi vengono lasciati vuoti o marcati da controllare[6]

### 4.5 Unisco prima i file e poi li mando alla IA

Tu fai questo:

- usi lo strumento di unione
- ottieni un PDF unico
- il sistema ti porta nella IA interna con quel PDF già pronto

Dietro le quinte succede questo:

- qui non c'è un gruppo di file da tenere insieme
- c'è già un file solo, nato dalla fusione
- quel file entra quindi come documento consegnato alla IA[10]

Tu vedi:

- la IA interna aperta con il file disponibile

Questo è un doppione concettuale del flusso precedente:

- nel primo caso tieni più file separati ma li fai trattare “come se fossero uno”
- nel secondo caso li fondi davvero prima e poi mandi un solo file

## 5. Dove finiscono i dati che la IA estrae

La regola semplice oggi è questa:

- analizzare non vuol dire ancora salvare
- prima il sistema mostra
- poi, se confermi, salva[2][3]

Per il ramo documenti singoli:

- il documento viene letto
- i dati vengono mostrati a schermo
- solo dopo la conferma il sistema salva il documento nel database del gestionale, nella famiglia giusta:
  - documenti del mezzo
  - documenti di magazzino
  - documenti generici[3]

Se il documento è di magazzino e ha righe utili:

- il sistema può anche riversare quelle righe nell’inventario del gestionale[3]

Per il ramo chat e allegati:

- i file possono restare solo nel browser, se il server separato non è acceso
- oppure possono essere copiati nel contenitore separato della IA, che non è il cuore operativo del gestionale[5][9]

Per il lato “memoria” della IA:

- la IA tiene anche tracce sue, come archivio interno, richieste e memoria di lavoro
- queste tracce stanno nel contenitore dedicato della IA e non equivalgono a un salvataggio operativo di magazzino o manutenzioni[2][9]

## 6. Cosa funziona oggi e cosa no

### ✓ Funziona bene

- La pagina si apre da Home in modo semplice e riconoscibile.
- Il caso “un file solo da leggere come documento” ha un percorso chiaro.
- La fattura materiali di magazzino è il caso più allineato al resto del sistema.
- La chat non si blocca se il cervello lato server non è acceso: ripiega su un comportamento prudente.
- Il sistema sa anche tenere allegati e costruire un riepilogo unico su più file.
- Esiste un contenitore separato della IA per non mischiare tutto subito con i dati operativi.[1][2][3][4][5][9]

### ✗ Non funziona o è confuso

- Esistono due cervelli vicini: uno per il documento singolo e uno per chat e gruppi di file.
- Esistono due modi quasi equivalenti per ottenere “un solo documento” da più file: unirli prima oppure lasciarli separati e chiedere il riepilogo unico.
- Le fatture di officina o manutenzione possono scivolare verso magazzino se il testo assomiglia più a righe materiali che a storia del mezzo.
- Il tipo che tu selezioni in alto non guida con la stessa forza tutti i binari.
- Il gruppo di file trattati insieme produce un riassunto unico, ma sotto resta fatto di file separati: questo rende il risultato meno netto di quanto sembri.
- La revisione non vive in un solo posto: a volte è dentro la pagina, a volte in una grande finestra sopra la pagina.[2][6][7][8]

## 7. Le sovrapposizioni e i doppioni

Questo è il capitolo più importante per capire perché oggi la IA interna “sembra più grande di quello che è”.

### 7.1 Due modi di rileggere un documento

Oggi convivono due motori.

Primo motore:

- è il motore storico dei documenti
- lavora bene nel caso di un file solo
- è quello che gestisce analisi, salvataggio e apertura documento nel ramo classico[2][3]

Secondo motore:

- è il motore nuovo della chat e del cervello universale
- decide verso quale modulo mandare la richiesta
- legge anche gruppi di file e allegati della chat
- usa il server separato quando c’è, oppure un ripiego prudente quando non c’è[4][5][7][8][9]

Tradotto in modo diretto:

- il primo è il binario operativo più concreto per il documento singolo
- il secondo è il binario nuovo, più ampio, ma anche più incline a creare smistamenti ambigui

### 7.2 Due revisioni documento

Oggi esistono due facce di revisione.

La prima:

- è dentro la pagina stessa
- ha colonne, dati letti, righe e destinazione finale

La seconda:

- è una grande finestra sopra la pagina
- mostra anteprima file, proposta, decisione e pulsante finale come `Apri in Magazzino`[2]

Per l’utente questo significa una cosa semplice:

- non esiste ancora una sola “scrivania finale del documento”

### 7.3 Due flussi per più file

Primo flusso:

- unisci prima i file con lo strumento dedicato
- poi mandi un PDF unico alla IA

Secondo flusso:

- mandi più file separati
- spunti `Tratta questi file come un unico documento`
- ottieni un riepilogo unico[2][10]

Scopo simile, meccanica diversa.

### 7.4 Due idee di destinazione finale

Per il caso magazzino il sistema ha una strada concreta:

- leggere righe materiali
- proporre magazzino
- offrire pulsanti coerenti con quella decisione[2][7][8]

Per manutenzioni la strada è meno forte:

- serve capire bene che il documento appartiene a un mezzo
- serve legare bene la targa
- questo oggi non pesa abbastanza in tutti i rami

## 8. Il confine tra magazzino (funziona) e manutenzioni (non funziona)

Il magazzino oggi funziona meglio per una ragione semplice: il sistema sa riconoscere bene i segnali “da scaffale”.

Cosa gli riesce bene:

- quantità
- codici articolo
- righe materiali
- parole come ricambio, AdBlue, magazzino, DDT, fattura materiali[7][8]

Quando vede questi segnali, il sistema si sente sicuro. È come quando un addetto trova subito il cassetto giusto e ci mette dentro il foglio senza pensarci troppo.

La manutenzione del camion richiede invece un pezzo in più:

- non basta vedere che c’è una spesa
- bisogna capire a quale mezzo appartiene
- possibilmente trovare la targa
- distinguere i ricambi “di magazzino” da una lavorazione “di officina”[2][3][7][8]

Quel pezzo oggi è il tratto debole.

La conseguenza pratica è questa:

- una fattura ricambi di magazzino trova facilmente casa
- una fattura officina può essere trattata come se fosse ancora solo un documento materiali

Il passaggio mancante, detto in modo semplice, è:

- il sistema non dà abbastanza peso alla storia del mezzo quando il foglio contiene anche segnali forti di magazzino

## 9. Le 3 strade possibili da qui

### Strada A: riparare

Idea:

- tenere l’impianto attuale
- chiarire il confine tra documento singolo, chat e gruppi di file
- dare più peso al percorso manutenzioni quando il documento riguarda davvero un mezzo

Pro:

- non butti via il lavoro già fatto
- conservi sia il ramo documenti sia la chat

Contro:

- richiede mettere d’accordo pezzi che oggi convivono ma non ragionano sempre allo stesso modo

Impatto sul lavoro già fatto:

- medio-alto, perché si lavora sulle giunture tra i binari già esistenti

### Strada B: semplificare drasticamente

Idea:

- tenere un solo ingresso forte
- una sola revisione documento
- un solo modo per trattare più file
- mettere in pausa i binari doppi

Pro:

- l’utente capisce subito cosa deve fare
- cala il rischio di finire nel modulo sbagliato

Contro:

- alcune parti già costruite resterebbero accese solo in secondo piano oppure verrebbero congelate

Impatto sul lavoro già fatto:

- medio, perché non distrugge tutto ma chiede scelte nette su cosa lasciare principale

### Strada C: congelare e decidere dopo

Idea:

- lasciare il modulo così com’è
- usarlo dove oggi si comporta bene
- continuare a gestire a mano i casi manutenzione più delicati

Pro:

- nessun rischio immediato
- puoi osservare con calma i casi reali

Contro:

- restano la confusione mentale e i doppioni
- il caso manutenzioni continua a non essere affidabile

Impatto sul lavoro già fatto:

- basso adesso, ma il costo si sposta in avanti

## 10. Domande aperte (massimo 5)

1. Vuoi che la IA interna resti prima di tutto una chat, oppure vuoi che diventi soprattutto una scrivania documenti?
2. Per te il flusso “più file insieme” deve passare da unione vera dei PDF oppure basta un riepilogo unico sopra file separati?
3. Nelle fatture officina il dato decisivo deve essere sempre la targa del mezzo, anche quando il foglio contiene molte righe materiali?
4. Lo storico documenti separato deve restare un luogo di lavoro oppure solo un archivio da consultare?
5. Il server separato della IA deve essere considerato parte stabile del sistema, oppure deve restare solo un aiuto facoltativo?

---

## Note

[1] Fonti principali per ingressi Home e testi visibili: `src/next/components/HomeInternalAiLauncher.tsx`.

[2] Fonte principale per pagina IA interna, card alta, chat, revisione, testi visibili e collegamenti finali: `src/next/NextInternalAiPage.tsx`.

[3] Fonte principale per il motore storico documenti, analisi file singolo, salvataggi e import in inventario: `src/pages/IA/IADocumenti.tsx`.

[4] Fonti principali per il comportamento della chat, con server separato o ripiego prudente: `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`, `src/next/internal-ai/internalAiChatOrchestrator.ts`, `src/next/internal-ai/internalAiServerChatClient.ts`.

[5] Fonte principale per il comportamento degli allegati della chat: `src/next/internal-ai/internalAiChatAttachmentsClient.ts`.

[6] Fonte principale per il riepilogo unico costruito sopra più file: `src/next/internal-ai/internalAiDocumentAnalysis.ts`.

[7] Fonte principale per la prima classificazione del documento verso magazzino, mezzo, preventivo o altro: `src/next/internal-ai/internalAiUniversalDocumentRouter.ts`.

[8] Fonte principale per la destinazione finale e le proposte come `Apri in Magazzino`: `src/next/internal-ai/internalAiUniversalHandoff.ts`, `src/next/internal-ai/internalAiUniversalOrchestrator.ts`.

[9] Fonti principali per il server separato della IA, il contenitore dedicato, la lettura documenti e la memoria della IA: `backend/internal-ai/server/internal-ai-adapter.js`, `backend/internal-ai/server/internal-ai-document-extraction.js`, `backend/internal-ai/server/internal-ai-chat-attachments.js`, `backend/internal-ai/server/internal-ai-persistence.js`, `backend/internal-ai/server/internal-ai-repo-understanding.js`.

[10] Fonte principale per l’ingresso dallo strumento unisci documenti: `src/next/NextStrumentiUnisciDocumentiPage.tsx`, `src/next/strumenti/pendingMergeStore.ts`.
