# AUDIT MEZZI — MADRE vs NEXT — 2026-04-26

## 0. RIASSUNTO TOP-LINE
- Stato Mezzi madre: modulo presente e scrivente in `src/pages/Mezzi.tsx`, route `/mezzi`, persistenza su `storage/@mezzi_aziendali`, upload foto su Storage path `mezzi/...`.
- Stato Mezzi NEXT: modulo presente in `src/next/NextMezziPage.tsx`, route `/next/mezzi`, UI madre-like ma operazioni business bloccate in read-only; nessun writer dedicato Mezzi NEXT trovato.
- Numero gap bloccanti: 6
- Numero conflitti: 1

## 1. PARTE A — MADRE

### 1.1 Entrypoint
| Path | Evidenza | Stato |
| --- | --- | --- |
| `src/pages/Mezzi.tsx` | componente `Mezzi` dichiarato a `src/pages/Mezzi.tsx:252`, export default a `src/pages/Mezzi.tsx:1829` | entrypoint madre principale |
| `src/pages/DossierLista.tsx` | lista dossier per categoria, export default a `src/pages/DossierLista.tsx:15` | satellite dossier lista |
| `src/pages/DossierMezzo.tsx` | detail targa-centrico, legge `@mezzi_aziendali` a `src/pages/DossierMezzo.tsx:335` | satellite dossier dettaglio |
| `src/pages/CapoMezzi.tsx` | route `/capo/mezzi` in `src/App.tsx:715` | satellite area capo |
| `src/pages/Mezzo360.tsx` | route `/mezzo-360/:targa` in `src/App.tsx:710` | satellite vista targa |

### 1.2 File satellite
| File | Ruolo |
| --- | --- |
| `src/pages/Mezzi.css` | stile della pagina madre, importato da `src/pages/Mezzi.tsx:6` |
| `src/pages/DossierLista.tsx` | elenco dossier raggruppato per categoria, legge `storage/@mezzi_aziendali` a `src/pages/DossierLista.tsx:29` |
| `src/pages/DossierMezzo.tsx` | aggregatore targa: mezzi, lavori, materiali, rifornimenti, documenti, costi |
| `src/pages/DossierGomme.tsx` | route gomme dossier da `src/App.tsx:708` |
| `src/pages/DossierRifornimenti.tsx` | route rifornimenti dossier da `src/App.tsx:709` |
| `src/pages/AnalisiEconomica.tsx` | route analisi economica da `src/App.tsx:707` |
| `src/pages/CapoMezzi.tsx` | lista capo mezzi, legge `storage/@mezzi_aziendali` da `src/pages/CapoMezzi.tsx:268` |
| `src/pages/CapoCostiMezzo.tsx` | dettaglio costi capo, route `src/App.tsx:716` |
| `src/components/TargaPicker.tsx` | componente condiviso per selezione targa, trovato in `src/components` |

### 1.3 Rotta
| URL | File routing | Elemento |
| --- | --- | --- |
| `/mezzi` | `src/App.tsx:728` | `<Mezzi />` |
| `/dossiermezzi` | `src/App.tsx:704` | `<DossierLista />` |
| `/dossiermezzi/:targa` | `src/App.tsx:705` | `<DossierMezzo />` |
| `/dossier/:targa` | `src/App.tsx:706` | `<DossierMezzo />` |
| `/dossier/:targa/gomme` | `src/App.tsx:708` | `<DossierGomme />` |
| `/dossier/:targa/rifornimenti` | `src/App.tsx:709` | `<DossierRifornimenti />` |
| `/mezzo-360/:targa` | `src/App.tsx:710` | `<Mezzo360 />` |
| `/capo/mezzi` | `src/App.tsx:715` | `<CapoMezzi />` |

### 1.4 Struttura UI
Ordine della UI principale in `src/pages/Mezzi.tsx`:
1. Wrapper pagina `.mezzi-page` e grid principale a `src/pages/Mezzi.tsx:1008`.
2. Blocco debug DEV `DEBUG MEZZI` a `src/pages/Mezzi.tsx:1011`.
3. Card form con logo/titolo `Gestione Mezzi` a `src/pages/Mezzi.tsx:1105`.
4. Sezione `Foto mezzo` con preview, `Carica foto`, `Rimuovi foto`, input file `image/*` a `src/pages/Mezzi.tsx:1125`.
5. Sezione `LIBRETTO (IA)` con input immagine, checkbox overwrite, bottone `Analizza Libretto con IA` a `src/pages/Mezzi.tsx:1177`.
6. Sezione `Dati generali` con categoria, tipo, autista, targa, marca, modello, telaio, colore, dati motore, massa, proprietario, assicurazione, date, manutenzione programmata, note a `src/pages/Mezzi.tsx:1223`.
7. Bottoni form `Reset form` e `Salva mezzo` / `Salva modifiche` a `src/pages/Mezzi.tsx:1542`.
8. Card `Elenco mezzi` raggruppata per categoria con accordion a `src/pages/Mezzi.tsx:1565`.
9. Card mezzo con foto, marca/modello, targa, categoria, revisione, manutenzione e azioni `Modifica`, `Dossier Mezzo`, `Elimina` a `src/pages/Mezzi.tsx:1714`.

