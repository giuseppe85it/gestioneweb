/*
 * Resolver Universale Fase A.
 *
 * Modulo non instradato: affianca il post-llm-resolver Driver360-specifico
 * senza modificarlo. In Fase A supporta solo accessMode exact_document.
 *
 * @typedef {Object} UniversalResolverFaseAInput
 * @property {string} entryConfigKey - Chiave in REGISTRY_CONFIG_FASE_A.entries.
 * @property {Object=} matchInput - Filtri deterministici opzionali.
 * @property {string=} matchInput.searchText - Testo ricerca gia' validato a monte.
 * @property {Object=} query - Metadati query da riportare nel collettore.
 *
 * @returns {Promise<Object>} ResolvedFiltersV2 shape-like, multi-record-ready.
 */

import { getInternalAiFirebaseAdminReadonlyContext } from "../internal-ai-firebase-admin.js";
import { readInternalAiFirebaseReadonlyBoundary } from "../internal-ai-firebase-readonly-boundary.js";
import { runCollectionRootResolver } from "./universal-resolver-collection-root.js";
import { REGISTRY_CONFIG_FASE_A } from "./registry.config.js";

const DRIVER_QUERY_STOPWORDS = new Set([
  "apri",
  "aprimi",
  "cerca",
  "dammi",
  "del",
  "della",
  "di",
  "driver",
  "fammi",
  "mostra",
  "mostrami",
  "profilo",
  "scheda",
  "autista",
  "conducente",
  "collega",
]);

const PLATE_TOKEN_PATTERN = /\b[A-Z]{2}\d{6}\b/gi;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNominalValue(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactNominalValue(value) {
  return normalizeNominalValue(value).replace(/\s+/g, "");
}

function normalizeDriverSearchText(value) {
  return text(value).replace(PLATE_TOKEN_PATTERN, " ").replace(/\s+/g, " ").trim();
}

function tokenizeDriverSearchText(value) {
  return normalizeNominalValue(normalizeDriverSearchText(value))
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token && !DRIVER_QUERY_STOPWORDS.has(token));
}

function unwrapStorageItems(rawDoc) {
  if (!rawDoc) return [];
  if (Array.isArray(rawDoc)) return rawDoc;
  if (!isPlainObject(rawDoc)) return [];
  if (Array.isArray(rawDoc.items)) return rawDoc.items;
  if (Array.isArray(rawDoc.value)) return rawDoc.value;
  if (isPlainObject(rawDoc.value) && Array.isArray(rawDoc.value.items)) {
    return rawDoc.value.items;
  }
  return [];
}

function inferValueType(value) {
  if (value === null || typeof value === "undefined") return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && typeof value.toDate === "function") return "timestamp";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}

function projectCertifiedFields(raw, allowedFields, forbiddenFields) {
  if (!isPlainObject(raw)) return null;
  const forbidden = new Set(forbiddenFields);
  const fields = {};
  for (const field of allowedFields) {
    if (forbidden.has(field)) continue;
    if (Object.prototype.hasOwnProperty.call(raw, field)) {
      fields[field] = {
        value: raw[field],
        sourceField: field,
        sourceValueType: inferValueType(raw[field]),
      };
    }
  }
  return fields;
}

function getFirstFieldText(raw, fields) {
  for (const field of fields) {
    const value = text(raw[field]);
    if (value) return value;
  }
  return "";
}

function matchesDriverColleghiRecord(raw, matchInput) {
  const searchText = text(matchInput?.searchText);
  if (!searchText) return true;

  const displayName = getFirstFieldText(raw, ["nome", "nomeCompleto", "label"]);
  const badge = text(raw.badge);
  const codice = text(raw.codice);
  const queryTokens = tokenizeDriverSearchText(searchText);
  const queryCompact = compactNominalValue(normalizeDriverSearchText(searchText));

  if (!queryTokens.length && !queryCompact) return false;
  if (queryCompact && compactNominalValue(displayName) === queryCompact) return true;
  if (queryCompact && (compactNominalValue(badge) === queryCompact || compactNominalValue(codice) === queryCompact)) {
    return true;
  }
  if (!queryTokens.length) return false;

  const nameTokens = normalizeNominalValue(displayName).split(" ").filter(Boolean);
  return queryTokens.every((token) => nameTokens.includes(token));
}

