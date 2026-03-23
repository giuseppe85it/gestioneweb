import type { NextAnagraficheFlottaMezzoItem } from "../../../src/next/nextAnagraficheFlottaDomain";
import {
  INTERNAL_AI_SERVER_ADAPTER_BASE_PATH,
  type InternalAiServerPersistenceMode,
} from "./internalAiServerPersistenceContracts";

export type InternalAiServerRetrievalSourceMode = "clone_seeded_readonly_snapshot";
export type InternalAiServerRepoUnderstandingSourceMode = "server_filesystem_curated_readonly";
export type InternalAiServerRuntimeObserverSourceMode = "playwright_next_readonly_runtime";

export const INTERNAL_AI_SERVER_RETRIEVAL_ROUTES = {
  read: `${INTERNAL_AI_SERVER_ADAPTER_BASE_PATH}/retrieval/read`,
} as const;

export type InternalAiServerVehicleContextRecord = NextAnagraficheFlottaMezzoItem & {
  librettoStoragePath: string | null;
};

export type InternalAiServerVehicleContextSnapshot = {
  version: 1;
  sourceMode: InternalAiServerRetrievalSourceMode;
  domainCode: "D01";
  activeReadOnlyDataset: "@mezzi_aziendali";
  fileAvailabilityDataset: "@mezzi_aziendali";
  seededAt: string | null;
  counts: {
    totalVehicles: number;
    withLibrettoUrl: number;
    withLibrettoStoragePath: number;
  };
  flottaLimitations: string[];
  fileAvailabilityLimitations: string[];
  notes: string[];
  items: InternalAiServerVehicleContextRecord[];
};

export type InternalAiServerRetrievalSnapshotMeta = {
  domainCode: "D01";
  activeReadOnlyDataset: "@mezzi_aziendali";
  fileAvailabilityDataset: "@mezzi_aziendali";
  seededAt: string | null;
  counts: InternalAiServerVehicleContextSnapshot["counts"];
  flottaLimitations: string[];
  fileAvailabilityLimitations: string[];
  notes: string[];
};

export type InternalAiServerRepoUnderstandingDocumentEntry = {
  path: string;
  title: string;
  category: "stato" | "architettura" | "ui" | "runtime";
  summary: string;
};

export type InternalAiServerRepoUnderstandingModuleArea = {
  id: string;
  label: string;
  summary: string;
  routePaths: string[];
  sourcePaths: string[];
};

export type InternalAiServerRepoUnderstandingUiPattern = {
  id: string;
  label: string;
  summary: string;
  representativePaths: string[];
};

export type InternalAiServerRepoUnderstandingZoneId =
  | "next_clone"
  | "legacy_madre"
  | "shared_ui"
  | "backend_internal_ai"
  | "docs";

export type InternalAiServerRepoUnderstandingZone = {
  id: InternalAiServerRepoUnderstandingZoneId;
  label: string;
  summary: string;
  rootPaths: string[];
  writePolicy: "next_backend_docs_only" | "read_only_for_ai";
};

export type InternalAiServerRepoUnderstandingFileKind =
  | "page"
  | "component"
  | "style"
  | "routing"
  | "backend"
  | "document"
  | "support";

export type InternalAiServerRepoUnderstandingFileEntry = {
  path: string;
  zoneId: InternalAiServerRepoUnderstandingZoneId;
  kind: InternalAiServerRepoUnderstandingFileKind;
  framework: "react" | "css" | "markdown" | "node" | "typescript" | "other";
  sizeBytes: number;
  uiRole: string;
  relatedStylePaths: string[];
  relatedRoutePaths: string[];
};

export type InternalAiServerRepoUnderstandingStyleRelation = {
  sourcePath: string;
  stylePath: string;
  relation: "import_css";
};

export type InternalAiServerRepoUnderstandingLegacyNextRelation = {
  id: string;
  label: string;
  legacyPaths: string[];
  nextPaths: string[];
  summary: string;
};

export type InternalAiServerFirebaseReadinessStatus = "ready" | "partial" | "not_ready";

export type InternalAiServerFirebaseReadinessRequirementStatus =
  | "present"
  | "missing"
  | "legacy_only"
  | "not_versioned"
  | "conflicting";

export type InternalAiServerFirebaseReadinessRequirement = {
  id: string;
  label: string;
  status: InternalAiServerFirebaseReadinessRequirementStatus;
  detail: string;
};

export type InternalAiServerFirebaseCandidateReadAccessMode =
  | "exact_document"
  | "exact_object_path_from_firestore_field";

