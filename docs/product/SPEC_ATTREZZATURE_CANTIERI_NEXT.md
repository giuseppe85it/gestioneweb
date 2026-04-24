# SPEC COMPORTAMENTALE — ATTREZZATURE CANTIERI NEXT

**Versione:** 1.0  
**Data:** 2026-04-24  
**Autore:** Claude Code (claude-sonnet-4-6)  
**Stato:** CONSOLIDATA - decisioni 2026-04-24 integrate; pronta per verifica Codex vs codice prima dell'implementazione  
**File di riferimento principale:** `src/pages/AttrezzatureCantieri.tsx` (madre, intoccabile)

---

## SEZIONE 1 — SCOPO E PERIMETRO

### 1.1 Obiettivo

Questa SPEC descrive il comportamento che il modulo Attrezzature Cantieri NEXT (`/next/attrezzature-cantieri`) deve acquisire per diventare scrivente e superare la checklist "CHIUSO AL 100%". Il modulo oggi espone esclusivamente lettura: cinque pulsanti sono bloccati e nessun writer è collegato. L'obiettivo è collegare i writer mancanti con le stesse garanzie strutturali già adottate per Materiali da ordinare (2026-04-23).

### 1.2 Confini del perimetro

La SPEC copre esclusivamente:
- I writer da aggiungere al file NEXT (o a un nuovo file NEXT dedicato ai writer)
- Le deroghe da aggiungere a `src/utils/cloneWriteBarrier.ts`
- La regola Storage da aggiungere a `storage.rules`

Restano fuori dal perimetro e intoccabili:
- `src/pages/AttrezzatureCantieri.tsx` (madre)
- `src/next/domain/nextAttrezzatureCantieriDomain.ts` (reader canonico — shape e logica di lettura non modificati)
- `src/utils/materialImages.ts` (vietato nei writer NEXT — vedi Sezione 10)
- Qualsiasi altra utility shared non esplicitamente citata

### 1.3 Cosa il modulo NEXT NON deve fare

- Importare da `src/utils/materialImages.ts`
- Importare direttamente da `firebase/firestore` o `firebase/storage` nei writer (eccezione ammessa: `getDownloadURL` da `firebase/storage`)
- Usare `storageSync.setItemSync` nei writer (la madre la usa; il NEXT scrive direttamente su Firestore via `firestoreWriteOps.setDoc`)
- Persistere URL blob (`URL.createObjectURL`) in stati che finiscono su Firestore

---

## SEZIONE 2 — STATO ATTUALE NEXT (VERIFICA 2026-04-24)

### 2.1 File coinvolti

| File | Ruolo | Righe |
|------|-------|-------|
| `src/next/NextAttrezzatureCantieriPage.tsx` | Wrapper page — scaffolding + hook lettura | 36 |
| `src/next/NextAttrezzatureCantieriReadOnlyPanel.tsx` | Pannello read-only — UI con pulsanti disabled | 249 |
| `src/next/domain/nextAttrezzatureCantieriDomain.ts` | Reader canonico + tipi + builder snapshot (548 righe) | 548 |
| `src/next/useNextOperativitaSnapshot.ts` | Hook lettura snapshot globale operatività | 43 |

### 2.2 Route montata in App.tsx

| File | Riga | Dettaglio |
|------|------|-----------|
| `src/App.tsx` | 45 | `import NextAttrezzatureCantieriPage from "./next/NextAttrezzatureCantieriPage"` |
| `src/App.tsx` | 269 | `path="attrezzature-cantieri"` (`src/App.tsx:269`) — sotto il parent `/next` → percorso completo `/next/attrezzature-cantieri` |
| `src/App.tsx` | 271-273 | Wrappato in `<NextRoleGuard areaId="operativita-globale">` (`src/App.tsx:271-273`) |

Il percorso `/next/attrezzature-cantieri` è la route da dichiarare nelle deroghe barriera (Sezione 7).

### 2.3 Hook lettura

`useNextOperativitaSnapshot` (`src/next/useNextOperativitaSnapshot.ts:7`) carica lo snapshot globale operatività chiamando `readNextOperativitaGlobaleSnapshot()`. Non espone una funzione di refresh. L'attrezzature snapshot è in `snapshot.attrezzature` (tipo `NextAttrezzatureCantieriSnapshot`).

**Decisione implementativa:** dopo ogni write, il modulo deve ricaricare i dati aggiornati chiamando direttamente `readNextAttrezzatureCantieriSnapshot()` dal write panel NEXT. L'hook globale `useNextOperativitaSnapshot` non viene modificato.

### 2.4 Pulsanti disabled (inventario completo)

Tutti i pulsanti sotto sono in `src/next/NextAttrezzatureCantieriReadOnlyPanel.tsx`:

| Riga | Label visibile | Classe CSS | Contesto | Condizione disabled |
|------|---------------|------------|---------|---------------------|
| 64 | `Salva movimento` | `ac-primary-btn` | Sezione form "Nuovo movimento" | sempre (prop `disabled` hardcoded) |
| 67 | `Upload foto` | `ac-secondary-btn` | Sezione form "Nuovo movimento" | sempre (prop `disabled` hardcoded) |
| 70 | `Elimina` | `ac-danger-btn` | Sezione form "Nuovo movimento" | sempre (prop `disabled` hardcoded) |
| 224 | `Modifica` | `ac-secondary-btn` | Per ogni riga del Registro movimenti | sempre (prop `disabled` hardcoded) |
| 232 | `Elimina` | `ac-danger-btn` | Per ogni riga del Registro movimenti | sempre (prop `disabled` hardcoded) |

**Nota:** nella sezione form (righe 64-70), "Elimina" viene mantenuto nel write panel con semantica di reset completo del form di creazione. Non cancella dati persistiti, non scrive su Firestore e non tocca Storage.

### 2.5 Osservazioni sulla struttura del pannello attuale

Il pannello (`NextAttrezzatureCantieriReadOnlyPanel.tsx`) gestisce internamente il filtraggio (`filterText`, `filterTipo`, `filterCategoria` — righe 19–23) e la paginazione locale (`showAllStato`, `showAllRegistro` — righe 24–25). Non ha state per form di creazione, modale di modifica, o stato di salvataggio. Tutto questo deve essere aggiunto o isolato in un componente separato.

---

## SEZIONE 3 — CONTRATTO DATI

### 3.1 Coordinate Firestore

| Parametro | Valore | Fonte |
|-----------|--------|-------|
| Collection | `"storage"` | `nextAttrezzatureCantieriDomain.ts:4` |
| Doc key | `"@attrezzature_cantieri"` | `nextAttrezzatureCantieriDomain.ts:5` |
| Path Firestore | `"storage/@attrezzature_cantieri"` | derivato |
| Shape di lettura attesa | `{ value: Movimento[] }` o array diretto | `nextAttrezzatureCantieriDomain.ts:125–152` |

### 3.2 Shape del documento letto

La funzione `unwrapStorageArray` (`nextAttrezzatureCantieriDomain.ts:125–152`) gestisce quattro formati di documento Firestore. Il formato che `storageSync.setItemSync` scrive è `{ value: [...] }` (datasetShape `"value"`). Il NEXT writer deve scrivere `{ value: Movimento[] }` per garantire compatibilità con il reader esistente.

