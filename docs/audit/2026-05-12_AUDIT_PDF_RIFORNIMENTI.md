# AUDIT — Meccanismo PDF Rifornimenti (NEXT + madre legacy)

## 1. METADATI

- **Data**: 2026-05-12
- **Modalità**: READ-ONLY (R0 anti-allucinazione applicato — ogni claim ha `path:line`)
- **Scopo**: documentare lo stack PDF rifornimenti esistente per decidere come replicarlo nell'export PDF dell'Archivio Storico NEXT
- **Perimetro letture**: `src/next/`, `src/pages/`, `src/components/`, `src/utils/`, `package.json`

---

## 2. PDF NEXT — INVENTARIO

Stack centrale: **un solo motore** `src/utils/pdfEngine.ts` (≈3500 righe, 16 generatori PDF esportati) + **un solo helper preview/share** `src/utils/pdfPreview.ts` + **un solo componente modale** `src/components/PdfPreviewModal.tsx`. NEXT importa direttamente questi 3 file shared.

| Componente | Path | Ruolo |
|---|---|---|
| **Motore PDF** | [src/utils/pdfEngine.ts:1-3500+](src/utils/pdfEngine.ts) | 16 funzioni `generate*PDFBlob` con `jsPDF` + `jspdf-autotable`. `import jsPDF from "jspdf"` a [:1](src/utils/pdfEngine.ts#L1), `import autoTable from "jspdf-autotable"` a [:2](src/utils/pdfEngine.ts#L2), `import { PDFDocument, ... } from "pdf-lib"` a [:4](src/utils/pdfEngine.ts#L4) |
| **Preview/Share helpers** | [src/utils/pdfPreview.ts](src/utils/pdfPreview.ts) | `openPreview`, `revokePdfPreviewUrl`, `sharePdfFile` (Web Share API), `copyTextToClipboard`, `buildWhatsAppShareUrl`, `buildPdfShareText` |
| **Modale anteprima** | [src/components/PdfPreviewModal.tsx](src/components/PdfPreviewModal.tsx) | render PDF via `<object data={pdfUrl} type="application/pdf">` con fallback `<iframe>` ([:62-66](src/components/PdfPreviewModal.tsx#L62-L66)); bottoni Share/CopyLink/WhatsApp opzionali |
| **CSS modale** | `src/components/PdfPreviewModal.css` | stile modale |

### Consumer NEXT del motore PDF (16 totali via grep `from .*pdfEngine`)

| File NEXT consumer | Generatore usato | path |
|---|---|---|
| `NextCentroControlloParityPage.tsx` | `generateRifornimentiMensiliPDFBlob` | [src/next/NextCentroControlloParityPage.tsx:13-14](src/next/NextCentroControlloParityPage.tsx#L13-L14) |
| `NextHomeAutistiEventoModal.tsx` | `generateRifornimentoPDFBlob`, `generateSegnalazionePDFBlob`, `generateControlloPDFBlob`, `generateRichiestaAttrezzaturePDFBlob`, `generateCambioMezzoPDFBlob` | [src/next/components/NextHomeAutistiEventoModal.tsx:7](src/next/components/NextHomeAutistiEventoModal.tsx#L7) |
| `NextAutistiAdminNative.tsx` | `generateControlloPDFBlob`, `generateSegnalazionePDFBlob` | [src/next/autistiInbox/NextAutistiAdminNative.tsx](src/next/autistiInbox/NextAutistiAdminNative.tsx) |
| `NextAutistiControlliAllNative.tsx` | `generateControlloPDFBlob` | [src/next/autistiInbox/NextAutistiControlliAllNative.tsx](src/next/autistiInbox/NextAutistiControlliAllNative.tsx) |
| `NextAutistiSegnalazioniAllNative.tsx` | `generateSegnalazionePDFBlob` | [src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx](src/next/autistiInbox/NextAutistiSegnalazioniAllNative.tsx) |
| `NextRichiestaAttrezzatureAllNative.tsx` | `generateRichiestaAttrezzaturePDFBlob` | [src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx](src/next/autistiInbox/NextRichiestaAttrezzatureAllNative.tsx) |
| `NextAnalisiEconomicaPage.tsx` | `generateAnalisiEconomicaPDFBlob` | [src/next/NextAnalisiEconomicaPage.tsx](src/next/NextAnalisiEconomicaPage.tsx) |
| `NextAttrezzatureCantieriWritePanel.tsx` | `generateAttrezzatureCantieriPDFBlob` | [src/next/NextAttrezzatureCantieriWritePanel.tsx](src/next/NextAttrezzatureCantieriWritePanel.tsx) |
| `NextCapoCostiMezzoPage.tsx` | `generatePreventiviCapoPDFBlob` | [src/next/NextCapoCostiMezzoPage.tsx](src/next/NextCapoCostiMezzoPage.tsx) |
| `NextDettaglioLavoroPage.tsx` | (cerca pattern lavori) | [src/next/NextDettaglioLavoroPage.tsx](src/next/NextDettaglioLavoroPage.tsx) |
| `nextLibrettiExportDomain.ts` | export libretti | [src/next/domain/nextLibrettiExportDomain.ts](src/next/domain/nextLibrettiExportDomain.ts) |
| `internalAiReportPdf.ts` | `generateInternalAiOperationalReportPdfBlob` | [src/next/internal-ai/internalAiReportPdf.ts](src/next/internal-ai/internalAiReportPdf.ts) |
| Altri 4-5 | varie | (grep `from .*pdfEngine` ritorna 37 occorrenze totali) |

---

## 3. PDF RIFORNIMENTI — TROVATO/NON TROVATO

**TROVATO sia in NEXT sia in madre, con pattern parity (PROMPT 27.x ha portato il pattern da madre a NEXT)**.

### 3.1 In NEXT (consumer principale)

[src/next/NextCentroControlloParityPage.tsx](src/next/NextCentroControlloParityPage.tsx) — Tab "Report rifornimenti" del CC:

- **Bottone trigger**: "Anteprima PDF" (etichetta in inglese/italiano) chiama `handlePreviewPdf` ([:1386](src/next/NextCentroControlloParityPage.tsx#L1386))
- **State preview**:
  - `pdfPreviewFileName` ([:795](src/next/NextCentroControlloParityPage.tsx#L795)) default `"rifornimenti-mensili.pdf"`
  - `pdfPreviewTitle` ([:796](src/next/NextCentroControlloParityPage.tsx#L796)) default `"Anteprima PDF rifornimenti"`
- **Costruzione input PDF**: `buildPdfItems()` ([:1324](src/next/NextCentroControlloParityPage.tsx#L1324)) → array `RifornimentiMensiliPdfItem[]`
- **Generazione**: `generateRifornimentiMensiliPDFBlob({mese, anno, items, filters, mediaFlotta, anomalieSummary, anomalieDettaglio})` ([:1400-1418](src/next/NextCentroControlloParityPage.tsx#L1400-L1418))
- **Apertura preview**: `openPreview({source, fileName, previousUrl})` ([:1398](src/next/NextCentroControlloParityPage.tsx#L1398))
- **Share**: `handleSharePdf` ([:1439](src/next/NextCentroControlloParityPage.tsx#L1439)) → `sharePdfFile({blob, fileName, title, text})` con fallback `copyTextToClipboard(buildShareMessage())`
- **WhatsApp**: `handleWhatsAppPdf` → `window.open(buildWhatsAppShareUrl(buildShareMessage()))`
- **Modale render**: `<PdfPreviewModal open={pdfPreviewOpen} title={pdfPreviewTitle} pdfUrl={pdfPreviewUrl} fileName={pdfPreviewFileName} onClose={...} onShare={...} onCopyLink={...} onWhatsApp={...} />` (pattern coerente con altri moduli NEXT)

### 3.2 In madre legacy (parity originale, intoccabile)

[src/pages/CentroControllo.tsx](src/pages/CentroControllo.tsx) — stesso pattern, stessa pipeline:
- Import generatori a [:16](src/pages/CentroControllo.tsx#L16) `generateRifornimentiMensiliPDFBlob`
- Tipo `RifornimentiMensiliPdfItem` a [:18](src/pages/CentroControllo.tsx#L18)
- State preview ([:577-580](src/pages/CentroControllo.tsx#L577-L580)) identico a NEXT
- `buildPdfItems` a [:983](src/pages/CentroControllo.tsx#L983)
- `generateRifornimentiMensiliPDFBlob({...})` a [:1080](src/pages/CentroControllo.tsx#L1080)

> **Memo userMemories**: la madre legacy è in dismissione. La sua presenza qui è solo come pattern di riferimento; il fix archivio deve guardare alla copia NEXT (PROMPT 27.x già portata a parità).

### 3.3 Generatore singolo rifornimento

Esiste anche `generateRifornimentoPDFBlob(payload)` ([src/utils/pdfEngine.ts:2116](src/utils/pdfEngine.ts#L2116)) per **singolo record rifornimento** (usato dal modale Evento autista).

---

## 4. LIBRERIE PDF DEL PROGETTO

Da `package.json` (cwd):

| Libreria | Versione | Ruolo | Consumer reali |
|---|---|---|---|
| `jspdf` | ^3.0.3 | Generatore PDF imperativo (text/page/format) | [src/utils/pdfEngine.ts:1](src/utils/pdfEngine.ts#L1) `import jsPDF from "jspdf"` — usato in tutti i 16 generatori |
| `jspdf-autotable` | ^5.0.2 | Plugin tabelle per jspdf | [src/utils/pdfEngine.ts:2](src/utils/pdfEngine.ts#L2) `import autoTable from "jspdf-autotable"` — usato per tabelle (Rifornimenti mensili, Lavori, Tabella generica, etc.) |
| `pdf-lib` | ^1.17.1 | Manipolazione PDF (merge/embed font/sign) | [src/utils/pdfEngine.ts:4](src/utils/pdfEngine.ts#L4) `import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib"` — usato per libretti (firma, watermark, font std) |
| `html2canvas` | ^1.4.1 | Cattura HTML→canvas (alternativa a jspdf per layout complessi) | Cita `html2canvas` solo in chunk import dynamic vite (rilevato durante build, vedi warning vite); consumer specifico non confermato in grep diretto |
| `pdfjs-dist` | ^5.6.205 | Rendering PDF lato client (visualizzazione) | Non consumer trovato in `import` diretto NEXT/madre; probabilmente usato come fallback del `<object data>` in `PdfPreviewModal` quando il browser non supporta nativo (verificare); o lasciato come dipendenza preventiva |

**Stack consolidato in produzione**: `jsPDF + jspdf-autotable` (motore principale), `pdf-lib` (libretti), `<object>/<iframe>` (preview). Web Share API navigator.share per condivisione.

---

## 5. ALTRI PDF NEL SISTEMA

`pdfEngine.ts` esporta **16 generatori PDF** (grep `^export async function generate.*PDFBlob`):

| Generatore | Path:line | Scope |
|---|---|---|
| `generateSmartPDFBlob` | [:1218](src/utils/pdfEngine.ts#L1218) | Generico smart (config-driven) |
| `generateLavoriPDFBlob` | [:1235](src/utils/pdfEngine.ts#L1235) | Lavori (lista) |
| `generateTablePDFBlob` | [:1251](src/utils/pdfEngine.ts#L1251) | Tabella generica |
| `generateAttrezzatureCantieriPDFBlob` | [:1460](src/utils/pdfEngine.ts#L1460) | Attrezzature cantieri |
| `generateMezzoPDFBlob` | [:1475](src/utils/pdfEngine.ts#L1475) | Scheda mezzo |
| `generateLibrettiPhotosPDFBlob` | [:1738](src/utils/pdfEngine.ts#L1738) | Libretti foto |
| `generateSegnalazionePDFBlob` | [:1892](src/utils/pdfEngine.ts#L1892) | Singola segnalazione |
| `generateControlloPDFBlob` | [:1974](src/utils/pdfEngine.ts#L1974) | Singolo controllo |
| `generateRichiestaAttrezzaturePDFBlob` | [:2046](src/utils/pdfEngine.ts#L2046) | Singola richiesta attrezzature |
| `generateRifornimentoPDFBlob` | [:2116](src/utils/pdfEngine.ts#L2116) | Singolo rifornimento |
| `generateCambioMezzoPDFBlob` | [:2193](src/utils/pdfEngine.ts#L2193) | Cambio mezzo |
| `generateDossierMezzoPDFBlob` | [:2419](src/utils/pdfEngine.ts#L2419) | Dossier completo mezzo |
| `generateAnalisiEconomicaPDFBlob` | [:2871](src/utils/pdfEngine.ts#L2871) | Analisi economica |
| `generateRifornimentiMensiliPDFBlob` | [:3244](src/utils/pdfEngine.ts#L3244) | **Rifornimenti mensili (focus audit)** |
| `generateManutenzioniProgrammatePDFBlob` | [:3301](src/utils/pdfEngine.ts#L3301) | Manutenzioni programmate |
| `generatePreventiviCapoPDFBlob` | [:3460](src/utils/pdfEngine.ts#L3460) | Preventivi capo |

Plus 1 generato dall'agent: `generateInternalAiOperationalReportPdfBlob` (esportato da `pdfEngine.ts` non confermato qui, ma importato in [src/next/internal-ai/internalAiReportPdf.ts](src/next/internal-ai/internalAiReportPdf.ts)).

**Per l'archivio storico sono particolarmente rilevanti**:
- `generateLavoriPDFBlob` ([:1235](src/utils/pdfEngine.ts#L1235)) → sub-tab Lavori
- `generateManutenzioniProgrammatePDFBlob` ([:3301](src/utils/pdfEngine.ts#L3301)) → sub-tab Manutenzioni (verificare se compatibile con storico passato, l'attuale è "programmate")
- `generateSegnalazionePDFBlob` ([:1892](src/utils/pdfEngine.ts#L1892)) + `generateRichiestaAttrezzaturePDFBlob` ([:2046](src/utils/pdfEngine.ts#L2046)) → sono **PDF singolo record**, non lista cumulativa
- `generateTablePDFBlob` ([:1251](src/utils/pdfEngine.ts#L1251)) → generico per tabelle qualunque shape

---

## 6. FLUSSO PATTERN RIFORNIMENTI (NEXT)

Flusso step-by-step ricostruito da `NextCentroControlloParityPage.tsx`:

```
[USER click bottone "Anteprima PDF"]
    │
    ▼
handlePreviewPdf()                                     [:1386]
    │
    ├── Validazioni: selectedMonth/Year != "all", filteredMonthlyRefuels.length > 0
    │
    ├── setGeneratingPdf(true)
    │
    ▼
openPreview({                                          [src/utils/pdfPreview.ts:46]
  source: () => generateRifornimentiMensiliPDFBlob({   [:3244 di pdfEngine.ts]
    mese, anno, items, filters, mediaFlotta,
    anomalieSummary, anomalieDettaglio,
  }),
  fileName: "rifornimenti_mensili_{MM-YYYY}.pdf",
  previousUrl: pdfPreviewUrl,
})
    │
    │ openPreview interno:
    │ 1. risolve source (chiama la funzione async)
    │ 2. revoca URL precedente (revokePdfPreviewUrl)
    │ 3. crea blob:URL da URL.createObjectURL(blob)
    │ 4. ritorna { blob, fileName, url }
    │
    ▼
setPdfPreview{Blob,FileName,Title,Url}(...)
setPdfPreviewOpen(true)
    │
    ▼
<PdfPreviewModal open                                  [src/components/PdfPreviewModal.tsx:17]
    title={"Anteprima PDF rifornimenti MM YYYY"}
    pdfUrl={pdfPreviewUrl}                             // blob:URL
    fileName={pdfPreviewFileName}
    onClose={...}
    onShare={handleSharePdf}                           [:1439 Parity]
    onCopyLink={handleCopyPdfText}                     [:1380]
    onWhatsApp={handleWhatsAppPdf}                     [:1385]
/>

Modale renderizza:
    <object data={blob:URL} type="application/pdf">    [PdfPreviewModal.tsx:63]
      <iframe src={blob:URL} />                        [fallback per browser senza <object>]
    </object>

[USER click SHARE]
    │
    ▼
handleSharePdf()                                       [:1439]
    │
    ├── Se !pdfPreviewBlob: fallback copyTextToClipboard(buildShareMessage())
    │
    ▼
sharePdfFile({blob, fileName, title, text})            [pdfPreview.ts:73]
    │
    │ Web Share API:
    │ 1. nav.share supportato? (mobile-first; desktop spesso unsupported)
    │ 2. nav.canShare({files:[file]}) — verifica supporto file share
    │ 3. nav.share({title, text, files:[file]})
    │ 4. ritorna { status: "shared"|"unsupported"|"aborted"|"error" }
    │
    │ Se "unsupported" sul desktop:
    │ → l'utente può usare comunque bottone "Copy link" o "WhatsApp"
```

**Note operative**:
- Il **modale anteprima è bloccato sullo schermo** (backdrop + ESC) e mostra il PDF inline tramite Object/Iframe. Funziona offline (blob:URL).
- Il pulsante `Share` è **mobile-friendly** (Web Share API). Su desktop fallisce con `status: "unsupported"` e l'utente vede solo i bottoni "Copy link" e "WhatsApp" (link `wa.me`).
- Il PDF è generato **client-side** (no backend): `jsPDF` costruisce in memoria, output blob, mostrato via Object URL.

---

## 7. RIUSABILITÀ PER ARCHIVIO STORICO

### Effort stimato: **BASSO** (drop-in con config) ✓

**Motivazione**:
1. Il modale `PdfPreviewModal` è **agnostico al contenuto** — accetta `title`, `pdfUrl`, `fileName`, e callback `onShare/onCopyLink/onWhatsApp`. Già usato da 10+ moduli NEXT.
2. La pipeline `openPreview` + `sharePdfFile` + `copyTextToClipboard` + `buildPdfShareText` + `buildWhatsAppShareUrl` è **generica e shared** ([pdfPreview.ts](src/utils/pdfPreview.ts)).
3. Lo `state` template `{pdfPreviewOpen, pdfPreviewUrl, pdfPreviewBlob, pdfPreviewFileName, pdfPreviewTitle, pdfShareHint, generatingPdf}` è copiabile 1:1 da Parity.
4. Per i 4 sub-tab archivio servono **massimo 1 nuovo generatore** (`generateArchivioStoricoPDFBlob` o varianti per-kind) — oppure si riusa `generateTablePDFBlob` ([:1251](src/utils/pdfEngine.ts#L1251)) parametrizzato.

### Strategie alternative

**Opzione A — Generatore unico per archivio** (1 nuovo `generate*PDFBlob`):
- Input: `{kind, records, filtri, periodo}` → tabella per kind con colonne specifiche
- Pro: PDF coerente per tutte le sub-tab, esporta filtri+search applicati
- Costo: ~150 righe in `pdfEngine.ts` (analogo a `generateRifornimentiMensiliPDFBlob` ~250 righe)

**Opzione B — Riuso dei generatori per-kind esistenti** (0 nuovi):
- Sub-tab Lavori: riusa `generateLavoriPDFBlob` ([:1235](src/utils/pdfEngine.ts#L1235))
- Sub-tab Manutenzioni: ⚠ `generateManutenzioniProgrammatePDFBlob` è per programmate, **non per storico** — verificare se accetta record passati
- Sub-tab Segnalazioni: `generateSegnalazionePDFBlob` è **singola segnalazione**, non lista — non adatto a lista archivio
- Sub-tab Richieste: idem `generateRichiestaAttrezzaturePDFBlob` singola
- Pro: zero nuovo codice generatore
- Contro: 2 generatori esistenti **non adatti a liste** (segn/rich), va aggiunto `generate{Segn,Rich}ListPDFBlob` → equivalente a Opzione A

**Opzione C — `generateTablePDFBlob` generico**:
- Input: `{columns, rows, title, subtitle}` → tabella semplice
- Pro: zero specializzazione, no manutenzione per nuovo kind
- Contro: PDF "bruttino" rispetto agli specializzati (no totali, no anomalie, no metadati)

### Raccomandazione

**Opzione A** (1 nuovo generatore dedicato `generateArchivioStoricoPDFBlob`) con shape input:
```typescript
type ArchivioStoricoPdfInput = {
  kind: "lavoro" | "manutenzione" | "segnalazione" | "richiesta";
  periodo: { fromTs: number; toTs: number; label: string };
  filters: { autista?: string | null; targa?: string | null; search?: string };
  records: ArchivioPdfRow[];  // shape comune con campi unificati
  totalCount: number;
};
```

Dentro `pdfEngine.ts` switch su `kind` per scegliere colonne (analogo al pattern già usato negli altri generatori). Stima: **150 righe** + 50 di wiring in `ArchivioToolbar.tsx` + `NextArchivioStoricoTab.tsx`.

### Refactor preliminari necessari

**Nessuno**. Il pattern shared è già pronto:
- `PdfPreviewModal` ✓ pronto
- `openPreview` / `sharePdfFile` / `copyTextToClipboard` / `buildPdfShareText` / `buildWhatsAppShareUrl` ✓ pronti
- Lo stato del modale può essere replicato 1:1

L'unico "lavoro" è scrivere il nuovo generatore (Opzione A) o riutilizzare uno esistente con adattamento (Opzione B/C).

---

## 8. DOMANDE APERTE PER GIUSEPPE

1. **Opzione generatore A/B/C** — confermi Opzione A (nuovo generatore dedicato `generateArchivioStoricoPDFBlob`, stima ~150 righe in `pdfEngine.ts`)? Oppure preferisci C (`generateTablePDFBlob` generico con minor cura grafica)?

2. **Scope PDF: filtri applicati o tutto?** — il PDF esporta esclusivamente i record visibili dopo filtri+search dell'archivio (coerente con "ciò che vedi") oppure tutti i record del kind nel periodo? Raccomando: filtri+search applicati (= "ciò che vedi", coerente con `generateRifornimentiMensiliPDFBlob` che esporta i record visibili in Tab "Report rifornimenti").

3. **Posizione bottone "Anteprima PDF" nell'Archivio**: nella `ArchivioToolbar` accanto a "N risultati" (esempio: `[N risultati] [Anteprima PDF]`)? O dentro un menu kebab "Esporta..."? Raccomando: bottone inline nella toolbar (pattern Rifornimenti CC).

4. **Per Segnalazioni/Richieste: PDF lista o PDF singolo per ogni record?** — riusiamo i generatori singoli esistenti (`generateSegnalazionePDFBlob`/`generateRichiestaAttrezzaturePDFBlob`) come "anteprima record" nella card espansa, **e** aggiungiamo un PDF lista nella toolbar? Oppure solo PDF lista?

5. **Web Share API su desktop**: oggi `sharePdfFile` ritorna `status: "unsupported"` su desktop. Comportamento accettabile (l'utente usa "Copy link" o "WhatsApp" link) oppure preferisci download diretto del blob come fallback automatico? Raccomando: status quo (coerente con rifornimenti).

---

## 9. ALLEGATO — COMANDI rg ESEGUITI

```bash
# FASE 1: PDF in NEXT
rg -i "pdf|jspdf|pdfmake|window\.print|saveAs|@react-pdf|html2canvas|puppeteer" src/next/ -l --head-limit 40

# FASE 2-3: PDF rifornimenti
rg -in "rifornimenti.*pdf|pdf.*rifornimenti|generateRifornimentoPDF|RifornimentoPdf" src/

# Libreria
grep -iE "pdf|jspdf|pdfmake|html2canvas|@react-pdf|puppeteer" package.json

# Generatori esportati
grep -E "^export async function generate.*PDFBlob" src/utils/pdfEngine.ts

# Pattern preview + share
grep -n "navigator\.share|sharePdfFile|copyTextToClipboard|buildWhatsApp" src/utils/pdfPreview.ts
grep -rn "PdfPreviewModal" src/next/

# Trova engine files
find src -name "pdfEngine*" -o -name "pdfPreview*" -o -name "PdfPreview*"

# Consumer NEXT
grep -rE "from .*pdfEngine|from .*utils/pdfEngine" src/next/ src/pages/
```

Fine report.
