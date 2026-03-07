# BLUEPRINT GRAFICO NEXT

## Filosofia grafica della NEXT

La nuova app NEXT deve essere una UI da vero gestionale operativo, non una somma di pagine rifatte. Il repository mostra gia moduli forti e leggibili, ma oggi sono distribuiti in micro-sistemi visivi separati. Il blueprint grafico della NEXT nasce quindi da una regola semplice:

- non inventare un'estetica astratta;
- prendere il meglio di `DossierMezzo`, `CentroControllo`, `Acquisti`, `AutistiInboxHome`, `CapoCostiMezzo`;
- trasformare quei pattern in una shell unica e coerente;
- evitare di trascinare dialetti legacy, override profondi e pagine isolate.

La UI target deve comunicare:
- controllo operativo;
- accesso rapido alle entita chiave;
- continuita tra moduli globali e moduli mezzo-centrici;
- densita informativa alta ma leggibile;
- gerarchia immediata tra urgente, importante, contestuale e secondario.

## Principi guida

### Chiarezza

- Ogni schermata deve dichiarare subito cosa rappresenta: area globale, coda operativa, dettaglio mezzo, analisi, sistema.
- Ogni pagina deve avere un solo asse principale: monitorare, decidere, modificare, analizzare.
- Le CTA primarie devono essere poche e visibili; le azioni secondarie vanno spostate in toolbar, menu riga o pannelli secondari.
- Ogni record critico deve essere leggibile senza aprire subito un dettaglio profondo.

### Densita informativa controllata

- La NEXT non deve essere "vuota" per sembrare moderna: deve restare un gestionale.
- KPI, alert, stati e tabelle devono restare numerosi dove serve, ma con priorita visiva forte.
- Le aree dense vanno organizzate per bande: sintesi, filtri, contenuto operativo, dettaglio/azioni.
- Card e tabelle non devono competere: le card spiegano, le tabelle governano.

### Coerenza tra moduli

- Una stessa famiglia di elementi deve avere un solo comportamento visivo nella NEXT: badge, bottoni, tabelle, toolbar filtri, modali, pannelli dettaglio.
- Le differenze tra aree devono dipendere dalla funzione, non da CSS scollegati.
- I componenti gia forti del repo (`PdfPreviewModal`, `TargaPicker`, pattern dossier/reporting) vanno trattati come nucleo comune.

### Accesso rapido al mezzo

- La targa resta il pivot principale della UI admin.
- Ogni record targa-correlato deve offrire accesso rapido al `Dossier Mezzo`.
- La ricerca globale deve supportare la targa come primo caso d'uso.
- Le liste flotta, operativita, autisti inbox, magazzino e analisi devono sempre esporre il ponte al mezzo quando il record lo consente.

### Distinzione chiara tra globale e mezzo-centrico

- I moduli globali non devono simulare un dossier.
- I moduli mezzo-centrici non devono costringere a cercare dati in aree globali sparse.
- Flotta, Acquisti & Magazzino, Autisti, Sistema sono aree globali.
- Dossier, analisi per targa, timeline mezzo, costi/documenti per mezzo sono aree mezzo-centriche.
- La UI deve far capire in 1 secondo se l'utente sta guardando una vista trasversale o una vista focalizzata su un singolo mezzo.

## Shell generale

### Struttura shell admin

La shell admin della NEXT deve essere unica e stabile, con queste macro-zone:

1. Header globale
2. Sidebar primaria
3. Area contenuti
4. Breadcrumb + header pagina
5. Toolbar contestuale
6. Corpo pagina

La shell autisti resta separata e non va fusa nella shell admin.

### Header

L'header globale deve contenere:
- identita applicativa e area corrente;
- ricerca globale;
- accessi rapidi utilita;
- notifiche/scadenze;
- ingresso rapido IA;
- menu utente/ruolo.

Ordine consigliato:
- sinistra: logo + nome applicazione + area corrente;
- centro: ricerca globale;
- destra: scorciatoie, scadenze/notifiche, IA, profilo.

L'header non deve contenere navigazione secondaria di modulo; quella appartiene alla pagina.

### Sidebar / menu

La sidebar primaria deve usare 6-7 voci top-level, coerenti con la sitemap documentata:

1. Centro di Controllo
2. Operativita
3. Acquisti & Magazzino
4. Flotta & Dossier
5. Autisti
6. IA & Documenti
7. Sistema & Config

Regole:
- una sola voce attiva per volta;
- niente doppie sidebar concorrenti;
- eventuale sotto-navigazione solo contestuale alla voce selezionata;
- i sottomoduli non devono replicare top-level gia esistenti.

### Area contenuti

L'area contenuti deve essere ampia, leggibile e adattarsi a tre famiglie:
- pagine dashboard/report;
- pagine dettaglio/dossier;
- pagine workflow/workbench.

Regole:
- larghezza piena per tabelle e dashboard operative;
- contenimento maggiore per form e sistema;
- bande visive riconoscibili: sintesi, filtri, contenuto, approfondimento.

### Breadcrumb

Il breadcrumb serve solo nelle pagine non-home e non deve diventare navigazione primaria.

Uso consigliato:
- sempre visibile sopra il titolo pagina;
- obbligatorio per Dossier, Analisi, Sistema, dettaglio ordini/documenti;
- ridotto o assente nel Centro di Controllo.

Struttura raccomandata:
- `Area > Sotto-area > Entita/Dettaglio`

### Ricerca

La ricerca globale deve vivere nell'header e restare disponibile in tutta l'area admin.

Chiavi principali:
- targa;
- badge autista;
- id ordine;
- id lavoro;
- documento.

