export type InternalAiContractId =
  | "chat-orchestrator"
  | "vehicle-report-preview"
  | "driver-report-preview"
  | "combined-report-preview"
  | "economic-analysis-preview"
  | "libretto-preview"
  | "documents-preview"
  | "preventivi-preview"
  | "retrieval-code"
  | "retrieval-data"
  | "artifact-repository"
  | "memory-repository"
  | "audit-log"
  | "approval-workflow";

export type InternalAiContractMode = "stub" | "bridge_mock_safe";

export type InternalAiContractRuntime = "disabled" | "mock_safe_backend";

export type InternalAiContractDescriptor = {
  id: InternalAiContractId;
  title: string;
  mode: InternalAiContractMode;
  runtime: InternalAiContractRuntime;
  note: string;
};

export interface InternalAiChatOrchestratorContract {
  createPreviewSession(input: { prompt: string }): Promise<{ requestId: string }>;
}

export interface InternalAiRetrievalContract {
  collectContext(input: { scope: string; query: string }): Promise<{ references: string[] }>;
}

export interface InternalAiDocumentsPreviewContract {
  previewDocuments(input: {
    targa: string;
  }): Promise<{
    status: "preview_ready" | "revision_requested";
    directCount: number;
    plausibleCount: number;
  }>;
}

export interface InternalAiVehicleReportPreviewContract {
  previewVehicleReport(input: {
    targa: string;
    periodPreset: string;
  }): Promise<{
    status: "preview_ready" | "revision_requested";
    sectionCount: number;
    sourceCount: number;
  }>;
}

export interface InternalAiDriverReportPreviewContract {
  previewDriverReport(input: {
    driverQuery: string;
    periodPreset: string;
  }): Promise<{
    status: "preview_ready" | "revision_requested";
    sectionCount: number;
    sourceCount: number;
  }>;
}

export interface InternalAiCombinedReportPreviewContract {
  previewCombinedReport(input: {
    targa: string;
    driverQuery: string;
    periodPreset: string;
  }): Promise<{
    status: "preview_ready" | "revision_requested";
    sectionCount: number;
    sourceCount: number;
  }>;
}

export interface InternalAiEconomicAnalysisPreviewContract {
  previewEconomicAnalysis(input: {
    targa: string;
  }): Promise<{
    status: "preview_ready" | "revision_requested";
    directCount: number;
    hasLegacySnapshot: boolean;
  }>;
}

export interface InternalAiLibrettoPreviewContract {
  previewLibretto(input: {
    targa: string;
  }): Promise<{
    status: "preview_ready" | "revision_requested";
    directCount: number;
    plausibleCount: number;
  }>;
}

export interface InternalAiPreventiviPreviewContract {
  previewPreventivi(input: {
    targa: string;
  }): Promise<{
    status: "preview_ready" | "revision_requested";
    directCount: number;
    plausibleCount: number;
  }>;
}

export interface InternalAiArtifactRepositoryContract {
  listArtifacts(): Promise<{ artifactIds: string[] }>;
}

export interface InternalAiMemoryRepositoryContract {
  readTrackingSummary(): Promise<{ totalEvents: number; totalVisits: number }>;
}

export interface InternalAiAuditLogContract {
  append(entry: { message: string; severity: string }): Promise<void>;
}

export interface InternalAiApprovalWorkflowContract {
  submitPreview(input: { requestId: string }): Promise<{ state: string }>;
}

export const INTERNAL_AI_CONTRACTS: InternalAiContractDescriptor[] = [
  {
    id: "chat-orchestrator",
    title: "Orchestratore conversazionale",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Contratto ora instradato nel backend IA separato in modalita mock-safe: la chat passa prima dal canale server-side dedicato, mantiene fallback locale esplicito e non riusa runtime legacy o provider esterni come backend canonico.",
  },
  {
    id: "vehicle-report-preview",
    title: "Report targa preview",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Contratto ora instradato nel backend IA separato in modalita mock-safe: usa solo layer NEXT clone-safe del dossier mezzo, mantiene fallback locale esplicito e non riusa backend legacy come canale canonico.",
  },
  {
    id: "driver-report-preview",
    title: "Report autista preview",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Contratto ora instradato nel backend IA separato in modalita mock-safe: usa solo lookup e layer NEXT clone-safe per autista, mantiene fallback locale esplicito e non riusa backend legacy come canale canonico.",
  },
  {
    id: "combined-report-preview",
    title: "Report combinato preview",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Contratto ora instradato nel backend IA separato in modalita mock-safe: combina mezzo, autista e periodo sopra i layer NEXT clone-safe, mantiene fallback locale esplicito e non riusa backend legacy come canale canonico.",
  },
  {
    id: "economic-analysis-preview",
    title: "Analisi economica preview",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Secondo contratto instradato nel backend IA separato in modalita mock-safe: usa solo layer NEXT clone-safe e snapshot legacy gia leggibili, con fallback locale esplicito e senza backend legacy canonico.",
  },
  {
    id: "libretto-preview",
    title: "Preview libretto IA",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Contratto ora instradato nel backend IA separato in modalita mock-safe: usa solo layer NEXT clone-safe read-only, mantiene fallback locale esplicito e non riusa Cloud Run, OCR o runtime legacy come backend canonico.",
  },
  {
    id: "documents-preview",
    title: "Preview documenti IA",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Primo contratto gia instradato nel backend IA separato in modalita mock-safe: usa solo layer NEXT clone-safe read-only e mantiene fallback locale esplicito, senza riusare il runtime legacy documenti come backend canonico.",
  },
  {
    id: "preventivi-preview",
    title: "Preview preventivi IA",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Contratto ora instradato nel backend IA separato in modalita mock-safe: usa solo layer NEXT clone-safe read-only, mantiene fallback locale esplicito e lascia @preventivi e approvazioni come supporto separato, non backend canonico.",
  },
  {
    id: "retrieval-code",
    title: "Recupero contesto codice",
    mode: "stub",
    runtime: "disabled",
    note: "Solo segnaposto contrattuale. Nessun accesso a runtime al repository o ai moduli business.",
  },
  {
    id: "retrieval-data",
    title: "Recupero contesto dati",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Primo retrieval server-side read-only ora attivo solo tramite adapter dedicato del backend IA: usa uno snapshot D01 seedato dal clone per il contesto mezzo/libretto, mantiene fallback locale esplicito e non apre letture dirette Firestore/Storage business lato server.",
  },
  {
    id: "artifact-repository",
    title: "Archivio artifact IA",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Contratto ora collegato a un adapter server-side dedicato: salva e legge snapshot artifact nel contenitore JSON locale di `backend/internal-ai/runtime-data` e ospita anche il primo workflow preview/approval/rollback solo su artifact IA, con fallback locale esplicito e nessun path Storage reale.",
  },
  {
    id: "memory-repository",
    title: "Memoria operativa IA",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Contratto ora collegato a un adapter server-side mock-safe dedicato: salva e legge tracking e stato operativo solo nel contenitore JSON locale di `backend/internal-ai/runtime-data`, con fallback locale esplicito e nessun dato business.",
  },
  {
    id: "audit-log",
    title: "Registro audit minimo",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Traceability minima lato server attiva nel backend IA separato: ogni lettura o scrittura del repository artifact/memoria genera una voce nel log JSON dedicato, senza diventare audit business canonico.",
  },
  {
    id: "approval-workflow",
    title: "Workflow di approvazione",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Primo workflow server-side reale ma controllato: oggi governa solo preview testuali IA su artifact dedicati, richiede approvazione esplicita, traccia il rollback e non applica nessuna scrittura business automatica.",
  },
];
