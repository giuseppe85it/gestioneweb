# SPEC TECNICA — Modulo Impianto Euromecc in /next

**Obiettivo**: Creare un modulo nativo nuovo nella shell `/next` per la gestione della manutenzione dell'impianto Euromecc. NON è un clone della madre — è un modulo completamente nuovo con scrittura reale su Firestore.

**Rischio**: ELEVATO (nuovo modulo con scritture Firestore, nuove collection, nuova route)

**Letture obbligatorie prima di agire** (come da AGENTS.md):
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/data/DOMINI_DATI_CANONICI.md`

---

## 1. FILE DA CREARE

```
src/next/domain/nextEuromeccDomain.ts        ← tipi + reader + writer Firestore
src/next/euromeccAreas.ts                    ← dati statici impianto (no Firestore)
src/next/NextEuromeccPage.tsx                ← pagina principale con le 4 tab
src/next/next-euromecc.css                   ← stili scoped del modulo
```

**File da modificare**:
```
src/App.tsx                                  ← aggiungere route /next/euromecc
docs/product/STATO_MIGRAZIONE_NEXT.md        ← registrare nuovo modulo
docs/product/REGISTRO_MODIFICHE_CLONE.md     ← voce obbligatoria
```

**Change report e continuity report obbligatori** sotto `docs/change-reports/` e `docs/continuity-reports/`.

---

## 2. COLLECTIONS FIRESTORE (nuove, non toccano la madre)

```
storage/@euromecc_manutenzioni_pending   ← attività di manutenzione da fare
storage/@euromecc_manutenzioni_done      ← manutenzioni eseguite
storage/@euromecc_problemi               ← segnalazioni / anomalie
```

Seguono il pattern `storage/<key>` già usato nel progetto.

---

## 3. TIPI TYPESCRIPT — `nextEuromeccDomain.ts`

```typescript
export type EuromeccStatus = 'ok' | 'check' | 'maint' | 'issue' | 'done' | 'obs';
export type EuromeccPriority = 'alta' | 'media' | 'bassa';
export type EuromeccIssueType = 'criticita' | 'anomalia' | 'osservazione';
export type EuromeccIssueState = 'aperta' | 'chiusa';

export interface EuromeccPendingTask {
  id: string;
  areaKey: string;       // es. 'silo1', 'carico1', 'compressore'
  subKey: string;        // es. 'filtro', 'coclea', 'proboscide'
  title: string;
  priority: EuromeccPriority;
  dueDate: string;       // yyyy-mm-dd
  note: string;
  createdAt: string;     // yyyy-mm-dd
}

export interface EuromeccDoneTask {
  id: string;
  areaKey: string;
  subKey: string;
  title: string;
  doneDate: string;      // yyyy-mm-dd
  by: string;            // nome operatore
  note: string;
  nextDate: string;      // yyyy-mm-dd prossima scadenza
  closedPending: boolean;
  createdAt: string;
}

export interface EuromeccIssue {
  id: string;
  areaKey: string;
  subKey: string;
  title: string;
  check: string;         // azione suggerita / cosa controllare
  priority: EuromeccIssueType;
  state: EuromeccIssueState;
  reportedAt: string;    // yyyy-mm-dd
  reportedBy: string;
  note: string;
  closedAt?: string;     // yyyy-mm-dd
  createdAt: string;
}

export interface EuromeccSnapshot {
  pending: EuromeccPendingTask[];
  done: EuromeccDoneTask[];
  issues: EuromeccIssue[];
  loadedAt: string;
}
```

---

## 4. READER FIRESTORE — `nextEuromeccDomain.ts`

```typescript
// Legge tutte e tre le collection in parallelo
export async function readEuromeccSnapshot(): Promise<EuromeccSnapshot>

// Conversione Timestamp Firestore → stringa yyyy-mm-dd
// Ordinamento: pending per createdAt asc, done per doneDate desc, issues per createdAt desc
```

---

## 5. WRITER FIRESTORE — `nextEuromeccDomain.ts`

```typescript
// Aggiunge attività da fare
export async function addEuromeccPendingTask(
  payload: Omit<EuromeccPendingTask, 'id' | 'createdAt'>
): Promise<string>

// Elimina attività da fare (per id)
export async function deleteEuromeccPendingTask(id: string): Promise<void>

// Chiude tutte le pending di una specifica area+componente
export async function closeEuromeccPendingByAreaSub(
  areaKey: string, subKey: string
): Promise<void>

