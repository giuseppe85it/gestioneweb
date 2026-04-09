# SPEC_MAGAZZINO_NEXT.md

Percorso: `docs/product/SPEC_MAGAZZINO_NEXT.md`

---

## 0. Scopo

Redesign completo del modulo Magazzino nella shell NEXT.
Comprende tre sezioni navigabili tramite switcher unico:
1. **Inventario** — gestione stock articoli
2. **Materiali consegnati** — movimenti in uscita dal magazzino
3. **Cisterne AdBlue** — tracciamento consumi AdBlue per media mobile

Vincoli:
- Nessuna modifica alla madre (`src/pages/Inventario.tsx`, `src/pages/MaterialiConsegnati.tsx`)
- Nessuna modifica ai dataset Firestore esistenti (`@inventario`, `@materialiconsegnati`)
- Nuovo dataset storage-style: `@cisterne_adblue` (solo per la sezione AdBlue, letto/scritto con `getItemSync` / `setItemSync`)
- CSS dedicato `next-magazzino.css` con prefisso `mag-`, nessun Tailwind
- Stile coerente con `next-euromecc.css` e `next-lavori.css`

---

## 1. File da creare

```
src/next/NextMagazzinoPage.tsx       — pagina unica con switcher interno
src/next/next-magazzino.css          — CSS prefisso mag-
```

Route da aggiungere in `src/App.tsx`:
```
/next/magazzino   →   NextMagazzinoPage
```

Le route legacy `/next/inventario` e `/next/materiali-consegnati` se già presenti
possono redirigere a `/next/magazzino`.

---

## 2. Struttura UI generale

### Switcher modulo (in cima, sempre visibile)

```
div.mag-module-switcher
  button.mag-mod-btn [active]   "Inventario"
  button.mag-mod-btn            "Materiali consegnati"
  button.mag-mod-btn            "Cisterne AdBlue"
```

Un solo modulo visibile alla volta. Gli altri `display:none`.

### Struttura comune a tutti e tre i moduli

```
header.mag-head
  div
    span.mag-eyebrow   "Magazzino"
    h1                 [titolo modulo]
  div.mag-head-actions
    [bottoni specifici]

section.mag-kpis
  article.mag-kpi x3
    div.mag-kpi__label
    div.mag-kpi__value
    div.mag-kpi__sub

nav.mag-tabs
  button.mag-tab [active] x N

[contenuto tab attivo]
```

---

## 3. CSS — `next-magazzino.css`

Prefisso `mag-`. Nessun Tailwind. Coerente con `eur-` e `nl-`.

