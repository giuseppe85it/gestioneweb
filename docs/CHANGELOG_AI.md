## [SETUP] Distribuzione App Autisti su Vercel

- Risolto routing diretto delle route /autisti/* tramite rewrite verso index.html
- Disabilitata cache Vercel per evitare versioni bloccate su PWA
- Definito flusso corretto di installazione app autisti su Home (PWA)

diff --git a/docs/CHANGELOG_AI.md b/docs/CHANGELOG_AI.md
new file mode 100644
index 0000000000000000000000000000000000000000..785d301cb58d1fcf27e544d8fdd1debae23736ac
--- /dev/null
+++ b/docs/CHANGELOG_AI.md
@@ -0,0 +1,19 @@
+# CHANGELOG_AI
+
+## Stato attuale progetto
+- SPA React per gestione mezzi, lavori, magazzino e IA, con autenticazione anonima Firebase e routing client-side (`src/main.tsx`, `src/App.tsx`, `src/firebase.ts`).  
+- Persistenza principale su Firestore collection `storage` (liste dominio in campo `value`) più collection dedicate IA e analisi economica; upload media su Firebase Storage (`src/utils/storageSync.ts`, `src/pages/IA/IADocumenti.tsx`, `src/pages/AnalisiEconomica.tsx`).  
+- Flussi IA attivi: callable `aiCore` per generazione PDF/analisi generiche, funzione HTTP `analisi_economica_mezzo`, ed endpoint edge `api/pdf-ai-enhance` per parsing documenti (`src/utils/aiCore.ts`, `src/pages/AnalisiEconomica.tsx`, `api/pdf-ai-enhance.ts`).  
+- Regole Storage correnti bloccano qualsiasi accesso, impedendo gli upload previsti da moduli (foto mezzi, inventario, materiali, documenti IA, segnalazioni) (`storage.rules`).  
+- App Autisti salva sessioni e segnalazioni su Firestore/Storage ma nel codice non compare un consumo nei moduli gestionali principali (`src/autisti/*.tsx`, `src/autistiInbox/*.tsx`).  
+
+## Decisioni tecniche implicite
+- Uso di Firestore come key-value documentale (campo `value`) per ridurre il numero di documenti; pattern replicato su fornitori, colleghi, lavori, inventario, manutenzioni, ordini, movimenti materiali (`src/utils/storageSync.ts`, `src/pages/Fornitori.tsx`, `src/pages/Manutenzioni.tsx`).  
+- Gestione media tramite upload immediato su Storage e persistenza dei soli URL/percorso nei documenti (`src/utils/materialImages.ts`, `src/pages/Mezzi.tsx`, `src/pages/Inventario.tsx`).  
+- Analisi IA per costi mezzi salvate in documenti per targa in collection `@analisi_economica_mezzi`, rigenerabili via fetch a Cloud Function (`src/pages/AnalisiEconomica.tsx`).  
+- Importazione inventario da documenti IA basata su confronto descrizione case-insensitive con filtraggio parole chiave escluse e sommatoria quantità (`src/pages/IA/IADocumenti.tsx`).  
+
+## TODO reali
+- Aggiornare `storage.rules` per consentire gli upload necessari mantenendo sicurezza: attualmente `allow read, write: if false` blocca ogni feature multimediale (`storage.rules`).  
+- Definire e implementare il flusso di consolidamento dei dati temporanei autisti (`@rifornimenti_autisti_tmp`, `@segnalazioni_autisti_tmp`, `@autisti_sessione_attive`, ecc.) verso dataset gestionali o pipeline dedicate: NON DETERMINABILE DAL CODICE.  
+- Completare il flusso Rifornimento autisti, oggi segnato “Funzione in fase iniziale” e privo di dettagli costo/litri salvati (`src/autisti/Rifornimento.tsx`).  
