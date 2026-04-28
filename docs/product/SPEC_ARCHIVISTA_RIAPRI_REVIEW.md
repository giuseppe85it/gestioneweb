# SPEC — Archivista Riapri Review

## 1. Obiettivo

Questa SPEC definisce il refactor del comando "Riapri review" Archivista.

Obiettivo operativo:
- quando l'utente clicca "Riapri review" da `/next/ia/documenti`, Archivista deve riaprire il documento archiviato, caricare il file e ripopolare la review con i dati gia estratti;
- per i nuovi archivi, ogni bridge deve salvare l'oggetto completo `archivistaAnalysis` nel record archivio al momento della conferma finale;
- per gli archivi vecchi senza `archivistaAnalysis`, il comportamento e quello fissato nelle decisioni D3.a-D3.c di questa SPEC.

Il problema tecnico dimostrato dall'audit e che oggi `analysis` esiste nello state React dei bridge, ma non viene persistita come oggetto completo nel record archivio: il payload documento usa `basePayload` e viene salvato con `addDoc(collection(db, args.targetCollection), payload)` (`src/next/internal-ai/ArchivistaArchiveClient.ts:483`-`src/next/internal-ai/ArchivistaArchiveClient.ts:497`); il bridge documento mezzo passa solo campi flat e array `campiMancanti`/`avvisi`, non `analysis` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2530`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2564`).

Cosa risolve:
- riapertura review con dati precaricati per tutti e 5 i bridge Archivista;
- salvataggio additivo di `archivistaAnalysis` nei record futuri;
- backfill del campo `archivistaAnalysis` sui record vecchi quando vengono riaperti;
- estensione di `buildArchivistaPreset` per instradare anche manutenzione e preventivo manutenzione, oggi non coperti (`src/next/NextIADocumentiPage.tsx:241`-`src/next/NextIADocumentiPage.tsx:253`);
- estensione del reader storico per esporre `archivistaAnalysis`, perche `NextIADocumentiArchiveItem` oggi non contiene quel campo (`src/next/domain/nextDocumentiCostiDomain.ts:1356`-`src/next/domain/nextDocumentiCostiDomain.ts:1376`).

Cosa NON risolve:
- non modifica le UI di review, inclusa `NextEstrazioneLibretto`;
- non modifica `NextMezzoEditModal.tsx`, `nextMezziWriter.ts`, tipo `Mezzo`, storage rules, firestore rules o codice madre;
- non cambia la semantica dei campi flat gia archiviati;
- non riorganizza i bridge o l'architettura Archivista oltre persistenza, preset e preload.

Riferimenti:
- audit pre-SPEC: `docs/audit/AUDIT_PRE_SPEC_RIAPRI_REVIEW_2026-04-27.md`;
- audit diagnosi: `docs/audit/AUDIT_RIAPRI_REVIEW_DIAGNOSI_2026-04-27.md`;
- handoff: `docs/handoff/HANDOFF_REFACTOR_RIAPRI_REVIEW_ARCHIVISTA_2026-04-27.md`.

## 2. Decisioni vincolanti

D1 — Ambito: TUTTI e 5 i bridge Archivista rientrano nel cantiere:
- `ArchivistaDocumentoMezzoBridge` per libretto, assicurazione, revisione, collaudo;
- `ArchivistaMagazzinoBridge` per fattura/DDT magazzino;
- `ArchivistaPreventivoMagazzinoBridge` per preventivo magazzino;
- `ArchivistaManutenzioneBridge` per fattura/DDT manutenzione;
- `ArchivistaPreventivoManutenzioneBridge` per preventivo manutenzione.

D2 — Estensione `buildArchivistaPreset`: la SPEC include la correzione di `buildArchivistaPreset` in `src/next/NextIADocumentiPage.tsx`, perche oggi non instrada documenti di manutenzione e preventivo manutenzione. La funzione oggi ritorna `documento_mezzo/documento_mezzo` solo per libretto, `preventivo/magazzino` per ogni preventivo e `fattura_ddt/magazzino` per il default (`src/next/NextIADocumentiPage.tsx:241`-`src/next/NextIADocumentiPage.tsx:253`).

D3 — Strategia archivi vecchi senza `archivistaAnalysis`:
- D3.a Caso libretto: ricostruzione di `archivistaAnalysis` dai 17 campi gia persistiti su `@mezzi_aziendali` piu campi flat del record archivio. Nessuna rianalisi IA. Dopo ricostruzione, `archivistaAnalysis` viene scritta nel record archivio.
- D3.b Casi altri 4 bridge: tentare prima ricostruzione da campi gia persistiti, flat piu `voci`/`righe`. Se la ricostruzione risulta incompleta, rianalisi automatica silenziosa via IA, poi salvataggio `archivistaAnalysis` nel record. Nessun avviso utente durante la rianalisi. Costo IA pagato una sola volta per record.
- D3.c I criteri "completa/incompleta" sono definiti nella sezione 9, guardando i campi richiesti dai bridge.

D4 — Strategia archivi nuovi: ogni bridge salva `archivistaAnalysis` nel record archivio al momento dell'archiviazione, dentro il payload passato a `archiveArchivistaDocumentRecord` o `archiveArchivistaPreventivoRecord`. La riapertura legge `archivistaAnalysis` dal record, popola lo state del bridge e mostra i campi precaricati.

D5 — Naming chiave Firestore: il campo si chiama esattamente `archivistaAnalysis`. Tipo: oggetto. Posizione: campo di primo livello del documento archiviato in `@documenti_mezzi`, `@documenti_magazzino` e nei record dell'array `preventivi` dentro `storage/@preventivi`. Il writer preventivi usa `doc(db, "storage", "@preventivi")` (`src/next/internal-ai/ArchivistaArchiveClient.ts:554`) e salva l'array con `setDoc(refDoc, { preventivi: nextPreventivi }, { merge: true })` (`src/next/internal-ai/ArchivistaArchiveClient.ts:590`-`src/next/internal-ai/ArchivistaArchiveClient.ts:591`).

D6 — Shape mista, retrocompatibile:
- i campi flat gia persistiti oggi restano nel record archivio;
- si aggiunge `archivistaAnalysis` come sotto-oggetto con l'analisi completa originale prodotta dall'IA per quella review;
- la shape interna di `archivistaAnalysis` dipende dal bridge e corrisponde all'oggetto `analysis` nello state al momento di `handleArchive`.

D7 — UI invariata: nessuna modifica a `NextEstrazioneLibretto.tsx` ne ad altre UI di review. I bridge devono popolare lo stesso state che oggi viene popolato dall'IA dopo `Analizza`; per esempio il bridge documento mezzo usa `setAnalysis(nextAnalysis)` e `setAnalysisStatus("success")` dopo l'analisi (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2384`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2385`).

D8 — Backward compatibility: i record archiviati prima del refactor restano leggibili e usabili. Nessun campo flat viene rimosso o rinominato. La presenza di `archivistaAnalysis` e additiva.

D9 — Perimetro intoccabile:
- `NextMezzoEditModal.tsx`;
- `nextMezziWriter.ts`;
- `cloneWriteBarrier.ts`: le deroghe esistenti restano; se servono nuove deroghe per salvare `archivistaAnalysis`, sono elencate esplicitamente in questa SPEC;
- `storage.rules`;
- `firestore.rules`;
- type `Mezzo`;
- codice madre, cioe qualunque cosa fuori da `src/next/`;
- `NextEstrazioneLibretto.tsx`.

## 3. Inventario bridge coinvolti

