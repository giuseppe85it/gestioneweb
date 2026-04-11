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

export type InternalAiArtifactStorageMode =
  | "mock_memory_only"
  | "local_storage_isolated"
  | "server_file_isolated";

export type InternalAiArtifactFamily =
  | "operativo"
  | "manutenzioni"
  | "rifornimenti"
  | "costi"
  | "documenti"
  | "misto"
  | "non_classificato";

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
  backendMode: "stub_only" | "server_adapter_mock_safe";
  artifactArchiveMode: InternalAiArtifactStorageMode;
  trackingMode: InternalAiTrackingMode;
  writesBlocked: true;
};

export type InternalAiReportTone = "default" | "success" | "warning";

export type InternalAiReportType = "targa" | "autista" | "combinato";

export type InternalAiReportPeriodPreset =
  | "all"
  | "last_30_days"
  | "last_90_days"
  | "last_full_month"
  | "custom";

export type InternalAiReportPeriodInput = {
  preset: InternalAiReportPeriodPreset;
  fromDate: string | null;
  toDate: string | null;
};

export type InternalAiReportPeriodSectionStatus =
  | "nessun_filtro"
  | "applicato"
  | "non_applicabile"
  | "non_disponibile";

export type InternalAiReportPeriodContext = {
  preset: InternalAiReportPeriodPreset;
  label: string;
  fromDate: string | null;
  toDate: string | null;
  fromTimestamp: number | null;
  toTimestamp: number | null;
  appliesFilter: boolean;
  isValid: boolean;
  notes: string[];
};

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
  periodStatus: InternalAiReportPeriodSectionStatus;
  periodNote: string | null;
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
  periodStatus: InternalAiReportPeriodSectionStatus;
  periodNote: string | null;
};

