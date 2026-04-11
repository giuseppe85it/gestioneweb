import type { InternalAiChatAttachment } from "./internalAiTypes";

export type InternalAiUniversalEntityKind =
  | "targa"
  | "mezzo"
  | "rimorchio"
  | "cisterna"
  | "autista"
  | "badge"
  | "collega"
  | "fornitore"
  | "ordine"
  | "materiale"
  | "documento"
  | "impianto"
  | "dossier"
  | "evento_operativo"
  | "percorso_ui"
  | "modulo";

export type InternalAiUniversalCoverageStatus =
  | "assorbito"
  | "parziale"
  | "non_assorbito"
  | "fuori_perimetro";

export type InternalAiUniversalTrustLevel = "alta" | "media" | "prudente" | "da_verificare";

export type InternalAiUniversalUiHookMode = "route" | "modal" | "panel" | "redirect";

export type InternalAiUniversalSourceFamily =
  | "legacy_madre"
  | "clone_next"
  | "backend_ia_separato";

export type InternalAiUniversalAiCapabilityStatus =
  | "assorbita"
  | "mappata"
  | "fuori_perimetro";

export type InternalAiUniversalActionIntentType =
  | "open_route"
  | "open_modal"
  | "open_panel"
  | "prepare_preview"
  | "route_to_inbox"
  | "ask_disambiguation";

export type InternalAiUniversalRequestState =
  | "pronto_handoff"
  | "pronto_prefill"
  | "inbox_documentale"
  | "da_verificare"
  | "solo_risposta";

export type InternalAiUniversalHandoffConsumptionStatus =
  | "creato"
  | "instradato"
  | "letto_dal_modulo"
  | "prefill_applicato"
  | "da_verificare"
  | "errore"
  | "completato";

export type InternalAiUniversalRequestedAction =
  | "apri_modulo"
  | "apri_modulo_con_prefill"
  | "apri_inbox_documentale"
  | "continua_in_chat"
  | "chiedi_verifica";

export type InternalAiUniversalRequestKind =
  | "lookup_entita"
  | "domanda_operativa"
  | "report_strutturato"
  | "instradamento_documento"
  | "richiesta_apertura_flusso"
  | "analisi_repo_flussi"
  | "richiesta_generica";

export type InternalAiUniversalDocumentClassification =
  | "libretto_mezzo"
  | "preventivo_fornitore"
  | "documento_cisterna"
  | "documento_mezzo"
  | "tabella_materiali"
  | "documento_ambiguo"
  | "immagine_generica"
  | "testo_operativo";

export type InternalAiUniversalUiHook = {
  hookId: string;
  moduleId: string;
  label: string;
  path: string;
  mode: InternalAiUniversalUiHookMode;
  note: string;
};

export type InternalAiUniversalEntityDescriptor = {
  entityKind: InternalAiUniversalEntityKind;
  label: string;
  aliases: string[];
  lookupKeys: string[];
  notes: string[];
};

export type InternalAiUniversalModuleRegistryEntry = {
  moduleId: string;
  label: string;
  areaLabel: string;
  routes: string[];
  views: string[];
  modals: string[];
  entityKinds: InternalAiUniversalEntityKind[];
  datasets: string[];
  relations: string[];
  lookupKeys: string[];
  readers: string[];
  writers: string[];
  coverageStatus: InternalAiUniversalCoverageStatus;
  aiAssimilationStatus: InternalAiUniversalCoverageStatus;
  uiHookIds: string[];
  reusableCapabilityIds: string[];
  notes: string[];
};

export type InternalAiUniversalAdapterContract = {
  adapterId: string;
  domainCode: string;
  moduleLabel: string;
  entityKinds: InternalAiUniversalEntityKind[];
  queryTypes: string[];
  lookupKeys: string[];
  relations: string[];
  outputModel: string;
  limits: string[];
  coverageStatus: InternalAiUniversalCoverageStatus;
  trustLevel: InternalAiUniversalTrustLevel;
  liveReadCapability: "clone_read_model_only" | "no_live_read_business";
  uiHookIds: string[];
  reusableCapabilityIds: string[];
  sourceReaders: string[];
  futureReady: boolean;
  conformanceNotes: string[];
};

