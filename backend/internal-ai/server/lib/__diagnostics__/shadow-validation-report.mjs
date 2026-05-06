/*
 * Validazione shadow Fase A Resolver Universale.
 *
 * Decisione 2026-05-04: validazione automatica read-only, nessun dato reale
 * in stdout o report. Lo script usa vecchio resolver, nuovo resolver e shadow
 * comparator solo in diagnostica, fuori dal path runtime.
 *
 * Vincoli:
 * - niente scritture Firestore/Storage;
 * - niente targhe, badge, nomi, id o searchText reali nel report;
 * - niente mock Firestore;
 * - solo allowedFields del boundary per il caso reale anonimizzato.
 */

import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getInternalAiFirebaseAdminReadonlyContext, probeInternalAiFirebaseAdminRuntime } from "../../internal-ai-firebase-admin.js";
import { readInternalAiFirebaseReadonlyBoundary } from "../../internal-ai-firebase-readonly-boundary.js";
import { resolvePostLlmMessage } from "../post-llm-resolver.js";
import { REGISTRY_CONFIG_FASE_A } from "../registry.config.js";
import { runShadowComparator } from "../shadow-comparator.js";
import { runUniversalResolverFaseA } from "../universal-resolver.js";

dotenv.config({
  path: path.resolve(process.cwd(), "backend/internal-ai/.env"),
  override: false,
  quiet: true,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_PATH = path.resolve(__dirname, "../../../../../docs/audit/REPORT_SHADOW_VALIDATION_FASE_A_2026-05-04.md");
const DRIVER_ENTRY_KEY = "driver360.colleghi";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function unwrapStorageItems(rawDoc) {
  if (!rawDoc) return [];
  if (Array.isArray(rawDoc)) return rawDoc;
  if (!isPlainObject(rawDoc)) return [];
  if (Array.isArray(rawDoc.items)) return rawDoc.items;
  if (Array.isArray(rawDoc.value)) return rawDoc.value;
  if (isPlainObject(rawDoc.value) && Array.isArray(rawDoc.value.items)) return rawDoc.value.items;
  return [];
}

function buildDriverMessage(searchText) {
  return {
    action: "view_open",
    view: "Driver360",
    filters: {
      searchText,
      entityKind: "driver",
      periodPreset: null,
    },
    resolvedFilters: null,
    clarification: null,
    disambiguation: null,
    report: null,
    accompaniment: { kind: "view_opened", params: null },
  };
}

function buildSyntheticCases() {
  const missA = `ZZZ_DIAG_MISS_${Date.now()}_A`;
  const missB = `ZZZ_DIAG_MISS_${Date.now()}_B`;
  return [
    {
      key: "synthetic_driver_miss_a",
      description: "input miss Driver360 con searchText sintetico improbabile",
      message: buildDriverMessage(missA),
      options: { requestId: "diag-synthetic-driver-miss-a", prompt: missA, preflightContext: { hints: { entityKind: "driver" } } },
      expectedClass: "driver_miss",
    },
    {
      key: "synthetic_driver_miss_b",
      description: "input miss Driver360 alternativo con searchText sintetico improbabile",
      message: buildDriverMessage(missB),
      options: { requestId: "diag-synthetic-driver-miss-b", prompt: missB, preflightContext: { hints: { entityKind: "driver" } } },
      expectedClass: "driver_miss",
    },
    {
      key: "synthetic_vehicle_out_of_scope",
      description: "input fuori scope con view Vehicle360",
      message: {
        action: "view_open",
        view: "Vehicle360",
        filters: { searchText: "ZZZ_DIAG_VEHICLE", entityKind: "vehicle", periodPreset: null },
        resolvedFilters: null,
        clarification: null,
        disambiguation: null,
        report: null,
        accompaniment: { kind: "view_opened", params: null },
      },
      options: { requestId: "diag-synthetic-vehicle", prompt: "ZZZ_DIAG_VEHICLE", preflightContext: { hints: { entityKind: "vehicle" } } },
      expectedClass: "not_applicable",
    },
    {
      key: "synthetic_missing_view",
      description: "input malformato con view assente",
      message: {
        action: "view_open",
        view: null,
        filters: { searchText: "ZZZ_DIAG_NO_VIEW", entityKind: "driver", periodPreset: null },
        resolvedFilters: null,
        clarification: null,
        disambiguation: null,
        report: null,
        accompaniment: { kind: "view_opened", params: null },
      },
      options: { requestId: "diag-synthetic-missing-view", prompt: "ZZZ_DIAG_NO_VIEW", preflightContext: { hints: { entityKind: "driver" } } },
      expectedClass: "not_applicable",
    },
    {
      key: "synthetic_empty_search",
      description: "input borderline Driver360 con searchText vuoto",
      message: buildDriverMessage(""),
      options: { requestId: "diag-synthetic-empty-search", prompt: "", preflightContext: { hints: { entityKind: "driver" } } },
      expectedClass: "not_applicable",
    },
    {
      key: "synthetic_null_filters",
      description: "input malformato con filters null",
      message: {
        action: "view_open",
        view: "Driver360",
        filters: null,
        resolvedFilters: null,
        clarification: null,
        disambiguation: null,
        report: null,
        accompaniment: { kind: "view_opened", params: null },
      },
      options: { requestId: "diag-synthetic-null-filters", prompt: "ZZZ_DIAG_NULL_FILTERS", preflightContext: { hints: { entityKind: "driver" } } },
      expectedClass: "not_applicable",
    },
    {
      key: "synthetic_non_driver_entity",
      description: "input Driver360 con entityKind non driver",
      message: {
        action: "view_open",
        view: "Driver360",
        filters: { searchText: "ZZZ_DIAG_ENTITY", entityKind: "vehicle", periodPreset: null },
        resolvedFilters: null,
        clarification: null,
        disambiguation: null,
        report: null,
        accompaniment: { kind: "view_opened", params: null },
      },
      options: { requestId: "diag-synthetic-non-driver-entity", prompt: "ZZZ_DIAG_ENTITY", preflightContext: { hints: { entityKind: "vehicle" } } },
      expectedClass: "not_applicable",
    },
    {
      key: "synthetic_null_message",
      description: "input nullo",
      message: null,
      options: { requestId: "diag-synthetic-null-message", prompt: "", preflightContext: { hints: {} } },
      expectedClass: "not_applicable",
    },
  ];
}

function readLegacyComparable(legacyResult) {
  const finalMessage = legacyResult?.finalMessage ?? null;
  const resolvedFilters = isPlainObject(finalMessage?.resolvedFilters) ? finalMessage.resolvedFilters : {};
  const candidates = Array.isArray(finalMessage?.disambiguation?.candidates) ? finalMessage.disambiguation.candidates : null;
  const hasDriverId = typeof resolvedFilters.driverId === "string" && resolvedFilters.driverId.length > 0;
  return {
    hasDriverId,
    matchCount: hasDriverId ? 1 : candidates ? candidates.length : finalMessage?.accompaniment?.kind === "no_results" ? 0 : null,
  };
}

function readCandidateComparable(candidateResult) {
  const records = Array.isArray(candidateResult?.entries?.[0]?.records) ? candidateResult.entries[0].records : [];
  const hasDriverId = typeof candidateResult?.legacyDriver360?.driverId === "string" && candidateResult.legacyDriver360.driverId.length > 0;
  return {
    hasDriverId,
    matchCount: records.length,
  };
}

function isApplicableDriverMessage(message) {
  return message?.view === "Driver360" && message?.filters?.entityKind === "driver" && Boolean(text(message?.filters?.searchText));
}

function buildUniversalInputFromMessage(message) {
  return {
    entryConfigKey: DRIVER_ENTRY_KEY,
    matchInput: { searchText: text(message?.filters?.searchText) },
    query: {
      action: message?.action ?? null,
      view: message?.view ?? null,
      entityKind: message?.filters?.entityKind ?? null,
      searchText: text(message?.filters?.searchText),
      periodPreset: message?.filters?.periodPreset ?? null,
    },
  };
}

function compareAggregated(legacyResult, candidateResult, applicable) {
  if (!applicable) {
    return {
      divergenceKinds: ["not_applicable"],
      legacyComparable: readLegacyComparable(legacyResult),
      candidateComparable: { hasDriverId: false, matchCount: null },
      sameDriverId: null,
      critical: false,
    };
  }
  if (!isPlainObject(candidateResult) || candidateResult.version !== "resolvedFilters.v2") {
    return {
      divergenceKinds: ["shape_mismatch"],
      legacyComparable: readLegacyComparable(legacyResult),
      candidateComparable: { hasDriverId: false, matchCount: null },
      sameDriverId: false,
      critical: true,
    };
  }

  const legacyComparable = readLegacyComparable(legacyResult);
  const candidateComparable = readCandidateComparable(candidateResult);
  const divergenceKinds = [];
  const legacyDriverId = legacyResult?.finalMessage?.resolvedFilters?.driverId ?? null;
  const candidateDriverId = candidateResult?.legacyDriver360?.driverId ?? null;

  if (legacyComparable.hasDriverId && !candidateComparable.hasDriverId) divergenceKinds.push("missing_in_new");
  if (!legacyComparable.hasDriverId && candidateComparable.hasDriverId) divergenceKinds.push("extra_in_new");
  if (legacyComparable.hasDriverId && candidateComparable.hasDriverId && legacyDriverId !== candidateDriverId) {
    divergenceKinds.push("value_diff");
  }
  if (
    typeof legacyComparable.matchCount === "number" &&
    typeof candidateComparable.matchCount === "number" &&
    legacyComparable.matchCount !== candidateComparable.matchCount
  ) {
    divergenceKinds.push("value_diff");
  }

  return {
    divergenceKinds,
    legacyComparable,
    candidateComparable,
    sameDriverId:
      legacyComparable.hasDriverId && candidateComparable.hasDriverId
        ? legacyDriverId === candidateDriverId
        : legacyComparable.hasDriverId === candidateComparable.hasDriverId,
    critical: divergenceKinds.some((kind) => kind !== "not_applicable"),
  };
}

async function captureComparatorKinds(message, options) {
  const originalWarn = console.warn;
  const kinds = [];
  console.warn = (...args) => {
    if (args[0] !== "[shadow-comparator]") return;
    try {
      const payload = JSON.parse(String(args[1] ?? "{}"));
      if (typeof payload.kind === "string") kinds.push(payload.kind);
    } catch {
      kinds.push("unparseable_shadow_log");
    }
  };
  try {
    await runShadowComparator(message, options);
  } finally {
    console.warn = originalWarn;
  }
  return kinds;
}

async function runCase(testCase) {
  const comparatorKinds = await captureComparatorKinds(testCase.message, testCase.options);
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const legacyResult = await resolvePostLlmMessage(testCase.message, testCase.options);
    const applicable = isApplicableDriverMessage(legacyResult?.finalMessage ?? testCase.message);
    const candidateResult = applicable
      ? await runUniversalResolverFaseA(buildUniversalInputFromMessage(legacyResult?.finalMessage ?? testCase.message))
      : null;
    const comparison = compareAggregated(legacyResult, candidateResult, applicable);
    return {
      key: testCase.key,
      description: testCase.description,
      expectedClass: testCase.expectedClass,
      comparatorKinds,
      divergenceKinds: Array.from(new Set([...comparison.divergenceKinds, ...comparatorKinds])),
      legacyHasDriverId: comparison.legacyComparable.hasDriverId,
      candidateHasDriverId: comparison.candidateComparable.hasDriverId,
      sameDriverId: comparison.sameDriverId,
      legacyMatchCount: comparison.legacyComparable.matchCount,
      candidateMatchCount: comparison.candidateComparable.matchCount,
      critical: comparison.critical,
    };
  } finally {
    console.warn = originalWarn;
  }
}

function projectAllowedRecord(raw, allowedFields) {
  const projected = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(raw, field)) projected[field] = raw[field];
  }
  return projected;
}

