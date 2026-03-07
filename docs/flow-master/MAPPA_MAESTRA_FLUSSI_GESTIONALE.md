# MAPPA MAESTRA FLUSSI GESTIONALE

## Legenda stato
- **[CONFERMATO]**: dimostrato da repository e/o documenti ufficiali.
- **[DA VERIFICARE]**: punto aperto o non chiudibile in modo univoco.
- **[NON DIMOSTRATO]**: ipotesi non supportata dalle prove raccolte.

## 1. Scopo
Questo documento esiste per dare una vista unica e leggibile del funzionamento vivo del gestionale.

Permette di capire:
- dove nasce ogni flusso operativo;
- quali moduli lo leggono o lo modificano;
- cosa converge nel Dossier Mezzo;
- cosa resta globale;
- dove intervengono IA, PDF, scadenze, alert e permessi.

E importante per:
- **utente**: per leggere il gestionale come processo reale, non come elenco pagine;
- **ChatGPT/CTO**: per progettare shell NEXT, priorita e convergenze senza inventare;
- **Codex**: per sapere quali flussi sono critici prima di toccare dati, route, Storage, IA o PDF.

## 2. Visione generale del sistema
Il gestionale attuale e un ecosistema unico con due grandi aree:
- **area admin/ufficio**: Home, Centro di Controllo, Flotta, Dossier, Operativita, Magazzino, Analisi, IA, Supporto;
- **area autisti**: app campo separata con inbox/admin di rettifica e monitoraggio.

La logica generale oggi e questa:
- **Home / Centro di Controllo** [CONFERMATO]: raccolgono priorita, eventi, alert e accessi rapidi ai record critici.
- **Flotta** [CONFERMATO]: governa i mezzi come anagrafica e punto di ingresso per la targa.
- **Dossier Mezzo** [CONFERMATO come direzione architetturale + base forte nel repo]: e il punto di convergenza dei flussi targa-centrici.
- **Operativita** [CONFERMATO]: gestisce lavori, task e manutenzioni.
- **Magazzino / Acquisti** [CONFERMATO]: governa ordini, arrivi, inventario, consegne e parte del documentale economico.
- **Analisi** [CONFERMATO]: legge costi, documenti e dati mezzo-centrici per produrre vista economica.
- **Autisti** [CONFERMATO]: genera eventi di campo che finiscono in Home, inbox admin, Dossier e viste 360.
- **Sistema / Supporto** [CONFERMATO]: contiene funzioni trasversali come `storageSync`, `homeEvents`, `pdfEngine`, preview PDF, integrazioni IA e configurazioni.

Regola di lettura del sistema:
- se un dato ha una **targa forte**, tende a convergere nel **Dossier Mezzo**;
- se un dato e di **governo generale** o di **stock condiviso**, tende a restare globale;
- IA, PDF, alert e sicurezza attraversano piu moduli e non vanno letti come moduli isolati.

## 3. Flussi principali del gestionale

### A. Flusso lavori / manutenzioni
- **Da dove nasce** [CONFERMATO]:
  - lavori da area admin (`LavoriDaEseguire`, `DettaglioLavoro`);
  - manutenzioni da `Manutenzioni`;
  - alcuni eventi autisti possono generare lavori o manutenzioni tramite `AutistiAdmin` e `AutistiEventoModal`.
- **Moduli coinvolti** [CONFERMATO]:
  - `LavoriDaEseguire`, `LavoriInAttesa`, `LavoriEseguiti`, `DettaglioLavoro`, `GestioneOperativa`, `Manutenzioni`, `DossierMezzo`, `Mezzo360`.
- **Dati coinvolti** [CONFERMATO]:
  - `@lavori`
  - `@manutenzioni`
  - `@materialiconsegnati` e `@inventario` quando la manutenzione usa materiali
- **Convergenza nel Dossier** [CONFERMATO]:
  - si, quando il record e legato a una targa.
