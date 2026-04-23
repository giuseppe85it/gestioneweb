# AUDIT — Quadro manutenzioni PDF: dati card + PDF + dossier

Data: 2026-04-22
Fonte: codice reale `src/next/NextManutenzioniPage.tsx` + domain + structural paths

---

## 1. Tab "Quadro manutenzioni PDF"

### File e riga
- File: `src/next/NextManutenzioniPage.tsx`
- Funzione di rendering: `renderPdfPanel()` — `NextManutenzioniPage.tsx:1788`
- Montata nel return principale a `NextManutenzioniPage.tsx:2017`:
  ```
  if (view === "pdf") return renderPdfPanel();
  ```

### Come è montata nella pagina `/next/manutenzioni`
La pagina ha un solo componente `NextManutenzioniPage` che gestisce tutti e 4 i tab tramite una singola variabile di stato `view: ViewTab` (line 596). Il tab "pdf" ha chiave `"pdf"` nella nav tabs a `NextManutenzioniPage.tsx:2059`.

### Relazione con le altre tab
Tutti i tab (Dashboard, Nuova/Modifica, Dettaglio/mappa, Quadro PDF) sono fratelli all'interno dello stesso componente e **condividono l'intero state** del componente. In particolare:
- `storico` (array completo manutenzioni) è condiviso
- `pdfSubjectType`, `pdfPeriodFilter`, `pdfQuickSearch` sono state PDF-locali ma dichiarati a livello componente
- `activeTarga` è condiviso: se si seleziona un mezzo in Dashboard, la selezione persiste nella tab PDF
- L'eccezione è `view === "mappa"` (tab "Dettaglio") che renderizza `NextMappaStoricoPage` direttamente nel return, non passando per `renderActiveSurface()` (`NextManutenzioniPage.tsx:2083-2137`)

---

## 2. Catena dati card mezzo

### Caricamento iniziale
```
useEffect → readPageData()            NextManutenzioniPage.tsx:634-673
  ↓
readNextManutenzioniWorkspaceSnapshot()   nextManutenzioniDomain.ts (domain)
  → workspace.storico → setStorico([])   @manutenzioni (Firestore)
readNextAnagraficheFlottaSnapshot()
  → mezzoPreview (targa, marcaModello, autistaNome, fotoUrl)
readNextRifornimentiReadOnlySnapshot()
  → kmUltimoByTarga (km più recente per targa, da rifornimenti)
readNextLavoriInAttesaSnapshot()
  → lavoriInAttesaByTarga
readNextInventarioSnapshot()
  → materialiInventario (non usato in PDF tab)
```

### Selectors PDF-specifici

**`pdfFilteredItems`** — `NextManutenzioniPage.tsx:800-813`
- Source: `storico` (array completo)
- Filtri applicati:
  - `item.tipo === pdfSubjectType` (Step 1 Soggetto)
  - filtro data su `pdfPeriodFilter`: `ultimo-mese` = ultimi 30 giorni; `mese:YYYY-MM` = mese esatto; `tutto` = nessun filtro (Step 2 Periodo)
- Ordinato per data decrescente
- **Contiene tutti i campi del record incluso `descrizione`**

**`pdfGroupedResults`** — `NextManutenzioniPage.tsx:834-873`
- Raggruppa `pdfFilteredItems` per targa
- Per ogni gruppo produce:
  ```
  {
    targa: string,
    latest: items[0],         // il record più recente nel periodo
    mezzo: MezzoPreview | null,
    total: number,            // count degli interventi nel periodo
    metricInfo: PdfMetricInfo | null,
    gommePerAsse: ...,
    gommeStraordinarie: ...,
  }
  ```
- **NOTA: l'array completo `items` NON è esposto nel risultato del memo.** Viene usato solo per costruire i campi sopra, poi è discarded.

**`pdfVisibleResults`** — `NextManutenzioniPage.tsx:894-914`
- Filtro Step 3 Ricerca rapida (`pdfQuickSearch`): filtra per targa e autistaNome
- Applicato su `pdfGroupedResults`

**`pdfVisibleItems`** — `NextManutenzioniPage.tsx:915-918`
- Flat list di tutti i record delle targhe visibili
- Usato per il bottone "PDF quadro generale"

### Gestione filtri
| Filtro | Step | Stato UI | Applicato in | File:riga |
|---|---|---|---|---|
| Soggetto (mezzo/compressore/attrezzature) | Step 1 | `pdfSubjectType` | `pdfFilteredItems` | :805 |
| Periodo | Step 2 | `pdfPeriodFilter` | `pdfFilteredItems` | :808-810 |
| Ricerca rapida (targa/autista) | Step 3 | `pdfQuickSearch` | `pdfVisibleResults` | :906-907 |