```css
/* Switcher modulo */
.mag-module-switcher   /* flex row, border 0.5px secondary, border-radius-lg, overflow hidden, width fit-content, margin-bottom 1.5rem */
.mag-mod-btn           /* padding 7px 16px, font-size 13px, background primary, border none, color secondary */
.mag-mod-btn.active    /* background #166534, color #fff, font-weight 500 */

/* Header */
.mag-head              /* flex row, space-between, align-items flex-start, margin-bottom 1.25rem */
.mag-eyebrow           /* font-size 11px, uppercase, letter-spacing .06em, color secondary, margin-bottom 3px */
.mag-head-actions      /* flex row, gap 6px, padding-top 4px */

/* KPI */
.mag-kpis              /* grid 3 colonne, gap 8px, margin-bottom 1.25rem */
.mag-kpi               /* background secondary, border-radius-md, padding 10px 12px */
.mag-kpi__label        /* font-size 11px, color secondary, margin-bottom 2px */
.mag-kpi__value        /* font-size 20px, font-weight 500 */
.mag-kpi__sub          /* font-size 11px, color secondary */

/* Tab nav */
.mag-tabs              /* flex row, border-bottom 1px tertiary, margin-bottom 1.25rem */
.mag-tab               /* padding 7px 14px, font-size 13px, border-bottom 2px transparent, margin-bottom -1px */
.mag-tab.active        /* color #166534, border-bottom-color #166534, font-weight 500 */

/* Toolbar filtri */
.mag-toolbar           /* flex row, gap 6px, margin-bottom 10px */
/* input dentro toolbar: flex 2 — select dentro toolbar: flex 1 */
/* entrambi: padding 6px 8px, font-size 12px, border 0.5px tertiary, border-radius-md */

/* Card articolo inventario */
.mag-item              /* background primary, border 0.5px tertiary, border-radius-lg, padding 10px 12px */
.mag-item.esaurito     /* border-color #fca5a5 */
.mag-item__row1        /* flex row, gap 8px, align-items center, margin-bottom 6px */
.mag-item__row2        /* flex row, gap 8px, align-items center */
.mag-item__photo       /* 36x36px, border-radius-md, background secondary, border 0.5px tertiary, flex-shrink 0 */
.mag-item__title       /* flex 1, font-size 13px, font-weight 500, line-height 1.3 */
.mag-item__meta        /* flex 1, font-size 11px, color secondary */

/* Controllo quantità */
.mag-qty               /* flex row, gap 4px, align-items center */
.mag-qty__btn          /* 24x24px, border 0.5px secondary, border-radius 6px, font-size 13px */
.mag-qty__input        /* width 48px, height 24px, text-align center, font-size 12px, border 0.5px tertiary, border-radius 6px */

/* Badge */
.mag-badge             /* font-size 11px, padding 2px 7px, border-radius 100px, font-weight 500, flex-shrink 0 */
.mag-badge--ok         /* background #dcfce7, color #166534 */
.mag-badge--basso      /* background #fef9c3, color #854d0e */
.mag-badge--esaurito   /* background #fee2e2, color #991b1b */
.mag-badge--mezzo      /* background #dbeafe, color #1e40af */
.mag-badge--collega    /* background #ede9fe, color #5b21b6 */
.mag-badge--magazzino  /* background secondary, color secondary */

/* Movimenti */
.mag-movement              /* background primary, border 0.5px tertiary, border-radius-lg, overflow hidden, margin-bottom 6px */
.mag-movement__head        /* flex row, gap 8px, padding 10px 12px, cursor pointer */
.mag-movement__dest        /* flex 1, font-size 13px, font-weight 500 */
.mag-movement__tot         /* font-size 12px, color secondary */
.mag-movement__toggle      /* font-size 11px, border 0.5px tertiary, border-radius 6px, background none */
.mag-movement__body        /* border-top 0.5px tertiary, padding 8px 12px, display none (toggle via JS) */
.mag-movement__row         /* flex row, gap 8px, font-size 12px, padding 6px 0, border-bottom 0.5px tertiary */
.mag-movement__row:last-child /* border-bottom none */
.mag-movement__row-date    /* color secondary, min-width 70px, flex-shrink 0 */
.mag-movement__row-desc    /* flex 1 */
.mag-movement__row-qty     /* color secondary, flex-shrink 0 */
.mag-movement__row-motivo  /* color tertiary, font-size 11px, flex-shrink 0 */

/* Form */
.mag-form-panel    /* background primary, border 0.5px tertiary, border-radius-lg, padding 14px */
.mag-form-title    /* font-size 13px, font-weight 500, padding-bottom 8px, border-bottom 0.5px tertiary, margin-bottom 12px */
.mag-field         /* margin-bottom 10px */
.mag-field__label  /* font-size 11px, color secondary, display block, margin-bottom 3px */
.mag-field__input  /* width 100%, padding 6px 8px, font-size 13px, border 0.5px tertiary, border-radius-md */
.mag-field__hint   /* font-size 10px, color tertiary, margin-top 2px */
.mag-field__selected /* flex row, gap 6px, align-items center, padding 6px 8px, background secondary, border 0.5px tertiary, border-radius-md */
.mag-field-row     /* grid 2 colonne gap 8px */

/* Feedback inline */
.mag-notice    /* font-size 11px, background #dcfce7, color #166534, padding 4px 8px, border-radius 6px, margin-top 3px */
.mag-warning   /* font-size 11px, background #fef9c3, color #854d0e, padding 4px 8px, border-radius 6px, margin-top 3px */
.mag-error     /* font-size 11px, background #fee2e2, color #991b1b, padding 4px 8px, border-radius 6px, margin-top 3px */
.mag-empty     /* font-size 13px, color secondary, text-align center, padding 2rem */

/* Bottoni */
.mag-btn           /* padding 5px 12px, font-size 12px, border 0.5px secondary, border-radius-md, background primary */
.mag-btn--primary  /* background #166534, border-color #166534, color #fff */
.mag-btn--full     /* width 100%, padding 8px, font-size 13px, margin-top 10px */
.mag-btn--sm       /* padding 3px 8px, font-size 11px, border-radius 6px */
.mag-btn--danger   /* border-color #fca5a5, color #991b1b */

/* Cisterne AdBlue */
.mag-cis-grid              /* grid 2 colonne, gap 1rem, margin-bottom 1.25rem */
.mag-cis-card              /* background primary, border 0.5px tertiary, border-radius-lg, padding 14px */
.mag-cis-card__title       /* font-size 11px, uppercase, letter-spacing .05em, color secondary, margin-bottom 12px */
.mag-progress              /* height 6px, background secondary, border-radius 100px, overflow hidden, margin 6px 0 2px */
.mag-progress__fill        /* height 100%, border-radius 100px */
.mag-progress__fill--verde  /* background #22c55e */
.mag-progress__fill--giallo /* background #eab308 */
.mag-progress__fill--rosso  /* background #ef4444 */
.mag-progress__labels      /* flex row, space-between, font-size 10px, color tertiary, margin-top 2px */
.mag-log-row               /* flex row, gap 8px, font-size 12px, padding 7px 0, border-bottom 0.5px tertiary */
.mag-log-row:last-child    /* border-bottom none */
.mag-log-row__date         /* color secondary, min-width 80px, flex-shrink 0 */
.mag-log-row__cisterna     /* flex 1, color primary */
.mag-log-row__durata       /* color secondary, min-width 70px, text-align right, flex-shrink 0 */
.mag-log-row__ltgg         /* color tertiary, font-size 11px, min-width 60px, text-align right, flex-shrink 0 */
```

