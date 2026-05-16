import { executeToolCall } from "../tools/chatIaToolExecutor";
import type { ChatIaAssistantFinalMessage } from "../core/chatIaTypes";
import { readNextAttrezzatureCantieriSnapshot } from "../../domain/nextAttrezzatureCantieriDomain";
import { readNextRifornimentiReadOnlySnapshot } from "../../domain/nextRifornimentiDomain";
import { toDisplay } from "../../helpers/dateUnica";
import { parseChatIaToolDate } from "../tools/chatIaToolDates";
import type { ChatIaToolCall, ChatIaToolResult } from "../tools/chatIaToolTypes";
import { analyzeMultiAgentResults } from "./analytics";
import { chatIaSpecialistAgents } from "./specialists";
import type {
  ChatIaAgent,
  ChatIaAgentCall,
  ChatIaAgentKind,
  ChatIaAgentResult,
  ChatIaArguteQuestionId,
  ChatIaOrchestratorPlan,
} from "./types";
import { buildVisualizationMessage } from "./visualization";

type MultiAgentContext = {
  requestId: string;
  sessionId: string;
  nowIso: string;
};

type FleetVehicle = {
  _id: string;
  targa: string;
  categoria: string | null;
  autista: string | null;
};

type DatePeriod = { from: string; to: string };

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ serializationError: true });
  }
}

function logAgent(event: string, payload: Record<string, unknown>): void {
  console.log("[chat-ia-agent]", safeJson({ ts: new Date().toISOString(), event, ...payload }));
}

function normalizePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function identifyArguteQuestion(prompt: string): ChatIaArguteQuestionId | null {
  const normalized = normalizePrompt(prompt);
  if (normalized.includes("consumato di piu") && normalized.includes("ultimi 2 mesi")) return "D1";
  if (normalized.includes("ultima manutenzione") && normalized.includes("questo mese")) return "D2";
  if (normalized.includes("log di accesso")) return "D3";
  if (normalized.includes("segnalazioni") && normalized.includes("anomalia")) return "D4";
  if (normalized.includes("rifornimenti degli ultimi 4 mesi") && normalized.includes("comparazione di autisti")) return "D5";
  if (normalized.includes("stessa categoria") && normalized.includes("costi totali molto diversi")) return "D6";
  if (normalized.includes("autista percorre piu km al mese")) return "D7";
  if (normalized.includes("per ogni cantiere") && normalized.includes("attrezzature")) return "D8";
  if (normalized.includes("manutenzioni") && normalized.includes("report")) return "D9";
  return null;
}

function formatDate(value: Date): string {
  return toDisplay(value) || "";
}

function periodLastMonths(nowIso: string, months: number): DatePeriod {
  const now = new Date(nowIso);
  const from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  return { from: formatDate(from), to: formatDate(now) };
}

function periodCurrentMonth(nowIso: string): DatePeriod {
  const now = new Date(nowIso);
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: formatDate(from), to: formatDate(now) };
}

function periodLastThirtyDays(nowIso: string): DatePeriod {
  const now = new Date(nowIso);
  const from = new Date(now);
  from.setDate(now.getDate() - 30);
  return { from: formatDate(from), to: formatDate(now) };
}

function toolCall(name: string, argumentsValue: Record<string, unknown>, id: string): ChatIaToolCall {
  return { id, name, arguments: argumentsValue };
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extractPlate(prompt: string): string | null {
  const match = prompt.toUpperCase().match(/\b[A-Z]{2}\s*\d{6}\b/);
  return match ? cleanPlate(match[0]) : null;
}

const MONTHS_IT = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
];

function monthKeyFromPrompt(prompt: string, nowIso: string): string | null {
  const normalized = normalizePrompt(prompt);
  const explicitYear = normalized.match(/\b(20\d{2})\b/);
  const now = new Date(nowIso);
  const year = explicitYear ? Number(explicitYear[1]) : now.getFullYear();
  const monthIndex = MONTHS_IT.findIndex((month) => normalized.includes(month));
  if (monthIndex >= 0) return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  if (normalized.includes("mese scorso")) {
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
  }
  return null;
}

