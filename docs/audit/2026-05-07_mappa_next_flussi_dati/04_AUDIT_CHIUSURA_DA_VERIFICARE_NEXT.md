# Audit chiusura punti DA VERIFICARE NEXT

Data: 2026-05-07

Natura: audit documentale con lettura codice. Nessuna patch runtime applicata.

## File letti

- `docs/audit/AUDIT_REALE_MODULI_NEXT_COLLEZIONI_FLUSSI_2026-05-07.md`
- `docs/data/DATA_CONTRACT_REALE_NEXT_FIREBASE_2026-05-07.md`
- `docs/architecture/DIAGRAMMI_FLUSSI_DATI_NEXT_2026-05-07.md`
- `docs/audit/AUDIT_FATTUALE_CENTRO_CONTROLLO_NEXT_2026-05-07.md`
- `docs/audit/AUDIT_CENTRO_CONTROLLO_AVANZATO_2026-05-07.md`
- `src/App.tsx`
- `src/next/NextCentroControlloParityPage.tsx`
- `src/next/autisti/nextAutistiStorageSync.ts`
- `src/next/autistiInbox/nextAutistiAdminBridges.ts`
- `src/autisti/*`
- `src/autistiInbox/*`
- `src/next/autisti/*`
- `src/next/autistiInbox/*`
- `src/next/internal-ai/ArchivistaArchiveClient.ts`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx`
- `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`
- `src/next/NextEuromeccPage.tsx`
- `src/next/NextCisternaIAPage.tsx`
- `src/next/NextCisternaSchedeTestPage.tsx`
- `src/next/nextCisternaWriter.ts`
- `src/cisterna/collections.ts`
- `src/next/domain/*` mirati
- `src/pages/CapoCostiMezzo.tsx`
- `src/pages/AnalisiEconomica.tsx`
- `firestore.rules`
- `storage.rules`

## Tabella unica punti aperti

| ID | Report origine | Punto aperto | Area | File da verificare | Esito finale | Rischio | Fonte |
|---|---|---|---|---|---|---|---|
| DV-01 | Fattuale Centro | CSS madre non letto | UI/CSS | `src/pages/CentroControllo.css` | IRRILEVANTE PER UI/CSS: la route attuale importa CSS NEXT locale | basso | `src/next/NextCentroControlloParityPage.tsx:29` |
| DV-02 | Fattuale Centro | `pdfEngine`/`pdfPreview` non letti | Export PDF | `src/utils/pdfEngine.ts`, `src/utils/pdfPreview.tsx` | CHIUSO - rischio Firebase escluso per audit attuale: nessun writer Firestore indicato dai grep precedenti; restano export in memoria | basso | report origine: grep mutazioni 0 match; import in `NextCentroControlloParityPage.tsx:13-14` |
| DV-03 | Fattuale Centro | call point flotta non verificato | Centro Controllo | `NextCentroControlloParityPage.tsx` | CHIUSO | basso | `src/next/NextCentroControlloParityPage.tsx:499` |
| DV-04 | Fattuale Centro | call point rifornimenti non verificato | Centro Controllo | `NextCentroControlloParityPage.tsx` | CHIUSO | basso | `src/next/NextCentroControlloParityPage.tsx:554` |
| DV-05 | Fattuale Centro | call point autisti non verificato | Centro Controllo | `NextCentroControlloParityPage.tsx` | CHIUSO | basso | `src/next/NextCentroControlloParityPage.tsx:599` |
| DV-06 | Fattuale Centro | export/modali Centro non letti | Centro Controllo | `NextCentroControlloParityPage.tsx` | CHIUSO - export PDF collegato e reader read-only; nessun writer emerso nella pagina | medio | `src/next/NextCentroControlloParityPage.tsx:996`, `:1030` |
| DV-07 | Fattuale Centro | `nextCentroControlloDomain.ts` esiste ma non usato dalla pagina | Architettura Centro | `src/next/domain/nextCentroControlloDomain.ts` | RILEVANTE SOLO PER DATI/KPI/EXPORT: dominio presente, route attuale usa reader specifici | medio | `NextCentroControlloParityPage.tsx:19`, `:25`, `:28`; grep import domain non presente nella pagina |
| DV-08 | Fattuale Centro | file domain secondo livello non letti | Domain NEXT | `src/next/domain/*` | CHIUSO PARZIALE: file critici letti per punti aperti; non e' stato rifatto audit integrale di ogni domain | medio | `rg --files src/next/domain` e letture mirate |
| DV-09 | Avanzato Centro | `nextRifornimentiDomain.ts` dedotto | Rifornimenti | `src/next/domain/nextRifornimentiDomain.ts` | CHIUSO per uso route Centro | basso | `NextCentroControlloParityPage.tsx:25`, `:554` |
| DV-10 | Avanzato Centro | `nextUnifiedReadRegistryDomain.ts` dedotto | Registry reader | `src/next/domain/nextUnifiedReadRegistryDomain.ts` | CHIUSO come reader base usato anche da bridge Autisti admin | medio | `src/next/autistiInbox/nextAutistiAdminBridges.ts:1`, `:80-83` |
| DV-11 | Avanzato Centro | `nextOperativitaTecnicaDomain.ts` fuori domain | Operativita | `src/next/nextOperativitaTecnicaDomain.ts` | ANCORA DA VERIFICARE: non necessario per i flussi Autisti/Archivista chiusi qui | medio | report origine |
| DV-12 | Reale Moduli | Centro clone storico dipende da madre | Legacy | `src/next/NextCentroControlloClonePage.tsx` | RISCHIO REALE se routato in futuro; route attuale usa parity page | medio | `src/next/NextCentroControlloClonePage.tsx:3`; `src/App.tsx:200` per route parity |
| DV-13 | Reale Moduli | IA Documenti CSS/runtime madre | IA documentale | `src/next/NextIADocumentiPage.tsx` | RILEVANTE SOLO PER DATI/KPI/EXPORT: pagina NEXT reale, usa domain costi; CSS legacy rilevati altrove sono UI-only | medio | `src/App.tsx:603-607`; `src/next/NextIADocumentiPage.tsx:172`, `:223-272` |
| DV-14 | Reale Moduli | `NextMotherPage` uso indiretto | Compatibilita | `src/next/NextMotherPage.tsx` | CHIUSO - non trovato come route attiva nel perimetro letto | basso | `src/App.tsx` route `/next` lette; report origine |
| DV-15 | Reale Moduli | `NextAccessDenied/Area/DriverExperience` | Accesso | file `src/next/Next*` | NON PRESENTE come route attiva nel perimetro letto | basso | `src/App.tsx` |
| DV-16 | Data Contract | payload IA Archivista completo | Archivista | `ArchivistaArchiveClient.ts`, bridge Archivista | RILEVANTE PER WRITER/DATI: campi principali dimostrati, schema IA resta dinamico | alto | `ArchivistaArchiveClient.ts:461-506`, `:530-603`, `:617-644`; bridge mezzo `:2842-2948` |
| DV-17 | Data Contract | payload Euromecc relazioni completo | Euromecc | `NextEuromeccPage.tsx` | RILEVANTE PER WRITER/DATI: branch bozza, ordine e conferma dimostrati | alto | `NextEuromeccPage.tsx:2976-2998`, `:2998-3040`, `:3079-3185` |
| DV-18 | Data Contract | payload Cisterna documenti | Cisterna | `NextCisternaIAPage.tsx`, `nextCisternaWriter.ts` | CHIUSO per campi base; `Record<string, unknown>` resta dinamico | medio | `NextCisternaIAPage.tsx:330-366`; `nextCisternaWriter.ts:62-65` |
| DV-19 | Data Contract | payload Cisterna schede | Cisterna | `NextCisternaSchedeTestPage.tsx`, `nextCisternaWriter.ts` | RILEVANTE PER WRITER/DATI: righe scheda dinamiche | alto | `NextCisternaSchedeTestPage.tsx:898`, `:1035-1061`; `nextCisternaWriter.ts:69-83`, `:89-95` |
| DV-20 | Data Contract | Firestore rules non lette | Sicurezza | `firestore.rules` | RISCHIO REALE: catch-all consente read/write a utenti signed-in | critico | `firestore.rules:235-236` |
| DV-21 | Data Contract | Storage rules non lette | Sicurezza | `storage.rules` | RISCHIO REALE: molti path consentono read/write a signed-in | alto | `storage.rules:8-30` |
| DV-22 | Data Contract | `@preventivi_approvazioni` writer NEXT | Capo/Procurement | `nextCapoDomain.ts`, `nextCapoCloneState.ts`, madre `CapoCostiMezzo.tsx` | RISCHIO REALE: NEXT legge e overlay locale; writer reale dimostrato in madre, non in NEXT ufficiale | alto | `nextCapoDomain.ts:411-415`; `src/pages/CapoCostiMezzo.tsx:647` |
| DV-23 | Avanzato Centro | `@costiMezzo` writer | Documenti costi | `nextDocumentiCostiDomain.ts` | RILEVANTE PER WRITER/DATI: NEXT puo eliminare o aggiornare valuta, non e' solo reader | alto | `nextDocumentiCostiDomain.ts:2436-2503`, `:2520-2586` |
| DV-24 | Avanzato Centro | `@analisi_economica_mezzi` writer NEXT | Analisi economica | `nextAnalisiEconomicaDomain.ts`, `Dossier`, madre | RISCHIO REALE: NEXT legge snapshot legacy, writer reale trovato in madre | alto | `nextAnalisiEconomicaDomain.ts:5-12`; `DossierMezzoDomain.ts:50`, `:546`; `src/pages/AnalisiEconomica.tsx:778-779` |
| DV-25 | Avanzato Centro | `@impostazioni_app/gemini` | IA config | `nextIaConfigDomain.ts` | CHIUSO: domain NEXT read-only e salvataggio bloccato da errore | medio | `nextIaConfigDomain.ts:4-13`, `:28`, `:54-56` |
| DV-26 | Avanzato Centro | `@alerts_state` | Centro/Home | `nextAlertsStateDomain.ts`, `nextCentroControlloDomain.ts` | RILEVANTE SOLO PER DATI/KPI/EXPORT: reader NEXT presente; writer non chiuso qui | medio | `nextAlertsStateDomain.ts:8-15`; `nextCentroControlloDomain.ts:16` |
| DV-27 | Avanzato Centro | `@mezzi_foto_viste` | Mappa storico | `nextMappaStoricoDomain.ts` | RILEVANTE PER WRITER/DATI: writer NEXT presente per metadati visuali | alto | `nextMappaStoricoDomain.ts:15`, `:473` |
| DV-28 | Avanzato Centro | `@mezzi_hotspot_mapping` | Mappa storico | `nextMappaStoricoDomain.ts` | RILEVANTE PER WRITER/DATI: writer NEXT presente per hotspot | alto | `nextMappaStoricoDomain.ts:16`, `:501`, `:514` |
| DV-29 | Avanzato Centro | `@inventario` writer | Manutenzioni/Magazzino | `nextManutenzioniDomain.ts`, `nextInventarioDomain.ts` | CHIUSO come writer NEXT reale in Manutenzioni | alto | `nextManutenzioniDomain.ts:978`, `:1086`; `nextInventarioDomain.ts:9` |
| DV-30 | Avanzato Centro | `@materialiconsegnati` writer | Manutenzioni/Materiali | `nextManutenzioniDomain.ts` | CHIUSO come writer NEXT reale in Manutenzioni | alto | `nextManutenzioniDomain.ts:979`, `:1087` |
| DV-31 | Avanzato Centro | `@listino_prezzi` writer | Procurement | `NextMaterialiDaOrdinarePage.tsx`, `nextPreventivoManualeWriter.ts` | RILEVANTE PER WRITER/DATI: writer NEXT reale presente | alto | `NextMaterialiDaOrdinarePage.tsx:1164`; `nextPreventivoManualeWriter.ts:408` |
| DV-32 | Avanzato Centro | `@cisterne_adblue` writer | Magazzino/AdBlue | `nextMaterialiMovimentiDomain.ts`, `nextAdBlueDomain.ts` | RILEVANTE PER DATI/KPI/EXPORT: letture/derivati dimostrati, writer non chiuso integralmente qui | medio | `nextMaterialiMovimentiDomain.ts:26-27`, `:1576-1617`; `nextAdBlueDomain.ts:7` |
| DV-33 | Prompt 08 | Autisti NEXT writer reale | Autisti | `src/next/autisti*`, `src/next/autistiInbox*` | RISCHIO REALE: NEXT ufficiale e' clone-local/no-op per managed keys; non sostituisce ancora writer madre | critico | `nextAutistiStorageSync.ts:11-19`, `:105-120`; `nextAutistiAdminBridges.ts:111-124` |
| DV-34 | Prompt 08 | dipendenze CSS legacy NEXT | UI/CSS | `src/next/**` | RILEVANTE SOLO PER UI/CSS: molte import CSS madre restano; non dimostra dipendenza runtime logica | medio | grep import legacy in `src/next`, esempi `NextSetupMezzoNative.tsx:4-5`, `NextAutistiAdminNative.tsx:4` |

## Sintesi numerica

- Punti analizzati: 34
- Punti chiusi o classificati senza rischio runtime immediato: 23
- Rischi reali rimasti: 6
- Rischi dati/writer non bloccanti ma da audit mirato: 5

## Rischi reali rimasti

1. `firestore.rules` ha catch-all read/write per signed-in (`firestore.rules:235-236`).
2. `storage.rules` consente read/write su molti path a signed-in (`storage.rules:8-30`).
3. Autisti NEXT non e' writer business reale per i managed dataset: official runtime ritorna senza scrivere (`nextAutistiStorageSync.ts:116-118`).
4. `@preventivi_approvazioni` in NEXT e' letto/local-overlay; writer business reale e' madre (`src/pages/CapoCostiMezzo.tsx:647`).
5. `@analisi_economica_mezzi` in NEXT e' letto come snapshot legacy; writer dimostrato in madre (`src/pages/AnalisiEconomica.tsx:778-779`).
6. Payload IA Archivista/Euromecc/Cisterna contengono componenti dinamiche da output IA: campi principali dimostrati, contratto completo non stabilizzato in tipo unico.

## Archivista / IA documentale

| Ramo | Route NEXT | Backend/chiamata | Dataset letto/scritto | Stato | Fonte |
|---|---|---|---|---|---|
| IA Documenti | `/next/ia/documenti` | preset documento e domain costi | legge `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@preventivi` | DIMOSTRATO | `src/App.tsx:603-607`; `NextIADocumentiPage.tsx:172`, `:223-272` |
| IA Libretto | `/next/ia/libretto` | endpoint backend configurato | legge/scrive `@mezzi_aziendali` | DIMOSTRATO | `src/App.tsx:595-599`; `NextIALibrettoPage.tsx:78`, `:465` |
| Copertura libretti | `/next/ia/copertura-libretti` | fetch backend | riparazione read-only lato UI | DIMOSTRATO | `src/App.tsx:611-615`; `NextIACoperturaLibrettiPage.tsx:42`, `:302` |
| Archivista Documento Mezzo | componenti internal-ai | upload Storage + archive | `@documenti_mezzi`, `@mezzi_aziendali` | DIMOSTRATO | `ArchivistaArchiveClient.ts:461-506`, `:647-753`; `ArchivistaDocumentoMezzoBridge.tsx:2842-2948` |
| Archivista Magazzino | bridge internal-ai | analyze + archive | `@documenti_magazzino` | DIMOSTRATO | `ArchivistaMagazzinoBridge.tsx:155`, `:493`, `:527-530` |
| Archivista Manutenzione | bridge internal-ai | analyze + business save | `@documenti_mezzi`, `@manutenzioni`, `@inventario`, `@materialiconsegnati` via domain manutenzioni | DIMOSTRATO | `ArchivistaManutenzioneBridge.tsx:574-575`, `:1026-1037`, `:1137`; `nextManutenzioniDomain.ts:978-994` |
| Preventivi Archivista | bridge internal-ai | archive preventivo | `storage/@preventivi` | DIMOSTRATO | `ArchivistaArchiveClient.ts:530-603`; `ArchivistaPreventivoManutenzioneBridge.tsx:347`, `:854`, `:893`; `ArchivistaPreventivoMagazzinoBridge.tsx:143`, `:484`, `:517` |
| Cisterna IA | `/next/cisterna/ia` | analisi documento | `@documenti_cisterna` | DIMOSTRATO | `src/App.tsx:526`; `NextCisternaIAPage.tsx:330-366`; `nextCisternaWriter.ts:62-65` |
| Cisterna schede | `/next/cisterna/schede-test` | analisi/crop | `@cisterna_schede_ia`, Storage crop | DIMOSTRATO | `src/App.tsx:534`; `NextCisternaSchedeTestPage.tsx:898`, `:1035-1061`; `nextCisternaWriter.ts:69-95` |

## Stato finale audit chiusura

AUDIT PARZIALE controllato: i punti aperti principali sono classificati. Restano da audit mirato rules, writer reali Autisti NEXT, contratti IA dinamici e alcuni domain non necessari a questa chiusura.
