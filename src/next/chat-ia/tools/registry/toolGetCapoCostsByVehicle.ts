import { readNextCapoCostiMezzoSnapshot } from "../../../domain/nextCapoDomain";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type GetCapoCostsByVehicleInput = { targa?: unknown };

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

export const toolGetCapoCostsByVehicle: ChatIaToolHandler<GetCapoCostsByVehicleInput> = {
  name: "get_capo_costs_by_vehicle",
  descriptionForOpenAi:
    "Recupera riepiloghi costi mezzo usati dal dominio capo. Usa quando l'utente chiede una sintesi costi per mezzo.",
  parameters: {
    type: "object",
    properties: { targa: { type: "string" } },
    additionalProperties: false,
  },
  outputKindHint: "card",
  async run(input) {
    const targa = normalizeTarga(input.targa);
    if (!targa) throw new Error("Targa mezzo obbligatoria per il riepilogo costi capo.");
    return readNextCapoCostiMezzoSnapshot(targa);
  },
};
