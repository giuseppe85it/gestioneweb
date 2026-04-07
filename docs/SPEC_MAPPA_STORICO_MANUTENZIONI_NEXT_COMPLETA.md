# SPEC TECNICA — Nuovo modulo NEXT Manutenzioni sostitutivo con vista Mappa Storico

## Stato documento
- Tipo: SPEC TECNICA DI IMPLEMENTAZIONE
- Stato: PRONTA PER PATCH DOPO AUDIT
- Ambito: NEXT
- Madre: intoccabile
- Fonte audit di riferimento: `docs/audit/AUDIT_manutenzioni_spec_sostitutivo_next_2026-04-07.md`

---

## 1. OBIETTIVO REALE

Creare nella `/next` un **nuovo modulo Manutenzioni reale** che **sostituisce il modulo legacy Manutenzioni**, mantenendo compatibilità business con i dati esistenti e aggiungendo una nuova vista visuale “Mappa storico”.

Il modulo nuovo deve:

- leggere i dati business reali già esistenti;
- scrivere i dati business nello **stesso modo compatibile** del modulo legacy;
- riusare tutta la logica già valida disponibile nei domain NEXT e nei flussi esistenti;
- aggiungere solo nuove scritture dedicate alla parte visuale della mappa, senza alterare i dataset business esistenti.

Questo documento **non** descrive più una semplice pagina aggiuntiva.  
Descrive il **nuovo modulo sostitutivo Manutenzioni** nella NEXT, dentro cui la mappa storico è una vista interna.

---

## 2. DECISIONE ARCHITETTURALE

### 2.1 Natura del modulo
- Modulo nuovo NEXT
- Modulo reale
- Modulo sostitutivo del legacy `Manutenzioni`
- Non clone read-only
- Non estensione cosmetica del legacy

### 2.2 Regola di compatibilità
Il nuovo modulo deve preservare il comportamento business reale di:

- `@manutenzioni`
- `@inventario`
- `@materialiconsegnati`
- import/derivazione da eventi gomme autisti

Le scritture business del nuovo modulo NON devono inventare un contratto nuovo se il contratto attuale è già letto da altri moduli.

### 2.3 Nuove scritture ammesse
Sono ammesse nuove scritture solo per la parte visuale:

- metadata foto viste mezzo
- metadata hotspot
- eventuali mapping visivi associati alla targa

---

## 3. VERITÀ OPERATIVE EMERSE DALL’AUDIT

### 3.1 Stato attuale verificato
- `/manutenzioni` = modulo legacy operativo e writer reale
- `/next/manutenzioni` = modulo NEXT ufficiale ma attualmente read-only
- `/next/manutenzioni/mappa/:targa` = oggi assente

### 3.2 Writer business reale oggi
Il legacy è oggi il writer reale del business manutenzioni e scrive su:

- `@manutenzioni`
- `@inventario`
- `@materialiconsegnati`

Inoltre esiste derivazione manutentiva da eventi gomme autisti.

### 3.3 Nota critica già emersa
La semantica reale di `@materialiconsegnati` va preservata con estrema prudenza.  
Finché non viene ridefinita ufficialmente, nel nuovo modulo va mantenuta la semantica legacy reale, senza reinterpretazioni.

### 3.4 Boundary clone
Oggi il clone write barrier consente solo la scrittura reale di `@lavori`.  
Per rendere `Manutenzioni` un modulo reale NEXT sarà necessaria una decisione esplicita e chirurgica sul boundary di scrittura.

---

## 4. POSIZIONE NEL GESTIONALE

Il nuovo modulo vive in:

- route ufficiale: `/next/manutenzioni`

La **mappa storico** non è il modulo intero.  
È una **vista interna** del nuovo modulo.

### Struttura consigliata del modulo
Dentro `NextManutenzioniPage.tsx` devono convivere almeno queste viste:

- Elenco / Dashboard
- Storico manutenzioni
- Mappa storico
- Eventuali viste collegate coerenti con il legacy

### Route secondaria opzionale
È ammessa una route secondaria:

- `/next/manutenzioni/mappa/:targa`

ma solo come deep-link o accesso diretto.  
La superficie ufficiale del modulo resta `/next/manutenzioni`.