- **PDF / costi / storico**:
  - PDF presenti in area lavori e dossier [CONFERMATO a livello progetto];
  - impatto sui costi mezzo e sulle viste economiche [CONFERMATO come lettura lato analisi/costi, ma pipeline unica costo da lavoro/manutenzione **DA VERIFICARE**].
- **Punti aperti o ambigui**:
  - route dettagli legacy duplicate [CONFERMATO];
  - relazione canonica tra lavori, materiali e costo economico finale [DA VERIFICARE].

### B. Flusso segnalazioni
- **Da dove nasce** [CONFERMATO]:
  - dall'app autisti tramite `Segnalazioni`;
  - l'area admin/autisti inbox le legge, rettifica e puo prenderle in carico.
- **Moduli coinvolti** [CONFERMATO]:
  - `Segnalazioni`, `AutistiInboxHome`, `AutistiSegnalazioniAll`, `AutistiAdmin`, `Home`, `CentroControllo`, `Autista360`, `Mezzo360`.
- **Dati coinvolti** [CONFERMATO]:
  - `@segnalazioni_autisti_tmp`
  - allegati Storage `autisti/segnalazioni/...`
- **Impatto su Dossier / Centro di Controllo / Analisi**:
  - Centro di Controllo e Home leggono il flusso come evento/alert [CONFERMATO];
  - viste 360 e Dossier leggono il flusso quando la segnalazione e associata a una targa [CONFERMATO];
  - impatto diretto su Analisi economica [NON DIMOSTRATO].
- **Passaggio chiave** [CONFERMATO]:
  - da segnalazione si puo generare un lavoro o una presa in carico operativa.
- **Punti aperti o ambigui**:
  - regole uniche di chiusura/rettifica e audit centralizzato [DA VERIFICARE].

### C. Flusso rifornimenti
- **Da dove nasce** [CONFERMATO]:
  - principalmente dall'app autisti tramite `Rifornimento`;
  - l'area admin/autisti puo rettificare o riallineare il dato.
- **Moduli coinvolti** [CONFERMATO]:
  - `Rifornimento`, `AutistiAdmin`, `AutistiInboxHome`, `Home`, `CentroControllo`, `DossierRifornimenti`, `DossierMezzo`, `Mezzo360`, `AnalisiEconomica`.
- **Dati coinvolti** [CONFERMATO]:
  - feed temporaneo `@rifornimenti_autisti_tmp`
  - feed canonico dossier `@rifornimenti`
- **Storico / Dossier / costi / analisi**:
  - entra in Home e Centro di Controllo come evento operativo [CONFERMATO];
  - converge nel Dossier e nelle viste 360 per targa [CONFERMATO];
  - alimenta le sezioni economiche/analitiche [CONFERMATO].
- **Punto delicato** [CONFERMATO]:
  - il flusso convive tra tmp e canonico.
- **Punti aperti o ambigui**:
  - shape non uniforme di `@rifornimenti` [CONFERMATO come incoerenza];
  - catena canonica definitiva tmp -> rettifica -> dossier [DA VERIFICARE come contratto finale].

### D. Flusso materiali / ordini / inventario / consegne
- **Da dove nasce** [CONFERMATO]:
  - fabbisogno materiali da `MaterialiDaOrdinare` e `Acquisti`;
  - ordini da `Acquisti` / `DettaglioOrdine`;
  - arrivi che aggiornano inventario;
  - consegne materiali da `MaterialiConsegnati`;
  - consumo materiali anche dentro `Manutenzioni`;
  - import documentale IA in inventario da `IADocumenti`.
- **Moduli coinvolti** [CONFERMATO]:
  - `MaterialiDaOrdinare`, `Acquisti`, `DettaglioOrdine`, `Inventario`, `MaterialiConsegnati`, `GestioneOperativa`, `Manutenzioni`, `IADocumenti`.
- **Dati coinvolti** [CONFERMATO]:
  - `@ordini`
  - `@inventario`
  - `@materialiconsegnati`
  - `@listino_prezzi`
  - `@fornitori`
