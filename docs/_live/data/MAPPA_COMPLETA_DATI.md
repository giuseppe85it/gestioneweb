# MAPPA COMPLETA DATI

Versione: 2026-03-06  
Scopo: mappa unificata delle sorgenti dati del progetto GestioneManutenzione.

## Legenda stato
- **[CONFERMATO]**: dimostrato da codice e/o documenti tecnici gia presenti.
- **[INCOERENTE]**: presenti varianti concorrenti nel repository.
- **[DA VERIFICARE]**: punto non chiudibile in modo univoco con le prove correnti.
- **[LEGACY/SUPPORTO]**: asset non centrale nella target architecture.

---

## 1) Strati dati del progetto
1. **Key-value Firestore su collection `storage`** [CONFERMATO]  
   Accesso principale via `setItemSync/getItemSync` (`src/utils/storageSync.ts`) su documenti `storage/<key>`.
2. **Collection Firestore dedicate (`@...`)** [CONFERMATO]  
   Usate per documenti IA, impostazioni IA, analisi economiche e dominio cisterna.
3. **Firebase Storage file/object** [CONFERMATO]  
   Usato per immagini, PDF, allegati autisti, allegati acquisti.
4. **LocalStorage browser (solo sessione autisti e stato UI locale)** [CONFERMATO]  
   Gating autisti per-dispositivo (`@autista_attivo_local`, `@mezzo_attivo_autista_local`) + stati UI vari.

---

## 2) Chiavi `storage/<key>` (key-value Firestore)

