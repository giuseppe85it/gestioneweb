# Audit Copertura Modali vs Registro v0.5

## Stato del documento
- Versione: 1.0
- Data: 2026-05-04
- Autore: Codex (audit), Giuseppe (lettura/decisione)
- Scopo: verificare che ogni modale o modulo del gestionale che salva dati Firestore
  o uploada file in Firebase Storage abbia copertura completa nel registro v0.5
  prima della costruzione del motore generico.
- Metodo: lettura statica del repo. Nessun runtime Firestore. Nessun runtime Storage.
- Privacy: riportati solo path, nomi collection, nomi campo e pattern Storage tecnici.

## Sintesi esecutiva
- Moduli/modalita' di scrittura staticamente individuati: 43
- Layer madre: 22
- Layer NEXT: 19
- Cloud functions / backend: 2
- Collection Firestore target distinte: 42
- Path Storage distinti: 15
- Collection COPERTE OK: 8
- Collection COPERTE PARZIALI: 25
- Collection COPERTE SOLO STRUTTURA: 0
- Collection NON COPERTE: 9
- Storage COPERTO: 5
- Storage PARZIALE: 6
- Storage NON REFERENZIATO: 2
- Storage NON DOCUMENTATO: 4

Esito sintetico: il registro v0.5 copre la maggior parte dei dataset `storage/@*` e `euromecc_*`, ma prima del motore generico vanno chiusi tre blocchi:

1. Le collection documentali reali sono root collection `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, mentre registro/boundary v0.5 le descrivono come documenti `storage/@documenti_*`.
2. Le aree Cisterna (`@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`) e `chat_ia_reports` sono scritte dal codice ma non sono nel registro.
3. Molti upload Storage salvano solo URL firmati o path esclusi dagli `allowedFields` (`fotoStoragePath`, `fileUrl`, `pdfUrl`, `imageUrls`, `downloadUrl`): la chat IA non puo' ricostruire provenance solo da metadati Firestore leggibili.

## Matrice modale -> collection target

| Modale / modulo (path file) | Layer | Collection target | Operazione | Stato copertura | Campi non in allowedFields |
|---|---|---|---|---|---|
| `src/pages/Mezzi.tsx:681-808` | madre | `storage/@mezzi_aziendali` | upload foto mezzo + set array | COPERTA PARZIALE | `tipo`, `colore`, `proprietario`, `assicurazione`, `manutenzione*`, `note`, `fotoUrl`, `fotoPath` |
| `src/pages/IA/IALibretto.tsx:435-473` | madre | `storage/@mezzi_aziendali` | upload libretto + set array | COPERTA PARZIALE | diversi campi libretto estratti non tutti esposti; `librettoStoragePath` e' coperto |
| `src/next/NextIALibrettoPage.tsx:423-465` | NEXT | `storage/@mezzi_aziendali` | upload libretto + set array | COPERTA PARZIALE | come sopra; `librettoStoragePath` coperto |
| `src/pages/IA/IACoperturaLibretti.tsx:510-526` | madre | `storage/@mezzi_aziendali` | upload libretto + set array | COPERTA PARZIALE | come sopra |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2810-2895` | NEXT | `storage/@mezzi_aziendali` | upload foto mezzo/libretto + set array | COPERTA PARZIALE | `fotoUrl`, `fotoPath`, campi archivista non esposti |
| `src/next/nextScadenzeCollaudiWriter.ts:67` | NEXT | `storage/@mezzi_aziendali` | set array | COPERTA PARZIALE | `prenotazioneCollaudo`, `preCollaudo`, `noteEsito`, campi revisione annidati |
| `src/pages/Home.tsx:957,2294-2317` | madre | `storage/@alerts_state` | set stato alert | COPERTA OK | nessuno rilevante |
| `src/pages/Home.tsx:1096-1103` | madre | `storage/@storico_eventi_operativi` | set evento operativo | COPERTA PARZIALE | `luogo`, `source`; esclusioni libere coerenti ma impediscono lettura completa |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx:1052-1209` | NEXT | `storage/@autisti_sessione_attive` | set sessioni | COPERTA OK | nessuno strutturato rilevante |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx:1439-1462` | NEXT | `storage/@storico_eventi_operativi` | set eventi | COPERTA PARZIALE | campi liberi/di luogo esclusi by design |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx:1500-1601` | NEXT | `storage/@segnalazioni_autisti_tmp` | set segnalazioni | COPERTA PARZIALE | `testo`, `foto*`, note libere escluse by design |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx:1525` | NEXT | `storage/@richieste_attrezzature_autisti_tmp` | set richieste | COPERTA PARZIALE | `testo`, `foto*` esclusi by design |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx:1691` | NEXT | `storage/@controlli_mezzo_autisti` | set controlli | COPERTA PARZIALE | `note` escluse by design |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx:1710-1727` | NEXT | `storage/@cambi_gomme_autisti_tmp`, `storage/@gomme_eventi` | set TMP + ufficializzazione | COPERTA OK | nessuno strutturato rilevante |
| `src/next/autistiInbox/NextAutistiAdminNative.tsx:1847-2206` | NEXT | `storage/@rifornimenti_autisti_tmp`, `storage/@rifornimenti` | set TMP + dossier | COPERTA OK | `distributore/costo` solo su dossier ufficiale, coperti in `@rifornimenti` |
| `src/pages/Colleghi.tsx:102-103` | madre | `storage/@colleghi` | set array | COPERTA PARZIALE | `telefono`, `telefonoPrivato`, `pinSim`, `pukSim`, `schedeCarburante`, `descrizione` esclusi by design |
| `src/pages/Fornitori.tsx:72-73` | madre | `storage/@fornitori` | set array | COPERTA PARZIALE | `telefono`, `descrizione` esclusi by design |
| `src/next/nextAnagraficheWriter.ts:112-231` | NEXT | `storage/@colleghi`, `storage/@fornitori`, `storage/@officine` | set array | COPERTA PARZIALE | contatti, SIM, descrizioni e telefoni officine esclusi by design |
| `src/pages/Inventario.tsx:101-112` | madre | `storage/@inventario` | set array + upload foto | COPERTA PARZIALE | `fotoUrl`, `fotoStoragePath`, descrizioni libere |
| `src/next/NextMagazzinoPage.tsx:803-815` | NEXT | `storage/@inventario`, `storage/@materialiconsegnati`, `storage/@cisterne_adblue` | set array + upload foto | COPERTA PARZIALE | `fotoUrl`, `fotoStoragePath` non leggibili dalla IA |
| `src/pages/MaterialiConsegnati.tsx:195-200` | madre | `storage/@inventario`, `storage/@materialiconsegnati` | set array | COPERTA OK | nessuno strutturato rilevante |
| `src/pages/Manutenzioni.tsx:224-517` | madre | `storage/@manutenzioni`, `storage/@inventario`, `storage/@materialiconsegnati` | set array | COPERTA PARZIALE | descrizioni/note libere escluse; campi relazionali coperti |
| `src/next/domain/nextManutenzioniDomain.ts:978-1092` | NEXT | `storage/@manutenzioni`, `storage/@inventario`, `storage/@materialiconsegnati` | set array | COPERTA PARZIALE | come sopra |
| `src/pages/LavoriDaEseguire.tsx:98`, `src/pages/DettaglioLavoro.tsx:46-88` | madre | `storage/@lavori` | set array | COPERTA PARZIALE | `descrizione/dettaglio/note` esclusi |
| `src/next/NextLavoriDaEseguirePage.tsx:524`, `src/next/NextDettaglioLavoroPage.tsx:841-894` | NEXT | `storage/@lavori` | set array | COPERTA PARZIALE | come sopra |
| `src/pages/AttrezzatureCantieri.tsx:454-596` | madre | `storage/@attrezzature_cantieri` | set array | COPERTA PARZIALE | `descrizione`, `note`, eventuali foto non leggibili |
| `src/next/nextAttrezzatureCantieriWriter.ts:238-357` | NEXT | `storage/@attrezzature_cantieri` | set array + upload/delete foto | COPERTA PARZIALE | `descrizione`, `note`, `fotoUrl`, `fotoStoragePath` |
| `src/pages/MaterialiDaOrdinare.tsx:186-202` | madre | `storage/@ordini` | set array | COPERTA OK | nessuno strutturato rilevante |
| `src/next/NextMaterialiDaOrdinarePage.tsx:991-1164` | NEXT | `storage/@ordini` | upload/delete foto materiale + set array | COPERTA PARZIALE | `fotoUrl`, `fotoStoragePath`, `note` nei materiali |
| `src/pages/Acquisti.tsx:1351-4036` | madre | `storage/@ordini`, `storage/@preventivi`, `storage/@listino_prezzi` | set array + upload/delete preventivi/materiali | COPERTA PARZIALE | `pdfUrl`, `imageUrls`, `fotoUrl`, `fotoStoragePath`, `note`, descrizioni libere |
| `src/next/NextProcurementReadOnlyPanel.tsx:258-705` | NEXT | `storage/@ordini` | set array + upload/delete foto materiale | COPERTA PARZIALE | `photoUrl`, `photoStoragePath`, `note` |
| `src/next/nextPreventivoManualeWriter.ts:209-408` | NEXT | `storage/@preventivi`, `storage/@listino_prezzi` | upload preventivo + set documenti | COPERTA PARZIALE | `pdfUrl`, `imageUrls`, `note`; storage path coperti |
| `src/pages/DettaglioOrdine.tsx:215-265` | madre | `storage/@inventario`, `storage/@ordini` | set array | COPERTA PARZIALE | campi materiali annidati non tutti dichiarati come allowedFields puntuali |
| `src/pages/CapoCostiMezzo.tsx:647` | madre | `storage/@preventivi_approvazioni` | set array | COPERTA OK | nessuno rilevante |
| `src/pages/DossierMezzo.tsx:739-748` | madre | `@documenti_*`, `storage/@costiMezzo` | delete documento / update costi | NON COPERTA per `@documenti_*` | registry/boundary usano `storage/@documenti_*`, ma codice usa root collection |
| `src/next/domain/nextDocumentiCostiDomain.ts:2437-2586` | NEXT | `@documenti_*`, `storage/@costiMezzo` | delete/update documenti e costi | NON COPERTA per `@documenti_*` | mismatch root collection vs registro |
| `src/pages/IA/IADocumenti.tsx:503-537` | madre | `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` | upload documento + addDoc | NON COPERTA | root collection; salva `fileUrl` ma non `fileStoragePath` nel payload legacy |
| `src/next/internal-ai/ArchivistaArchiveClient.ts:438-644` | NEXT | `@documenti_mezzi`, `@documenti_magazzino`, `storage/@preventivi` | upload documento + add/update | NON COPERTA per root `@documenti_*` | root collection non nel boundary; per preventivi path coperto ma URL esclusi |
| `src/pages/AnalisiEconomica.tsx:778-779` | madre | `@analisi_economica_mezzi/{targa}` | set analisi IA | NON COPERTA | registro/boundary hanno `storage/@analisi_economica_mezzi`, non root collection; campi narrativi esclusi |
| `src/pages/IA/IAApiKey.tsx:65-66` | madre | `@impostazioni_app/gemini` | set API key | NON COPERTA by design | campo `apiKey` sensibile; non deve entrare nel motore generico |
| `src/pages/CisternaCaravate/CisternaCaravatePage.tsx:949-1101` | madre | `@documenti_cisterna`, `@cisterna_parametri_mensili` | update documento / set parametri mese | NON COPERTA | collection assenti dal registro v0.5 |
| `src/pages/CisternaCaravate/CisternaCaravateIA.tsx:257-356` | madre | `@documenti_cisterna` | upload documento + addDoc | NON COPERTA | collection assente; path Storage non nel boundary |
| `src/pages/CisternaCaravate/CisternaSchedeTest.tsx:1865-1885` | madre | `@cisterna_schede_ia` | add/update scheda | NON COPERTA | collection assente; salva `fileUrl` ma non storage path tecnico per crop |
| `src/next/nextCisternaWriter.ts:15-96` | NEXT | `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili` | add/update/set + upload | NON COPERTA | collection assenti dal registro v0.5 |
| `src/next/NextEuromeccPage.tsx:2980-3181` | NEXT | `euromecc_relazioni`, `euromecc_extra_components`, `storage/@ordini` | addDoc + storage upload + ordine ricambi | COPERTA PARZIALE | `note`, `tecnici`, `fileUrl`, campi extra component `name/code/addedBy` non coperti |
| `src/next/domain/nextEuromeccDomain.ts:460-628` | NEXT | `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta` | add/update/delete/set | COPERTA PARZIALE | `note`, `by`, `reportedBy` esclusi; campi core coperti |
| `src/next/domain/nextMappaStoricoDomain.ts:451-514` | NEXT | `storage/@mezzi_foto_viste`, `storage/@mezzi_hotspot_mapping` | upload foto + set mapping | COPERTA PARZIALE | `downloadUrl`, `fileName`, `contentType`, `uploadedAt`, `areaId`, `x`, `y` non tutti in allowedFields |
| `src/next/chat-ia/reports/chatIaReportArchive.ts:56-119` | NEXT | `chat_ia_reports` | upload report + set/update archive | NON COPERTA | collection e storage prefix assenti da registro/boundary |