### 1.5 Campi anagrafica
| Etichetta UI | Campo codice | Tipo codice | Obbligatorio | File:riga |
| --- | --- | --- | --- | --- |
| id | `id` | `string` | generato | `src/pages/Mezzi.tsx:27`, `src/pages/Mezzi.tsx:747` |
| Categoria mezzo | `categoria` | `string` | no | `src/pages/Mezzi.tsx:31`, `src/pages/Mezzi.tsx:1230` |
| Tipo | `tipo` | `"motrice" \| "cisterna"` | no, default motrice | `src/pages/Mezzi.tsx:29`, `src/pages/Mezzi.tsx:1261` |
| Autista | `autistaId`, `autistaNome` | `string \| null` | no | `src/pages/Mezzi.tsx:56`, `src/pages/Mezzi.tsx:1275` |
| Targa | `targa` | `string` | sì | `src/pages/Mezzi.tsx:33`, `src/pages/Mezzi.tsx:658`, `src/pages/Mezzi.tsx:1297` |
| Marca | `marca` | `string` | sì | `src/pages/Mezzi.tsx:34`, `src/pages/Mezzi.tsx:662`, `src/pages/Mezzi.tsx:1308` |
| Modello | `modello` | `string` | sì | `src/pages/Mezzi.tsx:35`, `src/pages/Mezzi.tsx:666`, `src/pages/Mezzi.tsx:1317` |
| Telaio / VIN | `telaio` | `string` | no | `src/pages/Mezzi.tsx:36`, `src/pages/Mezzi.tsx:1330` |
| Colore | `colore` | `string` | no | `src/pages/Mezzi.tsx:37`, `src/pages/Mezzi.tsx:1339` |
| Cilindrata (cm³) | `cilindrata` | `string` | no; solo motrice | `src/pages/Mezzi.tsx:38`, `src/pages/Mezzi.tsx:1354` |
| Potenza (kW) | `potenza` | `string` | no; solo motrice | `src/pages/Mezzi.tsx:39`, `src/pages/Mezzi.tsx:1363` |
| Massa complessiva (kg) | `massaComplessiva` | `string` | no | `src/pages/Mezzi.tsx:40`, `src/pages/Mezzi.tsx:1375` |
| Proprietario | `proprietario` | `string` | no | `src/pages/Mezzi.tsx:41`, `src/pages/Mezzi.tsx:1388` |
| Assicurazione | `assicurazione` | `string` | no | `src/pages/Mezzi.tsx:42`, `src/pages/Mezzi.tsx:1397` |
| Data immatricolazione | `dataImmatricolazione` | `string` | sì | `src/pages/Mezzi.tsx:43`, `src/pages/Mezzi.tsx:671`, `src/pages/Mezzi.tsx:1410` |
| Data ultimo collaudo | `dataUltimoCollaudo` | `string` | no | `src/pages/Mezzi.tsx:45`, `src/pages/Mezzi.tsx:1419` |
| Prossimo collaudo | `dataScadenzaRevisione` | `string` | no | `src/pages/Mezzi.tsx:44`, `src/pages/Mezzi.tsx:1452` |
| Manutenzione programmata | `manutenzioneProgrammata` | `boolean` | no | `src/pages/Mezzi.tsx:47`, `src/pages/Mezzi.tsx:1466` |
| Data inizio contratto | `manutenzioneDataInizio` | `string \| undefined` | no | `src/pages/Mezzi.tsx:49`, `src/pages/Mezzi.tsx:1485` |
| Data prossima scadenza | `manutenzioneDataFine` | `string \| undefined` | no | `src/pages/Mezzi.tsx:50`, `src/pages/Mezzi.tsx:1495` |
| Km massimi | `manutenzioneKmMax` | `string \| undefined` | no | `src/pages/Mezzi.tsx:51`, `src/pages/Mezzi.tsx:1505` |
| Contratto / Note manutenzione | `manutenzioneContratto` | `string \| undefined` | no | `src/pages/Mezzi.tsx:52`, `src/pages/Mezzi.tsx:1516` |
| Note generali | `note` | `string` | no | `src/pages/Mezzi.tsx:54`, `src/pages/Mezzi.tsx:1532` |
| Foto mezzo | `fotoUrl`, `fotoPath` | `string \| null \| undefined` | no | `src/pages/Mezzi.tsx:61`, `src/pages/Mezzi.tsx:62`, `src/pages/Mezzi.tsx:1125` |
| Marca modello | `marcaModello` | `string \| undefined` | derivato | `src/pages/Mezzi.tsx:59`, `src/pages/Mezzi.tsx:739` |

### 1.6 Firestore
- Dataset principale dichiarato: `MEZZI_KEY = "@mezzi_aziendali"` in `src/pages/Mezzi.tsx:12`.
- Lettura madre: `getItemSync(MEZZI_KEY)` a `src/pages/Mezzi.tsx:321`.
- Scrittura madre create/update: `setItemSync(MEZZI_KEY, currentMezzi)` a `src/pages/Mezzi.tsx:787`.
- Scrittura madre delete: `setItemSync(MEZZI_KEY, updated, { allowRemovals: true, removedIds: [id] })` a `src/pages/Mezzi.tsx:808`.
- `storageSync.setItemSync` scrive il documento `doc(db, "storage", key)` a `src/utils/storageSync.ts:35`.
- Per `@mezzi_aziendali`, `storageSync` legge il valore precedente e fa merge-safe array a `src/utils/storageSync.ts:37`, poi scrive `{ value: mergedAfterRemovals }` a `src/utils/storageSync.ts:125`.
- Shape documento: `storage/@mezzi_aziendali` con payload `{ value: Mezzo[] }`, dove `Mezzo` è la shape elencata in sezione 1.5.

