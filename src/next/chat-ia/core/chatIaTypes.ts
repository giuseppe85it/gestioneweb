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
  | "chart"
  | "report_modal"
  | "report"
  | "archive_list"
  | "ui_action"
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

export type ChatIaChartBlock = {
  type: "bar" | "line" | "pie";
  title: string;
  data: Array<Record<string, string | number | null>>;
  xKey?: string;
  yKey?: string;
};

export type ChatIaVisualizationTone = "neutral" | "info" | "ok" | "warning" | "danger";

export type ChatIaVisualizationMetric = {
  label: string;
  value: string | number;
  unit?: string | null;
  subtitle?: string | null;
  tone?: ChatIaVisualizationTone;
  icon?: string | null;
  metadata?: ChatIaVisualizationMetadataItem[];
  action?: ChatIaActionLink | null;
};

export type ChatIaVisualizationPoint = {
  label: string;
  value: number;
  secondaryValue?: number | null;
  group?: string | null;
  tone?: ChatIaVisualizationTone;
};

export type ChatIaActionLink = {
  label: string;
  href: string | null;
  entityKind?: string | null;
  entityId?: string | null;
};

export type ChatIaVisualizationMetadataItem = {
  label: string;
  value: string | number;
};

export type ChatIaBlockSummaryCardBig = {
  kind: "summary_card_big";
  title: string;
  value: string | number;
  unit?: string | null;
  subtitle?: string | null;
  trendLabel?: string | null;
  tone?: ChatIaVisualizationTone;
  icon?: string | null;
  action?: ChatIaActionLink | null;
};

export type ChatIaBlockMetricCardGrid = {
  kind: "metric_card_grid";
  title: string;
  metrics: ChatIaVisualizationMetric[];
};

export type ChatIaBlockComparisonSplit = {
  kind: "comparison_split";
  title: string;
  comparisonLabel?: string | null;
  left: ChatIaVisualizationMetric;
  right: ChatIaVisualizationMetric;
  note?: string | null;
};

export type ChatIaRankingRow = {
  _id: string;
  rank: number;
  label: string;
  value: number;
  unit?: string | null;
  detail?: string | null;
  barValue?: number | null;
  tone?: ChatIaVisualizationTone;
  metadata?: ChatIaVisualizationMetadataItem[];
  action?: ChatIaActionLink | null;
};

export type ChatIaBlockRankingTable = {
  kind: "ranking_table";
  title: string;
  valueLabel: string;
  rows: ChatIaRankingRow[];
};

export type ChatIaBlockTrendChartLine = {
  kind: "trend_chart_line";
  title: string;
  valueLabel: string;
  data: ChatIaVisualizationPoint[];
};

export type ChatIaBlockBarChartCompare = {
  kind: "bar_chart_compare";
  title: string;
  valueLabel: string;
  data: ChatIaVisualizationPoint[];
};

export type ChatIaBlockPieChart = {
  kind: "pie_chart";
  title: string;
  data: ChatIaVisualizationPoint[];
};

export type ChatIaTimelineItem = {
  _id: string;
  date: string;
  title: string;
  description?: string | null;
  tone?: ChatIaVisualizationTone;
  icon?: string | null;
  metadata?: ChatIaVisualizationMetadataItem[];
  action?: ChatIaActionLink | null;
};

export type ChatIaBlockTimeline = {
  kind: "timeline";
  title: string;
  items: ChatIaTimelineItem[];
};

export type ChatIaStyledTable = {
  title: string;
  columns: Array<{ key: string; label: string; align?: "left" | "right" | "center" }>;
  rows: Array<Record<string, string | number | null>>;
  emptyText: string;
  accentKey?: string | null;
  rowActions?: Array<ChatIaActionLink | null>;
};

export type ChatIaBlockDataTableStyled = {
  kind: "data_table_styled";
  table: ChatIaStyledTable;
};

export type ChatIaBlockCallout = {
  kind: "callout";
  tone: Exclude<ChatIaVisualizationTone, "neutral">;
  title: string;
  text: string;
};

export type ChatIaBlockMixedLayout = {
  kind: "mixed_layout";
  title: string;
  sections: Array<{
    title: string;
    text: string;
    tone?: ChatIaVisualizationTone;
  }>;
};

export type ChatIaNestedListItem = {
  _id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  metadata?: ChatIaVisualizationMetadataItem[];
  action?: ChatIaActionLink | null;
};

export type ChatIaNestedListGroup = {
  title: string;
  subtitle?: string | null;
  items: ChatIaNestedListItem[];
};

export type ChatIaBlockNestedList = {
  kind: "nested_list";
  title: string;
  groups: ChatIaNestedListGroup[];
};

