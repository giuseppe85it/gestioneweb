import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebase";
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

export const formatDateTime = (input: number | string | Date): string => {
  if (input === null || input === undefined) return "";
  const d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return "";
  return formatGGMMYYYY_HHMM(d.toISOString());
};

export const safeStr = (value: any): string => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return s.trim();
};

export const fmtTarga = (value: any): string => {
  if (value === null || value === undefined) return "";
  return String(value).toUpperCase().trim();
};

export const buildDocId = (prefix: string): string => {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  const rand = c?.randomUUID
    ? c.randomUUID().slice(0, 8)
    : Math.random().toString(16).slice(2, 10);
  return `${prefix}-${yyyy}${mm}${dd}-${rand}`;
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
  telaio?: string;
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

export type PdfBlock =
  | { kind: "kv"; title: string; rows: Array<{ k: string; v: string }> }
  | { kind: "table"; title: string; columns: string[]; rows: string[][] }
  | { kind: "photos"; title: string; urls: string[]; captions?: string[] }
  | { kind: "text"; title: string; text: string };

export type PdfDocModel = {
  docId: string;
  title: string;
  dateTimeLabel: string;
  headerRight?: string;
  blocks: PdfBlock[];
  footerSign?: { leftLabel: string; rightLabel: string };
};

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
      const urg = String(l.urgenza || "").toUpperCase();
      const mag = l.magazzino || "";
      const targa = l.targa || "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tipo = (l as any)?.tipo;
      const infoRaw = [targa, mag].filter(Boolean).join(" / ");
      const info = infoRaw || (tipo === "magazzino" ? "MAGAZZINO" : "");

      return [date, desc, urg, info];
    }),
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 24 },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 40 },
    },
    headStyles: {
      fillColor: COLORS.tableHeaderBg,
      textColor: COLORS.tableHeaderText,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: COLORS.rowAlt,
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 2) {
        const urgency = String(data.cell.raw || "").toUpperCase();
        if (!urgency) return;

        data.cell.text = [urgency];
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = [255, 255, 255];

        if (urgency === "ALTA") {
          data.cell.styles.fillColor = [214, 82, 63];
        } else if (urgency === "MEDIA") {
          data.cell.styles.fillColor = [240, 166, 47];
        } else if (urgency === "BASSA") {
          data.cell.styles.fillColor = [62, 139, 53];
        } else {
          data.cell.styles.fillColor = [120, 120, 120];
        }
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
  const telaio = mezzo.numeroTelaio || mezzo.telaio || "";
  if (telaio) infoLines.push(`Telaio: ${telaio}`);
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
// STANDARD DOC MODEL (single record)
// --------------------------------------------------------

const PDF_MARGIN_X = 14;
const PDF_BOTTOM_MARGIN = 18;
const PDF_HEADER_HEIGHT = 30;
const PDF_LINE_HEIGHT = 5;

let cachedLogoBase64: string | null | undefined;

async function loadLogoCached(): Promise<string | null> {
  if (cachedLogoBase64 !== undefined) return cachedLogoBase64;
  cachedLogoBase64 = await loadLogoBase64();
  return cachedLogoBase64;
}

function sanitizeFileName(name: string): string {
  const cleaned = String(name || "").replace(/[^A-Za-z0-9_-]+/g, "_");
  return cleaned.replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "Documento";
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function resolvePhotoDataUrl(
  url?: string | null,
  storagePath?: string | null
): Promise<string | null> {
  if (url) {
    const direct = await fetchImageAsDataUrl(url);
    if (direct) return direct;
  }
  if (storagePath) {
    try {
      const downloadUrl = await getDownloadURL(ref(storage, storagePath));
      const viaStorage = await fetchImageAsDataUrl(downloadUrl);
      if (viaStorage) return viaStorage;
    } catch {
      return null;
    }
  }
  return null;
}

async function drawStandardHeader(doc: jsPDF, model: PdfDocModel): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(...COLORS.headerBg);
  doc.rect(0, 0, pageWidth, PDF_HEADER_HEIGHT, "F");
  doc.setDrawColor(...COLORS.headerLine);
  doc.line(PDF_MARGIN_X, PDF_HEADER_HEIGHT, pageWidth - PDF_MARGIN_X, PDF_HEADER_HEIGHT);

  const logoBase64 = await loadLogoCached();
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", PDF_MARGIN_X, 4, 20, 18);
  }

  doc.setTextColor(...COLORS.textBlack);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("GHIELMI CEMENTI SA", PDF_MARGIN_X + 26, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Sistema Gestione Manutenzione", PDF_MARGIN_X + 26, 18);

  doc.setFontSize(9);
  doc.text(
    model.dateTimeLabel || formatDateTime(new Date()),
    pageWidth - PDF_MARGIN_X,
    10,
    { align: "right" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(model.title || "Documento", pageWidth - PDF_MARGIN_X, 18, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (model.headerRight) {
    doc.text(model.headerRight, pageWidth - PDF_MARGIN_X, 23, { align: "right" });
  }
  if (model.docId) {
    doc.text(`ID: ${model.docId}`, pageWidth - PDF_MARGIN_X, 27, { align: "right" });
  }

  return PDF_HEADER_HEIGHT + 8;
}

function addStandardFooter(doc: jsPDF, footerSign?: { leftLabel: string; rightLabel: string }) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textBlack);
    doc.text(`Pagina ${i}/${pageCount}`, pageWidth - PDF_MARGIN_X, pageHeight - 8, {
      align: "right",
    });

    if (footerSign && i === pageCount) {
      const lineY = pageHeight - 18;
      const lineW = 60;
      const leftX = PDF_MARGIN_X;
      const rightX = pageWidth - PDF_MARGIN_X - lineW;
      doc.setDrawColor(...COLORS.headerLine);
      doc.line(leftX, lineY, leftX + lineW, lineY);
      doc.line(rightX, lineY, rightX + lineW, lineY);
      doc.text(footerSign.leftLabel, leftX, lineY + 5);
      doc.text(footerSign.rightLabel, rightX, lineY + 5);
    }
  }
}

async function addPhotosGrid(
  doc: jsPDF,
  urls: string[],
  startY: number,
  model: PdfDocModel,
  captions?: string[]
): Promise<number> {
  if (!urls.length) return startY;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - PDF_MARGIN_X * 2;
  const columns = 2;
  const gap = 4;
  const cellW = (maxWidth - gap * (columns - 1)) / columns;
  const cellH = cellW * 0.75;

  let x = PDF_MARGIN_X;
  let y = startY;
  let col = 0;
  let rowHeight = 0;

  for (let i = 0; i < urls.length; i += 1) {
    const caption = captions?.[i] ? safeStr(captions[i]) : "";
    const captionLines = caption ? doc.splitTextToSize(caption, cellW) : [];
    const captionHeight = captionLines.length ? captionLines.length * 4 + 2 : 0;
    const needed = cellH + captionHeight + 2;

    if (y + needed > pageHeight - PDF_BOTTOM_MARGIN) {
      doc.addPage();
      y = await drawStandardHeader(doc, model);
      x = PDF_MARGIN_X;
      col = 0;
      rowHeight = 0;
    }

    const dataUrl = await fetchImageAsDataUrl(urls[i]);
    if (dataUrl) {
      const format = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(dataUrl, format, x, y, cellW, cellH, undefined, "FAST");
    } else {
      doc.setDrawColor(180, 180, 180);
      doc.rect(x, y, cellW, cellH);
      doc.setFontSize(8);
      doc.text("foto non disponibile", x + 2, y + 10);
    }

    if (captionLines.length) {
      doc.setFontSize(8);
      doc.text(captionLines, x, y + cellH + 4);
    }

    rowHeight = Math.max(rowHeight, needed);
    col += 1;

    if (col >= columns) {
      col = 0;
      x = PDF_MARGIN_X;
      y += rowHeight + gap;
      rowHeight = 0;
    } else {
      x += cellW + gap;
    }
  }

  if (col !== 0) {
    y += rowHeight + gap;
  }

  return y;
}

async function renderBlocks(
  doc: jsPDF,
  model: PdfDocModel,
  startY: number
): Promise<number> {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - PDF_MARGIN_X * 2;

  let currentY = startY;

  const ensureSpace = async (needed: number) => {
    if (currentY + needed > pageHeight - PDF_BOTTOM_MARGIN) {
      doc.addPage();
      currentY = await drawStandardHeader(doc, model);
    }
  };

  for (const block of model.blocks) {
    if (block.kind === "kv") {
      if (block.title) {
        await ensureSpace(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(block.title, PDF_MARGIN_X, currentY);
        currentY += 6;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      for (const row of block.rows) {
        const line = `${row.k}: ${row.v}`;
        const lines = doc.splitTextToSize(line, maxWidth);
        await ensureSpace(lines.length * PDF_LINE_HEIGHT + 2);
        doc.text(lines, PDF_MARGIN_X, currentY);
        currentY += lines.length * PDF_LINE_HEIGHT + 2;
      }
      currentY += 4;
    }

    if (block.kind === "text") {
      if (block.title) {
        await ensureSpace(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(block.title, PDF_MARGIN_X, currentY);
        currentY += 6;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(block.text || "-", maxWidth);
      await ensureSpace(lines.length * PDF_LINE_HEIGHT + 2);
      doc.text(lines, PDF_MARGIN_X, currentY);
      currentY += lines.length * PDF_LINE_HEIGHT + 6;
    }

    if (block.kind === "table") {
      await ensureSpace(12);
      autoTable(doc, {
        startY: currentY,
        margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X },
        head: [block.columns],
        body: block.rows,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as any).lastAutoTable?.finalY || currentY;
      currentY = finalY + 8;
    }

    if (block.kind === "photos") {
      if (block.title) {
        await ensureSpace(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(block.title, PDF_MARGIN_X, currentY);
        currentY += 6;
      }
      currentY = await addPhotosGrid(doc, block.urls, currentY, model, block.captions);
      currentY += 6;
    }
  }

  return currentY;
}

async function generateDocFromModel(model: PdfDocModel): Promise<void> {
  const doc = new jsPDF();
  let currentY = await drawStandardHeader(doc, model);
  currentY = await renderBlocks(doc, model, currentY);
  addStandardFooter(doc, model.footerSign);

  const name = sanitizeFileName(`${model.title || "Documento"}_${model.docId || ""}`);
  doc.save(`${name}.pdf`);
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

function getFotoUrlsFromRecord(record: any): string[] {
  const urls: string[] = [];
  if (record?.fotoUrl) urls.push(String(record.fotoUrl));
  if (Array.isArray(record?.fotoUrls)) {
    record.fotoUrls.forEach((u: any) => {
      if (u) urls.push(String(u));
    });
  }
  if (record?.fotoDataUrl) urls.push(String(record.fotoDataUrl));
  if (Array.isArray(record?.foto)) {
    record.foto.forEach((f: any) => {
      if (f?.url) urls.push(String(f.url));
      if (f?.dataUrl) urls.push(String(f.dataUrl));
    });
  }
  return Array.from(new Set(urls)).filter(Boolean);
}

function buildCheckRows(check: any): string[][] {
  if (!check || typeof check !== "object") return [];
  return Object.entries(check).map(([k, v]) => [
    String(k).toUpperCase(),
    v === false ? "KO" : "OK",
  ]);
}

function formatCondizioni(cond: any): string {
  if (!cond || typeof cond !== "object") return "";
  const parts: string[] = [];
  const gen = cond.generali || {};
  const spec = cond.specifiche || {};
  const genKeys = Object.keys(gen);
  const specKeys = Object.keys(spec);

  if (genKeys.length) {
    const g = genKeys
      .map((k) => `${k}:${gen[k] === false ? "KO" : "OK"}`)
      .join(", ");
    parts.push(`generali(${g})`);
  }
  if (specKeys.length) {
    const s = specKeys
      .map((k) => `${k}:${spec[k] === false ? "KO" : "OK"}`)
      .join(", ");
    parts.push(`specifiche(${s})`);
  }
  return parts.join(" | ");
}

export async function generateSegnalazionePDF(record: any): Promise<void> {
  const docId = buildDocId("SEG");
  const targaMotrice = fmtTarga(record?.targaCamion || record?.targa || "");
  const targaRimorchio = fmtTarga(record?.targaRimorchio || "");
  const dateTimeLabel = formatDateTime(
    record?.data ?? record?.timestamp ?? Date.now()
  );
  const headerRight = targaMotrice || targaRimorchio ? `Targa: ${targaMotrice || targaRimorchio}` : "";

  const blocks: PdfBlock[] = [
    {
      kind: "kv",
      title: "Mezzo",
      rows: [
        { k: "Motrice", v: targaMotrice || "-" },
        { k: "Rimorchio", v: targaRimorchio || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Autista",
      rows: [
        { k: "Nome", v: safeStr(record?.autistaNome) || "-" },
        { k: "Badge", v: safeStr(record?.badgeAutista) || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Evento",
      rows: [
        { k: "Ambito", v: safeStr(record?.ambito) || "-" },
        { k: "Tipo", v: safeStr(record?.tipoProblema) || "-" },
        { k: "Stato", v: safeStr(record?.stato) || "-" },
      ],
    },
  ];

  if (safeStr(record?.tipoProblema) === "gomme") {
    blocks.push({
      kind: "kv",
      title: "Dettagli gomme",
      rows: [
        { k: "Posizione", v: safeStr(record?.posizioneGomma) || "-" },
        { k: "Problema", v: safeStr(record?.problemaGomma) || "-" },
      ],
    });
  }

  const descr = [
    safeStr(record?.descrizione),
    record?.note ? `Note: ${safeStr(record?.note)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  blocks.push({
    kind: "text",
    title: "Descrizione",
    text: descr || "-",
  });

  const fotoUrls = getFotoUrlsFromRecord(record);
  if (fotoUrls.length) {
    blocks.push({
      kind: "photos",
      title: "Foto",
      urls: fotoUrls,
    });
  }

  await generateDocFromModel({
    docId,
    title: "Segnalazione",
    dateTimeLabel,
    headerRight: headerRight || undefined,
    blocks,
    footerSign: { leftLabel: "Firma Autista", rightLabel: "Firma Admin" },
  });
}

export async function generateControlloPDF(record: any): Promise<void> {
  const docId = buildDocId("CTRL");
  const targaMotrice = fmtTarga(record?.targaCamion || "");
  const targaRimorchio = fmtTarga(record?.targaRimorchio || "");
  const dateTimeLabel = formatDateTime(record?.timestamp ?? Date.now());
  const headerRight = targaMotrice || targaRimorchio ? `Targa: ${targaMotrice || targaRimorchio}` : "";
  const rows = buildCheckRows(record?.check);

  const blocks: PdfBlock[] = [
    {
      kind: "kv",
      title: "Mezzo",
      rows: [
        { k: "Motrice", v: targaMotrice || "-" },
        { k: "Rimorchio", v: targaRimorchio || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Autista",
      rows: [
        { k: "Nome", v: safeStr(record?.autistaNome) || "-" },
        { k: "Badge", v: safeStr(record?.badgeAutista) || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Evento",
      rows: [
        { k: "Target", v: safeStr(record?.target) || "-" },
        { k: "Esito", v: rows.some((r) => r[1] === "KO") ? "KO" : "OK" },
      ],
    },
  ];

  if (rows.length) {
    blocks.push({
      kind: "table",
      title: "Check",
      columns: ["Voce", "Esito"],
      rows,
    });
  } else {
    blocks.push({
      kind: "text",
      title: "Check",
      text: "Dati non disponibili in questa esportazione.",
    });
  }

  if (record?.note) {
    blocks.push({
      kind: "text",
      title: "Note",
      text: safeStr(record.note),
    });
  }

  await generateDocFromModel({
    docId,
    title: "Controllo mezzo",
    dateTimeLabel,
    headerRight: headerRight || undefined,
    blocks,
    footerSign: { leftLabel: "Firma Autista", rightLabel: "Firma Admin" },
  });
}

export async function generateRichiestaAttrezzaturePDF(record: any): Promise<void> {
  const docId = buildDocId("ATT");
  const targaMotrice = fmtTarga(record?.targaCamion || "");
  const targaRimorchio = fmtTarga(record?.targaRimorchio || "");
  const dateTimeLabel = formatDateTime(record?.timestamp ?? Date.now());
  const headerRight = targaMotrice || targaRimorchio ? `Targa: ${targaMotrice || targaRimorchio}` : "";
  const fotoUrls = getFotoUrlsFromRecord(record);

  const blocks: PdfBlock[] = [
    {
      kind: "kv",
      title: "Autista",
      rows: [
        { k: "Nome", v: safeStr(record?.autistaNome) || "-" },
        { k: "Badge", v: safeStr(record?.badgeAutista) || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Mezzo",
      rows: [
        { k: "Motrice", v: targaMotrice || "-" },
        { k: "Rimorchio", v: targaRimorchio || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Stato",
      rows: [
        { k: "Stato", v: safeStr(record?.stato) || "-" },
        { k: "Letta", v: record?.letta ? "SI" : "NO" },
      ],
    },
    {
      kind: "text",
      title: "Richiesta",
      text: safeStr(record?.testo) || "-",
    },
  ];

  if (fotoUrls.length) {
    blocks.push({
      kind: "photos",
      title: "Foto",
      urls: fotoUrls,
    });
  }

  await generateDocFromModel({
    docId,
    title: "Richiesta attrezzature",
    dateTimeLabel,
    headerRight: headerRight || undefined,
    blocks,
    footerSign: { leftLabel: "Firma Autista", rightLabel: "Firma Admin" },
  });
}

export async function generateRifornimentoPDF(record: any): Promise<void> {
  const docId = buildDocId("RIF");
  const targaMotrice = fmtTarga(record?.targaCamion || record?.targaMotrice || "");
  const targaRimorchio = fmtTarga(record?.targaRimorchio || "");
  const dateTimeLabel = formatDateTime(record?.data ?? record?.timestamp ?? Date.now());
  const headerRight = targaMotrice || targaRimorchio ? `Targa: ${targaMotrice || targaRimorchio}` : "";

  const blocks: PdfBlock[] = [
    {
      kind: "kv",
      title: "Autista",
      rows: [
        { k: "Nome", v: safeStr(record?.autistaNome) || "-" },
        { k: "Badge", v: safeStr(record?.badgeAutista) || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Mezzo",
      rows: [
        { k: "Motrice", v: targaMotrice || "-" },
        { k: "Rimorchio", v: targaRimorchio || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Rifornimento",
      rows: [
        { k: "Tipo", v: safeStr(record?.tipo) || "-" },
        { k: "Litri", v: safeStr(record?.litri) || "-" },
        { k: "Km", v: safeStr(record?.km) || "-" },
        { k: "Paese", v: safeStr(record?.paese) || "-" },
        { k: "Metodo", v: safeStr(record?.metodoPagamento) || "-" },
        { k: "Importo", v: safeStr(record?.importo) || "-" },
      ],
    },
  ];

  if (record?.note) {
    blocks.push({
      kind: "text",
      title: "Note",
      text: safeStr(record?.note),
    });
  }

  await generateDocFromModel({
    docId,
    title: "Rifornimento",
    dateTimeLabel,
    headerRight: headerRight || undefined,
    blocks,
    footerSign: { leftLabel: "Firma Autista", rightLabel: "Firma Admin" },
  });
}

export async function generateCambioMezzoPDF(record: any): Promise<void> {
  const docId = buildDocId("CAMB");
  const dateTimeLabel = formatDateTime(record?.timestamp ?? Date.now());

  const primaMotrice = fmtTarga(record?.prima?.targaMotrice || record?.prima?.motrice || "");
  const primaRimorchio = fmtTarga(record?.prima?.targaRimorchio || record?.prima?.rimorchio || "");
  const dopoMotrice = fmtTarga(record?.dopo?.targaMotrice || record?.dopo?.motrice || "");
  const dopoRimorchio = fmtTarga(record?.dopo?.targaRimorchio || record?.dopo?.rimorchio || "");

  const blocks: PdfBlock[] = [
    {
      kind: "kv",
      title: "Autista",
      rows: [
        { k: "Nome", v: safeStr(record?.nomeAutista) || safeStr(record?.autistaNome) || "-" },
        { k: "Badge", v: safeStr(record?.badgeAutista) || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Evento",
      rows: [
        { k: "Tipo", v: safeStr(record?.tipo) || "-" },
        { k: "Luogo", v: safeStr(record?.luogo) || "-" },
        { k: "Stato carico", v: safeStr(record?.statoCarico) || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Prima",
      rows: [
        { k: "Motrice", v: primaMotrice || "-" },
        { k: "Rimorchio", v: primaRimorchio || "-" },
      ],
    },
    {
      kind: "kv",
      title: "Dopo",
      rows: [
        { k: "Motrice", v: dopoMotrice || "-" },
        { k: "Rimorchio", v: dopoRimorchio || "-" },
      ],
    },
  ];

  const condizioniTxt = formatCondizioni(record?.condizioni);
  if (condizioniTxt) {
    blocks.push({
      kind: "text",
      title: "Condizioni",
      text: condizioniTxt,
    });
  }

  await generateDocFromModel({
    docId,
    title: "Cambio mezzo",
    dateTimeLabel,
    blocks,
    footerSign: { leftLabel: "Firma Autista", rightLabel: "Firma Admin" },
  });
}

type DossierPdfData = {
  mezzo?: any;
  mezzoFotoUrl?: string | null;
  mezzoFotoStoragePath?: string | null;
  lavoriDaEseguire?: any[];
  lavoriInAttesa?: any[];
  lavoriEseguiti?: any[];
  rifornimenti?: any[];
  segnalazioni?: any[] | null;
  controlli?: any[] | null;
  targa?: string;
};

export async function generateDossierMezzoPDF(data: DossierPdfData): Promise<void> {
  const docId = buildDocId("DOS");
  const mezzo = data?.mezzo || {};
  const targa = fmtTarga(mezzo?.targa || data?.targa || "");
  const dateTimeLabel = formatDateTime(new Date());

  const blocks: PdfBlock[] = [];

  const lavori = [
    ...(Array.isArray(data?.lavoriDaEseguire) ? data.lavoriDaEseguire : []),
    ...(Array.isArray(data?.lavoriInAttesa) ? data.lavoriInAttesa : []),
    ...(Array.isArray(data?.lavoriEseguiti) ? data.lavoriEseguiti : []),
  ];

  if (
    Array.isArray(data?.lavoriDaEseguire) ||
    Array.isArray(data?.lavoriInAttesa) ||
    Array.isArray(data?.lavoriEseguiti)
  ) {
    if (lavori.length) {
      const rows = lavori.map((l: any) => [
        l?.eseguito ? "ESEGUITO" : "IN ATTESA",
        safeStr(l?.descrizione) || "-",
        safeStr(l?.urgenza) || "-",
        safeStr(l?.dataInserimento || l?.data) || "-",
        safeStr(l?.targa || l?.magazzino) || "-",
      ]);
      blocks.push({
        kind: "table",
        title: "Lavori",
        columns: ["Stato", "Descrizione", "Urgenza", "Data", "Targa/Magazzino"],
        rows,
      });
    } else {
      blocks.push({
        kind: "text",
        title: "Lavori",
        text: "Nessun lavoro disponibile.",
      });
    }
  } else {
    blocks.push({
      kind: "text",
      title: "Lavori",
      text: "Dati non disponibili in questa esportazione.",
    });
  }

  if (Array.isArray(data?.rifornimenti)) {
    if (data.rifornimenti.length) {
      const rows = data.rifornimenti.map((r: any) => [
        formatDateTime(r?.data ?? r?.timestamp ?? 0) || "-",
        safeStr(r?.litri) || "-",
        safeStr(r?.km) || "-",
        safeStr(r?.tipo) || "-",
        safeStr(r?.autistaNome || r?.badgeAutista) || "-",
      ]);
      blocks.push({
        kind: "table",
        title: "Rifornimenti",
        columns: ["Data/Ora", "Litri", "Km", "Tipo", "Autista"],
        rows,
      });
    } else {
      blocks.push({
        kind: "text",
        title: "Rifornimenti",
        text: "Nessun rifornimento disponibile.",
      });
    }
  } else {
    blocks.push({
      kind: "text",
      title: "Rifornimenti",
      text: "Dati non disponibili in questa esportazione.",
    });
  }

  if (Array.isArray(data?.segnalazioni)) {
    if (!data.segnalazioni.length) {
      blocks.push({
        kind: "text",
        title: "Segnalazioni",
        text: "Nessuna segnalazione disponibile.",
      });
    }
  } else {
    blocks.push({
      kind: "text",
      title: "Segnalazioni",
      text: "Dati non disponibili in questa esportazione.",
    });
  }

  if (Array.isArray(data?.controlli)) {
    if (!data.controlli.length) {
      blocks.push({
        kind: "text",
        title: "Controlli",
        text: "Nessun controllo disponibile.",
      });
    }
  } else {
    blocks.push({
      kind: "text",
      title: "Controlli",
      text: "Dati non disponibili in questa esportazione.",
    });
  }

  const model: PdfDocModel = {
    docId,
    title: "Dossier mezzo",
    dateTimeLabel,
    headerRight: targa ? `Targa: ${targa}` : undefined,
    blocks,
    footerSign: { leftLabel: "Firma Autista", rightLabel: "Firma Admin" },
  };

  const doc = new jsPDF();
  let currentY = await drawStandardHeader(doc, model);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - PDF_MARGIN_X * 2;
  const photoSize = 52;
  const gap = 6;
  const leftWidth = maxWidth - photoSize - gap;
  const lineHeight = 5;

  const mezzoRows = [
    { k: "Targa", v: targa || "-" },
    { k: "Marca", v: safeStr(mezzo?.marca) || "-" },
    { k: "Modello", v: safeStr(mezzo?.modello) || "-" },
    { k: "Categoria", v: safeStr(mezzo?.categoria) || "-" },
    { k: "Telaio", v: safeStr(mezzo?.numeroTelaio || mezzo?.telaio) || "-" },
    { k: "Autista", v: safeStr(mezzo?.autistaNome) || "-" },
  ];

  const leftLines: string[] = [];
  mezzoRows.forEach((row) => {
    const line = `${row.k}: ${row.v}`;
    const lines = doc.splitTextToSize(line, leftWidth);
    leftLines.push(...lines);
  });
  const leftHeight = leftLines.length * lineHeight;
  const sectionHeight = Math.max(leftHeight, photoSize);

  if (currentY + sectionHeight + 12 > pageHeight - PDF_BOTTOM_MARGIN) {
    doc.addPage();
    currentY = await drawStandardHeader(doc, model);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Mezzo", PDF_MARGIN_X, currentY);
  currentY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(leftLines, PDF_MARGIN_X, currentY);

  const photoX = PDF_MARGIN_X + leftWidth + gap;
  const fotoUrl = data?.mezzoFotoUrl || mezzo?.fotoUrl || null;
  const fotoPath =
    data?.mezzoFotoStoragePath ||
    mezzo?.fotoStoragePath ||
    mezzo?.fotoPath ||
    null;
  const fotoDataUrl = await resolvePhotoDataUrl(fotoUrl, fotoPath);

  if (fotoDataUrl) {
    const format = fotoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
    doc.addImage(fotoDataUrl, format, photoX, currentY, photoSize, photoSize, undefined, "FAST");
  } else {
    doc.setDrawColor(180, 180, 180);
    doc.rect(photoX, currentY, photoSize, photoSize);
    doc.setFontSize(8);
    doc.text("Foto non disponibile", photoX + 2, currentY + 10);
  }

  currentY += sectionHeight + 8;
  currentY = await renderBlocks(doc, model, currentY);
  addStandardFooter(doc, model.footerSign);

  const name = sanitizeFileName(`${model.title || "Documento"}_${model.docId || ""}`);
  doc.save(`${name}.pdf`);
}

type AnalisiEconomicaPdfSection = {
  title: string;
  text?: string;
  columns?: string[];
  rows?: string[][];
};

type AnalisiEconomicaPdfInput = {
  docId?: string;
  targa?: string | null;
  mezzoInfo?: any;
  testoAnalisi?: string;
  sezioniOpzionali?: AnalisiEconomicaPdfSection[];
};

export async function generateAnalisiEconomicaPDF(
  input: AnalisiEconomicaPdfInput
): Promise<void> {
  const docId = input?.docId || buildDocId("IAE");
  const mezzo = input?.mezzoInfo || {};
  const targa = fmtTarga(input?.targa || mezzo?.targa || "");
  const dateTimeLabel = formatDateTime(new Date());

  const blocks: PdfBlock[] = [
    {
      kind: "kv",
      title: "Dati mezzo",
      rows: [
        { k: "Targa", v: targa || "-" },
        { k: "Marca", v: safeStr(mezzo?.marca) || "-" },
        { k: "Modello", v: safeStr(mezzo?.modello) || "-" },
        { k: "Categoria", v: safeStr(mezzo?.categoria) || "-" },
        { k: "Telaio", v: safeStr(mezzo?.telaio || mezzo?.numeroTelaio) || "-" },
      ],
    },
  ];

  if (input?.testoAnalisi) {
    blocks.push({
      kind: "text",
      title: "Analisi IA",
      text: safeStr(input.testoAnalisi) || "-",
    });
  }

  const extra = Array.isArray(input?.sezioniOpzionali)
    ? input.sezioniOpzionali
    : [];
  extra.forEach((section) => {
    if (section?.rows && section?.columns) {
      blocks.push({
        kind: "table",
        title: section.title,
        columns: section.columns,
        rows: section.rows,
      });
    } else if (section?.text) {
      blocks.push({
        kind: "text",
        title: section.title,
        text: section.text,
      });
    }
  });

  await generateDocFromModel({
    docId,
    title: "Analisi economica",
    dateTimeLabel,
    headerRight: targa ? `Targa: ${targa}` : undefined,
    blocks,
    footerSign: { leftLabel: "Firma Admin", rightLabel: "Firma Admin" },
  });
}
