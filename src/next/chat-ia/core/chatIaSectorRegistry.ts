import { buildChatIaFallback } from "../sectors/sectorFallbacks";
import type { ChatIaSectorRunner } from "../sectors/sectorTypes";
import { chatIaMezziRunner } from "../sectors/mezzi/chatIaMezziRunner";
import type {
  ChatIaRouterDecision,
  ChatIaRunnerContext,
  ChatIaRunnerResult,
  ChatIaSectorId,
} from "./chatIaTypes";

const CHAT_IA_SECTOR_RUNNERS: Partial<Record<ChatIaSectorId, ChatIaSectorRunner>> = {
  mezzi: chatIaMezziRunner,
};

export function getRunner(sectorId: ChatIaSectorId): ChatIaSectorRunner | null {
  if (!sectorId) {
    return null;
  }
  return CHAT_IA_SECTOR_RUNNERS[sectorId] ?? null;
}

export function buildNotHandledRunnerResult(args: {
  prompt: string;
  decision: ChatIaRouterDecision;
  context: ChatIaRunnerContext;
}): ChatIaRunnerResult {
  const fallback = buildChatIaFallback({
    prompt: args.prompt,
    decision: args.decision,
  });

  return {
    status: "not_handled",
    sector: args.decision.sector ?? "mezzi",
    text: fallback.text,
    outputKind: "fallback",
    entities: args.decision.entities,
    card: null,
    table: null,
    report: null,
    fallback,
    backendContext: {
      confidence: args.decision.confidence,
      period: args.decision.period,
      nowIso: args.context.nowIso,
    },
    error: null,
  };
}
