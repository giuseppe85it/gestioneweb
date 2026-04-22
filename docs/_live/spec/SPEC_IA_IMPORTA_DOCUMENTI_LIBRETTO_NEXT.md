# SPEC_IA_IMPORTA_DOCUMENTI_LIBRETTO_NEXT.md

**Modulo:** IA Interna NEXT — Schermata "Importa documenti" — Sottotipo Libretto  
**Route:** `/next/ia/interna`  
**File target:** `src/next/NextInternalAiPage.tsx` + `src/next/internal-ai/internal-ai.css`  
**CSS prefix:** `iai-`  
**Stato:** APPROVATA VISIVAMENTE — sessione 2026-04-16  
**Fonte di verità:** mockup interattivi approvati in sessione Claude  

---

## 0. Regole generali

- Questa spec descrive SOLO il layer visivo (JSX + CSS).
- Nessuna modifica a writer, barrier, motore documentale, router IA, hooks esistenti.
- Tutti i dati mostrati provengono dallo state già presente nel componente.
- CSS prefix obbligatorio: `iai-` su tutte le classi nuove.
- No Tailwind. No classi globali senza prefix.
- Font: `DM Sans`, `Segoe UI`, `system-ui` — sans-serif.

---

## 1. Struttura globale della pagina

Layout verticale a stack — nessuna colonna:

```
TOPBAR
HERO
CONTENT (flex column, gap 14px, padding 16px 24px)
  ├── Card: Destinazione rilevata
  ├── Card: Sottotipo documento
  ├── Card: Carica documento
  ├── Banner: Avvisi e campi mancanti  ← condizionale
  ├── Viewer documento originale       ← full width, sopra
  ├── Libretto estratto                ← full width, sotto
  ├── Grid: Collegamento mezzo + Controllo duplicati
  └── Barra: Conferma / Scarta
```

---

## 2. Topbar

```
background: #ffffff
border-bottom: 0.5px solid rgba(0,0,0,.12)
padding: 10px 24px
layout: flex, justify-content space-between, align-items center
```

| Elemento | Specifiche |
|---|---|
| Label sinistra | "IA 2" — 11px, font-weight 600, uppercase, color #888780 |
| Bottone destra | "Vai a storico →" — 12px, border 0.5px solid rgba(0,0,0,.22), border-radius 6px, background #fff, color #5f5e5a |

---

## 3. Hero

```
background: #ffffff
border-bottom: 0.5px solid rgba(0,0,0,.12)
padding: 22px 24px 16px
```

- H1: "Importa documenti" — font-size 24px, font-weight 600, color #1a1a18
- **Nessun sottotitolo.**

---

## 4. Card base (riutilizzata in tutta la pagina)

```
background: #ffffff
border: 0.5px solid rgba(0,0,0,.12)
border-radius: 10px
padding: 16px 20px
```

Label sezione standard:
```
font-size: 10px
font-weight: 700
letter-spacing: .08em
text-transform: uppercase
color: #888780
margin-bottom: 8px
```

---

## 5. Card: Destinazione rilevata

- Label: "DESTINAZIONE RILEVATA"
- Badge verde: `Documento mezzo → Libretto`
- Bottone dropdown: "Destinazione errata? Cambia ▾"

**Badge verde:**
```
display: inline-flex
align-items: center
gap: 8px
background: #f0faf4
border: 1.5px solid #2d8a4e
border-radius: 8px
padding: 9px 16px
```
- Pallino: 8px, border-radius 50%, background #2d8a4e
- Testo tipo + "→" + testo contesto: font-size 14px, font-weight 600, color #1e6e3c

**Dropdown destinazioni alternative** (aperto dal bottone "Cambia"):
```
position: absolute
top: calc(100% + 4px)
left: 0
background: #ffffff
border: 0.5px solid rgba(0,0,0,.18)
border-radius: 8px
z-index: 20
min-width: 220px
overflow: hidden
```
Voci: ogni voce padding 9px 14px, font-size 13px, border-bottom 0.5px, hover #f5f4f0.

