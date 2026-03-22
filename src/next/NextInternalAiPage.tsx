import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  NEXT_HOME_PATH,
  NEXT_IA_PATH,
  NEXT_INTERNAL_AI_ARTIFACTS_PATH,
  NEXT_INTERNAL_AI_AUDIT_PATH,
  NEXT_INTERNAL_AI_PATH,
  NEXT_INTERNAL_AI_REQUESTS_PATH,
  NEXT_INTERNAL_AI_SESSIONS_PATH,
} from "./nextStructuralPaths";
import {
  archiveInternalAiArtifact,
  readInternalAiScaffoldSnapshot,
  saveInternalAiDraftArtifact,
} from "./internal-ai/internalAiMockRepository";
import { runInternalAiChatTurn } from "./internal-ai/internalAiChatOrchestrator";
import {
  findInternalAiExactDriverMatch,
  matchInternalAiDriverLookupCandidates,
  normalizeInternalAiDriverLookupQuery,
  readInternalAiDriverLookupCatalog,
} from "./internal-ai/internalAiDriverLookup";
import {
  readInternalAiDriverReportPreview,
  type InternalAiDriverReportReadResult,
} from "./internal-ai/internalAiDriverReportFacade";
import {
  readInternalAiCombinedReportPreview,
  type InternalAiCombinedReportReadResult,
} from "./internal-ai/internalAiCombinedReportFacade";
import {
  readInternalAiVehicleReportPreview,
  type InternalAiVehicleReportReadResult,
} from "./internal-ai/internalAiVehicleReportFacade";
import {
  findInternalAiExactVehicleMatch,
  matchInternalAiVehicleLookupCandidates,
  normalizeInternalAiVehicleLookupQuery,
  readInternalAiVehicleLookupCatalog,
} from "./internal-ai/internalAiVehicleLookup";
import {
  createDefaultInternalAiReportPeriodInput,
  resolveInternalAiReportPeriodContext,
} from "./internal-ai/internalAiReportPeriod";
import {
  readInternalAiTrackingSummary,
  rememberInternalAiArtifactArchiveState,
  trackInternalAiCombinedSearch,
  trackInternalAiDriverSearch,
  trackInternalAiDriverSelection,
  subscribeInternalAiTracking,
  trackInternalAiArtifactAction,
  trackInternalAiChatPrompt,
  trackInternalAiScreenVisit,
  trackInternalAiVehicleSearch,
  trackInternalAiVehicleSelection,
} from "./internal-ai/internalAiTracking";
import type {
  InternalAiApprovalState,
  InternalAiArtifact,
  InternalAiArtifactFamily,
  InternalAiArtifactStatus,
  InternalAiCombinedMatchReliability,
  InternalAiCombinedReportPreview,
  InternalAiChatExecutionStatus,
  InternalAiDriverLookupCandidate,
  InternalAiDriverReportPreview,
  InternalAiReportPreview,
  InternalAiReportPeriodInput,
  InternalAiReportPeriodPreset,
  InternalAiChatMessage,
  InternalAiPreviewState,
  InternalAiReportType,
  InternalAiVehicleLookupCandidate,
  InternalAiVehicleLookupMatchState,
  InternalAiVehicleReportPreview,
  NextInternalAiSectionId,
} from "./internal-ai/internalAiTypes";
import "./next-shell.css";
import "./internal-ai/internal-ai.css";

type NextInternalAiPageProps = {
  sectionId?: NextInternalAiSectionId;
};

type ReportRequestState =
  | {
      status: "idle";
      message: string | null;
    }
  | {
      status: "loading";
      message: string;
    }
  | {
      status: "invalid_query" | "not_found" | "error";
      message: string;
    }
  | {
      status: "ready";
      message: string;
    };

type LookupCatalogState =
  | {
      status: "loading";
      items: InternalAiVehicleLookupCandidate[];
      message: string | null;
    }
  | {
      status: "ready";
      items: InternalAiVehicleLookupCandidate[];
      message: string | null;
    }
  | {
      status: "error";
      items: InternalAiVehicleLookupCandidate[];
      message: string;
    };

type ActiveReportState = {
  report: InternalAiReportPreview | null;
  draftMessage: string | null;
};

const SECTION_CONFIGS: Record<
  NextInternalAiSectionId,
  { title: string; description: string; path: string }
> = {
  overview: {
    title: "Panoramica",
    description: "Ricerca targa, anteprima report in sola lettura e guard rail del sottosistema IA.",
    path: NEXT_INTERNAL_AI_PATH,
  },
  sessions: {
    title: "Sessioni",
    description: "Scaffold locale `ai_sessions` per anteprima e revisione.",
    path: NEXT_INTERNAL_AI_SESSIONS_PATH,
  },
  requests: {
    title: "Richieste",
    description: "Stati `ai_requests` con anteprima, approvazione, revisione e scarto solo simulati.",
    path: NEXT_INTERNAL_AI_REQUESTS_PATH,
  },
  artifacts: {
    title: "Archivio artifact IA",
    description: "Archivio locale isolato del sottosistema IA, separato dai dati business.",
    path: NEXT_INTERNAL_AI_ARTIFACTS_PATH,
  },
  audit: {
    title: "Registro audit",
    description: "Audit locale e tracking d'uso in memoria confinati al subtree IA interno.",
    path: NEXT_INTERNAL_AI_AUDIT_PATH,
  },
};

const PREVIEW_STATUS_LABELS: Record<string, string> = {
  idle: "In attesa",
  preview_ready: "Anteprima pronta",
  revision_requested: "Da rivedere",
  discarded: "Scartata",
};

const APPROVAL_STATUS_LABELS: Record<string, string> = {
  not_requested: "Non richiesta",
  awaiting_approval: "Approvabile",
  approved: "Approvata",
  rejected: "Respinta",
  revision_requested: "Revisione richiesta",
};

const REQUEST_TARGET_LABELS: Record<string, string> = {
  "report-page": "Report targa in anteprima",
  tracking: "Tracking isolato",
  "artifact-archive": "Archivio artifact IA",
};

const SECTION_STATUS_LABELS: Record<string, string> = {
  completa: "Completa",
  parziale: "Parziale",
  vuota: "Vuota",
  errore: "Errore",
};

const SOURCE_STATUS_LABELS: Record<string, string> = {
  disponibile: "Disponibile",
  parziale: "Parziale",
  errore: "Errore",
};

const SESSION_STATUS_LABELS: Record<string, string> = {
  draft: "Bozza",
  active_preview: "Anteprima attiva",
  review_queue: "In revisione",
  closed: "Chiusa",
};

const ARTIFACT_STATUS_LABELS: Record<string, string> = {
  draft: "Bozza",
  preview: "Anteprima",
  archived: "Archiviato",
};

const ARTIFACT_KIND_LABELS: Record<string, string> = {
  report_preview: "Report in anteprima",
  contract_catalog: "Catalogo contratti segnaposto",
  retrieval_snapshot: "Snapshot recupero contesto",
  checklist: "Checklist",
};

const ARTIFACT_STORAGE_LABELS: Record<string, string> = {
  mock_memory_only: "Memoria locale di fallback",
  local_storage_isolated: "Archivio locale isolato",
};

const AUDIT_SEVERITY_LABELS: Record<string, string> = {
  info: "Informazione",
  warning: "Avviso",
  critical: "Critico",
};

const AUDIT_RISK_LABELS: Record<string, string> = {
  low: "Basso",
  medium: "Medio",
  high: "Alto",
};

const AUDIT_SCOPE_LABELS: Record<string, string> = {
  preview: "Anteprima",
  tracking: "Tracking",
  artifacts: "Archivio artifact IA",
  "report-preview": "Report targa",
};

const CHAT_STATUS_LABELS: Record<InternalAiChatExecutionStatus, string> = {
  idle: "Pronta",
  running: "In elaborazione",
  completed: "Eseguita",
  partial: "Parziale",
  not_supported: "Non supportata",
  failed: "Errore",
};

const CHAT_SUGGESTIONS = [
  "Cosa puoi fare",
  "Crea report targa AB123CD ultimi 30 giorni",
  "Fammi un report per l'autista Mario Rossi",
  "Fammi report mezzo TI123456 con autista Mario Rossi ultimi 30 giorni",
  "Fammi una preview per la targa TI123456 ultimi 90 giorni",
  "Analizza il mezzo AA111AA",
];

const LOOKUP_MATCH_LABELS: Record<InternalAiVehicleLookupMatchState, string> = {
  idle: "In attesa",
  loading: "Caricamento",
  empty_query: "Inserimento richiesto",
  no_match: "Nessuna corrispondenza",
  exact_match: "Corrispondenza precisa",
  multiple_matches: "Selezione richiesta",
  selected: "Mezzo selezionato",
  error: "Errore",
};

const PERIOD_PRESET_LABELS: Record<InternalAiReportPeriodPreset, string> = {
  all: "Tutto",
  last_30_days: "Ultimi 30 giorni",
  last_90_days: "Ultimi 90 giorni",
  last_full_month: "Ultimo mese",
  custom: "Personalizzato",
};

const PERIOD_STATUS_LABELS: Record<string, string> = {
  nessun_filtro: "Nessun filtro",
  applicato: "Filtro applicato",
  non_applicabile: "Fuori filtro",
  non_disponibile: "Periodo non disponibile",
};

const REPORT_TYPE_LABELS: Record<InternalAiReportType, string> = {
  targa: "Report targa",
  autista: "Report autista",
  combinato: "Report combinato",
};

const COMBINED_RELIABILITY_LABELS: Record<InternalAiCombinedMatchReliability, string> = {
  forte: "Legame forte",
  plausibile: "Legame plausibile",
  non_dimostrabile: "Legame non dimostrabile",
};

const VEHICLE_SEARCH_SOURCE_LABELS: Record<string, string> = {
  manuale: "Manuale",
  selezione_guidata: "Selezione guidata",
  chat: "Chat",
};

const VEHICLE_SEARCH_RESULT_LABELS: Record<string, string> = {
  selected: "Selezionata",
  ready: "Anteprima eseguita",
  not_found: "Non trovata",
  invalid_query: "Query non valida",
};

const DRIVER_SEARCH_SOURCE_LABELS: Record<string, string> = {
  manuale: "Manuale",
  selezione_guidata: "Selezione guidata",
  chat: "Chat",
};

const DRIVER_SEARCH_RESULT_LABELS: Record<string, string> = {
  selected: "Selezionato",
  ready: "Anteprima eseguita",
  not_found: "Non trovato",
  invalid_query: "Query non valida",
};

const ARTIFACT_ACTION_LABELS: Record<string, string> = {
  saved: "Salvato",
  opened: "Riaperto",
  archived: "Archiviato",
};

const ARTIFACT_FAMILY_LABELS: Record<InternalAiArtifactFamily, string> = {
  operativo: "Operativo",
  manutenzioni: "Manutenzioni",
  rifornimenti: "Rifornimenti",
  costi: "Costi",
  documenti: "Documenti",
  misto: "Misto",
  non_classificato: "Non classificato",
};

const ARCHIVE_TYPE_FILTER_LABELS: Record<InternalAiReportType | "tutti", string> = {
  tutti: "Tutti i tipi",
  targa: "Report mezzo",
  autista: "Report autista",
  combinato: "Report combinato",
};

const ARCHIVE_STATUS_FILTER_LABELS: Record<InternalAiArtifactStatus | "tutti", string> = {
  tutti: "Tutti gli stati",
  draft: "Bozza",
  preview: "Anteprima",
  archived: "Archiviato",
};

const ARCHIVE_FAMILY_FILTER_LABELS: Record<InternalAiArtifactFamily | "tutte", string> = {
  tutte: "Tutti gli ambiti",
  operativo: "Operativo",
  manutenzioni: "Manutenzioni",
  rifornimenti: "Rifornimenti",
  costi: "Costi",
  documenti: "Documenti",
  misto: "Misto",
  non_classificato: "Non classificato",
};

function statusToneClass(status: string) {
  if (
    status.includes("warning") ||
    status.includes("awaiting") ||
    status.includes("revision") ||
    status.includes("preview") ||
    status.includes("parziale")
  ) {
    return "internal-ai-pill is-warning";
  }

  if (status.includes("reject") || status.includes("discard") || status.includes("errore")) {
    return "internal-ai-pill is-danger";
  }

  return "internal-ai-pill is-neutral";
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("it-IT");
}

function renderPreviewState(previewState: InternalAiPreviewState) {
  return (
    <div className="internal-ai-pill-row">
      <span className={statusToneClass(previewState.status)}>
        Anteprima: {PREVIEW_STATUS_LABELS[previewState.status] ?? previewState.status}
      </span>
      <span className="internal-ai-pill is-neutral">{formatDateLabel(previewState.updatedAt)}</span>
      <span className="internal-ai-muted">{previewState.note}</span>
    </div>
  );
}

