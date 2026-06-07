import { buildNextDossierPath } from "../../../nextStructuralPaths";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type OpenDossierPageInput = { targa?: unknown };

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

export const toolOpenDossierPage: ChatIaToolHandler<OpenDossierPageInput> = {
  name: "open_dossier_page",
  descriptionForOpenAi:
    "Propone o apre la pagina Dossier Mezzo per una targa. Usa quando l'utente chiede di aprire dossier o scheda mezzo.",
  parameters: {
    type: "object",
    properties: { targa: { type: "string" } },
    required: ["targa"],
    additionalProperties: false,
  },
  outputKindHint: "ui_action",
  async run(input) {
    const targa = normalizeTarga(input.targa);
    if (!targa) throw new Error("Targa obbligatoria per aprire il dossier mezzo.");
    return { route: buildNextDossierPath(targa), label: `Apri dossier ${targa}` };
  },
};
