# AUDIT PROMPT 17 RUNTIME GAP -- 2026-04-27

## 0. RIASSUNTO TOP-LINE
- Punti patch Prompt 17 (file:riga): `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1151-1177`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1177-1217`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1486-1513`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1584-1628`.
- Funzione effettivamente chiamata in archiviazione libretto runtime: `handleArchive` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2455`) tramite `onConfirm={() => void handleArchive()}` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2699`).
- Path Prompt 17 raggiunto a runtime: NO nel flusso default per mezzo esistente; SI solo per mezzo nuovo o per mezzo esistente con `applyVehicleUpdateChoice === true`.
- Payload finale a `setItemSync` contiene i 17 campi: SI nei due payload patchati; NO nel caso default mezzo esistente con `applyVehicleUpdateChoice === false`, perche non parte nessuna scrittura su `@mezzi_aziendali`.
- Filtro a valle: NO; `storageSync.setItemSync` fa merge `{ ...previous, ...item }` e non applica whitelist di campi (`src/utils/storageSync.ts:91-92`).
- Causa primaria: B.
- Fix testuale richiesto in 5 righe: vedi sezione 6.2.

## 1. INVENTARIO PATCH PROMPT 17

### 1.1 Punti aggiunti

| Punto | File:riga | Oggetto/funzione | Campi coinvolti | Propagazione |
|---|---:|---|---|---|
| Lista label | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1151-1169` | `ARCHIVISTA_LIBRETTO_PERSISTED_FIELD_LABELS` | 17 campi | Usata per derivare `ARCHIVISTA_LIBRETTO_PERSISTED_FIELD_KEYS` a `1173-1175`. |
| Builder valori | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1177-1217` | `buildArchivistaPersistedLibrettoFields` | 17 campi | Chiamata da `buildArchivistaNewVehicleRecord` e `buildArchivistaLibrettoVehicleUpdateFields`. |
| Creazione mezzo nuovo | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1486-1513` | `buildArchivistaNewVehicleRecord` | 17 campi nel record ritornato | Propagata a `setItemSync("@mezzi_aziendali", nextVehicles)` solo se `mezzoMode === "nuovo"` (`2512-2524`) e poi nel refresh post-archive (`2567-2582`). |
| Update mezzo esistente | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1584-1628` | `buildArchivistaLibrettoVehicleUpdateFields` | 17 campi in `librettoCandidates` | Propagata a `applyArchivistaLibrettoVehicleUpdate` (`1644-1671`) solo se `handleArchive` entra nel ramo `mezzoMode === "esistente" && applyVehicleUpdateChoice && result.status === "archived"` (`2587`). |

### 1.2 Visibilita degli oggetti patchati

- `buildArchivistaNewVehicleRecord` contiene i 17 campi nel record finale (`1497-1513`) e il record e scritto in `@mezzi_aziendali` a `2524` e `2582`, ma solo per `mezzoMode === "nuovo"`.
- `buildArchivistaLibrettoVehicleUpdateFields` contiene i 17 campi in `librettoCandidates` (`1622-1626`) e ritorna `return [...coreCandidates, ...librettoCandidates]` (`1628`).
- `applyArchivistaLibrettoVehicleUpdate` applica ogni campo con `current[field.key] = ...` (`1649-1651`) e scrive il mezzo aggiornato con `setItemSync("@mezzi_aziendali", next)` (`1671`).
- Quindi i campi non sono stati aggiunti a un oggetto morto: gli oggetti patchati arrivano a `setItemSync` quando il ramo relativo viene eseguito.

## 2. TRACCIA PAYLOAD FINO A FIRESTORE

| Funzione patchata | Output passato a | Condizione di esecuzione | `setItemSync` | Shape payload finale |
|---|---|---|---|---|
| `buildArchivistaNewVehicleRecord` (`1464`) | `newVehicleRecord` in `handleArchive` (`2512-2520`) | `mezzoMode === "nuovo"` | `setItemSync("@mezzi_aziendali", nextVehicles)` (`2524`) | Array mezzi con nuovo record completo, inclusi i 17 campi. |
| `buildArchivistaNewVehicleRecord` (`1464`) | `refreshedVehicle` post archive (`2567-2575`) | `newVehicleRecord && result.status === "archived"` | `setItemSync("@mezzi_aziendali", updatedVehicles)` (`2582`) | Array mezzi con record nuovo ricalcolato, inclusi i 17 campi e URL libretto. |
| `buildArchivistaLibrettoVehicleUpdateFields` (`1546`) | `appliedFields` in `applyArchivistaLibrettoVehicleUpdate` (`1644`) | Funzione chiamata dal ramo update mezzo esistente | `setItemSync("@mezzi_aziendali", next)` (`1671`) | Array mezzi con record esistente patchato campo per campo, inclusi i 17 campi. |
| `applyArchivistaLibrettoVehicleUpdate` (`1631`) | Chiamata da `handleArchive` (`2590-2595`) | `mezzoMode === "esistente" && applyVehicleUpdateChoice && result.status === "archived"` (`2587`) | `setItemSync("@mezzi_aziendali", next)` (`1671`) | Solo se `applyVehicleUpdateChoice` e true. |

### 2.1 Catena UI

- `NextEstrazioneLibretto` riceve `onConfirm={() => void handleArchive()}` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2699`.
- Il bottone/azione di conferma quindi entra in `handleArchive` (`2455`).
- Dopo analisi, il codice cerca un mezzo con stessa targa (`2391-2393`), seleziona il mezzo trovato (`2394`), imposta `mezzoMode` a `"esistente"` se trovato (`2395`) e imposta `setApplyVehicleUpdateChoice(!matchedVehicle)` (`2396`).
- Per un mezzo gia presente come TI282780, `matchedVehicle` e valorizzato e `applyVehicleUpdateChoice` diventa `false`.

