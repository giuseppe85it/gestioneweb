type NextLegacyStorageOverrides = Record<string, unknown>;

type NextLegacyStorageOverlayEntry = {
  id: number;
  overrides: NextLegacyStorageOverrides;
};

let nextLegacyStorageOverlayId = 0;
const nextLegacyStorageOverlayStack: NextLegacyStorageOverlayEntry[] = [];

function cloneOverlayValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function pushNextLegacyStorageOverrides(overrides: NextLegacyStorageOverrides) {
  const entry: NextLegacyStorageOverlayEntry = {
    id: ++nextLegacyStorageOverlayId,
    overrides,
  };

  nextLegacyStorageOverlayStack.push(entry);

  return () => {
    const index = nextLegacyStorageOverlayStack.findIndex((item) => item.id === entry.id);
    if (index >= 0) {
      nextLegacyStorageOverlayStack.splice(index, 1);
    }
  };
}

export function readNextLegacyStorageOverride(key: string) {
  for (let index = nextLegacyStorageOverlayStack.length - 1; index >= 0; index -= 1) {
    const entry = nextLegacyStorageOverlayStack[index];
    if (Object.prototype.hasOwnProperty.call(entry.overrides, key)) {
      return cloneOverlayValue(entry.overrides[key]);
    }
  }

  return undefined;
}