export type ChatIaUiActionBlock = {
  label: string;
  route?: string;
  modal?: string;
  params?: Record<string, string>;
};

export type ChatIaBlockText = { kind: "text"; text: string };
export type ChatIaBlockCard = { kind: "card"; card: ChatIaStructuredCard };
export type ChatIaBlockTable = { kind: "table"; table: ChatIaTable };
export type ChatIaBlockChart = { kind: "chart"; chart: ChatIaChartBlock };
export type ChatIaBlockReport = { kind: "report"; report: ChatIaReport };
export type ChatIaBlockArchive = { kind: "archive_list"; entries: ChatIaArchiveEntry[] };
export type ChatIaBlockUiAction = { kind: "ui_action"; action: ChatIaUiActionBlock };

export type ChatIaOutputBlock =
  | ChatIaBlockText
  | ChatIaBlockCard
  | ChatIaBlockTable
  | ChatIaBlockChart
  | ChatIaBlockReport
  | ChatIaBlockArchive
  | ChatIaBlockUiAction
  | ChatIaBlockSummaryCardBig
  | ChatIaBlockMetricCardGrid
  | ChatIaBlockComparisonSplit
  | ChatIaBlockRankingTable
  | ChatIaBlockTrendChartLine
  | ChatIaBlockBarChartCompare
  | ChatIaBlockPieChart
  | ChatIaBlockTimeline
  | ChatIaBlockDataTableStyled
  | ChatIaBlockCallout
  | ChatIaBlockMixedLayout
  | ChatIaBlockNestedList;

export type ChatIaAssistantFinalMessage = {
  text: string;
  status: "completed" | "partial" | "failed";
  blocks: ChatIaOutputBlock[];
  entities: Array<{ kind: string; value: string }>;
  sources: Array<{ label: string; toolName?: string; path?: string }>;
  notices: string[];
};

export type ActionEnum =
  | "view_open"
  | "disambiguation_request"
  | "clarification_request"
  | "error"
  | "report_request";

export type ViewEnum = "Driver360" | "Vehicle360" | "Site360" | "Euromecc360" | "Ricerca360";

export type EntityKindEnum = "driver" | "vehicle" | "site" | "supplier" | "euromecc";

export type PeriodPresetEnum =
  | "all"
  | "last_7d"
  | "last_30d"
  | "last_90d"
  | "this_month"
  | "this_year"
  | "custom";

export type FiltersShape = {
  searchText: string | null;
  entityKind: EntityKindEnum | null;
  periodPreset: PeriodPresetEnum | null;
};

export type ResolvedFiltersShape = {
  driverId?: string;
  vehiclePlate?: string;
  siteId?: string;
  period?: { from: string; to: string } | null;
} | null;

export type ClarificationShape = {
  kind: "missing_subject" | "missing_period" | "ambiguous_scope";
  params: { fieldHint?: "period" | "subject" | "scope" } | null;
};

export type DisambiguationShape = {
  disambiguation_required: true;
  candidates?: Array<{
    id?: string;
    plate?: string;
    displayLabel: string;
    kind?: EntityKindEnum;
  }>;
};

export type ReportRequestShape = {
  template:
    | "driver_monthly"
    | "vehicle_monthly"
    | "vehicle_costs"
    | "site_activity"
    | "euromecc_status";
  subjectKind: "driver" | "vehicle" | "site" | "euromecc";
  periodPreset: PeriodPresetEnum | null;
};

export type AccompanimentKindEnum =
  | "view_opened"
  | "no_results"
  | "disambiguation_required"
  | "clarify_too_many_results"
  | "clarify_period_required"
  | "error_intent_not_in_catalog"
  | "error_view_unavailable";

export type AccompanimentShape = {
  kind: AccompanimentKindEnum;
  params: { count?: number } | null;
};

export type ChatZeroInvenzioniMessage = {
  action: ActionEnum;
  view: ViewEnum | null;
  filters: FiltersShape | null;
  resolvedFilters?: ResolvedFiltersShape;
  clarification: ClarificationShape | null;
  disambiguation: DisambiguationShape | null;
  report: ReportRequestShape | null;
  accompaniment: AccompanimentShape;
};

export type RelationProof = {
  relationKind: "driver_vehicle";
  sourceCollection: string;
  sourceRecordId: string;
  sourceField: string;
  rule: string;
  certainty: "exact" | "explicit_assignment";
};

export type DriverVehicleCertifiedRelation = {
  relationKind: "driver_vehicle";
  vehiclePlate: string;
  relationProof: RelationProof;
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
  blocks?: ChatIaOutputBlock[];
  notices?: string[];
  zeroMessage?: ChatZeroInvenzioniMessage | null;
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
