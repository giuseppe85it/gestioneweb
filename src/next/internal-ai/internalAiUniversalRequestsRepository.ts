import type {
  InternalAiUniversalDocumentInboxItem,
  InternalAiUniversalHandoffPayload,
  InternalAiUniversalHandoffConsumptionStatus,
  InternalAiUniversalRequestsRepositorySnapshot,
} from "./internalAiUniversalTypes";
import {
  applyInternalAiUniversalHandoffLifecycleUpdate,
  ensureInternalAiUniversalHandoffPayload,
  mergeInternalAiUniversalHandoffPayload,
} from "./internalAiUniversalHandoffLifecycle";

type InternalAiUniversalRequestsRepositoryState = {
  handoffs: InternalAiUniversalHandoffPayload[];
  inboxItems: InternalAiUniversalDocumentInboxItem[];
  updatedAt: string | null;
};

type InternalAiUniversalRequestsPersistedState = {
  version: 1;
  handoffs: InternalAiUniversalHandoffPayload[];
  inboxItems: InternalAiUniversalDocumentInboxItem[];
  updatedAt: string | null;
};

const STORAGE_KEY = "@next_internal_ai:universal_requests_v1";
const listeners = new Set<() => void>();

let state: InternalAiUniversalRequestsRepositoryState = {
  handoffs: [],
  inboxItems: [],
  updatedAt: null,
};
let hydrated = false;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function cloneState(
  input: InternalAiUniversalRequestsRepositoryState,
): InternalAiUniversalRequestsRepositoryState {
  return JSON.parse(JSON.stringify(input)) as InternalAiUniversalRequestsRepositoryState;
}

function parsePersistedState(raw: string | null): InternalAiUniversalRequestsRepositoryState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<InternalAiUniversalRequestsPersistedState> | null;
    if (!parsed || parsed.version !== 1) {
      return null;
    }

    return {
      handoffs: Array.isArray(parsed.handoffs)
        ? parsed.handoffs.map((entry) => ensureInternalAiUniversalHandoffPayload(entry))
        : [],
      inboxItems: Array.isArray(parsed.inboxItems) ? parsed.inboxItems : [],
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch {
    return null;
  }
}

function ensureHydrated() {
  if (hydrated) {
    return;
  }

  if (canUseStorage()) {
    const parsed = parsePersistedState(window.localStorage.getItem(STORAGE_KEY));
    if (parsed) {
      state = parsed;
    }
  }

  hydrated = true;
}

function persist() {
  if (!canUseStorage()) {
    return;
  }

  const payload: InternalAiUniversalRequestsPersistedState = {
    version: 1,
    handoffs: state.handoffs,
    inboxItems: state.inboxItems,
    updatedAt: state.updatedAt,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function mergeHandoffs(
  current: InternalAiUniversalHandoffPayload[],
  next: InternalAiUniversalHandoffPayload[],
): InternalAiUniversalHandoffPayload[] {
  const index = new Map(current.map((entry) => [entry.handoffId, entry]));
  next.forEach((entry) => {
    const normalized = ensureInternalAiUniversalHandoffPayload(entry);
    const currentEntry = index.get(entry.handoffId);
    index.set(
      entry.handoffId,
      currentEntry
        ? mergeInternalAiUniversalHandoffPayload(currentEntry, normalized)
        : normalized,
    );
  });

  return [...index.values()]
    .sort((left, right) => right.handoffId.localeCompare(left.handoffId))
    .slice(0, 40);
}

function mergeInboxItems(
  current: InternalAiUniversalDocumentInboxItem[],
  next: InternalAiUniversalDocumentInboxItem[],
): InternalAiUniversalDocumentInboxItem[] {
  const index = new Map(current.map((entry) => [entry.inboxId, entry]));
  next.forEach((entry) => {
    index.set(entry.inboxId, entry);
  });

  return [...index.values()]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 40);
}

export function readInternalAiUniversalRequestsRepositorySnapshot(): InternalAiUniversalRequestsRepositorySnapshot {
  ensureHydrated();

  return {
    mode: canUseStorage() ? "local_storage_isolated" : "memory_only",
    handoffs: cloneState(state).handoffs,
    inboxItems: cloneState(state).inboxItems,
    updatedAt: state.updatedAt,
  };
}

export function readInternalAiUniversalHandoffById(
  handoffId: string,
): InternalAiUniversalHandoffPayload | null {
  ensureHydrated();
  return state.handoffs.find((entry) => entry.handoffId === handoffId) ?? null;
}

export function subscribeInternalAiUniversalRequestsRepository(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function syncInternalAiUniversalRequestsRepository(args: {
  handoffs: InternalAiUniversalHandoffPayload[];
  inboxItems: InternalAiUniversalDocumentInboxItem[];
}) {
  ensureHydrated();
  state = {
    handoffs: mergeHandoffs(state.handoffs, args.handoffs),
    inboxItems: mergeInboxItems(state.inboxItems, args.inboxItems),
    updatedAt: new Date().toISOString(),
  };
  persist();
  notify();
}

export function updateInternalAiUniversalHandoffLifecycle(args: {
  handoffId: string;
  status: InternalAiUniversalHandoffConsumptionStatus;
  moduleId?: string | null;
  routePath?: string | null;
  note?: string | null;
}) {
  ensureHydrated();

  const nextHandoffs = state.handoffs.map((entry) => {
    if (entry.handoffId !== args.handoffId) {
      return entry;
    }

    return applyInternalAiUniversalHandoffLifecycleUpdate(entry, {
      status: args.status,
      moduleId: args.moduleId,
      routePath: args.routePath,
      note: args.note,
    });
  });

  const targetHandoff = nextHandoffs.find((entry) => entry.handoffId === args.handoffId) ?? null;
  if (!targetHandoff) {
    return;
  }

  const nextInboxItems = state.inboxItems.map((entry) => {
    if (entry.handoffPayload.handoffId !== args.handoffId) {
      return entry;
    }

    return {
      ...entry,
      handoffPayload: targetHandoff,
      updatedAt: new Date().toISOString(),
    };
  });

  state = {
    handoffs: nextHandoffs,
    inboxItems: nextInboxItems,
    updatedAt: new Date().toISOString(),
  };
  persist();
  notify();
}
