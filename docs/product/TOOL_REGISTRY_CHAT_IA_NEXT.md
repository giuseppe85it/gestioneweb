# TOOL REGISTRY CHAT IA NEXT

Versione: 2026-04-29  
Autore: Codex  
Stato: fonte operativa per implementazione tool chat IA NEXT  
Ambito: tool registry OpenAI function calling per `/next/chat-tool`

## INTRODUZIONE

Questo documento traduce l'audit `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md` e l'audit gap `docs/audit/AUDIT_GAP_COPERTURA_TOOL_2026-04-28.md` in una specifica implementativa completa per i tool della chat IA NEXT.

Aggiornamento Round 2:

- Totale registry: 65 tool = 41 tool gia specificati + 24 tool nuovi emersi dall'audit gap.
- Stato implementazione: 37 implementati nel codice reale, 4 BLOCCATO originali, 21 nuovi da implementare, 3 BLOCCATO GAP-D.
- I 24 tool Round 2 derivano da `docs/audit/AUDIT_GAP_COPERTURA_TOOL_2026-04-28.md`, sezioni 11-14.
- Le 6 estensioni reader prerequisito Round 2 sono documentate in sezione dedicata e non vanno confuse con tool gia operativi.
- Archivista interno fuori perimetro: questo registry non analizza ne estende il sottosistema archivista.

Riferimenti:

- Audit tool candidati: `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md:316-689`.
- Audit gap copertura tool: `docs/audit/AUDIT_GAP_COPERTURA_TOOL_2026-04-28.md:420-534`.
- Architettura tool use: `docs/product/SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md:184-221`.
- Tipi tool runtime: `src/next/chat-ia/tools/chatIaToolTypes.ts:24-42`.
- Primo tool gia implementato: `src/next/chat-ia/tools/registry/toolGetVehicleByPlate.ts:12`.

Bloccati originali nel set da 41:

- BLOCCATO originale: `search_events` richiede reader flotta-wide dedicato.
- BLOCCATO originale: `get_cisterna_levels` richiede campo livello/giacenza verificato.
- BLOCCATO originale: `generate_chart` richiede wrapper UI chart.
- BLOCCATO originale: `open_vehicle_edit_modal` richiede route-state/query param per apertura modal.

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

## TOOL NUOVI ROUND 2 (audit gap)

Fonte: `docs/audit/AUDIT_GAP_COPERTURA_TOOL_2026-04-28.md`, sezioni 11, 12, 13, 14.

I tool Round 2 sono aggiuntivi rispetto ai 41 tool gia specificati. Non riscrivono le specifiche precedenti.

### Tool nuovi ALTA priorita

### TOOL: search_vehicles_by_attribute

- nome: `search_vehicles_by_attribute`
- categoria: `lettura_mezzi`
- description_per_openai: "Cerca mezzi per attributi diversi dalla targa, inclusi telaio, marca, modello, autista e campi libretto raw quando disponibili. Usa quando l'utente scrive un numero di telaio o chiede di trovare il mezzo da un dato anagrafico."
- parameters:
```json
{"type":"object","properties":{"query":{"type":"string"},"field":{"type":"string","enum":["auto","targa","telaio","marca","modello","autista","libretto_raw"]},"includeRawLibretto":{"type":"boolean"}},"required":["query"],"additionalProperties":false}
```
- output_shape:
```ts
type SearchVehiclesByAttributeOutput = { query: string; field: string; matches: Array<{ mezzo: NextAnagraficheFlottaMezzoItem; matchedFields: string[]; score: number }>; total: number };
```
- implementation: `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`), campo `telaio` in `NextAnagraficheFlottaMezzoItem` (`src/next/nextAnagraficheFlottaDomain.ts:79`, `src/next/nextAnagraficheFlottaDomain.ts:88`); campi raw libretto dopo ESTENSIONE 1.
- prerequisiti: `SUBITO` per targa/telaio/marca/modello/autista; `ESTENSIONE READER 1` per `libretto_raw`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolSearchVehiclesByAttribute.ts`
- categoria_audit: A1
- priorita: ALTA
- example_prompts: "trova il mezzo con telaio X123"; "a quale targa corrisponde questo numero di telaio?"; "cerca mezzo guidato da Rossi".

### TOOL: list_vehicles_without_driver

- nome: `list_vehicles_without_driver`
- categoria: `lettura_mezzi`
- description_per_openai: "Elenca i mezzi senza autista assegnato. Usa quando l'utente chiede mezzi liberi, mezzi senza autista o assegnazioni mancanti."
- parameters:
```json
{"type":"object","properties":{"categoria":{"type":"string"},"includeQualityFlags":{"type":"boolean"}},"additionalProperties":false}
```
- output_shape:
```ts
type ListVehiclesWithoutDriverOutput = { items: NextAnagraficheFlottaMezzoItem[]; total: number; appliedFilters: { categoria?: string } };
```
- implementation: `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`), campi `autistaNome` e quality flags (`src/next/nextAnagraficheFlottaDomain.ts:110`, `src/next/nextAnagraficheFlottaDomain.ts:493`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolListVehiclesWithoutDriver.ts`
- categoria_audit: A2
- priorita: ALTA
- example_prompts: "mezzi senza autista"; "quali mezzi non hanno assegnazione?"; "lista camion senza autista".

### TOOL: get_site_equipment

