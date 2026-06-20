const CLONE_PREFIX = "/next";
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
  "storage/@ordini",
]);
const MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES = [
  "preventivi/manuali/",
  "preventivi/ia/",
  "materiali/",
] as const;
// Carico arrivi -> inventario dal modulo "Materiali da ordinare" (writer stock
// canonico condiviso): consentito scrivere la giacenza @inventario e la memoria
// sinonimi @stock_alias. Stesso pattern path-based del Magazzino, nessuno scope.
const MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_KEYS = new Set<string>([
  "@inventario",
  "@stock_alias",
]);
const ATTREZZATURE_CANTIERI_ALLOWED_WRITE_PATHS = ["/next/attrezzature-cantieri"] as const;
const ATTREZZATURE_CANTIERI_ALLOWED_FIRESTORE_DOC_PATHS = new Set([
  "storage/@attrezzature_cantieri",
]);
const ATTREZZATURE_CANTIERI_ALLOWED_STORAGE_PATH_PREFIXES = [
  "attrezzature/",
] as const;
const CISTERNA_ALLOWED_WRITE_PATH = "/next/cisterna";
const CISTERNA_IA_ALLOWED_WRITE_PATH = "/next/cisterna/ia";
const CISTERNA_SCHEDE_ALLOWED_WRITE_PATH = "/next/cisterna/schede-test";
const CISTERNA_PARAMETRI_COLLECTION_PREFIX = "@cisterna_parametri_mensili/";
const CISTERNA_DOCUMENTI_COLLECTION = "@documenti_cisterna";
const CISTERNA_DOCUMENTI_COLLECTION_PREFIX = `${CISTERNA_DOCUMENTI_COLLECTION}/`;
const CISTERNA_DOCUMENTI_STORAGE_PATH_PREFIX = "documenti_pdf/cisterna/";
const CISTERNA_DOCUMENTI_ANALYZE_ENDPOINT_PATH =
  "/internal-ai-backend/documents/documento-cisterna-analyze";
const CISTERNA_SCHEDE_COLLECTION = "@cisterna_schede_ia";
const CISTERNA_SCHEDE_COLLECTION_PREFIX = `${CISTERNA_SCHEDE_COLLECTION}/`;
const CISTERNA_SCHEDE_STORAGE_PATH_PREFIX = "documenti_pdf/cisterna_schede/";
const CISTERNA_SCHEDE_ANALYZE_ENDPOINT_PATH =
  "/internal-ai-backend/documents/scheda-cisterna-analyze";
const MATERIALI_DA_ORDINARE_ALLOWED_FETCH_ENDPOINT =
  "http://127.0.0.1:4310/internal-ai-backend/documents/preventivo-extract";
