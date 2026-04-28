# AUDIT CHAT IA NEXT RIFACIMENTO 2026-04-27

Audit profondo della chat IA NEXT esistente, orientato al telaio di rifacimento in `docs/product/MAPPA_IA_CHAT_NEXT.md`.

Perimetro: chat IA NEXT, reader clone-safe pertinenti, backend IA, moduli madre `Mezzo 360`, `Autista 360`, `Centro Controllo`.

Esclusione esplicita: Archivista NEXT non analizzato.

## 0. RIASSUNTO ESECUTIVO

La chat IA NEXT attuale e' tecnicamente ricca ma architetturalmente troppo stratificata per diventare la chat unica richiesta dal telaio. La UI principale vive in `src/next/NextInternalAiPage.tsx` con circa 14.903 righe e almeno quattro punti di rendering messaggio (`src/next/NextInternalAiPage.tsx:9697`, `src/next/NextInternalAiPage.tsx:9974-10005`, `src/next/NextInternalAiPage.tsx:10315-10358`, `src/next/NextInternalAiPage.tsx:10875`). Questo confligge con la decisione "una sola chat, una sola UI".

Il routing attuale passa da `handleChatSubmit` (`src/next/NextInternalAiPage.tsx:7605`) al bridge `runInternalAiChatTurnThroughBackend` (`src/next/NextInternalAiPage.tsx:7638`, `src/next/internal-ai/internalAiChatOrchestratorBridge.ts:149`) e poi all'orchestratore locale `runInternalAiChatTurn` (`src/next/internal-ai/internalAiChatOrchestrator.ts:2025`). Prima dello switch sugli intent, il motore unificato puo' intercettare la richiesta (`src/next/internal-ai/internalAiChatOrchestrator.ts:2035-2039`).

Il motore unificato e' molto ampio: 17 scope dichiarati (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:483-515`) e 45 source descriptor verificati (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:555-600`). E' utile come miniera di tassonomia e mapping sorgenti, ma non come base UI/flow finale: produce testo/report generici, non una chat settoriale semplice.

Lo Step Zero della card mezzo esiste ed e' riutilizzabile: tipi in `src/next/internal-ai/internalAiTypes.ts:731-787`, costruzione dati in `src/next/internal-ai/internalAiChatOrchestrator.ts:1798-1855`, rendering in `src/next/internal-ai/InternalAiMezzoCard.tsx:60`. Oggi pero' la card e' agganciata solo a due delle quattro surface (`src/next/NextInternalAiPage.tsx:10002-10005`, `src/next/NextInternalAiPage.tsx:10355-10358`).

I moduli madre da replicare/superare sono molto piu' completi della chat attuale: `Mezzo360` legge 12 dataset storage piu' 3 collection documentali (`src/pages/Mezzo360.tsx:13-30`, `src/pages/Mezzo360.tsx:293-305`), `Autista360` ha matching badge/nome e storico derivato (`src/pages/Autista360.tsx:413-424`, `src/pages/Autista360.tsx:498-508`), `CentroControllo` ha tab, scoring priorita' e PDF (`src/pages/CentroControllo.tsx:23-28`, `src/pages/CentroControllo.tsx:144-146`, `src/pages/CentroControllo.tsx:845-939`).

Raccomandazione: scenario B. Rifare UI, smistamento e runner per settore, riusando reader clone-safe, tipi/report utili, backend OpenAI controllato e card mezzo Step Zero. Non conviene buttare i reader; non conviene tenere la UI/orchestrazione monolitica.

## 1. TELAIO COSTITUZIONALE

