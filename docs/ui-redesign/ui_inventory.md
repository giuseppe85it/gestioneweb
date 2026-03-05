# UI Inventory (As-Is)

Inventario pagine/route utile al redesign UI.
Fonte: `src/App.tsx` + componenti route + utility dati.

Legenda dipendenze dati:
- `R` = read
- `W` = write
- `FS` = Firestore collection/doc diretto
- `STG` = Firebase Storage

## Admin Web - Dashboard e Hub

### `/` - Home (`src/pages/Home.tsx`)
- Scopo: dashboard operativa con alert, quick link e accesso ai moduli.
- Componenti visibili: hero cards moduli, liste eventi autisti, cards alert, modali intervento, quick sections.
- Azioni primarie (1-3): aprire modulo, gestire alert (ack/snooze), aprire dettaglio evento.
- Azioni secondarie: export PDF alert, ricerca autista, gestione quick link preferiti.
- Dipendenze dati: `R @mezzi_aziendali, @autisti_sessione_attive, @storico_eventi_operativi, @segnalazioni_autisti_tmp, @controlli_mezzo_autisti`; `W @alerts_state, @mezzi_aziendali, @storico_eventi_operativi`; localStorage quicklinks/missing alert.
- Pain point UI rilevati: pagina molto densa (oltre 4k linee), priorita CTA non sempre chiara, mix di ruoli e task in una sola vista.

### `/gestione-operativa` - GestioneOperativa (`src/pages/GestioneOperativa.tsx`)
- Scopo: hub rapido per magazzino/manutenzioni/centro controllo.
- Componenti visibili: header KPI, preview inventario, cards azioni operative, lista ultime attivita.
- Azioni primarie (1-3): aprire inventario, aprire materiali consegnati, aprire manutenzioni/centro controllo.
- Azioni secondarie: ritorno home.
- Dipendenze dati: `R @inventario, @materialiconsegnati, @manutenzioni`.
- Pain point UI rilevati: pagina hub duplicata rispetto a link analoghi in Home.

### `/centro-controllo` - CentroControllo (`src/pages/CentroControllo.tsx`)
- Scopo: monitoraggio centralizzato manutenzioni, rifornimenti e feed autisti.
- Componenti visibili: tab multipli, tabelle filtro/ricerca, badge priorita, export PDF.
- Azioni primarie (1-3): cambiare tab monitoraggio, filtrare per periodo/targa, generare anteprima PDF.
- Azioni secondarie: refresh dati, selezione multipla.
- Dipendenze dati: `R @mezzi_aziendali, @segnalazioni_autisti_tmp, @controlli_mezzo_autisti, @richieste_attrezzature_autisti_tmp`; `FS storage/@rifornimenti, storage/@rifornimenti_autisti_tmp`; `PDF`.
- Pain point UI rilevati: ampiezza funzionale elevata in unica pagina, rischio perdita contesto tra tab.

## Admin Web - Lavori

### `/lavori-da-eseguire` - LavoriDaEseguire (`src/pages/LavoriDaEseguire.tsx`)
- Scopo: inserimento nuovi lavori per magazzino o mezzo.
- Componenti visibili: form lavoro, toggle tipo/urgenza, lista gruppo corrente, tab link lavori.
- Azioni primarie (1-3): compilare lavoro, aggiungere al gruppo, salvare gruppo lavori.
- Azioni secondarie: navigazione verso in attesa/eseguiti.
- Dipendenze dati: `R @lavori, @mezzi_aziendali`; `W @lavori`.
- Pain point UI rilevati: passaggio gruppo/singolo non esplicitato in modo guidato.

### `/lavori-in-attesa` - LavoriInAttesa (`src/pages/LavoriInAttesa.tsx`)
- Scopo: lista lavori non eseguiti, raggruppata per targa/magazzino.
- Componenti visibili: gruppi collapsable, CTA dettaglio, anteprima PDF per gruppo.
- Azioni primarie (1-3): aprire dettaglio lavoro, filtrare per targa (query param), anteprima PDF.
- Azioni secondarie: condivisione PDF (copy/share/WhatsApp).
- Dipendenze dati: `R @lavori, @mezzi_aziendali`; `PDF`.
- Pain point UI rilevati: pagina molto orientata alla lista, stato avanzamento per gruppo poco evidente.

### `/lavori-eseguiti` - LavoriEseguiti (`src/pages/LavoriEseguiti.tsx`)
- Scopo: storico lavori eseguiti.
- Componenti visibili: gruppi per targa, card lavoro, CTA PDF.
- Azioni primarie (1-3): aprire dettaglio lavoro, filtrare per targa, generare PDF gruppo.
- Azioni secondarie: condivisione PDF.
- Dipendenze dati: `R @lavori, @mezzi_aziendali`; `PDF`.
- Pain point UI rilevati: duplicazione pattern con pagina in attesa (stessa struttura con stato inverso).