async function buildRealDriverCaseIfAvailable(readonlyContext) {
  const boundary = readInternalAiFirebaseReadonlyBoundary();
  const entry = boundary.firestore.allowedReads.find((item) => item.id === "firestore-storage-colleghi-doc");
  if (!entry) return null;
  const snapshot = await readonlyContext.firestore.collection(entry.collection).doc(entry.docId).get();
  const items = unwrapStorageItems(snapshot.exists ? snapshot.data() : null)
    .map((record) => projectAllowedRecord(record, entry.allowedFields ?? []))
    .filter((record) => isPlainObject(record));

  const sorted = items
    .map((record, index) => ({ record, index }))
    .sort((left, right) => {
      const leftKey = text(left.record.id) || text(left.record.badge) || text(left.record.codice) || String(left.index);
      const rightKey = text(right.record.id) || text(right.record.badge) || text(right.record.codice) || String(right.index);
      return leftKey.localeCompare(rightKey, "it", { sensitivity: "base" });
    });

  for (const { record } of sorted) {
    const searchText = text(record.badge) || text(record.codice) || text(record.nome) || text(record.nomeCompleto) || text(record.label);
    if (!searchText) continue;
    return {
      key: "real_driver_anonymized",
      description: "caso reale anonimizzato letto da storage/@colleghi via allowedFields",
      message: buildDriverMessage(searchText),
      options: { requestId: "diag-real-driver-anonymized", prompt: searchText, preflightContext: { hints: { entityKind: "driver" } } },
      expectedClass: "real_driver",
    };
  }
  return null;
}