## 3. SHAPE PAYLOAD ALLA SCRITTURA

### 3.1 Scritture su `@mezzi_aziendali`

| File:riga | Caso | Payload | Contiene 17 campi |
|---:|---|---|---|
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2524` | Mezzo nuovo, prima scrittura | `nextVehicles = [newVehicleRecord, ...previousVehicles]` (`2522-2523`) | SI, perche `newVehicleRecord` include `1497-1513`. |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2582` | Mezzo nuovo, refresh con URL libretto | `updatedVehicles` costruito sostituendo con `refreshedVehicle` (`2576-2581`) | SI, perche `refreshedVehicle` e costruito da `buildArchivistaNewVehicleRecord`. |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1671` | Mezzo esistente, update confermato | `next[index] = current` (`1669-1670`) | SI, perche `current[field.key]` riceve ogni campo di `appliedFields` (`1649-1651`). |
| Nessuna riga | Mezzo esistente, update non confermato | Nessun payload verso `@mezzi_aziendali` | NO, il ramo `2587-2608` non viene eseguito. |

### 3.2 Payload documento archiviato

`handleArchive` archivia sempre anche il documento tramite `archiveArchivistaDocumentRecord` (`2530-2565`). Quel payload contiene metadata e campi base (`tipoDocumento`, `targa`, `mezzoId`, `telaio`, `marca`, `modello`, date, `testo`, `campiMancanti`, `avvisi`) a `2539-2564`.

Questo payload non e il record `@mezzi_aziendali`. Non contiene i 17 campi nuovi come record mezzo e non puo spiegare la persistenza dei campi nel mezzo.

### 3.3 `storageSync.setItemSync`

`setItemSync` per `@mezzi_aziendali` legge il documento corrente (`src/utils/storageSync.ts:39-40`), itera il nuovo array (`71-92`) e fa merge del record esistente con quello nuovo:

```ts
merged[idx] = isObjectLike(previous) ? { ...previous, ...item } : item;
```

La scrittura finale avviene con `setDoc(ref, { value: mergedAfterRemovals })` (`src/utils/storageSync.ts:125`). Non c'e una lista di campi ammessi nel writer `storageSync`.

## 4. FILTRI/SANITIZE A VALLE

### 4.1 Ricerca filtri

- `rg "pick|sanitize|allowedFields|whitelist" src/next/internal-ai` trova `pickFirstValidValue` e funzioni di normalizzazione/alias in `ArchivistaDocumentoMezzoBridge.tsx`; non sono whitelist del payload mezzo.
- `ArchivistaArchiveClient.ts` contiene `sanitizeValue`, ma opera sul payload di archivio documento, non sul record `@mezzi_aziendali` scritto da `applyArchivistaLibrettoVehicleUpdate`.
- `storageSync.setItemSync` non rimuove chiavi non note: fonde record con spread (`src/utils/storageSync.ts:91-92`).

### 4.2 Verdetto filtro

Filtro a valle: NO.

I 17 campi, se presenti nel record passato a `setItemSync`, non vengono eliminati dal codice letto in questo audit.

## 5. RAGGIUNGIBILITA

### 5.1 Raggiungibilita `handleArchive`

- `handleArchive` e definita a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2455`.
- Viene richiamata dal prop `onConfirm={() => void handleArchive()}` passato a `NextEstrazioneLibretto` a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2699`.
- Quindi il click di conferma archiviazione entra in `handleArchive`.

### 5.2 Raggiungibilita path mezzo nuovo

- Il path nuovo e selezionato da `newVehicleRecord = mezzoMode === "nuovo" ? buildArchivistaNewVehicleRecord(...) : null` (`2512-2520`).
- Se `newVehicleRecord` esiste, viene scritto subito in `@mezzi_aziendali` (`2522-2524`).
- Dopo archive completato, viene riscritto con URL libretto (`2567-2582`).
- Questo path e raggiungibile solo se il mezzo e in modalita `"nuovo"`.

### 5.3 Raggiungibilita path mezzo esistente

- Dopo analisi, il match targa imposta `mezzoMode` e update choice:
  - `matchedVehicle` cercato a `2391-2393`;
  - `setSelectedVehicleId(matchedVehicle?.id ?? "")` a `2394`;
  - `setMezzoMode(matchedVehicle ? "esistente" : "nuovo")` a `2395`;
  - `setApplyVehicleUpdateChoice(!matchedVehicle)` a `2396`.
- Per un mezzo esistente, `applyVehicleUpdateChoice` viene quindi impostato a `false`.
- Il salvataggio del record mezzo esistente avviene solo dentro:

```ts
if (mezzoMode === "esistente" && applyVehicleUpdateChoice && result.status === "archived") {
```

alla riga `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2587`.

- Il checkbox UI che puo cambiare questo stato e visibile in `NextEstrazioneLibretto` con testo `Aggiorna anche i campi del mezzo dopo l'archiviazione` (`src/next/internal-ai/NextEstrazioneLibretto.tsx:938-945`).
- La conferma finale per mezzo esistente non richiede `applyVehicleUpdateChoice`: `canConfirmArchivistaReview` richiede solo `Boolean(selectedVehicleId)` nel ramo esistente (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2035-2039`).
- Il guard di `handleArchive` richiede `applyVehicleUpdateChoice` solo per `mezzoMode === "nuovo"` (`src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2467-2469`).

### 5.4 Caso TI282780 indicato

Il caso descritto e: documenti libretto preesistenti cancellati, poi nuovo libretto archiviato per targa TI282780, con record `@mezzi_aziendali` gia esistente.

Nel codice, cancellare i documenti libretto non rimuove il mezzo da `@mezzi_aziendali`. Se TI282780 resta nel dataset mezzi, l'analisi lo trova come `matchedVehicle` e porta il flusso su `mezzoMode === "esistente"` con `applyVehicleUpdateChoice === false` (`2391-2396`). In quel ramo, l'archiviazione del documento puo completarsi senza chiamare `applyArchivistaLibrettoVehicleUpdate`, quindi nessuno dei 17 campi viene scritto nel record mezzo.

## 6. DIAGNOSI

### 6.1 Causa primaria

Causa primaria: B.

Il path Prompt 17 non viene eseguito nel flusso default di archiviazione libretto per mezzo esistente. I 17 campi sono nel builder e arrivano a `setItemSync` quando il ramo update viene eseguito, ma quel ramo e condizionato da `applyVehicleUpdateChoice === true` (`2587`). Dopo il match targa di un mezzo gia presente, il codice imposta `applyVehicleUpdateChoice` a `false` (`2396`) e la conferma finale non lo richiede per mezzi esistenti (`2035-2039`, `2467-2469`).

### 6.2 Fix testuale richiesto in 5 righe

1. Nel flusso libretto con mezzo esistente, rendere obbligatoria la scrittura dei 17 campi libretto su `@mezzi_aziendali` quando l'archiviazione documento va a buon fine.
2. La condizione di update per `selectedSubtype === "libretto"` non deve dipendere dal checkbox generico `applyVehicleUpdateChoice`, oppure quel checkbox deve essere attivo per default e richiesto nel ramo esistente.
3. Conservare separato il path generico `applyArchivistaVehicleUpdate` per documenti non-libretto: il cambio serve al ramo libretto in `ArchivistaDocumentoMezzoBridge.tsx`.
4. Se l'update mezzo fallisce, la UI deve esporre l'errore invece di completare solo l'archiviazione documento.
5. Verifica runtime: TI282780 gia esistente, nuovo libretto archiviato, refresh record `@mezzi_aziendali`, presenza delle 17 chiavi anche con valore vuoto.

### 6.3 Numero file da modificare per il fix

Numero file da modificare per il fix minimo: 1.

File: `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`.

## 7. NOTE FINALI

- Ipotesi A non confermata: i campi sono in oggetti usati dai rami `setItemSync`.
- Ipotesi C non confermata: non e emerso un filtro a valle che rimuove campi extra dal record mezzo.
- La rottura e nella raggiungibilita del ramo update per mezzo esistente.
- Il path nuovo mezzo e gia strutturalmente collegato ai 17 campi.
- Il path mezzo esistente e strutturalmente collegato ai 17 campi solo quando `applyVehicleUpdateChoice` e true.
