const RECORD_ARRAY_KEYS = new Set([
  "items",
  "rows",
  "records",
  "entries",
  "matches",
  "movimenti",
  "eventi",
  "documenti",
  "manutenzioni",
  "lavori",
  "topByTarga",
  "buckets",
  "byMonth",
  "subtotali",
  "statoAttuale",
  "rankingConteggioRifornimenti",
  "filteredItems",
  "filteredPeriodItems",
]);

const RESPONSE_RECORD_LOCATIONS = Object.freeze([
  "table.rows",
  "ranking_table.rows",
  "timeline.items",
  "data_table_styled.table.rows",
  "nested_list.groups.items",
]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeFingerprint(value) {
  if (value === null || value === undefined) return "";
  const normalized = String(value).trim();
  return normalized ? normalized : "";
}

function firstText(record, keys) {
  for (const key of keys) {
    const value = normalizeFingerprint(record[key]);
    if (value) return value;
  }
  return "";
}

function buildRecordFingerprint(record, namespace = "") {
  if (!isPlainObject(record)) return "";
  const existing = firstText(record, ["_id", "fingerprint"]);
  if (existing) return existing;

  const sourceKey = firstText(record, ["sourceKey", "collection", "sourceCollection", "dataset"]);
  const sourceDocId = firstText(record, ["sourceDocId", "sourceRecordId", "docId", "recordId", "firestoreId"]);
  if (sourceDocId) return sourceKey ? `${sourceKey}:${sourceDocId}` : sourceDocId;

  const id = firstText(record, ["id"]);
  if (id) return sourceKey ? `${sourceKey}:${id}` : id;

  const targa = firstText(record, ["targa", "mezzoTarga", "plate"]);
  if (targa) return namespace ? `${namespace}:targa:${targa}` : `targa:${targa}`;

  const cantiere = firstText(record, ["cantiereId", "siteId"]);
  if (cantiere) return namespace ? `${namespace}:cantiere:${cantiere}` : `cantiere:${cantiere}`;

  const aggregateKey = firstText(record, ["key", "month", "label"]);
  if (aggregateKey) return namespace ? `${namespace}:aggregate:${aggregateKey}` : `aggregate:${aggregateKey}`;

  return "";
}

function looksLikeRecordContainerKey(key) {
  return RECORD_ARRAY_KEYS.has(key);
}

function enrichValueFingerprints(value, options = {}) {
  const parentKey = options.parentKey ?? "";
  const namespace = options.namespace ?? "";

  if (Array.isArray(value)) {
    return value.map((item) =>
      enrichValueFingerprints(item, {
        parentKey,
        namespace,
        insideRecordArray: options.insideRecordArray || looksLikeRecordContainerKey(parentKey),
      }),
    );
  }

  if (!isPlainObject(value)) return value;

  const enriched = {};
  for (const [key, child] of Object.entries(value)) {
    enriched[key] = enrichValueFingerprints(child, {
      parentKey: key,
      namespace,
      insideRecordArray: looksLikeRecordContainerKey(key),
    });
  }

  if (options.insideRecordArray || looksLikeRecordContainerKey(parentKey)) {
    const fingerprint = buildRecordFingerprint(enriched, namespace);
    if (fingerprint) {
      return { _id: fingerprint, ...enriched };
    }
  }

  return enriched;
}

export function enrichToolResultFingerprints(toolResult) {
  if (!isPlainObject(toolResult)) return toolResult;
  const namespace = text(toolResult.name) || "tool";
  return enrichValueFingerprints(toolResult, { namespace });
}

export function enrichToolResultsFingerprints(toolResults) {
  if (!Array.isArray(toolResults)) return [];
  return toolResults.map(enrichToolResultFingerprints);
}

function normalizeDateToken(value) {
  const raw = text(value);
  if (!raw) return "";
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return `${String(Number(iso[3])).padStart(2, "0")}/${String(Number(iso[2])).padStart(2, "0")}/${iso[1]}`;
  }
  const italian = raw.match(/^(\d{1,2})[\/.\s-](\d{1,2})[\/.\s-](\d{4})/);
  if (italian) {
    return `${String(Number(italian[1])).padStart(2, "0")}/${String(Number(italian[2])).padStart(2, "0")}/${italian[3]}`;
  }
  return "";
}

function extractDateTokens(value) {
  const raw = typeof value === "string" ? value : JSON.stringify(value ?? "");
  const matches = raw.match(/\b\d{4}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[\/.\s-]\d{1,2}[\/.\s-]\d{4}\b/g) ?? [];
  return Array.from(new Set(matches.map(normalizeDateToken).filter(Boolean)));
}

function collectValidRecords(value, records = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectValidRecords(item, records));
    return records;
  }
  if (!isPlainObject(value)) return records;

  const fingerprint = normalizeFingerprint(value._id);
  if (fingerprint) records.set(fingerprint, value);
  for (const child of Object.values(value)) collectValidRecords(child, records);
  return records;
}

