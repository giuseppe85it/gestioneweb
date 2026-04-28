import {
  INTERNAL_AI_BACKEND_GUARD_RAILS,
  INTERNAL_AI_BACKEND_RESPONSE_HEADERS,
  type InternalAiBackendChatOrchestratorRequestBody,
  type InternalAiBackendCombinedReportPreviewRequestBody,
  type InternalAiBackendDriverReportPreviewRequestBody,
  type InternalAiBackendDocumentsPreviewRequestBody,
  type InternalAiBackendEconomicAnalysisPreviewRequestBody,
  type InternalAiBackendLibrettoPreviewRequestBody,
  type InternalAiBackendPreventiviPreviewRequestBody,
  type InternalAiBackendVehicleReportPreviewRequestBody,
  type InternalAiBackendEndpointId,
  type InternalAiBackendHttpRequest,
  type InternalAiBackendHttpResponse,
} from "./internalAiBackendContracts";

type InternalAiBackendHandler = (
  request: InternalAiBackendHttpRequest,
) => Promise<InternalAiBackendHttpResponse<Record<string, unknown>>>;

function buildNotEnabledResponse(
  endpointId: InternalAiBackendEndpointId,
  message: string,
): InternalAiBackendHttpResponse<Record<string, unknown>> {
  return {
    statusCode: 501,
    headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
    body: {
      ok: false,
      mode: "mock_safe",
      endpointId,
      status: "not_enabled",
      message,
      data: {
        nextStep:
          "Collegare un adapter server-side dedicato, con segreti lato server, letture controllate e workflow preview/approval/rollback.",
        blockedBecause: [
          "Provider reali non configurati.",
          "Scritture business bloccate.",
          "Canali backend legacy esclusi come backend canonico.",
        ],
      },
      guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    },
  };
}

async function handleHealth(): Promise<InternalAiBackendHttpResponse<Record<string, unknown>>> {
  return {
    statusCode: 200,
    headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
    body: {
      ok: true,
      mode: "mock_safe",
      endpointId: "health",
      status: "scaffold_only",
      message:
        "Backend IA separato presente nel repository ma non attivato su runtime reale.",
      data: {
        serviceId: "internal-ai-backend-separato",
        repoPathRoot: "backend/internal-ai",
        providerEnabled: false,
        businessWritesEnabled: false,
        legacyCanonicalBackendEnabled: false,
        serverSideRetrievalEnabled: ["vehicle_context_d01_clone_seeded_snapshot"],
        chatBridgeEnabled: true,
        previewBridgeCapabilities: [
          "documents-preview",
          "economic-analysis-preview",
          "libretto-preview",
          "preventivi-preview",
          "vehicle-report-preview",
          "driver-report-preview",
          "combined-report-preview",
        ],
      },
      guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    },
  };
}

function isChatOrchestratorRequestBody(
  value: unknown,
): value is InternalAiBackendChatOrchestratorRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    capabilityId?: unknown;
    prompt?: unknown;
  };

  return candidate.capabilityId === "chat-orchestrator" && typeof candidate.prompt === "string";
}

function isDocumentsPreviewRequestBody(
  value: unknown,
): value is InternalAiBackendDocumentsPreviewRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    capabilityId?: unknown;
    rawTarga?: unknown;
  };

  return candidate.capabilityId === "documents-preview" && typeof candidate.rawTarga === "string";
}

function isEconomicAnalysisPreviewRequestBody(
  value: unknown,
): value is InternalAiBackendEconomicAnalysisPreviewRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    capabilityId?: unknown;
    rawTarga?: unknown;
  };

  return (
    candidate.capabilityId === "economic-analysis-preview" &&
    typeof candidate.rawTarga === "string"
  );
}

function isLibrettoPreviewRequestBody(
  value: unknown,
): value is InternalAiBackendLibrettoPreviewRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    capabilityId?: unknown;
    rawTarga?: unknown;
  };

  return candidate.capabilityId === "libretto-preview" && typeof candidate.rawTarga === "string";
}

