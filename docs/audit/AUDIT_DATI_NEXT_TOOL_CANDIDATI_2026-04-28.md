# AUDIT DATI NEXT E TOOL CANDIDATI CHAT IA

Data: 2026-04-28  
Scopo: censire i dati che la NEXT puo leggere e trasformarli in candidati tool per OpenAI function calling.  
Fonte: codice reale del repository.  
Vincolo: tool business in sola lettura. Sono ammesse solo azioni generatori/report e azioni UI client-side.  
Archivista: non analizzato.

## 1. INTRO

La chat IA NEXT passa al paradigma OpenAI function calling. L'audit elenca:

- reader clone-safe gia esistenti;
- collection Firestore e documenti `storage/*` letti dalla NEXT;
- Storage path gia usati dai generatori;
- componenti e generatori riusabili;
- tool candidati con nome, descrizione per OpenAI, parametri, shape output, base implementativa reale e prerequisiti.

La madre `src/pages/**` non e proposta come runtime tool. I riferimenti sotto sono tutti a codice NEXT, utility condivise o backend/packaging di progetto.

## 2. CENSIMENTO READER ESISTENTI

### 2.1 D01 - Anagrafica flotta

File: `src/next/nextAnagraficheFlottaDomain.ts`

- Dataset letti: `storage/@mezzi_aziendali` (`src/next/nextAnagraficheFlottaDomain.ts:5-6`, `src/next/nextAnagraficheFlottaDomain.ts:768`) e `storage/@colleghi` (`src/next/nextAnagraficheFlottaDomain.ts:7`, `src/next/nextAnagraficheFlottaDomain.ts:769`).
- Shape principali: `NextAnagraficheFlottaCollegaItem` (`src/next/nextAnagraficheFlottaDomain.ts:64`), `NextAnagraficheFlottaMezzoItem` (`src/next/nextAnagraficheFlottaDomain.ts:79`), `NextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:125`).
- Funzioni: `normalizeNextMezzoTarga` (`src/next/nextAnagraficheFlottaDomain.ts:291`), `normalizeNextMezzoCategoria` (`src/next/nextAnagraficheFlottaDomain.ts:295`), `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`), `readNextMezzoByTarga` (`src/next/nextAnagraficheFlottaDomain.ts:880`).
- Clone snapshot: importa e usa `readNextFlottaClonePatches` (`src/next/nextAnagraficheFlottaDomain.ts:3`, `src/next/nextAnagraficheFlottaDomain.ts:802`).

### 2.2 D02 - Operativita tecnica e lavori

File: `src/next/nextOperativitaTecnicaDomain.ts`

- Dataset letti: `storage/@manutenzioni` (`src/next/nextOperativitaTecnicaDomain.ts:10-11`, `src/next/nextOperativitaTecnicaDomain.ts:188`).
- Shape principali: `NextLavoroTecnicoItem` (`src/next/nextOperativitaTecnicaDomain.ts:53`), `NextManutenzioneTecnicaItem` (`src/next/nextOperativitaTecnicaDomain.ts:55`), `NextMezzoOperativitaTecnicaSnapshot` (`src/next/nextOperativitaTecnicaDomain.ts:67`).
- Funzioni: `readNextMezzoOperativitaTecnicaSnapshot` (`src/next/nextOperativitaTecnicaDomain.ts:223`).
- Integrazione lavori: usa `readNextMezzoLavoriSnapshot` (`src/next/nextOperativitaTecnicaDomain.ts:1`, `src/next/nextOperativitaTecnicaDomain.ts:223`).

File: `src/next/domain/nextLavoriDomain.ts`

- Dataset letti: `storage/@lavori` (`src/next/domain/nextLavoriDomain.ts:15-16`, `src/next/domain/nextLavoriDomain.ts:669`).
- Shape principali: `NextLavoroReadOnlyItem` (`src/next/domain/nextLavoriDomain.ts:110`), `NextMezzoLavoriSnapshot` (`src/next/domain/nextLavoriDomain.ts:146`), `NextLavoriListaSnapshot` (`src/next/domain/nextLavoriDomain.ts:213`), `NextLavoriDetailSnapshot` (`src/next/domain/nextLavoriDomain.ts:242`).
- Funzioni: `readNextLavoriInAttesaSnapshot` (`src/next/domain/nextLavoriDomain.ts:934`), `readNextLavoriEseguitiSnapshot` (`src/next/domain/nextLavoriDomain.ts:940`), `buildNextDettaglioLavoroPath` (`src/next/domain/nextLavoriDomain.ts:946`), `readNextDettaglioLavoroSnapshot` (`src/next/domain/nextLavoriDomain.ts:965`), `readNextMezzoLavoriSnapshot` (`src/next/domain/nextLavoriDomain.ts:1066`), `readNextLavoriLegacyDataset` (`src/next/domain/nextLavoriDomain.ts:1147`).

### 2.3 D03 - Autisti, colleghi e attivita

File: `src/next/domain/nextAutistiDomain.ts`

- Dataset letti: `storage/@autisti_sessione_attive`, `storage/@storico_eventi_operativi`, `storage/@segnalazioni_autisti_tmp`, `storage/@controlli_mezzo_autisti`, `storage/@richieste_attrezzature_autisti_tmp` (`src/next/domain/nextAutistiDomain.ts:21-25`, `src/next/domain/nextAutistiDomain.ts:1190-1194`).
- Collection letta: `autisti_eventi` (`src/next/domain/nextAutistiDomain.ts:26`, `src/next/domain/nextAutistiDomain.ts:1195`).
- Shape principali: `NextAutistiCanonicalAssignment` (`src/next/domain/nextAutistiDomain.ts:86`), `NextAutistiCanonicalSignal` (`src/next/domain/nextAutistiDomain.ts:102`), `NextAutistiBoundaryItem` (`src/next/domain/nextAutistiDomain.ts:120`), `NextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:184`).
- Funzioni: `findNextAutistiAssignmentsByTarga` (`src/next/domain/nextAutistiDomain.ts:1144`), `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`).
- Unified registry: usa `readNextUnifiedStorageDocument` e `readNextUnifiedCollection` (`src/next/domain/nextAutistiDomain.ts:16-17`).

File: `src/next/domain/nextColleghiDomain.ts`

- Dataset letto: `storage/@colleghi` (`src/next/domain/nextColleghiDomain.ts:9`, `src/next/domain/nextColleghiDomain.ts:270`).
- Shape principali: `NextCollegaReadOnlyItem` (`src/next/domain/nextColleghiDomain.ts:36`), `NextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:53`).
- Funzione: `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`).

### 2.4 D04 - Rifornimenti

File: `src/next/domain/nextRifornimentiDomain.ts`

- Dataset letti: `storage/@rifornimenti` e `storage/@rifornimenti_autisti_tmp` (`src/next/domain/nextRifornimentiDomain.ts:6-8`, `src/next/domain/nextRifornimentiDomain.ts:1184`).
- Shape principali: `NextRifornimentoReadOnlyItem` (`src/next/domain/nextRifornimentiDomain.ts:120`), `NextMezzoRifornimentiSnapshot` (`src/next/domain/nextRifornimentiDomain.ts:189`), `NextRifornimentiReadOnlySnapshot` (`src/next/domain/nextRifornimentiDomain.ts:241`).
- Funzioni: `readNextRifornimentiReadOnlySnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1291`), `readNextMezzoRifornimentiSnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1304`).

### 2.5 D05 - Materiali, magazzino reale, inventario

File: `src/next/domain/nextMaterialiMovimentiDomain.ts`

