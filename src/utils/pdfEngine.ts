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
  primary: [10, 70, 140] as [number, number, number], // blu aziendale
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
// 🔧 Caricamento logo da /public/logo.png
// --------------------------------------------------------
async function loadLogoAsDataURL(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    const blob = await res.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Errore lettura logo"));
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

  if (urgency === "alta") doc.setFillColor(217, 72, 62); // rosso
  else if (urgency === "media") doc.setFillColor(242, 155, 34); // arancio
  else if (urgency === "bassa") doc.setFillColor(82, 180, 38); // verde
  else return;

  doc.circle(x, y, r, "F");
}

// --------------------------------------------------------
// 🧩 Tipi "intelligenti"
// --------------------------------------------------------
export interface LavoroLike {
  descrizione?: string;
  dataInserimento?: string; // ISO
  data?: string;            // alternativa
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

// Config universale
export type PdfInput =
  | {
      kind: "lavori";
      title?: string;
      groupLabel?: string;
      lavori: LavoroLike[];
    }
  | {
      kind: "mezzo";
      title?: string;
      mezzo: MezzoLike;
      domande?: DomandaLike[];
    }
  | {
      kind: "table";
      title: string;
      columns?: string[];
      rows: any[];
    }
  | any; // per la modalità auto (smart)

// --------------------------------------------------------
// 🧠 Rilevamento automatico tipo PDF
// --------------------------------------------------------
function detectKind(input: any): "lavori" | "mezzo" | "table" {
  if (!input) return "table";

  if (Array.isArray(input)) return "table";

  if (input.kind === "lavori" || input.lavori) return "lavori";

  if (input.kind === "mezzo" || input.mezzo || input.targa || input.numeroTelaio)
    return "mezzo";

  if (input.kind === "table") return "table";

  // fallback: se ha rows → table
  if (input.rows && Array.isArray(input.rows)) return "table";

  return "table";
}

// --------------------------------------------------------
// 🧾 Header universale con logo grande centrato
// --------------------------------------------------------
async function drawHeader(
  doc: jsPDF,
  title: string
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Logo grande centrato
  const logoDataUrl = await loadLogoAsDataURL();
  let currentY = 18;

  if (logoDataUrl) {
    const imgWidth = 40;
    const imgHeight = 40;
    const imgX = (pageWidth - imgWidth) / 2;

    doc.addImage(logoDataUrl, "PNG", imgX, currentY, imgWidth, imgHeight);
    currentY += imgHeight + 6;
  }

  // Titolo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.textBlack);

  const textWidth = doc.getTextWidth(title);
  const textX = (pageWidth - textWidth) / 2;

  doc.text(title, textX, currentY);

  return currentY + 10; // Y successivo disponibile
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

  const startY = await drawHeader(doc, titoloBase);

  // prepara righe tabella
  const dataRows = lavori.map((l: LavoroLike) => {
    const descrizione = l.descrizione ?? l.titolo ?? "";
    const rawDate = l.dataInserimento ?? l.data ?? "";
    const data = rawDate ? formatGGMMYYYY(rawDate) : "";
    const urgency = (l.urgenza || "").toString().toLowerCase();

    return { descrizione, data, urgency };
  });

  autoTable(doc, {
    startY,
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
  const rows: any[] = Array.isArray(input.rows) ? input.rows : Array.isArray(input) ? input : [];
  const title: string = input.title || "Report";

  const startY = await drawHeader(doc, title);

  if (!rows.length) return;

  // se non specificate, prendo le chiavi comuni
  let columns: string[] = input.columns;
  if (!columns || !columns.length) {
    const keysSet = new Set<string>();
    rows.forEach((r) => {
      Object.keys(r || {}).forEach((k) => keysSet.add(k));
    });
    columns = Array.from(keysSet);
  }

  const head = [columns.map((c) => c.charAt(0).toUpperCase() + c.slice(1))];

  const body = rows.map((row) =>
    columns!.map((c) => {
      const val = row[c];

      if (val === null || val === undefined) return "";

      // formattazione automatica per date ISO
      if (
        typeof val === "string" &&
        /^\d{4}-\d{2}-\d{2}/.test(val)
      ) {
        return formatGGMMYYYY(val);
      }

      return String(val);
    })
  );

  autoTable(doc, {
    startY,
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
  const mezzo: MezzoLike =
    input.mezzo || input || {};
  const domande: DomandaLike[] = input.domande || [];

  const titolo = input.title || "Rapporto di Controllo Mezzo";

  let currentY = await drawHeader(doc, titolo);

  // Box mezzo
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
    if (
      label === "Ultimo Collaudo" ||
      label === "Ultimo Controllo"
    ) {
      v = formatGGMMYYYY(value);
    }

    doc.text(`${label}:`, leftX + 4, lineY);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), leftX + 4 + labelWidth, lineY);
    doc.setFont("helvetica", "bold");
    lineY += 6;
  });

  currentY = currentY + 60 + 12;

  // Domande (se presenti)
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
        doc.setFont("helvetica", "normal");
        doc.text(
          `Data scadenza: ${formatGGMMYYYY(d.dataScadenza)}`,
          leftX,
          currentY
        );
        currentY += 5;
      }

      if (d.misurazione) {
        doc.setFont("helvetica", "normal");
        doc.text(`Misurazione: ${d.misurazione}`, leftX, currentY);
        currentY += 5;
      }

      if (d.conteggio) {
        doc.setFont("helvetica", "normal");
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

  // Firma finale
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

  // nome file
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
// 🔌 Helper specifici se vuoi chiamarli direttamente
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
