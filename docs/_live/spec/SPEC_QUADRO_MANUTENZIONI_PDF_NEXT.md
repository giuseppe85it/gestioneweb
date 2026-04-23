# SPEC — Quadro manutenzioni PDF: card + modale + PDF (NEXT)

**Modulo**: `/next/manutenzioni` — tab "Quadro manutenzioni PDF"
**File target unico**: `src/next/NextManutenzioniPage.tsx`
**Motore PDF esistente**: `jspdf` + `jspdf-autotable` (dynamic import, già usato in `exportPdfForItems` ~r.1148)
**Mockup visuale**: `docs/_live/mockup/MOCKUP_QUADRO_MANUTENZIONI_V3.html`
**Stato**: IN_CORSO
**Data creazione**: 2026-04-22

---

## 1. Obiettivo in una riga

Potenziare la tab "Quadro manutenzioni PDF" con: lista manutenzioni nella card + targa cliccabile → dossier + modale "Tutte le manutenzioni" con 3 layout + PDF quadro generale ristrutturato a sezioni per mezzo + PDF singolo mezzo con hero mezzo-centrica. Foto del mezzo in entrambi i PDF. Tutto in un solo file. Zero tocchi a domain, writer, pdfEngine, barrier, Madre.

---

## 2. Perimetro file

### CREA
Nessun file sorgente nuovo.

### MODIFICA (sorgente)
- `src/next/NextManutenzioniPage.tsx` (unico file sorgente toccato)

### MODIFICA (documentazione, solo se pertinente dopo la patch)
- `docs/_live/STATO_MIGRAZIONE_NEXT.md` — stato del modulo Manutenzioni
- `docs/_live/REGISTRO_MODIFICHE_CLONE.md` — voce BREVE 5-10 righe nel formato esistente
- `CONTEXT_CLAUDE.md` — bullet in cima a "Ultimo task completato"
- `docs/_live/spec/SPEC_QUADRO_MANUTENZIONI_PDF_NEXT.md` — questa spec, se cambia qualcosa in corso d'opera
- `docs/_live/INDICE_SPEC.md` — aggiornare la voce di questa spec a `IMPLEMENTATA` al termine

