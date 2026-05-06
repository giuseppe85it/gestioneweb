const ACTION_ENUM = new Set([
  "view_open",
  "disambiguation_request",
  "clarification_request",
  "error",
  "report_request",
]);

const VIEW_ENUM = new Set([
  "Driver360",
  "Vehicle360",
  "Site360",
  "Euromecc360",
  "Ricerca360",
]);

const ENTITY_KIND_ENUM = new Set(["driver", "vehicle", "site", "supplier", "euromecc"]);
const PERIOD_PRESET_ENUM = new Set([
  "all",
  "last_7d",
  "last_30d",
  "last_90d",
  "this_month",
  "this_year",
  "custom",
]);

const CLARIFICATION_KIND_ENUM = new Set([
  "missing_subject",
  "missing_period",
  "ambiguous_scope",
]);

const FIELD_HINT_ENUM = new Set(["period", "subject", "scope"]);

const ACCOMPANIMENT_KIND_ENUM = new Set([
  "view_opened",
  "no_results",
  "disambiguation_required",
  "clarify_too_many_results",
  "clarify_period_required",
  "error_intent_not_in_catalog",
  "error_view_unavailable",
]);

const REPORT_TEMPLATE_ENUM = new Set([
  "driver_monthly",
  "vehicle_monthly",
  "vehicle_costs",
  "site_activity",
  "euromecc_status",
]);

const REPORT_SUBJECT_KIND_ENUM = new Set(["driver", "vehicle", "site", "euromecc"]);
const ACCESS_MODE_ENUM = new Set([
  "exact_document",
  "collection_root",
  "exact_object_path_from_firestore_field",
]);
const RESOLVED_FILTERS_ENTRY_STATUS_ENUM = new Set(["ok", "empty", "error", "not_found"]);
const UNSAFE_RESOLVED_FILTER_FIELD_NAMES = new Set([
  "apikey",
  "token",
  "password",
  "secret",
  "telefono",
  "telefonoprivato",
  "telefoniaggiuntivi",
  "email",
  "indirizzo",
  "pinsim",
  "puksim",
  "schedecarburante",
  "downloadurl",
  "fileurl",
  "pdfurl",
  "url",
  "imageurls",
  "fotourl",
  "note",
  "messaggio",
  "commento",
  "testo",
  "dettaglio",
  "rawtext",
  "extractedtext",
  "riepilogobreve",
  "analisicosti",
  "anomalie",
  "fornitorinotevoli",
]);
const SIGNED_URL_PATTERN = /https?:\/\/|firebasestorage|googleapis\.com\/storage|alt=media|X-Goog-/i;

const TOP_LEVEL_FIELDS = new Set([
  "action",
  "view",
  "filters",
  "clarification",
  "disambiguation",
  "report",
  "accompaniment",
]);

const BACKEND_TOP_LEVEL_FIELDS = new Set([
  ...TOP_LEVEL_FIELDS,
  "resolvedFilters",
]);

const FORBIDDEN_FIELDS = new Set([
  "text",
  "blocks",
  "entities",
  "sources",
  "notices",
  "summary",
  "narrative",
  "description",
  "comment",
  "explanation",
  "reasoning",
]);

const REPORT_FORBIDDEN_FIELDS = new Set([
  "subjectId",
  "driverId",
  "vehiclePlate",
  "siteId",
  "displayLabel",
  "label",
  "period",
  "from",
  "to",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pathOf(path, field) {
  return path ? `${path}.${field}` : field;
}

function hasOnlyFields(value, allowedFields, path, errors) {
  for (const field of Object.keys(value)) {
    if (!allowedFields.has(field)) {
      errors.push(`${pathOf(path, field)} non e' ammesso`);
    }
  }
}

function requireFields(value, requiredFields, path, errors) {
  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(value, field)) {
      errors.push(`${pathOf(path, field)} e' obbligatorio`);
    }
  }
}