### 1.7 Pulsanti e azioni
| Etichetta | Handler | Tipo | Writer usato | File:riga |
| --- | --- | --- | --- | --- |
| Logo Ghielmi Cementi | `navigate("/")` | nav | nessuno | `src/pages/Mezzi.tsx:1111` |
| Carica foto | `handleOpenFotoPicker` | UI/upload prep | nessuna scrittura immediata | `src/pages/Mezzi.tsx:1147` |
| Rimuovi foto | inline `setFotoPreview(null); setFotoDirty(true)` | UI/form | scrittura differita in `handleSave` | `src/pages/Mezzi.tsx:1154` |
| Analizza Libretto con IA | `handleAnalyzeLibrettoWithIA` | read remote + fill form | `fetch(IA_LIBRETTO_URL)` | `src/pages/Mezzi.tsx:1210`, `src/pages/Mezzi.tsx:540` |
| Reset form | `resetForm` | UI | nessuno | `src/pages/Mezzi.tsx:1544` |
| Salva mezzo / Salva modifiche | `handleSave` | write | `uploadString`, `getDownloadURL`, `setItemSync` | `src/pages/Mezzi.tsx:1552`, `src/pages/Mezzi.tsx:654` |
| Header categoria accordion | inline `setCategoriaEspansa` | UI | nessuno | `src/pages/Mezzi.tsx:1603` |
| Modifica | `loadMezzoInForm(m)` | UI edit form | nessuno immediato | `src/pages/Mezzi.tsx:1786` |
| Dossier Mezzo | `navigate(`/dossiermezzi/${m.targa}`)` | nav | nessuno | `src/pages/Mezzi.tsx:1794` |
| Elimina | `handleDelete(m.id)` | write | `setItemSync` | `src/pages/Mezzi.tsx:1802`, `src/pages/Mezzi.tsx:801` |

### 1.8 Writer
- Madre non usa `firestoreWriteOps` né `storageWriteOps` nel file Mezzi.
- Madre importa `getItemSync` e `setItemSync` da `../utils/storageSync` a `src/pages/Mezzi.tsx:7`.
- Madre importa direttamente `ref`, `uploadString`, `getDownloadURL` da `firebase/storage` a `src/pages/Mezzi.tsx:8`.
- `storageSync.ts` importa direttamente `setDoc`, `getDoc`, `deleteDoc` da `firebase/firestore` a `src/utils/storageSync.ts:2`.
- `storageSync.setItemSync` passa comunque da `assertCloneWriteAllowed` a `src/utils/storageSync.ts:33`, ma nel layer madre questo non è il pattern `firestoreWriteOps`.

### 1.9 Upload file
- Foto mezzo: input `accept="image/*"` e `capture="environment"` a `src/pages/Mezzi.tsx:1167`.
- Path Storage foto mezzo: `mezzi/${targa.replace(/\s+/g, "_")}_${Date.now()}.jpg` a `src/pages/Mezzi.tsx:680`.
- Writer Storage: `uploadString(storageRef, base64Data, "base64", { contentType: "image/jpeg" })` a `src/pages/Mezzi.tsx:683`.
- URL persistito: `getDownloadURL(storageRef)` a `src/pages/Mezzi.tsx:686`, poi `fotoUrl`/`fotoPath` nel record a `src/pages/Mezzi.tsx:740`.
- Libretto IA: input `accept="image/*"` a `src/pages/Mezzi.tsx:1188`, invio a Cloud Run `IA_LIBRETTO_URL` dichiarata a `src/pages/Mezzi.tsx:14`; non risulta upload diretto del file libretto in questo handler.

### 1.10 Collegamenti cross-modulo
| Modulo/dataset | Direzione | Collection/dataset | File:riga |
| --- | --- | --- | --- |
| Colleghi/autisti abituali | R | `@colleghi` | `src/pages/Mezzi.tsx:13`, `src/pages/Mezzi.tsx:327` |
| Dossier Mezzo | nav | `/dossiermezzi/:targa` | `src/pages/Mezzi.tsx:1797`, `src/App.tsx:705` |
| Dossier identità mezzo | R | `storage/@mezzi_aziendali` | `src/pages/DossierMezzo.tsx:335` |
| Lavori | R | `storage/@lavori` | `src/pages/DossierMezzo.tsx:344` |
| Materiali consegnati | R | `storage/@materialiconsegnati` | `src/pages/DossierMezzo.tsx:360` |
| Rifornimenti autisti tmp | R | `@rifornimenti_autisti_tmp` | `src/pages/DossierMezzo.tsx:379` |
| Documenti IA | R | `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` | `src/pages/DossierMezzo.tsx:449` |
| Costi mezzo | R | `storage/@costiMezzo` | `src/pages/DossierMezzo.tsx:550` |
| Manutenzioni | R | `@manutenzioni` | `src/pages/DossierMezzo.tsx:610` |

### 1.11 Computed/derivati
- `marcaModello` viene derivato al save da `marca` + `modello` a `src/pages/Mezzi.tsx:739`.
- `calculaProssimaRevisione` calcola la prossima revisione da immatricolazione/ultimo collaudo a `src/pages/Mezzi.tsx:181`.
- `giorniDaOggi` calcola differenze giorno per classi di scadenza a `src/pages/Mezzi.tsx:232`.
- Auto-compilazione `Prossimo collaudo`: quando cambia `Data ultimo collaudo`, aggiunge 1 anno se il campo era vuoto o auto-generato a `src/pages/Mezzi.tsx:1423`.
- Raggruppamento categorie: `CATEGORIE_ORDINATE` a `src/pages/Mezzi.tsx:851`, `normalizeCategoria` a `src/pages/Mezzi.tsx:877`, `mezziPerCategoria` a `src/pages/Mezzi.tsx:891`.
- Classi scadenze: revisione `deadline-danger` entro 30 giorni a `src/pages/Mezzi.tsx:1668`; manutenzione `deadline-high/medium/low` entro 5/15/30 giorni a `src/pages/Mezzi.tsx:1674`.

