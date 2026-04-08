# SPEC_MANUTENZIONI_UI_NEXT.md

Percorso: `docs/product/SPEC_MANUTENZIONI_UI_NEXT.md`

---

## 0. Scopo

Redesign UI del modulo Manutenzioni NEXT (`src/next/NextManutenzioniPage.tsx`).

Problema attuale: la card sinistra fissa (`mx-header-grid` + `ms-layout` a due colonne `1.56fr / 1fr`)
occupa troppo spazio orizzontale e rende il contenuto utile troppo stretto.

Soluzione: eliminare la colonna sinistra fissa e portare le informazioni del mezzo
in un **header compatto** e una **context bar** orizzontale visibile su tutte le tab,
coerenti con lo stile già usato in `next-euromecc.css` e `next-lavori.css`.

Vincoli:
- Nessuna modifica alla logica dati, ai reader/writer, ai domain o alle shape Firestore
- Nessuna modifica a `src/pages/Manutenzioni.css` (file fuori perimetro)
- Nessuna modifica a `NextMappaStoricoPage.tsx` tranne la rimozione del layout
  a due colonne `ms-layout` nella vista embedded dal tab Dettaglio
- CSS dedicato: `src/next/next-manutenzioni.css` con prefisso `man2-`
  (prefisso nuovo per non collidere con classi `man-` e `mx-` già esistenti)
- Stile coerente con `next-euromecc.css` (prefisso `eur-`) e `next-lavori.css` (prefisso `nl-`)

---

## 1. File da modificare / creare

```
src/next/next-manutenzioni.css        CREA — CSS dedicato prefisso man2-
src/next/NextManutenzioniPage.tsx     MODIFICA — sostituisce struttura layout
```

Nessun altro file va toccato.

---

## 2. Struttura generale della pagina

```
div.man2-page
  div.man2-head                        ← header compatto con titolo + controlli mezzo
  div.man2-context-bar                 ← barra informazioni mezzo attivo
  nav.man2-tabs                        ← tab nav
  [contenuto tab attivo]
```

---

## 3. Header — `div.man2-head`

Layout: flex row, `justify-content: space-between`, `align-items: flex-start`,
`margin-bottom: 1rem`.

```
div.man2-head
  div.man2-head__left
    span.man2-eyebrow    "Operatività"
    h1                   "Manutenzioni"
  div.man2-head__right
    select.man2-select-mezzo    ← lista mezzi aziendali
    input.man2-search           ← placeholder "Cerca targa / modello / autista"
```

`man2-head__right`: flex row, gap 6px, align-items center, padding-top 4px.
`man2-select-mezzo`: padding 6px 10px, font-size 13px, border 0.5px secondary,
border-radius-md, min-width 220px.
`man2-search`: padding 6px 10px, font-size 13px, border 0.5px tertiary,
border-radius-md, width 180px.

---

## 4. Context bar — `div.man2-context-bar`

Barra orizzontale con le info del mezzo selezionato.
Sempre visibile su tutte e quattro le tab.

Layout: flex row, `align-items: center`, `gap: 12px`, `flex-wrap: wrap`,
`padding: 8px 12px`, `background: var(--color-background-secondary)`,
`border-radius: var(--border-radius-md)`, `margin-bottom: 1.25rem`.

```
div.man2-context-bar
  div.man2-ctx-item
    span.man2-ctx-label   "Targa"
    span.man2-ctx-value   [targa mezzo]
  div.man2-ctx-divider
  div.man2-ctx-item
    span.man2-ctx-label   "Modello"
    span.man2-ctx-value   [modello mezzo]
  div.man2-ctx-divider
  div.man2-ctx-item
    span.man2-ctx-label   "Autista solito"
    span.man2-ctx-value   [autistaSolito]
  div.man2-ctx-divider
  div.man2-ctx-item
    span.man2-ctx-label   "KM attuali"
    span.man2-ctx-value   [km formattati con separatore migliaia]
  div.man2-ctx-divider
  div.man2-ctx-item
    span.man2-ctx-label   "Ultima manutenzione"
    span.man2-ctx-value   [data ultima manutenzione]
```

`man2-ctx-item`: flex column, gap 1px.
`man2-ctx-label`: font-size 10px, color tertiary, text-transform uppercase, letter-spacing .05em.
`man2-ctx-value`: font-size 13px, font-weight 500, color primary.
`man2-ctx-divider`: width 1px, height 28px, background border-tertiary, flex-shrink 0.

