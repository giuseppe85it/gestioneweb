# Elenco completo moduli gestionale

## 1. Scopo audit
Questo audit censisce i moduli realmente presenti nel gestionale partendo dalle route reali di `src/App.tsx`.

Obiettivo:
- distinguere moduli madre, NEXT e presenti in entrambi;
- separare moduli utente, hub, dettagli e supporti tecnici;
- evidenziare equivalenze, alias e duplicazioni.

## 2. Metodo usato
- Fonte primaria: `src/App.tsx`.
- Verifica file runtime in `src/pages/*`, `src/next/*`, `src/autisti/*`, `src/autistiInbox/*`.
- Verifica documentale di contesto in:
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/product/STATO_MIGRAZIONE_NEXT.md`
  - `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  - `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
  - `docs/data/MAPPA_COMPLETA_DATI.md`
  - `docs/data/DOMINI_DATI_CANONICI.md`
  - `docs/data/REGOLE_STRUTTURA_DATI.md`
- Un modulo e `confermato` solo se route e file runtime sono dimostrabili nel repo.
- Un file non montato nelle route ufficiali non viene promosso a modulo utente confermato.

## 3. Elenco completo moduli per famiglie

### Home / Dashboard / Centro controllo
- Home / Dashboard
- Centro di Controllo

### Gestione Operativa / Lavori / Materiali
- Gestione Operativa
- Inventario
- Materiali consegnati
- Attrezzature cantieri
- Manutenzioni
- Acquisti / Procurement
- Materiali da ordinare
- Ordini in attesa
- Ordini arrivati
- Dettaglio ordine
- Lavori da eseguire
- Lavori in attesa
- Lavori eseguiti
- Dettaglio lavoro

### Mezzi / Dossier / Analisi
- Mezzi
- Dossier lista
- Dossier mezzo
- Dossier gomme
- Dossier rifornimenti
- Analisi economica
- Mezzo360
- Autista360

### Anagrafiche / Area capo
- Capo mezzi
- Capo costi mezzo
- Colleghi
- Fornitori

### IA / Documenti
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

### Cisterna
- Cisterna
- Cisterna IA
- Cisterna Schede Test

### Autisti separato
- Autisti Gate
- Login Autista
- Home Autista
- Setup Mezzo
- Cambio Mezzo Autista
- Rifornimento
- Controllo Mezzo
- Segnalazioni Autista
- Richiesta Attrezzature Autista

### Autisti Inbox / Admin
- Autisti Inbox Home
- Cambio Mezzo Inbox
- Controlli Inbox
- Segnalazioni Inbox
- Log Accessi Inbox
- Richiesta Attrezzature Inbox
- Gomme Inbox
- Autisti Admin

### Supporti tecnici di routing
- Shell NEXT
- Layout Autisti NEXT
- Redirect alias `/next/autista`
- Redirect legacy `operativita-globale`
- Redirect legacy `mezzi-dossier`
- Redirect legacy `dettagliolavori`
- Redirect legacy `ia-gestionale`
- Landing / fallback NEXT

## 4. Scheda breve di ogni modulo

### Home / Dashboard / Centro controllo
- `MODULO: Home / Dashboard` | `Tipo: principale` | `Perimetro: entrambi` | `Route: / ; /next` | `File runtime: src/pages/Home.tsx ; src/next/NextHomePage.tsx -> src/next/NextCentroControlloPage.tsx` | `Famiglia padre: Home / Dashboard / Centro controllo` | `Serve a: cockpit iniziale del gestionale` | `Ingressi principali: root app, landing NEXT` | `Moduli collegati: Alert, Stato operativo, Navigazione rapida, IA interna` | `Equivalente o duplicato di: Centro di Controllo per ruolo cockpit` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx, src/next/NextHomePage.tsx`
- `MODULO: Centro di Controllo` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /centro-controllo ; /next/centro-controllo` | `File runtime: src/pages/CentroControllo.tsx ; src/next/NextCentroControlloParityPage.tsx` | `Famiglia padre: Home / Dashboard / Centro controllo` | `Serve a: cabina di regia operativa` | `Ingressi principali: route diretta, Gestione Operativa, moduli autisti/admin` | `Moduli collegati: Home, Gestione Operativa, Autisti Inbox/Admin` | `Equivalente o duplicato di: Home / Dashboard per funzione cockpit` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`

