import { readNextFornitoriSnapshot } from "../../../domain/nextFornitoriDomain";
import { readNextProcurementSnapshot } from "../../../domain/nextProcurementDomain";
import { buildTruncationMeta, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { testo?: unknown; id?: unknown; conAcquisti?: unknown; limit?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase(); }
function limit(value: unknown): number { return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 200) : 50; }

export const toolListSuppliers: ChatIaToolHandler<Input> = {
  name: "list_suppliers",
  descriptionForOpenAi:
    "Elenca o cerca fornitori, con collegamento ai dati procurement quando richiesto. Usa quando l'utente chiede profilo, telefono o fornitore collegato ad acquisti.",
  parameters: {
    type: "object",
    properties: { testo: { type: "string" }, id: { type: "string" }, conAcquisti: { type: "boolean" }, limit: { type: "number" } },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const testo = norm(input.testo), id = norm(input.id);
    const snapshot = await readNextFornitoriSnapshot();
    const items = snapshot.items.filter((item) => (!id || norm(item.id).includes(id)) && (!testo || norm(JSON.stringify(item)).includes(testo)));
    const procurement = input.conAcquisti ? await readNextProcurementSnapshot({ includeCloneOverlays: false }) : null;
    const procurementRows = procurement ? [...procurement.orders, ...procurement.preventivi, ...procurement.listino] : [];
    const procurementMatches = procurementRows.filter((row) => items.some((item) => norm(JSON.stringify(row)).includes(norm(item.id)) || norm(JSON.stringify(row)).includes(norm(item.nome))));
    const requestedLimit = limit(input.limit);
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "fornitori");
    return {
      items: items.slice(0, requestedLimit).map((item) => ({ _id: item.id || item.nome, ...item })),
      total: items.length,
      ...truncation,
      procurementMatches,
      notices: truncationNotice(truncation),
    };
  },
};

export default toolListSuppliers;
