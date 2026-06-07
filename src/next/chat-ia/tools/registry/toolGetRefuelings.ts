import { readNextMezzoRifornimentiSnapshot } from "../../../domain/nextRifornimentiDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice, type CleanPeriodFilter } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type GetRefuelingsInput = { targa?: unknown; periodo?: PeriodInput; limit?: unknown };

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

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 10) : 10;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatRefuelingItem<T extends {
  id?: string | null;
  timestamp?: number | null;
  dataDisplay?: string | null;
  dataLabel?: string | null;
  litri?: number | null;
  importo?: number | null;
  costo?: number | null;
  prezzoUnitario?: number | null;
  distributore?: string | null;
  fornitore?: string | null;
  km?: number | null;
}>(item: T): Record<string, unknown> {
  const id = item.id ?? null;
  return {
    _id: id ?? "",
    id,
    data_italiana: formatItalianDate(item.dataDisplay ?? item.dataLabel ?? item.timestamp),
    litri: item.litri ?? null,
    importo: item.importo ?? item.costo ?? null,
    prezzo_unitario: item.prezzoUnitario ?? null,
    fornitore: text(item.distributore ?? item.fornitore) || null,
    km: item.km ?? null,
  };
}

export const toolGetRefuelings: ChatIaToolHandler<GetRefuelingsInput> = {
  name: "get_refuelings",
  descriptionForOpenAi:
    "Recupera i rifornimenti di un mezzo in un periodo. Usa quando l'utente chiede rifornimenti, litri o movimenti carburante di una targa.",
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
    const snapshot = await readNextMezzoRifornimentiSnapshot(targa);
    const items = snapshot.items.filter((item) => inPeriod(item.dataDisplay ?? item.dataLabel ?? item.timestamp, periodFilter));
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "rifornimenti");
    return {
      targa,
      periodo: periodFilter,
      items: items.slice(0, requestedLimit).map(formatRefuelingItem),
      total: items.length,
      ...truncation,
      counts: snapshot.counts,
      totals: snapshot.totals,
      notices: truncationNotice(truncation),
    };
  },
};
