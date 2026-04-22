# DOMINI DATI CANONICI

Versione: 2026-03-08  
Scopo: fonte di verita dominio-centrica per leggere, normalizzare e migrare i dati di GestioneManutenzione verso la NEXT senza ragionare per chiavi sparse.

## 1. Scopo del documento
Documento principale dominio-centrico per dati, normalizzazione e migrazione NEXT.

Deve diventare il riferimento operativo per:
- lettura coerente del repo;
- future patch documentali o applicative sui dati;
- futura IA che dovra ragionare per domini e non per storage keys isolate;
- migrazione progressiva dei moduli nella NEXT.

Questo file NON sostituisce:
- `docs/data/MAPPA_COMPLETA_DATI.md`, che resta la mappa fisica key/collection/path;
- `docs/data/REGOLE_STRUTTURA_DATI.md`, che resta il contratto entity-level ad alto livello.

Questo file fa da ponte canonico tra:
- architettura del gestionale;
- mappa fisica dei dataset;
- regole di normalizzazione;
- collocazione target nella NEXT.

## 2. Come va usato
1. Parti sempre dal dominio logico che vuoi toccare.
2. Solo dopo scendi ai dataset fisici collegati.
3. Verifica in `MAPPA_COMPLETA_DATI.md` la lista completa di chiavi, collection e path.
4. Verifica in `REGOLE_STRUTTURA_DATI.md` le entita gia formalizzate e le relazioni base.
5. Se un task riguarda la NEXT, usa questo file per capire:
   - se il dominio e mezzo-centrico o globale;
   - in quale macro-area shell va collocato;
   - se il dominio e gia abbastanza stabile da essere importato in read-only;
   - se esistono blocchi che impediscono l'importazione.
6. Se emerge una nuova chiave o collection, NON trattarla come dominio nuovo per default:
   - prima va agganciata a un dominio esistente;
   - se non e possibile, il nuovo dominio va dichiarato `DA VERIFICARE`.

## 3. Legenda stati e termini

### Stati prova
- `CONFERMATO`: dimostrato da repository e documentazione ufficiale.
- `DA VERIFICARE`: punto aperto non chiudibile con prove correnti.
- `NON DIMOSTRATO`: ipotesi non supportata.
- `RACCOMANDAZIONE`: direzione target o regola consigliata.

### Stati dominio
- `ABBASTANZA STABILE`: dominio leggibile e relativamente chiaro; puo essere base per import read-only controllato.
- `SENSIBILE`: dominio reale ma con collisioni writer/reader o accoppiamenti forti; richiede cautela alta.
- `DA VERIFICARE`: dominio presente ma non ancora completamente chiuso nel suo perimetro o nella sua governance.
- `BLOCCANTE PER IMPORTAZIONE`: il dominio non deve essere portato nella NEXT come dominio "normale" finche non si chiudono le incoerenze principali.

### Termini
- `Dominio logico`: insieme coerente di entita e flussi che rispondono a uno scopo business.
- `Dataset fisico`: key `storage/<key>`, collection Firestore, path Storage o chiave locale che implementa un pezzo del dominio.
- `Writer`: modulo che crea o aggiorna il dato.
- `Reader`: modulo che legge o aggrega il dato.
- `Modulo legacy pivot`: modulo attuale che meglio rappresenta o concentra il dominio nel repo.
- `Collocazione NEXT`: macro-area o modulo target in cui il dominio dovra vivere o essere letto.

## 4. Principi guida
1. Dominio prima della chiave.
2. Distinzione netta tra dominio logico e dataset fisico.
3. Distinzione netta tra stato legacy attuale e collocazione target nella NEXT.
4. Importazione nella NEXT solo dopo normalizzazione minima del dominio.
5. Il Dossier aggrega e rende leggibile; non diventa writer generalista.
6. La targa resta la chiave logica trasversale principale per tutto cio che e mezzo-centrico.
7. I moduli globali non vanno forzati nel Dossier solo per ragioni UI.
8. I dataset tmp, i fallback e i canali duplicati non possono diventare automaticamente canonici.
9. IA, PDF, alert, sicurezza e permessi sono capability trasversali: influenzano i domini, ma non sostituiscono i domini.

## 5. Indice domini canonici

| Codice | Dominio | Natura | Collocazione NEXT prevalente | Stato dominio |
|---|---|---|---|---|
| D01 | Anagrafiche flotta e persone | Fondativo | `Mezzi / Dossier` + supporto `Autisti` | ABBASTANZA STABILE |
| D02 | Operativita tecnica mezzo | Mezzo-centrico | `Operativita Globale` + `Mezzi / Dossier` | SENSIBILE |
| D03 | Autisti, sessioni ed eventi di campo | Cross-area critico | feed verso `Centro di Controllo` e `Mezzi / Dossier`, runtime autisti separato | BLOCCANTE PER IMPORTAZIONE |
| D04 | Rifornimenti e consumi | Mezzo-centrico con feed tmp | `Mezzi / Dossier` + `Centro di Controllo` + `Analisi` | SENSIBILE |
| D05 | Magazzino, inventario e movimenti materiali | Globale con derivazioni mezzo-centriche | `Operativita Globale` | BLOCCANTE PER IMPORTAZIONE |
| D06 | Procurement, ordini, preventivi e fornitori | Globale | `Operativita Globale` | SENSIBILE |
| D07 | Documentale IA, libretti e configurazione IA | Trasversale | `IA Gestionale` + `Mezzi / Dossier` + `Strumenti Trasversali` | DA VERIFICARE |
| D08 | Costi e analisi economica | Mezzo-centrico derivato | `Mezzi / Dossier` + futura area `Analisi` | SENSIBILE |
| D09 | Cisterna specialistica | Specialistico separato | `Operativita Globale` o area specialistica dedicata | DA VERIFICARE |
| D10 | Stato operativo, alert e promemoria | Supporto trasversale | `Centro di Controllo` | ABBASTANZA STABILE |

