import { readNextDocumentiCostiFleetSnapshot, readNextIADocumentiArchiveSnapshot } from "../../../domain/nextDocumentiCostiDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanNumericFilter, cleanPeriodFilter, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { numero?: unknown; fornitore?: unknown; targa?: unknown; tipo?: unknown; importo?: unknown; periodo?: { from?: unknown; to?: unknown }; limit?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase().replace(/\s+/g, " ").trim(); }
function compact(value: unknown): string { return norm(value).replace(/[^a-z0-9]/g, ""); }
function plate(value: unknown): string { return compact(value).toUpperCase(); }
function num(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}
function limit(value: unknown): number { return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 50) : 50; }
function rec(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }

function shortText(value: unknown, max = 90): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function documentDateValue(item: Record<string, unknown>): unknown {
  return item.dataDocumento ?? item.data ?? item.dateLabel ?? item.createdAt ?? item.updatedAt ?? item.timestamp ?? item.sortTimestamp;
}

function formatDocumentItem(item: unknown): Record<string, unknown> {
  const record = rec(item);
  const rawId = record.id ?? record.sourceDocId ?? record.sourceRecordId;
  const id = text(record.sourceKey && rawId ? `${record.sourceKey}:${rawId}` : rawId) || null;
  return {
    _id: id ?? "",
    id: text(record.id ?? record.sourceDocId ?? record.sourceRecordId) || null,
    targa: text(record.targa ?? record.mezzoTarga) || null,
    tipo: text(record.tipoDocumento ?? record.documentTypeLabel ?? record.category ?? record.categoria) || null,
    titolo: shortText(record.title ?? record.titolo ?? record.descrizione, 80),
    fornitore: shortText(record.supplier ?? record.fornitore ?? record.fornitoreLabel, 60),
    numero: text(record.numeroDocumento ?? record.numero ?? record.numeroFattura) || null,
    importo: num(record.importo ?? record.amount ?? record.totaleDocumento),
    valuta: text(record.currency ?? record.valuta) || null,
    descrizione_breve: shortText(record.descrizione ?? record.title ?? record.titolo),
    file_disponibile: Boolean(record.fileUrl),
    data_italiana: formatItalianDate(documentDateValue(record)),
  };
}

const MAINTENANCE_TYPE_ALIASES = [
  "manutenzione",
  "manutenzioni",
  "officina",
  "intervento",
  "interventi",
  "lavoro",
  "lavori",
  "riparazione",
  "riparazioni",
];

const INVOICE_TYPE_ALIASES = ["fattura", "fatture"];
const QUOTE_TYPE_ALIASES = ["preventivo", "preventivi"];
const DDT_TYPE_ALIASES = ["ddt", "documentoditrasporto"];

function hasAlias(value: unknown, aliases: string[]): boolean {
  const normalized = compact(value);
  return aliases.some((alias) => normalized.includes(compact(alias)));
}

function isMaintenanceType(tipo: string): boolean {
  const normalized = compact(tipo);
  return MAINTENANCE_TYPE_ALIASES.some((alias) => normalized.includes(compact(alias)));
}

function includesPlate(value: unknown, query: string): boolean {
  const normalizedValue = plate(value);
  return Boolean(normalizedValue && query && (normalizedValue.includes(query) || query.includes(normalizedValue)));
}

function matchesPlateInRecord(item: unknown, query: string): boolean {
  if (!query) return true;
  const r = rec(item);
  return includesPlate(`${r.targa ?? ""} ${r.mezzoTarga ?? ""} ${JSON.stringify(item)}`, query);
}

function stableDocumentKey(item: unknown): string {
  const r = rec(item);
  const rawId = text(r.sourceKey && (r.id ?? r.sourceDocId ?? r.sourceRecordId)
    ? `${r.sourceKey}:${r.id ?? r.sourceDocId ?? r.sourceRecordId}`
    : r.id ?? r.sourceDocId ?? r.sourceRecordId);
  if (rawId) return rawId;
  return compact(`${r.numeroDocumento ?? r.numero ?? r.numeroFattura ?? ""}-${r.targa ?? r.mezzoTarga ?? ""}-${documentDateValue(r) ?? ""}-${r.importo ?? r.amount ?? r.totaleDocumento ?? ""}`);
}

