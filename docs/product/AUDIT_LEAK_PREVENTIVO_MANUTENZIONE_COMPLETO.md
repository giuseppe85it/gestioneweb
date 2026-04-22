# AUDIT — Leak preventivi manutenzione: mappa completa

## 1. Dossier mezzo legacy view

### Cosa espone

- `readNextDossierMezzoCompositeSnapshot()` legge in parallelo sia il blocco `documentCosts` sia il supporto `procurementPerimeter` (`src/next/domain/nextDossierMezzoDomain.ts:760-777`).
- `buildNextDossierMezzoLegacyView()` non espone il supporto procurement nel payload legacy della pagina: il campo `documentiCosti` viene costruito solo da `snapshot.documentCosts.snapshot.items` tramite `mapNextDocumentiCostiItemsToLegacyView(...)` (`src/next/domain/nextDossierMezzoDomain.ts:921-934`).
- `NextDossierMezzoPage.tsx` prende `legacy.documentiCosti`, poi isola i preventivi con `docs.filter((item) => item.tipo === "PREVENTIVO")` e li rende nella sezione `Preventivi` (`src/next/NextDossierMezzoPage.tsx:221-223`, `src/next/NextDossierMezzoPage.tsx:533`).

### Filtri attivi

- `readNextMezzoDocumentiCostiSnapshot()` costruisce `items` filtrando i record gia normalizzati con `item.mezzoTarga === mezzoTarga`, poi i gruppi `preventivi/fatture/documentiUtili` nascono solo da quegli `items` (`src/next/domain/nextDocumentiCostiDomain.ts:2209-2225`).
- Lo stesso dominio dichiara esplicitamente che `@preventivi` non va fuso nel blocco documenti/costi diretti: "`@preventivi` appartiene al workflow procurement globale: non e un dataset mezzo-centrico e non va fuso nel blocco documenti/costi diretti." (`src/next/domain/nextDocumentiCostiDomain.ts:1744-1758`).

### Come riconosce la targa

- Il dossier legacy non legge direttamente `@preventivi`.
- Il solo reader che prova a fare matching sulla procurement area e `readNextDocumentiCostiProcurementSupportSnapshot()`, ma lo fa solo con `entry.targa ?? entry.mezzoTarga`:
  - `preventiviConTargaDiretta`: `Boolean(normalizeTarga(entry.targa ?? entry.mezzoTarga))`
  - `preventiviMatchForte`: `normalizeTarga(entry.targa ?? entry.mezzoTarga) === mezzoTarga`
  - evidenza: `src/next/domain/nextDocumentiCostiDomain.ts:1818-1894`, in particolare `1860-1864`
- In questo reader non c'e alcuna lettura di `entry.metadatiMezzo.targa`.

### Mostra correttamente i preventivi manutenzione? `NO`

- I preventivi manutenzione Archivista salvati solo in `storage/@preventivi` non entrano nel dossier legacy, perche `buildNextDossierMezzoLegacyView()` espone solo `documentCosts` e `readNextMezzoDocumentiCostiSnapshot()` non legge `@preventivi` (`src/next/domain/nextDossierMezzoDomain.ts:921-934`, `src/next/domain/nextDocumentiCostiDomain.ts:1744-1758`, `2209-2225`).
- Il supporto procurement esiste nel composite snapshot, ma non viene promosso nella sezione `Preventivi` della pagina dossier (`src/next/domain/nextDossierMezzoDomain.ts:857-859`, `874-934`; `src/next/NextDossierMezzoPage.tsx:221-223`, `533`).
- Anche se venisse guardato, oggi il matching forte della procurement area non legge `metadatiMezzo.targa`, quindi non riconoscerebbe i record manutenzione Archivista scritti con `metadatiMezzo` (`src/next/domain/nextDocumentiCostiDomain.ts:1860-1864`).

## 2. Pipeline IA interna

### Elenco file coinvolti

