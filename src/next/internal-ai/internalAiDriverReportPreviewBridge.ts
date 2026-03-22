import {
  type InternalAiBackendDriverReportPreviewRequestBody,
  type InternalAiBackendOrchestratorPreviewResponseData,
  internalAiBackendService,
} from "../../../backend/internal-ai/src";
import {
  readInternalAiDriverReportPreview,
  type InternalAiDriverReportReadResult,
} from "./internalAiDriverReportFacade";
import type {
  InternalAiDriverLookupCandidate,
  InternalAiReportPeriodInput,
} from "./internalAiTypes";

export type InternalAiDriverReportPreviewTransport =
  | "backend_mock_safe"
  | "frontend_fallback";

export type InternalAiDriverReportPreviewBridgeReadResult = {
  transport: InternalAiDriverReportPreviewTransport;
  transportMessage: string;
  backendStatus: "ok" | "scaffold_only" | "not_enabled" | "not_found";
  result: InternalAiDriverReportReadResult;
};

function buildRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `ia-report-autista-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isDriverReportPreviewResponseData(
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
    candidate.capabilityId === "driver-report-preview" &&
    candidate.transport === "backend_mock_safe" &&
    candidate.fallbackAvailable === true &&
    candidate.result !== undefined
  );
}

export async function readInternalAiDriverReportPreviewThroughBackend(args: {
  driverCandidate: InternalAiDriverLookupCandidate | null;
  rawDriverQuery: string;
  periodInput?: InternalAiReportPeriodInput;
}): Promise<InternalAiDriverReportPreviewBridgeReadResult> {
  const previewRoute = internalAiBackendService.manifest.routes.find(
    (route) => route.id === "orchestrator.preview",
  );

  const requestBody: InternalAiBackendDriverReportPreviewRequestBody = {
    capabilityId: "driver-report-preview",
    driverCandidate: args.driverCandidate,
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
        isDriverReportPreviewResponseData(response.body.data)
      ) {
        return {
          transport: "backend_mock_safe",
          transportMessage: response.body.message,
          backendStatus: response.body.status,
          result: response.body.data.result as InternalAiDriverReportReadResult,
        };
      }

      backendFailureReason = response.body.message;
    } catch (error) {
      backendFailureReason =
        error instanceof Error
          ? error.message
          : "Errore non previsto nel bridge mock-safe del report autista.";
    }
  } else {
    backendFailureReason =
      "Route `orchestrator.preview` non dichiarata nel manifest del backend separato.";
  }

  const fallbackResult = await readInternalAiDriverReportPreview(
    args.driverCandidate,
    args.rawDriverQuery,
    args.periodInput,
  );

  return {
    transport: "frontend_fallback",
    transportMessage: backendFailureReason
      ? `Backend IA separato non pronto per il report autista (${backendFailureReason}). Attivato fallback locale clone-safe.`
      : "Backend IA separato non pronto per il report autista. Attivato fallback locale clone-safe.",
    backendStatus: "not_enabled",
    result: fallbackResult,
  };
}
