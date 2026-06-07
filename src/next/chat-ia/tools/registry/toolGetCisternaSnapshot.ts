import { readNextCisternaSnapshot } from "../../../domain/nextCisternaDomain";
import { formatItalianDate } from "../chatIaToolDates";
import { buildTruncationMeta, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type GetCisternaSnapshotInput = { monthKey?: unknown };
const ROW_LIMIT = 12;

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function formatRecordDate<T extends Record<string, unknown>>(value: T): T & { data_italiana: string } {
  const item = rec(value);
  return {
    _id: text(item._id ?? item.id) ?? "",
    ...value,
    data_italiana: formatItalianDate(item.dataDocumento ?? item.data ?? item.dateLabel ?? item.timestamp),
  };
}

function compactPerTarga(value: unknown): Record<string, unknown> {
  const item = rec(value);
  const targa = text(item.targa) ?? "SENZA_TARGA";
  return {
    _id: `cisterna:targa:${targa}`,
    targa,
    azienda: item.aziendaLabel ?? null,
    litri: item.litri ?? null,
    costo_stimato_valuta: item.costoStimatoValuta ?? null,
    costo_stimato_chf: item.costoStimatoChf ?? null,
  };
}

function compactDetailRow(value: unknown): Record<string, unknown> {
  const item = rec(value);
  const id = text(item.id) ?? `cisterna:dettaglio:${item.data ?? "senza-data"}:${item.targa ?? "senza-targa"}`;
  return {
    _id: id,
    id,
    data: item.data ?? null,
    targa: item.targa ?? null,
    litri: item.litri ?? null,
    autista: item.autista ?? item.nome ?? null,
    azienda: item.aziendaLabel ?? null,
    support_status: item.supportStatus ?? null,
    diff: item.diff ?? null,
  };
}

export const toolGetCisternaSnapshot: ChatIaToolHandler<GetCisternaSnapshotInput> = {
  name: "get_cisterna_snapshot",
  descriptionForOpenAi:
    "Recupera snapshot Cisterna con documenti, schede, supporto autisti e parametri mensili. Usa quando l'utente chiede situazione Cisterna Caravate.",
  parameters: {
    type: "object",
    properties: { monthKey: { type: "string", description: "Mese YYYY-MM opzionale." } },
    additionalProperties: false,
  },
  outputKindHint: "card",
  async run(input) {
    const snapshot = await readNextCisternaSnapshot(text(input.monthKey));
    const perTarga = snapshot.report.perTarga.map(compactPerTarga);
    const detailRows = snapshot.report.detailRows.map(compactDetailRow);
    const shown = Math.min(detailRows.length, ROW_LIMIT);
    const truncation = buildTruncationMeta(detailRows.length, shown, "righe dettaglio cisterna");
    const items = detailRows.slice(0, ROW_LIMIT);
    return {
      monthKey: snapshot.monthKey,
      monthLabel: snapshot.monthLabel,
      quality: snapshot.quality,
      counts: snapshot.counts,
      report: {
        sourceTruth: snapshot.report.sourceTruth,
        sourceTruthLabel: snapshot.report.sourceTruthLabel,
        hasManualTruth: snapshot.report.hasManualTruth,
        litriTotaliMese: snapshot.report.litriTotaliMese,
        litriDocumentiMese: snapshot.report.litriDocumentiMese,
        litriSupportoMese: snapshot.report.litriSupportoMese,
        deltaLitriSupporto: snapshot.report.deltaLitriSupporto,
        cambioEurChf: snapshot.report.cambioEurChf,
        costi: snapshot.report.costi,
        ripartizioneAzienda: snapshot.report.ripartizioneAzienda,
        perTarga: perTarga.slice(0, ROW_LIMIT),
        perTargaTotal: perTarga.length,
        detailRows: items,
        detailRowsTotal: detailRows.length,
        notes: snapshot.report.notes.slice(0, 8),
      },
      archive: {
        documents: snapshot.archive.documents.slice(0, ROW_LIMIT).map(formatRecordDate),
        documentsTotal: snapshot.archive.documents.length,
        supportRefuels: snapshot.archive.supportRefuels.slice(0, ROW_LIMIT).map(formatRecordDate),
        supportRefuelsTotal: snapshot.archive.supportRefuels.length,
        schede: snapshot.archive.schede.slice(0, ROW_LIMIT).map(formatRecordDate),
        schedeTotal: snapshot.archive.schede.length,
        duplicateGroupsTotal: snapshot.archive.duplicateGroups.length,
      },
      items,
      total: detailRows.length,
      ...truncation,
      derivationNotes: snapshot.derivationNotes.slice(0, 5),
      limitations: snapshot.limitations.slice(0, 8),
      notices: truncationNotice(truncation),
    };
  },
};
