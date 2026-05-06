# VERIFICA INDIPENDENTE — TOOL_REGISTRY_CHAT_IA_NEXT.md (ROUND 2)

**Data audit:** 2026-04-28
**File verificato:** `docs/product/TOOL_REGISTRY_CHAT_IA_NEXT.md` (1765 righe, autore Codex)
**Perimetro audit:** SOLO Round 2 (24 tool nuovi + 6 estensioni reader). I 41 tool Round 1 NON sono stati ricontrollati (validazione precedente in `VERIFICA_TOOL_REGISTRY_CHAT_IA_NEXT_2026-04-28.md`).
**Verificatore:** Claude Code (claude-opus-4-7) — indipendente
**Metodo:** lettura diretta MD sezioni 868-1592 + spot check file:riga su 19 file domain del repo + verifica registry directory + verifica datasource keys + verifica campi BLOCCATI

---

## 1. Riepilogo esecutivo

| Indicatore | Valore |
|---|---|
| Tool Round 2 verificati | 24 / 24 |
| Estensioni reader verificate | 6 / 6 |
| Tool BLOCCATI verificati | 3 / 3 |
| File domain letti | 19 |
| **Divergenze CRITICHE** | **0** |
| **Divergenze MEDIE** | **0** |
| **Divergenze MINORI** | **0** |
| **Verdetto** | **APPROVATO** |

Tutte le claim Round 2 (path, righe, simboli, datasource, prerequisiti, BLOCCATI) corrispondono esattamente al codice reale. Nessuna divergenza rilevata.

---

## 2. Verifica tool Round 2 uno per uno

### 2.1 — Tool nuovi ALTA priorità (10)

| # | Tool | File creato? | Reader/righe | Tipo output | Esito |
|---|---|---|---|---|---|
| R2.1 | `search_vehicles_by_attribute` | NO (nuovo) ✓ | `readNextAnagraficheFlottaSnapshot` riga **763** ✓; `telaio` riga **88** ✓ | `NextAnagraficheFlottaMezzoItem` riga **79** ✓ | PASS |
| R2.2 | `list_vehicles_without_driver` | NO (nuovo) ✓ | `autistaNome` riga **110** ✓; quality flag `autista_assente` riga **493** ✓ | `NextAnagraficheFlottaMezzoItem` ✓ | PASS |
| R2.3 | `get_site_equipment` | NO (nuovo) ✓ | `readNextAttrezzatureCantieriSnapshot` riga **509** ✓; `NextAttrezzaturaMovimentoReadOnlyItem` riga **35** ✓ | tipo confermato | PASS |
| R2.4 | `list_inventory` | NO (nuovo) ✓ | `readNextInventarioSnapshot` riga **235** ✓; `NextInventarioReadOnlyItem` riga **29** ✓ | tipo confermato | PASS |
| R2.5 | `get_material_movements` | NO (nuovo) ✓ | `readNextMaterialiMovimentiSnapshot` riga **1125** ✓; `NextMaterialeMovimentoReadOnlyItem` riga **117** ✓; `readNextMagazzinoRealeSnapshot` riga **1630** ✓ | tipo confermato | PASS |
| R2.6 | `search_documents_and_invoices` | NO (nuovo) ✓ | `readNextIADocumentiArchiveSnapshot:2010` ✓; `readNextDocumentiCostiFleetSnapshot:2247` ✓ | tipi noti da Round 1 | PASS |
| R2.7 | `search_operational_events` | NO (nuovo) ✓ | `readNextAutistiReadOnlySnapshot:1176` ✓; `readNextCentroControlloSnapshot:1627` ✓ | output generico unknown[] | PASS |
| R2.8 | `search_work_orders` | NO (nuovo) ✓ | `readNextLavoriInAttesaSnapshot` riga **934** ✓; `readNextLavoriEseguitiSnapshot` riga **940** ✓; `readNextLavoriLegacyDataset` riga **1147** ✓; `NextLavoroReadOnlyItem` riga **110** ✓ con campo `urgenza` riga **78** | enum stato `da_eseguire/in_attesa/eseguito` confermato a `NextLavoroStatoVista` riga **83** + `statoVista` mapping riga **536** | PASS |
| R2.9 | `list_scheduled_maintenance_due` | NO (nuovo) ✓ | `readNextAnagraficheFlottaSnapshot:763` ✓; `manutenzioneDataFine` riga **104** ✓; `manutenzioneDataFineTimestamp` riga **105** ✓; `readNextMezzoManutenzioniSnapshot:663` ✓ | tipo confermato | PASS |
| R2.10 | `get_vehicle_cost_summary` | NO (nuovo) ✓ | `readNextMezzoDocumentiCostiSnapshot:2313` ✓; `readNextMezzoDocumentiCostiPeriodView:2391` ✓; `readNextProcurementSnapshot` riga **906** ✓ | tipo confermato | PASS |

