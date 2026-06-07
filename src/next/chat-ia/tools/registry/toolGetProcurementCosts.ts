import { readNextProcurementReadOnlySnapshot } from "../../../domain/nextDocumentiCostiDomain";
import { readNextProcurementSnapshot } from "../../../domain/nextProcurementDomain";
import { formatItalianDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type GetProcurementCostsInput = { stato?: unknown; fornitore?: unknown; testo?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function matches(item: unknown, query: string): boolean {
  return !query || JSON.stringify(item).toLowerCase().includes(query);
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function formatProcurementItem(value: unknown): Record<string, unknown> {
  const item = rec(value);
  const id = String(item.id ?? item.sourceDocId ?? item.numero ?? item.codice ?? "").trim();
  return {
    _id: id,
    ...item,
    data_italiana: formatItalianDate(item.dataOrdine ?? item.updatedAt ?? item.data ?? item.timestamp ?? item.orderTimestamp ?? item.updatedAtTimestamp),
  };
}

export const toolGetProcurementCosts: ChatIaToolHandler<GetProcurementCostsInput> = {
  name: "get_procurement_costs",
  descriptionForOpenAi:
    "Legge ordini, preventivi, approvazioni e listino procurement. Usa quando l'utente chiede costi acquisti, fornitori, ordini o preventivi.",
  parameters: {
    type: "object",
    properties: { stato: { type: "string" }, fornitore: { type: "string" }, testo: { type: "string" } },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const [procurement, readOnly] = await Promise.all([readNextProcurementSnapshot(), readNextProcurementReadOnlySnapshot()]);
    const query = [text(input.stato), text(input.fornitore), text(input.testo)].filter(Boolean).join(" ");
    const items = [...procurement.orders, ...procurement.preventivi, ...procurement.approvals, ...procurement.listino].filter((item) => matches(item, query));
    return { procurement, readOnly, items: items.map(formatProcurementItem), total: items.length };
  },
};
