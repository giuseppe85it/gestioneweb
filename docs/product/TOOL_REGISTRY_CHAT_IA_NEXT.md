# TOOL REGISTRY CHAT IA NEXT

Versione: 2026-04-28  
Autore: Codex  
Stato: fonte operativa per implementazione tool chat IA NEXT  
Ambito: tool registry OpenAI function calling per `/next/chat-tool`

## INTRODUZIONE

Questo documento traduce l'audit `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md` in una specifica implementativa completa per i tool della chat IA NEXT.

Riferimenti:

- Audit tool candidati: `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:316-689`.
- Architettura tool use: `docs/product/SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md:184-221`.
- Tipi tool runtime: `src/next/chat-ia/tools/chatIaToolTypes.ts:24-42`.
- Primo tool gia implementato: `src/next/chat-ia/tools/registry/toolGetVehicleByPlate.ts:12`.

Convenzioni:

- I nomi tool sono `snake_case` in inglese.
- I file tool sono `tool<NomeCamelCase>.ts` sotto `src/next/chat-ia/tools/registry/`.
- I tool business sono in sola lettura.
- I tool generatori e archivio possono produrre PDF, grafici o record archivio chat IA, ma non scrivono dati business.
- Ogni tool deve essere registrato in `src/next/chat-ia/tools/index.ts`.

## ARCHITETTURA

I tool vivono in `src/next/chat-ia/tools/registry/` e seguono il contratto `ChatIaToolHandler` definito in `src/next/chat-ia/tools/chatIaToolTypes.ts:38`.

Il registry centrale espone `register`, `getToolByName`, `getAllToolDefinitions` e `getAllToolDefinitionsForOpenAI` (`src/next/chat-ia/tools/chatIaToolRegistry.ts:5-34`). L'executor client-side chiama il tool registrato e restituisce `ChatIaToolResult` (`src/next/chat-ia/tools/chatIaToolExecutor.ts:35-85`).

Il backend non importa reader business: riceve la lista tool, chiede a OpenAI quali tool chiamare e poi riceve dal client i risultati tool. Questa separazione e vincolante dalla SPEC architettura (`docs/product/SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md:87`, `docs/product/SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md:184`).

## CONVENZIONI IMPLEMENTATIVE

- Naming file: `tool<NomeCamelCase>.ts`.
- Export: `export const toolNome: ChatIaToolHandler<...>`.
- Import nel registry: aggiungere il tool a `src/next/chat-ia/tools/index.ts`.
- Handler: `async run(input, context)` con validazione input.
- Errori: preferire `throw new Error("...")` per validazione hard; l'executor converte in `ChatIaToolResult` fallito.
- Output: oggetto JSON serializzabile.
- Output kind: usare `outputKindHint` coerente (`text`, `card`, `table`, `chart`, `report`, `archive_list`, `ui_action`).
- Sola lettura business: nessun tool deve chiamare writer Firestore/Storage business.

Convenzione campi categoria:

- `categoria`: raggruppamento operativo del registry (`lettura_mezzi`, `lettura_autisti`, `calcoli`, `generatori`, ecc.).
- `categoria_audit`: riferimento alle 11 categorie A-K dell'audit dati. Per la maggior parte dei tool i due valori coincidono concettualmente. Per alcuni tool aggregati o trasversali (es. `compare_refueling_sources`, `get_cost_aggregates`) i due campi possono differire perche il tool incrocia categorie.

## CATEGORIA A - LETTURA MEZZI

### TOOL: get_vehicle_by_plate

- nome: `get_vehicle_by_plate`
- categoria: `lettura_mezzi`
- description_per_openai: "Restituisce i dati di un mezzo dalla sua targa: anagrafica completa, autista assegnato, scadenze e foto. Usa quando l'utente chiede informazioni su un mezzo specifico identificato da targa."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string","description":"Targa del mezzo, per esempio TI282780."}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetVehicleByPlateOutput = { found: boolean; targa: string; vehicle?: NextAnagraficheFlottaMezzoItem; card?: unknown; message?: string };
```
- implementation: `readNextMezzoByTarga` (`src/next/nextAnagraficheFlottaDomain.ts:880`), tipo `NextAnagraficheFlottaMezzoItem` (`src/next/nextAnagraficheFlottaDomain.ts:79`).
- prerequisiti: `GIA IMPLEMENTATO` in `src/next/chat-ia/tools/registry/toolGetVehicleByPlate.ts:12`.
- file_da_creare: gia presente `src/next/chat-ia/tools/registry/toolGetVehicleByPlate.ts`.
- categoria_audit: A.
- example_prompts: "TI282780"; "stato del mezzo TI282780"; "dimmi del mezzo CC123XX".

### TOOL: list_vehicles

- nome: `list_vehicles`
- categoria: `lettura_mezzi`
- description_per_openai: "Elenca i mezzi della flotta e applica filtri semplici su categoria, testo o scadenza revisione. Usa quando l'utente chiede lista mezzi, tutti i mezzi, mezzi cisterna o mezzi con revisione scaduta."
- parameters:
```json
{"type":"object","properties":{"categoria":{"type":"string"},"testo":{"type":"string"},"scadenzaRevisione":{"type":"string","enum":["scaduta","in_scadenza","valida"]}},"additionalProperties":false}
```
- output_shape:
```ts
type ListVehiclesOutput = { items: NextAnagraficheFlottaMezzoItem[]; total: number; appliedFilters: Record<string,string> };
```
- implementation: `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`), `normalizeNextMezzoCategoria` (`src/next/nextAnagraficheFlottaDomain.ts:295`).
- prerequisiti: `SUBITO`; il tool implementa filtri locali solo su campi presenti in `NextAnagraficheFlottaMezzoItem`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolListVehicles.ts`.
- categoria_audit: A.
- example_prompts: "lista mezzi"; "mezzi cisterna"; "mezzi revisione scaduta".

### TOOL: get_vehicle_status