---

## 5. PERIMETRO FUNZIONALE DEL NUOVO MODULO

Il nuovo modulo sostitutivo deve coprire due blocchi distinti.

### 5.1 Blocco A — Compatibilità business obbligatoria
Da preservare:

- creazione manutenzione
- modifica manutenzione
- eliminazione manutenzione
- lettura storico
- gestione materiali collegati
- effetti coerenti su inventario e materiali consegnati
- compatibilità con eventi gomme/autisti già convergenti
- compatibilità con i moduli lettori collegati
- PDF storico e comportamenti principali del legacy dove già esistono

### 5.2 Blocco B — Nuova vista Mappa Storico
Nuova funzionalità da aggiungere:

- 4 viste fotografiche del mezzo
- hotspot posizionati manualmente
- dettaglio storico per zona
- ricerca e filtri per interventi
- vista visuale dello storico del mezzo

---

## 6. DATASET BUSINESS DA PRESERVARE

Persistenza attuale verificata in `collection = storage`, documenti:

- `@manutenzioni`
- `@mezzi_aziendali`
- `@inventario`
- `@materialiconsegnati`
- `@rifornimenti`
- `@rifornimenti_autisti_tmp`
- `@cambi_gomme_autisti_tmp`
- `@gomme_eventi`

### Regola obbligatoria
Il nuovo modulo NON deve cambiare arbitrariamente la forma dei record business attuali.

---

## 7. CONTRATTO BUSINESS REALE DA PRESERVARE

### 7.1 Shape reale record manutenzione
Il writer legacy crea voci con campi reali di questo tipo:

- `id`
- `targa`
- `tipo`
- `fornitore`
- `km`
- `ore`
- `sottotipo`
- `descrizione`
- `eseguito`
- `data`
- `materiali`

### 7.2 Campi minimi verificati nel form legacy
Obbligatori reali:

- `targa`
- `descrizione`
- `data`

Nullabili / opzionali reali:

- `km`
- `ore`
- `sottotipo`
- `eseguito`

### 7.3 Materiali
`materiali[]` contiene record del tipo:

- `id`
- `label`
- `quantita`
- `unita`
- `fromInventario?`
- `refId?`

### 7.4 Regola obbligatoria
Il nuovo modulo deve scrivere in modo compatibile con questa shape.  
Se serve una normalizzazione interna per la UI NEXT, essa deve essere **solo interna**, non deve alterare il contratto business salvato.

---

## 8. LOGICA DA RIUSARE OBBLIGATORIAMENTE

Il nuovo modulo deve riusare, non duplicare, la logica già valida.

### 8.1 Manutenzioni
Da riusare:

- `src/next/NextManutenzioniPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`

Nota:
- il blocco read-only attuale non va mantenuto;
- la parte utile è la normalizzazione / lettura / struttura NEXT già esistente.

### 8.2 Gomme
Da riusare:

- `src/next/domain/nextManutenzioniGommeDomain.ts`

Obiettivo:
- convergenza dello storico gomme
- eventi gomme
- dedup prudente
- nessuna riscrittura da zero della logica già esistente

### 8.3 Rifornimenti
Da riusare:

- `src/next/domain/nextRifornimentiDomain.ts`

Regola:
- non leggere km in modo raw da `@rifornimenti` nella nuova spec;
- usare il domain NEXT già esistente e il relativo snapshot mezzo.

### 8.4 Mezzi
Da riusare:

- `src/next/nextAnagraficheFlottaDomain.ts`

Per:

- `targa`
- `categoria`
- `tipo`
- `marca`
- `modello`
- eventuali metadati manutentivi già disponibili

---

## 9. NUOVA VISTA “MAPPA STORICO”

## Obiettivo
Mostrare lo storico manutentivo reale di un mezzo attraverso una mappa fotografica a 4 viste con hotspot manuali.

## Viste
- fronte
- sinistra
- destra
- retro

## Regola d’uso
La mappa storico è una vista interna del modulo Manutenzioni.  
Non sostituisce da sola l’intero modulo.

