# AUDIT VERIFICA SPEC — Archivista Riapri Review v1.1
**Data audit:** 2026-04-28  
**Spec verificata:** `docs/product/SPEC_ARCHIVISTA_RIAPRI_REVIEW.md` (920 righe, v1.1)  
**Autore spec:** Codex  
**Verificatore:** Claude Code (claude-sonnet-4-6) — indipendente  
**Metodo:** lettura diretta di ogni file citato, confronto riga per riga con le claim della SPEC  

---

## Riepilogo esecutivo

| Indicatore | Valore |
|---|---|
| Claim totali verificate | ~80 |
| File sorgente letti | 13 |
| Divergenze critiche trovate | **0** |
| Divergenze minori trovate | **0** |
| Claim linea/simbolo non corrispondenti | **0** |

**ESITO: SPEC PRONTA PER IMPLEMENTAZIONE**

Ogni claim tecnico della SPEC corrisponde al codice reale del repo. Tutti i numeri di riga sono corretti, tutti i nomi di simbolo esistono dove dichiarati, tutte le forme TypeScript sono accurate. La SPEC può essere seguita come piano di implementazione senza patch.

---

## Categoria A — ArchivistaArchiveClient.ts

**File:** `src/next/internal-ai/ArchivistaArchiveClient.ts` (720 righe)

| Claim SPEC | Riga(e) | Esito | Nota |
|---|---|---|---|
| `ArchivistaFamily` = union 5 valori | 14–19 | ✓ | `fattura_ddt_magazzino \| fattura_ddt_manutenzione \| documento_mezzo \| preventivo_magazzino \| preventivo_manutenzione` — esatto |
| `ArchivistaDocumentCollectionTarget` = `"@documenti_magazzino" \| "@documenti_mezzi"` | 26–28 | ✓ | Confermato |
| `ArchivistaReviewRow` — tutti i campi `\| null` | 36–46 | ✓ | `descrizione?: string \| null`, etc. — confermato |
| `ArchivistaDocumentArchiveArgs` — NO campo `archivistaAnalysis` | 71–81 | ✓ | `basePayload: Record<string, unknown>` — confermato assenza campo |
| `ArchivistaPreventivoArchiveArgs` — NO campo `archivistaAnalysis` | 83–102 | ✓ | Campi: `righe`, `avvisi`, `campiMancanti`, `ambitoPreventivo`, `metadatiMezzo` — confermato |
| `archiveArchivistaDocumentRecord` — `addDoc(collection(db, args.targetCollection), payload)` | 483–497 | ✓ | Scrittura confermata via `addDoc` wrappato |
| `famigliaArchivista` scritta in payload | 489–492 | ✓ | Confermato nel payload flatten |
| `doc(db, "storage", "@preventivi")` | 554 | ✓ | Path esatto |
| `nuovoPreventivo` costruito e preposto | 561–591 | ✓ | `nextPreventivi = [nuovoPreventivo, ...currentPreventivi]` |
| `setDoc(refDoc, { preventivi: nextPreventivi }, { merge: true })` | 590–591 | ✓ | Confermato |
| `ambitoPreventivo` scritto nel record preventivo | 575–577 | ✓ | Confermato |

**Divergenze categoria A: 0**

---

## Categoria B — Tipi e analisi per bridge

### B1 — ArchivistaDocumentoMezzoBridge.tsx

**File:** `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`