export type InternalAiVehicleReportPreview = {
  reportType: "targa";
  targetId: string;
  targetLabel: string;
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
  periodContext: InternalAiReportPeriodContext;
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

export type InternalAiDocumentPreviewItemClassification =
  | "diretto"
  | "plausibile"
  | "fuori_perimetro";

export type InternalAiDocumentPreviewItem = {
  id: string;
  title: string;
  classification: InternalAiDocumentPreviewItemClassification;
  summary: string;
  sourceLabel: string;
  datasetLabel: string;
  categoryLabel: string;
  dateLabel: string | null;
  amountLabel: string | null;
  fileLabel: string;
  traceabilityLabel: string;
  notes: string[];
};

export type InternalAiDocumentsPreviewBucket = {
  id: string;
  title: string;
  status: InternalAiVehicleReportSectionStatus;
  summary: string;
  items: InternalAiDocumentPreviewItem[];
  notes: string[];
};

export type InternalAiDocumentsPreview = {
  mezzoTarga: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  header: {
    targa: string;
    documentiDiretti: number;
    documentiPlausibili: number;
    fuoriPerimetro: number;
    fileLeggibili: number;
  };
  cards: InternalAiVehicleReportCard[];
  buckets: InternalAiDocumentsPreviewBucket[];
  safePerimeter: string[];
  outOfScope: string[];
  missingData: string[];
  sources: InternalAiVehicleReportSource[];
  previewState: InternalAiPreviewState;
};

export type InternalAiLibrettoPreviewItemClassification =
  | "diretto"
  | "plausibile"
  | "fuori_perimetro";

export type InternalAiLibrettoPreviewItem = {
  id: string;
  title: string;
  valueLabel: string;
  classification: InternalAiLibrettoPreviewItemClassification;
  sourceLabel: string;
  traceabilityLabel: string;
  notes: string[];
};

export type InternalAiLibrettoPreviewBucket = {
  id: string;
  title: string;
  status: InternalAiVehicleReportSectionStatus;
  summary: string;
  items: InternalAiLibrettoPreviewItem[];
  notes: string[];
};

export type InternalAiLibrettoPreview = {
  mezzoTarga: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  header: {
    targa: string;
    datiDiretti: number;
    datiPlausibili: number;
    fuoriPerimetro: number;
    fileLibretto: string;
  };
  cards: InternalAiVehicleReportCard[];
  buckets: InternalAiLibrettoPreviewBucket[];
  safePerimeter: string[];
  outOfScope: string[];
  missingData: string[];
  sources: InternalAiVehicleReportSource[];
  previewState: InternalAiPreviewState;
};

export type InternalAiPreventiviPreviewItemClassification =
  | "diretto"
  | "plausibile"
  | "fuori_perimetro";

export type InternalAiPreventiviPreviewItem = {
  id: string;
  title: string;
  classification: InternalAiPreventiviPreviewItemClassification;
  summary: string;
  sourceLabel: string;
  datasetLabel: string;
  dateLabel: string | null;
  amountLabel: string | null;
  collegamentoLabel: string;
  traceabilityLabel: string;
  notes: string[];
};

export type InternalAiPreventiviPreviewBucket = {
  id: string;
  title: string;
  status: InternalAiVehicleReportSectionStatus;
  summary: string;
  items: InternalAiPreventiviPreviewItem[];
  notes: string[];
};

export type InternalAiPreventiviPreview = {
  mezzoTarga: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  header: {
    targa: string;
    categoria: string | null;
    marcaModello: string | null;
    preventiviDiretti: number;
    supportiPlausibili: number;
    fuoriPerimetro: number;
  };
  cards: InternalAiVehicleReportCard[];
  buckets: InternalAiPreventiviPreviewBucket[];
  safePerimeter: string[];
  outOfScope: string[];
  missingData: string[];
  sources: InternalAiVehicleReportSource[];
  previewState: InternalAiPreviewState;
};

export type InternalAiDriverReportPreview = {
  reportType: "autista";
  targetId: string;
  targetLabel: string;
  autistaId: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  header: {
    nomeCompleto: string;
    badge: string | null;
    telefono: string | null;
    telefonoPrivato: string | null;
    codice: string | null;
    descrizione: string | null;
    schedeCarburante: number;
    mezziAssociati: number;
    ultimoMezzoNoto: string | null;
    sessioneAttiva: boolean;
  };
  cards: InternalAiVehicleReportCard[];
  periodContext: InternalAiReportPeriodContext;
  sections: InternalAiVehicleReportSection[];
  missingData: string[];
  evidences: string[];
  sources: InternalAiVehicleReportSource[];
  previewState: InternalAiPreviewState;
  approvalState: InternalAiApprovalState;
};

export type InternalAiCombinedMatchReliability =
  | "forte"
  | "plausibile"
  | "non_dimostrabile";

export type InternalAiCombinedReportPreview = {
  reportType: "combinato";
  targetId: string;
  targetLabel: string;
  mezzoTarga: string;
  autistaId: string;
  title: string;
  subtitle: string;
  generatedAt: string;
  header: {
    targa: string;
    categoria: string | null;
    marcaModello: string | null;
    nomeCompletoAutista: string;
    badgeAutista: string | null;
    autistaDichiaratoSulMezzo: string | null;
    ultimoMezzoNotoAutista: string | null;
    affidabilitaLegame: InternalAiCombinedMatchReliability;
    motivazioneLegame: string;
  };
  cards: InternalAiVehicleReportCard[];
  periodContext: InternalAiReportPeriodContext;
  sections: InternalAiVehicleReportSection[];
  missingData: string[];
  evidences: string[];
  sources: InternalAiVehicleReportSource[];
  previewState: InternalAiPreviewState;
  approvalState: InternalAiApprovalState;
};

export type InternalAiReportPreview =
  | InternalAiVehicleReportPreview
  | InternalAiDriverReportPreview
  | InternalAiCombinedReportPreview;

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

export type InternalAiDriverLookupCandidate = {
  id: string;
  nomeCompleto: string;
  badge: string | null;
  telefono: string | null;
  codice: string | null;
  descrizione: string | null;
  mezziAssociatiCount: number;
  mezziAssociatiPreview: string[];
  quality: "certo" | "parziale" | "da_verificare";
  sourceKey: string;
};

export type InternalAiArtifactPayload = {
  version: 1;
  report: InternalAiReportPreview;
  sourceDatasetLabels: string[];
  missingDataCount: number;
  evidenceCount: number;
  searchableSummary: string | null;
};

export type InternalAiDraftArtifactInput = {
  report: InternalAiReportPreview;
};

export type InternalAiVehicleCapabilityId =
  | "mezzo.status.dossier"
  | "mezzo.summary.rifornimenti"
  | "mezzo.preview.documents"
  | "mezzo.report.economic"
  | "mezzo.preview.libretto"
  | "mezzo.preview.preventivi"
  | "mezzo.report.overview";

export type InternalAiVehicleCapabilityDomain = "mezzo_dossier";

export type InternalAiVehicleCapabilityTargetScope = "single_vehicle";

export type InternalAiVehicleCapabilityFilterId = "targa" | "periodo";

export type InternalAiVehicleCapabilityMetricId =
  | "vehicle_identity"
  | "technical_flags"
  | "document_count"
  | "direct_documents"
  | "plausible_documents"
  | "preventivi_count"
  | "fatture_count"
  | "documenti_utili_count"
  | "cost_total_eur"
  | "cost_total_chf"
  | "file_availability"
  | "refuel_count"
  | "maintenance_count"
  | "work_count"
  | "missing_data"
  | "source_coverage";

export type InternalAiVehicleCapabilityGroupBy = "none" | "document_type" | "source";

export type InternalAiVehicleCapabilityOutputKind = "chat_answer" | "report_preview";

export type InternalAiVehicleCapabilityConfidence = "high" | "medium" | "low";

export type InternalAiOutputMode =
  | "chat_brief"
  | "chat_structured"
  | "artifact_document"
  | "report_pdf"
  | "ui_integration_proposal"
  | "next_integration_confirmation_required";

export type InternalAiOutputSelection = {
  mode: InternalAiOutputMode;
  reason: string;
};

export type InternalAiVehicleCapabilityBridgeId =
  | "vehicle-report-preview"
  | "economic-analysis-preview"
  | "documents-preview"
  | "libretto-preview"
  | "preventivi-preview"
  | null;

export type InternalAiVehicleCapabilityDescriptor = {
  id: InternalAiVehicleCapabilityId;
  title: string;
  domain: InternalAiVehicleCapabilityDomain;
  targetScope: InternalAiVehicleCapabilityTargetScope;
  requiredFilters: InternalAiVehicleCapabilityFilterId[];
  optionalFilters: InternalAiVehicleCapabilityFilterId[];
  metrics: InternalAiVehicleCapabilityMetricId[];
  groupBy: InternalAiVehicleCapabilityGroupBy[];
  outputKind: InternalAiVehicleCapabilityOutputKind;
  bridgeCapabilityId: InternalAiVehicleCapabilityBridgeId;
  limitations: string[];
  plannerHints: {
    keywords: string[];
    verbs: string[];
    samplePrompts: string[];
  };
};

export type InternalAiVehicleCapabilityPlan = {
  capabilityId: InternalAiVehicleCapabilityId;
  domain: InternalAiVehicleCapabilityDomain;
  targetScope: InternalAiVehicleCapabilityTargetScope;
  rawTarga: string | null;
  normalizedTarga: string | null;
  periodInput: InternalAiReportPeriodInput;
  periodLabel: string;
  outputKind: InternalAiVehicleCapabilityOutputKind;
  groupBy: InternalAiVehicleCapabilityGroupBy;
  metrics: InternalAiVehicleCapabilityMetricId[];
  missingInputs: InternalAiVehicleCapabilityFilterId[];
  confidence: InternalAiVehicleCapabilityConfidence;
  rationale: string[];
  limitations: string[];
  bridgeCapabilityId: InternalAiVehicleCapabilityBridgeId;
};

export type InternalAiChatIntent =
  | "report_targa"
  | "report_autista"
  | "report_combinato"
  | "mezzo_dossier"
  | "repo_understanding"
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
  | "repo_understanding"
  | "architecture_doc"
  | "ui_pattern"
  | "safe_mode_notice"
  | "integration_guidance"
  | "integration_confirmation";

export type InternalAiChatMessageReference = {
  type: InternalAiChatMessageReferenceType;
  label: string;
  targa: string | null;
  artifactId?: string;
};

export type InternalAiChatAttachmentKind =
  | "pdf"
  | "image"
  | "text"
  | "document"
  | "spreadsheet"
  | "other";

export type InternalAiChatAttachmentStorageMode =
  | "server_file_isolated"
  | "local_browser_only";

export type InternalAiChatAttachmentPreviewMode =
  | "image"
  | "pdf"
  | "text"
  | "download_only";

export type InternalAiDocumentAnalysisSourceKind =
  | "pdf_text"
  | "pdf_scan"
  | "image_document"
  | "text_document"
  | "other";

export type InternalAiDocumentAnalysisStatus =
  | "ready"
  | "partial"
  | "not_supported"
  | "error";

export type InternalAiDocumentAnalysisWarningSeverity = "info" | "warn" | "error";

export type InternalAiDocumentAnalysisWarning = {
  code: string;
  severity: InternalAiDocumentAnalysisWarningSeverity;
  message: string;
};

export type InternalAiDocumentAnalysisRow = {
  id: string;
  descrizione: string | null;
  quantita: number | null;
  unita: string | null;
  prezzoUnitario: number | null;
  totaleRiga: number | null;
  codiceArticolo: string | null;
  valuta: string | null;
  confidence: number | null;
  warnings: string[];
};

export type InternalAiDocumentAnalysis = {
  version: 1;
  stato: InternalAiDocumentAnalysisStatus;
  tipoSorgente: InternalAiDocumentAnalysisSourceKind;
  modalitaEstrazione: string;
  providerUsato: boolean;
  tipoDocumento: string | null;
  fornitore: string | null;
  numeroDocumento: string | null;
  dataDocumento: string | null;
  destinatario: string | null;
  valuta: string | null;
  imponibile: number | null;
  ivaImporto: number | null;
  ivaPercentuale: string | null;
  totaleDocumento: number | null;
  noteImportanti: string[];
  righe: InternalAiDocumentAnalysisRow[];
  warnings: InternalAiDocumentAnalysisWarning[];
  campiMancanti: string[];
  testoEstrattoBreve: string | null;
};

export type InternalAiChatMemoryFreshness = "fresh" | "partial" | "stale" | "missing";

export type InternalAiChatMemoryHints = {
  repoUiRequested: boolean;
  memoryFreshness: InternalAiChatMemoryFreshness;
  screenHint: string | null;
  focusKind: "repo_ui" | "report" | "attachment" | "general";
  attachmentsCount: number;
  runtimeObserverObserved: boolean;
};

export type InternalAiChatAttachment = {
  id: string;
  threadId: "main_chat";
  fileName: string;
  mimeType: string | null;
  sizeBytes: number;
  kind: InternalAiChatAttachmentKind;
  storageMode: InternalAiChatAttachmentStorageMode;
  previewMode: InternalAiChatAttachmentPreviewMode;
  persisted: boolean;
  uploadedAt: string;
  note: string;
  textExcerpt: string | null;
  documentAnalysis: InternalAiDocumentAnalysis | null;
  serverAssetPath: string | null;
  localObjectUrl?: string | null;
};

export type InternalAiChatMessage = {
  id: string;
  role: InternalAiChatMessageRole;
  createdAt: string;
  text: string;
  intent: InternalAiChatIntent;
  status: InternalAiChatExecutionStatus;
  references: InternalAiChatMessageReference[];
  attachments: InternalAiChatAttachment[];
  outputMode: InternalAiOutputMode | null;
  outputReason: string | null;
};

export type InternalAiTrackingMode =
  | "memory_only"
  | "local_storage_isolated"
  | "server_file_isolated";

export type InternalAiTrackingEventKind =
  | "screen_visit"
  | "chat_prompt"
  | "report_preview"
  | "vehicle_selected"
  | "driver_report_preview"
  | "combined_report_preview"
  | "driver_selected"
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
  periodLabel: string | null;
  updatedAt: string;
};

