# SPEC — Riepilogo Euromecc V2 (Tab Riepilogo)

**Versione:** 1.0  
**Data:** 2026-04-09  
**Stato:** PRONTO PER IMPLEMENTAZIONE  
**Route:** `/next/euromecc` — tab `Riepilogo` (quarto tab, già esistente)  
**Tipo task:** UI + PDF export — nessuna modifica a logica dati o Firestore

---

## 1. OBIETTIVO

Sostituire il tab Riepilogo attuale (textarea + window.print) con:
- Pagina riepilogo visiva professionale con mappa SVG impianto integrata
- Layout dettaglio per area con sezione speciale per punti di carico
- Export PDF professionale con jsPDF: logo, intestazione, mappa SVG, tabelle lavori
- Salvataggio PDF su Firestore per archivio consultabile

---

## 2. DIPENDENZE

### Già presenti nel repo
- `jspdf` — già in package.json
- `jspdf-autotable` — già in package.json  
- `src/utils/pdfEngine.ts` — motore PDF condiviso — NON modificare
- `MapSvg` — componente mappa impianto riusabile — NON modificare
- `SiloDiagram`, `CaricoDiagram` — SVG dettaglio area — NON modificare
- `STATUS_COLORS`, `STATUS_LABELS` — già disponibili nel file

### Da aggiungere
- `html2canvas` — per convertire il SVG della mappa in immagine per jsPDF
  - `npm install html2canvas`
  - usato solo nel flusso export PDF, import dinamico lazy

---

## 3. STRUTTURA NUOVA PAGINA RIEPILOGO

### 3.1 Header riepilogo
```
┌─────────────────────────────────────────────────────────┐
│  RIEPILOGO IMPIANTO EUROMECC          [Esporta PDF]     │
│  Periodo: [30gg] [60gg] [90gg] [Tutto]                  │
├──────────┬──────────┬──────────┬──────────┐             │
│ Manut.   │ Problemi │ Fatte    │ Urgenze  │  ← KpiGrid  │
│ da fare  │ aperti   │ periodo  │ reali    │  esistente  │
└──────────┴──────────┴──────────┴──────────┘
```

### 3.2 Mappa impianto (semaforo visivo)
```
┌─────────────────────────────────────────────────────────┐
│  STATO IMPIANTO                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  MapSvg — mappa completa con status colorati    │   │
│  │  viewBox 1480x860, width 100%                   │   │
│  └─────────────────────────────────────────────────┘   │
│  Legenda: ● OK  ● Da fare  ● Problema  ● Critico       │
└─────────────────────────────────────────────────────────┘
```
La mappa è read-only in questa vista — nessun onClick sulle aree.
Mostra lo stato corrente di ogni nodo tramite STATUS_COLORS già esistenti.

### 3.3 Sezioni per area — layout a card

Per ogni area che ha almeno un pending, issue o done nel periodo:

**Area generica (compressore, filtri, ecc.):**
```
┌─────────────────────────────────────────────────────────┐
│  🔴 COMPRESSORE N.1 — CMP-01          [2 da fare / 1 OK]│
├─────────────────────────────────────────────────────────┤
│  Da fare:                                               │
│  • Sostituzione cinghie — alta priorità — scad 30/04    │
│  • Verifica essiccatore — media priorità                │
│  Fatte (periodo):                                       │
│  • Sostituzione filtro olio — 26/08/2025 — Lembo G.    │
│  Problemi:                                              │
│  • Anomalia pressione — aperto dal 01/04/2026           │
└─────────────────────────────────────────────────────────┘
```

**Punti di carico (carico1, carico2, caricoRail) — layout speciale:**
```
┌──────────────────────────────┬──────────────────────────┐
│  SVG CaricoDiagram           │  Da fare:                │
│  (disegno punto di carico)   │  • ➤ Gruppo FR           │
│  con frecce colorate sui      │    Sostituzione          │
│  componenti che hanno        │    alta priorità          │
│  attività aperte             │                          │
│                              │  Fatte:                  │
│                              │  • Valvola farfalla       │
│                              │    26/08/2025             │
└──────────────────────────────┴──────────────────────────┘
```

