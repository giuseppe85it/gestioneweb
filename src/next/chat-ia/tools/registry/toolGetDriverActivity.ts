import { readNextAutistiReadOnlySnapshot } from "../../../domain/nextAutistiDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice, type CleanPeriodFilter } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type GetDriverActivityInput = { nome?: unknown; badge?: unknown; periodo?: PeriodInput; limit?: unknown };

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";
}

function compact(value: unknown): string {
  return normalize(value).replace(/\s+/g, "");
}

function matches(item: unknown, name: string, badge: string): boolean {
  const raw = JSON.stringify(item).toLowerCase();
  return (!name || raw.includes(name)) && (!badge || raw.replace(/\s+/g, "").includes(badge));
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function eventTs(value: unknown): number | null {
  const item = rec(value);
  return ts(item.data ?? item.dateLabel ?? item.timestamp ?? item.eventTs ?? item.ts);
}

function inPeriod(value: unknown, period: CleanPeriodFilter | null): boolean {
  const from = ts(period?.from);
  const to = ts(period?.to, true);
  if (from === null && to === null) return true;
  const timestamp = eventTs(value);
  return (from === null || (timestamp !== null && timestamp >= from)) && (to === null || (timestamp !== null && timestamp <= to));
}

function shortText(value: unknown, max = 90): string | null {
  const valueText = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 25) : 25;
}

function formatActivity(value: unknown): Record<string, unknown> {
  const item = rec(value);
  return {
    id: item.id ?? null,
    tipo: item.tipo ?? item.type ?? item.eventType ?? item.recordType ?? null,
    targa: item.targa ?? item.mezzoTarga ?? null,
    titolo: shortText(item.titolo ?? item.title ?? item.descrizione),
    descrizione_breve: shortText(item.descrizione ?? item.note ?? item.messaggio),
    data_italiana: formatItalianDate(item.data ?? item.dateLabel ?? item.timestamp),
  };
}

export const toolGetDriverActivity: ChatIaToolHandler<GetDriverActivityInput> = {
  name: "get_driver_activity",
  descriptionForOpenAi:
    "Recupera sessioni, eventi, segnalazioni, controlli e richieste collegati a un autista. Usa quando l'utente chiede cosa ha fatto un autista o la sua attivita in un periodo.",
  parameters: {
    type: "object",
    properties: {
      nome: { type: "string" },
      badge: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const name = normalize(cleanTextFilter(input.nome));
    const badge = compact(cleanTextFilter(input.badge));
    if (!name && !badge) throw new Error("Nome o badge autista obbligatorio.");
    const periodFilter = cleanPeriodFilter(input.periodo);
    const requestedLimit = limit(input.limit);
    const snapshot = await readNextAutistiReadOnlySnapshot();
    const allItems = [...snapshot.assignments, ...snapshot.signals, ...snapshot.segnalazioniRows, ...snapshot.controlliRows, ...snapshot.richiesteRows];
    const filteredItems = allItems.filter((item) => matches(item, name, badge) && inPeriod(item, periodFilter));
    const shown = Math.min(filteredItems.length, requestedLimit);
    const truncation = buildTruncationMeta(filteredItems.length, shown, "attivita autista");
    return {
      filteredItems: filteredItems.slice(0, requestedLimit).map(formatActivity),
      total: filteredItems.length,
      ...truncation,
      driverKey: name || badge,
      periodo: periodFilter,
      limitations: snapshot.limitations.slice(0, 5),
      notices: truncationNotice(truncation),
    };
  },
};
