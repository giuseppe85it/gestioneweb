# VERDETTO CHIUSURA AL 100% — MATERIALI DA ORDINARE NEXT

Data audit: 2026-04-24
Modulo: NextMaterialiDaOrdinarePage + NextProcurementReadOnlyPanel + NextAcquistiPage + NextProcurementStandalonePage
Revisore: Claude Code (claude-sonnet-4-6)
Scope file verificati:
- `src/next/NextMaterialiDaOrdinarePage.tsx` (2024 righe)
- `src/next/NextProcurementReadOnlyPanel.tsx` (1459 righe)
- `src/next/NextAcquistiPage.tsx` (5 righe)
- `src/next/NextProcurementStandalonePage.tsx` (64 righe)
- `src/utils/cloneWriteBarrier.ts` (569 righe, letto integralmente)
- `src/utils/firestoreWriteOps.ts` (44 righe, letto integralmente)
- `src/utils/storageWriteOps.ts` (57 righe, letto integralmente)
- `storage.rules` (33 righe, letto integralmente)
- `src/pages/MaterialiDaOrdinare.tsx` (901 righe, letto integralmente)

---

## PUNTO 1 — Zero pulsanti disabled senza motivo di business

**METODO:** `rg -n "disabled" src/next/NextMaterialiDaOrdinarePage.tsx src/next/NextProcurementReadOnlyPanel.tsx`

**EVIDENZA:**

| path:riga | Espressione disabled | Tipo | Classificazione |
|-----------|---------------------|------|-----------------|
| `NextProcurementReadOnlyPanel.tsx:392` | `disabled={!canDelete}` | `canDelete = order.arrivedRows === 0` | A — regola business: non si eliminano ordini con materiali arrivati |
| `NextProcurementReadOnlyPanel.tsx:871` | `disabled={savingDetail}` | saving in progress | A — anti-double-submit durante persistenza |
| `NextProcurementReadOnlyPanel.tsx:885` | `disabled={savingDetail}` | saving in progress | A — anti-double-submit durante persistenza |
| `NextMaterialiDaOrdinarePage.tsx:1370` | `disabled={loadingFornitori}` | loading state | A — attesa caricamento dati da Firestore |
| `NextMaterialiDaOrdinarePage.tsx:1475` | `disabled={!canAddMateriale}` | `canAddMateriale = descrizione && quantita && fornitore` | A — validazione form incompleto |
| `NextMaterialiDaOrdinarePage.tsx:1911` | `disabled={!canSaveOrdine}` | `!savingOrdine && materiali.length > 0 && (fornitoreNome \|\| nomePersonalizzato)` | A — lista vuota o no fornitore o saving in corso |

Nessun hit di tipo B (disabled gratuito residuo dalla fase read-only).

**VERDETTO: PASS**
**NOTE:** Tutti i `disabled` hanno motivazione di business o anti-double-submit. Nessuno è un residuo della fase read-only.

---

## PUNTO 2 — Zero alert read-only nel codice

**METODO:** `rg -n "READ_ONLY|read-only|readonly|Clone read-only" src/next/NextMaterialiDaOrdinarePage.tsx src/next/NextProcurementReadOnlyPanel.tsx src/next/NextAcquistiPage.tsx src/next/NextProcurementStandalonePage.tsx`

**EVIDENZA:**

