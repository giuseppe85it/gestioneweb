# Audit Modali NEXT vs Firestore vs Tool Chat IA
Data: 2026-04-30
Auditor: Codex (autonomo)
Metodo: dal modale al tool, esaustivo nel perimetro consentito

## Sommario
- Stato audit: AUDIT PARZIALE
- Motivo stato: Archivista non analizzato per divieto esplicito del prompt.
- N. modali/form NEXT censiti con scrittura Firestore o upload Storage: 41
- N. path Firestore mappati: 29
- N. modali con tool dedicato OK: 29
- N. modali con GAP: 12
- GAP_NESSUN_TOOL: 6
- GAP_CAMPI_NON_LETTI: 1
- GAP_PATH_DIVERSO: 0
- GAP_FILTRO_SBAGLIATO: 5

## Tabella Master
| Modale | File | Operazione | Path Firestore | Campi Scritti | Tool Chat | Campi Letti | GAP |
|---|---|---|---|---|---|---|---|
| NextAnagraficaModal (collega) | src/next/components/NextAnagraficaModal.tsx | create, update, delete | storage/@colleghi | storage/@colleghi: id, nome, telefono, telefonoPrivato, badge, descrizione, codice, pinSim, pukSim, schedeCarburante | storage/@colleghi: list_drivers, get_driver_by_name, get_driver_by_badge, get_driver_operational_profile | storage/@colleghi: id, nome, telefono, telefonoPrivato, badge, descrizione, codice, pinSim, pukSim, schedeCarburante | OK |
| NextAnagraficaModal (fornitore) | src/next/components/NextAnagraficaModal.tsx | create, update, delete | storage/@fornitori | storage/@fornitori: id, nome, telefono, descrizione | storage/@fornitori: list_suppliers, get_procurement_costs | storage/@fornitori: id, nome, telefono, badge, codice, descrizione | OK |
| NextAnagraficaModal (officina) | src/next/components/NextAnagraficaModal.tsx | create, update, delete | storage/@officine | storage/@officine: id, nome, telefono, telefoniAggiuntivi, descrizione, citta | storage/@officine: list_workshops | storage/@officine: id, nome, telefono, telefoniAggiuntivi, citta | GAP_CAMPI_NON_LETTI |
| NextMezzoEditModal | src/next/components/NextMezzoEditModal.tsx | update, delete | storage/@mezzi_aziendali | storage/@mezzi_aziendali: tipo, categoria, anno, targa, marca, modello, marcaModello, telaio, colore, cilindrata, potenza, massaComplessiva, proprietario, assicurazione, dataImmatricolazione, dataScadenzaRevisione, dataUltimoCollaudo, manutenzioneProgrammata, manutenzioneDataInizio, manutenzioneDataFine, manutenzioneKmMax, manutenzioneContratto, note, autistaId, autistaNome | storage/@mezzi_aziendali: list_vehicles, get_vehicle_by_plate, search_vehicles_by_attribute, get_vehicle_status, list_scheduled_maintenance_due, get_vehicle_dossier_snapshot | storage/@mezzi_aziendali: id, tipo, categoria, anno, targa, marca, modello, marcaModello, telaio, colore, cilindrata, potenza, massaComplessiva, proprietario, assicurazione, dataImmatricolazione, dataScadenzaRevisione, dataUltimoCollaudo, manutenzioneProgrammata, manutenzioneDataInizio, manutenzioneDataFine, manutenzioneKmMax, manutenzioneContratto, note, autistaId, autistaNome, fotoUrl, fotoPath, librettoUrl, librettoStoragePath, libretto_raw, prenotazioneCollaudo, preCollaudo | GAP_FILTRO_SBAGLIATO |
| NextScadenzeCollaudiPage (prenotazione collaudo) | src/next/NextScadenzeCollaudiPage.tsx | create, update, delete | storage/@mezzi_aziendali | storage/@mezzi_aziendali: prenotazioneCollaudo.data, prenotazioneCollaudo.ora, prenotazioneCollaudo.luogo, prenotazioneCollaudo.note | storage/@mezzi_aziendali: list_vehicles, get_vehicle_by_plate, search_vehicles_by_attribute, get_vehicle_status, list_scheduled_maintenance_due, get_vehicle_dossier_snapshot | storage/@mezzi_aziendali: id, tipo, categoria, anno, targa, marca, modello, marcaModello, telaio, colore, cilindrata, potenza, massaComplessiva, proprietario, assicurazione, dataImmatricolazione, dataScadenzaRevisione, dataUltimoCollaudo, manutenzioneProgrammata, manutenzioneDataInizio, manutenzioneDataFine, manutenzioneKmMax, manutenzioneContratto, note, autistaId, autistaNome, fotoUrl, fotoPath, librettoUrl, librettoStoragePath, libretto_raw, prenotazioneCollaudo, preCollaudo | GAP_FILTRO_SBAGLIATO |
| NextScadenzeCollaudiPage (pre-collaudo) | src/next/NextScadenzeCollaudiPage.tsx | create, update | storage/@mezzi_aziendali | storage/@mezzi_aziendali: preCollaudo.data, preCollaudo.officina, preCollaudo.lavoriPrevisti | storage/@mezzi_aziendali: list_vehicles, get_vehicle_by_plate, search_vehicles_by_attribute, get_vehicle_status, list_scheduled_maintenance_due, get_vehicle_dossier_snapshot | storage/@mezzi_aziendali: id, tipo, categoria, anno, targa, marca, modello, marcaModello, telaio, colore, cilindrata, potenza, massaComplessiva, proprietario, assicurazione, dataImmatricolazione, dataScadenzaRevisione, dataUltimoCollaudo, manutenzioneProgrammata, manutenzioneDataInizio, manutenzioneDataFine, manutenzioneKmMax, manutenzioneContratto, note, autistaId, autistaNome, fotoUrl, fotoPath, librettoUrl, librettoStoragePath, libretto_raw, prenotazioneCollaudo, preCollaudo | GAP_FILTRO_SBAGLIATO |
| NextScadenzeCollaudiPage (revisione completata) | src/next/NextScadenzeCollaudiPage.tsx | update | storage/@mezzi_aziendali | storage/@mezzi_aziendali: dataUltimoCollaudo, dataScadenzaRevisione, prenotazioneCollaudo.completata, prenotazioneCollaudo.completataIl, prenotazioneCollaudo.esito, prenotazioneCollaudo.noteEsito, note | storage/@mezzi_aziendali: list_vehicles, get_vehicle_by_plate, search_vehicles_by_attribute, get_vehicle_status, list_scheduled_maintenance_due, get_vehicle_dossier_snapshot | storage/@mezzi_aziendali: id, tipo, categoria, anno, targa, marca, modello, marcaModello, telaio, colore, cilindrata, potenza, massaComplessiva, proprietario, assicurazione, dataImmatricolazione, dataScadenzaRevisione, dataUltimoCollaudo, manutenzioneProgrammata, manutenzioneDataInizio, manutenzioneDataFine, manutenzioneKmMax, manutenzioneContratto, note, autistaId, autistaNome, fotoUrl, fotoPath, librettoUrl, librettoStoragePath, libretto_raw, prenotazioneCollaudo, preCollaudo | GAP_FILTRO_SBAGLIATO |
| NextPreventivoManualeModal | src/next/NextPreventivoManualeModal.tsx | create, upload | storage/@preventivi, storage/@listino_prezzi | storage/@preventivi: id, fonte, fornitoreId, fornitoreNome, numeroPreventivo, dataPreventivo, righe, valuta, imageStoragePaths, imageUrls, pdfStoragePath, pdfUrl, createdAt, updatedAt<br>storage/@listino_prezzi: id, fornitoreId, fornitoreNome, articoloCanonico, codiceArticolo, unita, prezzoAttuale, valuta, preventivoId, updatedAt | storage/@preventivi: get_procurement_costs, list_suppliers<br>storage/@listino_prezzi: get_procurement_costs, list_suppliers | storage/@preventivi: id, fonte, fornitoreId, fornitoreNome, numeroPreventivo, dataPreventivo, righe, valuta, imageStoragePaths, imageUrls, pdfStoragePath, pdfUrl, createdAt, updatedAt<br>storage/@listino_prezzi: id, fornitoreId, fornitoreNome, articoloCanonico, codiceArticolo, unita, prezzoAttuale, valuta, preventivoId, updatedAt | OK |
| NextPreventivoIaModal | src/next/NextPreventivoIaModal.tsx | create, upload | storage/@preventivi, storage/@listino_prezzi | storage/@preventivi: id, fonte, fornitoreId, fornitoreNome, numeroPreventivo, dataPreventivo, righe, valuta, imageStoragePaths, imageUrls, pdfStoragePath, pdfUrl, createdAt, updatedAt<br>storage/@listino_prezzi: id, fornitoreId, fornitoreNome, articoloCanonico, codiceArticolo, unita, prezzoAttuale, valuta, preventivoId, updatedAt | storage/@preventivi: get_procurement_costs, list_suppliers<br>storage/@listino_prezzi: get_procurement_costs, list_suppliers | storage/@preventivi: id, fonte, fornitoreId, fornitoreNome, numeroPreventivo, dataPreventivo, righe, valuta, imageStoragePaths, imageUrls, pdfStoragePath, pdfUrl, createdAt, updatedAt<br>storage/@listino_prezzi: id, fornitoreId, fornitoreNome, articoloCanonico, codiceArticolo, unita, prezzoAttuale, valuta, preventivoId, updatedAt | OK |
| ChatIaReportModal | src/next/chat-ia/components/ChatIaReportModal.tsx | create, upload, delete | chat_ia_reports | chat_ia_reports: version, status, prompt, title, sector, targetKind, targetValue, periodFrom, periodTo, summary, blocks, pdfUrl, pdfStoragePath, createdAt, updatedAt, meta, deletedAt | chat_ia_reports: list_archived_reports, retrieve_archived_report, save_report_to_archive, delete_archived_report | chat_ia_reports: version, status, prompt, title, sector, targetKind, targetValue, periodFrom, periodTo, summary, blocks, pdfUrl, pdfStoragePath, createdAt, updatedAt, meta, deletedAt | OK |
| NextAttrezzatureCantieriWritePanel | src/next/NextAttrezzatureCantieriWritePanel.tsx | create, update, delete, upload | storage/@attrezzature_cantieri | storage/@attrezzature_cantieri: id, tipo, data, materialeCategoria, descrizione, quantita, unita, cantiereId, cantiereLabel, note, fotoUrl, fotoStoragePath, sourceCantiereId, sourceCantiereLabel | storage/@attrezzature_cantieri: get_site_equipment | storage/@attrezzature_cantieri: id, tipo, data, timestamp, materialeCategoria, descrizione, quantita, unita, cantiereId, cantiereLabel, note, fotoUrl, fotoStoragePath, sourceCantiereId, sourceCantiereLabel | OK |
| NextManutenzioniPage (form manutenzione) | src/next/NextManutenzioniPage.tsx | create, update | storage/@manutenzioni, storage/@inventario, storage/@materialiconsegnati | storage/@manutenzioni: id, targa, tipo, fornitore, km, ore, sottotipo, descrizione, eseguito, data, materiali, importo, gommeInterventoTipo, gommeStraordinario, assiCoinvolti, gommePerAsse, sourceDocumentId<br>storage/@inventario: quantita, quantitaTotale, stockKey<br>storage/@materialiconsegnati: id, tipo, direzione, data, materialeId, inventarioRefId, materialeLabel, descrizione, quantita, unita, origine, targa, mezzoTarga, fornitore, stockKey, destinatario, motivo | storage/@manutenzioni: get_vehicle_maintenance_history, search_maintenances, list_scheduled_maintenance_due, get_vehicle_timeline_360, get_vehicle_dossier_snapshot<br>storage/@inventario: list_inventory<br>storage/@materialiconsegnati: get_material_movements, get_vehicle_material_movements, get_vehicle_dossier_snapshot | storage/@manutenzioni: id, targa, tipo, fornitore, km, ore, sottotipo, descrizione, eseguito, data, materiali, importo, gommeInterventoTipo, gommeStraordinario, assiCoinvolti, gommePerAsse, sourceDocumentId<br>storage/@inventario: id, descrizione, quantita, quantitaTotale, unita, stockKey, stockLoadKeys, fotoUrl, fotoStoragePath, fornitore, fornitoreLabel, nomeFornitore, sogliaMinima<br>storage/@materialiconsegnati: id, tipo, direzione, data, materialeId, inventarioRefId, materialeLabel, materiale, descrizione, quantita, unita, origine, targa, mezzoTarga, fornitore, fornitoreLabel, stockKey, destinatario, target, motivo | OK |
| NextManutenzioniPage (eliminazione manutenzione) | src/next/NextManutenzioniPage.tsx | delete | storage/@manutenzioni, storage/@inventario, storage/@materialiconsegnati | storage/@manutenzioni: id<br>storage/@inventario: quantita, quantitaTotale<br>storage/@materialiconsegnati: id, motivo, destinatario.refId | storage/@manutenzioni: get_vehicle_maintenance_history, search_maintenances, list_scheduled_maintenance_due, get_vehicle_timeline_360, get_vehicle_dossier_snapshot<br>storage/@inventario: list_inventory<br>storage/@materialiconsegnati: get_material_movements, get_vehicle_material_movements, get_vehicle_dossier_snapshot | storage/@manutenzioni: id, targa, tipo, fornitore, km, ore, sottotipo, descrizione, eseguito, data, materiali, importo, gommeInterventoTipo, gommeStraordinario, assiCoinvolti, gommePerAsse, sourceDocumentId<br>storage/@inventario: id, descrizione, quantita, quantitaTotale, unita, stockKey, stockLoadKeys, fotoUrl, fotoStoragePath, fornitore, fornitoreLabel, nomeFornitore, sogliaMinima<br>storage/@materialiconsegnati: id, tipo, direzione, data, materialeId, inventarioRefId, materialeLabel, materiale, descrizione, quantita, unita, origine, targa, mezzoTarga, fornitore, fornitoreLabel, stockKey, destinatario, target, motivo | OK |
| NextLavoriDaEseguirePage (gruppo lavori) | src/next/NextLavoriDaEseguirePage.tsx | create | storage/@lavori | storage/@lavori: id, gruppoId, tipo, targa, descrizione, dataInserimento, eseguito, urgenza, segnalatoDa, sottoElementi | storage/@lavori: search_work_orders, get_vehicle_timeline_360, get_vehicle_dossier_snapshot | storage/@lavori: id, gruppoId, tipo, targa, descrizione, dataInserimento, eseguito, urgenza, segnalatoDa, sottoElementi, chiHaEseguito, dataEsecuzione | OK |
| NextDettaglioLavoroPage (modifica lavoro) | src/next/NextDettaglioLavoroPage.tsx | update | storage/@lavori | storage/@lavori: descrizione, dataInserimento | storage/@lavori: search_work_orders, get_vehicle_timeline_360, get_vehicle_dossier_snapshot | storage/@lavori: id, gruppoId, tipo, targa, descrizione, dataInserimento, eseguito, urgenza, segnalatoDa, sottoElementi, chiHaEseguito, dataEsecuzione | OK |
| NextDettaglioLavoroPage (esegui lavoro) | src/next/NextDettaglioLavoroPage.tsx | update | storage/@lavori | storage/@lavori: eseguito, chiHaEseguito, dataEsecuzione | storage/@lavori: search_work_orders, get_vehicle_timeline_360, get_vehicle_dossier_snapshot | storage/@lavori: id, gruppoId, tipo, targa, descrizione, dataInserimento, eseguito, urgenza, segnalatoDa, sottoElementi, chiHaEseguito, dataEsecuzione | OK |
| NextDettaglioLavoroPage (elimina lavoro) | src/next/NextDettaglioLavoroPage.tsx | delete | storage/@lavori | storage/@lavori: id | storage/@lavori: search_work_orders, get_vehicle_timeline_360, get_vehicle_dossier_snapshot | storage/@lavori: id, gruppoId, tipo, targa, descrizione, dataInserimento, eseguito, urgenza, segnalatoDa, sottoElementi, chiHaEseguito, dataEsecuzione | OK |
| NextMappaStoricoPage (upload foto vista) | src/next/NextMappaStoricoPage.tsx | create, upload | storage/@mezzi_foto_viste | storage/@mezzi_foto_viste: id, targa, vista, storagePath, downloadUrl, fileName, contentType, uploadedAt | storage/@mezzi_foto_viste: NESSUNO | storage/@mezzi_foto_viste: - | GAP_NESSUN_TOOL |
| NextMappaStoricoPage (hotspot mappa) | src/next/NextMappaStoricoPage.tsx | create, delete | storage/@mezzi_hotspot_mapping | storage/@mezzi_hotspot_mapping: id, targa, vista, areaId, x, y, createdAt | storage/@mezzi_hotspot_mapping: NESSUNO | storage/@mezzi_hotspot_mapping: - | GAP_NESSUN_TOOL |
| NextIALibrettoPage (salva libretto) | src/next/NextIALibrettoPage.tsx | create, update, upload | storage/@mezzi_aziendali | storage/@mezzi_aziendali: id, tipo, categoria, targa, marca, modello, marcaModello, telaio, colore, cilindrata, potenza, massaComplessiva, proprietario, assicurazione, dataImmatricolazione, dataUltimoCollaudo, dataScadenzaRevisione, note, anno, librettoUrl, librettoStoragePath | storage/@mezzi_aziendali: list_vehicles, get_vehicle_by_plate, search_vehicles_by_attribute, get_vehicle_status, list_scheduled_maintenance_due, get_vehicle_dossier_snapshot | storage/@mezzi_aziendali: id, tipo, categoria, anno, targa, marca, modello, marcaModello, telaio, colore, cilindrata, potenza, massaComplessiva, proprietario, assicurazione, dataImmatricolazione, dataScadenzaRevisione, dataUltimoCollaudo, manutenzioneProgrammata, manutenzioneDataInizio, manutenzioneDataFine, manutenzioneKmMax, manutenzioneContratto, note, autistaId, autistaNome, fotoUrl, fotoPath, librettoUrl, librettoStoragePath, libretto_raw, prenotazioneCollaudo, preCollaudo | GAP_FILTRO_SBAGLIATO |
| NextMagazzinoPage (inventario) | src/next/NextMagazzinoPage.tsx | create, update, delete, upload | storage/@inventario | storage/@inventario: id, descrizione, quantita, quantitaTotale, unita, stockKey, stockLoadKeys, fotoUrl, fotoStoragePath, fornitore, fornitoreLabel, nomeFornitore, sogliaMinima | storage/@inventario: list_inventory | storage/@inventario: id, descrizione, quantita, quantitaTotale, unita, stockKey, stockLoadKeys, fotoUrl, fotoStoragePath, fornitore, fornitoreLabel, nomeFornitore, sogliaMinima | OK |
| NextMagazzinoPage (consegna materiale) | src/next/NextMagazzinoPage.tsx | create, delete, update | storage/@materialiconsegnati, storage/@inventario | storage/@materialiconsegnati: id, descrizione, materiale, materialeLabel, quantita, unita, destinatario, target, motivo, data, fornitore, inventarioRefId, stockKey, direzione, tipo, origine, mezzoTarga, targa<br>storage/@inventario: quantita | storage/@materialiconsegnati: get_material_movements, get_vehicle_material_movements, get_vehicle_dossier_snapshot<br>storage/@inventario: list_inventory | storage/@materialiconsegnati: id, tipo, direzione, data, materialeId, inventarioRefId, materialeLabel, materiale, descrizione, quantita, unita, origine, targa, mezzoTarga, fornitore, fornitoreLabel, stockKey, destinatario, target, motivo<br>storage/@inventario: id, descrizione, quantita, quantitaTotale, unita, stockKey, stockLoadKeys, fotoUrl, fotoStoragePath, fornitore, fornitoreLabel, nomeFornitore, sogliaMinima | OK |
| NextMagazzinoPage (cambio cisterna AdBlue) | src/next/NextMagazzinoPage.tsx | create, update | storage/@cisterne_adblue, storage/@inventario | storage/@cisterne_adblue: id, data, quantitaLitri, quantita, litri, inventarioRefId, stockKey, materialeLabel, descrizione, unita, numeroCisterna, note<br>storage/@inventario: quantita | storage/@cisterne_adblue: get_adblue_tank_events, get_material_movements<br>storage/@inventario: list_inventory | storage/@cisterne_adblue: id, data, quantitaLitri, quantita, litri, inventarioRefId, stockKey, materialeLabel, descrizione, unita, numeroCisterna, note<br>storage/@inventario: id, descrizione, quantita, quantitaTotale, unita, stockKey, stockLoadKeys, fotoUrl, fotoStoragePath, fornitore, fornitoreLabel, nomeFornitore, sogliaMinima | OK |
| NextMagazzinoPage (consolidamento documenti/arrivi) | src/next/NextMagazzinoPage.tsx | update | storage/@inventario | storage/@inventario: quantita, unita, stockKey, stockLoadKeys, fornitore | storage/@inventario: list_inventory | storage/@inventario: id, descrizione, quantita, quantitaTotale, unita, stockKey, stockLoadKeys, fotoUrl, fotoStoragePath, fornitore, fornitoreLabel, nomeFornitore, sogliaMinima | OK |
| NextMaterialiDaOrdinarePage (crea ordine) | src/next/NextMaterialiDaOrdinarePage.tsx | create, upload | storage/@ordini | storage/@ordini: id, idFornitore, nomeFornitore, dataOrdine, materiali, materiali[].id, materiali[].descrizione, materiali[].quantita, materiali[].unita, materiali[].arrivato, materiali[].fotoUrl, materiali[].fotoStoragePath, arrivato | storage/@ordini: get_procurement_costs, list_suppliers | storage/@ordini: id, idFornitore, nomeFornitore, dataOrdine, materiali, arrivato, ordineNote, materiali[].id, materiali[].descrizione, materiali[].quantita, materiali[].unita, materiali[].arrivato, materiali[].dataArrivo, materiali[].fotoUrl, materiali[].fotoStoragePath, materiali[].note, materiali[].prezzoUnitario, materiali[].valuta, materiali[].unitaPrezzo | OK |
| NextProcurementReadOnlyPanel (dettaglio ordine) | src/next/NextProcurementReadOnlyPanel.tsx | update, delete, upload | storage/@ordini | storage/@ordini: id, idFornitore, nomeFornitore, dataOrdine, materiali, materiali[].id, materiali[].descrizione, materiali[].quantita, materiali[].unita, materiali[].arrivato, materiali[].dataArrivo, materiali[].fotoUrl, materiali[].fotoStoragePath, materiali[].note, materiali[].prezzoUnitario, materiali[].valuta, materiali[].unitaPrezzo, arrivato, ordineNote | storage/@ordini: get_procurement_costs, list_suppliers | storage/@ordini: id, idFornitore, nomeFornitore, dataOrdine, materiali, arrivato, ordineNote, materiali[].id, materiali[].descrizione, materiali[].quantita, materiali[].unita, materiali[].arrivato, materiali[].dataArrivo, materiali[].fotoUrl, materiali[].fotoStoragePath, materiali[].note, materiali[].prezzoUnitario, materiali[].valuta, materiali[].unitaPrezzo | OK |
| NextIADocumentiPage (modifica valuta) | src/next/NextIADocumentiPage.tsx | update | @documenti_mezzi, @documenti_magazzino, @documenti_generici, storage/@costiMezzo | @documenti_mezzi: currency, valuta<br>@documenti_magazzino: currency, valuta<br>@documenti_generici: currency, valuta<br>storage/@costiMezzo: currency, valuta | @documenti_mezzi: search_documents_and_invoices, get_document_costs_by_vehicle, get_vehicle_documents, get_invoice_by_id, find_invoice_supplier, download_document_pdf<br>@documenti_magazzino: search_documents_and_invoices, get_document_costs_by_vehicle, get_vehicle_documents, get_invoice_by_id, find_invoice_supplier, download_document_pdf<br>@documenti_generici: search_documents_and_invoices, get_document_costs_by_vehicle, get_vehicle_documents, get_invoice_by_id, find_invoice_supplier, download_document_pdf<br>storage/@costiMezzo: get_costs, get_cost_aggregates, get_document_costs_by_vehicle, get_vehicle_cost_summary | @documenti_mezzi: id, sourceDocId, currency, valuta, fileUrl, storagePath, targa, tipoDocumento, numeroDocumento, dataDocumento, totaleDocumento, fornitore<br>@documenti_magazzino: id, sourceDocId, currency, valuta, fileUrl, storagePath, targa, tipoDocumento, numeroDocumento, dataDocumento, totaleDocumento, fornitore, voci<br>@documenti_generici: id, sourceDocId, currency, valuta, fileUrl, storagePath, targa, tipoDocumento, numeroDocumento, dataDocumento, totaleDocumento, fornitore<br>storage/@costiMezzo: id, sourceDocId, currency, valuta, targa, tipo, data, importo, fornitore, descrizione | OK |
| NextIADocumentiPage (elimina documento) | src/next/NextIADocumentiPage.tsx | delete | @documenti_mezzi, @documenti_magazzino, @documenti_generici, storage/@costiMezzo | @documenti_mezzi: sourceDocId<br>@documenti_magazzino: sourceDocId<br>@documenti_generici: sourceDocId<br>storage/@costiMezzo: sourceDocId | @documenti_mezzi: search_documents_and_invoices, get_document_costs_by_vehicle, get_vehicle_documents, get_invoice_by_id, find_invoice_supplier, download_document_pdf<br>@documenti_magazzino: search_documents_and_invoices, get_document_costs_by_vehicle, get_vehicle_documents, get_invoice_by_id, find_invoice_supplier, download_document_pdf<br>@documenti_generici: search_documents_and_invoices, get_document_costs_by_vehicle, get_vehicle_documents, get_invoice_by_id, find_invoice_supplier, download_document_pdf<br>storage/@costiMezzo: get_costs, get_cost_aggregates, get_document_costs_by_vehicle, get_vehicle_cost_summary | @documenti_mezzi: id, sourceDocId, currency, valuta, fileUrl, storagePath, targa, tipoDocumento, numeroDocumento, dataDocumento, totaleDocumento, fornitore<br>@documenti_magazzino: id, sourceDocId, currency, valuta, fileUrl, storagePath, targa, tipoDocumento, numeroDocumento, dataDocumento, totaleDocumento, fornitore, voci<br>@documenti_generici: id, sourceDocId, currency, valuta, fileUrl, storagePath, targa, tipoDocumento, numeroDocumento, dataDocumento, totaleDocumento, fornitore<br>storage/@costiMezzo: id, sourceDocId, currency, valuta, targa, tipo, data, importo, fornitore, descrizione | OK |
| NextDossierMezzoPage (elimina fattura) | src/next/NextDossierMezzoPage.tsx | delete | @documenti_mezzi, @documenti_magazzino, @documenti_generici, storage/@costiMezzo | @documenti_mezzi: sourceDocId<br>@documenti_magazzino: sourceDocId<br>@documenti_generici: sourceDocId<br>storage/@costiMezzo: sourceDocId | @documenti_mezzi: search_documents_and_invoices, get_document_costs_by_vehicle, get_vehicle_documents, get_invoice_by_id, find_invoice_supplier, download_document_pdf<br>@documenti_magazzino: search_documents_and_invoices, get_document_costs_by_vehicle, get_vehicle_documents, get_invoice_by_id, find_invoice_supplier, download_document_pdf<br>@documenti_generici: search_documents_and_invoices, get_document_costs_by_vehicle, get_vehicle_documents, get_invoice_by_id, find_invoice_supplier, download_document_pdf<br>storage/@costiMezzo: get_costs, get_cost_aggregates, get_document_costs_by_vehicle, get_vehicle_cost_summary | @documenti_mezzi: id, sourceDocId, currency, valuta, fileUrl, storagePath, targa, tipoDocumento, numeroDocumento, dataDocumento, totaleDocumento, fornitore<br>@documenti_magazzino: id, sourceDocId, currency, valuta, fileUrl, storagePath, targa, tipoDocumento, numeroDocumento, dataDocumento, totaleDocumento, fornitore, voci<br>@documenti_generici: id, sourceDocId, currency, valuta, fileUrl, storagePath, targa, tipoDocumento, numeroDocumento, dataDocumento, totaleDocumento, fornitore<br>storage/@costiMezzo: id, sourceDocId, currency, valuta, targa, tipo, data, importo, fornitore, descrizione | OK |
| NextCisternaPage (cambio EUR/CHF) | src/next/NextCisternaPage.tsx | update | @cisterna_parametri_mensili | @cisterna_parametri_mensili: mese, cambioEurChf, updatedAt | @cisterna_parametri_mensili: get_cisterna_snapshot, reconcile_cisterna_month | @cisterna_parametri_mensili: mese, cambioEurChf, updatedAt | OK |
| NextCisternaPage (scelta duplicato) | src/next/NextCisternaPage.tsx | update | @documenti_cisterna | @documenti_cisterna: dupGroupKey, dupChosen, dupIgnored, updatedAt | @documenti_cisterna: get_cisterna_snapshot, get_cisterna_documents, reconcile_cisterna_month | @documenti_cisterna: id, tipoDocumento, fornitore, destinatario, numeroDocumento, dataDocumento, yearMonth, mese, litriTotali, litri15C, totaleDocumento, valuta, currency, prodotto, testo, daVerificare, motivoVerifica, fileUrl, storagePath, nomeFile, fonte, createdAt, iaEngine, dupGroupKey, dupChosen, dupIgnored, updatedAt | OK |
| NextCisternaIAPage (documento IA) | src/next/NextCisternaIAPage.tsx | create, upload | @documenti_cisterna | @documenti_cisterna: tipoDocumento, fornitore, destinatario, numeroDocumento, dataDocumento, yearMonth, mese, litriTotali, litri15C, totaleDocumento, valuta, currency, prodotto, testo, daVerificare, motivoVerifica, fileUrl, storagePath, nomeFile, fonte, createdAt, iaEngine | @documenti_cisterna: get_cisterna_snapshot, get_cisterna_documents, reconcile_cisterna_month | @documenti_cisterna: id, tipoDocumento, fornitore, destinatario, numeroDocumento, dataDocumento, yearMonth, mese, litriTotali, litri15C, totaleDocumento, valuta, currency, prodotto, testo, daVerificare, motivoVerifica, fileUrl, storagePath, nomeFile, fonte, createdAt, iaEngine, dupGroupKey, dupChosen, dupIgnored, updatedAt | OK |
| NextCisternaSchedeTestPage (upload ritaglio scheda) | src/next/NextCisternaSchedeTestPage.tsx | upload | (solo Storage) | (solo Storage upload) | NESSUNO | - | GAP_NESSUN_TOOL |
| NextCisternaSchedeTestPage (salva scheda) | src/next/NextCisternaSchedeTestPage.tsx | create, update | @cisterna_schede_ia | @cisterna_schede_ia: source, rowCount, rows, needsReview, yearMonth, fileUrl, storagePath, nomeFile, rawLines, summary, fonte, iaEngine, createdAt, updatedAt | @cisterna_schede_ia: get_cisterna_snapshot, get_cisterna_refuelings, reconcile_cisterna_month | @cisterna_schede_ia: id, source, rowCount, rows, needsReview, yearMonth, fileUrl, storagePath, nomeFile, rawLines, summary, fonte, iaEngine, createdAt, updatedAt | OK |
| NextEuromeccPage (relazione bozza) | src/next/NextEuromeccPage.tsx | create | euromecc_relazioni | euromecc_relazioni: fileName, fileType, dataIntervento, tecnici, note, statoImportazione, doneCount, pendingCount, extraComponentsCount, createdAt, updatedAt | euromecc_relazioni: NESSUNO | euromecc_relazioni: - | GAP_NESSUN_TOOL |
| NextEuromeccPage (relazione confermata) | src/next/NextEuromeccPage.tsx | create, upload | euromecc_relazioni, euromecc_done, euromecc_pending, euromecc_extra_components | euromecc_relazioni: fileName, fileType, dataIntervento, tecnici, note, statoImportazione, doneCount, pendingCount, extraComponentsCount, fileUrl, fileStoragePath, fileSize, createdAt, updatedAt<br>euromecc_done: areaKey, subKey, title, doneDate, by, note, nextDate, closedPending, createdAt, updatedAt<br>euromecc_pending: areaKey, subKey, title, priority, dueDate, note, createdAt, updatedAt<br>euromecc_extra_components: areaKey, subKey, name, code, addedFrom, addedAt, addedBy, createdAt | euromecc_relazioni: NESSUNO<br>euromecc_done: get_euromecc_snapshot<br>euromecc_pending: get_euromecc_snapshot<br>euromecc_extra_components: NESSUNO | euromecc_relazioni: -<br>euromecc_done: id, areaKey, subKey, title, doneDate, by, note, nextDate, closedPending, createdAt, updatedAt, areaLabel, state<br>euromecc_pending: id, areaKey, subKey, title, priority, dueDate, note, createdAt, updatedAt, areaLabel, state<br>euromecc_extra_components: - | GAP_NESSUN_TOOL |
| NextEuromeccPage (ordine ricambi da relazione) | src/next/NextEuromeccPage.tsx | create | storage/@ordini, euromecc_relazioni | storage/@ordini: id, idFornitore, nomeFornitore, dataOrdine, materiali, arrivato<br>euromecc_relazioni: ordineId, ordineMateriali, statoImportazione, note | storage/@ordini: get_procurement_costs, list_suppliers<br>euromecc_relazioni: NESSUNO | storage/@ordini: id, idFornitore, nomeFornitore, dataOrdine, materiali, arrivato, ordineNote, materiali[].id, materiali[].descrizione, materiali[].quantita, materiali[].unita, materiali[].arrivato, materiali[].dataArrivo, materiali[].fotoUrl, materiali[].fotoStoragePath, materiali[].note, materiali[].prezzoUnitario, materiali[].valuta, materiali[].unitaPrezzo<br>euromecc_relazioni: - | GAP_NESSUN_TOOL |
| NextEuromeccPage (task da fare) | src/next/NextEuromeccPage.tsx | create, update, delete | euromecc_pending | euromecc_pending: areaKey, subKey, title, priority, dueDate, note, createdAt, updatedAt | euromecc_pending: get_euromecc_snapshot | euromecc_pending: id, areaKey, subKey, title, priority, dueDate, note, createdAt, updatedAt, areaLabel, state | OK |
| NextEuromeccPage (task fatto) | src/next/NextEuromeccPage.tsx | create, update, delete | euromecc_done | euromecc_done: areaKey, subKey, title, doneDate, by, note, nextDate, closedPending, createdAt, updatedAt | euromecc_done: get_euromecc_snapshot | euromecc_done: id, areaKey, subKey, title, doneDate, by, note, nextDate, closedPending, createdAt, updatedAt, areaLabel, state | OK |
| NextEuromeccPage (segnalazione) | src/next/NextEuromeccPage.tsx | create, update, delete | euromecc_issues | euromecc_issues: areaKey, subKey, title, check, type, state, reportedAt, reportedBy, note, closedDate, createdAt, updatedAt | euromecc_issues: get_euromecc_snapshot | euromecc_issues: id, areaKey, subKey, title, check, type, state, reportedAt, reportedBy, note, closedDate, createdAt, updatedAt, areaLabel | OK |
| NextEuromeccPage (tipo cemento silo) | src/next/NextEuromeccPage.tsx | update | euromecc_area_meta | euromecc_area_meta: areaKey, cementType, cementTypeShort, updatedBy, updatedAt | euromecc_area_meta: get_euromecc_snapshot | euromecc_area_meta: areaKey, cementType, cementTypeShort, updatedBy, updatedAt | OK |
## Sezione 1 - Modali Senza Tool (orfani)
- NextMappaStoricoPage (upload foto vista) | storage/@mezzi_foto_viste
- NextMappaStoricoPage (hotspot mappa) | storage/@mezzi_hotspot_mapping
- NextCisternaSchedeTestPage (upload ritaglio scheda) | (solo Storage)
- NextEuromeccPage (relazione bozza) | euromecc_relazioni
- NextEuromeccPage (relazione confermata) | euromecc_relazioni, euromecc_done, euromecc_pending, euromecc_extra_components
- NextEuromeccPage (ordine ricambi da relazione) | storage/@ordini, euromecc_relazioni

