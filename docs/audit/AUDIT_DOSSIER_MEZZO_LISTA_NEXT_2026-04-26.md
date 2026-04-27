# AUDIT DOSSIER MEZZO + LISTA NEXT — 2026-04-26

## 0. RIASSUNTO TOP-LINE
- Stato Dossier Lista NEXT: presente e runtime attivo su `/next/dossiermezzi`; legge la flotta da `readNextAnagraficheFlottaSnapshot`, non scrive dati.
- Stato Dossier Mezzo NEXT: presente e runtime attivo su `/next/dossier/:targa` e `/next/dossiermezzi/:targa`; legge il composito dossier e scrive solo eliminazioni documenti/costi, non anagrafica mezzo.
- Punti di scrittura mezzo trovati in src/next/* (totali): 6 punti eseguibili su `@mezzi_aziendali`.
- Punti di scrittura mezzo runtime attivi: 6 punti raggiungibili da route attive IA (`/next/ia/libretto`, `/next/ia/archivista`); 0 dentro Dossier Lista o Dossier Mezzo.
- Manutenzione programmata: vista UI dedicata si in `/next/mezzi` e visualizzazione in Dossier Mezzo; scrittura attiva su mezzo esistente non trovata fuori dai flussi IA/documento mezzo.

## 1. DOSSIER LISTA NEXT

### 1.1 Entrypoint e file satellite
| File | Ruolo | Prova |
| --- | --- | --- |
| `src/next/NextDossierListaPage.tsx` | entrypoint pagina lista dossier NEXT | export default a `src/next/NextDossierListaPage.tsx:30` |
| `src/next/nextAnagraficheFlottaDomain.ts` | reader flotta usato dalla lista | import e chiamata a `src/next/NextDossierListaPage.tsx:4`, `src/next/NextDossierListaPage.tsx:41` |
| `src/next/nextStructuralPaths.ts` | builder link detail | import a `src/next/NextDossierListaPage.tsx:5`, builder a `src/next/nextStructuralPaths.ts:76` |
| `src/pages/DossierLista.css` | CSS legacy riusato dalla NEXT | import a `src/next/NextDossierListaPage.tsx:3` |

### 1.2 Rotta
| Route | Routing | Componente |
| --- | --- | --- |
| `/next/dossiermezzi` | `src/App.tsx:435` dentro `NextRoleGuard areaId="mezzi-dossier"` a `src/App.tsx:437` | `NextDossierListaPage` a `src/App.tsx:438` |
| `/next/dossiermezzi/:targa` | `src/App.tsx:443` | monta `NextDossierMezzoPage` a `src/App.tsx:446` |

### 1.3 Struttura UI
1. Stato loading: `Caricamento...` a `src/next/NextDossierListaPage.tsx:78`.
2. Wrapper e titolo `Dossier Mezzi` o categoria selezionata a `src/next/NextDossierListaPage.tsx:82`.
3. Griglia categorie, click su card categoria con `setCategoriaSelezionata` a `src/next/NextDossierListaPage.tsx:88`.
4. Bottone `< Categorie` per tornare alla lista categorie a `src/next/NextDossierListaPage.tsx:110`.
5. Griglia mezzi della categoria selezionata, ogni card e un `Link` a `buildNextDossierListaDetailPath(mezzo.targa)` a `src/next/NextDossierListaPage.tsx:126`.

### 1.4 Letture
| Fonte | Cosa legge | File:riga |
| --- | --- | --- |
| `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })` | items flotta: targa, marca, modello, categoria, fotoUrl | `src/next/NextDossierListaPage.tsx:41` |
| `storage/@mezzi_aziendali` | dataset letto dal reader flotta | `src/next/nextAnagraficheFlottaDomain.ts:6` |

### 1.5 Scritture
- Nessuna scrittura trovata in `src/next/NextDossierListaPage.tsx`.
- Gli unici cambi di stato sono UI locali: `setMezzi`, `setLoading`, `setCategoriaSelezionata` a `src/next/NextDossierListaPage.tsx:31`, `src/next/NextDossierListaPage.tsx:32`, `src/next/NextDossierListaPage.tsx:33`.
- Nessun import di `firestoreWriteOps`, `storageWriteOps`, `storageSync`, `firebase/firestore` o `firebase/storage` nella pagina.

### 1.6 Pulsanti
| Etichetta / elemento | Handler | Tipo | Writer | File:riga |
| --- | --- | --- | --- | --- |
| Card categoria | `setCategoriaSelezionata(categoria)` | UI | nessuno | `src/next/NextDossierListaPage.tsx:95` |
| `< Categorie` | `setCategoriaSelezionata(null)` | UI | nessuno | `src/next/NextDossierListaPage.tsx:110` |
| Card mezzo | `Link to={buildNextDossierListaDetailPath(mezzo.targa)}` | nav | nessuno | `src/next/NextDossierListaPage.tsx:126` |

### 1.7 Read-only/banner
- Nessun banner o alert read-only trovato in `src/next/NextDossierListaPage.tsx`.
- Nessun `disabled` trovato nella pagina.

## 2. DOSSIER MEZZO NEXT

### 2.1 Entrypoint e file satellite
| File | Ruolo | Prova |
| --- | --- | --- |
| `src/next/NextDossierMezzoPage.tsx` | entrypoint pagina detail dossier mezzo | export default a `src/next/NextDossierMezzoPage.tsx:139` |
| `src/next/domain/nextDossierMezzoDomain.ts` | aggregatore composito dossier | import a `src/next/NextDossierMezzoPage.tsx:17`, reader a `src/next/domain/nextDossierMezzoDomain.ts:747` |
| `src/next/domain/nextDocumentiCostiDomain.ts` | writer delete documenti/costi usato dal dossier | import a `src/next/NextDossierMezzoPage.tsx:23`, funzione a `src/next/domain/nextDocumentiCostiDomain.ts:2339` |
| `src/next/nextStructuralPaths.ts` | builder route collegate | import path a `src/next/NextDossierMezzoPage.tsx:24` |
| `src/pages/DossierMezzo.css` | CSS legacy riusato | import a `src/next/NextDossierMezzoPage.tsx:14` |
| `src/next/NextPdfPreviewModal.tsx` / `src/components/PdfPreviewModal` | preview PDF | import `PdfPreviewModal` a `src/next/NextDossierMezzoPage.tsx:3` |

### 2.2 Rotta
| Route | Routing | Componente |
| --- | --- | --- |
| `/next/dossiermezzi/:targa` | `src/App.tsx:443` dentro guard `mezzi-dossier` | `NextDossierMezzoPage` a `src/App.tsx:446` |
| `/next/dossier/:targa` | `src/App.tsx:451` dentro guard `mezzi-dossier` | `NextDossierMezzoPage` a `src/App.tsx:454` |
| `/next/mezzi-dossier/:targa` | `src/App.tsx:483` | redirect legacy tramite `NextMezziDossierDetailLegacyRedirect` a `src/App.tsx:486` |

### 2.3 Struttura UI
1. Caricamento e stato errore: `src/next/NextDossierMezzoPage.tsx:169`, `src/next/NextDossierMezzoPage.tsx:400`.
2. Header con bottone `Mezzi`, titolo dossier e azioni: `src/next/NextDossierMezzoPage.tsx:501`.
3. Azioni header: Analisi Economica, Gomme, Rifornimenti, LIBRETTO, Anteprima PDF a `src/next/NextDossierMezzoPage.tsx:505`.
4. Sezione `Dati tecnici`, blocchi Identificazione, Caratteristiche, Motore e massa, Scadenze a `src/next/NextDossierMezzoPage.tsx:514`.
5. Sezione `Foto mezzo` a `src/next/NextDossierMezzoPage.tsx:520`.
6. Sezione `Lavori` con anteprima In attesa/Eseguiti e modali `Mostra tutti` a `src/next/NextDossierMezzoPage.tsx:522`.
7. Sezione `Manutenzioni` con bottone `Mostra tutti` a `src/next/NextDossierMezzoPage.tsx:528`.
8. Sezioni `Stato gomme per asse`, `Eventi gomme straordinari`, `Materiali e movimenti inventario`, `Rifornimenti`, `Preventivi`, `Fatture` a `src/next/NextDossierMezzoPage.tsx:530`, `src/next/NextDossierMezzoPage.tsx:532`, `src/next/NextDossierMezzoPage.tsx:534`, `src/next/NextDossierMezzoPage.tsx:536`, `src/next/NextDossierMezzoPage.tsx:538`, `src/next/NextDossierMezzoPage.tsx:539`.

### 2.4 Letture
| Fonte | Cosa legge | File:riga |
| --- | --- | --- |
| `readNextDossierMezzoCompositeSnapshot(targa)` | snapshot composito dossier | `src/next/NextDossierMezzoPage.tsx:175` |
| `readNextDossierMezzoIdentity` | identita mezzo da `storage/@mezzi_aziendali` | `src/next/domain/nextDossierMezzoDomain.ts:408`, `src/next/domain/nextDossierMezzoDomain.ts:414` |
| `readNextMezzoOperativitaTecnicaSnapshot` | blocco tecnico | `src/next/domain/nextDossierMezzoDomain.ts:770` |
| `readNextMezzoLavoriSnapshot` | lavori | `src/next/domain/nextDossierMezzoDomain.ts:771` |
| `readNextMaterialiMovimentiSnapshot` | materiali/movimenti | `src/next/domain/nextDossierMezzoDomain.ts:772` |
| `readNextMezzoManutenzioniGommeSnapshot` | manutenzioni/gomme | `src/next/domain/nextDossierMezzoDomain.ts:773` |
| `readNextMezzoRifornimentiSnapshot` | rifornimenti | `src/next/domain/nextDossierMezzoDomain.ts:774` |
| `readNextMezzoDocumentiCostiSnapshot` | documenti/costi | `src/next/domain/nextDossierMezzoDomain.ts:775` |
| `readSavedAnalisiEconomicaRecord` | analisi economica salvata | `src/next/domain/nextDossierMezzoDomain.ts:777` |

### 2.5 Scritture
| Scrittura | Writer | Scope dati | File:riga |
| --- | --- | --- | --- |
| Eliminazione fattura/costo da Dossier | `deleteNextDocumentoCosto(fatturaToDelete)` eseguito dentro `runWithCloneWriteScopedAllowance` | `@costiMezzo` oppure collezioni documentali, non `@mezzi_aziendali` | `src/next/NextDossierMezzoPage.tsx:332`, `src/next/domain/nextDocumentiCostiDomain.ts:2339` |
| Eliminazione preventivo | bloccata con alert read-only | nessuna scrittura | `src/next/NextDossierMezzoPage.tsx:309` |
- Nessuna scrittura dell'anagrafica mezzo trovata in `src/next/NextDossierMezzoPage.tsx`.
- Nessuna scrittura dei campi `manutenzioneProgrammata`, `manutenzioneDataInizio`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto` trovata in `src/next/NextDossierMezzoPage.tsx`.

### 2.6 Pulsanti
| Etichetta / elemento | Handler | Tipo | Writer | File:riga |
| --- | --- | --- | --- | --- |
| Mezzi | `back` | nav | nessuno | `src/next/NextDossierMezzoPage.tsx:502`, `src/next/NextDossierMezzoPage.tsx:392` |
| Analisi Economica | `navigate(buildNextAnalisiEconomicaPath(...))` | nav | nessuno | `src/next/NextDossierMezzoPage.tsx:505` |
| Gomme | `navigate(buildNextDossierGommePath(...))` | nav | nessuno | `src/next/NextDossierMezzoPage.tsx:506` |
| Rifornimenti (dettaglio) | `navigate(buildNextDossierRifornimentiPath(...))` | nav | nessuno | `src/next/NextDossierMezzoPage.tsx:507` |
| LIBRETTO | `setModal("libretto")` | UI/modal | nessuno | `src/next/NextDossierMezzoPage.tsx:508` |
| Anteprima PDF | `openDossierPdf` | read/export | nessuno | `src/next/NextDossierMezzoPage.tsx:509`, `src/next/NextDossierMezzoPage.tsx:278` |
| Foto mezzo thumbnail | `setModal("foto")` | UI/modal | nessuno | `src/next/NextDossierMezzoPage.tsx:520` |
| Mostra tutti lavori | `setModal("attesa")` / `setModal("eseguiti")` | UI/modal | nessuno | `src/next/NextDossierMezzoPage.tsx:524` |
| Riga lavoro | `openLavoro(item.id)` | nav | nessuno | `src/next/NextDossierMezzoPage.tsx:524`, `src/next/NextDossierMezzoPage.tsx:388` |
| Mostra tutti manutenzioni | `setModal("manutenzioni")` | UI/modal | nessuno | `src/next/NextDossierMezzoPage.tsx:528` |
| Riga manutenzione | `openManutenzione(item)` | nav | nessuno | `src/next/NextDossierMezzoPage.tsx:528`, `src/next/NextDossierMezzoPage.tsx:389` |
| Anteprima PDF documento | `openDocumentPdf(...)` | read/export | nessuno | `src/next/NextDossierMezzoPage.tsx:424` |
| Elimina preventivo | `blockPreventivoDelete` | bloccato read-only | nessuno | `src/next/NextDossierMezzoPage.tsx:425`, `src/next/NextDossierMezzoPage.tsx:309` |
| Elimina fattura | `openFatturaDeleteConfirm` -> `confirmFatturaDelete` | write | `deleteNextDocumentoCosto` | `src/next/NextDossierMezzoPage.tsx:426`, `src/next/NextDossierMezzoPage.tsx:326` |
| Vai allo storico -> | `navigate(NEXT_IA_DOCUMENTI_PATH)` | nav | nessuno | `src/next/NextDossierMezzoPage.tsx:539` |

### 2.7 Read-only/banner
- Alert read-only per eliminazione preventivo: `CLONE_READ_ONLY_PREVENTIVO_DELETE_MESSAGE` a `src/next/NextDossierMezzoPage.tsx:38`, usato a `src/next/NextDossierMezzoPage.tsx:309`.
- Non trovato un banner globale read-only nella pagina Dossier Mezzo.
- `disabled` presente solo sui bottoni della modale conferma fattura durante `deletePending`: `src/next/NextDossierMezzoPage.tsx:455`, `src/next/NextDossierMezzoPage.tsx:483`, `src/next/NextDossierMezzoPage.tsx:491`.

### 2.8 Modali
| Modale | File | Scopo | Scritture |
| --- | --- | --- | --- |
| Libretto | `src/next/NextDossierMezzoPage.tsx:437` | mostra libretto e link a IA Libretto | nessuna |
| Foto mezzo | `src/next/NextDossierMezzoPage.tsx:439` | preview foto mezzo | nessuna |
| Conferma eliminazione fattura | `src/next/NextDossierMezzoPage.tsx:441` | conferma delete fattura | si: `confirmFatturaDelete` -> `deleteNextDocumentoCosto`, `src/next/NextDossierMezzoPage.tsx:326` |
| Lavori in attesa | `src/next/NextDossierMezzoPage.tsx:542` | lista completa lavori in attesa | nessuna |
| Lavori eseguiti | `src/next/NextDossierMezzoPage.tsx:542` | lista completa lavori eseguiti | nessuna |
| Manutenzioni | `src/next/NextDossierMezzoPage.tsx:542` | lista manutenzioni collegate | nessuna; click riga naviga a Manutenzioni |
| PdfPreviewModal | `src/next/NextDossierMezzoPage.tsx:562` | preview PDF dossier/documenti | nessuna |

## 3. DOVE SI MODIFICA OGGI L'ANAGRAFICA MEZZO NELLA NEXT

### 3.1 Tabella punti scrittura
| # | File:riga | Route runtime o orfano | Handler/funzione | Tipo aggiornamento | Writer usato | Attivo runtime |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `src/next/NextIALibrettoPage.tsx:465` | `/next/ia/libretto` (`src/App.tsx:659`) | `handleSave` | upsert mezzo: aggiorna campi libretto su mezzo esistente oppure crea record fallback se targa non trovata | `storageSync.setItemSync("@mezzi_aziendali", mezzi)` | si |
| 2 | `src/next/internal-ai/ArchivistaArchiveClient.ts:710` | `/next/ia/archivista` tramite `NextIAArchivistaPage` (`src/App.tsx:515`, `src/next/NextIAArchivistaPage.tsx:304`) | `applyArchivistaVehicleUpdate` | update parziale mezzo esistente: targa/marca/modello/telaio/proprietario/immatricolazione/assicurazione/revisione secondo subtype | `storageSync.setItemSync("@mezzi_aziendali", next)` | si |
| 3 | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1533` | `/next/ia/archivista` (`src/next/NextIAArchivistaPage.tsx:304`) | `applyArchivistaLibrettoVehicleUpdate` | update parziale mezzo esistente: campi libretto + eventuale foto mezzo | `storageSync.setItemSync("@mezzi_aziendali", next)` | si |
| 4 | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2285` | `/next/ia/archivista` | `handleArchive` | creazione nuovo mezzo da documento/libretto | `storageSync.setItemSync("@mezzi_aziendali", nextVehicles)` | si |
| 5 | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2343` | `/next/ia/archivista` | `handleArchive` | update del mezzo appena creato con dati file archiviato | `storageSync.setItemSync("@mezzi_aziendali", updatedVehicles)` | si |
| 6 | `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2390` | `/next/ia/archivista` | `handleArchive` catch | rollback/delete del mezzo creato se archiviazione fallisce | `storageSync.setItemSync("@mezzi_aziendali", rollbackVehicles)` | si |
| non conteggiato | `src/next/NextMezziDossierPage.tsx:511`, `src/next/NextMezziDossierPage.tsx:537` | orfano/non montato; `/next/mezzi-dossier` redirecta a `/next/mezzi` | blocco commentato e handler attivi read-only a `src/next/NextMezziDossierPage.tsx:554`, `src/next/NextMezziDossierPage.tsx:559` | create/update/delete nel codice commentato, non eseguibile | `setItemSync(MEZZI_KEY, ...)` nel commento | no |

### 3.2 Risposta secca
Oggi nella NEXT un mezzo gia esistente si modifica solo nei flussi IA: `/next/ia/libretto` tramite `NextIALibrettoPage.handleSave` e `/next/ia/archivista` tramite `ArchivistaDocumentoMezzoBridge` / `ArchivistaArchiveClient`. Non si modifica dentro Dossier Lista NEXT e non si modifica dentro Dossier Mezzo NEXT.

## 4. DOVE VIVE OGGI LA MANUTENZIONE PROGRAMMATA NELLA NEXT

### 4.1 Mappa per campo (lettura/scrittura/UI)
| Campo | Letture | Scritture | UI dedicata |
| --- | --- | --- | --- |
| `manutenzioneProgrammata` | `nextAnagraficheFlottaDomain` type/mapping a `src/next/nextAnagraficheFlottaDomain.ts:101`, `src/next/nextAnagraficheFlottaDomain.ts:537`; `nextDossierMezzoDomain` a `src/next/domain/nextDossierMezzoDomain.ts:94`, `src/next/domain/nextDossierMezzoDomain.ts:392`; `nextManutenzioniDomain` a `src/next/domain/nextManutenzioniDomain.ts:639` | default `false` su nuovo mezzo in `NextIALibrettoPage` a `src/next/NextIALibrettoPage.tsx:348`; default `false` su nuovo mezzo in Archivista a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1396`; codice commentato non runtime in `src/next/NextMezziDossierPage.tsx:449` | si in `/next/mezzi` a `src/next/NextMezziPage.tsx:867`; visualizzata in Dossier Mezzo a `src/next/NextDossierMezzoPage.tsx:515` |
| `manutenzioneDataInizio` | `nextAnagraficheFlottaDomain` a `src/next/nextAnagraficheFlottaDomain.ts:102`, `src/next/nextAnagraficheFlottaDomain.ts:538`; `nextDossierMezzoDomain` a `src/next/domain/nextDossierMezzoDomain.ts:91`, `src/next/domain/nextDossierMezzoDomain.ts:389`; `nextManutenzioniDomain` a `src/next/domain/nextManutenzioniDomain.ts:640` | default vuoto su nuovo mezzo in `NextIALibrettoPage` a `src/next/NextIALibrettoPage.tsx:349`; default vuoto su nuovo mezzo in Archivista a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1397`; codice commentato non runtime in `src/next/NextMezziDossierPage.tsx:450` | input in `/next/mezzi` a `src/next/NextMezziPage.tsx:888`; visualizzata nel periodo Dossier a `src/next/NextDossierMezzoPage.tsx:515` |
| `manutenzioneDataFine` | `nextAnagraficheFlottaDomain` a `src/next/nextAnagraficheFlottaDomain.ts:104`, `src/next/nextAnagraficheFlottaDomain.ts:540`; `nextDossierMezzoDomain` a `src/next/domain/nextDossierMezzoDomain.ts:92`, `src/next/domain/nextDossierMezzoDomain.ts:390`; `nextManutenzioniDomain` a `src/next/domain/nextManutenzioniDomain.ts:641`; Centro Controllo a `src/next/domain/nextCentroControlloDomain.ts:616` | default vuoto su nuovo mezzo in `NextIALibrettoPage` a `src/next/NextIALibrettoPage.tsx:350`; default vuoto su nuovo mezzo in Archivista a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1398`; codice commentato non runtime in `src/next/NextMezziDossierPage.tsx:453` | input in `/next/mezzi` a `src/next/NextMezziPage.tsx:898`; visualizzata nel periodo Dossier a `src/next/NextDossierMezzoPage.tsx:515`; vista Centro Controllo parity a `src/next/NextCentroControlloParityPage.tsx:1160` |
| `manutenzioneKmMax` | `nextAnagraficheFlottaDomain` a `src/next/nextAnagraficheFlottaDomain.ts:106`, `src/next/nextAnagraficheFlottaDomain.ts:542`; `nextDossierMezzoDomain` a `src/next/domain/nextDossierMezzoDomain.ts:93`, `src/next/domain/nextDossierMezzoDomain.ts:391`; `nextManutenzioniDomain` a `src/next/domain/nextManutenzioniDomain.ts:642` | default vuoto su nuovo mezzo in `NextIALibrettoPage` a `src/next/NextIALibrettoPage.tsx:351`; default vuoto su nuovo mezzo in Archivista a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1399`; codice commentato non runtime in `src/next/NextMezziDossierPage.tsx:456` | input in `/next/mezzi` a `src/next/NextMezziPage.tsx:908`; visualizzata in Dossier a `src/next/NextDossierMezzoPage.tsx:515`; vista Centro Controllo parity a `src/next/NextCentroControlloParityPage.tsx:1166` |
| `manutenzioneContratto` | `nextAnagraficheFlottaDomain` a `src/next/nextAnagraficheFlottaDomain.ts:107`, `src/next/nextAnagraficheFlottaDomain.ts:543`; `nextDossierMezzoDomain` a `src/next/domain/nextDossierMezzoDomain.ts:90`, `src/next/domain/nextDossierMezzoDomain.ts:388`; `nextManutenzioniDomain` a `src/next/domain/nextManutenzioniDomain.ts:643` | default vuoto su nuovo mezzo in `NextIALibrettoPage` a `src/next/NextIALibrettoPage.tsx:352`; default vuoto su nuovo mezzo in Archivista a `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1400`; codice commentato non runtime in `src/next/NextMezziDossierPage.tsx:459` | textarea in `/next/mezzi` a `src/next/NextMezziPage.tsx:918`; visualizzata in Dossier a `src/next/NextDossierMezzoPage.tsx:515`; vista Centro Controllo parity a `src/next/NextCentroControlloParityPage.tsx:1165` |

### 4.2 Risposta secca
Oggi la manutenzione programmata si visualizza in Dossier Mezzo nella sezione `Dati tecnici > Scadenze` e si visualizza/modifica solo come form read-only nella pagina `/next/mezzi`. Non esiste una scrittura runtime attiva dei cinque campi di manutenzione programmata su un mezzo esistente dentro Dossier Mezzo o Dossier Lista.

## 5. MAPPA COMPLETA SCRITTURE MEZZO NELLA NEXT

### 5.1 Tabella unica
| File:riga | Route runtime o orfano | Writer | Scope | Barriera |
| --- | --- | --- | --- | --- |
| `src/next/NextIALibrettoPage.tsx:465` | `/next/ia/libretto` | `storageSync.setItemSync` | upsert anagrafica/libretto mezzo su `@mezzi_aziendali`; eventuale upload libretto a `mezzi_aziendali/{id}/libretto.jpg` a `src/next/NextIALibrettoPage.tsx:423` | deroga `IA_LIBRETTO_ALLOWED_WRITE_PATH` a `src/utils/cloneWriteBarrier.ts:92`, key `@mezzi_aziendali` a `src/utils/cloneWriteBarrier.ts:96`, ramo a `src/utils/cloneWriteBarrier.ts:336` |
| `src/next/internal-ai/ArchivistaArchiveClient.ts:710` | `/next/ia/archivista` | `storageSync.setItemSync` | update parziale campi anagrafica mezzo esistente da analisi documento | deroga route Archivista a `src/utils/cloneWriteBarrier.ts:258`, key `@mezzi_aziendali` a `src/utils/cloneWriteBarrier.ts:103`, ramo a `src/utils/cloneWriteBarrier.ts:349` |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1533` | `/next/ia/archivista` | `storageSync.setItemSync` | update parziale libretto/foto mezzo esistente | stessa deroga Archivista |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2285` | `/next/ia/archivista` | `storageSync.setItemSync` | creazione nuovo mezzo da documento mezzo | stessa deroga Archivista |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2343` | `/next/ia/archivista` | `storageSync.setItemSync` | update nuovo mezzo con dati archivio documento | stessa deroga Archivista |
| `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:2390` | `/next/ia/archivista` | `storageSync.setItemSync` | rollback/delete del nuovo mezzo creato in caso errore archiviazione | stessa deroga Archivista |
| `src/next/NextMezziDossierPage.tsx:511`, `src/next/NextMezziDossierPage.tsx:537` | orfano/non montato e blocco commentato | `setItemSync(MEZZI_KEY, ...)` nel commento | create/update/delete non eseguibili | nessuna runtime, route `/next/mezzi-dossier` redirecta a `NextMezziDossierLegacyRedirect` a `src/App.tsx:475` |

## 6. GAP FATTUALI

### 6.1 Cosa manca per modifica anagrafica via Dossier Mezzo
1. In `src/next/NextDossierMezzoPage.tsx` non e presente un form di edit anagrafica: la sezione `Dati tecnici` renderizza solo righe testuali a `src/next/NextDossierMezzoPage.tsx:514`.
2. In `src/next/NextDossierMezzoPage.tsx` non e presente un writer verso `storage/@mezzi_aziendali`; l'unico writer attivo della pagina e `deleteNextDocumentoCosto` a `src/next/NextDossierMezzoPage.tsx:332`.
3. In `src/utils/cloneWriteBarrier.ts` non e presente una deroga per scrivere `@mezzi_aziendali` dalla route `/next/dossier/:targa`; le deroghe trovate sono per `/next/ia/libretto` e `/next/ia/archivista` a `src/utils/cloneWriteBarrier.ts:92`, `src/utils/cloneWriteBarrier.ts:258`.
4. In `src/next/NextDossierListaPage.tsx` non ci sono handler di scrittura: la pagina ha solo stato UI e link di navigazione a `src/next/NextDossierListaPage.tsx:95`, `src/next/NextDossierListaPage.tsx:128`.
5. `src/next/NextMezziDossierPage.tsx` contiene un blocco storico con `setItemSync`, ma il blocco e commentato e gli handler attivi impostano solo errore read-only a `src/next/NextMezziDossierPage.tsx:554`, `src/next/NextMezziDossierPage.tsx:559`.

### 6.2 Cosa manca per manutenzione programmata via Dossier Mezzo
1. In `src/next/NextDossierMezzoPage.tsx` i cinque campi sono solo visualizzati nella sezione `Scadenze` a `src/next/NextDossierMezzoPage.tsx:515`.
2. In `src/next/NextDossierMezzoPage.tsx` non sono presenti input per `manutenzioneProgrammata`, `manutenzioneDataInizio`, `manutenzioneDataFine`, `manutenzioneKmMax`, `manutenzioneContratto`.
3. Nessun writer attivo in Dossier Mezzo aggiorna questi cinque campi; il writer attivo della pagina riguarda documenti/costi, non `@mezzi_aziendali`.
4. Le scritture attive trovate sui cinque campi impostano default `false`/vuoto solo durante creazione nuovo mezzo da IA Libretto o Archivista: `src/next/NextIALibrettoPage.tsx:348`, `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx:1396`.

## 7. NOTE FINALI (solo fatti di codice, niente opinioni)
- Dossier Lista NEXT e Dossier Mezzo NEXT non importano `firestoreWriteOps` o `storageWriteOps` direttamente.
- Dossier Mezzo NEXT importa `deleteNextDocumentoCosto` e usa `runWithCloneWriteScopedAllowance` per eliminazione fatture a `src/next/NextDossierMezzoPage.tsx:332`.
- La pagina `/next/ia/libretto` importa direttamente `firebase/firestore` e `firebase/storage` a `src/next/NextIALibrettoPage.tsx:2`, `src/next/NextIALibrettoPage.tsx:3`, e usa `storageSync.setItemSync` a `src/next/NextIALibrettoPage.tsx:465`.
- Il flusso Archivista documento mezzo e attivo in `/next/ia/archivista`: `NextIAArchivistaPage` monta `ArchivistaDocumentoMezzoBridge` a `src/next/NextIAArchivistaPage.tsx:304`.
- Le route `/next/mezzi-dossier` e `/next/mezzi-dossier/:targa` non montano `NextMezziDossierPage`; montano redirect legacy strutturali a `src/App.tsx:475` e `src/App.tsx:483`.
