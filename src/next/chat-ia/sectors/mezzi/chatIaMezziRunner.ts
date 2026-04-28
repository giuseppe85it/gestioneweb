import type {
  ChatIaEntityRef,
  ChatIaFallbackResponse,
  ChatIaRouterDecision,
  ChatIaRunnerResult,
} from "../../core/chatIaTypes";
import type { ChatIaSectorRunner } from "../sectorTypes";
import {
  buildChatIaMezzoCardData,
  buildChatIaMezzoDocumentsTable,
  buildChatIaMezzoMaterialsTable,
  readChatIaMezzoSnapshot,
} from "./chatIaMezziData";
import { normalizeChatIaMezzoTarga } from "./chatIaMezziTarga";
import { buildChatIaMezzoReport } from "./chatIaMezziReport";
import { buildChatIaMezzoTimeline, limitChatIaMezzoTimeline } from "./chatIaMezziTimeline";
import type { ChatIaMezzoIntent, ChatIaMezzoSnapshot, ChatIaMezzoTimelineEvent } from "./chatIaMezziTypes";

function getTarga(decision: ChatIaRouterDecision): string | null {
  const entity = decision.entities.find((entry) => entry.kind === "targa");
  return entity?.kind === "targa" ? normalizeChatIaMezzoTarga(entity.value) || null : null;
}

function detectIntent(prompt: string, decision: ChatIaRouterDecision): ChatIaMezzoIntent {
  const normalized = prompt.toLowerCase();
  if (decision.asksReport || normalized.includes("report")) {
    return decision.period ? "report_mezzo_periodo" : "report_mezzo_singolo";
  }
  if (normalized.includes("timeline") || normalized.includes("storia") || normalized.includes("eventi")) {
    return "timeline";
  }
  if (normalized.includes("material")) return "materiali";
  if (normalized.includes("document")) return "documenti";
  return "stato";
}

function fallbackText(args: { targa: string | null; reason: "missing" | "not_found" | "ambiguous" }): string {
  if (args.reason === "missing") {
    return "Indicami una targa per aprire il dossier mezzo.";
  }
  if (args.reason === "ambiguous") {
    return `La targa ${args.targa ?? ""} corrisponde a piu mezzi. Scrivila completa.`;
  }
  return `Non ho trovato un mezzo con targa ${args.targa ?? ""}.`;
}

function buildFallback(args: {
  decision: ChatIaRouterDecision;
  targa: string | null;
  reason: "missing" | "not_found" | "ambiguous";
}): ChatIaFallbackResponse {
  return {
    sector: "mezzi",
    text: fallbackText({ targa: args.targa, reason: args.reason }),
    examples: [
      "stato mezzo AB123CD",
      "timeline mezzo AB123CD",
      "documenti mezzo AB123CD",
      "report mezzo AB123CD",
    ],
  };
}

function buildBaseResult(args: {
  text: string;
  entities: ChatIaEntityRef[];
  snapshot: ChatIaMezzoSnapshot;
}): Pick<ChatIaRunnerResult, "status" | "sector" | "sources" | "text" | "entities" | "fallback" | "backendContext" | "error"> {
  return {
    status: args.snapshot.missingData.length > 0 ? "partial" : "completed",
    sector: "mezzi",
    sources: ["mezzi"],
    text: args.text,
    entities: args.entities,
    fallback: null,
    backendContext: {
      targetTarga: args.snapshot.targa,
      sourceCount: args.snapshot.sources.length,
      missingDataCount: args.snapshot.missingData.length,
      counts: {
        lavoriAperti: args.snapshot.operativita.counts.lavoriAperti,
        manutenzioni: args.snapshot.operativita.counts.manutenzioni,
        materiali: args.snapshot.materiali.counts.total,
        documenti: args.snapshot.documenti.counts.total,
      },
    },
    error: null,
  };
}

function summarizeSnapshot(snapshot: ChatIaMezzoSnapshot): string {
  return [
    `Mezzo ${snapshot.targa}: ${snapshot.mezzo.marcaModello || "marca/modello non indicati"}.`,
    `Autista: ${snapshot.mezzo.autistaNome || "non assegnato"}.`,
    `Lavori aperti: ${snapshot.operativita.counts.lavoriAperti}; manutenzioni: ${snapshot.operativita.counts.manutenzioni}.`,
    `Materiali: ${snapshot.materiali.counts.total}; documenti: ${snapshot.documenti.counts.total}.`,
  ].join(" ");
}