- nome: `get_site_equipment`
- categoria: `lettura_attrezzature_cantieri`
- description_per_openai: "Recupera attrezzature e movimenti assegnati a un cantiere. Usa quando l'utente chiede cosa c'e in un cantiere, cosa e stato consegnato, spostato o ritirato."
- parameters:
```json
{"type":"object","properties":{"cantiere":{"type":"string"},"tipo":{"type":"string","enum":["consegna","spostamento","ritiro","tutti"]},"categoria":{"type":"string"},"soloAttuali":{"type":"boolean"}},"required":["cantiere"],"additionalProperties":false}
```
- output_shape:
```ts
type GetSiteEquipmentOutput = { cantiere: string; statoAttuale: unknown[]; movimenti: NextAttrezzaturaMovimentoReadOnlyItem[]; total: number; limitations: string[] };
```
- implementation: `readNextAttrezzatureCantieriSnapshot` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:509`), tipo `NextAttrezzaturaMovimentoReadOnlyItem` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:35`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetSiteEquipment.ts`
- categoria_audit: A3
- priorita: ALTA
- example_prompts: "attrezzature al cantiere Via Roma"; "cosa e assegnato al cantiere X?"; "movimenti attrezzature per Caravate".

### TOOL: list_inventory

- nome: `list_inventory`
- categoria: `lettura_magazzino`
- description_per_openai: "Interroga l'inventario magazzino per testo, fornitore o stato stock. Usa quando l'utente chiede disponibilita, quantita o materiale presente in magazzino."
- parameters:
```json
{"type":"object","properties":{"testo":{"type":"string"},"fornitore":{"type":"string"},"stockStatus":{"type":"string","enum":["ok","basso","zero","tutti"]},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type ListInventoryOutput = { items: NextInventarioReadOnlyItem[]; total: number; appliedFilters: Record<string, unknown> };
```
- implementation: `readNextInventarioSnapshot` (`src/next/domain/nextInventarioDomain.ts:235`), tipo `NextInventarioReadOnlyItem` (`src/next/domain/nextInventarioDomain.ts:29`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolListInventory.ts`
- categoria_audit: A5
- priorita: ALTA
- example_prompts: "abbiamo cemento in magazzino?"; "inventario sotto scorta"; "quante fascette ci sono?".

### TOOL: get_material_movements

- nome: `get_material_movements`
- categoria: `lettura_magazzino`
- description_per_openai: "Recupera movimenti e consegne materiali per targa, destinatario, materiale o periodo. Usa quando l'utente chiede dove e stato consegnato un materiale o quali materiali ha ricevuto un mezzo."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"destinatario":{"type":"string"},"materiale":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetMaterialMovementsOutput = { items: NextMaterialeMovimentoReadOnlyItem[]; total: number; appliedFilters: Record<string, unknown> };
```
- implementation: `readNextMaterialiMovimentiSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1125`), tipo `NextMaterialeMovimentoReadOnlyItem` (`src/next/domain/nextMaterialiMovimentiDomain.ts:117`), snapshot magazzino reale `readNextMagazzinoRealeSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1630`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetMaterialMovements.ts`
- categoria_audit: A6
- priorita: ALTA
- example_prompts: "materiali consegnati a TI282780"; "che materiali ha preso Rossi?"; "movimenti cemento aprile".

### TOOL: search_documents_and_invoices

- nome: `search_documents_and_invoices`
- categoria: `lettura_documenti`
- description_per_openai: "Cerca documenti, fatture e costi per numero, fornitore, targa, importo, tipo o periodo. Usa quando l'utente identifica una fattura senza conoscere il mezzo o l'id."
- parameters:
```json
{"type":"object","properties":{"numero":{"type":"string"},"fornitore":{"type":"string"},"targa":{"type":"string"},"tipo":{"type":"string"},"importo":{"type":"number"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type SearchDocumentsAndInvoicesOutput = { items: Array<NextIADocumentiArchiveItem | NextDocumentiCostiReadOnlyItem>; total: number; sources: string[]; warnings: string[] };
```
- implementation: `readNextIADocumentiArchiveSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2010`), `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
- prerequisiti: `SUBITO`; la normalizzazione match per numero/importo deve restare deterministica.
- file_da_creare: `src/next/chat-ia/tools/registry/toolSearchDocumentsAndInvoices.ts`
- categoria_audit: A11
- priorita: ALTA
- example_prompts: "trova fattura 1234"; "fatture Rossi aprile 2026"; "documenti da 450 franchi".

### TOOL: search_operational_events

- nome: `search_operational_events`
- categoria: `lettura_eventi_operativi`
- description_per_openai: "Cerca eventi operativi, sessioni, segnalazioni, controlli e richieste per targa, autista, tipo, periodo o testo. Usa quando l'utente chiede anomalie o eventi operativi su flotta e autisti."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"autista":{"type":"string"},"badge":{"type":"string"},"tipo":{"type":"string"},"testo":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type SearchOperationalEventsOutput = { items: unknown[]; total: number; sources: string[]; appliedFilters: Record<string, unknown> };
```
- implementation: `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`), `readNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1627`).
- prerequisiti: `SUBITO`; sostituisce il gap di ricerca globale senza usare matching semantico opaco.
- file_da_creare: `src/next/chat-ia/tools/registry/toolSearchOperationalEvents.ts`
- categoria_audit: A12
- priorita: ALTA
- example_prompts: "segnalazioni su TI282780"; "eventi di Rossi questa settimana"; "controlli con esito KO".

### TOOL: search_work_orders

- nome: `search_work_orders`
- categoria: `lettura_lavori`
- description_per_openai: "Cerca lavori aperti, in attesa o eseguiti per targa, stato, urgenza o testo. Usa quando l'utente chiede lavori da fare, lavori chiusi o interventi pendenti."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"stato":{"type":"string","enum":["da_eseguire","in_attesa","eseguito","tutti"]},"urgenza":{"type":"string","enum":["bassa","media","alta"]},"testo":{"type":"string"},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type SearchWorkOrdersOutput = { items: NextLavoroReadOnlyItem[]; total: number; groups?: unknown[]; appliedFilters: Record<string, unknown> };
```
- implementation: `readNextLavoriInAttesaSnapshot` (`src/next/domain/nextLavoriDomain.ts:934`), `readNextLavoriEseguitiSnapshot` (`src/next/domain/nextLavoriDomain.ts:940`), `readNextLavoriLegacyDataset` (`src/next/domain/nextLavoriDomain.ts:1147`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolSearchWorkOrders.ts`
- categoria_audit: A13
- priorita: ALTA
- example_prompts: "lavori aperti su TI282780"; "lavori urgenti"; "lavori eseguiti ieri".

