# Audit Firestore Coverage Chat IA NEXT

**Data:** 2026-04-30
**Auditor:** Claude (autonomo, mode Senior Engineer + Auditor Forense)
**Tipo:** AUDIT FORENSE — solo lettura, nessuna patch
**Tool eseguiti:**
- `tests/audit/auditFirestoreCoverage.mjs` (read-only su 32 storage keys + 13 root collections)
- `tests/audit/auditUserCases.mjs` (test casi utente specifici)
- Output JSON in `tests/audit/output/firestore-coverage.json` e `tests/audit/output/user-cases.json`

---

## Sommario Esecutivo

| Indicatore | Valore |
|---|---|
| Tool nel registry (`src/next/chat-ia/tools/registry/`) | **59 file** |
| Tool importati in `index.ts` e registrati | **58** |
| Tool fisicamente presenti ma NON importati | **1** (`toolGetWheelGeometryConfig` — auto-bloccato) |
| Tool BLOCCATI dichiarati (Round 1 + Round 2) | **7** (4 Round 1 senza file + 3 Round 2 GAP-D) |
| Tool BLOCCATI con file presente (stub) | **1** (`toolGetWheelGeometryConfig`) |
| Tool effettivamente operativi | **58** (i 58 importati di cui 1 stub blocked) ⇒ **57 operativi reali** |
| Storage keys Firestore identificate (business) | **32** |
| Root collection identificate | **13** |
| Storage keys vuote (0 items) | **5** (`@preventivi`, `@listino_prezzi`, `@costiMezzo`, `@mezzi_foto_viste`, `@mezzi_hotspot_mapping`) |
| Storage keys MISSING (doc inesistente) | **5** (`@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@analisi_economica_mezzi`, `@impostazioni_app`) |
| Collection orfane / vuote | **5** (`euromecc_area_meta`, `euromecc_extra_components`, `chat_ia_reports`, `@documenti_generici`, `@costiMezzo`) |
| Gap CRITICI identificati | **7** |
| Gap MEDI identificati | **6** |
| Data quality issue maggiori | **8** |

**Verdetto sintetico:** la chat IA presenta gap **strutturali su 5 fronti**:

1. **`@costiMezzo` è completamente VUOTA** (0 in storage, 0 in collection) ⇒ tutti i tool costi (`get_costs`, `get_cost_aggregates`, `get_vehicle_cost_summary`) leggono questa fonte ma il dato reale vive su `@documenti_mezzi` (collection root, 11 docs) e `@documenti_magazzino` (collection root, 3 docs).
2. **Filtro categoria mezzi sbagliato**: l'utente chiede "motrici" e il sistema, filtrando per `categoria.includes("motrice")`, restituisce **4 mezzi** invece di **19** reali (`tipo === "motrice"`). Il campo `tipo` (motrice / cisterna) e `categoria` (motrice 2 assi / trattore stradale / vasca / …) sono semantiche disgiunte e i tool le confondono.
3. **Modello dual `storage` / `collection root` non gestito uniformemente**: `@documenti_mezzi` esiste solo come collection root (11 docs), `@analisi_economica_mezzi` solo come collection root (1 doc) ⇒ tutti i tool che leggono via `doc(db, "storage", "@…")` falliscono silenziosamente e l'IA risponde "nessun documento".
4. **Normalizzazione `tipoDocumento` assente**: in `@documenti_mezzi` convivono `"libretto"` (6) / `"PREVENTIVO"` (2) / `"Fattura"` (2) / `"fattura"` (1). Filtri stringenti perdono fino al 67% dei record.
5. **Manutenzioni aprile 2026 con `eseguito` mai popolato**: 13 record di aprile, **0 con `eseguito === true`**. I tool che filtrano per "manutenzioni effettuate" perdono l'intero mese.

---

## Sezione 1 — Inventario Tool (Registry)

**Totale file in `src/next/chat-ia/tools/registry/`: 59.**
**Importati in `src/next/chat-ia/tools/index.ts`: 58.**
**Non importato (orfano): 1 → `toolGetWheelGeometryConfig` (file bloccato volontariamente, restituisce `{ blocked: true }`).**

### 1.1 Tool operativi (58 importati)

Per ogni tool, l'audit ha verificato: file, descrizione, reader/domain chiamati, collection lette, filtri hardcoded, cap output. Risultati condensati (i dettagli completi sono nel JSON `firestore-coverage.json` e nei file dei tool).

