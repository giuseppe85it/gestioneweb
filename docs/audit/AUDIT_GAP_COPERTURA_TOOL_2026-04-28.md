# AUDIT GAP COPERTURA TOOL CHAT IA NEXT - 2026-04-28

Stato: AUDIT COMPLETATO

## 1. INTRO

Data audit: 2026-04-28.

Scopo: verificare in modo sistematico se i 37 tool realmente registrati nella chat IA NEXT permettono di leggere e incrociare tutti i dati gestiti dal sistema, su due livelli:

- Madre: pagine e dati gestiti da `src/pages/*` e componenti collegati.
- NEXT: pagine `src/next/Next*.tsx`, reader/writer NEXT, dati scriventi NEXT e campi NEXT-only.

Mandato Giuseppe: qualsiasi dato salvato deve poter essere interrogato dalla chat IA; qualsiasi incrocio tra entita diverse deve essere possibile, sia su dati madre sia su dati NEXT-only.

Perimetro rispettato:

- Inclusi: `src/pages/*`, `src/components/*` per quanto richiamato dalle pagine, `src/next/*` escluso `src/next/chat-ia/*` salvo registry/tool reali, reader/writer NEXT, datasource Firestore/Storage, documenti audit/stato/tool indicati.
- Esclusi: `backend/*`, archivista interno, implementazione interna di `src/next/chat-ia/*` non registry/tool.
- `src/next/NextIAArchivistaPage.tsx` e' stato trattato solo come consumatore/shell di navigazione, non come analisi del sottosistema archivista.

Fonti guida aperte prima dell'audit: `AGENTS.md`, `docs/STATO_ATTUALE_PROGETTO.md`, `docs/_live/STATO_MIGRAZIONE_NEXT.md`, `docs/_live/data/DOMINI_DATI_CANONICI.md`, `docs/_live/data/MAPPA_COMPLETA_DATI.md`, `docs/_live/data/REGOLE_STRUTTURA_DATI.md`, `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`, `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md`, `docs/product/TOOL_REGISTRY_CHAT_IA_NEXT.md`.

Nota di coerenza: `docs/product/TOOL_REGISTRY_CHAT_IA_NEXT.md` descrive anche tool candidati/storici, ma il codice reale registra 37 tool in `src/next/chat-ia/tools/index.ts`.

Conteggi finali:

- Pagine madre TSX inventariate: 41.
- File `Next*.tsx` inventariati sotto `src/next`, esclusa chat IA: 104.
- Tool chat IA NEXT realmente registrati: 37.
- Entita madre identificate: 29.
- Entita NEXT identificate: 39.
- Incroci dati identificati: 41.
- Gap identificati: 30.

## 2. INVENTARIO COMPLETO PAGINE MADRE

Legenda: `Coll.` indica collection/documenti Firestore o storage-sync; `Storage` indica path Firebase Storage; `Ops` indica le operazioni utente o dati rilevanti.

| File madre | Ruolo | Coll. / Storage | Campi principali e Ops |
|---|---|---|---|
| `src/pages/Acquisti.tsx` | Procurement madre: ordini, preventivi, listino, fornitori. | `storage/@fornitori`, `@inventario`, `@listino_prezzi`, `@ordini`, `@preventivi`; storage preventivi/materiali. | Fornitore, righe preventivo, codici articolo, prezzi, trend, PDF/foto. Ops: lista, import IA, approvazione, aggiornamento listino, foto/PDF. |
| `src/pages/AnalisiEconomica.tsx` | Analisi economica mezzi. | `@analisi_economica_mezzi`, `@costiMezzo`, `@documenti_generici`, `@documenti_magazzino`, `@documenti_mezzi`, `@mezzi_aziendali`. | Mezzo, documento costo, fornitore, totale, valuta, aggregati. Ops: analisi per mezzo/flotta, aggregazione costi/documenti. |
| `src/pages/AttrezzatureCantieri.tsx` | Movimenti attrezzature per cantiere. | `storage/@attrezzature_cantieri`; storage foto attrezzature. | tipo, data, materialeCategoria, descrizione, quantita, unita, cantiere, note, foto, sorgente. Ops: consegna/spostamento/ritiro, stato per cantiere. |
| `src/pages/Autista360.tsx` | Timeline autista. | `@autisti_sessione_attive`, `@cambi_gomme_autisti_tmp`, `@controlli_mezzo_autisti`, `@gomme_eventi`, `@richieste_attrezzature_autisti_tmp`, `@rifornimenti_autisti_tmp`, `@segnalazioni_autisti_tmp`, `@storico_eventi_operativi`. | badge, nome, targhe, eventi, controlli, richieste, gomme, rifornimenti. Ops: timeline e incrocio autista/mezzo/evento. |
| `src/pages/CapoCostiMezzo.tsx` | Vista capo costi e approvazioni. | `@costiMezzo`, `@documenti_generici`, `@documenti_magazzino`, `@documenti_mezzi`, `@preventivi_approvazioni`. | costo, fattura/preventivo, approvazione, fornitore, importo, targa. Ops: lista costi e stato approvazione. |
| `src/pages/CapoMezzi.tsx` | Vista capo flotta/costi mezzi. | `@costiMezzo`, `@documenti_*`, `@mezzi_aziendali`. | targa, categoria, marca/modello, costo, documenti. Ops: filtro mezzo e riepilogo economico. |
| `src/pages/CentroControllo.tsx` | Centro controllo operativo. | `@controlli_mezzo_autisti`, `@mezzi_aziendali`, `@richieste_attrezzature_autisti_tmp`, `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@segnalazioni_autisti_tmp`. | manutenzioni programmate, revisioni, rifornimenti, segnalazioni, controlli, richieste. Ops: priorita, scadenze, alert. |
| `src/pages/CisternaCaravate/CisternaCaravateIA.tsx` | Caricamento documento cisterna con IA. | `@documenti_cisterna`; storage `documenti_pdf/cisterna/`. | tipoDocumento, fornitore, destinatario, numero, data, litriTotali, totale, valuta, prodotto, testo, daVerificare. Ops: upload, estrazione IA, salvataggio documento. |
| `src/pages/CisternaCaravate/CisternaCaravatePage.tsx` | Dashboard cisterna Caravate. | `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`. | documenti, schede, litri, targa, autista, azienda, cambio EUR/CHF, costi. Ops: stato mensile, riconciliazione, duplicati, verita aggregata. |
| `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` | Test schede cisterna. | `@cisterna_schede_ia`; storage `documenti_pdf/cisterna_schede/`. | crop, calibrazione, righe manuali/IA, data, targa, litri, nome, azienda, review. Ops: upload, crop, estrazione, revisione righe. |
| `src/pages/Colleghi.tsx` | Anagrafica colleghi/autisti. | `storage/@colleghi`. | nome, telefono, telefonoPrivato, badge/codice, descrizione, pin/puk SIM, schede carburante. Ops: CRUD anagrafica. |
| `src/pages/DettaglioLavoro.tsx` | Dettaglio lavoro. | `storage/@lavori`. | gruppoId, tipo, descrizione, eseguito, targa, urgenza, date, sottoElementi. Ops: dettaglio e modifica stato lavoro. |
| `src/pages/DettaglioOrdine.tsx` | Dettaglio ordine. | `storage/@ordini`, `@inventario`. | ordine, righe materiali, quantita, arrivi, note, inventario. Ops: dettaglio, arrivo materiali. |
| `src/pages/DossierGomme.tsx` | Sezione gomme dossier. | Wrapper su dati manutenzione/gomme. | assi, gomme, interventi. Ops: vista sezione gomme. |
| `src/pages/DossierLista.tsx` | Lista dossier mezzi. | `storage/@mezzi_aziendali`. | targa, categoria, marca/modello, autista. Ops: lista e navigazione dossier. |
| `src/pages/DossierMezzo.tsx` | Dossier completo mezzo. | `@mezzi_aziendali`, `@lavori`, `@manutenzioni`, `@materialiconsegnati`, `@rifornimenti_autisti_tmp`, `@costiMezzo`, `@documenti_*`. | anagrafica, lavori, manutenzioni, materiali, rifornimenti, documenti, costi. Ops: dettaglio 360, cancellazione documento costo. |
| `src/pages/DossierRifornimenti.tsx` | Sezione rifornimenti dossier. | Wrapper rifornimenti. | litri, km, costo, autista, distributore. Ops: vista rifornimenti per mezzo. |
| `src/pages/Fornitori.tsx` | Anagrafica fornitori. | `storage/@fornitori`. | nome, telefono, badge/codice, descrizione. Ops: CRUD fornitore. |
| `src/pages/GestioneOperativa.tsx` | Pannello operativo magazzino/manutenzioni. | `@inventario`, `@manutenzioni`, `@materialiconsegnati`. | stock, consegne, manutenzioni recenti. Ops: anteprima operativa. |
| `src/pages/GommeEconomiaSection.tsx` | Economia gomme. | `storage/@manutenzioni`. | manutenzione gomme, assi, km, costo se derivato. Ops: riepilogo economico sezione. |
| `src/pages/Home.tsx` | Home operativa. | `@alerts_state`, `@autisti_sessione_attive`, `@controlli_mezzo_autisti`, `@mezzi_aziendali`, `@segnalazioni_autisti_tmp`, `@storico_eventi_operativi`. | mezzi, revisioni, sessioni, segnalazioni, controlli, eventi, alert. Ops: dashboard e priorita. |
| `src/pages/IA/ControlloDebug.tsx` | Debug controllo IA. | Nessuna persistenza principale rilevata. | issue audit/debug. Ops: diagnostica. |
| `src/pages/IA/IAApiKey.tsx` | Configurazione chiave IA. | `@impostazioni_app/gemini`. | chiave/config IA. Ops: lettura/scrittura config. |
| `src/pages/IA/IACoperturaLibretti.tsx` | Copertura libretti. | `@mezzi_aziendali`; storage libretti. | mezzo, librettoUrl, librettoStoragePath, repair report. Ops: verifica copertura e upload/riparazione. |
| `src/pages/IA/IADocumenti.tsx` | Archivio documenti IA madre. | `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@impostazioni_app`, `@inventario`, `@mezzi_aziendali`; storage `documenti_pdf/`. | tipoDocumento, targa, fornitore, numero, data, importi, IVA, testo, voci, fileUrl. Ops: upload, analisi IA, archiviazione. |
| `src/pages/IA/IAHome.tsx` | Home IA madre. | `@impostazioni_app`. | config/stato IA. Ops: navigazione e stato. |
| `src/pages/IA/IALibretto.tsx` | Estrazione libretto mezzo. | `@mezzi_aziendali`, `@impostazioni_app`; storage `mezzi_aziendali/<id>/libretto.jpg`. | targa, marca, modello, telaio e campi libretto estratti. Ops: upload, estrazione, persistenza su mezzo. |
| `src/pages/Inventario.tsx` | Inventario magazzino. | `@inventario`, `@fornitori`; storage `inventario/<itemId>/foto.jpg`. | descrizione, quantita, unita, fornitore, foto. Ops: CRUD stock, foto. |
| `src/pages/LavoriDaEseguire.tsx` | Lavori aperti. | `@lavori`, `@mezzi_aziendali`. | gruppo, tipo, descrizione, targa, urgenza, sottoElementi. Ops: filtro aperti, modifica stato. |
| `src/pages/LavoriEseguiti.tsx` | Lavori chiusi. | `@lavori`, `@mezzi_aziendali`. | lavori eseguiti, targa, date. Ops: lista storico. |
| `src/pages/LavoriInAttesa.tsx` | Lavori in attesa. | `@lavori`, `@mezzi_aziendali`. | lavori pendenti, urgenze, targa. Ops: lista e filtro. |
| `src/pages/LibrettiExport.tsx` | Export libretti. | `@mezzi_aziendali`; storage libretti. | targa, librettoUrl, librettoStoragePath. Ops: esportazione/controllo file. |
| `src/pages/Manutenzioni.tsx` | Manutenzioni business. | `@manutenzioni`, `@inventario`, `@materialiconsegnati`, `@mezzi_aziendali`. | targa, tipo, descrizione, data, km, ore, fornitore, materiali, gomme, importo. Ops: CRUD manutenzione, scarico materiali. |
| `src/pages/MaterialiConsegnati.tsx` | Movimenti materiali consegnati. | `@materialiconsegnati`, `@inventario`, `@mezzi_aziendali`, `@colleghi`. | descrizione, quantita, unita, destinatario, targa, motivo, data, fornitore. Ops: consegna, collegamento mezzo/collega, decremento stock. |
| `src/pages/MaterialiDaOrdinare.tsx` | Materiali da ordinare madre. | `@ordini`, `@fornitori`; storage materiali. | ordine, fornitore, righe, quantita, stato arrivo, foto. Ops: gestione ordine/materiali. |
| `src/pages/Mezzi.tsx` | Anagrafica mezzi madre. | `@mezzi_aziendali`, `@colleghi`; storage foto/libretto. | targa, categoria, marca, modello, telaio, collaudi, manutenzione programmata, autista, foto, libretto. Ops: CRUD mezzo e upload. |
| `src/pages/Mezzo360.tsx` | Timeline completa mezzo. | `@mezzi_aziendali`, `@lavori`, `@manutenzioni`, `@materialiconsegnati`, `@rifornimenti_autisti_tmp`, `@documenti_*`, eventi autisti/gomme. | tutte le relazioni per targa. Ops: timeline mezzo 360. |
| `src/pages/ModalGomme.tsx` | Modal gomme/geometria. | `@wheelGeom_override_v1`. | geometrie, cambio gomme, configurazioni assi. Ops: modifica modal. |
| `src/pages/OrdiniArrivati.tsx` | Ordini arrivati. | `@ordini`. | righe arrivate, date, materiali. Ops: lista arrivati. |
| `src/pages/OrdiniInAttesa.tsx` | Ordini in attesa. | `@ordini`. | righe pendenti, fornitore, materiale, quantita. Ops: lista pendenti. |
| `src/pages/RifornimentiEconomiaSection.tsx` | Economia rifornimenti. | `@rifornimenti`, `@rifornimenti_autisti_tmp`. | litri, km, costo, targa, autista, fonte. Ops: riepilogo consumi/costi. |

