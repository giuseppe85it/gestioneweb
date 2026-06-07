import { readNextAnagraficheFlottaSnapshot } from "../../../nextAnagraficheFlottaDomain";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { categoria?: unknown; includeQualityFlags?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function norm(value: unknown): string {
  return text(value).toLowerCase();
}

export const toolListVehiclesWithoutDriver: ChatIaToolHandler<Input> = {
  name: "list_vehicles_without_driver",
  descriptionForOpenAi:
    "Elenca i mezzi senza autista assegnato. Usa quando l'utente chiede mezzi liberi, mezzi senza autista o assegnazioni mancanti.",
  parameters: {
    type: "object",
    properties: {
      categoria: { type: "string" },
      includeQualityFlags: { type: "boolean" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const categoria = norm(input.categoria);
    const snapshot = await readNextAnagraficheFlottaSnapshot();
    const items = snapshot.items.filter((mezzo) => {
      const withoutDriver = !mezzo.autistaId && !mezzo.autistaNome;
      return withoutDriver && (!categoria || norm(mezzo.categoria).includes(categoria));
    });
    return {
      items: input.includeQualityFlags ? items : items.map((mezzo) => ({ ...mezzo, flags: [] })),
      total: items.length,
      appliedFilters: { categoria: text(input.categoria) || undefined },
    };
  },
};

export default toolListVehiclesWithoutDriver;
