# SPEC GUIDA — IA REPORT E ARCHIVISTA DOCUMENTI
**Progetto:** GestioneManutenzione  
**Scopo del documento:** fissare in modo chiaro come deve diventare il nuovo sistema IA, così da avere un riferimento unico sia per Giuseppe sia per Codex.  
**Stato del documento:** guida principale di progetto per la nuova IA.  
**Perimetro:** NEXT come area di evoluzione. Madre intoccabile.

---

## Capitolo 1 · Perché esiste questa spec

Questa spec serve a fermare la confusione dell’IA attuale e a trasformare un’idea generale in una struttura chiara, semplice e seguibile.

Oggi il problema non è solo estetico. Il problema è che la IA attuale mescola troppe cose nello stesso posto:
- chat libera
- caricamento documenti
- estrazione dati
- review
- instradamento verso altri moduli
- logiche vecchie e logiche nuove

Questo documento serve quindi a definire:

1. **come deve funzionare il sistema finale**
2. **quali regole non si toccano**
3. **cosa entra nella prima versione**
4. **cosa resta fuori**
5. **in che ordine si realizza**

---

## Capitolo 2 · Situazione attuale in parole semplici

Oggi nel gestionale esiste una IA interna che prova a fare troppe cose insieme.

Il risultato è che:
- non è chiaro quando stai usando una chat
- non è chiaro quando stai usando un archivista documenti
- alcuni flussi sono ancora legati a logiche vecchie
- alcune destinazioni finali dei dati non sono pulite
- alcune parti funzionano meglio di altre

In pratica oggi non esistono ancora **due prodotti veri e distinti**.  
Esiste una struttura ibrida che ha già dei pezzi utili, ma non è il prodotto finale desiderato.

---

## Capitolo 3 · Visione finale

Il sistema finale deve essere composto da **2 strumenti separati**, con ruoli diversi e mai confusi.

### IA 1 · Assistente Report
È una chat che legge i dati del gestionale e risponde.  
Non archivia documenti.  
Non modifica dati.  
Non scrive niente.

### IA 2 · Archivista Documenti
È un flusso guidato, non una chat.  
Serve per caricare foto e PDF di documenti, vedere cosa la IA ha capito, correggere se serve, confermare, e poi archiviare nel posto giusto.

### Collegamento tra i due
IA 1 può leggere e aprire i documenti che IA 2 ha archiviato.  
Esempio: scrivo in chat “aprimi la fattura 81 di SCIURBA” e IA 1 la trova e me la apre.

---

## Capitolo 4 · Regole fisse non negoziabili

Queste regole vanno rispettate sempre.

1. **Le due IA sono separate**
   - IA 1 = leggere e rispondere
   - IA 2 = leggere documenti e archiviare

2. **IA 2 non è una chat**
   - niente conversazione libera
   - niente flussi ambigui
   - niente “provo a capire io cosa volevi fare”

3. **L’utente sceglie sempre prima**
   - tipo documento
   - contesto documento

4. **Niente magia**
   - niente scelta automatica del contesto
   - niente decisioni prese al posto dell’utente
   - niente salvataggi nascosti

5. **Prima archivio, poi eventuale azione business**
   - il primo obiettivo di IA 2 è archiviare bene il documento
   - solo dopo, se confermato, può proporre un’azione sul gestionale

6. **Solo OpenAI**
   - il motore futuro deve essere uno solo

7. **Madre intoccabile**
   - non si usa la madre come perimetro evolutivo
   - la NEXT resta il perimetro corretto di sviluppo

8. **Tutti i testi visibili restano in italiano**

9. **Niente aggiornamenti automatici pericolosi**
   - specialmente listino prezzi
   - specialmente costi mezzo
   - specialmente campi mezzo sensibili

10. **Ogni documento archiviato deve restare riapribile**
   - l’originale deve essere sempre recuperabile

---

## Capitolo 5 · IA 1 spiegata bene

## 5.1 Cosa fa
IA 1 è la chat del gestionale.  
Serve a fare domande e ricevere risposte concrete sui dati.