## 6. Nota di perimetro
Questo file e volutamente dominio-centrico.

NON copre ancora in modo esaustivo:
- tutti i campi di ogni entita;
- ogni shape storica o variante di payload;
- ogni dettaglio route-level o UI-level.

Quando un dominio lo richiedera, si potra aggiungere un approfondimento entity-level separato.

---

## D01. Anagrafiche flotta e persone

### Missione / scopo
Rappresentare le anagrafiche di base che permettono al gestionale di sapere:
- quali mezzi esistono;
- chi sono colleghi, autisti o persone selezionabili nei flussi;
- quale mezzo va aperto nel Dossier o usato come pivot di navigazione.

### Dataset fisici / chiavi / collection coinvolte
- `@mezzi_aziendali`
- `@colleghi`
- path Storage collegati al mezzo:
  - `mezzi_aziendali/<mezzoId>/libretto.jpg`

### Entita principali del dominio
- `Mezzo`
- `Collega / persona`
- `Assegnazione autista al mezzo` come informazione derivata o incorporata

### Writer principali
- `Mezzi`
- `IALibretto`
- `IACoperturaLibretti`
- `Colleghi`

### Reader principali
- `Home`
- `CentroControllo`
- `DossierLista`
- `DossierMezzo`
- `Mezzo360`
- `Lavori*`
- `Manutenzioni`
- `Autisti` (`SetupMezzo`, `Segnalazioni`, `GommeAutistaModal`)
- `AnalisiEconomica`

### Moduli legacy pivot
- `src/pages/Mezzi.tsx`
- `src/pages/DossierLista.tsx`
- `src/pages/IA/IALibretto.tsx`
- `src/pages/IA/IACoperturaLibretti.tsx`

### Collocazione prevista nella NEXT
- prevalenza in `Mezzi / Dossier`
- supporto strutturale per `Centro di Controllo`, `Operativita Globale` e area autisti separata

### Relazione con Dossier
- dominio fondativo del Dossier;
- senza anagrafica mezzo stabile non esiste Dossier leggibile o navigabile.

### Relazione con Centro di Controllo
- alimenta alert, priorita, filtri per targa e accessi rapidi ai record critici.

### Relazione con IA Gestionale futura
- sorgente primaria per:
  - matching targa;
  - contesto mezzo;
  - spiegabilita delle risposte IA su singolo mezzo.

### Incoerenze principali gia emerse
- `@mezzi_aziendali` ha merge custom dedicato in `storageSync.ts`: segnale di dominio molto sensibile.
- parte delle informazioni documento/libretto viene scritta sul mezzo stesso, non solo nel documentale IA.
- il confine tra anagrafica persona e ruolo autista operativo non e ancora formalizzato in un contratto permessi/account definitivo.

### Regole di normalizzazione consigliate
- mantenere `targa` come identificatore logico forte, normalizzato e confrontabile.
- mantenere `id` stabile lato mezzo; evitare deduplicazioni deboli solo su label testuali.
- separare il concetto di anagrafica persona da sessione live autista e da assegnazione operativa corrente.
- trattare i metadati di libretto come estensione documentale del mezzo, non come dominio separato.

### Stato dominio
- `ABBASTANZA STABILE`

### Note di rischio / migrazione
- importabile in NEXT in read-only solo se la normalizzazione targa/id resta invariata.
- evitare scritture NEXT finche non e chiarito il perimetro account/permessi e il legame persona-autista.

---

## D02. Operativita tecnica mezzo

### Missione / scopo
Governare lavori, manutenzioni e attivita tecniche che impattano il ciclo operativo del mezzo.

### Dataset fisici / chiavi / collection coinvolte
- `@lavori`
- `@manutenzioni`
- dataset collegati in relazione:
  - `@materialiconsegnati`
  - `@inventario`

### Entita principali del dominio
- `Lavoro`
- `Manutenzione`
- `Evento tecnico derivato da autisti`

### Writer principali
- `LavoriDaEseguire`
- `DettaglioLavoro`
- `Manutenzioni`
- `AutistiAdmin`
- `AutistiEventoModal`

### Reader principali
- `LavoriDaEseguire`
- `LavoriInAttesa`
- `LavoriEseguiti`
- `GestioneOperativa`
- `DossierMezzo`
- `Mezzo360`
- `GommeEconomiaSection`

### Moduli legacy pivot
- `src/pages/LavoriDaEseguire.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/components/AutistiEventoModal.tsx`

### Collocazione prevista nella NEXT
- vista globale di orchestrazione in `Operativita Globale`
- dettaglio e storico mezzo in `Mezzi / Dossier`