---

## 3. Campi oggi mostrati nella card

La card è l'elemento `<article className="man2-pdf-row">` iterato su `pdfVisibleResults` a `NextManutenzioniPage.tsx:1874`.

| Campo UI visibile | Valore renderizzato | Sorgente dato | Tipo sorgente |
|---|---|---|---|
| Foto mezzo | `result.mezzo?.fotoUrl` | MezzoPreview (anagrafiche flotta) | per-mezzo |
| Targa | `result.targa` | chiave del gruppo | aggregato (targa) |
| Mezzo / modello | `result.mezzo?.marcaModello ?? result.mezzo?.label` | MezzoPreview | per-mezzo |
| Autista | `result.mezzo?.autistaNome` | MezzoPreview | per-mezzo |
| Km attuali (`metricInfo.primaryLabel`) | `result.metricInfo.primaryValue` | `kmUltimoByTarga[targa]` = ultimo rifornimento | aggregato (latest rifornimento) |
| Km intervento (`metricInfo.secondaryLabel`) | `result.metricInfo.secondaryValue` | `items[0].km` | **record singolo: l'ultimo nel periodo** |
| Δ km (`metricInfo.deltaLabel`) | `result.metricInfo.deltaValue` | computato | computato |
| Data | `result.latest.data` | `items[0].data` | **record singolo: l'ultimo nel periodo** |
| Tipo | `result.latest.tipo` | `items[0].tipo` | **record singolo: l'ultimo nel periodo** |
| Stato gomme (condizionale) | gomme per asse + straordinarie | `buildNextGommeStateByAsse` / `buildNextGommeStraordinarieEvents` su tutti i `maintenanceItems` | aggregato (tutti i record) |

**Risposta diretta:** la card oggi rappresenta un **mix**: i dati mezzo (foto, modello, autista) sono per-mezzo stabili; "Data", "Tipo", "Km intervento" vengono dall'**unico record più recente nel periodo** (`items[0]`); i km attuali vengono dall'ultimo rifornimento; la sezione gomme è un aggregato su tutti i record del periodo.

**Cosa è assente dalla card:** la lista completa delle manutenzioni del mezzo nel periodo (con `descrizione`, `data`, `tipo`, `km`, `fornitore`). Solo il conteggio `result.total` è disponibile nel gruppo, ma non è renderizzato nella card.

---

## 4. Disponibilità lista manutenzioni per mezzo

**Risposta: SI — già disponibile, non richiede modifiche al domain.**

La lista completa delle manutenzioni di un mezzo nel periodo è ottenibile direttamente in `renderPdfPanel()` tramite:
```
pdfFilteredItems.filter((item) => item.targa === result.targa)
```

Questo è esattamente ciò che fa già il bottone "PDF" per-card a `NextManutenzioniPage.tsx:1931`. La stessa espressione può essere usata per il rendering nella card.

In alternativa, `pdfGroupedResults` potrebbe essere esteso per esporre l'array `items` (bastano 2 righe nel memo a `:834-873`), evitando il re-filter nel JSX. Non è strettamente necessario.

**Shape di ciascun item** (tipo `NextManutenzioniLegacyDatasetRecord`, definito in `nextManutenzioniDomain.ts:110-130`):
- `id`, `targa`, `km`, `ore`, `sottotipo`, `descrizione` (always present), `eseguito`, `data` (always present), `tipo` (always present), `fornitore?`, `materiali?`, `importo?`, `sourceDocumentId?`

Il campo `descrizione` è sempre presente e non opzionale.

---

## 5. PDF "quadro generale"

### Trigger
Bottone "PDF quadro generale" — `NextManutenzioniPage.tsx:1797-1810`

### Dati passati
```
exportPdfForItems(pdfVisibleItems, `Quadro manutenzioni ${formatMonthFilterLabel(pdfPeriodFilter)}`)
```
`pdfVisibleItems` è la flat list di **tutti i record** di tutte le targhe visibili (già incluse tutte le manutenzioni nel periodo per tutte le targhe).

### Motore
**NON usa `pdfEngine.ts`**. Usa direttamente:
- `jspdf` importato dinamicamente a `NextManutenzioniPage.tsx:1154`
- `jspdf-autotable` importato dinamicamente a `NextManutenzioniPage.tsx:1155`
- Tutto self-contained nella funzione locale `exportPdfForItems` a `NextManutenzioniPage.tsx:1148-1283`

### Shape dati passati al generatore
`items: NextManutenzioniLegacyDatasetRecord[]` — array flat, tutti i record delle targhe visibili.