Esempi:
- quante manutenzioni ha fatto questo mezzo
- quanto ho speso da un fornitore
- quali documenti sono in scadenza
- mostrami una certa fattura
- apri un documento già archiviato

## 5.2 Cosa non fa
IA 1:
- non salva documenti
- non modifica record
- non crea movimenti
- non crea manutenzioni
- non aggiorna inventario
- non prende decisioni

## 5.3 Come risponde
Le risposte devono avere forma semplice e utile:
1. una risposta breve in italiano
2. eventualmente una tabella o una lista
3. eventualmente link o pulsanti per aprire documenti o moduli

## 5.4 Limite chiaro
IA 1 è solo lettura.  
Questo vincolo non va rotto.

---

## Capitolo 6 · IA 2 spiegata bene

## 6.1 Cos’è
IA 2 è l’archivista documenti del gestionale.

Non serve per chiacchierare.  
Serve per:
- caricare un documento
- leggerlo
- capire cosa c’è scritto
- fartelo vedere in modo chiaro
- chiederti conferma
- archiviarlo bene

## 6.2 Schermata iniziale
La schermata iniziale di IA 2 deve essere semplice.

L’utente vede:
- scelta del **tipo**
- scelta del **contesto**
- area upload
- pulsante **Analizza documento**

Ordine corretto:
1. scegli tipo
2. scegli contesto
3. carichi file
4. premi analizza

## 6.3 Cosa non deve esserci
Non devono esserci:
- flussi ambigui
- modali strani che cambiano logica
- chat mischiata all’archivio
- sistemi che decidono da soli il contesto

---

## Capitolo 7 · Flusso utente completo di IA 2

Il flusso corretto di IA 2 è questo.

### Passo 1
L’utente sceglie il **tipo documento**.

### Passo 2
L’utente sceglie il **contesto documento**.

### Passo 3
L’utente carica:
- una foto
- più foto
- un PDF
- più PDF
- un mix di foto e PDF

### Passo 4
L’utente preme **Analizza documento**.

### Passo 5
La IA legge il documento usando il template corretto per quella combinazione.

### Passo 6
Si apre il **modale dossier**.

### Passo 7
L’utente vede cosa è stato letto, corregge se serve, controlla eventuali match.

### Passo 8
L’utente conferma l’archiviazione.

### Passo 9
Il sistema archivia il documento.

### Passo 10
Solo dopo, se previsto da quella famiglia, il sistema propone una seconda azione facoltativa:
- collega a record esistente
- crea nuovo record
- aggiorna dati del mezzo
- apre il modulo corretto

---

## Capitolo 8 · Il modale dossier

Il modale dossier è la review principale di IA 2.

Deve avere una struttura fissa e comprensibile.

## 8.1 Le 8 sezioni
1. **Anteprima documento**
2. **Riassunto rapido**
3. **Cosa ha capito la IA**
4. **Dati estratti**
5. **Righe o materiali trovati**
6. **Match con dati esistenti**
7. **Evidenza testo letto**
8. **Azione finale**

## 8.2 Regola fondamentale
La struttura del modale resta sempre la stessa.  
Cambiano solo i campi e i controlli in base al template.

## 8.3 Campi obbligatori
Se mancano campi obbligatori per quella famiglia, il sistema non deve archiviare in silenzio.  
Deve fermarsi e chiedere correzione oppure permettere il salvataggio nello stato corretto.

---

## Capitolo 9 · Famiglie documentali incluse nella V1

La prima versione di IA 2 deve restare semplice e forte.  
Per questo la V1 include solo le famiglie più chiare e più solide.

## 9.1 Famiglia 1 — Fattura/DDT magazzino
### Cosa fa
Legge documenti di acquisto materiali o ricambi da magazzino.

### Cosa cerca
- fornitore
- numero documento
- data
- totale
- righe materiali
- quantità
- prezzi

### Campi obbligatori
- fornitore
- numero documento
- data
- almeno una riga

### Archiviazione
Il documento viene archiviato come documento di magazzino.

### Azione business eventuale
Solo dopo conferma:
- collegamento a stock
- riconciliazione
- eventuale creazione nuovo articolo se previsto dal flusso deciso