Se nessun mezzo è selezionato, la context bar mostra testo placeholder
"Seleziona un mezzo per vedere le informazioni".

---

## 5. Tab nav — `nav.man2-tabs`

```
nav.man2-tabs
  button.man2-tab [active]   "Dashboard"
  button.man2-tab            "Nuova / Modifica"
  button.man2-tab            "Dettaglio"
  button.man2-tab            "Quadro PDF"
```

`man2-tabs`: flex row, border-bottom 1px tertiary, margin-bottom 1.25rem.
`man2-tab`: padding 7px 16px, font-size 13px, background none, border none,
border-bottom 2px solid transparent, color secondary, cursor pointer, margin-bottom -1px.
`man2-tab.active`: color #166534, border-bottom-color #166534, font-weight 500.

---

## 6. Tab Dashboard

```
div.man2-dash-kpis               ← strip KPI
div.man2-nav-veloce              ← navigazione rapida
div.man2-section-title           "Ultimi interventi"
div.man2-last-list               ← lista ultimi interventi
```

### KPI strip — `div.man2-dash-kpis`

Grid 4 colonne, gap 8px, margin-bottom 1rem.

```
article.man2-kpi x4
  div.man2-kpi__label
  div.man2-kpi__value
  div.man2-kpi__sub
```

Quattro KPI:
1. **Interventi mezzo** — count manutenzioni tipo "mezzo" per targa attiva / sub: "su {targa}"
2. **Interventi compressore** — count tipo "compressore" / sub: "su {targa}"
3. **Ultimo intervento** — data formattata GG/MM / sub: sottotipo ultimo intervento
4. **Segnalazioni aperte** — count segnalazioni aperte / sub: "nessuna" se 0

`man2-kpi`: background secondary, border-radius-md, padding 10px 12px.
`man2-kpi__label`: font-size 11px, color secondary, margin-bottom 2px.
`man2-kpi__value`: font-size 18px, font-weight 500.
`man2-kpi__sub`: font-size 11px, color secondary.

### Navigazione veloce — `div.man2-nav-veloce`

Flex row, gap 6px, flex-wrap wrap, margin-bottom 1rem.

```
button.man2-nav-btn.man2-nav-btn--primary   "+ Nuova manutenzione"  ← switcha tab Nuova
button.man2-nav-btn                          "Dettaglio mezzo"       ← switcha tab Dettaglio
button.man2-nav-btn                          "Quadro PDF"            ← switcha tab Quadro PDF
button.man2-nav-btn                          "Dossier mezzo"         ← apre /next/dossier/{targa}
```

`man2-nav-btn`: padding 6px 14px, font-size 12px, border 0.5px secondary,
border-radius-md, background primary, color primary, cursor pointer.
`man2-nav-btn--primary`: background #166534, border-color #166534, color #fff.

### Lista ultimi interventi

`div.man2-section-title`: font-size 11px, font-weight 500, color secondary,
text-transform uppercase, letter-spacing .05em, margin-bottom 8px.

```
div.man2-last-list
  article.man2-last-item per ogni intervento (max 5, dal più recente)
    div.man2-last-item__row1
      span.man2-last-item__title    [descrizione intervento]
      span.man2-badge.man2-badge--{mezzo|compressore}
    div.man2-last-item__meta        [data · km · sottotipo]
```

`man2-last-list`: flex column, gap 6px.
`man2-last-item`: background primary, border 0.5px tertiary, border-radius-lg,
padding 10px 12px.
`man2-last-item__row1`: flex row, gap 8px, align-items center, margin-bottom 4px.
`man2-last-item__title`: flex 1, font-size 13px, font-weight 500.
`man2-last-item__meta`: font-size 11px, color secondary.

---

## 7. Tab Nuova / Modifica

Un singolo form panel, layout a colonna singola, senza sidebar.

```
div.man2-form-panel
  div.man2-form-title   "Nuova manutenzione" / "Modifica manutenzione"
  [campi form]
  button.man2-btn-full  "Salva manutenzione"
```

`man2-form-panel`: background primary, border 0.5px tertiary, border-radius-lg, padding 14px.
`man2-form-title`: font-size 13px, font-weight 500, padding-bottom 8px,
border-bottom 0.5px tertiary, margin-bottom 12px.