- Dataset letti: `storage/@materialiconsegnati` (`src/next/domain/nextMaterialiMovimentiDomain.ts:25-26`, `src/next/domain/nextMaterialiMovimentiDomain.ts:1129`) e `storage/@cisterne_adblue` (`src/next/domain/nextMaterialiMovimentiDomain.ts:27`, `src/next/domain/nextMaterialiMovimentiDomain.ts:1583`).
- Shape principali: `NextMaterialeMovimentoReadOnlyItem` (`src/next/domain/nextMaterialiMovimentiDomain.ts:117`), `NextMezzoMaterialeMovimentoReadOnlyItem` (`src/next/domain/nextMaterialiMovimentiDomain.ts:165`), `NextMaterialiMovimentiSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:180`), `NextMagazzinoAdBlueSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:323`), `NextMagazzinoRealeSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:340`).
- Funzioni: `readNextMaterialiMovimentiSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1125`), `buildNextMezzoMaterialiMovimentiSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1194`), `buildNextMaterialiMovimentiLegacyDossierView` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1280`), `buildNextMaterialiMovimentiOperativitaPreview` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1313`), `buildNextMaterialiConsegnatiDestinatariView` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1325`), `readNextMagazzinoAdBlueSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1582`), `readNextMagazzinoRealeSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1630`).

File: `src/next/domain/nextInventarioDomain.ts`

- Dataset letto: `storage/@inventario` (`src/next/domain/nextInventarioDomain.ts:9`, `src/next/domain/nextInventarioDomain.ts:239`).
- Shape principali: `NextInventarioReadOnlyItem` (`src/next/domain/nextInventarioDomain.ts:29`), `NextInventarioSnapshot` (`src/next/domain/nextInventarioDomain.ts:44`).
- Funzioni: `buildNextInventarioReadOnlyView` (`src/next/domain/nextInventarioDomain.ts:220`), `readNextInventarioSnapshot` (`src/next/domain/nextInventarioDomain.ts:235`).

### 2.6 D06 - Procurement, fornitori, officine

File: `src/next/domain/nextProcurementDomain.ts`

- Dataset letti: `storage/@ordini`, `storage/@preventivi`, `storage/@preventivi_approvazioni`, `storage/@listino_prezzi` (`src/next/domain/nextProcurementDomain.ts:5-9`, `src/next/domain/nextProcurementDomain.ts:872`).
- Shape principali: `NextProcurementOrderItem` (`src/next/domain/nextProcurementDomain.ts:65`), `NextProcurementApprovalItem` (`src/next/domain/nextProcurementDomain.ts:86`), `NextProcurementPreventivoItem` (`src/next/domain/nextProcurementDomain.ts:101`), `NextProcurementListinoItem` (`src/next/domain/nextProcurementDomain.ts:128`), `NextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:164`).
- Funzioni: `buildNextProcurementListView` (`src/next/domain/nextProcurementDomain.ts:891`), `findNextProcurementOrder` (`src/next/domain/nextProcurementDomain.ts:898`), `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`).

File: `src/next/domain/nextFornitoriDomain.ts`

- Dataset letto: `storage/@fornitori` (`src/next/domain/nextFornitoriDomain.ts:9`, `src/next/domain/nextFornitoriDomain.ts:208`).
- Funzione: `readNextFornitoriSnapshot` (`src/next/domain/nextFornitoriDomain.ts:204`).

File: `src/next/domain/nextOfficineDomain.ts`

- Dataset letto: `storage/@officine` (`src/next/domain/nextOfficineDomain.ts:9`, `src/next/domain/nextOfficineDomain.ts:208`).
- Funzione: `readNextOfficineSnapshot` (`src/next/domain/nextOfficineDomain.ts:204`).

### 2.7 D07-D08 - Documenti e costi

File: `src/next/domain/nextDocumentiCostiDomain.ts`

- Dataset e collection letti: `storage/@costiMezzo` (`src/next/domain/nextDocumentiCostiDomain.ts:7-8`, `src/next/domain/nextDocumentiCostiDomain.ts:1815`), `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` (`src/next/domain/nextDocumentiCostiDomain.ts:12`, `src/next/domain/nextDocumentiCostiDomain.ts:1593`), procurement support (`src/next/domain/nextDocumentiCostiDomain.ts:9-11`).
- Shape principali: `NextDocumentiCostiReadOnlyItem` (`src/next/domain/nextDocumentiCostiDomain.ts:125`), `NextMezzoDocumentiCostiSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:222`), `NextDocumentiCostiProcurementSupportSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:272`), `NextProcurementReadOnlySnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:298`), `NextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:341`), `NextIADocumentiArchiveItem` (`src/next/domain/nextDocumentiCostiDomain.ts:1389`), `NextIADocumentiArchiveSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:1415`).
- Funzioni: `readNextDocumentiCostiProcurementSupportSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:1903`), `readNextIADocumentiArchiveSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2010`), `readNextProcurementReadOnlySnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2092`), `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`), `readNextMezzoDocumentiCostiSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2313`), `readNextMezzoDocumentiCostiPeriodView` (`src/next/domain/nextDocumentiCostiDomain.ts:2391`), `mapNextDocumentiCostiItemsToLegacyView` (`src/next/domain/nextDocumentiCostiDomain.ts:2402`).

File: `src/next/domain/nextDocumentiMezzoDomain.ts`

- Collection lette: `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` (`src/next/domain/nextDocumentiMezzoDomain.ts:11-14`).
- Shape principali: `NextDocumentoMezzoItem` (`src/next/domain/nextDocumentiMezzoDomain.ts:30`), `NextMezzoDocumentiCounts` (`src/next/domain/nextDocumentiMezzoDomain.ts:55`), `NextMezzoDocumentiSnapshot` (`src/next/domain/nextDocumentiMezzoDomain.ts:61`).
- Funzioni: `normalizeNextDocumentiMezzoTarga` (`src/next/domain/nextDocumentiMezzoDomain.ts:84`), `isNextDocumentiMezzoSameTarga` (`src/next/domain/nextDocumentiMezzoDomain.ts:100`), `readNextMezzoDocumentiSnapshot` (`src/next/domain/nextDocumentiMezzoDomain.ts:252`).

### 2.8 D09 - Cisterna

File: `src/next/domain/nextCisternaDomain.ts`

- Collection lette: `@documenti_cisterna` (`src/next/domain/nextCisternaDomain.ts:509`), `@cisterna_schede_ia` (`src/next/domain/nextCisternaDomain.ts:574`), `@cisterna_parametri_mensili` (`src/next/domain/nextCisternaDomain.ts:618`).
- Dataset letto: `storage/@rifornimenti_autisti_tmp` (`src/next/domain/nextCisternaDomain.ts:564`).
- Shape principali: `NextCisternaSupportItem` (`src/next/domain/nextCisternaDomain.ts:85`), `NextCisternaDocumentItem` (`src/next/domain/nextCisternaDomain.ts:93`), `NextCisternaSchedaItem` (`src/next/domain/nextCisternaDomain.ts:115`), `NextCisternaSchedaDetail` (`src/next/domain/nextCisternaDomain.ts:135`), `NextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:168`).
- Funzioni: `readNextCisternaSchedaDetail` (`src/next/domain/nextCisternaDomain.ts:842`), `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`).

### 2.9 D10 - Centro controllo

File: `src/next/domain/nextCentroControlloDomain.ts`

- Dataset letti: `storage/@alerts_state`, `storage/@mezzi_aziendali`, `storage/@autisti_sessione_attive`, `storage/@storico_eventi_operativi`, `storage/@segnalazioni_autisti_tmp`, `storage/@controlli_mezzo_autisti` (`src/next/domain/nextCentroControlloDomain.ts:16-21`).
- Shape principali: `D10StoricoEventoItem` (`src/next/domain/nextCentroControlloDomain.ts:134`), `D10AlertItem` (`src/next/domain/nextCentroControlloDomain.ts:206`), `D10FocusItem` (`src/next/domain/nextCentroControlloDomain.ts:230`), `D10Snapshot` (`src/next/domain/nextCentroControlloDomain.ts:262`).
- Funzioni: `parseNextCentroControlloDate` (`src/next/domain/nextCentroControlloDomain.ts:385`), `buildNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1507`), `buildNextStatoOperativoSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1623`), `readNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1627`), `readNextStatoOperativoSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1657`).

### 2.10 D11-MEZ-EVENTI - Segnalazioni e controlli mezzo

File: `src/next/domain/nextSegnalazioniControlliDomain.ts`

- Dataset letti: `storage/@segnalazioni_autisti_tmp`, `storage/@controlli_mezzo_autisti` (`src/next/domain/nextSegnalazioniControlliDomain.ts:5-8`).
- Shape principali: `NextMezzoSegnalazioneItem` (`src/next/domain/nextSegnalazioniControlliDomain.ts:19`), `NextMezzoControlloItem` (`src/next/domain/nextSegnalazioniControlliDomain.ts:38`), `NextMezzoSegnalazioniControlliSnapshot` (`src/next/domain/nextSegnalazioniControlliDomain.ts:61`), `NextMezzoSegnalazioniControlliTimelineItem` (`src/next/domain/nextSegnalazioniControlliDomain.ts:76`).
- Funzioni: `normalizeNextSegnalazioniControlliTarga` (`src/next/domain/nextSegnalazioniControlliDomain.ts:92`), `isNextSegnalazioniControlliSameTarga` (`src/next/domain/nextSegnalazioniControlliDomain.ts:120`), `readNextMezzoSegnalazioniControlliSnapshot` (`src/next/domain/nextSegnalazioniControlliDomain.ts:297`).
- Gap: il reader e mezzo-centrico. Non esiste in questo file un reader flotta-wide per ricerca testuale globale.

### 2.11 D12-MEZ-DOCUMENTI - Documenti mezzo

Gia censito in sezione 2.7 con `src/next/domain/nextDocumentiMezzoDomain.ts`.

### 2.12 Altri reader NEXT riusabili

File: `src/next/domain/nextManutenzioniDomain.ts`

- Dataset letti: `storage/@manutenzioni`, `storage/@mezzi_aziendali`, `storage/@inventario`, `storage/@materialiconsegnati`, collection `@documenti_mezzi` (`src/next/domain/nextManutenzioniDomain.ts:15-19`).
- Funzioni: `readNextMezzoManutenzioniSnapshot` (`src/next/domain/nextManutenzioniDomain.ts:663`), `readNextManutenzioniLegacyDataset` (`src/next/domain/nextManutenzioniDomain.ts:716`), `readNextManutenzioniWorkspaceSnapshot` (`src/next/domain/nextManutenzioniDomain.ts:752`).

File: `src/next/domain/nextManutenzioniGommeDomain.ts`

- Dataset letti: `storage/@cambi_gomme_autisti_tmp`, `storage/@gomme_eventi` (`src/next/domain/nextManutenzioniGommeDomain.ts:17-18`).
- Shape principali: `NextGommeReadOnlyItem` (`src/next/domain/nextManutenzioniGommeDomain.ts:145`), `NextMezzoManutenzioniGommeSnapshot` (`src/next/domain/nextManutenzioniGommeDomain.ts:223`).
- Funzioni: `resolveNextManutenzioneTechnicalView` (`src/next/domain/nextManutenzioniGommeDomain.ts:465`), `buildNextGommeStateByAsse` (`src/next/domain/nextManutenzioniGommeDomain.ts:488`), `buildNextGommeStraordinarieEvents` (`src/next/domain/nextManutenzioniGommeDomain.ts:882`), `mapNextGommeSnapshotToLegacyDossierView` (`src/next/domain/nextManutenzioniGommeDomain.ts:1430`), `mapNextGommeSnapshotToLegacyOperativitaView` (`src/next/domain/nextManutenzioniGommeDomain.ts:1446`), `readNextMezzoManutenzioniGommeSnapshot` (`src/next/domain/nextManutenzioniGommeDomain.ts:1460`).

File: `src/next/domain/nextCapoDomain.ts`

- Dataset letto: `storage/@preventivi_approvazioni` (`src/next/domain/nextCapoDomain.ts:17`, `src/next/domain/nextCapoDomain.ts:361`).
- Shape principali: `NextCapoMezzoCostSummary` (`src/next/domain/nextCapoDomain.ts:30`), `NextCapoMezzoItem` (`src/next/domain/nextCapoDomain.ts:43`), `NextCapoMezziSnapshot` (`src/next/domain/nextCapoDomain.ts:53`), `NextCapoCostiMezzoSnapshot` (`src/next/domain/nextCapoDomain.ts:89`).
- Funzioni: `readNextCapoMezziSnapshot` (`src/next/domain/nextCapoDomain.ts:431`), `readNextCapoCostiMezzoSnapshot` (`src/next/domain/nextCapoDomain.ts:507`).

File: `src/next/domain/nextUnifiedReadRegistryDomain.ts`

- Reader generico storage doc: `readNextUnifiedStorageDocument` (`src/next/domain/nextUnifiedReadRegistryDomain.ts:116`) su `doc(db, "storage", args.key)` (`src/next/domain/nextUnifiedReadRegistryDomain.ts:121`).
- Reader generico collection: `readNextUnifiedCollection` (`src/next/domain/nextUnifiedReadRegistryDomain.ts:159`) su `collection(db, args.collectionName)` (`src/next/domain/nextUnifiedReadRegistryDomain.ts:163`).
- Reader generico Storage prefix: `readNextUnifiedStoragePrefix` (`src/next/domain/nextUnifiedReadRegistryDomain.ts:233`).
- Reader localStorage: `readNextUnifiedLocalStorageKey` (`src/next/domain/nextUnifiedReadRegistryDomain.ts:272`).

File: `src/next/domain/nextEuromeccDomain.ts`

- Collection lette: `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta` (`src/next/domain/nextEuromeccDomain.ts:20-23`, `src/next/domain/nextEuromeccDomain.ts:396-399`).
- Funzioni: `deriveEuromeccCementTypeShortLabel` (`src/next/domain/nextEuromeccDomain.ts:221`), `daysAgo` (`src/next/domain/nextEuromeccDomain.ts:327`), `withinRange` (`src/next/domain/nextEuromeccDomain.ts:336`), `getSubStatus` (`src/next/domain/nextEuromeccDomain.ts:344`), `getAreaStatus` (`src/next/domain/nextEuromeccDomain.ts:380`), `readEuromeccSnapshot` (`src/next/domain/nextEuromeccDomain.ts:394`).

File: `src/next/domain/nextOperativitaGlobaleDomain.ts`

- Dataset letto: `storage/@manutenzioni` (`src/next/domain/nextOperativitaGlobaleDomain.ts:25`, `src/next/domain/nextOperativitaGlobaleDomain.ts:229`).
- Funzioni: `buildNextOperativitaOrdiniView` (`src/next/domain/nextOperativitaGlobaleDomain.ts:332`), `readNextOperativitaGlobaleSnapshot` (`src/next/domain/nextOperativitaGlobaleDomain.ts:342`).

File: `src/next/domain/nextIaLibrettoDomain.ts`

- Dataset letto: `storage/@mezzi_aziendali` (`src/next/domain/nextIaLibrettoDomain.ts:5`, `src/next/domain/nextIaLibrettoDomain.ts:149`).
- Shape principali: `NextIaLibrettoArchiveItem` (`src/next/domain/nextIaLibrettoDomain.ts:26`), `NextIaLibrettoArchiveSnapshot` (`src/next/domain/nextIaLibrettoDomain.ts:41`).
- Funzione: `readNextIaLibrettoArchiveSnapshot` (`src/next/domain/nextIaLibrettoDomain.ts:148`).

File: `src/next/domain/nextAttrezzatureCantieriDomain.ts`

- Dataset letto: `storage/@attrezzature_cantieri` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:5`, `src/next/domain/nextAttrezzatureCantieriDomain.ts:510`).
- Shape principali: `NextAttrezzaturaMovimentoReadOnlyItem` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:35`), `NextAttrezzatureCantieriSnapshot` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:70`).
- Funzioni: `buildNextAttrezzatureRegistroView` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:447`), `buildNextAttrezzatureStatoView` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:473`), `formatNextAttrezzatureQuantita` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:503`), `readNextAttrezzatureCantieriSnapshot` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:509`).