export type InternalAiServerFirebaseCandidateRead = {
  id: string;
  label: string;
  service: "firestore" | "storage";
  status: "candidate_not_enabled";
  accessMode: InternalAiServerFirebaseCandidateReadAccessMode;
  targetLabel: string;
  sourceOfTruth: string;
  constraints: string[];
};

export type InternalAiServerFirebaseReadinessArea = {
  status: InternalAiServerFirebaseReadinessStatus;
  evidence: string[];
  blockers: string[];
  nextStep: string;
  candidateReads: InternalAiServerFirebaseCandidateRead[];
};

export type InternalAiServerFirebaseReadinessSnapshot = {
  firestoreReadOnly: InternalAiServerFirebaseReadinessArea;
  storageReadOnly: InternalAiServerFirebaseReadinessArea;
  sharedRequirements: InternalAiServerFirebaseReadinessRequirement[];
  notes: string[];
};

export type InternalAiServerRepoUnderstandingRelation = {
  from: string;
  to: string;
  summary: string;
};

export type InternalAiServerRepoUnderstandingRouteEntry = {
  label: string;
  path: string;
  summary: string;
};

export type InternalAiServerRepoUnderstandingScreenType =
  | "cockpit"
  | "mezzo_centrico"
  | "operativita_globale"
  | "documentale"
  | "ia_interna"
  | "procurement"
  | "autista"
  | "specialistico";

export type InternalAiServerRuntimeObserverRouteLink = {
  label: string;
  path: string;
};

export type InternalAiServerRuntimeObserverRouteStatus =
  | "observed"
  | "partial"
  | "unavailable";

export type InternalAiServerRuntimeObserverCoverageLevel =
  | "route_only"
  | "interactive_readonly"
  | "dynamic_route_resolved";

export type InternalAiServerRuntimeObserverSurfaceKind =
  | "section"
  | "card"
  | "tab_trigger"
  | "button_trigger"
  | "route_link"
  | "modal_trigger";

export type InternalAiServerRuntimeObserverSurfaceEntry = {
  kind: InternalAiServerRuntimeObserverSurfaceKind;
  label: string;
  targetPath: string | null;
  safeToProbe: boolean;
};

export type InternalAiServerRuntimeObserverStateKind =
  | "route_state"
  | "tab_state"
  | "section_state"
  | "dialog_state";

export type InternalAiServerRuntimeObserverStateObservation = {
  id: string;
  label: string;
  kind: InternalAiServerRuntimeObserverStateKind;
  triggerLabel: string;
  finalPath: string | null;
  status: InternalAiServerRuntimeObserverRouteStatus;
  mainHeading: string | null;
  visibleSections: string[];
  visibleDialogs: string[];
  screenshotFileName: string | null;
  screenshotRelativePath: string | null;
  notes: string[];
  limitations: string[];
};

export type InternalAiServerRuntimeObserverRouteObservation = {
  id: string;
  label: string;
  path: string;
  finalPath: string | null;
  screenType: InternalAiServerRepoUnderstandingScreenType;
  status: InternalAiServerRuntimeObserverRouteStatus;
  observedAt: string | null;
  discoveredFromRouteId: string | null;
  sourcePaths: string[];
  pageTitle: string | null;
  mainHeading: string | null;
  visibleHeadings: string[];
  visibleSections: string[];
  visibleCards: string[];
  visibleTabs: string[];
  visibleButtons: string[];
  visibleLinks: InternalAiServerRuntimeObserverRouteLink[];
  visibleDialogs: string[];
  bodySnippet: string | null;
  screenshotFileName: string | null;
  screenshotRelativePath: string | null;
  coverageLevel: InternalAiServerRuntimeObserverCoverageLevel;
  surfaceEntries: InternalAiServerRuntimeObserverSurfaceEntry[];
  stateObservations: InternalAiServerRuntimeObserverStateObservation[];
  notes: string[];
  limitations: string[];
};

export type InternalAiServerRuntimeObserverSnapshot = {
  version: 1;
  sourceMode: InternalAiServerRuntimeObserverSourceMode;
  status: "not_observed" | "observed" | "partial" | "error";
  baseUrl: string | null;
  observedAt: string | null;
  routeCount: number;
  screenshotCount: number;
  stateCount: number;
  nextOnly: true;
  screenshotDirectory: string;
  routes: InternalAiServerRuntimeObserverRouteObservation[];
  notes: string[];
  limitations: string[];
};

export type InternalAiServerRuntimeObserverMeta = {
  status: InternalAiServerRuntimeObserverSnapshot["status"];
  sourceMode: InternalAiServerRuntimeObserverSnapshot["sourceMode"];
  observedAt: string | null;
  routeCount: number;
  screenshotCount: number;
  stateCount: number;
  nextOnly: true;
  limitations: string[];
  notes: string[];
};