function pushRecordId(target, value, location) {
  if (!isPlainObject(value)) return;
  const id = normalizeFingerprint(value._id);
  if (id) {
    target.responseIds.push({ id, location, record: value });
  } else {
    target.missingFingerprintLocations.push(location);
  }
}

function extractResponseRecordIds(finalResponse) {
  const result = {
    responseIds: [],
    missingFingerprintLocations: [],
  };
  const blocks = Array.isArray(finalResponse?.blocks) ? finalResponse.blocks : [];

  for (const block of blocks) {
    if (!isPlainObject(block)) continue;
    if (block.kind === "table" && Array.isArray(block.table?.rows)) {
      block.table.rows.forEach((row, index) => pushRecordId(result, row, `table.rows[${index}]`));
    }
    if (block.kind === "ranking_table" && Array.isArray(block.rows)) {
      block.rows.forEach((row, index) => pushRecordId(result, row, `ranking_table.rows[${index}]`));
    }
    if (block.kind === "timeline" && Array.isArray(block.items)) {
      block.items.forEach((item, index) => pushRecordId(result, item, `timeline.items[${index}]`));
    }
    if (block.kind === "data_table_styled" && Array.isArray(block.table?.rows)) {
      block.table.rows.forEach((row, index) => pushRecordId(result, row, `data_table_styled.table.rows[${index}]`));
    }
    if (block.kind === "nested_list" && Array.isArray(block.groups)) {
      block.groups.forEach((group, groupIndex) => {
        if (!Array.isArray(group?.items)) return;
        group.items.forEach((item, itemIndex) =>
          pushRecordId(result, item, `nested_list.groups[${groupIndex}].items[${itemIndex}]`),
        );
      });
    }
  }

  return result;
}

function finalResponseHasRecordBlocks(finalResponse) {
  const blocks = Array.isArray(finalResponse?.blocks) ? finalResponse.blocks : [];
  return blocks.some((block) => {
    if (!isPlainObject(block)) return false;
    if (block.kind === "table") return Array.isArray(block.table?.rows) && block.table.rows.length > 0;
    if (block.kind === "ranking_table") return Array.isArray(block.rows) && block.rows.length > 0;
    if (block.kind === "timeline") return Array.isArray(block.items) && block.items.length > 0;
    if (block.kind === "data_table_styled") return Array.isArray(block.table?.rows) && block.table.rows.length > 0;
    if (block.kind === "nested_list") {
      return Array.isArray(block.groups) && block.groups.some((group) => Array.isArray(group?.items) && group.items.length > 0);
    }
    return false;
  });
}

function promptRequiresRecordFingerprints(prompt) {
  return /dettaglio|mostrami|elenca|lista|righe|tabella|rifornimenti|fatture|documenti|manutenzioni|lavori|eventi|segnalazioni|materiali|costi/i.test(
    text(prompt),
  );
}

function validateDateClaims(responseIds, validRecords) {
  const invalidDateClaims = [];
  for (const entry of responseIds) {
    const source = validRecords.get(entry.id);
    if (!source) continue;
    const responseDates = extractDateTokens(entry.record);
    if (responseDates.length === 0) continue;
    const sourceDates = new Set(extractDateTokens(source));
    for (const date of responseDates) {
      if (!sourceDates.has(date)) {
        invalidDateClaims.push({
          id: entry.id,
          date,
          location: entry.location,
          validDates: Array.from(sourceDates),
        });
      }
    }
  }
  return invalidDateClaims;
}

export function validateFingerprints(finalResponse, toolResults, options = {}) {
  const enrichedToolResults = enrichToolResultsFingerprints(toolResults);
  const validRecords = collectValidRecords(enrichedToolResults);
  const response = extractResponseRecordIds(finalResponse);
  const validIds = new Set(validRecords.keys());
  const invalidIds = response.responseIds
    .map((entry) => entry.id)
    .filter((id) => !validIds.has(id));
  const invalidDateClaims = validateDateClaims(response.responseIds, validRecords);
  const missingFingerprintLocations = response.missingFingerprintLocations;
  const hasRecordBlocks = finalResponseHasRecordBlocks(finalResponse);
  const missingResponseFingerprints =
    validIds.size > 0 &&
    response.responseIds.length === 0 &&
    hasRecordBlocks;
  const fingerprintCoverageWarning =
    validIds.size > 0 &&
    response.responseIds.length === 0 &&
    !hasRecordBlocks &&
    promptRequiresRecordFingerprints(options.prompt);

  return {
    valid:
      invalidIds.length === 0 &&
      invalidDateClaims.length === 0 &&
      missingFingerprintLocations.length === 0 &&
      !missingResponseFingerprints,
    invalidIds,
    invalidDateClaims,
    missingFingerprintLocations,
    missingResponseFingerprints,
    fingerprintCoverageWarning,
    totalResponseIds: response.responseIds.length,
    totalValidIds: validIds.size,
    recordLocations: RESPONSE_RECORD_LOCATIONS,
  };
}