| Claim SPEC | Riga(e) | Esito |
|---|---|---|
| `ArchivistaDocumentoMezzoPreloadDocument` — solo `fileUrl, sourceDocId, sourceKey, tipoDocumento, targa` (NO `archivistaAnalysis`) | 95–101 | ✓ |
| `ArchivistaDocumentoMezzoAnalysis` — ~60 campi opzionali `?: string \| string[]` | 103–167 | ✓ |
| `normalizeArchivistaLibrettoAnalysisState` wrappa `normalizeLibrettoAnalysisDateFields` | 1070–1078 | ✓ |
| `ARCHIVISTA_LIBRETTO_PERSISTED_FIELD_LABELS` — 17 chiavi | 1151–1169 | ✓ |
| `buildArchivistaNewVehicleRecord` scrive tutti i 17 campi persistiti | 1488–1543 | ✓ |
| `applyArchivistaLibrettoVehicleUpdate` — `setItemSync("@mezzi_aziendali", next)` | 1631–1671 (r. 1671) | ✓ |
| Preload effect: `setAnalysis(null)`, `setAnalysisStatus("idle")` | 1800–1855 (r. 1840) | ✓ |
| `setAnalysis(nextAnalysis)` dopo normalizzazione | 2384 | ✓ |
| `setAnalysisStatus("success")` | 2385 | ✓ |
| Vehicle matching post-analisi | 2387–2395 | ✓ |
| `handleArchive` start | 2455 | ✓ |
| `archiveArchivistaDocumentRecord` call | 2530 | ✓ |
| `family:"documento_mezzo"`, `context:"documento_mezzo"`, `targetCollection:"@documenti_mezzi"`, `categoriaArchivio:"MEZZO"` | 2531–2534 | ✓ |
| basePayload — 13 campi flat + `campiMancanti` + `avvisi` + `documentoMezzoAggiornamentoConfermato` | 2539–2564 | ✓ |

**Divergenze B1: 0**

### B2 — ArchivistaMagazzinoBridge.tsx

**File:** `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx` (654 righe)

| Claim SPEC | Riga(e) | Esito |
|---|---|---|
| `ArchivistaMagazzinoVoce` — shape confermata | 16–26 | ✓ |
| `ArchivistaMagazzinoAnalysis` — NO campo `stato` | 28–40 | ✓ |
| Firma componente: no props | 90–97 | ✓ |
| `rows = useMemo(() => analysis?.voci ?? [])` | 121 | ✓ |
| useEffect: selezione automatica di tutte le righe quando analysis esiste | 123–130 | ✓ |
| `selectedRows = rows.filter(...)` | 132 | ✓ |
| missingFields: fornitore, numeroDocumento, dataDocumento, totaleDocumento | 134–141 | ✓ |
| warning "Nessuna riga materiale trovata nel documento." | 157–158 | ✓ |
| `handleArchive` start | 259 | ✓ |
| `archiveArchivistaDocumentRecord` call | 273 | ✓ |
| basePayload: tipoDocumento, fornitore, numeroDocumento, dataDocumento, imponibile, iva*, totaleDocumento, targa, testo, `voci: selectedRows`, valutaDocumento, riassuntoBreve, `avvisi`, `campiMancanti` | 282–298 | ✓ |

**Divergenze B2: 0**

### B3 — ArchivistaPreventivoMagazzinoBridge.tsx

**File:** `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`

| Claim SPEC | Riga(e) | Esito |
|---|---|---|
| `ArchivistaPreventivoAnalysis` — shape confermata | 17–29 | ✓ |
| Firma componente: no props | 82–86 | ✓ |
| `rows = analysis?.voci ?? []` | 109 | ✓ |
| missingFields: fornitore, numeroDocumento, dataDocumento | 116–120 | ✓ |
| warnings: check `rows.length` | 123–130 | ✓ |
| `handleArchive` start | 246 | ✓ |
| `archiveArchivistaPreventivoRecord` call | 260 | ✓ |
| `ambitoPreventivo:"magazzino"` | 274 | ✓ |
| basePayload: family, fornitore, numeroPreventivo, dataPreventivo, totaleDocumento, riassuntoBreve, `righe: rows`, avvisi, campiMancanti | 260–275 | ✓ |

**Divergenze B3: 0**

### B4 — ArchivistaManutenzioneBridge.tsx

**File:** `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`