export type InternalAiServerUiIntegrationSurfaceKind =
  | "page"
  | "modal"
  | "tab"
  | "card"
  | "button"
  | "section";

export type InternalAiServerUiIntegrationDomainType =
  | "mezzo_centrico"
  | "cockpit_globale"
  | "operativita_globale"
  | "documentale"
  | "procurement"
  | "autista"
  | "ia_interna"
  | "specialistico";

export type InternalAiServerUiIntegrationGuidanceEntry = {
  id: string;
  domainType: InternalAiServerUiIntegrationDomainType;
  whenToUse: string;
  recommendedModuleLabel: string;
  recommendedRoutePaths: string[];
  recommendedSurfaceKinds: InternalAiServerUiIntegrationSurfaceKind[];
  primarySurfaceKind: InternalAiServerUiIntegrationSurfaceKind;
  alternativeSurfaceKinds: InternalAiServerUiIntegrationSurfaceKind[];
  candidateSourcePaths: string[];
  fileRoles: Array<
    | "page_shell"
    | "page_section"
    | "modal_component"
    | "domain_reader"
    | "bridge"
    | "toolbar_action"
    | "routing_entry"
  >;
  impactedModules: string[];
  avoidModules: string[];
  evidenceRouteIds: string[];
  confidence: "alta" | "media" | "parziale";
  antiPatterns: string[];
  why: string;
};

export type InternalAiServerRepoUnderstandingSnapshot = {
  version: 1;
  sourceMode: InternalAiServerRepoUnderstandingSourceMode;
  builtAt: string | null;
  documents: InternalAiServerRepoUnderstandingDocumentEntry[];
  moduleAreas: InternalAiServerRepoUnderstandingModuleArea[];
  uiPatterns: InternalAiServerRepoUnderstandingUiPattern[];
  repoZones: InternalAiServerRepoUnderstandingZone[];
  fileIndex: InternalAiServerRepoUnderstandingFileEntry[];
  styleRelations: InternalAiServerRepoUnderstandingStyleRelation[];
  legacyNextRelations: InternalAiServerRepoUnderstandingLegacyNextRelation[];
  firebaseReadiness: InternalAiServerFirebaseReadinessSnapshot;
  runtimeObserver: InternalAiServerRuntimeObserverSnapshot;
  integrationGuidance: InternalAiServerUiIntegrationGuidanceEntry[];
  screenRelations: InternalAiServerRepoUnderstandingRelation[];
  representativeRoutes: InternalAiServerRepoUnderstandingRouteEntry[];
  representativeFiles: string[];
  notes: string[];
  limitations: string[];
};

export type InternalAiServerRepoUnderstandingMeta = {
  sourceMode: InternalAiServerRepoUnderstandingSourceMode;
  builtAt: string | null;
  documentCount: number;
  moduleAreaCount: number;
  uiPatternCount: number;
  zoneCount: number;
  fileIndexCount: number;
  styleRelationCount: number;
  legacyNextRelationCount: number;
  runtimeObservedRouteCount: number;
  runtimeScreenshotCount: number;
  integrationGuidanceCount: number;
  relationCount: number;
  routeCount: number;
  notes: string[];
  limitations: string[];
};

export type InternalAiServerRetrievalReadRequestBody =
  | {
      operation: "seed_vehicle_context_snapshot";
      requestId?: string;
      actorId?: string | null;
      snapshot: InternalAiServerVehicleContextSnapshot;
    }
  | {
      operation: "read_vehicle_context_by_targa";
      requestId?: string;
      actorId?: string | null;
      rawTarga: string;
    }
  | {
      operation: "read_repo_understanding_snapshot";
      requestId?: string;
      actorId?: string | null;
      refresh?: boolean;
    };

export type InternalAiServerRetrievalReadResponseData = {
  operation:
    | "seed_vehicle_context_snapshot"
    | "read_vehicle_context_by_targa"
    | "read_repo_understanding_snapshot";
  persistenceMode: InternalAiServerPersistenceMode;
  sourceMode: InternalAiServerRetrievalSourceMode | InternalAiServerRepoUnderstandingSourceMode;
  snapshotMeta: InternalAiServerRetrievalSnapshotMeta | null;
  repoUnderstandingMeta: InternalAiServerRepoUnderstandingMeta | null;
  vehicleContext: InternalAiServerVehicleContextRecord | null;
  repoUnderstanding: InternalAiServerRepoUnderstandingSnapshot | null;
  traceEntryId: string;
  notes: string[];
};
