import {
  readNextManutenzioniDaFareAndProgrammataGlobalSnapshot,
  readNextManutenzioniLegacyDataset,
} from "../../../domain/nextManutenzioniDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice, type CleanPeriodFilter } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { targa?: unknown; stato?: unknown; urgenza?: unknown; testo?: unknown; periodo?: { from?: unknown; to?: unknown }; limit?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase(); }
function plate(value: unknown): string { return text(value).toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function limit(value: unknown): number { return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 25) : 25; }
function rec(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function toTimestamp(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function inPeriod(item: Record<string, unknown>, period: CleanPeriodFilter | null): boolean {
  const from = toTimestamp(period?.from);
  const to = toTimestamp(period?.to, true);
  if (from === null && to === null) return true;
  const time =
    toTimestamp(item.dataEsecuzione ?? item.dataInserimento ?? item.data ?? item.timestampEsecuzione ?? item.timestampInserimento);
  if (time === null) return false;
  return (from === null || time >= from) && (to === null || time <= to);
}

function shortText(value: unknown, max = 90): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function formatWorkOrderItem(item: Record<string, unknown>): Record<string, unknown> {
  const dataEsecuzione = item.dataEsecuzione ?? item.data;
  const dataInserimento = item.dataInserimento;
  const id = text(item.id ?? item.sourceId) || null;
  return {
    _id: id ?? "",
    id,
    targa: text(item.targa ?? item.mezzoTarga) || null,
    stato: text(item.statoVista ?? item.stato) || null,
    urgenza: text(item.urgenza) || null,
    tipo: text(item.tipo ?? item.categoria) || null,
    descrizione_breve: shortText(item.descrizione ?? item.dettagli ?? item.titolo),
    assegnato_a: shortText(item.autista ?? item.autistaNome ?? item.operatore, 60),
    data_italiana: formatItalianDate(dataEsecuzione ?? dataInserimento ?? item.timestampEsecuzione ?? item.timestampInserimento),
    dataEsecuzione_italiana: formatItalianDate(dataEsecuzione ?? item.timestampEsecuzione),
    dataInserimento_italiana: formatItalianDate(dataInserimento ?? item.timestampInserimento),
  };
}

export const toolSearchWorkOrders: ChatIaToolHandler<Input> = {
  name: "search_work_orders",
  descriptionForOpenAi:
    "Cerca manutenzioni operative da fare, programmate, eseguite o chiuse da evento su tutta la flotta per targa, stato, urgenza o testo. Usa anche quando l'utente chiede ordini tecnici, backlog, interventi pendenti, attivita chiuse o officina, con periodo come 'aprile 2026'.",
  parameters: {
    type: "object",
    properties: {
      targa: { type: "string" },
      stato: { type: "string", enum: ["da_eseguire", "in_attesa", "programmata", "eseguito", "chiuso_da_evento", "tutti"] },
      urgenza: { type: "string", enum: ["bassa", "media", "alta"] },
      testo: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "table",
  async run(input) {
    const [aperte, tutte] = await Promise.all([
      readNextManutenzioniDaFareAndProgrammataGlobalSnapshot(),
      readNextManutenzioniLegacyDataset(),
    ]);
    const eseguite = tutte.filter((item) => item.stato === "eseguita");
    const chiuseDaEvento = tutte.filter((item) => item.stato === "chiusa_da_evento");
    const rows = [
      ...aperte.map((item) => ({
        ...item,
        recordKind: "manutenzione",
        statoVista: item.stato === "programmata" ? "programmata" : "in_attesa",
      })),
      ...eseguite.map((item) => ({
        ...item,
        recordKind: "manutenzione",
        statoVista: "eseguito",
      })),
      ...chiuseDaEvento.map((item) => ({
        ...item,
        recordKind: "manutenzione",
        statoVista: "chiuso_da_evento",
      })),
    ];
    const periodFilter = cleanPeriodFilter(input.periodo);
    const targa = plate(cleanTextFilter(input.targa)), stato = norm(cleanTextFilter(input.stato)) || "tutti", urgenza = norm(cleanTextFilter(input.urgenza)), testo = norm(cleanTextFilter(input.testo));
    const requestedLimit = limit(input.limit);
    const items = rows.filter((item) => {
      const itemRecord = item as Record<string, unknown>;
      const statoVista = String(item.statoVista ?? "");
      const statoMatch =
        stato === "tutti" ||
        (stato === "da_eseguire" && (statoVista === "in_attesa" || statoVista === "programmata")) ||
        (stato === "in_attesa" && statoVista === "in_attesa") ||
        statoVista === stato;
      const itemTarga = plate(`${item.targa ?? ""} ${itemRecord.mezzoTarga ?? ""}`);
      return statoMatch && (!targa || Boolean(itemTarga && (itemTarga.includes(targa) || targa.includes(itemTarga)))) &&
        (!urgenza || String(itemRecord.urgenza ?? "") === urgenza) && (!testo || norm(`${item.descrizione ?? ""} ${itemRecord.dettagli ?? ""}`).includes(testo)) &&
        inPeriod(item, periodFilter);
    });
    const shown = Math.min(items.length, requestedLimit);
    const truncation = buildTruncationMeta(items.length, shown, "manutenzioni");
    return {
      items: items.slice(0, requestedLimit).map((item) => formatWorkOrderItem(rec(item))),
      total: items.length,
      ...truncation,
      groups: [
        { stato: "in_attesa", count: rows.filter((row) => row.statoVista === "in_attesa").length },
        { stato: "programmata", count: rows.filter((row) => row.statoVista === "programmata").length },
        { stato: "eseguito", count: rows.filter((row) => row.statoVista === "eseguito").length },
        { stato: "chiuso_da_evento", count: rows.filter((row) => row.statoVista === "chiuso_da_evento").length },
      ],
      appliedFilters: { targa, stato, urgenza, testo, periodo: periodFilter },
      notices: truncationNotice(truncation),
    };
  },
};

export default toolSearchWorkOrders;
