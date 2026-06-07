import { readNextMezzoDocumentiSnapshot } from "../../../domain/nextDocumentiMezzoDomain";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type DownloadDocumentPdfInput = { targa?: unknown; documentId?: unknown };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTarga(value: unknown): string {
  return text(value).toUpperCase().replace(/\s+/g, "");
}

export const toolDownloadDocumentPdf: ChatIaToolHandler<DownloadDocumentPdfInput> = {
  name: "download_document_pdf",
  descriptionForOpenAi:
    "Restituisce URL e metadati di un documento scaricabile se gia presenti nei record. Usa quando l'utente chiede di aprire o scaricare un PDF esistente.",
  parameters: {
    type: "object",
    properties: { targa: { type: "string" }, documentId: { type: "string" } },
    additionalProperties: false,
  },
  outputKindHint: "ui_action",
  async run(input) {
    const targa = normalizeTarga(input.targa);
    const documentId = text(input.documentId);
    if (!targa && !documentId) throw new Error("Serve targa o documentId.");
    const snapshot = await readNextMezzoDocumentiSnapshot(targa);
    const document = snapshot.items.find((item) => item.id === documentId || item.sourceDocId === documentId) ?? snapshot.items.find((item) => Boolean(item.fileUrl)) ?? null;
    return document ? { documentId: document.id, fileUrl: document.fileUrl ?? undefined, fileName: document.nomeFile ?? document.titolo, source: document.sourceKey } : null;
  },
};
