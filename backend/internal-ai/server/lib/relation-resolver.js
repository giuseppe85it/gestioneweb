/*
 * Relation Resolver deterministico per CertifiedRecord.
 *
 * Applica solo regole dichiarate in relation.config.cjs.
 * una relazione nasce solo se tutti i campi strutturati richiesti sono presenti
 * nel record certificato gia' proiettato dal boundary readonly.
 */

import relationConfigModule from "./relation.config.cjs";
import { REGISTRY_CONFIG_FASE_A } from "./registry.config.js";

const RELATION_CONFIG = Object.freeze(
  relationConfigModule?.RELATION_CONFIG ?? relationConfigModule?.default?.RELATION_CONFIG ?? [],
);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readField(record, fieldName) {
  return record?.fields?.[fieldName]?.value;
}

function hasCertifiedField(record, fieldName) {
  if (!isPlainObject(record?.fields)) return false;
  if (!Object.prototype.hasOwnProperty.call(record.fields, fieldName)) return false;
  const value = readField(record, fieldName);
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string") return Boolean(value.trim());
  return true;
}

function firstTextField(record, fieldNames = []) {
  for (const fieldName of fieldNames) {
    const value = text(readField(record, fieldName));
    if (value) return value;
  }
  return "";
}

function buildSourceCollection(record, entryConfig) {
  const provenanceCollection = text(record?.provenance?.sourceCollection);
  if (provenanceCollection) return provenanceCollection;
  return entryConfig?.docId ? `${entryConfig.collection}/${entryConfig.docId}` : entryConfig?.collection ?? "";
}

function buildRelation(ruleConfig, entryConfig, record) {
  const requiredFields = Array.isArray(ruleConfig.sourceFields) ? ruleConfig.sourceFields : [];
  if (!requiredFields.length || !requiredFields.every((fieldName) => hasCertifiedField(record, fieldName))) {
    return null;
  }

  const sourceCollection = buildSourceCollection(record, entryConfig);
  const sourceRecordId = text(record?.provenance?.sourceRecordId) || text(record?.sourceRecordId);
  const sourceField = text(ruleConfig.sourceFieldLabel) || requiredFields.join("+");
  if (!sourceCollection || !sourceRecordId || !sourceField) return null;

  const relationProof = {
    relationKind: ruleConfig.relationKind,
    sourceCollection,
    sourceRecordId,
    sourceField,
    rule: ruleConfig.rule,
    certainty: ruleConfig.certainty,
  };

  return {
    relationKind: ruleConfig.relationKind,
    targetLabel: firstTextField(record, ruleConfig.targetLabelFields),
    relationProof,
  };
}

function enrichRecord(entryConfigKey, record) {
  const entryConfig = REGISTRY_CONFIG_FASE_A.entries[entryConfigKey] ?? null;
  if (!entryConfig || !isPlainObject(record)) return record;

  const nextRelations = [];
  for (const ruleConfig of RELATION_CONFIG) {
    if (ruleConfig?.sourceEntryConfigKey !== entryConfigKey) continue;
    const relation = buildRelation(ruleConfig, entryConfig, record);
    if (relation) nextRelations.push(relation);
  }

  if (!nextRelations.length) return record;
  return {
    ...record,
    relations: Object.freeze([...(Array.isArray(record.relations) ? record.relations : []), ...nextRelations]),
  };
}

export function enrichResolvedFiltersWithRelations(resolvedFilters, { entryConfigKey } = {}) {
  if (!entryConfigKey || !isPlainObject(resolvedFilters) || !Array.isArray(resolvedFilters.entries)) {
    return resolvedFilters;
  }

  return {
    ...resolvedFilters,
    entries: resolvedFilters.entries.map((entry) => ({
      ...entry,
      records: Array.isArray(entry.records)
        ? entry.records.map((record) => enrichRecord(entryConfigKey, record))
        : [],
    })),
  };
}

export function resolveRelationsForCertifiedRecord(record, { entryConfigKey } = {}) {
  return enrichRecord(entryConfigKey, record).relations ?? [];
}
