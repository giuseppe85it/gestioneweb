# AUDIT CENTRO DI CONTROLLO AVANZATO — 2026-05-07

## Stato del documento
- Tipo: audit repo-wide di sola lettura.
- Operatore: Claude Code.
- Unico file modificabile: questo. Nessun altro file e' stato toccato.
- Vincolo: nessuna patch runtime, nessun fix, nessun test, nessuna build, nessun riuso runtime/UI proposto.
- Limite di esecuzione: ~90 min. La discovery ha privilegiato codice reale e routing rispetto a documentazione storica.
- Stati di affidabilita usati: DIMOSTRATO, DOCUMENTATO, DEDOTTO, DA VERIFICARE, NON PRESENTE, NON LETTO.

---

## 1. Executive summary

L'idea strategica di Giuseppe — sospendere la Chat IA analitica come prodotto principale, ripartire dal Centro di Controllo costruendo un nuovo modulo NEXT autonomo deterministico e verificabile — risulta **COERENTE con il repo reale ma con rischi**. Il repository contiene gia' tutta l'infrastruttura dati necessaria (boundary readonly verificato, registry centralizzato, ~31 domain reader NEXT, ~76 pagine NEXT) e una solida superficie di moduli scriventi/letti che possono alimentare un Centro di Controllo Avanzato senza nuove collection. Il Centro di Controllo NEXT attuale (`NextCentroControlloParityPage`) e' una parity legacy a 5 tab fissi: nasce dalla pagina madre, non e' pensato come pannello filtri multi-modulo configurabile e va trattato come **fonte di IDEE FUNZIONALI**, non di runtime/UI da riusare. La Chat IA NEXT (V1 chiusa il 2026-05-06) ha 5 viste 360 + motore generico + pannello prove + relation resolver: e' un patrimonio tecnico significativo da **CONGELARE come prodotto** ma con piu' componenti tecnici **DA VALUTARE** per riuso futuro come "assistente filtri" non analitico. Il primo step sicuro consigliato e' una pagina nuova `/next/centro-avanzato` con una sola vista "Mezzi anagrafica + filtro targa + tabella + pannello prove minimo" che dimostri il pattern data-engine deterministico senza intent IA.

---

## 2. Metodo di discovery repo-wide

### 2.1 Ordine di lettura
1. `src/App.tsx` (719 righe) — routing completo madre + NEXT (DIMOSTRATO).
2. `src/next/nextStructuralPaths.ts` (124 righe) — costanti path NEXT (DIMOSTRATO).
3. Glob su `src/next/Next*.tsx`, `src/next/domain/*.ts`, `src/next/*.ts`, `src/pages/*.tsx`, `src/autisti/*.tsx`, `src/autistiInbox/*.tsx`, `src/next/chat-ia/**`, `backend/internal-ai/server/**` — DIMOSTRATO.
4. `docs/audit/*.md` (23 file), `docs/product/SPEC_*.md` (14 file), `docs/_live/*.md`, `docs/*.md` — DIMOSTRATO.
5. Lettura mirata di `NextCentroControlloParityPage.tsx`, `nextCentroControlloDomain.ts`, `pages/CentroControllo.tsx`, `pages/Mezzo360.tsx`, `pages/Autista360.tsx`, `NextHomePage.tsx`, `STATO_ATTUALE_PROGETTO.md`, `AUDIT_INDIPENDENTE_CHIUSURA_CHATIA_V1_2026-05-06.md` — DIMOSTRATO sulle prime ~80-100 righe per file.
6. Boundary, registry, view.config.ts, relation.config.ts, query-engine, universal-resolver, catalog-validator, chat-zero-preflight, post-llm-resolver, shadow-comparator, relation-resolver, Driver360.tsx, ChatIaToolUsePage.tsx, ChatIaMessageItem.tsx, ProofPanel/CollapsibleProof, registro Firestore: gia' letti integralmente in audit precedenti (`AUDIT_INDIPENDENTE_BLOCCO_8_C6_2026-05-06.md`, `AUDIT_INDIPENDENTE_CHIUSURA_CHATIA_V1_2026-05-06.md`, `MATRICE_CHIUSURA_CHATIA_NEXT_2026-05-06.md`, `DIAGNOSI_LOOKUP_VEHICLE360_2026-05-06.md`) — DIMOSTRATO via continuita.

### 2.2 Limiti dichiarati
- Domain NEXT: il nome di tutti i 31 domain e' DIMOSTRATO via Glob; il contenuto interno di ciascun domain e' parzialmente DEDOTTO via riferimenti diretti in pagine e in `nextCentroControlloDomain.ts`. Lettura completa file-per-file: NON LETTO per limite di tempo.
- Madre `pages/`: 32 file mappati, lettura testa di Mezzo360, Autista360, CentroControllo. Lettura completa di altre pagine: NON LETTO.
- `backend/internal-ai/server/lib/*`: gia' letti in audit precedenti. Aggiornamenti recenti: NON LETTI in questa sessione (DEDOTTO da git log che non sono cambiati dopo `141ff762`).
- Tools chat-ia: 50+ file `toolGet*`/`toolSearch*`/`toolList*`. Nomi DIMOSTRATI via Glob. Implementazione interna: NON LETTA per la stragrande maggioranza.
- Documentazione storica `docs/_live/STORICO_*.md`, `docs/PROJECT_RULES.md`, `docs/STRUTTURA_COMPLETA_GESTIONALE.md`: NON LETTI. Per scelta: si privilegia codice reale.

### 2.3 Discovery di scoperta
- I 5 tab del Centro di Controllo attuale sono confermati DIMOSTRATO: `NextCentroControlloParityPage.tsx:31-36` `type TabKey = "manutenzioni" | "rifornimenti" | "segnalazioni" | "controlli" | "richieste"`.
- L'identica enum esiste in `pages/CentroControllo.tsx:23-28`. La parity NEXT e' una replica della pagina madre.
- `nextCentroControlloDomain.ts:51-69` dichiara dominio `D10` con 6 logical datasets e enum `allowedAlertKinds` ("revisione", "conflitto_sessione", "segnalazione_nuova", "eventi_importanti_autisti") e `allowedFocusKinds` ("controllo_ko", "mezzo_incompleto").
- L'home NEXT (`NextHomePage.tsx:11-25`) chiama `readNextCentroControlloSnapshot` per produrre un banner allarme e KPI di sintesi: il centro di controllo e' gia' nodo strategico della NEXT.

---

## 3. File non presenti e fonti alternative trovate

| File richiesto dal prompt | Stato | Fonte alternativa |
|---|---|---|
| `docs/_live/STATO_ATTUALE_PROGETTO.md` | DIMOSTRATO | presente in `docs/_live/STATO_ATTUALE_PROGETTO.md` E `docs/STATO_ATTUALE_PROGETTO.md` (versione recentemente aggiornata 2026-05-06, letta) |
| `docs/_live/STATO_MIGRAZIONE_NEXT.md` | DIMOSTRATO | presente in `docs/_live/STATO_MIGRAZIONE_NEXT.md` E `docs/product/STATO_MIGRAZIONE_NEXT.md` |
| `docs/_live/REGISTRO_MODIFICHE_CLONE.md` | DIMOSTRATO | presente. Esiste anche `docs/_handoff_2026-05-04/REGISTRO_MODIFICHE_CLONE.md` (storico). |
| `docs/PROTOCOLLO_SICUREZZA_MODIFICHE.md` | NON PRESENTE in path indicato; trovato `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md` | DOCUMENTATO via path alternativo |
| `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md` | NON PRESENTE | nessuna alternativa diretta in `docs/architecture/`. Riferimento simile in `docs/_handoff_2026-05-04/`. NON LETTO. |
| `docs/data/MAPPA_COMPLETA_DATI.md` | NON PRESENTE | sostituito di fatto da `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` (v1.0 STABLE 2026-05-06) gia' letto |
| `docs/data/DOMINI_DATI_CANONICI.md` | NON PRESENTE | NON sostituito; le definizioni di dominio vivono nei file `src/next/domain/next*Domain.ts` |
| `docs/data/REGOLE_STRUTTURA_DATI.md` | NON PRESENTE | regole emerse da boundary readonly + registro v0.6/1.0 |
| `docs/product/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md` | NON PRESENTE | parzialmente coperto da `AUDIT_GAP_COPERTURA_TOOL_2026-04-28.md` e `AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md` (NON LETTI integralmente) |
| `docs/product/CONTRATTO_STANDARD_ADAPTER_IA_NEXT.md` | NON PRESENTE | parzialmente coperto da `SPEC_ARCHITETTURA_TOOL_USE_CHAT_IA_NEXT.md` |
| `docs/product/MAPPA_IA_CHAT_NEXT.md` | NON PRESENTE | sostituito di fatto da `SPEC_OSSATURA_CHAT_IA_NEXT.md` + `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md` |
| `docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md` | DIMOSTRATO | presente |
| `docs/audit/REPORT_FIX_LOOKUP_VEHICLE360_2026-05-06.md` | NON PRESENTE | esiste solo `DIAGNOSI_LOOKUP_VEHICLE360_2026-05-06.md` (la diagnosi, non un fix) |
| `AGENTS.md` (radice) | DOCUMENTATO via `git diff` precedente | NON LETTO in questa sessione |
| `CONTEXT_CLAUDE.md` (radice) | DOCUMENTATO via `git diff` precedente | NON LETTO in questa sessione |

---

## 4. Mappatura completa moduli del gestionale

Stato compatto. Per ogni modulo: nome, area, route madre, route NEXT, file principali, stato runtime, fonte. **Stato runtime** sintetizza `STATO_ATTUALE_PROGETTO.md:22-30,49-59`.

### 4.1 Centro di Controllo / Operativita'
| Modulo | Madre | NEXT | File | Stato |
|---|---|---|---|---|
| Home gestionale | `/` `pages/Home.tsx` | `/next` `NextHomePage.tsx` | DIMOSTRATO | NEXT operativa con KPI e widget Centro Controllo (`NextHomePage.tsx:11-25`) |
| Centro di Controllo | `/centro-controllo` `pages/CentroControllo.tsx` | `/next/centro-controllo` `NextCentroControlloParityPage.tsx` | 5 tab fissi (manutenzioni/rifornimenti/segnalazioni/controlli/richieste) | READ-ONLY parity. Dominio backend: `nextCentroControlloDomain.ts` D10. |
| Scadenze collaudi | NON PRESENTE in madre | `/next/scadenze-collaudi` `NextScadenzeCollaudiPage.tsx` | nuovo modulo NEXT (writer `nextScadenzeCollaudiWriter.ts`) | SCRIVENTE NEXT-nativo |
| Operativita globale | `/gestione-operativa` `pages/GestioneOperativa.tsx` | `/next/gestione-operativa` `NextGestioneOperativaPage.tsx` + `NextOperativitaGlobalePage.tsx` | dispatcher operativo | IBRIDO (legacy redirect attivo per `/next/operativita-globale`) |

### 4.2 Mezzi e dossier
| Modulo | Madre | NEXT | Stato |
|---|---|---|---|
| Mezzi (anagrafica) | `/mezzi` `pages/Mezzi.tsx` | `/next/mezzi` (redirect a `/next/dossiermezzi`) | NEXT redirect: anagrafica chiusa nel modal del Dossier (decisione 2026-04-26) |
| Mezzo360 | `/mezzo-360/:targa` `pages/Mezzo360.tsx` | NON PORTATO (decisione strategica `STATO_ATTUALE_PROGETTO.md:63`) | ESCLUSO STRATEGICO |
| Dossier mezzi | `/dossiermezzi` + `/dossier/:targa` | `/next/dossiermezzi` `NextDossierListaPage.tsx`, `/next/dossier/:targa` `NextDossierMezzoPage.tsx` | SCRIVENTE NEXT (writer `nextMezziWriter.ts`) |
| Dossier gomme | `/dossier/:targa/gomme` | `/next/dossier/:targa/gomme` `NextDossierGommePage.tsx` | DIMOSTRATO |
| Dossier rifornimenti | `/dossier/:targa/rifornimenti` | `/next/dossier/:targa/rifornimenti` `NextDossierRifornimentiPage.tsx` | DIMOSTRATO |
| Analisi economica | `/analisi-economica/:targa` | `/next/analisi-economica/:targa` `NextAnalisiEconomicaPage.tsx` | DIMOSTRATO |
| Mappa storico mezzo | NON PRESENTE | (no route diretta in App.tsx ma esiste `NextMappaStoricoPage.tsx`) | DA VERIFICARE: pagina presente ma non routed in App.tsx (DIMOSTRATO assenza) |

