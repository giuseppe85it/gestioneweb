import { getItemSync as readLegacyStorageValue } from "../../utils/storageSync";
import { isNextAutistiClonePath } from "./nextAutistiCloneRuntime";
import { readNextAutistiLegacyStorageOverrides } from "../nextLegacyAutistiOverlay";

type SetItemSyncOptions = {
  allowRemovals?: boolean;
  removedIds?: string[];
};

const NEXT_AUTISTI_STORAGE_SYNC_PREFIX = "@next_clone_autisti:storage-sync:";
const NEXT_AUTISTI_MANAGED_KEYS = new Set([
  "@autisti_sessione_attive",
  "@storico_eventi_operativi",
  "@segnalazioni_autisti_tmp",
  "@controlli_mezzo_autisti",
  "@richieste_attrezzature_autisti_tmp",
  "@rifornimenti_autisti_tmp",
  "@cambi_gomme_autisti_tmp",
  "@gomme_eventi",
]);

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isNextAutistiOfficialAppRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  const pathname = String(window.location.pathname ?? "").trim();
  return (
    isNextAutistiClonePath(pathname) ||
    pathname === "/next/autisti-inbox" ||
    pathname.startsWith("/next/autisti-inbox/") ||
    pathname === "/next/autisti-admin" ||
    pathname.startsWith("/next/autisti-admin/")
  );
}

function cloneValue<T>(value: T): T {
  if (value === undefined) {
    return value;
  }

  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function getOverlayKey(key: string) {
  return `${NEXT_AUTISTI_STORAGE_SYNC_PREFIX}${encodeURIComponent(key)}`;
}

function parseOverlayValue<T>(raw: string | null): T | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function readNextAutistiStorageOverlay<T = unknown>(key: string): T | undefined {
  if (NEXT_AUTISTI_MANAGED_KEYS.has(key) && isNextAutistiOfficialAppRuntime()) {
    return undefined;
  }

  if (!canUseLocalStorage()) {
    return undefined;
  }

  const parsed = parseOverlayValue<T>(window.localStorage.getItem(getOverlayKey(key)));
  return parsed === undefined ? undefined : cloneValue(parsed);
}

async function readManagedDataset(key: string) {
  if (!NEXT_AUTISTI_MANAGED_KEYS.has(key) || isNextAutistiOfficialAppRuntime()) {
    return readLegacyStorageValue(key);
  }

  const overrides = await readNextAutistiLegacyStorageOverrides();
  if (Object.prototype.hasOwnProperty.call(overrides, key)) {
    return overrides[key];
  }

  return readLegacyStorageValue(key);
}

export async function getItemSync(key: string) {
  const overlay = readNextAutistiStorageOverlay(key);
  if (overlay !== undefined) {
    return overlay;
  }

  const baseValue = await readManagedDataset(key);
  return cloneValue(baseValue);
}

export async function setItemSync(
  key: string,
  value: unknown,
  _opts?: SetItemSyncOptions,
) {
  void _opts;
  void value;
  if (!canUseLocalStorage()) {
    return;
  }

  if (NEXT_AUTISTI_MANAGED_KEYS.has(key) && isNextAutistiOfficialAppRuntime()) {
    return;
  }

  window.localStorage.setItem(getOverlayKey(key), JSON.stringify(cloneValue(value)));
}

export async function removeItemSync(key: string) {
  if (!canUseLocalStorage()) {
    return;
  }

  if (NEXT_AUTISTI_MANAGED_KEYS.has(key) && isNextAutistiOfficialAppRuntime()) {
    return;
  }

  window.localStorage.removeItem(getOverlayKey(key));
}
