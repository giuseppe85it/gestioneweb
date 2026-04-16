# Scopo del documento
Questo documento descrive in modo fedele la UI reale attuale dell'area IA del progetto, con focus sulle superfici che l'utente vede oggi e sui flussi effettivamente montati nel repo. Serve come sorgente leggibile per ricostruire un prototipo HTML/React separato dal codice reale, senza reinterpretare la UX e senza introdurre miglioramenti o semplificazioni.

L'obiettivo non e proporre una nuova interfaccia, ma rendere riproducibili:
- le schermate reali;
- i punti di ingresso;
- i rami documentali visibili;
- le review e gli stati;
- i modali e i pannelli di supporto;
- i testi visibili;
- le transizioni principali fra gli stati.

# Panoramica delle superfici IA attuali
Le superfici IA attuali si dividono in due blocchi concettuali principali e in alcuni verticali collegati.

Il primo blocco e `IA Report`.
- E la parte conversazionale e di consultazione.
- Usa il linguaggio di una console report, non di un archivio documentale.
- Include chat, allegati rapidi, storico documenti unificato, review documento operativa e anteprima PDF report.
- Espone sezioni tecniche dedicate a sessioni, richieste, artifacts e audit.

Il secondo blocco e `Archivista documenti`.
- E la parte guidata e non chat.
- Obbliga prima a scegliere tipo documento e contesto.
- Poi mostra il ramo selezionato.
- Dentro il ramo compaiono upload, analisi, review, controllo duplicati e archiviazione.

Attorno a questi due blocchi ci sono superfici IA collegate:
- `Documenti e costi`: storico dei documenti archiviati con ricerca, filtri, apertura PDF e riapertura review.
- `Estrazione Libretto Mezzo`: pagina verticale dedicata ai libretti.
- `Copertura Libretti + Foto`: tabella di copertura documentale mezzi.
- `Cisterna Caravate IA`: verticale specialistico separato, visibile come fuori V1 dall'ingresso IA 2.
- La home IA storica `/next/ia`, che aggrega gli strumenti IA classici in card cliccabili.

Differenze operative fra le superfici:
- `IA Report` e centrata su richiesta, allegati, consultazione e modali di review/report.
- `Archivista documenti` e centrata su scelta guidata del ramo e archiviazione confermata.
- `Storico documenti` e una tabella archivio, non una chat e non un wizard.
- `Libretto` e un flusso singolo di upload/anteprima/analisi/salvataggio.
- `Copertura libretti` e una vista tabellare di controllo/riparazione.
- `Cisterna` e una pagina separata con card documento, preview e form estrazione.

# Route e ingressi reali
Route NEXT reali rilevate in `src/App.tsx`:
- `/next/ia` -> `NextIntelligenzaArtificialePage`
- `/next/ia/report` -> `NextInternalAiPage`
- `/next/ia/archivista` -> `NextIAArchivistaPage`
- `/next/ia/interna` -> `NextInternalAiPage`
- `/next/ia/interna/sessioni` -> `NextInternalAiPage` sezione `sessions`
- `/next/ia/interna/richieste` -> `NextInternalAiPage` sezione `requests`
- `/next/ia/interna/artifacts` -> `NextInternalAiPage` sezione `artifacts`
- `/next/ia/interna/audit` -> `NextInternalAiPage` sezione `audit`
- `/next/ia/libretto` -> `NextIALibrettoPage`
- `/next/ia/documenti` -> `NextIADocumentiPage`
- `/next/ia/copertura-libretti` -> `NextIACoperturaLibrettiPage`
- `/next/cisterna/ia` -> `NextCisternaIAPage`

Route legacy ancora presenti e leggibili come confronto:
- `/ia/libretto`
- `/ia/documenti`
- `/ia/copertura-libretti`
- `/cisterna/ia`

Ingressi reali verso la IA:
- Dalla home NEXT esiste un lanciatore visuale a doppio pannello (`HomeInternalAiLauncher`) che separa `IA Report` e `Archivista documenti`.
- Dalla home IA classica `/next/ia` si entra tramite card in `Documenti IA`, `Estrazione Libretto`, `Copertura Libretti + Foto`, `Cisterna Caravate IA`, `API Key IA`.
- Dentro `IA Report` compaiono link espliciti a `Archivista documenti` e `Storico documenti`.
- Dentro `Archivista documenti` compaiono link espliciti a `IA Report` e `Apri storico documenti`.

Aspetto dell'ingresso doppio `HomeInternalAiLauncher`:
- Layout in due pannelli affiancati.
- Pannello sinistro: `IA 1`, titolo `IA Report`, pill `Sola lettura`, input singolo con placeholder `Chiedi un report, una targa, un fornitore...`, bottone `Apri`, nota `Chat e report senza scritture business`, bottone `Apri IA Report`.
- Pannello destro: `IA 2`, titolo `Archivista documenti`, pill `Flusso guidato`, testo `Prima scegli il tipo e il contesto. Poi carichi il file. Questa area non e una chat.`, griglia di 4 quick action, footer con `4 ingressi V1 attivi`, pulsanti `Apri Archivista` e `Storico documenti`, riga finale `Fuori V1` con chip `Cisterna Caravate`.

Aspetto dell'ingresso storico `/next/ia`:
- Pagina con header `Intelligenza Artificiale`.
- Badge `API KEY: OK` o `API KEY: MANCANTE`.
- Sezione `Strumenti attivi` con card cliccabili.
- Sezione `In arrivo` con card disattivate.
- Linguaggio ancora legato alla IA storica, incluso `Gestisci la tua chiave Gemini`.