### 4.3 Autisti (gestionale)
| Modulo | Madre | NEXT | Stato |
|---|---|---|---|
| Autista360 | `/autista-360/:badge` `pages/Autista360.tsx` | NON PORTATO (`STATO_ATTUALE_PROGETTO.md:64`) | ESCLUSO STRATEGICO. `NextDriverExperiencePage.tsx` e' placeholder non routed. |
| Colleghi (anagrafica) | `/colleghi` `pages/Colleghi.tsx` | redirect a `/next/anagrafiche?tab=colleghi` | SCRIVENTE NEXT chiuso 2026-04-24 |
| Anagrafiche unificate | NON PRESENTE | `/next/anagrafiche` `NextAnagrafichePage.tsx` (3 tab: colleghi/fornitori/officine) | SCRIVENTE NEXT-nativo |
| Capo mezzi | `/capo/mezzi` `pages/CapoMezzi.tsx` | `/next/capo/mezzi` `NextCapoMezziPage.tsx` | DIMOSTRATO |
| Capo costi | `/capo/costi/:targa` `pages/CapoCostiMezzo.tsx` | `/next/capo/costi/:targa` `NextCapoCostiMezzoPage.tsx` | DIMOSTRATO |

### 4.4 Autisti app + Inbox
| Modulo | Madre | NEXT | Stato |
|---|---|---|---|
| AutistiGate / Login | `/autisti`, `/autisti/login` `src/autisti/AutistiGate.tsx` | `/next/autisti` `NextAutistiCloneLayout.tsx` con sub-route | DIMOSTRATO (clone NEXT) |
| Setup mezzo | `/autisti/setup-mezzo` `SetupMezzo.tsx` | `/next/autisti/setup-mezzo` `NextAutistiSetupMezzoPage.tsx` | SCRIVENTE |
| Cambio mezzo | `/autisti/cambio-mezzo` `CambioMezzoAutista.tsx` | `/next/autisti/cambio-mezzo` `NextAutistiCambioMezzoPage.tsx` | SCRIVENTE |
| Controllo mezzo | `/autisti/controllo` `ControlloMezzo.tsx` | `/next/autisti/controllo` `NextAutistiControlloPage.tsx` | SCRIVENTE |
| Rifornimento autisti | `/autisti/rifornimento` `Rifornimento.tsx` | `/next/autisti/rifornimento` `next/autisti/NextAutistiRifornimentoPage.tsx` | SCRIVENTE |
| Segnalazioni autisti | `/autisti/segnalazioni` `Segnalazioni.tsx` | `/next/autisti/segnalazioni` `next/autisti/NextAutistiSegnalazioniPage.tsx` | SCRIVENTE |
| Richiesta attrezzature | `/autisti/richiesta-attrezzature` `RichiestaAttrezzature.tsx` | `/next/autisti/richiesta-attrezzature` `next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx` | SCRIVENTE |
| Gomme autisti modal | `GommeAutistaModal.tsx` | (modal interno) | SCRIVENTE |
| Inbox home | `/autisti-inbox` `AutistiInboxHome.tsx` | `/next/autisti-inbox` `NextAutistiInboxHomePage.tsx` | DIMOSTRATO |
| Inbox cambio mezzo | `/autisti-inbox/cambio-mezzo` `CambioMezzoInbox.tsx` | `/next/autisti-inbox/cambio-mezzo` | DIMOSTRATO |
| Inbox controlli | `/autisti-inbox/controlli` `AutistiControlliAll.tsx` | `/next/autisti-inbox/controlli` | DIMOSTRATO |
| Inbox segnalazioni | `/autisti-inbox/segnalazioni` `AutistiSegnalazioniAll.tsx` | `/next/autisti-inbox/segnalazioni` | DIMOSTRATO |
| Inbox log accessi | `/autisti-inbox/log-accessi` `AutistiLogAccessiAll.tsx` | `/next/autisti-inbox/log-accessi` | DIMOSTRATO |
| Inbox gomme | `/autisti-inbox/gomme` `AutistiGommeAll.tsx` | `/next/autisti-inbox/gomme` | DIMOSTRATO |
| Inbox richieste | `/autisti-inbox/richiesta-attrezzature` `RichiestaAttrezzatureAll.tsx` | `/next/autisti-inbox/richiesta-attrezzature` | DIMOSTRATO |
| AutistiAdmin | `/autisti-admin` `AutistiAdmin.tsx` | `/next/autisti-admin` `NextAutistiAdminPage.tsx` | DIMOSTRATO |

### 4.5 Manutenzioni / Lavori
| Modulo | Madre | NEXT | Stato |
|---|---|---|---|
| Manutenzioni | `/manutenzioni` `pages/Manutenzioni.tsx` | `/next/manutenzioni` `NextManutenzioniPage.tsx` | SCRIVENTE NEXT |
| Lavori da eseguire | `/lavori-da-eseguire` | `/next/lavori-da-eseguire` `NextLavoriDaEseguirePage.tsx` | SCRIVENTE NEXT |
| Lavori in attesa | `/lavori-in-attesa` | `/next/lavori-in-attesa` `NextLavoriInAttesaPage.tsx` | SCRIVENTE NEXT |
| Lavori eseguiti | `/lavori-eseguiti` | `/next/lavori-eseguiti` `NextLavoriEseguitiPage.tsx` | SCRIVENTE NEXT |
| Dettaglio lavoro | `/dettagliolavori` | `/next/dettagliolavori/:lavoroId` `NextDettaglioLavoroPage.tsx` | DIMOSTRATO |

### 4.6 Magazzino / Materiali / Procurement
| Modulo | Madre | NEXT | Stato |
|---|---|---|---|
| Magazzino unificato | NON PRESENTE | `/next/magazzino` `NextMagazzinoPage.tsx` (4 tab: inventario / materiali-consegnati / cisterne-adblue / documenti-costi) | NEXT-nativo, IBRIDO |
| Inventario | `/inventario` `pages/Inventario.tsx` | `/next/inventario` redirect a `/next/magazzino?tab=inventario` (`NextInventarioReadOnlyPanel.tsx`) | READ-ONLY NEXT |
| Materiali consegnati | `/materiali-consegnati` `pages/MaterialiConsegnati.tsx` | `/next/materiali-consegnati` redirect (`NextMaterialiConsegnatiReadOnlyPanel.tsx`) | READ-ONLY NEXT |
| Materiali da ordinare | `/materiali-da-ordinare` `pages/MaterialiDaOrdinare.tsx` | `/next/materiali-da-ordinare` `NextMaterialiDaOrdinarePage.tsx` | SCRIVENTE NEXT chiuso 2026-04-23 |
| Acquisti | `/acquisti` `pages/Acquisti.tsx` | `/next/acquisti` `NextAcquistiPage.tsx` (alias di Materiali da ordinare via `NextProcurementStandalonePage`) | SCRIVENTE alias |
| Ordini in attesa | `/ordini-in-attesa` `pages/OrdiniInAttesa.tsx` | `/next/ordini-in-attesa` `NextOrdiniInAttesaPage.tsx` | READ-ONLY NEXT |
| Ordini arrivati | `/ordini-arrivati` `pages/OrdiniArrivati.tsx` | `/next/ordini-arrivati` `NextOrdiniArrivatiPage.tsx` | READ-ONLY NEXT |
| Dettaglio ordine | `/dettaglio-ordine/:ordineId` `pages/DettaglioOrdine.tsx` | `/next/dettaglio-ordine/:ordineId` + `/next/acquisti/dettaglio/:ordineId` `NextDettaglioOrdinePage.tsx` | DIMOSTRATO |
| Attrezzature cantieri | `/attrezzature-cantieri` `pages/AttrezzatureCantieri.tsx` | `/next/attrezzature-cantieri` `NextAttrezzatureCantieriPage.tsx` (writer + readonly panel) | SCRIVENTE NEXT |
| Anagrafiche fornitori | `/fornitori` `pages/Fornitori.tsx` | redirect a `/next/anagrafiche?tab=fornitori` | SCRIVENTE NEXT chiuso 2026-04-24 |

### 4.7 Cisterna / Euromecc
| Modulo | Madre | NEXT | Stato |
|---|---|---|---|
| Cisterna Caravate | `/cisterna` `pages/CisternaCaravate/CisternaCaravatePage.tsx` | `/next/cisterna` `NextCisternaPage.tsx` | READ-ONLY NEXT (gap scrivente aperto) |
| Cisterna IA | `/cisterna/ia` `CisternaCaravateIA.tsx` | `/next/cisterna/ia` `NextCisternaIAPage.tsx` (writer dedicato `nextCisternaIaClient.ts`, `nextCisternaWriter.ts`) | SCRIVENTE NEXT (path tecnico) |
| Cisterna schede test | `/cisterna/schede-test` `CisternaSchedeTest.tsx` | `/next/cisterna/schede-test` `NextCisternaSchedeTestPage.tsx` | DIMOSTRATO |
| Euromecc | NON PRESENTE in madre | `/next/euromecc` `NextEuromeccPage.tsx` (`euromeccAreas.ts`) | NEXT-nativo |

### 4.8 IA documentale / Archivista / Chat
| Modulo | Madre | NEXT | Stato |
|---|---|---|---|
| IA Home | `/ia` `pages/IA/IAHome.tsx` | NON PORTATO (decisione: NextIntelligenzaArtificialePage cancellato — `git log` audit precedente) | ESCLUSO STRATEGICO |
| IA API key | `/ia/apikey` `pages/IA/IAApiKey.tsx` | `NextIAApiKeyPage.tsx` cancellato (`git log` audit precedente) | ESCLUSO STRATEGICO |
| IA Libretto | `/ia/libretto` `pages/IA/IALibretto.tsx` | `/next/ia/libretto` `NextIALibrettoPage.tsx` | SCRIVENTE NEXT |
| IA Documenti | `/ia/documenti` `pages/IA/IADocumenti.tsx` | `/next/ia/documenti` `NextIADocumentiPage.tsx` | SCRIVENTE NEXT |
| IA Copertura libretti | `/ia/copertura-libretti` `pages/IA/IACoperturaLibretti.tsx` | `/next/ia/copertura-libretti` `NextIACoperturaLibrettiPage.tsx` | DIMOSTRATO |
| IA Archivista | (sotto IA documenti madre) | `/next/ia/archivista` `NextIAArchivistaPage.tsx` | SCRIVENTE NEXT (`ArchivistaArchiveClient.ts`, `ArchivistaDocumentoMezzoBridge.tsx` referenziati in audit precedenti) |
| Libretti export | `/libretti-export` `pages/LibrettiExport.tsx` | `/next/libretti-export` `NextLibrettiExportPage.tsx` (domain `nextLibrettiExportDomain.ts`) | DIMOSTRATO |
| Chat IA NEXT (analitica) | NON PRESENTE in madre | `/next/chat` `ChatIaPage.tsx` (wrapper) → `ChatIaToolUsePage.tsx`. Anche `/next/chat-tool` come alias tecnica | READ-ONLY (motore generico v1 chiuso 2026-05-06, vedi §9) |

