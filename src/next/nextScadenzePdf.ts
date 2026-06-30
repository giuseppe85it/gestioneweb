import type { RowInput } from "jspdf-autotable";

// "tutte" = nessun filtro; altrimenti la key di un settore: i predefiniti
// (cronotachigrafo / tagliandi / estintore / collaudi) o un personalizzato ("custom:...").
export type ScadenzePdfCategoryFilter = string;

export type ScadenzePdfStatus =
  | "ok"
  | "in_scadenza"
  | "scaduta"
  | "assente"
  | "data_mancante"
  | "valore_non_disponibile";

export type ScadenzePdfRow = {
  id: string;
  categoria: string;
  categoriaLabel: string;
  targa: string;
  mezzoLabel: string;
  autistaLabel: string;
  tipoLabel: string;
  stato: ScadenzePdfStatus;
  statoLabel: string;
  scadenzaLabel: string;
  dettaglioLabel: string;
  prenotazioneLabel: string;
  preCollaudoLabel: string;
  note: string;
  sortSeverity: number;
  sortValue: number;
};

export type ScadenzePdfInput = {
  rows: ScadenzePdfRow[];
  categoria: ScadenzePdfCategoryFilter;
  generatedAtLabel: string;
  filtersLabel: string;
};

export const SCADENZE_PDF_CATEGORY_OPTIONS: ReadonlyArray<{
  value: ScadenzePdfCategoryFilter;
  label: string;
}> = [
  { value: "tutte", label: "Tutte" },
  { value: "cronotachigrafo", label: "Cronotachigrafo" },
  { value: "tagliandi", label: "Tagliandi" },
  { value: "estintore", label: "Estintore" },
  { value: "collaudi", label: "Collaudi" },
];

const STATUS_ORDER: Record<ScadenzePdfStatus, number> = {
  assente: 5, // >= scaduta: in PDF la riga viene colorata di rosso
  scaduta: 4,
  in_scadenza: 3,
  ok: 2,
  valore_non_disponibile: 1,
  data_mancante: 0,
};
const COLORS = {
  bg: [248, 244, 232] as [number, number, number],
  headerBg: [230, 220, 200] as [number, number, number],
  headerLine: [180, 160, 120] as [number, number, number],
  textBlack: [40, 40, 40] as [number, number, number],
  muted: [90, 90, 90] as [number, number, number],
  accent: [120, 90, 50] as [number, number, number],
  tableHeaderBg: [230, 220, 200] as [number, number, number],
  tableHeaderText: [40, 40, 40] as [number, number, number],
  rowAlt: [252, 249, 240] as [number, number, number],
  rowEven: [255, 255, 255] as [number, number, number],
  urgentRed: [211, 47, 47] as [number, number, number],
  mediumOrange: [249, 168, 37] as [number, number, number],
  lowGreen: [56, 142, 60] as [number, number, number],
  neutralGray: [120, 120, 120] as [number, number, number],
};
const TABLE_COLUMN_COUNT = 7;
const PDF_MARGIN_X = 14;
const PDF_HEADER_HEIGHT = 30;
const PDF_BOTTOM_MARGIN = 16;
const TABLE_HEAD = [["Targa", "Mezzo / autista", "Voce", "Stato", "Scadenza / valore", "Prenotazione", "Dettaglio / note"]];

let cachedLogoBase64: string | null | undefined;

function cleanText(value: unknown, fallback = "-"): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function categoryLabel(categoria: ScadenzePdfCategoryFilter, rows?: ScadenzePdfRow[]): string {
  if (categoria === "tutte") return "Tutte";
  const fixed = SCADENZE_PDF_CATEGORY_OPTIONS.find((option) => option.value === categoria)?.label;
  if (fixed) return fixed;
  // Settore personalizzato: la label vera è nelle righe (categoriaLabel).
  return rows?.find((row) => row.categoria === categoria)?.categoriaLabel ?? categoria;
}

// Settori presenti nelle righe, ordinati: predefiniti nell'ordine canonico, poi i custom (alfabetico).
const SETTORI_PDF_ORDINE = ["cronotachigrafo", "tagliandi", "estintore", "collaudi"];
function orderedCategoriesFromRows(rows: ScadenzePdfRow[]): { value: string; label: string }[] {
  const labelByValue = new Map<string, string>();
  for (const row of rows) {
    if (!labelByValue.has(row.categoria)) labelByValue.set(row.categoria, row.categoriaLabel);
  }
  const rank = (key: string) => {
    const index = SETTORI_PDF_ORDINE.indexOf(key);
    return index >= 0 ? index : 100;
  };
  return [...labelByValue.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => rank(left.value) - rank(right.value) || left.label.localeCompare(right.label, "it"));
}

