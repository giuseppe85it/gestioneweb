import { readNextDocumentiCostiFleetSnapshot, readNextMezzoDocumentiCostiSnapshot } from "../../../domain/nextDocumentiCostiDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type GetCostsInput = { targa?: unknown; categoria?: unknown; periodo?: PeriodInput; limit?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTarga(value: unknown): string {
  return text(value).toUpperCase().replace(/\s+/g, "");
}

function matches(item: unknown, query: string): boolean {
  return !query || JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
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

function documentDateValue(item: Record<string, unknown>): unknown {
  return item.dataDocumento ?? item.data ?? item.dateLabel ?? item.createdAt ?? item.updatedAt ?? item.timestamp ?? item.sortTimestamp;
}

function inPeriod(item: unknown, period: PeriodInput | null): boolean {
  const from = ts(period?.from);
  const to = ts(period?.to, true);
  if (from === null && to === null) return true;
  const time = ts(documentDateValue(rec(item)));
  return (from === null || (time !== null && time >= from)) && (to === null || (time !== null && time <= to));
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 50) : 50;
}

function shortText(value: unknown, max = 90): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function formatCostItem(item: unknown): Record<string, unknown> {
  const r = rec(item);
  const amount = r.importo ?? r.amount ?? r.totaleDocumento;
  const rawId = r.id ?? r.sourceDocId ?? r.sourceRecordId;
  const id = text(r.sourceKey && rawId ? `${r.sourceKey}:${rawId}` : rawId) || null;
  return {
    _id: id ?? "",
    id: text(r.id ?? r.sourceDocId ?? r.sourceRecordId) || null,
    targa: text(r.targa ?? r.mezzoTarga) || null,
    categoria: text(r.categoria ?? r.category ?? r.tipoDocumento ?? r.documentTypeLabel) || null,
    titolo: shortText(r.title ?? r.titolo ?? r.descrizione, 80),
    fornitore: shortText(r.supplier ?? r.fornitore ?? r.fornitoreLabel, 60),
    importo: typeof amount === "number" ? amount : null,
    data_italiana: formatItalianDate(documentDateValue(r)),
  };
}

export const toolGetCosts: ChatIaToolHandler<GetCostsInput> = {
  name: "get_costs",
  descriptionForOpenAi:
    "Recupera costi per mezzo o per flotta in un periodo. Usa quando l'utente chiede spese, costi, totale costi o costi per categoria.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      categoria: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const targa = normalizeTarga(cleanTextFilter(input.targa));
    const categoria = text(cleanTextFilter(input.categoria));
    const periodo = cleanPeriodFilter(input.periodo);
    const requestedLimit = limit(input.limit);
    if (targa) {
      const mezzo = await readNextMezzoDocumentiCostiSnapshot(targa);
      const items = mezzo.items.filter((item) => matches(item, categoria) && inPeriod(item, periodo));
      const shown = Math.min(items.length, requestedLimit);
      const truncation = buildTruncationMeta(items.length, shown, "costi/documenti");
      return {
        targa,
        items: items.slice(0, requestedLimit).map(formatCostItem),
        totalItems: items.length,
        total: items.reduce((sum, item) => sum + (item.amount ?? 0), 0),
        ...truncation,
        appliedFilters: { targa, categoria: categoria || null, periodo },
        notices: truncationNotice(truncation),
      };
    }
    const flotta = await readNextDocumentiCostiFleetSnapshot();
    const items = flotta.items.filter((item) => matches(item, categoria) && inPeriod(item, periodo));
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "costi/documenti");
    return {
      items: items.slice(0, requestedLimit).map(formatCostItem),
      totalItems: items.length,
      total: items.reduce((sum, item) => sum + (item.amount ?? 0), 0),
      ...truncation,
      appliedFilters: { targa: null, categoria: categoria || null, periodo },
      notices: truncationNotice(truncation),
    };
  },
};