### 4.9 Domain layer NEXT (31 file `src/next/domain/next*Domain.ts`)
Tutti DIMOSTRATI come esistenti via Glob. Lettura interna parziale:
`nextUnifiedReadRegistryDomain`, `nextAttrezzatureCantieriDomain`, `nextStatoOperativoDomain`, `nextLibrettiExportDomain`, `nextRifornimentiDomain`, `nextAutistiDomain`, `nextInventarioDomain`, `nextFornitoriDomain`, `nextLavoriDomain`, `nextCapoDomain`, `nextIaConfigDomain`, `nextIaLibrettoDomain`, `nextCisternaDomain`, `nextColleghiDomain`, `nextCentroControlloDomain`, `nextEuromeccDomain`, `nextMappaStoricoDomain`, `nextOperativitaGlobaleDomain`, `nextMagazzinoStockContract`, `nextMaterialiMovimentiDomain`, `nextManutenzioniGommeDomain`, `nextDossierMezzoDomain`, `nextManutenzioniDomain`, `nextOfficineDomain`, `nextDocumentiCostiDomain`, `nextSegnalazioniControlliDomain`, `nextDocumentiMezzoDomain`, `nextAnalisiEconomicaDomain`, `nextAlertsStateDomain`, `nextAdBlueDomain`, `nextProcurementDomain`. Stato: contenuto interno DEDOTTO (referenze indirette in pagine), va riconfermato file-per-file in audit successivo se serve costruire `Centro Controllo Avanzato`.

---

## 5. Mappatura collezioni Firestore / dataset

Fonte primaria: `backend/internal-ai/server/internal-ai-firebase-readonly-boundary.js` (DIMOSTRATO via lettura completa in audit precedenti — 32 entry exact_document + 6 entry collection_root + 1 entry `exact_object_path_from_firestore_field`). Fonte di alias e match rules: `docs/product/REGISTRO_COLLECTION_FIRESTORE.md` v1.0 STABLE 2026-05-06 (DIMOSTRATO via lettura header in audit precedente).

### 5.1 Documenti storage con array `items[]` (accessMode `exact_document`)
Tutte sotto `firestore.collection("storage").doc("@<dataset>")`. 32 entry.

| Dataset | Boundary entry id | Modulo principale lettore | Modulo principale scrittore | Stato |
|---|---|---|---|---|
| `@mezzi_aziendali` | `firestore-storage-mezzi-aziendali-doc` | Mezzo360, NextDossierMezzoPage, Centro Controllo, Driver360 (chat) | NextMezziWriter, IALibretto, ArchivistaDocumentoMezzoBridge | VERIFICATA RUNTIME |
| `@colleghi` | `firestore-storage-colleghi-doc` | Driver360, Anagrafiche | NextAnagraficheWriter | VERIFICATA RUNTIME |
| `@autisti_sessione_attive` | `firestore-storage-autisti-sessioni-attive-doc` | Driver360, Mezzo360, Centro Controllo (focus) | App autisti (setup/cambio mezzo) | VERIFICATA RUNTIME |
| `@storico_eventi_operativi` | `firestore-storage-storico-eventi-operativi-doc` | Mezzo360, Autista360, Centro Controllo | App autisti | VERIFICATA RUNTIME |
| `@rifornimenti_autisti_tmp` | `firestore-storage-rifornimenti-autisti-tmp-doc` | Centro Controllo (rifornimenti tab), Driver360 | App autisti | VERIFICATA RUNTIME |
| `@rifornimenti` | `firestore-storage-rifornimenti-doc` | Dossier rifornimenti, Centro Controllo, Vehicle360 (chat) | (writer madre — DA VERIFICARE) | DIMOSTRATO |
| `@segnalazioni_autisti_tmp` | `firestore-storage-segnalazioni-autisti-tmp-doc` | Centro Controllo (segnalazioni), Inbox | App autisti | DIMOSTRATO |
| `@controlli_mezzo_autisti` | `firestore-storage-controlli-mezzo-autisti-doc` | Centro Controllo (controlli) | App autisti (controllo mezzo) | DIMOSTRATO |
| `@richieste_attrezzature_autisti_tmp` | `firestore-storage-richieste-attrezzature-autisti-tmp-doc` | Centro Controllo (richieste), Inbox | App autisti | DIMOSTRATO |
| `@cambi_gomme_autisti_tmp` | `firestore-storage-cambi-gomme-autisti-tmp-doc` | Inbox gomme, Mezzo360 | App autisti | DIMOSTRATO |
| `@gomme_eventi` | `firestore-storage-gomme-eventi-doc` | Dossier gomme, Mezzo360 | (writer madre — DA VERIFICARE) | DIMOSTRATO |
| `@manutenzioni` | `firestore-storage-manutenzioni-doc` | Manutenzioni, Mezzo360 | NextManutenzioniPage | DIMOSTRATO |
| `@lavori` | `firestore-storage-lavori-doc` | Lavori (3 stati), Mezzo360 | NextLavori* | DIMOSTRATO |
| `@inventario` | `firestore-storage-inventario-doc` | Inventario, Magazzino | (writer NEXT — DA VERIFICARE) | DIMOSTRATO |
| `@materialiconsegnati` | `firestore-storage-materiali-consegnati-doc` | Materiali consegnati, Mezzo360 | (writer NEXT — DA VERIFICARE) | DIMOSTRATO |
| `@ordini` | `firestore-storage-ordini-doc` | Ordini in attesa/arrivati, MaterialiDaOrdinare | NextMaterialiDaOrdinarePage (post 2026-04-23) | DIMOSTRATO |
| `@preventivi` | `firestore-storage-preventivi-doc` | Dossier preventivi, NextPreventivoIaModal/ManualeModal | NextPreventivoManualeWriter | DIMOSTRATO |
| `@preventivi_approvazioni` | `firestore-storage-preventivi-approvazioni-doc` | (DA VERIFICARE) | (DA VERIFICARE) | DIMOSTRATO |
| `@fornitori` | `firestore-storage-fornitori-doc` | Anagrafiche tab, Procurement | NextAnagraficheWriter | DIMOSTRATO |
| `@officine` | `firestore-storage-officine-doc` | Anagrafiche tab, Manutenzioni | NextAnagraficheWriter | DIMOSTRATO |
| `@listino_prezzi` | `firestore-storage-listino-prezzi-doc` | Procurement, MaterialiDaOrdinare | (DA VERIFICARE) | DIMOSTRATO |
| `@costiMezzo` | `firestore-storage-costi-mezzo-doc` | Capo costi, Mezzo360 | (DA VERIFICARE) | DIMOSTRATO |
| `@attrezzature_cantieri` | `firestore-storage-attrezzature-cantieri-doc` | Attrezzature, Magazzino | NextAttrezzatureCantieriWriter | DIMOSTRATO |
| `@cisterne_adblue` | `firestore-storage-cisterne-adblue-doc` | Magazzino tab cisterne-adblue | (writer madre / NEXT — DA VERIFICARE) | DIMOSTRATO |
| `@alerts_state` | `firestore-storage-alerts-state-doc` | Centro Controllo, Home banner | (writer Centro Controllo madre — DA VERIFICARE) | DIMOSTRATO |
| `@analisi_economica_mezzi` | `firestore-storage-analisi-economica-mezzi-doc` | NextAnalisiEconomicaPage, AnalisiEconomica madre | NextAnalisiEconomicaPage | DIMOSTRATO. ESCLUSA dal motore generico chat IA. |
| `@documenti_generici` (alias storage) | `firestore-storage-documenti-generici-doc` | Mezzo360, Dossier | (deprecata 2026-05-04) | DEPRECATA — vive in parallelo a root |
| `@documenti_magazzino` (alias storage) | `firestore-storage-documenti-magazzino-doc` | Materiali, Mezzo360 | (deprecata 2026-05-04) | DEPRECATA |
| `@documenti_mezzi` (alias storage) | `firestore-storage-documenti-mezzi-doc` | Dossier mezzo, Mezzo360 | (deprecata 2026-05-04) | DEPRECATA |
| `@mezzi_foto_viste` | `firestore-storage-mezzi-foto-viste-doc` | (DA VERIFICARE) | (DA VERIFICARE) | DIMOSTRATO |
| `@mezzi_hotspot_mapping` | `firestore-storage-mezzi-hotspot-mapping-doc` | `mezziHotspotAreas.ts` | (DA VERIFICARE) | DIMOSTRATO |
| `@impostazioni_app` | `firestore-storage-impostazioni-app-doc` | (DA VERIFICARE) | (DA VERIFICARE) | DIMOSTRATO (allowedFields vuoto, prudente) |

### 5.2 Root collections (accessMode `collection_root`)
Tutte usate nel contesto Chat IA NEXT (BLOCCO 4-5 piano esecutivo). 9 entry.

| Dataset | Boundary entry id | Lettore | Scrittore | Stato |
|---|---|---|---|---|
| `@documenti_mezzi` (root) | `firestore-documenti-mezzi-root` | Chat IA Vehicle360, Archivista | ArchivistaDocumentoMezzoBridge | DIMOSTRATO (2026-05-06) |
| `@documenti_magazzino` (root) | `firestore-documenti-magazzino-root` | Chat IA Site360 | Archivista | DIMOSTRATO |
| `@documenti_generici` (root) | `firestore-documenti-generici-root` | Chat IA Site360, Ricerca360 | Archivista | DIMOSTRATO |
| `@documenti_cisterna` (root) | `firestore-documenti-cisterna-root` | Chat IA Site360, NextCisternaIAPage | NextCisternaIaClient/Writer | DIMOSTRATO |
| `@cisterna_schede_ia` (root) | `firestore-cisterna-schede-ia-root` | Chat IA Site360, NextCisternaSchedeTestPage | NextCisternaIaClient | DIMOSTRATO |
| `@cisterna_parametri_mensili` (root) | `firestore-cisterna-parametri-mensili-root` | Chat IA Site360 | NextCisternaWriter | DIMOSTRATO |
| `euromecc_pending` | `firestore-euromecc-pending-root` | NextEuromeccPage, Chat IA Euromecc360 | NextEuromeccPage | DIMOSTRATO |
| `euromecc_done` | `firestore-euromecc-done-root` | (idem) | (idem) | DIMOSTRATO |
| `euromecc_issues` | `firestore-euromecc-issues-root` | (idem) | (idem) | DIMOSTRATO |
| `euromecc_area_meta` | `firestore-euromecc-area-meta-root` | (idem) | (idem) | DIMOSTRATO |
| `euromecc_extra_components` | `firestore-euromecc-extra-components-root` | (idem) | (idem) | DIMOSTRATO |
| `euromecc_relazioni` | `firestore-euromecc-relazioni-root` | (idem) | (idem) | DIMOSTRATO |

### 5.3 Esclusi by design dal motore generico Chat IA
- `chat_ia_reports` (archivio tecnico chat).
- `@analisi_economica_mezzi` come fonte certificata (contiene narrativa IA).
- `stamped/*` (PDF timbrati cloud function).

DOCUMENTATO da `REGISTRO_COLLECTION_FIRESTORE.md:457-479` audit precedenti.

### 5.4 Storage (Firebase Storage)
- 1 entry boundary (`storage-libretto-path-from-mezzo`, accessMode `exact_object_path_from_firestore_field`) — letta da `librettoStoragePath` su `@mezzi_aziendali`.
- forbiddenPrefixes: `documenti_pdf/`, `preventivi/`, `autisti/`.
- DIMOSTRATO via lettura boundary precedente.

### 5.5 LocalStorage / storageSync
`src/utils/storageSync.ts` (decisione 2026-04-26: scrive su Firestore in `storage` collection nonostante il nome). Le pagine madre Mezzo360 e Autista360 usano `getItemSync` come reader unificato. NON e' localStorage browser. DIMOSTRATO da `STATO_ATTUALE_PROGETTO.md` precedenti audit.

---

## 6. Chiavi di join e normalizzazioni

Fonti: `REGISTRO_COLLECTION_FIRESTORE.md` sezione "Alias e ricerca flessibile" (DOCUMENTATO), regole D11 di `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md` (DIMOSTRATO via lettura precedente), `relation.config.cjs` (DIMOSTRATO).