| Bridge | Tipo documento | Collection / posizione archivio | Path file | Writer chiamato |
|---|---|---|---|---|
| `ArchivistaDocumentoMezzoBridge` | `libretto`, `assicurazione`, `revisione`, `collaudo` | `@documenti_mezzi` | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` | `archiveArchivistaDocumentRecord`, con `family: "documento_mezzo"`, `context: "documento_mezzo"`, `targetCollection: "@documenti_mezzi"` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2530`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2534`) |
| `ArchivistaMagazzinoBridge` | fattura/DDT magazzino | `@documenti_magazzino` | `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx` | `archiveArchivistaDocumentRecord`, con `family: "fattura_ddt_magazzino"`, `context: "magazzino"`, `targetCollection: "@documenti_magazzino"` (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:273`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:277`) |
| `ArchivistaPreventivoMagazzinoBridge` | preventivo magazzino | record dentro array `preventivi` di `storage/@preventivi` | `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx` | `archiveArchivistaPreventivoRecord`, con `family: "preventivo_magazzino"` e `ambitoPreventivo: "magazzino"` (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:260`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:275`) |
| `ArchivistaManutenzioneBridge` | fattura/DDT manutenzione | `@documenti_mezzi` | `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` | `archiveArchivistaDocumentRecord`, con `family: "fattura_ddt_manutenzione"`, `context: "manutenzione"`, `targetCollection: "@documenti_mezzi"` (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:769`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:773`) |
| `ArchivistaPreventivoManutenzioneBridge` | preventivo manutenzione | record dentro array `preventivi` di `storage/@preventivi` | `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx` | `archiveArchivistaPreventivoRecord`, con `family: "preventivo_manutenzione"`, `ambitoPreventivo: "manutenzione"` e `metadatiMezzo` (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:620`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:647`) |

Le famiglie Archivista ammesse sono dichiarate in `ArchivistaFamily`: `fattura_ddt_magazzino`, `fattura_ddt_manutenzione`, `documento_mezzo`, `preventivo_magazzino`, `preventivo_manutenzione` (`src/next/internal-ai/ArchivistaArchiveClient.ts:14`-`src/next/internal-ai/ArchivistaArchiveClient.ts:19`).

I target documentali non-preventivo ammessi dal writer sono `@documenti_magazzino` e `@documenti_mezzi` (`src/next/internal-ai/ArchivistaArchiveClient.ts:26`-`src/next/internal-ai/ArchivistaArchiveClient.ts:28`). I preventivi usano `storage/@preventivi` tramite `doc(db, "storage", "@preventivi")` (`src/next/internal-ai/ArchivistaArchiveClient.ts:554`).

## 4. Shape persistita di archivistaAnalysis (per tipo documento)

Regola comune: `archivistaAnalysis` contiene l'oggetto `analysis` completo normalizzato nel bridge, non il subset flat oggi salvato nel record. I campi flat restano comunque al primo livello del record archivio.

### 4.1 Libretto/assicurazione/revisione/collaudo (ArchivistaDocumentoMezzoBridge)

Shape sorgente: `ArchivistaDocumentoMezzoAnalysis` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:103`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:167`).

Shape da salvare:

```ts
archivistaAnalysis: {
  stato?: string;
  tipoDocumento?: string;
  sottotipoDocumento?: string;
  fornitore?: string;
  numeroDocumento?: string;
  dataDocumento?: string;
  targa?: string;
  telaio?: string;
  proprietario?: string;
  assicurazione?: string;
  marca?: string;
  modello?: string;
  dataImmatricolazione?: string;
  dataScadenza?: string;
  dataUltimoCollaudo?: string;
  dataScadenzaRevisione?: string;
  dataScadenzaRevisioneManualOverride?: string;
  ultimoCollaudo?: string;
  prossimoCollaudoRevisione?: string;
  ultimoCollaudoManualOverride?: string;
  categoria?: string;
  genereVeicolo?: string;
  tipoVeicolo?: string;
  colore?: string;
  carrozzeria?: string;
  pesoTotale?: string;
  pesoVuoto?: string;
  pesoTotaleRimorchio?: string;
  caricoSulLetto?: string;
  caricoUtile?: string;
  caricoRimorchiabile?: string;
  pesoRimorchiabile?: string;
  cilindrata?: string;
  potenza?: string;
  cilindrica?: string;
  primaImmatricolazione?: string;
  scadenzaRevisione?: string;
  immatricolazione?: string;
  immatricolato?: string;
  luogoImmatricolazione?: string;
  luogoCollaudo?: string;
  riga38Collaudo?: string;
  revisione?: string;
  intestatario?: string;
  detentoreDenominazione?: string;
  detentoreIndirizzo?: string;
  detentoreComune?: string;
  indirizzo?: string;
  detentoreAfsAvs?: string;
  detentoreStatoOrigine?: string;
  numeroAvs?: string;
  numeroMatricola?: string;
  numeroMatricolaTipo?: string;
  approvazioneTipo?: string;
  numeroApprovazioneTipo?: string;
  annotazioni?: string;
  note?: string;
  testo?: string;
  riassuntoBreve?: string;
  localita?: string;
  luogoRilascio?: string;
  avvisi?: string[];
  campiMancanti?: string[];
}
```

Per il sottotipo `libretto`, prima del salvataggio la shape va normalizzata con la stessa funzione usata oggi prima di `setAnalysis`: `normalizeArchivistaLibrettoAnalysisState` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1070`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1078`) viene applicata al risultato normalizzato prima di `setAnalysis(nextAnalysis)` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2349`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2385`).

### 4.2 Fattura/DDT magazzino (ArchivistaMagazzinoBridge)

Shape sorgente: `ArchivistaMagazzinoAnalysis` (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:28`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:40`) e righe `ArchivistaMagazzinoVoce` (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:16`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:26`).

Shape da salvare:

```ts
archivistaAnalysis: {
  tipoDocumento?: string;
  fornitore?: string;
  numeroDocumento?: string;
  dataDocumento?: string;
  imponibile?: string | number;
  ivaPercentuale?: string | number;
  ivaImporto?: string | number;
  totaleDocumento?: string | number;
  targa?: string;
  testo?: string;
  voci?: Array<{
    descrizione?: string;
    quantita?: string | number;
    prezzo?: string | number;
    prezzoUnitario?: string | number;
    importo?: string | number;
    totale?: string | number;
    codiceArticolo?: string;
    codice?: string;
    unita?: string;
  }>;
}
```

Il bridge oggi deriva `rows` da `analysis?.voci` (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:121`) e salva nel record solo `voci: selectedRows` (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:282`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:298`). La nuova chiave deve salvare l'intera `analysis` corrente; le `voci` flat restano quelle gia oggi scelte dall'utente.

### 4.3 Preventivo magazzino (ArchivistaPreventivoMagazzinoBridge)

Shape sorgente: `ArchivistaPreventivoAnalysis` (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:17`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:29`). Le righe archivio condividono la shape `ArchivistaReviewRow` (`src/next/internal-ai/ArchivistaArchiveClient.ts:36`-`src/next/internal-ai/ArchivistaArchiveClient.ts:46`).

Shape da salvare:

```ts
archivistaAnalysis: {
  stato?: string;
  tipoDocumento?: string;
  fornitore?: string;
  numeroDocumento?: string;
  dataDocumento?: string;
  totaleDocumento?: string | number;
  testo?: string;
  riassuntoBreve?: string;
  avvisi?: string[];
  campiMancanti?: string[];
  voci?: ArchivistaReviewRow[];
}
```

