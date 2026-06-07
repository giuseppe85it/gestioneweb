import { readNextColleghiSnapshot } from "../../../domain/nextColleghiDomain";
import { buildTruncationMeta, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type ListDriversInput = { testo?: unknown; attivo?: unknown; limit?: unknown };

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function matches(item: unknown, query: string): boolean {
  return !query || JSON.stringify(item).toLowerCase().includes(query);
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 10) : 10;
}

function splitName(value: string): { nome: string; cognome: string | null } {
  const parts = value.trim().split(/\s+/g).filter(Boolean);
  if (parts.length <= 1) return { nome: value, cognome: null };
  return { nome: parts[0], cognome: parts.slice(1).join(" ") };
}

export const toolListDrivers: ChatIaToolHandler<ListDriversInput> = {
  name: "list_drivers",
  descriptionForOpenAi:
    "Elenca colleghi e autisti noti al sistema, con filtro testuale opzionale. Usa quando l'utente chiede lista autisti, colleghi o cerca nominativi.",
  parameters: {
    type: "object",
    properties: { testo: { type: "string" }, attivo: { type: "boolean" }, limit: { type: "number" } },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const snapshot = await readNextColleghiSnapshot();
    const query = normalize(cleanTextFilter(input.testo));
    const requestedLimit = limit(input.limit);
    const items = snapshot.items.filter((item) => matches(item, query));
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "autisti");
    return {
      items: items.slice(0, requestedLimit).map((item) => ({
        _id: item.id || item.badge || item.nome,
        id: item.id || null,
        badge: item.badge,
        ...splitName(item.nome),
        mezzo_assegnato_targa: null,
      })),
      total: items.length,
      ...truncation,
      notices: truncationNotice(truncation),
      ignoredFilters: input.attivo === undefined ? [] : ["attivo non presente nello shape colleghi"],
    };
  },
};
