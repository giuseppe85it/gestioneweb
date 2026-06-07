import { readNextDossierMezzoCompositeSnapshot } from "../../../domain/nextDossierMezzoDomain";
import { readNextMezzoManutenzioniSnapshot } from "../../../domain/nextManutenzioniDomain";
import { readNextMezzoRifornimentiSnapshot } from "../../../domain/nextRifornimentiDomain";
import { readNextMezzoSegnalazioniControlliSnapshot } from "../../../domain/nextSegnalazioniControlliDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { targa?: unknown; periodo?: { from?: unknown; to?: unknown }; includeDocuments?: unknown; includeOperationalEvents?: unknown; limit?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function plate(value: unknown): string { return text(value).toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}
function rec(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function eventTs(value: unknown): number | null {
  const r = rec(value);
  return ts(r.data ?? r.dateLabel ?? r.dataDocumento ?? r.createdAt ?? r.updatedAt ?? r.timestamp ?? r.timestampInserimento ?? r.sortTimestamp);
}
function shortText(value: unknown, max = 90): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}
function title(value: unknown): string { const r = rec(value); return shortText(r.descrizione ?? r.title ?? r.titolo ?? r.materiale ?? r.tipo) || "Evento"; }
function limit(value: unknown): number { return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 25) : 25; }
function eventId(value: unknown, type: string, source: string, index: number): string {
  const r = rec(value);
  const direct = text(r._id ?? r.id ?? r.sourceDocId ?? r.sourceRecordId ?? r.sourceMaintenanceId ?? r.sourceDocumentId);
  if (direct) return text(r.sourceKey ?? r.sourceDataset) ? `${text(r.sourceKey ?? r.sourceDataset)}:${direct}` : direct;
  const timestamp = eventTs(value) ?? "senza-data";
  const targa = plate(r.targa ?? r.mezzoTarga ?? r.targaCamion) || "SENZA_TARGA";
  return `${source}:${type}:${targa}:${timestamp}:${index + 1}`;
}

export const toolGetVehicleTimeline360: ChatIaToolHandler<Input> = {
  name: "get_vehicle_timeline_360",
  descriptionForOpenAi:
    "Costruisce una timeline 360 del mezzo usando dossier, manutenzioni, rifornimenti, documenti e segnali operativi. Usa quando l'utente chiede storia completa di una targa.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      includeDocuments: { type: "boolean" },
      includeOperationalEvents: { type: "boolean" },
      limit: { type: "number" },
    },
    required: ["targa"],
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const targa = plate(cleanTextFilter(input.targa));
    if (!targa) throw new Error("Targa mezzo mancante o non valida.");
    const includeDocuments = input.includeDocuments !== false;
    const includeOperationalEvents = input.includeOperationalEvents !== false;
    const [dossier, manutenzioni, rifornimenti, eventi] = await Promise.all([
      readNextDossierMezzoCompositeSnapshot(targa),
      readNextMezzoManutenzioniSnapshot(targa),
      readNextMezzoRifornimentiSnapshot(targa),
      readNextMezzoSegnalazioniControlliSnapshot(targa),
    ]);
    const docs = includeDocuments ? dossier?.documentCosts.snapshot?.items ?? [] : [];
    const materials = dossier?.materialiMovimenti.snapshot?.items ?? [];
    const operationalEvents = includeOperationalEvents ? eventi.timelineItems ?? [] : [];
    const rawRows = [
      ...manutenzioni.historyItems.map((raw) => ({ type: "manutenzione", source: "manutenzioni", raw })),
      ...rifornimenti.items.map((raw) => ({ type: "rifornimento", source: "rifornimenti", raw })),
      ...materials.map((raw) => ({ type: "materiale", source: "materiali", raw })),
      ...docs.map((raw) => ({ type: "documento", source: "documenti", raw })),
      ...operationalEvents.map((raw) => ({ type: "evento operativo", source: "eventi", raw })),
    ];
    const periodFilter = cleanPeriodFilter(input.periodo);
    const from = ts(periodFilter?.from), to = ts(periodFilter?.to, true);
    const requestedLimit = limit(input.limit);
    const timeline = rawRows.map((row, index) => {
      const raw = rec(row.raw);
      const timestamp = eventTs(row.raw);
      return {
        _id: eventId(row.raw, row.type, row.source, index),
        timestamp,
        data: formatItalianDate(raw.data ?? raw.dateLabel ?? raw.dataDocumento ?? timestamp),
        tipo: row.type,
        stato: text(raw.stato) || null,
        titolo: title(row.raw),
        source: row.source,
      };
    })
      .filter((row) => (from === null || (row.timestamp !== null && row.timestamp >= from)) && (to === null || (row.timestamp !== null && row.timestamp <= to)))
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    const warnings = dossier ? [
      ...dossier.overview.technicalLimitations,
      ...dossier.overview.refuelLimitations,
      ...dossier.overview.documentCostLimitations,
      ...dossier.overview.analysisLimitations,
      ...dossier.overview.procurementLimitations,
    ] : ["Dossier mezzo non disponibile."];
    const shown = Math.min(timeline.length, requestedLimit);
    const truncation = buildTruncationMeta(timeline.length, shown, "eventi timeline");
    const items = timeline.slice(0, requestedLimit).map((item) => ({
      _id: item._id,
      id: item._id,
      data: item.data,
      tipo: item.tipo,
      stato: item.stato,
      titolo: item.titolo,
      source: item.source,
    }));
    return {
      targa,
      timeline: items,
      items,
      total: timeline.length,
      ...truncation,
      sources: ["dossier", "manutenzioni", "rifornimenti", "materiali", "documenti", "eventi"],
      warnings: warnings.slice(0, 5),
      notices: truncationNotice(truncation),
    };
  },
};

export default toolGetVehicleTimeline360;