Il bridge oggi legge `rows` da `analysis?.voci ?? []` (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:109`) e archivia `righe: rows` nel writer preventivi (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:260`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:275`). La nuova chiave deve salvare anche `stato`, `tipoDocumento`, `testo`, `avvisi`, `campiMancanti` e tutte le altre proprieta presenti in `analysis`.

### 4.4 Fattura/DDT manutenzione (ArchivistaManutenzioneBridge)

Shape sorgente: `ArchivistaManutenzioneAnalysis` (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:32`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:46`) e righe `ArchivistaManutenzioneVoce` (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:19`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:30`).

Shape da salvare:

```ts
archivistaAnalysis: {
  stato?: string;
  tipoDocumento?: string;
  fornitore?: string;
  numeroDocumento?: string;
  dataDocumento?: string;
  totaleDocumento?: string | number;
  targa?: string;
  km?: string | number;
  testo?: string;
  riassuntoBreve?: string;
  avvisi?: string[];
  campiMancanti?: string[];
  voci?: Array<{
    descrizione?: string;
    categoria?: string;
    quantita?: string | number;
    prezzo?: string | number;
    prezzoUnitario?: string | number;
    importo?: string | number;
    totale?: string | number;
    codiceArticolo?: string;
    codice?: string;
    unita?: string;
  }>;
}
```

Il bridge oggi trasforma `analysis.voci` in `reviewRows` (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:502`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:516`) e salva nel record solo le righe selezionate mappate con `descrizione`, `categoria`, `quantita`, `unita`, `importo`, `codice`, `prezzoUnitario` (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:791`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:799`). La nuova chiave deve salvare l'intera `analysis`, mentre il campo flat `voci` resta quello selezionato.

### 4.5 Preventivo manutenzione (ArchivistaPreventivoManutenzioneBridge)

Shape sorgente: `ArchivistaPreventivoManutenzioneAnalysis` (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:18`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:32`). Le righe condividono `ArchivistaReviewRow` (`src/next/internal-ai/ArchivistaArchiveClient.ts:36`-`src/next/internal-ai/ArchivistaArchiveClient.ts:46`).

Shape da salvare:

```ts
archivistaAnalysis: {
  stato?: string;
  tipoDocumento?: string;
  fornitore?: string;
  numeroDocumento?: string;
  dataDocumento?: string;
  totaleDocumento?: string | number;
  targa?: string;
  km?: string | number;
  testo?: string;
  riassuntoBreve?: string;
  avvisi?: string[];
  campiMancanti?: string[];
  voci?: ArchivistaReviewRow[];
}
```

Il bridge oggi costruisce `reviewDraft` da `analysis` (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:272`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:284`) e poi archivia dal `reviewDraft`, non direttamente dall'intero `analysis` (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:601`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:647`). La nuova chiave deve salvare `analysis` completa, perche `reviewDraft` non contiene `testo`, `riassuntoBreve`, `avvisi`, `campiMancanti` e `voci`.

## 5. Punto di salvataggio (per ogni bridge)

### 5.1 ArchivistaDocumentoMezzoBridge

File da modificare: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`.

Funzione: `handleArchive`, oggi parte a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2455` e chiama `archiveArchivistaDocumentRecord` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2530`.

Modifica richiesta:
- dentro `basePayload`, aggiungere `archivistaAnalysis: normalizeArchivistaLibrettoAnalysisState(analysis) ?? analysis`;
- mantenere invariati tutti i campi flat gia presenti, da `tipoDocumento` a `documentoMezzoAggiornamentoConfermato` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2539`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2564`);
- non modificare il flusso di update mezzo, che usa `applyArchivistaLibrettoVehicleUpdate` e `setItemSync("@mezzi_aziendali", next)` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1631`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1671`).

### 5.2 ArchivistaMagazzinoBridge

File da modificare: `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`.

Funzione: `handleArchive`, oggi parte a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:259` e chiama `archiveArchivistaDocumentRecord` a `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:273`.

Modifica richiesta:
- dentro `basePayload`, aggiungere `archivistaAnalysis: analysis`;
- non sostituire `voci: selectedRows`, perche quel campo flat rappresenta le righe importabili selezionate dall'utente (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:132`, `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:293`);
- mantenere `avvisi` e `campiMancanti` al primo livello (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:296`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:297`).

### 5.3 ArchivistaPreventivoMagazzinoBridge

File da modificare: `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`.

Funzione: `handleArchive`, oggi parte a `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:246` e chiama `archiveArchivistaPreventivoRecord` a `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:260`.

Modifica richiesta:
- estendere gli argomenti di `archiveArchivistaPreventivoRecord` con `archivistaAnalysis: analysis`;
- aggiornare il tipo `ArchivistaPreventivoArchiveArgs`, oggi definito senza `archivistaAnalysis` (`src/next/internal-ai/ArchivistaArchiveClient.ts:83`-`src/next/internal-ai/ArchivistaArchiveClient.ts:102`);
- nel writer preventivi aggiungere `archivistaAnalysis` dentro `nuovoPreventivo`, che oggi contiene `righe`, `avvisiArchivista`, `campiMancantiArchivista`, `metadatiMezzo` ma non analysis (`src/next/internal-ai/ArchivistaArchiveClient.ts:561`-`src/next/internal-ai/ArchivistaArchiveClient.ts:588`).

### 5.4 ArchivistaManutenzioneBridge

File da modificare: `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`.

Funzione: `handleArchive`, oggi parte a `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:751` e chiama `archiveArchivistaDocumentRecord` a `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:769`.

Modifica richiesta:
- dentro `basePayload`, aggiungere `archivistaAnalysis: analysis`;
- non sostituire il campo flat `voci`, che oggi salva solo le righe selezionate (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:791`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:799`);
- non modificare la creazione opzionale della manutenzione business, che deriva `maintenanceDraft` da `analysis` e `sourceDocumentId: result.archiveId` (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:804`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:810`) e salva tramite `saveNextManutenzioneBusinessRecord` dentro `runWithCloneWriteScopedAllowance` (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:875`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:880`).

### 5.5 ArchivistaPreventivoManutenzioneBridge

File da modificare: `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`.

Funzione: `handleArchive`, oggi parte a `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:601` e chiama `archiveArchivistaPreventivoRecord` a `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:620`.

Modifica richiesta:
- passare `archivistaAnalysis: analysis`;
- mantenere `reviewDraft` come fonte dei campi flat, perche oggi `reviewDraft` e la sorgente del payload archiviato (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:601`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:647`);
- mantenere `metadatiMezzo` con `targa` e `km` (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:641`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:644`).

### 5.6 ArchivistaArchiveClient

File da modificare: `src/next/internal-ai/ArchivistaArchiveClient.ts`.

Modifiche richieste:
- aggiungere un campo opzionale `archivistaAnalysis?: Record<string, unknown> | null` in `ArchivistaDocumentArchiveArgs`, oggi limitato a `basePayload` e metadati duplicato (`src/next/internal-ai/ArchivistaArchiveClient.ts:71`-`src/next/internal-ai/ArchivistaArchiveClient.ts:81`);
- aggiungere lo stesso campo in `ArchivistaPreventivoArchiveArgs`, oggi definito a `src/next/internal-ai/ArchivistaArchiveClient.ts:83`-`src/next/internal-ai/ArchivistaArchiveClient.ts:102`;
- per i documenti `@documenti_*`, non serve un argomento dedicato se i bridge inseriscono `archivistaAnalysis` dentro `basePayload`, perche `archiveArchivistaDocumentRecord` espande `...args.basePayload` nel payload (`src/next/internal-ai/ArchivistaArchiveClient.ts:483`-`src/next/internal-ai/ArchivistaArchiveClient.ts:495`);
- per i preventivi, serve argomento dedicato, perche il writer costruisce manualmente `nuovoPreventivo` e non accetta `basePayload` (`src/next/internal-ai/ArchivistaArchiveClient.ts:561`-`src/next/internal-ai/ArchivistaArchiveClient.ts:588`).

## 6. Punto di lettura (per ogni bridge)

### 6.1 Preset comune

Oggi `ArchivistaPresetPayload` contiene `tipo`, `contesto`, `fileUrl`, `sourceDocId`, `sourceKey`, `tipoDocumento`, `targa` (`src/next/NextIADocumentiPage.tsx:35`-`src/next/NextIADocumentiPage.tsx:43`). Deve essere esteso con:

```ts
archivistaAnalysis?: Record<string, unknown> | null;
```

Oggi `NextIAArchivistaPage` tipizza `ArchivistaPreset` con gli stessi campi e non include `archivistaAnalysis` (`src/next/NextIAArchivistaPage.tsx:17`-`src/next/NextIAArchivistaPage.tsx:25`). Anche questo tipo va esteso.

Oggi `buildArchivistaPreloadDocument` passa solo `fileUrl`, `sourceDocId`, `sourceKey`, `tipoDocumento`, `targa` (`src/next/NextIAArchivistaPage.tsx:149`-`src/next/NextIAArchivistaPage.tsx:161`). Deve includere anche `archivistaAnalysis`.

### 6.2 ArchivistaDocumentoMezzoBridge

Oggi `ArchivistaDocumentoMezzoPreloadDocument` non include `archivistaAnalysis` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:95`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:101`). Deve diventare:

```ts
type ArchivistaDocumentoMezzoPreloadDocument = {
  fileUrl: string;
  sourceDocId?: string;
  sourceKey?: string;
  tipoDocumento?: string;
  targa?: string;
  archivistaAnalysis?: ArchivistaDocumentoMezzoAnalysis | null;
};
```