# Schermata Archivista documenti
La schermata `Archivista documenti` e una pagina singola a due colonne, preceduta da hero e da tre card meta.

Hero:
- Eyebrow `IA 2`
- Titolo `Archivista documenti`
- Descrizione: `Questa e l'area per caricare e archiviare documenti. Non e una chat: prima scegli tipo e contesto, poi carichi il file.`
- Azioni a destra: link `Vai a IA Report` e link `Apri storico documenti`

Meta card sotto il hero:
- Card 1:
  - eyebrow `Rami attivi ora`
  - testo forte: `Fattura / DDT + Magazzino, Fattura / DDT + Manutenzione, Documento mezzo, Preventivo + Magazzino`
  - meta: `In questo step Archivista analizza davvero le quattro famiglie V1 e chiude il lato documenti con review, duplicati e archiviazione confermata.`
- Card 2:
  - eyebrow `Visibili ma fuori attivazione`
  - testo forte: `Preventivo manutenzione`
  - meta: `Resta visibile come direzione futura ma non entra in Archivista V1.`
- Card 3:
  - eyebrow `Fuori V1`
  - testo forte: `Preventivo manutenzione, Cisterna, Euromecc, Carburante`
  - meta: `Restano fuori dal primo passo dell'Archivista e non compaiono come rami operativi.`

Layout principale:
- Due pannelli affiancati.
- Colonna sinistra: selezione guidata.
- Colonna destra: riepilogo del flusso scelto e montaggio del bridge operativo.

Colonna sinistra:
- Sezione `Passo 1`
  - titolo `Tipo documento`
  - badge in alto a destra con stato del ramo attualmente selezionato.
  - griglia di card/bottoni:
    - `Fattura / DDT` con sottotesto `Materiali, fornitori e documenti di acquisto.`
    - `Preventivo` con sottotesto `Preventivi da archiviare prima di ogni decisione.`
    - `Documento mezzo` con sottotesto `Libretto, assicurazione, revisione e collaudo.`
- Sezione `Passo 2`
  - titolo `Contesto`
  - griglia di card/bottoni:
    - `Magazzino` con sottotesto `Ricambi, materiali, DDT e fatture di acquisto.`
    - `Manutenzione` con sottotesto `Documenti legati a lavori officina e interventi sul mezzo.`
    - `Documento mezzo` con sottotesto `Archivio del mezzo con conferma finale dell'utente.`
  - I contesti non compatibili restano visibili ma attenuati e non cliccabili.

Colonna destra:
- Sezione `Passo 3`
  - titolo dinamico uguale al ramo attivo.
  - badge dinamico:
    - `Attivo ora`
    - `Fuori V1`
    - `Non disponibile`
- Box `Flusso selezionato`
  - eyebrow `Flusso selezionato`
  - titolo dinamico
  - paragrafo descrittivo del ramo

Stato iniziale visivo:
- Di default parte su `Fattura / DDT + Magazzino`.
- Quindi il primo bridge mostrato e quello magazzino.

Comportamento se il ramo non e attivo:
- Al posto del bridge compare un box di shell inattiva.
- Il box mostra eyebrow con badge del ramo, titolo del ramo, descrizione e testo finale:
  - `In questo step partono solo i rami gia attivi di Archivista. Qui non parte ancora nessuna analisi nuova.`

Struttura visuale generale del bridge attivo:
- Intro box con titolo ramo e pill `Attivo ora`.
- Box upload con label forte del documento da caricare.
- Riga meta file.
- Riga azioni con bottone `Analizza documento`.
- Griglia review a tre colonne.
- Griglia archivio/duplicati a due colonne.
- Callout finali post archiviazione.

# Rami documentali visibili
Di seguito i rami visibili nella UI di Archivista, con esito reale lato interfaccia.

## Fattura / DDT + Magazzino
Selezione:
- Tipo `Fattura / DDT`
- Contesto `Magazzino`

Badge:
- `Attivo ora`

Testi introduttivi:
- Titolo flusso `Fattura / DDT magazzino`
- Descrizione nel riepilogo: analisi reale per fatture e DDT di acquisto, review dentro Archivista, nessuna chat, nessuna azione finale automatica.

Bridge visibile:
- Intro con eyebrow `Ramo attivo in questo step`
- Upload con label forte `Carica fattura o DDT di magazzino`
- Bottoni e stati:
  - `Analizza documento`
  - durante loading `Analisi in corso...`

Review visibile:
- Colonna originale con `Stato analisi`
- Colonna dati con eyebrow `Dati estratti principali` e titolo `Review Magazzino`
- Colonna esito con callout stato archivio
- Sezione righe trovate separata
- Sezione avvisi
- Sezione duplicati

Callout principali:
- Prima dell'archiviazione:
  - `Documento analizzato`
  - `Non ancora archiviato`
- Dopo archiviazione:
  - `Documento archiviato`
  - `Originale disponibile`
- Link/bottone finale: `Apri originale archiviato`

Duplicati:
- Bottone `Controlla duplicati`
- Scelta utente:
  - `Stesso documento`
  - `Versione migliore`
  - `Documento diverso`

Conferma finale:
- Bottone `Conferma e archivia`

Stato rispetto a V1:
- Attivo.

