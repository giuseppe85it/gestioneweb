import type {
  InternalAiChatExecutionStatus,
  InternalAiChatIntent,
  InternalAiChatMessageReference,
  InternalAiDriverLookupCandidate,
  InternalAiReportPeriodInput,
  InternalAiReportPreview,
} from "../../../src/next/internal-ai/internalAiTypes";

export type InternalAiBackendMode = "mock_safe";

export type InternalAiChatTurnResult = {
  intent: InternalAiChatIntent;
  status: InternalAiChatExecutionStatus;
  assistantText: string;
  references: InternalAiChatMessageReference[];
  report:
    | {
        status: "ready";
        normalizedTarga: string;
        message: string;
        preview: InternalAiReportPreview;
      }
    | {
        status: "invalid_query" | "not_found";
        normalizedTarga: string | null;
        message: string;
        preview: null;
      }
    | {
        status: "ready";
        normalizedDriverQuery: string;
        message: string;
        preview: InternalAiReportPreview;
      }
    | {
        status: "invalid_query" | "not_found";
        normalizedDriverQuery: string | null;
        message: string;
        preview: null;
      }
    | {
        status: "ready";
        normalizedTarga: string;
        normalizedDriverQuery: string;
        message: string;
        preview: InternalAiReportPreview;
      }
    | {
        status: "invalid_query" | "not_found";
        normalizedTarga: string | null;
        normalizedDriverQuery: string | null;
        message: string;
        preview: null;
      }
    | null;
};

export type InternalAiBackendHttpMethod = "GET" | "POST";

export type InternalAiBackendEndpointId =
  | "health"
  | "orchestrator.chat"
  | "orchestrator.preview"
  | "retrieval.read"
  | "artifacts.preview"
  | "approvals.prepare";

export type InternalAiBackendPreviewCapabilityId =
  | "documents-preview"
  | "economic-analysis-preview"
  | "libretto-preview"
  | "preventivi-preview"
  | "vehicle-report-preview"
  | "driver-report-preview"
  | "combined-report-preview";

export type InternalAiBackendPreviewTransport = "backend_mock_safe";

export type InternalAiBackendActorRole = "anonimo" | "operatore" | "revisore" | "sistema";

export type InternalAiBackendContext = {
  requestId: string;
  sessionId: string | null;
  actorId: string | null;
  actorRole: InternalAiBackendActorRole;
};

export type InternalAiBackendGuardRails = {
  providerMode: "none";
  firestoreWrites: "blocked";
  storageWrites: "blocked";
  legacyRuntime: "forbidden";
  previewMode: "required";
  approvalMode: "required";
  rollbackMode: "required";
};

export type InternalAiBackendRouteDefinition = {
  id: InternalAiBackendEndpointId;
  method: InternalAiBackendHttpMethod;
  path: string;
  summary: string;
};

export type InternalAiBackendResponseStatus =
  | "ok"
  | "scaffold_only"
  | "not_enabled"
  | "not_found";

export type InternalAiBackendResponseEnvelope<TData> = {
  ok: boolean;
  mode: InternalAiBackendMode;
  endpointId: InternalAiBackendEndpointId | "unknown";
  status: InternalAiBackendResponseStatus;
  message: string;
  data: TData;
  guardRails: InternalAiBackendGuardRails;
};

export type InternalAiBackendHttpRequest<TBody = unknown> = {
  method: InternalAiBackendHttpMethod;
  path: string;
  headers?: Record<string, string>;
  context: InternalAiBackendContext;
  body: TBody | null;
};

export type InternalAiBackendHttpResponse<TData = unknown> = {
  statusCode: number;
  headers: Record<string, string>;
  body: InternalAiBackendResponseEnvelope<TData>;
};

export type InternalAiBackendManifest = {
  serviceId: "internal-ai-backend-separato";
  repoPathRoot: "backend/internal-ai";
  mode: InternalAiBackendMode;
  state: "scaffold_only" | "server_adapter_mock_safe";
  routes: InternalAiBackendRouteDefinition[];
  guardRails: InternalAiBackendGuardRails;
  legacyChannelsExplicitlyNotCanonical: string[];
  notes: string[];
};

export type InternalAiBackendDocumentsPreviewRequestBody = {
  capabilityId: "documents-preview";
  rawTarga: string;
};

export type InternalAiBackendChatOrchestratorRequestBody = {
  capabilityId: "chat-orchestrator";
  prompt: string;
  periodInput?: InternalAiReportPeriodInput;
};