Le frecce sui componenti con attività aperte sono `<line>` SVG overlay
colorate con STATUS_COLORS — puntano dal componente verso il margine
destro del SVG dove appare il testo del lavoro.

### 3.4 Ordine sezioni
1. Aree con urgenze (priority === "alta" o issues type !== "osservazione") — in cima
2. Aree con pending media/bassa priorità
3. Aree solo con done (storico)
4. Aree senza attività nel periodo — non mostrate

---

## 4. TIPI TYPESCRIPT NUOVI

```ts
// Stato locale del tab Riepilogo (estende quello esistente)
type RiepilogoAreaCard = {
  areaKey: string;
  areaLabel: string;
  areaCode: string;
  areaType: EuromeccAreaType;
  status: EuromeccStatus;
  pendingItems: EuromeccPendingTask[];
  doneItems: EuromeccDoneTask[];
  openIssues: EuromeccIssueTask[];
  hasUrgency: boolean;
}
```

---

## 5. COMPONENTI DA CREARE

Tutti dentro `NextEuromeccPage.tsx` come funzioni locali.
Non creare file separati.

```
RiepilogoTab                  — orchestratore, sostituisce il JSX inline attuale
├── RiepilogoHeader           — filtro periodo + bottone Esporta PDF
├── RiepilogoMappaImpianto    — wrapper MapSvg read-only + legenda
├── RiepilogoAreaCard         — card per area generica
├── RiepilogoCaricoDiagram    — layout speciale punti di carico con SVG + frecce
└── RiepilogoExportButton     — bottone che scatena generatePdfRiepilogo()
```

---

## 6. FUNZIONE generatePdfRiepilogo()

### 6.1 Struttura PDF

**Pagina 1 — Copertina e mappa**
- Header: Logo "EUROMECC" (testo, non immagine), "RIEPILOGO IMPIANTO"
- Data generazione, periodo selezionato
- KPI: 4 valori in riga (da fare / problemi / fatte / urgenze)
- Mappa SVG impianto: converti `<svg class="eur-map">` in immagine con
  `html2canvas` → inserisci nel PDF come immagine JPG
- Legenda colori stato

**Pagina 2+ — Dettaglio per area**
Per ogni area con attività, sezione con:
- Titolo area + codice + stato badge
- Tabella "Da fare": colonne — Componente / Lavoro / Priorità / Scadenza
- Tabella "Fatte nel periodo": colonne — Componente / Lavoro / Data / Tecnico
- Tabella "Problemi aperti": colonne — Componente / Descrizione / Tipo / Dal

Per `carico1`, `carico2`, `caricoRail`:
- Inserisci una piccola immagine del CaricoDiagram SVG (html2canvas) prima
  delle tabelle
- Evidenzia nella tabella i componenti con attività

**Ultima pagina — Urgenze riepilogo**
- Lista urgenze con area, componente, descrizione
- Firma e data

### 6.2 Implementazione