## 3. CENSIMENTO COLLECTION E STORAGE

### 3.1 Firestore: documenti `storage/<key>`

| Key | Reader principale | Chiave primaria utile |
| --- | --- | --- |
| `@mezzi_aziendali` | `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`) | targa |
| `@colleghi` | `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`) | nome, badge, id se presente |
| `@manutenzioni` | `readNextMezzoOperativitaTecnicaSnapshot` (`src/next/nextOperativitaTecnicaDomain.ts:223`) | targa, data, id |
| `@lavori` | `readNextMezzoLavoriSnapshot` (`src/next/domain/nextLavoriDomain.ts:1066`) | targa, id lavoro |
| `@rifornimenti` | `readNextRifornimentiReadOnlySnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1291`) | targa, data |
| `@rifornimenti_autisti_tmp` | `readNextRifornimentiReadOnlySnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1291`) e `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`) | targa, data |
| `@materialiconsegnati` | `readNextMaterialiMovimentiSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1125`) | targa/destinatario, materiale |
| `@cisterne_adblue` | `readNextMagazzinoAdBlueSnapshot` (`src/next/domain/nextMaterialiMovimentiDomain.ts:1582`) | cisterna, data |
| `@ordini` | `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`) | id ordine |
| `@preventivi` | `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`) | id preventivo |
| `@preventivi_approvazioni` | `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`) e `readNextCapoCostiMezzoSnapshot` (`src/next/domain/nextCapoDomain.ts:507`) | id, targa |
| `@listino_prezzi` | `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`) | codice/articolo |
| `@costiMezzo` | `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`) | targa, periodo, documento |
| `@autisti_sessione_attive` | `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`) | badge/autista, mezzo |
| `@storico_eventi_operativi` | `readNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1627`) | data, targa |
| `@segnalazioni_autisti_tmp` | `readNextMezzoSegnalazioniControlliSnapshot` (`src/next/domain/nextSegnalazioniControlliDomain.ts:297`) | targa, data |
| `@controlli_mezzo_autisti` | `readNextMezzoSegnalazioniControlliSnapshot` (`src/next/domain/nextSegnalazioniControlliDomain.ts:297`) | targa, data |
| `@richieste_attrezzature_autisti_tmp` | `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`) | autista, data |
| `@alerts_state` | `readNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1627`) | alert id |
| `@inventario` | `readNextInventarioSnapshot` (`src/next/domain/nextInventarioDomain.ts:235`) | codice/nome materiale |
| `@fornitori` | `readNextFornitoriSnapshot` (`src/next/domain/nextFornitoriDomain.ts:204`) | fornitore |
| `@officine` | `readNextOfficineSnapshot` (`src/next/domain/nextOfficineDomain.ts:204`) | officina |
| `@attrezzature_cantieri` | `readNextAttrezzatureCantieriSnapshot` (`src/next/domain/nextAttrezzatureCantieriDomain.ts:509`) | cantiere, attrezzatura |

