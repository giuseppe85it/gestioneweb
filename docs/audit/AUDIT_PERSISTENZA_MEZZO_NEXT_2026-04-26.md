# AUDIT PERSISTENZA MEZZO NEXT - 2026-04-26

## 0. RIASSUNTO TOP-LINE
- Writer scrive su: Firestore `storage/@mezzi_aziendali` tramite `storageSync.setItemSync`, non su browser `localStorage`.
- Modal legge da: `storageSync.getItemSync("@mezzi_aziendali")`, che legge override NEXT solo se presente e altrimenti Firestore `storage/@mezzi_aziendali`.
- Dossier legge da: Firestore `storage/@mezzi_aziendali` tramite `getDoc(doc(db, "storage", "@mezzi_aziendali"))`.
- Verdetto: NESSUN_BUG.
- Pattern corretto per il writer: pattern gia usato da IA Libretto e Archivista, cioe `runWithCloneWriteScopedAllowance` + `storageSync.setItemSync("@mezzi_aziendali", ...)`.

## 1. WRITER MODAL - DOVE SCRIVE

### 1.1 Body funzioni

Funzioni esportate in `src/next/nextMezziWriter.ts:122` e `src/next/nextMezziWriter.ts:154`.

```ts
export async function updateNextMezzoAnagrafica(
  mezzoId: string,
  patch: Partial<Mezzo>,
): Promise<void> {
  const normalizedMezzoId = assertMezzoId(mezzoId);
  const records = await readMezziRecords();
  const targetIndex = findMezzoIndex(records, normalizedMezzoId);

  if (targetIndex < 0) {
    throw new Error("Mezzo non trovato.");
  }

  const current = records[targetIndex];
  if (!isRecord(current)) {
    throw new Error("Record mezzo non valido.");
  }

  const updated: MezzoRawRecord = {
    ...(current as MezzoRawRecord),
    ...buildPatch(patch),
    id: String(current.id ?? normalizedMezzoId),
    fotoUrl: (current as MezzoRawRecord).fotoUrl,
    fotoPath: (current as MezzoRawRecord).fotoPath,
  };

  updated.marcaModello = buildMarcaModello(updated);

  const nextRecords = [...records];
  nextRecords[targetIndex] = updated;
  await writeMezziRecords(nextRecords);
}
```

```ts
export async function deleteNextMezzo(mezzoId: string): Promise<void> {
  const normalizedMezzoId = assertMezzoId(mezzoId);
  const records = await readMezziRecords();
  const nextRecords = records.filter(
    (record) => !isRecord(record) || String(record.id ?? "").trim() !== normalizedMezzoId,
  );

  if (nextRecords.length === records.length) {
    throw new Error("Mezzo non trovato.");
  }

  await writeMezziRecords(nextRecords, {
    allowRemovals: true,
    removedIds: [normalizedMezzoId],
  });
}
```

La chain interna e:
- `MEZZI_KEY = "@mezzi_aziendali"` in `src/next/nextMezziWriter.ts:4`.
- `readMezziRecords()` chiama `getItemSync(MEZZI_KEY)` in `src/next/nextMezziWriter.ts:89-91`.
- `writeMezziRecords()` chiama `runWithCloneWriteScopedAllowance(..., () => setItemSync(MEZZI_KEY, records, options))` in `src/next/nextMezziWriter.ts:116-120`.

### 1.2 Chain setItemSync

`storageSync` importa Firestore, non browser localStorage: `src/utils/storageSync.ts:1-2`.

```ts
import { db } from "../firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
```

`setItemSync` e definita in `src/utils/storageSync.ts:27`. La funzione crea sempre un riferimento Firestore:

```ts
const ref = doc(db, "storage", key);
```

Per `@mezzi_aziendali`, `setItemSync` legge il documento Firestore esistente con `getDoc(ref)` in `src/utils/storageSync.ts:39`, applica merge-safe per array mezzi e scrive con `setDoc(ref, { value: mergedAfterRemovals })` in `src/utils/storageSync.ts:125`.