export type InternalAiRecentDriverSearch = {
  driverId: string;
  nomeCompleto: string;
  badge: string | null;
  source: "manuale" | "selezione_guidata" | "chat";
  result: "selected" | "ready" | "not_found" | "invalid_query";
  periodLabel: string | null;
  updatedAt: string;
};

export type InternalAiRecentCombinedSearch = {
  mezzoTarga: string;
  driverId: string;
  nomeCompleto: string;
  badge: string | null;
  source: "manuale" | "selezione_guidata" | "chat";
  result: "selected" | "ready" | "not_found" | "invalid_query";
  periodLabel: string | null;
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
  targetType: InternalAiReportType | null;
  targetLabel: string | null;
  mezzoTarga: string | null;
  autistaNome: string | null;
  primaryFamily: InternalAiArtifactFamily | null;
  artifactStatus: InternalAiArtifactStatus | null;
  periodLabel: string | null;
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
  lastDriverId: string | null;
  lastDriverName: string | null;
  lastPeriodLabel: string | null;
  lastPrompt: string | null;
  lastIntent: InternalAiChatIntent | null;
  lastArtifactId: string | null;
  lastArchiveQuery: string | null;
  lastArchiveReportType: InternalAiReportType | "tutti" | null;
  lastArchiveStatus: InternalAiArtifactStatus | "tutti" | null;
  lastArchiveFamily: InternalAiArtifactFamily | "tutte" | null;
  lastArchiveTarga: string | null;
  lastArchiveAutista: string | null;
  lastArchivePeriod: string | null;
  updatedAt: string | null;
};

export type InternalAiTrackingSummary = {
  mode: InternalAiTrackingMode;
  totalVisits: number;
  totalEvents: number;
  sectionCounts: Record<NextInternalAiSectionId, number>;
  recentEvents: InternalAiTrackingEvent[];
  recentVehicleSearches: InternalAiRecentVehicleSearch[];
  recentDriverSearches: InternalAiRecentDriverSearch[];
  recentCombinedSearches: InternalAiRecentCombinedSearch[];
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
  reportType: InternalAiReportType | null;
  targetLabel: string | null;
  periodLabel: string | null;
  mezzoTarga: string | null;
  autistaId: string | null;
  autistaNome: string | null;
  primaryFamily: InternalAiArtifactFamily | null;
  reportFamilies: InternalAiArtifactFamily[];
  searchText: string;
  matchingReliability: InternalAiCombinedMatchReliability | null;
  createdAt: string;
  updatedAt: string;
  sourceRequestTitle: string;
  sourceLabels: string[];
  version: 1;
  tags: string[];
  note: string;
  payload: InternalAiArtifactPayload | null;
};
