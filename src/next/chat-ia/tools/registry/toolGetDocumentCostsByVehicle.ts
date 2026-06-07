import {
  readNextDocumentiCostiFleetSnapshot,
  readNextIADocumentiArchiveSnapshot,
  readNextMezzoDocumentiCostiSnapshot,
} from "../../../domain/nextDocumentiCostiDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type GetDocumentCostsByVehicleInput = { targa?: unknown; periodo?: PeriodInput; tipo?: unknown; limit?: unknown };

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

function toTimestamp(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function compact(value: unknown): string {
  return text(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 50) : 50;
}

function shortText(value: unknown, max = 90): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function documentDateValue(item: Record<string, unknown>): unknown {
  return item.dataDocumento ?? item.data ?? item.dateLabel ?? item.createdAt ?? item.updatedAt ?? item.timestamp ?? item.sortTimestamp;
}

function formatDocumentCostItem(item: Record<string, unknown>): Record<string, unknown> {
  const amount = item.importo ?? item.amount;
  const rawId = item.id ?? item.sourceDocId ?? item.sourceRecordId;
  const id = text(item.sourceKey && rawId ? `${item.sourceKey}:${rawId}` : rawId) || null;
  return {
    _id: id ?? "",
    id: text(item.id ?? item.sourceDocId ?? item.sourceRecordId) || null,
    targa: text(item.targa ?? item.mezzoTarga) || null,
    tipo: text(item.tipoDocumento ?? item.documentTypeLabel ?? item.category ?? item.categoria) || null,
    titolo: shortText(item.title ?? item.titolo ?? item.descrizione, 80),
    fornitore: shortText(item.supplier ?? item.fornitore ?? item.fornitoreLabel, 60),
    numero: text(item.numeroDocumento ?? item.numero ?? item.numeroFattura) || null,
    importo: typeof amount === "number" ? amount : null,
    valuta: text(item.currency ?? item.valuta) || null,
    descrizione_breve: shortText(item.descrizione ?? item.title ?? item.titolo),
    file_disponibile: Boolean(item.fileUrl),
    data_italiana: formatItalianDate(documentDateValue(item)),
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

function matchesTypeFilter(item: unknown, tipo: unknown): boolean {
  const normalizedFilter = compact(tipo);
  if (!normalizedFilter) return true;

  const haystack = compact(JSON.stringify(item));
  const wantsMaintenance = hasAlias(tipo, MAINTENANCE_TYPE_ALIASES);
  const wantsInvoice = hasAlias(tipo, INVOICE_TYPE_ALIASES);
  const wantsQuote = hasAlias(tipo, QUOTE_TYPE_ALIASES);
  const wantsDdt = hasAlias(tipo, DDT_TYPE_ALIASES);
  const hasSemanticFilter = wantsMaintenance || wantsInvoice || wantsQuote || wantsDdt;

  // Le fatture officina reali possono avere tipo "fattura" e contesto
  // "manutenzione": il filtro letterale su "manutenzioni" le escludeva.
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

function matchesPlateInRecord(item: unknown, targa: string): boolean {
  if (!targa) return true;
  return normalizeTarga(JSON.stringify(item)).includes(targa);
}

function stableDocumentKey(item: unknown): string {
  const record = rec(item);
  const rawId = text(record.sourceKey && (record.id ?? record.sourceDocId ?? record.sourceRecordId)
    ? `${record.sourceKey}:${record.id ?? record.sourceDocId ?? record.sourceRecordId}`
    : record.id ?? record.sourceDocId ?? record.sourceRecordId);
  if (rawId) return rawId;
  return compact(`${record.numeroDocumento ?? record.numero ?? record.numeroFattura ?? ""}-${record.targa ?? record.mezzoTarga ?? ""}-${documentDateValue(record) ?? ""}-${record.importo ?? record.amount ?? record.totaleDocumento ?? ""}`);
}

function dedupeDocuments(items: unknown[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  for (const item of items) {
    const key = stableDocumentKey(item);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    rows.push(rec(item));
  }
  return rows;
}

export const toolGetDocumentCostsByVehicle: ChatIaToolHandler<GetDocumentCostsByVehicleInput> = {
  name: "get_document_costs_by_vehicle",
  descriptionForOpenAi:
    "Recupera documenti e costi collegati a un mezzo, incluse fatture manutenzione, fatture officina, lavori fatti e interventi tecnici collegati a una targa. Usa quando l'utente chiede fatture, costi documentali, costi storici, documenti di manutenzione o lavori officina di una targa.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      tipo: { type: "string" },
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
    const [snapshot, archive, fleet] = await Promise.all([
      readNextMezzoDocumentiCostiSnapshot(targa),
      readNextIADocumentiArchiveSnapshot(),
      readNextDocumentiCostiFleetSnapshot(),
    ]);
    const periodFilter = cleanPeriodFilter(input.periodo);
    const tipo = cleanTextFilter(input.tipo);
    const requestedLimit = limit(input.limit);
    const fromTimestamp = toTimestamp(periodFilter?.from);
    const untilTimestamp = toTimestamp(periodFilter?.to, true);
    const allItems = dedupeDocuments([
      ...snapshot.items,
      ...archive.items.filter((item) => matchesPlateInRecord(item, targa)),
      ...fleet.items.filter((item) => matchesPlateInRecord(item, targa)),
    ]);
    const baseFilteredItems = allItems.filter((item) => matchesTypeFilter(item, tipo));
    const periodFilteredItems = periodFilter
      ? baseFilteredItems.filter((item) => {
          const current = toTimestamp(documentDateValue(item));
          return (fromTimestamp === null || (current !== null && current >= fromTimestamp)) &&
            (untilTimestamp === null || (current !== null && current <= untilTimestamp));
        })
      : null;
    const limitationsCount = snapshot.limitations.length + archive.limitations.length + fleet.limitations.length;
    const baseShown = Math.min(baseFilteredItems.length, requestedLimit);
    const periodShown = periodFilteredItems ? Math.min(periodFilteredItems.length, requestedLimit) : null;
    const baseTruncation = buildTruncationMeta(baseFilteredItems.length, baseShown, "documenti/fatture");
    const periodTruncation = periodFilteredItems
      ? buildTruncationMeta(periodFilteredItems.length, periodShown ?? 0, "documenti/fatture del periodo")
      : null;
    const primaryTruncation = periodTruncation ?? baseTruncation;
    return {
      targa,
      counts: snapshot.counts,
      totals: snapshot.totals,
      filteredItems: baseFilteredItems.slice(0, requestedLimit).map((item) => formatDocumentCostItem(rec(item))),
      filteredItemsTotal: baseFilteredItems.length,
      filteredItemsMeta: baseTruncation,
      filteredPeriodItems: periodFilteredItems?.slice(0, requestedLimit).map((item) => formatDocumentCostItem(item)) ?? null,
      filteredPeriodItemsTotal: periodFilteredItems?.length ?? null,
      filteredPeriodItemsMeta: periodTruncation,
      ...primaryTruncation,
      period: periodFilter,
      appliedFilters: { targa, tipo, periodo: periodFilter },
      notices: [
        ...Array.from(new Set([
          ...truncationNotice(baseTruncation),
          ...(periodTruncation ? truncationNotice(periodTruncation) : []),
        ])),
        ...(limitationsCount > 0 ? ["Alcuni dati documentali possono essere parziali o da verificare."] : []),
      ],
    };
  },
};
