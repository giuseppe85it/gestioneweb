import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generaPDFconIA } from "./aiCore";


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

/**
 * Formato data + ora (gg mm aaaa – HH:MM)
 */
export const formatGGMMYYYY_HHMM = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";

  const ggmm = formatGGMMYYYY(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${ggmm} – ${hh}:${mi}`;
};

// --------------------------------------------------------
// Tipi base per i PDF
// --------------------------------------------------------

export interface LavoroLike {
  id?: string;
  descrizione: string;
  dataInserimento?: string;
  data?: string;
  urgenza?: string;
  targa?: string;
  magazzino?: string;
  gruppoId?: string;
  note?: string;
}

export interface MezzoLike {
  targa?: string;
  numeroTelaio?: string;
  modello?: string;
  marca?: string;
  tipo?: string;
  annoImmatricolazione?: string;
  dataUltimaRevisione?: string;
  dataScadenzaRevisione?: string;
  kmAttuali?: number;
  [key: string]: any;
}

export interface DomandaLike {
  domanda: string;
  risposta?: string;
  scadenza?: string;
  note?: string;
}

export type PdfInput =
  | {
      kind: "lavori";
      title?: string;
      lavori: LavoroLike[];
      groupLabel?: string;
    }
  | {
      kind: "mezzo";
      title?: string;
      mezzo: MezzoLike;
      domande?: DomandaLike[];
    }
  | {
      kind: "table";
      title?: string;
      rows: any[];
      columns?: string[];
    }
  | any;

// --------------------------------------------------------
// Palette aziendale (stile D)
// --------------------------------------------------------
const COLORS = {
  bg: [248, 244, 232] as [number, number, number],
  headerBg: [230, 220, 200] as [number, number, number],
  headerLine: [180, 160, 120] as [number, number, number],
  textBlack: [40, 40, 40] as [number, number, number],
  accent: [120, 90, 50] as [number, number, number],
  tableHeaderBg: [230, 220, 200] as [number, number, number],
  tableHeaderText: [40, 40, 40] as [number, number, number],
  rowAlt: [252, 249, 240] as [number, number, number],
  rowEven: [255, 255, 255] as [number, number, number],
  noteBg: [227, 242, 253] as [number, number, number],
  noteBorder: [100, 149, 237] as [number, number, number],
  urgentRed: [211, 47, 47] as [number, number, number],
  mediumOrange: [249, 168, 37] as [number, number, number],
  lowGreen: [56, 142, 60] as [number, number, number],
};

// --------------------------------------------------------
// Logo aziendale
// --------------------------------------------------------
async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;

    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
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
function drawPriorityDot(
  doc: jsPDF,
  urgency: string | undefined,
  x: number,
  y: number
) {
  const r = 3;

  if (urgency === "Alta") {
    doc.setFillColor(...COLORS.urgentRed);
  } else if (urgency === "Media") {
    doc.setFillColor(...COLORS.mediumOrange);
  } else if (urgency === "Bassa") {
    doc.setFillColor(...COLORS.lowGreen);
  } else {
    doc.setFillColor(180, 180, 180);
  }

  doc.circle(x, y, r, "F");
}

// --------------------------------------------------------
// Header comune
// --------------------------------------------------------
async function drawHeader(doc: jsPDF, title: string): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pageWidth, 297, "F");

  doc.setFillColor(...COLORS.headerBg);
  doc.rect(0, 0, pageWidth, 26, "F");
  doc.setDrawColor(...COLORS.headerLine);
  doc.line(margin, 26, pageWidth - margin, 26);

  const logoBase64 = await loadLogoBase64();
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", margin, 4, 20, 18);
  }

  doc.setTextColor(...COLORS.textBlack);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("GHIELMI CEMENTI SA", margin + 26, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Sistema Gestione Manutenzione", margin + 26, 18);

  const now = new Date();
  const dateStr = formatGGMMYYYY_HHMM(now.toISOString());
  doc.setFontSize(9);
  doc.text(dateStr, pageWidth - margin, 10, { align: "right" });
  doc.text(title, pageWidth - margin, 18, { align: "right" });

  return 36;
}

// --------------------------------------------------------
// Rilevamento tipo PDF
// --------------------------------------------------------
function detectKind(input: PdfInput): "lavori" | "mezzo" | "table" {
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

type PdfKind = "lavori" | "mezzo" | "table";

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
      const targa = l.targa || "";
      const mag = l.magazzino || "";
      const note = l.note || "";

      const head = `${i + 1}. (${urg}) ${date}`;
      const info = [targa, mag].filter(Boolean).join(" – ");

      return [head, info, desc, note].filter(Boolean).join("\n");
    });

    return [group, ...lines].filter(Boolean).join("\n\n");
  }

  if (kind === "mezzo") {
    const mezzo: MezzoLike = input.mezzo || {};
    const domande: DomandaLike[] = input.domande || [];

    const infoMezzo = [
      mezzo.targa && `Targa: ${mezzo.targa}`,
      mezzo.numeroTelaio && `Telaio: ${mezzo.numeroTelaio}`,
      mezzo.modello && `Modello: ${mezzo.modello}`,
      mezzo.marca && `Marca: ${mezzo.marca}`,
      mezzo.annoImmatricolazione &&
        `Anno immatricolazione: ${mezzo.annoImmatricolazione}`,
      mezzo.dataUltimaRevisione &&
        `Ultima revisione: ${formatGGMMYYYY(mezzo.dataUltimaRevisione)}`,
      mezzo.dataScadenzaRevisione &&
        `Scadenza revisione: ${formatGGMMYYYY(mezzo.dataScadenzaRevisione)}`,
      mezzo.kmAttuali && `Km attuali: ${mezzo.kmAttuali}`,
    ]
      .filter(Boolean)
      .join("\n");

    const domandeTxt = domande
      .map((d, i) => {
        const domanda = d.domanda || "";
        const risposta = d.risposta || "";
        const scad = d.scadenza ? `Scadenza: ${formatGGMMYYYY(d.scadenza)}` : "";
        const nota = d.note || "";
        return `${i + 1}. ${domanda}\n${risposta}\n${scad}\n${nota}`.trim();
      })
      .filter(Boolean)
      .join("\n\n");

    return [infoMezzo, domandeTxt].filter(Boolean).join("\n\n");
  }

  if (kind === "table") {
    const rows = Array.isArray(input.rows)
      ? input.rows
      : Array.isArray(input)
      ? input
      : [];
    const cols = input.columns || [];

    const head =
      cols && cols.length
        ? `Colonne: ${cols.join(", ")}`
        : "Tabella generica";

    const rowsTxt = rows
  .map((r: any, i: number) => `${i + 1}. ${JSON.stringify(r)}`)
  .join("\n");


    return [head, rowsTxt].filter(Boolean).join("\n\n");
  }

  return "";
}

/**
 * 🔥 IA FULL MODE — integrazione ufficiale
 * Usa la IA centrale (Cloud Functions aiCore, task "pdf_ia") per ottenere contenuto migliorato
 */
async function enhancePDFTextFull(kind: string, rawData: any) {
  try {
    // Usa la IA centrale tramite Firebase Functions (aiCore)
    // kind: "lavori" | "mezzo" | "table"
    // rawData: stringa già pronta con il contenuto riassunto
    const iaResult: any = await generaPDFconIA(kind, { raw: rawData });

    if (!iaResult) {
      return { enhanced: "", summary: "" };
    }

    // Mappiamo la struttura universale della IA in due campi:
    // - enhanced: testo principale migliorato
    // - summary: sintesi finale da mostrare nel box IA
    const sections = Array.isArray(iaResult.sezioni)
      ? iaResult.sezioni
          .map((s: any) => {
            const titolo = s?.titolo ? `${s.titolo}:\n` : "";
            const contenuto = s?.contenuto ?? "";
            return `${titolo}${contenuto}`.trim();
          })
          .filter(Boolean)
          .join("\n\n")
      : "";

    const enhanced = sections || iaResult.descrizione || "";
    const summary =
      iaResult.riassunto_finale ||
      iaResult.sottotitolo ||
      iaResult.titolo ||
      "";

    return {
      enhanced,
      summary,
    };
  } catch (e) {
    console.warn("IA pdf_ia non disponibile o in errore:", e);
    return { enhanced: "", summary: "" };
  }
}

/**
 * Disegna un box testuale IA nel PDF (riquadro blu chiaro)
 */
function drawIATextBlock(
  doc: jsPDF,
  title: string,
  text: string,
  startY: number
): number {
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

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(lines, marginX + 2, boxY + 5);

  return boxY + boxHeight + 8;
}

// --------------------------------------------------------
// LAYOUT LAVORI
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

  // 🔥 IA FULL MODE
  const raw = buildRawSummary(kind, {
    lavori,
    groupLabel: input.groupLabel,
  });

  const ai = await enhancePDFTextFull(kind, raw);
  const iaText = ai.summary || ai.enhanced || "";

  // HEADER + BOX IA
  let currentY = await drawHeader(doc, titoloBase);

  if (iaText) {
    currentY = drawIATextBlock(doc, "Sintesi IA", iaText, currentY);
  }

  // TABELLA LAVORI (layout originale)
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [["Data", "Descrizione", "Urgenza", "Targa/Magazzino"]],
    body: lavori.map((l) => {
      const rawDate = l.dataInserimento ?? l.data ?? "";
      const date = rawDate ? formatGGMMYYYY(rawDate) : "";
      const desc = l.descrizione || "";
      const urg = l.urgenza || "";
      const mag = l.magazzino || "";
      const targa = l.targa || "";
      const info = [targa, mag].filter(Boolean).join(" / ");

      return [date, desc, urg, info];
    }),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: COLORS.tableHeaderBg,
      textColor: COLORS.tableHeaderText,
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
// LAYOUT TABELLA GENERICA
// --------------------------------------------------------
async function generateTablePdf(
  doc: jsPDF,
  input: Extract<PdfInput, { kind: "table" }> | any
) {
  const rows: any[] = input.rows ?? [];
  const title: string = input.title ?? "Report";

  const kind: PdfKind = "table";

  // 🔥 IA FULL MODE
  const raw = buildRawSummary(kind, {
    rows,
    columns: input.columns,
  });

  const ai = await enhancePDFTextFull(kind, raw);
  const iaText = ai.summary || ai.enhanced || "";

  // HEADER + BOX IA
  let currentY = await drawHeader(doc, title);

  if (iaText) {
    currentY = drawIATextBlock(doc, "Sintesi IA", iaText, currentY);
  }

  let columns: string[] = input.columns;

  if (!columns || !columns.length) {
    const firstRow = rows[0] || {};
    columns = Object.keys(firstRow);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    head: [columns],
    body: rows.map((row) => columns.map((c) => String(row[c] ?? ""))),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: COLORS.tableHeaderBg,
      textColor: COLORS.tableHeaderText,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: COLORS.rowAlt,
    },
  });
}

// --------------------------------------------------------
// LAYOUT MEZZO (DOSSIER/CONTROLLO)
// --------------------------------------------------------
async function generateMezzoPdf(
  doc: jsPDF,
  input: Extract<PdfInput, { kind: "mezzo" }> | any
) {
  const mezzo: MezzoLike = input.mezzo || {};
  const domande: DomandaLike[] = input.domande || [];

  const titolo = input.title || "Rapporto di Controllo Mezzo";
  const kind: PdfKind = "mezzo";

  // 🔥 IA FULL MODE
  const raw = buildRawSummary(kind, { mezzo, domande });
  const ai = await enhancePDFTextFull(kind, raw);
  const iaText = ai.summary || ai.enhanced || "";

  // HEADER + BOX IA
  let currentY = await drawHeader(doc, titolo);

  if (iaText) {
    currentY = drawIATextBlock(doc, "Sintesi IA", iaText, currentY);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  const maxWidth = pageWidth - marginX * 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Dati Mezzo", marginX, currentY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  currentY += 6;

  const infoLines: string[] = [];

  if (mezzo.targa) infoLines.push(`Targa: ${mezzo.targa}`);
  if (mezzo.numeroTelaio) infoLines.push(`Telaio: ${mezzo.numeroTelaio}`);
  if (mezzo.modello) infoLines.push(`Modello: ${mezzo.modello}`);
  if (mezzo.marca) infoLines.push(`Marca: ${mezzo.marca}`);
  if (mezzo.annoImmatricolazione)
    infoLines.push(`Anno immatricolazione: ${mezzo.annoImmatricolazione}`);
  if (mezzo.dataUltimaRevisione)
    infoLines.push(
      `Ultima revisione: ${formatGGMMYYYY(mezzo.dataUltimaRevisione)}`
    );
  if (mezzo.dataScadenzaRevisione)
    infoLines.push(
      `Scadenza revisione: ${formatGGMMYYYY(mezzo.dataScadenzaRevisione)}`
    );
  if (mezzo.kmAttuali) infoLines.push(`Km attuali: ${mezzo.kmAttuali}`);

  const infoTextLines = doc.splitTextToSize(infoLines.join("\n"), maxWidth);
  doc.text(infoTextLines, marginX, currentY);
  currentY += infoTextLines.length * 5 + 8;

  if (domande && domande.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Controlli / Domande", marginX, currentY);
    currentY += 6;

    const rows = domande.map((d, i) => [
      `${i + 1}`,
      d.domanda || "",
      d.risposta || "",
      d.scadenza ? formatGGMMYYYY(d.scadenza) : "",
      d.note || "",
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      head: [["#", "Domanda", "Risposta", "Scadenza", "Note"]],
      body: rows,
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: COLORS.tableHeaderBg,
        textColor: COLORS.tableHeaderText,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: COLORS.rowAlt,
      },
    });
  }
}

// --------------------------------------------------------
// ENTRYPOINT GENERALE
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
// Helper specifici
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
