# AUDIT — Flusso e ciclo di vita (segnalazioni · controlli · manutenzioni)

**Data:** 2026-06-05 · **Progetto:** `c:\progetti\gestioneweb` · **Modalità:** sola lettura
**Dati reali letti da Firestore** (collection `storage`, sola lettura, service account admin):
46 segnalazioni · 84 manutenzioni · 398 controlli.

> Ogni affermazione è ancorata a `file:riga`/simbolo o a **id record reali**. Dove una cosa non esiste è scritto **NON TROVATO**.

---

# PARTE 5 — SINTESI PER GIUSEPPE

## 1. Il flusso come DOVREBBE funzionare (in parole tue)

Un autista segnala un problema su un camion (es. "motore in protezione"): nasce una **segnalazione "nuova"**.
Tu la guardi e scegli una via: **mandarla in officina** creando un lavoro "Da fare", **agganciarla** a un lavoro già aperto su quella targa, oppure **metterla in un gruppo** con altre segnalazioni dello stesso camion per farne un unico lavoro.
Da quel momento la segnalazione è **"presa in carico"** e "punta" al suo lavoro.
Quando l'officina ha finito, segni il lavoro **"Eseguito"**: il sistema **chiude da solo** anche le segnalazioni collegate.
Tutto finisce nell'**Archivio Storico**, dove vedi chi aveva segnalato, quando, e come è stato risolto.
Se ti sei sbagliato, **"Riapri"** riporta indietro la segnalazione.

## 2. Dove il sistema OGGI confonde (in ordine di impatto)

1. **Lavori fantasma — 17 segnalazioni su 46 (37%).** Quando elimini una manutenzione, le segnalazioni collegate restano "prese in carico" ma puntano a un lavoro che non esiste più. *Perché: l'eliminazione non ripulisce il collegamento sulle segnalazioni.*
2. **"Lavoro" e "manutenzione" sono la stessa cosa con due nomi.** Il bottone "Crea lavoro (Da fare)" crea in realtà una *manutenzione*; il campo di legame si chiama `linkedLavoroId`. *Perché: termini diversi per lo stesso oggetto.*
3. **Chi ha segnalato sparisce secondo dove guardi.** Un lavoro nato da un gruppo mostra autore generico "Autisti" nel dettaglio, ma i nomi veri (es. ELTON SELIMI) appaiono solo nel riquadro "Origine". *Perché: il dettaglio legge l'autore dal lavoro, non dalle segnalazioni vere.*
4. **Tre modi diversi per la stessa cosa** (mandare una segnalazione in lavorazione): "Crea manutenzione", "Aggancia a manutenzione esistente", "Crea lavoro dal gruppo". *Perché: funzioni accumulate in cantieri diversi.*
5. **Quattro parole per "è finito": "Eseguita", "Chiusa", "Risolta", "Chiusa da evento".** Stesso fatto, parole diverse tra Da fare, Archivio, dettaglio e frase storia. *Perché: vocabolario non unificato.*
6. **Una segnalazione può essere "in un gruppo da fare" E già collegata a un lavoro** (2 casi reali). Non si capisce se è ancora da lavorare o già gestita. *Perché: gruppi e collegamenti sono due sistemi separati che non si parlano.*
7. **2 lavori risultano "eseguiti" ma la loro segnalazione è ancora "aperta".** La chiusura automatica non è arrivata in fondo. *Perché: propagazione della chiusura fallita e mai riprovata.*
8. **"Presa in carico" non si può fare a mano.** Il comando esiste nel codice ma **non c'è nessun pulsante**: lo stato arriva solo come effetto collaterale di creare/agganciare un lavoro. *Perché: flusso iniziato e mai finito.*
9. **13 segnalazioni hanno i due "interruttori" di chiusura disallineati** (vecchio segno `chiusa` e nuovo `stato`): 11 innocue, **2 davvero contraddittorie** (segnate chiuse ma con stato "nuova"/"presa in carico"). *Perché: due meccanismi di chiusura sovrapposti negli anni.*
10. **Stati con nomi sovrapposti: "Da fare", "Operative", "aperta", "nuova".** "Operative" = da fare + programmate; "aperta" (da Riapri) e "nuova" (da sgancio) vogliono dire la stessa cosa. *Perché: naming storico stratificato.*