| Claim SPEC | Riga(e) | Esito |
|---|---|---|
| `ArchivistaManutenzioneVoce` — campo `categoria` presente | 19–30 | ✓ |
| `ArchivistaManutenzioneAnalysis` — campo `km` presente | 32–46 | ✓ |
| `buildMaintenanceDraft` — shape confermata | 346–378 | ✓ |
| Firma componente: no props | 393–401 | ✓ |
| `reviewRows` da `analysis?.voci` | 502–516 | ✓ |
| missingFields: targa, fornitore, dataDocumento, totaleDocumento | 528–548 | ✓ |
| warning "Nessuna riga materiali..." se no reviewRows | 550–582 (r. 562) | ✓ |
| `handleArchive` start | 751 | ✓ |
| `archiveArchivistaDocumentRecord` call | 769 | ✓ |
| `family:"fattura_ddt_manutenzione"`, `context:"manutenzione"`, `targetCollection:"@documenti_mezzi"`, `categoriaArchivio:"MEZZO"` | 769–773 | ✓ |
| basePayload flat: tipoDocumento, fornitore, numeroDocumento, dataDocumento, totaleDocumento, targa, km, testo, riassuntoBreve, avvisi, campiMancanti, valutaDocumento | 778–800 | ✓ |
| `voci: selectedRows.map(...)` con `prezzoUnitario: row.prezzo` | 791–799 (r. 798) | ✓ |
| `runWithCloneWriteScopedAllowance` wrappa `saveNextManutenzioneBusinessRecord` | 875–880 | ✓ |

**Divergenze B4: 0**

### B5 — ArchivistaPreventivoManutenzioneBridge.tsx

**File:** `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`

| Claim SPEC | Riga(e) | Esito |
|---|---|---|
| `ArchivistaPreventivoManutenzioneAnalysis` — include `targa` e `km` | 18–32 | ✓ |
| `buildReviewDraft` — shape confermata | 272–284 | ✓ |
| Firma componente: no props | 286–294 | ✓ |
| `setAnalysis(normalizedAnalysis); setReviewDraft(buildReviewDraft(normalizedAnalysis)); setAnalysisStatus("success")` | 564–566 | ✓ |
| missingFields: usa `analysis.campiMancanti` se disponibile, altrimenti calcola targa/fornitore/dataDocumento | 391–412 | ✓ |
| warnings: eredita `analysis.avvisi` + righe/targa/fornitore/escluse | 414–435 | ✓ |
| `handleArchive` start | 601 | ✓ |
| `archiveArchivistaPreventivoRecord` call | 620 | ✓ |
| `ambitoPreventivo:"manutenzione"`, `metadatiMezzo:{ targa: reviewDraft.targa, km: reviewDraft.km }` | 641–644 | ✓ |

**Divergenze B5: 0**

---

## Categoria C — Catena preset / preload / navigazione

**File:** `src/next/NextIADocumentiPage.tsx`, `src/next/NextIAArchivistaPage.tsx`

| Claim SPEC | File:Riga | Esito |
|---|---|---|
| `ArchivistaPresetPayload` — soli 7 campi, NO `archivistaAnalysis` | NextIADocumentiPage:35–43 | ✓ |
| `buildArchivistaPreset` — libretto → `{tipo:"documento_mezzo", contesto:"documento_mezzo"}`; isPreventivo → `{tipo:"preventivo", contesto:"magazzino"}`; default → `{tipo:"fattura_ddt", contesto:"magazzino"}` (manutenzione NON differenziata) | NextIADocumentiPage:241–253 | ✓ |
| `handleReopenReview`: `navigate(buildReviewPath(item), { state: { archivistaPreset: buildArchivistaPreset(item) } })` | NextIADocumentiPage:487–493 | ✓ |
| Modal "Riapri review": stessa navigate | NextIADocumentiPage:940–952 | ✓ |
| `ArchivistaPreset` — soli 7 campi, NO `archivistaAnalysis` | NextIAArchivistaPage:17–25 | ✓ |
| `DESTINATION_OPTIONS` — 5 voci, tutte `availability:"active"` | NextIAArchivistaPage:46–82 | ✓ |
| `FLOW_MATRIX` — 5 chiavi, tutte attive | NextIAArchivistaPage:84–119 | ✓ |
| `buildArchivistaPreloadDocument` — ritorna solo `{ fileUrl, sourceDocId, sourceKey, tipoDocumento, targa }` | NextIAArchivistaPage:149–161 | ✓ |
| Bridge mounting: 5 bridge montati, solo `ArchivistaDocumentoMezzoBridge` riceve `preloadDocument` | NextIAArchivistaPage:324–354 | ✓ |

