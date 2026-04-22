# SPEC_IA_UNIVERSAL_DISPATCHER.md

Versione: 2026-04-12  
Percorso: `docs/product/SPEC_IA_UNIVERSAL_DISPATCHER.md`  
Stato: DA IMPLEMENTARE  
Autore spec: Claude (da audit codice reale + sessione di design con Giuseppe)

---

## 1. OBIETTIVO GENERALE

Trasformare il punto di accesso alla IA interna in un sistema unico, pulito e scalabile
composto da tre superfici collegate:

1. **Card Home** — unico punto di ingresso dalla home NEXT (`/next`)
2. **Pagina IA** (`/next/ia/interna`) — chat + dispatcher documenti + lista funzioni
3. **Storico ufficiale** (`/next/ia/documenti`) — archivio per categoria di tutto
   ciò che è stato analizzato e salvato

Regola fondamentale: **un solo ingresso per tutte le funzioni IA**.
Nessuna voce di menu separata per Libretto, Documenti, Cisterna.
Tutto parte dalla card home e dalla pagina IA.

---

## 2. DECISIONI DI PRODOTTO APPROVATE

Tutte le seguenti decisioni sono state prese esplicitamente da Giuseppe
durante la sessione di design del 2026-04-12 e non devono essere
reinterpretate da Codex.

| Decisione | Valore approvato |
|---|---|
| Punto di ingresso | Uno solo — card home + pagina `/next/ia/interna` |
| Voci menu IA separate | Rimosse dalla navigazione principale |
| Review documenti | Apre modulo separato con campi precompilati (due colonne) |
| Libretto e Cisterna | Aprono il modale già esistente — nessuna review custom |
| Storico ufficiale | `/next/ia/documenti` — unico, per categoria, fatto bene |
| Funzioni future | Disabilitate nel menu + con etichetta "In arrivo" |
| Scalabilità | Struttura a registro: aggiungere una funzione = aggiungere una voce |

---

## 3. ARCHITETTURA DEL SISTEMA

```
Card Home (HomeInternalAiLauncher)
    │
    ├── campo testo → naviga a /next/ia/interna con prompt iniziale
    └── menu + → naviga a /next/ia/interna con tipo documento selezionato
                    │
                    ▼
        Pagina IA (/next/ia/interna)
            │
            ├── Chat testuale (workbench esistente)
            │       └── report targa, manutenzioni, costi, stato magazzino
            │
            ├── Upload + Analisi documento
            │       └── chiama estrazioneDocumenti (già funzionante)
            │
            └── Handoff banner nel thread
                    │
                    ├── Fattura / DDT / Preventivo
                    │       └── apre review a due colonne
                    │               └── Salva → Firestore + Storage
                    │                   Importa → @inventario
                    │                   Da verificare → updateDoc
                    │
                    ├── Libretto mezzo
                    │       └── apre modale NextIALibrettoPage esistente
                    │
                    └── Cisterna Caravate
                            └── apre modale NextCisternaIAPage esistente
                                    │
                                    ▼
                        Storico ufficiale (/next/ia/documenti)
                            Fatture/DDT · Preventivi · Libretti
                            Cisterna · Manutenzioni · Da verificare
```

---

## 4. SUPERFICIE 1 — CARD HOME

### File da modificare
- `src/next/components/HomeInternalAiLauncher.tsx` — riscrivere completamente
- `src/next/NextHomePage.tsx` — nessuna modifica al mount, solo il componente cambia

### Struttura visiva della card

```
┌─────────────────────────────────────────────────┐
│  ● Assistente IA                      [Attivo]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  [+]  [ Chiedi un report, una targa...      ][→]│
│                                                 │
│       Menu + (quando aperto):                   │
│       ● Fattura / DDT                           │
│         Allega e analizza con IA                │
│       ● Libretto mezzo                          │
│         Estrai dati carta di circolazione       │
│       ● Cisterna Caravate                       │
│         Schede test e bollettini                │
│       ● Preventivo fornitore                    │
│         Allega e archivia                       │
│       ● Documento manutenzione                  │
│         Allega e collega al mezzo               │
│       ─────────────────────────────             │
│       ○ Analisi Danni       [In arrivo]         │
│       ○ Diagnostica IA      [In arrivo]         │
│                                                 │
├─────────────────────────────────────────────────┤
│  5 funzioni attive              Storico →       │
└─────────────────────────────────────────────────┘
```

