import { readNextDocumentiCostiFleetSnapshot } from "../../../domain/nextDocumentiCostiDomain";
import { readNextRifornimentiReadOnlySnapshot } from "../../../domain/nextRifornimentiDomain";
import { formatItalianDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type FindOutliersInput = { datasetRef?: unknown; campo?: unknown; soglia?: unknown };
type Row = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

async function loadRows(datasetRef: string): Promise<Row[]> {
  if (datasetRef.toLowerCase().includes("costo")) {
    const snapshot = await readNextDocumentiCostiFleetSnapshot();
    return snapshot.items as unknown as Row[];
  }
  const snapshot = await readNextRifornimentiReadOnlySnapshot();
  return snapshot.items as unknown as Row[];
}

function formatOutlierRow(row: Row): Row {
  return {
    ...row,
    data_italiana: formatItalianDate(row.dataDocumento ?? row.data ?? row.dateLabel ?? row.createdAt ?? row.updatedAt ?? row.timestamp ?? row.sortTimestamp),
  };
}

export const toolFindOutliers: ChatIaToolHandler<FindOutliersInput> = {
  name: "find_outliers",
  descriptionForOpenAi:
    "Trova valori anomali in un dataset numerico gia leggibile. Usa quando l'utente chiede anomalie, picchi, valori fuori scala o rifornimenti/costi strani.",
  parameters: {
    type: "object",
    properties: { datasetRef: { type: "string" }, campo: { type: "string" }, soglia: { type: "number" } },
    required: ["datasetRef", "campo"],
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const campo = text(input.campo);
    const rows = await loadRows(text(input.datasetRef));
    const withValue = rows.map((row) => ({ row, value: numberValue(row[campo]) })).filter((entry): entry is { row: Row; value: number } => entry.value !== null);
    const values = withValue.map((entry) => entry.value);
    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const variance = values.length ? values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length : 0;
    const limit = typeof input.soglia === "number" ? input.soglia : average + Math.sqrt(variance) * 2;
    const outliers = withValue.filter((entry) => entry.value > limit).map((entry) => ({ value: entry.value, row: formatOutlierRow(entry.row) }));
    return { campo, method: typeof input.soglia === "number" ? "soglia" : "media+2devstd", limit, count: outliers.length, outliers };
  },
};
