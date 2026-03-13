import { INTERNAL_AI_CONTRACTS } from "./internalAiContracts";
import { getInternalAiTrackingPersistenceMode } from "./internalAiTracking";
import type {
  InternalAiApprovalState,
  InternalAiArtifactFamily,
  InternalAiDraftArtifactInput,
  InternalAiArtifact,
  InternalAiArtifactPayload,
  InternalAiArtifactStorageMode,
  InternalAiAuditLogEntry,
  InternalAiReportPreview,
  InternalAiRequest,
  InternalAiScaffoldSummary,
  InternalAiSession,
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

function normalizedPeriodTag(value: string): string {
  return `periodo-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "non-definito"}`;
}

function normalizeSearchValue(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function mapArtifactFamiliesFromDatasets(datasetLabels: string[]): InternalAiArtifactFamily[] {
  const joined = datasetLabels.join(" ").toLowerCase();
  const families: InternalAiArtifactFamily[] = [];

  if (
    joined.includes("@lavori") ||
    joined.includes("@materialiconsegnati") ||
    joined.includes("@alerts_state") ||
    joined.includes("@storico_eventi_operativi") ||
    joined.includes("@autisti_sessione_attive") ||
    joined.includes("@segnalazioni") ||
    joined.includes("@controlli")
  ) {
    families.push("operativo");
  }
  if (joined.includes("@manutenzioni")) {
    families.push("manutenzioni");
  }
  if (joined.includes("@rifornimenti")) {
    families.push("rifornimenti");
  }
  if (joined.includes("@costimezzo") || joined.includes("@analisi_economica_mezzi")) {
    families.push("costi");
  }
  if (joined.includes("@documenti")) {
    families.push("documenti");
  }

  return dedupeStrings(families) as InternalAiArtifactFamily[];
}

function deriveArtifactFamilyMeta(datasetLabels: string[]): {
  primaryFamily: InternalAiArtifactFamily;
  reportFamilies: InternalAiArtifactFamily[];
} {
  const reportFamilies = mapArtifactFamiliesFromDatasets(datasetLabels);
  if (reportFamilies.length === 0) {
    return {
      primaryFamily: "non_classificato",
      reportFamilies: ["non_classificato"],
    };
  }

  if (reportFamilies.length === 1) {
    return {
      primaryFamily: reportFamilies[0],
      reportFamilies,
    };
  }

  return {
    primaryFamily: "misto",
    reportFamilies,
  };
}

function buildArtifactSearchText(args: {
  title: string;
  targetLabel: string | null;
  mezzoTarga: string | null;
  autistaNome: string | null;
  periodLabel: string | null;
  requestTitle: string;
  sourceLabels: string[];
  tags: string[];
  families: InternalAiArtifactFamily[];
  report: InternalAiReportPreview | null;
}): string {
  const report = args.report;
  const reportDetails =
    report?.reportType === "autista"
      ? [report.header.nomeCompleto, report.header.badge]
      : report?.reportType === "combinato"
        ? [report.header.nomeCompletoAutista, report.header.badgeAutista, report.header.targa]
        : report
          ? [report.header.targa, report.header.autistaNome]
          : [];

  return normalizeSearchValue(
    [
      args.title,
      args.targetLabel,
      args.mezzoTarga,
      args.autistaNome,
      args.periodLabel,
      args.requestTitle,
      ...args.sourceLabels,
      ...args.tags,
      ...args.families,
      ...(report?.sources.flatMap((source) => [source.title, ...source.datasetLabels]) ?? []),
      ...(report?.sections.flatMap((section) => [section.title, section.summary]) ?? []),
      ...(report?.cards.flatMap((card) => [card.label, card.value, card.meta]) ?? []),
      ...reportDetails,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function hydrateArtifact(artifact: InternalAiArtifact): InternalAiArtifact {
  const payload = artifact.payload ? cloneArtifactPayload(artifact.payload) : null;
  const derivedSourceLabels = dedupeStrings([
    ...artifact.sourceLabels,
    ...(payload?.sourceDatasetLabels ?? []),
  ]);
  const familyMeta = deriveArtifactFamilyMeta(derivedSourceLabels);
  const report = payload?.report ?? null;
  const autistaNome =
    artifact.autistaNome ??
    (report?.reportType === "autista"
      ? report.header.nomeCompleto
      : report?.reportType === "combinato"
        ? report.header.nomeCompletoAutista
        : null);
  const mezzoTarga =
    artifact.mezzoTarga ??
    (report?.reportType === "targa" || report?.reportType === "combinato" ? report.mezzoTarga : null);
  const periodLabel = artifact.periodLabel ?? report?.periodContext.label ?? null;
  const matchingReliability =
    artifact.matchingReliability ??
    (report?.reportType === "combinato" ? report.header.affidabilitaLegame : null);
  const tags = dedupeStrings([
    ...artifact.tags,
    artifact.reportType
      ? artifact.reportType === "targa"
        ? "report-targa"
        : artifact.reportType === "autista"
          ? "report-autista"
          : "report-combinato"
      : "",
    ...familyMeta.reportFamilies.map((family) => `famiglia-${family}`),
    `stato-${artifact.status}`,
  ]);
  const searchText =
    artifact.searchText ||
    buildArtifactSearchText({
      title: artifact.title,
      targetLabel: artifact.targetLabel,
      mezzoTarga,
      autistaNome,
      periodLabel,
      requestTitle: artifact.sourceRequestTitle,
      sourceLabels: derivedSourceLabels,
      tags,
      families: artifact.reportType ? familyMeta.reportFamilies : [],
      report,
    });

  return {
    ...artifact,
    mezzoTarga,
    autistaNome,
    periodLabel,
    sourceLabels: derivedSourceLabels,
    tags,
    payload:
      payload && payload.searchableSummary === undefined
        ? {
            ...payload,
            searchableSummary: report ? searchText : null,
          }
        : payload,
    primaryFamily: artifact.reportType ? artifact.primaryFamily ?? familyMeta.primaryFamily : null,
    reportFamilies: artifact.reportType
      ? artifact.reportFamilies?.length
        ? dedupeStrings(artifact.reportFamilies) as InternalAiArtifactFamily[]
        : familyMeta.reportFamilies
      : [],
    searchText,
    matchingReliability,
  };
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
    reportType: "targa",
    targetLabel: "Anteprima report targa",
    periodLabel: null,
    mezzoTarga: null,
    autistaId: null,
    autistaNome: null,
    primaryFamily: null,
    reportFamilies: [],
    searchText: "",
    matchingReliability: null,
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
    reportType: null,
    targetLabel: null,
    periodLabel: null,
    mezzoTarga: null,
    autistaId: null,
    autistaNome: null,
    primaryFamily: null,
    reportFamilies: [],
    searchText: "",
    matchingReliability: null,
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

function cloneReport(report: InternalAiReportPreview): InternalAiReportPreview {
  return JSON.parse(JSON.stringify(report)) as InternalAiReportPreview;
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
    searchableSummary: payload.searchableSummary ?? null,
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
  return hydrateArtifact({
    ...artifact,
    sourceLabels: [...artifact.sourceLabels],
    tags: [...artifact.tags],
    payload: cloneArtifactPayload(artifact.payload),
    reportFamilies: [...(artifact.reportFamilies ?? [])],
    primaryFamily: artifact.primaryFamily ?? null,
    searchText: artifact.searchText ?? "",
    matchingReliability: artifact.matchingReliability ?? null,
  });
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
  const targetSlug = input.report.targetLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const targetTypeLabel =
    input.report.reportType === "autista"
      ? "autista"
      : input.report.reportType === "combinato"
        ? "combinato"
        : "targa";
  const targetPrimaryValue =
    input.report.reportType === "autista"
      ? input.report.header.nomeCompleto
      : input.report.reportType === "combinato"
        ? `${input.report.mezzoTarga} + ${input.report.header.nomeCompletoAutista}`
        : input.report.mezzoTarga;
  const periodLabel = input.report.periodContext.label;
  const seed = Date.now().toString(36);
  const sessionId = `session-report-${targetSlug}-${seed}`;
  const requestId = `request-report-${targetSlug}-${seed}`;
  const artifactId = `artifact-report-${targetSlug}-${seed}`;
  const storageMode = getArtifactStorageMode();

  const session: InternalAiSession = {
    id: sessionId,
    title: `Draft report ${targetTypeLabel} ${targetPrimaryValue}`,
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
    title: `Artifact report ${targetTypeLabel} ${targetPrimaryValue}`,
    sessionId,
    target: "report-page",
    requestedAdapters: ["retrieval-data", "artifact-repository", "approval-workflow"],
    status: buildRequestStatus(
      input.report.approvalState.status,
      input.report.previewState.status,
    ),
    previewState: input.report.previewState,
    approvalState: input.report.approvalState,
    note:
      `Artifact locale del report ${targetTypeLabel} salvato con periodo "${periodLabel}", ` +
      `${input.report.sources.length} fonti lette e ${input.report.missingData.length} dati mancanti espliciti.`,
  };

  const artifact: InternalAiArtifact = {
    id: artifactId,
    requestId,
    sourceSessionId: sessionId,
    title: `Draft report ${targetTypeLabel} ${targetPrimaryValue}`,
    kind: "report_preview",
    status: "draft",
    storageMode,
    isPersisted: storageMode === "local_storage_isolated",
    reportType: input.report.reportType,
    targetLabel: input.report.targetLabel,
    periodLabel,
    mezzoTarga:
      input.report.reportType === "targa" || input.report.reportType === "combinato"
        ? input.report.mezzoTarga
        : null,
    autistaId:
      input.report.reportType === "autista" || input.report.reportType === "combinato"
        ? input.report.autistaId
        : null,
    autistaNome:
      input.report.reportType === "autista"
        ? input.report.header.nomeCompleto
        : input.report.reportType === "combinato"
          ? input.report.header.nomeCompletoAutista
          : null,
    primaryFamily: null,
    reportFamilies: [],
    searchText: "",
    matchingReliability:
      input.report.reportType === "combinato" ? input.report.header.affidabilitaLegame : null,
    createdAt: now,
    updatedAt: now,
    sourceRequestTitle: request.title,
    sourceLabels: input.report.sources.flatMap((source) => source.datasetLabels).slice(0, 8),
    version: 1,
    tags: [
      input.report.reportType === "autista"
        ? "report-autista"
        : input.report.reportType === "combinato"
          ? "report-combinato"
          : "report-targa",
      targetSlug,
      normalizedPeriodTag(periodLabel),
      "draft",
    ],
    note:
      storageMode === "local_storage_isolated"
        ? `Draft del report ${targetTypeLabel} salvato nell'archivio locale isolato del sottosistema IA con periodo "${periodLabel}".`
        : `Draft del report ${targetTypeLabel} disponibile solo in memoria locale di fallback del sottosistema IA con periodo "${periodLabel}".`,
    payload: {
      version: 1,
      report: cloneReport(input.report),
      sourceDatasetLabels: input.report.sources.flatMap((source) => source.datasetLabels),
      missingDataCount: input.report.missingData.length,
      evidenceCount: input.report.evidences.length,
      searchableSummary: null,
    },
  };

  const hydratedArtifact = hydrateArtifact(artifact);
  const payloadSearchableSummary =
    hydratedArtifact.payload && hydratedArtifact.payload.report
      ? hydratedArtifact.searchText
      : null;
  if (hydratedArtifact.payload) {
    hydratedArtifact.payload.searchableSummary = payloadSearchableSummary;
  }

  const auditEntry: InternalAiAuditLogEntry = {
    id: `audit-report-${targetSlug}-${seed}`,
    createdAt: now,
    severity: "info",
    riskLevel: "low",
    message:
      storageMode === "local_storage_isolated"
        ? `Draft del report ${targetTypeLabel} ${targetPrimaryValue} salvato nell'archivio locale isolato del sottosistema IA con periodo "${periodLabel}".`
        : `Draft del report ${targetTypeLabel} ${targetPrimaryValue} mantenuto solo in memoria locale di fallback con periodo "${periodLabel}".`,
    scope: "report-preview",
  };

  state.sessions = [session, ...state.sessions];
  state.requests = [request, ...state.requests];
  state.artifacts = [hydratedArtifact, ...state.artifacts];
  state.auditLog = [auditEntry, ...state.auditLog];

  if (!persistState()) {
    hydratedArtifact.storageMode = "mock_memory_only";
    hydratedArtifact.isPersisted = false;
    hydratedArtifact.note = "Draft mantenuto solo in memoria locale di fallback; persistenza locale non disponibile.";
    auditEntry.severity = "warning";
    auditEntry.message = `Draft del report ${targetTypeLabel} ${targetPrimaryValue} non persistito su archivio locale; attivo solo fallback in memoria.`;
  }

  return { session, request, artifact: cloneArtifact(hydratedArtifact) };
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
  artifact.tags = Array.from(
    new Set([...artifact.tags.filter((tag) => tag !== "draft" && tag !== "stato-draft"), "archiviato", "stato-archived"]),
  );
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
