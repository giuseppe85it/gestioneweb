# SPEC_DOCUMENTI_COSTI_UI.md

Versione: 2026-04-13
Percorso: `docs/product/SPEC_DOCUMENTI_COSTI_UI.md`
Stato: DA IMPLEMENTARE
Autore spec: Claude (da audit codice reale + sessione design con Giuseppe)

---

## 1. OBIETTIVO

Sostituire completamente il layout di `NextIADocumentiPage.tsx`
con una UI leggibile, organizzata per fornitore, che mostri
fatture e preventivi con le righe documento accessibili al click
e il pulsante "Chiedi alla IA" su ogni riga per interrogare
la IA interna sul documento specifico.

---

## 2. DECISIONI DI PRODOTTO APPROVATE

| Decisione | Valore |
|---|---|
| Organizzazione | Per fornitore — sezioni collassabili |
| Filtri | Tutti / Fatture / DDT / Preventivi / Da verificare |
| Ricerca | Campo testo su fornitore, targa, importo |
| Dettaglio documento | Modale con righe (descrizione, qtà, pr. unitario, totale) |
| Azione principale | "Apri PDF originale" + "Chiedi alla IA" |
| Totali | Per fornitore + totale generale |
| CSS prefix | `.doc-costi-*` |

---

## 3. DATI DISPONIBILI DAL READER

Il reader esistente è `readNextIADocumentiArchiveSnapshot()`
importato da `./domain/nextDocumentiCostiDomain`.

Tipo restituito: `NextIADocumentiArchiveItem[]`

Campi disponibili per ogni item:
- `id` — identificatore univoco
- `tipo` — `"PREVENTIVO"` | `"FATTURA"`
- `fornitoreLabel` — nome fornitore
- `data` — data documento (stringa)
- `timestamp` — per ordinamento
- `descrizione` — descrizione breve
- `importo` — numero o null
- `valuta` / `currency` — `"EUR"` | `"CHF"` | `"UNKNOWN"`
- `targa` / `mezzoTarga` — targa mezzo o stringa vuota
- `fileUrl` — URL PDF originale o null
- `quality` — `"certo"` | `"ricostruito"` | `"non_disponibile"`
- `flags` — array stringhe
- `sourceKey` — collection sorgente
- `sourceDocId` — id documento Firestore

Per i documenti magazzino con righe, il tipo
`NextDocumentiMagazzinoSupportDocument` espone:
- `voci: NextDocumentiMagazzinoSupportRow[]`
  - `descrizione: string | null`
  - `prezzoUnitario: number | null`
  - `importo: number | null`
  - `quantita: number | null`

Le righe voci sono disponibili tramite
`materialCostSupport.documents` nella snapshot mezzo-centrica,
ma in `NextIADocumentiArchiveSnapshot` potrebbero non esserci.
Codex deve verificare la shape reale di `NextIADocumentiArchiveItem`
prima di implementare il modale righe — se `voci` non è presente,
mostrare solo i campi intestazione nel modale.

---

## 4. STRUTTURA VISIVA APPROVATA

```
┌──────────────────────────────────────────────────────────┐
│  Documenti e costi    [12 doc] [4 fornitori] [€ 18.430] │
├──────────────────────────────────────────────────────────┤
│  [Tutti][Fatture][DDT][Preventivi][Da verificare]  [🔍] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  › MARIBA S.r.l.          3 doc  Totale € 6.703         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Tipo  Data       Numero    Targa  Descr.  €   ⚡  │   │
│  │ FAT   24/03/26   BL/VEN…   —      …    2.234 PDF IA│  │
│  │ DDT   15/02/26   BL/VEN…   TI313  …    1.890 PDF IA│  │
│  └──────────────────────────────────────────────────┘   │
│  Totale MARIBA: € 6.703                                  │
│                                                          │
│  › TURBO DIESEL           2 doc  Totale € 5.299         │
│  └─ (stessa struttura)                                   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  Totale generale tutti i fornitori        € 18.430      │
└──────────────────────────────────────────────────────────┘
```

### Modale dettaglio (al click su riga)

