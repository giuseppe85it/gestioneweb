import type {
  InternalAiChatAttachment,
  InternalAiDocumentAnalysis,
  InternalAiDocumentAnalysisRow,
} from "./internalAiTypes";

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  values.forEach((value) => {
    const normalized = normalizeText(value);
    if (!normalized) {
      return;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    output.push(normalized);
  });

  return output;
}

function normalizeRow(row: InternalAiDocumentAnalysisRow, index: number): InternalAiDocumentAnalysisRow {
  return {
    id: normalizeText(row.id) || `riga-${index + 1}`,
    descrizione: normalizeText(row.descrizione) || null,
    quantita: typeof row.quantita === "number" && Number.isFinite(row.quantita) ? row.quantita : null,
    unita: normalizeText(row.unita) || null,
    prezzoUnitario:
      typeof row.prezzoUnitario === "number" && Number.isFinite(row.prezzoUnitario)
        ? row.prezzoUnitario
        : null,
    totaleRiga:
      typeof row.totaleRiga === "number" && Number.isFinite(row.totaleRiga) ? row.totaleRiga : null,
    codiceArticolo: normalizeText(row.codiceArticolo) || null,
    valuta: normalizeText(row.valuta) || null,
    confidence:
      typeof row.confidence === "number" && Number.isFinite(row.confidence) ? row.confidence : null,
    warnings: Array.isArray(row.warnings)
      ? uniqueStrings(row.warnings.map((entry) => normalizeText(entry)))
      : [],
  };
}

export function getInternalAiAttachmentDocumentAnalysis(
  attachment: InternalAiChatAttachment | null | undefined,
): InternalAiDocumentAnalysis | null {
  const analysis = attachment?.documentAnalysis ?? null;
  if (!analysis || typeof analysis !== "object") {
    return null;
  }

  return analysis;
}

export function getInternalAiAttachmentDocumentRows(
  attachment: InternalAiChatAttachment | null | undefined,
): InternalAiDocumentAnalysisRow[] {
  const analysis = getInternalAiAttachmentDocumentAnalysis(attachment);
  if (!analysis || !Array.isArray(analysis.righe)) {
    return [];
  }

  return analysis.righe.map((row, index) => normalizeRow(row, index));
}

export function getInternalAiAttachmentPrimaryDocumentRow(
  attachment: InternalAiChatAttachment | null | undefined,
): InternalAiDocumentAnalysisRow | null {
  const rows = getInternalAiAttachmentDocumentRows(attachment);
  return rows[0] ?? null;
}

export function buildInternalAiDocumentRowsJson(
  rows: InternalAiDocumentAnalysisRow[],
  limit = 12,
): string | null {
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }

  try {
    return JSON.stringify(rows.slice(0, limit).map((row, index) => normalizeRow(row, index)));
  } catch {
    return null;
  }
}

export function parseInternalAiDocumentRowsJson(
  value: string | null | undefined,
): InternalAiDocumentAnalysisRow[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((entry) => entry && typeof entry === "object")
      .map((entry, index) => normalizeRow(entry as InternalAiDocumentAnalysisRow, index));
  } catch {
    return [];
  }
}

export function buildInternalAiAttachmentDocumentSignalText(
  attachment: InternalAiChatAttachment | null | undefined,
): string {
  if (!attachment) {
    return "";
  }

  const analysis = getInternalAiAttachmentDocumentAnalysis(attachment);
  const rows = getInternalAiAttachmentDocumentRows(attachment);

  return uniqueStrings([
    attachment.fileName,
    attachment.kind,
    attachment.textExcerpt,
    analysis?.tipoDocumento ? `tipo documento ${analysis.tipoDocumento}` : null,
    analysis?.fornitore ? `fornitore ${analysis.fornitore}` : null,
    analysis?.numeroDocumento ? `numero documento ${analysis.numeroDocumento}` : null,
    analysis?.dataDocumento ? `data documento ${analysis.dataDocumento}` : null,
    analysis?.destinatario ? `destinatario ${analysis.destinatario}` : null,
    analysis?.valuta ? `valuta ${analysis.valuta}` : null,
    analysis?.noteImportanti?.join(" "),
    analysis?.testoEstrattoBreve,
    ...rows.flatMap((row) => [
      row.descrizione,
      row.codiceArticolo,
      typeof row.quantita === "number" ? `quantita ${row.quantita}` : null,
      row.unita,
      typeof row.prezzoUnitario === "number" ? `prezzo ${row.prezzoUnitario}` : null,
      typeof row.totaleRiga === "number" ? `totale riga ${row.totaleRiga}` : null,
    ]),
  ]).join(" ");
}