### 3.2 Firestore: collection dirette

| Collection | Reader principale | Chiave primaria utile |
| --- | --- | --- |
| `@documenti_mezzi` | `readNextMezzoDocumentiSnapshot` (`src/next/domain/nextDocumentiMezzoDomain.ts:252`) | targa, id documento |
| `@documenti_magazzino` | `readNextMezzoDocumentiSnapshot` (`src/next/domain/nextDocumentiMezzoDomain.ts:252`) | targa, id documento |
| `@documenti_generici` | `readNextMezzoDocumentiSnapshot` (`src/next/domain/nextDocumentiMezzoDomain.ts:252`) | targa, id documento |
| `@documenti_cisterna` | `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`) | id documento, periodo |
| `@cisterna_schede_ia` | `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`) e `readNextCisternaSchedaDetail` (`src/next/domain/nextCisternaDomain.ts:842`) | id scheda, periodo |
| `@cisterna_parametri_mensili` | `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`) | mese |
| `autisti_eventi` | `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`) | id evento |
| `chat_ia_reports` | `listChatIaReportArchiveEntries` (`src/next/chat-ia/reports/chatIaReportArchive.ts:94`) | id report |
| `euromecc_pending` | `readEuromeccSnapshot` (`src/next/domain/nextEuromeccDomain.ts:394`) | id record |
| `euromecc_done` | `readEuromeccSnapshot` (`src/next/domain/nextEuromeccDomain.ts:394`) | id record |
| `euromecc_issues` | `readEuromeccSnapshot` (`src/next/domain/nextEuromeccDomain.ts:394`) | id record |
| `euromecc_area_meta` | `readEuromeccSnapshot` (`src/next/domain/nextEuromeccDomain.ts:394`) | area |

### 3.3 Firebase Storage

| Path/prefix | Uso attuale | Funzione reale |
| --- | --- | --- |
| `chat_ia_reports/<sector>/<year>/<id>.pdf` | archivio report IA generati | `createChatIaReportArchiveEntry` (`src/next/chat-ia/reports/chatIaReportArchive.ts:44`, `src/next/chat-ia/reports/chatIaReportArchive.ts:55`) |
| Prefix generico configurabile | listing clone-safe di Storage | `readNextUnifiedStoragePrefix` (`src/next/domain/nextUnifiedReadRegistryDomain.ts:233`) |

I file business gia archiviati nei documenti vengono normalmente esposti come URL/campi nei reader documentali; il download diretto puo usare il `fileUrl` restituito dai reader documenti (`src/next/domain/nextDocumentiMezzoDomain.ts:30`, `src/next/domain/nextDocumentiCostiDomain.ts:125`).

### 3.4 Clone snapshot e overlay

La NEXT applica overlay clone in vari reader. Esempi verificati:

- flotta: `readNextFlottaClonePatches` (`src/next/nextAnagraficheFlottaDomain.ts:3`, `src/next/nextAnagraficheFlottaDomain.ts:802`);
- autisti: overlay storage gestiti nel read snapshot (`src/next/domain/nextAutistiDomain.ts:1208-1220`);
- unified read registry: reader espliciti storage/collection/prefix/localStorage (`src/next/domain/nextUnifiedReadRegistryDomain.ts:116`, `src/next/domain/nextUnifiedReadRegistryDomain.ts:159`, `src/next/domain/nextUnifiedReadRegistryDomain.ts:233`, `src/next/domain/nextUnifiedReadRegistryDomain.ts:272`).

## 4. CENSIMENTO GENERATORI E COMPONENTI

### 4.1 PDF e anteprima

- `generateChatIaReportPdf`: genera PDF report chat IA (`src/next/chat-ia/reports/chatIaReportPdf.ts:23`).
- `generateInternalAiReportPdfBlob`: generatore PDF operativo riusabile (`src/next/internal-ai/internalAiReportPdf.ts:219`).
- `buildInternalAiReportPdfFileName`: naming PDF (`src/next/internal-ai/internalAiReportPdf.ts:118`).
- `buildInternalAiReportDocumentText`: testo documento report (`src/next/internal-ai/internalAiReportPdf.ts:202`).
- `openPreview`: anteprima PDF (`src/utils/pdfPreview.ts:46`).
- `sharePdfFile`: condivisione PDF (`src/utils/pdfPreview.ts:73`).
- `copyTextToClipboard`: copia testo (`src/utils/pdfPreview.ts:105`).
- `buildWhatsAppShareUrl`: URL WhatsApp (`src/utils/pdfPreview.ts:116`).

### 4.2 Archivio report chat IA

- Collection: `chat_ia_reports` (`src/next/chat-ia/reports/chatIaReportArchive.ts:8`).
- Storage prefix: `chat_ia_reports` (`src/next/chat-ia/reports/chatIaReportArchive.ts:9`).
- `createChatIaReportArchiveEntry`: crea entry archivio e salva PDF (`src/next/chat-ia/reports/chatIaReportArchive.ts:44`).
- `listChatIaReportArchiveEntries`: lista report archiviati (`src/next/chat-ia/reports/chatIaReportArchive.ts:94`).
- `readChatIaReportArchiveEntry`: legge singolo report (`src/next/chat-ia/reports/chatIaReportArchive.ts:110`).
- `markChatIaReportArchiveEntryDeleted`: segna report eliminato (`src/next/chat-ia/reports/chatIaReportArchive.ts:117`).

### 4.3 Componenti React riusabili

- `InternalAiMezzoCard` (`src/next/internal-ai/InternalAiMezzoCard.tsx:60`).
- `ChatIaMezzoCard` (`src/next/chat-ia/sectors/mezzi/ChatIaMezzoCard.tsx:5`).
- `ChatIaMezzoTimeline` (`src/next/chat-ia/sectors/mezzi/ChatIaMezzoTimeline.tsx:3`).
- `ChatIaMezzoMaterialsTable` (`src/next/chat-ia/sectors/mezzi/ChatIaMezzoMaterialsTable.tsx:8`).
- `ChatIaMezzoDocumentsList` (`src/next/chat-ia/sectors/mezzi/ChatIaMezzoDocumentsList.tsx:3`).
- Tipi output strutturati: `ChatIaOutputKind`, `ChatIaTable`, `ChatIaReport`, `ChatIaArchiveEntry`, `ChatIaRunnerResult` (`src/next/chat-ia/core/chatIaTypes.ts:25`, `src/next/chat-ia/core/chatIaTypes.ts:53`, `src/next/chat-ia/core/chatIaTypes.ts:61`, `src/next/chat-ia/core/chatIaTypes.ts:84`, `src/next/chat-ia/core/chatIaTypes.ts:156`).

### 4.4 Recharts

`recharts` e presente in `package.json` (`package.json:31`). Non e stato trovato un wrapper chart tool gia pronto nella chat IA. Serve un componente/helper nuovo per `generate_chart`, basato su Recharts.

