const CLONE_PREFIX = "/next";
const LAVORI_ALLOWED_WRITE_PATHS = [
  "/next/lavori-da-eseguire",
  "/next/lavori-in-attesa",
  "/next/lavori-eseguiti",
  "/next/dettagliolavori",
] as const;
const SAFE_FETCH_METHODS = new Set(["GET", "HEAD"]);
const MUTATING_FETCH_URL_PATTERNS = [
  "cloudfunctions.net/analisi_economica_mezzo",
  "cloudfunctions.net/stamp_pdf",
  "cloudfunctions.net/estrazionedocumenti",
  "cloudfunctions.net/ia_cisterna_extract",
  "cloudfunctions.net/estrazioneschedacisterna",
  "cloudfunctions.net/cisterna_documenti_extract",
  "estrazione-libretto-",
] as const;
const SAME_ORIGIN_MUTATING_API_PREFIXES = ["/api/"] as const;

declare global {
  interface Window {
    __cloneWriteBarrierFetchInstalled__?: boolean;
    __cloneWriteBarrierOriginalFetch__?: typeof window.fetch;
  }
}

export class CloneWriteBlockedError extends Error {
  readonly code = "CLONE_WRITE_BLOCKED";
  readonly kind: string;
  readonly meta?: unknown;

  constructor(kind: string, meta?: unknown) {
    super(`[CLONE_NO_WRITE] Tentativo bloccato nel clone: ${kind}`);
    this.name = "CloneWriteBlockedError";
    this.kind = kind;
    this.meta = meta;
  }
}

function isDevRuntime(): boolean {
  return typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);
}

function logBlockedWrite(error: CloneWriteBlockedError) {
  if (typeof console === "undefined") return;

  if (isDevRuntime()) {
    console.warn(error.message, error.meta ?? {});
    return;
  }

  console.warn(error.message);
}

function normalizePathname(pathname: string | undefined): string {
  const value = String(pathname ?? "").trim();
  return value.startsWith("/") ? value : `/${value}`;
}

function getCurrentPathname(): string {
  if (typeof window === "undefined") return "";
  return normalizePathname(window.location.pathname);
}

function isAllowedLavoriCloneWritePath(pathname: string): boolean {
  return (
    LAVORI_ALLOWED_WRITE_PATHS.some((entry) => pathname === entry) ||
    pathname.startsWith("/next/dettagliolavori/")
  );
}

function readMetaKey(meta: unknown): string {
  if (typeof meta !== "object" || meta === null || !("key" in meta)) {
    return "";
  }

  const value = (meta as { key?: unknown }).key;
  return typeof value === "string" ? value.trim() : "";
}

function isAllowedCloneWriteException(kind: string, meta: unknown): boolean {
  const pathname = getCurrentPathname();
  if (!isAllowedLavoriCloneWritePath(pathname)) {
    return false;
  }

  return kind === "storageSync.setItemSync" && readMetaKey(meta) === "@lavori";
}

export function isCloneRuntime(): boolean {
  const pathname = getCurrentPathname();
  return pathname === CLONE_PREFIX || pathname.startsWith(`${CLONE_PREFIX}/`);
}

export function assertCloneWriteAllowed(kind: string, meta?: unknown) {
  if (!isCloneRuntime()) return;
  if (isAllowedCloneWriteException(kind, meta)) return;

  const error = new CloneWriteBlockedError(kind, meta);
  logBlockedWrite(error);
  throw error;
}

function normalizeFetchMethod(
  input: RequestInfo | URL,
  init?: RequestInit
): string {
  const fromInit = String(init?.method ?? "").trim();
  if (fromInit) return fromInit.toUpperCase();

  if (typeof Request !== "undefined" && input instanceof Request) {
    return String(input.method || "GET").toUpperCase();
  }

  return "GET";
}

function resolveFetchUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (typeof Request !== "undefined" && input instanceof Request) return input.url;
  return String(input);
}

function normalizeFetchUrl(url: string): string {
  if (typeof window === "undefined") return url;

  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

function isSameOriginMutatingApiUrl(parsedUrl: URL): boolean {
  if (typeof window === "undefined") return false;
  if (parsedUrl.origin !== window.location.origin) return false;

  const pathname = parsedUrl.pathname.toLowerCase();
  return SAME_ORIGIN_MUTATING_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}

function matchesKnownMutatingFetchPattern(normalizedUrl: string): boolean {
  const url = normalizedUrl.toLowerCase();
  return MUTATING_FETCH_URL_PATTERNS.some((pattern) => url.includes(pattern));
}

function shouldBlockFetchInClone(method: string, url: string): boolean {
  if (SAFE_FETCH_METHODS.has(method)) return false;

  try {
    const parsedUrl =
      typeof window !== "undefined"
        ? new URL(url, window.location.origin)
        : new URL(url);

    if (isSameOriginMutatingApiUrl(parsedUrl)) return true;

    const normalizedIdentifier = `${parsedUrl.origin}${parsedUrl.pathname}`;
    return matchesKnownMutatingFetchPattern(normalizedIdentifier);
  } catch {
    return matchesKnownMutatingFetchPattern(url);
  }
}

export function installCloneFetchBarrier() {
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;
  if (window.__cloneWriteBarrierFetchInstalled__) return;

  const originalFetch = window.fetch.bind(window);
  window.__cloneWriteBarrierOriginalFetch__ = originalFetch;

  const barrierFetch: typeof window.fetch = async (input, init) => {
    const method = normalizeFetchMethod(input, init);
    const url = normalizeFetchUrl(resolveFetchUrl(input));

    if (isCloneRuntime() && shouldBlockFetchInClone(method, url)) {
      assertCloneWriteAllowed("fetch.runtime", { method, url });
    }

    return originalFetch(input, init);
  };

  window.fetch = barrierFetch;
  window.__cloneWriteBarrierFetchInstalled__ = true;
}