### `/dettagliolavori` - DettaglioLavoro (`src/pages/DettaglioLavoro.tsx`)
- Scopo: modifica, esecuzione o eliminazione singolo lavoro.
- Componenti visibili: dettaglio record, form edit, modali conferma, campi esecutore.
- Azioni primarie (1-3): salvare modifica, segnare eseguito, eliminare lavoro.
- Azioni secondarie: ritorno pagina precedente.
- Dipendenze dati: `R/W @lavori`.
- Pain point UI rilevati: route senza parametro esplicito (usa query), rischio deep-link fragile.

## Admin Web - Acquisti, Magazzino, Ordini

### `/acquisti` e `/acquisti/dettaglio/:ordineId` - Acquisti (`src/pages/Acquisti.tsx`)
- Scopo: super-modulo ordini, arrivi, preventivi IA/manuali e listino prezzi.
- Componenti visibili: tab multipli, form ordine, upload PDF/foto, analisi IA preventivi, liste ordini/preventivi/listino, menu azioni.
- Azioni primarie (1-3): creare ordine materiali, caricare e importare preventivo, aggiornare listino.
- Azioni secondarie: anteprima/condivisione PDF, filtri avanzati, bozza ordine in sessionStorage.
- Dipendenze dati: `R/W @ordini, @inventario`; `FS storage/@fornitori, @preventivi, @listino_prezzi`; `STG preventivi/*, materiali/*`; `PDF`; `IA`.
- Pain point UI rilevati: complessita massima (oltre 6k linee), molte responsabilita in un solo flusso, curva apprendimento alta.

### `/materiali-da-ordinare` - MaterialiDaOrdinare (`src/pages/MaterialiDaOrdinare.tsx`)
- Scopo: inserire fabbisogni e creare ordini base.
- Componenti visibili: form materiale, selettore fornitore, tab UI locali, upload foto, lista materiali.
- Azioni primarie (1-3): aggiungere materiale, creare ordine, aprire ordini in attesa/arrivati.
- Azioni secondarie: PDF fornitori/direzione (placeholder nel layout), modal placeholder prezzi/allegati/note.
- Dipendenze dati: `FS storage/@fornitori, storage/@ordini`; `STG` foto materiali.
- Pain point UI rilevati: sovrapposizione funzionale con `Acquisti`, rischio doppio entrypoint per stesso task.

### `/ordini-in-attesa` - OrdiniInAttesa (`src/pages/OrdiniInAttesa.tsx`)
- Scopo: vista ordini con materiali non arrivati.
- Componenti visibili: lista ordini per fornitore, card statistiche, CTA dettaglio/PDF.
- Azioni primarie (1-3): aprire dettaglio ordine, anteprima PDF per fornitore, share PDF.
- Azioni secondarie: ritorno home.
- Dipendenze dati: `R @ordini`; `PDF`.
- Pain point UI rilevati: duplicazione con tab ordini in `Acquisti`.

### `/ordini-arrivati` - OrdiniArrivati (`src/pages/OrdiniArrivati.tsx`)
- Scopo: vista ordini con materiali arrivati.
- Componenti visibili: lista ordini, statistiche arrivi, CTA dettaglio/PDF.
- Azioni primarie (1-3): aprire dettaglio ordine, anteprima PDF, share PDF.
- Azioni secondarie: ritorno home.
- Dipendenze dati: `R @ordini`; `PDF`.
- Pain point UI rilevati: stessa UX di `OrdiniInAttesa` con filtro differente.

### `/dettaglio-ordine/:ordineId` - DettaglioOrdine (`src/pages/DettaglioOrdine.tsx`)
- Scopo: gestire stato materiali ordine (arrivato/non arrivato) e righe ordine.
- Componenti visibili: dettaglio ordine, tabella materiali, edit riga, upload/rimozione foto.
- Azioni primarie (1-3): segnare arrivo/non arrivo, modificare ordine, aggiungere materiale.
- Azioni secondarie: ritorno a ordini in attesa.
- Dipendenze dati: `R/W @ordini, @inventario`.
- Pain point UI rilevati: route entra da flussi multipli, contesto tab origine non sempre mantenuto.

### `/inventario` - Inventario (`src/pages/Inventario.tsx`)
- Scopo: gestione giacenze magazzino.
- Componenti visibili: tabella articoli, form inserimento/modifica, controlli quantita +/-, modale edit foto.
- Azioni primarie (1-3): aggiungere articolo, modificare quantita, esportare PDF.
- Azioni secondarie: share/copy/WhatsApp PDF, eliminare articolo.
- Dipendenze dati: `R/W @inventario`; `FS storage/@fornitori` (lookup); `STG inventario/<id>/foto.jpg`; `PDF`.
- Pain point UI rilevati: editing in-place + modale puo creare flusso frammentato.