## Fattura / DDT + Manutenzione
Selezione:
- Tipo `Fattura / DDT`
- Contesto `Manutenzione`

Badge:
- `Attivo ora`

Testi introduttivi:
- Titolo flusso `Fattura / DDT manutenzione`
- Descrizione nel riepilogo: analisi reale per documenti officina e costi manutenzione, review separata da Magazzino, nessuna manutenzione creata.

Bridge visibile:
- Intro con eyebrow `Ramo attivo in questo step`
- Upload con label forte `Carica fattura o DDT officina`
- Riga azioni con:
  - `Analizza documento`
  - helper `Review distinta da Magazzino: archivio solo su conferma, nessuna manutenzione viene creata.`

Review visibile:
- Colonna originale con `Stato analisi`
- Colonna dati con eyebrow `Dati estratti principali` e titolo `Review Manutenzione`
- Colonna esito con eyebrow `Esito proposto` e titolo `Review pronta, archivio su conferma`
- Box righe con categorizzazione `Materiali`, `Manodopera`, `Ricambi`, `Altro`
- Sezione `Campi mancanti`
- Sezione `Passi futuri previsti`

Callout principali:
- Prima dell'archiviazione:
  - `Documento analizzato`
  - `Non ancora archiviato`
  - `Nessuna manutenzione ancora creata`
- Dopo archiviazione:
  - `Documento archiviato`
  - `Originale disponibile`
  - `Nessuna manutenzione ancora creata`

Passi futuri visibili ma non attivi:
- `Collega a manutenzione esistente`
- `Crea nuova manutenzione`
- `Lascia solo archiviato`

Duplicati:
- `Controlla duplicati`
- `Stesso documento`
- `Versione migliore`
- `Documento diverso`

Conferma finale:
- `Conferma e archivia`

Stato rispetto a V1:
- Attivo.

## Documento mezzo
Selezione:
- Tipo `Documento mezzo`
- Contesto `Documento mezzo`

Badge:
- `Attivo ora`

Testi introduttivi:
- Titolo flusso `Documento mezzo`
- Descrizione nel riepilogo: analisi reale per libretto, assicurazione, revisione e collaudo; archivio prima, update mezzo sempre esplicito.

Bridge visibile:
- Intro con ramo attivo
- Selettore sottotipo a segmenti
- Upload con label forte `Carica documento mezzo`
- Riga azioni con analisi

Review visibile:
- Colonna originale con `Stato analisi`
- Colonna dati con titolo `Review Documento mezzo`
- Colonna esito con titolo operativo orientato all'archivio e all'update facoltativo
- Box mezzo da collegare
- Box preview update campi mezzo
- Box duplicati

Callout principali:
- Prima dell'archiviazione:
  - `Documento analizzato`
  - `Non ancora archiviato`
  - `Aggiornamento mezzo sempre esplicito`
- Dopo archiviazione:
  - `Documento archiviato`
  - `Originale disponibile`
  - `Aggiornamento mezzo sempre esplicito`
- Se update eseguito:
  - callout separato `Update mezzo completato`

Duplicati:
- `Controlla duplicati`
- `Stesso documento`
- `Versione migliore`
- `Documento diverso`

Conferma finale:
- `Conferma e archivia`

Stato rispetto a V1:
- Attivo.

## Preventivo + Magazzino
Selezione:
- Tipo `Preventivo`
- Contesto `Magazzino`

Badge:
- `Attivo ora`

Testi introduttivi:
- Titolo flusso `Preventivo magazzino`
- Descrizione nel riepilogo: analisi reale per preventivi di magazzino con review dedicata, regola duplicati e archiviazione finale nel ramo preventivi.

Bridge visibile:
- Intro con ramo attivo
- Upload con label forte `Carica preventivo di magazzino`
- Riga helper con testo `Nessun listino viene aggiornato automaticamente in questo step.`

Review visibile:
- Colonna 1: preview/originale e `Stato analisi`
- Colonna 2: `Review Preventivo + Magazzino`
- Colonna 3: esito archivio con focus su assenza di azioni business dopo archivio
- Sezione righe materiali
- Sezione avvisi

Callout principali:
- Prima dell'archiviazione:
  - `Documento analizzato`
  - `Non ancora archiviato`
  - `Nessuna azione business dopo archivio`
- Dopo archiviazione:
  - `Documento archiviato`
  - `Originale disponibile`
  - `Nessuna azione business dopo archivio`

Duplicati:
- `Controlla duplicati`
- `Stesso documento`
- `Versione migliore`
- `Documento diverso`

Conferma finale:
- `Conferma e archivia`

Stato rispetto a V1:
- Attivo.

## Rami visibili ma non operativi o fuori V1
Visibili nella pagina Archivista come combinazioni o come stato descritto:
- `Preventivo manutenzione`
  - visibile come ramo descritto
  - badge `Fuori V1`
  - non monta alcun bridge
- `Fattura / DDT + Documento mezzo`
  - badge `Non disponibile`
- `Preventivo + Documento mezzo`
  - badge `Non disponibile`
- `Documento mezzo + Magazzino`
  - badge `Non disponibile`
- `Documento mezzo + Manutenzione`
  - badge `Non disponibile`

Fuori V1 richiamati anche fuori dal wizard:
- `Cisterna Caravate` come chip separato nell'ingresso IA 2
- Nel testo meta compaiono anche `Euromecc` e `Carburante`, ma non come card operative dentro Archivista.