### 1.12 Barriera
- Nessuna deroga business specifica trovata per route `/next/mezzi` + dataset `storage/@mezzi_aziendali`.
- Sono presenti deroghe correlate ma non equivalenti al writer Mezzi:
  - `IA_LIBRETTO_ALLOWED_STORAGE_KEYS = new Set(["@mezzi_aziendali"])` a `src/utils/cloneWriteBarrier.ts:96`.
  - `IA_LIBRETTO_ALLOWED_STORAGE_PATH_PREFIXES = ["mezzi_aziendali/"]` a `src/utils/cloneWriteBarrier.ts:97`.
  - `ARCHIVISTA_ALLOWED_STORAGE_KEYS` include `@mezzi_aziendali` a `src/utils/cloneWriteBarrier.ts:103`.
  - `ARCHIVISTA_ALLOWED_IMAGE_STORAGE_PATH_PREFIXES = ["mezzi/"]` a `src/utils/cloneWriteBarrier.ts:110`.
  - `MANUTENZIONI_ALLOWED_STORAGE_KEYS` include `@mezzi_foto_viste` e `@mezzi_hotspot_mapping`, non `@mezzi_aziendali`, a `src/utils/cloneWriteBarrier.ts:16`.

## 2. PARTE B — NEXT

### 2.1 Entrypoint
| Path | Evidenza | Stato |
| --- | --- | --- |
| `src/next/NextMezziPage.tsx` | export default a `src/next/NextMezziPage.tsx:177` | entrypoint NEXT attivo per `/next/mezzi` |
| `src/next/NextDossierListaPage.tsx` | export default a `src/next/NextDossierListaPage.tsx:30` | satellite dossier lista NEXT |
| `src/next/NextDossierMezzoPage.tsx` | export default a `src/next/NextDossierMezzoPage.tsx:139` | satellite dossier dettaglio NEXT |
| `src/next/NextMezziDossierPage.tsx` | file presente, ma non montato in `src/App.tsx`; route legacy redirecta a `NextMezziDossierLegacyRedirect` | satellite/orfano |

### 2.2 File satellite
| File | Ruolo |
| --- | --- |
| `src/next/nextAnagraficheFlottaDomain.ts` | reader principale `@mezzi_aziendali` + `@colleghi`, domain D01 |
| `src/next/nextFlottaCloneState.ts` | patch locali opzionali localStorage `@next_clone:flotta:patches` |
| `src/next/NextDossierListaPage.tsx` | lista dossier NEXT, legge il domain flotta |
| `src/next/NextDossierMezzoPage.tsx` | aggregatore dossier targa, PDF, documenti/costi |
| `src/next/domain/nextDossierMezzoDomain.ts` | composizione read-only dossier |
| `src/next/domain/nextManutenzioniDomain.ts` | usa `@manutenzioni` e `@mezzi_aziendali` per manutenzioni |
| `src/next/domain/nextDocumentiCostiDomain.ts` | usa `@costiMezzo` e documenti collegati |
| `src/next/components/NextScadenzeModal.tsx` | modal scadenze con azioni esplicitamente read-only |
| `src/next/NextMezziDossierPage.tsx` | copia legacy in `src/next`, non montata dalla route attiva |

### 2.3 Rotta
| URL | File routing | Elemento |
| --- | --- | --- |
| `/next/mezzi` | `src/App.tsx:427` | `<NextRoleGuard areaId="mezzi-dossier"><NextMezziPage /></NextRoleGuard>` |
| `/next/dossiermezzi` | `src/App.tsx:435` | `<NextDossierListaPage />` |
| `/next/dossiermezzi/:targa` | `src/App.tsx:443` | `<NextDossierMezzoPage />` |
| `/next/dossier/:targa` | `src/App.tsx:451` | `<NextDossierMezzoPage />` |
| `/next/dossier/:targa/gomme` | `src/App.tsx:459` | `<NextDossierGommePage />` |
| `/next/dossier/:targa/rifornimenti` | `src/App.tsx:467` | `<NextDossierRifornimentiPage />` |
| `/next/mezzi-dossier` | `src/App.tsx:475` | `<NextMezziDossierLegacyRedirect />`, redirect a `/next/mezzi` da `src/next/NextLegacyStructuralRedirects.tsx:14` |
| `/next/mezzi-dossier/:targa` | `src/App.tsx:483` | `<NextMezziDossierDetailLegacyRedirect />`, redirect a `/next/dossier/:targa` da `src/next/NextLegacyStructuralRedirects.tsx:27` |

### 2.4 Struttura UI
Ordine della UI attiva in `src/next/NextMezziPage.tsx`:
1. Wrapper pagina `.mezzi-page` e grid principale a `src/next/NextMezziPage.tsx:501`.
2. Card form con logo/titolo `Gestione Mezzi` a `src/next/NextMezziPage.tsx:506`.
3. Sezione `Foto mezzo` con preview, `Carica foto`, `Rimuovi foto`, input file a `src/next/NextMezziPage.tsx:525`.
4. Sezione `LIBRETTO (IA)` con input immagine, checkbox overwrite, bottone `Analizza Libretto con IA` a `src/next/NextMezziPage.tsx:574`.
5. Sezione `Dati generali` con gli stessi gruppi della madre a `src/next/NextMezziPage.tsx:623`.
6. Bottoni `Reset form` e `Salva mezzo` / `Salva modifiche` a `src/next/NextMezziPage.tsx:944`.
7. Card `Elenco mezzi` a `src/next/NextMezziPage.tsx:965`.
8. Accordion categorie e card mezzo con azioni `Modifica`, `Dossier Mezzo`, `Elimina` a `src/next/NextMezziPage.tsx:982`.

