import { readNextColleghiSnapshot } from "../../../domain/nextColleghiDomain";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type GetDriverByBadgeInput = { badge?: unknown };

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, "").toLowerCase() : "";
}

export const toolGetDriverByBadge: ChatIaToolHandler<GetDriverByBadgeInput> = {
  name: "get_driver_by_badge",
  descriptionForOpenAi:
    "Trova un autista per badge o identificativo equivalente, se il campo e presente nei dati. Usa quando l'utente fornisce un badge o codice autista.",
  parameters: {
    type: "object",
    properties: { badge: { type: "string" } },
    required: ["badge"],
    additionalProperties: false,
  },
  outputKindHint: "card",
  async run(input) {
    const searchedBadge = normalize(input.badge);
    if (!searchedBadge) throw new Error("Badge autista mancante o non valido.");
    const snapshot = await readNextColleghiSnapshot();
    const item =
      snapshot.items.find((driver) => normalize(driver.badge) === searchedBadge) ??
      snapshot.items.find((driver) => normalize(driver.codice) === searchedBadge) ??
      null;
    return { item, searchedBadge, note: item ? undefined : "Nessun autista trovato per badge/codice." };
  },
};
