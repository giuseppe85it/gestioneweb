# AUDIT REALE MODULI NEXT, COLLEZIONI, READER/WRITER E FLUSSI DATI

Data: 2026-05-07

Perimetro: sola lettura. Sono stati letti `src/App.tsx`, `src/next/**`, utility importate dalla NEXT, `backend/internal-ai/**` solo per endpoint chiamati dalla NEXT, e le funzioni esterne solo dove referenziate da NEXT.

Verifiche non eseguite per istruzione: build, test, Playwright.

Legenda affidabilita:
- DIMOSTRATO: verificato nel codice con file/riga.
- DOCUMENTATO: trovato in documentazione ma non verificato nel codice in questo audit.
- DEDOTTO: dedotto da import, route o uso reale, ma non ricostruito campo per campo.
- DA VERIFICARE: non dimostrato in modo sufficiente.
- NON PRESENTE: cercato e non trovato.
- NON LETTO: file necessario non letto.

Nota sui backup: file `*.bak*` sotto `src/next/` sono stati esclusi dalla mappa runtime perche non risultano route attive in `src/App.tsx`.

## 0. Inventario automatico moduli NEXT trovati

| Modulo NEXT trovato | Area | Route NEXT | File NEXT | Domain collegati | Dataset citati | Dipendenze legacy | Stato fonte |
|---|---|---|---|---|---|---|---|
| Shell NEXT | Navigazione | `/next/*` | `src/next/NextShell.tsx` (`src/App.tsx:194`) | `nextData`, `nextCloneNavigation` | `localStorage next.shell.sidebarCollapsed` | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Home NEXT | Home | `/next` index | `src/next/NextHomePage.tsx` (`src/App.tsx:196`) | home/alert components, Centro Controllo domain | eventi operativi, alert, sessioni | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Centro di Controllo NEXT | Operativita | `/next/centro-controllo` | `src/next/NextCentroControlloParityPage.tsx` (`src/App.tsx:197`) | `nextAutistiDomain`, `nextRifornimentiDomain`, `nextAnagraficheFlottaDomain` | `@mezzi_aziendali`, `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@richieste_attrezzature_autisti_tmp` | CSS madre rimosso nel file corrente: importa `./next-centro-controllo.css` (`NextCentroControlloParityPage.tsx:29`) | DIMOSTRATO DA ROUTE |
| Centro Controllo clone storico | Operativita | non routato | `src/next/NextCentroControlloClonePage.tsx` | DA VERIFICARE | DA VERIFICARE | DIPENDENZA LEGACY RILEVATA: importa `../pages/CentroControllo` | DIMOSTRATO DA FILE |
| Stato operativo NEXT | Operativita | derivato da Centro Controllo | `src/next/domain/nextCentroControlloDomain.ts` | `readNextStatoOperativoSnapshot` (`nextCentroControlloDomain.ts:1657`) | `@alerts_state`, `@mezzi_aziendali`, `@autisti_sessione_attive`, eventi autisti | NON PRESENTE runtime madre | DIMOSTRATO DA DOMAIN |
| Scadenze / Collaudi NEXT | Flotta | `/next/scadenze-collaudi` | `src/next/NextScadenzeCollaudiPage.tsx` (`src/App.tsx:205`) | `nextCentroControlloDomain`, `nextOfficineDomain`, `nextScadenzeCollaudiWriter` | `@mezzi_aziendali`, `@officine` | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Gestione operativa NEXT | Operativita | `/next/gestione-operativa` | `src/next/NextGestioneOperativaPage.tsx` (`src/App.tsx:213`) | `useNextOperativitaSnapshot`, `nextOperativitaGlobaleDomain` | `@manutenzioni`, `@inventario`, `@materialiconsegnati`, `@attrezzature_cantieri`, `@ordini` | CSS madre `../pages/GestioneOperativa.css` | DIMOSTRATO DA ROUTE |
| Operativita globale redirect | Operativita | `/next/operativita-globale` | `src/next/NextLegacyStructuralRedirects.tsx` (`src/App.tsx:221`) | `nextStructuralPaths` | nessuna scrittura | NON PRESENTE runtime madre, solo redirect | DIMOSTRATO DA ROUTE |
| Magazzino NEXT | Magazzino | `/next/magazzino` | `src/next/NextMagazzinoPage.tsx` (`src/App.tsx:229`) | `nextMaterialiMovimentiDomain`, `nextDocumentiCostiDomain`, `nextProcurementDomain` | `@inventario`, `@materialiconsegnati`, `@mezzi_aziendali`, `@colleghi`, `@fornitori`, `@cisterne_adblue`, Storage foto | NON PRESENTE runtime madre; usa CSS/pattern propri e reader NEXT | DIMOSTRATO DA ROUTE |
| Inventario NEXT | Magazzino | `/next/inventario` redirect | `src/next/NextMagazzinoPage.tsx`; file non routato `NextInventarioPage.tsx` | `nextInventarioDomain` | `@inventario`, `@fornitori` | CSS madre in `NextInventarioPage.tsx:20` e `NextInventarioReadOnlyPanel.tsx:7` | DIMOSTRATO DA ROUTE/FILE |
| Materiali consegnati NEXT | Magazzino | `/next/materiali-consegnati` redirect | `src/next/NextMagazzinoPage.tsx`; file non routato `NextMaterialiConsegnatiPage.tsx` | `nextMaterialiMovimentiDomain` | `@materialiconsegnati`, `@cisterne_adblue` | CSS madre in pannelli materiali | DIMOSTRATO DA ROUTE/FILE |
| Attrezzature cantieri NEXT | Magazzino/Cantieri | `/next/attrezzature-cantieri` | `src/next/NextAttrezzatureCantieriPage.tsx` (`src/App.tsx:253`) | `nextAttrezzatureCantieriDomain`, `nextAttrezzatureCantieriWriter` | `@attrezzature_cantieri`, Storage foto movimenti | DIPENDENZA LEGACY RILEVATA CSS `../pages/AttrezzatureCantieri.css` | DIMOSTRATO DA ROUTE |
| Manutenzioni NEXT | Manutenzioni | `/next/manutenzioni` | `src/next/NextManutenzioniPage.tsx` (`src/App.tsx:261`) | `nextManutenzioniDomain`, `nextInventarioDomain`, `nextManutenzioniGommeDomain`, `nextLavoriDomain`, `nextRifornimentiDomain` | `@manutenzioni`, `@inventario`, `@materialiconsegnati`, `@mezzi_aziendali`, `@documenti_mezzi` | CSS madre `../pages/Manutenzioni.css` | DIMOSTRATO DA ROUTE |
| Mappa storico mezzo NEXT | Manutenzioni/Mezzi | non routata diretta, embedded in Manutenzioni | `src/next/NextMappaStoricoPage.tsx`; import in `NextManutenzioniPage.tsx:3` | `nextMappaStoricoDomain` | `@mezzi_foto_viste`, `@mezzi_hotspot_mapping`, rifornimenti, gomme/manutenzioni | NON PRESENTE runtime madre | DIMOSTRATO DA FILE |
| Acquisti NEXT | Procurement | `/next/acquisti` | `src/next/NextAcquistiPage.tsx` (`src/App.tsx:269`) | `nextProcurementDomain`, `nextDocumentiCostiDomain` | `@ordini`, `@preventivi`, `@preventivi_approvazioni`, `@listino_prezzi`, Storage allegati | CSS madre `../pages/Acquisti.css` nei pannelli procurement | DIMOSTRATO DA ROUTE |
| Materiali da ordinare NEXT | Procurement | `/next/materiali-da-ordinare` | `src/next/NextMaterialiDaOrdinarePage.tsx` (`src/App.tsx:285`) | `nextProcurementDomain` | `@ordini`, Storage foto/file, `sessionStorage next.procurement.materiali-da-ordinare.draft` | CSS madre `MaterialiDaOrdinare.css` e `Acquisti.css` | DIMOSTRATO DA ROUTE |
| Ordini in attesa NEXT | Procurement | `/next/ordini-in-attesa` | `src/next/NextOrdiniInAttesaPage.tsx` (`src/App.tsx:301`) | `NextProcurementStandalonePage`, `nextProcurementDomain` | `@ordini` | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Ordini arrivati NEXT | Procurement | `/next/ordini-arrivati` | `src/next/NextOrdiniArrivatiPage.tsx` (`src/App.tsx:309`) | `NextProcurementStandalonePage`, `nextProcurementDomain` | `@ordini` | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Dettaglio ordine NEXT | Procurement | `/next/dettaglio-ordine/:ordineId`, `/next/acquisti/dettaglio/:ordineId` | `src/next/NextDettaglioOrdinePage.tsx` (`src/App.tsx:277`, `src/App.tsx:317`) | `nextProcurementDomain` | `@ordini` | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Euromecc NEXT | Euromecc | `/next/euromecc` | `src/next/NextEuromeccPage.tsx` (`src/App.tsx:293`) | `nextEuromeccDomain` | `euromecc_pending`, `euromecc_done`, `euromecc_issues`, `euromecc_area_meta`, `euromecc_relazioni`, `euromecc_extra_components`, `@ordini`, Storage allegati | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Lavori da eseguire NEXT | Lavori | `/next/lavori-da-eseguire` | `src/next/NextLavoriDaEseguirePage.tsx` (`src/App.tsx:325`) | `nextLavoriDomain` | `@lavori`, `@mezzi_aziendali` | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Lavori in attesa NEXT | Lavori | `/next/lavori-in-attesa` | `src/next/NextLavoriInAttesaPage.tsx` (`src/App.tsx:379`) | `nextLavoriDomain` | `@lavori`, `@mezzi_aziendali` | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Lavori eseguiti NEXT | Lavori | `/next/lavori-eseguiti` | `src/next/NextLavoriEseguitiPage.tsx` (`src/App.tsx:387`) | `nextLavoriDomain` | `@lavori`, `@mezzi_aziendali` | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Dettaglio lavoro NEXT | Lavori | `/next/dettagliolavori/:lavoroId` | `src/next/NextDettaglioLavoroPage.tsx` (`src/App.tsx:395`) | `nextLavoriDomain` | `@lavori`, `@mezzi_aziendali`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` | redirect legacy query in `NextLegacyStructuralRedirects.tsx:41` | DIMOSTRATO DA ROUTE |
| Capo Mezzi NEXT | Capo | `/next/capo/mezzi` | `src/next/NextCapoMezziPage.tsx` (`src/App.tsx:333`) | `nextCapoDomain` | `@mezzi_aziendali`, documenti costi, `@preventivi_approvazioni` | CSS madre `../pages/CapoMezzi.css` | DIMOSTRATO DA ROUTE |
| Capo Costi NEXT | Capo | `/next/capo/costi/:targa` | `src/next/NextCapoCostiMezzoPage.tsx` (`src/App.tsx:341`) | `nextCapoDomain`, documenti costi | `@costiMezzo`, `@documenti_*`, `@preventivi_approvazioni`, `@mezzi_aziendali` | CSS madre `../pages/CapoCostiMezzo.css` | DIMOSTRATO DA ROUTE |
| Anagrafiche NEXT | Anagrafiche | `/next/anagrafiche` | `src/next/NextAnagrafichePage.tsx` (`src/App.tsx:349`) | `nextAnagraficheWriter`, domini colleghi/fornitori/officine/flotta | `@colleghi`, `@fornitori`, `@officine`, `@mezzi_aziendali` | NON PRESENTE runtime madre | DIMOSTRATO DA ROUTE |
| Colleghi NEXT alias | Anagrafiche | `/next/colleghi` | redirect a `/next/anagrafiche?tab=colleghi` (`src/App.tsx:357`) | `nextColleghiDomain`, `nextAnagraficheWriter` | `@colleghi` | `legacyFallback` passato ma `NextRoleGuard` non lo monta (`src/App.tsx:144`, `NextRoleGuard.tsx:29`) | DIMOSTRATO DA ROUTE |
| Fornitori NEXT alias | Anagrafiche | `/next/fornitori` | redirect a `/next/anagrafiche?tab=fornitori` (`src/App.tsx:368`) | `nextFornitoriDomain`, `nextAnagraficheWriter` | `@fornitori` | `legacyFallback` passato ma `NextRoleGuard` non lo monta | DIMOSTRATO DA ROUTE |
| Mezzi / Lista Dossier NEXT | Mezzi | `/next/mezzi` redirect, `/next/dossiermezzi` | `src/next/NextDossierListaPage.tsx` (`src/App.tsx:411`, `src/App.tsx:419`) | `nextAnagraficheFlottaDomain`, dossier domains | `@mezzi_aziendali`, documenti/costi/rifornimenti/manutenzioni | CSS madre dossier/lista | DIMOSTRATO DA ROUTE |
| Dossier Mezzo NEXT | Mezzi | `/next/dossiermezzi/:targa`, `/next/dossier/:targa` | `src/next/NextDossierMezzoPage.tsx` (`src/App.tsx:427`, `src/App.tsx:435`) | `nextDossierMezzoDomain`, `nextDocumentiCostiDomain`, `nextLavoriDomain`, `nextRifornimentiDomain`, `nextManutenzioniGommeDomain` | `@mezzi_aziendali`, `@analisi_economica_mezzi`, `@lavori`, `@rifornimenti`, `@manutenzioni`, `@documenti_*`, `@materialiconsegnati` | CSS madre `DossierMezzo.css` | DIMOSTRATO DA ROUTE |
| Dossier Gomme NEXT | Mezzi/Gomme | `/next/dossier/:targa/gomme` | `src/next/NextDossierGommePage.tsx` (`src/App.tsx:443`) | `nextManutenzioniGommeDomain` | `@manutenzioni`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi` | CSS madre `DossierMezzo.css` | DIMOSTRATO DA ROUTE |
| Dossier Rifornimenti NEXT | Mezzi/Rifornimenti | `/next/dossier/:targa/rifornimenti` | `src/next/NextDossierRifornimentiPage.tsx` (`src/App.tsx:451`) | `nextRifornimentiDomain` | `@rifornimenti`, `@rifornimenti_autisti_tmp` | CSS madre `DossierMezzo.css` | DIMOSTRATO DA ROUTE |
| Analisi Economica NEXT | Mezzi/Economia | `/next/analisi-economica/:targa` | `src/next/NextAnalisiEconomicaPage.tsx` (`src/App.tsx:475`) | `nextAnalisiEconomicaDomain`, rifornimenti/costi | `@analisi_economica_mezzi`, rifornimenti, documenti costi | CSS madre `DossierMezzo.css` | DIMOSTRATO DA ROUTE |
| Chat IA NEXT | IA interna | `/next/chat` | `src/next/chat-ia/ChatIaPage.tsx` (`src/App.tsx:483`) | chat config, backend bridge | endpoint internal-ai, catalogo view | NON PRESENTE runtime IA legacy | DIMOSTRATO DA ROUTE |
| Chat IA tool-use NEXT | IA interna | `/next/chat-tool` | `src/next/chat-ia/ChatIaToolUsePage.tsx` (`src/App.tsx:491`) | `chatIaBackendBridge` | `/internal-ai-backend/chat/tool-use` | NON PRESENTE runtime IA legacy | DIMOSTRATO DA ROUTE |
| IA Archivista NEXT | IA documentale | `/next/ia/archivista` | `src/next/NextIAArchivistaPage.tsx` (`src/App.tsx:499`) | `src/next/internal-ai/*Bridge`, `ArchivistaArchiveClient` | `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@preventivi`, Storage file | NON PRESENTE runtime IA legacy; chiama backend internal-ai | DIMOSTRATO DA ROUTE |
| IA Libretto NEXT | IA documentale | `/next/ia/libretto` | `src/next/NextIALibrettoPage.tsx` (`src/App.tsx:595`) | `nextIaLibrettoDomain` | `@mezzi_aziendali`, Cloud Run estrazione libretto | CSS madre IA | DIMOSTRATO DA ROUTE |
| IA Documenti NEXT | IA documentale | `/next/ia/documenti` | `src/next/NextIADocumentiPage.tsx` (`src/App.tsx:603`) | `nextDocumentiCostiDomain` | `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@preventivi` | DA VERIFICARE CSS/runtime madre | DIMOSTRATO DA ROUTE |
| IA Copertura Libretti NEXT | IA documentale | `/next/ia/copertura-libretti` | `src/next/NextIACoperturaLibrettiPage.tsx` (`src/App.tsx:611`) | fetch esterno | endpoint configurato da URL | CSS madre IA | DIMOSTRATO DA ROUTE |
| Libretti Export NEXT | Export/PDF | `/next/libretti-export` | `src/next/NextLibrettiExportPage.tsx` (`src/App.tsx:507`) | `nextLibrettiExportDomain`, `pdfEngine`, `pdfPreview` | `@mezzi_aziendali` | CSS madre `LibrettiExport.css` | DIMOSTRATO DA ROUTE |
| Cisterna NEXT | Cisterna | `/next/cisterna` | `src/next/NextCisternaPage.tsx` (`src/App.tsx:515`) | `nextCisternaDomain`, `nextCisternaWriter` | `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`, `@rifornimenti_autisti_tmp` | CSS madre Cisterna | DIMOSTRATO DA ROUTE |
| Cisterna IA NEXT | Cisterna IA | `/next/cisterna/ia` | `src/next/NextCisternaIAPage.tsx` (`src/App.tsx:523`) | `nextCisternaIaClient`, `nextCisternaWriter` | endpoint analyze cisterna, `@documenti_cisterna`, Storage file | CSS madre Cisterna IA | DIMOSTRATO DA ROUTE |
| Cisterna Schede Test NEXT | Cisterna IA | `/next/cisterna/schede-test` | `src/next/NextCisternaSchedeTestPage.tsx` (`src/App.tsx:531`) | `nextCisternaIaClient`, `nextCisternaWriter` | `@cisterna_schede_ia`, `localStorage cisterna_schede_calib_v1`, Storage crop | CSS madre Cisterna Schede | DIMOSTRATO DA ROUTE |
| Autisti Gate/Login/Home/Setup/Cambio NEXT | App autisti | `/next/autisti/*` | wrapper in `src/next/NextAutisti*Page.tsx`, native in `src/next/autisti/*` (`src/App.tsx:172-186`) | `nextAutistiSessionStorage`, `nextAutistiHomeEvents` | localStorage autista/mezzo, `@autisti_sessione_attive`, `@mezzi_aziendali`, eventi autisti | DIPENDENZA LEGACY RILEVATA: CSS `src/autisti/*.css` | DIMOSTRATO DA ROUTE |
| Autisti Controllo/Rifornimento/Segnalazioni/Richiesta NEXT | App autisti | `/next/autisti/controllo`, `/rifornimento`, `/segnalazioni`, `/richiesta-attrezzature` | `NextAutistiControlloPage.tsx`, `src/next/autisti/*Page.tsx` | session storage, clone attachment helpers | localStorage allegati/sessione; scrittura business disabilitata nelle pagine driver | CSS legacy autisti | DIMOSTRATO DA ROUTE |
| Autisti Inbox NEXT | Inbox autisti | `/next/autisti-inbox/*` | `src/next/autistiInbox/*Native.tsx` via wrapper pages (`src/App.tsx:539-587`) | `nextAutistiHomeEvents`, `nextAutistiStorageSync`, `NextAutistiAdminNative` | sessioni, controlli, segnalazioni, richieste, gomme, rifornimenti, storico eventi | DIPENDENZA LEGACY RILEVATA: CSS `src/autistiInbox/*.css` | DIMOSTRATO DA ROUTE |
| Autisti Admin NEXT | Admin autisti | `/next/autisti-admin` | `src/next/NextAutistiAdminPage.tsx`, `src/next/autistiInbox/NextAutistiAdminNative.tsx` (`src/App.tsx:619`) | `nextAutistiStorageSync`, admin bridges | scrive sessioni/eventi/controlli/segnalazioni/richieste/gomme/rifornimenti | CSS legacy inbox | DIMOSTRATO DA ROUTE |
| Backend internal-ai usato da NEXT | Backend IA | chiamato da `/next/chat-tool`, IA archivista, cisterna, Euromecc | `backend/internal-ai/server/internal-ai-adapter.js` | resolver/catalog/query | endpoint `/internal-ai-backend/*`, Firestore readonly da boundary | NON PRESENTE runtime IA legacy | DIMOSTRATO DA ENDPOINT |
| PDF Engine usato da NEXT | Utility | non route | `src/utils/pdfEngine.ts`, `src/utils/pdfPreview.ts` | usato da Centro, Manutenzioni, Inbox, Libretti, Euromecc | nessuna collection diretta; fetch asset/logo/fileUrl | utility fuori `src/next` importata da NEXT | DIMOSTRATO DA IMPORT |
| cloneWriteBarrier NEXT | Sicurezza scritture | non route | `src/utils/cloneWriteBarrier.ts`, wrapper write ops | `storageSync`, `firestoreWriteOps`, `storageWriteOps` | tutti i writer che usano wrapper | utility fuori `src/next` importata da NEXT | DIMOSTRATO DA IMPORT |
| NextMotherPage | Compatibilita | non route attiva trovata | `src/next/NextMotherPage.tsx` | NON PRESENTE | NON PRESENTE | file presente, ma `rg` non mostra import attivo esterno; DA VERIFICARE se usato indirettamente in build storici | DIMOSTRATO DA FILE |
| NextAccessDenied/Area/DriverExperience | Accesso/esperienza | non route attive in `src/App.tsx` | `NextAccessDeniedPage.tsx`, `NextAreaPage.tsx`, `NextDriverExperiencePage.tsx` | DA VERIFICARE | DA VERIFICARE | NON PRESENTE runtime madre rilevato | DIMOSTRATO DA FILE |