### Comportamento del campo testo
- Placeholder: `"Chiedi un report, una targa, un fornitore…"`
- Al submit (tasto freccia o Enter): `navigate(NEXT_INTERNAL_AI_PATH, { state: { initialPrompt: inputValue } })`
- Non invia nulla direttamente — apre la pagina IA con il testo precaricato

### Comportamento del menu +
- Click sul + apre/chiude un dropdown sopra il campo
- Ogni voce attiva: `navigate(NEXT_INTERNAL_AI_PATH, { state: { triggerUpload: tipoDocumento } })`
  dove `tipoDocumento` è uno di: `"fattura"` | `"libretto"` | `"cisterna"` | `"preventivo"` | `"manutenzione"`
- Le voci "In arrivo" sono disabilitate visivamente (opacity 0.45, cursor not-allowed) e non navigano
- Click fuori dal menu lo chiude

### Comportamento link "Storico →"
- `navigate(NEXT_IA_DOCUMENTI_PATH)`

### CSS
- Usare classi esistenti da `internal-ai.css` dove compatibili
- Nuove classi con prefisso `.home-ia-launcher__*`
- Colore accent: `#1d9e75` (verde già usato nel progetto)
- Dot stato attivo: `width:8px; height:8px; border-radius:50%; background:#1d9e75`
- Pill "Attivo": `background:#e1f5ee; color:#0f6e56; border-radius:20px`
- Menu +: `border:0.5px solid var(--color-border-secondary)`, nessun box-shadow
- Voci menu: dot colorato + nome + descrizione 11px muted
- Colori dot per tipo:
  - Fattura/DDT: `#185fa5`
  - Libretto: `#0f6e56`
  - Cisterna: `#854f0b`
  - Preventivo: `#993556`
  - Manutenzione: `#3b6d11`
  - In arrivo: `var(--color-text-tertiary)`

### TypeScript — props e tipi nuovi

```tsx
type IATipoDocumento =
  | "fattura"
  | "libretto"
  | "cisterna"
  | "preventivo"
  | "manutenzione";

type IAMenuVoce = {
  tipo: IATipoDocumento;
  label: string;
  descrizione: string;
  colore: string;
  attivo: true;
} | {
  tipo: string;
  label: string;
  descrizione: string;
  attivo: false;
};
```

---

## 5. SUPERFICIE 2 — PAGINA IA

### File da modificare
- `src/next/NextInternalAiPage.tsx` — solo la sezione layout/header/composer
- `src/next/internal-ai/internal-ai.css` — aggiungere classi nuove in fondo

### File da NON toccare
- Tutta la logica `useIADocumentiEngine`
- `internalAiUniversalOrchestrator`
- `internalAiUniversalHandoff`
- `internalAiChatAttachmentsClient`
- Tutti i writer Firestore/Storage
- `cloneWriteBarrier`

### Layout generale pagina IA

```
┌──────────────────────────────────────────────────────────┐
│  ● Assistente IA          [Backend attivo]    [Chiudi]   │
├─────────────────────────────────────────┬────────────────┤
│                                         │  FUNZIONI      │
│  CHAT                                   │                │
│                                         │  ● Documenti IA│
│  [avatar] messaggio IA                  │    In uso      │
│                                         │                │
│  ┌─ HANDOFF BANNER ──────────────────┐  │  ● Libretto    │
│  │ [tipo] [confidenza]               │  │                │
│  │ nome file                         │  │  ● Cisterna    │
│  │ Fornitore · Doc · Tipo            │  │                │
│  │ [Apri review →] [Apri originale]  │  │  ● Preventivi  │
│  └───────────────────────────────────┘  │                │
│                                         │  ● Magazzino   │
│  [avatar] risposta testuale IA          │                │
│                                         ├────────────────┤
├─────────────────────────────────────────┤  Storico →     │
│  [+] [ scrivi o allega... ] [→]         │                │
│  chip file allegato                     │                │
└─────────────────────────────────────────┴────────────────┘
```

### Comportamento alla navigazione con state

Quando la pagina riceve `location.state.initialPrompt`:
- Precarica il testo nel composer
- Non fa auto-submit — l'utente vede il testo e decide

Quando riceve `location.state.triggerUpload`:
- Apre automaticamente il file picker filtrato per tipo
- Per `"libretto"`: apre direttamente il modale `NextIALibrettoPage`
  navigando a `NEXT_IA_LIBRETTO_PATH`
- Per `"cisterna"`: apre direttamente il modale `NextCisternaIAPage`
  navigando a `NEXT_CISTERNA_IA_PATH`