// Registra manutenzione fatta + eventuale chiusura pending
export async function addEuromeccDoneTask(
  payload: Omit<EuromeccDoneTask, 'id' | 'createdAt'>,
  closePending: boolean
): Promise<string>

// Aggiunge problema segnalato (state iniziale: 'aperta')
export async function addEuromeccIssue(
  payload: Omit<EuromeccIssue, 'id' | 'createdAt' | 'state' | 'closedAt'>
): Promise<string>

// Chiude un problema (state: 'chiusa', closedAt: oggi)
export async function closeEuromeccIssue(id: string): Promise<void>
```

---

## 6. HELPER STATUS — `nextEuromeccDomain.ts`

```typescript
// Calcola lo stato di un componente basandosi sullo snapshot
export function getSubStatus(
  areaKey: string, subKey: string,
  base: EuromeccStatus, snapshot: EuromeccSnapshot
): EuromeccStatus
// Logica priorità:
// 1. se esiste pending → 'maint' (rosso)
// 2. se esiste issue aperta non-osservazione → 'issue' (arancio)
// 3. se esiste issue osservazione → 'obs' (viola)
// 4. se manutenzione fatta entro 30 giorni → 'done' (blu)
// 5. se base === 'check' → 'check' (giallo)
// 6. altrimenti → 'ok' (verde)

// Calcola lo stato complessivo di un'area (usa getSubStatus su tutti i componenti)
export function getAreaStatus(
  areaKey: string,
  components: Array<{ key: string; base: EuromeccStatus }>,
  snapshot: EuromeccSnapshot
): EuromeccStatus

// Quanti giorni fa rispetto a oggi
export function daysAgo(dateStr: string): number

// True se dateStr è entro il range (30 / 60 / 90 / 'all' giorni)
export function withinRange(dateStr: string, range: string): boolean
```

---

## 7. DATI STATICI IMPIANTO — `euromeccAreas.ts`

Questo file contiene la definizione dell'impianto fisico. Non viene mai scritto su Firestore.

```typescript
export interface EuromeccComponent {
  key: string;        // identificativo componente es. 'filtro', 'coclea'
  name: string;       // nome leggibile es. 'Filtro silo'
  code: string;       // codice tecnico es. 'FIL-SIL-01'
  base: EuromeccStatus;
  last: string;       // ultima manutenzione di default (dd/mm/yyyy)
  next: string;       // prossima manutenzione di default (dd/mm/yyyy)
}

export interface EuromeccArea {
  title: string;
  type: 'silo' | 'generic';
  code: string;
  area: string;
  base: EuromeccStatus;
  last: string;
  next: string;
  components: EuromeccComponent[];
}