Per le altre chiavi, scrive comunque su Firestore con `setDoc(ref, { value: value })` in `src/utils/storageSync.ts:131`.

Nel file `src/utils/storageSync.ts` non ci sono chiamate a browser `localStorage`; la ricerca `localStorage` non produce hit nel file. Il nome `storageSync` non indica storage del browser: in questo codice il target persistente e Firestore collection `storage`.

### 1.3 Verdetto sorgente

Il writer del modal scrive su `FIRESTORE_SOLO` per la sorgente persistente: Firestore collection `storage`, documento `@mezzi_aziendali`.

Nota runtime separata: `setItemSync` intercetta `CloneWriteBlockedError` e altri errori nel `catch` in `src/utils/storageSync.ts:132-136`. Quindi un blocco barriera o un errore Firestore puo non propagare al chiamante. Questo e un rischio di feedback utente, ma non e una divergenza di sorgente dati tra writer e reader.

## 2. READER MODAL E DOSSIER - DOVE LEGGONO

### 2.1 Modal: caricamento iniziale

Il modal carica il mezzo all'apertura in `src/next/components/NextMezzoEditModal.tsx:241-264`.

```ts
const rawMezzi = await getItemSync(MEZZI_KEY);
const records = unwrapArray(rawMezzi);
const record = findMezzo(records, mezzoId);
if (!record) {
  throw new Error("Mezzo non trovato.");
}

const nextFormData = normalizeMezzoRecord(record);
const anagrafiche = await readNextAnagraficheFlottaSnapshot();

if (!cancelled) {
  setFormData(nextFormData);
  setOriginalData(nextFormData);
  setRawLibrettoFields(buildRawLibrettoFields(record));
  setAutistaList(anagrafiche.colleghi);
}
```

La chiave e `MEZZI_KEY = "@mezzi_aziendali"` in `src/next/components/NextMezzoEditModal.tsx:14`.

### 2.2 Modal: chain reader

`getItemSync` e definita in `src/utils/storageSync.ts:139`. La chain reale e:
- se `isCloneRuntime()` e true, legge prima un override in memoria tramite `readNextLegacyStorageOverride(key)` in `src/utils/storageSync.ts:141-145`;
- se l'override non esiste, legge Firestore `doc(db, "storage", key)` e `getDoc(ref)` in `src/utils/storageSync.ts:148-150`;
- ritorna `snap.data().value` in `src/utils/storageSync.ts:150`.

L'overlay in memoria e gestito da `src/next/nextLegacyStorageOverlay.ts:19-41`; non usa browser localStorage. La costruzione nota dell'override flotta legge `readNextAnagraficheFlottaSnapshot()` e popola `overrides["@mezzi_aziendali"]` in `src/next/NextLegacyStorageBoundary.tsx:183-184`.

Il modal `NextMezzoEditModal` non risulta montato direttamente dentro `NextLegacyStorageBoundary` dai grep su `src/next`; in assenza di overlay attivo, la sorgente effettiva del modal e Firestore `storage/@mezzi_aziendali`.

### 2.3 Dossier: chain reader

`src/next/NextDossierMezzoPage.tsx` importa `readNextDossierMezzoCompositeSnapshot` in `src/next/NextDossierMezzoPage.tsx:19`.

Il primo caricamento del Dossier chiama il reader in `src/next/NextDossierMezzoPage.tsx:167-185`.

```ts
const nextSnapshot = await readNextDossierMezzoCompositeSnapshot(targa);
if (cancelled) return;
if (!nextSnapshot) {
  setLegacy(null);
  setError("Mezzo non trovato nel clone.");
  setLoading(false);
  return;
}
setLegacy(buildNextDossierMezzoLegacyView(nextSnapshot));
```