Il preload file oggi scarica il file e poi azzera `analysis` con `setAnalysis(null)` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1812`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1841`). Modifica richiesta:
- se `preloadDocument.archivistaAnalysis` esiste, dopo `setSelectedFile(selectedFileFromPreload)` impostare `setAnalysis(normalizeArchivistaLibrettoAnalysisState(preloadDocument.archivistaAnalysis))`;
- impostare `setAnalysisStatus("success")`;
- non eseguire rianalisi;
- mantenere `setAnalysisStatus("idle")` solo quando `archivistaAnalysis` non esiste.

Per il matching mezzo, replicare la logica gia usata dopo analisi: dopo `setAnalysis(nextAnalysis)`, il bridge rilegge i mezzi e seleziona il mezzo con targa normalizzata (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2387`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2396`). La stessa selezione deve essere eseguita quando l'analysis arriva dal preset.

### 6.3 ArchivistaMagazzinoBridge

Oggi `ArchivistaMagazzinoBridge` non riceve props e non ha preload (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:90`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:97`). Deve ricevere:

```ts
type ArchivistaMagazzinoPreloadDocument = {
  fileUrl: string;
  sourceDocId?: string;
  sourceKey?: string;
  tipoDocumento?: string;
  targa?: string;
  archivistaAnalysis?: ArchivistaMagazzinoAnalysis | null;
};
```

Modifica richiesta:
- aggiungere prop `preloadDocument?: ArchivistaMagazzinoPreloadDocument | null`;
- aggiungere lo stesso effetto di download file usato dal bridge documento mezzo, adattato a singolo file;
- se `archivistaAnalysis` esiste, chiamare `setAnalysis(preloadDocument.archivistaAnalysis)` e `setAnalysisStatus("success")`;
- il `useEffect` esistente seleziona tutte le righe quando `analysis` esiste (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:123`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:130`), quindi non serve una UI nuova.

### 6.4 ArchivistaPreventivoMagazzinoBridge

Oggi `ArchivistaPreventivoMagazzinoBridge` non riceve props e non ha preload (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:82`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:86`). Deve ricevere:

```ts
type ArchivistaPreventivoMagazzinoPreloadDocument = {
  fileUrl: string;
  sourceDocId?: string;
  sourceKey?: string;
  tipoDocumento?: string;
  targa?: string;
  archivistaAnalysis?: ArchivistaPreventivoAnalysis | null;
};
```

