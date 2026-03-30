type RawRecord = Record<string, unknown>;

const NEXT_HOME_ALERTS_STATE_KEY = "@next_clone_home:alerts_state";
const NEXT_HOME_MEZZI_PATCHES_KEY = "@next_clone_home:mezzi_patches";
const NEXT_HOME_EVENTI_APPEND_KEY = "@next_clone_home:eventi_append";

function readLocalValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalValue(key: string, value: unknown) {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function normalizeIdKey(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeTargaKey(value: unknown): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function buildMezzoPatchKey(match: { id?: unknown; targa?: unknown }): string {
  const targaKey = normalizeTargaKey(match.targa);
  if (targaKey) return `targa:${targaKey}`;

  const idKey = normalizeIdKey(match.id);
  if (idKey) return `id:${idKey}`;

  return "";
}

function unwrapArrayValue(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];

  const record = raw as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.value)) return record.value;

  if (record.value && typeof record.value === "object") {
    const nested = record.value as Record<string, unknown>;
    if (Array.isArray(nested.items)) return nested.items;
  }

  return [];
}

function rebuildArrayShape(raw: unknown, items: unknown[]): unknown {
  if (Array.isArray(raw)) {
    return items;
  }

  if (!raw || typeof raw !== "object") {
    return items;
  }

  const record = raw as Record<string, unknown>;
  if (Array.isArray(record.items)) {
    return { ...record, items };
  }

  if (Array.isArray(record.value)) {
    return { ...record, value: items };
  }

  if (record.value && typeof record.value === "object") {
    const nested = record.value as Record<string, unknown>;
    if (Array.isArray(nested.items)) {
      return {
        ...record,
        value: {
          ...nested,
          items,
        },
      };
    }
  }

  return items;
}

function dedupeById(records: RawRecord[]): RawRecord[] {
  const seen = new Set<string>();
  const next: RawRecord[] = [];

  for (const record of records) {
    const id = normalizeIdKey(record.id);
    if (id && seen.has(id)) continue;
    if (id) seen.add(id);
    next.push(record);
  }

  return next;
}

export function readNextHomeCloneAlertsState(): unknown | null {
  return readLocalValue<unknown | null>(NEXT_HOME_ALERTS_STATE_KEY, null);
}

export function writeNextHomeCloneAlertsState(value: unknown) {
  writeLocalValue(NEXT_HOME_ALERTS_STATE_KEY, value);
}

export function upsertNextHomeCloneMezzoPatch(
  match: { id?: unknown; targa?: unknown },
  patch: RawRecord,
) {
  const patchKey = buildMezzoPatchKey(match);
  if (!patchKey) return;

  const current = readLocalValue<Record<string, RawRecord>>(NEXT_HOME_MEZZI_PATCHES_KEY, {});
  const previous = current[patchKey] ?? {};
  writeLocalValue(NEXT_HOME_MEZZI_PATCHES_KEY, {
    ...current,
    [patchKey]: {
      ...previous,
      ...patch,
    },
  });
}

export function applyNextHomeCloneMezziPatches(raw: unknown): unknown {
  const patches = readLocalValue<Record<string, RawRecord>>(NEXT_HOME_MEZZI_PATCHES_KEY, {});
  if (!Object.keys(patches).length) {
    return raw;
  }

  const items = unwrapArrayValue(raw);
  const nextItems = items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return item;
    }

    const record = item as RawRecord;
    const byTarga = buildMezzoPatchKey({ targa: record.targa });
    const byId = buildMezzoPatchKey({ id: record.id });
    const patch = patches[byTarga] ?? patches[byId];

    if (!patch) {
      return item;
    }

    return {
      ...record,
      ...patch,
    };
  });

  return rebuildArrayShape(raw, nextItems);
}

export function appendNextHomeCloneEvento(record: RawRecord) {
  const current = readLocalValue<RawRecord[]>(NEXT_HOME_EVENTI_APPEND_KEY, []);
  const next = dedupeById([...current, record]);
  writeLocalValue(NEXT_HOME_EVENTI_APPEND_KEY, next);
}

export function applyNextHomeCloneEventiOverlay(raw: unknown): unknown {
  const appended = readLocalValue<RawRecord[]>(NEXT_HOME_EVENTI_APPEND_KEY, []);
  if (!appended.length) {
    return raw;
  }

  const currentItems = unwrapArrayValue(raw).filter(
    (item): item is RawRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );

  return rebuildArrayShape(raw, dedupeById([...currentItems, ...appended]));
}
