# SPEC — Euromecc Mega Patch

**Versione:** 1.0  
**Data:** 2026-04-09  
**Stato:** PRONTO PER IMPLEMENTAZIONE

---

## INDICE TASK

1. Nuova area `scaricoFornitore` in `euromeccAreas.ts`
2. Nuova area `compressore2` già aggiunta — aggiungere nodo in `MAP_GENERIC`
3. Nuovo nodo `scaricoFornitore` in `MAP_GENERIC`
4. Tre nuovi SVG diagram: `SalaCompressoriDiagram`, `ScaricoFornitoreDiagram`, `CaricoTrenoDiagram`
5. Branch condizionali nel selettore area per i tre nuovi diagram
6. Fix Riepilogo: click nodo mappa → pannello dettaglio laterale read-only
7. Fix PDF Riepilogo: mappa SVG visibile tramite serializzazione inline
8. Fix lista ricambi: flusso corretto estrazione → ordine su `@ordini`

---

## 1. NUOVA AREA `scaricoFornitore`

### 1.1 Aggiunta in `src/next/euromeccAreas.ts`

Aggiungi questa area generic in append alla lista esistente:

```ts
{
  key: "scaricoFornitore",
  title: "Postazione scarico fornitore",
  shortLabel: "SCF",
  type: "generic" as const,
  code: "SCF-01",
  area: "Area arrivo materiali",
  description: "Postazione di scarico cemento dai camion cisterna fornitori con attacco silo, tubazioni e quadro pneumatico.",
  base: "ok" as const,
  components: [
    { key: "attalccioFornitore", name: "Attacco fornitore", code: "SCF-01-ATT", base: "ok" as const },
    { key: "tubazioniScarico",   name: "Tubazioni scarico",  code: "SCF-01-TUB", base: "ok" as const },
    { key: "quadroPneumScarico", name: "Quadro pneumatico",  code: "SCF-01-QPN", base: "ok" as const },
    { key: "valvoleScarico",     name: "Valvole scarico",    code: "SCF-01-VLV", base: "ok" as const },
    { key: "filtroScarico",      name: "Filtro scarico",     code: "SCF-01-FIL", base: "ok" as const },
    { key: "cocelaScaricoFor",   name: "Coclea scarico",     code: "SCF-01-COC", base: "ok" as const },
  ],
}
```

---

## 2. AGGIORNAMENTO `MAP_GENERIC` in `NextEuromeccPage.tsx`

Il viewBox della mappa è `0 0 1480 860`. Aggiungi due nodi in append a `MAP_GENERIC`:

```ts
{ key: "compressore2",      x: 374,  y: 726, width: 250, height: 62 },
{ key: "scaricoFornitore",  x: 1246, y: 138, width: 220, height: 62 },
```

Logica posizionamento:
- `compressore2`: affianco a `compressore` (x=118 w=250), gap 6px → x=374, stessa riga y=726
- `scaricoFornitore`: a destra del Silo 7 (ultimo silo, area x ~1100-1200), y=138 stessa riga dei silos

**VERIFICA PRIMA DI SCRIVERE**: conferma che `compressore2` esiste già in `EUROMECC_AREAS` dopo il prompt [2]. Se non esiste: `SERVE FILE EXTRA: src/next/euromeccAreas.ts`

---

## 3. TRE NUOVI SVG DIAGRAM

Tutti seguono esattamente la firma di `SiloDiagram` e `CaricoDiagram`:

```ts
function NomeDiagram(props: {
  area: EuromeccAreaStatic;
  snapshot: EuromeccSnapshot;
  currentSub: string | null;
  onSelectSub: (key: string) => void;
})
```

### 3.1 `SalaCompressoriDiagram`
Usato per `compressore` E `compressore2` — mostra entrambi insieme.
SVG viewBox `0 0 760 640`.