## 3. MAPPA DATI MADRE PER ENTITA

Entita madre identificate: 29.

| Entita | Campi principali letti/scritti dal repo madre |
|---|---|
| Mezzo | `id`, `tipo`, `categoria`, `targa`, `marca`, `modello`, `marcaModello`, `telaio`, `colore`, `cilindrata`, `potenza`, `massaComplessiva`, `proprietario`, `assicurazione`, `dataImmatricolazione`, `dataScadenzaRevisione`, `dataUltimoCollaudo`, `manutenzioneProgrammata`, `manutenzioneDataInizio`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto`, `note`, `autistaId`, `autistaNome`, `fotoUrl`, `fotoPath`, `librettoUrl`, `librettoStoragePath`. |
| Collega/Autista | `id`, `nome`, `telefono`, `telefonoPrivato`, `badge`, `codice`, `descrizione`, `pinSim`, `pukSim`, `schedeCarburante`. Nessun campo patente strutturato trovato nei file aperti. |
| Fornitore | `id`, `nome`, `telefono`, `badge`, `codice`, `descrizione`. |
| Lavoro | `id`, `gruppoId`, `tipo`, `descrizione`, `eseguito`, `targa`, `urgenza`, `dataInserimento`, `dataEsecuzione`, `sottoElementi`. |
| Manutenzione | `id`, `targa`, `tipo`, `descrizione`, `data`, `km`, `ore`, `sottotipo`, `eseguito`, `fornitore`, `materiali`, `assiCoinvolti`, `gommePerAsse`, `gommeInterventoTipo`, `gommeStraordinario`, `sourceDocumentId`, `importo`. |
| Gomme | intervento, assi, geometria, gomme per asse, cambio ordinario/straordinario, override `@wheelGeom_override_v1`, eventi autista `@gomme_eventi`. |
| Rifornimento | `id`, `mezzoTarga`/`targa`, `timestamp`, `data`, `litri`, `km`, `costo`, `valuta`, `distributore`, `note`, `autistaNome`, `badgeAutista`, `source`. |
| Documento mezzo | `tipoDocumento`, `categoriaArchivio`, `targa`, `fornitore`, `numeroDocumento`, `dataDocumento`, `imponibile`, `iva`, `totaleDocumento`, `valuta`, `fileUrl`, `testo`, `voci`. |
| Documento magazzino | stessi campi documento, con relazione a inventario/materiali se presente. |
| Documento generico | stessi campi documento, senza targa obbligatoria. |
| Costo/Fattura | `id`, `targa`, `sourceCollection`, `sourceDocId`, `fornitore`, `data`, `importo`, `valuta`, `tipoDocumento`, `fileUrl`, `dedupGroup`. |
| Preventivo | `id`, `fornitoreId`, `fornitoreNome`, `numeroPreventivo`, `dataPreventivo`, `pdfUrl`, `pdfStoragePath`, `imageStoragePaths`, `righe`, `createdAt`, `updatedAt`. |
| Riga preventivo/listino | `articoloCanonico`, `codiceArticolo`, `descrizione`, `quantita`, `unita`, `prezzoUnitario`, `valuta`, `trend`, `fontePreventivoId`. |
| Ordine | `id`, fornitore, data, righe materiali, stato arrivo, note, foto/materiali. |
| Inventario | `id`, `descrizione`, `quantita`, `unita`, `fornitore`, `fotoUrl`, `fotoStoragePath`. |
| Materiale consegnato | `id`, `descrizione`, `quantita`, `unita`, `destinatario`, `tipoDestinatario`, `targa`, `motivo`, `data`, `fornitore`, `refId`. |
| Attrezzatura cantiere | `id`, `tipo`, `data`, `materialeCategoria`, `descrizione`, `quantita`, `unita`, `cantiereId`, `cantiereLabel`, `note`, `fotoUrl`, `fotoStoragePath`, `sourceCantiereId`, `sourceCantiereLabel`. |
| Sessione autista | `targaMotrice`, `targaRimorchio`, `nomeAutista`, `badgeAutista`, `timestamp`, stato sessione. |
| Evento operativo | `tipo`, `timestamp`, `badgeAutista`, `nomeAutista`, targhe prima/dopo, stato cambio mezzo. |
| Segnalazione autista | `id`, `data`, `timestamp`, `stato`, `letta`, `urgenza`, `priorita`, `targa`, `autistaNome`, `badgeAutista`, `tipoProblema`, `descrizione`, `note`. |
| Controllo mezzo autista | `id`, `data`, `timestamp`, `targaMotrice`, `targaRimorchio`, `autistaNome`, `badgeAutista`, `esito`, `ok`, `koList`, `anomalie`, `note`. |
| Richiesta attrezzature autista | `id`, `timestamp`, `autista`, `badge`, `targa`, descrizione/richiesta, stato. |
| Cambio gomme autista | `id`, `timestamp`, `autista`, `badge`, targa, dati cambio. |
| Cisterna documento | `tipoDocumento`, `fornitore`, `destinatario`, `numeroDocumento`, `dataDocumento`, `litriTotali`, `totaleDocumento`, `valuta`, `prodotto`, `testo`, `daVerificare`. |
| Cisterna scheda IA | `id`, `createdAt`, `updatedAt`, `source`, `rowCount`, `rows`, `needsReview`, `mese`, `yearMonth`; righe con `data`, `targa`, `litri`, `nome`, `azienda`. |
| Cisterna parametro mensile | `monthKey`, cambio EUR/CHF e parametri usati nel report mensile. |
| Analisi economica salvata | record `@analisi_economica_mezzi` collegati a mezzo/documenti/costi. |
| Alert/promemoria | `@alerts_state`, prenotazioni collaudo, pre-collaudo, alert operativi. |
| Config IA | `@impostazioni_app/gemini`, stato/chiave/configurazione IA. |
| Libretto/foto libretto | `librettoUrl`, `librettoStoragePath`, immagine storage e campi estratti in `@mezzi_aziendali`. |

## 4. INCROCI MADRE

Incroci madre identificati: 24.

1. Mezzo -> autista assegnato tramite `autistaId`/`autistaNome`.
2. Mezzo -> lavori tramite `targa`.
3. Mezzo -> manutenzioni tramite `targa`.
4. Mezzo -> manutenzione programmata tramite campi su `@mezzi_aziendali`.
5. Mezzo -> rifornimenti ufficiali/autisti tramite targa normalizzata.
6. Mezzo -> documenti mezzo tramite `targa` e categorie documento.
7. Mezzo -> costi/fatture tramite documenti e `@costiMezzo`.
8. Mezzo -> materiali consegnati tramite `targa`/destinatario.
9. Mezzo -> gomme tramite manutenzioni e `@gomme_eventi`.
10. Mezzo -> segnalazioni e controlli autisti tramite targhe motrice/rimorchio.
11. Autista -> sessione attiva tramite nome/badge.
12. Autista -> rifornimenti temporanei tramite nome/badge.
13. Autista -> segnalazioni tramite nome/badge.
14. Autista -> controlli mezzo tramite nome/badge.
15. Autista -> richieste attrezzature tramite nome/badge.
16. Fornitore -> ordini tramite `fornitoreId`/nome.
17. Fornitore -> preventivi tramite `fornitoreId`/nome.
18. Fornitore -> listino tramite `fornitoreId`.
19. Fornitore -> documenti/fatture tramite campo fornitore estratto.
20. Ordine/preventivo -> materiali e foto materiali.
21. Inventario -> materiali consegnati tramite `refId`/descrizione.
22. Manutenzione -> inventario/materiali scaricati.
23. Documento IA -> manutenzione/costo tramite `sourceDocumentId` o dedup.
24. Cisterna -> rifornimenti autisti tramite mese, targa e litri.

## 5. INVENTARIO COMPLETO PAGINE E MODULI NEXT

File `Next*.tsx` inventariati: 104. I file sotto `src/next/chat-ia/*` non sono inclusi in questo conteggio.

| File NEXT | Ruolo |
|---|---|
| `src/next/NextHomePage.tsx` | Home NEXT con snapshot flotta, procurement, inventario, stato operativo. |
| `src/next/NextCentroControlloPage.tsx` | Pagina centro controllo NEXT. |
| `src/next/NextCentroControlloClonePage.tsx` | Clone centro controllo. |
| `src/next/NextCentroControlloParityPage.tsx` | Parity centro controllo. |
| `src/next/NextGestioneOperativaPage.tsx` | Gestione operativa NEXT. |
| `src/next/NextMagazzinoPage.tsx` | Magazzino NEXT scrivente/lettore inventario, materiali, AdBlue, documenti. |
| `src/next/NextInventarioPage.tsx` | Inventario NEXT. |
| `src/next/NextInventarioReadOnlyPanel.tsx` | Pannello read-only inventario. |
| `src/next/NextMaterialiConsegnatiPage.tsx` | Materiali consegnati NEXT. |
| `src/next/NextMaterialiConsegnatiReadOnlyPanel.tsx` | Pannello read-only movimenti materiali. |
| `src/next/NextAttrezzatureCantieriPage.tsx` | Modulo attrezzature cantieri NEXT. |
| `src/next/NextAttrezzatureCantieriReadOnlyPanel.tsx` | Lettura attrezzature cantieri. |
| `src/next/NextAttrezzatureCantieriWritePanel.tsx` | Scrittura attrezzature cantieri. |
| `src/next/NextManutenzioniPage.tsx` | Manutenzioni NEXT scriventi. |
| `src/next/NextAcquistiPage.tsx` | Alias/acquisti NEXT verso procurement. |
| `src/next/NextProcurementStandalonePage.tsx` | Procurement NEXT standalone. |
| `src/next/NextProcurementConvergedSection.tsx` | Sezione procurement convergente. |
| `src/next/NextProcurementReadOnlyPanel.tsx` | Pannello ordini/procurement con scritture su `@ordini`. |
| `src/next/NextMaterialiDaOrdinarePage.tsx` | Materiali da ordinare NEXT scriventi. |
| `src/next/NextPreventivoIaModal.tsx` | Modal preventivo IA. |
| `src/next/NextPreventivoManualeModal.tsx` | Modal preventivo manuale. |
| `src/next/NextOrdiniInAttesaPage.tsx` | Ordini in attesa NEXT. |
| `src/next/NextOrdiniArrivatiPage.tsx` | Ordini arrivati NEXT. |
| `src/next/NextDettaglioOrdinePage.tsx` | Dettaglio ordine NEXT. |
| `src/next/NextEuromeccPage.tsx` | Modulo Euromecc NEXT-only. |
| `src/next/NextAnagrafichePage.tsx` | Anagrafiche NEXT: colleghi, fornitori, officine. |
| `src/next/NextColleghiPage.tsx` | Colleghi/autisti NEXT. |
| `src/next/NextFornitoriPage.tsx` | Fornitori NEXT. |
| `src/next/components/NextAnagraficaModal.tsx` | Modal CRUD anagrafiche NEXT. |
| `src/next/NextDossierListaPage.tsx` | Lista dossier mezzi NEXT. |
| `src/next/NextDossierMezzoPage.tsx` | Dossier mezzo NEXT. |
| `src/next/components/NextMezzoEditModal.tsx` | Modal edit mezzo NEXT. |
| `src/next/NextDossierGommePage.tsx` | Dossier gomme NEXT. |
| `src/next/NextDossierRifornimentiPage.tsx` | Dossier rifornimenti NEXT. |
| `src/next/NextCapoMezziPage.tsx` | Vista capo mezzi NEXT. |
| `src/next/NextCapoCostiMezzoPage.tsx` | Vista capo costi mezzo NEXT. |
| `src/next/NextAnalisiEconomicaPage.tsx` | Analisi economica NEXT. |
| `src/next/NextGommeEconomiaSection.tsx` | Sezione gomme economia NEXT. |
| `src/next/NextRifornimentiEconomiaSection.tsx` | Sezione rifornimenti economia NEXT. |
| `src/next/NextLavoriDaEseguirePage.tsx` | Lavori da eseguire NEXT. |
| `src/next/NextLavoriEseguitiPage.tsx` | Lavori eseguiti NEXT. |
| `src/next/NextLavoriInAttesaPage.tsx` | Lavori in attesa NEXT. |
| `src/next/NextDettaglioLavoroPage.tsx` | Dettaglio lavoro NEXT. |
| `src/next/NextCisternaPage.tsx` | Cisterna Caravate NEXT. |
| `src/next/NextCisternaIAPage.tsx` | Cisterna IA NEXT. |
| `src/next/NextCisternaSchedeTestPage.tsx` | Cisterna schede test NEXT. |
| `src/next/NextIAApiKeyPage.tsx` | Config IA NEXT. |
| `src/next/NextIAArchivistaPage.tsx` | Shell/consumatore archivista NEXT; archivista interno non analizzato. |
| `src/next/NextIACoperturaLibrettiPage.tsx` | Copertura libretti NEXT. |
| `src/next/NextIADocumentiPage.tsx` | Documenti IA NEXT. |
| `src/next/NextIALibrettoPage.tsx` | Libretto IA NEXT. |
| `src/next/NextIntelligenzaArtificialePage.tsx` | Hub IA NEXT. |
| `src/next/internal-ai/NextEstrazioneLibretto.tsx` | UI estrazione libretto interna; trattata solo come UI esterna al perimetro archivista. |
| `src/next/NextLibrettiExportPage.tsx` | Export libretti NEXT. |
| `src/next/NextMappaStoricoPage.tsx` | Mappa/foto storico mezzo NEXT-only. |
| `src/next/NextStrumentiUnisciDocumentiPage.tsx` | Strumenti documenti NEXT. |
| `src/next/NextAutistiGatePage.tsx` | Gate autisti NEXT. |
| `src/next/NextAutistiLoginPage.tsx` | Login autisti NEXT. |
| `src/next/NextAutistiHomePage.tsx` | Home autisti NEXT. |
| `src/next/NextAutistiSetupMezzoPage.tsx` | Setup mezzo autista NEXT. |
| `src/next/NextAutistiControlloPage.tsx` | Controllo mezzo autista NEXT. |
| `src/next/NextAutistiCambioMezzoPage.tsx` | Cambio mezzo autista NEXT. |
| `src/next/NextAutistiAdminPage.tsx` | Admin autisti NEXT. |
| `src/next/NextAutistiInboxHomePage.tsx` | Inbox autisti NEXT. |
| `src/next/NextAutistiInboxControlliPage.tsx` | Inbox controlli NEXT. |
| `src/next/NextAutistiInboxSegnalazioniPage.tsx` | Inbox segnalazioni NEXT. |
| `src/next/NextAutistiInboxRichiestaAttrezzaturePage.tsx` | Inbox richieste attrezzature NEXT. |
| `src/next/NextAutistiInboxGommePage.tsx` | Inbox gomme NEXT. |
| `src/next/NextAutistiInboxCambioMezzoPage.tsx` | Inbox cambio mezzo NEXT. |
| `src/next/NextAutistiInboxLogAccessiPage.tsx` | Inbox log accessi NEXT. |
| `src/next/autisti/NextAutistiCloneLayout.tsx` | Layout clone autisti. |
| `src/next/autisti/NextHomeAutistaNative.tsx` | Home autista nativa. |
| `src/next/autisti/NextLoginAutistaNative.tsx` | Login autista nativo. |
| `src/next/autisti/NextSetupMezzoNative.tsx` | Setup mezzo nativo. |
| `src/next/autisti/NextAutistiRifornimentoPage.tsx` | Rifornimento autista nativo. |
| `src/next/autisti/NextAutistiSegnalazioniPage.tsx` | Segnalazioni autista native. |
| `src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx` | Richiesta attrezzature autista nativa. |
| `src/next/autisti/NextGommeAutistaModal.tsx` | Modal gomme autista nativo. |
| `src/next/autisti/NextModalGomme.tsx` | Modal gomme autista. |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx` | Admin autisti nativo. |
| `src/next/autistiInbox/NextAutistiInboxHomeNative.tsx` | Inbox home nativa. |
| `src/next/autistiInbox/NextAutistiControlliAllNative.tsx` | Tutti controlli autisti. |
| `src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx` | Tutte segnalazioni autisti. |
| `src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx` | Tutte richieste attrezzature. |
| `src/next/autistiInbox/NextAutistiGommeAllNative.tsx` | Tutti eventi gomme autisti. |
| `src/next/autistiInbox/NextCambioMezzoInboxNative.tsx` | Cambio mezzo inbox nativo. |
| `src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx` | Log accessi autisti. |
| `src/next/autistiInbox/components/NextRifornimentiCard.tsx` | Card rifornimenti inbox. |
| `src/next/autistiInbox/components/NextSessioniAttiveCard.tsx` | Card sessioni attive. |
| `src/next/components/NextAutistiEventoModal.tsx` | Modal evento autisti. |
| `src/next/components/NextHomeAutistiEventoModal.tsx` | Modal evento home autisti. |
| `src/next/components/NextScadenzeModal.tsx` | Modal scadenze. |
| `src/next/NextAreaPage.tsx` | Pagina area NEXT. |
| `src/next/NextAccessDeniedPage.tsx` | Access denied. |
| `src/next/NextClonePageScaffold.tsx` | Scaffold clone. |
| `src/next/NextDriverExperiencePage.tsx` | Driver experience. |
| `src/next/NextLegacyStorageBoundary.tsx` | Boundary lettura storage legacy. |
| `src/next/NextLegacyStructuralRedirects.tsx` | Redirect strutturali legacy. |
| `src/next/NextMotherPage.tsx` | Bridge madre; non e' target finale per moduli chiusi. |
| `src/next/NextOperativitaGlobalePage.tsx` | Operativita globale NEXT. |
| `src/next/NextPdfPreviewModal.tsx` | Modal preview PDF. |
| `src/next/NextRoleGuard.tsx` | Guard ruoli. |
| `src/next/NextRoleLandingRedirect.tsx` | Redirect ruoli. |
| `src/next/NextShell.tsx` | Shell NEXT. |

Moduli NEXT scriventi aperti/chiusi nella giornata verificati tramite codice e write barrier:

| Modulo | Writer / scrittura reale | Collection / storage | Campi NEXT-only o specifici |
|---|---|---|---|
| Materiali da ordinare / Acquisti | `src/next/NextMaterialiDaOrdinarePage.tsx:1140`, `:1164`; `src/next/NextProcurementReadOnlyPanel.tsx:258`, `:566`; `src/next/nextPreventivoManualeWriter.ts:228` | `storage/@ordini`, `@preventivi`, `@listino_prezzi`; storage `materiali/`, `preventivi/manuali/`, `preventivi/ia/` | foto materiale, righe ordine, stato arrivo, listino aggiornato, import IA/manuale preventivo. |
| Attrezzature Cantieri | `src/next/nextAttrezzatureCantieriWriter.ts:269`, `:353`; reader `src/next/domain/nextAttrezzatureCantieriDomain.ts:509` | `storage/@attrezzature_cantieri`; storage `attrezzature/` | tracking consegna/spostamento/ritiro, cantiere origine/destinazione, foto movimento, quality/flags. |
| Colleghi | `src/next/nextAnagraficheWriter.ts:170`, `:183`; reader `src/next/domain/nextColleghiDomain.ts:266` | `storage/@colleghi` | telefono privato, pin/puk SIM, schede carburante. |
| Fornitori | `src/next/nextAnagraficheWriter.ts:192`, `:207`; reader `src/next/domain/nextFornitoriDomain.ts:204` | `storage/@fornitori` | profilo fornitore usato da procurement e documenti. |
| Officine | `src/next/nextAnagraficheWriter.ts:216`, `:229` | `storage/@officine` | anagrafica officina NEXT-only. |
| Mezzi modal in dossier | `src/next/nextMezziWriter.ts:125`, `:157`; reader `src/next/nextAnagraficheFlottaDomain.ts:763`, `:880` | `storage/@mezzi_aziendali`; storage libretti/foto | edit campi anagrafici standard; modal mostra campi libretto raw svizzero da `src/next/components/NextMezzoEditModal.tsx:65`. |
| Cisterna Caravate | `src/next/nextCisternaWriter.ts:15`, `:30`, `:62`, `:69`, `:79`; reader `src/next/domain/nextCisternaDomain.ts:1240`, dettaglio `:842` | `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`; storage `documenti_pdf/cisterna/`, `documenti_pdf/cisterna_schede/` | parametri mese, duplicati, schede IA/manuali, righe targa-litri-autista-azienda, profili/costi mensili. |

## 6. MAPPA DATI NEXT

Entita NEXT identificate: 39.

| Entita NEXT | Fonte dati e campi principali |
|---|---|
| Mezzo NEXT | `readNextAnagraficheFlottaSnapshot` in `src/next/nextAnagraficheFlottaDomain.ts:763`; campi anagrafici madre piu quality/flags/source. |
| Libretto raw NEXT | `NextMezzoEditModal.tsx:65` alias: `numeroAvs`, `statoOrigine`, `indirizzo`, `localita`, `genereVeicolo`, `carrozzeria`, `numeroMatricola`, `approvazioneTipo`, `pesoVuoto`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `luogoDataRilascio`, `annotazioni`, `annotazioniCantonali`, `decisioniAutorita`. |
| Collega NEXT | `readNextColleghiSnapshot` `src/next/domain/nextColleghiDomain.ts:266`; include SIM e schede carburante. |
| Fornitore NEXT | `readNextFornitoriSnapshot` `src/next/domain/nextFornitoriDomain.ts:204`. |
| Officina NEXT | writer `src/next/nextAnagraficheWriter.ts:216`; reader dedicato non trovato nei tool attuali. |
| Lavoro NEXT | reader operativita tecnica, pagine lavori NEXT; campi lavoro madre normalizzati. |
| Manutenzione NEXT | `readNextMezzoManutenzioniSnapshot` `src/next/domain/nextManutenzioniDomain.ts:663`; writer `:982`, delete `:1012`. |
| Manutenzione programmata NEXT | campi su mezzo e snapshot manutenzioni: `enabled`, `dataInizio`, `dataFine`, `kmMax`, `contratto`, `status`, `daysToDeadline`. |
| Gomme NEXT | manutenzioni gomme e inbox gomme; eventi gomme e geometrie. |
| Rifornimento NEXT | `readNextRifornimentiReadOnlySnapshot` `src/next/domain/nextRifornimentiDomain.ts:1291`; unifica `@rifornimenti` e `@rifornimenti_autisti_tmp`. |
| Documento mezzo NEXT | `readNextMezzoDocumentiSnapshot` `src/next/domain/nextDocumentiMezzoDomain.ts:252`. |
| Documento/costo fleet NEXT | `readNextDocumentiCostiFleetSnapshot` `src/next/domain/nextDocumentiCostiDomain.ts:2247`; per mezzo `:2313`. |
| Archivio documenti IA NEXT | `readNextIADocumentiArchiveSnapshot` `src/next/domain/nextDocumentiCostiDomain.ts:2010`; non include analisi archivista interno. |
| Dossier mezzo composito | `readNextDossierMezzoCompositeSnapshot` `src/next/domain/nextDossierMezzoDomain.ts:747`. |
| Inventario NEXT | `readNextInventarioSnapshot` `src/next/domain/nextInventarioDomain.ts:235`. |
| Materiali/movimenti NEXT | `readNextMaterialiMovimentiSnapshot` `src/next/domain/nextMaterialiMovimentiDomain.ts:1125`; magazzino reale `:1630`. |
| Materiali da ordinare NEXT | `@ordini` in `NextMaterialiDaOrdinarePage.tsx:1140`; foto storage `materiali/` a `:990`, `:1059`. |
| Preventivo NEXT | `readNextProcurementSnapshot` `src/next/domain/nextProcurementDomain.ts:906`; writer manuale `src/next/nextPreventivoManualeWriter.ts:228`. |
| Listino NEXT | `@listino_prezzi` da procurement, prezzi attuali/storici/trend. |
| Ordine NEXT | `@ordini`, righe materiali con stato arrivo/foto/note. |
| Attrezzatura cantiere NEXT | `readNextAttrezzatureCantieriSnapshot` `src/next/domain/nextAttrezzatureCantieriDomain.ts:509`. |
| Cantiere/stato attrezzature | derivato da movimenti attrezzature: `statoAttuale`, `cantieri`, tracking gap. |
| Cisterna documento NEXT | reader `src/next/domain/nextCisternaDomain.ts:1240`, writer `src/next/nextCisternaWriter.ts:62`. |
| Cisterna scheda NEXT | reader dettaglio `src/next/domain/nextCisternaDomain.ts:842`, writer `src/next/nextCisternaWriter.ts:69`, `:79`. |
| Cisterna parametri mese NEXT | writer `src/next/nextCisternaWriter.ts:15`; collection `@cisterna_parametri_mensili`. |
| Cisterna support refuels NEXT | snapshot include supporto da `@rifornimenti_autisti_tmp`. |
| Sessione autista NEXT | `readNextAutistiReadOnlySnapshot` `src/next/domain/nextAutistiDomain.ts:1176`. |
| Segnalazione/controllo autista NEXT | stesso reader autisti, piu centro controllo `src/next/domain/nextCentroControlloDomain.ts:1627`. |
| Stato operativo NEXT | `readNextStatoOperativoSnapshot` `src/next/domain/nextCentroControlloDomain.ts:1657`. |
| Alert NEXT | `@alerts_state`, parzialmente consumato dalle pagine home/stato. |
| AdBlue/cisterne magazzino NEXT | `@cisterne_adblue` in `NextMagazzinoPage.tsx`; reader chat non dedicato. |
| Analisi economica salvata NEXT | `@analisi_economica_mezzi`, snapshot non esposto da tool dedicato. |
| Config IA NEXT | `@impostazioni_app/gemini`. |
| Copertura libretti NEXT | `NextIACoperturaLibrettiPage.tsx` e reader/libretti. |
| Mappa storico foto mezzo NEXT | `@mezzi_foto_viste`, `@mezzi_hotspot_mapping`, storage `mezzi_foto/`. |
| Euromecc task pending | `euromecc_pending`, reader `src/next/domain/nextEuromeccDomain.ts:394`. |
| Euromecc task done | `euromecc_done`, reader `src/next/domain/nextEuromeccDomain.ts:394`. |
| Euromecc issue | `euromecc_issues`, reader `src/next/domain/nextEuromeccDomain.ts:394`. |
| Euromecc meta/relazioni/componenti | `euromecc_area_meta`, `euromecc_extra_components`, `euromecc_relazioni`; page writes/reads relazioni in `NextEuromeccPage.tsx:1770`, `:2665`, `:2980`. |

NEXT-only rilevanti:

- Campi raw libretto svizzero nel modal mezzo: non presenti nella madre come campi UI ordinari e non esposti dal reader flotta standard.
- Schede cisterna IA/manuali, parametri mese, duplicati e report mensile.
- Movimenti attrezzature con cantiere sorgente/destinazione, foto e tracking.
- Anagrafiche officine.
- Euromecc task/issue/relazioni/componenti.
- Mappa storico foto/hotspot mezzo.
- AdBlue/cisterne magazzino.
- Stati review/riapertura nelle scriventi NEXT dove presenti nei moduli.

## 7. INCROCI NEXT E NEXT <-> MADRE

Incroci NEXT/cross identificati: 17.

1. NEXT mezzo -> madre `@mezzi_aziendali`: stesso dataset, reader NEXT normalizza.
2. NEXT mezzo -> libretto raw: stesso record mezzo, campi raw visibili nel modal.
3. NEXT mezzo -> dossier storico: `readNextDossierMezzoCompositeSnapshot`.
4. NEXT mezzo -> manutenzione programmata: campi su mezzo + snapshot manutenzioni.
5. NEXT mezzo -> rifornimenti: `readNextMezzoRifornimentiSnapshot` e reader fleet rifornimenti.
6. NEXT mezzo -> costi/documenti: documenti costi per targa.
7. NEXT mezzo -> materiali consegnati: material movements per targa/destinatario.
8. NEXT mezzo -> autisti/sessioni/segnalazioni/controlli: autisti domain + centro controllo.
9. NEXT autista/collega -> schede carburante: campo anagrafico collega.
10. NEXT fornitore -> procurement/listino/preventivi: procurement domain.
11. NEXT fornitore -> fatture/documenti: documenti/costi search per fornitore.
12. NEXT Materiali da ordinare -> fornitore/listino/preventivo/ordine.
13. NEXT Materiali da ordinare -> mezzo destinazione: richiesto da Giuseppe, ma campo destinazione mezzo non normalizzato nei reader letti.
14. NEXT Attrezzature Cantieri -> cantiere/materiale/foto/source cantiere.
15. NEXT Cisterna -> rifornimenti autisti per mese/targa/litri.
16. NEXT Cisterna -> documenti/schede/parametri mensili/report.
17. NEXT Euromecc -> task/issue/relazioni/componenti.

Totale incroci identificati (madre + NEXT/cross): 41.

## 8. CONFRONTO MADRE vs NEXT

| Entita | Esito confronto | Marcatura |
|---|---|---|
| Mezzo | Dataset condiviso `@mezzi_aziendali`; NEXT normalizza e aggiunge quality/flags. Campi raw libretto sono visibili nel modal ma non nel reader flotta standard. | Condiviso + NEXT-PRIORITARIO per raw libretto. |
| Collega/Autista | Dataset condiviso `@colleghi`; NEXT aggiunge gestione anagrafica convergente e mantiene SIM/schede carburante. Patente non trovata. | Condiviso; patente = dato non disponibile. |
| Fornitore | Dataset condiviso `@fornitori`; NEXT lo usa in procurement/anagrafiche. | Condiviso. |
| Officina | Scrittura NEXT su `@officine`; madre non risulta pagina autonoma. | NEXT-PRIORITARIO. |
| Lavori | Dataset madre riusato da NEXT; tool non coprono lista fleet lavori. | Condiviso con gap tool. |
| Manutenzioni | Dataset condiviso `@manutenzioni`; NEXT ha writer business e scheduled snapshot. | Condiviso; gap su scadenze fleet. |
| Rifornimenti | Dataset condiviso `@rifornimenti` + `@rifornimenti_autisti_tmp`; NEXT ha reader unificato. | Condiviso. |
| Documenti/costi | Dataset condivisi `@documenti_*`, `@costiMezzo`; NEXT ha reader costi/documenti. | Condiviso; gap ricerca globale fatture. |
| Procurement/materiali da ordinare | Dataset condivisi `@ordini`, `@preventivi`, `@listino_prezzi`; NEXT ha scritture aggiunte e foto materiali. | Condiviso + NEXT-PRIORITARIO per workflow NEXT. |
| Inventario/materiali consegnati | Dataset condivisi; NEXT ha reader puliti ma nessun tool dedicato. | Condiviso con gap tool. |
| Attrezzature cantieri | Dataset condiviso `@attrezzature_cantieri`; NEXT scrivente completo con reader quality. | NEXT-PRIORITARIO per tool chat. |
| Cisterna | Dataset specialistico; NEXT ha tre sotto-pagine e reader/report dedicati. | NEXT-PRIORITARIO. |
| Euromecc | Dataset NEXT-only. | NEXT-PRIORITARIO. |
| Mappa storico/foto/hotspot | Dataset NEXT-only. | NEXT-PRIORITARIO. |
| Analisi economica salvata | Madre e NEXT leggono costi/documenti; salvataggi `@analisi_economica_mezzi` non hanno tool diretto. | Condiviso con gap reader/tool. |

## 9. COPERTURA TOOL ATTUALE

Tool reali registrati: 37, da `src/next/chat-ia/tools/index.ts`.

| Gruppo dati | Tool attuali che coprono | Campi esposti | Campi/ricerche non esposte |
|---|---|---|---|
| Mezzo per targa | `get_vehicle_by_plate` (`toolGetVehicleByPlate.ts:13`), `get_vehicle_status`, `get_vehicle_dossier_snapshot`, `list_vehicles` | targa, categoria, marca/modello, autista, revisione, raw `vehicle` nel dettaglio. | ricerca per telaio/numero motore; lista con manutenzione programmata; filtro senza autista; raw libretto nei risultati tabellari. |
| Flotta | `list_vehicles` (`toolListVehicles.ts:26`) | targa, categoria, marca_modello, autista, scadenza revisione. | telaio, libretto, manutenzioneDataFine, manutenzioneKmMax, foto, note, stato manutenzione. |
| Manutenzioni mezzo | `get_vehicle_maintenance_history` (`toolGetVehicleMaintenanceHistory.ts:30`) | storico per targa, snapshot manutenzioni/operativita. | ricerca fleet mezzi in scadenza; calcolo dedicato giorni residui su tutte le targhe. |
| Stato mezzo | `get_vehicle_status` (`toolGetVehicleStatus.ts:16`) | stato operativo, alert e revisioni per targa. | non sostituisce lista scadenze manutenzione programmata. |
| Documenti/costi mezzo | `get_vehicle_documents`, `get_document_costs_by_vehicle`, `download_document_pdf`, `get_invoice_by_id` | documenti per targa, costi per targa, PDF, lookup id documento. | ricerca globale per numero fattura/fornitore/importo senza targa; fornitore di fattura se non si conosce id/targa. |
| Costi aggregati | `get_costs`, `get_cost_aggregates`, `get_capo_costs_by_vehicle`, `get_procurement_costs` | costi documentali, aggregati, procurement. | totale annuale robusto cross-source richiede composizione e validazione dedup. |
| Rifornimenti | `get_refuelings`, `get_refuelings_aggregated`, `compare_refueling_sources`, `get_consumption_average`, `compare_periods`, `find_outliers`, `compute_average` | rifornimenti per targa/fleet, medie, outlier, confronto fonti. | query semantiche su destinazione materiale/cisterna non coperte oltre report cisterna. |
| Cisterna | `get_cisterna_snapshot`, `get_cisterna_documents`, `get_cisterna_refuelings` | snapshot mese, documenti, schede/support refuels, costi/report. | giacenza/livello fisico non trovato nei dati; tool dedicato a livelli assente. |
| Autisti/colleghi | `list_drivers`, `get_driver_by_name`, `get_driver_by_badge`, `get_driver_activity` | nome, badge, profilo collega, attivita da reader autisti. | patente/scadenza patente; lista scadenze autisti; query SIM/schede carburante non dedicate. |
| Eventi operativi | `get_historical_operational_events`, `get_vehicle_events`, `get_driver_activity` | eventi storici e per targa/autista. | ricerca globale multi-parametro su segnalazioni/controlli/richieste/gomme. |
| Procurement | `get_procurement_costs` | preventivi, ordini, listino, approvazioni. | materiali da ordinare in attesa per mezzo/destinazione; tool diretto fornitori/listino per profilo. |
| Magazzino/inventario | `open_magazzino_section` solo navigazione. | nessun dato tabellare da chat. | inventario, materiali consegnati, AdBlue, movimenti materiali non interrogabili direttamente. |
| Attrezzature cantieri | Nessun tool dati. | Nessuno. | cantiere, attrezzatura, stato, foto, movimenti non interrogabili. |
| Euromecc | Nessun tool. | Nessuno. | task, issue, componenti, relazioni non interrogabili. |
| Report archivio chat | `generate_report_pdf`, `save_report_to_archive`, `list_archived_reports`, `retrieve_archived_report`, `delete_archived_report` | report generati dalla chat. | non copre dati gestionali primari. |
| Navigazione | `navigate_to`, `open_dossier_page`, `open_magazzino_section` | URL/azione UI. | non fornisce dati. |

## 10. CASI SPECIFICI DICHIARATI DA GIUSEPPE

| Caso | Fattibile oggi | Tool attuale | Esito tecnico |
|---|---:|---|---|
| a) Trova mezzo per numero telaio | NO | Nessuno | `readNextAnagraficheFlottaSnapshot` espone `telaio`, ma `list_vehicles` non cerca nel campo e `get_vehicle_by_plate` richiede targa. GAP-A. |
| b) Numero telaio del mezzo TI282780 | SI | `get_vehicle_by_plate` | Il tool restituisce `vehicle` completo da `readNextMezzoByTarga`; la card non mostra il telaio, ma il payload lo contiene se presente nel record. |
| c) Lista mezzi con manutenzione programmata in scadenza | NO | Nessuno diretto | I dati sono su `@mezzi_aziendali`/snapshot manutenzioni, ma manca tool fleet-wide. GAP-C. |
| d) Quanti giorni mancano alla prossima manutenzione del mezzo X | PARZIALE | `get_vehicle_by_plate` o `get_vehicle_maintenance_history` | Il dato data fine/status puo emergere, ma manca comando dedicato e calcolo stabile in output. GAP-C. |
| e) Lista autisti con patente in scadenza | NO | Nessuno | Nei campi `@colleghi`/reader non e' stato trovato campo patente o scadenza patente. GAP-D. |
| f) Mezzi senza autista assegnato | PARZIALE | `list_vehicles` | Il tool elenca `autista_assegnato_nome`, ma non ha filtro dedicato. GAP-A. |
| g) Costi totali mezzo TI282780 nel 2026 | SI/PARZIALE | `get_document_costs_by_vehicle` | Possibile per targa e periodo se il tool restituisce vista periodo; per totale robusto cross-source serve tool composito. GAP-C migliorativo. |
| h) Materiali da ordinare in attesa per il mezzo X | NO | Nessuno | Procurement espone ordini/materiali, ma non relazione normalizzata mezzo/destinazione. GAP-B/C. |
| i) Stato cisterna Caravate aprile 2026 | SI | `get_cisterna_snapshot` con `monthKey: "2026-04"` | Snapshot mese include documenti, schede, supporto autisti, costi e parametri. |
| j) Attrezzature assegnate al cantiere X | NO | Nessuno | Reader esiste, tool assente. GAP-A. |
| k) Fornitore di una specifica fattura | PARZIALE | `get_invoice_by_id`, `get_document_costs_by_vehicle` | Fattibile con id/targa noti; ricerca globale per numero fattura/fornitore non coperta. GAP-C/A. |
| l) Euromecc task/issue aperti | NO | Nessuno | Reader NEXT esiste per parte dei dati, tool assente. GAP-A. |
| m) Inventario sotto soglia o materiale disponibile | NO | Nessuno dati | Reader esiste, tool assente. GAP-A. |
| n) Schede carburante associate a un collega | PARZIALE | `get_driver_by_name`/`get_driver_by_badge` | Il profilo puo contenere campi, ma non c'e tool dedicato/filtro. |

## 11. GAP IDENTIFICATI

Conteggio per categoria:

- GAP-A: 14.
- GAP-B: 6.
- GAP-C: 7.
- GAP-D: 3.

Conteggio per livello:

- MADRE-ONLY: 1.
- NEXT-ONLY: 11.
- Condiviso madre/NEXT: 18.

| ID | Cat. | Livello | Gap | Soluzione |
|---|---|---|---|---|
| A1 | GAP-A | Condiviso | Ricerca mezzo per `telaio` non disponibile nei tool. | Nuovo tool `search_vehicles_by_attribute`; reader `src/next/nextAnagraficheFlottaDomain.ts:763`. |
| A2 | GAP-A | Condiviso | Lista mezzi senza autista non filtrabile direttamente. | Estendere `list_vehicles` o nuovo `list_vehicles_without_driver`. |
| A3 | GAP-A | NEXT-ONLY | Attrezzature cantieri non interrogabili. | Nuovo `get_site_equipment`; reader `src/next/domain/nextAttrezzatureCantieriDomain.ts:509`. |
| A4 | GAP-A | Condiviso | Fornitori non interrogabili come profilo diretto. | Nuovo `list_suppliers`/`get_supplier`; reader `src/next/domain/nextFornitoriDomain.ts:204`. |
| A5 | GAP-A | Condiviso | Inventario non interrogabile dalla chat. | Nuovo `list_inventory`; reader `src/next/domain/nextInventarioDomain.ts:235`. |
| A6 | GAP-A | Condiviso | Materiali consegnati/movimenti non interrogabili. | Nuovo `get_material_movements`; reader `src/next/domain/nextMaterialiMovimentiDomain.ts:1125`. |
| A7 | GAP-A | NEXT-ONLY | AdBlue/cisterne magazzino non interrogabili. | Nuovo reader/tool `get_adblue_tank_events`. |
| A8 | GAP-A | NEXT-ONLY | Euromecc task/issue non interrogabili. | Nuovo `get_euromecc_snapshot`; reader `src/next/domain/nextEuromeccDomain.ts:394`. |
| A9 | GAP-A | NEXT-ONLY | Officine scritte da NEXT ma non interrogabili. | Nuovo reader/tool `list_workshops`; writer `src/next/nextAnagraficheWriter.ts:216`. |
| A10 | GAP-A | Condiviso | Analisi economiche salvate non richiamabili come record. | Nuovo `get_saved_economic_analysis`; datasource `@analisi_economica_mezzi`. |
| A11 | GAP-A | Condiviso | Ricerca globale documenti/fatture per numero/fornitore/importo non dedicata. | Nuovo `search_documents_and_invoices`; reader `src/next/domain/nextDocumentiCostiDomain.ts:2010`, `:2247`. |
| A12 | GAP-A | Condiviso | Ricerca globale eventi autisti/segnalazioni/controlli/richieste non dedicata. | Nuovo `search_operational_events`; reader `src/next/domain/nextAutistiDomain.ts:1176`, centro controllo `:1627`. |
| A13 | GAP-A | Condiviso | Lavori aperti/chiusi/in attesa non interrogabili fleet-wide dalla chat. | Nuovo `search_work_orders`; reader operativita tecnica. |
| A14 | GAP-A | MADRE-ONLY | Override geometria gomme `@wheelGeom_override_v1` non interrogabile. | Nuovo `get_wheel_geometry_config` o reader se il dato resta utile. |
| B1 | GAP-B | NEXT-ONLY | Campi raw libretto svizzero visibili nel modal non esposti dal reader flotta standard. | Estendere `readNextAnagraficheFlottaSnapshot` o creare reader raw; alias in `src/next/components/NextMezzoEditModal.tsx:65`. |
| B2 | GAP-B | NEXT-ONLY | Materiali da ordinare non hanno relazione normalizzata `targa`/destinazione mezzo nei reader procurement letti. | Estendere schema/reader `readNextProcurementSnapshot` `src/next/domain/nextProcurementDomain.ts:906`. |
| B3 | GAP-B | Condiviso | `@analisi_economica_mezzi` non ha reader chat-safe dedicato. | Creare `readNextAnalisiEconomicaSavedSnapshot`. |
| B4 | GAP-B | Condiviso | `@alerts_state` non esposto come reader/tool autonomo. | Creare `readNextAlertsStateSnapshot` o estendere stato operativo. |
| B5 | GAP-B | NEXT-ONLY | `@cisterne_adblue` non ha reader chat-safe dedicato. | Creare `readNextAdBlueSnapshot`. |
| B6 | GAP-B | NEXT-ONLY | `@mezzi_foto_viste` e `@mezzi_hotspot_mapping` non hanno reader chat-safe dedicato. | Creare `readNextMappaStoricoSnapshot`. |
| C1 | GAP-C | Condiviso | Manutenzione programmata fleet-wide in scadenza richiede combinazione flotta + scheduled maintenance. | Nuovo `list_scheduled_maintenance_due`. |
| C2 | GAP-C | Condiviso | Totale costi annuale robusto per mezzo richiede dedup documenti/costi/procurement/capo. | Nuovo `get_vehicle_cost_summary`. |
| C3 | GAP-C | NEXT-ONLY | Materiali da ordinare per mezzo/destinazione richiede procurement + eventuale schema destinazione. | Nuovo `get_procurement_materials_by_destination`, dopo B2. |
| C4 | GAP-C | NEXT-ONLY | Riconciliazione cisterna documenti/schede/rifornimenti richiede tool narrativo/composito. | Nuovo `reconcile_cisterna_month`; puo riusare `readNextCisternaSnapshot` `src/next/domain/nextCisternaDomain.ts:1240`. |
| C5 | GAP-C | Condiviso | Fornitore di fattura da numero/id ambiguo richiede search globale documenti + costi. | Nuovo `find_invoice_supplier`. |
| C6 | GAP-C | Condiviso | Timeline mezzo completa da lavori, manutenzioni, rifornimenti, documenti, autisti non e' un tool unico. | Nuovo `get_vehicle_timeline_360`. |
| C7 | GAP-C | Condiviso | Profilo operativo autista completo richiede anagrafica + sessioni + eventi + mezzi. | Nuovo `get_driver_operational_profile`. |
| D1 | GAP-D | Condiviso | Scadenza patente autista non trovata nei dati `@colleghi`/reader/pagine aperte. | Non disponibile dai dati attuali; serve nuovo campo e writer. |
| D2 | GAP-D | Condiviso | Numero motore mezzo non trovato come campo strutturato nei modelli aperti. | Non disponibile dai dati attuali; forse recuperabile solo da testo/raw libretto se presente. |
| D3 | GAP-D | NEXT-ONLY | Livello/giacenza fisica cisterna non trovato come dato persistito; esistono documenti, schede, litri e costi. | Non disponibile dai dati attuali. |

## 12. NUOVI TOOL PROPOSTI

Priorita ALTA: 10.

| Tool proposto | Parametri | Output | Reader |
|---|---|---|---|
| `search_vehicles_by_attribute` | `query`, `field?: targa/telaio/marca/modello/autista/rawLibretto` | lista mezzi con campi matchati | `src/next/nextAnagraficheFlottaDomain.ts:763`; estensione B1 per raw. |
| `list_scheduled_maintenance_due` | `entroGiorni?`, `status?`, `categoria?` | mezzi scaduti/in scadenza con giorni residui | flotta `:763` + manutenzioni `src/next/domain/nextManutenzioniDomain.ts:663`. |
| `get_vehicle_scheduled_maintenance` | `targa` | data fine, giorni residui, km max, contratto, stato | `readNextMezzoByTarga` `src/next/nextAnagraficheFlottaDomain.ts:880`. |
| `get_site_equipment` | `cantiere`, `tipo?`, `categoria?`, `stato?` | attrezzature assegnate e movimenti | `src/next/domain/nextAttrezzatureCantieriDomain.ts:509`. |
| `get_procurement_materials_by_destination` | `targa?`, `destinazione?`, `stato?`, `fornitore?` | materiali in attesa/arrivati, ordine, fornitore | `src/next/domain/nextProcurementDomain.ts:906` dopo B2. |
| `search_documents_and_invoices` | `numero?`, `fornitore?`, `targa?`, `periodo?`, `importo?`, `tipo?` | documenti/fatture con fornitore e PDF | `src/next/domain/nextDocumentiCostiDomain.ts:2010`, `:2247`. |
| `list_inventory` | `testo?`, `fornitore?`, `stockStatus?` | articoli inventario e quantita | `src/next/domain/nextInventarioDomain.ts:235`. |
| `get_material_movements` | `targa?`, `destinatario?`, `materiale?`, `periodo?` | consegne/movimenti materiali | `src/next/domain/nextMaterialiMovimentiDomain.ts:1125`. |
| `list_suppliers` | `testo?`, `conAcquisti?` | profili fornitori e collegamenti procurement | `src/next/domain/nextFornitoriDomain.ts:204`. |
| `get_vehicle_cost_summary` | `targa`, `periodo`, `includeProcurement?` | totale, subtotali, fonti, dedup | `src/next/domain/nextDocumentiCostiDomain.ts:2313` + procurement `:906`. |

Priorita MEDIA: 9.

| Tool proposto | Parametri | Output | Reader |
|---|---|---|---|
| `list_vehicles_without_driver` | `categoria?` | mezzi senza `autistaNome` | flotta `src/next/nextAnagraficheFlottaDomain.ts:763`. |
| `get_colleague_profile` | `nome?`, `badge?` | telefono, SIM, schede carburante | `src/next/domain/nextColleghiDomain.ts:266`. |
| `get_adblue_tank_events` | `periodo?`, `impianto?` | eventi/stock AdBlue | nuovo reader B5. |
| `get_euromecc_snapshot` | `area?`, `state?` | task, done, issue | `src/next/domain/nextEuromeccDomain.ts:394`, piu relazioni se estese. |
| `get_saved_economic_analysis` | `targa?`, `periodo?` | analisi salvate | nuovo reader B3. |
| `search_operational_events` | `targa?`, `autista?`, `tipo?`, `periodo?`, `testo?` | eventi operativi | autisti `src/next/domain/nextAutistiDomain.ts:1176`, centro controllo `:1627`. |
| `search_work_orders` | `targa?`, `stato?`, `urgenza?`, `testo?` | lavori aperti/chiusi/in attesa | reader operativita tecnica. |
| `get_fleet_tire_events` | `targa?`, `periodo?`, `tipo?` | eventi/interventi gomme | manutenzioni/gomme domain. |
| `list_workshops` | `testo?`, `citta?` | officine | nuovo reader per `@officine`. |

Priorita BASSA: 5.

| Tool proposto | Parametri | Output | Reader |
|---|---|---|---|
| `get_vehicle_visual_map` | `targa` | foto viste/hotspot | nuovo reader B6. |
| `get_wheel_geometry_config` | `targa?`, `categoria?` | override geometrie | nuovo reader per `@wheelGeom_override_v1`. |
| `get_ia_config_status` | nessuno | stato config senza segreti | `@impostazioni_app/gemini`. |
| `open_vehicle_edit_modal` | `targa` | azione UI | navigazione dossier + modal, senza lettura nuova. |
| `explain_data_coverage` | `entita?` | copertura tool/dati | report statico/registry. |

## 13. ESTENSIONI READER PROPOSTE

| Priorita | Reader/estensione | Motivo |
|---|---|---|
| ALTA | Estendere `readNextAnagraficheFlottaSnapshot` `src/next/nextAnagraficheFlottaDomain.ts:763` con campi raw libretto opzionali. | Coprire telaio avanzato, campi libretto svizzero, possibili numero motore/raw. |
| ALTA | Nuovo `readNextFleetScheduledMaintenanceSnapshot`. | Evitare che ogni tool ricostruisca scadenze manutenzione da flotta/storico. |
| ALTA | Estendere `readNextProcurementSnapshot` `src/next/domain/nextProcurementDomain.ts:906` con destinazione/targa se presente nei dati ordine. | Abilitare materiali in attesa per mezzo/destinazione. |
| ALTA | Nuovo `readNextDocumentsSearchIndex`. | Ricerca globale fatture/documenti per numero, fornitore, importo, targa. |
| MEDIA | Nuovo `readNextAdBlueSnapshot`. | Dati `@cisterne_adblue` ora non coperti. |
| MEDIA | Nuovo `readNextOfficineSnapshot`. | Scrittura `@officine` esiste, chat non legge. |
| MEDIA | Estendere `readEuromeccSnapshot` `src/next/domain/nextEuromeccDomain.ts:394` con `euromecc_relazioni` e `euromecc_extra_components`. | Coprire l'intero modulo Euromecc. |
| MEDIA | Nuovo `readNextAnalisiEconomicaSavedSnapshot`. | Recuperare analisi salvate. |
| MEDIA | Nuovo `readNextAlertsStateSnapshot`. | Rendere interrogabili alert/promemoria persistiti. |
| BASSA | Nuovo `readNextMappaStoricoSnapshot`. | Rendere interrogabili viste/hotspot foto mezzo. |

## 14. RACCOMANDAZIONI E PRIORITA

Ordine operativo raccomandato:

1. Implementare `search_vehicles_by_attribute` e `list_scheduled_maintenance_due`: chiudono i casi espliciti telaio e manutenzione programmata.
2. Implementare `get_vehicle_scheduled_maintenance` e filtro mezzi senza autista: coprono domande quotidiane sulla flotta.
3. Implementare `get_site_equipment`: copre modulo NEXT scrivente non coperto.
4. Implementare `search_documents_and_invoices` e `get_vehicle_cost_summary`: riducono ambiguita fatture/costi.
5. Implementare tool magazzino/procurement: `list_inventory`, `get_material_movements`, `get_procurement_materials_by_destination`.
6. Implementare `list_suppliers` e `get_colleague_profile`.
7. Coprire Euromecc, AdBlue, officine, analisi economiche salvate, mappa storico.

Nota sui GAP-D: patente, numero motore strutturato e livello fisico cisterna non possono essere chiusi solo con tool se il dato non viene prima scritto o normalizzato.

## 15. STIMA EFFORT

| Gruppo | Effort | Note |
|---|---:|---|
| Ricerca mezzo per attributo + telaio | S | Reader gia espone `telaio`; estensione raw libretto puo portarlo a M. |
| Manutenzione programmata fleet + per mezzo | M | Richiede normalizzazione date/status e test su soglie. |
| Attrezzature cantieri tool | S | Reader gia pronto. |
| Documenti/fatture search globale | M | Serve indice search e gestione duplicati. |
| Cost summary annuale robusto | L | Dedup cross-source e subtotali. |
| Procurement materiali per destinazione | L | Campo destinazione/targa va verificato o introdotto. |
| Inventario/materiali movimenti | M | Reader pronti, query multiple. |
| Fornitori/colleghi profili | S | Reader pronti. |
| Euromecc completo | M/L | Reader parziale pronto, relazioni/componenti da includere. |
| AdBlue/officine/alert/mappa storico | M | Reader mancanti. |
| Patente/numero motore/livello cisterna | XL se richiesti come dati nuovi | Serve modello dati, UI/writer e poi tool. |

## 16. APPENDICE: FILE LETTI

Documenti:

- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/_live/STATO_MIGRAZIONE_NEXT.md`
- `docs/_live/data/DOMINI_DATI_CANONICI.md`
- `docs/_live/data/MAPPA_COMPLETA_DATI.md`
- `docs/_live/data/REGOLE_STRUTTURA_DATI.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md`
- `docs/product/TOOL_REGISTRY_CHAT_IA_NEXT.md`

Configurazione e datasource:

- `src/firebase.ts`
- `src/utils/storageSync.ts`
- `src/utils/cloneWriteBarrier.ts`
- scan storage keys e collection literal su `src/**/*.ts` e `src/**/*.tsx`, esclusi backend e chat IA non necessaria.

Pagine madre:

- Tutti i 41 file elencati nella sezione 2 sotto `src/pages/**/*.tsx`.

Pagine NEXT:

- Tutti i 104 file `src/next/**/Next*.tsx` elencati nella sezione 5, escluso `src/next/chat-ia/*`.

Reader/writer NEXT principali:

- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/nextMezziWriter.ts`
- `src/next/nextAnagraficheWriter.ts`
- `src/next/domain/nextColleghiDomain.ts`
- `src/next/domain/nextFornitoriDomain.ts`
- `src/next/domain/nextAttrezzatureCantieriDomain.ts`
- `src/next/nextAttrezzatureCantieriWriter.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/nextPreventivoManualeWriter.ts`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/nextCisternaWriter.ts`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextDocumentiMezzoDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextEuromeccDomain.ts`

Tool registry reale:

- `src/next/chat-ia/tools/index.ts`
- `src/next/chat-ia/tools/registry/*.ts`

Tool reali registrati e verificati:

1. `compare_periods`
2. `compare_refueling_sources`
3. `compute_average`
4. `delete_archived_report`
5. `download_document_pdf`
6. `find_outliers`
7. `generate_report_pdf`
8. `get_capo_costs_by_vehicle`
9. `get_cisterna_documents`
10. `get_cisterna_refuelings`
11. `get_cisterna_snapshot`
12. `get_consumption_average`
13. `get_cost_aggregates`
14. `get_costs`
15. `get_document_costs_by_vehicle`
16. `get_driver_activity`
17. `get_driver_by_badge`
18. `get_driver_by_name`
19. `get_historical_operational_events`
20. `get_invoice_by_id`
21. `get_procurement_costs`
22. `get_refuelings`
23. `get_refuelings_aggregated`
24. `get_vehicle_by_plate`
25. `get_vehicle_documents`
26. `get_vehicle_dossier_snapshot`
27. `get_vehicle_events`
28. `get_vehicle_maintenance_history`
29. `get_vehicle_status`
30. `list_archived_reports`
31. `list_drivers`
32. `list_vehicles`
33. `navigate_to`
34. `open_dossier_page`
35. `open_magazzino_section`
36. `retrieve_archived_report`
37. `save_report_to_archive`

Conferme finali:

- Archivista interno non analizzato.
- `backend/*` non analizzato.
- Nessun file codice runtime modificato.