function matchesEntryRecord(entryConfig, raw, matchInput) {
  if (entryConfig.matchStrategy === "driver_name_or_badge_exact_token_match") {
    return matchesDriverColleghiRecord(raw, matchInput);
  }
  return true;
}

function buildQueryMetadata(input) {
  const query = isPlainObject(input?.query) ? input.query : {};
  const matchSearchText = text(input?.matchInput?.searchText);
  return {
    action: query.action ?? null,
    view: query.view ?? null,
    entityKind: query.entityKind ?? null,
    searchText: matchSearchText || query.searchText || null,
    periodPreset: query.periodPreset ?? null,
  };
}

function buildEmptyOutput(input, entryConfig, status, errors = []) {
  return {
    version: "resolvedFilters.v2",
    legacyDriver360: null,
    query: buildQueryMetadata(input),
    entries: entryConfig
      ? [
          {
            boundaryEntryId: entryConfig.boundaryEntryId,
            sourceCollection: entryConfig.collection,
            accessModeUsed: entryConfig.accessMode,
            records: [],
            status,
          },
        ]
      : [],
    disambiguation: null,
    errors,
    unresolvedReason: errors[0]?.kind ?? (status === "empty" ? "collection_empty" : null),
  };
}

function buildCertifiedRecord(entryConfig, raw, index, boundaryAllowedFields, boundaryForbiddenFields) {
  const fields = projectCertifiedFields(raw, boundaryAllowedFields, boundaryForbiddenFields);
  if (!fields) return null;

  const recordId = text(raw.id) || text(raw.badge) || `${entryConfig.datasetKey}:${index}`;
  const sourceFields = Object.keys(fields);
  return {
    sourceRecordId: recordId,
    fields,
    provenance: {
      sourceCollection: `${entryConfig.collection}/${entryConfig.docId}`,
      sourceRecordId: recordId,
      sourceFields,
      accessModeUsed: entryConfig.accessMode,
      boundaryEntryId: entryConfig.boundaryEntryId,
      confidence: "certified",
    },
  };
}

function buildSuccessOutput(input, entryConfig, records) {
  const firstRecord = records[0] ?? null;
  return {
    version: "resolvedFilters.v2",
    legacyDriver360:
      records.length === 1 && firstRecord?.fields?.id?.value
        ? { driverId: String(firstRecord.fields.id.value) }
        : null,
    query: buildQueryMetadata(input),
    entries: [
      {
        boundaryEntryId: entryConfig.boundaryEntryId,
        sourceCollection: entryConfig.collection,
        accessModeUsed: entryConfig.accessMode,
        records,
        status: records.length ? "ok" : "empty",
      },
    ],
    disambiguation: null,
    errors: records.length
      ? []
      : [
          {
            kind: "collection_empty",
            boundaryEntryId: entryConfig.boundaryEntryId,
            messageKey: "no_results",
          },
        ],
    unresolvedReason: records.length ? null : "collection_empty",
  };
}

function findBoundaryEntry(boundary, entryConfig) {
  return boundary?.firestore?.allowedReads?.find(
    (entry) =>
      entry.id === entryConfig.boundaryEntryId &&
      entry.service === "firestore" &&
      entry.accessMode === entryConfig.accessMode &&
      entry.collection === entryConfig.collection &&
      (entryConfig.accessMode === "collection_root" || entry.docId === entryConfig.docId),
  ) ?? null;
}

function assertBoundaryCoversConfig(boundaryEntry, entryConfig) {
  const boundaryAllowedFields = Array.isArray(boundaryEntry.allowedFields) ? boundaryEntry.allowedFields : [];
  const missingAllowedFields = entryConfig.allowedFields.filter((field) => !boundaryAllowedFields.includes(field));
  if (missingAllowedFields.length) {
    return {
      ok: false,
      missingAllowedFields,
    };
  }
  return { ok: true, missingAllowedFields: [] };
}