const ANAGRAFICHE_ALLOWED_FIRESTORE_DOC_PATHS: ReadonlySet<string> = new Set([
  "storage/@colleghi",
  "storage/@fornitori",
  "storage/@officine",
]);
const ANAGRAFICHE_ALLOWED_ROUTES: ReadonlySet<string> = new Set([
  "/next/anagrafiche",
  "/next/colleghi",
  "/next/fornitori",
]);
const SAFE_FETCH_METHODS = new Set(["GET", "HEAD"]);
const MUTATING_FETCH_URL_PATTERNS = [
  "cloudfunctions.net/analisi_economica_mezzo",
  "cloudfunctions.net/stamp_pdf",
  "cloudfunctions.net/estrazionedocumenti",
  "cloudfunctions.net/ia_cisterna_extract",
  "cloudfunctions.net/estrazioneschedacisterna",
  "cloudfunctions.net/cisterna_documenti_extract",
  "internal-ai-backend/documents/documento-cisterna-analyze",
  "internal-ai-backend/documents/scheda-cisterna-analyze",
  "internal-ai-backend/chat/tool-use",
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
const DOSSIER_MEZZO_EDIT_ALLOWED_WRITE_PATH_PREFIXES = [
  "/next/dossier/",
  "/next/dossiermezzi/",
] as const;
const DOSSIER_ALLOWED_FIRESTORE_DELETE_DOC_PATH_PREFIXES = [
  "@documenti_mezzi/",
  "@documenti_magazzino/",
  "@documenti_generici/",
] as const;
const DOSSIER_ALLOWED_STORAGE_KEYS = new Set(["@costiMezzo"]);
const DOSSIER_MEZZO_EDIT_ALLOWED_STORAGE_KEYS = new Set(["@mezzi_aziendali"]);
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
const INTERNAL_AI_DOCUMENTI_ALLOWED_PATHS = ["/next/ia/archivista"] as const;
const INTERNAL_AI_DOCUMENTI_ANALYZE_ENDPOINT =
  "https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti";
const SCADENZE_COLLAUDI_ALLOWED_WRITE_PATH = "/next/scadenze-collaudi";
const SCADENZE_COLLAUDI_ALLOWED_STORAGE_KEYS = new Set<string>(["@mezzi_aziendali"]);
const SCADENZE_COLLAUDI_WRITE_SCOPE = "scadenze_collaudi_write_scope";
// Scadenze di manutenzione ricorrenti: scrivono @manutenzioni_scadenze dalla stessa pagina
// "Scadenze" (path /next/scadenze-collaudi). Dataset dedicato, isolato dai mezzi.
const MANUTENZIONI_SCADENZE_ALLOWED_STORAGE_KEYS = new Set<string>(["@manutenzioni_scadenze"]);
const MANUTENZIONI_SCADENZE_WRITE_SCOPE = "manutenzioni_scadenze_write_scope";
// Anagrafica categorie personalizzate di scadenza, gestita dalla pagina "Scadenze".
const SCADENZE_CATEGORIE_ALLOWED_STORAGE_KEYS = new Set<string>(["@scadenze_categorie"]);
const SCADENZE_CATEGORIE_WRITE_SCOPE = "scadenze_categorie_write_scope";
const NEXT_HOME_LUOGO_MEZZO_ALLOWED_WRITE_PATH = "/next";
const NEXT_HOME_LUOGO_MEZZO_ALLOWED_STORAGE_KEYS = new Set<string>(["@storico_eventi_operativi"]);
export const NEXT_HOME_LUOGO_MEZZO_WRITE_SCOPE = "next_home_luogo_mezzo_write_scope";
const RIFORNIMENTI_ALLOWED_WRITE_PATH = "/next/centro-controllo";
const RIFORNIMENTI_ALLOWED_STORAGE_KEYS = new Set<string>(["@rifornimenti_autisti_tmp"]);
const RIFORNIMENTI_ALLOWED_FIRESTORE_DOC_PATHS = new Set<string>(["storage/@rifornimenti"]);
const RIFORNIMENTI_WRITE_SCOPE = "centro_controllo_rifornimenti_write";
const SEGNALAZIONI_ALLOWED_WRITE_PATH = "/next/centro-controllo";
const SEGNALAZIONI_ALLOWED_STORAGE_KEYS = new Set<string>(["@segnalazioni_autisti_tmp"]);
const SEGNALAZIONI_WRITE_SCOPE = "centro_controllo_segnalazioni_write";
const CONTROLLI_ALLOWED_WRITE_PATH = "/next/centro-controllo";
const CONTROLLI_ALLOWED_STORAGE_KEYS = new Set<string>(["@controlli_mezzo_autisti"]);
const CONTROLLI_WRITE_SCOPE = "centro_controllo_controlli_write";
const RICHIESTE_ALLOWED_WRITE_PATH = "/next/centro-controllo";
const RICHIESTE_ALLOWED_STORAGE_KEYS = new Set<string>(["@richieste_attrezzature_autisti_tmp"]);
const RICHIESTE_WRITE_SCOPE = "centro_controllo_richieste_write";
const DELETE_MEZZO_ALLOWED_WRITE_PATH = "/next/centro-controllo";
const DELETE_MEZZO_ALLOWED_STORAGE_KEYS = new Set<string>([
  "@mezzi_aziendali",
  "@rifornimenti",
  "@rifornimenti_autisti_tmp",
  "@manutenzioni",
  "@segnalazioni_autisti_tmp",
  "@controlli_mezzo_autisti",
  "@richieste_attrezzature_autisti_tmp",
  "@cambi_gomme_autisti_tmp",
  "@gomme_eventi",
  "@autisti_sessione_attive",
]);
const DELETE_MEZZO_WRITE_SCOPE = "centro_controllo_delete_mezzo_write";
const MANUTENZIONE_DAFARE_CREATE_ALLOWED_WRITE_PATHS = [
  "/next/centro-controllo",
  "/next/autisti-admin",
  "/next/autisti-inbox",
  "/next/manutenzioni",
] as const;
const MANUTENZIONE_DAFARE_CREATE_ALLOWED_STORAGE_KEYS = new Set<string>([
  "@manutenzioni",
  "@segnalazioni_autisti_tmp",
  "@controlli_mezzo_autisti",
]);
const MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE =
  "centro_controllo_manutenzione_dafare_create_write";
const AUTISTI_ADMIN_INBOX_ALLOWED_WRITE_PATHS = [
  "/next/autisti-admin",
  "/next/autisti-inbox",
] as const;
const AUTISTI_ADMIN_INBOX_ALLOWED_STORAGE_KEYS = new Set<string>([
  "@lavori",
  "@storico_eventi_operativi",
  "@segnalazioni_autisti_tmp",
  "@richieste_attrezzature_autisti_tmp",
  "@controlli_mezzo_autisti",
  "@cambi_gomme_autisti_tmp",
  "@gomme_eventi",
  "@rifornimenti_autisti_tmp",
  "@manutenzioni",
  "@permessi_autisti",
  "@orari_autisti",
  "@orari_autisti_chiusure",
]);
const CHIUSURA_DA_EVENTO_ALLOWED_WRITE_PATHS = [
  "/next/manutenzioni",
  "/next/autisti-inbox",
  "/next/centro-controllo",
] as const;
const CHIUSURA_DA_EVENTO_ALLOWED_STORAGE_KEYS = new Set<string>([
  "@manutenzioni",
  "@segnalazioni_autisti_tmp",
  "@controlli_mezzo_autisti",
]);
const CHIUSURA_DA_EVENTO_WRITE_SCOPE = "next_chiusura_da_evento_write_scope";
const GRUPPO_SEGNALAZIONI_ALLOWED_WRITE_PATHS = ["/next/manutenzioni"] as const;
const GRUPPO_SEGNALAZIONI_ALLOWED_STORAGE_KEYS = new Set<string>([
  "@segnalazioni_autisti_tmp",
]);
const GRUPPO_SEGNALAZIONI_WRITE_SCOPE = "next_gruppo_segnalazioni_write_scope";
const NEXT_SEGNALAZIONE_DELETE_ALLOWED_WRITE_PATHS = ["/next/manutenzioni"] as const;
const NEXT_SEGNALAZIONE_DELETE_ALLOWED_STORAGE_KEYS = new Set<string>([
  "@segnalazioni_autisti_tmp",
  "@manutenzioni",
]);
const NEXT_SEGNALAZIONE_DELETE_ALLOWED_STORAGE_PATH_PREFIXES = [
  "autisti/segnalazioni/",
] as const;
const NEXT_SEGNALAZIONE_DELETE_WRITE_SCOPE = "next_segnalazione_delete_write_scope";
// PROMPT 47/48 — scope dedicato per aggancio/sgancio legame manutenzione lato CC
// (writer agganciaSegnalazioneAManutenzioneEsistente + sganciaLegameOrfano).
// Path autorizzato: SOLO /next/centro-controllo (Archivio Storico interno). Le storage
// keys includono @manutenzioni (writer T1 patch back-link su target stand-alone) +
// @segnalazioni_autisti_tmp + @controlli_mezzo_autisti (patch sorgente).
const CENTRO_CONTROLLO_LEGAME_ALLOWED_WRITE_PATHS = ["/next/centro-controllo", "/next/manutenzioni"] as const;
const CENTRO_CONTROLLO_LEGAME_ALLOWED_STORAGE_KEYS = new Set<string>([
  "@manutenzioni",
  "@segnalazioni_autisti_tmp",
  "@controlli_mezzo_autisti",
]);
const CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE = "centro_controllo_legame_write";
// PROMPT 31.1 — deroga ristretta per il flag `nascostoInArchivio` su 4
// collezioni Archivio Storico. Il modulo Archivio era dichiarato
// sola-lettura nello SPEC; questa deroga abilita SOLO la patch del flag
// hide su /next/centro-controllo. Il writer enforce la singolarità del
// campo applicativamente (vedi nextArchivioHideWriter.ts).
const ARCHIVIO_HIDE_ALLOWED_WRITE_PATH = "/next/centro-controllo";
const ARCHIVIO_HIDE_ALLOWED_STORAGE_KEYS = new Set<string>([
  "@manutenzioni",
  "@segnalazioni_autisti_tmp",
  "@richieste_attrezzature_autisti_tmp",
]);
const ARCHIVIO_HIDE_WRITE_SCOPE = "centro_controllo_archivio_hide_write";
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
const CHAT_IA_ALLOWED_WRITE_PATHS = ["/next/chat", "/next/chat-tool"] as const;
const CHAT_IA_REPORTS_COLLECTION = "chat_ia_reports";
const CHAT_IA_REPORTS_STORAGE_PREFIX = "chat_ia_reports/";
const CHAT_IA_TOOL_USE_ENDPOINT_PATH = "/internal-ai-backend/chat/tool-use";
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
  let value = String(pathname ?? "").trim();
  if (!value.startsWith("/")) value = `/${value}`;
  // Strip eventuale trailing slash (non per root "/")
  if (value.length > 1 && value.endsWith("/")) {
    value = value.replace(/\/+$/, "");
  }
  return value;
}

