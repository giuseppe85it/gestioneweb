# Decisione architetturale - Gestione Operativa come hub

## 1. Scopo decisionale
Usare il censimento moduli gia verificato per decidere quali famiglie devono entrare davvero dentro `Gestione Operativa` come hub padre principale e quali devono restare fuori, in `Home`, `Navigazione rapida` o nel proprio modulo padre.

## 2. Criterio usato
### Fatti verificati
- Le route e i runtime reali derivano da `src/App.tsx`.
- Le famiglie e i moduli confermati derivano da:
  - `docs/audit/ELENCO_COMPLETO_MODULI_GESTIONALE.md`
  - `docs/audit/MATRICE_COMPLETA_MODULI_GESTIONALE.md`
  - `docs/audit/BACKLOG_MODULI_DA_CLASSIFICARE.md`
  - `docs/audit/AUDIT_HOME_FLUSSI_MODULI_INGRESSI.md`

### Regola decisionale
`Gestione Operativa` deve diventare hub padre solo delle famiglie che hanno insieme queste caratteristiche:
- lavoro ripetitivo di coordinamento;
- continuita operativa giornaliera;
- moduli child chiaramente operativi e non solo di consultazione;
- bisogno di passare spesso dal parent ai child nello stesso contesto.

Restano fuori da `Gestione Operativa` le famiglie che sono:
- cockpit di priorita;
- anagrafiche o ricerca;
- analisi/costi;
- strumenti trasversali;
- verticali specialistici con hub proprio;
- supporti tecnici o alias.

## 3. Famiglie candidate
- Centro di controllo / Home / Dashboard
- Magazzino e materiali
- Acquisti / Ordini / Materiali da ordinare
- Manutenzioni
- Lavori
- Cisterna
- Dossier / Mezzi
- Autisti / Autisti Inbox / Admin
- IA / IA interna / IA Libretto / IA Documenti
- Anagrafiche
- Area capo / costi / analisi
- Supporti tecnici / alias

## 4. Schede di valutazione per famiglia

### FAMIGLIA: Centro di controllo / Home / Dashboard
Moduli inclusi:
- Home / Dashboard
- Centro di Controllo

Serve a:
- cockpit di urgenza, priorita e ripresa lavoro.

Perche deve stare o non stare in Gestione Operativa:
- non deve stare dentro `Gestione Operativa` perche il suo ruolo e trasversale e di controllo, non di esecuzione operativa per famiglia child.

Tipo: controllo

Ingresso principale consigliato:
- `Home / Dashboard`

Ingressi secondari consigliati:
- route diretta `Centro di Controllo`

Deve stare in Home? sì

Deve stare in Navigazione rapida? no

Deve stare in Gestione Operativa? no

Motivazione:
- Home e Centro di Controllo devono restare sopra i moduli operativi come layer di sintesi, alert e smistamento, non diventare child di un altro hub.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextHomePage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextCentroControlloParityPage.tsx`

### FAMIGLIA: Magazzino e materiali
Moduli inclusi:
- Inventario
- Materiali consegnati
- Attrezzature cantieri

Serve a:
- governare disponibilita materiali, movimenti e attrezzature di supporto all'operativita.

Perche deve stare o non stare in Gestione Operativa:
- deve stare in `Gestione Operativa` perche i suoi moduli sono child naturali di un hub operativo giornaliero e si usano in continuita con manutenzioni, lavori e approvvigionamenti.

Tipo: operativo

Ingresso principale consigliato:
- `Gestione Operativa`

Ingressi secondari consigliati:
- `Navigazione rapida`

Deve stare in Home? no

Deve stare in Navigazione rapida? sì

Deve stare in Gestione Operativa? sì

Motivazione:
- il parent operativo ha piu senso del singolo ingresso sparso in Home; la famiglia e operativa, ripetitiva e collegata al lavoro quotidiano.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `docs/audit/MATRICE_COMPLETA_MODULI_GESTIONALE.md`

### FAMIGLIA: Acquisti / Ordini / Materiali da ordinare
Moduli inclusi:
- Acquisti / Procurement
- Materiali da ordinare
- Ordini in attesa
- Ordini arrivati
- Dettaglio ordine

Serve a:
- gestire approvvigionamenti, ordini, arrivi, preventivi e listino.

Perche deve stare o non stare in Gestione Operativa:
- deve stare in `Gestione Operativa` come famiglia padre operativa, ma con visibilita diretta soprattutto del parent `Acquisti / Procurement`, non di tutti i child in Home.

Tipo: operativo

Ingresso principale consigliato:
- `Gestione Operativa`

Ingressi secondari consigliati:
- `Navigazione rapida`
- route diretta `Acquisti / Procurement`

Deve stare in Home? no

Deve stare in Navigazione rapida? sì

Deve stare in Gestione Operativa? sì

Motivazione:
- e una famiglia operativa vera, ma la Home non deve mostrare i suoi child; il parent deve essere raggiungibile da hub operativo e da scorciatoia secondaria.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextAcquistiPage.tsx`
- `src/next/NextProcurementStandalonePage.tsx`
- `src/next/NextMaterialiDaOrdinarePage.tsx`

