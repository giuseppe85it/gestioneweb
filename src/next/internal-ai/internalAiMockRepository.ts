import { INTERNAL_AI_CONTRACTS } from "./internalAiContracts";
import { getInternalAiTrackingPersistenceMode } from "./internalAiTracking";
import type {
  InternalAiApprovalState,
  InternalAiDraftArtifactInput,
  InternalAiArtifact,
  InternalAiArtifactPayload,
  InternalAiArtifactStorageMode,
  InternalAiAuditLogEntry,
  InternalAiRequest,
  InternalAiScaffoldSummary,
  InternalAiSession,
  InternalAiVehicleReportPreview,
} from "./internalAiTypes";

export type InternalAiScaffoldSnapshot = {
  summary: InternalAiScaffoldSummary;
  sessions: InternalAiSession[];
  requests: InternalAiRequest[];
  artifacts: InternalAiArtifact[];
  auditLog: InternalAiAuditLogEntry[];
  contractCatalog: typeof INTERNAL_AI_CONTRACTS;
};

type InternalAiRepositoryState = {
  sessions: InternalAiSession[];
  requests: InternalAiRequest[];
  artifacts: InternalAiArtifact[];
  auditLog: InternalAiAuditLogEntry[];
};

type InternalAiPersistedStore = {
  version: 1;
  sessions: InternalAiSession[];
  requests: InternalAiRequest[];
  artifacts: InternalAiArtifact[];
  auditLog: InternalAiAuditLogEntry[];
};

const STORAGE_KEY = "@next_internal_ai:artifact_archive_v1";

const APPROVAL_PENDING: InternalAiApprovalState = {
  status: "awaiting_approval",
  requestedBy: "scaffold.preview",
  updatedAt: "2026-03-12T09:10:00Z",
  note: "Solo stato locale: nessun workflow reale collegato.",
};

const APPROVAL_REVISION: InternalAiApprovalState = {
  status: "revision_requested",
  requestedBy: "scaffold.reviewer",
  updatedAt: "2026-03-12T09:22:00Z",
  note: "Richiesta revisione simulata, senza side effect esterni.",
};