### Campi form in ordine

**Riga 1 — 2 colonne** (`div.man2-field-row`):
- Tipo: select Mezzo / Compressore
- Sottotipo: select Tagliando / Tagliando completo / Gomme / Riparazione / Altro

**Riga 2 — 3 colonne** (`div.man2-field-row3`):
- Data: input date, default oggi
- KM: input number
- Fornitore: input text, placeholder "Es. Officina Rossi"

**Riga 3 — colonna singola**:
- Descrizione / note: textarea rows=3

**Sezione tagliando completo** (visibile solo se sottotipo === "tagliando completo"):
- Mantiene la struttura esistente `mx-tagliando-box` già presente nel file —
  non va ridisegnata, solo inclusa sotto il campo note senza sidebar.

**Sezione materiali** (`mx-material-list`):
- Mantiene la struttura esistente — non va ridisegnata.

**Sezione foto** (4 foto collegate al dettaglio):
- Mantiene la struttura esistente — non va ridisegnata.

**Submit**:
```
button.man2-btn-full   "Salva manutenzione"
```

### Classi campo

```css
.man2-field            /* margin-bottom 10px */
.man2-field__label     /* font-size 11px, color secondary, display block, margin-bottom 3px */
.man2-field__input     /* width 100%, padding 6px 8px, font-size 13px, border 0.5px tertiary, border-radius-md */
/* input, select, textarea dentro man2-field ereditano man2-field__input */
.man2-field-row        /* grid 2 colonne, gap 8px */
.man2-field-row3       /* grid 3 colonne, gap 8px */
.man2-btn-full         /* width 100%, padding 8px, font-size 13px, background #166534,
                          border none, color #fff, border-radius-md, cursor pointer, margin-top 4px */
```

---

## 8. Tab Dettaglio

Questo tab monta `NextMappaStoricoPage` in modalità embedded.