## 5. CENSIMENTO MODALI APRIBILI

### 5.1 Route e pagine NEXT

- Dossier mezzo: `buildNextDossierPath` (`src/next/nextStructuralPaths.ts:63`) e route `/next/dossier/:targa` in `src/App.tsx:442`.
- Dossier preventivi: `buildNextDossierPreventiviPath` (`src/next/nextStructuralPaths.ts:67`).
- Dossier lista dettaglio: `buildNextDossierListaDetailPath` (`src/next/nextStructuralPaths.ts:71`).
- Dossier gomme: `buildNextDossierGommePath` (`src/next/nextStructuralPaths.ts:75`).
- Dossier rifornimenti: `buildNextDossierRifornimentiPath` (`src/next/nextStructuralPaths.ts:79`).
- Analisi economica: `buildNextAnalisiEconomicaPath` (`src/next/nextStructuralPaths.ts:83`).
- Magazzino: `buildNextMagazzinoPath` (`src/next/nextStructuralPaths.ts:46`).
- Manutenzioni: `buildNextManutenzioniPath` (`src/next/nextStructuralPaths.ts:51`).
- Cisterna: costanti `/next/cisterna`, `/next/cisterna/ia`, `/next/cisterna/schede-test` (`src/next/nextStructuralPaths.ts:33-35`).
- Chat IA: route `/next/chat` (`src/App.tsx:506`).

### 5.2 Modali e aperture locali

- `NextDossierMezzoPage` usa stato modale/edit (`src/next/NextDossierMezzoPage.tsx:148`, `src/next/NextDossierMezzoPage.tsx:161`).
- `NextMezzoEditModal` viene renderizzato nel Dossier (`src/next/NextDossierMezzoPage.tsx:521`) e il pulsante edit apre il modal (`src/next/NextDossierMezzoPage.tsx:542`).
- Componente modal edit: `NextMezzoEditModal` (`src/next/components/NextMezzoEditModal.tsx:30`, `src/next/components/NextMezzoEditModal.tsx:257`).
- Modali operativi Centro controllo: revisione, pre-collaudo, prenotazione (`src/next/NextCentroControlloPage.tsx:805`, `src/next/NextCentroControlloPage.tsx:818`, `src/next/NextCentroControlloPage.tsx:827`). Sono modali di flusso operativo e non devono diventare tool di scrittura business.

## 6. LISTA TOOL CANDIDATI

Legenda stato:

- `SUBITO`: implementabile usando reader/funzioni gia presenti.
- `ESTENSIONE`: richiede helper/tool wrapper nuovo, ma i dati base esistono.
- `NUOVO_READER`: manca un reader aggregato o un campo dimostrato.

### A. LETTURA MEZZI

1. `get_vehicle_by_plate` - `SUBITO`
   - descrizione_per_openai: Recupera la scheda anagrafica di un mezzo partendo dalla targa.
   - parametri input: `{ targa: string }`
   - shape output: `Promise<NextAnagraficheFlottaMezzoItem | null>`
   - implementazione_basata_su: `readNextMezzoByTarga` (`src/next/nextAnagraficheFlottaDomain.ts:880`), tipo `NextAnagraficheFlottaMezzoItem` (`src/next/nextAnagraficheFlottaDomain.ts:79`).
   - categoria: `lettura_mezzi`
   - prerequisiti: nessuno.

2. `list_vehicles` - `SUBITO`
   - descrizione_per_openai: Elenca i mezzi della flotta e applica filtri semplici su categoria, stato o scadenze gia presenti nello snapshot.
   - parametri input: `{ categoria?: string; testo?: string; scadenzaRevisione?: "scaduta" | "in_scadenza" | "valida" }`
   - shape output: `Promise<{ items: NextAnagraficheFlottaMezzoItem[]; total: number }>`
   - implementazione_basata_su: `readNextAnagraficheFlottaSnapshot` (`src/next/nextAnagraficheFlottaDomain.ts:763`), normalizzazione categoria (`src/next/nextAnagraficheFlottaDomain.ts:295`).
   - categoria: `lettura_mezzi`
   - prerequisiti: definire nel tool i filtri supportati senza inventare campi assenti.

3. `get_vehicle_status` - `SUBITO`
   - descrizione_per_openai: Recupera stato operativo, alert e focus di un mezzo.
   - parametri input: `{ targa: string }`
   - shape output: `Promise<{ targa: string; stato: D10Snapshot | null; mezzo: NextAnagraficheFlottaMezzoItem | null }>`
   - implementazione_basata_su: `readNextStatoOperativoSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1657`), `readNextMezzoByTarga` (`src/next/nextAnagraficheFlottaDomain.ts:880`).
   - categoria: `lettura_mezzi`
   - prerequisiti: wrapper di estrazione per targa dallo snapshot D10.

4. `get_vehicle_maintenance_history` - `SUBITO`
   - descrizione_per_openai: Recupera manutenzioni, lavori e storico tecnico di un mezzo.
   - parametri input: `{ targa: string; periodo?: { from?: string; to?: string } }`
   - shape output: `Promise<NextMezzoOperativitaTecnicaSnapshot>`
   - implementazione_basata_su: `readNextMezzoOperativitaTecnicaSnapshot` (`src/next/nextOperativitaTecnicaDomain.ts:223`), `readNextMezzoManutenzioniSnapshot` (`src/next/domain/nextManutenzioniDomain.ts:663`).
   - categoria: `lettura_mezzi`
   - prerequisiti: filtro periodo nel tool.

5. `get_vehicle_dossier_snapshot` - `SUBITO`
   - descrizione_per_openai: Recupera lo snapshot composito gia usato dal settore Mezzi v1.
   - parametri input: `{ targa: string }`
   - shape output: `Promise<ChatIaMezzoSnapshot>`
   - implementazione_basata_su: `readChatIaMezzoSnapshot` (`src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:61`), letture aggregate (`src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts:83-89`).
   - categoria: `lettura_mezzi`
   - prerequisiti: mantenere come compatibilita durante migrazione tool use.

### B. LETTURA AUTISTI

1. `list_drivers` - `SUBITO`
   - descrizione_per_openai: Elenca colleghi/autisti noti al sistema.
   - parametri input: `{ testo?: string; attivo?: boolean }`
   - shape output: `Promise<{ items: NextCollegaReadOnlyItem[]; total: number }>`
   - implementazione_basata_su: `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`), tipo `NextCollegaReadOnlyItem` (`src/next/domain/nextColleghiDomain.ts:36`).
   - categoria: `lettura_autisti`
   - prerequisiti: filtro testuale nel tool.

2. `get_driver_by_name` - `ESTENSIONE`
   - descrizione_per_openai: Trova un autista per nome o cognome e restituisce il record piu compatibile.
   - parametri input: `{ nome: string }`
   - shape output: `Promise<NextCollegaReadOnlyItem | null>`
   - implementazione_basata_su: `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`).
   - categoria: `lettura_autisti`
   - prerequisiti: helper di fuzzy match controllato su nome/cognome.

3. `get_driver_by_badge` - `ESTENSIONE`
   - descrizione_per_openai: Trova un autista per badge o identificativo equivalente se presente nei dati.
   - parametri input: `{ badge: string }`
   - shape output: `Promise<NextCollegaReadOnlyItem | null>`
   - implementazione_basata_su: `readNextColleghiSnapshot` (`src/next/domain/nextColleghiDomain.ts:266`), snapshot autisti (`src/next/domain/nextAutistiDomain.ts:1176`).
   - categoria: `lettura_autisti`
   - prerequisiti: verificare campo badge effettivo nello shape runtime; se assente, fallback su testo normalizzato.

4. `get_driver_activity` - `ESTENSIONE`
   - descrizione_per_openai: Recupera sessioni, eventi, segnalazioni, controlli e richieste collegati a un autista.
   - parametri input: `{ nome?: string; badge?: string; periodo?: { from?: string; to?: string } }`
   - shape output: `Promise<NextAutistiReadOnlySnapshot>`
   - implementazione_basata_su: `readNextAutistiReadOnlySnapshot` (`src/next/domain/nextAutistiDomain.ts:1176`), tipi attività (`src/next/domain/nextAutistiDomain.ts:86`, `src/next/domain/nextAutistiDomain.ts:102`).
   - categoria: `lettura_autisti`
   - prerequisiti: filtro per autista nel tool.