- `src/next/internal-ai/internalAiPreventiviPreviewFacade.ts`
- `src/next/internal-ai/internalAiDocumentsPreviewFacade.ts`
- `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`
- `src/next/internal-ai/internalAiServerRetrievalClient.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`

### `internalAiPreventiviPreviewFacade.ts`

- Cosa legge:
  - `readNextMezzoDocumentiCostiSnapshot(normalizedTarga)`
  - `readNextDocumentiCostiProcurementSupportSnapshot(normalizedTarga)`
  - evidenza: `src/next/internal-ai/internalAiPreventiviPreviewFacade.ts:495-528`
- Come usa i preventivi:
  - bucket diretto/plausibile da `documentSnapshot.groups.preventivi`
  - bucket supporto da `procurement.counts.preventiviMatchForte`, `procurement.counts.preventiviGlobali`, `procurement.counts.approvazioniMezzo`
  - evidenza: `src/next/internal-ai/internalAiPreventiviPreviewFacade.ts:94-150`, `385-405`
- Discriminazione su `ambitoPreventivo` / `famigliaArchivista` / `metadatiMezzo`:
  - nessuna nel file
  - il supporto procurement eredita integralmente il comportamento di `readNextDocumentiCostiProcurementSupportSnapshot()`, che non legge `ambitoPreventivo`, `famigliaArchivista` o `metadatiMezzo.targa`
- Conclusione: `LEAK SI`
  - non promuove il procurement nel bucket diretto, ma usa comunque conteggi procurement non discriminati e quindi puo mostrare preventivi manutenzione come supporto procurement separato.

### `internalAiDocumentsPreviewFacade.ts`

- Cosa legge:
  - `readNextMezzoDocumentiCostiSnapshot(normalizedTarga)`
  - `readNextDocumentiCostiProcurementSupportSnapshot(normalizedTarga)`
  - evidenza: `src/next/internal-ai/internalAiDocumentsPreviewFacade.ts:444-466`
- Come usa i preventivi:
  - non costruisce un bucket preventivi dedicato, ma inserisce nel bucket `Fuori perimetro` una card "Procurement globale e approvazioni" con `procurement.counts.preventiviGlobali`
  - evidenza: `src/next/internal-ai/internalAiDocumentsPreviewFacade.ts:113-130`, `303-313`
- Discriminazione su `ambitoPreventivo` / `famigliaArchivista` / `metadatiMezzo`:
  - nessuna nel file
  - eredita il supporto procurement non filtrato
- Conclusione: `LEAK SI`
  - leak piu debole del procurement UI, ma reale: i preventivi manutenzione possono entrare come "procurement globale" nel contesto IA documenti.

### `internalAiEconomicAnalysisFacade.ts`

- Cosa legge:
  - `readNextDossierMezzoCompositeSnapshot(normalizedTarga)`
  - evidenza: `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts:409-414`
- Come usa i preventivi:
  - non legge righe preventivo una per una
  - usa il blocco `procurementPerimeter` del composite snapshot per esporre la fonte "Procurement e approvazioni" con `procurement.counts.preventiviGlobali`
  - evidenza: `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts:348-358`
- Discriminazione su `ambitoPreventivo` / `famigliaArchivista` / `metadatiMezzo`:
  - nessuna nel file
  - eredita il supporto procurement non filtrato del dominio dossier/documenti-costi
- Conclusione: `LEAK SI`
  - i preventivi manutenzione possono influenzare il contesto economico come "procurement e approvazioni", pur essendo semanticamente fuori dal procurement.

### `internalAiUnifiedIntelligenceEngine.ts`

- Cosa legge:
  - `readNextProcurementSnapshot()` per query procurement/magazzino (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:4717-4729`, `5631-5653`)
  - raw storage `storage/@preventivi` come sorgente D06 del registry universale (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:572-576`, `1792-1807`, `2592-2598`)