function isPreventiviPreviewRequestBody(
  value: unknown,
): value is InternalAiBackendPreventiviPreviewRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    capabilityId?: unknown;
    rawTarga?: unknown;
  };

  return (
    candidate.capabilityId === "preventivi-preview" &&
    typeof candidate.rawTarga === "string"
  );
}

function isVehicleReportPreviewRequestBody(
  value: unknown,
): value is InternalAiBackendVehicleReportPreviewRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    capabilityId?: unknown;
    rawTarga?: unknown;
  };

  return (
    candidate.capabilityId === "vehicle-report-preview" &&
    typeof candidate.rawTarga === "string"
  );
}

function isDriverReportPreviewRequestBody(
  value: unknown,
): value is InternalAiBackendDriverReportPreviewRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    capabilityId?: unknown;
    rawDriverQuery?: unknown;
    driverCandidate?: unknown;
  };

  return (
    candidate.capabilityId === "driver-report-preview" &&
    typeof candidate.rawDriverQuery === "string" &&
    (candidate.driverCandidate === null || typeof candidate.driverCandidate === "object")
  );
}

function isCombinedReportPreviewRequestBody(
  value: unknown,
): value is InternalAiBackendCombinedReportPreviewRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    capabilityId?: unknown;
    rawTarga?: unknown;
    rawDriverQuery?: unknown;
    driverCandidate?: unknown;
  };

  return (
    candidate.capabilityId === "combined-report-preview" &&
    typeof candidate.rawTarga === "string" &&
    typeof candidate.rawDriverQuery === "string" &&
    (candidate.driverCandidate === null || typeof candidate.driverCandidate === "object")
  );
}

async function handleOrchestratorChat(
  request: InternalAiBackendHttpRequest,
): Promise<InternalAiBackendHttpResponse<Record<string, unknown>>> {
  if (isChatOrchestratorRequestBody(request.body)) {
    return buildNotEnabledResponse(
      "orchestrator.chat",
      "Orchestratore chat legacy rimosso: la chat NEXT usa il backend OpenAI controllato tramite adapter server reale.",
    );
  }

  return buildNotEnabledResponse(
    "orchestrator.chat",
    "Orchestratore chat attivo solo per il contratto mock-safe `chat-orchestrator`; le altre richieste restano disattivate o locali.",
  );
}

async function handleOrchestratorPreview(
  request: InternalAiBackendHttpRequest,
): Promise<
  InternalAiBackendHttpResponse<Record<string, unknown>>
> {
  if (isDocumentsPreviewRequestBody(request.body)) {
    return buildNotEnabledResponse(
      "orchestrator.preview",
      "Preview documenti legacy rimossa insieme alla vecchia chat IA NEXT.",
    );
  }

  if (isEconomicAnalysisPreviewRequestBody(request.body)) {
    return buildNotEnabledResponse(
      "orchestrator.preview",
      "Preview analisi economica legacy rimossa insieme alla vecchia chat IA NEXT.",
    );
  }

  if (isLibrettoPreviewRequestBody(request.body)) {
    return buildNotEnabledResponse(
      "orchestrator.preview",
      "Preview libretto legacy rimossa insieme alla vecchia chat IA NEXT.",
    );
  }

  if (isPreventiviPreviewRequestBody(request.body)) {
    return buildNotEnabledResponse(
      "orchestrator.preview",
      "Preview preventivi legacy rimossa insieme alla vecchia chat IA NEXT.",
    );
  }

  if (isVehicleReportPreviewRequestBody(request.body)) {
    return buildNotEnabledResponse(
      "orchestrator.preview",
      "Preview report mezzo legacy rimossa insieme alla vecchia chat IA NEXT.",
    );
  }

  if (isDriverReportPreviewRequestBody(request.body)) {
    return buildNotEnabledResponse(
      "orchestrator.preview",
      "Preview report autista legacy rimossa insieme alla vecchia chat IA NEXT.",
    );
  }

  if (isCombinedReportPreviewRequestBody(request.body)) {
    return buildNotEnabledResponse(
      "orchestrator.preview",
      "Preview report combinato legacy rimossa insieme alla vecchia chat IA NEXT.",
    );
  }

  return buildNotEnabledResponse(
    "orchestrator.preview",
    "Orchestratore preview-first attivo solo per i ponti mock-safe `documents-preview`, `economic-analysis-preview`, `libretto-preview`, `preventivi-preview`, `vehicle-report-preview`, `driver-report-preview` e `combined-report-preview`; le altre capability restano disattivate o locali.",
  );
}