### `/materiali-consegnati` - MaterialiConsegnati (`src/pages/MaterialiConsegnati.tsx`)
- Scopo: registrare uscite materiali e storico consegne.
- Componenti visibili: form consegna, storico righe, filtri destinatario, CTA PDF.
- Azioni primarie (1-3): registrare consegna, cambiare destinatario/materiale, esportare PDF.
- Azioni secondarie: eliminare consegna, share PDF.
- Dipendenze dati: `R/W @materialiconsegnati, @inventario`; `R @mezzi_aziendali, @colleghi`; `PDF`.
- Pain point UI rilevati: dipende da inventario + anagrafiche; errori di coerenza possibili se dati mancanti.

### `/attrezzature-cantieri` - AttrezzatureCantieri (`src/pages/AttrezzatureCantieri.tsx`)
- Scopo: tracciare attrezzature su cantieri (consegna/spostamento/ritiro).
- Componenti visibili: form movimento, liste stato e registro, filtri, anteprima PDF.
- Azioni primarie (1-3): registrare movimento, modificare movimento, anteprima PDF.
- Azioni secondarie: reset filtri/form, ritorno a gestione operativa.
- Dipendenze dati: `R/W @attrezzature_cantieri`; `PDF`; possibile gestione foto (DA VERIFICARE dettaglio schema).
- Pain point UI rilevati: vista ampia con molte sezioni espandibili, priorita azioni non immediata.

### `/fornitori` - Fornitori (`src/pages/Fornitori.tsx`)
- Scopo: CRUD anagrafica fornitori.
- Componenti visibili: form fornitore, lista fornitori, azioni modifica/PDF/elimina.
- Azioni primarie (1-3): aggiungere/modificare fornitore, eliminare, esportare PDF scheda.
- Azioni secondarie: reset form.
- Dipendenze dati: `FS storage/@fornitori`; `PDF`.
- Pain point UI rilevati: naming campi possibili duplicati con `Acquisti` (`nome` vs `ragioneSociale`).

### `/colleghi` - Colleghi (`src/pages/Colleghi.tsx`)
- Scopo: CRUD anagrafica colleghi/autisti e schede carburante.
- Componenti visibili: form collega, lista, modal scheda carburante.
- Azioni primarie (1-3): aggiungere/modificare collega, eliminare, esportare PDF.
- Azioni secondarie: gestione scheda carburante.
- Dipendenze dati: `FS storage/@colleghi`; `PDF`.
- Pain point UI rilevati: pagina anagrafica con azioni eterogenee (profilo + documentazione).

## Admin Web - Flotta, Dossier, Capo

### `/mezzi` - Mezzi (`src/pages/Mezzi.tsx`)
- Scopo: anagrafica mezzi e collegamento dossier.
- Componenti visibili: form mezzo, lista card mezzi, upload foto/libretto, debug panel.
- Azioni primarie (1-3): creare/modificare mezzo, aprire dossier mezzo, analizzare libretto con IA.
- Azioni secondarie: reset form, debug dataset.
- Dipendenze dati: `R @mezzi_aziendali, @colleghi`; `W @mezzi_aziendali`; `STG` foto/libretti; `IA`.
- Pain point UI rilevati: pagina molto grande, mix CRUD anagrafica + tools IA/debug.

### `/dossiermezzi` - DossierLista (`src/pages/DossierLista.tsx`)
- Scopo: ingresso dossier per categoria mezzo.
- Componenti visibili: griglia categorie, poi griglia mezzi filtrati.
- Azioni primarie (1-3): selezionare categoria, aprire dossier mezzo.
- Azioni secondarie: tornare alla vista categorie.
- Dipendenze dati: `FS storage/@mezzi_aziendali`.
- Pain point UI rilevati: doppio pattern route dossier crea ambiguita (qui usa `/dossiermezzi/:targa`).

### `/dossiermezzi/:targa` e `/dossier/:targa` - DossierMezzo (`src/pages/DossierMezzo.tsx`)
- Scopo: vista completa mezzo (documenti, costi, lavori, manutenzioni, rifornimenti, timeline).
- Componenti visibili: header mezzo, sezioni economiche/tecniche, elenco documenti IA/manuali, modal PDF preview.
- Azioni primarie (1-3): aprire anteprima PDF dossier, aprire documento allegato, eliminare documento/costo.
- Azioni secondarie: navigare a IA libretto/archivio, filtri periodi.
- Dipendenze dati: `FS storage/@mezzi_aziendali, @lavori, @materialiconsegnati, @costiMezzo`; `R @manutenzioni, @rifornimenti_autisti_tmp`; `FS col @documenti_magazzino` + collezioni `@documenti_*`; `PDF`; `IA`.
- Pain point UI rilevati: pagina estesa e multifunzione, molte fonti dati eterogenee.

