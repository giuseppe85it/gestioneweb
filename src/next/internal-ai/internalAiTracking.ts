import type {
  InternalAiArtifactFamily,
  InternalAiArtifactStatus,
  InternalAiChatExecutionStatus,
  InternalAiChatIntent,
  InternalAiRecentArtifactAction,
  InternalAiRecentChatPrompt,
  InternalAiRecentCombinedSearch,
  InternalAiRecentDriverSearch,
  InternalAiReportType,
  InternalAiRecentVehicleSearch,
  InternalAiSessionMemoryState,
  InternalAiTrackingEvent,
  InternalAiTrackingSummary,
  InternalAiTrackingMode,
  NextInternalAiSectionId,
} from "./internalAiTypes";

type InternalAiPersistedTrackingStore = {
  version: 1;
  totalVisits: number;
  totalEvents: number;
  sectionCounts: Record<NextInternalAiSectionId, number>;
  recentEvents: InternalAiTrackingEvent[];
  recentVehicleSearches: InternalAiRecentVehicleSearch[];
  recentDriverSearches: InternalAiRecentDriverSearch[];
  recentCombinedSearches: InternalAiRecentCombinedSearch[];
  recentChatPrompts: InternalAiRecentChatPrompt[];
  recentArtifacts: InternalAiRecentArtifactAction[];
  recentIntents: InternalAiTrackingSummary["recentIntents"];
  sessionState: InternalAiSessionMemoryState;
};

const STORAGE_KEY = "@next_internal_ai:tracking_memory_v1";
const MAX_RECENT_EVENTS = 24;
const MAX_RECENT_ITEMS = 6;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getInternalAiTrackingPersistenceMode(): InternalAiTrackingMode {
  return canUseStorage() ? "local_storage_isolated" : "memory_only";
}

function createInitialSummary(): InternalAiTrackingSummary {
  return {
    mode: getInternalAiTrackingPersistenceMode(),
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
  };
}

const memoryStore: InternalAiTrackingSummary = createInitialSummary();
const listeners = new Set<() => void>();
let lastEventKey = "";
let lastEventAt = 0;
let isHydrated = false;

function cloneRecentEvent(event: InternalAiTrackingEvent): InternalAiTrackingEvent {
  return { ...event };
}

function cloneRecentVehicleSearch(search: InternalAiRecentVehicleSearch): InternalAiRecentVehicleSearch {
  return { ...search };
}

function cloneRecentDriverSearch(search: InternalAiRecentDriverSearch): InternalAiRecentDriverSearch {
  return { ...search };
}

function cloneRecentCombinedSearch(
  search: InternalAiRecentCombinedSearch,
): InternalAiRecentCombinedSearch {
  return { ...search };
}

function cloneRecentChatPrompt(prompt: InternalAiRecentChatPrompt): InternalAiRecentChatPrompt {
  return { ...prompt };
}

function cloneRecentArtifactAction(
  artifact: InternalAiRecentArtifactAction,
): InternalAiRecentArtifactAction {
  return { ...artifact };
}

function cloneSessionState(state: InternalAiSessionMemoryState): InternalAiSessionMemoryState {
  return { ...state };
}

function buildSnapshot(): InternalAiTrackingSummary {
  return {
    mode: getInternalAiTrackingPersistenceMode(),
    totalVisits: memoryStore.totalVisits,
    totalEvents: memoryStore.totalEvents,
    sectionCounts: { ...memoryStore.sectionCounts },
    recentEvents: memoryStore.recentEvents.map(cloneRecentEvent),
    recentVehicleSearches: memoryStore.recentVehicleSearches.map(cloneRecentVehicleSearch),
    recentDriverSearches: memoryStore.recentDriverSearches.map(cloneRecentDriverSearch),
    recentCombinedSearches: memoryStore.recentCombinedSearches.map(cloneRecentCombinedSearch),
    recentChatPrompts: memoryStore.recentChatPrompts.map(cloneRecentChatPrompt),
    recentArtifacts: memoryStore.recentArtifacts.map(cloneRecentArtifactAction),
    recentIntents: memoryStore.recentIntents.map((entry) => ({ ...entry })),
    sessionState: cloneSessionState(memoryStore.sessionState),
  };
}