- nome: `get_vehicle_status`
- categoria: `lettura_mezzi`
- description_per_openai: "Recupera stato operativo, alert e focus di un mezzo. Usa quando l'utente chiede se un mezzo ha anomalie operative, scadenze o stato nel centro controllo."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetVehicleStatusOutput = { targa: string; mezzo: NextAnagraficheFlottaMezzoItem | null; stato: D10Snapshot | null; alerts: unknown[]; focus: unknown[] };
```
- implementation: `readNextStatoOperativoSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1657`), `readNextMezzoByTarga` (`src/next/nextAnagraficheFlottaDomain.ts:880`).
- prerequisiti: `SUBITO`; serve wrapper locale per estrarre dallo snapshot D10 gli elementi collegati alla targa.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetVehicleStatus.ts`.
- categoria_audit: A.
- example_prompts: "che stato ha TI282780"; "ci sono alert su TI282780"; "TI282780 ha problemi aperti?".

### TOOL: get_vehicle_maintenance_history

- nome: `get_vehicle_maintenance_history`
- categoria: `lettura_mezzi`
- description_per_openai: "Recupera manutenzioni, lavori e storico tecnico di un mezzo. Usa quando l'utente chiede storico lavori, manutenzioni o interventi tecnici di una targa."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetVehicleMaintenanceHistoryOutput = { operativita: NextMezzoOperativitaTecnicaSnapshot; manutenzioni?: unknown; periodo?: { from?: string; to?: string } };
```
- implementation: `readNextMezzoOperativitaTecnicaSnapshot` (`src/next/nextOperativitaTecnicaDomain.ts:223`), `readNextMezzoManutenzioniSnapshot` (`src/next/domain/nextManutenzioniDomain.ts:663`).
- prerequisiti: `SUBITO`; filtro periodo lato tool.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetVehicleMaintenanceHistory.ts`.
- categoria_audit: A.
- example_prompts: "storico manutenzioni TI282780"; "lavori fatti su TI282780 nel 2026"; "interventi tecnici TI282780".

### TOOL: get_vehicle_dossier_snapshot

- nome: `get_vehicle_dossier_snapshot`
- categoria: `lettura_mezzi`
- description_per_openai: "Recupera lo snapshot composito gia usato dal settore Mezzi v1. Usa quando serve una vista completa del mezzo con anagrafica, timeline, materiali e documenti."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetVehicleDossierSnapshotOutput = ChatIaMezzoDataResult;
```
- implementation: `readChatIaMezzoSnapshot` (`src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:61`), tipo `ChatIaMezzoSnapshot` (`src/next/chat-ia/sectors/mezzi/chatIaMezziTypes.ts:41`).
- prerequisiti: `SUBITO`; mantenere compatibilita con settore Mezzi router+runner durante la migrazione.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetVehicleDossierSnapshot.ts`.
- categoria_audit: A.
- example_prompts: "scheda completa TI282780"; "fammi dossier TI282780"; "riassunto mezzo TI282780".

## CATEGORIA B - LETTURA AUTISTI

### TOOL: list_drivers

- nome: `list_drivers`
- categoria: `lettura_autisti`
- description_per_openai: "Elenca colleghi e autisti noti al sistema, con filtro testuale opzionale. Usa quando l'utente chiede lista autisti, colleghi o cerca nominativi."
- parameters:
```json
{"type":"object","properties":{"testo":{"type":"string"},"attivo":{"type":"boolean"}},"additionalProperties":false}
```
- output_shape:
```ts
type ListDriversOutput = { items: NextCollegaReadOnlyItem[]; total: number };
```
- implementation: `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`), tipo `NextCollegaReadOnlyItem` (`src/next/domain/nextColleghiDomain.ts:36`).
- prerequisiti: `SUBITO`; filtro testuale locale.
- file_da_creare: `src/next/chat-ia/tools/registry/toolListDrivers.ts`.
- categoria_audit: B.
- example_prompts: "lista autisti"; "cerca autista Rossi"; "quanti colleghi abbiamo?".

### TOOL: get_driver_by_name

- nome: `get_driver_by_name`
- categoria: `lettura_autisti`
- description_per_openai: "Trova un autista per nome o cognome e restituisce il record piu compatibile. Usa quando l'utente identifica un autista con nominativo parziale."
- parameters:
```json
{"type":"object","properties":{"nome":{"type":"string"}},"required":["nome"],"additionalProperties":false}
```
- output_shape:
```ts
type GetDriverByNameOutput = { item: NextCollegaReadOnlyItem | null; matches: NextCollegaReadOnlyItem[]; confidence: "exact" | "partial" | "none" };
```
- implementation: `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`).
- prerequisiti: `ESTENSIONE`; helper fuzzy controllato su nome/cognome, senza matching non spiegabile.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetDriverByName.ts`.
- categoria_audit: B.
- example_prompts: "trova Mario Rossi"; "scheda autista Bianchi"; "chi e Rossi?".

### TOOL: get_driver_by_badge

- nome: `get_driver_by_badge`
- categoria: `lettura_autisti`
- description_per_openai: "Trova un autista per badge o identificativo equivalente, se il campo e presente nei dati. Usa quando l'utente fornisce un badge o codice autista."
- parameters:
```json
{"type":"object","properties":{"badge":{"type":"string"}},"required":["badge"],"additionalProperties":false}
```
- output_shape:
```ts
type GetDriverByBadgeOutput = { item: NextCollegaReadOnlyItem | null; searchedBadge: string; note?: string };
```
- implementation: `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`), `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`).
- prerequisiti: `SUBITO`; il campo `badge: string | null` esiste nello shape `NextCollegaReadOnlyItem` (`src/next/domain/nextColleghiDomain.ts:41`).
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetDriverByBadge.ts`.
- categoria_audit: B.
- example_prompts: "autista badge 123"; "chi ha badge A45"; "trova codice autista 17".

### TOOL: get_driver_activity