Modifica richiesta:
- aggiungere prop `preloadDocument`;
- scaricare il file dal `fileUrl`;
- se `archivistaAnalysis` esiste, chiamare `setAnalysis(preloadDocument.archivistaAnalysis)` e `setAnalysisStatus("success")`;
- il bridge calcola `rows` da `analysis?.voci ?? []` (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:109`), quindi la review si riempie dallo stesso state.

### 6.5 ArchivistaManutenzioneBridge

Oggi `ArchivistaManutenzioneBridge` non riceve props e non ha preload (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:393`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:401`). Deve ricevere:

```ts
type ArchivistaManutenzionePreloadDocument = {
  fileUrl: string;
  sourceDocId?: string;
  sourceKey?: string;
  tipoDocumento?: string;
  targa?: string;
  archivistaAnalysis?: ArchivistaManutenzioneAnalysis | null;
};
```

Modifica richiesta:
- aggiungere prop `preloadDocument`;
- scaricare il file dal `fileUrl` e popolare `selectedFiles` con un solo file, perche questo bridge lavora su `selectedFiles`;
- se `archivistaAnalysis` esiste, chiamare `setAnalysis(preloadDocument.archivistaAnalysis)` e `setAnalysisStatus("success")`;
- non avviare automaticamente il secondo step business di creazione manutenzione, perche oggi quel secondo step nasce dopo `handleArchive` con `buildMaintenanceDraft` (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:804`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:810`).

### 6.6 ArchivistaPreventivoManutenzioneBridge

Oggi `ArchivistaPreventivoManutenzioneBridge` non riceve props e non ha preload (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:286`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:293`). Deve ricevere:

```ts
type ArchivistaPreventivoManutenzionePreloadDocument = {
  fileUrl: string;
  sourceDocId?: string;
  sourceKey?: string;
  tipoDocumento?: string;
  targa?: string;
  archivistaAnalysis?: ArchivistaPreventivoManutenzioneAnalysis | null;
};
```

Modifica richiesta:
- aggiungere prop `preloadDocument`;
- scaricare il file dal `fileUrl` e popolare `selectedFiles`;
- se `archivistaAnalysis` esiste, chiamare `setAnalysis(preloadDocument.archivistaAnalysis)`, `setReviewDraft(buildReviewDraft(preloadDocument.archivistaAnalysis))` e `setAnalysisStatus("success")`;
- il bridge gia costruisce `reviewDraft` da `analysis` dopo una nuova analisi (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:564`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:566`), quindi la riapertura deve usare lo stesso passaggio.

### 6.7 Montaggio bridge in NextIAArchivistaPage

Oggi `NextIAArchivistaPage` passa `preloadDocument` solo al bridge documento mezzo (`src/next/NextIAArchivistaPage.tsx:333`-`src/next/NextIAArchivistaPage.tsx:345`). I quattro bridge non-libretto vengono montati senza props (`src/next/NextIAArchivistaPage.tsx:325`-`src/next/NextIAArchivistaPage.tsx:354`).

Modifica richiesta:
- passare `preloadDocument={archivistaPreloadDocument}` anche a `ArchivistaMagazzinoBridge`, `ArchivistaPreventivoMagazzinoBridge`, `ArchivistaManutenzioneBridge`, `ArchivistaPreventivoManutenzioneBridge`;
- non modificare `DESTINATION_OPTIONS`, che gia contiene tutti e 5 i flussi come `active` (`src/next/NextIAArchivistaPage.tsx:46`-`src/next/NextIAArchivistaPage.tsx:82`);
- non modificare `FLOW_MATRIX`, che gia contiene `fattura_ddt:manutenzione`, `preventivo:magazzino` e `preventivo:manutenzione` come attivi (`src/next/NextIAArchivistaPage.tsx:84`-`src/next/NextIAArchivistaPage.tsx:110`).

## 7. Estensione buildArchivistaPreset

File da modificare: `src/next/NextIADocumentiPage.tsx`.

Stato attuale:
- `ArchivistaPresetPayload` non contiene `archivistaAnalysis` (`src/next/NextIADocumentiPage.tsx:35`-`src/next/NextIADocumentiPage.tsx:43`);
- `buildArchivistaPresetDocumentFields` porta solo `fileUrl`, `sourceDocId`, `sourceKey`, `tipoDocumento`, `targa` (`src/next/NextIADocumentiPage.tsx:223`-`src/next/NextIADocumentiPage.tsx:239`);
- `buildArchivistaPreset` manda ogni preventivo a `contesto: "magazzino"` e il default fattura/DDT a `contesto: "magazzino"` (`src/next/NextIADocumentiPage.tsx:241`-`src/next/NextIADocumentiPage.tsx:253`);
- "Riapri review" passa `archivistaPreset: buildArchivistaPreset(item)` sia dalla riga elenco sia dal modale (`src/next/NextIADocumentiPage.tsx:487`-`src/next/NextIADocumentiPage.tsx:493`, `src/next/NextIADocumentiPage.tsx:940`-`src/next/NextIADocumentiPage.tsx:952`).

Modifiche richieste:
- estendere `ArchivistaPresetPayload` con `archivistaAnalysis?: Record<string, unknown> | null`;
- estendere `buildArchivistaPresetDocumentFields` in modo che includa `archivistaAnalysis` quando `item.archivistaAnalysis` esiste;
- aggiungere discriminazione manutenzione:
  - se il record e libretto: `tipo: "documento_mezzo"`, `contesto: "documento_mezzo"`;
  - se `sourceKey === "@documenti_mezzi"` e il record non e libretto: `tipo: "fattura_ddt"`, `contesto: "manutenzione"`;
  - se il record e preventivo e porta `ambitoPreventivo === "manutenzione"` o `famigliaArchivista === "preventivo_manutenzione"`: `tipo: "preventivo"`, `contesto: "manutenzione"`;
  - se il record e preventivo e porta `ambitoPreventivo === "magazzino"` o `famigliaArchivista === "preventivo_magazzino"`: `tipo: "preventivo"`, `contesto: "magazzino"`;
  - se `sourceKey === "@documenti_magazzino"`: `tipo: "fattura_ddt"`, `contesto: "magazzino"`.

La discriminazione sopra si basa su campi gia persistiti dai writer:
- documenti mezzo/manutenzione: `famigliaArchivista` e `contestoArchivista` vengono aggiunti dal writer documento (`src/next/internal-ai/ArchivistaArchiveClient.ts:489`-`src/next/internal-ai/ArchivistaArchiveClient.ts:492`);
- preventivi: `famigliaArchivista` e `ambitoPreventivo` vengono aggiunti al record preventivo (`src/next/internal-ai/ArchivistaArchiveClient.ts:575`-`src/next/internal-ai/ArchivistaArchiveClient.ts:577`).

Per questa estensione, `NextIADocumentiArchiveItem` deve esporre almeno:

```ts
archivistaAnalysis: Record<string, unknown> | null;
famigliaArchivista: string | null;
contestoArchivista: string | null;
ambitoPreventivo: "magazzino" | "manutenzione" | null;
```

Oggi nessuno di questi campi e presente nella shape pubblica (`src/next/domain/nextDocumentiCostiDomain.ts:1356`-`src/next/domain/nextDocumentiCostiDomain.ts:1376`), quindi il lavoro passa dalla sezione 8.

Nota di scope:
- i bridge documento mezzo includono i sottotipi `assicurazione`, `revisione`, `collaudo` oltre a `libretto`;
- nel caso d'uso reale, parco mezzi svizzero, l'utente archivia solo libretti, perche assicurazione e revisione sono integrate nel libretto stesso;
- le regole di routing definite in questa sezione sono complete per il caso d'uso reale;
- se in futuro venissero usati i sottotipi `assicurazione`, `revisione`, `collaudo` come documenti separati, le regole di routing in `buildArchivistaPreset` andranno riaperte per discriminare per `tipoDocumento`/`sottotipoDocumentoMezzo` e non solo per "e libretto si/no";
- punto rinviato a cantiere di pulizia codice morto post-implementazione.

## 8. Lettura archivistaAnalysis dallo storico

File da modificare: `src/next/domain/nextDocumentiCostiDomain.ts`.

Stato attuale:
- `NextIADocumentiArchiveItem` espone solo campi ridotti come `sourceKey`, `sourceDocId`, `tipoDocumento`, `categoriaArchivio`, `targa`, `fileUrl`, `testo`, `numeroDocumento`, `daVerificare` (`src/next/domain/nextDocumentiCostiDomain.ts:1356`-`src/next/domain/nextDocumentiCostiDomain.ts:1376`);
- `mapIADocumentiArchiveRecord` ritorna solo quei campi (`src/next/domain/nextDocumentiCostiDomain.ts:1413`-`src/next/domain/nextDocumentiCostiDomain.ts:1448`);
- `readNextIADocumentiArchiveSnapshot` legge solo `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` e clone documents (`src/next/domain/nextDocumentiCostiDomain.ts:1925`-`src/next/domain/nextDocumentiCostiDomain.ts:1963`);
- i preventivi in `storage/@preventivi` sono letti in altre funzioni di supporto procurement, non nello snapshot `/next/ia/documenti`: `getDoc(doc(db, STORAGE_COLLECTION, PROCUREMENT_PREVENTIVI_DATASET_KEY))` appare nel supporto procurement (`src/next/domain/nextDocumentiCostiDomain.ts:1993`-`src/next/domain/nextDocumentiCostiDomain.ts:2004`), mentre lo snapshot IA documenti non include quel dataset (`src/next/domain/nextDocumentiCostiDomain.ts:1953`-`src/next/domain/nextDocumentiCostiDomain.ts:1963`).

Modifiche richieste:
- estendere `NextIADocumentiArchiveItem` con:

```ts
archivistaAnalysis: Record<string, unknown> | null;
famigliaArchivista: string | null;
contestoArchivista: string | null;
ambitoPreventivo: "magazzino" | "manutenzione" | null;
```

- in `mapIADocumentiArchiveRecord`, valorizzare i nuovi campi da `raw.archivistaAnalysis`, `raw.famigliaArchivista`, `raw.contestoArchivista`, `raw.ambitoPreventivo`;
- aggiungere una lettura dei record `storage/@preventivi` dentro `readNextIADocumentiArchiveSnapshot`, mappandoli come `NextIADocumentiArchiveItem` con:
  - `sourceKey: "@preventivi"`;
  - `sourceDocId: id del record preventivo`;
  - `tipoDocumento: "PREVENTIVO"` o equivalente derivato da `tipoDocumento`/`numeroPreventivo`;
  - `fileUrl` da `pdfUrl` oppure primo valore di `imageUrls`, coerente con la logica duplicati che gia legge `pdfUrl`/`imageUrls` (`src/next/internal-ai/ArchivistaArchiveClient.ts:410`-`src/next/internal-ai/ArchivistaArchiveClient.ts:414`);
  - `archivistaAnalysis` dal record preventivo.

Questa estensione e necessaria per D1 sui due bridge preventivo, perche i writer preventivi salvano in `storage/@preventivi` (`src/next/internal-ai/ArchivistaArchiveClient.ts:554`, `src/next/internal-ai/ArchivistaArchiveClient.ts:591`) e lo storico corrente non include quel dataset nel ritorno di `readNextIADocumentiArchiveSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:1958`-`src/next/domain/nextDocumentiCostiDomain.ts:1963`).

Scope `@documenti_generici`:
- la collection `@documenti_generici` viene gia letta da `readNextIADocumentiArchiveSnapshot`;
- per questa SPEC, `@documenti_generici` e fuori scope: nessuno dei 5 bridge Archivista archivia o riapre record di quella collection;
- i record `@documenti_generici` continuano a essere visibili in `/next/ia/documenti` come oggi, ma "Riapri review" non e supportato per loro in questo cantiere;
- comportamento gia presente, niente regressioni introdotte da questa SPEC.

## 9. Strategia archivi vecchi (record senza archivistaAnalysis)

Regola comune:
- se il record storico contiene `archivistaAnalysis`, il preset lo passa al bridge e il bridge popola lo state;
- se manca `archivistaAnalysis`, il bridge o un helper deve tentare la ricostruzione definita sotto;
- dopo ricostruzione o rianalisi riuscita, il campo `archivistaAnalysis` va scritto nel record esistente, cosi la seconda riapertura non paga costo IA.

### 9.1 Libretto: ricostruzione da @mezzi_aziendali

Input disponibili dal record `@documenti_mezzi` vecchio:
- campi flat documento: `tipoDocumento`, `sottotipoDocumentoMezzo`, `fornitore`, `numeroDocumento`, `dataDocumento`, `targa`, `mezzoId`, `telaio`, `proprietario`, `assicurazione`, `marca`, `modello`, date, `riassuntoBreve`, `testo`, `campiMancanti`, `avvisi` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2539`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2564`);
- `fileUrl`, `fileStoragePath`, `famigliaArchivista`, `contestoArchivista`, `statoArchivio`, `createdAt` aggiunti dal writer (`src/next/internal-ai/ArchivistaArchiveClient.ts:483`-`src/next/internal-ai/ArchivistaArchiveClient.ts:495`).

Input disponibili da `@mezzi_aziendali`:
- 17 campi libretto dichiarati in `ARCHIVISTA_LIBRETTO_PERSISTED_FIELD_LABELS`: `nAvs`, `indirizzo`, `localita`, `statoOrigine`, `annotazioni`, `carrozzeria`, `numeroMatricola`, `approvazioneTipo`, `cilindrata`, `potenza`, `pesoVuoto`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `luogoDataRilascio` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1151`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1169`);
- per nuovo mezzo questi campi vengono scritti nel record mezzo (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1488`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1540`);
- per mezzo esistente vengono applicati nel record mezzo tramite `applyArchivistaLibrettoVehicleUpdate` e `setItemSync("@mezzi_aziendali", next)` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1622`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1671`).

Criterio:
- ricostruzione completa se il record archivio ha `mezzoId` o `targa` e il mezzo corrispondente in `@mezzi_aziendali` contiene almeno una parte dei 17 campi sopra;
- ricostruzione parziale se il mezzo non viene trovato o i 17 campi sono vuoti: in questo caso si crea comunque `archivistaAnalysis` dai campi flat del record, si mantengono `campiMancanti`/`avvisi`, e NON si esegue rianalisi IA, per vincolo D3.a.

Output ricostruito:
- usare i campi flat del record archivio per i campi documento;
- usare i 17 campi del mezzo per i campi libretto;
- normalizzare con `normalizeArchivistaLibrettoAnalysisState`, perche e la funzione usata dal bridge per uniformare lo state libretto (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1070`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1078`).

Stato di ricostruzione:
- la ricostruzione usa lo stato corrente del mezzo in `@mezzi_aziendali`, non una fotografia del documento al momento dell'archiviazione;
- se i 17 campi libretto sono stati modificati nel record mezzo dopo l'archiviazione, la review riaperta riflettera lo stato attuale, non quello originale;
- comportamento accettato dall'utente: non si conserva una fotografia immutabile del libretto al tempo T; si riflette lo stato corrente del veicolo;
- il vincolo D3.a, nessuna rianalisi IA per libretto, resta invariato.

### 9.2 Magazzino

Input disponibili dal record `@documenti_magazzino` vecchio:
- campi flat `tipoDocumento`, `fornitore`, `numeroDocumento`, `dataDocumento`, `imponibile`, `ivaPercentuale`, `ivaImporto`, `totaleDocumento`, `targa`, `testo`, `voci`, `valutaDocumento`, `riassuntoBreve`, `avvisi`, `campiMancanti` (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:282`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:298`).

Criterio "completa":
- presenti `fornitore`, `numeroDocumento`, `dataDocumento`, `totaleDocumento`, perche sono i campi che il bridge marca mancanti (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:134`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:141`);
- `voci` e un array non vuoto, perche il bridge segnala "Nessuna riga materiale trovata" quando non ci sono righe (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:157`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:158`).

Se il criterio non passa:
- eseguire rianalisi automatica silenziosa usando il file precaricato;
- salvare `archivistaAnalysis` nel record esistente;
- non mostrare avviso utente durante la rianalisi, per vincolo D3.b.

Nota tecnica: `voci` vecchio contiene `selectedRows`, non necessariamente tutte le righe lette dall'IA (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:132`, `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:293`). Questo non blocca la ricostruzione; se i campi minimi e le righe esistono, la review riaperta riflette cio che e stato archiviato.