- **Come si muove** [CONFERMATO]:
  - fabbisogno -> ordine -> attesa/arrivo -> inventario -> consegna/consumo -> vista operativa;
  - parte del flusso resta globale;
  - parte del flusso entra nel Dossier quando e collegata a una targa o a un lavoro/manutenzione.
- **Collegamento mezzo** [CONFERMATO ma parziale]:
  - esiste per `@materialiconsegnati` e per alcune manutenzioni;
  - non tutto il procurement e mezzo-centrico.
- **Dossier / costi**:
  - il Dossier legge i movimenti materiali targa-correlati [CONFERMATO];
  - la catena completa ordine -> arrivo -> costo mezzo [DA VERIFICARE come pipeline unica].
- **Punti aperti o ambigui**:
  - piu writer insistono su `@inventario` [CONFERMATO];
  - collegamento inventario/consegne/manutenzioni non transazionale [CONFERMATO];
  - punto ad alto rischio se si tocca senza mappa writer->reader completa.

### E. Flusso documenti / libretti / preventivi / fatture
- **Da dove nasce** [CONFERMATO]:
  - upload documenti in area IA (`IADocumenti`);
  - libretti/foto mezzo (`IALibretto`, `IACoperturaLibretti`);
  - preventivi manuali o IA in `Acquisti`;
  - dominio specialistico cisterna in area dedicata.
- **Moduli coinvolti** [CONFERMATO]:
  - `IADocumenti`, `IALibretto`, `IACoperturaLibretti`, `Acquisti`, `DossierMezzo`, `AnalisiEconomica`, `CapoCostiMezzo`, `LibrettiExport`, area cisterna.
- **Dati coinvolti** [CONFERMATO]:
  - `@documenti_mezzi`
  - `@documenti_magazzino`
  - `@documenti_generici`
  - `@preventivi`
  - Storage `documenti_pdf/...`
  - Storage `mezzi_aziendali/<mezzoId>/libretto.jpg`
  - Storage `preventivi/ia/...` e `preventivi/<id>.pdf`
- **Lettura IA** [CONFERMATO]:
  - `IADocumenti` usa endpoint HTTP `estrazioneDocumenti`;
  - i preventivi possono usare callable `estraiPreventivoIA`;
  - libretti hanno canale separato.
- **Collegamento al mezzo / Dossier** [CONFERMATO]:
  - documenti mezzo entrano in Dossier, Analisi e aree Capo;
  - documenti magazzino possono avere impatto indiretto o possibile targa;
  - documenti generici restano piu globali.
- **PDF / storico**:
  - i file sono documenti PDF o immagini conservate in Storage [CONFERMATO];
  - la preview/export lato UI e diffusa [CONFERMATO].
- **Punti aperti o ambigui**:
  - governance endpoint IA/PDF multipli [CONFERMATO come punto aperto];
  - contratto finale allegati preventivi [CONFERMATO come punto aperto];
  - canale reale libretto e differenze tra repo e backend reale [CONFERMATO come punto aperto].

### F. Flusso autisti
- **Da dove nasce** [CONFERMATO]:
  - login, setup mezzo, cambio mezzo, rifornimento, controllo mezzo, segnalazione, richieste attrezzature, gomme.
- **Moduli coinvolti** [CONFERMATO]:
  - area autisti (`LoginAutista`, `AutistiGate`, `SetupMezzo`, `HomeAutista`, `CambioMezzoAutista`, `Rifornimento`, `ControlloMezzo`, `Segnalazioni`, `RichiestaAttrezzature`, `GommeAutistaModal`)
  - area admin/autisti (`AutistiInboxHome`, `AutistiAdmin`, viste `All`, `AutistiLogAccessiAll`)
  - Home, Centro di Controllo, Autista360, Mezzo360, Dossier.