---

## 4. Sezione Inventario

### KPI
| Label | Valore | Sub |
|---|---|---|
| Articoli totali | `count(items)` | in magazzino |
| Sotto soglia | `count(items dove quantita <= sogliaMinima && quantita > 0)` | da riordinare |
| Esauriti | `count(items dove quantita <= 0)` | stock zero |

### Tab "Magazzino" — lista articoli

Toolbar: ricerca testo libero su `descrizione` + filtro fornitore + filtro stato stock.

Per ogni `InventarioItem`:
```
article.mag-item [.esaurito se quantita <= 0]
  div.mag-item__row1
    div.mag-item__photo  (img se fotoUrl, altrimenti placeholder SVG)
    div.mag-item__title
    span.mag-badge.mag-badge--{ok|basso|esaurito}
  div.mag-item__row2
    div.mag-item__meta  (fornitore · unità)
    div.mag-qty
      button.mag-qty__btn  "−"
      input.mag-qty__input
      button.mag-qty__btn  "+"
    div (azioni)
      button.mag-btn.mag-btn--sm         "Modifica"  → apre modal edit
      button.mag-btn.mag-btn--sm.mag-btn--danger  "Elimina"  → conferma inline
```

### Tab "Aggiungi articolo" — form

Campi:
- **Descrizione** — input text, required
- **Fornitore** — input con autocomplete da `@fornitori` (`.nome || .ragioneSociale`)
- **Quantità** — input number, min 0
- **Unità** — select: pz / lt / kg / mt
- **Soglia minima riordino** — input number, opzionale. Hint: "Sotto questa quantità l'articolo appare in giallo"
- **Foto** — input file, accept image/*, opzionale

Submit: `button.mag-btn.mag-btn--primary.mag-btn--full` "Aggiungi al magazzino"

### Logica badge stock

```typescript
type StockStatus = "ok" | "basso" | "esaurito"

function getStockStatus(item: InventarioItem): StockStatus {
  if (item.quantita <= 0) return "esaurito"
  if (item.sogliaMinima !== undefined && item.quantita <= item.sogliaMinima) return "basso"
  return "ok"
}
```

### Shape `InventarioItem` — estensione retrocompatibile

```typescript
interface InventarioItem {
  id: string
  descrizione: string
  quantita: number
  unita: "pz" | "mt" | "kg" | "lt"
  fornitore: string | null
  fotoUrl: string | null
  fotoStoragePath: string | null
  sogliaMinima?: number   // NUOVO — opzionale, assente = nessuna soglia
}
```

---

## 5. Sezione Materiali consegnati

### KPI
| Label | Valore | Sub |
|---|---|---|
| Consegne totali | `count(consegne)` | registrate |
| Consegne oggi | `count(consegne con data === oggi)` | data odierna |
| Destinatari unici | `count(destinatari distinti per refId)` | attivi |

### Tab "Storico consegne"

Toolbar: ricerca su `destinatario.label` e `descrizione` + filtro tipo (`MEZZO / COLLEGA / MAGAZZINO`).

Lista raggruppata per `destinatario.refId`:
```
div.mag-movement
  div.mag-movement__head  (click → toggle body)
    span.mag-badge.mag-badge--{mezzo|collega|magazzino}
    span.mag-movement__dest   (destinatario.label)
    span.mag-movement__tot    "Tot: X {unità}"   ← unità esplicita sempre
    button.mag-movement__toggle  "Dettaglio ▾" / "Chiudi ▴"
  div.mag-movement__body  (hidden di default)
    div.mag-movement__row per ogni consegna del gruppo
      span.mag-movement__row-date
      span.mag-movement__row-desc
      span.mag-movement__row-qty  (quantita + unita)
      span.mag-movement__row-motivo
      button.mag-btn.mag-btn--sm.mag-btn--danger  "Elimina"
```

### Tab "Nuova consegna" — form

**Destinatario** — autocomplete obbligatorio:
- Sorgenti: `@mezzi_aziendali` (label = targa) + `@colleghi` (label = nome + cognome) + voce fissa "MAGAZZINO"
- Dopo selezione: `div.mag-field__selected` con badge tipo + label + bottone "Cambia"
- Validazione: blocca submit se `destinatarioObj === null`

**Materiale** — autocomplete obbligatorio da `@inventario`:
- Dropdown mostra: descrizione + quantità disponibile
- Dopo selezione: `div.mag-field__selected` + `div.mag-warning` "Disponibili: X {unità}"
- Unità pre-compilata automaticamente e readonly
- Validazione: blocca submit se `materialeSelezionato === null`

**Quantità** — input number, min 0.01:
- `div.mag-error` inline se `quantita > materialeSelezionato.quantita`

**Altri campi:**
- Unità — input readonly, pre-compilato dalla selezione materiale
- Motivo — input text, opzionale
- Data consegna — input date, default oggi

Submit: `button.mag-btn.mag-btn--primary.mag-btn--full` "Registra consegna" — disabled se `saving` o errore stock.

### BUG-01 fix — blocco se stock insufficiente

```typescript
async function handleAdd() {
  const itemMagazzino = items.find(
    i => i.descrizione.toLowerCase() === materialeSelezionato!.descrizione.toLowerCase()
      && i.unita === materialeSelezionato!.unita
  )
  if (!itemMagazzino || itemMagazzino.quantita < quantita) {
    setError(`Quantità disponibile insufficiente (disponibili: ${itemMagazzino?.quantita ?? 0} ${itemMagazzino?.unita ?? ''})`)
    return
  }
  // procede
}
```

### BUG-02 fix — rollback se seconda scrittura fallisce

```typescript
  setSaving(true)
  try {
    const nuovaConsegna: MaterialeConsegnato = { /* campi form */ }
    const nuovaListaConsegne = [...consegne, nuovaConsegna]
    const nuovaListaInventario = items
      .map(i => {
        if (
          i.descrizione.toLowerCase() === materialeSelezionato!.descrizione.toLowerCase()
          && i.unita === materialeSelezionato!.unita
        ) return { ...i, quantita: i.quantita - quantita }
        return i
      })
      .filter(i => i.quantita > 0)

    await persistConsegne(nuovaListaConsegne)
    try {
      await persistInventario(nuovaListaInventario)
    } catch (errInventario) {
      await persistConsegne(consegne)   // rollback
      throw errInventario
    }

    setConsegne(nuovaListaConsegne)
    setItems(nuovaListaInventario)
    setNotice('Consegna registrata.')
    resetForm()
  } catch {
    setError('Errore durante la registrazione. Riprova.')
  } finally {
    setSaving(false)
  }