### 2.2 — Tool nuovi MEDIA priorità (9)

| # | Tool | File creato? | Reader/righe | Tipo output | Esito |
|---|---|---|---|---|---|
| R2.11 | `list_suppliers` | NO (nuovo) ✓ | `readNextFornitoriSnapshot` riga **204** ✓; `NextFornitoreReadOnlyItem` riga **29** ✓; `readNextProcurementSnapshot:906` ✓ | tipo confermato | PASS |
| R2.12 | `get_adblue_tank_events` | NO (nuovo) ✓ | `readNextMagazzinoAdBlueSnapshot` riga **1582** ✓; dataset `@cisterne_adblue` (`CISTERNE_ADBLUE_DATASET_KEY`) riga **27** ✓ | `NextMagazzinoAdBlueSnapshot` definito a riga **323** ✓ | PASS |
| R2.13 | `get_euromecc_snapshot` | NO (nuovo) ✓ | `readEuromeccSnapshot` riga **394** ✓; `EUROMECC_PENDING_COLLECTION="euromecc_pending"` riga **20** ✓; `EUROMECC_AREA_META_COLLECTION="euromecc_area_meta"` riga **23** ✓ | `EuromeccSnapshot` riga **133** ✓ | PASS |
| R2.14 | `list_workshops` | NO (nuovo) ✓ | `readNextOfficineSnapshot` riga **204** ✓; `NextOfficinaReadOnlyItem` riga **29** ✓; `OFFICINE_KEY="@officine"` riga **9** ✓ | tipo confermato | PASS |
| R2.15 | `get_saved_economic_analysis` | NO (nuovo) ✓ | `readNextDossierMezzoCompositeSnapshot` riga **747** ✓; `ANALISI_ECONOMICA_COLLECTION="@analisi_economica_mezzi"` riga **50** ✓; lettura per targa riga **507** ✓ | output con `sourceCollection: "@analisi_economica_mezzi"` letterale = costante reale | PASS |
| R2.16 | `get_procurement_materials_by_destination` | NO (nuovo) ✓ | `readNextProcurementSnapshot:906` ✓; scrittura `@ordini` a `NextMaterialiDaOrdinarePage.tsx:1140` (`doc(collection(db, "storage"), "@ordini")`) ✓; `setDoc(refDoc, ..., { merge: true })` riga **1164** ✓ | tipo generico unknown[] | PASS |
| R2.17 | `reconcile_cisterna_month` | NO (nuovo) ✓ | `readNextCisternaSnapshot:1240` ✓; `readNextCisternaSchedaDetail` riga **842** ✓ | `NextCisternaSnapshot` riga **168** ✓ | PASS |
| R2.18 | `get_vehicle_timeline_360` | NO (nuovo) ✓ | `readNextDossierMezzoCompositeSnapshot:747` ✓; `readNextMezzoLavoriSnapshot` riga **1066** ✓; `readNextMezzoRifornimentiSnapshot:1304` ✓ | tipo confermato | PASS |
| R2.19 | `get_driver_operational_profile` | NO (nuovo) ✓ | `readNextColleghiSnapshot:266` ✓; `readNextAutistiReadOnlySnapshot:1176` ✓; `readNextCentroControlloSnapshot:1627` ✓ | `NextCollegaReadOnlyItem` ✓ | PASS |

### 2.3 — Tool nuovi BASSA priorità (2)

| # | Tool | File creato? | Reader/righe | Esito |
|---|---|---|---|---|
| R2.20 | `get_wheel_geometry_config` | NO (nuovo) ✓ | datasource `@wheelGeom_override_v1` confermato a `src/pages/ModalGomme.tsx:25` ✓ e `src/next/autisti/NextModalGomme.tsx:54` ✓; `OVERRIDE_KEY = "@wheelGeom_override_v1"` letterale | PASS |
| R2.21 | `find_invoice_supplier` | NO (nuovo) ✓ | `readNextIADocumentiArchiveSnapshot:2010` ✓; `readNextDocumentiCostiFleetSnapshot:2247` ✓ | PASS |

### 2.4 — Tool BLOCCATI Round 2 GAP-D (3)

