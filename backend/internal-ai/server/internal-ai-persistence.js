import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeDataRoot = path.resolve(__dirname, "../runtime-data");
const artifactsFilePath = path.join(runtimeDataRoot, "analysis_artifacts.json");
const memoryFilePath = path.join(runtimeDataRoot, "ai_operational_memory.json");
const traceabilityFilePath = path.join(runtimeDataRoot, "ai_traceability_log.json");
const vehicleContextFilePath = path.join(runtimeDataRoot, "fleet_readonly_snapshot.json");
const vehicleDossierFilePath = path.join(
  runtimeDataRoot,
  "vehicle_dossier_readonly_snapshot.json",
);
const previewWorkflowFilePath = path.join(runtimeDataRoot, "ai_preview_workflows.json");
const repoUnderstandingFilePath = path.join(runtimeDataRoot, "repo_ui_understanding_snapshot.json");

const DEFAULT_ARTIFACTS_STATE = {
  version: 1,
  sessions: [],
  requests: [],
  artifacts: [],
  auditLog: [],
};

const DEFAULT_MEMORY_STATE = {
  version: 1,
  summary: {
    mode: "server_file_isolated",
    totalVisits: 0,
    totalEvents: 0,
    sectionCounts: {
      overview: 0,
      sessions: 0,
      requests: 0,
      artifacts: 0,
      audit: 0,
    },
    recentEvents: [],
    recentVehicleSearches: [],
    recentDriverSearches: [],
    recentCombinedSearches: [],
    recentChatPrompts: [],
    recentArtifacts: [],
    recentIntents: [],
    sessionState: {
      lastSectionId: null,
      lastPath: null,
      lastTarga: null,
      lastDriverId: null,
      lastDriverName: null,
      lastPeriodLabel: null,
      lastPrompt: null,
      lastIntent: null,
      lastArtifactId: null,
      lastArchiveQuery: null,
      lastArchiveReportType: null,
      lastArchiveStatus: null,
      lastArchiveFamily: null,
      lastArchiveTarga: null,
      lastArchiveAutista: null,
      lastArchivePeriod: null,
      updatedAt: null,
    },
  },
};

const DEFAULT_TRACEABILITY_STATE = {
  version: 1,
  entries: [],
};

const DEFAULT_VEHICLE_CONTEXT_SNAPSHOT = {
  version: 1,
  sourceMode: "clone_seeded_readonly_snapshot",
  domainCode: "D01",
  activeReadOnlyDataset: "@mezzi_aziendali",
  fileAvailabilityDataset: "@mezzi_aziendali",
  seededAt: null,
  counts: {
    totalVehicles: 0,
    withLibrettoUrl: 0,
    withLibrettoStoragePath: 0,
  },
  flottaLimitations: [
    "Snapshot mezzi read-only non ancora seedato dal clone.",
  ],
  fileAvailabilityLimitations: [
    "Disponibilita file libretto non ancora seedata dal clone.",
  ],
  notes: [
    "Contenitore IA dedicato e isolato dal business data.",
    "Nessuna lettura diretta Firestore o Storage business dal backend in questo step.",
  ],
  items: [],
};

const DEFAULT_VEHICLE_DOSSIER_SNAPSHOT = {
  version: 1,
  sourceMode: "clone_seeded_vehicle_dossier_snapshot",
  domainCode: "DOSSIER_MEZZO",
  activeReadOnlyDatasets: [],
  seededAt: null,
  counts: {
    trackedVehicles: 0,
  },
  notes: [
    "Contenitore IA dedicato e isolato dal business data.",
    "Snapshot dossier mezzo non ancora seedato dal clone NEXT.",
  ],
  items: [],
};

const DEFAULT_PREVIEW_WORKFLOW_STATE = {
  version: 1,
  items: [],
};

const DEFAULT_REPO_UNDERSTANDING_SNAPSHOT = {
  version: 1,
  sourceMode: "server_filesystem_curated_readonly",
  builtAt: null,
  documents: [],
  moduleAreas: [],
  uiPatterns: [],
  repoZones: [],
  fileIndex: [],
  styleRelations: [],
  legacyNextRelations: [],
  firebaseReadiness: {
    firestoreReadOnly: {
      status: "not_ready",
      evidence: [],
      blockers: [],
      nextStep: "Audit non ancora disponibile nel contenitore IA dedicato.",
    },
    storageReadOnly: {
      status: "not_ready",
      evidence: [],
      blockers: [],
      nextStep: "Audit non ancora disponibile nel contenitore IA dedicato.",
    },
    notes: [],
  },
  screenRelations: [],
  representativeRoutes: [],
  representativeFiles: [],
  notes: [
    "Snapshot repo/UI non ancora costruita dal backend IA separato.",
  ],
  limitations: [
    "La comprensione del repository non e ancora disponibile nel contenitore IA dedicato.",
  ],
};

async function ensureRuntimeDataRoot() {
  await fs.mkdir(runtimeDataRoot, { recursive: true });
}

async function readJson(filePath, fallbackValue) {
  await ensureRuntimeDataRoot();

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return structuredClone(fallbackValue);
  }
}

async function writeJson(filePath, value) {
  await ensureRuntimeDataRoot();
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readArtifactsState() {
  return readJson(artifactsFilePath, DEFAULT_ARTIFACTS_STATE);
}

export async function writeArtifactsState(nextState) {
  await writeJson(artifactsFilePath, nextState);
  return nextState;
}

export async function readMemoryState() {
  return readJson(memoryFilePath, DEFAULT_MEMORY_STATE);
}

export async function writeMemoryState(nextState) {
  await writeJson(memoryFilePath, nextState);
  return nextState;
}

export async function appendTraceabilityEntry(entry) {
  const traceabilityState = await readJson(
    traceabilityFilePath,
    DEFAULT_TRACEABILITY_STATE,
  );

  traceabilityState.entries = [entry, ...(traceabilityState.entries ?? [])].slice(0, 400);
  await writeJson(traceabilityFilePath, traceabilityState);
  return entry;
}

export async function readVehicleContextSnapshot() {
  return readJson(vehicleContextFilePath, DEFAULT_VEHICLE_CONTEXT_SNAPSHOT);
}

export async function writeVehicleContextSnapshot(nextSnapshot) {
  await writeJson(vehicleContextFilePath, nextSnapshot);
  return nextSnapshot;
}

export async function readVehicleDossierSnapshot() {
  return readJson(vehicleDossierFilePath, DEFAULT_VEHICLE_DOSSIER_SNAPSHOT);
}

export async function writeVehicleDossierSnapshot(nextSnapshot) {
  await writeJson(vehicleDossierFilePath, nextSnapshot);
  return nextSnapshot;
}

export async function readPreviewWorkflowState() {
  return readJson(previewWorkflowFilePath, DEFAULT_PREVIEW_WORKFLOW_STATE);
}

export async function writePreviewWorkflowState(nextState) {
  await writeJson(previewWorkflowFilePath, nextState);
  return nextState;
}

export async function readRepoUnderstandingSnapshot() {
  return readJson(repoUnderstandingFilePath, DEFAULT_REPO_UNDERSTANDING_SNAPSHOT);
}

export async function writeRepoUnderstandingSnapshot(nextSnapshot) {
  await writeJson(repoUnderstandingFilePath, nextSnapshot);
  return nextSnapshot;
}

export function getInternalAiRuntimeDataRoot() {
  return runtimeDataRoot;
}