### `/dossier/:targa/gomme` - DossierGomme (`src/pages/DossierGomme.tsx`)
- Scopo: dettaglio economico/manutentivo gomme per mezzo.
- Componenti visibili: header dossier ridotto + sezione `GommeEconomiaSection`.
- Azioni primarie (1-3): consultare metriche gomme.
- Azioni secondarie: ritorno dossier.
- Dipendenze dati: `FS storage/@manutenzioni` (via `GommeEconomiaSection`).
- Pain point UI rilevati: pagina wrapper minimale; navigazione back dipende da history.

### `/dossier/:targa/rifornimenti` - DossierRifornimenti (`src/pages/DossierRifornimenti.tsx`)
- Scopo: analisi rifornimenti per singolo mezzo.
- Componenti visibili: header dossier ridotto + `RifornimentiEconomiaSection`.
- Azioni primarie (1-3): consultare report rifornimenti.
- Azioni secondarie: ritorno dossier.
- Dipendenze dati: `FS storage/@rifornimenti, @rifornimenti_autisti_tmp` (via section).
- Pain point UI rilevati: wrapper minimale, pattern simile a DossierGomme.

### `/mezzo-360/:targa` - Mezzo360 (`src/pages/Mezzo360.tsx`)
- Scopo: timeline unificata mezzo (eventi, lavori, materiali, documenti, autisti).
- Componenti visibili: sezioni espandibili, timeline, link rapidi moduli correlati, modal evento autista.
- Azioni primarie (1-3): consultare cronologia completa, aprire dettaglio evento, navigare a moduli correlati.
- Azioni secondarie: mostra tutto/meno per sezione.
- Dipendenze dati: `R @mezzi_aziendali, @autisti_sessione_attive, @storico_eventi_operativi, @manutenzioni, @lavori, @materialiconsegnati, @segnalazioni_autisti_tmp, @controlli_mezzo_autisti, @rifornimenti_autisti_tmp, @cambi_gomme_autisti_tmp, @gomme_eventi, @richieste_attrezzature_autisti_tmp`; `R @documenti_*`.
- Pain point UI rilevati: volume dati alto, rischio overload informativo senza gerarchia forte.

### `/autista-360` e `/autista-360/:badge` - Autista360 (`src/pages/Autista360.tsx`)
- Scopo: vista 360 autista (timeline cross-evento).
- Componenti visibili: filtri tipo evento, timeline, dettaglio evento, ricerca badge/nome.
- Azioni primarie (1-3): filtrare timeline, aprire dettaglio evento, selezionare autista.
- Azioni secondarie: ricerca per nome via query param.
- Dipendenze dati: `R @autisti_sessione_attive, @segnalazioni_autisti_tmp, @controlli_mezzo_autisti, @rifornimenti_autisti_tmp, @richieste_attrezzature_autisti_tmp, @cambi_gomme_autisti_tmp, @gomme_eventi, @storico_eventi_operativi`.
- Pain point UI rilevati: match badge/nome con fallback multipli puo generare risultati inattesi.

### `/manutenzioni` - Manutenzioni (`src/pages/Manutenzioni.tsx`)
- Scopo: registrazione e gestione manutenzioni mezzo.
- Componenti visibili: form manutenzione, gestione materiali usati, lista interventi, modal gomme.
- Azioni primarie (1-3): salvare manutenzione, associare consumo materiale, aprire dossier mezzo.
- Azioni secondarie: pulire campi, eliminare manutenzione.
- Dipendenze dati: `R/W @manutenzioni, @inventario, @materialiconsegnati`; `R @mezzi_aziendali`; `PDF`.
- Pain point UI rilevati: integrazione forte con inventario/consegne, alto rischio errori sequenza.

### `/analisi-economica/:targa` - AnalisiEconomica (`src/pages/AnalisiEconomica.tsx`)
- Scopo: analisi costi mezzo con supporto IA e export PDF.
- Componenti visibili: KPI costi, timeline documenti, sezione IA, preview PDF.
- Azioni primarie (1-3): rigenerare analisi IA, esportare PDF analisi, cambiare filtro periodo.
- Azioni secondarie: navigare verso dossier.
- Dipendenze dati: `FS storage/@mezzi_aziendali, @costiMezzo`; `R @documenti_*`; `FS @analisi_economica_mezzi`; `PDF`; `IA`.
- Pain point UI rilevati: combina analisi, sorgenti costi e IA in un unico schermo complesso.

