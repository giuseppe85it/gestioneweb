import { markChatIaReportArchiveEntryDeleted, readChatIaReportArchiveEntry } from "../../reports/chatIaReportArchive";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type DeleteArchivedReportInput = { id?: unknown; confirm?: unknown };

function id(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const toolDeleteArchivedReport: ChatIaToolHandler<DeleteArchivedReportInput> = {
  name: "delete_archived_report",
  descriptionForOpenAi:
    "Segna eliminato un report chat IA archiviato, senza toccare dati business. Usa solo se Giuseppe conferma esplicitamente l'eliminazione.",
  parameters: {
    type: "object",
    properties: { id: { type: "string" }, confirm: { type: "boolean" } },
    required: ["id"],
    additionalProperties: false,
  },
  outputKindHint: "archive_list",
  async run(input) {
    const reportId = id(input.id);
    if (!reportId) throw new Error("ID report archivio obbligatorio.");
    if (input.confirm !== true) {
      return { deleted: false, needsConfirmation: true, id: reportId, message: "Serve confirm: true per eliminare il report archiviato." };
    }
    await markChatIaReportArchiveEntryDeleted(reportId);
    return { deleted: true, id: reportId, entry: await readChatIaReportArchiveEntry(reportId) };
  },
};