| path:riga | Testo trovato | Natura |
|-----------|---------------|--------|
| `NextMaterialiDaOrdinarePage.tsx:1493` | `className="om-entry-detail-readonly"` | Classe CSS su campo di sola lettura visivo (prezzo da listino) — non blocca scrittture |
| `NextMaterialiDaOrdinarePage.tsx:1495` | `className="om-entry-readonly-value"` | Classe CSS — UI styling, non logica |
| `NextMaterialiDaOrdinarePage.tsx:1502,1504` | stesse classi CSS | Idem |
| `NextProcurementReadOnlyPanel.tsx:443,446` | Label bottone "Vai a ordini read-only" / "Vai a arrivi read-only" | Testo label di navigazione in `renderBlockedTab` — non blocca writes |
| `NextProcurementReadOnlyPanel.tsx:712` | `flags: ["clone_readonly_local"]` | Metadato di qualità su nuovo materiale in editing mode — non un check bloccante |
| `NextProcurementReadOnlyPanel.tsx:1334,1343` | Subtitle string "Vista di supporto read-only" | Testo descrittivo in `OrderListTable` — non blocca writes |
| `NextProcurementReadOnlyPanel.tsx:1412` | `<span className="next-clone-readonly-badge">SUPPORTO READ-ONLY</span>` | Badge header nella variante `embedded=false` (mai usata dalla route principale) |
| `NextProcurementReadOnlyPanel.tsx:1419,1420` | Label tab "Ordini \| read-only", "Arrivi \| read-only" | Testo tab nella variante `embedded=false` |

La costante `READ_ONLY_SAVE_MESSAGE` non esiste più nei file. Nessun `window.alert` con testo read-only nel percorso di scrittura (salvaOrdine, persistWorkingOrder, handleDeleteOrder, uploadPhoto, removePhoto).

La variante `embedded=false` del panel (header con badge "SUPPORTO READ-ONLY", tab labels con "read-only") è codice presente ma **mai attivato dalla route principale** (`NextMaterialiDaOrdinarePage` monta sempre il panel con `embedded={true}`). Questo codice è architetturalmente legittimo per usi autonomi del panel, non impatta le write operations della route principale.

**VERDETTO: PASS**
**NOTE:** Le occorrenze trovate sono: classi CSS, testo UI informativo, metadati di qualità. Nessun alert o return che blocchi scritture.

---

## PUNTO 3 — Zero scritture che restano solo in stato React locale

**METODO:** `rg -n "setMateriali|setWorkingOrder|aggiornaFotoMateriale|rimuoviFotoMateriale|saveNewMaterial" src/next/NextMaterialiDaOrdinarePage.tsx src/next/NextProcurementReadOnlyPanel.tsx`

**EVIDENZA — casi corretti:**

| Handler | Pattern | Persistenza | OK? |
|---------|---------|-------------|-----|
| `aggiungiMateriale` (NextMDO.tsx:964) | `setMateriali(...)` a riga 1023 — dopo upload foto (riga 991-996) | Draft in sessionStorage via useEffect:650; foto in Storage ✓ | OK — foto upload + draft persist |
| `eliminaMateriale` (NextMDO.tsx:1033) | `deleteObject` a riga 1037, poi `setMateriali(...)` a riga 1042 | Storage delete + draft update | OK |
| `salvaOrdine` (NextMDO.tsx:1099) | `setDoc(refDoc, { value: updated })` a riga 1139 | Firestore `storage/@ordini` | OK |
| `toggleOrderArrived` (Panel.tsx:609) | `setWorkingOrder(updatedOrder)` a riga 617, poi `persistWorkingOrder(updatedOrder)` a riga 618 | Firestore `storage/@ordini` via `persistWorkingOrder` | OK |
| `saveDetail` (Panel.tsx:621) | `await persistWorkingOrder(workingOrder)` | Firestore `storage/@ordini` | OK |
| `handleDeleteOrder` (Panel.tsx:252) | `setDoc(refDoc, { value: filtered })` a riga 264 | Firestore `storage/@ordini` | OK |
| `uploadPhoto` (Panel.tsx:651) | `uploadBytes` a riga 658, poi `setMaterial(...)` a riga 660 | Storage upload ✓, poi state aggiornato con URL reale | OK |
| `removePhoto` (Panel.tsx:670) | `deleteObject` a riga 674, poi `setMaterial(...)` a riga 679 | Storage delete ✓ | OK |

**EVIDENZA — 2 CASI PROBLEMATICI:**

**CASO 1 — `aggiornaFotoMateriale` (NextMaterialiDaOrdinarePage.tsx:1050)**