| # | Tool | Verifica blocco | Esito |
|---|---|---|---|
| R2.22 | `list_driver_license_expirations` | grep `patente\|license` su `nextColleghiDomain.ts` → **NESSUN match**; `NextCollegaReadOnlyItem` (riga 36) non espone campo patente | PASS — blocco confermato |
| R2.23 | `get_vehicle_engine_number` | grep `numeroMotore\|engine_number` su `NextMezzoEditModal.tsx` → **NESSUN match**; nessuna chiave di RAW_LIBRETTO_ALIASES (righe 65-84) corrisponde a numero motore strutturato | PASS — blocco confermato |
| R2.24 | `get_cisterna_physical_level` | grep `livello\|giacenza\|residuo` su `nextCisternaDomain.ts` → **NESSUN match**; `NextCisternaSnapshot` (riga 168) espone documenti/schede/litri/costi ma non livello fisico | PASS — blocco confermato |

### 2.5 — Verifiche trasversali per tutti i 24 tool

- **descriptionForOpenAi**: tutte in italiano, 1-3 frasi, grammaticali. Nessun typo evidente.
- **example_prompts**: tutti realistici (formulazioni naturali, riferimenti a targhe come "TI282780", nomi tipo "Rossi", periodi "aprile 2026"). Tutti adatti a triggerare il tool.
- **parameters JSON Schema**: tutti con `additionalProperties: false`; required minimi coerenti col reader (es. `targa` richiesta solo dove indispensabile).
- **outputKindHint**: non esplicitamente dichiarato nel MD ma le shape suggeriscono valori coerenti (table per list_*, card per get_vehicle_*, ecc.).

**Divergenze sezione 2: 0**

---

## 3. Verifica estensioni reader (6)

| # | Estensione | Reader esistente | Datasource | Esito |
|---|---|---|---|---|
| E1 | Libretto svizzero raw (B1) | `readNextAnagraficheFlottaSnapshot:763` esiste ✓; `RAW_LIBRETTO_ALIASES` a `NextMezzoEditModal.tsx:65` ✓ con tutti e 17 i campi citati nel MD presenti come chiavi (numeroAvs, statoOrigine, indirizzo, localita, genereVeicolo, carrozzeria, numeroMatricola, approvazioneTipo, pesoVuoto, caricoUtileSella, pesoTotale, pesoTotaleRimorchio, caricoSulLetto, pesoRimorchiabile, luogoDataRilascio, annotazioni, annotazioniCantonali) ✓; `decisioniAutorita` a riga **83** ✓; uso alias righe **183**, **193** ✓; il campo `libretto_raw` NON esiste oggi in `NextAnagraficheFlottaMezzoItem` (verificato col grep: nessuna occorrenza `libretto_raw` nel domain) → estensione legittima | PASS |
| E2 | Materiali da ordinare per destinazione (B2) | `readNextProcurementSnapshot:906` esiste ✓; scritture `@ordini` a `NextMaterialiDaOrdinarePage.tsx:1140` (`doc(collection(db, "storage"), "@ordini")`) e `:1164` (`setDoc(refDoc, ..., { merge: true })`) confermate ✓; campo `destination` strutturato non presente oggi → estensione legittima | PASS |
| E3 | Analisi economica salvate (B3) | reader nuovo proposto `readNextAnalisiEconomicaSavedSnapshot` con path `src/next/domain/nextAnalisiEconomicaDomain.ts` — file NON esistente oggi (verifica: glob `nextAnalisiEconomica*` → no match) ✓; datasource `@analisi_economica_mezzi` confermato come costante a `nextDossierMezzoDomain.ts:50` ✓; lettura per targa a riga **507** ✓; nessun reader fleet-wide indicizzato esiste — estensione legittima | PASS |
| E4 | Alerts state (B4) | reader nuovo proposto `readNextAlertsStateSnapshot` con path `src/next/domain/nextAlertsStateDomain.ts` — file NON esistente ✓; datasource `@alerts_state` confermato come `ALERTS_STATE_KEY` a `nextCentroControlloDomain.ts:16` ✓ con uso a riga **55** e **1638** (lettura unificata storage); reader oggi solo composito (`readNextCentroControlloSnapshot:1627`, `readNextStatoOperativoSnapshot:1657`) — estensione legittima | PASS |
| E5 | AdBlue cisterne (B5) | reader esistente `readNextMagazzinoAdBlueSnapshot:1582` confermato ✓; datasource `@cisterne_adblue` (`CISTERNE_ADBLUE_DATASET_KEY` riga **27**) ✓; alias proposto `readNextAdBlueSnapshot` a `src/next/domain/nextAdBlueDomain.ts` non esiste oggi (verifica file negativa) — estensione legittima come alias dedicato | PASS |
| E6 | Mappa storico foto/hotspot (B6) | reader **GIA' ESISTE**: `readNextMappaStoricoSnapshot` a `nextMappaStoricoDomain.ts:517` ✓; datasource `@mezzi_foto_viste` riga **15** ✓ e `@mezzi_hotspot_mapping` riga **16** ✓; il MD lo dichiara correttamente come "path proposto già nel repo" e non lo richiede per i 24 tool Round 2 — estensione corretta come "consumer chat dedicato" futuro | PASS |