- nome: `get_driver_activity`
- categoria: `lettura_autisti`
- description_per_openai: "Recupera sessioni, eventi, segnalazioni, controlli e richieste collegati a un autista. Usa quando l'utente chiede cosa ha fatto un autista o la sua attivita in un periodo."
- parameters:
```json
{"type":"object","properties":{"nome":{"type":"string"},"badge":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"additionalProperties":false}
```
- output_shape:
```ts
type GetDriverActivityOutput = { snapshot: NextAutistiReadOnlySnapshot; filteredItems: unknown[]; driverKey?: string };
```
- implementation: `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`), tipi attivita `NextAutistiCanonicalAssignment` e `NextAutistiCanonicalSignal` (`src/next/domain/nextAutistiDomain.ts:86`, `src/next/domain/nextAutistiDomain.ts:102`).
- prerequisiti: `ESTENSIONE`; filtro per autista e periodo nel tool.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetDriverActivity.ts`.
- categoria_audit: B.
- example_prompts: "attivita di Mario Rossi ieri"; "segnalazioni dell'autista Rossi"; "controlli fatti da badge 123".

## CATEGORIA C - LETTURA RIFORNIMENTI

### TOOL: get_refuelings

- nome: `get_refuelings`
- categoria: `lettura_rifornimenti`
- description_per_openai: "Recupera i rifornimenti di un mezzo in un periodo. Usa quando l'utente chiede rifornimenti, litri o movimenti carburante di una targa."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetRefuelingsOutput = { snapshot: NextMezzoRifornimentiSnapshot; periodo?: { from?: string; to?: string }; items: unknown[]; total: number };
```
- implementation: `readNextMezzoRifornimentiSnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1304`), tipo `NextRifornimentoReadOnlyItem` (`src/next/domain/nextRifornimentiDomain.ts:120`).
- prerequisiti: `SUBITO`; filtro periodo locale.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetRefuelings.ts`.
- categoria_audit: C.
- example_prompts: "rifornimenti TI282780 aprile 2026"; "quanto gasolio ha fatto TI282780"; "lista rifornimenti TI282780".

### TOOL: get_refuelings_aggregated

- nome: `get_refuelings_aggregated`
- categoria: `lettura_rifornimenti`
- description_per_openai: "Calcola litri, importi e conteggi dei rifornimenti per periodo e fonte. Usa quando l'utente chiede totale rifornimenti, medie mensili o riepiloghi flotta."
- parameters:
```json
{"type":"object","properties":{"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false},"fonte":{"type":"string","enum":["cisterna","distributore","tutti"]}},"required":["periodo"],"additionalProperties":false}
```
- output_shape:
```ts
type GetRefuelingsAggregatedOutput = { totalLitri: number; totalCosto?: number; count: number; byMonth: Array<{ month: string; litri: number; costo?: number; count: number }> };
```
- implementation: `readNextRifornimentiReadOnlySnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1291`), `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`).
- prerequisiti: `ESTENSIONE`; helper aggregazione fonte/periodo.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetRefuelingsAggregated.ts`.
- categoria_audit: C.
- example_prompts: "rifornimenti aprile 2026"; "totale litri ultimi 6 mesi"; "rifornimenti distributore marzo".

### TOOL: get_consumption_average

- nome: `get_consumption_average`
- categoria: `lettura_rifornimenti`
- description_per_openai: "Calcola il consumo medio di un mezzo partendo dai rifornimenti disponibili. Usa quando l'utente chiede consumi o litri per 100 km di una targa."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetConsumptionAverageOutput = { targa: string; litriTotali: number; kmTotali?: number; consumoL100Km?: number; note: string[] };
```
- implementation: `readNextMezzoRifornimentiSnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1304`), `readNextMezzoByTarga` (`src/next/nextAnagraficheFlottaDomain.ts:880`).
- prerequisiti: `ESTENSIONE`; verificare presenza km nei record, altrimenti restituire litri totali e nota senza inventare consumo.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetConsumptionAverage.ts`.
- categoria_audit: C.
- example_prompts: "quanto consuma TI282780"; "media consumi TI282780 ultimi 6 mesi"; "l/100km TI282780".

### TOOL: compare_refueling_sources

- nome: `compare_refueling_sources`
- categoria: `calcoli`
- description_per_openai: "Confronta rifornimenti da cisterna e distributori in un periodo. Usa quando l'utente chiede cisterna Caravate vs distributori o confronto fonti carburante."
- parameters:
```json
{"type":"object","properties":{"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"required":["periodo"],"additionalProperties":false}
```
- output_shape:
```ts
type CompareRefuelingSourcesOutput = { cisterna: { litri: number; count: number }; distributori: { litri: number; count: number }; rows: Array<Record<string, unknown>> };
```
- implementation: `readNextRifornimentiReadOnlySnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1291`), `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`).
- prerequisiti: `ESTENSIONE`; classificazione fonte basata solo su campi esistenti.
- file_da_creare: `src/next/chat-ia/tools/registry/toolCompareRefuelingSources.ts`.
- categoria_audit: C.
- example_prompts: "rifornimenti cisterna vs distributori"; "confronta fonti carburante aprile"; "quanti litri da cisterna e quanti da distributore".

## CATEGORIA D - LETTURA DOCUMENTI

### TOOL: get_vehicle_documents

- nome: `get_vehicle_documents`
- categoria: `lettura_documenti`
- description_per_openai: "Recupera i documenti associati a un mezzo. Usa quando l'utente chiede libretti, revisioni, assicurazioni o documenti di una targa."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"tipo":{"type":"string"}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetVehicleDocumentsOutput = NextMezzoDocumentiSnapshot;
```
- implementation: `readNextMezzoDocumentiSnapshot` (`src/next/domain/nextDocumentiMezzoDomain.ts:252`), tipo `NextDocumentoMezzoItem` (`src/next/domain/nextDocumentiMezzoDomain.ts:30`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetVehicleDocuments.ts`.
- categoria_audit: D.
- example_prompts: "documenti TI282780"; "libretto TI282780"; "assicurazione del mezzo TI282780".

### TOOL: get_document_costs_by_vehicle

- nome: `get_document_costs_by_vehicle`
- categoria: `lettura_documenti`
- description_per_openai: "Recupera documenti e costi collegati a un mezzo. Usa quando l'utente chiede fatture, costi documentali o costi storici di una targa."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetDocumentCostsByVehicleOutput = { snapshot: NextMezzoDocumentiCostiSnapshot; periodView?: unknown };
```
- implementation: `readNextMezzoDocumentiCostiSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2313`), `readNextMezzoDocumentiCostiPeriodView` (`src/next/domain/nextDocumentiCostiDomain.ts:2391`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetDocumentCostsByVehicle.ts`.
- categoria_audit: D.
- example_prompts: "costi documenti TI282780"; "fatture TI282780 2026"; "spese del mezzo TI282780".

### TOOL: download_document_pdf