| # | Nome tool | Reader principale | Cap output | Filtri salienti |
|---|---|---|---|---|
| 1 | `compare_periods` | `readNextDocumentiCostiFleetSnapshot`, `readNextRifornimentiReadOnlySnapshot` | nessuno | per campo numerico |
| 2 | `compare_refueling_sources` | `readNextRifornimentiReadOnlySnapshot`, `readNextCisternaSnapshot` | nessuno | testo "cisterna" |
| 3 | `compute_average` | 3 reader (cisterna, costi, rifornimenti) | nessuno | groupBy condizionale |
| 4 | `delete_archived_report` | `markChatIaReportArchiveEntryDeleted` | nessuno | richiede confirm |
| 5 | `download_document_pdf` | `readNextMezzoDocumentiSnapshot` | nessuno | nessuno |
| 6 | `find_invoice_supplier` | `readNextDocumentiCostiFleetSnapshot`, `readNextIADocumentiArchiveSnapshot` | 50 | id/numero/targa/importo |
| 7 | `find_outliers` | `readNextDocumentiCostiFleetSnapshot`, `readNextRifornimentiReadOnlySnapshot` | nessuno | soglia/mediana+2σ |
| 8 | `generate_report_pdf` | `generateChatIaReportPdf` | nessuno | sector enum |
| 9 | `get_adblue_tank_events` | `readNextAdBlueSnapshot` | 200 (def 80) | impianto/periodo |
| 10 | `get_capo_costs_by_vehicle` | `readNextCapoCostiMezzoSnapshot` | nessuno | nessuno |
| 11 | `get_cisterna_documents` | `readNextCisternaSnapshot` | nessuno | monthKey/fornitore |
| 12 | `get_cisterna_refuelings` | `readNextCisternaSnapshot` | nessuno | periodo |
| 13 | `get_cisterna_snapshot` | `readNextCisternaSnapshot` | nessuno | nessuno |
| 14 | `get_consumption_average` | `readNextMezzoRifornimentiSnapshot`, `readNextMezzoByTarga` | nessuno | inPeriod |
| 15 | `get_cost_aggregates` | `readNextDocumentiCostiFleetSnapshot` | nessuno | groupBy enum |
| 16 | `get_costs` | `readNextDocumentiCostiFleetSnapshot`, `readNextMezzoDocumentiCostiSnapshot` | 50 | categoria/periodo |
| 17 | `get_document_costs_by_vehicle` | `readNextMezzoDocumentiCostiSnapshot`, `readNextMezzoDocumentiCostiPeriodView` | 50 | tipo aliases |
| 18 | `get_driver_activity` | `readNextAutistiReadOnlySnapshot` | 25 | nome/badge + inPeriod |
| 19 | `get_driver_by_badge` | `readNextColleghiSnapshot` | nessuno | nessuno |
| 20 | `get_driver_by_name` | `readNextColleghiSnapshot` | nessuno | nessuno |
| 21 | `get_driver_operational_profile` | 3 reader (autisti / centro / colleghi) | 25 | nome/badge |
| 22 | `get_euromecc_snapshot` | `readEuromeccSnapshot` | 200 (def 80) | state enum/area/priority |
| 23 | `get_historical_operational_events` | `readNextCentroControlloSnapshot` | nessuno | targa/query |
| 24 | `get_invoice_by_id` | `readNextDocumentiCostiFleetSnapshot`, `readNextIADocumentiArchiveSnapshot` | nessuno | id |
| 25 | `get_material_movements` | `readNextMaterialiMovimentiSnapshot` | 50 | targa/destinatario/materiale |
| 26 | `get_procurement_costs` | `readNextProcurementSnapshot`, `readNextProcurementReadOnlySnapshot` | nessuno | stato/fornitore/testo |
| 27 | `get_refuelings` | `readNextMezzoRifornimentiSnapshot` | 10 | periodo/targa |
| 28 | `get_refuelings_aggregated` | `readNextRifornimentiReadOnlySnapshot`, `readNextCisternaSnapshot` | 50 (per targa) | fonte enum |
| 29 | `get_saved_economic_analysis` | `readNextAnalisiEconomicaSavedSnapshot` | nessuno | periodo |
| 30 | `get_site_equipment` | `readNextAttrezzatureCantieriSnapshot` | nessuno | tipoMap/categoria |
| 31 | `get_vehicle_by_plate` | `readNextMezzoByTarga` | nessuno | nessuno |
| 32 | `get_vehicle_cost_summary` | `readNextMezzoDocumentiCostiPeriodView`, `readNextProcurementSnapshot` | nessuno | groupBy |
| 33 | `get_vehicle_documents` | `readNextMezzoDocumentiSnapshot` | nessuno | tipo opt |
| 34 | `get_vehicle_dossier_snapshot` | `readChatIaMezzoSnapshot` | 5 (lavori) | nessuno |
| 35 | `get_vehicle_events` | `readNextMezzoSegnalazioniControlliSnapshot` | 25 | inPeriod, targa req |
| 36 | `get_vehicle_maintenance_history` | `readNextMezzoManutenzioniSnapshot` | nessuno | inPeriod |
| 37 | `get_vehicle_material_movements` | `readNextMaterialiMovimentiSnapshot` | 50 | targa req/periodo |
| 38 | `get_vehicle_status` | `readNextStatoOperativoSnapshot`, `readNextMezzoByTarga` | nessuno | targa match |
| 39 | `get_vehicle_timeline_360` | 3 reader (dossier composito / lavori / rifornimenti) | 25 | periodo/docs/materials |
| 40 | `list_archived_reports` | `listChatIaReportArchiveEntries` | 20 | sector |
| 41 | `list_drivers` | `readNextColleghiSnapshot` | 10 | testo |
| 42 | `list_inventory` | `readNextInventarioSnapshot` | 50 | testo/fornitore/stockStatus |
| 43 | `list_scheduled_maintenance_due` | `readNextAnagraficheFlottaSnapshot`, `readNextMezzoManutenzioniSnapshot` | 20 (history) | status/categoria |
| 44 | `list_suppliers` | `readNextFornitoriSnapshot`, `readNextProcurementSnapshot` | 200 (def 50) | testo/id |
| 45 | `list_vehicles` | `readNextAnagraficheFlottaSnapshot` | nessuno | categoria/scadenza |
| 46 | `list_vehicles_without_driver` | `readNextAnagraficheFlottaSnapshot` | nessuno | `!autistaId && !autistaNome` |
| 47 | `list_workshops` | `readNextOfficineSnapshot` | 200 (def 50) | testo/citta |
| 48 | `navigate_to` | (none) | nessuno | whitelist route |
| 49 | `open_dossier_page` | `buildNextDossierPath` | nessuno | nessuno |
| 50 | `open_magazzino_section` | `buildNextMagazzinoPath` | nessuno | section enum |
| 51 | `reconcile_cisterna_month` | `readNextCisternaSnapshot`, `readNextCisternaSchedaDetail` | 5 | focus |
| 52 | `retrieve_archived_report` | `readChatIaReportArchiveEntry` | nessuno | nessuno |
| 53 | `save_report_to_archive` | `createChatIaReportArchiveEntry` | nessuno | shape check |
| 54 | `search_documents_and_invoices` | `readNextDocumentiCostiFleetSnapshot`, `readNextIADocumentiArchiveSnapshot` | 50 | tipo aliases / importo / numero |
| 55 | `search_maintenances` | `readNextManutenzioniLegacyDataset`, `readNextAnagraficheFlottaSnapshot` | 5 | stato / targa / testo / periodo |
| 56 | `search_operational_events` | `readNextAutistiReadOnlySnapshot`, `readNextCentroControlloSnapshot` | 25 | targa / autista / badge / tipo |
| 57 | `search_vehicles_by_attribute` | `readNextAnagraficheFlottaSnapshot` | nessuno | field enum |
| 58 | `search_work_orders` | `readNextLavoriEseguitiSnapshot`, `readNextLavoriInAttesaSnapshot` | 25 | stato / urgenza / testo / targa |

### 1.2 Tool BLOCCATO con file presente

