# AUDIT ARCHIVISTA — RIUSABILITA EDIT MEZZO — 2026-04-26

## 0. RIASSUNTO TOP-LINE
- Componente edit mezzo Archivista: `src/next/internal-ai/NextEstrazioneLibretto.tsx`
- Standalone: si come componente React, no come modal anagrafica mezzo autonoma
- Campi madre coperti: 12 pieni + 8 parziali / 27 proprieta trovate nel type `Mezzo`; il prompt cita 25 campi, ma il type ne dichiara 27
- Campi mancanti: 7
- Verdetto: C
- Motivo verdetto in 1 riga: la UI e accoppiata a documento, OCR/libretto, duplicati e archiviazione Archivista; non esiste oggi un form puro `Mezzo -> onSave`.

## 1. COMPONENTE EDIT MEZZO IN ARCHIVISTA
### 1.1 Individuazione
La UI di review/edit dati mezzo nel flusso Archivista documento mezzo/libretto e renderizzata da `NextEstrazioneLibretto`:

- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:17` importa `NextEstrazioneLibretto`.
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2408` monta `<NextEstrazioneLibretto ... />`.
- `src/next/internal-ai/NextEstrazioneLibretto.tsx:24` definisce `NextEstrazioneLibrettoProps`.
- `src/next/internal-ai/NextEstrazioneLibretto.tsx:1182` esporta default `NextEstrazioneLibretto`.

Non sono stati trovati componenti chiamati `VehicleEdit`, `VehicleForm` o `MezzoForm` nei grep su `src/next`.

### 1.2 Path, export, props, montaggio
| Elemento | Evidenza |
| --- | --- |
| Componente UI | `src/next/internal-ai/NextEstrazioneLibretto.tsx:277` funzione `NextEstrazioneLibretto` |
| Export | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1182` `export default NextEstrazioneLibretto` |
| Props | `src/next/internal-ai/NextEstrazioneLibretto.tsx:24-115` |
| Montaggio Archivista | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2408-2464` |
| Entrypoint Archivista | `src/next/NextIAArchivistaPage.tsx:220-223` e `src/next/NextIAArchivistaPage.tsx:300-304` |
| Route Archivista | `src/App.tsx:515-518` monta `NextIAArchivistaPage` su `ia/archivista` |
| Route Dossier Mezzo target | `src/App.tsx:451-454` monta `NextDossierMezzoPage` su `dossier/:targa` |

Le props sono legate a file/documento, destinazione, OCR, duplicati, preview, conferma archiviazione e scelta mezzo. Esempi:

- Documento/preview: `fileName`, `fileTypeLabel`, `previewUrl`, `previewMode`, `onFileSelect` in `src/next/internal-ai/NextEstrazioneLibretto.tsx:60-73` e `101`.
- Analisi/campi: `getFieldValue`, `onFieldChange` in `src/next/internal-ai/NextEstrazioneLibretto.tsx:94` e `100`.
- Archivio/duplicati: `duplicateCandidates`, `duplicateChoice`, `duplicateStatus`, `onCheckDuplicates` in `src/next/internal-ai/NextEstrazioneLibretto.tsx:36-38` e `113`.
- Conferma Archivista: `confirmState`, `confirmCompleted`, `onConfirm`, `onDiscard` in `src/next/internal-ai/NextEstrazioneLibretto.tsx:29-35` e `98-99`.

### 1.3 Standalone o inline
`NextEstrazioneLibretto` e un componente standalone come file React, ma non e standalone come edit modal anagrafica:

- riceve 40+ props operative in `src/next/internal-ai/NextEstrazioneLibretto.tsx:24-115`;
- viene pilotato dal bridge Archivista con stato locale del flusso libretto in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2408-2464`;
- il salvataggio finale passa dal bridge e dall'archiviazione documento, non da una callback pura `onSave(mezzoUpdated)`.

## 2. STRUTTURA UI
### 2.1 Ordine rendering
Ordine di rendering principale in `NextEstrazioneLibretto`:

1. Topbar con bottone storico: `src/next/internal-ai/NextEstrazioneLibretto.tsx:399-405`.
2. Hero "Importa documenti": `src/next/internal-ai/NextEstrazioneLibretto.tsx:407-409`.
3. Card destinazione rilevata e menu cambio destinazione: `src/next/internal-ai/NextEstrazioneLibretto.tsx:412-443`.
4. Card modello documento/libretto: `src/next/internal-ai/NextEstrazioneLibretto.tsx:445-458`.
5. Card caricamento documento e pulsante analisi: `src/next/internal-ai/NextEstrazioneLibretto.tsx:460-509`.
6. Template libretto editabile: `src/next/internal-ai/NextEstrazioneLibretto.tsx:685-895`.
7. Card collegamento al mezzo, creazione nuovo mezzo, aggiornamento mezzo esistente, foto mezzo: `src/next/internal-ai/NextEstrazioneLibretto.tsx:897-1058`.
8. Card controllo duplicati documento: `src/next/internal-ai/NextEstrazioneLibretto.tsx:1060-1141`.
9. Stato conferma Archivista: `src/next/internal-ai/NextEstrazioneLibretto.tsx:1144-1156`.
10. Footer conferma archiviazione: `src/next/internal-ai/NextEstrazioneLibretto.tsx:1158-1175`.

### 2.2 Input (tabella)
| Etichetta UI | Campo/state | Tipo input | File:riga |
| --- | --- | --- | --- |
| Scegli file | documento caricato | file | `src/next/internal-ai/NextEstrazioneLibretto.tsx:467-476` |
| Ottimizza immagine per estrazione | `optimizeImageForExtraction` | checkbox | `src/next/internal-ai/NextEstrazioneLibretto.tsx:500-505` |
| Template libretto generico | `LibrettoTemplateField.key` via `renderTemplateInput` | text/textarea | `src/next/internal-ai/NextEstrazioneLibretto.tsx:117-217` |
| N. AVS | `nAvs` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:233-234`, render `703-706` |
| Proprietario | `proprietario` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:235`, render `713-716` |
| Indirizzo | `indirizzo` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:236`, render `723` |
| Localita | `localita` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:237`, render `724-727` |
| Stato d'origine | `statoOrigine` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:238`, render `734-737` |
| Assicurazione | `assicurazione` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:239`, render `738-741` |
| Annotazioni | `annotazioni` -> `note`/`testo` | textarea | `src/next/internal-ai/NextEstrazioneLibretto.tsx:240`, render `751-755`; mapper `src/next/internal-ai/utils/librettoFieldMapper.ts:194-197` |
| Targa | `targa` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:241`, render `766-770`; nuovo mezzo `974-979` |
| Colore | `colore` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:242`, render `772` e `802` |
| Genere veicolo | `genereVeicolo` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:243`, render `777-779`; nuovo mezzo `997-1004` |
| Marca e tipo | `marcaTipo` -> `modello` parziale | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:244`, render `783-786`; mapper `src/next/internal-ai/utils/librettoFieldMapper.ts:116-125`; nuovo mezzo `981-995` |
| Telaio | `telaio` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:245`, render `790-793` |
| Carrozzeria | `carrozzeria` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:246`, render `797-800` |
| Numero matricola | `numeroMatricola` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:247`, render `808-811` |
| Approvazione tipo | `approvazioneTipo` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:248`, render `812-815` |
| Cilindrata | `cilindrata` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:249`, render `816-819` |
| Potenza | `potenza` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:250`, render `820-823` |
| Peso totale | `pesoTotale` -> `massaComplessiva` in nuovo record | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:253`, render `834-837`; mapping record `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1385` |
| Prima immatricolazione | `primaImmatricolazione` -> `dataImmatricolazione` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:257`, render `856-859`; mapping `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1370-1372` |
| Ultimo collaudo | `ultimoCollaudo` -> `dataUltimoCollaudo` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:259`, render `872-875`; mapper `src/next/internal-ai/utils/librettoFieldMapper.ts:188-190` |
| Prossimo collaudo / revisione | `prossimoCollaudoRevisione` -> `dataScadenzaRevisione` | text | `src/next/internal-ai/NextEstrazioneLibretto.tsx:260`, render `882-885`; mapper `src/next/internal-ai/utils/librettoFieldMapper.ts:191-193` |
| Seleziona il mezzo | `selectedTarga` / `selectedVehicleId` | select | `src/next/internal-ai/NextEstrazioneLibretto.tsx:921-936` |
| Aggiorna anche i campi del mezzo dopo l'archiviazione | `saveNewVehicle` | checkbox | `src/next/internal-ai/NextEstrazioneLibretto.tsx:938-945` |
| Categoria | `categoria` | select | `src/next/internal-ai/NextEstrazioneLibretto.tsx:957-970` |
| Salva il nuovo mezzo in anagrafica | `saveNewVehicle` | checkbox | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1007-1014` |
| Foto del mezzo | `vehiclePhotoFileName` / file foto | file | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1019-1041` |

