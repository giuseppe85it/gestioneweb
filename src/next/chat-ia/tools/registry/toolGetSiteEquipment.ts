import { readNextAttrezzatureCantieriSnapshot } from "../../../domain/nextAttrezzatureCantieriDomain";
import { formatItalianDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { cantiere?: unknown; tipo?: unknown; categoria?: unknown; soloAttuali?: unknown };

const tipoMap: Record<string, "CONSEGNATO" | "SPOSTATO" | "RITIRATO"> = {
  consegna: "CONSEGNATO",
  spostamento: "SPOSTATO",
  ritiro: "RITIRATO",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function norm(value: unknown): string {
  return text(value).toLowerCase();
}

function formatEquipmentMovement<T extends { timestamp?: number | null; data?: string | null }>(item: T): T & { data_italiana: string } {
  return {
    ...item,
    data_italiana: formatItalianDate(item.data ?? item.timestamp),
  };
}

export const toolGetSiteEquipment: ChatIaToolHandler<Input> = {
  name: "get_site_equipment",
  descriptionForOpenAi:
    "Recupera attrezzature e movimenti assegnati a un cantiere. Usa quando l'utente chiede cosa c'e in un cantiere, cosa e stato consegnato, spostato o ritirato.",
  parameters: {
    type: "object",
    properties: {
      cantiere: { type: "string" },
      tipo: { type: "string", enum: ["consegna", "spostamento", "ritiro", "tutti"] },
      categoria: { type: "string" },
      soloAttuali: { type: "boolean" },
    },
    required: ["cantiere"],
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const cantiere = norm(input.cantiere);
    if (!cantiere) throw new Error("Cantiere mancante o non valido.");
    const categoria = norm(input.categoria);
    const tipo = tipoMap[norm(input.tipo)] ?? null;
    const snapshot = await readNextAttrezzatureCantieriSnapshot();
    const statoAttuale = snapshot.statoAttuale.filter((item) => norm(`${item.id} ${item.label}`).includes(cantiere));
    const movimenti = snapshot.items.filter((item) => {
      const cantiereMatch = norm(`${item.cantiereId} ${item.cantiereLabel} ${item.sourceCantiereLabel}`).includes(cantiere);
      const tipoMatch = !tipo || item.tipo === tipo;
      const categoriaMatch = !categoria || norm(`${item.materialeCategoria} ${item.descrizione}`).includes(categoria);
      return cantiereMatch && tipoMatch && categoriaMatch;
    });
    return {
      cantiere: text(input.cantiere),
      statoAttuale,
      movimenti: input.soloAttuali ? [] : movimenti.map(formatEquipmentMovement),
      total: input.soloAttuali ? statoAttuale.length : movimenti.length,
      limitations: snapshot.limitations,
    };
  },
};

export default toolGetSiteEquipment;