export async function runUniversalResolverFaseA(input = {}) {
  const entryConfig = REGISTRY_CONFIG_FASE_A.entries[input.entryConfigKey] ?? null;
  if (!entryConfig) {
    return buildEmptyOutput(input, null, "error", [
      {
        kind: "boundary_entry_not_found",
        boundaryEntryId: null,
        messageKey: "error_view_unavailable",
      },
    ]);
  }

  if (entryConfig.accessMode !== "exact_document" && entryConfig.accessMode !== "collection_root") {
    return buildEmptyOutput(input, entryConfig, "error", [
      {
        kind: "shape_rejected",
        boundaryEntryId: entryConfig.boundaryEntryId,
        messageKey: "error_view_unavailable",
      },
    ]);
  }

  try {
    const boundaryEntry = findBoundaryEntry(readInternalAiFirebaseReadonlyBoundary(), entryConfig);
    if (!boundaryEntry) {
      return buildEmptyOutput(input, entryConfig, "error", [
        {
          kind: "boundary_entry_not_found",
          boundaryEntryId: entryConfig.boundaryEntryId,
          messageKey: "error_view_unavailable",
        },
      ]);
    }

    const coverage = assertBoundaryCoversConfig(boundaryEntry, entryConfig);
    if (!coverage.ok) {
      return buildEmptyOutput(input, entryConfig, "error", [
        {
          kind: "shape_rejected",
          boundaryEntryId: entryConfig.boundaryEntryId,
          messageKey: "error_view_unavailable",
          missingAllowedFields: coverage.missingAllowedFields,
        },
      ]);
    }

    if (entryConfig.accessMode === "collection_root") {
      const readonlyContext = await getInternalAiFirebaseAdminReadonlyContext();
      if (readonlyContext.status !== "ready" || !readonlyContext.firestore) {
        return buildEmptyOutput(input, entryConfig, "error", [
          {
            kind: "firestore_error",
            boundaryEntryId: entryConfig.boundaryEntryId,
            messageKey: "error_view_unavailable",
          },
        ]);
      }

      return runCollectionRootResolver({
        input,
        entryConfig,
        boundaryEntry,
        firestore: readonlyContext.firestore,
      });
    }

    const readonlyContext = await getInternalAiFirebaseAdminReadonlyContext();
    if (readonlyContext.status !== "ready" || !readonlyContext.firestore) {
      return buildEmptyOutput(input, entryConfig, "error", [
        {
          kind: "firestore_error",
          boundaryEntryId: entryConfig.boundaryEntryId,
          messageKey: "error_view_unavailable",
        },
      ]);
    }

    const snapshot = await readonlyContext.firestore.collection(entryConfig.collection).doc(entryConfig.docId).get();
    if (!snapshot.exists) {
      return buildEmptyOutput(input, entryConfig, "not_found");
    }

    const rawItems = unwrapStorageItems(snapshot.data());
    if (!rawItems.length) {
      return buildSuccessOutput(input, entryConfig, []);
    }

    const maxReturned = Number(boundaryEntry.requestLimits?.maxReturnedVehicleRecords ?? rawItems.length);
    const boundaryAllowedFields = Array.from(new Set(boundaryEntry.allowedFields ?? []));
    const boundaryForbiddenFields = Array.from(new Set(boundaryEntry.forbiddenFields ?? []));
    const records = rawItems
      .filter((raw) => matchesEntryRecord(entryConfig, raw, input.matchInput ?? {}))
      .slice(0, maxReturned)
      .map((raw, index) =>
        buildCertifiedRecord(entryConfig, raw, index, boundaryAllowedFields, boundaryForbiddenFields),
      )
      .filter(Boolean);

    return buildSuccessOutput(input, entryConfig, records);
  } catch (error) {
    return buildEmptyOutput(input, entryConfig, "error", [
      {
        kind: "firestore_error",
        boundaryEntryId: entryConfig.boundaryEntryId,
        messageKey: "error_view_unavailable",
        detail: error instanceof Error ? error.message : String(error),
      },
    ]);
  }
}
