import {
  NEXT_ACQUISTI_PATH,
  NEXT_AUTISTI_ADMIN_PATH,
  NEXT_AUTISTI_INBOX_PATH,
  NEXT_CENTRO_CONTROLLO_PATH,
  NEXT_CISTERNA_PATH,
  NEXT_GESTIONE_OPERATIVA_PATH,
  NEXT_HOME_PATH,
  NEXT_MAGAZZINO_PATH,
  NEXT_MANUTENZIONI_PATH,
  NEXT_MEZZI_PATH,
  NEXT_ORDINI_ARRIVATI_PATH,
  NEXT_ORDINI_IN_ATTESA_PATH,
} from "../../../nextStructuralPaths";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type NavigateToInput = { route?: unknown };

const ROUTE_ALIASES = new Map<string, string>([
  ["home", NEXT_HOME_PATH],
  ["mezzi", NEXT_MEZZI_PATH],
  ["flotta", NEXT_MEZZI_PATH],
  ["magazzino", NEXT_MAGAZZINO_PATH],
  ["cisterna", NEXT_CISTERNA_PATH],
  ["centro controllo", NEXT_CENTRO_CONTROLLO_PATH],
  ["gestione operativa", NEXT_GESTIONE_OPERATIVA_PATH],
  ["manutenzioni", NEXT_MANUTENZIONI_PATH],
  ["acquisti", NEXT_ACQUISTI_PATH],
  ["ordini in attesa", NEXT_ORDINI_IN_ATTESA_PATH],
  ["ordini arrivati", NEXT_ORDINI_ARRIVATI_PATH],
  ["autisti inbox", NEXT_AUTISTI_INBOX_PATH],
  ["autisti admin", NEXT_AUTISTI_ADMIN_PATH],
]);

const SAFE_ROUTES = new Set(ROUTE_ALIASES.values());

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const toolNavigateTo: ChatIaToolHandler<NavigateToInput> = {
  name: "navigate_to",
  descriptionForOpenAi:
    "Naviga verso una route NEXT nota e sicura. Usa quando l'utente chiede di andare a una sezione del gestionale.",
  parameters: {
    type: "object",
    properties: { route: { type: "string" } },
    required: ["route"],
    additionalProperties: false,
  },
  outputKindHint: "ui_action",
  async run(input) {
    const requested = text(input.route);
    const route = ROUTE_ALIASES.get(requested.toLowerCase()) ?? requested;
    if (!SAFE_ROUTES.has(route)) {
      throw new Error("Route NEXT non autorizzata per navigazione Chat IA.");
    }
    return { route, label: `Vai a ${requested}` };
  },
};