### FAMIGLIA: Manutenzioni
Moduli inclusi:
- Manutenzioni

Serve a:
- pianificare, seguire e chiudere le attivita manutentive.

Perche deve stare o non stare in Gestione Operativa:
- deve stare in `Gestione Operativa` perche e una famiglia operativa quotidiana, strettamente legata a materiali, lavori e disponibilita mezzi.

Tipo: operativo

Ingresso principale consigliato:
- `Gestione Operativa`

Ingressi secondari consigliati:
- `Navigazione rapida`
- alert o richiami contestuali

Deve stare in Home? forse

Deve stare in Navigazione rapida? sì

Deve stare in Gestione Operativa? sì

Motivazione:
- in Home puo apparire solo per urgenze o scadenze, non come blocco navigazionale pieno; il parent corretto resta operativo.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextManutenzioniPage.tsx`
- `docs/audit/AUDIT_HOME_FLUSSI_MODULI_INGRESSI.md`

### FAMIGLIA: Lavori
Moduli inclusi:
- Lavori da eseguire
- Lavori in attesa
- Lavori eseguiti
- Dettaglio lavoro

Serve a:
- gestire backlog, esecuzione e storico lavori.

Perche deve stare o non stare in Gestione Operativa:
- deve stare in `Gestione Operativa` perche e una famiglia operativa pura, con child chiaramente coerenti e forte bisogno di coordinamento parent -> child.

Tipo: operativo

Ingresso principale consigliato:
- `Gestione Operativa`

Ingressi secondari consigliati:
- `Navigazione rapida`
- ingressi contestuali da Dossier o Autisti Admin

Deve stare in Home? no

Deve stare in Navigazione rapida? sì

Deve stare in Gestione Operativa? sì

Motivazione:
- e una famiglia di esecuzione, non di cockpit; deve vivere sotto l'hub operativo e non come gruppo autonomo in Home.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextLavoriDaEseguirePage.tsx`
- `src/next/NextLavoriInAttesaPage.tsx`
- `src/next/NextLavoriEseguitiPage.tsx`

### FAMIGLIA: Cisterna
Moduli inclusi:
- Cisterna
- Cisterna IA
- Cisterna Schede Test

Serve a:
- gestire un verticale specialistico del dominio carburante/cisterna.

Perche deve stare o non stare in Gestione Operativa:
- non deve stare in `Gestione Operativa` come famiglia padre perche ha un dominio specialistico, un hub proprio e frequenza piu selettiva rispetto all'operativita generale.

Tipo: operativo

Ingresso principale consigliato:
- `Cisterna`

Ingressi secondari consigliati:
- `Navigazione rapida`
- ricerca

Deve stare in Home? no

Deve stare in Navigazione rapida? sì

Deve stare in Gestione Operativa? no