### Cosa non fa automaticamente
- non aggiorna il listino
- non tocca lo stock senza conferma

## 9.2 Famiglia 2 — Fattura manutenzione
### Cosa fa
Legge una fattura officina riferita a un mezzo.

### Cosa cerca
- targa
- data
- fornitore officina
- totale
- manodopera
- ricambi

### Campi obbligatori
- targa
- data
- fornitore
- totale

### Archiviazione
Il documento viene archiviato come documento legato al mezzo.

### Azione business eventuale
Solo dopo conferma:
- collega a manutenzione esistente
- crea nuova manutenzione
- lascia solo archiviato

### Cosa non fa automaticamente
- non scrive direttamente nel costo mezzo come destinazione primaria
- non crea manutenzione senza conferma

## 9.3 Famiglia 3 — Documento mezzo
### Cosa fa
Gestisce documenti come:
- libretto
- assicurazione
- revisione
- collaudo

### Cosa cerca
Dipende dal sottotipo, ma sempre con focus sui dati del mezzo e sulle scadenze.

### Campi obbligatori
- targa
- più gli eventuali campi obbligatori del sottotipo

### Archiviazione
Il documento originale deve essere archiviato come documento vero.

### Azione business eventuale
Solo dopo conferma:
- collegamento al mezzo
- aggiornamento dei campi del mezzo

### Cosa non fa automaticamente
- non aggiorna il mezzo senza conferma

## 9.4 Famiglia 4 — Preventivo magazzino
### Cosa fa
Legge preventivi di acquisto materiali.

### Cosa cerca
- fornitore
- data
- validità
- righe materiali
- prezzi

### Campi obbligatori
- fornitore
- data
- almeno una riga

### Archiviazione
Il preventivo viene archiviato nel suo percorso corretto.

### Azione business eventuale
Solo dopo conferma:
- apertura del modulo preventivi
- eventuale uso successivo nel procurement

### Cosa non fa automaticamente
- non aggiorna il listino prezzi da sola

---

## Capitolo 10 · Famiglie fuori dalla V1

Queste famiglie non entrano nella prima versione di IA 2.

## 10.1 Preventivo manutenzione
Motivo:
- il target finale non è ancora abbastanza pulito
- serve una decisione più chiara

## 10.2 Cisterna AdBlue
Motivo:
- è un verticale specialistico
- ha già logiche sue

## 10.3 Euromecc
Motivo:
- è un verticale specialistico
- ha già un suo mondo separato

## 10.4 Carburante
Motivo:
- non ha ancora una destinazione archivio abbastanza chiara per entrare subito in V1

---

## Capitolo 11 · Regola sui duplicati

Questa regola è obbligatoria.

Se un documento sembra già presente, il sistema non deve decidere da solo.

Deve fermarsi e chiedere all’utente una scelta semplice:

1. **È lo stesso documento**
2. **È una versione migliore dello stesso documento**
3. **È un documento diverso**

## 11.1 Cosa non deve fare
- non deve creare doppioni silenziosi
- non deve unire da solo documenti diversi
- non deve sostituire file senza conferma

## 11.2 Logica mentale da seguire
L’archivio deve restare pulito.  
Meglio una domanda in più che un doppione nascosto.

---

## Capitolo 12 · Regola sui documenti mezzo

Per i documenti mezzo la regola corretta è questa:

1. si archivia l’originale
2. si collega il documento al mezzo
3. si mostrano i campi letti
4. si aggiornano i campi del mezzo solo su conferma

Questa regola vale perché il gestionale oggi tende a tenere molti dati documentali direttamente nel mezzo, ma il sistema futuro deve anche conservare bene l’originale.

---

## Capitolo 13 · Regola sul costo mezzo

Questa regola è fondamentale.

IA 2 **non usa `@costiMezzo` come destinazione primaria**.

La logica corretta è:

1. il documento viene archiviato
2. se è una fattura manutenzione, l’utente può confermare un collegamento o una creazione manutenzione
3. l’eventuale riflesso economico si tratta dopo, non come scrittura cieca iniziale

