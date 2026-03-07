# WIREFRAME LOGICI NEXT

## Nota

Questi wireframe sono logici e testuali. Non sono mockup grafici finali. Servono a definire:
- ordine visivo;
- blocchi principali;
- priorita operative;
- posizione di IA, PDF, filtri, scadenze;
- accesso al `Dossier Mezzo`.

## 1. Home / Centro di Controllo

### Blocchi visivi principali

1. Header globale con ricerca, scadenze/notifiche, IA, profilo
2. Sidebar primaria
3. Header pagina: titolo `Centro di Controllo` + sottotitolo operativo
4. Fascia KPI/sintesi
5. Fascia priorita oggi / alert
6. Fascia code operative
7. Fascia accessi rapidi
8. Fascia report sintetici / tabelle

### Ordine visivo

```text
[Header globale]
[Sidebar]
[Titolo pagina + data/contesto]
[KPI principali]
[Priorita oggi / alert critici]
[Code operative: manutenzioni, rifornimenti, controlli, segnalazioni]
[Accessi rapidi]
[Report/tabelle secondarie]
```

### Cosa deve vedersi subito

- quante criticita sono aperte;
- quali code richiedono presa in carico oggi;
- quali mezzi hanno problemi o scadenze;
- ricerca globale pronta all'uso.

### Cosa e secondario

- approfondimenti numerici non urgenti;
- widget storici;
- strumenti di supporto non direttamente operativi.

### Come si arriva al mezzo

- ogni alert/card/tabella targa-correlata apre il `Dossier Mezzo`;
- la ricerca globale per targa porta direttamente al dossier;
- una riga puo anche aprire una lista intermedia, ma deve sempre offrire il ponte al dossier.

### Dove stanno IA / PDF / scadenze / filtri

- IA: accesso rapido in header, non dominante nella home;
- PDF: export contestuali dentro singoli report/widget, non pulsante centrale della pagina;
- scadenze: campanella in header + card prioritarie in alto;
- filtri: rapidi solo nei blocchi che ne hanno bisogno, non un mega filtro globale sopra tutto.

## 2. Flotta

### Blocchi visivi principali

1. Header pagina con breadcrumb
2. Riepilogo flotta / KPI sintetici
3. Toolbar filtri (categoria, stato, ricerca targa)
4. Lista o griglia mezzi
5. Pannello azioni rapide / accesso dossier

### Ordine visivo

```text
[Breadcrumb]
[Titolo Flotta + CTA principali]
[KPI flotta]
[Filtri]
[Lista/griglia mezzi]
[Azioni secondarie e collegamenti a manutenzioni/costi]
```

### Cosa deve vedersi subito

- totale mezzi e stati principali;
- filtro targa immediato;
- differenza tra mezzi in ordine, incompleti o critici.

### Cosa e secondario

- campi anagrafici lunghi;
- dettagli documentali;
- storia economica profonda.

### Come si arriva al mezzo

- ogni card o riga mezzo deve avere CTA primaria `Apri Dossier`;
- eventuali azioni tipo manutenzione/costi non devono far perdere il ponte al dossier.

### Dove stanno IA / PDF / scadenze / filtri

- IA: secondaria, contestuale a libretti/documenti o copertura dati;
- PDF: non centrale nella vista flotta generale;
- scadenze: badge stato o mini-summary sui mezzi;
- filtri: sempre sopra la lista/griglia.

## 3. Dossier Mezzo

### Blocchi visivi principali

1. Breadcrumb
2. Header mezzo forte: targa, categoria, stato, badge, CTA
3. Fascia riepilogo mezzo
4. Fascia reminder/scadenze
5. Fascia pannelli principali
6. Fascia timeline / eventi / lavori / documenti / costi
7. Fascia analisi e PDF/IA contestuali

### Ordine visivo

```text
[Breadcrumb]
[Header mezzo: targa + stato + CTA]
[Overview cards]
[Scadenze / reminder]
[Pannelli principali: lavori, manutenzioni, documenti]
[Timeline / storico / costi]
[Analisi / PDF / IA contestuale]
```

### Cosa deve vedersi subito

- qual e il mezzo;
- se e in stato normale, critico, incompleto o in scadenza;
- quali azioni immediate servono;
- se ci sono documenti/costi/eventi da guardare.

### Cosa e secondario

- dettaglio storico non urgente;
- confronti analitici piu profondi;
- strumenti specialistici non necessari alla decisione immediata.

### Come si arriva al mezzo

- il dossier e la destinazione principale, quindi non serve altro ponte;
- da qualunque modulo globale si deve arrivare qui con una CTA unica e coerente.

### Dove stanno IA / PDF / scadenze / filtri

- IA: action contestuale in header o pannello strumenti, piu sezione dedicata nei blocchi documenti/analisi;
- PDF: tra le azioni header o nei singoli pannelli export;
- scadenze: banda visiva alta, subito sotto header o dentro overview;
- filtri: solo locali a sezioni lunghe, non filtro generale che rompa la lettura del mezzo.

## 4. Operativita

### Blocchi visivi principali

1. Header pagina
2. KPI e contatori code
3. Toolbar filtri rapidi
4. Lista task / gruppi per stato
5. Pannello dettaglio task o drawer contestuale
6. Collegamenti a Dossier, Magazzino, PDF

### Ordine visivo

```text
[Titolo area + CTA]
[KPI code / backlog]
[Filtri rapidi]
[Lista task / colonne o gruppi]
[Dettaglio task selezionato]
[Azioni contestuali]
```