function dedupeDocuments(items: unknown[]): unknown[] {
  const seen = new Set<string>();
  const rows: unknown[] = [];
  for (const item of items) {
    const key = stableDocumentKey(item);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    rows.push(item);
  }
  return rows;
}

function matchesTypeFilter(item: unknown, tipo: unknown): boolean {
  const normalizedFilter = compact(tipo);
  if (!normalizedFilter) return true;

  const haystack = compact(JSON.stringify(item));
  const wantsMaintenance = hasAlias(tipo, MAINTENANCE_TYPE_ALIASES);
  const wantsInvoice = hasAlias(tipo, INVOICE_TYPE_ALIASES);
  const wantsQuote = hasAlias(tipo, QUOTE_TYPE_ALIASES);
  const wantsDdt = hasAlias(tipo, DDT_TYPE_ALIASES);
  const hasSemanticFilter = wantsMaintenance || wantsInvoice || wantsQuote || wantsDdt;

  // I documenti officina possono arrivare come fattura_ddt_manutenzione,
  // contesto manutenzione o testo "officina": il match esatto sul tipo perdeva record reali.
  if (hasSemanticFilter) {
    return (
      (!wantsMaintenance || isMaintenanceType(haystack)) &&
      (!wantsInvoice || hasAlias(haystack, INVOICE_TYPE_ALIASES)) &&
      (!wantsQuote || hasAlias(haystack, QUOTE_TYPE_ALIASES)) &&
      (!wantsDdt || hasAlias(haystack, DDT_TYPE_ALIASES))
    );
  }

  return haystack.includes(normalizedFilter);
}

export const toolSearchDocumentsAndInvoices: ChatIaToolHandler<Input> = {
  name: "search_documents_and_invoices",
  descriptionForOpenAi:
    "Cerca documenti, fatture, fatture manutenzione, fatture officina, lavori fatti, interventi tecnici e costi per numero, fornitore, targa, importo, tipo o periodo. Usa quando l'utente identifica una fattura senza conoscere il mezzo o l'id, oppure chiede fatture manutenzioni/officina per una targa.",
  parameters: {
    type: "object",
    properties: {
      numero: { type: "string" }, fornitore: { type: "string" }, targa: { type: "string" }, tipo: { type: "string" }, importo: { type: "number" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const [archive, fleet] = await Promise.all([readNextIADocumentiArchiveSnapshot(), readNextDocumentiCostiFleetSnapshot()]);
    const periodFilter = cleanPeriodFilter(input.periodo);
    const numero = compact(cleanTextFilter(input.numero)), fornitore = compact(cleanTextFilter(input.fornitore)), targa = plate(cleanTextFilter(input.targa));
    const tipo = cleanTextFilter(input.tipo);
    const importo = cleanNumericFilter(input.importo), from = ts(periodFilter?.from), to = ts(periodFilter?.to, true);
    const requestedLimit = limit(input.limit);
    const rows = dedupeDocuments([...archive.items, ...fleet.items]).filter((item) => {
      const r = rec(item), haystack = compact(JSON.stringify(item)), amount = num(r.importo ?? r.amount ?? r.totaleDocumento);
      const time = ts(documentDateValue(r));
      return (!numero || haystack.includes(numero)) && (!fornitore || haystack.includes(fornitore)) && matchesPlateInRecord(item, targa) &&
        matchesTypeFilter(item, tipo) && (importo === null || amount === importo) &&
        (from === null || (time !== null && time >= from)) && (to === null || (time !== null && time <= to));
    });
    const limitationsCount = archive.limitations.length + fleet.limitations.length;
    const shown = Math.min(rows.length, requestedLimit);
    const truncation = buildTruncationMeta(rows.length, shown, "documenti/fatture");
    return {
      items: rows.slice(0, requestedLimit).map(formatDocumentItem),
      total: rows.length,
      ...truncation,
      appliedFilters: { numero: numero || null, fornitore: fornitore || null, targa: targa || null, tipo, importo, periodo: periodFilter },
      notices: [
        ...truncationNotice(truncation),
        ...(limitationsCount > 0 ? ["Alcuni dati documentali possono essere parziali o da verificare."] : []),
      ],
    };
  },
};

export default toolSearchDocumentsAndInvoices;