### Gestione Operativa / Lavori / Materiali
- `MODULO: Gestione Operativa` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /gestione-operativa ; /next/gestione-operativa` | `File runtime: src/pages/GestioneOperativa.tsx ; src/next/NextGestioneOperativaPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: hub operativo globale` | `Ingressi principali: Home, quick links, route diretta` | `Moduli collegati: Inventario, Materiali consegnati, Manutenzioni, Centro di Controllo, Attrezzature cantieri` | `Equivalente o duplicato di: alias operativita-globale` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Inventario` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /inventario ; /next/inventario` | `File runtime: src/pages/Inventario.tsx ; src/next/NextInventarioPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: consultazione inventario materiali` | `Ingressi principali: Gestione Operativa` | `Moduli collegati: Materiali consegnati, Manutenzioni, Acquisti` | `Equivalente o duplicato di: child di area operativa` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Materiali consegnati` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /materiali-consegnati ; /next/materiali-consegnati` | `File runtime: src/pages/MaterialiConsegnati.tsx ; src/next/NextMaterialiConsegnatiPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: movimenti materiali consegnati` | `Ingressi principali: Gestione Operativa` | `Moduli collegati: Inventario, Dossier Mezzo, Acquisti` | `Equivalente o duplicato di: child procurement/materiali` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Attrezzature cantieri` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /attrezzature-cantieri ; /next/attrezzature-cantieri` | `File runtime: src/pages/AttrezzatureCantieri.tsx ; src/next/NextAttrezzatureCantieriPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: gestione attrezzature cantieri` | `Ingressi principali: Gestione Operativa` | `Moduli collegati: Gestione Operativa` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Manutenzioni` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /manutenzioni ; /next/manutenzioni` | `File runtime: src/pages/Manutenzioni.tsx ; src/next/NextManutenzioniPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: workspace manutentivo` | `Ingressi principali: route diretta, Gestione Operativa` | `Moduli collegati: Dossier Mezzo, Inventario, Centro di Controllo` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Acquisti / Procurement` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /acquisti ; /next/acquisti` | `File runtime: src/pages/Acquisti.tsx ; src/next/NextAcquistiPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: workspace ordini, arrivi, preventivi e listino` | `Ingressi principali: route diretta, quick links` | `Moduli collegati: Materiali da ordinare, Ordini in attesa, Ordini arrivati, Dettaglio ordine` | `Equivalente o duplicato di: parent del cluster procurement` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Materiali da ordinare` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /materiali-da-ordinare ; /next/materiali-da-ordinare` | `File runtime: src/pages/MaterialiDaOrdinare.tsx ; src/next/NextMaterialiDaOrdinarePage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: fabbisogni, ordini, arrivi e prezzi` | `Ingressi principali: Acquisti, route diretta` | `Moduli collegati: Ordini in attesa, Ordini arrivati` | `Equivalente o duplicato di: sottoarea di Procurement` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Ordini in attesa` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /ordini-in-attesa ; /next/ordini-in-attesa` | `File runtime: src/pages/OrdiniInAttesa.tsx ; src/next/NextOrdiniInAttesaPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: elenco ordini non arrivati` | `Ingressi principali: Acquisti, Materiali da ordinare` | `Moduli collegati: Dettaglio ordine, Ordini arrivati` | `Equivalente o duplicato di: child procurement` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Ordini arrivati` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /ordini-arrivati ; /next/ordini-arrivati` | `File runtime: src/pages/OrdiniArrivati.tsx ; src/next/NextOrdiniArrivatiPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: elenco ordini arrivati` | `Ingressi principali: Acquisti, Materiali da ordinare` | `Moduli collegati: Dettaglio ordine, Ordini in attesa` | `Equivalente o duplicato di: child procurement` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Dettaglio ordine` | `Tipo: dettaglio` | `Perimetro: entrambi` | `Route: /dettaglio-ordine/:ordineId ; /acquisti/dettaglio/:ordineId ; /next/dettaglio-ordine/:ordineId ; /next/acquisti/dettaglio/:ordineId` | `File runtime: src/pages/DettaglioOrdine.tsx ; src/pages/Acquisti.tsx ; src/next/NextDettaglioOrdinePage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: dettaglio singolo ordine` | `Ingressi principali: Acquisti, liste ordini` | `Moduli collegati: Acquisti / Procurement` | `Equivalente o duplicato di: doppio ingresso dettaglio` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Lavori da eseguire` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /lavori-da-eseguire ; /next/lavori-da-eseguire` | `File runtime: src/pages/LavoriDaEseguire.tsx ; src/next/NextLavoriDaEseguirePage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: elenco lavori aperti` | `Ingressi principali: route diretta, quick links` | `Moduli collegati: Dettaglio lavoro, Lavori in attesa, Lavori eseguiti` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Lavori in attesa` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /lavori-in-attesa ; /next/lavori-in-attesa` | `File runtime: src/pages/LavoriInAttesa.tsx ; src/next/NextLavoriInAttesaPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: elenco lavori in attesa` | `Ingressi principali: route diretta, quick links` | `Moduli collegati: Dettaglio lavoro, Lavori da eseguire` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Lavori eseguiti` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /lavori-eseguiti ; /next/lavori-eseguiti` | `File runtime: src/pages/LavoriEseguiti.tsx ; src/next/NextLavoriEseguitiPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: storico lavori chiusi` | `Ingressi principali: route diretta, quick links` | `Moduli collegati: Dettaglio lavoro` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Dettaglio lavoro` | `Tipo: dettaglio` | `Perimetro: entrambi` | `Route: /dettagliolavori ; /next/dettagliolavori/:lavoroId ; supporto /next/dettagliolavori` | `File runtime: src/pages/DettaglioLavoro.tsx ; src/next/NextDettaglioLavoroPage.tsx` | `Famiglia padre: Gestione Operativa / Lavori / Materiali` | `Serve a: dettaglio singolo lavoro` | `Ingressi principali: liste lavori, Autisti Admin` | `Moduli collegati: Lavori da eseguire, Lavori in attesa, Lavori eseguiti` | `Equivalente o duplicato di: route legacy query-based + path-based` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`