### Relazione con Dossier
- forte convergenza quando esiste `targa`;
- il Dossier deve leggere backlog, eseguiti, manutenzioni e storico tecnico del mezzo.

### Relazione con Centro di Controllo
- alimenta priorita, backlog, scadenze tecniche e record da prendere in carico.

### Relazione con IA Gestionale futura
- dominio ad alto valore per:
  - suggerimenti operativi;
  - evidenza anomalie;
  - lettura del backlog;
  - spiegazioni su stato mezzo.

### Incoerenze principali gia emerse
- origini multiple del lavoro:
  - inserimento admin diretto;
  - conversione da flussi autisti.
- collegamento canonico tra lavoro, materiali e costo finale non ancora chiuso.
- dettaglio lavori e route legacy restano frammentati.

### Regole di normalizzazione consigliate
- ogni record tecnico mezzo-centrico deve avere `targa` normalizzata.
- ogni record derivato da evento autista deve conservare `source.type`, `source.id` e dataset origine.
- separare backlog operativo globale da lettura mezzo-centrica nel Dossier.
- evitare che il Dossier diventi writer dei lavori o delle manutenzioni.

### Stato dominio
- `SENSIBILE`

### Note di rischio / migrazione
- importabile in NEXT in read-only con cautela.
- scrittura NEXT da rinviare finche non e chiusa la relazione con materiali, costi e conversioni da autisti.

---

## D03. Autisti, sessioni ed eventi di campo

### Missione / scopo
Gestire la vita operativa dell'area autisti:
- sessioni attive;
- storico eventi;
- controlli;
- segnalazioni;
- richieste attrezzature;
- gomme;
- cambi mezzo e feed di presa in carico admin.

### Dataset fisici / chiavi / collection coinvolte
- `@autisti_sessione_attive`
- `@storico_eventi_operativi`
- `autisti_eventi`
- `@controlli_mezzo_autisti`
- `@segnalazioni_autisti_tmp`
- `@richieste_attrezzature_autisti_tmp`
- `@cambi_gomme_autisti_tmp`
- `@gomme_eventi`
- supporto locale:
  - `@autista_attivo_local`
  - `@mezzo_attivo_autista_local`
- path Storage:
  - `autisti/segnalazioni/...`
  - `autisti/richieste-attrezzature/...`

### Entita principali del dominio
- `Sessione autista live`
- `Evento operativo`
- `Controllo mezzo`
- `Segnalazione`
- `Richiesta attrezzature`
- `Evento gomme`
- `Cambio assetto / cambio mezzo`

### Writer principali
- `LoginAutista`
- `HomeAutista`
- `SetupMezzo`
- `CambioMezzoAutista`
- `Rifornimento` per il pezzo rifornimenti collegato
- `ControlloMezzo`
- `Segnalazioni`
- `RichiestaAttrezzature`
- `GommeAutistaModal`
- `AutistiAdmin` per rettifiche e passaggi a dataset ufficiali

### Reader principali
- `AutistiGate`
- `AutistiInboxHome`
- `AutistiAdmin`
- `AutistiLogAccessiAll`
- `AutistiControlliAll`
- `AutistiSegnalazioniAll`
- `AutistiGommeAll`
- `Home`
- `CentroControllo`
- `Autista360`
- `Mezzo360`
- `DossierMezzo`
- `homeEvents`

### Moduli legacy pivot
- `src/autisti/HomeAutista.tsx`
- `src/autisti/SetupMezzo.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`
- `src/utils/homeEvents.ts`

### Collocazione prevista nella NEXT
- il runtime autisti resta separato dalla shell admin;
- i suoi feed devono alimentare:
  - `Centro di Controllo`
  - `Mezzi / Dossier`
- una futura migrazione autonoma autisti dovra essere trattata come stream dedicato, non come "utente ridotto" del backoffice.

### Relazione con Dossier
- converge nel Dossier quando il record e collegabile a una targa.

### Relazione con Centro di Controllo
- relazione primaria:
  - eventi;
  - alert;
  - sessioni vive;
  - priorita di presa in carico.

### Relazione con IA Gestionale futura
- dominio cruciale per:
  - evidenza anomalie;
  - priorita operative;
  - sintesi giornaliera;
  - correlazioni con lavori/manutenzioni/rifornimenti.

### Incoerenze principali gia emerse
- doppia sorgente eventi:
  - `@storico_eventi_operativi`
  - `autisti_eventi`
- stati come `stato`, `letta`, `flagVerifica` non uniformi su tutti i feed tmp.
- coesistenza fra feed tmp, storico operativo e dataset ufficiali non sempre governata da un contratto unico.
- ruolo `AutistiAdmin` molto denso e fortemente accoppiato a piu domini.

### Regole di normalizzazione consigliate
- eleggere una sola sorgente canonica per lo storico eventi autisti.
- distinguere in modo netto:
  - sessione live;
  - storico eventi;
  - feed tmp da rettificare;
  - dataset ufficiali derivati.
- uniformare naming campi:
  - `badgeAutista`
  - `nomeAutista`
  - `targaMotrice`
  - `targaRimorchio`
  - `timestamp`
- ogni rettifica admin deve mantenere tracciabilita della sorgente iniziale.

### Stato dominio
- `BLOCCANTE PER IMPORTAZIONE`

