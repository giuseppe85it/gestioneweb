import { readNextDocumentiCostiFleetSnapshot, readNextIADocumentiArchiveSnapshot } from "../../../domain/nextDocumentiCostiDomain";
import { formatItalianDate } from "../chatIaToolDates";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type GetInvoiceByIdInput = { id?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function includesId(item: unknown, id: string): boolean {
  return JSON.stringify(item).toLowerCase().includes(id.toLowerCase());
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function formatInvoiceItem(item: unknown): Record<string, unknown> | null {
  if (!item) return null;
  const r = rec(item);
  return {
    ...r,
    data_italiana: formatItalianDate(r.dataDocumento ?? r.data ?? r.dateLabel ?? r.createdAt ?? r.updatedAt ?? r.timestamp ?? r.sortTimestamp),
  };
}

export const toolGetInvoiceById: ChatIaToolHandler<GetInvoiceByIdInput> = {
  name: "get_invoice_by_id",
  descriptionForOpenAi:
    "Cerca un documento o fattura per id negli archivi documentali NEXT. Usa quando l'utente fornisce un identificativo documento/fattura.",
  parameters: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
    additionalProperties: false,
  },
  outputKindHint: "card",
  async run(input) {
    const id = text(input.id);
    if (!id) throw new Error("Id documento/fattura mancante.");
    const [archive, fleet] = await Promise.all([readNextIADocumentiArchiveSnapshot(), readNextDocumentiCostiFleetSnapshot()]);
    const archiveItems = "items" in archive && Array.isArray(archive.items) ? archive.items : [];
    const archiveMatch = archiveItems.find((item) => includesId(item, id)) ?? null;
    const fleetMatch = fleet.items.find((item) => includesId(item, id)) ?? null;
    return { item: formatInvoiceItem(archiveMatch ?? fleetMatch), source: archiveMatch ? "ia_archive" : fleetMatch ? "documenti_costi_fleet" : undefined };
  },
};
