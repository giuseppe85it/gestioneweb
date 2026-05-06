/*
 * Shadow comparator temporaneo.
 * Migrazione Fase A motore generico (SPEC_MOTORE_GENERICO_NEXT.md §8, §10.1).
 *
 * Decisione 2026-05-04: A + L2 + env flag CHAT_IA_SHADOW_RESOLVER.
 * Ritorna SEMPRE l'output del vecchio resolver. Il nuovo resolver e' solo osservato.
 * Da rimuovere in Fase E quando il vecchio resolver verra' archiviato.
 */

import { resolvePostLlmMessage } from "./post-llm-resolver.js";
import { runUniversalResolverFaseA } from "./universal-resolver.js";

const ENTRY_CONFIG_KEY_DRIVER360_COLLEGHI = "driver360.colleghi";
const MAX_DIVERGENCES_PER_CALL = 20;
const FORBIDDEN_LOG_FIELD_PATTERN = /note|nota|descrizione|testo|telefono|contatto|url/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function scalarForLog(value) {
  if (value === null) return null;
  if (typeof value === "undefined") return "<absent>";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return "<non_scalar>";
}

function buildDivergence(kind, field, legacy, candidate, entryConfigKey = ENTRY_CONFIG_KEY_DRIVER360_COLLEGHI) {
  return {
    kind,
    entryConfigKey,
    field,
    legacy: scalarForLog(legacy),
    candidate: scalarForLog(candidate),
  };
}

function shouldSkipLogField(field) {
  return FORBIDDEN_LOG_FIELD_PATTERN.test(String(field ?? ""));
}

function logDivergences(divergences) {
  const safeDivergences = divergences.filter((entry) => !shouldSkipLogField(entry.field));
  const capped = safeDivergences.slice(0, MAX_DIVERGENCES_PER_CALL);
  for (const divergence of capped) {
    console.warn("[shadow-comparator]", JSON.stringify(divergence));
  }
  if (safeDivergences.length > MAX_DIVERGENCES_PER_CALL) {
    console.warn("[shadow-comparator]", JSON.stringify({
      kind: "divergence_overflow",
      count: safeDivergences.length - MAX_DIVERGENCES_PER_CALL,
    }));
  }
}

function isResolvedFiltersV2(value) {
  return isPlainObject(value) && value.version === "resolvedFilters.v2" && Array.isArray(value.entries);
}

function buildUniversalInput(legacyResult, originalMessage, options) {
  const finalMessage = legacyResult?.finalMessage ?? originalMessage;
  if (
    finalMessage?.view !== "Driver360" ||
    finalMessage?.filters === null ||
    finalMessage?.filters?.entityKind !== "driver"
  ) {
    return {
      applicable: false,
      reasonField: "view",
      reasonValue: finalMessage?.view ?? null,
      input: null,
    };
  }

  const searchText = text(finalMessage?.filters?.searchText) || text(originalMessage?.filters?.searchText) || text(options?.prompt);
  if (!searchText) {
    return {
      applicable: false,
      reasonField: "filters.searchText",
      reasonValue: null,
      input: null,
    };
  }

  return {
    applicable: true,
    reasonField: null,
    reasonValue: null,
    input: {
      entryConfigKey: ENTRY_CONFIG_KEY_DRIVER360_COLLEGHI,
      matchInput: { searchText },
      query: {
        action: finalMessage?.action ?? null,
        view: finalMessage?.view ?? null,
        entityKind: finalMessage?.filters?.entityKind ?? null,
        searchText,
        periodPreset: finalMessage?.filters?.periodPreset ?? null,
      },
    },
  };
}

function readLegacyDriverComparable(legacyResult) {
  const finalMessage = legacyResult?.finalMessage ?? null;
  const resolvedFilters = isPlainObject(finalMessage?.resolvedFilters) ? finalMessage.resolvedFilters : {};
  const candidates = Array.isArray(finalMessage?.disambiguation?.candidates)
    ? finalMessage.disambiguation.candidates
    : null;
  return {
    driverId: typeof resolvedFilters.driverId === "string" ? resolvedFilters.driverId : null,
    candidateCount: candidates ? candidates.length : null,
  };
}

function readCandidateDriverComparable(candidateResult) {
  const firstEntry = Array.isArray(candidateResult?.entries) ? candidateResult.entries[0] : null;
  const records = Array.isArray(firstEntry?.records) ? firstEntry.records : [];
  const firstRecord = records[0] ?? null;
  const fieldDriverId = firstRecord?.fields?.id?.value;
  return {
    driverId:
      typeof candidateResult?.legacyDriver360?.driverId === "string"
        ? candidateResult.legacyDriver360.driverId
        : typeof fieldDriverId === "string"
          ? fieldDriverId
          : null,
    candidateCount: records.length,
  };
}

function compareDriver360(legacyResult, candidateResult) {
  const divergences = [];
  if (!isResolvedFiltersV2(candidateResult)) {
    divergences.push(buildDivergence("shape_mismatch", "resolvedFiltersV2", "resolvedFilters.v2", "<absent>"));
    return divergences;
  }

  const legacy = readLegacyDriverComparable(legacyResult);
  const candidate = readCandidateDriverComparable(candidateResult);

  if (legacy.driverId && !candidate.driverId) {
    divergences.push(buildDivergence("missing_in_new", "resolvedFilters.driverId", legacy.driverId, "<absent>"));
  } else if (!legacy.driverId && candidate.driverId) {
    divergences.push(buildDivergence("extra_in_new", "resolvedFilters.driverId", "<absent>", candidate.driverId));
  } else if (legacy.driverId && candidate.driverId && legacy.driverId !== candidate.driverId) {
    divergences.push(buildDivergence("value_diff", "resolvedFilters.driverId", legacy.driverId, candidate.driverId));
  }

  if (
    typeof legacy.candidateCount === "number" &&
    typeof candidate.candidateCount === "number" &&
    legacy.candidateCount !== candidate.candidateCount
  ) {
    divergences.push(
      buildDivergence("value_diff", "disambiguation.candidates.length", legacy.candidateCount, candidate.candidateCount),
    );
  }

  return divergences;
}

export async function runShadowComparator(message, options = {}) {
  const legacyResult = await resolvePostLlmMessage(message, options);
  const universalInput = buildUniversalInput(legacyResult, message, options);

  if (!universalInput.applicable) {
    logDivergences([
      buildDivergence("not_applicable", universalInput.reasonField, universalInput.reasonValue, "<absent>"),
    ]);
    return legacyResult;
  }

  try {
    const candidateResult = await runUniversalResolverFaseA(universalInput.input);
    logDivergences(compareDriver360(legacyResult, candidateResult));
  } catch (error) {
    logDivergences([
      buildDivergence(
        "new_resolver_error",
        "runUniversalResolverFaseA",
        "<absent>",
        error instanceof Error ? error.name : "<error>",
      ),
    ]);
  }

  return legacyResult;
}