### 3.3 Shape del singolo `Movimento` (contratto dati definitivo)

Fonte primaria: `AttrezzatureCantieri.tsx:26–41` (tipo `Movimento` madre).  
Fonte secondaria: `nextAttrezzatureCantieriDomain.ts:35–56` (tipo `NextAttrezzaturaMovimentoReadOnlyItem`).

| Campo | Tipo | Obbligatorio | Default madre | Note |
|-------|------|-------------|---------------|------|
| `id` | `string` | obbligatorio | `buildId()` = `${Date.now()}_${Math.random().toString(16).slice(2)}` (`AttrezzatureCantieri.tsx:109–111`) | Il NEXT deve generare un id univoco; il domain reader usa `"attrezzatura:${index}"` come fallback per record senza id (`nextAttrezzatureCantieriDomain.ts:225`) |
| `tipo` | `"CONSEGNATO" \| "SPOSTATO" \| "RITIRATO"` | obbligatorio | — | `AttrezzatureCantieri.tsx:19–20`; stesso enum in `nextAttrezzatureCantieriDomain.ts:7–11` |
| `data` | `string` (formato `"DD MM YYYY"`) | obbligatorio per tracking completo | `oggi()` = `"DD MM YYYY"` (`AttrezzatureCantieri.tsx:82–88`) | Il domain legge `data`, `createdAt`, `updatedAt` come fallback (`nextAttrezzatureCantieriDomain.ts:265–272`) |
| `materialeCategoria` | `string` | raccomandato | `"TUBI"` (`AttrezzatureCantieri.tsx:434`) | Valori categoria madre: `["TUBI", "MATERIALI", "ALTRO"]` (`AttrezzatureCantieri.tsx:22`) |
| `descrizione` | `string` | obbligatorio | — | Validazione: `descrizione.trim()` non vuoto (`AttrezzatureCantieri.tsx:390–394`) |
| `quantita` | `number` | obbligatorio | — | Validazione: `Number.isFinite(quantita) && quantita > 0` (`AttrezzatureCantieri.tsx:396–400`) |
| `unita` | `string` | obbligatorio | — | Valori madre: `["m", "pz", "kg", "set", "altro"]` (`AttrezzatureCantieri.tsx:23–24`); se `"altro"` usare valore libero |
| `cantiereId` | `string` | raccomandato | — | Può essere vuoto se `cantiereLabel` è valorizzato |
| `cantiereLabel` | `string` | obbligatorio | fallback da `cantiereId` | Validazione: `cantiereLabel` (o `cantiereId`) non vuoto (`AttrezzatureCantieri.tsx:409–413`) |
| `note` | `string \| null` | opzionale | `null` | — |
| `fotoUrl` | `string \| null` | opzionale | `null` | Deve essere URL Firebase permanente, MAI blob URL |
| `fotoStoragePath` | `string \| null` | opzionale | `null` | Path relativo in Firebase Storage, es. `"attrezzature/{id}-{ts}.jpg"` |
| `sourceCantiereId` | `string \| null` | condizionale | `null` | Solo quando `tipo === "SPOSTATO"` (`AttrezzatureCantieri.tsx:443–445`) |
| `sourceCantiereLabel` | `string \| null` | condizionale | `null` | Solo quando `tipo === "SPOSTATO"` (`AttrezzatureCantieri.tsx:447–451`) |

### 3.4 Validazioni minime obbligatorie prima del write

Derivate da `AttrezzatureCantieri.tsx:387–414`:

1. `descrizione.trim()` non vuoto → errore "Inserisci una descrizione."
2. `parseNumero(quantita)` è `Number.isFinite` e `> 0` → errore "Inserisci una quantita valida."
3. `unitaFinale` (risolto da `"altro"` → `unitaAltro.trim()`) non vuoto → errore "Inserisci una unita valida."
4. `cantiereLabel` (o fallback da `cantiereId`) non vuoto → errore "Inserisci un cantiere valido."
5. Se `tipo === "SPOSTATO"`: nessuna validazione aggiuntiva obbligatoria nella madre (ma il domain marca tracking come `"parziale"` se `sourceCantiereLabel` assente — `nextAttrezzatureCantieriDomain.ts:237`)

**Vincolo SPEC:** le validazioni devono avvenire PRIMA di qualsiasi upload foto (Sezione 10, Trappola 4).

---

## SEZIONE 4 — MAPPA COMPORTAMENTALE MADRE → NEXT

Fonte madre: `src/pages/AttrezzatureCantieri.tsx`.  
Tutti i write della madre usano `setItemSync` da `storageSync` (`AttrezzatureCantieri.tsx:3`). Il NEXT usa `firestoreWriteOps.setDoc`.

### 4.1 Crea movimento (con o senza foto)

**Madre:** `handleSave` (`AttrezzatureCantieri.tsx:387–463`)  
**Effetto dati:** aggiunge un `Movimento` all'array in `storage/@attrezzature_cantieri`  
**Pattern madre:**
1. Validazioni form → return su errore
2. `setSaving(true)`
3. Se foto: `uploadMaterialImage(fotoFile, id)` → path `materiali/{id}-{Date.now()}.{ext}` (`materialImages.ts:21`) — **NEXT usa pattern diverso, vedi Sezione 6**
4. Costruisce `record: Movimento` con tutti i campi
5. `setItemSync(KEY_ATTREZZATURE, [...movimenti, record])` (`AttrezzatureCantieri.tsx:454`)
6. Aggiorna stato locale, resetta form

**NEXT deve:**
1. Validare campi PRIMA dell'upload
2. Se foto: `storageWriteOps.uploadBytes` + `getDownloadURL` → path `attrezzature/{id}-{Date.now()}.{ext}`
3. Costruire `record: Movimento` con `fotoUrl` = URL Firebase (MAI blob URL)
4. `firestoreWriteOps.setDoc(doc(db, "storage", "@attrezzature_cantieri"), { value: [...currentItems, record] })`
5. Richiamare refresh snapshot

### 4.2 Elimina movimento

**Madre:** `handleDelete` (`AttrezzatureCantieri.tsx:465–476`)  
**Effetto dati:** rimuove un `Movimento` dall'array  
**Pattern madre:**
1. `window.confirm("Eliminare questo movimento?")`
2. `setItemSync(KEY_ATTREZZATURE, movimenti.filter(m => m.id !== record.id))` (`AttrezzatureCantieri.tsx:469–470`)
3. **NON cancella foto da Storage** — file rimane orfano (omissione nella madre)

**NEXT deve (con miglioramento rispetto alla madre):**
1. Confirm dialog
2. Se `record.fotoStoragePath`: `storageWriteOps.deleteObject` — il NEXT elimina la foto, a differenza della madre
3. `firestoreWriteOps.setDoc(doc(db, "storage", "@attrezzature_cantieri"), { value: currentItems.filter(m => m.id !== record.id) })`
4. Richiamare refresh snapshot

**Differenza UX NEXT vs madre:** il NEXT apre un dialog di conferma ("Sei sicuro di voler eliminare questo movimento?" con pulsanti Conferma/Annulla) prima di invocare il writer. La madre elimina direttamente al click. Vedi Sezione 12.1 D11.