## 3. Proposte (una riga di direzione — la decisione è tua)

1. All'eliminazione di un lavoro, **ripulire o avvisare** i collegamenti delle segnalazioni (oppure bloccare l'eliminazione se ha origini).
2. Scegliere **UNA parola** — "lavoro" *o* "manutenzione" — e usarla ovunque (campo, bottoni, titoli).
3. Nel dettaglio, **leggere l'autore reale dalle origini** (come fa già il riquadro Origine), non il generico "Autisti".
4. **Unificare i tre gesti** in uno solo con due opzioni: "nuovo lavoro" / "aggancia a esistente".
5. Scegliere **UNA parola per "finito"** (es. sempre "Eseguito") su tutte le superfici.
6. Decidere se **"in gruppo" e "collegato" sono incompatibili** e impedirne la coesistenza.
7. Mostrare un **avviso sui lavori eseguiti con sorgente ancora aperta** + azione "richiudi".
8. O **aggiungere il pulsante "Prendi in carico"**, o togliere lo stato se non serve.
9. **Allineare i due interruttori di chiusura** su uno solo e sanare i 2 record contraddittori.
10. **Ridurre i nomi di stato** a un set unico (es. "Nuova / In lavorazione / Eseguita").

---
---

# PARTE 1 — Ciclo di vita della SEGNALAZIONE