- Come usa i preventivi:
  - `buildWarehouseStructuredQueryResult()` filtra `procurement.preventivi` per fornitore/materiale e li usa nei riepiloghi magazzino (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:4717-4727`)
  - `buildProcurementSection()` miscela `readNextProcurementSnapshot()`, `readNextDocumentiCostiProcurementSupportSnapshot(args.targa)` e le sorgenti raw del registry (`storage/@preventivi`, `storage/@preventivi_approvazioni`, `storage-path/preventivi/ia`) (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:5631-5653`)
  - il registry universale dichiara `storage/@preventivi` come `raw_storage_doc` e lo materializza genericamente senza logica di ambito (`src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts:572-576`, `1792-1807`, `2592-2598`)
- Discriminazione su `ambitoPreventivo` / `famigliaArchivista` / `metadatiMezzo`:
  - nessuna nei punti letti
- Conclusione: `LEAK SI`
  - questo e il punto IA piu ampio: esistono sia un leak D06 via procurement snapshot, sia un leak separato via registry raw di `storage/@preventivi`.

### `internalAiMagazzinoControlledActions.ts`

- Cosa legge:
  - `readNextProcurementSnapshot({ includeCloneOverlays: false })`
  - evidenza: `src/next/internal-ai/internalAiMagazzinoControlledActions.ts:678-683`
- Come usa i preventivi:
  - non li usa
  - `buildProcurementArrivedRows()` legge solo `procurementSnapshot.orders` e costruisce righe arrivate da ordini (`src/next/internal-ai/internalAiMagazzinoControlledActions.ts:434-447`)
- Discriminazione su `ambitoPreventivo` / `famigliaArchivista` / `metadatiMezzo`:
  - non applicabile
- Conclusione: `NON APPLICABILE`

### `internalAiServerRetrievalClient.ts`

- Cosa legge:
  - non legge raw `@preventivi`
  - usa il composite dossier gia costruito e, se `procurementPerimeter.status === "success"`, aggiunge solo le label dataset `@preventivi`, `@preventivi_approvazioni`
  - evidenza: `src/next/internal-ai/internalAiServerRetrievalClient.ts:175-180`
- Come usa i preventivi:
  - solo come metadato `sourceDatasetLabels`
- Discriminazione su `ambitoPreventivo` / `famigliaArchivista` / `metadatiMezzo`:
  - nessuna, ma non c'e lettura di record
- Conclusione: `NON APPLICABILE`

### `internalAiChatOrchestrator.ts`

- Cosa legge:
  - non legge dataset preventivi
  - contiene solo metadata dominio D06 con `mainFiles` (`src/next/internal-ai/internalAiChatOrchestrator.ts:398-414`)
- Come usa i preventivi:
  - non usa record, count o snapshot
- Discriminazione su `ambitoPreventivo` / `famigliaArchivista` / `metadatiMezzo`:
  - non applicabile
- Conclusione: `NON APPLICABILE`

## 3. Altri consumer di @preventivi

- `src/next/domain/nextProcurementDomain.ts` — `readNextProcurementSnapshot()`:
  - legge `storage/@preventivi` con `readStorageDataset(PREVENTIVI_KEY, ["preventivi"])`
  - mappa tutti i record con `mapPreventivoRecord(...)`
  - non filtra `ambitoPreventivo`
  - evidenza: `src/next/domain/nextProcurementDomain.ts:902-937`
  - ruolo: reader procurement canonico clone-safe
  - stato: `LEAK`

- `src/next/domain/nextDocumentiCostiDomain.ts` — `readNextDocumentiCostiProcurementSupportSnapshot()`:
  - legge raw `@preventivi` e `@preventivi_approvazioni`
  - non filtra `ambitoPreventivo`
  - riconosce la targa solo con `entry.targa ?? entry.mezzoTarga`
  - evidenza: `src/next/domain/nextDocumentiCostiDomain.ts:1818-1894`, in particolare `1860-1869`
  - ruolo: supporto procurement separato per dossier/IA
  - stato: `LEAK`

- `src/next/NextHomePage.tsx`:
  - chiama `readNextProcurementSnapshot()` ma usa solo `counts.pendingOrders` e `counts.partialOrders`
  - evidenza: `src/next/NextHomePage.tsx:362-368`, `392-403`
  - ruolo: statistiche home
  - stato: `NON APPLICABILE`