```
┌─────────────────────────────────────────────────────┐
│  [FATTURA] MARIBA S.r.l. — BL/VEN/0001583  [Chiudi] │
├─────────────────────────────────────────────────────┤
│  Fornitore  MARIBA     Data    24/03/2026            │
│  Numero     BL/…       Targa   —                    │
│  Importo    € 2.234    Valuta  EUR                  │
│                                                     │
│  RIGHE DOCUMENTO                                    │
│  Descrizione          Qtà    Pr.unit.  Totale       │
│  FASCETTA SICUREZZA…  10 pz  € 69,46   € 694,60    │
│  FASCETTA W2…         50 pz  € 2,30    € 115,00    │
│  …                                                  │
│                                                     │
│  [Apri PDF originale] [Da verificare] [Chiedi IA →] │
└─────────────────────────────────────────────────────┘
```

---

## 5. LOGICA COMPONENTE

### Stato locale

```tsx
const [items, setItems] = useState<NextIADocumentiArchiveItem[]>([]);
const [loading, setLoading] = useState(true);
const [filtroAttivo, setFiltroAttivo] = useState<
  "tutti" | "fatture" | "ddt" | "preventivi" | "da_verificare"
>("tutti");
const [searchQuery, setSearchQuery] = useState("");
const [sezioniAperte, setSezioniAperte] = useState<Set<string>>(new Set());
const [modalItem, setModalItem] = useState<NextIADocumentiArchiveItem | null>(null);
```

### Caricamento dati

```tsx
useEffect(() => {
  setLoading(true);
  readNextIADocumentiArchiveSnapshot()
    .then(setItems)
    .finally(() => setLoading(false));
}, []);
```

### Raggruppamento per fornitore

```tsx
const itemsFiltrati = useMemo(() => {
  return items.filter(item => {
    if (filtroAttivo === "fatture") return item.tipo === "FATTURA";
    if (filtroAttivo === "ddt") 
      return item.tipo === "FATTURA" && 
             item.descrizione?.toLowerCase().includes("ddt");
    if (filtroAttivo === "preventivi") return item.tipo === "PREVENTIVO";
    if (filtroAttivo === "da_verificare") 
      return item.flags?.includes("da_verificare");
    return true;
  }).filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.fornitoreLabel?.toLowerCase().includes(q) ||
      item.targa?.toLowerCase().includes(q) ||
      String(item.importo ?? "").includes(q)
    );
  });
}, [items, filtroAttivo, searchQuery]);

const perFornitore = useMemo(() => {
  const map = new Map<string, NextIADocumentiArchiveItem[]>();
  itemsFiltrati.forEach(item => {
    const key = item.fornitoreLabel || "Fornitore non specificato";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });
  // Ordina per totale fornitore decrescente
  return Array.from(map.entries()).sort((a, b) => {
    const totA = a[1].reduce((s, i) => s + (i.importo ?? 0), 0);
    const totB = b[1].reduce((s, i) => s + (i.importo ?? 0), 0);
    return totB - totA;
  });
}, [itemsFiltrati]);
```

### Totali header

```tsx
const totaleGenerale = useMemo(() =>
  itemsFiltrati.reduce((s, i) => s + (i.importo ?? 0), 0),
  [itemsFiltrati]
);
const numFornitori = perFornitore.length;
```

### Azione "Chiedi alla IA"

```tsx
const handleChiediIA = (item: NextIADocumentiArchiveItem) => {
  const prompt = `Fammi un riepilogo del documento ${item.tipo} 
    del ${item.data ?? "data non disponibile"} 
    di ${item.fornitoreLabel ?? "fornitore non specificato"}
    ${item.targa ? `per il mezzo ${item.targa}` : ""}
    ${item.importo ? `per un importo di ${item.importo} ${item.valuta}` : ""}`;
  navigate(NEXT_INTERNAL_AI_PATH, { state: { initialPrompt: prompt } });
};
```

---

## 6. CSS — CLASSI DA CREARE

Tutte le classi nuove usano prefisso `.doc-costi-*`.
Aggiungere in fondo a `internal-ai.css`.