function todayFilePart(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeFileName(value: string): string {
  return cleanText(value, "scadenze")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function loadLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64 !== undefined) return cachedLogoBase64;
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) {
      cachedLogoBase64 = null;
      return cachedLogoBase64;
    }
    const blob = await res.blob();
    cachedLogoBase64 = await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
    return cachedLogoBase64;
  } catch {
    cachedLogoBase64 = null;
    return cachedLogoBase64;
  }
}

export function filterScadenzePdfRows(
  rows: ScadenzePdfRow[],
  categoria: ScadenzePdfCategoryFilter,
): ScadenzePdfRow[] {
  const filtered = categoria === "tutte" ? rows : rows.filter((row) => row.categoria === categoria);
  return [...filtered].sort(
    (left, right) =>
      right.sortSeverity - left.sortSeverity ||
      left.sortValue - right.sortValue ||
      left.targa.localeCompare(right.targa, "it", { sensitivity: "base" }),
  );
}

export function summarizeScadenzePdfRows(rows: ScadenzePdfRow[]) {
  return rows.reduce(
    (acc, row) => {
      acc.totale += 1;
      if (row.stato === "scaduta") acc.scadute += 1;
      else if (row.stato === "in_scadenza") acc.inScadenza += 1;
      else if (row.stato === "ok") acc.ok += 1;
      else acc.daVerificare += 1;
      return acc;
    },
    { totale: 0, scadute: 0, inScadenza: 0, ok: 0, daVerificare: 0 },
  );
}

export function buildScadenzePdfFileName(
  categoria: ScadenzePdfCategoryFilter,
  rows?: ScadenzePdfRow[],
): string {
  const suffix = categoria === "tutte" ? "flotta" : categoryLabel(categoria, rows);
  return `${sanitizeFileName(`scadenze-${suffix}-${todayFilePart()}`)}.pdf`;
}

function buildCategorySeparatorRow(label: string, count: number): RowInput {
  return [
    {
      content: `${label} (${count})`,
      colSpan: TABLE_COLUMN_COUNT,
      styles: {
        fillColor: COLORS.headerBg,
        textColor: COLORS.textBlack,
        fontStyle: "bold",
        fontSize: 9,
        lineColor: COLORS.headerLine,
        lineWidth: 0.1,
        cellPadding: { top: 3, right: 2, bottom: 3, left: 3 },
      },
    },
  ];
}

function buildScadenzaDataRow(row: ScadenzePdfRow): RowInput {
  return [
    cleanText(row.targa),
    cleanText([row.mezzoLabel, row.autistaLabel].filter(Boolean).join(" / ")),
    cleanText(row.tipoLabel),
    cleanText(row.statoLabel),
    cleanText(row.scadenzaLabel),
    cleanText([row.prenotazioneLabel, row.preCollaudoLabel].filter(Boolean).join(" | ")),
    cleanText([row.dettaglioLabel, row.note].filter(Boolean).join(" | ")),
  ];
}

function buildDataRows(rows: ScadenzePdfRow[]) {
  const body: RowInput[] = [];
  const rowByBodyIndex = new Map<number, ScadenzePdfRow>();

  rows.forEach((row) => {
    rowByBodyIndex.set(body.length, row);
    body.push(buildScadenzaDataRow(row));
  });

  return { body, rowByBodyIndex };
}

function buildScadenzePdfTable(rows: ScadenzePdfRow[], categoria: ScadenzePdfCategoryFilter) {
  const body: RowInput[] = [];
  const rowByBodyIndex = new Map<number, ScadenzePdfRow>();

  const addDataRow = (row: ScadenzePdfRow) => {
    rowByBodyIndex.set(body.length, row);
    body.push(buildScadenzaDataRow(row));
  };

  if (rows.length === 0) {
    body.push(["-", "-", "-", "-", "-", "-", "Nessuna scadenza nel perimetro selezionato."]);
    return { body, rowByBodyIndex };
  }

  if (categoria !== "tutte") {
    rows.forEach(addDataRow);
    return { body, rowByBodyIndex };
  }

  for (const option of orderedCategoriesFromRows(rows)) {
    const categoryRows = rows.filter((row) => row.categoria === option.value);
    if (categoryRows.length === 0) continue;
    body.push(buildCategorySeparatorRow(option.label, categoryRows.length));
    categoryRows.forEach(addDataRow);
  }

  return { body, rowByBodyIndex };
}

