# DIAGNOSI LOOKUP VEHICLE360 — 2026-05-06

## Stato del documento
- Tipo: diagnosi di sola lettura.
- Operatore: Claude Code.
- Caso reale 2026-05-06 21:39: prompt "TI298409" → Vehicle360 montata, sezione "Anagrafica mezzo: dato non trovato nelle fonti autorizzate". Il mezzo TI298409 esiste nel gestionale (visto come "Stato mezzo attuale" di Riccardo Fenderico in Driver360 e nei Report rifornimenti del Centro di Controllo NEXT). Stesso problema su TI315407.
- Nessuna patch applicata. Nessuna esecuzione di build/Playwright/diagnostics. Nessuna modifica a file di codice.
- Limite ambientale: questa sessione NON ha accesso runtime a Firestore. La verifica del formato esatto di TI298409 nel database e' DEDOTTA dal codice e dal `REGISTRO_COLLECTION_FIRESTORE.md`.

---

## Sezione 1 — Catena di lookup

### 1.1 Catena passo-passo per input "TI298409"

| Passo | File:linea | Cosa succede |
|---|---|---|
| 1. Normalizzazione input | `backend/internal-ai/server/lib/chat-zero-preflight.js:21-23,49-72` | `buildChatZeroPreflightContext(prompt)` normalizza `searchText` con `replace(/\s+/g, " ").trim()`. Cerca pattern targa via `PLATE_PATTERN = /\b[A-Z]{2}\d{6}\b/i`. Per "TI298409" → `platePatternDetected: "TI298409"`, `entityKind: "vehicle"`. Niente uppercase/lowercase forzato sulla searchText (resta "TI298409" come digitato). |
| 2. Classificazione vista | `internal-ai-adapter.js` (`inferCertifiedViewFromPreflight`) | Le regex iniziali (`euromecc`, `cisterna`, `documenti mezzo`, `rifornimenti+plate`, `manutenzioni+plate`, `mezzo+plate`, `ricerca|cerca|trova`, `profilo|scheda+!plate`) NON matchano "TI298409" da solo. Fallthrough al hint: `hintEntityKind === "vehicle"` → `return "Vehicle360"`. |
| 3. Normalizzazione messaggio | `internal-ai-adapter.js` (`normalizeMessageForViewBinding`) | Riscrive `view = "Vehicle360"`, `filters.entityKind = "vehicle"`, `accompaniment.kind = "view_opened"`. |
| 4. Selezione entry | `internal-ai-adapter.js` (`getViewBindingEntryKeys("Vehicle360")` + `resolveByViewBinding`) | Filtra `REGISTRY_CONFIG_FASE_A.entries` con `viewBindings.includes("Vehicle360")`. Per Vehicle360: `sessions.autistiSessioneAttive`, `vehicles.mezziAziendali`, `refuelings.rifornimentiAutistiTmp`, `refuelings.rifornimenti`, `maintenance.manutenzioni`, `materials.materialiConsegnati`, `quotes.preventivi`, `quotes.preventiviApprovazioni`, `workshops.officine`, `documents.documentiMezziRoot`. |
| 5. Chiamata query-engine | `internal-ai-adapter.js` (`resolveByViewBinding` riga ~ `for (const entryConfigKey of entryConfigKeys) { ... runQueryEngine({ entryConfigKey, matchInput: { searchText }, query: {...} }) }`) | Per ogni entry chiama `runQueryEngine` con `searchText: "TI298409"`. |
| 6. Resolver universale exact_document | `backend/internal-ai/server/lib/universal-resolver.js:260-369` (`runUniversalResolverFaseA`) | Per `vehicles.mezziAziendali` (accessMode `exact_document`): legge `firestore.collection("storage").doc("@mezzi_aziendali").get()` (riga 337), poi `unwrapStorageItems(snapshot.data())` ritorna `data.items` array. |
| 7. Filtro + slice | `universal-resolver.js:350-356` | `rawItems.filter((raw) => matchesEntryRecord(entryConfig, raw, input.matchInput))` → poi `.slice(0, maxReturned)` con `maxReturned = boundaryEntry.requestLimits.maxReturnedVehicleRecords ?? rawItems.length`. |
| 8. Match strategy | `universal-resolver.js:144-149` (`matchesEntryRecord`) | **PUNTO CRITICO**: `if (entryConfig.matchStrategy === "driver_name_or_badge_exact_token_match") { return matchesDriverColleghiRecord(...); } return true;`. La matchStrategy `single_targa_exact_match` (entry `vehicles.mezziAziendali`) NON ha branch dedicato → ritorna `true` per OGNI record. Nessun filtro per targa applicato dentro il resolver. |
| 9. Cap requestLimits | `registry.config.js:162-165` (entry `vehicles.mezziAziendali`) | `requestLimits.maxReturnedVehicleRecords: 1`. Quindi `.slice(0, 1)` lascia SOLO il primo record di `items[]`, qualunque esso sia. |
| 10. Proiezione campi | `universal-resolver.js:185-203` (`buildCertifiedRecord`) | Il primo record viene proiettato sui suoi `allowedFields` (`id`, `targa`, `categoria`, `marca`, `modello`, `autistaId`, `autistaNome`, `librettoStoragePath`, `dataImmatricolazione`, `dataScadenzaRevisione`, `dataUltimoCollaudo`, `fotoPath`, `telaio`, `massaComplessiva`). |
| 11. Filtro post-merge nell'adapter | `internal-ai-adapter.js` (`filterResolvedFiltersBySearchText` + `certifiedRecordMatchesSearch`) | Ricevuti i risultati, l'adapter filtra `entry.records` con `certifiedRecordMatchesSearch(record, "TI298409")`. Per plateToken match: `normalizedValues.some((value) => value === normalizedPlate)`. Se l'unico record (il PRIMO di `items[]`) NON ha `targa === "TI298409"` → `filteredRecords.length === 0` → `entry.status = "empty"`. |
| 12. Aggregazione | `internal-ai-adapter.js` (`mergeResolvedFiltersV2`) | Aggrega tutti gli `entries[]` filtrati. Se `entry.records.length === 0` per `firestore-storage-mezzi-aziendali-doc`, la sezione "Anagrafica mezzo" del Vehicle360 (che legge SOLO da quell'entry, vedi `view.config.ts:71`) trova zero record. |
| 13. Render frontend | `src/next/chat-ia/views/CertifiedView.tsx` legge `resolvedFilters.entries[]` e per ogni `ViewSectionConfig` cerca i record dell'entry corrispondente. Per `vehicle_identity` con `entryBoundaryId: "firestore-storage-mezzi-aziendali-doc"` → records vuoti → mostra `emptyText: "dato non trovato nelle fonti autorizzate"`. |

### 1.2 Sub-verifica resolvedFilters.v2 generato per "TI298409"
`resolvedFilters.v2` viene generato (struttura conforme a `mergeResolvedFiltersV2`):
- `version: "resolvedFilters.v2"`
- `legacyDriver360: null`
- `query.searchText: "TI298409"`, `query.view: "Vehicle360"`, `query.entityKind: "vehicle"`
- `entries[]`: contiene una entry per ciascuno dei ~10 entry config di Vehicle360.
- Per `firestore-storage-mezzi-aziendali-doc`: `records: []` (vuoto, il primo record di `items[]` non e' TI298409 e il filtro post lo ha rifiutato), `status: "empty"`.
- Per altre entry: status dipende dal cap (per `refuelings.rifornimenti` cap 100, se TI298409 e' tra i primi 100 → trovato; altrimenti vuoto).

Il payload e' VALIDO ma le sezioni dichiarate dal `view.config.ts` per Vehicle360 (sezione `vehicle_identity` legge SOLO `firestore-storage-mezzi-aziendali-doc`) non ricevono dati.

### 1.3 Sub-verifica boundary
- `internal-ai-firebase-readonly-boundary.js:3-19` `FIRESTORE_MEZZI_ALLOWED_FIELDS` include `"targa"` (riga 5).
- `internal-ai-firebase-readonly-boundary.js:678` entry `firestore-storage-mezzi-aziendali-doc` referenzia `FIRESTORE_MEZZI_ALLOWED_FIELDS`.
- `registry.config.js:127-142` entry `vehicles.mezziAziendali` `allowedFields` include `"targa"` (riga 129).

**Il boundary espone correttamente il campo `targa`**. Il bug NON e' nel boundary.

---

## Sezione 2 — Formato targa nel database

Limite ambientale: nessun accesso runtime a Firestore in questa sessione.
Deduzione dal codice e dal registro v0.6:
- `REGISTRO_COLLECTION_FIRESTORE.md:489` per `storage/@mezzi_aziendali`: `targa: string, chiave mezzo; esempi ammessi: TI180147, TI282780.`
- Il pattern targa nel codice e' uppercase (`PLATE_TOKEN_PATTERN = /\b[A-Z]{2}\d{6}\b/gi` in `chat-zero-preflight.js:1`, `universal-resolver.js:40`, e `extractPlateToken` nell'adapter usa `searchText.toUpperCase().match(/\b[A-Z]{2}\d{6}\b/)`).
- `normalizeCertifiedSearchValue` (adapter) applica NFD + `toUpperCase()` + rimozione caratteri non-alfanumerici.

Ipotesi piu' probabile: TI298409 esiste come stringa `"TI298409"` nel campo `targa` di un elemento di `items[]` dentro `storage/@mezzi_aziendali`. Il format e' quasi certamente uppercase exact-match con la regola Zero-Invenzioni (D11). Il problema NON e' di formato ma di selezione.

---

## Sezione 3 — Struttura collection mezzi

**Risposta: B (documento storage con array `items[]`)**.

Evidenza:
- Boundary `internal-ai-firebase-readonly-boundary.js:663-688`: entry `firestore-storage-mezzi-aziendali-doc` ha `accessMode: "exact_document"`, `collection: "storage"`, `docId: "@mezzi_aziendali"`. NON e' una root collection con un documento per mezzo.
- Resolver `universal-resolver.js:337-356`: `firestore.collection("storage").doc("@mezzi_aziendali").get()`, poi `unwrapStorageItems(snapshot.data())` riga 75-85 estrae `data.items` o `data.value` o `data.value.items` come array.
- Registro `REGISTRO_COLLECTION_FIRESTORE.md:486-488`: "documento storage con array legacy (`items` / `value` / `value.items` secondo reader)".

Quindi `storage/@mezzi_aziendali` e' UN documento Firestore, e i mezzi sono in un array `items[]` dentro `data`.

**Il query-engine cerca dentro `items[]`** (via `unwrapStorageItems`), MA non filtra per `targa`. Vedi Sezione 4.

---

## Sezione 4 — Atteso vs reale

**Atteso**: catena `chat-zero-preflight` → `inferCertifiedViewFromPreflight` → `Vehicle360` instradata → `runQueryEngine("vehicles.mezziAziendali", { searchText: "TI298409" })` → resolver filtra `items[]` per `record.targa === "TI298409"` → ritorna 1 record corrispondente → adapter aggrega → frontend mostra anagrafica TI298409.

**Reale**: catena fino a `runQueryEngine` invariata. Ma:
- `universal-resolver.js:144-149` `matchesEntryRecord` non implementa `matchStrategy: "single_targa_exact_match"` → ritorna `true` per ogni record → NESSUN filtro per targa applicato dal resolver.
- `registry.config.js:163-165` `maxReturnedVehicleRecords: 1` → solo il PRIMO record di `items[]` sopravvive a `.slice(0, 1)`.
- Il filtro per targa avviene SOLO POST-merge nell'adapter (`certifiedRecordMatchesSearch`), su un set gia' troncato a 1 record.

**Dove si rompe**: due bug concorrenti.
1. La matchStrategy "single_targa_exact_match" e' un literal stringa ENTRY, ma il resolver universale conosce solo `driver_name_or_badge_exact_token_match`. Tutte le altre matchStrategy degenerano a `return true`.
2. Il cap `maxReturnedVehicleRecords: 1` dell'entry `vehicles.mezziAziendali` mantiene un legacy presupposto Driver360 ("un solo mezzo per autista"); non e' adatto a una vista Vehicle360 generica che cerca un mezzo per targa dentro un array di tutti i mezzi.

Tipo di mismatch: **G (struttura items[] e' raggiungibile ma il filtro per targa non e' implementato dentro il resolver) + E (cap del filtro v2 vincola il match a 1 record arbitrario)**.

---

## Sezione 5 — Confronto Driver360 vs Vehicle360

### Driver360 con prompt "Riccardo Fenderico"
1. Inferenza vista: regex `\b(profilo|scheda|quadro)\b` + `!extractPlateToken` (no targa nel testo) → Driver360.
2. Resolver via legacy `resolveWithUniversalResolverFaseA` (branch Driver360 in adapter): chiama `runQueryEngine("driver360.colleghi", { searchText: "Riccardo Fenderico" })`.
3. `universal-resolver.js:144-146`: matchStrategy `driver_name_or_badge_exact_token_match` → branch dedicato `matchesDriverColleghiRecord` → applica `tokenizeDriverSearchText` + `compactNominalValue` per match per nome/badge. **Il filtro PER NOME funziona dentro il resolver**.
4. Trovato il driver Riccardo Fenderico → adapter chiama `resolveDriver360RelationEntries` (introdotta nel C6 fix) che a sua volta chiama `runQueryEngine` su `vehicles.mezziAziendali` E `sessions.autistiSessioneAttive` SENZA `searchText`, poi filtra con `recordMatchesDriver360(record, entry, driverId, driverBadge)`.
5. Per `sessions.autistiSessioneAttive` (cap 20, matchStrategy generica): `recordMatchesDriver360` filtra su `badgeAutista === driverBadge`. Trova la sessione attiva di Riccardo Fenderico → record ha `targaMotrice = "TI298409"` (campo certificato).
6. Il `relation-resolver.js` enricchisce il record con `relations[]` includendo una `relation_kind: "driver_vehicle"` con `relationProof.sourceField = "badgeAutista+targaMotrice"`.
7. Driver360.tsx legge `entry.records[].relations[]`, estrae `vehiclePlate = "TI298409"` da `record.fields.targaMotrice.value` → mostra TI298409 come "Stato mezzo attuale".

**Driver360 NON cerca il mezzo TI298409 nella collection mezzi**. Lo legge come campo `targaMotrice` dentro un record di `@autisti_sessione_attive` (cap 20). Il filtro per badge funziona perche' `recordMatchesDriver360` (in adapter) filtra DOPO aver caricato 20 record sessione.

### Vehicle360 con prompt "TI298409"
1. Inferenza vista: hint `entityKind: "vehicle"` (da plate pattern) → Vehicle360.
2. `resolveByViewBinding` chiama `runQueryEngine("vehicles.mezziAziendali", { searchText: "TI298409" })`.
3. `universal-resolver.js:144-149`: matchStrategy `single_targa_exact_match` non gestita → resolver ritorna `true` per ogni record.
4. `.slice(0, 1)` → solo il PRIMO record di `items[]` → probabilmente NON TI298409.
5. `certifiedRecordMatchesSearch` nell'adapter filtra il singolo record → no match → entry vuota → sezione "Anagrafica mezzo" mostra `emptyText`.

### Differenza
**Driver360** legge TI298409 da `storage/@autisti_sessione_attive` (campo `targaMotrice`, cap 20, filtro per badge funzionante). **Vehicle360** cerca TI298409 in `storage/@mezzi_aziendali` (campo `targa`, **cap 1**, filtro per targa NON implementato nel resolver).

**Sono fonti diverse**. Driver360 legge la "relazione attiva" e prende la targa come stringa certificata. Vehicle360 cerca il mezzo come record primario, ma il resolver non sa filtrare per targa e il cap esclude quasi tutti i candidati.

---

## Sezione 6 — Verifica collegata rifornimenti

Entry `refuelings.rifornimenti`:
- `registry.config.js:223-303`: `accessMode: "exact_document"`, collection `storage/@rifornimenti`, `matchStrategy: "vehicle_plate_exact_match"`, `requestLimits.maxReturnedVehicleRecords: 100`, `viewBindings: ["Vehicle360", "Ricerca360"]`, `allowedFields` include `"targa"`, `"mezzoTarga"`, `"targaMotrice"`.
- `universal-resolver.js:144-149`: matchStrategy `vehicle_plate_exact_match` NON ha branch dedicato → ritorna `true` per ogni record.
- `.slice(0, 100)` → primi 100 record di `items[]`.
- L'adapter filtra POI con `certifiedRecordMatchesSearch` → estrae plateToken "TI298409" → matcha `record.fields.targa.value === "TI298409"` (o `mezzoTarga` o `targaMotrice`).

**Stesso bug del lookup mezzo, mitigato dal cap piu' alto (100 vs 1)**.

Conseguenze:
- Se TI298409 e' tra i primi 100 record di `@rifornimenti` items[] → trovato (probabile per un mezzo attivo recente).
- Se TI298409 ha piu' di N rifornimenti dove i primi 100 sono di altri mezzi → NON trovato.
- Se la richiesta e' "rifornimenti TI298409" su Vehicle360, il routing porta lo stesso il cap 100, lo stesso filtro post.

**Lo stesso bug si ripete sui rifornimenti**, ma e' meno visibile per il cap 100. Per la sezione `vehicle_identity` di Vehicle360 (cap 1) il bug e' acuto e sistematico.

---

## Sezione 7 — Causa principale

**Verdetto: G + E (concorrenti).**

### G — Struttura items[] esiste ed e' raggiungibile, ma il filtro per targa non e' implementato dentro il resolver
- `universal-resolver.js:75-85` `unwrapStorageItems` raggiunge correttamente `data.items`.
- `universal-resolver.js:144-149` `matchesEntryRecord`:
  ```
  function matchesEntryRecord(entryConfig, raw, matchInput) {
    if (entryConfig.matchStrategy === "driver_name_or_badge_exact_token_match") {
      return matchesDriverColleghiRecord(raw, matchInput);
    }
    return true;
  }
  ```
  Tutte le matchStrategy diverse da `driver_name_or_badge_exact_token_match` (incluse `single_targa_exact_match`, `vehicle_plate_exact_match`, `material_or_vehicle_exact_match`, ecc.) ritornano `true` SEMPRE. Il filtro e' delegato implicitamente all'adapter (post-merge), che pero' opera su un set gia' troncato.

### E — Cap requestLimits troppo basso esclude il match
- `registry.config.js:162-165` (entry `vehicles.mezziAziendali`):
  ```
  requestLimits: Object.freeze({
    maxDocumentReadsPerRequest: 1,
    maxReturnedVehicleRecords: 1,
  }),
  ```
  Il cap 1 e' un legacy Driver360 ("un mezzo per autista") che, applicato a una vista Vehicle360 generica con search per targa, lascia passare solo il PRIMO elemento di `items[]`.

### Riga incriminata principale
**`backend/internal-ai/server/lib/universal-resolver.js:144-149`** — `matchesEntryRecord` non implementa `single_targa_exact_match` (e tutte le altre matchStrategy "plate" / "material" / "site" introdotte dai blocchi 3-5 del piano).

In subordine: **`backend/internal-ai/server/lib/registry.config.js:163-165`** — `maxReturnedVehicleRecords: 1` non e' adatto per vista Vehicle360 generica.

Il filtro post-merge nell'adapter (`certifiedRecordMatchesSearch`, `filterResolvedFiltersBySearchText`) e' una toppa che non puo' funzionare se il resolver ha gia' scartato i record candidati.

---

## Sezione 8 — Cosa servirebbe per fixare

Descrizione, NON codice. Due interventi minimi e correlati:

1. **Implementare le matchStrategy mancanti nel resolver universale** (`universal-resolver.js:144-149`). Aggiungere branch per `single_targa_exact_match`, `vehicle_plate_exact_match`, `material_or_vehicle_exact_match`, `vehicle_or_site_exact_match`, ecc. Ciascun branch confronta la `searchText` (se contiene plate token o e' un valore exact) con i campi targa-equivalenti del record (`targa`, `mezzoTarga`, `targaMotrice`, `targaRimorchio`) usando exact match strict (D11). Il filtro deve essere applicato PRIMA di `.slice(0, maxReturned)`. In questo modo solo i record con la targa matching arrivano al cap, e il cap protegge da overload, non da mismatch.

2. **Allineare `maxReturnedVehicleRecords` per `vehicles.mezziAziendali` a un valore coerente con lookup per targa**. Il valore 1 era corretto quando l'entry serviva solo Driver360 (un autista, un mezzo). Ora che Vehicle360 lo usa per cercare un mezzo per targa dentro `items[]`, il cap deve permettere al filtro di trovare il record corrispondente. Un valore tipo 1 funziona SE il filtro per targa e' applicato prima dello slice (intervento 1); diversamente il cap va alzato a un valore tipo 200-500 (numero realistico di mezzi flotta) finche' l'intervento 1 non e' applicato.

Note correlate:
- Lo stesso pattern G+E si applica alle altre matchStrategy non implementate (rifornimenti, manutenzioni, materiali, lavori, ecc.). Il fix dell'intervento 1 risolve sistematicamente tutte queste viste.
- Il filtro post-merge nell'adapter (`certifiedRecordMatchesSearch`) puo' restare come secondo livello di sicurezza, ma non e' la sede primaria del filtro.
- Boundary, registry `allowedFields`, struttura items[], nome del campo `targa`, formato uppercase: tutti corretti. Nessuna modifica a questi e' necessaria.