Motivazione:
- e operativo ma non generalista; se entra come famiglia dentro `Gestione Operativa`, il hub operativo si allarga troppo e perde coerenza.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextCisternaPage.tsx`
- `docs/audit/ELENCO_COMPLETO_MODULI_GESTIONALE.md`

### FAMIGLIA: Dossier / Mezzi
Moduli inclusi:
- Mezzi
- Dossier lista
- Dossier mezzo
- Dossier gomme
- Dossier rifornimenti

Serve a:
- gestire ricerca e approfondimento mezzo-centrico.

Perche deve stare o non stare in Gestione Operativa:
- non deve stare in `Gestione Operativa` perche e una famiglia anagrafica e mezzo-centrica con hub proprio; `Gestione Operativa` puo collegarla, ma non deve inglobarla.

Tipo: anagrafica

Ingresso principale consigliato:
- `Mezzi` oppure `Dossier lista`

Ingressi secondari consigliati:
- `Navigazione rapida`
- ricerca per targa
- alert contestuali

Deve stare in Home? no

Deve stare in Navigazione rapida? sì

Deve stare in Gestione Operativa? no

Motivazione:
- la famiglia ruota intorno al singolo mezzo, non al coordinamento operativo generale.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextMezziPage.tsx`
- `src/next/NextDossierListaPage.tsx`
- `src/next/NextDossierMezzoPage.tsx`

### FAMIGLIA: Autisti / Autisti Inbox / Admin
Moduli inclusi:
- Autisti separato
- Autisti Inbox Home
- Cambio Mezzo Inbox
- Controlli Inbox
- Segnalazioni Inbox
- Log Accessi Inbox
- Richiesta Attrezzature Inbox
- Gomme Inbox
- Autisti Admin

Serve a:
- gestire il ciclo autista lato campo e la sua presa in carico lato admin.

Perche deve stare o non stare in Gestione Operativa:
- non deve stare come famiglia dentro `Gestione Operativa` perche ha un ecosistema proprio, event-driven e gia parentato da `Autisti Inbox` e `Autisti Admin`; puo essere raggiunta da Home e Navigazione rapida come ingresso secondario.

Tipo: operativo

Ingresso principale consigliato:
- `Autisti Inbox Home` per l'area admin
- `Autisti Gate / Home Autista` per l'area autisti

Ingressi secondari consigliati:
- `Home` tramite `Alert` e `Stato operativo`
- `Navigazione rapida`

Deve stare in Home? forse

Deve stare in Navigazione rapida? sì

Deve stare in Gestione Operativa? no

Motivazione:
- in Home deve restare solo la sintesi delle urgenze; il lavoro pieno deve vivere nei suoi hub naturali.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextAutistiInboxHomePage.tsx`
- `src/next/NextAutistiAdminPage.tsx`
- `docs/audit/AUDIT_HOME_FLUSSI_MODULI_INGRESSI.md`

### FAMIGLIA: IA / IA interna / IA Libretto / IA Documenti
Moduli inclusi:
- IA hub
- IA API Key
- IA Libretto
- IA Documenti
- IA Copertura Libretti
- Libretti Export
- IA interna
- IA interna Sessioni
- IA interna Richieste
- IA interna Artifacts
- IA interna Audit

Serve a:
- offrire strumenti IA trasversali e specialistici.

Perche deve stare o non stare in Gestione Operativa:
- non deve stare in `Gestione Operativa` perche e una famiglia trasversale, non operativa in senso stretto; `IA interna` deve stare in Home come launcher, il resto nel proprio hub IA o in Navigazione rapida.

Tipo: trasversale

Ingresso principale consigliato:
- `IA interna` per l'assistenza trasversale
- `IA hub` per gli strumenti specialistici

Ingressi secondari consigliati:
- `Home` solo per launcher IA interna
- `Navigazione rapida`

Deve stare in Home? sì

Deve stare in Navigazione rapida? sì

Deve stare in Gestione Operativa? no

Motivazione:
- inglobare la IA dentro `Gestione Operativa` la renderebbe impropriamente una sotto-funzione operativa, mentre il codice la mostra come area trasversale e autonoma.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextIntelligenzaArtificialePage.tsx`
- `src/next/NextInternalAiPage.tsx`

### FAMIGLIA: Anagrafiche
Moduli inclusi:
- Colleghi
- Fornitori

Serve a:
- gestire anagrafiche persone e fornitori.

Perche deve stare o non stare in Gestione Operativa:
- non deve stare in `Gestione Operativa` come famiglia padre perche e anagrafica e di supporto, non esecutiva.

Tipo: anagrafica

Ingresso principale consigliato:
- modulo padre di anagrafica oppure menu dedicato

Ingressi secondari consigliati:
- `Navigazione rapida`