let cachedSnapshot: InternalAiTrackingSummary = buildSnapshot();

function createPersistedStore(): InternalAiPersistedTrackingStore {
  return {
    version: 1,
    totalVisits: memoryStore.totalVisits,
    totalEvents: memoryStore.totalEvents,
    sectionCounts: { ...memoryStore.sectionCounts },
    recentEvents: memoryStore.recentEvents.map(cloneRecentEvent),
    recentVehicleSearches: memoryStore.recentVehicleSearches.map(cloneRecentVehicleSearch),
    recentDriverSearches: memoryStore.recentDriverSearches.map(cloneRecentDriverSearch),
    recentCombinedSearches: memoryStore.recentCombinedSearches.map(cloneRecentCombinedSearch),
    recentChatPrompts: memoryStore.recentChatPrompts.map(cloneRecentChatPrompt),
    recentArtifacts: memoryStore.recentArtifacts.map(cloneRecentArtifactAction),
    recentIntents: memoryStore.recentIntents.map((entry) => ({ ...entry })),
    sessionState: cloneSessionState(memoryStore.sessionState),
  };
}

function parsePersistedStore(raw: string | null): InternalAiPersistedTrackingStore | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<InternalAiPersistedTrackingStore> | null;
    if (!parsed || parsed.version !== 1) {
      return null;
    }

    return {
      version: 1,
      totalVisits: typeof parsed.totalVisits === "number" ? parsed.totalVisits : 0,
      totalEvents: typeof parsed.totalEvents === "number" ? parsed.totalEvents : 0,
      sectionCounts:
        parsed.sectionCounts && typeof parsed.sectionCounts === "object"
          ? {
              overview: Number(parsed.sectionCounts.overview ?? 0),
              sessions: Number(parsed.sectionCounts.sessions ?? 0),
              requests: Number(parsed.sectionCounts.requests ?? 0),
              artifacts: Number(parsed.sectionCounts.artifacts ?? 0),
              audit: Number(parsed.sectionCounts.audit ?? 0),
            }
          : createInitialSummary().sectionCounts,
      recentEvents: Array.isArray(parsed.recentEvents) ? parsed.recentEvents.map(cloneRecentEvent) : [],
      recentVehicleSearches: Array.isArray(parsed.recentVehicleSearches)
        ? parsed.recentVehicleSearches.map(cloneRecentVehicleSearch)
        : [],
      recentDriverSearches: Array.isArray(parsed.recentDriverSearches)
        ? parsed.recentDriverSearches.map(cloneRecentDriverSearch)
        : [],
      recentCombinedSearches: Array.isArray(parsed.recentCombinedSearches)
        ? parsed.recentCombinedSearches.map(cloneRecentCombinedSearch)
        : [],
      recentChatPrompts: Array.isArray(parsed.recentChatPrompts)
        ? parsed.recentChatPrompts.map(cloneRecentChatPrompt)
        : [],
      recentArtifacts: Array.isArray(parsed.recentArtifacts)
        ? parsed.recentArtifacts.map(cloneRecentArtifactAction)
        : [],
      recentIntents: Array.isArray(parsed.recentIntents)
        ? parsed.recentIntents.map((entry) => ({ ...entry }))
        : [],
      sessionState: parsed.sessionState
        ? {
            ...createInitialSummary().sessionState,
            ...cloneSessionState(parsed.sessionState),
          }
        : createInitialSummary().sessionState,
    };
  } catch {
    return null;
  }
}

