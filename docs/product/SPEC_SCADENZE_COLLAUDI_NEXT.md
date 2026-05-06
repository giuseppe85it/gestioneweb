# SPEC SCADENZE COLLAUDI NEXT — 2026-04-30

## 0. DECISIONI UTENTE 2026-04-30

Tre decisioni vincolanti dichiarate dall'utente che definiscono il perimetro di questa spec:

- **D0.1 Modulo scrivente reale**. Il nuovo modulo persiste davvero su Firestore. Tutte le 4 azioni del modale attuale (Segna revisione fatta, Prenota / Modifica / Cancella prenotazione collaudo, Pre-collaudo Crea / Modifica) diventano scriventi 1:1 con la madre. Sparisce ogni feedback "Clone NEXT in sola lettura".
- **D0.2 Nome modulo**. Il modulo si chiama "Scadenze Collaudi". Si applica al titolo pagina, voce sidebar, route NEXT, costante in `nextStructuralPaths.ts`, eventuale prefisso CSS dedicato.
- **D0.3 Rimozione modale duplicato in Centro Controllo**. Il modale revisione inline che vive in `src/next/NextCentroControlloPage.tsx` (state `revisioneModalOpen`, render lines 2201-2298, handler `handleRevisioneSave` line 889) viene eliminato. I suoi trigger interni (alert click line 983, riga lista revisione line 1481) navigano alla nuova pagina.

## 1. STATO ATTUALE

### 1.1 Componente modale entry point (dalla home)

- File: `src/next/components/NextScadenzeModal.tsx`.
- Mount: `src/next/NextShell.tsx` lines 70-73 (useMemo `scadenzeMode` legge il query param) + lines 206-208 (render condizionale `<NextScadenzeModal mode={scadenzeMode} onClose={closeScadenzeModal} />`).
- Apertura: query param URL `?scadenze=tutte` o `?scadenze=urgenti`.
- Chiusura (`closeScadenzeModal` in NextShell): rimuove il param `scadenze` con `navigate({...}, { replace: true })`.

### 1.2 Props del modale

- `mode: "tutte" | "urgenti"`.
- `onClose: () => void`.

### 1.3 Stato interno del modale

- `snapshot: D10Snapshot | null` (caricato via `readNextCentroControlloSnapshot(Date.now())`).
- `loading: boolean`.
- `operation: NextScadenzeOperation | null` (operazione attiva: `prenotazione | pre-collaudo | revisione | cancella-prenotazione`).
- `feedback: { tone: "warning" | "danger"; text: string } | null`.
- Listener `keydown` su Escape per chiudere operazione o modale.

### 1.4 Sezioni e fields del modale

- Header: titolo "Scadenze revisioni", subtitle dipendente dal mode.
- Counters band: due stat `Scadute` e `In scadenza` (da `snapshot.counters.revisioniScadute` e `snapshot.counters.revisioniInScadenza`).
- Lista revisioni: array `snapshot.revisioni` filtrato (`isUrgentRevision` se `mode === "urgenti"`) e ordinato (`sortRevisionItems`).
- Per ogni riga (`D10RevisionItem`): targa, marca/modello, status pill, scadenza, delta giorni, summary prenotazione, summary pre-collaudo, bottoni azione condizionali.
- Pannello operazione (mostrato quando `operation !== null`).

### 1.5 Form per kind di operazione

- `prenotazione` (variant `create | edit`): fields `data`, `ora` opzionale, `luogo` opzionale, `note` opzionale.
- `pre-collaudo` (variant `create | edit`): fields `data`, `officina` (obbligatorio).
- `revisione`: fields `data`, `esito` (obbligatorio), `note` opzionale.
- `cancella-prenotazione`: solo conferma.

### 1.6 Validazioni

- Data: `parseNextCentroControlloDate(value)` deve restituire un Date valido.
- Ora prenotazione: `sanitizeBookingTime` accetta `HH:mm`, fail -> errore.
- Esito revisione: trim non vuoto.
- Officina pre-collaudo: trim non vuoto.

### 1.7 Comportamento submit (oggi nel NEXT)

Tutte le funzioni (`handlePrenotazioneSubmit`, `handlePreCollaudoSubmit`, `handleRevisioneSubmit`, `handleDeletePrenotazioneSubmit`) eseguono validazione e poi chiamano `showReadOnlyBlocked(...)` con testi `Clone NEXT in sola lettura: ... non salvata su @mezzi_aziendali.`. Nessuna scrittura reale lato NEXT oggi.