async function handleRetrievalRead(): Promise<
  InternalAiBackendHttpResponse<Record<string, unknown>>
> {
  return buildNotEnabledResponse(
    "retrieval.read",
    "Retrieval server-side disponibile solo tramite adapter HTTP `/internal-ai-backend/retrieval/read` su snapshot D01 seedato dal clone; il dispatcher in-process non esegue letture business dirette.",
  );
}

async function handleArtifactsPreview(): Promise<
  InternalAiBackendHttpResponse<Record<string, unknown>>
> {
  return buildNotEnabledResponse(
    "artifacts.preview",
    "Preview artifact server-side non attiva: nessun artifact viene ancora persistito o applicato.",
  );
}

async function handleApprovalsPrepare(): Promise<
  InternalAiBackendHttpResponse<Record<string, unknown>>
> {
  return buildNotEnabledResponse(
    "approvals.prepare",
    "Workflow approvativo non attivo: nessuna applicazione, nessuna scrittura business e nessun rollback reale vengono ancora eseguiti.",
  );
}

const INTERNAL_AI_BACKEND_HANDLERS: Record<InternalAiBackendEndpointId, InternalAiBackendHandler> = {
  health: handleHealth,
  "orchestrator.chat": handleOrchestratorChat,
  "orchestrator.preview": handleOrchestratorPreview,
  "retrieval.read": handleRetrievalRead,
  "artifacts.preview": handleArtifactsPreview,
  "approvals.prepare": handleApprovalsPrepare,
};

function resolveEndpointId(
  request: InternalAiBackendHttpRequest,
): InternalAiBackendEndpointId | null {
  for (const [endpointId, handler] of Object.entries(INTERNAL_AI_BACKEND_HANDLERS)) {
    void handler;
    if (
      (endpointId === "health" &&
        request.method === "GET" &&
        request.path === "/internal-ai-backend/health") ||
      (endpointId === "orchestrator.chat" &&
        request.method === "POST" &&
        request.path === "/internal-ai-backend/orchestrator/chat") ||
      (endpointId === "orchestrator.preview" &&
        request.method === "POST" &&
        request.path === "/internal-ai-backend/orchestrator/preview") ||
      (endpointId === "retrieval.read" &&
        request.method === "POST" &&
        request.path === "/internal-ai-backend/retrieval/read") ||
      (endpointId === "artifacts.preview" &&
        request.method === "POST" &&
        request.path === "/internal-ai-backend/artifacts/preview") ||
      (endpointId === "approvals.prepare" &&
        request.method === "POST" &&
        request.path === "/internal-ai-backend/approvals/prepare")
    ) {
      return endpointId;
    }
  }

  return null;
}

export async function dispatchInternalAiBackendRequest(
  request: InternalAiBackendHttpRequest,
): Promise<InternalAiBackendHttpResponse<Record<string, unknown>>> {
  const endpointId = resolveEndpointId(request);

  if (!endpointId) {
    return {
      statusCode: 404,
      headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
      body: {
        ok: false,
        mode: "mock_safe",
        endpointId: "unknown",
        status: "not_found",
        message: `Nessun handler scaffold trovato per ${request.method} ${request.path}.`,
        data: {
          knownPaths: [
            "/internal-ai-backend/health",
            "/internal-ai-backend/orchestrator/chat",
            "/internal-ai-backend/orchestrator/preview",
            "/internal-ai-backend/retrieval/read",
            "/internal-ai-backend/artifacts/preview",
            "/internal-ai-backend/approvals/prepare",
          ],
        },
        guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
      },
    };
  }

  return INTERNAL_AI_BACKEND_HANDLERS[endpointId](request);
}