function ensureStateLoaded() {
  if (isHydrated) return;

  if (canUseStorage()) {
    const parsed = parsePersistedStore(window.localStorage.getItem(STORAGE_KEY));
    if (parsed) {
      memoryStore.totalVisits = parsed.totalVisits;
      memoryStore.totalEvents = parsed.totalEvents;
      memoryStore.sectionCounts = { ...parsed.sectionCounts };
      memoryStore.recentEvents = parsed.recentEvents.map(cloneRecentEvent);
      memoryStore.recentVehicleSearches = parsed.recentVehicleSearches.map(cloneRecentVehicleSearch);
      memoryStore.recentDriverSearches = parsed.recentDriverSearches.map(cloneRecentDriverSearch);
      memoryStore.recentCombinedSearches = parsed.recentCombinedSearches.map(cloneRecentCombinedSearch);
      memoryStore.recentChatPrompts = parsed.recentChatPrompts.map(cloneRecentChatPrompt);
      memoryStore.recentArtifacts = parsed.recentArtifacts.map(cloneRecentArtifactAction);
      memoryStore.recentIntents = parsed.recentIntents.map((entry) => ({ ...entry }));
      memoryStore.sessionState = cloneSessionState(parsed.sessionState);
    }
  }

  isHydrated = true;
  cachedSnapshot = buildSnapshot();
}

function persistState() {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createPersistedStore()));
  } catch {
    // Nessun errore bloccante: resta memoria solo in RAM.
  }
}

function emitChange() {
  cachedSnapshot = buildSnapshot();
  persistState();
  listeners.forEach((listener) => listener());
}

function updateSessionState(patch: Partial<InternalAiSessionMemoryState>, updatedAt: string) {
  memoryStore.sessionState = {
    ...memoryStore.sessionState,
    ...patch,
    updatedAt,
  };
}

function pushRecentEvent(event: InternalAiTrackingEvent) {
  memoryStore.totalEvents += 1;
  memoryStore.recentEvents = [event, ...memoryStore.recentEvents].slice(0, MAX_RECENT_EVENTS);
}

function upsertVehicleSearch(search: InternalAiRecentVehicleSearch) {
  memoryStore.recentVehicleSearches = [
    search,
    ...memoryStore.recentVehicleSearches.filter((entry) => entry.targa !== search.targa),
  ].slice(0, MAX_RECENT_ITEMS);
}

function upsertDriverSearch(search: InternalAiRecentDriverSearch) {
  memoryStore.recentDriverSearches = [
    search,
    ...memoryStore.recentDriverSearches.filter((entry) => entry.driverId !== search.driverId),
  ].slice(0, MAX_RECENT_ITEMS);
}

function upsertCombinedSearch(search: InternalAiRecentCombinedSearch) {
  memoryStore.recentCombinedSearches = [
    search,
    ...memoryStore.recentCombinedSearches.filter(
      (entry) => !(entry.mezzoTarga === search.mezzoTarga && entry.driverId === search.driverId),
    ),
  ].slice(0, MAX_RECENT_ITEMS);
}

function upsertChatPrompt(prompt: InternalAiRecentChatPrompt) {
  memoryStore.recentChatPrompts = [
    prompt,
    ...memoryStore.recentChatPrompts.filter((entry) => entry.prompt !== prompt.prompt),
  ].slice(0, MAX_RECENT_ITEMS);
}

function upsertArtifactAction(action: InternalAiRecentArtifactAction) {
  memoryStore.recentArtifacts = [
    action,
    ...memoryStore.recentArtifacts.filter((entry) => entry.artifactId !== action.artifactId),
  ].slice(0, MAX_RECENT_ITEMS);
}

function bumpIntentUsage(intent: InternalAiChatIntent, updatedAt: string) {
  const existing = memoryStore.recentIntents.find((entry) => entry.intent === intent);
  if (existing) {
    existing.count += 1;
    existing.updatedAt = updatedAt;
  } else {
    memoryStore.recentIntents = [
      { intent, count: 1, updatedAt },
      ...memoryStore.recentIntents,
    ];
  }

  memoryStore.recentIntents = [...memoryStore.recentIntents]
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return right.updatedAt.localeCompare(left.updatedAt);
    })
    .slice(0, MAX_RECENT_ITEMS);
}

