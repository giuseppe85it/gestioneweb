import { readNextMezzoSegnalazioniControlliSnapshot } from "../../../domain/nextSegnalazioniControlliDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice, type CleanPeriodFilter } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type GetVehicleEventsInput = { targa?: unknown; periodo?: PeriodInput; limit?: unknown };

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function toTime(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function inPeriod(value: unknown, period: CleanPeriodFilter | null): boolean {
  const from = toTime(period?.from);
  const to = toTime(period?.to, true);
  const timestamp = toTime(value);
  return (from === null || (timestamp !== null && timestamp >= from)) && (to === null || (timestamp !== null && timestamp <= to));
}

function display(value: unknown): string {
  return typeof value === "string" && value.trim() && value.trim().toLowerCase() !== "unknown"
    ? value.trim()
    : "-";
}

function shortText(value: unknown, max = 90): string {
  const valueText = display(value).replace(/\s+/g, " ");
  if (valueText === "-") return valueText;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 25) : 25;
}

export const toolGetVehicleEvents: ChatIaToolHandler<GetVehicleEventsInput> = {
  name: "get_vehicle_events",
  descriptionForOpenAi:
    "Recupera segnalazioni e controlli di un mezzo. Usa quando l'utente chiede guasti, controlli, problemi o segnalazioni di una targa.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      limit: { type: "number" },
    },
    required: ["targa"],
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const targa = normalizeTarga(cleanTextFilter(input.targa));
    if (!targa) throw new Error("Targa mezzo mancante o non valida.");
    const periodFilter = cleanPeriodFilter(input.periodo);
    const requestedLimit = limit(input.limit);
    const snapshot = await readNextMezzoSegnalazioniControlliSnapshot(targa);
    const segnalazioni = snapshot.segnalazioni
      .filter((item) => inPeriod(item.data ?? item.timestamp, periodFilter))
      .map((item) => ({
        _id: item.id || `${item.sourceKey}:segnalazione:${formatItalianDate(item.data ?? item.timestamp)}`,
        id: item.id || null,
        tipo_evento: "segnalazione",
        data: formatItalianDate(item.data ?? item.timestamp),
        titolo: display(item.titolo),
        descrizione_breve: shortText(item.descrizione),
        esito: display(item.stato ?? item.severita),
        note_brevi: shortText(item.ambito ?? item.descrizione),
        fonte: item.sourceKey,
      }));
    const controlli = snapshot.controlli
      .filter((item) => inPeriod(item.data ?? item.timestamp, periodFilter))
      .map((item) => ({
        _id: item.id || `${item.sourceKey}:controllo:${formatItalianDate(item.data ?? item.timestamp)}`,
        id: item.id || null,
        tipo_evento: "controllo",
        data: formatItalianDate(item.data ?? item.timestamp),
        titolo: display(item.titolo),
        descrizione_breve: shortText(item.descrizione),
        esito: display(item.esito),
        note_brevi: shortText(item.note ?? item.descrizione),
        fonte: item.sourceKey,
      }));
    const items = [...segnalazioni, ...controlli];
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "eventi/segnalazioni");
    return {
      targa: snapshot.targaNormalized,
      items: items.slice(0, requestedLimit),
      total: items.length,
      ...truncation,
      counts: snapshot.counts,
      limitations: snapshot.limitations.slice(0, 5),
      appliedFilters: { targa, periodo: periodFilter },
      notices: truncationNotice(truncation),
    };
  },
};