- Per gli altri tipi (`"fattura"`, `"preventivo"`, `"manutenzione"`):
  apre il file picker e preseleziona la categoria nel motore documenti

### Handoff banner nel thread

Il banner appare nel thread chat quando `chatDocumentProposalState.status === "ready"`
e `documentReviewRoutes.length > 0`.

Struttura banner:
```
border-left: 3px solid #1d9e75
padding: 12px 14px
sfondo: var(--color-background-secondary)

Riga 1: [tag tipo documento] [tag confidenza]
Riga 2: nome file (font-weight 500)
Riga 3: Fornitore · Numero doc · Tipo (font-size 12px muted)
Riga 4: [Apri review →] [Apri originale]
```

Tag confidenza:
- Alta: `background:#e1f5ee; color:#0f6e56`
- Media: `background:#faeeda; color:#854f0b`
- Bassa: `background:#fbeaf0; color:#993556`

Pulsante "Apri review →":
- `background:#1d9e75; color:#fff`
- Apre la review a due colonne (vedi Superficie 2b)
- NON naviga fuori dalla pagina — apre un pannello/modale interno

Pulsante "Apri originale":
- Apre il file allegato in una nuova tab
- Usa `buildInternalAiChatAttachmentAssetUrl` già esistente

### Pannello moduli (colonna destra)

Lista statica delle funzioni disponibili. Quella attualmente in uso
è evidenziata con `border-color:#1d9e75; background:#e1f5ee`.

Ogni voce:
- Icona quadrata 26x26px con lettera iniziale e colore dedicato
- Nome funzione (13px font-weight 500)
- Descrizione (11px muted)
- Badge stato: "In uso" verde / "Attivo" grigio neutro

Voci fisse nell'ordine:
1. Documenti IA — Fatture, DDT, preventivi — `#185fa5`
2. Libretto mezzo — Carta di circolazione — `#0f6e56`
3. Cisterna Caravate — Schede test — `#854f0b`
4. Preventivi — Offerte fornitori — `#993556`
5. Magazzino — Materiali e tabelle — `#3b6d11`

Link "Storico analisi →" in fondo alla colonna:
- `navigate(NEXT_IA_DOCUMENTI_PATH)`

---

## 6. SUPERFICIE 2b — REVIEW DOCUMENTO

La review si apre come pannello che sostituisce la vista chat
(non è una route separata, non è un modale flottante).

### Struttura visiva

```
┌──────────────────────────────────────────────────────────┐
│  [← Torna alla chat]  Fattura materiali  [Da verif.][Salva]│
├──────────────────────────────┬───────────────────────────┤
│                              │                           │
│  ANTEPRIMA DOCUMENTO         │  RIGHE ESTRATTE           │
│  (img o placeholder PDF)     │                           │
│                              │  Verifica desc, qtà,      │
│  ── INTESTAZIONE ──          │  importi                  │
│                              │                           │
│  Fornitore    [campo verde]  │  ┌─ riga 1 ─────────────┐ │
│  Tipo doc     [campo verde]  │  │ FASCETTA SICUREZZA... │ │
│  Numero doc   [campo verde]  │  │ Cod · Qtà · Importo   │ │
│  Data         [campo verde]  │  └───────────────────────┘ │
│                              │                           │
│  ── VEICOLO ──               │  ┌─ riga 2 ─────────────┐ │
│                              │  │ ...                   │ │
│  Targa        [campo vuoto]  │  └───────────────────────┘ │
│  Categoria    [campo verde]  │                           │
│                              │  ┌─ TOTALE ─────────────┐ │
│  ── IMPORTI ──               │  │ Totale: € X.XXX,XX    │ │
│                              │  └───────────────────────┘ │
│  Imponibile   [campo verde]  │                           │
│  IVA %        [campo verde]  │  ┌─ IMPORTA ────────────┐ │
│  Totale       [campo verde]  │  │ N righe disponibili   │ │
│  Valuta       [campo verde]  │  │ [Importa Inventario]  │ │
│                              │  └───────────────────────┘ │
└──────────────────────────────┴───────────────────────────┘
```

### Campi precompilati

I campi verdi sono quelli estratti dall'analisi IA:
```css
background: #e1f5ee;
border-color: #5dcaa5;
```
Sono tutti editabili — l'utente può modificare prima di salvare.

I campi vuoti (es. Targa quando non estratta) hanno placeholder
e `background: var(--color-background-primary)`.

### Azioni header review

