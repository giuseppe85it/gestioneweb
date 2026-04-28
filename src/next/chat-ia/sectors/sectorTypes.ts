import type {
  ChatIaFallbackResponse,
  ChatIaRouterDecision,
  ChatIaRunnerContext,
  ChatIaRunnerResult,
  ChatIaSectorId,
} from "../core/chatIaTypes";

export type ChatIaSectorRunner = {
  id: ChatIaSectorId;
  label: string;
  canHandle(decision: ChatIaRouterDecision): boolean;
  run(args: {
    prompt: string;
    decision: ChatIaRouterDecision;
    context: ChatIaRunnerContext;
  }): Promise<ChatIaRunnerResult>;
  fallbackContext(args: {
    prompt: string;
    decision: ChatIaRouterDecision;
  }): ChatIaFallbackResponse;
};