### 6.1 Chiavi forti (exact-match strict, regola D11)
| Chiave | Tipo | Normalizzazione | Moduli collegabili | Rischio mismatch |
|---|---|---|---|---|
| `targa` | targa veicolo | uppercase + `replace(/[^A-Z0-9]/g, "")` (cf. `Mezzo360.tsx:70-73`) | mezzi, dossier, manutenzioni, lavori, rifornimenti, gomme_eventi, materialiconsegnati, controlli_mezzo, segnalazioni, eventi_operativi, documenti_mezzi | basso se normalizzazione applicata; alto se misto con `targaMotrice/targaRimorchio` |
| `id` Firestore | id record | trim, exact | qualsiasi collection | basso |
| `badgeAutista` | badge collega | trim + `.toLowerCase()` (cf. `21-chat-ia-smoke.spec.ts:31`) | colleghi, sessioni, eventi, segnalazioni, controlli, rifornimenti tmp, richieste, gomme tmp | medio (badge con varianti caso) |
| `autistaId` | id collega | trim, exact | mezzi (legame statico), rifornimenti, eventi, sessioni | medio (fallback a badge) |
| `mezzoTarga` / `targaMotrice` / `targaRimorchio` | targa | come `targa` | sessioni, rifornimenti, controlli, eventi | alto se mischiati con `targa` semplice |
| `data` / `timestamp` | date/time | exact | rifornimenti, manutenzioni, lavori, eventi | medio (tipi diversi: Date / number / string) |
| `numeroDocumento` | id doc | trim | documenti, preventivi, ordini | medio |
| `cantiereId` / `cantiere` | id+label | id forte; label fallback | attrezzature, lavori, materiali consegnati | alto (label denormalizzata) |
| `materiale` / `stockKey` / `codice` | materiale | id `stockKey` preferito | inventario, materiali consegnati, ordini, listino, documenti magazzino | alto (3 chiavi diverse) |
| `fornitore` / `supplierId` / `nomeFornitore` | fornitore | id forte; label fallback | ordini, preventivi, listino, materiali consegnati, fornitori | alto |
| `officinaId` / `officina` | officina | id forte; label fallback | manutenzioni, officine | medio |
| `areaKey` / `subKey` / `componentKey` | euromecc | exact | euromecc_* (6 root) | basso |

### 6.2 Chiavi deboli (non utilizzabili come fonte di relazione certificata)
Da `REGISTRO_COLLECTION_FIRESTORE.md:111-114`: nomi propri (autista, fornitore, officina, materiale, cantiere) sono ammessi solo per ricerca/disambiguazione, non come relazione forte. Niente fuzzy/Levenshtein/Soundex.

### 6.3 Pattern di estrazione targa nel codice
- Backend: `PLATE_TOKEN_PATTERN = /\b[A-Z]{2}\d{6}\b/gi` (`universal-resolver.js:40`, `chat-zero-preflight.js:1`).
- Adapter: `extractPlateToken` con `searchText.toUpperCase().match(/\b[A-Z]{2}\d{6}\b/)` (DIMOSTRATO da audit `DIAGNOSI_LOOKUP_VEHICLE360_2026-05-06.md`).
- Frontend Driver360: `normalizePlate(value)` = `value.trim().toUpperCase().replace(/\s+/g, "")` (DIMOSTRATO da `Driver360.tsx:80-82`).
- Madre Mezzo360: `normalizeTarga(t)` = `t.toUpperCase().replace(/[^A-Z0-9]/g, "").trim()` (DIMOSTRATO da `Mezzo360.tsx:70-73`).

**Inconsistenza**: la normalizzazione Mezzo360 madre rimuove caratteri non alfanumerici, mentre Driver360 NEXT rimuove solo whitespace. Per Centro Controllo Avanzato deterministico serve UNA sola funzione canonica (`normalizePlateCanonical`) condivisa tra reader e UI. Rischio mismatch ALTO se non unificata. (DIMOSTRATO da confronto file).

---

## 7. Tab Centro di Controllo NEXT attuale — idee funzionali

Fonte: `NextCentroControlloParityPage.tsx:31-100+` (DIMOSTRATO).

### 7.1 Tab esistenti
Le 5 tab dichiarate nel `type TabKey`:

1. **`manutenzioni`**: scheduled maintenance rows con campi `targa, categoria, manutenzioneDataFine, manutenzioneContratto, manutenzioneKmMax, dataScadenzaRevisione, status (SCADUTA|IN_SCADENZA|OK|SENZA_DATA), daysToDeadline`.
2. **`rifornimenti`**: `targa, dateObj, autistaNome, badgeAutista, litri, km, costo, distributore, source (dossier|tmp|merged)`.
3. **`segnalazioni`**: `ts, dateObj, targa, autistaNome, badgeAutista, tipo, descrizione, stato, letta, isNuova, fotoCount`.
4. **`controlli`**: `ts, targaMotrice, targaRimorchio, targaLabel, autistaNome, badgeAutista, koList, isKo, note`.
5. **`richieste`**: campi attrezzatura, autista, stato (riga 99+ NON LETTA integralmente in questa sessione, DEDOTTO).

### 7.2 Idee funzionali da riprogettare nel Centro di Controllo Avanzato
- **Pattern stati colorati**: `MaintenanceStatus = SCADUTA | IN_SCADENZA | OK | SENZA_DATA` con `daysToDeadline`. IDEA FUNZIONALE: usare lo stesso pattern come `Severity` deterministica dei record nel data engine.
- **Merge multi-source**: `RefuelSource = dossier | tmp | merged`. IDEA FUNZIONALE: il data engine deve dichiarare per ogni record la `sourceCollection` originale e, se merged, la lista di sorgenti contribuenti.
- **Flag operativi**: `letta`, `isNuova`, `isKo`. IDEA FUNZIONALE: filtri standard del Centro Controllo Avanzato.
- **Conteggio fotoCount**: counter di evidenze. IDEA FUNZIONALE: filtri "ha foto" / "senza foto" come dimensione di analisi.
- **Targa di filtro normalizzata**: `targaFilterKey`. IDEA FUNZIONALE: chiave di join unificata pre-calcolata.

### 7.3 Pattern dominio D10
Da `nextCentroControlloDomain.ts:51-69`: dichiarazione esplicita di:
- `logicalDatasets` (6 dataset richiesti).
- `allowedAlertKinds` (4 enum).
- `allowedFocusKinds` (2 enum).

IDEA FUNZIONALE: il Centro di Controllo Avanzato dichiara tutte le metriche/filtri/incroci come enum chiusi, allineato al pattern Zero-Invenzioni della chat IA.

### 7.4 Limiti attuali
- 5 tab fissi, no aggiunta dinamica.
- Niente filtri di periodo configurabili oltre quelli interni a tab.
- Niente incroci tra tab (es. "rifornimenti + segnalazioni dello stesso mezzo nello stesso periodo").
- Niente export filtrato uniforme.
- Niente pannello prove dei numeri mostrati.

DIMOSTRATO via struttura del file (lettura testa) e via documentazione di stato (`STATO_ATTUALE_PROGETTO.md`).

---

## 8. Mezzo360 e Autista360 madre — idee funzionali

