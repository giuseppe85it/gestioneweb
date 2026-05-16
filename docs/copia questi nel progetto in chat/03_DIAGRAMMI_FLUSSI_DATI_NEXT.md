# DIAGRAMMI FLUSSI DATI NEXT

Data originale: 2026-05-07 — Aggiornato: 2026-05-16

## Aggiornamento 2026-05-16

Delta dal 2026-05-08 al 2026-05-16. Origine: `DIARIO_DECISIONI.md` + `AUDIT_CICLO_SEGNALAZIONE_2026-05-14` + `AUDIT_NEXT_COMPLETO_2026-05-16.md`. I diagrammi originali restano per memoria storica; le note qui sotto indicano cosa è cambiato.

- `[OBSOLETO]` Diagrammi che mostrano `@lavori` come fonte attiva scritta da NEXT (sezioni 1, 7, 12) — post dismissione 2026-05-12/13: la NEXT NON scrive più `@lavori`, e non lo legge più come modulo Lavori. La madre continua via strategia 3a; `@lavori` Firestore intoccabile. Conseguenze sui diagrammi:
  - sezione 1 "Panoramica dataset condivisi": le frecce verso `@lavori` (non esplicite ma implicate dal modulo Lavori) non sono più scritte da NEXT.
  - sezione 7 "Dossier mezzo composito": il nodo `Lavori[(storage/@lavori)]` resta letto dal `Composite` solo per record legacy migrati, non più come fonte attiva di scrittura NEXT.
  - sezione 12 "Flussi ad alto rischio": il rischio `@lavori` resta solo per scritture madre.
- `[AGGIORNATO]` Sezione 2 "Manutenzioni -> Magazzino -> Dossier/Centro": ora include il flusso `closureOrchestrator` ([src/next/helpers/closureOrchestrator.ts](../../src/next/helpers/closureOrchestrator.ts)) che propaga la chiusura della manutenzione alle sorgenti collegate (`@segnalazioni_autisti_tmp` / `@controlli_mezzo_autisti`). Stati `daFare`/`programmata`/`eseguita`/`chiusa_da_evento` su `@manutenzioni` (decisione 2026-05-14 macchina chiusura ciclo eventi).
- `[NUOVO]` Flusso `chiusa_da_evento` (macchina chiusura ciclo eventi, 2026-05-14):
  ```mermaid
  flowchart TD
    GommeEvento[(storage/@gomme_eventi)]
    ChiusuraWriter[src/next/writers/nextChiusuraEventoWriter.ts]
    Manut[(storage/@manutenzioni)]
    Segn[(storage/@segnalazioni_autisti_tmp)]
    Contr[(storage/@controlli_mezzo_autisti)]
    Orchestrator[src/next/helpers/closureOrchestrator.ts]
    AggancioModal[NextAggancioEventoModal.tsx]
    AggancioInverso[agganciaSegnalazioneAManutenzioneEsistente.ts]

    AggancioModal -->|aggancio retroattivo| ChiusuraWriter
    ChiusuraWriter -->|stato=chiusa_da_evento| Manut
    ChiusuraWriter -->|stato=chiusa| Segn
    ChiusuraWriter -->|stato=chiusa| Contr
    Manut --> Orchestrator
    Orchestrator -->|propaga chiusura| Segn
    Orchestrator -->|propaga chiusura| Contr
    GommeEvento -.->|via chiusuraDi=gomme_evento| Manut
    AggancioInverso -->|aggancio inverso PROMPT47| Manut
    AggancioInverso -->|chiusura propagata| Segn
  ```