```

### BUG-03 fix — warning prima di creare item orfano

```typescript
async function handleDeleteConsegna(consegna: MaterialeConsegnato) {
  const itemEsiste = items.some(
    i => i.descrizione.toLowerCase() === consegna.descrizione.toLowerCase()
      && i.unita === consegna.unita
  )
  if (!itemEsiste) {
    setWarningDelete({
      consegna,
      messaggio: `L'articolo "${consegna.descrizione}" non è più in magazzino. Il ripristino creerà una voce senza foto e fornitore. Continuare?`
    })
    return
  }
  await eseguiDelete(consegna)
}
```

---

## 6. Sezione Cisterne AdBlue

### Dataset storage-style — nuova chiave

Chiave: `@cisterne_adblue`
Meccanismo: `getItemSync` / `setItemSync` — stesso pattern di `@inventario`

Decisione vincolante: `@cisterne_adblue` NON e una collection Firestore classica.
Va trattata come dataset storage-style del dominio, coerente con il caricamento iniziale e con il resto della sezione Magazzino NEXT.

```typescript
interface CambioAdBlue {
  id: string               // `${Date.now()}_${Math.random().toString(16).slice(2)}`
  data: string             // formato "gg mm aaaa" — coerente con MaterialeConsegnato
  numeroCisterna?: string  // opzionale
  note?: string            // opzionale
}
```

Struttura salvata: `{ value: CambioAdBlue[] }`

### Costanti

```typescript
const LITRI_PER_CISTERNA = 1000
const N_CAMBI_MEDIA = 6   // media mobile sugli ultimi N cambi
```

### Logica calcoli

```typescript
// Durata in giorni tra due date "gg mm aaaa"
function durataGiorni(dataInizio: string, dataFine: string): number