### Struttura PDF generata (multi-targa)
1. Header: titolo + data generazione
2. Unica `autoTable` con colonne: Targa, Tipo, Km/Ore, Sottotipo, Descrizione, Fornitore, Eseguito da, Data

**La colonna Descrizione è già presente nel PDF**, valorizzata via `buildPdfDescrizione(item)` a `NextManutenzioniPage.tsx:1247`. `buildPdfDescrizione` usa `item.descrizione` e aggiunge prefissi per gomme (`[STRAORDINARIO]`, `[ORDINARIO]`).

### Struttura PDF generata (single-targa)
1. Header: titolo + data generazione
2. Header mezzo: foto + Targa, Mezzo, Autista, Record esportati (lines 1189-1226)
3. Unica `autoTable` come sopra

**Il PDF non ha sezioni per-mezzo nella modalità multi-targa.** Tutto in una flat table.

---

## 6. PDF card singola

### Trigger
Bottone "PDF" per-card — `NextManutenzioniPage.tsx:1924-1937`

### Funzione
```
exportPdfForItems(
  pdfFilteredItems.filter((item) => item.targa === result.targa),
  `PDF ${pdfSubjectType} - ${result.targa}`,
)
```

### Condivide il motore con "PDF quadro generale"?
**SI.** Stessa funzione `exportPdfForItems` identica. La differenza è solo che:
- il per-card PDF passa solo i record di una targa → `uniqueTarghe.length === 1` → attiva la sezione foto-mezzo (lines 1172-1226)
- il quadro generale passa record di più targhe → flat table senza header mezzo

**Il PDF per-card già esporta TUTTE le manutenzioni della targa nel periodo con descrizione.** Non c'è nulla da aggiungere al PDF singolo per la feature B — funziona già. La feature B impatta principalmente il PDF quadro generale, che attualmente produce una sola flat table senza distinzione per mezzo.

---

## 7. Navigazione dossier mezzo

### Route e parametro
- Pattern URL: `/next/dossier/${encodeURIComponent(targa)}`
- Funzione: `buildNextDossierPath(targa)` — `nextStructuralPaths.ts:61-63`
- Prefisso: `NEXT_DOSSIER_PREFIX = "/next/dossier"` — `nextStructuralPaths.ts:24`
- Esempio reale: targa `TI324623` → `/next/dossier/TI324623`

### Importazione già presente
`buildNextDossierPath` è già importata in `NextManutenzioniPage.tsx:33`:
```
import { buildNextDossierPath } from "./nextStructuralPaths";
```

### Utilizzo esistente nella stessa pagina
- Dashboard: `NextManutenzioniPage.tsx:1387` — `navigate(buildNextDossierPath(mezzoPreviewSelezionato.targa))`
- Mappa tab: `NextManutenzioniPage.tsx:2127` — `navigate(buildNextDossierPath(mezzoPreviewSelezionato.targa))`

### Punto di intervento per targa cliccabile nella card PDF
La targa è oggi renderizzata come testo statico a `NextManutenzioniPage.tsx:1884-1887`:
```jsx
<div>
  <span className="man2-pdf-row__label">Targa</span>
  <strong>{result.targa}</strong>
</div>
```
La targa si trova in `result.targa` (tipo `string`). Il `navigate` è già disponibile nel componente (importato a line 591).

### Accortezze
- Targa nella card è già normalizzata (normalizeText applicato durante il grouping a `NextManutenzioniPage.tsx:837`)
- `buildNextDossierPath` fa già `encodeURIComponent(targa)` — nessun escaping manuale necessario
- Nessun state condiviso da passare: il dossier identifica il mezzo da URL param

---

## 8. Dipendenze trasversali

### La card PDF è riusata altrove?
**NO.** Il rendering `man2-pdf-row` è inline in `renderPdfPanel()` all'interno di `NextManutenzioniPage.tsx`. Non è un componente separato, non è importato da altri file.

### `exportPdfForItems` è usata da altre viste?
**NO.** È una funzione locale dichiarata all'interno del componente `NextManutenzioniPage`. Non è esportata. Non è importata da altri file. Modificarla non produce effetti fuori dal file.

### `pdfFilteredItems` / `pdfGroupedResults` / `pdfVisibleResults` sono usati altrove?
**NO.** Sono memo locali all'interno di `NextManutenzioniPage`.

### `buildPdfDescrizione` è usata altrove?
**NO.** Funzione locale dello stesso file, non esportata.

---

## 9. Punti di intervento per la patch (informativo)