### Note di rischio / migrazione
- non importare questo dominio nella NEXT come dominio "pulito" finche non e scelta la sorgente canonica eventi.
- ammissibile solo lettura parziale controllata per cockpit e Dossier, con marcature esplicite `DA VERIFICARE` dove necessario.

---

## D04. Rifornimenti e consumi

### Missione / scopo
Gestire i rifornimenti come flusso operativo, storico mezzo-centrico e sorgente economica/analitica.

### Dataset fisici / chiavi / collection coinvolte
- `@rifornimenti_autisti_tmp`
- `@rifornimenti`

### Entita principali del dominio
- `Rifornimento tmp`
- `Rifornimento canonico`
- `Evento consumo mezzo`

### Writer principali
- `Rifornimento`
- `AutistiAdmin`

### Reader principali
- `AutistiInboxHome`
- `AutistiAdmin`
- `Home`
- `CentroControllo`
- `DossierRifornimenti`
- `DossierMezzo`
- `Autista360`
- `Mezzo360`
- `RifornimentiEconomiaSection`
- `AnalisiEconomica`
- `homeEvents`

### Moduli legacy pivot
- `src/autisti/Rifornimento.tsx`
- `src/autistiInbox/AutistiAdmin.tsx`
- `src/pages/DossierRifornimenti.tsx`

### Collocazione prevista nella NEXT
- dominio primario di `Mezzi / Dossier`
- dominio secondario di `Centro di Controllo`
- input importante per futura area `Analisi`

### Relazione con Dossier
- convergenza primaria per targa.

### Relazione con Centro di Controllo
- usato come feed operativo, evento giornaliero e possibile anomalia.

### Relazione con IA Gestionale futura
- dominio ad alto valore per:
  - anomalie di consumo;
  - confronto periodi;
  - suggerimenti su mezzi critici;
  - spiegazioni economiche.

### Incoerenze principali gia emerse
- convivenza tmp/canonico con ruoli non chiusi in tutti i reader legacy.
- `@rifornimenti` letto in forme diverse:
  - array;
  - oggetto con `items`;
  - oggetto con `value.items`.
- campi targa non uniformi:
  - `targa`
  - `targaCamion`
  - `targaMotrice`
  - `mezzoTarga`
- campo temporale non uniforme:
  - `data`
  - `timestamp`
- campo economico non uniforme:
  - `importo`
  - `costo`

### Situazione attuale reale verificata nel repo
- `src/autisti/Rifornimento.tsx` salva prima il record operativo in `@rifornimenti_autisti_tmp` e poi riallinea `@rifornimenti`.
- `src/autistiInbox/AutistiAdmin.tsx` rettifica e cancella sia il feed tmp sia il dataset dossier, leggendo `@rifornimenti` in shape `items` oppure `value.items`.
- `src/pages/DossierMezzo.tsx` continua a leggere `@rifornimenti_autisti_tmp`, non il dataset canonico.
- `src/pages/RifornimentiEconomiaSection.tsx` legge sia `@rifornimenti` sia `@rifornimenti_autisti_tmp` e ricostruisce `km` con merge euristico per prossimita temporale o stessa giornata.
- `@rifornimenti` oggi non e ancora autosufficiente come sorgente business perche alcuni reader recuperano ancora informazioni mancanti dal tmp.

### Modello target canonico [TARGET]
- sorgente business target read-only: `storage/@rifornimenti`.
- ruolo di `@rifornimenti_autisti_tmp`: staging operativo di intake; non sorgente business per Dossier, consumi o NEXT.
- shape target di `@rifornimenti`: oggetto root unico con sola lista `items: RifornimentoCanonico[]`.
- chiave mezzo canonica: `mezzoTarga`.
- alias legacy ammessi solo in intake/mapping:
  - `targa`
  - `targaCamion`
  - `targaMotrice`
- campo temporale canonico target: `timestamp` numerico; eventuali etichette data restano derivate UI.
- campo economico canonico target: `costo`; `importo` resta alias di intake da normalizzare.
- ogni record canonico deve esporre almeno:
  - `id`
  - `mezzoTarga`
  - `timestamp`
  - `litri`
  - `km`
  - `costo`
  - `source.dataset`
  - `source.recordId`
  - `source.channel`
  - `validation.status`
  - `validation.updatedAt`
- campi di contesto ammessi nel canonico, se gia affidabili:
  - `tipo`
  - `distributore`
  - `autistaId`
  - `autistaNome`
  - `badgeAutista`
  - `note`

### Regola di transizione tmp -> canonico
- `@rifornimenti_autisti_tmp` conserva il payload di ingresso e puo restare incompleto o sporco.
- un record diventa business-canonico solo quando esiste in `@rifornimenti.items` con shape target unificata.
- `Dossier`, `Analisi`, `Centro di Controllo` e futura NEXT devono leggere i rifornimenti business solo da `@rifornimenti`.
- il tmp puo restare leggibile solo in strumenti di intake/staging e deve essere marcato come tale.
- il reader della NEXT non deve fare merge tra tmp e canonico per recuperare `km`, `costo` o altri campi business.
- se un record canonico non ha `km` o altri campi critici, il valore resta `null` e il record va marcato `validation.status = da_verificare`, invece di essere completato per inferenza reader-side.
- `validation.status` target minimo raccomandato:
  - `validato`
  - `rettificato_admin`
  - `da_verificare`