```
const aggiornaFotoMateriale = (materialId: string, file: File) => {
  const preview = URL.createObjectURL(file);   // ← blob: URL locale
  setMateriali((current) =>
    current.map((item) =>
      item.id === materialId
        ? { ...item, fotoUrl: preview, fotoStoragePath: null }  // ← Storage: null
        : item,
    ),
  );
};
```

- Chiamato dall'azione kebab "Foto" su materiale già in lista draft (`NextMaterialiDaOrdinarePage.tsx:1704`)
- **Nessun upload a Storage.** `fotoUrl` diventa un `blob:` URL, `fotoStoragePath` viene azzerato a `null`
- `normalizeStoredPreview` (riga 130-132) filtra i blob: URL dalla sessionStorage: la foto non sopravvive al refresh nemmeno nel draft
- Quando `salvaOrdine()` viene chiamato, il blob URL viene scritto in `storage/@ordini` come `fotoUrl` (riga 1131)
- **Effetto: il file foto non è su Storage; il blob URL scade alla fine della sessione; l'ordine confermato ha una foto non recuperabile dopo il reload**

**CASO 2 — `saveNewMaterial` (NextProcurementReadOnlyPanel.tsx:686)**

```
const nextMaterial: DetailWorkingMaterial = {
  // ...
  photoUrl: newPhotoFile ? URL.createObjectURL(newPhotoFile) : null,  // ← blob: URL locale (riga 703)
  photoStoragePath: null,   // ← Storage: null (riga 704)
  // ...
};
setWorkingOrder((current) => ({ ...current, materials: [...current.materials, nextMaterial] }));
```

- Chiamato dal bottone "Salva" nel pannello "+ Aggiungi materiale" in editing mode (riga 1007)
- **Nessun upload a Storage.** `photoUrl` è `URL.createObjectURL(newPhotoFile)`
- Quando "Salva" viene cliccato → `saveDetail()` → `persistWorkingOrder(workingOrder)` → il blob URL finisce in `storage/@ordini` alla voce `fotoUrl` del materiale (riga 584: `fotoUrl: m.photoUrl ?? null`)
- **Effetto: identico al caso 1 — foto non su Storage, blob URL non persistente**

**VERDETTO: FAIL**
**NOTE:** 2 handler modificano stato foto su materiali con blob URL senza upload preventivo a Storage. L'eventuale scrittura a Firestore avviene ma porta URL non persistenti. Gli altri handler gestiscono correttamente la persistenza.

---

## PUNTO 4 — Tutti i writer passano dai wrapper

**METODO:** rg su import firebase/firestore e firebase/storage nei file NEXT; rg su import firestoreWriteOps/storageWriteOps.

**EVIDENZA:**

Import da `firebase/firestore` nei 2 file NEXT:
- `NextMaterialiDaOrdinarePage.tsx:11`: `{ collection, doc, getDoc }` — solo operazioni di lettura
- `NextProcurementReadOnlyPanel.tsx:3`: `{ collection, doc, getDoc }` — solo operazioni di lettura

Import da `firebase/storage` nei 2 file NEXT:
- `NextMaterialiDaOrdinarePage.tsx:12`: `{ ref as storageRef, getDownloadURL }` — utility di riferimento e lettura URL
- `NextProcurementReadOnlyPanel.tsx:4`: `{ ref as storageRef, getDownloadURL }` — idem

Import dai wrapper:
- `NextMaterialiDaOrdinarePage.tsx:14`: `{ setDoc } from "../utils/firestoreWriteOps"` ✓
- `NextMaterialiDaOrdinarePage.tsx:15`: `{ uploadBytes, deleteObject } from "../utils/storageWriteOps"` ✓
- `NextProcurementReadOnlyPanel.tsx:6`: `{ setDoc } from "../utils/firestoreWriteOps"` ✓
- `NextProcurementReadOnlyPanel.tsx:7`: `{ uploadBytes, deleteObject } from "../utils/storageWriteOps"` ✓