| Key | Dominio | Writer principali | Reader principali | Link mezzo/targa | Stato / note |
|---|---|---|---|---|---|
| `@mezzi_aziendali` | Flotta anagrafica | `Mezzi`, `IALibretto`, `IACoperturaLibretti` | Home, Dossier, Lavori, Autisti, Analisi | Diretto (`targa`) | [CONFERMATO] Merge-safe speciale in `setItemSync` solo su questa key. |
| `@lavori` | Operativita lavori | `LavoriDaEseguire`, `DettaglioLavoro`, import da `AutistiAdmin` | Lavori*, Dossier, Mezzo360 | Spesso diretto (`targa`) | [CONFERMATO] Origini multiple. |
| `@manutenzioni` | Flotta/manutenzione | `Manutenzioni`, `AutistiEventoModal` | GestioneOperativa, Dossier, Mezzo360, GommeEconomia | Diretto (`targa`) | [CONFERMATO] Shape con opzionali numerosi. |
| `@rifornimenti` | Dossier rifornimenti canonici | `Rifornimento`, rettifiche `AutistiAdmin` | Dossier, CentroControllo, sezioni economia | Diretto (`targa`) | [INCOERENTE] In lettura compaiono forme array e oggetto con `items/value`. |
| `@rifornimenti_autisti_tmp` | Feed autisti tmp | `Rifornimento`, `AutistiAdmin` | Inbox, Home, CentroControllo, Dossier, 360 | Diretto (`targaCamion/targaMotrice`) | [CONFERMATO] Possibile doppio conteggio senza filtro merge. |
| `@materialiconsegnati` | Uscite materiali | `MaterialiConsegnati`, `Manutenzioni` | GestioneOperativa, Dossier, Mezzo360 | Parziale (`targa?`) | [CONFERMATO] Collegamento inventario non transazionale. |
| `@inventario` | Magazzino | `Inventario`, `Acquisti`, `DettaglioOrdine`, `Manutenzioni`, `IADocumenti` | Operativita, Acquisti, IA, GestioneOperativa | Indiretto | [CONFERMATO] Writer multipli su stessa key. |
| `@ordini` | Procurement ordini | `Acquisti`, `MaterialiDaOrdinare`, `DettaglioOrdine` | Acquisti, OrdiniInAttesa, OrdiniArrivati | Indiretto | [CONFERMATO] Catena ordini distribuita su piu viste. |
| `@preventivi` | Archivio preventivi | `Acquisti` | Acquisti, Capo costi (indiretto) | Indiretto | [CONFERMATO] Dipende da allegati Storage multi-pattern. |
| `@listino_prezzi` | Listino canonico | `Acquisti` | Acquisti | No | [CONFERMATO] Mapping articoli da normalizzare. |
| `@fornitori` | Anagrafica fornitori | `Fornitori`, sync da Acquisti | Acquisti, Inventario | No | [CONFERMATO] Nome fornitore con varianti campo storiche. |
| `@colleghi` | Anagrafica persone/autisti | `Colleghi` | LoginAutista, MaterialiConsegnati, Mezzi | No | [CONFERMATO] Badge usato in login autista UI. |
| `@attrezzature_cantieri` | Movimenti attrezzature | `AttrezzatureCantieri` | `AttrezzatureCantieri` | No | [CONFERMATO] Lettori esterni non trovati. |
| `@costiMezzo` | Costi mezzo | Moduli costi/analisi | Dossier, CapoMezzi, CapoCosti, AnalisiEconomica | Diretto (`mezzoTarga/targa`) | [CONFERMATO] Convive con documenti IA. |
| `@preventivi_approvazioni` | Stato approvazioni | `CapoCostiMezzo` | `CapoCostiMezzo` | Diretto (`targa`) | [CONFERMATO] Dominio limitato al modulo capo. |
| `@alerts_state` | Stato alert Home | `Home` | `Home` | Indiretto | [CONFERMATO] Stato UI persistente lato client/storage. |
| `@autisti_sessione_attive` | Sessioni live autisti | `SetupMezzo`, `CambioMezzoAutista`, `HomeAutista`, `AutistiAdmin` | Home, AutistiGate, 360, Inbox | Diretto (`targaMotrice/targaRimorchio`) | [CONFERMATO] Base monitoraggio live admin. |
| `@storico_eventi_operativi` | Storico eventi autisti | Login/Home/Setup/Cambio autista + `AutistiAdmin` | Home, Inbox, Log accessi, Autista360, Mezzo360 | Diretto/indiretto | [CONFERMATO] Stream effettivamente usato dalle schermate correnti. |
| `@segnalazioni_autisti_tmp` | Segnalazioni campo | `Segnalazioni`, `AutistiAdmin` | Inbox, Home, CentroControllo, 360 | Diretto (`targa`) | [CONFERMATO] Include foto/path Storage. |
| `@controlli_mezzo_autisti` | Checklist controlli | `ControlloMezzo`, `AutistiAdmin` | Gate, Inbox, Home, CentroControllo, 360 | Diretto (`targaMotrice/targaRimorchio`) | [CONFERMATO] Shape `check` flessibile. |
| `@richieste_attrezzature_autisti_tmp` | Richieste attrezzature autisti | `RichiestaAttrezzature`, `AutistiAdmin` | Inbox, Home, CentroControllo, 360 | Parziale (`targaCamion`) | [CONFERMATO] Campi `stato/letta` non uniformi su storico. |
| `@cambi_gomme_autisti_tmp` | Eventi gomme tmp | `GommeAutistaModal`, `AutistiAdmin` | Inbox gomme, Home events, 360 | Diretto (`targetTarga`) | [CONFERMATO] Passaggio tmp->ufficiale da presidiare. |
| `@gomme_eventi` | Eventi gomme ufficiali | `AutistiAdmin`, `AutistiEventoModal` | Autista360, Mezzo360 | Diretto (`targa`) | [CONFERMATO] |

---

## 3) Collection Firestore dedicate (`@...` e altre)

| Collection / doc | Dominio | Writer principali | Reader principali | Link mezzo/targa | Stato / note |
|---|---|---|---|---|---|
| `@documenti_mezzi` | Documentale IA mezzi | `IADocumenti` | Dossier, Mezzo360, Capo*, Analisi | Diretto (`targa`) | [CONFERMATO] |
| `@documenti_magazzino` | Documentale IA magazzino | `IADocumenti` | Dossier, Mezzo360, Capo*, Analisi | Indiretto / possibile targa | [CONFERMATO] |
| `@documenti_generici` | Documentale IA generica | `IADocumenti` | Dossier, Mezzo360, Capo*, Analisi | Variabile | [CONFERMATO] Richiede filtri robusti in UI. |
| `@impostazioni_app/gemini` | Config IA | `IAApiKey` | IAHome, IALibretto, IADocumenti, functions-schede | No | [CONFERMATO] Chiave API lato client: rischio sicurezza. |
| `@analisi_economica_mezzi` | Snapshot analisi | `AnalisiEconomica` | `AnalisiEconomica` | Diretto (docId=targa) | [CONFERMATO] |
| `@documenti_cisterna` | Archivio cisterna | `CisternaCaravateIA` | `CisternaCaravatePage` | No | [CONFERMATO] Dominio specialistico. |
| `@cisterna_schede_ia` | Schede cisterna estratte | `CisternaSchedeTest` | `CisternaCaravatePage`, `CisternaSchedeTest` | Parziale | [CONFERMATO] |
| `@cisterna_parametri_mensili` | Parametri mese cisterna | `CisternaCaravatePage` | `CisternaCaravatePage` | No | [CONFERMATO] |
| `autisti_eventi` | Storico autisti alternativo | `NON DIMOSTRATO` (writer attivo non trovato) | `loadFirestoreAutistiEventi` (fallback) | Parziale | [INCOERENTE] Convive con `@storico_eventi_operativi`; uso reale corrente non dimostrato. |