# Documento mezzo
Il ramo `Documento mezzo` ha piu varianti visibili degli altri rami, perche introduce un sottotipo esplicito prima dell'analisi e una scelta separata sul mezzo.

Sottotipi visibili:
- `Libretto` con descrizione `Dati veicolo, telaio e immatricolazione.`
- `Assicurazione` con descrizione `Compagnia, copertura e riferimenti principali.`
- `Revisione` con descrizione `Scadenze e riferimenti revisione.`
- `Collaudo` con descrizione `Esito e data del collaudo mezzo.`

Come si scelgono:
- Tramite una griglia segmentata di card-bottone.
- La card attiva cambia bordo e sfondo in verde chiaro.

Campi che compaiono nella review:
- `Sottotipo letto`
- `Targa`
- `Telaio`
- `Proprietario`
- `Assicurazione / Ente`
- `Data documento`
- `Scadenza letta`
- `Ultimo collaudo`

Sezione esito:
- Testo guida orientato a `Archivio prima, update mezzo solo se vuoi`.
- Callout stabili che ricordano che l'aggiornamento mezzo non e automatico.

Sezione mezzo:
- Card `Collegamento al mezzo` o equivalente.
- Select `Mezzo` per scegliere il mezzo da collegare.
- Checkbox testuale:
  - `Aggiorna anche i campi del mezzo dopo l'archiviazione`
- Anteprima update:
  - elenco campi attuali e nuovi
  - tono di preview, non di salvataggio silenzioso

Condizioni visive:
- Se non ci sono update utili, compare uno stato vuoto equivalente a `Nessun update obbligato`.
- Se il documento e gia archiviato e l'update e stato confermato, compare un callout di completamento update.

Sezioni fisse del ramo:
- intro ramo
- segmenti sottotipo
- upload
- review a tre colonne
- collegamento mezzo
- duplicati
- conferma archivio

Sezioni condizionali:
- preview update campi mezzo
- callout post update
- lista warnings e campi mancanti
- bottone `Apri originale archiviato` dopo il salvataggio

# Preventivo magazzino
Il ramo `Preventivo + Magazzino` e strutturalmente simile ai rami fattura, ma il microcopy ruota intorno all'assenza di aggiornamento automatico del listino.

Stato selezione:
- Si ottiene scegliendo `Preventivo` nel primo passo e `Magazzino` nel secondo.
- Il contesto `Manutenzione` non e selezionabile per `Preventivo`.

Upload:
- Label forte `Carica preventivo di magazzino`

Review:
- Colonna 1: preview/originale e `Stato analisi`
- Colonna 2: `Review Preventivo + Magazzino`
- Colonna 3: esito archivio con frase chiave `Nessun listino viene aggiornato automaticamente in questo step.`

Dati mostrati:
- `Tipo documento`
- `Fornitore`
- `Numero preventivo`
- `Data`
- `Totale`
- `Righe lette`

Righe e prezzi:
- C'e una sezione dedicata alle righe materiali lette.
- La struttura visuale riprende il pattern delle row card Archivista: descrizione principale, micro-meta e valori economici.

Messaggi prima della conferma:
- `Documento analizzato`
- `Non ancora archiviato`
- `Nessuna azione business dopo archivio`

Messaggi dopo la conferma:
- `Documento archiviato`
- `Originale disponibile`
- bottone `Apri originale archiviato`

Duplicati:
- stesso pattern degli altri rami.

# Modali e pannelli che si aprono
Le superfici IA attuali usano piu modali e pannelli, alcuni dentro `IA Report`, altri dentro lo storico o i verticali.

## 1. Storico documenti in IA Report
Tipo:
- sheet laterale/overlay largo, non fullscreen pieno ma pannello importante sopra pagina.

Come si apre:
- Dal bottone `Storico documenti` dentro `IA Report`.

Contenuto:
- eyebrow `Storico documenti`
- titolo `Motore Documenti IA`
- descrizione `Filtri, originale, review e destinazione finale del flusso documentale unificato.`
- pulsante `Chiudi`
- riga filtri a bottoni
- lista documenti storici renderizzata sotto

Come si chiude:
- click su backdrop
- bottone `Chiudi`

## 2. Review documento operativa
Tipo:
- modal fullscreen/overlay grande a tutta altezza, con due colonne interne.

Come si apre:
- Da una proposta documento dentro `IA Report`
- Dalla review unificata documentale
- Dallo storico documenti/riapertura review secondo il route target

Toolbar:
- eyebrow `Review documento operativa`
- titolo dinamico:
  - classificazione del documento
  - oppure `Documento logico unificato` se piu allegati sono trattati come gruppo logico
- meta con nome file o conteggio allegati
- pill stato, pill azione, pill confidenza
- pulsanti:
  - `Apri originale`
  - bottone di handoff verso la route di destinazione
  - `Chiudi`

Tabs route/allegati:
- presenti se le route documento sono piu di una
- ogni tab mostra:
  - titolo route o `Allegato N`
  - nome file

Colonna sinistra:
- preview toolbar con pill
- eventuali bottoni `Riduci zoom` e `Aumenta zoom`
- superficie preview con immagine, iframe PDF oppure pre testo
- se preview assente compare stato vuoto con invito a usare `Apri originale`

Colonna destra, sezioni in ordine:
- `Documento`
- `Righe estratte`
- `Match inventario`
- `Decisione utente`
- `Azione proposta IA`
- `Dettagli tecnici`

