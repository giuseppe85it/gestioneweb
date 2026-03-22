import {
  type InternalAiBackendDocumentsPreviewRequestBody,
  type InternalAiBackendOrchestratorPreviewResponseData,
  internalAiBackendService,
} from "../../../backend/internal-ai/src";
import {
  readInternalAiDocumentsPreview,
  type InternalAiDocumentsPreviewReadResult,
} from "./internalAiDocumentsPreviewFacade";

export type InternalAiDocumentsPreviewTransport =
  | "backend_mock_safe"
  | "frontend_fallback";

export type InternalAiDocumentsPreviewBridgeReadResult = {
  transport: InternalAiDocumentsPreviewTransport;
  transportMessage: string;
  backendStatus: "ok" | "scaffold_only" | "not_enabled" | "not_found";
  result: InternalAiDocumentsPreviewReadResult;
};

function buildRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `ia-docs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isDocumentsPreviewResponseData(
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
    candidate.capabilityId === "documents-preview" &&
    candidate.transport === "backend_mock_safe" &&
    candidate.fallbackAvailable === true &&
    candidate.result !== undefined
  );
}

export async function readInternalAiDocumentsPreviewThroughBackend(
  rawTarga: string,
): Promise<InternalAiDocumentsPreviewBridgeReadResult> {
  const previewRoute = internalAiBackendService.manifest.routes.find(
    (route) => route.id === "orchestrator.preview",
  );

  const requestBody: InternalAiBackendDocumentsPreviewRequestBody = {
    capabilityId: "documents-preview",
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
        isDocumentsPreviewResponseData(response.body.data)
      ) {
        return {
          transport: "backend_mock_safe",
          transportMessage: response.body.message,
          backendStatus: response.body.status,
          result: response.body.data.result as InternalAiDocumentsPreviewReadResult,
        };
      }

      backendFailureReason = response.body.message;
    } catch (error) {
      backendFailureReason =
        error instanceof Error
          ? error.message
          : "Errore non previsto nel bridge mock-safe del backend separato.";
    }
  } else {
    backendFailureReason =
      "Route `orchestrator.preview` non dichiarata nel manifest del backend separato.";
  }

  const fallbackResult = await readInternalAiDocumentsPreview(rawTarga);

  return {
    transport: "frontend_fallback",
    transportMessage: backendFailureReason
      ? `Backend IA separato non pronto per la preview documenti (${backendFailureReason}). Attivato fallback locale clone-safe.`
      : "Backend IA separato non pronto per la preview documenti. Attivato fallback locale clone-safe.",
    backendStatus: "not_enabled",
    result: fallbackResult,
  };
}
