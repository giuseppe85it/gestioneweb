import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
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
import { runInternalAiChatTurnThroughBackend } from "./internal-ai/internalAiChatOrchestratorBridge";
import { hydrateInternalAiServerPersistence } from "./internal-ai/internalAiServerPersistenceBridge";
import {
  approveInternalAiServerReportSummaryPreview,
  generateInternalAiServerReportSummaryPreview,
  rejectInternalAiServerReportSummaryPreview,
  rollbackInternalAiServerReportSummaryPreview,
  type InternalAiServerReportSummaryWorkflow,
} from "./internal-ai/internalAiServerReportSummaryClient";
import {
  buildInternalAiRuntimeObserverAssetUrl,
  readInternalAiServerRepoUnderstandingSnapshot,
  type InternalAiServerRepoUnderstandingSnapshot,
} from "./internal-ai/internalAiServerRepoUnderstandingClient";
import {
  findInternalAiExactDriverMatch,
  matchInternalAiDriverLookupCandidates,
  normalizeInternalAiDriverLookupQuery,
  readInternalAiDriverLookupCatalog,
} from "./internal-ai/internalAiDriverLookup";
import {
  type InternalAiDriverReportReadResult,
} from "./internal-ai/internalAiDriverReportFacade";
import {
  type InternalAiCombinedReportReadResult,
} from "./internal-ai/internalAiCombinedReportFacade";
import {
  readInternalAiCombinedReportPreviewThroughBackend,
  type InternalAiCombinedReportPreviewBridgeReadResult,
} from "./internal-ai/internalAiCombinedReportPreviewBridge";
import {
  readInternalAiDriverReportPreviewThroughBackend,
  type InternalAiDriverReportPreviewBridgeReadResult,
} from "./internal-ai/internalAiDriverReportPreviewBridge";
import {
  readInternalAiEconomicAnalysisPreviewThroughBackend,
  type InternalAiEconomicAnalysisPreviewBridgeReadResult,
} from "./internal-ai/internalAiEconomicAnalysisPreviewBridge";
import {
  readInternalAiDocumentsPreviewThroughBackend,
  type InternalAiDocumentsPreviewBridgeReadResult,
} from "./internal-ai/internalAiDocumentsPreviewBridge";
import {
  readInternalAiLibrettoPreviewThroughBackend,
  type InternalAiLibrettoPreviewBridgeReadResult,
} from "./internal-ai/internalAiLibrettoPreviewBridge";
import {
  readInternalAiPreventiviPreviewThroughBackend,
  type InternalAiPreventiviPreviewBridgeReadResult,
} from "./internal-ai/internalAiPreventiviPreviewBridge";
import {
  type InternalAiVehicleReportReadResult,
} from "./internal-ai/internalAiVehicleReportFacade";
import {
  readInternalAiVehicleReportPreviewThroughBackend,
  type InternalAiVehicleReportPreviewBridgeReadResult,
} from "./internal-ai/internalAiVehicleReportPreviewBridge";
import {
  buildInternalAiReportDocumentText,
  buildInternalAiReportPdfFileName,
  generateInternalAiReportPdfBlob,
} from "./internal-ai/internalAiReportPdf";
import InternalAiProfessionalVehicleReportView from "./internal-ai/InternalAiProfessionalVehicleReportView";
import {
  buildInternalAiChatAttachmentAssetUrl,
  buildInternalAiChatAttachmentPreviewLabel,
  readInternalAiServerChatAttachmentsSnapshot,
  removeInternalAiServerChatAttachment,
  uploadInternalAiServerChatAttachment,
} from "./internal-ai/internalAiChatAttachmentsClient";
import InternalAiUniversalRequestsPanel from "./internal-ai/InternalAiUniversalRequestsPanel";
import InternalAiUniversalWorkbench from "./internal-ai/InternalAiUniversalWorkbench";
import {
  readInternalAiUnifiedRegistrySummary,
  type InternalAiUnifiedRegistrySummary,
} from "./internal-ai/internalAiUnifiedIntelligenceEngine";
import { orchestrateInternalAiUniversalRequest } from "./internal-ai/internalAiUniversalOrchestrator";
import { selectInternalAiOutputMode } from "./internal-ai/internalAiOutputSelector";
import { syncInternalAiUniversalRequestsRepository } from "./internal-ai/internalAiUniversalRequestsRepository";
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
import {
  buildPdfShareText,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import type {
  InternalAiApprovalState,
  InternalAiArtifact,
  InternalAiArtifactFamily,
  InternalAiArtifactStatus,
  InternalAiCombinedMatchReliability,
  InternalAiCombinedReportPreview,
  InternalAiChatExecutionStatus,
  InternalAiChatAttachment,
  InternalAiChatMemoryFreshness,
  InternalAiChatMemoryHints,
  InternalAiEconomicAnalysisPreview,
  InternalAiDocumentsPreview,
  InternalAiDriverLookupCandidate,
  InternalAiLibrettoPreview,
  InternalAiDriverReportPreview,
  InternalAiOutputMode,
  InternalAiReportPreview,
  InternalAiReportPeriodInput,
  InternalAiReportPeriodPreset,
  InternalAiChatMessage,
  InternalAiPreventiviPreview,
  InternalAiPreviewState,
  InternalAiReportType,
  InternalAiVehicleLookupCandidate,
  InternalAiVehicleLookupMatchState,
  InternalAiVehicleReportPreview,
  NextInternalAiSectionId,
} from "./internal-ai/internalAiTypes";
import type {
  InternalAiUniversalDocumentRoute,
  InternalAiUniversalNormalizedValue,
  InternalAiUniversalOrchestrationResult,
} from "./internal-ai/internalAiUniversalTypes";
import { formatDateTimeUI } from "./nextDateFormat";
import "./next-shell.css";
import "./internal-ai/internal-ai.css";

type NextInternalAiPageProps = {
  sectionId?: NextInternalAiSectionId;
  initialChatInput?: string;
  initialChatAttachments?: File[];
  surfaceVariant?: "page" | "home-modal";
  autoSubmitInitialChat?: boolean;
};

type UnifiedConsoleScopeFilter =
  | "autisti"
  | "quadro"
  | "criticita"
  | "scadenze"
  | "lavori"
  | "manutenzioni"
  | "gomme"
  | "rifornimenti"
  | "materiali"
  | "inventario"
  | "ordini"
  | "preventivi"
  | "fornitori"
  | "documenti"
  | "costi"
  | "cisterna"
  | "attenzione_oggi";

type UnifiedConsoleOutputPreference = "thread" | "modale" | "pdf" | "report";

type UnifiedRegistryState =
  | {
      status: "idle" | "loading";
      summary: InternalAiUnifiedRegistrySummary | null;
      message: string | null;
    }
  | {
      status: "ready";
      summary: InternalAiUnifiedRegistrySummary;
      message: string | null;
    }
  | {
      status: "error";
      summary: null;
      message: string;
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

type ChatDocumentProposalState =
  | {
      status: "idle" | "loading";
      result: InternalAiUniversalOrchestrationResult | null;
      message: string | null;
    }
  | {
      status: "ready";
      result: InternalAiUniversalOrchestrationResult;
      message: string | null;
    }
  | {
      status: "error";
      result: null;
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

type ReportPreviewModalState = {
  isOpen: boolean;
  report: InternalAiReportPreview | null;
  artifactId: string | null;
};

type ReportPdfPreviewState =
  | {
      status: "idle" | "loading" | "error";
      url: null;
      blob: null;
      fileName: null;
      message: string | null;
    }
  | {
      status: "ready";
      url: string;
      blob: Blob;
      fileName: string;
      message: string;
    };

type ReportSummaryWorkflowState =
  | {
      status: "idle";
      message: string | null;
      workflow: null;
      reportSignature: string | null;
    }
  | {
      status: "loading" | "error";
      message: string;
      workflow: InternalAiServerReportSummaryWorkflow | null;
      reportSignature: string | null;
    }
  | {
      status: "ready";
      message: string;
      workflow: InternalAiServerReportSummaryWorkflow;
      reportSignature: string | null;
    };

type BackendPreviewTransportState =
  | "non_attivo"
  | "server_http_provider"
  | "server_http_retrieval"
  | "backend_mock_safe"
  | "frontend_fallback";

type ReportBridgeState = {
  transport: BackendPreviewTransportState;
  transportMessage: string | null;
};

type RepoUnderstandingState =
  | {
      status: "idle";
      message: string | null;
      snapshot: null;
      transport: "non_attivo";
      transportMessage: null;
    }
  | {
      status: "loading" | "not_enabled" | "error";
      message: string;
      snapshot: null;
      transport: "non_attivo" | "server_http_retrieval";
      transportMessage: string | null;
    }
  | {
      status: "ready";
      message: string;
      snapshot: InternalAiServerRepoUnderstandingSnapshot;
      transport: "server_http_retrieval";
      transportMessage: string;
    };

type RepoDependencyMapPreviewEntry = {
  id: string;
  label: string;
  domainCodes?: string[];
  featureLabel?: string;
  routePaths?: string[];
  uiFilePaths?: string[];
  domainFilePaths?: string[];
  backendFilePaths?: string[];
  impactRisk?: string;
};

type ChatAttachmentRepositoryState =
  | {
      status: "idle";
      message: string | null;
      items: InternalAiChatAttachment[];
      transport: "non_attivo";
      transportMessage: null;
    }
  | {
      status: "loading" | "error" | "not_enabled";
      message: string;
      items: InternalAiChatAttachment[];
      transport: BackendPreviewTransportState;
      transportMessage: string | null;
    }
  | {
      status: "ready";
      message: string;
      items: InternalAiChatAttachment[];
      transport: BackendPreviewTransportState;
      transportMessage: string;
    };

type EconomicAnalysisPreviewState =
  | {
      status: "idle";
      message: string | null;
      preview: null;
      transport: "non_attivo";
      transportMessage: null;
    }
  | {
      status: "loading" | "invalid_query" | "not_found" | "error";
      message: string;
      preview: InternalAiEconomicAnalysisPreview | null;
      transport: BackendPreviewTransportState;
      transportMessage: string | null;
    }
  | {
      status: "ready";
      message: string;
      preview: InternalAiEconomicAnalysisPreview;
      transport: Exclude<BackendPreviewTransportState, "non_attivo">;
      transportMessage: string;
    };

type DocumentsPreviewState =
  | {
      status: "idle";
      message: string | null;
      preview: null;
      transport: "non_attivo";
      transportMessage: null;
    }
  | {
      status: "loading" | "invalid_query" | "error";
      message: string;
      preview: InternalAiDocumentsPreview | null;
      transport: BackendPreviewTransportState;
      transportMessage: string | null;
    }
  | {
      status: "ready";
      message: string;
      preview: InternalAiDocumentsPreview;
      transport: Exclude<BackendPreviewTransportState, "non_attivo">;
      transportMessage: string;
    };

type LibrettoPreviewState =
  | {
      status: "idle";
      message: string | null;
      preview: null;
      transport: "non_attivo";
      transportMessage: null;
    }
  | {
      status: "loading" | "invalid_query" | "not_found" | "error";
      message: string;
      preview: InternalAiLibrettoPreview | null;
      transport: BackendPreviewTransportState;
      transportMessage: string | null;
    }
  | {
      status: "ready";
      message: string;
      preview: InternalAiLibrettoPreview;
      transport: Exclude<BackendPreviewTransportState, "non_attivo">;
      transportMessage: string;
    };

type PreventiviPreviewState =
  | {
      status: "idle";
      message: string | null;
      preview: null;
      transport: "non_attivo";
      transportMessage: null;
    }
  | {
      status: "loading" | "invalid_query" | "not_found" | "error";
      message: string;
      preview: InternalAiPreventiviPreview | null;
      transport: BackendPreviewTransportState;
      transportMessage: string | null;
    }
  | {
      status: "ready";
      message: string;
      preview: InternalAiPreventiviPreview;
      transport: Exclude<BackendPreviewTransportState, "non_attivo">;
      transportMessage: string;
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
    description: "Inbox documentale universale, handoff standard e payload di prefill tracciati nel runtime IA interno.",
    path: NEXT_INTERNAL_AI_REQUESTS_PATH,
  },
  artifacts: {
    title: "Archivio artifact IA",
    description:
      "Archivio IA dedicato con adapter server-side mock-safe e fallback locale, separato dai dati business.",
    path: NEXT_INTERNAL_AI_ARTIFACTS_PATH,
  },
  audit: {
    title: "Registro audit",
    description:
      "Traceability minima e memoria operativa IA dedicate, con adapter server-side mock-safe e fallback locale.",
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
  server_file_isolated: "Contenitore server-side IA dedicato",
};

const BACKEND_MODE_LABELS: Record<"stub_only" | "server_adapter_mock_safe", string> = {
  stub_only: "Solo contratti segnaposto",
  server_adapter_mock_safe: "Adapter server-side mock-safe",
};

const TRACKING_MODE_LABELS: Record<string, string> = {
  memory_only: "solo memoria locale",
  local_storage_isolated: "memoria locale persistente IA",
  server_file_isolated: "memoria server-side IA dedicata",
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

const CHAT_OUTPUT_MODE_LABELS: Record<InternalAiOutputMode, string> = {
  chat_brief: "Risposta breve in chat",
  chat_structured: "Analisi strutturata in chat",
  artifact_document: "Documento dedicato",
  report_pdf: "Report PDF",
  ui_integration_proposal: "Proposta di integrazione NEXT",
  next_integration_confirmation_required: "Conferma richiesta",
};

const CHAT_INTENT_LABELS: Record<InternalAiChatMessage["intent"], string> = {
  report_targa: "Report mezzo",
  report_autista: "Report autista",
  report_combinato: "Report combinato",
  mezzo_dossier: "Analisi gestionale mezzo",
  repo_understanding: "Repo, flussi e mappa dipendenze",
  capabilities: "Capability console IA",
  non_supportato: "Richiesta non supportata",
  richiesta_generica: "Richiesta generica",
};

const CHAT_SUGGESTIONS = [
  "Se voglio semplificare il flusso rifornimenti, quali moduli e file sono collegati tra loro e dove conviene intervenire nella NEXT?",
  "Se modifico il Dossier Mezzo, quali moduli e file rischio di impattare?",
  "Voglio aggiungere un nuovo modulo nel gestionale: dove lo dovrei inserire, quali moduli esistenti toccherebbe e come lo gestiresti nel perimetro NEXT?",
  "Questa logica vive nella madre, nella NEXT o nel backend IA? E quali file devo leggere per capirla bene?",
  "Questo dato lo stai leggendo live o dal clone?",
  "Se voglio aggiungere una nuova funzione IA legata ai flussi operativi, qual e il punto corretto di integrazione?",
  "Crea un report sui rifornimenti di questo mese e dimmi la media km/l della targa TI233827",
  "Dimmi quali sono oggi i 3 mezzi che richiedono piu attenzione, incrociando scadenze, collaudi/pre-collaudi, segnalazioni, lavori aperti e criticita operative",
  "Se oggi dovessi controllare un solo mezzo, quale sceglieresti e perche?",
  "Dimmi quali mezzi nei prossimi 30 giorni richiedono collaudo o pre-collaudo, ordinati per priorita, e spiegami cosa conviene fare",
  "Fammi un quadro completo della targa TI233827, ma solo con le informazioni davvero utili per decidere cosa fare",
  "Ci sono criticita di magazzino o inventario che richiedono attenzione?",
  "Fammi un riepilogo utile dei materiali collegati ai mezzi",
  "Ci sono stock bassi o segnali che possono bloccare il lavoro?",
  "Questa parte e davvero operativa o solo in lettura?",
  "Fammi un report dei costi della targa TI233827 negli ultimi 12 mesi, in modo semplice e utile",
  "Quali documenti rilevanti risultano associati alla targa TI233827?",
  "Fammi uno storico decisionale del mezzo TI233827 con costi, documenti e segnali utili",
  "Ci sono anomalie nei rifornimenti del mezzo TI233827?",
  "Quale mezzo e piu critico questa settimana?",
  "Fammi un riepilogo read-only di ordini e preventivi",
  "Ci sono approvazioni reali o solo preview?",
  "Quali CTA di procurement vanno bloccate nella NEXT?",
  "Spiegami lo stato reale di Capo Costi nel perimetro NEXT",
  "Quali autisti hanno oggi segnali o eventi che richiedono attenzione?",
  "Questa targa a quale autista risulta collegata?",
  "Fammi un riepilogo read-only del flusso autisti per oggi",
  "Ci sono anomalie o dati incompleti nel dominio autisti?",
  "Questo dato viene dalla madre, dalla NEXT o da un flusso locale autisti?",
];

const PRIMARY_SECTION_NAV: NextInternalAiSectionId[] = ["overview", "artifacts"];
const TECHNICAL_SECTION_NAV: NextInternalAiSectionId[] = ["sessions", "requests", "audit"];

const DOMAIN_REFERENCE_PREFIX = "Dominio rilevato: ";
const RELIABILITY_REFERENCE_PREFIX = "Affidabilita: ";
const UNIFIED_ENGINE_REFERENCE = "Motore: Unified Intelligence Engine";
const CLONE_SCOPE_REFERENCE_PREFIX = "Perimetro: ";
const TRUST_REFERENCE_PREFIX = "Fiducia ";
const OUTPUT_REFERENCE_PREFIX = "Output suggerito: ";

const UNIFIED_CONSOLE_SCOPE_OPTIONS: Array<{
  id: UnifiedConsoleScopeFilter;
  label: string;
}> = [
  { id: "autisti", label: "Autisti" },
  { id: "quadro", label: "Quadro completo" },
  { id: "criticita", label: "Criticita" },
  { id: "scadenze", label: "Scadenze" },
  { id: "lavori", label: "Lavori" },
  { id: "manutenzioni", label: "Manutenzioni" },
  { id: "gomme", label: "Gomme" },
  { id: "rifornimenti", label: "Rifornimenti" },
  { id: "materiali", label: "Materiali" },
  { id: "inventario", label: "Inventario" },
  { id: "ordini", label: "Ordini" },
  { id: "preventivi", label: "Preventivi" },
  { id: "fornitori", label: "Fornitori" },
  { id: "documenti", label: "Documenti" },
  { id: "costi", label: "Costi" },
  { id: "cisterna", label: "Cisterna" },
  { id: "attenzione_oggi", label: "Attenzione oggi" },
];

const UNIFIED_OUTPUT_LABELS: Record<UnifiedConsoleOutputPreference, string> = {
  thread: "Mantieni nella conversazione",
  modale: "Apri modale IA",
  pdf: "Apri PDF IA-only",
  report: "Apri report IA",
};

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

const PREVIEW_DATA_CLASSIFICATION_LABELS: Record<
  "diretto" | "plausibile" | "fuori_perimetro",
  string
> = {
  diretto: "Diretto",
  plausibile: "Plausibile",
  fuori_perimetro: "Fuori perimetro",
};

const CONTRACT_MODE_LABELS: Record<"stub" | "bridge_mock_safe", string> = {
  stub: "Solo contratto",
  bridge_mock_safe: "Ponte mock-safe",
};

const CONTRACT_RUNTIME_LABELS: Record<"disabled" | "mock_safe_backend", string> = {
  disabled: "Esecuzione disattivata",
  mock_safe_backend: "Backend separato attivo",
};

const BACKEND_PREVIEW_TRANSPORT_LABELS: Record<BackendPreviewTransportState, string> = {
  non_attivo: "Nessun ponte attivo",
  server_http_provider: "Provider reale server-side",
  server_http_retrieval: "Snapshot server-side clone-seeded",
  backend_mock_safe: "Backend separato mock-safe",
  frontend_fallback: "Fallback locale clone-safe",
};

const REPO_ZONE_LABELS: Record<string, string> = {
  next_clone: "NEXT clone",
  legacy_madre: "Madre legacy",
  shared_ui: "UI condivisa",
  backend_internal_ai: "Backend IA separato",
  docs: "Documentazione",
};

const REPO_FILE_KIND_LABELS: Record<string, string> = {
  page: "Pagina",
  component: "Componente",
  style: "Stile",
  routing: "Routing",
  backend: "Backend",
  document: "Documento",
  support: "Supporto",
};

const REPO_WRITE_POLICY_LABELS: Record<string, string> = {
  next_backend_docs_only: "Scrittura ammessa solo su NEXT, backend IA e documentazione autorizzata",
  read_only_for_ai: "Solo lettura per la nuova IA",
};

const FIREBASE_READINESS_LABELS: Record<string, string> = {
  ready: "Aperto",
  partial: "Parziale",
  not_ready: "Chiuso",
};

const FIREBASE_REQUIREMENT_STATUS_LABELS: Record<string, string> = {
  present: "Presente",
  missing: "Mancante",
  legacy_only: "Solo legacy",
  not_versioned: "Non versionato",
  conflicting: "Confliggente",
};

const RUNTIME_OBSERVER_STATUS_LABELS: Record<string, string> = {
  not_observed: "Non osservato",
  observed: "Osservato",
  partial: "Parziale",
  error: "Errore",
  unavailable: "Non disponibile",
};

const RUNTIME_COVERAGE_LEVEL_LABELS: Record<string, string> = {
  route_only: "Solo route",
  interactive_readonly: "Interazione read-only",
  dynamic_route_resolved: "Route dinamica risolta",
};

const RUNTIME_SURFACE_KIND_LABELS: Record<string, string> = {
  section: "Sezione",
  card: "Card",
  tab_trigger: "Tab",
  button_trigger: "Bottone",
  route_link: "Link route",
  modal_trigger: "Trigger modale",
};

const RUNTIME_STATE_KIND_LABELS: Record<string, string> = {
  route_state: "Stato route",
  tab_state: "Stato tab",
  section_state: "Stato sezione",
  dialog_state: "Stato dialog",
  menu_state: "Stato menu",
  filter_state: "Stato filtro",
  card_state: "Stato card",
  detail_state: "Stato dettaglio",
};

const RUNTIME_SCREEN_TYPE_LABELS: Record<string, string> = {
  cockpit: "Cockpit",
  mezzo_centrico: "Mezzo-centrica",
  operativita_globale: "Operativa globale",
  documentale: "Documentale",
  ia_interna: "IA interna",
  procurement: "Procurement",
  autista: "Autisti",
  specialistico: "Specialistica",
};

const UI_INTEGRATION_DOMAIN_LABELS: Record<string, string> = {
  mezzo_centrico: "Dominio mezzo-centrico",
  cockpit_globale: "Dominio cockpit globale",
  operativita_globale: "Dominio operativo globale",
  documentale: "Dominio documentale",
  procurement: "Dominio procurement",
  autista: "Dominio autisti",
  ia_interna: "Dominio IA interna",
  specialistico: "Dominio specialistico",
};

const UI_INTEGRATION_SURFACE_LABELS: Record<string, string> = {
  page: "Pagina",
  modal: "Modale",
  tab: "Tab",
  card: "Card",
  button: "Bottone",
  section: "Sezione",
};

const SERVER_REPORT_SUMMARY_REQUEST_LABELS: Record<
  InternalAiServerReportSummaryWorkflow["requestState"],
  string
> = {
  preview_ready: "Preview pronta",
  approved: "Approvata",
  rejected: "Respinta",
  rolled_back: "Rollback eseguito",
};

const SERVER_REPORT_SUMMARY_APPROVAL_LABELS: Record<
  InternalAiServerReportSummaryWorkflow["approvalState"],
  string
> = {
  awaiting_approval: "In attesa di approvazione",
  approved: "Approvata",
  rejected: "Respinta",
};

const SERVER_REPORT_SUMMARY_ROLLBACK_LABELS: Record<
  InternalAiServerReportSummaryWorkflow["rollbackState"],
  string
> = {
  not_requested: "Non richiesto",
  available: "Disponibile",
  rolled_back: "Eseguito",
};

function statusToneClass(status: string) {
  const normalizedStatus = status.toLowerCase();
  if (
    normalizedStatus.includes("warning") ||
    normalizedStatus.includes("awaiting") ||
    normalizedStatus.includes("revision") ||
    normalizedStatus.includes("preview") ||
    normalizedStatus.includes("parziale") ||
    normalizedStatus.includes("partial") ||
    normalizedStatus.includes("verificare")
  ) {
    return "internal-ai-pill is-warning";
  }

  if (
    normalizedStatus.includes("reject") ||
    normalizedStatus.includes("discard") ||
    normalizedStatus.includes("errore") ||
    normalizedStatus.includes("not_ready")
  ) {
    return "internal-ai-pill is-danger";
  }

  return "internal-ai-pill is-neutral";
}

function backendPreviewTransportClass(transport: BackendPreviewTransportState) {
  if (transport === "frontend_fallback") {
    return "internal-ai-pill is-warning";
  }

  return "internal-ai-pill is-neutral";
}

function contractModeClass(mode: "stub" | "bridge_mock_safe") {
  return mode === "bridge_mock_safe" ? "internal-ai-pill is-neutral" : "internal-ai-pill is-warning";
}

function contractRuntimeClass(runtime: "disabled" | "mock_safe_backend") {
  return runtime === "mock_safe_backend" ? "internal-ai-pill is-neutral" : "internal-ai-pill is-danger";
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "-";
  return formatDateTimeUI(value);
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
  attachments?: InternalAiChatAttachment[];
  outputMode?: InternalAiChatMessage["outputMode"];
  outputReason?: InternalAiChatMessage["outputReason"];
}): InternalAiChatMessage {
  return {
    id: `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    role: args.role,
    createdAt: new Date().toISOString(),
    text: args.text,
    intent: args.intent,
    status: args.status,
    references: args.references ?? [],
    attachments: args.attachments ?? [],
    outputMode: args.outputMode ?? null,
    outputReason: args.outputReason ?? null,
  };
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

function getInternalAiReportSignature(report: InternalAiReportPreview | null) {
  if (!report) {
    return null;
  }

  return `${report.reportType}:${report.targetLabel}:${report.generatedAt}`;
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

function dedupeChatMessageReferences(
  references: InternalAiChatMessage["references"],
): InternalAiChatMessage["references"] {
  const seen = new Set<string>();

  return references.filter((reference) => {
    const key = `${reference.type}:${reference.label}:${reference.targa ?? ""}:${reference.artifactId ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isDecisionalVehicleOverviewMessage(message: InternalAiChatMessage): boolean {
  if (message.role !== "assistente") {
    return false;
  }

  const normalized = normalizeChatPrompt(message.text);
  return (
    normalized.includes("quadro mezzo") &&
    normalized.includes("cosa fare ora") &&
    normalized.includes("scadenze e collaudi")
  );
}

function buildVisibleChatReferences(
  message: InternalAiChatMessage,
): InternalAiChatMessage["references"] {
  if (!isDecisionalVehicleOverviewMessage(message)) {
    return message.references;
  }

  return message.references.filter((reference) => {
    if (reference.artifactId) {
      return true;
    }

    return !(
      reference.label.startsWith(UNIFIED_ENGINE_REFERENCE) ||
      reference.label.startsWith(DOMAIN_REFERENCE_PREFIX) ||
      reference.label.startsWith(RELIABILITY_REFERENCE_PREFIX) ||
      reference.label.startsWith(CLONE_SCOPE_REFERENCE_PREFIX) ||
      reference.label.startsWith(TRUST_REFERENCE_PREFIX) ||
      reference.label.startsWith(OUTPUT_REFERENCE_PREFIX)
    );
  });
}

function buildChatMemoryFocusLabel(screenHint: InternalAiChatMemoryHints["screenHint"]): string | null {
  switch (screenHint) {
    case "home":
      return "sulla Home";
    case "flussi":
      return "sui flussi";
    case "file":
    case "quale-file":
      return "sui file da toccare";
    case "modulo":
      return "sui moduli coinvolti";
    case "repo":
      return "sul repo";
    default:
      return null;
  }
}

function buildChatReportReadyText(report: InternalAiReportPreview): string {
  const cards = report.cards.slice(0, 4).map((card) => `- ${card.label}: ${card.value}`);
  const highlightedSections = report.sections
    .slice(0, 3)
    .map((section) => section.title)
    .join(", ");
  const overviewActionSection =
    report.sections.find((section) => section.id === "decision-deadlines") ?? null;
  const overviewBacklogSection =
    report.sections.find((section) => section.id === "decision-backlog") ?? null;
  const overviewSignalsSection =
    report.sections.find((section) => section.id === "decision-signals") ?? null;
  const overviewFuelSection =
    report.sections.find((section) => section.id === "decision-fuel") ?? null;
  const overviewCostsSection =
    report.sections.find((section) => section.id === "decision-costs") ?? null;
  const overviewNoteSection =
    report.sections.find((section) => section.id === "decision-note") ?? null;
  const costsDocumentsSection =
    report.sections.find((section) => section.id === "documenti-costi") ?? null;
  const reliabilityCard =
    report.cards.find((card) => card.label === "Verdetto fiducia") ?? null;
  const actionCard = report.cards.find((card) => card.label === "Cosa fare ora") ?? null;
  const anomalySection =
    report.sections.find((section) => section.id === "rifornimenti-anomalie") ?? null;
  const actionSection =
    report.sections.find((section) => section.id === "rifornimenti-azioni") ?? null;
  const trustSection =
    report.sections.find((section) => section.id === "rifornimenti-affidabilita") ?? null;
  const fuelSummary =
    report.sections.find((section) => section.id === "rifornimenti") ?? null;

  if (report.sections.some((section) => section.id.startsWith("decision-"))) {
    return [
      `${report.title} pronto per ${getReportTargetChip(report)}.`,
      `Sintesi iniziale:\n- Periodo: ${report.periodContext.label}\n${cards.join("\n")}`,
      actionCard
        ? `Cosa fare ora:\n- ${actionCard.value}\n- ${actionCard.meta}`
        : null,
      overviewActionSection
        ? `Scadenze e collaudi:\n- ${overviewActionSection.summary}\n${overviewActionSection.bullets.slice(0, 3).map((entry) => `- ${entry}`).join("\n")}`
        : null,
      overviewBacklogSection
        ? `Backlog tecnico:\n- ${overviewBacklogSection.summary}\n${overviewBacklogSection.bullets.slice(0, 3).map((entry) => `- ${entry}`).join("\n")}`
        : null,
      overviewSignalsSection
        ? `Segnali operativi:\n${overviewSignalsSection.bullets.slice(0, 3).map((entry) => `- ${entry}`).join("\n")}`
        : null,
      overviewFuelSection
        ? `Consumi e rifornimenti:\n- ${overviewFuelSection.summary}`
        : null,
      overviewCostsSection
        ? `Costi, documenti e storico utile:\n- ${overviewCostsSection.summary}`
        : null,
      overviewNoteSection
        ? `Nota finale:\n- ${overviewNoteSection.summary}\n${overviewNoteSection.bullets.slice(0, 2).map((entry) => `- ${entry}`).join("\n")}`
        : null,
      "Apro l'anteprima e mantengo lo stesso quadro decisionale in modale, report e PDF.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (costsDocumentsSection) {
    return [
      `${report.title} pronto per ${getReportTargetChip(report)}.`,
      `Sintesi iniziale:\n- Periodo: ${report.periodContext.label}\n${cards.join("\n")}`,
      `Dati principali:\n- ${costsDocumentsSection.summary}`,
      costsDocumentsSection.bullets.length
        ? `Elementi rilevanti:\n${costsDocumentsSection.bullets
            .slice(0, 5)
            .map((entry) => `- ${entry}`)
            .join("\n")}`
        : null,
      report.missingData.length
        ? `Limiti:\n${report.missingData.slice(0, 3).map((entry) => `- ${entry}`).join("\n")}`
        : null,
      "Apro l'anteprima e mantengo lo stesso taglio business in modale, report e PDF.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (fuelSummary) {
    return [
      `${report.title} pronto per ${getReportTargetChip(report)}.`,
      `Sintesi iniziale:\n- Periodo: ${report.periodContext.label}\n${cards.join("\n")}`,
      reliabilityCard
        ? `Verdetto fiducia: ${reliabilityCard.value}\n- ${reliabilityCard.meta}`
        : trustSection
          ? `Verdetto fiducia: ${trustSection.summary}`
          : null,
      anomalySection?.bullets.length
        ? `Anomalie:\n${anomalySection.bullets.slice(0, 3).map((entry) => `- ${entry}`).join("\n")}`
        : null,
      actionSection
        ? `Azione consigliata:\n- ${actionSection.bullets[0] || actionSection.summary}`
        : null,
      "Apro l'anteprima PDF e lascio qui il riepilogo essenziale.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    `${report.title} pronto per ${getReportTargetChip(report)}.`,
    `Sintesi iniziale:\n- Periodo: ${report.periodContext.label}\n${cards.join("\n")}`,
    `Sezioni utili:\n- ${highlightedSections || "quadro sintetico disponibile"}`,
    "Apro l'anteprima PDF e lascio qui il riepilogo essenziale.",
  ].join("\n\n");
}

function buildChatUseCaseLabel(message: InternalAiChatMessage): string | null {
  const normalized = normalizeChatPrompt(message.text);

  if (message.intent === "report_targa") {
    if (
      normalized.includes("magazzin") ||
      normalized.includes("inventar") ||
      normalized.includes("material") ||
      normalized.includes("attrezzatur") ||
      normalized.includes("stock")
    ) {
      return "Materiali e magazzino";
    }

    if (
      normalized.includes("quadro mezzo") ||
      normalized.includes("cosa fare ora") ||
      normalized.includes("situazione del mezzo")
    ) {
      return "Quadro mezzo";
    }

    if (
      normalized.includes("riforniment") ||
      normalized.includes("consum") ||
      normalized.includes("km/l") ||
      normalized.includes("carburant") ||
      normalized.includes("gasolio")
    ) {
      return "Report rifornimenti";
    }

    if (
      normalized.includes("costi") ||
      normalized.includes("document") ||
      normalized.includes("storico decisionale") ||
      normalized.includes("storico utile")
    ) {
      return normalized.includes("costi") || normalized.includes("document")
        ? "Costi e documenti"
        : "Storico mezzo";
    }

    return "Report mezzo";
  }

  if (message.intent === "mezzo_dossier") {
    if (
      normalized.includes("magazzin") ||
      normalized.includes("inventar") ||
      normalized.includes("material") ||
      normalized.includes("attrezzatur") ||
      normalized.includes("stock")
    ) {
      return "Materiali e magazzino";
    }

    if (
      normalized.includes("quadro mezzo") ||
      normalized.includes("cosa fare ora") ||
      normalized.includes("situazione del mezzo")
    ) {
      return "Quadro mezzo";
    }

    if (
      normalized.includes("riforniment") ||
      normalized.includes("consum") ||
      normalized.includes("km/l") ||
      normalized.includes("carburant") ||
      normalized.includes("gasolio")
    ) {
      return "Rifornimenti";
    }

    if (
      normalized.includes("costi") ||
      normalized.includes("document") ||
      normalized.includes("storico decisionale") ||
      normalized.includes("storico utile")
    ) {
      return normalized.includes("costi") || normalized.includes("document")
        ? "Costi e documenti"
        : "Storico mezzo";
    }

    if (
      normalized.includes("alert") ||
      normalized.includes("revisione") ||
      normalized.includes("operativo")
    ) {
      return "Alert e stato operativo";
    }

    if (
      normalized.includes("lavor") ||
      normalized.includes("manutenz") ||
      normalized.includes("tecnic")
    ) {
      return "Backlog tecnico";
    }

    return "Quadro mezzo";
  }

  if (message.intent === "repo_understanding" && normalized.includes("home")) {
    return "Analisi Home";
  }

  if (
    message.intent === "repo_understanding" &&
    (normalized.includes("riforniment") || normalized.includes("semplificare il flusso"))
  ) {
    return "Flusso rifornimenti";
  }

  if (message.intent === "repo_understanding" && normalized.includes("dossier mezzo")) {
    return "Impatto Dossier Mezzo";
  }

  if (
    message.intent === "repo_understanding" &&
    (normalized.includes("nuovo modulo") || normalized.includes("dove lo dovrei inserire"))
  ) {
    return "Integrazione modulo";
  }

  if (
    message.intent === "repo_understanding" &&
    (normalized.includes("live-read") ||
      normalized.includes("live read") ||
      normalized.includes("live o dal clone") ||
      normalized.includes("snapshot read-only") ||
      normalized.includes("read-only del clone"))
  ) {
    return "Confine live-read";
  }

  if (
    message.intent === "repo_understanding" &&
    (normalized.includes("backend ia") ||
      normalized.includes("vive nella madre") ||
      normalized.includes("vive nella next"))
  ) {
    return "Perimetro logica";
  }

  if (
    message.intent === "repo_understanding" &&
    (normalized.includes("funzione ia") || normalized.includes("flussi operativi"))
  ) {
    return "Integrazione IA";
  }

  if (
    message.intent === "repo_understanding" &&
    (normalized.includes("file") || normalized.includes("modul"))
  ) {
    return "File e moduli";
  }

  if (message.intent === "richiesta_generica") {
    if (
      normalized.includes("procurement") ||
      normalized.includes("ordini leggibili") ||
      normalized.includes("righi ordine") ||
      normalized.includes("righe ordine") ||
      normalized.includes("preventivi letti") ||
      normalized.includes("approvazioni lette") ||
      normalized.includes("capo costi") ||
      normalized.includes("listino leggibile") ||
      normalized.includes("cta di procurement")
    ) {
      return "Procurement read-only";
    }

    if (
      normalized.includes("magazzin") ||
      normalized.includes("inventar") ||
      normalized.includes("material") ||
      normalized.includes("attrezzatur") ||
      normalized.includes("stock") ||
      normalized.includes("operativa o solo in lettura")
    ) {
      return normalized.includes("mezzi") ? "Materiali collegati ai mezzi" : "Magazzino reale";
    }

    if (
      normalized.includes("scadenze, collaudi e pre-collaudi") ||
      normalized.includes("mezzi da seguire") ||
      normalized.includes("pre-collaudi consigliati")
    ) {
      return "Scadenze flotta";
    }

    if (
      normalized.includes("mezzi che richiedono attenzione") ||
      normalized.includes("classifica criticita") ||
      normalized.includes("classifica operativa") ||
      normalized.includes("priorita mezzi")
    ) {
      return "Priorita flotta";
    }
  }

  return null;
}

function buildChatContextChips(message: InternalAiChatMessage): string[] {
  const normalized = normalizeChatPrompt(message.text);
  const chips: string[] = [];
  const domainLabel = buildChatDomainLabel(message);
  const reliabilityLabel = buildChatReliabilityLabel(message);

  if (message.intent === "repo_understanding") {
    chips.push("repo/flussi");
  }

  if (domainLabel) {
    const domainCodes = domainLabel.match(/D\d{2}/g) ?? [];
    if (domainCodes.length) {
      chips.push(...domainCodes);
    }

    if (domainLabel.toLowerCase().includes("console unificata")) {
      chips.push("console unificata");
    }
  } else if (message.intent === "report_targa" || message.intent === "mezzo_dossier") {
    chips.push("mezzo");
    chips.push("console unificata");
  }

  if (
    normalized.includes("home") ||
    message.references.some((reference) => reference.label.toLowerCase().includes("home.tsx"))
  ) {
    chips.push("home");
  }

  if (normalized.includes("integrazione")) {
    chips.push("integrazione");
  }

  if (
    normalized.includes("live-read") ||
    normalized.includes("live read") ||
    normalized.includes("snapshot read-only") ||
    normalized.includes("read-only del clone")
  ) {
    chips.push("confine live");
  }

  if (normalized.includes("backend ia") || normalized.includes("madre") || normalized.includes("next")) {
    chips.push("perimetri");
  }

  if (
    normalized.includes("memoria osservata") ||
    (message.outputReason ? normalizeChatPrompt(message.outputReason).includes("memoria osservata") : false)
  ) {
    chips.push("runtime");
  }

  if (message.attachments.length > 0) {
    chips.push("allegati");
  }

  if (message.outputMode === "report_pdf") {
    chips.push("report");
  }

  if (reliabilityLabel) {
    chips.push(reliabilityLabel.toLowerCase());
  }

  if (
    normalized.includes("fuori perimetro") ||
    normalized.includes("dominio esterno") ||
    normalized.includes("non ancora consolidato")
  ) {
    chips.push("limite");
  }

  return Array.from(new Set(chips));
}

function findChatReferenceValue(message: InternalAiChatMessage, prefix: string): string | null {
  const match = message.references.find((reference) => reference.label.startsWith(prefix));
  return match ? match.label.slice(prefix.length).trim() : null;
}

function buildChatDomainLabel(message: InternalAiChatMessage): string | null {
  const referenceLabel = findChatReferenceValue(message, DOMAIN_REFERENCE_PREFIX);
  if (referenceLabel) {
    return referenceLabel;
  }

  if (
    message.references.some((reference) =>
      reference.label.toLowerCase().includes(UNIFIED_ENGINE_REFERENCE.toLowerCase()),
    )
  ) {
    return "Sistema universale clone/NEXT";
  }

  if (message.intent === "report_targa" || message.intent === "mezzo_dossier") {
    return "Sistema universale clone/NEXT";
  }

  if (message.intent === "repo_understanding") {
    return "Repo, flussi e integrazione NEXT";
  }

  return null;
}

function buildChatReliabilityLabel(message: InternalAiChatMessage): string | null {
  const referenceLabel = findChatReferenceValue(message, RELIABILITY_REFERENCE_PREFIX);
  if (referenceLabel) {
    return referenceLabel;
  }

  const trustMatch = message.text.match(
    /Verdetto fiducia:\s*(Affidabile|Prudente|Da verificare)/i,
  );
  if (trustMatch) {
    return trustMatch[1]
      .charAt(0)
      .toUpperCase()
      .concat(trustMatch[1].slice(1).toLowerCase());
  }

  if (message.intent === "report_targa" || message.intent === "mezzo_dossier") {
    return "Affidabile";
  }

  if (message.intent === "repo_understanding" || message.intent === "capabilities") {
    return "Parziale";
  }

  if (message.intent === "non_supportato") {
    return "Da verificare";
  }

  return null;
}

function renderChatMessageText(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const bulletLines = lines.filter((line) => line.startsWith("- "));

    if (lines.length > 1 && bulletLines.length === lines.length) {
      return (
        <ul
          key={`chat-block:${index}`}
          className="internal-ai-chat__message-text"
          style={{ margin: "0 0 12px 18px", padding: 0 }}
        >
          {bulletLines.map((line) => (
            <li key={`chat-line:${index}:${line}`}>{line.slice(2)}</li>
          ))}
        </ul>
      );
    }

    if (lines.length > 2 && !lines[0].startsWith("- ") && bulletLines.length === lines.length - 1) {
      return (
        <div key={`chat-block:${index}`}>
          <p className="internal-ai-chat__message-text">{lines[0]}</p>
          <ul
            className="internal-ai-chat__message-text"
            style={{ margin: "0 0 12px 18px", padding: 0 }}
          >
            {lines.slice(1).map((line) => (
              <li key={`chat-line:${index}:${line}`}>{line.replace(/^- /, "")}</li>
            ))}
          </ul>
        </div>
      );
    }

    return (
      <p key={`chat-block:${index}`} className="internal-ai-chat__message-text">
        {block}
      </p>
    );
  });
}

function renderReportDocumentContent(
  report: InternalAiReportPreview,
  workflow: InternalAiServerReportSummaryWorkflow | null,
) {
  if (report.reportType === "targa") {
    return <InternalAiProfessionalVehicleReportView report={report} workflow={workflow} />;
  }

  return (
    <div className="internal-ai-document">
      <header className="internal-ai-document__header">
        <p className="internal-ai-card__eyebrow">Contenuto strutturato</p>
        <h2>{report.title}</h2>
        <p className="next-panel__description">{report.subtitle}</p>
        <div className="internal-ai-pill-row">
          <span className="internal-ai-pill is-neutral">{getReportTypeLabel(report)}</span>
          <span className="internal-ai-pill is-neutral">{getReportTargetChip(report)}</span>
          <span className="internal-ai-pill is-neutral">
            Generata il {formatDateLabel(report.generatedAt)}
          </span>
          <span className="internal-ai-pill is-neutral">
            Periodo {report.periodContext.label}
          </span>
          <span className="internal-ai-pill is-neutral">{getReportHeaderMetaChip(report)}</span>
        </div>
        {renderPreviewState(report.previewState)}
        {renderApprovalState(report.approvalState)}
      </header>

      <section className="internal-ai-grid">
        {report.cards.map((card) => (
          <article key={`document-card:${card.label}`} className="internal-ai-card">
            <p className="internal-ai-card__eyebrow">{card.label}</p>
            <h3>{card.value}</h3>
            <p className="internal-ai-card__meta">{card.meta}</p>
          </article>
        ))}
      </section>

      {workflow ? (
        <article className="next-panel" style={{ marginTop: 16 }}>
          <div className="next-panel__header">
            <h2>Sintesi IA server-side</h2>
          </div>
          <p className="next-panel__description">{workflow.previewText}</p>
          <div className="internal-ai-pill-row">
            <span className="internal-ai-pill is-neutral">
              {workflow.providerTarget.provider.toUpperCase()}
            </span>
            <span className="internal-ai-pill is-neutral">{workflow.providerTarget.model}</span>
            <span className={statusToneClass(workflow.requestState)}>
              {SERVER_REPORT_SUMMARY_REQUEST_LABELS[workflow.requestState]}
            </span>
            <span className={statusToneClass(workflow.approvalState)}>
              {SERVER_REPORT_SUMMARY_APPROVAL_LABELS[workflow.approvalState]}
            </span>
            <span className={statusToneClass(workflow.rollbackState)}>
              {SERVER_REPORT_SUMMARY_ROLLBACK_LABELS[workflow.rollbackState]}
            </span>
          </div>
          <p className="internal-ai-card__meta">{workflow.previewNote}</p>
        </article>
      ) : null}

      <div className="next-section-grid">
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Sezioni del report</h2>
          </div>
          <div className="internal-ai-list">
            {report.sections.map((item) => (
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
                {item.periodNote ? <p className="internal-ai-card__meta">{item.periodNote}</p> : null}
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
            {report.sources.map((source) => (
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
                {source.periodNote ? <p className="internal-ai-card__meta">{source.periodNote}</p> : null}
                {source.notes.length ? (
                  <ul className="internal-ai-inline-list">
                    {source.notes.map((note) => (
                      <li key={`${source.id}:note:${note}`}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="next-section-grid">
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Dati mancanti</h2>
          </div>
          {report.missingData.length ? (
            <ul className="internal-ai-inline-list">
              {report.missingData.map((entry) => (
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
            {report.evidences.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}

function runtimeObserverStatusClass(status: string) {
  if (status === "observed") {
    return "internal-ai-pill is-positive";
  }

  return statusToneClass(status);
}

function buildRuntimeObserverMetrics(
  runtimeObserver: InternalAiServerRepoUnderstandingSnapshot["runtimeObserver"],
) {
  const routes = Array.isArray(runtimeObserver.routes) ? runtimeObserver.routes : [];
  const stateObservations = routes.flatMap((route) =>
    Array.isArray(route.stateObservations) ? route.stateObservations : [],
  );
  const stateKindCounts = stateObservations.reduce<
    Record<
      string,
      {
        attempted: number;
        observed: number;
        partial: number;
        unavailable: number;
      }
    >
  >((accumulator, stateObservation) => {
    const key = stateObservation.kind ?? "route_state";
    const current =
      accumulator[key] ??
      (accumulator[key] = {
        attempted: 0,
        observed: 0,
        partial: 0,
        unavailable: 0,
      });

    current.attempted += 1;
    if (stateObservation.status === "observed") {
      current.observed += 1;
    } else if (stateObservation.status === "partial") {
      current.partial += 1;
    } else if (stateObservation.status === "unavailable") {
      current.unavailable += 1;
    }

    return accumulator;
  }, {});

  return {
    routeCount: runtimeObserver.routeCount ?? routes.length,
    observedRouteCount:
      runtimeObserver.observedRouteCount ??
      routes.filter((route) => route.status === "observed").length,
    partialRouteCount:
      runtimeObserver.partialRouteCount ??
      routes.filter((route) => route.status === "partial").length,
    unavailableRouteCount:
      runtimeObserver.unavailableRouteCount ??
      routes.filter((route) => route.status === "unavailable").length,
    stateCount: runtimeObserver.stateCount ?? stateObservations.length,
    observedStateCount:
      runtimeObserver.observedStateCount ??
      stateObservations.filter((state) => state.status === "observed").length,
    partialStateCount:
      runtimeObserver.partialStateCount ??
      stateObservations.filter((state) => state.status === "partial").length,
    unavailableStateCount:
      runtimeObserver.unavailableStateCount ??
      stateObservations.filter((state) => state.status === "unavailable").length,
    stateKindCounts,
  };
}

function readRepoDependencyMaps(
  snapshot: InternalAiServerRepoUnderstandingSnapshot | null | undefined,
): RepoDependencyMapPreviewEntry[] {
  const candidate = (
    snapshot as (InternalAiServerRepoUnderstandingSnapshot & {
      dependencyMaps?: RepoDependencyMapPreviewEntry[];
    }) | null | undefined
  )?.dependencyMaps;

  return Array.isArray(candidate) ? candidate : [];
}

function normalizeChatPrompt(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function detectChatMemoryScreenHint(prompt: string): string | null {
  const normalized = normalizeChatPrompt(prompt);
  const patterns: Array<[RegExp, string]> = [
    [/\bhome\b/, "home"],
    [/\bflussi?\b/, "flussi"],
    [/\bfile\b/, "file"],
    [/\bmodul[oi]\b/, "modulo"],
    [/\brepo\b/, "repo"],
    [/\bschermat[ae]\b/, "schermata"],
    [/\bdove la metteresti\b/, "dove-la-metteresti"],
    [/\bquale file\b/, "quale-file"],
  ];

  for (const [pattern, label] of patterns) {
    if (pattern.test(normalized)) {
      return label;
    }
  }

  return null;
}

function isRepoUiMemoryPrompt(prompt: string): boolean {
  const normalized = normalizeChatPrompt(prompt);
  return (
    normalized.includes("analizza la home") ||
    normalized.includes("analizza home") ||
    normalized.includes("dimmi come migliorare i flussi") ||
    normalized.includes("migliorare i flussi") ||
    normalized.includes("questa funzione dove la metteresti") ||
    normalized.includes("dove la metteresti") ||
    normalized.includes("dove metteresti") ||
    normalized.includes("quale file tocco") ||
    normalized.includes("quale file devo toccare") ||
    normalized.includes("spiegami la home") ||
    normalized.includes("come migliorare") ||
    normalized.includes("schermata") ||
    normalized.includes("screen") ||
    normalized.includes("flussi")
  );
}

function getRepoMemoryFreshness(
  repoUnderstandingState: RepoUnderstandingState,
): InternalAiChatMemoryFreshness {
  if (repoUnderstandingState.status !== "ready" || !repoUnderstandingState.snapshot) {
    return "missing";
  }

  const observedAtValue = repoUnderstandingState.snapshot.runtimeObserver.observedAt;
  const observedAt = observedAtValue ? new Date(observedAtValue).getTime() : Number.NaN;
  if (Number.isNaN(observedAt)) {
    return repoUnderstandingState.snapshot.runtimeObserver.status === "observed"
      ? "partial"
      : "missing";
  }

  const ageDays = (Date.now() - observedAt) / (24 * 60 * 60 * 1000);
  if (repoUnderstandingState.snapshot.runtimeObserver.status === "observed" && ageDays <= 7) {
    return "fresh";
  }

  if (
    repoUnderstandingState.snapshot.runtimeObserver.status === "partial" ||
    ageDays <= 30
  ) {
    return "partial";
  }

  return "stale";
}

function buildChatMemoryHints(args: {
  prompt: string;
  attachments: InternalAiChatAttachment[];
  repoUnderstandingState: RepoUnderstandingState;
}): InternalAiChatMemoryHints {
  return {
    repoUiRequested: isRepoUiMemoryPrompt(args.prompt),
    memoryFreshness: getRepoMemoryFreshness(args.repoUnderstandingState),
    screenHint: detectChatMemoryScreenHint(args.prompt),
    focusKind: args.attachments.length > 0 ? "attachment" : isRepoUiMemoryPrompt(args.prompt) ? "repo_ui" : "general",
    attachmentsCount: args.attachments.length,
    runtimeObserverObserved:
      args.repoUnderstandingState.status === "ready" &&
      args.repoUnderstandingState.snapshot?.runtimeObserver.status === "observed",
  };
}

function buildMemoryFreshnessLabel(freshness: InternalAiChatMemoryFreshness): string {
  switch (freshness) {
    case "fresh":
      return "fresca";
    case "partial":
      return "parziale";
    case "stale":
      return "da aggiornare";
    default:
      return "assente";
  }
}

function outputModeToneClass(mode: InternalAiOutputMode | null) {
  if (mode === "report_pdf" || mode === "artifact_document") {
    return "internal-ai-pill is-positive";
  }

  if (
    mode === "ui_integration_proposal" ||
    mode === "next_integration_confirmation_required" ||
    mode === "chat_structured"
  ) {
    return "internal-ai-pill is-warning";
  }

  return "internal-ai-pill is-neutral";
}

function outputModeCardTone(mode: InternalAiOutputMode | null) {
  const toneClass = outputModeToneClass(mode);
  if (toneClass.includes("positive")) {
    return "is-positive";
  }
  if (toneClass.includes("warning")) {
    return "is-warning";
  }
  return "is-neutral";
}

function buildContractLabelMap(contractCatalog: ReturnType<typeof readInternalAiScaffoldSnapshot>["contractCatalog"]) {
  return new Map<string, string>(contractCatalog.map((entry) => [entry.id, entry.title]));
}

function normalizeDocumentProposalValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry ?? "")).join(" ").trim().toLowerCase();
  }

  return String(value ?? "").trim().toLowerCase();
}

function buildAttachmentDrivenBasePrompt(args: {
  prompt: string;
  attachments: InternalAiChatAttachment[];
  resolvedChatTarga: string | null;
  unifiedConsoleScopes: UnifiedConsoleScopeFilter[];
}): string {
  const trimmedPrompt = args.prompt.trim();
  if (trimmedPrompt) {
    return trimmedPrompt;
  }

  if (args.attachments.length > 0) {
    return args.attachments.length === 1
      ? "Controlla questo documento allegato"
      : "Controlla questi documenti allegati";
  }

  if (args.resolvedChatTarga) {
    return `Fammi il quadro completo della targa ${args.resolvedChatTarga}`;
  }

  if (args.unifiedConsoleScopes.includes("attenzione_oggi")) {
    return "Dimmi cosa richiede attenzione oggi";
  }

  return "Fammi il quadro completo";
}

function buildDocumentRouteClassificationLabel(route: InternalAiUniversalDocumentRoute): string {
  const prefill = route.handoffPayload?.prefillCanonico ?? {};
  const mode = normalizeDocumentProposalValue(prefill.warehouseInvoiceMode);
  const viewTarget = normalizeDocumentProposalValue(prefill.vistaTarget);

  if (route.classification === "tabella_materiali") {
    if (mode === "carica_stock_adblue") {
      return "Fattura AdBlue di Magazzino";
    }

    if (viewTarget === "documenti-costi") {
      return "Fattura materiali di Magazzino";
    }

    return "Tabella materiali / inventario";
  }

  if (route.classification === "preventivo_fornitore") {
    return "Preventivo fornitore";
  }

  if (route.classification === "documento_cisterna") {
    return "Documento cisterna";
  }

  if (route.classification === "documento_mezzo") {
    return "Documento mezzo";
  }

  if (route.classification === "documento_ambiguo") {
    return "Documento ambiguo";
  }

  if (route.classification === "immagine_generica") {
    return "Immagine generica";
  }

  return "Testo operativo";
}

function buildDocumentRouteActionLabel(route: InternalAiUniversalDocumentRoute): string {
  const prefill = route.handoffPayload?.prefillCanonico ?? {};
  const mode = normalizeDocumentProposalValue(prefill.warehouseInvoiceMode);
  const viewTarget = normalizeDocumentProposalValue(prefill.vistaTarget);

  if (route.status === "da_verificare" || route.classification === "documento_ambiguo") {
    return "DA VERIFICARE";
  }

  if (route.classification === "tabella_materiali") {
    if (mode === "carica_stock_adblue") {
      return "Carica stock AdBlue";
    }

    if (viewTarget === "documenti-costi") {
      return "Riconcilia documento";
    }

    return "Apri inventario Magazzino";
  }

  if (route.classification === "preventivo_fornitore") {
    return "Apri Procurement";
  }

  if (route.classification === "documento_cisterna") {
    return "Apri Cisterna";
  }

  if (route.classification === "documento_mezzo") {
    return "Apri Documenti IA";
  }

  return "Continua in chat";
}

function buildDocumentRouteSafetyLabel(route: InternalAiUniversalDocumentRoute): string {
  const prefill = route.handoffPayload?.prefillCanonico ?? {};
  const mode = normalizeDocumentProposalValue(prefill.warehouseInvoiceMode);
  const viewTarget = normalizeDocumentProposalValue(prefill.vistaTarget);

  if (route.classification === "tabella_materiali" && mode === "carica_stock_adblue") {
    return "Il carico stock resta bloccato finche non confermi nel modulo Magazzino.";
  }

  if (route.classification === "tabella_materiali" && viewTarget === "documenti-costi") {
    return "Il modulo Magazzino verifica anti-doppio-carico, UDM e copertura del documento prima di qualunque scrittura.";
  }

  if (route.status === "da_verificare" || route.classification === "documento_ambiguo") {
    return "Il clone non propone scritture automatiche finche il caso non diventa chiaro.";
  }

  return "La proposta resta prudente e richiede sempre conferma utente nel modulo target.";
}

function buildDocumentRouteFollowupQuestion(route: InternalAiUniversalDocumentRoute): string | null {
  const prefill = route.handoffPayload?.prefillCanonico ?? {};
  const mode = normalizeDocumentProposalValue(prefill.warehouseInvoiceMode);

  if (route.status !== "da_verificare" && route.classification !== "documento_ambiguo") {
    return null;
  }

  if (route.classification === "tabella_materiali" && mode === "carica_stock_adblue") {
    return "Confermi che la fattura riguarda AdBlue in litri e che il carico non e gia stato registrato?";
  }

  if (route.classification === "tabella_materiali") {
    return "Confermi che il documento riguarda una fattura materiali di Magazzino e non un allegato generico?";
  }

  return "Il documento riguarda davvero Magazzino oppure un altro dominio del gestionale?";
}

function buildDocumentRouteOpenLabel(route: InternalAiUniversalDocumentRoute): string {
  const prefill = route.handoffPayload?.prefillCanonico ?? {};
  const viewTarget = normalizeDocumentProposalValue(prefill.vistaTarget);

  if (route.classification === "tabella_materiali" && viewTarget === "documenti-costi") {
    return route.status === "da_verificare"
      ? "Apri verifica guidata in Magazzino"
      : "Apri proposta in Magazzino";
  }

  if (route.classification === "documento_ambiguo" || route.status === "inbox_documentale") {
    return "Apri DA VERIFICARE";
  }

  return `Apri ${route.suggestedModuleLabel}`;
}

function buildDocumentRouteConfidenceLabel(route: InternalAiUniversalDocumentRoute): string {
  switch (route.confidence) {
    case "alta":
      return "Alta";
    case "media":
      return "Media";
    case "prudente":
      return "Prudente";
    default:
      return "Da verificare";
  }
}

type DocumentProposalFactTone = "default" | "positive" | "warning";

type DocumentProposalFact = {
  label: string;
  value: string;
  tone?: DocumentProposalFactTone;
};

type DocumentProposalDetectedItem = {
  description: string;
  quantity: string;
  unit: string;
  supplier: string;
  match: string;
  inventory: string;
  tone?: DocumentProposalFactTone;
};

const DOCUMENT_PROPOSAL_FIELD_LABELS: Record<string, string> = {
  fornitore: "Fornitore",
  supplier: "Fornitore",
  dataDocumento: "Data documento",
  dataFattura: "Data documento",
  documentoData: "Data documento",
  numeroDocumento: "Numero documento",
  numeroFattura: "Numero documento",
  documentoNumero: "Numero documento",
  materiale: "Materiale",
  queryMateriale: "Materiale",
  descrizione: "Descrizione",
  quantita: "Quantita",
  unita: "Unita",
  unitaMisura: "Unita",
  udm: "Unita",
  totale: "Totale",
  totaleDocumento: "Totale",
  importoTotale: "Totale",
  costo: "Costo",
  costoSupporto: "Costo di supporto",
  flusso: "Flusso",
  vistaTarget: "Vista target",
  warehouseInvoiceMode: "Modalita fattura",
  targa: "Targa",
  cisterna: "Cisterna",
  documentoNome: "Documento",
};

function formatDocumentProposalValue(
  value: InternalAiUniversalNormalizedValue | undefined,
): string | null {
  if (Array.isArray(value)) {
    const normalized = value
      .map((entry) => String(entry ?? "").trim())
      .filter(Boolean);
    return normalized.length ? normalized.join(", ") : null;
  }

  if (typeof value === "boolean") {
    return value ? "Si" : "No";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }

  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function pickDocumentProposalValue(
  record: Record<string, InternalAiUniversalNormalizedValue>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = formatDocumentProposalValue(record[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function mapDocumentProposalFactTone(hasValue: boolean, preferred?: DocumentProposalFactTone) {
  if (!hasValue) {
    return "warning";
  }
  return preferred ?? "default";
}

function buildDocumentProposalStatusLabel(route: InternalAiUniversalDocumentRoute): string {
  const actionLabel = buildDocumentRouteActionLabel(route);
  if (route.status === "da_verificare" || route.classification === "documento_ambiguo") {
    return "DA VERIFICARE";
  }

  if (actionLabel === "Carica stock AdBlue") {
    return "Pronto con conferma";
  }

  if (actionLabel === "Riconcilia documento") {
    return "Riconciliazione proposta";
  }

  return "Instradamento pronto";
}

function buildDocumentProposalPillClass(
  route: InternalAiUniversalDocumentRoute,
  kind: "status" | "action" | "confidence",
): string {
  if (kind === "confidence") {
    return route.confidence === "alta"
      ? "internal-ai-pill is-positive"
      : route.confidence === "media"
        ? "internal-ai-pill is-neutral"
        : "internal-ai-pill is-warning";
  }

  if (route.status === "da_verificare" || route.classification === "documento_ambiguo") {
    return "internal-ai-pill is-warning";
  }

  if (
    kind === "action" &&
    buildDocumentRouteActionLabel(route) === "Carica stock AdBlue"
  ) {
    return "internal-ai-pill is-positive";
  }

  return "internal-ai-pill is-neutral";
}

function buildDocumentProposalActionReason(route: InternalAiUniversalDocumentRoute): string {
  const rationale = route.rationale[0] ?? route.handoffPayload?.motivoInstradamento;
  if (rationale) {
    return rationale;
  }

  if (route.classification === "tabella_materiali") {
    return "Il documento viene trattato come scheda documentale di Magazzino con handoff prudente.";
  }

  return "Il documento viene instradato nel clone senza aperture automatiche fuori perimetro.";
}

function buildDocumentProposalActionBoundary(route: InternalAiUniversalDocumentRoute): string {
  const prefill = route.handoffPayload?.prefillCanonico ?? {};
  const mode = normalizeDocumentProposalValue(prefill.warehouseInvoiceMode);
  const viewTarget = normalizeDocumentProposalValue(prefill.vistaTarget);

  if (route.status === "da_verificare" || route.classification === "documento_ambiguo") {
    return "Non avvio scritture automatiche e resto in attesa di verifica umana.";
  }

  if (route.classification === "tabella_materiali" && mode === "carica_stock_adblue") {
    return "Non tocco consegne, manutenzioni, ordini o preventivi: preparo solo il caso AdBlue nel flusso consentito.";
  }

  if (route.classification === "tabella_materiali" && viewTarget === "documenti-costi") {
    return "Non aumento lo stock in automatico: il modulo Magazzino deve confermare l'eventuale riconciliazione senza doppio carico.";
  }

  return "Non eseguo azioni business senza conferma esplicita nel modulo target.";
}

function formatDocumentProposalFieldLabel(key: string): string {
  return (
    DOCUMENT_PROPOSAL_FIELD_LABELS[key] ??
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^\w/, (match) => match.toUpperCase())
  );
}

function buildDocumentProposalSummaryFacts(route: InternalAiUniversalDocumentRoute): DocumentProposalFact[] {
  const normalizedData = route.handoffPayload?.datiEstrattiNormalizzati ?? {};
  const prefill = route.handoffPayload?.prefillCanonico ?? {};
  const allData = { ...normalizedData, ...prefill };

  const supplier = pickDocumentProposalValue(allData, ["fornitore", "supplier"]);
  const documentDate = pickDocumentProposalValue(allData, [
    "dataDocumento",
    "dataFattura",
    "documentoData",
  ]);
  const documentNumber = pickDocumentProposalValue(allData, [
    "numeroDocumento",
    "numeroFattura",
    "documentoNumero",
  ]);
  const mainMaterial =
    pickDocumentProposalValue(allData, ["materiale", "queryMateriale", "descrizione"]) ??
    route.handoffPayload?.entityRef?.label ??
    route.entityCandidateLabels[0] ??
    null;
  const quantity = pickDocumentProposalValue(allData, ["quantita"]);
  const unit = pickDocumentProposalValue(allData, ["unita", "unitaMisura", "udm"]);
  const total = pickDocumentProposalValue(allData, [
    "totale",
    "totaleDocumento",
    "importoTotale",
    "costo",
    "costoSupporto",
  ]);

  return [
    {
      label: "Fornitore",
      value: supplier ?? "Non rilevato",
      tone: mapDocumentProposalFactTone(Boolean(supplier)),
    },
    {
      label: "Data documento",
      value: documentDate ?? "Non rilevata",
      tone: mapDocumentProposalFactTone(Boolean(documentDate)),
    },
    {
      label: "Numero documento",
      value: documentNumber ?? "Non rilevato",
      tone: mapDocumentProposalFactTone(Boolean(documentNumber)),
    },
    {
      label: "Materiale principale",
      value: mainMaterial ?? "Non rilevato",
      tone: mapDocumentProposalFactTone(Boolean(mainMaterial), "positive"),
    },
    {
      label: "Quantita",
      value: quantity ?? "Non rilevata",
      tone: mapDocumentProposalFactTone(Boolean(quantity)),
    },
    {
      label: "Unita",
      value: unit ?? "Non rilevata",
      tone: mapDocumentProposalFactTone(Boolean(unit)),
    },
    {
      label: "Totale / costo",
      value: total ?? "Non rilevato",
      tone: mapDocumentProposalFactTone(Boolean(total)),
    },
  ];
}

function buildDocumentProposalExtractedFacts(route: InternalAiUniversalDocumentRoute): DocumentProposalFact[] {
  const normalizedData = route.handoffPayload?.datiEstrattiNormalizzati ?? {};
  const prefill = route.handoffPayload?.prefillCanonico ?? {};
  const ignoredKeys = new Set([
    "documentoNome",
    "prompt",
    "warehouseInvoiceHint",
    "warehouseInvoiceMode",
  ]);
  const seenLabels = new Set<string>();
  const facts: DocumentProposalFact[] = [];

  [...Object.entries(prefill), ...Object.entries(normalizedData)].forEach(([key, rawValue]) => {
    if (ignoredKeys.has(key)) {
      return;
    }
    const value = formatDocumentProposalValue(rawValue);
    if (!value) {
      return;
    }
    const label = formatDocumentProposalFieldLabel(key);
    if (seenLabels.has(label)) {
      return;
    }
    seenLabels.add(label);
    facts.push({
      label,
      value,
      tone:
        key === "flusso" || key === "vistaTarget"
          ? "positive"
          : route.handoffPayload?.campiDaVerificare.includes(key)
            ? "warning"
            : "default",
    });
  });

  if (route.handoffPayload?.campiDaVerificare.length) {
    facts.push({
      label: "Campi da verificare",
      value: route.handoffPayload.campiDaVerificare
        .map((entry) => formatDocumentProposalFieldLabel(entry))
        .join(", "),
      tone: "warning",
    });
  }

  if (route.handoffPayload?.campiMancanti.length) {
    facts.push({
      label: "Campi mancanti",
      value: route.handoffPayload.campiMancanti
        .map((entry) => formatDocumentProposalFieldLabel(entry))
        .join(", "),
      tone: "warning",
    });
  }

  return facts.slice(0, 10);
}

function buildDocumentProposalDetectedItems(
  route: InternalAiUniversalDocumentRoute,
): DocumentProposalDetectedItem[] {
  const normalizedData = route.handoffPayload?.datiEstrattiNormalizzati ?? {};
  const prefill = route.handoffPayload?.prefillCanonico ?? {};
  const combinedData = { ...normalizedData, ...prefill };
  const quantity = pickDocumentProposalValue(combinedData, ["quantita"]) ?? "—";
  const unit = pickDocumentProposalValue(combinedData, ["unita", "unitaMisura", "udm"]) ?? "—";
  const supplier = pickDocumentProposalValue(combinedData, ["fornitore", "supplier"]) ?? "—";
  const entityLabel = route.handoffPayload?.entityRef?.label ?? "—";
  const descriptions = [
    pickDocumentProposalValue(combinedData, ["materiale", "queryMateriale", "descrizione"]),
    ...route.entityCandidateLabels,
  ]
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean)
    .filter((entry, index, collection) => collection.indexOf(entry) === index)
    .slice(0, 4);

  if (descriptions.length === 0) {
    return [];
  }

  return descriptions.map((description, index) => ({
    description,
    quantity: index === 0 ? quantity : "—",
    unit: index === 0 ? unit : "—",
    supplier: index === 0 ? supplier : "—",
    match:
      route.status === "da_verificare"
        ? "DA VERIFICARE"
        : entityLabel !== "—" && index === 0
          ? "Match con inventario trovato"
          : "Riferimento documentale",
    inventory: entityLabel !== "—" && index === 0 ? entityLabel : "—",
    tone:
      route.status === "da_verificare"
        ? "warning"
        : entityLabel !== "—" && index === 0
          ? "positive"
          : "default",
  }));
}

function buildDocumentProposalMatchFacts(route: InternalAiUniversalDocumentRoute): DocumentProposalFact[] {
  const prefill = route.handoffPayload?.prefillCanonico ?? {};
  const mode = normalizeDocumentProposalValue(prefill.warehouseInvoiceMode);
  const entityRef = route.handoffPayload?.entityRef;
  const facts: DocumentProposalFact[] = [];

  facts.push({
    label: "Materiale / entita trovata",
    value: entityRef?.label ?? "Nessun match forte",
    tone: entityRef ? "positive" : "warning",
  });

  if (route.classification === "tabella_materiali" && mode === "carica_stock_adblue") {
    facts.push({
      label: "Esito stock",
      value:
        route.status === "da_verificare"
          ? "DA VERIFICARE prima del carico AdBlue"
          : "Carico inventario AdBlue solo dopo conferma",
      tone: route.status === "da_verificare" ? "warning" : "positive",
    });
  } else if (route.classification === "tabella_materiali") {
    facts.push({
      label: "Esito stock",
      value:
        route.status === "da_verificare"
          ? "DA VERIFICARE prima di qualunque riconciliazione"
          : "Solo riconciliazione documento, nessun nuovo carico stock",
      tone: route.status === "da_verificare" ? "warning" : "positive",
    });
  }

  facts.push({
    label: "Presidio",
    value: buildDocumentRouteSafetyLabel(route),
    tone: route.status === "da_verificare" ? "warning" : "default",
  });

  return facts;
}

function NextInternalAiPage({
  sectionId = "overview",
  initialChatInput,
  initialChatAttachments,
  surfaceVariant = "page",
  autoSubmitInitialChat = false,
}: NextInternalAiPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
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
  useEffect(() => {
    let cancelled = false;

    void hydrateInternalAiServerPersistence().then((result) => {
      if (cancelled) {
        return;
      }

      if (result.artifactRepositoryHydrated) {
        setSnapshotVersion((value) => value + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);
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
  const [chatInput, setChatInput] = useState(() => initialChatInput?.trim() ?? "");
  const [selectedQuickRequest, setSelectedQuickRequest] = useState("");
  const [unifiedConsoleTarga, setUnifiedConsoleTarga] = useState("");
  const [unifiedConsoleScopes, setUnifiedConsoleScopes] = useState<UnifiedConsoleScopeFilter[]>([
    "quadro",
  ]);
  const [unifiedConsoleOutput, setUnifiedConsoleOutput] =
    useState<UnifiedConsoleOutputPreference>("thread");
  const [unifiedRegistryState, setUnifiedRegistryState] = useState<UnifiedRegistryState>({
    status: "idle",
    summary: null,
    message: null,
  });
  const [chatMessages, setChatMessages] = useState<InternalAiChatMessage[]>([]);
  const [chatAttachments, setChatAttachments] = useState<InternalAiChatAttachment[]>([]);
  const [chatAttachmentRepositoryState, setChatAttachmentRepositoryState] =
    useState<ChatAttachmentRepositoryState>({
      status: "idle",
      message: null,
      items: [],
      transport: "non_attivo",
      transportMessage: null,
    });
  const [chatStatus, setChatStatus] = useState<InternalAiChatExecutionStatus>("idle");
  const [reportPreviewModalState, setReportPreviewModalState] = useState<ReportPreviewModalState>({
    isOpen: false,
    report: null,
    artifactId: null,
  });
  const [reportPdfPreviewState, setReportPdfPreviewState] = useState<ReportPdfPreviewState>({
    status: "idle",
    url: null,
    blob: null,
    fileName: null,
    message: null,
  });
  const [reportDocumentActionMessage, setReportDocumentActionMessage] = useState<string | null>(
    null,
  );
  const [openedArtifactId, setOpenedArtifactId] = useState<string | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatDocumentProposalPanelRef = useRef<HTMLDivElement | null>(null);
  const chatAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const chatAttachmentsRef = useRef<InternalAiChatAttachment[]>([]);
  const reportPdfPreviewUrlRef = useRef<string | null>(null);
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
  const [reportSummaryWorkflowState, setReportSummaryWorkflowState] =
    useState<ReportSummaryWorkflowState>({
      status: "idle",
      message: null,
      workflow: null,
      reportSignature: null,
    });
  const [chatBridgeState, setChatBridgeState] = useState<ReportBridgeState>({
    transport: "non_attivo",
    transportMessage: null,
  });
  const [chatDocumentProposalState, setChatDocumentProposalState] = useState<ChatDocumentProposalState>({
    status: "idle",
    result: null,
    message: null,
  });
  const [repoUnderstandingState, setRepoUnderstandingState] = useState<RepoUnderstandingState>({
    status: "idle",
    message: null,
    snapshot: null,
    transport: "non_attivo",
    transportMessage: null,
  });
  const [vehicleReportBridgeState, setVehicleReportBridgeState] = useState<ReportBridgeState>({
    transport: "non_attivo",
    transportMessage: null,
  });
  const [driverReportBridgeState, setDriverReportBridgeState] = useState<ReportBridgeState>({
    transport: "non_attivo",
    transportMessage: null,
  });
  const [combinedReportBridgeState, setCombinedReportBridgeState] = useState<ReportBridgeState>({
    transport: "non_attivo",
    transportMessage: null,
  });
  const [economicAnalysisPreviewState, setEconomicAnalysisPreviewState] =
    useState<EconomicAnalysisPreviewState>({
      status: "idle",
      message: null,
      preview: null,
      transport: "non_attivo",
      transportMessage: null,
    });
  const [documentsPreviewState, setDocumentsPreviewState] = useState<DocumentsPreviewState>({
    status: "idle",
    message: null,
    preview: null,
    transport: "non_attivo",
    transportMessage: null,
  });
  const [librettoPreviewState, setLibrettoPreviewState] = useState<LibrettoPreviewState>({
    status: "idle",
    message: null,
    preview: null,
    transport: "non_attivo",
    transportMessage: null,
  });
  const [preventiviPreviewState, setPreventiviPreviewState] = useState<PreventiviPreviewState>({
    status: "idle",
    message: null,
    preview: null,
    transport: "non_attivo",
    transportMessage: null,
  });

  useEffect(() => {
    let cancelled = false;
    const loadUnifiedRegistrySummary = async () => {
      setUnifiedRegistryState((current) => ({
        status: "loading",
        summary: current.summary,
        message: current.message,
      }));

      try {
        const summary = await readInternalAiUnifiedRegistrySummary();
        if (cancelled) {
          return;
        }
        setUnifiedRegistryState({
          status: "ready",
          summary,
          message: "Registry unificato aggiornato dal perimetro dati canonico.",
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setUnifiedRegistryState({
          status: "error",
          summary: null,
          message:
            error instanceof Error
              ? `Impossibile leggere il registry unificato: ${error.message}`
              : "Impossibile leggere il registry unificato.",
        });
      }
    };

    void loadUnifiedRegistrySummary();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadRepoUnderstandingSnapshot(refresh = false) {
    setRepoUnderstandingState({
      status: "loading",
      message: refresh
        ? "Aggiornamento della snapshot controllata repo/UI in corso..."
        : "Caricamento della snapshot controllata repo/UI...",
      snapshot: null,
      transport: "server_http_retrieval",
      transportMessage: refresh
        ? "Richiesta di refresh verso il retrieval server-side read-only."
        : "Tentativo di lettura della snapshot repo/UI dal backend IA separato.",
    });

    const result = await readInternalAiServerRepoUnderstandingSnapshot(refresh);
    if (result.status === "ready") {
      setRepoUnderstandingState({
        status: "ready",
        message: result.message,
        snapshot: result.payload,
        transport: "server_http_retrieval",
        transportMessage: result.message,
      });
      return;
    }

    setRepoUnderstandingState({
      status: result.status,
      message: result.message,
      snapshot: null,
      transport: result.status === "not_enabled" ? "non_attivo" : "server_http_retrieval",
      transportMessage: result.message,
    });
  }

  useEffect(() => {
    let cancelled = false;

    if (repoUnderstandingState.status !== "idle") {
      return () => {
        cancelled = true;
      };
    }

    void Promise.resolve().then(async () => {
      if (cancelled) {
        return;
      }

      setRepoUnderstandingState({
        status: "loading",
        message: "Caricamento della snapshot controllata repo/UI...",
        snapshot: null,
        transport: "server_http_retrieval",
        transportMessage: "Tentativo di lettura della snapshot repo/UI dal backend IA separato.",
      });

      const result = await readInternalAiServerRepoUnderstandingSnapshot(false);
      if (cancelled) {
        return;
      }

      if (result.status === "ready") {
        setRepoUnderstandingState({
          status: "ready",
          message: result.message,
          snapshot: result.payload,
          transport: "server_http_retrieval",
          transportMessage: result.message,
        });
        return;
      }

      setRepoUnderstandingState({
        status: result.status,
        message: result.message,
        snapshot: null,
        transport: result.status === "not_enabled" ? "non_attivo" : "server_http_retrieval",
        transportMessage: result.message,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [repoUnderstandingState.status]);

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      if (cancelled) {
        return;
      }

      setChatAttachmentRepositoryState({
        status: "loading",
        message: "Caricamento degli allegati IA-only della conversazione...",
        items: chatAttachmentsRef.current,
        transport: "server_http_retrieval",
        transportMessage: "Tentativo di lettura allegati dal backend IA separato.",
      });

      const result = await readInternalAiServerChatAttachmentsSnapshot();
      if (cancelled) {
        return;
      }

      if (result.status === "ready") {
        const mergedAttachments = [
          ...result.payload,
          ...chatAttachmentsRef.current.filter(
            (entry) => !result.payload.some((loaded) => loaded.id === entry.id),
          ),
        ];
        setChatAttachments(mergedAttachments);
        setChatAttachmentRepositoryState({
          status: "ready",
          message: result.message,
          items: mergedAttachments,
          transport: "server_http_retrieval",
          transportMessage: result.message,
        });
        return;
      }

      setChatAttachmentRepositoryState({
        status: result.status,
        message: result.message,
        items: chatAttachmentsRef.current,
        transport: result.status === "not_enabled" ? "non_attivo" : "server_http_retrieval",
        transportMessage: result.message,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    chatAttachmentsRef.current = chatAttachments;
  }, [chatAttachments]);

  useEffect(() => {
    return () => {
      chatAttachmentsRef.current.forEach((attachment) => {
        if (attachment.storageMode === "local_browser_only" && attachment.localObjectUrl) {
          URL.revokeObjectURL(attachment.localObjectUrl);
        }
      });
    };
  }, []);

  const activeReportSignature = getInternalAiReportSignature(activeReportState.report);
  const visibleReportSummaryMessage =
    reportSummaryWorkflowState.reportSignature === activeReportSignature
      ? reportSummaryWorkflowState.message
      : null;
  const visibleReportSummaryWorkflow =
    reportSummaryWorkflowState.reportSignature === activeReportSignature
      ? reportSummaryWorkflowState.workflow
      : null;
  const openedArtifact = useMemo(
    () => snapshot.artifacts.find((artifact) => artifact.id === openedArtifactId) ?? null,
    [openedArtifactId, snapshot.artifacts],
  );
  const modalReportSummaryWorkflow = useMemo(() => {
    if (!reportPreviewModalState.report || !visibleReportSummaryWorkflow) {
      return null;
    }

    const activeSignature = getInternalAiReportSignature(reportPreviewModalState.report);
    const workflowSignature = activeReportState.report
      ? getInternalAiReportSignature(activeReportState.report)
      : null;

    return activeSignature && workflowSignature && activeSignature === workflowSignature
      ? visibleReportSummaryWorkflow
      : null;
  }, [reportPreviewModalState.report, visibleReportSummaryWorkflow, activeReportState.report]);
  const modalReportDocumentText = useMemo(
    () =>
      reportPreviewModalState.report
        ? buildInternalAiReportDocumentText(
            reportPreviewModalState.report,
            modalReportSummaryWorkflow,
          )
        : "",
    [reportPreviewModalState.report, modalReportSummaryWorkflow],
  );
  const latestAssistantMessage = useMemo(
    () =>
      [...chatMessages]
        .reverse()
        .find((message) => message.role === "assistente") ?? null,
    [chatMessages],
  );
  const runtimeObserverMetrics = useMemo(
    () =>
      repoUnderstandingState.status === "ready" && repoUnderstandingState.snapshot
        ? buildRuntimeObserverMetrics(repoUnderstandingState.snapshot.runtimeObserver)
        : null,
    [repoUnderstandingState.status, repoUnderstandingState.snapshot],
  );
  const runtimeObserverStateKindSummary = useMemo(() => {
    if (!runtimeObserverMetrics) {
      return "";
    }

    return Object.entries(runtimeObserverMetrics.stateKindCounts)
      .filter(([, counts]) => counts.attempted > 0)
      .sort((left, right) => right[1].attempted - left[1].attempted)
      .map(([kind, counts]) => {
        const label =
          RUNTIME_STATE_KIND_LABELS[kind as keyof typeof RUNTIME_STATE_KIND_LABELS] ?? kind;
        return `${label}: ${counts.observed}/${counts.attempted}`;
      })
      .join(" | ");
  }, [runtimeObserverMetrics]);
  const repoDependencyMaps = useMemo(
    () =>
      repoUnderstandingState.status === "ready"
        ? readRepoDependencyMaps(repoUnderstandingState.snapshot)
        : [],
    [repoUnderstandingState.status, repoUnderstandingState.snapshot],
  );
  const chatStatusCards = useMemo(
    () => [
      {
        label: "Backend server-side",
        value:
          snapshot.summary.backendMode === "server_adapter_mock_safe"
            ? "Attivo"
            : "Scaffold locale",
        tone:
          snapshot.summary.backendMode === "server_adapter_mock_safe"
            ? "is-positive"
            : "is-warning",
        detail: BACKEND_MODE_LABELS[snapshot.summary.backendMode],
      },
      {
        label: "OpenAI lato server",
        value:
          chatBridgeState.transport === "server_http_provider"
            ? "Attivo sulla risposta corrente"
            : "Fallback o contesto locale",
        tone:
          chatBridgeState.transport === "server_http_provider"
            ? "is-positive"
            : "is-warning",
        detail: BACKEND_PREVIEW_TRANSPORT_LABELS[chatBridgeState.transport],
      },
      {
        label: "Repo e UI understanding",
        value:
          repoUnderstandingState.status === "ready"
            ? "Snapshot controllata disponibile"
            : "Solo perimetro base",
        tone: repoUnderstandingState.status === "ready" ? "is-positive" : "is-neutral",
        detail:
          repoUnderstandingState.status === "ready" && repoUnderstandingState.snapshot
            ? repoUnderstandingState.snapshot.runtimeObserver.status === "observed"
              ? `Osservatore runtime NEXT attivo su ${runtimeObserverMetrics?.observedRouteCount ?? repoUnderstandingState.snapshot.runtimeObserver.routeCount} schermate osservate e ${runtimeObserverMetrics?.observedStateCount ?? repoUnderstandingState.snapshot.runtimeObserver.stateCount} stati davvero aperti.`
              : repoUnderstandingState.snapshot.runtimeObserver.status === "partial"
                ? `Osservatore runtime NEXT parziale: ${runtimeObserverMetrics?.observedRouteCount ?? 0}/${runtimeObserverMetrics?.routeCount ?? repoUnderstandingState.snapshot.runtimeObserver.routeCount} schermate osservate e ${runtimeObserverMetrics?.observedStateCount ?? 0}/${runtimeObserverMetrics?.stateCount ?? repoUnderstandingState.snapshot.runtimeObserver.stateCount} stati riusciti.`
                : repoUnderstandingState.transportMessage
            : repoUnderstandingState.transportMessage ?? "La comprensione repo/UI resta read-only e curata.",
      },
      {
        label: "Lettura business live",
        value: "Chiusa",
        tone: "is-neutral",
        detail:
          "Oggi la console usa solo read model NEXT clone-safe, snapshot D01/Dossier seedate dal clone e snapshot repo/UI curate. Firestore e Storage business live non sono una fonte attiva.",
      },
      {
        label: "Formato scelto dall'assistente",
        value: latestAssistantMessage?.outputMode
          ? CHAT_OUTPUT_MODE_LABELS[latestAssistantMessage.outputMode]
          : "Nessuna scelta registrata",
        tone: outputModeCardTone(latestAssistantMessage?.outputMode ?? null),
        detail:
          latestAssistantMessage?.outputReason ??
          "La scelta formato viene spiegata a ogni risposta assistente.",
      },
    ],
    [
      snapshot.summary.backendMode,
      chatBridgeState.transport,
      repoUnderstandingState.status,
      repoUnderstandingState.snapshot,
      runtimeObserverMetrics,
      repoUnderstandingState.transportMessage,
      latestAssistantMessage,
    ],
  );
  const chatPrimaryStatusCards = useMemo(
    () => {
      const memoryFreshness = buildMemoryFreshnessLabel(
        getRepoMemoryFreshness(repoUnderstandingState),
      );
      const backendState =
        chatBridgeState.transport === "server_http_provider"
          ? "attivo"
          : chatBridgeState.transport === "frontend_fallback"
            ? "fallback"
            : "non attivo";
      const realDataState =
        [economicAnalysisPreviewState.transport, documentsPreviewState.transport, librettoPreviewState.transport, preventiviPreviewState.transport].some(
          (transport) => transport === "server_http_retrieval",
        )
          ? "clone + snapshot"
          : [economicAnalysisPreviewState.transport, documentsPreviewState.transport, librettoPreviewState.transport, preventiviPreviewState.transport].some(
                (transport) => transport !== "non_attivo",
              )
            ? "clone/read model"
            : "inattiva";
      const observerState =
        repoUnderstandingState.status === "ready" && repoUnderstandingState.snapshot
          ? repoUnderstandingState.snapshot.runtimeObserver.status === "observed"
            ? "aggiornato"
            : repoUnderstandingState.snapshot.runtimeObserver.status === "partial"
              ? "parziale"
              : "vecchio"
          : "assente";

      return [
        {
          label: "Memoria UI/repo",
          value: memoryFreshness,
          tone:
            memoryFreshness === "fresca"
              ? "is-positive"
              : memoryFreshness === "parziale"
                ? "is-warning"
                : memoryFreshness === "da aggiornare"
                  ? "is-warning"
                  : "is-neutral",
        },
        {
          label: "Backend",
          value: backendState,
          tone: backendState === "attivo" ? "is-positive" : backendState === "fallback" ? "is-warning" : "is-neutral",
        },
        {
          label: "Fonte business",
          value: realDataState,
          tone:
            realDataState === "clone + snapshot"
              ? "is-positive"
              : realDataState === "clone/read model"
                ? "is-warning"
                : "is-neutral",
        },
        {
          label: "Observer",
          value: observerState,
          tone:
            observerState === "aggiornato"
              ? "is-positive"
              : observerState === "parziale" || observerState === "vecchio"
                ? "is-warning"
                : "is-neutral",
        },
      ];
    },
    [
      chatBridgeState.transport,
      documentsPreviewState.transport,
      economicAnalysisPreviewState.transport,
      librettoPreviewState.transport,
      preventiviPreviewState.transport,
      repoUnderstandingState,
    ],
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
  const resolvedChatTarga = useMemo(() => {
    if (selectedVehicle?.targa) {
      return selectedVehicle.targa;
    }

    return normalizeInternalAiVehicleLookupQuery(targaInput || unifiedConsoleTarga);
  }, [selectedVehicle, targaInput, unifiedConsoleTarga]);
  const sidebarArtifactGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        targa: string;
        items: InternalAiArtifact[];
        updatedAt: string;
      }
    >();

    sortedArtifacts.forEach((artifact) => {
      if (artifact.kind !== "report_preview") {
        return;
      }

      const embeddedReport = artifact.payload?.report;
      const embeddedVehicleTarga =
        embeddedReport && "mezzoTarga" in embeddedReport ? embeddedReport.mezzoTarga : null;
      const embeddedHeaderTarga =
        embeddedReport &&
        "header" in embeddedReport &&
        embeddedReport.header &&
        "targa" in embeddedReport.header
          ? embeddedReport.header.targa
          : null;
      const artifactTarga = normalizeInternalAiVehicleLookupQuery(
        artifact.mezzoTarga ?? embeddedVehicleTarga ?? embeddedHeaderTarga ?? "",
      );
      if (!artifactTarga) {
        return;
      }

      const existing = groups.get(artifactTarga);
      if (!existing) {
        groups.set(artifactTarga, {
          targa: artifactTarga,
          items: [artifact],
          updatedAt: artifact.updatedAt,
        });
        return;
      }

      if (existing.items.length < 3) {
        existing.items.push(artifact);
      }
      if (new Date(artifact.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        existing.updatedAt = artifact.updatedAt;
      }
    });

    return Array.from(groups.values())
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .slice(0, 8);
  }, [sortedArtifacts]);
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

  function closeReportPreviewModal() {
    if (reportPdfPreviewUrlRef.current) {
      revokePdfPreviewUrl(reportPdfPreviewUrlRef.current);
      reportPdfPreviewUrlRef.current = null;
    }
    setReportPreviewModalState({
      isOpen: false,
      report: null,
      artifactId: null,
    });
    setReportPdfPreviewState({
      status: "idle",
      url: null,
      blob: null,
      fileName: null,
      message: null,
    });
    setReportDocumentActionMessage(null);
  }

  useEffect(() => {
    trackInternalAiScreenVisit(sectionId, location.pathname);
  }, [location.pathname, sectionId]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatMessages, chatStatus]);

  useEffect(() => {
    if (
      chatAttachments.length === 0 ||
      (chatDocumentProposalState.status !== "loading" &&
        chatDocumentProposalState.status !== "ready" &&
        chatDocumentProposalState.status !== "error")
    ) {
      return;
    }

    window.requestAnimationFrame(() => {
      if (!chatDocumentProposalPanelRef.current) {
        return;
      }

      chatDocumentProposalPanelRef.current.scrollTop = 0;
      chatDocumentProposalPanelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, [chatAttachments.length, chatDocumentProposalState]);

  useEffect(() => {
    if (!reportPreviewModalState.isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeReportPreviewModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reportPreviewModalState.isOpen]);

  useEffect(() => {
    if (!reportDocumentActionMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setReportDocumentActionMessage(null), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [reportDocumentActionMessage]);

  useEffect(() => {
    let cancelled = false;
    let loadingTimeoutId: number | null = null;

    if (!reportPreviewModalState.isOpen || !reportPreviewModalState.report) {
      if (reportPdfPreviewUrlRef.current) {
        revokePdfPreviewUrl(reportPdfPreviewUrlRef.current);
        reportPdfPreviewUrlRef.current = null;
      }
      return () => {
        cancelled = true;
      };
    }

    loadingTimeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }
      setReportPdfPreviewState({
        status: "loading",
        url: null,
        blob: null,
        fileName: null,
        message:
          "Sto preparando il PDF del report a partire dall'artifact IA gia salvato, senza toccare dati business.",
      });
    }, 0);

    void (async () => {
      try {
        const pdf = await generateInternalAiReportPdfBlob({
          report: reportPreviewModalState.report!,
          workflow: modalReportSummaryWorkflow,
        });
        const preview = await openPreview({
          source: {
            blob: pdf.blob,
            fileName: pdf.fileName,
          },
          previousUrl: reportPdfPreviewUrlRef.current,
        });

        if (cancelled) {
          revokePdfPreviewUrl(preview.url);
          return;
        }

        reportPdfPreviewUrlRef.current = preview.url;
        setReportPdfPreviewState({
          status: "ready",
          url: preview.url,
          blob: preview.blob,
          fileName: preview.fileName,
          message:
            "PDF reale generato al volo dall'artifact IA dedicato. Nessuna scrittura business automatica.",
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (reportPdfPreviewUrlRef.current) {
          revokePdfPreviewUrl(reportPdfPreviewUrlRef.current);
          reportPdfPreviewUrlRef.current = null;
        }

        setReportPdfPreviewState({
          status: "error",
          url: null,
          blob: null,
          fileName: null,
          message:
            error instanceof Error
              ? `Impossibile generare il PDF del report: ${error.message}`
              : "Impossibile generare il PDF del report in questo browser.",
        });
      }
    })();

    return () => {
      cancelled = true;
      if (loadingTimeoutId !== null) {
        window.clearTimeout(loadingTimeoutId);
      }
    };
  }, [
    reportPreviewModalState.isOpen,
    reportPreviewModalState.report,
    modalReportSummaryWorkflow,
  ]);

  useEffect(() => {
    return () => {
      if (reportPdfPreviewUrlRef.current) {
        revokePdfPreviewUrl(reportPdfPreviewUrlRef.current);
        reportPdfPreviewUrlRef.current = null;
      }
    };
  }, []);

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

  const applyDocumentsPreviewBridgeReadResult = (
    bridgeResult: InternalAiDocumentsPreviewBridgeReadResult,
  ) => {
    const result = bridgeResult.result;

    if (result.status !== "ready") {
      setDocumentsPreviewState((current) => ({
        status: result.status,
        message: result.message,
        preview: current.preview,
        transport: bridgeResult.transport,
        transportMessage: bridgeResult.transportMessage,
      }));
      return;
    }

    setTargaInput(result.normalizedTarga);
    const catalogMatch =
      findInternalAiExactVehicleMatch(
        lookupCatalog.items,
        result.normalizedTarga,
      ) ?? null;
    if (catalogMatch) {
      setSelectedVehicle(catalogMatch);
    }
    setDocumentsPreviewState({
      status: "ready",
      message: result.message,
      preview: result.preview,
      transport: bridgeResult.transport,
      transportMessage: bridgeResult.transportMessage,
    });
  };

  const applyEconomicAnalysisPreviewBridgeReadResult = (
    bridgeResult: InternalAiEconomicAnalysisPreviewBridgeReadResult,
  ) => {
    const result = bridgeResult.result;

    if (result.status !== "ready") {
      setEconomicAnalysisPreviewState((current) => ({
        status: result.status,
        message: result.message,
        preview: current.preview,
        transport: bridgeResult.transport,
        transportMessage: bridgeResult.transportMessage,
      }));
      return;
    }

    setTargaInput(result.normalizedTarga);
    const catalogMatch =
      findInternalAiExactVehicleMatch(lookupCatalog.items, result.normalizedTarga) ?? null;
    if (catalogMatch) {
      setSelectedVehicle(catalogMatch);
    }
    setEconomicAnalysisPreviewState({
      status: "ready",
      message: result.message,
      preview: result.preview,
      transport: bridgeResult.transport,
      transportMessage: bridgeResult.transportMessage,
    });
  };

  const applyVehiclePreviewBridgeReadResult = (
    bridgeResult: InternalAiVehicleReportPreviewBridgeReadResult,
    source: "manuale" | "selezione_guidata" | "chat",
    periodLabel: string,
  ) => {
    setVehicleReportBridgeState({
      transport: bridgeResult.transport,
      transportMessage: bridgeResult.transportMessage,
    });
    applyVehiclePreviewReadResult(bridgeResult.result, source, periodLabel);
  };

  const applyDriverPreviewBridgeReadResult = (
    bridgeResult: InternalAiDriverReportPreviewBridgeReadResult,
    source: "manuale" | "selezione_guidata" | "chat",
    candidate: InternalAiDriverLookupCandidate | null,
    periodLabel: string,
  ) => {
    setDriverReportBridgeState({
      transport: bridgeResult.transport,
      transportMessage: bridgeResult.transportMessage,
    });
    applyDriverPreviewReadResult(bridgeResult.result, source, candidate, periodLabel);
  };

  const applyCombinedPreviewBridgeReadResult = (
    bridgeResult: InternalAiCombinedReportPreviewBridgeReadResult,
    source: "manuale" | "selezione_guidata" | "chat",
    candidate: InternalAiDriverLookupCandidate | null,
    periodLabel: string,
  ) => {
    setCombinedReportBridgeState({
      transport: bridgeResult.transport,
      transportMessage: bridgeResult.transportMessage,
    });
    applyCombinedPreviewReadResult(bridgeResult.result, source, candidate, periodLabel);
  };

  const applyLibrettoPreviewReadResult = (
    bridgeResult: InternalAiLibrettoPreviewBridgeReadResult,
  ) => {
    const result = bridgeResult.result;

    if (result.status !== "ready") {
      setLibrettoPreviewState((current) => ({
        status: result.status,
        message: result.message,
        preview: current.preview,
        transport: bridgeResult.transport,
        transportMessage: bridgeResult.transportMessage,
      }));
      return;
    }

    setTargaInput(result.normalizedTarga);
    const catalogMatch =
      findInternalAiExactVehicleMatch(lookupCatalog.items, result.normalizedTarga) ?? null;
    if (catalogMatch) {
      setSelectedVehicle(catalogMatch);
    }
    setLibrettoPreviewState({
      status: "ready",
      message: result.message,
      preview: result.preview,
      transport: bridgeResult.transport,
      transportMessage: bridgeResult.transportMessage,
    });
  };

  const applyPreventiviPreviewReadResult = (
    bridgeResult: InternalAiPreventiviPreviewBridgeReadResult,
  ) => {
    const result = bridgeResult.result;

    if (result.status !== "ready") {
      setPreventiviPreviewState((current) => ({
        status: result.status,
        message: result.message,
        preview: current.preview,
        transport: bridgeResult.transport,
        transportMessage: bridgeResult.transportMessage,
      }));
      return;
    }

    setTargaInput(result.normalizedTarga);
    const catalogMatch =
      findInternalAiExactVehicleMatch(lookupCatalog.items, result.normalizedTarga) ?? null;
    if (catalogMatch) {
      setSelectedVehicle(catalogMatch);
    }
    setPreventiviPreviewState({
      status: "ready",
      message: result.message,
      preview: result.preview,
      transport: bridgeResult.transport,
      transportMessage: bridgeResult.transportMessage,
    });
  };

  const handleSelectVehicle = (candidate: InternalAiVehicleLookupCandidate) => {
    setSelectedVehicle(candidate);
    setTargaInput(candidate.targa);
    setUnifiedConsoleTarga(candidate.targa);
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
      message: `Analisi in sola lettura in corso per la targa ${targaToRead} tramite backend IA separato mock-safe...`,
    });

    try {
      const result = await readInternalAiVehicleReportPreviewThroughBackend(
        targaToRead,
        reportPeriodInput,
      );
      applyVehiclePreviewBridgeReadResult(
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
      message:
        `Analisi in sola lettura in corso per l'autista ${candidateToUse?.nomeCompleto ?? normalizedDriverQuery} ` +
        "tramite backend IA separato mock-safe...",
    });

    try {
      const result = await readInternalAiDriverReportPreviewThroughBackend({
        driverCandidate: candidateToUse ?? null,
        rawDriverQuery: normalizedDriverQuery,
        periodInput: reportPeriodInput,
      });
      applyDriverPreviewBridgeReadResult(
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
        `${driverToUse?.nomeCompleto ?? normalizedDriverQuery} tramite backend IA separato mock-safe...`,
    });

    try {
      const result = await readInternalAiCombinedReportPreviewThroughBackend({
        driverCandidate: driverToUse ?? null,
        rawTarga: vehicleToUse?.targa ?? normalizedLookupQuery,
        rawDriverQuery: driverToUse?.nomeCompleto ?? normalizedDriverQuery,
        periodInput: reportPeriodInput,
      });
      applyCombinedPreviewBridgeReadResult(
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

  const handleGenerateDocumentsPreview = async () => {
    const candidateToUse =
      selectedVehicle && selectedVehicle.targa === normalizedLookupQuery
        ? selectedVehicle
        : exactVehicleMatch;
    const targaToRead = candidateToUse?.targa ?? normalizedLookupQuery;

    if (!targaToRead) {
      setDocumentsPreviewState({
        status: "invalid_query",
        message:
          "Inserisci una targa valida o seleziona un mezzo reale prima di aprire la preview documenti.",
        preview: documentsPreviewState.preview,
        transport: documentsPreviewState.transport,
        transportMessage: documentsPreviewState.transportMessage,
      });
      return;
    }

    if (!candidateToUse && lookupSuggestions.length > 0) {
      setDocumentsPreviewState({
        status: "invalid_query",
        message:
          lookupSuggestions.length === 1
            ? "Ricerca incompleta: seleziona il mezzo suggerito oppure completa la targa prima di aprire la preview documenti."
            : "Ricerca ambigua: seleziona un mezzo reale dall'elenco suggerito prima di aprire la preview documenti.",
        preview: documentsPreviewState.preview,
        transport: documentsPreviewState.transport,
        transportMessage: documentsPreviewState.transportMessage,
      });
      return;
    }

    setDocumentsPreviewState((current) => ({
      status: "loading",
      message: `Lettura documenti in corso per la targa ${targaToRead} tramite backend IA separato mock-safe...`,
      preview: current.preview,
      transport: current.transport,
      transportMessage: current.transportMessage,
    }));

    try {
      const result = await readInternalAiDocumentsPreviewThroughBackend(targaToRead);
      applyDocumentsPreviewBridgeReadResult(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto durante la costruzione della preview documenti.";

      setDocumentsPreviewState((current) => ({
        status: "error",
        message,
        preview: current.preview,
        transport: current.transport,
        transportMessage: current.transportMessage,
      }));
    }
  };

  const handleGenerateEconomicAnalysisPreview = async () => {
    const candidateToUse =
      selectedVehicle && selectedVehicle.targa === normalizedLookupQuery
        ? selectedVehicle
        : exactVehicleMatch;
    const targaToRead = candidateToUse?.targa ?? normalizedLookupQuery;

    if (!targaToRead) {
      setEconomicAnalysisPreviewState({
        status: "invalid_query",
        message:
          "Inserisci una targa valida o seleziona un mezzo reale prima di aprire l'analisi economica preview.",
        preview: economicAnalysisPreviewState.preview,
        transport: economicAnalysisPreviewState.transport,
        transportMessage: economicAnalysisPreviewState.transportMessage,
      });
      return;
    }

    if (!candidateToUse && lookupSuggestions.length > 0) {
      setEconomicAnalysisPreviewState({
        status: "invalid_query",
        message:
          lookupSuggestions.length === 1
            ? "Ricerca incompleta: seleziona il mezzo suggerito oppure completa la targa prima di aprire l'analisi economica preview."
            : "Ricerca ambigua: seleziona un mezzo reale dall'elenco suggerito prima di aprire l'analisi economica preview.",
        preview: economicAnalysisPreviewState.preview,
        transport: economicAnalysisPreviewState.transport,
        transportMessage: economicAnalysisPreviewState.transportMessage,
      });
      return;
    }

    setEconomicAnalysisPreviewState((current) => ({
      status: "loading",
      message: `Analisi economica preview in corso per la targa ${targaToRead} tramite backend IA separato mock-safe...`,
      preview: current.preview,
      transport: current.transport,
      transportMessage: current.transportMessage,
    }));

    try {
      const result = await readInternalAiEconomicAnalysisPreviewThroughBackend(targaToRead);
      applyEconomicAnalysisPreviewBridgeReadResult(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto durante la costruzione dell'analisi economica preview.";

      setEconomicAnalysisPreviewState((current) => ({
        status: "error",
        message,
        preview: current.preview,
        transport: current.transport,
        transportMessage: current.transportMessage,
      }));
    }
  };

  const handleGenerateLibrettoPreview = async () => {
    const candidateToUse =
      selectedVehicle && selectedVehicle.targa === normalizedLookupQuery
        ? selectedVehicle
        : exactVehicleMatch;
    const targaToRead = candidateToUse?.targa ?? normalizedLookupQuery;

    if (!targaToRead) {
      setLibrettoPreviewState((current) => ({
        status: "invalid_query",
        message:
          "Inserisci una targa valida o seleziona un mezzo reale prima di aprire la preview libretto.",
        preview: current.preview,
        transport: current.transport,
        transportMessage: current.transportMessage,
      }));
      return;
    }

    if (!candidateToUse && lookupSuggestions.length > 0) {
      setLibrettoPreviewState((current) => ({
        status: "invalid_query",
        message:
          lookupSuggestions.length === 1
            ? "Ricerca incompleta: seleziona il mezzo suggerito oppure completa la targa prima di aprire la preview libretto."
            : "Ricerca ambigua: seleziona un mezzo reale dall'elenco suggerito prima di aprire la preview libretto.",
        preview: current.preview,
        transport: current.transport,
        transportMessage: current.transportMessage,
      }));
      return;
    }

    setLibrettoPreviewState((current) => ({
      status: "loading",
      message: `Lettura libretto in corso per la targa ${targaToRead} tramite backend IA separato mock-safe...`,
      preview: current.preview,
      transport: current.transport,
      transportMessage: current.transportMessage,
    }));

    try {
      const result = await readInternalAiLibrettoPreviewThroughBackend(targaToRead);
      applyLibrettoPreviewReadResult(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto durante la costruzione della preview libretto.";

      setLibrettoPreviewState((current) => ({
        status: "error",
        message,
        preview: current.preview,
        transport: current.transport,
        transportMessage: current.transportMessage,
      }));
    }
  };

  const handleGeneratePreventiviPreview = async () => {
    const candidateToUse =
      selectedVehicle && selectedVehicle.targa === normalizedLookupQuery
        ? selectedVehicle
        : exactVehicleMatch;
    const targaToRead = candidateToUse?.targa ?? normalizedLookupQuery;

    if (!targaToRead) {
      setPreventiviPreviewState((current) => ({
        status: "invalid_query",
        message:
          "Inserisci una targa valida o seleziona un mezzo reale prima di aprire la preview preventivi.",
        preview: current.preview,
        transport: current.transport,
        transportMessage: current.transportMessage,
      }));
      return;
    }

    if (!candidateToUse && lookupSuggestions.length > 0) {
      setPreventiviPreviewState((current) => ({
        status: "invalid_query",
        message:
          lookupSuggestions.length === 1
            ? "Ricerca incompleta: seleziona il mezzo suggerito oppure completa la targa prima di aprire la preview preventivi."
            : "Ricerca ambigua: seleziona un mezzo reale dall'elenco suggerito prima di aprire la preview preventivi.",
        preview: current.preview,
        transport: current.transport,
        transportMessage: current.transportMessage,
      }));
      return;
    }

    setPreventiviPreviewState((current) => ({
      status: "loading",
      message: `Lettura preventivi in corso per la targa ${targaToRead} tramite backend IA separato mock-safe...`,
      preview: current.preview,
      transport: current.transport,
      transportMessage: current.transportMessage,
    }));

    try {
      const result = await readInternalAiPreventiviPreviewThroughBackend(targaToRead);
      applyPreventiviPreviewReadResult(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto durante la costruzione della preview preventivi.";

      setPreventiviPreviewState((current) => ({
        status: "error",
        message,
        preview: current.preview,
        transport: current.transport,
        transportMessage: current.transportMessage,
      }));
    }
  };

  const handleChatAttachmentPicker = () => {
    if (chatStatus === "running" || chatAttachmentRepositoryState.status === "loading") {
      return;
    }

    chatAttachmentInputRef.current?.click();
  };

  const handleChatAttachmentSelection = useCallback(
    async (files: FileList | File[] | null) => {
      const fileItems = Array.from(files ?? []).slice(0, 6);
      if (
        !fileItems.length ||
        chatStatus === "running" ||
        chatAttachmentRepositoryState.status === "loading"
      ) {
        return;
      }

      const nextAttachments = [...chatAttachments];
      let nextTransport: ChatAttachmentRepositoryState["transport"] = "server_http_retrieval";
      let nextMessage = "Allegati IA-only aggiornati nella conversazione.";
      let sawServerUpload = false;

      setChatAttachmentRepositoryState((current) => ({
        ...current,
        status: "loading",
        message: "Caricamento allegati IA-only in corso...",
        transport: "server_http_retrieval",
        transportMessage: "Upload verso backend IA separato o fallback locale.",
      }));

      for (const file of fileItems) {
        if (file.size > 4 * 1024 * 1024) {
          nextTransport = "frontend_fallback";
          nextMessage = `File escluso per dimensione: ${file.name}. Il limite IA-only e 4 MB.`;
          continue;
        }

        const result = await uploadInternalAiServerChatAttachment(file);
        if (result.status === "ready") {
          sawServerUpload = true;
          const preservedLocalAttachments = nextAttachments.filter(
            (entry) =>
              entry.storageMode === "local_browser_only" &&
              !result.repositoryState.some((serverAttachment) => serverAttachment.id === entry.id),
          );
          nextAttachments.splice(
            0,
            nextAttachments.length,
            ...[...result.repositoryState, ...preservedLocalAttachments].slice(0, 12),
          );
        } else if (result.attachment) {
          const attachment = result.attachment;
          const merged = [attachment, ...nextAttachments.filter((entry) => entry.id !== attachment.id)];
          nextAttachments.splice(0, nextAttachments.length, ...merged.slice(0, 12));
        }

        nextTransport =
          result.status === "ready" ? "server_http_retrieval" : "frontend_fallback";
        nextMessage = result.message;
      }

      setChatAttachments([...nextAttachments]);

      setChatAttachmentRepositoryState({
        status: nextAttachments.length ? "ready" : "error",
        message: nextMessage,
        items: [...nextAttachments],
        transport: nextTransport || (sawServerUpload ? "server_http_retrieval" : "frontend_fallback"),
        transportMessage: nextMessage,
      });
    },
    [chatAttachmentRepositoryState.status, chatAttachments, chatStatus],
  );

  const initialLauncherAttachmentsProcessedRef = useRef(false);
  const [initialChatAttachmentsReady, setInitialChatAttachmentsReady] = useState(
    () => !initialChatAttachments?.length,
  );

  useEffect(() => {
    if (initialLauncherAttachmentsProcessedRef.current) {
      return;
    }

    if (!initialChatAttachments?.length) {
      return;
    }

    if (chatAttachmentRepositoryState.status === "loading") {
      return;
    }

    initialLauncherAttachmentsProcessedRef.current = true;
    void handleChatAttachmentSelection(initialChatAttachments).finally(() => {
      setInitialChatAttachmentsReady(true);
    });
  }, [chatAttachmentRepositoryState.status, handleChatAttachmentSelection, initialChatAttachments]);

  const handleOpenChatAttachment = (attachment: InternalAiChatAttachment) => {
    const url = buildInternalAiChatAttachmentAssetUrl(attachment);
    if (!url || typeof window === "undefined") {
      return;
    }

    window.open(url, "_blank", "noreferrer");
  };

  const handleRemoveChatAttachment = async (attachment: InternalAiChatAttachment) => {
    if (chatStatus === "running") {
      return;
    }

    if (attachment.storageMode === "local_browser_only") {
      if (attachment.localObjectUrl) {
        URL.revokeObjectURL(attachment.localObjectUrl);
      }

      setChatAttachments((current) => current.filter((entry) => entry.id !== attachment.id));
      setChatAttachmentRepositoryState((current) => {
        const nextItems = current.items.filter((entry) => entry.id !== attachment.id);
        if (!nextItems.length) {
          return {
            status: "idle",
            message: null,
            items: [],
            transport: "non_attivo",
            transportMessage: null,
          };
        }

        return {
          status: "ready",
          message: "Allegato locale rimosso dalla conversazione.",
          items: nextItems,
          transport:
            nextItems.some((entry) => entry.storageMode === "server_file_isolated")
              ? "server_http_retrieval"
              : "frontend_fallback",
          transportMessage: "Allegato locale rimosso dalla conversazione.",
        };
      });
      return;
    }

    const result = await removeInternalAiServerChatAttachment(attachment.id);
    if (result.status !== "ready" || !result.attachment || !result.repositoryState) {
      setChatAttachmentRepositoryState((current) => ({
        ...current,
        status: result.status === "not_found" ? "error" : result.status,
        message: result.message,
        transport: result.status === "not_enabled" ? "frontend_fallback" : current.transport,
        transportMessage: result.message,
      }));
      return;
    }

    setChatAttachments((current) => {
      const preservedLocalAttachments = current.filter(
        (entry) => entry.storageMode === "local_browser_only" && entry.id !== attachment.id,
      );
      return [...result.repositoryState, ...preservedLocalAttachments];
    });
    setChatAttachmentRepositoryState({
      status: "ready",
      message: result.message,
      items: [...result.repositoryState],
      transport: "server_http_retrieval",
      transportMessage: result.message,
    });
  };

  const buildChatAssistantMemoryLead = (memoryHints: InternalAiChatMemoryHints): string | null => {
    const freshnessLabel = buildMemoryFreshnessLabel(memoryHints.memoryFreshness);
    const focusLabel = buildChatMemoryFocusLabel(memoryHints.screenHint);
    const attachmentLabel =
      memoryHints.attachmentsCount > 0
        ? memoryHints.attachmentsCount === 1
          ? "1 allegato IA-only nella conversazione"
          : `${memoryHints.attachmentsCount} allegati IA-only nella conversazione`
        : null;

    if (memoryHints.repoUiRequested) {
      if (memoryHints.memoryFreshness === "fresh") {
        return `Sto usando memoria osservata fresca della UI/repo${focusLabel ? ` ${focusLabel}` : ""}${attachmentLabel ? ` e ${attachmentLabel}` : ""}.`;
      }

      if (memoryHints.memoryFreshness === "partial") {
        return `Sto usando memoria osservata parziale della UI/repo${focusLabel ? ` ${focusLabel}` : ""}${attachmentLabel ? ` e ${attachmentLabel}` : ""}: segnalo i limiti.`;
      }

      if (memoryHints.memoryFreshness === "stale") {
        return `Sto usando memoria osservata della UI/repo${focusLabel ? ` ${focusLabel}` : ""}, ma e da aggiornare${attachmentLabel ? `; ${attachmentLabel}` : ""}.`;
      }

      return `Mi manca una memoria osservata aggiornata della UI/repo${focusLabel ? ` ${focusLabel}` : ""}${attachmentLabel ? `; vedo solo ${attachmentLabel}` : ""}.`;
    }

    if (attachmentLabel) {
      return `Vedo ${attachmentLabel} come contesto dichiarato.`;
    }

    if (freshnessLabel !== "assente") {
      return `Stato memoria osservata: ${freshnessLabel}.`;
    }

    return null;
  };

  const toggleUnifiedConsoleScope = (scopeId: UnifiedConsoleScopeFilter) => {
    setUnifiedConsoleScopes((current) =>
      current.includes(scopeId)
        ? current.filter((entry) => entry !== scopeId)
        : [...current, scopeId],
    );
  };

  const hydrateQuickRequest = (template: string) => {
    if (!resolvedChatTarga) {
      return template;
    }

    return template.replace(/AB123CD/gi, resolvedChatTarga).replace(/TI 315407/gi, resolvedChatTarga);
  };

  const resetUnifiedConsoleFilters = () => {
    setUnifiedConsoleTarga("");
    setTargaInput("");
    setSelectedVehicle(null);
    setSelectedQuickRequest("");
    setUnifiedConsoleScopes(["quadro"]);
    setUnifiedConsoleOutput("thread");
  };

  const buildUnifiedConsoleRequest = (rawPrompt: string) => {
    const trimmedPrompt = rawPrompt.trim();
    const selectedScopeLabels = UNIFIED_CONSOLE_SCOPE_OPTIONS.filter((entry) =>
      unifiedConsoleScopes.includes(entry.id),
    ).map((entry) => entry.label);

    const basePrompt = buildAttachmentDrivenBasePrompt({
      prompt: trimmedPrompt,
      attachments: chatAttachments,
      resolvedChatTarga,
      unifiedConsoleScopes,
    });
    const shouldAnnotateScopes = !(
      chatAttachments.length > 0 &&
      unifiedConsoleScopes.length === 1 &&
      unifiedConsoleScopes[0] === "quadro"
    );

    const contextParts = [
      resolvedChatTarga ? `targa ${resolvedChatTarga}` : null,
      shouldAnnotateScopes && selectedScopeLabels.length
        ? `ambiti ${selectedScopeLabels.join(", ")}`
        : null,
      unifiedConsoleOutput !== "thread"
        ? `output ${UNIFIED_OUTPUT_LABELS[unifiedConsoleOutput].toLowerCase()}`
        : null,
    ].filter((entry): entry is string => Boolean(entry));

    const visiblePrompt =
      contextParts.length > 0 ? `${basePrompt} [${contextParts.join("; ")}]` : basePrompt;

    return {
      visiblePrompt,
      promptForEngine:
        `${basePrompt}\n\n` +
        "[CONSOLE IA UNIFICATA]\n" +
        `Targa: ${resolvedChatTarga || "-"}\n` +
        `Ambiti: ${selectedScopeLabels.join(", ") || "-"}\n` +
        `Allegati: ${chatAttachments.map((attachment) => attachment.fileName).slice(0, 4).join(", ") || "-"}\n` +
        `Output: ${unifiedConsoleOutput}\n` +
        "[/CONSOLE IA UNIFICATA]",
    };
  };

  const canSubmitUnifiedConsole =
    Boolean(chatInput.trim()) ||
    chatAttachments.length > 0 ||
    Boolean(resolvedChatTarga) ||
    unifiedConsoleOutput !== "thread" ||
    unifiedConsoleScopes.some((scope) => scope !== "quadro");

  const liveUnifiedConsoleRequest = buildUnifiedConsoleRequest(chatInput);

  useEffect(() => {
    if (chatAttachments.length === 0) {
      setChatDocumentProposalState({
        status: "idle",
        result: null,
        message: null,
      });
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setChatDocumentProposalState((current) => ({
        status: "loading",
        result: current.result,
        message: "Classificazione automatica del documento in corso.",
      }));

      void orchestrateInternalAiUniversalRequest({
        prompt: liveUnifiedConsoleRequest.visiblePrompt,
        attachments: chatAttachments,
        preferredTarga: resolvedChatTarga || null,
      })
        .then((result) => {
          if (cancelled) {
            return;
          }

          syncInternalAiUniversalRequestsRepository({
            handoffs: result.handoffPayloads,
            inboxItems: result.documentInboxItems,
          });

          setChatDocumentProposalState({
            status: "ready",
            result,
            message:
              result.documentRoutes.length > 0
                ? "Documento classificato automaticamente e handoff preparato."
                : "Documento acquisito, ma senza una classificazione forte.",
          });
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          setChatDocumentProposalState({
            status: "error",
            result: null,
            message:
              error instanceof Error
                ? `Impossibile classificare l'allegato: ${error.message}`
                : "Impossibile classificare l'allegato con il router documentale.",
          });
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    chatAttachments,
    chatInput,
    liveUnifiedConsoleRequest.visiblePrompt,
    resolvedChatTarga,
    unifiedConsoleOutput,
    unifiedConsoleScopes,
  ]);

  const chatComposerHint =
    chatAttachments.length > 0
      ? "Con un allegato il testo e opzionale: la IA classifica il documento e propone il flusso corretto."
      : "`Invio` manda la richiesta. `Shift + Invio` va a capo.";
  const chatSubmitButtonLabel =
    chatStatus === "running"
      ? "Elaborazione..."
      : chatAttachments.length > 0 && !chatInput.trim()
        ? "Analizza allegato"
        : "Invia richiesta";
  const chatInputPlaceholderWithDocument =
    "Puoi scrivere una nota semplice come gestisci questa fattura, oppure lasciare vuoto: l'analisi parte dall'allegato.";

  const renderAutomaticDocumentProposalPanel = (surface: "page" | "home-modal" = "page") => {
    if (chatAttachments.length === 0) {
      return null;
    }

    const shellClassName =
      surface === "home-modal"
        ? "internal-ai-chat__document-proposal-shell is-home-modal"
        : "internal-ai-chat__document-proposal-shell";

    if (chatDocumentProposalState.status === "loading") {
      return (
        <section ref={chatDocumentProposalPanelRef} className={shellClassName} aria-live="polite">
          <article className="internal-ai-chat__document-proposal-card is-loading">
            <div className="internal-ai-chat__document-proposal-topline">
              <p className="internal-ai-card__eyebrow">Proposta automatica documento</p>
              <span className="internal-ai-pill is-neutral">Analisi in corso</span>
            </div>
            <h3 className="internal-ai-chat__document-proposal-title">
              Sto leggendo il documento allegato
            </h3>
            <p className="internal-ai-card__meta">
              {chatDocumentProposalState.message ??
                "Sto classificando il documento e preparando l'handoff prudente del clone."}
            </p>
          </article>
        </section>
      );
    }

    if (chatDocumentProposalState.status === "error") {
      return (
        <section ref={chatDocumentProposalPanelRef} className={shellClassName} aria-live="polite">
          <article className="internal-ai-chat__document-proposal-card is-warning">
            <div className="internal-ai-chat__document-proposal-topline">
              <p className="internal-ai-card__eyebrow">Proposta automatica documento</p>
              <span className="internal-ai-pill is-warning">DA VERIFICARE</span>
            </div>
            <h3 className="internal-ai-chat__document-proposal-title">
              Classificazione non conclusiva
            </h3>
            <p className="internal-ai-card__meta">{chatDocumentProposalState.message}</p>
          </article>
        </section>
      );
    }

    const routes = chatDocumentProposalState.result?.documentRoutes ?? [];

    if (routes.length === 0) {
      return (
        <section ref={chatDocumentProposalPanelRef} className={shellClassName} aria-live="polite">
          <article className="internal-ai-chat__document-proposal-card is-warning">
            <div className="internal-ai-chat__document-proposal-topline">
              <p className="internal-ai-card__eyebrow">Proposta automatica documento</p>
              <span className="internal-ai-pill is-warning">DA VERIFICARE</span>
            </div>
            <h3 className="internal-ai-chat__document-proposal-title">
              Nessun flusso forte disponibile
            </h3>
            <p className="internal-ai-card__meta">
              Il documento non ha ancora un flusso documentale forte. Resta prudente finche non emerge
              un target chiaro.
            </p>
          </article>
        </section>
      );
    }

    return (
      <section ref={chatDocumentProposalPanelRef} className={shellClassName} aria-live="polite">
        {routes.slice(0, 3).map((route) => {
          const attachment = chatAttachments.find((entry) => entry.id === route.attachmentId) ?? null;
          const openPath = route.handoffPayload?.routeTarget ?? route.targetPath;
          const followupQuestion = buildDocumentRouteFollowupQuestion(route);
          const actionLabel = buildDocumentRouteActionLabel(route);
          const classificationLabel = buildDocumentRouteClassificationLabel(route);
          const statusLabel = buildDocumentProposalStatusLabel(route);
          const summaryFacts = buildDocumentProposalSummaryFacts(route);
          const extractedFacts = buildDocumentProposalExtractedFacts(route);
          const detectedItems = buildDocumentProposalDetectedItems(route);
          const matchFacts = buildDocumentProposalMatchFacts(route);
          const evidenceText =
            attachment?.textExcerpt?.trim() ||
            route.rationale.join(" ").trim() ||
            route.handoffPayload?.motivoInstradamento ||
            "";
          const evidenceSupport = [
            attachment?.note?.trim() || null,
            attachment ? `Caricato ${formatDateLabel(attachment.uploadedAt)}` : null,
          ]
            .filter(Boolean)
            .join(" | ");

          return (
            <article
              key={`auto-proposal:${route.attachmentId}:${route.classification}`}
              className={`internal-ai-chat__document-proposal-card ${
                route.status === "da_verificare" || route.classification === "documento_ambiguo"
                  ? "is-warning"
                  : "is-ready"
              }`}
            >
              <div className="internal-ai-chat__document-dossier">
                <header className="internal-ai-chat__document-dossier-header">
                  <div className="internal-ai-chat__document-dossier-header-main">
                    <p className="internal-ai-card__eyebrow">Documento analizzato</p>
                    <h3 className="internal-ai-chat__document-proposal-title">
                      {classificationLabel}
                    </h3>
                    <p className="internal-ai-chat__document-dossier-file">{route.fileName}</p>
                  </div>
                  <div className="internal-ai-chat__document-dossier-header-side">
                    <div className="internal-ai-pill-row">
                      <span className={buildDocumentProposalPillClass(route, "status")}>
                        {statusLabel}
                      </span>
                      <span className={buildDocumentProposalPillClass(route, "action")}>
                        {actionLabel}
                      </span>
                      <span className={buildDocumentProposalPillClass(route, "confidence")}>
                        Confidenza {buildDocumentRouteConfidenceLabel(route)}
                      </span>
                    </div>
                    <div className="internal-ai-chat__document-dossier-meta-grid">
                      <article className="internal-ai-chat__document-dossier-meta-card">
                        <span className="internal-ai-chat__document-proposal-label">
                          Tipo documento rilevato
                        </span>
                        <strong>{classificationLabel}</strong>
                      </article>
                      <article className="internal-ai-chat__document-dossier-meta-card">
                        <span className="internal-ai-chat__document-proposal-label">
                          Stato / esito
                        </span>
                        <strong>{statusLabel}</strong>
                      </article>
                    </div>
                  </div>
                </header>

                <section className="internal-ai-chat__document-dossier-section">
                  <div className="internal-ai-chat__document-dossier-section-head">
                    <h4>Riassunto rapido</h4>
                    <span className="internal-ai-muted">Campi principali letti dal documento</span>
                  </div>
                  <div className="internal-ai-chat__document-dossier-summary-grid">
                    {summaryFacts.map((fact) => (
                      <article
                        key={`${route.attachmentId}:${fact.label}`}
                        className={`internal-ai-chat__document-dossier-fact-card is-${fact.tone ?? "default"}`}
                      >
                        <span className="internal-ai-chat__document-proposal-label">{fact.label}</span>
                        <strong>{fact.value}</strong>
                      </article>
                    ))}
                  </div>
                </section>

                <div className="internal-ai-chat__document-dossier-body">
                  <div className="internal-ai-chat__document-dossier-main">
                    <section className="internal-ai-chat__document-dossier-section">
                      <div className="internal-ai-chat__document-dossier-section-head">
                        <h4>Cosa ha capito la IA</h4>
                        <span className="internal-ai-muted">
                          Proposta guidata, senza cambiare il flusso documentale
                        </span>
                      </div>
                      <div className="internal-ai-chat__document-dossier-interpretation-grid">
                        <article className="internal-ai-chat__document-dossier-highlight">
                          <span className="internal-ai-chat__document-proposal-label">
                            Azione proposta
                          </span>
                          <strong>{actionLabel}</strong>
                          <p className="internal-ai-card__meta">
                            {buildDocumentProposalActionReason(route)}
                          </p>
                        </article>
                        <article className="internal-ai-chat__document-dossier-highlight is-secondary">
                          <span className="internal-ai-chat__document-proposal-label">
                            Cosa non fara
                          </span>
                          <strong>{buildDocumentRouteSafetyLabel(route)}</strong>
                          <p className="internal-ai-card__meta">
                            {buildDocumentProposalActionBoundary(route)}
                          </p>
                        </article>
                      </div>
                      {followupQuestion ? (
                        <div className="internal-ai-chat__document-dossier-alert">
                          <span className="internal-ai-chat__document-proposal-label">
                            Domanda per sbloccare
                          </span>
                          <strong>{followupQuestion}</strong>
                        </div>
                      ) : null}
                    </section>

                    <section className="internal-ai-chat__document-dossier-section">
                      <div className="internal-ai-chat__document-dossier-section-head">
                        <h4>Dati estratti</h4>
                        <span className="internal-ai-muted">
                          Valori strutturati disponibili per il modulo target
                        </span>
                      </div>
                      <div className="internal-ai-chat__document-dossier-data-grid">
                        {extractedFacts.length > 0 ? (
                          extractedFacts.map((fact) => (
                            <article
                              key={`${route.attachmentId}:estratto:${fact.label}`}
                              className={`internal-ai-chat__document-dossier-data-card is-${fact.tone ?? "default"}`}
                            >
                              <span className="internal-ai-chat__document-proposal-label">
                                {fact.label}
                              </span>
                              <strong>{fact.value}</strong>
                            </article>
                          ))
                        ) : (
                          <article className="internal-ai-chat__document-dossier-data-card is-warning">
                            <span className="internal-ai-chat__document-proposal-label">
                              Dati strutturati
                            </span>
                            <strong>DA VERIFICARE</strong>
                            <p className="internal-ai-card__meta">
                              Il documento non espone ancora campi estratti abbastanza stabili.
                            </p>
                          </article>
                        )}
                      </div>
                    </section>

                    <section className="internal-ai-chat__document-dossier-section">
                      <div className="internal-ai-chat__document-dossier-section-head">
                        <h4>Righe / materiali trovati</h4>
                        <span className="internal-ai-muted">
                          Riferimenti leggibili utili per match e riconciliazione
                        </span>
                      </div>
                      {detectedItems.length > 0 ? (
                        <div className="internal-ai-chat__document-dossier-items-table">
                          <div className="internal-ai-chat__document-dossier-items-head">
                            <span>Descrizione</span>
                            <span>Quantita</span>
                            <span>Unita</span>
                            <span>Fornitore</span>
                            <span>Esito match</span>
                            <span>Inventario trovato</span>
                          </div>
                          {detectedItems.map((item, index) => (
                            <article
                              key={`${route.attachmentId}:item:${item.description}:${index}`}
                              className={`internal-ai-chat__document-dossier-items-row is-${item.tone ?? "default"}`}
                            >
                              <strong>{item.description}</strong>
                              <span>{item.quantity}</span>
                              <span>{item.unit}</span>
                              <span>{item.supplier}</span>
                              <span>{item.match}</span>
                              <span>{item.inventory}</span>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="internal-ai-chat__document-dossier-empty">
                          Nessuna riga strutturata pronta: il clone mostra solo il riferimento documentale
                          prudente.
                        </div>
                      )}
                    </section>
                  </div>

                  <aside className="internal-ai-chat__document-dossier-side">
                    <section className="internal-ai-chat__document-dossier-section">
                      <div className="internal-ai-chat__document-dossier-section-head">
                        <h4>Match e riconciliazione</h4>
                        <span className="internal-ai-muted">
                          Come il documento si collega al Magazzino
                        </span>
                      </div>
                      <div className="internal-ai-chat__document-dossier-match-stack">
                        {matchFacts.map((fact) => (
                          <article
                            key={`${route.attachmentId}:match:${fact.label}`}
                            className={`internal-ai-chat__document-dossier-data-card is-${fact.tone ?? "default"}`}
                          >
                            <span className="internal-ai-chat__document-proposal-label">{fact.label}</span>
                            <strong>{fact.value}</strong>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="internal-ai-chat__document-dossier-section">
                      <div className="internal-ai-chat__document-dossier-section-head">
                        <h4>Evidenza / testo letto</h4>
                        <span className="internal-ai-muted">
                          Supporto di lettura, non testo dominante
                        </span>
                      </div>
                      <div className="internal-ai-chat__document-dossier-evidence">
                        <pre>{evidenceText || "Nessun estratto testuale disponibile nel thread corrente."}</pre>
                        {evidenceSupport ? (
                          <p className="internal-ai-card__meta">{evidenceSupport}</p>
                        ) : null}
                      </div>
                    </section>

                    <section className="internal-ai-chat__document-dossier-final-box">
                      <div className="internal-ai-chat__document-dossier-section-head">
                        <h4>Azione finale</h4>
                        <span className="internal-ai-muted">
                          La scrittura resta sempre subordinata alla conferma utente
                        </span>
                      </div>
                      <div className="internal-ai-chat__document-dossier-final-content">
                        <div className="internal-ai-pill-row">
                          <span className={buildDocumentProposalPillClass(route, "action")}>
                            {actionLabel}
                          </span>
                          <span className={buildDocumentProposalPillClass(route, "status")}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="internal-ai-card__meta">
                          {route.status === "da_verificare"
                            ? "Il caso resta prudente: puoi aprire la verifica guidata senza avviare scritture automatiche."
                            : "Aprendo il modulo target trovi il prefill del documento e decidi tu se confermare il passaggio successivo."}
                        </p>
                        <div className="internal-ai-search__actions internal-ai-chat__document-proposal-actions">
                          <button
                            type="button"
                            className={
                              route.status === "da_verificare" || route.classification === "documento_ambiguo"
                                ? "internal-ai-search__button internal-ai-search__button--secondary"
                                : "internal-ai-search__button"
                            }
                            onClick={() => navigate(openPath)}
                          >
                            {buildDocumentRouteOpenLabel(route)}
                          </button>
                          <span className="internal-ai-muted">
                            Nessuna azione business parte da qui senza conferma esplicita nel modulo di arrivo.
                          </span>
                        </div>
                      </div>
                    </section>
                  </aside>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    );
  };

  const handleChatSubmit = async (promptOverride?: string) => {
    const request = buildUnifiedConsoleRequest(promptOverride ?? chatInput);
    const prompt = request.promptForEngine.trim();
    if (!prompt || chatStatus === "running") {
      return;
    }

    const attachmentsSnapshot = [...chatAttachments];
    const memoryHints = buildChatMemoryHints({
      prompt: request.visiblePrompt,
      attachments: attachmentsSnapshot,
      repoUnderstandingState,
    });

    setChatMessages((current) => [
      ...current,
      createChatMessage({
        role: "utente",
        text: request.visiblePrompt,
        intent: "richiesta_generica",
        status: "completed",
        attachments: attachmentsSnapshot,
      }),
    ]);
    setChatInput("");
    setChatStatus("running");
    setChatBridgeState({
      transport: "non_attivo",
      transportMessage: null,
    });

    try {
      const bridgeResult = await runInternalAiChatTurnThroughBackend(prompt, reportPeriodInput, {
        attachments: attachmentsSnapshot,
        memoryHints,
      });
      const result = bridgeResult.result;
      let generatedArtifactId: string | null = null;
      setChatBridgeState({
        transport: bridgeResult.transport,
        transportMessage: bridgeResult.transportMessage,
      });
      trackInternalAiChatPrompt({
        prompt: request.visiblePrompt,
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
            const saved = persistArtifactForReport(result.report.preview);
            generatedArtifactId = saved.artifact.id;
            setOpenedArtifactId(saved.artifact.id);
            setActiveReportState((current) => ({
              ...current,
              draftMessage: saved.artifact.isPersisted
                ? `Anteprima report salvata nell'archivio IA dedicato: artifact ${saved.artifact.id}.`
                : `Anteprima report mantenuta nel fallback locale: artifact ${saved.artifact.id}.`,
            }));
            openReportPreviewModal(result.report.preview, saved.artifact.id);
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
            const saved = persistArtifactForReport(result.report.preview);
            generatedArtifactId = saved.artifact.id;
            setOpenedArtifactId(saved.artifact.id);
            setActiveReportState((current) => ({
              ...current,
              draftMessage: saved.artifact.isPersisted
                ? `Anteprima report salvata nell'archivio IA dedicato: artifact ${saved.artifact.id}.`
                : `Anteprima report mantenuta nel fallback locale: artifact ${saved.artifact.id}.`,
            }));
            openReportPreviewModal(result.report.preview, saved.artifact.id);
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
            const saved = persistArtifactForReport(result.report.preview);
            generatedArtifactId = saved.artifact.id;
            setOpenedArtifactId(saved.artifact.id);
            setActiveReportState((current) => ({
              ...current,
              draftMessage: saved.artifact.isPersisted
                ? `Anteprima report salvata nell'archivio IA dedicato: artifact ${saved.artifact.id}.`
                : `Anteprima report mantenuta nel fallback locale: artifact ${saved.artifact.id}.`,
            }));
            openReportPreviewModal(result.report.preview, saved.artifact.id);
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

      const outputSelection = selectInternalAiOutputMode({
        prompt: request.visiblePrompt,
        result,
        previousMessages: chatMessages,
        repoUnderstandingReady: repoUnderstandingState.status === "ready",
        runtimeObserverObserved:
          repoUnderstandingState.status === "ready" &&
          repoUnderstandingState.snapshot?.runtimeObserver.status === "observed",
        memoryHints,
      });

      const outputReferences: InternalAiChatMessage["references"] =
        outputSelection.mode === "ui_integration_proposal"
          ? [
              {
                type: "integration_guidance",
                label: "Guida integrazione NEXT osservata",
                targa: null,
              },
            ]
          : outputSelection.mode === "next_integration_confirmation_required"
            ? [
                {
                  type: "integration_confirmation",
                  label: "Richiede conferma per integrazione stabile nella NEXT",
                  targa: null,
                },
              ]
            : [];

      setChatMessages((current) => [
        ...current,
        createChatMessage({
          role: "assistente",
          text:
            result.report?.status === "ready"
              ? buildChatReportReadyText(result.report.preview)
              : [buildChatAssistantMemoryLead(memoryHints), result.assistantText]
                  .filter(Boolean)
                  .join("\n\n"),
          intent: result.intent,
          status: result.status,
          references: dedupeChatMessageReferences([
            ...result.references,
            ...outputReferences,
            ...(generatedArtifactId
              ? [
                  {
                    type: "report_preview" as const,
                    label: "Apri anteprima report",
                    targa:
                      result.report?.status === "ready" &&
                      "preview" in result.report &&
                      result.report.preview.reportType !== "autista"
                        ? result.report.preview.header.targa
                        : null,
                    artifactId: generatedArtifactId,
                  },
                  {
                    type: "artifact_archive" as const,
                    label: `Artifact ${generatedArtifactId}`,
                    targa: null,
                    artifactId: generatedArtifactId,
                  },
                  {
                    type: "safe_mode_notice" as const,
                    label: "Nessuna scrittura business automatica",
                    targa: null,
                  },
                ]
              : []),
          ]),
          outputMode: outputSelection.mode,
          outputReason: outputSelection.reason,
        }),
      ]);
      setChatStatus("idle");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore non previsto nell'orchestratore backend-first della chat interna.";
      setChatBridgeState({
        transport: "frontend_fallback",
        transportMessage:
          "La richiesta non si e conclusa sul backend server-side controllato o sul fallback locale clone-safe.",
      });

      trackInternalAiChatPrompt({
        prompt: request.visiblePrompt,
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
              label: "Errore dell'orchestratore chat controllata",
              targa: null,
            },
          ],
          outputMode: "chat_brief",
          outputReason:
            "La richiesta non ha prodotto un output strutturato: viene mostrato solo l'errore sintetico in chat.",
        }),
      ]);
      setChatStatus("idle");
    }
  };

  const initialChatSubmittedRef = useRef(false);

  useEffect(() => {
    if (initialChatSubmittedRef.current || !autoSubmitInitialChat || sectionId !== "overview") {
      return;
    }

    if (chatStatus === "running" || chatMessages.length > 0 || !initialChatAttachmentsReady) {
      return;
    }

    const initialPrompt = initialChatInput?.trim();
    if (!initialPrompt) {
      return;
    }

    initialChatSubmittedRef.current = true;
    void handleChatSubmit(initialPrompt);
    // handleChatSubmit changes identity every render; this effect is intentionally gated by refs/state above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoSubmitInitialChat,
    chatMessages.length,
    chatStatus,
    initialChatAttachmentsReady,
    initialChatInput,
    sectionId,
  ]);

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

  const handleGenerateServerReportSummary = async () => {
    if (!activeReportState.report || reportSummaryWorkflowState.status === "loading") {
      return;
    }

    const reportSignature = getInternalAiReportSignature(activeReportState.report);
    setReportSummaryWorkflowState({
      status: "loading",
      message: "Sto richiedendo la sintesi guidata lato server con preview controllata...",
      workflow: reportSummaryWorkflowState.workflow,
      reportSignature,
    });

    const result = await generateInternalAiServerReportSummaryPreview(activeReportState.report);
    if (!result) {
      setReportSummaryWorkflowState({
        status: "error",
        message:
          "Adapter server-side non raggiungibile. Il report resta disponibile in modalita locale clone-safe.",
        workflow: null,
        reportSignature,
      });
      return;
    }

    if (!result.ok) {
      setReportSummaryWorkflowState({
        status: "error",
        message: result.message,
        workflow: null,
        reportSignature,
      });
      return;
    }

    setReportSummaryWorkflowState({
      status: "ready",
      message: result.message,
      workflow: result.workflow,
      reportSignature,
    });
  };

  const handleApproveServerReportSummary = async () => {
    if (!reportSummaryWorkflowState.workflow || reportSummaryWorkflowState.status === "loading") {
      return;
    }

    setReportSummaryWorkflowState((current) => ({
      status: "loading",
      message: "Sto registrando l'approvazione esplicita della preview IA...",
      workflow: current.workflow,
      reportSignature: current.reportSignature,
    }));

    const result = await approveInternalAiServerReportSummaryPreview(
      reportSummaryWorkflowState.workflow.id,
    );
    if (!result) {
      setReportSummaryWorkflowState((current) => ({
        status: "error",
        message: "Adapter server-side non raggiungibile durante l'approvazione.",
        workflow: current.workflow,
        reportSignature: current.reportSignature,
      }));
      return;
    }

    if (!result.ok) {
      setReportSummaryWorkflowState((current) => ({
        status: "error",
        message: result.message,
        workflow: current.workflow,
        reportSignature: current.reportSignature,
      }));
      return;
    }

    setReportSummaryWorkflowState({
      status: "ready",
      message: result.message,
      workflow: result.workflow,
      reportSignature: getInternalAiReportSignature(activeReportState.report),
    });
  };

  const handleRejectServerReportSummary = async () => {
    if (!reportSummaryWorkflowState.workflow || reportSummaryWorkflowState.status === "loading") {
      return;
    }

    setReportSummaryWorkflowState((current) => ({
      status: "loading",
      message: "Sto registrando il rifiuto esplicito della preview IA...",
      workflow: current.workflow,
      reportSignature: current.reportSignature,
    }));

    const result = await rejectInternalAiServerReportSummaryPreview(
      reportSummaryWorkflowState.workflow.id,
    );
    if (!result) {
      setReportSummaryWorkflowState((current) => ({
        status: "error",
        message: "Adapter server-side non raggiungibile durante il rifiuto.",
        workflow: current.workflow,
        reportSignature: current.reportSignature,
      }));
      return;
    }

    if (!result.ok) {
      setReportSummaryWorkflowState((current) => ({
        status: "error",
        message: result.message,
        workflow: current.workflow,
        reportSignature: current.reportSignature,
      }));
      return;
    }

    setReportSummaryWorkflowState({
      status: "ready",
      message: result.message,
      workflow: result.workflow,
      reportSignature: getInternalAiReportSignature(activeReportState.report),
    });
  };

  const handleRollbackServerReportSummary = async () => {
    if (!reportSummaryWorkflowState.workflow || reportSummaryWorkflowState.status === "loading") {
      return;
    }

    setReportSummaryWorkflowState((current) => ({
      status: "loading",
      message: "Sto registrando il rollback del workflow IA dedicato...",
      workflow: current.workflow,
      reportSignature: current.reportSignature,
    }));

    const result = await rollbackInternalAiServerReportSummaryPreview(
      reportSummaryWorkflowState.workflow.id,
    );
    if (!result) {
      setReportSummaryWorkflowState((current) => ({
        status: "error",
        message: "Adapter server-side non raggiungibile durante il rollback.",
        workflow: current.workflow,
        reportSignature: current.reportSignature,
      }));
      return;
    }

    if (!result.ok) {
      setReportSummaryWorkflowState((current) => ({
        status: "error",
        message: result.message,
        workflow: current.workflow,
        reportSignature: current.reportSignature,
      }));
      return;
    }

    setReportSummaryWorkflowState({
      status: "ready",
      message: result.message,
      workflow: result.workflow,
      reportSignature: getInternalAiReportSignature(activeReportState.report),
    });
  };

  const persistArtifactForReport = (report: InternalAiReportPreview) => {
    const saved = saveInternalAiDraftArtifact({ report });
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
    return saved;
  };

  const openReportPreviewModal = (report: InternalAiReportPreview, artifactId: string | null) => {
    setReportPreviewModalState({
      isOpen: true,
      report: cloneReportPreview(report),
      artifactId,
    });
    setReportPdfPreviewState({
      status: "loading",
      url: null,
      blob: null,
      fileName: null,
      message: "Sto preparando l'anteprima PDF del report...",
    });
    setReportDocumentActionMessage(null);
  };

  const handlePrepareReportPdf = () => {
    if (!activeReportState.report) {
      return;
    }

    openReportPreviewModal(activeReportState.report, openedArtifactId);
  };

  const saveDraftArtifact = () => {
    if (!activeReportState.report) return;

    const saved = persistArtifactForReport(activeReportState.report);
    setOpenedArtifactId(saved.artifact.id);
    setActiveReportState((current) => ({
      ...current,
      draftMessage: saved.artifact.isPersisted
        ? `Draft IA salvato in ${ARTIFACT_STORAGE_LABELS[saved.artifact.storageMode] ?? saved.artifact.storageMode}: sessione ${saved.session.id}, richiesta ${saved.request.id}, artifact ${saved.artifact.id}.`
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
        draftMessage: `Report riaperto dall'archivio artifact IA: artifact ${artifact.id}.`,
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
      openReportPreviewModal(reopenedReport, artifact.id);
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

  const handleCopyReportDocument = async () => {
    if (!reportPreviewModalState.report) {
      return;
    }

    const copied = await copyTextToClipboard(modalReportDocumentText);
    if (!copied) {
      setReportDocumentActionMessage("Copia non disponibile nel browser corrente.");
      return;
    }

    setReportDocumentActionMessage("Contenuto del report copiato negli appunti.");
  };

  const handleDownloadReportDocument = () => {
    if (reportPdfPreviewState.status !== "ready" || typeof document === "undefined") {
      setReportDocumentActionMessage(
        "PDF non ancora pronto. Attendi la generazione o usa la lettura testuale sotto l'anteprima.",
      );
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = reportPdfPreviewState.url;
    anchor.download = reportPdfPreviewState.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setReportDocumentActionMessage("Download del PDF avviato.");
  };

  const handleShareReportDocument = async () => {
    if (!reportPreviewModalState.report || typeof navigator === "undefined" || !navigator.share) {
      setReportDocumentActionMessage("Condivisione non disponibile nel browser corrente.");
      return;
    }

    const shareText = buildPdfShareText({
      contextLabel: reportPreviewModalState.report.title,
      dateLabel: reportPreviewModalState.report.periodContext.label,
      fileName:
        reportPdfPreviewState.status === "ready"
          ? reportPdfPreviewState.fileName
          : buildInternalAiReportPdfFileName(reportPreviewModalState.report),
      url: null,
    });

    if (reportPdfPreviewState.status === "ready") {
      const result = await sharePdfFile({
        blob: reportPdfPreviewState.blob,
        fileName: reportPdfPreviewState.fileName,
        title: reportPreviewModalState.report.title,
        text: shareText,
      });

      if (result.status === "shared") {
        setReportDocumentActionMessage("PDF condiviso dal browser.");
        return;
      }

      if (result.status === "aborted") {
        setReportDocumentActionMessage("Condivisione annullata.");
        return;
      }
    }

    try {
      await navigator.share({
        title: reportPreviewModalState.report.title,
        text: shareText,
      });
      setReportDocumentActionMessage("Anteprima condivisa dal browser.");
    } catch {
      setReportDocumentActionMessage(
        reportPdfPreviewState.status === "ready"
          ? "Il browser non supporta la condivisione diretta del PDF. Usa Scarica PDF."
          : "Condivisione annullata o non riuscita.",
      );
    }
  };

  const hasActiveConversation = chatMessages.length > 0 || chatStatus === "running";
  const isHomeModalSurface = sectionId === "overview" && surfaceVariant === "home-modal";
  const shouldShowLookupStatus =
    Boolean(targaInput.trim()) ||
    Boolean(selectedVehicle) ||
    lookupUiState.status === "loading" ||
    lookupUiState.status === "error";

  return (
    <section
      className={
        surfaceVariant === "home-modal" ? "internal-ai-home-modal" : "next-page internal-ai-page"
      }
    >
      {sectionId !== "overview" ? (
        <header className="internal-ai-hero">
          <div className="next-panel">
            <p className="next-page__eyebrow">Assistente interno</p>
            <h1>Console IA</h1>
            <p className="next-page__description">
              Chat operativa al centro, report recenti per targa sulla destra, sola lettura.
            </p>
            <p className="internal-ai-card__meta">
              Live-read business chiuso: la IA usa clone/read model, snapshot server-side curate e
              nessuna scrittura business.
            </p>
            <div className="internal-ai-nav" style={{ marginTop: 16 }}>
              {PRIMARY_SECTION_NAV.map((id) => (
                <Link
                  key={id}
                  to={SECTION_CONFIGS[id].path}
                  className={`internal-ai-nav__link ${id === sectionId ? "is-active" : ""}`}
                >
                  {SECTION_CONFIGS[id].title}
                </Link>
              ))}
              <details className="internal-ai-nav__secondary">
                <summary>Tecnico</summary>
                <div className="internal-ai-nav__secondary-links">
                  {TECHNICAL_SECTION_NAV.map((id) => (
                    <Link
                      key={id}
                      to={SECTION_CONFIGS[id].path}
                      className={`internal-ai-nav__link ${id === sectionId ? "is-active" : ""}`}
                    >
                      {SECTION_CONFIGS[id].title}
                    </Link>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </header>
      ) : null}

      {sectionId === "overview" ? isHomeModalSurface ? (
        <article className="internal-ai-home-modal__panel">
          <div className="internal-ai-home-modal__lead">
            <div>
              <p className="internal-ai-card__eyebrow">IA interna</p>
              <h2>Conversazione operativa</h2>
              <p className="internal-ai-card__meta">
                La richiesta parte qui e continua nel modale, senza pannelli secondari o layout amministrativi.
              </p>
            </div>
            {chatBridgeState.transportMessage || chatAttachmentRepositoryState.transportMessage ? (
              <div className="internal-ai-home-modal__transport">
                {chatBridgeState.transportMessage ? (
                  <span className={backendPreviewTransportClass(chatBridgeState.transport)}>
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[chatBridgeState.transport]}
                  </span>
                ) : null}
                {chatAttachmentRepositoryState.transportMessage ? (
                  <span
                    className={backendPreviewTransportClass(chatAttachmentRepositoryState.transport)}
                  >
                    Allegati pronti
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {renderAutomaticDocumentProposalPanel("home-modal")}

          <div className="internal-ai-home-modal__conversation">
            <div className="internal-ai-chat__messages internal-ai-home-modal__messages">
              {chatMessages.length ? (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`internal-ai-chat__message ${
                      message.role === "utente" ? "is-user" : "is-assistant"
                    }`}
                  >
                    <div className="internal-ai-chat__message-header">
                      <strong>{message.role === "utente" ? "Tu" : "Assistente interno"}</strong>
                      <div className="internal-ai-pill-row">
                        <span className={statusToneClass(message.status)}>
                          {CHAT_STATUS_LABELS[message.status]}
                        </span>
                        <span className="internal-ai-pill is-neutral">
                          {formatDateLabel(message.createdAt)}
                        </span>
                      </div>
                    </div>
                    {message.role === "assistente" && message.outputMode ? (
                      <div className="internal-ai-chat__message-delivery">
                        <span className={outputModeToneClass(message.outputMode)}>
                          {CHAT_OUTPUT_MODE_LABELS[message.outputMode]}
                        </span>
                        {buildChatReliabilityLabel(message) ? (
                          <span className="internal-ai-pill is-neutral">
                            {buildChatReliabilityLabel(message)}
                          </span>
                        ) : null}
                        {message.outputReason ? (
                          <span className="internal-ai-chat__message-reason">
                            {message.outputReason}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {message.role === "assistente" ? (
                      <>
                        {buildChatUseCaseLabel(message) ? (
                          <p className="internal-ai-card__eyebrow">{buildChatUseCaseLabel(message)}</p>
                        ) : null}
                        {renderChatMessageText(message.text)}
                      </>
                    ) : (
                      <p className="internal-ai-chat__message-text">{message.text}</p>
                    )}
                    {message.attachments.length ? (
                      <div className="internal-ai-chat__message-attachments">
                        {message.attachments.map((attachment) => (
                          <button
                            key={`${message.id}:attachment:${attachment.id}`}
                            type="button"
                            className="internal-ai-chat__attachment-pill"
                            onClick={() => handleOpenChatAttachment(attachment)}
                          >
                            <strong>{attachment.fileName}</strong>
                            <span>{buildInternalAiChatAttachmentPreviewLabel(attachment)}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {buildVisibleChatReferences(message).length ? (
                      <div className="internal-ai-chat__references">
                        {buildVisibleChatReferences(message).map((reference) =>
                          reference.artifactId ? (
                            <button
                              key={`${message.id}:${reference.type}:${reference.label}:${reference.artifactId}`}
                              type="button"
                              className="internal-ai-chat__reference"
                              onClick={() => handleOpenArtifact(reference.artifactId!)}
                            >
                              {reference.label}
                              {reference.targa ? ` - ${reference.targa}` : ""}
                            </button>
                          ) : (
                            <span
                              key={`${message.id}:${reference.type}:${reference.label}`}
                              className="internal-ai-pill is-neutral"
                            >
                              {reference.label}
                              {reference.targa ? ` - ${reference.targa}` : ""}
                            </span>
                          ),
                        )}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : hasActiveConversation ? null : (
                <div className="internal-ai-chat__empty" aria-live="polite">
                  <p className="internal-ai-chat__empty-title">Nessuna conversazione in corso.</p>
                  <p className="internal-ai-chat__empty-copy">
                    Scrivi una richiesta o allega un documento per aprire subito la conversazione.
                  </p>
                </div>
              )}
              {chatStatus === "running" ? (
                <div className="internal-ai-chat__message is-assistant">
                  <div className="internal-ai-chat__message-header">
                    <strong>Assistente interno</strong>
                    <span className={statusToneClass("running")}>In elaborazione</span>
                  </div>
                  <p className="internal-ai-chat__message-text">
                    Sto preparando una risposta controllata con il backend IA separato.
                  </p>
                </div>
              ) : null}
              <div ref={chatMessagesEndRef} />
            </div>

            <div className="internal-ai-home-modal__composer-shell">
              <div className="internal-ai-chat__composer internal-ai-home-modal__composer">
                <label className="internal-ai-search__field">
                  <span>Scrivi una richiesta</span>
                  <textarea
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder={
                      chatAttachments.length > 0
                        ? chatInputPlaceholderWithDocument
                        : "Esempio: mostrami le criticita del mezzo, spiegami cosa richiede attenzione oggi o analizza gli allegati."
                    }
                    className="internal-ai-search__input internal-ai-chat__composer-input"
                    rows={3}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void handleChatSubmit();
                      }
                    }}
                  />
                </label>

                <div className="internal-ai-chat__composer-actions">
                  <p className="internal-ai-card__meta">{chatComposerHint}</p>
                  <div className="internal-ai-search__actions">
                    <button
                      type="button"
                      className="internal-ai-search__button internal-ai-search__button--secondary"
                      disabled={
                        chatStatus === "running" || chatAttachmentRepositoryState.status === "loading"
                      }
                      onClick={handleChatAttachmentPicker}
                    >
                      Allega file
                    </button>
                    <button
                      type="button"
                      className="internal-ai-search__button"
                      disabled={
                        chatStatus === "running" ||
                        chatAttachmentRepositoryState.status === "loading" ||
                        !canSubmitUnifiedConsole
                      }
                      onClick={() => void handleChatSubmit()}
                    >
                      {chatSubmitButtonLabel}
                    </button>
                  </div>
                </div>

                {chatAttachments.length ? (
                  <div className="internal-ai-chat__attachments">
                    {chatAttachments.map((attachment) => (
                      <article key={attachment.id} className="internal-ai-chat__attachment-row">
                        <div className="internal-ai-chat__attachment-copy">
                          <strong>{attachment.fileName}</strong>
                          <p className="internal-ai-card__meta">{attachment.note}</p>
                          <p className="internal-ai-card__meta">
                            {buildInternalAiChatAttachmentPreviewLabel(attachment)} -{" "}
                            {attachment.storageMode === "server_file_isolated"
                              ? "server IA isolato"
                              : "browser locale"}
                            {" - "}
                            {(attachment.sizeBytes / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <div className="internal-ai-pill-row">
                          <button
                            type="button"
                            className="internal-ai-chat__reference"
                            onClick={() => handleOpenChatAttachment(attachment)}
                          >
                            Apri
                          </button>
                          <button
                            type="button"
                            className="internal-ai-chat__reference"
                            onClick={() => void handleRemoveChatAttachment(attachment)}
                          >
                            Rimuovi
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                <input
                  ref={chatAttachmentInputRef}
                  type="file"
                  multiple
                  className="internal-ai-sr-only"
                  accept=".pdf,image/*,text/plain,text/markdown,.txt,.md,.doc,.docx,.odt,.xls,.xlsx,.csv,application/pdf"
                  onChange={(event) => {
                    void handleChatAttachmentSelection(event.currentTarget.files);
                    event.currentTarget.value = "";
                  }}
                />
              </div>
            </div>
          </div>
        </article>
      ) : (
        <>
          <article className="next-panel internal-ai-chat internal-ai-chat--primary">
            <div className="internal-ai-chat__shell">
              <div className="internal-ai-chat__main">
                {renderAutomaticDocumentProposalPanel()}

                <div className="internal-ai-chat__messages">
                  {chatMessages.length ? (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`internal-ai-chat__message ${
                          message.role === "utente" ? "is-user" : "is-assistant"
                        }`}
                      >
                        <div className="internal-ai-chat__message-header">
                          <strong>{message.role === "utente" ? "Tu" : "Assistente interno"}</strong>
                          <div className="internal-ai-pill-row">
                            <span className={statusToneClass(message.status)}>
                              {CHAT_STATUS_LABELS[message.status]}
                            </span>
                            <span className="internal-ai-pill is-neutral">
                              {formatDateLabel(message.createdAt)}
                            </span>
                          </div>
                        </div>
                        {message.role === "assistente" && message.outputMode ? (
                          <div className="internal-ai-chat__message-delivery">
                            <span className={outputModeToneClass(message.outputMode)}>
                              {CHAT_OUTPUT_MODE_LABELS[message.outputMode]}
                            </span>
                            {buildChatReliabilityLabel(message) &&
                            buildChatReliabilityLabel(message) !== "Affidabile" ? (
                              <span className="internal-ai-pill is-neutral">
                                {buildChatReliabilityLabel(message)}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        {message.role === "assistente" ? (
                          <>
                            {buildChatUseCaseLabel(message) ? (
                              <p className="internal-ai-card__eyebrow">
                                {buildChatUseCaseLabel(message)}
                              </p>
                            ) : null}
                            {renderChatMessageText(message.text)}
                          </>
                        ) : (
                          <p className="internal-ai-chat__message-text">{message.text}</p>
                        )}
                        {message.attachments.length ? (
                          <div className="internal-ai-chat__message-attachments">
                            {message.attachments.map((attachment) => (
                              <button
                                key={`${message.id}:attachment:${attachment.id}`}
                                type="button"
                                className="internal-ai-chat__attachment-pill"
                                onClick={() => handleOpenChatAttachment(attachment)}
                              >
                                <strong>{attachment.fileName}</strong>
                                <span>{buildInternalAiChatAttachmentPreviewLabel(attachment)}</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                        {buildVisibleChatReferences(message).length ? (
                          <div className="internal-ai-chat__references">
                            {buildVisibleChatReferences(message).map((reference) =>
                              reference.artifactId ? (
                                <button
                                  key={`${message.id}:${reference.type}:${reference.label}:${reference.artifactId}`}
                                  type="button"
                                  className="internal-ai-chat__reference"
                                  onClick={() => handleOpenArtifact(reference.artifactId!)}
                                >
                                  {reference.label}
                                  {reference.targa ? ` - ${reference.targa}` : ""}
                                </button>
                              ) : (
                                <span
                                  key={`${message.id}:${reference.type}:${reference.label}`}
                                  className="internal-ai-pill is-neutral"
                                >
                                  {reference.label}
                                  {reference.targa ? ` - ${reference.targa}` : ""}
                                </span>
                              ),
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : hasActiveConversation ? null : (
                    <div className="internal-ai-chat__empty" aria-live="polite">
                      <p className="internal-ai-chat__empty-title">Nessuna conversazione in corso.</p>
                      <p className="internal-ai-chat__empty-copy">
                        Usa il composer qui sotto per fare una richiesta, selezionare una targa o allegare un documento.
                      </p>
                    </div>
                  )}
                  {chatStatus === "running" ? (
                    <div className="internal-ai-chat__message is-assistant">
                      <div className="internal-ai-chat__message-header">
                        <strong>Assistente interno</strong>
                        <span className={statusToneClass("running")}>In elaborazione</span>
                      </div>
                      <p className="internal-ai-chat__message-text">
                        Sto preparando una risposta controllata. Se serve un report targa, lo trovi
                        anche nella colonna destra appena pronto.
                      </p>
                    </div>
                  ) : null}
                  <div ref={chatMessagesEndRef} />
                </div>

                <div className="internal-ai-chat__composer">
                  <div className="internal-ai-chat__composer-grid">
                    <label className="internal-ai-search__field">
                      <span>Richieste rapide</span>
                      <select
                        value={selectedQuickRequest}
                        onChange={(event) => {
                          const value = event.target.value;
                          setSelectedQuickRequest(value);
                          if (!value) {
                            return;
                          }
                          setChatInput(hydrateQuickRequest(value));
                        }}
                        className="internal-ai-search__input"
                      >
                        <option value="">Scegli una richiesta rapida</option>
                        {CHAT_SUGGESTIONS.map((suggestion) => (
                          <option key={suggestion} value={suggestion}>
                            {suggestion}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="internal-ai-search__field">
                      <span>Targa</span>
                      <input
                        type="text"
                        value={targaInput}
                        onChange={(event) => {
                          const nextValue = event.target.value.toUpperCase();
                          const normalizedNextValue = normalizeInternalAiVehicleLookupQuery(nextValue);
                          setTargaInput(nextValue);
                          setUnifiedConsoleTarga(normalizedNextValue);
                          if (selectedVehicle && selectedVehicle.targa !== normalizedNextValue) {
                            setSelectedVehicle(null);
                          }
                        }}
                        placeholder="Es. AB123CD"
                        className="internal-ai-search__input"
                        autoComplete="off"
                      />
                    </label>
                    <label className="internal-ai-search__field">
                      <span>Output</span>
                      <select
                        value={unifiedConsoleOutput}
                        onChange={(event) =>
                          setUnifiedConsoleOutput(
                            event.target.value as UnifiedConsoleOutputPreference,
                          )
                        }
                        className="internal-ai-search__input"
                      >
                        {Object.entries(UNIFIED_OUTPUT_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {shouldShowLookupStatus ? (
                    <div className="internal-ai-chat__status-inline">
                      <span className={statusToneClass(lookupUiState.status)}>
                        {LOOKUP_MATCH_LABELS[lookupUiState.status]}
                      </span>
                      <span className="internal-ai-muted">{lookupUiState.message}</span>
                    </div>
                  ) : null}

                  {lookupSuggestions.length > 0 && targaInput.trim().length > 0 ? (
                    <div className="internal-ai-suggestions">
                      {lookupSuggestions.slice(0, 6).map((candidate) => {
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
                                <span className="internal-ai-pill is-neutral">
                                  {candidate.categoria}
                                </span>
                                {isSelected ? (
                                  <span className="internal-ai-pill is-warning">Selezionata</span>
                                ) : null}
                              </div>
                            </div>
                            <p className="internal-ai-card__meta">
                              {description || "Targa disponibile nel gestionale."}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  <div>
                    <div className="internal-ai-chat__message-header">
                      <strong>Filtri rapidi</strong>
                      <button
                        type="button"
                        className="internal-ai-chat__reference"
                        onClick={resetUnifiedConsoleFilters}
                      >
                        Reset
                      </button>
                    </div>
                    <div className="internal-ai-search__actions" style={{ flexWrap: "wrap" }}>
                      {UNIFIED_CONSOLE_SCOPE_OPTIONS.slice(0, 11).map((entry) => {
                        const active = unifiedConsoleScopes.includes(entry.id);
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            className={`internal-ai-filter-chip ${active ? "is-active" : ""}`}
                            onClick={() => toggleUnifiedConsoleScope(entry.id)}
                          >
                            {entry.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="internal-ai-search__field">
                    <span>Scrivi una richiesta</span>
                    <textarea
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder={
                        chatAttachments.length > 0
                          ? chatInputPlaceholderWithDocument
                          : "Esempio: dimmi lo stato del mezzo, mostrami le criticita, prepara un report o spiegami cosa richiede attenzione oggi."
                      }
                      className="internal-ai-search__input internal-ai-chat__composer-input"
                      rows={4}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleChatSubmit();
                        }
                      }}
                    />
                  </label>

                  <div className="internal-ai-chat__composer-actions">
                    <p className="internal-ai-card__meta">{chatComposerHint}</p>
                    <div className="internal-ai-search__actions">
                      <button
                        type="button"
                        className="internal-ai-search__button internal-ai-search__button--secondary"
                        disabled={chatStatus === "running" || chatAttachmentRepositoryState.status === "loading"}
                        onClick={handleChatAttachmentPicker}
                      >
                        Allega file
                      </button>
                      <button
                        type="button"
                        className="internal-ai-search__button internal-ai-search__button--secondary"
                        disabled={
                          vehicleRequestState.status === "loading" ||
                          lookupCatalog.status === "loading" ||
                          !resolvedChatTarga
                        }
                        onClick={() => void handleGenerateVehiclePreview()}
                      >
                        {vehicleRequestState.status === "loading"
                          ? "Preparazione report..."
                          : "Apri report targa"}
                      </button>
                      <button
                        type="button"
                        className="internal-ai-search__button"
                        disabled={
                          chatStatus === "running" ||
                          chatAttachmentRepositoryState.status === "loading" ||
                          !canSubmitUnifiedConsole
                        }
                        onClick={() => void handleChatSubmit()}
                      >
                        {chatSubmitButtonLabel}
                      </button>
                    </div>
                  </div>

                  {chatAttachments.length ? (
                    <div className="internal-ai-chat__attachments">
                      {chatAttachments.map((attachment) => (
                        <article key={attachment.id} className="internal-ai-chat__attachment-row">
                          <div className="internal-ai-chat__attachment-copy">
                            <strong>{attachment.fileName}</strong>
                            <p className="internal-ai-card__meta">{attachment.note}</p>
                            <p className="internal-ai-card__meta">
                              {buildInternalAiChatAttachmentPreviewLabel(attachment)} ·{" "}
                              {attachment.storageMode === "server_file_isolated"
                                ? "server IA isolato"
                                : "browser locale"}
                              {" · "}
                              {(attachment.sizeBytes / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <div className="internal-ai-pill-row">
                            <button
                              type="button"
                              className="internal-ai-chat__reference"
                              onClick={() => handleOpenChatAttachment(attachment)}
                            >
                              Apri
                            </button>
                            <button
                              type="button"
                              className="internal-ai-chat__reference"
                              onClick={() => void handleRemoveChatAttachment(attachment)}
                            >
                              Rimuovi
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}

                  <input
                    ref={chatAttachmentInputRef}
                    type="file"
                    multiple
                    className="internal-ai-sr-only"
                    accept=".pdf,image/*,text/plain,text/markdown,.txt,.md,.doc,.docx,.odt,.xls,.xlsx,.csv,application/pdf"
                    onChange={(event) => {
                      void handleChatAttachmentSelection(event.currentTarget.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </div>
              </div>

              <aside className="internal-ai-chat__aside">
                {activeReportState.report ? (
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Report corrente</p>
                    <div className="internal-ai-list__row-header">
                      <strong>{activeReportState.report.title}</strong>
                      <span className="internal-ai-pill is-neutral">
                        {getReportTargetChip(activeReportState.report)}
                      </span>
                    </div>
                    <p className="internal-ai-card__meta">
                      {activeReportState.report.periodContext.label} - {formatDateLabel(activeReportState.report.generatedAt)}
                    </p>
                    <div className="internal-ai-search__actions">
                      <button
                        type="button"
                        className="internal-ai-search__button"
                        onClick={() => openReportPreviewModal(activeReportState.report!, openedArtifactId)}
                      >
                        Apri report
                      </button>
                      <button
                        type="button"
                        className="internal-ai-search__button internal-ai-search__button--secondary"
                        onClick={handlePrepareReportPdf}
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        className="internal-ai-search__button internal-ai-search__button--secondary"
                        onClick={saveDraftArtifact}
                      >
                        Salva
                      </button>
                    </div>
                    {activeReportState.draftMessage ? (
                      <p className="internal-ai-card__meta">{activeReportState.draftMessage}</p>
                    ) : null}
                  </article>
                ) : null}

                <article className="internal-ai-card">
                  <div className="internal-ai-list__row-header">
                    <div>
                      <p className="internal-ai-card__eyebrow">Report per targa</p>
                      <strong>Richiesti e salvati</strong>
                    </div>
                  </div>
                  {sidebarArtifactGroups.length ? (
                    <div className="internal-ai-chat__aside-groups">
                      {sidebarArtifactGroups.map((group) => (
                        <section key={group.targa} className="internal-ai-chat__aside-group">
                          <div className="internal-ai-list__row-header">
                            <strong>{group.targa}</strong>
                            <span className="internal-ai-pill is-neutral">
                              {group.items.length} report
                            </span>
                          </div>
                          <div className="internal-ai-chat__aside-items">
                            {group.items.map((artifact) => (
                              <button
                                key={artifact.id}
                                type="button"
                                className="internal-ai-chat__aside-item"
                                onClick={() => handleOpenArtifact(artifact.id)}
                              >
                                <strong>{artifact.title}</strong>
                                <span>
                                  {REPORT_TYPE_LABELS[artifact.reportType ?? "targa"] ?? artifact.reportType ?? "Report"}
                                  {" - "}
                                  {ARTIFACT_STATUS_LABELS[artifact.status] ?? artifact.status}
                                  {" - "}
                                  {formatDateLabel(artifact.updatedAt)}
                                </span>
                              </button>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  ) : (
                    <p className="internal-ai-card__meta">
                      Nessun report per targa ancora memorizzato. Appena ne generi uno, lo trovi qui.
                    </p>
                  )}
                </article>
              </aside>
            </div>
          </article>

          <details className="next-panel internal-ai-secondary-panel internal-ai-overview-advanced">
            <summary>Ricerca guidata avanzata e strumenti tecnici</summary>
            <div className="internal-ai-secondary-panel__body">
          <article className="next-panel internal-ai-chat">
            <div className="next-panel__header">
              <h2>Chat interna controllata</h2>
            </div>
            <p className="next-panel__description">
              Scrivi una richiesta libera in italiano. Il nucleo forte resta lo stato operativo
              mezzo sulla prima verticale D01 + D10 + D02, ma la console puo ora aiutare anche su
              repo, flussi, moduli collegati, impatti file/layer e punti corretti di integrazione
              nel perimetro NEXT. Usa reader NEXT read-only e snapshot repo/UI controllate come
              fonti canoniche, tiene chiuso il live-read business e dichiara i limiti quando la
              richiesta sconfina, lasciando il report targa come capability distinta
              nell&apos;anteprima PDF.
            </p>
            <div className="internal-ai-pill-row" style={{ marginBottom: 12 }}>
              <span className="internal-ai-pill is-neutral">D01 anagrafica mezzo</span>
              <span className="internal-ai-pill is-neutral">D10 Home e stato operativo</span>
              <span className="internal-ai-pill is-neutral">D02 lavori e manutenzioni</span>
            </div>
            <div className="internal-ai-chat__status-strip">
              {chatPrimaryStatusCards.map((card) => (
                <article key={card.label} className={`internal-ai-chat__status-chip ${card.tone}`}>
                  <p className="internal-ai-card__eyebrow">{card.label}</p>
                  <strong>{card.value}</strong>
                </article>
              ))}
              <button
                type="button"
                className="internal-ai-search__button internal-ai-chat__refresh-button"
                onClick={() => void loadRepoUnderstandingSnapshot(true)}
                disabled={repoUnderstandingState.status === "loading"}
              >
                {repoUnderstandingState.status === "loading"
                  ? "Aggiornamento memoria..."
                  : "Aggiorna memoria repo/UI"}
              </button>
            </div>
            {chatBridgeState.transportMessage || chatAttachmentRepositoryState.transportMessage ? (
              <div className="internal-ai-chat__status-inline">
                {chatBridgeState.transportMessage ? (
                  <>
                    <span className={backendPreviewTransportClass(chatBridgeState.transport)}>
                      {BACKEND_PREVIEW_TRANSPORT_LABELS[chatBridgeState.transport]}
                    </span>
                    <span className="internal-ai-muted">{chatBridgeState.transportMessage}</span>
                  </>
                ) : null}
                {chatAttachmentRepositoryState.transportMessage ? (
                  <>
                    <span className={backendPreviewTransportClass(chatAttachmentRepositoryState.transport)}>
                      Allegati: {chatAttachmentRepositoryState.status}
                    </span>
                    <span className="internal-ai-muted">
                      {chatAttachmentRepositoryState.transportMessage}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}
            <div className="internal-ai-chat__suggestions">
              {CHAT_SUGGESTIONS.slice(0, 6).map((suggestion) => (
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
                    <strong>{message.role === "utente" ? "Tu" : "Assistente interno"}</strong>
                    <div className="internal-ai-pill-row">
                      <span className={statusToneClass(message.status)}>
                        {CHAT_STATUS_LABELS[message.status]}
                      </span>
                      <span className="internal-ai-pill is-neutral">
                        {formatDateLabel(message.createdAt)}
                      </span>
                    </div>
                  </div>
                  {message.role === "assistente" && message.outputMode ? (
                    <div className="internal-ai-chat__message-delivery">
                      <span className={outputModeToneClass(message.outputMode)}>
                        {CHAT_OUTPUT_MODE_LABELS[message.outputMode]}
                      </span>
                      {buildChatDomainLabel(message) ? (
                        <span className="internal-ai-pill is-neutral">
                          Perimetro: {buildChatDomainLabel(message)}
                        </span>
                      ) : null}
                      {buildChatReliabilityLabel(message) ? (
                        <span className="internal-ai-pill is-neutral">
                          Affidabilita: {buildChatReliabilityLabel(message)}
                        </span>
                      ) : null}
                      {message.outputReason ? (
                        <span className="internal-ai-chat__message-reason">
                          {message.outputReason}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {message.role === "assistente" ? (
                    <>
                      {buildChatUseCaseLabel(message) ? (
                        <p className="internal-ai-card__eyebrow">
                          {buildChatUseCaseLabel(message)}
                        </p>
                      ) : null}
                      {buildChatContextChips(message).length ? (
                        <div className="internal-ai-pill-row" style={{ marginBottom: 12 }}>
                          {buildChatContextChips(message).map((chip) => (
                            <span
                              key={`${message.id}:context:${chip}`}
                              className="internal-ai-pill is-neutral"
                            >
                              {chip}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {renderChatMessageText(message.text)}
                    </>
                  ) : (
                    <p className="internal-ai-chat__message-text">{message.text}</p>
                  )}
                  {message.attachments.length ? (
                    <div className="internal-ai-chat__message-attachments">
                      {message.attachments.map((attachment) => (
                        <button
                          key={`${message.id}:attachment:${attachment.id}`}
                          type="button"
                          className="internal-ai-chat__attachment-pill"
                          onClick={() => handleOpenChatAttachment(attachment)}
                        >
                          <strong>{attachment.fileName}</strong>
                          <span>{buildInternalAiChatAttachmentPreviewLabel(attachment)}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {buildVisibleChatReferences(message).length ? (
                    <div className="internal-ai-chat__references">
                      {buildVisibleChatReferences(message).map((reference) =>
                        reference.artifactId ? (
                          <button
                            key={`${message.id}:${reference.type}:${reference.label}:${reference.artifactId}`}
                            type="button"
                            className="internal-ai-chat__reference"
                            onClick={() => handleOpenArtifact(reference.artifactId!)}
                          >
                            {reference.label}
                            {reference.targa ? ` - ${reference.targa}` : ""}
                          </button>
                        ) : (
                          <span
                            key={`${message.id}:${reference.type}:${reference.label}`}
                            className="internal-ai-pill is-neutral"
                          >
                            {reference.label}
                            {reference.targa ? ` - ${reference.targa}` : ""}
                          </span>
                        ),
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
              {chatStatus === "running" ? (
                <div className="internal-ai-chat__message is-assistant">
                  <div className="internal-ai-chat__message-header">
                    <strong>Assistente interno</strong>
                    <span className={statusToneClass("running")}>In elaborazione</span>
                  </div>
                  <p className="internal-ai-chat__message-text">
                    Sto preparando una risposta controllata dal backend IA separato sopra contesto
                    clone/read-only. Se la richiesta e un report, troverai il contenuto lungo in
                    una anteprima dedicata.
                  </p>
                </div>
              ) : null}
              <div ref={chatMessagesEndRef} />
            </div>
            {renderAutomaticDocumentProposalPanel()}
            <div className="internal-ai-chat__composer">
              <div
                style={{
                  display: "grid",
                  gap: 12,
                  marginBottom: 16,
                  padding: 12,
                  border: "1px solid rgba(148, 163, 184, 0.22)",
                  borderRadius: 16,
                  background: "rgba(15, 23, 42, 0.02)",
                }}
              >
                <div className="internal-ai-chat__status-inline">
                  <span className="internal-ai-pill is-neutral">Sistema universale clone/NEXT</span>
                  {unifiedRegistryState.status === "ready" && unifiedRegistryState.summary ? (
                    <span className="internal-ai-muted">
                      Fonti mappate {unifiedRegistryState.summary.counts.totalSources}, pronte{" "}
                      {unifiedRegistryState.summary.counts.readySources}, record letti{" "}
                      {unifiedRegistryState.summary.counts.totalRecords}.
                    </span>
                  ) : unifiedRegistryState.message ? (
                    <span className="internal-ai-muted">{unifiedRegistryState.message}</span>
                  ) : null}
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: 12,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  <label className="internal-ai-search__field">
                    <span>Targa</span>
                    <input
                      value={unifiedConsoleTarga}
                      onChange={(event) => setUnifiedConsoleTarga(event.target.value)}
                      placeholder="Es. AB123CD"
                      className="internal-ai-search__input"
                    />
                  </label>
                  <label className="internal-ai-search__field">
                    <span>Output</span>
                    <select
                      value={unifiedConsoleOutput}
                      onChange={(event) =>
                        setUnifiedConsoleOutput(
                          event.target.value as UnifiedConsoleOutputPreference,
                        )
                      }
                      className="internal-ai-search__input"
                    >
                      {Object.entries(UNIFIED_OUTPUT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <div className="internal-ai-chat__message-header">
                    <strong>Filtri rapidi</strong>
                    <button
                      type="button"
                      className="internal-ai-chat__reference"
                      onClick={resetUnifiedConsoleFilters}
                    >
                      Reset
                    </button>
                  </div>
                  <div className="internal-ai-search__actions" style={{ flexWrap: "wrap" }}>
                    {UNIFIED_CONSOLE_SCOPE_OPTIONS.map((entry) => {
                      const active = unifiedConsoleScopes.includes(entry.id);
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          className={
                            active
                              ? "internal-ai-search__button"
                              : "internal-ai-search__button internal-ai-search__button--secondary"
                          }
                          onClick={() => toggleUnifiedConsoleScope(entry.id)}
                        >
                          {entry.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <label className="internal-ai-search__field">
                <span>Scrivi una richiesta</span>
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={
                    chatAttachments.length > 0
                      ? chatInputPlaceholderWithDocument
                      : "Chiedimi un quadro completo, criticita + segnalazioni + manutenzioni, scadenze, oppure usa i filtri sopra per targa, ambiti e output."
                  }
                  className="internal-ai-search__input internal-ai-chat__composer-input"
                  rows={4}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleChatSubmit();
                    }
                  }}
                />
              </label>
              <div className="internal-ai-chat__composer-actions">
                <p className="internal-ai-card__meta">{chatComposerHint}</p>
                <div className="internal-ai-search__actions">
                  <button
                    type="button"
                    className="internal-ai-search__button internal-ai-search__button--secondary"
                    disabled={chatStatus === "running" || chatAttachmentRepositoryState.status === "loading"}
                    onClick={handleChatAttachmentPicker}
                  >
                    Allega file
                  </button>
                  <button
                    type="button"
                    className="internal-ai-search__button"
                    disabled={
                      chatStatus === "running" ||
                      chatAttachmentRepositoryState.status === "loading" ||
                      !canSubmitUnifiedConsole
                    }
                    onClick={() => void handleChatSubmit()}
                  >
                    {chatSubmitButtonLabel}
                  </button>
                </div>
              </div>
              {chatAttachments.length ? (
                <div className="internal-ai-chat__attachments">
                  {chatAttachments.map((attachment) => (
                    <article key={attachment.id} className="internal-ai-chat__attachment-row">
                      <div className="internal-ai-chat__attachment-copy">
                        <strong>{attachment.fileName}</strong>
                        <p className="internal-ai-card__meta">
                          {attachment.note}
                        </p>
                        <p className="internal-ai-card__meta">
                          {buildInternalAiChatAttachmentPreviewLabel(attachment)} ·{" "}
                          {attachment.storageMode === "server_file_isolated"
                            ? "server IA isolato"
                            : "browser locale"}
                          {" · "}
                          {(attachment.sizeBytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="internal-ai-pill-row">
                        <button
                          type="button"
                          className="internal-ai-chat__reference"
                          onClick={() => handleOpenChatAttachment(attachment)}
                        >
                          Apri
                        </button>
                        <button
                          type="button"
                          className="internal-ai-chat__reference"
                          onClick={() => void handleRemoveChatAttachment(attachment)}
                        >
                          Rimuovi
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
              <input
                ref={chatAttachmentInputRef}
                type="file"
                multiple
                className="internal-ai-sr-only"
                accept=".pdf,image/*,text/plain,text/markdown,.txt,.md,.doc,.docx,.odt,.xls,.xlsx,.csv,application/pdf"
                onChange={(event) => {
                  void handleChatAttachmentSelection(event.currentTarget.files);
                  event.currentTarget.value = "";
                }}
              />
            </div>
            <details className="internal-ai-chat__secondary">
              <summary>Strumenti secondari e stato tecnico</summary>
              <div className="internal-ai-chat__status-grid">
                {chatStatusCards.map((card) => (
                  <article key={card.label} className={`internal-ai-chat__status-card ${card.tone}`}>
                    <p className="internal-ai-card__eyebrow">{card.label}</p>
                    <h3>{card.value}</h3>
                    <p className="internal-ai-card__meta">{card.detail}</p>
                  </article>
                ))}
              </div>
              <div className="internal-ai-card internal-ai-chat__guide">
                <p className="internal-ai-card__eyebrow">Come rispondo</p>
                <ul className="internal-ai-inline-list">
                  <li>Le domande normali restano nella conversazione.</li>
                  <li>I report strutturati si aprono come anteprima PDF dedicata.</li>
                  <li>Fonti, limiti e fallback restano visibili ma non invasivi.</li>
                </ul>
              </div>
            </details>
          </article>

          <InternalAiUniversalWorkbench
            promptDraft={chatInput}
            attachments={chatAttachments}
            preferredTarga={resolvedChatTarga}
          />

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

          <details className="next-panel internal-ai-secondary-panel">
            <summary>Memoria repo/UI e osservatore</summary>
            <div className="internal-ai-secondary-panel__body">
            <p className="next-panel__description">
              Il backend IA separato costruisce una snapshot read-only di documenti architetturali,
              macro-aree, pattern UI, relazioni tra schermate e layer repo, cosi la nuova IA puo
              spiegare meglio flussi reali, moduli collegati, file candidati e punti di
              integrazione senza trasformarsi in un agente che modifica il repository.
            </p>
            <div className="internal-ai-button-row">
              <button
                type="button"
                className="internal-ai-search__button"
                onClick={() => void loadRepoUnderstandingSnapshot(true)}
                disabled={repoUnderstandingState.status === "loading"}
              >
                {repoUnderstandingState.status === "loading"
                  ? "Aggiornamento snapshot..."
                  : "Aggiorna snapshot repo/UI"}
              </button>
            </div>
            {repoUnderstandingState.transportMessage ? (
              <div className="internal-ai-pill-row" style={{ marginTop: 12 }}>
                <span className={backendPreviewTransportClass(repoUnderstandingState.transport)}>
                  {BACKEND_PREVIEW_TRANSPORT_LABELS[repoUnderstandingState.transport]}
                </span>
                <span className="internal-ai-muted">
                  {repoUnderstandingState.transportMessage}
                </span>
              </div>
            ) : null}
            {repoUnderstandingState.status === "ready" && repoUnderstandingState.snapshot ? (
              <>
                <section className="internal-ai-grid" style={{ marginTop: 16 }}>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Documenti</p>
                    <h3>{repoUnderstandingState.snapshot.documents.length}</h3>
                    <p className="internal-ai-card__meta">
                      Fonti architetturali e di stato lette dal backend IA separato.
                    </p>
                  </article>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Macro-aree</p>
                    <h3>{repoUnderstandingState.snapshot.moduleAreas.length}</h3>
                    <p className="internal-ai-card__meta">
                      Blocchi funzionali e UI rappresentativi del clone.
                    </p>
                  </article>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Pattern UI</p>
                    <h3>{repoUnderstandingState.snapshot.uiPatterns.length}</h3>
                    <p className="internal-ai-card__meta">
                      Pattern visuali e interazioni riusabili gia osservati nel repo.
                    </p>
                  </article>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Relazioni schermate</p>
                    <h3>{repoUnderstandingState.snapshot.screenRelations.length}</h3>
                    <p className="internal-ai-card__meta">
                      Collegamenti dichiarati tra shell, dossier, analisi e IA interna.
                    </p>
                  </article>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Indice file controllato</p>
                    <h3>{repoUnderstandingState.snapshot.fileIndex.length}</h3>
                    <p className="internal-ai-card__meta">
                      File di codice, route-like file e CSS letti in modo controllato dal backend
                      IA separato.
                    </p>
                  </article>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Relazioni stile</p>
                    <h3>{repoUnderstandingState.snapshot.styleRelations.length}</h3>
                    <p className="internal-ai-card__meta">
                      Import CSS osservati tra pagina, componenti e fogli stile rappresentativi.
                    </p>
                  </article>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Madre vs NEXT</p>
                    <h3>{repoUnderstandingState.snapshot.legacyNextRelations.length}</h3>
                    <p className="internal-ai-card__meta">
                      Relazioni chiave tra runtime madre, shell NEXT e backend IA separato.
                    </p>
                  </article>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Runtime NEXT osservato</p>
                    <h3>{runtimeObserverMetrics?.observedRouteCount ?? repoUnderstandingState.snapshot.runtimeObserver.routeCount}</h3>
                    <p className="internal-ai-card__meta">
                      {RUNTIME_OBSERVER_STATUS_LABELS[
                        repoUnderstandingState.snapshot.runtimeObserver.status
                      ] ?? repoUnderstandingState.snapshot.runtimeObserver.status}
                      {" | "}route tentate: {runtimeObserverMetrics?.routeCount ?? repoUnderstandingState.snapshot.runtimeObserver.routeCount}
                      {" | "}screenshot raccolti:{" "}
                      {repoUnderstandingState.snapshot.runtimeObserver.screenshotCount}
                    </p>
                  </article>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Guida integrazione</p>
                    <h3>{repoUnderstandingState.snapshot.integrationGuidance.length}</h3>
                    <p className="internal-ai-card__meta">
                      Regole concrete per scegliere modale, pagina, tab, card, bottone o file
                      candidati nel flusso corretto del gestionale.
                    </p>
                  </article>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Dependency map</p>
                    <h3>{repoDependencyMaps.length}</h3>
                    <p className="internal-ai-card__meta">
                      Moduli con route, file UI, read model, backend IA, monte/valle e punto di
                      integrazione gia strutturati per la chat tecnica.
                    </p>
                  </article>
                  <article className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">Live-read business</p>
                    <h3>
                      {
                        FIREBASE_READINESS_LABELS[
                          repoUnderstandingState.snapshot.firebaseReadiness.firestoreReadOnly.status
                        ]
                      }
                    </h3>
                    <p className="internal-ai-card__meta">
                      Verdetto runtime per il backend IA separato: Firestore e Storage business live
                      restano chiusi.
                    </p>
                  </article>
                </section>
                <div className="next-section-grid" style={{ marginTop: 16 }}>
                  <article className="next-panel">
                    <div className="next-panel__header">
                      <h3>Documenti e route rappresentative</h3>
                    </div>
                    <ul className="internal-ai-inline-list">
                      {repoUnderstandingState.snapshot.documents.slice(0, 3).map((document) => (
                        <li key={document.path}>
                          <strong>{document.title}:</strong> {document.summary}
                        </li>
                      ))}
                    </ul>
                    <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                      {repoUnderstandingState.snapshot.representativeRoutes.map((route) => (
                        <li key={route.path}>
                          <strong>{route.label}:</strong> <code>{route.path}</code> - {route.summary}
                        </li>
                      ))}
                    </ul>
                  </article>
                  <article className="next-panel">
                    <div className="next-panel__header">
                      <h3>Pattern UI e limiti</h3>
                    </div>
                    <ul className="internal-ai-inline-list">
                      {repoUnderstandingState.snapshot.uiPatterns.map((pattern) => (
                        <li key={pattern.id}>
                          <strong>{pattern.label}:</strong> {pattern.summary}
                        </li>
                      ))}
                    </ul>
                    <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                      {repoUnderstandingState.snapshot.limitations.map((limitation) => (
                        <li key={limitation}>{limitation}</li>
                      ))}
                    </ul>
                  </article>
                </div>
                {repoDependencyMaps.length ? (
                  <div className="next-section-grid" style={{ marginTop: 16 }}>
                    <article className="next-panel">
                      <div className="next-panel__header">
                        <h3>Dependency map repo e moduli</h3>
                      </div>
                      <p className="next-panel__description">
                        Questa matrice rende piu strutturale il repo assistant: per ogni area chiave
                        mostra domini, route, file UI, read model, backend IA e rischio impatto,
                        cosi la chat puo motivare meglio dove leggere e dove intervenire.
                      </p>
                      <div className="internal-ai-list" style={{ marginTop: 16 }}>
                        {repoDependencyMaps.map((entry) => (
                          <div key={`dependency-map:${entry.id}`} className="internal-ai-list__row">
                            <div className="internal-ai-list__row-header">
                              <strong>{entry.label}</strong>
                              <div className="internal-ai-pill-row">
                                {entry.domainCodes?.length ? (
                                  <span className="internal-ai-pill is-neutral">
                                    {entry.domainCodes.join(" | ")}
                                  </span>
                                ) : null}
                                {entry.impactRisk ? (
                                  <span className="internal-ai-pill is-warning">
                                    Rischio {entry.impactRisk}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            {entry.featureLabel ? (
                              <p className="internal-ai-muted">{entry.featureLabel}</p>
                            ) : null}
                            {entry.routePaths?.length ? (
                              <p className="internal-ai-card__meta">
                                <strong>Route:</strong>{" "}
                                {entry.routePaths.map((routePath) => (
                                  <code key={`${entry.id}:route:${routePath}`}>{routePath} </code>
                                ))}
                              </p>
                            ) : null}
                            <div className="internal-ai-pill-row">
                              <span className="internal-ai-pill is-neutral">
                                UI {entry.uiFilePaths?.length ?? 0}
                              </span>
                              <span className="internal-ai-pill is-neutral">
                                Read model {entry.domainFilePaths?.length ?? 0}
                              </span>
                              <span className="internal-ai-pill is-neutral">
                                Backend IA {entry.backendFilePaths?.length ?? 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                ) : null}
                <div className="next-section-grid" style={{ marginTop: 16 }}>
                  <article className="next-panel">
                    <div className="next-panel__header">
                      <h3>Osservazione runtime NEXT</h3>
                    </div>
                    <p className="next-panel__description">
                      Questo blocco mostra solo cio che l&apos;observer read-only ha visto davvero
                      nella NEXT: route visitate, stati whitelist-safe, heading, card, tab, link
                      visibili e screenshot locali. Nessun click operativo, nessun submit e nessuna
                      uscita dal perimetro <code>/next/*</code>.
                    </p>
                    <div className="internal-ai-pill-row" style={{ marginTop: 12 }}>
                      <span
                        className={runtimeObserverStatusClass(
                          repoUnderstandingState.snapshot.runtimeObserver.status,
                        )}
                      >
                        {RUNTIME_OBSERVER_STATUS_LABELS[
                          repoUnderstandingState.snapshot.runtimeObserver.status
                        ] ?? repoUnderstandingState.snapshot.runtimeObserver.status}
                      </span>
                      <span className="internal-ai-pill is-neutral">
                        Route osservate:{" "}
                        {runtimeObserverMetrics?.observedRouteCount ??
                          repoUnderstandingState.snapshot.runtimeObserver.routeCount}
                        /
                        {runtimeObserverMetrics?.routeCount ??
                          repoUnderstandingState.snapshot.runtimeObserver.routeCount}
                      </span>
                      <span className="internal-ai-pill is-neutral">
                        Screenshot: {repoUnderstandingState.snapshot.runtimeObserver.screenshotCount}
                      </span>
                      <span className="internal-ai-pill is-neutral">
                        Stati osservati:{" "}
                        {runtimeObserverMetrics?.observedStateCount ??
                          repoUnderstandingState.snapshot.runtimeObserver.stateCount}
                        /
                        {runtimeObserverMetrics?.stateCount ??
                          repoUnderstandingState.snapshot.runtimeObserver.stateCount}
                      </span>
                      <span className="internal-ai-pill is-neutral">
                        Non disponibili:{" "}
                        {runtimeObserverMetrics?.unavailableRouteCount ??
                          repoUnderstandingState.snapshot.runtimeObserver.unavailableRouteCount ??
                          0}
                      </span>
                      <span className="internal-ai-pill is-neutral">
                        Ultima osservazione:{" "}
                        {formatDateLabel(repoUnderstandingState.snapshot.runtimeObserver.observedAt)}
                      </span>
                    </div>
                    <p className="internal-ai-card__meta" style={{ marginTop: 12 }}>
                      Se vuoi rigenerare la vista runtime, usa{" "}
                      <code>npm run internal-ai:observe-next</code> con la NEXT locale attiva su{" "}
                      <code>{repoUnderstandingState.snapshot.runtimeObserver.baseUrl ?? "http://127.0.0.1:4173"}</code>.
                    </p>
                    <p className="internal-ai-card__meta" style={{ marginTop: 8 }}>
                      Catalogo observer:{" "}
                      <code>{repoUnderstandingState.snapshot.runtimeObserver.catalogVersion}</code>.
                    </p>
                    {runtimeObserverStateKindSummary ? (
                      <p className="internal-ai-card__meta" style={{ marginTop: 8 }}>
                        Tipi di stato osservati: {runtimeObserverStateKindSummary}
                      </p>
                    ) : null}
                    {repoUnderstandingState.snapshot.runtimeObserver.routes.length ? (
                      <div className="internal-ai-runtime-observer-grid" style={{ marginTop: 16 }}>
                        {repoUnderstandingState.snapshot.runtimeObserver.routes.map((route) => {
                            const screenshotUrl = buildInternalAiRuntimeObserverAssetUrl(
                              route.screenshotFileName,
                            );

                            return (
                              <article
                                key={`runtime-observer:${route.id}`}
                                className="internal-ai-runtime-observer-card"
                              >
                                {screenshotUrl ? (
                                  <a
                                    href={screenshotUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="internal-ai-runtime-observer-card__media-link"
                                  >
                                    <img
                                      src={screenshotUrl}
                                      alt={`Screenshot ${route.label}`}
                                      className="internal-ai-runtime-observer-card__media"
                                    />
                                  </a>
                                ) : (
                                  <div className="internal-ai-runtime-observer-card__placeholder">
                                    Screenshot non disponibile
                                  </div>
                                )}
                                <div className="internal-ai-runtime-observer-card__body">
                                  <div className="internal-ai-list__row-header">
                                    <strong>{route.label}</strong>
                                    <div className="internal-ai-pill-row">
                                      <span className={runtimeObserverStatusClass(route.status)}>
                                        {RUNTIME_OBSERVER_STATUS_LABELS[route.status] ?? route.status}
                                      </span>
                                      <span className="internal-ai-pill is-neutral">
                                        {RUNTIME_SCREEN_TYPE_LABELS[route.screenType] ??
                                          route.screenType}
                                      </span>
                                      <span className="internal-ai-pill is-neutral">
                                        {RUNTIME_COVERAGE_LEVEL_LABELS[route.coverageLevel] ??
                                          route.coverageLevel}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="internal-ai-card__meta">
                                    <code>{route.finalPath ?? route.path}</code>
                                    {route.finalPath && route.finalPath !== route.path
                                      ? ` | richiesto ${route.path}`
                                      : ""}
                                    {route.discoveredFromRouteId
                                      ? ` | scoperta da ${route.discoveredFromRouteId}`
                                      : ""}
                                  </p>
                                  <p className="internal-ai-muted">
                                    {route.mainHeading ??
                                      route.pageTitle ??
                                      "Titolo principale non rilevato in modo affidabile."}
                                  </p>
                                  <div className="internal-ai-pill-row">
                                    <span className="internal-ai-pill is-neutral">
                                      Card: {route.visibleCards.length}
                                    </span>
                                    <span className="internal-ai-pill is-neutral">
                                      Tab: {route.visibleTabs.length}
                                    </span>
                                    <span className="internal-ai-pill is-neutral">
                                      Bottoni: {route.visibleButtons.length}
                                    </span>
                                    <span className="internal-ai-pill is-neutral">
                                      Link NEXT: {route.visibleLinks.length}
                                    </span>
                                    <span className="internal-ai-pill is-neutral">
                                      Stati: {route.stateObservations.length}
                                    </span>
                                  </div>
                                  {route.visibleSections.length ? (
                                    <p className="internal-ai-card__meta">
                                      Sezioni: {route.visibleSections.slice(0, 4).join(" | ")}
                                    </p>
                                  ) : null}
                                  {route.surfaceEntries.length ? (
                                    <div className="internal-ai-pill-row">
                                      {route.surfaceEntries.slice(0, 6).map((entry) => (
                                        <span
                                          key={`${route.id}:surface:${entry.kind}:${entry.label}:${entry.targetPath ?? ""}`}
                                          className="internal-ai-pill is-neutral"
                                        >
                                          {RUNTIME_SURFACE_KIND_LABELS[entry.kind] ?? entry.kind}:{" "}
                                          {entry.label}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                  {route.visibleLinks.length ? (
                                    <div className="internal-ai-pill-row">
                                      {route.visibleLinks.slice(0, 4).map((entry) => (
                                        <span
                                          key={`${route.id}:link:${entry.path}:${entry.label}`}
                                          className="internal-ai-pill is-neutral"
                                        >
                                          {entry.label}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                  {route.stateObservations.length ? (
                                    <div className="internal-ai-list" style={{ marginTop: 8 }}>
                                      {route.stateObservations.map((stateObservation) => (
                                        <div
                                          key={`${route.id}:state:${stateObservation.id}`}
                                          className="internal-ai-runtime-observer-state"
                                        >
                                          <div className="internal-ai-list__row-header">
                                            <strong>{stateObservation.label}</strong>
                                            <div className="internal-ai-pill-row">
                                              <span
                                                className={runtimeObserverStatusClass(
                                                  stateObservation.status,
                                                )}
                                              >
                                                {RUNTIME_OBSERVER_STATUS_LABELS[
                                                  stateObservation.status
                                                ] ?? stateObservation.status}
                                              </span>
                                              <span className="internal-ai-pill is-neutral">
                                                {RUNTIME_STATE_KIND_LABELS[stateObservation.kind] ??
                                                  stateObservation.kind}
                                              </span>
                                            </div>
                                          </div>
                                          <p className="internal-ai-card__meta">
                                            Trigger: {stateObservation.triggerLabel}
                                            {stateObservation.finalPath
                                              ? ` | ${stateObservation.finalPath}`
                                              : ""}
                                          </p>
                                          {stateObservation.visibleSections.length ? (
                                            <p className="internal-ai-card__meta">
                                              Sezioni:{" "}
                                              {stateObservation.visibleSections
                                                .slice(0, 3)
                                                .join(" | ")}
                                            </p>
                                          ) : null}
                                          {stateObservation.limitations.length ? (
                                            <ul className="internal-ai-inline-list">
                                              {stateObservation.limitations.map((entry) => (
                                                  <li
                                                    key={`${stateObservation.id}:limit:${entry}`}
                                                  >
                                                    {entry}
                                                  </li>
                                                ))}
                                            </ul>
                                          ) : null}
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                  {route.limitations.length ? (
                                    <ul className="internal-ai-inline-list">
                                      {route.limitations.map((entry) => (
                                        <li key={`${route.id}:limit:${entry}`}>{entry}</li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </div>
                              </article>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="next-clone-placeholder internal-ai-empty" style={{ marginTop: 16 }}>
                        <p>
                          L&apos;observer runtime non ha ancora raccolto schermate reali della NEXT.
                          La guida IA usa ancora solo la snapshot repo/UI curata.
                        </p>
                      </div>
                    )}
                  </article>
                  <article className="next-panel">
                    <div className="next-panel__header">
                      <h3>Consigliatore integrazione UI, flow e file</h3>
                    </div>
                    <p className="next-panel__description">
                      La nuova IA usa questa matrice per dire dove conviene integrare una funzione
                      futura: modulo giusto, superficie giusta, file candidati e confine corretto
                      tra madre, NEXT e backend IA rispetto al flusso reale del gestionale.
                    </p>
                    <div className="internal-ai-list" style={{ marginTop: 16 }}>
                      {repoUnderstandingState.snapshot.integrationGuidance.map((entry) => (
                        <div key={`integration-guidance:${entry.id}`} className="internal-ai-list__row">
                          <div className="internal-ai-list__row-header">
                            <strong>{entry.recommendedModuleLabel}</strong>
                            <div className="internal-ai-pill-row">
                              <span className="internal-ai-pill is-neutral">
                                {UI_INTEGRATION_DOMAIN_LABELS[entry.domainType] ?? entry.domainType}
                              </span>
                              <span className="internal-ai-pill is-warning">
                                Superficie primaria:{" "}
                                {UI_INTEGRATION_SURFACE_LABELS[entry.primarySurfaceKind] ??
                                  entry.primarySurfaceKind}
                              </span>
                              <span className="internal-ai-pill is-neutral">
                                Confidenza {entry.confidence}
                              </span>
                            </div>
                          </div>
                          <p className="internal-ai-muted">{entry.whenToUse}</p>
                          <p className="internal-ai-card__meta">
                            <strong>Perche qui:</strong> {entry.why}
                          </p>
                          <p className="internal-ai-card__meta">
                            <strong>Route consigliate:</strong>{" "}
                            {entry.recommendedRoutePaths.map((routePath) => (
                              <code key={`${entry.id}:route:${routePath}`}>{routePath} </code>
                            ))}
                          </p>
                          <p className="internal-ai-card__meta">
                            <strong>File candidati:</strong>{" "}
                            {entry.candidateSourcePaths.map((filePath) => (
                              <code key={`${entry.id}:file:${filePath}`}>{filePath} </code>
                            ))}
                          </p>
                          <div className="internal-ai-pill-row">
                            {entry.recommendedSurfaceKinds.map((surface) => (
                              <span
                                key={`${entry.id}:surface:${surface}`}
                                className="internal-ai-pill is-neutral"
                              >
                                {UI_INTEGRATION_SURFACE_LABELS[surface] ?? surface}
                              </span>
                            ))}
                            {entry.alternativeSurfaceKinds.map((surface) => (
                              <span
                                key={`${entry.id}:surface-alt:${surface}`}
                                className="internal-ai-pill is-warning"
                              >
                                Alternativa{" "}
                                {UI_INTEGRATION_SURFACE_LABELS[surface] ?? surface}
                              </span>
                            ))}
                          </div>
                          <p className="internal-ai-card__meta">
                            <strong>Ruolo file:</strong> {entry.fileRoles.join(" | ")}
                          </p>
                          {entry.evidenceRouteIds.length ? (
                            <p className="internal-ai-card__meta">
                              <strong>Evidenze runtime:</strong> {entry.evidenceRouteIds.join(" | ")}
                            </p>
                          ) : null}
                          <div className="internal-ai-pill-row">
                            {entry.impactedModules.map((moduleLabel) => (
                              <span
                                key={`${entry.id}:module:${moduleLabel}`}
                                className="internal-ai-pill is-neutral"
                              >
                                Impatta {moduleLabel}
                              </span>
                            ))}
                            {entry.avoidModules.map((moduleLabel) => (
                              <span
                                key={`${entry.id}:avoid:${moduleLabel}`}
                                className="internal-ai-pill is-warning"
                              >
                                Evita {moduleLabel}
                              </span>
                            ))}
                          </div>
                          {entry.antiPatterns.length ? (
                            <ul className="internal-ai-inline-list">
                              {entry.antiPatterns.map((antiPattern) => (
                                <li key={`${entry.id}:anti-pattern:${antiPattern}`}>{antiPattern}</li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
                <div className="next-section-grid" style={{ marginTop: 16 }}>
                  <article className="next-panel">
                    <div className="next-panel__header">
                      <h3>Indice repository controllato</h3>
                    </div>
                    <p className="next-panel__description">
                      Il backend IA non scansiona tutto il repository in modo opaco: indicizza solo
                      un perimetro controllato di file chiave per codice, route-like file,
                      componenti e CSS.
                    </p>
                    <div className="internal-ai-pill-row" style={{ marginTop: 12 }}>
                      {repoUnderstandingState.snapshot.repoZones.map((zone) => (
                        <span key={zone.id} className="internal-ai-pill is-neutral">
                          {REPO_ZONE_LABELS[zone.id] ?? zone.id}
                        </span>
                      ))}
                    </div>
                    <div className="internal-ai-list" style={{ marginTop: 16 }}>
                      {repoUnderstandingState.snapshot.fileIndex.slice(0, 10).map((entry) => (
                        <div key={entry.path} className="internal-ai-list__row">
                          <div className="internal-ai-list__row-header">
                            <strong>{entry.path}</strong>
                            <div className="internal-ai-pill-row">
                              <span className="internal-ai-pill is-neutral">
                                {REPO_ZONE_LABELS[entry.zoneId] ?? entry.zoneId}
                              </span>
                              <span className="internal-ai-pill is-neutral">
                                {REPO_FILE_KIND_LABELS[entry.kind] ?? entry.kind}
                              </span>
                            </div>
                          </div>
                          <p className="internal-ai-muted">{entry.uiRole}</p>
                          <div className="internal-ai-pill-row">
                            {entry.relatedRoutePaths.length ? (
                              <span className="internal-ai-pill is-neutral">
                                Route collegate: {entry.relatedRoutePaths.join(", ")}
                              </span>
                            ) : null}
                            {entry.relatedStylePaths.length ? (
                              <span className="internal-ai-pill is-neutral">
                                CSS collegati: {entry.relatedStylePaths.join(", ")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                  <article className="next-panel">
                    <div className="next-panel__header">
                      <h3>Madre vs NEXT e policy di scrittura</h3>
                    </div>
                    <div className="internal-ai-list">
                      {repoUnderstandingState.snapshot.legacyNextRelations.map((relation) => (
                        <div key={relation.id} className="internal-ai-list__row">
                          <div className="internal-ai-list__row-header">
                            <strong>{relation.label}</strong>
                          </div>
                          <p className="internal-ai-muted">{relation.summary}</p>
                          <div className="internal-ai-pill-row">
                            {relation.legacyPaths.map((entry) => (
                              <span key={`${relation.id}:legacy:${entry}`} className="internal-ai-pill is-warning">
                                Madre: {entry}
                              </span>
                            ))}
                            {relation.nextPaths.map((entry) => (
                              <span key={`${relation.id}:next:${entry}`} className="internal-ai-pill is-neutral">
                                NEXT/backend IA: {entry}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                      {repoUnderstandingState.snapshot.repoZones.map((zone) => (
                        <li key={`${zone.id}:policy`}>
                          <strong>{REPO_ZONE_LABELS[zone.id] ?? zone.id}:</strong>{" "}
                          {REPO_WRITE_POLICY_LABELS[zone.writePolicy] ?? zone.writePolicy}
                        </li>
                      ))}
                    </ul>
                  </article>
                </div>
                <div className="next-section-grid" style={{ marginTop: 16 }}>
                  <article className="next-panel">
                    <div className="next-panel__header">
                      <h3>Boundary Firestore live</h3>
                    </div>
                    <div className="internal-ai-pill-row">
                      <span
                        className={statusToneClass(
                          repoUnderstandingState.snapshot.firebaseReadiness.firestoreReadOnly.status,
                        )}
                      >
                        {
                          FIREBASE_READINESS_LABELS[
                            repoUnderstandingState.snapshot.firebaseReadiness.firestoreReadOnly.status
                          ]
                        }
                      </span>
                    </div>
                    <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                      {repoUnderstandingState.snapshot.firebaseReadiness.firestoreReadOnly.evidence.map(
                        (entry) => (
                          <li key={`firestore:evidence:${entry}`}>{entry}</li>
                        ),
                      )}
                    </ul>
                    <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                      {repoUnderstandingState.snapshot.firebaseReadiness.firestoreReadOnly.blockers.map(
                        (entry) => (
                          <li key={`firestore:blocker:${entry}`}>{entry}</li>
                        ),
                      )}
                    </ul>
                    {repoUnderstandingState.snapshot.firebaseReadiness.firestoreReadOnly.candidateReads
                      .length ? (
                      <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                        {repoUnderstandingState.snapshot.firebaseReadiness.firestoreReadOnly.candidateReads.map(
                          (entry) => (
                            <li key={`firestore:candidate:${entry.id}`}>
                              <strong>{entry.label}:</strong> {entry.targetLabel}.{" "}
                              {entry.sourceOfTruth}
                              <br />
                              Vincoli: {entry.constraints.join(" ")}
                            </li>
                          ),
                        )}
                      </ul>
                    ) : null}
                    <p className="internal-ai-card__meta">
                      Confine attuale:{" "}
                      {repoUnderstandingState.snapshot.firebaseReadiness.firestoreReadOnly.nextStep}
                    </p>
                  </article>
                  <article className="next-panel">
                    <div className="next-panel__header">
                      <h3>Boundary Storage live</h3>
                    </div>
                    <div className="internal-ai-pill-row">
                      <span
                        className={statusToneClass(
                          repoUnderstandingState.snapshot.firebaseReadiness.storageReadOnly.status,
                        )}
                      >
                        {
                          FIREBASE_READINESS_LABELS[
                            repoUnderstandingState.snapshot.firebaseReadiness.storageReadOnly.status
                          ]
                        }
                      </span>
                    </div>
                    <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                      {repoUnderstandingState.snapshot.firebaseReadiness.storageReadOnly.evidence.map(
                        (entry) => (
                          <li key={`storage:evidence:${entry}`}>{entry}</li>
                        ),
                      )}
                    </ul>
                    <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                      {repoUnderstandingState.snapshot.firebaseReadiness.storageReadOnly.blockers.map(
                        (entry) => (
                          <li key={`storage:blocker:${entry}`}>{entry}</li>
                        ),
                      )}
                    </ul>
                    {repoUnderstandingState.snapshot.firebaseReadiness.storageReadOnly.candidateReads
                      .length ? (
                      <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                        {repoUnderstandingState.snapshot.firebaseReadiness.storageReadOnly.candidateReads.map(
                          (entry) => (
                            <li key={`storage:candidate:${entry.id}`}>
                              <strong>{entry.label}:</strong> {entry.targetLabel}.{" "}
                              {entry.sourceOfTruth}
                              <br />
                              Vincoli: {entry.constraints.join(" ")}
                            </li>
                          ),
                        )}
                      </ul>
                    ) : null}
                    <p className="internal-ai-card__meta">
                      Confine attuale:{" "}
                      {repoUnderstandingState.snapshot.firebaseReadiness.storageReadOnly.nextStep}
                    </p>
                  </article>
                  <article className="next-panel">
                    <div className="next-panel__header">
                      <h3>Prerequisiti comuni</h3>
                    </div>
                    <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                      {repoUnderstandingState.snapshot.firebaseReadiness.sharedRequirements.map(
                        (entry) => (
                          <li key={`firebase:requirement:${entry.id}`}>
                            <strong>
                              {entry.label} (
                              {FIREBASE_REQUIREMENT_STATUS_LABELS[entry.status] ?? entry.status})
                              :
                            </strong>{" "}
                            {entry.detail}
                          </li>
                        ),
                      )}
                    </ul>
                    <ul className="internal-ai-inline-list" style={{ marginTop: 12 }}>
                      {repoUnderstandingState.snapshot.firebaseReadiness.notes.map((entry) => (
                        <li key={`firebase:note:${entry}`}>{entry}</li>
                      ))}
                    </ul>
                  </article>
                </div>
              </>
            ) : repoUnderstandingState.message ? (
              <p className="internal-ai-card__meta" style={{ marginTop: 12 }}>
                {repoUnderstandingState.message}
              </p>
            ) : null}
          </div>
          </details>

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
                  type="text"
                  value={reportPeriodInput.fromDate ?? ""}
                  onChange={(event) => handleCustomPeriodFieldChange("fromDate", event.target.value)}
                  className="internal-ai-search__input"
                  placeholder="gg mm aaaa"
                />
              </label>
              <label className="internal-ai-search__field">
                <span>A</span>
                <input
                  type="text"
                  value={reportPeriodInput.toDate ?? ""}
                  onChange={(event) => handleCustomPeriodFieldChange("toDate", event.target.value)}
                  className="internal-ai-search__input"
                  placeholder="gg mm aaaa"
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
                  <span>Targa</span>
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
              {vehicleReportBridgeState.transportMessage ? (
                <div className="internal-ai-pill-row">
                  <span className={backendPreviewTransportClass(vehicleReportBridgeState.transport)}>
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[vehicleReportBridgeState.transport]}
                  </span>
                  <span className="internal-ai-muted">{vehicleReportBridgeState.transportMessage}</span>
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
              {driverReportBridgeState.transportMessage ? (
                <div className="internal-ai-pill-row">
                  <span className={backendPreviewTransportClass(driverReportBridgeState.transport)}>
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[driverReportBridgeState.transport]}
                  </span>
                  <span className="internal-ai-muted">{driverReportBridgeState.transportMessage}</span>
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
              {combinedReportBridgeState.transportMessage ? (
                <div className="internal-ai-pill-row">
                  <span
                    className={backendPreviewTransportClass(combinedReportBridgeState.transport)}
                  >
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[combinedReportBridgeState.transport]}
                  </span>
                  <span className="internal-ai-muted">
                    {combinedReportBridgeState.transportMessage}
                  </span>
                </div>
              ) : null}
            </article>
          </div>

          <div className="next-section-grid">
            <article className="next-panel internal-ai-search">
              <div className="next-panel__header">
                <h2>Analisi economica preview-first</h2>
              </div>
              <p className="next-panel__description">
                Secondo ponte mock-safe verso il backend IA separato. Questo blocco riusa solo la
                base economica clone-safe gia leggibile sul mezzo e l&apos;eventuale snapshot
                legacy salvato in sola lettura, senza provider reali, senza backend legacy
                canonico e con fallback locale esplicito.
              </p>
              <div className="internal-ai-pill-row">
                <span className="internal-ai-pill is-neutral">
                  Targa target: {(selectedVehicle?.targa ?? exactVehicleMatch?.targa ?? normalizedLookupQuery) || "da selezionare"}
                </span>
                <span className="internal-ai-pill is-neutral">Preview-first</span>
                <span className="internal-ai-pill is-neutral">Backend separato mock-safe</span>
              </div>
              <ul className="internal-ai-inline-list">
                <li>Base diretta: documenti/costi clone-safe gia collegati alla targa.</li>
                <li>Supporto separato: eventuale snapshot legacy gia salvato e procurement perimetrale.</li>
                <li>Fuori perimetro: provider reali, parsing AI nuovo, scritture business e backend legacy canonico.</li>
              </ul>
              <div className="internal-ai-button-row">
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={handleGenerateEconomicAnalysisPreview}
                  disabled={
                    economicAnalysisPreviewState.status === "loading" ||
                    lookupCatalog.status === "loading"
                  }
                >
                  {economicAnalysisPreviewState.status === "loading"
                    ? "Analisi economica in corso..."
                    : "Apri analisi economica preview"}
                </button>
              </div>
              {economicAnalysisPreviewState.message ? (
                <p className="internal-ai-card__meta">{economicAnalysisPreviewState.message}</p>
              ) : null}
              {economicAnalysisPreviewState.transportMessage ? (
                <div className="internal-ai-pill-row">
                  <span
                    className={backendPreviewTransportClass(economicAnalysisPreviewState.transport)}
                  >
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[economicAnalysisPreviewState.transport]}
                  </span>
                  <span className="internal-ai-muted">
                    {economicAnalysisPreviewState.transportMessage}
                  </span>
                </div>
              ) : null}
            </article>
          </div>

          {economicAnalysisPreviewState.preview ? (
            <>
              <article className="next-panel">
                <div className="next-panel__header">
                  <h2>{economicAnalysisPreviewState.preview.title}</h2>
                </div>
                <p className="next-panel__description">
                  {economicAnalysisPreviewState.preview.subtitle}
                </p>
                <div className="internal-ai-pill-row" style={{ marginTop: 12 }}>
                  <span className="internal-ai-pill is-neutral">
                    Targa {economicAnalysisPreviewState.preview.header.targa}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Generata il {formatDateLabel(economicAnalysisPreviewState.preview.generatedAt)}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Documenti diretti {economicAnalysisPreviewState.preview.header.documentiDiretti}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Snapshot {economicAnalysisPreviewState.preview.header.snapshotLegacy}
                  </span>
                  <span
                    className={backendPreviewTransportClass(economicAnalysisPreviewState.transport)}
                  >
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[economicAnalysisPreviewState.transport]}
                  </span>
                </div>
                {economicAnalysisPreviewState.transportMessage ? (
                  <p className="internal-ai-card__meta">
                    {economicAnalysisPreviewState.transportMessage}
                  </p>
                ) : null}
                {renderPreviewState(economicAnalysisPreviewState.preview.previewState)}
              </article>

              <section className="internal-ai-grid">
                {economicAnalysisPreviewState.preview.cards.map((card) => (
                  <article key={card.label} className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">{card.label}</p>
                    <h3>{card.value}</h3>
                    <p className="internal-ai-card__meta">{card.meta}</p>
                  </article>
                ))}
              </section>

              <div className="next-section-grid">
                {economicAnalysisPreviewState.preview.sections.map((section) => (
                  <article key={section.id} className="next-panel">
                    <div className="next-panel__header">
                      <h2>{section.title}</h2>
                    </div>
                    <div className="internal-ai-pill-row">
                      <span className={statusToneClass(section.status)}>
                        {SECTION_STATUS_LABELS[section.status] ?? section.status}
                      </span>
                      <span className={statusToneClass(section.periodStatus)}>
                        {PERIOD_STATUS_LABELS[section.periodStatus] ?? section.periodStatus}
                      </span>
                    </div>
                    <p className="next-panel__description">{section.summary}</p>
                    <ul className="internal-ai-inline-list">
                      {section.bullets.map((entry) => (
                        <li key={`${section.id}:${entry}`}>{entry}</li>
                      ))}
                    </ul>
                    {section.notes.length ? (
                      <ul className="internal-ai-inline-list">
                        {section.notes.map((note) => (
                          <li key={`${section.id}:note:${note}`}>{note}</li>
                        ))}
                      </ul>
                    ) : null}
                    {section.periodNote ? (
                      <p className="internal-ai-card__meta">{section.periodNote}</p>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="next-section-grid">
                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Fonti lette</h2>
                  </div>
                  <div className="internal-ai-list">
                    {economicAnalysisPreviewState.preview.sources.map((source) => (
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
                        <div className="internal-ai-pill-row">
                          {source.datasetLabels.map((dataset) => (
                            <span
                              key={`${source.id}:${dataset}`}
                              className="internal-ai-pill is-neutral"
                            >
                              {dataset}
                            </span>
                          ))}
                          {source.countLabel ? (
                            <span className="internal-ai-pill is-neutral">{source.countLabel}</span>
                          ) : null}
                        </div>
                        {source.periodNote ? (
                          <p className="internal-ai-card__meta">{source.periodNote}</p>
                        ) : null}
                        {source.notes.length ? (
                          <ul className="internal-ai-inline-list">
                            {source.notes.map((note) => (
                              <li key={`${source.id}:note:${note}`}>{note}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </article>

                <article className="next-panel next-tone next-tone--warning">
                  <div className="next-panel__header">
                    <h2>Dati mancanti o limiti attuali</h2>
                  </div>
                  {economicAnalysisPreviewState.preview.missingData.length ? (
                    <ul className="internal-ai-inline-list">
                      {economicAnalysisPreviewState.preview.missingData.map((entry) => (
                        <li key={`economic-missing:${entry}`}>{entry}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="next-panel__description">
                      Nessun limite ulteriore emerso per questa preview economica iniziale.
                    </p>
                  )}
                </article>
              </div>
            </>
          ) : null}

          <div className="next-section-grid">
            <article className="next-panel internal-ai-search">
              <div className="next-panel__header">
                <h2>Preview documenti collegabili al mezzo</h2>
              </div>
              <p className="next-panel__description">
                Primo assorbimento prudente della capability legacy documenti. Questo blocco usa
                solo letture clone-safe gia esistenti, distingue in modo esplicito record diretti,
                plausibili e fuori perimetro, e non apre OCR, upload o salvataggi business. In
                questo step la preview passa prima dal backend IA separato in modalita mock-safe e
                degrada con fallback locale esplicito se il ponte non e pronto.
              </p>
              <div className="internal-ai-pill-row">
                <span className="internal-ai-pill is-neutral">
                  Targa target: {(selectedVehicle?.targa ?? exactVehicleMatch?.targa ?? normalizedLookupQuery) || "da selezionare"}
                </span>
                <span className="internal-ai-pill is-neutral">Preview-first</span>
                <span className="internal-ai-pill is-neutral">Solo clone-safe read-only</span>
              </div>
              <ul className="internal-ai-inline-list">
                <li>Diretti: @documenti_mezzi e record gia mezzo-centrici in @costiMezzo.</li>
                <li>Plausibili: @documenti_magazzino e @documenti_generici solo con targa gia leggibile.</li>
                <li>Fuori perimetro: OCR legacy, upload, scritture @documenti_*, procurement globale e segreti provider.</li>
              </ul>
              <div className="internal-ai-button-row">
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={handleGenerateDocumentsPreview}
                  disabled={
                    documentsPreviewState.status === "loading" || lookupCatalog.status === "loading"
                  }
                >
                  {documentsPreviewState.status === "loading"
                    ? "Lettura documenti in corso..."
                    : "Apri preview documenti"}
                </button>
              </div>
              {documentsPreviewState.message ? (
                <p className="internal-ai-card__meta">{documentsPreviewState.message}</p>
              ) : null}
              {documentsPreviewState.transportMessage ? (
                <div className="internal-ai-pill-row">
                  <span className={backendPreviewTransportClass(documentsPreviewState.transport)}>
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[documentsPreviewState.transport]}
                  </span>
                  <span className="internal-ai-muted">{documentsPreviewState.transportMessage}</span>
                </div>
              ) : null}
            </article>
          </div>

          {documentsPreviewState.preview ? (
            <>
              <article className="next-panel">
                <div className="next-panel__header">
                  <h2>{documentsPreviewState.preview.title}</h2>
                </div>
                <p className="next-panel__description">{documentsPreviewState.preview.subtitle}</p>
                <div className="internal-ai-pill-row" style={{ marginTop: 12 }}>
                  <span className="internal-ai-pill is-neutral">
                    Targa {documentsPreviewState.preview.header.targa}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Generata il {formatDateLabel(documentsPreviewState.preview.generatedAt)}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    File leggibili {documentsPreviewState.preview.header.fileLeggibili}
                  </span>
                  <span className={backendPreviewTransportClass(documentsPreviewState.transport)}>
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[documentsPreviewState.transport]}
                  </span>
                </div>
                {documentsPreviewState.transportMessage ? (
                  <p className="internal-ai-card__meta">{documentsPreviewState.transportMessage}</p>
                ) : null}
                {renderPreviewState(documentsPreviewState.preview.previewState)}
              </article>

              <section className="internal-ai-grid">
                {documentsPreviewState.preview.cards.map((card) => (
                  <article key={card.label} className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">{card.label}</p>
                    <h3>{card.value}</h3>
                    <p className="internal-ai-card__meta">{card.meta}</p>
                  </article>
                ))}
              </section>

              <div className="next-section-grid">
                {documentsPreviewState.preview.buckets.map((bucket) => (
                  <article key={bucket.id} className="next-panel">
                    <div className="next-panel__header">
                      <h2>{bucket.title}</h2>
                    </div>
                    <div className="internal-ai-pill-row">
                      <span className={statusToneClass(bucket.status)}>
                        {SECTION_STATUS_LABELS[bucket.status] ?? bucket.status}
                      </span>
                      <span className="internal-ai-pill is-neutral">{bucket.items.length} record visibili</span>
                    </div>
                    <p className="next-panel__description">{bucket.summary}</p>
                    {bucket.items.length ? (
                      <div className="internal-ai-list">
                        {bucket.items.map((item) => (
                          <div key={`${bucket.id}:${item.id}`} className="internal-ai-list__row">
                            <div className="internal-ai-list__row-header">
                              <strong>{item.title}</strong>
                              <div className="internal-ai-pill-row">
                                <span
                                  className={
                                    item.classification === "diretto"
                                      ? "internal-ai-pill is-neutral"
                                      : item.classification === "plausibile"
                                        ? "internal-ai-pill is-warning"
                                        : "internal-ai-pill is-danger"
                                  }
                                >
                                  {PREVIEW_DATA_CLASSIFICATION_LABELS[item.classification]}
                                </span>
                                <span className="internal-ai-pill is-neutral">{item.categoryLabel}</span>
                              </div>
                            </div>
                            <p className="internal-ai-muted">{item.summary}</p>
                            <div className="internal-ai-pill-row">
                              <span className="internal-ai-pill is-neutral">{item.sourceLabel}</span>
                              <span className="internal-ai-pill is-neutral">{item.datasetLabel}</span>
                              <span className="internal-ai-pill is-neutral">{item.fileLabel}</span>
                            </div>
                            <ul className="internal-ai-inline-list">
                              <li>Data: {item.dateLabel ?? "non disponibile"}</li>
                              <li>Importo: {item.amountLabel ?? "non disponibile"}</li>
                              <li>Traceability: {item.traceabilityLabel}</li>
                            </ul>
                            {item.notes.length ? (
                              <ul className="internal-ai-inline-list">
                                {item.notes.map((note) => (
                                  <li key={`${bucket.id}:${item.id}:${note}`}>{note}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="internal-ai-card__meta">Nessun record da esporre in questo bucket.</p>
                    )}
                    {bucket.notes.length ? (
                      <ul className="internal-ai-inline-list">
                        {bucket.notes.map((note) => (
                          <li key={`${bucket.id}:note:${note}`}>{note}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="next-section-grid">
                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Perimetro sicuro scelto</h2>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {documentsPreviewState.preview.safePerimeter.map((entry) => (
                      <li key={`safe-perimeter:${entry}`}>{entry}</li>
                    ))}
                  </ul>
                </article>

                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Fonti lette</h2>
                  </div>
                  <div className="internal-ai-list">
                    {documentsPreviewState.preview.sources.map((source) => (
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
                        {source.periodNote ? (
                          <p className="internal-ai-card__meta">{source.periodNote}</p>
                        ) : null}
                        {source.notes.length ? (
                          <ul className="internal-ai-inline-list">
                            {source.notes.map((note) => (
                              <li key={`${source.id}:note:${note}`}>{note}</li>
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
                    <h2>Dati mancanti o limiti attuali</h2>
                  </div>
                  {documentsPreviewState.preview.missingData.length ? (
                    <ul className="internal-ai-inline-list">
                      {documentsPreviewState.preview.missingData.map((entry) => (
                        <li key={`documents-missing:${entry}`}>{entry}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="next-panel__description">
                      Nessun limite ulteriore emerso per questa preview iniziale.
                    </p>
                  )}
                </article>

                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Fuori perimetro per ora</h2>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {documentsPreviewState.preview.outOfScope.map((entry) => (
                      <li key={`documents-out:${entry}`}>{entry}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </>
          ) : null}

          <div className="next-section-grid">
            <article className="next-panel internal-ai-search">
              <div className="next-panel__header">
                <h2>Preview libretto collegato al mezzo</h2>
              </div>
              <p className="next-panel__description">
                Primo assorbimento prudente della capability legacy libretto. Questo blocco legge
                solo i dati gia presenti sui reader clone-safe del mezzo e la disponibilita del
                file libretto gia visibile nel clone, senza OCR, upload o salvataggi. In questo
                step la preview passa prima dal backend IA separato in modalita mock-safe e
                degrada con fallback locale esplicito se il ponte non e pronto.
              </p>
              <div className="internal-ai-pill-row">
                <span className="internal-ai-pill is-neutral">
                  Targa target: {(selectedVehicle?.targa ?? exactVehicleMatch?.targa ?? normalizedLookupQuery) || "da selezionare"}
                </span>
                <span className="internal-ai-pill is-neutral">Preview-first</span>
                <span className="internal-ai-pill is-neutral">Solo mezzi/libretti clone-safe</span>
              </div>
              <ul className="internal-ai-inline-list">
                <li>Diretti: campi gia strutturati del mezzo e file libretto gia disponibile.</li>
                <li>Plausibili: campi incompleti, grezzi o solo contestuali da verificare.</li>
                <li>Fuori perimetro: OCR, Cloud Run esterno, upload, scritture e provider reali.</li>
              </ul>
              <div className="internal-ai-button-row">
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={handleGenerateLibrettoPreview}
                  disabled={
                    librettoPreviewState.status === "loading" || lookupCatalog.status === "loading"
                  }
                >
                  {librettoPreviewState.status === "loading"
                    ? "Lettura libretto in corso..."
                    : "Apri preview libretto"}
                </button>
              </div>
              {librettoPreviewState.message ? (
                <p className="internal-ai-card__meta">{librettoPreviewState.message}</p>
              ) : null}
              {librettoPreviewState.transportMessage ? (
                <div className="internal-ai-pill-row">
                  <span className={backendPreviewTransportClass(librettoPreviewState.transport)}>
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[librettoPreviewState.transport]}
                  </span>
                  <span className="internal-ai-muted">{librettoPreviewState.transportMessage}</span>
                </div>
              ) : null}
            </article>
          </div>

          {librettoPreviewState.preview ? (
            <>
              <article className="next-panel">
                <div className="next-panel__header">
                  <h2>{librettoPreviewState.preview.title}</h2>
                </div>
                <p className="next-panel__description">{librettoPreviewState.preview.subtitle}</p>
                <div className="internal-ai-pill-row" style={{ marginTop: 12 }}>
                  <span className="internal-ai-pill is-neutral">
                    Targa {librettoPreviewState.preview.header.targa}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Generata il {formatDateLabel(librettoPreviewState.preview.generatedAt)}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    File libretto {librettoPreviewState.preview.header.fileLibretto}
                  </span>
                  <span className={backendPreviewTransportClass(librettoPreviewState.transport)}>
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[librettoPreviewState.transport]}
                  </span>
                </div>
                {librettoPreviewState.transportMessage ? (
                  <p className="internal-ai-card__meta">{librettoPreviewState.transportMessage}</p>
                ) : null}
                {renderPreviewState(librettoPreviewState.preview.previewState)}
              </article>

              <section className="internal-ai-grid">
                {librettoPreviewState.preview.cards.map((card) => (
                  <article key={card.label} className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">{card.label}</p>
                    <h3>{card.value}</h3>
                    <p className="internal-ai-card__meta">{card.meta}</p>
                  </article>
                ))}
              </section>

              <div className="next-section-grid">
                {librettoPreviewState.preview.buckets.map((bucket) => (
                  <article key={bucket.id} className="next-panel">
                    <div className="next-panel__header">
                      <h2>{bucket.title}</h2>
                    </div>
                    <div className="internal-ai-pill-row">
                      <span className={statusToneClass(bucket.status)}>
                        {SECTION_STATUS_LABELS[bucket.status] ?? bucket.status}
                      </span>
                      <span className="internal-ai-pill is-neutral">{bucket.items.length} elementi</span>
                    </div>
                    <p className="next-panel__description">{bucket.summary}</p>
                    {bucket.items.length ? (
                      <div className="internal-ai-list">
                        {bucket.items.map((item) => (
                          <div key={`${bucket.id}:${item.id}`} className="internal-ai-list__row">
                            <div className="internal-ai-list__row-header">
                              <strong>{item.title}</strong>
                              <div className="internal-ai-pill-row">
                                <span
                                  className={
                                    item.classification === "diretto"
                                      ? "internal-ai-pill is-neutral"
                                      : item.classification === "plausibile"
                                        ? "internal-ai-pill is-warning"
                                        : "internal-ai-pill is-danger"
                                  }
                                >
                                  {PREVIEW_DATA_CLASSIFICATION_LABELS[item.classification]}
                                </span>
                                <span className="internal-ai-pill is-neutral">{item.valueLabel}</span>
                              </div>
                            </div>
                            <div className="internal-ai-pill-row">
                              <span className="internal-ai-pill is-neutral">{item.sourceLabel}</span>
                              <span className="internal-ai-pill is-neutral">{item.traceabilityLabel}</span>
                            </div>
                            {item.notes.length ? (
                              <ul className="internal-ai-inline-list">
                                {item.notes.map((note) => (
                                  <li key={`${bucket.id}:${item.id}:${note}`}>{note}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="internal-ai-card__meta">Nessun elemento da esporre in questo bucket.</p>
                    )}
                    {bucket.notes.length ? (
                      <ul className="internal-ai-inline-list">
                        {bucket.notes.map((note) => (
                          <li key={`${bucket.id}:note:${note}`}>{note}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="next-section-grid">
                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Perimetro sicuro scelto</h2>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {librettoPreviewState.preview.safePerimeter.map((entry) => (
                      <li key={`libretto-safe:${entry}`}>{entry}</li>
                    ))}
                  </ul>
                </article>

                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Fonti lette</h2>
                  </div>
                  <div className="internal-ai-list">
                    {librettoPreviewState.preview.sources.map((source) => (
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
                        {source.periodNote ? (
                          <p className="internal-ai-card__meta">{source.periodNote}</p>
                        ) : null}
                        {source.notes.length ? (
                          <ul className="internal-ai-inline-list">
                            {source.notes.map((note) => (
                              <li key={`${source.id}:note:${note}`}>{note}</li>
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
                    <h2>Dati mancanti o limiti attuali</h2>
                  </div>
                  {librettoPreviewState.preview.missingData.length ? (
                    <ul className="internal-ai-inline-list">
                      {librettoPreviewState.preview.missingData.map((entry) => (
                        <li key={`libretto-missing:${entry}`}>{entry}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="next-panel__description">
                      Nessun limite ulteriore emerso per questa preview iniziale.
                    </p>
                  )}
                </article>

                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Fuori perimetro per ora</h2>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {librettoPreviewState.preview.outOfScope.map((entry) => (
                      <li key={`libretto-out:${entry}`}>{entry}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </>
          ) : null}

          <div className="next-section-grid">
            <article className="next-panel internal-ai-search">
              <div className="next-panel__header">
                <h2>Preview preventivi collegabili al mezzo</h2>
              </div>
              <p className="next-panel__description">
                Primo assorbimento prudente della capability legacy preventivi. Questo blocco legge
                solo i preventivi gia visibili nei layer clone-safe e il supporto procurement
                separato, senza parsing IA reale, upload o salvataggi. In questo step la preview
                passa prima dal backend IA separato in modalita mock-safe e degrada con fallback
                locale esplicito se il ponte non e pronto.
              </p>
              <div className="internal-ai-pill-row">
                <span className="internal-ai-pill is-neutral">
                  Targa target: {(selectedVehicle?.targa ?? exactVehicleMatch?.targa ?? normalizedLookupQuery) || "da selezionare"}
                </span>
                <span className="internal-ai-pill is-neutral">Preview-first</span>
                <span className="internal-ai-pill is-neutral">Solo letture clone-safe e supporti separati</span>
              </div>
              <ul className="internal-ai-inline-list">
                <li>Diretti: preventivi gia mezzo-centrici leggibili nel layer documenti/costi.</li>
                <li>Plausibili: supporti procurement separati o record non pienamente mezzo-centrici.</li>
                <li>Fuori perimetro: OCR, parsing IA, upload e scritture su @preventivi, @preventivi_approvazioni, @documenti_* e Storage.</li>
              </ul>
              <div className="internal-ai-button-row">
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={handleGeneratePreventiviPreview}
                  disabled={
                    preventiviPreviewState.status === "loading" || lookupCatalog.status === "loading"
                  }
                >
                  {preventiviPreviewState.status === "loading"
                    ? "Lettura preventivi in corso..."
                    : "Apri preview preventivi"}
                </button>
              </div>
              {preventiviPreviewState.message ? (
                <p className="internal-ai-card__meta">{preventiviPreviewState.message}</p>
              ) : null}
              {preventiviPreviewState.transportMessage ? (
                <div className="internal-ai-pill-row">
                  <span className={backendPreviewTransportClass(preventiviPreviewState.transport)}>
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[preventiviPreviewState.transport]}
                  </span>
                  <span className="internal-ai-muted">
                    {preventiviPreviewState.transportMessage}
                  </span>
                </div>
              ) : null}
            </article>
          </div>

          {preventiviPreviewState.preview ? (
            <>
              <article className="next-panel">
                <div className="next-panel__header">
                  <h2>{preventiviPreviewState.preview.title}</h2>
                </div>
                <p className="next-panel__description">{preventiviPreviewState.preview.subtitle}</p>
                <div className="internal-ai-pill-row" style={{ marginTop: 12 }}>
                  <span className="internal-ai-pill is-neutral">
                    Targa {preventiviPreviewState.preview.header.targa}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Generata il {formatDateLabel(preventiviPreviewState.preview.generatedAt)}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Preventivi diretti {preventiviPreviewState.preview.header.preventiviDiretti}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Supporti separati {preventiviPreviewState.preview.header.supportiPlausibili}
                  </span>
                  <span className={backendPreviewTransportClass(preventiviPreviewState.transport)}>
                    {BACKEND_PREVIEW_TRANSPORT_LABELS[preventiviPreviewState.transport]}
                  </span>
                </div>
                {preventiviPreviewState.transportMessage ? (
                  <p className="internal-ai-card__meta">
                    {preventiviPreviewState.transportMessage}
                  </p>
                ) : null}
                {renderPreviewState(preventiviPreviewState.preview.previewState)}
              </article>

              <section className="internal-ai-grid">
                {preventiviPreviewState.preview.cards.map((card) => (
                  <article key={card.label} className="internal-ai-card">
                    <p className="internal-ai-card__eyebrow">{card.label}</p>
                    <h3>{card.value}</h3>
                    <p className="internal-ai-card__meta">{card.meta}</p>
                  </article>
                ))}
              </section>

              <div className="next-section-grid">
                {preventiviPreviewState.preview.buckets.map((bucket) => (
                  <article key={bucket.id} className="next-panel">
                    <div className="next-panel__header">
                      <h2>{bucket.title}</h2>
                    </div>
                    <div className="internal-ai-pill-row">
                      <span className={statusToneClass(bucket.status)}>
                        {SECTION_STATUS_LABELS[bucket.status] ?? bucket.status}
                      </span>
                      <span className="internal-ai-pill is-neutral">{bucket.items.length} elementi</span>
                    </div>
                    <p className="next-panel__description">{bucket.summary}</p>
                    {bucket.items.length ? (
                      <div className="internal-ai-list">
                        {bucket.items.map((item) => (
                          <div key={`${bucket.id}:${item.id}`} className="internal-ai-list__row">
                            <div className="internal-ai-list__row-header">
                              <strong>{item.title}</strong>
                              <div className="internal-ai-pill-row">
                                <span
                                  className={
                                    item.classification === "diretto"
                                      ? "internal-ai-pill is-neutral"
                                      : item.classification === "plausibile"
                                        ? "internal-ai-pill is-warning"
                                        : "internal-ai-pill is-danger"
                                  }
                                >
                                  {PREVIEW_DATA_CLASSIFICATION_LABELS[item.classification]}
                                </span>
                                <span className="internal-ai-pill is-neutral">{item.collegamentoLabel}</span>
                              </div>
                            </div>
                            <p className="internal-ai-muted">{item.summary}</p>
                            <div className="internal-ai-pill-row">
                              <span className="internal-ai-pill is-neutral">{item.sourceLabel}</span>
                              <span className="internal-ai-pill is-neutral">{item.datasetLabel}</span>
                            </div>
                            <ul className="internal-ai-inline-list">
                              <li>Data: {item.dateLabel ?? "non disponibile"}</li>
                              <li>Importo: {item.amountLabel ?? "non disponibile"}</li>
                              <li>Traceability: {item.traceabilityLabel}</li>
                            </ul>
                            {item.notes.length ? (
                              <ul className="internal-ai-inline-list">
                                {item.notes.map((note) => (
                                  <li key={`${bucket.id}:${item.id}:${note}`}>{note}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="internal-ai-card__meta">Nessun elemento da esporre in questo bucket.</p>
                    )}
                    {bucket.notes.length ? (
                      <ul className="internal-ai-inline-list">
                        {bucket.notes.map((note) => (
                          <li key={`${bucket.id}:note:${note}`}>{note}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="next-section-grid">
                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Perimetro sicuro scelto</h2>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {preventiviPreviewState.preview.safePerimeter.map((entry) => (
                      <li key={`preventivi-safe:${entry}`}>{entry}</li>
                    ))}
                  </ul>
                </article>

                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Fonti lette</h2>
                  </div>
                  <div className="internal-ai-list">
                    {preventiviPreviewState.preview.sources.map((source) => (
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
                        {source.periodNote ? (
                          <p className="internal-ai-card__meta">{source.periodNote}</p>
                        ) : null}
                        {source.notes.length ? (
                          <ul className="internal-ai-inline-list">
                            {source.notes.map((note) => (
                              <li key={`${source.id}:note:${note}`}>{note}</li>
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
                    <h2>Dati mancanti o limiti attuali</h2>
                  </div>
                  {preventiviPreviewState.preview.missingData.length ? (
                    <ul className="internal-ai-inline-list">
                      {preventiviPreviewState.preview.missingData.map((entry) => (
                        <li key={`preventivi-missing:${entry}`}>{entry}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="next-panel__description">
                      Nessun limite ulteriore emerso per questa preview iniziale.
                    </p>
                  )}
                </article>

                <article className="next-panel">
                  <div className="next-panel__header">
                    <h2>Fuori perimetro per ora</h2>
                  </div>
                  <ul className="internal-ai-inline-list">
                    {preventiviPreviewState.preview.outOfScope.map((entry) => (
                      <li key={`preventivi-out:${entry}`}>{entry}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </>
          ) : null}

          <div className="next-section-grid">
            <article className="next-panel">
              <div className="next-panel__header">
                <h2>Memoria recente del modulo IA</h2>
              </div>
              <p className="next-panel__description">
                Memoria e tracking restano isolati dal gestionale: quando l&apos;adapter server-side
                e disponibile vengono salvati nel contenitore IA dedicato, altrimenti restano nel
                clone locale. Nessun dato business, nessun tracking globale del gestionale.
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
                  {TRACKING_MODE_LABELS[tracking.mode] ?? tracking.mode}
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
                      {CHAT_INTENT_LABELS[entry.intent] ?? entry.intent} - usi {entry.count}
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
                  <h2>Anteprima report pronta</h2>
                </div>
                <p className="next-panel__description">
                  {activeReportState.report.title}. Apro un report IA interno ordinato con sintesi,
                  dati clone-safe e sezioni operative, cosi la chat resta leggibile anche quando il
                  contenuto e ampio senza aprire workflow business reali.
                </p>
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
                  <button
                    type="button"
                    className="internal-ai-search__button"
                    onClick={() =>
                      openReportPreviewModal(activeReportState.report!, openedArtifactId)
                    }
                  >
                    Apri report IA-only
                  </button>
                  <button
                    type="button"
                    className="internal-ai-search__button"
                    onClick={handlePrepareReportPdf}
                  >
                    Genera PDF IA-only
                  </button>
                  <button type="button" className="internal-ai-search__button" onClick={markRevisionRequested}>
                    Segna da rivedere (IA)
                  </button>
                  <button type="button" className="internal-ai-search__button" onClick={markApprovable}>
                    Segna approvabile (IA)
                  </button>
                  <button type="button" className="internal-ai-search__button" onClick={discardPreview}>
                    Scarta anteprima IA
                  </button>
                  <button type="button" className="internal-ai-search__button" onClick={saveDraftArtifact}>
                    Salva draft nell&apos;archivio IA
                  </button>
                  <button
                    type="button"
                    className="internal-ai-search__button"
                    onClick={() => void handleGenerateServerReportSummary()}
                    disabled={reportSummaryWorkflowState.status === "loading"}
                  >
                    {reportSummaryWorkflowState.status === "loading"
                      ? "Sintesi server-side..."
                      : "Genera sintesi IA server-side (preview)"}
                  </button>
                </div>

                {activeReportState.draftMessage ? (
                  <p className="internal-ai-card__meta">{activeReportState.draftMessage}</p>
                ) : null}
                {visibleReportSummaryMessage ? (
                  <p className="internal-ai-card__meta">{visibleReportSummaryMessage}</p>
                ) : null}
                {visibleReportSummaryWorkflow ? (
                  <div className="internal-ai-card" style={{ marginTop: 16 }}>
                    <div className="internal-ai-list__row-header">
                      <strong>Sintesi guidata server-side</strong>
                      <div className="internal-ai-pill-row">
                        <span className="internal-ai-pill is-neutral">
                          {visibleReportSummaryWorkflow.providerTarget.provider.toUpperCase()}
                        </span>
                        <span className="internal-ai-pill is-neutral">
                          {visibleReportSummaryWorkflow.providerTarget.model}
                        </span>
                      </div>
                    </div>
                    <div className="internal-ai-pill-row" style={{ marginTop: 12 }}>
                      <span
                        className={statusToneClass(visibleReportSummaryWorkflow.requestState)}
                      >
                        Richiesta:{" "}
                        {SERVER_REPORT_SUMMARY_REQUEST_LABELS[visibleReportSummaryWorkflow.requestState]}
                      </span>
                      <span
                        className={statusToneClass(visibleReportSummaryWorkflow.approvalState)}
                      >
                        Approvazione:{" "}
                        {SERVER_REPORT_SUMMARY_APPROVAL_LABELS[visibleReportSummaryWorkflow.approvalState]}
                      </span>
                      <span
                        className={statusToneClass(visibleReportSummaryWorkflow.rollbackState)}
                      >
                        Rollback:{" "}
                        {SERVER_REPORT_SUMMARY_ROLLBACK_LABELS[visibleReportSummaryWorkflow.rollbackState]}
                      </span>
                    </div>
                    <p className="internal-ai-muted" style={{ marginTop: 12 }}>
                      {visibleReportSummaryWorkflow.previewText}
                    </p>
                    <p className="internal-ai-card__meta">
                      {visibleReportSummaryWorkflow.previewNote}
                    </p>
                    <div className="internal-ai-pill-row">
                      <span className="internal-ai-pill is-neutral">
                        Workflow {visibleReportSummaryWorkflow.id}
                      </span>
                      <span className="internal-ai-pill is-neutral">
                        Aggiornato {formatDateLabel(visibleReportSummaryWorkflow.updatedAt)}
                      </span>
                    </div>
                    <div className="internal-ai-button-row" style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        className="internal-ai-search__button"
                        disabled={
                          reportSummaryWorkflowState.status === "loading" ||
                          visibleReportSummaryWorkflow.approvalState !== "awaiting_approval"
                        }
                        onClick={() => void handleApproveServerReportSummary()}
                      >
                        Approva preview IA
                      </button>
                      <button
                        type="button"
                        className="internal-ai-search__button"
                        disabled={
                          reportSummaryWorkflowState.status === "loading" ||
                          visibleReportSummaryWorkflow.approvalState === "rejected"
                        }
                        onClick={() => void handleRejectServerReportSummary()}
                      >
                        Respingi preview IA
                      </button>
                      <button
                        type="button"
                        className="internal-ai-search__button"
                        disabled={
                          reportSummaryWorkflowState.status === "loading" ||
                          visibleReportSummaryWorkflow.requestState !== "approved" ||
                          visibleReportSummaryWorkflow.rollbackState === "rolled_back"
                        }
                        onClick={() => void handleRollbackServerReportSummary()}
                      >
                        Rollback preview IA
                      </button>
                    </div>
                    <ul className="internal-ai-inline-list">
                      {visibleReportSummaryWorkflow.notes.map((note) => (
                        <li key={`${visibleReportSummaryWorkflow.id}:${note}`}>{note}</li>
                      ))}
                    </ul>
                  </div>
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
              <article className="next-panel">
                <div className="next-panel__header">
                  <h2>Contesto sintetico del report</h2>
                </div>
                <div className="internal-ai-pill-row">
                  {activeReportState.report.sources.slice(0, 4).map((source) => (
                    <span key={source.id} className="internal-ai-pill is-neutral">
                      {source.title}
                    </span>
                  ))}
                  {activeReportState.report.missingData.length ? (
                    <span className="internal-ai-pill is-warning">
                      Dati mancanti {activeReportState.report.missingData.length}
                    </span>
                  ) : null}
                  {activeReportState.report.evidences.length ? (
                    <span className="internal-ai-pill is-neutral">
                      Evidenze {activeReportState.report.evidences.length}
                    </span>
                  ) : null}
                </div>
                <p className="internal-ai-card__meta">
                  Le sezioni complete, le fonti lette, i dati mancanti e gli eventuali output
                  server-side restano nella anteprima PDF dedicata.
                </p>
              </article>
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
                        <span className={contractModeClass(contract.mode)}>
                          {CONTRACT_MODE_LABELS[contract.mode]}
                        </span>
                        <span className={contractRuntimeClass(contract.runtime)}>
                          {CONTRACT_RUNTIME_LABELS[contract.runtime]}
                        </span>
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
            </div>
          </details>
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
        <div className="next-section-grid">
          <InternalAiUniversalRequestsPanel />
          <article className="next-panel">
            <div className="next-panel__header">
              <h2>Richieste (`ai_requests`)</h2>
            </div>
            <p className="next-panel__description">
              Lo scaffold storico resta visibile come traccia tecnica, ma il punto corretto del
              clone ora e l&apos;inbox documentale universale con handoff standard.
            </p>
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
        </div>
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
              In questo step la scelta piu sicura e un contenitore server-side IA dedicato su file
              JSON locali del backend separato, con fallback locale esplicito nel clone. Firestore
              e Storage reali restano fuori: le policy effettive non sono dimostrate nel repo e
              l&apos;app continua a usare auth anonima.
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
                Questo artifact contiene una preview riapribile. Puoi riportarla nella home IA o
                aprirla direttamente nel documento dedicato.
              </p>
              <div className="internal-ai-button-row">
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={() => handleOpenArtifact(openedArtifact.id)}
                >
                  Riapri nella home IA
                </button>
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={() =>
                    openReportPreviewModal(openedArtifact.payload!.report, openedArtifact.id)
                  }
                >
                  Apri anteprima PDF
                </button>
              </div>
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
              <div className="internal-ai-pill-row" style={{ marginTop: 16 }}>
                {openedArtifact.payload.sourceDatasetLabels.map((dataset) => (
                  <span
                    key={`${openedArtifact.id}:dataset:${dataset}`}
                    className="internal-ai-pill is-neutral"
                  >
                    {dataset}
                  </span>
                ))}
                <span className="internal-ai-pill is-warning">
                  Dati mancanti {openedArtifact.payload.missingDataCount}
                </span>
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
              <code>{TRACKING_MODE_LABELS[tracking.mode] ?? tracking.mode}</code>
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

      {reportPreviewModalState.isOpen && reportPreviewModalState.report ? (
        <div
          className="internal-ai-document-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Anteprima PDF del report"
        >
          <button
            type="button"
            className="internal-ai-document-modal__backdrop"
            aria-label="Chiudi anteprima report"
            onClick={closeReportPreviewModal}
          />
          <div className="internal-ai-document-modal__sheet">
            <div className="internal-ai-document-modal__toolbar">
              <div>
                <p className="internal-ai-card__eyebrow">Anteprima PDF del report</p>
                <h2>{reportPreviewModalState.report.title}</h2>
                <p className="internal-ai-card__meta">
                  {reportPreviewModalState.artifactId
                    ? `Artifact ${reportPreviewModalState.artifactId}`
                    : "Anteprima generata dalla chat controllata"}
                </p>
                <p className="internal-ai-card__meta">
                  PDF reale generato al volo dall&apos;artifact IA dedicato. Nessuna scrittura
                  business automatica.
                </p>
              </div>
              <div className="internal-ai-button-row">
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={() => void handleCopyReportDocument()}
                >
                  Copia contenuto
                </button>
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={handleDownloadReportDocument}
                >
                  Scarica PDF IA
                </button>
                {typeof navigator !== "undefined" && "share" in navigator ? (
                  <button
                    type="button"
                    className="internal-ai-search__button"
                    onClick={() => void handleShareReportDocument()}
                  >
                    Condividi PDF IA
                  </button>
                ) : null}
                <button
                  type="button"
                  className="internal-ai-search__button"
                  onClick={closeReportPreviewModal}
                >
                  Chiudi
                </button>
              </div>
            </div>
            {reportDocumentActionMessage ? (
              <p className="internal-ai-card__meta">{reportDocumentActionMessage}</p>
            ) : null}
            <div className="internal-ai-document-modal__content">
              <div className="internal-ai-document-modal__pdf-shell">
                <div className="internal-ai-document-modal__pdf-meta">
                  <span className="internal-ai-pill is-neutral">
                    {reportPdfPreviewState.status === "ready"
                      ? "PDF pronto"
                      : reportPdfPreviewState.status === "loading"
                        ? "Generazione PDF in corso"
                        : "Fallback documento"}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    Periodo {reportPreviewModalState.report.periodContext.label}
                  </span>
                  <span className="internal-ai-pill is-neutral">
                    {getReportTypeLabel(reportPreviewModalState.report)}
                  </span>
                </div>
                <p className="internal-ai-card__meta">
                  {reportPdfPreviewState.message ??
                    "L'anteprima PDF usa solo il contenuto gia verificato del report IA."}
                </p>
                {reportPdfPreviewState.status === "ready" ? (
                  <object
                    data={reportPdfPreviewState.url}
                    type="application/pdf"
                    className="internal-ai-document-modal__pdf-viewer"
                  >
                    <iframe
                      title={reportPreviewModalState.report.title}
                      src={reportPdfPreviewState.url}
                      className="internal-ai-document-modal__pdf-viewer"
                    />
                  </object>
                ) : reportPdfPreviewState.status === "loading" ? (
                  <div className="next-clone-placeholder internal-ai-empty">
                    <p>
                      Sto preparando il PDF del report. Il contenuto testuale resta comunque
                      leggibile e copiabile qui sotto.
                    </p>
                  </div>
                ) : (
                  <div className="next-clone-placeholder internal-ai-empty">
                    <p>
                      Il browser non sta mostrando l&apos;anteprima PDF inline. Puoi comunque
                      leggere, copiare e, appena disponibile, scaricare il PDF dal flusso IA
                      dedicato.
                    </p>
                  </div>
                )}
              </div>
              <details
                className="internal-ai-document-modal__details"
                open={reportPdfPreviewState.status !== "ready"}
              >
                <summary>Leggi il report gestionale</summary>
                <div className="internal-ai-document-modal__details-content">
                  {renderReportDocumentContent(
                    reportPreviewModalState.report,
                    modalReportSummaryWorkflow,
                  )}
                </div>
              </details>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default NextInternalAiPage;
