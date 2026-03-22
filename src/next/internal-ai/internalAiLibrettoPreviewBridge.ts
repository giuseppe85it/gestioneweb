import {
  type InternalAiBackendLibrettoPreviewRequestBody,
  type InternalAiBackendOrchestratorPreviewResponseData,
  internalAiBackendService,
} from "../../../backend/internal-ai/src";
import {
  buildInternalAiLibrettoPreviewFromVehicleContext,
  buildInternalAiLibrettoPreviewReadyMessage,
  readInternalAiLibrettoPreview,
  type InternalAiLibrettoPreviewReadResult,
} from "./internalAiLibrettoPreviewFacade";
import { readInternalAiServerVehicleContextByTarga } from "./internalAiServerRetrievalClient";

export type InternalAiLibrettoPreviewTransport =
  | "server_http_retrieval"
  | "backend_mock_safe"
  | "frontend_fallback";

export type InternalAiLibrettoPreviewBridgeReadResult = {
  transport: InternalAiLibrettoPreviewTransport;
  transportMessage: string;
  backendStatus: "ok" | "scaffold_only" | "not_enabled" | "not_found";
  result: InternalAiLibrettoPreviewReadResult;
};

function buildRequestId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `ia-libretto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isLibrettoPreviewResponseData(
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
    candidate.capabilityId === "libretto-preview" &&
    candidate.transport === "backend_mock_safe" &&
    candidate.fallbackAvailable === true &&
    candidate.result !== undefined
  );
}

export async function readInternalAiLibrettoPreviewThroughBackend(
  rawTarga: string,
): Promise<InternalAiLibrettoPreviewBridgeReadResult> {
  const serverRetrievalResult = await readInternalAiServerVehicleContextByTarga(rawTarga);
  if (serverRetrievalResult.status === "ready" && serverRetrievalResult.payload.vehicleContext) {
    const preview = buildInternalAiLibrettoPreviewFromVehicleContext({
      mezzo: serverRetrievalResult.payload.vehicleContext,
      flottaLimitations: serverRetrievalResult.payload.snapshotMeta.flottaLimitations,
      fileAvailabilityDataset: serverRetrievalResult.payload.snapshotMeta.fileAvailabilityDataset,
      fileAvailabilityLimitations:
        serverRetrievalResult.payload.snapshotMeta.fileAvailabilityLimitations,
      sourceModeLabel:
        "Retrieval server-side read-only su snapshot D01 seedato dal clone e persistito nel backend IA dedicato, senza Firestore server-side diretto.",
    });
    const result: InternalAiLibrettoPreviewReadResult = {
      status: "ready",
      normalizedTarga: serverRetrievalResult.payload.vehicleContext.targa,
      message: buildInternalAiLibrettoPreviewReadyMessage(preview),
      preview,
    };

    return {
      transport: "server_http_retrieval",
      transportMessage: `${serverRetrievalResult.message} Nessun backend legacy o provider reale e stato attivato.`,
      backendStatus: "ok",
      result,
    };
  }

  const previewRoute = internalAiBackendService.manifest.routes.find(
    (route) => route.id === "orchestrator.preview",
  );

  const requestBody: InternalAiBackendLibrettoPreviewRequestBody = {
    capabilityId: "libretto-preview",
    rawTarga,
  };

  let backendFailureReason: string | null =
    serverRetrievalResult.status === "not_enabled" || serverRetrievalResult.status === "not_found"
      ? serverRetrievalResult.message
      : null;

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
        isLibrettoPreviewResponseData(response.body.data)
      ) {
        return {
          transport: "backend_mock_safe",
          transportMessage: response.body.message,
          backendStatus: response.body.status,
          result: response.body.data.result as InternalAiLibrettoPreviewReadResult,
        };
      }

      backendFailureReason = response.body.message;
    } catch (error) {
      backendFailureReason =
        error instanceof Error
          ? error.message
          : "Errore non previsto nel bridge mock-safe della preview libretto.";
    }
  } else {
    backendFailureReason =
      "Route `orchestrator.preview` non dichiarata nel manifest del backend separato.";
  }

  const fallbackResult = await readInternalAiLibrettoPreview(rawTarga);

  return {
    transport: "frontend_fallback",
    transportMessage: backendFailureReason
      ? `Backend IA separato non pronto per la preview libretto (${backendFailureReason}). Attivato fallback locale clone-safe.`
      : "Backend IA separato non pronto per la preview libretto. Attivato fallback locale clone-safe.",
    backendStatus: "not_enabled",
    result: fallbackResult,
  };
}
