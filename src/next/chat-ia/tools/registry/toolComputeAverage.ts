import { readNextCisternaSnapshot } from "../../../domain/nextCisternaDomain";
import { readNextDocumentiCostiFleetSnapshot } from "../../../domain/nextDocumentiCostiDomain";
import { readNextRifornimentiReadOnlySnapshot } from "../../../domain/nextRifornimentiDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type ComputeAverageInput = { datasetRef?: unknown; campo?: unknown; groupBy?: unknown };
type Row = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function looksLikeDateField(field: string): boolean {
  const normalized = field.toLowerCase();
  return (
    normalized.includes("data") ||
    normalized.includes("date") ||
    normalized.includes("timestamp") ||
    normalized.includes("scadenza") ||
    normalized.includes("createdat") ||
    normalized.includes("updatedat")
  );
}

function groupKey(field: string, value: unknown): string {
  if (looksLikeDateField(field) && parseChatIaToolDate(value)) {
    return formatItalianDate(value);
  }
  return String(value ?? "senza-valore");
}

async function loadRows(datasetRef: string): Promise<Row[]> {
  const key = datasetRef.toLowerCase();
  if (key.includes("costo") || key.includes("fattur")) {
    const snapshot = await readNextDocumentiCostiFleetSnapshot();
    return snapshot.items as unknown as Row[];
  }
  if (key.includes("cisterna")) {
    const snapshot = await readNextCisternaSnapshot();
    return snapshot.archive.documents as unknown as Row[];
  }
  const snapshot = await readNextRifornimentiReadOnlySnapshot();
  return snapshot.items as unknown as Row[];
}

export const toolComputeAverage: ChatIaToolHandler<ComputeAverageInput> = {
  name: "compute_average",
  descriptionForOpenAi:
    "Calcola una media su un dataset NEXT gia leggibile, per esempio litri, costo o importo. Usa quando l'utente chiede medie semplici su rifornimenti, costi o Cisterna.",
  parameters: {
    type: "object",
    properties: { datasetRef: { type: "string" }, campo: { type: "string" }, groupBy: { type: "string" } },
    required: ["datasetRef", "campo"],
    additionalProperties: false,
  },
  outputKindHint: "chart",
  async run(input) {
    const campo = text(input.campo);
    const groupBy = text(input.groupBy);
    const rows = await loadRows(text(input.datasetRef));
    const values = rows.map((row) => asNumber(row[campo])).filter((value): value is number => value !== null);
    const groups = new Map<string, { key: string; total: number; count: number; average: number }>();
    if (groupBy) {
      for (const row of rows) {
        const value = asNumber(row[campo]);
        if (value === null) continue;
        const key = groupKey(groupBy, row[groupBy]);
        const bucket = groups.get(key) ?? { key, total: 0, count: 0, average: 0 };
        bucket.total += value;
        bucket.count += 1;
        bucket.average = bucket.total / bucket.count;
        groups.set(key, bucket);
      }
    }
    return { campo, count: values.length, average: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null, groups: Array.from(groups.values()) };
  },
};