Struttura SVG (copia esatta — non modificare le forme):
```svg
<!-- CONTAINER -->
<rect x="20" y="20" width="720" height="580" rx="4" fill="#D8D4CC" stroke="#A0998A" stroke-width="2"/>
<rect x="20" y="20" width="720" height="40" rx="4" fill="#C8C4BC" stroke="#A0998A" stroke-width="1.5"/>
<!-- FINESTRA -->
<rect x="580" y="90" width="130" height="95" rx="4" fill="#C0C4CC" stroke="#8A9099" stroke-width="1.5"/>
<rect x="586" y="96" width="118" height="83" rx="2" fill="#B0B8C4"/>
<line x1="586" y1="112" x2="704" y2="112" stroke="#8A9099" stroke-width="1.5"/>
<line x1="586" y1="126" x2="704" y2="126" stroke="#8A9099" stroke-width="1.5"/>
<line x1="586" y1="140" x2="704" y2="140" stroke="#8A9099" stroke-width="1.5"/>
<line x1="586" y1="154" x2="704" y2="154" stroke="#8A9099" stroke-width="1.5"/>
<line x1="586" y1="168" x2="704" y2="168" stroke="#8A9099" stroke-width="1.5"/>
<!-- PAVIMENTO -->
<rect x="20" y="550" width="720" height="50" rx="2" fill="#9A9890" stroke="#7A7868" stroke-width="1.5"/>
<!-- ACCUMULATORE N.1 -->
<rect x="38" y="78" width="110" height="420" rx="50" fill="#4A90D8" stroke="#2A6098" stroke-width="2.5"/>
<rect x="38" y="78" width="26" height="420" rx="50" fill="#6AB0F0" opacity="0.5"/>
<ellipse cx="93" cy="78" rx="55" ry="20" fill="#5AA0E8" stroke="#2A6098" stroke-width="2"/>
<ellipse cx="93" cy="498" rx="55" ry="20" fill="#3A7AC8" stroke="#2A6098" stroke-width="2"/>
<circle cx="93" cy="220" r="15" fill="#E8EFF6" stroke="#2A6098" stroke-width="2"/>
<rect x="76" y="488" width="34" height="14" rx="3" fill="#C03020" stroke="#902010" stroke-width="1.5"/>
<!-- ACCUMULATORE N.2 -->
<rect x="158" y="88" width="100" height="400" rx="46" fill="#4A90D8" stroke="#2A6098" stroke-width="2.5"/>
<rect x="158" y="88" width="22" height="400" rx="46" fill="#6AB0F0" opacity="0.45"/>
<ellipse cx="208" cy="88" rx="50" ry="18" fill="#5AA0E8" stroke="#2A6098" stroke-width="2"/>
<ellipse cx="208" cy="488" rx="50" ry="18" fill="#3A7AC8" stroke="#2A6098" stroke-width="2"/>
<circle cx="208" cy="230" r="14" fill="#E8EFF6" stroke="#2A6098" stroke-width="2"/>
<rect x="191" y="480" width="34" height="14" rx="3" fill="#C03020" stroke="#902010" stroke-width="1.5"/>
<!-- COMPRESSORE N.1 -->
<rect x="288" y="340" width="165" height="210" rx="8" fill="#3A7AC8" stroke="#2A5898" stroke-width="2.5"/>
<rect x="298" y="350" width="145" height="160" rx="4" fill="#2A6098" stroke="#1A4878" stroke-width="1.5"/>
<rect x="310" y="362" width="80" height="40" rx="3" fill="#1A3040" stroke="#0A2030" stroke-width="1"/>
<circle cx="414" cy="382" r="12" fill="#C03020" stroke="#902010" stroke-width="2"/>
<rect x="310" y="438" width="80" height="14" rx="2" fill="#1A4878"/>
<rect x="310" y="458" width="120" height="40" rx="3" fill="#1A3848" stroke="#0A2030" stroke-width="1"/>
<!-- ESSICCATORE N.1 -->
<rect x="296" y="248" width="148" height="88" rx="6" fill="#8A9099" stroke="#6A7080" stroke-width="2"/>
<rect x="306" y="258" width="80" height="58" rx="3" fill="#6A7080" stroke="#5A6070" stroke-width="1"/>
<!-- COMPRESSORE N.2 -->
<rect x="490" y="300" width="175" height="250" rx="8" fill="#3A7AC8" stroke="#2A5898" stroke-width="2.5"/>
<rect x="500" y="312" width="155" height="185" rx="4" fill="#2A6098" stroke="#1A4878" stroke-width="1.5"/>
<rect x="512" y="324" width="90" height="50" rx="3" fill="#1A3040" stroke="#0A2030" stroke-width="1"/>
<circle cx="630" cy="342" r="14" fill="#C03020" stroke="#902010" stroke-width="2"/>
<rect x="512" y="440" width="90" height="14" rx="2" fill="#1A4878"/>
<rect x="512" y="460" width="130" height="30" rx="3" fill="#1A3848" stroke="#0A2030" stroke-width="1"/>
<!-- ESSICCATORE N.2 OMI -->
<rect x="498" y="196" width="158" height="100" rx="6" fill="#3A7AC8" stroke="#2A5898" stroke-width="2"/>
<rect x="508" y="206" width="70" height="54" rx="3" fill="#1A3040" stroke="#0A2030" stroke-width="1"/>
<rect x="584" y="206" width="60" height="22" rx="3" fill="#1A4878"/>
<rect x="584" y="234" width="60" height="52" rx="3" fill="#2A5888" stroke="#1A3868" stroke-width="1"/>
```