- `src/next/domain/nextOperativitaGlobaleDomain.ts`:
  - chiama `readNextProcurementSnapshot({ includeCloneOverlays: false })` e restituisce l'intero blocco `procurement` nel proprio snapshot
  - evidenza: `src/next/domain/nextOperativitaGlobaleDomain.ts:343-350`, `379-420`
  - ruolo: carrier indiretto del payload procurement nell'operativita globale
  - stato: `DA VERIFICARE`
  - nota: nel file letto non ci sono usi locali di `preventivi`, ma il payload passa intero ai consumer del dominio

- `src/next/NextLegacyStorageBoundary.tsx`:
  - chiama `readNextProcurementSnapshot()` ma materializza solo `@ordini`
  - evidenza: `src/next/NextLegacyStorageBoundary.tsx:203-205`
  - ruolo: override legacy-shaped per ordini
  - stato: `NON APPLICABILE`

- `src/next/nextData.ts`:
  - nessun import di `nextProcurementDomain`
  - nessuna occorrenza di `@preventivi`, `ambitoPreventivo`, `famigliaArchivista`
  - ruolo: metadata shell/route
  - stato: `NON APPLICABILE`

## 4. Mappa unificata delle esposizioni

| File | Funzione/hook/componente | Layer | Discrimina su `ambitoPreventivo`? | Comportamento atteso | Stato |
|---|---|---|---|---|---|
| `src/next/domain/nextProcurementDomain.ts` | `readNextProcurementSnapshot` | procurement / materiali / magazzino | NO | escludere i preventivi manutenzione dal procurement | `LEAK` |
| `src/next/domain/nextDocumentiCostiDomain.ts` | `readNextDocumentiCostiProcurementSupportSnapshot` | dossier support / IA support | NO | non trattare i preventivi manutenzione come procurement; retrocompat record senza campo inclusi | `LEAK` |
| `src/next/domain/nextDossierMezzoDomain.ts` | `buildNextDossierMezzoLegacyView` | dossier | NO | includere i preventivi manutenzione sulla targa giusta | `DA VERIFICARE` |
| `src/next/NextDossierMezzoPage.tsx` | sezione `Preventivi` | dossier | NO | mostrare i preventivi manutenzione solo se il layer legacy li espone correttamente | `DA VERIFICARE` |
| `src/next/internal-ai/internalAiPreventiviPreviewFacade.ts` | `readInternalAiPreventiviPreview` / `buildSupportItems` | IA | NO | escludere i preventivi manutenzione dal supporto procurement; ammetterli solo via layer mezzo-centrico | `LEAK` |
| `src/next/internal-ai/internalAiDocumentsPreviewFacade.ts` | `readInternalAiDocumentsPreview` / `createOutOfScopeItems` | IA | NO | escludere i preventivi manutenzione dal bucket procurement globale | `LEAK` |
| `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts` | `readInternalAiEconomicAnalysisPreview` / `buildSources` | IA | NO | escludere i preventivi manutenzione dal supporto procurement economico | `LEAK` |
| `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` | `UNIFIED_SOURCE_DESCRIPTORS` + `snapshotFromRawStorage` + `buildUnifiedRegistrySnapshot` | IA / registry | NO | non indicizzare i preventivi manutenzione come sorgente procurement D06 | `LEAK` |
| `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` | `buildWarehouseStructuredQueryResult` | IA / magazzino | NO | escludere i preventivi manutenzione dalle risposte magazzino/procurement | `LEAK` |
| `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` | `buildProcurementSection` | IA / procurement | NO | escludere i preventivi manutenzione dal riepilogo procurement | `LEAK` |
| `src/next/internal-ai/internalAiMagazzinoControlledActions.ts` | `loadInternalAiMagazzinoInlineContext` | IA / magazzino | NON APPLICABILE | ordini soltanto | `CORRETTO` |
| `src/next/internal-ai/internalAiServerRetrievalClient.ts` | `collectVehicleDossierSourceDatasetLabels` | IA / server seed | NON APPLICABILE | metadati dataset soltanto | `CORRETTO` |
| `src/next/internal-ai/internalAiChatOrchestrator.ts` | metadata D06 `mainFiles` | IA / orchestration | NON APPLICABILE | nessuna lettura dati | `CORRETTO` |
| `src/next/NextHomePage.tsx` | `loadSnapshot` | altro | NON APPLICABILE | usa solo counts ordini | `CORRETTO` |
| `src/next/domain/nextOperativitaGlobaleDomain.ts` | `readNextOperativitaGlobaleSnapshot` | altro | NO locale | carrier indiretto: da verificare a valle | `DA VERIFICARE` |
| `src/next/NextLegacyStorageBoundary.tsx` | `buildOverrides` preset `procurement` | altro | NON APPLICABILE | usa solo `orders` | `CORRETTO` |