### 2.5 Campi anagrafica
| Etichetta UI | Campo codice NEXT | Tipo codice | Obbligatorio | File:riga |
| --- | --- | --- | --- | --- |
| id | `id` | `string` | ricostruito se assente | `src/next/nextAnagraficheFlottaDomain.ts:80`, `src/next/nextAnagraficheFlottaDomain.ts:516` |
| Categoria mezzo | `categoria` | `string` | no | `src/next/nextAnagraficheFlottaDomain.ts:83`, `src/next/NextMezziPage.tsx:628` |
| Tipo | `tipo` | `"motrice" \| "cisterna" \| null` | no, default UI motrice | `src/next/nextAnagraficheFlottaDomain.ts:84`, `src/next/NextMezziPage.tsx:658` |
| Autista | `autistaId`, `autistaNome` | `string \| null` | no | `src/next/nextAnagraficheFlottaDomain.ts:109`, `src/next/NextMezziPage.tsx:671` |
| Targa | `targa` | `string` | sì nel form, record senza targa esclusi dal reader | `src/next/nextAnagraficheFlottaDomain.ts:81`, `src/next/nextAnagraficheFlottaDomain.ts:455`, `src/next/NextMezziPage.tsx:413`, `src/next/NextMezziPage.tsx:694` |
| Marca | `marca` | `string` | sì nel form | `src/next/nextAnagraficheFlottaDomain.ts:85`, `src/next/NextMezziPage.tsx:417`, `src/next/NextMezziPage.tsx:707` |
| Modello | `modello` | `string` | sì nel form | `src/next/nextAnagraficheFlottaDomain.ts:86`, `src/next/NextMezziPage.tsx:421`, `src/next/NextMezziPage.tsx:716` |
| Telaio / VIN | `telaio` | `string` | no | `src/next/nextAnagraficheFlottaDomain.ts:88`, `src/next/NextMezziPage.tsx:728` |
| Colore | `colore` | `string` | no | `src/next/nextAnagraficheFlottaDomain.ts:89`, `src/next/NextMezziPage.tsx:737` |
| Cilindrata (cm³) | `cilindrata` | `string` | no; solo motrice | `src/next/nextAnagraficheFlottaDomain.ts:90`, `src/next/NextMezziPage.tsx:751` |
| Potenza (kW) | `potenza` | `string` | no; solo motrice | `src/next/nextAnagraficheFlottaDomain.ts:91`, `src/next/NextMezziPage.tsx:762` |
| Massa complessiva (kg) | `massaComplessiva` | `string` | no | `src/next/nextAnagraficheFlottaDomain.ts:92`, `src/next/NextMezziPage.tsx:776` |
| Proprietario | `proprietario` | `string` | no | `src/next/nextAnagraficheFlottaDomain.ts:93`, `src/next/NextMezziPage.tsx:790` |
| Assicurazione | `assicurazione` | `string` | no | `src/next/nextAnagraficheFlottaDomain.ts:94`, `src/next/NextMezziPage.tsx:801` |
| Data immatricolazione | `dataImmatricolazione` | `string` + timestamp | sì nel form | `src/next/nextAnagraficheFlottaDomain.ts:95`, `src/next/NextMezziPage.tsx:425`, `src/next/NextMezziPage.tsx:815` |
| Data ultimo collaudo | `dataUltimoCollaudo` | `string` + timestamp | no | `src/next/nextAnagraficheFlottaDomain.ts:99`, `src/next/NextMezziPage.tsx:825` |
| Prossimo collaudo | `dataScadenzaRevisione` | `string` + timestamp | no | `src/next/nextAnagraficheFlottaDomain.ts:97`, `src/next/NextMezziPage.tsx:856` |
| Manutenzione programmata | `manutenzioneProgrammata` | `boolean` | no | `src/next/nextAnagraficheFlottaDomain.ts:101`, `src/next/NextMezziPage.tsx:869` |
| Data inizio contratto | `manutenzioneDataInizio` | `string` + timestamp | no | `src/next/nextAnagraficheFlottaDomain.ts:102`, `src/next/NextMezziPage.tsx:888` |
| Data prossima scadenza | `manutenzioneDataFine` | `string` + timestamp | no | `src/next/nextAnagraficheFlottaDomain.ts:104`, `src/next/NextMezziPage.tsx:898` |
| Km massimi | `manutenzioneKmMax` | `string` | no | `src/next/nextAnagraficheFlottaDomain.ts:106`, `src/next/NextMezziPage.tsx:908` |
| Contratto / Note manutenzione | `manutenzioneContratto` | `string` | no | `src/next/nextAnagraficheFlottaDomain.ts:107`, `src/next/NextMezziPage.tsx:919` |
| Note generali | `note` | `string` | no | `src/next/nextAnagraficheFlottaDomain.ts:108`, `src/next/NextMezziPage.tsx:934` |
| Foto mezzo | `fotoUrl`, `fotoPath`, `fotoStoragePath` | `string \| null` | no | `src/next/nextAnagraficheFlottaDomain.ts:111`, `src/next/nextAnagraficheFlottaDomain.ts:112`, `src/next/nextAnagraficheFlottaDomain.ts:113`, `src/next/NextMezziPage.tsx:525` |
| Libretto | `librettoUrl`, `librettoStoragePath` | `string \| null` | no | `src/next/nextAnagraficheFlottaDomain.ts:114`, `src/next/nextAnagraficheFlottaDomain.ts:115` |