### C. LETTURA RIFORNIMENTI

1. `get_refuelings` - `SUBITO`
   - descrizione_per_openai: Recupera i rifornimenti di un mezzo in un periodo.
   - parametri input: `{ targa: string; periodo?: { from?: string; to?: string } }`
   - shape output: `Promise<NextMezzoRifornimentiSnapshot>`
   - implementazione_basata_su: `readNextMezzoRifornimentiSnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1304`), tipo rifornimento (`src/next/domain/nextRifornimentiDomain.ts:120`).
   - categoria: `lettura_rifornimenti`
   - prerequisiti: filtro periodo nel tool.

2. `get_refuelings_aggregated` - `ESTENSIONE`
   - descrizione_per_openai: Calcola litri, importi e conteggi dei rifornimenti per periodo e fonte.
   - parametri input: `{ periodo: { from?: string; to?: string }; fonte?: "cisterna" | "distributore" | "tutti" }`
   - shape output: `Promise<{ totalLitri: number; totalCosto?: number; count: number; byMonth: Array<{ month: string; litri: number; costo?: number; count: number }> }>`
   - implementazione_basata_su: `readNextRifornimentiReadOnlySnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1291`), `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`).
   - categoria: `lettura_rifornimenti`
   - prerequisiti: helper aggregazione fonte/periodo.

3. `get_consumption_average` - `ESTENSIONE`
   - descrizione_per_openai: Calcola consumo medio di un mezzo partendo dai rifornimenti disponibili.
   - parametri input: `{ targa: string; periodo?: { from?: string; to?: string } }`
   - shape output: `Promise<{ targa: string; litriTotali: number; kmTotali?: number; consumoL100Km?: number; note: string[] }>`
   - implementazione_basata_su: `readNextMezzoRifornimentiSnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1304`) e anagrafica (`src/next/nextAnagraficheFlottaDomain.ts:880`).
   - categoria: `lettura_rifornimenti`
   - prerequisiti: verificare presenza km nei rifornimenti; se mancante, restituire note senza inventare consumo.

4. `compare_refueling_sources` - `ESTENSIONE`
   - descrizione_per_openai: Confronta rifornimenti da cisterna e distributori in un periodo.
   - parametri input: `{ periodo: { from?: string; to?: string } }`
   - shape output: `Promise<{ cisterna: { litri: number; count: number }; distributori: { litri: number; count: number }; rows: Array<Record<string, unknown>> }>`
   - implementazione_basata_su: `readNextRifornimentiReadOnlySnapshot` (`src/next/domain/nextRifornimentiDomain.ts:1291`), `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`).
   - categoria: `calcoli`
   - prerequisiti: classificazione fonte basata solo su campi esistenti.

### D. LETTURA DOCUMENTI

1. `get_vehicle_documents` - `SUBITO`
   - descrizione_per_openai: Recupera i documenti associati a un mezzo.
   - parametri input: `{ targa: string; tipo?: string }`
   - shape output: `Promise<NextMezzoDocumentiSnapshot>`
   - implementazione_basata_su: `readNextMezzoDocumentiSnapshot` (`src/next/domain/nextDocumentiMezzoDomain.ts:252`).
   - categoria: `lettura_documenti`
   - prerequisiti: nessuno.

2. `get_document_costs_by_vehicle` - `SUBITO`
   - descrizione_per_openai: Recupera documenti/costi collegati a un mezzo.
   - parametri input: `{ targa: string; periodo?: { from?: string; to?: string } }`
   - shape output: `Promise<NextMezzoDocumentiCostiSnapshot>`
   - implementazione_basata_su: `readNextMezzoDocumentiCostiSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2313`), `readNextMezzoDocumentiCostiPeriodView` (`src/next/domain/nextDocumentiCostiDomain.ts:2391`).
   - categoria: `lettura_documenti`
   - prerequisiti: nessuno.

3. `download_document_pdf` - `SUBITO`
   - descrizione_per_openai: Restituisce URL e metadati di un documento scaricabile se gia presenti nei record.
   - parametri input: `{ targa?: string; documentId?: string }`
   - shape output: `Promise<{ documentId: string; fileUrl?: string; fileName?: string; source: string } | null>`
   - implementazione_basata_su: `NextDocumentoMezzoItem` (`src/next/domain/nextDocumentiMezzoDomain.ts:30`), `readNextMezzoDocumentiSnapshot` (`src/next/domain/nextDocumentiMezzoDomain.ts:252`).
   - categoria: `lettura_documenti`
   - prerequisiti: tool non scarica bytes; restituisce link/metadati.

4. `get_invoice_by_id` - `ESTENSIONE`
   - descrizione_per_openai: Cerca un documento/fattura per id negli archivi documentali NEXT.
   - parametri input: `{ id: string }`
   - shape output: `Promise<NextIADocumentiArchiveItem | NextDocumentiCostiReadOnlyItem | null>`
   - implementazione_basata_su: `readNextIADocumentiArchiveSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2010`), `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
   - categoria: `lettura_documenti`
   - prerequisiti: helper di ricerca per id su snapshot multipli.

### E. LETTURA SEGNALAZIONI E CONTROLLI

1. `get_vehicle_events` - `SUBITO`
   - descrizione_per_openai: Recupera segnalazioni e controlli di un mezzo.
   - parametri input: `{ targa: string; periodo?: { from?: string; to?: string } }`
   - shape output: `Promise<NextMezzoSegnalazioniControlliSnapshot>`
   - implementazione_basata_su: `readNextMezzoSegnalazioniControlliSnapshot` (`src/next/domain/nextSegnalazioniControlliDomain.ts:297`).
   - categoria: `lettura_segnalazioni`
   - prerequisiti: filtro periodo nel tool.

2. `get_historical_operational_events` - `ESTENSIONE`
   - descrizione_per_openai: Recupera eventi storici operativi D10 e li filtra per targa, periodo o testo.
   - parametri input: `{ targa?: string; periodo?: { from?: string; to?: string }; query?: string }`
   - shape output: `Promise<{ items: D10StoricoEventoItem[]; total: number }>`
   - implementazione_basata_su: `readNextCentroControlloSnapshot` (`src/next/domain/nextCentroControlloDomain.ts:1627`), tipo `D10StoricoEventoItem` (`src/next/domain/nextCentroControlloDomain.ts:134`).
   - categoria: `lettura_segnalazioni`
   - prerequisiti: helper filtro testuale/periodo.

3. `search_events` - `NUOVO_READER`
   - descrizione_per_openai: Cerca testualmente segnalazioni, controlli ed eventi storici su tutta la flotta.
   - parametri input: `{ query: string; periodo?: { from?: string; to?: string }; targa?: string }`
   - shape output: `Promise<{ matches: Array<{ data?: string; targa?: string; fonte: "segnalazione" | "controllo" | "evento"; descrizione: string; score?: number }>; total: number }>`
   - implementazione_basata_su: reader mezzo-centrico `readNextMezzoSegnalazioniControlliSnapshot` (`src/next/domain/nextSegnalazioniControlliDomain.ts:297`) e D10 (`src/next/domain/nextCentroControlloDomain.ts:1627`).
   - categoria: `lettura_segnalazioni`
   - prerequisiti: nuovo reader aggregato flotta-wide o uso D10/autisti snapshot con normalizzazione testuale esplicita.

### F. LETTURA COSTI

1. `get_costs` - `SUBITO`
   - descrizione_per_openai: Recupera costi per mezzo o per flotta in un periodo.
   - parametri input: `{ targa?: string; periodo?: { from?: string; to?: string }; categoria?: string }`
   - shape output: `Promise<NextMezzoDocumentiCostiSnapshot | NextDocumentiCostiFleetSnapshot>`
   - implementazione_basata_su: `readNextMezzoDocumentiCostiSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2313`), `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
   - categoria: `lettura_costi`
   - prerequisiti: wrapper decide mezzo/flotta.

2. `get_cost_aggregates` - `ESTENSIONE`
   - descrizione_per_openai: Aggrega costi per periodo, categoria, mezzo o flotta.
   - parametri input: `{ periodo?: { from?: string; to?: string }; categoria?: string; groupBy?: "mese" | "mezzo" | "categoria" }`
   - shape output: `Promise<{ total: number; count: number; buckets: Array<{ key: string; total: number; count: number }> }>`
   - implementazione_basata_su: `readNextDocumentiCostiFleetSnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2247`), tipo costo (`src/next/domain/nextDocumentiCostiDomain.ts:125`).
   - categoria: `calcoli`
   - prerequisiti: helper aggregazione.