## 5. Sintesi per patch unica

### Punti minimi da toccare

1. `src/next/domain/nextProcurementDomain.ts` — `readNextProcurementSnapshot`
   - imporre l'esclusione dei record con `ambitoPreventivo === "manutenzione"` dal dataset procurement canonico
   - retrocompat: i record senza `ambitoPreventivo` vanno mantenuti inclusi
   - rischio collaterale noto: cambiano conteggi e liste in tutte le superfici che consumano il procurement snapshot

2. `src/next/domain/nextDocumentiCostiDomain.ts` — `readNextDocumentiCostiProcurementSupportSnapshot`
   - imporre la stessa esclusione sul supporto procurement separato usato da dossier/IA
   - retrocompat: i record senza `ambitoPreventivo` vanno mantenuti inclusi
   - rischio collaterale noto: cambiano `preventiviGlobali`, `preventiviMatchForte` e le note nei preview IA/economici

3. `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts` — sorgente raw `storage/@preventivi` nel registry universale (`UNIFIED_SOURCE_DESCRIPTORS` + `buildUnifiedRegistrySnapshot` / `snapshotFromRawStorage`)
   - evitare che il registry IA indicizzi i record manutenzione come sorgenti D06/procurement
   - retrocompat: i record senza `ambitoPreventivo` vanno mantenuti inclusi
   - rischio collaterale noto: cambiano retrieval, ranking e riepiloghi IA che oggi usano il registry raw

### Retrocompat

- La retrocompat decisa nel PROMPT 7 resta coerente: i record storici privi di `ambitoPreventivo` vanno trattati come procurement legacy e quindi restano inclusi nei filtri di esclusione.

### Rischi

- Il dossier mezzo non e un leak, ma oggi non mostra i preventivi manutenzione salvati solo in `storage/@preventivi`. Questa e una sottocopertura separata dalla patch di esclusione.
- Il supporto procurement dossier/IA oggi non legge `metadatiMezzo.targa`, quindi una patch solo di esclusione chiude i leak ma non risolve la visibilita corretta dei preventivi manutenzione nel dossier.
- Il registry IA universale ha un secondo canale di esposizione indipendente dal procurement snapshot; se si patcha solo `readNextProcurementSnapshot()`, il leak IA raw resta aperto.

## 6. Domande aperte / file non letti

- Nessun file bloccante non letto nel perimetro richiesto.
- `src/next/nextData.ts` e stato letto e non contiene consumer di `@preventivi`.
- `src/next/internal-ai/internalAiContracts.ts` e `src/next/internal-ai/internalAiUniversalContracts.ts` non sono stati letti integralmente per questo audit perche, dai match testuali, descrivono contratti/metadata di dominio e non letture runtime dei record `@preventivi`.
- `src/next/NextGestioneOperativaPage.tsx` e `src/next/useNextOperativitaSnapshot.ts` non sono stati aperti: nel materiale letto non emergono usi locali di `snapshot.procurement.preventivi`, ma `readNextOperativitaGlobaleSnapshot()` resta un carrier indiretto `DA VERIFICARE` a valle.