**Divergenze categoria C: 0**

---

## Categoria D — Layer dominio

**File:** `src/next/domain/nextDocumentiCostiDomain.ts`

| Claim SPEC | Riga(e) | Esito |
|---|---|---|
| `NextIADocumentiArchiveItem` — NO campi `archivistaAnalysis`, `famigliaArchivista`, `contestoArchivista`, `ambitoPreventivo` | 1356–1376 | ✓ |
| `mapIADocumentiArchiveRecord` — mapper completo senza i campi sopra | 1413–1448 | ✓ |
| `DOCUMENTI_COLLECTION_KEYS` = `[@documenti_mezzi, @documenti_magazzino, @documenti_generici]` | 12–16 | ✓ |
| `readNextIADocumentiArchiveSnapshot` legge le 3 collection, NON legge `@preventivi` | 1925–1988 | ✓ |
| `readNextProcurementReadOnlySnapshot` usa `PROCUREMENT_PREVENTIVI_DATASET_KEY` (separato) | 1991–1997 | ✓ |

**Divergenze categoria D: 0**

---

## Categoria E — Clone write barrier e wrapper Firestore

**File:** `src/utils/cloneWriteBarrier.ts`, `src/utils/firestoreWriteOps.ts`

| Claim SPEC | File:Riga | Esito |
|---|---|---|
| `ARCHIVISTA_ALLOWED_FIRESTORE_DOC_PATHS = Set(["storage/@preventivi"])` | cloneWriteBarrier:107 | ✓ |
| `isAllowedArchivistaCloneWritePath` → `pathname === "/next/ia/archivista"` | cloneWriteBarrier:263–264 | ✓ |
| Blocco Archivista: `firestore.addDoc` consentito per `ARCHIVISTA_ALLOWED_FIRESTORE_COLLECTIONS` | cloneWriteBarrier:375–377 | ✓ |
| Blocco Archivista: `firestore.setDoc` consentito per `ARCHIVISTA_ALLOWED_FIRESTORE_DOC_PATHS` | cloneWriteBarrier:379–381 | ✓ |
| Blocco Archivista: NO `firestore.updateDoc` (assenza confermata) | cloneWriteBarrier:360–386 | ✓ |
| Blocco Archivista: `storageSync.setItemSync` consentito per `@mezzi_aziendali`, `@manutenzioni`, `@inventario`, `@materialiconsegnati` | cloneWriteBarrier:383–385 | ✓ |
| `addDoc` wrappato: chiama `assertCloneWriteAllowed("firestore.addDoc", ...)` | firestoreWriteOps:15–19 | ✓ |
| `updateDoc` wrappato: chiama `assertCloneWriteAllowed("firestore.updateDoc", ...)` | firestoreWriteOps:22–27 | ✓ |
| `setDoc` wrappato: chiama `assertCloneWriteAllowed("firestore.setDoc", ...)` | firestoreWriteOps:29–36 | ✓ |

**Divergenze categoria E: 0**

---

## Categoria F — Consistenza interna SPEC e perimetro D9

### F1 — Consistenza delle forme TypeScript proposte

Ogni forma TypeScript che la SPEC propone di aggiungere (es. `archivistaAnalysis` come campo opzionale) è coerente con le forme esistenti verificate:

- L'aggiunta di `archivistaAnalysis?: Record<string, unknown> | null` a `ArchivistaDocumentArchiveArgs` non crea conflitti con i campi esistenti a riga 71–81
- L'aggiunta dello stesso campo a `ArchivistaPresetPayload` / `ArchivistaPreset` (7 campi noti) non crea conflitti
- Il flusso proposto (preload → bridges) è compatibile con le firme esistenti: solo `ArchivistaDocumentoMezzoBridge` riceve `preloadDocument` (confermato alla riga 333–346 di `NextIAArchivistaPage.tsx`), quindi i 4 bridge senza preload restano invariati

### F2 — Perimetro D9

