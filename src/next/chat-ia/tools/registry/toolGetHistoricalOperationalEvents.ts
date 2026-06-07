import { readNextCentroControlloSnapshot } from "../../../domain/nextCentroControlloDomain";
import { formatItalianDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type GetHistoricalOperationalEventsInput = { targa?: unknown; query?: unknown; periodo?: PeriodInput };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function matches(item: unknown, targa: string, query: string): boolean {
  const raw = JSON.stringify(item).toLowerCase();
  return (!targa || raw.toUpperCase().includes(targa)) && (!query || raw.includes(query));
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function formatHistoricalEvent(value: unknown): Record<string, unknown> {
  const item = rec(value);
  const id = String(item.id ?? item.sourceId ?? item.eventId ?? "").trim();
  return {
    _id: id,
    ...item,
    data_italiana: formatItalianDate(item.data ?? item.dateLabel ?? item.timestamp ?? item.eventTs ?? item.ts),
  };
}

export const toolGetHistoricalOperationalEvents: ChatIaToolHandler<GetHistoricalOperationalEventsInput> = {
  name: "get_historical_operational_events",
  descriptionForOpenAi:
    "Recupera eventi storici operativi D10 e li filtra per targa, periodo o testo. Usa quando l'utente cerca eventi operativi storici nel centro controllo.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      query: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const snapshot = await readNextCentroControlloSnapshot();
    const targa = normalizeTarga(input.targa);
    const query = text(input.query);
    const items = snapshot.eventiStorici.filter((item) => matches(item, targa, query));
    return { items: items.map(formatHistoricalEvent), total: items.length, counters: snapshot.counters };
  },
};