Hotspot per `compressore` e `compressore2` — usa lo stesso array `SALA_COMPRESSORI_HOTSPOTS` con pattern leader line (dotX/dotY/labelX/labelY) come `CARICO_HOTSPOTS`:

```ts
const SALA_COMPRESSORI_HOTSPOTS: readonly SiloHotspot[] = [
  { key: "blower",            label: "Blower / vite",        x:288, y:340, width:160, height:52, dotX:370, dotY:420, labelX:100, labelY:380 },
  { key: "filtroAria",        label: "Filtro aria",          x:288, y:340, width:160, height:52, dotX:350, dotY:460, labelX:100, labelY:430 },
  { key: "lubrificazione",    label: "Lubrificazione",       x:288, y:340, width:160, height:52, dotX:310, dotY:480, labelX:100, labelY:480 },
  { key: "filtroOlio",        label: "Filtro olio",          x:288, y:340, width:160, height:52, dotX:330, dotY:500, labelX:100, labelY:510 },
  { key: "filtroScambiatore", label: "Filtro scambiatore",   x:288, y:340, width:160, height:52, dotX:360, dotY:510, labelX:100, labelY:540 },
  { key: "essiccatore",       label: "Essiccatore",          x:296, y:248, width:148, height:88, dotX:370, dotY:290, labelX:560, labelY:160 },
  { key: "cinghie",           label: "Cinghie",              x:288, y:340, width:160, height:52, dotX:430, dotY:370, labelX:560, labelY:340 },
  { key: "byPass",            label: "By-pass",              x:288, y:340, width:160, height:52, dotX:420, dotY:400, labelX:560, labelY:390 },
  { key: "accumulatore",      label: "Accumulatore aria",    x:38,  y:78,  width:110, height:420, dotX:93,  dotY:220, labelX:560, labelY:240 },
  { key: "scaricatoreCondensa",label:"Scaricatore condensa", x:38,  y:78,  width:110, height:420, dotX:93,  dotY:490, labelX:560, labelY:460 },
] as const;
```

**Nota importante**: `SalaCompressoriDiagram` viene mostrato sia per `compressore` che per `compressore2`. I componenti sono identici — la differenza è solo nell'`areaKey` passato come prop, che determina quali record Firestore vengono letti.

### 3.2 `ScaricoFornitoreDiagram`
SVG viewBox `0 0 680 700`. Struttura:

```svg
<!-- COLLETTORE SUPERIORE -->
<rect x="30" y="98" width="400" height="18" rx="4" fill="#B0B8C4" stroke="#7A8290" stroke-width="1.2"/>
<rect x="30" y="112" width="400" height="5" fill="#7A8290" opacity="0.3"/>
<!-- SILO (sfondo) -->
<rect x="30" y="60" width="110" height="380" rx="8" fill="#C8CDD4" stroke="#8A9099" stroke-width="1.5"/>
<ellipse cx="85" cy="60" rx="55" ry="18" fill="#B8BEC6" stroke="#8A9099" stroke-width="1.5"/>
<!-- CORPO SILO con anelli rinforzo -->
<rect x="148" y="88" width="200" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" stroke-width="0.5"/>
<rect x="148" y="145" width="200" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" stroke-width="0.5"/>
<rect x="148" y="200" width="200" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" stroke-width="0.5"/>
<rect x="148" y="255" width="200" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" stroke-width="0.5"/>
<rect x="148" y="310" width="200" height="7" rx="1" fill="#B0B8C4" stroke="#8A9099" stroke-width="0.5"/>
<!-- TUBAZIONI VERTICALI SCARICO -->
<rect x="200" y="116" width="16" height="350" rx="3" fill="#B8BEC6" stroke="#8A9099" stroke-width="1.5"/>
<rect x="200" y="116" width="5" height="350" fill="#D0D5DC" opacity="0.55"/>
<rect x="220" y="116" width="14" height="330" rx="3" fill="#B0B8C4" stroke="#8A9099" stroke-width="1.2"/>
<!-- flange tubi -->
<rect x="197" y="180" width="40" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
<rect x="197" y="280" width="40" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
<rect x="197" y="380" width="40" height="5" rx="1" fill="#8A9099" opacity="0.65"/>
<!-- ATTACCO FORNITORE (flessibile) -->
<path d="M216 420 Q216 460 240 480 Q270 500 280 540" fill="none" stroke="#8A9099" stroke-width="14" stroke-linecap="round"/>
<path d="M216 420 Q216 460 240 480 Q270 500 280 540" fill="none" stroke="#D0D5DC" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
<!-- raccordo attacco -->
<ellipse cx="283" cy="545" rx="18" ry="8" fill="#7A8290" stroke="#5A6270" stroke-width="2"/>
<rect x="266" y="540" width="34" height="18" rx="4" fill="#8A9099" stroke="#5A6270" stroke-width="2"/>
<!-- QUADRO PNEUMATICO -->
<rect x="340" y="300" width="60" height="80" rx="5" fill="#C8CDD4" stroke="#8A9099" stroke-width="1.8"/>
<rect x="340" y="300" width="60" height="18" rx="5" fill="#9A9FA8"/>
<circle cx="356" cy="332" r="5" fill="#8A9099" opacity="0.7"/>
<circle cx="372" cy="332" r="5" fill="#8A9099" opacity="0.7"/>
<circle cx="388" cy="332" r="5" fill="#8A9099" opacity="0.7"/>
<circle cx="356" cy="350" r="5" fill="#8A9099" opacity="0.7"/>
<circle cx="372" cy="350" r="5" fill="#8A9099" opacity="0.7"/>
<circle cx="388" cy="350" r="5" fill="#8A9099" opacity="0.7"/>
<!-- FILTRO SCARICO -->
<rect x="248" y="200" width="70" height="90" rx="6" fill="#C8CDD4" stroke="#8A9099" stroke-width="1.8"/>
<rect x="248" y="200" width="70" height="18" rx="6" fill="#B0B8C4"/>
<line x1="248" y1="250" x2="318" y2="250" stroke="#8A9099" stroke-width="1" stroke-dasharray="4 3" opacity="0.5"/>
<!-- COCLEA SCARICO -->
<rect x="150" y="465" width="180" height="16" rx="5" fill="#B8BEC6" stroke="#8A9099" stroke-width="1.8"/>
<rect x="168" y="461" width="8" height="24" rx="1" fill="#9A9FA8" stroke="#7A8290" stroke-width="1"/>
<rect x="220" y="461" width="8" height="24" rx="1" fill="#9A9FA8" stroke="#7A8290" stroke-width="1"/>
<!-- SUOLO -->
<rect x="0" y="490" width="500" height="80" fill="#B8B4A8" opacity="0.35"/>
<line x1="0" y1="490" x2="500" y2="490" stroke="#A0998A" stroke-width="2.5"/>
```