## Sezione 2 - Modali con Path Diverso
- Nessuno.

## Sezione 3 - Modali con Campi Non Letti
- NextAnagraficaModal (officina) | storage/@officine
  - Campi non letti: storage/@officine:descrizione

## Sezione 4 - Modali con Filtro Sbagliato
- NextMezzoEditModal | storage/@mezzi_aziendali
  - Filtri rilevati: list_vehicles filtra categoria su categoria/tipo normalizzati; valori non canonici restano leggibili da get_vehicle_by_plate ma possono non uscire dalla lista filtrata.
- NextScadenzeCollaudiPage (prenotazione collaudo) | storage/@mezzi_aziendali
  - Filtri rilevati: list_vehicles filtra categoria su categoria/tipo normalizzati; valori non canonici restano leggibili da get_vehicle_by_plate ma possono non uscire dalla lista filtrata.
- NextScadenzeCollaudiPage (pre-collaudo) | storage/@mezzi_aziendali
  - Filtri rilevati: list_vehicles filtra categoria su categoria/tipo normalizzati; valori non canonici restano leggibili da get_vehicle_by_plate ma possono non uscire dalla lista filtrata.
- NextScadenzeCollaudiPage (revisione completata) | storage/@mezzi_aziendali
  - Filtri rilevati: list_vehicles filtra categoria su categoria/tipo normalizzati; valori non canonici restano leggibili da get_vehicle_by_plate ma possono non uscire dalla lista filtrata.
