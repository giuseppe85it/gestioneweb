import { readNextMezzoDocumentiCostiPeriodView } from "../../../domain/nextDocumentiCostiDomain";
import { readNextProcurementSnapshot } from "../../../domain/nextProcurementDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { targa?: unknown; periodo?: { from?: unknown; to?: unknown }; includeProcurement?: unknown; groupBy?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function plate(value: unknown): string { return text(value).toUpperCase().replace(/\s+/g, ""); }
function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}
function groupKey(item: { categoria?: string; category?: string; supplier?: string | null; dateLabel?: string | null }, groupBy: string): string {
  if (groupBy === "fornitore") return item.supplier || "fornitore non valorizzato";
  if (groupBy === "mese") return item.dateLabel?.slice(0, 7) || "data non valorizzata";
  if (groupBy === "categoria") return item.categoria || item.category || "categoria non valorizzata";
  return "totale";
}

export const toolGetVehicleCostSummary: ChatIaToolHandler<Input> = {
  name: "get_vehicle_cost_summary",
  descriptionForOpenAi:
    "Calcola un riepilogo costi robusto per mezzo e periodo, con subtotali e fonti. Usa quando l'utente chiede costi totali annuali o per categoria di una targa.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      includeProcurement: { type: "boolean" },
      groupBy: { type: "string", enum: ["categoria", "mese", "fornitore", "nessuno"] },
    },
    required: ["targa"],
    additionalProperties: false,
  },
  outputKindHint: "card",
  async run(input) {
    const targa = plate(input.targa);
    if (!targa) throw new Error("Targa mezzo mancante o non valida.");
    const period = { label: "periodo richiesto", appliesFilter: Boolean(input.periodo?.from || input.periodo?.to), fromTimestamp: ts(input.periodo?.from), toTimestamp: ts(input.periodo?.to, true) };
    const view = await readNextMezzoDocumentiCostiPeriodView(targa, period);
    const groupBy = text(input.groupBy) || "categoria";
    const map = new Map<string, { key: string; totale: number; count: number }>();
    view.items.forEach((item) => {
      const key = groupKey(item, groupBy);
      const current = map.get(key) ?? { key, totale: 0, count: 0 };
      current.totale += item.amount ?? 0; current.count += 1; map.set(key, current);
    });
    const procurement = input.includeProcurement ? await readNextProcurementSnapshot({ includeCloneOverlays: false }) : null;
    const procurementRows = procurement?.orders.flatMap((o) => o.materials).filter((m) => m.destination?.targa === targa) ?? [];
    const totale = view.items.reduce((sum, item) => sum + (item.amount ?? 0), 0) + procurementRows.reduce((sum, item) => sum + (item.lineTotal ?? 0), 0);
    return {
      targa,
      periodo: input.periodo,
      periodo_italiano: {
        from: formatItalianDate(input.periodo?.from),
        to: formatItalianDate(input.periodo?.to),
      },
      totale,
      subtotali: Array.from(map.values()),
      procurementRows,
      sources: ["readNextMezzoDocumentiCostiPeriodView", "readNextProcurementSnapshot"],
      warnings: view.limitations,
    };
  },
};

export default toolGetVehicleCostSummary;
