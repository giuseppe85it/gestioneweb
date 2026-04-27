# AUDIT RIAPRI REVIEW DIAGNOSI — 2026-04-27

## 0. RIASSUNTO TOP-LINE
- D1: i campi estratti sono PARZIALI
- Path persistenza analisi: non esiste per l'oggetto `analysis` completo; subset in Firestore `@documenti_mezzi`, subset/shape mezzo in `@mezzi_aziendali`
- D2: Analizza disabilitato perché manca: `selectedFile` valorizzato oppure `analysisStatus !== "loading"`; la condizione esatta è `!selectedFile || analysisStatus === "loading"`
- Strategia fix consigliata: altro — persistere `analysis` completa nei nuovi archivi e precaricarla; per archivi vecchi senza `analysis`, fallback a rianalisi
- Numero file da modificare per fix: 4

## 1. DOMANDA D1 — ARCHIVIAZIONE SALVA L'ANALYSIS?

### 1.1 Flusso archiviazione libretto

Il click finale di conferma nel bridge libretto arriva a `handleArchive` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2454`.

La funzione richiede due prerequisiti iniziali:

```tsx
const handleArchive = async () => {
  if (!selectedFile || !analysis) {
    return;
  }
```

Prova: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2454-2457`.

Quindi il salvataggio finale non parte senza `analysis` in memoria, ma questo non implica che `analysis` venga persistita integralmente.

### 1.2 Payload passato all'archivio documento

Il documento viene archiviato chiamando `archiveArchivistaDocumentRecord`:

```tsx
const result = await archiveArchivistaDocumentRecord({
  family: "documento_mezzo",
  context: "documento_mezzo",
  targetCollection: "@documenti_mezzi",
  categoriaArchivio: "MEZZO",
  selectedFile,
  fileName: selectedFile.name,
  duplicateChoice,
  duplicateCandidate: duplicateCandidateSelected,
  basePayload: {
    tipoDocumento: analysis.tipoDocumento,
    sottotipoDocumentoMezzo: selectedSubtype,
    fornitore: analysis.fornitore || null,
    numeroDocumento: analysis.numeroDocumento || null,
    dataDocumento: analysis.dataDocumento || null,
    targa:
      (newVehicleRecord ? normalizeText(newVehicleRecord.targa) : selectedVehicle?.targa) ||
      analysis.targa ||
      null,
    mezzoId: String(newVehicleRecord?.id ?? selectedVehicleId),
    telaio: analysis.telaio || null,
    proprietario: analysis.proprietario || null,
    assicurazione: analysis.assicurazione || null,
    marca: analysis.marca || null,
    modello: analysis.modello || null,
    dataImmatricolazione: analysis.dataImmatricolazione || null,
    dataScadenza: analysis.dataScadenza || null,
    dataUltimoCollaudo: analysis.dataUltimoCollaudo || null,
    dataScadenzaRevisione: analysis.dataScadenzaRevisione || null,
    riassuntoBreve: analysis.riassuntoBreve || null,
    testo: analysis.testo || null,
    campiMancanti: missingFields,
    avvisi: warnings,
    documentoMezzoAggiornamentoConfermato: applyVehicleUpdateChoice,
  },
});
```

Prova: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2530-2564`.

La shape dimostrata contiene metadati e alcuni campi estratti. Non contiene `analysis`, `extractedFields`, `extractedData`, `librettoAnalysis` o un oggetto equivalente con tutti i campi della review.

### 1.3 Funzione di salvataggio finale

`archiveArchivistaDocumentRecord` riceve `basePayload`, carica il file su Storage e aggiunge metadati di archivio:

```ts
const { fileUrl, fileStoragePath } = await uploadArchivistaOriginalFile({
  selectedFile: args.selectedFile,
  family: args.family,
});

const payload = sanitizeValue({
  ...args.basePayload,
  categoriaArchivio: args.categoriaArchivio,
  nomeFile: args.fileName,
  fileUrl,
  fileStoragePath,
  fonte: "IA_ARCHIVISTA_V1",
  famigliaArchivista: args.family,
  contestoArchivista: args.context,
  statoArchivio: "archiviato",
  createdAt: serverTimestamp(),
  ...buildDuplicateMetadata(duplicateChoice, duplicateCandidate),
});

const savedRef = await addDoc(collection(db, args.targetCollection), payload);
```

Prova: `src/next/internal-ai/ArchivistaArchiveClient.ts:478-496`.

Il path persistito è Firestore collection `@documenti_mezzi`, perché il bridge passa `targetCollection: "@documenti_mezzi"` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2533`.

Il file originale viene caricato separatamente da `uploadArchivistaOriginalFile`: `src/next/internal-ai/ArchivistaArchiveClient.ts:430-441`.

### 1.4 Record mezzo aggiornato separatamente

Oltre al documento archiviato, il flow può creare o aggiornare il record mezzo in `@mezzi_aziendali`:

- nuovo mezzo: `setItemSync("@mezzi_aziendali", nextVehicles)` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2520`;
- update mezzo esistente da libretto: `applyArchivistaLibrettoVehicleUpdate(...)` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2588-2594`.

Questi path persistono campi sul mezzo, non l'oggetto review/analysis dello storico documenti.

### 1.5 Reader storico documenti

Il reader storico globale è `readNextIADocumentiArchiveSnapshot`:

```ts
export async function readNextIADocumentiArchiveSnapshot(
  options: ReadNextDocumentiCostiSnapshotOptions = {},
): Promise<NextIADocumentiArchiveSnapshot> {
  const includeCloneDocuments = options.includeCloneDocuments !== false;
  const { documentSnapshots, cloneDocuments, readFailures } = await readDocumentiCostiSources({
    includeCloneDocuments,
  });
```

Prova: `src/next/domain/nextDocumentiCostiDomain.ts:1925-1931`.

Le sorgenti lette includono le collection documentali Firestore:

```ts
const DOCUMENTI_COLLECTION_KEYS = [
  "@documenti_mezzi",
  "@documenti_magazzino",
  "@documenti_generici",
] as const;
```

Prova: `src/next/domain/nextDocumentiCostiDomain.ts:12-16`.

`readDocumentiCostiSources` legge queste collection con `getDocs(collection(db, collectionKey))`: `src/next/domain/nextDocumentiCostiDomain.ts:1502-1509`.

### 1.6 Shape restituita allo storico `/next/ia/documenti`

La shape pubblica dello storico è:

```ts
export type NextIADocumentiArchiveItem = {
  id: string;
  sourceKey: string;
  sourceDocId: string;
  tipoDocumento: string;
  categoriaArchivio: string | null;
  targa: string | null;
  dataDocumento: string | null;
  sortTimestamp: number | null;
  totaleDocumento: string | number | null;
  fornitore: string | null;
  fileUrl: string | null;
  valuta: NextDocumentiCostiCurrency;
  currency: NextDocumentiCostiCurrency;
  testo: string | null;
  imponibile: string | null;
  ivaImporto: string | null;
  importoPagamento: string | null;
  numeroDocumento: string | null;
  daVerificare: boolean;
};
```

Prova: `src/next/domain/nextDocumentiCostiDomain.ts:1356-1376`.

Il mapper `mapIADocumentiArchiveRecord` restituisce solo i campi sopra: `src/next/domain/nextDocumentiCostiDomain.ts:1413-1448`.

Non espone `analysis`, `extractedFields`, `rawRecord`, né i 28-63 campi completi della review.

### 1.7 Verdetto D1

Verdetto: PARZIALI.

I dati estratti non sono persistiti come oggetto `analysis` completo nello storico documenti. Sono persistiti solo:

- un subset nel documento Firestore `@documenti_mezzi`, tramite `basePayload`;
- un subset differente nel record mezzo `@mezzi_aziendali`, se l'utente conferma creazione/update mezzo.

Il reader `/next/ia/documenti` non rende leggibile l'analysis originale.

## 2. DOMANDA D2 — PERCHÉ ANALIZZA RIMANE DISABILITATO?

### 2.1 Bottone Analizza nella UI libretto

Il componente UI `NextEstrazioneLibretto` riceve una prop `isAnalyzeDisabled`:

```tsx
<button
  type="button"
  className="iai-btn-analizza"
  disabled={isAnalyzeDisabled}
  onClick={onAnalyze}
>
  {analyzeButtonLabel}
</button>
```

Prova: `src/next/internal-ai/NextEstrazioneLibretto.tsx:487-496`.

### 2.2 Condizione disabled passata dal bridge

Il bridge libretto passa:

```tsx
isAnalyzeDisabled={!selectedFile || analysisStatus === "loading"}
```

Prova: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2667`.

Gli stati coinvolti sono:

| Stato | Definizione | Effetto |
|---|---|---|
| `selectedFile` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1694` | se `null`, Analizza disabilitato |
| `analysisStatus` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1718` | se `"loading"`, Analizza disabilitato |

Se `analysisStatus` è `"idle"` e `selectedFile` è un `File`, il bottone Analizza non è disabilitato da questa condizione.

### 2.3 Cosa fa il precarico del Prompt 21

Il precarico legge `preloadDocument.fileUrl`, esegue `fetch`, costruisce un `File`, e poi assegna `selectedFile`:

```tsx
const response = await fetch(fileUrl);
if (!response.ok) {
  throw new Error(`Download documento non riuscito (${response.status}).`);
}

const blob = await response.blob();
...
const selectedFileFromPreload = new File(...);
...
setSelectedFile(selectedFileFromPreload);
setAnalysisStatus("idle");
```

Prove:

- `fetch(fileUrl)`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1812`;
- `new File(...)`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1822-1836`;
- `setSelectedFile(selectedFileFromPreload)`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1838`;
- `setAnalysisStatus("idle")`: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1841`.

Se il fetch fallisce, il catch annulla il file e mostra errore:

```tsx
setSelectedFile(null);
setAnalysisStatus("idle");
setErrorMessage("Riapertura documento fallita. Carica manualmente il file.");
```

Prova: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1877-1880`.

### 2.4 Perché si vede "Documento caricato" anche senza file

`NextEstrazioneLibretto` mostra il testo `Documento caricato` anche nel placeholder senza `previewUrl` e senza `previewText`:

```tsx
<div className="iai-viewer-placeholder">
  <span className="iai-viewer-placeholder-icon">DOC</span>
  <strong className="iai-viewer-placeholder-name">{fileName}</strong>
  <p>Documento caricato</p>
</div>
```

Prova: `src/next/internal-ai/NextEstrazioneLibretto.tsx:581-585`.

Questo testo non dimostra che `selectedFile` sia valorizzato. Il nome file vero è passato come:

```tsx
fileName={selectedFile?.name ?? "Nessun file selezionato"}
```

Prova: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2658`.

### 2.5 Perché i campi mostrano MISSING

I `MISSING:*` non dipendono dal file. Dipendono dal fatto che il modello canonico del libretto è vuoto perché `analysis` non è stata caricata o rieseguita.

`NextEstrazioneLibretto` mostra `MISSING` quando un campo richiesto non è presente in `canonicalLibrettoViewModel`:

```tsx
field.key in requiredCanonicalLabels
  ? canonicalLibrettoViewModel[field.key as keyof typeof canonicalLibrettoViewModel] ||
    `MISSING:${requiredCanonicalLabels[field.key]}`
  : getFieldValue(field.key);
```

Prova: `src/next/internal-ai/NextEstrazioneLibretto.tsx:148-153`.

Il Prompt 21 azzera esplicitamente `analysis` durante il precarico:

```tsx
setAnalysis(null);
```

Prova: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1840`.

L'unico punto che popola `analysis` è `handleAnalyze`, dopo una chiamata backend e normalizzazione:

```tsx
setAnalysis(nextAnalysis);
setAnalysisStatus("success");
```

Prova: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2384-2385`.

### 2.6 Verdetto D2

Verdetto: il bottone Analizza è disabilitato solo se manca `selectedFile` o se `analysisStatus === "loading"`.

Nel caso osservato, se il bottone resta disabilitato e non è in corso loading, la condizione mancante è `selectedFile`: il preload non ha completato il ramo `setSelectedFile(selectedFileFromPreload)`, oppure il preset non aveva `fileUrl`.

I campi `MISSING` sono un problema separato: il precarico file non precarica `analysis`, quindi la review resta vuota finché non si esegue una nuova analisi.

## 3. STRATEGIA FIX CONSIGLIATA (TESTUALE)

La review storica completa non può essere riaperta dai dati correnti perché lo storico non conserva `analysis` completa.

Strategia consigliata:

1. Persistenza futura: durante `handleArchive`, aggiungere al payload archiviato in `@documenti_mezzi` l'oggetto `analysis` normalizzato completo, mantenendo anche i campi flat esistenti per compatibilità.
2. Reader: estendere il reader dello storico o aggiungere un reader by-id che renda disponibile l'oggetto `analysis` salvato per `sourceDocId/sourceKey`.
3. Preset: passare al bridge libretto l'analysis persistita quando esiste.
4. Bridge libretto: se riceve analysis persistita, impostare `setAnalysis(...)`, `setAnalysisStatus("success")`, stato veicolo/targa coerente, e mostrare la review senza richiedere clic su Analizza.
5. Fallback archivi vecchi: per i record senza `analysis`, lasciare il flusso file precaricato + Analizza manuale oppure aggiungere rianalisi automatica esplicita. Il codice attuale non può recuperare i 28-63 campi completi da uno storico che non li contiene.

Numero file minimo stimato per il fix completo futuro: 4.

| File | Motivo |
|---|---|
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` | salvare `analysis` nel payload e precaricarla nello stato review |
| `src/next/domain/nextDocumentiCostiDomain.ts` | esporre `analysis` o aggiungere reader by-id |
| `src/next/NextIADocumentiPage.tsx` | passare nel preset i dati review disponibili |
| `src/next/NextIAArchivistaPage.tsx` | tipizzare e inoltrare analysis/preload al bridge libretto |

## 4. NOTE FINALI (solo fatti)

- Il file precaricato non equivale alla review compilata: il file popola `selectedFile`; la review richiede `analysis`.
- La UI contiene un placeholder "Documento caricato" anche quando `fileName` può essere "Nessun file selezionato".
- Il reader storico attuale espone `fileUrl`, `sourceDocId`, `sourceKey` e metadati, ma non l'oggetto analysis.
- Il record mezzo può contenere campi derivati dal libretto, ma non è una sorgente sufficiente per ricostruire l'intera review Archivista.