export const EUROMECC_AREAS: Record<string, EuromeccArea>
```

### Aree da definire in EUROMECC_AREAS:

**Sili** (type: 'silo') — generati con helper `makeSilo(label, base, last, next)`:
Ogni silo ha questi 8 componenti fissi:
- `filtro` → Filtro silo
- `livMax` → Livello alto
- `livMin` → Livello basso
- `fluid` → Fluidificanti
- `scarico` → Scarico / valvola
- `coclea` → Coclea linea
- `motore` → Motore linea
- `ingrasso` → Ingrassaggi

| chiave   | label | base    | last       | next       |
|----------|-------|---------|------------|------------|
| silo1    | 01    | ok      | 12/02/2026 | 30/04/2026 |
| silo2a   | 02A   | check   | 08/01/2026 | 10/04/2026 |
| silo2b   | 02B   | ok      | 10/02/2026 | 20/04/2026 |
| silo3    | 03    | ok      | 14/03/2026 | 14/06/2026 |
| silo4    | 04    | check   | 20/12/2025 | 05/04/2026 |
| silo5    | 05    | ok      | 19/02/2026 | 19/05/2026 |
| silo6a   | 06A   | check   | 12/02/2026 | 01/04/2026 |
| silo6b   | 06B   | check   | 18/02/2026 | 08/04/2026 |
| silo7    | 07    | ok      | 25/03/2026 | 25/06/2026 |

**Aree generiche** (type: 'generic'):

| chiave        | title                   | code         | area               | componenti principali                                       |
|---------------|-------------------------|--------------|--------------------|-------------------------------------------------------------|
| filtriSilo    | Filtri silo             | FIL-SIL      | Copertura sili     | set → Filtri silo                                           |
| lineeSilo     | Linee scarico silo      | LIN-SIL      | Trasporto materiale| coclee, motori, ingrassi                                    |
| carico1       | Carico camion 1         | CAR-CAM-01   | Area spedizione    | proboscide, filtro, sensori                                 |
| carico2       | Carico camion 2         | CAR-CAM-02   | Area spedizione    | proboscide, filtro, sensori                                 |
| caricoRail    | Carico ferrovia         | CAR-RAIL-01  | Area ferrovia      | proboscide, filtro, pesatura                                |
| filtriCarico  | Filtri punti di carico  | FIL-CAR      | Aree carico        | set → Filtri carico                                         |
| compressore   | Compressore / blower    | CMP-01       | Servizi impianto   | blower, filtro aria, lubrificazione                         |
| fluidificanti | Fluidificanti           | FLU-SIL      | Sili / linea aria  | set → Fluidificanti                                         |
| plc           | Quadro / PLC / HMI      | PLC-01       | Automazione        | plc → Quadro/PLC, hmi → Touchscreen/HMI                    |
| buffer        | Buffer silo / pesatura  | BUF-RAIL-01  | Area ferrovia      | buffer → Buffer silo, celle → Celle di carico              |

---

## 8. PAGINA PRINCIPALE — `NextEuromeccPage.tsx`

### Struttura generale

```tsx
// Hook principale
const [snapshot, setSnapshot] = useState<EuromeccSnapshot | null>(null);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState<'home' | 'maintenance' | 'issues' | 'report'>('home');
const [currentArea, setCurrentArea] = useState<string>('silo1');
const [currentMaintSub, setCurrentMaintSub] = useState<string | null>(null);
const [currentIssueSub, setCurrentIssueSub] = useState<string | null>(null);
const [currentDetailSub, setCurrentDetailSub] = useState<string | null>(null);
const [detailOpen, setDetailOpen] = useState(false);
const [reportRange, setReportRange] = useState<string>('90');
const [saving, setSaving] = useState(false);