export function trackInternalAiScreenVisit(sectionId: NextInternalAiSectionId, path: string) {
  ensureStateLoaded();

  const now = Date.now();
  const eventKey = `${sectionId}:${path}`;

  if (lastEventKey === eventKey && now - lastEventAt < 1200) {
    return;
  }

  lastEventKey = eventKey;
  lastEventAt = now;

  const nowIso = new Date(now).toISOString();
  pushRecentEvent({
    id: `visit-${sectionId}-${now.toString(36)}`,
    ts: nowIso,
    kind: "screen_visit",
    sectionId,
    path,
    label: `Apertura sezione ${sectionId}`,
    targa: null,
    artifactId: null,
    intent: null,
  });

  memoryStore.totalVisits += 1;
  memoryStore.sectionCounts[sectionId] += 1;
  updateSessionState(
    {
      lastSectionId: sectionId,
      lastPath: path,
    },
    nowIso,
  );
  emitChange();
}

export function trackInternalAiVehicleSelection(args: {
  targa: string;
  sectionId: NextInternalAiSectionId;
  path: string;
}) {
  ensureStateLoaded();

  const nowIso = new Date().toISOString();
  pushRecentEvent({
    id: `vehicle-selected-${args.targa}-${Date.now().toString(36)}`,
    ts: nowIso,
    kind: "vehicle_selected",
    sectionId: args.sectionId,
    path: args.path,
    label: `Selezionata targa ${args.targa}`,
    targa: args.targa,
    artifactId: null,
    intent: null,
  });
  upsertVehicleSearch({
    targa: args.targa,
    source: "selezione_guidata",
    result: "selected",
    periodLabel: memoryStore.sessionState.lastPeriodLabel,
    updatedAt: nowIso,
  });
  updateSessionState(
    {
      lastSectionId: args.sectionId,
      lastPath: args.path,
      lastTarga: args.targa,
      lastDriverId: memoryStore.sessionState.lastDriverId,
      lastDriverName: memoryStore.sessionState.lastDriverName,
    },
    nowIso,
  );
  emitChange();
}

export function trackInternalAiDriverSelection(args: {
  driverId: string;
  nomeCompleto: string;
  badge: string | null;
  sectionId: NextInternalAiSectionId;
  path: string;
}) {
  ensureStateLoaded();

  const nowIso = new Date().toISOString();
  pushRecentEvent({
    id: `driver-selected-${args.driverId}-${Date.now().toString(36)}`,
    ts: nowIso,
    kind: "driver_selected",
    sectionId: args.sectionId,
    path: args.path,
    label: `Selezionato autista ${args.nomeCompleto}`,
    targa: null,
    artifactId: null,
    intent: null,
  });
  upsertDriverSearch({
    driverId: args.driverId,
    nomeCompleto: args.nomeCompleto,
    badge: args.badge,
    source: "selezione_guidata",
    result: "selected",
    periodLabel: memoryStore.sessionState.lastPeriodLabel,
    updatedAt: nowIso,
  });
  updateSessionState(
    {
      lastSectionId: args.sectionId,
      lastPath: args.path,
      lastDriverId: args.driverId,
      lastDriverName: args.nomeCompleto,
    },
    nowIso,
  );
  emitChange();
}

export function trackInternalAiVehicleSearch(args: {
  targa: string;
  source: InternalAiRecentVehicleSearch["source"];
  result: InternalAiRecentVehicleSearch["result"];
  periodLabel?: string | null;
  sectionId: NextInternalAiSectionId;
  path: string;
}) {
  ensureStateLoaded();

  const nowIso = new Date().toISOString();
  pushRecentEvent({
    id: `report-${args.result}-${args.targa}-${Date.now().toString(36)}`,
    ts: nowIso,
    kind: "report_preview",
    sectionId: args.sectionId,
    path: args.path,
    label: `Preview targa ${args.targa} (${args.result})`,
    targa: args.targa,
    artifactId: null,
    intent: "report_targa",
  });
  upsertVehicleSearch({
    targa: args.targa,
    source: args.source,
    result: args.result,
    periodLabel: args.periodLabel ?? null,
    updatedAt: nowIso,
  });
  bumpIntentUsage("report_targa", nowIso);
  updateSessionState(
    {
      lastSectionId: args.sectionId,
      lastPath: args.path,
      lastTarga: args.targa,
      lastPeriodLabel: args.periodLabel ?? memoryStore.sessionState.lastPeriodLabel,
      lastIntent: "report_targa",
    },
    nowIso,
  );
  emitChange();
}