**Nota:** il miglioramento rispetto alla madre (cleanup foto su delete) è intenzionale e non si configura come refactor della madre.

### 4.3 Modifica movimento — rimozione foto

**Madre:** `handleEditRemovePhoto` (`AttrezzatureCantieri.tsx:509–526`)  
**Effetto dati:** cancella foto da Storage, azzera `fotoUrl`/`fotoStoragePath` nel form di editing (operazione locale — la persistenza avviene al `handleEditSave`)  
**Pattern madre:**
1. Se `editForm.fotoStoragePath`: `deleteMaterialImage(editForm.fotoStoragePath)` (`AttrezzatureCantieri.tsx:512–516`)
2. Aggiorna `editForm` locale: `fotoUrl: null`, `fotoStoragePath: null`
3. Resetta `editFotoFile` e `editFotoPreview`

**NEXT deve:**
1. Se `editingRecord.fotoStoragePath` valorizzato: `storageWriteOps.deleteObject`
2. Aggiornare stato editing locale: `fotoUrl: null`, `fotoStoragePath: null`
3. **Non persiste ancora su Firestore** — la persistenza avviene al salvataggio della modifica (Sezione 4.4)

### 4.4 Modifica movimento — salva modifiche (con eventuale sostituzione foto)

**Madre:** `handleEditSave` (`AttrezzatureCantieri.tsx:528–605`)  
**Effetto dati:** sostituisce il `Movimento` con stesso `id` nell'array  
**Pattern madre (con errore di ordine):**
1. Validazioni form
2. Se `editFotoFile` (nuova foto):
   - **Prima** cancella vecchia foto: `deleteMaterialImage(fotoStoragePath)` (`AttrezzatureCantieri.tsx:564–566`) ← **ORDINE SBAGLIATO**
   - **Poi** carica nuova: `uploadMaterialImage(editFotoFile, editForm.id || buildId())` (`AttrezzatureCantieri.tsx:567–569`)
3. Costruisce `updated: Movimento`
4. `setItemSync(KEY_ATTREZZATURE, movimenti.map(m => m.id === updated.id ? updated : m))` (`AttrezzatureCantieri.tsx:595–596`)

**NEXT deve (con ordine corretto — Sezione 10, Trappola 2):**
1. Validazioni form PRIMA di qualsiasi operazione Storage
2. Se `editFotoFile` (nuova foto):
   - **Prima** carica nuova: `storageWriteOps.uploadBytes` + `getDownloadURL` → `newFotoUrl`, `newFotoStoragePath`
   - Se upload fallisce: catch, alert, return — NON procedere
   - **Dopo** upload riuscito: se `record.fotoStoragePath` vecchio valorizzato → `storageWriteOps.deleteObject` (best-effort, errore non bloccante)
3. Costruisce `updated: Movimento` con `fotoUrl = newFotoUrl` (URL Firebase reale, MAI blob URL)
4. `firestoreWriteOps.setDoc(doc(db, "storage", "@attrezzature_cantieri"), { value: currentItems.map(m => m.id === updated.id ? updated : m) })`
5. Richiamare refresh snapshot

### 4.5 Upload foto al nuovo movimento (foto pre-save)

**Madre:** foto caricata durante `handleSave` (non in step separato — `AttrezzatureCantieri.tsx:424–428`)  
**Pattern madre:** l'upload è inline in `handleSave` — se fallisce, la `catch` blocca tutto e nessun record viene scritto  

**NEXT deve:** replicare lo stesso pattern inline — l'upload foto è parte di `createMovimento`, non un'operazione separata.  
Il pulsante "Upload foto" nel pannello attuale (`NextAttrezzatureCantieriReadOnlyPanel.tsx:67`) va ricablato tramite un `<input type="file">` nel form di creazione, come nella madre.

---

## SEZIONE 5 - FIRME WRITER NEXT DEFINITE

Tutti i writer devono risiedere nel pannello scrivente NEXT dedicato `src/next/NextAttrezzatureCantieriWritePanel.tsx` (vedi Sezione 9). Nessuna firma usa `materialImages.ts`. Tutte le dipendenze Firestore passano da `firestoreWriteOps.ts`; tutte le dipendenze Storage da `storageWriteOps.ts`.

### 5.1 `createMovimentoAttrezzatura`

```typescript
async function createMovimentoAttrezzatura(params: {
  tipo: "CONSEGNATO" | "SPOSTATO" | "RITIRATO";
  data: string;
  materialeCategoria: string;
  descrizione: string;
  quantita: number;
  unita: string;
  cantiereId: string;
  cantiereLabel: string;
  note: string | null;
  fotoFile: File | null;
  sourceCantiereId: string | null;
  sourceCantiereLabel: string | null;
}): Promise<void>
```

**Dipendenze:**
- `storageWriteOps.uploadBytes` (firma: `uploadBytes(reference: any, data: any, metadata?: any)` — `storageWriteOps.ts:20`)
- `getDownloadURL` da `firebase/storage` (ammessa come eccezione)
- `firestoreWriteOps.setDoc` (firma: `setDoc(reference: any, data: any, options?: any)` — `firestoreWriteOps.ts:29`)
- `doc` da `firebase/firestore` (solo per costruire la reference — read operation, non write)
- `db` da `../../firebase`

**Ordine operazioni:**
1. Validare tutti i campi (Sezione 3.4) → se errore: `window.alert(messaggio)`, return
2. Generare `id = "${Date.now()}_${Math.random().toString(16).slice(2)}"` (pattern madre `AttrezzatureCantieri.tsx:109–111`)
3. Se `fotoFile`: 
   - Costruire path `"attrezzature/${id}-${Date.now()}.${ext}"`
   - `storageRef(storage, path)` → `storageWriteOps.uploadBytes(ref, fotoFile)`
   - `fotoUrl = await getDownloadURL(ref)`, `fotoStoragePath = path`
   - Se upload fallisce → catch: `window.alert("Errore caricamento foto. Riprova.")`, return
4. Costruire `record: Movimento` con `fotoUrl` e `fotoStoragePath` (URL Firebase reale o `null`)
5. Leggere array corrente: `getDoc(doc(db, "storage", "@attrezzature_cantieri"))`
6. Estrarre items via `unwrapStorageArray` (o equivalente inline)
7. `firestoreWriteOps.setDoc(doc(db, "storage", "@attrezzature_cantieri"), { value: [...items, record] })`
8. Chiamare `onMovimentoSaved()` (callback refresh)

**Comportamento su errore upload foto:** return esplicito prima del passo 4 — nessun record scritto, nessun file orfano.

### 5.2 `deleteMovimentoAttrezzatura`

```typescript
async function deleteMovimentoAttrezzatura(params: {
  record: NextAttrezzaturaMovimentoReadOnlyItem;
  onDeleted: () => void | Promise<void>;
}): Promise<void>
```

**Dipendenze:**
- `storageWriteOps.deleteObject` (firma: `deleteObject(reference: any)` — `storageWriteOps.ts:52`)
- `firestoreWriteOps.setDoc` (`firestoreWriteOps.ts:29`)