## 1. Mappa sintetica moduli NEXT

| Modulo | Stato | Reader usati | Writer usati | Collezioni lette | Collezioni scritte | Collegamenti NEXT | Rischio modifica |
|---|---|---|---|---|---|---|---|
| Centro Controllo | CLONE UI MA RUNTIME NEXT | `readNextAutistiReadOnlySnapshot`, `readNextRifornimentiReadOnlySnapshot`, `readNextAnagraficheFlottaSnapshot` (`NextCentroControlloParityPage.tsx:16-28`) | nessuno diretto; solo PDF/share | mezzi, rifornimenti, eventi autisti | nessuna business | legge autisti, dossier rifornimenti, flotta | alto: dashboard cross-modulo |
| Scadenze/Collaudi | SCRIVENTE | `readNextCentroControlloSnapshot`, `readNextOfficineSnapshot` | `setPrenotazioneCollaudo`, `setPreCollaudo`, `markRevisioneCompletata` (`nextScadenzeCollaudiWriter.ts:115`, `151`, `183`) | `@mezzi_aziendali`, `@officine` | `@mezzi_aziendali` | Dossier, Centro Controllo, Capo | alto: aggiorna anagrafica mezzo |
| Magazzino | SCRIVENTE | `readNextMaterialiMovimentiSnapshot`, `readNextProcurementSnapshot`, `readNextDocumentiCostiProcurementSupportSnapshot` | writer inline `persistInventario`, `persistConsegne`, `persistCambi` (`NextMagazzinoPage.tsx:1588`, `1597`, `1606`) | inventario, consegne, mezzi, colleghi, fornitori, cisterna AdBlue | `@inventario`, `@materialiconsegnati`, `@cisterne_adblue`, Storage foto | Manutenzioni, Operativita, Dossier, Procurement | critico: inventario condiviso |
| Attrezzature cantieri | SCRIVENTE | `readNextAttrezzatureCantieriSnapshot` (`nextAttrezzatureCantieriDomain.ts:509`) | `create/edit/deleteMovimentoAttrezzatura` (`nextAttrezzatureCantieriWriter.ts:269`, `302`, `353`) | `@attrezzature_cantieri` | `@attrezzature_cantieri`, Storage foto | Magazzino reale, Operativita | alto: dataset cantiere condiviso |
| Manutenzioni | SCRIVENTE | `readNextManutenzioniWorkspaceSnapshot`, inventario, gomme, lavori, rifornimenti | `saveNextManutenzioneBusinessRecord`, `deleteNextManutenzioneBusinessRecord` (`nextManutenzioniDomain.ts:982`, `1012`) | manutenzioni, inventario, materiali consegnati, mezzi, documenti mezzi | `@manutenzioni`, `@inventario`, `@materialiconsegnati` | Dossier, Centro, Operativita, Magazzino | critico: multi-scrittura e rollback |
| Procurement/acquisti | SCRIVENTE | `readNextProcurementSnapshot`, supporto documenti costi | writer inline in `NextMaterialiDaOrdinarePage` e `NextProcurementReadOnlyPanel`, `nextPreventivoManualeWriter` | ordini, preventivi, approvazioni, listino | `@ordini`, `@preventivi`, `@listino_prezzi`, Storage | Magazzino, Capo, Documenti costi, Euromecc | critico: ordini condivisi |
| Euromecc | SCRIVENTE | `readEuromeccSnapshot` (`nextEuromeccDomain.ts:394`) e letture inline `euromecc_relazioni` | domain Euromecc, writer inline relazioni/ordini (`NextEuromeccPage.tsx:2980`, `3031`, `3181`) | euromecc collections, `@ordini` | euromecc collections, `@ordini`, Storage | Procurement, IA backend | alto: genera ordini e relazioni |
| Lavori | SCRIVENTE | `nextLavoriDomain` | `setItemSync("@lavori")` in lista/dettaglio (`NextLavoriDaEseguirePage.tsx:524`, `NextDettaglioLavoroPage.tsx:841`) | `@lavori`, `@mezzi_aziendali` | `@lavori` | Dossier, Manutenzioni, Gestione operativa | alto: stato lavoro condiviso |
| Anagrafiche | SCRIVENTE | domini colleghi/fornitori/officine/flotta | `nextAnagraficheWriter`, `nextMezziWriter` | `@colleghi`, `@fornitori`, `@officine`, `@mezzi_aziendali` | stessi dataset | tutti i moduli con nominativi/mezzi | critico: master data |
| Dossier Mezzo | READ-ONLY con azioni documentali | composito `readNextDossierMezzoCompositeSnapshot` (`nextDossierMezzoDomain.ts:747`) | delete/update documenti costo se UI collegata (`nextDocumentiCostiDomain.ts:2428`, `2440`, `2510`) | mezzi, analisi, lavori, materiali, manutenzioni, rifornimenti, documenti | documenti costo/root in azioni specifiche | centro, manutenzioni, capo, IA documenti | alto |
| App Autisti driver | READ-ONLY lato invio nei file letti | session local storage e dataset mezzi/sessioni | pagine driver lette impostano errore read-only (`NextAutistiRifornimentoPage.tsx:157`, `NextAutistiSegnalazioniPage.tsx:371`, `NextAutistiControlloPage.tsx:105`) | localStorage autista/mezzo, mezzi/sessioni | nessuna business nelle pagine driver lette | Inbox/Admin | medio |
| Autisti Admin/InBox | SCRIVENTE | `getItemSync` su dataset autisti | `setItemSync` multipli e `setDoc` su rifornimenti (`NextAutistiAdminNative.tsx:1052`, `1439`, `1500`, `1691`, `1847`, `1864`) | sessioni, eventi, segnalazioni, controlli, richieste, gomme, rifornimenti | stessi dataset, `@rifornimenti`, `@gomme_eventi` | Centro, Dossier Rifornimenti, Gomme | critico |
| Cisterna | SCRIVENTE | `nextCisternaDomain` | `nextCisternaWriter` | documenti/schede/parametri cisterna, rifornimenti autisti | `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`, Storage | IA Cisterna, Chat IA view config | alto |
| IA documentale | SCRIVENTE | documenti root e preventivi | `ArchivistaArchiveClient`, bridge libretto | `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@preventivi`, `@mezzi_aziendali` | stessi target e Storage | Dossier, Manutenzioni, Magazzino, Chat IA | critico |
| Chat IA NEXT | READ-ONLY runtime certificato | backend bridge | nessun writer frontend rilevato | endpoint internal-ai; backend legge boundary readonly | nessuna scrittura frontend | tutte le viste certificate | critico: boundary dati |

