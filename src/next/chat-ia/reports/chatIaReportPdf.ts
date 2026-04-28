import { generateInternalAiReportPdfBlob } from "../../internal-ai/internalAiReportPdf";
import type { ChatIaReport } from "../core/chatIaTypes";

type ChatIaReportPdfResult = {
  blob: Blob;
  fileName: string;
};

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildFallbackFileName(report: ChatIaReport): string {
  const target = report.target.value || "report";
  return `chat-ia-${sanitizeFileName(report.sector)}-${sanitizeFileName(target)}.pdf`;
}

export async function generateChatIaReportPdf(args: {
  report: ChatIaReport;
}): Promise<ChatIaReportPdfResult> {
  if (args.report.preview) {
    const result = await generateInternalAiReportPdfBlob({
      report: args.report.preview,
      workflow: null,
    });
    return {
      blob: result.blob,
      fileName: result.fileName,
    };
  }

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const marginX = 44;
  const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  let y = 56;

  const write = (text: string, fontSize = 11, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      if (y > 780) {
        doc.addPage();
        y = 56;
      }
      doc.text(line, marginX, y);
      y += fontSize + 7;
    }
  };

  write(args.report.title, 18, true);
  write(args.report.summary, 11);
  y += 8;
  for (const section of args.report.sections) {
    write(section.title, 13, true);
    write(section.summary, 11);
    for (const bullet of section.bullets) {
      write(`- ${bullet}`, 10);
    }
    y += 6;
  }

  if (!args.report.sections.length) {
    write("Questo report non contiene ancora una preview esportabile.", 11, true);
  }

  return {
    blob: doc.output("blob") as Blob,
    fileName: buildFallbackFileName(args.report),
  };
}