function buildScadenzePdfTableGroups(rows: ScadenzePdfRow[], categoria: ScadenzePdfCategoryFilter) {
  if (rows.length === 0) {
    return [
      {
        label: null,
        body: [["-", "-", "-", "-", "-", "-", "Nessuna scadenza nel perimetro selezionato."]] as RowInput[],
        rowByBodyIndex: new Map<number, ScadenzePdfRow>(),
      },
    ];
  }

  if (categoria !== "tutte") {
    return [{ label: categoryLabel(categoria, rows), ...buildDataRows(rows) }];
  }

  return orderedCategoriesFromRows(rows).flatMap((option) => {
    const categoryRows = rows.filter((row) => row.categoria === option.value);
    if (categoryRows.length === 0) return [];
    return [{ label: `${option.label} (${categoryRows.length})`, ...buildDataRows(categoryRows) }];
  });
}

export function buildScadenzePdfTableBody(
  rows: ScadenzePdfRow[],
  categoria: ScadenzePdfCategoryFilter = "tutte",
): RowInput[] {
  return buildScadenzePdfTable(rows, categoria).body;
}

function drawScadenzePdfHeader(
  doc: import("jspdf").default,
  logoBase64: string | null,
  args: { title: string; generatedAtLabel: string; categoriaLabel: string },
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(...COLORS.headerBg);
  doc.rect(0, 0, pageWidth, PDF_HEADER_HEIGHT, "F");
  doc.setDrawColor(...COLORS.headerLine);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGIN_X, PDF_HEADER_HEIGHT, pageWidth - PDF_MARGIN_X, PDF_HEADER_HEIGHT);

  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", PDF_MARGIN_X, 4, 20, 18);
  }

  doc.setTextColor(...COLORS.textBlack);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("GHIELMICEMENTI SA", PDF_MARGIN_X + 26, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Sistema Gestione Manutenzione", PDF_MARGIN_X + 26, 18);

  doc.setFontSize(9);
  doc.text(cleanText(args.generatedAtLabel), pageWidth - PDF_MARGIN_X, 10, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(args.title, pageWidth - PDF_MARGIN_X, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Categoria: ${args.categoriaLabel}`, pageWidth - PDF_MARGIN_X, 24, { align: "right" });

  return PDF_HEADER_HEIGHT + 8;
}

function drawSummaryPill(
  doc: import("jspdf").default,
  args: { label: string; value: number; x: number; y: number; width: number; color: [number, number, number] },
) {
  doc.setDrawColor(...COLORS.headerLine);
  doc.setFillColor(...COLORS.rowEven);
  doc.roundedRect(args.x, args.y, args.width, 14, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(args.label.toUpperCase(), args.x + 3, args.y + 5);
  doc.setFontSize(12);
  doc.setTextColor(...args.color);
  doc.text(String(args.value), args.x + 3, args.y + 11);
}

function drawScadenzePdfSummary(
  doc: import("jspdf").default,
  args: {
    summary: ReturnType<typeof summarizeScadenzePdfRows>;
    filtersLabel: string;
  },
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PDF_MARGIN_X * 2;
  const startY = PDF_HEADER_HEIGHT + 8;

  doc.setTextColor(...COLORS.textBlack);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Riepilogo scadenze", PDF_MARGIN_X, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  const filters = doc.splitTextToSize(`Filtri: ${cleanText(args.filtersLabel, "nessun filtro")}`, contentWidth);
  doc.text(filters.slice(0, 2), PDF_MARGIN_X, startY + 6);

  const cardY = startY + 14;
  const gap = 4;
  const cardWidth = (contentWidth - gap * 4) / 5;
  [
    { label: "Totale", value: args.summary.totale, color: COLORS.accent },
    { label: "Scadute", value: args.summary.scadute, color: COLORS.urgentRed },
    { label: "In scadenza", value: args.summary.inScadenza, color: COLORS.mediumOrange },
    { label: "OK", value: args.summary.ok, color: COLORS.lowGreen },
    { label: "Da verificare", value: args.summary.daVerificare, color: COLORS.neutralGray },
  ].forEach((item, index) =>
    drawSummaryPill(doc, {
      ...item,
      x: PDF_MARGIN_X + index * (cardWidth + gap),
      y: cardY,
      width: cardWidth,
    }),
  );

  return cardY + 22;
}

function drawScadenzePdfFooter(
  doc: import("jspdf").default,
  args: { rowCount: number },
) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textBlack);
    doc.text("GestioneManutenzione - Scadenze flotta", PDF_MARGIN_X, pageHeight - 8);
    const countLabel = `${args.rowCount} scadenze`;
    doc.text(countLabel, pageWidth / 2, pageHeight - 8, { align: "center" });
    doc.text(`Pagina ${page}/${pageCount}`, pageWidth - PDF_MARGIN_X, pageHeight - 8, { align: "right" });
  }
}

function drawGroupTitle(doc: import("jspdf").default, label: string, y: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLORS.headerBg);
  doc.setDrawColor(...COLORS.headerLine);
  doc.roundedRect(PDF_MARGIN_X, y, pageWidth - PDF_MARGIN_X * 2, 8, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.textBlack);
  doc.text(label, PDF_MARGIN_X + 3, y + 5.5);
  return y + 9;
}

export async function generateScadenzePdfBlob(input: ScadenzePdfInput): Promise<{
  blob: Blob;
  fileName: string;
}> {
  const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const rows = filterScadenzePdfRows(input.rows, input.categoria);
  const summary = summarizeScadenzePdfRows(rows);
  const tableGroups = buildScadenzePdfTableGroups(rows, input.categoria);
  const logoBase64 = await loadLogoBase64();
  const doc = new JsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const docWithTable = doc as typeof doc & { lastAutoTable?: { finalY?: number } };
  const title = "Scadenze flotta";
  const categoriaLabelText = categoryLabel(input.categoria, input.rows);
  const fileName = buildScadenzePdfFileName(input.categoria, input.rows);

  const firstTableY = drawScadenzePdfHeader(doc, logoBase64, {
    title,
    generatedAtLabel: input.generatedAtLabel,
    categoriaLabel: categoriaLabelText,
  });
  let currentY = drawScadenzePdfSummary(doc, { summary, filtersLabel: input.filtersLabel });

  const ensureSectionSpace = (neededHeight: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY + neededHeight <= pageHeight - PDF_BOTTOM_MARGIN) return;
    doc.addPage();
    currentY = drawScadenzePdfHeader(doc, logoBase64, {
      title,
      generatedAtLabel: input.generatedAtLabel,
      categoriaLabel: categoriaLabelText,
    });
  };

  tableGroups.forEach((group) => {
    ensureSectionSpace(group.label ? 30 : 18);
    if (group.label) {
      currentY = drawGroupTitle(doc, group.label, currentY);
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: PDF_MARGIN_X, right: PDF_MARGIN_X, top: firstTableY, bottom: PDF_BOTTOM_MARGIN },
      head: TABLE_HEAD,
      body: group.body,
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 2.2,
        overflow: "linebreak",
        valign: "top",
        textColor: COLORS.textBlack,
        lineColor: COLORS.headerLine,
        lineWidth: 0.08,
      },
      headStyles: {
        fillColor: COLORS.tableHeaderBg,
        textColor: COLORS.tableHeaderText,
        fontStyle: "bold",
        lineColor: COLORS.headerLine,
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: COLORS.rowAlt,
      },
      columnStyles: {
        0: { cellWidth: 22, fontStyle: "bold" },
        1: { cellWidth: 45 },
        2: { cellWidth: 32 },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 42 },
        5: { cellWidth: 50 },
        6: { cellWidth: 53 },
      },
      rowPageBreak: "avoid",
      willDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawScadenzePdfHeader(doc, logoBase64, {
            title,
            generatedAtLabel: input.generatedAtLabel,
            categoriaLabel: categoriaLabelText,
          });
        }
      },
      didParseCell: (data) => {
        if (data.section !== "body" || data.column.index !== 3) return;
        const row = group.rowByBodyIndex.get(data.row.index);
        if (!row) return;
        if (STATUS_ORDER[row.stato] >= STATUS_ORDER.scaduta) {
          data.cell.styles.fillColor = COLORS.urgentRed;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        } else if (row.stato === "in_scadenza") {
          data.cell.styles.fillColor = COLORS.mediumOrange;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        } else if (row.stato === "ok") {
          data.cell.styles.fillColor = COLORS.lowGreen;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.fillColor = COLORS.neutralGray;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
        }
      }
    });

    currentY = (docWithTable.lastAutoTable?.finalY ?? currentY) + 6;
  });

  drawScadenzePdfFooter(doc, { rowCount: rows.length });

  return { blob: doc.output("blob") as Blob, fileName };
}