## 2. Reader NEXT rilevati

| Reader | File/riga | Dataset letto | Filtri/normalizzazioni | Espone a |
|---|---|---|---|---|
| `readNextUnifiedStorageDocument` | `src/next/domain/nextUnifiedReadRegistryDomain.ts:116` | `storage/<key>` | normalizza shape storage/value/items | domini NEXT multipli |
| `readNextUnifiedCollection` | `nextUnifiedReadRegistryDomain.ts:159` | root collection | mappa document id + data | documenti/analisi |
| `readNextCentroControlloSnapshot` | `nextCentroControlloDomain.ts:1627` | alert, mezzi, sessioni, eventi, segnalazioni, controlli | KPI e qualita dati | Centro, Home |
| `readNextAnagraficheFlottaSnapshot` | `src/next/nextAnagraficheFlottaDomain.ts:832` | `@mezzi_aziendali`, `@colleghi` | normalizza targa e anagrafiche | Dossier, Scadenze, Capo, Lavori |
| `readNextInventarioSnapshot` | `nextInventarioDomain.ts:235` | `@inventario` | normalizza stock, foto, soglia | Magazzino, Operativita, Manutenzioni |
| `readNextMaterialiMovimentiSnapshot` | `nextMaterialiMovimentiDomain.ts:1125` | `@materialiconsegnati` | normalizza movimenti materiali | Magazzino, Dossier |
| `readNextMagazzinoAdBlueSnapshot` | `nextMaterialiMovimentiDomain.ts:1582` | `@cisterne_adblue` | normalizza cambi AdBlue | Magazzino |
| `readNextManutenzioniWorkspaceSnapshot` | `nextManutenzioniDomain.ts:752` | manutenzioni, inventario, mezzi | workspace per UI manutenzioni | Manutenzioni |
| `readNextMezzoManutenzioniSnapshot` | `nextManutenzioniDomain.ts:663` | `@manutenzioni`, `@documenti_mezzi` | filtro per targa, metadati documenti | Dossier, gomme |
| `readNextMezzoManutenzioniGommeSnapshot` | `nextManutenzioniGommeDomain.ts:1460` | manutenzioni, `@cambi_gomme_autisti_tmp`, `@gomme_eventi` | aggrega gomme per mezzo | Dossier Gomme |
| `readNextRifornimentiReadOnlySnapshot` | `nextRifornimentiDomain.ts:1333` | `@rifornimenti`, `@rifornimenti_autisti_tmp` | unione business/tmp | Centro, Dossier |
| `readNextMezzoRifornimentiSnapshot` | `nextRifornimentiDomain.ts:1346` | rifornimenti | filtro targa | Dossier Rifornimenti |
| `readNextProcurementSnapshot` | `nextProcurementDomain.ts:1043` | ordini/preventivi/approvazioni/listino | normalizza stati e materiali | Acquisti, Magazzino |
| `readNextLavoriInAttesaSnapshot` | `nextLavoriDomain.ts:934` | `@lavori` | filtro stato | Lavori, Manutenzioni |
| `readNextDossierMezzoCompositeSnapshot` | `nextDossierMezzoDomain.ts:747` | mezzi, lavori, materiali, manutenzioni, rifornimenti, documenti | composizione per targa | Dossier |
| `readNextDocumentiCostiFleetSnapshot` | `nextDocumentiCostiDomain.ts:2247` | `@costiMezzo`, `@documenti_*`, procurement | costi flotta | Capo |
| `readNextIADocumentiArchiveSnapshot` | `nextDocumentiCostiDomain.ts:2010` | `@documenti_*`, `@preventivi` | archive documentale | IA Documenti |
| `readEuromeccSnapshot` | `nextEuromeccDomain.ts:394` | euromecc pending/done/issues/meta | snapshot area | Euromecc |
| `readNextCisternaSnapshot` | `nextCisternaDomain.ts:1240` | cisterna documenti/schede/parametri/refuels | aggregazione mese/cisterna | Cisterna |

