import type {
  InternalAiArtifact,
  InternalAiAuditLogEntry,
  InternalAiChatMessageReference,
  InternalAiRequest,
  InternalAiReportPeriodInput,
  InternalAiReportPreview,
  InternalAiSession,
  InternalAiTrackingSummary,
} from "../../../src/next/internal-ai/internalAiTypes";

export type InternalAiServerPersistenceMode = "server_file_isolated";

export type InternalAiServerAdapterEndpointId =
  | "health"
  | "orchestrator.chat"
  | "artifacts.repository"
  | "artifacts.preview"
  | "memory.repository"
  | "retrieval.read"
  | "approvals.prepare";

export type InternalAiServerAdapterStatus =
  | "ok"
  | "validation_error"
  | "not_enabled"
  | "not_found"
  | "provider_not_configured"
  | "upstream_error";

export const INTERNAL_AI_SERVER_ADAPTER_PORT = 4310;
export const INTERNAL_AI_SERVER_ADAPTER_BASE_PATH = "/internal-ai-backend";

export const INTERNAL_AI_SERVER_ADAPTER_ROUTES = {
  health: `${INTERNAL_AI_SERVER_ADAPTER_BASE_PATH}/health`,
  orchestratorChat: `${INTERNAL_AI_SERVER_ADAPTER_BASE_PATH}/orchestrator/chat`,
  artifactsRepository: `${INTERNAL_AI_SERVER_ADAPTER_BASE_PATH}/artifacts/repository`,
  artifactsPreview: `${INTERNAL_AI_SERVER_ADAPTER_BASE_PATH}/artifacts/preview`,
  memoryRepository: `${INTERNAL_AI_SERVER_ADAPTER_BASE_PATH}/memory/repository`,
  retrievalRead: `${INTERNAL_AI_SERVER_ADAPTER_BASE_PATH}/retrieval/read`,
  approvalsPrepare: `${INTERNAL_AI_SERVER_ADAPTER_BASE_PATH}/approvals/prepare`,
} as const;

export type InternalAiServerArtifactRepositoryState = {
  version: 1;
  sessions: InternalAiSession[];
  requests: InternalAiRequest[];
  artifacts: InternalAiArtifact[];
  auditLog: InternalAiAuditLogEntry[];
};

export type InternalAiServerTrackingRepositoryState = {
  version: 1;
  summary: InternalAiTrackingSummary;
};

export type InternalAiServerTraceabilityEntry = {
  id: string;
  ts: string;
  endpointId: InternalAiServerAdapterEndpointId;
  operation: string;
  actorId: string | null;
  requestId: string | null;
  note: string;
  entityCount: number | null;
};

export type InternalAiServerProviderTarget = {
  provider: "openai";
  api: "responses";
  model: string;
};

export type InternalAiServerPreviewRequestState =
  | "preview_ready"
  | "approved"
  | "rejected"
  | "rolled_back";

export type InternalAiServerPreviewApprovalState =
  | "awaiting_approval"
  | "approved"
  | "rejected";

export type InternalAiServerPreviewRollbackState =
  | "not_requested"
  | "available"
  | "rolled_back";

export type InternalAiServerReportSummaryArtifactKind = "report_summary_preview";

export type InternalAiServerReportSummaryWorkflow = {
  id: string;
  requestId: string;
  createdAt: string;
  updatedAt: string;
  actorId: string | null;
  promptLabel: string;
  capabilityId: "report-summary-preview";
  artifactKind: InternalAiServerReportSummaryArtifactKind;
  providerTarget: InternalAiServerProviderTarget;
  requestState: InternalAiServerPreviewRequestState;
  previewState: "preview_ready";
  approvalState: InternalAiServerPreviewApprovalState;
  rollbackState: InternalAiServerPreviewRollbackState;
  previewText: string;
  previewNote: string;
  traceEntryIds: string[];
  approvedAt: string | null;
  rejectedAt: string | null;
  rolledBackAt: string | null;
  reportContext: {
    reportType: InternalAiReportPreview["reportType"];
    title: string;
    subtitle: string;
    targetLabel: string;
    periodLabel: string;
    generatedAt: string;
    sourceCount: number;
    missingDataCount: number;
    evidenceCount: number;
    sourceLabels: string[];
    cards: { label: string; value: string; meta: string }[];
    sections: { title: string; summary: string; status: string }[];
    missingData: string[];
    evidences: string[];
  };
  references: InternalAiChatMessageReference[];
  notes: string[];
};