## Matrice Storage -> Firestore reference

| Modulo | Path Storage | Operazione | Campo Firestore che lo referenzia | Collection registro | Stato copertura |
|---|---|---|---|---|---|
| `src/next/NextIALibrettoPage.tsx`, `src/pages/IA/IALibretto.tsx`, `src/pages/IA/IACoperturaLibretti.tsx` | `mezzi_aziendali/{mezzoId}/libretto.jpg` | uploadString/uploadBytes/getDownloadURL | `librettoStoragePath`, `librettoUrl` | `storage/@mezzi_aziendali` | STORAGE COPERTO per path; URL firmato escluso by design |
| `src/pages/Mezzi.tsx`, `ArchivistaDocumentoMezzoBridge.tsx` | `mezzi/{targa}_{timestamp}.jpg` | uploadString/getDownloadURL | `fotoPath`/`fotoUrl` | `storage/@mezzi_aziendali` | STORAGE PARZIALE: `fotoPath` non in allowedFields |
| `src/pages/Inventario.tsx`, `src/next/NextMagazzinoPage.tsx` | `inventario/{itemId}/foto.ext` | uploadBytes/getDownloadURL | `fotoStoragePath`, `fotoUrl` | `storage/@inventario` | STORAGE PARZIALE: campi foto esclusi |
| `src/pages/Acquisti.tsx`, `NextMaterialiDaOrdinarePage.tsx`, `NextProcurementReadOnlyPanel.tsx` | `materiali/{id}-{timestamp}.ext` | upload/delete/getDownloadURL | `fotoStoragePath`/`photoStoragePath` annidati in materiali ordine | `storage/@ordini` | STORAGE PARZIALE: path annidato non documentato puntualmente |
| `src/pages/Acquisti.tsx`, `nextPreventivoManualeWriter.ts` | `preventivi/{id}.pdf` | upload/delete/getDownloadURL | `pdfStoragePath`, `pdfUrl` | `storage/@preventivi` | STORAGE COPERTO per path; `pdfUrl` escluso |
| `src/pages/Acquisti.tsx` | `preventivi/ia/{id}.pdf` e `preventivi/ia/{id}_{n}.ext` | upload/listAll/delete/getDownloadURL | `pdfStoragePath`, `imageStoragePaths` se il preventivo viene salvato | `storage/@preventivi` | STORAGE PARZIALE: upload temporaneo puo' restare senza record se l'utente non salva |
| `src/next/nextPreventivoManualeWriter.ts` | `preventivi/manuali/{id}.*` | upload/getDownloadURL | `pdfStoragePath`, `imageStoragePaths` | `storage/@preventivi` | STORAGE COPERTO per path |
| `src/next/nextAttrezzatureCantieriWriter.ts` | `attrezzature/{movimentoId}-{timestamp}.ext` | upload/delete/getDownloadURL | `fotoStoragePath`, `fotoUrl` | `storage/@attrezzature_cantieri` | STORAGE PARZIALE: campi foto esclusi |
| `src/next/domain/nextMappaStoricoDomain.ts` | `mezzi_foto/{targa}/{vista}_{timestamp}.ext` | upload/getDownloadURL | `storagePath`, `downloadUrl` | `storage/@mezzi_foto_viste` | STORAGE PARZIALE: path coperto, `downloadUrl/fileName/contentType/uploadedAt` esclusi |
| `src/pages/IA/IADocumenti.tsx` | `documenti_pdf/{timestamp}_{nomeFile}` | upload/getDownloadURL | solo `fileUrl` nel payload legacy | root `@documenti_*` | STORAGE NON REFERENZIATO per path tecnico; URL firmato non basta |
| `src/next/internal-ai/ArchivistaArchiveClient.ts` | `documenti_pdf/...` o `preventivi/...` | upload/getDownloadURL | `fileStoragePath`, `fileUrl` | root `@documenti_mezzi` / `@documenti_magazzino` | STORAGE NON DOCUMENTATO per mismatch root collection vs registro |
| `src/pages/CisternaCaravate/CisternaCaravateIA.tsx` | `documenti_pdf/cisterna/{yyyy}/{mm}/{timestamp}_{nomeFile}` | upload/getDownloadURL | `storagePath`, `fileUrl` | nessuna voce registro | STORAGE NON DOCUMENTATO |
| `src/pages/CisternaCaravate/CisternaSchedeTest.tsx` | `documenti_pdf/cisterna_schede/{yyyy}/{mm}/{timestamp}_crop.jpg` | upload/getDownloadURL | `fileUrl`; path tecnico non salvato nel record visibile staticamente | nessuna voce registro | STORAGE NON REFERENZIATO |
| `src/next/NextEuromeccPage.tsx` | `euromecc/relazioni/{id}/{timestamp}_{fileName}` | upload/getDownloadURL | `fileStoragePath`, `fileUrl` | `euromecc_relazioni` | STORAGE COPERTO per path; `fileUrl` escluso |
| `src/next/chat-ia/reports/chatIaReportArchive.ts` | `chat_ia_reports/{sector}/{year}/{id}.pdf` | upload/getDownloadURL | `pdfStoragePath`, `pdfUrl` | nessuna voce registro | STORAGE NON DOCUMENTATO |
| `functions/index.js:771-788` (`stamp_pdf`) | `stamped/{timestamp}_{status}.pdf` | backend save Storage | ritorna `stampedUrl`, `stampedPath`; nessuna scrittura Firestore trovata | nessuna voce registro | STORAGE NON REFERENZIATO |
| `src/next/domain/nextUnifiedReadRegistryDomain.ts:207-242` | prefisso dinamico `args.prefix` | listAll | nessuna referenza Firestore; input runtime | non applicabile | STORAGE PARZIALE: verifica statica non determina prefissi consentiti |