**Ordine operazioni:**
1. `window.confirm("Eliminare questo movimento?")` → se no: return
2. Se `record.fotoStoragePath` valorizzato: `storageWriteOps.deleteObject(storageRef(storage, record.fotoStoragePath))` — best-effort, errore non bloccante (log, continua)
3. Leggere array corrente
4. `firestoreWriteOps.setDoc(doc(db, "storage", "@attrezzature_cantieri"), { value: items.filter(m => m.id !== record.id) })`
5. Chiamare `onDeleted()`

### 5.3 `saveEditMovimentoAttrezzatura`

```typescript
async function saveEditMovimentoAttrezzatura(params: {
  originalRecord: NextAttrezzaturaMovimentoReadOnlyItem;
  updatedFields: {
    tipo: "CONSEGNATO" | "SPOSTATO" | "RITIRATO";
    data: string;
    materialeCategoria: string;
    descrizione: string;
    quantita: number;
    unita: string;
    cantiereId: string;
    cantiereLabel: string;
    note: string | null;
    fotoUrl: string | null;
    fotoStoragePath: string | null;
    sourceCantiereId: string | null;
    sourceCantiereLabel: string | null;
  };
  newFotoFile: File | null;
  onSaved: () => void | Promise<void>;
}): Promise<void>
```

**Ordine operazioni (ordine corretto — diverso dalla madre):**
1. Validare `updatedFields` (Sezione 3.4) → se errore: alert, return
2. Inizializzare `fotoUrl = updatedFields.fotoUrl`, `fotoStoragePath = updatedFields.fotoStoragePath`
3. Se `newFotoFile`:
   - Costruire path nuovo `"attrezzature/${originalRecord.id}-${Date.now()}.${ext}"`
   - `storageWriteOps.uploadBytes` → se fallisce: catch, alert, return (NON procedere al delete)
   - `fotoUrl = await getDownloadURL(newRef)`, `fotoStoragePath = newPath`
   - Solo dopo upload riuscito: se `originalRecord.fotoStoragePath` valorizzato → `storageWriteOps.deleteObject` (best-effort)
4. Costruire `updated: Movimento` con `fotoUrl` e `fotoStoragePath` aggiornati
5. Leggere array corrente
6. `firestoreWriteOps.setDoc(doc(db, "storage", "@attrezzature_cantieri"), { value: items.map(m => m.id === updated.id ? updated : m) })`
7. Chiamare `onSaved()`

**Comportamento su record legacy senza id reale:** nel caso di record senza id, il writer genera un nuovo id al volo (pattern `editForm.id || buildId()` come la madre `src/pages/AttrezzatureCantieri.tsx:567`), poi procede con l'edit normalmente.
Nessun alert utente, nessun blocco. L'utente vede l'edit completarsi come su un record normale.

### 5.4 `removeEditFotoAttrezzatura` (operazione locale + Storage)

```typescript
async function removeEditFotoAttrezzatura(params: {
  fotoStoragePath: string | null;
}): Promise<void>
```

**Ordine operazioni:**
1. Se `fotoStoragePath` valorizzato: `storageWriteOps.deleteObject` — best-effort, errore non bloccante
2. Chiamante responsabile di aggiornare lo stato locale del form (`fotoUrl: null`, `fotoStoragePath: null`)

**Nota:** questa funzione non scrive su Firestore — la persistenza avviene solo quando `saveEditMovimentoAttrezzatura` viene invocato.

---

## SEZIONE 6 — PATTERN PATH STORAGE

### 6.1 Pattern definitivo

```
attrezzature/{movimentoId}-{Date.now()}.{ext}
```

**Esempio concreto:** `attrezzature/1714000000000_abc123-1714000001234.jpg`

### 6.2 Giustificazione

Il namespace `materiali/` è già usato da Materiali da ordinare (`cloneWriteBarrier.ts:33`, `materialImages.ts:21`, `storage.rules:26`). Separare il namespace evita collisioni di path e rende il cleanup selettivo. Il pattern `{id}-{Date.now()}` è identico al pattern madre (`materialImages.ts:21`) e al pattern già adottato dal NEXT per Materiali da ordinare.

**Pattern madre (`AttrezzatureCantieri.tsx:425` → `materialImages.ts:21`):**  
`materiali/{materialId}-{Date.now()}.{ext}` — usa `materiali/`, namespace condiviso con altri moduli

**Pattern NEXT Materiali da ordinare:**  
`materiali/{id}-{Date.now()}.{ext}` — stesso namespace `materialImages.ts`

**Pattern NEXT Attrezzature cantieri (definitivo):**  
`attrezzature/{movimentoId}-{Date.now()}.{ext}` — namespace dedicato e isolato

### 6.3 Impatto su storage.rules

Il path `attrezzature/` NON esiste in `storage.rules` (verificato 2026-04-24 — la regola non è presente nel file `storage.rules`). Richiede aggiunta di regola — vedere Sezione 8.

---

## SEZIONE 7 — DEROGHE BARRIERA RICHIESTE

La barriera `src/utils/cloneWriteBarrier.ts` blocca per default qualsiasi scrittura dalla route `/next/`. Non esiste oggi nessuna allowlist per `/next/attrezzature-cantieri` né per la doc key `@attrezzature_cantieri` né per il path Storage `attrezzature/`.

### 7.1 Pattern di riferimento esistente (MaterialiDaOrdinare)

Il pattern da replicare è quello già presente per Materiali da ordinare:

**Nota di verifica:** la forma esatta della deroga (helper dedicata, costanti o altra allowlist) deve replicare il pattern reale di MaterialiDaOrdinare letto in `cloneWriteBarrier.ts`. La FASE 2 deve confermare questo pattern; se il codice reale differisce dalla descrizione qui sotto, va segnalata divergenza prima dello Step C.

```
// Costanti (cloneWriteBarrier.ts:24–34)
MATERIALI_DA_ORDINARE_ALLOWED_WRITE_PATHS = ["/next/materiali-da-ordinare"]
MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS = new Set(["storage/@preventivi", "storage/@listino_prezzi", "storage/@ordini"])
MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES = ["preventivi/manuali/", "preventivi/ia/", "materiali/"]

// Helper (src/utils/cloneWriteBarrier.ts:166-170)
function isAllowedMaterialiDaOrdinareCloneWritePath(pathname: string): boolean {
  return MATERIALI_DA_ORDINARE_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`)
  );
}