### `/capo/mezzi` - CapoMezzi (`src/pages/CapoMezzi.tsx`)
- Scopo: vista sintetica costi mezzi per ruolo capo.
- Componenti visibili: lista mezzi raggruppata categoria, metriche mese/anno, ricerca.
- Azioni primarie (1-3): cercare mezzo, aprire costi dettaglio mezzo, consultare KPI costo.
- Azioni secondarie: ritorno home.
- Dipendenze dati: `FS storage/@mezzi_aziendali, @costiMezzo`; `R @documenti_*`.
- Pain point UI rilevati: calcolo costi dipende da dedup manuale+IA, possibili divergenze percepite.

### `/capo/costi/:targa` - CapoCostiMezzo (`src/pages/CapoCostiMezzo.tsx`)
- Scopo: dettaglio fatture/preventivi di un mezzo con workflow approvazione.
- Componenti visibili: filtri mese/anno, tab fatture/preventivi, stato approvazione, PDF preview/timbrato.
- Azioni primarie (1-3): approvare/rifiutare preventivo, aprire documento allegato, esportare PDF preventivi.
- Azioni secondarie: filtro pending only, export annuale.
- Dipendenze dati: `FS storage/@costiMezzo`; `R @documenti_*`; `R/W @preventivi_approvazioni`; `PDF`.
- Pain point UI rilevati: molte varianti stato (pending/approved/rejected + valuta unknown) in stessa lista.

## Admin Web - IA, Documenti, Cisterna

### `/ia` - IAHome (`src/pages/IA/IAHome.tsx`)
- Scopo: menu ingresso ai moduli IA.
- Componenti visibili: card navigazione (libretto, archivio, documenti, cisterna, api key).
- Azioni primarie (1-3): aprire modulo IA desiderato.
- Azioni secondarie: stato api key.
- Dipendenze dati: `FS @impostazioni_app/gemini` (check presenza).
- Pain point UI rilevati: card numerose senza percorso guidato end-to-end.

### `/ia/apikey` - IAApiKey (`src/pages/IA/IAApiKey.tsx`)
- Scopo: configurare API key Gemini.
- Componenti visibili: input key con show/hide, stato salvataggio.
- Azioni primarie (1-3): salvare api key, mostrare/nascondere key, tornare al menu IA.
- Azioni secondarie: nessuna rilevante.
- Dipendenze dati: `FS @impostazioni_app/gemini`.
- Pain point UI rilevati: area sensibile sicurezza in UI client (policy DA VERIFICARE).

### `/ia/documenti` - IADocumenti (`src/pages/IA/IADocumenti.tsx`)
- Scopo: upload documento, analisi IA, revisione campi, salvataggio archivio documenti.
- Componenti visibili: upload file, preview, sezioni collapsable dati estratti, lista documenti salvati, modal valuta.
- Azioni primarie (1-3): analizzare con IA, salvare documento in collezione corretta, importare voci in inventario.
- Azioni secondarie: aprire PDF salvato, correggere valuta.
- Dipendenze dati: `FS @impostazioni_app/gemini, storage/@mezzi_aziendali`; `R/W @inventario`; `W @documenti_mezzi|@documenti_magazzino|@documenti_generici`; `STG documenti_pdf/*`; `IA endpoint estrazioneDocumenti`.
- Pain point UI rilevati: molti campi e stati intermedi, rischio confusione tra analisi e salvataggio definitivo.

### `/ia/libretto` - IALibretto (`src/pages/IA/IALibretto.tsx`)
- Scopo: analisi IA libretti mezzi e salvataggio riferimenti.
- Componenti visibili: upload foto/libretto, risultati IA, viewer immagine, elenco per targa.
- Azioni primarie (1-3): analizzare con IA, salvare su mezzi, aprire foto/PDF libretto.
- Azioni secondarie: navigare API key/menu IA, rotazione viewer.
- Dipendenze dati: `FS @impostazioni_app/gemini, storage/@mezzi_aziendali`; `W @mezzi_aziendali`; `STG mezzi_aziendali/<id>/libretto.jpg`; `IA`.
- Pain point UI rilevati: combinazione archivio+analisi+viewer in una sola pagina.

### `/ia/copertura-libretti` - IACoperturaLibretti (`src/pages/IA/IACoperturaLibretti.tsx`)
- Scopo: audit copertura libretti su parco mezzi e repair upload.
- Componenti visibili: tabella copertura, debug dati, picker upload/repair.
- Azioni primarie (1-3): individuare mezzi senza libretto, caricare libretto mancante, eseguire repair.
- Azioni secondarie: aprire libretto corrente.
- Dipendenze dati: `R/W @mezzi_aziendali`; `FS storage/@mezzi_aziendali`; `STG mezzi_aziendali/<id>/libretto.jpg`; `IA/fetch`.
- Pain point UI rilevati: pagina tecnico-operativa con lessico debug poco orientato utente business.