Hotspot `SCARICO_FORNITORE_HOTSPOTS`:
```ts
const SCARICO_FORNITORE_HOTSPOTS: readonly SiloHotspot[] = [
  { key: "attalccioFornitore",  label: "Attacco fornitore",  x:266, y:540, width:130, height:52, dotX:283, dotY:545, labelX:430, labelY:450 },
  { key: "tubazioniScarico",    label: "Tubazioni scarico",  x:200, y:116, width:130, height:52, dotX:208, dotY:280, labelX:430, labelY:200 },
  { key: "filtroScarico",       label: "Filtro scarico",     x:248, y:200, width:130, height:52, dotX:283, dotY:245, labelX:430, labelY:280 },
  { key: "quadroPneumScarico",  label: "Quadro pneumatico",  x:340, y:300, width:130, height:52, dotX:370, dotY:340, labelX:430, labelY:340 },
  { key: "valvoleScarico",      label: "Valvole scarico",    x:340, y:300, width:130, height:52, dotX:356, dotY:350, labelX:430, labelY:390 },
  { key: "cocelaScaricoFor",    label: "Coclea scarico",     x:150, y=465, width:130, height:52, dotX:240, dotY:473, labelX:430, labelY:490 },
] as const;
```

### 3.3 `CaricoTrenoDiagram`
SVG viewBox `0 0 680 820`. Copia esatta dell'SVG già approvato in chat (carico treno v2 con vagone, binario, filtro, silo, tubazioni, struttura portante, proboscide, quadro comando).

Hotspot `CARICO_TRENO_HOTSPOTS`:
```ts
const CARICO_TRENO_HOTSPOTS: readonly SiloHotspot[] = [
  { key: "filtro",              label: "Filtro anti-polvere", x:272, y:82,  width:160, height:52, dotX:300, dotY:100, labelX:80,  labelY:62  },
  { key: "proboscide",          label: "Proboscide",          x:282, y:340, width:160, height:52, dotX:300, dotY:490, labelX:80,  labelY:490 },
  { key: "scaricatoreTelesc",   label: "Scaricatore telesc.", x:282, y=340, width:160, height:52, dotX:300, dotY:520, labelX:80,  labelY:530 },
  { key: "cartucce",            label: "Cartucce",            x:282, y:340, width:160, height:52, dotX:300, dotY:550, labelX:80,  labelY:570 },
  { key: "gruppoFR",            label: "Gruppo FR",           x:282, y:340, width:160, height:52, dotX:300, dotY:420, labelX:510, labelY:420 },
  { key: "scaricatoreCondensa", label: "Scaricatore condensa",x:282, y:340, width:160, height:52, dotX:300, dotY:395, labelX:510, labelY:360 },
] as const;
```

---

## 4. BRANCH CONDIZIONALI NEL SELETTORE AREA

In `NextEuromeccPage.tsx`, nel blocco condizionale che oggi ha:
```
type === "silo" → SiloDiagram
key === "carico1" || "carico2" → CaricoDiagram
generic → ComponentSelector (fallback)
```

Aggiungi questi rami **prima** del fallback `ComponentSelector`:

```tsx
} else if (currentAreaData.key === "compressore" || currentAreaData.key === "compressore2") {
  return <SalaCompressoriDiagram area={currentAreaData} snapshot={snapshot} currentSub={detailSubKey} onSelectSub={setCurrentDetailSub} />;
} else if (currentAreaData.key === "caricoRail") {
  return <CaricoTrenoDiagram area={currentAreaData} snapshot={snapshot} currentSub={detailSubKey} onSelectSub={setCurrentDetailSub} />;
} else if (currentAreaData.key === "scaricoFornitore") {
  return <ScaricoFornitoreDiagram area={currentAreaData} snapshot={snapshot} currentSub={detailSubKey} onSelectSub={setCurrentDetailSub} />;
}
```

---

## 5. FIX RIEPILOGO — CLICK MAPPA → DETTAGLIO

### 5.1 Problema attuale
In `RiepilogoMappaImpianto` la mappa è read-only (nessun onClick). Non mostra dettaglio al click.