- NextIALibrettoPage (salva libretto) | storage/@mezzi_aziendali
  - Filtri rilevati: list_vehicles filtra categoria su categoria/tipo normalizzati; valori non canonici restano leggibili da get_vehicle_by_plate ma possono non uscire dalla lista filtrata.

## Sezione 5 - Modali OK
- NextAnagraficaModal (collega) | storage/@colleghi
- NextAnagraficaModal (fornitore) | storage/@fornitori
- NextPreventivoManualeModal | storage/@preventivi, storage/@listino_prezzi
- NextPreventivoIaModal | storage/@preventivi, storage/@listino_prezzi
- ChatIaReportModal | chat_ia_reports
- NextAttrezzatureCantieriWritePanel | storage/@attrezzature_cantieri
- NextManutenzioniPage (form manutenzione) | storage/@manutenzioni, storage/@inventario, storage/@materialiconsegnati
- NextManutenzioniPage (eliminazione manutenzione) | storage/@manutenzioni, storage/@inventario, storage/@materialiconsegnati
- NextLavoriDaEseguirePage (gruppo lavori) | storage/@lavori
- NextDettaglioLavoroPage (modifica lavoro) | storage/@lavori
- NextDettaglioLavoroPage (esegui lavoro) | storage/@lavori
- NextDettaglioLavoroPage (elimina lavoro) | storage/@lavori
- NextMagazzinoPage (inventario) | storage/@inventario
- NextMagazzinoPage (consegna materiale) | storage/@materialiconsegnati, storage/@inventario
- NextMagazzinoPage (cambio cisterna AdBlue) | storage/@cisterne_adblue, storage/@inventario
- NextMagazzinoPage (consolidamento documenti/arrivi) | storage/@inventario
- NextMaterialiDaOrdinarePage (crea ordine) | storage/@ordini
- NextProcurementReadOnlyPanel (dettaglio ordine) | storage/@ordini
- NextIADocumentiPage (modifica valuta) | @documenti_mezzi, @documenti_magazzino, @documenti_generici, storage/@costiMezzo
- NextIADocumentiPage (elimina documento) | @documenti_mezzi, @documenti_magazzino, @documenti_generici, storage/@costiMezzo
- NextDossierMezzoPage (elimina fattura) | @documenti_mezzi, @documenti_magazzino, @documenti_generici, storage/@costiMezzo
- NextCisternaPage (cambio EUR/CHF) | @cisterna_parametri_mensili
- NextCisternaPage (scelta duplicato) | @documenti_cisterna
- NextCisternaIAPage (documento IA) | @documenti_cisterna
- NextCisternaSchedeTestPage (salva scheda) | @cisterna_schede_ia
- NextEuromeccPage (task da fare) | euromecc_pending
- NextEuromeccPage (task fatto) | euromecc_done
- NextEuromeccPage (segnalazione) | euromecc_issues
- NextEuromeccPage (tipo cemento silo) | euromecc_area_meta

## Allegato A - Schema Reale Collection
### @cisterna_parametri_mensili
- Esiste: SI
- Count record: 1
- Alternative controllate: storage/@cisterna_parametri_mensili count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| cambioEurChf | 1 | 0 | 1 | 1 | number |
| id | 1 | 0 | 1 | 1 | string |
| mese | 1 | 0 | 1 | 1 | string |
| updatedAt | 1 | 0 | 1 | 1 | Firestore Timestamp |

Valori distinti categoriali principali:
- mese: distinct=1, missing=0, 2026-01=1

### @cisterna_schede_ia
- Esiste: SI
- Count record: 4
- Alternative controllate: storage/@cisterna_schede_ia count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| createdAt | 4 | 0 | 4 | 1 | Firestore Timestamp, object |
| fonte | 4 | 0 | 4 | 1 | string |
| id | 4 | 0 | 4 | 1 | string |
| needsReview | 4 | 0 | 4 | 1 | boolean |
| rowCount | 4 | 0 | 4 | 1 | number |
| rows | 4 | 0 | 4 | 1 | array |
| source | 4 | 0 | 4 | 1 | string |
| yearMonth | 4 | 0 | 4 | 1 | string |
| updatedAt | 3 | 0 | 4 | 0.75 | object |
| mese | 1 | 0 | 4 | 0.25 | string |

