# SPEC_UI_LAYOUT_IMPORTA_DOCUMENTI

## Scopo
Questo file descrive il **layout approvato** della schermata `Importa documenti`.

Serve per dire a Codex **come deve apparire la schermata reale**, unendo:
- la logica già decisa nei file di progetto
- il layout visivo approvato fuori dal repo

Questo documento NON ridecide la logica.
Fissa solo **come deve essere resa a schermo** la pagina.

---

## Nome schermata
Il nome visibile della schermata deve essere:

**Importa documenti**

Non usare più:
- `Archivista documenti`

---

## Obiettivo visivo
La schermata deve essere:
- pulita
- leggibile
- poco rumorosa
- compatta nella parte alta
- chiara nella parte bassa
- senza effetto “pagina tecnica piena di box e scritte”

Se una spiegazione è utile ma non deve stare sempre visibile:
- metterla in tooltip / hover / title

Se un’azione è secondaria:
- metterla dentro `+` o `...`

---

## Struttura generale approvata

### Blocco 1 — testata
In alto deve esserci una testata compatta con:
- label piccola `IA 2`
- titolo grande `Importa documenti`
- breve frase semplice sotto
- bottone per andare a `IA Report`
- bottone secondario `...` o simile per storico / opzioni secondarie

La testata non deve essere alta inutilmente.

---

### Blocco 2 — fascia operativa alta
Subito sotto la testata deve esserci una fascia unica con 3 aree:

1. **Tipo documento**
2. **Contesto**
3. **Upload + Analizza**

Queste tre aree devono stare **affiancate su desktop**, non impilate inutilmente.

#### Tipo documento
Bottoni chiari per:
- `Fattura / DDT`
- `Preventivo`
- `Documento mezzo`

#### Contesto
Bottoni chiari per:
- `Magazzino`
- `Manutenzione`
- `Documento mezzo`

I contesti non validi:
- disabilitati
- ma leggibili

#### Upload
Area pulita con:
- bottone `Scegli file`
- possibilità di più file
- indicazione compatta dei file caricati
- bottone `+` per opzioni secondarie
- pulsante principale `Analizza documento`

---

### Blocco 3 — area principale a due colonne
Sotto la fascia alta, la pagina deve avere **2 colonne principali**.

#### Colonna sinistra
Serve per il documento.

Deve contenere:
- documento grande e leggibile
- area preview pulita
- zoom
- rotazione
- nessun rumore tecnico inutile

L’obiettivo è che il documento si possa davvero controllare visivamente.

#### Colonna destra
Serve per i dati estratti.

Deve contenere:
- campi principali ordinati
- valuta
- eventuali avvisi
- eventuale update mezzo se il ramo è `Documento mezzo`

I campi devono essere in card compatte e leggibili.

---

### Blocco 4 — tabella righe documento
Sotto i campi o subito dopo, deve esserci una tabella chiara con queste colonne:

- `Descrizione`
- `Quantità`
- `Unità`
- `Prezzo`
- `Totale`
- `Importa`

Ogni riga deve poter essere attivata/disattivata.

La tabella deve:
- essere leggibile
- non sembrare un debug
- non essere un elenco disordinato

Se serve uno scroll, deve stare solo lì, non in tutta la pagina.

---

### Blocco 5 — convalida finale
In basso deve esserci una zona chiara per la convalida.

Deve contenere:
- scelta duplicati:
  - `Stesso documento`
  - `Versione migliore`
  - `Documento diverso`
- bottone principale `Conferma e archivia`
- bottone secondario `Apri storico`
- bottone `...` per opzioni secondarie

I pulsanti devono essere:
- chiari
- leggibili
- con tooltip su hover per spiegare cosa fanno
- senza grandi blocchi di testo fisso nella pagina

---

## Regole di pulizia visiva

### Togliere
- box inutili
- spiegazioni duplicate
- blocchi introduttivi troppo lunghi
- card decorative che non aiutano il controllo del documento
- testo tecnico non necessario

### Tenere
- solo le informazioni che servono davvero per decidere
- i tooltip per le spiegazioni secondarie
- i badge utili allo stato documento

### Spostare
- storico / opzioni / impostazioni in `...` o `+`
- spiegazioni lunghe fuori dalla pagina principale

---

## Valuta
La valuta deve essere visibile in modo chiaro.

Se l’IA non la riconosce bene o l’utente vuole correggerla:
- deve poter scegliere almeno tra:
  - `EUR`
  - `CHF`

Questa scelta deve stare nella colonna destra con i campi estratti.

---

## Documento mezzo
Nel ramo `Documento mezzo`, oltre al layout base, deve esserci:

- selezione sottotipo:
  - `Libretto`
  - `Assicurazione`
  - `Revisione`
  - `Collaudo`
- campi del mezzo ordinati
- scelta esplicita per aggiornare o non aggiornare il mezzo

Questa scelta deve essere chiara e non nascosta.

---

## Desktop
Su desktop la schermata deve restare **larga e affiancata**.

Quindi:
- non impilare tutto in colonna se c’è spazio
- non trasformare una pagina desktop in una schermata mobile lunga
- la disposizione approvata è:
  - alto = fascia operativa
  - sotto = documento a sinistra + campi a destra
  - sotto = tabella righe
  - sotto = convalida finale

---

## Mobile / stretto
Se lo spazio non basta, il layout può adattarsi.
Ma la priorità di questo file è il **desktop**.

---

## Regola finale
Codex deve usare questo file come **modello visivo approvato** della schermata `Importa documenti`, unendolo alla logica già fissata nei file di progetto.

Questo file descrive **come deve apparire**.
La logica documentale resta definita negli altri file di progetto.