### 5.2 Fix
Nel componente `RiepilogoMappaImpianto`, passa un handler `onSelectArea` a `MapSvg` che aggiorna uno stato locale `selectedAreaKey`.

Quando `selectedAreaKey` è impostato, mostra un pannello laterale read-only con:
- Titolo area + codice + stato
- Sezione "Da fare" — lista pending filtrati per `areaKey`
- Sezione "Fatte recenti" — ultimi 5 done filtrati per `areaKey`  
- Sezione "Problemi aperti" — issues filtrate per `areaKey`
- Nessun bottone di modifica — solo visualizzazione

```tsx
function RiepilogoMappaImpianto(props: {
  snapshot: EuromeccSnapshot;
  range: EuromeccRange;
}) {
  const [selectedAreaKey, setSelectedAreaKey] = React.useState<string | null>(null);

  const selectedCard = selectedAreaKey
    ? buildRiepilogoCards(props.snapshot, props.range)
        .find(c => c.areaKey === selectedAreaKey) ?? null
    : null;

  return (
    <div className="eur-riepilogo-mappa-wrapper">
      <div className="eur-riepilogo-mappa">
        <MapSvg
          snapshot={props.snapshot}
          currentArea={selectedAreaKey ?? ""}
          onSelectArea={setSelectedAreaKey}
        />
      </div>
      {selectedCard ? (
        <div className="eur-riepilogo-mappa-detail">
          <div className="eur-riepilogo-mappa-detail-header">
            <span className="eur-th">{selectedCard.areaLabel}</span>
            <span className="eur-ts">{selectedCard.areaCode}</span>
            <button onClick={() => setSelectedAreaKey(null)} className="eur-btn-close">×</button>
          </div>
          {selectedCard.pendingItems.length > 0 && (
            <div className="eur-riepilogo-mappa-section">
              <p className="eur-ts eur-label-amber">Da fare ({selectedCard.pendingItems.length})</p>
              {selectedCard.pendingItems.map(p => (
                <div key={p.id} className="eur-riepilogo-mappa-item">
                  <span className="eur-ts">{p.subLabel} — {p.title}</span>
                  <span className="eur-ts">{PRIORITY_LABELS[p.priority]}</span>
                </div>
              ))}
            </div>
          )}
          {selectedCard.doneItems.length > 0 && (
            <div className="eur-riepilogo-mappa-section">
              <p className="eur-ts eur-label-green">Fatte recenti</p>
              {selectedCard.doneItems.slice(0,5).map(d => (
                <div key={d.id} className="eur-riepilogo-mappa-item">
                  <span className="eur-ts">{d.subLabel} — {d.title}</span>
                  <span className="eur-ts">{formatDateUI(d.doneDate)}</span>
                </div>
              ))}
            </div>
          )}
          {selectedCard.openIssues.length > 0 && (
            <div className="eur-riepilogo-mappa-section">
              <p className="eur-ts eur-label-red">Problemi aperti</p>
              {selectedCard.openIssues.map(i => (
                <div key={i.id} className="eur-riepilogo-mappa-item">
                  <span className="eur-ts">{i.subLabel} — {i.title}</span>
                </div>
              ))}
            </div>
          )}
          {selectedCard.pendingItems.length === 0 && selectedCard.doneItems.length === 0 && selectedCard.openIssues.length === 0 && (
            <p className="eur-ts">Nessuna attività registrata per questa area nel periodo selezionato.</p>
          )}
        </div>
      ) : (
        <p className="eur-ts eur-riepilogo-mappa-hint">Clicca un nodo per vedere il dettaglio dell'area.</p>
      )}
    </div>
  );
}
```