## Aggregato per collection

### `storage/@mezzi_aziendali`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `Mezzi`, `IALibretto`, `NextIALibretto`, `IACoperturaLibretti`, `ArchivistaDocumentoMezzoBridge`, `nextScadenzeCollaudiWriter`.
- Campi scritti totali: anagrafica mezzo, dati libretto, foto mezzo, revisione/collaudo, manutenzione programmata.
- Campi in allowedFields: `id`, `targa`, `categoria`, `marca`, `modello`, `autistaId`, `autistaNome`, `librettoUrl`, `librettoStoragePath`, `dataImmatricolazione`, `dataScadenzaRevisione`, `dataUltimoCollaudo`, `telaio`, `massaComplessiva`.
- Campi NON in allowedFields: `tipo`, `colore`, `proprietario`, `assicurazione`, `manutenzioneProgrammata`, `manutenzioneDataInizio`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto`, `prenotazioneCollaudo`, `preCollaudo`, `note`, `fotoUrl`, `fotoPath`.
- Valutazione: alcuni esclusi sono liberi/sensibili, altri sono operativi (collaudo, foto path) e vanno decisi.
- Alias concetto mappati v0.5: si.
- Eventuali file Storage referenziati: `mezzi_aziendali/*/libretto.jpg` coperto; `mezzi/*.jpg` parziale.

### `storage/@colleghi`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `Colleghi`, `nextAnagraficheWriter`.
- Campi scritti totali: `id`, `nome`, `telefono`, `telefonoPrivato`, `badge`, `codice`, `descrizione`, `pinSim`, `pukSim`, `schedeCarburante`.
- Campi in allowedFields: `id`, `nome`, `nomeCompleto`, `label`, `badge`, `codice`.
- Campi NON in allowedFields: contatti, SIM, schede carburante, descrizione.
- Valutazione: esclusione corretta per privacy/sicurezza; non blocca il motore generico se non deve leggere contatti.
- Alias concetto mappati v0.5: si.

### `storage/@fornitori`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `Fornitori`, `nextAnagraficheWriter`.
- Campi scritti totali: `id`, `nome`, `telefono`, `badge`, `codice`, `descrizione`.
- Campi in allowedFields: `id`, `nome`, `ragioneSociale`, `fornitore`, `label`, `badge`, `codice`.
- Campi NON in allowedFields: `telefono`, `descrizione`.
- Valutazione: esclusione corretta per contatti/testo libero; nessuna chiave forte aggiuntiva rilevata staticamente.
- Alias concetto mappati v0.5: si.

### `storage/@officine`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `nextAnagraficheWriter`.
- Campi scritti totali: `id`, `nome`, `telefono`, `telefoniAggiuntivi`, `citta`.
- Campi in allowedFields: `id`, `nome`, `ragioneSociale`, `officina`, `label`, `citta`.
- Campi NON in allowedFields: `telefono`, `telefoniAggiuntivi`.
- Valutazione: esclusione corretta per contatti.
- Alias concetto mappati v0.5: si.

### `storage/@alerts_state`
- Stato registro: COPERTA OK
- Modali che scrivono qui: `Home`.
- Campi scritti totali: `value/items`, `ackAt`, `snoozeUntil`, `lastShownAt`, `meta`, `type`, `ref`.
- Campi in allowedFields: coperti.
- Campi NON in allowedFields: nessuno rilevante.
- Alias concetto mappati v0.5: non critico.

### `storage/@autisti_sessione_attive`
- Stato registro: COPERTA OK
- Modali che scrivono qui: `NextAutistiAdminNative`.
- Campi scritti totali: sessione autista, badge/id, targhe motrice/rimorchio, timestamp/stato.
- Campi in allowedFields: coperti per relationProof Driver360.
- Campi NON in allowedFields: eventuali note libere escluse.
- Alias concetto mappati v0.5: si.

### `storage/@storico_eventi_operativi`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `Home`, `NextAutistiAdminNative`.
- Campi scritti totali: `tipo`, `timestamp`, `badgeAutista`, `autistaNome`, `prima`, `dopo`, targhe, `luogo`, `source`.
- Campi in allowedFields: eventi e assetto post-evento coperti.
- Campi NON in allowedFields: `luogo`, `source`, eventuali descrizioni.
- Valutazione: per relationProof assetto bastano `dopo/targhe`; per UI operativa luogo/source sono lacuna opzionale.
- Alias concetto mappati v0.5: si.

### TMP autisti (`storage/@segnalazioni_autisti_tmp`, `@richieste_attrezzature_autisti_tmp`, `@controlli_mezzo_autisti`, `@cambi_gomme_autisti_tmp`, `@rifornimenti_autisti_tmp`)
- Stato registro: COPERTA PARZIALE / OK a seconda del dataset.
- Modali che scrivono qui: `NextAutistiAdminNative`, pagine Cisterna per letture da rifornimenti.
- Campi in allowedFields: campi strutturati di autista, badge, targa, data, stato, quantita/km/litri, target.
- Campi NON in allowedFields: `note`, `testo`, `descrizione`, foto/url.
- Valutazione: conforme alla regola R10; campi liberi non devono certificare relazioni.
- Alias concetto mappati v0.5: si.

### `storage/@rifornimenti`
- Stato registro: COPERTA OK
- Modali che scrivono qui: `NextAutistiAdminNative`.
- Campi scritti totali: `id`, `targa/mezzoTarga/targaMotrice`, `autistaId`, `badgeAutista`, `data/timestamp`, `litri`, `km`, `costo`, `distributore`.
- Campi in allowedFields: coperti.
- Campi NON in allowedFields: nessuno strutturato rilevante.
- Alias concetto mappati v0.5: si.

### `storage/@inventario`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `Inventario`, `MaterialiConsegnati`, `Manutenzioni`, `Acquisti`, `NextMagazzino`, `nextManutenzioniDomain`.
- Campi in allowedFields: chiavi materiale, quantita, unita, fornitore, stock.
- Campi NON in allowedFields: `fotoUrl`, `fotoStoragePath`, `descrizione/note`.
- Valutazione: foto inventario non leggibili dalla chat; decidere se documentare path foto come metadato.
- Alias concetto mappati v0.5: si.

### `storage/@materialiconsegnati`
- Stato registro: COPERTA OK
- Modali che scrivono qui: `MaterialiConsegnati`, `Manutenzioni`, `NextMagazzino`, `nextManutenzioniDomain`.
- Campi scritti totali: materiale, quantita, destinatario/mezzo/cantiere, origine, stockKey.
- Campi in allowedFields: coperti.
- Campi NON in allowedFields: eventuali note libere.
- Alias concetto mappati v0.5: si.

### `storage/@cisterne_adblue`
- Stato registro: COPERTA OK
- Modali che scrivono qui: `NextMagazzino`.
- Campi scritti totali: cisterna, litri/quantita, materiale, stockKey, data/timestamp.
- Campi in allowedFields: coperti.
- Campi NON in allowedFields: nessuno strutturato rilevante.
- Alias concetto mappati v0.5: parziale ma sufficiente per materiale/cisterna.

### `storage/@manutenzioni`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `Manutenzioni`, `nextManutenzioniDomain`, `GommeEconomiaSection` legge solo.
- Campi in allowedFields: targa, data, tipo, lavorazioni, materiali, km, officina, importo.
- Campi NON in allowedFields: descrizioni, note, dettagli liberi.
- Alias concetto mappati v0.5: si.

### `storage/@lavori`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `LavoriDaEseguire`, `DettaglioLavoro`, `NextLavoriDaEseguirePage`, `NextDettaglioLavoroPage`.
- Campi in allowedFields: targa/cantiere/stato/date/tipo/lavorazione.
- Campi NON in allowedFields: descrizioni/dettagli/note.
- Alias concetto mappati v0.5: si.

### `storage/@ordini`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `MaterialiDaOrdinare`, `Acquisti`, `NextMaterialiDaOrdinarePage`, `NextProcurementReadOnlyPanel`, `NextEuromeccPage`, `DettaglioOrdine`.
- Campi in allowedFields: fornitore, date, stato, materiali/righe/items, arrivato.
- Campi NON in allowedFields: foto path annidati, note, alcuni campi sorgente listino.
- Alias concetto mappati v0.5: si.

### `storage/@preventivi`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `Acquisti`, `nextPreventivoManualeWriter`, `ArchivistaArchiveClient`.
- Campi in allowedFields: fornitore, numero/data, righe, importi, `pdfStoragePath`, `imageStoragePaths`.
- Campi NON in allowedFields: `pdfUrl`, `imageUrls`, note libere.
- Alias concetto mappati v0.5: si.
- Eventuali file Storage referenziati: `preventivi/*`, `preventivi/manuali/*`, `preventivi/ia/*`.

### `storage/@listino_prezzi`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `Acquisti`, `nextPreventivoManualeWriter`.
- Campi in allowedFields: articolo/codice/fornitore/prezzo/fonte.
- Campi NON in allowedFields: `note`, `pdfUrl`, `imageUrls` in fonti annidate.
- Alias concetto mappati v0.5: si.

### `storage/@attrezzature_cantieri`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `AttrezzatureCantieri`, `nextAttrezzatureCantieriWriter`.
- Campi in allowedFields: cantiere, tipo, data, materialeCategoria, quantita, source cantiere.
- Campi NON in allowedFields: `descrizione`, `note`, `fotoUrl`, `fotoStoragePath`.
- Alias concetto mappati v0.5: si per cantiere/materiale, parziale per foto.

### `storage/@costiMezzo`
- Stato registro: COPERTA OK
- Modali che scrivono qui: `DossierMezzo`, `nextDocumentiCostiDomain`.
- Campi in allowedFields: targa, tipo documento, data, importo, valuta, fornitore, source.
- Campi NON in allowedFields: eventuali descrizioni libere.
- Alias concetto mappati v0.5: si.

### `storage/@preventivi_approvazioni`
- Stato registro: COPERTA OK
- Modali che scrivono qui: `CapoCostiMezzo`.
- Campi in allowedFields: `id`, `approvalKey`, `targa`, `sourceKey`, `sourceDocId`, `status`, `updatedAt`, `timestamp`, `preventivoId`.
- Campi NON in allowedFields: nessuno rilevante.
- Alias concetto mappati v0.5: si.

### `storage/@mezzi_foto_viste`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `nextMappaStoricoDomain`.
- Campi in allowedFields: `id`, `targa`, `vista`, `storagePath`.
- Campi NON in allowedFields: `downloadUrl`, `fileName`, `contentType`, `uploadedAt`.
- Valutazione: path leggibile, ma metadati file non completi.
- Alias concetto mappati v0.5: si.

### `storage/@mezzi_hotspot_mapping`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `nextMappaStoricoDomain`.
- Campi in allowedFields: `id`, `targa`, `area`, `asse`, `posizione`.
- Campi NON in allowedFields: `areaId`, `x`, `y`, `vista`, `createdAt`.
- Valutazione: coordinate hotspot operative escluse; se il motore deve spiegare hotspot, vanno aggiunte.
- Alias concetto mappati v0.5: parziale.

### `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta`, `euromecc_extra_components`, `euromecc_relazioni`
- Stato registro: COPERTA PARZIALE
- Modali che scrivono qui: `nextEuromeccDomain`, `NextEuromeccPage`.
- Campi in allowedFields: chiavi area/sub, titoli, stati, date, fileStoragePath per relazioni.
- Campi NON in allowedFields: `note`, `by`, `reportedBy`, `tecnici`, `fileUrl`, `name`, `code`, `addedFrom`, `addedAt`, `addedBy`.
- Valutazione: esclusione note corretta; alcuni campi strutturati `extra_components` sembrano operativi e vanno valutati.
- Alias concetto mappati v0.5: si, sottografo Euromecc.

### `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`
- Stato registro: NON COPERTA
- Modali che scrivono qui: `IADocumenti`, `ArchivistaArchiveClient`, `DossierMezzo`, `nextDocumentiCostiDomain`.
- Campi scritti totali: tipo documento, targa/fornitore/materiale, date, importi, file metadata, `fileUrl`, `fileStoragePath`, `archivistaAnalysis`, `voci`, valuta.
- Campi in allowedFields: il registro espone allowedFields per `storage/@documenti_*`, non per queste root collection.
- Campi NON in allowedFields: tutti perche' il path reale non e' autorizzato.
- Alias concetto mappati v0.5: si come concetto documento, ma path collection errato.
- Raccomandazione: priorita' ALTA. Correggere registro/boundary su root collection o introdurre mapping esplicito.

### `@analisi_economica_mezzi`
- Stato registro: NON COPERTA
- Modali che scrivono qui: `AnalisiEconomica`.
- Campi scritti totali: `targa`, `updatedAt`, piu' campi narrativi analisi (`riepilogoBreve`, `analisiCosti`, `anomalie`, `fornitoriNotevoli`).
- Campi in allowedFields: il registro espone `storage/@analisi_economica_mezzi`, non root collection.
- Valutazione: path mismatch. Inoltre i campi narrativi sono deliberatamente esclusi dal boundary Zero-Invenzioni; decidere se il motore debba ignorare questa collection o leggerne solo metadati.

### `@impostazioni_app/gemini`
- Stato registro: NON COPERTA by design
- Modali/funzioni coinvolti: `IAApiKey`, funzioni IA che leggono config.
- Campi scritti totali: `apiKey`.
- Valutazione: segreto. Non deve entrare nel registro operativo ne' nel boundary IA.

### `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`
- Stato registro: NON COPERTA
- Modali che scrivono qui: `CisternaCaravatePage`, `CisternaCaravateIA`, `CisternaSchedeTest`, `nextCisternaWriter`.
- Campi scritti totali: documento cisterna, parametri cambio mensile, righe schede IA, `fileUrl`, `storagePath`, litri, valuta, stato revisione.
- Campi in allowedFields: nessuno, collection assenti dal registro.
- Alias concetto mappati v0.5: no specifico per cisterna/scheda.
- Raccomandazione: priorita' ALTA se Cisterna entra nel motore generico.

### `chat_ia_reports`
- Stato registro: NON COPERTA
- Modali che scrivono qui: `chatIaReportArchive`.
- Campi scritti totali: `version`, `status`, `sector`, `reportType`, target, period, `pdfStoragePath`, `pdfUrl`, `reportPayload`, `metadata`.
- Campi in allowedFields: nessuno, collection assente.
- Valutazione: non e' dato gestionale primario, ma e' archivio chat IA. Va deciso se resta fuori dal motore generico o entra come collection separata.

## Aggregato per area Storage

### `mezzi_aziendali/{mezzoId}/libretto.jpg`
- Stato: COPERTO
- Modale che ci scrive: IA Libretto madre/NEXT, copertura libretti.
- Collection Firestore di referenza: `storage/@mezzi_aziendali`.
- Campo Firestore che salva il path: `librettoStoragePath`.
- Campo presente in allowedFields del boundary: si.
- Documentato nel registro: si.

### `mezzi/{targa}_{timestamp}.jpg`
- Stato: PARZIALE
- Modale che ci scrive: anagrafica mezzi, Archivista documento mezzo.
- Collection Firestore di referenza: `storage/@mezzi_aziendali`.
- Campo Firestore che salva il path: `fotoPath` o equivalente.
- Campo presente in allowedFields del boundary: no.
- Documentato nel registro: no come area foto mezzo anagrafica.

### `inventario/{itemId}/foto.ext`
- Stato: PARZIALE
- Modale che ci scrive: inventario/magazzino.
- Collection Firestore di referenza: `storage/@inventario`.
- Campo Firestore che salva il path: `fotoStoragePath`.
- Campo presente in allowedFields del boundary: no.
- Documentato nel registro: no come path Storage operativo.

### `materiali/{id}-{timestamp}.ext`
- Stato: PARZIALE
- Modale che ci scrive: materiali da ordinare / procurement.
- Collection Firestore di referenza: `storage/@ordini`, materiali annidati.
- Campo Firestore che salva il path: `fotoStoragePath` / `photoStoragePath`.
- Campo presente in allowedFields del boundary: non come campo puntuale; `materiali` e' ammesso come top-level.
- Documentato nel registro: parziale.

### `preventivi/*`, `preventivi/manuali/*`, `preventivi/ia/*`
- Stato: COPERTO/PARZIALE
- Modale che ci scrive: Acquisti, Next preventivo manuale.
- Collection Firestore di referenza: `storage/@preventivi`, `storage/@listino_prezzi` come fonte.
- Campo Firestore che salva il path: `pdfStoragePath`, `imageStoragePaths`, `fonteAttuale.pdfStoragePath`.
- Campo presente in allowedFields del boundary: si per `@preventivi`; parziale per fonti annidate `@listino_prezzi`.
- Documentato nel registro: si per preventivi, parziale per temporanei `preventivi/ia`.

### `attrezzature/{movimentoId}-{timestamp}.ext`
- Stato: PARZIALE
- Modale che ci scrive: Attrezzature Cantieri NEXT.
- Collection Firestore di referenza: `storage/@attrezzature_cantieri`.
- Campo Firestore che salva il path: `fotoStoragePath`.
- Campo presente in allowedFields del boundary: no.
- Documentato nel registro: no come metadato leggibile IA.

### `mezzi_foto/{targa}/{vista}_{timestamp}.ext`
- Stato: PARZIALE
- Modale che ci scrive: Mappa storico mezzo.
- Collection Firestore di referenza: `storage/@mezzi_foto_viste`.
- Campo Firestore che salva il path: `storagePath`.
- Campo presente in allowedFields del boundary: si.
- Documentato nel registro: si, ma metadati file esclusi.

### `documenti_pdf/*`
- Stato: NON DOCUMENTATO / PARZIALE
- Modale che ci scrive: IADocumenti legacy, Archivista NEXT.
- Collection Firestore di referenza: root `@documenti_*`.
- Campo Firestore che salva il path: legacy `IADocumenti` salva solo `fileUrl`; Archivista salva `fileStoragePath`.
- Campo presente in allowedFields del boundary: no per root collection.
- Documentato nel registro: solo come `storage/@documenti_*`, path errato rispetto al codice.

### `documenti_pdf/cisterna/*`
- Stato: NON DOCUMENTATO
- Modale che ci scrive: Cisterna IA.
- Collection Firestore di referenza: `@documenti_cisterna`.
- Campo Firestore che salva il path: `storagePath`.
- Campo presente in allowedFields del boundary: no.
- Documentato nel registro: no.

### `documenti_pdf/cisterna_schede/*`
- Stato: NON REFERENZIATO
- Modale che ci scrive: Cisterna Schede Test.
- Collection Firestore di referenza: `@cisterna_schede_ia`.
- Campo Firestore che salva il path: verifica statica non trova path tecnico persistito; solo `fileUrl` passa nel payload.
- Campo presente in allowedFields del boundary: no.
- Documentato nel registro: no.

### `euromecc/relazioni/*`
- Stato: COPERTO
- Modale che ci scrive: Euromecc.
- Collection Firestore di referenza: `euromecc_relazioni`.
- Campo Firestore che salva il path: `fileStoragePath`.
- Campo presente in allowedFields del boundary: si.
- Documentato nel registro: si.

### `chat_ia_reports/*`
- Stato: NON DOCUMENTATO
- Modale che ci scrive: archivio report Chat IA.
- Collection Firestore di referenza: `chat_ia_reports`.
- Campo Firestore che salva il path: `pdfStoragePath`.
- Campo presente in allowedFields del boundary: no.
- Documentato nel registro: no.

### `stamped/*`
- Stato: NON REFERENZIATO
- Modulo che ci scrive: Cloud Function `stamp_pdf`.
- Collection Firestore di referenza: nessuna scrittura Firestore trovata.
- Campo Firestore che salva il path: nessuno; la funzione ritorna `stampedUrl`/`stampedPath`.
- Campo presente in allowedFields del boundary: no.
- Documentato nel registro: no.

### prefisso dinamico `args.prefix`
- Stato: PARZIALE
- Modulo coinvolto: `nextUnifiedReadRegistryDomain.readNextUnifiedStoragePrefix`.
- Operazione: `listAll` ricorsivo limitato.
- Referenza Firestore: non determinabile staticamente.
- Nota: verifica non eseguita per prefissi runtime non risolvibili staticamente; servono chiamanti o policy prefissi.

## Lacune da chiudere prima del motore generico

- Lacuna 1: root collection `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` non corrispondono alle entry `storage/@documenti_*` del registro.
  - Impatto: ALTA. Il motore generico non puo' leggere documenti reali, fatture, file archivista e provenance documento-mezzo/materiale.
- Lacuna 2: root collection `@analisi_economica_mezzi` scritta da `AnalisiEconomica`, ma registro/boundary puntano a `storage/@analisi_economica_mezzi`.
  - Impatto: MEDIA. La collection contiene campi narrativi da non usare come prova, ma il path va chiarito.
- Lacuna 3: collection Cisterna (`@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`) assenti dal registro.
  - Impatto: ALTA se Cisterna entra nelle viste certificate; MEDIA se resta fuori scope Fase motore generico.
- Lacuna 4: `chat_ia_reports` assente dal registro.
  - Impatto: MEDIA. Archivio report IA non e' dominio gestionale primario, ma scrive Firestore e Storage.
- Lacuna 5: upload foto inventario/materiali/attrezzature/mezzi salvano path non leggibili da IA.
  - Impatto: MEDIA. La chat non puo' dire che la foto esiste usando solo metadati Firestore ammessi.
- Lacuna 6: `documenti_pdf/cisterna_schede/*` e `stamped/*` risultano senza path Firestore leggibile.
  - Impatto: ALTA per provenance file; MEDIA per stampa PDF se resta funzione legacy.
- Lacuna 7: `@mezzi_foto_viste` e `@mezzi_hotspot_mapping` non espongono tutti i metadati operativi (`downloadUrl` escluso correttamente, ma `areaId/x/y/uploadedAt` possono servire al diagramma prove).
  - Impatto: MEDIA.

## Modali orfani (scrivono ma collection non in registro)

- `src/pages/IA/IADocumenti.tsx`: scrive in `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`.
- `src/next/internal-ai/ArchivistaArchiveClient.ts`: scrive in `@documenti_mezzi`, `@documenti_magazzino`.
- `src/pages/AnalisiEconomica.tsx`: scrive in `@analisi_economica_mezzi/{targa}`.
- `src/pages/IA/IAApiKey.tsx`: scrive in `@impostazioni_app/gemini` (segreto, esclusione corretta ma path da dichiarare come escluso).
- `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`: scrive in `@documenti_cisterna`.
- `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`: scrive in `@documenti_cisterna` e `@cisterna_parametri_mensili`.
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`: scrive in `@cisterna_schede_ia`.
- `src/next/nextCisternaWriter.ts`: scrive in `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`.
- `src/next/chat-ia/reports/chatIaReportArchive.ts`: scrive in `chat_ia_reports`.

## Modali con campi operativi esclusi

- `Mezzi` / `NextScadenzeCollaudi`: `prenotazioneCollaudo`, `preCollaudo`, `manutenzioneProgrammata`, `fotoPath`.
  - Raccomandazione: decidere se sono dati operativi leggibili o restano fuori dal motore.
- `Inventario` / `NextMagazzino`: `fotoStoragePath`.
  - Raccomandazione: se il pannello prove deve mostrare esistenza foto materiale, aggiungere path tecnico e lasciare fuori URL.
- `Attrezzature Cantieri`: `fotoStoragePath`, `descrizione`.
  - Raccomandazione: path tecnico si puo' valutare; descrizione resta libera e non prova.
- `Ordini`: foto path annidati nei materiali.
  - Raccomandazione: documentare alias annidati o normalizzare provenance ordine-materiale-file.
- `Listino`: `fonteAttuale.pdfStoragePath` e `fonteAttuale.imageStoragePaths` sono annidati.
  - Raccomandazione: esplicitare nel registro che `fonteAttuale` puo' contenere path tecnici, senza URL.
- `Mappa storico mezzo`: `areaId`, `x`, `y`, `uploadedAt`.
  - Raccomandazione: se il motore deve spiegare hotspot/foto viste, includere coordinate e timestamp.
- `Euromecc extra components`: `name`, `code`, `addedFrom`, `addedAt`, `addedBy`.
  - Raccomandazione: valutare come campi strutturati del sottografo Euromecc; note restano escluse.

## File Storage non documentati o non referenziati

- `documenti_pdf/*` legacy: `IADocumenti` salva `fileUrl` ma non path tecnico; root collection documenti non nel boundary.
- `documenti_pdf/cisterna/*`: salva `storagePath` in `@documenti_cisterna`, ma collection non e' nel registro.
- `documenti_pdf/cisterna_schede/*`: path tecnico non trovato nel payload persistito; solo `fileUrl`.
- `chat_ia_reports/*`: `pdfStoragePath` esiste ma collection assente dal registro.
- `stamped/*`: Cloud Function crea file timbrato e ritorna URL/path senza reference Firestore statica trovata.
- prefissi dinamici `listAll(args.prefix)`: verifica non eseguita per prefissi runtime non determinabili staticamente.

## Raccomandazioni operative (NON applicate in questo turno)

1. Priorita' ALTA: correggere registro/boundary per le root collection documentali reali `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` oppure dichiarare un mapping formale da root collection a voce registro.
2. Priorita' ALTA: aggiungere al registro le tre collection Cisterna se devono entrare nel motore generico; includere solo campi strutturati e path tecnici, non URL firmati.
3. Priorita' ALTA: aggiungere `chat_ia_reports` oppure dichiararlo esplicitamente escluso dal motore generico.
4. Priorita' MEDIA: decidere se `@analisi_economica_mezzi` va letto come metadato strutturato o resta escluso perche' contiene narrativa IA.
5. Priorita' MEDIA: documentare path Storage foto (`fotoStoragePath`, `photoStoragePath`, `storagePath`) senza aprire URL firmati.
6. Priorita' MEDIA: aggiungere alias annidati per `fonteAttuale.*`, materiali ordine e hotspot mappa se il motore deve leggere questi dettagli.
7. Priorita' BASSA: mantenere esclusi contatti, SIM, telefono, descrizioni, note e URL firmati. Sono esclusioni coerenti con Zero-Invenzioni.

## Domande aperte per Giuseppe

1. Le collection root `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` devono sostituire le entry `storage/@documenti_*` nel registro/boundary?
2. Le collection Cisterna devono entrare nel motore generico v1 o restare fuori scope?
3. `chat_ia_reports` e' dominio gestionale leggibile o archivio tecnico IA da escludere?
4. Le foto di inventario/materiali/attrezzature/mezzi devono essere visibili come semplice esistenza file nel pannello prove?
5. `@analisi_economica_mezzi` va esclusa per narrativa IA o letta solo per metadati `targa/updatedAt`?
6. I file `stamped/*` devono essere registrati in una collection Firestore o restano output temporanei legacy?
7. Il motore generico deve leggere coordinate hotspot (`x/y/areaId`) o sono solo UI editoriale?

## Limitazioni dell'audit

- Lettura solo statica: nessun runtime Firestore, nessun runtime Storage.
- Le shape annidate dentro array (`materiali`, `righe`, `fonteAttuale`, `items`) non sempre sono inferibili con certezza da `allowedFields` top-level.
- Alcuni wrapper (`setItemSync`, writer domain NEXT) riscrivono interi array: i campi effettivi dipendono anche dai record gia' presenti.
- I pattern Storage costruiti con prefissi runtime (`readNextUnifiedStoragePrefix`) non sono risolvibili staticamente senza i chiamanti.
- Non sono stati letti valori reali, quindi non e' possibile confermare se alcuni campi esclusi sono effettivamente popolati in produzione.
- Cloud Functions risultano prevalentemente reader/processor; `stamp_pdf` scrive Storage ma non una reference Firestore statica nel codice analizzato.