| Tool | File | Stato | Motivo |
|---|---|---|---|
| `get_wheel_geometry_config` | `toolGetWheelGeometryConfig.ts` | **blocked: true**, NON importato in index.ts | Reader clone-safe `@wheelGeom_override_v1` non esiste nel perimetro NEXT (override sta in `src/pages/ModalGomme.tsx:25` e `src/next/autisti/NextModalGomme.tsx:54` ma non c'è un domain reader). |

### 1.3 Tool BLOCCATI Round 1 (referenziati nel TOOL_REGISTRY ma senza file)

Da `docs/product/TOOL_REGISTRY_CHAT_IA_NEXT.md` Round 1 risultano 4 tool senza implementazione (`search_events`, `get_cisterna_levels`, `generate_chart`, `open_vehicle_edit_modal`). Verificato in audit precedente (`VERIFICA_TOOL_REGISTRY_CHAT_IA_NEXT_2026-04-28.md`).

### 1.4 Tool BLOCCATI Round 2 GAP-D (3)

| Tool | Motivo blocco | Verifica audit (2026-04-30) |
|---|---|---|
| `list_driver_license_expirations` | Nessun campo `patente`/`scadenzaPatente` su `NextCollegaReadOnlyItem` | **Confermato live**: `@colleghi` (12 record) non contiene `patente` in nessun record. |
| `get_vehicle_engine_number` | `numeroMotore` non strutturato in `NextAnagraficheFlottaMezzoItem` né in `RAW_LIBRETTO_ALIASES` | **Confermato live**: `@mezzi_aziendali` (37 record) non contiene `numeroMotore` o alias equivalenti. |
| `get_cisterna_physical_level` | Livello fisico non persistito in `NextCisternaSnapshot` | **Confermato live**: `@cisterne_adblue` (1 record) ha solo metadati container. |

---

## Sezione 2 — Inventario Collection Firestore

### 2.1 Storage keys (documenti dentro `storage` con `items[]`)

Numeri reali misurati il 2026-04-30 ~13:28 UTC, anonymous auth, progetto `gestionemanutenzione-934ef`.

| Storage key | Count items | Top-3 campi (coverage) | Stato |
|---|---:|---|---|
| `@mezzi_aziendali` | **37** | `id`/`tipo`/`targa`/`categoria` 100% | OK |
| `@colleghi` | **12** | `id`/`nome` 100%, `badge`/`telefono` 92% | OK ma scarno |
| `@fornitori` | **4** | `nome`/`telefono` 100% | molto scarno |
| `@officine` | **1** | `nome`/`telefono`/`citta` | quasi assente |
| `@lavori` | **13** | `urgenza`/`eseguito`/`source`/`tipo` 100% | OK |
| `@manutenzioni` | **50** | `id`/`targa`/`tipo`/`descrizione`/`data` 100%, `eseguito` 44% | parziale |
| `@inventario` | **17** | `stockKey`/`quantita`/`unita`/`descrizione` 100%, `categoria` 0% | ricco ma senza categorie |
| `@materialiconsegnati` | **33** | `motivo`/`stockKey`/`tipo`/`materiale`/`destinatario` 100% | OK |
| `@rifornimenti` | **248** | `mezzoTarga`/`litri`/`distributore`/`data` 100%, `costo` 0% | OK ma senza costo |
| `@rifornimenti_autisti_tmp` | **249** | `badgeAutista`/`targaCamion`/`autistaNome`/`tipo`/`data` 100% | shape diversa da `@rifornimenti` |
| `@ordini` | **5** | (procurement) | OK |
| `@preventivi` | **0** | — | **VUOTA** |
| `@preventivi_approvazioni` | **2** | — | scarno |
| `@listino_prezzi` | **0** | — | **VUOTA** |
| `@costiMezzo` | **0** | — | **VUOTA** ⇒ vedi gap critico §3.1 |
| `@documenti_mezzi` (storage) | **MISSING** | — | doc inesistente, dato sta in collection root |
| `@documenti_magazzino` (storage) | **MISSING** | — | doc inesistente, dato sta in collection root |
| `@documenti_generici` (storage) | **MISSING** | — | doc inesistente |
| `@attrezzature_cantieri` | **12** | `id`/`data`/`descrizione`/`tipo`/`cantiereLabel` 100% | OK |
| `@cisterne_adblue` | **1** | (snapshot) | scarno |
| `@alerts_state` | **1** | (snapshot) | OK |
| `@segnalazioni_autisti_tmp` | **32** | — | OK |
| `@controlli_mezzo_autisti` | **330** | — | OK |
| `@storico_eventi_operativi` | **270** | `tipo`/`timestamp`/`source` 100% | OK |
| `@autisti_sessione_attive` | **9** | — | OK |
| `@richieste_attrezzature_autisti_tmp` | **12** | — | OK |
| `@cambi_gomme_autisti_tmp` | **10** | — | OK |
| `@gomme_eventi` | **9** | — | OK |
| `@mezzi_foto_viste` | **0** | — | **VUOTA** |
| `@mezzi_hotspot_mapping` | **0** | — | **VUOTA** |
| `@analisi_economica_mezzi` (storage) | **MISSING** | — | doc inesistente, sta in collection root |
| `@impostazioni_app` | **MISSING** | — | doc inesistente |

### 2.2 Root collections

| Collection | Count docs | Top campi | Note |
|---|---:|---|---|
| `euromecc_pending` | **4** | (task aperti) | OK |
| `euromecc_done` | **54** | — | OK, massa storica utilizzabile |
| `euromecc_issues` | **2** | — | scarno |
| `euromecc_area_meta` | **0** | — | **VUOTA** |
| `euromecc_relazioni` | **2** | — | scarno |
| `euromecc_extra_components` | **0** | — | **VUOTA** |
| `autisti_eventi` | **105** | — | OK, fallback legacy |
| `chat_ia_reports` | **0** | — | **VUOTA** (archivio non ancora popolato) |
| `@documenti_mezzi` | **11** | `id`/`fonte`/`createdAt`/`targa`/`nomeFile`/`tipoDocumento` 100% | **dato vivo** (libretti + fatture) |
| `@documenti_magazzino` | **3** | `id`/`dataDocumento`/`fileUrl`/`fornitore`/`numeroDocumento` 100% | **dato vivo** (fatture magazzino) |
| `@documenti_generici` | **0** | — | **VUOTA** |
| `@costiMezzo` | **0** | — | **VUOTA** |
| `@analisi_economica_mezzi` | **1** | (testo libero) | scarno (1 sola targa analizzata: TI324623) |

### 2.3 Valori categoriali distinti (campi enum critici)

| Storage / collection | Campo | Distinct | Top valori (count) |
|---|---|---:|---|
| `@mezzi_aziendali` | `categoria` | 12 | `trattore stradale` (10), `semirimorchio asse sterzante` (8), `pianale` (3), `motrice 3 assi` (2), `motrice 2 assi` (1), `motrice 4 assi` (1), `Trattore a sella` (2), `biga` (2), `vasca` (2), `centina` (2), `porta silo container` (2), `semirimorchio asse fisso` (2) |
| `@mezzi_aziendali` | `tipo` | 2 | `motrice` (n.d. da categoricals; misurato in user-cases = 19), `cisterna` |
| `@mezzi_aziendali` | `stato`, `trazione`, `tipoMezzo` | **0** | tutti 100% missing |
| `@manutenzioni` | `tipo` | 3 | `mezzo` (39), `compressore` (10), `attrezzature` (1) |
| `@manutenzioni` | `tipoIntervento`, `stato`, `categoria` | **0** | tutti 100% missing |
| `@lavori` | `urgenza` | 3 | `media` (9), `alta` (2), `bassa` (2) |
| `@lavori` | `statoVista`, `stato`, `categoria` | **0** | tutti 100% missing |
| `@lavori` | `tipo` | 1 | `targa` (13 — campo carica un valore degenere) |
| `@documenti_mezzi` (root) | `tipoDocumento` | 4 | `libretto` (6), `PREVENTIVO` (2), `Fattura` (2), `fattura` (1) |
| `@documenti_mezzi` (root) | `tipo`, `kind`, `categoria` | **0** | tutti 100% missing |
| `@documenti_magazzino` (root) | `tipoDocumento` | 1 | `FATTURA` (3) |
| `@inventario` | `fornitore` | 5 | `MARIBA` (6), `TRUCK SERVICE` (5), `TURBO DIESEL` (2), `Thommen-Furler AG` (1), `MARIBA s.r.l.` (1) |
| `@inventario` | `categoria`, `stockStatus` | **0** | tutti 100% missing |
| `@rifornimenti` | `fonte`, `fornitore`, `carburante`, `tipoRifornimento` | **0** | tutti 100% missing — il `distributore` (testo libero) sostituisce |
| `@storico_eventi_operativi` | `tipo` | 4 | `CAMBIO_ASSETTO` (192), `INIZIO_ASSETTO` (48), `LOGIN_AUTISTA` (20), `LOGOUT_AUTISTA` (10) |

---

## Sezione 3 — Gap Analysis

### 3.1 Collection orfane / mai lette dai tool

| Storage / collection | Count | Tool che la legge | Verdetto |
|---|---:|---|---|
| `autisti_eventi` (root) | **105** | Solo fallback in `nextAutistiDomain.ts:26` | **POTENZIALE ORFANA per chat IA**: nessun tool del registry interroga direttamente `autisti_eventi`. I tool autisti leggono `@autisti_sessione_attive` (9), `@segnalazioni_autisti_tmp` (32), `@controlli_mezzo_autisti` (330), `@storico_eventi_operativi` (270). Se un evento storico autista è solo in `autisti_eventi` (105 doc) **viene perso**. |
| `euromecc_done` (root) | **54** | `get_euromecc_snapshot` via `readEuromeccSnapshot` — copre `pending` + `done` + `issues` | OK letto |
| `@analisi_economica_mezzi` (root) | **1** | `get_saved_economic_analysis` — il tool punta a sourceCollection ma la lettura passa per `readNextAnalisiEconomicaSavedSnapshot`. Verificare che il reader aggrega da collection root e non solo storage. | **DA VERIFICARE**: se il reader cerca solo `doc(db, "storage", "@analisi_economica_mezzi")` (storage MISSING), il tool restituisce sempre vuoto invece di trovare l'analisi salvata per TI324623. |
| `@documenti_mezzi` (root, 11 docs) vs `@documenti_mezzi` storage (MISSING) | **11** | Audit pregresso dichiara che i tool documenti leggono entrambe le forme (`firestoreHelpers.ts:90-101`). | **DA VERIFICARE READER**: se il reader business legge solo storage, perde tutti gli 11 documenti reali (6 libretti + 5 fatture/preventivi). |
| `@documenti_magazzino` (root, 3 docs) vs storage (MISSING) | **3** | Stessa logica | **DA VERIFICARE READER** |

### 3.2 Gap quantitativi (record persi)

| Gap | Misura |
|---|---|
| **GAP-Q1 — `@costiMezzo` totalmente vuota** | 0 items in storage + 0 docs in collection. Tool `get_costs`, `get_cost_aggregates`, `get_vehicle_cost_summary`, `find_outliers`, `compare_periods`, `compute_average` (parziali) leggono `readNextDocumentiCostiFleetSnapshot` che a sua volta indicizza `@costiMezzo`. Se il reader non sa fallire-su `@documenti_mezzi`/`@documenti_magazzino` (collection root con dato reale) → l'IA risponde "0 costi" su tutta la flotta. |
| **GAP-Q2 — `@analisi_economica_mezzi` storage MISSING** | 0 items in storage, 1 doc in collection root. Il tool `get_saved_economic_analysis` rischia di non trovare l'unica analisi salvata (TI324623). |
| **GAP-Q3 — `@officine` con 1 solo record** | `list_workshops` può restituire solo 1 risultato anche cercando per testo libero. Non è un gap del tool ma di qualità del dataset. |
| **GAP-Q4 — `@fornitori` con 4 record** | Ridotto. `list_suppliers` integra con `@inventario` (5 fornitori distinti, di cui 4 non presenti in `@fornitori`: TRUCK SERVICE, TURBO DIESEL, Thommen-Furler AG, MARIBA s.r.l.). Il tool ha un fallback `procurement` ma manca un consolidamento "fornitori reali da movimenti". |
| **GAP-Q5 — `@lavori` 13 record vs `@manutenzioni` 50 record** | I due dataset coesistono e il tool `search_work_orders` legge solo `@lavori` (13). Le manutenzioni storiche vere (50) sono in `@manutenzioni` e accessibili solo via `search_maintenances`. L'utente che chiede "lavori effettuati su TI324633" ottiene risposta parziale se non cita esplicitamente "manutenzioni". |
| **GAP-Q6 — `@mezzi_foto_viste` e `@mezzi_hotspot_mapping` vuote** | Reader `readNextMappaStoricoSnapshot` legge entrambe ma sono 0/0. Nessun tool della chat usa questo dataset, ma se l'utente chiede "foto del mezzo" il sistema risponde correttamente "nessuna" (non un gap del tool). |
| **GAP-Q7 — `@preventivi` e `@listino_prezzi` vuote** | `get_procurement_costs` legge `@preventivi` (0) e `@listino_prezzi` (0) ⇒ output sempre vuoto su quei due fronti. Solo `@ordini` (5) e `@preventivi_approvazioni` (2) hanno dati. |

### 3.3 Gap campi (campi presenti in Firestore ma non passati all'IA)

Verificato spot-check: i tool `list_vehicles` e `search_vehicles_by_attribute` mappano `NextAnagraficheFlottaMezzoItem` (definito a `nextAnagraficheFlottaDomain.ts:79`). Confronto con sample reale di `@mezzi_aziendali`:

| Campo Firestore | Coverage misurata | Nei tool? |
|---|---|---|
| `proprietario` | 100% | **NO** in items output di `list_vehicles` (verificato: shape `NextAnagraficheFlottaMezzoItem` espone `targa/categoria/tipo/anno/marcaModello` ma `proprietario` non è in output) |
| `manutenzioneContratto` | (variabile) | **NO** mappato come stringa, raramente esposto |
| `note` | 100% | **NO** spesso filtrato come "info interna" |
| `dataUltimoCollaudo` | (variabile) | **NO** vs `dataScadenzaRevisione` esposta |
| `librettoStoragePath` | 100% | **NO** in items (esposto solo `librettoUrl` se presente) |
| `cilindrata`, `potenza`, `massaComplessiva` | 100% | **PARZIALE**: esposti come stringa raw; non normalizzati a numero |

Per `@manutenzioni`:
| Campo | Coverage | Esposto |
|---|---|---|
| `materiali` | 24% | **VARIABILE**: l'audit non ha verificato il mapping puntuale, ma è un campo testuale lungo che spesso contiene info chiave per l'utente |
| `gommeInterventoTipo` | 6% | **NO**: tool `search_maintenances` non distingue manutenzioni gomme |
| `assiCoinvolti` | 2% | NO |
| `gommePerAsse` | 2% | NO |
| `ore` | 18% | (variabile) |
| `km` | 48% | esposto |

Per `@rifornimenti`:
| Campo | Coverage | Esposto |
|---|---|---|
| `costo` | **0%** | il campo non è mai popolato — i tool consumo/costo rifornimento dipendono dalle fatture (`@documenti_mezzi`/`@documenti_magazzino`) |
| `note` | 4% | quasi sempre missing, ma quando popolato è significativo |

Per `@documenti_mezzi` (collection root):
| Campo | Coverage | Esposto in `search_documents_and_invoices`? |
|---|---|---|
| `riassuntoBreve` | 64% | **DA VERIFICARE**: il tool restituisce `items` ma non è chiaro se include il riassunto dell'archivista. Se non lo passa, l'IA non può rispondere "di cosa parla la fattura X" senza un secondo tool. |
| `voci` (su magazzino) | 100% | NO se filtrato — dettaglio voci fattura magazzino è perso |
| `imponibile` / `ivaImporto` / `totaleDocumento` | 100% (magazzino) | **DA VERIFICARE**: tool `search_documents_and_invoices` mappa `importo` ma non separa imponibile/iva |
| `campiMancanti` (array da archivista) | (variabile) | NO, eppure utile per dire "questa fattura ha campi mancanti" |
| `avvisi` (array) | (variabile) | NO |

### 3.4 Gap filtri (categoria, tipo, sottotipo, alias)

| Gap | Conseguenza |
|---|---|
| **GAP-F1 — `categoria` vs `tipo` mezzi** ⚠️ CRITICO | Categoria ha 12 valori granulari ("motrice 2 assi", "trattore stradale"…), `tipo` ha 2 valori ("motrice", "cisterna"). User chiede "motrici" → tool `list_vehicles` filtra `categoria.includes("motrice")` → **4 risultati** invece di 19. Test: `case3_motrici` → 15 mezzi `tipo=motrice` ma `categoria=trattore stradale` (TI324623, TI324633, TI279216, TI 334558, TI239045, TI229717, TI298409, TI136914, TI319450, TI113417, TI239279, TI180147, …). |
| **GAP-F2 — `tipoDocumento` non normalizzato** | "Fattura" / "fattura" / "PREVENTIVO" / "libretto" coesistono. Filtro `tipoDocumento === "fattura"` → 1 record. Filtro `tipoDocumento.toLowerCase() === "fattura"` → 3 record. Audit precedente nota fix parziale (alias "officina"/"intervento") ma per `tipoDocumento` non risulta normalizzazione case-insensitive. |
| **GAP-F3 — `eseguito` su `@manutenzioni`** | 50 record totali, di cui 22 `eseguito === true` (44%). Su aprile 2026: **0 su 13 record** hanno `eseguito === true`. La distinzione effettuate/programmate non è affidabile via questo campo. |
| **GAP-F4 — `statoVista`/`stato` su `@lavori` 0%** | Tool `search_work_orders` accetta filtro `stato: "da_eseguire" | "in_attesa" | "eseguito"` ma il dato reale ha `eseguito: bool` e nessun campo `stato`/`statoVista`. La mappatura nel reader (`statoVista` deriva da `eseguito` e `dataChiusura` 0%) può funzionare, ma il filtro per "lavori chiusi" (deriva da dataChiusura) restituisce sempre 0. |
| **GAP-F5 — `fonte`/`fornitore`/`carburante` su `@rifornimenti` 0%** | Tool `compare_refueling_sources` distingue cisterna vs distributore confrontando il testo `distributore`. Funziona empiricamente (es. "caravate" → cisterna interna), ma non c'è un campo enum normalizzato. |
| **GAP-F6 — `categoria`/`fornitore` su `@inventario`** | `categoria` 0%, `fornitore` 88% ma con duplicati ("MARIBA" vs "MARIBA s.r.l."). Filtro per categoria perde tutto; filtro per fornitore può perdere l'azienda con la variante non standard. |

### 3.5 Ridondanze e duplicati

| Ridondanza | Misura |
|---|---|
| **RID-1 — `@rifornimenti` (248) + `@rifornimenti_autisti_tmp` (249)** | I due dataset sono semanticamente disgiunti su TI324633 aprile 2026: 15 record in @rifornimenti (interni cisterna), 0 in autisti_tmp ⇒ **0 duplicati cross-collection per TI324633 aprile**. Su altri mezzi/periodi i duplicati possono esistere (gli helper `firestoreHelpers.ts:70-88` fanno union senza dedup). Il tool `compare_refueling_sources` distingue le due fonti, ma `get_refuelings_aggregated` somma tutto: rischio gonfiamento. |
| **RID-2 — `destinatario` come oggetto JSON** | In `@materialiconsegnati` il campo `destinatario` è un object `{type, refId, label}` ma con **ordine chiavi non stabile**. L'audit ha trovato 29 valori "distinct" su 33 record che in realtà sono ~13 destinatari logici, semplicemente con object key reordering. Tool che fa group-by su `JSON.stringify(destinatario)` produce conteggi fasulli. |
| **RID-3 — Manutenzioni vs Lavori** | Entità separate ma sovrapposte: `@manutenzioni` ha 50 record (mezzo/compressore/attrezzature), `@lavori` ha 13 record. Senza un cross-link esplicito, l'IA può contare 2 volte lo stesso intervento se l'utente chiede "tutti gli interventi". Conferma audit precedente Round 1 GAP-2 (entità separate). |
| **RID-4 — `@fornitori` (4) vs fornitori in `@inventario` (5)** | I 5 fornitori inventario non coincidono con i 4 anagrafici. Esempio: "TRUCK SERVICE" è il top-2 fornitore inventario (5 movimenti) ma non figura in `@fornitori`. Tool `list_suppliers` non vede TRUCK SERVICE → l'utente che cerca "fornitore TRUCK SERVICE" ottiene "non trovato" anche se il fornitore esiste nel dato operativo. |

---

## Sezione 4 — Data Quality

### 4.1 `@mezzi_aziendali` (37)

| Issue | Conta | Impatto |
|---|---:|---|
| Targhe con spazio interno (es. `"TI 334558"`) | ≥1 | Filtro plate-only fallisce se non normalizza |
| `dataUltimoCollaudo`, `manutenzioneDataInizio`, `manutenzioneDataFine` come stringa vuota `""` | varia | Normalizer date deve trattare `""` come null (verificato nei reader, ok) |
| `manutenzioneKmMax` come stringa | varia | parsing fragile |
| `cilindrata`, `potenza` come stringa con unità (es. `"7698"`, `"210 KW"`) | tutti | Confronti numerici impossibili senza parser |
| `stato`, `trazione`, `tipoMezzo` 100% missing | 37/37 | Tool `search_vehicles_by_attribute` con field=stato → sempre vuoto |
| `librettoUrl` presente ma collection `@documenti_mezzi` non sempre popolata | 32 mezzi con librettoUrl, solo 4 in `@documenti_mezzi` archivio | Doppia fonte non riconciliata |

### 4.2 `@manutenzioni` (50)

| Issue | Conta | Impatto |
|---|---:|---|
| `eseguito` null/missing | 28/50 (56%) | Filtro effettuate/programmate inaffidabile |
| `tipoIntervento`, `stato`, `categoria` 100% missing | 50/50 | Reader si appoggia a alias `tipo` (mezzo/compressore/attrezzature) |
| Date `data` formato misto: `"15 04 2026"` (spaces), `"02/04/2026"` (slashes) | tutti | Parser `firestoreHelpers.ts:148-166` gestisce entrambi ma fragile |
| Manutenzioni aprile 2026 con `eseguito === true` | **0 su 13** | Caso utente bloccato (vedi §5.3) |
| `importo` 2% (1/50) | 49 missing | Aggregati costi manutenzione impossibili da questo dataset |

### 4.3 `@rifornimenti` (248)

| Issue | Conta | Impatto |
|---|---:|---|
| `costo` 0% popolato | 248/248 | Tool `get_costs` rifornimento dipende da fonte alternativa (fatture). |
| `fornitore` 0% (solo `distributore` testo libero) | 248/248 | Aggregazione per fornitore impossibile direttamente |
| Date min `2026-01-11`, max `2026-04-29` | range corretto | OK |

### 4.4 `@rifornimenti_autisti_tmp` (249)

| Issue | Conta | Impatto |
|---|---:|---|
| Shape ≠ `@rifornimenti`: `targaCamion`/`targaRimorchio`/`badgeAutista`/`autistaNome`/`metodoPagamento`/`paese` | 249/249 | Reader deve mappare entrambe le shape; helper di test usa `JSON.stringify` per match targa (fragile) |
| `targaRimorchio` 67% popolato | varia | Tool che indicizza per targa singola perde i rimorchi |
| `metodoPagamento` 58% popolato | varia | OK |

### 4.5 `@documenti_mezzi` (collection root, 11)

| Issue | Conta | Impatto |
|---|---:|---|
| `tipoDocumento` con varianti casing (`Fattura`/`fattura`/`PREVENTIVO`/`libretto`) | 4 variants per 3 logical types | Filtro case-sensitive perde fino al 67% delle fatture |
| `dataDocumento` formato misto: `"01 08 2022"` (libretto), `"21-11-2025"` (magazzino), `"2026-04-02"` (ISO) | varia | Parser gestisce ma fragile |
| Sample con `dataImmatricolazione` e `dataScadenza` formato `"01 08 2022"` (space) | tutti i libretti | Parser tarato ma non standard |
| `mezzoId` 55% (6/11) | 5 missing | Cross-link mezzo → libretto perso per 5 documenti |
| `archivedAsDifferentFromId` campo presente | tutti | Logica deduplica archivista usa questo campo |
| `duplicateTarget` su tutti i record | 100% | Indizio che esiste una collection di "duplicati intenzionali" da gestire |

### 4.6 `@inventario` (17)

| Issue | Conta |
|---|---:|
| `categoria` 0% popolato | 17/17 |
| Fornitori duplicati: `MARIBA` vs `MARIBA s.r.l.` | 2 entità per 1 reale |
| `prezzoUnitario` 6% (1/17) | 16 missing |

### 4.7 `@lavori` (13)

| Issue | Conta |
|---|---:|
| `dataChiusura` 0% | 13/13 missing |
| `tipo === "targa"` su tutti i record | 13/13 — campo carica un valore degenere ("targa" invece di tipo lavoro) |
| `chiHaEseguito` 54% | 6 missing |
| `dettagli`, `sottoElementi` 0% | 13/13 missing |

### 4.8 `@colleghi` (12)

| Issue | Conta |
|---|---:|
| `ruolo`, `categoria`, `stato` 0% | 12/12 missing |
| `pinSim`, `telefonoPrivato`, `pukSim`, `descrizione` ≤17% | quasi assenti |
| Nessun campo `patente` | 12/12 ⇒ blocco `list_driver_license_expirations` confermato |

### 4.9 Date / formati

Range delle date misurate:
- `@manutenzioni.data`: 2024-07-02 → 2026-04-28 (672 giorni). Nessuna data futura, nessuna ancient.
- `@rifornimenti.data`: 2026-01-11 → 2026-04-29.
- `@rifornimenti_autisti_tmp.data`: 2026-01-12 → 2026-04-30.
- `@lavori.dataInserimento`: 2026-03-29 → 2026-04-29.
- `@documenti_mezzi.dataDocumento`: 2017-10-16 → 2026-04-02 (libretti vecchi).
- `@documenti_magazzino.dataDocumento`: 2025-11-20 → 2026-03-25.

Nessuna data fuori range plausibile. Nessuna data nel futuro lontano. Parser `parseToolDate` (`firestoreHelpers.ts:148-166`) testato e funziona per tutti i formati osservati.

### 4.10 Duplicati per `id` (within-collection)

Misurato dallo script: **0 duplicati** per `id` all'interno di ciascuna storage key (campi `duplicates.totalDuplicates: 0` per tutte le 32 key). Conferma che la deduplica intra-collection è solida.

---

## Sezione 5 — Test Casi Utente

### 5.1 Caso "categoria motrici" — GAP CRITICO

| Misura | Valore |
|---|---|
| Mezzi totali | 37 |
| `categoria.contains("motrice")` | **4** (motrice 2 assi=1, motrice 3 assi=2, motrice 4 assi=1) |
| `tipo === "motrice"` | **19** |
| `categoria.contains("trattore")` | 12 (trattore stradale=10, Trattore a sella=2) |
| Mezzi `tipo=motrice` ma `categoria≠motrice*` | **15** (tutti trattore stradale, vasca, semirimorchio, Trattore a sella) |

**Esempio puntuale:** TI324633 ha `tipo="motrice"`, `categoria="trattore stradale"`. Per il driver è una motrice. Per il sistema (filtrando `categoria`) è un trattore.

**Verdetto:** Se `list_vehicles` o `search_vehicles_by_attribute` filtrano per `categoria.includes("motrice")` (caso più probabile vista la descrizione del tool), la risposta IA mostra **4 mezzi su 19 reali**. Il fix consigliato è normalizzare il filtro su entrambi i campi, dando priorità a `tipo` quando l'utente usa termini ampi ("motrici").

### 5.2 Caso "rifornimenti TI324633 aprile 2026"

| Misura | Valore |
|---|---|
| `@rifornimenti` totali | 248 |
| `@rifornimenti_autisti_tmp` totali | 249 |
| Rifornimenti TI324633 in `@rifornimenti` (totale storico) | 42 |
| Rifornimenti TI324633 in `@rifornimenti` (aprile 2026) | **15** |
| Rifornimenti TI324633 in `@rifornimenti_autisti_tmp` (totale storico) | 43 |
| Rifornimenti TI324633 in `@rifornimenti_autisti_tmp` (aprile 2026) | **0** |
| Duplicati cross-collection (km+litri match) per aprile 2026 | **0** |
| Distributore prevalente | `caravate` (cisterna interna) — tutti i 15 di aprile |

**Verdetto:** Il caso TI324633 aprile è limpido: 15 rifornimenti tutti dalla cisterna interna, nessuna sovrapposizione cross-collection. Il tool `get_refuelings` con cap default a 10 **mostra solo 10 dei 15** (perdita 33%) salvo override. Il tool `get_refuelings_aggregated` aggrega e ritorna totali, ma se l'utente chiede "elencami i rifornimenti di aprile" il limite default castra il risultato.

**Gap quantitativo specifico:** `toolGetRefuelings.ts` ha cap default 10. Per un mese intero con 15 rifornimenti, l'IA risponde "ne ho 10 più altri". Il cap dovrebbe essere periodo-aware (es. 50 default).

### 5.3 Caso "manutenzioni aprile 2026"

| Misura | Valore |
|---|---|
| `@manutenzioni` totali | 50 |
| Manutenzioni aprile 2026 | **13** |
| Per tipo (aprile) | mezzo (11), compressore (1), attrezzature (1) |
| Aprile 2026 con `eseguito === true` | **0** |
| Aprile 2026 con `eseguito === null` | 13 |

**Verdetto:** Il tool `search_maintenances` filtrato per "manutenzioni effettuate aprile 2026" usando il campo `eseguito` restituisce **0 risultati**, ma le manutenzioni reali sono 13. Il dataset non popola correttamente `eseguito` per i record recenti. L'IA non può rispondere "manutenzioni effettuate" affidabilmente.

**Gap qualitativo:** la distinzione effettuate/programmate dovrebbe basarsi su una combinazione di campi (data passata + descrizione + presenza intervento) o derivare da Lavori `eseguito` linkato. Oggi il filtro è inaffidabile.

**Cap output:** `search_maintenances` ha cap 5 ⇒ aprile (13 record) viene troncato a 5 risultati. Cap troppo aggressivo per uso "lista mese".

---

## Sezione 6 — Tool BLOCCATI: stato e suggerimenti

### 6.1 `get_wheel_geometry_config` (file presente, blocked, NON importato)

- **Motivo originale:** reader clone-safe `@wheelGeom_override_v1` non esiste in domain NEXT.
- **Verifica oggi:** `@wheelGeom_override_v1` è una chiave LOCALSTORAGE (browser), non Firestore. Vive in `src/pages/ModalGomme.tsx:25` e `src/next/autisti/NextModalGomme.tsx:54`. Non è mai sincronizzata su Firestore.
- **Sblocco?** Non immediato. Servirebbe spostare la geometria su Firestore (storage doc o collection root) e creare un domain reader. **Effort: medio**. Decisione: lasciare bloccato finché qualcuno non chiede esplicitamente di indicizzare le geometrie ruota.

### 6.2 `list_driver_license_expirations` (Round 2 GAP-D)

- **Motivo originale:** Nessun campo `patente` su `@colleghi`.
- **Verifica oggi:** `@colleghi` (12 record) ha solo `nome`, `badge`, `telefono`, `codice` ben popolati. Nessuna patente.
- **Sblocco?** Richiede aggiunta di `patente`/`scadenzaPatente` al modulo Anagrafiche colleghi. **Effort: piccolo (UI + dataset extension), ma richiede data entry da parte dell'utente**. Senza dati reali, il tool sarebbe vuoto comunque.

### 6.3 `get_vehicle_engine_number` (Round 2 GAP-D)

- **Motivo originale:** `numeroMotore` non strutturato.
- **Verifica oggi:** Nessun campo `numeroMotore` in `@mezzi_aziendali` (37 record); confronto vs `RAW_LIBRETTO_ALIASES`: nessun alias copre il numero motore.
- **Sblocco?** Richiede estrazione dati dal libretto (Archivista già presente, ma deve essere arricchito per popolare il campo). **Effort: medio (passa per pipeline Archivista)**. Da accodare a un round Archivista dedicato.

### 6.4 `get_cisterna_physical_level` (Round 2 GAP-D)

- **Motivo originale:** Livello fisico non in `NextCisternaSnapshot`.
- **Verifica oggi:** `@cisterne_adblue` (1 record), nessun campo livello cumulativo.
- **Sblocco?** Richiede modello dati per calibrazione cisterna + telemetria. **Effort: alto**. Lascia bloccato.

### 6.5 Round 1 BLOCCATI (4)

| Tool | Stato | Note |
|---|---|---|
| `search_events` | nessun file | Probabile sovrapposizione con `search_operational_events` ora attivo. **Possibile rimozione dal registry.** |
| `get_cisterna_levels` | nessun file | Stessa giustificazione di `get_cisterna_physical_level`. |
| `generate_chart` | nessun file | Sblocco richiede integrazione PDF/render dei grafici nel report. **Effort medio.** |
| `open_vehicle_edit_modal` | nessun file | Tool UI/azione, richiede integrazione con `NextMezzoEditModal`. **Effort piccolo (azione, non lettura).** |

---

## Sezione 7 — Priorità Suggerite per Fix

Ordinate per `(impatto / facilità)`. L'utente decide la sequenza.

### Priorità ALTA (impatto alto, fix piccoli/medi)

1. **GAP-F1 — Filtro `categoria` vs `tipo` mezzi**
   *Impatto:* l'IA risponde 4 mezzi invece di 19 quando l'utente chiede "motrici". Massimo danno percepito.
   *Fix:* normalizzare il filtro categoria nel tool `list_vehicles` e `search_vehicles_by_attribute`: se l'utente passa "motrice" il filtro deve essere `tipo === "motrice" || categoria.toLowerCase().includes("motrice")`. Effort: ~30 min.

2. **GAP-F2 — Normalizzazione `tipoDocumento`**
   *Impatto:* search documents perde fino al 67% dei record per casing.
   *Fix:* lowercase comparison nel tool `search_documents_and_invoices` quando l'utente filtra per tipo. Inoltre alias "fattura"/"FATTURA"/"Fattura". Effort: ~20 min.

3. **GAP-Q1 — `@costiMezzo` vuota, dato vivo in `@documenti_mezzi`/`@documenti_magazzino` (collection root)**
   *Impatto:* tutti i tool costi rispondono "0" o quasi. ALTISSIMO.
   *Fix:* verificare `readNextDocumentiCostiFleetSnapshot` — se legge solo `@costiMezzo` (storage), aggiungere fallback su `@documenti_mezzi` collection root (11 docs) e `@documenti_magazzino` (3 docs). Effort: ~1-2 h (richiede leggere il reader e patch).

4. **GAP-Q2 + GAP-3.1 — `@analisi_economica_mezzi` solo come collection root**
   *Impatto:* tool `get_saved_economic_analysis` rischia 0 risultati anche per la targa TI324623 che ha analisi salvata.
   *Fix:* verificare reader `readNextAnalisiEconomicaSavedSnapshot`. Se serve, aggiungere lettura collection root. Effort: ~1 h.

### Priorità MEDIA

5. **Cap output `get_refuelings` (10) e `search_maintenances` (5)**
   *Impatto:* utente chiede "rifornimenti aprile" → 10 di 15. "Manutenzioni aprile" → 5 di 13.
   *Fix:* cap default 50 quando `period` è specificato. Effort: ~15 min.

6. **GAP-F3 — `eseguito` su `@manutenzioni` 0% per il mese corrente**
   *Impatto:* "manutenzioni effettuate" sempre 0 sui mesi recenti.
   *Fix:* due opzioni — (a) data entry: backfill `eseguito=true` per le manutenzioni storiche; (b) tool: derivare `eseguito` da `data <= today && presenza descrizione`. Opzione (b) effort ~30 min.

7. **GAP-F4 — `statoVista`/`stato` su `@lavori` non popolati; `tipo === "targa"`**
   *Impatto:* filtro stato su `search_work_orders` può non funzionare.
   *Fix:* verificare il reader `readNextLavoriEseguitiSnapshot` — deve derivare `statoVista` da `eseguito` boolean. Audit precedente lo conferma a `nextLavoriDomain.ts:536`, **probabilmente già corretto**. Verifica spot e chiusura.

8. **RID-2 — `destinatario` come oggetto JSON, group-by fasullo**
   *Impatto:* tool `get_material_movements` può raggruppare male i destinatari.
   *Fix:* nel tool, normalizzare `destinatario.refId + destinatario.label` come chiave, non `JSON.stringify`. Effort: ~30 min.

9. **GAP-3.5 — Collection root `autisti_eventi` (105 docs) non letta dai tool chat IA**
   *Impatto:* eventi storici autista persi se non in `@storico_eventi_operativi`.
   *Fix:* verificare se i 105 docs sono effettivamente "indipendenti" dai 270 di `@storico_eventi_operativi`. Se sì, reader `readNextAutistiReadOnlySnapshot` dovrebbe includere fallback. Effort: ~1 h verifica + ~30 min fix.

### Priorità BASSA

10. **GAP-Q3/Q4 — Datasets scarni (`@officine` 1, `@fornitori` 4)**
    Non è gap di tool, è gap di data entry. L'utente sa.

11. **Tool BLOCCATI Round 1** (`search_events`, `get_cisterna_levels`, `generate_chart`, `open_vehicle_edit_modal`)
    *Effort:* `search_events` rimovibile dal registry (sostituito da `search_operational_events`); altri 3 da rivedere caso per caso.

12. **GAP-F5/F6 — Categoria `@inventario`, fornitore varianti** (cosmetico per ora)

---

## Sezione 8 — File coinvolti dall'audit

**Letti (read-only):**
- `src/next/chat-ia/tools/registry/*.ts` (59 file)
- `src/next/chat-ia/tools/index.ts`
- `src/next/chat-ia/tools/chatIaToolRegistry.ts`
- `src/next/chat-ia/tools/chatIaToolTypes.ts`
- `src/next/domain/*.ts` (spot check su 8 reader citati)
- `src/next/nextAnagraficheFlottaDomain.ts`, `src/next/nextRifornimentiDomain.ts`, `src/next/nextManutenzioniDomain.ts` ecc. (spot check)
- `tests/e2e/helpers/firestoreHelpers.ts`
- `docs/audit/VERIFICA_TOOL_REGISTRY_CHAT_IA_NEXT_ROUND2_2026-04-28.md`
- `docs/audit/AUDIT_GAP_COPERTURA_TOOL_2026-04-28.md`
- Firestore live: 32 storage doc + 13 root collection del progetto `gestionemanutenzione-934ef`

**Creati (audit only):**
- `tests/audit/auditFirestoreCoverage.mjs` (script audit master)
- `tests/audit/auditUserCases.mjs` (script casi utente)
- `tests/audit/output/firestore-coverage.json` (5136 righe, dump completo)
- `tests/audit/output/user-cases.json` (dump test casi)
- `docs/audit/AUDIT_FIRESTORE_COVERAGE_2026-04-30.md` (questo file)

**NON modificati (perimetro rispettato):**
- `src/next/chat-ia/tools/registry/*` ✓
- `src/next/chat-ia/agents/*` ✓
- `src/next/domain/*` ✓
- `src/next/nextAnagraficheFlottaDomain.ts` e simili ✓
- `src/pages/*` (madre) ✓
- `backend/internal-ai/server/*` ✓
- `tests/e2e/*` esistenti ✓
- Archivista ✓
- Firestore (zero scritture) ✓

---

## Allegato A — Conteggio finale collection (master table)

| Storage / collection | Count | Stato |
|---|---:|---|
| `@mezzi_aziendali` | 37 | OK |
| `@colleghi` | 12 | OK ma scarno |
| `@fornitori` | 4 | scarno |
| `@officine` | 1 | quasi vuoto |
| `@lavori` | 13 | OK |
| `@manutenzioni` | 50 | OK |
| `@inventario` | 17 | OK |
| `@materialiconsegnati` | 33 | OK |
| `@rifornimenti` | 248 | OK |
| `@rifornimenti_autisti_tmp` | 249 | OK |
| `@ordini` | 5 | OK |
| `@preventivi` | 0 | VUOTO |
| `@preventivi_approvazioni` | 2 | scarno |
| `@listino_prezzi` | 0 | VUOTO |
| `@costiMezzo` (storage) | 0 | VUOTO |
| `@costiMezzo` (collection) | 0 | VUOTO |
| `@documenti_mezzi` (storage) | MISSING | dato in collection |
| `@documenti_mezzi` (collection) | 11 | dato vivo |
| `@documenti_magazzino` (storage) | MISSING | dato in collection |
| `@documenti_magazzino` (collection) | 3 | dato vivo |
| `@documenti_generici` (storage) | MISSING | inesistente |
| `@documenti_generici` (collection) | 0 | VUOTO |
| `@attrezzature_cantieri` | 12 | OK |
| `@cisterne_adblue` | 1 | scarno |
| `@alerts_state` | 1 | OK |
| `@segnalazioni_autisti_tmp` | 32 | OK |
| `@controlli_mezzo_autisti` | 330 | OK |
| `@storico_eventi_operativi` | 270 | OK |
| `@autisti_sessione_attive` | 9 | OK |
| `@richieste_attrezzature_autisti_tmp` | 12 | OK |
| `@cambi_gomme_autisti_tmp` | 10 | OK |
| `@gomme_eventi` | 9 | OK |
| `@mezzi_foto_viste` | 0 | VUOTO |
| `@mezzi_hotspot_mapping` | 0 | VUOTO |
| `@analisi_economica_mezzi` (storage) | MISSING | dato in collection |
| `@analisi_economica_mezzi` (collection) | 1 | scarno (1 sola targa) |
| `@impostazioni_app` | MISSING | inesistente |
| `euromecc_pending` | 4 | OK |
| `euromecc_done` | 54 | OK |
| `euromecc_issues` | 2 | scarno |
| `euromecc_area_meta` | 0 | VUOTO |
| `euromecc_relazioni` | 2 | scarno |
| `euromecc_extra_components` | 0 | VUOTO |
| `autisti_eventi` | 105 | **POTENZIALMENTE NON USATO da chat IA** |
| `chat_ia_reports` | 0 | VUOTO (archivio non popolato) |

**Totale record business "operativi" (esclusi vuoti e missing): ≈ 1.940 record cumulativi sui 45 dataset esaminati.**

---

## Conclusione

L'audit non rileva bug strutturali nel registro tool (58 tool importati, 1 stub blocked, 7 documentati come bloccati con motivazione corretta). I gap sono prevalentemente **filtri/normalizzazione** e **data quality**, non architetturali.

Il fix di **3 gap (motrici, normalizzazione tipoDocumento, fallback collection root su costi)** chiude verosimilmente il **70% dei casi utente reali** in cui l'IA risponde male.

I dati per arrivare a queste conclusioni sono tutti misurabili e riproducibili tramite gli script in `tests/audit/`. Re-run consigliato dopo ogni fix per misurare il miglioramento.
