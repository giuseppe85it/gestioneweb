import { readNextAdBlueSnapshot } from "../../../domain/nextAdBlueDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { periodo?: { from?: unknown; to?: unknown }; impianto?: unknown; limit?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase(); }
function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}
function limit(value: unknown): number { return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 200) : 80; }

function formatAdBlueItem<T extends { id?: string | null; timestamp?: number | null; data?: string | null }>(item: T): T & { _id: string; data_italiana: string } {
  const id = item.id ?? "";
  return {
    _id: id,
    ...item,
    data_italiana: formatItalianDate(item.data ?? item.timestamp),
  };
}

export const toolGetAdBlueTankEvents: ChatIaToolHandler<Input> = {
  name: "get_adblue_tank_events",
  descriptionForOpenAi:
    "Recupera eventi e stock AdBlue disponibili nel magazzino NEXT. Usa quando l'utente chiede situazione AdBlue, carichi o movimenti cisterna AdBlue.",
  parameters: {
    type: "object",
    properties: {
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      impianto: { type: "string" },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const snapshot = await readNextAdBlueSnapshot();
    const from = ts(input.periodo?.from), to = ts(input.periodo?.to, true), impianto = norm(input.impianto);
    const items = snapshot.items.filter((item) => {
      const time = ts(item.data ?? item.timestamp);
      return (!impianto || norm(`${item.numeroCisterna} ${item.stockKey} ${item.inventarioRefId}`).includes(impianto)) &&
        (from === null || (time !== null && time >= from)) && (to === null || (time !== null && time <= to));
    });
    const requestedLimit = limit(input.limit);
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "eventi AdBlue");
    return {
      snapshot: { ...snapshot, items: [] },
      items: items.slice(0, requestedLimit).map(formatAdBlueItem),
      total: items.length,
      ...truncation,
      warnings: snapshot.limitations,
      notices: truncationNotice(truncation),
    };
  },
};

export default toolGetAdBlueTankEvents;