- **Dati coinvolti** [CONFERMATO]:
  - `@autisti_sessione_attive`
  - `@storico_eventi_operativi`
  - `@rifornimenti_autisti_tmp`
  - `@controlli_mezzo_autisti`
  - `@segnalazioni_autisti_tmp`
  - `@richieste_attrezzature_autisti_tmp`
  - `@cambi_gomme_autisti_tmp`
  - `@gomme_eventi`
- **Dove finiscono nel gestionale principale** [CONFERMATO]:
  - Home e Centro di Controllo come eventi/alert/priorita;
  - inbox admin come punto di rettifica e presa in carico;
  - Dossier e viste 360 quando esiste legame con targa o badge;
  - in alcuni casi generano lavori, manutenzioni o rifornimenti canonici.
- **Punti aperti o ambigui**:
  - stream canonico definitivo eventi autisti [CONFERMATO come punto aperto];
  - matrice permessi e segregazione finale admin/autisti [CONFERMATO come punto aperto].

### G. Flusso analisi / costi / report
- **Da dove nasce** [CONFERMATO]:
  - aggregazione di costi, documenti IA, mezzi, rifornimenti, manutenzioni e dati economici mezzo-centrici.
- **Moduli coinvolti** [CONFERMATO]:
  - `AnalisiEconomica`, `CapoCostiMezzo`, `DossierMezzo`, `CentroControllo`, `LibrettiExport`.
- **Dati coinvolti** [CONFERMATO]:
  - `@costiMezzo`
  - `@documenti_mezzi`
  - `@documenti_magazzino`
  - `@documenti_generici`
  - `@analisi_economica_mezzi`
  - rifornimenti e dataset mezzo-correlati
- **Dove si leggono** [CONFERMATO]:
  - in AnalisiEconomica e CapoCosti come vista economica esplicita;
  - nel Dossier come supporto decisionale per la targa;
  - nel Centro di Controllo in forma piu sintetica e operativa.
- **Rapporto con Dossier e Centro Controllo**:
  - il Dossier legge il dettaglio mezzo-centrico [CONFERMATO];
  - il Centro di Controllo usa soprattutto sintesi, priorita e report operativi [CONFERMATO];
  - un layer unico di reporting economico cross-modulo [DA VERIFICARE].
- **Punti aperti o ambigui**:
  - confine canonico tra dato operativo, dato economico e documento IA [DA VERIFICARE].

## 4. Flussi trasversali

### IA
- **Come opera** [CONFERMATO]:
  - intake documenti in area IA;
  - estrazione su documenti, libretti, analisi economica e cisterna;
  - consumo dei risultati in Dossier, Analisi, Acquisti/Magazzino.
- **Punto chiave**:
  - IA non e un modulo isolato, ma una capability trasversale [CONFERMATO come decisione architetturale].
- **Punti aperti**:
  - endpoint multipli e canale canonico non ancora consolidato [DA VERIFICARE].

### PDF
- **Come opera** [CONFERMATO]:
  - preview, export e condivisione PDF in Home, Centro di Controllo, Dossier, Acquisti, Inventario, Materiali Consegnati, area autisti admin, Libretti.
- **Motore prevalente** [CONFERMATO]:
  - `pdfEngine` + `pdfPreview`.
- **Eccezione** [CONFERMATO]:
  - il dominio cisterna usa anche generazione locale con `jsPDF` / `autoTable`.
- **Punto aperto**:
  - standard PDF unico cross-modulo ancora da consolidare [DA VERIFICARE].

### Scadenze / promemoria
- **Come opera** [CONFERMATO]:
  - Home usa `@alerts_state` e costruisce alert/priorita a partire da mezzi, eventi e dati mancanti.
- **Dove impatta**:
  - Home e Centro di Controllo in modo diretto;
  - Flotta e Dossier come destinazioni navigabili degli alert.
- **Punto aperto**:
  - modello completo e canonico scadenze/promemoria cross-modulo [DA VERIFICARE].

