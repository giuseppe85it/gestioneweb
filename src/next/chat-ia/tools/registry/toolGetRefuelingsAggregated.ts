import { readNextCisternaSnapshot } from "../../../domain/nextCisternaDomain";
import { readNextRifornimentiReadOnlySnapshot } from "../../../domain/nextRifornimentiDomain";
import { parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, truncationNotice, type CleanPeriodFilter } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type GetRefuelingsAggregatedInput = { periodo?: PeriodInput; fonte?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function dateMs(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function inPeriod(value: unknown, period?: CleanPeriodFilter | null): boolean {
  const from = dateMs(period?.from);
  const to = dateMs(period?.to, true);
  const timestamp = dateMs(value);
  return (from === null || (timestamp !== null && timestamp >= from)) && (to === null || (timestamp !== null && timestamp <= to));
}

function monthKey(value: unknown): string {
  const date = parseChatIaToolDate(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : "senza-data";
}

function plate(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

export const toolGetRefuelingsAggregated: ChatIaToolHandler<GetRefuelingsAggregatedInput> = {
  name: "get_refuelings_aggregated",
  descriptionForOpenAi:
    "Calcola litri, importi e conteggi dei rifornimenti per periodo e fonte. Usa quando l'utente chiede totale rifornimenti, medie mensili o riepiloghi flotta. Se l'utente chiede chi ha fatto piu rifornimenti, usa rankingConteggioRifornimenti/topPerNumeroRifornimenti e ordina per rifornimenti, non per litri.",
  parameters: {
    type: "object",
    properties: {
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      fonte: { type: "string", enum: ["cisterna", "distributore", "tutti"] },
    },
    required: ["periodo"],
    additionalProperties: false,
  },
  outputKindHint: "chart",
  async run(input) {
    const [rifornimenti, cisterna] = await Promise.all([readNextRifornimentiReadOnlySnapshot(), readNextCisternaSnapshot()]);
    const fonte = text(input.fonte) || "tutti";
    const periodo = cleanPeriodFilter(input.periodo);
    const items = rifornimenti.items.filter((item) => inPeriod(item.dataDisplay ?? item.dataLabel ?? item.timestamp, periodo));
    const filtered = items.filter((item) => fonte === "tutti" || (fonte === "cisterna" ? text(item.distributore).includes("cisterna") : !text(item.distributore).includes("cisterna")));
    const buckets = new Map<string, { month: string; litri: number; costo: number; count: number }>();
    const byTarga = new Map<string, { targa: string; litri: number; costo: number; count: number }>();
    for (const item of filtered) {
      const key = monthKey(item.dataDisplay ?? item.dataLabel ?? item.timestamp);
      const bucket = buckets.get(key) ?? { month: key, litri: 0, costo: 0, count: 0 };
      bucket.litri += item.litri ?? 0;
      bucket.costo += item.costo ?? 0;
      bucket.count += 1;
      buckets.set(key, bucket);

      const targa = plate(item.targa ?? item.mezzoTarga) || "SENZA_TARGA";
      const vehicle = byTarga.get(targa) ?? { targa, litri: 0, costo: 0, count: 0 };
      vehicle.litri += item.litri ?? 0;
      vehicle.costo += item.costo ?? 0;
      vehicle.count += 1;
      byTarga.set(targa, vehicle);
    }
    const vehicles = Array.from(byTarga.values()).sort((left, right) => right.count - left.count || right.litri - left.litri);
    const shownVehicles = Math.min(vehicles.length, 50);
    const vehicleTruncation = buildTruncationMeta(vehicles.length, shownVehicles, "mezzi con rifornimenti");
    const rankingConteggioRifornimenti = vehicles.slice(0, shownVehicles).map((vehicle) => ({
      _id: `targa:${vehicle.targa}`,
      targa: vehicle.targa,
      rifornimenti: vehicle.count,
      litri: vehicle.litri,
      costo: vehicle.costo,
    }));
    return {
      totalLitri: filtered.reduce((sum, item) => sum + (item.litri ?? 0), 0),
      totalCosto: filtered.reduce((sum, item) => sum + (item.costo ?? 0), 0),
      count: filtered.length,
      total_count: filtered.length,
      shown: filtered.length,
      is_truncated: false,
      truncation_reason: null,
      byMonth: Array.from(buckets.values()),
      rankingConteggioRifornimenti,
      topPerNumeroRifornimenti: rankingConteggioRifornimenti[0] ?? null,
      topByTarga: rankingConteggioRifornimenti,
      topByTarga_total_count: vehicleTruncation.total_count,
      topByTarga_shown: vehicleTruncation.shown,
      topByTarga_is_truncated: vehicleTruncation.is_truncated,
      topByTarga_truncation_reason: vehicleTruncation.truncation_reason,
      notices: truncationNotice(vehicleTruncation),
      appliedFilters: { periodo, fonte },
      cisternaReportSummary: {
        litriTotaliMese: cisterna.report.litriTotaliMese,
        litriSupportoMese: cisterna.report.litriSupportoMese,
        deltaLitriSupporto: cisterna.report.deltaLitriSupporto,
        sourceTruthLabel: cisterna.report.sourceTruthLabel,
      },
    };
  },
};