export type InternalAiServerReportSummaryWorkflowState = {
  version: 1;
  items: InternalAiServerReportSummaryWorkflow[];
};

export type InternalAiServerHealthResponseData = {
  adapterState: "server_adapter_mock_safe";
  persistenceMode: InternalAiServerPersistenceMode;
  runtimeDataRoot: "backend/internal-ai/runtime-data";
  providerEnabled: boolean;
  providerTarget: InternalAiServerProviderTarget | null;
  businessWritesEnabled: false;
  legacyCanonicalBackendEnabled: false;
  workflowEndpointsEnabled: Array<"artifacts.preview" | "approvals.prepare">;
  notes: string[];
};

export type InternalAiServerArtifactsRepositoryRequestBody =
  | {
      operation: "read_snapshot";
      requestId?: string;
      actorId?: string | null;
    }
  | {
      operation: "replace_snapshot";
      requestId?: string;
      actorId?: string | null;
      repositoryState: InternalAiServerArtifactRepositoryState;
    };

export type InternalAiServerArtifactsRepositoryResponseData = {
  operation: "read_snapshot" | "replace_snapshot";
  persistenceMode: InternalAiServerPersistenceMode;
  repositoryState: InternalAiServerArtifactRepositoryState;
  traceEntryId: string;
  notes: string[];
};

export type InternalAiServerMemoryRepositoryRequestBody =
  | {
      operation: "read_tracking_summary";
      requestId?: string;
      actorId?: string | null;
    }
  | {
      operation: "replace_tracking_summary";
      requestId?: string;
      actorId?: string | null;
      trackingState: InternalAiServerTrackingRepositoryState;
    };

export type InternalAiServerMemoryRepositoryResponseData = {
  operation: "read_tracking_summary" | "replace_tracking_summary";
  persistenceMode: InternalAiServerPersistenceMode;
  trackingState: InternalAiServerTrackingRepositoryState;
  traceEntryId: string;
  notes: string[];
};

export type InternalAiServerArtifactsPreviewRequestBody =
  | {
      operation: "generate_report_summary_preview";
      requestId?: string;
      actorId?: string | null;
      promptLabel?: string | null;
      periodInput?: InternalAiReportPeriodInput;
      report: InternalAiReportPreview;
    }
  | {
      operation: "read_report_summary_preview";
      requestId?: string;
      actorId?: string | null;
      workflowId: string;
    };

export type InternalAiServerArtifactsPreviewResponseData = {
  operation: "generate_report_summary_preview" | "read_report_summary_preview";
  persistenceMode: InternalAiServerPersistenceMode;
  providerConfigured: boolean;
  providerTarget: InternalAiServerProviderTarget | null;
  workflow: InternalAiServerReportSummaryWorkflow;
  traceEntryId: string;
  notes: string[];
};

export type InternalAiServerApprovalsPrepareOperation =
  | "approve_preview"
  | "reject_preview"
  | "rollback_preview";

export type InternalAiServerApprovalsPrepareRequestBody = {
  operation: InternalAiServerApprovalsPrepareOperation;
  requestId?: string;
  actorId?: string | null;
  workflowId: string;
  note?: string | null;
};

export type InternalAiServerApprovalsPrepareResponseData = {
  operation: InternalAiServerApprovalsPrepareOperation;
  persistenceMode: InternalAiServerPersistenceMode;
  workflow: InternalAiServerReportSummaryWorkflow;
  traceEntryId: string;
  notes: string[];
};

export type InternalAiServerAdapterResponseEnvelope<TData> = {
  ok: boolean;
  endpointId: InternalAiServerAdapterEndpointId | "unknown";
  status: InternalAiServerAdapterStatus;
  message: string;
  data: TData;
};