### 2.3 Bottoni
| Etichetta | Handler/prop | Scopo | File:riga |
| --- | --- | --- | --- |
| Vai a storico -> | `onOpenHistory` | navigazione storico | `src/next/internal-ai/NextEstrazioneLibretto.tsx:400-404` |
| Destinazione errata? Cambia | `onToggleDestinationMenu` | menu destinazioni | `src/next/internal-ai/NextEstrazioneLibretto.tsx:421-441` |
| Analizza documento | `onAnalyze` | avvia analisi documento | `src/next/internal-ai/NextEstrazioneLibretto.tsx:490-497` |
| Collega a mezzo esistente | `onToggleMezzoMode("esistente")` | cambia modo | `src/next/internal-ai/NextEstrazioneLibretto.tsx:901-908` |
| + Crea nuovo mezzo | `onToggleMezzoMode("nuovo")` | cambia modo | `src/next/internal-ai/NextEstrazioneLibretto.tsx:909-915` |
| Seleziona foto | `handleVehiclePhotoSelect` | scelta foto mezzo | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1033-1041` |
| Rimuovi foto | `handleVehiclePhotoClear` | reset foto scelta | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1043-1050` |
| Controlla duplicati | `handleCheckDuplicates` | controllo duplicati archivio | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1067-1074` |
| Usa questo | `handleSelectDuplicateId` | selezione duplicato | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1084-1090` |
| Stesso documento | `handleSelectDuplicateChoice` | scelta duplicato | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1118-1124` |
| Versione migliore | `handleSelectDuplicateChoice` | scelta duplicato | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1125-1131` |
| Documento diverso | `handleSelectDuplicateChoice` | scelta duplicato | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1132-1138` |
| Scarta documento | `onDiscard` | reset flusso documento | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1165-1167` |
| Conferma e archivia -> | `onConfirm` | archiviazione + eventuale update mezzo | `src/next/internal-ai/NextEstrazioneLibretto.tsx:1168-1175` |