### Cosa deve vedersi subito

- quanti task sono aperti, urgenti, in attesa, completati;
- quali record richiedono intervento adesso;
- su quali mezzi impattano i task critici.

### Cosa e secondario

- storici molto lunghi;
- campi descrittivi non operativi;
- funzioni di sistema.

### Come si arriva al mezzo

- ogni task targa-correlato espone link diretto al dossier;
- il pannello dettaglio task deve mostrare la targa e il ponte dossier in modo stabile.

### Dove stanno IA / PDF / scadenze / filtri

- IA: molto secondaria, solo quando aiuta a leggere documenti o note;
- PDF: export di liste o dettaglio task, non CTA dominante della schermata;
- scadenze: incluse nei gruppi prioritari e nei badge task;
- filtri: sempre sopra la lista, in forma compatta e rapida.

## 5. Magazzino

### Nota di collocazione

La NEXT deve considerare `Magazzino` come area globale condivisa con `Acquisti & Magazzino`. La funzione `MaterialiDaOrdinare` va mantenuta come funzione valida di `Fabbisogni`, ma non come pagina visualmente autonoma scollegata dal resto.

### Blocchi visivi principali

1. Header area `Acquisti & Magazzino`
2. Tabs o sottosezioni globali
3. Toolbar filtri/azioni
4. Tavolo operativo principale
5. Pannello riepilogo laterale o inferiore
6. Dettaglio ordine/materiale/documento

### Ordine visivo

```text
[Titolo area + CTA]
[Tabs: Fabbisogni | Ordini | Inventario | Consegne | Attrezzature]
[Filtri e azioni]
[Tabella operativa principale]
[Riepilogo stati / KPI]
[Dettaglio o pannello secondario]
```

### Cosa deve vedersi subito

- stato ordini/materiali;
- eventuali fabbisogni urgenti;
- alert di disponibilita o consegna;
- ultima azione possibile sul flusso corrente.

### Cosa e secondario

- dettagli contabili lunghi non necessari in quella vista;
- strumenti specialistici non legati al flusso aperto.

### Come si arriva al mezzo

- solo quando un materiale, ordine o consegna e legato a una targa;
- il ponte al dossier non deve dominare le viste globali, ma essere disponibile.

### Dove stanno IA / PDF / scadenze / filtri

- IA: contestuale ai documenti/preventivi, non al centro della shell magazzino;
- PDF: in ordini, preventivi, riepiloghi export;
- scadenze: badge in riga o summary bar in alto;
- filtri: permanenti sopra la tabella, con comportamento coerente in tutte le sottosezioni.

## 6. Analisi

### Blocchi visivi principali

1. Breadcrumb
2. Header analisi con contesto mezzo o perimetro flotta
3. KPI economici
4. Pannelli trend e anomalie
5. Tabelle o liste di supporto
6. Export PDF e azioni di consultazione

### Ordine visivo

```text
[Breadcrumb]
[Titolo analisi + contesto]
[KPI economici]
[Trend / anomalie / confronti]
[Dettaglio dati di supporto]
[Export PDF / azioni secondarie]
```

### Cosa deve vedersi subito

- se il mezzo o il perimetro selezionato e in anomalia;
- costo totale, trend, voci principali;
- eventuali warning di qualita dati.

### Cosa e secondario

- dettaglio riga storica completo;
- spiegazioni verbose se non aiutano la decisione.

### Come si arriva al mezzo

- l'accesso canonico all'analisi mezzo deve partire dal dossier;
- se esiste una vista analisi globale, ogni riga mezzo deve riportare al dossier.

### Dove stanno IA / PDF / scadenze / filtri

- IA: contestuale alla lettura/sintesi dei dati, non punto d'ingresso principale;
- PDF: export analisi ben visibile ma secondario ai KPI;
- scadenze: solo se rilevanti nel contesto economico;
- filtri: periodo, targa, categoria o dominio, sempre sopra i pannelli.

## 7. Sistema / Utenti e permessi

### Blocchi visivi principali

1. Header pagina asciutto
2. Tabs o sezioni tecniche
3. Tabelle amministrative
4. Form configurazione
5. Audit/log
6. Warning tecnici o sicurezza

### Ordine visivo

```text
[Breadcrumb]
[Titolo area + contesto]
[Tabs o navigazione secondaria]
[Tabella o form principale]
[Audit/log]
[Warning tecnici]
```

### Cosa deve vedersi subito

- quale area tecnica si sta configurando;
- quali permessi/utenti/config sono attivi;
- se esistono problemi di sicurezza o configurazione.

### Cosa e secondario

- componenti decorative;
- KPI business non legati alla configurazione.

### Come si arriva al mezzo

- di norma non e il focus;
- eventuali collegamenti al mezzo esistono solo da log o audit che coinvolgono una targa.

### Dove stanno IA / PDF / scadenze / filtri

- IA: qui solo per configurazione o strumenti dedicati;
- PDF: praticamente assente salvo export tecnici;
- scadenze: limitate a warning tecnici o policy;
- filtri: presenti nelle tabelle utenti/log, non come fascia dominante.

## Decisione operativa finale

I wireframe logici della NEXT devono far rispettare tre regole:
- il `Centro di Controllo` governa il giorno;
- il `Dossier Mezzo` governa la singola targa;
- `Acquisti & Magazzino`, `Operativita`, `Autisti`, `Sistema` governano domini globali distinti ma collegati.

Questo documento serve come ponte tra blueprint grafico e futura shell UI reale.
