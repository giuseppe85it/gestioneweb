# AUDIT — Archivista: fattibilità ramo Preventivo → Manutenzione

## 1. Mappa UI Archivista (stato reale)

Evidenza primaria: `src/next/NextIAArchivistaPage.tsx`.

| Tipo sorgente | Destinazione | Stato | File bridge |
|---|---|---|---|
| `fattura_ddt` | `magazzino` | `ATTIVO` | `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx` |
| `fattura_ddt` | `manutenzione` | `ATTIVO` | `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` |
| `fattura_ddt` | `documento_mezzo` | `STUB` (`not_available`) | nessuno |
| `preventivo` | `magazzino` | `ATTIVO` | `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx` |
| `preventivo` | `manutenzione` | `STUB` (`out_of_scope`) | nessuno |
| `preventivo` | `documento_mezzo` | `STUB` (`not_available`) | nessuno |
| `documento_mezzo` | `magazzino` | `STUB` (`not_available`) | nessuno |
| `documento_mezzo` | `manutenzione` | `STUB` (`not_available`) | nessuno |
| `documento_mezzo` | `documento_mezzo` | `ATTIVO` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` |

Riferimenti:
- tipi sorgente ammessi: `ArchivistaTipo = "fattura_ddt" | "preventivo" | "documento_mezzo"` in `NextIAArchivistaPage.tsx:12-13`
- destinazioni UI: `NextIAArchivistaPage.tsx:40-76`
- matrice reale sorgente × destinazione: `NextIAArchivistaPage.tsx:78-136`
- mount bridge attivi: `NextIAArchivistaPage.tsx:313-338`
- shell inattiva per rami non implementati: `NextIAArchivistaPage.tsx:339-348`

Nota runtime rilevante:
- per `documento_mezzo`, se il sottotipo selezionato è `libretto`, la pagina monta direttamente `ArchivistaDocumentoMezzoBridge` tramite early return in `NextIAArchivistaPage.tsx:227-255`.

## 2. Bridge Fattura/DDT → Manutenzione

Evidenza primaria: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`, `src/next/internal-ai/ArchivistaArchiveClient.ts`, `src/next/domain/nextManutenzioniDomain.ts`, `src/utils/cloneWriteBarrier.ts`.

### Input accettati

- Il bridge lavora su `selectedFiles: File[]` e quindi accetta un file singolo oppure più file/pagine lato UI (`ArchivistaManutenzioneBridge.tsx:393-418`).
- L’analisi viene inviata al backend `/internal-ai-backend/documents/manutenzione-analyze` (`ArchivistaManutenzioneBridge.tsx:17`, `632-689`).
- Se c’è un solo file il body contiene `fileName`, `fileBase64`, `contentBase64`, `mimeType`; se i file sono più di uno il body contiene `pages[]` (`ArchivistaManutenzioneBridge.tsx:673-683`).
- Il payload di analisi atteso dal bridge contiene: `tipoDocumento`, `fornitore`, `numeroDocumento`, `dataDocumento`, `totaleDocumento`, `targa`, `km`, `testo`, `riassuntoBreve`, `avvisi`, `campiMancanti`, `voci[]` (`ArchivistaManutenzioneBridge.tsx:32-45`).

### Collection lette

- Duplicati documento: `@documenti_mezzi` tramite `findArchivistaDuplicateCandidates({ family: "fattura_ddt_manutenzione", target: "@documenti_mezzi", ... })` in `ArchivistaManutenzioneBridge.tsx:729-737`.
- Nel write manutenzione il writer legge il dataset `@manutenzioni` e, se ci sono materiali, anche `@inventario` e `@materialiconsegnati` tramite `saveNextManutenzioneBusinessRecord(...)` e `persistLegacyMaterialEffects(...)` in `nextManutenzioniDomain.ts:592-670`.
- Il layer manutenzioni legge inoltre `@documenti_mezzi` per arricchire i record con `sourceDocumentFileUrl` e valuta a partire da `sourceDocumentId` (`nextManutenzioniDomain.ts:397-422`).