Deve stare in Home? no

Deve stare in Navigazione rapida? sì

Deve stare in Gestione Operativa? no

Motivazione:
- le anagrafiche devono restare raggiungibili, ma fuori dal parent operativo.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextColleghiPage.tsx`
- `src/next/NextFornitoriPage.tsx`

### FAMIGLIA: Area capo / costi / analisi
Moduli inclusi:
- Capo mezzi
- Capo costi mezzo
- Analisi economica

Serve a:
- supportare controllo, costi e analisi mezzo-centriche.

Perche deve stare o non stare in Gestione Operativa:
- non deve stare in `Gestione Operativa` perche e una famiglia di controllo/analisi, non di esecuzione operativa.

Tipo: analisi

Ingresso principale consigliato:
- `Capo mezzi`
- `Dossier mezzo` per i dettagli economici contestuali

Ingressi secondari consigliati:
- `Navigazione rapida`
- ricerca per targa

Deve stare in Home? no

Deve stare in Navigazione rapida? forse

Deve stare in Gestione Operativa? no

Motivazione:
- sono strumenti specialistici e meno frequenti; possono restare accessibili, ma non nel cuore del hub operativo.

Note prove/codice:
- `src/App.tsx`
- `src/next/NextCapoMezziPage.tsx`
- `src/next/NextCapoCostiMezzoPage.tsx`
- `src/next/NextAnalisiEconomicaPage.tsx`

### FAMIGLIA: Supporti tecnici / alias
Moduli inclusi:
- Shell NEXT
- Layout Autisti NEXT
- redirect alias e legacy
- fallback NEXT

Serve a:
- instradare, contenere o mantenere compatibilita tecnica.

Perche deve stare o non stare in Gestione Operativa:
- non deve stare in `Gestione Operativa` perche non e una famiglia utente.

Tipo: supporto

Ingresso principale consigliato:
- nessuno come modulo utente

Ingressi secondari consigliati:
- nessuno

Deve stare in Home? no

Deve stare in Navigazione rapida? no

Deve stare in Gestione Operativa? no

Motivazione:
- e perimetro tecnico, non destinazione funzionale utente.

Note prove/codice:
- `src/App.tsx`
- `docs/audit/BACKLOG_MODULI_DA_CLASSIFICARE.md`

## 5. Elenco finale

### Famiglie da mettere in Gestione Operativa
- Magazzino e materiali
- Acquisti / Ordini / Materiali da ordinare
- Manutenzioni
- Lavori

### Famiglie da lasciare fuori da Gestione Operativa
- Centro di controllo / Home / Dashboard
- Cisterna
- Dossier / Mezzi
- Autisti / Autisti Inbox / Admin
- IA / IA interna / IA Libretto / IA Documenti
- Anagrafiche
- Area capo / costi / analisi
- Supporti tecnici / alias

### Famiglie da lasciare in Home
- Centro di controllo / Home / Dashboard
- IA / IA interna / IA Libretto / IA Documenti solo nella forma di launcher `IA interna`
- Autisti / Autisti Inbox / Admin solo nella forma sintetica `Alert` + `Stato operativo`

### Famiglie da lasciare in Navigazione rapida
- Gestione Operativa come parent
- Dossier / Mezzi
- Autisti / Autisti Inbox / Admin
- IA / IA interna / IA Libretto / IA Documenti
- Anagrafiche
- Cisterna
- Area capo / costi / analisi

## 6. Conclusione sintetica e netta
`Gestione Operativa` deve diventare il hub padre solo delle famiglie operative giornaliere che hanno child naturali di esecuzione:
- materiali;
- procurement;
- manutenzioni;
- lavori.

Non deve invece assorbire:
- il cockpit Home/Controllo;
- la famiglia mezzo/dossier;
- il dominio autisti;
- la IA;
- le anagrafiche;
- l'area analisi/capo;
- i verticali specialistici come Cisterna.

Principio finale:
- `Home` = priorita, stato e launcher trasversali;
- `Gestione Operativa` = esecuzione operativa generalista;
- `Navigazione rapida` = scorciatoie secondarie verso famiglie fuori dal parent operativo;
- i moduli specialistici restano nel proprio hub o modulo padre.
