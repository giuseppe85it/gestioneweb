import {
  type InternalAiBackendEconomicAnalysisPreviewRequestBody,
  type InternalAiBackendOrchestratorPreviewResponseData,
  internalAiBackendService,
} from "../../../backend/internal-ai/src";
import {
  readInternalAiEconomicAnalysisPreview,
  type InternalAiEconomicAnalysisReadResult,
} from "./internalAiEconomicAnalysisFacade";

export type InternalAiEconomicAnalysisPreviewTransport =
  | "backend_mock_safe"
  | "frontend_fallback";

export type InternalAiEconomicAnalysisPreviewBridgeReadResult = {
  transport: InternalAiEconomicAnalysisPreviewTransport;
  transportMessage: string;
  backendStatus: "ok" | "scaffold_only" | "not_enabled" | "not_found";
  result: InternalAiEconomicAnalysisReadResult;
};

function buildRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `ia-economic-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isEconomicAnalysisResponseData(
  value: unknown,
): value is InternalAiBackendOrchestratorPreviewResponseData {
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
    candidate.capabilityId === "economic-analysis-preview" &&
    candidate.transport === "backend_mock_safe" &&
    candidate.fallbackAvailable === true &&
    candidate.result !== undefined
  );
}

export async function readInternalAiEconomicAnalysisPreviewThroughBackend(
  rawTarga: string,
): Promise<InternalAiEconomicAnalysisPreviewBridgeReadResult> {
  const previewRoute = internalAiBackendService.manifest.routes.find(
    (route) => route.id === "orchestrator.preview",
  );

  const requestBody: InternalAiBackendEconomicAnalysisPreviewRequestBody = {
    capabilityId: "economic-analysis-preview",
    rawTarga,
  };

  let backendFailureReason: string | null = null;

  if (previewRoute) {
    try {
      const response = await internalAiBackendService.dispatch({
        method: previewRoute.method,
        path: previewRoute.path,
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
        response.body.endpointId === "orchestrator.preview" &&
        isEconomicAnalysisResponseData(response.body.data)
      ) {
        return {
          transport: "backend_mock_safe",
          transportMessage: response.body.message,
          backendStatus: response.body.status,
          result: response.body.data.result as InternalAiEconomicAnalysisReadResult,
        };
      }

      backendFailureReason = response.body.message;
    } catch (error) {
      backendFailureReason =
        error instanceof Error
          ? error.message
          : "Errore non previsto nel bridge mock-safe dell'analisi economica.";
    }
  } else {
    backendFailureReason =
      "Route `orchestrator.preview` non dichiarata nel manifest del backend separato.";
  }

  const fallbackResult = await readInternalAiEconomicAnalysisPreview(rawTarga);

  return {
    transport: "frontend_fallback",
    transportMessage: backendFailureReason
      ? `Backend IA separato non pronto per l'analisi economica preview (${backendFailureReason}). Attivato fallback locale clone-safe.`
      : "Backend IA separato non pronto per l'analisi economica preview. Attivato fallback locale clone-safe.",
    backendStatus: "not_enabled",
    result: fallbackResult,
  };
}