### Collection scritte + shape esatta

#### Scrittura 1: `@documenti_mezzi`

Il bridge archivia il documento sorgente con:
- `archiveArchivistaDocumentRecord({ family: "fattura_ddt_manutenzione", context: "manutenzione", targetCollection: "@documenti_mezzi", categoriaArchivio: "MEZZO", ... })`
- evidenza: `ArchivistaManutenzioneBridge.tsx:769-803`

Shape base passata dal bridge:
- `tipoDocumento`
- `fornitore`
- `numeroDocumento`
- `dataDocumento`
- `totaleDocumento`
- `targa`
- `km`
- `testo`
- `riassuntoBreve`
- `avvisi`
- `campiMancanti`
- `valutaDocumento`
- `voci[]` con `descrizione`, `categoria`, `quantita`, `unita`, `importo`, `codice`, `prezzoUnitario`
- evidenza: `ArchivistaManutenzioneBridge.tsx:778-799`

Campi archivistici aggiunti dal writer comune:
- `categoriaArchivio`
- `nomeFile`
- `fileUrl`
- `fileStoragePath`
- `fonte: "IA_ARCHIVISTA_V1"`
- `famigliaArchivista`
- `contestoArchivista`
- `statoArchivio: "archiviato"`
- `createdAt`
- metadati duplicato
- evidenza: `ArchivistaArchiveClient.ts:469-483`

#### Scrittura 2: `@manutenzioni`

La creazione manutenzione è separata dall’archiviazione e parte solo nel secondo step (`ArchivistaManutenzioneBridge.tsx:803-811`, `818-889`).

Payload inviato al writer:
- `targa`
- `tipo`
- `sottotipo`
- `fornitore`
- `km`
- `descrizione`
- `eseguito`
- `data`
- `materiali`
- `sourceDocumentId`
- `importo`
- evidenza: `ArchivistaManutenzioneBridge.tsx:861-873`

Shape persistita dal writer in `@manutenzioni`:
- `id`
- `targa`
- `tipo`
- `fornitore`
- `km`
- `ore`
- `sottotipo`
- `descrizione`
- `eseguito`
- `data`
- `materiali`
- `importo`
- `sourceDocumentId` se presente
- evidenza: `nextManutenzioniDomain.ts:526-564`, `647-670`

### Side-effect

- Upload del file originale su Storage in `documenti_pdf/...` attraverso `uploadArchivistaOriginalFile(...)` (`ArchivistaArchiveClient.ts:201-208`, `416-427`).
- Se viene creata la manutenzione, il writer applica anche effetti materiali:
  - decremento stock `@inventario`
  - append movimento su `@materialiconsegnati`
  - evidenza: `nextManutenzioniDomain.ts:592-645`

### Assunzioni implicite sul tipo sorgente

Il bridge non è neutro rispetto al tipo documento sorgente.

Evidenze dirette:
- family hard-coded `fattura_ddt_manutenzione` nel duplicate check e nell’archiviazione (`ArchivistaManutenzioneBridge.tsx:729`, `770`)
- helper `looksLikeInvoiceOrDdt(...)` che controlla solo `FATTURA` o `DDT` (`ArchivistaManutenzioneBridge.tsx:125-128`)
- warning specifico se `tipoDocumento` non sembra fattura/DDT (`ArchivistaManutenzioneBridge.tsx:553-558`)
- summary iniziale: `Carica una fattura o un DDT di officina...` (`ArchivistaManutenzioneBridge.tsx:591`)
- la bozza manutenzione nasce già come manutenzione reale di tipo `mezzo` (`ArchivistaManutenzioneBridge.tsx:346-377`, in particolare `368`)