### 9.3 Preventivo magazzino

Input disponibili dal record `storage/@preventivi` vecchio:
- `fornitoreNome`, `numeroPreventivo`, `dataPreventivo`, `totaleDocumento`, `pdfUrl`/`imageUrls`, `righe`, `famigliaArchivista`, `ambitoPreventivo`, `statoArchivio`, `riassuntoBreve`, `avvisiArchivista`, `campiMancantiArchivista`, duplicati (`src/next/internal-ai/ArchivistaArchiveClient.ts:561`-`src/next/internal-ai/ArchivistaArchiveClient.ts:588`);
- dal bridge arrivano `fornitore`, `numeroPreventivo`, `dataPreventivo`, `totaleDocumento`, `riassuntoBreve`, `righe`, `avvisi`, `campiMancanti`, `ambitoPreventivo: "magazzino"` (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:260`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:275`).

Criterio "completa":
- presenti fornitore, numero preventivo e data preventivo, perche il bridge marca mancanti questi tre campi (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:116`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:120`);
- `righe` e un array non vuoto, perche il bridge segnala assenza righe strutturate (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:123`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:130`).

Ricostruzione:
- creare `archivistaAnalysis.tipoDocumento = "preventivo"` se il record non ha un tipo piu specifico;
- mappare `fornitoreNome` su `fornitore`;
- mappare `numeroPreventivo` su `numeroDocumento`;
- mappare `dataPreventivo` su `dataDocumento`;
- mappare `righe` su `voci`;
- mappare `avvisiArchivista` e `campiMancantiArchivista` su `avvisi` e `campiMancanti`.

Se incompleta: rianalisi automatica silenziosa e salvataggio del risultato.

### 9.4 Manutenzione

Input disponibili dal record `@documenti_mezzi` vecchio:
- `tipoDocumento`, `fornitore`, `numeroDocumento`, `dataDocumento`, `totaleDocumento`, `targa`, `km`, `testo`, `riassuntoBreve`, `avvisi`, `campiMancanti`, `valutaDocumento`, `voci` (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:778`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:800`).

Criterio "completa":
- presenti `targa`, `fornitore`, `dataDocumento`, `totaleDocumento`, perche sono i campi che il bridge marca mancanti quando non ci sono `campiMancanti` espliciti (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:528`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:548`);
- `voci` e un array non vuoto, perche il bridge segnala assenza righe materiali/manodopera/ricambi (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:550`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:582`).

Uso di `buildMaintenanceDraft`:
- `buildMaintenanceDraft` non e fonte primaria di ricostruzione dello storico; e una funzione che deriva un draft business da `analysis` dopo l'archiviazione (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:346`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:377`);
- nella riapertura review vecchia, prima si deve ricostruire `archivistaAnalysis`; solo dopo il bridge potra riusare lo stesso state e le stesse derivate UI.

Se incompleta: rianalisi automatica silenziosa e salvataggio del risultato.

### 9.5 Preventivo manutenzione

Input disponibili dal record `storage/@preventivi` vecchio:
- `fornitoreNome`, `numeroPreventivo`, `dataPreventivo`, `totaleDocumento`, `righe`, `famigliaArchivista`, `ambitoPreventivo: "manutenzione"`, `riassuntoBreve`, `avvisiArchivista`, `campiMancantiArchivista`, `metadatiMezzo` (`src/next/internal-ai/ArchivistaArchiveClient.ts:561`-`src/next/internal-ai/ArchivistaArchiveClient.ts:588`);
- il bridge passa `metadatiMezzo.targa` e `metadatiMezzo.km` al writer (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:641`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:644`).

Criterio "completa":
- presenti `targa`, `fornitore`, `dataDocumento`, perche il bridge marca mancanti questi campi nel `reviewDraft` (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:391`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:412`);
- `righe` e un array non vuoto, perche il bridge segnala assenza righe strutturate (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:414`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:435`).

Ricostruzione:
- mappare `fornitoreNome` su `fornitore`;
- mappare `numeroPreventivo` su `numeroDocumento`;
- mappare `dataPreventivo` su `dataDocumento`;
- mappare `metadatiMezzo.targa` e `metadatiMezzo.km` su `targa` e `km`;
- mappare `righe` su `voci`;
- mappare `avvisiArchivista` e `campiMancantiArchivista` su `avvisi` e `campiMancanti`.

Se incompleta: rianalisi automatica silenziosa e salvataggio del risultato.

### 9.6 Idempotenza per 9.2-9.5

Dopo ricostruzione completa o rianalisi riuscita:
- scrivere `archivistaAnalysis` nel record archivio esistente;
- non creare un nuovo documento;
- non ricaricare il file su Storage;
- non duplicare `righe` o `voci`;
- alla riapertura successiva, leggere `archivistaAnalysis` dal record e saltare rianalisi.

## 10. Salvataggio archivistaAnalysis dopo ricostruzione/rianalisi

Serve un writer dedicato per aggiornare record gia esistenti senza duplicare il documento e senza caricare di nuovo il file.

File da modificare: `src/next/internal-ai/ArchivistaArchiveClient.ts`.

Funzioni da aggiungere:

```ts
export async function updateArchivistaDocumentRecordAnalysis(args: {
  targetCollection: "@documenti_mezzi" | "@documenti_magazzino";
  archiveId: string;
  archivistaAnalysis: Record<string, unknown>;
}): Promise<void>;

export async function updateArchivistaPreventivoRecordAnalysis(args: {
  archiveId: string;
  archivistaAnalysis: Record<string, unknown>;
}): Promise<void>;
```