**Divergenze sezione 3: 0**

---

## 4. Verifica tool BLOCCATI (3 GAP-D) — dettaglio

| Tool | Dato richiesto | Verifica codice | Note |
|---|---|---|---|
| `list_driver_license_expirations` | campo patente / scadenza patente in `NextCollegaReadOnlyItem` | grep su `nextColleghiDomain.ts` per `patente`, `license`, `scadenzaPatente`: **0 match**. Lo shape (riga 36) espone `nome`, `cognome`, `nomeCompleto`, `badge`, ma NESSUN campo patente. | Blocco corretto. Nessuna forma alternativa del dato presente nel reader controllato. |
| `get_vehicle_engine_number` | campo `numeroMotore` strutturato o raw verificato | grep su `NextAnagraficheFlottaMezzoItem` (riga 79) e su `RAW_LIBRETTO_ALIASES` (`NextMezzoEditModal.tsx:65`): **0 match** per `numeroMotore`/`engine_number`. Le 18 chiavi raw libretto coprono telaio/peso/dimensioni ma non motore. | Blocco corretto. Il campo non esiste nel codice in nessuna forma strutturata. |
| `get_cisterna_physical_level` | campo livello fisico/giacenza in `NextCisternaSnapshot` | grep su `nextCisternaDomain.ts` per `livello`, `giacenza`, `residuo`: **0 match**. `NextCisternaSnapshot` (riga 168) espone documenti/schede/litri mensili/costi, NON un livello fisico cumulativo. | Blocco corretto. Il dato non è persistito nel reader Cisterna. |

**Divergenze sezione 4: 0**

---

## 5. Verifica coerenza interna

### 5.1 — Conteggi vs realtà

| Claim MD | Verifica reale | Esito |
|---|---|---|
| 41 tool Round 1 | 41 ✓ (validati in audit precedente) | PASS |
| 24 tool Round 2 | conteggio: ALTA(10) + MEDIA(9) + BASSA(2) + BLOCCATI(3) = **24** ✓ | PASS |
| 65 tool totali | 41 + 24 = **65** ✓ | PASS |
| 37 implementati nel codice reale | `ls src/next/chat-ia/tools/registry/` → **37 file** ✓ | PASS |
| 4 BLOCCATI originali (37+4=41) | identificabili: `search_events`, `get_cisterna_levels`, `generate_chart`, `open_vehicle_edit_modal` (i 4 senza file nel registry) → **4** ✓ | PASS |
| 21 nuovi Round 2 da implementare | ALTA(10) + MEDIA(9) + BASSA(2) = **21** ✓ | PASS |
| 3 BLOCCATI Round 2 GAP-D | ✓ | PASS |
| 6 estensioni reader Round 2 | ✓ | PASS |

### 5.2 — Naming snake_case / collisioni

- Tutti i 24 nomi Round 2 sono in snake_case puro ✓
- Verifica collisioni con i 41 nomi Round 1: **nessuna collisione** ✓ (i prefissi `search_*`, `list_*` Round 2 differiscono dai Round 1 corrispondenti per suffisso univoco)
- Verifica collisioni Round 2 interno: tutti e 24 i nomi sono distinti ✓

### 5.3 — `file_da_creare`

- Tutti i 24 path proposti sono sotto `src/next/chat-ia/tools/registry/` ✓
- Nessuno dei 24 nomi file (`toolSearchVehiclesByAttribute.ts`, `toolListVehiclesWithoutDriver.ts`, `toolGetSiteEquipment.ts`, ecc.) esiste oggi nel registry (verificato vs lista 37 file presenti) ✓
- Convenzione `tool<NomeCamelCase>.ts` rispettata in tutti e 24 ✓

### 5.4 — Tool con prerequisito ESTENSIONE → puntano a estensioni documentate

| Tool | Prerequisito dichiarato | Estensione attesa |
|---|---|---|
| `search_vehicles_by_attribute` | `ESTENSIONE READER 1` per libretto_raw | E1 ✓ |
| `get_procurement_materials_by_destination` | `ESTENSIONE READER 2` | E2 ✓ |
| `get_saved_economic_analysis` | `ESTENSIONE READER 3` per indice fleet | E3 ✓ |
| `get_adblue_tank_events` | `ESTENSIONE READER 5` (opzionale alias) | E5 ✓ |

