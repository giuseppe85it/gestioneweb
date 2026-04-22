# AUDIT — Leak preventivi manutenzione in "Materiali da ordinare"

Data audit: 2026-04-22
Tipo: READ-ONLY — nessuna patch, nessuna modifica a file sorgente.

---

## 1. Vista "Materiali da ordinare"

- **File componente**: `src/next/NextMaterialiDaOrdinarePage.tsx`
- **Route**: `/next/materiali-da-ordinare`
  - Costante: `NEXT_MATERIALI_DA_ORDINARE_PATH = "/next/materiali-da-ordinare"` — `src/next/nextStructuralPaths.ts:13`
- **Sezione preventivi**: resa da `src/next/NextProcurementConvergedSection.tsx` (tab "Prezzi & Preventivi", `pricingView === "preventivi"`)

---

## 2. Catena dati fino a @preventivi

```
NextMaterialiDaOrdinarePage.tsx:625
  → readNextProcurementSnapshot({ includeCloneOverlays: false })
    (src/next/domain/nextProcurementDomain.ts:902)

nextProcurementDomain.ts:908
  → readStorageDataset(PREVENTIVI_KEY, ["preventivi"])
    PREVENTIVI_KEY = "@preventivi"
    → getDoc(doc(db, "storage", "@preventivi"))
    (nextProcurementDomain.ts:855-857)
    → unwrapStorageArrayWithPreferredKeys(rawDoc, ["preventivi"])
    → restituisce TUTTI gli item presenti nell'array "preventivi"

nextProcurementDomain.ts:930-937
  → sortPreventivi(
      preventiviDataset.items
        .map((entry, index) => mapPreventivoRecord(entry, index, approvalIndex))
        .filter(Boolean)
    )
  → snapshot.preventivi  ← contiene TUTTI i record dell'array, senza filtri

NextMaterialiDaOrdinarePage.tsx:628
  → setProcurementSnapshot(snapshot)

NextProcurementConvergedSection.tsx:290
  → snapshot.preventivi.forEach(...)     [costruzione supplierOptions]
NextProcurementConvergedSection.tsx:312
  → snapshot.preventivi.forEach(...)     [costruzione preventiviStatusById]
NextProcurementConvergedSection.tsx:319
  → snapshot.preventivi.forEach(...)     [costruzione filteredPreventivi per rendering]
```

---

## 3. Filtro attuale sui preventivi

### 3a. Condizione ESATTA di inclusione/esclusione nel domain

In `nextProcurementDomain.ts:930-937`:

```ts
const preventivi = sortPreventivi(
  preventiviDataset.items
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      return mapPreventivoRecord(entry as RawGenericRecord, index, approvalIndex);
    })
    .filter((entry): entry is NextProcurementPreventivoItem => Boolean(entry))
);
```

Unico filtro applicato: `!entry || typeof entry !== "object"` — scarta solo item null/non-oggetto.

`mapPreventivoRecord()` (linee 704-765 di `nextProcurementDomain.ts`) legge da `raw`:
`id`, `fornitoreId`, `fornitoreNome`, `numeroPreventivo`, `dataPreventivo`, `pdfUrl`, `pdfStoragePath`, `imageUrls`, `imageStoragePaths`, `righe`, `totale`/`importoTotale`/`totalePreventivo`/`importo`, `valuta`.
**Non legge**: `ambitoPreventivo`, `famigliaArchivista`, `metadatiMezzo`.

Grep di conferma: ricerca di `ambitoPreventivo|famigliaArchivista|preventivo_manutenzione|metadatiMezzo` in `nextProcurementDomain.ts` → **zero occorrenze**.

### 3b. Considera famigliaArchivista? ambitoPreventivo?

**No.** Nessuno dei due campi è mai letto, né come filtro né come attributo esposto nel tipo `NextProcurementPreventivoItem`. Il tipo non include `famigliaArchivista` né `ambitoPreventivo` né `metadatiMezzo`.

### 3c. Retrocompatibilità record storici

Non gestita a livello esplicito: l'assenza del campo `ambitoPreventivo` in un record (record preesistenti o record magazzino) non genera né filtro né flag. Tutti i record — con o senza `ambitoPreventivo` — passano invariati.

In `NextProcurementConvergedSection.tsx:316-333`, i soli filtri applicati sull'array `filteredPreventivi` sono:
- `supplierFilter`: id fornitore (UI)
- `searchQuery`: testo libero su `fornitoreNome + numeroPreventivo` (UI)
- `soloNonImportati`: status import rispetto al listino (UI)