### Mezzi / Dossier / Analisi
- `MODULO: Mezzi` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /mezzi ; /next/mezzi` | `File runtime: src/pages/Mezzi.tsx ; src/next/NextMezziPage.tsx` | `Famiglia padre: Mezzi / Dossier / Analisi` | `Serve a: anagrafica flotta con accesso al dossier` | `Ingressi principali: route diretta, quick links` | `Moduli collegati: Dossier lista, Dossier mezzo, Capo mezzi` | `Equivalente o duplicato di: parent naturale del dossier` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Dossier lista` | `Tipo: hub` | `Perimetro: entrambi` | `Route: /dossiermezzi ; /next/dossiermezzi` | `File runtime: src/pages/DossierLista.tsx ; src/next/NextDossierListaPage.tsx` | `Famiglia padre: Mezzi / Dossier / Analisi` | `Serve a: elenco ingresso al dossier mezzi` | `Ingressi principali: route diretta, quick links` | `Moduli collegati: Dossier mezzo` | `Equivalente o duplicato di: vicino a Mezzi` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Dossier mezzo` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /dossiermezzi/:targa ; /dossier/:targa ; /next/dossiermezzi/:targa ; /next/dossier/:targa` | `File runtime: src/pages/DossierMezzo.tsx ; src/next/NextDossierMezzoPage.tsx` | `Famiglia padre: Mezzi / Dossier / Analisi` | `Serve a: vista composita completa del singolo mezzo` | `Ingressi principali: Mezzi, Dossier lista, alert` | `Moduli collegati: Dossier gomme, Dossier rifornimenti, Analisi economica, IA Libretto` | `Equivalente o duplicato di: doppio alias route` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Dossier gomme` | `Tipo: dettaglio` | `Perimetro: entrambi` | `Route: /dossier/:targa/gomme ; /next/dossier/:targa/gomme` | `File runtime: src/pages/DossierGomme.tsx ; src/next/NextDossierGommePage.tsx` | `Famiglia padre: Mezzi / Dossier / Analisi` | `Serve a: approfondimento gomme del mezzo` | `Ingressi principali: Dossier mezzo` | `Moduli collegati: Dossier mezzo` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Dossier rifornimenti` | `Tipo: dettaglio` | `Perimetro: entrambi` | `Route: /dossier/:targa/rifornimenti ; /next/dossier/:targa/rifornimenti` | `File runtime: src/pages/DossierRifornimenti.tsx ; src/next/NextDossierRifornimentiPage.tsx` | `Famiglia padre: Mezzi / Dossier / Analisi` | `Serve a: approfondimento rifornimenti del mezzo` | `Ingressi principali: Dossier mezzo` | `Moduli collegati: Dossier mezzo, Cisterna, Analisi economica` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Analisi economica` | `Tipo: dettaglio` | `Perimetro: entrambi` | `Route: /analisi-economica/:targa ; /next/analisi-economica/:targa` | `File runtime: src/pages/AnalisiEconomica.tsx ; src/next/NextAnalisiEconomicaPage.tsx` | `Famiglia padre: Mezzi / Dossier / Analisi` | `Serve a: analisi economica del singolo mezzo` | `Ingressi principali: Dossier mezzo` | `Moduli collegati: Dossier mezzo, Dossier rifornimenti, Capo costi mezzo` | `Equivalente o duplicato di: vicino a Capo costi mezzo` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Mezzo360` | `Tipo: dettaglio` | `Perimetro: madre` | `Route: /mezzo-360/:targa` | `File runtime: src/pages/Mezzo360.tsx` | `Famiglia padre: Mezzi / Dossier / Analisi` | `Serve a: vista legacy 360 del mezzo` | `Ingressi principali: madre legacy` | `Moduli collegati: Mezzi, Dossier` | `Equivalente o duplicato di: Dossier mezzo come equivalente moderno parziale` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Autista360` | `Tipo: dettaglio` | `Perimetro: madre` | `Route: /autista-360 ; /autista-360/:badge` | `File runtime: src/pages/Autista360.tsx` | `Famiglia padre: Mezzi / Dossier / Analisi` | `Serve a: vista legacy 360 dell'autista` | `Ingressi principali: madre legacy` | `Moduli collegati: Autisti, Inbox` | `Equivalente o duplicato di: nessuna controparte NEXT ufficiale 1:1` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`

