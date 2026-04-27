# AUDIT CAMPI LIBRETTO MANCANTI MODAL MEZZO — 2026-04-26

## 0. RIASSUNTO TOP-LINE
- Targa di test: TI282780
- Chiavi cercate dal modal: 17
- Chiavi scritte dai flussi IA: 32 chiavi uniche su `@mezzi_aziendali`; 1 sola coincide con i campi libretto read-only del modal
- Divergenze nomi: 1 divergenza diretta rilevata nel record mezzo (`pesoTotale` estratto -> `massaComplessiva` scritto)
- Ipotesi causa primaria: C

## 1. CHIAVI CERCATE DAL MODAL

Il modal legge il record raw del mezzo da `@mezzi_aziendali`, costruisce `rawLibrettoFields` e mostra i campi solo se il valore normalizzato è non vuoto.

| Chiave logica modal | Alias cercati nel record raw | Lettura | Rendering UI |
|---|---|---|---|
| `numeroAvs` | `numeroAvs`, `nAvs`, `detentoreAfsAvs` | `src/next/components/NextMezzoEditModal.tsx:54`, `:131-146`, `:262` | `N. AVS`, `src/next/components/NextMezzoEditModal.tsx:419-423` |
| `statoOrigine` | `statoOrigine`, `detentoreStatoOrigine` | `src/next/components/NextMezzoEditModal.tsx:55`, `:131-146`, `:262` | `Stato d'origine`, `src/next/components/NextMezzoEditModal.tsx:464-467` |
| `indirizzo` | `indirizzo` | `src/next/components/NextMezzoEditModal.tsx:56`, `:131-146`, `:262` | `Indirizzo`, `src/next/components/NextMezzoEditModal.tsx:446-447` |
| `localita` | `localita` | `src/next/components/NextMezzoEditModal.tsx:57`, `:131-146`, `:262` | `Località`, `src/next/components/NextMezzoEditModal.tsx:451-452` |
| `genereVeicolo` | `genereVeicolo`, `tipoVeicolo` | `src/next/components/NextMezzoEditModal.tsx:58`, `:131-146`, `:262` | `Genere veicolo`, `src/next/components/NextMezzoEditModal.tsx:640-647` |
| `carrozzeria` | `carrozzeria`, `tipoCarrozzeria` | `src/next/components/NextMezzoEditModal.tsx:59`, `:131-146`, `:262` | `Carrozzeria`, `src/next/components/NextMezzoEditModal.tsx:688-692` |
| `numeroMatricola` | `numeroMatricola`, `numeroMatricolaTipo`, `matricolaTipo` | `src/next/components/NextMezzoEditModal.tsx:60`, `:131-146`, `:262` | `Numero matricola`, `src/next/components/NextMezzoEditModal.tsx:712-716` |
| `approvazioneTipo` | `approvazioneTipo`, `numeroApprovazioneTipo` | `src/next/components/NextMezzoEditModal.tsx:61`, `:131-146`, `:262` | `Approvazione tipo`, `src/next/components/NextMezzoEditModal.tsx:721-724` |
| `pesoVuoto` | `pesoVuoto`, `tara` | `src/next/components/NextMezzoEditModal.tsx:62`, `:131-146`, `:262` | `Peso a vuoto`, `src/next/components/NextMezzoEditModal.tsx:748-749` |
| `caricoUtileSella` | `caricoUtileSella`, `caricoUtile` | `src/next/components/NextMezzoEditModal.tsx:63`, `:131-146`, `:262` | `Carico utile / sella`, `src/next/components/NextMezzoEditModal.tsx:753-756` |
| `pesoTotale` | `pesoTotale` | `src/next/components/NextMezzoEditModal.tsx:64`, `:131-146`, `:262` | `Peso totale`, `src/next/components/NextMezzoEditModal.tsx:762-769` |
| `pesoTotaleRimorchio` | `pesoTotaleRimorchio`, `pesoConvoglio` | `src/next/components/NextMezzoEditModal.tsx:65`, `:131-146`, `:262` | `Peso totale rimorchio`, `src/next/components/NextMezzoEditModal.tsx:776-779` |
| `caricoSulLetto` | `caricoSulLetto` | `src/next/components/NextMezzoEditModal.tsx:66`, `:131-146`, `:262` | `Carico sul letto`, `src/next/components/NextMezzoEditModal.tsx:785-788` |
| `pesoRimorchiabile` | `pesoRimorchiabile` | `src/next/components/NextMezzoEditModal.tsx:67`, `:131-146`, `:262` | `Peso rimorchiabile`, `src/next/components/NextMezzoEditModal.tsx:794-797` |
| `luogoDataRilascio` | `luogoDataRilascio`, `luogoRilascio`, `luogoImmatricolazione` | `src/next/components/NextMezzoEditModal.tsx:68`, `:131-146`, `:262` | `Luogo / data rilascio`, `src/next/components/NextMezzoEditModal.tsx:823-827` |
| `annotazioniCantonali` | `annotazioniCantonali` | `src/next/components/NextMezzoEditModal.tsx:69`, `:131-146`, `:262` | non renderizzato nel TSX attuale |
| `decisioniAutorita` | `decisioniAutorita` | `src/next/components/NextMezzoEditModal.tsx:70`, `:131-146`, `:262` | non renderizzato nel TSX attuale |