### Regole di normalizzazione consigliate
- per la NEXT il dominio D04 va letto solo da `@rifornimenti`, mai dal `tmp`.
- `mezzoTarga` e l'unico aggancio mezzo-centrico ammesso lato business.
- `timestamp`, `litri`, `km` e `costo` devono essere semanticamente univoci nel canonico.
- shape multiple (`[]`, `items`, `value.items`) e alias legacy vanno chiusi nel writer/normalizer, non compensati nel reader.
- `source` e `validation` sono parte del contratto canonico, non metadati opzionali di comodo.

### Stato dominio
- `SENSIBILE`

### Note di rischio / migrazione
- il dominio e sbloccato sul piano architetturale, ma non su quello runtime: esiste ora un target canonico chiaro, non ancora applicato in tutti i reader/writer legacy.
- un futuro reader NEXT read-only e ammissibile solo se legge esclusivamente `@rifornimenti.items`, dichiara la provenienza canonica e non usa fallback silenziosi sul tmp.
- finche la legacy continua a fare merge euristici, la NEXT non deve replicare quel comportamento.

---

## D05. Magazzino, inventario e movimenti materiali

### Missione / scopo
Gestire stock, movimenti, consegne e attrezzature, distinguendo cio che resta globale da cio che deriva verso il mezzo.

### Dataset fisici / chiavi / collection coinvolte
- `@inventario`
- `@materialiconsegnati`
- `@attrezzature_cantieri`
- path Storage:
  - `inventario/<itemId>/foto.jpg`
  - `materiali/<materialId>-<timestamp>.<ext>`

### Entita principali del dominio
- `Item inventario`
- `Movimento materiale`
- `Materiale consegnato`
- `Attrezzatura cantiere`

### Writer principali
- `Inventario`
- `Acquisti`
- `DettaglioOrdine`
- `MaterialiConsegnati`
- `Manutenzioni`
- `IADocumenti`
- `AttrezzatureCantieri`

### Reader principali
- `GestioneOperativa`
- `Inventario`
- `Acquisti`
- `DettaglioOrdine`
- `MaterialiConsegnati`
- `Manutenzioni`
- `DossierMezzo`
- `Mezzo360`
- `IADocumenti`

### Moduli legacy pivot
- `src/pages/Inventario.tsx`
- `src/pages/MaterialiConsegnati.tsx`
- `src/pages/Manutenzioni.tsx`
- `src/pages/AttrezzatureCantieri.tsx`

### Collocazione prevista nella NEXT
- prevalenza in `Operativita Globale`
- con viste derivate nel Dossier solo quando esiste collegamento a targa

### Relazione con Dossier
- solo derivata:
  - consegne materiali legate a targa;
  - consumi durante manutenzione di un mezzo.

### Relazione con Centro di Controllo
- non feed primario, ma rilevante per:
  - carenze stock;
  - blocchi operativi;
  - materiali mancanti.

### Relazione con IA Gestionale futura
- dominio utile per:
  - suggerire approvvigionamenti;
  - rilevare anomalie stock;
  - interpretare documenti magazzino;
  - collegare costi materiali al mezzo o al cantiere.

### Incoerenze principali gia emerse
- `@inventario` ha writer multipli.
- collegamento fra stock, consegna, manutenzione e import IA non e transazionale.
- il confine tra stock globale, uscita materiali e allocazione al mezzo non e ancora completamente formalizzato.

### Regole di normalizzazione consigliate
- distinguere sempre:
  - stock corrente;
  - movimento;
  - consegna/allocazione;
  - attrezzatura separata.
- ogni decremento stock deve avere riferimento causale (`refId`, ordine, manutenzione o import documentale).
- evitare che piu moduli scrivano stock senza una precedenza o una logica di recovery.
- non trattare il Dossier come sorgente di scrittura per il magazzino.

### Stato dominio
- `BLOCCANTE PER IMPORTAZIONE`

### Note di rischio / migrazione
- dominio troppo sensibile per import scrivente nella NEXT.
- anche il read-only va progettato con attenzione, perche il dato letto puo non distinguere bene tra stock e movimento.

---

## D06. Procurement, ordini, preventivi e fornitori

### Missione / scopo
Governare il flusso di acquisto:
- fabbisogno;
- ordini;
- arrivi;
- preventivi;
- listino;
- anagrafica fornitori;
- approvazioni economiche collegate.

### Dataset fisici / chiavi / collection coinvolte
- `@ordini`
- `@preventivi`
- `@listino_prezzi`
- `@fornitori`
- `@preventivi_approvazioni`
- path Storage:
  - `preventivi/ia/...`
  - `preventivi/<id>.pdf`
  - `materiali/...` per foto materiali ordine

### Entita principali del dominio
- `Ordine`
- `Materiale ordine`
- `Preventivo`
- `Voce listino`
- `Fornitore`
- `Approvazione preventivo`

### Writer principali
- `Acquisti`
- `MaterialiDaOrdinare`
- `DettaglioOrdine`
- `Fornitori`
- `CapoCostiMezzo` per il pezzo approvazioni

### Reader principali
- `Acquisti`
- `OrdiniInAttesa`
- `OrdiniArrivati`
- `Inventario`
- `MaterialiDaOrdinare`
- `CapoCostiMezzo`

