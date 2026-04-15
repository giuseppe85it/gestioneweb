# SPEC_ESECUTIVA_IA_V1

## 1. Scopo

Questo documento serve a dire in modo semplice e operativo come deve diventare la nuova IA del gestionale.

Non è un audit.
Non è una discussione tecnica.
È la guida da seguire per implementare la V1 senza inventare, senza allargare il perimetro e senza rifare pezzi già buoni.

---

## 2. Punto chiave già deciso

La nuova IA deve essere divisa in **2 strumenti separati**.

### IA 1 · Report
È la parte che legge i dati e risponde.
Non archivia documenti.
Non modifica record.
Non scrive niente.

### IA 2 · Archivista documenti
È la parte che serve per:
- scegliere il tipo documento
- scegliere il contesto
- caricare foto o PDF
- analizzare
- vedere cosa la IA ha capito
- correggere se serve
- confermare
- archiviare
- solo dopo, eventualmente, proporre una seconda azione

IA 2 **non è una chat**.

---

## 3. Regole fisse da non cambiare

1. Madre intoccabile.
2. NEXT unico perimetro di evoluzione.
3. IA 1 e IA 2 devono restare separate.
4. IA 2 non deve essere una chat.
5. L’utente sceglie sempre prima:
   - tipo
   - contesto
6. Niente automatismi che indovinano il contesto.
7. Prima archivio, poi eventuale azione business.
8. Solo OpenAI come direzione futura.
9. Tutti i testi visibili in italiano.
10. `@costiMezzo` non è la destinazione primaria di IA 2.

---

## 4. Cosa NON va rifatto

### Magazzino
Il ramo Magazzino **non va rifatto**.

È il ramo già più forte e più riusabile.
Va solo:
- tenuto
- rispettato
- agganciato bene al nuovo Archivista
- non sporcato
- non riscritto da zero

Quindi:
- niente rifacimento del cervello Magazzino
- niente reinvenzione del flusso documentale Magazzino
- niente “nuovo template Magazzino da zero” se quello esistente è già il ramo più forte

---

## 5. Cosa entra nella V1

La V1 della nuova IA 2 deve coprire solo queste famiglie:

1. **Fattura / DDT + Magazzino**
2. **Fattura / DDT + Manutenzione**
3. **Documento mezzo**
4. **Preventivo + Magazzino**

---

## 6. Cosa resta fuori dalla V1

Queste parti non vanno messe nella prima versione:

- Preventivo manutenzione
- Cisterna AdBlue
- Euromecc
- Carburante

Motivo:
non vanno mischiate subito dentro l’Archivista V1.

---

## 7. Come deve funzionare IA 2

### 7.1 Schermata iniziale
IA 2 deve avere una pagina sua pulita.

L’utente deve vedere:
- scelta **Tipo**
- scelta **Contesto**
- area upload
- pulsante **Analizza documento**

### 7.2 Ordine corretto
Il flusso utente corretto è:

1. scelgo il tipo
2. scelgo il contesto
3. carico il documento
4. premo analizza
5. vedo il risultato dell’analisi
6. correggo se serve
7. confermo
8. il sistema archivia
9. solo dopo può proporre una seconda azione

### 7.3 Cosa non deve fare
IA 2 non deve:
- sembrare una chat
- scegliere da sola il contesto
- salvare di nascosto
- fare azioni business prima dell’archivio

---

## 8. Regola specifica per Magazzino

Per il caso:

**Fattura / DDT + Magazzino**

la logica corretta è questa:

- l’Archivista deve usare il ramo Magazzino già esistente e già forte
- non deve rifarlo
- non deve sostituirlo
- deve solo presentarlo dentro la nuova struttura corretta

Questa è una regola chiave di questa spec.

---

## 9. Regola specifica per Fattura Manutenzione

Per il caso:

**Fattura / DDT + Manutenzione**

la logica corretta è questa:

1. il documento viene prima trattato come documento da archiviare
2. non viene subito trasformato in manutenzione
3. dopo la conferma si può proporre:
   - collega a manutenzione esistente
   - crea nuova manutenzione
   - lascia solo archiviato

### Regola importante
Non usare `@costiMezzo` come destinazione primaria di questo flusso.

---

## 10. Regola specifica per Documento mezzo

Per il caso:

**Documento mezzo**

la logica corretta è questa:

1. si archivia l’originale
2. si collega il documento al mezzo
3. si mostrano i campi letti
4. i campi del mezzo si aggiornano solo su conferma

Questa regola vale per:
- libretto
- assicurazione
- revisione
- collaudo

---

## 11. Regola specifica per Preventivo Magazzino

Per il caso:

**Preventivo + Magazzino**

la logica corretta è questa:

1. il preventivo viene letto
2. l’utente vede i dati
3. il preventivo viene archiviato nel suo ramo corretto
4. non si aggiorna automaticamente il listino
5. eventuali azioni successive restano separate

---

## 12. Regola sui duplicati

Quando il sistema pensa che un documento possa essere già presente, non deve decidere da solo.

Deve chiedere all’utente una scelta semplice:

1. è lo stesso documento
2. è una versione migliore dello stesso documento
3. è un documento diverso

Niente doppioni nascosti.
Niente sostituzioni automatiche.

---

## 13. Ordine di realizzazione corretto

### Fase 1
Separare chiaramente IA 1 e IA 2 nel runtime.
Questo è già il primo passo corretto.

### Fase 2
Fare la pagina Archivista pulita.

### Fase 3
Agganciare dentro Archivista il caso **Magazzino** senza rifarlo.

### Fase 4
Costruire bene i casi nuovi dove il repo non è già abbastanza forte:
- Fattura manutenzione
- Documento mezzo
- Preventivo Magazzino come forma coerente nell’Archivista

### Fase 5
Fare review, conferma e archiviazione.

### Fase 6
Solo dopo trattare eventuali azioni business.

---

## 14. Cosa Codex deve fare

Codex deve:
- leggere questo file prima di toccare il codice
- rispettare la V1 e non allargarla
- non rifare Magazzino
- non usare `@costiMezzo` come destinazione primaria
- non mischiare IA 1 e IA 2
- non trasformare IA 2 in una chat
- non inventare flussi non decisi

Se per implementare una parte serve un file extra fuori whitelist, deve fermarsi e dichiararlo.

---

## 15. Verdetto finale

La nuova IA V1 non deve nascere rifacendo tutto.

Deve nascere così:
- separazione corretta dei due strumenti
- riuso dei pezzi già buoni
- costruzione dei pezzi che mancano davvero
- archivio prima
- azione business dopo
