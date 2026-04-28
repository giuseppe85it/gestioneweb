# VERIFICA INDIPENDENTE — TOOL_REGISTRY_CHAT_IA_NEXT.md

**Data audit:** 2026-04-28  
**File verificato:** `docs/product/TOOL_REGISTRY_CHAT_IA_NEXT.md` (998 righe, autore Codex, 2026-04-28)  
**Verificatore:** Claude Code (claude-opus-4-7) — indipendente  
**Metodo:** lettura completa MD + 3 sub-agent di esplorazione in parallelo + spot check diretti su sorgenti  
**Perimetro:** tutto il repository salvo Archivista (`ArchivistaXxxBridge.tsx` non analizzati)

---

## 1. Riepilogo esecutivo

| Indicatore | Valore |
|---|---|
| Tool verificati | 41 / 41 |
| Categorie verificate | 11 (A–K) |
| File codice letti | 30 |
| **Divergenze CRITICHE** | **0** |
| **Divergenze MEDIE** | **0** |
| **Divergenze MINORI** | **3** |
| Note non bloccanti | 2 |
| **Verdetto** | **APPROVATO con note minori** |

Le 41 claim funzionali (esistenza reader, tipi e perimetro readonly) sono confermate. Le 3 divergenze sono off-by-N su line ranges citati in via approssimativa; non bloccano l'implementazione ma sono da raddrizzare per chiarezza prima del kickoff.

---

## 2. Verifica tool uno per uno