function collectForbiddenFields(value, errors, path = "") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenFields(item, errors, `${path}[${index}]`));
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const [field, nestedValue] of Object.entries(value)) {
    const fieldPath = pathOf(path, field);
    if (FORBIDDEN_FIELDS.has(field)) {
      errors.push(`${fieldPath} e' un campo narrativo vietato`);
    }
    collectForbiddenFields(nestedValue, errors, fieldPath);
  }
}

function validateNullableEnum(value, enumSet, path, errors) {
  if (value === null) {
    return;
  }
  if (typeof value !== "string" || !enumSet.has(value)) {
    errors.push(`${path} deve essere null o un valore enum ammesso`);
  }
}

function normalizeFieldName(value) {
  return typeof value === "string" ? value.replace(/[^a-z0-9]/gi, "").toLowerCase() : "";
}

function isUnsafeResolvedFilterFieldName(value) {
  return UNSAFE_RESOLVED_FILTER_FIELD_NAMES.has(normalizeFieldName(value));
}

function validateSafeResolvedFilterPayload(value, path, errors) {
  if (typeof value === "string") {
    if (SIGNED_URL_PATTERN.test(value)) {
      errors.push(`${path} contiene URL o riferimento Storage non ammesso`);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => validateSafeResolvedFilterPayload(item, `${path}[${index}]`, errors));
    return;
  }

  if (!isPlainObject(value)) {
    return;
  }

  for (const [field, nestedValue] of Object.entries(value)) {
    if (isUnsafeResolvedFilterFieldName(field)) {
      errors.push(`${pathOf(path, field)} e' un campo non ammesso nei resolvedFilters certificati`);
    }
    validateSafeResolvedFilterPayload(nestedValue, pathOf(path, field), errors);
  }
}

function validateFilters(value, errors) {
  if (value === null) {
    return;
  }
  if (!isPlainObject(value)) {
    errors.push("filters deve essere null o oggetto");
    return;
  }

  const allowed = new Set(["searchText", "entityKind", "periodPreset"]);
  hasOnlyFields(value, allowed, "filters", errors);
  requireFields(value, allowed, "filters", errors);

  if (value.searchText !== null && typeof value.searchText !== "string") {
    errors.push("filters.searchText deve essere string o null");
  }
  validateNullableEnum(value.entityKind, ENTITY_KIND_ENUM, "filters.entityKind", errors);
  validateNullableEnum(value.periodPreset, PERIOD_PRESET_ENUM, "filters.periodPreset", errors);
}

function validateClarification(value, errors) {
  if (value === null) {
    return;
  }
  if (!isPlainObject(value)) {
    errors.push("clarification deve essere null o oggetto");
    return;
  }

  const allowed = new Set(["kind", "params"]);
  hasOnlyFields(value, allowed, "clarification", errors);
  requireFields(value, allowed, "clarification", errors);

  if (typeof value.kind !== "string" || !CLARIFICATION_KIND_ENUM.has(value.kind)) {
    errors.push("clarification.kind deve essere un enum ammesso");
  }

  if (value.params === null) {
    return;
  }
  if (!isPlainObject(value.params)) {
    errors.push("clarification.params deve essere null o oggetto");
    return;
  }

  const paramsAllowed = new Set(["fieldHint"]);
  hasOnlyFields(value.params, paramsAllowed, "clarification.params", errors);
  if (
    Object.prototype.hasOwnProperty.call(value.params, "fieldHint") &&
    (typeof value.params.fieldHint !== "string" || !FIELD_HINT_ENUM.has(value.params.fieldHint))
  ) {
    errors.push("clarification.params.fieldHint deve essere un enum ammesso");
  }
}