### 2.4 Banner/alert
- Banner "Destinazione rilevata": `src/next/internal-ai/NextEstrazioneLibretto.tsx:412-443`.
- Banner nuovo mezzo: `src/next/internal-ai/NextEstrazioneLibretto.tsx:949-955`.
- Stato duplicati: `src/next/internal-ai/NextEstrazioneLibretto.tsx:1075-1115`.
- Stato conferma: `src/next/internal-ai/NextEstrazioneLibretto.tsx:1144-1156`.
- Messaggio finale "Campi mezzo aggiornati..." o "Nessun campo mezzo cambiato..." impostato dal bridge: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2362-2368`.

### 2.5 CSS e prefissi
- `NextEstrazioneLibretto` importa `src/next/internal-ai/next-estrazione-libretto.css` a `src/next/internal-ai/NextEstrazioneLibretto.tsx:11`.
- Il file `next-estrazione-libretto.css` usa classi prefissate e scope `.iai-libretto-extraction`: `src/next/internal-ai/next-estrazione-libretto.css:1-4`.
- `NextIAArchivistaPage` importa il CSS principale `src/next/internal-ai/internal-ai.css` tramite `src/next/NextIAArchivistaPage.tsx:11`.
- `internal-ai.css` contiene blocchi `ia-archivista-*` e `iai-*`, ad esempio `src/next/internal-ai/internal-ai.css:5418-5470`.
- `NextDossierMezzoPage` usa invece `src/pages/DossierMezzo.css` e `src/next/next-shell.css`: `src/next/NextDossierMezzoPage.tsx:14-15`.

## 3. MAPPA CAMPI
### 3.1 Type Mezzo madre — 25 campi
Il type madre letto in `src/pages/Mezzi.tsx:26-63` contiene 27 proprieta. Il prompt cita "25 campi anagrafica madre"; il codice dichiara 27 proprieta, quindi la tabella riporta tutte quelle trovate senza inventare esclusioni.

| # | Campo | Tipo |
| --- | --- | --- |
| 1 | `id` | `string` |
| 2 | `tipo` | `"motrice" | "cisterna" | undefined` |
| 3 | `categoria` | `string | undefined` |
| 4 | `targa` | `string` |
| 5 | `marca` | `string` |
| 6 | `modello` | `string` |
| 7 | `telaio` | `string` |
| 8 | `colore` | `string` |
| 9 | `cilindrata` | `string` |
| 10 | `potenza` | `string` |
| 11 | `massaComplessiva` | `string` |
| 12 | `proprietario` | `string` |
| 13 | `assicurazione` | `string` |
| 14 | `dataImmatricolazione` | `string` |
| 15 | `dataScadenzaRevisione` | `string` |
| 16 | `dataUltimoCollaudo` | `string` |
| 17 | `manutenzioneProgrammata` | `boolean` |
| 18 | `manutenzioneDataInizio` | `string | undefined` |
| 19 | `manutenzioneDataFine` | `string | undefined` |
| 20 | `manutenzioneKmMax` | `string | undefined` |
| 21 | `manutenzioneContratto` | `string | undefined` |
| 22 | `note` | `string` |
| 23 | `autistaId` | `string | null | undefined` |
| 24 | `autistaNome` | `string | null | undefined` |
| 25 | `marcaModello` | `string | undefined` |
| 26 | `fotoUrl` | `string | null | undefined` |
| 27 | `fotoPath` | `string | null | undefined` |

Nota conteggio: la numerazione tabellare sopra esplicita tutte le proprieta dichiarate nel type. Il prompt cita "25 campi anagrafica madre", ma il codice letto mostra 27 proprieta. Nessun campo ulteriore e stato inventato.

### 3.2 Tabella copertura
| # | Campo madre | Gestito da Archivista | File:riga |
| --- | --- | --- | --- |
| 1 | `id` | Parziale: generato per nuovo mezzo, non input editabile | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1359-1363` |
| 2 | `tipo` | Parziale: derivato da categoria/genere, non input `motrice/cisterna` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1364-1377` |
| 3 | `categoria` | Si | `src/next/internal-ai/NextEstrazioneLibretto.tsx:957-970`; scrittura `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1478-1480` |
| 4 | `targa` | Si | `src/next/internal-ai/NextEstrazioneLibretto.tsx:766-770`, `974-979`; scrittura `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1456-1458` |
| 5 | `marca` | Parziale: presente in analysis/update, UI principale usa `marcaTipo` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1426-1428`; UI `src/next/internal-ai/NextEstrazioneLibretto.tsx:981-995` |
| 6 | `modello` | Si tramite `marcaTipo`/mapper | `src/next/internal-ai/utils/librettoFieldMapper.ts:116-125`; scrittura `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1458-1460` |
| 7 | `telaio` | Si | `src/next/internal-ai/NextEstrazioneLibretto.tsx:790-793`; scrittura `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1460` |
| 8 | `colore` | Si | `src/next/internal-ai/NextEstrazioneLibretto.tsx:772`, `802`; scrittura `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1478` |
| 9 | `cilindrata` | Parziale: input e nuovo record, non update existing in `buildArchivistaLibrettoVehicleUpdateFields` | `src/next/internal-ai/NextEstrazioneLibretto.tsx:816-819`; nuovo record `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1383` |
| 10 | `potenza` | Parziale: input e nuovo record, non update existing in `buildArchivistaLibrettoVehicleUpdateFields` | `src/next/internal-ai/NextEstrazioneLibretto.tsx:820-823`; nuovo record `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1384` |
| 11 | `massaComplessiva` | Parziale: input `pesoTotale` e nuovo record, non update existing in `buildArchivistaLibrettoVehicleUpdateFields` | `src/next/internal-ai/NextEstrazioneLibretto.tsx:834-837`; nuovo record `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1385` |
| 12 | `proprietario` | Si | `src/next/internal-ai/NextEstrazioneLibretto.tsx:713-716`; scrittura `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1461` |
| 13 | `assicurazione` | Si | `src/next/internal-ai/NextEstrazioneLibretto.tsx:738-741`; scrittura `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1462` |
| 14 | `dataImmatricolazione` | Si tramite `primaImmatricolazione`/date mapper | `src/next/internal-ai/NextEstrazioneLibretto.tsx:856-859`; scrittura `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1463-1467` |
| 15 | `dataScadenzaRevisione` | Si tramite `prossimoCollaudoRevisione` | `src/next/internal-ai/NextEstrazioneLibretto.tsx:879-885`; scrittura `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1473-1477` |
| 16 | `dataUltimoCollaudo` | Si tramite `ultimoCollaudo` | `src/next/internal-ai/NextEstrazioneLibretto.tsx:869-875`; scrittura `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1468-1472` |
| 17 | `manutenzioneProgrammata` | No: solo default false su nuovo record | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1396` |
| 18 | `manutenzioneDataInizio` | No: solo default vuoto su nuovo record | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1397` |
| 19 | `manutenzioneDataFine` | No: solo default vuoto su nuovo record | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1398` |
| 20 | `manutenzioneKmMax` | No: solo default vuoto su nuovo record | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1399` |
| 21 | `manutenzioneContratto` | No: solo default vuoto su nuovo record | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1400` |
| 22 | `note` | Parziale: textarea `annotazioni` mappa a `note`, ma update existing non include `note` nei candidati | UI `src/next/internal-ai/NextEstrazioneLibretto.tsx:751-755`; mapper `src/next/internal-ai/utils/librettoFieldMapper.ts:194-197`; nuovo record `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1401` |
| 23 | `autistaId` | No: solo default null su nuovo record | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1402` |
| 24 | `autistaNome` | No: solo default null su nuovo record | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1403` |
| 25 | `marcaModello` | Parziale: derivato, non input | nuovo record `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1404`; update `1525-1528` |
| 26 | `fotoUrl` | Si | UI `src/next/internal-ai/NextEstrazioneLibretto.tsx:1019-1041`; update `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1515-1522` |
| 27 | `fotoPath` | Si | UI `src/next/internal-ai/NextEstrazioneLibretto.tsx:1019-1041`; update `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1515-1518` |

### 3.3 Sintesi (coperti / mancanti / elenco mancanti)
- Coperti pieni: `categoria`, `targa`, `modello`, `telaio`, `colore`, `proprietario`, `assicurazione`, `dataImmatricolazione`, `dataScadenzaRevisione`, `dataUltimoCollaudo`, `fotoUrl`, `fotoPath`.
- Coperti parziali/non autonomi: `id`, `tipo`, `marca`, `cilindrata`, `potenza`, `massaComplessiva`, `note`, `marcaModello`.
- Mancanti come input editabile o update anagrafica completo: `manutenzioneProgrammata`, `manutenzioneDataInizio`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto`, `autistaId`, `autistaNome`.