function getCurrentPathname(): string {
  if (typeof window === "undefined") return "";
  return normalizePathname(window.location.pathname);
}

function isAllowedManutenzioniCloneWritePath(pathname: string): boolean {
  return MANUTENZIONI_ALLOWED_WRITE_PATHS.some((entry) => pathname === entry);
}

function isAllowedManutenzioneDaFareCreateWritePath(pathname: string): boolean {
  return MANUTENZIONE_DAFARE_CREATE_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function isAllowedAutistiAdminInboxWritePath(pathname: string): boolean {
  return AUTISTI_ADMIN_INBOX_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function isAllowedChiusuraDaEventoWritePath(pathname: string): boolean {
  return CHIUSURA_DA_EVENTO_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function isAllowedGruppoSegnalazioniWritePath(pathname: string): boolean {
  return GRUPPO_SEGNALAZIONI_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function isAllowedNextSegnalazioneDeleteWritePath(pathname: string): boolean {
  return NEXT_SEGNALAZIONE_DELETE_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

// PROMPT 47/48 — check path autorizzato per lo scope CENTRO_CONTROLLO_LEGAME_*.
function isAllowedCentroControlloLegameWritePath(pathname: string): boolean {
  return CENTRO_CONTROLLO_LEGAME_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function isAllowedMagazzinoCloneWritePath(pathname: string): boolean {
  return MAGAZZINO_ALLOWED_WRITE_PATHS.some((entry) => pathname === entry);
}

function isAllowedMaterialiDaOrdinareCloneWritePath(pathname: string): boolean {
  return MATERIALI_DA_ORDINARE_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function isAllowedAttrezzatureCantieriCloneWritePath(pathname: string): boolean {
  return ATTREZZATURE_CANTIERI_ALLOWED_WRITE_PATHS.some(
    (entry) => pathname === entry || pathname.startsWith(`${entry}/`),
  );
}

function isAllowedCisternaCloneWritePath(pathname: string): boolean {
  return pathname === CISTERNA_ALLOWED_WRITE_PATH;
}

function isAllowedCisternaIaCloneWritePath(pathname: string): boolean {
  return pathname === CISTERNA_IA_ALLOWED_WRITE_PATH;
}

function isAllowedCisternaSchedeCloneWritePath(pathname: string): boolean {
  return pathname === CISTERNA_SCHEDE_ALLOWED_WRITE_PATH;
}

function isAllowedAnagraficheCloneWritePath(pathname: string): boolean {
  return ANAGRAFICHE_ALLOWED_ROUTES.has(pathname);
}

function isAllowedMaterialiDaOrdinarePreventivoIaFetch(
  pathname: string,
  meta: unknown,
): boolean {
  if (!isAllowedMaterialiDaOrdinareCloneWritePath(pathname)) return false;
  if (readMetaMethod(meta) !== "POST") return false;

  try {
    const parsed = new URL(readMetaUrl(meta), window.location.origin);
    const normalizedRuntimeEndpoint = `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, "");
    const normalizedAllowedEndpoint =
      MATERIALI_DA_ORDINARE_ALLOWED_FETCH_ENDPOINT.replace(/\/+$/, "");
    return normalizedRuntimeEndpoint === normalizedAllowedEndpoint;
  } catch {
    return false;
  }
}

function isAllowedCisternaDocumentAnalyzeFetch(pathname: string, meta: unknown): boolean {
  if (!isAllowedCisternaIaCloneWritePath(pathname)) return false;
  if (readMetaMethod(meta) !== "POST") return false;

  try {
    const parsed = new URL(readMetaUrl(meta), window.location.origin);
    return parsed.pathname === CISTERNA_DOCUMENTI_ANALYZE_ENDPOINT_PATH;
  } catch {
    return false;
  }
}

function isAllowedCisternaSchedeAnalyzeFetch(pathname: string, meta: unknown): boolean {
  if (!isAllowedCisternaSchedeCloneWritePath(pathname)) return false;
  if (readMetaMethod(meta) !== "POST") return false;

  try {
    const parsed = new URL(readMetaUrl(meta), window.location.origin);
    return parsed.pathname === CISTERNA_SCHEDE_ANALYZE_ENDPOINT_PATH;
  } catch {
    return false;
  }
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

function isAllowedScadenzeCollaudiCloneWritePath(pathname: string): boolean {
  return pathname === SCADENZE_COLLAUDI_ALLOWED_WRITE_PATH;
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

function isAllowedDossierMezzoEditCloneWritePath(pathname: string): boolean {
  return DOSSIER_MEZZO_EDIT_ALLOWED_WRITE_PATH_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

function isAllowedIaDocumentiCloneWritePath(pathname: string): boolean {
  return pathname === IA_DOCUMENTI_ALLOWED_WRITE_PATH;
}

function isAllowedChatIaCloneWritePath(pathname: string): boolean {
  return CHAT_IA_ALLOWED_WRITE_PATHS.some((entry) => pathname === entry);
}

function isAllowedChatIaToolUseFetch(meta: unknown): boolean {
  if (readMetaMethod(meta) !== "POST") return false;

  try {
    const parsed = new URL(readMetaUrl(meta), window.location.origin);
    return parsed.pathname === CHAT_IA_TOOL_USE_ENDPOINT_PATH;
  } catch {
    return false;
  }
}

function hasCloneWriteScopedAllowance(scope: string): boolean {
  return (cloneWriteScopedAllowances.get(scope) ?? 0) > 0;
}

export async function runWithCloneWriteScopedAllowance<T>(
  scope:
    | typeof INTERNAL_AI_MAGAZZINO_INLINE_SCOPE
    | typeof SCADENZE_COLLAUDI_WRITE_SCOPE
    | typeof MANUTENZIONI_SCADENZE_WRITE_SCOPE
    | typeof SCADENZE_CATEGORIE_WRITE_SCOPE
    | typeof RIFORNIMENTI_WRITE_SCOPE
    | typeof SEGNALAZIONI_WRITE_SCOPE
    | typeof CONTROLLI_WRITE_SCOPE
    | typeof RICHIESTE_WRITE_SCOPE
    | typeof DELETE_MEZZO_WRITE_SCOPE
    | typeof MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE
    | typeof CHIUSURA_DA_EVENTO_WRITE_SCOPE
    | typeof GRUPPO_SEGNALAZIONI_WRITE_SCOPE
    | typeof NEXT_SEGNALAZIONE_DELETE_WRITE_SCOPE
    | typeof ARCHIVIO_HIDE_WRITE_SCOPE
    | typeof CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE
    | typeof NEXT_HOME_LUOGO_MEZZO_WRITE_SCOPE,
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
    hasCloneWriteScopedAllowance(INTERNAL_AI_MAGAZZINO_INLINE_SCOPE) &&
    kind === "storageSync.setItemSync" &&
    readMetaKey(meta) === "@mezzi_aziendali" &&
    pathname.includes("/next/centro-controllo")
  ) {
    return true;
  }

  if (
    pathname === SEGNALAZIONI_ALLOWED_WRITE_PATH &&
    hasCloneWriteScopedAllowance(SEGNALAZIONI_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return SEGNALAZIONI_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    pathname === CONTROLLI_ALLOWED_WRITE_PATH &&
    hasCloneWriteScopedAllowance(CONTROLLI_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return CONTROLLI_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    pathname === RICHIESTE_ALLOWED_WRITE_PATH &&
    hasCloneWriteScopedAllowance(RICHIESTE_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return RICHIESTE_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    pathname === DELETE_MEZZO_ALLOWED_WRITE_PATH &&
    hasCloneWriteScopedAllowance(DELETE_MEZZO_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return DELETE_MEZZO_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    isAllowedManutenzioneDaFareCreateWritePath(pathname) &&
    hasCloneWriteScopedAllowance(MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return MANUTENZIONE_DAFARE_CREATE_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (isAllowedAutistiAdminInboxWritePath(pathname)) {
    if (kind === "storageSync.setItemSync") {
      return AUTISTI_ADMIN_INBOX_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
    }
    if (kind === "storageSync.updateSessioniAtomic") {
      return readMetaKey(meta) === "@autisti_sessione_attive";
    }
  }

  if (
    isAllowedChiusuraDaEventoWritePath(pathname) &&
    hasCloneWriteScopedAllowance(CHIUSURA_DA_EVENTO_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return CHIUSURA_DA_EVENTO_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    isAllowedGruppoSegnalazioniWritePath(pathname) &&
    hasCloneWriteScopedAllowance(GRUPPO_SEGNALAZIONI_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return GRUPPO_SEGNALAZIONI_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    isAllowedNextSegnalazioneDeleteWritePath(pathname) &&
    hasCloneWriteScopedAllowance(NEXT_SEGNALAZIONE_DELETE_WRITE_SCOPE)
  ) {
    if (kind === "storageSync.setItemSync") {
      return NEXT_SEGNALAZIONE_DELETE_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
    }
    if (kind === "storage.deleteObject") {
      const path = readMetaPath(meta);
      return NEXT_SEGNALAZIONE_DELETE_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }
  }

  // PROMPT 47/48 — aggancio/sgancio legame manutenzione lato Centro Controllo.
  // Lo scope e' acceso dai writer agganciaSegnalazioneAManutenzioneEsistente e
  // sganciaLegameOrfano. Storage keys: @segnalazioni / @controlli (patch sorgente)
  // + @manutenzioni (back-link su target stand-alone).
  if (
    isAllowedCentroControlloLegameWritePath(pathname) &&
    hasCloneWriteScopedAllowance(CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return CENTRO_CONTROLLO_LEGAME_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  // PROMPT 31.1 — deroga hide flag su Archivio Storico (4 collezioni).
  if (
    pathname === ARCHIVIO_HIDE_ALLOWED_WRITE_PATH &&
    hasCloneWriteScopedAllowance(ARCHIVIO_HIDE_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return ARCHIVIO_HIDE_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    kind === "fetch.runtime" &&
    (isAllowedInternalAiDocumentAnalyzeFetch(pathname, meta) ||
      isAllowedIaLibrettoAnalyzeFetch(pathname, meta) ||
      isAllowedMaterialiDaOrdinarePreventivoIaFetch(pathname, meta) ||
      isAllowedCisternaDocumentAnalyzeFetch(pathname, meta) ||
      isAllowedCisternaSchedeAnalyzeFetch(pathname, meta))
  ) {
    return true;
  }

  if (isAllowedCisternaCloneWritePath(pathname)) {
    if (kind === "firestore.setDoc") {
      return readMetaPath(meta).startsWith(CISTERNA_PARAMETRI_COLLECTION_PREFIX);
    }

    if (kind === "firestore.updateDoc") {
      return readMetaPath(meta).startsWith(CISTERNA_DOCUMENTI_COLLECTION_PREFIX);
    }

    return false;
  }

  if (isAllowedCisternaIaCloneWritePath(pathname)) {
    if (kind === "storage.uploadBytes") {
      return readMetaPath(meta).startsWith(CISTERNA_DOCUMENTI_STORAGE_PATH_PREFIX);
    }

    if (kind === "firestore.addDoc") {
      return readMetaPath(meta) === CISTERNA_DOCUMENTI_COLLECTION;
    }

    if (kind === "fetch.runtime") {
      return isAllowedCisternaDocumentAnalyzeFetch(pathname, meta);
    }

    return false;
  }

  if (isAllowedCisternaSchedeCloneWritePath(pathname)) {
    if (kind === "firestore.addDoc") {
      return readMetaPath(meta) === CISTERNA_SCHEDE_COLLECTION;
    }

    if (kind === "firestore.updateDoc") {
      return readMetaPath(meta).startsWith(CISTERNA_SCHEDE_COLLECTION_PREFIX);
    }

    if (kind === "storage.uploadBytes") {
      return readMetaPath(meta).startsWith(CISTERNA_SCHEDE_STORAGE_PATH_PREFIX);
    }

    if (kind === "fetch.runtime") {
      return isAllowedCisternaSchedeAnalyzeFetch(pathname, meta);
    }

    return false;
  }

  if (isAllowedChatIaCloneWritePath(pathname)) {
    if (kind === "firestore.addDoc") {
      return readMetaPath(meta) === CHAT_IA_REPORTS_COLLECTION;
    }

    if (kind === "firestore.setDoc" || kind === "firestore.updateDoc") {
      return readMetaPath(meta).startsWith(`${CHAT_IA_REPORTS_COLLECTION}/`);
    }

    if (kind === "storage.uploadBytes") {
      return readMetaPath(meta).startsWith(CHAT_IA_REPORTS_STORAGE_PREFIX);
    }

    if (kind === "fetch.runtime") {
      return isAllowedChatIaToolUseFetch(meta);
    }

    return false;
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

  if (
    isAllowedScadenzeCollaudiCloneWritePath(pathname) &&
    hasCloneWriteScopedAllowance(SCADENZE_COLLAUDI_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return SCADENZE_COLLAUDI_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    isAllowedScadenzeCollaudiCloneWritePath(pathname) &&
    hasCloneWriteScopedAllowance(MANUTENZIONI_SCADENZE_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return MANUTENZIONI_SCADENZE_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    isAllowedScadenzeCollaudiCloneWritePath(pathname) &&
    hasCloneWriteScopedAllowance(SCADENZE_CATEGORIE_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return SCADENZE_CATEGORIE_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    pathname === NEXT_HOME_LUOGO_MEZZO_ALLOWED_WRITE_PATH &&
    hasCloneWriteScopedAllowance(NEXT_HOME_LUOGO_MEZZO_WRITE_SCOPE) &&
    kind === "storageSync.setItemSync"
  ) {
    return NEXT_HOME_LUOGO_MEZZO_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
  }

  if (
    pathname === RIFORNIMENTI_ALLOWED_WRITE_PATH &&
    hasCloneWriteScopedAllowance(RIFORNIMENTI_WRITE_SCOPE)
  ) {
    if (kind === "storageSync.setItemSync") {
      return RIFORNIMENTI_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
    }
    if (kind === "firestore.setDoc") {
      return RIFORNIMENTI_ALLOWED_FIRESTORE_DOC_PATHS.has(readMetaPath(meta));
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

    if (kind === "firestore.updateDoc") {
      const path = readMetaPath(meta);
      return path.startsWith("@documenti_mezzi/") || path.startsWith("@documenti_magazzino/");
    }

    if (kind === "storageSync.setItemSync") {
      return ARCHIVISTA_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
    }
  }

  if (isAllowedDossierMezzoEditCloneWritePath(pathname)) {
    return (
      kind === "storageSync.setItemSync" &&
      DOSSIER_MEZZO_EDIT_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta))
    );
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
      return (
        storagePath.startsWith("euromecc/relazioni/") ||
        storagePath.startsWith("euromecc/segnalazioni/")
      );
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

  if (isAllowedAnagraficheCloneWritePath(pathname)) {
    if (kind === "firestore.setDoc" || kind === "firestore.getDoc") {
      return ANAGRAFICHE_ALLOWED_FIRESTORE_DOC_PATHS.has(readMetaPath(meta));
    }

    return false;
  }

  if (isAllowedMaterialiDaOrdinareCloneWritePath(pathname)) {
    if (kind === "fetch.runtime") {
      return isAllowedMaterialiDaOrdinarePreventivoIaFetch(pathname, meta);
    }
    if (kind === "firestore.setDoc") {
      return MATERIALI_DA_ORDINARE_ALLOWED_FIRESTORE_DOC_PATHS.has(readMetaPath(meta));
    }
    if (kind === "storageSync.setItemSync") {
      return MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_KEYS.has(readMetaKey(meta));
    }
    if (kind === "storage.uploadBytes") {
      const path = readMetaPath(meta);
      return MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }
    if (kind === "storage.deleteObject") {
      const path = readMetaPath(meta);
      return MATERIALI_DA_ORDINARE_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }
  }

  if (isAllowedAttrezzatureCantieriCloneWritePath(pathname)) {
    if (kind === "firestore.setDoc") {
      return ATTREZZATURE_CANTIERI_ALLOWED_FIRESTORE_DOC_PATHS.has(readMetaPath(meta));
    }
    if (kind === "storage.uploadBytes") {
      const path = readMetaPath(meta);
      return ATTREZZATURE_CANTIERI_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
        path.startsWith(prefix),
      );
    }
    if (kind === "storage.deleteObject") {
      const path = readMetaPath(meta);
      return ATTREZZATURE_CANTIERI_ALLOWED_STORAGE_PATH_PREFIXES.some((prefix) =>
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
