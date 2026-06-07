import { readNextAnalisiEconomicaSavedSnapshot } from "../../../domain/nextAnalisiEconomicaDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { targa?: unknown; periodo?: { from?: unknown; to?: unknown } };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function plate(value: unknown): string { return text(value).toUpperCase().replace(/\s+/g, ""); }
function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function savedAnalysisDateValue(item: {
  updatedAtLabel?: string | null;
  updatedAtTimestamp?: number | null;
  raw?: Record<string, unknown>;
}): unknown {
  return item.updatedAtLabel ?? item.raw?.updatedAt ?? item.raw?.createdAt ?? item.updatedAtTimestamp;
}

function formatSavedAnalysis<T extends {
  updatedAtLabel?: string | null;
  updatedAtTimestamp?: number | null;
  raw?: Record<string, unknown>;
}>(item: T): T & { aggiornata_il: string } {
  return {
    ...item,
    aggiornata_il: formatItalianDate(savedAnalysisDateValue(item)),
  };
}

export const toolGetSavedEconomicAnalysis: ChatIaToolHandler<Input> = {
  name: "get_saved_economic_analysis",
  descriptionForOpenAi:
    "Recupera analisi economiche IA salvate per una targa. Usa quando l'utente chiede l'ultima analisi economica salvata o confronti con costi documentali.",
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
    const targa = plate(input.targa);
    if (!targa) throw new Error("Targa mezzo mancante o non valida.");
    const from = ts(input.periodo?.from), to = ts(input.periodo?.to, true);
    const snapshot = await readNextAnalisiEconomicaSavedSnapshot({ targa });
    const items = snapshot.items.filter((item) => {
      const time = ts(savedAnalysisDateValue(item));
      return (from === null || (time !== null && time >= from)) && (to === null || (time !== null && time <= to));
    });
    return { targa, savedAnalysis: items[0] ? formatSavedAnalysis(items[0]) : null, sourceCollection: "@analisi_economica_mezzi", warnings: snapshot.limitations, total: items.length };
  },
};

export default toolGetSavedEconomicAnalysis;