Voci disponibili:
- Fattura / DDT → Magazzino
- Fattura / DDT → Manutenzione
- Preventivo → Magazzino
- Documento mezzo → Manutenzione
- Documento mezzo → Archivio mezzo

---

## 6. Card: Sottotipo documento

- Label: "SOTTOTIPO DOCUMENTO"
- Mostra **solo il tab Libretto** — gli altri sottotipi (Assicurazione, Revisione, Collaudo) non compaiono nell'UI principale.

**Tab Libretto attivo:**
```
display: inline-flex
align-items: center
gap: 8px
background: #f0faf4
border: 1.5px solid #2d8a4e
border-radius: 8px
padding: 9px 18px
```
- Pallino: 7px, border-radius 50%, background #2d8a4e
- Testo "Libretto": font-size 14px, font-weight 600, color #1e6e3c
- Sottotesto "Dati veicolo, telaio e immatricolazione.": font-size 11px, color #3b6d11

---

## 7. Card: Carica documento

- Label: "CARICA DOCUMENTO"
- Testo hint: "PDF, foto e scansioni. Prima scegli il sottotipo, poi analizza il documento." — 11px, color #888780

Riga inferiore (flex, space-between):
- **Sinistra:** chip file caricato
- **Destra:** testo nota + bottone "Analizza documento"

**Chip file:**
```
display: inline-flex
align-items: center
gap: 6px
background: #f5f4f0
border: 0.5px solid rgba(0,0,0,.12)
border-radius: 6px
padding: 5px 10px
font-size: 12px
```
Contiene: icona file SVG + nome file + badge tipo.

Badge tipo (es. "Immagine pronta"):
```
background: #e6f1fb
color: #185fa5
border-radius: 4px
padding: 2px 7px
font-size: 10px
font-weight: 500
```

**Testo nota accanto al bottone:**
"Nessun salvataggio parte da solo: prima review, poi conferma." — 11px, #888780, max-width 260px.

**Bottone "Analizza documento":**
```
background: #185fa5
color: #ffffff
font-size: 13px
font-weight: 600
padding: 8px 20px
border: none
border-radius: 8px
```
Disabled: background rgba(0,0,0,.15), color #888780.

---

## 8. Banner: Avvisi e campi mancanti

**Posizione:** full width, tra la card "Carica documento" e il viewer. Visibile solo se ci sono avvisi reali.

```
background: #faeeda
border: 0.5px solid #ef9f27
border-radius: 8px
padding: 10px 16px
layout: flex, align-items flex-start, gap 10px
```

- Icona "!": cerchio border 1.5px solid #854f0b, 18×18px, font-size 12px, font-weight 700, color #854f0b
- Label: "AVVISI E CAMPI MANCANTI" — 10px, uppercase, #854f0b
- Lista avvisi: font-size 12px, color #633806, line-height 1.5, ogni voce con "•" prefisso

---

## 9. Viewer documento originale

**Full width, sopra il libretto estratto.**

```
border-radius: 10px
overflow: hidden
border: 0.5px solid rgba(0,0,0,.18)
```

**Toolbar:**
```
background: #2c2c2a
padding: 9px 14px
layout: flex, align-items center, gap 6px
```
- Nome file: font-size 12px, color #d3d1c7, margin-right auto, overflow ellipsis
- Bottoni "Zoom +", "Zoom −", "Ruota":
  ```
  font-size: 10px
  padding: 3px 9px
  border: 0.5px solid #5f5e5a
  border-radius: 5px
  background: transparent
  color: #b4b2a9
  ```
  Hover: background #444441.

**Body viewer:**
```
background: #3a3a38
height: 300px
display: flex
align-items: center
justify-content: center
padding: 16px
```

Immagine presente: `<img>` con border-radius 3px, box-shadow `0 2px 14px rgba(0,0,0,.3)`, max-height 268px, object-fit contain.  
Placeholder: rettangolo bianco con icona documento SVG + nome file + "Documento caricato".

---

## 10. Libretto estratto: Fahrzeugausweis

