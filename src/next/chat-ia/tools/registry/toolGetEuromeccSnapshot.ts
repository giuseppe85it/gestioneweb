import { readEuromeccSnapshot } from "../../../domain/nextEuromeccDomain";
import { formatItalianDate } from "../chatIaToolDates";
import { buildTruncationMeta, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { area?: unknown; state?: unknown; priority?: unknown; limit?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase(); }
function limit(value: unknown): number { return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 200) : 80; }
function rec(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function formatEuromeccItem(value: unknown): Record<string, unknown> {
  const item = rec(value);
  const id = text(item.id ?? item.key ?? item.areaKey) || "";
  return {
    _id: id,
    ...item,
    data_italiana: formatItalianDate(item.updatedAt ?? item.createdAt ?? item.data ?? item.timestamp),
  };
}

export const toolGetEuromeccSnapshot: ChatIaToolHandler<Input> = {
  name: "get_euromecc_snapshot",
  descriptionForOpenAi:
    "Recupera task, completati e problemi Euromecc. Usa quando l'utente chiede attivita aperte, issue o storico Euromecc.",
  parameters: {
    type: "object",
    properties: {
      area: { type: "string" },
      state: { type: "string", enum: ["pending", "done", "issue", "all"] },
      priority: { type: "string" },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const snapshot = await readEuromeccSnapshot();
    const state = norm(input.state) || "all", area = norm(input.area), priority = norm(input.priority);
    const rows = [
      ...snapshot.pending.map((item) => ({ ...item, state: "pending" })),
      ...snapshot.done.map((item) => ({ ...item, state: "done" })),
      ...snapshot.issues.map((item) => ({ ...item, state: "issue" })),
    ];
    const items = rows.filter((item) => (state === "all" || item.state === state) &&
      (!area || norm(`${item.areaKey} ${item.areaLabel}`).includes(area)) &&
      (!priority || norm(JSON.stringify(item)).includes(priority)));
    const requestedLimit = limit(input.limit);
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "attivita Euromecc");
    return {
      snapshot: { loadedAt: snapshot.loadedAt, loadedAt_italiana: formatItalianDate(snapshot.loadedAt), areaMeta: snapshot.areaMeta },
      items: items.slice(0, requestedLimit).map(formatEuromeccItem),
      total: items.length,
      ...truncation,
      limitations: [],
      notices: truncationNotice(truncation),
    };
  },
};

export default toolGetEuromeccSnapshot;
