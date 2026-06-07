import { readNextMezzoDocumentiSnapshot } from "../../../domain/nextDocumentiMezzoDomain";
import { formatItalianDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type GetVehicleDocumentsInput = { targa?: unknown; tipo?: unknown };

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeTarga(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase().replace(/\s+/g, "") : "";
}

function formatDocumentItem<T extends { id?: string | null; sourceDocId?: string | null; sourceRecordId?: string | null; dataDocumento?: string | null; timestamp?: number | null }>(item: T): T & { _id: string; dataDocumento_italiana: string } {
  const id = item.id ?? item.sourceDocId ?? item.sourceRecordId ?? "";
  return {
    _id: id,
    ...item,
    dataDocumento_italiana: formatItalianDate(item.dataDocumento ?? item.timestamp),
  };
}

export const toolGetVehicleDocuments: ChatIaToolHandler<GetVehicleDocumentsInput> = {
  name: "get_vehicle_documents",
  descriptionForOpenAi:
    "Recupera i documenti associati a un mezzo. Usa quando l'utente chiede libretti, revisioni, assicurazioni o documenti di una targa.",
  parameters: {
    type: "object",
    properties: { targa: { type: "string" }, tipo: { type: "string" } },
    required: ["targa"],
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const targa = normalizeTarga(input.targa);
    if (!targa) throw new Error("Targa mezzo mancante o non valida.");
    const snapshot = await readNextMezzoDocumentiSnapshot(targa);
    const tipo = normalize(input.tipo);
    const items = snapshot.items.filter((item) => !tipo || `${item.categoria} ${item.tipoDocumento ?? ""} ${item.titolo}`.toLowerCase().includes(tipo));
    return { ...snapshot, items: items.map(formatDocumentItem), total: items.length };
  },
};