**Salva documento**
- `background:#1d9e75; color:#fff`
- Chiama il writer esistente: upload Storage `documenti_pdf/...`
  + save Firestore in `@documenti_mezzi` / `@documenti_magazzino` / `@documenti_generici`
- Dopo salvataggio: torna alla chat con messaggio di conferma nel thread

**Da verificare**
- `background:#faeeda; color:#854f0b`
- Chiama `updateDoc` sul documento con stato `"da_verificare"`
- Dopo: torna alla chat con messaggio nel thread

**← Torna alla chat**
- Torna alla vista chat senza salvare
- Se ci sono dati non salvati: nessun alert — comportamento silenzioso

### Importa in Inventario

Il blocco verde in fondo alla colonna destra è visibile solo se
`documentReviewRoutes` contiene righe di tipo magazzino.

Testo: `"N righe disponibili per importazione in Inventario"`
Pulsante: chiama `executeInternalAiMagazzinoInlineAction` già esistente
con scrittura su `@inventario`.

---

## 7. SUPERFICIE 3 — STORICO UFFICIALE

### File da modificare
- `src/next/NextIADocumentiPage.tsx` — riscrivere il layout mantenendo
  la logica di lettura dati esistente (`readNextIADocumentiArchiveSnapshot`)

### File da NON toccare
- `src/next/domain/nextDocumentiCostiDomain.ts`
- Tutti i writer
- `cloneWriteBarrier`

### Struttura visiva

```
┌──────────────────────────────────────────────────────────┐
│  STORICO ANALISI IA                                      │
│                                                          │
│  [Tutti] [Fatture] [Preventivi] [Libretti]               │
│  [Cisterna] [Manutenzioni] [Da verificare]               │
│                                                          │
│  ── FATTURE E DDT ─────────────────────────────────────  │
│  Documento   Fornitore  Targa  Data      Totale  Stato   │
│  FATTURA     TURBO DIE  TI31…  13/01/26  2.795   Salvato │
│  DDT         MARIBA     —      24/03/26  2.235   Da ver. │
│                                                          │
│  ── PREVENTIVI ────────────────────────────────────────  │
│  Documento   Fornitore  Targa  Data      Totale  Stato   │
│  PREVENTIVO  SCIUBA     TI31…  03/04/26  2.116   Salvato │
│                                                          │
│  ── LIBRETTI MEZZO ────────────────────────────────────  │
│  Targa       Tipo mezzo         Data analisi    Stato    │
│  TI313387    Motrice stradale   10/04/2026      Libretto │
│                                                          │
│  ── CISTERNA CARAVATE ─────────────────────────────────  │
│  File                  Data analisi    Stato             │
│  cisterna_aprile.pdf   09/04/2026      Salvato           │
│                                                          │
│  ── MANUTENZIONI ──────────────────────────────────────  │
│  (vuoto se nessun documento manutenzione salvato)        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Filtri

I filtri in cima sono pillole cliccabili. "Tutti" mostra tutte le sezioni.
Gli altri filtri nascondono le sezioni non pertinenti (non ricaricano dati —
filtro puramente visivo via stato locale React).

Filtro "Da verificare" mostra solo le righe con stato `da_verificare`
in tutte le sezioni.

### Sezioni

Ogni sezione ha:
- Titolo sezione: 11px uppercase muted con border-bottom
- Tabella con colonne coerenti per tipo
- Colonne sempre presenti: Tipo badge colorato, dati chiave, Data, Stato, Azione

Badge tipo documento:
- FATTURA: `background:#e6f1fb; color:#185fa5`
- DDT: `background:#e6f1fb; color:#185fa5`
- PREVENTIVO: `background:#fbeaf0; color:#993556`
- Libretto: `background:#e1f5ee; color:#0f6e56`
- Cisterna: `background:#faeeda; color:#854f0b`
- Manutenzione: `background:#eaf3de; color:#3b6d11`

Stato:
- Salvato: `color:#0f6e56`
- Da verificare: `color:#854f0b`

Azione per riga:
- Fatture/Preventivi: pulsante "Apri PDF"
- Libretti: pulsante "Apri foto"
- Cisterna: pulsante "Apri"

### Sezione vuota

Se una sezione non ha documenti: non mostrare la sezione (non mostrare
"nessun documento" — semplicemente la sezione non compare).

### Scalabilità

Per aggiungere una nuova categoria in futuro (es. Danni, Diagnostica):
- Aggiungere una voce all'array `STORICO_SEZIONI` (da definire nel file)
- Aggiungere il filtro pill corrispondente
- Nessuna altra modifica strutturale necessaria