```css
/* Page layout */
.doc-costi-page { ... }
.doc-costi-header { display:flex; align-items:center; gap:12px; padding:14px 20px; border-bottom:0.5px solid var(--color-border-tertiary); background:var(--color-background-secondary); }
.doc-costi-title { font-size:15px; font-weight:500; color:var(--color-text-primary); flex:1; }
.doc-costi-stat { font-size:12px; color:var(--color-text-tertiary); }
.doc-costi-stat b { color:var(--color-text-primary); font-weight:500; }

/* Filtri */
.doc-costi-filters { display:flex; align-items:center; gap:8px; padding:10px 20px; border-bottom:0.5px solid var(--color-border-tertiary); flex-wrap:wrap; }
.doc-costi-filter { font-size:11px; padding:4px 12px; border:0.5px solid var(--color-border-secondary); border-radius:20px; background:transparent; color:var(--color-text-secondary); cursor:pointer; }
.doc-costi-filter.is-active { background:#1d9e75; color:#fff; border-color:#1d9e75; }
.doc-costi-search { font-size:12px; padding:5px 10px; border:0.5px solid var(--color-border-secondary); border-radius:var(--border-radius-md); background:var(--color-background-primary); color:var(--color-text-primary); outline:none; width:200px; margin-left:auto; }

/* Sezione fornitore */
.doc-costi-fornitore { border-bottom:0.5px solid var(--color-border-tertiary); }
.doc-costi-fornitore-header { display:flex; align-items:center; gap:12px; padding:10px 20px; background:var(--color-background-secondary); cursor:pointer; border-bottom:0.5px solid var(--color-border-tertiary); }
.doc-costi-fornitore-chevron { font-size:10px; color:var(--color-text-tertiary); transition:transform 0.15s; display:inline-block; }
.doc-costi-fornitore-chevron.is-open { transform:rotate(90deg); }
.doc-costi-fornitore-name { font-size:13px; font-weight:500; color:var(--color-text-primary); flex:1; }
.doc-costi-fornitore-total { font-size:12px; font-weight:500; color:var(--color-text-primary); }

/* Tabella */
.doc-costi-table { width:100%; border-collapse:collapse; }
.doc-costi-table th { font-size:10px; font-weight:500; color:var(--color-text-tertiary); text-transform:uppercase; letter-spacing:0.04em; padding:8px 20px; text-align:left; border-bottom:0.5px solid var(--color-border-tertiary); background:var(--color-background-secondary); }
.doc-costi-table th.is-right { text-align:right; }
.doc-costi-table td { font-size:12px; color:var(--color-text-primary); padding:10px 20px; border-bottom:0.5px solid var(--color-border-tertiary); vertical-align:middle; }
.doc-costi-table tr:last-child td { border-bottom:none; }
.doc-costi-table tr:hover td { background:var(--color-background-secondary); cursor:pointer; }

/* Badge tipo */
.doc-costi-badge { font-size:10px; padding:2px 8px; border-radius:20px; white-space:nowrap; }
.doc-costi-badge.is-fattura { background:#e6f1fb; color:#185fa5; }
.doc-costi-badge.is-preventivo { background:#fbeaf0; color:#993556; }
.doc-costi-badge.is-ddt { background:#eaf3de; color:#3b6d11; }

/* Targa chip */
.doc-costi-targa { font-size:11px; padding:2px 7px; background:var(--color-background-secondary); border:0.5px solid var(--color-border-tertiary); border-radius:4px; color:var(--color-text-secondary); font-family:var(--font-mono); }

/* Importo */
.doc-costi-importo { font-size:13px; font-weight:500; color:var(--color-text-primary); text-align:right; white-space:nowrap; }
.doc-costi-valuta { font-size:10px; color:var(--color-text-tertiary); margin-left:3px; }

/* Azioni riga */
.doc-costi-actions { display:flex; gap:6px; white-space:nowrap; }
.doc-costi-btn { font-size:11px; padding:3px 10px; border:0.5px solid var(--color-border-secondary); border-radius:var(--border-radius-md); background:transparent; color:var(--color-text-secondary); cursor:pointer; }
.doc-costi-btn:hover { border-color:#1d9e75; color:#0f6e56; }
.doc-costi-btn-ia { font-size:11px; padding:3px 10px; border:none; border-radius:var(--border-radius-md); background:#e1f5ee; color:#0f6e56; cursor:pointer; }

/* Totale sezione */
.doc-costi-section-total { display:flex; justify-content:flex-end; gap:16px; align-items:center; padding:8px 20px; background:var(--color-background-secondary); border-top:0.5px solid var(--color-border-tertiary); }

/* Footer */
.doc-costi-footer { display:flex; justify-content:space-between; align-items:center; padding:12px 20px; border-top:0.5px solid var(--color-border-tertiary); background:var(--color-background-secondary); }

/* Modale */
.doc-costi-modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:200; align-items:center; justify-content:center; }
.doc-costi-modal-overlay.is-open { display:flex; }
.doc-costi-modal { background:var(--color-background-primary); border-radius:var(--border-radius-lg); border:0.5px solid var(--color-border-tertiary); width:540px; max-width:95vw; overflow:hidden; max-height:90vh; display:flex; flex-direction:column; }
.doc-costi-modal-header { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:0.5px solid var(--color-border-tertiary); background:var(--color-background-secondary); flex-shrink:0; }
.doc-costi-modal-title { font-size:14px; font-weight:500; color:var(--color-text-primary); flex:1; }
.doc-costi-modal-close { font-size:13px; padding:4px 10px; border:0.5px solid var(--color-border-tertiary); border-radius:var(--border-radius-md); background:transparent; color:var(--color-text-secondary); cursor:pointer; }
.doc-costi-modal-body { padding:18px; overflow-y:auto; display:flex; flex-direction:column; gap:14px; }
.doc-costi-modal-fields { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.doc-costi-modal-field { display:flex; flex-direction:column; gap:3px; }
.doc-costi-modal-field-label { font-size:10px; color:var(--color-text-tertiary); text-transform:uppercase; letter-spacing:0.04em; }
.doc-costi-modal-field-val { font-size:13px; color:var(--color-text-primary); font-weight:500; }
.doc-costi-modal-righe-title { font-size:11px; font-weight:500; color:var(--color-text-tertiary); text-transform:uppercase; letter-spacing:0.04em; border-bottom:0.5px solid var(--color-border-tertiary); padding-bottom:6px; }
.doc-costi-modal-riga { display:grid; grid-template-columns:1fr 50px 70px 80px; gap:8px; padding:7px 0; border-bottom:0.5px solid var(--color-border-tertiary); font-size:12px; }
.doc-costi-modal-riga:last-child { border-bottom:none; }
.doc-costi-modal-riga-desc { color:var(--color-text-primary); font-weight:500; }
.doc-costi-modal-riga-val { color:var(--color-text-secondary); text-align:right; }
.doc-costi-modal-actions { display:flex; gap:8px; flex-wrap:wrap; }
.doc-costi-modal-btn-primary { font-size:12px; font-weight:500; padding:7px 16px; background:#1d9e75; color:#fff; border:none; border-radius:var(--border-radius-md); cursor:pointer; }
.doc-costi-modal-btn-secondary { font-size:12px; padding:7px 14px; border:0.5px solid var(--color-border-secondary); border-radius:var(--border-radius-md); background:transparent; color:var(--color-text-secondary); cursor:pointer; }
.doc-costi-modal-btn-ia { font-size:12px; padding:7px 14px; background:#e1f5ee; color:#0f6e56; border:none; border-radius:var(--border-radius-md); cursor:pointer; margin-left:auto; }

/* Loading e empty */
.doc-costi-loading { padding:40px; text-align:center; font-size:13px; color:var(--color-text-tertiary); }
.doc-costi-empty { padding:40px; text-align:center; font-size:13px; color:var(--color-text-tertiary); }
```

