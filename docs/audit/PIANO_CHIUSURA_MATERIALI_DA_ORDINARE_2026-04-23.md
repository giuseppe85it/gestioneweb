# PIANO CHIUSURA GAP — MATERIALI DA ORDINARE NEXT
Data: 2026-04-23
Scopo: portare `NextMaterialiDaOrdinarePage` a parity scrivente con la madre `MaterialiDaOrdinare.tsx`, coprendo anche il flusso dettaglio/arrivo merce inglobato in `NextProcurementReadOnlyPanel` → `OrderDetailPanel`.
Fonti: codice reale del repository, lettura integrale dei 5 file principali + audit di verifica `VERIFICA_3_PUNTI_AUDIT_2026-04-23.md`.

---

## Indice

1. [Mappa scritture della madre](#1-mappa-scritture-della-madre)
2. [Mappa scritture NEXT con classificazione A/B/C/D](#2-mappa-scritture-next-con-classificazione-abcd)
3. [Analisi barriera clone-write](#3-analisi-barriera-clone-write)
4. [Inglobamento Dettaglio Ordine](#4-inglobamento-dettaglio-ordine)
5. [Piano di chiusura operativo](#5-piano-di-chiusura-operativo)
6. [Rischi](#6-rischi)
7. [Stima taglia per step](#7-stima-taglia-per-step)

---

## 1. Mappa scritture della madre

File: `src/pages/MaterialiDaOrdinare.tsx` (901 righe)

### W1 — Upload foto materiale (fabbisogno)

- **path:riga**: `src/pages/MaterialiDaOrdinare.tsx:143-147`
- **tipo writer**: `uploadBytes` (Firebase Storage) — delegato a `src/utils/materialImages.ts:14-25`
- **target Storage**: `materiali/{materialId}-{timestamp}.{ext}`
- **trigger UI**: pulsante "Carica foto" → `<input type="file">` → `handleFileChange` → `aggiungiMateriale()`
- **cosa succede lato dati**: il file viene caricato su Storage al path `materiali/`, si ottiene la download URL e si imposta `fotoUrl + fotoStoragePath` nel record `MaterialeOrdine` prima di aggiungerlo all'array locale `materiali`
- **nota**: l'upload avviene DENTRO `aggiungiMateriale()`, non al momento della selezione del file

### W2 — Delete foto materiale (fabbisogno)

- **path:riga**: `src/pages/MaterialiDaOrdinare.tsx:167-170`
- **tipo writer**: `deleteObject` (Firebase Storage) — delegato a `src/utils/materialImages.ts:36-42`
- **target Storage**: `materiali/{storagePath}` (il path è nel campo `mat.fotoStoragePath`)
- **trigger UI**: pulsante "Elimina" sulla riga di un materiale → `eliminaMateriale(id)`
- **cosa succede lato dati**: se `mat.fotoStoragePath` è valorizzato, cancella l'oggetto da Storage; poi filtra il materiale dall'array locale
- **nota**: la delete Storage è condizionale; se il materiale non ha `fotoStoragePath` (es. immagine automatica da pattern) viene saltata silenziosamente

### W3 — setDoc nuovo ordine su `storage/@ordini`

- **path:riga**: `src/pages/MaterialiDaOrdinare.tsx:186-202`
- **tipo writer**: `setDoc(ref, { value: updated }, { merge: true })` — usa direttamente `firebase/firestore`, NON `firestoreWriteOps`
- **target Firestore**: collection `storage`, documento `@ordini`, campo `value` (array di `Ordine[]`)
- **trigger UI**: pulsante "CONFERMA ORDINE" / "SALVO..." → `salvaOrdine()`
- **cosa succede lato dati**:
  1. Legge prima l'array esistente con `getDoc(ref)` (riga 187-190)
  2. Crea `nuovoOrdine: Ordine` con `{ id, idFornitore, nomeFornitore, dataOrdine, materiali[], arrivato: false }`
  3. Fa append al array esistente
  4. Scrive con `setDoc(..., { merge: true })`
  5. Pulisce il form

**Totale scritture identificate nella madre: 3 (W1, W2, W3)**

---

## 2. Mappa scritture NEXT con classificazione A/B/C/D

File principali analizzati: `src/next/NextMaterialiDaOrdinarePage.tsx` (1954 righe), `src/next/NextProcurementReadOnlyPanel.tsx` (1365 righe), `src/next/NextProcurementStandalonePage.tsx` (64 righe — solo redirect, nessun writer).

### Corrispondenza con W1 (Upload foto fabbisogno)

**Classificazione: B**

- La NEXT ha `aggiornaFotoMateriale(materialId, file)` a `src/next/NextMaterialiDaOrdinarePage.tsx:1017-1030`
- Usa `URL.createObjectURL(file)` e imposta `fotoStoragePath: null` — nessun upload Storage
- Nessun import di `uploadMaterialImage`, `uploadBytes`, né `storageWriteOps` nella NEXT page
- Il writer Storage è completamente assente: la foto esiste solo in memoria come object URL, perde al refresh

### Corrispondenza con W2 (Delete foto fabbisogno)

**Classificazione: B**

- La NEXT ha `rimuoviFotoMateriale(materialId)` a `src/next/NextMaterialiDaOrdinarePage.tsx:1032-1044`
- Imposta `fotoUrl: null, fotoStoragePath: null` — nessuna delete Storage
- Coerente con B: poiché le foto non vengono mai uploadate, non c'è nulla da cancellare in Storage; ma il comportamento è errato rispetto alla madre che persiste e poi pulisce

### Corrispondenza con W3 (setDoc nuovo ordine su `@ordini`)

**Classificazione: C**

- La NEXT ha `salvaOrdine()` a `src/next/NextMaterialiDaOrdinarePage.tsx:1066-1080`
- A riga 1079: `window.alert(READ_ONLY_SAVE_MESSAGE)` dove `READ_ONLY_SAVE_MESSAGE = "Clone read-only: conferma ordine non disponibile."` (riga 90-91)
- Dopo l'alert chiama solo `clearProcurementDraftState()` — nessun writer Firestore
- Il pulsante "CONFERMA ORDINE" a riga 1841-1845 è collegato a `salvaOrdine()` e non è `disabled`

### Scritture nel Dettaglio Ordine inglobato (OrderDetailPanel)

**D1 — Salva dettaglio ordine (toggle arrivato + edit materiali + add materiali)**: **B**
- `toggleOrderArrived()`: `src/next/NextProcurementReadOnlyPanel.tsx:542-553` — solo state locale `workingOrder`
- `saveDetail()`: `src/next/NextProcurementReadOnlyPanel.tsx:554-557` — imposta solo `editing = false`, nessuna write Firestore
- `setMaterial(...)`: `src/next/NextProcurementReadOnlyPanel.tsx:530-540` — solo state locale
- `saveNewMaterial()`: `src/next/NextProcurementReadOnlyPanel.tsx:605-651` — aggiunge a state locale con flag `"clone_readonly_local"`

**D2 — Elimina ordine**: **C**
- `handleDeleteOrder()`: `src/next/NextProcurementReadOnlyPanel.tsx:245-252`
- Se `order.arrivedRows > 0`: alert "Eliminazione bloccata"
- Se `order.arrivedRows === 0`: `window.alert("Clone read-only: eliminazione ordine non disponibile.")` — esplicitamente bloccato

**D3 — Upload foto materiale nel dettaglio**: **B**
- `uploadPhoto(materialId, event)`: `src/next/NextProcurementReadOnlyPanel.tsx:585-595`
- Usa `URL.createObjectURL(file)` e imposta `photoStoragePath: null` — nessun upload Storage

**D4 — Delete foto materiale nel dettaglio**: **B**
- `removePhoto(materialId)`: `src/next/NextProcurementReadOnlyPanel.tsx:597-603`
- Imposta `photoUrl: null, photoStoragePath: null` — nessuna delete Storage

### Riepilogo classificazione

| Writer | Descrizione | Classe |
|--------|-------------|--------|
| W1 | Upload foto fabbisogno → `materiali/` Storage | B |
| W2 | Delete foto fabbisogno → `materiali/` Storage | B |
| W3 | setDoc nuovo ordine → `storage/@ordini` | C |
| D1 | Salva dettaglio ordine (arrivato + edit) → `storage/@ordini` | B |
| D2 | Elimina ordine → `storage/@ordini` | C |
| D3 | Upload foto dettaglio → `materiali/` Storage | B |
| D4 | Delete foto dettaglio → `materiali/` Storage | B |

**A=0 / B=5 / C=2 / D=0**

Nessun writer è di tipo A (esiste e passa dai wrapper ma manca la deroga). Nessun writer è di tipo D (da scrivere da zero). Tutti i writer di tipo B/C hanno già la logica UI presente — mancano solo i writer reali e la rimozione dei blocchi.

---

## 3. Analisi barriera clone-write

File: `src/utils/cloneWriteBarrier.ts`

### Allowlist MATERIALI_DA_ORDINARE esistenti

- Riga 24: path consentito: `/next/materiali-da-ordinare`
- Righe 25-27: `MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS = new Set(["storage/@preventivi", "storage/@listino_prezzi"])`
- Righe 29-32: `MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES = ["preventivi/manuali/", "preventivi/ia/"]`
- Riga 33-34: `MATERIALI_DA_ORDINARE_ALLOWED_FETCH_ENDPOINT = "http://127.0.0.1:4310/internal-ai-backend/documents/preventivo-extract"`

Blocco handler nel barrier (righe 402-415):
- `kind === "fetch.runtime"` → solo endpoint `preventivo-extract`
- `kind === "firestore.setDoc"` → controlla `MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS.has(readMetaPath(meta))`
- `kind === "storage.uploadBytes"` → controlla prefix in `MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES`
- **Nessun handler per `"storage.deleteObject"`** nel blocco Materiali da ordinare

### Path mancanti che servono ai nuovi writer

| Path/Collection | Writer che lo richiede | Stato attuale |
|-----------------|----------------------|---------------|
| Firestore `storage/@ordini` | W3, D1, D2 | NON in `MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS` |
| Storage prefix `materiali/` per `uploadBytes` | W1, D3 | NON in `MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES` |
| Storage prefix `materiali/` per `deleteObject` | W2, D4 | Manca anche il handler per kind `"storage.deleteObject"` nel blocco |

### Deroghe da aggiungere (3 modifiche a `cloneWriteBarrier.ts`)

**Deroga 1** — Aggiungere `"storage/@ordini"` al Set `MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS` (riga 25-27):
```
// target: riga 26
"storage/@ordini"
```
Copre W3, D1, D2 (tutti i setDoc su @ordini dalla route /next/materiali-da-ordinare).

**Deroga 2** — Aggiungere `"materiali/"` all'array `MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES` (righe 29-32):
```
// target: riga 31 o 32
"materiali/"
```
Copre W1, D3 (uploadBytes) via `storageWriteOps.uploadBytes`.

**Deroga 3** — Aggiungere handler `"storage.deleteObject"` nel blocco handler di Materiali da ordinare (righe 402-415), dopo il blocco `storage.uploadBytes`:
```ts
// target: dopo riga 413, dentro il blocco isAllowedMaterialiDaOrdinareCloneWritePath
if (kind === "storage.deleteObject") {
  const path = readMetaPath(meta);
  return MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
    path.startsWith(prefix),
  );
}
```
Copre W2, D4 (deleteObject) via `storageWriteOps.deleteObject`.

**Nota tecnica**: i writer di tipo B nella NEXT attualmente NON usano `storageWriteOps` (usano `URL.createObjectURL`). Quando vengono implementati i writer reali, devono usare `storageWriteOps.uploadBytes` e `storageWriteOps.deleteObject` (che chiamano internamente `assertCloneWriteAllowed("storage.uploadBytes", ...)` e `assertCloneWriteAllowed("storage.deleteObject", ...)`). NON devono riusare `materialImages.ts` direttamente, che usa kind custom `"materialImages.upload"` / `"materialImages.delete"` non riconosciuti dal blocco Materiali da ordinare.

---

## 4. Inglobamento Dettaglio Ordine

### Dove vive oggi la logica "apri dettaglio ordine"

- Route entry: `src/App.tsx:352-359` monta `NextMaterialiDaOrdinarePage` sotto `/next`
- Route legacy `NextDettaglioOrdinePage` redirige via `NextProcurementStandalonePage` a `NEXT_MATERIALI_DA_ORDINARE_PATH?orderId=...`: `src/next/NextProcurementStandalonePage.tsx:54-63`
- Dentro la page: `resolvedOrderId = selectedOrderId ?? handoffOrderId` a riga `src/next/NextMaterialiDaOrdinarePage.tsx:1224`
- Con `resolvedOrderId` presente, la sezione `showReadOnlyProcurementView` è true (riga 1226-1227) e viene montato `NextProcurementReadOnlyPanel` (riga 1880)
- `NextProcurementReadOnlyPanel` monta `OrderDetailPanel` quando trova l'ordine nello snapshot: `src/next/NextProcurementReadOnlyPanel.tsx:1215-1224`

### Dove vive oggi la logica "arrivo merce"

- **In `OrderDetailPanel`**: pulsante "Segna Arrivato" a riga `src/next/NextProcurementReadOnlyPanel.tsx:786-788` chiama `toggleOrderArrived()`
- `toggleOrderArrived()`: `src/next/NextProcurementReadOnlyPanel.tsx:542-553` — togola `arrived` su tutti i materiali in state locale, imposta `arrivalDateLabel` a oggi se arriva
- Checkbox per singolo materiale in editing mode: `src/next/NextProcurementReadOnlyPanel.tsx:1048-1064` — chiama `setMaterial(...)` solo su state locale
- **Nessuna write Firestore**: tutte le modifiche restano in `workingOrder` state locale
- Il pulsante "Salva" quando `editing=true` chiama `saveDetail()` a riga `src/next/NextProcurementReadOnlyPanel.tsx:795-797` che fa solo `setEditing(false); setAddingMaterial(false)` (riga 554-557)

### Conferma copertura del piano

Le scritture di dettaglio/arrivo (D1-D4) usano esattamente gli stessi dataset delle scritture del fabbisogno (W1-W3):
- D1, D2 → `storage/@ordini` (stessa Firestore doc di W3)
- D3, D4 → `materiali/` Storage path (stesso di W1, W2)

**Le deroghe barriera del punto 3 coprono anche D1-D4 senza aggiunte ulteriori.**

L'implementazione richiede però writer separati per il dettaglio (Step 5 e 6 del piano), perché l'operazione non è "append nuovo ordine" ma "aggiorna ordine esistente" e "rimuovi ordine dall'array".

**Dettaglio Ordine inglobato coperto: SI** — non servono deroghe aggiuntive, ma servono implementazioni writer separate nel file `NextProcurementReadOnlyPanel.tsx`.

---

## 5. Piano di chiusura operativo

### Step 1 — Deroga barriera per `@ordini` e `materiali/`

**Cosa fare**: aggiungere 3 modifiche a `src/utils/cloneWriteBarrier.ts`:
1. Aggiungere `"storage/@ordini"` al Set `MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS` (riga 26)
2. Aggiungere `"materiali/"` all'array `MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES` (riga 31 o 32)
3. Aggiungere handler `kind === "storage.deleteObject"` con check su `MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES` nel blocco handler (dopo riga 413)

**File da toccare**: `src/utils/cloneWriteBarrier.ts`
**Dipendenze**: nessuna — va fatto per primo
**Rischio**: BASSO — modifica additiva a Set/array e aggiunta di un handler; le deroghe sono path-specifiche e non aprono endpoint larghi
**Test di verifica**: `npm run build` verde; `rg "storage/@ordini" src/utils/cloneWriteBarrier.ts` restituisce hit; il barrier non lancia `CloneWriteBlockedError` in console per chiamate su `@ordini` e `materiali/` da `/next/materiali-da-ordinare`

---

### Step 2 — Regola Storage per path `materiali/`

**Cosa fare**: aggiungere in `storage.rules` la regola `match /materiali/{allPaths=**} { allow read, write: if request.auth != null; }` PRIMA del catch-all deny `/{allPaths=**}`. Poi eseguire `firebase deploy --only storage` sul progetto `gestionemanutenzione-934ef`.

**File da toccare**: `storage.rules`
**Dipendenze**: nessuna — può essere eseguito in parallelo a Step 1 o subito dopo
**Rischio**: MEDIO — deploy Firebase; se il catch-all fosse mai raggiunto prima della nuova regola, le foto sarebbero negate silenziosamente. Il deploy è rapido (pochi secondi) ma richiede Firebase CLI autenticata
**Test di verifica**: `firebase deploy --only storage` → OK; upload reale di un file di test nel browser su path `materiali/test.jpg` non produce `storage/unauthorized`

---

### Step 3 — Writer `salvaOrdine` NEXT (W3)

**Cosa fare**: riscrivere `salvaOrdine()` in `NextMaterialiDaOrdinarePage.tsx` (riga 1066-1080):
- Importare `setDoc` da `src/utils/firestoreWriteOps` (NON da `firebase/firestore`)
- Importare `doc`, `collection`, `getDoc` da `firebase/firestore` (read è OK senza wrapper)
- Replicare il pattern della madre: `getDoc(storage/@ordini)` → append `nuovoOrdine` → `firestoreWriteOps.setDoc(ref, { value: updated }, { merge: true })`
- Il tipo `Ordine` arriva da `src/types/ordini`
- Aggiungere loading state e error state analoghi alla madre (il loading state esiste già)
- Dopo salvataggio: chiamare `refreshProcurementSnapshot()` per aggiornare la lista ordini

**File da toccare**: `src/next/NextMaterialiDaOrdinarePage.tsx`
**Dipendenze**: Step 1 (barriera) deve essere completato prima
**Rischio**: BASSO — pattern identico alla madre, stesso contratto Firestore `{ value: Ordine[] }`
**Test di verifica**: premere "CONFERMA ORDINE" con materiali e fornitore → nessun alert → ordine appare in lista "Ordini" nel tab successivo → `storage/@ordini` aggiornato in Firebase Console

---

### Step 4 — Rimozione alert read-only da `salvaOrdine`

**Cosa fare**: rimuovere le righe `window.alert(READ_ONLY_SAVE_MESSAGE)` (riga 1079) e `clearProcurementDraftState()` standalone (riga 1080) da `salvaOrdine()`. Dopo Step 3 la funzione avrà già la logica di salvataggio reale che include `clearProcurementDraftState()` al suo interno in caso di successo.

**File da toccare**: `src/next/NextMaterialiDaOrdinarePage.tsx`
**Dipendenze**: Step 3 completato
**Rischio**: BASSO — rimozione di 2 righe; il banner giallo "La superficie replica la madre ma le azioni scriventi restano bloccate" (riga 219) va rimosso o aggiornato per non segnalare falsi positivi
**Test di verifica**: conferma ordine → nessun alert modale → form si svuota → lista ordini si aggiorna

---

### Step 5 — Writer foto fabbisogno Storage (W1 + W2)

**Cosa fare**: implementare upload e delete foto per il fabbisogno (bozza ordine):
- **Upload**: in `aggiungiMateriale()` (riga 955-1006), quando `fotoFile` è valorizzato, chiamare `storageWriteOps.uploadBytes(ref(storage, path), fotoFile)` + `getDownloadURL(ref)` per ottenere l'URL e impostare `fotoUrl` e `fotoStoragePath` nel `ProcurementDraftMaterial`
- Path Storage da usare: stesso pattern della madre `materiali/{id}-{Date.now()}.{ext}`
- **Delete**: in `eliminaMateriale()` (riga 1008-1015), se `item.fotoStoragePath`, chiamare `storageWriteOps.deleteObject(ref(storage, item.fotoStoragePath))`
- Importare `storageWriteOps` da `src/utils/storageWriteOps` e `ref`, `getStorage` da `firebase/storage`
- Attenzione: il draft viene salvato in sessionStorage (riga 685); i `blob:` URL non sopravvivono al reload. `normalizeStoredPreview()` (riga 120-124) già filtra i `blob:` URL. Una volta implementato l'upload reale, la `fotoUrl` sarà una URL Firebase permanente e sopravviverà al reload.

**File da toccare**: `src/next/NextMaterialiDaOrdinarePage.tsx`
**Dipendenze**: Step 1 (barriera) + Step 2 (storage.rules) devono essere completati prima
**Rischio**: MEDIO — l'upload aggiunge latenza alla pressione "AGGIUNGI"; se l'upload fallisce il materiale non va aggiunto o va aggiunto senza foto con warning; gestire entrambi i casi (con try/catch, coerente con il pattern della madre riga 143-151)
**Test di verifica**: aggiungere materiale con foto → foto persiste al refresh della pagina → eliminare materiale → foto rimossa da Firebase Storage

---

### Step 6 — Writer salva dettaglio ordine (D1)

**Cosa fare**: in `OrderDetailPanel` di `NextProcurementReadOnlyPanel.tsx`, implementare la persistenza reale di `workingOrder` su `storage/@ordini`:
- Il pulsante "Salva" (editing mode) chiama `saveDetail()` (riga 795-797 / implementazione riga 554-557)
- Il pulsante "Segna Arrivato/Non Arrivato" chiama `toggleOrderArrived()` (riga 786-788)
- Implementare un writer `persistWorkingOrder(updatedOrder)` che legge `storage/@ordini`, sostituisce l'ordine con stesso `id` nell'array, e chiama `firestoreWriteOps.setDoc`
- Dopo il salvataggio, chiamare `onCloseOrder(backTab)` per tornare alla lista e forzare il refresh dello snapshot a livello di parent (passare una callback `onOrderSaved` come prop da `NextMaterialiDaOrdinarePage`)

**File da toccare**: `src/next/NextProcurementReadOnlyPanel.tsx`, `src/next/NextMaterialiDaOrdinarePage.tsx` (per il passaggio callback `onOrderSaved`)
**Dipendenze**: Step 1 (barriera)
**Rischio**: MEDIO — l'`OrderDetailPanel` riceve `order` come prop ma legge il proprio state locale `workingOrder`; al salvataggio bisogna assicurarsi di persistere `workingOrder` (lo state locale con le modifiche) e non `order` (la prop originale). La lettura dell'array da Firestore è necessaria per fare l'aggiornamento puntuale (stesso pattern merge di W3)
**Test di verifica**: aprire un ordine, spuntare "Segna Arrivato", premere "Salva" → ordine appare come "Arrivato" nella lista "Arrivi" → `storage/@ordini` aggiornato in Firebase Console

---

### Step 7 — Writer elimina ordine (D2)

**Cosa fare**: in `handleDeleteOrder()` di `OrderDetailPanel` (riga 245-252), implementare la write reale:
- Rimuovere `window.alert("Clone read-only: eliminazione ordine non disponibile.")`
- Implementare: leggi `storage/@ordini`, filtra rimuovendo l'ordine con id corrispondente, `firestoreWriteOps.setDoc(ref, { value: filteredArray }, { merge: true })`
- La guard `order.arrivedRows > 0` → alert "Eliminazione bloccata" è corretta e va mantenuta
- Dopo la delete, chiamare la callback `onOrderSaved` (o `onCloseOrder`) per tornare alla lista

**File da toccare**: `src/next/NextProcurementReadOnlyPanel.tsx`
**Dipendenze**: Step 1 (barriera), Step 6 (per avere la callback `onOrderSaved`)
**Rischio**: BASSO — writer identico a D1 ma con filter invece di map; la guard sugli `arrivedRows` protegge dal caso più distruttivo
**Test di verifica**: eliminare un ordine senza materiali arrivati → scompare dalla lista → `storage/@ordini` non contiene più l'ordine; tentare eliminazione ordine con materiali arrivati → alert "bloccata" senza delete

---

### Step 8 — Writer foto dettaglio Storage (D3 + D4)

**Cosa fare**: in `OrderDetailPanel`, implementare upload e delete foto per le righe materiale in editing mode:
- `uploadPhoto(materialId, event)` (riga 585-595): sostituire `URL.createObjectURL(file)` con `storageWriteOps.uploadBytes` + `getDownloadURL`. Impostare il path `materiali/{materialId}-{Date.now()}.{ext}`, salvare `photoStoragePath` nel materiale di `workingOrder`
- `removePhoto(materialId)` (riga 597-603): se `material.photoStoragePath`, chiamare `storageWriteOps.deleteObject` prima di azzerare `photoUrl` e `photoStoragePath`
- Nota: le foto del dettaglio sono persiste solo DOPO il salvataggio (Step 6); se l'utente modifica la foto ma non salva, la foto è orfana su Storage. Soluzione minima: caricare la foto solo al momento del "Salva" (non al momento della selezione), oppure accettare il rischio di file orfani come known issue.

**File da toccare**: `src/next/NextProcurementReadOnlyPanel.tsx`
**Dipendenze**: Step 1 (barriera) + Step 2 (storage.rules) + Step 6 (per il salvataggio coordinato)
**Rischio**: MEDIO — rischio di file orfani se l'utente carica una foto ma non salva; accettabile come known issue documentato nel change report
**Test di verifica**: aprire dettaglio, entrare in editing, caricare foto su un materiale, premere "Salva" → foto persiste al reload; aprire editing, rimuovere foto, premere "Salva" → foto rimossa da Storage

---

### Step 9 — Build e browser test completo

**Cosa fare**:
1. `npm run build` → deve restare verde
2. `npm run lint` → baseline attuale (`582/567/15` per lint globale); delta zero fuori dal perimetro patch
3. Test browser su `/next/materiali-da-ordinare`:
   - Conferma ordine completa → ordine in lista "Ordini"
   - Foto su materiale → persiste
   - Elimina materiale con foto → foto rimossa da Storage
   - Apri dettaglio ordine → "Segna Arrivato" → salva → ordine in lista "Arrivi"
   - Elimina ordine → scompare dalla lista

**File da toccare**: nessun file sorgente
**Dipendenze**: Step 1-8 completati
**Rischio**: BASSO per il build; MEDIO per il runtime (auth Firebase, storage.rules, deploy effettuato)
**Test di verifica**: build OK; snapshot ordini aggiornato correttamente dopo ogni write

---

## 6. Rischi

### R1 — `storage.rules` nega `materiali/` per default (BLOCCANTE ESTERNO CRITICO)

Il catch-all `match /{allPaths=**} { allow read, write: if false; }` in `storage.rules` nega qualsiasi upload a `materiali/`. Il piano fallisce silenziosamente a runtime anche con barriera aperta se lo Step 2 non viene eseguito PRIMA di testare i writer foto. Il deploy richiede Firebase CLI autenticata e accesso al progetto `gestionemanutenzione-934ef`.

### R2 — Side effect domain procurement dopo write su `@ordini`

`readNextProcurementSnapshot()` in `src/next/domain/nextProcurementDomain.ts` legge `storage/@ordini`. Ogni write che modifica `@ordini` rende obsoleto lo snapshot in memoria. Il piano deve includere `refreshProcurementSnapshot()` (già presente come callback nel parent a riga `src/next/NextMaterialiDaOrdinarePage.tsx:617-635`) dopo ogni write su `@ordini` (Step 3, Step 6, Step 7). Senza refresh, la lista ordini mostrerebbe dati stantii fino al reload.

### R3 — `nextProcurementDomain.ts` non ha overlay clone-only per `@ordini`

Confermato con `rg "cloneOverlay|clone_only|deletedIds|cloneRecord" nextProcurementDomain.ts` → nessun output. Non c'è un meccanismo di overlay locale che potrebbe fare ombra alle scritture reali. Rischio: ASSENTE.

### R4 — `materialImages.ts` usa kind custom `"materialImages.upload"` non riconosciuto dalla barriera nel blocco Materiali da ordinare

Se il writer NEXT riusasse `materialImages.ts` direttamente, il kind `"materialImages.upload"` non verrebbe riconosciuto nel blocco `isAllowedMaterialiDaOrdinareCloneWritePath` e la write sarebbe bloccata. Il piano impone l'uso di `storageWriteOps.uploadBytes` e `storageWriteOps.deleteObject` (kind `"storage.uploadBytes"` e `"storage.deleteObject"`) che la barriera gestisce correttamente dopo le deroghe dello Step 1.

### R5 — Contratto doppio preventivi (`preventivi/manuali/` vs `preventivi/ia/`)

Già documentato e aperto. Non impatta il perimetro `@ordini` + `materiali/` di questo piano. Il barrier per `preventivi/` è già operativo e non va toccato.

### R6 — File orfani su Storage per foto dettaglio

Se l'utente carica una foto in `OrderDetailPanel` (editing mode) ma non salva, il file viene uploadato su Storage ma non mai associato a un ordine persistito. Known issue accettabile; documentare nel change report al momento dell'implementazione.

### R7 — Auth Firebase richiesta per Storage writes

`storage.rules` usa `if request.auth != null`. Se l'utente non è autenticato (es. sessione scaduta), le write Storage fallirebbero con `storage/unauthorized`. Il flusso auth esistente dell'applicazione deve essere attivo. Non è un nuovo vincolo introdotto da questo piano, ma va tenuto presente nei test.

---

## 7. Stima taglia per step

| Step | Titolo | Taglia |
|------|--------|--------|
| 1 | Deroga barriera (3 modifiche a `cloneWriteBarrier.ts`) | XS |
| 2 | Regola Storage `materiali/` + deploy Firebase | S |
| 3 | Writer `salvaOrdine` NEXT su `@ordini` | S |
| 4 | Rimozione alert read-only `salvaOrdine` | XS |
| 5 | Writer foto fabbisogno Storage (upload + delete) | M |
| 6 | Writer salva dettaglio ordine (D1 — arrivato + edit) | M |
| 7 | Writer elimina ordine (D2) | S |
| 8 | Writer foto dettaglio Storage (D3 + D4) | M |
| 9 | Build + browser test completo | S |

**Totale stimato**: 3 step XS + 3 step S + 3 step M

---

*Questo piano è una fotografia del 2026-04-23. Prima di implementare, rieseguire un check veloce sui path:riga citati.*
