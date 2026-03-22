import {
  type InternalAiBackendOrchestratorPreviewResponseData,
  type InternalAiBackendVehicleReportPreviewRequestBody,
  internalAiBackendService,
} from "../../../backend/internal-ai/src";
import {
  readInternalAiVehicleReportPreview,
  type InternalAiVehicleReportReadResult,
} from "./internalAiVehicleReportFacade";
import type { InternalAiReportPeriodInput } from "./internalAiTypes";

export type InternalAiVehicleReportPreviewTransport =
  | "backend_mock_safe"
  | "frontend_fallback";

export type InternalAiVehicleReportPreviewBridgeReadResult = {
  transport: InternalAiVehicleReportPreviewTransport;
  transportMessage: string;
  backendStatus: "ok" | "scaffold_only" | "not_enabled" | "not_found";
  result: InternalAiVehicleReportReadResult;
};

function buildRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `ia-report-targa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isVehicleReportPreviewResponseData(
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
    candidate.capabilityId === "vehicle-report-preview" &&
    candidate.transport === "backend_mock_safe" &&
    candidate.fallbackAvailable === true &&
    candidate.result !== undefined
  );
}

export async function readInternalAiVehicleReportPreviewThroughBackend(
  rawTarga: string,
  periodInput?: InternalAiReportPeriodInput,
): Promise<InternalAiVehicleReportPreviewBridgeReadResult> {
  const previewRoute = internalAiBackendService.manifest.routes.find(
    (route) => route.id === "orchestrator.preview",
  );

  const requestBody: InternalAiBackendVehicleReportPreviewRequestBody = {
    capabilityId: "vehicle-report-preview",
    rawTarga,
    periodInput,
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
        isVehicleReportPreviewResponseData(response.body.data)
      ) {
        return {
          transport: "backend_mock_safe",
          transportMessage: response.body.message,
          backendStatus: response.body.status,
          result: response.body.data.result as InternalAiVehicleReportReadResult,
        };
      }

      backendFailureReason = response.body.message;
    } catch (error) {
      backendFailureReason =
        error instanceof Error
          ? error.message
          : "Errore non previsto nel bridge mock-safe del report targa.";
    }
  } else {
    backendFailureReason =
      "Route `orchestrator.preview` non dichiarata nel manifest del backend separato.";
  }

  const fallbackResult = await readInternalAiVehicleReportPreview(rawTarga, periodInput);

  return {
    transport: "frontend_fallback",
    transportMessage: backendFailureReason
      ? `Backend IA separato non pronto per il report targa (${backendFailureReason}). Attivato fallback locale clone-safe.`
      : "Backend IA separato non pronto per il report targa. Attivato fallback locale clone-safe.",
    backendStatus: "not_enabled",
    result: fallbackResult,
  };
}