- `[AGGIORNATO]` Sezione 6 "Autisti, Inbox e consolidamento": il diagramma resta corretto per il flusso driver→inbox→admin, ma i writer NEXT esistono in forma scoped: `markSegnalazioneChiusa` ([src/next/nextSegnalazioniWriter.ts](../../src/next/nextSegnalazioniWriter.ts)), `markControlloChiuso` ([src/next/nextControlliWriter.ts](../../src/next/nextControlliWriter.ts)), `markRichiestaEvasa`, `createManutenzioneDaFareFromEvento` ([src/next/writers/nextManutenzioneDaFareCreateWriter.ts](../../src/next/writers/nextManutenzioneDaFareCreateWriter.ts)). Hard-delete mezzo via `nextMezzoHardDeleteWriter` cascade 11 dataset (2026-05-09). `NextHomeAutistiEventoModal` ora autonomo, non wrappa più madre (PROMPT 28 2026-05-14).
- `[AGGIORNATO]` Sezione 11 "Chat IA NEXT e backend internal-ai": Chat IA NEXT V1 CHIUSA al 2026-05-06; 5 viste certificate (Driver360/Vehicle360/Site360/Euromecc360/Ricerca360); Zero-Invenzioni; Blocco 8 chiuso (Playwright 17-21 PASS 10/10). Schema strict elimina `text` libero; output `resolvedFilters.v2` deterministico dal backend; renderer non legge testo LLM.
- `[NUOVO]` Sidebar NEXT: voce "Lavori" rimossa (PROMPT 23-25, decisione 2026-05-13). Route `/next/lavori-*` ora redirect compat.
- `[NUOVO]` Modulo Archivio Storico in CC ([src/next/centroControllo/archivioStorico/](../../src/next/centroControllo/archivioStorico/)) — non rappresentato come diagramma; vedi `AUDIT_NEXT_COMPLETO_2026-05-16.md` cap. 1.3.

Questi diagrammi rappresentano solo flussi dimostrati nel codice NEXT. Le label indicano lettura o scrittura verso dataset reali.

## 1. Panoramica dataset condivisi NEXT

```mermaid
flowchart TD
  App[App.tsx /next routes]
  Shell[NextShell]
  App --> Shell
  Shell --> Centro[Centro Controllo]
  Shell --> Magazzino[Magazzino]
  Shell --> Manutenzioni[Manutenzioni]
  Shell --> Dossier[Dossier Mezzo]
  Shell --> Procurement[Procurement]
  Shell --> Anagrafiche[Anagrafiche]
  Shell --> Autisti[Autisti Admin/InBox]
  Shell --> Cisterna[Cisterna]
  Shell --> Euromecc[Euromecc]
  Shell --> Chat[Chat IA]

  Mezzi[(storage/@mezzi_aziendali)]
  Inventario[(storage/@inventario)]
  Materiali[(storage/@materialiconsegnati)]
  ManutData[(storage/@manutenzioni)]
  Ordini[(storage/@ordini)]
  Rifornimenti[(storage/@rifornimenti)]
  DocumentiMezzi[(@documenti_mezzi)]

  Anagrafiche -->|scrive| Mezzi
  Magazzino -->|scrive| Inventario
  Magazzino -->|scrive| Materiali
  Manutenzioni -->|scrive| ManutData
  Manutenzioni -->|scala/scrive| Inventario
  Manutenzioni -->|scrive movimenti| Materiali
  Procurement -->|scrive| Ordini
  Euromecc -->|genera ordine| Ordini
  Autisti -->|consolida| Rifornimenti
  Dossier -->|legge| Mezzi
  Dossier -->|legge| ManutData
  Dossier -->|legge| Materiali
  Dossier -->|legge| Rifornimenti
  Dossier -->|legge| DocumentiMezzi
  Chat -->|richiede viste certificate| BackendIA[backend/internal-ai]
```

## 2. Manutenzioni -> Magazzino -> Dossier/Centro