### `/libretti-export` - LibrettiExport (`src/pages/LibrettiExport.tsx`)
- Scopo: generare export PDF multiplo dei libretti.
- Componenti visibili: selezione targhe, stato file disponibili, preview PDF.
- Azioni primarie (1-3): selezionare set targhe, generare anteprima PDF, condividere PDF.
- Azioni secondarie: fallback download URL.
- Dipendenze dati: `R @mezzi_aziendali`; `STG` download libretti; `PDF`.
- Pain point UI rilevati: funzione trasversale non chiaramente collocata nel menu principale.

### `/cisterna` - CisternaCaravatePage (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx`)
- Scopo: archivio documenti e report cisterna per mese.
- Componenti visibili: picker mese, tab archivio/report, tabelle dati, azioni rettifica.
- Azioni primarie (1-3): cambiare mese, consultare archivio cisterna, aggiornare parametri mese.
- Azioni secondarie: aprire IA cisterna, navigare home.
- Dipendenze dati: `R/W @documenti_cisterna, @cisterna_schede_ia, @cisterna_parametri_mensili`; supporto `@rifornimenti_autisti_tmp`; `IA`.
- Pain point UI rilevati: dominio specialistico separato ma molto denso.

### `/cisterna/ia` - CisternaCaravateIA (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx`)
- Scopo: upload documento cisterna e analisi IA dedicata.
- Componenti visibili: upload file, preview risultato estratto, form conferma salvataggio.
- Azioni primarie (1-3): analizzare documento, salvare in archivio cisterna, rientrare in archivio.
- Azioni secondarie: ritorno menu IA.
- Dipendenze dati: `W @documenti_cisterna`; `STG documenti_pdf/cisterna/*`; `IA endpoint cisterna`.
- Pain point UI rilevati: flusso parallelo a IADocumenti (logica simile ma UI diversa).

### `/cisterna/schede-test` - CisternaSchedeTest (`src/pages/CisternaCaravate/CisternaSchedeTest.tsx`)
- Scopo: estrazione righe scheda cisterna con modalita manuale/IA e revisione.
- Componenti visibili: switch modalita, griglia righe, prefill da autisti, salvataggio.
- Azioni primarie (1-3): estrarre righe da immagine, correggere righe, salvare scheda.
- Azioni secondarie: precompila da autisti, navigazione archivio/IA.
- Dipendenze dati: `R/W @cisterna_schede_ia`; `R @rifornimenti_autisti_tmp` (supporto); `STG documenti_pdf/cisterna_schede/*`; `IA`.
- Pain point UI rilevati: workflow tecnico molto lungo, molte opzioni nello stesso schermo.

## App Autisti (mobile web)

### `/autisti` - AutistiGate (`src/autisti/AutistiGate.tsx`)
- Scopo: gate automatico a login/setup/controllo/home in base allo stato sessione.
- Componenti visibili: nessuna UI (redirect logic).
- Azioni primarie (1-3): redirect condizionato.
- Azioni secondarie: controllo revoche periodico.
- Dipendenze dati: `R @autisti_sessione_attive, @controlli_mezzo_autisti`; localStorage autista/mezzo.
- Pain point UI rilevati: pagina invisibile, debugging flusso difficile lato utente.

### `/autisti/login` - LoginAutista (`src/autisti/LoginAutista.tsx`)
- Scopo: autenticazione autista via badge.
- Componenti visibili: input badge, CTA entra, messaggi errore.
- Azioni primarie (1-3): validare badge, salvare sessione locale, entrare in setup mezzo.
- Azioni secondarie: redirect automatico se gia loggato.
- Dipendenze dati: `R @colleghi`; `W @storico_eventi_operativi`; localStorage autista.
- Pain point UI rilevati: login solo badge, sicurezza/ruoli da verificare.

### `/autisti/setup-mezzo` - SetupMezzo (`src/autisti/SetupMezzo.tsx`)
- Scopo: assegnare motrice/rimorchio a sessione autista.
- Componenti visibili: selettori mezzi, warning conflitto, conferma assetto.
- Azioni primarie (1-3): selezionare motrice/rimorchio, confermare assetto, gestire conflitti.
- Azioni secondarie: modalita lock per cambio parziale (`mode=motrice/rimorchio`).
- Dipendenze dati: `R @mezzi_aziendali, @autisti_sessione_attive`; `W @autisti_sessione_attive, @storico_eventi_operativi`; localStorage mezzo.
- Pain point UI rilevati: logica conflitti/revoche complessa per un flusso mobile.