**Full width, sotto il viewer.** Riproduce fedelmente la struttura fisica del libretto svizzero (Fahrzeugausweis TI) con tutti i campi editabili.

```
background: #ffffff
border: 0.5px solid rgba(0,0,0,.12)
border-radius: 10px
overflow: hidden
```

### 10.1 Header banner

```
background: #1a3a5c
padding: 10px 16px
layout: flex, justify-content space-between, align-items center
```
- Titolo: "Fahrzeugausweis / Libretto di circolazione" — 12px, font-weight 700, #fff, uppercase
- Sottotitolo: "Campi estratti — tutti editabili" — 10px, color #85b7eb

---

### 10.2 Stile condiviso input campi

```
width: 100%
border: none
border-bottom: 1px solid rgba(0,0,0,.12)
background: transparent
font-size: 12px
font-weight: 500
color: #1a1a18
outline: none
font-family: inherit
padding: 2px 0 3px
transition: border-color .15s
```

Focus:
```
border-bottom-color: #185fa5
background: #f5f9ff
padding: 2px 4px 3px
border-radius: 2px 2px 0 0
```

Placeholder: color #d3d1c7, font-weight 400, font-size 11px.

Varianti:
- `--bold`: font-size 13px, font-weight 700
- `--mono`: font-family 'Courier New', monospace, letter-spacing .04em, font-size 11px
- `--date`: font-family 'Courier New', monospace, font-size 11px
- `--red`: color #a32d2d, font-weight 600

Codice campo (label sopra ogni input):
```
font-size: 7px
font-weight: 700
letter-spacing: .08em
text-transform: uppercase
color: #b4b2a9
margin-bottom: 2px
```

Celle interne del libretto:
```
padding: 8px 12px
border-right: 0.5px solid rgba(0,0,0,.06)
```
Ultima cella della riga: border-right none.  
Righe: border-bottom 0.5px solid rgba(0,0,0,.06). Ultima riga: none.

---

### 10.3 Sezione 1 — Targa + Tipo veicolo

Grid: `180px | 1fr`.  
Border-bottom: 1.5px solid #d3d1c7.

**Cella sinistra — Targa:**
- Codice campo: "A 15 — Targa / Plaque / Schild"
- Targa in formato fisico UE:
  ```
  border: 2px solid #1a1a18
  border-radius: 4px
  overflow: hidden
  height: 34px
  display: flex
  margin-top: 4px
  ```
  - Fascia sinistra UE: background #1a3a5c, width 22px, stelle ★ (font-size 7px, color #f5c400) + "I" (font-size 8px, font-weight 700, color #fff)
  - Input targa: font-size 17px, font-weight 700, font-family 'Courier New', monospace, letter-spacing .08em, uppercase, border none, background transparent, outline none, width 140px

**Cella destra — Tipo veicolo:**
- Codice "19 — Genere del veicolo / Genre du véhicule / Art des Fahrzeugs" + input --bold
- Codice "D — Marca e tipo / Marque et type" + input standard

---

### 10.4 Sezione 2 — Detentore (C)