const APPROVAL_IDLE: InternalAiApprovalState = {
  status: "not_requested",
  requestedBy: "system",
  updatedAt: "2026-03-12T08:45:00Z",
  note: "Nessuna approvazione inviata fuori dal perimetro IA interno.",
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function getArtifactStorageMode(): InternalAiArtifactStorageMode {
  return canUseStorage() ? "local_storage_isolated" : "mock_memory_only";
}

function createSummary(): InternalAiScaffoldSummary {
  return {
    safeMode: true,
    runtimeMode: "scaffolding",
    backendMode: "stub_only",
    artifactArchiveMode: getArtifactStorageMode(),
    trackingMode: getInternalAiTrackingPersistenceMode(),
    writesBlocked: true,
  };
}

const INITIAL_SESSIONS: InternalAiSession[] = [
  {
    id: "session-report-preview",
    title: "Anteprima report targa",
    scope: "/next/ia/interna/sessioni",
    status: "active_preview",
    createdAt: "2026-03-12T08:30:00Z",
    updatedAt: "2026-03-12T09:10:00Z",
    previewState: {
      status: "preview_ready",
      updatedAt: "2026-03-12T09:10:00Z",
      note: "Solo anteprima locale del risultato richiesto.",
    },
    approvalState: APPROVAL_PENDING,
  },
  {
    id: "session-governance-contracts",
    title: "Governance contratti isolati",
    scope: "/next/ia/interna/audit",
    status: "review_queue",
    createdAt: "2026-03-12T08:42:00Z",
    updatedAt: "2026-03-12T09:22:00Z",
    previewState: {
      status: "revision_requested",
      updatedAt: "2026-03-12T09:22:00Z",
      note: "Revisione richiesta sul perimetro retrieval dati.",
    },
    approvalState: APPROVAL_REVISION,
  },
];

const INITIAL_REQUESTS: InternalAiRequest[] = [
  {
    id: "request-page-report",
    title: "Genera anteprima report targa",
    sessionId: "session-report-preview",
    target: "report-page",
    requestedAdapters: ["chat-orchestrator", "artifact-repository", "approval-workflow"],
    status: "awaiting_approval",
    previewState: {
      status: "preview_ready",
      updatedAt: "2026-03-12T09:05:00Z",
      note: "Anteprima disponibile solo lato clone.",
    },
    approvalState: APPROVAL_PENDING,
    note: "Nessuna scrittura su dati business o canali esterni.",
  },
  {
    id: "request-tracking-safe",
    title: "Tracking utilizzo IA interno",
    sessionId: "session-governance-contracts",
    target: "tracking",
    requestedAdapters: ["audit-log"],
    status: "revision_requested",
    previewState: {
      status: "revision_requested",
      updatedAt: "2026-03-12T09:22:00Z",
      note: "Tracking confinato al modulo IA: ammessa solo persistenza locale isolata del clone.",
    },
    approvalState: APPROVAL_REVISION,
    note: "Scelta deliberata: nessuna persistenza business e nessun tracking globale. Solo memoria locale del perimetro IA interno.",
  },
  {
    id: "request-artifact-archive",
    title: "Archivio artifact IA",
    sessionId: "session-report-preview",
    target: "artifact-archive",
    requestedAdapters: ["artifact-repository", "audit-log"],
    status: "preview_ready",
    previewState: {
      status: "preview_ready",
      updatedAt: "2026-03-12T09:15:00Z",
      note: "Archivio predisposto in modo isolato, con persistenza locale dedicata e fallback in memoria.",
    },
    approvalState: APPROVAL_IDLE,
    note: "Archivio isolato del clone, separato dai dati business e senza Storage reale.",
  },
];

const INITIAL_ARTIFACTS: InternalAiArtifact[] = [
  {
    id: "artifact-report-preview",
    requestId: "request-page-report",
    sourceSessionId: "session-report-preview",
    title: "Anteprima report targa",
    kind: "report_preview",
    status: "preview",
    storageMode: "mock_memory_only",
    isPersisted: false,
    mezzoTarga: null,
    createdAt: "2026-03-12T09:05:00Z",
    updatedAt: "2026-03-12T09:05:00Z",
    sourceRequestTitle: "Genera anteprima report targa",
    sourceLabels: ["report targa", "preview"],
    version: 1,
    tags: ["preview", "sicuro"],
    note: "Anteprima iniziale dello scaffolding, non ancora salvata in archivio locale.",
    payload: null,
  },
  {
    id: "artifact-contract-catalog",
    requestId: "request-artifact-archive",
    sourceSessionId: "session-report-preview",
    title: "Catalogo contratti segnaposto",
    kind: "contract_catalog",
    status: "archived",
    storageMode: "mock_memory_only",
    isPersisted: false,
    mezzoTarga: null,
    createdAt: "2026-03-12T09:15:00Z",
    updatedAt: "2026-03-12T09:15:00Z",
    sourceRequestTitle: "Archivio artifact IA",
    sourceLabels: ["governance", "contratti"],
    version: 1,
    tags: ["archivio", "contratti"],
    note: "Artifact dimostrativo dell'archivio IA interno, non collegato a dati business.",
    payload: null,
  },
];

const INITIAL_AUDIT_LOG: InternalAiAuditLogEntry[] = [
  {
    id: "audit-preview-local",
    createdAt: "2026-03-12T09:06:00Z",
    severity: "info",
    riskLevel: "low",
    message: "Anteprima generata solo nel clone IA interno, senza side effect business.",
    scope: "preview",
  },
  {
    id: "audit-tracking-blocked",
    createdAt: "2026-03-12T09:18:00Z",
    severity: "info",
    riskLevel: "low",
    message: "Tracking e memoria operativa restano confinati al solo modulo IA interno, con persistenza locale isolata e nessun dato business.",
    scope: "tracking",
  },
  {
    id: "audit-artifact-mock",
    createdAt: "2026-03-12T09:20:00Z",
    severity: "warning",
    riskLevel: "medium",
    message: "Archivio artifact predisposto come contenitore locale isolato del clone, senza Firestore o Storage business.",
    scope: "artifacts",
  },
];

function cloneReport(report: InternalAiVehicleReportPreview): InternalAiVehicleReportPreview {
  return JSON.parse(JSON.stringify(report)) as InternalAiVehicleReportPreview;
}

function cloneArtifactPayload(payload: InternalAiArtifactPayload | null): InternalAiArtifactPayload | null {
  if (!payload) {
    return null;
  }

  return {
    version: 1,
    report: cloneReport(payload.report),
    sourceDatasetLabels: [...payload.sourceDatasetLabels],
    missingDataCount: payload.missingDataCount,
    evidenceCount: payload.evidenceCount,
  };
}

function cloneSession(session: InternalAiSession): InternalAiSession {
  return {
    ...session,
    previewState: { ...session.previewState },
    approvalState: { ...session.approvalState },
  };
}

function cloneRequest(request: InternalAiRequest): InternalAiRequest {
  return {
    ...request,
    requestedAdapters: [...request.requestedAdapters],
    previewState: { ...request.previewState },
    approvalState: { ...request.approvalState },
  };
}

function cloneArtifact(artifact: InternalAiArtifact): InternalAiArtifact {
  return {
    ...artifact,
    sourceLabels: [...artifact.sourceLabels],
    tags: [...artifact.tags],
    payload: cloneArtifactPayload(artifact.payload),
  };
}

function cloneAuditEntry(entry: InternalAiAuditLogEntry): InternalAiAuditLogEntry {
  return { ...entry };
}

function createInitialState(): InternalAiRepositoryState {
  return {
    sessions: INITIAL_SESSIONS.map(cloneSession),
    requests: INITIAL_REQUESTS.map(cloneRequest),
    artifacts: INITIAL_ARTIFACTS.map(cloneArtifact),
    auditLog: INITIAL_AUDIT_LOG.map(cloneAuditEntry),
  };
}

function createPersistedStore(): InternalAiPersistedStore {
  return {
    version: 1,
    sessions: state.sessions.map(cloneSession),
    requests: state.requests.map(cloneRequest),
    artifacts: state.artifacts.map(cloneArtifact),
    auditLog: state.auditLog.map(cloneAuditEntry),
  };
}

function parsePersistedStore(raw: string | null): InternalAiRepositoryState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<InternalAiPersistedStore> | null;
    if (!parsed || parsed.version !== 1) {
      return null;
    }

    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions.map(cloneSession) : createInitialState().sessions,
      requests: Array.isArray(parsed.requests) ? parsed.requests.map(cloneRequest) : createInitialState().requests,
      artifacts: Array.isArray(parsed.artifacts) ? parsed.artifacts.map(cloneArtifact) : createInitialState().artifacts,
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog.map(cloneAuditEntry) : createInitialState().auditLog,
    };
  } catch {
    return null;
  }
}

