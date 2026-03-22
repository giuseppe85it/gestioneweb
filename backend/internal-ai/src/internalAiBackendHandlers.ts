import {
  INTERNAL_AI_BACKEND_GUARD_RAILS,
  INTERNAL_AI_BACKEND_RESPONSE_HEADERS,
  type InternalAiBackendChatOrchestratorRequestBody,
  type InternalAiBackendCombinedReportPreviewRequestBody,
  type InternalAiBackendDriverReportPreviewRequestBody,
  type InternalAiBackendDocumentsPreviewRequestBody,
  type InternalAiBackendEconomicAnalysisPreviewRequestBody,
  type InternalAiBackendLibrettoPreviewRequestBody,
  type InternalAiBackendOrchestratorChatResponseData,
  type InternalAiBackendPreventiviPreviewRequestBody,
  type InternalAiBackendVehicleReportPreviewRequestBody,
  type InternalAiBackendEndpointId,
  type InternalAiBackendHttpRequest,
  type InternalAiBackendHttpResponse,
  type InternalAiBackendOrchestratorPreviewResponseData,
} from "./internalAiBackendContracts";
import {
  readInternalAiDocumentsPreview,
  type InternalAiDocumentsPreviewReadResult,
} from "../../../src/next/internal-ai/internalAiDocumentsPreviewFacade";
import {
  readInternalAiCombinedReportPreview,
  type InternalAiCombinedReportReadResult,
} from "../../../src/next/internal-ai/internalAiCombinedReportFacade";
import {
  readInternalAiDriverReportPreview,
  type InternalAiDriverReportReadResult,
} from "../../../src/next/internal-ai/internalAiDriverReportFacade";
import {
  runInternalAiChatTurn,
  type InternalAiChatTurnResult,
} from "../../../src/next/internal-ai/internalAiChatOrchestrator";
import {
  readInternalAiEconomicAnalysisPreview,
  type InternalAiEconomicAnalysisReadResult,
} from "../../../src/next/internal-ai/internalAiEconomicAnalysisFacade";
import {
  readInternalAiLibrettoPreview,
  type InternalAiLibrettoPreviewReadResult,
} from "../../../src/next/internal-ai/internalAiLibrettoPreviewFacade";
import {
  readInternalAiPreventiviPreview,
  type InternalAiPreventiviPreviewReadResult,
} from "../../../src/next/internal-ai/internalAiPreventiviPreviewFacade";
import {
  readInternalAiVehicleReportPreview,
  type InternalAiVehicleReportReadResult,
} from "../../../src/next/internal-ai/internalAiVehicleReportFacade";

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

async function buildChatOrchestratorResponse(
  result: InternalAiChatTurnResult,
): Promise<InternalAiBackendHttpResponse<InternalAiBackendOrchestratorChatResponseData>> {
  return {
    statusCode: 200,
    headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
    body: {
      ok: true,
      mode: "mock_safe",
      endpointId: "orchestrator.chat",
      status: "ok",
      message:
        "Chat interna instradata dal backend IA separato in modalita mock-safe, senza provider reali o scritture business.",
      data: {
        capabilityId: "chat-orchestrator",
        transport: "backend_mock_safe",
        fallbackAvailable: true,
        result,
        notes: [
          "Bridge in-process sul contratto del backend separato.",
          "L'orchestrazione conserva i guard rail clone-safe e resta reversibile verso il fallback locale.",
          "Nessun backend legacy viene riusato come canale canonico della chat interna.",
        ],
      },
      guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    },
  };
}

async function buildDocumentsPreviewResponse(
  result: InternalAiDocumentsPreviewReadResult,
): Promise<InternalAiBackendHttpResponse<InternalAiBackendOrchestratorPreviewResponseData>> {
  return {
    statusCode: 200,
    headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
    body: {
      ok: true,
      mode: "mock_safe",
      endpointId: "orchestrator.preview",
      status: "ok",
      message:
        "Preview documenti servita dal backend IA separato in modalita mock-safe, senza provider reali o scritture business.",
      data: {
        capabilityId: "documents-preview",
        transport: "backend_mock_safe",
        fallbackAvailable: true,
        result,
        notes: [
          "Bridge in-process sul contratto del backend separato.",
          "Nessun backend legacy riusato come canale canonico.",
          "In caso di degrado il frontend puo tornare al facade clone-safe locale.",
        ],
      },
      guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    },
  };
}