// Blocco in isAllowedCloneWriteException (src/utils/cloneWriteBarrier.ts:426-445)
if (isAllowedMaterialiDaOrdinareCloneWritePath(pathname)) {
  if (kind === "firestore.setDoc") { return MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS.has(readMetaPath(meta)); }
  if (kind === "storage.uploadBytes") { ... }
  if (kind === "storage.deleteObject") { ... }
}
```

### 7.2 Allowlist definitive per Attrezzature Cantieri

Le costanti da aggiungere a `cloneWriteBarrier.ts` (dopo le costanti esistenti MATERIALI_DA_ORDINARE, prima della riga `MATERIALI_DA_ORDINARE_ALLOWED_FETCH_ENDPOINT`):

```typescript
// AGGIUNGERE in cloneWriteBarrier.ts dopo la riga ~34
const ATTREZZATURE_CANTIERI_ALLOWED_WRITE_PATHS = ["/next/attrezzature-cantieri"] as const;
const ATTREZZATURE_CANTIERI_ALLOWED_FIRESTORE_DOC_PATHS = new Set([
  "storage/@attrezzature_cantieri",
]);
const ATTREZZATURE_CANTIERI_ALLOWED_STORAGE_PATH_PREFIXES = [
  "attrezzature/",
] as const;
```

La helper function da aggiungere dopo `isAllowedMaterialiDaOrdinareCloneWritePath` (circa riga 160):

```typescript
function isAllowedAttrezzatureCantieriCloneWritePath(pathname: string): boolean {
  return ATTREZZATURE_CANTIERI_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`)
  );
}
```

Il blocco da aggiungere in `isAllowedCloneWriteException` (stile identico al blocco MaterialiDaOrdinare a `src/utils/cloneWriteBarrier.ts:426-445`), inserito prima del blocco `isAllowedMagazzinoCloneWritePath` (circa riga 447):

```typescript
if (isAllowedAttrezzatureCantieriCloneWritePath(pathname)) {
  if (kind === "firestore.setDoc") {
    return ATTREZZATURE_CANTIERI_ALLOWED_FIRESTORE_DOC_PATHS.has(readMetaPath(meta));
  }
  if (kind === "storage.uploadBytes") {
    const path = readMetaPath(meta);
    return ATTREZZATURE_CANTIERI_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
      path.startsWith(prefix)
    );
  }
  if (kind === "storage.deleteObject") {
    const path = readMetaPath(meta);
    return ATTREZZATURE_CANTIERI_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
      path.startsWith(prefix)
    );
  }
}
```

### 7.3 Operazioni autorizzate (riepilogo)

| Route | Operazione | Oggetto |
|-------|-----------|---------|
| `/next/attrezzature-cantieri` | `firestore.setDoc` | `"storage/@attrezzature_cantieri"` |
| `/next/attrezzature-cantieri` | `storage.uploadBytes` | path con prefisso `"attrezzature/"` |
| `/next/attrezzature-cantieri` | `storage.deleteObject` | path con prefisso `"attrezzature/"` |

### 7.4 Operazioni NON necessarie (e perché)

- `firestore.addDoc`: non usato — il pattern è read-modify-write su array in un singolo doc
- `firestore.updateDoc`: non usato — si riscrive sempre il documento intero
- `firestore.deleteDoc`: non usato — si elimina solo il documento completo? No, si filtra l'array e si riscrive
- `storageSync.setItemSync`: non usato — il NEXT scrive direttamente su Firestore

---

## SEZIONE 8 — REQUISITI STORAGE RULES

### 8.1 Stato attuale

Il path `attrezzature/` **non esiste** in `storage.rules`. Verifica effettuata su `storage.rules` (33 righe, 2026-04-24):

| Riga | Regola presente |
|------|----------------|
| 8–10 | `match /euromecc/relazioni/{relazioneId}/{fileName}` |
| 11–13 | `match /documenti_pdf/{allPaths=**}` |
| 14–16 | `match /mezzi_aziendali/{allPaths=**}` |
| 17–19 | `match /libretto/{allPaths=**}` |
| 20–22 | `match /mezzi/{allPaths=**}` |
| 23–25 | `match /preventivi/{allPaths=**}` |
| 26–28 | `match /materiali/{allPaths=**}` |
| 29–31 | `match /{allPaths=**}` → `allow read, write: if false` (catch-all deny) |

Nessun match per `attrezzature/`.

**Decisione consolidata:** il prefisso `attrezzature/` e definitivo per le foto del NEXT e richiede una nuova regola Storage dedicata prima dei test browser.

### 8.2 Regola da aggiungere

Aggiungere PRIMA della riga 29 (catch-all deny), dopo il match `/materiali/`:

```
match /attrezzature/{allPaths=**} {
  allow read, write: if request.auth != null;
}
```

La formulazione è identica a quella già usata per `materiali/` (`storage.rules:26–28`).

### 8.3 Azione richiesta prima dei test browser

```
firebase deploy --only storage
```

Senza questo deploy, tutti gli upload e delete su path `attrezzature/` falliscono con `storage/unauthorized` anche se la barriera è aperta. Deploy obbligatorio prima di qualsiasi test browser sul modulo.

---

## SEZIONE 9 — UI DA COSTRUIRE

### 9.1 Nuovo componente definito

**Scelta: nuovo file dedicato** `src/next/NextAttrezzatureCantieriWritePanel.tsx`

**Motivazione:** il pannello attuale `NextAttrezzatureCantieriReadOnlyPanel.tsx` ha 249 righe e gestisce già filtraggio e paginazione. Aggiungere form di creazione, modale di modifica, loading states e writer callbacks nello stesso file porterebbe il componente a oltre 600 righe e mescolerebbe responsabilità di lettura e scrittura. Il pattern di separazione è già usato nel progetto (es. `NextProcurementReadOnlyPanel.tsx` che gestisce sia lettura che scrittura ma ha origine da un pannello originariamente read-only con storia separata).

Il `NextAttrezzatureCantieriWritePanel.tsx` importerà il pannello read-only come componente figlio o lo sostituirà condizionalmente. `NextAttrezzatureCantieriPage.tsx` sarà aggiornato per montare il write panel invece del read-only panel.

**Vincolo di posizionamento UI:** il pannello read-only esistente non deve essere modificato come scope principale. Sono ammesse solo minime esposizioni di props/callback se necessarie per montare o alimentare il write panel dedicato.

### 9.2 Stato da aggiungere nel write panel

```typescript
// Form creazione nuovo movimento
const [createForm, setCreateForm] = useState<MovimentoFormState>(buildInitialForm());
const [createFotoFile, setCreateFotoFile] = useState<File | null>(null);
const [createFotoPreview, setCreateFotoPreview] = useState<string | null>(null); // blob URL solo per preview locale
const [creating, setCreating] = useState(false);
const [createError, setCreateError] = useState<string | null>(null);

// Modifica movimento esistente
const [editingRecord, setEditingRecord] = useState<NextAttrezzaturaMovimentoReadOnlyItem | null>(null);
const [editForm, setEditForm] = useState<MovimentoFormState | null>(null);
const [editFotoFile, setEditFotoFile] = useState<File | null>(null);
const [editFotoPreview, setEditFotoPreview] = useState<string | null>(null); // blob URL solo per preview locale
const [editSaving, setEditSaving] = useState(false);
const [editError, setEditError] = useState<string | null>(null);

// Snapshot locale aggiornabile post-write
const [localSnapshot, setLocalSnapshot] = useState<NextAttrezzatureCantieriSnapshot | null>(null);

```

Il form di creazione deve usare categorie fisse, in parita 1:1 con la madre: `TUBI`, `MATERIALI`, `ALTRO`. Il default resta `TUBI`. Non e ammessa logica dinamica basata su `snapshot.categories` per il form scrivente.

### 9.3 Refresh post-write

Dopo ogni operazione di write riuscita, il componente deve ricaricare lo snapshot:

```typescript
const refreshAttrezzatureSnapshot = async () => {
  const fresh = await readNextAttrezzatureCantieriSnapshot(); // nextAttrezzatureCantieriDomain.ts:509
  setLocalSnapshot(fresh);
};
```

`readNextAttrezzatureCantieriSnapshot` è già una funzione pubblica nel domain reader (`nextAttrezzatureCantieriDomain.ts:509`). Il write panel può chiamarla direttamente senza modificare il hook.

### 9.4 Ricablaggio pulsanti disabled

Ogni pulsante disabled in `NextAttrezzatureCantieriReadOnlyPanel.tsx` ha un corrispettivo handler da cablare nel write panel:

| Pulsante (riga nel read-only panel) | Handler da collegare |
|-------------------------------------|---------------------|
| "Salva movimento" (riga 64) | `createMovimentoAttrezzatura` (Sezione 5.1) |
| "Upload foto" (riga 67) | Rimpiazzare con `<input type="file">` nel form di creazione — non un bottone separato |
| "Elimina" sezione form (riga 70) | Mantenerlo con label visibile `Elimina`; handler `resetCreateForm()` che svuota completamente i campi del form di creazione, resetta eventuale preview/file locale e non tocca Firestore ne Storage |
| "Modifica" per riga (riga 224) | `openEditModal(record)` → apre modale con `editForm` |
| "Elimina" per riga (riga 232) | `deleteMovimentoAttrezzatura(record, refreshAttrezzatureSnapshot)` (Sezione 5.2) |

Il click sul pulsante Elimina apre un dialog di conferma modale con testo "Sei sicuro di voler eliminare questo movimento?" e due pulsanti "Conferma" (esegue deleteMovimentoAttrezzatura) e "Annulla" (chiude il dialog, nessuna modifica ai dati). Il writer viene invocato solo dopo Conferma.

### 9.5 Modale di modifica

Equivalente della modal `editForm && (...)` della madre (`AttrezzatureCantieri.tsx:1304–1601`). Il write panel deve includere:
- Tutti i campi del form di creazione (ripopolati con i valori del record)
- Sezione foto: anteprima foto esistente, pulsante "Rimuovi foto" (`removeEditFotoAttrezzatura`), input file per nuova foto
- Bottone "Annulla" (chiude senza salvare)
- Bottone "Salva modifiche" (`saveEditMovimentoAttrezzatura`)

---

## SEZIONE 10 — TRAPPOLE NOTE DA RISPETTARE

Tutte e quattro le trappole sono lezioni dirette dall'implementazione Materiali da ordinare (2026-04-23, riprese dall'audit 2026-04-24).