Nel domain:
- `STORAGE_COLLECTION = "storage"` in `src/next/domain/nextDossierMezzoDomain.ts:48`.
- `MEZZI_DATASET_KEY = "@mezzi_aziendali"` in `src/next/domain/nextDossierMezzoDomain.ts:49`.
- `readNextDossierMezzoIdentity()` legge `getDoc(doc(db, STORAGE_COLLECTION, MEZZI_DATASET_KEY))` in `src/next/domain/nextDossierMezzoDomain.ts:408-414`.
- `readNextDossierMezzoCompositeSnapshot()` chiama `readNextDossierMezzoIdentity(mezzoTarga)` in `src/next/domain/nextDossierMezzoDomain.ts:747-755`.

### 2.4 Verdetto sorgente

Modal e Dossier leggono lo stesso documento persistente Firestore `storage/@mezzi_aziendali`, con questa differenza:
- il modal passa da `storageSync.getItemSync()`, che puo usare un overlay in memoria se presente;
- il Dossier passa direttamente dal domain Firestore `getDoc(doc(db, "storage", "@mezzi_aziendali"))`.

Nel flusso Dossier Mezzo attivo, non e dimostrato un overlay locale che sostituisca Firestore per il modal. Il dato browser `localStorage["@mezzi_aziendali"]` vuoto non e una prova di mismatch, perche il codice non usa browser localStorage come sorgente.

## 3. CONFRONTO E SCENARIO DI ROTTURA

### 3.1 Tabella confronto

| Operazione | Sorgente | File:riga |
| --- | --- | --- |
| Writer modal scrive su | Firestore `storage/@mezzi_aziendali` tramite `setItemSync` | `src/next/nextMezziWriter.ts:116-120`, `src/utils/storageSync.ts:27-131` |
| Modal legge da | `getItemSync("@mezzi_aziendali")`, quindi overlay in memoria se presente, altrimenti Firestore `storage/@mezzi_aziendali` | `src/next/components/NextMezzoEditModal.tsx:249`, `src/utils/storageSync.ts:139-150` |
| Dossier legge da | Firestore `storage/@mezzi_aziendali` diretto | `src/next/domain/nextDossierMezzoDomain.ts:408-414`, `src/next/domain/nextDossierMezzoDomain.ts:747-755` |

### 3.2 Scenario rottura runtime

Lo scenario ipotizzato dal prompt era:
- utente apre modal: dati caricati da Firestore;
- utente salva: writer scrive solo in browser localStorage;
- refresh: Dossier rilegge Firestore e perde la modifica.

Questo scenario non e confermato dal codice. Il writer non scrive browser localStorage; scrive Firestore `storage/@mezzi_aziendali` tramite `setDoc`.

Scenario runtime ancora da verificare separatamente:
- se la barriera blocca `storageSync.setItemSync` o Firestore rifiuta la scrittura, `setItemSync` puo intercettare l'errore e non rilanciarlo;
- in quel caso la UI potrebbe chiudere credendo di avere salvato, ma il problema sarebbe blocco/silenzio del wrapper, non sorgente dati diversa.

La deroga Dossier Mezzo esiste in `src/utils/cloneWriteBarrier.ts:72-82` e viene applicata per `storageSync.setItemSync` su `@mezzi_aziendali` in `src/utils/cloneWriteBarrier.ts:388-391`.

### 3.3 Verdetto

NESSUN_BUG per mismatch sorgente writer/reader.

## 4. FLUSSI IA SIMILI

### 4.1 IA Libretto handleSave

`NextIALibrettoPage` usa Firestore diretto per leggere il dataset e `setItemSync` per scriverlo:
- `firestorePath = "storage/@mezzi_aziendali"` in `src/next/NextIALibrettoPage.tsx:272`;
- `doc(db, "storage", "@mezzi_aziendali")` in `src/next/NextIALibrettoPage.tsx:288`;
- `await setItemSync("@mezzi_aziendali", mezzi)` in `src/next/NextIALibrettoPage.tsx:465`.