Valori distinti categoriali principali:
- source: distinct=1, missing=0, manual=4
- fonte: distinct=1, missing=0, manual=4
- needsReview: distinct=2, missing=0, false=3, true=1
- yearMonth: distinct=4, missing=0, 2026-02=1, 2026-01=1, 2026-04=1, 2026-03=1

### @documenti_cisterna
- Esiste: SI
- Count record: 3
- Alternative controllate: storage/@documenti_cisterna count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| createdAt | 3 | 0 | 3 | 1 | object |
| dataDocumento | 3 | 0 | 3 | 1 | string |
| daVerificare | 3 | 0 | 3 | 1 | boolean |
| destinatario | 3 | 0 | 3 | 1 | string |
| fileUrl | 3 | 0 | 3 | 1 | string |
| fonte | 3 | 0 | 3 | 1 | string |
| fornitore | 3 | 0 | 3 | 1 | string |
| id | 3 | 0 | 3 | 1 | string |
| litri15C | 3 | 0 | 3 | 1 | number |
| litriTotali | 3 | 0 | 3 | 1 | number |
| mese | 3 | 0 | 3 | 1 | string |
| nomeFile | 3 | 0 | 3 | 1 | string |
| prodotto | 3 | 0 | 3 | 1 | string |
| storagePath | 3 | 0 | 3 | 1 | string |
| testo | 3 | 0 | 3 | 1 | string |
| tipoDocumento | 3 | 0 | 3 | 1 | string |
| yearMonth | 3 | 0 | 3 | 1 | string |
| dupChosen | 2 | 0 | 3 | 0.667 | boolean |
| dupGroupKey | 2 | 0 | 3 | 0.667 | string |
| dupIgnored | 2 | 0 | 3 | 0.667 | boolean |
| motivoVerifica | 2 | 1 | 3 | 0.667 | string |
| numeroDocumento | 2 | 1 | 3 | 0.667 | string |
| updatedAt | 2 | 0 | 3 | 0.667 | object |
| currency | 1 | 2 | 3 | 0.333 | string |
| totaleDocumento | 1 | 2 | 3 | 0.333 | number |
| valuta | 1 | 2 | 3 | 0.333 | string |

Valori distinti categoriali principali:
- tipoDocumento: distinct=2, missing=0, bollettino=2, fattura=1
- fornitore: distinct=3, missing=0, TRE PIEVI PETROLI S.R.L.=1, bronchi combustibili s.r.l.=1, BRONCHI COMBUSTIBILI SRL=1
- valuta: distinct=1, missing=2, EUR=1
- currency: distinct=1, missing=2, EUR=1
- fonte: distinct=1, missing=0, IA=3
- dupChosen: distinct=2, missing=1, false=1, true=1
- dupIgnored: distinct=2, missing=1, true=1, false=1

### @documenti_generici
- Esiste: NO
- Count record: 0
- Alternative controllate: storage/@documenti_generici count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|

Valori distinti categoriali principali:
- tipoDocumento: distinct=0, missing=0
- currency: distinct=0, missing=0
- valuta: distinct=0, missing=0

### @documenti_magazzino
- Esiste: SI
- Count record: 3
- Alternative controllate: storage/@documenti_magazzino count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| categoriaArchivio | 3 | 0 | 3 | 1 | string |
| createdAt | 3 | 0 | 3 | 1 | Firestore Timestamp |
| dataDocumento | 3 | 0 | 3 | 1 | string |
| fileUrl | 3 | 0 | 3 | 1 | string |
| fonte | 3 | 0 | 3 | 1 | string |
| fornitore | 3 | 0 | 3 | 1 | string |
| id | 3 | 0 | 3 | 1 | string |
| imponibile | 3 | 0 | 3 | 1 | number, string |
| nomeFile | 3 | 0 | 3 | 1 | string |
| numeroDocumento | 3 | 0 | 3 | 1 | string |
| testo | 3 | 0 | 3 | 1 | string |
| tipoDocumento | 3 | 0 | 3 | 1 | string |
| totaleDocumento | 3 | 0 | 3 | 1 | number, string |
| valuta | 3 | 0 | 3 | 1 | string |
| voci | 3 | 0 | 3 | 1 | array |
| ivaImporto | 2 | 1 | 3 | 0.667 | number, string |
| archivistaAnalysis | 1 | 0 | 3 | 0.333 | object |
| ivaPercentuale | 1 | 2 | 3 | 0.333 | string |
| km | 0 | 3 | 3 | 0 |  |
| marca | 0 | 3 | 3 | 0 |  |
| modello | 0 | 3 | 3 | 0 |  |
| targa | 0 | 3 | 3 | 0 |  |
| telaio | 0 | 3 | 3 | 0 |  |

Valori distinti categoriali principali:
- tipoDocumento: distinct=1, missing=0, FATTURA=3
- currency: distinct=0, missing=3
- valuta: distinct=2, missing=0, EUR=2, CHF=1

### @documenti_mezzi
- Esiste: SI
- Count record: 11
- Alternative controllate: storage/@documenti_mezzi count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| categoriaArchivio | 11 | 0 | 11 | 1 | string |
| createdAt | 11 | 0 | 11 | 1 | Firestore Timestamp |
| dataDocumento | 11 | 0 | 11 | 1 | string |
| fileUrl | 11 | 0 | 11 | 1 | string |
| fonte | 11 | 0 | 11 | 1 | string |
| id | 11 | 0 | 11 | 1 | string |
| nomeFile | 11 | 0 | 11 | 1 | string |
| targa | 11 | 0 | 11 | 1 | string |
| tipoDocumento | 11 | 0 | 11 | 1 | string |
| testo | 9 | 2 | 11 | 0.818 | string |
| telaio | 8 | 2 | 11 | 0.727 | string |
| contestoArchivista | 7 | 0 | 11 | 0.636 | string |
| famigliaArchivista | 7 | 0 | 11 | 0.636 | string |
| fileStoragePath | 7 | 0 | 11 | 0.636 | string |
| riassuntoBreve | 7 | 0 | 11 | 0.636 | string |
| statoArchivio | 7 | 0 | 11 | 0.636 | string |
| dataImmatricolazione | 6 | 0 | 11 | 0.545 | string |
| dataScadenza | 6 | 0 | 11 | 0.545 | string |
| dataScadenzaRevisione | 6 | 0 | 11 | 0.545 | string |
| dataUltimoCollaudo | 6 | 0 | 11 | 0.545 | string |
| documentoMezzoAggiornamentoConfermato | 6 | 0 | 11 | 0.545 | boolean |
| mezzoId | 6 | 0 | 11 | 0.545 | string |
| proprietario | 6 | 0 | 11 | 0.545 | string |
| sottotipoDocumentoMezzo | 6 | 0 | 11 | 0.545 | string |
| fornitore | 5 | 6 | 11 | 0.455 | string |
| marca | 5 | 5 | 11 | 0.455 | string |
| numeroDocumento | 5 | 6 | 11 | 0.455 | string |
| totaleDocumento | 5 | 0 | 11 | 0.455 | number, string |
| voci | 5 | 0 | 11 | 0.455 | array |
| archivistaAnalysis | 4 | 0 | 11 | 0.364 | object |
| assicurazione | 4 | 2 | 11 | 0.364 | string |
| imponibile | 4 | 0 | 11 | 0.364 | string |
| ivaImporto | 4 | 0 | 11 | 0.364 | string |
| ivaPercentuale | 4 | 0 | 11 | 0.364 | string |
| km | 4 | 1 | 11 | 0.364 | number, string |
| modello | 4 | 6 | 11 | 0.364 | string |
| valuta | 4 | 0 | 11 | 0.364 | string |
| duplicateChoice | 3 | 4 | 11 | 0.273 | string |
| duplicateOfId | 3 | 4 | 11 | 0.273 | string |
| duplicateTarget | 3 | 4 | 11 | 0.273 | string |
| avvisi | 1 | 6 | 11 | 0.091 | array |
| campiMancanti | 1 | 6 | 11 | 0.091 | array |
| valutaDocumento | 1 | 0 | 11 | 0.091 | string |
| archivedAsDifferentFromId | 0 | 7 | 11 | 0 |  |

Valori distinti categoriali principali:
- tipoDocumento: distinct=4, missing=0, libretto=6, PREVENTIVO=2, Fattura=2, fattura=1
- currency: distinct=0, missing=11
- valuta: distinct=2, missing=7, CHF=2, EUR=2

### chat_ia_reports
- Esiste: NO
- Count record: 0
- Alternative controllate: storage/chat_ia_reports count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|

Valori distinti categoriali principali:
- status: distinct=0, missing=0
- sector: distinct=0, missing=0
- targetKind: distinct=0, missing=0

### euromecc_area_meta
- Esiste: NO
- Count record: 0
- Alternative controllate: storage/euromecc_area_meta count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|

Valori distinti categoriali principali:
- areaKey: distinct=0, missing=0

### euromecc_done
- Esiste: SI
- Count record: 54
- Alternative controllate: storage/euromecc_done count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| areaKey | 54 | 0 | 54 | 1 | string |
| by | 54 | 0 | 54 | 1 | string |
| closedPending | 54 | 0 | 54 | 1 | boolean |
| createdAt | 54 | 0 | 54 | 1 | Firestore Timestamp |
| doneDate | 54 | 0 | 54 | 1 | string |
| id | 54 | 0 | 54 | 1 | string |
| subKey | 54 | 0 | 54 | 1 | string |
| title | 54 | 0 | 54 | 1 | string |
| updatedAt | 54 | 0 | 54 | 1 | Firestore Timestamp |
| note | 9 | 45 | 54 | 0.167 | string |
| nextDate | 0 | 54 | 54 | 0 |  |

Valori distinti categoriali principali:
- areaKey: distinct=16, missing=0, carico1=9, compressore2=8, carico2=6, filtriSilo=5, caricoRail=4, gruppiFR=4, accumulatoriAria=3, silo3=2, quadriElettrici=2, essiccatoriLinea=2, silo2a=2, valvoleTettiSilo=2, silo5=2, silo1=1, lineeSilo=1, compressore=1
- closedPending: distinct=1, missing=0, false=54

### euromecc_extra_components
- Esiste: NO
- Count record: 0
- Alternative controllate: storage/euromecc_extra_components count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|

Valori distinti categoriali principali:
- areaKey: distinct=0, missing=0

### euromecc_issues
- Esiste: SI
- Count record: 2
- Alternative controllate: storage/euromecc_issues count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| areaKey | 2 | 0 | 2 | 1 | string |
| check | 2 | 0 | 2 | 1 | string |
| createdAt | 2 | 0 | 2 | 1 | Firestore Timestamp |
| id | 2 | 0 | 2 | 1 | string |
| reportedAt | 2 | 0 | 2 | 1 | string |
| reportedBy | 2 | 0 | 2 | 1 | string |
| state | 2 | 0 | 2 | 1 | string |
| subKey | 2 | 0 | 2 | 1 | string |
| title | 2 | 0 | 2 | 1 | string |
| type | 2 | 0 | 2 | 1 | string |
| updatedAt | 2 | 0 | 2 | 1 | Firestore Timestamp |
| closedDate | 0 | 2 | 2 | 0 |  |
| note | 0 | 2 | 2 | 0 |  |

Valori distinti categoriali principali:
- areaKey: distinct=2, missing=0, scaricoFornitore=1, carico1=1
- type: distinct=2, missing=0, anomalia=1, criticita=1
- state: distinct=1, missing=0, aperta=2

### euromecc_pending
- Esiste: SI
- Count record: 4
- Alternative controllate: storage/euromecc_pending count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| areaKey | 4 | 0 | 4 | 1 | string |
| createdAt | 4 | 0 | 4 | 1 | Firestore Timestamp |
| dueDate | 4 | 0 | 4 | 1 | string |
| id | 4 | 0 | 4 | 1 | string |
| priority | 4 | 0 | 4 | 1 | string |
| subKey | 4 | 0 | 4 | 1 | string |
| title | 4 | 0 | 4 | 1 | string |
| updatedAt | 4 | 0 | 4 | 1 | Firestore Timestamp |
| note | 0 | 4 | 4 | 0 |  |

Valori distinti categoriali principali:
- areaKey: distinct=3, missing=0, caricoRail=2, filtriSilo=1, plc=1
- priority: distinct=2, missing=0, media=3, alta=1

### euromecc_relazioni
- Esiste: SI
- Count record: 2
- Alternative controllate: storage/euromecc_relazioni count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| createdAt | 2 | 0 | 2 | 1 | Firestore Timestamp |
| dataIntervento | 2 | 0 | 2 | 1 | string |
| doneCount | 2 | 0 | 2 | 1 | number |
| extraComponentsCount | 2 | 0 | 2 | 1 | number |
| fileName | 2 | 0 | 2 | 1 | string |
| fileType | 2 | 0 | 2 | 1 | string |
| id | 2 | 0 | 2 | 1 | string |
| pendingCount | 2 | 0 | 2 | 1 | number |
| statoImportazione | 2 | 0 | 2 | 1 | string |
| updatedAt | 2 | 0 | 2 | 1 | Firestore Timestamp |
| note | 1 | 1 | 2 | 0.5 | string |
| ordineId | 1 | 0 | 2 | 0.5 | string |
| ordineMateriali | 1 | 0 | 2 | 0.5 | number |
| tecnici | 1 | 1 | 2 | 0.5 | array |
| fileSize | 0 | 1 | 2 | 0 |  |
| fileStoragePath | 0 | 1 | 2 | 0 |  |
| fileUrl | 0 | 1 | 2 | 0 |  |

Valori distinti categoriali principali:
- fileType: distinct=1, missing=0, pdf=2
- statoImportazione: distinct=1, missing=0, confermata=2