### NON TOCCARE
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/domain/nextDossierMezzoDomain.ts`
- `src/next/domain/nextRifornimentiDomain.ts`
- `src/next/pdfEngine*` (se esiste)
- `src/utils/cloneWriteBarrier.ts`
- Firebase rules
- Qualunque file Madre legacy fuori da `src/next/`

### VIETATO CREARE
- **Nessun change-report** (cartella `docs/change-reports/` deprecata)
- **Nessun continuity-report** (cartella `docs/continuity-reports/` deprecata)
- **Nessun audit MD** (lo storico è in `docs/_live/STORICO_AUDIT_COMPRESSO.md`)
- **Nessun mirror** in cartelle diverse da `docs/_live/`

---

## 3. Fatti certi dal codice (da audit recenti)

Questi fatti vanno **assunti veri** e non reinterpretati:

1. La tab "Quadro manutenzioni PDF" è inline in `NextManutenzioniPage.tsx` dentro la funzione `renderPdfPanel()` (~r.1788).
2. L'array `pdfFilteredItems` contiene già tutte le manutenzioni filtrate per il periodo selezionato nello STEP 2. Non serve nuovo selector né query.
3. `exportPdfForItems` (~r.1148) usa `jspdf` + `jspdf-autotable` importati dinamicamente (~r.1154-1155). **Non** usa `pdfEngine.ts`.
4. `buildPdfMetricInfo()` (~r.336) calcola già `deltaKm = currentKm - interventoKm` e lo renderizza nel tab PDF (~r.1908). Questa è la logica da **riusare** per il nuovo modale e per i PDF, senza estrarre helper condivisi (scelta di prodotto confermata: riuso locale).
5. Sorgente km attuali: snapshot rifornimenti consolidato per targa in `NextManutenzioniPage.tsx:551` (dal `readNextRifornimentiReadOnlySnapshot`). Usare questa sorgente, non `@mezzi_aziendali`.
6. `buildNextDossierPath(targa)` è già importato (~r.33) e già usato in Dashboard (~r.1387) e mappa (~r.2127). Per la targa cliccabile **riusare questo helper** e lo stesso pattern di navigazione già presente nel file.
7. Nessun consumer esterno della card: modifiche confinate al rendering interno di `renderPdfPanel`.
8. Oggi la targa è renderizzata come `<strong>{result.targa}</strong>` (~r.1886). Questo è il punto di intervento per la cliccabilità.
9. Il PDF quadro generale produce oggi una tabella flat multi-targa con descrizione già presente (colonna "Descrizione" da `buildPdfDescrizione(item)`, ~r.1247). Va ristrutturato a sezioni per mezzo.
10. Il PDF per-card già esporta tutte le manutenzioni della targa. Va aggiornato aggiungendo l'hero mezzo-centrica.

> **Nota per Codex**: i numeri di riga sono riferimenti indicativi basati sull'audit. Se al momento della patch risultano diversi di poche righe per drift naturale, identificare i punti per **contenuto** (nome funzione, stringa riconoscibile) e procedere.

### Fatti aggiuntivi confermati dalla verifica spec (2026-04-22)
- Il file importa `useLocation, useNavigate` da `react-router-dom` (~r.2). Non usa `Link/NavLink`.
- La navigazione al dossier avviene via `navigate(buildNextDossierPath(targa))` su `<button>` (pattern consolidato a r.1387 e r.2127).
- La foto mezzo è accessibile come `result.mezzo?.fotoUrl` nella card e come `mezzoPreviewByTarga.get(targa)?.fotoUrl` nell'export PDF.
- I blocchi della card nel `renderPdfPanel` si chiamano `man2-pdf-row__meta` (~r.1883) e `man2-pdf-row__actions` (~r.1923).
- `buildPdfDescrizione` si trova a r.480. `buildPdfMetricInfo` a r.336. `pdfFilteredItems` a r.800.

---

## 4. Campi dati disponibili nel record manutenzione

Da riusare senza inventare campi nuovi. Shape confermata (mapping già fatto nel file):
- `data` (data intervento)
- `km` (km al momento dell'intervento → chiamato `interventoKm` in `buildPdfMetricInfo`)
- `tipo` (mezzo / gomme / rimorchio / altro)
- `sottotipo` (se presente)
- `descrizione` (testo libero)
- `fornitore` (se presente, altrimenti "—")
- `targa`

Per il calcolo Δ km usare il pattern di `buildPdfMetricInfo()`:
```
deltaKm = currentKm_mezzo - interventoKm
```
Visualizzazione:
- Se `deltaKm === 0` → mostrare `"0"` (manutenzione ai km attuali)
- Se `deltaKm > 0` → mostrare `"+X.XXX"` (formattato con separatore migliaia come già fa il file)
- Se `deltaKm < 0` (raro, dato errato) → mostrare `"—"` senza rompere

---

## 5. Specifica funzionale — 5 modifiche

### 5.1 Card web: sezione "Ultime 3 manutenzioni" inline

**Posizione**: dentro `renderPdfPanel`, **dopo il blocco `man2-pdf-row__meta`** (~r.1883, quello che contiene targa/modello/autista/km/tipo) e **prima del blocco `man2-pdf-row__actions`** (~r.1923, quello che contiene i bottoni PDF / Apri dettaglio).

**Contenuto**:
- Titolo: `Ultime 3 manutenzioni` (o `Ultima manutenzione` / `Ultime 2 manutenzioni` se sono 1 o 2)
- A destra del titolo: pulsante `Vedi tutte (N) →` **solo se** il mezzo ha più di 3 manutenzioni nel periodo. Se ≤ 3, pulsante non compare.
- Tabella HTML con colonne: Data | Km | Δ km | Tipo | Descrizione
  - Data: formato `gg/mm/aaaa`
  - Km: formattato con separatore migliaia
  - Δ km: come specificato in §4
  - Tipo: pill con colore crema/marrone (vedi mockup)
  - Descrizione: testo pieno, senza troncamento

**Dati**: filtrare `pdfFilteredItems` per `item.targa === result.targa`, ordinare per data DESC, prendere i primi 3.

**Fallback vuoto**: se il mezzo non ha manutenzioni nel periodo, mostrare una riga di testo tenue: `Nessuna manutenzione nel periodo selezionato`. Nessuna tabella vuota.

**CSS**: prefisso classe `man2-pdf-list__*` coerente col resto di `renderPdfPanel` (che già usa prefissi `man2-pdf-*`). Niente stile inline ingombrante.

### 5.2 Targa cliccabile → dossier mezzo

**Oggi**: `<strong>{result.targa}</strong>` (~r.1886).

**Dopo**: sostituire lo `<strong>` con un `<button>` stilizzato come link, che al click esegue `navigate(buildNextDossierPath(result.targa))`. **Pattern coerente con il resto del file**: stesso approccio usato in `NextManutenzioniPage.tsx:1387` e `NextManutenzioniPage.tsx:2127` (button + useNavigate). **Non** introdurre `<Link>` o `<NavLink>` di react-router-dom: il file oggi non li usa.

**Import già presenti**: `useLocation, useNavigate` da `react-router-dom` (~r.2). `navigate` è già istanziato nel componente. `buildNextDossierPath` è già importato (~r.33).

**Stile visivo**: button con reset stile nativo (background none, border none, padding 0, font-family ereditata), sottolineato marrone (`#7c4a00`), decorazione 2px, offset 3px, peso bold come oggi. Hover: colore più scuro + cursor pointer. Focus visibile. Accessibilità: `aria-label="Apri dossier mezzo {targa}"`, `type="button"`.

