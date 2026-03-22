import {
  type InternalAiBackendCombinedReportPreviewRequestBody,
  type InternalAiBackendOrchestratorPreviewResponseData,
  internalAiBackendService,
} from "../../../backend/internal-ai/src";
import {
  readInternalAiCombinedReportPreview,
  type InternalAiCombinedReportReadResult,
} from "./internalAiCombinedReportFacade";
import type {
  InternalAiDriverLookupCandidate,
  InternalAiReportPeriodInput,
} from "./internalAiTypes";

export type InternalAiCombinedReportPreviewTransport =
  | "backend_mock_safe"
  | "frontend_fallback";

export type InternalAiCombinedReportPreviewBridgeReadResult = {
  transport: InternalAiCombinedReportPreviewTransport;
  transportMessage: string;
  backendStatus: "ok" | "scaffold_only" | "not_enabled" | "not_found";
  result: InternalAiCombinedReportReadResult;
};

function buildRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `ia-report-combinato-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isCombinedReportPreviewResponseData(
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
    candidate.capabilityId === "combined-report-preview" &&
    candidate.transport === "backend_mock_safe" &&
    candidate.fallbackAvailable === true &&
    candidate.result !== undefined
  );
}

export async function readInternalAiCombinedReportPreviewThroughBackend(args: {
  driverCandidate: InternalAiDriverLookupCandidate | null;
  rawTarga: string;
  rawDriverQuery: string;
  periodInput?: InternalAiReportPeriodInput;
}): Promise<InternalAiCombinedReportPreviewBridgeReadResult> {
  const previewRoute = internalAiBackendService.manifest.routes.find(
    (route) => route.id === "orchestrator.preview",
  );

  const requestBody: InternalAiBackendCombinedReportPreviewRequestBody = {
    capabilityId: "combined-report-preview",
    driverCandidate: args.driverCandidate,
    rawTarga: args.rawTarga,
    rawDriverQuery: args.rawDriverQuery,
    periodInput: args.periodInput,
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
        isCombinedReportPreviewResponseData(response.body.data)
      ) {
        return {
          transport: "backend_mock_safe",
          transportMessage: response.body.message,
          backendStatus: response.body.status,
          result: response.body.data.result as InternalAiCombinedReportReadResult,
        };
      }

      backendFailureReason = response.body.message;
    } catch (error) {
      backendFailureReason =
        error instanceof Error
          ? error.message
          : "Errore non previsto nel bridge mock-safe del report combinato.";
    }
  } else {
    backendFailureReason =
      "Route `orchestrator.preview` non dichiarata nel manifest del backend separato.";
  }

  const fallbackResult = await readInternalAiCombinedReportPreview({
    driverCandidate: args.driverCandidate,
    rawTarga: args.rawTarga,
    rawDriverQuery: args.rawDriverQuery,
    periodInput: args.periodInput,
  });

  return {
    transport: "frontend_fallback",
    transportMessage: backendFailureReason
      ? `Backend IA separato non pronto per il report combinato (${backendFailureReason}). Attivato fallback locale clone-safe.`
      : "Backend IA separato non pronto per il report combinato. Attivato fallback locale clone-safe.",
    backendStatus: "not_enabled",
    result: fallbackResult,
  };
}
