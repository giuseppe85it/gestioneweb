/*
 * Query Engine Chat IA NEXT.
 *
 * Orchestratore deterministico sopra il Resolver Universale Fase A.
 * Non cambia il runtime adapter: l'aggancio avviene in un blocco successivo.
 *
 * @typedef {Object} QueryEngineInput
 * @property {string} entryConfigKey
 * @property {Object=} matchInput
 * @property {Object=} query
 */

import { REGISTRY_CONFIG_FASE_A } from "./registry.config.js";
import { enrichResolvedFiltersWithRelations } from "./relation-resolver.js";
import { runUniversalResolverFaseA } from "./universal-resolver.js";

const ALLOWED_MATCH_INPUT_KEYS = Object.freeze([
  "searchText",
  "entityId",
  "entityKind",
  "view",
  "periodPreset",
  "dateFrom",
  "dateTo",
]);

const ALLOWED_QUERY_KEYS = Object.freeze([
  "action",
  "view",
  "entityKind",
  "searchText",
  "periodPreset",
  "dateFrom",
  "dateTo",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function pickAllowedFields(input, allowedKeys) {
  if (!isPlainObject(input)) return {};
  const output = {};
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      output[key] = input[key];
    }
  }
  return output;
}

function buildErrorOutput(input, entryConfigKey, kind, boundaryEntryId = null) {
  return {
    version: "resolvedFilters.v2",
    legacyDriver360: null,
    query: {
      action: input.query?.action ?? null,
      view: input.query?.view ?? null,
      entityKind: input.query?.entityKind ?? null,
      searchText: input.matchInput?.searchText ?? input.query?.searchText ?? null,
      periodPreset: input.query?.periodPreset ?? null,
    },
    entries: [],
    disambiguation: null,
    errors: [
      {
        kind,
        boundaryEntryId,
        entryConfigKey,
        messageKey: "error_view_unavailable",
      },
    ],
    unresolvedReason: kind,
  };
}

export async function runQueryEngine(input = {}) {
  const entryConfigKey = text(input.entryConfigKey);
  const entryConfig = REGISTRY_CONFIG_FASE_A.entries[entryConfigKey] ?? null;
  const normalizedInput = {
    entryConfigKey,
    matchInput: pickAllowedFields(input.matchInput, ALLOWED_MATCH_INPUT_KEYS),
    query: pickAllowedFields(input.query, ALLOWED_QUERY_KEYS),
  };

  if (!entryConfigKey || !entryConfig) {
    return buildErrorOutput(normalizedInput, entryConfigKey, "boundary_entry_not_found");
  }

  const resolvedFilters = await runUniversalResolverFaseA(normalizedInput);
  return enrichResolvedFiltersWithRelations(resolvedFilters, { entryConfigKey });
}