### TOOL: list_scheduled_maintenance_due

- nome: `list_scheduled_maintenance_due`
- categoria: `lettura_manutenzioni`
- description_per_openai: "Elenca i mezzi con manutenzione programmata scaduta, in scadenza o valida, calcolando i giorni residui. Usa quando l'utente chiede manutenzioni programmate della flotta."
- parameters:
```json
{"type":"object","properties":{"entroGiorni":{"type":"number"},"status":{"type":"string","enum":["scaduta","in_scadenza","valida","senza_data","tutti"]},"categoria":{"type":"string"},"includeHistory":{"type":"boolean"}},"additionalProperties":false}
```
- output_shape:
```ts
type ListScheduledMaintenanceDueOutput = { items: Array<{ targa: string; categoria: string; manutenzioneDataFine: string | null; daysToDeadline: number | null; status: string; mezzo: NextAnagraficheFlottaMezzoItem }>; total: number };
```
- implementation: `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`), campi manutenzione (`src/next/nextAnagraficheFlottaDomain.ts:104`, `src/next/nextAnagraficheFlottaDomain.ts:105`), storico opzionale `readNextMezzoManutenzioniSnapshot` (`src/next/domain/nextManutenzioniDomain.ts:663`).
- prerequisiti: `SUBITO`; helper data/status locale.
- file_da_creare: `src/next/chat-ia/tools/registry/toolListScheduledMaintenanceDue.ts`
- categoria_audit: C1
- priorita: ALTA
- example_prompts: "mezzi con manutenzione in scadenza"; "manutenzioni programmate scadute"; "cosa scade nei prossimi 30 giorni?".

### TOOL: get_vehicle_cost_summary

- nome: `get_vehicle_cost_summary`
- categoria: `lettura_costi`
- description_per_openai: "Calcola un riepilogo costi robusto per mezzo e periodo, con subtotali e fonti. Usa quando l'utente chiede costi totali annuali o per categoria di una targa."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false},"includeProcurement":{"type":"boolean"},"groupBy":{"type":"string","enum":["categoria","mese","fornitore","nessuno"]}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetVehicleCostSummaryOutput = { targa: string; periodo?: { from?: string; to?: string }; totale: number; valuta?: string; subtotali: Array<{ key: string; totale: number; count: number }>; sources: string[]; warnings: string[] };
```
- implementation: `readNextMezzoDocumentiCostiSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2313`), `readNextMezzoDocumentiCostiPeriodView` (`src/next/domain/nextDocumentiCostiDomain.ts:2391`), procurement opzionale `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`).
- prerequisiti: `SUBITO`; dedup e conversioni valuta devono essere dichiarati nel risultato.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetVehicleCostSummary.ts`
- categoria_audit: C2
- priorita: ALTA
- example_prompts: "costi totali TI282780 nel 2026"; "spese manutenzione TI282780"; "quanto e costato TI282780 quest'anno?".

### Tool nuovi MEDIA priorita

### TOOL: list_suppliers

- nome: `list_suppliers`
- categoria: `lettura_anagrafiche`
- description_per_openai: "Elenca o cerca fornitori, con collegamento ai dati procurement quando richiesto. Usa quando l'utente chiede profilo, telefono o fornitore collegato ad acquisti."
- parameters:
```json
{"type":"object","properties":{"testo":{"type":"string"},"id":{"type":"string"},"conAcquisti":{"type":"boolean"},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type ListSuppliersOutput = { items: NextFornitoreReadOnlyItem[]; total: number; procurementMatches?: unknown[] };
```
- implementation: `readNextFornitoriSnapshot` (`src/next/domain/nextFornitoriDomain.ts:204`), tipo `NextFornitoreReadOnlyItem` (`src/next/domain/nextFornitoriDomain.ts:29`), procurement opzionale `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolListSuppliers.ts`
- categoria_audit: A4
- priorita: MEDIA
- example_prompts: "lista fornitori"; "telefono fornitore Rossi"; "fornitori con preventivi".

### TOOL: get_adblue_tank_events

