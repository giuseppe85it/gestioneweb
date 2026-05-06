/*
 * Test diagnostici Zero-Invenzioni base.
 *
 * Scope PROMPT C-RETRY 2026-05-04:
 * - nessuna scrittura Firestore/Storage;
 * - nessun dato reale in stdout o report;
 * - verifica config runtime contro boundary readonly;
 * - T5 live opzionale e anonimizzato, limitato alle entry aggiunte in C2.
 */

import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getInternalAiFirebaseAdminReadonlyContext, probeInternalAiFirebaseAdminRuntime } from "../../internal-ai-firebase-admin.js";
import { readInternalAiFirebaseReadonlyBoundary } from "../../internal-ai-firebase-readonly-boundary.js";
import { REGISTRY_CONFIG_FASE_A } from "../registry.config.js";
import { runQueryEngine } from "../query-engine.js";
import relationConfigModule from "../relation.config.cjs";
import { resolveRelationsForCertifiedRecord } from "../relation-resolver.js";
import { runUniversalResolverFaseA } from "../universal-resolver.js";

dotenv.config({
  path: path.resolve(process.cwd(), "backend/internal-ai/.env"),
  override: false,
  quiet: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_PATH = path.resolve(__dirname, "../../../../../docs/audit/REPORT_ZERO_INVENZIONI_TESTS_2026-05-04.md");
const UNIVERSAL_RESOLVER_PATH = path.resolve(__dirname, "../universal-resolver.js");
const SHADOW_COMPARATOR_PATH = path.resolve(__dirname, "../shadow-comparator.js");
const POST_LLM_RESOLVER_PATH = path.resolve(__dirname, "../post-llm-resolver.js");
const BOUNDARY_PATH = path.resolve(__dirname, "../../internal-ai-firebase-readonly-boundary.js");
const QUERY_ENGINE_PATH = path.resolve(__dirname, "../query-engine.js");
const PACKAGE_JSON_PATH = path.resolve(process.cwd(), "package.json");
const PLAN_PATH = path.resolve(process.cwd(), "docs/product/PIANO_ESECUTIVO_CHAT_IA_NEXT.md");
const REGISTRO_COLLECTION_FIRESTORE_PATH = path.resolve(process.cwd(), "docs/product/REGISTRO_COLLECTION_FIRESTORE.md");
const RELATION_CONFIG_TS_PATH = path.resolve(process.cwd(), "src/next/chat-ia/config/relation.config.ts");
const RELATION_RESOLVER_PATH = path.resolve(__dirname, "../relation-resolver.js");
const VIEW_CONFIG_PATH = path.resolve(process.cwd(), "src/next/chat-ia/config/view.config.ts");
const VEHICLE360_PATH = path.resolve(process.cwd(), "src/next/chat-ia/views/Vehicle360.tsx");
const PROOF_PANEL_PATH = path.resolve(process.cwd(), "src/next/chat-ia/components/ProofPanel.tsx");
const DRIVER360_PATH = path.resolve(process.cwd(), "src/next/chat-ia/views/Driver360.tsx");

const NEW_C2_ENTRY_KEYS = Object.freeze([
  "sessions.autistiSessioneAttive",
  "vehicles.mezziAziendali",
  "refuelings.rifornimentiAutistiTmp",
  "refuelings.rifornimenti",
]);

const EUROMECC_COLLECTION_ROOT_ENTRY_KEYS = Object.freeze([
  "euromecc.pending",
  "euromecc.done",
  "euromecc.issues",
  "euromecc.areaMeta",
  "euromecc.extraComponents",
  "euromecc.relazioni",
]);

const B5_COLLECTION_ROOT_ENTRY_KEYS = Object.freeze([
  "documents.documentiMezziRoot",
  "documents.documentiMagazzinoRoot",
  "documents.documentiGenericiRoot",
  "cisterna.documentiRoot",
  "cisterna.schedeIaRoot",
  "cisterna.parametriMensiliRoot",
]);

const REQUIRED_RELATION_KINDS = Object.freeze([
  "driver_vehicle",
  "vehicle_refueling",
  "vehicle_maintenance",
  "material_supplier",
  "site_equipment",
]);

const RELATION_CONFIG = Object.freeze(
  relationConfigModule?.RELATION_CONFIG ?? relationConfigModule?.default?.RELATION_CONFIG ?? [],
);

const FREE_TEXT_FORBIDDEN_FIELDS = Object.freeze([
  "note",
  "descrizione",
  "messaggio",
  "commento",
  "testo",
  "dettaglio",
  "rawText",
  "extractedText",
  "riepilogoBreve",
  "analisiCosti",
  "anomalie",
  "fornitoriNotevoli",
]);

const SENSITIVE_FORBIDDEN_FIELDS = Object.freeze([
  "apiKey",
  "token",
  "password",
  "secret",
  "telefono",
  "telefonoPrivato",
  "telefoniAggiuntivi",
  "email",
  "indirizzo",
  "pinSim",
  "pukSim",
  "schedeCarburante",
  "downloadUrl",
  "fileUrl",
  "pdfUrl",
  "url",
  "imageUrls",
  "fotoUrl",
]);

const HARDENING_FIELD_PATTERN = /note|nota|descrizione|testo|telefono|contatto|url|Url|fileUrl|pdfUrl|fotoUrl|photoUrl|downloadUrl|imageUrls/;
const VALID_VIEW_ENUM_VALUES = Object.freeze(["Driver360", "Vehicle360", "Site360", "Euromecc360", "Ricerca360"]);
const EXPECTED_SHADOW_SIZE = 6619;
const EXPECTED_SHADOW_FIRST_LINES = Object.freeze([
  "/*",
  " * Shadow comparator temporaneo.",
  " * Migrazione Fase A motore generico (SPEC_MOTORE_GENERICO_NEXT.md §8, §10.1).",
]);
const EXPECTED_SHADOW_LAST_LINES = Object.freeze([
  "  return legacyResult;",
  "}",
  "",
]);

function makeResult(id, status, detail = "") {
  return { id, status, detail };
}

function findBoundaryEntry(boundary, entryConfig) {
  return boundary.firestore.allowedReads.find(
    (entry) =>
      entry.id === entryConfig.boundaryEntryId &&
      entry.service === "firestore" &&
      entry.accessMode === entryConfig.accessMode &&
      entry.collection === entryConfig.collection &&
      entry.docId === entryConfig.docId,
  ) ?? null;
}

function compareArrays(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

async function runT1(boundary) {
  const failures = [];
  for (const [entryKey, entryConfig] of Object.entries(REGISTRY_CONFIG_FASE_A.entries)) {
    const boundaryEntry = findBoundaryEntry(boundary, entryConfig);
    if (!boundaryEntry) {
      failures.push(`${entryKey}: boundary entry assente`);
      continue;
    }
    const boundaryAllowed = Array.isArray(boundaryEntry.allowedFields) ? boundaryEntry.allowedFields : [];
    const missing = entryConfig.allowedFields.filter((field) => !boundaryAllowed.includes(field));
    if (missing.length) {
      failures.push(`${entryKey}: campi non in boundary: ${missing.join(", ")}`);
    }
  }
  return failures.length
    ? makeResult("T1", "FAIL", failures.join("; "))
    : makeResult("T1", "PASS", `${Object.keys(REGISTRY_CONFIG_FASE_A.entries).length} entry coerenti con boundary`);
}

async function runT2() {
  const failures = [];
  for (const [entryKey, entryConfig] of Object.entries(REGISTRY_CONFIG_FASE_A.entries)) {
    const hits = entryConfig.allowedFields.filter((field) => HARDENING_FIELD_PATTERN.test(field));
    if (hits.length) failures.push(`${entryKey}: ${hits.join(", ")}`);
  }
  return failures.length
    ? makeResult("T2", "FAIL", failures.join("; "))
    : makeResult("T2", "PASS", "nessun allowedField con pattern vietato");
}

async function runT3() {
  const source = await fs.readFile(UNIVERSAL_RESOLVER_PATH, "utf8");
  return source.includes('entryConfig.accessMode === "collection_root"') && source.includes("runCollectionRootResolver")
    ? makeResult("T3", "PASS", "universal-resolver delega collection_root al modulo dedicato")
    : makeResult("T3", "FAIL", "branch collection_root dedicato non trovato");
}

async function runT4() {
  const source = await fs.readFile(SHADOW_COMPARATOR_PATH, "utf8");
  if (source.includes("@deprecated") && source.includes("LEGACY_SHADOW_COMPARATOR_WARNING")) {
    return makeResult("T4", "PASS", "shadow-comparator deprecato dopo BLOCCO 8 e warning runtime presente");
  }
  const lines = source.split(/\r?\n/);
  const size = Buffer.byteLength(source);
  const first = lines.slice(0, 3);
  const last = lines.slice(-3);
  if (
    size !== EXPECTED_SHADOW_SIZE ||
    !compareArrays(first, EXPECTED_SHADOW_FIRST_LINES) ||
    !compareArrays(last, EXPECTED_SHADOW_LAST_LINES)
  ) {
    return makeResult("T4", "FAIL", "shadow-comparator non coincide con baseline PROMPT 28");
  }
  return makeResult("T4", "PASS", `size=${size}, prime/ultime 3 righe coerenti`);
}

function collectUnexpectedFields(records, allowedFields) {
  const allowed = new Set(allowedFields);
  const unexpected = new Set();
  const forbidden = new Set();
  records.forEach((record) => {
    Object.keys(record?.fields ?? {}).forEach((field) => {
      if (!allowed.has(field)) unexpected.add(field);
      if (HARDENING_FIELD_PATTERN.test(field)) forbidden.add(field);
    });
  });
  return {
    unexpected: Array.from(unexpected),
    forbidden: Array.from(forbidden),
  };
}

async function runT5() {
  const probe = await probeInternalAiFirebaseAdminRuntime();
  if (!probe.canAttemptLiveRead) {
    return {
      ...makeResult("T5", "DEFERRED", `Firebase Admin non disponibile: ${probe.credential.mode}`),
      metrics: {
        module_real_case_executed: "no",
        entries_tested: 0,
        records_read: 0,
        divergence_kinds: [],
      },
    };
  }

  const readonlyContext = await getInternalAiFirebaseAdminReadonlyContext();
  if (readonlyContext.status !== "ready") {
    return {
      ...makeResult("T5", "DEFERRED", `Firebase Admin non ready: ${readonlyContext.status}`),
      metrics: {
        module_real_case_executed: "no",
        entries_tested: 0,
        records_read: 0,
        divergence_kinds: [],
      },
    };
  }

  const divergenceKinds = [];
  let entriesTested = 0;
  let recordsRead = 0;

  for (const entryConfigKey of NEW_C2_ENTRY_KEYS) {
    const entryConfig = REGISTRY_CONFIG_FASE_A.entries[entryConfigKey];
    if (!entryConfig) {
      divergenceKinds.push("missing_entry_config");
      continue;
    }
    entriesTested += 1;
    const result = await runUniversalResolverFaseA({
      entryConfigKey,
      query: {
        action: "diagnostic_read",
        view: null,
        entityKind: null,
        searchText: null,
        periodPreset: null,
      },
    });

    if (result?.errors?.some((error) => error?.kind === "firestore_error")) {
      divergenceKinds.push("firestore_error");
      continue;
    }

    const records = Array.isArray(result?.entries?.[0]?.records) ? result.entries[0].records.slice(0, 2) : [];
    recordsRead += records.length;
    const fieldCheck = collectUnexpectedFields(records, entryConfig.allowedFields);
    if (fieldCheck.unexpected.length) divergenceKinds.push("unexpected_field");
    if (fieldCheck.forbidden.length) divergenceKinds.push("forbidden_field");
  }

  return {
    ...makeResult(
      "T5",
      divergenceKinds.length ? "FAIL" : "PASS",
      divergenceKinds.length ? `divergenze: ${Array.from(new Set(divergenceKinds)).join(", ")}` : "casi reali anonimizzati coerenti",
    ),
    metrics: {
      module_real_case_executed: "si",
      entries_tested: entriesTested,
      records_read: recordsRead,
      divergence_kinds: Array.from(new Set(divergenceKinds)),
    },
  };
}

async function runT6() {
  const source = await fs.readFile(BOUNDARY_PATH, "utf8");
  const match = source.match(/const FIRESTORE_MEZZI_ALLOWED_FIELDS = Object\.freeze\(\[([\s\S]*?)\]\);/);
  if (!match) return makeResult("T6", "FAIL", "FIRESTORE_MEZZI_ALLOWED_FIELDS non trovata");
  const body = match[1].replace(/\/\/.*$/gm, "");
  if (body.includes('"librettoUrl"') || body.includes("'librettoUrl'")) {
    return makeResult("T6", "FAIL", "librettoUrl presente in FIRESTORE_MEZZI_ALLOWED_FIELDS");
  }
  if (!body.includes('"librettoStoragePath"')) {
    return makeResult("T6", "FAIL", "librettoStoragePath assente da FIRESTORE_MEZZI_ALLOWED_FIELDS");
  }
  return makeResult("T6", "PASS", "librettoUrl assente, librettoStoragePath presente");
}

async function runT7() {
  const failures = [];
  for (const [entryKey, entryConfig] of Object.entries(REGISTRY_CONFIG_FASE_A.entries)) {
    if (!Array.isArray(entryConfig.viewBindings) || !entryConfig.viewBindings.length) {
      failures.push(`${entryKey}: viewBindings assente`);
      continue;
    }
    const invalidViews = entryConfig.viewBindings.filter((view) => !VALID_VIEW_ENUM_VALUES.includes(view));
    if (invalidViews.length) {
      failures.push(`${entryKey}: ViewEnum non valida: ${invalidViews.join(", ")}`);
    }
  }
  return failures.length
    ? makeResult("T7", "FAIL", failures.join("; "))
    : makeResult("T7", "PASS", "viewBindings presenti e coerenti sulle entry registry");
}

async function runT8() {
  const source = await fs.readFile(QUERY_ENGINE_PATH, "utf8");
  return source.includes("collection_root")
    ? makeResult("T8", "FAIL", "query-engine contiene collection_root")
    : makeResult("T8", "PASS", "query-engine limitato al percorso exact document tramite resolver universale");
}

async function runT9() {
  const result = await runQueryEngine({
    entryConfigKey: "driver360.colleghi",
    matchInput: { searchText: "ZZZ_NON_ESISTE" },
    query: {
      action: "diagnostic_read",
      view: "Driver360",
      entityKind: "driver",
      searchText: "ZZZ_NON_ESISTE",
      periodPreset: null,
    },
  });
  const records = Array.isArray(result?.entries?.[0]?.records) ? result.entries[0].records : [];
  const firstErrorKind = result?.errors?.[0]?.kind ?? null;
  if (records.length === 0 && firstErrorKind === "collection_empty") {
    return makeResult("T9", "PASS", "query-engine restituisce no_results certificato per input sintetico");
  }
  return makeResult(
    "T9",
    "FAIL",
    `atteso collection_empty con 0 record, ricevuto kind=${firstErrorKind ?? "-"} records=${records.length}`,
  );
}

function extractViewConfigBoundaryIds(source, viewKind) {
  const match = source.match(new RegExp(`${viewKind}:\\s*\\{[\\s\\S]*?entryBoundaryIds:\\s*\\[([\\s\\S]*?)\\]`, "m"));
  if (!match) return null;
  return Array.from(match[1].matchAll(/"([^"]+)"/g)).map((entry) => entry[1]);
}

async function runT10(boundary) {
  const source = await fs.readFile(VIEW_CONFIG_PATH, "utf8");
  const declaredViews = Array.from(source.matchAll(/viewKind:\s*"([^"]+)"/g)).map((entry) => entry[1]);
  const uniqueDeclaredViews = Array.from(new Set(declaredViews));
  const boundaryIds = new Set(boundary.firestore.allowedReads.map((entry) => entry.id));
  const failures = [];
  if (!compareArrays([...uniqueDeclaredViews].sort(), [...VALID_VIEW_ENUM_VALUES].sort())) {
    failures.push(`ViewEnum dichiarate: ${uniqueDeclaredViews.join(", ")}`);
  }
  for (const viewKind of VALID_VIEW_ENUM_VALUES) {
    const entryBoundaryIds = extractViewConfigBoundaryIds(source, viewKind);
    if (!entryBoundaryIds?.length) {
      failures.push(`${viewKind}: entryBoundaryIds assente`);
      continue;
    }
    const missing = entryBoundaryIds.filter((entryId) => !boundaryIds.has(entryId));
    if (missing.length) failures.push(`${viewKind}: boundary id assenti: ${missing.join(", ")}`);
  }
  return failures.length
    ? makeResult("T10", "FAIL", failures.join("; "))
    : makeResult("T10", "PASS", "view.config.ts copre i 5 ViewEnum con boundary id esistenti");
}

async function runT11() {
  const source = await fs.readFile(VEHICLE360_PATH, "utf8");
  if (!source.includes("CertifiedView")) {
    return makeResult("T11", "FAIL", "Vehicle360 non importa CertifiedView");
  }
  if (/domain\//.test(source) || /from\s+["'][^"']*domain/.test(source)) {
    return makeResult("T11", "FAIL", "Vehicle360 importa direttamente domain reader");
  }
  return makeResult("T11", "PASS", "Vehicle360 e' wrapper sopra CertifiedView senza domain reader");
}

async function runT12(boundary) {
  const entryCount = Object.keys(REGISTRY_CONFIG_FASE_A.entries).length;
  if (entryCount !== 26) {
    return makeResult("T12", "FAIL", `entry registry attese=26, ricevute=${entryCount}`);
  }
  const t1 = await runT1(boundary);
  const t2 = await runT2();
  if (t1.status === "FAIL" || t2.status === "FAIL") {
    return makeResult("T12", "FAIL", `regressione T1/T2: ${t1.detail}; ${t2.detail}`);
  }
  return makeResult("T12", "PASS", "REGISTRY_CONFIG_FASE_A ha 26 entry e resta coerente con boundary");
}

async function runT13() {
  const forbiddenUrlFields = new Set([
    "librettoUrl",
    "downloadUrl",
    "fileUrl",
    "pdfUrl",
    "url",
    "imageUrls",
    "fotoUrl",
  ]);
  const failures = [];
  for (const [entryKey, entryConfig] of Object.entries(REGISTRY_CONFIG_FASE_A.entries)) {
    const hits = entryConfig.allowedFields.filter((field) => forbiddenUrlFields.has(field));
    if (hits.length) failures.push(`${entryKey}: ${hits.join(", ")}`);
  }
  return failures.length
    ? makeResult("T13", "FAIL", failures.join("; "))
    : makeResult("T13", "PASS", "nessun URL firmato in allowedFields dopo estensione registry");
}

async function canRunEuromeccLiveRead() {
  const probe = await probeInternalAiFirebaseAdminRuntime();
  if (!probe.canAttemptLiveRead) {
    return {
      ok: false,
      result: makeResult("T14", "DEFERRED", `Firebase Admin non disponibile: ${probe.credential.mode}`),
    };
  }

  const readonlyContext = await getInternalAiFirebaseAdminReadonlyContext();
  if (readonlyContext.status !== "ready") {
    return {
      ok: false,
      result: makeResult("T14", "DEFERRED", `Firebase Admin non ready: ${readonlyContext.status}`),
    };
  }

  return { ok: true, result: null };
}

async function runEuromeccResolver(entryConfigKey) {
  return runUniversalResolverFaseA({
    entryConfigKey,
    query: {
      action: "diagnostic_read",
      view: "Euromecc360",
      entityKind: "euromecc",
      searchText: null,
      periodPreset: null,
    },
  });
}

async function runT14() {
  const readiness = await canRunEuromeccLiveRead();
  if (!readiness.ok) return readiness.result;

  const result = await runEuromeccResolver("euromecc.pending");
  const entry = result?.entries?.[0] ?? null;
  if (entry?.accessModeUsed !== "collection_root") {
    return makeResult("T14", "FAIL", `accessModeUsed atteso collection_root, ricevuto=${entry?.accessModeUsed ?? "-"}`);
  }
  const records = Array.isArray(entry.records) ? entry.records : [];
  return makeResult("T14", "PASS", `euromecc.pending collection_root operativo, records=${records.length}`);
}

async function runT15() {
  const readiness = await canRunEuromeccLiveRead();
  if (!readiness.ok) return makeResult("T15", "DEFERRED", readiness.result.detail);

  const failures = [];
  for (const entryConfigKey of EUROMECC_COLLECTION_ROOT_ENTRY_KEYS) {
    const entryConfig = REGISTRY_CONFIG_FASE_A.entries[entryConfigKey];
    const result = await runEuromeccResolver(entryConfigKey);
    const records = Array.isArray(result?.entries?.[0]?.records) ? result.entries[0].records : [];
    const fieldCheck = collectUnexpectedFields(records, entryConfig.allowedFields);
    if (fieldCheck.unexpected.length) failures.push(`${entryConfigKey}: unexpected ${fieldCheck.unexpected.join(", ")}`);
    if (fieldCheck.forbidden.length) failures.push(`${entryConfigKey}: forbidden ${fieldCheck.forbidden.join(", ")}`);
  }

  return failures.length
    ? makeResult("T15", "FAIL", failures.join("; "))
    : makeResult("T15", "PASS", "record Euromecc proiettati solo su campi boundary");
}

async function runT16() {
  const readiness = await canRunEuromeccLiveRead();
  if (!readiness.ok) return makeResult("T16", "DEFERRED", readiness.result.detail);

  const failures = [];
  for (const entryConfigKey of EUROMECC_COLLECTION_ROOT_ENTRY_KEYS) {
    const entryConfig = REGISTRY_CONFIG_FASE_A.entries[entryConfigKey];
    const result = await runEuromeccResolver(entryConfigKey);
    const records = Array.isArray(result?.entries?.[0]?.records) ? result.entries[0].records : [];
    const maxReads = Number(entryConfig.requestLimits?.maxDocumentReadsPerRequest ?? 0);
    if (records.length > maxReads) failures.push(`${entryConfigKey}: records=${records.length}, cap=${maxReads}`);
  }

  return failures.length
    ? makeResult("T16", "FAIL", failures.join("; "))
    : makeResult("T16", "PASS", "cap maxDocumentReadsPerRequest rispettato per Euromecc");
}

async function canRunB5LiveRead(testId) {
  const probe = await probeInternalAiFirebaseAdminRuntime();
  if (!probe.canAttemptLiveRead) {
    return {
      ok: false,
      result: makeResult(testId, "DEFERRED", `Firebase Admin non disponibile: ${probe.credential.mode}`),
    };
  }

  const readonlyContext = await getInternalAiFirebaseAdminReadonlyContext();
  if (readonlyContext.status !== "ready") {
    return {
      ok: false,
      result: makeResult(testId, "DEFERRED", `Firebase Admin non ready: ${readonlyContext.status}`),
    };
  }

  return { ok: true, result: null };
}

async function runB5Resolver(entryConfigKey) {
  return runUniversalResolverFaseA({
    entryConfigKey,
    query: {
      action: "diagnostic_read",
      view: "Ricerca360",
      entityKind: null,
      searchText: null,
      periodPreset: null,
    },
  });
}

async function runT17() {
  const readiness = await canRunB5LiveRead("T17");
  if (!readiness.ok) return readiness.result;

  const failures = [];
  for (const entryConfigKey of B5_COLLECTION_ROOT_ENTRY_KEYS) {
    const result = await runB5Resolver(entryConfigKey);
    const entry = result?.entries?.[0] ?? null;
    if (entry?.accessModeUsed !== "collection_root") {
      failures.push(`${entryConfigKey}: accessModeUsed=${entry?.accessModeUsed ?? "-"}`);
    }
  }

  return failures.length
    ? makeResult("T17", "FAIL", failures.join("; "))
    : makeResult("T17", "PASS", "6 nuove entry root risolte con accessModeUsed collection_root");
}

async function runT18() {
  const urlFieldPattern = /(^url$|Url$|URL$|downloadUrl$|fileUrl$|pdfUrl$|fotoUrl$|imageUrls$)/;
  const failures = [];
  for (const entryConfigKey of B5_COLLECTION_ROOT_ENTRY_KEYS) {
    const entryConfig = REGISTRY_CONFIG_FASE_A.entries[entryConfigKey];
    if (!entryConfig) {
      failures.push(`${entryConfigKey}: entry assente`);
      continue;
    }
    const hits = entryConfig.allowedFields.filter((field) => urlFieldPattern.test(field));
    if (hits.length) failures.push(`${entryConfigKey}: ${hits.join(", ")}`);
  }

  return failures.length
    ? makeResult("T18", "FAIL", failures.join("; "))
    : makeResult("T18", "PASS", "nessun campo *Url nelle 6 entry root BLOCCO 5");
}

async function runT19(boundary) {
  const requiredForbiddenFields = [...FREE_TEXT_FORBIDDEN_FIELDS, ...SENSITIVE_FORBIDDEN_FIELDS];
  const failures = [];
  for (const entryConfigKey of B5_COLLECTION_ROOT_ENTRY_KEYS) {
    const entryConfig = REGISTRY_CONFIG_FASE_A.entries[entryConfigKey];
    if (!entryConfig) {
      failures.push(`${entryConfigKey}: entry registry assente`);
      continue;
    }
    const boundaryEntry = findBoundaryEntry(boundary, entryConfig);
    if (!boundaryEntry) {
      failures.push(`${entryConfigKey}: boundary entry assente`);
      continue;
    }
    const registryForbidden = new Set(entryConfig.forbiddenFields ?? []);
    const boundaryForbidden = new Set(boundaryEntry.forbiddenFields ?? []);
    const missingRegistry = requiredForbiddenFields.filter((field) => !registryForbidden.has(field));
    const missingBoundary = requiredForbiddenFields.filter((field) => !boundaryForbidden.has(field));
    if (missingRegistry.length) {
      failures.push(`${entryConfigKey}: registry missing ${missingRegistry.join(", ")}`);
    }
    if (missingBoundary.length) {
      failures.push(`${entryConfigKey}: boundary missing ${missingBoundary.join(", ")}`);
    }
  }

  return failures.length
    ? makeResult("T19", "FAIL", failures.join("; "))
    : makeResult("T19", "PASS", "forbiddenFields BLOCCO 5 includono testo libero e campi sensibili");
}

async function runT20() {
  const failures = [];
  try {
    await fs.access(RELATION_CONFIG_TS_PATH);
  } catch {
    failures.push("relation.config.ts assente");
  }

  const relationKinds = new Set(RELATION_CONFIG.map((entry) => entry?.relationKind).filter(Boolean));
  const missingKinds = REQUIRED_RELATION_KINDS.filter((kind) => !relationKinds.has(kind));
  if (missingKinds.length) failures.push(`relationKind mancanti: ${missingKinds.join(", ")}`);

  for (const relation of RELATION_CONFIG) {
    const entryConfig = REGISTRY_CONFIG_FASE_A.entries[relation?.sourceEntryConfigKey];
    if (!entryConfig) {
      failures.push(`${relation?.relationKind ?? "relation"}: entry registry assente ${relation?.sourceEntryConfigKey}`);
      continue;
    }
    const missingFields = (relation.sourceFields ?? []).filter((field) => !entryConfig.allowedFields.includes(field));
    if (missingFields.length) {
      failures.push(`${relation.relationKind}: campi non allowed ${missingFields.join(", ")}`);
    }
  }

  return failures.length
    ? makeResult("T20", "FAIL", failures.join("; "))
    : makeResult("T20", "PASS", "relation.config.ts dichiara 5 relationKind minime con campi in registry");
}

async function runT21() {
  const source = await fs.readFile(RELATION_RESOLVER_PATH, "utf8");
  const forbiddenImports = [/from\s+["'][^"']*tools\//, /from\s+["'][^"']*agents\//, /from\s+["'][^"']*domain\//];
  const hasForbiddenImport = forbiddenImports.some((pattern) => pattern.test(source));
  if (hasForbiddenImport) {
    return makeResult("T21", "FAIL", "relation-resolver importa tools/agents/domain");
  }
  if (!source.includes("registry.config.js") || !source.includes("relation.config.cjs")) {
    return makeResult("T21", "FAIL", "relation-resolver non importa registry.config.js e relation.config.cjs");
  }
  return makeResult("T21", "PASS", "relation-resolver isolato da tools/agents/domain");
}

async function runT22() {
  const record = {
    sourceRecordId: "mezzo-1",
    fields: {
      id: { value: "mezzo-1", sourceField: "id" },
      targa: { value: "ZZ000000", sourceField: "targa" },
      autistaId: { value: "driver-1", sourceField: "autistaId" },
    },
    provenance: {
      sourceCollection: "storage/@mezzi_aziendali",
      sourceRecordId: "mezzo-1",
      sourceFields: ["id", "targa", "autistaId"],
      accessModeUsed: "exact_document",
      boundaryEntryId: "firestore-storage-mezzi-aziendali-doc",
      confidence: "certified",
    },
  };

  const relation = resolveRelationsForCertifiedRecord(record, {
    entryConfigKey: "vehicles.mezziAziendali",
  }).find((entry) => entry.relationKind === "driver_vehicle");

  const expected = {
    relationKind: "driver_vehicle",
    sourceCollection: "storage/@mezzi_aziendali",
    sourceRecordId: "mezzo-1",
    sourceField: "autistaId",
    rule: "autistaId_explicit",
    certainty: "explicit_assignment",
  };

  return JSON.stringify(relation?.relationProof ?? null) === JSON.stringify(expected)
    ? makeResult("T22", "PASS", "driver_vehicle identico al pattern autistaId_explicit legacy su input sintetico")
    : makeResult("T22", "FAIL", `relationProof inatteso: ${JSON.stringify(relation?.relationProof ?? null)}`);
}

async function runT23() {
  const source = await fs.readFile(RELATION_RESOLVER_PATH, "utf8");
  if (/fuzzy|levenshtein|soundex|similar/i.test(source)) {
    return makeResult("T23", "FAIL", "relation-resolver contiene marker fuzzy/similarita");
  }

  const recordWithoutAssignment = {
    sourceRecordId: "mezzo-1",
    fields: {
      id: { value: "mezzo-1", sourceField: "id" },
      targa: { value: "ZZ000000", sourceField: "targa" },
    },
    provenance: {
      sourceCollection: "storage/@mezzi_aziendali",
      sourceRecordId: "mezzo-1",
      sourceFields: ["id", "targa"],
      accessModeUsed: "exact_document",
      boundaryEntryId: "firestore-storage-mezzi-aziendali-doc",
      confidence: "certified",
    },
  };
  const relations = resolveRelationsForCertifiedRecord(recordWithoutAssignment, {
    entryConfigKey: "vehicles.mezziAziendali",
  });
  const unsafe = relations.filter((entry) =>
    ["explicit_assignment", "exact"].includes(entry?.relationProof?.certainty),
  );

  return unsafe.length
    ? makeResult("T23", "FAIL", "relazione exact/explicit generata senza campi chiave completi")
    : makeResult("T23", "PASS", "nessuna relazione exact/explicit nasce da campi mancanti o fuzzy");
}

async function runT24() {
  try {
    const source = await fs.readFile(PROOF_PANEL_PATH, "utf8");
    if (!source.includes("CollapsibleProof")) {
      return makeResult("T24", "FAIL", "ProofPanel.tsx non importa CollapsibleProof");
    }
    return makeResult("T24", "PASS", "ProofPanel.tsx esiste e wrappa CollapsibleProof");
  } catch {
    return makeResult("T24", "FAIL", "ProofPanel.tsx assente");
  }
}

async function runT25() {
  const source = await fs.readFile(DRIVER360_PATH, "utf8");
  if (source.includes("CollapsibleProof")) {
    return makeResult("T25", "FAIL", "Driver360 importa ancora CollapsibleProof direttamente");
  }
  if (source.includes("<dt>Provenienza</dt>") || source.includes("Provenienza")) {
    return makeResult("T25", "FAIL", "Driver360 contiene ancora grezzo tecnico Provenienza");
  }
  if (source.includes("driverRelationResolver")) {
    return makeResult("T25", "FAIL", "Driver360 chiama ancora il resolver relazioni legacy frontend");
  }
  return makeResult("T25", "PASS", "Driver360 usa ProofPanel e non contiene grezzo tecnico in primo piano");
}

async function runT26() {
  const packageJson = JSON.parse(await fs.readFile(PACKAGE_JSON_PATH, "utf8"));
  const script = packageJson?.scripts?.["chat-ia:diagnostics"] ?? null;
  return script === "node backend/internal-ai/server/lib/__diagnostics__/zero-invenzioni-tests.mjs"
    ? makeResult("T26", "PASS", "script chat-ia:diagnostics presente")
    : makeResult("T26", "FAIL", "script chat-ia:diagnostics assente o incoerente");
}

async function runT27() {
  const source = await fs.readFile(POST_LLM_RESOLVER_PATH, "utf8");
  return source.includes("@deprecated") && source.includes("LEGACY_POST_LLM_RESOLVER_WARNING")
    ? makeResult("T27", "PASS", "post-llm-resolver legacy annotato e warning runtime presente")
    : makeResult("T27", "FAIL", "post-llm-resolver legacy senza annotazione/warning deprecazione");
}

async function runT28() {
  const [planSource, registrySource] = await Promise.all([
    fs.readFile(PLAN_PATH, "utf8"),
    fs.readFile(REGISTRO_COLLECTION_FIRESTORE_PATH, "utf8"),
  ]);
  const residualCount = Array.from(planSource.matchAll(/DA VERIFICARE/g)).length;
  if (residualCount > 0) {
    return registrySource.includes("BOZZA")
      ? makeResult("T28", "PASS", `registro resta BOZZA con DA VERIFICARE residui nel piano: ${residualCount}`)
      : makeResult("T28", "FAIL", `registro promosso nonostante DA VERIFICARE residui nel piano: ${residualCount}`);
  }
  return registrySource.includes("Versione: 1.0")
    ? makeResult("T28", "PASS", "registro promosso a v1.0 senza DA VERIFICARE residui nel piano")
    : makeResult("T28", "FAIL", "registro non promosso a v1.0 nonostante assenza DA VERIFICARE nel piano");
}

function renderReport(results) {
  const t5 = results.find((entry) => entry.id === "T5");
  const rows = results.map((entry) => `| ${entry.id} | ${entry.status} | ${entry.detail || "-"} |`).join("\n");
  const failed = results.filter((entry) => entry.status === "FAIL");
  return `# Report Zero-Invenzioni Base

## Stato documento
- Versione: v1.0
- Data: 2026-05-04
- Scope: PROMPT C-RETRY, STEP C3.
- Dati reali nel report: no.

## Esiti

| Test | Esito | Dettaglio |
|---|---|---|
${rows}

## Metriche T5
- module_real_case_executed: ${t5?.metrics?.module_real_case_executed ?? "no"}
- entries_tested: ${t5?.metrics?.entries_tested ?? 0}
- records_read: ${t5?.metrics?.records_read ?? 0}
- divergence_kinds: ${(t5?.metrics?.divergence_kinds ?? []).join(", ") || "-"}

## Verdetto
${failed.length ? `FAIL: ${failed.map((entry) => entry.id).join(", ")}` : "PASS: diagnostici Zero-Invenzioni superati; test live PASS o DEFERRED dove ammesso."}
`;
}

const boundary = readInternalAiFirebaseReadonlyBoundary();
const results = [
  await runT1(boundary),
  await runT2(),
  await runT3(),
  await runT4(),
  await runT5(),
  await runT6(),
  await runT7(),
  await runT8(),
  await runT9(),
  await runT10(boundary),
  await runT11(),
  await runT12(boundary),
  await runT13(),
  await runT14(),
  await runT15(),
  await runT16(),
  await runT17(),
  await runT18(),
  await runT19(boundary),
  await runT20(),
  await runT21(),
  await runT22(),
  await runT23(),
  await runT24(),
  await runT25(),
  await runT26(),
  await runT27(),
  await runT28(),
];

await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
await fs.writeFile(REPORT_PATH, renderReport(results), "utf8");

console.table(results.map((entry) => ({ test: entry.id, status: entry.status, detail: entry.detail })));
console.log(`report=${path.relative(process.cwd(), REPORT_PATH)}`);

const hasFailure = results.some((entry) => entry.status === "FAIL");
if (hasFailure) process.exitCode = 1;