Risultato atteso:
- risultati divisi per origine modulo;
- link canonico alla destinazione;
- priorita ai risultati mezzo-centrici quando la query e una targa.

### Accessi rapidi

Gli accessi rapidi non devono sostituire il menu. Devono accelerare i casi frequenti:
- ultime targhe aperte;
- record fissati/pinnati;
- ultime code prese in carico;
- scorciatoie operative dal Centro di Controllo.

Posizione consigliata:
- header utility per "recenti/pinnati";
- home/centro controllo per scorciatoie operative;
- dossier header per azioni rapide del mezzo.

### Posizione IA

L'IA nella NEXT non deve essere solo un'area separata. Deve avere due livelli:

- livello globale: area `IA & Documenti` per intake, libretti, documenti, strumenti speciali;
- livello contestuale: pulsante/ingresso rapido dentro Dossier, Analisi, Acquisti e documenti quando l'IA porta valore operativo.

Posizione consigliata:
- header utility: accesso rapido a IA;
- pagine contestuali: action secondaria o pannello laterale, non CTA dominante salvo casi dedicati.

### Posizione notifiche / scadenze

Le scadenze devono avere doppia presenza:

- globale: campanella/contatore in header;
- operativa: widget prioritari nel Centro di Controllo e reminder visibili nel Dossier.

Regola:
- la campanella segnala;
- il Centro di Controllo priorizza;
- il Dossier contestualizza sul mezzo.

## Regole di navigazione visiva

- Una sola route canonica per ogni dettaglio principale.
- Ogni pagina deve avere un titolo, un sottotitolo operativo implicito o esplicito e una CTA primaria coerente.
- Le tabs vanno usate solo dentro lo stesso contesto, non per distribuire la stessa logica su piu route diverse.
- Le tabelle devono offrire navigazione diretta alle entita centrali: mezzo, ordine, evento, documento.
- Ogni riga targa-correlata deve avere accesso al Dossier.
- Le aree globali devono mostrare riepilogo + filtri + lista; i dettagli mezzo-centrici devono mostrare stato + contesto + timeline/approfondimenti.
- PDF e IA non devono apparire come moduli isolati se sono strumenti contestuali.
- Gli stati critici devono emergere prima del dettaglio descrittivo.
- Le pagine di sistema devono essere piu asciutte delle pagine operative e non ereditare la stessa densita di alert.

## Come si differenziano le macro-aree

### Centro di Controllo

Ruolo visivo:
- cockpit principale dell'app.

Caratteri:
- alta densita;
- molte summary card;
- code operative;
- tabelle e card stato;
- forte presenza di alert, scadenze e filtri rapidi.

Fonti di ispirazione:
- `CentroControllo`
- `Home`
- in parte `AutistiInboxHome`

### Dossier Mezzo

Ruolo visivo:
- cuore del sistema e dettaglio decisionale per targa.

Caratteri:
- header mezzo forte;
- stato immediato;
- card overview;
- pannelli dettaglio, timeline, documenti, costi, analisi;
- azioni PDF/IA contestuali;
- densita alta ma piu ordinata della dashboard.

Fonte principale:
- `DossierMezzo`

### Operativita

Ruolo visivo:
- gestione task, code, avanzamento, presa in carico.

Caratteri:
- filtri veloci;
- liste e stati piu che grandi card narrative;
- CTA operative ravvicinate;
- accesso rapido al mezzo dove applicabile.

Fonti:
- `LavoriInAttesa`
- elementi di `CentroControllo`
- `AutistiInboxHome` per il lato code/eventi

### Magazzino

Ruolo visivo:
- workbench globale per materiali, ordini, fabbisogni, consegne e attrezzature.

Caratteri:
- shell a schede o sottosezioni;
- tabelle dense;
- stati ordine/materiale;
- toolbar filtri e azioni chiare;
- ponte verso Dossier solo quando c'e relazione mezzo.

Fonte principale:
- `Acquisti`

Nota su `MaterialiDaOrdinare`:
- il modulo va trattato come funzione valida di fabbisogni materiali, non come pattern da scartare;
- la sua collocazione futura piu coerente e dentro la shell globale `Acquisti & Magazzino`, non come linguaggio visivo standalone.

### Analisi

Ruolo visivo:
- lettura economica e decisionale, non orchestrazione giornaliera.

Caratteri:
- KPI e confronti;
- spiegazioni sintetiche;
- pannelli dossier-based;
- export PDF contestuale;
- accesso al mezzo sempre evidente.

Fonte principale:
- `AnalisiEconomica` su shell `Dossier`

### Sistema / Permessi

Ruolo visivo:
- area tecnica e amministrativa, bassa esposizione nel flusso quotidiano.

Caratteri:
- meno densita decorativa;
- piu tabelle, form, log e configurazioni;
- maggiore enfasi su chiarezza, audit, sicurezza e ruoli;
- nessun carico visivo da dashboard business salvo eventuali warning tecnici.

Fonti:
- parti migliori di `IAHome` come launcher asciutto;
- pattern tabelle/form amministrative da `CentroControllo`, `AutistiAdmin`, `CapoCostiMezzo`

## Direzione operativa finale

La NEXT deve quindi avere:
- una sola shell admin;
- una sola grammatica visiva;
- `Dossier` come standard detail;
- `Centro di Controllo` come standard cockpit/report;
- `Acquisti & Magazzino` come standard workflow globale;
- `Analisi` come estensione dossier-driven;
- `Sistema` come area separata, piu asciutta e tecnica;
- `Autisti` come shell separata.

La legacy resta invariata. Questo documento serve a guidare la futura costruzione della shell UI reale senza ripartire da zero e senza perpetuare la frammentazione attuale.
