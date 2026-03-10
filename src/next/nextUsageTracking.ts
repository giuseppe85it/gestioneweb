export type NextUsageVisit = {
  ts: number;
  areaId: string;
  areaLabel: string;
  pathKey: string;
  pathLabel: string;
  pageLabel: string;
  actualPath: string;
  role: string;
};

type NextUsageStore = {
  version: 1;
  areaCounts: Record<string, number>;
  areaLabels: Record<string, string>;
  pathCounts: Record<string, number>;
  pathLabels: Record<string, string>;
  transitions: Record<string, number>;
  recentVisits: NextUsageVisit[];
  lastPathKey: string | null;
  lastTrackedAt: number | null;
};

export type NextUsageSummary = {
  totalVisits: number;
  trackedAreas: Array<{
    areaId: string;
    areaLabel: string;
    count: number;
  }>;
  trackedPaths: Array<{
    pathKey: string;
    pathLabel: string;
    count: number;
  }>;
  topTransitions: Array<{
    fromPathKey: string;
    fromPathLabel: string;
    toPathKey: string;
    toPathLabel: string;
    count: number;
  }>;
  recentVisits: NextUsageVisit[];
};

type TrackNextPageVisitArgs = {
  areaId: string;
  areaLabel: string;
  pathKey: string;
  pathLabel: string;
  pageLabel: string;
  actualPath: string;
  role: string;
};

const STORAGE_KEY = "gm_next_usage_v1";
const MAX_RECENT_VISITS = 40;
const DEDUP_WINDOW_MS = 1500;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function createEmptyStore(): NextUsageStore {
  return {
    version: 1,
    areaCounts: {},
    areaLabels: {},
    pathCounts: {},
    pathLabels: {},
    transitions: {},
    recentVisits: [],
    lastPathKey: null,
    lastTrackedAt: null,
  };
}

function parseStore(raw: string | null): NextUsageStore {
  if (!raw) return createEmptyStore();

  try {
    const parsed = JSON.parse(raw) as Partial<NextUsageStore> | null;
    if (!parsed || parsed.version !== 1) {
      return createEmptyStore();
    }

    return {
      version: 1,
      areaCounts: parsed.areaCounts ?? {},
      areaLabels: parsed.areaLabels ?? {},
      pathCounts: parsed.pathCounts ?? {},
      pathLabels: parsed.pathLabels ?? {},
      transitions: parsed.transitions ?? {},
      recentVisits: Array.isArray(parsed.recentVisits) ? parsed.recentVisits : [],
      lastPathKey: parsed.lastPathKey ?? null,
      lastTrackedAt: typeof parsed.lastTrackedAt === "number" ? parsed.lastTrackedAt : null,
    };
  } catch {
    return createEmptyStore();
  }
}

function readStore(): NextUsageStore {
  if (!canUseStorage()) return createEmptyStore();
  return parseStore(window.localStorage.getItem(STORAGE_KEY));
}

function writeStore(store: NextUsageStore): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function incrementCount(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

export function trackNextPageVisit(args: TrackNextPageVisitArgs): void {
  if (!canUseStorage()) return;

  const now = Date.now();
  const store = readStore();
  const mostRecentVisit = store.recentVisits[0] ?? null;

  if (
    mostRecentVisit &&
    mostRecentVisit.pathKey === args.pathKey &&
    now - mostRecentVisit.ts < DEDUP_WINDOW_MS
  ) {
    return;
  }

  incrementCount(store.areaCounts, args.areaId);
  incrementCount(store.pathCounts, args.pathKey);

  store.areaLabels[args.areaId] = args.areaLabel;
  store.pathLabels[args.pathKey] = args.pathLabel;

  if (store.lastPathKey && store.lastPathKey !== args.pathKey) {
    incrementCount(store.transitions, `${store.lastPathKey}>>>${args.pathKey}`);
  }

  store.recentVisits = [
    {
      ts: now,
      areaId: args.areaId,
      areaLabel: args.areaLabel,
      pathKey: args.pathKey,
      pathLabel: args.pathLabel,
      pageLabel: args.pageLabel,
      actualPath: args.actualPath,
      role: args.role,
    },
    ...store.recentVisits,
  ].slice(0, MAX_RECENT_VISITS);

  store.lastPathKey = args.pathKey;
  store.lastTrackedAt = now;
  writeStore(store);
}

function sortCountEntries<T extends { count: number }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return JSON.stringify(left).localeCompare(JSON.stringify(right), "it", {
      sensitivity: "base",
    });
  });
}

export function readNextUsageSummary(): NextUsageSummary {
  const store = readStore();

  const trackedAreas = sortCountEntries(
    Object.entries(store.areaCounts).map(([areaId, count]) => ({
      areaId,
      areaLabel: store.areaLabels[areaId] ?? areaId,
      count,
    }))
  );

  const trackedPaths = sortCountEntries(
    Object.entries(store.pathCounts).map(([pathKey, count]) => ({
      pathKey,
      pathLabel: store.pathLabels[pathKey] ?? pathKey,
      count,
    }))
  );

  const topTransitions = sortCountEntries(
    Object.entries(store.transitions).map(([compoundKey, count]) => {
      const [fromPathKey, toPathKey] = compoundKey.split(">>>");
      return {
        fromPathKey,
        fromPathLabel: store.pathLabels[fromPathKey] ?? fromPathKey,
        toPathKey,
        toPathLabel: store.pathLabels[toPathKey] ?? toPathKey,
        count,
      };
    })
  ).slice(0, 6);

  return {
    totalVisits: Object.values(store.pathCounts).reduce((total, count) => total + count, 0),
    trackedAreas,
    trackedPaths,
    topTransitions,
    recentVisits: store.recentVisits.slice(0, 8),
  };
}
