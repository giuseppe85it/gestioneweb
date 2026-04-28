import type {
  InternalAiReportPeriodInput,
  InternalAiReportPreview,
  MezzoDossierStructuredCard,
} from "../../internal-ai/internalAiTypes";

export type ChatIaSectorId =
  | "mezzi"
  | "autisti"
  | "manutenzioni_scadenze"
  | "materiali"
  | "costi_fatture"
  | "documenti"
  | "cisterna";

export type ChatIaMessageRole = "utente" | "assistente" | "sistema";

export type ChatIaExecutionStatus =
  | "idle"
  | "reading"
  | "completed"
  | "partial"
  | "failed";

export type ChatIaOutputKind =
  | "text"
  | "card"
  | "table"
  | "report_modal"
  | "archive_list"
  | "fallback";

export type ChatIaEntityRef =
  | { kind: "targa"; value: string }
  | { kind: "autista"; value: string; badge?: string | null }
  | { kind: "fornitore"; value: string }
  | { kind: "materiale"; value: string }
  | { kind: "cisterna"; value: string }
  | { kind: "unknown"; value: string };

export type ChatIaStructuredCard =
  | MezzoDossierStructuredCard
  | {
      kind: "summary_card";
      title: string;
      rows: Array<{
        label: string;
        value: string;
        tone?: "neutral" | "ok" | "warning" | "danger";
      }>;
    };

export type ChatIaTable = {
  id: string;
  title: string;
  columns: Array<{ key: string; label: string; align?: "left" | "right" | "center" }>;
  rows: Array<Record<string, string | number | null>>;
  emptyText: string;
};

export type ChatIaReport = {
  id: string;
  sector: ChatIaSectorId;
  type: "puntuale" | "mensile" | "periodico";
  target:
    | { kind: "targa"; value: string }
    | { kind: "autista"; value: string; badge?: string | null };
  title: string;
  summary: string;
  generatedAt: string;
  period: InternalAiReportPeriodInput | null;
  preview: InternalAiReportPreview | null;
  sections: Array<{
    id: string;
    title: string;
    summary: string;
    bullets: string[];
    status: "complete" | "partial" | "empty";
  }>;
  sources: Array<{ label: string; path?: string; domainCode?: string }>;
  missingData: string[];
};

export type ChatIaArchiveEntry = {
  id: string;
  version: 1;
  status: "active" | "deleted";
  sector: ChatIaSectorId;
  reportType: ChatIaReport["type"];
  targetKind: "targa" | "autista";
  targetValue: string;
  targetBadge: string | null;
  title: string;
  summary: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  periodLabel: string | null;
  periodFrom: string | null;
  periodTo: string | null;
  firestorePath: string;
  pdfStoragePath: string | null;
  pdfUrl: string | null;
  reportPayload: ChatIaReport;
  metadata: {
    sourceCount: number;
    missingDataCount: number;
    appVersion: "next";
    createdBy: "chat-ia";
  };
};

export type ChatIaMessage = {
  id: string;
  role: ChatIaMessageRole;
  createdAt: string;
  text: string;
  status: ChatIaExecutionStatus;
  sector: ChatIaSectorId | null;
  outputKind: ChatIaOutputKind;
  entities: ChatIaEntityRef[];
  card: ChatIaStructuredCard | null;
  table: ChatIaTable | null;
  report: ChatIaReport | null;
  archiveEntries: ChatIaArchiveEntry[];
  error: string | null;
};

export type ChatIaRouterDecision = {
  sector: ChatIaSectorId | null;
  confidence: "alta" | "media" | "bassa" | "nessuna";
  entities: ChatIaEntityRef[];
  period: InternalAiReportPeriodInput | null;
  asksReport: boolean;
  asksArchive: boolean;
  reason: string;
};

export type ChatIaRunnerContext = {
  nowIso: string;
  previousMessages: ChatIaMessage[];
  period: InternalAiReportPeriodInput | null;
  backend: {
    enabled: boolean;
    timeoutMs: number;
  };
};

export type ChatIaFallbackResponse = {
  sector: ChatIaSectorId | null;
  text: string;
  examples: string[];
};

export type ChatIaRunnerResult = {
  status: "completed" | "partial" | "not_handled" | "failed";
  sector: ChatIaSectorId;
  sources?: ChatIaSectorId[];
  text: string;
  outputKind: ChatIaOutputKind;
  entities: ChatIaEntityRef[];
  card: ChatIaStructuredCard | null;
  table: ChatIaTable | null;
  report: ChatIaReport | null;
  fallback: ChatIaFallbackResponse | null;
  backendContext: Record<string, unknown>;
  error: string | null;
};
