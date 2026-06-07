import { readNextMaterialiMovimentiSnapshot } from "../../../domain/nextMaterialiMovimentiDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { targa?: unknown; destinatario?: unknown; materiale?: unknown; periodo?: { from?: unknown; to?: unknown }; limit?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function norm(value: unknown): string {
  return text(value).toLowerCase();
}

function targa(value: unknown): string {
  return text(value).toUpperCase().replace(/\s+/g, "");
}

function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function lim(value: unknown): number {
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

export const toolGetMaterialMovements: ChatIaToolHandler<Input> = {
  name: "get_material_movements",
  descriptionForOpenAi:
    "Recupera movimenti e consegne materiali per targa, destinatario, materiale o periodo. Usa quando l'utente chiede dove e stato consegnato un materiale o quali materiali ha ricevuto un mezzo.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      destinatario: { type: "string" },
      materiale: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const periodFilter = cleanPeriodFilter(input.periodo);
    const requestedTarga = targa(cleanTextFilter(input.targa));
    const destinatario = norm(cleanTextFilter(input.destinatario));
    const materiale = norm(cleanTextFilter(input.materiale));
    const from = ts(periodFilter?.from);
    const to = ts(periodFilter?.to, true);
    const requestedLimit = lim(input.limit);
    const snapshot = await readNextMaterialiMovimentiSnapshot();
    const items = snapshot.items.filter((item) => {
      const itemTarga = targa(`${item.targa ?? ""} ${item.mezzoTarga ?? ""}`);
      const time = ts(item.data ?? item.timestamp);
      return (!requestedTarga || itemTarga.includes(requestedTarga)) &&
        (!destinatario || norm(`${item.destinatario.label} ${item.target}`).includes(destinatario)) &&
        (!materiale || norm(`${item.materiale} ${item.descrizione}`).includes(materiale)) &&
        (from === null || (time !== null && time >= from)) &&
        (to === null || (time !== null && time <= to));
    });
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "movimenti materiali");
    return {
      items: items.slice(0, requestedLimit).map(formatMovementItem),
      total: items.length,
      ...truncation,
      appliedFilters: { targa: requestedTarga, destinatario, materiale, periodo: periodFilter },
      notices: truncationNotice(truncation),
    };
  },
};

export default toolGetMaterialMovements;