```mermaid
flowchart TD
  ManPage[NextManutenzioniPage]
  ManDomain[nextManutenzioniDomain]
  ManPage --> ManDomain
  ManDomain -->|legge/scrive| Manut[(storage/@manutenzioni)]
  ManDomain -->|legge/scrive se materiali| Inv[(storage/@inventario)]
  ManDomain -->|legge/scrive movimenti| Mat[(storage/@materialiconsegnati)]
  ManDomain -->|legge metadata| DocMezzi[(@documenti_mezzi)]

  Mag[NextMagazzinoPage]
  Mag -->|legge/scrive| Inv
  Mag -->|legge/scrive| Mat

  Dossier[NextDossierMezzoPage]
  Dossier -->|legge manutenzioni/gomme| Manut
  Dossier -->|legge materiali| Mat

  Centro[NextCentroControlloParityPage]
  Centro -->|legge eventi e scadenze aggregate| Manut
```

Fonti: `nextManutenzioniDomain.ts:978-994`, `nextManutenzioniDomain.ts:1012-1088`, `NextMagazzinoPage.tsx:1588-1602`, `nextDossierMezzoDomain.ts:770-776`.

## 3. Magazzino e movimenti materiali

```mermaid
flowchart TD
  Mag[NextMagazzinoPage]
  Inv[(storage/@inventario)]
  Consegnati[(storage/@materialiconsegnati)]
  AdBlue[(storage/@cisterne_adblue)]
  StorageFoto[(Firebase Storage foto materiali)]
  Operativita[NextOperativitaGlobalePage]
  Dossier[NextDossierMezzoPage]
  Manut[NextManutenzioniPage]

  Mag -->|persistInventario| Inv
  Mag -->|persistConsegne| Consegnati
  Mag -->|persistCambi| AdBlue
  Mag -->|uploadInventarioPhoto| StorageFoto
  Operativita -->|legge| Inv
  Operativita -->|legge| Consegnati
  Dossier -->|legge| Consegnati
  Manut -->|legge inventario workspace| Inv
```

Fonti: `NextMagazzinoPage.tsx:803-815`, `:1588-1611`, `nextOperativitaGlobaleDomain.ts:345-349`.

## 4. Procurement, preventivi e ordini

```mermaid
flowchart TD
  MaterialiDaOrd[NextMaterialiDaOrdinarePage]
  ProcurementPanel[NextProcurementReadOnlyPanel]
  PreventivoManuale[NextPreventivoManualeModal]
  PreventivoWriter[nextPreventivoManualeWriter]
  Euromecc[NextEuromeccPage]
  Ordini[(storage/@ordini)]
  Preventivi[(storage/@preventivi)]
  Listino[(storage/@listino_prezzi)]
  Approvals[(storage/@preventivi_approvazioni)]
  Storage[(Firebase Storage allegati)]
  Capo[NextCapoCostiMezzoPage]
  Mag[NextMagazzinoPage]

  MaterialiDaOrd -->|crea ordine| Ordini
  ProcurementPanel -->|aggiorna/cancella ordine| Ordini
  Euromecc -->|genera ordine ricambi| Ordini
  PreventivoManuale --> PreventivoWriter
  PreventivoWriter -->|salva| Preventivi
  PreventivoWriter -->|upsert| Listino
  PreventivoWriter -->|upload PDF/foto| Storage
  Capo -->|legge costi/approvazioni| Approvals
  Capo -->|legge| Preventivi
  Mag -->|legge procurement support| Ordini
```

Fonti: `NextMaterialiDaOrdinarePage.tsx:1164`, `NextProcurementReadOnlyPanel.tsx:264`, `:598`, `nextPreventivoManualeWriter.ts:298`, `:408`, `NextEuromeccPage.tsx:3031`.

## 5. Anagrafiche e flotta