Punti chiave della sezione `Decisione utente`:
- mostra la scelta attuale in forma leggibile
- propone card cliccabili con label, descrizione, eventuale nota di disabilitazione
- usa pill `Scelta utente` e `Suggerita dalla IA`

Punti chiave della sezione `Azione proposta IA`:
- `Proposta sintetica`
- `Motivazione utile`
- `Cosa fara / non fara`
- eventuale alert `Domanda breve prima di procedere`
- box di esecuzione con CTA primaria e bottone secondario di handoff

Sezione tecnica:
- chiusa in `<details>`
- summary `Apri dettagli tecnici e testo di supporto`
- fact grid tecnica
- box `Evidenza documento`

Come si chiude:
- click su backdrop
- bottone `Chiudi`

## 3. Anteprima PDF del report
Tipo:
- modal centrale larga con backdrop.

Come si apre:
- Dalla parte report quando si apre il PDF del report corrente o di un artifact.

Contenuto:
- eyebrow `Anteprima PDF del report`
- titolo del report
- meta artifact
- testo `PDF reale generato al volo dall'artifact IA dedicato. Nessuna scrittura business automatica.`
- bottoni:
  - `Copia contenuto`
  - `Scarica PDF IA`
  - `Condividi PDF IA` se supportato dal browser
  - `Chiudi`
- shell PDF con pill:
  - `PDF pronto` oppure `Generazione PDF in corso` oppure `Fallback documento`
  - `Periodo ...`
  - tipo report
- viewer PDF oggetto/iframe
- details finale `Leggi il report gestionale`

Come si chiude:
- click su backdrop
- bottone `Chiudi`

## 4. Modal dettaglio documento in Storico documenti
Tipo:
- modal centrale classica con overlay.

Come si apre:
- clic su una riga in `Documenti e costi`

Contenuto:
- titolo `[{tipo}] fornitore - numero`
- bottone `Chiudi`
- griglia campi:
  - `Fornitore`
  - `Data`
  - `Numero`
  - `Targa`
  - `Importo`
  - `Valuta`
- bottoni finali:
  - `Apri PDF originale`
  - `Da verificare`
  - `Riapri review`
  - `Chiedi IA ->`

Come si chiude:
- click fuori dal modal
- bottone `Chiudi`

## 5. Viewer libretto
Tipo:
- modal/overlay centrale grande sopra la pagina libretto.

Come si apre:
- Da `Apri Foto` nell'archivio libretti.

Contenuto:
- titolo `Viewer libretto`
- bottone `Chiudi`
- controlli:
  - `Ruota 90 gradi`
  - `Reset`
  - `Zoom +`
  - `Zoom -`
- area immagine scrollabile e trasformabile
- se errore di caricamento:
  - messaggio errore
  - bottone `Cerca in Archivio IA`

Come si chiude:
- click fuori
- bottone `Chiudi`

## 6. Modale valuta in Documenti IA legacy
Tipo:
- modal semplice per valore valuta.

Come si apre:
- Durante il salvataggio o il controllo di documenti legacy quando la valuta va impostata.

Contenuto:
- titolo `Imposta valuta`
- bottoni `EUR`, `CHF`, `Annulla`

## 7. Pannelli Archivista
Nel nuovo `Archivista documenti` non ci sono modali dedicati per review o duplicati.
- Tutta la review avviene inline nella pagina.
- I duplicati sono mostrati come card e bottoni nello stesso flusso.
- L'apertura dell'originale archiviato avviene con bottone/link e non apre un modal proprietario del ramo.

# Testi visibili reali
Di seguito i testi visibili raggruppati per superficie.

## Ingresso doppio IA
Titoli e stati:
- `IA 1`
- `IA Report`
- `Sola lettura`
- `IA 2`
- `Archivista documenti`
- `Flusso guidato`
- `Fuori V1`

Testi di supporto:
- `Chiedi report, controlli o sintesi. Questa area resta la parte chat e non e l'archivista documenti.`
- `Prima scegli il tipo e il contesto. Poi carichi il file. Questa area non e una chat.`
- `Chat e report senza scritture business`
- `4 ingressi V1 attivi`

Placeholder e pulsanti:
- `Chiedi un report, una targa, un fornitore...`
- `Apri`
- `Apri IA Report`
- `Apri Archivista`
- `Storico documenti`
- `Cisterna Caravate`

Quick action:
- `Fattura / DDT magazzino`
- `Fattura manutenzione`
- `Preventivo magazzino`
- `Documento mezzo`

## Archivista documenti
Titoli:
- `IA 2`
- `Archivista documenti`
- `Passo 1`
- `Tipo documento`
- `Passo 2`
- `Contesto`
- `Passo 3`
- `Flusso selezionato`

Label tipo:
- `Fattura / DDT`
- `Preventivo`
- `Documento mezzo`

Label contesto:
- `Magazzino`
- `Manutenzione`
- `Documento mezzo`

Badge/stati:
- `Attivo ora`
- `Fuori V1`
- `Non disponibile`

Link:
- `Vai a IA Report`
- `Apri storico documenti`

Meta card:
- `Rami attivi ora`
- `Visibili ma fuori attivazione`
- `Fuori V1`

