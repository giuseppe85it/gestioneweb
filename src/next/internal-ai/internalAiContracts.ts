export type InternalAiContractId =
  | "chat-orchestrator"
  | "vehicle-dossier-hook"
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

export interface InternalAiVehicleDossierHookContract {
  resolveVehicleQuestion(input: {
    prompt: string;
    rawTarga?: string;
    periodPreset?: string;
  }): Promise<{
    status: "answer_ready" | "preview_ready" | "needs_input";
    capabilityId: string;
  }>;
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
      "Contratto ora instradato nel backend IA separato tramite adapter HTTP server-side: usa OpenAI solo lato server quando disponibile, mantiene fallback locale esplicito, non riusa runtime legacy come backend canonico e non apre live-read business.",
  },
  {
    id: "vehicle-dossier-hook",
    title: "Hook Dossier mezzo governato",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Primo hook mezzo-centrico reale del sottosistema IA: traduce linguaggio libero verso capability governate per stato dossier, rifornimenti, documenti, costi, libretto, preventivi e report PDF del mezzo, riusando solo read model NEXT clone-safe e senza aprire retrieval Firebase live largo.",
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
    title: "Comprensione controllata repo e UI",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Contratto read-only server-side attivo in forma curata: il backend IA separato costruisce una snapshot repo/UI da documenti architetturali, indice controllato di codice e CSS, relazioni madre vs NEXT, dependency map strutturale di route/moduli/layer e audit di readiness Firebase, senza autonomia di patch, senza writer business e senza riuso dei runtime legacy.",
  },
  {
    id: "retrieval-data",
    title: "Recupero contesto dati",
    mode: "bridge_mock_safe",
    runtime: "mock_safe_backend",
    note:
      "Primo retrieval server-side read-only ora attivo tramite adapter dedicato del backend IA su due perimetri stretti: snapshot D01 per contesto mezzo/libretto e snapshot Dossier mezzo clone-seeded per hook mezzo-centrico e rifornimenti, con fallback locale esplicito, live-read business chiuso e senza letture dirette Firestore/Storage lato server.",
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