function summarizeTimeline(timeline: ChatIaMezzoTimelineEvent[]): string {
  if (timeline.length === 0) return "Nessun evento timeline trovato per questo mezzo.";
  return limitChatIaMezzoTimeline(timeline, 8)
    .map((event) => `- ${event.dateLabel ?? "data n.d."}: ${event.title}`)
    .join("\n");
}

export const chatIaMezziRunner: ChatIaSectorRunner = {
  id: "mezzi",
  label: "Mezzi",
  canHandle(decision) {
    return decision.sector === "mezzi" || decision.entities.some((entry) => entry.kind === "targa");
  },
  async run({ prompt, decision, context }) {
    const targa = getTarga(decision);
    if (!targa) {
      const fallback = buildFallback({ decision, targa: null, reason: "missing" });
      return {
        status: "not_handled",
        sector: "mezzi",
        sources: ["mezzi"],
        text: fallback.text,
        outputKind: "fallback",
        entities: decision.entities,
        card: null,
        table: null,
        report: null,
        fallback,
        backendContext: {},
        error: null,
      };
    }

    const data = await readChatIaMezzoSnapshot(targa);
    if (!data.ok) {
      const reason = data.match.status === "ambiguous" ? "ambiguous" : "not_found";
      const fallback = buildFallback({ decision, targa, reason });
      return {
        status: "not_handled",
        sector: "mezzi",
        sources: ["mezzi"],
        text: fallback.text,
        outputKind: "fallback",
        entities: decision.entities,
        card: null,
        table: null,
        report: null,
        fallback,
        backendContext: { match: data.match },
        error: null,
      };
    }

    const snapshot = data.snapshot;
    const intent = detectIntent(prompt, decision);
    const timeline = buildChatIaMezzoTimeline(snapshot);
    const base = buildBaseResult({
      text: summarizeSnapshot(snapshot),
      entities: [{ kind: "targa", value: snapshot.targa }],
      snapshot,
    });

    if (intent === "timeline") {
      return {
        ...base,
        text: `Timeline ${snapshot.targa}\n${summarizeTimeline(timeline)}`,
        outputKind: "text",
        card: null,
        table: null,
        report: null,
      };
    }

    if (intent === "materiali") {
      return {
        ...base,
        text: `Materiali consegnati al mezzo ${snapshot.targa}: ${snapshot.materiali.counts.total}.`,
        outputKind: "table",
        card: null,
        table: buildChatIaMezzoMaterialsTable(snapshot),
        report: null,
      };
    }

    if (intent === "documenti") {
      return {
        ...base,
        text: `Documenti collegati al mezzo ${snapshot.targa}: ${snapshot.documenti.counts.total}.`,
        outputKind: "table",
        card: null,
        table: buildChatIaMezzoDocumentsTable(snapshot),
        report: null,
      };
    }

    if (intent === "report_mezzo_singolo" || intent === "report_mezzo_periodo") {
      const report = buildChatIaMezzoReport({
        snapshot,
        timeline,
        period: context.period ?? decision.period,
        prompt,
      });
      return {
        ...base,
        text: `Ho preparato il report per il mezzo ${snapshot.targa}.`,
        outputKind: "report_modal",
        card: null,
        table: null,
        report,
      };
    }

    return {
      ...base,
      outputKind: "card",
      card: { kind: "mezzo_dossier", data: buildChatIaMezzoCardData(snapshot) },
      table: null,
      report: null,
    };
  },
  fallbackContext({ prompt, decision }) {
    const targa = getTarga(decision);
    return {
      sector: "mezzi",
      text: targa
        ? `Non riesco ad aprire il dossier mezzo per ${targa}.`
        : `Prompt non abbastanza specifico per il settore Mezzi: ${prompt}`,
      examples: [
        "stato mezzo AB123CD",
        "timeline AB123CD",
        "materiali mezzo AB123CD",
        "report mensile AB123CD aprile 2026",
      ],
    };
  },
};