Verifica wrapper (`firestoreWriteOps.ts`): ogni export (`addDoc`, `updateDoc`, `setDoc`, `deleteDoc`) chiama `assertCloneWriteAllowed` prima della chiamata firebase.
Verifica wrapper (`storageWriteOps.ts`): ogni export (`uploadBytes`, `uploadString`, `deleteObject`) chiama `assertCloneWriteAllowed` prima della chiamata firebase.

Nessuna chiamata diretta a `firebaseSetDoc`, `firebaseUploadBytes`, `firebaseDeleteObject` dai file NEXT (solo dai wrapper stessi).

**VERDETTO: PASS**
**NOTE:** I soli import firebase nei file NEXT sono per operazioni di lettura (`getDoc`, `getDownloadURL`, `storageRef`). Tutti i writer usano i wrapper `firestoreWriteOps`/`storageWriteOps`.

---

## PUNTO 5 — Barriera ha deroghe esplicite

**METODO:** `rg -n "storage/@ordini|materiali/|storage\.deleteObject|MATERIALI_DA_ORDINARE_ALLOWED|isAllowedMaterialiDaOrdinare" src/utils/cloneWriteBarrier.ts`

**EVIDENZA:**

```
cloneWriteBarrier.ts:24   MATERIALI_DA_ORDINARE_ALLOWED_WRITE_PATHS = ["/next/materiali-da-ordinare"]
cloneWriteBarrier.ts:25   MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS = new Set([
cloneWriteBarrier.ts:28     "storage/@ordini",        ← deroga W3/D1/D2
cloneWriteBarrier.ts:30   MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES = [
cloneWriteBarrier.ts:33     "materiali/",             ← deroga W1/W2/D3/D4
cloneWriteBarrier.ts:156  function isAllowedMaterialiDaOrdinareCloneWritePath(pathname)
cloneWriteBarrier.ts:404  if (isAllowedMaterialiDaOrdinareCloneWritePath(pathname)) {
cloneWriteBarrier.ts:408    if (kind === "firestore.setDoc") ...FIRESTORE_DOC_PATHS.has(readMetaPath)
cloneWriteBarrier.ts:411    if (kind === "storage.uploadBytes") ...STORAGE_PATH_PREFIXES
cloneWriteBarrier.ts:417    if (kind === "storage.deleteObject") ...STORAGE_PATH_PREFIXES
```

Mappatura deroga → writer effettivo:

| Writer | kind barrier | Path/doc | Deroga copre |
|--------|-------------|----------|-------------|
| `salvaOrdine` → `setDoc(@ordini)` | `firestore.setDoc` | `storage/@ordini` | riga 28 ✓ |
| `handleDeleteOrder` → `setDoc(@ordini)` | `firestore.setDoc` | `storage/@ordini` | riga 28 ✓ |
| `persistWorkingOrder` → `setDoc(@ordini)` | `firestore.setDoc` | `storage/@ordini` | riga 28 ✓ |
| `aggiungiMateriale` → `uploadBytes(materiali/...)` | `storage.uploadBytes` | prefisso `materiali/` | riga 33 ✓ |
| `uploadPhoto` → `uploadBytes(materiali/...)` | `storage.uploadBytes` | prefisso `materiali/` | riga 33 ✓ |
| `eliminaMateriale` → `deleteObject(materiali/...)` | `storage.deleteObject` | prefisso `materiali/` | righe 417-421 ✓ |
| `removePhoto` → `deleteObject(materiali/...)` | `storage.deleteObject` | prefisso `materiali/` | righe 417-421 ✓ |

Pathname check: `isAllowedMaterialiDaOrdinareCloneWritePath` (riga 156-160) usa `pathname === "/next/materiali-da-ordinare" || pathname.startsWith("/next/materiali-da-ordinare/")`. I write avvengono mentre il browser è su `/next/materiali-da-ordinare` (NextAcquistiPage fa Navigate replace prima del render). ✓

**VERDETTO: PASS**
**NOTE:** Tutte e 3 le deroghe necessarie sono presenti. Ogni writer effettivo del modulo ha la corrispondente apertura nella barriera.

