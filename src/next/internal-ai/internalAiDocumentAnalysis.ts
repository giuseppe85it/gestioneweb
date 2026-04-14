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

type AggregatedScalarResult<TValue> = {
  value: TValue | null;
  conflicting: boolean;
};

function aggregateStringValues(values: Array<string | null | undefined>): AggregatedScalarResult<string> {
  const uniqueValues = uniqueStrings(values);
  if (uniqueValues.length === 0) {
    return {
      value: null,
      conflicting: false,
    };
  }

  if (uniqueValues.length === 1) {
    return {
      value: uniqueValues[0],
      conflicting: false,
    };
  }

  return {
    value: null,
    conflicting: true,
  };
}

function aggregateNumberValues(values: Array<number | null | undefined>): AggregatedScalarResult<number> {
  const seen = new Set<string>();
  const uniqueValues: number[] = [];

  values.forEach((value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return;
    }

    const key = value.toString();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    uniqueValues.push(value);
  });

  if (uniqueValues.length === 0) {
    return {
      value: null,
      conflicting: false,
    };
  }

  if (uniqueValues.length === 1) {
    return {
      value: uniqueValues[0],
      conflicting: false,
    };
  }

  return {
    value: null,
    conflicting: true,
  };
}

function buildRowAggregateKey(row: InternalAiDocumentAnalysisRow): string {
  return [
    normalizeText(row.codiceArticolo).toLowerCase(),
    normalizeText(row.descrizione).toLowerCase(),
    typeof row.quantita === "number" ? row.quantita.toString() : "",
    normalizeText(row.unita).toLowerCase(),
    typeof row.prezzoUnitario === "number" ? row.prezzoUnitario.toString() : "",
    typeof row.totaleRiga === "number" ? row.totaleRiga.toString() : "",
  ].join("|");
}

function dedupeRows(rows: InternalAiDocumentAnalysisRow[]): InternalAiDocumentAnalysisRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = buildRowAggregateKey(row);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function buildAggregatedStatus(args: {
  headerFields: Array<string | null>;
  rows: InternalAiDocumentAnalysisRow[];
  textExcerpt: string | null;
}): InternalAiDocumentAnalysis["stato"] {
  if (args.rows.length > 0 && args.headerFields.filter(Boolean).length >= 2) {
    return "ready";
  }

  if (args.rows.length > 0 || args.headerFields.filter(Boolean).length >= 1 || args.textExcerpt) {
    return "partial";
  }

  return "not_supported";
}

export type InternalAiLogicalDocumentAggregate = {
  attachmentIds: string[];
  attachmentCount: number;
  fileNames: string[];
  textExcerpt: string | null;
  documentAnalysis: InternalAiDocumentAnalysis | null;
  conflictFields: string[];
};

