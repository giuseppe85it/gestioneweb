# Modules Master Map — GestioneManutenzione

## Perimetro analisi (read-only)
Analisi eseguita su tutto il repository:
- `src/pages`, `src/autisti`, `src/autistiInbox`, `src/components`
- `src/utils`, `src/cisterna`, `src/types`
- `functions`, `functions-schede`, `api`
- file root e artefatti non standard (`rcautistiSetupMezzo.tsx`, `src/main.zip`, `src/autistiInbox/AutistiInboxHome.tsx.bak2`)

## Macro-aree proposte
1. Centro di Controllo
2. Flotta
3. Dossier Mezzo
4. Operativita
5. Magazzino
6. Analisi
7. Autisti
8. IA
9. Sistema / Supporto

## Moduli per area

### 1) Centro di Controllo
- **Home Dashboard Admin** (`src/pages/Home.tsx`): hub principale alert/sessioni/eventi; collega a Mezzi, Manutenzioni, Autisti Inbox/Admin, Dossier/Mezzo360.
- **Gestione Operativa** (`src/pages/GestioneOperativa.tsx`): hub operativo su inventario/materiali/manutenzioni, con link a Centro Controllo e Attrezzature.
- **Centro Controllo** (`src/pages/CentroControllo.tsx`): monitor manutenzioni programmate + rifornimenti mensili + blocchi autisti (segnalazioni/controlli/richieste) con anteprima PDF.

### 2) Flotta
- **Mezzi** (`src/pages/Mezzi.tsx`): anagrafica mezzi, libretti/foto, campi manutenzione programmazione.
- **Manutenzioni** (`src/pages/Manutenzioni.tsx`): registro interventi, consumo materiali, integrazione gomme.
- **Lavori da eseguire** (`src/pages/LavoriDaEseguire.tsx`): creazione backlog lavori per mezzo.
- **Lavori in attesa** (`src/pages/LavoriInAttesa.tsx`): vista lavori in attesa con export PDF.
- **Lavori eseguiti** (`src/pages/LavoriEseguiti.tsx`): storico lavori chiusi con export PDF.
- **Dettaglio lavoro** (`src/pages/DettaglioLavoro.tsx`): edit stato/assegnazioni/note singolo lavoro.
- **Capo Mezzi** (`src/pages/CapoMezzi.tsx`): vista management costi sintetici per targa (documenti IA + costi).
- **Capo Costi Mezzo** (`src/pages/CapoCostiMezzo.tsx`): dettaglio costi FATTURE/PREVENTIVI, approvazioni e PDF.

### 3) Dossier Mezzo
- **Dossier Lista** (`src/pages/DossierLista.tsx`): ingresso per categoria e targa.
- **Dossier Mezzo** (`src/pages/DossierMezzo.tsx`): aggregatore centrale per mezzo (lavori, materiali, rifornimenti, documenti IA, costi, manutenzioni, PDF dossier).
- **Dossier Gomme** (`src/pages/DossierGomme.tsx`): wrapper pagina gomme (via `GommeEconomiaSection`).
- **Dossier Rifornimenti** (`src/pages/DossierRifornimenti.tsx`): wrapper pagina rifornimenti (via `RifornimentiEconomiaSection`).
- **Mezzo 360** (`src/pages/Mezzo360.tsx`): timeline completa mezzo (eventi, segnalazioni, controlli, rifornimenti, gomme, richieste, documenti).
- **Autista 360** (`src/pages/Autista360.tsx`): timeline completa per autista/badge con eventi collegati ai mezzi.

### 4) Operativita
- **Acquisti** (`src/pages/Acquisti.tsx`): ordini + preventivi + listino + fornitori, con sincronizzazione inventario/ordini e PDF.
- **Materiali da ordinare** (`src/pages/MaterialiDaOrdinare.tsx`): inserimento ordini verso `@ordini`.
- **Ordini in attesa** (`src/pages/OrdiniInAttesa.tsx`): filtro stato ordini pending + PDF.
- **Ordini arrivati** (`src/pages/OrdiniArrivati.tsx`): filtro stato ordini arrivati + PDF.
- **Dettaglio ordine** (`src/pages/DettaglioOrdine.tsx`): gestione singolo ordine e impatto su inventario.
- **Colleghi** (`src/pages/Colleghi.tsx`): anagrafica personale interno + export PDF.
- **Fornitori** (`src/pages/Fornitori.tsx`): anagrafica fornitori + export PDF.
- **Attrezzature Cantieri** (`src/pages/AttrezzatureCantieri.tsx`): consegne/spostamenti/ritiri attrezzature con PDF tabellare.

### 5) Magazzino
- **Inventario** (`src/pages/Inventario.tsx`): stock materiali globale con export PDF.
- **Materiali Consegnati** (`src/pages/MaterialiConsegnati.tsx`): movimenti uscita materiali verso mezzi/colleghi con PDF.