### Trappola 1 — BLOB URL PERSISTITO

**Regola:** `URL.createObjectURL()` è ammesso solo per preview UI locale (tag `<img>`). Mai assegnare il blob URL a campi `fotoUrl` o `fotoStoragePath` che finiscono su Firestore.

**Come si manifesterebbe in Attrezzature Cantieri:** se il writer scrive `fotoUrl: URL.createObjectURL(fotoFile)` nel record salvato su Firestore, l'URL funziona nella sessione corrente ma è invalido dopo ogni refresh di pagina. Il blob URI è session-scoped e non sopravvive al reload. L'immagine risulta rotta per chiunque riapra la pagina o carichi il record da un altro dispositivo.

**Prevenzione nel writer:** il campo `fotoUrl` nel record Firestore deve sempre contenere l'URL restituito da `getDownloadURL` dopo un `storageWriteOps.uploadBytes` riuscito. Il blob URL va usato solo per l'anteprima nel `<img>` locale e poi revocato con `URL.revokeObjectURL` quando non serve più.

**Esempio corretto:**
```typescript
const snap = await storageWriteOps.uploadBytes(ref, fotoFile);
const fotoUrl = await getDownloadURL(snap.ref); // URL permanente Firebase
// blob URL solo per preview locale, mai in Firestore
```

### Trappola 2 — ORDINE UPLOAD/DELETE SBAGLIATO

**Regola:** nella sostituzione di una foto, caricare il file nuovo PRIMA di eliminare quello vecchio. Delete solo dopo upload riuscito.

**Come si manifesterebbe in Attrezzature Cantieri:** se il writer fa `deleteObject(vecchioPath)` prima di `uploadBytes(nuovoFile)` e l'upload fallisce, il record rimane senza foto (la vecchia è stata cancellata, la nuova non è stata caricata). L'utente perde la foto senza possibilità di recupero.

**Prevenzione nel writer:** la madre (`AttrezzatureCantieri.tsx:563–569`) fa l'errore opposto: `deleteMaterialImage` prima, poi `uploadMaterialImage`. Il NEXT **non deve replicare questo ordine**. L'ordine corretto in `saveEditMovimentoAttrezzatura` (Sezione 5.3): upload nuovo → se succede, delete vecchio (best-effort).

### Trappola 3 — RAMO ERRORE UPLOAD SILENZIOSO

**Regola:** se `uploadBytes` fallisce, il writer deve: (1) fare catch, (2) mostrare alert visibile all'utente, (3) fare return esplicito senza procedere con la scrittura su Firestore.

**Come si manifesterebbe in Attrezzature Cantieri:** se il catch non fa return, il writer crea un record Firestore con `fotoUrl: null` e `fotoStoragePath: null` ma il file non è stato caricato — oppure peggio, con un blob URL non valido. L'utente non sa che la foto è andata persa.

**Prevenzione nel writer:** ogni blocco `try/catch` attorno a `uploadBytes` deve avere nella `catch`:
```typescript
} catch (err) {
  console.error("Errore upload foto attrezzatura:", err);
  window.alert("Errore caricamento foto. Riprova.");
  return; // OBBLIGATORIO — non si procede
}
```

### Trappola 4 — VALIDAZIONI POST-UPLOAD

**Regola:** tutte le validazioni sui campi del form devono avvenire PRIMA di qualsiasi upload foto. Non prima della scrittura su Firestore, ma prima dell'upload.

**Come si manifesterebbe in Attrezzature Cantieri:** se il writer fa `uploadBytes(foto)` e poi scopre che `descrizione` è vuota e fa return, il file è già stato caricato su Storage ma nessun record Firestore è stato scritto. File orfano su Storage permanente.

**Prevenzione nel writer:** l'ordine in `createMovimentoAttrezzatura` e `saveEditMovimentoAttrezzatura` (Sezioni 5.1, 5.3) è: validazioni → upload → write Firestore. Qualsiasi validazione che fallisce PRIMA dell'upload non produce file orfani.

---

## SEZIONE 11 — SCENARI TEST BROWSER END-TO-END

Da eseguire dopo deploy `firebase deploy --only storage` e dopo implementazione completa.

### Scenario 1 — Crea movimento senza foto

**Passi:** navigare `/next/attrezzature-cantieri` → compilare form tipo CONSEGNATO, descrizione, quantita, unita, cantiere → "Salva movimento"  
**Stato atteso UI:** form resettato, nuovo movimento appare in cima alla lista "Registro movimenti"  
**Stato atteso Firestore:** `storage/@attrezzature_cantieri.value[]` contiene nuovo record con tutti i campi, `fotoUrl: null`, `fotoStoragePath: null`  
**Stato atteso Storage:** nessun file caricato

### Scenario 2 — Crea movimento con foto