- nome: `get_adblue_tank_events`
- categoria: `lettura_magazzino`
- description_per_openai: "Recupera eventi e stock AdBlue disponibili nel magazzino NEXT. Usa quando l'utente chiede situazione AdBlue, carichi o movimenti cisterna AdBlue."
- parameters:
```json
{"type":"object","properties":{"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false},"impianto":{"type":"string"},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetAdBlueTankEventsOutput = { snapshot: NextMagazzinoAdBlueSnapshot; items: unknown[]; total: number; warnings: string[] };
```
- implementation: `readNextMagazzinoAdBlueSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1582`), dataset `@cisterne_adblue` (`src/next/domain/nextMaterialiMovimentiDomain.ts:27`).
- prerequisiti: `SUBITO`; `ESTENSIONE READER 5` solo se si vuole alias dedicato `readNextAdBlueSnapshot`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetAdBlueTankEvents.ts`
- categoria_audit: A7
- priorita: MEDIA
- example_prompts: "stato AdBlue"; "carichi AdBlue aprile"; "eventi cisterna AdBlue".

### TOOL: get_euromecc_snapshot

- nome: `get_euromecc_snapshot`
- categoria: `lettura_euromecc`
- description_per_openai: "Recupera task, completati e problemi Euromecc. Usa quando l'utente chiede attivita aperte, issue o storico Euromecc."
- parameters:
```json
{"type":"object","properties":{"area":{"type":"string"},"state":{"type":"string","enum":["pending","done","issue","all"]},"priority":{"type":"string"},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetEuromeccSnapshotOutput = { snapshot: EuromeccSnapshot; items: unknown[]; total: number; limitations: string[] };
```
- implementation: `readEuromeccSnapshot` (`src/next/domain/nextEuromeccDomain.ts:394`), collections `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta` (`src/next/domain/nextEuromeccDomain.ts:20`, `src/next/domain/nextEuromeccDomain.ts:23`).
- prerequisiti: `SUBITO` per snapshot base; estensione futura per `euromecc_relazioni` e `euromecc_extra_components`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetEuromeccSnapshot.ts`
- categoria_audit: A8
- priorita: MEDIA
- example_prompts: "task Euromecc aperti"; "problemi Euromecc area X"; "storico Euromecc completati".

### TOOL: list_workshops

- nome: `list_workshops`
- categoria: `lettura_anagrafiche`
- description_per_openai: "Elenca o cerca officine registrate in NEXT. Usa quando l'utente chiede officine, telefoni officina o anagrafiche officine."
- parameters:
```json
{"type":"object","properties":{"testo":{"type":"string"},"citta":{"type":"string"},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type ListWorkshopsOutput = { items: NextOfficinaReadOnlyItem[]; total: number; appliedFilters: Record<string, unknown> };
```
- implementation: `readNextOfficineSnapshot` (`src/next/domain/nextOfficineDomain.ts:204`), tipo `NextOfficinaReadOnlyItem` (`src/next/domain/nextOfficineDomain.ts:29`), datasource `@officine` (`src/next/domain/nextOfficineDomain.ts:9`).
- prerequisiti: `SUBITO`.
- file_da_creare: `src/next/chat-ia/tools/registry/toolListWorkshops.ts`
- categoria_audit: A9
- priorita: MEDIA
- example_prompts: "lista officine"; "telefono officina di Bellinzona"; "cerca officina Rossi".

### TOOL: get_saved_economic_analysis

- nome: `get_saved_economic_analysis`
- categoria: `lettura_costi`
- description_per_openai: "Recupera analisi economiche IA salvate per una targa. Usa quando l'utente chiede l'ultima analisi economica salvata o confronti con costi documentali."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetSavedEconomicAnalysisOutput = { targa: string; savedAnalysis: unknown | null; sourceCollection: "@analisi_economica_mezzi"; warnings: string[] };
```
- implementation: supporto analisi in `readNextDossierMezzoCompositeSnapshot` (`src/next/domain/nextDossierMezzoDomain.ts:747`), collection `@analisi_economica_mezzi` (`src/next/domain/nextDossierMezzoDomain.ts:50`), lettura documento (`src/next/domain/nextDossierMezzoDomain.ts:507`).
- prerequisiti: `SUBITO` per targa; `ESTENSIONE READER 3` per indice fleet-wide dedicato.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetSavedEconomicAnalysis.ts`
- categoria_audit: A10
- priorita: MEDIA
- example_prompts: "analisi economica salvata TI282780"; "ultima analisi IA del mezzo"; "recupera analisi economica".

### TOOL: get_procurement_materials_by_destination

- nome: `get_procurement_materials_by_destination`
- categoria: `lettura_procurement`
- description_per_openai: "Cerca materiali da ordinare o ordinati per destinazione, targa, stato o fornitore. Usa quando l'utente chiede materiali in attesa per un mezzo o una destinazione."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"destinazione":{"type":"string"},"stato":{"type":"string","enum":["in_attesa","arrivato","tutti"]},"fornitore":{"type":"string"},"limit":{"type":"number"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetProcurementMaterialsByDestinationOutput = { items: unknown[]; total: number; unresolvedDestinationRows: number; warnings: string[] };
```
- implementation: `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`), scritture ordine/foto in `NextMaterialiDaOrdinarePage.tsx` (`src/next/NextMaterialiDaOrdinarePage.tsx:1140`, `src/next/NextMaterialiDaOrdinarePage.tsx:1164`).
- prerequisiti: `ESTENSIONE READER 2`; senza relazione targa/destinazione normalizzata il tool deve restituire `DA VERIFICARE` sulle righe ambigue.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetProcurementMaterialsByDestination.ts`
- categoria_audit: C3
- priorita: MEDIA
- example_prompts: "materiali da ordinare per TI282780"; "cosa manca per il mezzo X?"; "ordini in attesa per cantiere Y".

### TOOL: reconcile_cisterna_month

- nome: `reconcile_cisterna_month`
- categoria: `lettura_cisterna`
- description_per_openai: "Riconcilia un mese Cisterna tra documenti, schede, supporto autisti e parametri mensili. Usa quando l'utente chiede differenze, duplicati o spiegazione del report Cisterna."
- parameters:
```json
{"type":"object","properties":{"monthKey":{"type":"string"},"includeRows":{"type":"boolean"},"focus":{"type":"string","enum":["duplicati","litri","costi","aziende","tutti"]}},"required":["monthKey"],"additionalProperties":false}
```
- output_shape:
```ts
type ReconcileCisternaMonthOutput = { monthKey: string; snapshot: NextCisternaSnapshot; reconciliation: { differences: unknown[]; duplicateGroups: unknown[]; notes: string[] } };
```
- implementation: `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`), dettaglio scheda `readNextCisternaSchedaDetail` (`src/next/domain/nextCisternaDomain.ts:842`).
- prerequisiti: `SUBITO`; e' tool composito sopra reader Cisterna esistente.
- file_da_creare: `src/next/chat-ia/tools/registry/toolReconcileCisternaMonth.ts`
- categoria_audit: C4
- priorita: MEDIA
- example_prompts: "riconcilia cisterna aprile 2026"; "spiegami differenze litri cisterna"; "duplicati bollettini aprile".

### TOOL: get_vehicle_timeline_360

- nome: `get_vehicle_timeline_360`
- categoria: `lettura_mezzi`
- description_per_openai: "Costruisce una timeline 360 del mezzo usando dossier, lavori, manutenzioni, rifornimenti, documenti e segnali operativi. Usa quando l'utente chiede storia completa di una targa."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false},"includeDocuments":{"type":"boolean"},"includeOperationalEvents":{"type":"boolean"}},"required":["targa"],"additionalProperties":false}
```
- output_shape:
```ts
type GetVehicleTimeline360Output = { targa: string; timeline: Array<{ timestamp: number | null; dateLabel: string | null; type: string; title: string; source: string; raw: unknown }>; sources: string[]; warnings: string[] };
```
- implementation: `readNextDossierMezzoCompositeSnapshot` (`src/next/domain/nextDossierMezzoDomain.ts:747`), lavori dossier `readNextMezzoLavoriSnapshot` (`src/next/domain/nextLavoriDomain.ts:1066`), rifornimenti `readNextMezzoRifornimentiSnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1304`).
- prerequisiti: `SUBITO`; ordinamento cronologico e sorgenti esplicite.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetVehicleTimeline360.ts`
- categoria_audit: C6
- priorita: MEDIA
- example_prompts: "timeline completa TI282780"; "storia del mezzo TI282780"; "cosa e successo a TI282780 nel 2026?".

