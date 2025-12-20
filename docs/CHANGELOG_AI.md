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
## [FIX] Sessione Autisti persistente su Web/PWA

- Risolta richiesta continua del badge ad ogni apertura
- Introdotto storage locale dedicato per la sessione autista e mezzo
- Centralizzato l’accesso tramite AutistiGate su /autisti
- Aggiunto redirect automatico in LoginAutista se sessione già presente
- Separata definitivamente la sessione autista dai dati Firestore
Sessione – Revisione flussi App Autisti

Decisioni prese

Confermato che:

CambioMezzo è una transizione, non una chiusura.

SetupMezzo è il selettore unico dei mezzi.

ControlloMezzo è uno step obbligatorio post-selezione.

Eliminata l’idea di rilogin forzato durante il cambio mezzo.

Modifiche concettuali

CambioMezzo → deve sempre portare a SetupMezzo.

SetupMezzo deve essere raggiungibile anche:

con motrice già attiva

senza passare dal login.

Problemi emersi

AutistiGate blocca l’accesso a SetupMezzo in più scenari.

Stato locale del mezzo non sempre coerente dopo:

cambio motrice

cambio rimorchio.

Attualmente:

se loggato con sola motrice

non è possibile agganciare un rimorchio.

SetupMezzo non viene raggiunto:

né dopo login

né dopo cambio mezzo.

Da risolvere

Revisione completa della logica di AutistiGate.

Chiarire quando un mezzo è “operativo” vs “in transizione”.

Allineare stato locale e stato Firestore dopo i cambi.

## [FIX] 2025-12-19 – Stabilizzazione App Autisti (sessione per-dispositivo)

- Risolto rischio “targa/nome di un altro telefono”: la sessione è ora SOLO locale via `autistiStorage.ts`
  - `@autista_attivo_local`
  - `@mezzo_attivo_autista_local`
- Allineati i moduli Autisti a lettura locale: Home, ControlloMezzo, Segnalazioni, Rifornimento, SetupMezzo, CambioMezzo.
- `SetupMezzo` aggiornato con blocco speculare:
  - `mode=rimorchio` → motrice bloccata
  - `mode=motrice` → rimorchio bloccato
- Dopo conferma mezzo: redirect sempre a `/autisti/controllo`.

## [FIX] 2025-12-19 – Segnalazioni e Rifornimenti coerenti dopo cambio mezzo
- Segnalazioni e Rifornimento salvano sempre con `targaCamion/targaRimorchio` corretti letti da sessione locale.
- Chiavi dati:
  - `@segnalazioni_autisti_tmp`
  - `@rifornimenti_autisti_tmp`

## [CHORE] 2025-12-19 – ControlloMezzo reso non “sezione”
- Rimosso accesso manuale da Home: ControlloMezzo resta solo step obbligatorio post-setup/cambio.

## [FEAT] 2025-12-19 – Richiesta Attrezzature (minimal)
- Aggiunta schermata “Che ti serve?” con testo libero + foto opzionale.
- Chiave: `@richieste_attrezzature_autisti_tmp`
- Route: `/autisti/richiesta-attrezzature`

## [NOTE] 2025-12-19 – Admin rimandato
- Firestore resta mirror/admin:
  - `@autisti_sessione_attive`, `@mezzo_attivo_autista`, `autisti_eventi`
- La dashboard admin verrà implementata in chat dedicata successiva.
# CHANGELOG_AI

## Stato attuale (oggi)
- Inbox Autisti premium centrata e coerente desktop/mobile.
- Centro rettifica dati (AutistiAdmin) attivo con filtri per data e categorie.
- `homeEvents.ts` centralizza la lettura eventi giornalieri e lo stato rimorchi (agganciati/liberi).
- Controllo Mezzo aggiornato per distinguere MOTRICE/RIMORCHIO/ENTRAMBI tramite campo `target`.

---

## [UI] 2025-12-20 – Inbox Autisti premium (layout stabile)
- Sistemato CSS della home Inbox per:
  - contenitore centrato con max-width
  - card leggibili su desktop e mobile
- Aggiunta 5a card “Richiesta Attrezzature” (tasto/link presente, pagina già prevista ma si rifinisce dopo).
- Logo ingrandito; click per tornare alla home principale da rendere attivo quando si completa la navigazione.

---

## [FEAT] 2025-12-20 – Centro rettifica dati (AutistiAdmin)
- Aggiunta dashboard admin con:
  - filtri per data (giorno precedente/successivo)
  - tab categorie: rifornimenti, segnalazioni, controlli, cambio mezzo, richieste attrezzature
  - sezione “Cambio mezzo” con:
    - Agganci rimorchi (include anche agganci LIVE per chiudere il cerchio)
    - Sganci rimorchi (storico)

---

## [FIX] 2025-12-20 – Rimorchi: nome autista e timestamp coerenti
- Allineata lettura autista in `loadRimorchiStatus()` su campi reali:
  - `nomeAutista` (primario), fallback `autistaNome`/`autista`
- Rimosso comportamento “ora che scorre” dovuto a fallback `Date.now()`:
  - timestamp rimorchi AGGANCIATI = timestamp aggancio (da sessione)
  - timestamp rimorchi LIBERI = timestamp sgancio (da storico)

---

## [FEAT] 2025-12-20 – Controllo Mezzo con target
- `SetupMezzo` naviga a `/autisti/controllo?target=...` in base a modalità (motrice/rimorchio/entrambi).
- `ControlloMezzo` legge la query e salva `target` nel record.
- `homeEvents.loadHomeEvents()` mostra la targa corretta in “Controlli”:
  - rimorchio: targa rimorchio
  - motrice: targa motrice
  - entrambi: “MOTRICE + RIMORCHIO”

---

## TODO immediati (prossima chat)
1) LIVE: mostrare anche “ora corrente” nella card LIVE, mantenendo “ora aggancio” come dato stabile.
2) Modali: in Inbox mostrare solo 5 righe per card e “Vedi tutto” in modale.
3) Completare layout e navigazione pagine (rifornimenti, segnalazioni, controlli, richieste attrezzature) senza cambiare chiavi.