### 6) Analisi
- **Analisi Economica Mezzo** (`src/pages/AnalisiEconomica.tsx`): analisi costi per targa, lettura documenti IA, salvataggio analisi e PDF.
- **Gomme Economia Section** (`src/pages/GommeEconomiaSection.tsx`): lettura `@manutenzioni`, calcoli economici gomme per targa.
- **Rifornimenti Economia Section** (`src/pages/RifornimentiEconomiaSection.tsx`): merge robusto `@rifornimenti` + `@rifornimenti_autisti_tmp`.

### 7) Autisti
- **Autisti Gate** (`src/autisti/AutistiGate.tsx`): routing condizionale login/setup/controllo.
- **Login Autista** (`src/autisti/LoginAutista.tsx`): accesso badge e log su storico operativo.
- **Setup Mezzo** (`src/autisti/SetupMezzo.tsx`): associazione autista-motrice/rimorchio su sessioni attive.
- **Home Autista** (`src/autisti/HomeAutista.tsx`): dashboard autista con azioni operative.
- **Cambio Mezzo Autista** (`src/autisti/CambioMezzoAutista.tsx`): cambio assetto e storico.
- **Rifornimento** (`src/autisti/Rifornimento.tsx`): inserimento rifornimento su tmp + dossier.
- **Controllo Mezzo** (`src/autisti/ControlloMezzo.tsx`): checklist KO/OK pre-turno.
- **Segnalazioni** (`src/autisti/Segnalazioni.tsx`): segnalazioni con foto/storage path.
- **Richiesta Attrezzature** (`src/autisti/RichiestaAttrezzature.tsx`): richiesta testuale + foto opzionale.
- **Autisti Inbox Home** (`src/autistiInbox/AutistiInboxHome.tsx`): dashboard admin eventi autisti.
- **Cambio Mezzo Inbox** (`src/autistiInbox/CambioMezzoInbox.tsx`): storico cambi mezzo giornaliero (read-only).
- **Autisti Controlli All** (`src/autistiInbox/AutistiControlliAll.tsx`): lista controlli KO/OK + PDF.
- **Autisti Segnalazioni All** (`src/autistiInbox/AutistiSegnalazioniAll.tsx`): lista segnalazioni + PDF.
- **Richiesta Attrezzature All** (`src/autistiInbox/RichiestaAttrezzatureAll.tsx`): lista richieste + PDF.
- **Autisti Gomme All** (`src/autistiInbox/AutistiGommeAll.tsx`): lista cambi gomme autisti.
- **Autisti Log Accessi All** (`src/autistiInbox/AutistiLogAccessiAll.tsx`): log login/logout/assetto.
- **Autisti Admin** (`src/autistiInbox/AutistiAdmin.tsx`): centro rettifica/import/eventi avanzato (scrittura multi-chiave).

### 8) IA
- **IA Home** (`src/pages/IA/IAHome.tsx`): hub strumenti IA e stato API key.
- **IA API Key** (`src/pages/IA/IAApiKey.tsx`): gestione `@impostazioni_app/gemini`.
- **IA Libretto** (`src/pages/IA/IALibretto.tsx`): estrazione libretto e persistenza su `@mezzi_aziendali`.
- **IA Documenti** (`src/pages/IA/IADocumenti.tsx`): estrazione documenti (preventivi/fatture/etc), salvataggio collezioni documenti, integrazione inventario.
- **IA Copertura Libretti** (`src/pages/IA/IACoperturaLibretti.tsx`): audit copertura libretto/foto + fix mirati su mezzi.
- **Controllo Debug** (`src/pages/IA/ControlloDebug.tsx`): audit read-only anomalie mezzi (embedded in copertura libretti).
- **Libretti Export** (`src/pages/LibrettiExport.tsx`): selezione targhe e PDF unico libretti/foto.
- **Cisterna Caravate IA** (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx`): estrazione e salvataggio documenti cisterna.
- **Cisterna Caravate Page** (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx`): dashboard cisterna documenti/schede/parametri.
- **Cisterna Schede Test** (`src/pages/CisternaCaravate/CisternaSchedeTest.tsx`): modulo operativo/test per schede IA cisterna.