3. `get_procurement_costs` - `SUBITO`
   - descrizione_per_openai: Legge ordini, preventivi, approvazioni e listino procurement.
   - parametri input: `{ stato?: string; fornitore?: string; testo?: string }`
   - shape output: `Promise<NextProcurementSnapshot | NextProcurementReadOnlySnapshot>`
   - implementazione_basata_su: `readNextProcurementSnapshot` (`src/next/domain/nextProcurementDomain.ts:906`), `readNextProcurementReadOnlySnapshot` (`src/next/domain/nextDocumentiCostiDomain.ts:2092`).
   - categoria: `lettura_costi`
   - prerequisiti: filtro nel tool.

4. `get_capo_costs_by_vehicle` - `SUBITO`
   - descrizione_per_openai: Recupera riepiloghi costi mezzo usati dal dominio capo.
   - parametri input: `{ targa?: string }`
   - shape output: `Promise<NextCapoCostiMezzoSnapshot>`
   - implementazione_basata_su: `readNextCapoCostiMezzoSnapshot` (`src/next/domain/nextCapoDomain.ts:507`).
   - categoria: `lettura_costi`
   - prerequisiti: filtro targa se richiesto.

### G. LETTURA CISTERNA

1. `get_cisterna_snapshot` - `SUBITO`
   - descrizione_per_openai: Recupera snapshot Cisterna con documenti, schede, supporto autisti e parametri mensili.
   - parametri input: `{ monthKey?: string }`
   - shape output: `Promise<NextCisternaSnapshot>`
   - implementazione_basata_su: `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`), tipo `NextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:168`).
   - categoria: `lettura_cisterna`
   - prerequisiti: nessuno.

2. `get_cisterna_refuelings` - `SUBITO`
   - descrizione_per_openai: Recupera rifornimenti e righe schede Cisterna nel periodo.
   - parametri input: `{ monthKey?: string; periodo?: { from?: string; to?: string } }`
   - shape output: `Promise<{ supportItems: NextCisternaSupportItem[]; schede: NextCisternaSchedaItem[] }>`
   - implementazione_basata_su: `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`), tipi `NextCisternaSupportItem` e `NextCisternaSchedaItem` (`src/next/domain/nextCisternaDomain.ts:85`, `src/next/domain/nextCisternaDomain.ts:115`).
   - categoria: `lettura_cisterna`
   - prerequisiti: mapping righe schede/supporto.

3. `get_cisterna_documents` - `SUBITO`
   - descrizione_per_openai: Recupera documenti Cisterna caricati e analizzati.
   - parametri input: `{ monthKey?: string; fornitore?: string }`
   - shape output: `Promise<{ items: NextCisternaDocumentItem[]; total: number }>`
   - implementazione_basata_su: `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`), tipo `NextCisternaDocumentItem` (`src/next/domain/nextCisternaDomain.ts:93`).
   - categoria: `lettura_cisterna`
   - prerequisiti: filtro nel tool.

4. `get_cisterna_levels` - `NUOVO_READER`
   - descrizione_per_openai: Recupera livelli/giacenze Cisterna se il dato e disponibile.
   - parametri input: `{ monthKey?: string }`
   - shape output: `Promise<{ level?: number; unit?: string; source: string; note: string[] }>`
   - implementazione_basata_su: punto di partenza `readNextCisternaSnapshot` (`src/next/domain/nextCisternaDomain.ts:1240`).
   - categoria: `lettura_cisterna`
   - prerequisiti: dato livello non dimostrato nel reader censito; serve reader/campo verificato prima di esporre il tool come operativo.

### H. CALCOLI E AGGREGATI