Scopo di questa regola:
- evitare errori
- non appoggiarsi a un contenitore che oggi non è abbastanza pulito come writer primario
- mantenere chiara la catena documento -> manutenzione -> eventuale costo

---

## Capitolo 14 · Confine di scrittura

La nuova IA 2 deve avere un perimetro di scrittura stretto e controllato.

## 14.1 Cosa può fare
- caricare l’originale
- salvare il record archivio confermato
- proporre una seconda azione confermata

## 14.2 Cosa non può fare in modo libero
- scrivere ovunque
- aprire scritture generiche
- toccare moduli fuori perimetro
- comportarsi come una chat che modifica dati

## 14.3 Regola pratica
L’archivio è il primo passo.  
Le azioni business sono sempre un secondo passo.

---

## Capitolo 15 · Cosa si tiene e cosa si supera

## 15.1 Si tiene
- backend OpenAI esistente come base
- tool “Unisci documenti”
- moduli target già utili
- logiche stabili di magazzino
- struttura NEXT come perimetro corretto

## 15.2 Si supera
- IA interna ibrida come prodotto finale
- chat mischiata all’archivio
- router che indovina il contesto
- uso di più motori nel sistema finale

---

## Capitolo 16 · Piano di realizzazione

Ordine corretto di lavoro.

### Fase 1
Separare concettualmente e visivamente:
- IA 1
- IA 2

### Fase 2
Creare l’ingresso pulito di IA 2:
- tipo
- contesto
- upload
- analisi

### Fase 3
Costruire l’infrastruttura dei template e il modale dossier.

### Fase 4
Implementare le 4 famiglie della V1:
1. Fattura/DDT magazzino
2. Fattura manutenzione
3. Documento mezzo
4. Preventivo magazzino

### Fase 5
Rifinire IA 1 come vera chat report di sola lettura.

### Fase 6
Valutare in una fase successiva:
- preventivo manutenzione
- cisterna
- euromecc
- carburante

---

## Capitolo 17 · Criteri di completamento

Il lavoro si può considerare davvero riuscito solo se tutte queste condizioni sono vere.

1. Esistono 2 voci separate e comprensibili
2. IA 1 non scrive mai
3. IA 2 non è una chat
4. L’utente sceglie sempre tipo + contesto prima
5. Le 4 famiglie V1 funzionano davvero
6. Il modale dossier è coerente e leggibile
7. I duplicati sono gestiti
8. I documenti mezzo seguono la regola archivia + collega + conferma
9. Nessuna scrittura automatica nascosta viene introdotta
10. Il perimetro NEXT resta rispettato

---

## Capitolo 18 · Regole operative per Codex

Codex deve usare questo documento come guida principale del lavoro sulla nuova IA.

### 18.1 Cosa deve fare
- leggere tutta la spec prima di proporre modifiche
- rispettare i confini della V1
- non includere famiglie fuori V1
- non inventare flussi non descritti
- dichiarare chiaramente se serve un file extra
- mantenere la separazione tra archivio e azione business

### 18.2 Cosa non deve fare
- non deve trasformare IA 2 in una chat
- non deve reintrodurre logiche automatiche che scelgono il contesto
- non deve usare la madre come perimetro di patch
- non deve usare `@costiMezzo` come destinazione primaria
- non deve infilare Euromecc, Cisterna o Carburante nella V1 senza decisione esplicita

### 18.3 Regola finale
Se una parte della spec non è abbastanza chiara per implementare bene, Codex deve fermarsi e dichiarare cosa manca.  
Meglio fermarsi su un dubbio reale che costruire una soluzione sbagliata.

---

## Capitolo 19 · Verdetto finale

La direzione è chiara.

Il sistema finale desiderato non è:
- una sola super chat
- un sistema che indovina da solo
- una pagina che mischia tutto

Il sistema finale desiderato è:
- **una chat report pulita**
- **un archivista documenti pulito**
- **regole semplici**
- **archiviazione chiara**
- **azioni business solo dopo conferma**

Questa è la linea da seguire.