### Moduli legacy pivot
- `src/pages/Acquisti.tsx`
- `src/pages/DettaglioOrdine.tsx`
- `src/pages/Fornitori.tsx`

### Collocazione prevista nella NEXT
- prevalenza in `Operativita Globale`
- sezione esplicita futura `Acquisti & Magazzino`

### Relazione con Dossier
- indiretta:
  - quando un costo o un materiale si collega poi a un mezzo;
  - quando un preventivo entra nel dominio costi/documenti del mezzo.

### Relazione con Centro di Controllo
- rilevante per:
  - ordini in attesa;
  - arrivi bloccati;
  - backlog forniture;
  - criticita procurement.

### Relazione con IA Gestionale futura
- dominio utile per:
  - lettura preventivi;
  - suggerimento approvvigionamenti;
  - confronto storico fornitori;
  - PDF/report assistiti.

### Incoerenze principali gia emerse
- contratto allegati preventivi non canonico.
- route ordine duplicate:
  - `/acquisti/dettaglio/:ordineId`
  - `/dettaglio-ordine/:ordineId`
- `Acquisti.tsx` e un modulo molto denso che miscela sottodomini distinti.
- mapping articoli listino e naming fornitori non ancora pienamente normalizzati.

### Regole di normalizzazione consigliate
- separare chiaramente:
  - fabbisogno;
  - ordine;
  - arrivo;
  - preventivo;
  - listino;
  - anagrafica fornitore.
- introdurre un contratto unico allegati preventivi con `sourceType` e resolver path unico.
- usare un identificatore stabile fornitore, non solo il nome libero.
- mantenere l'ordine come dominio globale, non mezzo-centrico per default.

### Stato dominio
- `SENSIBILE`

### Note di rischio / migrazione
- importabile in NEXT in read-only per liste e stati, ma la parte allegati preventivi resta punto sensibile.
- scrittura NEXT da bloccare finche non si chiude il contratto allegati e il confine con inventario/listino.

---

## D07. Documentale IA, libretti e configurazione IA

### Missione / scopo
Gestire documenti analizzati da IA, libretti/foto mezzo e configurazione IA usata dai moduli documentali.

### Dataset fisici / chiavi / collection coinvolte
- `@documenti_mezzi`
- `@documenti_magazzino`
- `@documenti_generici`
- `@impostazioni_app/gemini`
- path Storage:
  - `documenti_pdf/...`
  - `mezzi_aziendali/<mezzoId>/libretto.jpg`

### Entita principali del dominio
- `Documento IA mezzo`
- `Documento IA magazzino`
- `Documento IA generico`
- `Libretto / copertura libretto`
- `Configurazione IA`

### Writer principali
- `IADocumenti`
- `IALibretto`
- `IACoperturaLibretti`
- `IAApiKey`

### Reader principali
- `DossierMezzo`
- `Mezzo360`
- `AnalisiEconomica`
- `CapoCostiMezzo`
- `CapoMezzi`
- `LibrettiExport`
- moduli IA stessi

### Moduli legacy pivot
- `src/pages/IA/IADocumenti.tsx`
- `src/pages/IA/IALibretto.tsx`
- `src/pages/IA/IACoperturaLibretti.tsx`
- `src/pages/IA/IAApiKey.tsx`

### Collocazione prevista nella NEXT
- intake e governo in `IA Gestionale`
- lettura contestuale in `Mezzi / Dossier`
- aspetti tecnici e configurativi in `Strumenti Trasversali`

### Relazione con Dossier
- forte per i documenti mezzo-correlati e per libretti.

### Relazione con Centro di Controllo
- piu indiretta:
  - documenti mancanti;
  - scadenze;
  - anomalie documentali;
  - elementi da verificare.

### Relazione con IA Gestionale futura
- questo dominio e sia input sia oggetto della futura IA:
  - intake documenti;
  - lettura documenti;
  - spiegabilita della risposta;
  - suggerimenti operativi.

### Incoerenze principali gia emerse
- governance endpoint IA multipli non ancora consolidata.
- chiave Gemini lato client su Firestore: rischio sicurezza dichiarato.
- documento mezzo, documento magazzino e documento generico convivono ma richiedono filtri robusti.
- path legacy documentali e canale libretto reale ancora sensibili.

### Regole di normalizzazione consigliate
- mantenere sempre provenienza:
  - `sourceKey`
  - `sourceDocId`
  - `sourceType` dove rilevante
- distinguere chiaramente:
  - archivio documentale;
  - file sorgente in Storage;
  - metadati IA estratti;
  - configurazione IA.
- non esporre in NEXT scrivente la configurazione IA finche il tema segreti non e chiuso.
- separare il canale documentale business dall'audit tecnico su repo/docs/dati.

### Stato dominio
- `DA VERIFICARE`

### Note di rischio / migrazione
- importabile in NEXT solo in lettura molto controllata.
- la parte config/segreti e bloccata da considerazioni sicurezza, anche se il dominio documentale resta business-critical.

---

## D08. Costi e analisi economica

### Missione / scopo
Rendere leggibili costi, preventivi, fatture e sintesi economiche del mezzo o della flotta.

### Dataset fisici / chiavi / collection coinvolte
- `@costiMezzo`
- `@analisi_economica_mezzi`
- documenti collegati in lettura:
  - `@documenti_mezzi`
  - `@documenti_magazzino`
  - `@documenti_generici`