function validateDisambiguationCandidate(value, index, errors) {
  if (!isPlainObject(value)) {
    errors.push(`disambiguation.candidates[${index}] deve essere oggetto`);
    return;
  }

  const path = `disambiguation.candidates[${index}]`;
  const allowed = new Set(["id", "plate", "displayLabel", "kind"]);
  hasOnlyFields(value, allowed, path, errors);

  if (
    Object.prototype.hasOwnProperty.call(value, "id") &&
    value.id !== undefined &&
    typeof value.id !== "string"
  ) {
    errors.push(`${path}.id deve essere string`);
  }
  if (
    Object.prototype.hasOwnProperty.call(value, "plate") &&
    value.plate !== undefined &&
    typeof value.plate !== "string"
  ) {
    errors.push(`${path}.plate deve essere string`);
  }
  if (typeof value.displayLabel !== "string" || !value.displayLabel.trim()) {
    errors.push(`${path}.displayLabel deve essere string non vuota`);
  }
  if (
    Object.prototype.hasOwnProperty.call(value, "kind") &&
    value.kind !== undefined &&
    (typeof value.kind !== "string" || !ENTITY_KIND_ENUM.has(value.kind))
  ) {
    errors.push(`${path}.kind deve essere un enum ammesso`);
  }
}

function validateDisambiguation(value, errors, options = {}) {
  if (value === null) {
    return;
  }
  if (!isPlainObject(value)) {
    errors.push("disambiguation deve essere null o oggetto");
    return;
  }

  const allowed = options.allowCandidates
    ? new Set(["disambiguation_required", "candidates"])
    : new Set(["disambiguation_required"]);
  hasOnlyFields(value, allowed, "disambiguation", errors);
  requireFields(value, new Set(["disambiguation_required"]), "disambiguation", errors);

  if (value.disambiguation_required !== true) {
    errors.push("disambiguation.disambiguation_required deve essere true");
  }

  if (Object.prototype.hasOwnProperty.call(value, "candidates")) {
    if (!options.allowCandidates) {
      errors.push("disambiguation.candidates e' vietato nell'output LLM");
      return;
    }
    if (!Array.isArray(value.candidates)) {
      errors.push("disambiguation.candidates deve essere array");
      return;
    }
    value.candidates.forEach((candidate, index) =>
      validateDisambiguationCandidate(candidate, index, errors),
    );
  }
}

function validateReport(value, errors) {
  if (value === null) {
    return;
  }
  if (!isPlainObject(value)) {
    errors.push("report deve essere null o oggetto");
    return;
  }

  const allowed = new Set(["template", "subjectKind", "periodPreset"]);
  hasOnlyFields(value, allowed, "report", errors);
  requireFields(value, allowed, "report", errors);

  for (const field of Object.keys(value)) {
    if (REPORT_FORBIDDEN_FIELDS.has(field)) {
      errors.push(`report.${field} e' vietato: i dati reali sono risolti dal backend`);
    }
  }

  if (typeof value.template !== "string" || !REPORT_TEMPLATE_ENUM.has(value.template)) {
    errors.push("report.template deve essere un enum ammesso");
  }
  if (typeof value.subjectKind !== "string" || !REPORT_SUBJECT_KIND_ENUM.has(value.subjectKind)) {
    errors.push("report.subjectKind deve essere un enum ammesso");
  }
  validateNullableEnum(value.periodPreset, PERIOD_PRESET_ENUM, "report.periodPreset", errors);
}

function validateAccompaniment(value, errors) {
  if (!isPlainObject(value)) {
    errors.push("accompaniment deve essere oggetto");
    return;
  }

  const allowed = new Set(["kind", "params"]);
  hasOnlyFields(value, allowed, "accompaniment", errors);
  requireFields(value, allowed, "accompaniment", errors);

  if (typeof value.kind !== "string" || !ACCOMPANIMENT_KIND_ENUM.has(value.kind)) {
    errors.push("accompaniment.kind deve essere un enum ammesso");
  }

  if (value.params === null) {
    return;
  }
  if (!isPlainObject(value.params)) {
    errors.push("accompaniment.params deve essere null o oggetto");
    return;
  }

  const paramsAllowed = new Set(["count"]);
  hasOnlyFields(value.params, paramsAllowed, "accompaniment.params", errors);
  if (
    Object.prototype.hasOwnProperty.call(value.params, "count") &&
    (!Number.isFinite(value.params.count) || value.params.count < 0)
  ) {
    errors.push("accompaniment.params.count deve essere numero non negativo");
  }
}

