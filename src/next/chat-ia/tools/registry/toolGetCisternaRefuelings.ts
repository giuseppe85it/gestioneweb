import { readNextCisternaSnapshot } from "../../../domain/nextCisternaDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type GetCisternaRefuelingsInput = { monthKey?: unknown; periodo?: { from?: unknown; to?: unknown }; limit?: unknown };

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function formatRecordDate(value: unknown): Record<string, unknown> {
  const item = rec(value);
  const id = text(item._id ?? item.id) ?? "";
  return {
    _id: id,
    ...item,
    data_italiana: formatItalianDate(item.dataDocumento ?? item.data ?? item.dateLabel ?? item.timestamp),
  };
}

function monthKeyFromPeriod(periodo: { from: string | null; to: string | null } | null): string | null {
  const date = parseChatIaToolDate(periodo?.from ?? periodo?.to);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 25) : 25;
}

export const toolGetCisternaRefuelings: ChatIaToolHandler<GetCisternaRefuelingsInput> = {
  name: "get_cisterna_refuelings",
  descriptionForOpenAi:
    "Recupera rifornimenti e righe schede Cisterna nel periodo. Usa quando l'utente chiede erogazioni o rifornimenti da Cisterna Caravate.",
  parameters: {
    type: "object",
    properties: {
      monthKey: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const periodo = cleanPeriodFilter(input.periodo);
    const snapshot = await readNextCisternaSnapshot(text(input.monthKey) ?? monthKeyFromPeriod(periodo));
    const requestedLimit = limit(input.limit);
    const supportItems = snapshot.archive.supportRefuels.map(formatRecordDate);
    const shown = Math.min(supportItems.length, requestedLimit);
    const truncation = buildTruncationMeta(supportItems.length, shown, "rifornimenti cisterna");
    return {
      monthKey: snapshot.monthKey,
      monthLabel: snapshot.monthLabel,
      supportItems: supportItems.slice(0, requestedLimit),
      items: supportItems.slice(0, requestedLimit),
      schede: snapshot.archive.schede.slice(0, 5).map(formatRecordDate),
      report: {
        sourceTruthLabel: snapshot.report.sourceTruthLabel,
        litriTotaliMese: snapshot.report.litriTotaliMese,
        litriSupportoMese: snapshot.report.litriSupportoMese,
        deltaLitriSupporto: snapshot.report.deltaLitriSupporto,
      },
      total: supportItems.length,
      ...truncation,
      notices: truncationNotice(truncation),
    };
  },
};
