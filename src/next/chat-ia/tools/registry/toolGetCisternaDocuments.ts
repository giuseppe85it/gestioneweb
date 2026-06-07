import { readNextCisternaSnapshot } from "../../../domain/nextCisternaDomain";
import { formatItalianDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type GetCisternaDocumentsInput = { monthKey?: unknown; fornitore?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function formatDocument<T extends { id?: string | null; sourceDocId?: string | null; timestamp?: number | null; dataDocumento?: string | null; data?: string | null }>(item: T): T & { _id: string; data_italiana: string } {
  const id = item.id ?? item.sourceDocId ?? "";
  return {
    _id: id,
    ...item,
    data_italiana: formatItalianDate(item.dataDocumento ?? item.data ?? item.timestamp),
  };
}

export const toolGetCisternaDocuments: ChatIaToolHandler<GetCisternaDocumentsInput> = {
  name: "get_cisterna_documents",
  descriptionForOpenAi:
    "Recupera documenti Cisterna caricati e analizzati. Usa quando l'utente chiede bolle, fatture o documenti Cisterna.",
  parameters: {
    type: "object",
    properties: { monthKey: { type: "string" }, fornitore: { type: "string" } },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const snapshot = await readNextCisternaSnapshot(text(input.monthKey) || null);
    const fornitore = text(input.fornitore).toLowerCase();
    const items = snapshot.archive.documents.filter((item) => !fornitore || JSON.stringify(item).toLowerCase().includes(fornitore));
    return { items: items.map(formatDocument), total: items.length, counts: snapshot.counts };
  },
};