## Rami Archivista
Testi ricorrenti:
- `Ramo attivo in questo step`
- `Analizza documento`
- `Analisi in corso...`
- `Stato analisi`
- `Dati estratti principali`
- `Esito proposto`
- `Controlla duplicati`
- `Conferma e archivia`
- `Apri originale archiviato`
- `Stesso documento`
- `Versione migliore`
- `Documento diverso`
- `Documento analizzato`
- `Non ancora archiviato`
- `Documento archiviato`
- `Originale disponibile`

Testi specifici Magazzino:
- `Carica fattura o DDT di magazzino`
- `Review Magazzino`

Testi specifici Manutenzione:
- `Carica fattura o DDT officina`
- `Review Manutenzione`
- `Review pronta, archivio su conferma`
- `Nessuna manutenzione ancora creata`
- `Passi futuri previsti`
- `Collega a manutenzione esistente`
- `Crea nuova manutenzione`
- `Lascia solo archiviato`

Testi specifici Documento mezzo:
- `Carica documento mezzo`
- `Libretto`
- `Assicurazione`
- `Revisione`
- `Collaudo`
- `Assicurazione / Ente`
- `Scadenza letta`
- `Ultimo collaudo`
- `Aggiornamento mezzo sempre esplicito`
- `Aggiorna anche i campi del mezzo dopo l'archiviazione`

Testi specifici Preventivo:
- `Carica preventivo di magazzino`
- `Review Preventivo + Magazzino`
- `Nessun listino viene aggiornato automaticamente in questo step.`
- `Nessuna azione business dopo archivio`

## IA Report
Titoli:
- `IA Report`
- `Console report`
- `Questa pagina e la parte report`
- `Storico documenti`
- `Motore Documenti IA`
- `Review documento operativa`
- `Anteprima PDF del report`

Microcopy principali:
- `Chat e report in sola lettura. Per caricare e archiviare documenti usa Archivista documenti.`
- `Live-read business chiuso: la IA usa clone/read model, snapshot server-side curate e nessuna scrittura business.`
- `Qui restano chat, consultazione e allegati rapidi gia esistenti. Il nuovo ingresso corretto per archiviare documenti e Archivista documenti.`
- `Supporto allegati attuale: Documenti IA`
- `Questo blocco resta disponibile per non rompere i flussi tecnici gia presenti, ma non rappresenta piu l'Archivista finale.`
- `Nessuna conversazione in corso.`
- `Scrivi una richiesta o allega un file. La review si apre solo quando il flusso ha davvero qualcosa da verificare.`
- `Scrivi o allega...`
- `Apri originale`
- `Riduci zoom`
- `Aumenta zoom`
- `Decisione utente`
- `Azione proposta IA`
- `Dettagli tecnici`
- `Apri dettagli tecnici e testo di supporto`
- `Copia contenuto`
- `Scarica PDF IA`
- `Condividi PDF IA`
- `Leggi il report gestionale`

## Storico documenti
Titoli:
- `Documenti e costi`
- `Totale generale tutti i fornitori`

Filtri:
- `Tutti`
- `Fatture`
- `DDT`
- `Preventivi`
- `Da verificare`

Placeholder e bottoni:
- `Cerca fornitore, targa, importo`
- `PDF`
- `Riapri review`
- `Chiedi alla IA`
- `Apri PDF originale`
- `Da verificare`
- `Chiedi IA ->`
- `Chiudi`

## Libretto
Titoli:
- `Estrazione Libretto Mezzo`
- `Caricamento libretto`
- `Anteprima e risultati`
- `Dati estratti`
- `Archivio libretti IA`
- `Viewer libretto`

Pulsanti:
- `Vai a API Key IA`
- `Analizza con IA`
- `Torna al menu IA`
- `Salva nei documenti del mezzo`
- `Apri Foto`
- `Apri PDF`
- `Ruota 90 gradi`
- `Reset`
- `Zoom +`
- `Zoom -`
- `Cerca in Archivio IA`

Stati:
- `Caricamento...`
- `API Key IA mancante`
- `Nessuna anteprima`
- `Caricamento archivio...`
- `Nessun libretto trovato.`

## Copertura libretti
Titoli e controlli:
- `COPERTURA LIBRETTI + FOTO`
- `Cerca per targa...`
- `Mostra`
- `Tutti`
- `Libretti mancanti`
- `Foto mancanti`
- `Mancano entrambi`
- `Ripara libretti da lista ID`
- `ESEGUI RIPARAZIONE`
- `Carica libretto`
- `Ripara libretto`
- `Apri libretto`
- `URL ROTTO`
- `Verifica...`

## Cisterna
Titoli:
- `Cisterna Caravate IA`
- `Fatture e Bollettini`
- `Risultato estrazione`

Pulsanti:
- `Vai a Cisterna`
- `Torna a IA`
- `Analizza documento (IA)`
- `Salva in archivio cisterna`

Badge:
- `DA VERIFICARE`
- `OK`

# Struttura visiva della pagina
La struttura visiva della IA non e uniforme: ci sono pagine molto pulite e guide step-by-step, e altre piu dense e operative.

## Ingresso doppio IA
- Due pannelli paralleli con pari peso visivo.
- `IA Report` a sinistra ha aspetto neutro chiaro.
- `Archivista documenti` a destra ha sfondo leggermente verdino e appare piu “guidato”.
- Ogni pannello ha:
  - header compatto;
  - un blocco testo introduttivo;
  - corpo centrale;
  - footer con pulsanti.
- La griglia quick action di Archivista e 2x2 su desktop.

