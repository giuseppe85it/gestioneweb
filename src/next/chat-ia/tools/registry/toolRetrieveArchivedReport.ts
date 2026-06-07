import { readChatIaReportArchiveEntry } from "../../reports/chatIaReportArchive";
import { formatItalianDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type RetrieveArchivedReportInput = { id?: unknown };

function id(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatArchiveEntry<T extends { createdAt?: string; updatedAt?: string; deletedAt?: string | null; periodFrom?: string | null; periodTo?: string | null }>(entry: T | null) {
  if (!entry) return null;
  return {
    ...entry,
    createdAt_italiana: formatItalianDate(entry.createdAt),
    updatedAt_italiana: formatItalianDate(entry.updatedAt),
    deletedAt_italiana: formatItalianDate(entry.deletedAt),
    periodFrom_italiana: formatItalianDate(entry.periodFrom),
    periodTo_italiana: formatItalianDate(entry.periodTo),
  };
}

export const toolRetrieveArchivedReport: ChatIaToolHandler<RetrieveArchivedReportInput> = {
  name: "retrieve_archived_report",
  descriptionForOpenAi:
    "Recupera metadati e link di un report chat IA archiviato. Usa quando l'utente chiede un report salvato specifico.",
  parameters: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
    additionalProperties: false,
  },
  outputKindHint: "archive_list",
  async run(input) {
    const reportId = id(input.id);
    if (!reportId) throw new Error("ID report archivio obbligatorio.");
    return { entry: formatArchiveEntry(await readChatIaReportArchiveEntry(reportId)) };
  },
};