function renderApprovalState(approvalState: InternalAiApprovalState) {
  return (
    <div className="internal-ai-pill-row">
      <span className={statusToneClass(approvalState.status)}>
        Stato: {APPROVAL_STATUS_LABELS[approvalState.status] ?? approvalState.status}
      </span>
      <span className="internal-ai-pill is-neutral">{approvalState.requestedBy}</span>
      <span className="internal-ai-muted">{approvalState.note}</span>
    </div>
  );
}

function createChatMessage(args: {
  role: InternalAiChatMessage["role"];
  text: string;
  intent: InternalAiChatMessage["intent"];
  status: InternalAiChatMessage["status"];
  references?: InternalAiChatMessage["references"];
}): InternalAiChatMessage {
  return {
    id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    role: args.role,
    createdAt: new Date().toISOString(),
    text: args.text,
    intent: args.intent,
    status: args.status,
    references: args.references ?? [],
  };
}

function createWelcomeChatMessage(): InternalAiChatMessage {
  return createChatMessage({
    role: "assistente",
    intent: "capabilities",
    status: "completed",
    text:
      "Chat interna controllata attiva.\n\n" +
      "Posso aiutarti con richieste sicure gia supportate dal sottosistema IA interno, in particolare la preview report per targa, per autista o combinata mezzo + autista in sola lettura.\n\n" +
      'Prova con: "crea report targa AB123CD ultimi 30 giorni", "fammi un report per l\'autista Mario Rossi ultimo mese", "fammi report mezzo TI123456 con autista Mario Rossi ultimi 30 giorni" oppure "cosa puoi fare".',
    references: [
      {
        type: "safe_mode_notice",
        label: "Modalita sicura e controllata",
        targa: null,
      },
    ],
  });
}

function formatVehicleLookupDescription(candidate: InternalAiVehicleLookupCandidate) {
  return [
    candidate.marcaModello,
    candidate.categoria !== "Senza categoria" ? candidate.categoria : null,
    candidate.autistaNome ? `Autista ${candidate.autistaNome}` : null,
  ]
    .filter(Boolean)
    .join(" - ");
}

function formatDriverLookupDescription(candidate: InternalAiDriverLookupCandidate) {
  return [
    candidate.badge ? `Badge ${candidate.badge}` : null,
    candidate.telefono ? `Tel. ${candidate.telefono}` : null,
    candidate.mezziAssociatiCount
      ? `${candidate.mezziAssociatiCount} mezzi associati`
      : "Nessun mezzo associato",
  ]
    .filter(Boolean)
    .join(" - ");
}

function getReportTypeLabel(report: InternalAiReportPreview) {
  return REPORT_TYPE_LABELS[report.reportType] ?? report.reportType;
}

function getReportTargetChip(report: InternalAiReportPreview) {
  if (report.reportType === "autista") {
    return `Autista ${report.header.nomeCompleto}`;
  }

  if (report.reportType === "combinato") {
    return `Mezzo ${report.header.targa} con ${report.header.nomeCompletoAutista}`;
  }

  return `Targa ${report.header.targa}`;
}

function getReportHeaderMetaChip(report: InternalAiReportPreview) {
  if (report.reportType === "targa") {
    return `Categoria ${report.header.categoria ?? "non disponibile"}`;
  }

  if (report.reportType === "autista") {
    return `Badge ${report.header.badge ?? "non disponibile"}`;
  }

  return COMBINED_RELIABILITY_LABELS[report.header.affidabilitaLegame];
}

function getArtifactTargetLabel(args: {
  reportType: InternalAiReportType | null;
  targetLabel: string | null;
  mezzoTarga: string | null;
}) {
  if (args.reportType && args.targetLabel) {
    return `${REPORT_TYPE_LABELS[args.reportType] ?? args.reportType} ${args.targetLabel}`;
  }

  return args.mezzoTarga ?? "non applicabile";
}

