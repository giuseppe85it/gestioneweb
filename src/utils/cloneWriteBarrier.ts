const CLONE_PREFIX = "/next";
const LAVORI_ALLOWED_WRITE_PATHS = [
  "/next/lavori-da-eseguire",
  "/next/lavori-in-attesa",
  "/next/lavori-eseguiti",
  "/next/dettagliolavori",
] as const;
const MAGAZZINO_ALLOWED_WRITE_PATHS = ["/next/magazzino"] as const;
const MAGAZZINO_ALLOWED_STORAGE_KEYS = new Set([
  "@inventario",
  "@materialiconsegnati",
  "@cisterne_adblue",
]);
const MAGAZZINO_ALLOWED_STORAGE_PATH_PREFIXES = ["inventario/"] as const;
const MANUTENZIONI_ALLOWED_WRITE_PATHS = ["/next/manutenzioni"] as const;
const MANUTENZIONI_ALLOWED_STORAGE_KEYS = new Set([
  "@manutenzioni",
  "@inventario",
  "@materialiconsegnati",
  "@mezzi_foto_viste",
  "@mezzi_hotspot_mapping",
]);
const MANUTENZIONI_ALLOWED_STORAGE_PATH_PREFIXES = ["mezzi_foto/"] as const;
const MATERIALI_DA_ORDINARE_ALLOWED_WRITE_PATHS = ["/next/materiali-da-ordinare"] as const;
const MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS = new Set([
  "storage/@preventivi",
  "storage/@listino_prezzi",
]);
const MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES = ["preventivi/manuali/"] as const;
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
const EUROMECC_ALLOWED_WRITE_PATHS = ["/next/euromecc"] as const;
const EUROMECC_ALLOWED_FETCH_API_PATHS = new Set(["/api/pdf-ai-enhance"]);
const DOSSIER_ALLOWED_WRITE_PATH_PREFIXES = [
  "/next/dossiermezzi/",
  "/next/dossier/",
  "/next/mezzi-dossier/",
] as const;
const DOSSIER_ALLOWED_FIRESTORE_DELETE_DOC_PATH_PREFIXES = [
  "@documenti_mezzi/",
  "@documenti_magazzino/",
  "@documenti_generici/",
] as const;
const DOSSIER_ALLOWED_STORAGE_KEYS = new Set(["@costiMezzo"]);
const IA_DOCUMENTI_ALLOWED_WRITE_PATH = "/next/ia/documenti";
const IA_DOCUMENTI_ALLOWED_FIRESTORE_UPDATE_DOC_PATH_PREFIXES = [
  "@documenti_mezzi/",
  "@documenti_magazzino/",
  "@documenti_generici/",
] as const;
const IA_DOCUMENTI_ALLOWED_FIRESTORE_DELETE_DOC_PATH_PREFIXES = [
  "@documenti_mezzi/",
] as const;
const IA_DOCUMENTI_ALLOWED_STORAGE_KEYS = new Set(["@costiMezzo"]);
const INTERNAL_AI_MAGAZZINO_INLINE_SCOPE = "internal_ai_magazzino_inline_magazzino";
const INTERNAL_AI_DOCUMENTI_ALLOWED_PATHS = ["/next/ia/interna", "/next/ia/archivista"] as const;
const INTERNAL_AI_DOCUMENTI_ANALYZE_ENDPOINT =
  "https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti";
const IA_LIBRETTO_ALLOWED_WRITE_PATH = "/next/ia/libretto";
const IA_LIBRETTO_ALLOWED_FETCH_PATHS = ["/next/ia/libretto", "/next/ia/archivista"] as const;
const IA_LIBRETTO_ANALYZE_ENDPOINT =
  "https://estrazione-libretto-7bo6jdsreq-uc.a.run.app";
const IA_LIBRETTO_ALLOWED_STORAGE_KEYS = new Set(["@mezzi_aziendali"]);
const IA_LIBRETTO_ALLOWED_STORAGE_PATH_PREFIXES = ["mezzi_aziendali/"] as const;
const ARCHIVISTA_ALLOWED_FIRESTORE_COLLECTIONS = new Set([
  "@documenti_magazzino",
  "@documenti_mezzi",
]);
const ARCHIVISTA_ALLOWED_FIRESTORE_DOC_PATHS = new Set(["storage/@preventivi"]);
const ARCHIVISTA_ALLOWED_STORAGE_KEYS = new Set([
  "@mezzi_aziendali",
  "@manutenzioni",
  "@inventario",
  "@materialiconsegnati",
]);
const ARCHIVISTA_ALLOWED_STORAGE_PATH_PREFIXES = ["documenti_pdf/", "preventivi/"] as const;
const ARCHIVISTA_ALLOWED_IMAGE_STORAGE_PATH_PREFIXES = ["mezzi/"] as const;
const cloneWriteScopedAllowances = new Map<string, number>();

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

