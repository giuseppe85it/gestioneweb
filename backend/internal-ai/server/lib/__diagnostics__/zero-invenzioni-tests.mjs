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
const BOUNDARY_PATH = path.resolve(__dirname, "../../internal-ai-firebase-readonly-boundary.js");

const NEW_C2_ENTRY_KEYS = Object.freeze([
  "sessions.autistiSessioneAttive",
  "vehicles.mezziAziendali",
  "refuelings.rifornimentiAutistiTmp",
  "refuelings.rifornimenti",
]);

const HARDENING_FIELD_PATTERN = /note|nota|descrizione|testo|telefono|contatto|url|Url|fileUrl|pdfUrl|fotoUrl|photoUrl|downloadUrl|imageUrls/;
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
  return source.includes("collection_root")
    ? makeResult("T3", "FAIL", "universal-resolver contiene collection_root")
    : makeResult("T3", "PASS", "collection_root assente da universal-resolver");
}

async function runT4() {
  const source = await fs.readFile(SHADOW_COMPARATOR_PATH, "utf8");
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
${failed.length ? `FAIL: ${failed.map((entry) => entry.id).join(", ")}` : "PASS: T1, T2, T3, T4 e T6 superati. T5 PASS o DEFERRED accettabile."}
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
];

await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
await fs.writeFile(REPORT_PATH, renderReport(results), "utf8");

console.table(results.map((entry) => ({ test: entry.id, status: entry.status, detail: entry.detail })));
console.log(`report=${path.relative(process.cwd(), REPORT_PATH)}`);

const hasFailure = results.some((entry) => entry.status === "FAIL");
if (hasFailure) process.exitCode = 1;
