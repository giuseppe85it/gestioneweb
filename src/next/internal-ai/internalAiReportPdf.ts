import type { InternalAiServerReportSummaryWorkflow } from "./internalAiServerReportSummaryClient";
import type { InternalAiReportPreview } from "./internalAiTypes";
import {
  buildInternalAiProfessionalVehicleReportText,
  readInternalAiProfessionalVehicleReport,
} from "./internalAiProfessionalVehicleReport";
import { generateInternalAiOperationalReportPdfBlob } from "../../utils/pdfEngine";

const PREVIEW_STATUS_LABELS: Record<string, string> = {
  idle: "In attesa",
  preview_ready: "Anteprima pronta",
  revision_requested: "Da rivedere",
  discarded: "Scartata",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  not_requested: "Non richiesta",
  awaiting_approval: "Approvabile",
  approved: "Approvata",
  rejected: "Respinta",
  revision_requested: "Revisione richiesta",
};

const SECTION_STATUS_LABELS: Record<string, string> = {
  completa: "Completa",
  parziale: "Parziale",
  vuota: "Vuota",
  errore: "Errore",
};

const SOURCE_STATUS_LABELS: Record<string, string> = {
  disponibile: "Disponibile",
  parziale: "Parziale",
  errore: "Errore",
};

const PERIOD_STATUS_LABELS: Record<string, string> = {
  nessun_filtro: "Nessun filtro",
  applicato: "Filtro applicato",
  non_applicabile: "Fuori filtro",
  non_disponibile: "Periodo non disponibile",
};

const SERVER_REPORT_SUMMARY_REQUEST_LABELS: Record<string, string> = {
  preview_ready: "Preview pronta",
  approved: "Approvata",
  rejected: "Respinta",
  rolled_back: "Rollback eseguito",
};

const SERVER_REPORT_SUMMARY_APPROVAL_LABELS: Record<string, string> = {
  awaiting_approval: "In attesa di approvazione",
  approved: "Approvata",
  rejected: "Respinta",
};

const SERVER_REPORT_SUMMARY_ROLLBACK_LABELS: Record<string, string> = {
  not_requested: "Non richiesto",
  available: "Disponibile",
  rolled_back: "Eseguito",
};