### 2.6 Firestore
- Reader NEXT principale: `readNextAnagraficheFlottaSnapshot` in `src/next/nextAnagraficheFlottaDomain.ts:763`.
- Dataset letto: `STORAGE_COLLECTION = "storage"` e `MEZZI_DATASET_KEY = "@mezzi_aziendali"` a `src/next/nextAnagraficheFlottaDomain.ts:5`.
- Lettura Firestore: `getDoc(doc(db, STORAGE_COLLECTION, MEZZI_DATASET_KEY))` a `src/next/nextAnagraficheFlottaDomain.ts:767`.
- Shape supportate dal reader: `items`, `value.items`, `value`, `array`, `missing`, `unsupported` a `src/next/nextAnagraficheFlottaDomain.ts:34`.
- NEXT non scrive `storage/@mezzi_aziendali` dalla route attiva `/next/mezzi`; `handleSave` imposta solo errore read-only a `src/next/NextMezziPage.tsx:430`.

### 2.7 Pulsanti e azioni
| Etichetta | Handler | Tipo | Writer usato | File:riga |
| --- | --- | --- | --- | --- |
| Logo Ghielmi Cementi | `navigate("/next")` | nav | nessuno | `src/next/NextMezziPage.tsx:512` |
| Carica foto | `handleOpenFotoPicker` | UI preview | nessuno | `src/next/NextMezziPage.tsx:545`, `src/next/NextMezziPage.tsx:375` |
| Rimuovi foto | inline `setFotoPreview(null)` | UI form | nessuno | `src/next/NextMezziPage.tsx:552` |
| Analizza Libretto con IA | `handleAnalyzeLibrettoWithIA` | bloccato read-only | nessuno | `src/next/NextMezziPage.tsx:607`, `src/next/NextMezziPage.tsx:400` |
| Reset form | `resetForm` | UI | nessuno | `src/next/NextMezziPage.tsx:945`, `src/next/NextMezziPage.tsx:248` |
| Salva mezzo / Salva modifiche | `handleSave` | bloccato read-only | nessuno | `src/next/NextMezziPage.tsx:952`, `src/next/NextMezziPage.tsx:410` |
| Header categoria accordion | inline `setCategoriaEspansa` | UI | nessuno | `src/next/NextMezziPage.tsx:993` |
| Modifica | `loadMezzoInForm(item)` | UI edit form | nessuno | `src/next/NextMezziPage.tsx:1122` |
| Dossier Mezzo | `navigate(buildNextDossierPath(item.targa))` | nav | nessuno | `src/next/NextMezziPage.tsx:1129` |
| Elimina | `handleDelete(item.id)` | bloccato read-only | nessuno | `src/next/NextMezziPage.tsx:1140`, `src/next/NextMezziPage.tsx:437` |

### 2.8 Writer
- Nessun file `nextMezziWriter.ts` o funzioni `saveNextMezzo` / `deleteNextMezzo` / `createNextMezzo` trovati in `src/next`.
- `NextMezziPage.tsx` non importa `firestoreWriteOps` o `storageWriteOps`; usa solo il reader domain.
- `handleSave` valida targa/marca/modello/data immatricolazione, poi chiama `setError(buildReadOnlyMessage(...))` a `src/next/NextMezziPage.tsx:430`.
- `handleDelete` mostra conferma ma poi chiama solo `setError(buildReadOnlyMessage("eliminazione mezzo"))` a `src/next/NextMezziPage.tsx:448`.
- File non montato `src/next/NextMezziDossierPage.tsx` contiene codice legacy con `uploadString` a `src/next/NextMezziDossierPage.tsx:407` e `setItemSync` a `src/next/NextMezziDossierPage.tsx:511`, ma non è il runtime della route `/next/mezzi`.

### 2.9 Upload file
- Route attiva NEXT: input foto `accept="image/*"` e `capture="environment"` a `src/next/NextMezziPage.tsx:564`.
- Route attiva NEXT: `handleFotoChange` legge solo DataURL locale con `readFileAsDataUrl` a `src/next/NextMezziPage.tsx:358`; non carica su Firebase Storage.
- Route attiva NEXT: nessun `uploadBytes`, `uploadString`, `deleteObject`, `storageWriteOps` trovato in `src/next/NextMezziPage.tsx`.
- Libretto IA: input `accept="image/*"` a `src/next/NextMezziPage.tsx:585`, ma `handleAnalyzeLibrettoWithIA` imposta messaggio read-only a `src/next/NextMezziPage.tsx:406`.

### 2.10 Collegamenti cross-modulo
| Modulo/dataset | Direzione | Collection/dataset | File:riga |
| --- | --- | --- | --- |
| Flotta mezzi | R | `storage/@mezzi_aziendali` | `src/next/nextAnagraficheFlottaDomain.ts:5`, `src/next/nextAnagraficheFlottaDomain.ts:767` |
| Colleghi/autisti | R | `storage/@colleghi` | `src/next/nextAnagraficheFlottaDomain.ts:7`, `src/next/nextAnagraficheFlottaDomain.ts:769` |
| Dossier lista | nav/R | `/next/dossiermezzi/:targa` | `src/next/NextDossierListaPage.tsx:126` |
| Dossier dettaglio | R | `nextDossierMezzoDomain` | `src/next/NextDossierMezzoPage.tsx:17`, `src/next/NextDossierMezzoPage.tsx:175` |
| Lavori | R | `@lavori` | `src/next/domain/nextDossierMezzoDomain.ts:625` |
| Materiali/movimenti | R | `@materialiconsegnati` | `src/next/domain/nextDossierMezzoDomain.ts:626` |
| Manutenzioni/gomme | R | `@manutenzioni` + `@mezzi_aziendali` | `src/next/domain/nextDossierMezzoDomain.ts:627` |
| Rifornimenti | R | `@rifornimenti` e feed campo | `src/next/domain/nextDossierMezzoDomain.ts:628` |
| Documenti/costi | R | `@costiMezzo` + documentali | `src/next/domain/nextDossierMezzoDomain.ts:629` |
| Analisi economica | R | `@analisi_economica_mezzi` | `src/next/domain/nextDossierMezzoDomain.ts:631` |