---

## 7. PERIMETRO FILE

### FILE DA MODIFICARE
```
src/next/NextIADocumentiPage.tsx     ← riscrivere completamente (369 righe)
src/next/internal-ai/internal-ai.css ← aggiungere classi .doc-costi-* in fondo
```

### FILE DA NON TOCCARE MAI
```
src/next/domain/nextDocumentiCostiDomain.ts  ← solo lettura
src/pages/IA/IADocumenti.tsx                 ← madre intoccabile
src/utils/cloneWriteBarrier.ts
tutti i writer Firestore/Storage
```

---

## 8. COMPORTAMENTO DETTAGLIATO

### Sezioni fornitore
- Tutte aperte di default
- Click sull'header collassa/espande
- Il chevron `›` ruota 90° quando aperta
- Ogni sezione mostra il totale EUR dei suoi documenti in fondo

### Tabella documenti
- Ordinata per data decrescente dentro ogni fornitore
- Badge tipo: FATTURA=blu, PREVENTIVO=rosa, DDT=verde
- Targa: chip monospace se presente, `—` se assente
- Importo: allineato a destra, con valuta in piccolo
- Colonna azioni: `PDF` apre `fileUrl` in nuova tab (disabilitato se null), `Chiedi alla IA` naviga a NEXT_INTERNAL_AI_PATH con prompt precompilato