export type InternalAiUniversalAiCapabilityDescriptor = {
  capabilityId: string;
  label: string;
  sourceFamily: InternalAiUniversalSourceFamily;
  sourceReference: string;
  status: InternalAiUniversalAiCapabilityStatus;
  targetAdapters: string[];
  targetUiHookIds: string[];
  reuseMode: string;
  notes: string[];
};

export type InternalAiUniversalGap = {
  gapId: string;
  label: string;
  scope: string;
  reason: string;
  nextWorkPackage: string;
  risk: "BASSO" | "NORMALE" | "ELEVATO" | "EXTRA ELEVATO";
};

export type InternalAiUniversalRegistryCounts = {
  modules: number;
  routes: number;
  modals: number;
  entityKinds: number;
  adapters: number;
  aiCapabilities: number;
  absorbedAiCapabilities: number;
  uiHooks: number;
  gaps: number;
};

export type InternalAiUniversalRegistrySnapshot = {
  generatedAt: string;
  counts: InternalAiUniversalRegistryCounts;
  entities: InternalAiUniversalEntityDescriptor[];
  uiHooks: InternalAiUniversalUiHook[];
  modules: InternalAiUniversalModuleRegistryEntry[];
  adapters: InternalAiUniversalAdapterContract[];
  aiCapabilities: InternalAiUniversalAiCapabilityDescriptor[];
  gaps: InternalAiUniversalGap[];
};

export type InternalAiUniversalEntityMatch = {
  entityKind: InternalAiUniversalEntityKind;
  rawValue: string;
  normalizedValue: string;
  status: "exact" | "candidate" | "heuristic";
  confidence: InternalAiUniversalTrustLevel;
  matchedId: string | null;
  matchedLabel: string | null;
  source: string;
  lookupKey: string | null;
  note: string;
};

export type InternalAiUniversalEntityRef = {
  entityKind: InternalAiUniversalEntityKind;
  matchedId: string | null;
  label: string;
  normalizedValue: string;
  lookupKey: string | null;
};

export type InternalAiUniversalNormalizedValue =
  | string
  | number
  | boolean
  | null
  | string[];

export type InternalAiUniversalHandoffConsumptionEntry = {
  status: InternalAiUniversalHandoffConsumptionStatus;
  at: string;
  moduleId: string | null;
  routePath: string | null;
  note: string | null;
};

export type InternalAiUniversalHandoffPayload = {
  handoffId: string;
  attachmentId: string | null;
  moduloTarget: string;
  routeTarget: string;
  tipoEntita: InternalAiUniversalEntityKind | "nessuna";
  entityRef: InternalAiUniversalEntityRef | null;
  documentType: InternalAiUniversalDocumentClassification | "richiesta_testuale" | null;
  datiEstrattiNormalizzati: Record<string, InternalAiUniversalNormalizedValue>;
  prefillCanonico: Record<string, InternalAiUniversalNormalizedValue>;
  confidence: InternalAiUniversalTrustLevel;
  statoRichiesta: InternalAiUniversalRequestState;
  motivoInstradamento: string;
  capabilityRiutilizzata: string | null;
  azioneRichiesta: InternalAiUniversalRequestedAction;
  campiMancanti: string[];
  campiDaVerificare: string[];
  adapterCoinvolti: string[];
  statoConsumo: InternalAiUniversalHandoffConsumptionStatus;
  ultimoModuloConsumatore: string | null;
  ultimoPathConsumatore: string | null;
  ultimoAggiornamento: string;
  cronologiaConsumo: InternalAiUniversalHandoffConsumptionEntry[];
};

export type InternalAiUniversalEntityResolution = {
  prompt: string;
  matches: InternalAiUniversalEntityMatch[];
  unresolvedHints: string[];
};