async function buildEconomicAnalysisPreviewResponse(
  result: InternalAiEconomicAnalysisReadResult,
): Promise<InternalAiBackendHttpResponse<InternalAiBackendOrchestratorPreviewResponseData>> {
  return {
    statusCode: 200,
    headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
    body: {
      ok: true,
      mode: "mock_safe",
      endpointId: "orchestrator.preview",
      status: "ok",
      message:
        "Analisi economica preview servita dal backend IA separato in modalita mock-safe, senza provider reali o scritture business.",
      data: {
        capabilityId: "economic-analysis-preview",
        transport: "backend_mock_safe",
        fallbackAvailable: true,
        result,
        notes: [
          "Bridge in-process sul contratto del backend separato.",
          "La preview economica riusa solo layer clone-safe e snapshot legacy gia leggibili.",
          "In caso di degrado il frontend puo tornare al facade locale dell'analisi economica.",
        ],
      },
      guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    },
  };
}

async function buildLibrettoPreviewResponse(
  result: InternalAiLibrettoPreviewReadResult,
): Promise<InternalAiBackendHttpResponse<InternalAiBackendOrchestratorPreviewResponseData>> {
  return {
    statusCode: 200,
    headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
    body: {
      ok: true,
      mode: "mock_safe",
      endpointId: "orchestrator.preview",
      status: "ok",
      message:
        "Preview libretto servita dal backend IA separato in modalita mock-safe, senza provider reali o scritture business.",
      data: {
        capabilityId: "libretto-preview",
        transport: "backend_mock_safe",
        fallbackAvailable: true,
        result,
        notes: [
          "Bridge in-process sul contratto del backend separato.",
          "La preview libretto riusa solo campi clone-safe del mezzo e copertura file gia leggibile.",
          "In caso di degrado il frontend puo tornare al facade locale della preview libretto.",
        ],
      },
      guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    },
  };
}

async function buildPreventiviPreviewResponse(
  result: InternalAiPreventiviPreviewReadResult,
): Promise<InternalAiBackendHttpResponse<InternalAiBackendOrchestratorPreviewResponseData>> {
  return {
    statusCode: 200,
    headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
    body: {
      ok: true,
      mode: "mock_safe",
      endpointId: "orchestrator.preview",
      status: "ok",
      message:
        "Preview preventivi servita dal backend IA separato in modalita mock-safe, senza provider reali o scritture business.",
      data: {
        capabilityId: "preventivi-preview",
        transport: "backend_mock_safe",
        fallbackAvailable: true,
        result,
        notes: [
          "Bridge in-process sul contratto del backend separato.",
          "La preview preventivi riusa solo layer clone-safe documenti/costi e supporti procurement separati.",
          "In caso di degrado il frontend puo tornare al facade locale della preview preventivi.",
        ],
      },
      guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    },
  };
}

async function buildVehicleReportPreviewResponse(
  result: InternalAiVehicleReportReadResult,
): Promise<InternalAiBackendHttpResponse<InternalAiBackendOrchestratorPreviewResponseData>> {
  return {
    statusCode: 200,
    headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
    body: {
      ok: true,
      mode: "mock_safe",
      endpointId: "orchestrator.preview",
      status: "ok",
      message:
        "Report targa servito dal backend IA separato in modalita mock-safe, senza provider reali o scritture business.",
      data: {
        capabilityId: "vehicle-report-preview",
        transport: "backend_mock_safe",
        fallbackAvailable: true,
        result,
        notes: [
          "Bridge in-process sul contratto del backend separato.",
          "Il report mezzo riusa solo layer clone-safe e mantiene il filtro periodo gia attivo nel clone.",
          "In caso di degrado il frontend puo tornare al facade locale del report targa.",
        ],
      },
      guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    },
  };
}