### 2.11 Computed/derivati
- Domain D01 normalizza categoria, tipo, targa, date e qualità record in `src/next/nextAnagraficheFlottaDomain.ts:448`.
- `id` è ricostruito da `buildFallbackId` se manca nel raw a `src/next/nextAnagraficheFlottaDomain.ts:516`.
- `marcaModello` è derivato da `marca` + `modello` se manca a `src/next/nextAnagraficheFlottaDomain.ts:467`.
- `calculaProssimaRevisione` è presente in NEXT a `src/next/NextMezziPage.tsx:110`.
- Auto-compilazione `Prossimo collaudo` da ultimo collaudo è presente a `src/next/NextMezziPage.tsx:829`.
- Classi revisione e manutenzione sono calcolate nella lista a `src/next/NextMezziPage.tsx:1047`.
- Il domain aggiunge timestamp e flags (`dataImmatricolazioneTimestamp`, `flags`, `quality`) che non sono campi UI madre; vedi type a `src/next/nextAnagraficheFlottaDomain.ts:79`.

### 2.12 Barriera
- Nessuna deroga esplicita per route `/next/mezzi` + doc path `storage/@mezzi_aziendali` trovata in `src/utils/cloneWriteBarrier.ts`.
- Deroghe presenti ma non applicabili come writer Mezzi principale:
  - `IA_LIBRETTO_ALLOWED_STORAGE_KEYS` su `@mezzi_aziendali` a `src/utils/cloneWriteBarrier.ts:96`.
  - `ARCHIVISTA_ALLOWED_STORAGE_KEYS` include `@mezzi_aziendali` a `src/utils/cloneWriteBarrier.ts:103`.
  - `ARCHIVISTA_ALLOWED_IMAGE_STORAGE_PATH_PREFIXES = ["mezzi/"]` a `src/utils/cloneWriteBarrier.ts:110`.
- Nessun ramo `isAllowed...Mezzi...CloneWritePath` trovato per `/next/mezzi`.

### 2.13 Pulsanti disabled senza handler
- `src/next/NextMezziPage.tsx` contiene un solo `disabled`: bottone `Analizza Libretto con IA` con condizione `disabled={!iaLibrettoFile || iaLoading}` e handler `handleAnalyzeLibrettoWithIA` a `src/next/NextMezziPage.tsx:607`. Non è un disabled senza handler.
- `src/next/NextMezziDossierPage.tsx` contiene molti `disabled` statici con `title="Clone read-only"` e fieldset disabled a `src/next/NextMezziDossierPage.tsx:856`, ma quel file non risulta montato dalle route in `src/App.tsx`.

### 2.14 Alert/banner read-only
- Route attiva `/next/mezzi`: `buildReadOnlyMessage` produce `Clone NEXT in sola lettura: ... bloccato.` a `src/next/NextMezziPage.tsx:173`.
- `handleAnalyzeLibrettoWithIA` mostra read-only a `src/next/NextMezziPage.tsx:407`.
- `handleSave` mostra read-only a `src/next/NextMezziPage.tsx:430`.
- `handleDelete` mostra read-only a `src/next/NextMezziPage.tsx:448`.
- `src/next/components/NextScadenzeModal.tsx` contiene alert read-only per prenotazione collaudo, pre-collaudo, revisione fatta e cancellazione prenotazione a `src/next/components/NextScadenzeModal.tsx:304`.

### 2.15 Writer dedicati NEXT
- Non trovato un writer dedicato `nextMezziWriter.ts`.
- Non trovate funzioni `saveNextMezzo`, `deleteNextMezzo`, `createNextMezzo`, `writeNextMezzo` in `src/next`.
- I wrapper esistono genericamente: `firestoreWriteOps.setDoc` a `src/utils/firestoreWriteOps.ts:29`, `storageWriteOps.uploadBytes` a `src/utils/storageWriteOps.ts:20`, `storageWriteOps.uploadString` a `src/utils/storageWriteOps.ts:30`, `storageWriteOps.deleteObject` a `src/utils/storageWriteOps.ts:52`; non sono usati da `NextMezziPage.tsx`.

## 3. DIFF