export type InternalAiUniversalActionIntent = {
  type: InternalAiUniversalActionIntentType;
  label: string;
  moduleId: string;
  path: string;
  hookId: string | null;
  capabilityId: string | null;
  reason: string;
  payloadPreview: string[];
  handoff: InternalAiUniversalHandoffPayload | null;
};

export type InternalAiUniversalDocumentRoute = {
  attachmentId: string;
  fileName: string;
  classification: InternalAiUniversalDocumentClassification;
  confidence: InternalAiUniversalTrustLevel;
  rationale: string[];
  targetModuleId: string;
  targetHookId: string | null;
  targetPath: string;
  targetCapabilityId: string | null;
  ambiguity: "bassa" | "media" | "alta";
  status: InternalAiUniversalRequestState;
  suggestedModuleLabel: string;
  entityCandidateLabels: string[];
  handoffPayload: InternalAiUniversalHandoffPayload | null;
};

export type InternalAiUniversalRequestResolution = {
  requestKind: InternalAiUniversalRequestKind;
  priority: "alta" | "media" | "bassa";
  focusLabel: string;
  selectedModuleIds: string[];
  selectedAdapterIds: string[];
  reusableCapabilityIds: string[];
  primaryActionIntent: InternalAiUniversalActionIntent | null;
  reasoning: string[];
  explicitConstraints: string[];
};

export type InternalAiUniversalOrchestrationInput = {
  prompt: string;
  attachments: InternalAiChatAttachment[];
  preferredTarga?: string | null;
};

export type InternalAiUniversalCoverageSummary = {
  fullyCoveredAdapters: number;
  partialAdapters: number;
  uncoveredGaps: number;
  trustLabel: string;
  readyHandoffs: number;
  inboxItems: number;
};

export type InternalAiUniversalDocumentInboxItem = {
  inboxId: string;
  attachmentId: string;
  fileName: string;
  classification: InternalAiUniversalDocumentClassification;
  motivoClassificazione: string[];
  suggestedModuleId: string;
  suggestedModuleLabel: string;
  suggestedPath: string;
  entityCandidateLabels: string[];
  status: InternalAiUniversalRequestState;
  azioniPossibili: InternalAiUniversalActionIntent[];
  handoffPayload: InternalAiUniversalHandoffPayload;
  createdAt: string;
  updatedAt: string;
};

export type InternalAiUniversalRequestsRepositorySnapshot = {
  mode: "local_storage_isolated" | "memory_only";
  handoffs: InternalAiUniversalHandoffPayload[];
  inboxItems: InternalAiUniversalDocumentInboxItem[];
  updatedAt: string | null;
};

export type InternalAiUniversalConformanceIssue = {
  issueId: string;
  severity: "blocking" | "warning";
  scope: "module" | "adapter" | "gate";
  targetId: string;
  message: string;
};

export type InternalAiUniversalConformanceSummary = {
  gateStatus: "attivo" | "bloccato";
  blockingIssues: number;
  warningIssues: number;
  ruleLabel: string;
  issues: InternalAiUniversalConformanceIssue[];
};

export type InternalAiUniversalOrchestrationResult = {
  generatedAt: string;
  registry: InternalAiUniversalRegistrySnapshot;
  entityResolution: InternalAiUniversalEntityResolution;
  requestResolution: InternalAiUniversalRequestResolution;
  documentRoutes: InternalAiUniversalDocumentRoute[];
  actionIntents: InternalAiUniversalActionIntent[];
  handoffPayloads: InternalAiUniversalHandoffPayload[];
  documentInboxItems: InternalAiUniversalDocumentInboxItem[];
  selectedAdapters: InternalAiUniversalAdapterContract[];
  activeCapabilities: InternalAiUniversalAiCapabilityDescriptor[];
  gaps: InternalAiUniversalGap[];
  coverage: InternalAiUniversalCoverageSummary;
  conformance: InternalAiUniversalConformanceSummary;
  composerText: string;
};