// Caricamento iniziale e reload dopo ogni scrittura
async function reloadSnapshot() { ... }
useEffect(() => { reloadSnapshot(); }, []);
```

### Tab navigation

4 tab cliccabili in alto: **Home | Manutenzione | Problemi | Riepilogo**

Tab più piccoli e compatti (come da spec V11 — non grandi e invasivi).

---

### TAB HOME

**KPI bar** (4 card):
- manutenzioni da fare (count pending)
- problemi aperti (count issues state !== 'chiusa')
- manutenzioni fatte ultimi 30 giorni
- aree censite in mappa (count EUROMECC_AREAS)

**Mappa impianto SVG** (vedi sezione 9 per il codice SVG completo):
- ogni nodo ha un bollino colorato basato su `getAreaStatus()`
- click su nodo → `setCurrentArea(key)` + apre il modale fullscreen `detailOpen = true`
- nodo attivo ha bordo blu evidenziato

**Legenda colori**:
- 🔴 rosso (#ef4444) = manutenzione da fare
- 🟠 arancio (#fb923c) = problema segnalato
- 🟡 giallo (#facc15) = da controllare
- 🔵 blu (#3b82f6) = fatto di recente
- 🟢 verde (#22c55e) = ok
- 🟣 viola (#8b5cf6) = osservazione

**Bottoni rapidi**: "Problemi riscontrati" → tab issues | "Componenti manutentivi" → tab maintenance | "Genera riepilogo" → tab report

---

### TAB MANUTENZIONE

**KPI bar** (4 card):
- interventi aperti totali
- fatti ultimi 30 giorni
- componenti nell'area selezionata
- da fare sull'area selezionata

**Stessa mappa SVG della Home** ma click su nodo → `setCurrentArea(key)` senza aprire modale.

**Pannello sinistro** — area selezionata:
- titolo area selezionata
- lista componenti selezionabili (con badge stato per ognuno)
- lista manutenzioni da eseguire sull'area
- lista manutenzioni fatte sull'area (ultime 10)

**Pannello destro** — form:

*Form "Registra manutenzione da fare"*:
```
select: componente (lista componenti dell'area)
select: priorità (Alta / Media / Bassa)
input text: titolo intervento (required)
input date: scadenza (required)
input text: nota breve
button: Salva manutenzione da fare
```
→ chiama `addEuromeccPendingTask()` + `reloadSnapshot()`

*Form "Registra manutenzione fatta"*:
```
select: componente
input date: data intervento (required)
input text: fatta da (required)
input date: prossima scadenza
input text: titolo intervento (required)
input text: nota breve
checkbox: Chiudi le attività aperte dello stesso componente (default: checked)
button: Registra manutenzione fatta
```
→ chiama `addEuromeccDoneTask()` + `reloadSnapshot()`

---

### TAB PROBLEMI

**KPI bar** (4 card):
- problemi aperti totali
- anomalie / criticità aperte
- problemi sull'area selezionata
- chiusi sull'area selezionata

**Stessa mappa SVG** — click nodo → `setCurrentArea(key)`.

**Pannello sinistro** — area selezionata:
- lista componenti selezionabili
- lista problemi aperti sull'area (con bottone "Chiudi" per ognuno → `closeEuromeccIssue()`)
- lista problemi chiusi (ultimi 10)

**Pannello destro** — form:

*Form "Nuova segnalazione"*:
```
select: componente
select: tipo (Criticità / Anomalia / Osservazione)
input text: problema riscontrato (required)
input text: cosa controllare / azione suggerita (required)
input date: data segnalazione (required)
input text: segnalato da
input text: nota breve
button: Salva segnalazione
```
→ chiama `addEuromeccIssue()` + `reloadSnapshot()`

---

### TAB RIEPILOGO

**KPI bar** (4 card):
- manutenzioni da eseguire nel periodo
- problemi aperti nel periodo
- manutenzioni fatte nel periodo
- urgenze reali (pending alta priorità + issue non-osservazione aperte)

**Filtro periodo**: Ultimi 30 giorni | 60 giorni | 90 giorni | Tutto

**Textarea** con testo riepilogo generato automaticamente nel formato:

```
RIEPILOGO IMPIANTO EUROMECC
Periodo: ultimi 90 giorni

1. PROBLEMI SEGNALATI APERTI
- <Area> / <Componente>: <titolo> | da controllare: <check> | priorità: <tipo>

2. MANUTENZIONI DA ESEGUIRE
- <Area> / <Componente>: <titolo> | scadenza: <data> | priorità: <livello>

3. MANUTENZIONI FATTE
- <Area> / <Componente>: <titolo> | fatta il <data> da <operatore>

4. URGENZE DI LAVORO
- MANUTENZIONE: <Area> / <Componente> | <titolo>
- PROBLEMA: <Area> / <Componente> | <titolo>
```

**Bottoni**: Aggiorna riepilogo | Copia testo (clipboard) | Stampa / PDF (`window.print()`)

---

## 9. MAPPA SVG IMPIANTO

Replicare esattamente la mappa SVG presente nel file HTML originale (V10).

Il viewBox è `0 0 1600 920`.

**Struttura SVG**:
- linea collettore superiore orizzontale (y=84) e inferiore (y=472)
- 9 sili come rettangoli arrotondati con linee verticali di connessione
- silo 2 diviso in compartimenti 2A e 2B con divisore verticale
- silo 6 diviso in compartimenti 6A e 6B
- linea filtri silo (barra trasversale y≈336)
- linea coclee/motori (barra trasversale y≈394)
- 3 punti di carico sotto (camion 1, camion 2, ferrovia)
- filtri carico (barra orizzontale)
- compressore, fluidificanti (in basso a sinistra)
- PLC/HMI, buffer/pesatura (in basso a destra)

**Ogni nodo SVG**:
```tsx
<g
  id={areaKey}
  className={`euromecc-node ${currentArea === areaKey ? 'active' : ''}`}
  onClick={() => handleMapClick(areaKey)}
  style={{ cursor: 'pointer' }}
>
  {/* forma geometrica con className="selectable" */}
  {/* testo nome + codice */}
  <circle cx={...} cy={...} r={11} fill={dotColor(areaKey)} />
</g>
```

`dotColor(areaKey)` → usa `getAreaStatus()` e restituisce il colore hex:
```typescript
const STATUS_COLORS: Record<EuromeccStatus, string> = {
  ok:    '#22c55e',
  check: '#facc15',
  issue: '#fb923c',
  maint: '#ef4444',
  done:  '#3b82f6',
  obs:   '#8b5cf6',
};
```

Nodo attivo: bordo `stroke: #0f6fff` e `strokeWidth: 3.6` sulla forma `.selectable`.

---

## 10. MODALE FULLSCREEN (detailDialog)

Si apre cliccando qualsiasi nodo nella **home map**. Occupa ~96% dello schermo (`position: fixed`, `inset: 0`, overflow scroll).

**Struttura modale**:

```
[header]
  titolo area | badge stato | [Vai a Manutenzione] [Vai a Problemi] [Chiudi]

[meta row — 4 card]
  Codice | Area | Ultima manutenzione | Prossima manutenzione

[body — 2 colonne]
  [sinistra]
    Se type === 'silo':
      Schema tecnico SVG del silo con hotspot cliccabili
    Se type === 'generic':
      Lista componenti selezionabili

  [destra]
    Lista componenti selezionabili (con badge stato)
    Dettaglio componente selezionato:
      - stato attuale
      - ultima manutenzione
      - prossima manutenzione
      - "Da fare" → lista pending filtrate per area+sub
      - "Manutenzioni fatte" → lista done filtrate (ultime 5)
      - "Problemi riscontrati" → lista issues filtrate (ultime 5)
```

**Pulsanti navigazione modale**:
- "Vai a Manutenzione" → chiude modale + switch tab maintenance + `setCurrentArea()`
- "Vai a Problemi" → chiude modale + switch tab issues + `setCurrentArea()`

---

## 11. SCHEMA TECNICO SILO (SVG interattivo nel modale)

Visibile solo per aree con `type === 'silo'`.

ViewBox: `0 0 720 560`. Rappresenta schematicamente un silo con:

**Hotspot cliccabili** (8 zone, uno per componente):
- `filtro` → zona filtro in cima al silo
- `livMax` → sensore livello alto
- `livMin` → sensore livello basso
- `fluid` → fluidificanti in basso
- `scarico` → valvola scarico
- `coclea` → coclea orizzontale
- `motore` → motore a sinistra
- `ingrasso` → barra ingrassaggi

Ogni hotspot:
- rettangolo trasparente cliccabile
- bordo colorato in base allo stato (`getSubStatus()`)
- label testo
- cerchio colorato con il colore dello stato

Click su hotspot → `setCurrentDetailSub(subKey)` → aggiorna il pannello destro del modale.

Hotspot attivo: bordo `stroke: #0f6fff`, `strokeWidth: 4`, fill `rgba(15,111,255,0.08)`.

---

## 12. CSS — `next-euromecc.css`

Variabili colore già definite in `:root` del progetto, usarle.

Classi specifiche del modulo (prefisso `eur-`):

```css
.eur-tabs { display: flex; gap: .6rem; flex-wrap: wrap; margin: 1rem 0; }
.eur-tabs button { border-radius: 999px; padding: .35rem .9rem; font-size: .85rem; }
.eur-tabs button.active { background: #0f6fff; border-color: #0f6fff; color: #fff; }

.eur-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: .8rem; margin: 1rem 0; }
.eur-kpi { background: #fff; border: 1px solid var(--line, #d7e0ec); border-radius: 18px; padding: .9rem 1rem; }
.eur-kpi strong { display: block; font-size: 1.05rem; }
.eur-kpi span { font-size: .82rem; color: var(--muted, #617489); }

.eur-map-wrap { border: 1px solid var(--line, #d7e0ec); border-radius: 20px; background: #f8fbff; padding: .75rem; overflow: auto; min-height: 60vh; }

.eur-node { cursor: pointer; transition: transform .15s ease; }
.eur-node:hover { transform: translateY(-2px); filter: drop-shadow(0 6px 12px rgba(23,49,77,.1)); }
.eur-node.active .eur-selectable { stroke: #0f6fff !important; stroke-width: 3.6 !important; }

.eur-ops-grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 1rem; margin-top: 1rem; }
.eur-segment { border: 1px solid var(--line, #d7e0ec); border-radius: 18px; background: #f8fbff; padding: .9rem; }

.eur-selector-item { display: grid; grid-template-columns: 1fr auto; gap: .75rem; align-items: center; border: 1px solid var(--line, #d7e0ec); border-radius: 14px; background: #fff; padding: .7rem .8rem; cursor: pointer; }
.eur-selector-item.active { border-color: #0f6fff; box-shadow: inset 0 0 0 2px rgba(15,111,255,.1); }

.eur-task-item { display: grid; grid-template-columns: 1fr auto; gap: .75rem; align-items: center; border: 1px solid var(--line, #d7e0ec); border-radius: 14px; background: #fff; padding: .7rem .8rem; }

.eur-badge { display: inline-flex; align-items: center; gap: .4rem; padding: .25rem .6rem; border-radius: 999px; font-size: .78rem; font-weight: 700; }
.eur-badge-ok     { background: rgba(34,197,94,.12);  color: #187746; }
.eur-badge-check  { background: rgba(250,204,21,.18); color: #8d6b00; }
.eur-badge-issue  { background: rgba(251,146,60,.16); color: #a75300; }
.eur-badge-maint  { background: rgba(239,68,68,.14);  color: #9d2323; }
.eur-badge-done   { background: rgba(59,130,246,.14); color: #1e5ea8; }
.eur-badge-obs    { background: rgba(139,92,246,.14); color: #6b3ec7; }

/* Modale fullscreen */
.eur-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; align-items: flex-start; justify-content: center; padding: 1.5vh 1vw; overflow: auto; }
.eur-modal { background: #fff; border-radius: 20px; width: 96vw; max-height: 96vh; overflow: auto; padding: 1.5rem; box-shadow: 0 24px 64px rgba(23,49,77,.18); }
.eur-modal-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
.eur-modal-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: .7rem; margin-bottom: 1rem; }
.eur-modal-meta-card { border: 1px solid var(--line, #d7e0ec); border-radius: 14px; padding: .75rem .8rem; }
.eur-modal-body { display: grid; grid-template-columns: 1.15fr .85fr; gap: 1rem; }

/* Hotspot schema silo */
.eur-hotspot { cursor: pointer; transition: filter .15s ease; }
.eur-hotspot:hover { filter: drop-shadow(0 3px 8px rgba(23,49,77,.12)); }
.eur-hotspot.active .eur-hot-stroke { stroke: #0f6fff !important; stroke-width: 4 !important; }
.eur-hotspot.active .eur-hot-fill   { fill: rgba(15,111,255,.08) !important; }

/* Responsive */
@media (max-width: 1280px) {
  .eur-kpis, .eur-ops-grid, .eur-modal-body, .eur-modal-meta { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .eur-kpis { grid-template-columns: repeat(2, 1fr); }
  .eur-task-item, .eur-selector-item { grid-template-columns: 1fr; }
}
```

---

## 13. ROUTE — `src/App.tsx`

Aggiungere dentro il blocco `/next/*`:

```tsx
import NextEuromeccPage from './next/NextEuromeccPage';

// dentro <Routes> nel blocco NextShell:
<Route path="/next/euromecc" element={<NextEuromeccPage />} />
```

---

## 14. OUTPUT ATTESO — verifica

Dopo l'implementazione verificare:

```bash
npx eslint src/next/NextEuromeccPage.tsx src/next/domain/nextEuromeccDomain.ts src/next/euromeccAreas.ts
npm run build
```

Verifica manuale:
- `/next/euromecc` si apre e carica dati da Firestore
- click su silo nella home apre modale fullscreen
- schema tecnico silo mostra hotspot cliccabili colorati
- salvataggio manutenzione da fare → bollino cambia in rosso
- registrazione manutenzione fatta → bollino cambia in blu
- segnalazione problema → bollino cambia in arancio
- chiusura problema → stato torna a base
- riepilogo genera testo corretto con filtro periodo
- copia testo funziona
- "Vai a Manutenzione" dal modale porta alla tab corretta con area già selezionata

---

## 15. DOCUMENTAZIONE OBBLIGATORIA DA AGGIORNARE

Dopo il completamento aggiornare obbligatoriamente:

- `docs/product/STATO_MIGRAZIONE_NEXT.md` — aggiungere sezione modulo Euromecc con stato `CHIUSO` o `APERTO`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md` — voce con data, obiettivo, file toccati, impatto
- `docs/change-reports/<data>_euromecc_modulo_nuovo.md`
- `docs/continuity-reports/<data>_continuity_euromecc_modulo_nuovo.md`

---

## 16. NOTE ARCHITETTURALI

- Questo è il **primo modulo nativo con scrittura reale** nella shell `/next`. Non è un clone read-only della madre.
- Le 3 collection Firestore sono **nuove e dedicate** — non interferiscono con nessun dato business esistente.
- Il dominio non deve importare nulla da `src/pages/*`, `src/utils/storageSync.ts` o writer legacy.
- Importare `db` da `../../firebase` (path relativo dalla posizione `src/next/domain/`).
- Nessuna dipendenza da `cloneWriteBarrier.ts` — questo modulo **può scrivere** legittimamente.
- I dati statici in `euromeccAreas.ts` non vanno mai su Firestore: sono la definizione fisica dell'impianto.
- Tutto il testo UI deve essere in **italiano**.
