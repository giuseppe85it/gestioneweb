# AUDIT ARCHIVISTA PERSISTENZA LIBRETTO - 2026-04-26

## 0. RIASSUNTO TOP-LINE
- Campi estratti da IA: 63 campi tipizzati in `ArchivistaDocumentoMezzoAnalysis`; 48 campi dichiarati in `IA_LIBRETTO_REQUESTED_FIELDS`.
- Campi modificabili in UI review: 28 campi dati unici nel flusso libretto (27 template + `categoria` nel pannello nuovo mezzo).
- Campi scritti effettivamente nel record (worst case path): 12 chiavi business nel path update libretto esistente, piu `marcaModello` derivato e foto opzionale.
- Campi persi tra review e scrittura: 17 nel path update libretto esistente; 13 non sono scritti da nessuno dei 3 path.
- Path di scrittura analizzati: 3 (handleArchive, applyVehicleUpdate, applyLibrettoVehicleUpdate).

## 1. ESTRAZIONE IA

### 1.1 Punto di ingresso payload IA

Il flusso Archivista libretto monta `ArchivistaDocumentoMezzoBridge` da `src/next/NextIAArchivistaPage.tsx:220-232` quando tipo e contesto sono `documento_mezzo` e sottotipo `libretto`.

Il payload IA entra in `runAnalyzeRequest`:

- endpoint base: `DOCUMENT_ANALYZE_PATH = "/internal-ai-backend/documents/documento-mezzo-analyze"` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:29`.
- fetch per libretto: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2010-2024`.
- variabile payload grezzo: `rawPayload` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2028`.
- normalizzazione libretto: `normalizeLibrettoAnalyzePayload(rawPayload, { fileName: selectedFile.name })` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2064`.
- salvataggio nello state review: `setAnalysis(nextAnalysis)` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2145`.

Il body fetch rilevante e:

```ts
const response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fileName: selectedFile.name,
    contentBase64: requestBase64,
    mimeType: requestMimeType,
    documentSubtypeHint: "libretto",
  }),
});

const rawPayload = (await response.json().catch(() => null)) as unknown;
```

Nota di codice: `IA_LIBRETTO_REQUESTED_FIELDS` e dichiarato in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:31-79`, ma viene solo marcato con `void IA_LIBRETTO_REQUESTED_FIELDS` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:82`; non e passato nel body della fetch.

### 1.2 Lista campi payload

Type completo letto dal codice in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:95-160`:

| Campo type `ArchivistaDocumentoMezzoAnalysis` |
| --- |
| stato |
| tipoDocumento |
| sottotipoDocumento |
| fornitore |
| numeroDocumento |
| dataDocumento |
| targa |
| telaio |
| proprietario |
| assicurazione |
| marca |
| modello |
| dataImmatricolazione |
| dataScadenza |
| dataUltimoCollaudo |
| dataScadenzaRevisione |
| dataScadenzaRevisioneManualOverride |
| ultimoCollaudo |
| prossimoCollaudoRevisione |
| ultimoCollaudoManualOverride |
| categoria |
| genereVeicolo |
| tipoVeicolo |
| colore |
| carrozzeria |
| pesoTotale |
| pesoVuoto |
| pesoTotaleRimorchio |
| caricoSulLetto |
| caricoUtile |
| caricoRimorchiabile |
| pesoRimorchiabile |
| cilindrata |
| potenza |
| cilindrica |
| primaImmatricolazione |
| scadenzaRevisione |
| immatricolazione |
| immatricolato |
| luogoImmatricolazione |
| luogoCollaudo |
| riga38Collaudo |
| revisione |
| intestatario |
| detentoreDenominazione |
| detentoreIndirizzo |
| detentoreComune |
| indirizzo |
| detentoreAfsAvs |
| detentoreStatoOrigine |
| numeroAvs |
| numeroMatricola |
| numeroMatricolaTipo |
| approvazioneTipo |
| numeroApprovazioneTipo |
| annotazioni |
| note |
| testo |
| riassuntoBreve |
| localita |
| luogoRilascio |
| avvisi |
| campiMancanti |

Lista `IA_LIBRETTO_REQUESTED_FIELDS` dichiarata in codice, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:31-79`:

`nAvs`, `numeroAvs`, `proprietario`, `detentoreDenominazione`, `indirizzo`, `detentoreIndirizzo`, `localita`, `detentoreComune`, `targa`, `colore`, `genereVeicolo`, `categoria`, `marca`, `modello`, `marcaTipo`, `telaio`, `vin`, `carrozzeria`, `numeroMatricola`, `numeroMatricolaTipo`, `approvazioneTipo`, `numeroApprovazioneTipo`, `cilindrata`, `potenza`, `pesoVuoto`, `caricoUtile`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `primaImmatricolazione`, `immatricolazione`, `luogoDataRilascio`, `luogoRilascio`, `luogoImmatricolazione`, `luogoCollaudo`, `riga38Collaudo`, `ultimoCollaudo`, `dataUltimoCollaudo`, `prossimoCollaudoRevisione`, `dataScadenzaRevisione`, `statoOrigine`, `detentoreStatoOrigine`, `assicurazione`, `annotazioni`, `note`, `testo`.

Normalizzazione del payload:
- `normalizeLibrettoAnalyzePayload` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:840-1022`.
- `extractLibrettoRawRecord` accetta `payload.data.analysis`, `payload.data` oppure payload root in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:680-694`.
- la normalizzazione conserva i campi grezzi con spread `...Object.fromEntries(Object.entries(enrichedRawData)...)` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:889-895`.