### `/autisti/home` - HomeAutista (`src/autisti/HomeAutista.tsx`)
- Scopo: menu operativo autista e gestione sessione attiva.
- Componenti visibili: card azioni (rifornimento, segnalazioni, gomme, richieste, cambio), modale sgancio, logout.
- Azioni primarie (1-3): aprire azione operativa, gestire sgancio/cambio, logout.
- Azioni secondarie: polling revoche e coerenza sessione.
- Dipendenze dati: `R/W @autisti_sessione_attive, @storico_eventi_operativi`; localStorage autista/mezzo.
- Pain point UI rilevati: stato sessione distribuito local/cloud; feedback revoca gestito con alert blocking.

### `/autisti/cambio-mezzo` - CambioMezzoAutista (`src/autisti/CambioMezzoAutista.tsx`)
- Scopo: cambio assetto motrice/rimorchio in corso turno.
- Componenti visibili: scelta modalita, luogo, stato carico, conferma.
- Azioni primarie (1-3): definire tipo cambio, confermare cambio, aggiornare sessione.
- Azioni secondarie: ritorno indietro.
- Dipendenze dati: `R/W @autisti_sessione_attive, @storico_eventi_operativi`.
- Pain point UI rilevati: molte varianti operative in una singola form.

### `/autisti/controllo` - ControlloMezzo (`src/autisti/ControlloMezzo.tsx`)
- Scopo: checklist mezzo obbligatoria prima dell operativita.
- Componenti visibili: selezione target motrice/rimorchio/entrambi, checklist, conferma controllo.
- Azioni primarie (1-3): compilare checklist, confermare controllo, ritornare home.
- Azioni secondarie: target lock da query param.
- Dipendenze dati: `R/W @controlli_mezzo_autisti`.
- Pain point UI rilevati: vincolo obbligatorieta non sempre trasparente all utente.

### `/autisti/rifornimento` - Rifornimento (`src/autisti/Rifornimento.tsx`)
- Scopo: inserire rifornimento autista (caravate/distributore).
- Componenti visibili: form rifornimento, toggle tipo/metodo/paese, conferma.
- Azioni primarie (1-3): compilare rifornimento, confermare salvataggio, rientrare home.
- Azioni secondarie: cambio mezzo rapido.
- Dipendenze dati: `R/W @rifornimenti_autisti_tmp`; `FS storage/@rifornimenti` (append canonicale).
- Pain point UI rilevati: doppia scrittura tmp+canonica non esplicitata in UX.

### `/autisti/segnalazioni` - Segnalazioni (`src/autisti/Segnalazioni.tsx`)
- Scopo: inviare segnalazioni guasto con classificazione e foto.
- Componenti visibili: scelta ambito/tipo, campi descrizione/note, upload foto multipla.
- Azioni primarie (1-3): classificare problema, caricare foto, inviare segnalazione.
- Azioni secondarie: reset selezioni per ambito/tipo.
- Dipendenze dati: `R @mezzi_aziendali`; `W @segnalazioni_autisti_tmp`; `STG autisti/segnalazioni/*`.
- Pain point UI rilevati: form ricco su mobile; possibili errori compilazione se ambito non coerente.

### `/autisti/richiesta-attrezzature` - RichiestaAttrezzature (`src/autisti/RichiestaAttrezzature.tsx`)
- Scopo: inviare richiesta attrezzature con allegato foto opzionale.
- Componenti visibili: textarea messaggio, upload singola foto, metadati mezzo/autista.
- Azioni primarie (1-3): compilare richiesta, allegare foto, inviare.
- Azioni secondarie: rimuovere foto caricata.
- Dipendenze dati: `R/W @richieste_attrezzature_autisti_tmp`; `STG autisti/richieste-attrezzature/*`.
- Pain point UI rilevati: singola foto supportata; stato upload/errore minimale.

## Inbox Autisti + Rettifica Admin