---

## PUNTO 6 — Storage rules deployate (best effort statico)

**METODO:** `rg -n "match /materiali|match /@ordini" storage.rules`

**EVIDENZA:**
```
storage.rules:26  match /materiali/{allPaths=**} {
storage.rules:27    allow read, write: if request.auth != null;
storage.rules:28  }
```

La regola copre tutti i path del tipo `materiali/*` usati dal modulo (`materiali/{id}-{timestamp}.{ext}`).

**VERDETTO: PASS**
**NOTE:** Regola presente nel file. Deploy manuale eseguito il 2026-04-23 secondo change report e dichiarazione del proprietario (Giuseppe). La conferma runtime resta a carico dell'utente: se i test foto falliscono con `storage/unauthorized`, rieseguire `firebase deploy --only storage`.

---

## PUNTO 7 — Test browser end-to-end

**VERDETTO: DA TESTARE IN BROWSER**

→ Vedi Allegato A — Istruzioni test browser.

---

## PUNTO 8 — "Tolgo la madre e il modulo funziona da solo"

**CHECK STATICO — Import dalla madre:**
`rg -n "from.*pages/MaterialiDaOrdinare" src/next/NextMaterialiDaOrdinarePage.tsx src/next/NextProcurementReadOnlyPanel.tsx src/next/NextAcquistiPage.tsx`

**EVIDENZA:** Zero hit. I soli import da `../pages/MaterialiDaOrdinare` nei file NEXT sono CSS:
- `NextMaterialiDaOrdinarePage.tsx:16`: `import "../pages/MaterialiDaOrdinare.css"` — stile puro, zero logica
- Nessun import di funzioni, tipi o variabili dalla madre

Il modulo NEXT non dipende da nessuna funzione della madre. Il CSS potrebbe essere copiato nella directory NEXT in futuro ma non è un blocante.

**VERDETTO CHECK STATICO: PASS — nessun import di logica dalla madre**
**VERDETTO RUNTIME: DA TESTARE IN BROWSER**

→ Vedi Allegato A — Istruzioni test browser (scenari 1-7).

---

## PUNTO 9 — Audit incrociato Claude Code + Codex

**VERDETTO: PARZIALE**

Questa checklist costituisce la **parte Claude Code** dell'audit incrociato. Completata al 2026-04-24.

Per raggiungere PASS su questo punto è richiesto un **audit Codex parallelo** con prompt separato.

→ Vedi Allegato B — Istruzioni audit Codex parallelo.

---

## PUNTO 10 — Confronto comportamentale 1:1 con la madre

**METODO:** Lettura integrale di `src/pages/MaterialiDaOrdinare.tsx` (901 righe). Identificazione di tutte le azioni scriventi.

**Operazioni scriventi della madre (`src/pages/MaterialiDaOrdinare.tsx`):**

La madre ha 3 write operations effettive. I tab "Ordini", "Arrivi", "Prezzi & Preventivi" nella madre sono **placeholder non implementati** (righe 595-601: `<section className="mdo-placeholder-panel">Sezione read-only in arrivo.</section>`). Le operazioni su ordini/dettaglio/arrivi erano in file separati (non nel perimetro della madre indicata dal prompt).