## 3. Writer NEXT rilevati

| Writer | File/riga | Dataset scritto | Operazione | Trigger UI/modulo | Side effect |
|---|---|---|---|---|---|
| `setItemSync` wrapper | `src/utils/storageSync.ts:27`, `:131` | `storage/<key>` | overwrite `{ value }` | molti moduli | controllato da `cloneWriteBarrier` |
| `firestoreWriteOps` | `src/utils/firestoreWriteOps.ts:15-38` | root collection/doc | add/update/set/delete | writer NEXT | controllato da write barrier |
| `storageWriteOps` | `src/utils/storageWriteOps.ts:20-52` | Firebase Storage | upload/delete | allegati/foto | controllato da write barrier |
| `saveNextManutenzioneBusinessRecord` | `nextManutenzioniDomain.ts:982` | `@manutenzioni`; inventario/consegne se materiali | append/overwrite storage array | salvataggio manutenzione | scala inventario e movimenti |
| `deleteNextManutenzioneBusinessRecord` | `nextManutenzioniDomain.ts:1012` | `@manutenzioni`, `@inventario`, `@materialiconsegnati` | delete/rollback manuale | delete manutenzione | ripristino materiali |
| `persistInventario` | `NextMagazzinoPage.tsx:1588` | `@inventario` | overwrite array | add/edit/delete/stock | impatta manutenzioni/operativita |
| `persistConsegne` | `NextMagazzinoPage.tsx:1597` | `@materialiconsegnati` | overwrite array | consegna materiale | impatta Dossier/Operativita |
| `persistCambi` | `NextMagazzinoPage.tsx:1606` | `@cisterne_adblue` | overwrite array | cambio cisterna AdBlue | impatta Cisterna/Magazzino |
| `saveNextCollega/Fornitore/Officina` | `nextAnagraficheWriter.ts:170`, `:192`, `:216` | `@colleghi`, `@fornitori`, `@officine` | upsert array | anagrafiche | master data condivisa |
| `updateNextMezzoAnagrafica/deleteNextMezzo` | `nextMezziWriter.ts:125`, `:157` | `@mezzi_aziendali` | update/delete array | anagrafiche mezzi | impatta Dossier/Scadenze |
| `setPrenotazioneCollaudo/setPreCollaudo/markRevisioneCompletata` | `nextScadenzeCollaudiWriter.ts:115`, `:151`, `:183` | `@mezzi_aziendali` | update record mezzo | scadenze/collaudi | impatta Centro/Dossier |
| `create/edit/deleteMovimentoAttrezzatura` | `nextAttrezzatureCantieriWriter.ts:269`, `:302`, `:353` | `@attrezzature_cantieri`, Storage foto | create/update/delete | attrezzature cantieri | impatta Magazzino reale |
| Ordini da Materiali | `NextMaterialiDaOrdinarePage.tsx:1164` | `@ordini` | append/update array | crea ordine | impatta procurement |
| Ordini da Procurement panel | `NextProcurementReadOnlyPanel.tsx:264`, `:598` | `@ordini` | delete/update array | delete/save ordine | impatta acquisti/ordini |
| Preventivo manuale | `nextPreventivoManualeWriter.ts:228`, `:298`, `:408` | `@preventivi`, `@listino_prezzi`, Storage | upload + setDoc | modale preventivo | impatta listino/procurement |
| Lavori gruppo/dettaglio | `NextLavoriDaEseguirePage.tsx:524`, `NextDettaglioLavoroPage.tsx:841`, `:865`, `:894` | `@lavori` | append/update/delete | lavori UI | impatta Dossier/Gestione |
| Euromecc domain | `nextEuromeccDomain.ts:457-628` | euromecc pending/done/issues/meta | add/update/delete/set | task/issue/meta | impatta Euromecc |
| Euromecc relazioni/ordini | `NextEuromeccPage.tsx:2980`, `:3031`, `:3181` | `euromecc_relazioni`, `@ordini`, Storage | add/set/upload | analisi/conferma relazione | impatta procurement |
| Cisterna writer | `nextCisternaWriter.ts:15-95` | `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`, Storage | set/add/update/upload | IA cisterna/schede | impatta Cisterna/Chat |
| Archivista archive client | `ArchivistaArchiveClient.ts:502`, `:603`, `:623`, `:748` | `@documenti_mezzi`, `@documenti_magazzino`, `@preventivi`, `@mezzi_aziendali`, Storage | add/set/update/upload | IA Archivista | impatta Dossier/Mezzi |
| IA libretto | `NextIALibrettoPage.tsx:465` | `@mezzi_aziendali` | update array | conferma estrazione libretto | impatta Dossier/Scadenze |
| Autisti Admin | `NextAutistiAdminNative.tsx:1052`, `:1439`, `:1500`, `:1691`, `:1727`, `:1847`, `:1864` | sessioni/eventi/segnalazioni/controlli/gomme/rifornimenti | update/delete/merge | amministrazione richieste autisti | impatta Centro/Dossier |
| Driver pages autisti | `NextAutistiRifornimentoPage.tsx:157`, `NextAutistiSegnalazioniPage.tsx:371`, `NextAutistiControlloPage.tsx:105` | nessuno | read-only esplicito | invio driver | NON scrive business |

