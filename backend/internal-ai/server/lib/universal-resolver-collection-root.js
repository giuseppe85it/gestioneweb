/*
 * Ramo collection_root del Resolver Universale.
 *
 * Nessuna cache in v1: ogni richiesta legge la root collection entro il cap
 * dichiarato dal boundary readonly.
 */

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
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

function buildOutput(input, entryConfig, records, errors = []) {
  return {
    version: "resolvedFilters.v2",
    legacyDriver360: null,
    query: buildQueryMetadata(input),
    entries: [
      {
        boundaryEntryId: entryConfig.boundaryEntryId,
        sourceCollection: entryConfig.collection,
        accessModeUsed: entryConfig.accessMode,
        records,
        status: records.length ? "ok" : errors.length ? "error" : "empty",
      },
    ],
    disambiguation: null,
    errors: records.length
      ? []
      : errors.length
        ? errors
        : [
            {
              kind: "collection_empty",
              boundaryEntryId: entryConfig.boundaryEntryId,
              messageKey: "no_results",
            },
          ],
    unresolvedReason: records.length ? null : errors[0]?.kind ?? "collection_empty",
  };
}

function buildCertifiedRecord(entryConfig, boundaryEntry, docSnapshot, index) {
  const data = docSnapshot.data();
  if (!isPlainObject(data)) return null;

  const raw = {
    __docId: docSnapshot.id,
    ...data,
  };
  const allowedFields = Array.from(new Set(boundaryEntry.allowedFields ?? []));
  const forbiddenFields = Array.from(new Set(boundaryEntry.forbiddenFields ?? []));
  const fields = projectCertifiedFields(raw, allowedFields, forbiddenFields);
  if (!fields) return null;

  const recordId = text(raw.id) || text(raw.__docId) || `${entryConfig.datasetKey}:${index}`;
  return {
    sourceRecordId: recordId,
    fields,
    provenance: {
      sourceCollection: entryConfig.collection,
      sourceRecordId: recordId,
      sourceFields: Object.keys(fields),
      accessModeUsed: entryConfig.accessMode,
      boundaryEntryId: entryConfig.boundaryEntryId,
      confidence: "certified",
    },
  };
}

export async function runCollectionRootResolver({ input = {}, entryConfig, boundaryEntry, firestore }) {
  if (!entryConfig || !boundaryEntry || !firestore) {
    return buildOutput(input, entryConfig, [], [
      {
        kind: "firestore_error",
        boundaryEntryId: entryConfig?.boundaryEntryId ?? null,
        messageKey: "error_view_unavailable",
      },
    ]);
  }

  try {
    const maxDocumentReads = Number(boundaryEntry.requestLimits?.maxDocumentReadsPerRequest ?? 20);
    const safeLimit = Number.isFinite(maxDocumentReads) && maxDocumentReads > 0 ? Math.floor(maxDocumentReads) : 20;
    const snapshot = await firestore.collection(entryConfig.collection).limit(safeLimit).get();
    const records = snapshot.docs
      .map((docSnapshot, index) => buildCertifiedRecord(entryConfig, boundaryEntry, docSnapshot, index))
      .filter(Boolean);

    return buildOutput(input, entryConfig, records);
  } catch (error) {
    return buildOutput(input, entryConfig, [], [
      {
        kind: "firestore_error",
        boundaryEntryId: entryConfig.boundaryEntryId,
        messageKey: "error_view_unavailable",
        detail: error instanceof Error ? error.message : String(error),
      },
    ]);
  }
}