Dato fisico: `@segnalazioni_autisti_tmp`. Proiezione/reader: `normalizeSegnalazioneSectionItem`
[src/next/domain/nextAutistiDomain.ts:566-648](src/next/domain/nextAutistiDomain.ts#L566-L648).

### Campi di stato reali (combinabili)
- `stato`: `"nuova"` | `"presa_in_carico"` | `"chiusa"` | `"aperta"` (riaperta)
- `letta` (bool) → `isNuova = letta===false || stato==="nuova"`
- `chiusa` (bool, legacy) · `chiusa_by` · `chiusuraDi` · `chiusuraRefId` · `chiusuraData` (num) · `dataChiusura` (num, legacy)
  - **derivato** `chiusa = (chiusa===true) || stato==="chiusa" || typeof chiusuraData==="number" || Boolean(chiusuraRefId)` ([nextAutistiDomain.ts:599-603](src/next/domain/nextAutistiDomain.ts#L599-L603))
- `linkedLavoroId` / `linkedLavoroIds[]` / `linkedMultiple` → `hasLinkedLavoro` ([nextAutistiDomain.ts:617-637](src/next/domain/nextAutistiDomain.ts#L617-L637))
- `gruppoSegnalazioneId` (campo gruppo) · `dataPresaInCarico`

### Stati possibili (combinazioni reali)
| Stato logico | Come è fatto nel dato |
|---|---|
| **Nuova** | `stato="nuova"`/`letta=false`, niente link, niente gruppo, non chiusa |
| **In gruppo** | come Nuova + `gruppoSegnalazioneId` valorizzato (il writer richiede: non chiusa, non già collegata, stessa targa) |
| **Presa in carico** | `stato="presa_in_carico"` + `linkedLavoroId(s)` (scritti **insieme** da `patchSegnalazione`) |
| **Presa in carico con LEGAME ROTTO** | come sopra ma il `linkedLavoroId` punta a una manutenzione **inesistente** → **17 reali** |
| **In gruppo E collegata** | `gruppoSegnalazioneId` **e** `linkedLavoroId` insieme → **2 reali** |
| **Chiusa da evento/manutenzione** | `stato="chiusa"` + `chiusuraDi="manutenzione"`/`"gomme_evento"` + `chiusuraRefId` + `chiusuraData` (il bool `chiusa` spesso resta non aggiornato) |
| **Chiusa manuale/legacy** | `chiusa===true` e/o `dataChiusura` |
| **Aperta (riaperta)** | `stato="aperta"`, link rimosso, traccia chiusura azzerata |

### Transizioni (da → gesto/superficie → a → writer → dove si vede)
| Da | Gesto (superficie) | Writer (file:riga) | A | Dove si vede |
|---|---|---|---|---|
| nuova | **Crea manutenzione da segnalazione** (Autisti Inbox / modale) | `createManutenzioneDaFareFromSegnalazione` [nextManutenzioneDaFareCreateWriter.ts:270](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L270) | presa_in_carico + `linkedLavoroId`; **nuova manutenzione daFare** (`origineTipo="segnalazione"`) | Da fare (manutenzione); Archivio segn. → "Manutenzione generata" |
| nuova | **Aggancia a manutenzione esistente** (singola: [ArchivioRowExpanded.tsx:519-527](src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx#L519-L527); batch: [ArchivioFeed.tsx:626-650](src/next/centroControllo/archivioStorico/ArchivioFeed.tsx#L626-L650)) | `agganciaSegnalazioneAManutenzioneEsistente(Batch)` | presa_in_carico + `linkedLavoroId`=target; manutenzione `origineRefs +=` segnalazione | idem |
| nuova ×N | **Crea gruppo** (Da fare, checkbox + azione) | `creaGruppoSegnalazioni` [gruppoSegnalazioniWriter.ts:150](src/next/writers/gruppoSegnalazioniWriter.ts#L150) | + `gruppoSegnalazioneId` | Da fare → "Gruppo … da fare su TARGA" |
| in gruppo | **Crea lavoro (Da fare)** (Da fare, blocco gruppo) | `handleCreaLavoroDaGruppo` [NextManutenzioniPage.tsx:3444](src/next/NextManutenzioniPage.tsx#L3444) → `saveNextManutenzioneBusinessRecord` + aggancio batch | tutte → presa_in_carico + `linkedLavoroId`(nuovo lavoro); **manutenzione daFare** con `origineTipo="manuale"`, `segnalatoDa="Autisti"` | Da fare; dettaglio (selezionato) |
| in gruppo | **Rimuovi dal gruppo** (Da fare ⋮) | `rimuoviDaGruppo` [gruppoSegnalazioniWriter.ts:215](src/next/writers/gruppoSegnalazioniWriter.ts#L215) | `gruppoSegnalazioneId=null` | Da fare |
| presa_in_carico | la manutenzione collegata diventa **Eseguita** (dettaglio/Da fare) | `saveNextManutenzioneBusinessRecord` (stato=eseguita) → `propagateChiusuraToLegame` [closureOrchestrator.ts:67](src/next/helpers/closureOrchestrator.ts#L67) → `chiudiSegnalazioneDaEvento` [nextChiusuraEventoWriter.ts:271](src/next/writers/nextChiusuraEventoWriter.ts#L271) | **chiusa** (`stato="chiusa"`, `chiusuraDi="manutenzione"`, `chiusuraRefId`, `chiusuraData`) | Archivio → "Chiusa"; frase storia "…eseguita il …" |
| chiusa | **Riapri** ([ArchivioRowExpanded.tsx](src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx); riquadro Origine ⋮ [NextManutenzioniPage.tsx:5275](src/next/NextManutenzioniPage.tsx#L5275)) | `riapriESganciaSegnalazione` [nextChiusuraEventoWriter.ts:325](src/next/writers/nextChiusuraEventoWriter.ts#L325) | **aperta**, link rimosso, chiusura azzerata; toglie `origineRefs` da manutenzioni collegate | feed aggiornato |
| presa_in_carico (legame valido) | **Sgancia legame** ([ArchivioRowExpanded.tsx:btn-sgancia-legame](src/next/centroControllo/archivioStorico/rows/ArchivioRowExpanded.tsx)) | `sganciaLegameManutenzione` [sganciaLegameOrfanoWriter.ts:132](src/next/writers/sganciaLegameOrfanoWriter.ts#L132) | **nuova** (o presa_in_carico se restano altri legami); manutenzione `origineRef` rimossa | |
| presa_in_carico (legame ROTTO) | **Sgancia link orfano** / **Sostituisci** (ArchivioRowExpanded, stato `legame-orfano`) | `sganciaLegameManutenzione` | nuova | badge "Link rotto" |
| — | **"Prendi in carico"** | `segnaPresaInCaricoSegnalazione` [presaInCaricoSegnalazioneWriter.ts:82](src/next/writers/presaInCaricoSegnalazioneWriter.ts#L82) | presa_in_carico + `dataPresaInCarico` | **NON TROVATO alcun pulsante UI** che lo invochi (solo test) |

---

# PARTE 2 — Ciclo di vita della MANUTENZIONE

Dato fisico: `@manutenzioni`. Reader doppio: `toLegacyDatasetRecord` (lista) e `toHistoryItem` (mappa)
[nextManutenzioniDomain.ts:618](src/next/domain/nextManutenzioniDomain.ts#L618) / [:733](src/next/domain/nextManutenzioniDomain.ts#L733).

### Campi di stato reali
- `stato`: `"daFare"` | `"programmata"` | `"eseguita"` | `"chiusa_da_evento"` | **assente** (legacy → 34 record reali)
- `origineTipo`/`origineRefId`/`origineRefKey` + `origineRefs[]` (multi-sorgente) — back-link verso segnalazione/controllo
- `gruppoManutenzioneId` (campo gruppo) · `segnalatoDa` · `chiusuraDi`/`chiusuraRefId`/`chiusuraData` · `fornitore` · `eseguito`/`dataEsecuzione`/`importo`/`materiali`

### Stati possibili
| Stato | Dato |
|---|---|
| **Da fare** | `stato="daFare"` (con/senza `origineRefs`, con/senza `gruppoManutenzioneId`) |
| **Programmata** | `stato="programmata"` |
| **Eseguita** | `stato="eseguita"` (officina/manuale) |
| **Chiusa da evento** | `stato="chiusa_da_evento"` + `chiusuraDi`/`chiusuraRefId`/`chiusuraData` (es. `gomme_evento`) |
| **Legacy senza stato** | nessun `stato` (34 reali) → trattata come storico/eseguita |
| **In gruppo** | + `gruppoManutenzioneId` (writer richiede `stato="daFare"`, id reale, stessa targa, ≥2) |

### Transizioni
| Da | Gesto (superficie) | Writer | A | Note/propagazione |
|---|---|---|---|---|
| — | **Nuova manutenzione** (form, Da fare → "Nuova/Modifica") | `saveNextManutenzioneBusinessRecord` [nextManutenzioniDomain.ts:1277](src/next/domain/nextManutenzioniDomain.ts#L1277) | daFare/programmata/eseguita | — |
| — | **Crea da segnalazione/controllo** (Autisti) | `createManutenzioneDaFareFrom*` [nextManutenzioneDaFareCreateWriter.ts:227-391](src/next/writers/nextManutenzioneDaFareCreateWriter.ts#L227-L391) | daFare + `origineRefs` | patcha la sorgente (linkedLavoro) |
| — | **Crea lavoro dal gruppo** (Da fare) | `handleCreaLavoroDaGruppo` [NextManutenzioniPage.tsx:3444](src/next/NextManutenzioniPage.tsx#L3444) | daFare `origineTipo="manuale"` + aggancio batch sorgenti | **autore reale perso** sul record (vedi 4.5) |
| daFare ×N | **Crea/Aggiungi gruppo manutenzioni** (Da fare, checkbox) | `creaGruppoManutenzioni`/`aggiungiAGruppoManutenzioni` [gruppoManutenzioniWriter.ts:193/221](src/next/writers/gruppoManutenzioniWriter.ts#L193) | + `gruppoManutenzioneId` | ⚠️ questo writer **non apre `runWithCloneWriteScopedAllowance`** (diverso dagli altri) [gruppoManutenzioniWriter.ts:181-191](src/next/writers/gruppoManutenzioniWriter.ts#L181-L191) |
| daFare/programmata | **Eseguita** (dettaglio/Da fare "Eseguita") | `saveNextManutenzioneBusinessRecord` (stato=eseguita) | eseguita | → `propagateChiusuraToLegame` chiude le origini |
| daFare | **Modifica** (form) | `saveNextManutenzioneBusinessRecord` (editingSourceId) | invariato/aggiornato | "ultimo vince", nessun lock |
| qualsiasi | **Elimina** (dettaglio "Elimina") | `deleteNextManutenzioneBusinessRecord` [nextManutenzioniDomain.ts:1361](src/next/domain/nextManutenzioniDomain.ts#L1361) | rimossa da `@manutenzioni` | ⚠️ **NON ripulisce** `linkedLavoroId` sulle segnalazioni → genera i **17 legami rotti** |
| chiusa_da_evento (gomme) | **Sgancia evento** (dettaglio, solo gomme) | `sganciaManutenzioneDaEvento` [nextChiusuraEventoWriter.ts:303](src/next/writers/nextChiusuraEventoWriter.ts#L303) | daFare | |

---

# PARTE 3 — Le superfici e cosa mostrano

| Superficie | File | Mostra | Stati |
|---|---|---|---|
| **Manutenzioni → Da fare** | `renderDaFare` [NextManutenzioniPage.tsx:2979](src/next/NextManutenzioniPage.tsx#L2979) | manutenzioni operative (daFare+programmata), blocco **"Gruppo manutenzioni N da fare su TARGA"**, sezione espandibile **"Segnalazioni aperte (N)"** [:4010](src/next/NextManutenzioniPage.tsx#L4010), checkbox selezione, azioni gruppo + **"Crea lavoro (Da fare)"** [:3803](src/next/NextManutenzioniPage.tsx#L3803) | solo manutenzioni daFare/programmata + segnalazioni eleggibili |
| **Mappa/Storico — Dettaglio v2** | `NextMappaStoricoPage` (embedded) [src/next/NextMappaStoricoPage.tsx](src/next/NextMappaStoricoPage.tsx) | lista storico (badge stato ESEGUITA/DA FARE), dettaglio (campi valorizzati, frase storia) + **riquadro "Origine manutenzione"** con dati inline [NextManutenzioniPage.tsx:5211](src/next/NextManutenzioniPage.tsx#L5211) | tutte |
| **Archivio Storico** | `ArchivioFeed` + `ArchivioSubTabs` | **3 sub-tab**: Manutenzioni · Segnalazioni · Richieste ([ArchivioSubTabs.tsx:26-30](src/next/centroControllo/archivioStorico/ArchivioSubTabs.tsx#L26-L30)) — **NON 4** (Controlli NON è un sub-tab) | per kind |
| **Centro Controllo / Sinottica** | `NextCentroControlloParityPage` | conteggi daFare ([:986](src/next/NextCentroControlloParityPage.tsx#L986)) + storico — copie in stato React, live al refresh | conteggi |
| **Dossier mezzo** | `nextDossierMezzoDomain` [:794](src/next/domain/nextDossierMezzoDomain.ts#L794) | storico interventi per targa, "N da fare/programmate" | per targa |
| **Frase storia** | `buildFraseStoria` [frasestoriaRecord.ts:84](src/next/helpers/frasestoriaRecord.ts#L84) | "Segnalazione di X del …, presa in carico …, eseguita … Risolta dall'intervento officina …" | derivata |

### Stesso oggetto, superfici diverse, info/nomi diversi
- **Segnalazione presa_in_carico con legame rotto**: Archivio segn. → "Manutenzione generata" + id (fantasma); dettaglio espanso → badge **"Link rotto"**. *Stesso record, due racconti opposti.*
- **Lavoro creato da gruppo**: riquadro **Origine** mostra autori reali (ELTON SELIMI); **frase storia del dettaglio** dice autore generico (vedi 4.5). 
- **Evento di chiusura**: Da fare/dettaglio → "Eseguita"; Archivio segn. → "Chiusa"; manutenzione gomme → "Chiusa da evento"; frase storia → "Risolta dall'intervento officina …".

---

# PARTE 4 — Incoerenze e punti di confusione

## 4.1 Terminologia incoerente
| Concetto unico | Nomi usati |
|---|---|
| manutenzione | "lavoro" (bottone "Crea lavoro"), "manutenzione" (titoli/Da fare), `linkedLavoroId` (campo) |
| chi ha segnalato | `segnalatoDa`, "Segnalazione di X" (frase storia), `autistaNome`, "Autista", "Aperto da" |
| è finito | "Eseguita", "Chiusa", "Chiusa da evento", "Risolta" |
| da lavorare | "Da fare", "Operative" (=daFare+programmata), "aperta", "nuova" |

## 4.2 Stati ambigui nel DATO REALE (con id) — query Firestore 2026-06-05
Distribuzione: segnalazioni `{presa_in_carico:28, nuova:7, chiusa:11}` · manutenzioni `{eseguita:42, daFare:8, (senza stato):34}` · in gruppo: 2 segn / 4 manut · manutenzioni con origineRefs: 22.

- **17 segnalazioni con LEGAME ROTTO** (linked a manutenzione inesistente):
  `82ff0b71…`, `e8750e0e…`, `f9e2e351…`, `4017ba91…`, `fa8ee153…`, `eee4adb6…`, `b883f689…`, `45feb9b9…`, `7e9925c6…`, `c11828ee…`, `2a629be1…`, `6a64e3bd…` (+5). **Causa: eliminazione manutenzione senza ripulire la sorgente.**
- **13 segnalazioni con chiusura DISALLINEATA**: 11 del tipo `stato="chiusa"` ma bool `chiusa=undefined` (innocue: il reader deriva la chiusura) es. `d4964b81…`, `b74d5e20…`, `c8e188a9…`; **2 contraddittorie**: `f83dbbe1…` (`chiusa=true` ma `stato="nuova"`), `5cdfe350…` (`chiusa=true` ma `stato="presa_in_carico"`, nessuna traccia chiusura).
- **2 segnalazioni in GRUPPO e ANCHE collegate**: `7fa81331…`, `0cd32f30…` (le due origini di TI233827).
- **2 manutenzioni eseguite/chiuse ma con segnalazione origine ANCORA aperta** (propagazione mancata): `from-lavoro-5dd4afde…` → seg `261619fc…`; `from-lavoro-f609de79…` → seg `c7bc5a05…`.
- **0** segnalazioni presa_in_carico senza link · **0** manutenzioni con origine orfana · **0** daFare con traccia chiusura · **0** gruppo manutenzioni con stato ≠ daFare · **0** record senza id reale.

## 4.3 Gesti che si somigliano — cosa scrive ciascuno (tabella secca)
| Gesto | Crea manutenzione? | Scrive su segnalazione | Scrive su manutenzione | Writer |
|---|---|---|---|---|
| **Prendi in carico** | No | `dataPresaInCarico`, `letta=true`, stato→presa_in_carico | — | `segnaPresaInCaricoSegnalazione` (**senza UI**) |
| **Crea manutenzione (da segn.)** | **Sì (daFare)** | `linkedLavoroId`, stato→presa_in_carico, `letta=true` | nuova: `origineTipo/RefId` | `createManutenzioneDaFareFromSegnalazione` |
| **Aggancia a esistente** | No | `linkedLavoroId`=target, stato→presa_in_carico, `letta` | `origineRefs +=` (multi) | `agganciaSegnalazione…Esistente(Batch)` |
| **Crea lavoro dal gruppo** | **Sì (daFare, manuale)** | per ognuna: `linkedLavoroId`, presa_in_carico | nuova `origineTipo="manuale"`, poi `origineRefs +=` tutte | `handleCreaLavoroDaGruppo` |
| **Raggruppa segnalazioni** | No | `gruppoSegnalazioneId` | — | `creaGruppoSegnalazioni` |
| **Raggruppa manutenzioni** | No | — | `gruppoManutenzioneId` | `creaGruppoManutenzioni` |
| **Eseguita** | No | (propagata) stato→chiusa, chiusuraDi/RefId/Data | stato→eseguita | `save…` + `propagateChiusuraToLegame` |
| **Riapri** | No | stato→aperta, link e chiusura azzerati | toglie `origineRef` | `riapriESganciaSegnalazione` |
| **Sgancia legame** | No | toglie link, stato→nuova | toglie `origineRef` | `sganciaLegameManutenzione` |

## 4.4 Percorsi morti o ridondanti
- **3 vie sovrapposte** segnalazione→manutenzione: "Crea manutenzione", "Aggancia a esistente", "Crea lavoro dal gruppo".
- **2 sistemi di gruppo paralleli e scollegati**: `gruppoSegnalazioneId` e `gruppoManutenzioneId`. Un gruppo di segnalazioni, con "Crea lavoro", diventa **una sola manutenzione** (NON un gruppo manutenzioni): i due mondi non si connettono.
- **Flusso "Prendi in carico" non finito**: writer + test esistono, **nessun pulsante UI** lo invoca (`segnaPresaInCaricoSegnalazione` referenziato solo da sé stesso e dai test). Lo stato "presa_in_carico" nasce quindi solo come effetto collaterale → spiega i 28 presa_in_carico e gli 0 "presa_in_carico senza link".
- **Riapri** esiste in 2 punti (Archivio espanso + riquadro Origine): stesso writer, due ingressi.

## 4.5 Informazioni che si vedono in uno stato e spariscono in un altro
- **(già fixato 2026-06-05)** Origini visibili sulle daFare ma "vuote" sulle eseguite — risolto nascondendo i campi vuoti.
- **Autore reale nel dettaglio**: `selectedRecordChiuso = recordChiusoFromRaw(selectedRecord)` **senza** `sourceRecords` ([NextMappaStoricoPage.tsx:333-339](src/next/NextMappaStoricoPage.tsx#L333-L339)). Per un "lavoro da gruppo" (`segnalatoDa="Autisti"`) la frase storia del dettaglio mostra l'autore **generico**, mentre il riquadro Origine (che fa il fetch reale) mostra i nomi veri. *Stesso oggetto, due autori diversi a seconda del riquadro.*
- **"Link rotto" vs "Manutenzione generata"**: la stessa segnalazione (uno dei 17) appare "collegata a un lavoro" in una vista e "link rotto" in un'altra.

---

## Appendice — Metodo e fonti
- **Codice** (sola lettura): `NextManutenzioniPage.tsx`, `NextMappaStoricoPage.tsx`, `nextManutenzioniDomain.ts`, `nextAutistiDomain.ts`, writers (`nextManutenzioneDaFareCreateWriter`, `agganciaSegnalazioneAManutenzioneEsistenteWriter`, `gruppoSegnalazioniWriter`, `gruppoManutenzioniWriter`, `presaInCaricoSegnalazioneWriter`, `nextChiusuraEventoWriter`, `sganciaLegameOrfanoWriter`), `closureOrchestrator.ts`, `frasestoriaRecord.ts`, `ArchivioSubTabs.tsx`.
- **Dato reale**: script read-only Firestore (admin SDK) su `storage/@segnalazioni_autisti_tmp`, `storage/@manutenzioni`, `storage/@controlli_mezzo_autisti` — eseguito 2026-06-05, nessuna scrittura.
- **NON TROVATO**: 4° sub-tab Archivio (sono 3); pulsante "Prendi in carico"; collegamento tra gruppo-segnalazioni e gruppo-manutenzioni.
- Niente proposte implementative di dettaglio: la Parte 5 dà solo direzioni; le decisioni sono di Giuseppe.