## 4. Dataset condivisi e rischio

| Dataset | Moduli lettori | Moduli scrittori | Rischio | Motivo |
|---|---|---|---|---|
| `storage/@mezzi_aziendali` | Scadenze, Dossier, Capo, IA libretto, Autisti setup, Chat IA | Anagrafiche mezzi, Scadenze, IA libretto, Archivista Documento Mezzo | critico | master flotta condiviso |
| `storage/@inventario` | Magazzino, Manutenzioni, Operativita, Dossier | Magazzino, Manutenzioni | critico | doppio writer e movimenti collegati |
| `storage/@materialiconsegnati` | Magazzino, Dossier, Operativita, Manutenzioni | Magazzino, Manutenzioni | critico | movimenti inventario condivisi |
| `storage/@manutenzioni` | Manutenzioni, Dossier, Operativita, Centro | Manutenzioni | alto | storico mezzo e manutenzioni |
| `storage/@ordini` | Acquisti, Ordini, Magazzino, Euromecc | Materiali, Procurement, Euromecc | critico | tre writer reali |
| `storage/@preventivi` | Procurement, IA documenti, Capo/documenti costi | Preventivo manuale, Archivista | alto | documenti economici condivisi |
| `storage/@listino_prezzi` | Procurement/documenti costi | Preventivo manuale | alto | derivato da preventivi |
| `storage/@colleghi` | Autisti, Centro, Magazzino, Anagrafiche | Anagrafiche | alto | persone/autisti condivisi |
| `storage/@fornitori` | Magazzino, Procurement, Anagrafiche | Anagrafiche | medio | master fornitori |
| `storage/@officine` | Scadenze, Anagrafiche | Anagrafiche | medio | officine collegate a collaudi |
| `storage/@lavori` | Lavori, Dossier, Manutenzioni | Lavori | alto | stato operativo mezzo/magazzino |
| `storage/@rifornimenti` | Dossier, Centro, Cisterna | Autisti Admin | alto | consolidamento da tmp a business |
| `storage/@rifornimenti_autisti_tmp` | Centro, Dossier, Cisterna, Autisti Admin | Autisti Admin | alto | inbox/rifornimenti temporanei |
| `@documenti_mezzi` | Dossier, Manutenzioni, IA Documenti, Archivista, Chat IA | Archivista, delete/update documenti costi | critico | documenti certificati mezzo |
| `@documenti_magazzino` | Magazzino/IA documenti/Archivista | Archivista | alto | documenti materiali/preventivi |
| `@documenti_generici` | IA documenti/Archivista/Chat IA | Archivista | medio | archivio generico |
| `@documenti_cisterna` | Cisterna, Chat IA | Cisterna IA | alto | documenti cisterna certificati |
| `@cisterna_schede_ia` | Cisterna, Chat IA | Cisterna schede | alto | schede estratte IA |
| `euromecc_*` | Euromecc | Euromecc | alto | task/issue/relazioni operative |