## Archivista documenti
- Hero singolo in alto.
- Subito sotto, tre card meta in una griglia 3 colonne.
- Sotto ancora, due pannelli larghi affiancati.
- Pannello sinistro:
  - piu corto
  - contiene solo scelta tipo e contesto
  - card selezione tutte simili, alte e compatte
- Pannello destro:
  - piu denso
  - contiene riepilogo flusso e tutto il bridge
- Dentro ogni bridge:
  - intro box orizzontale
  - upload box tratteggiato
  - riga file meta
  - riga azioni
  - review grid a 3 colonne
  - eventuale sezione righe full width
  - archive grid a 2 colonne
  - bottone finale di conferma

Rumore visivo reale della pagina:
- C'e molta informazione “a scatole”.
- Le review usano molte card annidate e molti micro-box.
- Le pill e i callout sono numerosi, soprattutto nei rami Manutenzione e Documento mezzo.
- La densita cresce molto dopo l'analisi, mentre prima dell'upload la pagina e relativamente pulita.

## Review documento operativa in IA Report
- Overlay totale.
- Foglio grande con sfondo caldo/beige.
- Toolbar grande in alto.
- Route tabs sotto toolbar.
- Corpo in due colonne molto nette:
  - preview documento piu larga a sinistra
  - review pane piu stretta a destra
- La colonna destra e uno stack di sezioni tondeggianti.
- Il blocco `Righe estratte` e il pezzo piu tabellare e più visivamente dominante della review.

## Storico documenti
- Pagina tabellare classica.
- Header orizzontale con titolo e tre statistiche.
- Riga filtri orizzontale.
- Lista raggruppata per fornitore con accordion.
- Tabella interna per gruppo.
- Modal dettaglio centrale piu tradizionale e meno “designed” dell'overlay IA Report.

## Libretto
- Due colonne desktop nette:
  - sinistra upload
  - destra preview e risultati
- Sotto, archivio libretti a tutta larghezza.
- Viewer immagine in overlay semplice con toolbar tecnica.

## Copertura libretti
- Pagina fortemente tabellare.
- Parte alta con controlli e textarea riparazione.
- Parte bassa con tabella mezzi.
- In debug la pagina si allunga molto con blocchi diagnostici.

## Cisterna
- Pagina con header e una o due grandi card.
- Prima card upload/preview/azioni.
- Seconda card form di estrazione.
- Linguaggio piu verticale, meno coerente con Archivista.

# Stati e transizioni
La macchina degli stati della UI e leggibile e abbastanza consistente, soprattutto in Archivista.

## Stato iniziale IA
- L'utente puo entrare da:
  - home lanciatore doppio
  - home IA classica
  - route dirette

## Archivista
Sequenza tipica:
1. Stato iniziale con ramo di default `Fattura / DDT + Magazzino`
2. Selezione o cambio `Tipo documento`
3. Selezione o cambio `Contesto`
4. Se il ramo e attivo, compare il bridge relativo
5. File non caricato:
   - pulsante analisi presente ma di fatto inattivo o con errore se premuto senza file
   - placeholder/preview vuoti
6. File caricato:
   - compare nome file e meta file
7. Analisi in corso:
   - bottone passa a `Analisi in corso...`
8. Review pronta:
   - compare la griglia review
   - compaiono callout, warnings, campi mancanti e righe
9. Controllo duplicati:
   - bottone `Controlla duplicati`
   - appaiono candidati e scelta secca fra tre opzioni
10. Conferma archivio:
   - bottone `Conferma e archivia`
11. Documento archiviato:
   - callout cambia in `Documento archiviato`
   - compare accesso all'originale archiviato
12. Eventuali stati successivi:
   - per Documento mezzo puo esserci update mezzo confermato

Stati errore:
- file mancante
- analisi fallita
- duplicati non controllati prima della conferma
- archiviazione fallita

Rami non disponibili:
- restano navigabili solo come selezione, ma senza bridge attivo.

## IA Report
Sequenza tipica:
1. ingresso in overview report
2. digitazione prompt o allegato rapido
3. stato vuoto chat oppure thread esistente
4. eventuale review documento operativa aperta in modal
5. eventuale storico documenti aperto come sheet
6. eventuale report PDF aperto in modal

## Storico documenti
Sequenza tipica:
1. caricamento dataset
2. filtri e ricerca
3. apertura gruppo fornitore
4. click su riga
5. modal dettaglio
6. handoff verso review o chat IA

## Libretto
Sequenza tipica:
1. stato API key mancante oppure pagina attiva
2. caricamento file
3. preview immagine
4. analisi
5. vista risultati
6. archivio libretti consultabile
7. apertura viewer foto

# Mappatura ricostruibile per prototipo HTML/React
Questo blocco traduce la UI attuale in una specifica ricostruibile per un prototipo separato, senza accedere al repo.

## A. Superfici da ricreare
Ricreare almeno queste superfici come pagine o viste distinte:
- ingresso doppio `IA Report` / `Archivista documenti`
- pagina `Archivista documenti`
- pagina `IA Report`
- pagina `Documenti e costi`
- pagina `Estrazione Libretto Mezzo`
- pagina `Copertura Libretti + Foto`
- pagina `Cisterna Caravate IA`
- opzionale ma consigliato: home IA classica `/next/ia`