### `/autisti-inbox` - AutistiInboxHome (`src/autistiInbox/AutistiInboxHome.tsx`)
- Scopo: inbox giornaliera eventi autisti con preview e accesso liste complete.
- Componenti visibili: cards rifornimenti/sessioni/eventi, filtri giorno, menu admin, modal dettaglio evento.
- Azioni primarie (1-3): cambiare giorno, aprire evento dettaglio, aprire liste complete.
- Azioni secondarie: accesso a centro rettifica.
- Dipendenze dati: `R` aggregato da `homeEvents` (`@rifornimenti_autisti_tmp`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp`, `@cambi_gomme_autisti_tmp`, `@autisti_sessione_attive`, `@storico_eventi_operativi`).
- Pain point UI rilevati: forte densita informativa anche su viewport ridotti.

### `/autisti-inbox/cambio-mezzo` - CambioMezzoInbox (`src/autistiInbox/CambioMezzoInbox.tsx`)
- Scopo: lista cambi mezzo per giorno.
- Componenti visibili: filtro data con prev/next picker, tabella eventi.
- Azioni primarie (1-3): cambiare giorno, consultare dettaglio cambio, tornare inbox.
- Azioni secondarie: navigazione home.
- Dipendenze dati: `R @storico_eventi_operativi` (tramite utility/payload).
- Pain point UI rilevati: flusso data-driven senza filtri aggiuntivi (badge/targa) puo essere lungo.

### `/autisti-inbox/controlli` - AutistiControlliAll (`src/autistiInbox/AutistiControlliAll.tsx`)
- Scopo: elenco completo controlli mezzo.
- Componenti visibili: lista/table controlli, filtri stato (KO/OK), export PDF.
- Azioni primarie (1-3): filtrare controlli, aprire dettaglio, export PDF.
- Azioni secondarie: ritorno inbox.
- Dipendenze dati: `R @controlli_mezzo_autisti`; `PDF`.
- Pain point UI rilevati: pattern simile ad altre liste, possibile ridondanza UI.

### `/autisti-inbox/segnalazioni` - AutistiSegnalazioniAll (`src/autistiInbox/AutistiSegnalazioniAll.tsx`)
- Scopo: elenco completo segnalazioni autisti.
- Componenti visibili: lista card, lightbox immagini, pulsanti condivisione/PDF.
- Azioni primarie (1-3): aprire segnalazione, visualizzare foto, export PDF.
- Azioni secondarie: share WhatsApp.
- Dipendenze dati: `R @segnalazioni_autisti_tmp`; `PDF`; `STG` URL immagini.
- Pain point UI rilevati: numerose azioni per riga possono ridurre leggibilita elenco.

### `/autisti-inbox/log-accessi` - AutistiLogAccessiAll (`src/autistiInbox/AutistiLogAccessiAll.tsx`)
- Scopo: storico login/logout/inizio/cambio assetto.
- Componenti visibili: filtri tipo evento, lista cronologica.
- Azioni primarie (1-3): filtrare tipo evento, consultare timeline accessi.
- Azioni secondarie: ritorno inbox.
- Dipendenze dati: `R @storico_eventi_operativi`.
- Pain point UI rilevati: utile auditing, ma separato dal resto cronologia autisti.

### `/autisti-inbox/richiesta-attrezzature` - RichiestaAttrezzatureAll (`src/autistiInbox/RichiestaAttrezzatureAll.tsx`)
- Scopo: elenco richieste attrezzature inviate dagli autisti.
- Componenti visibili: lista richieste, preview foto, export PDF.
- Azioni primarie (1-3): aprire richiesta, vedere allegato, esportare PDF.
- Azioni secondarie: share WhatsApp.
- Dipendenze dati: `R @richieste_attrezzature_autisti_tmp`; `PDF`; `STG`.
- Pain point UI rilevati: simile a segnalazioni; possibile convergenza template lista evento.

### `/autisti-inbox/gomme` - AutistiGommeAll (`src/autistiInbox/AutistiGommeAll.tsx`)
- Scopo: elenco eventi gomme autisti in attesa.
- Componenti visibili: lista eventi gomme, stato evento, ritorno inbox.
- Azioni primarie (1-3): consultare eventi gomme.
- Azioni secondarie: nessuna forte lato pagina (import avviene in `AutistiAdmin`).
- Dipendenze dati: `R @cambi_gomme_autisti_tmp`.
- Pain point UI rilevati: pagina informativa senza azione primaria evidente.

### `/autisti-admin` - AutistiAdmin (`src/autistiInbox/AutistiAdmin.tsx`)
- Scopo: centro rettifica dati autisti e import verso dataset ufficiali.
- Componenti visibili: tab rifornimenti/segnalazioni/controlli/gomme/storico cambi/attrezzature, modali edit, export PDF.
- Azioni primarie (1-3): rettificare record, importare gomme, creare lavoro da evento.
- Azioni secondarie: forzare libero/cambio sessione, cancellare allegati storage.
- Dipendenze dati: `R/W @autisti_sessione_attive, @storico_eventi_operativi, @rifornimenti_autisti_tmp, @segnalazioni_autisti_tmp, @controlli_mezzo_autisti, @richieste_attrezzature_autisti_tmp, @cambi_gomme_autisti_tmp, @gomme_eventi, @lavori`; `FS storage/@rifornimenti`; `R @mezzi_aziendali, @colleghi`; `STG deleteObject`; `PDF`.
- Pain point UI rilevati: altissima complessita, molte operazioni critiche concentrate in una pagina.

## Pagine/aree con dettaglio incompleto (DA VERIFICARE)
- Campi completi schema record in `@manutenzioni` e `@attrezzature_cantieri` (UI usa subset + fallback).
- Alcune CTA secondarie di `Acquisti`, `CisternaCaravatePage`, `CentroControllo` non sono tutte deducibili senza test runtime.