async function buildDriverReportPreviewResponse(
  result: InternalAiDriverReportReadResult,
): Promise<InternalAiBackendHttpResponse<InternalAiBackendOrchestratorPreviewResponseData>> {
  return {
    statusCode: 200,
    headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
    body: {
      ok: true,
      mode: "mock_safe",
      endpointId: "orchestrator.preview",
      status: "ok",
      message:
        "Report autista servito dal backend IA separato in modalita mock-safe, senza provider reali o scritture business.",
      data: {
        capabilityId: "driver-report-preview",
        transport: "backend_mock_safe",
        fallbackAvailable: true,
        result,
        notes: [
          "Bridge in-process sul contratto del backend separato.",
          "Il report autista riusa solo lookup e layer clone-safe gia attivi nel clone.",
          "In caso di degrado il frontend puo tornare al facade locale del report autista.",
        ],
      },
      guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    },
  };
}

async function buildCombinedReportPreviewResponse(
  result: InternalAiCombinedReportReadResult,
): Promise<InternalAiBackendHttpResponse<InternalAiBackendOrchestratorPreviewResponseData>> {
  return {
    statusCode: 200,
    headers: { ...INTERNAL_AI_BACKEND_RESPONSE_HEADERS },
    body: {
      ok: true,
      mode: "mock_safe",
      endpointId: "orchestrator.preview",
      status: "ok",
      message:
        "Report combinato servito dal backend IA separato in modalita mock-safe, senza provider reali o scritture business.",
      data: {
        capabilityId: "combined-report-preview",
        transport: "backend_mock_safe",
        fallbackAvailable: true,
        result,
        notes: [
          "Bridge in-process sul contratto del backend separato.",
          "Il report combinato riusa i facade clone-safe di mezzo, autista e periodo senza cambiare la logica dati.",
          "In caso di degrado il frontend puo tornare al facade locale del report combinato.",
        ],
      },
      guardRails: INTERNAL_AI_BACKEND_GUARD_RAILS,
    },
  };
}

async function handleOrchestratorChat(
  request: InternalAiBackendHttpRequest,
): Promise<InternalAiBackendHttpResponse<Record<string, unknown>>> {
  if (isChatOrchestratorRequestBody(request.body)) {
    const result = await runInternalAiChatTurn(request.body.prompt, request.body.periodInput);
    return buildChatOrchestratorResponse(result);
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
    const result = await readInternalAiDocumentsPreview(request.body.rawTarga);
    return buildDocumentsPreviewResponse(result);
  }

  if (isEconomicAnalysisPreviewRequestBody(request.body)) {
    const result = await readInternalAiEconomicAnalysisPreview(request.body.rawTarga);
    return buildEconomicAnalysisPreviewResponse(result);
  }

  if (isLibrettoPreviewRequestBody(request.body)) {
    const result = await readInternalAiLibrettoPreview(request.body.rawTarga);
    return buildLibrettoPreviewResponse(result);
  }

  if (isPreventiviPreviewRequestBody(request.body)) {
    const result = await readInternalAiPreventiviPreview(request.body.rawTarga);
    return buildPreventiviPreviewResponse(result);
  }

  if (isVehicleReportPreviewRequestBody(request.body)) {
    const result = await readInternalAiVehicleReportPreview(
      request.body.rawTarga,
      request.body.periodInput,
    );
    return buildVehicleReportPreviewResponse(result);
  }

  if (isDriverReportPreviewRequestBody(request.body)) {
    const result = await readInternalAiDriverReportPreview(
      request.body.driverCandidate,
      request.body.rawDriverQuery,
      request.body.periodInput,
    );
    return buildDriverReportPreviewResponse(result);
  }

  if (isCombinedReportPreviewRequestBody(request.body)) {
    const result = await readInternalAiCombinedReportPreview({
      driverCandidate: request.body.driverCandidate,
      rawTarga: request.body.rawTarga,
      rawDriverQuery: request.body.rawDriverQuery,
      periodInput: request.body.periodInput,
    });
    return buildCombinedReportPreviewResponse(result);
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