### storage/@attrezzature_cantieri
- Esiste: SI
- Count record: 12
- Alternative controllate: @attrezzature_cantieri count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| cantiereLabel | 12 | 0 | 12 | 1 | string |
| data | 12 | 0 | 12 | 1 | string |
| descrizione | 12 | 0 | 12 | 1 | string |
| id | 12 | 0 | 12 | 1 | string |
| materialeCategoria | 12 | 0 | 12 | 1 | string |
| quantita | 12 | 0 | 12 | 1 | number |
| tipo | 12 | 0 | 12 | 1 | string |
| unita | 12 | 0 | 12 | 1 | string |
| cantiereId | 4 | 8 | 12 | 0.333 | string |
| note | 3 | 9 | 12 | 0.25 | string |
| fotoStoragePath | 0 | 12 | 12 | 0 |  |
| fotoUrl | 0 | 12 | 12 | 0 |  |
| sourceCantiereId | 0 | 12 | 12 | 0 |  |
| sourceCantiereLabel | 0 | 12 | 12 | 0 |  |

Valori distinti categoriali principali:
- tipo: distinct=1, missing=0, CONSEGNATO=12
- materialeCategoria: distinct=2, missing=0, TUBI=11, MATERIALI=1
- cantiereLabel: distinct=12, missing=0, BIROLINI=1, RIVA (ARZO)=1, GTL PALAZZETTO (LUGANO)=1, MERLINI E FERRARI (MINUSIO)=1, GTL BLUMONTI (MINUSIO)=1, GARZONI (MINUSIO)=1, GTL (GIUBIASCO)=1, BASSI CASTAGNOLA=1, VIGANELLO=1, CLINICA MONCUCCO=1, MONTALTO=1, GTL RONCO SOPRA ASCONA=1

### storage/@cisterne_adblue
- Esiste: SI
- Count record: 1
- Alternative controllate: @cisterne_adblue count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| data | 1 | 0 | 1 | 1 | string |
| descrizione | 1 | 0 | 1 | 1 | string |
| id | 1 | 0 | 1 | 1 | string |
| inventarioRefId | 1 | 0 | 1 | 1 | string |
| litri | 1 | 0 | 1 | 1 | number |
| materialeLabel | 1 | 0 | 1 | 1 | string |
| numeroCisterna | 1 | 0 | 1 | 1 | string |
| quantita | 1 | 0 | 1 | 1 | number |
| quantitaLitri | 1 | 0 | 1 | 1 | number |
| stockKey | 1 | 0 | 1 | 1 | string |
| unita | 1 | 0 | 1 | 1 | string |
| note | 0 | 1 | 1 | 0 |  |

Valori distinti categoriali principali:
- numeroCisterna: distinct=1, missing=0, 1=1

### storage/@colleghi
- Esiste: SI
- Count record: 12
- Alternative controllate: @colleghi count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| id | 12 | 0 | 12 | 1 | string |
| nome | 12 | 0 | 12 | 1 | string |
| badge | 11 | 1 | 12 | 0.917 | string |
| telefono | 11 | 1 | 12 | 0.917 | string |
| codice | 10 | 2 | 12 | 0.833 | string |
| pinSim | 2 | 10 | 12 | 0.167 | string |
| schedeCarburante | 2 | 10 | 12 | 0.167 | array |
| telefonoPrivato | 1 | 11 | 12 | 0.083 | string |
| descrizione | 0 | 12 | 12 | 0 |  |
| pukSim | 0 | 12 | 12 | 0 |  |

Valori distinti categoriali principali:
- badge: distinct=11, missing=1, 5=1, 17=1, 38=1, 111=1, 503=1, 513=1, 514=1, 517=1, 527=1, 530=1, 1011=1
- codice: distinct=10, missing=2, 1136=1, 1138=1, 1212=1, 1215=1, 1227=1, 1233=1, 1235=1, 1237=1, 1238=1, 1239=1

### storage/@costiMezzo
- Esiste: SI
- Count record: 0
- Alternative controllate: @costiMezzo count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|

Valori distinti categoriali principali:
- tipo: distinct=0, missing=0
- currency: distinct=0, missing=0
- valuta: distinct=0, missing=0

### storage/@fornitori
- Esiste: SI
- Count record: 4
- Alternative controllate: @fornitori count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| descrizione | 4 | 0 | 4 | 1 | string |
| id | 4 | 0 | 4 | 1 | string |
| nome | 4 | 0 | 4 | 1 | string |
| telefono | 4 | 0 | 4 | 1 | string |
| badge | 0 | 4 | 4 | 0 |  |
| codice | 0 | 4 | 4 | 0 |  |

Valori distinti categoriali principali:
- nome: distinct=4, missing=0, MARIBA=1, TURBO DIESEL (DAVIDE)=1, TRUCK SERVICE=1, MATTEO TRUCK SERVICE=1

### storage/@inventario
- Esiste: SI
- Count record: 17
- Alternative controllate: @inventario count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| descrizione | 17 | 0 | 17 | 1 | string |
| id | 17 | 0 | 17 | 1 | string |
| quantita | 17 | 0 | 17 | 1 | number |
| quantitaTotale | 17 | 0 | 17 | 1 | number |
| stockKey | 17 | 0 | 17 | 1 | string |
| unita | 17 | 0 | 17 | 1 | string |
| fornitore | 15 | 2 | 17 | 0.882 | string |
| fornitoreLabel | 15 | 2 | 17 | 0.882 | string |
| nomeFornitore | 15 | 2 | 17 | 0.882 | string |
| stockLoadKeys | 4 | 13 | 17 | 0.235 | array |
| prezzoUnitario | 1 | 1 | 17 | 0.059 | number |
| sogliaMinima | 1 | 0 | 17 | 0.059 | number |
| fotoStoragePath | 0 | 17 | 17 | 0 |  |
| fotoUrl | 0 | 17 | 17 | 0 |  |

Valori distinti categoriali principali:
- unita: distinct=2, missing=0, pz=12, lt=5
- fornitore: distinct=5, missing=2, MARIBA=6, TRUCK SERVICE=5, TURBO DIESEL=2, Thommen-Furler AG=1, MARIBA s.r.l.=1

### storage/@lavori
- Esiste: SI
- Count record: 13
- Alternative controllate: @lavori count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| dataInserimento | 13 | 0 | 13 | 1 | string |
| descrizione | 13 | 0 | 13 | 1 | string |
| eseguito | 13 | 0 | 13 | 1 | boolean |
| gruppoId | 13 | 0 | 13 | 1 | string |
| id | 13 | 0 | 13 | 1 | string |
| segnalatoDa | 13 | 0 | 13 | 1 | string |
| source | 13 | 0 | 13 | 1 | object |
| targa | 13 | 0 | 13 | 1 | string |
| tipo | 13 | 0 | 13 | 1 | string |
| urgenza | 13 | 0 | 13 | 1 | string |
| chiHaEseguito | 7 | 0 | 13 | 0.538 | string |
| dataEsecuzione | 7 | 0 | 13 | 0.538 | string |
| dettagli | 0 | 13 | 13 | 0 |  |
| sottoElementi | 0 | 13 | 13 | 0 |  |

Valori distinti categoriali principali:
- tipo: distinct=1, missing=0, targa=13
- urgenza: distinct=3, missing=0, media=9, alta=2, bassa=2
- eseguito: distinct=2, missing=0, true=7, false=6
- segnalatoDa: distinct=7, missing=0, ORLANDO BUTTI=3, ELTON SELIMI=3, RICCARDO FENDERICO=2, IVAN ATTARDI=2, ANDREA SCALAMATO=1, GIUSEPPE MILIO=1, DANIELE LIVI=1

### storage/@listino_prezzi
- Esiste: SI
- Count record: 52
- Alternative controllate: @listino_prezzi count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| articoloCanonico | 52 | 0 | 52 | 1 | string |
| fonteAttuale | 52 | 0 | 52 | 1 | object |
| fornitoreId | 52 | 0 | 52 | 1 | string |
| fornitoreNome | 52 | 0 | 52 | 1 | string |
| id | 52 | 0 | 52 | 1 | string |
| prezzoAttuale | 52 | 0 | 52 | 1 | number |
| trend | 52 | 0 | 52 | 1 | string |
| unita | 52 | 0 | 52 | 1 | string |
| updatedAt | 52 | 0 | 52 | 1 | number |
| valuta | 52 | 0 | 52 | 1 | string |
| deltaAbs | 12 | 0 | 52 | 0.231 | number |
| deltaPct | 12 | 0 | 52 | 0.231 | number |
| note | 12 | 5 | 52 | 0.231 | string |
| codiceArticolo | 8 | 44 | 52 | 0.154 | string |
| fontePrecedente | 8 | 0 | 52 | 0.154 | object |
| prezzoPrecedente | 8 | 0 | 52 | 0.154 | number |

Valori distinti categoriali principali:
- fornitoreNome: distinct=2, missing=0, MARIBA=33, TRUCK SERVICE=19
- valuta: distinct=2, missing=0, EUR=33, CHF=19
- unita: distinct=4, missing=0, 1=3, PZ=42, LT=4, MT=3

### storage/@manutenzioni
- Esiste: SI
- Count record: 50
- Alternative controllate: @manutenzioni count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| data | 50 | 0 | 50 | 1 | string |
| descrizione | 50 | 0 | 50 | 1 | string |
| id | 50 | 0 | 50 | 1 | string |
| targa | 50 | 0 | 50 | 1 | string |
| tipo | 50 | 0 | 50 | 1 | string |
| fornitore | 25 | 24 | 50 | 0.5 | string |
| km | 24 | 26 | 50 | 0.48 | number |
| eseguito | 22 | 28 | 50 | 0.44 | string |
| materiali | 12 | 38 | 50 | 0.24 | array |
| sottotipo | 10 | 40 | 50 | 0.2 | string |
| ore | 9 | 41 | 50 | 0.18 | number |
| gommeInterventoTipo | 3 | 0 | 50 | 0.06 | string |
| assiCoinvolti | 1 | 0 | 50 | 0.02 | array |
| gommePerAsse | 1 | 0 | 50 | 0.02 | array |
| gommeStraordinario | 1 | 0 | 50 | 0.02 | object |
| importo | 1 | 20 | 50 | 0.02 | number |
| sourceDocumentId | 1 | 0 | 50 | 0.02 | string |

Valori distinti categoriali principali:
- tipo: distinct=3, missing=0, mezzo=39, compressore=10, attrezzature=1
- sottotipo: distinct=2, missing=40, motrice=6, trattore=4
- eseguito: distinct=4, missing=28, MILIO=11, VALTELLINA PNEUMATICI=9, SCIURBA=1, TURBO DIESEL / SCIURBA =1
- gommeInterventoTipo: distinct=2, missing=47, straordinario=2, ordinario=1

### storage/@materialiconsegnati
- Esiste: SI
- Count record: 33
- Alternative controllate: @materialiconsegnati count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| data | 33 | 0 | 33 | 1 | string |
| descrizione | 33 | 0 | 33 | 1 | string |
| destinatario | 33 | 0 | 33 | 1 | object |
| direzione | 33 | 0 | 33 | 1 | string |
| id | 33 | 0 | 33 | 1 | string |
| materiale | 33 | 0 | 33 | 1 | string |
| materialeLabel | 33 | 0 | 33 | 1 | string |
| motivo | 33 | 0 | 33 | 1 | string |
| origine | 33 | 0 | 33 | 1 | string |
| quantita | 33 | 0 | 33 | 1 | number |
| stockKey | 33 | 0 | 33 | 1 | string |
| tipo | 33 | 0 | 33 | 1 | string |
| unita | 33 | 0 | 33 | 1 | string |
| target | 32 | 0 | 33 | 0.97 | string |
| fornitore | 30 | 3 | 33 | 0.909 | string |
| fornitoreLabel | 30 | 3 | 33 | 0.909 | string |
| inventarioRefId | 13 | 20 | 33 | 0.394 | string |
| materialeId | 4 | 0 | 33 | 0.121 | string |
| mezzoTarga | 4 | 0 | 33 | 0.121 | string |
| targa | 4 | 0 | 33 | 0.121 | string |

Valori distinti categoriali principali:
- tipo: distinct=1, missing=0, OUT=33
- direzione: distinct=1, missing=0, OUT=33
- origine: distinct=2, missing=0, MAGAZZINO_NEXT=29, MANUTENZIONE=4
- targa: distinct=3, missing=29, TI136914=2, TI298409=1, TI282780=1