**Passi:** form + foto allegata → "Salva movimento"  
**Stato atteso UI:** foto visibile nella riga del registro come thumbnail  
**Stato atteso Firestore:** record con `fotoUrl` = URL Firebase permanente (non `blob:`), `fotoStoragePath` = `"attrezzature/{id}-{ts}.{ext}"`  
**Stato atteso Storage:** file presente in `attrezzature/`

### Scenario 3 — Refresh pagina: verifica persistenza

**Passi:** dopo Scenario 1 o 2, ricaricare `/next/attrezzature-cantieri`  
**Stato atteso:** il movimento è ancora visibile con tutti i campi. Se ha foto, la thumbnail è visibile (non rotta)  
**Test specifico blob URL:** aprire DevTools → Network → verificare che le richieste immagine NON abbiano URL `blob:` ma URL `firebasestorage.googleapis.com`

### Scenario 4 — Modifica movimento (senza cambio foto)

**Passi:** click "Modifica" su un movimento → modificare descrizione o note → "Salva modifiche"  
**Stato atteso Firestore:** `storage/@attrezzature_cantieri.value[]` — il record con lo stesso id ha i campi aggiornati; `fotoUrl` e `fotoStoragePath` invariati  
**Stato atteso Storage:** nessun upload, nessun delete

### Scenario 5 — Modifica movimento con sostituzione foto

**Passi:** click "Modifica" → allegare nuova foto → "Salva modifiche"  
**Stato atteso Firestore:** `fotoUrl` = nuovo URL Firebase, `fotoStoragePath` = nuovo path `attrezzature/`  
**Stato atteso Storage:** il file vecchio è stato eliminato (verifica in Firebase Console), il file nuovo è presente  
**Test ordine:** simulare upload fallito (disconnettersi dalla rete prima del salvataggio) → verificare che il file vecchio sia ancora presente su Storage (ordine corretto upload-prima-delete-dopo)

### Scenario 6 — Elimina movimento senza foto

**Passi:** click "Elimina" su movimento senza foto → conferma  
**Stato atteso Firestore:** il record non è più in `value[]`  
**Stato atteso Storage:** nessuna variazione

### Scenario 7 — Elimina movimento con foto

**Passi:** click "Elimina" su movimento con `fotoStoragePath` valorizzato → conferma  
**Stato atteso Firestore:** record rimosso  
**Stato atteso Storage:** il file `attrezzature/{path}` è stato eliminato da Firebase Storage (verifica in Firebase Console)  
**Noto:** la madre (`AttrezzatureCantieri.tsx:465–476`) NON fa questa cleanup — il test verifica che il NEXT migliori il comportamento della madre

### Scenario 8 — Errore upload foto su creazione

**Passi:** compilare form con foto → disconnettersi dalla rete → "Salva movimento"  
**Stato atteso:** alert visibile "Errore caricamento foto. Riprova." → il form rimane compilato (draft non perso) → nessun record scritto in Firestore  
**Stato atteso Storage:** nessun file orfano creato

### Scenario 9 — Movimento tipo SPOSTATO

**Passi:** form con tipo SPOSTATO → compilare campi source cantiere → "Salva movimento"  
**Stato atteso Firestore:** record con `sourceCantiereId` e `sourceCantiereLabel` valorizzati  
**Stato atteso UI Stato attuale:** la logica `buildCurrentState` del domain (`nextAttrezzatureCantieriDomain.ts:332–414`) riflette il decremento nel cantiere sorgente e l'incremento nel cantiere destinazione

---

## SEZIONE 12 - DIVERGENZE DALL'AUDIT 2026-04-23

Le questioni Q1-Q4 sono state risolte dalle decisioni consolidate 2026-04-24 (Sezione 12bis). Questa sezione mantiene solo le divergenze rispetto all'audit/briefing 2026-04-23, integrate con la decisione presa.

### 12.1 DIVERGENZE INTENZIONALI VS MADRE - cleanup foto su delete

**D8 - `handleDelete` madre non cancella foto:**  
Il codice reale di `AttrezzatureCantieri.tsx:465-476` mostra che `handleDelete` filtra l'array senza chiamare `deleteMaterialImage`. Il NEXT deve invece cancellare la foto quando `record.fotoStoragePath` e valorizzato, usando `storageWriteOps.deleteObject` prima della riscrittura Firestore. Questa divergenza e intenzionale e motivata dalla prevenzione di file orfani su Storage.
**Impatto sulla SPEC:** Sezione 4.2, Sezione 5.2 e Scenario 7 in Sezione 11.

**D11 - Conferma eliminazione movimento:**  
Il NEXT chiede conferma ("Sei sicuro?") tramite dialog modale prima di cancellare un movimento dalla lista. La madre (src/pages/AttrezzatureCantieri.tsx, handleDelete riga 465-471) elimina direttamente al click, senza conferma. Divergenza intenzionale, motivata da prevenzione click accidentali. Coerente con interpretazione del punto 10 della checklist "CHIUSO AL 100%" come "stesso effetto dati sul dato utente", non "stessa identica UX".
**Impatto sulla SPEC:** Sezione 4.2 e Sezione 9.4.

### 12.2 Ordine delete/upload in `handleEditSave` madre

**D9 - la madre cancella prima di caricare:**  
Il codice reale di `AttrezzatureCantieri.tsx:563-569` mostra l'ordine rischioso delete-before-upload. Il NEXT deve obbligatoriamente usare upload-before-delete: carica la nuova foto, ottiene URL/path permanenti, poi elimina la vecchia foto solo dopo upload riuscito e in modalita best-effort.
**Impatto sulla SPEC:** Sezione 4.4, Sezione 5.3, Sezione 10 Trappola 2.

### 12.3 Meccanismo di scrittura madre vs NEXT

**D10 - madre via `storageSync.setItemSync`, NEXT via `firestoreWriteOps.setDoc`:**  
Il codice reale della madre usa `setItemSync` da `storageSync` (`AttrezzatureCantieri.tsx:3,454,470,596`), non scrittura Firestore diretta. Il NEXT usa `firestoreWriteOps.setDoc` perche il reader NEXT legge direttamente da Firestore (`readNextAttrezzatureCantieriSnapshot` in `nextAttrezzatureCantieriDomain.ts:509-548`). Non e una divergenza comportamentale: e architettura NEXT. Entrambe le strade convergono sul documento `storage/@attrezzature_cantieri` con shape `{ value: Movimento[] }`.
**Impatto sulla SPEC:** Sezione 4 e Sezione 5.

---

## SEZIONE 12bis - DECISIONI CONSOLIDATE 2026-04-24

1. **D1 - Pulsante `Elimina` nel form creazione:** resta visibile con label `Elimina`, ma svuota il form e non tocca Firestore/Storage. Integrata in Sezione 2.4 e Sezione 9.4.
2. **D2 - Categorie form:** elenco fisso `TUBI`, `MATERIALI`, `ALTRO`, default `TUBI`, parita 1:1 con madre e zero logica dinamica. Integrata in Sezione 9.2.
3. **D3 - Record legacy senza id:** comportamento di parita' con madre. Il NEXT genera un id al volo con pattern `editForm.id || buildId()` nel writer di edit.
   Nessun alert utente, l'edit procede normalmente. Scelta coerente con punto 10 della checklist (parita' 1:1 con madre). Integrata in Sezione 5.3.