### 1.3 Conteggio

- Campi tipizzati in `ArchivistaDocumentoMezzoAnalysis`: 63.
- Campi in `IA_LIBRETTO_REQUESTED_FIELDS`: 48.
- Campi ulteriori possibili dal backend: non determinato, perche `normalizeLibrettoAnalyzePayload` copia anche `enrichedRawData` grezzo.

## 2. UI REVIEW (NextEstrazioneLibretto)

### 2.1 Tabella input UI

Il componente UI e `src/next/internal-ai/NextEstrazioneLibretto.tsx`; viene importato da `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:17` e da `src/next/NextInternalAiPage.tsx:189`.

I campi template sono dichiarati in `TARGET_FIELDS` in `src/next/internal-ai/NextEstrazioneLibretto.tsx:233-274`.

| Etichetta UI | Campo state | Tipo input | file:riga |
| --- | --- | --- | --- |
| N. AVS | nAvs | input text mono | `NextEstrazioneLibretto.tsx:234`, render `:704` |
| Proprietario | proprietario | input text | `NextEstrazioneLibretto.tsx:235`, render `:714` |
| Indirizzo | indirizzo | input text | `NextEstrazioneLibretto.tsx:236`, render `:723` |
| Localita | localita | input text | `NextEstrazioneLibretto.tsx:237`, render `:725` |
| Stato d'origine | statoOrigine | input text | `NextEstrazioneLibretto.tsx:238`, render `:735` |
| Assicurazione | assicurazione | input text | `NextEstrazioneLibretto.tsx:239`, render `:739` |
| Annotazioni | annotazioni | textarea | `NextEstrazioneLibretto.tsx:240`, render `:753` |
| Targa | targa | input plate | `NextEstrazioneLibretto.tsx:241`, render `:767` |
| Colore | colore | input text | `NextEstrazioneLibretto.tsx:242`, render `:772` e `:802` |
| Genere veicolo | genereVeicolo | input text | `NextEstrazioneLibretto.tsx:243`, render `:778` |
| Marca e tipo | marcaTipo | input text | `NextEstrazioneLibretto.tsx:244`, render `:785` |
| Telaio | telaio | input text mono | `NextEstrazioneLibretto.tsx:245`, render `:792` |
| Carrozzeria | carrozzeria | input text | `NextEstrazioneLibretto.tsx:246`, render `:799` |
| Numero matricola | numeroMatricola | input text mono | `NextEstrazioneLibretto.tsx:247`, render `:809` |
| Approvazione tipo | approvazioneTipo | input text mono | `NextEstrazioneLibretto.tsx:248-250`, render `:813` |
| Cilindrata | cilindrata | input text mono | `NextEstrazioneLibretto.tsx:251`, render `:817` |
| Potenza | potenza | input text mono | `NextEstrazioneLibretto.tsx:252`, render `:821` |
| Peso a vuoto | pesoVuoto | input text mono | `NextEstrazioneLibretto.tsx:253`, render `:827` |
| Carico utile / sella | caricoUtileSella | input text mono | `NextEstrazioneLibretto.tsx:254-256`, render `:831` |
| Peso totale | pesoTotale | input text mono | `NextEstrazioneLibretto.tsx:257`, render `:835` |
| Peso totale rimorchio | pesoTotaleRimorchio | input text mono | `NextEstrazioneLibretto.tsx:258-260`, render `:839` |
| Carico sul letto | caricoSulLetto | input text mono | `NextEstrazioneLibretto.tsx:261`, render `:843` |
| Peso rimorchiabile | pesoRimorchiabile | input text mono | `NextEstrazioneLibretto.tsx:262-264`, render `:847` |
| Prima immatricolazione | primaImmatricolazione | input text date-style | `NextEstrazioneLibretto.tsx:265-267`, render `:857` |
| Luogo / data rilascio | luogoDataRilascio | input text | `NextEstrazioneLibretto.tsx:268`, render `:863` |
| Ultimo collaudo | ultimoCollaudo | input text date-style | `NextEstrazioneLibretto.tsx:269`, render `:873` |
| Prossimo collaudo / revisione | prossimoCollaudoRevisione | input text date-style | `NextEstrazioneLibretto.tsx:270-273`, render `:883` |
| Categoria | categoria | select | `NextEstrazioneLibretto.tsx:957-971` |

Controlli UI presenti ma non contati come campi libretto: upload file (`NextEstrazioneLibretto.tsx:470-475`), checkbox ottimizzazione immagine (`:501-504`), select mezzo esistente (`:921-936`), checkbox aggiorna/salva mezzo (`:939-942`, `:1008-1011`), input foto mezzo opzionale (`:1035-1040`).