```mermaid
flowchart TD
  Ana[NextAnagrafichePage]
  Writer[nextAnagraficheWriter / nextMezziWriter]
  Colleghi[(storage/@colleghi)]
  Fornitori[(storage/@fornitori)]
  Officine[(storage/@officine)]
  Mezzi[(storage/@mezzi_aziendali)]
  Scad[NextScadenzeCollaudiPage]
  Dossier[NextDossierMezzoPage]
  Capo[NextCapoMezziPage]
  Autisti[NextAutisti setup/admin]

  Ana --> Writer
  Writer -->|upsert/delete| Colleghi
  Writer -->|upsert/delete| Fornitori
  Writer -->|upsert/delete| Officine
  Writer -->|update/delete| Mezzi
  Scad -->|legge officine e scrive collaudi su mezzi| Officine
  Scad --> Mezzi
  Dossier -->|legge| Mezzi
  Capo -->|legge| Mezzi
  Autisti -->|legge mezzi/colleghi| Mezzi
  Autisti --> Colleghi
```

Fonti: `nextAnagraficheWriter.ts:170-229`, `nextMezziWriter.ts:121-157`, `nextScadenzeCollaudiWriter.ts:115-242`.

## 6. Autisti, Inbox e consolidamento

```mermaid
flowchart TD
  Driver[App Autisti NEXT driver pages]
  SessionLocal[(localStorage autista/mezzo)]
  Inbox[Autisti Inbox NEXT]
  Admin[NextAutistiAdminNative]
  Sessioni[(storage/@autisti_sessione_attive)]
  Eventi[(storage/@storico_eventi_operativi)]
  Segn[(storage/@segnalazioni_autisti_tmp)]
  Controlli[(storage/@controlli_mezzo_autisti)]
  Richieste[(storage/@richieste_attrezzature_autisti_tmp)]
  GommeTmp[(storage/@cambi_gomme_autisti_tmp)]
  Gomme[(storage/@gomme_eventi)]
  RifTmp[(storage/@rifornimenti_autisti_tmp)]
  Rif[(storage/@rifornimenti)]
  Centro[Centro Controllo]
  DossierRif[Dossier Rifornimenti]

  Driver -->|salva sessione locale| SessionLocal
  Driver -. read-only invio business .-> Segn
  Inbox -->|legge| Sessioni
  Inbox -->|legge| Eventi
  Inbox -->|legge| Segn
  Inbox -->|legge| Controlli
  Admin -->|aggiorna| Sessioni
  Admin -->|aggiorna| Eventi
  Admin -->|gestisce| Segn
  Admin -->|gestisce| Controlli
  Admin -->|gestisce| Richieste
  Admin -->|approva gomme| GommeTmp
  Admin -->|scrive ufficiale| Gomme
  Admin -->|consolida| RifTmp
  Admin -->|scrive dossier| Rif
  Centro -->|legge| Eventi
  Centro -->|legge| Segn
  Centro -->|legge| Controlli
  DossierRif -->|legge| Rif
```

Fonti: `NextAutistiRifornimentoPage.tsx:157`, `NextAutistiSegnalazioniPage.tsx:371`, `NextAutistiAdminNative.tsx:1052-2206`, `nextCentroControlloDomain.ts:16-21`.

## 7. Dossier mezzo composito

```mermaid
flowchart TD
  Dossier[NextDossierMezzoPage]
  Composite[nextDossierMezzoDomain.readNextDossierMezzoCompositeSnapshot]
  Mezzi[(storage/@mezzi_aziendali)]
  Analisi[(@analisi_economica_mezzi)]
  Lavori[(storage/@lavori)]
  Materiali[(storage/@materialiconsegnati)]
  Manut[(storage/@manutenzioni)]
  GommeTmp[(storage/@cambi_gomme_autisti_tmp)]
  Gomme[(storage/@gomme_eventi)]
  Rifornimenti[(storage/@rifornimenti + @rifornimenti_autisti_tmp)]
  Docs[(@documenti_mezzi/@documenti_magazzino/@documenti_generici)]
  Procurement[(storage/@preventivi/@listino_prezzi)]

  Dossier --> Composite
  Composite --> Mezzi
  Composite --> Analisi
  Composite --> Lavori
  Composite --> Materiali
  Composite --> Manut
  Composite --> GommeTmp
  Composite --> Gomme
  Composite --> Rifornimenti
  Composite --> Docs
  Composite --> Procurement
```