Nessun filtro su `ambitoPreventivo`, `famigliaArchivista`, `metadatiMezzo`. Grep di conferma: ricerca degli stessi campi in `NextProcurementConvergedSection.tsx` → **zero occorrenze**.

---

## 4. Altre viste potenzialmente impattate

### 4a. `NextMagazzinoPage.tsx` — `/next/magazzino?tab=documenti-costi`

**Secondo leak confermato.**

```
NextMagazzinoPage.tsx:3041-3043
  const procurementPreventivi = useMemo(
    () => procurementSnapshot?.preventivi ?? [],
    [procurementSnapshot],
  );

NextMagazzinoPage.tsx:3084-3101
  const preventiviItems = procurementPreventivi.map((item) => ({
    id: `preventivo:${item.id}`,
    tipoDocumento: "PREVENTIVO",
    ...
  }));

NextMagazzinoPage.tsx:3103
  return sortMagazzinoDocumentItems([...archiveItems, ...preventiviItems]);
```

Tutti i preventivi da `procurementSnapshot` (che viene da `readNextProcurementSnapshot()` senza filtri su `ambitoPreventivo`) vengono mescolati con i documenti magazzino. Un preventivo `preventivo_manutenzione` compare nella tab `documenti-costi` del magazzino come se fosse un documento di acquisto.

Condizione di inclusione: nessuna discriminazione su `ambitoPreventivo`, `famigliaArchivista`, `metadatiMezzo`.

### 4b. `NextProcurementReadOnlyPanel.tsx`

Per il tab `preventivi` mostra una sezione bloccata (`renderBlockedTab`) con il messaggio `snapshot.navigability.preventivi.reason`. Non espone la lista individuale dei preventivi.
**Non è vettore di leak.**

### 4c. `NextOperativitaGlobalePage.tsx`

Usa `procurementTab === "preventivi"` come stato di navigazione e mostra `snapshot.procurement.navigability.preventivi.reason`. Non itera né mostra item individuali dei preventivi.
**Non è vettore di leak.**

---

## 5. Dossier mezzo (controprova filtro per targa/ambito)

Il dossier mezzo (`NextDossierMezzoPage.tsx`) **non importa e non chiama** `readNextProcurementSnapshot()`. La sezione preventivi del dossier (`legacy?.documentiCosti.filter(item => item.tipo === "PREVENTIVO")`, linea 223) legge da `readNextMezzoDocumentiCostiSnapshot(targa)` (`nextDocumentiCostiDomain.ts:2209`) che opera su `@documenti_mezzi`, `@documenti_magazzino` e altre collection di documenti — filtrate per targa.

I preventivi Archivista sono salvati in `storage/@preventivi` (doc Firestore `storage/@preventivi`), **non** in `@documenti_mezzi`. Di conseguenza i preventivi Archivista manutenzione **non compaiono** nel blocco `documentiCosti` del dossier.

Il dossier chiama anche `readNextDocumentiCostiProcurementSupportSnapshot(targa)` (`nextDocumentiCostiDomain.ts:1818`) che legge `@preventivi` e applica il filtro targa:

```ts
// nextDocumentiCostiDomain.ts:1860-1864
const preventiviConTargaDiretta = preventiviItems.filter((entry) =>
  Boolean(normalizeTarga(entry.targa ?? entry.mezzoTarga))
);
const preventiviMatchForte = preventiviConTargaDiretta.filter(
  (entry) => normalizeTarga(entry.targa ?? entry.mezzoTarga) === mezzoTarga
);
```

Questo filtro legge `entry.targa` o `entry.mezzoTarga` — campi alla radice del documento Firestore. I preventivi Archivista manutenzione hanno la targa in `entry.metadatiMezzo.targa` (campo nested, non alla radice). Pertanto:
- `entry.targa ?? entry.mezzoTarga` = `undefined` per i preventivi manutenzione
- `preventiviConTargaDiretta` = 0 per questi record
- `preventiviMatchForte` = 0

Il dossier espone counts (`preventiviGlobali`, `preventiviConTargaDiretta`, `preventiviMatchForte`) a scopo diagnostico, ma non espone la lista individuale dei preventivi Archivista come elementi cliccabili nel blocco Fatture/Preventivi del dossier.

**Controprova**: il dossier mezzo usa un filtro targa ma legge il campo sbagliato (`entry.targa`) rispetto a dove i preventivi manutenzione scrivono effettivamente la targa (`entry.metadatiMezzo.targa`). Il preventivo manutenzione non compare quindi nel dossier a livello di lista individuale — né nel blocco `documentiCosti` né nel blocco procurement support.

---

## 6. Diagnosi del leak