function countDivergences(results) {
  const counts = {};
  for (const result of results) {
    for (const kind of result.divergenceKinds) {
      counts[kind] = (counts[kind] ?? 0) + 1;
    }
  }
  return counts;
}

function summarizeReadiness(realResult, syntheticResults) {
  const criticalKinds = Array.from(new Set([...syntheticResults, realResult].filter(Boolean).flatMap((item) =>
    item.divergenceKinds.filter((kind) => !["not_applicable"].includes(kind)),
  )));
  if (criticalKinds.length) {
    return {
      verdict: "NON PRONTO",
      line: `NON PRONTO: divergenze critiche rilevate. Kind osservati: ${criticalKinds.join(", ")}.`,
    };
  }
  if (!realResult) {
    return {
      verdict: "SEMI-PRONTO",
      line: "SEMI-PRONTO: zero divergenze solo su casi sintetici, ma nessun caso reale eseguito. Non sufficiente per switch full.",
    };
  }
  return {
    verdict: "PRONTO TECNICAMENTE",
    line: "PRONTO TECNICAMENTE: zero divergenze critiche INCLUSO almeno 1 caso reale anonimizzato. Lo switch resta decisione separata.",
  };
}

function formatCounts(counts) {
  const entries = Object.entries(counts);
  if (!entries.length) return "- nessuna";
  return entries.map(([kind, count]) => `- ${kind}: ${count}`).join("\n");
}