CSS aggiuntivo:
```css
.eur-riepilogo-mappa-wrapper  { display: flex; gap: 16px; align-items: flex-start; }
.eur-riepilogo-mappa          { flex: 1; min-width: 0; }
.eur-riepilogo-mappa-detail   { width: 280px; flex-shrink: 0; background: var(--color-background-secondary); border-radius: var(--border-radius-lg); padding: 16px; }
.eur-riepilogo-mappa-detail-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.eur-riepilogo-mappa-section  { margin-bottom: 12px; }
.eur-riepilogo-mappa-item     { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--color-border-tertiary); }
.eur-riepilogo-mappa-hint     { color: var(--color-text-tertiary); margin-top: 8px; }
.eur-btn-close                { margin-left: auto; background: none; border: none; cursor: pointer; font-size: 18px; color: var(--color-text-secondary); }
```

---

## 6. FIX PDF — MAPPA SVG VISIBILE

### 6.1 Problema attuale
`html2canvas` non cattura il SVG perché al momento del render il componente
`MapSvg` non è nel DOM visibile durante la fase review del PDF.

### 6.2 Fix — serializzazione SVG inline
Invece di `html2canvas`, serializza il SVG direttamente come stringa
e convertilo in immagine tramite Blob URL + Image + Canvas:

```ts
async function svgToImageData(svgElement: SVGElement): Promise<string | null> {
  try {
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgElement);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    return await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || 1480;
        canvas.height = img.naturalHeight || 860;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("no ctx")); return; }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img load failed")); };
      img.src = url;
    });
  } catch {
    return null;
  }
}
```

In `generatePdfRiepilogo`, sostituisci il blocco `html2canvas` con:
```ts
const mapEl = document.querySelector(".eur-map") as SVGElement | null;
if (mapEl) {
  const imgData = await svgToImageData(mapEl);
  if (imgData) {
    const imgW = pageW - margin * 2;
    const imgH = imgW * (860 / 1480);
    checkPage(imgH + 5);
    doc.addImage(imgData, "JPEG", margin, y, imgW, imgH);
    y += imgH + 8;
  }
}
```

Stessa logica per i SVG dei punti di carico nelle pagine dettaglio —
usa `svgToImageData` invece di `html2canvas` su `.eur-silo-diagram`.

---

## 7. FIX LISTA RICAMBI

### 7.1 Problema attuale
Il flusso "Lista ricambi" non funziona correttamente — i materiali non vengono
estratti e l'ordine non viene creato.

### 7.2 Fix in `handleAnalyze` quando `documentoTipo === "ricambi"`

Il prompt AI per lista ricambi deve essere diverso da quello delle relazioni.
Sostituisci il ramo ricambi di `handleAnalyze` con:

```ts
if (state.documentoTipo === "ricambi") {
  const ricambiPrompt = `Sei un assistente tecnico. Analizza questo elenco materiali/ricambi e restituisci SOLO JSON valido, senza markdown, senza backtick, senza testo aggiuntivo.

STRUTTURA RICHIESTA:
{
  "dataDocumento": "yyyy-MM-dd",
  "azienda": "nome azienda destinataria",
  "items": [
    {
      "descrizione": "descrizione completa materiale",
      "quantita": numero,
      "unita": "pz",
      "codiceArticolo": "codice se presente altrimenti stringa vuota",
      "note": "note aggiuntive se presenti"
    }
  ]
}

REGOLE:
- Estrai TUTTI i materiali elencati, uno per uno
- Se la quantità non è specificata usa 1
- Se l'unità non è specificata usa "pz"
- dataDocumento: la data indicata nel documento in formato yyyy-MM-dd
- azienda: il nome dell'azienda destinataria (non Euromecc)
- Non inventare materiali non presenti