function persistState(): boolean {
  if (!canUseStorage()) {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createPersistedStore()));
    return true;
  } catch {
    return false;
  }
}

let state = createInitialState();
let isHydrated = false;

function ensureStateLoaded() {
  if (isHydrated) {
    return;
  }

  if (canUseStorage()) {
    const parsed = parsePersistedStore(window.localStorage.getItem(STORAGE_KEY));
    if (parsed) {
      state = parsed;
    }
  }

  isHydrated = true;
}

function createSnapshot(): InternalAiScaffoldSnapshot {
  return {
    summary: createSummary(),
    sessions: state.sessions.map(cloneSession),
    requests: state.requests.map(cloneRequest),
    artifacts: state.artifacts.map(cloneArtifact),
    auditLog: state.auditLog.map(cloneAuditEntry),
    contractCatalog: INTERNAL_AI_CONTRACTS,
  };
}

function buildRequestStatus(
  approvalState: InternalAiDraftArtifactInput["report"]["approvalState"]["status"],
  previewState: InternalAiDraftArtifactInput["report"]["previewState"]["status"],
): InternalAiRequest["status"] {
  if (previewState === "discarded" || approvalState === "rejected") {
    return "discarded";
  }
  if (approvalState === "revision_requested" || previewState === "revision_requested") {
    return "revision_requested";
  }
  if (approvalState === "awaiting_approval") {
    return "awaiting_approval";
  }
  return "preview_ready";
}

export function readInternalAiScaffoldSnapshot(): InternalAiScaffoldSnapshot {
  ensureStateLoaded();
  return createSnapshot();
}