function pickDisplayFields(record) {
  const preferredKeys = [
    "targa",
    "mezzoTarga",
    "plate",
    "numero",
    "fornitore",
    "scadenza_revisione",
    "dataScadenzaRevisione",
    "dataScadenzaRevisione_italiana",
    "data_italiana",
    "data",
    "tipo",
    "categoria",
    "marca_modello",
    "marca",
    "modello",
    "autista_assegnato_nome",
    "autista",
    "litri",
    "importo",
    "totale",
    "total",
    "total_count",
    "count",
    "costo",
    "km",
    "stato",
    "descrizione_breve",
    "descrizione",
    "label",
    "value",
    "target",
  ];
  const entries = [];
  for (const key of preferredKeys) {
    if (key === "_id") continue;
    const value = record[key];
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "object") continue;
    entries.push([key, value]);
    if (entries.length >= 6) break;
  }
  return entries;
}

function labelForField(key) {
  const labels = {
    targa: "Targa",
    mezzoTarga: "Targa",
    plate: "Targa",
    numero: "Numero",
    fornitore: "Fornitore",
    scadenza_revisione: "Scadenza revisione",
    dataScadenzaRevisione: "Scadenza revisione",
    dataScadenzaRevisione_italiana: "Scadenza revisione",
    data_italiana: "Data",
    data: "Data",
    tipo: "Tipo",
    categoria: "Categoria",
    marca_modello: "Marca/modello",
    marca: "Marca",
    modello: "Modello",
    autista_assegnato_nome: "Autista",
    autista: "Autista",
    litri: "Litri",
    importo: "Importo",
    totale: "Totale",
    total: "Totale",
    total_count: "Totale",
    count: "Conteggio",
    costo: "Costo",
    km: "Km",
    stato: "Stato",
    descrizione_breve: "Descrizione",
    descrizione: "Descrizione",
    label: "Voce",
    value: "Valore",
    target: "Elemento",
  };
  return labels[key] ?? key;
}

function displayCell(field) {
  if (!Array.isArray(field)) return null;
  const [key, value] = field;
  if (value === null || value === undefined || value === "") return null;
  return `${labelForField(key)}: ${String(value)}`;
}

function collectFallbackRows(toolResults, limit = 10) {
  const rows = [];
  const validRecords = collectValidRecords(enrichToolResultsFingerprints(toolResults));
  for (const [id, record] of validRecords.entries()) {
    const fields = pickDisplayFields(record);
    if (fields.length === 0) continue;
    rows.push({ id, fields });
    if (rows.length >= limit) break;
  }
  return rows;
}

export function buildFingerprintFallbackFinalMessage(toolResults, validation) {
  const rows = collectFallbackRows(toolResults, 10);
  const text =
    "Non sono riuscito a generare una risposta narrativa affidabile senza rischiare dati inventati. Mostro quindi i record grezzi disponibili dai tool.";
  const tableRows = rows.map((row) => {
    const cells = {
      _id: row.id,
      c1: displayCell(row.fields[0]),
      c2: displayCell(row.fields[1]),
      c3: displayCell(row.fields[2]),
      c4: displayCell(row.fields[3]),
      c5: displayCell(row.fields[4]),
      c6: displayCell(row.fields[5]),
      c7: null,
      c8: null,
    };
    return cells;
  });

  const columns = [
    { key: "c1", label: "Campo 1", align: "left" },
    { key: "c2", label: "Campo 2", align: "left" },
    { key: "c3", label: "Campo 3", align: "left" },
    { key: "c4", label: "Campo 4", align: "left" },
    { key: "c5", label: "Campo 5", align: "left" },
    { key: "c6", label: "Campo 6", align: "left" },
  ];

  return {
    text,
    status: "partial",
    blocks: [
      {
        kind: "callout",
        tone: "warning",
        title: "Risposta rigenerata in modo sicuro",
        text: "Il validatore fingerprint ha bloccato una risposta non verificabile. I dati sotto arrivano direttamente dai tool.",
      },
      {
        kind: "data_table_styled",
        table: {
          title: "Dati grezzi verificati",
          columns,
          rows: tableRows,
          emptyText: "Nessun record verificabile disponibile.",
          accentKey: "c1",
          rowActions: rows.map((row) => ({
            label: "Apri",
            href: null,
            entityKind: "record",
            entityId: row.id,
          })),
        },
      },
    ],
    entities: rows.map((row) => ({ kind: "fingerprint", value: row.id })),
    sources: [],
    notices: [
      "Fallback anti-allucinazione attivato.",
      `ID risposta: ${validation.totalResponseIds}; ID validi tool: ${validation.totalValidIds}.`,
    ],
  };
}
