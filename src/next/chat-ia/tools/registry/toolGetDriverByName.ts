import { readNextColleghiSnapshot } from "../../../domain/nextColleghiDomain";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type GetDriverByNameInput = { nome?: unknown };

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().replace(/\s+/g, " ") : "";
}

export const toolGetDriverByName: ChatIaToolHandler<GetDriverByNameInput> = {
  name: "get_driver_by_name",
  descriptionForOpenAi:
    "Trova un autista per nome o cognome e restituisce il record piu compatibile. Usa quando l'utente identifica un autista con nominativo parziale.",
  parameters: {
    type: "object",
    properties: { nome: { type: "string" } },
    required: ["nome"],
    additionalProperties: false,
  },
  outputKindHint: "card",
  async run(input) {
    const query = normalize(input.nome);
    if (!query) throw new Error("Nome autista mancante o non valido.");
    const snapshot = await readNextColleghiSnapshot();
    const exact = snapshot.items.filter((item) => normalize(item.nome) === query);
    const partial = snapshot.items.filter((item) => normalize(item.nome).includes(query));
    const matches = exact.length ? exact : partial;
    return { item: matches[0] ?? null, matches, confidence: exact.length ? "exact" : matches.length ? "partial" : "none" };
  },
};
