import { readNextMezzoRifornimentiSnapshot } from "../../../domain/nextRifornimentiDomain";
import { readNextMezzoByTarga } from "../../../nextAnagraficheFlottaDomain";
import { formatItalianDateFromItalianSource, parseChatIaToolDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type GetConsumptionAverageInput = { targa?: unknown; periodo?: PeriodInput };

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function dateMs(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function inPeriod(value: unknown, period?: PeriodInput): boolean {
  const from = dateMs(period?.from);
  const to = dateMs(period?.to, true);
  const timestamp = dateMs(value);
  return (from === null || (timestamp !== null && timestamp >= from)) && (to === null || (timestamp !== null && timestamp <= to));
}

export const toolGetConsumptionAverage: ChatIaToolHandler<GetConsumptionAverageInput> = {
  name: "get_consumption_average",
  descriptionForOpenAi:
    "Calcola il consumo medio di un mezzo partendo dai rifornimenti disponibili. Usa quando l'utente chiede consumi o litri per 100 km di una targa.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
    },
    required: ["targa"],
    additionalProperties: false,
  },
  outputKindHint: "card",
  async run(input) {
    const targa = normalizeTarga(input.targa);
    if (!targa) throw new Error("Targa mezzo mancante o non valida.");
    const [mezzo, rifornimenti] = await Promise.all([readNextMezzoByTarga(targa), readNextMezzoRifornimentiSnapshot(targa)]);
    const items = rifornimenti.items.filter((item) => inPeriod(item.dataDisplay ?? item.dataLabel ?? item.timestamp, input.periodo));
    const litriTotali = items.reduce((sum, item) => sum + (item.litri ?? 0), 0);
    const kms = items.map((item) => item.km).filter((value): value is number => typeof value === "number");
    const kmTotali = kms.length >= 2 ? Math.max(...kms) - Math.min(...kms) : undefined;
    const consumoL100Km = kmTotali && kmTotali > 0 ? (litriTotali / kmTotali) * 100 : undefined;
    return {
      targa,
      mezzo,
      formattedDates: {
        dataScadenzaRevisione: formatItalianDateFromItalianSource(mezzo?.dataScadenzaRevisione || mezzo?.dataScadenzaRevisioneTimestamp),
        manutenzioneDataFine: formatItalianDateFromItalianSource(mezzo?.manutenzioneDataFine || mezzo?.manutenzioneDataFineTimestamp),
      },
      litriTotali,
      kmTotali,
      consumoL100Km,
      note: consumoL100Km ? [] : ["Km insufficienti nei rifornimenti: calcolo l/100km non disponibile."],
    };
  },
};
