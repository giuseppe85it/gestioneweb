# SPEC_ORARI_NOTE_NEXT

Versione: 0.7 (2026-06-14; monte ore mensile separato in due totali +/− NON compensati, verde/rosso col segno; chiarito §1)
Data: 2026-06-14
Modulo: Registratore Orari e Note (cartellino mensile autista)
Stato permessi: NASCE DISATTIVATO per tutti (regola DIARIO 2026-06-14). `defaultOn: false`.

---

## 1. SCOPO DEL MODULO

Cartellino orari mensile per autista. L'autista registra ogni giorno orari grezzi + nota
libera + flag. A fine mese l'amministrazione legge un cartellino professionale (in app e in
PDF) per segnare monte ore, straordinari, notti, assenze.

Il modulo registra il dato grezzo e calcola alcuni derivati, incluso il MONTE ORE giornaliero e i due totali mensili separati (+ e −) rispetto alla base contrattuale di 9h (vedi §4bis). NON applica compensazioni o interpretazioni contrattuali finali: mostra + e − distinti e lascia la decisione conclusiva all'amministrazione.

Riferimento visivo: screenshot app attuale (vista mese + footer Totale/Giorni/Media).

---

## 2. DUE VISTE

### 2.1 LATO AUTISTA (app autista, `src/autisti/`)

Il modulo nasce nell'app autista. Aggancio: ROUTE (pattern `Rifornimento.tsx`, non modale).

Aggancio: ROUTE (pattern `Rifornimento.tsx`, non modale). Etichetta bottone nell'app autista: **"Registro orari"**.