## Comportamento minimo richiesto
- caricare una foto per ciascuna vista
- mostrare hotspot già salvati
- aprire dettaglio storico della zona
- filtrare / cercare interventi
- funzionare anche senza foto
- funzionare anche senza hotspot

---

## 10. NUOVI DATI VISIVI

Questi dati sono separati dai dataset business.

### 10.1 Metadata applicativi
Nuovi documenti in `collection = storage`:

- `@mezzi_foto_viste`
- `@mezzi_hotspot_mapping`

Questi contengono metadata applicativi, non file binari.

### 10.2 File binari
Le immagini vere devono stare in Firebase Storage, su path del tipo:

`mezzi_foto/{targa}/{vista}_{timestamp}.{ext}`

Esempio:
`mezzi_foto/TI239279/sinistra_1712345678.jpg`

### 10.3 Regola terminologica obbligatoria
Nella patch non confondere:

- documenti `storage/@...`
- collection/documenti logici
- Firebase Storage file binari

---

## 11. MODELLO DATI MAPPA

I modelli della vista mappa possono restare, ma con le seguenti correzioni.

### 11.1 Campi opzionali da trattare con prudenza
Nei record visuali / aggregati i campi seguenti NON sono garantiti dal contratto manutenzioni reale e quindi devono essere opzionali:

- `costo`
- `valuta`
- `allegati`

### 11.2 Km
La label UI deve essere:

- `Km ultimo rifornimento`

Non usare semplicemente `Km`.

### 11.3 Tipo mezzo
Il mapping a 5 categorie può restare come supporto UI, ma non va trattato come verità assoluta del contratto dati.

Quindi:

- usare mapping prudente
- prevedere fallback
- marcare i casi non chiari come `DA VERIFICARE`
- non forzare classificazioni non dimostrate dal repo reale

---

## 12. STRUTTURA UI DEL NUOVO MODULO `/next/manutenzioni`

## Obiettivo UI
Il nuovo modulo deve apparire come un modulo NEXT professionale, più chiaro e più moderno del legacy, ma senza perdere le funzioni reali del business attuale.

La UI deve essere organizzata in modo da far convivere:

- operatività reale sulle manutenzioni
- storico consultabile
- mappa storico visuale
- dettaglio del mezzo e dei materiali collegati

## Struttura pagina consigliata
La pagina `/next/manutenzioni` deve avere:

### Header modulo
In alto:
- titolo modulo: `Manutenzioni`
- eventuale sottotitolo contestuale
- selezione mezzo o stato mezzo selezionato
- azioni principali:
  - Nuova manutenzione
  - Storico
  - Mappa storico
  - eventuale Esporta PDF se previsto nel comportamento legacy/NEXT

### Navigazione interna
Viste/tab interne almeno di questo tipo:

- `Dashboard`
- `Storico`
- `Nuova / Modifica`
- `Mappa storico`

Le tab o viste devono restare nella stessa grammatica visuale NEXT già usata negli altri moduli rifatti.

### Corpo pagina
Il corpo deve essere composto da sezioni/card chiare, senza miscuglio visivo.

Possibile struttura:

- fascia alta con selezione mezzo e riepilogo
- colonna o area principale con vista attiva
- colonna laterale o pannelli secondari per dettagli / materiali / azioni

---

## 13. UI — VISTA ELENCO / STORICO

Questa vista deve sostituire in modo più pulito lo storico manutenzioni del legacy.

### Contenuti minimi
- elenco manutenzioni del mezzo selezionato
- ordinamento coerente per data
- ricerca
- eventuali filtri base
- evidenza del tipo manutenzione
- descrizione
- data
- eventuale fornitore
- eventuale km/ore se presenti
- stato eseguito se usato

### Comportamento
Ogni riga/card deve poter aprire:
- dettaglio manutenzione
- modifica
- elimina
- eventuali materiali collegati

### Obiettivo visivo
Più leggibile del legacy, con:
- card o tabella premium pulita
- badge/stati
- righe ben separate
- niente densità eccessiva

---

## 14. UI — VISTA NUOVA / MODIFICA MANUTENZIONE

Questa vista deve coprire la scrittura business reale.

### Campi minimi reali da rispettare
- targa
- descrizione
- data