### storage/@mezzi_aziendali
- Esiste: SI
- Count record: 37
- Alternative controllate: @mezzi_aziendali count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| autistaId | 37 | 0 | 37 | 1 | string |
| autistaNome | 37 | 0 | 37 | 1 | string |
| categoria | 37 | 0 | 37 | 1 | string |
| colore | 37 | 0 | 37 | 1 | string |
| dataImmatricolazione | 37 | 0 | 37 | 1 | string |
| id | 37 | 0 | 37 | 1 | string |
| manutenzioneProgrammata | 37 | 0 | 37 | 1 | boolean |
| marca | 37 | 0 | 37 | 1 | string |
| marcaModello | 37 | 0 | 37 | 1 | string |
| modello | 37 | 0 | 37 | 1 | string |
| targa | 37 | 0 | 37 | 1 | string |
| tipo | 37 | 0 | 37 | 1 | string |
| proprietario | 36 | 1 | 37 | 0.973 | string |
| massaComplessiva | 35 | 2 | 37 | 0.946 | string |
| dataScadenzaRevisione | 34 | 3 | 37 | 0.919 | string |
| telaio | 34 | 3 | 37 | 0.919 | string |
| librettoStoragePath | 32 | 0 | 37 | 0.865 | string |
| librettoUrl | 32 | 0 | 37 | 0.865 | string |
| anno | 31 | 0 | 37 | 0.838 | string |
| fotoUrl | 31 | 6 | 37 | 0.838 | string |
| fotoPath | 27 | 9 | 37 | 0.73 | string |
| dataUltimoCollaudo | 25 | 12 | 37 | 0.676 | string |
| note | 17 | 20 | 37 | 0.459 | string |
| potenza | 17 | 20 | 37 | 0.459 | string |
| cilindrata | 16 | 21 | 37 | 0.432 | string |
| assicurazione | 13 | 24 | 37 | 0.351 | string |
| prenotazioneCollaudo | 9 | 1 | 37 | 0.243 | object |
| manutenzioneContratto | 6 | 31 | 37 | 0.162 | string |
| manutenzioneDataFine | 6 | 31 | 37 | 0.162 | string |
| manutenzioneDataInizio | 6 | 31 | 37 | 0.162 | string |
| approvazioneTipo | 4 | 0 | 37 | 0.108 | string |
| caricoUtileSella | 4 | 0 | 37 | 0.108 | string |
| genereVeicolo | 4 | 0 | 37 | 0.108 | string |
| indirizzo | 4 | 0 | 37 | 0.108 | string |
| localita | 4 | 0 | 37 | 0.108 | string |
| luogoDataRilascio | 4 | 0 | 37 | 0.108 | string |
| manutenzioneKmMax | 4 | 33 | 37 | 0.108 | string |
| nAvs | 4 | 0 | 37 | 0.108 | string |
| numeroMatricola | 4 | 0 | 37 | 0.108 | string |
| pesoTotale | 4 | 0 | 37 | 0.108 | string |
| pesoVuoto | 4 | 0 | 37 | 0.108 | string |
| annotazioni | 3 | 1 | 37 | 0.081 | string |
| carrozzeria | 3 | 1 | 37 | 0.081 | string |
| pesoTotaleRimorchio | 3 | 1 | 37 | 0.081 | string |
| preCollaudo | 3 | 0 | 37 | 0.081 | object |
| primaImmatricolazione | 2 | 0 | 37 | 0.054 | string |
| caricoSulLetto | 0 | 4 | 37 | 0 |  |
| pesoRimorchiabile | 0 | 4 | 37 | 0 |  |
| statoOrigine | 0 | 4 | 37 | 0 |  |

Valori distinti categoriali principali:
- tipo: distinct=2, missing=0, motrice=19, cisterna=18
- categoria: distinct=12, missing=0, trattore stradale=10, semirimorchio asse sterzante=8, pianale=3, motrice 3 assi=2, semirimorchio asse fisso=2, biga=2, vasca=2, Trattore a sella=2, centina=2, porta silo container=2, motrice 2 assi=1, motrice 4 assi=1
- manutenzioneProgrammata: distinct=2, missing=0, false=31, true=6

### storage/@mezzi_foto_viste
- Esiste: SI
- Count record: 0
- Alternative controllate: @mezzi_foto_viste count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|

Valori distinti categoriali principali:

### storage/@mezzi_hotspot_mapping
- Esiste: SI
- Count record: 0
- Alternative controllate: @mezzi_hotspot_mapping count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|

Valori distinti categoriali principali:

### storage/@officine
- Esiste: SI
- Count record: 2
- Alternative controllate: @officine count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| citta | 2 | 0 | 2 | 1 | string |
| id | 2 | 0 | 2 | 1 | string |
| nome | 2 | 0 | 2 | 1 | string |
| telefono | 2 | 0 | 2 | 1 | string |
| telefoniAggiuntivi | 0 | 2 | 2 | 0 |  |

Valori distinti categoriali principali:
- citta: distinct=2, missing=0, VIGGIU'=1, Manno=1

### storage/@ordini
- Esiste: SI
- Count record: 5
- Alternative controllate: @ordini count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| arrivato | 5 | 0 | 5 | 1 | boolean |
| dataOrdine | 5 | 0 | 5 | 1 | string |
| id | 5 | 0 | 5 | 1 | string |
| idFornitore | 5 | 0 | 5 | 1 | string |
| materiali | 5 | 0 | 5 | 1 | array |
| nomeFornitore | 5 | 0 | 5 | 1 | string |

Valori distinti categoriali principali:
- nomeFornitore: distinct=3, missing=0, MARIBA=3, Euromecc=1, TRUCK SERVICE=1
- arrivato: distinct=2, missing=0, false=3, true=2

### storage/@preventivi
- Esiste: SI
- Count record: 12
- Alternative controllate: @preventivi count=0
| Campo | Presente | Vuoto | Totale | Coverage | Tipi |
|---|---:|---:|---:|---:|---|
| createdAt | 12 | 0 | 12 | 1 | number |
| dataPreventivo | 12 | 0 | 12 | 1 | string |
| fornitoreId | 12 | 0 | 12 | 1 | string |
| fornitoreNome | 12 | 0 | 12 | 1 | string |
| id | 12 | 0 | 12 | 1 | string |
| numeroPreventivo | 12 | 0 | 12 | 1 | string |
| righe | 12 | 0 | 12 | 1 | array |
| updatedAt | 12 | 0 | 12 | 1 | number |
| imageStoragePaths | 6 | 6 | 12 | 0.5 | array |
| imageUrls | 6 | 6 | 12 | 0.5 | array |
| pdfStoragePath | 2 | 10 | 12 | 0.167 | string |
| pdfUrl | 2 | 10 | 12 | 0.167 | string |
| ricevutoDaWhatsapp | 1 | 0 | 12 | 0.083 | boolean |

Valori distinti categoriali principali:
- fonte: distinct=0, missing=12
- fornitoreNome: distinct=2, missing=0, MARIBA=6, TRUCK SERVICE=6
- valuta: distinct=0, missing=12

## Allegato B - Lista Campi per Modale
### NextAnagraficaModal (collega)
- File: src/next/components/NextAnagraficaModal.tsx
- storage/@colleghi:
  - id | tipo=string | origine=form/id esistente o generated
  - nome | tipo=string | origine=form input
  - telefono | tipo=string | origine=form input
  - telefonoPrivato | tipo=string | origine=form input
  - badge | tipo=string | origine=form input
  - descrizione | tipo=string | origine=form input
  - codice | tipo=string | origine=form input
  - pinSim | tipo=string | origine=form input
  - pukSim | tipo=string | origine=form input
  - schedeCarburante | tipo=array<object> | origine=form input
### NextAnagraficaModal (fornitore)
- File: src/next/components/NextAnagraficaModal.tsx
- storage/@fornitori:
  - id | tipo=string | origine=form/id esistente o generated
  - nome | tipo=string | origine=form input
  - telefono | tipo=string | origine=form input
  - descrizione | tipo=string | origine=form input
### NextAnagraficaModal (officina)
- File: src/next/components/NextAnagraficaModal.tsx
- storage/@officine:
  - id | tipo=string | origine=form/id esistente o generated
  - nome | tipo=string | origine=form input
  - telefono | tipo=string | origine=form input
  - telefoniAggiuntivi | tipo=array<string> | origine=form input
  - descrizione | tipo=string | origine=form input
  - citta | tipo=string | origine=form input
### NextMezzoEditModal
- File: src/next/components/NextMezzoEditModal.tsx
- storage/@mezzi_aziendali:
  - tipo | tipo=string | origine=form input
  - categoria | tipo=string | origine=form input
  - anno | tipo=string|number | origine=form input
  - targa | tipo=string | origine=form input
  - marca | tipo=string | origine=form input
  - modello | tipo=string | origine=form input
  - marcaModello | tipo=string | origine=computed
  - telaio | tipo=string | origine=form input
  - colore | tipo=string | origine=form input
  - cilindrata | tipo=string | origine=form input
  - potenza | tipo=string | origine=form input
  - massaComplessiva | tipo=string | origine=form input
  - proprietario | tipo=string | origine=form input
  - assicurazione | tipo=string | origine=form input
  - dataImmatricolazione | tipo=string | origine=form input
  - dataScadenzaRevisione | tipo=string | origine=form input
  - dataUltimoCollaudo | tipo=string | origine=form input
  - manutenzioneProgrammata | tipo=boolean | origine=form input
  - manutenzioneDataInizio | tipo=string | origine=form input
  - manutenzioneDataFine | tipo=string | origine=form input
  - manutenzioneKmMax | tipo=string | origine=form input
  - manutenzioneContratto | tipo=string | origine=form input
  - note | tipo=string | origine=form input
  - autistaId | tipo=string|null | origine=form input
  - autistaNome | tipo=string|null | origine=computed
### NextScadenzeCollaudiPage (prenotazione collaudo)
- File: src/next/NextScadenzeCollaudiPage.tsx
- storage/@mezzi_aziendali:
  - prenotazioneCollaudo.data | tipo=string | origine=form input
  - prenotazioneCollaudo.ora | tipo=string | origine=form input
  - prenotazioneCollaudo.luogo | tipo=string | origine=form input
  - prenotazioneCollaudo.note | tipo=string | origine=form input
### NextScadenzeCollaudiPage (pre-collaudo)
- File: src/next/NextScadenzeCollaudiPage.tsx
- storage/@mezzi_aziendali:
  - preCollaudo.data | tipo=string | origine=form input
  - preCollaudo.officina | tipo=string | origine=form input
  - preCollaudo.lavoriPrevisti | tipo=string | origine=form input
### NextScadenzeCollaudiPage (revisione completata)
- File: src/next/NextScadenzeCollaudiPage.tsx
- storage/@mezzi_aziendali:
  - dataUltimoCollaudo | tipo=string | origine=form input
  - dataScadenzaRevisione | tipo=string | origine=computed
  - prenotazioneCollaudo.completata | tipo=boolean | origine=default
  - prenotazioneCollaudo.completataIl | tipo=string | origine=form input
  - prenotazioneCollaudo.esito | tipo=string | origine=form input
  - prenotazioneCollaudo.noteEsito | tipo=string | origine=form input
  - note | tipo=string | origine=computed
### NextPreventivoManualeModal
- File: src/next/NextPreventivoManualeModal.tsx
- Storage upload: preventivi/manuali/{preventivoId}_{index}.{ext} (image/pdf)
- storage/@preventivi:
  - id | tipo=string | origine=computed
  - fonte | tipo=string | origine=default
  - fornitoreId | tipo=string | origine=form input
  - fornitoreNome | tipo=string | origine=form input
  - numeroPreventivo | tipo=string | origine=form input
  - dataPreventivo | tipo=string | origine=form input
  - righe | tipo=array<object> | origine=form input
  - valuta | tipo=string | origine=form input
  - imageStoragePaths | tipo=array<string> | origine=computed
  - imageUrls | tipo=array<string> | origine=computed
  - pdfStoragePath | tipo=string|null | origine=computed
  - pdfUrl | tipo=string|null | origine=computed
  - createdAt | tipo=string | origine=computed
  - updatedAt | tipo=string | origine=computed
- storage/@listino_prezzi:
  - id | tipo=string | origine=computed
  - fornitoreId | tipo=string | origine=form input
  - fornitoreNome | tipo=string | origine=form input
  - articoloCanonico | tipo=string | origine=form input
  - codiceArticolo | tipo=string | origine=form input
  - unita | tipo=string | origine=form input
  - prezzoAttuale | tipo=number | origine=form input
  - valuta | tipo=string | origine=form input
  - preventivoId | tipo=string | origine=computed
  - updatedAt | tipo=string | origine=computed
### NextPreventivoIaModal
- File: src/next/NextPreventivoIaModal.tsx
- Storage upload: preventivi/ia/{preventivoId}_{index}.{ext} (image/pdf)
- storage/@preventivi:
  - id | tipo=string | origine=computed
  - fonte | tipo=string | origine=default
  - fornitoreId | tipo=string | origine=estrazione IA + correzione form
  - fornitoreNome | tipo=string | origine=estrazione IA + correzione form
  - numeroPreventivo | tipo=string | origine=estrazione IA + correzione form
  - dataPreventivo | tipo=string | origine=estrazione IA + correzione form
  - righe | tipo=array<object> | origine=estrazione IA + correzione form
  - valuta | tipo=string | origine=estrazione IA + correzione form
  - imageStoragePaths | tipo=array<string> | origine=computed
  - imageUrls | tipo=array<string> | origine=computed
  - pdfStoragePath | tipo=string|null | origine=computed
  - pdfUrl | tipo=string|null | origine=computed
  - createdAt | tipo=string | origine=computed
  - updatedAt | tipo=string | origine=computed
- storage/@listino_prezzi:
  - id | tipo=string | origine=computed
  - fornitoreId | tipo=string | origine=estrazione IA + correzione form
  - fornitoreNome | tipo=string | origine=estrazione IA + correzione form
  - articoloCanonico | tipo=string | origine=estrazione IA + correzione form
  - codiceArticolo | tipo=string | origine=estrazione IA + correzione form
  - unita | tipo=string | origine=estrazione IA + correzione form
  - prezzoAttuale | tipo=number | origine=estrazione IA + correzione form
  - valuta | tipo=string | origine=estrazione IA + correzione form
  - preventivoId | tipo=string | origine=computed
  - updatedAt | tipo=string | origine=computed
### ChatIaReportModal
- File: src/next/chat-ia/components/ChatIaReportModal.tsx
- Storage upload: chat_ia_reports/{sector}/{year}/{id}.pdf (application/pdf)
- chat_ia_reports:
  - version | tipo=number | origine=default
  - status | tipo=string | origine=default
  - prompt | tipo=string | origine=prop
  - title | tipo=string | origine=prop
  - sector | tipo=string | origine=prop
  - targetKind | tipo=string | origine=prop
  - targetValue | tipo=string | origine=prop
  - periodFrom | tipo=string|null | origine=prop
  - periodTo | tipo=string|null | origine=prop
  - summary | tipo=string|null | origine=prop
  - blocks | tipo=array<object> | origine=prop
  - pdfUrl | tipo=string | origine=computed
  - pdfStoragePath | tipo=string | origine=computed
  - createdAt | tipo=string | origine=computed
  - updatedAt | tipo=string | origine=computed
  - meta | tipo=object | origine=prop
  - deletedAt | tipo=string | origine=computed