---

## 8. PERIMETRO FILE COMPLETO

### FILE DA CREARE
- Nessuno

### FILE DA MODIFICARE
```
src/next/components/HomeInternalAiLauncher.tsx     ← riscrivere completo
src/next/NextInternalAiPage.tsx                    ← solo layout/header/composer/banner/colonna destra
src/next/NextIADocumentiPage.tsx                   ← riscrivere layout, mantenere logica dati
src/next/internal-ai/internal-ai.css               ← aggiungere classi nuove in fondo
```

### FILE VIETATI — NON TOCCARE MAI
```
src/pages/IA/IADocumenti.tsx                       ← madre intoccabile
src/pages/IA/IALibretto.tsx                        ← madre intoccabile
src/pages/IA/IAHome.tsx                            ← madre intoccabile
src/next/domain/nextDocumentiCostiDomain.ts        ← domain read-only
src/next/internal-ai/internalAiUniversalOrchestrator.ts
src/next/internal-ai/internalAiUniversalHandoff.ts
src/next/internal-ai/internalAiUniversalDocumentRouter.ts
src/next/internal-ai/internalAiUniversalRegistry.ts
src/next/internal-ai/internalAiChatAttachmentsClient.ts
src/next/internal-ai/internalAiMagazzinoControlledActions.ts
src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts
src/utils/cloneWriteBarrier.ts
src/utils/storageSync.ts
src/next/nextStructuralPaths.ts                    ← solo lettura, non modificare
```

---

## 9. ORDINE DI IMPLEMENTAZIONE

Codex deve implementare nell'ordine seguente, un file alla volta,
senza aspettare conferma tra un file e l'altro:

1. `HomeInternalAiLauncher.tsx` — card home con campo testo + menu +
2. `internal-ai.css` — aggiungere le classi nuove in fondo al file esistente
3. `NextIADocumentiPage.tsx` — storico ufficiale con sezioni e filtri
4. `NextInternalAiPage.tsx` — layout pagina IA con colonna destra moduli
   e handoff banner nel thread

---

## 10. AGGIORNAMENTI DOCUMENTAZIONE OBBLIGATORI (AGENTS.md §15)

Al termine di ogni file implementato, Codex deve aggiornare:

- `docs/product/STATO_MIGRAZIONE_NEXT.md`
  → aggiornare stato moduli: `IA Hub`, `IA Interna`, `IA Documenti`
- `docs/product/CHECKLIST_IA_INTERNA.md`
  → spuntare le voci implementate
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
  → aggiornare con le superfici completate
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
  → aggiungere voce per ogni file modificato
- `CONTEXT_CLAUDE.md`
  → aggiornare descrizione modulo IA interna

---

## 11. BUILD E VERIFICA OBBLIGATORIE

Dopo ogni file:
- `npm run lint` — nessun errore nuovo
- `npm run build` — build verde

Dopo tutti e quattro i file:
- Aprire `/next` → verificare card home con campo testo e menu +
- Aprire menu + → verificare tutte le voci con colori corretti
- Scrivere testo nel campo e premere invio → verificare navigazione
  a `/next/ia/interna` con testo precaricato nel composer
- Aprire `/next/ia/interna` → verificare layout due colonne,
  colonna destra con lista moduli, link storico in fondo
- Aprire `/next/ia/documenti` → verificare sezioni, filtri, tabelle
- Verificare assenza di `Maximum update depth exceeded` in console
  (già fixato — verificare che il fix regga con la nuova UI)

---

## 12. OUTPUT RICHIESTO DA CODEX IN CHAT

Al completamento:
1. `PATCH COMPLETATA` oppure `PATCH PARZIALE`
2. `FILE TOCCATI` con path esatti
3. `SUPERFICI IMPLEMENTATE` — lista delle tre superfici
4. `DOCUMENTAZIONE AGGIORNATA` — lista file doc aggiornati
5. `BUILD` — esito
6. `LINT` — esito
7. `VERIFICA RUNTIME` — esito per ogni superficie

---

## 13. VINCOLI FINALI

- Niente diff
- Niente invenzioni su path, nomi componenti o chiavi dati
- Niente reinterpretazioni del design — la UI deve essere uguale
  ai prototipi approvati in sessione
- Se serve toccare un file fuori whitelist: fermati e scrivi
  `SERVE FILE EXTRA: <path>`
- I testi visibili devono essere in italiano
- Nessuna modifica alla logica business esistente —
  solo nuova UI sopra i writer e reader già funzionanti