// Media mobile durata sugli ultimi N cambi
function mediaDurataGiorni(cambi: CambioAdBlue[]): number {
  // prende gli ultimi N+1 record ordinati cronologicamente
  // calcola la durata tra ogni coppia consecutiva
  // restituisce la media arrotondata
}

// Litri consumati dalla cisterna attiva (stima)
function litriConsumatiStima(ultimoCambio: CambioAdBlue, mediaGiorni: number): number {
  const giorniPassati = durataGiorni(ultimoCambio.data, oggi())
  const consumoGiornaliero = LITRI_PER_CISTERNA / mediaGiorni
  return Math.min(Math.round(consumoGiornaliero * giorniPassati), LITRI_PER_CISTERNA)
}

// Percentuale consumata (0-100) per la barra progress
function percentualeConsumata(litriConsumati: number): number {
  return Math.round((litriConsumati / LITRI_PER_CISTERNA) * 100)
}

// Colore barra progress
function coloreProgress(perc: number): "verde" | "giallo" | "rosso" {
  if (perc < 60) return "verde"
  if (perc < 85) return "giallo"
  return "rosso"
}

// Stima data fine cisterna
function stimaDataFine(ultimoCambio: CambioAdBlue, mediaGiorni: number): string
```

### KPI
| Label | Valore | Sub |
|---|---|---|
| Media durata cisterna | `mediaDurataGiorni(cambi)` gg | ultimi N cambi |
| Consumo medio | `Math.round(1000 / media)` lt/gg | 1000 lt ÷ media gg |
| Cambi registrati | `cambi.length` | dal primo inserimento |

### Tab "Stato attuale"

Due card affiancate (`div.mag-cis-grid`):

**Card sinistra — Cisterna attiva:**
```
icona SVG cisterna + nome (#N) + badge stato
sottotitolo: "Avviata il GG/MM/AAAA · X giorni fa"
div.mag-progress > div.mag-progress__fill.mag-progress__fill--{verde|giallo|rosso}
div.mag-progress__labels: "~X lt consumati" · "~X lt rimasti"
divider
testo: "Stima fine: ~GG/MM/AAAA (tra ~X giorni)"
```

Badge stato cisterna attiva basato su percentuale consumata:
- `mag-badge--ok` se < 60%
- `mag-badge--basso` se 60–85%
- `mag-badge--esaurito` se > 85%

**Card destra — Come funziona il calcolo:**
Testo fisso che spiega la media mobile + riepilogo numerico (ultimo cambio, durata prevista, giorni trascorsi).

### Tab "Storico cambi"

Tabella con intestazione fissa + righe:
```
div (container border tertiary, border-radius-lg, padding 10px 12px)
  div.mag-log-row (intestazione, font-weight 500, color secondary)
    span.mag-log-row__date       "Data cambio"
    span.mag-log-row__cisterna   "Cisterna"
    span.mag-log-row__durata     "Durata"
    span.mag-log-row__ltgg       "Consumo/gg"
  div.mag-log-row per ogni cambio (dal più recente)
    // cisterna in corso: durata "—", consumo "—"
    // note mostrate come testo secondario nella colonna Cisterna
```

### Tab "Registra cambio"

```
div.mag-form-panel
  div.mag-form-title  "Registra cambio cisterna"
  div.mag-field-row
    div.mag-field  Data cambio — input date, default oggi, required
    div.mag-field  Numero cisterna — input text, opzionale
                   hint: "Solo per tracciabilità"
  div.mag-field  Note — input text, opzionale
  button.mag-btn.mag-btn--primary.mag-btn--full  "Registra cambio cisterna"
```

**Logica submit:**
```typescript
async function handleRegistraCambio() {
  const nuovoCambio: CambioAdBlue = {
    id: generateId(),
    data: formatData(dataCambio),
    numeroCisterna: numeroCisterna.trim() || undefined,
    note: noteAdblue.trim() || undefined
  }
  const nuovaLista = [...cambi, nuovoCambio]
    .sort((a, b) => parseData(a.data) - parseData(b.data))
  await setItemSync('@cisterne_adblue', nuovaLista)
  setCambi(nuovaLista)
  setNotice('Cambio cisterna registrato.')
  resetFormAdblue()
}
```

---

## 7. Stato dati locale — `NextMagazzinoPage`

```typescript
// switcher
const [modulo, setModulo] = useState<'inv' | 'mc' | 'adblue'>('inv')

// inventario
const [items, setItems] = useState<InventarioItem[]>([])
const [fornitori, setFornitori] = useState<string[]>([])
const [searchInv, setSearchInv] = useState('')
const [filterFornitore, setFilterFornitore] = useState('')
const [filterStock, setFilterStock] = useState<'' | 'ok' | 'basso' | 'esaurito'>('')
const [editingItem, setEditingItem] = useState<InventarioItem | null>(null)

// materiali consegnati
const [consegne, setConsegne] = useState<MaterialeConsegnato[]>([])
const [mezzi, setMezzi] = useState<MezzoBasic[]>([])
const [colleghi, setColleghi] = useState<CollegaBasic[]>([])
const [destinatarioObj, setDestinatarioObj] = useState<DestinatarioRef | null>(null)
const [materialeSelezionato, setMaterialeSelezionato] = useState<InventarioItem | null>(null)
const [quantita, setQuantita] = useState<number>(0)
const [motivo, setMotivo] = useState('')
const [dataConsegna, setDataConsegna] = useState<string>(oggi())
const [warningDelete, setWarningDelete] = useState<{ consegna: MaterialeConsegnato, messaggio: string } | null>(null)
const [searchMc, setSearchMc] = useState('')
const [filterTipo, setFilterTipo] = useState('')

// adblue
const [cambi, setCambi] = useState<CambioAdBlue[]>([])
const [dataCambio, setDataCambio] = useState<string>(oggi())
const [numeroCisterna, setNumeroCisterna] = useState('')
const [noteAdblue, setNoteAdblue] = useState('')

// feedback globale
const [notice, setNotice] = useState<string | null>(null)
const [error, setError] = useState<string | null>(null)
const [saving, setSaving] = useState(false)
```

### Caricamento iniziale (unico Promise.all)

```typescript
useEffect(() => {
  Promise.all([
    getItemSync('@inventario'),
    getItemSync('@materialiconsegnati'),
    getItemSync('@mezzi_aziendali'),
    getItemSync('@colleghi'),
    getItemSync('@cisterne_adblue'),
    getDoc(doc(collection(db, 'storage'), '@fornitori'))
  ]).then(([inv, mc, mezziRaw, colleghiRaw, adblue, fornSnap]) => {
    setItems(inv ?? [])
    setConsegne(mc ?? [])
    setMezzi(mezziRaw ?? [])
    setColleghi(colleghiRaw ?? [])
    setCambi(adblue ?? [])
    setFornitori(
      (fornSnap.data()?.value ?? []).map((f: any) => f.nome || f.ragioneSociale)
    )
  })
}, [])
```

---

## 8. Aggiornamenti documentazione obbligatori (AGENTS.md §3)

Al termine Codex deve aggiornare:

1. `docs/STATO_ATTUALE_PROGETTO.md` — aggiungere: modulo Magazzino NEXT ricostruito con UI nativa (3 sezioni), bug fix BUG-01/02/03, nuovo dataset storage-style `@cisterne_adblue`
2. `CONTEXT_CLAUDE.md` — aggiornare stato moduli Inventario e Materiali consegnati, aggiungere Cisterne AdBlue, route `/next/magazzino`
3. `docs/product/STATO_MIGRAZIONE_NEXT.md` — aggiornare voci dei moduli coinvolti

---

## 9. Prompt operativo per Codex

```
Leggi docs/product/SPEC_MAGAZZINO_NEXT.md e implementa il modulo un file alla volta nell'ordine indicato, senza aspettare conferma tra un file e l'altro:

1. src/next/next-magazzino.css
2. src/next/NextMagazzinoPage.tsx
3. src/App.tsx — aggiungi route /next/magazzino → NextMagazzinoPage
4. Aggiorna la documentazione come da sezione 8 della spec

Perimetro: src/next/next-magazzino.css, src/next/NextMagazzinoPage.tsx, src/App.tsx (solo aggiunta route), file documentazione in docs/.
Non modificare src/pages/Inventario.tsx né src/pages/MaterialiConsegnati.tsx.
Non modificare i dataset @inventario e @materialiconsegnati se non tramite persistConsegne e persistInventario già esistenti.
Il nuovo dataset storage-style @cisterne_adblue usa getItemSync/setItemSync come tutti gli altri dataset dello stesso dominio.
```