## B. Componenti visivi principali da ricreare
Componenti base:
- hero pagina con eyebrow, titolo, sottotitolo
- panel/card con bordo arrotondato e ombra leggera
- pill di stato
- card selezione tipo/contesto
- upload area con bordo tratteggiato
- row di file selezionati
- pulsanti primari, secondari, ghost
- grid review 3 colonne
- grid archivio/duplicati 2 colonne
- row card per righe materiali
- callout stato archivio
- fact grid a 2 colonne
- modal review fullscreen
- modal PDF report
- modal dettaglio documento
- modal viewer immagine

## C. Ordine dei blocchi da ricreare
Ingresso doppio:
1. pannello IA Report
2. pannello Archivista

Archivista:
1. hero
2. meta grid 3 card
3. colonna sinistra scelta
4. colonna destra riepilogo ramo
5. bridge attivo

Ogni bridge Archivista:
1. intro ramo
2. upload
3. meta file
4. azioni
5. review grid
6. eventuale rows section
7. archive grid
8. CTA finale
9. callout finale con originale archiviato

IA Report:
1. hero console report
2. split callout verso Archivista
3. shell principale con chat o review columns
4. aside funzioni e link
5. composer in basso
6. modali/sheet opzionali sopra tutto

## D. Interazioni da rendere davvero cliccabili nel prototipo
Da rendere interattive:
- cambio fra `IA Report` e `Archivista`
- quick action dell'ingresso Archivista
- selezione tipo documento
- selezione contesto
- selezione sottotipo documento mezzo
- caricamento file simulato
- bottone `Analizza documento`
- stato review pronta
- `Controlla duplicati`
- scelta:
  - `Stesso documento`
  - `Versione migliore`
  - `Documento diverso`
- `Conferma e archivia`
- `Apri originale archiviato`
- `Storico documenti`
- click su riga in storico e apertura modal
- `Riapri review`
- apertura `Review documento operativa`
- zoom immagine nella review modal
- apertura `Anteprima PDF del report`
- apertura `Viewer libretto`

## E. Elementi che possono essere statici ma visibili
Possono essere simulati senza logica reale:
- dati estratti precalcolati nei box review
- righe materiali
- warnings
- campi mancanti
- preview PDF e immagini come mock
- contatori documento/fornitori/totale
- lista per fornitore nello storico
- debug coverage libretti
- sezioni tecniche in IA Report

## F. Stati da simulare obbligatoriamente
Per il prototipo servono almeno questi stati navigabili:
- Archivista stato iniziale senza file
- Archivista con file caricato ma non analizzato
- Archivista con review pronta per:
  - Magazzino
  - Manutenzione
  - Documento mezzo
  - Preventivo magazzino
- Archivista con duplicato rilevato e tre scelte
- Archivista post archiviazione
- Documento mezzo con toggle update mezzo acceso/spento
- IA Report stato vuoto
- IA Report con messaggi chat
- IA Report con review documento operativa aperta
- IA Report con storico documenti aperto
- IA Report con anteprima PDF aperta
- Storico documenti con modal dettaglio aperto
- Libretto con preview e viewer aperto
- Copertura libretti con tabella e textarea riparazione

## G. Flussi cliccabili da simulare
Flusso 1: ingresso Archivista rapido
- click su `Fattura / DDT magazzino`
- arrivo su Archivista con preset selezionato
- upload mock
- analisi
- review
- duplicati
- archiviazione

Flusso 2: manutenzione
- quick action `Fattura manutenzione`
- review distinta da Magazzino
- callout `Nessuna manutenzione ancora creata`

Flusso 3: documento mezzo
- selezione sottotipo
- review con campi mezzo
- checkbox update mezzo
- archiviazione

Flusso 4: preventivo magazzino
- review con testo `Nessun listino viene aggiornato automaticamente in questo step.`
- archiviazione

Flusso 5: report/document review
- apri IA Report
- apri storico documenti
- apri review documento operativa
- apri anteprima PDF report

## H. Livello di fedelta richiesto al prototipo
Per essere fedele al prodotto reale, il prototipo deve mantenere:
- la separazione netta `IA 1` / `IA 2`
- la struttura a due pannelli dell'ingresso
- la struttura a due colonne di Archivista
- la review Archivista a tre colonne
- il sistema di badge `Attivo ora`, `Fuori V1`, `Non disponibile`
- la presenza dei rami fuori V1 ma visibili
- il peso visivo elevato della review modal di IA Report
- il carattere tabellare dello storico documenti
- la componente di controllo esplicito nei duplicati
- il fatto che Archivista non si presenti come chat

# File sorgente letti
File obbligatori letti:
- `src/App.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextIAArchivistaPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextIALibrettoPage.tsx`
- `src/next/NextCisternaIAPage.tsx`
- `src/next/components/HomeInternalAiLauncher.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
- `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaArchiveClient.ts`
- `src/next/internal-ai/internal-ai.css`
- `src/pages/IA/IADocumenti.tsx`
- `src/pages/IA/IALibretto.tsx`
- `src/pages/IA/IACoperturaLibretti.tsx`

File extra letti per completare la mappa UI reale:
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/NextIACoperturaLibrettiPage.tsx`

Documenti di contesto letti:
- `docs/product/SPEC_ESECUTIVA_IA_V1.md`
- `docs/product/SPEC_GUIDA_IA_REPORT_E_ARCHIVISTA.md`
- `docs/product/PIANO_ESECUTIVO_V1_IA_REPORT_E_ARCHIVISTA.md`
- `docs/product/AUDIT_PRE_SPEC_FINALE_IA2.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