### 3.1 Confronto sezione-per-sezione (tabella)
| Sezione | Madre | NEXT |
| --- | --- | --- |
| Route principale | `/mezzi` monta `Mezzi` (`src/App.tsx:728`) | `/next/mezzi` monta `NextMezziPage` (`src/App.tsx:427`) |
| Lettura flotta | `getItemSync("@mezzi_aziendali")` (`src/pages/Mezzi.tsx:321`) | `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })` (`src/next/NextMezziPage.tsx:230`) |
| Form anagrafica | completo e scrivente | completo ma save bloccato read-only |
| Campi obbligatori | targa, marca, modello, data immatricolazione | stessi controlli prima del blocco read-only |
| Foto mezzo | upload `firebase/storage` su path `mezzi/...jpg` | solo preview DataURL locale, nessun upload |
| Libretto IA | `fetch(IA_LIBRETTO_URL)` compila form | bottone presente, handler read-only |
| Salva | append/map array e `setItemSync` | nessuna persistenza, `setError` read-only |
| Elimina | conferma + filter array + `setItemSync` con `allowRemovals` | conferma + `setError` read-only |
| Lista mezzi | accordion categoria + card | accordion categoria + card |
| Dossier | naviga `/dossiermezzi/:targa` | naviga `/next/dossier/:targa` tramite `buildNextDossierPath` |
| Dossier dettaglio | legge direttamente molte collection | domain aggregatore NEXT read-only |
| Barriera | non rilevante in runtime madre | nessuna deroga business `/next/mezzi` |
| Writer NEXT | non applicabile | non trovato |

### 3.2 Gap funzionali NEXT vs madre
| # | Severità | Gap | Evidenza madre | Evidenza NEXT |
| --- | --- | --- | --- | --- |
| 1 | bloccante | Create/update mezzo non persistono in NEXT | `setItemSync(MEZZI_KEY, currentMezzi)` a `src/pages/Mezzi.tsx:787` | `setError(buildReadOnlyMessage(...))` a `src/next/NextMezziPage.tsx:430` |
| 2 | bloccante | Delete mezzo non persiste in NEXT | `setItemSync(MEZZI_KEY, updated, { allowRemovals: true })` a `src/pages/Mezzi.tsx:808` | `setError(buildReadOnlyMessage("eliminazione mezzo"))` a `src/next/NextMezziPage.tsx:448` |
| 3 | bloccante | Upload foto mezzo non persiste in NEXT | `uploadString` e `getDownloadURL` a `src/pages/Mezzi.tsx:683` | `handleFotoChange` fa solo `setFotoPreview(result)` a `src/next/NextMezziPage.tsx:362` |
| 4 | bloccante | Analisi libretto IA non esegue fetch in NEXT | `fetch(IA_LIBRETTO_URL)` a `src/pages/Mezzi.tsx:540` | `setIaError(buildReadOnlyMessage("analisi libretto"))` a `src/next/NextMezziPage.tsx:407` |
| 5 | bloccante | Nessun writer dedicato NEXT per `storage/@mezzi_aziendali` | madre scrive via storageSync | nessun `nextMezziWriter.ts` o funzione writer trovata in `src/next` |
| 6 | bloccante | Nessuna deroga barriera per `/next/mezzi` + `storage/@mezzi_aziendali` | non applicabile alla madre | nessun ramo Mezzi in `src/utils/cloneWriteBarrier.ts`; deroghe trovate solo per IA/Archivista |
| 7 | medio | NEXT attiva mostra alert read-only su azioni principali | madre non blocca save/delete | read-only message a `src/next/NextMezziPage.tsx:173` |
| 8 | medio | Il file `NextMezziDossierPage.tsx` contiene codice scrivente legacy ma non è runtime attivo | non applicabile | `setItemSync` a `src/next/NextMezziDossierPage.tsx:511`; route legacy redirecta altrove a `src/next/NextLegacyStructuralRedirects.tsx:14` |
| 9 | minore | NEXT domain espone campi tecnici aggiuntivi non presenti nella madre UI | type madre `Mezzo` a `src/pages/Mezzi.tsx:26` | `quality`, `flags`, `datasetShape`, `sourceKey`, timestamp a `src/next/nextAnagraficheFlottaDomain.ts:116` |

### 3.3 Conflitti rilevati
| # | Conflitto | Evidenza |
| --- | --- | --- |
| 1 | In `src/next` coesistono la pagina attiva `NextMezziPage.tsx` read-only e il file `NextMezziDossierPage.tsx` con codice scrivente legacy non montato. | Route attiva `/next/mezzi` monta `NextMezziPage` a `src/App.tsx:427`; `NextMezziDossierPage.tsx` contiene `setItemSync` a `src/next/NextMezziDossierPage.tsx:511`; `/next/mezzi-dossier` redirecta a `/next/mezzi` da `src/next/NextLegacyStructuralRedirects.tsx:14`. |

## 4. NOTE FINALI (solo fatti di codice, niente opinioni)
- Il file CSS madre `src/pages/Mezzi.css` è riusato dalla NEXT attiva tramite import a `src/next/NextMezziPage.tsx:17`.
- La NEXT attiva importa il reader `readNextAnagraficheFlottaSnapshot` da `src/next/nextAnagraficheFlottaDomain.ts` a `src/next/NextMezziPage.tsx:10`.
- Il domain D01 dichiara `activeReadOnlyDataset: "@mezzi_aziendali"` a `src/next/nextAnagraficheFlottaDomain.ts:50`.
- La route NEXT usa `NextRoleGuard areaId="mezzi-dossier"` a `src/App.tsx:429`; la madre non usa guard in `src/App.tsx:728`.
- `src/next/NextDossierMezzoPage.tsx` contiene una scrittura ammessa per cancellazione documenti/costi tramite `deleteNextDocumentoCosto` importata a `src/next/NextDossierMezzoPage.tsx:23`; questa non è un writer anagrafica Mezzi.
- `src/utils/firestoreWriteOps.ts` e `src/utils/storageWriteOps.ts` espongono wrapper con barriera, ma l’entrypoint NEXT Mezzi non li usa.
- `src/next/NextMezziPage.tsx` è presente ma non chiude la parity scrivente della madre: create/update/delete/foto/IA restano bloccati a livello UI.