## 2. CHIAVI SCRITTE DAI FLUSSI IA

### 2.1 IA Libretto

`src/next/NextIALibrettoPage.tsx` aggiorna il record mezzo esistente con `mappaCampi`, poi scrive l'array completo in `@mezzi_aziendali`.

| Chiave scritta nel record mezzo | Prova |
|---|---|
| `marca`, `modello`, `telaio`, `colore`, `categoria`, `cilindrata`, `potenza`, `massaComplessiva`, `proprietario`, `assicurazione`, `dataImmatricolazione`, `dataUltimoCollaudo`, `dataScadenzaRevisione`, `note` | `src/next/NextIALibrettoPage.tsx:384-405` |
| `marcaModello` | `src/next/NextIALibrettoPage.tsx:408-410` |
| `anno` | `src/next/NextIALibrettoPage.tsx:412-417` |
| `id`, `librettoUrl`, `librettoStoragePath` | `src/next/NextIALibrettoPage.tsx:420-429` |
| write finale `@mezzi_aziendali` | `src/next/NextIALibrettoPage.tsx:465` |

Nota: `pesoTotale` estratto dall'IA viene scritto come `massaComplessiva`, non come campo raw `pesoTotale` (`src/next/NextIALibrettoPage.tsx:392`).

### 2.2 Archivista ArchiveClient

`applyArchivistaVehicleUpdate` applica solo i campi restituiti da `buildVehicleFieldUpdates` e poi scrive `@mezzi_aziendali`.

| Chiave scritta nel record mezzo | Prova |
|---|---|
| `targa`, `marca`, `modello`, `telaio`, `proprietario`, `dataImmatricolazione` | `src/next/internal-ai/ArchivistaArchiveClient.ts:621-632`, `:698-700` |
| `assicurazione` | `src/next/internal-ai/ArchivistaArchiveClient.ts:640-644`, `:698-700` |
| `dataUltimoCollaudo`, `dataScadenzaRevisione` | `src/next/internal-ai/ArchivistaArchiveClient.ts:647-660`, `:698-700` |
| `marcaModello` | `src/next/internal-ai/ArchivistaArchiveClient.ts:702-706` |
| write finale `@mezzi_aziendali` | `src/next/internal-ai/ArchivistaArchiveClient.ts:710` |

### 2.3 Archivista DocumentoMezzoBridge

Il bridge costruisce molti campi di analisi libretto, ma l'update del record mezzo esistente applica solo i candidati di `buildArchivistaLibrettoVehicleUpdateFields`.