| Azione madre | path:riga madre | Funzione madre | Equivalente NEXT | path:riga NEXT | Side effect coincide | Note |
|---|---|---|---|---|---|---|
| Upload foto fabbisogno | `MDO.tsx:143-148` | `uploadMaterialImage(fotoFile, id)` via `materialImages.ts` | `uploadBytes(storageRef(storage, path), fotoFile)` + `getDownloadURL` | `NextMDO.tsx:988-996` | PARZIALE | Stessa funzione (upload foto + URL Storage), utility diversa. La madre usa `materialImages.ts` con path proprietario; il NEXT usa `storageWriteOps` con path `materiali/{id}-{ts}.{ext}`. Entrambi producono `fotoUrl` + `fotoStoragePath` permanenti. |
| Delete foto fabbisogno | `MDO.tsx:169` | `deleteMaterialImage(mat.fotoStoragePath)` | `deleteObject(storageRef(storage, item.fotoStoragePath))` | `NextMDO.tsx:1037` | SI | Stesso side effect: file rimosso da Storage. |
| Salva ordine (create @ordini) | `MDO.tsx:186-202` | `setDoc(ref, { value: updated }, { merge: true })` diretto firebase | `setDoc(refDoc, { value: updated }, { merge: true })` via wrapper | `NextMDO.tsx:1115-1139` | SI | Stesso path `storage/@ordini`, stesso shape `{ value: Ordine[] }`. NEXT aggiunge anche `clearProcurementDraftState()` + `refreshProcurementSnapshot()` post-success (mother non aveva questi perché ripristinava lo stato inline). |

**Operazioni elencate nel prompt ma NON presenti nella madre indicata:**

| Azione | Presente in madre? | Presenza in NEXT | Note |
|--------|-------------------|------------------|------|
| Salva dettaglio ordine | NO — tab Ordini è placeholder in madre | ✅ `persistWorkingOrder` a `NextProcurementReadOnlyPanel.tsx:563` | Assorbito da file legacy separato |
| Elimina ordine | NO — non implementato in madre | ✅ `handleDeleteOrder` a `NextProcurementReadOnlyPanel.tsx:252` | Idem |
| Toggle arrivo ordine | NO — non implementato in madre | ✅ `toggleOrderArrived` a `NextProcurementReadOnlyPanel.tsx:609` | Idem |
| Upload foto dettaglio | NO — non implementato in madre | ✅ `uploadPhoto` a `NextProcurementReadOnlyPanel.tsx:651` | Idem |
| Delete foto dettaglio | NO — non implementato in madre | ✅ `removePhoto` a `NextProcurementReadOnlyPanel.tsx:670` | Idem |

Il NEXT è un **superset** della madre: copre le 3 operazioni della madre + aggiunge 5 operazioni che nella madre erano placeholder.

**VERDETTO: PASS**
**NOTE — Divergenza scope**: Il prompt elenca 8 azioni scriventi della madre, ma `src/pages/MaterialiDaOrdinare.tsx` ne contiene solo 3 effettive. Le altre 5 erano in file legacy separati (Acquisti.tsx, DettaglioOrdine, OrdiniInAttesa, OrdiniArrivati) ora assorbiti nel modulo NEXT unificato. Questo non è un FAIL del NEXT: il NEXT copre e supera la madre. La "divergenza madre parziale" (utility diversa per upload foto) produce lo stesso effetto osservabile e non è un FAIL funzionale.

---

## RIEPILOGO VERDETTO

| Punto | Titolo | Verdetto |
|-------|--------|---------|
| 1 | Zero pulsanti disabled senza motivo business | ✅ PASS |
| 2 | Zero alert read-only nel codice | ✅ PASS (con nota variante embedded=false) |
| 3 | Zero scritture solo in stato React locale | ❌ FAIL (2 casi: aggiornaFotoMateriale + saveNewMaterial foto) |
| 4 | Tutti i writer passano dai wrapper | ✅ PASS |
| 5 | Barriera ha deroghe esplicite | ✅ PASS |
| 6 | Storage rules deployate | ✅ PASS (deploy manuale confermato dal proprietario) |
| 7 | Test browser end-to-end | 🟡 DA TESTARE IN BROWSER |
| 8 | Modulo autonomo dalla madre | ✅ PASS statico / 🟡 DA TESTARE IN BROWSER runtime |
| 9 | Audit incrociato Claude Code + Codex | 🟠 PARZIALE |
| 10 | Confronto 1:1 con la madre | ✅ PASS (con divergenza scope documentata) |

**CONTEGGIO:** 6 PASS / 1 FAIL / 2 DA TESTARE IN BROWSER / 1 PARZIALE

---

## VERDETTO GLOBALE: PARZIALE