export type InternalAiBackendEconomicAnalysisPreviewRequestBody = {
  capabilityId: "economic-analysis-preview";
  rawTarga: string;
};

export type InternalAiBackendLibrettoPreviewRequestBody = {
  capabilityId: "libretto-preview";
  rawTarga: string;
};

export type InternalAiBackendPreventiviPreviewRequestBody = {
  capabilityId: "preventivi-preview";
  rawTarga: string;
};

export type InternalAiBackendVehicleReportPreviewRequestBody = {
  capabilityId: "vehicle-report-preview";
  rawTarga: string;
  periodInput?: InternalAiReportPeriodInput;
};

export type InternalAiBackendDriverReportPreviewRequestBody = {
  capabilityId: "driver-report-preview";
  driverCandidate: InternalAiDriverLookupCandidate | null;
  rawDriverQuery: string;
  periodInput?: InternalAiReportPeriodInput;
};

export type InternalAiBackendCombinedReportPreviewRequestBody = {
  capabilityId: "combined-report-preview";
  driverCandidate: InternalAiDriverLookupCandidate | null;
  rawTarga: string;
  rawDriverQuery: string;
  periodInput?: InternalAiReportPeriodInput;
};

export type InternalAiBackendOrchestratorPreviewRequestBody =
  | InternalAiBackendDocumentsPreviewRequestBody
  | InternalAiBackendEconomicAnalysisPreviewRequestBody
  | InternalAiBackendLibrettoPreviewRequestBody
  | InternalAiBackendPreventiviPreviewRequestBody
  | InternalAiBackendVehicleReportPreviewRequestBody
  | InternalAiBackendDriverReportPreviewRequestBody
  | InternalAiBackendCombinedReportPreviewRequestBody;

export type InternalAiBackendOrchestratorPreviewResponseData = {
  capabilityId: InternalAiBackendPreviewCapabilityId;
  transport: InternalAiBackendPreviewTransport;
  fallbackAvailable: true;
  result: unknown;
  notes: string[];
};

export type InternalAiBackendOrchestratorChatResponseData = {
  capabilityId: "chat-orchestrator";
  transport: InternalAiBackendPreviewTransport;
  fallbackAvailable: true;
  result: InternalAiChatTurnResult;
  notes: string[];
};

export const INTERNAL_AI_BACKEND_GUARD_RAILS = {
  providerMode: "none",
  firestoreWrites: "blocked",
  storageWrites: "blocked",
  legacyRuntime: "forbidden",
  previewMode: "required",
  approvalMode: "required",
  rollbackMode: "required",
} satisfies InternalAiBackendGuardRails;

export const INTERNAL_AI_BACKEND_ROUTE_DEFINITIONS = [
  {
    id: "health",
    method: "GET",
    path: "/internal-ai-backend/health",
    summary: "Stato del backend IA separato e guard rail correnti.",
  },
  {
    id: "orchestrator.chat",
    method: "POST",
    path: "/internal-ai-backend/orchestrator/chat",
    summary:
      "Endpoint mock-safe per orchestrazione backend-first della chat interna sopra capability gia isolate.",
  },
  {
    id: "orchestrator.preview",
    method: "POST",
    path: "/internal-ai-backend/orchestrator/preview",
    summary: "Endpoint futuro per orchestrazione preview-first delle richieste IA interne.",
  },
  {
    id: "retrieval.read",
    method: "POST",
    path: "/internal-ai-backend/retrieval/read",
    summary:
      "Endpoint server-side mock-safe per il primo retrieval read-only controllato su snapshot IA dedicato, separato dai runtime legacy.",
  },
  {
    id: "artifacts.preview",
    method: "POST",
    path: "/internal-ai-backend/artifacts/preview",
    summary:
      "Endpoint server-side per preview artifact IA approvabili e rollback-ready; il provider reale resta ammesso solo lato server e solo per proposte controllate.",
  },
  {
    id: "approvals.prepare",
    method: "POST",
    path: "/internal-ai-backend/approvals/prepare",
    summary:
      "Endpoint server-side per approvazione/rifiuto/rollback di workflow IA dedicati, senza applicazione automatica sui dati business.",
  },
] satisfies InternalAiBackendRouteDefinition[];

export const INTERNAL_AI_BACKEND_RESPONSE_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "x-internal-ai-backend-mode": "mock_safe",
  "x-internal-ai-backend-state": "scaffold_only",
} as const;