4. **D4 - Refresh post-write:** il write panel chiama direttamente `readNextAttrezzatureCantieriSnapshot()` e aggiorna `localSnapshot`; `useNextOperativitaSnapshot` non viene modificato. Integrata in Sezione 2.3 e Sezione 9.3.
5. **D5 - Pattern path Storage:** `attrezzature/{movimentoId}-{Date.now()}.{ext}` e namespace separato da `materiali/`. Integrata in Sezione 6 e Sezione 8.
6. **D6 - Posizione UI writer:** nuovo file dedicato `src/next/NextAttrezzatureCantieriWritePanel.tsx`; pannello read-only non modificato come scope principale salvo minime props/callback. Integrata in Sezione 5 e Sezione 9.1.
7. **D7 - Deroghe barriera:** route `/next/attrezzature-cantieri`, doc `storage/@attrezzature_cantieri`, prefisso Storage `attrezzature/`, operazioni `firestore.setDoc`, `storage.uploadBytes`, `storage.deleteObject`; forma da replicare dal pattern reale MaterialiDaOrdinare. Integrata in Sezione 7.
8. **D8 - Delete movimento con foto:** il NEXT cancella la foto da Storage, a differenza della madre, per prevenire file orfani. Integrata in Sezione 4.2, Sezione 5.2, Sezione 11 e Sezione 12.1.
9. **D9 - Sostituzione foto:** il NEXT usa obbligatoriamente upload-before-delete; non replica delete-before-upload della madre. Integrata in Sezione 4.4, Sezione 5.3 e Sezione 10.
10. **D10 - Scrittura dati:** la madre usa `storageSync.setItemSync`, il NEXT usa `firestoreWriteOps.setDoc`; e architettura NEXT, non divergenza comportamentale. Integrata in Sezione 4 e Sezione 5.
11. **D11 (da post-Step-D 2026-04-24) Conferma eliminazione movimento NEXT:** dialog modale di conferma prima del delete. Divergenza intenzionale vs madre, documentata in Sezione 12.1.

---

## SEZIONE 13 — MAPPATURA CHECKLIST 10 PUNTI

La checklist "CHIUSO AL 100%" ha 10 punti verificati al termine dell'implementazione. Per ogni punto, questa SPEC fornisce:

### Punto 1 — UI disabled durante write

**Come la SPEC lo garantisce:** Sezione 9.2 prescrive stati `creating: boolean` e `editSaving: boolean`. I bottoni "Salva movimento" e "Salva modifiche" devono mostrare "Salvataggio..." e essere `disabled={creating}` / `disabled={editSaving}` durante l'operazione. Analogamente "Elimina" deve essere disabilitato durante la delete. La SPEC vieta handler che procedono senza loading state.

### Punto 2 — Alert/banner read-only rimossi

**Come la SPEC lo garantisce:** nel write panel, nessun `blockedReason` viene mostrato come banner. Il badge con `{blockedReason}` presente nel pannello read-only (`NextAttrezzatureCantieriReadOnlyPanel.tsx:60–61`) deve essere rimosso o condizionato nel write panel. Il pulsante "Salva movimento" non ha `title={blockedReason}` ma un handler reale.

### Punto 3 — Nessun blob URL persistito in Firestore

**Come la SPEC lo garantisce:** Sezione 10 Trappola 1 vieta esplicitamente blob URL in campi `fotoUrl`/`fotoStoragePath`. Sezioni 5.1 e 5.3 prescrivono `getDownloadURL` post-upload come unica sorgente di `fotoUrl`. Il verificatore può fare `grep "createObjectURL" NextAttrezzatureCantieriWritePanel.tsx` e confermare che i risultati siano solo assegnamenti a preview locale (mai a campi che finiscono nel record Firestore).

### Punto 4 — Writer solo via wrapper

**Come la SPEC lo garantisce:** Sezione 1.3 e Sezione 5 vietano import diretti da `firebase/firestore` e `firebase/storage` nei writer. Le Sezioni 5.1–5.4 elencano esplicitamente `firestoreWriteOps.setDoc` e `storageWriteOps.uploadBytes`/`deleteObject` come dipendenze. Unica eccezione ammessa: `getDownloadURL` da `firebase/storage`. Il verificatore fa `grep -n "from 'firebase/firestore'\|from 'firebase/storage'" NextAttrezzatureCantieriWritePanel.tsx` e controlla che non ci siano import di funzioni write.

### Punto 5 — Barrier deroghe corrette

**Come la SPEC lo garantisce:** Sezione 7 definisce con precisione chirurgica le tre costanti da aggiungere a `cloneWriteBarrier.ts`, la helper function, e il blocco in `isAllowedCloneWriteException`. Il verificatore fa `rg "@attrezzature_cantieri" src/utils/cloneWriteBarrier.ts` e `rg "attrezzature/" src/utils/cloneWriteBarrier.ts` e deve trovare hit.

### Punto 6 — Storage rules presente

**Come la SPEC lo garantisce:** Sezione 8.2 prescrive la regola testuale esatta. Il verificatore fa `rg "match /attrezzature" storage.rules` e deve trovare hit. Sezione 8.3 ricorda che il deploy manuale è obbligatorio prima dei test.

### Punto 7 — Test browser scenari end-to-end

**Come la SPEC lo garantisce:** Sezione 11 elenca 9 scenari con passi, stato atteso UI, stato atteso Firestore e stato atteso Storage. Il verificatore deve eseguire tutti e 9 e riportare esito. Known issue accettabili (se presenti) devono essere esplicitamente documentati.

### Punto 8 — Indipendenza da moduli madre

**Come la SPEC lo garantisce:** Sezione 1.3 vieta import da `materialImages.ts`. Sezioni 5.1–5.4 usano solo `storageWriteOps` e `firestoreWriteOps`. Il domain reader (`nextAttrezzatureCantieriDomain.ts`) non viene modificato. Il verificatore fa `grep "materialImages\|AttrezzatureCantieri" NextAttrezzatureCantieriWritePanel.tsx` e deve trovare nessun risultato (o solo `AttrezzatureCantieri.css` per gli stili).

### Punto 9 — Cross-audit Codex

**Come la SPEC lo garantisce:** questa SPEC è il documento di riferimento per il Codex audit. Un agente parallelo può verificare indipendentemente: (a) che le deroghe barriera corrispondano a Sezione 7; (b) che i writer non usino blob URL (Punto 3); (c) che l'ordine upload/delete sia corretto (Sezione 5.3); (d) che nessun import proibito sia presente (Punto 4). I criteri di verifica sono meccanicamente verificabili da grep.

### Punto 10 — Parity scritture madre

**Come la SPEC lo garantisce:** Sezione 4 mappa ogni azione scrivente della madre (`handleSave`, `handleDelete`, `handleEditRemovePhoto`, `handleEditSave`) al comportamento NEXT corrispondente. Il NEXT è un superset della madre su due punti (cleanup foto su delete, ordine corretto upload/delete). Il verificatore confronta Sezione 4 con il codice implementato e verifica che ogni azione madre abbia un corrispettivo NEXT funzionante verificato in browser (Scenari 1–9).

---

*Fine SPEC - versione 1.0 consolidata 2026-04-24 - pronta per verifica Codex vs codice prima dell'implementazione.*