### TOOL: get_driver_operational_profile

- nome: `get_driver_operational_profile`
- categoria: `lettura_autisti`
- description_per_openai: "Crea un profilo operativo autista unendo anagrafica, sessioni, eventi, segnalazioni, controlli e mezzi collegati. Usa quando l'utente chiede quadro completo di un autista."
- parameters:
```json
{"type":"object","properties":{"nome":{"type":"string"},"badge":{"type":"string"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"additionalProperties":false}
```
- output_shape:
```ts
type GetDriverOperationalProfileOutput = { driver: NextCollegaReadOnlyItem | null; activities: unknown[]; vehicles: string[]; warnings: string[] };
```
- implementation: `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`), `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`), stato operativo `readNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1627`).
- prerequisiti: `SUBITO`; match per nome/badge deve essere spiegabile.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetDriverOperationalProfile.ts`
- categoria_audit: C7
- priorita: MEDIA
- example_prompts: "profilo operativo Rossi"; "attivita completa badge 123"; "mezzi usati da Mario Rossi".

### Tool nuovi BASSA priorita

### TOOL: get_wheel_geometry_config

- nome: `get_wheel_geometry_config`
- categoria: `lettura_gomme`
- description_per_openai: "Recupera configurazioni o override geometria gomme se il dato e disponibile. Usa quando l'utente chiede assetto, geometria o configurazione gomme."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"categoria":{"type":"string"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetWheelGeometryConfigOutput = { items: unknown[]; sourceKey: "@wheelGeom_override_v1"; warnings: string[] };
```
- implementation: datasource reale `@wheelGeom_override_v1` in `src/pages/ModalGomme.tsx:25` e `src/next/autisti/NextModalGomme.tsx:54`.
- prerequisiti: `NUOVO_READER`; creare reader clone-safe prima della registrazione.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetWheelGeometryConfig.ts`
- categoria_audit: A14
- priorita: BASSA
- example_prompts: "configurazione gomme TI282780"; "override geometria gomme"; "assetto gomme per categoria X".

### TOOL: find_invoice_supplier

- nome: `find_invoice_supplier`
- categoria: `lettura_documenti`
- description_per_openai: "Trova il fornitore di una fattura partendo da id, numero documento, targa, importo o periodo. Usa quando l'utente chiede a chi appartiene una fattura specifica."
- parameters:
```json
{"type":"object","properties":{"id":{"type":"string"},"numero":{"type":"string"},"targa":{"type":"string"},"importo":{"type":"number"},"periodo":{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}},"additionalProperties":false}},"additionalProperties":false}
```
- output_shape:
```ts
type FindInvoiceSupplierOutput = { matches: Array<{ supplier: string | null; invoice: unknown; confidence: "id" | "exact" | "partial" | "ambiguous" }>; total: number; warnings: string[] };
```
- implementation: `readNextIADocumentiArchiveSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2010`), `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
- prerequisiti: `SUBITO`; in caso di piu match deve restituire ambiguita invece di scegliere.
- file_da_creare: `src/next/chat-ia/tools/registry/toolFindInvoiceSupplier.ts`
- categoria_audit: C5
- priorita: BASSA
- example_prompts: "fornitore della fattura 123"; "a chi appartiene questa fattura?"; "trova fornitore del documento da 450".

### Tool BLOCCATI (3 GAP-D)

### TOOL: list_driver_license_expirations

- nome: `list_driver_license_expirations`
- categoria: `lettura_autisti`
- description_per_openai: "Elenca autisti con patente in scadenza solo quando il dato patente sara persistito. Oggi il tool e bloccato per assenza campo."
- parameters:
```json
{"type":"object","properties":{"entroGiorni":{"type":"number"},"status":{"type":"string","enum":["scaduta","in_scadenza","valida","tutti"]}},"additionalProperties":false}
```
- output_shape:
```ts
type ListDriverLicenseExpirationsOutput = { blocked: true; reason: "campo patente non esiste nei dati attuali"; requiredFields: string[] };
```
- implementation: BLOCCATO; reader controllato `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`), shape `NextCollegaReadOnlyItem` (`src/next/domain/nextColleghiDomain.ts:36`) senza campo patente.
- prerequisiti: `BLOCCATO`; campo patente non esiste nei dati attuali.
- file_da_creare: `src/next/chat-ia/tools/registry/toolListDriverLicenseExpirations.ts`
- categoria_audit: D1
- priorita: BLOCCATI
- example_prompts: "patenti in scadenza"; "autisti con patente scaduta"; "chi deve rinnovare la patente?".

### TOOL: get_vehicle_engine_number