Fonti: `nextDossierMezzoDomain.ts:747-776`, `nextDocumentiCostiDomain.ts:1903`, `nextRifornimentiDomain.ts:1346`.

## 8. IA documentale e archivi

```mermaid
flowchart TD
  Archivista[NextIAArchivistaPage]
  BridgeMezzo[ArchivistaDocumentoMezzoBridge]
  BridgeMag[ArchivistaMagazzinoBridge]
  BridgeMan[ArchivistaManutenzioneBridge]
  ArchiveClient[ArchivistaArchiveClient]
  Backend[backend/internal-ai document endpoints]
  DocMezzi[(@documenti_mezzi)]
  DocMag[(@documenti_magazzino)]
  DocGen[(@documenti_generici)]
  Preventivi[(storage/@preventivi)]
  Mezzi[(storage/@mezzi_aziendali)]
  Storage[(Firebase Storage file)]
  Dossier[Dossier/Documenti costi]
  Manut[Manutenzioni]

  Archivista --> BridgeMezzo
  Archivista --> BridgeMag
  Archivista --> BridgeMan
  BridgeMezzo -->|analyze| Backend
  BridgeMag -->|analyze| Backend
  BridgeMan -->|analyze| Backend
  BridgeMezzo --> ArchiveClient
  BridgeMag --> ArchiveClient
  BridgeMan --> ArchiveClient
  ArchiveClient -->|upload| Storage
  ArchiveClient -->|addDoc| DocMezzi
  ArchiveClient -->|addDoc| DocMag
  ArchiveClient -->|addDoc| DocGen
  ArchiveClient -->|setDoc| Preventivi
  BridgeMezzo -->|update vehicle document data| Mezzi
  Dossier -->|legge| DocMezzi
  Dossier -->|legge| Preventivi
  Manut -->|legge metadata documento| DocMezzi
```

Fonti: `ArchivistaArchiveClient.ts:439`, `:502`, `:603`, `ArchivistaDocumentoMezzoBridge.tsx:1881`, `nextDocumentiCostiDomain.ts:2010`, `nextManutenzioniDomain.ts:454`.

## 9. Cisterna

```mermaid
flowchart TD
  Cisterna[NextCisternaPage]
  CisternaIA[NextCisternaIAPage]
  Schede[NextCisternaSchedeTestPage]
  Writer[nextCisternaWriter]
  Domain[nextCisternaDomain]
  DocCis[(@documenti_cisterna)]
  SchedeColl[(@cisterna_schede_ia)]
  Param[(@cisterna_parametri_mensili)]
  RifTmp[(storage/@rifornimenti_autisti_tmp)]
  Storage[(Firebase Storage documenti/crop)]
  Backend[backend/internal-ai cisterna endpoints]

  Cisterna --> Domain
  Domain --> DocCis
  Domain --> SchedeColl
  Domain --> Param
  Domain --> RifTmp
  CisternaIA -->|analyze| Backend
  CisternaIA --> Writer
  Schede -->|analyze scheda| Backend
  Schede --> Writer
  Writer -->|add/update| DocCis
  Writer -->|add/update| SchedeColl
  Writer -->|set monthly exchange| Param
  Writer -->|upload| Storage
```

Fonti: `nextCisternaWriter.ts:15-95`, `nextCisternaDomain.ts:509-618`, `nextCisternaIaClient.ts:195`, `:243`.

## 10. Euromecc