| Area | Chiavi / comportamento | Prova |
|---|---|---|
| Analisi libretto normalizzata | include `detentoreIndirizzo`, `detentoreComune`, `detentoreAfsAvs`, `detentoreStatoOrigine`, `localita`, `carrozzeria`, `pesoTotale`, `pesoVuoto`, `pesoTotaleRimorchio`, `caricoSulLetto`, `caricoRimorchiabile`, `pesoRimorchiabile`, `approvazioneTipo`, `numeroMatricola`, `luogoCollaudo` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:889-980` |
| Debug/raw libretto | espone `rawNAvs`, `rawIndirizzo`, `rawLocalita`, `rawCarrozzeria`, `rawNumeroMatricola`, `rawCaricoUtileSella`, `rawLuogoDataRilascio`, `rawPesoTotale` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:588-669`, `:2691-2721` |
| Nuovo mezzo da libretto | scrive `id`, `tipo`, `categoria`, `targa`, `marca`, `modello`, `telaio`, `colore`, `cilindrata`, `potenza`, `massaComplessiva`, `proprietario`, `assicurazione`, date standard, manutenzione default, `note`, autista null, `marcaModello`, `anno`, `genereVeicolo`, `primaImmatricolazione`, `librettoUrl`, `librettoStoragePath`, `fotoUrl`, `fotoPath` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1351-1414` |
| Update mezzo esistente da libretto | scrive solo `targa`, `marca`, `modello`, `telaio`, `proprietario`, `assicurazione`, `dataImmatricolazione`, `dataUltimoCollaudo`, `dataScadenzaRevisione`, `colore`, `categoria`, `genereVeicolo`, più eventuale foto | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1417-1480`, `:1511-1523` |
| write finale `@mezzi_aziendali` | `setItemSync("@mezzi_aziendali", next)` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1531-1533`, `:2283-2285`, `:2337-2343`, `:2384-2390` |

## 3. DIFF MODAL vs IA

### 3.1 Tabella comparativa

| Chiave cercata dal modal | Stato vs flussi IA che scrivono `@mezzi_aziendali` | Evidenza |
|---|---|---|
| `numeroAvs` | NON SCRITTO | analisi esiste come `numeroAvs`/`detentoreAfsAvs`, ma non è tra i candidati di update `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1417-1480` |
| `statoOrigine` | NON SCRITTO | analisi esiste come `detentoreStatoOrigine`, non candidata a update mezzo |
| `indirizzo` | NON SCRITTO | analisi esiste come `detentoreIndirizzo`/`indirizzo`, non candidata a update mezzo |
| `localita` | NON SCRITTO | analisi esiste come `localita`/`detentoreComune`, non candidata a update mezzo |
| `genereVeicolo` | OK | candidata a update `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1450-1453`, `:1480` |
| `carrozzeria` | NON SCRITTO | analisi esiste, non candidata a update mezzo |
| `numeroMatricola` | NON SCRITTO | analisi esiste, non candidata a update mezzo |
| `approvazioneTipo` | NON SCRITTO | analisi esiste, non candidata a update mezzo |
| `pesoVuoto` | NON SCRITTO | analisi esiste, non candidata a update mezzo |
| `caricoUtileSella` | NON SCRITTO | analisi/debug esiste, non candidata a update mezzo |
| `pesoTotale` | DIVERGENZA | IA Libretto e nuovo mezzo mappano `pesoTotale` su `massaComplessiva`, mentre il modal cerca `pesoTotale` come raw read-only (`src/next/NextIALibrettoPage.tsx:392`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1385`, `src/next/components/NextMezzoEditModal.tsx:64`) |
| `pesoTotaleRimorchio` | NON SCRITTO | analisi esiste, non candidata a update mezzo |
| `caricoSulLetto` | NON SCRITTO | analisi esiste, non candidata a update mezzo |
| `pesoRimorchiabile` | NON SCRITTO | analisi esiste, non candidata a update mezzo |
| `luogoDataRilascio` | NON SCRITTO | analisi esiste come `luogoRilascio`/`luogoImmatricolazione`/`luogoCollaudo`, non candidata a update mezzo |
| `annotazioniCantonali` | NON SCRITTO | nessun write verso record mezzo trovato nel perimetro audit |
| `decisioniAutorita` | NON SCRITTO | nessun write verso record mezzo trovato nel perimetro audit |

### 3.2 Sintesi numerica

- OK: 1 (`genereVeicolo`)
- Divergenze nomi: 1 (`pesoTotale` estratto ma scritto come `massaComplessiva`)
- NON SCRITTO: 15

## 4. VERIFICA TARGA TI282780

### 4.1 Stato accesso storage

