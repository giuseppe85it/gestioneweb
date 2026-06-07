import { buildNextMagazzinoPath, type NextMagazzinoTab } from "../../../nextStructuralPaths";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type OpenMagazzinoSectionInput = { section?: unknown };

const ALLOWED_SECTIONS: NextMagazzinoTab[] = ["inventario", "materiali-consegnati", "cisterne-adblue", "documenti-costi"];

function section(value: unknown): NextMagazzinoTab {
  const raw = typeof value === "string" ? value.trim() : "";
  return ALLOWED_SECTIONS.includes(raw as NextMagazzinoTab) ? (raw as NextMagazzinoTab) : "inventario";
}

export const toolOpenMagazzinoSection: ChatIaToolHandler<OpenMagazzinoSectionInput> = {
  name: "open_magazzino_section",
  descriptionForOpenAi:
    "Apre Magazzino NEXT in una sezione supportata dal builder. Usa quando l'utente chiede inventario, materiali consegnati, AdBlue o documenti costi in Magazzino.",
  parameters: {
    type: "object",
    properties: { section: { type: "string", enum: ALLOWED_SECTIONS } },
    additionalProperties: false,
  },
  outputKindHint: "ui_action",
  async run(input) {
    const selected = section(input.section);
    return { route: buildNextMagazzinoPath(selected), label: `Apri Magazzino - ${selected}` };
  },
};