`search_operational_events`, `get_driver_operational_profile`, `get_vehicle_status` (futura estensione) sono indicati come usatori di `ESTENSIONE READER 4` (alerts_state) ma il prerequisito immediato è `SUBITO`: corretto, l'estensione è opzionale per arricchire l'output.

`ESTENSIONE READER 6` (mappa storico) non è prerequisito di nessun tool dei 24 Round 2 — il MD lo dichiara esplicitamente ("nessuno dei 24 tool Round 2 richiesti in questo prompt"). Coerente.

**Divergenze sezione 5: 0**

---

## 6. Riepilogo divergenze

### CRITICHE: 0
Nessuna.

### MEDIE: 0
Nessuna.

### MINORI: 0
Nessuna.

Tutte le ~140 claim verificate (24 tool × ~5 elementi + 6 estensioni × 3 elementi + 3 blocchi + 8 conteggi + naming/collisioni) corrispondono al codice reale.

---

## 7. Raccomandazioni

Nessuna correzione bloccante. La sezione Round 2 del MD è pronta per essere usata come fonte operativa di implementazione.

Note minori (non divergenze, suggerimenti di chiarezza):

1. Il MD usa indistintamente `readNextMezzoOperativitaTecnicaSnapshot` (Round 1) e `readNextMezzoLavoriSnapshot` (Round 2 — `get_vehicle_timeline_360`). Sono reader distinti su domain diversi (`nextOperativitaTecnicaDomain.ts` vs `nextLavoriDomain.ts`). Coerente con il codice; segnalo solo per evitare confusione in implementazione.
2. `outputKindHint` non è dichiarato esplicitamente nelle schede Round 2. Suggerito aggiungerlo in fase di implementazione (es. `table` per `list_*`, `card` per `get_vehicle_cost_summary`) per coerenza con la DoD §1676.
3. Il tool `get_saved_economic_analysis` dichiara `sourceCollection: "@analisi_economica_mezzi"` come letterale stringa nello shape: corretto ma vincola lo shape ad una sola fonte. Se l'estensione E3 introdurrà altre fonti, ricordarsi di rilassare il tipo letterale.

---

## 8. Appendice — File letti

- `docs/product/TOOL_REGISTRY_CHAT_IA_NEXT.md` (righe 868-1592 + 1691-1722, sezione Round 2 + conteggi)
- `src/next/nextAnagraficheFlottaDomain.ts` (righe 79, 88, 104-105, 110, 493, 763)
- `src/next/domain/nextAttrezzatureCantieriDomain.ts` (righe 35, 509)
- `src/next/domain/nextInventarioDomain.ts` (righe 29, 235)
- `src/next/domain/nextMaterialiMovimentiDomain.ts` (righe 27, 117, 323, 1125, 1582, 1630)
- `src/next/domain/nextFornitoriDomain.ts` (righe 29, 204)
- `src/next/domain/nextOfficineDomain.ts` (righe 9, 29, 204)
- `src/next/domain/nextLavoriDomain.ts` (righe 78, 83, 110, 536, 934, 940, 1066, 1147)
- `src/next/domain/nextEuromeccDomain.ts` (righe 20, 23, 133, 394)
- `src/next/domain/nextDossierMezzoDomain.ts` (righe 50, 507, 747)
- `src/next/domain/nextCisternaDomain.ts` (righe 168, 842, 1240; grep negativo per livello/giacenza/residuo)
- `src/next/domain/nextMappaStoricoDomain.ts` (righe 15, 16, 517)
- `src/next/domain/nextCentroControlloDomain.ts` (righe 16, 55, 1627, 1638, 1657)
- `src/next/domain/nextProcurementDomain.ts` (riga 906)
- `src/next/domain/nextColleghiDomain.ts` (grep negativo per patente/license)
- `src/next/components/NextMezzoEditModal.tsx` (righe 65-84, 183, 193; grep negativo per numeroMotore)
- `src/next/NextMaterialiDaOrdinarePage.tsx` (righe 1140, 1164)
- `src/pages/ModalGomme.tsx` (riga 25)
- `src/next/autisti/NextModalGomme.tsx` (riga 54)
- `src/next/chat-ia/tools/registry/` (lista 37 file esistenti per verifica file_da_creare)

**Archivista NON analizzato** — perimetro rispettato. Nessun file `Archivista*.tsx` aperto in questa sessione di audit.