Implementazione documenti:
- usare `updateDoc` da `../../utils/firestoreWriteOps`;
- path: `doc(db, args.targetCollection, args.archiveId)`;
- payload: `{ archivistaAnalysis: sanitizeValue(args.archivistaAnalysis) }`;
- il wrapper `updateDoc` esiste e applica `assertCloneWriteAllowed("firestore.updateDoc", ...)` (`src/utils/firestoreWriteOps.ts:14`-`src/utils/firestoreWriteOps.ts:22`).

Implementazione preventivi:
- l'`archiveId` ricevuto dal writer `updateArchivistaPreventivoRecordAnalysis` arriva dal campo `sourceDocId` del preset Archivista; quel `sourceDocId` corrisponde all'`id` del record dentro l'array `preventivi` del documento `storage/@preventivi`; il match deve essere stretto su `id`, non su `numeroPreventivo` o `pdfUrl`, per evitare collisioni in caso di duplicati;
- leggere `doc(db, "storage", "@preventivi")`, come gia fa il writer preventivi (`src/next/internal-ai/ArchivistaArchiveClient.ts:554`-`src/next/internal-ai/ArchivistaArchiveClient.ts:557`);
- trovare nell'array `preventivi` il record con `id === archiveId`;
- sostituire solo quel record aggiungendo `archivistaAnalysis`;
- salvare con `setDoc(refDoc, { preventivi: nextPreventivi }, { merge: true })`, stesso pattern gia usato (`src/next/internal-ai/ArchivistaArchiveClient.ts:590`-`src/next/internal-ai/ArchivistaArchiveClient.ts:591`).

Deroghe barriera da dichiarare per implementazione:
- oggi il ramo Archivista della barriera consente `firestore.addDoc` sulle collection Archivista (`src/utils/cloneWriteBarrier.ts:360`-`src/utils/cloneWriteBarrier.ts:377`);
- consente `firestore.setDoc` solo su `storage/@preventivi` (`src/utils/cloneWriteBarrier.ts:379`-`src/utils/cloneWriteBarrier.ts:380`);
- non mostra un allow `firestore.updateDoc` nel blocco Archivista (`src/utils/cloneWriteBarrier.ts:360`-`src/utils/cloneWriteBarrier.ts:384`);
- quindi per il backfill dei documenti serve deroga additiva stretta:
  - `firestore.updateDoc` con path che inizia per `@documenti_mezzi/`;
  - `firestore.updateDoc` con path che inizia per `@documenti_magazzino/`;
  - solo quando `pathname === "/next/ia/archivista"`, coerente con `isAllowedArchivistaCloneWritePath` (`src/utils/cloneWriteBarrier.ts:263`-`src/utils/cloneWriteBarrier.ts:264`).

Non servono nuove deroghe per `storage/@preventivi` se il backfill preventivi usa `setDoc` sullo stesso doc gia autorizzato (`src/utils/cloneWriteBarrier.ts:107`, `src/utils/cloneWriteBarrier.ts:379`-`src/utils/cloneWriteBarrier.ts:380`).

## 11. Backward compatibility

Regole obbligatorie:
- nessun campo flat esistente viene rimosso o rinominato;
- `archivistaAnalysis` e additivo;
- record vecchi senza `archivistaAnalysis` restano leggibili dal reader storico, perche i campi gia esposti in `NextIADocumentiArchiveItem` restano gli stessi (`src/next/domain/nextDocumentiCostiDomain.ts:1356`-`src/next/domain/nextDocumentiCostiDomain.ts:1376`);
- `mapIADocumentiArchiveRecord` deve continuare a valorizzare i campi esistenti come oggi (`src/next/domain/nextDocumentiCostiDomain.ts:1426`-`src/next/domain/nextDocumentiCostiDomain.ts:1447`);
- i preventivi gia presenti in `storage/@preventivi` restano nell'array `preventivi`; il writer non deve cambiare nome array, perche oggi legge e scrive `currentRaw?.preventivi` (`src/next/internal-ai/ArchivistaArchiveClient.ts:554`-`src/next/internal-ai/ArchivistaArchiveClient.ts:591`);
- i duplicati continuano a usare `rawRecord` e `famigliaArchivista`/`ambitoPreventivo` per inferire famiglia (`src/next/internal-ai/ArchivistaArchiveClient.ts:249`-`src/next/internal-ai/ArchivistaArchiveClient.ts:280`, `src/next/internal-ai/ArchivistaArchiveClient.ts:386`-`src/next/internal-ai/ArchivistaArchiveClient.ts:423`).

Compatibilita UI:
- `NextEstrazioneLibretto.tsx` non cambia;
- le altre review non cambiano componenti visibili;
- la differenza e solo nella sorgente dello state: backend IA al primo analyze, oppure `archivistaAnalysis` da preset in riapertura.

## 12. Perimetro file della SPEC

File da CREARE nella futura implementazione:
- nessuno.

File da MODIFICARE nella futura implementazione:
- `src/next/internal-ai/ArchivistaArchiveClient.ts`
  - estensione argomenti writer;
  - salvataggio `archivistaAnalysis`;
  - writer update/backfill per record esistenti;
  - aree attuali: args writer (`src/next/internal-ai/ArchivistaArchiveClient.ts:71`-`src/next/internal-ai/ArchivistaArchiveClient.ts:102`), writer documenti (`src/next/internal-ai/ArchivistaArchiveClient.ts:459`-`src/next/internal-ai/ArchivistaArchiveClient.ts:497`), writer preventivi (`src/next/internal-ai/ArchivistaArchiveClient.ts:525`-`src/next/internal-ai/ArchivistaArchiveClient.ts:591`).
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
  - aggiunta `archivistaAnalysis` nel preload e in `basePayload`;
  - preload analysis nello state;
  - aree attuali: preload type (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:95`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:101`), preload effect (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1800`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1896`), handleArchive (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2455`-`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2564`).
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
  - props preload;
  - salvataggio `archivistaAnalysis`;
  - backfill/rianalisi su record vecchi;
  - aree attuali: state analysis (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:96`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:97`), analyze (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:177`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:224`), archive (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:259`-`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:299`).