Questa chain converge nello stesso `storageSync.setItemSync` analizzato sopra.

### 4.2 Archivista applyArchivistaVehicleUpdate

`ArchivistaArchiveClient` usa `getItemSync` e `setItemSync`:
- `readArchivistaVehicles()` chiama `getItemSync("@mezzi_aziendali")` in `src/next/internal-ai/ArchivistaArchiveClient.ts:609-611`;
- `applyArchivistaVehicleUpdate()` chiama `readArchivistaVehicles()` in `src/next/internal-ai/ArchivistaArchiveClient.ts:683-686`;
- salva con `await setItemSync("@mezzi_aziendali", next)` in `src/next/internal-ai/ArchivistaArchiveClient.ts:710`.

`ArchivistaDocumentoMezzoBridge` usa lo stesso pattern:
- `applyArchivistaLibrettoVehicleUpdate()` legge `readArchivistaVehicles()` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1493-1499`;
- salva con `await setItemSync("@mezzi_aziendali", next)` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1533`;
- in creazione/refresh/rollback salva ancora con `setItemSync("@mezzi_aziendali", ...)` in `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2285`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2343`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2390`.

### 4.3 Confronto

I flussi IA non dimostrano un meccanismo separato Firestore-only diverso dal nuovo writer. Usano lo stesso wrapper `storageSync.setItemSync` che scrive Firestore. IA Libretto legge direttamente Firestore prima della scrittura; Archivista legge con `getItemSync`, cioe la stessa chain del modal.

Il nuovo writer `nextMezziWriter.ts` usa lo stesso pattern persistente dei flussi IA funzionanti, con una differenza positiva: passa attraverso `runWithCloneWriteScopedAllowance` in `src/next/nextMezziWriter.ts:116-120`.

## 5. PATTERN CORRETTO PROPOSTO (TESTUALE)

### 5.1 Meccanismo identificato

Il meccanismo reale e Firestore documentale:
- collection: `storage`;
- document id: `@mezzi_aziendali`;
- shape persistita: `{ value: mezzi[] }`.

`storageSync.setItemSync` e `storageSync.getItemSync` sono wrapper Firestore, non wrapper browser localStorage.

### 5.2 Riferimento codice esistente che usa il pattern corretto

Pattern gia presente:
- IA Libretto: `src/next/NextIALibrettoPage.tsx:465`;
- Archivista ArchiveClient: `src/next/internal-ai/ArchivistaArchiveClient.ts:710`;
- Archivista DocumentoMezzoBridge: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1533`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2285`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2343`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2390`;
- writer modal: `src/next/nextMezziWriter.ts:116-120`.

### 5.3 Cosa andrebbe cambiato in nextMezziWriter.ts (descrizione, NO codice)

Per il mismatch sorgente dati non emerge una modifica richiesta: il writer sta gia scrivendo sullo stesso Firestore documentale letto da Dossier e modal.

Se in browser il salvataggio non persiste, la prossima diagnosi deve verificare una causa diversa:
- se la deroga `isAllowedDossierMezzoEditCloneWritePath` viene effettivamente soddisfatta dalla route corrente;
- se `setItemSync` sta intercettando un errore nel `catch` senza rilanciarlo;
- se le Firebase rules o la sessione utente rifiutano il `setDoc`.

## 6. NOTE FINALI

- `localStorage.getItem("@mezzi_aziendali")` vuoto non e un'anomalia per questo codice: nessuno dei reader/writer analizzati usa browser localStorage come fonte primaria.
- Il nome `storageSync` e fuorviante rispetto al comportamento attuale: il file usa Firestore `doc(db, "storage", key)`.
- Il record runtime TI282780 non e stato letto da Codex dal browser dell'utente. La diagnosi qui e statica sul codice.
- Verdetto limitato alla domanda del prompt: writer e reader puntano alla stessa sorgente persistente.
