# VISIONE GUIDA IA 1 + IA 2 — GestioneManutenzione

## Scopo di questo documento

Questo documento serve come **guida unica** per capire:

- da dove partiamo oggi;
- perché l'IA attuale crea confusione;
- come deve diventare il sistema finale;
- quali regole non vanno più cambiate;
- quali parti entrano nella prima versione;
- quale percorso pratico seguire fino al risultato finale.

Non è un audit tecnico.
Non è un prompt.
Non è codice.

È la **mappa mentale e pratica ufficiale** da usare come base per i prossimi lavori.
Deve aiutare sia Giuseppe sia Codex a seguire sempre lo stesso filo logico, senza tornare nel caos.

---

## 1. Punto di partenza reale

Oggi l'IA interna del gestionale non è ancora divisa in modo pulito.

Nella pratica, dentro la stessa area convivono cose diverse:

- chat;
- caricamento documenti;
- analisi documento singolo;
- analisi multi-file;
- riuso di motori vecchi;
- logiche nuove;
- collegamenti verso moduli diversi.

Questo crea un problema semplice da capire:

**una sola stanza prova a fare troppi lavori diversi**.

Risultato:

- l'utente non capisce bene cosa sta facendo;
- la logica si sporca;
- i flussi diventano difficili da governare;
- ogni miglioramento rischia di complicare ancora di più il sistema.

Quindi il problema vero non è “manca l'intelligenza”.
Il problema vero è che **manca una separazione pulita dei ruoli**.

---

## 2. Decisione madre ormai fissata

La decisione corretta, ormai confermata, è questa:

# NON una super IA unica
# MA due strumenti separati

## IA 1 — Assistente Report

È la parte che:

- legge i dati del gestionale;
- risponde alle domande;
- cerca documenti già archiviati;
- apre pagine o documenti esistenti;
- non salva;
- non modifica;
- non archivia.

In parole semplici:

**IA 1 legge e spiega. Non tocca niente.**

---

## IA 2 — Archivista Documenti

È la parte che:

- riceve foto e PDF;
- legge il contenuto;
- mostra cosa ha capito;
- fa correggere eventuali errori;
- salva il documento nel posto giusto;
- solo dopo, se l'utente conferma, propone un'azione sul gestionale.

In parole semplici:

**IA 2 legge i documenti e li archivia bene. Non chiacchiera.**

---

## 3. Regola d'oro del nuovo sistema

La regola più importante di tutta la nuova architettura è questa:

# Prima archivio
# Poi eventuale azione business

Questo significa:

- prima si salva bene il documento e il suo contenuto;
- solo dopo, se serve e se l'utente vuole, si può:
  - creare una manutenzione;
  - collegare un documento a un mezzo;
  - proporre un aggiornamento stock;
  - aggiornare dati del mezzo;
  - aprire il modulo corretto già precompilato.

Questa regola evita che l'IA diventi un miscuglio ingestibile tra archivio e operatività.

---

## 4. Come l'utente deve immaginarsi il sistema finale

L'immagine mentale corretta deve essere questa.

### Menu del gestionale

Nel menu esistono due voci separate:

- **Assistente Report**
- **Archivio Documenti**

Non si confondono.
Non si sovrappongono.
Non usano la stessa schermata per tutto.

---

## 5. Visione pratica di IA 1

## Cosa vede l'utente

Una chat pulita.

- area conversazione;
- input in basso;
- suggerimenti rapidi;
- risposte brevi e concrete;
- liste, tabelle e link quando servono.

## Cosa fa

L'utente scrive cose come:

- “quante manutenzioni ho fatto a TI113417 negli ultimi 6 mesi”
- “quanto ho speso da SCIURBA quest'anno”
- “mostrami la fattura 81 di SCIURBA”
- “quali revisioni scadono il mese prossimo”

IA 1:

- legge i dati reali;
- trova i documenti già archiviati;
- risponde in italiano semplice;
- mostra collegamenti utili.

## Cosa NON fa

- non archivia documenti;
- non crea record;
- non aggiorna il gestionale;
- non decide al posto dell'utente.

Questa parte deve restare semplice.
Deve essere il lato “parla e leggi”.

---

## 6. Visione pratica di IA 2

## Cosa vede l'utente

Una schermata guidata, non una chat.

In alto:

- scelta del **tipo documento**;
- scelta del **contesto**.

Poi:

- area di caricamento file;
- pulsante grande di analisi.

Quindi l'utente fa tre cose molto chiare:

1. sceglie tipo;
2. sceglie contesto;
3. carica il documento.

La IA non indovina il binario.
Il binario lo decide l'utente.

---

## 7. Flusso ideale di IA 2