function validateResolvedFilters(value, errors) {
  if (value === null || value === undefined) {
    return;
  }
  if (!isPlainObject(value)) {
    errors.push("resolvedFilters deve essere null o oggetto");
    return;
  }

  if (value.version === "resolvedFilters.v2") {
    validateResolvedFiltersV2(value, errors);
    return;
  }

  const allowed = new Set(["driverId", "vehiclePlate", "siteId", "period"]);
  hasOnlyFields(value, allowed, "resolvedFilters", errors);

  for (const field of ["driverId", "vehiclePlate", "siteId"]) {
    if (
      Object.prototype.hasOwnProperty.call(value, field) &&
      value[field] !== undefined &&
      value[field] !== null &&
      typeof value[field] !== "string"
    ) {
      errors.push(`resolvedFilters.${field} deve essere string o null`);
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(value, "period") &&
    value.period !== null &&
    value.period !== undefined
  ) {
    if (!isPlainObject(value.period)) {
      errors.push("resolvedFilters.period deve essere null o oggetto");
      return;
    }
    const periodAllowed = new Set(["from", "to"]);
    hasOnlyFields(value.period, periodAllowed, "resolvedFilters.period", errors);
    requireFields(value.period, periodAllowed, "resolvedFilters.period", errors);
    if (typeof value.period.from !== "string" || typeof value.period.to !== "string") {
      errors.push("resolvedFilters.period.from/to devono essere string");
    }
  }
}

function validateResolvedFiltersV2Query(value, errors) {
  if (!isPlainObject(value)) {
    errors.push("resolvedFilters.query deve essere oggetto");
    return;
  }

  const allowed = new Set(["action", "view", "entityKind", "searchText", "periodPreset"]);
  hasOnlyFields(value, allowed, "resolvedFilters.query", errors);
  requireFields(value, allowed, "resolvedFilters.query", errors);
  validateNullableEnum(value.action, ACTION_ENUM, "resolvedFilters.query.action", errors);
  validateNullableEnum(value.view, VIEW_ENUM, "resolvedFilters.query.view", errors);
  validateNullableEnum(value.entityKind, ENTITY_KIND_ENUM, "resolvedFilters.query.entityKind", errors);
  validateNullableEnum(value.periodPreset, PERIOD_PRESET_ENUM, "resolvedFilters.query.periodPreset", errors);
  if (value.searchText !== null && typeof value.searchText !== "string") {
    errors.push("resolvedFilters.query.searchText deve essere string o null");
  }
}

function validateResolvedFiltersV2LegacyDriver(value, errors) {
  if (value === null) return;
  if (!isPlainObject(value)) {
    errors.push("resolvedFilters.legacyDriver360 deve essere null o oggetto");
    return;
  }

  const allowed = new Set(["driverId"]);
  hasOnlyFields(value, allowed, "resolvedFilters.legacyDriver360", errors);
  if (
    Object.prototype.hasOwnProperty.call(value, "driverId") &&
    value.driverId !== null &&
    value.driverId !== undefined &&
    typeof value.driverId !== "string"
  ) {
    errors.push("resolvedFilters.legacyDriver360.driverId deve essere string o null");
  }
}

function validateStringArray(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path} deve essere array`);
    return;
  }
  value.forEach((item, index) => {
    if (typeof item !== "string") {
      errors.push(`${path}[${index}] deve essere string`);
    }
  });
}

function validateCertifiedField(value, path, fieldName, errors) {
  if (isUnsafeResolvedFilterFieldName(fieldName)) {
    errors.push(`${path} usa un campo non ammesso`);
  }
  if (!isPlainObject(value)) {
    errors.push(`${path} deve essere oggetto`);
    return;
  }

  const allowed = new Set(["value", "sourceField", "sourceValueType"]);
  hasOnlyFields(value, allowed, path, errors);
  requireFields(value, new Set(["value", "sourceField"]), path, errors);
  if (typeof value.sourceField !== "string" || !value.sourceField.trim()) {
    errors.push(`${path}.sourceField deve essere string non vuota`);
  } else if (isUnsafeResolvedFilterFieldName(value.sourceField)) {
    errors.push(`${path}.sourceField e' un campo non ammesso`);
  }
  if (
    Object.prototype.hasOwnProperty.call(value, "sourceValueType") &&
    value.sourceValueType !== undefined &&
    value.sourceValueType !== null &&
    typeof value.sourceValueType !== "string"
  ) {
    errors.push(`${path}.sourceValueType deve essere string o null`);
  }
  validateSafeResolvedFilterPayload(value.value, `${path}.value`, errors);
}

