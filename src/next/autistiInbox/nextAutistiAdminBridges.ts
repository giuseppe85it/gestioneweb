import { readNextUnifiedStorageDocument } from "../domain/nextUnifiedReadRegistryDomain";

type CloneDocValue = Record<string, unknown>;

type LocalDocReference = {
  path: string;
  id: string;
  collectionName: string;
};

type LocalStorageReference = {
  fullPath: string;
};

const DOCS_STORAGE_KEY = "@next_clone_autisti:admin-bridge-docs";
const DELETED_STORAGE_PATHS_KEY = "@next_clone_autisti:admin-bridge-deleted-storage";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function readJsonMap<T>(key: string): Record<string, T> {
  if (!canUseLocalStorage()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, T>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeJsonMap<T>(key: string, value: Record<string, T>) {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function readDeletedPaths() {
  return readJsonMap<boolean>(DELETED_STORAGE_PATHS_KEY);
}

export const db = { kind: "next-autisti-admin-clone-db" } as const;
export const storage = { kind: "next-autisti-admin-clone-storage" } as const;

export function doc(_db: unknown, collectionName: string, id: string): LocalDocReference {
  return {
    path: `${collectionName}/${id}`,
    id,
    collectionName,
  };
}

export function ref(_storage: unknown, fullPath: string): LocalStorageReference {
  return { fullPath };
}

async function readBaseDoc(reference: LocalDocReference): Promise<CloneDocValue | null> {
  if (reference.collectionName !== "storage") {
    return null;
  }

  const result = await readNextUnifiedStorageDocument({
    key: reference.id,
    preferredArrayKeys: ["items"],
  });

  if (result.status !== "ready" || !result.rawDocument || typeof result.rawDocument !== "object") {
    return null;
  }

  return cloneValue(result.rawDocument as CloneDocValue);
}

export async function getDoc(reference: LocalDocReference) {
  const overrides = readJsonMap<CloneDocValue>(DOCS_STORAGE_KEY);
  const override = overrides[reference.path];
  const baseData = await readBaseDoc(reference);
  const merged =
    override && baseData
      ? { ...baseData, ...cloneValue(override) }
      : override
        ? cloneValue(override)
        : baseData;

  return {
    exists: () => Boolean(merged),
    data: () => cloneValue(merged ?? {}),
    id: reference.id,
    ref: reference,
  };
}

export async function setDoc(
  reference: LocalDocReference,
  value: unknown,
  options?: { merge?: boolean },
) {
  const docs = readJsonMap<CloneDocValue>(DOCS_STORAGE_KEY);
  const base = options?.merge ? docs[reference.path] ?? (await readBaseDoc(reference)) ?? {} : {};
  const nextValue =
    value && typeof value === "object" && !Array.isArray(value)
      ? (cloneValue(value) as CloneDocValue)
      : ({ value: cloneValue(value) } as CloneDocValue);

  docs[reference.path] = options?.merge ? { ...base, ...nextValue } : nextValue;
  writeJsonMap(DOCS_STORAGE_KEY, docs);
}

export async function deleteObject(reference: LocalStorageReference) {
  const deletedPaths = readDeletedPaths();
  if (reference.fullPath) {
    deletedPaths[reference.fullPath] = true;
    writeJsonMap(DELETED_STORAGE_PATHS_KEY, deletedPaths);
  }
}

export function isNextAutistiAdminStorageDeleted(path: string | null | undefined) {
  const normalized = String(path ?? "").trim();
  if (!normalized) {
    return false;
  }

  const deletedPaths = readDeletedPaths();
  return deletedPaths[normalized] === true;
}
