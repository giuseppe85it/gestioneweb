export const NEXT_AUTISTI_BASE_PATH = "/next/autisti";
export const NEXT_AUTISTI_CLONE_NOTICE_QUERY_PARAM = "cloneNotice";

const CLONE_STORAGE_PREFIX = "@next_clone_autisti";

const AUTISTI_STORAGE_KEY_MAP: Record<string, string> = {
  "@autista_attivo_local": `${CLONE_STORAGE_PREFIX}:autista`,
  "@mezzo_attivo_autista_local": `${CLONE_STORAGE_PREFIX}:mezzo`,
  "@autista_revoca_local": `${CLONE_STORAGE_PREFIX}:revoca`,
};

const ALLOWED_LEGACY_ROUTE_MAP: Record<string, string> = {
  "/autisti": NEXT_AUTISTI_BASE_PATH,
  "/autisti/login": `${NEXT_AUTISTI_BASE_PATH}/login`,
  "/autisti/home": `${NEXT_AUTISTI_BASE_PATH}/home`,
  "/autisti/setup-mezzo": `${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`,
  "/autisti/cambio-mezzo": `${NEXT_AUTISTI_BASE_PATH}/cambio-mezzo`,
  "/autisti/controllo": `${NEXT_AUTISTI_BASE_PATH}/controllo`,
  "/autisti/rifornimento": `${NEXT_AUTISTI_BASE_PATH}/rifornimento`,
  "/autisti/richiesta-attrezzature": `${NEXT_AUTISTI_BASE_PATH}/richiesta-attrezzature`,
  "/autisti/segnalazioni": `${NEXT_AUTISTI_BASE_PATH}/segnalazioni`,
};

export type NextAutistiNoticeCode =
  | "rifornimento"
  | "rifornimento-locale"
  | "segnalazioni"
  | "segnalazioni-locale"
  | "richiesta-attrezzature"
  | "richiesta-attrezzature-locale"
  | "sgancia-motrice"
  | "controllo-locale"
  | "cambio-mezzo-locale"
  | "route-outside-tranche";

const NEXT_AUTISTI_NOTICE_CODES = new Set<NextAutistiNoticeCode>([
  "rifornimento",
  "rifornimento-locale",
  "segnalazioni",
  "segnalazioni-locale",
  "richiesta-attrezzature",
  "richiesta-attrezzature-locale",
  "sgancia-motrice",
  "controllo-locale",
  "cambio-mezzo-locale",
  "route-outside-tranche",
]);

type BlockedLegacyRouteConfig = {
  fallbackPath: string;
  noticeCode: NextAutistiNoticeCode;
};

const BLOCKED_LEGACY_ROUTE_MAP: Record<string, BlockedLegacyRouteConfig> = {};

const BLOCKED_HOME_ACTION_LABEL_MAP: Record<string, NextAutistiNoticeCode> = {};

type ManagedAutistiNavigationTarget = {
  managed: boolean;
  nextUrl: string | null;
  noticeCode?: NextAutistiNoticeCode;
};

function normalizePathname(pathname: string | undefined | null): string {
  const value = String(pathname ?? "").trim();
  if (!value) {
    return "/";
  }

  return value.startsWith("/") ? value : `/${value}`;
}

function buildRelativeUrl(pathname: string, search = "", hash = ""): string {
  return `${pathname}${search}${hash}`;
}

export function isNextAutistiClonePath(pathname: string | undefined | null): boolean {
  const value = normalizePathname(pathname);
  return value === NEXT_AUTISTI_BASE_PATH || value.startsWith(`${NEXT_AUTISTI_BASE_PATH}/`);
}

export function namespaceNextAutistiStorageKey(key: string): string {
  return AUTISTI_STORAGE_KEY_MAP[key] ?? key;
}

export function isNextAutistiNoticeCode(
  value: string | null | undefined,
): value is NextAutistiNoticeCode {
  return !!value && NEXT_AUTISTI_NOTICE_CODES.has(value as NextAutistiNoticeCode);
}

export function bootstrapNextAutistiCloneStorage(storage: Storage) {
  Object.entries(AUTISTI_STORAGE_KEY_MAP).forEach(([legacyKey, cloneKey]) => {
    if (storage.getItem(cloneKey) !== null) {
      return;
    }

    const legacyValue = storage.getItem(legacyKey);
    if (legacyValue !== null) {
      storage.setItem(cloneKey, legacyValue);
    }
  });
}

export function getNextAutistiNoticeMessage(code: NextAutistiNoticeCode): string {
  switch (code) {
    case "rifornimento":
      return "Rifornimento disponibile in lettura: nella NEXT Autisti l'azione resta visibile ma non salva dati.";
    case "rifornimento-locale":
      return "Clone NEXT in sola lettura: il rifornimento non viene salvato.";
    case "segnalazioni":
      return "Segnalazioni disponibili in lettura: nella NEXT Autisti l'azione resta visibile ma non salva dati.";
    case "segnalazioni-locale":
      return "Clone NEXT in sola lettura: la segnalazione non viene inviata.";
    case "richiesta-attrezzature":
      return "Richiesta attrezzature disponibile in lettura: nella NEXT Autisti l'azione resta visibile ma non salva dati.";
    case "richiesta-attrezzature-locale":
      return "Clone NEXT in sola lettura: la richiesta attrezzature non viene inviata.";
    case "sgancia-motrice":
      return "Clone NEXT in sola lettura: lo sgancio motrice non viene applicato.";
    case "controllo-locale":
      return "Clone NEXT in sola lettura: il controllo mezzo non viene salvato.";
    case "cambio-mezzo-locale":
      return "Clone NEXT in sola lettura: il cambio mezzo non viene applicato.";
    default:
      return "Questa schermata non e disponibile nel perimetro ufficiale NEXT Autisti.";
  }
}

export function normalizeAutistiButtonLabel(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function getBlockedHomeActionNoticeCode(
  label: string | null | undefined,
): NextAutistiNoticeCode | null {
  const normalized = normalizeAutistiButtonLabel(label);
  return BLOCKED_HOME_ACTION_LABEL_MAP[normalized] ?? null;
}

export function resolveNextAutistiNavigationTarget(
  url: string | URL | null | undefined,
): ManagedAutistiNavigationTarget {
  if (url == null || typeof window === "undefined") {
    return { managed: false, nextUrl: null };
  }

  let parsed: URL;
  try {
    parsed = new URL(String(url), window.location.origin);
  } catch {
    return { managed: false, nextUrl: null };
  }

  const pathname = normalizePathname(parsed.pathname);
  const allowedPath = ALLOWED_LEGACY_ROUTE_MAP[pathname];
  if (allowedPath) {
    return {
      managed: true,
      nextUrl: buildRelativeUrl(allowedPath, parsed.search, parsed.hash),
    };
  }

  const blockedPath = BLOCKED_LEGACY_ROUTE_MAP[pathname];
  if (blockedPath) {
    return {
      managed: true,
      nextUrl: buildRelativeUrl(blockedPath.fallbackPath),
      noticeCode: blockedPath.noticeCode,
    };
  }

  if (pathname === "/autisti" || pathname.startsWith("/autisti/")) {
    return {
      managed: true,
      nextUrl: buildRelativeUrl(NEXT_AUTISTI_BASE_PATH),
      noticeCode: "route-outside-tranche",
    };
  }

  return { managed: false, nextUrl: null };
}
