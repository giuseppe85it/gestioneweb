import { readNextDocumentiCostiFleetSnapshot, readNextIADocumentiArchiveSnapshot } from "../../../domain/nextDocumentiCostiDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanNumericFilter, cleanPeriodFilter, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { id?: unknown; numero?: unknown; targa?: unknown; importo?: unknown; periodo?: { from?: unknown; to?: unknown } };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase(); }
function plate(value: unknown): string { return text(value).toUpperCase().replace(/\s+/g, ""); }
function num(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}
function rec(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }

function shortText(value: unknown, max = 90): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function documentDateValue(item: Record<string, unknown>): unknown {
  return item.dataDocumento ?? item.data ?? item.dateLabel ?? item.createdAt ?? item.updatedAt ?? item.timestamp ?? item.sortTimestamp;
}

function formatInvoiceItem(item: unknown): Record<string, unknown> {
  const r = rec(item);
  const rawId = r.id ?? r.sourceDocId ?? r.sourceRecordId;
  const id = text(r.sourceKey && rawId ? `${r.sourceKey}:${rawId}` : rawId) || null;
  return {
    _id: id ?? "",
    id: text(r.id ?? r.sourceDocId ?? r.sourceRecordId) || null,
    targa: text(r.targa ?? r.mezzoTarga) || null,
    numero: text(r.numeroDocumento ?? r.numero ?? r.numeroFattura) || null,
    tipo: text(r.tipoDocumento ?? r.documentTypeLabel ?? r.category ?? r.categoria) || null,
    titolo: shortText(r.title ?? r.titolo ?? r.descrizione, 80),
    importo: num(r.importo ?? r.amount ?? r.totaleDocumento),
    valuta: text(r.currency ?? r.valuta) || null,
    data_italiana: formatItalianDate(documentDateValue(r)),
  };
}

export const toolFindInvoiceSupplier: ChatIaToolHandler<Input> = {
  name: "find_invoice_supplier",
  descriptionForOpenAi:
    "Trova il fornitore di una fattura partendo da id, numero documento, targa, importo o periodo. Usa quando l'utente chiede a chi appartiene una fattura specifica.",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string" }, numero: { type: "string" }, targa: { type: "string" }, importo: { type: "number" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const [archive, fleet] = await Promise.all([readNextIADocumentiArchiveSnapshot(), readNextDocumentiCostiFleetSnapshot()]);
    const periodFilter = cleanPeriodFilter(input.periodo);
    const id = norm(cleanTextFilter(input.id)), numero = norm(cleanTextFilter(input.numero)), targa = plate(cleanTextFilter(input.targa)), importo = cleanNumericFilter(input.importo), from = ts(periodFilter?.from), to = ts(periodFilter?.to, true);
    const rows = [...archive.items, ...fleet.items].filter((item) => {
      const r = rec(item), haystack = norm(JSON.stringify(item)), itemId = norm(r.id ?? r.sourceDocId), itemTarga = plate(r.targa ?? r.mezzoTarga);
      const amount = num(r.importo ?? r.amount ?? r.totaleDocumento), time = ts(documentDateValue(r));
      return (!id || itemId.includes(id)) && (!numero || haystack.includes(numero)) && (!targa || itemTarga.includes(targa)) &&
        (importo === null || amount === importo) && (from === null || (time !== null && time >= from)) && (to === null || (time !== null && time <= to));
    });
    const matches = rows.slice(0, 50).map((invoice) => {
      const r = rec(invoice);
      return { supplier: text(r.supplier ?? r.fornitore) || null, invoice: formatInvoiceItem(invoice), confidence: id ? "id" : rows.length > 1 ? "ambiguous" : numero ? "exact" : "partial" };
    });
    const truncation = buildTruncationMeta(rows.length, matches.length, "fatture");
    return {
      matches,
      total: rows.length,
      ...truncation,
      appliedFilters: { id: id || null, numero: numero || null, targa: targa || null, importo, periodo: periodFilter },
      warnings: [...archive.limitations, ...fleet.limitations].slice(0, 5),
      notices: truncationNotice(truncation),
    };
  },
};

export default toolFindInvoiceSupplier;