export function buildInternalAiLogicalDocumentAggregate(
  attachments: InternalAiChatAttachment[],
): InternalAiLogicalDocumentAggregate | null {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return null;
  }

  const analyses = attachments
    .map((attachment) => getInternalAiAttachmentDocumentAnalysis(attachment))
    .filter((analysis): analysis is InternalAiDocumentAnalysis => Boolean(analysis));
  const mergedTextExcerpt =
    uniqueStrings(
      attachments.flatMap((attachment) => [
        attachment.textExcerpt,
        attachment.documentAnalysis?.testoEstrattoBreve,
      ]),
    )
      .join("\n\n")
      .slice(0, 2000) || null;

  if (analyses.length === 0) {
    return {
      attachmentIds: attachments.map((attachment) => attachment.id),
      attachmentCount: attachments.length,
      fileNames: attachments.map((attachment) => attachment.fileName),
      textExcerpt: mergedTextExcerpt,
      documentAnalysis: null,
      conflictFields: [],
    };
  }

  const tipoDocumento = aggregateStringValues(analyses.map((analysis) => analysis.tipoDocumento));
  const fornitore = aggregateStringValues(analyses.map((analysis) => analysis.fornitore));
  const numeroDocumento = aggregateStringValues(analyses.map((analysis) => analysis.numeroDocumento));
  const dataDocumento = aggregateStringValues(analyses.map((analysis) => analysis.dataDocumento));
  const destinatario = aggregateStringValues(analyses.map((analysis) => analysis.destinatario));
  const valuta = aggregateStringValues(analyses.map((analysis) => analysis.valuta));
  const imponibile = aggregateNumberValues(analyses.map((analysis) => analysis.imponibile));
  const ivaImporto = aggregateNumberValues(analyses.map((analysis) => analysis.ivaImporto));
  const ivaPercentuale = aggregateStringValues(analyses.map((analysis) => analysis.ivaPercentuale));
  const totaleDocumento = aggregateNumberValues(analyses.map((analysis) => analysis.totaleDocumento));
  const conflictFields = [
    tipoDocumento.conflicting ? "tipoDocumento" : null,
    fornitore.conflicting ? "fornitore" : null,
    numeroDocumento.conflicting ? "numeroDocumento" : null,
    dataDocumento.conflicting ? "dataDocumento" : null,
    destinatario.conflicting ? "destinatario" : null,
    valuta.conflicting ? "valuta" : null,
    imponibile.conflicting ? "imponibile" : null,
    ivaImporto.conflicting ? "ivaImporto" : null,
    ivaPercentuale.conflicting ? "ivaPercentuale" : null,
    totaleDocumento.conflicting ? "totaleDocumento" : null,
  ].filter((field): field is string => Boolean(field));
  const rows = dedupeRows(
    attachments.flatMap((attachment) => getInternalAiAttachmentDocumentRows(attachment)),
  );

  const documentAnalysis: InternalAiDocumentAnalysis = {
    version: analyses[0]?.version ?? 1,
    stato: buildAggregatedStatus({
      headerFields: [
        tipoDocumento.value,
        fornitore.value,
        numeroDocumento.value,
        dataDocumento.value,
      ],
      rows,
      textExcerpt: mergedTextExcerpt,
    }),
    tipoSorgente: analyses[0]?.tipoSorgente ?? "other",
    modalitaEstrazione: analyses[0]?.modalitaEstrazione ?? "fallback_locale",
    providerUsato: analyses.some((analysis) => analysis.providerUsato),
    tipoDocumento: tipoDocumento.value,
    fornitore: fornitore.value,
    numeroDocumento: numeroDocumento.value,
    dataDocumento: dataDocumento.value,
    destinatario: destinatario.value,
    valuta: valuta.value,
    imponibile: imponibile.value,
    ivaImporto: ivaImporto.value,
    ivaPercentuale: ivaPercentuale.value,
    totaleDocumento: totaleDocumento.value,
    noteImportanti: uniqueStrings([
      ...analyses.flatMap((analysis) => analysis.noteImportanti),
      conflictFields.length > 0
        ? `Campi da verificare nel riepilogo unico: ${conflictFields.join(", ")}.`
        : null,
    ]),
    righe: rows,
    warnings: uniqueStrings(
      analyses.flatMap((analysis) =>
        analysis.warnings.map((warning) => `${warning.code}|${warning.severity}|${warning.message}`),
      ),
    ).map((serialized) => {
      const [code = "LOGICAL_DOCUMENT_WARNING", severity = "warn", ...messageParts] =
        serialized.split("|");
      const normalizedSeverity: "error" | "info" | "warn" =
        severity === "error" || severity === "info" || severity === "warn"
          ? severity
          : "warn";
      return {
        code,
        severity: normalizedSeverity,
        message: messageParts.join("|") || code,
      };
    }).concat(
      conflictFields.map((field) => ({
        code: `LOGICAL_DOCUMENT_CONFLICT_${field.toUpperCase()}`,
        severity: "warn" as const,
        message: `Campo ${field} non coerente tra gli allegati del documento logico: dato da verificare.`,
      })),
    ),
    campiMancanti: [
      !tipoDocumento.value ? "tipoDocumento" : null,
      !fornitore.value ? "fornitore" : null,
      !numeroDocumento.value ? "numeroDocumento" : null,
      !dataDocumento.value ? "dataDocumento" : null,
      rows.length === 0 ? "righe" : null,
    ].filter((field): field is string => Boolean(field)),
    testoEstrattoBreve: mergedTextExcerpt,
  };

  return {
    attachmentIds: attachments.map((attachment) => attachment.id),
    attachmentCount: attachments.length,
    fileNames: attachments.map((attachment) => attachment.fileName),
    textExcerpt: mergedTextExcerpt,
    documentAnalysis,
    conflictFields,
  };
}