**Modifica richiesta a `NextMappaStoricoPage`**:
Quando il componente è montato in modalità embedded (prop `embedded={true}`),
non usare `ms-layout` a due colonne. Usare invece il layout a colonna singola
descritto qui sotto. La prop `embedded` esiste già nel file (confermato dall'audit).

### Layout embedded (colonna singola)

```
div.man2-det-head               ← banner riepilogo mezzo (sostituisce ms-column--side)
div.man2-viste-tabs             ← tab Fronte / Sinistra / Destra / Retro
div.man2-foto-placeholder       ← area foto / hotspot (full width)
div.man2-section-title          "Storico interventi"
div.man2-storico-list           ← lista interventi (sostituisce ms-column--side storico)
```

### Banner riepilogo mezzo — `div.man2-det-head`

```
div.man2-det-head
  div.man2-det-head__grid         ← grid 4 colonne
    div.man2-det-field
      span.man2-det-field__label  "Ultimo intervento mezzo"
      span.man2-det-field__value  [testo]
    div.man2-det-field
      span.man2-det-field__label  "Ultimo intervento compressore"
      span.man2-det-field__value  [testo]
    div.man2-det-field
      span.man2-det-field__label  "KM attuali"
      span.man2-det-field__value  [km formattati]
    div.man2-det-field
      span.man2-det-field__label  "Ultima manutenzione"
      span.man2-det-field__value  [data]
  div.man2-det-head__actions      ← bottoni azione
    button.man2-btn               "Apri dossier mezzo"  → /next/dossier/{targa}
    button.man2-btn               "Apri quadro PDF"     → switcha tab Quadro PDF
    button.man2-btn               "Modifica ultima manutenzione" → switcha tab Nuova con pre-fill
```

`man2-det-head`: background primary, border 0.5px tertiary, border-radius-lg,
padding 12px 14px, margin-bottom 1rem.
`man2-det-head__grid`: grid 4 colonne, gap 8px.
`man2-det-field__label`: font-size 10px, color tertiary, text-transform uppercase,
letter-spacing .05em.
`man2-det-field__value`: font-size 13px, font-weight 500, color primary.
`man2-det-head__actions`: flex row, gap 6px, margin-top 10px, padding-top 10px,
border-top 0.5px tertiary.

### Tab viste mezzo — `div.man2-viste-tabs`

```
div.man2-viste-tabs
  button.man2-vista-btn [active]   "Fronte"
  button.man2-vista-btn            "Sinistra"
  button.man2-vista-btn            "Destra"
  button.man2-vista-btn            "Retro"
  button.man2-btn [style margin-left auto, font-size 11px]   "Gestisci hotspot"
```

`man2-viste-tabs`: flex row, gap 4px, margin-bottom 1rem.
`man2-vista-btn`: padding 5px 12px, font-size 12px, border 0.5px secondary,
border-radius-md, background primary, color primary, cursor pointer.
`man2-vista-btn.active`: background #166534, border-color #166534, color #fff.

### Area foto / hotspot

Quando non c'è foto caricata:
```
div.man2-foto-placeholder
  [icona SVG immagine]
  "Nessuna foto caricata per questa vista"
```

`man2-foto-placeholder`: background secondary, border 0.5px tertiary,
border-radius-lg, height 200px, display flex, flex-direction column,
align-items center, justify-content center, color tertiary, font-size 13px,
gap 8px, margin-bottom 1rem.

Quando c'è foto caricata: l'area foto mantiene la logica hotspot esistente
di `NextMappaStoricoPage` — non va ridisegnata, solo resa full-width.

### Storico interventi

```
div.man2-section-title   "Storico interventi"
div.man2-storico-list
  article.man2-storico-item per ogni manutenzione (ordine cronologico inverso)
    span.man2-storico-item__date    [data GG/MM/AAAA]
    div.man2-storico-item__body
      div.man2-storico-item__title  [descrizione]
      div.man2-storico-item__meta   [km · sottotipo · dettagli]
    span.man2-badge.man2-badge--{mezzo|compressore}
```

`man2-storico-list`: flex column, gap 6px.
`man2-storico-item`: background primary, border 0.5px tertiary, border-radius-lg,
padding 10px 12px, display flex, align-items center, gap 10px.
`man2-storico-item__date`: font-size 12px, color secondary, min-width 70px, flex-shrink 0.
`man2-storico-item__body`: flex 1.
`man2-storico-item__title`: font-size 13px, font-weight 500.
`man2-storico-item__meta`: font-size 11px, color secondary, margin-top 1px.

---

## 9. Tab Quadro PDF

```
div.man2-form-panel
  div.man2-form-title   "Impostazioni esportazione"
  div.man2-field-row
    div.man2-field   Soggetto — select Mezzo / Compressore
    div.man2-field   Periodo  — select Tutto / Ultimo mese / [mesi disponibili]
  button.man2-btn-full   "Genera PDF quadro manutenzioni"

div.man2-section-title   "Risultati esportabili — {N} soggetti"
div.man2-storico-list
  article.man2-storico-item per ogni mezzo nei risultati
    span.man2-storico-item__date    [targa]
    div.man2-storico-item__body
      div.man2-storico-item__title  [modello · autista solito]
      div.man2-storico-item__meta   [data · tipo · N interventi]
    button.man2-btn [font-size 11px, flex-shrink 0]   "PDF →"
```

Il pulsante "PDF →" su ogni riga esegue l'export PDF individuale per quel mezzo,
usando la logica esistente (`pdfEngine`). Non va modificata la logica, solo il layout.

---

## 10. CSS completo — `next-manutenzioni.css`

```css
/* ── Pagina ─────────────────────────────────────── */
.man2-page { padding: 1rem; }

/* ── Header ─────────────────────────────────────── */
.man2-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
.man2-head__left { display: flex; flex-direction: column; gap: 3px; }
.man2-head__right { display: flex; gap: 6px; align-items: center; padding-top: 4px; }
.man2-eyebrow { font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 3px; }
.man2-head h1 { font-size: 20px; font-weight: 500; color: var(--color-text-primary); }
.man2-select-mezzo { padding: 6px 10px; font-size: 13px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); background: var(--color-background-primary); color: var(--color-text-primary); min-width: 220px; }
.man2-search { padding: 6px 10px; font-size: 13px; border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); background: var(--color-background-primary); color: var(--color-text-primary); width: 180px; }

/* ── Context bar ────────────────────────────────── */
.man2-context-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 8px 12px; background: var(--color-background-secondary); border-radius: var(--border-radius-md); margin-bottom: 1.25rem; }
.man2-ctx-item { display: flex; flex-direction: column; gap: 1px; }
.man2-ctx-label { font-size: 10px; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: .05em; }
.man2-ctx-value { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
.man2-ctx-divider { width: 1px; height: 28px; background: var(--color-border-tertiary); flex-shrink: 0; }

/* ── Tab nav ────────────────────────────────────── */
.man2-tabs { display: flex; border-bottom: 1px solid var(--color-border-tertiary); margin-bottom: 1.25rem; }
.man2-tab { padding: 7px 16px; font-size: 13px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--color-text-secondary); cursor: pointer; margin-bottom: -1px; }
.man2-tab.active { color: #166534; border-bottom-color: #166534; font-weight: 500; }

/* ── KPI ────────────────────────────────────────── */
.man2-dash-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 1rem; }
.man2-kpi { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 10px 12px; }
.man2-kpi__label { font-size: 11px; color: var(--color-text-secondary); margin-bottom: 2px; }
.man2-kpi__value { font-size: 18px; font-weight: 500; color: var(--color-text-primary); }
.man2-kpi__sub { font-size: 11px; color: var(--color-text-secondary); }

/* ── Navigazione veloce ─────────────────────────── */
.man2-nav-veloce { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 1rem; }
.man2-nav-btn { padding: 6px 14px; font-size: 12px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); background: var(--color-background-primary); color: var(--color-text-primary); cursor: pointer; }
.man2-nav-btn--primary { background: #166534; border-color: #166534; color: #fff; }

/* ── Section title ──────────────────────────────── */
.man2-section-title { font-size: 11px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 8px; }

/* ── Lista interventi (dashboard + dettaglio + pdf) */
.man2-last-list,
.man2-storico-list { display: flex; flex-direction: column; gap: 6px; }
.man2-last-item,
.man2-storico-item { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 10px 12px; }
.man2-last-item__row1 { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.man2-last-item__title { flex: 1; font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
.man2-last-item__meta { font-size: 11px; color: var(--color-text-secondary); }
.man2-storico-item { display: flex; align-items: center; gap: 10px; }
.man2-storico-item__date { font-size: 12px; color: var(--color-text-secondary); min-width: 70px; flex-shrink: 0; }
.man2-storico-item__body { flex: 1; }
.man2-storico-item__title { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
.man2-storico-item__meta { font-size: 11px; color: var(--color-text-secondary); margin-top: 1px; }

/* ── Badge ──────────────────────────────────────── */
.man2-badge { font-size: 11px; padding: 2px 7px; border-radius: 100px; font-weight: 500; flex-shrink: 0; }
.man2-badge--mezzo { background: #dbeafe; color: #1e40af; }
.man2-badge--compressore { background: #ede9fe; color: #5b21b6; }

/* ── Form ───────────────────────────────────────── */
.man2-form-panel { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 14px; margin-bottom: 1rem; }
.man2-form-title { font-size: 13px; font-weight: 500; color: var(--color-text-primary); padding-bottom: 8px; border-bottom: 0.5px solid var(--color-border-tertiary); margin-bottom: 12px; }
.man2-field { margin-bottom: 10px; }
.man2-field__label { font-size: 11px; color: var(--color-text-secondary); display: block; margin-bottom: 3px; }
.man2-field input,
.man2-field select,
.man2-field textarea { width: 100%; padding: 6px 8px; font-size: 13px; border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-md); background: var(--color-background-primary); color: var(--color-text-primary); }
.man2-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.man2-field-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.man2-btn-full { width: 100%; padding: 8px; font-size: 13px; background: #166534; border: none; color: #fff; border-radius: var(--border-radius-md); cursor: pointer; margin-top: 4px; }

/* ── Bottoni generici ───────────────────────────── */
.man2-btn { padding: 5px 12px; font-size: 12px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); background: var(--color-background-primary); color: var(--color-text-primary); cursor: pointer; }
.man2-btn--primary { background: #166534; border-color: #166534; color: #fff; }

/* ── Dettaglio — banner riepilogo mezzo ─────────── */
.man2-det-head { background: var(--color-background-primary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 12px 14px; margin-bottom: 1rem; }
.man2-det-head__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.man2-det-field { display: flex; flex-direction: column; gap: 2px; }
.man2-det-field__label { font-size: 10px; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: .05em; }
.man2-det-field__value { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
.man2-det-head__actions { display: flex; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 0.5px solid var(--color-border-tertiary); }

/* ── Dettaglio — viste mezzo ────────────────────── */
.man2-viste-tabs { display: flex; gap: 4px; margin-bottom: 1rem; }
.man2-vista-btn { padding: 5px 12px; font-size: 12px; border: 0.5px solid var(--color-border-secondary); border-radius: var(--border-radius-md); background: var(--color-background-primary); color: var(--color-text-primary); cursor: pointer; }
.man2-vista-btn.active { background: #166534; border-color: #166534; color: #fff; }

/* ── Dettaglio — foto placeholder ──────────────── */
.man2-foto-placeholder { background: var(--color-background-secondary); border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--color-text-tertiary); font-size: 13px; gap: 8px; margin-bottom: 1rem; }

/* ── Responsive — su schermi stretti ───────────── */
@media (max-width: 600px) {
  .man2-dash-kpis { grid-template-columns: repeat(2, 1fr); }
  .man2-det-head__grid { grid-template-columns: repeat(2, 1fr); }
  .man2-field-row3 { grid-template-columns: 1fr 1fr; }
  .man2-head { flex-direction: column; gap: 10px; }
  .man2-head__right { flex-wrap: wrap; }
  .man2-select-mezzo { min-width: unset; width: 100%; }
  .man2-search { width: 100%; }
}
```

---

## 11. Cosa NON cambia

- Logica `readPageData()` e tutti i reader domain — invariati
- Writer `saveNextManutenzioneBusinessRecord()` / `deleteNextManutenzioneBusinessRecord()` — invariati
- Shape Firestore di `@manutenzioni`, `@inventario`, `@materialiconsegnati` — invariate
- Sezione tagliando completo (`mx-tagliando-box`) — invariata, solo inclusa nel form senza sidebar
- Sezione materiali (`mx-material-list`) — invariata
- Sezione 4 foto nel form — invariata
- Logica hotspot e upload foto in `NextMappaStoricoPage` — invariata
- Export PDF (`pdfEngine`) — invariato
- `src/pages/Manutenzioni.css` — non va toccato

---

## 12. Aggiornamenti documentazione obbligatori (AGENTS.md §3)

Al termine Codex deve aggiornare:

1. `docs/STATO_ATTUALE_PROGETTO.md` — aggiungere: modulo Manutenzioni NEXT redesign UI, rimossa sidebar fissa, introdotto header compatto + context bar + layout colonna singola
2. `CONTEXT_CLAUDE.md` — aggiornare nota sul modulo Manutenzioni NEXT

---

## 13. Prompt operativo per Codex

```
Leggi docs/product/SPEC_MANUTENZIONI_UI_NEXT.md e applica le modifiche UI un file alla volta nell'ordine indicato, senza aspettare conferma tra un file e l'altro:

1. Crea src/next/next-manutenzioni.css con il CSS esatto descritto nella sezione 10 della spec
2. Modifica src/next/NextManutenzioniPage.tsx:
   - Sostituisci la struttura layout esistente (man-card-header, mx-header-grid, colonna sinistra) con man2-head + man2-context-bar + man2-tabs come da sezioni 3, 4, 5 della spec
   - Ridisegna il tab Dashboard come da sezione 6
   - Ridisegna il tab Nuova/Modifica come da sezione 7 mantenendo invariata la logica tagliando, materiali e foto
   - Ridisegna il tab Dettaglio come da sezione 8: aggiungi prop embedded check su NextMappaStoricoPage per usare layout colonna singola con man2-det-head, man2-viste-tabs, man2-foto-placeholder, man2-storico-list
   - Ridisegna il tab Quadro PDF come da sezione 9 mantenendo invariata la logica export PDF
   - Importa next-manutenzioni.css invece di (o in aggiunta a) next-mappa-storico.css
3. Aggiorna la documentazione come da sezione 12 della spec

Perimetro: src/next/next-manutenzioni.css, src/next/NextManutenzioniPage.tsx, file documentazione in docs/.
Non modificare logica dati, reader, writer, domain, shape Firestore, pdfEngine.
Non modificare src/pages/Manutenzioni.css.
Non modificare NextMappaStoricoPage.tsx tranne aggiungere il check sulla prop embedded per il layout colonna singola.
```