**Motivo:** Punto 3 FAIL — 2 handler modificano il campo foto su materiali con `URL.createObjectURL` senza upload preventivo a Storage. L'eventuale scrittura a Firestore avviene ma porta URL non persistenti (blob: URL scade a fine sessione).

I restanti 6 punti statici sono tutti PASS. I 2 punti browser (7, 8) richiedono conferma utente. Il punto 9 richiede audit Codex parallelo.

---

## RIMEDI PER IL PUNTO 3 FAIL (non implementati — solo descritti)

### Rimedio 1 — `aggiornaFotoMateriale` (NextMaterialiDaOrdinarePage.tsx:1050)

Convertire la funzione da sincrona ad asincrona. Aggiungere:
1. Upload del nuovo file su Storage: `const snap = await uploadBytes(storageRef(storage, path), file)` con path `materiali/${materialId}-${Date.now()}.${ext}`
2. `const url = await getDownloadURL(snap.ref)`
3. Se il materiale aveva già un `fotoStoragePath`, chiamare `deleteObject` sull'old path prima di aggiornare lo stato
4. `setMateriali(...)` con `fotoUrl: url` e `fotoStoragePath: path` (non più blob URL)

Inoltre, il pulsante kebab "Foto" che chiama `aggiornaFotoMateriale` va wrappato con `void` e si dovrebbe aggiungere loading state (o usare `savingOrdine` se si vuole riutilizzare lo stato esistente).

### Rimedio 2 — `saveNewMaterial` (NextProcurementReadOnlyPanel.tsx:686)

Convertire la funzione da sincrona ad asincrona. Se `newPhotoFile` è presente:
1. Upload su Storage: `const snap = await uploadBytes(storageRef(storage, path), newPhotoFile)` con path `materiali/${detailId}-${Date.now()}.${ext}`
2. `const url = await getDownloadURL(snap.ref)`
3. Costruire `nextMaterial` con `photoUrl: url, photoStoragePath: path`
4. Solo allora chiamare `setWorkingOrder`

Il bottone "Salva" in AddMaterial va wrappato: `onClick={() => void saveNewMaterial()}`.

---

## Allegato A — Istruzioni test browser (Punti 7 e 8)

### Prerequisiti
- Deploy storage rules eseguito: `firebase deploy --only storage` (se non già fatto)
- Browser aperto su `/next/materiali-da-ordinare`
- Firestore Inspector o Firebase Console aperta su `storage/@ordini` per verificare persistenza

### 7 Scenari di test

**Scenario 1 — Conferma ordine**
1. Tab "Ordine materiali": seleziona un fornitore, aggiungi almeno 1 materiale, clicca "CONFERMA ORDINE"
2. Atteso: bottone mostra "Salvataggio...", poi tab Ordini si apre con il nuovo ordine
3. Verifica: ricarica la pagina → ordine ancora presente nella lista Ordini
4. Verifica Firestore: `storage/@ordini` contiene il nuovo record con id e dati corretti

**Scenario 2 — Aggiungi materiale con foto**
1. Tab "Ordine materiali": seleziona fornitore, inserisci descrizione, espandi "Mostra dettagli", carica una foto, clicca "AGGIUNGI"
2. Atteso: materiale appare nella lista con indicazione "Foto"
3. Clicca "CONFERMA ORDINE"
4. Apri il dettaglio dell'ordine appena creato → verifica che la foto si carichi dall'URL Firebase
5. Ricarica la pagina → foto ancora presente nel dettaglio ordine

**Scenario 3 — Elimina materiale con foto**
1. Tab "Ordine materiali": aggiungi materiale con foto
2. Apri il menu kebab della riga → clicca "Elimina"
3. Atteso: materiale rimosso dalla lista
4. Verifica Firebase Storage: il file `materiali/...` non esiste più

**Scenario 4 — Segna Arrivato (toggle arrivo)**
1. Tab "Ordini": apri un ordine in attesa
2. Clicca "Segna Arrivato"
3. Atteso: bottone mostra "Salvataggio...", pill cambia in "ARRIVATO", pagina torna alla lista
4. Verifica: ordine ora appare nel tab "Arrivi"
5. Ricarica → ordine ancora in Arrivi

