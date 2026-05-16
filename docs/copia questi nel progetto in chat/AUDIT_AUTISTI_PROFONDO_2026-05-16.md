# AUDIT AUTISTI PROFONDO — 2026-05-16

**Tipo:** AUDIT READ-ONLY · **PROMPT:** 56 · **Autore:** Claude Code (Opus 4.7) · **Modalità:** lettura statica codice + audit storici come baseline.

> Audit profondo dei tre segmenti autisti: A) App autista madre (`src/autisti/`); B) Autisti Inbox NEXT (`src/autistiInbox/` + wrapper `src/next/autistiInbox/`); C) Autisti Admin (madre `AutistiAdmin.tsx` + nativo `NextAutistiAdminNative.tsx`).
>
> Riferimento alto livello: [docs/_live/AUDIT_NEXT_COMPLETO_2026-05-16.md](AUDIT_NEXT_COMPLETO_2026-05-16.md) cap. 5 — questo file approfondisce. Niente patch, niente piano d'intervento.

---

## Indice

- [Cap. 0 — Nota di metodo](#cap-0)
- [Cap. A — App autista madre (`src/autisti/`)](#cap-a)
- [Cap. B — Autisti Inbox NEXT](#cap-b)
- [Cap. C — Autisti Admin (madre + NEXT)](#cap-c)
- [Cap. D — Confronto trasversale](#cap-d)
- [Cap. E — Riepilogo BUG CONSOLIDATI](#cap-e)
- [Cap. F — Riepilogo VERIFICHE RUNTIME NECESSARIE](#cap-f)

---

<a id="cap-0"></a>
## 0. Nota di metodo

### 0.1 Perimetro

Letti integralmente: 11 file `src/autisti/`, 7 file `src/autistiInbox/` (escluso `AutistiAdmin.tsx` letto a chunk). Scoutati via Explore: 18 file `src/next/autisti/` + 8 file `src/next/autistiInbox/` (escluso `NextAutistiAdminNative.tsx` letto a chunk + mappato via Explore). I file Admin `AutistiAdmin.tsx` (~3000 righe) e `NextAutistiAdminNative.tsx` (~4100 righe) sono stati mappati via Explore agent dedicato (range righe, handler, scope, modali).

Writer/helper NEXT correlati già letti integralmente nel PROMPT 54/55 e usati come riferimento senza rilettura: `nextManutenzioneDaFareCreateWriter.ts`, `presaInCaricoSegnalazioneWriter.ts`, `agganciaSegnalazioneAManutenzioneEsistenteWriter.ts`, `nextChiusuraEventoWriter.ts`, `nextSegnalazioniWriter.ts`, `nextControlliWriter.ts`, `cicloLegame.ts`, `closureOrchestrator.ts`, `cloneWriteBarrier.ts`.

### 0.2 Verifica esecuzione PROMPT 55

POSITIVA. I file 05 ([docs/audit/2026-05-07_mappa_next_flussi_dati/05_AUDIT_AUTISTI_MADRE_NEXT_IMPORT_DEFINITIVO.md](../audit/2026-05-07_mappa_next_flussi_dati/05_AUDIT_AUTISTI_MADRE_NEXT_IMPORT_DEFINITIVO.md)) e 06 ([docs/audit/2026-05-07_mappa_next_flussi_dati/06_DIAGRAMMI_AUTISTI_E_PUNTI_APERTI.md](../audit/2026-05-07_mappa_next_flussi_dati/06_DIAGRAMMI_AUTISTI_E_PUNTI_APERTI.md)) hanno la sezione "Aggiornamento 2026-05-16" in testa, riga 3-9. PROMPT 55 chiuso correttamente in questa sessione.

### 0.3 Esclusioni e vincoli

- **Le 3 questioni già tracciate** (7 segnalazioni storiche da chiudere a mano, D2 punto ingresso UI `chiusa_da_evento`, T3 link cliccabile a segnalazione originale) NON compaiono come nuovi bug. Citate solo dove necessario al contesto.
- **Opzione α** ([src/components/AutistiEventoModal.tsx](../../src/components/AutistiEventoModal.tsx) shared con madre, intoccabile) rispettata.
- **Strategia 3a** (`@lavori` Firestore intoccabile, madre continua) rispettata.
- **Madre intoccabile**: per il segmento C la proposta è SOSTITUZIONE NEXT, mai patch sulla madre.
- Nessuna patch nemmeno descritta.

### 0.4 Convenzioni schema A1-A10

Ogni vista ha 10 punti rigorosi: A1 Identificazione, A2 Cosa vede, A3 Cosa può/non può fare, A4 Input/validazioni, A5 Scritture, A6 Feedback post-azione, A7 Aggancio col flusso NEXT a valle, A8 Friction visibili dal codice, A9 Bug (severità CRITICO/MEDIO/LOW), A10 Verifica runtime necessaria. Sul Segmento B aggiunte: B11 Doppie implementazioni, B12 Stato import definitivo.

---

<a id="cap-a"></a>
## A. App autista madre (`src/autisti/`) — 10 viste

> Riferimento wrapper NEXT: scout dell'Explore (vedi cap. B per la mappa wrapper). Nota generale: tutti i wrapper NEXT in `src/next/autisti/` per le pagine driver (Rifornimento, Segnalazioni, Richiesta attrezzature, Controllo) dichiarano esplicitamente **save no-op** con messaggio "Clone NEXT in sola lettura". Solo le viste di sessione (Login, Setup, Home, Cambio mezzo) scrivono il `localStorage` di sessione locale.

### A.1 — Login autista — [src/autisti/LoginAutista.tsx](../../src/autisti/LoginAutista.tsx)

**A1** File: `LoginAutista.tsx` (133 righe). Route madre `/autisti/login`. Wrapper NEXT [src/next/autisti/NextLoginAutistaNative.tsx](../../src/next/autisti/NextLoginAutistaNative.tsx) → `/next/autisti/login`. CSS `./autisti.css`.

**A2** Vede: titolo "Accesso Autisti", label "Badge", input numerico "Inserisci badge", bottone "ENTRA" (label "Verifica..." quando loading). Errore inline se badge invalido o vuoto. Nessun bottone di recupero password / cambio badge.

**A3** Può: digitare badge, clic ENTRA. Non può: recuperare badge dimenticato, cambiare badge, vedere lista badge ammessi. Nessun secondo fattore.

**A4** Input: `badge` (string da campo `type=number`). Validazione: solo `!badge.trim()` ([LoginAutista.tsx:50-52](../../src/autisti/LoginAutista.tsx#L50-L52)). Nessuna lunghezza minima/massima. Nessun check formato.

**A5** Effetti collaterali: legge `@colleghi` ([LoginAutista.tsx:59](../../src/autisti/LoginAutista.tsx#L59)). Trova collega via `String(c.badge) === badge.trim()` ([LoginAutista.tsx:60-62](../../src/autisti/LoginAutista.tsx#L60-L62)). Se trovato: `saveAutistaLocal({id, nome, badge})` su localStorage `@autista_attivo_local` ([LoginAutista.tsx:79](../../src/autisti/LoginAutista.tsx#L79)). Append evento `LOGIN_AUTISTA` su `@storico_eventi_operativi` ([LoginAutista.tsx:83-92](../../src/autisti/LoginAutista.tsx#L83-L92)) — questo è writer business reale.

**A6** Post-submit successo: navigate `/autisti/setup-mezzo`. Errore: testo inline "Badge non valido". Errore catch generico: "Errore durante il login". Nessun toast.

**A7** Downstream: l'evento `LOGIN_AUTISTA` finisce in `@storico_eventi_operativi` → letto dal Log Accessi (B.6) + Centro Controllo. Autista locale salvato → check da `AutistiGate` (vista A.0) ad ogni navigazione.

**A8** Friction:
- Badge mostrato in chiaro durante digitazione (nessun `type=password`).
- Validazione molto debole: badge di 1 sola cifra è accettato.
- "Badge non valido" non distingue tra badge inesistente e errore Firestore (catch generico).
- Nessun lock progressivo dopo N tentativi sbagliati.

**A9** Bug:
- **LOW** ([LoginAutista.tsx:40-47](../../src/autisti/LoginAutista.tsx#L40-L47)) — redirect automatico se "già loggato": controllo `if (autista && mezzo) navigate('/autisti/home')`. Se l'autista ha effettuato login ma non ha mezzo (logout incompleto), resta sulla pagina di login senza messaggio.

**A10** Verifica runtime: comportamento con badge inesistente in `@colleghi`; comportamento con `@colleghi` vuoto/non caricato; comportamento offline (signed-in anonimo non bloccato dalle Firestore rules).

### A.0 — AutistiGate — [src/autisti/AutistiGate.tsx](../../src/autisti/AutistiGate.tsx)

**A1** File: `AutistiGate.tsx` (149 righe). Vista invisibile (return `null`). Funzione: gateway che ridirige in base allo stato locale + revoche. Wrapper NEXT non identificato dedicato — funzione svolta dalla shell NEXT.

**A2** Nessun UI visibile. Mostra `window.alert` quando rileva revoca attiva con scope ([AutistiGate.tsx:68](../../src/autisti/AutistiGate.tsx#L68)).

**A3** Logica decisione:
- nessun autista → `/autisti/login`.
- nessun mezzo → `/autisti/setup-mezzo?mode=motrice`.
- nessun controllo mezzo obbligatorio del giorno → `/autisti/controllo`.
- ok → `/autisti/home`.

Più poll revoche ogni 15s + on focus/visibilitychange ([AutistiGate.tsx:128-138](../../src/autisti/AutistiGate.tsx#L128-L138)).

**A4** Nessun input. Stato preso da: `getAutistaLocal()`, `getMezzoLocal()`, `@autisti_sessione_attive` (Firestore via `getItemSync`), `@controlli_mezzo_autisti`, `getLastHandledRevokedAt`.

**A5** Scritture: aggiorna `@autista_revoca_local` via `setLastHandledRevokedAt` ([AutistiGate.tsx:64](../../src/autisti/AutistiGate.tsx#L64)). Aggiorna `@mezzo_attivo_autista_local` via `saveMezzoLocal`/`removeMezzoLocal` ([AutistiGate.tsx:44-62](../../src/autisti/AutistiGate.tsx#L44-L62)).

**A6** Alert nativo + navigate `replace`. Nessun toast custom, nessuna trasparenza sul perché del redirect (es. "controllo mezzo obbligatorio: vai a controllo" non viene esplicitato).

**A7** Cambi a `@autisti_sessione_attive` dall'admin (revoche scope MOTRICE/RIMORCHIO/TUTTO) si propagano qui entro 15s. Cambi su `@mezzo_attivo_autista_local` non sono visibili lato admin (sono locali al device).

**A8** Friction:
- **Poll a 15s** è inefficiente in batteria: appropriato sarebbe sse server-side push o stato visibilitychange-only.
- **Alert nativo** invece di modale brandizzata.
- **Reason text** della revoca opzionale ma quasi sempre vuoto ([AutistiGate.tsx:41,67](../../src/autisti/AutistiGate.tsx#L41-L67)).
- Manca **logout esplicito globale** se autista perde tutti i mezzi (`removeAutistaLocal` non chiamato — il driver resta loggato anche dopo revoca TUTTO).

**A9** Bug:
- **MEDIO** ([AutistiGate.tsx:30-32](../../src/autisti/AutistiGate.tsx#L30-L32)) — `(await getItemSync(SESSIONI_KEY)) || []`: se `getItemSync` restituisce `{value: [...]}` (shape document storage), il fallback `|| []` non scatta ma `Array.isArray(sessioniRaw)` torna `false` e la lista resta vuota → revoche silenziosamente ignorate. Pattern visto in molte altre viste (vedi cap. E).

**A10** Verifica runtime: comportamento con shape storage `{value: [...]}`; tempo effettivo di propagazione revoca (15s teorici, ma legati a tab attiva + Firestore latenza); collisione tra poll e navigate.

### A.2 — Setup mezzo — [src/autisti/SetupMezzo.tsx](../../src/autisti/SetupMezzo.tsx)

**A1** File: `SetupMezzo.tsx` (517 righe). Route madre `/autisti/setup-mezzo` + query `?mode=motrice|rimorchio`. Wrapper NEXT [src/next/autisti/NextSetupMezzoNative.tsx](../../src/next/autisti/NextSetupMezzoNative.tsx) → `/next/autisti/setup-mezzo`. CSS `./SetupMezzo.css`.

**A2** Vede: "Selezione Mezzo" / sotto-titoli "Motrice / Trattore" e "Rimorchio / Semirimorchio (opzionale)". Lista cards targa: targa, categoria badge, "Autista solito: <nome>". Warn rosso "IN USO da <nome>" se altra sessione ha già la targa. Banner d'errore "Motrice bloccata: stai facendo CAMBIO RIMORCHIO" se `mode=rimorchio` e motrice già locale. Bottone CONFERMA.

**A3** Può: scegliere motrice (obbligatoria), scegliere rimorchio (opzionale, "NESSUN RIMORCHIO" è opzione esplicita), forzare l'assegnazione anche con conflitto (window.confirm su 1° click "MOTRICE già in uso da X. Vuoi continuare?" [SetupMezzo.tsx:271](../../src/autisti/SetupMezzo.tsx#L271)). Non può: scegliere mezzo con categoria fuori whitelist filtro motrice/rimorchio ([SetupMezzo.tsx:140-160](../../src/autisti/SetupMezzo.tsx#L140-L160)).

**A4** Validazione: `targaCamion` obbligatoria ([SetupMezzo.tsx:243](../../src/autisti/SetupMezzo.tsx#L243)). Targa rimorchio facoltativa. Conflitto session = warning, non blocco.

**A5** Scritture (alla CONFERMA):
- **Revoca sessioni concorrenti**: per chi aveva la stessa targa, scrive `revoked: {by: "AUTO", at: now, scope, reason}` ([SetupMezzo.tsx:299-331](../../src/autisti/SetupMezzo.tsx#L299-L331)) → `@autisti_sessione_attive`.
- **Append evento operativo** (`INIZIO_ASSETTO` o `CAMBIO_ASSETTO`) → `@storico_eventi_operativi` ([SetupMezzo.tsx:357-383](../../src/autisti/SetupMezzo.tsx#L357-L383)).
- **setItemSync** `@autisti_sessione_attive` con nuova sessione ([SetupMezzo.tsx:386](../../src/autisti/SetupMezzo.tsx#L386)).
- **saveMezzoLocal** → `@mezzo_attivo_autista_local` ([SetupMezzo.tsx:389-394](../../src/autisti/SetupMezzo.tsx#L389-L394)).

**A6** Post-conferma: `nav(/autisti/controllo?target=...)` ([SetupMezzo.tsx:396-405](../../src/autisti/SetupMezzo.tsx#L396-L405)). Nessun toast di conferma. Nessuna prova visibile che le revoche scattate sui colleghi siano andate a buon fine.

**A7** Effetti downstream:
- Sessione attiva visibile in Centro Controllo Sinottica V2 e in `AutistiInboxHome` (B.0) → card "Sessioni attive".
- Evento operativo finisce in Log Accessi (B.6) e in cronologia mezzo (decisione 2026-05-09).
- Le revoche su colleghi scatenano flusso `AutistiGate` su quei dispositivi.

**A8** Friction:
- Conferma assegnazione anche con conflitto è un **window.confirm** ("MOTRICE già in uso… Vuoi continuare?") — l'autista può forzare assegnazione di un mezzo già occupato.
- Lista motrici/rimorchi è categorizzata via `includes("motrice")/"trattore"/"semirimorchio"/"biga"/"centina"/"vasca"/"pianale"` ([SetupMezzo.tsx:147-159](../../src/autisti/SetupMezzo.tsx#L147-L159)) — categorie atipiche o con typo cadono fuori.
- **Auto-suggerimento rimorchio** ([SetupMezzo.tsx:206-210](../../src/autisti/SetupMezzo.tsx#L206-L210)) usa `autistaNome` come stringa case-insensitive — fragile rispetto a varianti del nome.

**A9** Bug:
- **MEDIO** ([SetupMezzo.tsx:184-187, 187-189](../../src/autisti/SetupMezzo.tsx#L184-L189)) — letture `@mezzi_aziendali` / `@autisti_sessione_attive` con `Array.isArray(rawMezzi)`: stesso pattern fragile di A.0 — se shape è document `{value: [...]}`, lista vuota silente.
- **LOW** ([SetupMezzo.tsx:193-194](../../src/autisti/SetupMezzo.tsx#L193-L194)) — calcolo `preCamion` con espressione condizionale che ritorna sempre `mezzoLocal?.targaCamion`, qualunque sia `mode`. Codice morto. 

**A10** Verifica runtime: comportamento offline (revoca scattata localmente ma non sincronizzata Firestore); race con altri autisti che fanno setup simultaneamente; pattern shape `{value: [...]}` sulla `@mezzi_aziendali`.

### A.3 — Home autista — [src/autisti/HomeAutista.tsx](../../src/autisti/HomeAutista.tsx)

**A1** File: `HomeAutista.tsx` (493 righe). Route madre `/autisti/home`. Wrapper NEXT [src/next/autisti/NextHomeAutistaNative.tsx](../../src/next/autisti/NextHomeAutistaNative.tsx) → `/next/autisti/home`.

**A2** Vede: header con nome+badge autista, bottone Logout. Sezione "Mezzo attivo" con Motrice e (se presente) Rimorchio. 7 bottoni azione: Rifornimento, Segnalazioni, Gomme, Richiesta attrezzature, AGGANCIA RIMORCHIO (solo se manca), SGANCIA MOTRICE (solo se motrice presente), Cambio mezzo. Modale di sgancio con luogo (STABIO/MEV/ALTRO).

**A3** Può: navigare a tutte le pagine driver, sganciare motrice (con luogo obbligatorio), agganciare rimorchio, cambiare mezzo, logout. Non può: vedere storia del mezzo, segnalazioni precedenti, controlli precedenti dalla home (nessun riepilogo).

**A4** Input nella modale sgancio: `sgancioLuogoPreset` (STABIO/MEV/ALTRO) obbligatorio; `sgancioLuogoAltro` obbligatorio se "ALTRO" ([HomeAutista.tsx:257-260](../../src/autisti/HomeAutista.tsx#L257-L260)).

**A5** Scritture:
- **Logout** ([HomeAutista.tsx:221-253](../../src/autisti/HomeAutista.tsx#L221-L253)): append evento `LOGOUT_AUTISTA` su `@storico_eventi_operativi`; rimuove la sessione dall'autista da `@autisti_sessione_attive` (filter+set); `removeAutistaLocal`/`removeMezzoLocal`/`clearLastHandledRevokedAt`. Tutto sincrono, niente conferma.
- **Sgancio motrice** ([HomeAutista.tsx:255-338](../../src/autisti/HomeAutista.tsx#L255-L338)): aggiorna `@autisti_sessione_attive` (`targaMotrice: null`); append `CAMBIO_ASSETTO` con `prima/dopo/luogo`; `saveMezzoLocal({targaCamion: null})`; nav `/autisti/setup-mezzo?mode=motrice`.
- Poll revoche ogni 15s + on focus → revoca scope MOTRICE/RIMORCHIO/TUTTO → applica e ridirige (logica simile a `AutistiGate`).
- Coerenza live/locale ([HomeAutista.tsx:144-172](../../src/autisti/HomeAutista.tsx#L144-L172)): se sessione live ha motrice/rimorchio null ma il locale ce l'ha, allinea locale e ridirige a setup.

**A6** Logout: redirect `/autisti/login`. Sgancio: redirect `/autisti/setup-mezzo?mode=motrice`. Alert nativi per errori. Nessun toast di successo.

**A7** Downstream: ogni azione finisce in `@storico_eventi_operativi` → visibile in Log Accessi + cronologia mezzo + Centro Controllo. Coerenza live/locale è la mitigazione client-side delle revoche admin.

**A8** Friction:
- **Logout silenzioso** (nessuna conferma "Sei sicuro?"). Click accidentale → perdita stato.
- **Sgancio motrice** apre modale STABIO/MEV/ALTRO ma non spiega cosa cambia per il rimorchio (resta agganciato? Sì, ma non è dichiarato in UI).
- **Modale sgancio inline-styled** ([HomeAutista.tsx:408-488](../../src/autisti/HomeAutista.tsx#L408-L488)) — ~80 righe di inline style invece di CSS dedicato.
- Manca cronologia delle ultime sessioni in home (autista non sa che ieri ha agganciato X).

**A9** Bug:
- **MEDIO** ([HomeAutista.tsx:90-91](../../src/autisti/HomeAutista.tsx#L90-L91)) — `(await getItemSync(SESSIONI_KEY)) || []` shape `{value: [...]}` non gestito: la coerenza live/locale può saltare silenziosamente.
- **LOW** ([HomeAutista.tsx:241-244](../../src/autisti/HomeAutista.tsx#L241-L244)) — la pulizia `@autisti_sessione_attive` al logout filtra TUTTE le sessioni dell'autista: se l'autista ha sessioni "fantasma" (multi-device) le perde silenziosamente.

**A10** Verifica runtime: tempi reali di propagazione revoche fra device; comportamento se Firestore offline durante logout (alcune scritture vanno, altre no — chi rimedia?); UX della modale di sgancio su mobile (overflow).

### A.4 — Cambio mezzo (autista) — [src/autisti/CambioMezzoAutista.tsx](../../src/autisti/CambioMezzoAutista.tsx)

**A1** File: `CambioMezzoAutista.tsx` (409 righe). Route madre `/autisti/cambio-mezzo`. CSS `./CambioMezzoAutista.css`.

**A2** Vede: titolo dinamico "Cambio Rimorchio" o "Cambio Motrice"; sottotitolo "Attuale: <targa>"; switch modalità RIMORCHIO/MOTRICE; sezione "Luogo" (MEV/STABIO/ALTRO + textbox); per RIMORCHIO sezione "Stato carico" (PIENO/PARZIALE/VUOTO); checklist "Condizioni generali" (freni/gomme/perdite) + "Condizioni specifiche" (botole/cinghie/stecche/tubi) solo per RIMORCHIO; bottone INDIETRO; bottone CONFERMA.

**A3** Può: scegliere modalità (default RIMORCHIO), luogo, stato carico, condizioni. Conferma sgancio rimorchio (resta in home con sola motrice) o cambio motrice (porta a setup motrice). Non può: cambiare entrambi insieme.

**A4** Validazione minima:
- Modalità rimorchio: serve `cur.targaRimorchio` ([CambioMezzoAutista.tsx:148-150](../../src/autisti/CambioMezzoAutista.tsx#L148-L150)).
- Modalità motrice: serve `cur.targaMotrice`.
- `luogo` obbligatorio. Se ALTRO: `luogoAltro` non vuoto.

Tutte le condizioni hanno default `true` (= tutto OK). Non c'è check su "non hai toccato niente, sei sicuro?" — il default OK passa così com'è.

**A5** Scritture (RIMORCHIO ramo):
- Append `CAMBIO_ASSETTO` su `@storico_eventi_operativi` con `condizioni` ([CambioMezzoAutista.tsx:178-202](../../src/autisti/CambioMezzoAutista.tsx#L178-L202)).
- `@autisti_sessione_attive` aggiornata (rimorchio: null) ([CambioMezzoAutista.tsx:205-211](../../src/autisti/CambioMezzoAutista.tsx#L205-L211)).
- `saveMezzoLocal({targaCamion, targaRimorchio: null})` ([CambioMezzoAutista.tsx:213-218](../../src/autisti/CambioMezzoAutista.tsx#L213-L218)).
- Redirect `/autisti/home`.

MOTRICE ramo ([CambioMezzoAutista.tsx:227-249](../../src/autisti/CambioMezzoAutista.tsx#L227-L249)): aggiorna sessione attiva (motrice: null); `saveMezzoLocal({targaCamion: null, targaCamionPrima: <old>, targaRimorchio})`; redirect `/autisti/setup-mezzo?mode=motrice`. **NESSUNA scrittura di evento CAMBIO_ASSETTO in questo ramo** — incoerente con ramo RIMORCHIO.

**A6** Redirect senza toast/feedback. Pulsante INDIETRO usa `navigate(-1)`.

**A7** Downstream: condizioni mezzo finiscono nel `payload` di `@storico_eventi_operativi` — utili per audit ma non hanno una vista dedicata. Nessuna conversione automatica in segnalazione/controllo se `freni:false`.

**A8** Friction:
- **Default true per tutte le condizioni**: autista può confermare senza toccare nulla, registrando "tutto OK" anche se non ha verificato. Pattern pericoloso.
- **Asimmetria scrittura evento**: ramo RIMORCHIO scrive `CAMBIO_ASSETTO`, ramo MOTRICE NO — incoerenza che lascia il cambio motrice senza traccia con `condizioni` (vedi A9).
- **Stato carico solo per RIMORCHIO**: ok dominio, ma UI non lo spiega chiaramente.

**A9** Bug:
- **MEDIO** ([CambioMezzoAutista.tsx:227-249](../../src/autisti/CambioMezzoAutista.tsx#L227-L249)) — **Cambio motrice non scrive evento `CAMBIO_ASSETTO`**: l'admin/Centro Controllo non sa cosa è successo. Il nuovo `INIZIO_ASSETTO` verrà scritto da SetupMezzo al setup successivo, ma le `condizioni` raccolte qui (freni/gomme/perdite) vengono perse.
- **LOW** ([CambioMezzoAutista.tsx:98-99](../../src/autisti/CambioMezzoAutista.tsx#L98-L99)) — pattern shape `{value}` non gestito per `@autisti_sessione_attive`.

**A10** Verifica runtime: cosa vede l'admin dopo un cambio motrice? Si recuperano le condizioni? Test del bug MEDIO con ramo MOTRICE.

### A.5 — Controllo mezzo — [src/autisti/ControlloMezzo.tsx](../../src/autisti/ControlloMezzo.tsx)

**A1** File: `ControlloMezzo.tsx` (212 righe). Route madre `/autisti/controllo` + query `?target=motrice|rimorchio|entrambi`.

**A2** Vede: titolo "CONTROLLO MEZZO"; subtitle "Verifica iniziale obbligatoria prima di iniziare il lavoro"; sezione target con domanda "Stai controllando: MOTRICE o RIMORCHIO?" + bottoni; sub-bottone ENTRAMBI (se motrice+rimorchio); riepilogo targhe attive; titolo "Verifica rapida"; checklist 4 voci (GOMME/FRENI/LUCI/PERDITE, tutte default `true`); textarea Note opzionale; bottone CONFERMA CONTROLLO.

**A3** Può: scegliere target (lock se query string locked); flag check (toggle); aggiungere note; confermare. Non può: scegliere singolo asse della gomma (vista non granulare — la granularità avviene su Segnalazioni A.6); scattare foto del controllo.

**A4** Validazione:
- Se target=rimorchio ma no targaRimorchio: alert "Seleziona un rimorchio valido" ([ControlloMezzo.tsx:86-88](../../src/autisti/ControlloMezzo.tsx#L86-L88)).
- Se target=entrambi ma manca motrice o rimorchio: alert "Per 'entrambi' servono motrice e rimorchio" ([ControlloMezzo.tsx:90-95](../../src/autisti/ControlloMezzo.tsx#L90-L95)).
- Niente check sui campi check: default tutto OK passa silente.

**A5** Scritture: append record su `@controlli_mezzo_autisti` ([ControlloMezzo.tsx:101-117](../../src/autisti/ControlloMezzo.tsx#L101-L117)) — campi `id`, `autistaNome`, `badgeAutista`, `targaCamion`, `targaRimorchio`, `target`, `check`, `note`, `obbligatorio:true`, `timestamp`. Redirect `/autisti/home`.

**A6** Redirect immediato, nessun toast. Se autista cliccava per sbaglio CONFERMA, il record finisce in inbox come "OK" (nessun KO se default true) → admin non avrà segnali.

**A7** Downstream: il record entra in `@controlli_mezzo_autisti` → letto da Inbox controlli (B.2), Sinottica V2 CC, Dossier mezzo. Conversione in manutenzione daFare avviene SOLO dall'admin (segmento C) tramite `createManutenzioneDaFareFromControllo`. **L'autista non può "annullare" un controllo errato** (no delete, no edit).

**A8** Friction:
- **Default true ovunque**: copia/incolla di SetupMezzo + CambioMezzo. Autista può confermare senza verificare. Pattern critico.
- **Nessuna foto sul controllo** anche se è il momento ideale per documentare anomalie.
- **Note opzionali** anche quando KO: dovrebbe essere obbligatoria almeno una nota se almeno un check è KO.
- **No conferma se default tutto OK** → autista distratto potrebbe registrare un OK senza guardare. Manca prompt "Sei sicuro? Tutti i check sono OK?".
- **Non c'è feedback** che il controllo è stato registrato — solo redirect.

**A9** Bug:
- **MEDIO** ([ControlloMezzo.tsx:98-99](../../src/autisti/ControlloMezzo.tsx#L98-L99)) — `getItemSync(CONTROLLI_KEY)` shape `{value}` non gestita.
- **LOW** ([ControlloMezzo.tsx:33-38](../../src/autisti/ControlloMezzo.tsx#L33-L38)) — `obbligatorio:true` hard-coded: ogni controllo è "obbligatorio" anche quelli volontari. Distinzione mancante.

**A10** Verifica runtime: percentuale controlli che escono con check=tutti OK e nessuna nota in produzione (proxy della friction "default true"); UX del flusso forzato da AutistiGate (autista voleva andare a Rifornimento, viene mandato a Controllo).

### A.6 — Segnalazioni — [src/autisti/Segnalazioni.tsx](../../src/autisti/Segnalazioni.tsx)

**A1** File: `Segnalazioni.tsx` (520 righe). Route madre `/autisti/segnalazioni`. Wrapper NEXT [src/next/autisti/NextAutistiSegnalazioniPage.tsx](../../src/next/autisti/NextAutistiSegnalazioniPage.tsx) → `/next/autisti/segnalazioni` (save no-op).

**A2** Vede: titolo "Segnalazione manutenzione"; subtitle con motrice/rimorchio/autista; alert messages (se ambito non agganciato, ecc); sezione "Dove è il problema" (MOTRICE/RIMORCHIO toggle, rimorchio disabled se nessun rimorchio); sezione "Tipo problema" (chip grid: MOTORE, FRENI, GOMME, IDRAULICO, ELETTRICO, ALTRO); se tipo=GOMME → sezione "Seleziona asse/posizione" + "Problema gomma" (forata/usurata/da_controllare/altro); sezione "Foto (opzionale)" con bottone + AGGIUNGI FOTO (max 3, grid thumb con RIMUOVI); sezione "Descrizione" (obbligatoria) con placeholder dinamico per tipo; sezione "Note (opzionale)"; data corrente; bottone INVIA SEGNALAZIONE / Indietro.

**A3** Può: scegliere ambito, tipo problema, dettagli gomma (asse + problema), descrizione, note, foto. Non può: scegliere "entrambi" come ambito (motrice + rimorchio insieme); allegare PDF/audio; salvare in bozza; vedere segnalazioni precedenti dello stesso mezzo.

**A4** Validazione ([Segnalazioni.tsx:220-243](../../src/autisti/Segnalazioni.tsx#L220-L243)):
- `ambito` obbligatorio.
- `tipo` obbligatorio.
- `descrizione.trim()` non vuota.
- Se tipo=GOMME: `posizioneGomma` + `problemaGomma` obbligatori.
- Foto: max 3 ([Segnalazioni.tsx:248-254](../../src/autisti/Segnalazioni.tsx#L248-L254)).

Errori mostrati inline + alert globale "Manca: <lista>".

**A5** Scritture:
- **Upload foto su Storage** ([Segnalazioni.tsx:245-292](../../src/autisti/Segnalazioni.tsx#L245-L292)): `autisti/segnalazioni/<baseId>/<ts>_<index>.<ext>`. `uploadBytes` + `getDownloadURL`. URL salvati in stato locale `foto`.
- **Append record** su `@segnalazioni_autisti_tmp` ([Segnalazioni.tsx:312-350](../../src/autisti/Segnalazioni.tsx#L312-L350)). Campi: `id`, `ambito`, `mezzoId`, `targa`, `categoriaMezzo`, `targaCamion`, `targaRimorchio`, `autistaId`, `autistaNome`, `badgeAutista`, `tipoProblema`, `posizioneGomma`, `problemaGomma`, `descrizione`, `note`, `fotoUrls`, `fotoStoragePaths`, `data` (timestamp), `stato:"nuova"`, `letta:false`, `flagVerifica:false`, `motivoVerifica:null`.

Reset foto+recordId post-submit. Redirect `/autisti/home`.

**A6** Successo: navigate `/autisti/home`. Errore: `setAlertMsg("Errore salvataggio. Riprova.")`. Nessun toast di conferma sui passi intermedi (upload foto OK?).

**A7** Downstream: record → `@segnalazioni_autisti_tmp` → letto da:
- Inbox Segnalazioni (B.1) per l'admin.
- Centro Controllo Sinottica V2 e Archivio Storico.
- Dossier mezzo (sezione storia).
- Admin "Crea lavoro/manutenzione daFare" (segmento C closeup B).

**A8** Friction:
- **Foto caricate su Storage PRIMA del submit** → se l'autista annulla, le foto restano orfane su Storage (`uploadBytes` non rollback).
- **Foto max 3**: hardcoded ([Segnalazioni.tsx:249-253](../../src/autisti/Segnalazioni.tsx#L249-L253)). Non c'è UI che lo spiega prima di caricare.
- **Posizioni gomma calcolate da categoria stringa** ([Segnalazioni.tsx:40-55](../../src/autisti/Segnalazioni.tsx#L40-L55)): se categoria atipica → fallback ["asse1", "asse2"] silente.
- **Descrizione obbligatoria** ma placeholder dinamico copre solo 5 tipi: tipo "altro" mostra placeholder generico.
- **`fotoUploading`** non blocca il bottone "+ AGGIUNGI FOTO" durante l'upload (l'autista può rifare upload doppio).
- **`recordId` riusato fra upload e save** ma riassegnato a `null` al successo ([Segnalazioni.tsx:353](../../src/autisti/Segnalazioni.tsx#L353)) — se l'utente fa upload, **non clicca INVIA**, e cambia idea su un'altra segnalazione, le foto precedenti restano riferite al `recordId` precedente.

**A9** Bug:
- **MEDIO** ([Segnalazioni.tsx:283](../../src/autisti/Segnalazioni.tsx#L283)) — upload foto: `path = autisti/segnalazioni/<baseId>/<ts>_<foto.length + i>.<ext>`. `foto.length` cresce mentre il loop scrive; più foto caricate in un singolo gesto possono usare path duplicato se l'utente clicca due volte rapido (race).
- **MEDIO** ([Segnalazioni.tsx:147](../../src/autisti/Segnalazioni.tsx#L147)) — `@mezzi_aziendali` `Array.isArray(list)` non gestisce shape `{value}`.
- **LOW** ([Segnalazioni.tsx:308](../../src/autisti/Segnalazioni.tsx#L308)) — `targaSelezionata` può essere `null` se `ambito="motrice"` e `targaMotrice` non c'è — ma l'arrivo qui implica AutistiGate ha verificato → improbabile, ma il record salvato avrebbe `targa:null`.

**A10** Verifica runtime: orfani Storage `autisti/segnalazioni/*` per submit abortiti; comportamento upload foto in offline; tempo medio compilazione (proxy friction).

### A.7 — Rifornimento — [src/autisti/Rifornimento.tsx](../../src/autisti/Rifornimento.tsx)

**A1** File: `Rifornimento.tsx` (380 righe). Route madre `/autisti/rifornimento`. Wrapper NEXT [src/next/autisti/NextAutistiRifornimentoPage.tsx](../../src/next/autisti/NextAutistiRifornimentoPage.tsx) → `/next/autisti/rifornimento` (save no-op).

**A2** Vede: titolo "Rifornimento"; sezione "Targa mezzo" (read-only + checkbox "Confermo che la targa è corretta" + link "Targa errata? Cambia mezzo"); toggle CARAVATE/DISTRIBUTORE; input Km/Litri/data corrente; se DISTRIBUTORE: piccoli toggle metodo pagamento (piccadilly/eni/contanti) + paese (ITALIA/SVIZZERA) + se contanti: input Importo; textarea Note; bottone "Salva rifornimento" / "Indietro".

**A3** Può: scegliere tipo, metodo, paese, inserire km/litri/importo/note. Confermare. Non può: salvare senza confermare la targa; fare rifornimento per un mezzo diverso da quello attivo (deve passare da Cambio mezzo).

**A4** Validazione ([Rifornimento.tsx:118-138](../../src/autisti/Rifornimento.tsx#L118-L138)):
- `targaConfirmed` obbligatorio.
- `km` obbligatorio.
- `litri` obbligatorio + parseable + > 0.
- Se DISTRIBUTORE: `metodo` + `paese` obbligatori; se metodo=contanti: `importo` obbligatorio.

Conferma soft via alert nativo ([Rifornimento.tsx:147-154](../../src/autisti/Rifornimento.tsx#L147-L154)):
- Litri > 1000 → "Quantità carburante molto alta. Confermi?" + bottoni Conferma/Modifica.
- Km < 1000 → "I km inseriti sembrano bassi. Confermi?" + bottoni Conferma/Modifica.

Il `forceConfirm` flagga la segnalazione con `flagVerifica:true` ([Rifornimento.tsx:180](../../src/autisti/Rifornimento.tsx#L180)).

**A5** Scritture:
- **setItemSync** su `@rifornimenti_autisti_tmp` (append) ([Rifornimento.tsx:185-187](../../src/autisti/Rifornimento.tsx#L185-L187)).
- **setDoc** Firestore `storage/@rifornimenti` (dossier ufficiale) con `buildDossierItem` ([Rifornimento.tsx:189-205](../../src/autisti/Rifornimento.tsx#L189-L205)).

Doppio writer: tmp + dossier. **Eccezione architetturale rispetto a Segnalazioni/Controllo** (che scrivono solo tmp e attendono consolidamento admin).

**A6** Successo: navigate `/autisti/home`. Errore: `setShowAlert("Errore salvataggio rifornimento")`. Niente toast di conferma successo.

**A7** Downstream: TMP → letto da Inbox + Admin per consolidamento (ma il record è già in dossier ufficiale, quindi il consolidamento admin è ridondante). Dossier → letto da Dossier mezzo, Centro Controllo, Chat IA. Soggetto a Catalog Validator Zero-Invenzioni.

**A8** Friction:
- **Doppio salvataggio (tmp + dossier)** non transazionale: se tmp riesce e dossier fallisce, il record è in tmp ma non in dossier (state divergenza). Nessun rollback ([Rifornimento.tsx:209-212](../../src/autisti/Rifornimento.tsx#L209-L212) — catch generico).
- **`forceConfirm` semantica ambigua**: significa "ho già confermato l'alert" + scrive `flagVerifica:true`. Il flag resta nel record per sempre — l'admin in Inbox lo vede come "da verificare" anche per record correttamente confermati.
- **Importo obbligatorio solo per contanti**: ma è proprio per piccadilly/eni che servirebbe il controllo importo (cross-check con fattura).
- **Date `Date.now()`** per `data` — la regola `TIMESTAMP-MAI-DA-CLICK` permette `Date.now()` solo per azioni utente esplicitamente temporali. Il rifornimento È un'azione temporale, quindi corretto.
- **Targa non modificabile inline**: l'unica via per cambiare targa è ri-fare Cambio mezzo. UX scomoda.

**A9** Bug:
- **CRITICO** ([Rifornimento.tsx:189-205](../../src/autisti/Rifornimento.tsx#L189-L205)) — race condition sul dossier `storage/@rifornimenti`: il `getDoc`+merge+`setDoc` è una read-modify-write non atomica. Due autisti che fanno rifornimento contemporaneamente possono perdere uno dei due record dossier.
- **MEDIO** ([Rifornimento.tsx:174](../../src/autisti/Rifornimento.tsx#L174)) — `Number(km.replace(/\./g, ""))`: input formattato con punti come separatori migliaia. Se l'utente inserisce "1.5" intendendo 1.5 km, il replace toglie il punto → `15` km. Funziona OK su input ben formattati ma rischio confusione utente.
- **MEDIO** ([Rifornimento.tsx:175](../../src/autisti/Rifornimento.tsx#L175)) — `parseDecimal(litri) ?? NaN`: se litri vuoti → `NaN`, e poi salvato a Firestore. Il record arriva con `litri: NaN` (non valido JSON serializzabile bene). 

**A10** Verifica runtime: incidenza race dossier in produzione; flag `flagVerifica:true` quanti record reali ha; aliasing del separatore migliaia su input mobile.

### A.8 — Richiesta attrezzature — [src/autisti/RichiestaAttrezzature.tsx](../../src/autisti/RichiestaAttrezzature.tsx)

**A1** File: `RichiestaAttrezzature.tsx` (252 righe). Route madre `/autisti/richiesta-attrezzature`. Wrapper NEXT [src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx](../../src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx) → `/next/autisti/richiesta-attrezzature` (save no-op).

**A2** Vede: header con INDIETRO + "Richiesta attrezzature"; sezione meta (Motrice/Rimorchio/Autista); textarea Messaggio (placeholder "Cosa ti serve?"); sezione "Foto (opzionale)" con bottone + Aggiungi foto (1 sola foto, no multi); errore inline; bottone INVIA RICHIESTA.

**A3** Può: scrivere messaggio, allegare 1 foto, inviare. Non può: allegare PDF, allegare audio, scegliere categoria (cosa serve "tipo"), salvare bozze.

**A4** Validazione minima: `testo.trim().length >= 3` ([RichiestaAttrezzature.tsx:118-122](../../src/autisti/RichiestaAttrezzature.tsx#L118-L122)). Foto opzionale.

**A5** Scritture:
- Upload foto se presente ([RichiestaAttrezzature.tsx:50-95](../../src/autisti/RichiestaAttrezzature.tsx#L50-L95)) → `autisti/richieste-attrezzature/<recordId>/<ts>.<ext>`. **Se sostituisce foto precedente**: `deleteObject` su quella vecchia ([RichiestaAttrezzature.tsx:75-81](../../src/autisti/RichiestaAttrezzature.tsx#L75-L81)).
- Append record su `@richieste_attrezzature_autisti_tmp` ([RichiestaAttrezzature.tsx:128-150](../../src/autisti/RichiestaAttrezzature.tsx#L128-L150)). Campi: `id`, `testo`, `autistaNome`, `badgeAutista`, `targaCamion`, `targaRimorchio`, `fotoUrl`, `fotoStoragePath`, `timestamp`, `stato:"nuova"`, `letta:false`.

**A6** Successo: `window.alert("Richiesta inviata")` ([RichiestaAttrezzature.tsx:155](../../src/autisti/RichiestaAttrezzature.tsx#L155)) → navigate `/autisti/home`. Errore: setErrore inline.

**A7** Downstream: `@richieste_attrezzature_autisti_tmp` → letto da Inbox Richieste (B.4), Admin tab attrezzature. **Nessuna conversione automatica in ordine materiali**: l'admin deve copiare a mano in Materiali da ordinare.

**A8** Friction:
- **Foto singola** vs Segnalazioni che ne ammette 3 — incoerenza UX fra viste affini.
- **Foto sostituita = delete physical immediato** ([RichiestaAttrezzature.tsx:75-81](../../src/autisti/RichiestaAttrezzature.tsx#L75-L81)): se l'utente cambia idea e vuole rimettere la prima foto, deve ri-caricare. Niente undo.
- **`window.alert("Richiesta inviata")`** → blocca il flusso UI con alert nativo invece di toast.
- **Nessuna categoria** ("attrezzo di lavoro" vs "DPI" vs "materiale consumo") — l'admin deve interpretare il testo.
- **Nessuna urgenza** (urgente/normale).

**A9** Bug:
- **MEDIO** ([RichiestaAttrezzature.tsx:91-93](../../src/autisti/RichiestaAttrezzature.tsx#L91-L93)) — `setFotoUploading(false)` nel finally MA `e.target.value = ""` può fallire se il componente è stato smontato durante l'upload (errore React "Can't perform a React state update on an unmounted component"). 
- **LOW** — `recordId` riusato fra upload e save MA non resettato post-submit. Se l'utente fa una richiesta, poi NON clicca INVIA e ne fa una seconda, il secondo record può "ereditare" `recordId` precedente. Mitigato dal `setRecordId(null)` solo in ramo successo.

**A10** Verifica runtime: orfani Storage; numero medio di richieste duplicate (proxy del bug LOW); UX dell'alert nativo.

### A.9 — Gomme autista (modal) — [src/autisti/GommeAutistaModal.tsx](../../src/autisti/GommeAutistaModal.tsx)

**A1** File: `GommeAutistaModal.tsx` (749 righe). Modal accessibile dalla Home autista (bottone "Gomme"). Wrapper NEXT [src/next/autisti/NextGommeAutistaModal.tsx](../../src/next/autisti/NextGommeAutistaModal.tsx) (save no-op).

**A2** Vede: header modale "Gomme" + bottone Chiudi; sezione Target (MOTRICE/RIMORCHIO) + targa corrispondente; sezione Categoria (display read-only); sezione Modalità (CAMBIO/ROTAZIONE, disabled se categoria non supporta); input KM; se CAMBIO: sezione Tipo intervento (SOSTITUZIONE/RIPARAZIONE) + bottone "Seleziona gomme" che apre ModalGomme (sub-modal con SVG truck); se ROTAZIONE: domanda "Hai spostato assi?" (SI/NO), se SI → select "Schema rotazione" (es. "1<->2"), poi domanda "Hai sostituito anche delle gomme?" (SI/NO), se SI → bottone "Seleziona gomme".

**A3** Può: registrare cambio gomme con dettaglio asse + marca + tipo; rotazione assi con o senza cambio. Non può: associare a manutenzione esistente (avviene dall'admin via aggancio PROMPT 47); annullare un cambio gomme registrato (solo admin); fotografare gomme.

**A4** Validazione complessa ([GommeAutistaModal.tsx:234-255](../../src/autisti/GommeAutistaModal.tsx#L234-L255)):
- `targetOk`: targa presente.
- `categoriaOk`: categoria + geomKey risolti.
- `kmValid`: numero > 0.
- `cambioOk` (modalità cambio): `gommeData.gommeIds.length > 0`.
- `rotazioneOk` (modalità rotazione): `rotazioneSchema` selezionato + `haSostituitoGomme !== null` + se SI: gomme selezionate.

`canSave = targetOk && categoriaOk && kmValid && (cambioOk || rotazioneOk)`.

**A5** Scritture:
- Append record su `@cambi_gomme_autisti_tmp` ([GommeAutistaModal.tsx:343-349](../../src/autisti/GommeAutistaModal.tsx#L343-L349)). Campi ricchi: `id`, `targetType`, `targetTarga`, `categoria`, `km`, `data`, `marca`, `tipo`, `gommeIds`, `asseId`, `asseLabel`, `rotazioneSchema`, `rotazioneText`, `rotazioneAssi`, `assiConCambioGomme`, `autista{id,nome,badge}`, `contesto{targaCamion,targaRimorchio}`, `stato:"nuovo"`, `letta:false`. **Niente upload foto**.

**A6** Reset campi + `onSaved?.()` + `onClose()`. Nessun toast/alert.

**A7** Downstream: `@cambi_gomme_autisti_tmp` → letto da Inbox Gomme (B.3) → admin/Centro Controllo → `IMPORTA` consolida in `@gomme_eventi` (dossier ufficiale). Da `@gomme_eventi` viene poi letto da:
- Dossier Gomme mezzo.
- Macchina chiusura ciclo eventi 2026-05-14 (`chiudiManutenzione/Segnalazione/ControlloDaEvento` con `chiusuraDi:"gomme_evento"`).
- Aggancio retroattivo PROMPT 47 da Centro Controllo Archivio Storico (chiude segnalazione gomme pendente collegandola al cambio gomme).

**A8** Friction:
- **6 livelli di scelta sequenziale** per la modalità rotazione: target → modalità → km → spostato? → schema → sostituito? → seleziona. UX pesante.
- **Niente foto** per documentare lo stato post-cambio (verifica controllo qualità impossibile).
- **`tipo` ambiguo**: per cambio è "sostituzione"/"riparazione", per rotazione è hard-coded "rotazione" ([GommeAutistaModal.tsx:306](../../src/autisti/GommeAutistaModal.tsx#L306)) — vista downstream deve interpretare.
- **Categorie supportate hard-coded** ([GommeAutistaModal.tsx:47-110](../../src/autisti/GommeAutistaModal.tsx#L47-L110)): se la categoria del mezzo non è in lista → `config.assi` vuoto e l'autista vede sub-modal ModalGomme senza ruote.
- **Validazione asincrona modal-aperta**: se durante la modale altri device cambiano la sessione attiva, il `mezzoLocal` resta stantio.

**A9** Bug:
- **MEDIO** ([GommeAutistaModal.tsx:283-291](../../src/autisti/GommeAutistaModal.tsx#L283-L291)) — `rotazioneAssiValue` parsato da `rotazioneSchema` con regex `/(\d)\s*<->\s*(\d)/`: se schema fosse `"1<->2"` con `<->` come stringa di 4 caratteri (corrispondente al display `↔`), funziona; ma se l'utente vede `↔` e modifica → la regex non matcha → `rotazioneAssiValue: null` silente.
- **LOW** ([GommeAutistaModal.tsx:174](../../src/autisti/GommeAutistaModal.tsx#L174)) — `getItemSync("@mezzi_aziendali")` shape `{value: [...]}` gestito (line 174-178), MA solo qui — pattern inconsistente con altre viste.

**A10** Verifica runtime: incidenza categorie non supportate; tempo medio compilazione (proxy friction); coerenza dei record TMP non importati ancora (da B.3 + cap. C).

---

<a id="cap-b"></a>
## B. Autisti Inbox NEXT — 7 viste

> Lo stato funzionale Inbox NEXT è documentato in [docs/audit/2026-05-07_mappa_next_flussi_dati/05_AUDIT_AUTISTI_MADRE_NEXT_IMPORT_DEFINITIVO.md](../audit/2026-05-07_mappa_next_flussi_dati/05_AUDIT_AUTISTI_MADRE_NEXT_IMPORT_DEFINITIVO.md) (aggiornato 2026-05-16). Le viste madre `src/autistiInbox/*` sono letture pure: usano `getItemSync` ma non scrivono i dataset business (eccetto `nascostoInArchivio` via scope barrier dedicato). Le wrapper/native NEXT in `src/next/autistiInbox/*` mantengono la stessa semantica con switch di path home/back se `isCloneRuntime()`.

### B.0 — Inbox Home — [src/autistiInbox/AutistiInboxHome.tsx](../../src/autistiInbox/AutistiInboxHome.tsx)

**A1** File: `AutistiInboxHome.tsx` (940 righe). Wrapper NEXT [src/next/autistiInbox/NextAutistiInboxHomeNative.tsx](../../src/next/autistiInbox/NextAutistiInboxHomeNative.tsx) — wrapper con `cloneConfig` per override path. Route madre `/autisti-inbox`. Route NEXT `/next/autisti-inbox`. CSS `./AutistiInboxHome.css`.

**A2** Vede: header con logo, h1 "Autisti Inbox (admin)" + menu dot-dot-dot (link "Centro rettifica dati (admin)" → `/autisti-admin`); tab buttons (Rifornimenti, Segnalazioni con badge NUOVE se ce ne sono, Controllo mezzo, Cambio mezzo, Richiesta attrezzature); date bar (< [data] >); aside con `SessioniAttiveCard`; griglia di 7 card: Rifornimenti, Segnalazioni (con vedi-tutto), Controllo mezzo (split colonna KO/OK), Cambio mezzo, Log Accessi (preview 3), Gomme (preview 5 con badge NUOVE), Richiesta attrezzature.

**A3** Può: navigare il giorno (precedente/successivo/date picker); aprire dettaglio evento (modale `AutistiEventoModal` shared con madre — opzione α); aprire viste "Vedi tutto" per ciascuna card. Non può: filtrare per autista/targa dall'home; esportare PDF dall'home.

**A4** Input: cambio data (3 modi: `<`, picker calendar, `>`); filtro implicito sul giorno selezionato.

**A5** Scritture: solo localStorage `gm_quicklinks_favs_v1` per pin/usage (non visibile in questo file ma riferito) e localStorage `next.shell.sidebarCollapsed`. Nessun dato business.

**A6** UI reattiva (loaders sincroni). Nessun toast.

**A7** Downstream: card click → navigate a viste B.1-B.6 o aprono modale evento. Modale evento è opzione α (shared madre).

**A8** Friction:
- **Sub-pane "Log Accessi" mostra 3 record** ma manca timestamp del cambio successivo (l'admin deve cliccare "Vedi tutto" per il dettaglio).
- **Card "Cambio mezzo"** tab click va a `/autisti-inbox/cambio-mezzo` invece di scroll interno → comportamento incoerente con gli altri tab.
- **Menu dot-dot-dot** è il solo punto di accesso ad Admin, non c'è breadcrumb.
- **Day navigation** scrive solo stato locale (`setDay`), non query string nella URL → impossibile condividere link a un giorno specifico.

**A9** Bug:
- **MEDIO** ([AutistiInboxHome.tsx:113-118](../../src/autistiInbox/AutistiInboxHome.tsx#L113-L118)) — `getItemSync(KEY_STORICO_EVENTI_OPERATIVI)`: gestisce shape `{value: [...]}` (a differenza di altre viste).
- **LOW** ([AutistiInboxHome.tsx:139-146](../../src/autistiInbox/AutistiInboxHome.tsx#L139-L146)) — `richiesteAttrezzature` viene filtrato per `e.tipo === "richiesta_attrezzature"` ma in altri file viene chiamata "attrezzature": discordanza tipo string fra file (es. cap. C tab key è `attrezzature`).

**B11** Doppia implementazione: madre `AutistiInboxHome.tsx` riusata dal wrapper NEXT `NextAutistiInboxHomeNative.tsx` con `cloneConfig` override path. Divergenze: paths `/next/*` vs `/`, ev. componente modale evento overridable. Comportamento identico.

**B12** Stato import definitivo: VISTA READ-ONLY. Nessun writer business. Da [file 05 aggiornato 2026-05-16]: stato resta DIMOSTRATO read-only.

**A10** Verifica runtime: tempo di caricamento dataset (loadHomeEvents) per giorni con molti record; UX della modale evento su mobile.

### B.1 — Segnalazioni All — [src/autistiInbox/AutistiSegnalazioniAll.tsx](../../src/autistiInbox/AutistiSegnalazioniAll.tsx)

**A1** File: `AutistiSegnalazioniAll.tsx` (438 righe). Wrapper NEXT `NextAutistiSegnalazioniAllNative.tsx` (clone-aware home/back path). Route `/autisti-inbox/segnalazioni` → `/next/autisti-inbox/segnalazioni`.

**A2** Vede: header logo + "Tutte le segnalazioni" + INDIETRO. Card filtri: input "Filtra per targa", select ambito (Tutti/Motrice/Rimorchio), checkbox "Solo nuove" (default ON). Lista righe: orario, ambito, targa, autista (badge), badge "NUOVA" + count foto + bottone "Anteprima PDF", tipo + descrizione, foto grid (max 3 thumb), dettaglio espanso (note + foto totali). Lightbox foto fullscreen. PDF preview modal.

**A3** Può: filtrare, espandere riga, aprire lightbox, generare PDF anteprima (segnalazione singola). Non può: marcare lette inline; eliminare; modificare; aggancia a manutenzione esistente (queste azioni vivono SOLO in Admin segmento C).

**A4** Input: filtro targa (string), ambito (enum), onlyNuove (bool).

**A5** Scritture: nessuna business. La generazione PDF è solo client-side. La lightbox e la modale sono UI pura.

**A6** PDF preview modal con bottoni Condividi/Copia/WhatsApp. Hint inline ("PDF condiviso." / "Testo copiato.").

**A7** Downstream: PDF generato → condivisibile via WhatsApp (Web Share API + fallback). Nessun side-effect su Firestore.

**A8** Friction:
- **Soltanto vista, niente azioni**: l'admin non può marcare letta una segnalazione da qui — deve entrare nel Centro Controllo Archivio Storico o nell'Admin.
- **Filtro per data assente**: solo filtro targa+ambito+nuove.
- **Ordinamento** ([AutistiSegnalazioniAll.tsx:180-185](../../src/autistiInbox/AutistiSegnalazioniAll.tsx#L180-L185)) per `isNuova` desc poi `ts` desc — buono.

**A9** Bug:
- **LOW** ([AutistiSegnalazioniAll.tsx:142-147](../../src/autistiInbox/AutistiSegnalazioniAll.tsx#L142-L147)) — la lettura gestisce shape `{value: [...]}` correttamente.

**B11** NextAutistiSegnalazioniAllNative.tsx — nativo, non wrapper. Re-implementa la lista (riga 118 per `cloneRuntime`); usa stesso pdfEngine. **Divergenze**: home/back path switch via `isCloneRuntime()` (riga 133-134 del nativo). Comportamento UI invariato.

**B12** Read-only.

**A10** Verifica runtime: caratteri Unicode su PDF (vedi cap. 6 AUDIT_NEXT_COMPLETO_2026-05-16 — il PDF segnalazione usa pdfEngine helvetica-only); UX lightbox su mobile.

### B.2 — Controlli All — [src/autistiInbox/AutistiControlliAll.tsx](../../src/autistiInbox/AutistiControlliAll.tsx)

**A1** File: `AutistiControlliAll.tsx` (335 righe). Nativo NEXT [src/next/autistiInbox/NextAutistiControlliAllNative.tsx](../../src/next/autistiInbox/NextAutistiControlliAllNative.tsx) (clone-aware). Route `/autisti-inbox/controlli`.

**A2** Vede: header + "Tutti i controlli". Filtri: input targa + checkbox "Mostra solo KO". Layout split: due colonne (ESITI KO + ESITI OK), se onlyKo solo KO. Riga: orario, target label (MOTRICE/RIMORCHIO/ENTRAMBI), targhe, autista (badge), badge KO/OK, eventuale "KO: <lista>", bottone Anteprima PDF, eventuale note.

**A3** Può: filtrare, generare PDF singolo. Non può: marcare risolto, agganciare a manutenzione esistente da qui.

**A4** Input: filterTarga, onlyKo.

**A5** Nessuna scrittura business.

**A6** PDF preview modal come B.1.

**A7** Downstream: PDF condivisibile. La conversione in manutenzione daFare avviene da Admin (C closeup C).

**A8** Friction:
- **Manca conteggio totale** in header (es. "12 KO, 38 OK") — solo lista.
- **`target=undefined`** non gestito esplicitamente: la helper `buildTargetLabel` ritorna "MEZZO" come fallback ([AutistiControlliAll.tsx:50](../../src/autistiInbox/AutistiControlliAll.tsx#L50)).

**A9** Bug:
- **LOW** ([AutistiControlliAll.tsx:81-87](../../src/autistiInbox/AutistiControlliAll.tsx#L81-L87)) — la lettura gestisce shape `{value: [...]}` correttamente.

**B11** Nativo NEXT (vedi scout cap. 0 e tabella riassuntiva): re-implementazione con clone-aware path. Comportamento UI identico.

**B12** Read-only.

**A10** Verifica runtime: PDF Unicode (helvetica only); UX layout split colonna su mobile (verticale).

### B.3 — Gomme All — [src/autistiInbox/AutistiGommeAll.tsx](../../src/autistiInbox/AutistiGommeAll.tsx)

**A1** File: `AutistiGommeAll.tsx` (229 righe). Nativo NEXT [src/next/autistiInbox/NextAutistiGommeAllNative.tsx](../../src/next/autistiInbox/NextAutistiGommeAllNative.tsx). Route `/autisti-inbox/gomme`.

**A2** Vede: header + "Tutte le gomme". Filtri: targa, "Solo nuove" (ON), "Solo non importate" (ON). Lista righe: orario, target label, tipo (CAMBIO/ROTAZIONE), KM, autista, badge stato (NUOVA/IMPORTATO), dettaglio espandibile (categoria, asse, gomme count, rotazione schema, stato).

**A3** Può: filtrare, espandere dettaglio. Non può: importare (azione admin in C tab Gomme).

**A4** Filtri come sopra.

**A5** Nessuna scrittura.

**A6** UI reattiva. Niente PDF.

**A7** Downstream: importazione effettiva avviene in Admin (C, action 4) → consolidamento in `@gomme_eventi`.

**A8** Friction:
- **Niente PDF preview** mentre altre viste lo hanno → incoerenza.
- **"Solo non importate" default ON**: nasconde quelle importate, ma se l'admin vuole verificare cosa è già importato deve sloggiare flag.

**A9** Nessuno significativo.

**B11** Nativo NEXT clone-aware.

**B12** Read-only.

**A10** Verifica runtime: tempo medio fra invio gomme dall'autista e importazione admin.

### B.4 — Richieste attrezzature All — [src/autistiInbox/RichiestaAttrezzatureAll.tsx](../../src/autistiInbox/RichiestaAttrezzatureAll.tsx)

**A1** File: `RichiestaAttrezzatureAll.tsx` (326 righe). Nativo NEXT [src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx](../../src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx). Route `/autisti-inbox/richiesta-attrezzature`.

**A2** Vede: card con INDIETRO + "Richieste attrezzature". Contatori: "Totale: X - Nuove: Y". Lista righe espandibili con orario, badge stato/foto, autista (badge), testo, foto grid, sezione dettaglio + bottone "Anteprima PDF".

**A3** Può: filtrare? **NO** — non c'è filtro né per autista né per stato. Solo apre/chiude dettaglio + PDF. Non può: marcare evasa (azione admin in C tab attrezzature).

**A4** Nessun input.

**A5** Nessuna scrittura.

**A6** PDF preview modal.

**A7** Downstream: PDF condivisibile; gestione evasa via Admin.

**A8** Friction:
- **Mancanza completa di filtri**: per inbox con molti record diventa ingovernabile.
- **Niente categorizzazione** (DPI vs attrezzo) — riflette assenza categoria a monte.
- **Niente conteggio per autista** o "richieste evase questo mese".

**A9** Nessuno significativo.

**B11** Nativo NEXT clone-aware.

**B12** Read-only.

**A10** Verifica runtime: incidenza richieste duplicate (vedi A.8 bug LOW).

### B.5 — Cambio mezzo Inbox — [src/autistiInbox/CambioMezzoInbox.tsx](../../src/autistiInbox/CambioMezzoInbox.tsx)

**A1** File: `CambioMezzoInbox.tsx` (310 righe). Nativo NEXT [src/next/autistiInbox/NextCambioMezzoInboxNative.tsx](../../src/next/autistiInbox/NextCambioMezzoInboxNative.tsx). Route `/autisti-inbox/cambio-mezzo` (+ query `?day=YYYY-MM-DD`).

**A2** Vede: header + "Cambio mezzo". Filtri: targa, PRECEDENTE/data display/SUCCESSIVO con date picker nascosto; counter "Eventi: N". Card per ogni cambio: orario, targa principale, "<tipo> - <nomeAutista> (BADGE X) - <orario>"; sotto-righe con frecce MOTRICE/RIMORCHIO prima→dopo.

**A3** Può: navigare giorno (3 modi), filtrare targa. Non può: modificare evento, aggiungere note post-hoc, esportare PDF.

**A4** filterTarga, day (URL state).

**A5** Nessuna scrittura business; aggiorna URL via navigate.

**A6** Reattivo. Niente toast.

**A7** Downstream: vista pura, no effetti.

**A8** Friction:
- **No "vedi condizioni"**: l'evento `CAMBIO_ASSETTO` ha payload `condizioni` (vedi A.4) ma qui non viene mostrato.
- **Nessun filtro per autista**.

**A9** Nessuno significativo.

**B11** Nativo NEXT clone-aware con URL state (query param day).

**B12** Read-only.

**A10** Verifica runtime: comportamento per giorni con 100+ cambi (scrolling).

### B.6 — Log accessi — [src/autistiInbox/AutistiLogAccessiAll.tsx](../../src/autistiInbox/AutistiLogAccessiAll.tsx)

**A1** File: `AutistiLogAccessiAll.tsx` (257 righe). Nativo NEXT [src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx](../../src/next/autistiInbox/NextAutistiLogAccessiAllNative.tsx). Route `/autisti-inbox/log-accessi`.

**A2** Vede: header + "Log accessi". Filtri tab (Tutti/Login/Logout/Inizio assetto/Cambio assetto, con highlight verde). Tabella: Data/Ora, Tipo, Badge, Nome.

**A3** Può: filtrare per tipo. Non può: filtrare per autista/data, esportare.

**A4** typeFilter (enum).

**A5** Nessuna scrittura.

**A6** Reattivo.

**A7** Downstream: vista pura.

**A8** Friction:
- **Logica suppressInizio** ([AutistiLogAccessiAll.tsx:101-120](../../src/autistiInbox/AutistiLogAccessiAll.tsx#L101-L120)): sopprime `INIZIO_ASSETTO` entro 10 minuti da `LOGIN_AUTISTA` stesso badge → utile, ma **nasconde silenziosamente** un evento a chi non sa che esiste questa regola. Niente legenda "X eventi nascosti per dedup".
- **Niente filtro data** — solo per tipo. Per audit storici bisogna aprire ogni mese.
- **Niente export CSV/PDF**.

**A9** Bug:
- **LOW** ([AutistiLogAccessiAll.tsx:78-83](../../src/autistiInbox/AutistiLogAccessiAll.tsx#L78-L83)) — shape `{value}` gestita.

**B11** Nativo NEXT clone-aware.

**B12** Read-only.

**A10** Verifica runtime: incidenza reale della soppressione INIZIO/LOGIN; UX della tabella con dataset grande.

---

<a id="cap-c"></a>
## C. Autisti Admin — madre + NEXT

### C.0 — Identificazione

- Madre: [src/autistiInbox/AutistiAdmin.tsx](../../src/autistiInbox/AutistiAdmin.tsx) (~3000 righe). Route madre `/autisti-admin`.
- NEXT nativo: [src/next/autistiInbox/NextAutistiAdminNative.tsx](../../src/next/autistiInbox/NextAutistiAdminNative.tsx) (~4100 righe — più della madre per via di scope barrier + modali nuove + writer NEXT). Route NEXT `/next/autisti-admin`.
- Helper bridge: [src/next/autistiInbox/nextAutistiAdminBridges.ts](../../src/next/autistiInbox/nextAutistiAdminBridges.ts) (bridge clone-local Firestore-like).

**Nota architettura**: la route `/next/autisti-admin` **monta `AutistiAdmin.tsx` madre** (decisione storica). `NextAutistiAdminNative.tsx` esiste e contiene **writer NEXT business operativi** (scope barrier 2026-05-09) ma non è promossa a pagina autonoma. È usato come componente interno e da Centro Controllo Archivio Storico.

### C.1 — 6 tab dell'admin (madre)

| Tab | Range JSX madre | Storage key letta/scritta | PDF generator |
|---|---|---|---|
| **segnalazioni** | 2428-2556 | `@segnalazioni_autisti_tmp` (read 390-395, write 1528,1439) | `generateSegnalazionePDFBlob` (321-338) |
| **controlli** | 2558-2689 | `@controlli_mezzo_autisti` (read 397-402, write 1612) | `generateControlloPDFBlob` (340-356) |
| **gomme** | 2691-2790 | `@cambi_gomme_autisti_tmp` (read 404-409, write 1624) + `@gomme_eventi` (write 1633) | — |
| **rifornimenti** | 2791-2914 subset | `@rifornimenti_autisti_tmp` (read 33) + `@rifornimenti` (write 1748,2039) | — |
| **attrezzature** | 2791-2914 subset | `@richieste_attrezzature_autisti_tmp` (read 36, write 1458) | — |
| **storico_cambio** | 2916-2973 | `@storico_eventi_operativi` (read 37) | read-only |

### C.2 — 4 closeup flussi chiave

#### Closeup A — Presa in carico segnalazione

**Madre** (`AutistiAdmin.tsx`): il flusso "presa in carico" è **implicito** — avviene solo come effetto collaterale di "CREA LAVORO". Handler [createLavoroFromSegnalazione:1473-1530](../../src/autistiInbox/AutistiAdmin.tsx#L1473-L1530):

```
CLICK "CREA LAVORO" (2540)
  → createLavoroFromSegnalazione(r) [1473]
  → check hasLinkedLavoro (1475-1477, ritorna se già presente)
  → window.confirm "Creare lavoro?" (1479)
  → appendLavori([lavoro]) [1510]  ✓ WRITE @lavori (madre)
  → setItemSync(@segnalazioni_autisti_tmp, updated.map(r=>{stato:"presa_in_carico"})) [1528]
  → setSegnalazioniRaw(updated)
```

**NEXT** (`NextAutistiAdminNative.tsx`): writer dedicato esiste — [src/next/writers/presaInCaricoSegnalazioneWriter.ts](../../src/next/writers/presaInCaricoSegnalazioneWriter.ts) — funzione `segnaPresaInCaricoSegnalazione` (PROMPT 50 R2, scope `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE`). **Non risulta invocato da `NextAutistiAdminNative.tsx`** (scout Explore). Manca quindi un bottone "PRENDI IN CARICO" esplicito su segnalazione in `NextAutistiAdminNative.tsx`.

#### Closeup B — Crea manutenzione daFare da segnalazione

**Madre**: come closeup A → scrive `@lavori`. Post-dismissione Lavori NEXT (decisione 2026-05-12, J.1-J.11), il flusso madre **continua a scrivere `@lavori`** (strategia 3a) ma la NEXT non lo legge più come modulo Lavori.

**NEXT** (`NextAutistiAdminNative.tsx`):
```
CLICK "CREA LAVORO" (2845)
  → createManutenzioneDaFareAdminFromSegnalazione(r) [1808-1825]
  → check hasLinkedLavoro
  → getManutenzioniCandidateMerge(targa) — reader manutenzioniCandidatiMerge.ts (90gg)
  → IF 0 candidati: window.confirm + doCreateDaFareDaSegnalazione(r) [1668-1698]
  → IF 1+ candidati: apre NextMergeManutenzioneModal (4055-4074) → user sceglie:
      - "Crea nuova" → doCreateDaFareDaSegnalazione
      - "Aggancia a esistente" → doMergeSorgenteToTarget [1742-1778]
  → doCreateDaFareDaSegnalazione → createManutenzioneDaFareFromSegnalazione (writer NEXT, src/next/writers/nextManutenzioneDaFareCreateWriter.ts)
      ✓ WRITE @manutenzioni (stato:daFare, origineTipo:segnalazione, origineRefId)
      ✓ WRITE @segnalazioni_autisti_tmp (linkedLavoroId, stato:presa_in_carico, letta:true)
      Scope: MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE
  → window.confirm("Aprire dettaglio?") → navigate /next/manutenzioni?recordId=...
```

#### Closeup C — Chiusura controllo KO

**Madre**: NON c'è un bottone "Chiudi controllo". Il KO si "risolve" solo passando da MODIFICA → cambiare i campi check da false a true → SALVA. Pattern multi-step:

```
CLICK "MODIFICA" controllo KO (2649)
  → openAdminEdit("controllo", r, r.id)
  → admin modifica check fields nel modale
  → CLICK SALVA → saveAdminEdit() [1661]
  → setItemSync(@controlli_mezzo_autisti, updated) [2001]
```

**Nessun campo `chiuso:true` o `dataChiusura`** sulla madre. Il record resta sempre come "controllo registrato"; isKO calcolato a runtime da `koList.length > 0`.

**NEXT**: il writer dedicato esiste — [src/next/nextControlliWriter.ts](../../src/next/nextControlliWriter.ts) `markControlloChiuso(id)` — scope `CONTROLLI_WRITE_SCOPE`. Scrive `chiuso:true`, `dataChiusura:Date.now()`, `chiuso_by:"centro_controllo_next"`. **Non invocato esplicitamente da `NextAutistiAdminNative.tsx` come bottone autonomo**; usato dal Centro Controllo Archivio Storico (`ArchivioRowExpanded`).

Aggancio retroattivo via macchina chiusura ciclo eventi: [chiudiControlloDaEvento](../../src/next/writers/nextChiusuraEventoWriter.ts) invocato da `confirmAggancioEventoAdmin` (NextAutistiAdminNative.tsx:1619-1643) con scope `CHIUSURA_DA_EVENTO_WRITE_SCOPE` quando si collega il controllo a un `gomme_evento`.

#### Closeup D — Importa Gomme (TMP → dossier)

**Madre**:
```
CLICK "IMPORTA" gomma (2781)
  → importGommeRecord(r) [1628-1635]
  → estrae {letta, stato, ...ufficiale} da record
  → setItemSync(@gomme_eventi, [...list, ufficiale]) [1633]  ✓ WRITE DOSSIER
  → updateGommeRecord(id, {stato:"importato", letta:true}) [1634]  ✓ WRITE TMP
  → setGommeRaw(updated)
```

**Nessun alert pre-import**: l'admin clicca IMPORTA e parte. Nessuna conferma. Nessuna validazione che la gomma abbia tutti i campi richiesti.

**NEXT** (`NextAutistiAdminNative.tsx`): bulk import via macchina chiusura ciclo eventi:
```
CLICK "IMPORTA" → apre NextImportGommeChiusuraModal (4109+)
  → user sceglie quali segnalazioni/controlli gomme aperti chiudere con questo evento
  → confirmImportGommeRecord [1884-1930]:
      → setItemSync(@gomme_eventi, [...list, ufficiale])
      → Promise.all di chiusure (chiudiManutenzioneDaEvento / chiudiSegnalazioneDaEvento / chiudiControlloDaEvento)
      → updateGommeRecord(stato:"importato")
```

**Differenza chiave**: il NEXT chiude automaticamente segnalazioni/controlli gomme aperti per la stessa targa, la madre no.

### C.3 — 6 azioni di consolidamento tmp → dossier

| Tipo | Madre (handler) | NEXT (handler) | Scope NEXT |
|---|---|---|---|
| **Rifornimenti** | `saveAdminEdit` → setDoc Firestore `storage/@rifornimenti` (AutistiAdmin.tsx:2021-2039) | Stesso pattern + `buildDossierItem` (NextAutistiAdminNative.tsx:2319-2340) | NESSUNO (Firestore diretto) |
| **Segnalazioni** | `createLavoroFromSegnalazione` (1473-1530) → scrive `@lavori` | `createManutenzioneDaFareAdminFromSegnalazione` (1808-1825) → scrive `@manutenzioni` + patch `@segnalazioni_autisti_tmp` | `MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE` |
| **Controlli** | `createLavoroFromControllo` (1532-1614) → scrive `@lavori` | `createManutenzioneDaFareAdminFromControllo` (1827-1852) → scrive `@manutenzioni` (N record per target=entrambi) | come sopra |
| **Gomme** | `importGommeRecord` (1628-1635) → scrive `@gomme_eventi` | `confirmImportGommeRecord` (1884-1930) bulk con chiusure | `CHIUSURA_DA_EVENTO_WRITE_SCOPE` per chiusure |
| **Attrezzature** | `deleteAdminEdit` filter (1445-1462) | `saveAdminEdit` patch (2298-2304) | nessuno (no consolidamento tmp→dossier; resta tmp) |
| **Storico cambio** | `openCanonEdit`/`saveCanonEdit` modale | `saveCanonEdit` (3804-3920) → `setItemSync(@storico_eventi_operativi)` | nessuno |

### C.4 — Schema A1-A10 per il complesso Admin (Madre + NEXT)

**A1** File: `AutistiAdmin.tsx` (madre, ~3000 righe) + `NextAutistiAdminNative.tsx` (NEXT, ~4100 righe). Route madre `/autisti-admin`; route NEXT `/next/autisti-admin` (**monta la MADRE**, non NextAutistiAdminNative).

**A2** Vede (entrambi): header con date picker live (aggiornamento ogni 30s), 6 tab buttons, per ogni tab lista con righe espandibili + modali edit/PDF. La madre usa `dateFormat.ts` (formati legacy), il NEXT `dateUnica.ts`.

**A3** Può (entrambi): visualizzare 6 tab, modificare/eliminare record, creare lavoro/manutenzione daFare da segnalazione/controllo, importare gomme. Solo NEXT: aggancio retroattivo a manutenzione esistente (PROMPT 47), merge a daFare esistente (PROMPT 45), chiusura ciclo eventi gomme con bulk closure. Solo madre: nulla di nuovo rispetto a NEXT (la madre è arretrata).

**A4** Validazioni inline + modal forms con campo `patch[]`. Validazione di tipi numerici è debole in entrambi (vedi bug madre).

**A5** Scritture: vedi tabella C.3.

**A6** Feedback: window.confirm e window.alert nativi in entrambi. Toast assenti. Reload list post-action.

**A7** Downstream: vasto (vedi singoli tab).

**A8** Friction (entrambi):
- **6 tab in singolo file**: ~3000 righe (madre) / ~4100 (NEXT) — manutenibilità bassa.
- **Modal "edit" generica**: stessa modale per tutti i tab (rifornimenti/segnalazioni/controlli/gomme/attrezzature), patch generico via `adminEdit.patch[]`. Errore in un branch impatta gli altri.
- **Window.confirm/alert nativi**: brutto su mobile, blocca thread.
- **Nessun toast di conferma**: le azioni cambiano stato senza feedback positivo, solo errori.
- **PDF generator helvetica-only** (madre via pdfEngine.ts): rischio simboli strani (vedi AUDIT_NEXT_COMPLETO_2026-05-16 cap. 6).
- **Tab "storico_cambio"** è read-only nella vista ma il modale `canonEdit` lo rende edit-able — incoerenza UX.
- **Nessun filtro per autista globale**: ogni tab ha il suo filtro targa, ma per "tutto quello che ha fatto Sandro questo mese" l'admin deve scorrere ogni tab.

**A9** Bug madre (da scout Explore con file:riga):

| Bug | Severità | Anchor | Descrizione |
|---|---|---|---|
| linkedLavoro double-field (string vs array) | **CRITICO** | [AutistiAdmin.tsx:1465-1471 + 1534-1535](../../src/autistiInbox/AutistiAdmin.tsx#L1465-L1471) | `hasLinkedLavoro` controlla solo `linkedLavoroId`; `createLavoroFromControllo` scrive `linkedLavoroIds`. Lavoro duplicabile se array esiste ma string no. |
| Dossier rifornimenti no rollback | **CRITICO** | [AutistiAdmin.tsx:2020-2039](../../src/autistiInbox/AutistiAdmin.tsx#L2020-L2039) | TMP scritto, setDoc dossier può fallire senza try-catch. Record in tmp ma non in dossier. |
| `presa_in_carico` condizionale | **MEDIO** | [AutistiAdmin.tsx:1524-1525](../../src/autistiInbox/AutistiAdmin.tsx#L1524-L1525) | Marca stato solo se `"stato" in r`, altrimenti `letta:true` — incoerenza semantica. |
| importGomme no validation | **MEDIO** | [AutistiAdmin.tsx:1632](../../src/autistiInbox/AutistiAdmin.tsx#L1632) | Estrae tutti i campi senza check completezza → gomma corrotta a `@gomme_eventi`. |
| Delete segnalazione no cleanup linkedLavoro | **MEDIO** | [AutistiAdmin.tsx:2077-2078](../../src/autistiInbox/AutistiAdmin.tsx#L2077-L2078) | Elimina segnalazione, lavoro creato resta orfano. |

**A9** Bug NEXT (da scout Explore):

| Bug | Severità | Anchor | Descrizione |
|---|---|---|---|
| Presa in carico writer non invocato | **MEDIO** (HIGH UX) | NextAutistiAdminNative.tsx (writer importato ma 0 invocazioni) | `presaInCaricoSegnalazioneWriter` esiste ma non c'è bottone "PRENDI IN CARICO" in UI. PROMPT 50 R2 implementato a livello writer ma non esposto. |
| Doppio confirm creazione | MEDIO | NextAutistiAdminNative.tsx (modale merge + confirm "Aprire dettaglio") | UX confonde: 2 conferme consecutive. |
| Bulk closure no rollback | MEDIO | NextAutistiAdminNative.tsx:1896-1930 | `Promise.all` di chiusure: parziale failure lascia stato inconsistente. |
| Aggancio evento no reload gommeRaw | LOW | NextAutistiAdminNative.tsx:1619-1643 | UI out-of-sync dopo `confirmAggancioEventoAdmin`. |
| `stato` perso a save se mancante | LOW (semantico) | NextAutistiAdminNative.tsx:2250-2251 | Admin edit cancella `stato` se non presente in original. |

**A10** Verifica runtime: tempo aperto edit modale, percentuale lavori duplicati per bug CRITICO madre, % rifornimenti orfani dossier in produzione.

### C.5 — Proposta di sostituzione NEXT

Approfondimento di [AUDIT_NEXT_COMPLETO_2026-05-16.md cap. 5.3](AUDIT_NEXT_COMPLETO_2026-05-16.md).

#### Dove vivrebbe

`src/next/autistiAdmin/` (nuova cartella). Base di partenza: `NextAutistiAdminNative.tsx` (già scrive business reale, scope barrier completi). Da promuovere a **pagina autonoma `NextAutistiAdminPage.tsx`** + suddividere in sotto-componenti per ridurre le 4100 righe attuali.

#### Cosa promuovere da NextAutistiAdminNative.tsx

- I 6 tab con scope barrier dedicati: `RIFORNIMENTI_WRITE_SCOPE`, `SEGNALAZIONI_WRITE_SCOPE`, `CONTROLLI_WRITE_SCOPE`, `RICHIESTE_WRITE_SCOPE`, `MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE`, `CHIUSURA_DA_EVENTO_WRITE_SCOPE`, `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE`.
- Modale merge `NextMergeManutenzioneModal` (PROMPT 45 T1).
- Modale aggancio evento `NextAggancioEventoModal` (2026-05-14).
- Modale import gomme con chiusure bulk `NextImportGommeChiusuraModal` (2026-05-14).
- PDF preview con Web Share API.

#### Cosa ripensare

- **Tabb non singolo file**: spezzare in 6 sub-componenti (`SegnalazioniTab.tsx`, `ControlliTab.tsx`, ...) + barra header condivisa.
- **URL state per tab attivo** (es. `/next/autisti-admin/segnalazioni?targa=TI...`) → deeplink condivisibili, back/forward browser.
- **Bottone "PRENDI IN CARICO" esplicito** su segnalazione → invoca `segnaPresaInCaricoSegnalazione` (writer esistente non esposto).
- **Bottone "CHIUDI CONTROLLO" esplicito** quando admin verifica risoluzione → invoca `markControlloChiuso`.
- **Toast invece di window.alert/confirm**.
- **Date display via `dateUnica.ts`** (già fatto nel native, ma da generalizzare).
- **Validazione numerica robusta**: rigetto `NaN` su salvataggio, no fallback silenzioso.
- **Rollback transazionale** sul flusso rifornimenti (tmp → dossier).
- **Cleanup cascade**: delete segnalazione → check linkedLavoro → propose clean.

#### Dipendenze da risolvere prima

- Verifica writer NEXT per **ogni tab**:
  - Segnalazioni ✓ (`markSegnalazioneChiusa`, `createManutenzioneDaFareFromSegnalazione`, `agganciaSegnalazioneAManutenzioneEsistente`).
  - Controlli ✓ (`markControlloChiuso`, `createManutenzioneDaFareFromControllo`).
  - Rifornimenti: ⚠️ usa Firestore diretto su `storage/@rifornimenti` — manca un `nextRifornimentiDossierWriter` con scope.
  - Gomme ✓ (`chiudiManutenzione/Segnalazione/ControlloDaEvento`).
  - Attrezzature: ⚠️ `markRichiestaEvasa` esiste? `RICHIESTE_WRITE_SCOPE` definito ma writer non chiaramente identificato come funzione standalone.
  - Storico cambio: edit Canon → setItemSync diretto, no writer wrapper.
- Opzione α (`AutistiEventoModal.tsx` shared) → mantenere wrapper NEXT.
- `loadHomeEvents`/`loadRimorchiStatus` da migrare a reader NEXT puri.

#### Taglia e fasi

- **Fase 1 (S)** — Audit funzionale 1:1 `AutistiAdmin.tsx`: lista chiusa dei flussi attivi post-PROMPT 27→53.
- **Fase 2 (M)** — Promozione `NextAutistiAdminNative.tsx` → pagina autonoma `NextAutistiAdminPage`; introduzione URL state; spezzamento in 6 sub-componenti.
- **Fase 3 (S)** — Bottoni espliciti "PRENDI IN CARICO" + "CHIUDI CONTROLLO" che invocano writer esistenti.
- **Fase 4 (M)** — Wrapper `nextRifornimentiDossierWriter` con scope + rollback. Stessa cosa per `markRichiestaEvasa` se mancante.
- **Fase 5 (M)** — Sostituzione window.alert/confirm con toast/modale brandizzata. Date via `dateUnica.ts`. Validazione numerica robusta.
- **Fase 6 (L)** — Switch route `/next/autisti-admin` → nuova pagina; rimozione mount madre. Verifica end-to-end con dati reali.
- **Fase 7 (S)** — Cleanup `src/autistiInbox/AutistiAdmin.tsx` (decisione Giuseppe: lasciare dormiente o cancellare).

**Stima complessiva**: L.

---

<a id="cap-d"></a>
## D. Confronto trasversale

### D.1 Stessa azione, tre comportamenti

| Azione | App autista (cabina) | Inbox NEXT (`/autisti-inbox/*`) | Admin (`/autisti-admin`) |
|---|---|---|---|
| **Crea segnalazione** | Form completo + foto + writer su `@segnalazioni_autisti_tmp` ([Segnalazioni.tsx:298-358](../../src/autisti/Segnalazioni.tsx#L298-L358)) | Vista lista + PDF preview (B.1) | Modale edit con patch[] generica; bottone "CREA LAVORO" + scrive `@lavori` o `@manutenzioni` (closeup B) |
| **Marca lavorata** | impossibile dal lato autista | impossibile dal lato Inbox | Madre: `createLavoroFromSegnalazione` scrive `stato:"presa_in_carico"` come effetto collaterale (1524). NEXT: writer esiste, non invocato. |
| **Chiudi/risolvi** | impossibile | impossibile | Madre: solo via MODIFICA + check fields. NEXT: writer `markControlloChiuso`/`markSegnalazioneChiusa` esiste, invocato da CC Archivio non da Admin. |
| **Registra gomme** | GommeAutistaModal con 6+ step (A.9) | Vista lista + filtri (B.3) | Madre: IMPORTA singolo. NEXT: bulk import con closure di segnalazioni/controlli gomme aperti. |
| **Cambia mezzo** | CambioMezzoAutista (A.4) | Vista log per data (B.5) | Modale canonEdit per modificare un evento già scritto |
| **Vedi storico autista** | impossibile | possibile con filtri parziali per tab | possibile con MODIFICA singolo record |

### D.2 Coerenza / incoerenza

- **Feedback**: madre usa window.alert/confirm ovunque. NEXT idem. Inbox usa toast solo per PDF share. Pattern incoerente.
- **Validazione**: la madre è permissiva (default true tutto OK, numeri silenti `NaN`). Il NEXT mantiene gli stessi pattern + aggiunge scope barrier che bloccano scritture fuori path autorizzato.
- **Stato post-azione**: madre tipicamente fa `setItemSync` + setLocalState. NEXT tipicamente fa lo stesso + reload del list via async. **Race condition** se l'utente fa due click veloci.
- **Linguaggio**: "lavoro" (madre) vs "manutenzione daFare" (NEXT post-dismissione Lavori 2026-05-12) → la madre dice ancora "CREA LAVORO" sui bottoni, mentre il NEXT dice "manutenzione daFare". L'utente vede entrambi.
- **Date format**: madre `dateFormat.ts` (legacy) vs NEXT `dateUnica.ts` (unificato). Display divergente sullo stesso record fra le viste.

### D.3 Dove sta il rischio reale per l'utente

1. **Lavoro/manutenzione duplicato** (bug CRITICO madre linkedLavoro double-field) → admin crea due interventi per la stessa segnalazione. Rischio operativo: doppia spesa officina.
2. **Rifornimento orfano dossier** (bug CRITICO madre dossier no rollback) → autista vede rifornimento confermato, admin non lo trova in dossier. Rischio operativo: conteggio costi flotta sballato.
3. **Controlli "tutti OK"** registrati senza verifica (default true ovunque) → falsi negativi: l'autista non ha controllato ma il sistema dice "controllo eseguito". Rischio: incidenti.
4. **Cambio motrice senza evento** (bug MEDIO `CambioMezzoAutista` ramo motrice) → traccia mancante in `@storico_eventi_operativi`. Rischio audit: cosa è successo fra `INIZIO_ASSETTO` precedente e successivo.
5. **Foto orfane Storage** (Segnalazioni A.8, Richieste A.8) → costi Storage crescenti, no cleanup.
6. **Race rifornimento dossier** (bug CRITICO Rifornimento) → due autisti contemporanei possono perdere uno dei due record dossier.
7. **`@autisti_sessione_attive` shape `{value}` ignorata** (pattern ricorrente in molte viste) → revoche silenziosamente ignorate.

---

<a id="cap-e"></a>
## E. Riepilogo BUG CONSOLIDATI

Tabella unica ordinata per severità. Esclude le 3 questioni già tracciate.

| # | Severità | File:riga | Descrizione |
|---|---|---|---|
| 1 | CRITICO | [AutistiAdmin.tsx:1465-1471 + 1534-1535](../../src/autistiInbox/AutistiAdmin.tsx#L1465-L1471) | linkedLavoro double-field (string vs array): lavoro duplicabile da controllo se `linkedLavoroIds` esiste ma `linkedLavoroId` no. |
| 2 | CRITICO | [AutistiAdmin.tsx:2020-2039](../../src/autistiInbox/AutistiAdmin.tsx#L2020-L2039) | Dossier rifornimenti no rollback: TMP scritto, setDoc dossier può fallire → record in tmp ma non in dossier. |
| 3 | CRITICO | [Rifornimento.tsx:189-205](../../src/autisti/Rifornimento.tsx#L189-L205) | Race condition sul dossier `storage/@rifornimenti`: read-modify-write non atomica. |
| 4 | MEDIO | [AutistiAdmin.tsx:1524-1525](../../src/autistiInbox/AutistiAdmin.tsx#L1524-L1525) | `presa_in_carico` condizionale: marca stato solo se `"stato" in r`, altrimenti `letta:true` — incoerenza semantica. |
| 5 | MEDIO | [AutistiAdmin.tsx:1632](../../src/autistiInbox/AutistiAdmin.tsx#L1632) | importGomme no validation: gomma corrotta scritta a `@gomme_eventi`. |
| 6 | MEDIO | [AutistiAdmin.tsx:2077-2078](../../src/autistiInbox/AutistiAdmin.tsx#L2077-L2078) | Delete segnalazione no cleanup linkedLavoro: lavoro orfano residuo. |
| 7 | MEDIO | NextAutistiAdminNative.tsx (writer importato 0 invocazioni) | Presa in carico writer (`segnaPresaInCaricoSegnalazione`) esiste ma non c'è bottone UI. PROMPT 50 R2 non esposto. |
| 8 | MEDIO | NextAutistiAdminNative.tsx:1896-1930 | Bulk closure gomme no rollback: `Promise.all` parziale failure lascia stato inconsistente. |
| 9 | MEDIO | [CambioMezzoAutista.tsx:227-249](../../src/autisti/CambioMezzoAutista.tsx#L227-L249) | Cambio motrice non scrive evento `CAMBIO_ASSETTO`: traccia + `condizioni` perse. |
| 10 | MEDIO | [Rifornimento.tsx:174-175](../../src/autisti/Rifornimento.tsx#L174-L175) | `Number(km.replace(/\./g, ""))` + `parseDecimal(litri) ?? NaN`: salvataggio `NaN` o aliasing migliaia. |
| 11 | MEDIO | [Segnalazioni.tsx:283](../../src/autisti/Segnalazioni.tsx#L283) | Upload foto race: path duplicato se click rapido sullo stesso input. |
| 12 | MEDIO | [Segnalazioni.tsx:147 + altri 5+ file](../../src/autisti/Segnalazioni.tsx#L147) | Pattern ricorrente: `Array.isArray(raw)` non gestisce shape `{value: [...]}` (Gate, Home, Setup, Cambio, Controllo, Segnalazioni, Rifornimento). |
| 13 | MEDIO | [RichiestaAttrezzature.tsx:91-93](../../src/autisti/RichiestaAttrezzature.tsx#L91-L93) | `e.target.value = ""` sul finally può fallire su componente smontato. |
| 14 | MEDIO | [GommeAutistaModal.tsx:283-291](../../src/autisti/GommeAutistaModal.tsx#L283-L291) | `rotazioneAssiValue` regex `<->`: fragile se schema usa `↔` (display) invece di `<->` (storage). |
| 15 | LOW | NextAutistiAdminNative.tsx:1619-1643 | Aggancio evento no reload gommeRaw: UI out-of-sync. |
| 16 | LOW | NextAutistiAdminNative.tsx:2250-2251 | `stato` perso a save se mancante in original. |
| 17 | LOW | [Segnalazioni.tsx:308](../../src/autisti/Segnalazioni.tsx#L308) | `targaSelezionata` può essere `null` post-AutistiGate (improbabile ma possibile). |
| 18 | LOW | [GommeAutistaModal.tsx:174](../../src/autisti/GommeAutistaModal.tsx#L174) | Pattern shape `{value}` gestito solo qui, inconsistente con altre viste. |
| 19 | LOW | [ControlloMezzo.tsx:33-38](../../src/autisti/ControlloMezzo.tsx#L33-L38) | `obbligatorio:true` hard-coded: ogni controllo "obbligatorio". |
| 20 | LOW | [HomeAutista.tsx:241-244](../../src/autisti/HomeAutista.tsx#L241-L244) | Logout filtra tutte le sessioni autista: perde multi-device sessions silente. |
| 21 | LOW | [AutistiGate.tsx:67](../../src/autisti/AutistiGate.tsx#L67) | Reason text spesso vuoto sulla revoca; alert poco informativo. |
| 22 | LOW | [LoginAutista.tsx:40-47](../../src/autisti/LoginAutista.tsx#L40-L47) | Redirect "già loggato": se manca mezzo, blocca su login senza messaggio. |
| 23 | LOW | [AutistiLogAccessiAll.tsx:101-120](../../src/autistiInbox/AutistiLogAccessiAll.tsx#L101-L120) | `suppressInizio` 10min nasconde eventi senza legenda. |
| 24 | LOW | [SetupMezzo.tsx:193-194](../../src/autisti/SetupMezzo.tsx#L193-L194) | Codice morto in calcolo `preCamion`. |
| 25 | LOW | [Setup.tsx, Home, Cambio, Controllo, Gomme] | Pattern alert window.alert su mobile: blocca thread. |

**Conteggi**: 3 CRITICI, 11 MEDI, 11 LOW = **25 bug totali**.

---

<a id="cap-f"></a>
## F. Riepilogo VERIFICHE RUNTIME NECESSARIE

| # | Vista | Cosa va testato a runtime |
|---|---|---|
| 1 | A.1 Login | Comportamento con badge inesistente / `@colleghi` vuoto / offline. Lock progressivo dopo N tentativi sbagliati? |
| 2 | A.0 Gate | Tempo effettivo propagazione revoca (15s teorici); shape `{value}` ignorata in produzione; collisione poll/navigate. |
| 3 | A.2 Setup mezzo | Comportamento offline (revoca scattata localmente ma non sincronizzata); race fra autisti simultanei; shape `{value}` su `@mezzi_aziendali`. |
| 4 | A.3 Home autista | Tempi reali propagazione revoche fra device; Firestore offline durante logout; UX modale sgancio mobile. |
| 5 | A.4 Cambio mezzo | Cosa vede l'admin dopo cambio motrice senza evento (bug MEDIO #9); recupero condizioni perse. |
| 6 | A.5 Controllo | % controlli con check=tutti OK e nessuna nota (proxy friction default true); UX flusso forzato da Gate. |
| 7 | A.6 Segnalazioni | Orfani Storage `autisti/segnalazioni/*` per submit abortiti; upload foto offline; tempo medio compilazione. |
| 8 | A.7 Rifornimento | Incidenza race dossier produzione; flag `flagVerifica:true` quanti record reali; aliasing migliaia su input mobile. |
| 9 | A.8 Richiesta attrezzature | Orfani Storage; richieste duplicate (proxy bug LOW); UX alert nativo. |
| 10 | A.9 Gomme modal | Categorie non supportate; tempo medio compilazione; coerenza TMP non importati. |
| 11 | B.0 Inbox Home | Tempo caricamento dataset per giorni con molti record; UX modale evento mobile. |
| 12 | B.1 Segnalazioni All | Caratteri Unicode su PDF (helvetica only); UX lightbox mobile. |
| 13 | B.2 Controlli All | PDF Unicode; UX layout split-colonna su mobile (verticale). |
| 14 | B.3 Gomme All | Tempo fra invio gomme autista e importazione admin. |
| 15 | B.4 Richieste All | Incidenza richieste duplicate. |
| 16 | B.5 Cambio mezzo | Comportamento giorni con 100+ cambi (scrolling). |
| 17 | B.6 Log accessi | Incidenza reale suppressInizio; UX tabella dataset grande. |
| 18 | C Admin | Tempo aperto edit modale; % lavori duplicati per bug CRITICO #1; % rifornimenti orfani dossier (#2/#3). |
| 19 | C closeup B | Conferma operativa: il bottone "CREA LAVORO" su segnalazione/controllo apre modale merge se ci sono daFare entro 90gg? UX del doppio confirm. |
| 20 | C closeup D | Bulk closure gomme: parziale failure (cosa vede l'admin se 2/5 chiusure falliscono). |
| 21 | Cross | Tempo medio dal "click CONFERMA controllo OK" alla visibilità in Inbox/Centro Controllo (latenza Firestore). |
| 22 | Cross | Browser console errors in produzione per tutti i pattern shape `{value}` non gestiti (bug MEDIO #12). |
| 23 | Cross | Tempi di rendering della Sinottica V2 con tutte le card popolate. |

**Conteggio**: **23 verifiche runtime necessarie**.

---

**Fine audit.**