## 5. Dipendenze legacy rilevate

| Tipo | File NEXT | Dipendenza legacy | Stato |
|---|---|---|---|
| CSS | `NextManutenzioniPage.tsx:36` | `../pages/Manutenzioni.css` | DIPENDENZA LEGACY RILEVATA |
| CSS | `NextGestioneOperativaPage.tsx:2`, `NextOperativitaGlobalePage.tsx:14` | `../pages/GestioneOperativa.css` | DIPENDENZA LEGACY RILEVATA |
| CSS | `NextDossier*Page.tsx` | `../pages/DossierMezzo.css`, `../pages/DossierLista.css` | DIPENDENZA LEGACY RILEVATA |
| CSS | `NextCapo*Page.tsx` | `../pages/CapoMezzi.css`, `../pages/CapoCostiMezzo.css` | DIPENDENZA LEGACY RILEVATA |
| CSS | `NextCisterna*Page.tsx` | `../pages/CisternaCaravate/*.css` | DIPENDENZA LEGACY RILEVATA |
| CSS | `src/next/autisti/*`, `src/next/autistiInbox/*` | `src/autisti/*.css`, `src/autistiInbox/*.css` | DIPENDENZA LEGACY RILEVATA |
| Componente madre | `NextCentroControlloClonePage.tsx:3` | `../pages/CentroControllo` | DIPENDENZA LEGACY RILEVATA, file non routato |
| Redirect strutturale | `NextLegacyStructuralRedirects.tsx:9-41` | nessun mount madre, solo `Navigate` | DIMOSTRATO |
| `legacyFallback` | `src/App.tsx:144`, `NextRoleGuard.tsx:29` | prop consumata con `void legacyFallback`, children renderizzati | NON monta madre |
| `NextMotherPage` | `src/next/NextMotherPage.tsx` | compat layer presente | NON PRESENTE come route/import attivo in `src/App.tsx` |