function buildReport({ probeSummary, syntheticResults, realResult, readiness }) {
  const allResults = realResult ? [...syntheticResults, realResult] : syntheticResults;
  const divergenceCounts = countDivergences(allResults);
  const realBlock = realResult
    ? [
        "- `real_driver_case_executed`: si",
        `- legacy_has_driverId: ${realResult.legacyHasDriverId ? "si" : "no"}`,
        `- candidate_has_driverId: ${realResult.candidateHasDriverId ? "si" : "no"}`,
        `- same_driverId: ${realResult.sameDriverId ? "si" : "no"}`,
        `- legacy_match_count: ${typeof realResult.legacyMatchCount === "number" ? realResult.legacyMatchCount : "n/a"}`,
        `- candidate_match_count: ${typeof realResult.candidateMatchCount === "number" ? realResult.candidateMatchCount : "n/a"}`,
        `- divergence_kinds_observed: ${realResult.divergenceKinds.length ? realResult.divergenceKinds.join(", ") : "nessuna"}`,
      ].join("\n")
    : "- `real_driver_case_executed`: no";

  return `# Report Shadow Validation Fase A

## Stato documento
- Data: 2026-05-04
- Script: \`backend/internal-ai/server/lib/__diagnostics__/shadow-validation-report.mjs\`
- Runtime: read-only, nessuna scrittura Firestore/Storage
- Privacy: nessun nome, badge, targa, id o searchText reale salvato in questo report

## Firebase Admin
- credential.mode: ${probeSummary.credentialMode}
- credentialReady: ${probeSummary.credentialReady ? "si" : "no"}
- modulesReady: ${probeSummary.modulesReady ? "si" : "no"}
- canAttemptLiveRead: ${probeSummary.canAttemptLiveRead ? "si" : "no"}

## Input sintetici
${syntheticResults.map((result, index) => `${index + 1}. ${result.description}`).join("\n")}

## Caso reale anonimizzato
${realBlock}

## Metriche aggregate
- invocazioni_totali: ${allResults.length}
- input_sintetici: ${syntheticResults.length}
- casi_reali_anonimizzati: ${realResult ? 1 : 0}

### Divergenze per kind
${formatCounts(divergenceCounts)}

## Risultati sintetici aggregati
| Caso | Divergenze kind | Legacy has driverId | Candidate has driverId | Same driverId |
|---|---|---:|---:|---:|
${syntheticResults.map((result) => `| ${result.key} | ${result.divergenceKinds.length ? result.divergenceKinds.join(", ") : "nessuna"} | ${result.legacyHasDriverId ? "si" : "no"} | ${result.candidateHasDriverId ? "si" : "no"} | ${result.sameDriverId === null ? "n/a" : result.sameDriverId ? "si" : "no"} |`).join("\n")}

## Verdetto readiness switch
${readiness.line}

## Note
- Il vecchio resolver resta unica fonte runtime.
- Il nuovo resolver e' stato esercitato solo in diagnostica.
- Lo switch full resta decisione separata.
`;
}

