import type { ChatIaSectorId } from "../../core/chatIaTypes";
import { listChatIaReportArchiveEntries } from "../../reports/chatIaReportArchive";
import { formatItalianDate } from "../chatIaToolDates";
import { buildTruncationMeta, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type ListArchivedReportsInput = { sector?: unknown; limit?: unknown };

const VALID_SECTORS: ChatIaSectorId[] = ["mezzi", "autisti", "manutenzioni_scadenze", "materiali", "costi_fatture", "documenti", "cisterna"];

function sector(value: unknown): ChatIaSectorId | undefined {
  return typeof value === "string" && VALID_SECTORS.includes(value as ChatIaSectorId) ? (value as ChatIaSectorId) : undefined;
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

export const toolListArchivedReports: ChatIaToolHandler<ListArchivedReportsInput> = {
  name: "list_archived_reports",
  descriptionForOpenAi:
    "Elenca i report chat IA archiviati. Usa quando l'utente chiede storico report o report salvati.",
  parameters: {
    type: "object",
    properties: { sector: { type: "string" }, limit: { type: "number" } },
    additionalProperties: false,
  },
  outputKindHint: "archive_list",
  async run(input) {
    const limit = typeof input.limit === "number" && input.limit > 0 ? Math.floor(input.limit) : 20;
    const entries = await listChatIaReportArchiveEntries({ sector: sector(input.sector) });
    const shown = Math.min(entries.length, limit);
    const truncation = buildTruncationMeta(entries.length, shown, "report archiviati");
    return {
      entries: entries.slice(0, limit).map(formatArchiveEntry),
      total: entries.length,
      ...truncation,
      notices: truncationNotice(truncation),
    };
  },
};
