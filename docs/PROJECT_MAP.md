diff --git a/docs/PROJECT_MAP.md b/docs/PROJECT_MAP.md
new file mode 100644
index 0000000000000000000000000000000000000000..3f0c85914a7e41c89d869339bb529cf31808c753
--- /dev/null
+++ b/docs/PROJECT_MAP.md
@@ -0,0 +1,76 @@
+# PROJECT_MAP
+
+## Architettura reale
+- Frontend SPA React con routing `BrowserRouter` e mount principale `App` (`src/main.tsx`, `src/App.tsx`).  
+- Firebase inizializzato con Auth anonima, Firestore, Storage e Functions (`src/firebase.ts`, `src/App.tsx`).  
+- Data layer basato su Firestore:
+  - Collection `storage` usata come key-value documentale (campo `value`) per liste di dominio.  
+  - Collection dedicate: `@impostazioni_app` (documento `gemini`), `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@analisi_economica_mezzi`.  
+- Cloud Functions/servizi esterni:
+  - Callable `aiCore` in regione `europe-west3` per task IA generici e generazione PDF IA (`src/utils/aiCore.ts`).  
+  - HTTPS Function `analisi_economica_mezzo` consumata da `AnalisiEconomica` (`src/pages/AnalisiEconomica.tsx`).  
+  - Funzione Edge Vercel `api/pdf-ai-enhance.ts` (OpenAI Vision) per estrazione JSON da documenti.  
+- Storage Firebase usato per immagini materiali, mezzi, inventario, documenti PDF IA, segnalazioni autisti (`src/utils/materialImages.ts`, `src/pages/Mezzi.tsx`, `src/pages/Inventario.tsx`, `src/pages/IA/IADocumenti.tsx`, `src/autisti/Segnalazioni.tsx`).  
+- Storage rules attuali negano ogni accesso (`storage.rules`).  
+- Strumenti locali: pagina `CheckStorage` legge/scrive `localStorage` browser (nessuna chiave predefinita) (`src/pages/CheckStorage.tsx`).  
+
+## Chiavi Firestore e Storage
+- Collection `storage` (campo dati `value`):
+  - `@fornitori`: lista fornitori (`src/pages/Fornitori.tsx`).  
+  - `@colleghi`: lista colleghi e schede carburante (`src/pages/Colleghi.tsx`).  
+  - `@ordini`: ordini materiali e stato arrivo (`src/pages/MaterialiDaOrdinare.tsx`, `src/pages/OrdiniInAttesa.tsx`, `src/pages/OrdiniArrivati.tsx`, `src/pages/DettaglioOrdine.tsx`).  
+  - `@materialiconsegnati`: movimenti materiali / consegne (`src/pages/MaterialiConsegnati.tsx`, `src/pages/GestioneOperativa.tsx`, `src/pages/DossierMezzo.tsx`).  
+  - `@inventario`: articoli di magazzino (`src/pages/Inventario.tsx`, `src/pages/Manutenzioni.tsx`, `src/pages/DettaglioOrdine.tsx`).  
+  - `@mezzi_aziendali`: anagrafica mezzi con foto (`src/pages/Mezzi.tsx`, `src/pages/LavoriDaEseguire.tsx`, `src/pages/DossierMezzo.tsx`, `src/autisti/SetupMezzo.tsx`).  
+  - `@lavori`: lavori e gruppi (creati/aggiornati da moduli Lavori) (`src/pages/LavoriDaEseguire.tsx`, `src/pages/LavoriInAttesa.tsx`, `src/pages/LavoriEseguiti.tsx`, `src/pages/DettaglioLavoro.tsx`, `src/pages/DossierMezzo.tsx`).  
+  - `@manutenzioni`: storico manutenzioni (`src/pages/Manutenzioni.tsx`, `src/pages/GestioneOperativa.tsx`, `src/pages/DossierMezzo.tsx`).  
+  - `@costiMezzo`: costi manuali per mezzo (`src/pages/DossierMezzo.tsx`, `src/pages/AnalisiEconomica.tsx`).  
+  - `@rifornimenti`: rifornimenti storicizzati per mezzo (`src/pages/DossierMezzo.tsx`).  
+  - `@storico`: timeline generica (`src/pages/Storico.tsx`).  
+  - `@fornitori` e `@colleghi` riutilizzati anche da altri moduli (es. Inventario per suggerimenti fornitori).  
+  - Chiavi temporanee autisti: `@autista_attivo`, `@mezzo_attivo_autista`, `@autisti_sessione_attive`, `@storico_sganci_rimorchi`, `@storico_cambi_motrice`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@segnalazioni_autisti_tmp` (`src/autisti/*`, `src/autistiInbox/CambioMezzoInbox.tsx`).  
+  - Altri: `@materialiconsegnati`, `@manutenzioni`, `@inventario` usati anche in `GestioneOperativa` solo lettura.  
+- Collection `@impostazioni_app`: documento `gemini` con `apiKey` e config IA (`src/pages/IA/IAApiKey.tsx`, `src/pages/IA/IADocumenti.tsx`, `src/pages/IA/IALibretto.tsx`).  
+- Collection IA documentale: `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici` popolata da upload IA (`src/pages/IA/IADocumenti.tsx`) e letta da `DossierMezzo`/`AnalisiEconomica`.  
+- Collection `@analisi_economica_mezzi`: analisi IA salvate per targa (`src/pages/AnalisiEconomica.tsx`).  
+- Storage percorsi:
+  - `inventario/{id}/foto.jpg` per foto articoli (`src/pages/Inventario.tsx`).  
+  - `materiali/{materialId}-{timestamp}.{ext}` per materiali da ordinare (`src/utils/materialImages.ts`).  
+  - `mezzi/{targa}_{timestamp}.jpg` per foto mezzo (`src/pages/Mezzi.tsx`).  
+  - `documenti_pdf/{timestamp}_{nomeFile}` per PDF/immagini IA (`src/pages/IA/IADocumenti.tsx`).  
+  - `segnalazioni_autisti/{timestamp}_{nome}` per foto segnalazioni (`src/autisti/Segnalazioni.tsx`).  
+- Local browser storage: nessuna chiave fissa; `CheckStorage` consente CRUD libero su `localStorage` (`src/pages/CheckStorage.tsx`).  
+
+## Flussi lettura/scrittura per modulo
+- **Fornitori**: `getDoc/setDoc` su `storage/@fornitori` (CRUD lista, export PDF) (`src/pages/Fornitori.tsx`).  
+- **Colleghi**: `getDoc/setDoc` su `storage/@colleghi`, gestione schede carburante (`src/pages/Colleghi.tsx`).  
+- **Mezzi**: `getItemSync/setItemSync` su `storage/@mezzi_aziendali`; upload foto su Storage; associazione opzionale autista (`src/pages/Mezzi.tsx`).  
+- **Lavori**: creazione gruppi e lavori su `storage/@lavori` via `storageSync` (da LavoriDaEseguire); consultazione/aggiornamento esecuzione in `LavoriInAttesa`, `LavoriEseguiti`, `DettaglioLavoro`; Dossier legge stessi dati (`src/pages/LavoriDaEseguire.tsx`, `src/pages/LavoriInAttesa.tsx`, `src/pages/LavoriEseguiti.tsx`, `src/pages/DettaglioLavoro.tsx`, `src/pages/DossierMezzo.tsx`).  
+- **Inventario**: `getItemSync/setItemSync` su `storage/@inventario`; upload foto opzionali; export PDF; suggerimenti fornitori da `storage/@fornitori` (`src/pages/Inventario.tsx`).  
+- **Materiali da ordinare/Ordini**: ordini salvati su `storage/@ordini`; immagini materiali su Storage; stato arrivo gestito in `OrdiniInAttesa`/`OrdiniArrivati`/`DettaglioOrdine` con aggiornamento inventario via `@inventario` (`src/pages/MaterialiDaOrdinare.tsx`, `src/pages/OrdiniInAttesa.tsx`, `src/pages/OrdiniArrivati.tsx`, `src/pages/DettaglioOrdine.tsx`).  
+- **Materiali consegnati**: movimenti su `storage/@materialiconsegnati`, con impatto inventario `@inventario`; usa anagrafiche mezzi/colleghi per destinatari (`src/pages/MaterialiConsegnati.tsx`).  
+- **Manutenzioni**: storico su `storage/@manutenzioni`; decrementa inventario `@inventario` e traccia movimenti `@materialiconsegnati`; legge mezzi `@mezzi_aziendali`; export PDF (`src/pages/Manutenzioni.tsx`).  
+- **Gestione Operativa**: sola lettura snapshot da `@inventario`, `@materialiconsegnati`, `@manutenzioni` per dashboard (`src/pages/GestioneOperativa.tsx`).  
+- **Dossier**:  
+  - `DossierLista` legge mezzi `@mezzi_aziendali`.  
+  - `DossierMezzo` aggrega `@mezzi_aziendali`, `@lavori`, `@materialiconsegnati`, `@rifornimenti`, `@costiMezzo`, `@manutenzioni` e documenti IA da `@documenti_*`; legge `@documenti_magazzino` come collection aggiuntiva (`src/pages/DossierMezzo.tsx`).  
+  - `DossierGomme` legge `@manutenzioni` (`src/pages/DossierGomme.tsx`).  
+- **Analisi Economica**: legge `@mezzi_aziendali`, `@costiMezzo`, documenti IA (`@documenti_*`), e analisi salvate in `@analisi_economica_mezzi`; può sovrascrivere analisi IA nel documento della targa (`src/pages/AnalisiEconomica.tsx`).  
+- **IA**:  
+  - `IAApiKey` CRUD su `@impostazioni_app/gemini` (campo `apiKey`).  
+  - `IALibretto` legge `@impostazioni_app/gemini` e `storage/@mezzi_aziendali` per alimentare richiesta IA.  
+  - `IADocumenti` usa `@impostazioni_app/gemini`, carica file su Storage, salva JSON IA in `@documenti_mezzi`/`@documenti_magazzino`/`@documenti_generici`, e può importare voci in `storage/@inventario`.  
+- **Autisti (app dedicata)**:  
+  - `LoginAutista`, `SetupMezzo`, `CambioMezzoAutista`, `ControlloMezzo`, `Rifornimento`, `Segnalazioni` persistono sessioni, controlli, rifornimenti e segnalazioni in `storage` con chiavi `@autista_attivo`, `@mezzo_attivo_autista`, `@autisti_sessione_attive`, `@storico_sganci_rimorchi`, `@storico_cambi_motrice`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@segnalazioni_autisti_tmp`; segnalazioni salvano foto su Storage (`src/autisti/*.tsx`).  
+  - `HomeAutista` legge `@autista_attivo`/`@mezzo_attivo_autista`.  
+- **Autisti Inbox (admin)**: consulta storici `@storico_sganci_rimorchi` e `@storico_cambi_motrice` (`src/autistiInbox/CambioMezzoInbox.tsx`, `src/autistiInbox/AutistiInboxHome.tsx`).  
+- **Storico**: legge/scrive lista eventi in `storage/@storico` (`src/pages/Storico.tsx`).  
+- **CheckStorage**: opera su `localStorage` browser, senza Firestore (`src/pages/CheckStorage.tsx`).  
+
+## Relazioni tra moduli
+- Le anagrafiche `@mezzi_aziendali` alimentano Lavori, Dossier, Manutenzioni, MaterialiConsegnati e app Autisti (`src/pages/LavoriDaEseguire.tsx`, `src/pages/DossierMezzo.tsx`, `src/pages/Manutenzioni.tsx`, `src/pages/MaterialiConsegnati.tsx`, `src/autisti/SetupMezzo.tsx`).  
+- `@fornitori` e `@colleghi` sono riutilizzati per suggerimenti/lookup in Inventario, Materiali, e Autisti (es. login autista usa `@colleghi`) (`src/pages/Inventario.tsx`, `src/pages/MaterialiDaOrdinare.tsx`, `src/autisti/LoginAutista.tsx`).  
+- `@inventario` è aggiornato da moduli Ordini, Materiali Consegnati e Manutenzioni e viene letto in Gestione Operativa e IADocumenti per import IA (`src/pages/DettaglioOrdine.tsx`, `src/pages/MaterialiConsegnati.tsx`, `src/pages/Manutenzioni.tsx`, `src/pages/GestioneOperativa.tsx`, `src/pages/IA/IADocumenti.tsx`).  
+- Documenti IA (`@documenti_*`) sono consumati da Dossier e Analisi Economica per costi e sintesi (`src/pages/DossierMezzo.tsx`, `src/pages/AnalisiEconomica.tsx`).  
+- Movimenti materiali `@materialiconsegnati` collegano utilizzi in Manutenzioni e consegne a mezzi/destinatari, e sono mostrati nel Dossier (`src/pages/Manutenzioni.tsx`, `src/pages/MaterialiConsegnati.tsx`, `src/pages/DossierMezzo.tsx`).  
+- App Autisti produce chiavi temporanee e media che non risultano ancora integrate nei moduli amministrativi principali se non via Inbox storici (nessuna sincronizzazione oltre ai setItemSync osservati). NON DETERMINABILE DAL CODICE se esista processo server-side di consolidamento.  
## Distribuzione App Autisti (Vercel)

L’app autisti è distribuita come Web App (PWA leggera) tramite Vercel.

URL ufficiale:
- https://gestioneweb.vercel.app/autisti/login

Caratteristiche:
- Stesso progetto dell’app admin
- Routing SPA gestito lato client (React Router)
- Rewrite Vercel attivo verso /index.html
- Nessun Service Worker
- Cache disabilitata (Cache-Control: no-store)

Motivazione:
- Evitare versioni bloccate su dispositivi mobili
- Garantire che ogni apertura carichi sempre l’ultima versione
- Consentire link diretti alle route /autisti/*
### Sessione Autisti

L’identità dell’autista e il mezzo attivo sono salvati localmente
(per dispositivo) e NON su Firestore.

Firestore contiene solo dati operativi e storici.