### CATEGORIA A — Lettura mezzi (5 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| A1 | `get_vehicle_by_plate` | PASS | `readNextMezzoByTarga` a [nextAnagraficheFlottaDomain.ts:880](../../src/next/nextAnagraficheFlottaDomain.ts#L880) ✓; `NextAnagraficheFlottaMezzoItem` a riga 79 ✓; `toolGetVehicleByPlate.ts:12` esistente ✓ |
| A2 | `list_vehicles` | PASS | `readNextAnagraficheFlottaSnapshot` a riga 763 ✓; `normalizeNextMezzoCategoria` a riga 295 ✓ |
| A3 | `get_vehicle_status` | PASS | `readNextStatoOperativoSnapshot` a [nextCentroControlloDomain.ts:1657](../../src/next/domain/nextCentroControlloDomain.ts#L1657) ✓ (firma 1657, ritorna `Promise<D10Snapshot>` a 1659); tipo `D10Snapshot` esiste a riga 262 (la SPEC non lega il tipo a una riga) |
| A4 | `get_vehicle_maintenance_history` | PASS | `readNextMezzoOperativitaTecnicaSnapshot` a [nextOperativitaTecnicaDomain.ts:223](../../src/next/nextOperativitaTecnicaDomain.ts#L223) ✓; `readNextMezzoManutenzioniSnapshot` a [nextManutenzioniDomain.ts:663](../../src/next/domain/nextManutenzioniDomain.ts#L663) ✓ |
| A5 | `get_vehicle_dossier_snapshot` | PASS | `readChatIaMezzoSnapshot` a [chatIaMezziData.ts:61](../../src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts#L61) ✓; `ChatIaMezzoSnapshot` a [chatIaMezziTypes.ts:41](../../src/next/chat-ia/sectors/mezzi/chatIaMezziTypes.ts#L41) ✓ |

### CATEGORIA B — Lettura autisti (4 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| B1 | `list_drivers` | PASS | `readNextColleghiSnapshot` a [nextColleghiDomain.ts:266](../../src/next/domain/nextColleghiDomain.ts#L266) ✓; `NextCollegaReadOnlyItem` a riga 36 ✓ |
| B2 | `get_driver_by_name` | PASS | Stesso reader ✓ |
| B3 | `get_driver_by_badge` | PASS — zona oscura chiusa | `readNextAutistiReadOnlySnapshot` a [nextAutistiDomain.ts:1176](../../src/next/domain/nextAutistiDomain.ts#L1176) ✓. Verifica decisiva: campo `badge: string \| null` PRESENTE in `NextCollegaReadOnlyItem` a riga 41. Il fallback dichiarato dalla SPEC non è più necessario (vedi nota 8.2) |
| B4 | `get_driver_activity` | PASS | `NextAutistiCanonicalAssignment` a riga 86 ✓; `NextAutistiCanonicalSignal` a riga 102 ✓; `NextAutistiReadOnlySnapshot` a riga 184 ✓ |

### CATEGORIA C — Lettura rifornimenti (4 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| C1 | `get_refuelings` | PASS | `readNextMezzoRifornimentiSnapshot` a [nextRifornimentiDomain.ts:1304](../../src/next/domain/nextRifornimentiDomain.ts#L1304) ✓; `NextRifornimentoReadOnlyItem` a riga 120 ✓; `NextMezzoRifornimentiSnapshot` a riga 189 ✓ |
| C2 | `get_refuelings_aggregated` | PASS | `readNextRifornimentiReadOnlySnapshot:1291` ✓; `readNextCisternaSnapshot:1240` ✓ |
| C3 | `get_consumption_average` | PASS | Campo `km` presente in `NextRifornimentoReadOnlyItem:129` ✓ — la verifica della SPEC è chiusa positivamente |
| C4 | `compare_refueling_sources` | PASS | Stessi reader ✓. Vedi nota 8.1 su `categoria`/`categoria_audit` |

### CATEGORIA D — Lettura documenti (4 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| D1 | `get_vehicle_documents` | PASS | `readNextMezzoDocumentiSnapshot` a [nextDocumentiMezzoDomain.ts:252](../../src/next/domain/nextDocumentiMezzoDomain.ts#L252) ✓; `NextDocumentoMezzoItem` a riga 30 ✓ |
| D2 | `get_document_costs_by_vehicle` | PASS | `readNextMezzoDocumentiCostiSnapshot` a [nextDocumentiCostiDomain.ts:2313](../../src/next/domain/nextDocumentiCostiDomain.ts#L2313) ✓; `readNextMezzoDocumentiCostiPeriodView` a riga 2391 ✓ |
| D3 | `download_document_pdf` | PASS | Stessi reader ✓ |
| D4 | `get_invoice_by_id` | PASS | `readNextIADocumentiArchiveSnapshot:2010` ✓; `readNextDocumentiCostiFleetSnapshot:2247` ✓; `NextIADocumentiArchiveItem:1389` ✓; `NextDocumentiCostiReadOnlyItem:125` ✓ |

### CATEGORIA E — Segnalazioni e controlli (3 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| E1 | `get_vehicle_events` | PASS | `readNextMezzoSegnalazioniControlliSnapshot` a [nextSegnalazioniControlliDomain.ts:297](../../src/next/domain/nextSegnalazioniControlliDomain.ts#L297) ✓; `NextMezzoSegnalazioniControlliSnapshot:61` ✓ |
| E2 | `get_historical_operational_events` | PASS | `readNextCentroControlloSnapshot:1627` ✓; `D10StoricoEventoItem:134` ✓ |
| E3 | `search_events` | PASS | NUOVO_READER correttamente dichiarato (vedi sez. 5) |

### CATEGORIA F — Costi (4 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| F1 | `get_costs` | PASS | `NextDocumentiCostiFleetSnapshot` a riga 341 ✓ |
| F2 | `get_cost_aggregates` | PASS | `NextDocumentiCostiReadOnlyItem:125` ✓. Vedi nota 8.1 |
| F3 | `get_procurement_costs` | PASS | `readNextProcurementSnapshot` a [nextProcurementDomain.ts:906](../../src/next/domain/nextProcurementDomain.ts#L906) ✓; `readNextProcurementReadOnlySnapshot` a [nextDocumentiCostiDomain.ts:2092](../../src/next/domain/nextDocumentiCostiDomain.ts#L2092) ✓; tipo `NextProcurementReadOnlySnapshot` a `nextDocumentiCostiDomain.ts:298` (verificato direttamente con grep) |
| F4 | `get_capo_costs_by_vehicle` | PASS | `readNextCapoCostiMezzoSnapshot` a [nextCapoDomain.ts:507](../../src/next/domain/nextCapoDomain.ts#L507) ✓; `NextCapoCostiMezzoSnapshot:89` ✓ |

### CATEGORIA G — Cisterna (4 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| G1 | `get_cisterna_snapshot` | PASS | `readNextCisternaSnapshot` a [nextCisternaDomain.ts:1240](../../src/next/domain/nextCisternaDomain.ts#L1240) ✓; `NextCisternaSnapshot:168` ✓ |
| G2 | `get_cisterna_refuelings` | PASS | `NextCisternaSupportItem:85` ✓; `NextCisternaSchedaItem:115` ✓ |
| G3 | `get_cisterna_documents` | PASS | `NextCisternaDocumentItem:93` ✓ |
| G4 | `get_cisterna_levels` | PASS — zona oscura confermata | Reader esistente; campi `livello`/`giacenza`/`residuo` ASSENTI in `nextCisternaDomain.ts` (grep negativo). NUOVO_READER giustificato |

### CATEGORIA H — Calcoli (3 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| H1 | `compute_average` | PASS | Reader rifornimenti e costi ai path corretti ✓ |
| H2 | `compare_periods` | PASS | 3 reader (rifornimenti:1291, costi:2247, cisterna:1240) tutti corretti ✓ |
| H3 | `find_outliers` | PASS | Stessi reader ✓ |

### CATEGORIA I — Generatori (3 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| I1 | `generate_report_pdf` | PASS | `generateChatIaReportPdf` a [chatIaReportPdf.ts:23](../../src/next/chat-ia/reports/chatIaReportPdf.ts#L23) ✓; `generateInternalAiReportPdfBlob` a [internalAiReportPdf.ts:219](../../src/next/internal-ai/internalAiReportPdf.ts#L219) ✓ |
| I2 | `save_report_to_archive` | PASS | `createChatIaReportArchiveEntry` a [chatIaReportArchive.ts:44](../../src/next/chat-ia/reports/chatIaReportArchive.ts#L44) ✓; `ChatIaArchiveEntry` a [chatIaTypes.ts:87](../../src/next/chat-ia/core/chatIaTypes.ts#L87) ✓ |
| I3 | `generate_chart` | **DIVERGENZA MINORE** | `recharts ^3.5.1` a `package.json:31` ✓ esatto. La SPEC cita "block chart in `chatIaToolTypes.ts:104-114`" ma `ChatIaBlockChart` è realmente a righe 110-119; le righe 104-109 contengono `ChatIaBlockText`/`Card`/`Table`. Divergenza M1 (vedi sez. 6) |

### CATEGORIA J — UI Actions (4 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| J1 | `open_dossier_page` | **DIVERGENZA MINORE** | `buildNextDossierPath` a [nextStructuralPaths.ts:63](../../src/next/nextStructuralPaths.ts#L63) ✓ esatto. La SPEC cita "route Dossier (`src/App.tsx:442`)": riga 442 è `<Route path="dossiermezzi/:targa">`; la route canonica `dossier/:targa` (quella che il builder produce) è a riga 451. Divergenza M2 |
| J2 | `open_vehicle_edit_modal` | PASS | `NextMezzoEditModal` a [NextMezzoEditModal.tsx:257](../../src/next/components/NextMezzoEditModal.tsx#L257) ✓; render a [NextDossierMezzoPage.tsx:521](../../src/next/NextDossierMezzoPage.tsx#L521) ✓; stato `useState` a riga 161 ✓; `setShowEditModal(true)` a riga 542 ✓ |
| J3 | `navigate_to` | PASS | Costanti route a `nextStructuralPaths.ts:1-38` ✓ |
| J4 | `open_magazzino_section` | PASS | `buildNextMagazzinoPath` a `nextStructuralPaths.ts:46` ✓ |

### CATEGORIA K — Archivio (3 tool)

| # | Tool | Esito | Note |
|---|---|---|---|
| K1 | `list_archived_reports` | PASS | `listChatIaReportArchiveEntries` a [chatIaReportArchive.ts:94](../../src/next/chat-ia/reports/chatIaReportArchive.ts#L94) ✓ |
| K2 | `retrieve_archived_report` | PASS | `readChatIaReportArchiveEntry` a riga 110 ✓ |
| K3 | `delete_archived_report` | PASS | `markChatIaReportArchiveEntryDeleted` a riga 117 ✓. Modifica solo archivio chat (non business). SUBITO_CON_DECISIONE giusto |

---

## 3. Verifica infrastruttura tool

| Claim SPEC | Riga reale verificata | Esito |
|---|---|---|
| `chatIaToolTypes.ts:24-42` (tipi runtime) | `ChatIaToolDefinition:24`, `ChatIaToolExecutionContext:31`, `ChatIaToolHandler:38` (chiude a 45) | PASS — range copre la zona dei tipi |
| `ChatIaToolHandler` a `chatIaToolTypes.ts:38` | r. 38 ✓ | PASS |
| `chatIaToolRegistry.ts:5-34` | `register:5`, `getToolByName:12`, `getAllToolDefinitions:20`, `getAllToolDefinitionsForOpenAI:33` | PASS |
| `chatIaToolExecutor.ts:42-82` | `executeToolCall` parte a riga 35, chiude a 85 | **DIVERGENZA MINORE M3** (sez. 6) |
| `src/next/chat-ia/tools/index.ts` esiste | ✓ | PASS |
| `src/next/chat-ia/tools/registry/` esiste | ✓ con il solo `toolGetVehicleByPlate.ts` | PASS |
| `toolGetVehicleByPlate.ts` già esistente | ✓ | PASS — claim "GIA IMPLEMENTATO" coerente |

---

## 4. Verifica prerequisiti dichiarati

### ESTENSIONE — 14 tool

Conteggio confermato (riga 851-864 della SPEC). Per ognuno il reader esiste e quello che manca è davvero un helper locale (aggregazione, filtro, fuzzy match, route-state, wrapper React). Nessun tool è classificato male: ESTENSIONE non nasconde un NUOVO_READER né è in realtà SUBITO. PASS.

### NUOVO_READER — 2 tool

1. **`search_events`**: confermato. Reader mezzo-centrici esistono, ma nessuno espone ricerca testuale flotta-wide. PASS.
2. **`get_cisterna_levels`**: confermato. Campi `livello`/`giacenza`/`residuo` ASSENTI in `nextCisternaDomain.ts`. PASS.

---

## 5. Verifica coerenza interna

| Claim | Verifica | Esito |
|---|---|---|
| 41 tool totali | A=5, B=4, C=4, D=4, E=3, F=4, G=4, H=3, I=3, J=4, K=3 → **41** | PASS |
| 25 SUBITO + 14 ESTENSIONE + 2 NUOVO_READER = 41 | 25+14+2=41 | PASS |
| Naming snake_case | tutti i 41 nomi rispettano snake_case, nessuna collisione | PASS |
| `file_da_creare` in `src/next/chat-ia/tools/registry/` | 40 nuovi + 1 esistente correttamente segnalato | PASS |

---

## 6. Verifica zone oscure dichiarate

| # | Zona oscura | Verifica reale | Esito |
|---|---|---|---|
| 1 | `search_events` (NUOVO_READER) | Nessun reader flotta-wide testuale | CONFERMATO |
| 2 | `get_cisterna_levels` (NUOVO_READER) | Nessun campo livello/giacenza nel reader Cisterna | CONFERMATO |
| 3 | `delete_archived_report` (decisione utente) | Modifica solo archivio chat — non business | CONFERMATO |
| 4 | `generate_chart` (ESTENSIONE) | recharts disponibile, `ChatIaBlockChart` definito a chatIaToolTypes:110-119, ma nessun wrapper React esiste | CONFERMATO |
| 5 | `open_vehicle_edit_modal` (ESTENSIONE) | Stato modal è `useState` locale → serve route-state/query param | CONFERMATO |
| 6 | `get_driver_by_badge` (ESTENSIONE — campo da verificare) | Campo `badge: string \| null` PRESENTE in `NextCollegaReadOnlyItem:41` | **CHIUSO POSITIVAMENTE** — fallback dichiarato dalla SPEC NON necessario |

---

## 7. Riepilogo divergenze

### CRITICHE (0)

Nessuna.

### MEDIE (0)

Nessuna.

### MINORI (3)

**M1 — Chart block line range**  
- SPEC: `src/next/chat-ia/tools/chatIaToolTypes.ts:104-114` (block chart in ChatIaOutputBlock)  
- Reale: `ChatIaBlockChart` a righe **110-119**. Le righe 104-109 contengono `ChatIaBlockText`, `ChatIaBlockCard`, `ChatIaBlockTable`. Riga 114 è interna al tipo (`title: string;`)  
- Severità: MINORE — il tipo esiste, l'implementazione resta fattibile, ma il bounding rect citato è scorretto

**M2 — Dossier route line**  
- SPEC: `src/App.tsx:442` per "route Dossier"  
- Reale: riga 442 è `<Route path="dossiermezzi/:targa">`. La route canonica `dossier/:targa` (quella prodotta da `buildNextDossierPath`) è a riga **451**  
- Severità: MINORE — entrambe le route puntano a `NextDossierMezzoPage`, quindi semanticamente accettabile, ma la riga citata identifica una route diversa da quella generata dal builder

**M3 — Executor line range**  
- SPEC: `src/next/chat-ia/tools/chatIaToolExecutor.ts:42-82`  
- Reale: la funzione `executeToolCall` parte a riga **35** e chiude a riga **85**. Il range citato copre solo il body interno  
- Severità: MINORE — la funzione è interamente presente e funzionante, ma il range citato esclude la firma e la chiusura

---

## 8. Note non bloccanti

**8.1 — `categoria` vs `categoria_audit`**  
Due tool hanno `categoria` (campo OpenAI-facing) diversa da `categoria_audit` (campo aggregazione tabella):
- `compare_refueling_sources`: `categoria: "calcoli"` ma `categoria_audit: C`
- `get_cost_aggregates`: `categoria: "calcoli"` ma `categoria_audit: F`

Il file MD non spiega esplicitamente che questi due campi hanno scopi diversi. Suggerito chiarimento di una riga in introduzione.

**8.2 — `get_driver_by_badge` — prerequisito da semplificare**  
La SPEC dichiara: "verificare campo badge effettivo nello shape runtime, altrimenti fallback testuale dichiarato". Verifica reale: il campo `badge: string | null` è già presente in `NextCollegaReadOnlyItem` a `nextColleghiDomain.ts:41`. Il fallback non è necessario; l'estensione si riduce a un semplice match deterministico sul campo badge.

---

## 9. Raccomandazioni prima dell'implementazione

1. (MINORE — M3) Aggiornare `chatIaToolExecutor.ts:42-82` → `:35-85` nelle citazioni della SPEC
2. (MINORE — M1) Aggiornare `chatIaToolTypes.ts:104-114` → `:110-119` per il blocco chart
3. (MINORE — M2) Aggiornare `App.tsx:442` → `App.tsx:451` per la route dossier canonica (quella generata da `buildNextDossierPath`)
4. (NOTA 8.1) Rendere esplicita in introduzione la differenza tra `categoria` e `categoria_audit`, oppure unificarli
5. (NOTA 8.2) Aggiornare il prerequisito di `get_driver_by_badge`: il campo badge è verificato presente, il fallback dichiarato non è necessario

---

## 10. Verdetto

**APPROVATO con 3 divergenze MINORI da correggere prima dell'implementazione.**

Le 3 divergenze sono tutte off-by-N su line ranges già citati in via approssimativa; non bloccano l'implementazione ma vanno raddrizzate per chiarezza. Tutte le 41 funzioni e tipi citati esistono nel codice reale. I conteggi 41 / 25 / 14 / 2 sono esatti. Le 6 zone oscure sono coerenti con la realtà del codice (in un caso, `get_driver_by_badge`, la zona oscura si chiude positivamente: il campo badge esiste).

Il file MD è pronto per essere usato come fonte operativa di implementazione, condizionatamente alle 3 correzioni minori e alle 2 note non bloccanti.

---

## 11. Appendice — File letti

- `docs/product/TOOL_REGISTRY_CHAT_IA_NEXT.md` (998 righe, completo)
- `src/next/chat-ia/tools/chatIaToolTypes.ts`
- `src/next/chat-ia/tools/chatIaToolRegistry.ts`
- `src/next/chat-ia/tools/chatIaToolExecutor.ts`
- `src/next/chat-ia/tools/index.ts`
- `src/next/chat-ia/tools/registry/toolGetVehicleByPlate.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziTypes.ts`
- `src/next/chat-ia/reports/chatIaReportPdf.ts`
- `src/next/chat-ia/reports/chatIaReportArchive.ts`
- `src/next/chat-ia/core/chatIaTypes.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/next/nextStructuralPaths.ts`
- `src/next/components/NextMezzoEditModal.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextColleghiDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextDocumentiMezzoDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextSegnalazioniControlliDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextCapoDomain.ts`
- `src/next/domain/nextCisternaDomain.ts`
- `src/App.tsx`
- `package.json`

**Archivista NON analizzato** (file `ArchivistaXxxBridge.tsx` non aperti) — perimetro rispettato.