export function saveInternalAiDraftArtifact(
  input: InternalAiDraftArtifactInput,
): {
  session: InternalAiSession;
  request: InternalAiRequest;
  artifact: InternalAiArtifact;
} {
  ensureStateLoaded();

  const now = new Date().toISOString();
  const safeTarga = input.report.mezzoTarga.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const seed = Date.now().toString(36);
  const sessionId = `session-report-${safeTarga}-${seed}`;
  const requestId = `request-report-${safeTarga}-${seed}`;
  const artifactId = `artifact-report-${safeTarga}-${seed}`;
  const storageMode = getArtifactStorageMode();

  const session: InternalAiSession = {
    id: sessionId,
    title: `Draft report targa ${input.report.mezzoTarga}`,
    scope: "/next/ia/interna/sessioni",
    status:
      input.report.previewState.status === "discarded"
        ? "closed"
        : input.report.approvalState.status === "revision_requested"
          ? "review_queue"
          : "active_preview",
    createdAt: now,
    updatedAt: now,
    previewState: input.report.previewState,
    approvalState: input.report.approvalState,
  };

  const request: InternalAiRequest = {
    id: requestId,
    title: `Artifact report targa ${input.report.mezzoTarga}`,
    sessionId,
    target: "report-page",
    requestedAdapters: ["retrieval-data", "artifact-repository", "approval-workflow"],
    status: buildRequestStatus(
      input.report.approvalState.status,
      input.report.previewState.status,
    ),
    previewState: input.report.previewState,
    approvalState: input.report.approvalState,
    note: `Artifact locale del report targa salvato con ${input.report.sources.length} fonti lette e ${input.report.missingData.length} dati mancanti espliciti.`,
  };

  const artifact: InternalAiArtifact = {
    id: artifactId,
    requestId,
    sourceSessionId: sessionId,
    title: `Draft report targa ${input.report.mezzoTarga}`,
    kind: "report_preview",
    status: "draft",
    storageMode,
    isPersisted: storageMode === "local_storage_isolated",
    mezzoTarga: input.report.mezzoTarga,
    createdAt: now,
    updatedAt: now,
    sourceRequestTitle: request.title,
    sourceLabels: input.report.sources.flatMap((source) => source.datasetLabels).slice(0, 8),
    version: 1,
    tags: ["report-targa", input.report.mezzoTarga.toLowerCase(), "draft"],
    note:
      storageMode === "local_storage_isolated"
        ? "Draft salvato nell'archivio locale isolato del sottosistema IA."
        : "Draft disponibile solo in memoria locale di fallback del sottosistema IA.",
    payload: {
      version: 1,
      report: cloneReport(input.report),
      sourceDatasetLabels: input.report.sources.flatMap((source) => source.datasetLabels),
      missingDataCount: input.report.missingData.length,
      evidenceCount: input.report.evidences.length,
    },
  };

  const auditEntry: InternalAiAuditLogEntry = {
    id: `audit-report-${safeTarga}-${seed}`,
    createdAt: now,
    severity: "info",
    riskLevel: "low",
    message:
      storageMode === "local_storage_isolated"
        ? `Draft del report targa ${input.report.mezzoTarga} salvato nell'archivio locale isolato del sottosistema IA.`
        : `Draft del report targa ${input.report.mezzoTarga} mantenuto solo in memoria locale di fallback.`,
    scope: "report-preview",
  };

  state.sessions = [session, ...state.sessions];
  state.requests = [request, ...state.requests];
  state.artifacts = [artifact, ...state.artifacts];
  state.auditLog = [auditEntry, ...state.auditLog];

  if (!persistState()) {
    artifact.storageMode = "mock_memory_only";
    artifact.isPersisted = false;
    artifact.note = "Draft mantenuto solo in memoria locale di fallback; persistenza locale non disponibile.";
    auditEntry.severity = "warning";
    auditEntry.message = `Draft del report targa ${input.report.mezzoTarga} non persistito su archivio locale; attivo solo fallback in memoria.`;
  }

  return { session, request, artifact };
}

export function archiveInternalAiArtifact(artifactId: string): InternalAiArtifact | null {
  ensureStateLoaded();

  const artifact = state.artifacts.find((entry) => entry.id === artifactId);
  if (!artifact) {
    return null;
  }

  const now = new Date().toISOString();
  artifact.status = "archived";
  artifact.updatedAt = now;
  artifact.tags = Array.from(new Set([...artifact.tags.filter((tag) => tag !== "draft"), "archiviato"]));
  artifact.note = artifact.isPersisted
    ? "Artifact archiviato nell'archivio locale isolato del sottosistema IA."
    : "Artifact archiviato solo in memoria locale di fallback del sottosistema IA.";

  state.auditLog = [
    {
      id: `audit-archive-${artifact.id}-${Date.now().toString(36)}`,
      createdAt: now,
      severity: "info",
      riskLevel: "low",
      message: `Artifact ${artifact.title} portato allo stato archiviato nel perimetro IA interno.`,
      scope: "artifacts",
    },
    ...state.auditLog,
  ];

  persistState();
  return cloneArtifact(artifact);
}