- `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`
  - props preload;
  - salvataggio `archivistaAnalysis`;
  - backfill/rianalisi su record vecchi;
  - aree attuali: state analysis (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:85`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:86`), analyze (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:157`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:212`), archive (`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:246`-`src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx:275`).
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
  - props preload;
  - salvataggio `archivistaAnalysis`;
  - backfill/rianalisi su record vecchi;
  - aree attuali: state analysis (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:400`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:401`), analyze (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:632`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:716`), archive (`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:751`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:810`).
- `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`
  - props preload;
  - salvataggio `archivistaAnalysis`;
  - backfill/rianalisi su record vecchi;
  - aree attuali: state analysis/reviewDraft (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:292`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:294`), analyze (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:485`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:566`), archive (`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:601`-`src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx:647`).
- `src/next/domain/nextDocumentiCostiDomain.ts`
  - estensione `NextIADocumentiArchiveItem`;
  - mapping `archivistaAnalysis`;
  - inclusione `storage/@preventivi` nello snapshot storico;
  - aree attuali: type item (`src/next/domain/nextDocumentiCostiDomain.ts:1356`-`src/next/domain/nextDocumentiCostiDomain.ts:1376`), mapper (`src/next/domain/nextDocumentiCostiDomain.ts:1413`-`src/next/domain/nextDocumentiCostiDomain.ts:1448`), snapshot (`src/next/domain/nextDocumentiCostiDomain.ts:1925`-`src/next/domain/nextDocumentiCostiDomain.ts:1986`).
- `src/next/NextIADocumentiPage.tsx`
  - estensione preset;
  - routing manutenzione/preventivo manutenzione;
  - aree attuali: type preset (`src/next/NextIADocumentiPage.tsx:35`-`src/next/NextIADocumentiPage.tsx:43`), builder (`src/next/NextIADocumentiPage.tsx:223`-`src/next/NextIADocumentiPage.tsx:253`), click reopen (`src/next/NextIADocumentiPage.tsx:487`-`src/next/NextIADocumentiPage.tsx:493`, `src/next/NextIADocumentiPage.tsx:940`-`src/next/NextIADocumentiPage.tsx:952`).
- `src/next/NextIAArchivistaPage.tsx`
  - estensione preset type;
  - propagazione preload ai 5 bridge;
  - aree attuali: type preset (`src/next/NextIAArchivistaPage.tsx:17`-`src/next/NextIAArchivistaPage.tsx:25`), preload builder (`src/next/NextIAArchivistaPage.tsx:149`-`src/next/NextIAArchivistaPage.tsx:161`), bridge mount (`src/next/NextIAArchivistaPage.tsx:325`-`src/next/NextIAArchivistaPage.tsx:354`).
- `src/utils/cloneWriteBarrier.ts`
  - solo deroga additiva per `firestore.updateDoc` su `@documenti_mezzi/` e `@documenti_magazzino/` sotto `/next/ia/archivista`, se il writer backfill usa `updateDoc`;
  - il blocco Archivista corrente e a `src/utils/cloneWriteBarrier.ts:360`-`src/utils/cloneWriteBarrier.ts:384`.

File NON da toccare:
- `NextMezzoEditModal.tsx`;
- `nextMezziWriter.ts`;
- `storage.rules`;
- `firestore.rules`, salvo proposta esplicita separata se una verifica regole la richiede;
- type `Mezzo`;
- codice madre fuori `src/next/`;
- `src/next/internal-ai/NextEstrazioneLibretto.tsx`;
- ogni UI review non necessaria al preload state.

## 13. Test runtime previsto (dopo implementazione)

Ogni test va eseguito su browser con backend IA disponibile quando serve rianalisi automatica.

### 13.1 Documento mezzo / libretto

Archivio nuovo:
- archiviare un libretto da Archivista;
- aprire `/next/ia/documenti`;
- cliccare "Riapri review";
- atteso: file caricato, review libretto piena, `analysisStatus` equivalente a success, nessun clic su "Analizza" richiesto.

Archivio vecchio:
- usare un record senza `archivistaAnalysis`;
- cliccare "Riapri review";
- atteso: ricostruzione dai campi flat piu `@mezzi_aziendali`, nessuna rianalisi IA, scrittura additiva `archivistaAnalysis` nel record;
- riaprire una seconda volta;
- atteso: nessuna ricostruzione da zero, uso diretto di `archivistaAnalysis`.

### 13.2 Fattura/DDT magazzino

Archivio nuovo:
- archiviare fattura/DDT magazzino;
- riaprire review;
- atteso: file caricato, `analysis` popolata, righe visibili da `analysis.voci`, campi flat invariati.

Archivio vecchio:
- record completo secondo sezione 9.2: atteso ricostruzione senza IA e salvataggio `archivistaAnalysis`;
- record incompleto secondo sezione 9.2: atteso rianalisi automatica silenziosa, poi salvataggio `archivistaAnalysis`.

### 13.3 Preventivo magazzino

Archivio nuovo:
- archiviare preventivo magazzino in `storage/@preventivi`;
- verificare che appaia in `/next/ia/documenti` dopo estensione reader;
- riaprire review;
- atteso: file caricato, `analysis` popolata, `contesto: "magazzino"`.

Archivio vecchio:
- record completo secondo sezione 9.3: atteso ricostruzione senza IA e salvataggio nel record dell'array `preventivi`;
- record incompleto secondo sezione 9.3: atteso rianalisi automatica silenziosa.

### 13.4 Fattura/DDT manutenzione

Archivio nuovo:
- archiviare fattura/DDT manutenzione;
- riaprire da `/next/ia/documenti`;
- atteso: `buildArchivistaPreset` porta `tipo: "fattura_ddt"` e `contesto: "manutenzione"`, il bridge manutenzione riceve preload e mostra review compilata.

Archivio vecchio:
- record completo secondo sezione 9.4: atteso ricostruzione senza IA;
- record incompleto: atteso rianalisi automatica silenziosa;
- atteso in entrambi i casi: nessuna creazione automatica di manutenzione business alla riapertura.

### 13.5 Preventivo manutenzione

Archivio nuovo:
- archiviare preventivo manutenzione;
- verificare `ambitoPreventivo: "manutenzione"` in `storage/@preventivi`;
- riaprire da `/next/ia/documenti`;
- atteso: `buildArchivistaPreset` porta `tipo: "preventivo"` e `contesto: "manutenzione"`, il bridge costruisce `reviewDraft` da `archivistaAnalysis`.

Archivio vecchio:
- record completo secondo sezione 9.5: atteso ricostruzione senza IA;
- record incompleto: atteso rianalisi automatica silenziosa;
- seconda riapertura: atteso uso diretto di `archivistaAnalysis`.

### 13.6 Verifiche trasversali

- Nessun campo flat rimosso nei record nuovi.
- `archivistaAnalysis` presente come campo di primo livello nei documenti `@documenti_mezzi`/`@documenti_magazzino`.
- `archivistaAnalysis` presente nel singolo record dell'array `preventivi` in `storage/@preventivi`.
- `buildArchivistaPreset` instrada tutti e 5 i bridge.
- Nessuna modifica visibile a `NextEstrazioneLibretto.tsx`.
- La seconda riapertura di un record vecchio gia backfillato non rianalizza.

## 14. Domande aperte / Punti che richiedono decisione utente

Nessun punto `RICHIEDE DECISIONE UTENTE` emerso.

Nessun punto `NON DETERMINATO` bloccante emerso.

Le decisioni D1-D9 coprono:
- nome campo `archivistaAnalysis`;
- posizione del campo;
- comportamento archivi nuovi;
- comportamento archivi vecchi;
- rianalisi automatica silenziosa per i 4 bridge non-libretto;
- divieto di rianalisi IA per libretto;
- UI invariata;
- perimetro intoccabile.

Nota tecnica non bloccante: per i vecchi record magazzino/manutenzione, il codice non puo sapere se `voci`/`righe` rappresentano tutte le righe lette dall'IA o solo quelle selezionate dall'utente, perche oggi i record archivio salvano righe selezionate (`src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:132`, `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx:293`; `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:526`, `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:791`-`src/next/internal-ai/ArchivistaManutenzioneBridge.tsx:799`). Questa SPEC tratta il record vecchio completo se soddisfa i criteri minimi delle sezioni 9.2-9.5.

Note di scope chiuse in v1.1:
- sottotipi documento mezzo non usati: nel caso reale si archiviano solo libretti; assicurazione/revisione/collaudo separati restano fuori da questo cantiere e saranno valutati in pulizia codice morto post-implementazione;
- ricostruzione libretto: usa lo stato corrente del mezzo in `@mezzi_aziendali`, non una fotografia storica immutabile del documento al momento dell'archiviazione;
- backfill preventivi: `archiveId` deriva da `sourceDocId` del preset e deve corrispondere all'`id` del record dentro l'array `preventivi` di `storage/@preventivi`;
- `@documenti_generici`: resta letto e visibile nello storico come oggi, ma e fuori scope per archiviazione/riapertura dei 5 bridge Archivista.

## 15. Riferimenti

Audit e documenti:
- `docs/audit/AUDIT_PRE_SPEC_RIAPRI_REVIEW_2026-04-27.md`
- `docs/audit/AUDIT_RIAPRI_REVIEW_DIAGNOSI_2026-04-27.md`
- `docs/handoff/HANDOFF_REFACTOR_RIAPRI_REVIEW_ARCHIVISTA_2026-04-27.md`

File letti per questa SPEC:
- `docs/_live/STATO_ATTUALE_PROGETTO.md`
- `docs/audit/AUDIT_PRE_SPEC_RIAPRI_REVIEW_2026-04-27.md`
- `docs/audit/AUDIT_RIAPRI_REVIEW_DIAGNOSI_2026-04-27.md`
- `docs/handoff/HANDOFF_REFACTOR_RIAPRI_REVIEW_ARCHIVISTA_2026-04-27.md`
- `src/next/internal-ai/ArchivistaArchiveClient.ts`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/NextIAArchivistaPage.tsx`
- `src/utils/firestoreWriteOps.ts`
- `src/utils/cloneWriteBarrier.ts`
- `src/utils/storageSync.ts`
