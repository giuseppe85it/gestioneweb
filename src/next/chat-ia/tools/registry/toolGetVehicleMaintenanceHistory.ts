import { readNextMezzoManutenzioniSnapshot } from "../../../domain/nextManutenzioniDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type GetVehicleMaintenanceHistoryInput = { targa?: unknown; periodo?: PeriodInput };

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function asDate(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function inPeriod(item: { dataRaw?: string | null; timestamp?: number | null }, period?: PeriodInput): boolean {
  const from = asDate(period?.from);
  const to = asDate(period?.to, true);
  if (from === null && to === null) return true;
  const time = asDate(item.dataRaw ?? item.timestamp);
  if (time === null) return false;
  return (from === null || time >= from) && (to === null || time <= to);
}

function formatHistoryItem<T extends { dataRaw?: string | null; timestamp?: number | null }>(item: T): T & { data_italiana: string } {
  return {
    ...item,
    data_italiana: formatItalianDate(item.dataRaw ?? item.timestamp),
  };
}

export const toolGetVehicleMaintenanceHistory: ChatIaToolHandler<GetVehicleMaintenanceHistoryInput> = {
  name: "get_vehicle_maintenance_history",
  descriptionForOpenAi:
    "Recupera lo storico manutenzioni di un singolo mezzo e la sua pianificazione manutentiva. Usa quando l'utente chiede manutenzioni effettuate, storico manutenzioni, manutenzioni del mese o del periodo per una targa specifica.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
    },
    required: ["targa"],
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const targa = normalizeTarga(input.targa);
    if (!targa) throw new Error("Targa mezzo mancante o non valida.");
    const manutenzioni = await readNextMezzoManutenzioniSnapshot(targa);
    const manutenzioniFormatted = {
      ...manutenzioni,
      scheduledMaintenance: {
        ...manutenzioni.scheduledMaintenance,
        dataInizio_italiana: formatItalianDate(manutenzioni.scheduledMaintenance.dataInizio),
        dataFine_italiana: formatItalianDate(manutenzioni.scheduledMaintenance.dataFine),
      },
      historyItems: manutenzioni.historyItems.map(formatHistoryItem),
    };
    return {
      manutenzioni: manutenzioniFormatted,
      periodo: input.periodo ?? null,
      filtered: manutenzioniFormatted.historyItems.filter((item) => inPeriod(item, input.periodo)),
    };
  },
};
