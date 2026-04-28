# AUDIT PRE-SPEC RIAPRI REVIEW ARCHIVISTA - 2026-04-27

## 1. INVENTARIO BRIDGE ARCHIVISTA

### 1.1 File Archivista in `src/next/internal-ai/`

File runtime o helper con nome `Archivista`:

| File | Righe | Ruolo | Prova |
|---|---:|---|---|
| `src/next/internal-ai/ArchivistaArchiveClient.ts` | 719 | archive client / helper salvataggi, duplicati e aggiornamento mezzo | importa Firestore/Storage e writer a `src/next/internal-ai/ArchivistaArchiveClient.ts:1`-`src/next/internal-ai/ArchivistaArchiveClient.ts:12`; esporta family Archivista a `src/next/internal-ai/ArchivistaArchiveClient.ts:14`-`src/next/internal-ai/ArchivistaArchiveClient.ts:19` |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` | 3404 | bridge documento mezzo / libretto | importa `archiveArchivistaDocumentRecord` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:3`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:15`; esporta subtype documento mezzo a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:84`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:88` |
| `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx` | 653 | bridge fattura/DDT -> magazzino | importa `archiveArchivistaDocumentRecord` a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:1`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:11`; endpoint analisi a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:13`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:14` |
| `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` | 1710 | bridge fattura/DDT -> manutenzione | importa `archiveArchivistaDocumentRecord` a `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:1`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:15`; endpoint analisi a `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:17` |
| `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx` | 647 | bridge preventivo -> magazzino | importa `archiveArchivistaPreventivoRecord` a `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:1`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:13`; endpoint analisi a `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:15` |
| `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx` | 1126 | bridge preventivo -> manutenzione | importa `archiveArchivistaPreventivoRecord` a `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:1`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:14`; endpoint analisi a `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:16` |

File senza nome `Archivista` ma con import/export logica Archivista:

| File | Righe | Ruolo | Prova |
|---|---:|---|---|
| `src/next/internal-ai/NextEstrazioneLibretto.tsx` | 1182 | componente UI libretto usato dal bridge documento mezzo | importa tipi Archivista a `src/next/internal-ai/NextEstrazioneLibretto.tsx:1`-`src/next/internal-ai/NextEstrazioneLibretto.tsx:11` |

File backup con nome `Archivista` presenti nella directory, non `.ts`/`.tsx` runtime:

| File | Righe | Ruolo | Prova |
|---|---:|---|---|
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak.20260427` | 3154 | backup fuori runtime | prima riga a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak.20260427:1` |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak2.20260427` | 3247 | backup fuori runtime | prima riga a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak2.20260427:1` |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak3.20260427` | 3393 | backup fuori runtime | prima riga a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak3.20260427:1` |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak4.20260427` | 3399 | backup fuori runtime | prima riga a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak4.20260427:1` |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak5.20260427` | 3423 | backup fuori runtime | prima riga a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx.bak5.20260427:1` |

### 1.2 Bridge attesi