export function trackInternalAiDriverSearch(args: {
  driverId: string;
  nomeCompleto: string;
  badge: string | null;
  source: InternalAiRecentDriverSearch["source"];
  result: InternalAiRecentDriverSearch["result"];
  periodLabel?: string | null;
  sectionId: NextInternalAiSectionId;
  path: string;
}) {
  ensureStateLoaded();

  const nowIso = new Date().toISOString();
  pushRecentEvent({
    id: `driver-report-${args.result}-${args.driverId}-${Date.now().toString(36)}`,
    ts: nowIso,
    kind: "driver_report_preview",
    sectionId: args.sectionId,
    path: args.path,
    label: `Preview autista ${args.nomeCompleto} (${args.result})`,
    targa: null,
    artifactId: null,
    intent: "report_autista",
  });
  upsertDriverSearch({
    driverId: args.driverId,
    nomeCompleto: args.nomeCompleto,
    badge: args.badge,
    source: args.source,
    result: args.result,
    periodLabel: args.periodLabel ?? null,
    updatedAt: nowIso,
  });
  bumpIntentUsage("report_autista", nowIso);
  updateSessionState(
    {
      lastSectionId: args.sectionId,
      lastPath: args.path,
      lastDriverId: args.driverId,
      lastDriverName: args.nomeCompleto,
      lastPeriodLabel: args.periodLabel ?? memoryStore.sessionState.lastPeriodLabel,
      lastIntent: "report_autista",
    },
    nowIso,
  );
  emitChange();
}

export function trackInternalAiCombinedSearch(args: {
  mezzoTarga: string;
  driverId: string;
  nomeCompleto: string;
  badge: string | null;
  source: InternalAiRecentCombinedSearch["source"];
  result: InternalAiRecentCombinedSearch["result"];
  periodLabel?: string | null;
  sectionId: NextInternalAiSectionId;
  path: string;
}) {
  ensureStateLoaded();

  const nowIso = new Date().toISOString();
  pushRecentEvent({
    id: `combined-report-${args.result}-${args.mezzoTarga}-${args.driverId}-${Date.now().toString(36)}`,
    ts: nowIso,
    kind: "combined_report_preview",
    sectionId: args.sectionId,
    path: args.path,
    label: `Preview combinata ${args.mezzoTarga} + ${args.nomeCompleto} (${args.result})`,
    targa: args.mezzoTarga,
    artifactId: null,
    intent: "report_combinato",
  });
  upsertCombinedSearch({
    mezzoTarga: args.mezzoTarga,
    driverId: args.driverId,
    nomeCompleto: args.nomeCompleto,
    badge: args.badge,
    source: args.source,
    result: args.result,
    periodLabel: args.periodLabel ?? null,
    updatedAt: nowIso,
  });
  bumpIntentUsage("report_combinato", nowIso);
  updateSessionState(
    {
      lastSectionId: args.sectionId,
      lastPath: args.path,
      lastTarga: args.mezzoTarga,
      lastDriverId: args.driverId,
      lastDriverName: args.nomeCompleto,
      lastPeriodLabel: args.periodLabel ?? memoryStore.sessionState.lastPeriodLabel,
      lastIntent: "report_combinato",
    },
    nowIso,
  );
  emitChange();
}

