import {
  type InternalAiBackendChatOrchestratorRequestBody,
  type InternalAiBackendOrchestratorChatResponseData,
  internalAiBackendService,
} from "../../../backend/internal-ai/src";
import {
  runInternalAiChatTurn,
  type InternalAiChatTurnResult,
} from "./internalAiChatOrchestrator";
import type { InternalAiReportPeriodInput } from "./internalAiTypes";

export type InternalAiChatOrchestratorTransport =
  | "backend_mock_safe"
  | "frontend_fallback";

export type InternalAiChatOrchestratorBridgeResult = {
  transport: InternalAiChatOrchestratorTransport;
  transportMessage: string;
  backendStatus: "ok" | "scaffold_only" | "not_enabled" | "not_found";
  result: InternalAiChatTurnResult;
};

function buildRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `ia-chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isChatOrchestratorResponseData(
  value: unknown,
): value is InternalAiBackendOrchestratorChatResponseData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    capabilityId?: unknown;
    transport?: unknown;
    fallbackAvailable?: unknown;
    result?: unknown;
  };

  return (
    candidate.capabilityId === "chat-orchestrator" &&
    candidate.transport === "backend_mock_safe" &&
    candidate.fallbackAvailable === true &&
    candidate.result !== undefined
  );
}

export async function runInternalAiChatTurnThroughBackend(
  prompt: string,
  fallbackPeriodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiChatOrchestratorBridgeResult> {
  const chatRoute = internalAiBackendService.manifest.routes.find(
    (route) => route.id === "orchestrator.chat",
  );

  const requestBody: InternalAiBackendChatOrchestratorRequestBody = {
    capabilityId: "chat-orchestrator",
    prompt,
    periodInput: fallbackPeriodInput,
  };

  let backendFailureReason: string | null = null;

  if (chatRoute) {
    try {
      const response = await internalAiBackendService.dispatch({
        method: chatRoute.method,
        path: chatRoute.path,
        context: {
          requestId: buildRequestId(),
          sessionId: null,
          actorId: "next-ia-interna",
          actorRole: "operatore",
        },
        body: requestBody,
      });

      if (
        response.statusCode === 200 &&
        response.body.ok &&
        response.body.endpointId === "orchestrator.chat" &&
        isChatOrchestratorResponseData(response.body.data)
      ) {
        return {
          transport: "backend_mock_safe",
          transportMessage: response.body.message,
          backendStatus: response.body.status,
          result: response.body.data.result,
        };
      }

      backendFailureReason = response.body.message;
    } catch (error) {
      backendFailureReason =
        error instanceof Error
          ? error.message
          : "Errore non previsto nel bridge mock-safe della chat interna.";
    }
  } else {
    backendFailureReason =
      "Route `orchestrator.chat` non dichiarata nel manifest del backend separato.";
  }

  const fallbackResult = await runInternalAiChatTurn(prompt, fallbackPeriodInput);

  return {
    transport: "frontend_fallback",
    transportMessage: backendFailureReason
      ? `Backend IA separato non pronto per la chat interna (${backendFailureReason}). Attivato fallback locale clone-safe.`
      : "Backend IA separato non pronto per la chat interna. Attivato fallback locale clone-safe.",
    backendStatus: "not_enabled",
    result: fallbackResult,
  };
}