async function main() {
  const probe = await probeInternalAiFirebaseAdminRuntime();
  const probeSummary = {
    credentialMode: probe?.credential?.mode ?? "unknown",
    credentialReady: probe?.credential?.isReady === true,
    modulesReady: probe?.modulesReady === true,
    canAttemptLiveRead: probe?.canAttemptLiveRead === true,
  };

  const syntheticCases = buildSyntheticCases();
  const syntheticResults = [];
  for (const testCase of syntheticCases) {
    syntheticResults.push(await runCase(testCase));
  }

  let realResult = null;
  if (probeSummary.canAttemptLiveRead) {
    const readonlyContext = await getInternalAiFirebaseAdminReadonlyContext();
    if (readonlyContext.status === "ready" && readonlyContext.firestore) {
      const realCase = await buildRealDriverCaseIfAvailable(readonlyContext);
      if (realCase) {
        realResult = await runCase(realCase);
      }
    }
  }

  const readiness = summarizeReadiness(realResult, syntheticResults);
  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(REPORT_PATH, buildReport({ probeSummary, syntheticResults, realResult, readiness }), "utf8");

  const stdoutSummary = {
    status: "completed",
    reportPath: "docs/audit/REPORT_SHADOW_VALIDATION_FASE_A_2026-05-04.md",
    firebaseAdmin: probeSummary,
    syntheticInvocations: syntheticResults.length,
    realDriverCaseExecuted: Boolean(realResult),
    realDriverMetrics: realResult
      ? {
          legacyHasDriverId: realResult.legacyHasDriverId,
          candidateHasDriverId: realResult.candidateHasDriverId,
          sameDriverId: realResult.sameDriverId,
          legacyMatchCount: realResult.legacyMatchCount,
          candidateMatchCount: realResult.candidateMatchCount,
          divergenceKindsObserved: realResult.divergenceKinds,
        }
      : null,
    divergenceCounts: countDivergences(realResult ? [...syntheticResults, realResult] : syntheticResults),
    readiness: readiness.verdict,
  };
  console.log(JSON.stringify(stdoutSummary, null, 2));
}

await main();