**Vista GIORNO (home del modulo — si apre QUI all'ingresso)**
- All'apertura del modulo si entra DIRETTAMENTE sul giorno di OGGI (data corrente del telefono).
- Header di navigazione: `‹  GIORNO_SETTIMANA GG/MM/AAAA  ›` — la data con il giorno della settimana esteso (es. "GIOVEDÌ 14/06/2026") scritta IN MEZZO a due frecce. Freccia sinistra ‹ = giorno precedente; freccia destra › = giorno successivo. Spostandosi si può visualizzare e modificare qualunque altro giorno.
- **Click sulla data centrale** → apre la Vista RIEPILOGO (calendario). NON esiste un tasto "Riepilogo" separato: la data È il varco.
- Selettore tipo giornata: **Lavoro / Ferie / Malattia / Infortunio / Festività**.
  - Se "Lavoro": mostra campi orari + flag + note.
  - Se assenza: nasconde orari/flag; il giorno conta nella voce di assenza del footer. Le note restano disponibili.
- Campi (solo per "Lavoro"):
  - **Inizio**: time-picker. Default = ora corrente del telefono, modificabile.
  - **Fine**: time-picker. Default = ora corrente del telefono, modificabile.
  - **Note**: apre un piccolo modale di testo libero, salva, resta segnato per il giorno.
  - **Flag NOTTE** e **Flag NO PAUSA** (opzionali, solo tipo "Lavoro"): resi come due controlli GRANDI e ben visibili (coerenti con lo stile dei bottoni tipo-giornata), disposti ai LATI del Totale — uno a SINISTRA, uno a DESTRA, con il Totale al centro. Vedi §4.
- Salva → il record del giorno è persistito; si resta sulla vista giorno (navigabile con le frecce).
  - **Nota visibile**: dopo il salvataggio, la nota del giorno è MOSTRATA nella vista giorno (non resta nascosta nel modale). L'autista la rilegge e ci clicca sopra per riaprirla/modificarla.

**Vista RIEPILOGO (raggiunta dal click sulla data) — TABELLA COMPATTA**
- Mese e anno in alto, con navigazione mese precedente/successivo.
- **Riga STATO MESE** (sotto il mese): "Compilati: X · Mancanti (feriali): Y". X = giorni con record; Y = feriali (lun–ven) senza record; se Y=0 "Mancanti" non si mostra; sabato/domenica MAI tra i mancanti (compaiono solo se compilati).
- **TABELLA COMPATTA tipo Excel — solo i giorni effettivamente SEGNATI** (no righe vuote). Intestazione di colonna in alto, una riga per giorno, righe BASSE (no card).
- Colonne, in quest'ordine: **Data | Giorno | Inizio | Fine | Totale | Monte ore | Notte | Pausa | Note**.
  - **Data**: giorno/mese senza anno (es. "01/06").
  - **Giorno**: abbreviazione 3 lettere uniformi: LUN MAR MER GIO VEN SAB DOM.
  - **Inizio / Fine**: "HH:MM" (vuoti per le assenze).
  - **Totale**: netto (HH:MM). Per le assenze: il tipo assenza al posto del totale.
  - **Monte ore**: scarto sul contratto, formato "+H:MM" / "−H:MM" / "0:00" (vedi §4bis). Codice colore: + verde, − rosso, 0 neutro.
  - **Notte**: una "X" se flag notte attivo, altrimenti vuoto. Colonna stretta.
  - **Pausa**: una "X" se la pausa è stata fatta (NO PAUSA spento), altrimenti vuoto. Colonna stretta. [NB: la "X" indica pausa FATTA; coerente con la colonna gestionale, dove "Pausa Sì" = pausa fatta.]
  - **Note**: anteprima breve (1–3 parole), troncata, SENZA andare a capo.
- **Scroll laterale (mobile)**: le colonne **Data e Giorno restano BLOCCATE a sinistra** (sempre visibili); le restanti (Inizio→Note) scorrono ORIZZONTALMENTE col trascinamento del dito. Tutto resta incolonnato e ordinato; ciò che non entra nello schermo si raggiunge scrollando lateralmente.
- **Click sulla RIGA di un giorno** → apre la Vista GIORNO su quel giorno (con tutti i dati e possibilità di modifica). La nota intera si legge aprendo il giorno (non serve espansione in riga).
- In fondo: **RIEPILOGO MESE (footer conteggi)**, vedi §5 (voci dinamiche, invariato) + riga **Monte ore mese** (vedi §4bis).
- Tasto CHIUDI: visibile SOLO dal 1° del mese successivo (vedi §6); alla chiusura alert coi feriali mancanti, non bloccante.
- I giorni vuoti (non in tabella) si compilano dalla Vista GIORNO con le frecce ‹ ›.

L'autista può modificare qualunque giorno finché il cartellino del mese è APERTO (vedi §6).

### 2.2 LATO GESTIONALE (NEXT, `src/next/`)

Path: la pagina gestionale vive sotto `/next/autisti-admin` (così la deroga barriera path-only esistente copre l'azione admin di riapertura).

Pagina NEXT che mostra il cartellino mensile per autista selezionato, layout professionale,
stile vista lista (riferimento layout: `NextMaterialiConsegnatiPage.tsx`; reader pattern
`read*Snapshot` da `src/next/domain/`).

- Selezione: autista (badge) + mese/anno.
- Tabella cartellino con colonne: Data | Giorno | Inizio | Fine | Totale | **Monte ore** | **Pausa (Sì/No)** | **Notte (Sì/—)** | Note del giorno. ("Monte ore" = scarto su 9h, +/−/0 con colore; vedi §4bis.)
- Footer conteggi (§5).
- Indicazione stato cartellino: APERTO / CHIUSO.
- Azione admin RIAPRI: rimette APERTO un mese chiuso (sblocca l'autista). Vedi §6.
- Azione admin MODIFICA (read-write pieno): l'admin può modificare QUALUNQUE giorno del cartellino di un autista — orari, flag NOTTE, flag NO PAUSA, tipo giornata/assenza, note — esattamente come può fare l'autista nell'app. Le modifiche sono UPDATE-IN-PLACE sul record esistente (chiave badge+data), NON creano record nuovi. L'admin può modificare ANCHE a mese CHIUSO senza riaprirlo: la chiusura blocca solo l'autista, MAI l'admin.
- Export PDF singolo: anteprima + condivisione di un cartellino (vedi §7).
- Export PDF massivo: un solo tasto genera UN PDF unico con UNA PAGINA per ciascun autista che ha REGISTRATO orari nel mese selezionato (non solo chi ha chiuso). Accanto al nome di ogni autista, nella sua pagina, compare lo STATO del mese (Chiuso / Aperto) così si vede a colpo d'occhio chi non ha finalizzato. Vedi §7.

---

## 3. FORMA DATO

Collection NUOVA: `storage/@orari_autisti`.
Collection NUOVA (stato chiusura): `storage/@orari_autisti_chiusure` (vedi sotto).
Pattern: lista di record (come `@rifornimenti_autisti_tmp`), NON mappa singola.
Scrittura via `setItemSync` / `getItemSync` (read-modify-write su array), pattern documentale.

NB nome collection SENZA suffisso `_tmp`: è un registro di verità, non dato pendente.

Record giorno (campi salvati — il Totale NON si salva, si calcola in lettura):

```
{
  badge: string,            // chiave autista
  data: string,             // "YYYY-MM-DD"
  tipo: "lavoro" | "ferie" | "malattia" | "infortunio" | "festivita",
  inizio: string | null,    // "HH:MM" (null se assenza)
  fine: string | null,      // "HH:MM" (null se assenza)
  notte: boolean,           // flag, default false
  noPausa: boolean,         // flag, default false
  note: string,             // testo libero, "" se vuoto
  createdAt: number,        // epoch ms, creazione record
  updatedAt: number         // epoch ms, ultima modifica
}
```

Stato cartellino mensile: documento SEPARATO, collection nuova `storage/@orari_autisti_chiusure`.
Forma:
`{ [badge]: { [meseAnno]: { chiuso: boolean, chiusoAt: number, riapertoAt: number | null } } }`
dove `meseAnno` è "YYYY-MM". Voce assente → mese APERTO. Questo documento NON tocca i record giorno di `@orari_autisti`.

REGOLA TIMESTAMP (AGENTS.md `TIMESTAMP-MAI-DA-CLICK`): `createdAt`/`updatedAt` sono temporali
legittimi (creazione/modifica record), NON scritti come side-effect di operazioni non temporali.

---

## 4. CALCOLO TOTALE E FLAG

**Totale giorno (solo tipo "lavoro"):**
- Base = Fine − Inizio.
- Se Fine < Inizio → turno che attraversa la mezzanotte → +24h alla fine (es. 22:00→06:00 = 8:00).
- **Pausa**: default (NO PAUSA spento) → si scala **1h fissa** dal totale.
  Es. 06:01→16:30 = 10:29 lordo → **9:29 netto**.
- **NO PAUSA acceso** → totale LORDO, nessuno scalo. Es. resta 10:29.
- Il totale mostrato (app, footer, PDF, gestionale) è sempre il NETTO così calcolato.

**Flag NOTTE:**
- Non modifica le ore del giorno.
- Aggiunge **+1 al contatore "Notti" (notti fuori / pernottamenti)** del mese.
Resa UI: NOTTE e NO PAUSA sono due controlli grandi ai lati del Totale nella vista giorno (vedi §2.1), visibili solo per tipo "Lavoro".
Visibilità per giorno (oltre al contatore footer): la notte è mostrata sul singolo giorno in tutte le viste — etichetta "Notte" sulla card del riepilogo autista (§2.1), colonna "Notte" Sì/— nella tabella gestionale (§2.2), e indicazione nella riga del PDF (§7). Serve a sapere QUALI giorni hanno la notte, non solo quanti.

**Visibilità pausa lato gestionale:**
- Colonna "Pausa" Sì/No nel cartellino gestionale e nel PDF.
- "No" quando NO PAUSA è acceso (totale lordo); "Sì" altrimenti (è stata scalata 1h).

---

## 4bis. MONTE ORE CONTRATTUALE

Base contrattuale: **9 ore lavorate al giorno** (+ 1 ora di pausa = giornata piena da 10).

**Monte ore giorno = Totale NETTO − 9:00**, dove il Totale netto è quello già calcolato in §4 (con pausa: −1h; con NO PAUSA: lordo).
- Risultato > 0 → straordinario (monte ore +). Es. netto 10:00 → **+1:00**.
- Risultato < 0 → debito ore (monte ore −). Es. netto 8:00 → **−1:00**.
- Risultato = 0 → giornata piena. Es. netto 9:00 → **0:00**.

Casi di verifica (devono tornare tutti):
- 06:00→16:00 con pausa → 10:00 lordo − 1h = 9:00 netto → **0:00**.
- 06:00→16:00 NO PAUSA → 10:00 netto → **+1:00**.
- 06:00→15:00 con pausa → 9:00 lordo − 1h = 8:00 netto → **−1:00**.
- 06:00→15:00 NO PAUSA → 9:00 netto → **0:00**.

**Assenze** (ferie/malattia/infortunio/festività): valgono una giornata piena (9h), monte ore **0:00** (neutro). NON spostano il saldo mensile. Non hanno orari né flag.

**Resa**:
- Per giorno: colonna "Monte ore" nella tabella riepilogo (§2.1), colonna anche nella tabella gestionale (§2.2) e nel PDF (§7). Colore: + verde, − rosso, 0 neutro.
- Per mese: DUE righe distinte nel footer Riepilogo mese (§5), entrambe SEMPRE visibili:
  - **Monte ore +**: somma dei SOLI scarti POSITIVI dei giorni lavorati. Mostrato col segno "+" e in VERDE (es. "+10:00").
  - **Monte ore −**: somma dei SOLI scarti NEGATIVI dei giorni lavorati. Mostrato col segno "−" davanti e in ROSSO (es. "−5:00").
  I due totali NON si compensano: il modulo mostra separatamente quanto + e quanto −; l'interpretazione finale resta all'amministrazione. Le assenze valgono 0 e non entrano in nessuno dei due. Un "lavoro" senza orari mostra "—" per giorno e non entra nei totali.
  La stessa resa (due righe, verde "+" / rosso "−") vale in TUTTE le viste del footer: app autista, tabella gestionale, PDF.

NOTA (§1): con il monte ore il modulo calcola un'interpretazione contrattuale (il +/−), non solo il dato grezzo. Scelta consapevole 2026-06-14, da annotare in DIARIO_DECISIONI.

---

## 5. FOOTER CONTEGGI (mese)

Righe del footer, sia in app (vista riepilogo) sia in PDF. **Visualizzazione dinamica**: Totale, Giorni lavorati e Media sono SEMPRE visibili (ossatura del cartellino); le altre voci (Notti, Ferie, Malattia, Infortunio, Festività) compaiono SOLO se il loro valore è > 0. Una voce a 0 NON viene mostrata.
- **Totale**: somma dei totali netti dei giorni "lavoro" (formato HH:MM, es. 140:13).
- **Giorni lavorati**: conteggio giorni "lavoro".
- **Media**: Totale / Giorni lavorati (HH:MM).
- **Monte ore +**: somma dei soli scarti positivi del mese (giorni lavorati). Segno "+", colore VERDE. SEMPRE visibile (anche +0:00).
- **Monte ore −**: somma dei soli scarti negativi del mese (giorni lavorati). Segno "−" davanti, colore ROSSO. SEMPRE visibile (anche −0:00 → mostrato "0:00").
I due totali sono distinti e NON compensati. Stessa resa in app autista, gestionale e PDF.
- **Notti**: conteggio giorni con flag NOTTE.
- **Ferie**: conteggio giorni tipo "ferie".
- **Malattia**: conteggio giorni tipo "malattia".
- **Infortunio**: conteggio giorni tipo "infortunio".
- **Festività**: conteggio giorni tipo "festivita".

---

## 6. CHIUSURA MENSILE

- Ogni giorno è editabile dall'autista finché il cartellino del mese è APERTO.
- Tasto **CHIUDI** (lato autista): visibile SOLO a partire dal 1° del mese successivo.
  (Es. il cartellino di maggio si può chiudere dal 1° giugno in poi.)
- Alla pressione di CHIUDI:
  - Se mancano giorni feriali non compilati → ALERT che li elenca. NON blocca: l'autista
    può chiudere comunque.
  - Cartellino passa a stato CHIUSO. Da quel momento l'autista NON può più editare quel mese.
Riapertura: SOLO admin, dal gestionale. Pattern di riferimento reale: la riapertura/sgancio con reset dei campi di chiusura in `src/next/writers/nextChiusuraEventoWriter.ts` (NON la "Riapri review" documentale di NextIADocumentiPage). Da adattare al dominio orari.

Tracciamento: alla chiusura si scrive `chiusoAt` (epoch ms); alla riapertura admin si scrive `riapertoAt` (epoch ms) sul documento `@orari_autisti_chiusure`. Nessun log utente completo in v1.

NOTA admin: la chiusura blocca le modifiche SOLO lato autista. L'admin conserva sempre la facoltà di modificare il cartellino (vedi §2.2, azione MODIFICA), anche a mese chiuso, senza doverlo riaprire. La RIAPERTURA serve solo a restituire all'AUTISTA la possibilità di editare.

---

## 7. EXPORT PDF

Riusa il pattern esistente (audit confermato):
- Generazione: `src/utils/pdfEngine.ts` (jsPDF + autoTable). Builder cartellino DA CREARE.
- Anteprima + condivisione: `openPreview` / `sharePdfFile` da `src/utils/pdfPreview.ts`,
  componente `src/components/PdfPreviewModal.tsx`.
- Pagina di riferimento per l'integrazione: `src/next/NextLibrettiExportPage.tsx`
  (handlePreview / handleSharePDF).
- Layout PDF: tabella (Data, Giorno, Inizio, Fine, Totale, Monte ore, Pausa, Notte, Note) — con Monte ore (+/−/0) e Notte (Sì/—) per riga +
  footer (§5). Un PDF = un autista (badge) × un mese.

**PDF massivo (lato admin)**: un'unica esportazione che, per il mese selezionato, produce un PDF con una pagina per ciascun autista che ha registrato orari. Riusa lo stesso builder del PDF singolo, iterando sui badge con dati nel mese e concatenando le pagine. Ogni pagina riporta nome autista + stato mese (Chiuso/Aperto) in intestazione. Stessa anteprima+condivisione del singolo.

**Header PDF (fix presentazione)**: l'intestazione del PDF NON deve sovrapporre il titolo del cartellino all'header aziendale. Disposizione su righe DISTINTE: (1) blocco aziendale (logo + ragione sociale + "Sistema Gestione Manutenzioni"); (2) SOTTO, su riga propria, il titolo del cartellino "Cartellino orari - NOME (BADGE) - MESE ANNO [Stato]". Nessun testo accavallato. Vale per PDF singolo e massivo.

---

## 8. REGISTRAZIONE PERMESSI (doppio punto — OBBLIGATORIO)

Il modulo va aggiunto in ENTRAMBI gli array `AUTISTI_MODULI`:
- `src/autisti/HomeAutista.tsx` (commento "DEVE restare identico...")
- `src/autistiInbox/AutistiAdmin.tsx` (commento "DEVE restare identico...")

Nuovo moduleId (kebab-case): `orari-note` (INVARIATO). Label mostrata nel tabellone permessi e nell'app: **`Orari`** — `{ id: "orari-note", label: "Orari", defaultOn: false }`. NB: il moduleId resta `orari-note` per non rompere eventuali permessi già salvati; cambia solo la stringa `label`.
`defaultOn: false` → nasce spento, si accende per badge dal tabellone admin.

Il gate `isModuloVisible("orari-note")` in HomeAutista nasconde il bottone se non attivo.

---

## 9. BARRIERA / SCRITTURE

- Lato app autista madre (`/autisti/*`): la barriera NON è attiva (solo `/next/*`), scrittura libera.
La pagina/azione gestionale vive sotto `/next/autisti-admin`. La lettura è read-only. L'azione admin che scrive su `@orari_autisti` o `@orari_autisti_chiusure` (es. RIAPRI) è coperta dalla deroga path-only già esistente su `/next/autisti-admin` (`cloneWriteBarrier.ts:151-166`), a condizione di aggiungere ENTRAMBE le chiavi `@orari_autisti` e `@orari_autisti_chiusure` alla whitelist `AUTISTI_ADMIN_INBOX_ALLOWED_STORAGE_KEYS`. Nessuna nuova eccezione di path necessaria.

Estensione scrittura admin (decisione 2026-06-14): l'azione admin MODIFICA (§2.2) scrive su `@orari_autisti` da `/next/autisti-admin`. È coperta dalla STESSA deroga path-only e dalle stesse chiavi già in whitelist (`@orari_autisti`, `@orari_autisti_chiusure`): NON serve nuova eccezione di path né nuova chiave. È un allargamento CONSAPEVOLE della scrittura gestionale (da read-only+riapri a read-write pieno sul dominio orari), circoscritto a quel path e a quelle due chiavi. Da annotare nel DIARIO_DECISIONI.

---

## 10. FUORI SCOPO v1 (evoluzioni future, NON implementare ora)

- Filtro per commessa/lavoro ("Lavoro: «tutti» | Matrice Lavori" dell'app vecchia): la nota
  libera lo copre. Eventuale evoluzione.
- Calcolo automatico di straordinari/monte-ore contrattuale.
- Campo pausa a durata variabile (la pausa è 1h fissa in v1).

---

## 11. PUNTI DA VERIFICARE CON CODEX (prima di implementare)

1. Firme esatte e righe di: `openPreview`, `sharePdfFile`, `PdfPreviewModal` props, helper
   data in `pdfEngine.ts`.
2. Pattern esatto array `AUTISTI_MODULI` + tipo `AutistiModuloId` nei due file (struttura
   campo, kebab-case, defaultOn).
3. Dove si registra la route `/autisti/<nuovo>` in `App.tsx` (non verificato nell'audit).
4. Conferma path della pagina gestionale (sotto `/next/autisti-admin` o altro) → impatto barriera (§9).
5. Pattern reader `read*Snapshot` riusabile per leggere `@orari_autisti` lato gestionale.
6. Forma di persistenza dello stato chiusura mensile (opzione A vs B §3).

STATO VERIFICA (2026-06-14): verifica Codex SÌ CON CORREZIONI. Punti risolti: 1 (handler PDF = handleSharePDF), 8 (pattern riapertura = nextChiusuraEventoWriter), stato chiusura (doc separato @orari_autisti_chiusure), path gestionale (/next/autisti-admin), tracciamento (chiusoAt/riapertoAt). Helper calcolo orari e builder PDF cartellino restano DA CREARE ex novo in implementazione.

AGGIORNAMENTO 0.3 (2026-06-14): aggiunte dopo prima prova utente — (a) flusso autista giorno-first con header a frecce e data-varco verso il riepilogo; (b) label modulo "Orari" / bottone app "Registro orari" (moduleId invariato orari-note); (c) footer dinamico (voci 0 nascoste, eccetto Totale/Giorni/Media); (d) admin read-write pieno sul cartellino, update-in-place, anche a mese chiuso; (e) export PDF massivo una-pagina-per-autista con stato; (f) modale permessi admin allargato (no scroll orizzontale). Da implementare in un blocco unico Claude Code con guardiano sui flussi.

AGGIORNAMENTO 0.4 (2026-06-14): rifiniture di presentazione dopo prova utente — (a) flag NOTTE/NO PAUSA resi grandi ai lati del Totale, solo "Lavoro"; (b) nota del giorno visibile dopo il salvataggio nella vista giorno; (c) nota troncata+espandibile nel riepilogo; (d) fix header PDF (titolo cartellino su riga distinta dall'header aziendale, no sovrapposizione), singolo e massivo. Solo presentazione: nessuna modifica a dati/logica/scrittura. Da implementare in un blocco unico Claude Code.

AGGIORNAMENTO 0.5 (2026-06-14): ridisegno vista riepilogo autista dopo prova utente (la tabella stretta era illeggibile su mobile) — (a) lista a CARD con SOLO i giorni segnati; (b) riga "Compilati / Mancanti feriali" in cima (weekend esclusi dai mancanti; sab/dom compaiono solo se compilati); (c) notte resa VISIBILE per giorno: etichetta su card autista, colonna "Notte" Sì/— lato gestionale, indicazione nel PDF; (d) footer Riepilogo mese invariato, resta in fondo. Solo presentazione + aggregato di conteggio (mancanti): nessuna modifica a shape record, scrittura, barriera. Da implementare in blocco unico Claude Code con guardiano sui flussi (frecce, click-card, alert chiusura, conteggio mancanti che esclude i weekend).

AGGIORNAMENTO 0.6 (2026-06-14): (a) vista riepilogo autista rifatta come TABELLA COMPATTA tipo Excel (le card erano troppo alte → scroll infinito): solo giorni segnati, colonne Data/Giorno bloccate, resto in scroll laterale col dito, Notte/Pausa come "X", note in 1–3 parole, click riga → apre il giorno; (b) NUOVA logica MONTE ORE contrattuale (§4bis): monte ore = netto − 9h, assenze neutre 0, resa per giorno (colonna +/−/0 colorata) e per mese (riga footer sempre visibile). Il monte ore è LOGICA DI CALCOLO: la sua implementazione richiede verifica SPEC→codice su orariCalc.ts PRIMA di scrivere (i 4 casi di §4bis devono tornare). Presentazione tabella = solo UI.

AGGIORNAMENTO 0.7 (2026-06-14): correzione monte ore mensile — da somma algebrica COMPENSATA (errore SPEC 0.6) a DUE TOTALI SEPARATI non compensati: "Monte ore +" (verde, segno +) e "Monte ore −" (rosso, segno −), in app/gestionale/PDF. Lo scarto per giorno resta invariato. Chiarito §1. Patch codice: solo footer mensile (da una riga compensata a due righe +/− colorate); colonna per-giorno e calcolo giornaliero NON cambiano.
