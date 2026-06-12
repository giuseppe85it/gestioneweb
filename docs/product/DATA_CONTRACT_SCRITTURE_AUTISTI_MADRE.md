# DATA CONTRACT — Scritture app autisti MADRE (`src/autisti/`)

> **Scopo.** Specifica vincolante di OGNI scrittura su Firestore/Storage prodotta dall'app autisti madre (`src/autisti/`, route `/autisti/*`), pensata come **checklist di accensione** delle scritture nel clone NEXT (`/next/autisti/*`), oggi read-only. L'obiettivo è la **compatibilità al byte con la madre**: stessa collection, stessi campi, stessi valori letterali, stesso formato.
>
> **Data redazione.** 2026-06-12
> **Fonte di verità.** Codice reale `src/autisti/` + `src/utils/storageSync.ts` + `src/utils/cloneWriteBarrier.ts` (citati con `file:riga`), e **record reali letti da Firestore in sola lettura** (8 collection campionate il 2026-06-12 via service account, entro boundary). Nessun report è stato usato come prova.
> **Avvertenza.** Questo documento descrive **cosa scrive la madre**. NON implementa NEXT, NON decide le incoerenze di prodotto (sezione 5 = domande aperte per Giuseppe), NON giudica UI/UX.
>
> **Regola di compatibilità n.1 (CRITICA).** La madre driver scrive un **record minimo**. I campi ricchi osservati nei record Firestore reali (`adminEdit`, `chiusa`/`chiusura*`, `linkedLavoroId`/`linkedLavoroIds`/`linkedMultiple`, `dataPresaInCarico`, `nascostoInArchivio`, `evasa`/`evasa_by`/`dataEvasione`, `foto`, `chiusa_by`, e un `timestamp` duplicato in segnalazioni) **NON sono scritti dal driver**: li aggiunge la valle (Centro Controllo / `centro_controllo_next`, admin). NEXT deve scrivere **solo il sottoinsieme driver** elencato in ogni scheda; **non** deve scrivere i campi di valle.

---

## 1. Meccanismo `setItemSync` → Firestore

