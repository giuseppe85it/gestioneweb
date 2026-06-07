import { readNextCisternaSchedaDetail, readNextCisternaSnapshot } from "../../../domain/nextCisternaDomain";
import { formatItalianDate } from "../chatIaToolDates";
import { buildTruncationMeta, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { monthKey?: unknown; includeRows?: unknown; focus?: unknown };
const ROW_LIMIT = 12;
const DETAIL_LIMIT = 3;

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase(); }
function rec(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function formatRecordDate(value: unknown): Record<string, unknown> {
  const item = rec(value);
  const id = text(item._id ?? item.id) || "";
  return {
    _id: id,
    ...item,
    data_italiana: formatItalianDate(item.dataDocumento ?? item.data ?? item.dateLabel ?? item.timestamp),
  };
}

function compactDifference(value: unknown): Record<string, unknown> {
  const item = rec(value);
  const id = text(item.type) || "differenza";
  return {
    _id: `cisterna:differenza:${id}`,
    type: item.type ?? null,
    delta: item.delta ?? null,
    missingTotalCount: item.missingTotalCount ?? null,
    mixedCurrency: item.mixedCurrency ?? null,
  };
}

function compactDuplicateGroup(value: unknown): Record<string, unknown> {
  const item = rec(value);
  const items = Array.isArray(item.items) ? item.items : [];
  return {
    _id: `cisterna:duplicato:${text(item.key) || text(item.dateLabel) || "senza-chiave"}`,
    key: item.key ?? null,
    data: item.dateLabel ?? null,
    resolution: item.resolution ?? null,
    note: item.note ?? null,
    documents_count: items.length,
    document_ids: items.map((child) => text(rec(child).id)).filter(Boolean).slice(0, 5),
  };
}

function compactDetail(value: unknown): Record<string, unknown> {
  const item = rec(value);
  const rows = Array.isArray(item.rows) ? item.rows : [];
  return {
    _id: text(item.id) || "",
    id: item.id ?? null,
    sourceLabel: item.sourceLabel ?? null,
    monthKey: item.monthKey ?? null,
    rowCount: item.rowCount ?? rows.length,
    targa: item.targa ?? null,
    needsReview: item.needsReview ?? null,
    rows_preview: rows.slice(0, ROW_LIMIT),
  };
}

export const toolReconcileCisternaMonth: ChatIaToolHandler<Input> = {
  name: "reconcile_cisterna_month",
  descriptionForOpenAi:
    "Riconcilia un mese Cisterna tra documenti, schede, supporto autisti e parametri mensili. Usa quando l'utente chiede differenze, duplicati o spiegazione del report Cisterna.",
  parameters: {
    type: "object",
    properties: {
      monthKey: { type: "string" },
      includeRows: { type: "boolean" },
      focus: { type: "string", enum: ["duplicati", "litri", "costi", "aziende", "tutti"] },
    },
    required: ["monthKey"],
    additionalProperties: false,
  },
  outputKindHint: "card",
  timeoutMs: 35000,
  async run(input) {
    const monthKey = text(input.monthKey);
    if (!monthKey) throw new Error("Month key Cisterna mancante.");
    const snapshot = await readNextCisternaSnapshot(monthKey);
    const notes = [...snapshot.report.notes, ...snapshot.derivationNotes, ...snapshot.limitations];
    const differences = [
      snapshot.report.deltaLitriSupporto !== null && snapshot.report.deltaLitriSupporto !== 0 ? { type: "litri", delta: snapshot.report.deltaLitriSupporto } : null,
      snapshot.report.costi.missingTotalCount > 0 ? { type: "costi", missingTotalCount: snapshot.report.costi.missingTotalCount } : null,
      snapshot.report.costi.mixedCurrency ? { type: "costi", mixedCurrency: true } : null,
    ].filter(Boolean);
    const duplicateGroups = norm(input.focus) === "litri" || norm(input.focus) === "costi" ? [] : snapshot.archive.duplicateGroups;
    const details = input.includeRows ? await Promise.all(snapshot.archive.schede.slice(0, DETAIL_LIMIT).map((item) => readNextCisternaSchedaDetail(item.id))) : [];
    const detailRows = snapshot.report.detailRows.map(formatRecordDate);
    const shown = Math.min(detailRows.length, ROW_LIMIT);
    const truncation = buildTruncationMeta(detailRows.length, shown, "righe riconciliazione cisterna");
    return {
      monthKey: snapshot.monthKey,
      monthLabel: snapshot.monthLabel,
      snapshot: {
        counts: snapshot.counts,
        quality: snapshot.quality,
        report: {
          sourceTruthLabel: snapshot.report.sourceTruthLabel,
          litriTotaliMese: snapshot.report.litriTotaliMese,
          litriDocumentiMese: snapshot.report.litriDocumentiMese,
          litriSupportoMese: snapshot.report.litriSupportoMese,
          deltaLitriSupporto: snapshot.report.deltaLitriSupporto,
          costi: snapshot.report.costi,
          ripartizioneAzienda: snapshot.report.ripartizioneAzienda,
          perTarga: snapshot.report.perTarga.slice(0, ROW_LIMIT),
          detailRows: detailRows.slice(0, ROW_LIMIT),
          detailRowsTotal: detailRows.length,
        },
        archive: {
          documents: snapshot.archive.documents.slice(0, ROW_LIMIT).map(formatRecordDate),
          documentsTotal: snapshot.archive.documents.length,
          supportRefuels: snapshot.archive.supportRefuels.slice(0, ROW_LIMIT).map(formatRecordDate),
          supportRefuelsTotal: snapshot.archive.supportRefuels.length,
          schede: snapshot.archive.schede.slice(0, ROW_LIMIT).map(formatRecordDate),
          schedeTotal: snapshot.archive.schede.length,
        },
      },
      reconciliation: {
        differences: differences.map(compactDifference),
        duplicateGroups: duplicateGroups.slice(0, ROW_LIMIT).map(compactDuplicateGroup),
        duplicateGroupsTotal: duplicateGroups.length,
        notes: notes.slice(0, 10),
        schedeDetails: details.filter(Boolean).map(compactDetail),
      },
      items: detailRows.slice(0, ROW_LIMIT),
      total: detailRows.length,
      ...truncation,
      notices: truncationNotice(truncation),
    };
  },
};

export default toolReconcileCisternaMonth;