### Campi supportati dal contratto reale
- tipo
- fornitore
- km
- ore
- sottotipo
- eseguito
- materiali

### Regole UI
- form chiaro
- sezioni separate
- gestione materiali integrata in modo comprensibile
- salvataggio reale compatibile col legacy
- modifica reale compatibile col legacy
- eliminazione reale compatibile col legacy

### Nota importante
La UI può essere rifatta, ma il writer business deve restare compatibile con il contratto reale.

---

## 15. UI — VISTA MAPPA STORICO

Questa parte mantiene il dettaglio UI del file originale ed è una sottovista interna del nuovo modulo.

### Stato React suggerito

```tsx
const [snapshot, setSnapshot] = useState<MappaStoricoSnapshot | null>(null);
const [loading, setLoading] = useState(true);
const [vistaAttiva, setVistaAttiva] = useState<VistaMezzo>('sinistra');
const [modalitaSetup, setModalitaSetup] = useState(false);
const [zonaSelezionata, setZonaSelezionata] = useState<string | null>(null);
const [pendingPos, setPendingPos] = useState<{x:number,y:number} | null>(null);
const [zonaPerPending, setZonaPerPending] = useState<string>('');
const [modalAperto, setModalAperto] = useState<'ultimi'|'frequenti'|'perzona'|null>(null);
const [searchQuery, setSearchQuery] = useState('');
const [saving, setSaving] = useState(false);
```

### Layout generale
2 colonne principali:

- **colonna sinistra — 55%**
  - scheda mezzo in alto
  - selettore 4 viste
  - area foto con hotspot
  - legenda / setup hotspot

- **colonna destra — 45%**
  - ricerca
  - filtri
  - dettaglio stabile della zona selezionata
  - risultati ricerca o modali

### Scheda mezzo
In alto sopra le viste:

```text
Targa: TI 239279 | Renault Trucks T High | Trattore 4x2
Km ultimo rifornimento: 482.540
Ultima manutenzione: 12/02/2026
Interventi totali: 38
```

Regola:
- i km si mostrano solo per trattori/motrici se il dato è disponibile dal domain rifornimenti
- per rimorchi/semirimorchi non mostrare il blocco km

### Selettore 4 viste
Bottoni/tab:

- Fronte
- Sinistra
- Destra
- Retro

Click:
- cambia `vistaAttiva`
- mostra foto e hotspot relativi a quella vista

### Area foto con hotspot
Comportamento atteso:

- se esiste la foto della vista, mostrarla
- se non esiste, mostrare placeholder elegante con invito al caricamento
- renderizzare hotspot della vista attiva
- click hotspot = selezione zona e dettaglio a destra

### Regola hotspot
In vista normale:
- mostrare hotspot solo se hanno storico reale associato

In modalità setup:
- mostrare anche il cursore/punto pending
- consentire aggiunta o eliminazione hotspot

### Modalità setup
Bottone:
- `Gestisci hotspot`

In modalità setup:
- cursore crosshair
- click sulla foto = acquisizione coordinate
- form a destra o sotto per scegliere la zona
- conferma = salvataggio hotspot
- hotspot esistenti eliminabili con `×`
- upload foto disponibile per la vista attiva

### Colonna destra — dettaglio stabile
Quando nessuna zona è selezionata:
- ricerca nello storico
- filtri rapidi:
  - Ultimi interventi
  - Più frequenti
  - Per zona

Quando una zona è selezionata:
- nome zona
- numero interventi
- ultima data
- ultimo costo se disponibile
- costo totale storico se disponibile
- lista tipi intervento unici
- storico cronologico degli interventi

### Modali filtri
Servono 3 modali:

- `Ultimi interventi`
- `Più frequenti`
- `Per zona`

Ogni modale deve portare l’utente alla zona o all’intervento scelto in modo rapido.

### Ricerca
Ricerca full-text almeno su:
- tipo intervento
- note
- label zona

Risultati ordinati per data.

---

## 16. CSS — MAPPA STORICO

Prefisso CSS obbligatorio per la vista mappa:

- `.ms-`

### Selettori base attesi
Devono esistere almeno strutture di questo tipo:

- `.ms-layout`
- `.ms-card`
- `.ms-mezzo-header`
- `.ms-mezzo-targa`
- `.ms-mezzo-meta`
- `.ms-viste-tabs`
- `.ms-vista-btn`
- `.ms-photo-wrap`
- `.ms-foto-placeholder`
- `.ms-hotspot`
- `.ms-hotspot-dot`
- `.ms-hotspot-label`
- `.ms-add-cursor`
- `.ms-zona-title`
- `.ms-zona-meta`
- `.ms-intervento-row`
- `.ms-filtri`
- `.ms-filtro-btn`
- `.ms-modal-overlay`
- `.ms-modal`
- `.ms-modal-row`
- `.ms-setup-form`

### Obiettivo visivo
- look premium e coerente con la NEXT
- layout pulito
- etichette leggibili
- hotspot chiari ma non invasivi
- modali semplici e coerenti con il resto del gestionale NEXT

### Responsive
Sotto circa `1100px`:
- layout mappa a una colonna
- dettaglio zona sotto la foto
- mantenere usabilità mobile/tablet senza rompere desktop

---

## 17. ROUTING

### Route ufficiale del modulo
- `/next/manutenzioni`

### Route secondaria opzionale
- `/next/manutenzioni/mappa/:targa`

Questa route va aggiunta solo se viene approvata esplicitamente in implementazione.

Impatto noto:
- richiede modifica a `src/App.tsx`

---

## 18. FILE COINVOLTI NELLA PATCH IMPLEMENTATIVA

### File da modificare
- `src/next/NextManutenzioniPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/utils/cloneWriteBarrier.ts`
- `src/App.tsx` solo se si conferma la route secondaria dedicata

### File da creare
- `src/next/domain/nextMappaStoricoDomain.ts`
- `src/next/mezziHotspotAreas.ts`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/next-mappa-storico.css`

---

## 19. REGOLE IMPLEMENTATIVE OBBLIGATORIE

### 19.1 Madre intoccabile
Non toccare:
- `src/pages/Manutenzioni.tsx`
- né altri file legacy per “facilitare” la NEXT

### 19.2 Compatibilità 100%
Il nuovo modulo NEXT deve diventare sostitutivo senza perdere:

- lettura storico
- scritture manutentive
- effetti su inventario
- effetti su materiali consegnati
- convergenza eventi gomme

### 19.3 Nessuna patch cieca sulla semantica materiali
Finché `@materialiconsegnati` non viene ridefinito ufficialmente, la patch deve mantenere comportamento legacy reale, non reinterpretato.

### 19.4 Boundary di scrittura
Per rendere il modulo reale NEXT servirà una deroga chirurgica sul clone write barrier, limitata ai dataset realmente necessari e verificati.

### 19.5 Nessuna duplicazione inutile
Non duplicare da zero la logica dei domain esistenti se è già valida e verificata.

### 19.6 Testo UI
Tutto in italiano.

---

## 20. VERIFICHE FINALI RICHIESTE

### Verifiche tecniche
- build OK
- lint dei file nuovi/modificati OK
- route modulo funzionante
- eventuale deep-link mappa funzionante

### Verifiche business
- nuova Manutenzioni NEXT salva davvero in modo compatibile con il legacy
- modifica ed elimina in modo compatibile
- i dataset letti dagli altri moduli non risultano rotti
- gli eventi gomme continuano a convergere correttamente
- la parte visuale non altera i dataset business esistenti

### Verifiche visuali
- la mappa funziona anche senza foto
- la mappa funziona anche senza hotspot
- i dettagli zona si aprono correttamente
- la label mostrata è `Km ultimo rifornimento`

---

## 21. OUTPUT DOCUMENTALE OBBLIGATORIO

La patch implementativa dovrà aggiornare:

- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- change report dedicato
- continuity report dedicato

---

## 22. ESITO ATTESO

Risultato finale desiderato:

- `Manutenzioni` nella NEXT non è più read-only
- diventa il nuovo modulo sostitutivo reale
- mantiene compatibilità business con il legacy
- aggiunge la nuova vista “Mappa storico”
- non rompe dossier, gomme, inventario, materiali consegnati e moduli lettori collegati