### 8.1 Mezzo360 (`pages/Mezzo360.tsx`) — PRESENTI
Letti i datasets dichiarati alle righe 13-30:
- `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@manutenzioni`, `@lavori`, `@materialiconsegnati`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`, `@richieste_attrezzature_autisti_tmp` + 3 root documenti (`@documenti_mezzi/@documenti_magazzino/@documenti_generici`).

Idee funzionali:
- **Timeline aggregata multi-source**: il pattern `TimelineItem { id, ts, title, subtitle, detail, source, record }` (DIMOSTRATO da `Mezzo360.tsx:36-45`). Nel CCA: timeline filtrabile per modulo, periodo, severity.
- **Multi-currency**: `Currency = "EUR" | "CHF" | "UNKNOWN"` con `detectCurrencyFromText` (DIMOSTRATO da `Mezzo360.tsx:47, 80`). Nel CCA: gestione esplicita valuta nei calcoli costi.
- **Targa exact-match unificata**: `normalizeTarga` = `t.toUpperCase().replace(/[^A-Z0-9]/g, "").trim()` (DIMOSTRATO da riga 70-73).
- **Lavoro record discriminator**: `isLavoroRecord(value)` con check su `id, gruppoId, tipo, descrizione` (DIMOSTRATO da riga 49-57).

### 8.2 Autista360 (`pages/Autista360.tsx`) — PRESENTE
Letti i datasets dichiarati alle righe 9-16:
- `@autisti_sessione_attive`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@richieste_attrezzature_autisti_tmp`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`, `@storico_eventi_operativi`.

Idee funzionali:
- **Filtro tipo evento standard**: `FILTER_TYPES = ["All", "Agganci", "Sganci", "Segnalazioni", "Controlli", "Rifornimenti", "Richieste", "Gomme", "Storico"]` (DIMOSTRATO da riga 19-29). Nel CCA: filtri rapidi per tipo evento.
- **Campi timestamp candidati**: `DEFAULT_TS_FIELDS = ["timestamp", "ts", "dataOra", "data", "date", "createdAt", "updatedAt"]` (DIMOSTRATO da riga 31). Nel CCA: pre-calcolare `tsCanonical` per tutti i record per ordinamento uniforme.
- **Match di affidabilita**: `BadgeMatch = "EXACT" | "WEAK"` (DIMOSTRATO da riga 43). Nel CCA: dichiarare la qualita del match come campo del pannello prove.
- **Eventi cambio assetto**: `isChangeEvent`, `beforeMotrice`/`afterMotrice`, `beforeRimorchio`/`afterRimorchio` (DIMOSTRATO da riga 60-66). IDEA FUNZIONALE: incrocio "cambio assetto + segnalazioni post-cambio" come metrica diagnostica.

### 8.3 Cosa NON va riusato (vincolo del prompt)
- nessuna logica runtime di Mezzo360/Autista360 madre va trascinata nel CCA;
- nessun componente UI, nessun hook, nessuna funzione di rendering;
- solo idee funzionali.

---

## 9. Chat IA NEXT attuale — cosa congelare, tenere, censire

Fonte: `AUDIT_INDIPENDENTE_CHIUSURA_CHATIA_V1_2026-05-06.md` (DIMOSTRATO via lettura completa) + Glob `src/next/chat-ia/**` (DIMOSTRATO 95+ file) + `backend/internal-ai/server/lib/*` (DIMOSTRATO struttura tramite Glob).

### 9.1 Stato del prodotto al 2026-05-06
Chat IA NEXT V1 chiusa (`REPORT_CHIUSURA_CHATIA_NEXT_100_2026-05-06.md`). 5 viste 360 operative: Driver360 (vista dedicata), Vehicle360/Site360/Euromecc360/Ricerca360 (CertifiedView config-driven). Motore generico v1: query-engine + universal-resolver + universal-resolver-collection-root + relation-resolver + catalog-validator + chat-zero-preflight + post-llm-resolver + shadow-comparator + fingerprint-validator + adapter. Registry promosso 1.0 STABLE. SPEC Motore Generico promossa v1.0 STABLE.

### 9.2 Bug noto NON RISOLTO
`DIAGNOSI_LOOKUP_VEHICLE360_2026-05-06.md`: il lookup Vehicle360 con prompt targa non trova il record perche' `matchesEntryRecord` (`universal-resolver.js:144-149`) non implementa le matchStrategy diverse da Driver360 + cap `maxReturnedVehicleRecords: 1` su `vehicles.mezziAziendali`. Risultato: l'utente vede "dato non trovato nelle fonti autorizzate" anche se il mezzo esiste. **Questo bug e' coerente con la decisione di Giuseppe di sospendere la Chat IA analitica**.

### 9.3 Classificazione

| Componente | File principali | Giudizio | Motivazione |
|---|---|---|---|
| 5 viste 360 — Driver360 | `src/next/chat-ia/views/Driver360.tsx` (343 righe attuali) | **DA CONGELARE COME PRODOTTO** + **CANDIDATO TECNICO DA VALUTARE** | Funziona end-to-end (verificato da Giuseppe). Pattern certified-record + ProofPanel e' riusabile. Va congelato come UX, riutilizzabile come reference architetturale. |
| 5 viste 360 — Vehicle360/Site360/Euromecc360/Ricerca360 | `src/next/chat-ia/views/Vehicle360.tsx`, `CertifiedView.tsx`, `view.config.ts` | **DA CONGELARE COME PRODOTTO** | Bug lookup noto. Architettura `view.config.ts + CertifiedView` rimane come **IDEA FUNZIONALE** per CCA (sezioni configurabili). |
| Motore generico — query-engine | `backend/internal-ai/server/lib/query-engine.js` | **CANDIDATO TECNICO DA VALUTARE** | Wrapper deterministico sopra resolver. Non IA, deterministico. Potrebbe essere riutilizzato come adapter di lettura del CCA, ma va sganciato dalla logica di "view binding" chat-specific. |
| Universal resolver | `backend/internal-ai/server/lib/universal-resolver.js` | **CANDIDATO TECNICO DA VALUTARE** + bug noto | Bug match strategy. Pattern proiezione su `allowedFields` + provenance e' valido ma va riprogettato. |
| Universal resolver collection_root | `backend/internal-ai/server/lib/universal-resolver-collection-root.js` | **CANDIDATO TECNICO DA VALUTARE** | Stesso pattern, applicato a root collection. Riutilizzabile come idea per CCA su Euromecc/documenti. |
| Relation resolver | `backend/internal-ai/server/lib/relation-resolver.js` + `relation.config.cjs` | **CANDIDATO TECNICO DA VALUTARE** | Resolver deterministico relazioni con `relationProof`. Idea-portante per CCA: "ogni incrocio ha una prova certificata". |
| Schema strict / Action Router | `backend/internal-ai/server/internal-ai-adapter.js` (CHAT_TOOL_USE_FINAL_MESSAGE_JSON_SCHEMA) | **DA CONGELARE COME PRODOTTO** | Specifica per conversazione IA. Non riusabile per CCA manuale. |
| Catalog validator | `backend/internal-ai/server/lib/catalog-validator.js` | **CANDIDATO TECNICO DA VALUTARE** | Validatore strict di shape `resolvedFilters.v2`. Riutilizzabile come validatore di configurazione filtri CCA. |
| Chat zero preflight | `backend/internal-ai/server/lib/chat-zero-preflight.js` | **DA CONGELARE COME PRODOTTO** | NER deterministico per testo libero IA. Non serve a CCA manuale. |
| Post-LLM resolver | `backend/internal-ai/server/lib/post-llm-resolver.js` | **DA CONGELARE COME PRODOTTO** (gia @deprecated) | Driver360 legacy. |
| Shadow comparator | `backend/internal-ai/server/lib/shadow-comparator.js` | **DA CONGELARE COME PRODOTTO** (gia @deprecated) | Strumento diagnostico. |
| Fingerprint validator | `backend/internal-ai/server/lib/fingerprint-validator.js` | **DA TENERE ATTIVO** | Usato dall'IA chat per validare record fingerprint. Diventa irrilevante se la chat e' nascosta ma non rompe nulla a restare. |
| Pannello prove (ProofPanel) | `src/next/chat-ia/components/ProofPanel.tsx`, `CollapsibleProof.tsx` | **CANDIDATO TECNICO DA VALUTARE** | Pattern collapsible+filtri vietati ottimo per pannello prove CCA. UX da riprogettare in stile CCA. |
| relationProof types | `src/next/chat-ia/core/chatIaTypes.ts` | **CANDIDATO TECNICO DA VALUTARE** | Tipi `RelationProof`, `CertifiedField`, `CertifiedRecord` riusabili come spec di output del data engine CCA. |
| Tools registry chat (50+ file) | `src/next/chat-ia/tools/registry/tool*.ts` | **DA CONGELARE COME PRODOTTO** | Wrapper sui domain reader pensati per OpenAI function calling. Non servono a CCA manuale. |
| Agents/specialists | `src/next/chat-ia/agents/**` | **DA CONGELARE COME PRODOTTO** | Multi-agente legacy, gia' bypassato dal motore generico. |
| Sectors (mezzi/cisterna/...) | `src/next/chat-ia/sectors/**` | **DA CONGELARE COME PRODOTTO** | Settori vecchia chat, sostituiti dalle viste 360. |
| ChatIaToolUsePage / ChatIaPage | `src/next/chat-ia/ChatIaToolUsePage.tsx`, `ChatIaPage.tsx` | **DA CONGELARE E NASCONDERE DALLA UI** (raccomandato) | Pagine principali. Possono essere rimosse dal launcher/sidebar senza rompere altro (la chat non e' chiamata da altri moduli, vedi §10). |
| Chat report archive (PDF) | `src/next/chat-ia/reports/chatIaReportPdf.ts`, `chatIaReportArchive.ts` | **DA CONGELARE COME PRODOTTO** | Archivio chat-specific (collection `chat_ia_reports`). Sospeso con la chat. |
| Diagnostics chat-ia | `backend/internal-ai/server/lib/__diagnostics__/*.mjs` | **DA TENERE ATTIVO** | Test programmatici Zero-Invenzioni. Eseguibili come baseline anche se la chat non e' visibile in UI. |
| IA documentale / Archivista (`/next/ia/archivista`, `/next/ia/libretto`, `/next/ia/documenti`, `/next/ia/copertura-libretti`) | `NextIAArchivistaPage.tsx`, `NextIALibrettoPage.tsx`, `NextIADocumentiPage.tsx`, `NextIACoperturaLibrettiPage.tsx` | **DA NON TOCCARE** | Sono la "altra IA" (archiviazione documenti, estrazione campi libretto, copertura). NON sono Chat IA analitica. Restano produttive. Decisione di Giuseppe e' chiara: sospendere SOLO la chat analitica. |
| Cisterna IA | `NextCisternaIAPage.tsx`, `nextCisternaIaClient.ts` | **DA NON TOCCARE** | Modulo IA dedicato cisterna, attivo. |

### 9.4 Cosa va tenuto attivo
- IA documentale (`/next/ia/libretto`, `/next/ia/documenti`, `/next/ia/copertura-libretti`).
- Archivista (`/next/ia/archivista`).
- Cisterna IA (`/next/cisterna/ia`).
- Backend `backend/internal-ai/server/internal-ai-adapter.js` (e' usato anche dall'IA documentale per estrazione campi via OpenAI). DA VERIFICARE: a quanto risulta dagli import in `NextIAArchivistaPage.tsx` (`ArchivistaArchiveClient.ts`) e nei tools, l'adapter serve sia chat che documentale. Disabilitare la chat NON deve disabilitare il backend.

---

## 10. Route a rischio regressione

### 10.1 Verifica route IA citate nel prompt

| Route citata | Stato | Riferimento file |
|---|---|---|
| `/next/chat-tool` | DIMOSTRATO esistente | `App.tsx:491-497` (registrata DENTRO il blocco `/next` con path assoluto inusuale; DIMOSTRATO ma struttura anomala) |
| `/next/chat` | DIMOSTRATO | `App.tsx:482-489` |
| `/next/ia/interna` | NON PRESENTE | Cercato grep "ia/interna" in `App.tsx` e `nextStructuralPaths.ts`: zero match. Probabilmente NON esiste piu'. |
| `/next/ia/documenti` | DIMOSTRATO | `App.tsx:602-609`, `nextStructuralPaths.ts:29` |
| `/next/ia/libretto` | DIMOSTRATO | `App.tsx:594-601`, `nextStructuralPaths.ts:28` |
| `/next/ia/archivista` | DIMOSTRATO | `App.tsx:498-505` |
| `/next/ia/copertura-libretti` | DIMOSTRATO | `App.tsx:610-617`, `nextStructuralPaths.ts:30` |

### 10.2 Route a rischio se la Chat IA viene nascosta

| Path | Rischio se nascosta | Rischio se rimossa | Raccomandazione |
|---|---|---|---|
| `/next/chat` (`ChatIaPage`) | nessuno (la chat e' standalone, l'home la espone via `HomeInternalAiLauncher.tsx`) | basso (componente ChatIaPage e' wrapper di ChatIaToolUsePage; la rimozione del NavLink risolve tutto) | **NASCONDERE DALLA UI**, non rimuovere fisicamente |
| `/next/chat-tool` (`ChatIaToolUsePage`) | nessuno (path tecnico) | basso | **NASCONDERE DALLA UI** |
| `/next/ia/archivista` | medio se rimossa (Archivista usa sue route interne ma e' chiamata anche da Home launcher in modalita V1, DIMOSTRATO da `HomeInternalAiLauncher.tsx` audit precedente) | medio | **TENERE ATTIVA** (archivista e' produttivo) |
| `/next/ia/libretto` | basso | basso | **TENERE ATTIVA** |
| `/next/ia/documenti` | basso | basso | **TENERE ATTIVA** |
| `/next/ia/copertura-libretti` | basso | basso | **TENERE ATTIVA** |
| `/next/cisterna/ia` | basso | basso (chiamata da `/next/cisterna`) | **TENERE ATTIVA** |
| `/next/scadenze-collaudi` | nessuno (modulo nuovo NEXT-nativo) | n/a | **NON TOCCARE** |
| Home launcher | medio: `HomeInternalAiLauncher.tsx` espone i 4 quick-action Archivista + 1 prompt "IA Report" che porta a `/next/chat`. Se la chat e' nascosta, il quick-action "Apri" del prompt diventa orfano. | medio | il prompt "IA Report" va o disabilitato, o reindirizzato al nuovo CCA quando esistera |

### 10.3 Dipendenze condivise
- Backend `internal-ai-adapter.js` serve sia la chat che IA documentale (DOCUMENTATO via tool registry chat e router archivista). **Non disabilitare il backend**.
- `cloneWriteBarrier.ts` non e' impattato.
- `signInAnonymously` rimane invariato (`App.tsx:155-165`).

### 10.4 Numero route a rischio: ~6 (le 2 chat + 4 IA documentali, di cui solo le 2 chat realmente da disattivare).

---

## 11. Funzionalita' proposte per Centro di Controllo Avanzato

Sintesi sulla base dei task 1-5. Stato V1 vs V2 e' una proposta, non vincolante.

### 11.1 Filtri globali
| Filtro | Sorgente | V1 | V2 | Rischio |
|---|---|---|---|---|
| Periodo (`from`/`to`) | data/timestamp normalizzati | SI | — | basso |
| Mese / Anno (preset) | derivato da data | SI | — | basso |
| Targa (singola, exact match) | tutte le collection con campo targa | SI | — | basso (richiede normalizzazione canonica §6) |
| Targa (multi-select) | idem | — | V2 | medio (sintassi UI) |
| Autista (badge / id) | colleghi + sessioni + eventi | SI | — | medio |
| Autista (nome) | colleghi (per ricerca) | — | V2 | alto (mismatch caso) |
| Stato (enum per modulo) | manutenzioni, lavori, ordini, segnalazioni, controlli | SI | — | basso (enum chiusi) |
| Tipo evento (manut/rifornim/segnalaz/controllo/richiesta/ordine/preventivo/lavoro/cambio_assetto) | discriminator | SI | — | basso |
| Fornitore (id) | ordini + preventivi + listino + materiali consegnati + manutenzioni | SI | — | medio (chiavi multiple) |
| Modulo selezionato (multi) | enum chiuso di moduli | SI | — | basso |
| Categoria mezzo (12 enum osservati) | mezzi.categoria | — | V2 | basso |
| Cantiere (id) | attrezzature + lavori + materiali | — | V2 | alto (label denormalizzata, §6) |
| Materiale (stockKey) | inventario + materiali consegnati + ordini | — | V2 | alto (3 chiavi) |
| Documento (numeroDocumento + tipo) | documenti root | — | V2 | medio |
| Urgenza (lavori) | lavori | — | V2 | basso |
| Flag `letta` / `isNuova` / `isKo` | tmp autisti | SI | — | basso |
| Source (dossier/tmp/merged) | rifornimenti | SI | — | basso |

### 11.2 Selezione multi-modulo (combinazioni)
- **Mezzo singolo + tutti i suoi eventi** (rifornimenti + manutenzioni + segnalazioni + controlli + lavori + materiali + documenti): IDEA RIPRESA da Mezzo360. Combinazione UTILE V1.
- **Autista singolo + tutti i suoi record** (sessioni + segnalazioni + controlli + rifornimenti + richieste + gomme): IDEA RIPRESA da Autista360. UTILE V1.
- **Periodo + mezzo + tipo evento**: V1 (sostituto operativo del Centro Controllo attuale).
- **Mezzo + fornitore (manutenzioni)**: V2.
- **Cantiere + materiali**: V2 (richiede chiarimento fonte canonica cantiere — voce #4 matrice 2026-05-06).

### 11.3 Incroci candidati
| A | B | Chiave | Normalizzazione | V1/V2 | Rischio |
|---|---|---|---|---|---|
| `@rifornimenti_autisti_tmp` | `@rifornimenti` (dossier) | `originId` o `(targa+timestamp)` | trim, exact | V1 | basso (gia' fatto da Centro Controllo madre tramite RefuelSource=merged) |
| `@manutenzioni` | `@lavori` | `targa` + `data` | normalizePlate, exact data | V1 | basso |
| `@segnalazioni_autisti_tmp` | `@rifornimenti_autisti_tmp` | `(badgeAutista + targa + period)` | trim badge, normalizePlate | V1 | basso |
| `@controlli_mezzo_autisti` | `@cambi_gomme_autisti_tmp` | `(badgeAutista + targa)` | idem | V2 | medio |
| `@manutenzioni` | `@officine` | `officinaId` | trim, exact | V1 | basso |
| `@manutenzioni` | `@materialiconsegnati` | `targa + period` o `(lavoroId)` | exact | V2 | medio |
| `@ordini` | `@inventario` | `stockKey` o `codice` | trim+lower | V2 | alto (3 chiavi materiale) |
| `@ordini` | `@preventivi` | `(supplierId + numeroPreventivo)` | exact | V2 | medio |
| `@fornitori` | `@preventivi` + `@ordini` | `supplierId` | exact | V2 | medio |
| `@autisti_sessione_attive` | `@storico_eventi_operativi` | `(badgeAutista + timestamp range)` | exact | V1 | medio |
| `@mezzi_aziendali` | 3 root `@documenti_*` | `targa` | normalizePlate canonica | V2 | medio |
| `euromecc_pending` | `euromecc_done` + `euromecc_issues` | `(areaKey + subKey)` | exact | V2 | basso |

### 11.4 Raggruppamenti
- per targa (V1)
- per mese (V1)
- per autista/badge (V1)
- per fornitore (V2)
- per modulo (V1)
- per categoria mezzo (V2)
- per stato (V1)
- per cantiere (V2)
- per materiale (V2)

### 11.5 Aggregazioni
- somma (V1: litri, costo, importo, km)
- conteggio (V1: record per targa/mese/autista)
- media (V1: km/litri rifornimenti, costo medio manutenzione)
- min/max (V1: data piu vecchia/recente)
- delta (V2: variazione mese su mese)
- percentuale (V2: % flotta scaduta revisione)
- trend (V2: serie mensile)
- ranking (V2: top 10 mezzi per consumo/costo)

### 11.6 Tabelle dinamiche
- Colonne candidate (per ogni modulo, derivate da `allowedFields` boundary).
- Colonne obbligatorie: `targa` (se applicabile), `data`, `tipo`, `stato`, `fonte`.
- Colonne prova: `sourceCollection`, `sourceRecordId`, `sourceField` (per pannello prove, NON in tabella primaria).
- Drilldown: click su record → dossier/dettaglio del modulo originale.

### 11.7 Grafici
- KPI card (V1)
- Trend linea (V2)
- Barre raggruppate per mese (V2)
- Torta per percentuali categoria (V2)
- Ranking table (V2)

### 11.8 Pannello prove
- Filtri applicati (lista enum).
- Moduli letti.
- Collezioni/dataset usati.
- Conteggio record letti vs filtrati.
- Record sorgente (lista con id certificato + collection).
- Formula della metrica (es. `sum(rifornimenti.litri WHERE targa=X AND date in [from,to])`).
- Record esclusi e motivo (es. "data assente" / "campo non in allowedFields").
- Avvisi su dati mancanti.

### 11.9 Export
- PDF (V2 — pattern gia' presente in `pdfEngine.ts`)
- CSV (V1 — semplice da implementare a partire dalle righe filtrate)
- Excel (V2)

### 11.10 Numero funzionalita V1 proposte: **~22** (tutti i punti contrassegnati V1 sopra).

---

## 12. Struttura consigliata del nuovo Centro di Controllo Avanzato

**Proposta architetturale, NON implementata.**

### 12.1 Route consigliata
- Path: `/next/centro-avanzato`.
- Motivo: nome distinto da `/next/centro-controllo` (mantiene parity legacy intatta), distinto da Chat IA, autonomo.
- Navigazione: nuovo NavLink in `NextShell.tsx` (a fianco del Centro Controllo legacy o sostituto progressivo).
- Cosa NON deve rompere: `/next/centro-controllo` (parity legacy) resta operativo. Home banner allarmi (`NextHomePage.tsx:11-25`) resta intatto. Chat IA non viene toccata in backend.

### 12.2 File/cartelle ipotetici futuri (NON creare ora)
```
src/next/centro-avanzato/
  NextCentroAvanzatoPage.tsx           # pagina principale
  config/
    cca.modules.ts                     # enum moduli abilitati
    cca.metrics.ts                     # catalogo metriche
    cca.relations.ts                   # catalogo incroci
    cca.fields.ts                      # mappa campi/normalizzazione
  engine/
    ccaDataEngine.ts                   # data engine deterministico
    ccaFilterValidator.ts              # validatore configurazione filtri
    ccaProofBuilder.ts                 # costruttore pannello prove
    ccaPlateNormalizer.ts              # canonical plate normalization
    ccaDateNormalizer.ts               # canonical date normalization
  components/
    CcaFiltersPanel.tsx                # UI filtri
    CcaResultsTable.tsx                # tabella risultati
    CcaKpiGrid.tsx                     # KPI card
    CcaProofPanel.tsx                  # pannello prove (riprogettato)
    CcaModuleSelector.tsx              # selettore moduli
  types/
    cca.types.ts                       # tipi TypeScript
src/next/domain/                       # NESSUN nuovo file qui (riusa esistenti read-only)
docs/product/SPEC_CENTRO_AVANZATO_NEXT.md   # spec architetturale
```

### 12.3 Separazione responsabilita
- **UI** (`components/Cca*`): solo React, niente lettura dati.
- **Data engine** (`engine/ccaDataEngine.ts`): legge domain reader esistenti, non Firestore diretto. Output certificato.
- **Filtri** (`engine/ccaFilterValidator.ts`): valida configurazione filtri (riprende pattern `catalog-validator.js` chat IA).
- **Metriche** (`config/cca.metrics.ts`): catalogo dichiarativo, niente codice runtime.
- **Incroci** (`config/cca.relations.ts`): catalogo dichiarativo, riprende pattern `relation.config.cjs` chat IA.
- **Pannello prove** (`components/CcaProofPanel.tsx` + `engine/ccaProofBuilder.ts`): obbligatorio, sempre presente.
- **Export** (`engine/ccaExportCsv.ts` futuro): condivide filtri della UI.
- **Futura assistenza filtri**: in V2, una funzione `parsePromptToFilters(prompt) -> FilterConfig` che NON tocca dati, solo trasforma testo libero in configurazione filtri visibile all'utente.

### 12.4 Data Engine consigliato

```
runCcaQuery({
  modules: ["@rifornimenti_autisti_tmp", "@manutenzioni"],   // moduli selezionati
  filters: {
    period: { from: "2026-01-01", to: "2026-04-30" },
    targa: "TI180147",
    autistaBadge: null,
    stato: null,
    tipoEvento: null
  },
  groupBy: "mese",
  metrics: ["count", "sum:litri"],
  output: "table+kpi+proof"
}) -> CcaResult {
  rows: CcaRow[],
  kpis: CcaKpi[],
  proof: CcaProof,
  warnings: CcaWarning[]
}
```

Responsabilita:
- riceve configurazione filtri TYPED.
- legge dataset via `nextUnifiedReadRegistryDomain.ts` (DEDOTTO: domain unificato gia esistente nel repo, va verificato il contenuto).
- normalizza dati (plate, date, badge).
- applica filtri.
- calcola metriche.
- incrocia moduli (solo via chiavi forti, mai fuzzy).
- restituisce righe, KPI, grafici e prove.

NON deve fare:
- chiamate IA / OpenAI.
- inferenze su dati mancanti.
- match per nome simile.
- visualizzare URL firmati (regola Zero-Invenzioni preservata).
- mostrare campi fuori `allowedFields` boundary.

### 12.5 Configurazione filtri (forma concettuale, NON codice)
```
CcaFilterConfig = {
  modules: Array<ModuleEnum>,         // enum chiuso 14-20 moduli
  period: { from: ISODate, to: ISODate } | null,
  targa: string | null,                // exact-match canonica
  autistaBadge: string | null,
  autistaId: string | null,
  fornitoreId: string | null,
  cantiereId: string | null,
  stato: StatoEnum | null,
  tipoEvento: TipoEventoEnum | null,
  source: SourceEnum | null,           // dossier/tmp/merged
  flags: { letta?: boolean, isNuova?: boolean, isKo?: boolean, hasFoto?: boolean },
  groupBy: GroupByEnum | null,
  metrics: Array<MetricEnum>,
  output: { table: boolean, kpi: boolean, proof: boolean, charts: ChartEnum[] }
}
```

### 12.6 Catalogo metriche candidate (per V1)
| Nome | Formula | Dataset | Campi sorgente | Rischio | V1/V2 |
|---|---|---|---|---|---|
| `count.records` | numero righe filtrate | qualsiasi | id | basso | V1 |
| `sum.litri` | somma `litri` | `@rifornimenti_autisti_tmp` + `@rifornimenti` (merged) | `litri` | basso | V1 |
| `sum.costo` | somma `costo` | `@rifornimenti` (mai TMP per costo) | `costo` | basso | V1 |
| `sum.importo` | somma `importo` | `@manutenzioni` | `importo` | medio (valuta mista, vedi §8.1) | V1 |
| `count.scadute` | count `status===SCADUTA` | `@mezzi_aziendali` (revisione) | `dataScadenzaRevisione` | basso | V1 |
| `count.in_scadenza` | count `status===IN_SCADENZA` | idem | idem | basso | V1 |
| `count.segnalazioni_nuove` | count `letta===false` | `@segnalazioni_autisti_tmp` | `letta` | basso | V1 |
| `count.controlli_ko` | count `koList.length>0` | `@controlli_mezzo_autisti` | `controlliKo` | basso | V1 |
| `avg.km_per_litro` | sum(km_delta)/sum(litri) | `@rifornimenti` | `km`, `litri` | medio (richiede ordinamento) | V2 |
| `delta.scadenze_mese` | confronto count tra periodi | `@mezzi_aziendali` | dataScadenzaRevisione | medio | V2 |

### 12.7 Catalogo incroci candidati (vedi §11.3 per la lista completa).

### 12.8 Pannello prove — requisiti
Struttura obbligatoria (riprende `RecordProvenance` chat IA):
- **filters**: rendering della configurazione filtri applicata.
- **modules**: lista moduli letti.
- **datasets**: per ciascun modulo, dataset boundary letto + numero record letti.
- **records**: lista compatta `[sourceCollection, sourceRecordId, sourceField]` per ogni record contributore al numero mostrato.
- **formula**: stringa testuale della formula deterministica (es. `count(rifornimenti WHERE targa=X AND date in [from,to])`).
- **counts**: `read`, `filtered_in`, `filtered_out`, `excluded_by_field_missing`, `excluded_by_normalization`.
- **excluded_records**: lista record esclusi con motivo (`missing_field:targa`, `out_of_period`, ecc.).
- **warnings**: avvisi (`field_normalization_inconsistent`, `multi_currency_detected`, `cantiere_label_only`).
- **collapsedByDefault**: true (riusa pattern ProofPanel chat IA).

### 12.9 Cosa entra in V1 (proposta minima)
- 1 route nuova `/next/centro-avanzato`.
- 1 modulo: anagrafica mezzo + sezione rifornimenti dello stesso mezzo.
- 3 filtri: periodo (preset mese/anno/custom), targa exact-match canonica, source merged.
- 2 metriche: `count.rifornimenti`, `sum.litri`.
- 1 tabella + 2 KPI card + pannello prove minimo.
- Nessuna IA.
- Nessun grafico.
- Nessun export.

### 12.10 Cosa resta V2
- Multi-modulo simultaneo.
- Incroci complessi.
- Grafici.
- Export PDF/Excel.
- Assistente filtri da prompt naturale.
- Riapertura Mezzo360/Autista360 come "viste pre-configurate" del CCA.

### 12.11 Cosa va escluso
- Generazione narrativa di numeri.
- Risposte testuali libere.
- Match fuzzy.
- Lettura dati fuori boundary.
- Riuso runtime/UI del Centro Controllo legacy.
- Riuso runtime/UI della Chat IA analitica.

---

## 13. Catalogo metriche candidate
Vedi §12.6 (10 metriche, 8 V1, 2 V2).

## 14. Catalogo incroci candidati
Vedi §11.3 (12 incroci, 6 V1, 6 V2).

## 15. Pannello prove — requisiti
Vedi §12.8.

---

## 16. Primo step sicuro proposto

**Step 0 — pagina vuota routed.**

1. Aggiungere a `App.tsx` route `/next/centro-avanzato` con guard `centro-controllo` esistente.
2. Creare `src/next/NextCentroAvanzatoPage.tsx` con header + placeholder "in costruzione" + una sola sezione con riconoscimento `ChatZeroInvenzioniMessage`-like minimo (etichetta "Anagrafica mezzo: in arrivo").

**No.** Lo step 0 cosi' formulato non e' verificabile (nessuna lettura dati). Riformulato:

**Step 0 corretto — pagina con UNA query reale e tabella semplice:**

1. Aggiungere route `/next/centro-avanzato` (senza inserirla nel menu finche' non e' verde).
2. Creare `src/next/NextCentroAvanzatoPage.tsx` (~150 righe):
   - 1 input "targa" con normalizzazione canonica.
   - chiamata diretta a `readNextRifornimentiReadOnlySnapshot()` (`nextRifornimentiDomain.ts`, DEDOTTO esistente, da verificare contenuto).
   - tabella con colonne: `data, autista (badge), litri, km, source`.
   - 1 KPI card: `count rifornimenti per la targa nel periodo` (default 90 giorni).
   - 1 pannello prove minimo: lista `[sourceCollection, sourceRecordId, sourceField=targa]` per ogni record visualizzato + counter "letti / filtrati / esclusi".

**Perche' e' il primo step piu' sicuro**:
- riusa un domain reader gia' verificato (`nextRifornimentiDomain.ts` e' usato dal Centro Controllo NEXT attuale, DEDOTTO da `NextCentroControlloParityPage.tsx:24-27`).
- una sola fonte (`@rifornimenti_autisti_tmp` o `@rifornimenti`).
- una sola chiave di join (targa).
- nessun incrocio.
- nessuna IA.
- nessun grafico.
- pannello prove minimo dimostra il pattern senza complicazioni.

**File futuri ipotetici**: `NextCentroAvanzatoPage.tsx` (1 file). Eventualmente `cca.types.ts` ridotto. ~150-200 righe totali.

**Rischi**: se la normalizzazione targa e' inconsistente (§6.3), la tabella mostra zero record per una targa che esiste. **Mitigazione**: definire `ccaPlateNormalizer.ts` come prima dipendenza, anche minima (1 funzione, 5 righe).

**Prova runtime di chiusura**:
- Targa fittizia "ZZ000000" → tabella vuota + KPI=0 + pannello mostra "0 letti, 0 filtrati, 0 esclusi".
- Targa reale anonimizzata letta runtime → tabella popolata + KPI=N + pannello mostra N record sorgente.
- Cambio periodo → conteggio si aggiorna deterministicamente.

**Cosa NON deve includere**:
- multi-modulo;
- incroci;
- grafici;
- export;
- IA;
- riuso runtime/UI Centro Controllo legacy o Chat IA;
- modal Mezzo360-like.

---

## 17. Prove runtime reali richieste

| # | Test | Scopo | Metodo verifica indipendente | Criterio PASS | Rischio coperto |
|---|---|---|---|---|---|
| T1 | Targa exact-match — record corretti | per targa X esistente, tabella mostra solo record con targa==X | conteggio Firestore via console + filter manuale = conteggio UI | uguali | mismatch normalizzazione (§6) |
| T2 | Periodo — record nel range | dato periodo [from,to], tabella mostra solo record con data in [from,to] | filter manuale dataset | uguali | parsing date misto |
| T3 | Conteggio = somma sorgente | KPI conteggio = numero record nella tabella | counter componente | uguali | drift filtro |
| T4 | Somma metriche | sum.litri UI = sum manuale dei record sorgenti | filter+sum manuale | uguali (entro float epsilon) | overflow / null skipping |
| T5 | Incrocio modulo A + B usa solo chiavi reali | per incrocio attivo, ogni record join ha tutte le chiavi forti certificate | inspect pannello prove | nessun record con `relationProof.certainty != "exact"` | join errato |
| T6 | Pannello prove completo | per ogni numero mostrato, pannello prove elenca i record contributori | export records dal pannello, somma manuale | match | numero senza fonte |
| T7 | Filtro ambiguo → warning | filtro senza dato certo (es. nome autista senza badge) genera warning visibile | inspect pannello | warning presente | match approssimativo nascosto |
| T8 | Export = UI | (V2) CSV esportato corrisponde alle righe UI | confronto file vs DOM | uguali | regression export |
| T9 | URL firmati assenti | nessun record mostra `librettoUrl`/`pdfUrl`/`fotoUrl` etc. | grep su DOM | zero match | leak Storage |
| T10 | Targa sintetica `ZZ000000` → vuoto | targa sintetica → tabella vuota, pannello "0 letti" | inspect | tabella vuota | falsi positivi |
| T11 | Conteggio Centro Controllo legacy vs CCA | dato lo stesso filtro periodo+targa, conteggio rifornimenti CCA == conteggio Centro Controllo legacy | confronto UI legacy vs CCA | uguali | divergenza algoritmica |
| T12 | normalizePlate canonica | targa con spazi / lowercase / trattini → tutte risolte alla stessa chiave | unit test mirato | match | regression normalizzazione |

---

## 18. Rischi identificati

| # | Rischio | Impatto | Area | Mitigazione | V1/V2 |
|---|---|---|---|---|---|
| R1 | Rottura IA documentale se si modifica `backend/internal-ai/` | ALTO (Archivista non funziona piu) | backend | non toccare backend; CCA legge solo via domain reader frontend | V1 |
| R2 | Perdita reader sicuri esistenti (es. `nextCentroControlloDomain.ts`, `nextRifornimentiDomain.ts`) | MEDIO (CCA dovrebbe ricostruirli) | domain | riusare i domain reader esistenti senza modificarli | V1 |
| R3 | Duplicazione logiche dati (CCA vs Centro Controllo legacy vs Mezzo360 madre) | MEDIO (drift di calcolo) | tutto | data engine CCA come unica fonte di calcolo metriche futuro; Centro Controllo legacy resta read-only finche' V1 CCA non lo sostituisce | V1 |
| R4 | Regressione su route IA documentali | ALTO (utenti perdono Archivista/Libretto) | App.tsx, NextShell | nascondere SOLO `/next/chat` e `/next/chat-tool` dalla UI; lasciare le altre route IA attive | V1 |
| R5 | Confusione Chat IA analitica vs IA documentale | MEDIO | UI | messaggi UX espliciti su pagine sospese; nuovo nome distinto "Centro Avanzato" | V1 |
| R6 | Cancellazione di file ancora utili | ALTO | Chat IA dir | NON cancellare nessun file della Chat IA in V1; solo nascondere dalla UI | V1 |
| R7 | Mappa collezioni da documentazione obsoleta | MEDIO | catalogazione | priorita: codice reale > registro v1.0 STABLE > documentazione storica | V1 |
| R8 | Join errati tra moduli (cantiere/materiale/fornitore con label denormalizzata) | ALTO (dati mostrati sbagliati) | data engine | rinviare cantiere e materiali a V2; V1 solo targa/autista/data | V1 |
| R9 | Chiavi targa/autista non normalizzate | ALTO (zero record per targa esistente — bug Vehicle360 noto) | data engine | `ccaPlateNormalizer.ts` come prima dipendenza, condivisa da reader e UI | V1 |
| R10 | Metriche con formule ambigue (multi-currency, null skipping, missing field) | MEDIO | data engine | ogni metrica dichiara formula testuale + criteri di esclusione, visibili nel pannello prove | V1 |
| R11 | Dati duplicati (rifornimenti tmp vs dossier) | MEDIO (KPI gonfiati) | rifornimenti | riprodurre la logica `RefuelSource=merged` di Centro Controllo legacy come prima regola di deduplica | V1 |
| R12 | Conteggi non allineati con Centro Controllo legacy | ALTO (Giuseppe perde fiducia) | data engine | T11 di §17 obbligatoria | V1 |
| R13 | Export diverso da UI | MEDIO | export | export riusa stessa configurazione filtri della UI | V2 |
| R14 | Pannello prove incompleto | ALTO (CCA perde la sua qualita-portante) | UI | requisiti §12.8 obbligatori | V1 |
| R15 | Modulo troppo grande in V1 | MEDIO (rischio incompletezza) | scope | V1 = 1 modulo + 1 incrocio + 1 KPI; tutto il resto V2 | V1 |
| R16 | Auth/storage rules deny-all | (non impatta CCA read-only) | infra | CCA e' read-only, non scrive; nessuna mitigazione necessaria salvo testare con utente non admin | V1 |
| R17 | Centro Controllo legacy mostra dati che CCA potrebbe non riprodurre identicamente | MEDIO | parita | V1 NON sostituisce Centro Controllo legacy; coesistenza temporanea | V1 |
| R18 | "Assistente filtri" futuro reintroduce ambiguita IA | MEDIO | V2 | l'assistente NON produce numeri; produce solo CcaFilterConfig visibile all'utente | V2 |

---

## 19. Piano a step proposto

| # | Obiettivo | File futuri | Output | Prova | Perche' qui | Cosa NON fare |
|---|---|---|---|---|---|---|
| 1 | Step 0 (cf. §16) — pagina con 1 query reale | `NextCentroAvanzatoPage.tsx`, `ccaPlateNormalizer.ts` | tabella rifornimenti per targa con pannello prove minimo | T1, T6, T10, T12 di §17 | minimo verificabile, riusa domain esistente | niente IA, niente incroci |
| 2 | Tipi base + filter validator | `cca.types.ts`, `ccaFilterValidator.ts` | tipi TypeScript stretti su `CcaFilterConfig` | tsc PASS | pulisce le firme prima di crescere | niente catalog metriche |
| 3 | Catalog metriche minimo | `cca.metrics.ts` con 3 metriche V1 (`count.rifornimenti`, `sum.litri`, `count.segnalazioni_nuove`) | metriche dichiarative | T3, T4 | senza catalog le metriche si moltiplicano | niente formule complesse |
| 4 | Filtri standard | `CcaFiltersPanel.tsx` con periodo + targa + flags | UI filtri | T1, T2, T7 | senza filtri il CCA e' un dump | niente multi-select V1 |
| 5 | Aggiungere modulo manutenzioni | aggiornamento `cca.modules.ts` e `ccaDataEngine.ts` | secondo dataset disponibile | T1 esteso a manutenzioni | dimostra il pattern multi-modulo | niente grafici |
| 6 | Primo incrocio (rifornimenti+manutenzioni per targa+periodo) | `cca.relations.ts` con 1 incrocio | tabella unificata + KPI | T5 | dimostra pattern incrocio deterministico | niente label fornitore/cantiere |
| 7 | Tab moduli espandibile | `CcaModuleSelector.tsx` | UI scelta moduli | T1, T11 | UI matura | niente layout complesso |
| 8 | Centro Controllo legacy ↔ CCA — comparazione | nessun nuovo file | T11 verificato in browser | uguali numeri tra UI legacy e CCA | momento decisionale | nessun cambiamento legacy |
| 9 | Hide Chat IA dalla UI | `HomeInternalAiLauncher.tsx` (rimuovere quick-action chat), `NextShell.tsx` (rimuovere NavLink) | UI senza link chat | nessun NavLink → /next/chat | dopo che CCA copre i casi base | NON cancellare file `src/next/chat-ia/**` |
| 10 | V2 — assistente filtri | `engine/ccaPromptToFilters.ts` | parser deterministico + visibility totale | T7 | valore aggiunto utente | mai produrre numeri |

Tempo stimato V1 (step 1-8): variabile, dipende da Giuseppe + agente esecutore. Step 1 minimo: ~150-200 righe.

---

## 20. Validazione finale dell'idea

1. **Coerente con il repo reale?** SI. Il repo ha (a) 39 entry boundary verificate, (b) ~31 domain reader NEXT, (c) un Centro Controllo legacy gia funzionante a 5 tab, (d) un patrimonio Chat IA con architettura "view config + relation resolver + pannello prove" perfettamente compatibile con il pattern CCA proposto, (e) decisioni strategiche gia registrate (Mezzo360/Autista360 esclusi da NEXT a favore di "capability IA + chat unificata", scelta ora rivedibile).
2. **Quali dati reali la supportano?** I 32 dataset storage `items[]` + 6 root collection + 1 Storage path. Le chiavi forti targa/badge/id sono normalizzate ma con inconsistenze tra reader (§6.3, R9).
3. **Quali moduli sono maturi per V1?** Mezzi anagrafica (`@mezzi_aziendali`), rifornimenti (`@rifornimenti` + `@rifornimenti_autisti_tmp`), segnalazioni (`@segnalazioni_autisti_tmp`), controlli (`@controlli_mezzo_autisti`), manutenzioni (`@manutenzioni`), lavori (`@lavori`).
4. **Quali troppo rischiosi V1 → V2?** Cantieri (label denormalizzata), materiali (3 chiavi diverse), fornitori (chiavi multiple), Euromecc (sottografo separato).
5. **Quali collezioni affidabili?** Le 32 `exact_document` con boundary VERIFICATA RUNTIME nel registro v1.0.
6. **Quali richiedono verifica?** `@impostazioni_app` (allowedFields vuoto), `@mezzi_foto_viste`/`@mezzi_hotspot_mapping` (uso interno UI), `@analisi_economica_mezzi` (esclusa per design), `@costiMezzo` (writer non chiaro).
7. **Quali incroci sicuri V1?** rifornimenti tmp+dossier, manutenzioni+lavori per targa+data, segnalazioni+rifornimenti per badge+targa+periodo, sessioni+eventi.
8. **Quali rischiosi?** ordini+inventario, fornitori+preventivi+ordini, mezzi+documenti root, euromecc cross-tab.
9. **Cosa Chat IA congelare?** Le 5 viste 360 come prodotto, ChatIaPage/ChatIaToolUsePage UI, sectors, agents, tools registry, post-llm-resolver, shadow-comparator, schema strict.
10. **Cosa tenere attivo?** IA documentale (libretto, documenti, copertura, archivista), Cisterna IA, fingerprint validator, diagnostics chat-ia.
11. **Cosa NON cancellare fisicamente?** Niente. Tutto il codice Chat IA puo' essere `nascosto dalla UI` ma resta presente come riferimento architetturale e per il "candidato tecnico da valutare" futuro.
12. **Primo step consigliato?** Step 0 (§16): pagina `/next/centro-avanzato` con UNA query rifornimenti per targa, tabella, KPI conteggio, pannello prove minimo. ~150-200 righe.
13. **Struttura piu' sicura?** Vedi §12. Sintesi: route nuova autonoma `/next/centro-avanzato`, data engine deterministico che riusa domain reader esistenti SENZA modificarli, catalog metriche/relazioni dichiarativi, pannello prove obbligatorio, UI semplice, niente IA in V1.

**Verdetto idea: COERENTE CON RISCHI**.
- Coerenza: alta (i dati esistono, l'architettura e' supportata, la separazione "IA documentale tenuta + Chat analitica congelata" e' tecnicamente fattibile).
- Rischi principali: R8 (cantieri/materiali/fornitori con label denormalizzata), R9 (normalizzazione targa inconsistente), R12 (parita conteggi con Centro Controllo legacy), R15 (rischio scope creep V1).

---

## 21. Decisioni che spettano a Giuseppe

1. **Che cosa nascondere dalla UI Chat IA?** Solo `/next/chat` + `/next/chat-tool`? O anche il quick-action "IA Report" del Home launcher? Raccomandazione audit: nascondere entrambi.
2. **Centro Controllo legacy — che fine fa quando il CCA copre gli stessi casi?** Coesistenza permanente / sostituzione progressiva / archiviazione? Raccomandazione: coesistenza fino a parita V1+V2 verificata, poi sostituzione progressiva.
3. **Il path `/next/centro-avanzato` va bene?** Alternative: `/next/cca`, `/next/centro-controllo-avanzato`, `/next/dashboard-avanzato`.
4. **L'assistente filtri V2 e' davvero in scope V2 o meglio rinviare a V3?** Decisione di prodotto.
5. **Mezzo360/Autista360 madre — vanno congelate definitivamente o riproposte come "viste pre-configurate del CCA"?** Idea funzionale interessante, da decidere prima di V2.
6. **Auth/storage rules** restano fuori scope CCA o vanno affrontate prima? Raccomandazione: CCA e' read-only, non urgente; ma `signInAnonymously` + frontend-only role guard e' vulnerabilita di prodotto da chiudere indipendentemente.
7. **Riapertura/refactor del bug lookup Vehicle360** (DIAGNOSI 2026-05-06): si applica il fix come patch chirurgica oppure si lascia il bug noto come "reason in piu' per congelare la chat"? Raccomandazione: lasciare il bug, e' coerente con la sospensione.

---

## 22. File letti — lista completa per trasparenza

### 22.1 File letti in questa sessione (lettura ≥30 righe)
1. `src/App.tsx` (1-719) — completo
2. `src/next/nextStructuralPaths.ts` (1-124) — completo
3. `src/next/NextCentroControlloParityPage.tsx` (1-100) — testa
4. `src/next/domain/nextCentroControlloDomain.ts` (1-80) — testa
5. `src/pages/CentroControllo.tsx` (1-80) — testa
6. `src/pages/Mezzo360.tsx` (1-80) — testa
7. `src/pages/Autista360.tsx` (1-80) — testa
8. `src/next/NextHomePage.tsx` (1-120) — testa
9. `docs/STATO_ATTUALE_PROGETTO.md` (1-80) — completo
10. `docs/audit/AUDIT_INDIPENDENTE_CHIUSURA_CHATIA_V1_2026-05-06.md` (1-80) — testa

### 22.2 File letti via Glob (nome dimostrato, contenuto NON LETTO in questa sessione)
- 76 file `src/next/Next*.tsx`
- 31 file `src/next/domain/next*Domain.ts`
- 32 file `src/pages/*.tsx`
- 30 file `src/next/*.ts`
- 10 file `src/autisti/*.tsx`
- 8 file `src/autistiInbox/*.tsx`
- ~95 file `src/next/chat-ia/**/*.{ts,tsx}`
- 22 file utili `backend/internal-ai/server/**/*.{js,mjs}`
- 23 file `docs/audit/AUDIT_*.md`
- 14 file `docs/product/SPEC_*.md`
- 18 file `docs/_live/*.md`
- 7 file `docs/*.md`

Totale file dimostrati esistenti: **~366**.
Totale file letti integralmente in questa sessione: **2** (App.tsx, nextStructuralPaths.ts, STATO_ATTUALE_PROGETTO.md).
Totale file letti parzialmente (testa) in questa sessione: **8**.
Totale file letti integralmente in audit precedenti (continuita di stato): **~30** (boundary, registry, view.config.ts, relation.config.cjs, query-engine, universal-resolver, catalog-validator, chat-zero-preflight, post-llm-resolver, shadow-comparator, relation-resolver, Driver360.tsx, ProofPanel.tsx, CollapsibleProof.tsx, ChatIaToolUsePage.tsx, ChatIaMessageItem.tsx, REGISTRO_COLLECTION_FIRESTORE.md header, SPEC_MOTORE_GENERICO_NEXT.md, SPEC_CHAT_ZERO_INVENZIONI_NEXT.md header, MATRICE_CHIUSURA_CHATIA_NEXT_2026-05-06.md, REPORT_BLOCCO_8 + REPORT_CHIUSURA + AUDIT_INDIPENDENTE chiusura, DIAGNOSI_LOOKUP_VEHICLE360_2026-05-06.md, ecc.).

---

## 23. Audit parziale — cosa manca e perche'

Questo audit copre i task 1-13 in modo solido per l'obiettivo dichiarato (dare a Giuseppe gli elementi per decidere se lanciare il CCA), ma alcuni punti restano **DA VERIFICARE** o **NON LETTI** per limite di sessione:

### 23.1 NON LETTI (necessari per dettaglio implementativo, non per la decisione)
- Contenuto interno dei 31 domain `src/next/domain/next*Domain.ts` oltre a `nextCentroControlloDomain.ts` (testa). Implicazioni: la lista esatta di metriche e KPI gia' presenti in ciascun domain richiede un secondo audit dedicato.
- Contenuto interno dei 50+ tool chat-ia `tool*.ts`. Implicazioni: alcuni tool potrebbero gia' implementare metriche utili al CCA (es. `toolGetVehicleCostSummary`, `toolGetConsumptionAverage`, `toolFindOutliers`); l'idea funzionale e' DEDOTTA dai nomi, va verificata.
- Documenti storici `docs/_live/STORICO_*.md`, `docs/PROJECT_RULES.md`, `docs/STRUTTURA_COMPLETA_GESTIONALE.md`. Implicazioni: convenzioni storiche del progetto possono integrare le SPEC.
- `AGENTS.md` radice + `CONTEXT_CLAUDE.md` radice. Implicazioni: regole agenti.
- 23 audit storici diversi da quelli IA gia letti (es. `AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md`, `AUDIT_GAP_COPERTURA_TOOL_2026-04-28.md`). Implicazioni: questi due audit potrebbero essere il piu' rilevante riferimento per "cosa la chat IA gia' sa fare e che potrebbe servire al CCA".

### 23.2 DA VERIFICARE
- Contenuto effettivo di `nextRifornimentiDomain.ts` (DEDOTTO esistente da import in `NextCentroControlloParityPage.tsx`).
- Contenuto effettivo di `nextUnifiedReadRegistryDomain.ts` (DEDOTTO unificato dai nomi: candidato a essere il punto unico di lettura del CCA, va confermato).
- Lista esatta dei writer NEXT attivi: lo stato dichiarato a `STATO_ATTUALE_PROGETTO.md:25-30` parla di 10 moduli scriventi, ma la lista nominale richiede verifica file-per-file.
- Esistenza/uso del file `nextOperativitaTecnicaDomain.ts` non incluso nel Glob `src/next/domain/`. DA VERIFICARE: vive in `src/next/` non in `src/next/domain/`, il dato e' coerente con la lista files raccolta.

### 23.3 Conclusioni gia' solide
- Mappa moduli (§4) e mappa collezioni (§5) sono solide: ogni voce ha riferimento a file/path reale.
- Classificazione Chat IA (§9) e' solida: deriva da audit precedenti gia certificati.
- Funzionalita proposte (§11) e struttura consigliata (§12) sono coerenti con il repo.
- Primo step (§16) e' eseguibile.

### 23.4 Raccomandazione operativa
Prima di passare alla SPEC implementativa CCA, eseguire un secondo audit mirato di **30-60 minuti** dedicato esclusivamente a:
- contenuto reale di `nextRifornimentiDomain.ts`, `nextUnifiedReadRegistryDomain.ts`, `nextLavoriDomain.ts`, `nextManutenzioniDomain.ts` (i 4 domain piu' rilevanti per V1);
- mappa esatta delle metriche gia' calcolate in questi 4 domain (per riusarle nel data engine CCA invece di reinventarle);
- audit `AUDIT_DATI_NEXT_TOOL_CANDIDATI_2026-04-28.md` (per verificare se gia' contiene una mappa simile).

Questo secondo audit produrra' la SPEC implementativa con catalogo metriche definitivo invece che candidato.