function validateCertifiedRecordProvenance(value, path, errors) {
  if (!isPlainObject(value)) {
    errors.push(`${path} deve essere oggetto`);
    return;
  }

  const allowed = new Set([
    "sourceCollection",
    "sourceRecordId",
    "sourceFields",
    "accessModeUsed",
    "boundaryEntryId",
    "confidence",
  ]);
  hasOnlyFields(value, allowed, path, errors);
  requireFields(value, new Set(["sourceCollection", "sourceRecordId", "sourceFields", "accessModeUsed", "boundaryEntryId"]), path, errors);

  for (const field of ["sourceCollection", "sourceRecordId", "accessModeUsed", "boundaryEntryId"]) {
    if (typeof value[field] !== "string" || !value[field].trim()) {
      errors.push(`${path}.${field} deve essere string non vuota`);
    }
  }
  if (typeof value.accessModeUsed === "string") {
    validateNullableEnum(value.accessModeUsed, ACCESS_MODE_ENUM, `${path}.accessModeUsed`, errors);
  }
  validateStringArray(value.sourceFields, `${path}.sourceFields`, errors);
  if (
    Object.prototype.hasOwnProperty.call(value, "confidence") &&
    value.confidence !== undefined &&
    value.confidence !== null &&
    typeof value.confidence !== "string"
  ) {
    errors.push(`${path}.confidence deve essere string o null`);
  }
  validateSafeResolvedFilterPayload(value, path, errors);
}

function validateCertifiedRelationProof(value, path, errors) {
  if (!isPlainObject(value)) {
    errors.push(`${path} deve essere oggetto`);
    return;
  }

  const allowed = new Set(["relationKind", "sourceCollection", "sourceRecordId", "sourceField", "rule", "certainty"]);
  hasOnlyFields(value, allowed, path, errors);
  requireFields(value, allowed, path, errors);
  for (const field of allowed) {
    if (typeof value[field] !== "string" || !value[field].trim()) {
      errors.push(`${path}.${field} deve essere string non vuota`);
    }
  }
  if (typeof value.sourceField === "string" && isUnsafeResolvedFilterFieldName(value.sourceField)) {
    errors.push(`${path}.sourceField e' un campo non ammesso`);
  }
  validateSafeResolvedFilterPayload(value, path, errors);
}

function validateCertifiedRelation(value, path, errors) {
  if (!isPlainObject(value)) {
    errors.push(`${path} deve essere oggetto`);
    return;
  }

  const allowed = new Set(["relationKind", "targetLabel", "relationProof"]);
  hasOnlyFields(value, allowed, path, errors);
  requireFields(value, new Set(["relationKind", "relationProof"]), path, errors);
  if (typeof value.relationKind !== "string" || !value.relationKind.trim()) {
    errors.push(`${path}.relationKind deve essere string non vuota`);
  }
  if (
    Object.prototype.hasOwnProperty.call(value, "targetLabel") &&
    value.targetLabel !== undefined &&
    value.targetLabel !== null &&
    typeof value.targetLabel !== "string"
  ) {
    errors.push(`${path}.targetLabel deve essere string o null`);
  }
  validateCertifiedRelationProof(value.relationProof, `${path}.relationProof`, errors);
}