### 2.2 Type state principale

`NextEstrazioneLibretto` non possiede uno state dati interno per il libretto: riceve `getFieldValue` e `onFieldChange` via props in `src/next/internal-ai/NextEstrazioneLibretto.tsx:94-110`.

Lo state principale vive nel bridge:
- `const [analysis, setAnalysis] = useState<ArchivistaDocumentoMezzoAnalysis | null>(null)` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1578`.
- `effectiveLibrettoAnalysis = buildEffectiveLibrettoAnalysis(analysis)` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1748-1752`.
- `getLibrettoFieldValue` legge da `effectiveLibrettoAnalysis` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1752-1753`.

Il type dello state e `ArchivistaDocumentoMezzoAnalysis`, riportato nella sezione 1.2.

### 2.3 Conteggio

- Campi dati unici modificabili nel template/review libretto: 28.
- Campi canonical obbligati nella prop `canonicalLibrettoViewModel`: 10, definiti in `src/next/internal-ai/NextEstrazioneLibretto.tsx:82-92`.

## 3. TRASFORMAZIONE PRE-SCRITTURA

### 3.1 Funzione di trasformazione (body)

Trasformazioni principali:

1. Payload grezzo IA -> `ArchivistaDocumentoMezzoAnalysis`: `normalizeLibrettoAnalyzePayload`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:840-1022`.

2. State review -> canonical view model: `buildCanonicalLibrettoViewModel`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1035-1056`.

```ts
return {
  nAvs: readTemplateField("nAvs"),
  indirizzo: readTemplateField("indirizzo"),
  localita: readTemplateField("localita"),
  annotazioni: readTemplateField("annotazioni"),
  carrozzeria: readTemplateField("carrozzeria"),
  numeroMatricola: readTemplateField("numeroMatricola"),
  caricoUtileSella: readTemplateField("caricoUtileSella"),
  luogoDataRilascio:
    readField("luogoRilascio") ||
    readField("luogoImmatricolazione") ||
    readField("luogoCollaudo") ||
    readTemplateField("luogoDataRilascio"),
  ultimoCollaudo: readTemplateField("ultimoCollaudo"),
  prossimoCollaudoRevisione: readTemplateField("prossimoCollaudoRevisione"),
};
```

3. Canonical view model -> analysis effettiva: `buildEffectiveLibrettoAnalysis`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1059-1104`.

Il body rilevante mappa i campi canonical in alias analysis:

```ts
return normalizeArchivistaLibrettoAnalysisState({
  ...analysis,
  detentoreAfsAvs: canonicalViewModel.nAvs || normalizeText(analysis.detentoreAfsAvs),
  numeroAvs: canonicalViewModel.nAvs || normalizeText(analysis.numeroAvs),
  detentoreIndirizzo:
    canonicalViewModel.indirizzo || normalizeText(analysis.detentoreIndirizzo),
  indirizzo: canonicalViewModel.indirizzo || normalizeText((analysis as Record<string, unknown>).indirizzo),
  detentoreComune: canonicalViewModel.localita || normalizeText(analysis.detentoreComune),
  localita: canonicalViewModel.localita || normalizeText((analysis as Record<string, unknown>).localita),
  carrozzeria: canonicalViewModel.carrozzeria || normalizeText(analysis.carrozzeria),
  numeroMatricola:
    canonicalViewModel.numeroMatricola || normalizeText(analysis.numeroMatricola),
  numeroMatricolaTipo:
    canonicalViewModel.numeroMatricola || normalizeText(analysis.numeroMatricolaTipo),
  caricoUtile: canonicalViewModel.caricoUtileSella || normalizeText(analysis.caricoUtile),
  luogoRilascio:
    canonicalViewModel.luogoDataRilascio || normalizeText(analysis.luogoRilascio),
  luogoImmatricolazione:
    canonicalViewModel.luogoDataRilascio || normalizeText(analysis.luogoImmatricolazione),
  luogoCollaudo:
    canonicalViewModel.luogoDataRilascio || normalizeText(analysis.luogoCollaudo),
  dataUltimoCollaudo:
    canonicalViewModel.ultimoCollaudo || normalizeText(analysis.dataUltimoCollaudo),
  ultimoCollaudo: canonicalViewModel.ultimoCollaudo || normalizeText(analysis.ultimoCollaudo),
  dataScadenzaRevisione:
    canonicalViewModel.prossimoCollaudoRevisione ||
    normalizeText(analysis.dataScadenzaRevisione),
  scadenzaRevisione:
    canonicalViewModel.prossimoCollaudoRevisione ||
    normalizeText((analysis as Record<string, unknown>).scadenzaRevisione),
  dataScadenza:
    canonicalViewModel.prossimoCollaudoRevisione || normalizeText(analysis.dataScadenza),
  annotazioni: canonicalViewModel.annotazioni || normalizeText(analysis.annotazioni),
  note: canonicalViewModel.annotazioni || normalizeText(analysis.note),
  testo: canonicalViewModel.annotazioni || normalizeText(analysis.testo),
});
```