| Bridge atteso | Stato | Path |
|---|---|---|
| `ArchivistaDocumentoMezzoBridge` | ESISTE | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`; default export a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1683` |
| `ArchivistaMagazzinoBridge` | ESISTE | `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`; default export a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:90` |
| `ArchivistaPreventivoMagazzinoBridge` | ESISTE | `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`; default export a `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:82` |
| `ArchivistaManutenzioneBridge` | ESISTE | `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`; default export a `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:393` |
| `ArchivistaPreventivoManutenzioneBridge` | ESISTE | `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`; default export a `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:286` |

### 1.3 Tipo documento e destinazione Firestore/storage per bridge

| Bridge | Tipo documento gestito | Collection / dataset archivio | Prova |
|---|---|---|---|
| `ArchivistaDocumentoMezzoBridge` | documento mezzo, subtype `libretto`, `assicurazione`, `revisione`, `collaudo` | `@documenti_mezzi` | subtype a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:84`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:88`; `targetCollection: "@documenti_mezzi"` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2530`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2534` |
| `ArchivistaMagazzinoBridge` | fattura/DDT magazzino | `@documenti_magazzino` | family/target a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:273`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:277` |
| `ArchivistaPreventivoMagazzinoBridge` | preventivo magazzino | `storage/@preventivi` | duplicate target `@preventivi` a `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:225`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:228`; archive family a `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:260`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:275`; writer `doc(db, "storage", "@preventivi")` a `src/next/internal-ai/ArchivistaArchiveClient.ts:554` |
| `ArchivistaManutenzioneBridge` | fattura/DDT manutenzione | `@documenti_mezzi` | duplicate target `@documenti_mezzi` a `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:729`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:732`; `targetCollection: "@documenti_mezzi"` a `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:769`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:773` |
| `ArchivistaPreventivoManutenzioneBridge` | preventivo manutenzione | `storage/@preventivi` | duplicate target `@preventivi` a `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:579`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:582`; archive family a `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:620`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:647`; writer `doc(db, "storage", "@preventivi")` a `src/next/internal-ai/ArchivistaArchiveClient.ts:554` |

## 2. PATTERN DI SALVATAGGIO analysis ESISTENTE

### 2.1 Salvataggio di `analysis` o equivalente in Firestore

Nessun bridge Archivista esistente persiste nel record archivio un oggetto completo chiamato `analysis`, `extractedFields`, `extractedData`, `reviewAnalysis`, `archivistaAnalysis` o `librettoAnalysis`.

Prove per i bridge Archivista:

- `archiveArchivistaDocumentRecord` salva il payload costruito da `...args.basePayload` e poi `addDoc(collection(db, args.targetCollection), payload)`: `src/next/internal-ai/ArchivistaArchiveClient.ts:483`-`src/next/internal-ai/ArchivistaArchiveClient.ts:497`.
- `ArchivistaDocumentoMezzoBridge` passa `basePayload` con campi flat e array `campiMancanti`/`avvisi`, senza chiave `analysis`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2539`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2564`.
- `ArchivistaMagazzinoBridge` passa `basePayload` con campi flat e `voci: selectedRows`, senza chiave `analysis`: `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:282`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:298`.
- `ArchivistaManutenzioneBridge` passa `basePayload` con campi flat e `voci` selezionate, senza chiave `analysis`: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:778`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:800`.
- `archiveArchivistaPreventivoRecord` costruisce `nuovoPreventivo` con testata, `righe`, `avvisiArchivista`, `campiMancantiArchivista`, `metadatiMezzo`, senza chiave `analysis`: `src/next/internal-ai/ArchivistaArchiveClient.ts:561`-`src/next/internal-ai/ArchivistaArchiveClient.ts:588`.

Esistono comunque salvataggi/parsing strutturati parziali:

- `@documenti_magazzino`: `voci: selectedRows` a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:293`.
- `@documenti_mezzi` per manutenzione: `voci` mappate con `descrizione`, `categoria`, `quantita`, `unita`, `importo`, `codice`, `prezzoUnitario` a `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:791`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:799`.
- `storage/@preventivi`: `righe: sanitizePreventivoRows(args.righe)` a `src/next/internal-ai/ArchivistaArchiveClient.ts:572`.
- `storage/@preventivi`: `avvisiArchivista` e `campiMancantiArchivista` a `src/next/internal-ai/ArchivistaArchiveClient.ts:579`-`src/next/internal-ai/ArchivistaArchiveClient.ts:580`.

Fuori dal perimetro Archivista, esiste una shape `documentAnalysis` per allegati IA interna:

- type `InternalAiDocumentAnalysis` a `src/next/internal-ai/internalAiTypes.ts:679`-`src/next/internal-ai/internalAiTypes.ts:697`;
- campo `documentAnalysis` sull'allegato a `src/next/internal-ai/internalAiTypes.ts:726`;
- mapping client di `documentAnalysis` a `src/next/internal-ai/internalAiChatAttachmentsClient.ts:201`-`src/next/internal-ai/internalAiChatAttachmentsClient.ts:213`.

Queste righe non dimostrano un salvataggio Firestore Archivista.

### 2.2 Dati strutturati estratti gia presenti nei record archiviati

Si, ma in modo parziale e non come oggetto `analysis` completo.

- `@documenti_mezzi` ramo manutenzione contiene `voci` strutturate con campi riga: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:791`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:799`.
- `@documenti_magazzino` contiene `voci: selectedRows`: `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:293`.
- `storage/@preventivi` contiene `righe`, `avvisiArchivista`, `campiMancantiArchivista`, `metadatiMezzo`: `src/next/internal-ai/ArchivistaArchiveClient.ts:572`-`src/next/internal-ai/ArchivistaArchiveClient.ts:586`.
- `@documenti_mezzi` ramo documento mezzo/libretto contiene campi flat documento/mezzo e array `campiMancanti`/`avvisi`, non un oggetto strutturato review: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2539`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2564`.

### 2.3 Convenzione naming per analisi IA persistita

NON DETERMINATO.

Fatti dimostrati dal codice:

- Archivista usa `avvisi`/`campiMancanti` nei documenti `@documenti_*`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2561`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2562`, `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:296`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:297`.
- Archivista usa `avvisiArchivista`/`campiMancantiArchivista` nei preventivi `storage/@preventivi`: `src/next/internal-ai/ArchivistaArchiveClient.ts:579`-`src/next/internal-ai/ArchivistaArchiveClient.ts:580`.
- IA interna allegati usa `documentAnalysis`: `src/next/internal-ai/internalAiTypes.ts:726`.
- Analisi economica legge `savedAnalysis` da `@analisi_economica_mezzi`: `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts:133`-`src/next/internal-ai/internalAiEconomicAnalysisFacade.ts:136`.

Servirebbe una SPEC/contratto dati che dichiari la chiave canonica per la review Archivista persistita.

## 3. RECUPERABILITA DATI ESTRATTI SENZA RIANALISI

### 3.1 Libretto / documento mezzo

Persistito nel record documento `@documenti_mezzi`:

- `tipoDocumento`, `sottotipoDocumentoMezzo`, `fornitore`, `numeroDocumento`, `dataDocumento`, `targa`, `mezzoId`, `telaio`, `proprietario`, `assicurazione`, `marca`, `modello`, `dataImmatricolazione`, `dataScadenza`, `dataUltimoCollaudo`, `dataScadenzaRevisione`, `riassuntoBreve`, `testo`, `campiMancanti`, `avvisi`, `documentoMezzoAggiornamentoConfermato`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2539`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2564`.
- `archiveArchivistaDocumentRecord` aggiunge `fileUrl`, `fileStoragePath`, `fonte`, `famigliaArchivista`, `contestoArchivista`, `statoArchivio`, `createdAt` e metadati duplicato: `src/next/internal-ai/ArchivistaArchiveClient.ts:483`-`src/next/internal-ai/ArchivistaArchiveClient.ts:495`.

Persistito su `@mezzi_aziendali`:

- Nuovo mezzo: record costruito con campi core e campi libretto persistiti a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1488`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1540`, poi scritto con `setItemSync("@mezzi_aziendali", nextVehicles)` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2522`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2524`.
- Mezzo esistente: `applyArchivistaLibrettoVehicleUpdate` usa campi core + `ARCHIVISTA_LIBRETTO_PERSISTED_FIELD_KEYS` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1586`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1628`, applica i valori a `current[field.key]` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1649`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1651` e scrive `@mezzi_aziendali` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1669`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1671`.

Non persistito oggi come review completa:

- L'intera shape `ArchivistaDocumentoMezzoAnalysis` include campi non presenti nel `basePayload` documento, per esempio `categoria`, `genereVeicolo`, `tipoVeicolo`, `colore`, `carrozzeria`, pesi, `cilindrata`, `potenza`, `primaImmatricolazione`, `scadenzaRevisione`, `luogo*`, `numeroAvs`, `numeroMatricola`, `approvazioneTipo`, `annotazioni`, `note`, `localita`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:103`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:167`.
- Il preload di riapertura file azzera esplicitamente `analysis` con `setAnalysis(null)`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1837`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1841`.

I 17 campi del libretto svizzero:

- Le 17 chiavi sono dichiarate in `ARCHIVISTA_LIBRETTO_PERSISTED_FIELD_LABELS`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1151`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1169`.
- I valori vengono costruiti da `buildArchivistaPersistedLibrettoFields`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1177`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1217`.
- Per nuovo mezzo sono inclusi nel record a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1497`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1513`.
- Per mezzo esistente vengono inseriti nei candidati di update a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1622`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1628`.
- Il writer responsabile e `applyArchivistaLibrettoVehicleUpdate`, che scrive con `setItemSync("@mezzi_aziendali", next)`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1631`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1671`.

Verdetto: SI, i 17 campi sono persistiti su `@mezzi_aziendali` quando il flusso crea il mezzo o aggiorna il mezzo esistente; il record `@documenti_mezzi` non contiene l'intera review `analysis`.

### 3.2 Magazzino

Persistito in `@documenti_magazzino`:

- `tipoDocumento`, `fornitore`, `numeroDocumento`, `dataDocumento`, `imponibile`, `ivaPercentuale`, `ivaImporto`, `totaleDocumento`, `targa`, `testo`, `voci`, `valutaDocumento`, `riassuntoBreve`, `avvisi`, `campiMancanti`: `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:282`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:298`.
- `fileUrl`, `fileStoragePath` e metadati Archivista vengono aggiunti nel client archive: `src/next/internal-ai/ArchivistaArchiveClient.ts:483`-`src/next/internal-ai/ArchivistaArchiveClient.ts:497`.

Non persistito oggi:

- Nessuna chiave `analysis` completa: `basePayload` si chiude a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:298`.
- `voci` salva `selectedRows`, non necessariamente tutte le righe se l'utente deseleziona righe: `selectedRows` e definito a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:132`; default all rows dopo analisi a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:166`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:170`; salvataggio a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:293`.

### 3.3 Preventivo magazzino

Persistito in `storage/@preventivi`:

- Dal bridge: `fornitore`, `numeroPreventivo`, `dataPreventivo`, `totaleDocumento`, `riassuntoBreve`, `righe`, `avvisi`, `campiMancanti`, `ambitoPreventivo: "magazzino"`: `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:260`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:275`.
- Nel writer: `id`, `fornitoreId`, `fornitoreNome`, `numeroPreventivo`, `dataPreventivo`, `totaleDocumento`, `pdfUrl`/`imageUrls`, `righe`, `createdAt`, `updatedAt`, `famigliaArchivista`, `ambitoPreventivo`, `statoArchivio`, `riassuntoBreve`, `avvisiArchivista`, `campiMancantiArchivista`, duplicati: `src/next/internal-ai/ArchivistaArchiveClient.ts:561`-`src/next/internal-ai/ArchivistaArchiveClient.ts:588`.
- Scrittura su `storage/@preventivi`: `src/next/internal-ai/ArchivistaArchiveClient.ts:554` e `src/next/internal-ai/ArchivistaArchiveClient.ts:590`-`src/next/internal-ai/ArchivistaArchiveClient.ts:591`.

Non persistito oggi:

- `ArchivistaPreventivoAnalysis` include `stato`, `tipoDocumento` e `testo`: `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:17`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:29`.
- `archiveArchivistaPreventivoRecord` non riceve un argomento `analysis` completo nel type args: `src/next/internal-ai/ArchivistaArchiveClient.ts:83`-`src/next/internal-ai/ArchivistaArchiveClient.ts:102`.

### 3.4 Manutenzione

Persistito in `@documenti_mezzi`:

- `tipoDocumento`, `fornitore`, `numeroDocumento`, `dataDocumento`, `totaleDocumento`, `targa`, `km`, `testo`, `riassuntoBreve`, `avvisi`, `campiMancanti`, `valutaDocumento`, `voci`: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:778`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:800`.
- Target `@documenti_mezzi`: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:769`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:773`.

Persistito opzionalmente in `@manutenzioni` dopo archivio:

- `buildMaintenanceDraft` deriva `targa`, `data`, `fornitore`, `km`, `descrizione`, `importo`, `materiali`, `sourceDocumentId` da `analysis`: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:346`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:377`.
- Dopo archivio il draft viene creato con `analysis` e `sourceDocumentId: result.archiveId`: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:804`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:809`.
- Il bridge importa `saveNextManutenzioneBusinessRecord`: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:1`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:4`.

Non persistito oggi:

- Nessun oggetto completo `analysis` nel record `@documenti_mezzi`: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:778`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:800`.
- `voci` usa solo `selectedRows`, quindi righe deselezionate non sono nel payload archivio: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:526`, `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:791`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:799`.

### 3.5 Preventivo manutenzione

Persistito in `storage/@preventivi`:

- Dal bridge: `fornitore`, `numeroPreventivo`, `dataPreventivo`, `totaleDocumento`, `riassuntoBreve`, righe selezionate, `avvisi`, `campiMancanti`, `ambitoPreventivo: "manutenzione"`, `metadatiMezzo: { targa, km }`: `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:620`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:647`.
- Nel writer: `righe`, `famigliaArchivista`, `ambitoPreventivo`, `avvisiArchivista`, `campiMancantiArchivista`, `metadatiMezzo`: `src/next/internal-ai/ArchivistaArchiveClient.ts:572`-`src/next/internal-ai/ArchivistaArchiveClient.ts:586`.

Non persistito oggi:

- Nessun oggetto completo `analysis` nel record `storage/@preventivi`: writer payload a `src/next/internal-ai/ArchivistaArchiveClient.ts:561`-`src/next/internal-ai/ArchivistaArchiveClient.ts:588`.
- `ArchivistaPreventivoManutenzioneAnalysis` include `stato`, `tipoDocumento` e `testo`: `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:18`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:32`; l'archivio usa `reviewDraft` e selected rows a `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:620`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:647`.

## 4. COPERTURA buildArchivistaPreset

### 4.1 Definizione

`buildArchivistaPreset` e definita in `src/next/NextIADocumentiPage.tsx`: `src/next/NextIADocumentiPage.tsx:241`.