Il record runtime `storage/@mezzi_aziendali` del browser non è ispezionabile staticamente da Codex. Nel repository non è stato trovato un dump del record `TI282780`; sono presenti riferimenti a fixture/file di test del libretto 282780, non al record storage corrente (`Nuovo Documento di testo.txt:4`, `test-libretto-openai.mjs:4`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:380-423`).

### 4.2 Comando ispezione browser

Da DevTools nella pagina dell'app:

```js
(() => {
  const raw = localStorage.getItem("@mezzi_aziendali");
  const parsed = raw ? JSON.parse(raw) : null;
  const items = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.value)
      ? parsed.value
      : Array.isArray(parsed?.items)
        ? parsed.items
        : [];
  const record = items.find((m) => String(m?.targa || "").replace(/\s+/g, "").toUpperCase() === "TI282780");
  return record ? Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b))) : null;
})()
```

### 4.3 Chiavi da verificare

Verificare nel dump se il record contiene valori non vuoti per:

```text
numeroAvs, nAvs, detentoreAfsAvs,
statoOrigine, detentoreStatoOrigine,
indirizzo, detentoreIndirizzo,
localita, detentoreComune, comune,
genereVeicolo, tipoVeicolo,
carrozzeria, tipoCarrozzeria,
numeroMatricola, numeroMatricolaTipo, matricolaTipo,
approvazioneTipo, numeroApprovazioneTipo,
pesoVuoto, tara,
caricoUtileSella, caricoUtile,
pesoTotale, massaComplessiva,
pesoTotaleRimorchio, pesoConvoglio,
caricoSulLetto,
pesoRimorchiabile, caricoRimorchiabile,
luogoDataRilascio, luogoRilascio, luogoImmatricolazione, luogoCollaudo,
annotazioniCantonali,
decisioniAutorita,
rawNAvs, rawIndirizzo, rawLocalita, rawCarrozzeria, rawNumeroMatricola, rawCaricoUtileSella, rawLuogoDataRilascio, rawPesoTotale
```

## 5. CAUSA + PROPOSTA FIX

### 5.1 Ipotesi causa primaria + evidenze

Ipotesi scelta: C.

Evidenza: il modal legge solo campi presenti nel record raw di `@mezzi_aziendali` (`src/next/components/NextMezzoEditModal.tsx:250-263`) e li nasconde se vuoti (`src/next/components/NextMezzoEditModal.tsx:131-146`). I flussi IA/Archivista costruiscono molti campi libretto in `analysis`, ma l'update del record mezzo esistente non li scrive quasi mai in `@mezzi_aziendali`; i candidati di update libretto si fermano ai campi standard più `genereVeicolo` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1417-1480`, `:1511-1533`).

Nota di confine: se il dump browser dimostra che TI282780 contiene campi popolati sotto alias non cercati dal modal, allora esiste anche una causa secondaria di tipo A. Gli alias non coperti dal modal includono `detentoreIndirizzo`, `detentoreComune`, `comune`, `caricoRimorchiabile`, `luogoCollaudo` e i campi `raw*` visibili nel debug Archivista.

### 5.2 File:riga interessati

- Lettura modal: `src/next/components/NextMezzoEditModal.tsx:53-70`, `:131-146`, `:250-263`
- Rendering modal: `src/next/components/NextMezzoEditModal.tsx:419-827`
- IA Libretto write: `src/next/NextIALibrettoPage.tsx:384-405`, `:408-429`, `:465`
- Archivista ArchiveClient write: `src/next/internal-ai/ArchivistaArchiveClient.ts:614-660`, `:683-710`
- Archivista DocumentoMezzoBridge analisi libretto: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:889-980`
- Archivista DocumentoMezzoBridge write mezzo esistente: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1417-1480`, `:1511-1533`
- Archivista DocumentoMezzoBridge nuovo mezzo: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1351-1414`, `:2283-2285`, `:2337-2343`

### 5.3 Proposta fix testuale

Persistenza: estendere il mapping di Archivista/IA Libretto che scrive `@mezzi_aziendali` salvando nel record mezzo i campi read-only libretto D8 con nomi canonici coerenti col modal. Rendering: aggiungere nel modal gli alias raw/detentore già prodotti da Archivista solo se il dump runtime dimostra che quei campi sono già presenti nei record esistenti.

## 6. NOTE FINALI (solo fatti)

- Il modal non scrive campi libretto non standard; questo è coerente con la SPEC D8 e con il writer `src/next/nextMezziWriter.ts`.
- `annotazioniCantonali` e `decisioniAutorita` sono dichiarate negli alias del modal, ma non risultano renderizzate nella struttura TSX attuale.
- `pesoTotale` ha una gestione speciale: se il raw `pesoTotale` manca, il modal mostra e modifica `massaComplessiva` nello slot "Peso totale"; quindi non è un campo read-only se il raw non è presente.