function periodFromMonthKey(monthKey: string): DatePeriod {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${String(month).padStart(2, "0")}-01`,
    to: `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

function makeStyledTable(title: string, rows: Array<Record<string, string | number | null>>): ChatIaAssistantFinalMessage["blocks"][number] {
  return {
    kind: "data_table_styled",
    table: {
      title,
      columns: [
        { key: "c1", label: "Voce", align: "left" },
        { key: "c2", label: "Dato", align: "left" },
        { key: "c3", label: "Dettaglio", align: "left" },
        { key: "c4", label: "Valore", align: "right" },
        { key: "c5", label: "Data", align: "left" },
        { key: "c6", label: "Stato", align: "left" },
      ],
      rows,
      emptyText: "Nessun record verificabile disponibile.",
      accentKey: "c1",
      rowActions: rows.map((row) => ({
        label: "Apri",
        href: null,
        entityKind: "record",
        entityId: String(row._id ?? ""),
      })),
    },
  };
}

function rowsFromDocuments(items: unknown[]): Array<Record<string, string | number | null>> {
  return items.slice(0, 5).map((item, index) => {
    const row = record(item);
    const id = text(row._id ?? row.id) || `documento:${index + 1}`;
    return {
      _id: id,
      c1: text(row.tipo) || "documento",
      c2: text(row.numero) || "-",
      c3: text(row.fornitore) || "-",
      c4: typeof row.importo === "number" ? row.importo : null,
      c5: text(row.data_italiana) || "-",
      c6: row.file_disponibile === true ? "file disponibile" : "-",
      c7: null,
      c8: null,
    };
  });
}

function rowsFromCisternaItems(items: unknown[]): Array<Record<string, string | number | null>> {
  return items.slice(0, 8).map((item, index) => {
    const row = record(item);
    const id = text(row._id ?? row.id) || `cisterna:${index + 1}`;
    return {
      _id: id,
      c1: text(row.targa) || text(row.type) || "cisterna",
      c2: text(row.data) || text(row.data_italiana) || "-",
      c3: text(row.autista) || text(row.azienda) || text(row.support_status) || "-",
      c4: typeof row.litri === "number" ? row.litri : typeof row.delta === "number" ? row.delta : null,
      c5: text(row.support_status) || "-",
      c6: text(row.diff) || "-",
      c7: null,
      c8: null,
    };
  });
}

function rowsFromMaterialMovements(items: unknown[]): Array<Record<string, string | number | null>> {
  return items.slice(0, 8).map((item, index) => {
    const row = record(item);
    const id = text(row._id ?? row.id) || `movimento-materiale:${index + 1}`;
    return {
      _id: id,
      c1: text(row.materiale) || "materiale",
      c2: text(row.targa) || "-",
      c3: text(row.destinatario) || text(row.descrizione_breve) || "-",
      c4: typeof row.quantita === "number" ? row.quantita : null,
      c5: text(row.data_italiana) || "-",
      c6: text(row.unita) || "-",
      c7: null,
      c8: null,
    };
  });
}

async function runDeterministicPromptIfHandled(
  prompt: string,
  context: MultiAgentContext,
): Promise<ChatIaAssistantFinalMessage | null> {
  const normalized = normalizePrompt(prompt);
  const plate = extractPlate(prompt);

  if (plate && (normalized.includes("documenti") || normalized.includes("fatture"))) {
    const result = await executeToolCall(toolCall("search_documents_and_invoices", { targa: plate, limit: 5 }, "det-docs"), {
      requestId: context.requestId,
      sessionId: context.sessionId,
      prompt,
      nowIso: context.nowIso,
    });
    if (!result.ok) return null;
    const data = record(result.data);
    const items = Array.isArray(data.items) ? data.items : [];
    const rows = rowsFromDocuments(items);
    const total = typeof data.total === "number" ? data.total : rows.length;
    return {
      text: `Documenti e fatture per ${plate}: ${total} record trovati.`,
      status: "completed",
      blocks: [makeStyledTable(`Documenti e fatture ${plate}`, rows)],
      entities: [{ kind: "targa", value: plate }],
      sources: [{ label: "Tool documenti e fatture", toolName: "search_documents_and_invoices" }],
      notices: Array.isArray(data.notices) ? data.notices.map(String) : [],
    };
  }

  if (normalized.includes("cisterna") && (normalized.includes("snapshot") || normalized.includes("situazione"))) {
    const monthKey = monthKeyFromPrompt(prompt, context.nowIso);
    const result = await executeToolCall(toolCall("get_cisterna_snapshot", { monthKey }, "det-cisterna-snapshot"), {
      requestId: context.requestId,
      sessionId: context.sessionId,
      prompt,
      nowIso: context.nowIso,
    });
    if (!result.ok) return null;
    const data = record(result.data);
    const report = record(data.report);
    const counts = record(data.counts);
    const items = Array.isArray(data.items) ? data.items : [];
    return {
      text: `Snapshot cisterna ${text(data.monthLabel) || monthKey || ""}: litri totali ${String(report.litriTotaliMese ?? "-")}, schede ${String(counts.schede ?? "-")}, rifornimenti supporto ${String(counts.supportRefuels ?? "-")}.`,
      status: "completed",
      blocks: [makeStyledTable(`Snapshot cisterna ${text(data.monthLabel) || ""}`, rowsFromCisternaItems(items))],
      entities: [{ kind: "cisterna", value: text(data.monthKey) || monthKey || "cisterna" }],
      sources: [{ label: "Tool snapshot cisterna", toolName: "get_cisterna_snapshot" }],
      notices: Array.isArray(data.notices) ? data.notices.map(String) : [],
    };
  }

  if (normalized.includes("cisterna") && normalized.includes("riconcil")) {
    const monthKey = monthKeyFromPrompt(prompt, context.nowIso);
    if (!monthKey) return null;
    const result = await executeToolCall(toolCall("reconcile_cisterna_month", { monthKey, focus: "tutti" }, "det-cisterna-reconcile"), {
      requestId: context.requestId,
      sessionId: context.sessionId,
      prompt,
      nowIso: context.nowIso,
    });
    if (!result.ok) return null;
    const data = record(result.data);
    const snapshot = record(data.snapshot);
    const report = record(snapshot.report);
    const reconciliation = record(data.reconciliation);
    const differences = Array.isArray(reconciliation.differences) ? reconciliation.differences : [];
    const items = differences.length > 0 ? differences : Array.isArray(data.items) ? data.items : [];
    return {
      text: `Riconciliazione cisterna ${text(data.monthLabel) || monthKey}: litri totali ${String(report.litriTotaliMese ?? "-")}, litri documenti ${String(report.litriDocumentiMese ?? "-")}, litri supporto ${String(report.litriSupportoMese ?? "-")}.`,
      status: "completed",
      blocks: [makeStyledTable(`Riconciliazione cisterna ${text(data.monthLabel) || ""}`, rowsFromCisternaItems(items))],
      entities: [{ kind: "cisterna", value: text(data.monthKey) || monthKey }],
      sources: [{ label: "Tool riconciliazione cisterna", toolName: "reconcile_cisterna_month" }],
      notices: Array.isArray(data.notices) ? data.notices.map(String) : [],
    };
  }

  if (normalized.includes("movimenti materiali") || (normalized.includes("movimenti") && normalized.includes("materiali"))) {
    const monthKey = monthKeyFromPrompt(prompt, context.nowIso);
    const periodo = monthKey ? periodFromMonthKey(monthKey) : undefined;
    const result = await executeToolCall(toolCall("get_material_movements", { periodo, limit: 8 }, "det-material-movements"), {
      requestId: context.requestId,
      sessionId: context.sessionId,
      prompt,
      nowIso: context.nowIso,
    });
    if (!result.ok) return null;
    const data = record(result.data);
    const items = Array.isArray(data.items) ? data.items : [];
    const rows = rowsFromMaterialMovements(items);
    const total = typeof data.total === "number" ? data.total : rows.length;
    return {
      text: `Movimenti materiali${monthKey ? ` ${monthKey}` : ""}: ${total} record trovati.`,
      status: "completed",
      blocks: [makeStyledTable("Movimenti materiali", rows)],
      entities: [],
      sources: [{ label: "Tool movimenti materiali", toolName: "get_material_movements" }],
      notices: Array.isArray(data.notices) ? data.notices.map(String) : [],
    };
  }

  return null;
}

function agent(kind: ChatIaAgentKind): ChatIaAgent {
  const found = chatIaSpecialistAgents.find((item) => item.kind === kind);
  if (!found) throw new Error(`Agente non registrato: ${kind}`);
  return found;
}

function cleanPlate(value: unknown): string {
  return typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", ".").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function dateMs(value: unknown, endOfDay = false): number | null {
  const parsed = parseChatIaToolDate(value);
  if (!parsed) return null;
  const normalized = new Date(parsed);
  normalized.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return normalized.getTime();
}

function inPeriod(value: unknown, period: DatePeriod): boolean {
  const from = dateMs(period.from);
  const to = dateMs(period.to, true);
  const current = dateMs(value);
  return (from === null || (current !== null && current >= from)) && (to === null || (current !== null && current <= to));
}

function firstListVehiclesData(agentResults: ChatIaAgentResult[]): Record<string, unknown> | null {
  const result = agentResults
    .flatMap((agentResult) => agentResult.toolResults)
    .find((toolResult) => toolResult.name === "list_vehicles" && toolResult.ok);
  return result?.data && typeof result.data === "object" && !Array.isArray(result.data)
    ? result.data as Record<string, unknown>
    : null;
}

function extractFleetVehicles(agentResults: ChatIaAgentResult[]): FleetVehicle[] {
  const data = firstListVehiclesData(agentResults);
  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    .map((item) => ({
      _id: typeof item._id === "string" && item._id ? item._id : typeof item.id === "string" && item.id ? item.id : cleanPlate(item.targa),
      targa: cleanPlate(item.targa),
      categoria: typeof item.categoria === "string" ? item.categoria : null,
      autista: typeof item.autista_assegnato_nome === "string" ? item.autista_assegnato_nome : null,
    }))
    .filter((item) => item.targa);
}

function buildFleetVehicleMap(fleetVehicles: FleetVehicle[]): Map<string, FleetVehicle> {
  return new Map(fleetVehicles.map((vehicle) => [vehicle.targa, vehicle]));
}

function buildPlan(questionId: ChatIaArguteQuestionId, prompt: string, nowIso: string): ChatIaOrchestratorPlan {
  const currentMonth = periodCurrentMonth(nowIso);
  const lastThirtyDays = periodLastThirtyDays(nowIso);

  const plans: Record<ChatIaArguteQuestionId, ChatIaOrchestratorPlan> = {
    D1: {
      questionId,
      execution: "sequential",
      rationale: "Consumi richiedono anagrafica flotta e rifornimenti sugli ultimi due mesi.",
      calls: [
        { agentKind: "flotta", task: "Recupera mezzi e autisti per interpretare i consumi.", toolCalls: [toolCall("list_vehicles", {}, "d1-flotta")] },
        { agentKind: "cisterna_rifornimenti", task: "Calcola consumi medi su tutta la flotta nel periodo richiesto.", toolCalls: [] },
      ],
    },
    D2: {
      questionId,
      execution: "sequential",
      rationale: "Serve ultima manutenzione del mese e confronto con manutenzioni analoghe.",
      calls: [
        {
          agentKind: "operazioni",
          task: "Cerca manutenzioni effettuate nel mese corrente e analogie recenti.",
          toolCalls: [
            toolCall("search_maintenances", { periodo: currentMonth, stato: "effettuata", limit: 8 }, "d2-maint"),
            toolCall("search_maintenances", { stato: "effettuata", limit: 8 }, "d2-maint-analoghe"),
          ],
        },
      ],
    },
    D3: {
      questionId,
      execution: "parallel",
      rationale: "I log di accesso sono eventi operativi ordinabili per data.",
      calls: [
        {
          agentKind: "operazioni",
          task: "Cerca log e sessioni di accesso.",
          toolCalls: [toolCall("search_operational_events", { limit: 20 }, "d3-events")],
        },
      ],
    },
    D4: {
      questionId,
      execution: "parallel",
      rationale: "Le anomalie emergono da segnalazioni ed eventi operativi.",
      calls: [
        {
          agentKind: "operazioni",
          task: "Cerca segnalazioni e classifica anomalie.",
          toolCalls: [toolCall("search_operational_events", { limit: 25 }, "d4-signals")],
        },
      ],
    },
    D5: {
      questionId,
      execution: "sequential",
      rationale: "Confronto consumi richiede rifornimenti e anagrafica autisti/mezzi.",
      calls: [
        { agentKind: "flotta", task: "Recupera flotta e autisti.", toolCalls: [toolCall("list_vehicles", {}, "d5-flotta")] },
        { agentKind: "cisterna_rifornimenti", task: "Calcola consumi su tutta la flotta negli ultimi quattro mesi.", toolCalls: [] },
      ],
    },
    D6: {
      questionId,
      execution: "parallel",
      rationale: "Outlier costi richiede categorie mezzo, aggregati costo e fornitori.",
      calls: [
        { agentKind: "flotta", task: "Recupera categorie mezzo.", toolCalls: [toolCall("list_vehicles", {}, "d6-flotta")] },
        {
          agentKind: "documenti",
          task: "Recupera aggregati costo e fornitori ricorrenti.",
          toolCalls: [
            toolCall("get_cost_aggregates", { groupBy: "mezzo" }, "d6-costs"),
            toolCall("search_documents_and_invoices", { limit: 50 }, "d6-documents"),
          ],
        },
      ],
    },
    D7: {
      questionId,
      execution: "sequential",
      rationale: "Autista con piu km medi richiede consumi per mezzo e dati flotta.",
      calls: [
        { agentKind: "flotta", task: "Recupera mezzi e autisti.", toolCalls: [toolCall("list_vehicles", {}, "d7-flotta")] },
        { agentKind: "cisterna_rifornimenti", task: "Calcola medie km/l e km su tutta la flotta nel periodo.", toolCalls: [] },
      ],
    },
    D8: {
      questionId,
      execution: "sequential",
      rationale: "Cantieri richiedono attrezzature e movimenti recenti.",
      calls: [
        {
          agentKind: "cantieri_magazzino",
          task: "Recupera tutti i cantieri con attrezzature e movimenti.",
          toolCalls: [],
        },
        {
          agentKind: "operazioni",
          task: "Recupera assegnazioni operative recenti.",
          toolCalls: [toolCall("search_operational_events", { periodo: lastThirtyDays, testo: "cantiere", limit: 20 }, "d8-events")],
        },
      ],
    },
    D9: {
      questionId,
      execution: "parallel",
      rationale: "Report esecutori basato sul modulo manutenzioni.",
      calls: [
        {
          agentKind: "operazioni",
          task: "Recupera manutenzioni dell'ultimo mese.",
          toolCalls: [
            toolCall("search_maintenances", { periodo: lastThirtyDays, stato: "tutte", limit: 20 }, "d9-maint"),
          ],
        },
      ],
    },
  };

  return {
    ...plans[questionId],
    rationale: `${plans[questionId].rationale} Prompt: ${prompt.slice(0, 120)}`,
  };
}

function periodForQuestion(questionId: ChatIaArguteQuestionId, nowIso: string): DatePeriod {
  if (questionId === "D1") return periodLastMonths(nowIso, 2);
  if (questionId === "D5" || questionId === "D7") return periodLastMonths(nowIso, 4);
  return periodLastThirtyDays(nowIso);
}

async function executeFleetConsumptionAgentCall(
  call: ChatIaAgentCall,
  context: MultiAgentContext,
  questionId: ChatIaArguteQuestionId,
  previousResults: ChatIaAgentResult[],
): Promise<ChatIaAgentResult> {
  const specialist = agent(call.agentKind);
  const period = periodForQuestion(questionId, context.nowIso);
  const fleetVehicles = extractFleetVehicles(previousResults);
  const fleetMap = buildFleetVehicleMap(fleetVehicles);
  logAgent("fleet_consumption_start", {
    agent: specialist.name,
    fleet_vehicles: fleetVehicles.length,
    period,
  });

  const snapshot = await readNextRifornimentiReadOnlySnapshot();
  const buckets = new Map<string, {
    _id: string;
    targa: string;
    categoria: string | null;
    autista: string | null;
    litriTotali: number;
    costoTotale: number;
    count: number;
    kmValues: number[];
  }>();

  for (const item of snapshot.items) {
    const targa = cleanPlate(item.targa ?? item.mezzoTarga);
    if (!targa || !fleetMap.has(targa)) continue;
    if (!inPeriod(item.dataDisplay ?? item.dataLabel ?? item.timestamp, period)) continue;

    const vehicle = fleetMap.get(targa);
    const bucket = buckets.get(targa) ?? {
      _id: vehicle?._id ?? `targa:${targa}`,
      targa,
      categoria: vehicle?.categoria ?? null,
      autista: vehicle?.autista ?? item.autistaNome ?? item.autista ?? null,
      litriTotali: 0,
      costoTotale: 0,
      count: 0,
      kmValues: [],
    };
    bucket.litriTotali += readNumber(item.litri) ?? 0;
    bucket.costoTotale += readNumber(item.costo) ?? 0;
    bucket.count += 1;
    const km = readNumber(item.km);
    if (km !== null) bucket.kmValues.push(km);
    buckets.set(targa, bucket);
  }

  const rows = Array.from(buckets.values())
    .map((bucket) => {
      const kmTotali = bucket.kmValues.length >= 2
        ? Math.max(...bucket.kmValues) - Math.min(...bucket.kmValues)
        : 0;
      const consumoL100Km = kmTotali > 0 ? (bucket.litriTotali / kmTotali) * 100 : 0;
      return {
        targa: bucket.targa,
        _id: bucket._id,
        categoria: bucket.categoria,
        autista: bucket.autista,
        litriTotali: bucket.litriTotali,
        costoTotale: bucket.costoTotale,
        rifornimenti: bucket.count,
        kmTotali,
        consumoL100Km,
        kmLitro: bucket.litriTotali > 0 && kmTotali > 0 ? kmTotali / bucket.litriTotali : 0,
      };
    })
    .filter((row) => row.litriTotali > 0)
    .sort((left, right) => right.litriTotali - left.litriTotali);

  logAgent("fleet_consumption_end", {
    agent: specialist.name,
    vehicles_with_refuelings: rows.length,
    top_vehicle: rows[0]?.targa ?? null,
  });

  return {
    agentKind: call.agentKind,
    task: call.task,
    toolResults: [
      {
        toolCallId: `${questionId.toLowerCase()}-fleet-consumption`,
        name: "fleet_consumption_analysis",
        ok: true,
        data: {
          periodo: period,
          totalFleetVehicles: fleetVehicles.length,
          totalVehiclesWithRefuelings: rows.length,
          items: rows,
        },
        outputKind: "table",
      },
    ],
    summary: `${specialist.name}: consumi flotta completa`,
  };
}

async function executeFleetSiteEquipmentAgentCall(
  call: ChatIaAgentCall,
): Promise<ChatIaAgentResult> {
  const specialist = agent(call.agentKind);
  logAgent("site_equipment_start", { agent: specialist.name });
  const snapshot = await readNextAttrezzatureCantieriSnapshot();
  const rows = snapshot.statoAttuale.map((site) => ({
    _id: site.id,
    cantiere: site.label,
    cantiereId: site.id,
    attrezzature: site.materiali.reduce((sum, item) => sum + item.quantita, 0),
    materiali: site.materiali.length,
  }));
  logAgent("site_equipment_end", {
    agent: specialist.name,
    cantieri: rows.length,
    total_movements: snapshot.counts.totalMovements,
  });

  return {
    agentKind: call.agentKind,
    task: call.task,
    toolResults: [
      {
        toolCallId: "d8-all-site-equipment",
        name: "fleet_site_equipment_analysis",
        ok: true,
        data: {
          rows,
          totalSites: rows.length,
          totalMovements: snapshot.counts.totalMovements,
          recentMovements: snapshot.items.slice(0, 20).map((item) => ({
            _id: item.id,
            data_italiana: item.data,
            tipo: item.tipo,
            cantiere: item.cantiereLabel,
            descrizione: item.descrizione,
          })),
        },
        outputKind: "table",
      },
    ],
    summary: `${specialist.name}: attrezzature su tutti i cantieri`,
  };
}

async function executeAgentCall(
  call: ChatIaAgentCall,
  context: MultiAgentContext,
  questionId: ChatIaArguteQuestionId,
  previousResults: ChatIaAgentResult[],
): Promise<ChatIaAgentResult> {
  if (
    call.agentKind === "cisterna_rifornimenti" &&
    call.toolCalls.length === 0 &&
    (questionId === "D1" || questionId === "D5" || questionId === "D7")
  ) {
    return executeFleetConsumptionAgentCall(call, context, questionId, previousResults);
  }

  if (call.agentKind === "cantieri_magazzino" && call.toolCalls.length === 0 && questionId === "D8") {
    return executeFleetSiteEquipmentAgentCall(call);
  }

  const specialist = agent(call.agentKind);
  const filteredCalls = call.toolCalls.filter((candidate) => specialist.toolNames.includes(candidate.name));
  logAgent("agent_start", {
    agent: specialist.name,
    task: call.task,
    tools: filteredCalls.map((item) => item.name),
  });
  const toolResults: ChatIaToolResult[] = await Promise.all(
    filteredCalls.map((candidate) =>
      executeToolCall(candidate, {
        requestId: context.requestId,
        sessionId: context.sessionId,
        prompt: call.task,
        nowIso: context.nowIso,
      }),
    ),
  );
  logAgent("agent_end", {
    agent: specialist.name,
    ok_tools: toolResults.filter((item) => item.ok).length,
    failed_tools: toolResults.filter((item) => !item.ok).map((item) => ({ name: item.name, error: item.error?.message })),
  });
  return {
    agentKind: call.agentKind,
    task: call.task,
    toolResults,
    summary: `${specialist.name}: ${call.task}`,
  };
}

export async function runChatIaMultiAgentIfHandled(
  prompt: string,
  context: MultiAgentContext,
): Promise<ChatIaAssistantFinalMessage | null> {
  const deterministic = await runDeterministicPromptIfHandled(prompt, context);
  if (deterministic) return deterministic;

  const questionId = identifyArguteQuestion(prompt);
  if (!questionId) return null;

  const plan = buildPlan(questionId, prompt, context.nowIso);
  logAgent("orchestrator_plan", {
    questionId,
    execution: plan.execution,
    calls: plan.calls.map((call) => ({ agent: call.agentKind, tools: call.toolCalls.map((tool) => tool.name) })),
  });

  const agentResults = plan.execution === "parallel"
    ? await Promise.all(plan.calls.map((call) => executeAgentCall(call, context, plan.questionId, [])))
    : [];

  if (plan.execution === "sequential") {
    for (const call of plan.calls) {
      agentResults.push(await executeAgentCall(call, context, plan.questionId, agentResults));
    }
  }

  const analytics = analyzeMultiAgentResults(plan, agentResults);
  logAgent("analytics_ready", {
    questionId,
    metrics: analytics.metrics.length,
    rankings: analytics.rankings.length,
    tables: analytics.tables.length,
  });

  const finalMessage = buildVisualizationMessage(analytics);
  logAgent("visualization_ready", {
    questionId,
    blockKinds: finalMessage.blocks.map((block) => block.kind),
  });
  return finalMessage;
}