- nome: `get_vehicle_engine_number`
- categoria: `lettura_mezzi`
- description_per_openai: "Restituisce numero motore solo quando esiste un campo strutturato o raw verificato. Oggi il tool e bloccato per assenza campo strutturato."
- parameters:
```json
{"type":"object","properties":{"targa":{"type":"string"},"query":{"type":"string"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetVehicleEngineNumberOutput = { blocked: true; reason: "campo non strutturato"; checkedReaders: string[] };
```
- implementation: BLOCCATO; shape mezzo controllata in `NextAnagraficheFlottaMezzoItem` (`src/next/nextAnagraficheFlottaDomain.ts:79`), alias raw libretto in `src/next/components/NextMezzoEditModal.tsx:65` non espongono un campo `numeroMotore` strutturato.
- prerequisiti: `BLOCCATO`; campo non strutturato.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetVehicleEngineNumber.ts`
- categoria_audit: D2
- priorita: BLOCCATI
- example_prompts: "numero motore TI282780"; "trova mezzo per numero motore"; "dammi il numero motore del mezzo".

### TOOL: get_cisterna_physical_level

- nome: `get_cisterna_physical_level`
- categoria: `lettura_cisterna`
- description_per_openai: "Restituisce livello fisico o giacenza Cisterna solo quando il dato sara persistito. Oggi il tool e bloccato per dato non persistito."
- parameters:
```json
{"type":"object","properties":{"monthKey":{"type":"string"},"date":{"type":"string"}},"additionalProperties":false}
```
- output_shape:
```ts
type GetCisternaPhysicalLevelOutput = { blocked: true; reason: "dato non persistito"; availableInstead: ["documenti", "schede", "litri_mese", "costi"] };
```
- implementation: BLOCCATO; reader disponibile `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`) espone documenti/schede/litri/costi, non livello fisico persistito nello shape `NextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:168`).
- prerequisiti: `BLOCCATO`; dato non persistito.
- file_da_creare: `src/next/chat-ia/tools/registry/toolGetCisternaPhysicalLevel.ts`
- categoria_audit: D3
- priorita: BLOCCATI
- example_prompts: "livello fisico cisterna"; "quanta giacenza reale resta?"; "quanto gasolio fisico c'e in cisterna?".

## ESTENSIONI READER PREREQUISITO ROUND 2

### ESTENSIONE 1 - Libretto svizzero raw (B1)

- stato: prerequisito per `search_vehicles_by_attribute` quando `field = libretto_raw`.
- reader da estendere: `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`).
- riferimento campi UI gia visibili: `RAW_LIBRETTO_ALIASES` (`src/next/components/NextMezzoEditModal.tsx:65`), uso alias (`src/next/components/NextMezzoEditModal.tsx:183`, `src/next/components/NextMezzoEditModal.tsx:193`).
- campi da esporre in `libretto_raw`: `numeroAvs`, `statoOrigine`, `indirizzo`, `localita`, `genereVeicolo`, `carrozzeria`, `numeroMatricola`, `approvazioneTipo`, `pesoVuoto`, `caricoUtileSella`, `pesoTotale`, `pesoTotaleRimorchio`, `caricoSulLetto`, `pesoRimorchiabile`, `luogoDataRilascio`, `annotazioni`, `annotazioniCantonali`.
- campo raw aggiuntivo visto nel modal: `decisioniAutorita` (`src/next/components/NextMezzoEditModal.tsx:83`); esporlo solo se confermato nel modello dati.
- output: nuovo campo opzionale `libretto_raw?: Record<string, string | null>` nello shape `NextAnagraficheFlottaMezzoItem`.
- tool usatori: `search_vehicles_by_attribute`; possibile uso futuro in `get_vehicle_engine_number` solo dopo dato strutturato.

### ESTENSIONE 2 - Materiali da ordinare per destinazione (B2)

- stato: prerequisito per `get_procurement_materials_by_destination`.
- reader da estendere: `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`).
- cosa serve: relazione normalizzata `targa`, `mezzoTarga` o `destinazione` sulle righe materiale/ordine, senza inferenze deboli.
- datasource reale collegato: `@ordini` aggiornato da `src/next/NextMaterialiDaOrdinarePage.tsx:1140` e salvato a `src/next/NextMaterialiDaOrdinarePage.tsx:1164`.
- output atteso: campo opzionale `destination?: { tipo: "mezzo" | "cantiere" | "altro"; targa?: string; label?: string; quality: "certo" | "da_verificare" }`.
- tool usatori: `get_procurement_materials_by_destination`.

### ESTENSIONE 3 - Analisi economica salvate (B3)

- stato: reader nuovo consigliato, ma datasource reale gia verificato.
- reader nuovo: `readNextAnalisiEconomicaSavedSnapshot`.
- path proposto: `src/next/domain/nextAnalisiEconomicaDomain.ts`.
- datasource: `@analisi_economica_mezzi`, costante reale in `src/next/domain/nextDossierMezzoDomain.ts:50`, lettura per targa in `src/next/domain/nextDossierMezzoDomain.ts:507`.
- cosa serve: indice per targa/periodo delle analisi salvate, separato da documenti/costi base.
- tool usatori: `get_saved_economic_analysis`; supporto a `get_vehicle_cost_summary` come fonte separata, non costo base.

### ESTENSIONE 4 - Alerts state (B4)

- stato: reader nuovo consigliato se serve interrogazione diretta degli alert.
- reader nuovo: `readNextAlertsStateSnapshot`.
- path proposto: `src/next/domain/nextAlertsStateDomain.ts`.
- datasource: `@alerts_state`, costante reale in `src/next/domain/nextCentroControlloDomain.ts:16`.
- reader oggi collegato: `readNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1627`) e `readNextStatoOperativoSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1657`).
- cosa serve: esposizione diretta alert/promemoria con stato, scadenza e relazione a targa/autista.
- tool usatori: `search_operational_events`, `get_driver_operational_profile`, eventuale estensione di `get_vehicle_status`.

### ESTENSIONE 5 - AdBlue cisterne (B5)

- stato: il reader specifico richiesto puo essere alias dedicato; esiste gia un reader reale nel dominio magazzino.
- reader nuovo/alias: `readNextAdBlueSnapshot`.
- path proposto: `src/next/domain/nextAdBlueDomain.ts`.
- reader reale gia presente: `readNextMagazzinoAdBlueSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1582`).
- datasource: `@cisterne_adblue`, costante reale in `src/next/domain/nextMaterialiMovimentiDomain.ts:27`.
- cosa serve: shape piu piccola per la chat IA, con eventi, totali, warnings e dati `DA VERIFICARE` quando litri non affidabili.
- tool usatori: `get_adblue_tank_events`.

### ESTENSIONE 6 - Mappa storico foto/hotspot (B6)

- stato: il path proposto esiste gia nel repo; serve solo decidere se esporlo alla chat IA.
- reader nuovo indicato dal prompt: `readNextMappaStoricoSnapshot`.
- path reale: `src/next/domain/nextMappaStoricoDomain.ts`.
- funzione reale: `readNextMappaStoricoSnapshot` (`src/next/domain/nextMappaStoricoDomain.ts:517`).
- datasource: `@mezzi_foto_viste` e `@mezzi_hotspot_mapping` (`src/next/domain/nextMappaStoricoDomain.ts:15`, `src/next/domain/nextMappaStoricoDomain.ts:16`).
- cosa serve: tool consumer dedicato prima di esporre foto/hotspot in chat.
- tool usatori: nessuno dei 24 tool Round 2 richiesti in questo prompt; prerequisito del GAP B6 per un futuro `get_vehicle_visual_map`.

## MATRICE DI VERIFICA ROUND 2

Questa matrice non aggiunge tool al conteggio. Serve a verificare, durante l'implementazione, che ogni scheda Round 2 resti collegata a un gap e a un reader/datasource reale.

#### `search_vehicles_by_attribute`

- gap: A1.
- reader/datasource reale: `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`).
- prerequisito: `SUBITO` per `telaio`; `ESTENSIONE 1` per `libretto_raw`.
- verifica minima: prompt con numero telaio deve restituire targa e campo matchato.

#### `list_vehicles_without_driver`

- gap: A2.
- reader/datasource reale: `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`).
- prerequisito: `SUBITO`.
- verifica minima: output contiene solo mezzi con `autistaNome` assente o vuoto.

#### `get_site_equipment`

- gap: A3.
- reader/datasource reale: `readNextAttrezzatureCantieriSnapshot` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:509`).
- prerequisito: `SUBITO`.
- verifica minima: filtro cantiere deve restituire stato attuale e movimenti sorgente.