function validateCertifiedRecord(value, path, errors) {
  if (!isPlainObject(value)) {
    errors.push(`${path} deve essere oggetto`);
    return;
  }

  const allowed = new Set(["sourceRecordId", "fields", "provenance", "relations"]);
  hasOnlyFields(value, allowed, path, errors);
  requireFields(value, new Set(["sourceRecordId", "fields", "provenance"]), path, errors);
  if (typeof value.sourceRecordId !== "string" || !value.sourceRecordId.trim()) {
    errors.push(`${path}.sourceRecordId deve essere string non vuota`);
  }
  if (!isPlainObject(value.fields)) {
    errors.push(`${path}.fields deve essere oggetto`);
  } else {
    for (const [fieldName, fieldValue] of Object.entries(value.fields)) {
      validateCertifiedField(fieldValue, `${path}.fields.${fieldName}`, fieldName, errors);
    }
  }
  validateCertifiedRecordProvenance(value.provenance, `${path}.provenance`, errors);
  if (Object.prototype.hasOwnProperty.call(value, "relations")) {
    if (!Array.isArray(value.relations)) {
      errors.push(`${path}.relations deve essere array`);
    } else {
      value.relations.forEach((relation, index) =>
        validateCertifiedRelation(relation, `${path}.relations[${index}]`, errors),
      );
    }
  }
  validateSafeResolvedFilterPayload(value, path, errors);
}

function validateResolvedFiltersV2Entry(value, index, errors) {
  const path = `resolvedFilters.entries[${index}]`;
  if (!isPlainObject(value)) {
    errors.push(`${path} deve essere oggetto`);
    return;
  }

  const allowed = new Set(["boundaryEntryId", "sourceCollection", "accessModeUsed", "records", "status"]);
  hasOnlyFields(value, allowed, path, errors);
  requireFields(value, allowed, path, errors);
  for (const field of ["boundaryEntryId", "sourceCollection", "accessModeUsed", "status"]) {
    if (typeof value[field] !== "string" || !value[field].trim()) {
      errors.push(`${path}.${field} deve essere string non vuota`);
    }
  }
  if (typeof value.accessModeUsed === "string") {
    validateNullableEnum(value.accessModeUsed, ACCESS_MODE_ENUM, `${path}.accessModeUsed`, errors);
  }
  if (typeof value.status === "string") {
    validateNullableEnum(value.status, RESOLVED_FILTERS_ENTRY_STATUS_ENUM, `${path}.status`, errors);
  }
  if (!Array.isArray(value.records)) {
    errors.push(`${path}.records deve essere array`);
  } else {
    value.records.forEach((record, recordIndex) =>
      validateCertifiedRecord(record, `${path}.records[${recordIndex}]`, errors),
    );
  }
}

function validateResolvedFiltersV2Error(value, index, errors) {
  const path = `resolvedFilters.errors[${index}]`;
  if (!isPlainObject(value)) {
    errors.push(`${path} deve essere oggetto`);
    return;
  }

  const allowed = new Set([
    "kind",
    "boundaryEntryId",
    "entryConfigKey",
    "messageKey",
    "detail",
    "missingAllowedFields",
  ]);
  hasOnlyFields(value, allowed, path, errors);
  for (const [field, fieldValue] of Object.entries(value)) {
    if (field === "missingAllowedFields") {
      validateStringArray(fieldValue, `${path}.${field}`, errors);
    } else if (fieldValue !== null && fieldValue !== undefined && typeof fieldValue !== "string") {
      errors.push(`${path}.${field} deve essere string o null`);
    }
  }
}