### 9) Sistema / Supporto
- **storageSync** (`src/utils/storageSync.ts`): livello sync Firestore `storage/<key>` (con merge-safe specifico mezzi).
- **homeEvents** (`src/utils/homeEvents.ts`): aggregatore eventi autisti cross-chiave.
- **pdfEngine** (`src/utils/pdfEngine.ts`): motore PDF centralizzato (lavori, dossier, analisi, libretti, autisti, rifornimenti, manutenzioni, ecc.).
- **pdfPreview** (`src/utils/pdfPreview.ts`): pipeline anteprima/condivisione PDF.
- **aiCore client** (`src/utils/aiCore.ts`): chiamata Cloud Function `aiCore` (task `pdf_ia`).
- **alertsState** (`src/utils/alertsState.ts`): stato alert Home (ack/snooze).
- **PdfPreviewModal** (`src/components/PdfPreviewModal.tsx`): UI preview PDF riusata.
- **AutistiEventoModal** (`src/components/AutistiEventoModal.tsx`): gestione evento autista, import in lavori/manutenzioni, preview PDF.
- **AutistiImportantEventsModal** (`src/components/AutistiImportantEventsModal.tsx`): modal eventi prioritari autisti.
- **TargaPicker** (`src/components/TargaPicker.tsx`): selettore targhe riusato in admin/eventi.
- **ModalGomme** (`src/pages/ModalGomme.tsx`): form complesso gomme (riusato da Manutenzioni e Autisti).
- **SessioniAttiveCard / RifornimentiCard** (`src/autistiInbox/components/*.tsx`): widget inbox.
- **Cisterna collections** (`src/cisterna/collections.ts`): chiavi/normalizzazione cisterna.
- **Firebase config** (`src/firebase.ts`): bootstrap app/auth/firestore/storage/functions.
- **API Vercel `pdf-ai-enhance`** (`api/pdf-ai-enhance.ts`): endpoint OpenAI separato rispetto a Firebase Functions. **DA VERIFICARE uso reale**.
- **Cloud Functions principali** (`functions/index.js`, `functions/estrazioneDocumenti.js`, `functions/analisiEconomica.js`, `functions/iaCisternaExtract.js`): estrazione libretto/documenti, AI economica, stamp PDF.
- **Cloud Functions cisterna dedicate** (`functions-schede/index.js`, `functions-schede/estrazioneSchedaCisterna.js`, `functions-schede/cisternaDocumentiExtract.js`): pipeline IA cisterna separata.

## Mappa convergenza (sintesi)
- Convergenza verso **Dossier Mezzo**: lavori, manutenzioni, rifornimenti, materiali consegnati, documenti IA, costi mezzo, eventi autisti (via Mezzo360/Autista360).
- Moduli globali esterni al dossier: acquisti, ordini, inventario, colleghi, fornitori, attrezzature cantiere, admin autisti.
- Area autisti resta separata ma alimenta i dati di mezzo (rifornimenti/controlli/segnalazioni/richieste/gomme/sessioni).
- IA entra su libretti/documenti/analisi economica/cisterna; PDF e' trasversale su quasi tutte le aree operative.

## Punti critici / sovrapposizioni
- **Dossier vs Mezzo360 vs CapoCosti/AnalisiEconomica**: sovrapposizione parziale di viste per stessa targa.
- **Acquisti + MaterialiDaOrdinare + OrdiniInAttesa/Arrivati + DettaglioOrdine**: catena ordini distribuita su moduli multipli.
- **AutistiAdmin vs pagine `Autisti*All`**: funzionalita in parte duplicate (listing + azioni + PDF).
- **Route alias/legacy attive**:
  - `/dossiermezzi/:targa` e `/dossier/:targa` puntano entrambe a `DossierMezzo`.
  - `/acquisti/dettaglio/:ordineId` punta ancora a `Acquisti` (non a `DettaglioOrdine`).
- **Naming ambiguo**: `dettagliolavori` (senza slash semantico), mix ITA/ENG nei nomi modulo.
- **Doppia infrastruttura IA backend**: Firebase Functions + endpoint Vercel OpenAI (`api/pdf-ai-enhance.ts`). **DA VERIFICARE governance**.

## Output decisionale
### Moduli da portare nel Dossier
- `DossierGomme`, `DossierRifornimenti` (wrapper), `GommeEconomiaSection`, `RifornimentiEconomiaSection`
- timeline eventi da `Mezzo360`/`Autista360` con filtri coerenti per targa
- blocchi costi sintetici da `CapoCostiMezzo` (vista per mezzo)

### Moduli da lasciare globali
- `Acquisti`, `MaterialiDaOrdinare`, `OrdiniInAttesa`, `OrdiniArrivati`, `DettaglioOrdine`
- `Inventario`, `MaterialiConsegnati`, `AttrezzatureCantieri`
- `Colleghi`, `Fornitori`
- `AutistiAdmin` (centro rettifica cross-chiave)

### Moduli da verificare
- `api/pdf-ai-enhance.ts` (integrazione OpenAI parallela)
- `functions-schede/*` (stato deploy e ownership separata)
- `CisternaSchedeTest` (test vs produzione)
- collegamento reale tra `/acquisti/dettaglio/:ordineId` e `DettaglioOrdine`

### Legacy / ambigui
- `src/autistiInbox/AutistiInboxHome.tsx.bak2` (backup in repo)
- `src/main.zip` (artefatto non sorgente)
- `rcautistiSetupMezzo.tsx` (file root con solo riferimento path)