Conclusione del bridge reale oggi:
- il flusso è `analisi documento -> controllo duplicati -> archiviazione in @documenti_mezzi -> eventuale creazione manutenzione reale in @manutenzioni`
- la creazione manutenzione non è un metadato del documento: è un write business separato con effetti materiali.

## 3. Bridge Preventivo → Magazzino

Evidenza primaria: `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`, `src/next/internal-ai/ArchivistaArchiveClient.ts`, `src/utils/cloneWriteBarrier.ts`.

### Input accettati

- Il bridge lavora su `selectedFile` singolo e invia l’analisi a `/internal-ai-backend/documents/preventivo-magazzino-analyze` (`ArchivistaPreventivoMagazzinoBridge.tsx:15`, `225-274`).
- Il payload di analisi atteso contiene: `tipoDocumento`, `fornitore`, `numeroDocumento`, `dataDocumento`, `totaleDocumento`, `testo`, `riassuntoBreve`, `avvisi`, `campiMancanti`, `voci[]` (`ArchivistaPreventivoMagazzinoBridge.tsx:17-29`).

### Collection lette

- Duplicati: `@preventivi` tramite `findArchivistaDuplicateCandidates({ family: "preventivo_magazzino", target: "@preventivi", ... })` (`ArchivistaPreventivoMagazzinoBridge.tsx:225-232`).
- Il reader duplicati per `@preventivi` legge `doc(db, "storage", "@preventivi")` e usa l’array `preventivi` (`ArchivistaArchiveClient.ts:337-349`).

### Collection scritte + shape esatta

Il bridge archivia con `archiveArchivistaPreventivoRecord(...)` (`ArchivistaPreventivoMagazzinoBridge.tsx:260-274`).

Collection reale di arrivo:
- `storage/@preventivi`
- scrittura con `setDoc(refDoc, { preventivi: nextPreventivi }, { merge: true })`
- evidenza: `ArchivistaArchiveClient.ts:540-570`

Shape del singolo record `nuovoPreventivo`:
- `id`
- `fornitoreId: "ARCHIVISTA_V1"`
- `fornitoreNome`
- `numeroPreventivo`
- `dataPreventivo`
- `totaleDocumento`
- `pdfUrl` / `pdfStoragePath` se PDF
- `imageStoragePaths` / `imageUrls` se immagine
- `righe[]`
- `createdAt`
- `updatedAt`
- `famigliaArchivista`
- `statoArchivio: "archiviato"`
- `riassuntoBreve`
- `avvisiArchivista`
- `campiMancantiArchivista`
- metadati duplicato
- evidenza: `ArchivistaArchiveClient.ts:547-567`

Shape delle `righe[]` normalizzate:
- `id`
- `descrizione`
- `unita`
- `prezzoUnitario`
- `note`
- evidenza: `ArchivistaArchiveClient.ts:501-508`

### Side-effect

- Upload originale su Storage in `preventivi/...` (`ArchivistaArchiveClient.ts:201-208`, `530-538`).
- Nessuna scrittura su `@manutenzioni`.
- Nessuna scrittura su `@documenti_mezzi`.
- Nessun secondo step di business analogo alla creazione manutenzione.

### Assunzioni implicite sul tipo sorgente

- family hard-coded `preventivo_magazzino` (`ArchivistaPreventivoMagazzinoBridge.tsx:225`, `261`)
- target duplicati e archivio hard-coded `@preventivi`
- il summary del bridge esplicita che il documento viene archiviato come preventivo e che il listino non viene aggiornato automaticamente (`ArchivistaPreventivoMagazzinoBridge.tsx:132-140`)

## 4. Dove finisce un preventivo oggi

### Collection

Il preventivo dell’Archivista finisce oggi in:
- `storage/@preventivi`
- più precisamente nell’array `preventivi` del documento `storage/@preventivi`
- evidenza: `ArchivistaArchiveClient.ts:540-570`