### 1.8 Snapshot e domain

- Reader: `readNextCentroControlloSnapshot(now)` da `src/next/domain/nextCentroControlloDomain.ts`.
- Tipi: `D10Snapshot` (line 262), `D10RevisionItem` (line 154), `D10PrenotazioneCollaudo`, `D10PreCollaudo`.
- Counters: `snapshot.counters.revisioniScadute`, `snapshot.counters.revisioniInScadenza` (lines 269-270).
- Lista: `snapshot.revisioni` (line 281), `snapshot.revisioniUrgenti` (line 282).

### 1.9 Card in home (entry point del modale)

- File: `src/next/NextHomePage.tsx`.
- Posizione: prima card dentro `<section className="next-home__alerts-grid">` (lines 616-637).
- Markup: `<button className="next-home__alert-card next-home__alert-card--{tone} next-shell__scadenze-banner-trigger">`, aria-label "Apri scadenze revisioni urgenti".
- Click: `onClick={() => openScadenzeModal("urgenti")}` (line 623). `openScadenzeModal` (lines 350-357) imposta `?scadenze=urgenti`.
- Testo banner: `alertBanner.text` da `buildHomeAlertBanner(centroSnapshot)` (lines 113-145), aggrega fino a 2 segnali da counters (`revisioniScadute`, `revisioniInScadenza`, `conflittiSessione`, `segnalazioniNuove`, `controlliKo`).

### 1.10 Voce sidebar

- File: `src/next/nextData.ts`, sezione `flotta`, item `id: "scadenze"`, label "Scadenze", `queryParamKey: "scadenze"`, `queryParamValue: "tutte"`. Click -> `openShellQueryModal` in NextShell.

### 1.11 Modale legacy duplicato in Centro Controllo

In `src/next/NextCentroControlloPage.tsx`:

- State: `revisioneModalOpen`, `revisioneTargetTarga`, `revisioneForm` (lines 600-606).
- Open: `openRevisioneModal(targa, prenotazione)` line 801.
- Save: `handleRevisioneSave` line 889 (read-only, mostra `showReadOnlyActionBlocked`).
- Render: lines 2201-2298 (backdrop + dialog + form data/esito/note + bottoni Annulla/Salva).
- Trigger interni che lo aprono:
  - `openAlertItem` line 983 (alert click di tipo `revisione`).
  - Riga lista revisione line 1481 (bottone "SEGNA REVISIONE FATTA" dentro `prenotazione` ui).
- Stesso file ha anche `prenotazioneModalOpen` (line 586) e `preCollaudoModalOpen` (line 594) con propri render — anche questi sono read-only nella NEXT.

### 1.12 Come scrive la MADRE oggi