- nome: `download_document_pdf`
- categoria: `lettura_documenti`
- description_per_openai: "Restituisce URL e metadati di un documento scaricabile se gia presenti nei record. Usa quando l'utente chiede di aprire o scaricare un PDF esistente."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"documentId":{"type":"string"}},"additionalProperties":false}
```
- output_shape:
```ts
type DownloadDocumentPdfOutput = { documentId: string; fileUrl?: string; fileName?: string; source: string } | null;
```
- implementation: `readNextMezzoDocumentiSnapshot` (`src/next/domain/nextDocumentiMezzoDomain.ts:252`), tipo `NextDocumentoMezzoItem` (`src/next/domain/nextDocumentiMezzoDomain.ts:30`).
- prerequisiti: `SUBITO`; il tool non scarica bytes, restituisce link/metadati.
- file_da_creare: `src/next/chat-ia/tools/registry/toolDownloadDocumentPdf.ts`.
- categoria_audit: D.
- example_prompts: "apri pdf libretto TI282780"; "scarica documento TI282780"; "dammi link del documento doc123".

### TOOL: get_invoice_by_id

- nome: `get_invoice_by_id`
- categoria: `lettura_documenti`
- description_per_openai: "Cerca un documento o fattura per id negli archivi documentali NEXT. Usa quando l'utente fornisce un identificativo documento/fattura."
- parameters:
```json
{"type":"object","properties":{"id":{"type":"string"}},"required":["id"],"additionalProperties":false}
```
- output_shape:
```ts
type GetInvoiceByIdOutput = { item: NextIADocumentiArchiveItem | NextDocumentiCostiReadOnlyItem | null; source?: string };
```
- implementation: `readNextIADocumentiArchiveSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2010`), `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
- prerequisiti: `ESTENSIONE`; helper ricerca per id su snapshot multipli.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetInvoiceById.ts`.
- categoria_audit: D.
- example_prompts: "trova fattura 123"; "documento id abc"; "cerca invoice 2026-001".

## CATEGORIA E - LETTURA SEGNALAZIONI E CONTROLLI

### TOOL: get_vehicle_events

- nome: `get_vehicle_events`
- categoria: `lettura_segnalazioni`
- description_per_openai: "Recupera segnalazioni e controlli di un mezzo. Usa quando l'utente chiede guasti, controlli, problemi o segnalazioni di una targa."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetVehicleEventsOutput = { snapshot: NextMezzoSegnalazioniControlliSnapshot; items: unknown[]; total: number };
```
- implementation: `readNextMezzoSegnalazioniControlliSnapshot` (`src/next/domain/nextSegnalazioniControlliDomain.ts:297`), tipo `NextMezzoSegnalazioniControlliSnapshot` (`src/next/domain/nextSegnalazioniControlliDomain.ts:61`).
- prerequisiti: `SUBITO`; filtro periodo locale.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetVehicleEvents.ts`.
- categoria_audit: E.
- example_prompts: "guasti TI282780"; "segnalazioni TI282780"; "controlli mezzo TI282780".

### TOOL: get_historical_operational_events

- nome: `get_historical_operational_events`
- categoria: `lettura_segnalazioni`
- description_per_openai: "Recupera eventi storici operativi D10 e li filtra per targa, periodo o testo. Usa quando l'utente cerca eventi operativi storici nel centro controllo."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"query":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"additionalProperties":false}
```
- output_shape:
```ts
type GetHistoricalOperationalEventsOutput = { items: D10StoricoEventoItem[]; total: number };
```
- implementation: `readNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1627`), tipo `D10StoricoEventoItem` (`src/next/domain/nextCentroControlloDomain.ts:134`).
- prerequisiti: `ESTENSIONE`; helper filtro testuale/periodo.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetHistoricalOperationalEvents.ts`.
- categoria_audit: E.
- example_prompts: "eventi storici TI282780"; "cerca evento motore"; "storico centro controllo aprile".

### TOOL: search_events

- nome: `search_events`
- categoria: `lettura_segnalazioni`
- description_per_openai: "Cerca testualmente segnalazioni, controlli ed eventi storici su tutta la flotta. Usa per domande del tipo 'e gia successo?' o ricerche testuali flotta-wide."
- parameters:
```json
{"type":"object","properties":{"query":{"type":"string"},"targa":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"required":["query"],"additionalProperties":false}
```
- output_shape:
```ts
type SearchEventsOutput = { matches: Array<{ data?: string; targa?: string; fonte: "segnalazione" | "controllo" | "evento"; descrizione: string; score?: number }>; total: number };
```
- implementation: base mezzo-centrica `readNextMezzoSegnalazioniControlliSnapshot` (`src/next/domain/nextSegnalazioniControlliDomain.ts:297`) e D10 `readNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1627`).
- prerequisiti: `NUOVO_READER`; serve reader aggregato flotta-wide oppure composizione esplicita da D10/autisti con normalizzazione testuale.
- file_da_creare: `src/next/chat-ia/tools/registry/toolSearchEvents.ts`.
- categoria_audit: E.
- example_prompts: "questa segnalazione e gia successa?"; "guasti motore su tutta la flotta"; "cerca perdita olio".

## CATEGORIA F - LETTURA COSTI

### TOOL: get_costs

- nome: `get_costs`
- categoria: `lettura_costi`
- description_per_openai: "Recupera costi per mezzo o per flotta in un periodo. Usa quando l'utente chiede spese, costi, totale costi o costi per categoria."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"categoria":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"additionalProperties":false}
```
- output_shape:
```ts
type GetCostsOutput = { mezzo?: NextMezzoDocumentiCostiSnapshot; flotta?: NextDocumentiCostiFleetSnapshot; items: unknown[]; total?: number };
```
- implementation: `readNextMezzoDocumentiCostiSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2313`), `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
- prerequisiti: `SUBITO`; wrapper decide mezzo/flotta in base a `targa`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetCosts.ts`.
- categoria_audit: F.
- example_prompts: "costi TI282780 2026"; "costi flotta aprile"; "spese gomme".

### TOOL: get_cost_aggregates

