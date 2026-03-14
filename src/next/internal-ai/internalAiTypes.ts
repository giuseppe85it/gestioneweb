export type NextInternalAiSectionId =
  | "overview"
  | "sessions"
  | "requests"
  | "artifacts"
  | "audit";

export type InternalAiPreviewStatus =
  | "idle"
  | "preview_ready"
  | "revision_requested"
  | "discarded";

export type InternalAiApprovalStatus =
  | "not_requested"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "revision_requested";

export type InternalAiSessionStatus = "draft" | "active_preview" | "review_queue" | "closed";

export type InternalAiRequestStatus =
  | "draft"
  | "preview_ready"
  | "awaiting_approval"
  | "revision_requested"
  | "discarded";

export type InternalAiArtifactKind =
  | "report_preview"
  | "contract_catalog"
  | "retrieval_snapshot"
  | "checklist";

export type InternalAiArtifactStatus = "draft" | "preview" | "archived";

export type InternalAiArtifactStorageMode = "mock_memory_only" | "local_storage_isolated";

export type InternalAiAuditSeverity = "info" | "warning" | "critical";

export type InternalAiRiskLevel = "low" | "medium" | "high";

export type InternalAiPreviewState = {
  status: InternalAiPreviewStatus;
  updatedAt: string;
  note: string;
};

export type InternalAiApprovalState = {
  status: InternalAiApprovalStatus;
  requestedBy: string;
  updatedAt: string;
  note: string;
};

export type InternalAiSession = {
  id: string;
  title: string;
  scope: string;
  status: InternalAiSessionStatus;
  createdAt: string;
  updatedAt: string;
  previewState: InternalAiPreviewState;
  approvalState: InternalAiApprovalState;
};

export type InternalAiRequest = {
  id: string;
  title: string;
  sessionId: string;
  target: string;
  requestedAdapters: string[];
  status: InternalAiRequestStatus;
  previewState: InternalAiPreviewState;
  approvalState: InternalAiApprovalState;
  note: string;
};

export type InternalAiAuditLogEntry = {
  id: string;
  createdAt: string;
  severity: InternalAiAuditSeverity;
  riskLevel: InternalAiRiskLevel;
  message: string;
  scope: string;
};

export type InternalAiScaffoldSummary = {
  safeMode: true;
  runtimeMode: "scaffolding";
  backendMode: "stub_only";
  artifactArchiveMode: InternalAiArtifactStorageMode;
  trackingMode: InternalAiTrackingMode;
  writesBlocked: true;
};

export type InternalAiReportTone = "default" | "success" | "warning";

export type InternalAiVehicleReportCard = {
  label: string;
  value: string;
  meta: string;
  tone?: InternalAiReportTone;
};

export type InternalAiVehicleReportSectionStatus =
  | "completa"
  | "parziale"
  | "vuota"
  | "errore";

export type InternalAiVehicleReportSection = {
  id: string;
  title: string;
  status: InternalAiVehicleReportSectionStatus;
  summary: string;
  bullets: string[];
  notes: string[];
};

export type InternalAiVehicleReportSourceStatus = "disponibile" | "parziale" | "errore";

export type InternalAiVehicleReportSource = {
  id: string;
  title: string;
  status: InternalAiVehicleReportSourceStatus;
  description: string;
  datasetLabels: string[];
  countLabel: string | null;
  notes: string[];
};

export type InternalAiVehicleReportPreview = {
  mezzoTarga: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  header: {
    targa: string;
    categoria: string | null;
    marcaModello: string | null;
    autistaNome: string | null;
    revisione: string | null;
    librettoPresente: boolean;
    manutenzioneProgrammata: boolean;
  };
  cards: InternalAiVehicleReportCard[];
  sections: InternalAiVehicleReportSection[];
  missingData: string[];
  evidences: string[];
  sources: InternalAiVehicleReportSource[];
  previewState: InternalAiPreviewState;
  approvalState: InternalAiApprovalState;
};

export type InternalAiEconomicAnalysisPreview = {
  mezzoTarga: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  header: {
    targa: string;
    categoria: string | null;
    marcaModello: string | null;
    documentiDiretti: string;
    snapshotLegacy: string;
    procurement: string;
    periodoDiretto: string;
  };
  cards: InternalAiVehicleReportCard[];
  sections: InternalAiVehicleReportSection[];
  missingData: string[];
  sources: InternalAiVehicleReportSource[];
  previewState: InternalAiPreviewState;
};