### A. Lista manutenzioni nella card UI
- **File:** `src/next/NextManutenzioniPage.tsx`
- **Funzione:** `renderPdfPanel()` a riga 1788
- **Punto di inserimento:** dentro `<div className="man2-pdf-row__content">`, dopo il blocco gomme (dopo riga 2000 / prima della chiusura `</div>`)
- **Dato disponibile:** `pdfFilteredItems.filter((item) => item.targa === result.targa)` senza alcuna modifica ai memo o al domain
- **Campi disponibili per rendering:** `data`, `tipo`, `descrizione`, `km`, `ore`, `fornitore`, `eseguito`, `importo`
- **Rischio:** BASSO — modifica solo il JSX rendering di `renderPdfPanel`, nessuna logica business, nessun domain

### B. Lista manutenzioni nel PDF
**Per il PDF per-card (bottone "PDF"):**
- **Non richiede intervento.** Il PDF già esporta tutte le manutenzioni con descrizione.

**Per il PDF quadro generale (bottone "PDF quadro generale"):**
- **File:** `src/next/NextManutenzioniPage.tsx`
- **Funzione:** `exportPdfForItems` a riga 1148
- **Punto di inserimento:** il corpo della funzione gestisce già una flat table con tutti i campi inclusa `descrizione`. Se si vuole aggiungere sezioni per-mezzo (per allineare il PDF alla card), occorre modificare la logica di `autoTable` per iterare per targa anziché produrre una sola tabella flat — oppure aggiungere un blocco prima/dopo la tabella per ciascuna targa.
- **Rischio:** MEDIO — tocca la funzione di rendering PDF, ma la funzione è self-contained e non usa pdfEngine
- **Nota:** se la richiesta è solo che il PDF contenga le descrizioni (cosa già vera), non serve alcun intervento. Se la richiesta è una struttura per-mezzo nel PDF quadro, il tocco è nella funzione `exportPdfForItems`.

### C. Targa cliccabile nella card
- **File:** `src/next/NextManutenzioniPage.tsx`
- **Elemento JSX target:** `NextManutenzioniPage.tsx:1884-1887` — il `<div>` con `<strong>{result.targa}</strong>`
- **Modifica minima:** avvolgere `result.targa` in un `<button type="button" onClick={() => navigate(buildNextDossierPath(result.targa))}>` o in un `<Link to={buildNextDossierPath(result.targa)}>`
- `navigate` e `buildNextDossierPath` sono già disponibili nel componente
- **Rischio:** BASSO — tocca solo il JSX della card, nessuna logica

---

## 10. Fattibilità senza toccare pdfEngine

**RISPOSTA: SI**

Motivazione basata su codice:
- `exportPdfForItems` (`NextManutenzioniPage.tsx:1148-1283`) è completamente self-contained e non importa né usa `pdfEngine.ts` in nessun punto
- Usa `jspdf` e `jspdf-autotable` importati dinamicamente direttamente nel file
- Qualsiasi modifica alla struttura del PDF (aggiungere colonne, sezioni per-mezzo, modifica layout) si fa interamente dentro `exportPdfForItems` in `NextManutenzioniPage.tsx`
- `pdfEngine.ts` non è menzionato nel file né nelle sue dipendenze dirette

---

## 11. Domande aperte / file non letti

### Non richiesto, già sufficiente per la patch:
- `nextManutenzioniDomain.ts` letto parzialmente via grep: la shape di `NextManutenzioniLegacyDatasetRecord` è confermata completa (vedi sezione 4).
- `nextStructuralPaths.ts:55-83`: letto integralmente per la route dossier.

### File non letti perché non necessari:
- `NextMappaStoricoPage.tsx` (tab Dettaglio): non impattato dalla patch.
- `pdfEngine.ts`: confermato non usato nella tab PDF.
- `nextAnagraficheFlottaDomain.ts`: la shape `MezzoPreview` (targa, marcaModello, autistaNome, fotoUrl) è derivabile dai mapper e dai grep.

### Domande aperte
1. **Struttura PDF quadro generale**: la richiesta B vuole solo che le descrizioni compaiano (già presenti), oppure vuole la struttura per-mezzo nel PDF (ogni mezzo con la sua lista) anziché una flat table? La risposta cambia il rischio della patch da BASSO a MEDIO.
2. **Link o bottone per targa**: la targa cliccabile deve aprire il dossier tramite `<Link>` React Router (navigazione client-side) o `<a href>` (navigazione diretta)? Per consistenza con il resto del codebase (vedi `NextIADocumentiPage.tsx:641`) si usa `buildNextDossierPath` con `Link`.
3. **Card intera cliccabile o solo targa**: il prompt dice "renda la targa (o l'intera card) cliccabile". Quale delle due è il target effettivo?