Il payload tipizzato include solo `tipo`, `contesto`, `fileUrl`, `sourceDocId`, `sourceKey`, `tipoDocumento`, `targa`: `src/next/NextIADocumentiPage.tsx:35`-`src/next/NextIADocumentiPage.tsx:43`.

### 4.2 Tipi documento coperti

Tipi coperti dalla funzione:

- Libretto: `isLibretto(item)` ritorna `tipo: "documento_mezzo", contesto: "documento_mezzo"` a `src/next/NextIADocumentiPage.tsx:244`-`src/next/NextIADocumentiPage.tsx:245`.
- Preventivo: `isPreventivo(item)` ritorna `tipo: "preventivo", contesto: "magazzino"` a `src/next/NextIADocumentiPage.tsx:248`-`src/next/NextIADocumentiPage.tsx:249`.
- Default non-libretto e non-preventivo: ritorna `tipo: "fattura_ddt", contesto: "magazzino"` a `src/next/NextIADocumentiPage.tsx:252`.

La funzione non contiene branch verso `contesto: "manutenzione"`.

### 4.3 Campi inseriti nel preset

Campi comuni inseriti da `buildArchivistaPresetDocumentFields`:

- `fileUrl` da `item.fileUrl`: `src/next/NextIADocumentiPage.tsx:226` e `src/next/NextIADocumentiPage.tsx:233`;
- `sourceDocId` da `item.sourceDocId`: `src/next/NextIADocumentiPage.tsx:227` e `src/next/NextIADocumentiPage.tsx:234`;
- `sourceKey` da `item.sourceKey`: `src/next/NextIADocumentiPage.tsx:228` e `src/next/NextIADocumentiPage.tsx:235`;
- `tipoDocumento` da `item.tipoDocumento`: `src/next/NextIADocumentiPage.tsx:229` e `src/next/NextIADocumentiPage.tsx:236`;
- `targa` da `item.targa`: `src/next/NextIADocumentiPage.tsx:230` e `src/next/NextIADocumentiPage.tsx:237`.

Campi per tipo:

- Libretto: `tipo`, `contesto`, piu `fileUrl`, `sourceDocId`, `sourceKey`, `tipoDocumento`, `targa`: `src/next/NextIADocumentiPage.tsx:241`-`src/next/NextIADocumentiPage.tsx:245`.
- Preventivo: `tipo`, `contesto`, piu `fileUrl`, `sourceDocId`, `sourceKey`, `tipoDocumento`, `targa`: `src/next/NextIADocumentiPage.tsx:248`-`src/next/NextIADocumentiPage.tsx:249`.
- Default fattura/DDT: `tipo`, `contesto`, piu `fileUrl`, `sourceDocId`, `sourceKey`, `tipoDocumento`, `targa`: `src/next/NextIADocumentiPage.tsx:252`.

La navigazione passa questo payload in `location.state.archivistaPreset`: `src/next/NextIADocumentiPage.tsx:487`-`src/next/NextIADocumentiPage.tsx:493` e `src/next/NextIADocumentiPage.tsx:940`-`src/next/NextIADocumentiPage.tsx:952`.

`NextIAArchivistaPage` normalizza e usa il preset solo per tipo/contesto e preload documento: `src/next/NextIAArchivistaPage.tsx:17`-`src/next/NextIAArchivistaPage.tsx:28`, `src/next/NextIAArchivistaPage.tsx:149`-`src/next/NextIAArchivistaPage.tsx:160`, `src/next/NextIAArchivistaPage.tsx:220`-`src/next/NextIAArchivistaPage.tsx:226`.

### 4.4 Copertura manutenzione e preventivo manutenzione

No.

Prova:

- `buildArchivistaPreset` non ritorna mai `contesto: "manutenzione"`: `src/next/NextIADocumentiPage.tsx:241`-`src/next/NextIADocumentiPage.tsx:252`.
- `NextIAArchivistaPage` supporta runtime attivo anche per `fattura_ddt:manutenzione` e `preventivo:manutenzione`: `src/next/NextIAArchivistaPage.tsx:92`-`src/next/NextIAArchivistaPage.tsx:110`.
- `NextIAArchivistaPage` monta i due bridge manutenzione quando `tipo/contesto` sono manutenzione: `src/next/NextIAArchivistaPage.tsx:326`-`src/next/NextIAArchivistaPage.tsx:329` e `src/next/NextIAArchivistaPage.tsx:351`-`src/next/NextIAArchivistaPage.tsx:354`.

Quindi il runtime Archivista copre manutenzione/preventivo manutenzione, ma `buildArchivistaPreset` non instrada oggi nessun record storico verso quei due contesti.