Badge "C" in alto a destra (font-size 11px, font-weight 700, color #888780, padding 6px 12px 0).  
Label sezione: "Détenteur / Halter / Detentore / Possesseur" — codice campo.

Righe:
1. `[1fr]` — Cognome/nome/ragione sociale — input --bold
2. `[1fr | 1fr | 1fr]` — Comune + Indirizzo + N° AVS/AHV (--mono)
3. `[1fr | 1fr]` — Stato d'origine + Assicurazione/Versicherung

---

### 10.5 Sezione 3 — Telaio e identificazione (E)

Righe:
1. `[1fr | 1fr]` — N° telaio --mono + N° approvazione tipo --mono
2. `[1fr | 1fr | 1fr]` — Carrozzeria + Colore + N. matricola tipo --mono

---

### 10.6 Sezione 4 — Dati tecnici

Titolo sezione: "Dati tecnici / Technische Daten" — 8px, uppercase, #888780.

Riga: `[1fr | 1fr | 1fr | 1fr]`
- 76 — Potenza / Puissance (kW) — --mono
- 37 — Cilindrata / Cylindrée (cm³) — --mono
- 17 — Uso speciale / Usage spécial
- 27 — Peso a vuoto anteriore (kg) — --mono

---

### 10.7 Sezione 5 — Pesi (G)

```
background: #f8f8f6
```
Titolo: "G — Pesi / Poids / Gewichte (kg)" — 8px, uppercase, #888780.

Grid 3 colonne, 2 righe (6 campi):

| Campo | Descrizione |
|---|---|
| 30 | Peso a vuoto |
| 32 | Nutz-/Sattellast |
| 33 | Peso totale |
| 35 | Peso tot. rimorchio |
| 55 | Carico sul letto |
| 31 | Peso rimorchiabile |

Tutti input --mono.  
Celle 4-5-6 (seconda riga): border-top 0.5px solid rgba(0,0,0,.06).

---

### 10.8 Sezione 6 — Esami e scadenze (B38)

```
background: #f8f8f6
border-top: 1.5px solid #d3d1c7
display: grid
grid-template-columns: 1fr 1fr
```

**Colonna sinistra — "B38 Esami / Prüfungen":**
- Luogo / Ort
- 1ª messa in circolazione (--date)
- Immatricolato (--date)

**Colonna destra — "Scadenza / Ablauf":**
- Scadenza revisione: input --red --date + badge warning se scaduta
- Codice emissioni: input --mono

**Badge scadenza:**
```
background: #faeeda
border-radius: 3px
padding: 1px 6px
font-size: 9px
color: #633806
font-weight: 600
margin-left: 4px
testo: "⚠ Scaduta"
```

```
background: #eaf3de
color: #27500a
testo: "✓ Registrato"
```

---

## 11. Grid: Collegamento mezzo + Controllo duplicati

```
display: grid
grid-template-columns: 1fr 1fr
gap: 14px
```

### 11.1 Card: Collegamento al mezzo

**Toggle modo:**
```
display: flex
border: 0.5px solid rgba(0,0,0,.18)
border-radius: 7px
overflow: hidden
margin-bottom: 14px
```
Due pulsanti affiancati (flex:1 ciascuno):
- "Collega a mezzo esistente"
- "+ Crea nuovo mezzo"

Pulsante attivo: background #185fa5, color #fff.  
Pulsante inattivo: background #fff, color #888780.  
Separatore tra i due: border-right 0.5px solid rgba(0,0,0,.12).

---

**Pannello A — Mezzo esistente:**
- Label "Seleziona il mezzo" (11px, #888780)
- `<select>` full width: border 0.5px solid rgba(0,0,0,.22), border-radius 6px, padding 8px 10px
- Divider
- Checkbox "Aggiorna anche i campi del mezzo dopo l'archiviazione" (font-size 12px)

---

**Pannello B — Nuovo mezzo** (visibile quando toggle su "+ Crea nuovo mezzo"):

Banner prefill:
```
background: #f0faf4
border: 0.5px solid #2d8a4e
border-radius: 7px
padding: 9px 12px
display: flex
gap: 8px
```
- Pallino verde 7px
- Testo: "I campi sono già compilati con i dati letti dal libretto. **Controlla e correggi** prima di salvare." — 11px, color #1e6e3c

Campi del nuovo mezzo (tutti input con border 0.5px, border-radius 6px, padding 7px 10px):

| Campo | Layout | Note |
|---|---|---|
| Targa | full width | monospace, uppercase |
| Marca + Modello/Tipo | grid 2 colonne | |
| Genere del veicolo | full width | |
| N° telaio | full width | monospace |
| Intestatario + Colore | grid 2 colonne | |
| Prima immatricolazione + Scadenza revisione | grid 2 colonne | date monospace; scadenza in #a32d2d se scaduta |

Tutti i campi pre-compilati dai dati estratti del libretto.

Checkbox finale:
```
display: flex
align-items: flex-start
gap: 8px
font-size: 12px
```
Testo: "Salva il nuovo mezzo in anagrafica al momento dell'archiviazione" — checked di default.

---

### 11.2 Card: Controllo duplicati

- Label: "CONTROLLO DUPLICATI"
- Titolo: "Archivio Documento mezzo" (13px, font-weight 600)
- Testo: "Se il match è forte, Archivista ti chiede una scelta secca e non carica da solo." (11px, #888780)
- Bottone "Controlla duplicati" (stile secondario, margin-bottom 12px)
- Box risultato:
  ```
  background: #f5f4f0
  border-radius: 7px
  padding: 10px 12px
  ```
  Stato iniziale:
  - Titolo: "Controllo non ancora eseguito" (12px, font-weight 600)
  - Testo: "Prima della conferma puoi verificare se esiste già un documento simile in archivio." (11px, #888780)

---

## 12. Barra: Conferma / Scarta

```
display: flex
align-items: center
gap: 12px
flex-wrap: wrap
padding: 14px 20px
background: #ffffff
border: 0.5px solid rgba(0,0,0,.12)
border-radius: 10px
```

| Elemento | Specifiche |
|---|---|
| Testo (flex:1) | Titolo "Conferma archiviazione" (13px, font-weight 600) + sottotesto "Il documento verrà archiviato. L'update del mezzo solo se spuntato sopra." (11px, #888780) |
| Bottone "Scarta documento" | padding 9px 18px, stile secondario |
| Bottone "Conferma e archivia →" | background #2d8a4e, color #fff, font-weight 600, padding 9px 22px, border-radius 8px |

Dopo click conferma: testo → "✓ Archiviato", background → #3b6d11, disabled true.

---

## 13. Responsive (sotto 720px)

| Elemento | Comportamento |
|---|---|
| Grid collegamento/duplicati | grid-template-columns: 1fr (impilati) |
| Grid 2 colonne nel libretto | grid-template-columns: 1fr |
| Grid pesi 3 colonne | grid-template-columns: 1fr 1fr |
| Barra conferma | flex-direction column, bottoni width 100% |

---

## 14. Cosa NON cambia

- Nessuna modifica a `src/next/internal-ai/*.ts`
- Nessuna modifica a `src/utils/cloneWriteBarrier.ts`
- Nessuna modifica a `src/App.tsx`
- Nessuna modifica a `src/pages/*`
- Nessun writer business nuovo
- Nessun router, hook, motore documentale, backend

---

## 15. Aggiornamenti documentazione obbligatori (AGENTS.md §3)

Dopo implementazione aggiornare:
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`

---

## 16. Build e verifica obbligatoria

```bash
npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css
npm run build
```

Checklist runtime su `http://localhost:5173/next/ia/interna`:

- [ ] Topbar con label "IA 2" e bottone "Vai a storico"
- [ ] H1 "Importa documenti" senza sottotitolo
- [ ] Badge verde "Documento mezzo → Libretto"
- [ ] Dropdown destinazioni apre e cambia badge
- [ ] Tab solo "Libretto" visibile
- [ ] Chip file e bottone "Analizza documento"
- [ ] Banner avvisi visibile solo se ci sono avvisi
- [ ] Viewer documento full width sopra con toolbar scura
- [ ] Libretto estratto full width sotto con header blu scuro
- [ ] Targa in formato fisico UE editabile
- [ ] Tutti i campi del libretto editabili (genere, marca, detentore, telaio, dati tecnici, pesi, scadenze)
- [ ] Scadenza revisione in rosso con badge "⚠ Scaduta"
- [ ] Toggle collegamento mezzo: "Collega esistente" / "+ Crea nuovo mezzo"
- [ ] Pannello nuovo mezzo con prefill dai dati estratti
- [ ] Checkbox "Salva nuovo mezzo" checked di default
- [ ] Bottone "Controlla duplicati" funzionante
- [ ] Barra conferma con "Scarta" e "Conferma e archivia →"
- [ ] Click conferma → "✓ Archiviato", disabled
- [ ] Nessun errore console legato a questa patch