Non finisce, nei file letti, in:
- `@documenti_mezzi`
- `@documenti_magazzino`
- `@manutenzioni`

### Shape

Shape reale archivista:
- definita da `nuovoPreventivo` in `ArchivistaArchiveClient.ts:547-567`
- campi principali: fornitore, numero, data, totale, URL file/pdf, immagini, righe, riassunto, avvisi, campi mancanti, metadati archivista, stato archivio

Shape di lettura NEXT procurement:
- normalizzata in `NextProcurementPreventivoItem` (`nextProcurementDomain.ts:101-124`)
- campi esposti: supplier, numero, data, pdf/image URLs, rows, totalAmount, currency, approvalStatus, sourceCollection, sourceKey, flags

### Ciclo di vita / stati

Nei file letti il preventivo ha almeno questi stati/marker:
- `statoArchivio: "archiviato"` al momento dell’archiviazione Archivista (`ArchivistaArchiveClient.ts:562`)
- `approvalStatus` letto da `@preventivi_approvazioni` nel layer procurement/capo come `pending | approved | rejected` (`nextProcurementDomain.ts:117`, `704-765`; `nextCapoDomain.ts:28`, `507-562`)

Ma il ciclo di vita NEXT emerso dai file letti è prudenziale e read-only:
- `nextProcurementDomain.ts` legge `@preventivi`, `@preventivi_approvazioni`, `@listino_prezzi`, `@ordini` ma dichiara il procurement clone-safe/read-only (`nextProcurementDomain.ts:902-1053`)
- `nextCapoDomain.ts` legge le approvazioni ma dichiara che nel clone non riattiva scritture business o azioni approva/rifiuta operative (`nextCapoDomain.ts:553-560`)

### Esiste conversione preventivo → manutenzione?

`NO`, non trovata nei file letti.

Evidenza:
- il bridge preventivi archivista scrive solo `storage/@preventivi` (`ArchivistaPreventivoMagazzinoBridge.tsx:260-274`, `ArchivistaArchiveClient.ts:540-570`)
- nessun writer o bridge letto crea `@manutenzioni` partendo da un preventivo
- il ramo UI `preventivo -> manutenzione` è presente solo come `out_of_scope` in `NextIAArchivistaPage.tsx:70-75` e `105-110`, senza bridge montato (`339-348`)

### Esiste conversione preventivo → ordine / fattura?

`NO`, non trovata come meccanismo operativo nei file letti.

Evidenza:
- `nextProcurementDomain.ts` espone lettura di `@ordini`, `@preventivi`, `@preventivi_approvazioni`, `@listino_prezzi`, ma la superficie resta read-only (`nextProcurementDomain.ts:902-1053`)
- `nextCapoDomain.ts` legge approvazioni, ma non riattiva azioni operative di approvazione/scrittura (`nextCapoDomain.ts:553-560`)
- `nextDocumentiCostiDomain.ts` qualifica `@preventivi` come workflow procurement globale, non dataset mezzo-centrico (`nextDocumentiCostiDomain.ts:1654-1657`, `1741-1764`)

Nei file letti esistono solo collegamenti di supporto:
- `@preventivi_approvazioni` come stato approvativo read-only
- `@listino_prezzi` con campi di tracciabilità tipo `fontePreventivoId`, `fonteNumeroPreventivo`, `fonteDataPreventivo` (`nextProcurementDomain.ts:126-149`, `799-804`)

Questi collegamenti non dimostrano una conversione operativa a ordine, fattura o manutenzione.

## 5. Fattibilità "estendere bridge Manutenzione invece di crearne uno nuovo"

### Differenze payload Fattura vs Preventivo

Differenze confermate dai file letti:

Bridge manutenzione, lato documento archiviato:
- archivia in `@documenti_mezzi`
- usa campi mezzo-centrici: `targa`, `km`, `valutaDocumento`, `voci[]`
- usa `context: "manutenzione"` e `family: "fattura_ddt_manutenzione"`
- dopo archivio può creare un record business in `@manutenzioni`