4. Field edit UI -> patch analysis: `onFieldChange` passato a `NextEstrazioneLibretto`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2464-2524`.

La funzione helper di mapping template e `applyLibrettoTemplateFieldChange` in `src/next/internal-ai/utils/librettoFieldMapper.ts:91-183`.

### 3.2 Tabella input/output

| Campo state input | Mappato in output? | Nome campo output | file:riga |
| --- | --- | --- | --- |
| nAvs | SI | detentoreAfsAvs, numeroAvs | `librettoFieldMapper.ts:122-124`, `ArchivistaDocumentoMezzoBridge.tsx:1068-1069` |
| proprietario | SI | proprietario, intestatario, detentoreDenominazione | `librettoFieldMapper.ts:125-129` |
| indirizzo | SI | detentoreIndirizzo, indirizzo | `librettoFieldMapper.ts:130-133` |
| localita | SI | detentoreComune, comune, localita | `librettoFieldMapper.ts:134-138` |
| statoOrigine | SI | detentoreStatoOrigine | `librettoFieldMapper.ts:139-141` |
| annotazioni | SI | note, testo, annotazioni | `librettoFieldMapper.ts:176-180`, `ArchivistaDocumentoMezzoBridge.tsx:1100-1102` |
| marcaTipo | SI parziale | modello, oppure marca+modello gia presenti | `librettoFieldMapper.ts:111-120` |
| numeroMatricola | SI | numeroMatricolaTipo, numeroMatricola | `librettoFieldMapper.ts:142-145` |
| approvazioneTipo | SI | approvazioneTipo, numeroApprovazioneTipo | `librettoFieldMapper.ts:150-153` |
| caricoUtileSella | SI | caricoUtile, caricoUtileSella | `librettoFieldMapper.ts:154-157` |
| pesoVuoto | SI | pesoVuoto, tara | `librettoFieldMapper.ts:158-161` |
| pesoTotaleRimorchio | SI | pesoTotaleRimorchio, pesoConvoglio | `librettoFieldMapper.ts:162-165` |
| caricoSulLetto | SI | caricoSulLetto, caricoTetto | `librettoFieldMapper.ts:166-169` |
| pesoRimorchiabile | SI | pesoRimorchiabile, caricoRimorchiabile | `librettoFieldMapper.ts:170-173` |
| luogoDataRilascio | SI | luogoImmatricolazione, immatricolato | `librettoFieldMapper.ts:174-175` |
| ultimoCollaudo | SI | dataUltimoCollaudo | `librettoFieldMapper.ts:176-178` |
| prossimoCollaudoRevisione | SI | dataScadenzaRevisione | `librettoFieldMapper.ts:179-181` |
| targa, colore, genereVeicolo, telaio, cilindrata, potenza, pesoTotale, categoria, assicurazione | SI | stesso campo | `librettoFieldMapper.ts:182-183` |

### 3.3 Campi non mappati

Nel passaggio UI -> analysis non risultano campi del template libretto completamente non mappati: il default di `applyLibrettoTemplateFieldChange` invia `onFieldChange(key, value)` in `src/next/internal-ai/utils/librettoFieldMapper.ts:182-183`.

La perdita non avviene nella trasformazione UI -> analysis. La perdita avviene nelle whitelist di scrittura:
- `buildArchivistaNewVehicleRecord` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1351-1414`.
- `buildVehicleFieldUpdates` in `src/next/internal-ai/ArchivistaArchiveClient.ts:614-670`.
- `buildArchivistaLibrettoVehicleUpdateFields` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1417-1489`.

## 4. TRE PATH DI SCRITTURA

### 4.1 handleArchive (creazione)

Path:
- handler: `handleArchive`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2216-2401`.
- creazione record: `buildArchivistaNewVehicleRecord`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1351-1414`.
- primo write nuovo mezzo: `setItemSync("@mezzi_aziendali", nextVehicles)` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2285`.
- refresh post archiviazione con URL libretto: `setItemSync("@mezzi_aziendali", updatedVehicles)` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2343`.

Body logica scrittura rilevante:

```ts
const newVehicleRecord =
  mezzoMode === "nuovo"
    ? buildArchivistaNewVehicleRecord({
        analysis,
        vehicleId: createdVehicleId ?? undefined,
        photoUrl: finalFotoUrl ?? null,
        photoPath: finalFotoPath ?? null,
      })
    : null;

if (newVehicleRecord) {
  const nextVehicles = [newVehicleRecord, ...previousVehicles];
  await setItemSync("@mezzi_aziendali", nextVehicles);
  setRawVehicles(nextVehicles);
  setVehicles(toVehicleOptions(nextVehicles));
  setSelectedVehicleId(String(newVehicleRecord.id ?? ""));
}
```

Campi scritti nel nuovo record da `buildArchivistaNewVehicleRecord`:

`id`, `tipo`, `categoria`, `targa`, `marca`, `modello`, `telaio`, `colore`, `cilindrata`, `potenza`, `massaComplessiva`, `proprietario`, `assicurazione`, `dataImmatricolazione`, `dataScadenzaRevisione`, `dataUltimoCollaudo`, `manutenzioneProgrammata`, `manutenzioneDataInizio`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto`, `note`, `autistaId`, `autistaNome`, `marcaModello`, `anno`, `genereVeicolo`, `primaImmatricolazione`, `librettoUrl`, `librettoStoragePath`, `fotoUrl`, `fotoPath`.