```mermaid
flowchart TD
  Euro[NextEuromeccPage]
  EuroDomain[nextEuromeccDomain]
  Pending[(euromecc_pending)]
  Done[(euromecc_done)]
  Issues[(euromecc_issues)]
  Meta[(euromecc_area_meta)]
  Rel[(euromecc_relazioni)]
  Extra[(euromecc_extra_components)]
  Ordini[(storage/@ordini)]
  Storage[(Firebase Storage allegati)]
  Backend[internal-ai euromecc/pdf-analyze]

  Euro --> EuroDomain
  EuroDomain -->|read/write| Pending
  EuroDomain -->|read/write| Done
  EuroDomain -->|read/write| Issues
  EuroDomain -->|read/write| Meta
  Euro -->|legge/scrive| Rel
  Euro -->|aggiunge componenti| Extra
  Euro -->|genera ordine ricambi| Ordini
  Euro -->|upload file| Storage
  Euro -->|analizza PDF| Backend
```

Fonti: `nextEuromeccDomain.ts:394-628`, `NextEuromeccPage.tsx:1770`, `:1803`, `:2980`, `:3031`, `:3116`, `:3172`, `:3181`.

## 11. Chat IA NEXT e backend internal-ai

```mermaid
flowchart TD
  ChatPage[ChatIaPage]
  ToolPage[ChatIaToolUsePage]
  Bridge[chatIaBackendBridge]
  Backend[backend/internal-ai/server/internal-ai-adapter.js]
  Catalog[registry/config/view catalog]
  Resolver[query-engine + resolver]
  Boundary[readonly boundary]
  Views[Certified Views Vehicle/Site/Driver/Cisterna/Euromecc/Ricerca]

  ChatPage --> Bridge
  ToolPage --> Bridge
  Bridge -->|POST /internal-ai-backend/chat/tool-use| Backend
  Backend --> Catalog
  Backend --> Resolver
  Resolver --> Boundary
  Backend -->|certifiedView/view_open| Bridge
  Bridge --> Views
```

Fonti: `src/next/chat-ia/backend/chatIaBackendBridge.ts:69`, `:201`, `backend/internal-ai/server/internal-ai-adapter.js:3851`.

## 12. Flussi ad alto rischio

```mermaid
flowchart TD
  Mezzi[(storage/@mezzi_aziendali)]
  Inventario[(storage/@inventario)]
  Materiali[(storage/@materialiconsegnati)]
  Ordini[(storage/@ordini)]
  Rifornimenti[(storage/@rifornimenti)]

  Scadenze[Scadenze] --> Mezzi
  Anagrafiche[Anagrafiche] --> Mezzi
  IALibretto[IA Libretto/Archivista] --> Mezzi

  Magazzino[Magazzino] --> Inventario
  Manutenzioni[Manutenzioni] --> Inventario

  Magazzino --> Materiali
  Manutenzioni --> Materiali

  Procurement[Procurement] --> Ordini
  Euromecc[Euromecc] --> Ordini
  MaterialiDaOrdinare[Materiali da ordinare] --> Ordini

  AutistiAdmin[Autisti Admin] --> Rifornimenti
  Dossier[Dossier] --> Rifornimenti
  Centro[Centro] --> Rifornimenti
```

Rischio: alto/critico perche gli stessi dataset sono scritti da piu moduli NEXT o da moduli con side effect.

[AGGIORNATO 2026-05-16: il diagramma resta valido. Aggiungere mentalmente: `@manutenzioni` come dataset condiviso scritto da Manutenzioni NEXT (saveNextManutenzioneBusinessRecord), Centro Controllo Archivio (chiusura soft-delete) e closureOrchestrator (propagazione chiusura); `@segnalazioni_autisti_tmp` / `@controlli_mezzo_autisti` ora scritti anche da `markSegnalazioneChiusa`/`markControlloChiuso` (CC), `agganciaSegnalazioneAManutenzioneEsistente` (PROMPT 47) e `closureOrchestrator` (propagazione). Hard-delete mezzo cascade su 11 dataset via `nextMezzoHardDeleteWriter` (decisione 2026-05-09). `@lavori` rimosso dai writer NEXT (strategia 3a).]