Bridge preventivo magazzino, lato documento archiviato:
- archivia in `storage/@preventivi`
- non usa `targa` né `km` nel record archivista scritto
- usa shape procurement: `fornitoreNome`, `numeroPreventivo`, `dataPreventivo`, `totaleDocumento`, `pdfUrl/imageUrls`, `righe[]`
- non ha alcun secondo step business

### Punti del bridge che assumono "fattura"

Assunzioni esplicite e verificabili:
- nome endpoint: `/documents/manutenzione-analyze` (`ArchivistaManutenzioneBridge.tsx:17`)
- helper `looksLikeInvoiceOrDdt(...)` (`ArchivistaManutenzioneBridge.tsx:125-128`)
- family `fattura_ddt_manutenzione` (`ArchivistaManutenzioneBridge.tsx:729`, `770`)
- messaggi UI: `Carica una fattura o un DDT di officina...` (`ArchivistaManutenzioneBridge.tsx:591`)
- warning se il tipo non sembra fattura/DDT (`ArchivistaManutenzioneBridge.tsx:553-558`)
- duplicate target fissato su `@documenti_mezzi` (`ArchivistaManutenzioneBridge.tsx:729-737`)
- step 2 che propone di creare una manutenzione reale a partire dal documento appena archiviato (`ArchivistaManutenzioneBridge.tsx:803-889`)

### La destinazione `@manutenzioni` è semanticamente corretta per un preventivo?

Dai file letti, `NO` come comportamento automatico equivalente.

Motivazione basata su codice:
- `saveNextManutenzioneBusinessRecord(...)` crea una manutenzione reale, non un documento pre-lavoro (`nextManutenzioniDomain.ts:526-564`, `647-670`)
- se ci sono materiali selezionati, il writer applica anche effetti su inventario e movimenti (`nextManutenzioniDomain.ts:592-645`)
- il bridge manutenzione attuale presenta il secondo step come scelta separata successiva all’archiviazione di un documento già consuntivo (`ArchivistaManutenzioneBridge.tsx:891-907`)

Nei file letti non esiste una nozione di record manutenzione "preventiva", "bozza", "da approvare" o equivalente dentro `@manutenzioni`.

### Verdetto

`FATTIBILE CON REFACTOR MIRATO`

Motivazione strettamente basata su evidenza:
- la struttura UI del bridge manutenzione è riusabile solo in parte, perché la sequenza `analisi -> duplicati -> archivio -> eventuale secondo step` è reale e già separa documento da manutenzione
- la logica attuale, però, non è neutra: assume fattura/DDT in family, testi, validazioni qualitative e destinazione archivio
- soprattutto, il secondo step scrive una manutenzione reale con effetti materiali; nei file letti non esiste prova che un preventivo debba o possa produrre lo stesso esito business senza una generalizzazione esplicita del significato del flusso

## 6. Domande aperte / file non letti

- Non è stato trovato, nei file letti, un meccanismo operativo di conversione `preventivo -> manutenzione`.
- Non è stato trovato, nei file letti, un meccanismo operativo di conversione `preventivo -> ordine`.
- Non è stato trovato, nei file letti, un meccanismo operativo di conversione `preventivo -> fattura`.
- Non è verificabile dai file letti se esistano percorsi legacy fuori dal perimetro NEXT che trattano i preventivi con una semantica diversa; questo audit ha letto i bridge Archivista NEXT, i writer/domain collegati e i principali consumatori NEXT di `@preventivi`, `@manutenzioni`, `@documenti_mezzi`, `@documenti_magazzino`.
- Non è verificabile dai file letti una shape canonica "preventivo manutenzione" distinta da quella procurement globale; nei file letti esiste solo il dataset procurement `@preventivi` e il dataset business reale `@manutenzioni`.