---

## 4) Storage path rilevanti

| Path | Writer principali | Uso | Stato / note |
|---|---|---|---|
| `materiali/<materialId>-<timestamp>.<ext>` | `materialImages` (Acquisti/MaterialiDaOrdinare) | Foto materiali ordine | [CONFERMATO] |
| `inventario/<itemId>/foto.jpg` | `Inventario` | Foto articolo inventario | [CONFERMATO] |
| `autisti/segnalazioni/<recordId>/<timestamp>_<n>.<ext>` | `Segnalazioni` | Allegati segnalazioni autista | [CONFERMATO] |
| `autisti/richieste-attrezzature/<recordId>/<timestamp>.<ext>` | `RichiestaAttrezzature` | Allegati richieste attrezzature | [CONFERMATO] |
| `mezzi_aziendali/<mezzoId>/libretto.jpg` | `IALibretto`, `IACoperturaLibretti` | Libretto/foto mezzo | [CONFERMATO] |
| `documenti_pdf/<...>` | `IADocumenti` | File documentali IA | [CONFERMATO] |
| `documenti_pdf/cisterna/<YYYY>/<MM>/<...>` | `CisternaCaravateIA` | PDF cisterna | [CONFERMATO] |
| `documenti_pdf/cisterna_schede/<YYYY>/<MM>/<...>_crop.jpg` | `CisternaSchedeTest` | Crop immagine OCR | [CONFERMATO] |
| `preventivi/ia/<...>` | `Acquisti` (flusso IA) | Allegati preventivi IA | [INCOERENTE] |
| `preventivi/<id>.pdf` | `Acquisti` (manuale/fallback) | Allegato preventivo manuale | [INCOERENTE] |

---

## 5) Sessione locale autisti (localStorage)

| Chiave locale | Writer | Reader | Stato / note |
|---|---|---|---|
| `@autista_attivo_local` | Login/Gate autisti | AutistiGate/HomeAutista | [CONFERMATO] Sessione per-dispositivo. |
| `@mezzo_attivo_autista_local` | Setup/Cambio mezzo autista | AutistiGate/HomeAutista | [CONFERMATO] |

Nota: la sessione locale non sostituisce i dati operativi su Firestore; il mirror live resta `@autisti_sessione_attive`.

---

## 6) Incoerenze residue da presidiare
1. **Stream eventi autisti doppio** (`@storico_eventi_operativi` vs `autisti_eventi`) [INCOERENTE].
2. **Path allegati preventivi multipli** (`preventivi/ia/*` e `preventivi/<id>.pdf`) [INCOERENTE].
3. **Schema `@rifornimenti` non uniforme** (array vs oggetto con `items/value`) [INCOERENTE].
4. **Ruoli/permessi route-level non dimostrati nel routing** [CONFERMATO come gap].
5. **Policy Firestore non dimostrata nel repo** (`firestore.rules` assente) [DA VERIFICARE].

---

## 7) Fonti prova principali
- `docs/diagrams/flows_data_contract.md`
- `docs/ui-redesign/verification_closure.md`
- `docs/ui-redesign/modules_master_map.md`
- `src/utils/storageSync.ts`
- `src/App.tsx`
- `src/pages/DossierMezzo.tsx`
- `src/pages/Acquisti.tsx`
- `src/utils/homeEvents.ts`