### Permessi / sicurezza
- **Come opera oggi** [CONFERMATO]:
  - auth anonima all'avvio app;
  - routing senza guard ruolo esplicita a livello route;
  - area autisti separata come shell, ma permission matrix finale ancora non dimostrata.
- **Punto aperto**:
  - enforcement end-to-end su route, Firestore, Storage e Functions [DA VERIFICARE].

### Audit log
- **Stato attuale**:
  - esistono storici/eventi su alcuni flussi, soprattutto lato autisti [CONFERMATO];
  - un audit log applicativo trasversale unico non e dimostrato nel repo [NON DIMOSTRATO].

### Ricerca globale
- **Stato attuale**:
  - esistono filtri e ricerche locali di modulo [CONFERMATO];
  - una ricerca globale unica dal Centro di Controllo e target architetturale, non prova attuale [NON DIMOSTRATO / RACCOMANDAZIONE].

### Notifiche / alert
- **Stato attuale** [CONFERMATO]:
  - Home gestisce alert attivi, reminder, export PDF degli alert e priorita operative;
  - Centro di Controllo sintetizza priorita ed eventi rilevanti.

## 5. Convergenza verso il Dossier

### Flussi che convergono nel Dossier [CONFERMATO]
- lavori legati a targa;
- manutenzioni;
- rifornimenti;
- costi mezzo;
- documenti IA mezzo-correlati;
- eventi autisti collegati al mezzo;
- gomme/eventi 360;
- materiali consegnati o consumati quando c'e collegamento a targa.

### Flussi che restano globali [CONFERMATO]
- ordini, listino e procurement generale;
- inventario come stock condiviso;
- anagrafiche colleghi/fornitori;
- intake IA generale;
- configurazioni, sicurezza, supporto;
- dominio cisterna specialistico.

### Flussi ibridi [CONFERMATO]
- magazzino: globale nella gestione stock, mezzo-centrico quando un movimento tocca una targa;
- autisti: globale come feed/eventi, mezzo-centrico quando l'evento e associato al mezzo;
- analisi: globale come confronto/KPI, mezzo-centrica nel dettaglio per targa;
- Centro di Controllo: globale come cabina di regia, ma con drill-down verso record targa-correlati.

## 6. Punti aperti che impattano i flussi
I punti aperti che impattano direttamente la lettura o la sicurezza dei flussi sono:
- **stream eventi autisti canonico**: decide quale flusso e davvero la sorgente ufficiale;
- **contratto finale allegati preventivi**: decide come si muovono documenti e PDF in Acquisti;
- **matrice ruoli/permessi definitiva**: decide chi puo leggere, rettificare o scrivere nei flussi;
- **policy Firestore effettive**: decide l'enforcement reale lato dati;
- **policy Storage effettive**: impattano direttamente allegati, libretti, documenti, preventivi e immagini;
- **governance endpoint IA/PDF multipli**: impatta i flussi trasversali;
- **coerenza flusso inventario/materiali**: impatta ordini, arrivi, consegne, manutenzioni e import IA.

Dettaglio e stato ufficiale: `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`.

## 7. Conclusione operativa
Per leggere bene il sistema bisogna usare questa regola semplice:
- **partenza**: capire chi genera il dato;
- **passaggio**: capire quali moduli lo modificano o lo rettificano;
- **destinazione**: capire se il dato resta globale o converge nel Dossier;
- **capability**: verificare se il flusso tocca IA, PDF, alert o permessi.

Prima di future modifiche bisogna controllare sempre:
1. quale dataset e coinvolto;
2. quali writer e reader esistono davvero;
3. se il flusso converge nel Dossier o resta globale;
4. se il flusso tocca Storage, IA, PDF o permessi;
5. se il punto e gia presente nel registro dubbi.

I flussi piu critici da non toccare senza analisi aggiuntiva sono:
- autisti -> eventi -> inbox/admin -> dataset canonici;
- preventivi/allegati in Acquisti;
- inventario/materiali/consegne;
- documenti IA e libretti;
- PDF cross-modulo;
- permessi e policy dati effettive.