#### `list_inventory`

- gap: A5.
- reader/datasource reale: `readNextInventarioSnapshot` (`src/next/domain/nextInventarioDomain.ts:235`).
- prerequisito: `SUBITO`.
- verifica minima: filtro testo deve riportare descrizione, quantita, unita e fornitore.

#### `get_material_movements`

- gap: A6.
- reader/datasource reale: `readNextMaterialiMovimentiSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1125`).
- prerequisito: `SUBITO`.
- verifica minima: filtro targa o destinatario deve mantenere source e quality.

#### `search_documents_and_invoices`

- gap: A11.
- reader/datasource reale: `readNextIADocumentiArchiveSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2010`) e `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
- prerequisito: `SUBITO`.
- verifica minima: ricerca per numero fattura deve restituire fornitore, data, importo e fonte.

#### `search_operational_events`

- gap: A12.
- reader/datasource reale: `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`) e `readNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1627`).
- prerequisito: `SUBITO`.
- verifica minima: filtro targa/autista/tipo deve indicare dataset origine per ogni riga.

#### `search_work_orders`

- gap: A13.
- reader/datasource reale: `readNextLavoriInAttesaSnapshot` (`src/next/domain/nextLavoriDomain.ts:934`), `readNextLavoriEseguitiSnapshot` (`src/next/domain/nextLavoriDomain.ts:940`).
- prerequisito: `SUBITO`.
- verifica minima: filtro stato deve distinguere `da_eseguire`, `in_attesa`, `eseguito`.

#### `list_scheduled_maintenance_due`

- gap: C1.
- reader/datasource reale: `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`) e `readNextMezzoManutenzioniSnapshot` (`src/next/domain/nextManutenzioniDomain.ts:663`).
- prerequisito: `SUBITO`.
- verifica minima: output contiene `daysToDeadline` e status spiegabile.

#### `get_vehicle_cost_summary`

- gap: C2.
- reader/datasource reale: `readNextMezzoDocumentiCostiSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2313`) e `readNextMezzoDocumentiCostiPeriodView` (`src/next/domain/nextDocumentiCostiDomain.ts:2391`).
- prerequisito: `SUBITO`.
- verifica minima: totale periodo e subtotali devono indicare fonti e dedup.

#### `list_suppliers`

- gap: A4.
- reader/datasource reale: `readNextFornitoriSnapshot` (`src/next/domain/nextFornitoriDomain.ts:204`).
- prerequisito: `SUBITO`.
- verifica minima: filtro testo restituisce record fornitore senza inventare match.

#### `get_adblue_tank_events`

- gap: A7.
- reader/datasource reale: `readNextMagazzinoAdBlueSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1582`).
- prerequisito: `SUBITO`; `ESTENSIONE 5` se si crea alias dedicato.
- verifica minima: output conserva warning quando litri o shape sono parziali.

#### `get_euromecc_snapshot`

- gap: A8.
- reader/datasource reale: `readEuromeccSnapshot` (`src/next/domain/nextEuromeccDomain.ts:394`).
- prerequisito: `SUBITO` per task/issue base.
- verifica minima: filtro stato deve separare pending, done e issue.

#### `list_workshops`

- gap: A9.
- reader/datasource reale: `readNextOfficineSnapshot` (`src/next/domain/nextOfficineDomain.ts:204`).
- prerequisito: `SUBITO`.
- verifica minima: output contiene officina, telefono/citta se presenti e source `@officine`.

#### `get_saved_economic_analysis`

- gap: A10.
- reader/datasource reale: `readNextDossierMezzoCompositeSnapshot` (`src/next/domain/nextDossierMezzoDomain.ts:747`), collection `@analisi_economica_mezzi` (`src/next/domain/nextDossierMezzoDomain.ts:50`).
- prerequisito: `SUBITO` per targa; `ESTENSIONE 3` per indice fleet.
- verifica minima: se non esiste analisi salvata, restituisce null e nota esplicita.

#### `get_procurement_materials_by_destination`

- gap: C3.
- reader/datasource reale: `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`).
- prerequisito: `ESTENSIONE 2`.
- verifica minima: righe senza destinazione normalizzata devono essere marcate `DA VERIFICARE`.

#### `reconcile_cisterna_month`

- gap: C4.
- reader/datasource reale: `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`).
- prerequisito: `SUBITO`.
- verifica minima: output distingue documenti, schede, supporto autisti e duplicati.

#### `get_vehicle_timeline_360`

- gap: C6.
- reader/datasource reale: `readNextDossierMezzoCompositeSnapshot` (`src/next/domain/nextDossierMezzoDomain.ts:747`).
- prerequisito: `SUBITO`.
- verifica minima: ogni evento timeline ha data, tipo e source.

#### `get_driver_operational_profile`

- gap: C7.
- reader/datasource reale: `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`) e `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`).
- prerequisito: `SUBITO`.
- verifica minima: match nome/badge deve dichiarare confidenza o ambiguita.

#### `get_wheel_geometry_config`

- gap: A14.
- reader/datasource reale: `@wheelGeom_override_v1` in `src/pages/ModalGomme.tsx:25`.
- prerequisito: `NUOVO_READER`.
- verifica minima: non registrare il tool finche il reader clone-safe non esiste.

#### `find_invoice_supplier`

- gap: C5.
- reader/datasource reale: `readNextIADocumentiArchiveSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2010`) e `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
- prerequisito: `SUBITO`.
- verifica minima: piu fatture candidate devono restare ambigue, non risolte a forza.

