export type InternalAiContractId =
  | "chat-orchestrator"
  | "retrieval-code"
  | "retrieval-data"
  | "artifact-repository"
  | "audit-log"
  | "approval-workflow";

export type InternalAiContractDescriptor = {
  id: InternalAiContractId;
  title: string;
  mode: "stub";
  runtime: "disabled";
  note: string;
};

export interface InternalAiChatOrchestratorContract {
  createPreviewSession(input: { prompt: string }): Promise<{ requestId: string }>;
}

export interface InternalAiRetrievalContract {
  collectContext(input: { scope: string; query: string }): Promise<{ references: string[] }>;
}

export interface InternalAiArtifactRepositoryContract {
  listArtifacts(): Promise<{ artifactIds: string[] }>;
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
    mode: "stub",
    runtime: "disabled",
    note: "Contratto futuro isolato. Nessun riuso a runtime di aiCore o provider esterni nel clone.",
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
    mode: "stub",
    runtime: "disabled",
    note: "Nessuna lettura diretta Firestore/Storage business fuori dai layer NEXT in sola lettura gia verificati.",
  },
  {
    id: "artifact-repository",
    title: "Archivio artifact IA",
    mode: "stub",
    runtime: "disabled",
    note: "Consentito ora solo come archivio locale isolato del clone, con fallback in memoria e nessun path Storage reale.",
  },
  {
    id: "audit-log",
    title: "Registro audit",
    mode: "stub",
    runtime: "disabled",
    note: "Contratto segnaposto per il registro IA interno. Nessuna persistenza reale lato business.",
  },
  {
    id: "approval-workflow",
    title: "Workflow di approvazione",
    mode: "stub",
    runtime: "disabled",
    note: "Solo stati di anteprima/approvazione locali. Nessuna approvazione o mutazione reale.",
  },
];