### 5.3 Nuovo modale "Tutte le manutenzioni"

**Apertura**: cliccando `Vedi tutte (N) →` nella card.

**Stato**: `useState` locale nella pagina per tracciare `modalOpenForTarga: string | null`. Un solo modale istanziato alla volta.

**Struttura**:
- **Header**: titolo `Tutte le manutenzioni — {targa}`, sottotitolo con modello + autista + periodo + count manutenzioni, pulsante chiusura `×`
- **Barra informativa**: `Km attuali del mezzo: {km} km · La colonna Δ km mostra quanti km ha percorso il mezzo dall'intervento ad oggi`
- **Tab switcher** con 3 layout:
  - **A — Per data** (default all'apertura): tabella flat con colonne Data | Km | Δ km | Tipo | Descrizione | Fornitore; ordinamento data DESC
  - **B — Per mese**: raggruppato per mese (header tipo `Aprile 2026 — N manutenzioni`), dentro ogni gruppo tabella con stesse colonne tranne Fornitore
  - **C — Per tipo**: raggruppato per `tipo` (mezzo / gomme / rimorchio / altro), ogni gruppo in una card bianca con icona + label + count
- **Chiusura**: click su `×`, click su overlay esterno, tasto `Esc`

**Dati**: stessa filtro `pdfFilteredItems` della card, senza limite di 3.

**CSS**: prefisso `man2-pdf-modal__*`. Overlay `position: fixed; inset: 0`, z-index alto. Modale max-width 1000px, scroll interno se contenuto lungo.

**Ordinamento dentro i gruppi**: sempre data DESC.

### 5.4 PDF "Quadro generale" — ristrutturazione a sezioni per mezzo

**Oggi**: tabella flat multi-targa unica, descrizione già presente.

**Dopo**: per ciascun mezzo nel filtro, una sezione separata composta da:
1. **Header mezzo** (striscia scura con bordo oro a sinistra): foto mezzo (se presente, miniatura 56×42px) + Targa + Mezzo/Modello + Autista + Km attuali
2. **Tabella manutenzioni** del solo mezzo: Data | Km | Δ km | Tipo | Descrizione | Fornitore

**Ordinamento sezioni**: per targa asc, oppure per data più recente della manutenzione desc — **decisione implementativa di Codex**, da documentare nella voce del `REGISTRO_MODIFICHE_CLONE.md`. Default consigliato: targa asc (prevedibile).

**Page-break**: `autoTable` `didDrawPage` hook per evitare che una sezione venga spezzata a metà quando possibile. Se una singola sezione è più lunga di una pagina, accettare il break naturale.

**Header pagina** (su ogni pagina del PDF): `Quadro manutenzioni — Periodo: gg/mm/aaaa – gg/mm/aaaa — Generato il gg/mm/aaaa hh:mm`.

**Footer pagina**: paginazione `Pagina X di Y` (pattern già presente se `jspdf-autotable` lo fa; altrimenti skippare).

### 5.5 PDF singolo mezzo — hero mezzo-centrica

**Oggi**: il pulsante "PDF" sulla card già esporta manutenzioni del mezzo, ma con struttura simile al quadro generale.

**Dopo**: hero dedicato in cima al PDF, composto da:
- **A sinistra**: foto mezzo 140×105px con bordo oro (se presente)
- **Centro**: targa grande in font monospace color oro (`#c9a86a`), modello sotto in bianco
- **A destra (griglia 2×2)**: Km attuali / Autista / Ultima manutenzione / Tot. interventi nel periodo

Poi segue la tabella manutenzioni **senza header di sezione aggiuntivo** (la hero sostituisce la sezione del quadro generale): colonne Data | Km | Δ km | Tipo | Descrizione | Fornitore.

**Filtro**: rispetta il filtro periodo della pagina (STEP 2). Non esporta tutto lo storico.

**Fallback senza foto**: se il mezzo non ha foto, la hero diventa layout a 2 colonne (centro + destra), senza slot vuoto a sinistra.

---

## 6. Gestione foto mezzo nei PDF

### Sorgente foto
Confermata dall'audit: la foto mezzo è disponibile come `result.mezzo?.fotoUrl` nella card (~r.1876), e come `mezzoPreviewByTarga.get(singleTarga)?.fotoUrl` nell'export PDF singolo (~r.1173-1175). Il campo arriva da `readNextAnagraficheFlottaSnapshot()` via `mapMezzoPreview` (~r.286, r.300). **Riusare queste sorgenti esistenti**, non aggiungere nuove query.

### Inserimento in jspdf
`jspdf.addImage(dataUrlBase64, 'JPEG', x, y, w, h)` richiede base64. Due strade accettabili:
1. **Preferita**: se l'URL della foto è già un blob/base64 in memoria nella pagina, passarlo direttamente.
2. **Fallback**: `fetch → blob → FileReader → dataURL` in async prima di generare il PDF. Performance accettabile per fleet sotto i 200 mezzi. Oltre, documentare come debito nel `REGISTRO_MODIFICHE_CLONE.md`.

### Fallback "niente foto"
Se la foto manca, **non disegnare nulla** e ricollassare il layout:
- Quadro generale sezione: header torna a 4 colonne senza slot foto
- Singolo mezzo hero: torna a 2 colonne (targa/modello + stat)

Nessun placeholder grafico. Nessuna scritta "foto non disponibile".

### Errore caricamento foto
Se il fetch fallisce (404, timeout, CORS): trattarlo come "niente foto", senza bloccare la generazione del PDF. Log silenzioso in console, warning non bloccante.

---

## 7. Vincoli tecnici

- **Performance**: la generazione PDF non deve bloccare la UI oltre 2s percepiti per fleet ≤ 20 mezzi. Async/await pulito per le foto.
- **Accessibilità targa cliccabile**: `aria-label`, focus visibile.
- **Mobile**: la card con lista manutenzioni inline su schermi stretti deve impilare le colonne o lasciare scroll orizzontale alla tabella. Decidere in implementazione, purché resti leggibile.
- **TypeScript**: zero `any`. Se serve un tipo per raggruppamenti modale (per-mese / per-tipo), definirlo locale al file.
- **ESLint**: patch non deve introdurre nuovi errori. Lint globale può restare al baseline ma non peggiorare.

---

## 8. Test runtime richiesti al product owner post-patch

1. Aprire `/next/manutenzioni` tab "Quadro manutenzioni PDF"
2. Selezionare Soggetto = Mezzo, Periodo = Ultimo mese
3. Card mezzo: sotto i campi standard vedere "Ultime 3 manutenzioni" con tabella Data/Km/Δ km/Tipo/Descrizione
4. Cliccare la targa: deve aprire il dossier di quel mezzo
5. Se ci sono più di 3 manutenzioni nel periodo, cliccare "Vedi tutte (N)": apre modale
6. Nel modale provare i 3 layout (Per data / Per mese / Per tipo): stessi dati, strutture diverse
7. Chiudere il modale con × / overlay / Esc
8. Cliccare "PDF" sulla card: esce PDF con hero mezzo-centrica + foto (se presente) + tabella manutenzioni
9. Cliccare "PDF quadro generale" in alto: esce PDF con sezioni per mezzo + foto nelle sezioni (dove presente)
10. Verificare che un mezzo SENZA foto in entrambi i PDF appaia senza slot vuoto, layout ricollassato
11. Verificare che le manutenzioni con Δ km = 0 (ai km attuali) e Δ km > 0 siano formattate correttamente

---

## 9. Output richiesto da Codex al termine della patch

- `PATCH COMPLETATA` o `PATCH PARZIALE`
- `FILE LETTI`
- `FILE MODIFICATI` (unico sorgente: `NextManutenzioniPage.tsx`; più i doc `_live/` dove pertinente)
- `STRATEGIA FOTO`: A / B / mista, con spiegazione in 2 righe
- `ORDINAMENTO SEZIONI PDF QUADRO GENERALE`: targa asc / data desc / altro, motivazione in 1 riga
- `BUILD`: esito
- `LINT`: esito con delta rispetto al baseline
- `CHECKLIST VERIFICA RUNTIME` (i 11 punti del §8 riformattati)
- `DOMANDE APERTE`

---

## 10. Divieti assoluti

- Vietato toccare pdfEngine (se esiste), writer, domain, barrier.
- Vietato creare nuovi file sorgente.
- Vietato estrarre helper condivisi per il Δ km: riusare la logica locale del file.
- Vietato cambiare la shape dei record manutenzione.
- Vietato modificare altre tab della pagina (Dashboard, Nuova/Modifica, Dettaglio).
- Vietato introdurre nuove librerie oltre `jspdf` + `jspdf-autotable` già presenti.
- Vietato reinterpretare il mockup: se un elemento UI è nel mockup (colori, posizioni, copy) va riprodotto fedelmente. L'unica libertà concessa è sul comportamento mobile e sull'ordinamento sezioni PDF.
- Vietato inventare campi di dati: se un campo serve e non esiste, fermarsi con `SERVE FILE EXTRA` o `SERVE DECISIONE PRODUCT OWNER`.
- Vietato creare change-report, continuity-report, audit MD, mirror in cartelle deprecate (`docs/product/`, `docs/fonti-pronte/`, `docs/change-reports/`, `docs/continuity-reports/`).

---

## 11. Riferimenti

- Mockup visuale: `docs/_live/mockup/MOCKUP_QUADRO_MANUTENZIONI_V3.html`
- File target: `src/next/NextManutenzioniPage.tsx`
- Regole documentali del repo: `AGENTS.md` sezione "REGOLA FILE DI DOCUMENTAZIONE"