function validateResolvedFiltersV2(value, errors) {
  const allowed = new Set([
    "version",
    "legacyDriver360",
    "query",
    "entries",
    "disambiguation",
    "errors",
    "unresolvedReason",
  ]);
  hasOnlyFields(value, allowed, "resolvedFilters", errors);
  requireFields(value, allowed, "resolvedFilters", errors);

  if (value.version !== "resolvedFilters.v2") {
    errors.push("resolvedFilters.version deve essere resolvedFilters.v2");
  }
  validateResolvedFiltersV2LegacyDriver(value.legacyDriver360, errors);
  validateResolvedFiltersV2Query(value.query, errors);
  if (!Array.isArray(value.entries)) {
    errors.push("resolvedFilters.entries deve essere array");
  } else {
    value.entries.forEach((entry, index) => validateResolvedFiltersV2Entry(entry, index, errors));
  }
  if (value.disambiguation !== null && !isPlainObject(value.disambiguation)) {
    errors.push("resolvedFilters.disambiguation deve essere null o oggetto");
  }
  if (!Array.isArray(value.errors)) {
    errors.push("resolvedFilters.errors deve essere array");
  } else {
    value.errors.forEach((entry, index) => validateResolvedFiltersV2Error(entry, index, errors));
  }
  if (value.unresolvedReason !== null && typeof value.unresolvedReason !== "string") {
    errors.push("resolvedFilters.unresolvedReason deve essere string o null");
  }
  validateSafeResolvedFilterPayload(value, "resolvedFilters", errors);
}

export function buildCatalogErrorMessage() {
  return {
    action: "error",
    view: null,
    filters: null,
    resolvedFilters: null,
    clarification: null,
    disambiguation: null,
    report: null,
    accompaniment: { kind: "error_intent_not_in_catalog", params: null },
  };
}

export function validateChatZeroInvenzioniMessage(value) {
  const errors = [];

  if (!isPlainObject(value)) {
    return {
      valid: false,
      errors: ["La risposta finale deve essere un oggetto"],
      finalMessage: buildCatalogErrorMessage(),
    };
  }

  collectForbiddenFields(value, errors);
  hasOnlyFields(value, TOP_LEVEL_FIELDS, "", errors);
  requireFields(value, TOP_LEVEL_FIELDS, "", errors);

  if (typeof value.action !== "string" || !ACTION_ENUM.has(value.action)) {
    errors.push("action deve essere un enum ammesso");
  }
  validateNullableEnum(value.view, VIEW_ENUM, "view", errors);
  validateFilters(value.filters, errors);
  validateClarification(value.clarification, errors);
  validateDisambiguation(value.disambiguation, errors);
  validateReport(value.report, errors);
  validateAccompaniment(value.accompaniment, errors);

  return {
    valid: errors.length === 0,
    errors,
    finalMessage: errors.length === 0 ? value : buildCatalogErrorMessage(),
  };
}

export function validateChatZeroInvenzioniBackendMessage(value) {
  const errors = [];

  if (!isPlainObject(value)) {
    return {
      valid: false,
      errors: ["La risposta finale deve essere un oggetto"],
      finalMessage: buildCatalogErrorMessage(),
    };
  }

  collectForbiddenFields(value, errors);
  hasOnlyFields(value, BACKEND_TOP_LEVEL_FIELDS, "", errors);
  requireFields(value, TOP_LEVEL_FIELDS, "", errors);

  if (typeof value.action !== "string" || !ACTION_ENUM.has(value.action)) {
    errors.push("action deve essere un enum ammesso");
  }
  validateNullableEnum(value.view, VIEW_ENUM, "view", errors);
  validateFilters(value.filters, errors);
  validateResolvedFilters(value.resolvedFilters, errors);
  validateClarification(value.clarification, errors);
  validateDisambiguation(value.disambiguation, errors, { allowCandidates: true });
  validateReport(value.report, errors);
  validateAccompaniment(value.accompaniment, errors);

  return {
    valid: errors.length === 0,
    errors,
    finalMessage: errors.length === 0 ? value : buildCatalogErrorMessage(),
  };
}

export function assertChatZeroInvenzioniMessage(value) {
  const validation = validateChatZeroInvenzioniMessage(value);
  if (!validation.valid) {
    const error = new Error(validation.errors.join("; "));
    error.validation = validation;
    throw error;
  }
  return value;
}