export type InternalAiVehicleLookupMatchState =
  | "idle"
  | "loading"
  | "empty_query"
  | "no_match"
  | "exact_match"
  | "multiple_matches"
  | "selected"
  | "error";

export type InternalAiVehicleLookupCandidate = {
  id: string;
  targa: string;
  categoria: string;
  marcaModello: string | null;
  autistaNome: string | null;
  quality: "certo" | "parziale" | "da_verificare";
  sourceKey: string;
};

export type InternalAiArtifactPayload = {
  version: 1;
  report: InternalAiVehicleReportPreview;
  sourceDatasetLabels: string[];
  missingDataCount: number;
  evidenceCount: number;
};

export type InternalAiDraftArtifactInput = {
  report: InternalAiVehicleReportPreview;
};

export type InternalAiChatIntent =
  | "report_targa"
  | "capabilities"
  | "non_supportato"
  | "richiesta_generica";

export type InternalAiChatExecutionStatus =
  | "idle"
  | "running"
  | "completed"
  | "partial"
  | "not_supported"
  | "failed";

export type InternalAiChatMessageRole = "utente" | "assistente";

export type InternalAiChatMessageReferenceType =
  | "report_preview"
  | "artifact_archive"
  | "capabilities"
  | "safe_mode_notice";

export type InternalAiChatMessageReference = {
  type: InternalAiChatMessageReferenceType;
  label: string;
  targa: string | null;
  artifactId?: string;
};

export type InternalAiChatMessage = {
  id: string;
  role: InternalAiChatMessageRole;
  createdAt: string;
  text: string;
  intent: InternalAiChatIntent;
  status: InternalAiChatExecutionStatus;
  references: InternalAiChatMessageReference[];
};

export type InternalAiTrackingMode = "memory_only" | "local_storage_isolated";

export type InternalAiTrackingEventKind =
  | "screen_visit"
  | "chat_prompt"
  | "report_preview"
  | "vehicle_selected"
  | "artifact_saved"
  | "artifact_opened"
  | "artifact_archived";

export type InternalAiTrackingEvent = {
  id: string;
  ts: string;
  kind: InternalAiTrackingEventKind;
  sectionId: NextInternalAiSectionId;
  path: string;
  label: string;
  targa: string | null;
  artifactId: string | null;
  intent: InternalAiChatIntent | null;
};

export type InternalAiRecentVehicleSearch = {
  targa: string;
  source: "manuale" | "selezione_guidata" | "chat";
  result: "selected" | "ready" | "not_found" | "invalid_query";
  updatedAt: string;
};

export type InternalAiRecentChatPrompt = {
  prompt: string;
  intent: InternalAiChatIntent;
  status: InternalAiChatExecutionStatus;
  updatedAt: string;
};

export type InternalAiRecentArtifactAction = {
  artifactId: string;
  title: string;
  mezzoTarga: string | null;
  action: "saved" | "opened" | "archived";
  updatedAt: string;
};

export type InternalAiIntentUsage = {
  intent: InternalAiChatIntent;
  count: number;
  updatedAt: string;
};

export type InternalAiSessionMemoryState = {
  lastSectionId: NextInternalAiSectionId | null;
  lastPath: string | null;
  lastTarga: string | null;
  lastPrompt: string | null;
  lastIntent: InternalAiChatIntent | null;
  lastArtifactId: string | null;
  updatedAt: string | null;
};

export type InternalAiTrackingSummary = {
  mode: InternalAiTrackingMode;
  totalVisits: number;
  totalEvents: number;
  sectionCounts: Record<NextInternalAiSectionId, number>;
  recentEvents: InternalAiTrackingEvent[];
  recentVehicleSearches: InternalAiRecentVehicleSearch[];
  recentChatPrompts: InternalAiRecentChatPrompt[];
  recentArtifacts: InternalAiRecentArtifactAction[];
  recentIntents: InternalAiIntentUsage[];
  sessionState: InternalAiSessionMemoryState;
};

export type InternalAiArtifact = {
  id: string;
  requestId: string;
  sourceSessionId: string;
  title: string;
  kind: InternalAiArtifactKind;
  status: InternalAiArtifactStatus;
  storageMode: InternalAiArtifactStorageMode;
  isPersisted: boolean;
  mezzoTarga: string | null;
  createdAt: string;
  updatedAt: string;
  sourceRequestTitle: string;
  sourceLabels: string[];
  version: 1;
  tags: string[];
  note: string;
  payload: InternalAiArtifactPayload | null;
};
