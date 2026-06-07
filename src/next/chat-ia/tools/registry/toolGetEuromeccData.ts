import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase";
import { formatItalianDate } from "../chatIaToolDates";
import { buildTruncationMeta, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = {
  targa?: unknown;
  tipo?: unknown;
  limit?: unknown;
};

type AnyRecord = Record<string, unknown>;
type EuromeccTipo = "issue" | "extra_component" | "all";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function norm(value: unknown): string {
  return text(value).toLowerCase();
}

function normalizeTarga(value: unknown): string {
  return text(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 200) : 80;
}

function normalizeTipo(value: unknown): EuromeccTipo {
  const normalized = norm(value);
  return normalized === "issue" || normalized === "extra_component" || normalized === "all" ? normalized : "all";
}

function matchesTarga(record: AnyRecord, targa: string): boolean {
  if (!targa) return true;
  return normalizeTarga(JSON.stringify(record)).includes(targa);
}

function dateValue(record: AnyRecord): unknown {
  return record.updatedAt ?? record.createdAt ?? record.reportedAt ?? record.addedAt ?? record.closedDate ?? record.data;
}

function formatItem(id: string, data: AnyRecord, tipo: Exclude<EuromeccTipo, "all">): AnyRecord {
  return {
    _id: id,
    id: text(data.id) || id,
    tipo,
    sourceCollection: tipo === "issue" ? "euromecc_issues" : "euromecc_extra_components",
    ...data,
    data_italiana: formatItalianDate(dateValue(data)),
    reportedAt_italiana: formatItalianDate(data.reportedAt),
    closedDate_italiana: formatItalianDate(data.closedDate),
    addedAt_italiana: formatItalianDate(data.addedAt),
    createdAt_italiana: formatItalianDate(data.createdAt),
    updatedAt_italiana: formatItalianDate(data.updatedAt),
  };
}

async function readCollectionItems(collectionName: string, tipo: Exclude<EuromeccTipo, "all">): Promise<AnyRecord[]> {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((entry) => formatItem(entry.id, entry.data() as AnyRecord, tipo));
}

export const toolGetEuromeccData: ChatIaToolHandler<Input> = {
  name: "get_euromecc_data",
  descriptionForOpenAi:
    "Legge issue Euromecc e componenti extra Euromecc dalle collection root euromecc_issues ed euromecc_extra_components. Usa per stato Euromecc, issue, problemi segnalati o componenti extra. Non legge bozze relazione, relazioni confermate, pending o done.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string", description: "Targa da filtrare se presente nel testo del record." },
      tipo: { type: "string", enum: ["issue", "extra_component", "all"] },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const tipo = normalizeTipo(input.tipo);
    const targa = normalizeTarga(input.targa);
    const requestedLimit = limit(input.limit);
    const [issues, extraComponents] = await Promise.all([
      tipo === "extra_component" ? Promise.resolve([]) : readCollectionItems("euromecc_issues", "issue"),
      tipo === "issue" ? Promise.resolve([]) : readCollectionItems("euromecc_extra_components", "extra_component"),
    ]);

    const allItems = [...issues, ...extraComponents]
      .filter((item) => matchesTarga(item, targa))
      .sort((left, right) => {
        const leftDate = String(left.data_italiana ?? "");
        const rightDate = String(right.data_italiana ?? "");
        return rightDate.localeCompare(leftDate, "it") || String(left._id).localeCompare(String(right._id), "it");
      });
    const shown = Math.min(allItems.length, requestedLimit);
    const truncation = buildTruncationMeta(allItems.length, shown, "dati Euromecc issue e componenti extra");
    const items = allItems.slice(0, requestedLimit);

    return {
      items,
      issues: items.filter((item) => item.tipo === "issue"),
      extraComponents: items.filter((item) => item.tipo === "extra_component"),
      total: allItems.length,
      counts: {
        issues: issues.filter((item) => matchesTarga(item, targa)).length,
        extraComponents: extraComponents.filter((item) => matchesTarga(item, targa)).length,
      },
      appliedFilters: { targa: targa || null, tipo },
      sources: [
        { collection: "euromecc_issues", included: tipo === "all" || tipo === "issue" },
        { collection: "euromecc_extra_components", included: tipo === "all" || tipo === "extra_component" },
      ],
      ...truncation,
      notices: truncationNotice(truncation),
    };
  },
};

export default toolGetEuromeccData;