function normalizeArchiveFilterValue(value: string): string {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getArtifactFamilyLabel(artifact: InternalAiArtifact): string {
  if (!artifact.reportType) {
    return "Tecnico";
  }

  return ARTIFACT_FAMILY_LABELS[artifact.primaryFamily ?? "non_classificato"];
}

function buildArtifactScopeSummary(artifact: InternalAiArtifact): string {
  if (artifact.reportFamilies.length === 0) {
    return getArtifactFamilyLabel(artifact);
  }

  if (artifact.primaryFamily === "misto") {
    return artifact.reportFamilies
      .map((family) => ARTIFACT_FAMILY_LABELS[family] ?? family)
      .join(" + ");
  }

  return getArtifactFamilyLabel(artifact);
}

function buildArchiveFilterSummary(args: {
  query: string;
  reportType: InternalAiReportType | "tutti";
  status: InternalAiArtifactStatus | "tutti";
  family: InternalAiArtifactFamily | "tutte";
  targa: string;
  autista: string;
  period: string;
}): string {
  const parts: string[] = [];
  if (args.query.trim()) parts.push(`ricerca ${args.query.trim()}`);
  if (args.reportType !== "tutti") parts.push(ARCHIVE_TYPE_FILTER_LABELS[args.reportType]);
  if (args.status !== "tutti") parts.push(ARCHIVE_STATUS_FILTER_LABELS[args.status]);
  if (args.family !== "tutte") parts.push(ARCHIVE_FAMILY_FILTER_LABELS[args.family]);
  if (args.targa.trim()) parts.push(`targa ${args.targa.trim()}`);
  if (args.autista.trim()) parts.push(`autista ${args.autista.trim()}`);
  if (args.period.trim()) parts.push(`periodo ${args.period.trim()}`);
  return parts.length ? parts.join(" | ") : "Nessun filtro archivio attivo";
}

function cloneReportPreview(report: InternalAiReportPreview): InternalAiReportPreview {
  return JSON.parse(JSON.stringify(report)) as InternalAiReportPreview;
}

function buildPeriodInputFromReport(report: InternalAiReportPreview): InternalAiReportPeriodInput {
  return {
    preset: report.periodContext.preset,
    fromDate: report.periodContext.fromDate,
    toDate: report.periodContext.toDate,
  };
}

function buildContractLabelMap(contractCatalog: ReturnType<typeof readInternalAiScaffoldSnapshot>["contractCatalog"]) {
  return new Map<string, string>(contractCatalog.map((entry) => [entry.id, entry.title]));
}

function NextInternalAiPage({ sectionId = "overview" }: NextInternalAiPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const section = SECTION_CONFIGS[sectionId];
  const [snapshotVersion, setSnapshotVersion] = useState(0);
  const snapshot = useMemo(() => {
    void snapshotVersion;
    return readInternalAiScaffoldSnapshot();
  }, [snapshotVersion]);
  const contractLabelMap = useMemo(
    () => buildContractLabelMap(snapshot.contractCatalog),
    [snapshot.contractCatalog],
  );
  const tracking = useSyncExternalStore(
    subscribeInternalAiTracking,
    readInternalAiTrackingSummary,
    readInternalAiTrackingSummary,
  );
  const [targaInput, setTargaInput] = useState("");
  const [driverInput, setDriverInput] = useState("");
  const [reportPeriodInput, setReportPeriodInput] = useState<InternalAiReportPeriodInput>(() =>
    createDefaultInternalAiReportPeriodInput(),
  );
  const [lookupCatalog, setLookupCatalog] = useState<LookupCatalogState>({
    status: "loading",
    items: [],
    message: null,
  });
  const [driverLookupCatalog, setDriverLookupCatalog] = useState<{
    status: "loading" | "ready" | "error";
    items: InternalAiDriverLookupCandidate[];
    message: string | null;
  }>({
    status: "loading",
    items: [],
    message: null,
  });
  const [selectedVehicle, setSelectedVehicle] = useState<InternalAiVehicleLookupCandidate | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<InternalAiDriverLookupCandidate | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<InternalAiChatMessage[]>(() => [
    createWelcomeChatMessage(),
  ]);
  const [chatStatus, setChatStatus] = useState<InternalAiChatExecutionStatus>("idle");
  const [openedArtifactId, setOpenedArtifactId] = useState<string | null>(null);
  const [artifactSearchQuery, setArtifactSearchQuery] = useState(
    () => tracking.sessionState.lastArchiveQuery ?? "",
  );
  const [artifactTypeFilter, setArtifactTypeFilter] = useState<InternalAiReportType | "tutti">(
    () => tracking.sessionState.lastArchiveReportType ?? "tutti",
  );
  const [artifactStatusFilter, setArtifactStatusFilter] = useState<
    InternalAiArtifactStatus | "tutti"
  >(() => tracking.sessionState.lastArchiveStatus ?? "tutti");
  const [artifactFamilyFilter, setArtifactFamilyFilter] = useState<
    InternalAiArtifactFamily | "tutte"
  >(() => tracking.sessionState.lastArchiveFamily ?? "tutte");
  const [artifactTargaFilter, setArtifactTargaFilter] = useState(
    () => tracking.sessionState.lastArchiveTarga ?? "",
  );
  const [artifactAutistaFilter, setArtifactAutistaFilter] = useState(
    () => tracking.sessionState.lastArchiveAutista ?? "",
  );
  const [artifactPeriodFilter, setArtifactPeriodFilter] = useState(
    () => tracking.sessionState.lastArchivePeriod ?? "",
  );
  const [vehicleRequestState, setVehicleRequestState] = useState<ReportRequestState>({
    status: "idle",
    message: null,
  });
  const [driverRequestState, setDriverRequestState] = useState<ReportRequestState>({
    status: "idle",
    message: null,
  });
  const [combinedRequestState, setCombinedRequestState] = useState<ReportRequestState>({
    status: "idle",
    message: null,
  });
  const [activeReportState, setActiveReportState] = useState<ActiveReportState>({
    report: null,
    draftMessage: null,
  });
  const openedArtifact = useMemo(
    () => snapshot.artifacts.find((artifact) => artifact.id === openedArtifactId) ?? null,
    [openedArtifactId, snapshot.artifacts],
  );
  const persistedArtifactsCount = snapshot.artifacts.filter((artifact) => artifact.isPersisted).length;
  const sortedArtifacts = useMemo(
    () =>
      [...snapshot.artifacts].sort((left, right) => {
        const leftTs = new Date(left.updatedAt ?? left.createdAt).getTime();
        const rightTs = new Date(right.updatedAt ?? right.createdAt).getTime();
        return rightTs - leftTs;
      }),
    [snapshot.artifacts],
  );
  const archivePeriodOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sortedArtifacts
            .map((artifact) => artifact.periodLabel?.trim() ?? "")
            .filter((label) => label.length > 0),
        ),
      ),
    [sortedArtifacts],
  );
  const normalizedArchiveQuery = useMemo(
    () => normalizeArchiveFilterValue(artifactSearchQuery),
    [artifactSearchQuery],
  );
  const normalizedArchiveTargaFilter = useMemo(
    () => normalizeArchiveFilterValue(artifactTargaFilter),
    [artifactTargaFilter],
  );
  const normalizedArchiveAutistaFilter = useMemo(
    () => normalizeArchiveFilterValue(artifactAutistaFilter),
    [artifactAutistaFilter],
  );
  const normalizedArchivePeriodFilter = useMemo(
    () => normalizeArchiveFilterValue(artifactPeriodFilter),
    [artifactPeriodFilter],
  );
  const filteredArtifacts = useMemo(
    () =>
      sortedArtifacts.filter((artifact) => {
        if (artifactTypeFilter !== "tutti" && artifact.reportType !== artifactTypeFilter) {
          return false;
        }

        if (artifactStatusFilter !== "tutti" && artifact.status !== artifactStatusFilter) {
          return false;
        }

        if (artifactFamilyFilter !== "tutte") {
          const familyMatches =
            artifact.primaryFamily === artifactFamilyFilter ||
            artifact.reportFamilies.includes(artifactFamilyFilter);
          if (!familyMatches) {
            return false;
          }
        }

        if (normalizedArchiveQuery) {
          const haystack = normalizeArchiveFilterValue(
            artifact.searchText ||
              [
                artifact.title,
                artifact.targetLabel,
                artifact.mezzoTarga,
                artifact.autistaNome,
                artifact.periodLabel,
                artifact.note,
                artifact.tags.join(" "),
              ]
                .filter(Boolean)
                .join(" "),
          );
          if (!haystack.includes(normalizedArchiveQuery)) {
            return false;
          }
        }

        if (
          normalizedArchiveTargaFilter &&
          !normalizeArchiveFilterValue(artifact.mezzoTarga ?? "").includes(
            normalizedArchiveTargaFilter,
          )
        ) {
          return false;
        }

        if (
          normalizedArchiveAutistaFilter &&
          !normalizeArchiveFilterValue(
            artifact.autistaNome ?? artifact.targetLabel ?? artifact.payload?.report.targetLabel ?? "",
          ).includes(normalizedArchiveAutistaFilter)
        ) {
          return false;
        }

        if (
          normalizedArchivePeriodFilter &&
          !normalizeArchiveFilterValue(artifact.periodLabel ?? "").includes(normalizedArchivePeriodFilter)
        ) {
          return false;
        }

        return true;
      }),
    [
      artifactFamilyFilter,
      artifactStatusFilter,
      artifactTypeFilter,
      normalizedArchiveAutistaFilter,
      normalizedArchivePeriodFilter,
      normalizedArchiveQuery,
      normalizedArchiveTargaFilter,
      sortedArtifacts,
    ],
  );
  const archiveHasActiveFilters =
    artifactSearchQuery.trim().length > 0 ||
    artifactTypeFilter !== "tutti" ||
    artifactStatusFilter !== "tutti" ||
    artifactFamilyFilter !== "tutte" ||
    artifactTargaFilter.trim().length > 0 ||
    artifactAutistaFilter.trim().length > 0 ||
    artifactPeriodFilter.trim().length > 0;
  const archiveFilterSummary = useMemo(
    () =>
      buildArchiveFilterSummary({
        query: artifactSearchQuery,
        reportType: artifactTypeFilter,
        status: artifactStatusFilter,
        family: artifactFamilyFilter,
        targa: artifactTargaFilter,
        autista: artifactAutistaFilter,
        period: artifactPeriodFilter,
      }),
    [
      artifactAutistaFilter,
      artifactFamilyFilter,
      artifactPeriodFilter,
      artifactSearchQuery,
      artifactStatusFilter,
      artifactTargaFilter,
      artifactTypeFilter,
    ],
  );
  const normalizedLookupQuery = useMemo(
    () => normalizeInternalAiVehicleLookupQuery(targaInput),
    [targaInput],
  );
  const lookupSuggestions = useMemo(
    () => matchInternalAiVehicleLookupCandidates(lookupCatalog.items, targaInput),
    [lookupCatalog.items, targaInput],
  );
  const exactVehicleMatch = useMemo(
    () => findInternalAiExactVehicleMatch(lookupCatalog.items, targaInput),
    [lookupCatalog.items, targaInput],
  );
  const normalizedDriverQuery = useMemo(
    () => normalizeInternalAiDriverLookupQuery(driverInput),
    [driverInput],
  );
  const driverLookupSuggestions = useMemo(
    () => matchInternalAiDriverLookupCandidates(driverLookupCatalog.items, driverInput),
    [driverLookupCatalog.items, driverInput],
  );
  const exactDriverMatch = useMemo(
    () => findInternalAiExactDriverMatch(driverLookupCatalog.items, driverInput),
    [driverLookupCatalog.items, driverInput],
  );
  const activePeriodContext = useMemo(
    () => resolveInternalAiReportPeriodContext(reportPeriodInput),
    [reportPeriodInput],
  );
  const lookupUiState = useMemo((): {
    status: InternalAiVehicleLookupMatchState;
    message: string;
  } => {
    if (lookupCatalog.status === "loading") {
      return {
        status: "loading",
        message: "Sto leggendo le targhe reali dai layer anagrafici read-only del clone...",
      };
    }

    if (lookupCatalog.status === "error") {
      return {
        status: "error",
        message: lookupCatalog.message,
      };
    }

    if (!normalizedLookupQuery) {
      return {
        status: "empty_query",
        message: "Inizia a digitare una targa per vedere i mezzi reali disponibili nel gestionale.",
      };
    }

    if (selectedVehicle && selectedVehicle.targa === normalizedLookupQuery) {
      return {
        status: "selected",
        message: `Mezzo reale selezionato: ${selectedVehicle.targa}. Puoi avviare l'anteprima report in sola lettura.`,
      };
    }

    if (exactVehicleMatch) {
      return {
        status: "exact_match",
        message: `Trovata una corrispondenza precisa per ${exactVehicleMatch.targa}. Se vuoi ridurre gli errori, seleziona il mezzo prima di generare l'anteprima.`,
      };
    }

    if (lookupSuggestions.length === 0) {
      return {
        status: "no_match",
        message: "Nessun mezzo reale corrisponde ai caratteri inseriti.",
      };
    }

    return {
      status: "multiple_matches",
      message:
        lookupSuggestions.length === 1
          ? "Trovata una corrispondenza possibile. Seleziona il mezzo suggerito per confermare la targa corretta."
          : `Trovate ${lookupSuggestions.length} corrispondenze possibili. Seleziona il mezzo corretto per una preview piu affidabile.`,
    };
  }, [
    exactVehicleMatch,
    lookupCatalog.message,
    lookupCatalog.status,
    lookupSuggestions.length,
    normalizedLookupQuery,
    selectedVehicle,
  ]);

  const driverLookupUiState = useMemo((): {
    status: InternalAiVehicleLookupMatchState;
    message: string;
  } => {
    if (driverLookupCatalog.status === "loading") {
      return {
        status: "loading",
        message: "Sto leggendo gli autisti reali dal layer read-only dei colleghi del clone...",
      };
    }

    if (driverLookupCatalog.status === "error") {
      return {
        status: "error",
        message: driverLookupCatalog.message ?? "Errore durante la lettura degli autisti reali.",
      };
    }

    if (!normalizedDriverQuery) {
      return {
        status: "empty_query",
        message: "Inizia a digitare nome o badge per vedere gli autisti reali disponibili nel gestionale.",
      };
    }

    if (selectedDriver && selectedDriver.id === exactDriverMatch?.id) {
      return {
        status: "selected",
        message: `Autista reale selezionato: ${selectedDriver.nomeCompleto}. Puoi avviare l'anteprima report in sola lettura.`,
      };
    }

    if (exactDriverMatch) {
      return {
        status: "exact_match",
        message: `Trovata una corrispondenza precisa per ${exactDriverMatch.nomeCompleto}. Se vuoi ridurre gli errori, seleziona l'autista prima di generare l'anteprima.`,
      };
    }

    if (driverLookupSuggestions.length === 0) {
      return {
        status: "no_match",
        message: "Nessun autista reale corrisponde ai caratteri inseriti.",
      };
    }

    return {
      status: "multiple_matches",
      message:
        driverLookupSuggestions.length === 1
          ? "Trovata una corrispondenza possibile. Seleziona l'autista suggerito per confermare."
          : `Trovate ${driverLookupSuggestions.length} corrispondenze possibili. Seleziona l'autista corretto prima della preview.`,
    };
  }, [
    driverLookupCatalog.message,
    driverLookupCatalog.status,
    driverLookupSuggestions.length,
    exactDriverMatch,
    normalizedDriverQuery,
    selectedDriver,
  ]);

  const handleSelectPeriodPreset = (preset: InternalAiReportPeriodPreset) => {
    setReportPeriodInput((current) => ({
      preset,
      fromDate: preset === "custom" ? current.fromDate : null,
      toDate: preset === "custom" ? current.toDate : null,
    }));
  };

  const handleCustomPeriodFieldChange = (field: "fromDate" | "toDate", value: string) => {
    setReportPeriodInput((current) => ({
      preset: "custom",
      fromDate: field === "fromDate" ? value || null : current.fromDate,
      toDate: field === "toDate" ? value || null : current.toDate,
    }));
  };

  useEffect(() => {
    trackInternalAiScreenVisit(sectionId, location.pathname);
  }, [location.pathname, sectionId]);

  useEffect(() => {
    let cancelled = false;

    void readInternalAiVehicleLookupCatalog()
      .then((items) => {
        if (cancelled) return;
        setLookupCatalog({
          status: "ready",
          items,
          message: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setLookupCatalog({
          status: "error",
          items: [],
          message:
            error instanceof Error
              ? error.message
              : "Errore durante la lettura delle targhe reali del gestionale.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    rememberInternalAiArtifactArchiveState({
      query: artifactSearchQuery,
      reportType: artifactTypeFilter,
      status: artifactStatusFilter,
      family: artifactFamilyFilter,
      targa: artifactTargaFilter,
      autista: artifactAutistaFilter,
      period: artifactPeriodFilter,
    });
  }, [
    artifactAutistaFilter,
    artifactFamilyFilter,
    artifactPeriodFilter,
    artifactSearchQuery,
    artifactStatusFilter,
    artifactTargaFilter,
    artifactTypeFilter,
  ]);

  useEffect(() => {
    let cancelled = false;

    void readInternalAiDriverLookupCatalog()
      .then((items) => {
        if (cancelled) return;
        setDriverLookupCatalog({
          status: "ready",
          items,
          message: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setDriverLookupCatalog({
          status: "error",
          items: [],
          message:
            error instanceof Error
              ? error.message
              : "Errore durante la lettura degli autisti reali del gestionale.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyVehiclePreviewReadResult = (
    result: InternalAiVehicleReportReadResult,
    source: "manuale" | "selezione_guidata" | "chat",
    periodLabel: string,
  ) => {
    if (result.status !== "ready") {
      if (result.normalizedTarga) {
        trackInternalAiVehicleSearch({
          targa: result.normalizedTarga,
          source,
          result: result.status,
          periodLabel,
          sectionId,
          path: location.pathname,
        });
      }
      setVehicleRequestState({
        status: result.status,
        message: result.message,
      });
      return;
    }

    setTargaInput(result.normalizedTarga);
    const catalogMatch =
      findInternalAiExactVehicleMatch(lookupCatalog.items, result.normalizedTarga) ?? null;
    if (catalogMatch) {
      setSelectedVehicle(catalogMatch);
    }
    trackInternalAiVehicleSearch({
      targa: result.normalizedTarga,
      source,
      result: "ready",
      periodLabel: result.report.periodContext.label,
      sectionId,
      path: location.pathname,
    });
    setVehicleRequestState({
      status: "ready",
      message: result.message,
    });
    setActiveReportState({
      report: result.report,
      draftMessage: null,
    });
  };

  const applyDriverPreviewReadResult = (
    result: InternalAiDriverReportReadResult,
    source: "manuale" | "selezione_guidata" | "chat",
    candidate: InternalAiDriverLookupCandidate | null,
    periodLabel: string,
  ) => {
    if (result.status !== "ready") {
      if (candidate) {
        trackInternalAiDriverSearch({
          driverId: candidate.id,
          nomeCompleto: candidate.nomeCompleto,
          badge: candidate.badge,
          source,
          result: result.status,
          periodLabel,
          sectionId,
          path: location.pathname,
        });
      }
      setDriverRequestState({
        status: result.status,
        message: result.message,
      });
      return;
    }

    setDriverInput(result.report.header.nomeCompleto);
    setSelectedDriver(candidate);
    if (candidate) {
      trackInternalAiDriverSearch({
        driverId: candidate.id,
        nomeCompleto: candidate.nomeCompleto,
        badge: candidate.badge,
        source,
        result: "ready",
        periodLabel: result.report.periodContext.label,
        sectionId,
        path: location.pathname,
      });
    }
    setDriverRequestState({
      status: "ready",
      message: result.message,
    });
    setActiveReportState({
      report: result.report,
      draftMessage: null,
    });
  };

  const applyCombinedPreviewReadResult = (
    result: InternalAiCombinedReportReadResult,
    source: "manuale" | "selezione_guidata" | "chat",
    candidate: InternalAiDriverLookupCandidate | null,
    periodLabel: string,
  ) => {
    if (result.status !== "ready") {
      if (result.normalizedTarga && candidate) {
        trackInternalAiCombinedSearch({
          mezzoTarga: result.normalizedTarga,
          driverId: candidate.id,
          nomeCompleto: candidate.nomeCompleto,
          badge: candidate.badge,
          source,
          result: result.status,
          periodLabel,
          sectionId,
          path: location.pathname,
        });
      }
      setCombinedRequestState({
        status: result.status,
        message: result.message,
      });
      return;
    }

    setTargaInput(result.normalizedTarga);
    setDriverInput(result.report.header.nomeCompletoAutista);
    const catalogVehicle =
      findInternalAiExactVehicleMatch(lookupCatalog.items, result.normalizedTarga) ?? null;
    const catalogDriver =
      candidate ??
      findInternalAiExactDriverMatch(
        driverLookupCatalog.items,
        result.report.header.nomeCompletoAutista,
      ) ??
      null;
    if (catalogVehicle) {
      setSelectedVehicle(catalogVehicle);
    }
    if (catalogDriver) {
      setSelectedDriver(catalogDriver);
    }
    trackInternalAiCombinedSearch({
      mezzoTarga: result.normalizedTarga,
      driverId: catalogDriver?.id ?? result.report.autistaId,
      nomeCompleto: catalogDriver?.nomeCompleto ?? result.report.header.nomeCompletoAutista,
      badge: catalogDriver?.badge ?? result.report.header.badgeAutista,
      source,
      result: "ready",
      periodLabel: result.report.periodContext.label,
      sectionId,
      path: location.pathname,
    });
    setCombinedRequestState({
      status: "ready",
      message: result.message,
    });
    setActiveReportState({
      report: result.report,
      draftMessage: null,
    });
  };

  const handleSelectVehicle = (candidate: InternalAiVehicleLookupCandidate) => {
    setSelectedVehicle(candidate);
    setTargaInput(candidate.targa);
    trackInternalAiVehicleSelection({
      targa: candidate.targa,
      sectionId,
      path: location.pathname,
    });
    setVehicleRequestState({
      status: "idle",
      message: `Mezzo selezionato dal gestionale read-only: ${candidate.targa}. Ora puoi generare l'anteprima report.`,
    });
  };

  const handleSelectDriver = (candidate: InternalAiDriverLookupCandidate) => {
    setSelectedDriver(candidate);
    setDriverInput(candidate.nomeCompleto);
    trackInternalAiDriverSelection({
      driverId: candidate.id,
      nomeCompleto: candidate.nomeCompleto,
      badge: candidate.badge,
      sectionId,
      path: location.pathname,
    });
    setDriverRequestState({
      status: "idle",
      message: `Autista selezionato dal gestionale read-only: ${candidate.nomeCompleto}. Ora puoi generare l'anteprima report.`,
    });
  };

  const handleGenerateVehiclePreview = async () => {
    const candidateToUse =
      selectedVehicle && selectedVehicle.targa === normalizedLookupQuery
        ? selectedVehicle
        : exactVehicleMatch;

    if (!normalizedLookupQuery) {
      setVehicleRequestState({
        status: "invalid_query",
        message: "Inserisci almeno una targa o seleziona un mezzo reale prima di avviare l'anteprima.",
      });
      return;
    }

    if (!candidateToUse && lookupSuggestions.length > 0) {
      trackInternalAiVehicleSearch({
        targa: normalizedLookupQuery,
        source: "manuale",
        result: "invalid_query",
        periodLabel: activePeriodContext.label,
        sectionId,
        path: location.pathname,
      });
      setVehicleRequestState({
        status: "invalid_query",
        message:
          lookupSuggestions.length === 1
            ? "Ricerca incompleta: seleziona il mezzo suggerito oppure completa la targa prima di generare l'anteprima report."
            : "Ricerca ambigua: seleziona un mezzo reale dall'elenco suggerito prima di generare l'anteprima report.",
      });
      return;
    }

    const targaToRead = candidateToUse?.targa ?? normalizedLookupQuery;
    if (candidateToUse && (!selectedVehicle || selectedVehicle.targa !== candidateToUse.targa)) {
      setSelectedVehicle(candidateToUse);
    }
    setTargaInput(targaToRead);
    setVehicleRequestState({
      status: "loading",
      message: `Analisi in sola lettura in corso dai layer NEXT per la targa ${targaToRead}...`,
    });

    try {
      const result: InternalAiVehicleReportReadResult =
        await readInternalAiVehicleReportPreview(targaToRead, reportPeriodInput);
      applyVehiclePreviewReadResult(
        result,
        selectedVehicle ? "selezione_guidata" : "manuale",
        activePeriodContext.label,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto durante la costruzione dell'anteprima report.";

      setVehicleRequestState({
        status: "error",
        message,
      });
    }
  };

  const handleGenerateDriverPreview = async () => {
    const candidateToUse =
      selectedDriver && (!exactDriverMatch || selectedDriver.id === exactDriverMatch.id)
        ? selectedDriver
        : exactDriverMatch;

    if (!normalizedDriverQuery) {
      setDriverRequestState({
        status: "invalid_query",
        message: "Inserisci almeno un nome o badge oppure seleziona un autista reale prima di avviare l'anteprima.",
      });
      return;
    }

    if (!candidateToUse && driverLookupSuggestions.length > 0) {
      setDriverRequestState({
        status: "invalid_query",
        message:
          driverLookupSuggestions.length === 1
            ? "Ricerca incompleta: seleziona l'autista suggerito oppure completa il nome/badge prima di generare l'anteprima report."
            : "Ricerca ambigua: seleziona un autista reale dall'elenco suggerito prima di generare l'anteprima report.",
      });
      return;
    }

    setDriverRequestState({
      status: "loading",
      message: `Analisi in sola lettura in corso dai layer NEXT per l'autista ${candidateToUse?.nomeCompleto ?? normalizedDriverQuery}...`,
    });

    try {
      const result = await readInternalAiDriverReportPreview(
        candidateToUse ?? null,
        normalizedDriverQuery,
        reportPeriodInput,
      );
      applyDriverPreviewReadResult(
        result,
        selectedDriver ? "selezione_guidata" : "manuale",
        candidateToUse ?? null,
        activePeriodContext.label,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto durante la costruzione dell'anteprima report autista.";

      setDriverRequestState({
        status: "error",
        message,
      });
    }
  };

  const handleGenerateCombinedPreview = async () => {
    const vehicleToUse =
      selectedVehicle && selectedVehicle.targa === normalizedLookupQuery
        ? selectedVehicle
        : exactVehicleMatch;
    const driverToUse =
      selectedDriver && (!exactDriverMatch || selectedDriver.id === exactDriverMatch.id)
        ? selectedDriver
        : exactDriverMatch;

    if (!normalizedLookupQuery || !normalizedDriverQuery) {
      setCombinedRequestState({
        status: "invalid_query",
        message:
          "Per la preview combinata servono sia una targa sia un autista reale. Usa prima le selezioni guidate sopra.",
      });
      return;
    }

    if (!vehicleToUse && lookupSuggestions.length > 0) {
      setCombinedRequestState({
        status: "invalid_query",
        message:
          "La targa e ancora ambigua per il report combinato: seleziona il mezzo reale dall'elenco suggerito.",
      });
      return;
    }

    if (!driverToUse && driverLookupSuggestions.length > 0) {
      setCombinedRequestState({
        status: "invalid_query",
        message:
          "L'autista e ancora ambiguo per il report combinato: seleziona l'autista reale dall'elenco suggerito.",
      });
      return;
    }

    setCombinedRequestState({
      status: "loading",
      message:
        `Analisi combinata in sola lettura in corso per ${vehicleToUse?.targa ?? normalizedLookupQuery} + ` +
        `${driverToUse?.nomeCompleto ?? normalizedDriverQuery}...`,
    });

    try {
      const result = await readInternalAiCombinedReportPreview({
        driverCandidate: driverToUse ?? null,
        rawTarga: vehicleToUse?.targa ?? normalizedLookupQuery,
        rawDriverQuery: driverToUse?.nomeCompleto ?? normalizedDriverQuery,
        periodInput: reportPeriodInput,
      });
      applyCombinedPreviewReadResult(
        result,
        vehicleToUse && driverToUse ? "selezione_guidata" : "manuale",
        driverToUse ?? null,
        activePeriodContext.label,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto durante la costruzione dell'anteprima report combinata.";

      setCombinedRequestState({
        status: "error",
        message,
      });
    }
  };

  const handleChatSubmit = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? chatInput).trim();
    if (!prompt || chatStatus === "running") {
      return;
    }

    setChatMessages((current) => [
      ...current,
      createChatMessage({
        role: "utente",
        text: prompt,
        intent: "richiesta_generica",
        status: "completed",
      }),
    ]);
    setChatInput("");
    setChatStatus("running");

    try {
      const result = await runInternalAiChatTurn(prompt, reportPeriodInput);
      trackInternalAiChatPrompt({
        prompt,
        intent: result.intent,
        status: result.status,
        sectionId,
        path: location.pathname,
      });

      if (result.report) {
        if (result.intent === "report_combinato") {
          if (
            result.report.status === "ready" &&
            "normalizedDriverQuery" in result.report &&
            "normalizedTarga" in result.report &&
            result.report.preview.reportType === "combinato"
          ) {
            const catalogDriver =
              findInternalAiExactDriverMatch(
                driverLookupCatalog.items,
                result.report.preview.header.nomeCompletoAutista,
              ) ?? null;
            applyCombinedPreviewReadResult(
              {
                status: "ready",
                normalizedTarga: result.report.normalizedTarga,
                normalizedDriverQuery: result.report.normalizedDriverQuery,
                message: result.report.message,
                report: result.report.preview as InternalAiCombinedReportPreview,
              },
              "chat",
              catalogDriver,
              result.report.preview.periodContext.label,
            );
          } else if (
            "normalizedDriverQuery" in result.report &&
            "normalizedTarga" in result.report &&
            result.report.status !== "ready"
          ) {
            const candidate =
              result.report.normalizedDriverQuery
                ? findInternalAiExactDriverMatch(
                    driverLookupCatalog.items,
                    result.report.normalizedDriverQuery,
                  ) ?? null
                : null;
            applyCombinedPreviewReadResult(
              {
                status: result.report.status,
                normalizedTarga: result.report.normalizedTarga,
                normalizedDriverQuery: result.report.normalizedDriverQuery,
                message: result.report.message,
                report: null,
              },
              "chat",
              candidate,
              activePeriodContext.label,
            );
          }
        } else if (result.intent === "report_autista") {
          if (
            result.report.status === "ready" &&
            "normalizedDriverQuery" in result.report &&
            result.report.preview.reportType === "autista"
          ) {
            const catalogMatch =
              findInternalAiExactDriverMatch(
                driverLookupCatalog.items,
                result.report.preview.header.nomeCompleto,
              ) ?? null;
            applyDriverPreviewReadResult(
              {
                status: "ready",
                normalizedDriverQuery: result.report.normalizedDriverQuery,
                message: result.report.message,
                report: result.report.preview as InternalAiDriverReportPreview,
              },
              "chat",
              catalogMatch,
              result.report.preview.periodContext.label,
            );
          } else if ("normalizedDriverQuery" in result.report && result.report.status !== "ready") {
            const candidate =
              result.report.normalizedDriverQuery
                ? findInternalAiExactDriverMatch(
                    driverLookupCatalog.items,
                    result.report.normalizedDriverQuery,
                  ) ?? null
                : null;
            applyDriverPreviewReadResult(
              {
                status: result.report.status,
                normalizedDriverQuery: result.report.normalizedDriverQuery,
                message: result.report.message,
                report: null,
              },
              "chat",
              candidate,
              activePeriodContext.label,
            );
          }
        } else if (result.intent === "report_targa") {
          if (result.report.status === "ready" && "normalizedTarga" in result.report) {
            applyVehiclePreviewReadResult(
              {
                status: "ready",
                normalizedTarga: result.report.normalizedTarga,
                message: result.report.message,
                report: result.report.preview as InternalAiVehicleReportPreview,
              },
              "chat",
              result.report.preview.periodContext.label,
            );
          } else if ("normalizedTarga" in result.report) {
            applyVehiclePreviewReadResult(
              {
                status: result.report.status,
                normalizedTarga: result.report.normalizedTarga,
                message: result.report.message,
                report: null,
              },
              "chat",
              activePeriodContext.label,
            );
          }
        }
      }

      setChatMessages((current) => [
        ...current,
        createChatMessage({
          role: "assistente",
          text: result.assistantText,
          intent: result.intent,
          status: result.status,
          references: result.references,
        }),
      ]);
      setChatStatus("idle");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto nell'orchestratore locale della chat interna.";

      trackInternalAiChatPrompt({
        prompt,
        intent: "richiesta_generica",
        status: "failed",
        sectionId,
        path: location.pathname,
      });

      setChatMessages((current) => [
        ...current,
        createChatMessage({
          role: "assistente",
          text:
            "Si e verificato un errore interno nella chat controllata.\n\n" +
            `Dettaglio: ${message}`,
          intent: "richiesta_generica",
          status: "failed",
          references: [
            {
              type: "safe_mode_notice",
              label: "Errore locale della chat controllata",
              targa: null,
            },
          ],
        }),
      ]);
      setChatStatus("idle");
    }
  };

  const applyReportState = (next: {
    previewState: InternalAiPreviewState;
    approvalState: InternalAiApprovalState;
  }) => {
    setActiveReportState((current) => {
      if (!current.report) {
        return current;
      }

      return {
        ...current,
        draftMessage: null,
        report: {
          ...current.report,
          previewState: next.previewState,
          approvalState: next.approvalState,
        },
      };
    });
  };

  const markRevisionRequested = () => {
    if (!activeReportState.report) return;

    const updatedAt = new Date().toISOString();
    applyReportState({
      previewState: {
        status: "revision_requested",
        updatedAt,
        note: "Anteprima marcata come da rivedere nel solo scaffolding IA interno.",
      },
      approvalState: {
        status: "revision_requested",
        requestedBy: "ia.interna.preview",
        updatedAt,
        note: "Richiesta revisione solo lato clone, senza applicazione reale.",
      },
    });
  };

  const markApprovable = () => {
    if (!activeReportState.report) return;

    const updatedAt = new Date().toISOString();
    applyReportState({
      previewState: {
        status: "preview_ready",
        updatedAt,
        note: "Anteprima pronta e considerata approvabile a livello di scaffolding.",
      },
      approvalState: {
        status: "awaiting_approval",
        requestedBy: "ia.interna.preview",
        updatedAt,
        note: "Approvabile solo nel workflow simulato del sottosistema IA interno.",
      },
    });
  };

  const discardPreview = () => {
    if (!activeReportState.report) return;

    const updatedAt = new Date().toISOString();
    applyReportState({
      previewState: {
        status: "discarded",
        updatedAt,
        note: "Anteprima scartata solo nel sottosistema IA interno.",
      },
      approvalState: {
        status: "rejected",
        requestedBy: "ia.interna.preview",
        updatedAt,
        note: "Scarto registrato solo nel workflow simulato del clone.",
      },
    });
  };

  const saveDraftArtifact = () => {
    if (!activeReportState.report) return;

    const saved = saveInternalAiDraftArtifact({ report: activeReportState.report });
    trackInternalAiArtifactAction({
      artifactId: saved.artifact.id,
      title: saved.artifact.title,
      targetType: saved.artifact.reportType,
      targetLabel: saved.artifact.targetLabel,
      mezzoTarga: saved.artifact.mezzoTarga,
      autistaNome: saved.artifact.autistaNome,
      primaryFamily: saved.artifact.primaryFamily,
      artifactStatus: saved.artifact.status,
      periodLabel: saved.artifact.periodLabel,
      action: "saved",
      sectionId,
      path: location.pathname,
    });
    setSnapshotVersion((value) => value + 1);
    setActiveReportState((current) => ({
      ...current,
      draftMessage: saved.artifact.isPersisted
        ? `Draft IA salvato nell'archivio locale isolato: sessione ${saved.session.id}, richiesta ${saved.request.id}, artifact ${saved.artifact.id}.`
        : `Draft IA mantenuto solo in memoria locale di fallback: sessione ${saved.session.id}, richiesta ${saved.request.id}, artifact ${saved.artifact.id}.`,
    }));
  };

  const handleArchiveArtifact = (artifactId: string) => {
    const archived = archiveInternalAiArtifact(artifactId);
    if (!archived) {
      return;
    }

    trackInternalAiArtifactAction({
      artifactId: archived.id,
      title: archived.title,
      targetType: archived.reportType,
      targetLabel: archived.targetLabel,
      mezzoTarga: archived.mezzoTarga,
      autistaNome: archived.autistaNome,
      primaryFamily: archived.primaryFamily,
      artifactStatus: archived.status,
      periodLabel: archived.periodLabel,
      action: "archived",
      sectionId,
      path: location.pathname,
    });
    setSnapshotVersion((value) => value + 1);
    setOpenedArtifactId(artifactId);
  };

  const handleOpenArtifact = (artifactId: string) => {
    const artifact = snapshot.artifacts.find((entry) => entry.id === artifactId) ?? null;
    if (!artifact) {
      return;
    }

    setOpenedArtifactId(artifactId);
    if (artifact.payload?.report) {
      const reopenedReport = cloneReportPreview(artifact.payload.report);
      setActiveReportState({
        report: reopenedReport,
        draftMessage: `Report riaperto dall'archivio locale IA: artifact ${artifact.id}.`,
      });
      setReportPeriodInput(buildPeriodInputFromReport(reopenedReport));

      const reopenedTarga =
        reopenedReport.reportType === "targa" || reopenedReport.reportType === "combinato"
          ? reopenedReport.header.targa
          : null;
      const reopenedAutista =
        reopenedReport.reportType === "autista"
          ? reopenedReport.header.nomeCompleto
          : reopenedReport.reportType === "combinato"
            ? reopenedReport.header.nomeCompletoAutista
            : null;

      setTargaInput(reopenedTarga ?? "");
      setDriverInput(reopenedAutista ?? "");
      setSelectedVehicle(
        reopenedTarga
          ? lookupCatalog.items.find(
              (candidate) =>
                normalizeInternalAiVehicleLookupQuery(candidate.targa) ===
                normalizeInternalAiVehicleLookupQuery(reopenedTarga),
            ) ?? null
          : null,
      );
      setSelectedDriver(
        reopenedAutista
          ? driverLookupCatalog.items.find(
              (candidate) =>
                candidate.id ===
                  (reopenedReport.reportType === "autista"
                    ? reopenedReport.autistaId
                    : reopenedReport.reportType === "combinato"
                      ? reopenedReport.autistaId
                      : "") ||
                normalizeInternalAiDriverLookupQuery(candidate.nomeCompleto) ===
                  normalizeInternalAiDriverLookupQuery(reopenedAutista),
            ) ?? null
          : null,
      );
      if (sectionId === "artifacts") {
        navigate(NEXT_INTERNAL_AI_PATH);
      }
    }
    trackInternalAiArtifactAction({
      artifactId: artifact.id,
      title: artifact.title,
      targetType: artifact.reportType,
      targetLabel: artifact.targetLabel,
      mezzoTarga: artifact.mezzoTarga,
      autistaNome: artifact.autistaNome,
      primaryFamily: artifact.primaryFamily,
      artifactStatus: artifact.status,
      periodLabel: artifact.periodLabel,
      action: "opened",
      sectionId,
      path: location.pathname,
    });
  };

  return (
    <section className="next-page internal-ai-page">
      <header className="internal-ai-hero">
        <div className="next-panel">
          <p className="next-page__eyebrow">IA interna / modalita sicura</p>
          <h1>{section.title}</h1>
          <p className="next-page__description">
            Sottosistema IA interno isolato sotto <code>/next/ia/interna*</code>. Stato attuale:
            scaffolding, non operativo, orientato all&apos;anteprima e reversibile.
          </p>
          <div className="internal-ai-pill-row" style={{ marginTop: 14 }}>
            <span className="next-chip next-chip--accent">SCAFFOLDING</span>
            <span className="next-chip">NON OPERATIVO</span>
            <span className="next-chip">SOLO LETTURA</span>
            <span className="next-chip next-chip--subtle">NESSUNA SCRITTURA BUSINESS</span>
          </div>
          <p className="internal-ai-card__meta">
            {section.description} Nessun backend IA reale, nessun segreto lato client, nessun
            riuso runtime dei moduli IA legacy.
          </p>
          <div className="internal-ai-nav" style={{ marginTop: 16 }}>
            {(
              Object.entries(SECTION_CONFIGS) as [
                NextInternalAiSectionId,
                (typeof SECTION_CONFIGS)[NextInternalAiSectionId],
              ][]
            ).map(([id, entry]) => (
              <Link
                key={id}
                to={entry.path}
                className={`internal-ai-nav__link ${id === sectionId ? "is-active" : ""}`}
              >
                {entry.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="next-panel internal-ai-hero__meta">
          <span className="next-chip next-chip--accent">Esecuzione: scaffolding isolato</span>
          <span className="next-chip">Backend: solo contratti segnaposto</span>
          <span className="next-chip">
            Archivio artifact:{" "}
            {snapshot.summary.artifactArchiveMode === "local_storage_isolated"
              ? "locale isolato"
              : "fallback in memoria"}
          </span>
          <span className="next-chip">
            Tracking:{" "}
            {tracking.mode === "local_storage_isolated"
              ? "memoria locale persistente IA"
              : "solo memoria locale"}
          </span>
          <span className="next-chip next-chip--subtle">Scritture bloccate: si</span>
          <p className="internal-ai-muted">
            Questa superficie resta confinata alla famiglia clone IA e non aggancia le pagine
            correnti fuori da <code>/next/ia/interna*</code>.
          </p>
          <div className="internal-ai-pill-row">
            <Link to={NEXT_IA_PATH} className="next-clone-topbar__link">
              Hub IA clone
            </Link>
            <Link to={NEXT_HOME_PATH} className="next-clone-topbar__link">
              Home clone
            </Link>
          </div>
        </div>
      </header>

      <section className="internal-ai-grid">
        <article className="internal-ai-card">
          <p className="internal-ai-card__eyebrow">Sessioni</p>
          <h3>{snapshot.sessions.length}</h3>
          <p className="internal-ai-card__meta">
            Sessioni simulate del sottosistema IA per anteprima e revisione.
          </p>
        </article>
        <article className="internal-ai-card">
          <p className="internal-ai-card__eyebrow">Richieste</p>
          <h3>{snapshot.requests.length}</h3>
          <p className="internal-ai-card__meta">
            Richieste locali con stato anteprima, approvabile, revisione e scarto.
          </p>
        </article>
        <article className="internal-ai-card">
          <p className="internal-ai-card__eyebrow">Artifact IA</p>
          <h3>{snapshot.artifacts.length}</h3>
          <p className="internal-ai-card__meta">
            Persistenti locali {persistedArtifactsCount}, fallback memoria{" "}
            {snapshot.artifacts.length - persistedArtifactsCount}.
          </p>
        </article>
        <article className="internal-ai-card">
          <p className="internal-ai-card__eyebrow">Audit</p>
          <h3>{snapshot.auditLog.length}</h3>
          <p className="internal-ai-card__meta">
            Registro locale di sicurezza e tracciabilita del sottosistema.
          </p>
        </article>
      </section>

      {sectionId === "overview" ? (
        <>
          <article className="next-panel internal-ai-chat">
            <div className="next-panel__header">
              <h2>Chat interna controllata</h2>
            </div>
            <p className="next-panel__description">
              Interfaccia locale/mock del sottosistema IA. Nessun LLM reale, nessun backend esterno,
              nessuna scrittura business. I messaggi restano solo in memoria nella pagina corrente.
            </p>
            <div className="internal-ai-chat__suggestions">
              {CHAT_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="internal-ai-chat__suggestion"
                  onClick={() => setChatInput(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="internal-ai-chat__messages">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`internal-ai-chat__message ${
                    message.role === "utente" ? "is-user" : "is-assistant"
                  }`}
                >
                  <div className="internal-ai-chat__message-header">
                    <strong>{message.role === "utente" ? "Utente" : "Assistente IA interno"}</strong>
                    <div className="internal-ai-pill-row">
                      <span className={statusToneClass(message.status)}>
                        {CHAT_STATUS_LABELS[message.status]}
                      </span>
                      <span className="internal-ai-pill is-neutral">
                        {formatDateLabel(message.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="internal-ai-chat__message-text">{message.text}</p>
                  {message.references.length ? (
                    <div className="internal-ai-pill-row">
                      {message.references.map((reference) => (
                        <span
                          key={`${message.id}:${reference.type}:${reference.label}`}
                          className="internal-ai-pill is-neutral"
                        >
                          {reference.label}
                          {reference.targa ? ` - ${reference.targa}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {chatStatus === "running" ? (
                <div className="internal-ai-chat__message is-assistant">
                  <div className="internal-ai-chat__message-header">
                    <strong>Assistente IA interno</strong>
                    <span className={statusToneClass("running")}>In elaborazione</span>
                  </div>
                  <p className="internal-ai-chat__message-text">
                    Sto elaborando la richiesta con l&apos;orchestratore locale controllato...
                  </p>
                </div>
              ) : null}
            </div>
            <div className="internal-ai-chat__composer">
              <label className="internal-ai-search__field">
                <span>Scrivi una richiesta</span>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Es. crea report targa AB123CD ultimi 30 giorni oppure report autista Mario Rossi ultimo mese"
                  className="internal-ai-search__input"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleChatSubmit();
                    }
                  }}
                />
              </label>
              <div className="internal-ai-search__actions">
                <button
                  type="button"
                  className="internal-ai-search__button"
                  disabled={chatStatus === "running" || !chatInput.trim()}
                  onClick={() => void handleChatSubmit()}
                >
                  {chatStatus === "running" ? "Elaborazione..." : "Invia richiesta"}
                </button>
              </div>
            </div>
          </article>

          <article className="next-panel internal-ai-search">
            <div className="next-panel__header">
              <h2>Contesto periodo del report</h2>
            </div>
            <p className="next-panel__description">
              Il periodo attivo viene riusato sia dal report targa sia dal report autista della UI
              guidata. Le sezioni senza date affidabili restano visibili, ma vengono marcate come
              fuori filtro.
            </p>
            <div className="internal-ai-chat__suggestions">
              {(Object.entries(PERIOD_PRESET_LABELS) as [InternalAiReportPeriodPreset, string][]).map(
                ([preset, label]) => (
                  <button
                    key={preset}
                    type="button"
                    className={`internal-ai-chat__suggestion ${
                      reportPeriodInput.preset === preset ? "is-selected" : ""
                    }`}
                    onClick={() => handleSelectPeriodPreset(preset)}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
            <div className="internal-ai-search__form">
              <label className="internal-ai-search__field">
                <span>Da</span>
                <input
                  type="date"
                  value={reportPeriodInput.fromDate ?? ""}
                  onChange={(event) => handleCustomPeriodFieldChange("fromDate", event.target.value)}
                  className="internal-ai-search__input"
                />
              </label>
              <label className="internal-ai-search__field">
                <span>A</span>
                <input
                  type="date"
                  value={reportPeriodInput.toDate ?? ""}
                  onChange={(event) => handleCustomPeriodFieldChange("toDate", event.target.value)}
                  className="internal-ai-search__input"
                />
              </label>
            </div>
            <div className="internal-ai-pill-row">
              <span className={statusToneClass(activePeriodContext.isValid ? "preview_ready" : "errore")}>
                {activePeriodContext.isValid ? "Periodo valido" : "Periodo non valido"}
              </span>
              <span className="internal-ai-pill is-neutral">{activePeriodContext.label}</span>
              <span className="internal-ai-pill is-neutral">
                Preset {PERIOD_PRESET_LABELS[reportPeriodInput.preset]}
              </span>
            </div>
            <ul className="internal-ai-inline-list">
              {activePeriodContext.notes.map((note) => (
                <li key={`period-note:${note}`}>{note}</li>
              ))}
            </ul>
          </article>

          <div className="next-section-grid">
            <article className="next-panel internal-ai-search">
              <div className="next-panel__header">
                <h2>Anteprima report per targa</h2>
              </div>
              <p className="next-panel__description">
                Inserisci una targa oppure seleziona un mezzo reale dall&apos;autosuggest. La preview
                continua a riusare solo i layer NEXT gia normalizzati del clone in sola lettura.
              </p>
              <div className="internal-ai-search__form">
                <label className="internal-ai-search__field">
                  <span>Targa mezzo</span>
                  <input
                    type="text"
                    value={targaInput}
                    onChange={(event) => {
                      const nextValue = event.target.value.toUpperCase();
                      const normalizedNextValue = normalizeInternalAiVehicleLookupQuery(nextValue);
                      setTargaInput(nextValue);
                      if (selectedVehicle && selectedVehicle.targa !== normalizedNextValue) {
                        setSelectedVehicle(null);
                      }
                    }}
                    placeholder="Es. AB123CD"
                    className="internal-ai-search__input"
                    autoComplete="off"
                  />
                </label>
                <div className="internal-ai-search__actions">
                  <button
                    type="button"
                    className="internal-ai-search__button"
                    onClick={handleGenerateVehiclePreview}
                    disabled={
                      vehicleRequestState.status === "loading" || lookupCatalog.status === "loading"
                    }
                  >
                    {vehicleRequestState.status === "loading"
                      ? "Lettura in corso..."
                      : "Genera anteprima"}
                  </button>
                </div>
              </div>

              <div className="internal-ai-search__status">
                <div className="internal-ai-pill-row">
                  <span className={statusToneClass(lookupUiState.status)}>
                    {LOOKUP_MATCH_LABELS[lookupUiState.status]}
                  </span>
                  {selectedVehicle ? (
                    <span className="internal-ai-pill is-neutral">
                      Mezzo reale selezionato: {selectedVehicle.targa}
                    </span>
                  ) : null}
                </div>
                <p className="internal-ai-card__meta">{lookupUiState.message}</p>
              </div>

              {lookupSuggestions.length > 0 ? (
                <div className="internal-ai-suggestions">
                  {lookupSuggestions.map((candidate) => {
                    const description = formatVehicleLookupDescription(candidate);
                    const isSelected = selectedVehicle?.id === candidate.id;
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        className={`internal-ai-suggestion ${isSelected ? "is-selected" : ""}`}
                        onClick={() => handleSelectVehicle(candidate)}
                      >
                        <div className="internal-ai-suggestion__header">
                          <strong>{candidate.targa}</strong>
                          <div className="internal-ai-pill-row">
                            <span className="internal-ai-pill is-neutral">{candidate.categoria}</span>
                            {isSelected ? (
                              <span className="internal-ai-pill is-warning">Selezionato</span>
                            ) : null}
                          </div>
                        </div>
                        {description ? (
                          <p className="internal-ai-card__meta">{description}</p>
                        ) : (
                          <p className="internal-ai-card__meta">
                            Mezzo reale letto da <code>{candidate.sourceKey}</code>.
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {vehicleRequestState.message ? (
                <div className="next-clone-placeholder internal-ai-empty">
                  <p>{vehicleRequestState.message}</p>
                </div>
              ) : null}
            </article>

            <article className="next-panel internal-ai-search">
              <div className="next-panel__header">
                <h2>Anteprima report per autista</h2>
              </div>
              <p className="next-panel__description">
                Inserisci nome o badge oppure seleziona un autista reale dall&apos;autosuggest. La
                preview usa solo i layer NEXT gia disponibili e segnala in modo esplicito le fonti
                ancora parziali.
              </p>
              <div className="internal-ai-search__form">
                <label className="internal-ai-search__field">
                  <span>Autista reale</span>
                  <input
                    type="text"
                    value={driverInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      const normalizedNextValue = normalizeInternalAiDriverLookupQuery(nextValue);
                      setDriverInput(nextValue);
                      if (
                        selectedDriver &&
                        normalizeInternalAiDriverLookupQuery(selectedDriver.nomeCompleto) !==
                          normalizedNextValue &&
                        normalizeInternalAiDriverLookupQuery(selectedDriver.badge ?? "") !==
                          normalizedNextValue
                      ) {
                        setSelectedDriver(null);
                      }
                    }}
                    placeholder="Es. Mario Rossi oppure badge 1234"
                    className="internal-ai-search__input"
                    autoComplete="off"
                  />
                </label>
                <div className="internal-ai-search__actions">
                  <button
                    type="button"
                    className="internal-ai-search__button"
                    onClick={handleGenerateDriverPreview}
                    disabled={
                      driverRequestState.status === "loading" ||
                      driverLookupCatalog.status === "loading"
                    }
                  >
                    {driverRequestState.status === "loading"
                      ? "Lettura in corso..."
                      : "Genera anteprima"}
                  </button>
                </div>
              </div>

              <div className="internal-ai-search__status">
                <div className="internal-ai-pill-row">
                  <span className={statusToneClass(driverLookupUiState.status)}>
                    {LOOKUP_MATCH_LABELS[driverLookupUiState.status]}
                  </span>
                  {selectedDriver ? (
                    <span className="internal-ai-pill is-neutral">
                      Autista reale selezionato: {selectedDriver.nomeCompleto}
                    </span>
                  ) : null}
                </div>
                <p className="internal-ai-card__meta">{driverLookupUiState.message}</p>
              </div>

              {driverLookupSuggestions.length > 0 ? (
                <div className="internal-ai-suggestions">
                  {driverLookupSuggestions.map((candidate) => {
                    const isSelected = selectedDriver?.id === candidate.id;
                    return (
                      <button
                        key={candidate.id}
                        type="button"
                        className={`internal-ai-suggestion ${isSelected ? "is-selected" : ""}`}
                        onClick={() => handleSelectDriver(candidate)}
                      >
                        <div className="internal-ai-suggestion__header">
                          <strong>{candidate.nomeCompleto}</strong>
                          <div className="internal-ai-pill-row">
                            {candidate.badge ? (
                              <span className="internal-ai-pill is-neutral">
                                Badge {candidate.badge}
                              </span>
                            ) : null}
                            {isSelected ? (
                              <span className="internal-ai-pill is-warning">Selezionato</span>
                            ) : null}
                          </div>
                        </div>
                        <p className="internal-ai-card__meta">
                          {formatDriverLookupDescription(candidate)}
                        </p>
                        {candidate.mezziAssociatiPreview.length ? (
                          <div className="internal-ai-pill-row">
                            {candidate.mezziAssociatiPreview.map((entry) => (
                              <span
                                key={`${candidate.id}:mezzo:${entry}`}
                                className="internal-ai-pill is-neutral"
                              >
                                {entry}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {driverRequestState.message ? (
                <div className="next-clone-placeholder internal-ai-empty">
                  <p>{driverRequestState.message}</p>
                </div>
              ) : null}
            </article>
          </div>

          <div className="next-section-grid">
            <article className="next-panel internal-ai-search internal-ai-search--combined">
              <div className="next-panel__header">
                <h2>Anteprima report combinato mezzo + autista</h2>
              </div>
              <p className="next-panel__description">
                Il report combinato riusa le due selezioni guidate qui sopra e lo stesso periodo
                attivo. La preview dichiara in modo esplicito se il legame mezzo-autista e forte,
                plausibile oppure non ancora dimostrabile.
              </p>
              <div className="internal-ai-pill-row">
                <span className="internal-ai-pill is-neutral">
                  Mezzo: {selectedVehicle?.targa ?? exactVehicleMatch?.targa ?? "da selezionare"}
                </span>
                <span className="internal-ai-pill is-neutral">
                  Autista: {selectedDriver?.nomeCompleto ?? exactDriverMatch?.nomeCompleto ?? "da selezionare"}
                </span>
                <span className="internal-ai-pill is-neutral">Periodo {activePeriodContext.label}</span>
              </div>
              <ul className="internal-ai-inline-list">
                <li>
                  Mezzo selezionato:{" "}
                  {selectedVehicle?.targa ?? exactVehicleMatch?.targa ?? "usa il blocco report targa"}
                </li>
                <li>
                  Autista selezionato:{" "}
                  {selectedDriver?.nomeCompleto ?? exactDriverMatch?.nomeCompleto ?? "usa il blocco report autista"}
                </li>
                <li>
                  Il matching forte e dichiarato solo se il mezzo espone `autistaId` coincidente.
                </li>
              </ul>
              <div className="internal-ai-button-row">
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={handleGenerateCombinedPreview}
                  disabled={
                    combinedRequestState.status === "loading" ||
                    lookupCatalog.status === "loading" ||
                    driverLookupCatalog.status === "loading"
                  }
                >
                  {combinedRequestState.status === "loading"
                    ? "Lettura combinata in corso..."
                    : "Genera anteprima combinata"}
                </button>
              </div>
              {combinedRequestState.message ? (
                <div className="next-clone-placeholder internal-ai-empty">
                  <p>{combinedRequestState.message}</p>
                </div>
              ) : null}
            </article>
          </div>

          <div className="next-section-grid">
            <article className="next-panel">
              <div className="next-panel__header">
                <h2>Memoria recente del modulo IA</h2>
              </div>
              <p className="next-panel__description">
                Memoria locale e tracking persistente solo nel browser del clone. Nessun dato
                business, nessun tracking globale del gestionale.
              </p>
              <div className="internal-ai-grid">
                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Ultime targhe</p>
                  {tracking.recentVehicleSearches.length ? (
                    <ul className="internal-ai-inline-list">
                      {tracking.recentVehicleSearches.map((entry) => (
                        <li key={`${entry.targa}:${entry.updatedAt}`}>
                          {entry.targa} - {VEHICLE_SEARCH_RESULT_LABELS[entry.result] ?? entry.result} -{" "}
                          {VEHICLE_SEARCH_SOURCE_LABELS[entry.source] ?? entry.source}
                          {entry.periodLabel ? ` - ${entry.periodLabel}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="internal-ai-card__meta">Nessuna targa recente ancora memorizzata.</p>
                  )}
                </article>

                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Ultimi autisti</p>
                  {tracking.recentDriverSearches.length ? (
                    <ul className="internal-ai-inline-list">
                      {tracking.recentDriverSearches.map((entry) => (
                        <li key={`${entry.driverId}:${entry.updatedAt}`}>
                          {entry.nomeCompleto}
                          {entry.badge ? ` (${entry.badge})` : ""} -{" "}
                          {DRIVER_SEARCH_RESULT_LABELS[entry.result] ?? entry.result} -{" "}
                          {DRIVER_SEARCH_SOURCE_LABELS[entry.source] ?? entry.source}
                          {entry.periodLabel ? ` - ${entry.periodLabel}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="internal-ai-card__meta">Nessun autista recente ancora memorizzato.</p>
                  )}
                </article>

                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Ultime coppie combinate</p>
                  {tracking.recentCombinedSearches.length ? (
                    <ul className="internal-ai-inline-list">
                      {tracking.recentCombinedSearches.map((entry) => (
                        <li key={`${entry.mezzoTarga}:${entry.driverId}:${entry.updatedAt}`}>
                          {entry.mezzoTarga} + {entry.nomeCompleto}
                          {entry.badge ? ` (${entry.badge})` : ""} - {DRIVER_SEARCH_RESULT_LABELS[entry.result] ?? entry.result}
                          {entry.periodLabel ? ` - ${entry.periodLabel}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="internal-ai-card__meta">
                      Nessuna coppia mezzo/autista recente ancora memorizzata.
                    </p>
                  )}
                </article>

                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Richieste recenti</p>
                  {tracking.recentChatPrompts.length ? (
                    <ul className="internal-ai-inline-list">
                      {tracking.recentChatPrompts.map((entry) => (
                        <li key={`${entry.prompt}:${entry.updatedAt}`}>
                          {entry.prompt} - {CHAT_STATUS_LABELS[entry.status]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="internal-ai-card__meta">Nessuna richiesta chat recente salvata.</p>
                  )}
                </article>

                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Artifact recenti</p>
                  {tracking.recentArtifacts.length ? (
                    <ul className="internal-ai-inline-list">
                      {tracking.recentArtifacts.map((entry) => (
                        <li key={`${entry.artifactId}:${entry.updatedAt}`}>
                          {entry.title}
                          {entry.targetType && entry.targetLabel
                            ? ` - ${REPORT_TYPE_LABELS[entry.targetType] ?? entry.targetType} ${entry.targetLabel}`
                            : ""}
                          {entry.primaryFamily
                            ? ` - ${ARTIFACT_FAMILY_LABELS[entry.primaryFamily] ?? entry.primaryFamily}`
                            : ""}
                          {entry.artifactStatus
                            ? ` - ${ARTIFACT_STATUS_LABELS[entry.artifactStatus] ?? entry.artifactStatus}`
                            : ""}
                          {entry.periodLabel ? ` - ${entry.periodLabel}` : ""}
                          {" - "}
                          {ARTIFACT_ACTION_LABELS[entry.action] ?? entry.action}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="internal-ai-card__meta">Nessun artifact recente ancora memorizzato.</p>
                  )}
                </article>

                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Ultima consultazione archivio</p>
                  <ul className="internal-ai-inline-list">
                    <li>Ricerca: {tracking.sessionState.lastArchiveQuery ?? "non disponibile"}</li>
                    <li>
                      Tipo report:{" "}
                      {tracking.sessionState.lastArchiveReportType
                        ? ARCHIVE_TYPE_FILTER_LABELS[tracking.sessionState.lastArchiveReportType]
                        : "non disponibile"}
                    </li>
                    <li>
                      Stato:{" "}
                      {tracking.sessionState.lastArchiveStatus
                        ? ARCHIVE_STATUS_FILTER_LABELS[tracking.sessionState.lastArchiveStatus]
                        : "non disponibile"}
                    </li>
                    <li>
                      Ambito:{" "}
                      {tracking.sessionState.lastArchiveFamily
                        ? ARCHIVE_FAMILY_FILTER_LABELS[tracking.sessionState.lastArchiveFamily]
                        : "non disponibile"}
                    </li>
                    <li>Targa: {tracking.sessionState.lastArchiveTarga ?? "non disponibile"}</li>
                    <li>Autista: {tracking.sessionState.lastArchiveAutista ?? "non disponibile"}</li>
                    <li>Periodo: {tracking.sessionState.lastArchivePeriod ?? "non disponibile"}</li>
                  </ul>
                </article>

                <article className="internal-ai-card">
                  <p className="internal-ai-card__eyebrow">Ultimo stato di lavoro</p>
                  <ul className="internal-ai-inline-list">
                    <li>
                      Sezione:{" "}
                      {tracking.sessionState.lastSectionId
                        ? SECTION_CONFIGS[tracking.sessionState.lastSectionId].title
                        : "non disponibile"}
                    </li>
                    <li>Targa: {tracking.sessionState.lastTarga ?? "non disponibile"}</li>
                    <li>Autista: {tracking.sessionState.lastDriverName ?? "non disponibile"}</li>
                    <li>Periodo: {tracking.sessionState.lastPeriodLabel ?? "non disponibile"}</li>
                    <li>Intento: {tracking.sessionState.lastIntent ?? "non disponibile"}</li>
                    <li>Artifact: {tracking.sessionState.lastArtifactId ?? "non disponibile"}</li>
                  </ul>
                </article>
              </div>
            </article>

            <article className="next-panel">
              <div className="next-panel__header">
                <h2>Intenti e attivita piu recenti</h2>
              </div>
              <div className="internal-ai-pill-row">
                <span className="internal-ai-pill is-neutral">
                  Modalita memoria:{" "}
                  {tracking.mode === "local_storage_isolated"
                    ? "locale persistente IA"
                    : "solo memoria locale"}
                </span>
                <span className="internal-ai-pill is-neutral">
                  Visite: {tracking.totalVisits}
                </span>
                <span className="internal-ai-pill is-neutral">
                  Eventi: {tracking.totalEvents}
                </span>
              </div>
              {tracking.recentIntents.length ? (
                <ul className="internal-ai-inline-list">
                  {tracking.recentIntents.map((entry) => (
                    <li key={`${entry.intent}:${entry.updatedAt}`}>
                      {entry.intent} - usi {entry.count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="internal-ai-card__meta">Nessun intento ancora registrato.</p>
              )}
              {tracking.recentEvents.length ? (
                <div className="internal-ai-list" style={{ marginTop: 16 }}>
                  {tracking.recentEvents.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="internal-ai-list__row">
                      <div className="internal-ai-list__row-header">
                        <strong>{entry.label}</strong>
                        <span className="internal-ai-pill is-neutral">
                          {formatDateLabel(entry.ts)}
                        </span>
                      </div>
                      <p className="internal-ai-card__meta">
                        Sezione {SECTION_CONFIGS[entry.sectionId].title}
                        {entry.targa ? ` - targa ${entry.targa}` : ""}
                        {entry.artifactId ? ` - artifact ${entry.artifactId}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          </div>

          {activeReportState.report ? (
            <>
              <article className="next-panel">
                <div className="next-panel__header">
                  <h2>{activeReportState.report.title}</h2>
                </div>
                <p className="next-panel__description">{activeReportState.report.subtitle}</p>
                <div className="internal-ai-pill-row" style={{ marginTop: 12 }}>
                  <span className="internal-ai-pill is-neutral">
                    {getReportTypeLabel(activeReportState.report)}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Generata il {formatDateLabel(activeReportState.report.generatedAt)}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    {getReportTargetChip(activeReportState.report)}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Periodo {activeReportState.report.periodContext.label}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    {getReportHeaderMetaChip(activeReportState.report)}
                  </span>
                </div>
                {renderPreviewState(activeReportState.report.previewState)}
                {renderApprovalState(activeReportState.report.approvalState)}
                <ul className="internal-ai-inline-list">
                  {activeReportState.report.periodContext.notes.map((note) => (
                    <li key={`active-period:${note}`}>{note}</li>
                  ))}
                </ul>

                <div className="internal-ai-button-row">
                  <button type="button" className="internal-ai-search__button" onClick={markRevisionRequested}>
                    Segna da rivedere
                  </button>
                  <button type="button" className="internal-ai-search__button" onClick={markApprovable}>
                    Segna come approvabile
                  </button>
                  <button type="button" className="internal-ai-search__button" onClick={discardPreview}>
                    Scarta anteprima
                  </button>
                  <button type="button" className="internal-ai-search__button" onClick={saveDraftArtifact}>
                    Salva draft nell&apos;archivio IA
                  </button>
                </div>

                {activeReportState.draftMessage ? (
                  <p className="internal-ai-card__meta">{activeReportState.draftMessage}</p>
                ) : null}
              </article>

              <section className="internal-ai-grid">
                {activeReportState.report.cards.map((card) => (
                  <article key={card.label} className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">{card.label}</p>
                    <h3>{card.value}</h3>
                    <p className="internal-ai-card__meta">{card.meta}</p>
                  </article>
                ))}
              </section>

              <div className="next-section-grid">
                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Sezioni del report</h2>
                  </div>
                  <div className="internal-ai-list">
                    {activeReportState.report.sections.map((item) => (
                      <div key={item.id} className="internal-ai-list__row">
                        <div className="internal-ai-list__row-header">
                          <strong>{item.title}</strong>
                          <div className="internal-ai-pill-row">
                            <span className={statusToneClass(item.status)}>
                              {SECTION_STATUS_LABELS[item.status] ?? item.status}
                            </span>
                            <span className={statusToneClass(item.periodStatus)}>
                              {PERIOD_STATUS_LABELS[item.periodStatus] ?? item.periodStatus}
                            </span>
                          </div>
                        </div>
                        <p className="internal-ai-muted">{item.summary}</p>
                        {item.periodNote ? (
                          <p className="internal-ai-card__meta">{item.periodNote}</p>
                        ) : null}
                        <ul className="internal-ai-inline-list">
                          {item.bullets.map((bullet) => (
                            <li key={`${item.id}:${bullet}`}>{bullet}</li>
                          ))}
                        </ul>
                        {item.notes.length ? (
                          <ul className="internal-ai-inline-list">
                            {item.notes.map((note) => (
                              <li key={`${item.id}:note:${note}`}>{note}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>

                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Fonti lette</h2>
                  </div>
                  <div className="internal-ai-list">
                    {activeReportState.report.sources.map((source) => (
                      <div key={source.id} className="internal-ai-list__row">
                        <div className="internal-ai-list__row-header">
                          <strong>{source.title}</strong>
                          <div className="internal-ai-pill-row">
                            <span className={statusToneClass(source.status)}>
                              {SOURCE_STATUS_LABELS[source.status] ?? source.status}
                            </span>
                            <span className={statusToneClass(source.periodStatus)}>
                              {PERIOD_STATUS_LABELS[source.periodStatus] ?? source.periodStatus}
                            </span>
                          </div>
                        </div>
                        <p className="internal-ai-muted">{source.description}</p>
                        {source.periodNote ? (
                          <p className="internal-ai-card__meta">{source.periodNote}</p>
                        ) : null}
                        <div className="internal-ai-pill-row">
                          {source.datasetLabels.map((dataset) => (
                            <span key={`${source.id}:${dataset}`} className="internal-ai-pill is-neutral">
                              {dataset}
                            </span>
                          ))}
                          {source.countLabel ? (
                            <span className="internal-ai-pill is-neutral">{source.countLabel}</span>
                          ) : null}
                        </div>
                        {source.notes.length ? (
                          <ul className="internal-ai-inline-list">
                            {source.notes.map((note) => (
                              <li key={`${source.id}:source-note:${note}`}>{note}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <div className="next-section-grid">
                <article className="next-panel next-tone next-tone--warning">
                  <div className="next-panel__header">
                    <h2>Dati mancanti o da completare</h2>
                  </div>
                  {activeReportState.report.missingData.length ? (
                    <ul className="internal-ai-inline-list">
                      {activeReportState.report.missingData.map((entry) => (
                        <li key={entry}>{entry}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="next-panel__description">
                      Nessun dato mancante rilevante emerso per questa anteprima.
                    </p>
                  )}
                </article>

                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Evidenze e segnali</h2>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {activeReportState.report.evidences.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </>
          ) : null}

          <div className="next-section-grid">
            <article className="next-panel">
              <div className="next-panel__header">
              <h2>Contratti segnaposto predisposti</h2>
              </div>
              <div className="internal-ai-list">
                {snapshot.contractCatalog.map((contract) => (
                  <div key={contract.id} className="internal-ai-list__row">
                    <div className="internal-ai-list__row-header">
                      <strong>{contract.title}</strong>
                      <div className="internal-ai-pill-row">
                        <span className="internal-ai-pill is-warning">Solo contratto</span>
                        <span className="internal-ai-pill is-danger">Esecuzione disattivata</span>
                      </div>
                    </div>
                    <p className="internal-ai-muted">{contract.note}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="next-panel next-tone next-tone--warning">
              <div className="next-panel__header">
                <h2>Guard rail attivi</h2>
              </div>
              <ul className="internal-ai-inline-list">
                <li>Nessun runtime `aiCore`, `estrazioneDocumenti`, `analisi` o PDF legacy.</li>
                <li>Nessuna lettura o scrittura su Firestore/Storage business fuori dai layer NEXT.</li>
                <li>Nessun provider o segreto lato client.</li>
                <li>Nessun hook globale attivo fuori dal subtree IA interno.</li>
              </ul>
              <p className="internal-ai-card__meta">
                L&apos;archivio artifact usa solo persistenza locale isolata namespaced del clone, con
                fallback in memoria e senza impatto sul gestionale corrente.
              </p>
            </article>
          </div>
        </>
      ) : null}

      {sectionId === "sessions" ? (
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Sessioni (`ai_sessions`)</h2>
          </div>
          <div className="internal-ai-list">
            {snapshot.sessions.map((session) => (
              <div key={session.id} className="internal-ai-list__row">
                <div className="internal-ai-list__row-header">
                  <strong>{session.title}</strong>
                  <span className={statusToneClass(session.status)}>
                    {SESSION_STATUS_LABELS[session.status] ?? session.status}
                  </span>
                </div>
                <p className="internal-ai-muted">
                  Ambito: <code>{session.scope}</code>
                </p>
                {renderPreviewState(session.previewState)}
                {renderApprovalState(session.approvalState)}
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {sectionId === "requests" ? (
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Richieste (`ai_requests`)</h2>
          </div>
          <div className="internal-ai-list">
            {snapshot.requests.map((request) => (
              <div key={request.id} className="internal-ai-list__row">
                <div className="internal-ai-list__row-header">
                  <strong>{request.title}</strong>
                  <span className={statusToneClass(request.status)}>
                    {APPROVAL_STATUS_LABELS[request.approvalState.status] ?? request.status}
                  </span>
                </div>
                <p className="internal-ai-muted">
                  Obiettivo: {REQUEST_TARGET_LABELS[request.target] ?? request.target} | Contratti:{" "}
                  {request.requestedAdapters
                    .map((adapterId) => contractLabelMap.get(adapterId) ?? adapterId)
                    .join(", ")}
                </p>
                {renderPreviewState(request.previewState)}
                {renderApprovalState(request.approvalState)}
                <p className="internal-ai-card__meta">{request.note}</p>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      {sectionId === "artifacts" ? (
        <div className="next-section-grid">
          <article className="next-panel internal-ai-archive">
            <div className="next-panel__header">
              <h2>Archivio artifact IA (`analysis_artifacts`)</h2>
            </div>
            <p className="next-panel__description">
              Archivio locale intelligente del sottosistema IA interno. Puoi cercare, filtrare e
              riaprire i report salvati senza uscire dal perimetro isolato del clone.
            </p>
            <div className="internal-ai-archive__toolbar">
              <label className="internal-ai-search__field">
                Ricerca veloce
                <input
                  type="search"
                  className="internal-ai-search__input"
                  value={artifactSearchQuery}
                  onChange={(event) => setArtifactSearchQuery(event.target.value)}
                  placeholder="Titolo, targa, autista, tag, fonte o note"
                />
              </label>
              <div className="internal-ai-archive__summary">
                <div className="internal-ai-pill-row">
                  <span className="internal-ai-pill is-neutral">
                    {filteredArtifacts.length} risultati su {snapshot.artifacts.length}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Persistiti in locale {persistedArtifactsCount}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    In memoria {
                      snapshot.artifacts.length - persistedArtifactsCount
                    }
                  </span>
                </div>
                <p className="internal-ai-card__meta">{archiveFilterSummary}</p>
              </div>
            </div>
            <div className="internal-ai-archive__filters">
              <label className="internal-ai-search__field">
                Tipo report
                <select
                  className="internal-ai-search__input"
                  value={artifactTypeFilter}
                  onChange={(event) =>
                    setArtifactTypeFilter(event.target.value as InternalAiReportType | "tutti")
                  }
                >
                  {Object.entries(ARCHIVE_TYPE_FILTER_LABELS).map(([value, label]) => (
                    <option key={`archive-type:${value}`} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="internal-ai-search__field">
                Stato
                <select
                  className="internal-ai-search__input"
                  value={artifactStatusFilter}
                  onChange={(event) =>
                    setArtifactStatusFilter(
                      event.target.value as InternalAiArtifactStatus | "tutti",
                    )
                  }
                >
                  {Object.entries(ARCHIVE_STATUS_FILTER_LABELS).map(([value, label]) => (
                    <option key={`archive-status:${value}`} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="internal-ai-search__field">
                Ambito
                <select
                  className="internal-ai-search__input"
                  value={artifactFamilyFilter}
                  onChange={(event) =>
                    setArtifactFamilyFilter(
                      event.target.value as InternalAiArtifactFamily | "tutte",
                    )
                  }
                >
                  {Object.entries(ARCHIVE_FAMILY_FILTER_LABELS).map(([value, label]) => (
                    <option key={`archive-family:${value}`} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="internal-ai-search__field">
                Targa
                <input
                  type="search"
                  className="internal-ai-search__input"
                  value={artifactTargaFilter}
                  onChange={(event) => setArtifactTargaFilter(event.target.value)}
                  placeholder="Filtra per mezzo"
                />
              </label>

              <label className="internal-ai-search__field">
                Autista
                <input
                  type="search"
                  className="internal-ai-search__input"
                  value={artifactAutistaFilter}
                  onChange={(event) => setArtifactAutistaFilter(event.target.value)}
                  placeholder="Filtra per autista"
                />
              </label>

              <label className="internal-ai-search__field">
                Periodo
                <input
                  type="search"
                  list="internal-ai-archive-period-options"
                  className="internal-ai-search__input"
                  value={artifactPeriodFilter}
                  onChange={(event) => setArtifactPeriodFilter(event.target.value)}
                  placeholder="Filtra per periodo"
                />
                <datalist id="internal-ai-archive-period-options">
                  {archivePeriodOptions.map((label) => (
                    <option key={`archive-period:${label}`} value={label} />
                  ))}
                </datalist>
              </label>
            </div>
            <div className="internal-ai-button-row">
              <button
                type="button"
                className="internal-ai-search__button"
                onClick={() => {
                  setArtifactSearchQuery("");
                  setArtifactTypeFilter("tutti");
                  setArtifactStatusFilter("tutti");
                  setArtifactFamilyFilter("tutte");
                  setArtifactTargaFilter("");
                  setArtifactAutistaFilter("");
                  setArtifactPeriodFilter("");
                }}
                disabled={!archiveHasActiveFilters}
              >
                Reset filtri archivio
              </button>
            </div>
            <div className="internal-ai-list">
              {filteredArtifacts.length ? (
                filteredArtifacts.map((artifact) => (
                  <div key={artifact.id} className="internal-ai-list__row">
                    <div className="internal-ai-list__row-header">
                      <strong>{artifact.title}</strong>
                      <div className="internal-ai-pill-row">
                        <span className={statusToneClass(artifact.status)}>
                          {ARTIFACT_STATUS_LABELS[artifact.status] ?? artifact.status}
                        </span>
                        {artifact.reportType ? (
                          <span className="internal-ai-pill is-neutral">
                            {REPORT_TYPE_LABELS[artifact.reportType] ?? artifact.reportType}
                          </span>
                        ) : null}
                        <span className="internal-ai-pill is-neutral">
                          {buildArtifactScopeSummary(artifact)}
                        </span>
                        {artifact.matchingReliability ? (
                          <span className="internal-ai-pill is-neutral">
                            Legame {COMBINED_RELIABILITY_LABELS[artifact.matchingReliability]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="internal-ai-muted">
                      Target:{" "}
                      {getArtifactTargetLabel({
                        reportType: artifact.reportType,
                        targetLabel: artifact.targetLabel,
                        mezzoTarga: artifact.mezzoTarga,
                      })}{" "}
                      | targa: {artifact.mezzoTarga ?? "non disponibile"} | autista:{" "}
                      {artifact.autistaNome ?? "non disponibile"} | periodo:{" "}
                      {artifact.periodLabel ?? "non disponibile"}
                    </p>
                    <p className="internal-ai-muted">
                      Storage: {ARTIFACT_STORAGE_LABELS[artifact.storageMode] ?? artifact.storageMode}
                      {" | "}persistito: {artifact.isPersisted ? "si" : "no"}
                      {" | "}kind: {ARTIFACT_KIND_LABELS[artifact.kind] ?? artifact.kind}
                    </p>
                    <p className="internal-ai-muted">
                      Creato: {formatDateLabel(artifact.createdAt)} | Aggiornato:{" "}
                      {formatDateLabel(artifact.updatedAt)}
                    </p>
                    {artifact.tags.length ? (
                      <div className="internal-ai-pill-row">
                        {artifact.tags.map((tag) => (
                          <span
                            key={`${artifact.id}:tag:${tag}`}
                            className="internal-ai-pill is-neutral"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {artifact.payload?.searchableSummary ? (
                      <p className="internal-ai-card__meta">{artifact.payload.searchableSummary}</p>
                    ) : null}
                    <p className="internal-ai-card__meta">{artifact.note}</p>
                    <div className="internal-ai-button-row">
                      {artifact.payload ? (
                        <button
                          type="button"
                          className="internal-ai-search__button"
                          onClick={() => handleOpenArtifact(artifact.id)}
                        >
                          Riapri report
                        </button>
                      ) : null}
                      {artifact.status !== "archived" ? (
                        <button
                          type="button"
                          className="internal-ai-search__button"
                          onClick={() => handleArchiveArtifact(artifact.id)}
                        >
                          Porta ad archiviato
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="next-clone-placeholder internal-ai-empty">
                  <p>
                    Nessun artifact corrisponde ai filtri correnti. Prova a ridurre i criteri o a
                    resettare la ricerca archivio.
                  </p>
                </div>
              )}
            </div>
          </article>
          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Decisione archivio artifact</h2>
            </div>
            <p className="next-panel__description">
              In questo step la scelta piu sicura e un archivio locale isolato e namespaced nel
              browser del clone. Firestore e Storage reali restano fuori: le policy effettive non
              sono dimostrate nel repo e l&apos;app continua a usare auth anonima.
            </p>
          </article>
        </div>
      ) : null}

      {sectionId === "artifacts" && openedArtifact ? (
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Artifact aperto</h2>
          </div>
          <p className="next-panel__description">
            {openedArtifact.title}{" "}
            {openedArtifact.reportType && openedArtifact.targetLabel
              ? `per ${REPORT_TYPE_LABELS[openedArtifact.reportType] ?? openedArtifact.reportType} ${openedArtifact.targetLabel}`
              : openedArtifact.mezzoTarga
                ? `per la targa ${openedArtifact.mezzoTarga}`
                : ""}
          </p>
          <div className="internal-ai-pill-row">
            <span className={statusToneClass(openedArtifact.status)}>
              {ARTIFACT_STATUS_LABELS[openedArtifact.status] ?? openedArtifact.status}
            </span>
            {openedArtifact.reportType ? (
              <span className="internal-ai-pill is-neutral">
                {REPORT_TYPE_LABELS[openedArtifact.reportType] ?? openedArtifact.reportType}
              </span>
            ) : null}
            <span className="internal-ai-pill is-neutral">
              Ambito {buildArtifactScopeSummary(openedArtifact)}
            </span>
            <span className="internal-ai-pill is-neutral">
              Periodo {openedArtifact.periodLabel ?? "non disponibile"}
            </span>
            {openedArtifact.matchingReliability ? (
              <span className="internal-ai-pill is-neutral">
                Legame {COMBINED_RELIABILITY_LABELS[openedArtifact.matchingReliability]}
              </span>
            ) : null}
          </div>
          {openedArtifact.payload ? (
            <>
              <p className="internal-ai-card__meta">
                Usa il pulsante <strong>Riapri report</strong> nell&apos;archivio per riportare la
                preview nella schermata principale del modulo IA interno con il contesto corretto.
              </p>
              {renderPreviewState(openedArtifact.payload.report.previewState)}
              {renderApprovalState(openedArtifact.payload.report.approvalState)}
              <div className="internal-ai-grid">
                {openedArtifact.payload.report.cards.map((card) => (
                  <article key={`${openedArtifact.id}:${card.label}`} className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">{card.label}</p>
                    <h3>{card.value}</h3>
                    <p className="internal-ai-card__meta">{card.meta}</p>
                  </article>
                ))}
              </div>
              <div className="internal-ai-list" style={{ marginTop: 16 }}>
                <div className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>Fonti lette</strong>
                    <span className="internal-ai-pill is-neutral">
                      {openedArtifact.payload.report.sources.length} fonti
                    </span>
                  </div>
                  <div className="internal-ai-pill-row">
                    {openedArtifact.payload.sourceDatasetLabels.map((dataset) => (
                      <span
                        key={`${openedArtifact.id}:dataset:${dataset}`}
                        className="internal-ai-pill is-neutral"
                      >
                        {dataset}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>Dati mancanti</strong>
                    <span className="internal-ai-pill is-warning">
                      {openedArtifact.payload.missingDataCount}
                    </span>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {openedArtifact.payload.report.missingData.map((entry) => (
                      <li key={`${openedArtifact.id}:missing:${entry}`}>{entry}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="next-panel__description">
              Questo artifact non contiene una preview apribile: resta un record tecnico di supporto
              dell&apos;archivio IA interno.
            </p>
          )}
        </article>
      ) : null}

      {sectionId === "audit" ? (
        <div className="next-section-grid">
          <article className="next-panel">
            <div className="next-panel__header">
              <h2>Registro audit (`ai_audit_log`)</h2>
            </div>
            <div className="internal-ai-list">
              {snapshot.auditLog.map((entry) => (
                <div key={entry.id} className="internal-ai-list__row">
                  <div className="internal-ai-list__row-header">
                    <strong>{AUDIT_SCOPE_LABELS[entry.scope] ?? entry.scope}</strong>
                    <div className="internal-ai-pill-row">
                      <span className={statusToneClass(entry.severity)}>
                        {AUDIT_SEVERITY_LABELS[entry.severity] ?? entry.severity}
                      </span>
                      <span className={statusToneClass(entry.riskLevel)}>
                        {AUDIT_RISK_LABELS[entry.riskLevel] ?? entry.riskLevel}
                      </span>
                    </div>
                  </div>
                  <p className="internal-ai-muted">{entry.message}</p>
                  <p className="internal-ai-card__meta">{formatDateLabel(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="next-panel">
            <div className="next-panel__header">
              <h2>Tracking d'uso isolato</h2>
            </div>
            <p className="next-panel__description">
              Modalita:{" "}
              <code>
                {tracking.mode === "local_storage_isolated"
                  ? "memoria locale persistente IA"
                  : "solo memoria locale"}
              </code>
              . Nessuna attivazione globale; conteggio solo per la famiglia{" "}
              <code>/next/ia/interna*</code>.
            </p>
            <div className="internal-ai-pill-row">
              <span className="internal-ai-pill is-neutral">
                Visite totali: {tracking.totalVisits}
              </span>
              <span className="internal-ai-pill is-neutral">
                Eventi tracciati: {tracking.totalEvents}
              </span>
              {Object.entries(tracking.sectionCounts).map(([id, count]) => (
                <span key={id} className="internal-ai-pill is-neutral">
                  {SECTION_CONFIGS[id as NextInternalAiSectionId].title}: {count}
                </span>
              ))}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default NextInternalAiPage;
