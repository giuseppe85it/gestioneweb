import { readNextDocumentiCostiFleetSnapshot } from "../../../domain/nextDocumentiCostiDomain";
import { parseChatIaToolDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type GetCostAggregatesInput = { categoria?: unknown; groupBy?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function monthKey(item: Record<string, unknown>): string {
  const parsed = parseChatIaToolDate(item.dataDocumento ?? item.data ?? item.dateLabel ?? item.createdAt ?? item.updatedAt ?? item.timestamp ?? item.sortTimestamp);
  if (!parsed) return "senza-data";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
}

function keyFor(item: Record<string, unknown>, groupBy: string): string {
  if (groupBy === "mezzo") return text(item.mezzoTarga) || text(item.targa) || "senza-mezzo";
  if (groupBy === "mese") return monthKey(item);
  return text(item.categoria ?? item.category) || "senza-categoria";
}

export const toolGetCostAggregates: ChatIaToolHandler<GetCostAggregatesInput> = {
  name: "get_cost_aggregates",
  descriptionForOpenAi:
    "Aggrega costi per periodo, categoria, mezzo o flotta. Usa quando l'utente chiede totali, medie o raggruppamenti di costi.",
  parameters: {
    type: "object",
    properties: { categoria: { type: "string" }, groupBy: { type: "string", enum: ["mese", "mezzo", "categoria"] } },
    additionalProperties: false,
  },
  outputKindHint: "chart",
  async run(input) {
    const snapshot = await readNextDocumentiCostiFleetSnapshot();
    const categoria = text(input.categoria);
    const groupBy = text(input.groupBy) || "categoria";
    const items = snapshot.items.filter((item) => !categoria || JSON.stringify(item).toLowerCase().includes(categoria));
    const buckets = new Map<string, { _id: string; key: string; total: number; count: number }>();
    for (const item of items) {
      const key = keyFor(rec(item), groupBy);
      const bucket = buckets.get(key) ?? { _id: `${groupBy}:${key}`, key, total: 0, count: 0 };
      bucket.total += item.amount ?? 0;
      bucket.count += 1;
      buckets.set(key, bucket);
    }
    return { total: items.reduce((sum, item) => sum + (item.amount ?? 0), 0), count: items.length, buckets: Array.from(buckets.values()) };
  },
};