Campi libretto UI non scritti in creazione: `nAvs`, `numeroAvs`, `indirizzo`, `detentoreIndirizzo`, `localita`, `detentoreComune`, `statoOrigine`, `detentoreStatoOrigine`, `carrozzeria`, `numeroMatricola`, `numeroMatricolaTipo`, `approvazioneTipo`, `numeroApprovazioneTipo`, `pesoVuoto`, `caricoUtile`, `caricoUtileSella`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `luogoDataRilascio`, `luogoRilascio`, `luogoImmatricolazione`, `luogoCollaudo`, `riga38Collaudo`.

### 4.2 applyArchivistaVehicleUpdate (update da documento)

Path:
- funzione: `applyArchivistaVehicleUpdate`, `src/next/internal-ai/ArchivistaArchiveClient.ts:683-719`.
- builder candidati: `buildVehicleFieldUpdates`, `src/next/internal-ai/ArchivistaArchiveClient.ts:614-670`.
- write: `setItemSync("@mezzi_aziendali", next)` in `src/next/internal-ai/ArchivistaArchiveClient.ts:710`.

Body logica scrittura:

```ts
const current = { ...mezzi[index] };
const appliedFields = buildVehicleFieldUpdates(args.subtype, current, args.analysis);
if (!appliedFields.length) {
  return { updatedVehicleId: args.mezzoId, appliedFields: [] };
}

appliedFields.forEach((field) => {
  current[field.key] = field.nextValue;
});

if (normalizeText(current.marca) || normalizeText(current.modello)) {
  current.marcaModello = [normalizeText(current.marca), normalizeText(current.modello)]
    .filter(Boolean)
    .join(" ");
}

const next = [...mezzi];
next[index] = current;
await setItemSync("@mezzi_aziendali", next);
```

Campi comuni scrivibili da `buildVehicleFieldUpdates`: `targa`, `marca`, `modello`, `telaio`, `proprietario`, `dataImmatricolazione`.

Campi extra per subtype:
- `assicurazione` se subtype `assicurazione`.
- `dataUltimoCollaudo`, `dataScadenzaRevisione` se subtype `revisione` o `collaudo`.

Questo path non e usato per `selectedSubtype === "libretto"`: in `handleArchive`, per libretto viene chiamato `applyArchivistaLibrettoVehicleUpdate` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2350-2357`.

### 4.3 applyArchivistaLibrettoVehicleUpdate (update da libretto)

Path:
- builder candidati: `buildArchivistaLibrettoVehicleUpdateFields`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1417-1489`.
- funzione update: `applyArchivistaLibrettoVehicleUpdate`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1493-1535`.
- write: `setItemSync("@mezzi_aziendali", next)` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1533`.

Body logica candidati:

```ts
const candidates = [
  { key: "targa", label: "Targa", nextValue: normalizedAnalysis.targa },
  { key: "marca", label: "Marca", nextValue: normalizedAnalysis.marca },
  { key: "modello", label: "Modello", nextValue: normalizedAnalysis.modello },
  { key: "telaio", label: "Telaio", nextValue: normalizedAnalysis.telaio },
  { key: "proprietario", label: "Proprietario", nextValue: normalizedAnalysis.proprietario },
  { key: "assicurazione", label: "Assicurazione", nextValue: normalizedAnalysis.assicurazione },
  { key: "dataImmatricolazione", label: "Data immatricolazione", nextValue: normalizedAnalysis.dataImmatricolazione },
  { key: "dataUltimoCollaudo", label: "Data ultimo collaudo", nextValue: normalizedAnalysis.dataUltimoCollaudo },
  { key: "dataScadenzaRevisione", label: "Scadenza revisione", nextValue: normalizedAnalysis.dataScadenzaRevisione },
  { key: "colore", label: "Colore", nextValue: normalizedAnalysis.colore },
  { key: "categoria", label: "Categoria", nextValue: normalizedAnalysis.categoria },
  { key: "genereVeicolo", label: "Genere veicolo", nextValue: normalizedAnalysis.genereVeicolo },
];
```

Body logica scrittura:

```ts
appliedFields.forEach((field) => {
  current[field.key] = normalizeText((args.analysis as Record<string, unknown>)[field.key]) || field.nextValue;
});

if (args.photoUrl) {
  current.fotoUrl = args.photoUrl;
  current.fotoPath = args.photoPath ?? null;
  appliedFields.push({
    key: "fotoUrl",
    label: "Foto mezzo",
    nextValue: args.photoUrl,
  });
}

if (normalizeText(current.marca) || normalizeText(current.modello)) {
  current.marcaModello = [normalizeText(current.marca), normalizeText(current.modello)]
    .filter(Boolean)
    .join(" ");
}

const next = [...mezzi];
next[index] = current;
await setItemSync("@mezzi_aziendali", next);
```