### Modale dettaglio
- Si apre al click su qualsiasi punto della riga
- NON si apre al click sui pulsanti PDF e Chiedi alla IA (stopPropagation)
- Mostra campi intestazione sempre
- Mostra sezione "Righe documento" solo se `voci` è disponibile e non vuota
- Pulsante "Apri PDF originale" disabilitato se `fileUrl` è null
- Pulsante "Da verificare" aggiorna il flag localmente nello stato (nessuna scrittura Firestore — clone read-only)
- Pulsante "Chiedi alla IA →" chiude il modale e naviga come sopra

### Filtri
- Filtro "Da verificare" mostra item con `flags.includes("da_verificare")` oppure `quality === "ricostruito"`
- I filtri aggiornano solo lo stato locale — nessuna nuova chiamata al reader
- La ricerca filtra su `fornitoreLabel`, `targa`, `String(importo)`

### Loading e empty state
- Durante caricamento: spinner o testo "Caricamento documenti…"
- Se nessun documento: "Nessun documento trovato" centrato
- Se filtro attivo non produce risultati: "Nessun documento corrisponde al filtro selezionato"

---

## 9. ORDINE IMPLEMENTAZIONE

1. `internal-ai.css` — aggiungere tutte le classi `.doc-costi-*` in fondo
2. `NextIADocumentiPage.tsx` — riscrivere completamente con nuovo layout

---

## 10. AGGIORNAMENTI DOCUMENTAZIONE (AGENTS.md §15)

Al termine:
- `docs/product/STATO_MIGRAZIONE_NEXT.md` → aggiornare stato `IA Documenti`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md` → aggiungere voce
- `CONTEXT_CLAUDE.md` → aggiornare descrizione modulo

---

## 11. BUILD E VERIFICA

- `npm run build` — verde
- `npm run lint` — zero errori nuovi
- Aprire `/next/ia/documenti` e verificare:
  - Sezioni fornitori visibili e collassabili
  - Filtri funzionanti
  - Click su riga apre modale
  - PDF apre nuova tab
  - "Chiedi alla IA" naviga con prompt precompilato
  - Totali corretti per fornitore e generale

---

## 12. OUTPUT RICHIESTO DA CODEX

1. `PATCH COMPLETATA` oppure `PATCH PARZIALE`
2. `FILE TOCCATI`
3. `SHAPE ITEM CONFERMATA` — campi reali di `NextIADocumentiArchiveItem`
4. `VOCI DISPONIBILI` — sì/no: le righe documento sono presenti nell'item
5. `BUILD` — esito
6. `LINT` — esito
7. `VERIFICA RUNTIME` — cosa si vede

---

## 13. VINCOLI FINALI

- Niente diff
- Niente invenzioni su campi o logiche
- Se `voci` non è in `NextIADocumentiArchiveItem` — non inventarla,
  mostrare solo i campi intestazione nel modale
- Se serve toccare file fuori whitelist: `SERVE FILE EXTRA: <path>`
- Testi in italiano
- Nessuna modifica alla logica business