1. `compute_average` - `ESTENSIONE`
   - descrizione_per_openai: Calcola una media numerica su un dataset gia letto da un altro tool.
   - parametri input: `{ datasetRef: string; campo: string; groupBy?: string }`
   - shape output: `Promise<{ average: number; count: number; groups?: Array<{ key: string; average: number; count: number }> }>`
   - implementazione_basata_su: dataset rifornimenti (`src/next/domain/nextRifornimentiDomain.ts:1291`) o costi (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
   - categoria: `calcoli`
   - prerequisiti: helper generico validato su campi numerici espliciti.

2. `compare_periods` - `ESTENSIONE`
   - descrizione_per_openai: Confronta totali o medie tra due periodi su dati letti da tool esistenti.
   - parametri input: `{ datasetRef: string; periodoA: { from?: string; to?: string }; periodoB: { from?: string; to?: string }; campo: string }`
   - shape output: `Promise<{ a: number; b: number; delta: number; deltaPercent?: number }>`
   - implementazione_basata_su: rifornimenti (`src/next/domain/nextRifornimentiDomain.ts:1291`), costi (`src/next/domain/nextDocumentiCostiDomain.ts:2247`), Cisterna (`src/next/domain/nextCisternaDomain.ts:1240`).
   - categoria: `calcoli`
   - prerequisiti: helper periodo comune.

3. `find_outliers` - `ESTENSIONE`
   - descrizione_per_openai: Individua valori anomali in dati numerici gia letti.
   - parametri input: `{ datasetRef: string; campo: string; soglia?: number }`
   - shape output: `Promise<{ items: Array<Record<string, unknown>>; method: "threshold" | "iqr"; total: number }>`
   - implementazione_basata_su: rifornimenti (`src/next/domain/nextRifornimentiDomain.ts:1291`) e costi (`src/next/domain/nextDocumentiCostiDomain.ts:2247`).
   - categoria: `calcoli`
   - prerequisiti: definire metodo semplice, spiegabile e deterministico.

### I. GENERATORI

1. `generate_report_pdf` - `SUBITO`
   - descrizione_per_openai: Genera un PDF di report a partire da contenuto strutturato della chat.
   - parametri input: `{ title: string; sections: Array<{ title: string; body: string }>; sector?: string }`
   - shape output: `Promise<{ blob: Blob; fileName: string }>`
   - implementazione_basata_su: `generateChatIaReportPdf` (`src/next/chat-ia/reports/chatIaReportPdf.ts:23`), `generateInternalAiReportPdfBlob` (`src/next/internal-ai/internalAiReportPdf.ts:219`).
   - categoria: `generatori`
   - prerequisiti: adattatore tool verso shape report.

2. `save_report_to_archive` - `SUBITO`
   - descrizione_per_openai: Salva un report generato nell'archivio chat IA.
   - parametri input: `{ report: ChatIaReport; pdfBlob: Blob }`
   - shape output: `Promise<ChatIaArchiveEntry>`
   - implementazione_basata_su: `createChatIaReportArchiveEntry` (`src/next/chat-ia/reports/chatIaReportArchive.ts:44`), tipo `ChatIaArchiveEntry` (`src/next/chat-ia/core/chatIaTypes.ts:84`).
   - categoria: `archivio`
   - prerequisiti: scrittura ammessa solo per archivio report, non business.

3. `generate_chart` - `ESTENSIONE`
   - descrizione_per_openai: Genera una descrizione dati per grafico semplice renderizzabile in UI.
   - parametri input: `{ type: "bar" | "line" | "pie"; data: Array<Record<string, unknown>>; xKey: string; yKey: string }`
   - shape output: `Promise<{ type: "bar" | "line" | "pie"; data: Array<Record<string, unknown>>; xKey: string; yKey: string }>`
   - implementazione_basata_su: `recharts` disponibile (`package.json:31`) e tipi output strutturati chat (`src/next/chat-ia/core/chatIaTypes.ts:25`, `src/next/chat-ia/core/chatIaTypes.ts:53`).
   - categoria: `generatori`
   - prerequisiti: creare wrapper React chart per la chat IA.

### J. AZIONI UI

1. `open_dossier_page` - `SUBITO`
   - descrizione_per_openai: Propone/apre la pagina Dossier Mezzo per una targa.
   - parametri input: `{ targa: string }`
   - shape output: `Promise<{ route: string }>`
   - implementazione_basata_su: `buildNextDossierPath` (`src/next/nextStructuralPaths.ts:63`), route Dossier (`src/App.tsx:442`).
   - categoria: `ui_actions`
   - prerequisiti: azione client-side, nessuna scrittura.

2. `open_vehicle_edit_modal` - `ESTENSIONE`
   - descrizione_per_openai: Apre il modal edit mezzo nella pagina Dossier, senza salvare modifiche.
   - parametri input: `{ targa: string }`
   - shape output: `Promise<{ route: string; modal: "vehicle_edit" }>`
   - implementazione_basata_su: `NextMezzoEditModal` (`src/next/components/NextMezzoEditModal.tsx:257`), render nel dossier (`src/next/NextDossierMezzoPage.tsx:521`), pulsante apertura (`src/next/NextDossierMezzoPage.tsx:542`).
   - categoria: `ui_actions`
   - prerequisiti: supporto route-state o query param per aprire il modal senza click manuale.

3. `navigate_to` - `SUBITO`
   - descrizione_per_openai: Naviga verso una route NEXT nota e sicura.
   - parametri input: `{ route: string }`
   - shape output: `Promise<{ route: string }>`
   - implementazione_basata_su: costanti `src/next/nextStructuralPaths.ts:1-38`.
   - categoria: `ui_actions`
   - prerequisiti: whitelist route.

4. `open_magazzino_section` - `SUBITO`
   - descrizione_per_openai: Apre Magazzino NEXT in una sezione supportata dal builder.
   - parametri input: `{ section?: string }`
   - shape output: `Promise<{ route: string }>`
   - implementazione_basata_su: `buildNextMagazzinoPath` (`src/next/nextStructuralPaths.ts:46`).
   - categoria: `ui_actions`
   - prerequisiti: sezione whitelist.

### K. ARCHIVIO

1. `list_archived_reports` - `SUBITO`
   - descrizione_per_openai: Elenca i report chat IA archiviati.
   - parametri input: `{ sector?: string; limit?: number }`
   - shape output: `Promise<ChatIaArchiveEntry[]>`
   - implementazione_basata_su: `listChatIaReportArchiveEntries` (`src/next/chat-ia/reports/chatIaReportArchive.ts:94`).
   - categoria: `archivio`
   - prerequisiti: nessuno.

2. `retrieve_archived_report` - `SUBITO`
   - descrizione_per_openai: Recupera metadati e link di un report chat IA archiviato.
   - parametri input: `{ id: string }`
   - shape output: `Promise<ChatIaArchiveEntry | null>`
   - implementazione_basata_su: `readChatIaReportArchiveEntry` (`src/next/chat-ia/reports/chatIaReportArchive.ts:110`).
   - categoria: `archivio`
   - prerequisiti: nessuno.

3. `delete_archived_report` - `SUBITO`
   - descrizione_per_openai: Segna eliminato un report chat IA archiviato, senza toccare dati business.
   - parametri input: `{ id: string }`
   - shape output: `Promise<void>`
   - implementazione_basata_su: `markChatIaReportArchiveEntryDeleted` (`src/next/chat-ia/reports/chatIaReportArchive.ts:117`).
   - categoria: `archivio`
   - prerequisiti: confermare se Giuseppe vuole esporre eliminazione archivio come tool; non e scrittura business.

## 7. STIMA EFFORT PER GRUPPO

| Gruppo | Tool totali | SUBITO | ESTENSIONE | NUOVO_READER | Complessita |
| --- | ---: | ---: | ---: | ---: | --- |
| A. Lettura mezzi | 5 | 5 | 0 | 0 | S |
| B. Lettura autisti | 4 | 1 | 3 | 0 | M |
| C. Lettura rifornimenti | 4 | 1 | 3 | 0 | M |
| D. Lettura documenti | 4 | 3 | 1 | 0 | M |
| E. Segnalazioni/controlli | 3 | 1 | 1 | 1 | M |
| F. Costi | 4 | 3 | 1 | 0 | M |
| G. Cisterna | 4 | 3 | 0 | 1 | M |
| H. Calcoli/aggregati | 3 | 0 | 3 | 0 | M |
| I. Generatori | 3 | 2 | 1 | 0 | M |
| J. Azioni UI | 4 | 3 | 1 | 0 | S |
| K. Archivio | 3 | 3 | 0 | 0 | S |
| Totale | 41 | 25 | 14 | 2 | M |

## 8. ZONE OSCURE E DECISIONI APERTE

1. Ricerca testuale flotta-wide: `readNextMezzoSegnalazioniControlliSnapshot` e mezzo-centrico (`src/next/domain/nextSegnalazioniControlliDomain.ts:297`). Per `search_events` serve reader aggregato o composizione esplicita da D10/autisti.
2. Livelli Cisterna: `readNextCisternaSnapshot` esiste (`src/next/domain/nextCisternaDomain.ts:1240`), ma un campo livello/giacenza non e stato dimostrato nel censimento. Non esporre `get_cisterna_levels` come operativo finche il dato non e verificato.
3. Consumi l/100km: i rifornimenti sono letti (`src/next/domain/nextRifornimentiDomain.ts:1304`), ma il tool deve verificare se km iniziale/finale sono presenti nei record prima di calcolare. Se mancano, deve rispondere con litri totali e nota tecnica.
4. Badge autista: `readNextColleghiSnapshot` legge colleghi (`src/next/domain/nextColleghiDomain.ts:266`), ma il campo badge va verificato sullo shape runtime prima di promettere matching forte.
5. Grafici: `recharts` e disponibile (`package.json:31`), ma non esiste un wrapper grafici chat IA gia pronto. Serve componente/tool output nuovo.
6. Azioni UI modali: alcune aperture sono solo stato React locale (`src/next/NextDossierMezzoPage.tsx:161`, `src/next/NextDossierMezzoPage.tsx:542`). Per apertura diretta da chat serve route-state/query param; niente salvataggi automatici.
7. Tool archivio eliminazione: `markChatIaReportArchiveEntryDeleted` esiste (`src/next/chat-ia/reports/chatIaReportArchive.ts:117`), ma va deciso se esporlo a OpenAI o tenerlo come azione manuale UI.

## 9. RACCOMANDAZIONI PRIORITA TOOL DA IMPLEMENTARE PRIMA

1. `get_vehicle_by_plate`
2. `list_vehicles`
3. `get_vehicle_dossier_snapshot`
4. `get_vehicle_documents`
5. `get_vehicle_events`
6. `get_refuelings`
7. `get_refuelings_aggregated`
8. `get_costs`
9. `generate_report_pdf`
10. `list_archived_reports`

Motivo: questi 10 tool coprono il valore immediato della chat quotidiana senza nuovi reader pesanti: mezzi, documenti, eventi, rifornimenti, costi, report e archivio.

## 10. APPENDICE: FILE LETTI

- `package.json`
- `src/App.tsx`
- `src/next/nextStructuralPaths.ts`
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/next/domain/nextLavoriDomain.ts`
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `src/next/domain/nextProcurementDomain.ts`
- `src/next/domain/nextDocumentiCostiDomain.ts`
- `src/next/domain/nextDocumentiMezzoDomain.ts`
- `src/next/domain/nextSegnalazioniControlliDomain.ts`
- `src/next/domain/nextCisternaDomain.ts`
- `src/next/domain/nextCentroControlloDomain.ts`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextCapoDomain.ts`
- `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- `src/next/domain/nextInventarioDomain.ts`
- `src/next/domain/nextColleghiDomain.ts`
- `src/next/domain/nextFornitoriDomain.ts`
- `src/next/domain/nextOfficineDomain.ts`
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/domain/nextOperativitaGlobaleDomain.ts`
- `src/next/domain/nextIaLibrettoDomain.ts`
- `src/next/domain/nextAttrezzatureCantieriDomain.ts`
- `src/next/chat-ia/core/chatIaTypes.ts`
- `src/next/chat-ia/reports/chatIaReportArchive.ts`
- `src/next/chat-ia/reports/chatIaReportPdf.ts`
- `src/next/internal-ai/internalAiReportPdf.ts`
- `src/utils/pdfPreview.ts`
- `src/next/internal-ai/InternalAiMezzoCard.tsx`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziData.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziReport.ts`
- `src/next/chat-ia/sectors/mezzi/chatIaMezziTimeline.ts`
- `src/next/chat-ia/sectors/mezzi/ChatIaMezzoCard.tsx`
- `src/next/chat-ia/sectors/mezzi/ChatIaMezzoTimeline.tsx`
- `src/next/chat-ia/sectors/mezzi/ChatIaMezzoMaterialsTable.tsx`
- `src/next/chat-ia/sectors/mezzi/ChatIaMezzoDocumentsList.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/components/NextMezzoEditModal.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextCisternaPage.tsx`