## 4. ACCOPPIAMENTO AL FLUSSO DOCUMENTO
### 4.1 Dipendenze da documento/analisi
Il componente dipende da documento/analisi:

- `fileName`, `fileTypeLabel`, `acceptedFileTypes`, `previewUrl`, `previewText`, `previewMode`, `onFileSelect`: `src/next/internal-ai/NextEstrazioneLibretto.tsx:60-73`, `101`.
- `onAnalyze` e `isAnalyzeDisabled`: `src/next/internal-ai/NextEstrazioneLibretto.tsx:62`, `97`.
- `getFieldValue` e `onFieldChange` leggono/scrivono l'oggetto `analysis` nel bridge: `src/next/internal-ai/NextEstrazioneLibretto.tsx:94`, `100`; bridge `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2513-2525`.
- `canonicalLibrettoViewModel` per layout libretto: `src/next/internal-ai/NextEstrazioneLibretto.tsx:82-93`.
- `duplicateCandidates`, `duplicateStatus`, `duplicateChoice`: `src/next/internal-ai/NextEstrazioneLibretto.tsx:36-38`.

### 4.2 Side effect Archivista
Side effect specifici del flusso Archivista:

- Creazione record nuovo mezzo durante archiviazione documento: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2328-2344`.
- Update mezzo esistente solo dopo archiviazione con esito `archived`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2348-2361`.
- Scrittura su `@mezzi_aziendali` via `setItemSync`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2343`, `1531-1533`; helper esterno `src/next/internal-ai/ArchivistaArchiveClient.ts:708-710`.
- Messaggi Archivista post-conferma: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2362-2368`, `2377-2381`.
- Rollback in caso di errore di archiviazione nuovo mezzo: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2383-2394`.

### 4.3 Montabile indipendentemente?
Risposta: no.

Motivi fattuali:

- `NextEstrazioneLibrettoProps` richiede stato e callback di documento/analisi/duplicati/archiviazione in `src/next/internal-ai/NextEstrazioneLibretto.tsx:24-115`.
- Il salvataggio avviene con `onConfirm` e testo "Conferma archiviazione" in `src/next/internal-ai/NextEstrazioneLibretto.tsx:1158-1175`, non con `onSave(mezzoUpdated)`.
- Il bridge aggiorna `analysis` e applica trasformazioni libretto in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2464-2532`.
- Non e trovato un export di componente modal anagrafica mezzo puro.