Campi scritti nel patch: `targa`, `marca`, `modello`, `telaio`, `proprietario`, `assicurazione`, `dataImmatricolazione`, `dataUltimoCollaudo`, `dataScadenzaRevisione`, `colore`, `categoria`, `genereVeicolo`. In piu: `marcaModello` derivato se marca/modello presenti; `fotoUrl` e `fotoPath` solo se `args.photoUrl` e valorizzato.

## 5. DIFF END-TO-END

### 5.1 Tabella maestra confronto

Legenda: `SI_ALIAS` significa che il dato entra/esce tramite alias o campo derivato; `NO_PATH_LIBRETTO` significa non scritto nel path `applyArchivistaLibrettoVehicleUpdate`.

| Nome campo | Estratto IA (1) | Mostrato in review (2) | Esce da trasformazione (3) | Scritto in handleArchive (4.1) | Scritto in applyVehicleUpdate (4.2) | Scritto in applyLibrettoVehicleUpdate (4.3) |
| --- | --- | --- | --- | --- | --- | --- |
| nAvs | SI | SI | SI_ALIAS detentoreAfsAvs/numeroAvs | NO | NO | NO |
| numeroAvs | SI | SI_ALIAS nAvs | SI | NO | NO | NO |
| proprietario | SI | SI | SI | SI | SI | SI |
| detentoreDenominazione | SI | SI_ALIAS proprietario | SI | SI_ALIAS proprietario | NO | SI_ALIAS proprietario |
| indirizzo | SI | SI | SI | NO | NO | NO |
| detentoreIndirizzo | SI | SI_ALIAS indirizzo | SI | NO | NO | NO |
| localita | SI | SI | SI | NO | NO | NO |
| detentoreComune | SI | SI_ALIAS localita | SI | NO | NO | NO |
| targa | SI | SI | SI | SI | SI | SI |
| colore | SI | SI | SI | SI | NO | SI |
| genereVeicolo | SI | SI | SI | SI | NO | SI |
| categoria | SI | SI | SI | SI | NO | SI |
| marca | SI | SI_ALIAS marcaTipo | SI | SI | SI | SI |
| modello | SI | SI_ALIAS marcaTipo | SI | SI | SI | SI |
| marcaTipo | SI | SI | SI_ALIAS marca/modello | SI_ALIAS marca/modello | SI_ALIAS marca/modello | SI_ALIAS marca/modello |
| telaio | SI | SI | SI | SI | SI | SI |
| vin | SI | SI_ALIAS telaio | SI_ALIAS telaio | SI_ALIAS telaio | SI_ALIAS telaio | SI_ALIAS telaio |
| carrozzeria | SI | SI | SI | NO | NO | NO |
| numeroMatricola | SI | SI | SI | NO | NO | NO |
| numeroMatricolaTipo | SI | SI_ALIAS numeroMatricola | SI | NO | NO | NO |
| approvazioneTipo | SI | SI | SI | NO | NO | NO |
| numeroApprovazioneTipo | SI | SI_ALIAS approvazioneTipo | SI | NO | NO | NO |
| cilindrata | SI | SI | SI | SI | NO | NO_PATH_LIBRETTO |
| potenza | SI | SI | SI | SI | NO | NO_PATH_LIBRETTO |
| pesoVuoto | SI | SI | SI | NO | NO | NO |
| caricoUtile | SI | SI_ALIAS caricoUtileSella | SI | NO | NO | NO |
| caricoUtileSella | SI | SI | SI | NO | NO | NO |
| pesoTotale | SI | SI | SI | SI_ALIAS massaComplessiva | NO | NO_PATH_LIBRETTO |
| pesoTotaleRimorchio | SI | SI | SI | NO | NO | NO |
| caricoSulLetto | SI | SI | SI | NO | NO | NO |
| pesoRimorchiabile | SI | SI | SI | NO | NO | NO |
| primaImmatricolazione | SI | SI | SI | SI | SI_ALIAS dataImmatricolazione | SI_ALIAS dataImmatricolazione |
| immatricolazione | SI | SI_ALIAS primaImmatricolazione | SI | SI_ALIAS dataImmatricolazione | SI_ALIAS dataImmatricolazione | SI_ALIAS dataImmatricolazione |
| luogoDataRilascio | SI | SI | SI | NO | NO | NO |
| luogoRilascio | SI | SI_ALIAS luogoDataRilascio | SI | NO | NO | NO |
| luogoImmatricolazione | SI | SI_ALIAS luogoDataRilascio | SI | NO | NO | NO |
| luogoCollaudo | SI | SI_ALIAS luogoDataRilascio | SI | NO | NO | NO |
| riga38Collaudo | SI | SI_ALIAS luogoDataRilascio | SI | NO | NO | NO |
| ultimoCollaudo | SI | SI | SI_ALIAS dataUltimoCollaudo | SI_ALIAS dataUltimoCollaudo | SI per revisione/collaudo | SI_ALIAS dataUltimoCollaudo |
| dataUltimoCollaudo | SI | SI_ALIAS ultimoCollaudo | SI | SI | SI per revisione/collaudo | SI |
| prossimoCollaudoRevisione | SI | SI | SI_ALIAS dataScadenzaRevisione | SI_ALIAS dataScadenzaRevisione | SI per revisione/collaudo | SI_ALIAS dataScadenzaRevisione |
| dataScadenzaRevisione | SI | SI_ALIAS prossimoCollaudoRevisione | SI | SI | SI per revisione/collaudo | SI |
| statoOrigine | SI | SI | SI_ALIAS detentoreStatoOrigine | NO | NO | NO |
| detentoreStatoOrigine | SI | SI_ALIAS statoOrigine | SI | NO | NO | NO |
| assicurazione | SI | SI | SI | SI | SI per assicurazione | SI |
| annotazioni | SI | SI | SI_ALIAS note/testo/annotazioni | SI_ALIAS note | NO | NO_PATH_LIBRETTO |
| note | SI | SI_ALIAS annotazioni | SI | SI | NO | NO_PATH_LIBRETTO |
| testo | SI | SI_ALIAS annotazioni | SI | NO | NO | NO |