## 6. Collegamenti principali tra moduli

| Flusso | Stato | Fonte |
|---|---|---|
| Manutenzioni scrive `@manutenzioni` e puo scalare `@inventario`/`@materialiconsegnati`; Dossier e Operativita leggono gli stessi dataset | DIMOSTRATO | `nextManutenzioniDomain.ts:978-994`, `nextDossierMezzoDomain.ts:770-776`, `nextOperativitaGlobaleDomain.ts:345-349` |
| Magazzino scrive inventario/consegne/AdBlue; Manutenzioni e Dossier leggono inventario/materiali | DIMOSTRATO | `NextMagazzinoPage.tsx:1588-1611`, `nextDossierMezzoDomain.ts:772`, `nextManutenzioniDomain.ts:897-898` |
| Procurement scrive `@ordini`; Euromecc puo generare ordini nello stesso dataset | DIMOSTRATO | `NextMaterialiDaOrdinarePage.tsx:1164`, `NextProcurementReadOnlyPanel.tsx:598`, `NextEuromeccPage.tsx:3031` |
| Autisti Admin consolida rifornimenti tmp in `@rifornimenti`; Centro e Dossier li leggono | DIMOSTRATO | `NextAutistiAdminNative.tsx:1847-1864`, `nextRifornimentiDomain.ts:1223-1346` |
| IA Archivista salva documenti root usati da Dossier, Manutenzioni e IA Documenti | DIMOSTRATO | `ArchivistaArchiveClient.ts:502`, `nextDocumentiCostiDomain.ts:2010`, `nextManutenzioniDomain.ts:454` |
| Chat IA legge dati certificati via backend internal-ai e monta viste Vehicle/Site/Driver/Cisterna/Euromecc | DIMOSTRATO per chiamata frontend-backend; dettaglio dataset backend fuori da questo audit runtime | `chatIaBackendBridge.ts:69`, `:201`, `internal-ai-adapter.js:3851` |

## 7. Esito audit

Copertura DIMOSTRATA:
- tutte le route `/next` presenti in `src/App.tsx` sono state inventariate;
- tutti i file `Next*Page.tsx` attivi o non routati trovati con discovery sono stati classificati;
- reader/writer principali NEXT sono stati mappati con file/riga;
- backend internal-ai e funzioni esterne sono stati mappati solo dove chiamati dalla NEXT.

Residui DA VERIFICARE:
- componenti secondari non routati che non espongono reader/writer diretti;
- payload completi di alcuni writer UI molto lunghi, riportati nel data contract come campi principali dimostrati e campi estesi "vedi fonte";
- regole Firestore/Storage non lette per istruzione di audit limitato e perche non risultano chiamate runtime da moduli NEXT.

Output collegati:
- Data contract: `docs/data/DATA_CONTRACT_REALE_NEXT_FIREBASE_2026-05-07.md`
- Diagrammi: `docs/architecture/DIAGRAMMI_FLUSSI_DATI_NEXT_2026-05-07.md`