### NextAttrezzatureCantieriWritePanel
- File: src/next/NextAttrezzatureCantieriWritePanel.tsx
- Storage upload: attrezzature/{movimentoId}-{timestamp}.{ext} (image)
- storage/@attrezzature_cantieri:
  - id | tipo=string | origine=computed
  - tipo | tipo=string | origine=form input
  - data | tipo=string | origine=form input
  - materialeCategoria | tipo=string | origine=form input
  - descrizione | tipo=string | origine=form input
  - quantita | tipo=number | origine=form input
  - unita | tipo=string | origine=form input
  - cantiereId | tipo=string | origine=form input
  - cantiereLabel | tipo=string | origine=form input
  - note | tipo=string|null | origine=form input
  - fotoUrl | tipo=string|null | origine=computed
  - fotoStoragePath | tipo=string|null | origine=computed
  - sourceCantiereId | tipo=string|null | origine=form input
  - sourceCantiereLabel | tipo=string|null | origine=form input
### NextManutenzioniPage (form manutenzione)
- File: src/next/NextManutenzioniPage.tsx
- storage/@manutenzioni:
  - id | tipo=string | origine=computed
  - targa | tipo=string | origine=form input
  - tipo | tipo=string | origine=form input
  - fornitore | tipo=string|null | origine=form input
  - km | tipo=number|null | origine=form input
  - ore | tipo=number|null | origine=form input
  - sottotipo | tipo=string|null | origine=form input
  - descrizione | tipo=string | origine=form input
  - eseguito | tipo=string|null | origine=form input
  - data | tipo=string | origine=form input
  - materiali | tipo=array<object> | origine=form input
  - importo | tipo=number|null | origine=form input
  - gommeInterventoTipo | tipo=string | origine=form input
  - gommeStraordinario | tipo=object | origine=form input
  - assiCoinvolti | tipo=array<string> | origine=form input
  - gommePerAsse | tipo=array<object> | origine=form input
  - sourceDocumentId | tipo=string | origine=prop
- storage/@inventario:
  - quantita | tipo=number | origine=computed
  - quantitaTotale | tipo=number | origine=computed
  - stockKey | tipo=string|null | origine=computed
- storage/@materialiconsegnati:
  - id | tipo=string | origine=computed
  - tipo | tipo=string | origine=default
  - direzione | tipo=string | origine=default
  - data | tipo=string | origine=form input
  - materialeId | tipo=string | origine=form input
  - inventarioRefId | tipo=string | origine=form input
  - materialeLabel | tipo=string | origine=form input
  - descrizione | tipo=string | origine=form input
  - quantita | tipo=number | origine=form input
  - unita | tipo=string | origine=form input
  - origine | tipo=string | origine=default
  - targa | tipo=string | origine=form input
  - mezzoTarga | tipo=string | origine=form input
  - fornitore | tipo=string | origine=computed
  - stockKey | tipo=string|null | origine=computed
  - destinatario | tipo=object | origine=computed
  - motivo | tipo=string | origine=default
### NextManutenzioniPage (eliminazione manutenzione)
- File: src/next/NextManutenzioniPage.tsx
- storage/@manutenzioni:
  - id | tipo=string | origine=prop
- storage/@inventario:
  - quantita | tipo=number | origine=computed
  - quantitaTotale | tipo=number | origine=computed
- storage/@materialiconsegnati:
  - id | tipo=string | origine=prop
  - motivo | tipo=string | origine=prop
  - destinatario.refId | tipo=string | origine=prop
### NextLavoriDaEseguirePage (gruppo lavori)
- File: src/next/NextLavoriDaEseguirePage.tsx
- storage/@lavori:
  - id | tipo=string | origine=computed
  - gruppoId | tipo=string | origine=computed
  - tipo | tipo=string | origine=form input
  - targa | tipo=string | origine=form input
  - descrizione | tipo=string | origine=form input
  - dataInserimento | tipo=string | origine=form input
  - eseguito | tipo=boolean | origine=default
  - urgenza | tipo=string | origine=form input
  - segnalatoDa | tipo=string | origine=default
  - sottoElementi | tipo=array | origine=default
### NextDettaglioLavoroPage (modifica lavoro)
- File: src/next/NextDettaglioLavoroPage.tsx
- storage/@lavori:
  - descrizione | tipo=string | origine=form input
  - dataInserimento | tipo=string | origine=form input
### NextDettaglioLavoroPage (esegui lavoro)
- File: src/next/NextDettaglioLavoroPage.tsx
- storage/@lavori:
  - eseguito | tipo=boolean | origine=default
  - chiHaEseguito | tipo=string | origine=form input
  - dataEsecuzione | tipo=string | origine=computed
### NextDettaglioLavoroPage (elimina lavoro)
- File: src/next/NextDettaglioLavoroPage.tsx
- storage/@lavori:
  - id | tipo=string | origine=prop
### NextMappaStoricoPage (upload foto vista)
- File: src/next/NextMappaStoricoPage.tsx
- Storage upload: mezzi_foto/{TARGA}/{vista}_{uploadedAt}.{ext} (image)
- storage/@mezzi_foto_viste:
  - id | tipo=string | origine=computed
  - targa | tipo=string | origine=prop
  - vista | tipo=string | origine=form input
  - storagePath | tipo=string | origine=computed
  - downloadUrl | tipo=string | origine=computed
  - fileName | tipo=string | origine=form input
  - contentType | tipo=string|null | origine=form input
  - uploadedAt | tipo=number | origine=computed
### NextMappaStoricoPage (hotspot mappa)
- File: src/next/NextMappaStoricoPage.tsx
- storage/@mezzi_hotspot_mapping:
  - id | tipo=string | origine=computed
  - targa | tipo=string | origine=prop
  - vista | tipo=string | origine=form input
  - areaId | tipo=string | origine=form input
  - x | tipo=number | origine=computed
  - y | tipo=number | origine=computed
  - createdAt | tipo=number | origine=computed
### NextIALibrettoPage (salva libretto)
- File: src/next/NextIALibrettoPage.tsx
- Storage upload: mezzi_aziendali/{mezzoId}/libretto.jpg (image/data_url)
- storage/@mezzi_aziendali:
  - id | tipo=string | origine=computed
  - tipo | tipo=string | origine=default
  - categoria | tipo=string | origine=estrazione IA + correzione form
  - targa | tipo=string | origine=estrazione IA + correzione form
  - marca | tipo=string | origine=estrazione IA + correzione form
  - modello | tipo=string | origine=estrazione IA + correzione form
  - marcaModello | tipo=string | origine=computed
  - telaio | tipo=string | origine=estrazione IA + correzione form
  - colore | tipo=string | origine=estrazione IA + correzione form
  - cilindrata | tipo=string | origine=estrazione IA + correzione form
  - potenza | tipo=string | origine=estrazione IA + correzione form
  - massaComplessiva | tipo=string | origine=estrazione IA + correzione form
  - proprietario | tipo=string | origine=estrazione IA + correzione form
  - assicurazione | tipo=string | origine=estrazione IA + correzione form
  - dataImmatricolazione | tipo=string | origine=estrazione IA + correzione form
  - dataUltimoCollaudo | tipo=string | origine=estrazione IA + correzione form
  - dataScadenzaRevisione | tipo=string | origine=estrazione IA + correzione form
  - note | tipo=string | origine=estrazione IA + correzione form
  - anno | tipo=string | origine=computed
  - librettoUrl | tipo=string | origine=computed
  - librettoStoragePath | tipo=string | origine=computed
### NextMagazzinoPage (inventario)
- File: src/next/NextMagazzinoPage.tsx
- Storage upload: inventario/{itemId}/foto.{ext} (image)
- storage/@inventario:
  - id | tipo=string | origine=computed
  - descrizione | tipo=string | origine=form input
  - quantita | tipo=number | origine=form input
  - quantitaTotale | tipo=number | origine=computed
  - unita | tipo=string | origine=form input
  - stockKey | tipo=string|null | origine=computed
  - stockLoadKeys | tipo=array<string> | origine=computed
  - fotoUrl | tipo=string|null | origine=computed
  - fotoStoragePath | tipo=string|null | origine=computed
  - fornitore | tipo=string|null | origine=form input
  - fornitoreLabel | tipo=string|null | origine=form input
  - nomeFornitore | tipo=string|null | origine=form input
  - sogliaMinima | tipo=number | origine=form input
### NextMagazzinoPage (consegna materiale)
- File: src/next/NextMagazzinoPage.tsx
- storage/@materialiconsegnati:
  - id | tipo=string | origine=computed
  - descrizione | tipo=string | origine=form input
  - materiale | tipo=string | origine=form input
  - materialeLabel | tipo=string | origine=form input
  - quantita | tipo=number | origine=form input
  - unita | tipo=string | origine=form input
  - destinatario | tipo=object | origine=form input
  - target | tipo=string | origine=computed
  - motivo | tipo=string|null | origine=form input
  - data | tipo=string | origine=form input
  - fornitore | tipo=string|null | origine=computed
  - inventarioRefId | tipo=string|null | origine=computed
  - stockKey | tipo=string|null | origine=computed
  - direzione | tipo=string | origine=default
  - tipo | tipo=string | origine=default
  - origine | tipo=string | origine=default
  - mezzoTarga | tipo=string|null | origine=computed
  - targa | tipo=string|null | origine=computed
- storage/@inventario:
  - quantita | tipo=number | origine=computed
### NextMagazzinoPage (cambio cisterna AdBlue)
- File: src/next/NextMagazzinoPage.tsx
- storage/@cisterne_adblue:
  - id | tipo=string | origine=computed
  - data | tipo=string | origine=form input
  - quantitaLitri | tipo=number | origine=form input
  - quantita | tipo=number | origine=form input
  - litri | tipo=number | origine=form input
  - inventarioRefId | tipo=string|null | origine=computed
  - stockKey | tipo=string|null | origine=computed
  - materialeLabel | tipo=string | origine=default
  - descrizione | tipo=string | origine=default
  - unita | tipo=string | origine=default
  - numeroCisterna | tipo=string|null | origine=form input
  - note | tipo=string|null | origine=form input
- storage/@inventario:
  - quantita | tipo=number | origine=computed
### NextMagazzinoPage (consolidamento documenti/arrivi)
- File: src/next/NextMagazzinoPage.tsx
- storage/@inventario:
  - quantita | tipo=number | origine=computed
  - unita | tipo=string | origine=computed
  - stockKey | tipo=string|null | origine=computed
  - stockLoadKeys | tipo=array<string> | origine=computed
  - fornitore | tipo=string|null | origine=computed
### NextMaterialiDaOrdinarePage (crea ordine)
- File: src/next/NextMaterialiDaOrdinarePage.tsx
- Storage upload: materiali/{id}-{timestamp}.{ext} (image)
- storage/@ordini:
  - id | tipo=string | origine=computed
  - idFornitore | tipo=string | origine=form input
  - nomeFornitore | tipo=string | origine=form input
  - dataOrdine | tipo=string | origine=computed
  - materiali | tipo=array<object> | origine=form input
  - materiali[].id | tipo=string | origine=form input
  - materiali[].descrizione | tipo=string | origine=form input
  - materiali[].quantita | tipo=number | origine=form input
  - materiali[].unita | tipo=string | origine=form input
  - materiali[].arrivato | tipo=boolean | origine=default
  - materiali[].fotoUrl | tipo=string|null | origine=computed
  - materiali[].fotoStoragePath | tipo=string|null | origine=computed
  - arrivato | tipo=boolean | origine=default
### NextProcurementReadOnlyPanel (dettaglio ordine)
- File: src/next/NextProcurementReadOnlyPanel.tsx
- Storage upload: materiali/{id}-{timestamp}.{ext} (image)
- storage/@ordini:
  - id | tipo=string | origine=prop
  - idFornitore | tipo=string | origine=prop
  - nomeFornitore | tipo=string | origine=prop
  - dataOrdine | tipo=string | origine=prop
  - materiali | tipo=array<object> | origine=form input
  - materiali[].id | tipo=string | origine=form input
  - materiali[].descrizione | tipo=string | origine=form input
  - materiali[].quantita | tipo=number | origine=form input
  - materiali[].unita | tipo=string | origine=form input
  - materiali[].arrivato | tipo=boolean | origine=form input
  - materiali[].dataArrivo | tipo=string|null | origine=form input
  - materiali[].fotoUrl | tipo=string|null | origine=computed
  - materiali[].fotoStoragePath | tipo=string|null | origine=computed
  - materiali[].note | tipo=string|null | origine=form input
  - materiali[].prezzoUnitario | tipo=number|null | origine=form input
  - materiali[].valuta | tipo=string|null | origine=form input
  - materiali[].unitaPrezzo | tipo=string|null | origine=form input
  - arrivato | tipo=boolean | origine=computed
  - ordineNote | tipo=string|null | origine=form input
### NextIADocumentiPage (modifica valuta)
- File: src/next/NextIADocumentiPage.tsx
- @documenti_mezzi:
  - currency | tipo=string | origine=form input
  - valuta | tipo=string | origine=form input
- @documenti_magazzino:
  - currency | tipo=string | origine=form input
  - valuta | tipo=string | origine=form input
- @documenti_generici:
  - currency | tipo=string | origine=form input
  - valuta | tipo=string | origine=form input
- storage/@costiMezzo:
  - currency | tipo=string | origine=form input
  - valuta | tipo=string | origine=form input
### NextIADocumentiPage (elimina documento)
- File: src/next/NextIADocumentiPage.tsx
- @documenti_mezzi:
  - sourceDocId | tipo=string | origine=prop
- @documenti_magazzino:
  - sourceDocId | tipo=string | origine=prop
- @documenti_generici:
  - sourceDocId | tipo=string | origine=prop
- storage/@costiMezzo:
  - sourceDocId | tipo=string | origine=prop
### NextDossierMezzoPage (elimina fattura)
- File: src/next/NextDossierMezzoPage.tsx
- @documenti_mezzi:
  - sourceDocId | tipo=string | origine=prop
- @documenti_magazzino:
  - sourceDocId | tipo=string | origine=prop
- @documenti_generici:
  - sourceDocId | tipo=string | origine=prop