### Anagrafiche / Area capo
- `MODULO: Capo mezzi` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /capo/mezzi ; /next/capo/mezzi` | `File runtime: src/pages/CapoMezzi.tsx ; src/next/NextCapoMezziPage.tsx` | `Famiglia padre: Anagrafiche / Area capo` | `Serve a: area capo mezzi` | `Ingressi principali: route diretta` | `Moduli collegati: Capo costi mezzo` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Capo costi mezzo` | `Tipo: dettaglio` | `Perimetro: entrambi` | `Route: /capo/costi/:targa ; /next/capo/costi/:targa` | `File runtime: src/pages/CapoCostiMezzo.tsx ; src/next/NextCapoCostiMezzoPage.tsx` | `Famiglia padre: Anagrafiche / Area capo` | `Serve a: vista costi del mezzo in area capo` | `Ingressi principali: Capo mezzi` | `Moduli collegati: Capo mezzi, Analisi economica` | `Equivalente o duplicato di: vicino a Analisi economica` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Colleghi` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /colleghi ; /next/colleghi` | `File runtime: src/pages/Colleghi.tsx ; src/next/NextColleghiPage.tsx` | `Famiglia padre: Anagrafiche / Area capo` | `Serve a: anagrafica colleghi/personale` | `Ingressi principali: route diretta, quick links` | `Moduli collegati: Autisti Admin, Autisti Inbox` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Fornitori` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /fornitori ; /next/fornitori` | `File runtime: src/pages/Fornitori.tsx ; src/next/NextFornitoriPage.tsx` | `Famiglia padre: Anagrafiche / Area capo` | `Serve a: anagrafica fornitori` | `Ingressi principali: route diretta, quick links` | `Moduli collegati: Materiali da ordinare, Acquisti` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`

### IA / Documenti
- `MODULO: IA hub` | `Tipo: hub` | `Perimetro: entrambi` | `Route: /ia ; /next/ia` | `File runtime: src/pages/IA/IAHome.tsx ; src/next/NextIntelligenzaArtificialePage.tsx` | `Famiglia padre: IA / Documenti` | `Serve a: menu principale delle superfici IA non interne` | `Ingressi principali: route diretta, quick links` | `Moduli collegati: IA API Key, IA Libretto, IA Documenti, IA Copertura Libretti, Libretti Export, Cisterna IA` | `Equivalente o duplicato di: alias /next/ia-gestionale` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: IA API Key` | `Tipo: supporto` | `Perimetro: entrambi` | `Route: /ia/apikey ; /next/ia/apikey` | `File runtime: src/pages/IA/IAApiKey.tsx ; src/next/NextIAApiKeyPage.tsx` | `Famiglia padre: IA / Documenti` | `Serve a: configurazione/API key IA` | `Ingressi principali: IA hub` | `Moduli collegati: IA Libretto, IA Documenti` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: IA Libretto` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /ia/libretto ; /next/ia/libretto` | `File runtime: src/pages/IA/IALibretto.tsx ; src/next/NextIALibrettoPage.tsx` | `Famiglia padre: IA / Documenti` | `Serve a: archivio/analyze/upload libretti` | `Ingressi principali: IA hub, Dossier mezzo` | `Moduli collegati: IA API Key, IA hub, Dossier mezzo` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: IA Documenti` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /ia/documenti ; /next/ia/documenti` | `File runtime: src/pages/IA/IADocumenti.tsx ; src/next/NextIADocumentiPage.tsx` | `Famiglia padre: IA / Documenti` | `Serve a: strumenti IA documentali` | `Ingressi principali: IA hub` | `Moduli collegati: IA hub, Libretti Export` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: IA Copertura Libretti` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /ia/copertura-libretti ; /next/ia/copertura-libretti` | `File runtime: src/pages/IA/IACoperturaLibretti.tsx ; src/next/NextIACoperturaLibrettiPage.tsx` | `Famiglia padre: IA / Documenti` | `Serve a: verifica copertura libretti` | `Ingressi principali: IA hub` | `Moduli collegati: IA Libretto, Libretti Export` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Libretti Export` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /libretti-export ; /next/libretti-export` | `File runtime: src/pages/LibrettiExport.tsx ; src/next/NextLibrettiExportPage.tsx` | `Famiglia padre: IA / Documenti` | `Serve a: export libretti` | `Ingressi principali: IA hub` | `Moduli collegati: IA Libretto, IA Copertura Libretti` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: IA interna` | `Tipo: hub` | `Perimetro: NEXT` | `Route: /next/ia/interna` | `File runtime: src/next/NextInternalAiPage.tsx` | `Famiglia padre: IA / Documenti` | `Serve a: workspace IA interno con chat e artifacts` | `Ingressi principali: launcher Home, route diretta` | `Moduli collegati: IA interna Sessioni, Richieste, Artifacts, Audit` | `Equivalente o duplicato di: nessuna controparte madre diretta` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: IA interna Sessioni` | `Tipo: sottomodulo` | `Perimetro: NEXT` | `Route: /next/ia/interna/sessioni` | `File runtime: src/next/NextInternalAiPage.tsx (sectionId=sessions)` | `Famiglia padre: IA / Documenti` | `Serve a: vista sessioni del sottosistema IA interna` | `Ingressi principali: IA interna` | `Moduli collegati: IA interna` | `Equivalente o duplicato di: nessuna controparte madre` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: IA interna Richieste` | `Tipo: sottomodulo` | `Perimetro: NEXT` | `Route: /next/ia/interna/richieste` | `File runtime: src/next/NextInternalAiPage.tsx (sectionId=requests)` | `Famiglia padre: IA / Documenti` | `Serve a: vista richieste del sottosistema IA interna` | `Ingressi principali: IA interna` | `Moduli collegati: IA interna` | `Equivalente o duplicato di: nessuna controparte madre` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: IA interna Artifacts` | `Tipo: sottomodulo` | `Perimetro: NEXT` | `Route: /next/ia/interna/artifacts` | `File runtime: src/next/NextInternalAiPage.tsx (sectionId=artifacts)` | `Famiglia padre: IA / Documenti` | `Serve a: vista artifacts del sottosistema IA interna` | `Ingressi principali: IA interna` | `Moduli collegati: IA interna` | `Equivalente o duplicato di: nessuna controparte madre` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: IA interna Audit` | `Tipo: sottomodulo` | `Perimetro: NEXT` | `Route: /next/ia/interna/audit` | `File runtime: src/next/NextInternalAiPage.tsx (sectionId=audit)` | `Famiglia padre: IA / Documenti` | `Serve a: vista audit del sottosistema IA interna` | `Ingressi principali: IA interna` | `Moduli collegati: IA interna` | `Equivalente o duplicato di: nessuna controparte madre` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`

