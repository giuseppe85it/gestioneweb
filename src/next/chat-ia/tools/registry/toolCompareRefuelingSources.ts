import { readNextCisternaSnapshot } from "../../../domain/nextCisternaDomain";
import { readNextRifornimentiReadOnlySnapshot } from "../../../domain/nextRifornimentiDomain";
import { parseChatIaToolDate } from "../chatIaToolDates";
import { cleanPeriodFilter, type CleanPeriodFilter } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type CompareRefuelingSourcesInput = { periodo?: PeriodInput };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function dateMs(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function inPeriod(value: unknown, period?: CleanPeriodFilter | null): boolean {
  const from = dateMs(period?.from);
  const to = dateMs(period?.to, true);
  const timestamp = dateMs(value);
  return (from === null || (timestamp !== null && timestamp >= from)) && (to === null || (timestamp !== null && timestamp <= to));
}

export const toolCompareRefuelingSources: ChatIaToolHandler<CompareRefuelingSourcesInput> = {
  name: "compare_refueling_sources",
  descriptionForOpenAi:
    "Confronta rifornimenti da cisterna e distributori in un periodo. Usa quando l'utente chiede cisterna Caravate vs distributori o confronto fonti carburante.",
  parameters: {
    type: "object",
    properties: { periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false } },
    required: ["periodo"],
    additionalProperties: false,
  },
  outputKindHint: "chart",
  async run(input) {
    const periodo = cleanPeriodFilter(input.periodo);
    const [rifornimenti, cisternaSnapshot] = await Promise.all([readNextRifornimentiReadOnlySnapshot(), readNextCisternaSnapshot()]);
    const items = rifornimenti.items.filter((item) => inPeriod(item.dataDisplay ?? item.dataLabel ?? item.timestamp, periodo));
    const cisternaItems = items.filter((item) => text(item.distributore).includes("cisterna") || text(item.note).includes("cisterna"));
    const distributori = items.filter((item) => !cisternaItems.includes(item));
    const sum = (rows: typeof items) => rows.reduce((litri, item) => litri + (item.litri ?? 0), 0);
    return { cisterna: { litri: sum(cisternaItems), count: cisternaItems.length, reportLitri: cisternaSnapshot.report.litriTotaliMese }, distributori: { litri: sum(distributori), count: distributori.length }, rows: [{ fonte: "cisterna", litri: sum(cisternaItems), count: cisternaItems.length }, { fonte: "distributori", litri: sum(distributori), count: distributori.length }] };
  },
};