DOCUMENTO:`;

  const pdfBase64 = await fileToBase64(state.file);
  apiPayload = { inputText: ricambiPrompt, imageBase64: pdfBase64 };

  const rawResult = await callPdfAiEnhance(apiPayload);
  const cleaned = rawResult
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/```json/g, "").replace(/```/g, "").trim();

  const parsed = JSON.parse(cleaned) as {
    dataDocumento: string;
    azienda: string;
    items: Array<{ descrizione: string; quantita: number; unita: string; codiceArticolo: string; note: string }>;
  };

  const ricambiPayload: RicambiAiPayload = {
    dataDocumento: parsed.dataDocumento ?? today,
    azienda: parsed.azienda ?? "",
    items: (parsed.items ?? []).map(item => ({
      descrizione: item.descrizione,
      quantita: item.quantita ?? 1,
      unita: item.unita ?? "pz",
      codiceArticolo: item.codiceArticolo ?? "",
      note: item.note ?? "",
      selected: true,
    })),
  };

  setState(prev => ({ ...prev, phase: "review", ricambiPayload }));
  return;
}
```

### 7.3 Fix in `handleCreaOrdineRicambi`
Verifica che la funzione scriva correttamente su `storage/@ordini` seguendo
il pattern: `getDoc` → append → `setDoc merge:true`.
Se non esiste ancora la funzione, implementala come da SPEC_EUROMECC_DOCUMENTI_RICAMBI.md sezione 3.6.

### 7.4 Fix UI review ricambi
Quando `phase === "review"` e `documentoTipo === "ricambi"` e `ricambiPayload` è valorizzato,
mostra lista items con spunte individuali, campi descrizione/quantità editabili,
campo fornitore (default "Euromecc"), data ordine, bottone "Crea ordine in Materiali da ordinare".

---

## 8. PERIMETRO FILE

### MODIFICA
- `src/next/euromeccAreas.ts` — nuova area `scaricoFornitore`
- `src/next/NextEuromeccPage.tsx` — tutto il resto
- `src/next/next-euromecc.css` — CSS mappa dettaglio riepilogo
- `src/utils/cloneWriteBarrier.ts` — deroga Storage e @ordini (se non già presente da SPEC_EUROMECC_DOCUMENTI_RICAMBI)

### NON TOCCARE
- `src/utils/pdfEngine.ts`
- `src/pages/` — nessun file madre
- Qualsiasi altro file

### SE SERVE TOCCARE FILE EXTRA
- Fermati: `SERVE FILE EXTRA: <path>`

---

## 9. DIVIETI ASSOLUTI

- Non modificare `SiloDiagram`, `CaricoDiagram`, `MapSvg`
- Non modificare writer Firestore esistenti in `nextEuromeccDomain.ts`
- Non aprire nuove collection oltre quelle già autorizzate
- Non introdurre nuove dipendenze npm
- Non toccare la madre

---

## 10. ORDINE DI ESECUZIONE CONSIGLIATO

1. `euromeccAreas.ts` — nuova area
2. `MAP_GENERIC` — due nuovi nodi
3. Tre array hotspot + tre componenti diagram
4. Branch condizionali selettore
5. `RiepilogoMappaImpianto` refactor con click + pannello
6. `svgToImageData` + fix PDF
7. Fix `handleAnalyze` ricambi + `handleCreaOrdineRicambi`
8. CSS aggiuntivo
9. `cloneWriteBarrier` deroghe se mancanti
10. Build

---

## 11. BUILD / TEST OBBLIGATORI

- `npm run build` — zero errori TypeScript
- Verifica runtime:
  1. Nuovi nodi `compressore2` e `scaricoFornitore` visibili nella mappa
  2. Click `compressore` o `compressore2` → apre `SalaCompressoriDiagram`
  3. Click `caricoRail` → apre `CaricoTrenoDiagram`
  4. Click `scaricoFornitore` → apre `ScaricoFornitoreDiagram`
  5. Tab Riepilogo → click nodo mappa → pannello dettaglio laterale
  6. Esporta PDF → mappa visibile come immagine
  7. Lista ricambi → Analizza → review items → Crea ordine → ordine in Materiali da ordinare

---

## 12. OUTPUT RICHIESTO DA CODEX

1. `PATCH COMPLETATA` oppure `PATCH PARZIALE`
2. `FILE TOCCATI:`
3. `AREE AGGIUNTE:` `scaricoFornitore` confermata
4. `NODI MAPPA:` `compressore2` e `scaricoFornitore` confermati
5. `DIAGRAM CREATI:` tre componenti
6. `RIEPILOGO CLICK MAPPA:` confermato
7. `FIX PDF SVG:` metodo usato
8. `FIX RICAMBI:` confermato
9. `BUILD:` esito
10. `NOTE:` anomalie o SERVE FILE EXTRA