### Cisterna
- `MODULO: Cisterna` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /cisterna ; /next/cisterna` | `File runtime: src/pages/CisternaCaravate/CisternaCaravatePage.tsx ; src/next/NextCisternaPage.tsx` | `Famiglia padre: Cisterna` | `Serve a: archivio/report/targhe del dominio cisterna` | `Ingressi principali: route diretta, quick links, IA hub` | `Moduli collegati: Cisterna IA, Cisterna Schede Test` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Cisterna IA` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /cisterna/ia ; /next/cisterna/ia` | `File runtime: src/pages/CisternaCaravate/CisternaCaravateIA.tsx ; src/next/NextCisternaIAPage.tsx` | `Famiglia padre: Cisterna` | `Serve a: verticale IA del dominio cisterna` | `Ingressi principali: Cisterna, IA hub` | `Moduli collegati: Cisterna` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Cisterna Schede Test` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /cisterna/schede-test ; /next/cisterna/schede-test` | `File runtime: src/pages/CisternaCaravate/CisternaSchedeTest.tsx ; src/next/NextCisternaSchedeTestPage.tsx` | `Famiglia padre: Cisterna` | `Serve a: pagine di test/schede del dominio cisterna` | `Ingressi principali: Cisterna` | `Moduli collegati: Cisterna` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`