- dati collegati:
  - `@rifornimenti`
  - `@manutenzioni`

### Entita principali del dominio
- `Costo mezzo`
- `Documento costo` (preventivo/fattura letti da documentale IA)
- `Snapshot analisi economica`
- `Approvazione / lettura costi capo`

### Writer principali
- moduli costi/analisi legacy
- `AnalisiEconomica` per snapshot IA
- `CapoCostiMezzo` per approvazioni correlate

### Reader principali
- `AnalisiEconomica`
- `CapoCostiMezzo`
- `CapoMezzi`
- `DossierMezzo`
- `CentroControllo` in forma sintetica

### Moduli legacy pivot
- `src/pages/AnalisiEconomica.tsx`
- `src/pages/CapoCostiMezzo.tsx`
- `src/pages/CapoMezzi.tsx`

### Collocazione prevista nella NEXT
- lettura principale in `Mezzi / Dossier`
- futura vista dedicata in area `Analisi`
- segnali sintetici in `Centro di Controllo`

### Relazione con Dossier
- molto forte: il Dossier deve spiegare costi, documenti e trend del singolo mezzo.

### Relazione con Centro di Controllo
- rilevante solo in forma sintetica:
  - anomalie;
  - scostamenti;
  - mezzi critici;
  - priorita economiche.

### Relazione con IA Gestionale futura
- dominio ad altissimo valore per:
  - riassunti spiegabili;
  - confronto periodi;
  - anomalie;
  - report assistiti;
  - PDF intelligenti.

### Incoerenze principali gia emerse
- dominio fortemente derivato da piu sorgenti.
- confine non ancora perfettamente chiuso tra:
  - costo operativo;
  - documento IA;
  - preventivo/fattura;
  - snapshot analitico.
- governance endpoint analisi IA e documentale non ancora completamente consolidata.

### Regole di normalizzazione consigliate
- distinguere sempre dato sorgente da dato derivato.
- ogni costo aggregato deve poter risalire alla sua sorgente.
- il Dossier mostra e aggrega; non deve diventare writer dei costi.
- esplicitare valuta, periodo e provenienza del documento o del costo.

### Stato dominio
- `SENSIBILE`

### Note di rischio / migrazione
- importabile in NEXT in read-only se la UI dichiara chiaramente la provenienza del dato.
- scrittura o approvazioni NEXT da rinviare finche non e stabilizzato il confine con documentale IA e preventivi.

---

## D09. Cisterna specialistica

### Missione / scopo
Gestire il dominio specialistico cisterna come sottosistema separato ma integrato con alcune anagrafiche e feed operativi.

### Dataset fisici / chiavi / collection coinvolte
- `@documenti_cisterna`
- `@cisterna_schede_ia`
- `@cisterna_parametri_mensili`
- riuso di:
  - `@rifornimenti_autisti_tmp`
  - `@mezzi_aziendali`
  - `@colleghi`
- path Storage:
  - `documenti_pdf/cisterna/...`
  - `documenti_pdf/cisterna_schede/...`

### Entita principali del dominio
- `Documento cisterna`
- `Scheda cisterna estratta`
- `Parametro mensile cisterna`
- `Evento autista cisterna derivato`

### Writer principali
- `CisternaCaravateIA`
- `CisternaSchedeTest`
- `CisternaCaravatePage`

### Reader principali
- `CisternaCaravatePage`
- `CisternaSchedeTest`
- funzioni helper in `src/cisterna/collections.ts`

### Moduli legacy pivot
- `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`
- `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`

### Collocazione prevista nella NEXT
- dominio specialistico da non mescolare con il Dossier standard.
- puo vivere in `Operativita Globale` come area specialistica dedicata o restare separato finche non viene progettato meglio.

### Relazione con Dossier
- limitata o indiretta;
- non e un sottodominio standard del Dossier Mezzo.

### Relazione con Centro di Controllo
- eventuale relazione solo per alert specialistici o dati sintetici.

### Relazione con IA Gestionale futura
- dominio con forte uso IA specialistico, ma separato dalla IA business generalista.

### Incoerenze principali gia emerse
- dipendenza da pipeline specialistiche proprie.
- perimetro funzionale separato dal resto del gestionale e non ancora pienamente riallineato alla shell target.
- riuso di feed autisti/rifornimenti da presidiare.

### Regole di normalizzazione consigliate
- mantenere il dominio cisterna separato dai domini standard finche non esiste una convergenza progettata.
- esplicitare sempre i punti di contatto con anagrafiche mezzi, colleghi e rifornimenti.
- evitare di trascinare in NEXT questo dominio come "semplice pagina in piu" senza definire prima il suo perimetro.

### Stato dominio
- `DA VERIFICARE`

### Note di rischio / migrazione
- non prioritario per i primi import NEXT.
- da trattare come dominio specialistico separato, non come variante leggera di documentale IA o rifornimenti.

---

## D10. Stato operativo, alert e promemoria

### Missione / scopo
Gestire priorita giornaliere, promemoria e stato di alert che permettono alla Home legacy e al futuro Centro di Controllo di evidenziare i record critici.

### Dataset fisici / chiavi / collection coinvolte
- `@alerts_state`
- feed in lettura collegati:
  - `@storico_eventi_operativi`
  - `@autisti_sessione_attive`
  - `@segnalazioni_autisti_tmp`
  - `@controlli_mezzo_autisti`
  - `@mezzi_aziendali`