#### `list_driver_license_expirations`

- gap: D1.
- reader/datasource reale controllato: `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`).
- prerequisito: `BLOCCATO`.
- verifica minima: sbloccare solo dopo introduzione campo patente/scadenza patente.

#### `get_vehicle_engine_number`

- gap: D2.
- reader/datasource reale controllato: `NextAnagraficheFlottaMezzoItem` (`src/next/nextAnagraficheFlottaDomain.ts:79`) e alias raw libretto (`src/next/components/NextMezzoEditModal.tsx:65`).
- prerequisito: `BLOCCATO`.
- verifica minima: sbloccare solo dopo campo numero motore strutturato o raw esplicito verificato.

#### `get_cisterna_physical_level`

- gap: D3.
- reader/datasource reale controllato: `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`).
- prerequisito: `BLOCCATO`.
- verifica minima: sbloccare solo dopo persistenza livello/giacenza fisica, distinta dai litri mensili.

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

### Fase 0 - Stato attuale da preservare

1. I 37 tool gia implementati restano invariati.
2. I 4 tool originali BLOCCATO restano in coda finche non vengono risolti i prerequisiti: `search_events`, `get_cisterna_levels`, `generate_chart`, `open_vehicle_edit_modal`.
3. Nessun tool Round 2 va registrato prima che il reader indicato nella sua scheda sia disponibile e testato.

### Fase 1 - Estensioni reader prerequisito Round 2 (6)

1. ESTENSIONE 1 - `libretto_raw` su `readNextAnagraficheFlottaSnapshot`.
2. ESTENSIONE 2 - destinazione/targa su `readNextProcurementSnapshot`.
3. ESTENSIONE 3 - `readNextAnalisiEconomicaSavedSnapshot`.
4. ESTENSIONE 4 - `readNextAlertsStateSnapshot`.
5. ESTENSIONE 5 - `readNextAdBlueSnapshot` o alias su `readNextMagazzinoAdBlueSnapshot`.
6. ESTENSIONE 6 - consumer chat per `readNextMappaStoricoSnapshot`.

### Fase 2 - Tool nuovi ALTA priorita (10)

1. `search_vehicles_by_attribute`.
2. `list_vehicles_without_driver`.
3. `get_site_equipment`.
4. `list_inventory`.
5. `get_material_movements`.
6. `search_documents_and_invoices`.
7. `search_operational_events`.
8. `search_work_orders`.
9. `list_scheduled_maintenance_due`.
10. `get_vehicle_cost_summary`.

### Fase 3 - Tool nuovi MEDIA priorita (9)

1. `list_suppliers`.
2. `get_adblue_tank_events`.
3. `get_euromecc_snapshot`.
4. `list_workshops`.
5. `get_saved_economic_analysis`.
6. `get_procurement_materials_by_destination`.
7. `reconcile_cisterna_month`.
8. `get_vehicle_timeline_360`.
9. `get_driver_operational_profile`.

### Fase 4 - Tool nuovi BASSA priorita attivi (2)

1. `get_wheel_geometry_config`.
2. `find_invoice_supplier`.

### Fase 5 - Tool BLOCCATI in coda (3 GAP-D)

1. `list_driver_license_expirations` - BLOCCATO finche non esiste campo patente.
2. `get_vehicle_engine_number` - BLOCCATO finche non esiste campo numero motore strutturato.
3. `get_cisterna_physical_level` - BLOCCATO finche il livello fisico cisterna non e persistito.

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
| Round 2 | ALTA priorita | 10 |
| Round 2 | MEDIA priorita | 9 |
| Round 2 | BASSA priorita attivi | 2 |
| Round 2 | BLOCCATI GAP-D | 3 |
| Totale |  | 65 |

| Stato registry | Totale |
| --- | ---: |
| Implementati nel codice reale | 37 |
| BLOCCATO originali nel set da 41 | 4 |
| Nuovi Round 2 da implementare | 21 |
| BLOCCATO Round 2 GAP-D | 3 |
| Totale | 65 |

| Prerequisiti Round 2 | Totale |
| --- | ---: |
| Estensioni reader Round 2 | 6 |

## APPENDICE: FILE LETTI

- `docs/audit/AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md`
- `docs/audit/AUDIT_GAP_COPERTURA_TOOL_2026-04-28.md`
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
- `src/next/domain/nextAttrezzatureCantieriDomain.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextFornitoriDomain.ts`
- `src/next/domain/nextOfficineDomain.ts`
- `src/next/domain/nextLavoriDomain.ts`
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/domain/nextMappaStoricoDomain.ts`
- `src/next/NextMaterialiDaOrdinarePage.tsx`
- `src/next/NextMagazzinoPage.tsx`
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
