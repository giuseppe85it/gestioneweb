import { buildNextMezzoMaterialiMovimentiSnapshot, readNextMaterialiMovimentiSnapshot } from "../../../domain/nextMaterialiMovimentiDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

// Correzione Giuseppe 2026-04-29: il C3 non espone piu materiali da ordinare
// per mezzo, ma materiali consegnati o utilizzati per un mezzo specifico.
type Input = { targa?: unknown; periodo?: { from?: unknown; to?: unknown }; limit?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function plate(value: unknown): string { return text(value).toUpperCase().replace(/\s+/g, ""); }
function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 50) : 50;
}

function shortText(value: unknown, max = 90): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function formatMovementItem<T extends {
  id?: string | null;
  timestamp?: number | null;
  data?: string | null;
  targa?: string | null;
  mezzoTarga?: string | null;
  destinatario?: { label?: string | null } | null;
  target?: string | null;
  materiale?: string | null;
  descrizione?: string | null;
  quantita?: number | null;
  unita?: string | null;
}>(item: T): Record<string, unknown> {
  const id = item.id ?? null;
  return {
    _id: id ?? "",
    id,
    targa: text(item.targa ?? item.mezzoTarga) || null,
    destinatario: shortText(item.destinatario?.label ?? item.target, 60),
    materiale: shortText(item.materiale ?? item.descrizione),
    descrizione_breve: shortText(item.descrizione),
    quantita: item.quantita ?? null,
    unita: item.unita ?? null,
    data_italiana: formatItalianDate(item.data ?? item.timestamp),
  };
}

export const toolGetVehicleMaterialMovements: ChatIaToolHandler<Input> = {
  name: "get_vehicle_material_movements",
  descriptionForOpenAi:
    "Restituisce i movimenti di materiali consegnati o utilizzati per un mezzo specifico, identificato per targa. Usa quando l'utente chiede materiali del mezzo X, cosa abbiamo usato per il mezzo X o consegne materiali a mezzo X.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      limit: { type: "number" },
    },
    required: ["targa"],
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const targa = plate(cleanTextFilter(input.targa));
    if (!targa) throw new Error("Targa mezzo mancante o non valida.");
    const periodFilter = cleanPeriodFilter(input.periodo);
    const requestedLimit = limit(input.limit);
    const baseSnapshot = await readNextMaterialiMovimentiSnapshot();
    const snapshot = buildNextMezzoMaterialiMovimentiSnapshot({ baseSnapshot, targa });
    const from = ts(periodFilter?.from), to = ts(periodFilter?.to, true);
    const items = snapshot.items.filter((item) => {
      const time = ts(item.data ?? item.timestamp);
      return (from === null || (time !== null && time >= from)) && (to === null || (time !== null && time <= to));
    });
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "movimenti materiali");
    return {
      targa,
      items: items.slice(0, requestedLimit).map(formatMovementItem),
      total: items.length,
      ...truncation,
      counts: { ...snapshot.counts, total: items.length },
      appliedFilters: { targa, periodo: periodFilter },
      notices: truncationNotice(truncation),
    };
  },
};

export default toolGetVehicleMaterialMovements;
