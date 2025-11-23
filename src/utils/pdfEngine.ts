import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Formato data ufficiale: gg mm aaaa
 */
export const formatGGMMYYYY = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";

  const gg = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${gg} ${mm} ${yyyy}`;
};

// --------------------------------------------------------
// 🎨 Tema aziendale (stile D)
// --------------------------------------------------------
const COLORS = {
  primary: [10, 70, 140] as [number, number, number],
  headerText: [255, 255, 255] as [number, number, number],
  border: [180, 180, 180] as [number, number, number],
  rowAlt: [245, 245, 245] as [number, number, number],
  rowWhite: [255, 255, 255] as [number, number, number],
  textBlack: [0, 0, 0] as [number, number, number],
  noteBg: [230, 238, 255] as [number, number, number],
  noteBorder: [10, 70, 140] as [number, number, number],
};

const LOGO_PATH = "/logo.png";

// --------------------------------------------------------
// 🔧 Caricamento logo
// --------------------------------------------------------
async function loadLogoAsDataURL(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    const blob = await res.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () =>
        reject(new Error("Errore durante la lettura del logo"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// --------------------------------------------------------
// 🔴🟠🟢 Pallini priorità
// --------------------------------------------------------
function drawPriorityDot(doc: jsPDF, urgency: string | undefined, x: number, y: number) {
  const r = 3;

  if (urgency === "alta") doc.setFillColor(217, 72, 62);
  else if (urgency === "media") doc.setFillColor(242, 155, 34);
  else if (urgency === "bassa") doc.setFillColor(82, 180, 38);
  else return;

  doc.circle(x, y, r, "F");
}

// --------------------------------------------------------
// 🧩 Tipi
// --------------------------------------------------------
export interface LavoroLike {
  descrizione?: string;
  dataInserimento?: string;
  data?: string;
  urgenza?: "bassa" | "media" | "alta" | string | undefined;
  [key: string]: any;
}

export interface MezzoLike {
  targa?: string;
  marcaModello?: string;
  tipo?: string;
  numeroTelaio?: string;
  anno?: string;
  autista?: string;
  km?: string;
  ultimoCollaudo?: string;
  ultimoControllo?: string;
  noteGenerali?: string;
  [key: string]: any;
}

export interface DomandaLike {
  sezione?: string;
  testo?: string;
  domanda?: string;
  risposta?: string;
  nota?: string;
  dataScadenza?: string;
  misurazione?: string;
  conteggio?: string;
  foto?: string[];
  [key: string]: any;
}

export type PdfInput =
  | { kind: "lavori"; title?: string; groupLabel?: string; lavori: LavoroLike[] }
  | { kind: "mezzo"; title?: string; mezzo: MezzoLike; domande?: DomandaLike[] }
  | { kind: "table"; title: string; columns?: string[]; rows: any[] }
  | any;

// --------------------------------------------------------
// 🧠 Rilevamento tipo
// --------------------------------------------------------
function detectKind(input: any): "lavori" | "mezzo" | "table" {
  if (!input) return "table";

  if (Array.isArray(input)) return "table";
  if (input.kind === "lavori" || input.lavori) return "lavori";
  if (input.kind === "mezzo" || input.mezzo || input.targa || input.numeroTelaio)
    return "mezzo";
  if (input.kind === "table") return "table";

  if (input.rows && Array.isArray(input.rows)) return "table";

  return "table";
}
// --------------------------------------------------------
// 🧠 IA PDF – Modalità disponibili
// --------------------------------------------------------
type PdfIAMode = "none" | "enhance" | "summary" | "pro";
type PdfKind = "lavori" | "mezzo" | "table";

/**
 * Modalità scelta dall’utente.
 * (Lasciata per compatibilità — ma la IA FULL MODE la attiveremo automaticamente)
 */
async function askPdfIAMode(): Promise<PdfIAMode> {
  if (typeof window === "undefined") return "none"; // SSR safety

  const answer = window.prompt(
    "Seleziona tipo PDF:\n" +
      "1 = PDF normale\n" +
      "2 = PDF migliorato con IA\n" +
      "3 = Riassunto breve con IA\n" +
      "4 = Riassunto professionale con IA",
    "1"
  );

  const choice = (answer || "1").trim();

  if (choice === "2") return "enhance";
  if (choice === "3") return "summary";
  if (choice === "4") return "pro";

  return "none";
}

/**
 * Costruisce il testo grezzo da dare alla IA
 * (riassunto, tabelle, lavori, mezzo, ecc.)
 */
function buildRawSummary(kind: PdfKind, input: any): string {
  if (kind === "lavori") {
    const lavori: LavoroLike[] = input.lavori ?? input.rows ?? [];
    const group = input.groupLabel ? `Gruppo: ${input.groupLabel}\n\n` : "";

    const lines = lavori.map((l, i) => {
      const desc = l.descrizione || "";
      const rawDate = l.dataInserimento ?? l.data ?? "";
      const date = rawDate ? formatGGMMYYYY(rawDate) : "";
      const urg = l.urgenza || "-";

      return `${i + 1}. (${urg}) ${date} – ${desc}`;
    });

    return `${group}${lines.join("\n")}`;
  }

  if (kind === "mezzo") {
    const m: MezzoLike = input.mezzo || input || {};
    const d: DomandaLike[] = input.domande || [];

    const info = [
      m.targa && `Targa: ${m.targa}`,
      m.marcaModello && `Marca/Modello: ${m.marcaModello}`,
      m.tipo && `Tipo: ${m.tipo}`,
      m.numeroTelaio && `Telaio: ${m.numeroTelaio}`,
      m.anno && `Anno: ${m.anno}`,
      m.autista && `Autista: ${m.autista}`,
      m.km && `Km: ${m.km}`,
      m.ultimoCollaudo && `Ultimo collaudo: ${formatGGMMYYYY(m.ultimoCollaudo)}`,
      m.ultimoControllo &&
        `Ultimo controllo: ${formatGGMMYYYY(m.ultimoControllo)}`,
      m.noteGenerali && `Note generali: ${m.noteGenerali}`,
    ]
      .filter(Boolean)
      .join("\n");

    const domandeTxt = d
     .map((x: any, i: number) => {

        const domanda = x.domanda || x.testo || "";
        const risposta = x.risposta ? `Risposta: ${x.risposta}` : "";
        const scad = x.dataScadenza
          ? `Scadenza: ${formatGGMMYYYY(x.dataScadenza)}`
          : "";
        const nota =
          x.nota && x.nota.trim().toUpperCase() !== "NOTE"
            ? `Nota: ${x.nota}`
            : "";

        return `${i + 1}. ${domanda}\n${risposta}\n${scad}\n${nota}`.trim();
      })
      .filter(Boolean)
      .join("\n\n");

    return [info, domandeTxt].filter(Boolean).join("\n\n");
  }

  if (kind === "table") {
    const rows = Array.isArray(input.rows)
      ? input.rows
      : Array.isArray(input)
      ? input
      : [];
    const cols = input.columns || [];

    const head = cols.length ? `Colonne: ${cols.join(", ")}` : "";
    const rowsTxt = rows
      .slice(0, 50)
      .map((r: any, i: number) => `${i + 1}. ${JSON.stringify(r)}`)
      .join("\n");

    return [head, rowsTxt].filter(Boolean).join("\n\n");
  }

  return "";
}

/**
 * 🔥 IA FULL MODE — integrazione ufficiale
 * Chiama /api/pdf-ai-enhance e ottiene contenuto migliorato
 */
async function enhancePDFTextFull(kind: string, rawData: any) {
  try {
    const res = await fetch("/api/pdf-ai-enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        input: rawData,
        prompt: `
          Migliora tutti i testi per un PDF professionale.
          - Mantieni numeri, date, scadenze.
          - Migliora descrizioni e note.
          - Crea un riepilogo aziendale chiaro.
          - Linguaggio tecnico e ordinato.
          - Nessuna invenzione.
        `,
      }),
    });

    if (!res.ok) {
      console.warn("IA non disponibile:", res.status);
      return { enhanced: "", summary: "" };
    }

    const json = await res.json();
    return {
      enhanced: json.enhancedText || "",
      summary: json.enhancedNotes || "",
    };
  } catch {
    return { enhanced: "", summary: "" };
  }
}
/**
 * Disegna un box testuale IA nel PDF (riquadro blu chiaro)
 */
function drawIATextBlock(doc: jsPDF, title: string, text: string, startY: number): number {
  if (!text || !text.trim()) return startY;

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const maxWidth = pageWidth - marginX * 2;

  // Titolo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.textBlack);
  doc.text(title, marginX, startY);

  // Testo elaborato IA
  const lines = doc.splitTextToSize(text, maxWidth);
  const boxY = startY + 3;
  const lineHeight = 5;
  const boxHeight = lines.length * lineHeight + 6;

  // Box
  doc.setDrawColor(...COLORS.noteBorder);
  doc.setFillColor(...COLORS.noteBg);
  doc.roundedRect(marginX, boxY, maxWidth, boxHeight, 2, 2, "FD");

  // Testo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textBlack);

  let y = boxY + 5;
  lines.forEach((ln: string) => {
    doc.text(ln, marginX + 3, y);
    y += lineHeight;
  });

  return boxY + boxHeight + 10;
}

/**
 * Header PDF con logo centrato + titolo
 */
async function drawHeader(doc: jsPDF, title: string): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 18;

  const logoDataUrl = await loadLogoAsDataURL();
  if (logoDataUrl) {
    const w = 40;
    const h = 40;
    const x = (pageWidth - w) / 2;

    doc.addImage(logoDataUrl, "PNG", x, currentY, w, h);
    currentY += h + 6;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.textBlack);

  const textWidth = doc.getTextWidth(title);
  const textX = (pageWidth - textWidth) / 2;

  doc.text(title, textX, currentY);
  return currentY + 12;
}
// --------------------------------------------------------
// 📄 PDF LAVORI (usato per Lavori in Attesa, ecc.)
// --------------------------------------------------------
async function generateLavoriPdf(
  doc: jsPDF,
  input: Extract<PdfInput, { kind: "lavori" }> | any
) {
  const lavori: LavoroLike[] = input.lavori ?? input.rows ?? [];
  const titoloBase =
    input.title ??
    (input.groupLabel
      ? `Lavori in Attesa – ${input.groupLabel}`
      : "Lavori in Attesa");

  const kind: PdfKind = "lavori";

  // --------------------------------------------------------
  // 🔥 IA FULL MODE (nessun prompt all'utente)
  // --------------------------------------------------------
  const raw = buildRawSummary(kind, {
    lavori,
    groupLabel: input.groupLabel,
  });

  const ai = await enhancePDFTextFull(kind, raw);
  const iaText = ai.summary || ai.enhanced || "";

  // --------------------------------------------------------
  // HEADER + BOX IA
  // --------------------------------------------------------
  let currentY = await drawHeader(doc, titoloBase);

  if (iaText) {
    currentY = drawIATextBlock(doc, "Sintesi IA", iaText, currentY);
  }

  // --------------------------------------------------------
  // TABELLA LAVORI (come nel tuo originale)
  // --------------------------------------------------------
  const dataRows = lavori.map((l: LavoroLike) => {
    const descrizione = l.descrizione ?? l.titolo ?? "";
    const rawDate = l.dataInserimento ?? l.data ?? "";
    const data = rawDate ? formatGGMMYYYY(rawDate) : "";
    const urgency = (l.urgenza || "").toString().toLowerCase();
    return { descrizione, data, urgency };
  });

  autoTable(doc, {
    startY: currentY,
    head: [["Descrizione", "Data", ""]],
    body: dataRows.map((r) => [r.descrizione, r.data, r.urgency]),
    styles: {
      fontSize: 12,
      lineColor: COLORS.border,
      lineWidth: 0.15,
      textColor: COLORS.textBlack,
      valign: "middle",
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.headerText,
      fontSize: 13,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: COLORS.rowAlt,
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const urgency = (data.cell.raw as string) || "";
        if (!urgency) return;

        const centerX = data.cell.x + data.cell.width / 2;
        const centerY = data.cell.y + data.cell.height / 2;
        drawPriorityDot(doc, urgency, centerX, centerY);
      }
    },
  });
}
// --------------------------------------------------------
// 📊 PDF Tabellare GENERICO (qualsiasi array di oggetti)
// --------------------------------------------------------
async function generateTablePdf(
  doc: jsPDF,
  input: Extract<PdfInput, { kind: "table" }> | any
) {
  const rows: any[] = Array.isArray(input.rows)
    ? input.rows
    : Array.isArray(input)
    ? input
    : [];

  const title: string = input.title || "Report";
  const kind: PdfKind = "table";

  // --------------------------------------------------------
  // Caso: nessuna riga
  // --------------------------------------------------------
  if (!rows.length) {
    const startY = await drawHeader(doc, title);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Nessun dato disponibile.", 14, startY + 10);
    return;
  }

  // --------------------------------------------------------
  // 🔥 IA FULL MODE AUTOMATICA
  // --------------------------------------------------------
  const raw = buildRawSummary(kind, {
    rows,
    columns: input.columns,
  });

  const ai = await enhancePDFTextFull(kind, raw);
  const iaText = ai.summary || ai.enhanced || "";

  // --------------------------------------------------------
  // HEADER + BOX IA
  // --------------------------------------------------------
  let currentY = await drawHeader(doc, title);

  if (iaText) {
    currentY = drawIATextBlock(doc, "Sintesi IA", iaText, currentY);
  }

  // --------------------------------------------------------
  // TABELLA GENERICA (layout originale)
  // --------------------------------------------------------
  let columns: string[] = input.columns;

  // Se le colonne non sono definite → prendi tutte le chiavi trovate
  if (!columns || !columns.length) {
    const keysSet = new Set<string>();
    rows.forEach((r) => {
      Object.keys(r || {}).forEach((k) => keysSet.add(k));
    });
    columns = Array.from(keysSet);
  }

  const head = [
    columns.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
  ];

  const body = rows.map((row) =>
    columns!.map((c) => {
      const val = row[c];

      if (val === null || val === undefined) return "";

      // Formattazione automatica date ISO
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        return formatGGMMYYYY(val);
      }

      return String(val);
    })
  );

  autoTable(doc, {
    startY: currentY,
    head,
    body,
    styles: {
      fontSize: 11,
      lineColor: COLORS.border,
      lineWidth: 0.15,
      textColor: COLORS.textBlack,
      valign: "middle",
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: COLORS.headerText,
      fontSize: 12,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: COLORS.rowAlt,
    },
  });
}
// --------------------------------------------------------
// 🚚 PDF Mezzo + Domande (versione web del tuo pdfExporter TSX)
// --------------------------------------------------------
async function generateMezzoPdf(
  doc: jsPDF,
  input: Extract<PdfInput, { kind: "mezzo" }> | any
) {
  const mezzo: MezzoLike = input.mezzo || input || {};
  const domande: DomandaLike[] = input.domande || [];

  const titolo = input.title || "Rapporto di Controllo Mezzo";
  const kind: PdfKind = "mezzo";

  // --------------------------------------------------------
  // 🔥 IA FULL MODE AUTOMATICA
  // --------------------------------------------------------
  const raw = buildRawSummary(kind, { mezzo, domande });
  const ai = await enhancePDFTextFull(kind, raw);
  const iaText = ai.summary || ai.enhanced || "";

  // --------------------------------------------------------
  // HEADER + BOX IA
  // --------------------------------------------------------
  let currentY = await drawHeader(doc, titolo);

  if (iaText) {
    currentY = drawIATextBlock(doc, "Sintesi IA", iaText, currentY);
  }

  // --------------------------------------------------------
  // BOX DATI MEZZO (identico al tuo originale, NON modificato)
  // --------------------------------------------------------
  const leftX = 14;
  const rightX = 196;
  const boxWidth = rightX - leftX;

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftX, currentY, boxWidth, 60, 3, 3);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  const fields: [string, string | undefined][] = [
    ["Targa", mezzo.targa],
    ["Marca / Modello", mezzo.marcaModello],
    ["Tipo", mezzo.tipo],
    ["Telaio", mezzo.numeroTelaio],
    ["Anno", mezzo.anno],
    ["Autista", mezzo.autista],
    ["Km", mezzo.km],
    ["Ultimo Collaudo", mezzo.ultimoCollaudo],
    ["Ultimo Controllo", mezzo.ultimoControllo],
  ];

  let lineY = currentY + 8;
  const labelWidth = 35;

  fields.forEach(([label, value]) => {
    if (!value) return;
    let v = value;

    if (label === "Ultimo Collaudo" || label === "Ultimo Controllo") {
      v = formatGGMMYYYY(value);
    }

    doc.text(`${label}:`, leftX + 4, lineY);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), leftX + 4 + labelWidth, lineY);
    doc.setFont("helvetica", "bold");
    lineY += 6;
  });

  currentY = currentY + 60 + 12;

  // --------------------------------------------------------
  // DOMANDE MEZZO (layout originale, NON modificato)
  // --------------------------------------------------------
  if (domande.length) {
    domande.forEach((d, index) => {
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }

      const domandaTesto = d.domanda || d.testo || "";
      if (!domandaTesto) return;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${domandaTesto}`, leftX, currentY);
      currentY += 6;

      if (d.risposta) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Risposta: ${d.risposta}`, leftX, currentY);
        currentY += 5;
      }

      if (d.dataScadenza) {
        doc.text(
          `Data scadenza: ${formatGGMMYYYY(d.dataScadenza)}`,
          leftX,
          currentY
        );
        currentY += 5;
      }

      if (d.misurazione) {
        doc.text(`Misurazione: ${d.misurazione}`, leftX, currentY);
        currentY += 5;
      }

      if (d.conteggio) {
        doc.text(`Conteggio: ${d.conteggio}`, leftX, currentY);
        currentY += 5;
      }

      if (d.nota && d.nota.trim() && d.nota.trim().toUpperCase() !== "NOTE") {
        const boxY = currentY + 2;
        const text = `Nota: ${d.nota.trim()}`;

        doc.setDrawColor(...COLORS.noteBorder);
        doc.setFillColor(...COLORS.noteBg);

        const textWidth = doc.getTextWidth(text) + 6;
        const boxHeight = 8;

        doc.roundedRect(leftX, boxY - 6, textWidth, boxHeight + 4, 2, 2, "FD");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.textBlack);
        doc.text(text, leftX + 3, boxY);

        currentY = boxY + 10;
      } else {
        currentY += 6;
      }

      currentY += 4;
    });
  }

  // --------------------------------------------------------
  // FIRMA FINALE (originale tua)
  // --------------------------------------------------------
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(85, 85, 85);
  doc.text(
    "Pensato, Ideato e Creato da Giuseppe Milio",
    leftX,
    pageHeight - 10
  );
}
// --------------------------------------------------------
// 🔌 Helper specifici se vuoi chiamarli direttamente
// --------------------------------------------------------
// --------------------------------------------------------
// 🧠 Funzione UNIVERSALE "intelligente"
// --------------------------------------------------------
export async function generateSmartPDF(input: PdfInput): Promise<void> {
  const kind = detectKind(input);
  const doc = new jsPDF();

  if (kind === "lavori") {
    await generateLavoriPdf(doc, input);
  } else if (kind === "mezzo") {
    await generateMezzoPdf(doc, input);
  } else {
    await generateTablePdf(doc, input);
  }

  const now = new Date();
  const datePart = formatGGMMYYYY(now.toISOString());
  const baseName =
    (input as any).title ||
    (input as any).groupLabel ||
    (kind === "lavori"
      ? "Lavori"
      : kind === "mezzo"
      ? "Mezzo"
      : "Report");

  doc.save(`${baseName}_${datePart}.pdf`);
}

// --------------------------------------------------------
// 🔌 Helper specifici
// --------------------------------------------------------
export async function generateLavoriPDF(
  title: string,
  lavori: LavoroLike[],
  groupLabel?: string
) {
  await generateSmartPDF({ kind: "lavori", title, lavori, groupLabel });
}

export async function generateTablePDF(
  title: string,
  rows: any[],
  columns?: string[]
) {
  await generateSmartPDF({ kind: "table", title, rows, columns });
}

export async function generateMezzoPDF(
  title: string,
  mezzo: MezzoLike,
  domande?: DomandaLike[]
) {
  await generateSmartPDF({ kind: "mezzo", title, mezzo, domande });
}