- La SPEC non propone nuove chiamate `firestore.updateDoc` nel blocco Archivista — coerente con il barrier che non consente questa operazione
- Le collection di scrittura proposte (`@documenti_mezzi`, `@documenti_magazzino`, `storage/@preventivi`) sono tutte già nella whitelist del barrier
- La SPEC non estende il perimetro Archivista oltre `/next/ia/archivista` — confermato

### F3 — Gap rilevati ma già identificati nella SPEC

La SPEC documenta consapevolmente due gap pre-esistenti nel codice:

1. **`buildArchivistaPreset` non differenzia manutenzione da magazzino** (righe 241–253 di `NextIADocumentiPage.tsx`): documenti con `family:"fattura_ddt_manutenzione"` ricevono `contesto:"magazzino"` invece di `"manutenzione"`. La SPEC riconosce questo come limitazione e propone di correggerlo usando `famigliaArchivista` dal record archiviato.

2. **`famigliaArchivista` non esposto in `NextIADocumentiArchiveItem`**: il campo viene scritto in Firestore (confermato a `ArchivistaArchiveClient.ts:489–492`) ma non letto da `mapIADocumentiArchiveRecord` (righe 1413–1448). La SPEC propone di aggiungerlo al mapper — modifica chirurgica, nessun conflitto di forma.

Entrambi i gap sono gap del codice, non errori della SPEC. La SPEC li descrive correttamente.

**Divergenze categoria F: 0**

---

## Top 5 claim più rischiose — tutte confermate

Le claim con il maggiore potenziale di errore (numeri di riga specifici su file lunghi, mapping 1:1 di valori enum):

1. `doc(db, "storage", "@preventivi")` a `ArchivistaArchiveClient.ts:554` → **CONFERMATO** esatto
2. `setDoc(refDoc, { preventivi: nextPreventivi }, { merge: true })` a riga 590–591 → **CONFERMATO** esatto
3. `isAllowedArchivistaCloneWritePath` → `pathname === "/next/ia/archivista"` a riga 263–264 → **CONFERMATO** esatto
4. `ARCHIVISTA_ALLOWED_FIRESTORE_DOC_PATHS = new Set(["storage/@preventivi"])` a riga 107 → **CONFERMATO** esatto
5. `voci: selectedRows.map(...)` con `prezzoUnitario: row.prezzo` a `ArchivistaManutenzioneBridge.tsx:798` → **CONFERMATO** esatto

---

## File letti per questa verifica

| File | Righe lette | Metodo |
|---|---|---|
| `src/next/internal-ai/ArchivistaArchiveClient.ts` | 1–720 (completo) | Read |
| `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx` | 1–654 (completo) | Read |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx` | 95–167, 1070–1169, 1488–1543, 1631–1672, 1800–1855, 2349–2564 | Read (sezioni) |
| `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx` | 17–130, 246–282 | Read (sezioni) |
| `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` | 19–46, 346–401, 502–582, 751–816, 875–880 | Read (sezioni) |
| `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx` | 18–32, 272–294, 388–435, 564–566, 601–654 | Read (sezioni) |
| `src/next/NextIADocumentiPage.tsx` | 35–43, 223–253, 487–493, 940–952 | Read (sezioni) |
| `src/next/NextIAArchivistaPage.tsx` | 17–25, 46–161, 324–354 | Read (sezioni) |
| `src/next/domain/nextDocumentiCostiDomain.ts` | 10–20, 1356–1448, 1920–2010 | Read (sezioni) |
| `src/utils/cloneWriteBarrier.ts` | 90–116, 250–270, 350–386 | Read (sezioni) |
| `src/utils/firestoreWriteOps.ts` | 1–40 | Read |

---

## AUDIT VERIFICA COMPLETATO

**ESITO FINALE: SPEC PRONTA PER IMPLEMENTAZIONE**

Zero divergenze in tutte le 6 categorie (A–F). Tutti i numeri di riga sono corretti al momento dell'audit. Tutti i simboli nominati dalla SPEC esistono nei file dichiarati. Le forme TypeScript sono accurate. Il perimetro D9 è rispettato. I due gap pre-esistenti nel codice sono documentati consapevolmente dalla SPEC e le correzioni proposte sono chirurgiche e non conflittuali.

La SPEC può essere consegnata all'implementatore senza patch v1.2.
