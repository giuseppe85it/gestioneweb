import { readNextDocumentiCostiFleetSnapshot } from "../../../domain/nextDocumentiCostiDomain";
import { readNextRifornimentiReadOnlySnapshot } from "../../../domain/nextRifornimentiDomain";
import { parseChatIaToolDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Period = { from?: unknown; to?: unknown };
type ComparePeriodsInput = { datasetRef?: unknown; campo?: unknown; periodoA?: Period; periodoB?: Period };
type Row = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function timestamp(row: Row): number | null {
  for (const key of ["data", "dataDocumento", "dateLabel", "date", "createdAt", "updatedAt", "timestamp", "sortTimestamp"]) {
    const parsed = parseChatIaToolDate(row[key]);
    if (parsed) return parsed.getTime();
  }
  return null;
}

function inPeriod(value: number | null, period?: Period): boolean {
  const fromDate = parseChatIaToolDate(period?.from);
  const toDate = parseChatIaToolDate(period?.to);
  const from = fromDate ? new Date(fromDate).setHours(0, 0, 0, 0) : null;
  const to = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : null;
  return (from === null || (value !== null && value >= from)) && (to === null || (value !== null && value <= to));
}

async function loadRows(datasetRef: string): Promise<Row[]> {
  if (datasetRef.toLowerCase().includes("costo")) {
    const snapshot = await readNextDocumentiCostiFleetSnapshot();
    return snapshot.items as unknown as Row[];
  }
  const snapshot = await readNextRifornimentiReadOnlySnapshot();
  return snapshot.items as unknown as Row[];
}

export const toolComparePeriods: ChatIaToolHandler<ComparePeriodsInput> = {
  name: "compare_periods",
  descriptionForOpenAi:
    "Confronta un campo numerico tra due periodi su dati gia leggibili. Usa per confrontare litri, costi o conteggi tra mesi, anni o intervalli richiesti.",
  parameters: {
    type: "object",
    properties: {
      datasetRef: { type: "string" },
      campo: { type: "string" },
      periodoA: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      periodoB: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
    },
    required: ["datasetRef", "campo", "periodoA", "periodoB"],
    additionalProperties: false,
  },
  outputKindHint: "chart",
  async run(input) {
    const campo = text(input.campo);
    const rows = await loadRows(text(input.datasetRef));
    const sumPeriod = (period?: Period) => rows.filter((row) => inPeriod(timestamp(row), period)).reduce((sum, row) => sum + numberValue(row[campo]), 0);
    const totalA = sumPeriod(input.periodoA);
    const totalB = sumPeriod(input.periodoB);
    return { campo, periodoA: { total: totalA }, periodoB: { total: totalB }, delta: totalB - totalA, percentDelta: totalA ? ((totalB - totalA) / totalA) * 100 : null };
  },
};
