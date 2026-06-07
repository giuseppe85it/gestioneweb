import { readNextInventarioSnapshot } from "../../../domain/nextInventarioDomain";
import { buildTruncationMeta, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { testo?: unknown; fornitore?: unknown; stockStatus?: unknown; limit?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function norm(value: unknown): string {
  return text(value).toLowerCase();
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 50) : 50;
}

function shortText(value: unknown, max = 90): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

export const toolListInventory: ChatIaToolHandler<Input> = {
  name: "list_inventory",
  descriptionForOpenAi:
    "Interroga l'inventario magazzino per testo, fornitore o stato stock. Usa quando l'utente chiede disponibilita, quantita o materiale presente in magazzino.",
  parameters: {
    type: "object",
    properties: {
      testo: { type: "string" },
      fornitore: { type: "string" },
      stockStatus: { type: "string", enum: ["ok", "basso", "zero", "tutti"] },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const testo = norm(cleanTextFilter(input.testo));
    const fornitore = norm(cleanTextFilter(input.fornitore));
    const stockStatus = norm(cleanTextFilter(input.stockStatus)) || "tutti";
    const requestedLimit = limit(input.limit);
    const snapshot = await readNextInventarioSnapshot();
    const filtered = snapshot.items.filter((item) => {
      const textMatch = !testo || norm(`${item.descrizione} ${item.unita} ${item.id}`).includes(testo);
      const supplierMatch = !fornitore || norm(item.fornitore).includes(fornitore);
      const stockMatch =
        stockStatus === "tutti" ||
        (stockStatus === "ok" && item.stockStatus === "disponibile") ||
        (stockStatus === "basso" && item.stockStatus === "critico") ||
        (stockStatus === "zero" && item.quantita === 0);
      return textMatch && supplierMatch && stockMatch;
    });
    const shown = Math.min(filtered.length, requestedLimit);
    const truncation = buildTruncationMeta(filtered.length, shown, "materiali inventario");
    return {
      items: filtered.slice(0, requestedLimit).map((item) => ({
        _id: item.id,
        id: item.id,
        descrizione_breve: shortText(item.descrizione),
        fornitore: shortText(item.fornitore, 60),
        quantita: item.quantita,
        unita: item.unita,
        stockStatus: item.stockStatus,
      })),
      total: filtered.length,
      ...truncation,
      appliedFilters: { testo, fornitore, stockStatus },
      notices: truncationNotice(truncation),
    };
  },
};

export default toolListInventory;