Tutte le scritture passano da `setItemSync(MEZZI_KEY, updated)` dove `MEZZI_KEY = "@mezzi_aziendali"`. `setItemSync` (`src/utils/storageSync.ts`) scrive su Firestore al `doc(db, "storage", "@mezzi_aziendali")` con `setDoc` (per principio progetto, gia' verificato negli audit precedenti). Tutti gli aggiornamenti sostituiscono un record dell'array `mezzi` per match `fmtTarga(m.targa)`.

#### 1.12.1 Prenota collaudo (create / edit)

- File: `src/pages/Home.tsx`.
- Funzione: `handlePrenotazioneSave` line 1182.
- Validazioni: `data` non vuota, `parseDateFlexible(data)` valido; `ora` opzionale ma se presente sanitizzata su `HH:mm` (replace ` `, `.` -> `:`, slice 5, padding `0` se single-digit hour), regex `^([01]\d|2[0-3]):[0-5]\d$`; `luogo` e `note` semplice trim.
- Shape persistita (object `PrenotazioneCollaudo`):
  ```
  {
    data: <stringa raw input>,
    ora: <stringa sanitizzata o "">,
    ...(luogo ? { luogo } : {}),
    ...(note ? { note } : {}),
  }
  ```
- Side effect: aggiornamento campo `prenotazioneCollaudo` del mezzo target via `persistPrenotazioneCollaudo` (line 1165). Niente altre modifiche al record.
- Error handling: `window.alert` con messaggio specifico ("Inserisci la data della prenotazione collaudo.", "Data non valida...", "Ora non valida..."). In caso di mezzo non trovato: `window.alert("Mezzo non trovato.")` dentro `persistPrenotazioneCollaudo` line 1173.

#### 1.12.2 Cancella prenotazione collaudo

- File: `src/pages/Home.tsx`.
- Funzione: `handlePrenotazioneDelete` line 1378.
- Validazioni: `window.confirm("Cancellare la prenotazione collaudo per questo mezzo?")`.
- Shape persistita: `prenotazioneCollaudo: null` sul mezzo target.
- Side effect: `persistPrenotazioneCollaudo(targa, null)`.
- Error handling: idem mezzo non trovato.

#### 1.12.3 Pre-collaudo (create / edit)

- File: `src/pages/Home.tsx`.
- Funzione: `handlePreCollaudoSave` line 1219.
- Validazioni: `data` non vuota, `parseDateFlexible(data)` valido; `officina` trim non vuoto.
- Shape persistita (object `PreCollaudo`):
  ```
  preCollaudo: { data, officina }
  ```
- Side effect: `setMezzi(updated)` + `setItemSync(MEZZI_KEY, updated)` con il mezzo target sostituito.
- Error handling: `window.alert` per data mancante / data invalida / officina mancante / mezzo non trovato.

#### 1.12.4 Segna revisione fatta

- File: `src/pages/Home.tsx`.
- Funzione: `handleRevisioneSave` line 1256.
- Validazioni: `data` non vuota, `parseDateFlexible(data)` valido; `esito` trim non vuoto; `note` opzionale.
- Calcoli derivati:
  - `revisioneDateValue = formatDateForInput(parsedDate)` (formato `yyyy-mm-dd`).
  - `revisioneDateLabel = formatDateForDisplay(parsedDate)`.
  - `scadenzaValue = formatDateForInput(parsedDate + 1 anno con `setHours(12,0,0,0)` per evitare DST drift).
- Shape persistita (campi del record `Mezzo`):
  - `dataUltimoCollaudo: revisioneDateValue`
  - `dataScadenzaRevisione: scadenzaValue`
  - `prenotazioneCollaudo: { ...prenotazioneBase, completata: true, completataIl: revisioneDateValue, esito, ...(noteEsito ? { noteEsito } : {}) }`
  - `note`: se `noteEsito`, append una linea `"REVISIONE {revisioneDateLabel}: {esito} - {noteEsito}"` (separata da `\n` se esisteva gia' qualcosa); se `noteEsito` vuoto, `note` non viene riscritta.
- Side effect: `setMezzi(updated)` + `setItemSync(MEZZI_KEY, updated)` + `closeRevisioneModal()`.
- Error handling: `window.alert` per data mancante / data invalida / esito mancante / mezzo non trovato.

## 2. STATO TARGET

### 2.1 Route NEXT proposta

- Path: `/next/scadenze-collaudi`.
- Pattern coerente con `/next/manutenzioni`, `/next/anagrafiche`, `/next/cisterna`, `/next/lavori-da-eseguire`.
- Costante da aggiungere in fase implementativa in `src/next/nextStructuralPaths.ts`: `NEXT_SCADENZE_COLLAUDI_PATH = "/next/scadenze-collaudi"` (citazione, non modifica in questa spec).
- Optional query param `?mode=urgenti` per default-filtro all'apertura.

### 2.2 Layout di pagina

- Header pagina: titolo "Scadenze Collaudi", subtitle dinamico (`Solo revisioni urgenti non completate` se mode=urgenti, `Vista completa ordinata per scadenza` altrimenti). Niente breadcrumb obbligatorio.
- Counters band: `Scadute` e `In scadenza` da `snapshot.counters.revisioniScadute` e `snapshot.counters.revisioniInScadenza`.
- Filtro mode: segmented control `Tutte | Urgenti` riflesso nel query param `?mode=`. Default `tutte` se param assente, `urgenti` se param `urgenti`.
- Area lista: cards revisione una sotto l'altra, scroll naturale di pagina.
- Pannello operazione: appare inline come sezione vicino alla card selezionata (form di prenotazione / pre-collaudo / revisione / conferma cancella).
- Footer: nessun footer di pagina dedicato.

### 2.3 Componenti

- Pagina: nuovo file `src/next/NextScadenzeCollaudiPage.tsx`.
- Writer: nuovo file `src/next/nextScadenzeCollaudiWriter.ts` (vedi cap. 3).
- Riuso dei container CSS esistenti `next-shell__scadenze-*` o nuovo prefisso `nsc-`: decisione di dettaglio in fase implementativa.
- Tipi UI riusati (zero nuovi tipi): `D10RevisionItem`, `D10PrenotazioneCollaudo`, `D10PreCollaudo`, `D10Snapshot` da `src/next/domain/nextCentroControlloDomain.ts`.

### 2.4 Mappatura 1:1 modale -> pagina

| Modale (oggi) | Pagina (dopo) | Status |
|---|---|---|
| Backdrop full-screen + dialog centrato | Layout main NEXT con header sticky | spostato |
| Header `next-shell__modal-head` + bottone Chiudi | Header pagina con titolo "Scadenze Collaudi" | spostato |
| Subtitle dipendente da `mode` prop | Subtitle dipendente da `?mode=` query | spostato |
| Counters Scadute / In scadenza | Counters band sotto header | invariato |
| Lista `next-shell__scadenze-list` con scroll interno | Lista in flusso pagina | spostato |
| Card riga `next-shell__scadenze-row` | Card riga (stesso markup logico) | invariato |
| Bottoni azione condizionali | Stessi bottoni, stessa logica condizionale | invariato |
| Pannello operazione dentro modal body | Pannello operazione inline in pagina | spostato |
| Form prenotazione (data, ora, luogo, note) | Stessi field, stesse validazioni client + scrittura reale | invariato fields, **scrivente** |
| Form pre-collaudo (data, officina) | Stessi field, stesse validazioni client + scrittura reale | invariato fields, **scrivente** |
| Form revisione (data, esito, note) | Stessi field, stesse validazioni client + scrittura reale | invariato fields, **scrivente** |
| Conferma cancella prenotazione | Stessa conferma + scrittura reale | invariato testo, **scrivente** |
| Submit handlers `Clone NEXT in sola lettura` | Submit handlers che chiamano writer NEXT | **rimpiazzato** |
| Listener Escape per chiudere | Su Escape solo chiusura `operation` se attiva | spostato |
| Reader `readNextCentroControlloSnapshot(Date.now())` | Stesso reader, stessa chiamata in useEffect; refresh dopo scrittura | invariato lettura |

### 2.5 Trigger di apertura modale -> navigazione

| Trigger oggi | Comportamento oggi | Comportamento dopo |
|---|---|---|
| Card home `next-shell__scadenze-banner-trigger` (NextHomePage line 623) | `openScadenzeModal("urgenti")` -> `?scadenze=urgenti` | `navigate("/next/scadenze-collaudi?mode=urgenti")` |
| Voce sidebar "Scadenze" (nextData.ts sezione `flotta`) | `queryParamKey: "scadenze"`, value `tutte` -> `?scadenze=tutte` | item con `path: "/next/scadenze-collaudi"`, label "Scadenze Collaudi" (rimuovere `queryParamKey`/`queryParamValue`) |
| Mount in NextShell `<NextScadenzeModal />` | Render condizionale su `scadenzeMode` | Rimosso |
| Alert click revisione in NextCentroControlloPage line 983 | `openRevisioneModal(targa, prenotazione)` | `navigate("/next/scadenze-collaudi?mode=urgenti")` (eventuale param `targa` opzionale, vedi cap. 6) |
| Riga lista revisione bottone "SEGNA REVISIONE FATTA" line 1481 | `openRevisioneModal(targa, prenotazione)` | `navigate("/next/scadenze-collaudi")` |

## 3. MODALITÀ SCRIVENTE (writer NEXT)

Pattern obbligatorio: `runWithCloneWriteScopedAllowance` + `setItemSync` come `src/next/nextMezziWriter.ts` lines 119-123. Niente accesso diretto a `firebase/firestore` o `firebase/storage`. Tutte le scritture avvengono sull'unico documento `storage/@mezzi_aziendali` aggiornando il record del mezzo target.

### 3.1 File writer

- Path: `src/next/nextScadenzeCollaudiWriter.ts`.
- Costanti:
  - `MEZZI_KEY = "@mezzi_aziendali"` (allineata a `nextMezziWriter.ts` line 4).
  - Scope di allowance: vedi cap. 4 (potrebbe riusare `INTERNAL_AI_MAGAZZINO_INLINE_SCOPE` come gia' fa `nextMezziWriter.ts` line 5, oppure introdurre nuovo scope dedicato `scadenze_collaudi_write_scope` se l'utente preferisce isolamento esplicito; decisione di dettaglio in fase implementativa).

### 3.2 Helpers privati riusati o equivalenti

- `unwrapMezziArray(raw)` come `nextMezziWriter.ts` line 84.
- `readMezziRecords()` come line 91.
- `findMezzoIndexByTarga(records, targa)`: variante che cerca per targa normalizzata invece di `id`. Logica equivalente a `mezzi.findIndex((m) => fmtTarga(m.targa) === key)` di Home.tsx line 1283.
- `writeMezziRecords(records)` come line 119.

### 3.3 Funzioni esposte (signature proposte)

```ts
export type PrenotazioneCollaudoPayload = {
  data: string;
  ora: string;
  luogo?: string;
  note?: string;
};

export type PreCollaudoPayload = {
  data: string;
  officina: string;
};

export type RevisioneCompletataPayload = {
  data: string;
  esito: string;
  note?: string;
};

export async function setPrenotazioneCollaudo(
  targa: string,
  payload: PrenotazioneCollaudoPayload | null,
): Promise<void>;

export async function setPreCollaudo(
  targa: string,
  payload: PreCollaudoPayload,
): Promise<void>;

export async function markRevisioneCompletata(
  targa: string,
  payload: RevisioneCompletataPayload,
): Promise<void>;
```

### 3.4 Cosa scrive ciascuna funzione

#### 3.4.1 `setPrenotazioneCollaudo(targa, payload)`

- Trova il record mezzo per targa normalizzata. Se assente: throw `Error("Mezzo non trovato.")`.
- Se `payload === null`: setta `record.prenotazioneCollaudo = null` (caso CANCELLA).
- Se `payload` valorizzato: setta
  ```
  record.prenotazioneCollaudo = {
    data: payload.data,
    ora: payload.ora,
    ...(payload.luogo ? { luogo: payload.luogo } : {}),
    ...(payload.note ? { note: payload.note } : {}),
  }
  ```
  Esattamente come `handlePrenotazioneSave` di Home.tsx line 1208-1213.
- Persiste l'intero array via `writeMezziRecords` -> `runWithCloneWriteScopedAllowance(scope, () => setItemSync("@mezzi_aziendali", nextRecords))`.
- Nessun altro campo del record viene toccato.

#### 3.4.2 `setPreCollaudo(targa, payload)`

- Trova il record. Se assente: throw `Error("Mezzo non trovato.")`.
- Setta `record.preCollaudo = { data: payload.data, officina: payload.officina }`. Stessa shape di Home.tsx line 1248.
- Persiste via `writeMezziRecords`.

#### 3.4.3 `markRevisioneCompletata(targa, payload)`

- Trova il record. Se assente: throw `Error("Mezzo non trovato.")`.
- Calcola:
  - `parsedDate = parseDateFlexible(payload.data)` (riusa parser progetto).
  - `revisioneDateValue = formatDateForInput(parsedDate)` (yyyy-mm-dd).
  - `revisioneDateLabel = formatDateForDisplay(parsedDate)`.
  - `scadenzaDate = new Date(parsedDate); scadenzaDate.setHours(12,0,0,0); scadenzaDate.setFullYear(scadenzaDate.getFullYear() + 1); scadenzaValue = formatDateForInput(scadenzaDate)`.
- Costruisce:
  ```
  prenotazioneBase = (record.prenotazioneCollaudo as PrenotazioneCollaudo | null) ?? { data: "" }
  nextPrenotazione = {
    ...prenotazioneBase,
    completata: true,
    completataIl: revisioneDateValue,
    esito: payload.esito,
    ...(payload.note ? { noteEsito: payload.note } : {}),
  }
  ```
- Aggiorna campi del record:
  - `dataUltimoCollaudo = revisioneDateValue`
  - `dataScadenzaRevisione = scadenzaValue`
  - `prenotazioneCollaudo = nextPrenotazione`
  - `note`: se `payload.note`, prepend `"REVISIONE {revisioneDateLabel}: {esito} - {note}"` come riga, separata da `\n` se esisteva gia' contenuto. Se `payload.note` assente, `note` non cambia. (Identico a Home.tsx lines 1301-1306.)
- Persiste via `writeMezziRecords`. Nessun altro campo del record viene toccato.

### 3.5 Validazioni in scrittura

- Le validazioni di forma (`data`, `ora`, `esito`, `officina` obbligatori) avvengono lato chiamante (la pagina), come gia' fa il modale oggi (`NextScadenzeModal` lines 287-353). Il writer riceve payload gia' sanitizzato.
- Il writer aggiunge solo le seguenti validazioni di integrita':
  - `targa` non vuota -> altrimenti throw `Error("Targa mancante.")`.
  - record con quella targa esiste -> altrimenti throw `Error("Mezzo non trovato.")`.
- Niente parsing date dentro al writer per `setPrenotazioneCollaudo` e `setPreCollaudo` (la madre persiste la stringa raw input come fa oggi).

### 3.6 Comportamento errori in UI

- Errore di validazione client: feedback inline nel pannello operazione, tone `danger`, testo specifico identico a oggi (`Inserisci la data...`, `Data non valida...`, `Ora non valida...`, `Inserisci l'esito...`, `Inserisci l'officina...`). Logica gia' presente in NextScadenzeModal.
- Errore writer (es. mezzo non trovato, errore Firestore): feedback inline tone `danger` con `error.message`. Niente `window.alert`.

### 3.7 Feedback di successo

- Su submit OK: chiusura del pannello operazione (`setOperation(null)`), reload snapshot via `readNextCentroControlloSnapshot(Date.now())` per riflettere il dato persistito, banner di feedback positivo opzionale (es. "Revisione registrata").
- Optimistic update non richiesto (snapshot reload e' sufficiente; identico al pattern di Home che fa `setMezzi(updated)` prima del side effect).

## 4. DEROGA IN `cloneWriteBarrier.ts`

### 4.1 Cosa va aperto

Per consentire le scritture su `storage/@mezzi_aziendali` quando la route corrente e' `/next/scadenze-collaudi`, va aggiunta una deroga simmetrica a quella gia' presente per Dossier Mezzo Edit (lines 89-99 di `src/utils/cloneWriteBarrier.ts`):

- Nuova costante `SCADENZE_COLLAUDI_ALLOWED_WRITE_PATHS = ["/next/scadenze-collaudi"] as const` (o estensione di `DOSSIER_MEZZO_EDIT_ALLOWED_WRITE_PATH_PREFIXES` aggiungendo il path; decisione di stile in fase implementativa).
- Nuova costante `SCADENZE_COLLAUDI_ALLOWED_STORAGE_KEYS = new Set(["@mezzi_aziendali"])`.
- Nuovo predicate `isAllowedScadenzeCollaudiCloneWritePath(pathname)` analogo a `isAllowedDossierMezzoEditCloneWritePath` line 354.
- Wiring del predicate dentro la funzione che decide se una `setItemSync` su `@mezzi_aziendali` e' lecita (oggi gestita per dossier line 538).

### 4.2 Cosa NON viene aperto

- Nessuna scrittura su altre storage keys (`@manutenzioni`, `@inventario`, `@costiMezzo`, ecc.).
- Nessun upload Storage `mezzi_aziendali/` da questa pagina (la pagina non gestisce foto).
- Nessuna scrittura Firestore diretta `firebase/firestore` (solo via `setItemSync`).
- Nessun fetch verso endpoint esterni (`cloudfunctions.net`, `internal-ai-backend`).
- Nessuna delete Storage. Nessun `removedIds` / `allowRemovals` (la pagina non cancella mezzi, solo aggiorna campi su record esistente).

### 4.3 Riferimenti di pattern coerenti gia' presenti

- `DOSSIER_MEZZO_EDIT_ALLOWED_WRITE_PATH_PREFIXES` lines 89-92 + `DOSSIER_MEZZO_EDIT_ALLOWED_STORAGE_KEYS` line 99 + `isAllowedDossierMezzoEditCloneWritePath` line 354. Pattern: route prefix + storage key set + predicate.
- `IA_LIBRETTO_ALLOWED_WRITE_PATH` line 114 + `IA_LIBRETTO_ALLOWED_STORAGE_KEYS` line 118. Pattern equivalente per route singola.

La deroga di Scadenze Collaudi segue il pattern Dossier Mezzo Edit (path prefix per path esatto + storage key) ma e' **piu' minima**: una sola route, una sola storage key, nessun storage path prefix, nessun fetch endpoint, nessun delete prefix.

## 5. INTEGRAZIONE CARD HOME

- La card resta dov'e' (`NextHomePage.tsx` lines 616-637), stesso markup, stesso aria-label, stesso layout, stesso tone.
- L'alert resta calcolato come oggi: stessa funzione `buildHomeAlertBanner` (lines 113-145), stessa fonte dati `centroSnapshot.counters`. Nessun cambio di soglie, segnali, tone.
- Cambia solo l'`onClick` del bottone card: da `openScadenzeModal("urgenti")` a `navigate("/next/scadenze-collaudi?mode=urgenti")`.
- La funzione locale `openScadenzeModal` di `NextHomePage.tsx` (lines 350-357) puo' essere rimossa (era usata solo da quella card).

## 6. RIMOZIONE MODALE LEGACY IN `NextCentroControlloPage.tsx`

Decisione utente D0.3: il modale revisione inline duplicato viene rimosso.

### 6.1 Codice da rimuovere

- State: `revisioneModalOpen`, `revisioneTargetTarga`, `revisioneForm` (lines 600-606).
- Setters / open / close: `openRevisioneModal` line 801, `closeRevisioneModal` line 796.
- Save handler: `handleRevisioneSave` line 889 (oggi read-only).
- Date picker helpers correlati: `revisioneDatePickerRef`, `openRevisioneDatePicker` line 935, `handleRevisioneDatePickerChange` line 962, `revisioneDateValue` (controllo `useMemo` correlato se presente).
- Render del modale: lines 2201-2298 (backdrop + dialog + body + actions).

NOTA: gli analoghi `prenotazioneModalOpen` / `preCollaudoModalOpen` con render ai dintorni (state lines 586-599, render fino a 2199) seguono lo stesso destino se i loro trigger interni sono raggiungibili solo da Centro Controllo (vedi domanda aperta in cap. 9 — non rientra nel D0.3 stretto, ma l'utente ha implicitamente parlato del "modale duplicato" al singolare riferendosi alla revisione).

### 6.2 Trigger interni da rimpiazzare con navigate

| Trigger | Riga | Sostituire con |
|---|---|---|
| `openAlertItem` -> alert.kind === "revisione" -> `openRevisioneModal(...)` | line 983 | `navigate("/next/scadenze-collaudi?mode=urgenti")` |
| Bottone "SEGNA REVISIONE FATTA" nella riga lista revisione | line 1481 | `navigate("/next/scadenze-collaudi")` |

Eventuale param utile: `?targa={targa}` per preselezione visiva della riga. **Non vincolante**: se la pagina non implementa preselezione targa al primo round, navigate plain `/next/scadenze-collaudi` e' accettabile. Questa decisione di dettaglio resta a fase implementativa.

### 6.3 Cosa resta in Centro Controllo

- La sezione lista revisioni dentro Centro Controllo puo' continuare a esistere come read-only (solo elenco con status pill), oppure puo' linkare alla pagina nuova per ogni riga. Decisione di dettaglio: vedi cap. 9.
- Tutti gli altri componenti di Centro Controllo (alert filters, missing modal, segnalazioni, ecc.) restano identici.

## 7. COSA NON CAMBIA

- **Logica alert home**: `buildHomeAlertBanner` invariata. Counters invariati. Soglie invariate. Tone invariato.
- **Tipi domain**: `D10RevisionItem`, `D10PrenotazioneCollaudo`, `D10PreCollaudo`, `D10Snapshot` invariati. Nessun campo nuovo viene aggiunto.
- **Shape Firestore base `@mezzi_aziendali`**: nessun campo nuovo. Si scrivono solo i campi che la madre gia' scrive: `prenotazioneCollaudo`, `preCollaudo`, `dataUltimoCollaudo`, `dataScadenzaRevisione`, `note`.
- **Reader**: `readNextCentroControlloSnapshot` invariato. Continua a leggere `@mezzi_aziendali` e a costruire `revisioni` / `revisioniUrgenti` / counters.
- **Card home**: posizione, layout, aria-label, tone, testo invariati. Cambia solo target click.
- **Pattern writer**: identico a `nextMezziWriter.ts`, niente nuovi pattern di accesso a Firestore o Storage.

## 8. CHECKLIST CHIUSURA MODULO (10 PUNTI)

Standard "CHIUSO AL 100%" applicato al perimetro SCRIVENTE.

- [ ] 1. Pagina `/next/scadenze-collaudi` raggiungibile da card home, voce sidebar e digitazione URL. Subtitle e filtro reagiscono al query param `?mode=`.
- [ ] 2. Tutte e 4 le azioni del modale persistono davvero su `storage/@mezzi_aziendali`: Prenota collaudo (create/edit), Cancella prenotazione, Pre-collaudo (create/edit), Segna revisione fatta. Refresh -> dato presente.
- [ ] 3. Shape persistita identica alla madre per ogni azione (vedi cap. 1.12 e 3.4). Cross-check sui campi `prenotazioneCollaudo`, `preCollaudo`, `dataUltimoCollaudo`, `dataScadenzaRevisione`, `note` su un mezzo di test.
- [ ] 4. Writer `nextScadenzeCollaudiWriter.ts` passa esclusivamente da `runWithCloneWriteScopedAllowance` + `setItemSync("@mezzi_aziendali", ...)`. Nessun import da `firebase/firestore` o `firebase/storage` nel writer.
- [ ] 5. Deroga in `cloneWriteBarrier.ts` aggiunta e minima: solo route `/next/scadenze-collaudi` + storage key `@mezzi_aziendali`. Nessuna apertura collaterale.
- [ ] 6. `NextScadenzeModal.tsx` eliminato. Mount in `NextShell.tsx` rimossa (`scadenzeMode`, `closeScadenzeModal`, `openShellQueryModal` se non piu' usato altrove, render JSX). Voce sidebar in `nextData.ts` aggiornata: label "Scadenze Collaudi", `path: "/next/scadenze-collaudi"`, `queryParamKey`/`queryParamValue` rimossi.
- [ ] 7. Modale legacy revisione in `NextCentroControlloPage.tsx` eliminato (cap. 6.1) e trigger interni reindirizzati con `navigate` (cap. 6.2).
- [ ] 8. Card home `NextHomePage.tsx` aggiornata: `onClick` -> `navigate("/next/scadenze-collaudi?mode=urgenti")`. Funzione locale `openScadenzeModal` rimossa se non piu' usata.
- [ ] 9. ESLint e build verdi. Nessun warning nuovo. Nessuna chiamata `window.alert` nel writer (gli errori vengono mostrati come feedback inline nella pagina).
- [ ] 10. Cross-audit Codex / Claude Code (parita' 1:1 con la madre verificata) + test browser end-to-end su un mezzo reale per ciascuna delle 4 azioni: persistenza dopo refresh, dato presente in `@mezzi_aziendali`, alert home aggiornato dopo scrittura.

## 9. POSSIBILI MIGLIORIE NON IMPLEMENTATE — DA APPROVARE

- **DA APPROVARE — segmented control filtro `Tutte | Urgenti` con persistenza preferenza in `localStorage`**. Motivazione: oggi il modale non aveva spazio per un filtro UI esplicito persistente; in pagina lo spazio c'e' e l'utente potrebbe voler ricordare la sua scelta. Cambia comportamento UX.
- **DA APPROVARE — link diretto da riga revisione al dossier mezzo (`/next/dossier/{targa}`)**. Motivazione: `D10RevisionItem.targetRoute` esiste gia' ma non e' navigato. Cambia comportamento UX.
- **DA APPROVARE — preselezione targa al `navigate` dai trigger interni di Centro Controllo via query param `?targa=`**. Motivazione: scroll automatico e pannello operazione gia' aperto. Richiede gestione param dedicato in pagina.
- **DA APPROVARE — rimozione anche dei modali `prenotazioneModalOpen` e `preCollaudoModalOpen` inline in `NextCentroControlloPage.tsx`** (oltre al `revisioneModalOpen` esplicitamente coperto da D0.3). Motivazione: stesso ragionamento di D0.3 per coerenza, ma non e' decisione utente esplicita.