### 4.4 Salvataggio: puro mezzo o legato a documento?
Il salvataggio e legato al flusso documento:

- `onConfirm={() => void handleArchive()}` viene passato al componente a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2460`.
- `handleArchive` esegue archiviazione e poi update mezzo se `result.status === "archived"`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2348-2361`.
- Per libretto, update existing passa da `applyArchivistaLibrettoVehicleUpdate`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1493-1534`.
- Per sottotipi non libretto, passa da `applyArchivistaVehicleUpdate`: `src/next/internal-ai/ArchivistaArchiveClient.ts:683-719`.
- Non trovato un punto di salvataggio "puro mezzo" gia separato che accetti un oggetto `Mezzo` e lo salvi senza documento.

## 5. STILE / CSS
### 5.1 File CSS e import
- `NextEstrazioneLibretto` importa `src/next/internal-ai/next-estrazione-libretto.css` a `src/next/internal-ai/NextEstrazioneLibretto.tsx:11`.
- `next-estrazione-libretto.css` e scoped su `.iai-libretto-extraction`: `src/next/internal-ai/next-estrazione-libretto.css:1-4`.
- `NextIAArchivistaPage` importa `src/next/internal-ai/internal-ai.css` a `src/next/NextIAArchivistaPage.tsx:11`.
- `internal-ai.css` contiene classi `.iai-*` da `src/next/internal-ai/internal-ai.css:5418` in poi e classi `.ia-archivista-bridge__*` da `src/next/internal-ai/internal-ai.css:4448` in poi.
- `NextDossierMezzoPage` importa `src/pages/DossierMezzo.css` e `src/next/next-shell.css`: `src/next/NextDossierMezzoPage.tsx:14-15`.

### 5.2 Collisioni con Dossier Mezzo
Non sono stati trovati prefissi identici tra `iai-*` e `dossier-*`. Tuttavia il riuso diretto richiederebbe portare nel Dossier Mezzo CSS pensato per Archivista:

- il componente usa classi `iai-*` e `iai-libretto-*` in `src/next/internal-ai/NextEstrazioneLibretto.tsx:399-1175`;
- Dossier Mezzo renderizza classi `dossier-*` in `src/next/NextDossierMezzoPage.tsx:501-520`;
- `next-estrazione-libretto.css` e scoped su `.iai-libretto-extraction`, ma `internal-ai.css` contiene anche selettori globali `.iai-*`.

Collisione diretta non trovata; accoppiamento stilistico ad Archivista trovato.

## 6. VERDETTO
### 6.1 Scenario consigliato (A o B o C)
Scenario consigliato: C - non riusabile come componente di edit anagrafica; si puo riusare solo lo stile/UI come riferimento per un modal nuovo.

Evidenze:

- Il componente renderizza un flusso "Importa documenti" e "Conferma archiviazione", non un modal anagrafica: `src/next/internal-ai/NextEstrazioneLibretto.tsx:407-409`, `1158-1175`.
- Il salvataggio e condizionato da archiviazione documento riuscita: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2348-2361`.
- Non copre pienamente manutenzione programmata, autista e diversi campi tecnici in update existing: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1396-1403`, `1456-1481`.

### 6.2 Scenari rifiutati e perche
Scenario A - riuso diretto: rifiutato.

- Props non pulite per Dossier Mezzo: `src/next/internal-ai/NextEstrazioneLibretto.tsx:24-115`.
- Richiede documento, preview, duplicati, conferma archiviazione e callback Archivista.
- Non e un modal e non espone `onSave(mezzoUpdated)`.

Scenario B - refactor leggero: rifiutato come scenario consigliato.

- Esistono sottoblocchi UI estraibili solo con lavoro non banale: template libretto `src/next/internal-ai/NextEstrazioneLibretto.tsx:685-895`, collegamento mezzo `897-1058`, logica mapping `src/next/internal-ai/utils/librettoFieldMapper.ts:39-201`.
- Il form estratto non sarebbe gia completo per Dossier Mezzo: mancano input/gestione manutenzione programmata e autista; alcuni campi sono solo per nuovo record o solo derivati.
- Non esiste oggi un componente condiviso "edit anagrafica mezzo" da spostare senza cambiare responsabilita.

### 6.3 Lavori richiesti per lo scenario consigliato
- Creare un modal nuovo in area Dossier Mezzo con props pure `mezzo`, `onClose`, `onSaved`.
- Replicare solo pattern visuali utili di Archivista (`iai`-like grid, sezioni, input compatti) senza importare il flusso documento.
- Coprire esplicitamente tutti i campi del type `Mezzo` richiesti per anagrafica Dossier.
- Gestire i 5 campi manutenzione programmata come sezione dedicata.
- Gestire autista abituale (`autistaId`, `autistaNome`) con fonte dati NEXT esistente o dichiarare non trovato se assente nel prompt implementativo.
- Usare writer NEXT dedicato per `@mezzi_aziendali`, non `setItemSync` Archivista.
- Tenere separata la foto mezzo dal documento/libretto: il componente Archivista usa `vehiclePhoto*` nel flusso documento, non un editor foto mezzo autonomo.
- Non importare `NextEstrazioneLibretto` direttamente in `NextDossierMezzoPage`.

## 7. NOTE FINALI (solo fatti di codice, niente opinioni)
- `VehicleEdit`, `VehicleForm`, `MezzoForm` non sono trovati nei grep su `src/next`.
- `applyArchivistaVehicleUpdate` esiste in `src/next/internal-ai/ArchivistaArchiveClient.ts:683-719`.
- `applyArchivistaLibrettoVehicleUpdate` e interna a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1493-1534`, non export pubblico.
- Il componente edit/review usa `setItemSync("@mezzi_aziendali", ...)` nel flusso Archivista: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2343`, `1533`; `src/next/internal-ai/ArchivistaArchiveClient.ts:710`.
- Dossier Mezzo oggi mostra dati tecnici e manutenzione programmata in read UI: `src/next/NextDossierMezzoPage.tsx:514-516`.
- Nessun campo ulteriore e stato trovato nel `type Mezzo` oltre alle proprieta dichiarate in `src/pages/Mezzi.tsx:26-63`.