- storage/@costiMezzo:
  - sourceDocId | tipo=string | origine=prop
### NextCisternaPage (cambio EUR/CHF)
- File: src/next/NextCisternaPage.tsx
- @cisterna_parametri_mensili:
  - mese | tipo=string | origine=computed
  - cambioEurChf | tipo=number|null | origine=form input
  - updatedAt | tipo=Timestamp | origine=computed
### NextCisternaPage (scelta duplicato)
- File: src/next/NextCisternaPage.tsx
- @documenti_cisterna:
  - dupGroupKey | tipo=string | origine=computed
  - dupChosen | tipo=boolean | origine=computed
  - dupIgnored | tipo=boolean | origine=computed
  - updatedAt | tipo=Timestamp | origine=computed
### NextCisternaIAPage (documento IA)
- File: src/next/NextCisternaIAPage.tsx
- Storage upload: documenti_pdf/cisterna/{yyyy}/{mm}/{timestamp}_{safeName} (pdf/image)
- @documenti_cisterna:
  - tipoDocumento | tipo=string | origine=estrazione IA + correzione form
  - fornitore | tipo=string|null | origine=estrazione IA + correzione form
  - destinatario | tipo=string|null | origine=estrazione IA + correzione form
  - numeroDocumento | tipo=string|null | origine=estrazione IA + correzione form
  - dataDocumento | tipo=string|null | origine=estrazione IA + correzione form
  - yearMonth | tipo=string | origine=computed
  - mese | tipo=string | origine=computed
  - litriTotali | tipo=number|null | origine=estrazione IA + correzione form
  - litri15C | tipo=number|null | origine=estrazione IA + correzione form
  - totaleDocumento | tipo=number|null | origine=estrazione IA + correzione form
  - valuta | tipo=string|null | origine=estrazione IA + correzione form
  - currency | tipo=string|null | origine=estrazione IA + correzione form
  - prodotto | tipo=string|null | origine=estrazione IA + correzione form
  - testo | tipo=string|null | origine=estrazione IA + correzione form
  - daVerificare | tipo=boolean | origine=computed
  - motivoVerifica | tipo=string|null | origine=computed
  - fileUrl | tipo=string | origine=computed
  - storagePath | tipo=string|null | origine=computed
  - nomeFile | tipo=string|null | origine=form input
  - fonte | tipo=string | origine=default
  - createdAt | tipo=Timestamp | origine=computed
  - iaEngine | tipo=string | origine=default
### NextCisternaSchedeTestPage (upload ritaglio scheda)
- File: src/next/NextCisternaSchedeTestPage.tsx
- Storage upload: documenti_pdf/cisterna_schede/{yyyy}/{mm}/{timestamp}_{safeName}_crop.jpg (image/jpeg)
- Nessun record Firestore associato nel codice rilevato.
### NextCisternaSchedeTestPage (salva scheda)
- File: src/next/NextCisternaSchedeTestPage.tsx
- Storage upload: documenti_pdf/cisterna_schede/{yyyy}/{mm}/{timestamp}_{safeName}_crop.jpg (image/jpeg)
- @cisterna_schede_ia:
  - source | tipo=string | origine=form input
  - rowCount | tipo=number | origine=computed
  - rows | tipo=array<object> | origine=estrazione IA + correzione form
  - needsReview | tipo=boolean | origine=computed
  - yearMonth | tipo=string | origine=computed
  - fileUrl | tipo=string|null | origine=computed
  - storagePath | tipo=string|null | origine=computed
  - nomeFile | tipo=string|null | origine=form input
  - rawLines | tipo=array<string> | origine=estrazione IA + correzione form
  - summary | tipo=object | origine=computed
  - fonte | tipo=string | origine=default
  - iaEngine | tipo=string | origine=default
  - createdAt | tipo=Timestamp | origine=computed
  - updatedAt | tipo=Timestamp | origine=computed
### NextEuromeccPage (relazione bozza)
- File: src/next/NextEuromeccPage.tsx
- euromecc_relazioni:
  - fileName | tipo=string | origine=form input
  - fileType | tipo=string | origine=form input
  - dataIntervento | tipo=string | origine=estrazione IA + correzione form
  - tecnici | tipo=array | origine=estrazione IA + correzione form
  - note | tipo=string | origine=form input
  - statoImportazione | tipo=string | origine=default
  - doneCount | tipo=number | origine=default
  - pendingCount | tipo=number | origine=default
  - extraComponentsCount | tipo=number | origine=default
  - createdAt | tipo=Timestamp | origine=computed
  - updatedAt | tipo=Timestamp | origine=computed
### NextEuromeccPage (relazione confermata)
- File: src/next/NextEuromeccPage.tsx
- Storage upload: euromecc/relazioni/{uploadRelazioneId}/{timestamp}_{fileName} (pdf/image)
- euromecc_relazioni:
  - fileName | tipo=string | origine=form input
  - fileType | tipo=string | origine=form input
  - dataIntervento | tipo=string | origine=estrazione IA + correzione form
  - tecnici | tipo=array | origine=estrazione IA + correzione form
  - note | tipo=string | origine=form input
  - statoImportazione | tipo=string | origine=default
  - doneCount | tipo=number | origine=computed
  - pendingCount | tipo=number | origine=computed
  - extraComponentsCount | tipo=number | origine=computed
  - fileUrl | tipo=string|null | origine=computed
  - fileStoragePath | tipo=string|null | origine=computed
  - fileSize | tipo=number|null | origine=computed
  - createdAt | tipo=Timestamp | origine=computed
  - updatedAt | tipo=Timestamp | origine=computed
- euromecc_done:
  - areaKey | tipo=string | origine=estrazione IA + correzione form
  - subKey | tipo=string | origine=estrazione IA + correzione form
  - title | tipo=string | origine=estrazione IA + correzione form
  - doneDate | tipo=string | origine=estrazione IA + correzione form
  - by | tipo=string | origine=estrazione IA + correzione form
  - note | tipo=string | origine=estrazione IA + correzione form
  - nextDate | tipo=string|null | origine=estrazione IA + correzione form
  - closedPending | tipo=boolean | origine=default
  - createdAt | tipo=Timestamp | origine=computed
  - updatedAt | tipo=Timestamp | origine=computed
- euromecc_pending:
  - areaKey | tipo=string | origine=estrazione IA + correzione form
  - subKey | tipo=string | origine=estrazione IA + correzione form
  - title | tipo=string | origine=estrazione IA + correzione form
  - priority | tipo=string | origine=estrazione IA + correzione form
  - dueDate | tipo=string | origine=estrazione IA + correzione form
  - note | tipo=string | origine=estrazione IA + correzione form
  - createdAt | tipo=Timestamp | origine=computed
  - updatedAt | tipo=Timestamp | origine=computed
- euromecc_extra_components:
  - areaKey | tipo=string | origine=estrazione IA + correzione form
  - subKey | tipo=string | origine=computed
  - name | tipo=string | origine=estrazione IA + correzione form
  - code | tipo=string | origine=estrazione IA + correzione form
  - addedFrom | tipo=string | origine=computed
  - addedAt | tipo=string | origine=computed
  - addedBy | tipo=string | origine=estrazione IA + correzione form
  - createdAt | tipo=Timestamp | origine=computed
### NextEuromeccPage (ordine ricambi da relazione)
- File: src/next/NextEuromeccPage.tsx
- storage/@ordini:
  - id | tipo=string | origine=computed
  - idFornitore | tipo=string | origine=default
  - nomeFornitore | tipo=string | origine=form input
  - dataOrdine | tipo=string | origine=form input
  - materiali | tipo=array<object> | origine=estrazione IA + correzione form
  - arrivato | tipo=boolean | origine=default
- euromecc_relazioni:
  - ordineId | tipo=string | origine=computed
  - ordineMateriali | tipo=number | origine=computed
  - statoImportazione | tipo=string | origine=default
  - note | tipo=string | origine=computed
### NextEuromeccPage (task da fare)
- File: src/next/NextEuromeccPage.tsx
- euromecc_pending:
  - areaKey | tipo=string | origine=prop
  - subKey | tipo=string | origine=prop
  - title | tipo=string | origine=form input
  - priority | tipo=string | origine=form input
  - dueDate | tipo=string | origine=form input
  - note | tipo=string | origine=form input
  - createdAt | tipo=Timestamp | origine=computed
  - updatedAt | tipo=Timestamp | origine=computed
### NextEuromeccPage (task fatto)
- File: src/next/NextEuromeccPage.tsx
- euromecc_done:
  - areaKey | tipo=string | origine=prop
  - subKey | tipo=string | origine=prop
  - title | tipo=string | origine=form input
  - doneDate | tipo=string | origine=form input
  - by | tipo=string | origine=form input
  - note | tipo=string | origine=form input
  - nextDate | tipo=string|null | origine=form input
  - closedPending | tipo=boolean | origine=form input
  - createdAt | tipo=Timestamp | origine=computed
  - updatedAt | tipo=Timestamp | origine=computed
### NextEuromeccPage (segnalazione)
- File: src/next/NextEuromeccPage.tsx
- euromecc_issues:
  - areaKey | tipo=string | origine=prop
  - subKey | tipo=string | origine=prop
  - title | tipo=string | origine=form input
  - check | tipo=string | origine=form input
  - type | tipo=string | origine=form input
  - state | tipo=string | origine=form input
  - reportedAt | tipo=string | origine=form input
  - reportedBy | tipo=string | origine=form input
  - note | tipo=string | origine=form input
  - closedDate | tipo=string|null | origine=form input
  - createdAt | tipo=Timestamp | origine=computed
  - updatedAt | tipo=Timestamp | origine=computed
### NextEuromeccPage (tipo cemento silo)
- File: src/next/NextEuromeccPage.tsx
- euromecc_area_meta:
  - areaKey | tipo=string | origine=prop
  - cementType | tipo=string | origine=form input
  - cementTypeShort | tipo=string | origine=form input
  - updatedBy | tipo=string | origine=form input
  - updatedAt | tipo=Timestamp | origine=computed

## Allegato C - Path Firestore Identificati
| Path | Mode | Esiste | Count | Alternative |
|---|---|---:|---:|---|
| @cisterna_parametri_mensili | root_collection | SI | 1 | storage/@cisterna_parametri_mensili:0 |
| @cisterna_schede_ia | root_collection | SI | 4 | storage/@cisterna_schede_ia:0 |
| @documenti_cisterna | root_collection | SI | 3 | storage/@documenti_cisterna:0 |
| @documenti_generici | root_collection | NO | 0 | storage/@documenti_generici:0 |
| @documenti_magazzino | root_collection | SI | 3 | storage/@documenti_magazzino:0 |
| @documenti_mezzi | root_collection | SI | 11 | storage/@documenti_mezzi:0 |
| chat_ia_reports | root_collection | NO | 0 | storage/chat_ia_reports:0 |
| euromecc_area_meta | root_collection | NO | 0 | storage/euromecc_area_meta:0 |
| euromecc_done | root_collection | SI | 54 | storage/euromecc_done:0 |
| euromecc_extra_components | root_collection | NO | 0 | storage/euromecc_extra_components:0 |
| euromecc_issues | root_collection | SI | 2 | storage/euromecc_issues:0 |
| euromecc_pending | root_collection | SI | 4 | storage/euromecc_pending:0 |
| euromecc_relazioni | root_collection | SI | 2 | storage/euromecc_relazioni:0 |
| storage/@attrezzature_cantieri | storage_doc | SI | 12 | @attrezzature_cantieri:0 |
| storage/@cisterne_adblue | storage_doc | SI | 1 | @cisterne_adblue:0 |
| storage/@colleghi | storage_doc | SI | 12 | @colleghi:0 |
| storage/@costiMezzo | storage_doc | SI | 0 | @costiMezzo:0 |
| storage/@fornitori | storage_doc | SI | 4 | @fornitori:0 |
| storage/@inventario | storage_doc | SI | 17 | @inventario:0 |
| storage/@lavori | storage_doc | SI | 13 | @lavori:0 |
| storage/@listino_prezzi | storage_doc | SI | 52 | @listino_prezzi:0 |
| storage/@manutenzioni | storage_doc | SI | 50 | @manutenzioni:0 |
| storage/@materialiconsegnati | storage_doc | SI | 33 | @materialiconsegnati:0 |
| storage/@mezzi_aziendali | storage_doc | SI | 37 | @mezzi_aziendali:0 |
| storage/@mezzi_foto_viste | storage_doc | SI | 0 | @mezzi_foto_viste:0 |
| storage/@mezzi_hotspot_mapping | storage_doc | SI | 0 | @mezzi_hotspot_mapping:0 |
| storage/@officine | storage_doc | SI | 2 | @officine:0 |
| storage/@ordini | storage_doc | SI | 5 | @ordini:0 |
| storage/@preventivi | storage_doc | SI | 12 | @preventivi:0 |

## Autoverifica
- V1 Lista modali esaustiva: PARZIALE, src/next scandita; Archivista escluso senza lettura per divieto esplicito. File scoperti: 406; file letti: 314.
- V2 Per ogni modale identificato: campi scritti documentati in Allegato B.
- V3 Per ogni path Firestore: realta verificata via getDoc/getDocs in Allegato C.
- V4 Per ogni collection: schema reale estratto in Allegato A.
- V5 Per ogni modale: tool chat associato o orfano dichiarato nella Tabella Master.
- V6 Tabella master compilata per ogni modale/form censito.
- V7 Script audit: verificare con node --check e node tests/audit/auditModaliNext.mjs.
- V8 Lint: file .mjs fuori dal perimetro eslint TS/TSX del repo; verificare sintassi con node --check.

## Esclusioni Misurate
- File Archivista esclusi senza lettura: 37
- File backup esclusi da modali attivi: 29
- File modali read-only/local-only esclusi: src/next/autisti/NextGommeAutistaModal.tsx, src/next/autisti/NextModalGomme.tsx, src/next/components/NextHomeAutistiEventoModal.tsx, src/next/components/NextAutistiEventoModal.tsx, src/next/NextPdfPreviewModal.tsx