**Causa: MANCANZA DI FILTRO su `ambitoPreventivo` e `famigliaArchivista`.**

Evidenza file:riga:
- `nextProcurementDomain.ts:930-937`: `preventiviDataset.items` è mappato integralmente senza filtro di esclusione
- `nextProcurementDomain.ts:704-765` (`mapPreventivoRecord`): non legge `ambitoPreventivo`, `famigliaArchivista`, `metadatiMezzo` (zero occorrenze per grep)
- `NextProcurementConvergedSection.tsx:319-333` (`filteredPreventivi`): nessun filtro su ambito o family (zero occorrenze per grep)
- Il campo `ambitoPreventivo` esiste solo nel record Firestore (scritto da `archiveArchivistaPreventivoRecord` in `ArchivistaArchiveClient.ts:576`) ma il domain procurement lo ignora completamente

Il leak **non** è dovuto a:
- Filtro presente ma sbagliato (nessun filtro esiste)
- Un campo discriminante diverso (non c'è uso di `righe`, `totale` o altri campi come filtro di inclusione — tutti i record passano)
- Comportamento del barrier (il barrier riguarda la scrittura, non la lettura)

---

## 7. Punto minimo dove imporre l'esclusione (informativo)

**File**: `src/next/domain/nextProcurementDomain.ts`

**Funzione/selector**: `readNextProcurementSnapshot()` — specificamente la pipeline di costruzione di `preventivi` (righe 930-937).

**Condizione necessaria** (descrittiva, non patch):
Escludere dall'array finale i record il cui campo `ambitoPreventivo` vale `"manutenzione"`. In alternativa equivalente: escludere i record il cui `famigliaArchivista` vale `"preventivo_manutenzione"`.

Preferire il filtro su `ambitoPreventivo` perché è il campo semantico introdotto apposta per questa distinzione, mentre `famigliaArchivista` è un campo tecnico archivista-interno.

**Retrocompatibilità record storici**:
Record salvati prima della distinzione (2026-04-22) non hanno `ambitoPreventivo` nel documento Firestore (il campo è `null` o assente). Questi record **vanno mantenuti inclusi** — trattarli come record procurement magazzino è il comportamento corretto e retrocompatibile.
La condizione deve quindi essere: escludere SOLO se `ambitoPreventivo === "manutenzione"` (uguaglianza stretta). Un record con `ambitoPreventivo = null`, `ambitoPreventivo = undefined`, o privo del campo, rimane incluso.

**Impatto atteso**:
- `snapshot.preventivi` non conterrà più record `preventivo_manutenzione`
- `snapshot.counts.preventiviTotali` escluderà i preventivi manutenzione
- La tab "Prezzi & Preventivi" in "Materiali da ordinare" non mostrerà più i preventivi manutenzione
- La tab `documenti-costi` in `/next/magazzino` non li includerà nei `preventiviItems`
- Record magazzino senza `ambitoPreventivo` (legacy) restano visibili senza modifiche

Il secondo vettore (`NextMagazzinoPage.tsx:3084`) eredita automaticamente la correzione perché usa `procurementSnapshot.preventivi` — stesso array già filtrato.

---

## 8. Domande aperte / file non letti

1. **Dossier mezzo — rendering effettivo del "supporto procurement"**: `buildNextDossierMezzoLegacyView()` (`nextDossierMezzoDomain.ts`) non è stato letto in questa sessione. Non è possibile escludere con certezza che il dossier esponga i `procurementPreventivi` in una sezione separata dalla lista `documentiCosti`. Se il product owner ha effettivamente visto il preventivo manutenzione nel dossier (come item cliccabile, non solo come count), potrebbe esserci una terza via non identificata.

2. **`nextData.ts`**: importa `nextProcurementDomain` ma non è stato letto. Non è noto se espone `preventivi` in altre superfici.

3. **`internalAiUnifiedIntelligenceEngine.ts`** e **`internalAiChatOrchestrator.ts`**: importano il domain. Non letti. Non è noto se le pipeline IA interrogano `snapshot.preventivi` per uso interno (report, analisi economica). Se sì, anche queste pipeline riceverebbero preventivi manutenzione — impatto da valutare separatamente.

4. **Campo `metadatiMezzo.targa` nel dossier**: il filtro `entry.targa ?? entry.mezzoTarga` in `nextDocumentiCostiDomain.ts:1860` non copre `entry.metadatiMezzo.targa`. Questo è un secondo bug ortogonale: i preventivi manutenzione non vengono mai riconosciuti come "targa-matching" nel dossier, anche se la targa è valorizzata. Non entra nel perimetro di questo audit ma è da registrare come debito separato.