function sanitizeFileNameSegment(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "non disponibile";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getReportTypeLabel(report: InternalAiReportPreview): string {
  if (report.reportType === "autista") {
    return "Report autista";
  }

  if (report.reportType === "combinato") {
    return "Report combinato";
  }

  return "Report targa";
}

function getReportTargetLabel(report: InternalAiReportPreview): string {
  if (report.reportType === "autista") {
    return report.header.nomeCompleto;
  }

  if (report.reportType === "combinato") {
    return `${report.header.targa} + ${report.header.nomeCompletoAutista}`;
  }

  return report.header.targa;
}

function getReportFileTarget(report: InternalAiReportPreview): string {
  if (report.reportType === "autista") {
    return report.header.nomeCompleto;
  }

  if (report.reportType === "combinato") {
    return `${report.header.targa}-${report.header.nomeCompletoAutista}`;
  }

  return report.header.targa;
}

export function buildInternalAiReportPdfFileName(report: InternalAiReportPreview): string {
  return `${sanitizeFileNameSegment(report.reportType)}-${sanitizeFileNameSegment(getReportFileTarget(report))}.pdf`;
}

function buildLegacyInternalAiReportDocumentText(
  report: InternalAiReportPreview,
  workflow: InternalAiServerReportSummaryWorkflow | null,
): string {
  const lines: string[] = [
    report.title,
    report.subtitle,
    "",
    `Tipo: ${getReportTypeLabel(report)}`,
    `Target: ${getReportTargetLabel(report)}`,
    `Periodo: ${report.periodContext.label}`,
    `Generata il: ${formatDateLabel(report.generatedAt)}`,
    `Anteprima: ${PREVIEW_STATUS_LABELS[report.previewState.status] ?? report.previewState.status}`,
    `Approvazione: ${APPROVAL_STATUS_LABELS[report.approvalState.status] ?? report.approvalState.status}`,
    "",
    "Indicatori chiave",
    ...report.cards.map((card) =>
      `- ${card.label}: ${card.value}${card.meta ? ` (${card.meta})` : ""}`,
    ),
    "",
    "Sezioni",
    ...report.sections.flatMap((section) => [
      `- ${section.title}`,
      `  Stato: ${SECTION_STATUS_LABELS[section.status] ?? section.status}`,
      `  Filtro periodo: ${PERIOD_STATUS_LABELS[section.periodStatus] ?? section.periodStatus}`,
      `  Sintesi: ${section.summary}`,
      ...section.bullets.map((bullet) => `  - ${bullet}`),
      ...section.notes.map((note) => `  Nota: ${note}`),
      ...(section.periodNote ? [`  Nota periodo: ${section.periodNote}`] : []),
    ]),
    "",
    "Fonti lette",
    ...report.sources.flatMap((source) => [
      `- ${source.title}`,
      `  Stato: ${SOURCE_STATUS_LABELS[source.status] ?? source.status}`,
      `  Filtro periodo: ${PERIOD_STATUS_LABELS[source.periodStatus] ?? source.periodStatus}`,
      `  Dataset: ${source.datasetLabels.join(", ") || "non dichiarati"}`,
      `  Descrizione: ${source.description}`,
      ...(source.countLabel ? [`  Quantita: ${source.countLabel}`] : []),
      ...source.notes.map((note) => `  Nota: ${note}`),
      ...(source.periodNote ? [`  Nota periodo: ${source.periodNote}`] : []),
    ]),
  ];

  if (report.missingData.length) {
    lines.push("", "Dati mancanti", ...report.missingData.map((entry) => `- ${entry}`));
  }

  if (report.evidences.length) {
    lines.push("", "Evidenze", ...report.evidences.map((entry) => `- ${entry}`));
  }

  if (report.periodContext.notes.length) {
    lines.push("", "Note periodo", ...report.periodContext.notes.map((entry) => `- ${entry}`));
  }

  if (workflow) {
    lines.push(
      "",
      "Sintesi IA server-side",
      workflow.previewText,
      "",
      `Provider: ${workflow.providerTarget.provider}/${workflow.providerTarget.model}`,
      `Stato richiesta: ${SERVER_REPORT_SUMMARY_REQUEST_LABELS[workflow.requestState] ?? workflow.requestState}`,
      `Stato approvazione: ${SERVER_REPORT_SUMMARY_APPROVAL_LABELS[workflow.approvalState] ?? workflow.approvalState}`,
      `Stato rollback: ${SERVER_REPORT_SUMMARY_ROLLBACK_LABELS[workflow.rollbackState] ?? workflow.rollbackState}`,
      ...workflow.notes.map((entry) => `- ${entry}`),
    );
  }

  lines.push(
    "",
    "Limiti del flusso",
    "- Questo PDF e generato al volo dall'artifact IA gia salvato.",
    "- Nessuna scrittura business automatica viene eseguita da questa anteprima.",
  );

  return lines.join("\n");
}

export function buildInternalAiReportDocumentText(
  report: InternalAiReportPreview,
  workflow: InternalAiServerReportSummaryWorkflow | null,
): string {
  if (report.reportType === "targa") {
    return buildInternalAiProfessionalVehicleReportText(report, workflow);
  }

  return buildLegacyInternalAiReportDocumentText(report, workflow);
}

type InternalAiReportPdfBuildResult = {
  blob: Blob;
  fileName: string;
  text: string;
};

export async function generateInternalAiReportPdfBlob(args: {
  report: InternalAiReportPreview;
  workflow: InternalAiServerReportSummaryWorkflow | null;
}): Promise<InternalAiReportPdfBuildResult> {
  if (args.report.reportType === "targa") {
    const professionalReport = await readInternalAiProfessionalVehicleReport(
      args.report,
      args.workflow,
    );
    const pdf = await generateInternalAiOperationalReportPdfBlob({
      title: professionalReport.displayTitle,
      subtitle: professionalReport.displaySubtitle,
      targa: professionalReport.targetLabel,
      generatedAt: args.report.generatedAt,
      periodLabel: professionalReport.periodLabel,
      executiveSummary: professionalReport.executiveSummary,
      vehicle: {
        label: professionalReport.vehicle.label,
        targa: professionalReport.vehicle.targa,
        categoria: professionalReport.vehicle.categoria,
        marcaModello: professionalReport.vehicle.marcaModello,
        autistaNome: professionalReport.vehicle.autistaNome,
        revisione: professionalReport.vehicle.revisione,
        collaudo: professionalReport.vehicle.collaudo,
        precollaudo: professionalReport.vehicle.precollaudo,
        photoUrl: professionalReport.vehicle.photoUrl,
      },
      relatedAsset: professionalReport.relatedAsset
        ? {
            label: professionalReport.relatedAsset.label,
            targa: professionalReport.relatedAsset.targa,
            categoria: professionalReport.relatedAsset.categoria,
            marcaModello: professionalReport.relatedAsset.marcaModello,
            autistaNome: professionalReport.relatedAsset.autistaNome,
            revisione: professionalReport.relatedAsset.revisione,
            collaudo: professionalReport.relatedAsset.collaudo,
            precollaudo: professionalReport.relatedAsset.precollaudo,
            photoUrl: professionalReport.relatedAsset.photoUrl,
          }
        : null,
      sections: professionalReport.sections,
      tyreVisual: professionalReport.tyreVisual,
      appendix: professionalReport.appendix,
    });

    return {
      blob: pdf.blob,
      fileName: pdf.fileName,
      text: buildInternalAiProfessionalVehicleReportText(args.report, args.workflow),
    };
  }

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 44;
  const marginTop = 56;
  const marginBottom = 48;
  const lineHeight = 16;
  const maxWidth = pageWidth - marginX * 2;
  const text = buildLegacyInternalAiReportDocumentText(args.report, args.workflow);
  const lines = text.split("\n");
  const title = args.report.title;
  const subtitle = args.report.subtitle;
  const generatedLabel = `Generata il ${formatDateLabel(args.report.generatedAt)}`;
  const contextLabel = `${getReportTypeLabel(args.report)} | ${getReportTargetLabel(args.report)} | ${args.report.periodContext.label}`;
  let y = marginTop;

  const drawFooter = (pageNumber: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 92, 69);
    doc.text(
      "PDF generato dall'artifact IA interno. Nessuna scrittura business automatica.",
      marginX,
      pageHeight - 20,
    );
    doc.text(`Pagina ${pageNumber}`, pageWidth - marginX, pageHeight - 20, {
      align: "right",
    });
  };

  const ensurePageSpace = (requiredHeight = lineHeight) => {
    if (y + requiredHeight <= pageHeight - marginBottom) {
      return;
    }

    drawFooter(doc.getNumberOfPages());
    doc.addPage();
    y = marginTop;
  };

  const writeParagraph = (value: string, options?: { bold?: boolean; fontSize?: number }) => {
    const trimmed = value.trimEnd();
    if (!trimmed) {
      y += lineHeight * 0.6;
      return;
    }

    const fontSize = options?.fontSize ?? 11;
    ensurePageSpace(lineHeight);
    doc.setFont("helvetica", options?.bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(42, 34, 24);

    const wrapped = doc.splitTextToSize(trimmed, maxWidth) as string[];
    for (const line of wrapped) {
      ensurePageSpace(lineHeight);
      doc.text(line, marginX, y);
      y += lineHeight;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(42, 34, 24);
  const titleLines = doc.splitTextToSize(title, maxWidth) as string[];
  for (const line of titleLines) {
    ensurePageSpace(24);
    doc.text(line, marginX, y);
    y += 24;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(88, 72, 48);
  const subtitleLines = doc.splitTextToSize(subtitle, maxWidth) as string[];
  for (const line of subtitleLines) {
    ensurePageSpace(lineHeight);
    doc.text(line, marginX, y);
    y += lineHeight;
  }

  y += 4;
  writeParagraph(contextLabel, { bold: true, fontSize: 11 });
  writeParagraph(generatedLabel, { fontSize: 10 });
  y += 8;
  doc.setDrawColor(205, 189, 165);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 18;

  for (const line of lines.slice(2)) {
    const normalized = line.trim();
    const isHeading =
      normalized !== "" &&
      !normalized.startsWith("-") &&
      !normalized.startsWith("Nota:") &&
      !normalized.startsWith("Stato:") &&
      !normalized.startsWith("Filtro periodo:") &&
      !normalized.startsWith("Sintesi:") &&
      !normalized.startsWith("Dataset:") &&
      !normalized.startsWith("Descrizione:") &&
      !normalized.startsWith("Quantita:") &&
      !normalized.startsWith("Tipo:") &&
      !normalized.startsWith("Target:") &&
      !normalized.startsWith("Periodo:") &&
      !normalized.startsWith("Generata il:") &&
      !normalized.startsWith("Anteprima:") &&
      !normalized.startsWith("Approvazione:") &&
      normalized === normalized.replace(/^ {2}/, "");

    writeParagraph(line, { bold: isHeading });
  }

  drawFooter(doc.getNumberOfPages());

  return {
    blob: doc.output("blob") as Blob,
    fileName: buildInternalAiReportPdfFileName(args.report),
    text,
  };
}