export function trackInternalAiChatPrompt(args: {
  prompt: string;
  intent: InternalAiChatIntent;
  status: InternalAiChatExecutionStatus;
  sectionId: NextInternalAiSectionId;
  path: string;
}) {
  ensureStateLoaded();

  const nowIso = new Date().toISOString();
  pushRecentEvent({
    id: `chat-${Date.now().toString(36)}`,
    ts: nowIso,
    kind: "chat_prompt",
    sectionId: args.sectionId,
    path: args.path,
    label: `Prompt chat (${args.intent})`,
    targa: null,
    artifactId: null,
    intent: args.intent,
  });
  upsertChatPrompt({
    prompt: args.prompt,
    intent: args.intent,
    status: args.status,
    updatedAt: nowIso,
  });
  bumpIntentUsage(args.intent, nowIso);
  updateSessionState(
    {
      lastSectionId: args.sectionId,
      lastPath: args.path,
      lastPrompt: args.prompt,
      lastIntent: args.intent,
    },
    nowIso,
  );
  emitChange();
}

export function trackInternalAiArtifactAction(args: {
  artifactId: string;
  title: string;
  targetType: InternalAiRecentArtifactAction["targetType"];
  targetLabel: string | null;
  mezzoTarga: string | null;
  autistaNome?: string | null;
  primaryFamily?: InternalAiArtifactFamily | null;
  artifactStatus?: InternalAiArtifactStatus | null;
  periodLabel?: string | null;
  action: InternalAiRecentArtifactAction["action"];
  sectionId: NextInternalAiSectionId;
  path: string;
}) {
  ensureStateLoaded();

  const nowIso = new Date().toISOString();
  const eventKind =
    args.action === "saved"
      ? "artifact_saved"
      : args.action === "opened"
        ? "artifact_opened"
        : "artifact_archived";

  pushRecentEvent({
    id: `artifact-${args.action}-${args.artifactId}-${Date.now().toString(36)}`,
    ts: nowIso,
    kind: eventKind,
    sectionId: args.sectionId,
    path: args.path,
    label: `Artifact ${args.action}: ${args.title}`,
    targa: args.mezzoTarga,
    artifactId: args.artifactId,
    intent: null,
  });
  upsertArtifactAction({
    artifactId: args.artifactId,
    title: args.title,
    targetType: args.targetType,
    targetLabel: args.targetLabel,
    mezzoTarga: args.mezzoTarga,
    autistaNome: args.autistaNome ?? null,
    primaryFamily: args.primaryFamily ?? null,
    artifactStatus: args.artifactStatus ?? null,
    periodLabel: args.periodLabel ?? null,
    action: args.action,
    updatedAt: nowIso,
  });
  updateSessionState(
    {
      lastSectionId: args.sectionId,
      lastPath: args.path,
      lastArtifactId: args.artifactId,
      lastTarga: args.mezzoTarga ?? memoryStore.sessionState.lastTarga,
      lastDriverName:
        args.targetType === "autista"
          ? args.targetLabel ?? memoryStore.sessionState.lastDriverName
          : memoryStore.sessionState.lastDriverName,
      lastPeriodLabel: args.periodLabel ?? memoryStore.sessionState.lastPeriodLabel,
    },
    nowIso,
  );
  emitChange();
}

export function rememberInternalAiArtifactArchiveState(args: {
  query: string;
  reportType: InternalAiReportType | "tutti";
  status: InternalAiArtifactStatus | "tutti";
  family: InternalAiArtifactFamily | "tutte";
  targa: string;
  autista: string;
  period: string;
}) {
  ensureStateLoaded();

  const nowIso = new Date().toISOString();
  updateSessionState(
    {
      lastArchiveQuery: args.query || null,
      lastArchiveReportType:
        args.reportType === "tutti" ||
        args.reportType === "targa" ||
        args.reportType === "autista" ||
        args.reportType === "combinato"
          ? args.reportType
          : "tutti",
      lastArchiveStatus: args.status,
      lastArchiveFamily: args.family,
      lastArchiveTarga: args.targa || null,
      lastArchiveAutista: args.autista || null,
      lastArchivePeriod: args.period || null,
    },
    nowIso,
  );
  emitChange();
}

export function readInternalAiTrackingSummary(): InternalAiTrackingSummary {
  ensureStateLoaded();
  return cachedSnapshot;
}

export function subscribeInternalAiTracking(listener: () => void) {
  ensureStateLoaded();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
