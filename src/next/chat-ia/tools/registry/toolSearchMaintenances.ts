import { readNextManutenzioniLegacyDataset } from "../../../domain/nextManutenzioniDomain";
import { readNextAnagraficheFlottaSnapshot } from "../../../nextAnagraficheFlottaDomain";
import { formatItalianDate, formatItalianDateFromItalianSource, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice, type CleanPeriodFilter } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type PeriodInput = { from?: unknown; to?: unknown };
type Input = {
  targa?: unknown;
  stato?: unknown;
  periodo?: PeriodInput;
  testo?: unknown;
  limit?: unknown;
};
type MaintenanceStatus = "effettuata" | "programmata" | "in_corso" | "tutte";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function norm(value: unknown): string {
  return text(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function plate(value: unknown): string {
  return text(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 5) : 5;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function dateMs(value: unknown, endOfDay = false): number | null {
  const date = parseChatIaToolDate(value);
  if (!date) return null;
  const normalized = new Date(date);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function inPeriod(value: unknown, period: CleanPeriodFilter | null): boolean {
  const from = dateMs(period?.from);
  const to = dateMs(period?.to, true);
  if (from === null && to === null) return true;
  const current = dateMs(value);
  if (current === null) return false;
  return (from === null || current >= from) && (to === null || current <= to);
}

function status(value: unknown): MaintenanceStatus {
  const valueNorm = norm(value);
  if (valueNorm === "programmata" || valueNorm === "programmate") return "programmata";
  if (valueNorm === "in_corso" || valueNorm === "in corso") return "in_corso";
  if (valueNorm === "tutte" || valueNorm === "tutti") return "tutte";
  if (valueNorm === "effettuata" || valueNorm === "effettuate" || valueNorm === "eseguita" || valueNorm === "eseguite") return "effettuata";
  return "tutte";
}

function matchesPlate(value: unknown, query: string): boolean {
  const normalized = plate(value);
  return Boolean(!query || (normalized && (normalized.includes(query) || query.includes(normalized))));
}

function matchesText(row: Record<string, unknown>, query: string): boolean {
  if (!query) return true;
  return norm(`${row.tipo ?? ""} ${row.sottotipo ?? ""} ${row.descrizione ?? ""} ${row.fornitore ?? ""}`).includes(query);
}

function historicalStatus(value: unknown): "effettuata" | "in_corso" {
  const raw = norm(value);
  if (raw.includes("in corso") || raw.includes("aperta") || raw === "false" || raw === "no") return "in_corso";
  return "effettuata";
}

function shortText(value: unknown, max = 56): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function formatHistoricalMaintenance(item: Record<string, unknown>): Record<string, unknown> {
  const stato = historicalStatus(item.eseguito);
  const materiali = Array.isArray(item.materiali) ? item.materiali.length : 0;
  const id = text(item.id) || null;
  return {
    _id: id ?? "",
    id,
    targa: plate(item.targa),
    stato,
    tipo: text(item.tipo) || null,
    sottotipo: text(item.sottotipo) || null,
    descrizione: text(item.descrizione) || null,
    fornitore: text(item.fornitore) || null,
    km: asNumber(item.km),
    ore: asNumber(item.ore),
    importo: asNumber(item.importo),
    valuta: text(item.sourceDocumentCurrency) || null,
    materiali_count: materiali,
    data_italiana: formatItalianDate(item.data),
    data_raw: text(item.data) || null,
    source: "storico_manutenzione",
  };
}

function formatScheduledMaintenance(mezzo: {
  id: string;
  targa: string;
  categoria: string;
  marcaModello: string;
  manutenzioneDataInizio: string;
  manutenzioneDataFine: string;
  manutenzioneKmMax: string;
  manutenzioneContratto: string;
}): Record<string, unknown> {
  const id = mezzo.id || null;
  return {
    _id: id ?? `targa:${plate(mezzo.targa)}`,
    id,
    targa: plate(mezzo.targa),
    stato: "programmata",
    tipo: "mezzo",
    sottotipo: null,
    descrizione: mezzo.manutenzioneContratto || "Manutenzione programmata",
    fornitore: null,
    categoria: mezzo.categoria || null,
    marca_modello: mezzo.marcaModello || null,
    km_massimi: mezzo.manutenzioneKmMax || null,
    data_inizio_italiana: formatItalianDateFromItalianSource(mezzo.manutenzioneDataInizio),
    data_italiana: formatItalianDateFromItalianSource(mezzo.manutenzioneDataFine),
    data_raw: mezzo.manutenzioneDataFine || null,
    source: "pianificazione_mezzo",
  };
}

function compactMaintenanceItem(row: Record<string, unknown>): Record<string, unknown> {
  const id = text(row._id ?? row.id) || null;
  return {
    _id: id ?? "",
    id: text(row.id) || null,
    targa: text(row.targa) || null,
    data: text(row.data_italiana) || null,
    stato: text(row.stato) || null,
    tipo: text(row.tipo) || null,
    descrizione_breve: shortText(row.descrizione),
    fornitore: shortText(row.fornitore, 40),
    costo: asNumber(row.importo),
  };
}

export const toolSearchMaintenances: ChatIaToolHandler<Input> = {
  name: "search_maintenances",
  descriptionForOpenAi:
    "Cerca manutenzioni effettuate o programmate sulla flotta, con filtro opzionale per targa, periodo o stato. Usa quando l'utente chiede 'manutenzioni del mese', 'manutenzioni effettuate', 'storico manutenzioni flotta' o 'manutenzioni programmate del periodo'. Per ordini tecnici da eseguire usa search_work_orders.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      stato: { type: "string", enum: ["programmata", "effettuata", "in_corso", "tutte"] },
      periodo: {
        type: "object",
        properties: { from: { type: "string" }, to: { type: "string" } },
        additionalProperties: false,
      },
      testo: { type: "string" },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const periodFilter = cleanPeriodFilter(input.periodo);
    const requestedStatus = status(cleanTextFilter(input.stato));
    const requestedPlate = plate(cleanTextFilter(input.targa));
    const requestedText = norm(cleanTextFilter(input.testo));
    const requestedLimit = limit(input.limit);

    const [storico, flotta] = await Promise.all([
      readNextManutenzioniLegacyDataset(),
      readNextAnagraficheFlottaSnapshot(),
    ]);

    const historicalRows = requestedStatus === "programmata"
      ? []
      : storico
          .map((item) => formatHistoricalMaintenance(item as Record<string, unknown>))
          .filter((row) => requestedStatus === "tutte" || row.stato === requestedStatus);

    const scheduledRows = requestedStatus === "effettuata" || requestedStatus === "in_corso"
      ? []
      : flotta.items
          .filter((mezzo) => mezzo.manutenzioneProgrammata)
          .map(formatScheduledMaintenance);

    const rows = [...historicalRows, ...scheduledRows]
      .filter((row) => matchesPlate(row.targa, requestedPlate))
      .filter((row) => matchesText(row, requestedText))
      .filter((row) => inPeriod(row.data_raw, periodFilter))
      .sort((left, right) => (dateMs(right.data_raw) ?? 0) - (dateMs(left.data_raw) ?? 0));
    const shown = Math.min(rows.length, requestedLimit);
    const truncation = buildTruncationMeta(rows.length, shown, "manutenzioni");

    return {
      items: rows.slice(0, requestedLimit).map(compactMaintenanceItem),
      total: rows.length,
      ...truncation,
      counts: {
        effettuate: rows.filter((row) => row.stato === "effettuata").length,
        programmate: rows.filter((row) => row.stato === "programmata").length,
        in_corso: rows.filter((row) => row.stato === "in_corso").length,
      },
      appliedFilters: {
        targa: requestedPlate || null,
        stato: requestedStatus,
        periodo: periodFilter,
        testo: requestedText || null,
      },
      notices: truncationNotice(truncation),
    };
  },
};

export default toolSearchMaintenances;
