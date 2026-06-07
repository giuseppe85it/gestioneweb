import { readNextAutistiReadOnlySnapshot } from "../../../domain/nextAutistiDomain";
import { readNextCentroControlloSnapshot } from "../../../domain/nextCentroControlloDomain";
import { readNextColleghiSnapshot } from "../../../domain/nextColleghiDomain";
import { formatItalianDate, parseChatIaToolDate } from "../chatIaToolDates";
import { buildTruncationMeta, cleanPeriodFilter, cleanTextFilter, truncationNotice } from "../chatIaToolFilters";
import type { ChatIaToolHandler } from "../chatIaToolTypes";

type Input = { nome?: unknown; badge?: unknown; periodo?: { from?: unknown; to?: unknown }; limit?: unknown };

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function norm(value: unknown): string { return text(value).toLowerCase().replace(/\s+/g, " ").trim(); }
function compact(value: unknown): string { return norm(value).replace(/[^a-z0-9]/g, ""); }
function ts(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}
function rec(value: unknown): Record<string, unknown> { return value && typeof value === "object" ? value as Record<string, unknown> : {}; }
function eventTs(value: unknown): number | null { const r = rec(value); return ts(r.data ?? r.dateLabel ?? r.timestamp ?? r.eventTs ?? r.ts); }
function recordId(value: unknown, fallback: string): string {
  const r = rec(value);
  const id = text(r._id ?? r.id ?? r.sourceDocId ?? r.sourceRecordId ?? r.recordId);
  return id || fallback;
}

function shortText(value: unknown, max = 90): string | null {
  const valueText = text(value).replace(/\s+/g, " ");
  if (!valueText) return null;
  return valueText.length > max ? `${valueText.slice(0, max - 3)}...` : valueText;
}

function limit(value: unknown): number {
  return typeof value === "number" && value > 0 ? Math.min(Math.floor(value), 25) : 25;
}

function nameTokens(value: string): string[] {
  return value.split(" ").map(compact).filter(Boolean);
}

function containsAllNameTokens(haystack: string, tokens: string[]): boolean {
  return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
}

function formatActivity(value: unknown, index = 0): Record<string, unknown> {
  const r = rec(value);
  const id = recordId(value, `attivita-autista:${eventTs(value) ?? "senza-data"}:${index + 1}`);
  return {
    _id: id,
    id: text(r.id ?? r.sourceDocId ?? r.sourceRecordId) || id,
    tipo: r.tipo ?? r.type ?? r.eventType ?? r.recordType ?? null,
    targa: r.targa ?? r.mezzoTarga ?? null,
    titolo: shortText(r.titolo ?? r.title ?? r.descrizione),
    descrizione_breve: shortText(r.descrizione ?? r.note ?? r.messaggio),
    data_italiana: formatItalianDate(r.data ?? r.dateLabel ?? eventTs(value)),
  };
}

export const toolGetDriverOperationalProfile: ChatIaToolHandler<Input> = {
  name: "get_driver_operational_profile",
  descriptionForOpenAi:
    "Crea un profilo operativo autista unendo anagrafica, sessioni, eventi, segnalazioni, controlli e mezzi collegati. Usa quando l'utente chiede quadro completo di un autista.",
  parameters: {
    type: "object",
    properties: {
      nome: { type: "string" },
      badge: { type: "string" },
      periodo: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, additionalProperties: false },
      limit: { type: "number" },
    },
    additionalProperties: false,
  },
  outputKindHint: "card",
  async run(input) {
    const nome = norm(cleanTextFilter(input.nome)), badge = norm(cleanTextFilter(input.badge));
    if (!nome && !badge) throw new Error("Nome o badge autista obbligatorio.");
    const periodFilter = cleanPeriodFilter(input.periodo);
    const requestedLimit = limit(input.limit);
    const [colleghi, autisti, centro] = await Promise.all([readNextColleghiSnapshot(), readNextAutistiReadOnlySnapshot(), readNextCentroControlloSnapshot()]);
    const requestedNameTokens = nameTokens(nome);
    const requestedBadge = compact(badge);
    const driver = colleghi.items.find((item) => {
      const driverHaystack = compact(JSON.stringify(item));
      const driverName = norm(item.nome);
      const driverNameCompact = compact(driverName);
      const driverBadge = compact(item.badge);
      const matchesName = !nome || driverName.includes(nome) || driverNameCompact.includes(compact(nome)) || containsAllNameTokens(driverHaystack, requestedNameTokens);
      const matchesBadge = !requestedBadge || driverBadge.includes(requestedBadge) || driverHaystack.includes(requestedBadge);
      return matchesName && matchesBadge;
    }) ?? null;
    const driverRecord = rec(driver);
    const driverBadge = compact(driverRecord.badge);
    const activityBadges = Array.from(new Set([requestedBadge, driverBadge].filter(Boolean)));
    const rows = [...autisti.assignments, ...autisti.signals, ...autisti.segnalazioniRows, ...autisti.controlliRows, ...autisti.richiesteRows, ...centro.sessioni, ...centro.eventiStorici, ...centro.alerts, ...centro.focusItems];
    const from = ts(periodFilter?.from), to = ts(periodFilter?.to, true);
    const activities = rows.filter((row) => {
      const haystack = compact(JSON.stringify(row)), time = eventTs(row);
      const matchesName = !nome || haystack.includes(compact(nome)) || containsAllNameTokens(haystack, requestedNameTokens);
      const matchesBadge = activityBadges.length === 0 || activityBadges.some((item) => haystack.includes(item));
      const matchesIdentity = nome && activityBadges.length > 0 ? matchesName || matchesBadge : matchesName && matchesBadge;
      return matchesIdentity &&
        (from === null || (time !== null && time >= from)) && (to === null || (time !== null && time <= to));
    }).sort((left, right) => (eventTs(right) ?? 0) - (eventTs(left) ?? 0));
    const vehicles = Array.from(new Set(activities.flatMap((row) => {
      const r = rec(row);
      return [r.mezzoTarga, r.targa, r.targaMotrice, r.targaRimorchio].map(text).filter(Boolean);
    })));
    const shown = Math.min(activities.length, requestedLimit);
    const truncation = buildTruncationMeta(activities.length, shown, "attivita autista");
    const formattedActivities = activities.slice(0, requestedLimit).map(formatActivity);
    return {
      driver: driver ? { _id: recordId(driver, `autista:${driverBadge || compact(driverRecord.nome)}`), nome: driverRecord.nome, badge: driverRecord.badge } : null,
      activities: formattedActivities,
      items: formattedActivities,
      total: activities.length,
      ...truncation,
      vehicles,
      appliedFilters: { nome: nome || null, badge: requestedBadge || null, periodo: periodFilter },
      warnings: [...colleghi.limitations, ...autisti.limitations, ...centro.limitations].slice(0, 5),
      notices: truncationNotice(truncation),
    };
  },
};

export default toolGetDriverOperationalProfile;