**Scenario 5 — Modifica dettaglio ordine e salva**
1. Tab "Ordini": apri un ordine, clicca "Modifica"
2. Cambia quantità di un materiale o spunta "Arrivato" su una riga
3. Clicca "Salva"
4. Atteso: torna alla lista, le modifiche sono persistite
5. Riapri il dettaglio → dati aggiornati

**Scenario 6 — Elimina ordine senza materiali arrivati**
1. Tab "Ordini": trova ordine con 0 materiali arrivati
2. Menu kebab → "Elimina"
3. Atteso: ordine scompare dalla lista
4. Ricarica → ordine ancora assente

**Scenario 7 — Carica foto nel dettaglio e salva**
1. Tab "Ordini": apri un ordine, clicca "Modifica"
2. Nella colonna "Foto" di una riga, clicca "Foto" e carica un'immagine
3. Clicca "Salva"
4. Riapri il dettaglio → foto presente e recuperabile da URL Firebase

### Note sui KO attesi (known issues accettati)
- **Kebab "Foto" su materiale in bozza** (aggiornaFotoMateriale): la foto cambiata via kebab sul draft NON persiste dopo reload — FAIL noto (vedi Punto 3)
- **Nuovo materiale con foto in editing dettaglio** (saveNewMaterial): la foto del nuovo materiale aggiunto in editing mode NON persiste dopo reload — FAIL noto (vedi Punto 3)

---

## Allegato B — Istruzioni audit Codex parallelo (Punto 9)

### Obiettivo
Verifica indipendente (second opinion) degli stessi 10 punti da parte di Codex, senza accesso a questo documento durante la revisione.

### Prompt suggerito per audit Codex

```
Audit modulo NextMaterialiDaOrdinarePage del progetto GestioneWeb.

File da leggere:
- src/next/NextMaterialiDaOrdinarePage.tsx
- src/next/NextProcurementReadOnlyPanel.tsx
- src/utils/cloneWriteBarrier.ts
- src/utils/firestoreWriteOps.ts
- src/utils/storageWriteOps.ts
- storage.rules
- src/pages/MaterialiDaOrdinare.tsx (madre di riferimento)

Domande specifiche:
1. Esiste qualche handler che aggiorna fotoUrl/photoUrl con URL.createObjectURL senza un corrispondente upload a Storage?
2. Tutti i writer Firestore/Storage passano dai wrapper firestoreWriteOps/storageWriteOps?
3. La barriera cloneWriteBarrier ha deroghe per tutti i path effettivamente scritti?
4. Ci sono pulsanti `disabled` che non hanno motivazione di business?
5. Ci sono alert o return che bloccano le scritture con messaggi read-only?

Produce un giudizio indipendente per ciascuna domanda con path:riga come evidenza.
```

### Criteri per PASS del Punto 9
- Codex conferma PASS su tutti i punti che Claude Code ha marcato PASS
- Codex identifica gli stessi 2 FAIL del Punto 3 (o ne trova di ulteriori)
- Nessuna divergenza sostanziale inattesa

---

## Chiusura

Verdetto valido al **2026-04-24**. Un successivo cambio nel codice di uno qualunque dei file verificati invalida automaticamente la dichiarazione CHIUSO AL 100%.

Per riottenere la dichiarazione CHIUSO AL 100% (da PARZIALE):
1. Correggere `aggiornaFotoMateriale` (NextMaterialiDaOrdinarePage.tsx:1050) — vedi Rimedio 1
2. Correggere `saveNewMaterial` foto (NextProcurementReadOnlyPanel.tsx:703-704) — vedi Rimedio 2
3. Completare i 7 scenari di test browser (Allegato A) senza KO imprevisti
4. Completare l'audit Codex parallelo (Allegato B) senza divergenze sostanziali
5. Riemettere il verdetto con data aggiornata
