diff --git a/docs/PROJECT_RULES.md b/docs/PROJECT_RULES.md
new file mode 100644
index 0000000000000000000000000000000000000000..1b33d2bb8df4ca4e216c661c65a7a3a3f7368b9c
--- /dev/null
+++ b/docs/PROJECT_RULES.md
@@ -0,0 +1,21 @@
+# PROJECT_RULES
+
+## Invarianti dedotte
+- Le liste persistite tramite `storageSync` usano documenti Firestore nella collection `storage` con payload `{ value: [...] }` (es. fornitori, colleghi, lavori, inventario, manutenzioni).  
+- Le manutenzioni salvano date nel formato stringa `"gg mm aaaa"` e normalizzano `km/ore/sottotipo/eseguito` a `null` per evitare `undefined` (`src/pages/Manutenzioni.tsx`).  
+- I lavori raggruppano elementi tramite `gruppoId` e marcano esecuzione con booleano `eseguito`; la cancellazione o modifica attende questa struttura (`src/pages/LavoriDaEseguire.tsx`, `src/pages/LavoriEseguiti.tsx`, `src/pages/DettaglioLavoro.tsx`).  
+- Le foto mezzi, inventario e materiali usano percorsi Storage derivati dagli identificativi (targa/id materiale) e vengono salvate prima dell’aggiornamento Firestore (`src/pages/Mezzi.tsx`, `src/pages/Inventario.tsx`, `src/utils/materialImages.ts`).  
+- I documenti IA vengono scritti nelle collection dedicate (`@documenti_mezzi`/`@documenti_magazzino`/`@documenti_generici`) senza mutare le strutture restituite dall’analisi; l’importazione inventario filtra parole chiave escluse e somma quantità su descrizioni identiche (`src/pages/IA/IADocumenti.tsx`).  
+- `GestioneOperativa` dichiara vincolo di non cambiare le chiavi di lettura/scrittura dei moduli monitorati (`src/pages/GestioneOperativa.tsx`).  
+
+## Pattern vietati
+- Cambiare i nomi delle chiavi Firestore esistenti (`@inventario`, `@materialiconsegnati`, `@mezzi_aziendali`, ecc.) rompe caricamenti a cascata nei moduli dipendenti (`src/pages/GestioneOperativa.tsx`, `src/pages/DossierMezzo.tsx`, `src/pages/Manutenzioni.tsx`).  
+- Salvare strutture con `undefined` o formati data diversi in manutenzioni può compromettere ordinamenti e rendering (`src/pages/Manutenzioni.tsx`).  
+- Spostare documenti IA fuori dalle collection dedicate impedisce a Dossier e Analisi Economica di leggerli (`src/pages/DossierMezzo.tsx`, `src/pages/AnalisiEconomica.tsx`).  
+- Usare chiavi `localStorage` al posto di `storageSync` nei moduli che aspettano Firestore produce divergenze dati (nessun modulo di dominio legge `localStorage`, solo `CheckStorage` lo usa) (`src/pages/CheckStorage.tsx`).  
+
+## Rischi reali
+- Le regole Storage negano ogni lettura/scrittura, bloccando upload/download immagini e PDF previsti dai moduli (foto mezzi, inventario, materiali, documenti IA, segnalazioni) (`storage.rules`).  
+- L’API key IA è salvata in chiaro nel documento `@impostazioni_app/gemini` senza cifratura lato client né filtri di esposizione (`src/pages/IA/IAApiKey.tsx`).  
+- Le Cloud Function esterne (`aiCore`, `analisi_economica_mezzo`) sono dipendenze hardcoded; indisponibilità o credenziali mancanti interrompono flussi IA e analisi (`src/utils/aiCore.ts`, `src/pages/AnalisiEconomica.tsx`).  
+- I dati autisti e segnalazioni sono salvati in Firestore ma non è presente nel codice alcuna sincronizzazione verso i moduli gestionali: integrazione con il flusso principale NON DETERMINABILE DAL CODICE (`src/autisti/*.tsx`).  
### Regola PWA / Autisti

L’app autisti:
- deve essere aperta e aggiunta alla Home partendo sempre da /autisti o /autisti/login
- non deve mai essere aggiunta partendo dalla root /
- non utilizza Service Worker
- non utilizza cache offline

Qualsiasi modifica a Vercel deve preservare:
- rewrite di tutte le route verso index.html
- header Cache-Control: no-store
### Autenticazione Autisti

Il codice autista viene richiesto:
- solo al primo accesso
- oppure se non esiste un mezzo assegnato
- oppure dopo logout manuale

Se `@autista_attivo` e `@mezzo_attivo_autista` sono presenti,
l’app autisti entra direttamente senza richiedere il codice.
## Sessione Autisti (Web / PWA)

L’app Autisti utilizza una gestione di sessione locale per dispositivo.

Regole definitive:
- L’ingresso ufficiale dell’app Autisti è SEMPRE `/autisti`
- La route `/autisti/login` non è un punto di ingresso ma solo una pagina interna
- Il login con badge viene richiesto solo:
  - al primo accesso
  - dopo logout manuale
  - su un nuovo dispositivo

Implementazione:
- L’identità dell’autista e il mezzo attivo sono salvati in localStorage dedicato:
  - `@autista_attivo_local`
  - `@mezzo_attivo_autista_local`
- Firestore NON viene usato per la sessione autista
- Firestore resta la fonte unica dei dati operativi e storici

Sicurezza:
- La sessione è per-dispositivo
- Cambiando telefono o cancellando i dati, il badge viene richiesto di nuovo
Regole definitive – App Autisti

Login

Il login autentica solo l’autista.

Non assegna automaticamente alcun mezzo.

SetupMezzo

È l’unico punto in cui si seleziona:

motrice

rimorchio (opzionale)

Deve essere accessibile:

dopo il login

dopo un cambio mezzo

quando l’autista ha una motrice ma vuole agganciare un rimorchio

Non è solo “setup iniziale”, ma selettore attivo del mezzo.

CambioMezzo

Serve a chiudere una configurazione attuale.

Registra sempre:

storico

stato del mezzo lasciato

Non chiude la sessione autista.

Dopo il cambio, l’autista deve poter selezionare subito un altro mezzo tramite SetupMezzo.

Controllo Mezzo

È obbligatorio:

dopo ogni nuova selezione di motrice

dopo ogni nuovo aggancio rimorchio

Non deve bloccare il cambio mezzo.

Serve a validare l’inizio della nuova configurazione.

Rimorchio

Il rimorchio è opzionale.

Un autista può lavorare:

con sola motrice

con motrice + rimorchio

Deve essere sempre possibile:

agganciare un rimorchio se assente

sganciare un rimorchio senza obbligo di riaggancio.

Logout

È solo manuale.

Nessun flusso operativo richiede il logout.