### 5.2 Sintesi conteggi

| Path | Conteggio campi scritti | Note |
| --- | ---: | --- |
| handleArchive creazione nuovo mezzo | 32 chiavi record | include campi non estratti come manutenzione/autista/foto/librettoUrl |
| applyArchivistaVehicleUpdate | 6 comuni, +1 assicurazione, +2 revisione/collaudo | path non-libretto |
| applyArchivistaLibrettoVehicleUpdate | 12 campi business, + `marcaModello`, + foto opzionale | path libretto esistente |

### 5.3 Gap primario (campi persi)

Gap del path libretto esistente (`applyArchivistaLibrettoVehicleUpdate`): campi mostrati in review ma non scritti nel record mezzo quando si aggiorna un mezzo gia esistente:

`nAvs`, `indirizzo`, `localita`, `statoOrigine`, `annotazioni`, `carrozzeria`, `numeroMatricola`, `approvazioneTipo`, `cilindrata`, `potenza`, `pesoVuoto`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `luogoDataRilascio`.

Gap assoluto: campi presenti/mostrati che non sono scritti da nessuno dei tre path con lo stesso dato semantico:

`nAvs`, `indirizzo`, `localita`, `statoOrigine`, `carrozzeria`, `numeroMatricola`, `approvazioneTipo`, `pesoVuoto`, `caricoUtileSella`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `luogoDataRilascio`.

## 6. VERIFICA INCROCIATA TI282780

### 6.1 Tabella per i 30 campi noti

| Campo TI282780 | Coerente con chain Archivista? | Path compatibile | Nota statica |
| --- | --- | --- | --- |
| anno | SI | handleArchive creazione | derivato da `dataImmatricolazione` in `buildArchivistaNewVehicleRecord`, `ArchivistaDocumentoMezzoBridge.tsx:1405` |
| assicurazione | SI | create / applyLibretto / applyVehicleUpdate assicurazione | campo scritto nei tre pattern, con condizioni path |
| autistaId | SI come default | handleArchive creazione | default `null`; valore reale Sandro non deriva dal libretto |
| autistaNome | SI come default | handleArchive creazione | default `null`; valore reale non deriva dal libretto |
| categoria | SI | create / applyLibretto | mappa da categoria/genere/tipo veicolo |
| cilindrata | SI solo create | handleArchive creazione | non scritto da applyLibretto su mezzo esistente |
| colore | SI | create / applyLibretto | scritto |
| dataImmatricolazione | SI | create / applyLibretto | scritto |
| dataScadenzaRevisione | SI | create / applyLibretto | scritto |
| dataUltimoCollaudo | SI | create / applyLibretto | scritto |
| fotoPath | SI opzionale | handleArchive / applyLibretto se fotoUrl | non e campo IA libretto |
| fotoUrl | SI opzionale | handleArchive / applyLibretto se fotoUrl | non e campo IA libretto |
| genereVeicolo | SI | create / applyLibretto | scritto |
| id | SI | handleArchive creazione | generato localmente |
| librettoStoragePath | SI solo nuovo mezzo refresh | handleArchive creazione post archive | non aggiornato da applyLibretto su mezzo esistente |
| librettoUrl | SI solo nuovo mezzo refresh | handleArchive creazione post archive | non aggiornato da applyLibretto su mezzo esistente |
| manutenzioneContratto | SI come default | handleArchive creazione | default vuoto, non IA |
| manutenzioneDataFine | SI come default | handleArchive creazione | default vuoto, non IA |
| manutenzioneDataInizio | SI come default | handleArchive creazione | default vuoto, non IA |
| manutenzioneKmMax | SI come default | handleArchive creazione | default vuoto, non IA |
| manutenzioneProgrammata | SI come default | handleArchive creazione | default false, non IA |
| marca | SI | create / applyLibretto / applyVehicleUpdate | scritto |
| marcaModello | SI | create / applyLibretto / applyVehicleUpdate | derivato da marca/modello |
| massaComplessiva | SI solo create | handleArchive creazione | deriva da `pesoTotale`; non scritto da applyLibretto su mezzo esistente |
| modello | SI | create / applyLibretto / applyVehicleUpdate | scritto |
| note | SI solo create | handleArchive creazione | deriva da `note`; annotazioni non scritte da applyLibretto |
| potenza | SI solo create | handleArchive creazione | non scritto da applyLibretto su mezzo esistente |
| primaImmatricolazione | SI solo create | handleArchive creazione | non scritto come campo da applyLibretto su mezzo esistente |
| proprietario | SI | create / applyLibretto / applyVehicleUpdate | scritto |
| targa | SI | create / applyLibretto / applyVehicleUpdate | scritto |
| telaio | SI | create / applyLibretto / applyVehicleUpdate | scritto |
| tipo | SI | handleArchive creazione | deriva da categoria o default |