### Autisti separato
- `MODULO: Autisti Gate` | `Tipo: hub` | `Perimetro: entrambi` | `Route: /autisti ; /next/autisti` | `File runtime: src/autisti/AutistiGate.tsx ; src/next/NextAutistiGatePage.tsx` | `Famiglia padre: Autisti separato` | `Serve a: ingresso al perimetro autisti` | `Ingressi principali: route diretta` | `Moduli collegati: Login Autista, Home Autista` | `Equivalente o duplicato di: alias /next/autista` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Login Autista` | `Tipo: supporto` | `Perimetro: entrambi` | `Route: /autisti/login ; /next/autisti/login` | `File runtime: src/autisti/LoginAutista.tsx ; src/next/NextAutistiLoginPage.tsx` | `Famiglia padre: Autisti separato` | `Serve a: login nel perimetro autisti` | `Ingressi principali: Autisti Gate` | `Moduli collegati: Home Autista` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Home Autista` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /autisti/home ; /next/autisti/home` | `File runtime: src/autisti/HomeAutista.tsx ; src/next/NextAutistiHomePage.tsx` | `Famiglia padre: Autisti separato` | `Serve a: home operativa dell'autista` | `Ingressi principali: login autista, route diretta` | `Moduli collegati: Setup, Cambio mezzo, Rifornimento, Controllo, Segnalazioni, Richiesta Attrezzature` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Setup Mezzo` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti/setup-mezzo ; /next/autisti/setup-mezzo` | `File runtime: src/autisti/SetupMezzo.tsx ; src/next/NextAutistiSetupMezzoPage.tsx` | `Famiglia padre: Autisti separato` | `Serve a: setup mezzo/rimorchio dell'autista` | `Ingressi principali: Home Autista` | `Moduli collegati: Cambio mezzo, Controllo` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Cambio Mezzo Autista` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti/cambio-mezzo ; /next/autisti/cambio-mezzo` | `File runtime: src/autisti/CambioMezzoAutista.tsx ; src/next/NextAutistiCambioMezzoPage.tsx` | `Famiglia padre: Autisti separato` | `Serve a: cambio mezzo lato autista` | `Ingressi principali: Home Autista` | `Moduli collegati: Setup Mezzo, Cambio Mezzo Inbox` | `Equivalente o duplicato di: relazione stretta con Cambio Mezzo Inbox` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Rifornimento` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti/rifornimento ; /next/autisti/rifornimento` | `File runtime: src/autisti/Rifornimento.tsx ; src/next/autisti/NextAutistiRifornimentoPage.tsx` | `Famiglia padre: Autisti separato` | `Serve a: inserimento rifornimento lato autista` | `Ingressi principali: Home Autista` | `Moduli collegati: Inbox eventi, Cisterna, Dossier rifornimenti` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Controllo Mezzo` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti/controllo ; /next/autisti/controllo` | `File runtime: src/autisti/ControlloMezzo.tsx ; src/next/NextAutistiControlloPage.tsx` | `Famiglia padre: Autisti separato` | `Serve a: controllo mezzo lato autista` | `Ingressi principali: Home Autista` | `Moduli collegati: Inbox controlli, Centro di Controllo` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Segnalazioni Autista` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti/segnalazioni ; /next/autisti/segnalazioni` | `File runtime: src/autisti/Segnalazioni.tsx ; src/next/autisti/NextAutistiSegnalazioniPage.tsx` | `Famiglia padre: Autisti separato` | `Serve a: invio segnalazioni lato autista` | `Ingressi principali: Home Autista` | `Moduli collegati: Inbox segnalazioni, Centro di Controllo` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Richiesta Attrezzature Autista` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti/richiesta-attrezzature ; /next/autisti/richiesta-attrezzature` | `File runtime: src/autisti/RichiestaAttrezzature.tsx ; src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx` | `Famiglia padre: Autisti separato` | `Serve a: invio richiesta attrezzature lato autista` | `Ingressi principali: Home Autista` | `Moduli collegati: Richiesta Attrezzature Inbox` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`