function isAllowedManutenzioniCloneWritePath(pathname: string): boolean {
  return MANUTENZIONI_ALLOWED_WRITE_PATHS.some((entry) => pathname === entry);
}

function isAllowedMagazzinoCloneWritePath(pathname: string): boolean {
  return MAGAZZINO_ALLOWED_WRITE_PATHS.some((entry) => pathname === entry);
}

function isAllowedMaterialiDaOrdinareCloneWritePath(pathname: string): boolean {
  return MATERIALI_DA_ORDINARE_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function readMetaKey(meta: unknown): string {
  if (typeof meta !== "object" || meta === null || !("key" in meta)) {
    return "";
  }

  const value = (meta as { key?: unknown }).key;
  return typeof value === "string" ? value.trim() : "";
}

function readMetaPath(meta: unknown): string {
  if (typeof meta !== "object" || meta === null || !("path" in meta)) {
    return "";
  }

  const value = (meta as { path?: unknown }).path;
  return typeof value === "string" ? value.trim() : "";
}

function readMetaUrl(meta: unknown): string {
  if (typeof meta !== "object" || meta === null || !("url" in meta)) {
    return "";
  }

  const value = (meta as { url?: unknown }).url;
  return typeof value === "string" ? value.trim() : "";
}

function readMetaMethod(meta: unknown): string {
  if (typeof meta !== "object" || meta === null || !("method" in meta)) {
    return "";
  }

  const value = (meta as { method?: unknown }).method;
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function isAllowedInternalAiDocumentAnalyzeFetch(
  pathname: string,
  meta: unknown,
): boolean {
  if (!INTERNAL_AI_DOCUMENTI_ALLOWED_PATHS.some((entry) => pathname === entry)) return false;
  if (readMetaMethod(meta) !== "POST") return false;

  try {
    const parsed = new URL(readMetaUrl(meta), window.location.origin);
    return `${parsed.origin}${parsed.pathname}` === INTERNAL_AI_DOCUMENTI_ANALYZE_ENDPOINT;
  } catch {
    return false;
  }
}

function isAllowedArchivistaCloneWritePath(pathname: string): boolean {
  return pathname === "/next/ia/archivista";
}

function isAllowedIaLibrettoCloneWritePath(pathname: string): boolean {
  return pathname === IA_LIBRETTO_ALLOWED_WRITE_PATH;
}

function isAllowedIaLibrettoAnalyzeFetch(pathname: string, meta: unknown): boolean {
  if (!IA_LIBRETTO_ALLOWED_FETCH_PATHS.some((entry) => pathname === entry)) return false;
  if (readMetaMethod(meta) !== "POST") return false;

  try {
    const parsed = new URL(readMetaUrl(meta), window.location.origin);
    const normalizedRuntimeEndpoint = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, "");
    const normalizedAllowedEndpoint = IA_LIBRETTO_ANALYZE_ENDPOINT.replace(/\/+$/, "");
    return normalizedRuntimeEndpoint === normalizedAllowedEndpoint;
  } catch {
    return false;
  }
}

function isAllowedEuromeccCloneWritePath(pathname: string): boolean {
  return EUROMECC_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function isAllowedDossierCloneWritePath(pathname: string): boolean {
  return DOSSIER_ALLOWED_WRITE_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}

function isAllowedIaDocumentiCloneWritePath(pathname: string): boolean {
  return pathname === IA_DOCUMENTI_ALLOWED_WRITE_PATH;
}

function hasCloneWriteScopedAllowance(scope: string): boolean {
  return (cloneWriteScopedAllowances.get(scope) ?? 0) > 0;
}

export async function runWithCloneWriteScopedAllowance<T>(
  scope: typeof INTERNAL_AI_MAGAZZINO_INLINE_SCOPE,
  action: () => Promise<T> | T,
): Promise<T> {
  cloneWriteScopedAllowances.set(scope, (cloneWriteScopedAllowances.get(scope) ?? 0) + 1);
  try {
    return await action();
  } finally {
    const nextCount = (cloneWriteScopedAllowances.get(scope) ?? 1) - 1;
    if (nextCount > 0) {
      cloneWriteScopedAllowances.set(scope, nextCount);
    } else {
      cloneWriteScopedAllowances.delete(scope);
    }
  }
}

function isAllowedCloneWriteException(kind: string, meta: unknown): boolean {
  const pathname = getCurrentPathname();
  if (
    hasCloneWriteScopedAllowance(INTERNAL_AI_MAGAZZINO_INLINE_SCOPE) &&
    kind === "storageSync.setItemSync" &&
    readMetaKey(meta) === "@inventario"
  ) {
    return true;
  }

  if (
    kind === "fetch.runtime" &&
    (isAllowedInternalAiDocumentAnalyzeFetch(pathname, meta) ||
      isAllowedIaLibrettoAnalyzeFetch(pathname, meta))
  ) {
    return true;
  }

  if (isAllowedIaLibrettoCloneWritePath(pathname)) {
    if (kind === "storage.uploadString") {
      const path = readMetaPath(meta);
      return IA_LIBRETTO_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }

    if (kind === "storageSync.setItemSync") {
      return IA_LIBRETTO_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
    }
  }

  if (isAllowedArchivistaCloneWritePath(pathname)) {
    if (kind === "storage.uploadBytes") {
      const path = readMetaPath(meta);
      return ARCHIVISTA_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }

    if (kind === "storage.uploadString") {
      const path = readMetaPath(meta);
      return ARCHIVISTA_ALLOWED_IMAGE_STORAGE_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }

    if (kind === "firestore.addDoc") {
      return ARCHIVISTA_ALLOWED_FIRESTORE_COLLECTIONS.has(readMetaPath(meta));
    }

    if (kind === "firestore.setDoc") {
      return ARCHIVISTA_ALLOWED_FIRESTORE_DOC_PATHS.has(readMetaPath(meta));
    }

    if (kind === "storageSync.setItemSync") {
      return ARCHIVISTA_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
    }
  }

  if (isAllowedLavoriCloneWritePath(pathname)) {
    return kind === "storageSync.setItemSync" && readMetaKey(meta) === "@lavori";
  }

  if (isAllowedEuromeccCloneWritePath(pathname)) {
    if (kind === "fetch.runtime") {
      try {
        const parsed = new URL(readMetaUrl(meta), window.location.origin);
        if (EUROMECC_ALLOWED_FETCH_API_PATHS.has(parsed.pathname)) {
          return true;
        }
        if (
          parsed.hostname === "127.0.0.1" &&
          parsed.pathname === "/internal-ai-backend/euromecc/pdf-analyze"
        ) {
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }
    if (kind === "storage.uploadBytes") {
      const storagePath = readMetaPath(meta);
      return storagePath.startsWith("euromecc/relazioni/");
    }
    if (kind === "storageSync.setItemSync") {
      const key = readMetaKey(meta);
      return key === "@ordini";
    }
  }

  if (isAllowedIaDocumentiCloneWritePath(pathname)) {
    if (kind === "firestore.deleteDoc") {
      const path = readMetaPath(meta);
      return IA_DOCUMENTI_ALLOWED_FIRESTORE_DELETE_DOC_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }

    if (kind === "firestore.updateDoc") {
      const path = readMetaPath(meta);
      return IA_DOCUMENTI_ALLOWED_FIRESTORE_UPDATE_DOC_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }

    if (kind === "storageSync.setItemSync") {
      return IA_DOCUMENTI_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
    }

    return false;
  }

  if (isAllowedMaterialiDaOrdinareCloneWritePath(pathname)) {
    if (kind === "firestore.setDoc") {
      return MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS.has(readMetaPath(meta));
    }
    if (kind === "storage.uploadBytes") {
      const path = readMetaPath(meta);
      return MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }
  }

  if (isAllowedMagazzinoCloneWritePath(pathname)) {
    if (kind === "storageSync.setItemSync") {
      return MAGAZZINO_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
    }

    if (kind === "storage.uploadBytes") {
      const path = readMetaPath(meta);
      return MAGAZZINO_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }
  }

  if (isAllowedDossierCloneWritePath(pathname)) {
    if (kind === "firestore.deleteDoc") {
      const path = readMetaPath(meta);
      return DOSSIER_ALLOWED_FIRESTORE_DELETE_DOC_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }

    if (kind === "storageSync.setItemSync") {
      return DOSSIER_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
    }

    return false;
  }

  if (!isAllowedManutenzioniCloneWritePath(pathname)) {
    return false;
  }

  if (kind === "storageSync.setItemSync") {
    return MANUTENZIONI_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (kind === "storage.uploadBytes") {
    const path = readMetaPath(meta);
    return MANUTENZIONI_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
      path.startsWith(prefix),
    );
  }

  return false;
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