## 7. DOMANDE OPERATIVE PER SPEC FUTURA

### 7.1 Path da modificare

Per espandere la persistenza dei campi libretto mancanti nel flusso libretto servono 2 path:

1. `handleArchive` / `buildArchivistaNewVehicleRecord` per creazione nuovo mezzo: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1351-1414`.
2. `applyArchivistaLibrettoVehicleUpdate` / `buildArchivistaLibrettoVehicleUpdateFields` per update mezzo esistente da libretto: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1417-1535`.

Il terzo path `applyArchivistaVehicleUpdate` e da documento non-libretto; va incluso solo se la futura SPEC decide di estendere anche assicurazione/revisione/collaudo ai campi extra del libretto. Il codice attuale usa questo path in `handleArchive` solo quando `selectedSubtype !== "libretto"`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2350-2359`.

### 7.2 Type esistenti

Type esistenti:
- `ArchivistaDocumentoMezzoAnalysis`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:95-160`.
- `ArchivistaVehicle = Record<string, unknown> & {...}`, `src/next/internal-ai/ArchivistaArchiveClient.ts:104-116`.
- `ArchivistaVehicleUpdateField`, `src/next/internal-ai/ArchivistaArchiveClient.ts:118-123`.
- `ArchivistaVehicleUpdateArgs`, `src/next/internal-ai/ArchivistaArchiveClient.ts:125-129`.

Non esiste un type unificato specifico per "tutti i campi libretto persistibili nel record mezzo"; il type piu vicino e `ArchivistaDocumentoMezzoAnalysis`.

### 7.3 Centralizzazione logica

La logica non e centralizzata:
- parsing/normalizzazione IA: `normalizeLibrettoAnalyzePayload`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:840-1022`;
- UI/canonical mapping: `buildCanonicalLibrettoViewModel` e `buildEffectiveLibrettoAnalysis`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1035-1104`;
- create nuovo mezzo: `buildArchivistaNewVehicleRecord`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1351-1414`;
- update libretto esistente: `buildArchivistaLibrettoVehicleUpdateFields`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1417-1489`;
- update documento non-libretto: `buildVehicleFieldUpdates`, `src/next/internal-ai/ArchivistaArchiveClient.ts:614-670`.

### 7.4 Validazioni filtranti

Validazioni/filtri che riducono i campi scritti:

- `buildArchivistaLibrettoVehicleUpdateFields` crea una lista chiusa di 12 candidati in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1456-1483`.
- Lo stesso builder scarta candidati senza valore con `if (!nextValue) return false` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1484-1487`.
- Lo stesso builder scarta candidati identici al valore corrente con `return currentValue !== nextValue` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1487-1489`.
- `buildVehicleFieldUpdates` crea una lista chiusa di campi comuni e subtype-specific in `src/next/internal-ai/ArchivistaArchiveClient.ts:621-656`.
- `buildVehicleFieldUpdates` scarta campi vuoti e invariati in `src/next/internal-ai/ArchivistaArchiveClient.ts:661-670`.
- Il confirm libretto richiede solo file, duplicati, targa/categoria per nuovo mezzo o mezzo selezionato per esistente; non valida la presenza dei campi extra libretto in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1785-1844`.

## 8. NOTE FINALI (solo fatti)

- `NextEstrazioneLibretto` mostra una copia editabile del libretto svizzero e dichiara "Tutti i campi sono editabili" in `src/next/internal-ai/NextEstrazioneLibretto.tsx:896-899`.
- La perdita dei campi extra non avviene nella UI: `applyLibrettoTemplateFieldChange` propaga ogni campo, con default `onFieldChange(key, value)` in `src/next/internal-ai/utils/librettoFieldMapper.ts:182-183`.
- La perdita avviene nelle whitelist di scrittura del record mezzo.
- Per TI282780, i campi presenti nel record noto sono compatibili con path create o altri flussi, ma i campi extra del libretto non inclusi nelle whitelist non sono dimostrabilmente persistiti da `applyArchivistaLibrettoVehicleUpdate`.