```ts
async function generatePdfRiepilogo(
  snapshot: EuromeccSnapshot,
  range: EuromeccRange,
  cards: RiepilogoAreaCard[]
): Promise<void> {
  // 1. Import dinamico lazy
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  const { default: html2canvas } = await import("html2canvas");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  let y = margin;

  // helper: nuova pagina se necessario
  const checkPage = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // --- PAGINA 1 ---
  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("EUROMECC — RIEPILOGO IMPIANTO", margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const rangeLabel = RANGE_OPTIONS.find(r => r.value === range)?.label ?? "Tutto";
  doc.text(`Periodo: ${rangeLabel} | Generato il: ${formatDateUI(new Date().toISOString().slice(0,10))}`, margin, y);
  y += 10;

  // KPI row
  const kpiValues = [
    { label: "Da fare", value: String(cards.reduce((s, c) => s + c.pendingItems.length, 0)) },
    { label: "Problemi", value: String(cards.reduce((s, c) => s + c.openIssues.length, 0)) },
    { label: "Fatte", value: String(cards.reduce((s, c) => s + c.doneItems.length, 0)) },
    { label: "Urgenze", value: String(cards.filter(c => c.hasUrgency).length) },
  ];
  const kpiW = (pageW - margin * 2) / 4;
  kpiValues.forEach((kpi, i) => {
    const x = margin + i * kpiW;
    doc.setFillColor(245, 245, 245);
    doc.rect(x, y, kpiW - 2, 16, "F");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x + kpiW/2 - 2, y + 9, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, x + kpiW/2 - 2, y + 14, { align: "center" });
  });
  y += 22;

  // Mappa SVG come immagine
  const mapEl = document.querySelector(".eur-map") as HTMLElement | null;
  if (mapEl) {
    try {
      const canvas = await html2canvas(mapEl, { scale: 1.5, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const imgW = pageW - margin * 2;
      const imgH = (canvas.height / canvas.width) * imgW;
      checkPage(imgH + 5);
      doc.addImage(imgData, "JPEG", margin, y, imgW, imgH);
      y += imgH + 8;
    } catch {
      // fallback: salta immagine mappa
      y += 2;
    }
  }

  // --- PAGINE DETTAGLIO ---
  for (const card of cards) {
    doc.addPage();
    y = margin;

    // Titolo area
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`${card.areaLabel} — ${card.areaCode}`, margin, y);
    y += 7;

    // SVG punto di carico (se carico1/carico2/caricoRail)
    if (["carico1", "carico2", "caricoRail"].includes(card.areaKey)) {
      const svgEl = document.querySelector(
        `[data-area-key="${card.areaKey}"] .eur-silo-diagram`
      ) as HTMLElement | null;
      if (svgEl) {
        try {
          const canvas = await html2canvas(svgEl, { scale: 1.5, backgroundColor: "#ffffff" });
          const imgData = canvas.toDataURL("image/jpeg", 0.85);
          const imgW = 80;
          const imgH = (canvas.height / canvas.width) * imgW;
          doc.addImage(imgData, "JPEG", margin, y, imgW, imgH);
          y += imgH + 5;
        } catch {
          y += 2;
        }
      }
    }

    // Tabelle con jspdf-autotable
    if (card.pendingItems.length > 0) {
      checkPage(20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Da fare", margin, y);
      y += 4;
      (doc as any).autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Componente", "Lavoro", "Priorità", "Scadenza"]],
        body: card.pendingItems.map(p => [
          p.subLabel, p.title,
          PRIORITY_LABELS[p.priority],
          p.dueDate ? formatDateUI(p.dueDate) : "—"
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    if (card.doneItems.length > 0) {
      checkPage(20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Fatte nel periodo", margin, y);
      y += 4;
      (doc as any).autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Componente", "Lavoro", "Data", "Tecnico"]],
        body: card.doneItems.map(d => [
          d.subLabel, d.title,
          formatDateUI(d.doneDate), d.by
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    if (card.openIssues.length > 0) {
      checkPage(20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Problemi aperti", margin, y);
      y += 4;
      (doc as any).autoTable({
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Componente", "Descrizione", "Tipo", "Dal"]],
        body: card.openIssues.map(i => [
          i.subLabel, i.title,
          ISSUE_TYPE_LABELS[i.type],
          formatDateUI(i.reportedAt)
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [239, 68, 68] },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }
  }

  // Salva
  const fileName = `euromecc-riepilogo-${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fileName);
}
```

---

## 7. SALVATAGGIO ARCHIVIO (opzionale — fase 2)

Dopo `doc.save(fileName)` aggiungere:
```ts
// Converti il PDF in base64 e salva metadati su Firestore
// collection: euromecc_report_archive
// shape: { fileName, generatedAt, range, kpiSnapshot, createdAt }
// NON salvare il file binario su Firestore — solo metadati
// Il file fisico resta in download locale
```
Questo è da implementare in un secondo momento — non blocca il task corrente.

---

## 8. COMPONENTE RiepilogoCaricoDiagram — frecce overlay

Per i punti di carico, il SVG del CaricoDiagram viene mostrato
con un overlay di frecce colorate sui componenti con attività aperte.

```tsx
function RiepilogoCaricoDiagram(props: {
  areaKey: string;
  card: RiepilogoAreaCard;
}) {
  // Componenti con attività (pending o issues aperti)
  const activeSubKeys = new Set([
    ...props.card.pendingItems.map(p => p.subKey),
    ...props.card.openIssues.map(i => i.subKey),
  ]);

  // Per ogni hotspot in CARICO_HOTSPOTS con subKey attivo,
  // disegna una freccia colorata dal dotX/dotY verso il margine destro
  // usando STATUS_COLORS["maint"] per pending, STATUS_COLORS["issue"] per issues

  return (
    <div className="eur-riepilogo-carico-layout" data-area-key={props.areaKey}>
      <div className="eur-riepilogo-carico-svg">
        {/* SVG CaricoDiagram in modalità read-only — senza onClick */}
        {/* + overlay frecce per componenti attivi */}
      </div>
      <div className="eur-riepilogo-carico-list">
        {/* lista lavori da fare e problemi */}
      </div>
    </div>
  );
}
```

Il SVG in questa vista è read-only — nessun onClick, nessun onSelectSub.
Le frecce sono `<line>` + `<polygon>` (punta freccia) aggiunte come layer
sopra il disegno esistente.

---

## 9. CSS DA AGGIUNGERE in `next-euromecc.css`

```css
.eur-riepilogo-mappa        /* wrapper mappa + legenda */
.eur-riepilogo-legenda       /* riga legenda colori */
.eur-riepilogo-cards         /* grid card aree */
.eur-riepilogo-card          /* singola card area */
.eur-riepilogo-card--urgency /* card con urgenza — bordo rosso */
.eur-riepilogo-card-header   /* header card con titolo + badge */
.eur-riepilogo-section       /* sezione da fare / fatte / problemi */
.eur-riepilogo-carico-layout /* layout due colonne punto di carico */
.eur-riepilogo-carico-svg    /* colonna sinistra SVG */
.eur-riepilogo-carico-list   /* colonna destra lista lavori */
.eur-riepilogo-export-bar    /* barra azioni export */
```

---

## 10. PERIMETRO FILE

### MODIFICA
- `src/next/NextEuromeccPage.tsx` — sostituzione JSX tab riepilogo +
  nuovi componenti locali + funzione generatePdfRiepilogo
- `next-euromecc.css` — nuove classi CSS riepilogo
- `package.json` — aggiunta `html2canvas`

### NON TOCCARE
- `src/utils/pdfEngine.ts`
- `src/next/domain/nextEuromeccDomain.ts`
- `src/next/euromeccAreas.ts`
- `MapSvg` — usarlo as-is, non modificarlo
- `SiloDiagram`, `CaricoDiagram` — usarli as-is, non modificarli
- `CARICO_HOTSPOTS`, `SILO_HOTSPOTS` — non modificare
- Tab Home, Manutenzione, Problemi, Relazioni — non toccare
- Qualsiasi altro file

### SE SERVE TOCCARE FILE EXTRA
- Fermati e scrivi: `SERVE FILE EXTRA: <path>`

---

## 11. DIVIETI ASSOLUTI

- Non modificare MapSvg, SiloDiagram, CaricoDiagram
- Non modificare writer Firestore esistenti
- Non aprire nuove collection Firestore (archivio PDF è fase 2)
- Non modificare pdfEngine.ts
- Non introdurre dipendenze oltre html2canvas

---

## 12. BUILD / TEST OBBLIGATORI

- `npm install html2canvas`
- `npm run build` — zero errori TypeScript
- Verifica runtime:
  1. Tab Riepilogo mostra mappa SVG impianto
  2. Card aree con pending/issues/done visibili
  3. Punti di carico mostrano layout due colonne con SVG
  4. Bottone "Esporta PDF" genera file scaricabile
  5. PDF contiene mappa impianto come immagine
  6. PDF contiene tabelle lavori per area

---

## 13. OUTPUT RICHIESTO DA CODEX

1. `PATCH COMPLETATA` oppure `PATCH PARZIALE`
2. `FILE TOCCATI:`
3. `COMPONENTI CREATI:`
4. `html2canvas:` confema installazione
5. `BUILD:` esito
6. `RUNTIME:` conferma visiva se disponibile
7. `NOTE:` anomalie o SERVE FILE EXTRA