Il flusso finale deve essere sempre questo:

### Passo 1 — Scelta guidata
L'utente sceglie:

- tipo documento;
- contesto.

### Passo 2 — Caricamento
L'utente carica:

- una foto;
- più foto;
- un PDF;
- più PDF;
- oppure un mix.

Per l'utente, tutto questo deve sembrare un solo caso:

**“sto caricando un unico documento logico”**

Il sistema può unire o aggregare dietro le quinte, ma l'utente non deve trovarsi davanti due strade confuse.

### Passo 3 — Analisi
La IA legge il documento con istruzioni precise per quella famiglia.

### Passo 4 — Dossier di controllo
Si apre un modale dossier unico dove l'utente vede:

- il file;
- il riassunto;
- cosa la IA ha capito;
- i campi estratti;
- eventuali righe materiali;
- eventuali match;
- il testo letto;
- le azioni finali possibili.

### Passo 5 — Conferma utente
L'utente decide cosa fare.

### Passo 6 — Archiviazione
Il sistema salva il documento nel suo archivio corretto.

### Passo 7 — Azione eventuale
Solo se prevista e confermata, il sistema propone o avvia l'azione operativa corretta.

---

## 8. Le regole che non vanno più rimesse in discussione

Queste regole devono essere considerate fisse.

### Regola 1 — Due strumenti separati
IA 1 e IA 2 non si fondono più.

### Regola 2 — Nessuna magia
L'utente sceglie sempre tipo + contesto.

### Regola 3 — La IA propone, l'utente decide
Mai azioni automatiche nascoste.

### Regola 4 — Un solo motore futuro
Il sistema futuro deve convergere su OpenAI come motore unico.

### Regola 5 — Prima archivio, poi azione
L'archivio viene prima della scrittura operativa.

### Regola 6 — Il listino prezzi non si tocca da solo
Se serve, si apre il modulo corretto. Nessun aggiornamento silenzioso.

### Regola 7 — La madre non si tocca
La madre resta intoccabile.
La NEXT resta il perimetro di evoluzione.

### Regola 8 — Ogni documento deve essere riapribile
Ogni documento archiviato deve avere un riferimento chiaro all'originale.

### Regola 9 — I doppioni non si decidono da soli
Se un documento sembra già esistere, il sistema si ferma e chiede.

### Regola 10 — I verticali speciali non vanno forzati nella V1
Non tutto deve entrare subito nella prima versione.

---

## 9. Le famiglie documentali viste con ordine mentale corretto

Di seguito non c'è ancora la mappa tecnica completa delle scritture.
Qui c'è l'ordine logico con cui il sistema va pensato.

## V1 consigliata — famiglie da portare dentro subito

Queste sono le famiglie migliori per partire bene.

### 1. Fattura / DDT Magazzino
Perché:

- è già abbastanza chiara;
- ha un archivio comprensibile;
- ha valore pratico immediato;
- si sposa bene con la logica “archivia prima, stock dopo”.

### 2. Fattura Manutenzione
Perché:

- è centrale per il gestionale;
- permette di collegare documento e mezzo;
- prepara il ponte verso manutenzioni senza forzare automatismi.

### 3. Documento Mezzo
Perché:

- è molto utile;
- rende ordinata la gestione documentale dei mezzi;
- permette una logica semplice: archivio originale + link al mezzo + aggiornamento su conferma.

### 4. Preventivo Magazzino
Perché:

- è già abbastanza leggibile come famiglia;
- ha una collocazione più chiara di altri casi ancora ambigui.

---

## Famiglie da NON forzare nella prima versione

Queste non sono escluse per sempre.
Semplicemente non vanno messe dentro la V1 se non sono ancora abbastanza pulite.

### 5. Preventivo Manutenzione
Va chiarito meglio prima.

### 6. Carburante
Oggi non ha ancora una collocazione archivistica abbastanza chiara.

### 7. Cisterna AdBlue
Ha una sua verticalità specifica.

### 8. Euromecc
Ha già una logica molto specialistica e non va mischiato subito al nucleo generale.

---

## 10. Il nodo più delicato: costo mezzo

Questo punto va ricordato bene.

Il sistema futuro **non deve nascere facendo perno su `@costiMezzo`**.

Motivo pratico:

- viene letto da tante parti;
- ma non emerge un punto chiaro e tranquillo che lo alimenta in modo completo come destinazione primaria dell'archivista.

Quindi la logica corretta da seguire è questa:

- prima archivia il documento;
- poi, se l'utente conferma, crea o collega la manutenzione;
- il costo mezzo non è il primo cassonetto dove buttare dentro il documento.

In parole semplici:

**il costo mezzo è una conseguenza da trattare bene, non il punto di partenza dell'archiviazione.**

---

## 11. Il nodo più delicato sui documenti mezzo

Oggi molti documenti mezzo vivono soprattutto nella scheda del mezzo.

Per il futuro, la soluzione più pulita da seguire è questa:

### Struttura consigliata

1. si salva l'originale del documento;
2. lo si collega al mezzo giusto;
3. si mostrano i dati letti;
4. si aggiornano i campi del mezzo solo su conferma.

Questo è meglio di:

- salvare solo dentro il mezzo;
- oppure aggiornare subito il mezzo senza archivio documentale ordinato.

---

## 12. Come trattare i duplicati

Questa regola deve diventare ufficiale.

Se il sistema vede che un documento somiglia molto a uno già presente, **non deve decidere da solo**.

Deve chiedere una scelta semplice:

- è lo stesso documento;
- è una versione migliore;
- è un documento diverso.

Questo evita un archivio pieno di copie sporche.

---

## 13. Dove stiamo andando davvero

## Situazione iniziale

- IA interna ibrida;
- motori mescolati;
- confusione tra chat e archivio;
- ingresso unico troppo carico;
- diverse famiglie documentali non ancora governate allo stesso modo.

## Situazione finale desiderata

### Arrivo finale chiaro

#### IA 1
- chat semplice;
- legge tutto;
- cerca documenti già archiviati;
- risponde;
- apre contenuti;
- non scrive mai.

#### IA 2
- wizard guidato;
- carica documento;
- analizza;
- mostra dossier;
- fa confermare;
- archivia;
- solo dopo propone un'azione operativa.

Questa è la trasformazione da seguire.

---

## 14. Percorso pratico da seguire

Questo è il percorso mentale e operativo consigliato.

## Fase A — Congelare la visione
Scopo:
non cambiare più le decisioni base.

Da considerare fissato:

- 2 IA separate;
- V1 con 4 famiglie principali;
- archivio prima, azione dopo;
- documento mezzo con archivio + link + update su conferma;
- costo mezzo non come archivio primario;
- doppioni gestiti con domanda all'utente.

## Fase B — Chiudere la SPEC finale
Scopo:
trasformare questa visione in specifica finale unica e ordinata.

La SPEC finale dovrà contenere almeno:

- schermata IA 1;
- schermata IA 2;
- flusso completo IA 2;
- dossier unico;
- regole dei 4 template V1;
- cosa entra e cosa resta fuori;
- comportamento sui duplicati;
- comportamento sui documenti mezzo;
- comportamento sulle azioni post-archivio.

## Fase C — Solo dopo partire con Codex
Scopo:
non fare patch confuse.

Ordine corretto:

1. prima documento guida;
2. poi SPEC finale;
3. poi prompt Codex;
4. poi implementazione.

---

## 15. Cosa NON bisogna fare adesso

Per non ricadere nel caos, adesso non bisogna:

- rifondere tutto in una super chat unica;
- mettere subito dentro tutte le famiglie documentali;
- far dipendere tutto dal costo mezzo;
- aprire scritture larghe “per comodità”;
- lasciare che la IA decida da sola tipo e contesto;
- fare prompt esecutivi prima di avere la SPEC finale pulita.

---

## 16. Definizione di risultato finale riuscito

Capiremo che il lavoro è riuscito quando la situazione sarà questa.

### Per Giuseppe

- sa sempre se sta parlando con l'assistente report o con l'archivista;
- non si trova più davanti una stanza confusa che fa tutto;
- quando archivia un documento capisce bene ogni passaggio;
- quando fa una domanda riceve risposte concrete;
- può riaprire facilmente i documenti archiviati.

### Per Codex

- ha una visione stabile da seguire;
- sa qual è il punto di partenza;
- sa qual è il punto di arrivo;
- sa cosa entra nella V1;
- sa cosa resta fuori;
- non deve inventarsi il comportamento del prodotto.

### Per il progetto

- l'IA smette di essere un esperimento confuso;
- diventa un sottosistema ordinato;
- cresce per blocchi;
- resta coerente con la filosofia NEXT;
- si integra nel gestionale senza sporcare tutto.

---

## 17. Verdetto finale

La direzione giusta non è “aggiungere ancora pezzi all'IA attuale”.

La direzione giusta è:

- separare i ruoli;
- semplificare l'esperienza;
- partire dalle famiglie più chiare;
- archiviare bene prima di agire;
- costruire una base che possa crescere senza confondersi.

Questa è la linea guida da seguire.

Da qui in poi, ogni SPEC finale e ogni prompt esecutivo devono restare coerenti con questo documento.