### Entita principali del dominio
- `Alert state`
- `Promemoria operativo`
- `Priorita giorno`

### Writer principali
- `Home`

### Reader principali
- `Home`
- `CentroControllo` in forma di pattern target/documentale

### Moduli legacy pivot
- `src/pages/Home.tsx`
- `src/utils/homeEvents.ts`

### Collocazione prevista nella NEXT
- `Centro di Controllo`

### Relazione con Dossier
- indiretta:
  - l'alert puo portare al Dossier, ma non vive nel Dossier come dominio primario.

### Relazione con Centro di Controllo
- dominio nativo del cockpit.

### Relazione con IA Gestionale futura
- importante come superficie di sintesi, ma non come dominio sorgente unico.

### Incoerenze principali gia emerse
- il modello completo scadenze/promemoria cross-modulo non e ancora formalizzato come capability unica.
- l'alert state oggi e soprattutto stato persistito lato client/business UI.

### Regole di normalizzazione consigliate
- trattare `@alerts_state` come dominio di supporto e non come archivio business primario.
- ogni alert dovrebbe puntare a un'entita navigabile reale.
- distinguere alert generato, alert letto e record sorgente.

### Stato dominio
- `ABBASTANZA STABILE`

### Note di rischio / migrazione
- importabile in NEXT solo come supporto al cockpit.
- non deve essere confuso con il contratto dati canonico dei domini sorgente.

---

## 7. Relazioni cross-dominio da preservare
1. `Mezzo / targa` e il pivot trasversale principale.
2. `Autista / badge` collega area campo, sessioni live, eventi e rettifiche admin.
3. `Fornitore` collega procurement, documenti e costi.
4. `Ordine / preventivo / documento` formano una catena ma non sono la stessa entita.
5. `Documento IA` puo essere sorgente di lettura o import operativo, ma non va confuso con il dato operativo gia normalizzato.
6. `Inventario` e `MaterialiConsegnati` non sono la stessa cosa.
7. `Eventi autisti` e `Storico ufficiale` non sono ancora definitivamente la stessa sorgente.

## 8. Regole di normalizzazione globali da usare da ora in avanti
1. Ogni nuova analisi o patch deve partire dal dominio e non dalla key.
2. Ogni dataset fisico deve appartenere a un dominio canonico dichiarato.
3. Un dataset tmp non puo essere promosso a canonico senza regola esplicita.
4. Le forme `[]`, `{items:[]}` e `{value:[]}` non possono convivere senza motivazione e reader compatibile dichiarato.
5. Ogni record mezzo-centrico deve esporre una targa normalizzata.
6. Ogni record derivato da altro record deve mantenere la provenienza.
7. La NEXT puo importare in priorita i domini:
   - `ABBASTANZA STABILE` in read-only controllato;
   - `SENSIBILE` solo dopo design reader chiaro;
   - `DA VERIFICARE` solo con marcature esplicite;
   - `BLOCCANTE PER IMPORTAZIONE` non vanno trattati come domini normali finche i blocchi non sono chiusi.
8. Il Dossier resta aggregatore mezzo-centrico.
9. I moduli globali restano globali anche se alcuni loro record finiscono nel Dossier.
10. IA, PDF e alert devono leggere i domini, non ridefinirli.

## 9. Priorita di importazione nella NEXT

### Priorita 1 - candidati a read-only controllato
- D01 Anagrafiche flotta e persone
- D10 Stato operativo, alert e promemoria

### Priorita 2 - candidati a read-only dopo chiarimenti mirati
- D02 Operativita tecnica mezzo
- D04 Rifornimenti e consumi
- D06 Procurement, ordini, preventivi e fornitori
- D08 Costi e analisi economica

### Priorita 3 - domini da tenere sotto osservazione prima di importi seri
- D07 Documentale IA, libretti e configurazione IA
- D09 Cisterna specialistica

### Priorita 4 - domini bloccati finche non si chiudono incoerenze strutturali
- D03 Autisti, sessioni ed eventi di campo
- D05 Magazzino, inventario e movimenti materiali

## 10. Punti aperti che bloccano la canonicalizzazione piena
1. Stream eventi autisti canonico definitivo.
2. Contratto allegati preventivi.
3. Allineamento runtime del contratto `tmp -> canonico` di `@rifornimenti` e rimozione dei merge euristici reader-side.
4. Coerenza writer/reader di `@inventario` e `@materialiconsegnati`.
5. Governance endpoint IA/PDF multipli.
6. Policy Firestore effettive e permission matrix end-to-end.

## 11. Rapporto con gli altri documenti dati
- `DOMINI_DATI_CANONICI.md`:
  - vista dominio-centrica;
  - decisione di collocazione e normalizzazione.
- `MAPPA_COMPLETA_DATI.md`:
  - vista fisica key/collection/path.
- `REGOLE_STRUTTURA_DATI.md`:
  - vista entity-level ad alto livello.
- `CENSIMENTO_DOMINI_DATI_STEP1.md`:
  - report preparatorio e fotografico;
  - NON piu documento principale dopo questo step.

## 12. Stato documento
- **STATO: CURRENT**
- **NUOVA BASE DOMINIO-CENTRICA PER LA NEXT: SI**