### Autisti Inbox / Admin
- `MODULO: Autisti Inbox Home` | `Tipo: hub` | `Perimetro: entrambi` | `Route: /autisti-inbox ; /next/autisti-inbox` | `File runtime: src/autistiInbox/AutistiInboxHome.tsx ; src/next/NextAutistiInboxHomePage.tsx` | `Famiglia padre: Autisti Inbox / Admin` | `Serve a: inbox amministrativa degli eventi autisti` | `Ingressi principali: route diretta, Home, Stato operativo` | `Moduli collegati: Cambio Mezzo Inbox, Controlli Inbox, Segnalazioni Inbox, Log Accessi Inbox, Richiesta Attrezzature Inbox, Gomme Inbox, Autisti Admin` | `Equivalente o duplicato di: vicino a Alert/Stato operativo per sintesi eventi` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Cambio Mezzo Inbox` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti-inbox/cambio-mezzo ; /next/autisti-inbox/cambio-mezzo` | `File runtime: src/autistiInbox/CambioMezzoInbox.tsx ; src/next/NextAutistiInboxCambioMezzoPage.tsx` | `Famiglia padre: Autisti Inbox / Admin` | `Serve a: gestione cambi mezzo lato admin` | `Ingressi principali: Autisti Inbox Home` | `Moduli collegati: Cambio Mezzo Autista` | `Equivalente o duplicato di: controparte admin di Cambio Mezzo Autista` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Controlli Inbox` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti-inbox/controlli ; /next/autisti-inbox/controlli` | `File runtime: src/autistiInbox/AutistiControlliAll.tsx ; src/next/NextAutistiInboxControlliPage.tsx` | `Famiglia padre: Autisti Inbox / Admin` | `Serve a: raccolta controlli mezzi inviati dagli autisti` | `Ingressi principali: Autisti Inbox Home` | `Moduli collegati: Controllo Mezzo, Autisti Admin` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Segnalazioni Inbox` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti-inbox/segnalazioni ; /next/autisti-inbox/segnalazioni` | `File runtime: src/autistiInbox/AutistiSegnalazioniAll.tsx ; src/next/NextAutistiInboxSegnalazioniPage.tsx` | `Famiglia padre: Autisti Inbox / Admin` | `Serve a: raccolta segnalazioni autisti lato admin` | `Ingressi principali: Autisti Inbox Home` | `Moduli collegati: Segnalazioni Autista, Autisti Admin` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Log Accessi Inbox` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti-inbox/log-accessi ; /next/autisti-inbox/log-accessi` | `File runtime: src/autistiInbox/AutistiLogAccessiAll.tsx ; src/next/NextAutistiInboxLogAccessiPage.tsx` | `Famiglia padre: Autisti Inbox / Admin` | `Serve a: consultazione log accessi autisti` | `Ingressi principali: Autisti Inbox Home` | `Moduli collegati: Autisti Inbox Home` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Richiesta Attrezzature Inbox` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti-inbox/richiesta-attrezzature ; /next/autisti-inbox/richiesta-attrezzature` | `File runtime: src/autistiInbox/RichiestaAttrezzatureAll.tsx ; src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx` | `Famiglia padre: Autisti Inbox / Admin` | `Serve a: raccolta richieste attrezzature lato admin` | `Ingressi principali: Autisti Inbox Home` | `Moduli collegati: Richiesta Attrezzature Autista, Autisti Admin` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Gomme Inbox` | `Tipo: sottomodulo` | `Perimetro: entrambi` | `Route: /autisti-inbox/gomme ; /next/autisti-inbox/gomme` | `File runtime: src/autistiInbox/AutistiGommeAll.tsx ; src/next/NextAutistiInboxGommePage.tsx` | `Famiglia padre: Autisti Inbox / Admin` | `Serve a: gestione eventi gomme autisti` | `Ingressi principali: Autisti Inbox Home` | `Moduli collegati: Dossier Gomme, Autisti Admin` | `Equivalente o duplicato di: nessuno` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Autisti Admin` | `Tipo: principale` | `Perimetro: entrambi` | `Route: /autisti-admin ; /next/autisti-admin` | `File runtime: src/autistiInbox/AutistiAdmin.tsx ; src/next/NextAutistiAdminPage.tsx` | `Famiglia padre: Autisti Inbox / Admin` | `Serve a: centro rettifica dati e amministrazione eventi autisti` | `Ingressi principali: route diretta, Autisti Inbox Home` | `Moduli collegati: tutte le sottopagine inbox e Dettaglio lavoro` | `Equivalente o duplicato di: Centro rettifica dati` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`

### Supporti tecnici di routing
- `MODULO: Shell NEXT` | `Tipo: supporto` | `Perimetro: NEXT` | `Route: wrapper /next/*` | `File runtime: src/next/NextShell.tsx` | `Famiglia padre: Supporti tecnici di routing` | `Serve a: contenitore shell del perimetro NEXT` | `Ingressi principali: tutte le route /next/*` | `Moduli collegati: tutti i moduli NEXT` | `Equivalente o duplicato di: nessun modulo utente` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Layout Autisti NEXT` | `Tipo: supporto` | `Perimetro: NEXT` | `Route: wrapper /next/autisti/*` | `File runtime: src/next/autisti/NextAutistiCloneLayout.tsx` | `Famiglia padre: Supporti tecnici di routing` | `Serve a: layout separato del dominio autisti NEXT` | `Ingressi principali: tutte le route /next/autisti/*` | `Moduli collegati: Autisti Gate e sottopagine autisti NEXT` | `Equivalente o duplicato di: nessun modulo utente` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Redirect alias /next/autista` | `Tipo: supporto` | `Perimetro: NEXT` | `Route: /next/autista` | `File runtime: Navigate inline in src/App.tsx` | `Famiglia padre: Supporti tecnici di routing` | `Serve a: alias tecnico verso /next/autisti` | `Ingressi principali: URL alias` | `Moduli collegati: Autisti Gate` | `Equivalente o duplicato di: Autisti Gate` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Redirect legacy operativita-globale` | `Tipo: supporto` | `Perimetro: NEXT` | `Route: /next/operativita-globale` | `File runtime: src/next/NextLegacyStructuralRedirects.tsx` | `Famiglia padre: Supporti tecnici di routing` | `Serve a: reindirizzare il vecchio naming di area` | `Ingressi principali: URL legacy` | `Moduli collegati: Gestione Operativa` | `Equivalente o duplicato di: Gestione Operativa` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Redirect legacy mezzi-dossier` | `Tipo: supporto` | `Perimetro: NEXT` | `Route: /next/mezzi-dossier ; /next/mezzi-dossier/:targa` | `File runtime: src/next/NextLegacyStructuralRedirects.tsx` | `Famiglia padre: Supporti tecnici di routing` | `Serve a: reindirizzare naming storico verso Mezzi/Dossier` | `Ingressi principali: URL legacy` | `Moduli collegati: Mezzi, Dossier mezzo` | `Equivalente o duplicato di: Mezzi e Dossier mezzo` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Redirect legacy dettagliolavori` | `Tipo: supporto` | `Perimetro: NEXT` | `Route: /next/dettagliolavori` | `File runtime: src/next/NextLegacyStructuralRedirects.tsx` | `Famiglia padre: Supporti tecnici di routing` | `Serve a: supportare il vecchio accesso al dettaglio lavoro` | `Ingressi principali: URL legacy` | `Moduli collegati: Dettaglio lavoro` | `Equivalente o duplicato di: Dettaglio lavoro` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Redirect legacy ia-gestionale` | `Tipo: supporto` | `Perimetro: NEXT` | `Route: /next/ia-gestionale` | `File runtime: redirect inline NextLegacyIaRedirect in src/App.tsx` | `Famiglia padre: Supporti tecnici di routing` | `Serve a: reindirizzare il vecchio naming verso /next/ia` | `Ingressi principali: URL legacy` | `Moduli collegati: IA hub` | `Equivalente o duplicato di: IA hub` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`
- `MODULO: Landing / fallback NEXT` | `Tipo: supporto` | `Perimetro: NEXT` | `Route: /next/* fallback` | `File runtime: src/next/NextRoleLandingRedirect.tsx` | `Famiglia padre: Supporti tecnici di routing` | `Serve a: instradare route NEXT non risolte verso la landing corretta` | `Ingressi principali: route NEXT non risolte` | `Moduli collegati: Home NEXT, area autisti NEXT` | `Equivalente o duplicato di: nessun modulo utente` | `Stato prova: confermato` | `Note prove/codice: src/App.tsx`

## 5. Moduli presenti solo in madre
- `Mezzo360`
- `Autista360`

## 6. Moduli presenti solo in NEXT
- `IA interna`
- `IA interna Sessioni`
- `IA interna Richieste`
- `IA interna Artifacts`
- `IA interna Audit`
- `Shell NEXT`
- `Layout Autisti NEXT`
- `Redirect alias /next/autista`
- `Redirect legacy operativita-globale`
- `Redirect legacy mezzi-dossier`
- `Redirect legacy dettagliolavori`
- `Redirect legacy ia-gestionale`
- `Landing / fallback NEXT`

## 7. Moduli presenti in entrambe
- tutte le famiglie operative, dossier, anagrafiche, IA non interna, cisterna, autisti e autisti inbox/admin censite sopra

## 8. Moduli equivalenti / duplicati
- `Home / Dashboard` e `Centro di Controllo` come coppia cockpit
- `Mezzi` e `Dossier lista` come ingressi molto vicini
- `Acquisti / Procurement` e `Materiali da ordinare` come parent + child vicini
- `Dettaglio ordine` con doppio ingresso
- `Dossier mezzo` con doppio alias route
- `Autisti Gate` e alias `/next/autista`
- `IA hub` e alias `/next/ia-gestionale`
- `Gestione Operativa` e alias `/next/operativita-globale`
- `Mezzi / Dossier` e alias `/next/mezzi-dossier`
- `Dettaglio lavoro` e alias `/next/dettagliolavori`
- `Mezzo360` e `Autista360` come moduli legacy senza route NEXT 1:1

## 9. Punti DA VERIFICARE
- `src/next/NextAccessDeniedPage.tsx` esiste ma non e montata in `src/App.tsx`.
- `src/next/NextAreaPage.tsx` esiste ma non e route ufficiale.
- `src/next/NextDriverExperiencePage.tsx` esiste ma non e route ufficiale.
- `src/next/NextMezziDossierPage.tsx` e `src/next/NextOperativitaGlobalePage.tsx` sono referenziate dall'orchestrator IA ma non montate nelle route ufficiali.
- `src/next/NextMotherPage.tsx` esiste nel repo ma non e route finale ufficiale nel censimento corrente.
- Decisione prodotto finale su `Home` vs `Centro di Controllo`.

## 10. Conclusione sintetica
Il repo espone 67 elementi censiti tra moduli utente, hub, dettagli e supporti di routing confermati da `src/App.tsx`.

Quadro sintetico:
- 2 moduli solo madre: `Mezzo360`, `Autista360`;
- 13 elementi solo NEXT: `IA interna` e i supporti di routing NEXT;
- il resto e presente in entrambe le app;
- i punti di ambiguita maggiori sono i doppi ingressi cockpit, alcuni alias storici e alcuni file NEXT presenti ma non montati come route ufficiali.