Fonte letta: `docs/product/MAPPA_IA_CHAT_NEXT.md` (89 righe al momento dell'audit).

Sezioni costituzionali rilevate:

1. Obiettivo chat: campo libero che legge Firestore/Storage tramite layer disponibili e restituisce dati strutturati, incroci, report, archivio e PDF.
2. Una sola chat: niente quattro surface, una UI e un comportamento.
3. UI: solo campo libero, niente scorciatoie/menu/filtri precaricati, stato di attesa visivo, risposte strutturate dove serve.
4. Fallback: se non capisce, non improvvisa e non mostra elenco generico; resta nel settore richiesto.
5. Esclusioni: niente storico conversazioni persistente, niente allegati oggi, niente integrazione Archivista.
6. Salvataggio: report puntuali/mensili in archivio interno chat, riapribili ed esportabili PDF.
7. Architettura: codice diviso per settori, niente file monolitici.
8. Restano intatti: madre e sottosistemi fuori perimetro.
9. Si spegne in futuro: Mezzo 360 NEXT, Autista 360 NEXT, Centro Controllo NEXT quando la chat sara' completa.
10. Decisioni: motore unificato limitato alle richieste trasversali; Step Zero card e' test concreto; rifacimento integrale deciso.
11. Glossario: card, settore, motore IA, motore report, OpenAI, archivio chat, Madre/NEXT.
12. Prossimi passi: audit profondo, decisioni, spec settoriali, verifica spec, implementazione settore per settore.

Impatto sull'audit:

- Ogni elemento UI con surface multiple va segnato come debito.
- Ogni prompt che cade su fallback generico va segnato come non conforme.
- Ogni reader clone-safe gia' esistente e' candidato al riuso.
- Ogni blocco monolitico sopra 500 righe e' candidato a estrazione.
- Ogni report/PDF gia' esistente va valutato per archivio chat futuro.

## 2. INVENTARIO IA NEXT ESISTENTE

### 2.1 UI

Route principali:

- `/next/ia/report` monta `NextInternalAiPage` (`src/App.tsx:506-509`).
- `/next/ia/interna` monta `NextInternalAiPage` (`src/App.tsx:522-525`).
- `/next/ia/interna/sessioni`, `/richieste`, `/artifacts`, `/audit` montano la stessa pagina con `sectionId` dedicato (`src/App.tsx:530-557`).
- Path strutturali dichiarati in `src/next/nextStructuralPaths.ts:28-32`.

Pagina principale:

- `src/next/NextInternalAiPage.tsx`, circa 14.903 righe.
- Config sezioni `overview`, `sessions`, `requests`, `artifacts`, `audit` in `src/next/NextInternalAiPage.tsx:925-956`.
- Submit chat in `handleChatSubmit` da `src/next/NextInternalAiPage.tsx:7605`.
- Messaggio creato con `structuredCard` opzionale in `src/next/NextInternalAiPage.tsx:1482-1504`.
- Risposta assistant con `structuredCard: result.structuredCard ?? null` in `src/next/NextInternalAiPage.tsx:7837-7879`.

Punti di rendering messaggio attivi:

1. Home modal: testo puro, `renderChatMessageText(message.text)` in `src/next/NextInternalAiPage.tsx:9697`.
2. Dispatcher panel: card mezzo o testo in `src/next/NextInternalAiPage.tsx:9974-10005`.
3. Primary panel: card mezzo o testo in `src/next/NextInternalAiPage.tsx:10315-10358`.
4. Console standalone: testo puro in `src/next/NextInternalAiPage.tsx:10875`.

Verdetto UI: non conforme al telaio. La base va salvata solo per pezzi specifici: modale report, archivio artifact, PDF preview e rendering card.

CSS:

- `src/next/internal-ai/internal-ai.css`, circa 6.330 righe secondo file list storico e 5.411 righe non vuote nel conteggio PowerShell. E' troppo grande per il rifacimento settoriale.
- `src/next/internal-ai/internalAiMezzoCard.css`, 183 righe, prefisso dedicato alla card Step Zero.

### 2.2 Orchestrazione

Catena attuale:

1. UI raccoglie prompt in `handleChatSubmit` (`src/next/NextInternalAiPage.tsx:7605-7638`).
2. Bridge frontend `runInternalAiChatTurnThroughBackend` (`src/next/internal-ai/internalAiChatOrchestratorBridge.ts:149-236`).
3. Orchestratore locale `runInternalAiChatTurn` (`src/next/internal-ai/internalAiChatOrchestrator.ts:2025-2060`).
4. Eventuale chiamata server `runInternalAiServerControlledChat` (`src/next/internal-ai/internalAiServerChatClient.ts:72-124`).
5. Merge risultato server/local in `mergeServerChatResult` (`src/next/internal-ai/internalAiChatOrchestratorBridge.ts:91-114`).

Parsing intent:

- `parseIntent` normalizza prompt e targa (`src/next/internal-ai/internalAiChatOrchestrator.ts:862-865`).
- Help -> `capabilities` (`src/next/internal-ai/internalAiChatOrchestrator.ts:866-868`).
- Repo/live boundary -> `repo_understanding` (`src/next/internal-ai/internalAiChatOrchestrator.ts:870-876`).
- Unsupported -> `non_supportato` (`src/next/internal-ai/internalAiChatOrchestrator.ts:878-884`).
- Pattern report -> `report_targa` (`src/next/internal-ai/internalAiChatOrchestrator.ts:886-888`).
- Pattern stato/targa -> `stato_operativo_mezzo` (`src/next/internal-ai/internalAiChatOrchestrator.ts:890-892`).
- Default -> `richiesta_generica` (`src/next/internal-ai/internalAiChatOrchestrator.ts:894`).

Problema chiave: il gate del motore unificato viene valutato prima dello switch sugli intent canonici (`src/next/internal-ai/internalAiChatOrchestrator.ts:2035-2039`), quindi il routing reale non coincide sempre con `parseIntent`.

### 2.3 Motori

Motori/frontiere individuati:

- Orchestratore lineare: `src/next/internal-ai/internalAiChatOrchestrator.ts`, circa 2.060 righe. Gestisce intent base, Step Zero, report targa, fallback generico.
- Motore unificato: `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`, circa 7.383 righe. Gestisce scope trasversali, reader multipli, report/testi universali.
- Gateway universale/workbench: resolver/orchestrator/registry in `src/next/internal-ai/internalAiUniversalRequestResolver.ts:278`, `src/next/internal-ai/internalAiUniversalOrchestrator.ts:82`, `src/next/internal-ai/internalAiUniversalRegistry.ts:51`, UI workbench in `src/next/internal-ai/InternalAiUniversalWorkbench.tsx:19`.
- Vehicle capability planner: catalogo e planner mezzo in `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts:6`, `src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts:170-177`, facade in `src/next/internal-ai/internalAiVehicleDossierHookFacade.ts:203`.
- Report facades: `internalAiVehicleReportFacade`, `internalAiDriverReportFacade`, `internalAiCombinedReportFacade`.

Relazioni:

- L'orchestratore locale chiama il motore unificato prima dello switch canonico (`src/next/internal-ai/internalAiChatOrchestrator.ts:2035-2039`).
- Il bridge puo' sostituire testo/references locali con risposta server, salvo risultati del motore unificato che restano locali (`src/next/internal-ai/internalAiChatOrchestratorBridge.ts:91-114`).
- Il planner mezzo cataloga capability mezzo ma non e' il router unico della UI (`src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts:6-269`).

Verdetto: oggi convivono almeno tre cervelli. Per il rifacimento va scelto un solo router settoriale.

### 2.4 Backend

Adapter:

- `backend/internal-ai/server/internal-ai-adapter.js`, circa 3.083 righe.
- Express app in `backend/internal-ai/server/internal-ai-adapter.js:54`.
- Script avvio root: `internal-ai-backend:start` in `package.json:11`.
- Script backend package: `start` in `backend/internal-ai/package.json:8`.
- Porta contrattuale `4310` in `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:36`.
- Client frontend usa `VITE_INTERNAL_AI_BACKEND_URL` o `http://127.0.0.1:4310` in locale (`src/next/internal-ai/internalAiServerChatClient.ts:13-28`).

OpenAI:

- Modello default `gpt-5-mini` se `INTERNAL_AI_OPENAI_MODEL` non e' impostato (`backend/internal-ai/server/internal-ai-adapter.js:378`).
- Provider attivo solo se `OPENAI_API_KEY` esiste (`backend/internal-ai/server/internal-ai-adapter.js:403`).
- Client OpenAI costruito lato server (`backend/internal-ai/server/internal-ai-adapter.js:411-412`).
- Chat controllata usa Responses API (`backend/internal-ai/server/internal-ai-adapter.js:734-760`).
- System prompt: italiano, solo contesto strutturato, niente invenzioni, niente scritture business, niente live-read business (`backend/internal-ai/server/internal-ai-adapter.js:741-750`).

Stato runtime al momento dell'audit:

- Porta 4310 in ascolto su `127.0.0.1:4310`.
- Health endpoint risponde `status=ok`, `endpoint=health`, `providerEnabled=True`, `persistenceMode=server_file_isolated`.
- Variabile `OPENAI_API_KEY` presente nell'ambiente del processo PowerShell.

Endpoint rilevanti per chat/report:

- Health: `GET /internal-ai-backend/health` (`backend/internal-ai/server/internal-ai-adapter.js:1105`).
- Chat: `POST /internal-ai-backend/orchestrator/chat` (`backend/internal-ai/server/internal-ai-adapter.js:2101`).
- Artifact repository: `POST /internal-ai-backend/artifacts/repository` (`backend/internal-ai/server/internal-ai-adapter.js:2236`).
- Artifact preview: `POST /internal-ai-backend/artifacts/preview` (`backend/internal-ai/server/internal-ai-adapter.js:2320`).
- Retrieval read-only seeded: `POST /internal-ai-backend/retrieval/read` (`backend/internal-ai/server/internal-ai-adapter.js:2539`).

### 2.5 Tipi e contratti

Tipi principali:

- `InternalAiChatTurnResult` include `intent`, `status`, `assistantText`, `references`, `report`, `structuredCard` (`src/next/internal-ai/internalAiChatOrchestrator.ts:23-69`).
- `ParsedIntent` include `report_targa`, `stato_operativo_mezzo`, `repo_understanding`, `capabilities`, `non_supportato`, `richiesta_generica` (`src/next/internal-ai/internalAiChatOrchestrator.ts:71-83`).
- Structured card Step Zero: `MezzoDossierStructuredCard` in `src/next/internal-ai/internalAiTypes.ts:784-787`.
- Messaggio UI `InternalAiChatMessage` include `structuredCard` in `src/next/internal-ai/internalAiTypes.ts:789-801`.
- Motore unificato ha `InternalAiUnifiedExecutionResult` senza `structuredCard` (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:241-260`).

Contratti:

- Catalogo contratti IA in `src/next/internal-ai/internalAiContracts.ts:141-237`.
- Contract `chat-orchestrator` e hook mezzo-centrico in `src/next/internal-ai/internalAiContracts.ts:141-154`.
- Report preview mezzo/autista/combinato in `src/next/internal-ai/internalAiContracts.ts:157-178`.
- Artifact/memory repository in `src/next/internal-ai/internalAiContracts.ts:229-237`.

Verdetto contratti: salvabili, ma vanno semplificati attorno a settori e output mode chiari.

### 2.6 Reader clone-safe

Reader usati o pertinenti:

| Dominio | Reader | Fonte verificata | Stato per rifacimento |
|---|---|---|---|
| D01 Flotta | `readNextAnagraficheFlottaSnapshot`, `readNextMezzoByTarga` | `src/next/nextAnagraficheFlottaDomain.ts:763-880` | Salvare |
| D02 Operativita tecnica | `readNextMezzoOperativitaTecnicaSnapshot`, `readNextMezzoLavoriSnapshot` | `src/next/nextOperativitaTecnicaDomain.ts:223-229`, `src/next/domain/nextLavoriDomain.ts:1066` | Salvare |
| D03 Autisti | `readNextAutistiReadOnlySnapshot` | `src/next/domain/nextAutistiDomain.ts:1176-1195` | Salvare, ampliare |
| D04 Rifornimenti | `readNextRifornimentiReadOnlySnapshot`, `readNextMezzoRifornimentiSnapshot` | `src/next/domain/nextRifornimentiDomain.ts:1291-1304` | Salvare |
| D05 Magazzino/materiali | `readNextInventarioSnapshot`, `readNextMaterialiMovimentiSnapshot`, `readNextMagazzinoRealeSnapshot`, `readNextAttrezzatureCantieriSnapshot` | `src/next/domain/nextInventarioDomain.ts:235-239`, `src/next/domain/nextMaterialiMovimentiDomain.ts:1125-1645`, `src/next/domain/nextAttrezzatureCantieriDomain.ts:509-510` | Salvare |
| D06 Procurement | `readNextProcurementSnapshot`, `readNextFornitoriSnapshot` | `src/next/domain/nextProcurementDomain.ts:891-906`, `src/next/domain/nextFornitoriDomain.ts:208` | Salvare |
| D07/D08 Documenti/costi | `readNextIADocumentiArchiveSnapshot`, `readNextDocumentiCostiFleetSnapshot`, `readNextMezzoDocumentiCostiSnapshot` | `src/next/domain/nextDocumentiCostiDomain.ts:1925-2218` | Salvare, isolare dal flusso Archivista |
| D09 Cisterna | `readNextCisternaSnapshot`, `readNextCisternaSchedaDetail` | `src/next/domain/nextCisternaDomain.ts:842-1240` | Salvare |
| D10 Stato operativo | `readNextCentroControlloSnapshot`, `readNextStatoOperativoSnapshot` | `src/next/domain/nextCentroControlloDomain.ts:1627-1657` | Salvare |
| Registry raw | `readNextUnifiedStorageDocument`, `readNextUnifiedCollection`, `readNextUnifiedStoragePrefix`, `readNextUnifiedLocalStorageKey` | `src/next/domain/nextUnifiedReadRegistryDomain.ts:116-272` | Salvare con prudenza |

Domini bloccati o non pienamente attivi nell'orchestratore lineare:

- Messaggio generic V1 dice che gestisce solo "prima verticale mezzo/Home/tecnica" (`src/next/internal-ai/internalAiChatOrchestrator.ts:1653-1668`).
- Capability `stato_operativo_mezzo` dichiara limite D01 + D10 + D02 (`src/next/internal-ai/internalAiChatOrchestrator.ts:1790-1796`).

### 2.7 Step Zero card mezzo

File:

- `src/next/internal-ai/InternalAiMezzoCard.tsx`, circa 298 righe.
- `src/next/internal-ai/internalAiMezzoCard.css`, 183 righe.
- Tipi in `src/next/internal-ai/internalAiTypes.ts:731-787`.
- Import card in UI `src/next/NextInternalAiPage.tsx:191`.

Costruzione dati:

- `buildVehicleOperationalStatusResponse` legge mezzo D01, stato D10 e tecnica D02 (`src/next/internal-ai/internalAiChatOrchestrator.ts:1720-1751`).
- Costruisce `structuredCard` con identita', revisione, alert, focus, lavori, manutenzioni e libretto URL (`src/next/internal-ai/internalAiChatOrchestrator.ts:1798-1855`).

Rendering:

- Dispatcher card-aware in `src/next/NextInternalAiPage.tsx:10002-10005`.
- Primary panel card-aware in `src/next/NextInternalAiPage.tsx:10355-10358`.
- Home modal e standalone restano text-only (`src/next/NextInternalAiPage.tsx:9697`, `src/next/NextInternalAiPage.tsx:10875`).

Verdetto: riutilizzabile. Va estratta come componente settore Mezzi e resa output standard della nuova chat unica.

## 3. MAPPATURA MODULI MADRE DA SOSTITUIRE

### 3.1 Mezzo 360

File: `src/pages/Mezzo360.tsx`, circa 1.186 righe. Route madre: `/mezzo-360/:targa` (`src/App.tsx:709`).

Input:

- Parametro URL `:targa`.
- Matching targa con normalizzazione e fuzzy match a distanza 1 carattere (`src/pages/Mezzo360.tsx:135-148`).

Dati letti:

- Storage keys: `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@manutenzioni`, `@lavori`, `@materialiconsegnati`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`, `@richieste_attrezzature_autisti_tmp` (`src/pages/Mezzo360.tsx:13-24`).
- Collection documentali: `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` (`src/pages/Mezzo360.tsx:26-30`).
- Letture `getItemSync` in parallelo (`src/pages/Mezzo360.tsx:293-305`).
- Letture documenti con `getDocs(collection(db, colName))` (`src/pages/Mezzo360.tsx:231-236`).

Sezioni/logiche:

- `PREVIEW_LIMIT = 5`, `DEBUG_DOCS = true` (`src/pages/Mezzo360.tsx:32-34`).
- Stati separati per manutenzioni, lavori, materiali, documenti, segnalazioni, controlli, rifornimenti (`src/pages/Mezzo360.tsx:209-215`).
- Filtri per targa su manutenzioni/lavori/materiali/documenti/segnalazioni/controlli/rifornimenti/gomme/richieste (`src/pages/Mezzo360.tsx:374-536`).
- Timeline unificata (`src/pages/Mezzo360.tsx:543`).
- Dedup documenti (`src/pages/Mezzo360.tsx:464-482`).

Cosa fa che la chat oggi non sa fare:

- Fuzzy match targa madre-like.
- Timeline completa multi-sorgente.
- Lettura documenti e materiali nello stesso quadro mezzo.
- Preview limitate e sezioni complete per ogni dominio.
- Debug documentale mirato.

### 3.2 Autista 360

File: `src/pages/Autista360.tsx`, circa 1.538 righe. Route madre: `/autista-360` e `/autista-360/:badge` (`src/App.tsx:710-711`).

Input:

- Parametro URL `:badge`.
- Query params (`src/pages/Autista360.tsx:3`, `src/pages/Autista360.tsx:640-641`).
- Filtri tipo evento, periodo, targa (`src/pages/Autista360.tsx:19-29`, `src/pages/Autista360.tsx:662`).

Dati letti:

- `@autisti_sessione_attive`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@richieste_attrezzature_autisti_tmp`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`, `@storico_eventi_operativi` (`src/pages/Autista360.tsx:688-695`).

Logiche:

- `BadgeMatch = EXACT | WEAK` (`src/pages/Autista360.tsx:43`).
- Timeline event shape con targa, badgeMatch e cambio mezzo (`src/pages/Autista360.tsx:45-66`).
- Match badge forte o nome debole (`src/pages/Autista360.tsx:413-424`).
- Derived change history (`src/pages/Autista360.tsx:498-508`).
- Risoluzione targhe da molti campi legacy (`src/pages/Autista360.tsx:205-228`, `src/pages/Autista360.tsx:392-408`).

Cosa fa che la chat oggi non sa fare:

- Vista timeline autista completa.
- Distinzione forte/debole tra badge e nome.
- Storico cambi mezzo derivato.
- Filtri combinati per tipo/periodo/targa.

### 3.3 Centro Controllo

File: `src/pages/CentroControllo.tsx`, circa 1.716 righe. Route madre: `/centro-controllo` (`src/App.tsx:740`).

Tab:

- `manutenzioni`, `rifornimenti`, `segnalazioni`, `controlli`, `richieste` (`src/pages/CentroControllo.tsx:23-28`).

Dati letti:

- `@mezzi_aziendali`, `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp` (`src/pages/CentroControllo.tsx:136-141`).
- Mezzi via `getItemSync` (`src/pages/CentroControllo.tsx:587`).
- Rifornimenti dossier + tmp con Firestore doc (`src/pages/CentroControllo.tsx:639-641`).
- Segnalazioni/controlli/richieste via `getItemSync` (`src/pages/CentroControllo.tsx:672-675`).

Logiche:

- Priorita': `KO_PRIORITY_WINDOW_MS`, `PRIORITY_HIGH_THRESHOLD = 70`, `PRIORITY_MAX_ROWS = 15` (`src/pages/CentroControllo.tsx:144-146`).
- Stato manutenzioni: scaduta, in scadenza, OK (`src/pages/CentroControllo.tsx:382-389`).
- Dedup rifornimenti dossier/tmp (`src/pages/CentroControllo.tsx:475-526`).
- Scoring priorita' da controlli/manutenzioni/segnalazioni/richieste (`src/pages/CentroControllo.tsx:845-939`).
- PDF manutenzioni e rifornimenti via `pdfEngine` (`src/pages/CentroControllo.tsx:14-19`, `src/pages/CentroControllo.tsx:572-580`).

Cosa fa che la chat oggi non sa fare:

- Priorita' globale spiegabile con score.
- Merge rifornimenti con dedup.
- Export PDF madre per manutenzioni/rifornimenti.
- Tab operativi con filtri e sezioni specialistiche.

### 3.4 Tabella di copertura comparativa

| Capability madre | Coperta oggi da chat IA NEXT | Mancanza tecnica | Effort |
|---|---|---|---|
| Stato mezzo D01+D10+D02 | PARZIALE | Card solo 2 surface; niente UI unica | Medio |
| Timeline Mezzo 360 multi-sorgente | NO | Runner settore Mezzi + rendering timeline | Alto |
| Documenti/costi per targa | PARZIALE | Reader esiste, output chat settoriale incompleto | Medio |
| Rifornimenti mezzo e anomalie | PARZIALE | D04 esiste, manca card/report dedicato chat unica | Medio |
| Fuzzy match targa madre | NO | Resolver entita' mezzo da portare nel settore Mezzi | Basso |
| Autista 360 timeline | NO | Runner Autisti + card/table | Alto |
| Match badge EXACT/WEAK | PARZIALE | Reader/lookup esistono, output non madre-like | Medio |
| Derived change history autista | NO | Portare logica madre o normalizzarla in D03 | Medio |
| Centro priorita' score | PARZIALE | D10 esiste, manca output prioritario equivalente | Medio |
| Merge/dedup rifornimenti centro | PARZIALE | D04 deve incorporare logica madre o esporla | Medio |
| PDF manutenzioni/rifornimenti madre | NO | Motore report/PDF chat | Alto |
| Archivio report chat | PARZIALE | Artifact repository esiste, non e' archivio business report per targa/autista | Alto |

## 4. ANALISI MOTORE UNIFICATO

### 4.1 Architettura

Scope: 17 scope verificati in `SCOPE_PATTERNS`: autisti, quadro, criticita, scadenze, lavori, manutenzioni, gomme, rifornimenti, materiali, inventario, ordini, preventivi, fornitori, documenti, costi, cisterna, attenzione_oggi (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:483-515`).

Mapping scope -> source:

- `SCOPE_SOURCE_MAP` collega ogni scope a storage key, collection o storage prefix (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:517-553`).
- I source descriptor reali sono 45, non 42: entries da `storage/@mezzi_aziendali` a `localStorage/@next_clone_autisti:mezzo` (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:555-600`).

Gate:

- `parseUnifiedQuery` estrae targa, output preference, scope, full overview, ranking e primary intent (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:1410-1558`).
- Gate attuale: se c'e' targa senza scope espliciti e senza full overview, non intercetta (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:1561-1568`).
- Se ci sono scope, intercetta (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:1570-1572`).

Dispatcher:

- `runInternalAiUnifiedIntelligenceQuery` smista su drivers, warehouse, procurement, fleet, vehicle, generic registry (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:7353-7383`).

### 4.2 Output

Output prodotto:

- `InternalAiUnifiedExecutionResult` contiene intent, status, assistantText, references, report, ma non structuredCard (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:241-260`).
- Output preference supporta `thread`, `modale`, `pdf`, `report` (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:149`, `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:2877-2880`).
- Testi generati con blocchi tipo "Sintesi breve", "Fattori prioritari", "Backlog tecnico", "Limiti" (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:4251-4340`).

Uso reale oggi:

- Utile per richieste trasversali e ranking.
- Non adatto a prompt semplici se deve vincere la card settoriale.
- Non produce output cardizzato unificato.

### 4.3 Verdetto

Riusabile:

- Tassonomia scope.
- Source descriptor.
- Period parsing e output preference.
- Alcuni collector e ranking.

Da non tenere come motore finale:

- File monolitico da circa 7.383 righe.
- Router troppo largo e opaco per l'utente.
- Output testuale/report non allineato al telaio "chat unica settoriale".

Raccomandazione: tenere parziale. Estrarre mapping e funzioni robuste; riscrivere routing e runner per settore.

## 5. ANALISI ROUTING E SMISTAMENTO

### 5.1 Catena attuale su prompt rappresentativi

Prompt `TI282780`:

- UI -> `handleChatSubmit` (`src/next/NextInternalAiPage.tsx:7605`).
- Bridge -> `runInternalAiChatTurnThroughBackend` (`src/next/internal-ai/internalAiChatOrchestratorBridge.ts:149`).
- `parseIntent` trova targa e intent `stato_operativo_mezzo` (`src/next/internal-ai/internalAiChatOrchestrator.ts:862-892`).
- Gate unificato con targa senza scope/full overview ritorna `false` (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:1563-1566`).
- Branch `stato_operativo_mezzo` genera card (`src/next/internal-ai/internalAiChatOrchestrator.ts:2047-2050`, `src/next/internal-ai/internalAiChatOrchestrator.ts:1798-1855`).
- Surface: card visibile solo se dispatcher/primary.

Prompt `stato operativo del mezzo TI282780`:

- `parseIntent` rileva pattern `stato operativo` e targa (`src/next/internal-ai/internalAiChatOrchestrator.ts:168-190`, `src/next/internal-ai/internalAiChatOrchestrator.ts:890-892`).
- Il gate attuale puo' non intercettare se non rileva scope espliciti; se arriva al branch canonico produce Step Zero card.

Prompt `rifornimenti aprile 2026`:

- `parseUnifiedQuery` rileva scope `rifornimenti` (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:505`, `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:1418-1420`).
- Gate unificato ritorna `true` per scopes (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:1570-1572`).
- Dispatcher passa a fleet/fuel se primaryIntent coerente (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:7368-7379`).
- Output: testo/report unificato, non card settore Rifornimenti.

Prompt `manutenzioni in scadenza`:

- Scope `manutenzioni` e `scadenze` rilevabili (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:501-503`).
- Gate unificato attivo.
- Output probabile: motore unificato, non modulo Centro Controllo madre-like.

Prompt `ciao`:

- Nessun intent specifico in `parseIntent`, default `richiesta_generica` (`src/next/internal-ai/internalAiChatOrchestrator.ts:894`).
- Fallback attuale mostra elenco generico esteso (`src/next/internal-ai/internalAiChatOrchestrator.ts:1648-1677`).
- Non conforme al telaio: dovrebbe rispondere senza elenco totale fuori contesto.

### 5.2 Problemi rilevati

- Surface multiple: quattro render chat, due card-aware e due text-only.
- Gate unificato storicamente aggressivo; ora mitigato sui prompt targa semplici, ma resta davanti allo switch canonico.
- Fallback generico in contrasto con telaio (`src/next/internal-ai/internalAiChatOrchestrator.ts:1648-1677`).
- Tre sistemi concorrenti: orchestratore lineare, motore unificato, gateway universale.
- UI contiene bottoni/surface/archivi e pannelli non compatibili con "solo campo libero" come prima schermata.

### 5.3 Architettura raccomandata

Schema minimo:

1. `ChatShell`: una sola pagina, un input, un thread, uno stato loading.
2. `PromptRouter`: normalizza prompt, riconosce settore, entita', periodo, output richiesto.
3. `SectorRunner`: cartelle `mezzi`, `autisti`, `manutenzioni-scadenze`, `materiali`, `costi-fatture`, `documenti`, `cisterna`.
4. `ReportEngine`: genera preview strutturata, salva artifact report, esporta PDF.
5. `FallbackContestuale`: se settore stimato ma intent non supportato, risponde solo nel settore.
6. `OpenAiFormatter`: solo riformulazione italiana su dati gia' letti.

Pattern da riusare:

- Reader clone-safe D01-D10.
- `InternalAiMezzoCard`.
- `InternalAiReportPreview` e PDF builder.
- Backend chat controllata e artifact repository.
- Catalogo capability mezzo come base del settore Mezzi.

## 6. ANALISI BACKEND E OPENAI

Server adapter:

- Express separato, non backend canonico legacy (`backend/internal-ai/server/internal-ai-adapter.js:54`).
- Health dichiara `server_adapter_mock_safe`, `server_file_isolated`, `backend/internal-ai/runtime-data`, `businessWritesEnabled: false` (`backend/internal-ai/server/internal-ai-adapter.js:1119-1138`).
- Start su host/porta loggati in `startInternalAiAdapterServer` (`backend/internal-ai/server/internal-ai-adapter.js:3071-3075`).

Payload OpenAI:

- `buildControlledChatUserPayload` include prompt, intent, dataBoundary, localTurn, attachments, memoryHints, repoUnderstanding (`backend/internal-ai/server/internal-ai-adapter.js:626-648`).
- Esclude letture live: il payload si basa su localTurn e snapshot curate.
- System prompt obbliga italiano, dati strutturati ricevuti, niente invenzioni, niente scritture, niente live-read business (`backend/internal-ai/server/internal-ai-adapter.js:741-750`).

Repo understanding:

- Se la richiesta e' repo/flussi, usa snapshot deterministica senza provider reale (`backend/internal-ai/server/internal-ai-adapter.js:661-704`).
- Retrieval server-side legge snapshot seedate D01/Dossier e repo understanding, non Firestore/Storage business live (`backend/internal-ai/server/internal-ai-adapter.js:2539-2735`).

Riutilizzo:

- Backend controllato da salvare.
- Modello default/variabile da mantenere configurabile.
- Payload da rivedere per i nuovi sector runner: deve ricevere risultati strutturati settore, non testo gia' impastato dal motore monolitico.

## 7. ANALISI ARCHIVIO REPORT

### 7.1 Stato attuale

Artifact repository:

- Stato client in `internalAiMockRepository`: initial state, server repository state, hydration, draft artifact e archive (`src/next/internal-ai/internalAiMockRepository.ts:507-640`, `src/next/internal-ai/internalAiMockRepository.ts:807`).
- Persistenza server artifact via endpoint `artifacts.repository` read/replace (`backend/internal-ai/server/internal-ai-adapter.js:2236-2318`).
- Server file isolated in `backend/internal-ai/runtime-data` (`backend/internal-ai/server/internal-ai-persistence.js:7`, `backend/internal-ai/src/internalAiServerPersistenceContracts.ts:151`).

UI archivio:

- Section `artifacts` dichiarata come "Archivio artifact IA" (`src/next/NextInternalAiPage.tsx:944-945`).
- Filtri artifact per query, tipo, stato, family, targa, autista, periodo (`src/next/NextInternalAiPage.tsx:4396-4414`, `src/next/NextInternalAiPage.tsx:5122-5223`).
- Lista filtered artifacts renderizzata in `src/next/NextInternalAiPage.tsx:13791-13928`.

Report/PDF:

- `buildInternalAiReportPdfFileName` in `src/next/internal-ai/internalAiReportPdf.ts:118`.
- PDF report costruito in `src/next/internal-ai/internalAiReportPdf.ts:220-394`.
- Save draft report in `src/next/NextInternalAiPage.tsx:9331`.
- Archive artifact in `src/next/NextInternalAiPage.tsx:9388`.
- Modale report in `src/next/NextInternalAiPage.tsx:14758-14879`.

### 7.2 Gap verso telaio

Manca:

- Archivio report come dominio funzionale per targa/autista, non solo artifact IA generici.
- Chiave stabile e query per report mensile/puntuale.
- Reopen report da chat con prompt naturale.
- Contratto chiaro tra report salvato, PDF, data di generazione, targa/autista, periodo.
- Persistenza in archivio "dove vivono i dati" definita dal telaio; oggi artifact server-file isolated, non Firestore business.

Effort stimato: alto. I pezzi esistono, ma il dominio archivio report va disegnato.

## 8. ANALISI ARCHITETTURA MODULARE

### 8.1 File piu' grandi

- `src/next/NextInternalAiPage.tsx`: circa 14.903 righe.
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`: circa 7.383 righe.
- `src/next/internal-ai/internalAiChatOrchestrator.ts`: circa 2.060 righe.
- `src/next/internal-ai/internal-ai.css`: oltre 5.000 righe non vuote.
- `src/next/internal-ai/internalAiUniversalHandoff.ts`: circa 973 righe.
- `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`: circa 964 righe.
- `src/next/internal-ai/internalAiProfessionalVehicleReport.ts`: circa 891 righe.

Verdetto: non conforme al telaio "file piccoli e indipendenti".

### 8.2 Settori richiesti

| Settore | Codice riusabile | Cosa manca |
|---|---|---|
| Mezzi | D01, D02, D10, `InternalAiMezzoCard`, vehicle report facade | Router mezzo, timeline madre-like, card/report completi |
| Autisti | D03, driver lookup/report facade, matching madre | Card/table timeline Autista 360 |
| Manutenzioni/scadenze | D02, D10, Centro Controllo logic | Runner priorita'/scadenze equivalente madre |
| Materiali/magazzino | D05, magazzino controlled actions | Output read-only chat, no writer fuori perimetro |
| Costi/fatture | D07/D08, economic/document facade | Report costi per targa/fornitore/periodo |
| Documenti | D07/D08 archive reader | Output documentale senza integrare Archivista |
| Cisterna | D09 reader, module contracts | Runner settore cisterna |
| Motore IA | backend OpenAI, router universal bits | PromptRouter unico e fallback contestuale |
| Motore report | report preview/pdf/artifact | Archivio report stabile per targa/autista |

### 8.3 Mappa di estrazione

Proposta cartelle:

- `src/next/internal-ai/chat/`: shell, input, thread, loading, renderer unico.
- `src/next/internal-ai/router/`: normalize prompt, entity resolver, sector classifier.
- `src/next/internal-ai/sectors/mezzi/`: reader composition, card, report mezzo.
- `src/next/internal-ai/sectors/autisti/`: badge/name match, timeline, report autista.
- `src/next/internal-ai/sectors/manutenzioni/`: scadenze, priorita', backlog tecnico.
- `src/next/internal-ai/sectors/materiali/`: stock, materiali, attrezzature, AdBlue.
- `src/next/internal-ai/sectors/costi/`: documenti, costi, fatture, preventivi.
- `src/next/internal-ai/sectors/cisterna/`: report e letture cisterna.
- `src/next/internal-ai/reports/`: preview, PDF, archive repository.
- `src/next/internal-ai/backend/`: client server adapter, OpenAI formatter.

## 9. STIMA RIFACIMENTO

### 9.1 Scenario A: UI + smistamento, mantenendo backend e reader

Cosa si butta:

- Surface multiple e layout monolitico di `NextInternalAiPage`.
- Fallback generico.

Cosa si riusa:

- Reader D01-D10.
- Backend OpenAI.
- Artifact/PDF/report.
- Card mezzo.

Cosa si scrive:

- UI unica.
- Router unico.
- Adapter per far convivere vecchi runner.

Stima: 2-4 settimane operative, ma rischio alto di trascinarsi complessita' vecchia.

### 9.2 Scenario B: UI + smistamento + motore IA + runner per settore, riusando reader e OpenAI

Cosa si butta:

- Orchestrazione monolitica come flusso primario.
- Motore unificato come router principale.
- Surface multiple.

Cosa si riusa:

- Reader clone-safe.
- Mapping scope/source.
- Backend controllato.
- Report/PDF.
- Step Zero card.

Cosa si scrive:

- Chat shell unica.
- Prompt router.
- Runner settoriali.
- Report archive.
- Fallback contestuale.

Stima: 4-7 settimane, settore per settore. E' lo scenario piu' sensato.

### 9.3 Scenario C: rifacimento da zero senza reader

Cosa cambia:

- Si riscrivono anche normalizzazioni dati gia' presenti.
- Si perde esperienza accumulata su D01-D10.
- Rischio regressioni alto su matching, dedup, dati legacy.

Stima: 8-12 settimane. Costo nascosto: nuova validazione completa dati.

### 9.4 Raccomandazione

Scenario B. Il valore reale e' nei reader clone-safe, nel backend controllato e nei componenti/report specifici. La parte da rifare e' il cervello applicativo della chat: UI, routing, fallback e runner settoriali.

## 10. RACCOMANDAZIONI OPERATIVE

### 10.1 Cosa salvare

- Reader D01-D10: `src/next/nextAnagraficheFlottaDomain.ts:763`, `src/next/domain/nextAutistiDomain.ts:1176`, `src/next/domain/nextRifornimentiDomain.ts:1291`, `src/next/domain/nextCentroControlloDomain.ts:1627`.
- Registry raw read-only: `src/next/domain/nextUnifiedReadRegistryDomain.ts:116-272`.
- Tipi chat/card: `src/next/internal-ai/internalAiTypes.ts:731-801`.
- Step Zero card: `src/next/internal-ai/InternalAiMezzoCard.tsx:60`, `src/next/internal-ai/internalAiMezzoCard.css`.
- Backend OpenAI controllato: `backend/internal-ai/server/internal-ai-adapter.js:626-790`.
- Artifact/PDF report: `src/next/internal-ai/internalAiReportPdf.ts:118-394`, `src/next/internal-ai/internalAiMockRepository.ts:620-807`.
- Tassonomia motore unificato: `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:483-600`.

### 10.2 Cosa buttare definitivamente

- UI chat come file monolitico: `src/next/NextInternalAiPage.tsx`.
- Quattro surface chat separate.
- Fallback generic list-based: `src/next/internal-ai/internalAiChatOrchestrator.ts:1648-1677`.
- Motore unificato come router principale.
- CSS monolitico unico per tutta la chat.

### 10.3 Cosa rifare da zero

- UI chat unificata.
- Smistamento prompt per settore.
- Fallback contestuale per settore.
- Archivio report targa/autista.
- Modali strutturati esportabili PDF.
- Contratto output: `text`, `card`, `table`, `modal_report`, `pdf`.

### 10.4 Ordine consigliato

1. Mezzi: esiste Step Zero, D01/D02/D10 gia' funzionano.
2. Manutenzioni/scadenze/Centro Controllo: massimo valore operativo e reader D10 pronti.
3. Autisti: serve portare matching e timeline madre.
4. Rifornimenti: integrare D04 e dedup Centro Controllo.
5. Costi/fatture/documenti: piu' ampio, richiede archivio/report.
6. Materiali/magazzino: molte regole di confine su scritture.
7. Cisterna: verticale specialistica, da fare quando il pattern settoriale e' stabile.

### 10.5 Rischi e attenzioni

- Non perdere fuzzy match targa di `Mezzo360` (`src/pages/Mezzo360.tsx:135-148`).
- Non perdere derived change history di `Autista360` (`src/pages/Autista360.tsx:498-508`).
- Non perdere scoring priorita' di `CentroControllo` (`src/pages/CentroControllo.tsx:845-939`).
- Non perdere merge/dedup rifornimenti (`src/pages/CentroControllo.tsx:475-526`).
- Non buttare la tassonomia dei 17 scope senza sostituzione.
- Non aprire live-read business lato backend: il backend stesso dichiara confine chiuso (`backend/internal-ai/server/internal-ai-adapter.js:1137-1141`).
- Non integrare Archivista nel rifacimento chat.

## 11. APPENDICE: FILE LETTI

- `docs/product/MAPPA_IA_CHAT_NEXT.md`
- `src/App.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `src/next/internal-ai/InternalAiMezzoCard.tsx`
- `src/next/internal-ai/internalAiMezzoCard.css`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiChatOrchestratorBridge.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiContracts.ts`
- `src/next/internal-ai/internalAiUniversalRequestResolver.ts`
- `src/next/internal-ai/internalAiUniversalOrchestrator.ts`
- `src/next/internal-ai/internalAiUniversalContracts.ts`
- `src/next/internal-ai/internalAiUniversalRegistry.ts`
- `src/next/internal-ai/InternalAiUniversalWorkbench.tsx`
- `src/next/internal-ai/internalAiVehicleCapabilityCatalog.ts`
- `src/next/internal-ai/internalAiVehicleCapabilityPlanner.ts`
- `src/next/internal-ai/internalAiVehicleDossierHookFacade.ts`
- `src/next/internal-ai/internalAiVehicleReportFacade.ts`
- `src/next/internal-ai/internalAiMockRepository.ts`
- `src/next/internal-ai/internalAiServerChatClient.ts`
- `src/next/internal-ai/internalAiServerPersistenceClient.ts`
- `src/next/internal-ai/internalAiServerPersistenceBridge.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/next/domain/nextLavoriDomain.ts`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextAttrezzatureCantieriDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextFornitoriDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- `src/pages/Mezzo360.tsx`
- `src/pages/Autista360.tsx`
- `src/pages/CentroControllo.tsx`
- `backend/internal-ai/server/internal-ai-adapter.js`
- `backend/internal-ai/server/internal-ai-persistence.js`
- `backend/internal-ai/src/internalAiServerPersistenceContracts.ts`
- `backend/internal-ai/package.json`
- `package.json`

## 12. APPENDICE: ZONE OSCURE RESIDUE

- Non e' stata fatta una prova browser runtime della nuova chat: audit di codice, non test end-to-end.
- Non e' stata verificata la qualita' effettiva delle risposte OpenAI, solo il payload e il confine server.
- Non e' stata aperta l'integrazione Archivista per vincolo del prompt.
- Non e' stata misurata la copertura dati reale su un dataset completo per ogni settore; sono stati verificati reader, chiamate e mapping.
- Non e' stato deciso dove dovra' vivere definitivamente l'archivio report futuro: artifact server-file isolated esiste, ma la scelta Firestore/business va specificata.
