import { readNextAutistiReadOnlySnapshot } from "../../../domain/nextAutistiDomain";
import { readNextCentroControlloSnapshot } from "../../../domain/nextCentroControlloDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { targa?: unknown; autista?: unknown; badge?: unknown; tipo?: unknown; testo?: unknown; periodo?: { from?: unknown; to?: unknown }; limit?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase(); }
function plate(value: unknown): string { return text(value).toUpperCase().replace(/\s+/g, ""); }
function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}
function limit(value: unknown): number { return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 25) : 25; }
function rec(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function eventTs(value: unknown): number | null { const r = rec(value); return ts(r.data ?? r.dateLabel ?? r.timestamp ?? r.eventTs ?? r.ts); }

function shortText(value: unknown, max = 90): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function formatOperationalEvent(value: unknown): Record<string, unknown> {
  const r = rec(value);
  const id = text(r.id ?? r.sourceId) || null;
  return {
    _id: id ?? "",
    id,
    targa: text(r.targa ?? r.mezzoTarga) || null,
    autista: shortText(r.autista ?? r.autistaNome ?? r.nome, 60),
    badge: text(r.badge) || null,
    tipo: text(r.tipo ?? r.type ?? r.eventType ?? r.recordType) || null,
    stato: text(r.stato ?? r.status) || null,
    descrizione_breve: shortText(r.descrizione ?? r.title ?? r.titolo ?? r.messaggio ?? r.note),
    data_italiana: formatItalianDate(r.data ?? r.dateLabel ?? eventTs(value)),
  };
}

export const toolSearchOperationalEvents: ChatIaToolHandler<Input> = {
  name: "search_operational_events",
  descriptionForOpenAi:
    "Cerca eventi operativi, sessioni, segnalazioni, controlli e richieste per targa, autista, tipo, periodo o testo. Usa quando l'utente chiede anomalie o eventi operativi su flotta e autisti.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" }, autista: { type: "string" }, badge: { type: "string" }, tipo: { type: "string" }, testo: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const [autisti, centro] = await Promise.all([readNextAutistiReadOnlySnapshot(), readNextCentroControlloSnapshot()]);
    const rows = [
      ...autisti.assignments, ...autisti.signals, ...autisti.segnalazioniRows, ...autisti.controlliRows, ...autisti.richiesteRows,
      ...centro.sessioni, ...centro.eventiStorici, ...centro.alerts, ...centro.focusItems, ...centro.importantAutistiItems,
    ];
    const periodFilter = cleanPeriodFilter(input.periodo);
    const targa = plate(cleanTextFilter(input.targa)), autista = norm(cleanTextFilter(input.autista)), badge = norm(cleanTextFilter(input.badge)), tipo = norm(cleanTextFilter(input.tipo)), testo = norm(cleanTextFilter(input.testo));
    const from = ts(periodFilter?.from), to = ts(periodFilter?.to, true);
    const requestedLimit = limit(input.limit);
    const items = rows.filter((item) => {
      const haystack = norm(JSON.stringify(item)), t = eventTs(item);
      return (!targa || plate(haystack).includes(targa)) && (!autista || haystack.includes(autista)) && (!badge || haystack.includes(badge)) &&
        (!tipo || haystack.includes(tipo)) && (!testo || haystack.includes(testo)) &&
        (from === null || (t !== null && t >= from)) && (to === null || (t !== null && t <= to));
    });
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "eventi/segnalazioni");
    return {
      items: items.slice(0, requestedLimit).map(formatOperationalEvent),
      total: items.length,
      ...truncation,
      sources: ["autisti", "centro_controllo"],
      appliedFilters: { targa, autista, badge, tipo, testo, periodo: periodFilter },
      notices: truncationNotice(truncation),
    };
  },
};

export default toolSearchOperationalEvents;