Tutte le scritture-array della madre passano per `setItemSync(key, value)` in [`src/utils/storageSync.ts:27`](../../src/utils/storageSync.ts#L27).

- **Mappa chiave → documento.** `setItemSync(key, value)` scrive il documento Firestore `storage/<key>` (`doc(db, "storage", key)`, [storageSync.ts:35](../../src/utils/storageSync.ts#L35)) nel campo **`value`**: `await setDoc(ref, { value: value })` ([storageSync.ts:131](../../src/utils/storageSync.ts#L131)). È un **OVERWRITE** dell'intero campo `value` del documento (niente `{ merge: true }`).
- **Append/prepend = lato JS, non lato Firestore.** Non esiste API di append: ogni chiamante fa **read-modify-write** — `getItemSync(key)` → ottiene l'array (`snap.data().value`, [storageSync.ts:150](../../src/utils/storageSync.ts#L150)) → `list.push(record)` (append) o `[record, ...list]` (prepend) → `setItemSync(key, list)` riscrive tutto l'array. Implicazione: **race last-write-wins** su array condivisi (due autisti concorrenti si sovrascrivono).
- **Eccezione merge.** Solo per `key === "@mezzi_aziendali"` `setItemSync` fa un merge per id/targa ([storageSync.ts:38-128](../../src/utils/storageSync.ts#L38-L128)). **Nessuna scrittura autisti** usa questa chiave: per gli autisti vale sempre l'overwrite puro di riga 131.
- **Barriera.** `setItemSync` invoca `assertCloneWriteAllowed("storageSync.setItemSync", { key })` ([storageSync.ts:33](../../src/utils/storageSync.ts#L33)); in un runtime clone non autorizzato lancia `CloneWriteBlockedError` e **scarta la scrittura** ([storageSync.ts:134](../../src/utils/storageSync.ts#L134)). Vedi sezione 6.
- **Scrittura diretta (1 sola).** Il dossier rifornimenti usa `setDoc` diretto su `storage/@rifornimenti` ([Rifornimento.tsx:205](../../src/autisti/Rifornimento.tsx#L205)), bypassando `setItemSync` (quindi anche la barriera `assertCloneWriteAllowed` — passa solo dal barrier fetch).
- **Storage.** Foto via `uploadBytes` + `getDownloadURL` (`firebase/storage`), cancellazioni via `deleteObject`. Non passano da `setItemSync`.

---

## 2. Tabella indice delle scritture

20 operazioni `(azione → scrittura fisica)` su **19 call-site distinti** (la riga `HomeAutista.tsx:60` di `appendEventoOperativo` è condivisa da Logout e Sgancio). Composizione: **14× `setItemSync`** (overwrite `storage/<key>.value`), **1× `setDoc` diretto**, **2× `uploadBytes`**, **2× `deleteObject`**.

> **Conteggio vs «18 attese».** Il delta è solo di raggruppamento, non di omissioni: l'audit precedente contava 18 *righe logiche* (alcune bundle-avano più scritture fisiche, es. «Logout → storico + sessioni») e includeva 3 righe **solo-localStorage** (sessione autista/mezzo di dispositivo) che **non** sono scritture Firestore/Storage e quindi sono fuori da questo contratto (vedi §2.1). Scomponendo per scrittura fisica Firestore/Storage si ottengono le 20 operazioni qui sotto. Le `rg` di verifica (CMD1) confermano che non esistono altri `setItemSync/setDoc/addDoc/updateDoc/uploadBytes/deleteObject` in `src/autisti/` oltre a questi.

| # | Azione UI | Destinazione | Tipo | Rischio |
|---|---|---|---|---|
| 1 | Login → evento | `storage/@storico_eventi_operativi` | setItemSync append | BASSO |
| 2 | Conferma setup → evento assetto | `storage/@storico_eventi_operativi` | setItemSync append | BASSO |
| 3 | Conferma setup → sessione + auto-revoca | `storage/@autisti_sessione_attive` | setItemSync overwrite | MEDIO |
| 4 | Logout → evento | `storage/@storico_eventi_operativi` | setItemSync append | BASSO |
| 5 | Logout → rimozione sessione | `storage/@autisti_sessione_attive` | setItemSync overwrite | MEDIO |
| 6 | Sgancio motrice → sessione | `storage/@autisti_sessione_attive` | setItemSync overwrite | MEDIO |
| 7 | Sgancio motrice → evento | `storage/@storico_eventi_operativi` | setItemSync append | BASSO |
| 8 | Cambio rimorchio → evento | `storage/@storico_eventi_operativi` | setItemSync append | BASSO |
| 9 | Cambio rimorchio → sessione | `storage/@autisti_sessione_attive` | setItemSync overwrite | MEDIO |
| 10 | Cambio motrice → sessione | `storage/@autisti_sessione_attive` | setItemSync overwrite | MEDIO |
| 11 | Conferma controllo | `storage/@controlli_mezzo_autisti` | setItemSync append | **ALTO** |
| 12 | Salva rifornimento → tmp | `storage/@rifornimenti_autisti_tmp` | setItemSync append | **ALTO** |
| 13 | Salva rifornimento → dossier | `storage/@rifornimenti` | **setDoc diretto** | **ALTO** |
| 14 | Foto segnalazione (upload) | Storage `autisti/segnalazioni/...` | uploadBytes | MEDIO |
| 15 | Invia segnalazione | `storage/@segnalazioni_autisti_tmp` | setItemSync append | **ALTO** |
| 16 | Foto richiesta (upload) | Storage `autisti/richieste-attrezzature/...` | uploadBytes | MEDIO |
| 17 | Foto richiesta (sostituzione) | Storage `autisti/richieste-attrezzature/...` | deleteObject | BASSO |
| 18 | Foto richiesta (rimuovi) | Storage `autisti/richieste-attrezzature/...` | deleteObject | BASSO |
| 19 | Invia richiesta | `storage/@richieste_attrezzature_autisti_tmp` | setItemSync append | **ALTO** |
| 20 | Salva gomme | `storage/@cambi_gomme_autisti_tmp` | setItemSync prepend | **ALTO** |

Rischio: **ALTO** = il record alimenta manutenzione/Centro Controllo a valle; **MEDIO** = sessione/assetto; **BASSO** = evento storico informativo / cancellazione foto.

### 2.1 Scritture solo-localStorage (FUORI contratto Firestore/Storage)

Documentate per completezza; **non** vanno replicate come scritture Firestore (NEXT le gestisce già in locale namespacizzato):
- `saveAutistaLocal` (login [LoginAutista.tsx:79](../../src/autisti/LoginAutista.tsx#L79)) → `@autista_attivo_local`
- `saveMezzoLocal` (setup [SetupMezzo.tsx:389](../../src/autisti/SetupMezzo.tsx#L389); cambio [CambioMezzoAutista.tsx:214/239](../../src/autisti/CambioMezzoAutista.tsx#L214); sgancio [HomeAutista.tsx:326](../../src/autisti/HomeAutista.tsx#L326); gate) → `@mezzo_attivo_autista_local`
- `removeAutistaLocal`/`removeMezzoLocal`/`clearLastHandledRevokedAt` (logout [HomeAutista.tsx:248-250](../../src/autisti/HomeAutista.tsx#L248-L250))
- `setLastHandledRevokedAt` (gate/home, marker revoche) → `@autista_revoca_local`

Helper: [`src/autisti/autistiStorage.ts`](../../src/autisti/autistiStorage.ts).

---

## 3. Schede scrittura (checklist implementativa)

Notazione campi: `nome : tipo = valore-letterale | formato`. «(VALLE)» = campo **non scritto dal driver**, presente nei record reali perché aggiunto a valle → **NEXT NON deve scriverlo**.

---

### SCHEDA 1 — Login → evento `LOGIN_AUTISTA`
- **a. Azione UI:** schermata Login, click **ENTRA** (`handleLogin`).
- **b. Handler:** `appendEventoOperativo` da [LoginAutista.tsx:83-92](../../src/autisti/LoginAutista.tsx#L83-L92); write fisico [LoginAutista.tsx:29](../../src/autisti/LoginAutista.tsx#L29).
- **c. Tipo:** `setItemSync` append (read-modify-write, dedup per `id` a [riga 27](../../src/autisti/LoginAutista.tsx#L27)).
- **d. Destinazione:** `storage/@storico_eventi_operativi`.
- **e. Shape record:**
  - `id : string = \`LOGIN_AUTISTA-${badge}-${now}\`` (`now = Date.now()` al click)
  - `tipo : string = "LOGIN_AUTISTA"` (literal)
  - `timestamp : number` = `Date.now()` ms al click
  - `badgeAutista : string` = `badge.trim()` (stringa numerica; **solo trim**, niente uppercase)
  - `nomeAutista : string` = `collega.nome`
  - `autistaNome : string` = `collega.nome` (**alias ridondante**)
  - `autista : string` = `collega.nome` (**terzo alias dello stesso nome**)
  - `source : string = "AUTISTI"` (literal)
- **f. Note compat.:** nessuna targa nell'evento di login; tripla ridondanza nome (`nomeAutista`=`autistaNome`=`autista`); `timestamp` **da click** (vedi §5 regola TIMESTAMP-MAI-DA-CLICK); read-modify-write su array condiviso (447 record reali).

---

### SCHEDA 2 — Conferma setup → evento `INIZIO_ASSETTO`/`CAMBIO_ASSETTO`
- **a. Azione UI:** schermata Selezione Mezzo, click **CONFERMA** (`handleConfirm`).
- **b. Handler:** [SetupMezzo.tsx:356-383](../../src/autisti/SetupMezzo.tsx#L356-L383); write fisico via `appendEventoOperativo` [SetupMezzo.tsx:101](../../src/autisti/SetupMezzo.tsx#L101).
- **c. Tipo:** `setItemSync` append.
- **d. Destinazione:** `storage/@storico_eventi_operativi`.
- **e. Shape record:**
  - `id : string = \`${tipoAssetto}-${badge}-${now}-${dopo.targaMotrice||''}-${dopo.targaRimorchio||''}\`` (`now` congelato a [riga 248](../../src/autisti/SetupMezzo.tsx#L248))
  - `tipo : string` = `(prima.targaMotrice || prima.targaRimorchio) ? "CAMBIO_ASSETTO" : "INIZIO_ASSETTO"`
  - `timestamp : number` = `now` (Date.now() ms, riga 248)
  - `badgeAutista : string` = `String(autista.badge)`
  - `nomeAutista : string` = `String(autista.nome)`
  - `autista : string` = `autista.nome` (alias) · `autistaNome : string` = `autista.nome` (alias)
  - `prima : object` = `{ targaMotrice, targaRimorchio, motrice, rimorchio }` — **DOPPIO FORMATO**: `motrice`=`targaMotrice`, `rimorchio`=`targaRimorchio` (stesso valore). `prima.targaMotrice = prevSession?.targaMotrice ?? mezzoLocal.targaCamion ?? mezzoLocal.targaCamionPrima ?? null`.
  - `dopo : object` = `{ targaMotrice, targaRimorchio, motrice, rimorchio }` — **DOPPIO FORMATO**. `dopo.targaMotrice = targaCamion ? String(targaCamion) : null` (**NON** ri-normalizzata con `fmtTarga` a [riga 344](../../src/autisti/SetupMezzo.tsx#L344)).
  - `luogo : null` · `statoCarico : null` · `condizioni : null` (literal)
  - `source : string = "setup_confirm"` (literal — **INCOERENTE**: altrove `"AUTISTI"`/`"CambioMezzoAutista"`)
- **f. Note compat.:** `source="setup_confirm"`; doppio formato targhe in `prima`/`dopo`; `dopo.targaMotrice` non passa per `fmtTarga` (l'`id` include la stessa targa grezza). **Confermato sul reale** (record `CAMBIO_ASSETTO-517-…`, `source:"setup_confirm"`, `prima/dopo` con alias `motrice`/`rimorchio`).

---

### SCHEDA 3 — Conferma setup → sessione attiva + auto-revoca conflitti
- **a. Azione UI:** schermata Selezione Mezzo, click **CONFERMA**.
- **b. Handler:** [SetupMezzo.tsx:299-386](../../src/autisti/SetupMezzo.tsx#L299-L386); write fisico [SetupMezzo.tsx:386](../../src/autisti/SetupMezzo.tsx#L386).
- **c. Tipo:** `setItemSync` **overwrite** dell'intero array sessioni.
- **d. Destinazione:** `storage/@autisti_sessione_attive`.
- **e. Shape — record sessione propria** ([righe 348-354](../../src/autisti/SetupMezzo.tsx#L348-L354), **solo 5 campi**):
  - `targaMotrice : string` = `targaCamion` (selezionata; deriva da `m.targa` già `fmtTarga`'d in init)
  - `targaRimorchio : string|null` = `targaRimorchio || null`
  - `badgeAutista : string` = `String(autista.badge)`
  - `nomeAutista : string` = `String(autista.nome)`
  - `timestamp : number` = `now` (Date.now() ms, riga 248)
  - **NON presenti:** `id`, `autistaNome`, `autista`, `stato`/`statoSessione`, `revoked` (vedi §5).
- **e-bis. Mutazione conflitti (stesso write):** per ogni sessione **di altri badge** in conflitto di targa, viene mergiato `revoked : { ...s.revoked, by:"AUTO", at:now, scope, reason }` ([righe 319-330](../../src/autisti/SetupMezzo.tsx#L319-L330)): `scope ∈ {MOTRICE,RIMORCHIO,TUTTO}`, `by="AUTO"` (literal), `at=now`, `reason` = template con `autista.badge`; `targaMotrice`/`targaRimorchio` azzerate a `null` sul lato in conflitto.
- **f. Note compat.:** array sovrascritto integralmente: `nuove = prev.filter(escludi badge corrente).map(applica revoca).push(sessione propria)`. **Confermato sul reale**: i record sessione hanno esattamente `{badgeAutista, nomeAutista, targaMotrice, targaRimorchio, timestamp}`, nessun `id`/`stato`/`revoked` nei 8 campionati (`revoked` è **condizionale** al ramo conflitto). Rischio race su array condiviso. Targa non ri-normalizzata al momento dell'oggetto sessione (dipende dalla normalizzazione a monte).

---

### SCHEDA 4 — Logout → evento `LOGOUT_AUTISTA`
- **a. Azione UI:** Home, click **Logout** (`handleLogout`).
- **b. Handler:** [HomeAutista.tsx:227-236](../../src/autisti/HomeAutista.tsx#L227-L236); write fisico via `appendEventoOperativo` [HomeAutista.tsx:60](../../src/autisti/HomeAutista.tsx#L60).
- **c. Tipo:** `setItemSync` append.
- **d. Destinazione:** `storage/@storico_eventi_operativi`.
- **e. Shape record:**
  - `id : string = \`LOGOUT_AUTISTA-${badge}-${now}\`` (`now=Date.now()` riga 226)
  - `tipo : string = "LOGOUT_AUTISTA"` · `timestamp : number = now`
  - `badgeAutista : string` = `a.badge`
  - `nomeAutista : string` = `a.nome ?? ""` · `autistaNome : string` = `a.nome ?? ""` · `autista : string` = `a.nome ?? ""` (fallback stringa vuota)
  - `source : string = "AUTISTI"` (literal)
- **f. Note compat.:** nessuna targa; tripla ridondanza nome con fallback `?? ""`; `source="AUTISTI"`.

---

### SCHEDA 5 — Logout → rimozione sessione
- **a. Azione UI:** Home, click **Logout**.
- **b. Handler/write:** [HomeAutista.tsx:242-245](../../src/autisti/HomeAutista.tsx#L242-L245).
- **c. Tipo:** `setItemSync` **overwrite** (filtro).
- **d. Destinazione:** `storage/@autisti_sessione_attive`.
- **e. Operazione:** `aggiornate = sessioni.filter(s => s?.badgeAutista !== a.badge)` → riscrive l'array residuo (rimuove la sessione del badge corrente). Confronto badge **raw** (no normalizzazione).
- **f. Note compat.:** non scrive un record nuovo; overwrite dell'intero array. Race last-write-wins.

---

### SCHEDA 6 — Sgancio motrice → sessione
- **a. Azione UI:** Home → modale **SGANCIA MOTRICE**, click **CONFERMA** (`handleSgancioMotriceConfirm`).
- **b. Handler/write:** [HomeAutista.tsx:287-293](../../src/autisti/HomeAutista.tsx#L287-L293).
- **c. Tipo:** `setItemSync` **overwrite** (map).
- **d. Destinazione:** `storage/@autisti_sessione_attive`.
- **e. Operazione:** `sessioni.map(s => s.badgeAutista===a.badge ? { ...s, targaMotrice:null } : s)` → `targaMotrice=null` (literal) sul solo badge corrente, resto invariato via spread.
- **f. Note compat.:** avviene **prima** dell'append evento (scheda 7). Overwrite intero array.

---

### SCHEDA 7 — Sgancio motrice → evento `CAMBIO_ASSETTO`
- **a. Azione UI:** modale Sgancio motrice, **CONFERMA**.
- **b. Handler:** [HomeAutista.tsx:295-319](../../src/autisti/HomeAutista.tsx#L295-L319); write fisico via `appendEventoOperativo` [HomeAutista.tsx:60](../../src/autisti/HomeAutista.tsx#L60) (**stesso call-site della scheda 4**).
- **c. Tipo:** `setItemSync` append.
- **d. Destinazione:** `storage/@storico_eventi_operativi`.
- **e. Shape record:**
  - `id : string = \`CAMBIO_ASSETTO-${badge}-${now}-${prima.targaMotrice||''}-${prima.targaRimorchio||''}\`` (**targhe PRIMA**, non DOPO — differenza vs scheda 2; `now` congelato riga 272)
  - `tipo : string = "CAMBIO_ASSETTO"` · `timestamp : number = now`
  - `badgeAutista` = `a.badge` · `nomeAutista`/`autistaNome`/`autista` = `a.nome ?? ""`
  - `prima : object` = `{ targaMotrice, targaRimorchio, motrice, rimorchio }` (DOPPIO FORMATO) da `getMezzoLocal` (`m.targaCamion`/`m.targaRimorchio`, **non normalizzate**)
  - `dopo : object` = `{ targaMotrice:null, targaRimorchio:(m?.targaRimorchio ?? null), motrice:null, rimorchio:(m?.targaRimorchio ?? null) }` (motrice sganciata → `null`)
  - `luogo : string` = `(preset==="ALTRO") ? sgancioLuogoAltro.trim().toUpperCase() : sgancioLuogoPreset` (preset default `"STABIO"`, opzioni `{STABIO,MEV,ALTRO}`) — **ramo ALTRO fa `.toUpperCase()`**
  - `statoCarico : null` · `condizioni : null` · `source : string = "AUTISTI"` (literal)
- **f. Note compat.:** `id` con targhe **PRIMA**; `luogo` valorizzato (≠ scheda 2 dove è null); ramo ALTRO uppercase (≠ scheda 8). `source="AUTISTI"`.

---

### SCHEDA 8 — Cambio mezzo · SGANCIO RIMORCHIO → evento `CAMBIO_ASSETTO`
- **a. Azione UI:** schermata Cambio mezzo (modalità RIMORCHIO), click **CONFERMA** (`conferma`).
- **b. Handler:** [CambioMezzoAutista.tsx:178-202](../../src/autisti/CambioMezzoAutista.tsx#L178-L202); write fisico via `appendEventoOperativo` [CambioMezzoAutista.tsx:71](../../src/autisti/CambioMezzoAutista.tsx#L71).
- **c. Tipo:** `setItemSync` append.
- **d. Destinazione:** `storage/@storico_eventi_operativi`.
- **e. Shape record:**
  - `id : string = \`CAMBIO_ASSETTO-${cur.badgeAutista}-${now}-${prima.targaMotrice||''}-${prima.targaRimorchio||''}\`` (targhe PRIMA; `now` riga 166)
  - `tipo : string = "CAMBIO_ASSETTO"` · `timestamp : number = now`
  - `badgeAutista` = `cur.badgeAutista` · `nomeAutista`/`autista`/`autistaNome` = `cur.nomeAutista`
  - `prima : object` (DOPPIO FORMATO) = motrice/rimorchio correnti
  - `dopo : object` = `{ targaMotrice:(cur.targaMotrice||null), targaRimorchio:null, motrice:…, rimorchio:null }` (rimorchio sganciato)
  - `luogo : string` = `(luogo==="ALTRO") ? luogoAltro.trim() : luogo` (`{MEV,STABIO,ALTRO}`) — **ramo ALTRO NON fa `.toUpperCase()`** (≠ scheda 7)
  - `statoCarico : string` = state `{PIENO,PARZIALE,VUOTO}` default `"VUOTO"` (**scritto solo qui**; in setup/sgancio è null)
  - `condizioni : object` = `{ generali:{freni,gomme,perdite}, specifiche:{botole,cinghie,stecche,tubi} }` boolean, default **tutti `true`** (true=OK)
  - `source : string = "CambioMezzoAutista"` (literal — **TERZO valore di `source`**)
- **f. Note compat.:** `source="CambioMezzoAutista"`; `luogoAltro` non uppercase (≠ scheda 7); `statoCarico`/`condizioni` valorizzati solo in questo ramo. **Nota fieldUnion reale:** `statoCarico`/`condizioni` compaiono nell'union della collection ma erano `null` nei 2 campioni `setup_confirm` (sono valorizzati solo per gli eventi `CambioMezzoAutista`).

---

### SCHEDA 9 — Cambio mezzo · SGANCIO RIMORCHIO → sessione
- **a. Azione UI:** Cambio mezzo (RIMORCHIO), **CONFERMA**.
- **b. Handler/write:** [CambioMezzoAutista.tsx:205-211](../../src/autisti/CambioMezzoAutista.tsx#L205-L211).
- **c. Tipo:** `setItemSync` **overwrite** (map).
- **d. Destinazione:** `storage/@autisti_sessione_attive`.
- **e. Operazione:** `sessioni.map(s => s.badgeAutista===cur.badgeAutista ? { ...s, targaRimorchio:null } : s)`.
- **f. Note compat.:** overwrite intero array; `targaRimorchio→null` sul badge corrente.

---

### SCHEDA 10 — Cambio mezzo · CAMBIO MOTRICE → sessione
- **a. Azione UI:** Cambio mezzo (modalità MOTRICE), **CONFERMA**.
- **b. Handler/write:** [CambioMezzoAutista.tsx:230-236](../../src/autisti/CambioMezzoAutista.tsx#L230-L236).
- **c. Tipo:** `setItemSync` **overwrite** (map).
- **d. Destinazione:** `storage/@autisti_sessione_attive`.
- **e. Operazione:** `sessioni.map(s => s.badgeAutista===cur.badgeAutista ? { ...s, targaMotrice:null } : s)`.
- **f. Note compat.:** **questo ramo NON scrive alcun evento** `@storico_eventi_operativi` (≠ sgancio rimorchio/sgancio motrice): aggiorna solo sessioni + locale, poi naviga a `setup-mezzo?mode=motrice`. È un debito noto della madre (vedi §5/§7).

---

### SCHEDA 11 — Conferma controllo
- **a. Azione UI:** schermata Controllo mezzo, click **CONFERMA CONTROLLO** (`salva`).
- **b. Handler/write:** [ControlloMezzo.tsx:101-119](../../src/autisti/ControlloMezzo.tsx#L101-L119).
- **c. Tipo:** `setItemSync` append (`storico.push(...)` poi overwrite array).
- **d. Destinazione:** `storage/@controlli_mezzo_autisti`. **Rischio ALTO** (gate operativo + valle).
- **e. Shape record:**
  - `id : string` = `crypto.randomUUID()` o fallback `id_<Date.now()>_<rand16>` (`genId`, [riga 12](../../src/autisti/ControlloMezzo.tsx#L12))
  - `autistaNome : string|null` = `autista.nome || null`
  - `badgeAutista : string|null` = `autista.badge || null`
  - `targaCamion : string|null` = `mezzo.targaCamion || null` (**NON uppercase**)
  - `targaRimorchio : string|null` = `mezzo.targaRimorchio || null`
  - `target : string` = `targetSelezionato ∈ {"motrice","rimorchio","entrambi"}` (default `"motrice"`)
  - `check : object` = `{ gomme:bool, freni:bool, luci:bool, perdite:bool }` — **default tutti `true`**; `true` = OK
  - `note : string|null` = `note || null`
  - `obbligatorio : boolean = true` (**LITERAL costante**; usato dal gate [AutistiGate.tsx:111](../../src/autisti/AutistiGate.tsx#L111))
  - `timestamp : number` = `Date.now()` ms al click
- **f. Note compat.:** **NON** ha `stato`/`letta`/`flagVerifica`. Campo di servizio valle: `obbligatorio:true`. **Confermato sul reale** (425 record: `{target,autistaNome,obbligatorio,timestamp,targaCamion,targaRimorchio,badgeAutista,note,check{luci,gomme,freni,perdite}}`). Targa non uppercase nel codice.

---

### SCHEDA 12 — Salva rifornimento → tmp
- **a. Azione UI:** schermata Rifornimento, click **Salva rifornimento** (`saveCore`).
- **b. Handler/write:** [Rifornimento.tsx:159-187](../../src/autisti/Rifornimento.tsx#L159-L187).
- **c. Tipo:** `setItemSync` append. **Rischio ALTO**.
- **d. Destinazione:** `storage/@rifornimenti_autisti_tmp`.
- **e. Shape record:**
  - `id : string` = `genId()` (UUID o `id_<ts>_<rand>`)
  - `autistaId : string|null` = `autista?.id || null`
  - `autistaNome : string|null` = `autista?.nome || null` · `badgeAutista : string|null` = `autista?.badge || null`
  - `targaCamion : string|null` = `mezzo?.targaCamion || null` (**NON uppercase**) · `targaRimorchio : string|null`
  - `tipo : string` = `{"caravate","distributore"}` (default `"caravate"`)
  - `metodoPagamento : string|null` = `tipo==="distributore" ? metodo : null`; `metodo ∈ {"piccadilly","eni","contanti"}`
  - `paese : string|null` = `tipo==="distributore" ? paese : null`; `paese ∈ {"IT","CH"}`
  - `km : number` = `Number(km.replace(/\\./g,''))` (rimuove separatori migliaia)
  - `litri : number` = `parseDecimal(litri)` (virgola→punto) `?? NaN`
  - `importo : number|null` = `metodo==="contanti" ? Number(importo) : null` (**condiziona su `metodo`, non su `tipo`**)
  - `note : string|null` = `note || null`
  - `data : number` = `Date.now()` ms al save (**il campo timestamp si chiama `data`**, non `timestamp`)
  - `flagVerifica : boolean` = `!!showAlert` (true se un alert di verifica era attivo)
  - `confermatoAutista : boolean = true` (**LITERAL costante**)
- **f. Note compat.:** campi valle: `flagVerifica`, `confermatoAutista`. Timestamp nel campo `data`. **Confermato sul reale** (`tipo`/`metodoPagamento`/`paese` come valori UI — NB i record reali contengono anche valori admin-editati tipo `paese:"svizzera"`, `metodoPagamento:"piccadilly card"` via `adminEdit.patch`, ma la **scrittura driver** usa i codici brevi). `importo`/`note` esclusi dagli allowedFields del boundary IA su questo doc (non rilevante per la scrittura). `(VALLE)` su questo doc: `adminEdit`.

---

### SCHEDA 13 — Salva rifornimento → dossier business (setDoc diretto)
- **a. Azione UI:** Rifornimento, **Salva** (stesso flusso scheda 12).
- **b. Handler:** [Rifornimento.tsx:189-205](../../src/autisti/Rifornimento.tsx#L189-L205); item builder `buildDossierItem` [righe 44-60](../../src/autisti/Rifornimento.tsx#L44-L60).
- **c. Tipo:** **`setDoc` diretto** (NON `setItemSync`), `setDoc(dossierRef, { ...dossier, items: updatedItems })` **senza `{merge:true}`**. Upsert per `id` (replace se trovato, append altrimenti).
- **d. Destinazione:** documento Firestore `storage/@rifornimenti`. **Contenitore = `{ items: [...] }`** (NON `{ value: [...] }`).
- **e. Shape `items[]` (dossier-item, DIVERSO dal record tmp):**
  - `id : string` = `String(record.id)` (**stesso id del record tmp** → join tmp↔business)
  - `mezzoTarga : string|null` = `record.targaCamion ?? targaMotrice ?? mezzoTarga` → `String().toUpperCase().trim()` (**QUI uppercase+trim**)
  - `data : string` = `formatDateUI(ts)` (**STRINGA `gg/mm/aaaa`**, non ms); `ts = Number(record.timestamp ?? record.data ?? Date.now())` (NB legge `record.timestamp` inesistente → cade su `record.data`)
  - `litri : number|null` = `toNumberOrNull(record.litri)` · `km : number|null` = `toNumberOrNull(record.km)`
  - `distributore : string` = `buildDistributore(record)` = join `" "` di `[tipo, paese, metodoPagamento]` presenti, altrimenti `"-"`
  - `costo : number|null` = `toNumberOrNull(record.importo)` (**rinominato `importo`→`costo`**)
  - `note : string` = `record.note != null ? String(record.note) : ""` (**stringa vuota, non null**)
- **f. Note compat.:** shape **profondamente diversa** dal tmp: `data` stringa UI, `importo→costo`, targa uppercase, `note` ''. **Confermato sul reale** (`@rifornimenti`: 368 record `items[]` `{id,litri,costo,data:"12/01/2026",mezzoTarga,distributore}`, `id` allineato col tmp). Doppia scrittura non atomica (tmp + dossier): se la seconda fallisce la tmp resta (retry → nuovo id → duplicato).

---

### SCHEDA 14 — Foto segnalazione (upload Storage)
- **a. Azione UI:** Segnalazioni, **+ AGGIUNGI FOTO** (`handleAddFoto`); upload **immediato alla selezione** (prima del salvataggio record).
- **b. Handler:** [Segnalazioni.tsx:278-282](../../src/autisti/Segnalazioni.tsx#L278-L282).
- **c. Tipo:** `uploadBytes` + `getDownloadURL`.
- **d. Destinazione Storage:** `autisti/segnalazioni/<baseId>/<ts>_<index>.<safeExt>`.
  - `<baseId>` = `recordId ?? genId()` (congelato per la sessione form, riusato come `record.id`)
  - `<ts>` = `Date.now()` per file · `<index>` = `foto.length + i` · `<safeExt>` ∈ `{jpg,jpeg,png,webp}` (whitelist, default `"jpg"`)
- **e. Risultato:** `FotoLocal { id:genId(), url, storagePath }` → confluisce in `fotoUrls`/`fotoStoragePaths` (scheda 15). Max 3 foto.
- **f. Note compat.:** **foto orfane**: `removeFoto` ([Segnalazioni.tsx:294](../../src/autisti/Segnalazioni.tsx#L294)) toglie solo dallo stato, **nessun `deleteObject`** → abbandono pagina = file orfani.

---

### SCHEDA 15 — Invia segnalazione → tmp
- **a. Azione UI:** Segnalazioni, click **INVIA SEGNALAZIONE** (`handleSave`).
- **b. Handler/write:** [Segnalazioni.tsx:311-350](../../src/autisti/Segnalazioni.tsx#L311-L350).
- **c. Tipo:** `setItemSync` append. **Rischio ALTO** (alimenta manutenzione).
- **d. Destinazione:** `storage/@segnalazioni_autisti_tmp`.
- **e. Shape record (sottoinsieme DRIVER — 22 campi):**
  - `id : string` = `recordId ?? genId()` (riusa l'id congelato dalle foto)
  - `ambito : string` = `{"motrice","rimorchio"}`
  - `mezzoId : string|null` = `mezzoRef?.id || null`
  - `targa : string|null` = `targaSelezionata || null` (`isMotrice ? targaMotrice : targaRimorchio`)
  - `categoriaMezzo : string|null` = `mezzoRef?.categoria || null`
  - `targaCamion : string|null` = `targaMotrice || null` · `targaRimorchio : string|null` (**TRIPLO formato targa: `targa`+`targaCamion`+`targaRimorchio`**)
  - `autistaId : string|null` · `autistaNome : string|null` · `badgeAutista : string|null`
  - `tipoProblema : string` = `{"motore","freni","gomme","idraulico","elettrico","altro"}`
  - `posizioneGomma : string|null` = `tipo==="gomme" ? {anteriore,posteriore,asse1,asse2,asse3} : null`
  - `problemaGomma : string|null` = `tipo==="gomme" ? {forata,usurata,da_controllare,altro} : null`
  - `descrizione : string` = `descrizione.trim()` (obbligatorio non vuoto)
  - `note : string|null` = `note.trim() || null`
  - `fotoUrls : string[]` = `foto.map(f => f.url)` · `fotoStoragePaths : string[]` = `foto.map(f => f.storagePath)`
  - `data : number` = `nowTs` = `useMemo(()=>Date.now(),[])` **CONGELATO AL MOUNT** della pagina (non al click)
  - `stato : string = "nuova"` (LITERAL, **femminile**)
  - `letta : boolean = false` · `flagVerifica : boolean = false` · `motivoVerifica : null`
- **f. Note compat.:** campi valle scritti dal driver: `stato:"nuova"`, `letta:false`, `flagVerifica:false`, `motivoVerifica:null`. **INCOERENZA stato** `"nuova"` vs gomme `"nuovo"` (§5). **`data` congelato al mount** (TIMESTAMP-MAI-DA-CLICK aggravato). **(VALLE) — NON scrivere:** nei record reali compaiono in più `timestamp` (duplicato di `data`), `target`, `foto`, `chiusa`, `chiusa_by`, `chiusuraDi`, `chiusuraRefId`, `chiusuraData`, `dataChiusura`, `dataPresaInCarico`, `linkedLavoroId`, `linkedLavoroIds`, `linkedMultiple`, `adminEdit` — tutti aggiunti a valle (Centro Controllo/admin), non dal driver.

---

### SCHEDA 16 — Foto richiesta (upload Storage)
- **a. Azione UI:** Richiesta attrezzature, **Aggiungi foto** (`handleFoto`); upload immediato.
- **b. Handler:** [RichiestaAttrezzature.tsx:72-87](../../src/autisti/RichiestaAttrezzature.tsx#L72-L87).
- **c. Tipo:** `uploadBytes` + `getDownloadURL`.
- **d. Destinazione Storage:** `autisti/richieste-attrezzature/<nextId>/<ts>.<safeExt>`.
  - `<nextId>` = `recordId ?? genId()` · `<ts>` = `Date.now()` · `<safeExt>` ∈ `{jpg,jpeg,png,webp}` default `"jpg"`
- **e. Risultato:** **foto singola** → `fotoUrl` + `fotoStoragePath` nello state (scheda 19).
- **f. Note compat.:** prima dell'upload nuovo cancella la foto precedente (scheda 17).

---

### SCHEDA 17 — Foto richiesta (sostituzione → delete precedente)
- **a. Azione UI:** Richiesta, selezione nuova foto quando ne esiste già una.
- **b. Handler/write:** [RichiestaAttrezzature.tsx:75-81](../../src/autisti/RichiestaAttrezzature.tsx#L75-L81) (`deleteObject` riga 77).
- **c. Tipo:** `deleteObject`.
- **d. Destinazione:** `<fotoStoragePath precedente>` (`autisti/richieste-attrezzature/...`).
- **f. Note compat.:** in try/catch, **errore ignorato** (`console.error`).

---

### SCHEDA 18 — Foto richiesta (rimozione esplicita)
- **a. Azione UI:** Richiesta, click **Rimuovi foto** (`handleRemoveFoto`).
- **b. Handler/write:** [RichiestaAttrezzature.tsx:97-108](../../src/autisti/RichiestaAttrezzature.tsx#L97-L108) (`deleteObject` riga 100).
- **c. Tipo:** `deleteObject`.
- **d. Destinazione:** `<fotoStoragePath corrente>`.
- **f. Note compat.:** azzera `fotoUrl`/`fotoStoragePath`/`recordId` nello state; errore ignorato.

---

### SCHEDA 19 — Invia richiesta → tmp
- **a. Azione UI:** Richiesta attrezzature, click **INVIA RICHIESTA** (`invia`).
- **b. Handler/write:** [RichiestaAttrezzature.tsx:128-149](../../src/autisti/RichiestaAttrezzature.tsx#L128-L149).
- **c. Tipo:** `setItemSync` append. **Rischio ALTO**.
- **d. Destinazione:** `storage/@richieste_attrezzature_autisti_tmp`.
- **e. Shape record (sottoinsieme DRIVER):**
  - `id : string` = `recordId ?? genId()`
  - `testo : string` = `testo.trim()` (obbligatorio, lunghezza ≥ 3)
  - `autistaNome : string|null` = `autista?.nome ?? null` · `badgeAutista : string|null` = `autista?.badge ?? null` (**niente `autistaId`** qui)
  - `targaCamion : string|null` = `mezzo?.targaCamion ?? null` (NON uppercase) · `targaRimorchio : string|null`
  - `fotoUrl : string|null` = `fotoUrl ?? null` (**singola, non array**) · `fotoStoragePath : string|null`
  - `timestamp : number` = `Date.now()` ms al click (**campo `timestamp`**, ≠ rifornimento/segnalazione che usano `data`)
  - `stato : string = "nuova"` (LITERAL femminile) · `letta : boolean = false`
- **f. Note compat.:** campi valle scritti dal driver: `stato:"nuova"`, `letta:false`. **NON** ha `flagVerifica`/`motivoVerifica`. **(VALLE) — NON scrivere:** record reali contengono in più `evasa`, `evasa_by`, `dataEvasione`, `nascostoInArchivio`, `fotoDataUrl` (aggiunti a valle/admin).

---

### SCHEDA 20 — Salva gomme → tmp
- **a. Azione UI:** Home → modale **Gomme** (`NextGommeAutistaModal` lato NEXT; madre `GommeAutistaModal`), click **Salva** (`handleSave`).
- **b. Handler:** `appendGommeAutistaTmpRecordIfMissing` [GommeAutistaModal.tsx:161-173](../../src/autisti/GommeAutistaModal.tsx#L161-L173); write fisico [riga 171](../../src/autisti/GommeAutistaModal.tsx#L171).
- **c. Tipo:** `setItemSync` **PREPEND** (`[record, ...list]`, idempotente: skip se `id` già presente). **Rischio ALTO**.
- **d. Destinazione:** `storage/@cambi_gomme_autisti_tmp`.
- **e. Shape record:**
  - `id : string` = `genId()`
  - `targetType : string` = `{"motrice","rimorchio"}` (default `"motrice"`)
  - `targetTarga : string` = `normalizeTarga(targetTargaRaw)` = `String().toUpperCase().replace(/\\s+/g,'').trim()` (**UPPERCASE + no spazi**)
  - `categoria : string` = categoria da `@mezzi_aziendali` per targa, altrimenti `""`
  - `km : number` = `Number(km)` (validato `>0`)
  - `data : number` = `Date.now()` ms al click (**campo `data`**)
  - `marca : string|null` = `String(gommeData.marca).trim() || null` (cambio / rotazione+cambio), altrimenti `null`
  - `tipo : string` = `mode==="cambio" ? {"sostituzione","riparazione"} : "rotazione"` (literal nel ramo rotazione)
  - `gommeIds : string[]` = `gommeData.gommeIds ?? []` (può contenere **testo libero** nei dati reali, es. `"SOSTITUZIONE VALVOLA LATO SX 3 ASSE"`)
  - `asseId : string|null` · `asseLabel : string|null`
  - `rotazioneSchema : string|null` = ramo rotazione `("1<->2"…)` else `null`
  - `rotazioneText : string|null` = ramo rotazione (`"Rotazione assi 1↔2; cambio gomme assi: 2"`) else `null`
  - `rotazioneAssi : {from:number,to:number}|null`
  - `assiConCambioGomme : number[]`
  - `autista : object` = `{ id:autistaLocal?.id ?? null, nome:…?? null, badge:…?? null }` (**OGGETTO ANNIDATO**, ≠ campi flat `badgeAutista`/`autistaNome` degli altri file)
  - `contesto : object` = `{ targaCamion:mezzoLocal?.targaCamion ?? null, targaRimorchio:… }` (**OGGETTO ANNIDATO**, targhe **non** normalizzate)
  - `stato : string = "nuovo"` (LITERAL, **MASCHILE** → INCOERENZA vs `"nuova"`)
  - `letta : boolean = false`
- **f. Note compat.:** struttura **strutturalmente diversa** dagli altri tmp (annidamenti `autista{}`/`contesto{}`; `targetTarga` come campo targa primario). `stato:"nuovo"` maschile. **Confermato sul reale** (9 record; oltre a `"nuovo"` compare anche `stato:"importato"` su record di valle). **(VALLE) — NON scrivere:** `adminEdit`.

---

## 4. Letture chiave a supporto (contesto, non scritture)

Per coerenza implementativa NEXT (già in parità, vedi audit parità): login legge `@colleghi` ([LoginAutista.tsx:59](../../src/autisti/LoginAutista.tsx#L59)); liste/categorie da `@mezzi_aziendali`; revoche/conflitti da `@autisti_sessione_attive`; gate controllo da `@controlli_mezzo_autisti` ([AutistiGate.tsx:107](../../src/autisti/AutistiGate.tsx#L107)). Tutte via `getItemSync` (`storage/<key>.value`).

---

## 5. Incoerenze madre da decidere — DOMANDE APERTE (per Giuseppe)

Tutte catturate dal codice + confermate sul dato reale. **Non decise** in questo documento.

1. **Stato `"nuovo"` vs `"nuova"`.** Gomme scrivono `stato:"nuovo"` (maschile, [GommeAutistaModal.tsx:370](../../src/autisti/GommeAutistaModal.tsx#L370)); segnalazioni e richieste `stato:"nuova"` (femminile, [Segnalazioni.tsx:340](../../src/autisti/Segnalazioni.tsx#L340), [RichiestaAttrezzature.tsx:142](../../src/autisti/RichiestaAttrezzature.tsx#L142)); controllo non ha `stato`. **→ NEXT replica l'incoerenza o la normalizza?**
2. **`source` dell'evento storico con 3 valori.** `"AUTISTI"` (login/logout/sgancio), `"setup_confirm"` (setup), `"CambioMezzoAutista"` (cambio rimorchio). **→ NEXT replica i 3 valori o li uniforma?**
3. **Nome del campo timestamp.** Eventi e controllo: `timestamp`. Rifornimento tmp e segnalazione: `data`. Richiesta e gomme: rispettivamente `timestamp` e `data`. **→ NEXT replica i nomi divergenti o li uniforma?**
4. **TIMESTAMP-MAI-DA-CLICK.** Tutti i timestamp sono `Date.now()` al click; la **segnalazione** usa `nowTs` **congelato al mount** ([Segnalazioni.tsx:118](../../src/autisti/Segnalazioni.tsx#L118)). Questo viola la regola di progetto «TIMESTAMP-MAI-DA-CLICK». **→ Replicare byte-per-byte (timestamp da click) o introdurre un timestamp server/affidabile per NEXT?** (tensione tra «compat al byte» e la regola).
5. **Struttura autista/targhe non uniforme.** Gomme: `autista:{id,nome,badge}` + `contesto:{targaCamion,targaRimorchio}` annidati e `targetTarga` uppercase. Altri: campi flat `autistaNome`/`badgeAutista` e targhe non normalizzate. **→ NEXT mantiene le strutture per-collection o le uniforma?**
6. **Tripla ridondanza nome nell'evento storico** (`nomeAutista`=`autistaNome`=`autista`) e **doppio formato targhe** (`targaMotrice`+`motrice`). Confermati sul reale e attesi dalla valle. **→ NEXT li replica (consigliato per compat) o riduce?**
7. **Normalizzazione targhe disomogenea.** Dossier `mezzoTarga` uppercase+trim; gomme `targetTarga` uppercase+no-spazi; controllo/rifornimento/richiesta/segnalazione **non** uppercase (dipendono dalla normalizzazione a monte in `SetupMezzo`). **→ NEXT introduce normalizzazione uniforme o replica?**
8. **Cambio motrice senza evento storico** ([SCHEDA 10](#scheda-10--cambio-mezzo--cambio-motrice--sessione)): a differenza degli altri cambi/sganci, non scrive `@storico_eventi_operativi`. **→ Debito da replicare o da colmare in NEXT?**
9. **`importo` rifornimento condizionato su `metodo` e non su `tipo`** ([Rifornimento.tsx:175](../../src/autisti/Rifornimento.tsx#L175)): con `tipo="caravate"` resta sempre `null`. **→ Replicare il comportamento o correggere?**

---

## 6. Deroghe barriera necessarie per NEXT (`src/utils/cloneWriteBarrier.ts`)

Oggi **non esiste alcuna deroga per il path `/next/autisti` (app autista)** nella barriera: le sole deroghe che toccano collection autisti sono per `/next/centro-controllo`, `/next/autisti-admin`, `/next/autisti-inbox`, `/next/manutenzioni` (superfici admin/valle). Perché NEXT driver scriva via il `setItemSync` madre servirebbero deroghe nuove con:

- **Path autorizzati:** `/next/autisti` + sottopath `/next/autisti/*` (oggi assenti ovunque).
- **Storage keys (`storageSync.setItemSync`):**
  - `@autisti_sessione_attive` — oggi in nessuno scope «write» dedicato (solo dentro `DELETE_MEZZO_ALLOWED_STORAGE_KEYS`, [cloneWriteBarrier.ts:135](../../src/utils/cloneWriteBarrier.ts#L135), path `/next/centro-controllo`).
  - `@controlli_mezzo_autisti` — esiste `CONTROLLI_WRITE_SCOPE` ma solo path `/next/centro-controllo` ([righe 118-120](../../src/utils/cloneWriteBarrier.ts#L118-L120)).
  - `@rifornimenti_autisti_tmp` — `RIFORNIMENTI_WRITE_SCOPE`, path `/next/centro-controllo` ([111-114](../../src/utils/cloneWriteBarrier.ts#L111-L114)).
  - `@segnalazioni_autisti_tmp` — `SEGNALAZIONI_WRITE_SCOPE`, path `/next/centro-controllo` ([115-117](../../src/utils/cloneWriteBarrier.ts#L115-L117)).
  - `@richieste_attrezzature_autisti_tmp` — `RICHIESTE_WRITE_SCOPE`, path `/next/centro-controllo` ([121-123](../../src/utils/cloneWriteBarrier.ts#L121-L123)).
  - `@cambi_gomme_autisti_tmp` — presente solo in `DELETE_MEZZO_ALLOWED_STORAGE_KEYS` ([133](../../src/utils/cloneWriteBarrier.ts#L133)).
  - **`@storico_eventi_operativi` — assente da QUALUNQUE allowed-keys set della barriera.** È la lacuna più rilevante: nessuno scope esistente lo consente; servirebbe una deroga nuova per gli eventi login/logout/assetto/sgancio.
- **Firestore doc diretto (`setDoc`):** `storage/@rifornimenti` per il dossier (scheda 13). Esiste `RIFORNIMENTI_ALLOWED_FIRESTORE_DOC_PATHS = {"storage/@rifornimenti"}` ma legato a path `/next/centro-controllo` ([113](../../src/utils/cloneWriteBarrier.ts#L113)). **Da verificare** se il barrier-fetch intercetta la `setDoc` diretta (vedi §7).
- **Storage path prefixes (upload/delete):** `autisti/segnalazioni/` e `autisti/richieste-attrezzature/`. Esiste già un precedente di prefisso Storage in `NEXT_SEGNALAZIONE_DELETE_ALLOWED_STORAGE_PATH_PREFIXES = ["autisti/segnalazioni/"]` ([172-174](../../src/utils/cloneWriteBarrier.ts#L172-L174)), ma legato a `/next/manutenzioni`.

> In sintesi: per accendere le scritture NEXT servirebbe **uno (o più) scope nuovo con path `/next/autisti*`** che copra le 7 storage-key sopra + il doc `storage/@rifornimenti` + i 2 prefissi Storage; con attenzione particolare a `@storico_eventi_operativi`, oggi non coperto da nulla.

---

## 7. Punti DA VERIFICARE a runtime (non chiusi dalla lettura statica)

1. **`setDoc` diretto del dossier e barrier-fetch.** La scheda 13 bypassa `assertCloneWriteAllowed` (non passa da `setItemSync`); resta da verificare se `installCloneFetchBarrier` ([cloneWriteBarrier.ts:987](../../src/utils/cloneWriteBarrier.ts#L987)) intercetta la richiesta di rete Firestore della `setDoc` in runtime clone, e quindi se anche questa scrittura va esplicitamente derogata.
2. **Foto su Firebase Storage e barriera.** `uploadBytes`/`deleteObject` usano il transport Storage: verificare a runtime se il barrier-fetch li blocca nel clone e se serve deroga sui prefissi `autisti/...`.
3. **Campo `revoked` su `@autisti_sessione_attive`.** Non presente nei 8 record campionati (ramo conflitto non attivo al campionamento): la shape esatta di `revoked` scritta dal driver ([SetupMezzo.tsx:323-330](../../src/autisti/SetupMezzo.tsx#L323-L330)) andrebbe confermata su un record reale in stato revocato.
4. **Origine dei campi `(VALLE)`.** I campi extra osservati (`adminEdit`, `chiusura*`, `linked*`, `evasa*`, `nascostoInArchivio`, `foto`, `timestamp` su segnalazioni) sono stati attribuiti alla valle per esclusione (non li scrive il driver). La conferma del writer esatto richiede analisi dei moduli Centro Controllo/admin (fuori perimetro di questo contratto).
5. **Race read-modify-write.** Tutti gli overwrite di array condivisi (sessioni, storico, tmp) sono soggetti a last-write-wins tra autisti/admin concorrenti: comportamento da osservare a runtime, non deducibile staticamente.

---

### Provenienza dati Firestore (campionamento read-only 2026-06-12)

8/8 collection accessibili. Conteggi reali al campionamento: `@segnalazioni_autisti_tmp` 44 · `@rifornimenti_autisti_tmp` 366 · `@rifornimenti` 368 (`items[]`) · `@richieste_attrezzature_autisti_tmp` 10 · `@cambi_gomme_autisti_tmp` 9 · `@controlli_mezzo_autisti` 425 · `@autisti_sessione_attive` 8 · `@storico_eventi_operativi` 447. Lettura via service account entro boundary, script temporaneo usa-e-getta in `C:\tmp` (eliminato), **nessuna scrittura** Firestore/Storage.