- nome: `get_cost_aggregates`
- categoria: `calcoli`
- description_per_openai: "Aggrega costi per periodo, categoria, mezzo o flotta. Usa quando l'utente chiede totali, medie o raggruppamenti di costi."
- parameters:
```json
{"type":"object","properties":{"categoria":{"type":"string"},"groupBy":{"type":"string","enum":["mese","mezzo","categoria"]},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"additionalProperties":false}
```
- output_shape:
```ts
type GetCostAggregatesOutput = { total: number; count: number; buckets: Array<{ key: string; total: number; count: number }> };
```
- implementation: `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`), tipo costo `NextDocumentiCostiReadOnlyItem` (`src/next/domain/nextDocumentiCostiDomain.ts:125`).
- prerequisiti: `ESTENSIONE`; helper aggregazione deterministico.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetCostAggregates.ts`.
- categoria_audit: F.
- example_prompts: "costi per mese"; "totale costi per mezzo"; "aggregami costi manutenzione".

### TOOL: get_procurement_costs

- nome: `get_procurement_costs`
- categoria: `lettura_costi`
- description_per_openai: "Legge ordini, preventivi, approvazioni e listino procurement. Usa quando l'utente chiede costi acquisti, fornitori, ordini o preventivi."
- parameters:
```json
{"type":"object","properties":{"stato":{"type":"string"},"fornitore":{"type":"string"},"testo":{"type":"string"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetProcurementCostsOutput = { procurement?: NextProcurementSnapshot; readOnly?: NextProcurementReadOnlySnapshot; items: unknown[] };
```
- implementation: `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`), `readNextProcurementReadOnlySnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2092`).
- prerequisiti: `SUBITO`; filtro locale su stato/fornitore/testo.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetProcurementCosts.ts`.
- categoria_audit: F.
- example_prompts: "preventivi aperti"; "ordini fornitore X"; "costi procurement".

### TOOL: get_capo_costs_by_vehicle

- nome: `get_capo_costs_by_vehicle`
- categoria: `lettura_costi`
- description_per_openai: "Recupera riepiloghi costi mezzo usati dal dominio capo. Usa quando l'utente chiede una sintesi costi per mezzo."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetCapoCostsByVehicleOutput = NextCapoCostiMezzoSnapshot;
```
- implementation: `readNextCapoCostiMezzoSnapshot` (`src/next/domain/nextCapoDomain.ts:507`), tipo `NextCapoCostiMezzoSnapshot` (`src/next/domain/nextCapoDomain.ts:89`).
- prerequisiti: `SUBITO`; filtro targa se richiesto.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetCapoCostsByVehicle.ts`.
- categoria_audit: F.
- example_prompts: "riepilogo costi TI282780"; "costi capo per TI282780"; "sintesi spese mezzo".

## CATEGORIA G - LETTURA CISTERNA

### TOOL: get_cisterna_snapshot

- nome: `get_cisterna_snapshot`
- categoria: `lettura_cisterna`
- description_per_openai: "Recupera snapshot Cisterna con documenti, schede, supporto autisti e parametri mensili. Usa quando l'utente chiede situazione Cisterna Caravate."
- parameters:
```json
{"type":"object","properties":{"monthKey":{"type":"string","description":"Mese YYYY-MM opzionale."}},"additionalProperties":false}
```
- output_shape:
```ts
type GetCisternaSnapshotOutput = NextCisternaSnapshot;
```
- implementation: `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`), tipo `NextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:168`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetCisternaSnapshot.ts`.
- categoria_audit: G.
- example_prompts: "situazione cisterna"; "cisterna aprile 2026"; "documenti cisterna".

### TOOL: get_cisterna_refuelings

- nome: `get_cisterna_refuelings`
- categoria: `lettura_cisterna`
- description_per_openai: "Recupera rifornimenti e righe schede Cisterna nel periodo. Usa quando l'utente chiede erogazioni o rifornimenti da Cisterna Caravate."
- parameters:
```json
{"type":"object","properties":{"monthKey":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"additionalProperties":false}
```
- output_shape:
```ts
type GetCisternaRefuelingsOutput = { supportItems: NextCisternaSupportItem[]; schede: NextCisternaSchedaItem[] };
```
- implementation: `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`), tipi `NextCisternaSupportItem` e `NextCisternaSchedaItem` (`src/next/domain/nextCisternaDomain.ts:85`, `src/next/domain/nextCisternaDomain.ts:115`).
- prerequisiti: `SUBITO`; mapping righe schede/supporto.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetCisternaRefuelings.ts`.
- categoria_audit: G.
- example_prompts: "rifornimenti cisterna aprile"; "erogazioni cisterna"; "schede cisterna marzo".

### TOOL: get_cisterna_documents

- nome: `get_cisterna_documents`
- categoria: `lettura_cisterna`
- description_per_openai: "Recupera documenti Cisterna caricati e analizzati. Usa quando l'utente chiede bolle, fatture o documenti Cisterna."
- parameters:
```json
{"type":"object","properties":{"monthKey":{"type":"string"},"fornitore":{"type":"string"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetCisternaDocumentsOutput = { items: NextCisternaDocumentItem[]; total: number };
```
- implementation: `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`), tipo `NextCisternaDocumentItem` (`src/next/domain/nextCisternaDomain.ts:93`).
- prerequisiti: `SUBITO`; filtro locale.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetCisternaDocuments.ts`.
- categoria_audit: G.
- example_prompts: "documenti cisterna ENI"; "fatture cisterna aprile"; "bolle cisterna".

### TOOL: get_cisterna_levels

- nome: `get_cisterna_levels`
- categoria: `lettura_cisterna`
- description_per_openai: "Recupera livelli o giacenze Cisterna solo se il dato e disponibile e verificato. Usa quando l'utente chiede livello o residuo cisterna."
- parameters:
```json
{"type":"object","properties":{"monthKey":{"type":"string"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetCisternaLevelsOutput = { level?: number; unit?: string; source: string; note: string[] };
```
- implementation: punto di partenza `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`).
- prerequisiti: `NUOVO_READER`; dato livello/giacenza non dimostrato nel reader censito. Non esporre come operativo finche il campo non e verificato.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetCisternaLevels.ts`.
- categoria_audit: G.
- example_prompts: "livello cisterna"; "quanto gasolio resta"; "giacenza cisterna aprile".

## CATEGORIA H - CALCOLI E AGGREGATI

### TOOL: compute_average

- nome: `compute_average`
- categoria: `calcoli`
- description_per_openai: "Calcola una media numerica su un dataset gia letto da un altro tool. Usa quando l'utente chiede media consumi, media costi o media valori numerici."
- parameters:
```json
{"type":"object","properties":{"datasetRef":{"type":"string"},"campo":{"type":"string"},"groupBy":{"type":"string"}},"required":["datasetRef","campo"],"additionalProperties":false}
```
- output_shape:
```ts
type ComputeAverageOutput = { average: number; count: number; groups?: Array<{ key: string; average: number; count: number }> };
```
- implementation: dataset rifornimenti `readNextRifornimentiReadOnlySnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1291`) o costi `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
- prerequisiti: `ESTENSIONE`; helper generico validato solo su campi numerici espliciti.
- file_da_creare: `src/next/chat-ia/tools/registry/toolComputeAverage.ts`.
- categoria_audit: H.
- example_prompts: "media consumi flotta"; "media litri ultimi 12 mesi"; "media costi per mese".

### TOOL: compare_periods

- nome: `compare_periods`
- categoria: `calcoli`
- description_per_openai: "Confronta totali o medie tra due periodi su dati letti da tool esistenti. Usa quando l'utente chiede differenza mese su mese o confronto periodi."
- parameters:
```json
{"type":"object","properties":{"datasetRef":{"type":"string"},"campo":{"type":"string"},"periodoA":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false},"periodoB":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"required":["datasetRef","campo","periodoA","periodoB"],"additionalProperties":false}
```
- output_shape:
```ts
type ComparePeriodsOutput = { a: number; b: number; delta: number; deltaPercent?: number };
```
- implementation: rifornimenti (`src/next/domain/nextRifornimentiDomain.ts:1291`), costi (`src/next/domain/nextDocumentiCostiDomain.ts:2247`), Cisterna (`src/next/domain/nextCisternaDomain.ts:1240`).
- prerequisiti: `ESTENSIONE`; helper periodo comune.
- file_da_creare: `src/next/chat-ia/tools/registry/toolComparePeriods.ts`.
- categoria_audit: H.
- example_prompts: "confronta aprile e marzo"; "litri 2026 vs 2025"; "costi ultimo trimestre vs precedente".

### TOOL: find_outliers

- nome: `find_outliers`
- categoria: `calcoli`
- description_per_openai: "Individua valori anomali in dati numerici gia letti. Usa quando l'utente chiede anomalie, fuori scala o valori strani."
- parameters:
```json
{"type":"object","properties":{"datasetRef":{"type":"string"},"campo":{"type":"string"},"soglia":{"type":"number"}},"required":["datasetRef","campo"],"additionalProperties":false}
```
- output_shape:
```ts
type FindOutliersOutput = { items: Array<Record<string, unknown>>; method: "threshold" | "iqr"; total: number };
```
- implementation: rifornimenti (`src/next/domain/nextRifornimentiDomain.ts:1291`) e costi (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
- prerequisiti: `ESTENSIONE`; metodo semplice, spiegabile e deterministico.
- file_da_creare: `src/next/chat-ia/tools/registry/toolFindOutliers.ts`.
- categoria_audit: H.
- example_prompts: "trova rifornimenti anomali"; "costi fuori scala"; "valori strani nei litri".

## CATEGORIA I - GENERATORI

### TOOL: generate_report_pdf

- nome: `generate_report_pdf`
- categoria: `generatori`
- description_per_openai: "Genera un PDF di report a partire da contenuto strutturato della chat. Usa quando l'utente chiede un report PDF o una stampa della risposta."
- parameters:
```json
{"type":"object","properties":{"title":{"type":"string"},"sections":{"type":"array","items":{"type":"object","properties":{"title":{"type":"string"},"body":{"type":"string"}},"required":["title","body"],"additionalProperties":false}},"sector":{"type":"string"}},"required":["title","sections"],"additionalProperties":false}
```
- output_shape:
```ts
type GenerateReportPdfOutput = { blob: Blob; fileName: string };
```
- implementation: `generateChatIaReportPdf` (`src/next/chat-ia/reports/chatIaReportPdf.ts:23`), `generateInternalAiReportPdfBlob` (`src/next/internal-ai/internalAiReportPdf.ts:219`).
- prerequisiti: `SUBITO`; adattatore tool verso shape report.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGenerateReportPdf.ts`.
- categoria_audit: I.
- example_prompts: "genera PDF"; "fammi report di questa analisi"; "stampa riepilogo flotta".

### TOOL: save_report_to_archive

- nome: `save_report_to_archive`
- categoria: `archivio`
- description_per_openai: "Salva un report generato nell'archivio chat IA. Usa quando l'utente chiede di archiviare un report della chat."
- parameters:
```json
{"type":"object","properties":{"report":{"type":"object"},"pdfBlobRef":{"type":"string"}},"required":["report"],"additionalProperties":false}
```
- output_shape:
```ts
type SaveReportToArchiveOutput = ChatIaArchiveEntry;
```
- implementation: `createChatIaReportArchiveEntry` (`src/next/chat-ia/reports/chatIaReportArchive.ts:44`), tipo `ChatIaArchiveEntry` (`src/next/chat-ia/core/chatIaTypes.ts:87`).
- prerequisiti: `SUBITO`; scrittura ammessa solo per archivio report, non business.
- file_da_creare: `src/next/chat-ia/tools/registry/toolSaveReportToArchive.ts`.
- categoria_audit: I.
- example_prompts: "salva questo report"; "archivia analisi"; "metti il PDF in archivio".

### TOOL: generate_chart

- nome: `generate_chart`
- categoria: `generatori`
- description_per_openai: "Genera una descrizione dati per grafico semplice renderizzabile in UI. Usa quando l'utente chiede grafico, trend, barre, linee o torta."
- parameters:
```json
{"type":"object","properties":{"type":{"type":"string","enum":["bar","line","pie"]},"data":{"type":"array","items":{"type":"object"}},"xKey":{"type":"string"},"yKey":{"type":"string"},"title":{"type":"string"}},"required":["type","data","xKey","yKey"],"additionalProperties":false}
```
- output_shape:
```ts
type GenerateChartOutput = { type: "bar" | "line" | "pie"; title?: string; data: Array<Record<string, unknown>>; xKey: string; yKey: string };
```
- implementation: `recharts` disponibile (`package.json:31`), block chart in `ChatIaOutputBlock` (`src/next/chat-ia/tools/chatIaToolTypes.ts:110-119`), tipi UI base (`src/next/chat-ia/core/chatIaTypes.ts:25`, `src/next/chat-ia/core/chatIaTypes.ts:53`).
- prerequisiti: `ESTENSIONE`; creare wrapper React chart per la chat IA.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGenerateChart.ts`.
- categoria_audit: I.
- example_prompts: "fammi grafico consumi"; "mostra trend mensile"; "grafico costi per categoria".

## CATEGORIA J - AZIONI UI

### TOOL: open_dossier_page

- nome: `open_dossier_page`
- categoria: `ui_actions`
- description_per_openai: "Propone o apre la pagina Dossier Mezzo per una targa. Usa quando l'utente chiede di aprire dossier o scheda mezzo."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type OpenDossierPageOutput = { route: string };
```
- implementation: `buildNextDossierPath` (`src/next/nextStructuralPaths.ts:63`), route Dossier (`src/App.tsx:451`).
- prerequisiti: `SUBITO`; azione client-side, nessuna scrittura.
- file_da_creare: `src/next/chat-ia/tools/registry/toolOpenDossierPage.ts`.
- categoria_audit: J.
- example_prompts: "apri dossier TI282780"; "portami alla scheda mezzo"; "vai al dossier CC123XX".

### TOOL: open_vehicle_edit_modal

- nome: `open_vehicle_edit_modal`
- categoria: `ui_actions`
- description_per_openai: "Apre il modal edit mezzo nella pagina Dossier, senza salvare modifiche. Usa quando l'utente chiede di aprire la modifica del mezzo."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type OpenVehicleEditModalOutput = { route: string; modal: "vehicle_edit" };
```
- implementation: `NextMezzoEditModal` (`src/next/components/NextMezzoEditModal.tsx:257`), render nel dossier (`src/next/NextDossierMezzoPage.tsx:521`), stato apertura locale (`src/next/NextDossierMezzoPage.tsx:161`, `src/next/NextDossierMezzoPage.tsx:542`).
- prerequisiti: `ESTENSIONE`; supporto route-state o query param per aprire il modal senza click manuale. Nessun salvataggio automatico.
- file_da_creare: `src/next/chat-ia/tools/registry/toolOpenVehicleEditModal.ts`.
- categoria_audit: J.
- example_prompts: "modifica TI282780"; "apri modal edit mezzo"; "voglio correggere la scheda TI282780".

### TOOL: navigate_to

- nome: `navigate_to`
- categoria: `ui_actions`
- description_per_openai: "Naviga verso una route NEXT nota e sicura. Usa quando l'utente chiede di andare a una sezione del gestionale."
- parameters:
```json
{"type":"object","properties":{"route":{"type":"string"}},"required":["route"],"additionalProperties":false}
```
- output_shape:
```ts
type NavigateToOutput = { route: string };
```
- implementation: costanti route in `src/next/nextStructuralPaths.ts:1-38`.
- prerequisiti: `SUBITO`; whitelist route obbligatoria.
- file_da_creare: `src/next/chat-ia/tools/registry/toolNavigateTo.ts`.
- categoria_audit: J.
- example_prompts: "vai a magazzino"; "apri centro controllo"; "portami in cisterna".

### TOOL: open_magazzino_section

- nome: `open_magazzino_section`
- categoria: `ui_actions`
- description_per_openai: "Apre Magazzino NEXT in una sezione supportata dal builder. Usa quando l'utente chiede inventario, materiali consegnati, AdBlue o documenti costi in Magazzino."
- parameters:
```json
{"type":"object","properties":{"section":{"type":"string","enum":["inventario","materiali-consegnati","cisterne-adblue","documenti-costi"]}},"additionalProperties":false}
```
- output_shape:
```ts
type OpenMagazzinoSectionOutput = { route: string };
```
- implementation: `buildNextMagazzinoPath` (`src/next/nextStructuralPaths.ts:46`).
- prerequisiti: `SUBITO`; sezione whitelist.
- file_da_creare: `src/next/chat-ia/tools/registry/toolOpenMagazzinoSection.ts`.
- categoria_audit: J.
- example_prompts: "apri inventario"; "vai a materiali consegnati"; "mostra documenti costi magazzino".

## CATEGORIA K - ARCHIVIO

### TOOL: list_archived_reports

- nome: `list_archived_reports`
- categoria: `archivio`
- description_per_openai: "Elenca i report chat IA archiviati. Usa quando l'utente chiede storico report o report salvati."
- parameters:
```json
{"type":"object","properties":{"sector":{"type":"string"},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type ListArchivedReportsOutput = ChatIaArchiveEntry[];
```
- implementation: `listChatIaReportArchiveEntries` (`src/next/chat-ia/reports/chatIaReportArchive.ts:94`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolListArchivedReports.ts`.
- categoria_audit: K.
- example_prompts: "lista report salvati"; "archivio chat IA"; "ultimi report flotta".

### TOOL: retrieve_archived_report

- nome: `retrieve_archived_report`
- categoria: `archivio`
- description_per_openai: "Recupera metadati e link di un report chat IA archiviato. Usa quando l'utente chiede un report salvato specifico."
- parameters:
```json
{"type":"object","properties":{"id":{"type":"string"}},"required":["id"],"additionalProperties":false}
```
- output_shape:
```ts
type RetrieveArchivedReportOutput = ChatIaArchiveEntry | null;
```
- implementation: `readChatIaReportArchiveEntry` (`src/next/chat-ia/reports/chatIaReportArchive.ts:110`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolRetrieveArchivedReport.ts`.
- categoria_audit: K.
- example_prompts: "apri report archiviato 123"; "recupera report flotta"; "mostra report salvato".

### TOOL: delete_archived_report

- nome: `delete_archived_report`
- categoria: `archivio`
- description_per_openai: "Segna eliminato un report chat IA archiviato, senza toccare dati business. Usa solo se Giuseppe conferma che l'eliminazione archivio puo essere esposta come tool."
- parameters:
```json
{"type":"object","properties":{"id":{"type":"string"}},"required":["id"],"additionalProperties":false}
```
- output_shape:
```ts
type DeleteArchivedReportOutput = { deleted: true; id: string };
```
- implementation: `markChatIaReportArchiveEntryDeleted` (`src/next/chat-ia/reports/chatIaReportArchive.ts:117`).
- prerequisiti: `SUBITO_CON_DECISIONE`; confermare se esporre eliminazione archivio come tool. Non e scrittura business, ma modifica archivio chat.
- file_da_creare: `src/next/chat-ia/tools/registry/toolDeleteArchivedReport.ts`.
- categoria_audit: K.
- example_prompts: "elimina report 123"; "rimuovi report archiviato"; "cancella vecchio report chat".

## TOOL CON PREREQUISITI

### ESTENSIONE - 13 tool

1. `get_driver_by_name`: helper fuzzy controllato su nome/cognome.
2. `get_driver_activity`: filtro autista/periodo su snapshot D03.
3. `get_refuelings_aggregated`: helper aggregazione fonte/periodo.
4. `get_consumption_average`: verifica km nei rifornimenti prima di calcolare l/100km.
5. `compare_refueling_sources`: classificazione fonte basata solo su campi esistenti.
6. `get_invoice_by_id`: ricerca id su snapshot multipli.
7. `get_historical_operational_events`: filtro D10 per testo/targa/periodo.
8. `get_cost_aggregates`: helper aggregazione costi.
9. `compute_average`: helper generico su campi numerici espliciti.
10. `compare_periods`: helper periodo comune.
11. `find_outliers`: metodo deterministicamente spiegabile.
12. `generate_chart`: wrapper React chart basato su Recharts.
13. `open_vehicle_edit_modal`: route-state o query param per apertura modal.

### NUOVO_READER - 2 tool

1. `search_events`: serve reader flotta-wide o composizione esplicita D10/autisti/segnalazioni con normalizzazione testuale.
2. `get_cisterna_levels`: serve campo livello/giacenza verificato; oggi non dimostrato nel reader Cisterna.

### DECISIONI DA NON NASCONDERE

- `delete_archived_report`: tecnicamente fattibile, ma da esporre a OpenAI solo dopo conferma utente, perche modifica l'archivio chat IA.
- `get_cisterna_levels`: non deve promettere livelli reali finche il campo non e dimostrato.
- `search_events`: deve essere testuale e spiegabile, non semantico opaco.

## ORDINE DI IMPLEMENTAZIONE RACCOMANDATO

### Priorita 1 - Tool fattibili subito (25)

1. `get_vehicle_by_plate` - gia implementato.
2. `list_vehicles`.
3. `get_vehicle_status`.
4. `get_vehicle_maintenance_history`.
5. `get_vehicle_dossier_snapshot`.
6. `list_drivers`.
7. `get_driver_by_badge`.
8. `get_refuelings`.
9. `get_vehicle_documents`.
10. `get_document_costs_by_vehicle`.
11. `download_document_pdf`.
12. `get_vehicle_events`.
13. `get_costs`.
14. `get_procurement_costs`.
15. `get_capo_costs_by_vehicle`.
16. `get_cisterna_snapshot`.
17. `get_cisterna_refuelings`.
18. `get_cisterna_documents`.
19. `generate_report_pdf`.
20. `save_report_to_archive`.
21. `open_dossier_page`.
22. `navigate_to`.
23. `open_magazzino_section`.
24. `list_archived_reports`.
25. `retrieve_archived_report`.
26. `delete_archived_report` solo dopo decisione esplicita.

### Priorita 2 - Tool con estensione (13)

1. `get_refuelings_aggregated`.
2. `get_consumption_average`.
3. `compare_refueling_sources`.
4. `get_cost_aggregates`.
5. `compute_average`.
6. `compare_periods`.
7. `find_outliers`.
8. `generate_chart`.
9. `get_driver_by_name`.
10. `get_driver_activity`.
11. `get_invoice_by_id`.
12. `get_historical_operational_events`.
13. `open_vehicle_edit_modal`.

### Priorita 3 - Tool con nuovo reader (2)

1. `search_events`.
2. `get_cisterna_levels`.

## DEFINITION OF DONE PER OGNI TOOL

- Il file tool esiste in `src/next/chat-ia/tools/registry/`.
- Il tool esporta un `ChatIaToolHandler`.
- `descriptionForOpenAi` e in italiano, chiara, lunga 1-3 frasi.
- `parameters` e JSON Schema valido con `additionalProperties: false`.
- L'handler valida input obbligatori.
- L'handler chiama solo reader/funzioni indicati in questo documento o helper locali documentati.
- Nessuna scrittura business.
- Output JSON serializzabile.
- `outputKindHint` coerente col rendering atteso.
- Il tool e registrato in `src/next/chat-ia/tools/index.ts`.
- Il tool e provato in browser con almeno un prompt di esempio.
- Se il tool ha prerequisiti, questi sono risolti prima della registrazione operativa.

## CONTEGGIO TOOL

| Categoria | Nome | Tool |
| --- | --- | ---: |
| A | Lettura mezzi | 5 |
| B | Lettura autisti | 4 |
| C | Lettura rifornimenti | 4 |
| D | Lettura documenti | 4 |
| E | Segnalazioni e controlli | 3 |
| F | Costi | 4 |
| G | Cisterna | 4 |
| H | Calcoli e aggregati | 3 |
| I | Generatori | 3 |
| J | Azioni UI | 4 |
| K | Archivio | 3 |
| Totale |  | 41 |

| Stato | Totale |
| --- | ---: |
| SUBITO | 26 |
| ESTENSIONE | 13 |
| NUOVO_READER | 2 |

## APPENDICE: FILE LETTI

- `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md`
- `docs/product/SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md`
- `src/next/chat-ia/tools/chatIaToolTypes.ts`
- `src/next/chat-ia/tools/chatIaToolRegistry.ts`
- `src/next/chat-ia/tools/chatIaToolExecutor.ts`
- `src/next/chat-ia/tools/registry/toolGetVehicleByPlate.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/nextOperativitaTecnicaDomain.ts`
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
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziTypes.ts`
- `src/next/chat-ia/reports/chatIaReportPdf.ts`
- `src/next/chat-ia/reports/chatIaReportArchive.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/next/nextStructuralPaths.ts`
- `src/next/components/NextMezzoEditModal.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/App.tsx`
- `package.json`
