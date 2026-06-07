import type { ChatIaReport } from "../../core/chatIaTypes";
import { createChatIaReportArchiveEntry } from "../../reports/chatIaReportArchive";
import { formatItalianDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type SaveReportToArchiveInput = { report?: unknown; pdfBlobRef?: unknown };

function isReport(value: unknown): value is ChatIaReport {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "sector" in value &&
      "title" in value &&
      "summary" in value &&
      "target" in value,
  );
}

function formatArchiveEntry<T extends { createdAt?: string; updatedAt?: string; deletedAt?: string | null; periodFrom?: string | null; periodTo?: string | null }>(entry: T) {
  return {
    ...entry,
    createdAt_italiana: formatItalianDate(entry.createdAt),
    updatedAt_italiana: formatItalianDate(entry.updatedAt),
    deletedAt_italiana: formatItalianDate(entry.deletedAt),
    periodFrom_italiana: formatItalianDate(entry.periodFrom),
    periodTo_italiana: formatItalianDate(entry.periodTo),
  };
}

export const toolSaveReportToArchive: ChatIaToolHandler<SaveReportToArchiveInput> = {
  name: "save_report_to_archive",
  descriptionForOpenAi:
    "Salva un report generato nell'archivio chat IA. Usa quando l'utente chiede di archiviare un report della chat.",
  parameters: {
    type: "object",
    properties: { report: { type: "object" }, pdfBlobRef: { type: "string" } },
    required: ["report"],
    additionalProperties: false,
  },
  outputKindHint: "archive_list",
  async run(input, context) {
    if (!isReport(input.report)) {
      throw new Error("Report non valido per archiviazione Chat IA.");
    }
    const entry = await createChatIaReportArchiveEntry({
      prompt: context.prompt,
      report: input.report,
      pdfBlob: null,
    });
    return { entries: [formatArchiveEntry(entry)], pdfBlobRef: typeof input.pdfBlobRef === "string" ? input.pdfBlobRef : null };
  },
};
