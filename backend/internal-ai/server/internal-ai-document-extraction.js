import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_TEXT_FOR_PROVIDER = 18000;
const SUPPORTED_OUTPUT_VERSION = 1;
export const LIBRETTO_CANONICAL_FIELDS = [
  "nAvs",
  "proprietario",
  "indirizzo",
  "localita",
  "statoOrigine",
  "assicurazione",
  "annotazioni",
  "targa",
  "colore",
  "genereVeicolo",
  "marcaTipo",
  "telaio",
  "carrozzeria",
  "numeroMatricola",
  "approvazioneTipo",
  "cilindrata",
  "potenza",
  "pesoVuoto",
  "caricoUtileSella",
  "pesoTotale",
  "pesoTotaleRimorchio",
  "caricoSulLetto",
  "pesoRimorchiabile",
  "primaImmatricolazione",
  "luogoDataRilascio",
  "ultimoCollaudo",
  "prossimoCollaudoRevisione",
];
const LIBRETTO_MULTILINE_FIELDS = new Set(["annotazioni"]);
const PREVENTIVO_PRICE_EXTRACT_WARNING_CODES = new Set([
  "MISSING_CURRENCY",
  "MISSING_UNIT_PRICE",
  "LIKELY_TOTAL_PRICE",
  "PARTIAL_TABLE",
  "LOW_CONFIDENCE",
]);
const PREVENTIVO_PRICE_EXTRACT_WARNING_SEVERITIES = new Set(["info", "warn", "error"]);

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeMultilineText(value) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

function toNullIfEmpty(value) {
  const normalized = normalizeText(value);
  return normalized || null;
}

function uniqueStrings(values) {
  const seen = new Set();
  const output = [];

  for (const value of values ?? []) {
    const normalized = normalizeText(value);
    if (!normalized) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(normalized);
  }

  return output;
}

function clampConfidence(value, fallback = null) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(1, value));
  }

  return fallback;
}

function parseLocalizedNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .trim()
    .replace(/[^0-9,.\-]/g, "")
    .replace(/\s+/g, "");

  if (!cleaned) {
    return null;
  }

  if (cleaned.includes(",") && cleaned.includes(".")) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const normalized = cleaned
      .replace(decimalSeparator === "," ? /\./g : /,/g, "")
      .replace(decimalSeparator, ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (cleaned.includes(",")) {
    const normalized = cleaned.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    const normalized =
      parts.length > 2 || (parts.length === 2 && parts[1]?.length === 3)
        ? cleaned.replace(/\./g, "")
        : cleaned;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeCurrency(value) {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) {
    return null;
  }

  if (normalized.includes("CHF")) {
    return "CHF";
  }

  if (normalized.includes("EUR") || normalized.includes("EURO") || normalized.includes("€")) {
    return "EUR";
  }

  return null;
}

function normalizeUnit(value) {
  const normalized = normalizeText(value).toLowerCase().replace(/\./g, "");
  if (!normalized) {
    return null;
  }

  if (/^(pz|pezzo|pezzi|pc|pcs)$/.test(normalized)) {
    return "pz";
  }

  if (/^(lt|l|litro|litri)$/.test(normalized)) {
    return "lt";
  }

  if (/^(kg|chilogrammo|chilogrammi)$/.test(normalized)) {
    return "kg";
  }

  if (/^(mt|m|metro|metri)$/.test(normalized)) {
    return "mt";
  }

  return normalized.slice(0, 16) || null;
}

function normalizeDateToDDMMYYYY(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const direct = normalized.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (direct) {
    const day = direct[1].padStart(2, "0");
    const month = direct[2].padStart(2, "0");
    const year = direct[3].length === 2 ? `20${direct[3]}` : direct[3];
    return `${day}/${month}/${year}`;
  }

  const iso = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear());
  return `${day}/${month}/${year}`;
}

function isValidDDMMYYYYDate(value) {
  const normalized = normalizeText(value);
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function sanitizeUndefinedDeep(value) {
  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeUndefinedDeep(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitizeUndefinedDeep(entry)]),
    );
  }

  return value;
}

function pushPreventivoPriceWarning(target, code, severity, message) {
  if (!PREVENTIVO_PRICE_EXTRACT_WARNING_CODES.has(code)) {
    return;
  }

  if (target.some((entry) => entry.code === code)) {
    return;
  }

  target.push({
    code,
    severity: PREVENTIVO_PRICE_EXTRACT_WARNING_SEVERITIES.has(severity) ? severity : "warn",
    message: normalizeText(message) || code,
  });
}

function normalizePreventivoPriceExtractOutput(parsed) {
  const source = parsed && typeof parsed === "object" ? parsed : {};
  const rawDocument =
    source.document && typeof source.document === "object"
      ? source.document
      : source.header && typeof source.header === "object"
        ? source.header
        : {};
  const rawSupplier =
    source.supplier && typeof source.supplier === "object" ? source.supplier : {};
  const rawItems = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.righe)
      ? source.righe
      : Array.isArray(source.rows)
        ? source.rows
        : Array.isArray(source.voci)
          ? source.voci
          : [];
  const warnings = [];
  let removedRowsCount = 0;

  const documentCurrency = normalizeCurrency(
    rawDocument.currency ??
      rawDocument.valuta ??
      source.documentCurrency ??
      source.currency ??
      source.valuta,
  );
  const documentDate = normalizeDateToDDMMYYYY(
    rawDocument.date ??
      rawDocument.documentDate ??
      rawDocument.dataDocumento ??
      source.date ??
      source.documentDate ??
      source.dataDocumento,
  );

  const document = {
    number: toNullIfEmpty(
      rawDocument.number ??
        rawDocument.documentNumber ??
        rawDocument.numeroDocumento ??
        source.number ??
        source.documentNumber ??
        source.numeroDocumento ??
        source.numeroPreventivo,
    ),
    date: documentDate && isValidDDMMYYYYDate(documentDate) ? documentDate : null,
    currency: documentCurrency,
    confidence: clampConfidence(
      rawDocument.confidence ?? source.documentConfidence ?? source.confidence,
      0,
    ),
  };

  if (!document.currency) {
    pushPreventivoPriceWarning(
      warnings,
      "MISSING_CURRENCY",
      "warn",
      "Valuta documento mancante o non valida.",
    );
  }

  const supplier = {
    name: toNullIfEmpty(
      rawSupplier.name ?? source.supplierName ?? source.fornitore ?? source.ragioneSociale,
    ),
    confidence: clampConfidence(rawSupplier.confidence ?? source.supplierConfidence, 0),
  };

  const items = rawItems
    .map((item) => {
      const entry = item && typeof item === "object" ? item : {};
      const description = toNullIfEmpty(
        entry.description ?? entry.descrizione ?? entry.articolo ?? entry.itemDescription,
      );
      const articleCode = toNullIfEmpty(
        entry.articleCode ??
          entry.codiceArticolo ??
          entry.codice ??
          entry.article_code ??
          entry.sku,
      );
      const uom = toNullIfEmpty(
        entry.uom ?? entry.um ?? entry.unita ?? entry.unit ?? entry.unitOfMeasure,
      );
      const unitPriceValue = parseLocalizedNumber(
        entry.unitPrice ??
          entry.prezzoUnitario ??
          entry.prezzo_unitario ??
          entry.unit_price ??
          entry.prezzo,
      );
      const unitPrice =
        typeof unitPriceValue === "number" &&
        Number.isFinite(unitPriceValue) &&
        unitPriceValue > 0
          ? unitPriceValue
          : null;
      const itemCurrency = normalizeCurrency(entry.currency ?? entry.valuta);
      const confidence = clampConfidence(entry.confidence, 0);

      if (!description && unitPrice === null) {
        removedRowsCount += 1;
        return null;
      }

      if (!itemCurrency) {
        pushPreventivoPriceWarning(
          warnings,
          "MISSING_CURRENCY",
          "warn",
          "Una o piu righe non espongono una valuta valida.",
        );
      }

      if (unitPrice === null) {
        pushPreventivoPriceWarning(
          warnings,
          "MISSING_UNIT_PRICE",
          "warn",
          "Una o piu righe non espongono un prezzo unitario valido.",
        );
      }

      return {
        description,
        articleCode,
        uom,
        unitPrice,
        currency: itemCurrency,
        confidence,
      };
    })
    .filter((entry) => Boolean(entry));

  if (removedRowsCount > 0) {
    pushPreventivoPriceWarning(
      warnings,
      "PARTIAL_TABLE",
      "info",
      "Sono state scartate righe incomplete senza descrizione e senza prezzo unitario.",
    );
  }

  if (Array.isArray(source.warnings)) {
    source.warnings.forEach((warning) => {
      if (!warning || typeof warning !== "object") {
        return;
      }

      const code = normalizeText(warning.code).toUpperCase();
      if (!PREVENTIVO_PRICE_EXTRACT_WARNING_CODES.has(code)) {
        return;
      }

      pushPreventivoPriceWarning(
        warnings,
        code,
        normalizeText(warning.severity).toLowerCase(),
        warning.message ?? code,
      );
    });
  }

  return sanitizeUndefinedDeep({
    schemaVersion: "preventivo_price_extract_v1",
    document,
    supplier,
    items,
    warnings,
  });
}

function normalizeVehiclePlate(value) {
  const normalized = normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!normalized) {
    return null;
  }

  if (/^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(normalized)) {
    return normalized;
  }

  if (/^[A-Z]{2}[0-9]{4}[A-Z]$/.test(normalized)) {
    return normalized;
  }

  return normalized.length >= 6 && normalized.length <= 8 ? normalized : null;
}

function normalizeDocumentType(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.includes("preventiv") || normalized.includes("offerta")) {
    return "preventivo";
  }

  if (
    normalized.includes("documento di trasporto") ||
    normalized.includes("doc. di trasporto") ||
    normalized.includes(" ddt") ||
    normalized === "ddt"
  ) {
    return "ddt";
  }

  if (normalized.includes("fattur")) {
    return "fattura";
  }

  if (normalized.includes("bolla")) {
    return "ddt";
  }

  return "altro";
}

function normalizeVehicleDocumentSubtype(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.includes("librett")) {
    return "libretto";
  }
  if (normalized.includes("assicura") || normalized.includes("polizza")) {
    return "assicurazione";
  }
  if (normalized.includes("revision")) {
    return "revisione";
  }
  if (normalized.includes("collaud")) {
    return "collaudo";
  }

  return null;
}

function isLibrettoDocumentSubtype(value) {
  return normalizeVehicleDocumentSubtype(value) === "libretto";
}

function isLibrettoDocumentContext(profile, subtype) {
  return profile === "documento_mezzo" && isLibrettoDocumentSubtype(subtype);
}

function pushWarning(target, code, severity, message) {
  if (!code || !message) {
    return;
  }

  const key = `${code}:${message}`.toLowerCase();
  if (target.some((entry) => `${entry.code}:${entry.message}`.toLowerCase() === key)) {
    return;
  }

  target.push({
    code,
    severity,
    message,
  });
}

function buildBaseAnalysis(args) {
  return {
    version: SUPPORTED_OUTPUT_VERSION,
    profilo: args.profilo ?? "magazzino",
    stato: args.stato,
    tipoSorgente: args.tipoSorgente,
    modalitaEstrazione: args.modalitaEstrazione,
    providerUsato: Boolean(args.providerUsato),
    tipoDocumento: null,
    sottotipoDocumento: null,
    fornitore: null,
    numeroDocumento: null,
    dataDocumento: null,
    destinatario: null,
    valuta: null,
    imponibile: null,
    ivaImporto: null,
    ivaPercentuale: null,
    totaleDocumento: null,
    targa: null,
    km: null,
    telaio: null,
    proprietario: null,
    assicurazione: null,
    marca: null,
    modello: null,
    dataImmatricolazione: null,
    dataScadenza: null,
    dataUltimoCollaudo: null,
    dataScadenzaRevisione: null,
    riassuntoBreve: null,
    noteImportanti: [],
    righe: [],
    warnings: [],
    campiMancanti: [],
    testoEstrattoBreve: null,
  };
}

function buildBaseLibrettoAnalysis(args) {
  const analysis = buildBaseAnalysis(args);
  LIBRETTO_CANONICAL_FIELDS.forEach((field) => {
    analysis[field] = "";
  });
  return analysis;
}

function normalizeLibrettoFieldValue(value, multiline = false) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.replace(/\r/g, "");
  if (multiline) {
    return normalized
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trim();
  }

  return normalized.trim();
}

function normalizeLibrettoFieldMap(source) {
  const output = {};
  LIBRETTO_CANONICAL_FIELDS.forEach((field) => {
    output[field] = normalizeLibrettoFieldValue(
      source?.[field],
      LIBRETTO_MULTILINE_FIELDS.has(field),
    );
  });
  return output;
}

function buildEmptyLibrettoFieldMap() {
  return normalizeLibrettoFieldMap({});
}

function hasLibrettoValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function buildHeuristicLibrettoFieldMap(analysis) {
  const fields = buildEmptyLibrettoFieldMap();

  if (analysis?.targa) {
    fields.targa = normalizeText(analysis.targa);
  }
  if (analysis?.telaio) {
    fields.telaio = normalizeText(analysis.telaio);
  }

  return fields;
}

function buildRowId(index) {
  return `riga-${index + 1}`;
}

function normalizeRow(entry, index, fallbackCurrency = null) {
  const source = entry && typeof entry === "object" ? entry : {};
  const descrizione = toNullIfEmpty(
    source.descrizione ??
      source.description ??
      source.materiale ??
      source.articolo ??
      source.label ??
      source.nome,
  );
  const quantita = parseLocalizedNumber(
    source.quantita ?? source.quantity ?? source.qta ?? source.qty ?? null,
  );
  const unita = normalizeUnit(source.unita ?? source.uom ?? source.udm ?? source.um ?? null);
  const prezzoUnitario = parseLocalizedNumber(
    source.prezzoUnitario ??
      source.unitPrice ??
      source.prezzo_unitario ??
      source.prezzo ??
      source.costoUnitario ??
      null,
  );
  const totaleRiga = parseLocalizedNumber(
    source.totaleRiga ?? source.lineTotal ?? source.importo ?? source.totale ?? source.total ?? null,
  );
  const codiceArticolo = toNullIfEmpty(
    source.codiceArticolo ?? source.articleCode ?? source.codice ?? source.codiceProdotto,
  );
  const categoria = toNullIfEmpty(
    source.categoria ?? source.category ?? source.tipo ?? source.kind ?? source.family,
  );
  const valuta = normalizeCurrency(source.valuta ?? source.currency) || fallbackCurrency;
  const warnings = Array.isArray(source.warnings)
    ? uniqueStrings(
        source.warnings.map((warning) =>
          typeof warning === "string" ? warning : warning?.message ?? warning?.code,
        ),
      )
    : [];

  if (!descrizione && !codiceArticolo && quantita === null && prezzoUnitario === null && totaleRiga === null) {
    return null;
  }

  return {
    id: normalizeText(source.id) || buildRowId(index),
    descrizione,
    categoria,
    quantita,
    unita,
    prezzoUnitario,
    totaleRiga,
    codiceArticolo,
    valuta,
    confidence: clampConfidence(source.confidence, null),
    warnings,
  };
}

function buildMissingFields(analysis) {
  const missing = [];

  if (analysis.profilo === "manutenzione") {
    if (!analysis.targa) {
      missing.push("targa");
    }
    if (!analysis.fornitore) {
      missing.push("fornitore");
    }
    if (!analysis.dataDocumento) {
      missing.push("dataDocumento");
    }
    if (analysis.totaleDocumento === null || analysis.totaleDocumento === undefined) {
      missing.push("totaleDocumento");
    }
    if (!Array.isArray(analysis.righe) || analysis.righe.length === 0) {
      missing.push("righe");
    }
    return missing;
  }

  if (analysis.profilo === "documento_mezzo") {
    if (isLibrettoDocumentSubtype(analysis.sottotipoDocumento ?? analysis.tipoDocumento)) {
      if (!analysis.targa) {
        missing.push("targa");
      }
      if (!analysis.telaio) {
        missing.push("telaio");
      }
      if (!analysis.marcaTipo) {
        missing.push("marcaTipo");
      }
      return missing;
    }

    if (!analysis.sottotipoDocumento && !analysis.tipoDocumento) {
      missing.push("sottotipoDocumento");
    }
    if (!analysis.targa) {
      missing.push("targa");
    }
    if (!analysis.dataDocumento) {
      missing.push("dataDocumento");
    }
    return missing;
  }

  if (analysis.profilo === "preventivo_magazzino") {
    if (!analysis.fornitore) {
      missing.push("fornitore");
    }
    if (!analysis.numeroDocumento) {
      missing.push("numeroDocumento");
    }
    if (!analysis.dataDocumento) {
      missing.push("dataDocumento");
    }
    if (!Array.isArray(analysis.righe) || analysis.righe.length === 0) {
      missing.push("righe");
    }
    return missing;
  }

  if (!analysis.tipoDocumento) {
    missing.push("tipoDocumento");
  }
  if (!analysis.fornitore) {
    missing.push("fornitore");
  }
  if (!analysis.numeroDocumento) {
    missing.push("numeroDocumento");
  }
  if (!analysis.dataDocumento) {
    missing.push("dataDocumento");
  }
  if (!Array.isArray(analysis.righe) || analysis.righe.length === 0) {
    missing.push("righe");
  }

  return missing;
}

function buildAnalysisSummary(analysis) {
  if (analysis.profilo === "manutenzione") {
    const parts = [];
    if (analysis.targa) {
      parts.push(`mezzo ${analysis.targa}`);
    }
    if (analysis.fornitore) {
      parts.push(`officina ${analysis.fornitore}`);
    }
    if (analysis.dataDocumento) {
      parts.push(`data ${analysis.dataDocumento}`);
    }
    if (analysis.totaleDocumento !== null && analysis.totaleDocumento !== undefined) {
      parts.push(`totale ${analysis.totaleDocumento}`);
    }
    if (parts.length > 0) {
      return `Documento manutenzione letto: ${parts.join(", ")}.`;
    }
    return "Documento manutenzione letto con campi ancora da verificare.";
  }

  if (analysis.profilo === "documento_mezzo") {
    if (isLibrettoDocumentSubtype(analysis.sottotipoDocumento ?? analysis.tipoDocumento)) {
      const parts = [];
      parts.push("libretto");
      if (analysis.targa) {
        parts.push(`mezzo ${analysis.targa}`);
      }
      if (analysis.proprietario) {
        parts.push(`intestatario ${analysis.proprietario}`);
      }
      if (analysis.luogoDataRilascio) {
        parts.push(`rilascio ${analysis.luogoDataRilascio}`);
      }
      if (analysis.prossimoCollaudoRevisione) {
        parts.push(`prossimo collaudo ${analysis.prossimoCollaudoRevisione}`);
      }
      if (parts.length > 0) {
        return `Documento mezzo letto: ${parts.join(", ")}.`;
      }
      return "Documento mezzo letto con campi ancora da verificare.";
    }

    const parts = [];
    if (analysis.sottotipoDocumento || analysis.tipoDocumento) {
      parts.push(analysis.sottotipoDocumento || analysis.tipoDocumento);
    }
    if (analysis.targa) {
      parts.push(`mezzo ${analysis.targa}`);
    }
    if (analysis.dataDocumento) {
      parts.push(`data ${analysis.dataDocumento}`);
    }
    if (analysis.dataScadenza || analysis.dataScadenzaRevisione) {
      parts.push(`scadenza ${analysis.dataScadenza || analysis.dataScadenzaRevisione}`);
    }
    if (parts.length > 0) {
      return `Documento mezzo letto: ${parts.join(", ")}.`;
    }
    return "Documento mezzo letto con campi ancora da verificare.";
  }

  if (analysis.profilo === "preventivo_magazzino") {
    const parts = [];
    if (analysis.fornitore) {
      parts.push(`fornitore ${analysis.fornitore}`);
    }
    if (analysis.numeroDocumento) {
      parts.push(`numero ${analysis.numeroDocumento}`);
    }
    if (analysis.dataDocumento) {
      parts.push(`data ${analysis.dataDocumento}`);
    }
    if (analysis.totaleDocumento !== null && analysis.totaleDocumento !== undefined) {
      parts.push(`totale ${analysis.totaleDocumento}`);
    }
    if (parts.length > 0) {
      return `Preventivo letto: ${parts.join(", ")}.`;
    }
    return "Preventivo letto con campi ancora da verificare.";
  }

  const parts = [];
  if (analysis.tipoDocumento) {
    parts.push(analysis.tipoDocumento);
  }
  if (analysis.fornitore) {
    parts.push(`fornitore ${analysis.fornitore}`);
  }
  if (analysis.dataDocumento) {
    parts.push(`data ${analysis.dataDocumento}`);
  }
  if (analysis.righe?.length) {
    parts.push(`${analysis.righe.length} righe`);
  }
  if (parts.length > 0) {
    return `Documento ${parts.join(", ")}.`;
  }
  return "Documento analizzato con campi ancora da verificare.";
}

function finalizeLibrettoAnalysis(analysis, fallbackText = null) {
  const next = {
    ...buildBaseLibrettoAnalysis({
      profilo: "documento_mezzo",
      stato: analysis?.stato ?? "partial",
      tipoSorgente: analysis?.tipoSorgente,
      modalitaEstrazione: analysis?.modalitaEstrazione,
      providerUsato: analysis?.providerUsato,
    }),
    ...analysis,
  };

  const canonicalFields = normalizeLibrettoFieldMap(next);
  Object.assign(next, canonicalFields);

  next.tipoDocumento = "libretto";
  next.sottotipoDocumento = "libretto";
  next.fornitore = toNullIfEmpty(next.fornitore);
  next.numeroDocumento = toNullIfEmpty(next.numeroDocumento);
  next.dataDocumento = toNullIfEmpty(next.dataDocumento);
  next.destinatario = toNullIfEmpty(next.destinatario);
  next.valuta = normalizeCurrency(next.valuta);
  next.imponibile =
    typeof next.imponibile === "number" && Number.isFinite(next.imponibile) ? next.imponibile : null;
  next.ivaImporto =
    typeof next.ivaImporto === "number" && Number.isFinite(next.ivaImporto) ? next.ivaImporto : null;
  next.ivaPercentuale = toNullIfEmpty(next.ivaPercentuale);
  next.totaleDocumento =
    typeof next.totaleDocumento === "number" && Number.isFinite(next.totaleDocumento)
      ? next.totaleDocumento
      : null;
  next.km = typeof next.km === "number" && Number.isFinite(next.km) ? next.km : parseLocalizedNumber(next.km);
  next.marca = toNullIfEmpty(next.marca);
  next.modello = toNullIfEmpty(next.modello);
  next.dataImmatricolazione = toNullIfEmpty(next.dataImmatricolazione);
  next.dataScadenza = toNullIfEmpty(next.dataScadenza);
  next.dataUltimoCollaudo = toNullIfEmpty(next.dataUltimoCollaudo);
  next.dataScadenzaRevisione = toNullIfEmpty(next.dataScadenzaRevisione);
  next.noteImportanti = uniqueStrings(next.noteImportanti ?? []);
  next.righe = [];
  next.warnings = Array.isArray(next.warnings)
    ? next.warnings.filter((entry) => entry && entry.code && entry.message)
    : [];
  next.testoEstrattoBreve =
    toNullIfEmpty(next.testoEstrattoBreve ?? fallbackText)?.slice(0, 2000) ?? null;
  next.riassuntoBreve = toNullIfEmpty(next.riassuntoBreve) ?? buildAnalysisSummary(next);
  next.campiMancanti = buildMissingFields(next);

  const populatedCoreCount = [
    next.targa,
    next.marcaTipo,
    next.telaio,
    next.proprietario,
    next.luogoDataRilascio,
    next.ultimoCollaudo,
  ].filter(hasLibrettoValue).length;

  if (populatedCoreCount >= 3) {
    next.stato = next.campiMancanti.length <= 1 ? "ready" : "partial";
  } else if (
    next.testoEstrattoBreve ||
    LIBRETTO_CANONICAL_FIELDS.some((field) => hasLibrettoValue(next[field]))
  ) {
    next.stato = next.stato === "error" ? "error" : "partial";
  } else if (next.stato !== "error") {
    next.stato = "not_supported";
  }

  return next;
}

function finalizeAnalysis(analysis, fallbackText = null) {
  const profilo = analysis.profilo ?? "magazzino";
  const subtype = analysis.sottotipoDocumento ?? analysis.tipoDocumento;
  if (isLibrettoDocumentContext(profilo, subtype)) {
    return finalizeLibrettoAnalysis(analysis, fallbackText);
  }

  const next = {
    ...analysis,
    profilo,
    tipoDocumento:
      profilo === "documento_mezzo"
        ? normalizeVehicleDocumentSubtype(analysis.sottotipoDocumento ?? analysis.tipoDocumento)
        : normalizeDocumentType(analysis.tipoDocumento),
    sottotipoDocumento:
      profilo === "documento_mezzo"
        ? normalizeVehicleDocumentSubtype(analysis.sottotipoDocumento ?? analysis.tipoDocumento)
        : null,
    fornitore: toNullIfEmpty(analysis.fornitore),
    numeroDocumento: toNullIfEmpty(analysis.numeroDocumento),
    dataDocumento: normalizeDateToDDMMYYYY(analysis.dataDocumento),
    destinatario: toNullIfEmpty(analysis.destinatario),
    valuta: normalizeCurrency(analysis.valuta),
    imponibile:
      typeof analysis.imponibile === "number" && Number.isFinite(analysis.imponibile)
        ? analysis.imponibile
        : null,
    ivaImporto:
      typeof analysis.ivaImporto === "number" && Number.isFinite(analysis.ivaImporto)
        ? analysis.ivaImporto
        : null,
    ivaPercentuale: toNullIfEmpty(analysis.ivaPercentuale),
    totaleDocumento:
      typeof analysis.totaleDocumento === "number" && Number.isFinite(analysis.totaleDocumento)
        ? analysis.totaleDocumento
        : null,
    targa: normalizeVehiclePlate(analysis.targa),
    km:
      typeof analysis.km === "number" && Number.isFinite(analysis.km)
        ? analysis.km
        : parseLocalizedNumber(analysis.km),
    telaio: toNullIfEmpty(analysis.telaio),
    proprietario: toNullIfEmpty(analysis.proprietario),
    assicurazione: toNullIfEmpty(analysis.assicurazione),
    marca: toNullIfEmpty(analysis.marca),
    modello: toNullIfEmpty(analysis.modello),
    dataImmatricolazione: normalizeDateToDDMMYYYY(analysis.dataImmatricolazione),
    dataScadenza: normalizeDateToDDMMYYYY(analysis.dataScadenza),
    dataUltimoCollaudo: normalizeDateToDDMMYYYY(analysis.dataUltimoCollaudo),
    dataScadenzaRevisione: normalizeDateToDDMMYYYY(analysis.dataScadenzaRevisione),
    riassuntoBreve: toNullIfEmpty(analysis.riassuntoBreve),
    noteImportanti: uniqueStrings(analysis.noteImportanti ?? []),
    righe: Array.isArray(analysis.righe)
      ? analysis.righe.filter(Boolean).map((row, index) => normalizeRow(row, index, analysis.valuta)).filter(Boolean)
      : [],
    warnings: Array.isArray(analysis.warnings)
      ? analysis.warnings.filter((entry) => entry && entry.code && entry.message)
      : [],
    testoEstrattoBreve: toNullIfEmpty(analysis.testoEstrattoBreve ?? fallbackText)?.slice(0, 2000) ?? null,
  };

  next.riassuntoBreve = next.riassuntoBreve ?? buildAnalysisSummary(next);
  next.campiMancanti = buildMissingFields(next);

  if (next.profilo === "documento_mezzo") {
    if (next.targa && (next.sottotipoDocumento || next.dataDocumento)) {
      next.stato = next.campiMancanti.length <= 2 ? "ready" : "partial";
    } else if (next.testoEstrattoBreve) {
      next.stato = next.stato === "error" ? "error" : "partial";
    } else if (next.stato !== "error") {
      next.stato = "not_supported";
    }
    return next;
  }

  if (next.profilo === "preventivo_magazzino") {
    if (next.righe.length > 0 && next.campiMancanti.length <= 2) {
      next.stato = "ready";
    } else if (
      [next.fornitore, next.numeroDocumento, next.dataDocumento, next.totaleDocumento].filter(Boolean).length >= 2 ||
      next.testoEstrattoBreve
    ) {
      next.stato = next.stato === "error" ? "error" : "partial";
    } else if (next.stato !== "error") {
      next.stato = "not_supported";
    }
    return next;
  }

  if (next.righe.length > 0 && next.campiMancanti.length <= 2) {
    next.stato = "ready";
  } else if (
    [next.tipoDocumento, next.fornitore, next.numeroDocumento, next.dataDocumento].filter(Boolean).length >= 2 ||
    next.righe.length > 0 ||
    next.testoEstrattoBreve
  ) {
    next.stato = next.stato === "error" ? "error" : "partial";
  } else if (next.stato !== "error") {
    next.stato = "not_supported";
  }

  return next;
}

async function extractTextFromPdf(buffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const standardFontDataUrl = pathToFileURL(
    path.resolve(process.cwd(), "node_modules/pdfjs-dist/standard_fonts") + path.sep,
  ).href;
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl,
  });
  const document = await loadingTask.promise;
  const pages = [];

  for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex += 1) {
    const page = await document.getPage(pageIndex);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((entry) => ("str" in entry ? entry.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  return {
    pageCount: document.numPages,
    text: pages.join("\n"),
  };
}

function extractFirstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1] ?? null;
    if (value) {
      return value;
    }
  }

  return null;
}

function extractHeuristicRows(text, fallbackCurrency = null) {
  const rows = [];
  const normalizedText = normalizeMultilineText(text);

  const explicitMaterialMatches = [...normalizedText.matchAll(/(?:^|\n)(?:materiale|articolo|descrizione)\s*:\s*([^\n]+?)(?=(?:\n|$))/gim)];
  explicitMaterialMatches.forEach((match, index) => {
    const segment = normalizeText(match[1]);
    if (!segment) {
      return;
    }

    const description = extractFirstMatch(segment, [
      /^(.+?)(?=\s+(?:quantita|qta|qt|prezzo|totale|importo|codice)\b)/i,
      /^(.+)$/i,
    ]);
    const quantityRaw = extractFirstMatch(segment, [
      /(?:quantita|qta|qt)\s*[:=]?\s*([0-9.,]+)/i,
      /\b([0-9]+(?:[.,][0-9]+)?)\s*(?:pz|pezzi|lt|l|litri|kg|mt|m)\b/i,
    ]);
    const unitRaw = extractFirstMatch(segment, [
      /(?:quantita|qta|qt)\s*[:=]?\s*[0-9.,]+\s*([a-zA-Z]+)/i,
      /\b[0-9]+(?:[.,][0-9]+)?\s*(pz|pezzi|lt|l|litri|kg|mt|m)\b/i,
    ]);
    const unitPriceRaw = extractFirstMatch(segment, [
      /(?:prezzo(?:\s*unitario)?|costo(?:\s*unitario)?)\s*[:=]?\s*([0-9.,]+)/i,
    ]);
    const lineTotalRaw = extractFirstMatch(segment, [
      /(?:totale(?:\s*riga)?|importo)\s*[:=]?\s*([0-9.,]+)/i,
    ]);
    const articleCode = extractFirstMatch(segment, [
      /(?:codice(?:\s*articolo)?|art\.?|cod\.)\s*[:=]?\s*([A-Za-z0-9./_-]{2,})/i,
    ]);

    rows.push({
      id: buildRowId(index),
      descrizione: toNullIfEmpty(description),
      quantita: parseLocalizedNumber(quantityRaw),
      unita: normalizeUnit(unitRaw),
      prezzoUnitario: parseLocalizedNumber(unitPriceRaw),
      totaleRiga: parseLocalizedNumber(lineTotalRaw),
      codiceArticolo: toNullIfEmpty(articleCode),
      valuta: fallbackCurrency,
      confidence: 0.55,
      warnings: [],
    });
  });

  if (rows.length > 0) {
    return rows;
  }

  const lineCandidates = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 80);

  lineCandidates.forEach((line, index) => {
    if (!/\d/.test(line)) {
      return;
    }

    const quantityMatch = line.match(/\b([0-9]+(?:[.,][0-9]+)?)\s*(pz|pezzi|lt|l|litri|kg|mt|m)\b/i);
    const priceMatch = line.match(/\b([0-9]+(?:[.,][0-9]+)?)\s*(?:eur|euro|€|chf)\b/i);
    if (!quantityMatch && !priceMatch) {
      return;
    }

    const description = line
      .replace(/\b([0-9]+(?:[.,][0-9]+)?)\s*(pz|pezzi|lt|l|litri|kg|mt|m)\b/i, "")
      .replace(/\b([0-9]+(?:[.,][0-9]+)?)\s*(?:eur|euro|€|chf)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!description) {
      return;
    }

    rows.push({
      id: buildRowId(index),
      descrizione: description,
      quantita: parseLocalizedNumber(quantityMatch?.[1] ?? null),
      unita: normalizeUnit(quantityMatch?.[2] ?? null),
      prezzoUnitario: null,
      totaleRiga: parseLocalizedNumber(priceMatch?.[1] ?? null),
      codiceArticolo: null,
      valuta: normalizeCurrency(priceMatch?.[0] ?? null) || fallbackCurrency,
      confidence: 0.35,
      warnings: [],
    });
  });

  return rows;
}

function buildHeuristicAnalysis(args) {
  if (isLibrettoDocumentContext(args.profilo, args.documentSubtypeHint)) {
    const analysis = buildBaseLibrettoAnalysis({
      profilo: args.profilo,
      stato: "partial",
      tipoSorgente: args.tipoSorgente,
      modalitaEstrazione: args.modalitaEstrazione,
      providerUsato: false,
    });
    const text = normalizeMultilineText(args.text || "");

    analysis.tipoDocumento = "libretto";
    analysis.sottotipoDocumento = "libretto";
    analysis.targa =
      normalizeText(
        extractFirstMatch(text, [
          /(?:targa|mezzo|veicolo)\s*[:=-]?\s*([A-Z]{2}\s*[0-9]{3,6})/i,
          /\b([A-Z]{2}\s*[0-9]{3,6})\b/,
        ]),
      ) || "";
    analysis.telaio =
      toNullIfEmpty(
        extractFirstMatch(text, [/(?:telaio|vin|chassis)\s*[:=-]?\s*([A-Z0-9 ]{6,})/i]),
      ) ?? "";
    analysis.testoEstrattoBreve = toNullIfEmpty(text)?.slice(0, 2000) ?? null;

    return finalizeAnalysis(analysis, text);
  }

  const analysis = buildBaseAnalysis({
    profilo: args.profilo,
    stato: "partial",
    tipoSorgente: args.tipoSorgente,
    modalitaEstrazione: args.modalitaEstrazione,
    providerUsato: false,
  });
  const text = normalizeMultilineText(args.text || "");

  analysis.tipoDocumento = normalizeDocumentType(
    extractFirstMatch(text, [
      /\b(fattura(?:\s+accompagnatoria)?|documento di trasporto|doc\.?\s*di trasporto|ddt|preventivo|offerta)\b/i,
    ]),
  );
  analysis.sottotipoDocumento =
    normalizeVehicleDocumentSubtype(
      extractFirstMatch(text, [/\b(libretto|assicurazione|polizza|revisione|collaudo)\b/i]),
    ) || normalizeVehicleDocumentSubtype(args.documentSubtypeHint);
  analysis.fornitore = toNullIfEmpty(
    extractFirstMatch(text, [
      /(?:^|\n)fornitore\s*[:=-]\s*([^\n]+)/im,
      /(?:^|\n)ragione sociale\s*[:=-]\s*([^\n]+)/im,
      /(?:^|\n)cedente prestatore\s*[:=-]\s*([^\n]+)/im,
    ]),
  );
  analysis.numeroDocumento = toNullIfEmpty(
    extractFirstMatch(text, [
      /(?:fattura|ddt|documento|preventivo)\s*(?:n\.?|nr\.?|numero)\s*[:#-]?\s*([A-Z0-9./_-]{3,})/i,
      /(?:numero(?:\s*documento)?|doc(?:umento)?\.?)\s*[:#-]\s*([A-Z0-9./_-]{3,})/i,
    ]),
  );
  analysis.dataDocumento = normalizeDateToDDMMYYYY(
    extractFirstMatch(text, [
      /(?:data(?:\s*documento)?|del)\s*[:=-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i,
      /\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/,
    ]),
  );
  analysis.destinatario = toNullIfEmpty(
    extractFirstMatch(text, [
      /(?:^|\n)destinatario\s*[:=-]\s*([^\n]+)/im,
      /(?:^|\n)cliente\s*[:=-]\s*([^\n]+)/im,
    ]),
  );
  analysis.imponibile = parseLocalizedNumber(
    extractFirstMatch(text, [/(?:imponibile)\s*[:=-]?\s*([0-9.,]+)/i]),
  );
  analysis.ivaImporto = parseLocalizedNumber(
    extractFirstMatch(text, [/(?:iva(?:\s*importo)?)\s*[:=-]?\s*([0-9.,]+)/i]),
  );
  analysis.ivaPercentuale = toNullIfEmpty(
    extractFirstMatch(text, [/(?:iva(?:\s*%| percentuale)?)\s*[:=-]?\s*([0-9.,]+%?)/i]),
  );
  analysis.totaleDocumento = parseLocalizedNumber(
    extractFirstMatch(text, [
      /(?:totale(?:\s*documento)?|tot\.)\s*[:=-]?\s*([0-9.,]+)/i,
      /(?:totale\s+da\s+pagare)\s*[:=-]?\s*([0-9.,]+)/i,
    ]),
  );
  analysis.targa = normalizeVehiclePlate(
    extractFirstMatch(text, [
      /(?:targa|mezzo|veicolo)\s*[:=-]?\s*([A-Z]{2}\s*[0-9]{3,4}\s*[A-Z]{1,2})/i,
      /\b([A-Z]{2}\s*[0-9]{3,4}\s*[A-Z]{1,2})\b/,
    ]),
  );
  analysis.km = parseLocalizedNumber(
    extractFirstMatch(text, [
      /(?:km(?:\/ore)?|chilometri|odometro|contachilometri)\s*[:=-]?\s*([0-9.]+(?:,[0-9]+)?)/i,
    ]),
  );
  analysis.telaio = toNullIfEmpty(
    extractFirstMatch(text, [/(?:telaio|vin)\s*[:=-]?\s*([A-Z0-9]{6,})/i]),
  );
  analysis.proprietario = toNullIfEmpty(
    extractFirstMatch(text, [/(?:proprietario|intestatario)\s*[:=-]?\s*([^\n]+)/im]),
  );
  analysis.assicurazione = toNullIfEmpty(
    extractFirstMatch(text, [/(?:assicurazione|compagnia)\s*[:=-]?\s*([^\n]+)/im]),
  );
  analysis.marca = toNullIfEmpty(extractFirstMatch(text, [/(?:marca)\s*[:=-]?\s*([^\n]+)/im]));
  analysis.modello = toNullIfEmpty(extractFirstMatch(text, [/(?:modello)\s*[:=-]?\s*([^\n]+)/im]));
  analysis.dataImmatricolazione = normalizeDateToDDMMYYYY(
    extractFirstMatch(text, [/(?:immatricolazione|data immatricolazione)\s*[:=-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i]),
  );
  analysis.dataScadenza = normalizeDateToDDMMYYYY(
    extractFirstMatch(text, [/(?:scadenza|valida fino al|valido fino al)\s*[:=-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i]),
  );
  analysis.dataUltimoCollaudo = normalizeDateToDDMMYYYY(
    extractFirstMatch(text, [/(?:ultimo collaudo|collaudo)\s*[:=-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i]),
  );
  analysis.dataScadenzaRevisione = normalizeDateToDDMMYYYY(
    extractFirstMatch(text, [/(?:scadenza revisione|revisione)\s*[:=-]?\s*(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i]),
  );
  analysis.valuta = normalizeCurrency(
    extractFirstMatch(text, [
      /\b(EUR|CHF)\b/i,
      /(€|euro)\b/i,
    ]),
  );
  analysis.noteImportanti = uniqueStrings([
    extractFirstMatch(text, [/(?:^|\n)note\s*[:=-]\s*([^\n]+)/im]),
    extractFirstMatch(text, [/(?:^|\n)causale\s*[:=-]\s*([^\n]+)/im]),
  ]);
  analysis.righe = extractHeuristicRows(text, analysis.valuta);
  analysis.testoEstrattoBreve = toNullIfEmpty(text)?.slice(0, 2000) ?? null;

  if (!analysis.righe.length) {
    pushWarning(
      analysis.warnings,
      "NO_ROWS_HEURISTIC",
      "info",
      "Nessuna riga materiale strutturata ricostruita con il parser locale.",
    );
  }

  return finalizeAnalysis(analysis, text);
}

function stripCodeFence(rawText) {
  const trimmed = normalizeText(rawText);
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

function parseProviderJson(rawText) {
  const clean = stripCodeFence(rawText);
  if (!clean) {
    return null;
  }

  try {
    return JSON.parse(clean);
  } catch {
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    try {
      return JSON.parse(clean.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
}

function normalizeProviderAnalysis(parsed, args) {
  const source = parsed && typeof parsed === "object" ? parsed : {};
  const rawDocument =
    source.document && typeof source.document === "object"
      ? source.document
      : source.header && typeof source.header === "object"
        ? source.header
        : source;
  const normalizedSubtype = normalizeVehicleDocumentSubtype(
    args.documentSubtypeHint ??
      rawDocument.documentSubtype ??
      rawDocument.sottotipoDocumento ??
      source.documentSubtype ??
      source.sottotipoDocumento ??
      rawDocument.type ??
      source.tipoDocumento,
  );
  const rawItems = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.righe)
      ? source.righe
      : Array.isArray(source.rows)
        ? source.rows
        : Array.isArray(source.voci)
          ? source.voci
          : [];

  if (isLibrettoDocumentContext(args.profilo, normalizedSubtype)) {
    const analysis = buildBaseLibrettoAnalysis({
      profilo: args.profilo,
      stato: "partial",
      tipoSorgente: args.tipoSorgente,
      modalitaEstrazione: args.modalitaEstrazione,
      providerUsato: true,
    });

    Object.assign(analysis, normalizeLibrettoFieldMap(rawDocument));
    analysis.tipoDocumento = "libretto";
    analysis.sottotipoDocumento = "libretto";
    analysis.riassuntoBreve = toNullIfEmpty(
      source.riassuntoBreve ??
        source.summary ??
        rawDocument.riassuntoBreve ??
        rawDocument.summary,
    );
    analysis.noteImportanti = [];
    analysis.testoEstrattoBreve = toNullIfEmpty(
      source.rawTextExcerpt ?? source.testoEstrattoBreve ?? source.rawText,
    )?.slice(0, 2000) ?? null;

    if (Array.isArray(source.warnings)) {
      source.warnings.forEach((warning) => {
        if (!warning) {
          return;
        }

        if (typeof warning === "string") {
          pushWarning(analysis.warnings, "MODEL_WARNING", "info", warning);
          return;
        }

        pushWarning(
          analysis.warnings,
          warning.code ?? "MODEL_WARNING",
          warning.severity ?? "info",
          warning.message ?? warning.code ?? "Segnalazione del provider.",
        );
      });
    }

    return finalizeAnalysis(analysis, args.fallbackText);
  }

  const analysis = buildBaseAnalysis({
    profilo: args.profilo,
    stato: "partial",
    tipoSorgente: args.tipoSorgente,
    modalitaEstrazione: args.modalitaEstrazione,
    providerUsato: true,
  });

  analysis.tipoDocumento = normalizeDocumentType(
    rawDocument.type ?? rawDocument.tipoDocumento ?? source.tipoDocumento,
  );
  analysis.sottotipoDocumento = normalizeVehicleDocumentSubtype(
    rawDocument.documentSubtype ??
      rawDocument.sottotipoDocumento ??
      source.documentSubtype ??
      source.sottotipoDocumento ??
      rawDocument.type ??
      source.tipoDocumento,
  );
  analysis.fornitore = toNullIfEmpty(
    rawDocument.supplierName ??
      rawDocument.fornitore ??
      source.fornitore ??
      source.supplierName ??
      source.ragioneSociale,
  );
  analysis.numeroDocumento = toNullIfEmpty(
    rawDocument.documentNumber ??
      rawDocument.numeroDocumento ??
      source.numeroDocumento ??
      source.number ??
      rawDocument.number,
  );
  analysis.dataDocumento = normalizeDateToDDMMYYYY(
    rawDocument.documentDate ??
      rawDocument.dataDocumento ??
      source.dataDocumento ??
      rawDocument.date ??
      source.date,
  );
  analysis.destinatario = toNullIfEmpty(
    rawDocument.recipientName ??
      rawDocument.destinatario ??
      source.destinatario ??
      source.recipientName,
  );
  analysis.valuta = normalizeCurrency(
    rawDocument.currency ?? rawDocument.valuta ?? source.currency ?? source.valuta,
  );
  analysis.imponibile = parseLocalizedNumber(
    rawDocument.imponibile ?? source.imponibile ?? rawDocument.taxableAmount,
  );
  analysis.ivaImporto = parseLocalizedNumber(
    rawDocument.ivaImporto ?? source.ivaImporto ?? rawDocument.ivaAmount,
  );
  analysis.ivaPercentuale = toNullIfEmpty(
    rawDocument.ivaPercentuale ?? source.ivaPercentuale ?? rawDocument.ivaRate,
  );
  analysis.totaleDocumento = parseLocalizedNumber(
    rawDocument.totaleDocumento ??
      source.totaleDocumento ??
      rawDocument.totalAmount ??
      source.totalAmount,
  );
  analysis.targa = normalizeVehiclePlate(
    rawDocument.targa ?? rawDocument.plate ?? source.targa ?? source.plate,
  );
  analysis.km = parseLocalizedNumber(
    rawDocument.km ??
      rawDocument.chilometri ??
      rawDocument.odometerKm ??
      source.km ??
      source.odometerKm,
  );
  analysis.telaio = toNullIfEmpty(
    rawDocument.vin ?? rawDocument.telaio ?? source.vin ?? source.telaio,
  );
  analysis.proprietario = toNullIfEmpty(
    rawDocument.ownerName ??
      rawDocument.proprietario ??
      source.ownerName ??
      source.proprietario ??
      source.intestatario,
  );
  analysis.assicurazione = toNullIfEmpty(
    rawDocument.insuranceCompany ??
      rawDocument.assicurazione ??
      source.insuranceCompany ??
      source.assicurazione,
  );
  analysis.marca = toNullIfEmpty(rawDocument.vehicleMake ?? rawDocument.marca ?? source.vehicleMake ?? source.marca);
  analysis.modello = toNullIfEmpty(
    rawDocument.vehicleModel ?? rawDocument.modello ?? source.vehicleModel ?? source.modello,
  );
  analysis.dataImmatricolazione = normalizeDateToDDMMYYYY(
    rawDocument.registrationDate ??
      rawDocument.dataImmatricolazione ??
      source.registrationDate ??
      source.dataImmatricolazione,
  );
  analysis.dataScadenza = normalizeDateToDDMMYYYY(
    rawDocument.expirationDate ??
      rawDocument.dataScadenza ??
      source.expirationDate ??
      source.dataScadenza,
  );
  analysis.dataUltimoCollaudo = normalizeDateToDDMMYYYY(
    rawDocument.inspectionDate ??
      rawDocument.dataUltimoCollaudo ??
      source.inspectionDate ??
      source.dataUltimoCollaudo,
  );
  analysis.dataScadenzaRevisione = normalizeDateToDDMMYYYY(
    rawDocument.reviewExpiryDate ??
      rawDocument.dataScadenzaRevisione ??
      source.reviewExpiryDate ??
      source.dataScadenzaRevisione,
  );
  analysis.riassuntoBreve = toNullIfEmpty(
    source.riassuntoBreve ??
      source.summary ??
      rawDocument.riassuntoBreve ??
      rawDocument.summary,
  );
  analysis.noteImportanti = uniqueStrings([
    ...(Array.isArray(rawDocument.notes) ? rawDocument.notes : []),
    ...(Array.isArray(source.noteImportanti) ? source.noteImportanti : []),
    ...(Array.isArray(source.notes) ? source.notes : []),
  ]);
  analysis.righe = rawItems
    .map((entry, index) => normalizeRow(entry, index, analysis.valuta))
    .filter(Boolean);
  analysis.testoEstrattoBreve = toNullIfEmpty(
    source.rawTextExcerpt ?? source.testoEstrattoBreve ?? source.rawText,
  )?.slice(0, 2000) ?? null;

  if (Array.isArray(source.warnings)) {
    source.warnings.forEach((warning) => {
      if (!warning) {
        return;
      }

      if (typeof warning === "string") {
        pushWarning(analysis.warnings, "MODEL_WARNING", "info", warning);
        return;
      }

      pushWarning(
        analysis.warnings,
        warning.code ?? "MODEL_WARNING",
        warning.severity ?? "info",
        warning.message ?? warning.code ?? "Segnalazione del provider.",
      );
    });
  }

  return finalizeAnalysis(analysis, args.fallbackText);
}

function mergeAnalyses(primaryAnalysis, fallbackAnalysis) {
  if (
    isLibrettoDocumentContext(
      primaryAnalysis?.profilo ?? fallbackAnalysis?.profilo,
      primaryAnalysis?.sottotipoDocumento ?? fallbackAnalysis?.sottotipoDocumento,
    )
  ) {
    const merged = buildBaseLibrettoAnalysis({
      stato: "partial",
      tipoSorgente: primaryAnalysis?.tipoSorgente ?? fallbackAnalysis?.tipoSorgente,
      modalitaEstrazione:
        primaryAnalysis?.modalitaEstrazione ?? fallbackAnalysis?.modalitaEstrazione,
      providerUsato: Boolean(primaryAnalysis?.providerUsato),
    });
    const primaryFields = normalizeLibrettoFieldMap(primaryAnalysis);
    const fallbackFields = buildHeuristicLibrettoFieldMap(fallbackAnalysis);

    LIBRETTO_CANONICAL_FIELDS.forEach((field) => {
      merged[field] = hasLibrettoValue(primaryFields[field])
        ? primaryFields[field]
        : fallbackFields[field];
    });

    merged.profilo = "documento_mezzo";
    merged.tipoDocumento = "libretto";
    merged.sottotipoDocumento = "libretto";
    merged.fornitore = primaryAnalysis?.fornitore ?? fallbackAnalysis?.fornitore;
    merged.numeroDocumento =
      primaryAnalysis?.numeroDocumento ?? fallbackAnalysis?.numeroDocumento;
    merged.dataDocumento = primaryAnalysis?.dataDocumento ?? fallbackAnalysis?.dataDocumento;
    merged.destinatario = primaryAnalysis?.destinatario ?? fallbackAnalysis?.destinatario;
    merged.valuta = primaryAnalysis?.valuta ?? fallbackAnalysis?.valuta;
    merged.imponibile =
      primaryAnalysis?.imponibile !== null && primaryAnalysis?.imponibile !== undefined
        ? primaryAnalysis.imponibile
        : fallbackAnalysis?.imponibile;
    merged.ivaImporto =
      primaryAnalysis?.ivaImporto !== null && primaryAnalysis?.ivaImporto !== undefined
        ? primaryAnalysis.ivaImporto
        : fallbackAnalysis?.ivaImporto;
    merged.ivaPercentuale = primaryAnalysis?.ivaPercentuale ?? fallbackAnalysis?.ivaPercentuale;
    merged.totaleDocumento =
      primaryAnalysis?.totaleDocumento !== null && primaryAnalysis?.totaleDocumento !== undefined
        ? primaryAnalysis.totaleDocumento
        : fallbackAnalysis?.totaleDocumento;
    merged.km =
      primaryAnalysis?.km !== null && primaryAnalysis?.km !== undefined
        ? primaryAnalysis.km
        : fallbackAnalysis?.km;
    merged.marca = primaryAnalysis?.marca ?? fallbackAnalysis?.marca;
    merged.modello = primaryAnalysis?.modello ?? fallbackAnalysis?.modello;
    merged.dataImmatricolazione =
      primaryAnalysis?.dataImmatricolazione ?? fallbackAnalysis?.dataImmatricolazione;
    merged.dataScadenza = primaryAnalysis?.dataScadenza ?? fallbackAnalysis?.dataScadenza;
    merged.dataUltimoCollaudo =
      primaryAnalysis?.dataUltimoCollaudo ?? fallbackAnalysis?.dataUltimoCollaudo;
    merged.dataScadenzaRevisione =
      primaryAnalysis?.dataScadenzaRevisione ?? fallbackAnalysis?.dataScadenzaRevisione;
    merged.riassuntoBreve = primaryAnalysis?.riassuntoBreve ?? fallbackAnalysis?.riassuntoBreve;
    merged.noteImportanti = uniqueStrings([
      ...(primaryAnalysis?.noteImportanti ?? []),
      ...(fallbackAnalysis?.noteImportanti ?? []),
    ]);
    merged.righe = [];
    merged.warnings = [
      ...(primaryAnalysis?.warnings ?? []),
      ...(fallbackAnalysis?.warnings ?? []),
    ];
    merged.campiMancanti = [];
    merged.testoEstrattoBreve =
      primaryAnalysis?.testoEstrattoBreve ?? fallbackAnalysis?.testoEstrattoBreve;

    return finalizeAnalysis(merged, merged.testoEstrattoBreve);
  }

  const base = buildBaseAnalysis({
    stato: "partial",
    tipoSorgente: primaryAnalysis?.tipoSorgente ?? fallbackAnalysis.tipoSorgente,
    modalitaEstrazione: primaryAnalysis?.modalitaEstrazione ?? fallbackAnalysis.modalitaEstrazione,
    providerUsato: Boolean(primaryAnalysis?.providerUsato),
  });

  const merged = {
    ...base,
    profilo: primaryAnalysis?.profilo ?? fallbackAnalysis.profilo,
    tipoDocumento: primaryAnalysis?.tipoDocumento ?? fallbackAnalysis.tipoDocumento,
    sottotipoDocumento:
      primaryAnalysis?.sottotipoDocumento ?? fallbackAnalysis.sottotipoDocumento,
    fornitore: primaryAnalysis?.fornitore ?? fallbackAnalysis.fornitore,
    numeroDocumento: primaryAnalysis?.numeroDocumento ?? fallbackAnalysis.numeroDocumento,
    dataDocumento: primaryAnalysis?.dataDocumento ?? fallbackAnalysis.dataDocumento,
    destinatario: primaryAnalysis?.destinatario ?? fallbackAnalysis.destinatario,
    valuta: primaryAnalysis?.valuta ?? fallbackAnalysis.valuta,
    imponibile:
      primaryAnalysis?.imponibile !== null && primaryAnalysis?.imponibile !== undefined
        ? primaryAnalysis.imponibile
        : fallbackAnalysis.imponibile,
    ivaImporto:
      primaryAnalysis?.ivaImporto !== null && primaryAnalysis?.ivaImporto !== undefined
        ? primaryAnalysis.ivaImporto
        : fallbackAnalysis.ivaImporto,
    ivaPercentuale: primaryAnalysis?.ivaPercentuale ?? fallbackAnalysis.ivaPercentuale,
    totaleDocumento:
      primaryAnalysis?.totaleDocumento !== null && primaryAnalysis?.totaleDocumento !== undefined
        ? primaryAnalysis.totaleDocumento
        : fallbackAnalysis.totaleDocumento,
    targa: primaryAnalysis?.targa ?? fallbackAnalysis.targa,
    km:
      primaryAnalysis?.km !== null && primaryAnalysis?.km !== undefined
        ? primaryAnalysis.km
        : fallbackAnalysis.km,
    telaio: primaryAnalysis?.telaio ?? fallbackAnalysis.telaio,
    proprietario: primaryAnalysis?.proprietario ?? fallbackAnalysis.proprietario,
    assicurazione: primaryAnalysis?.assicurazione ?? fallbackAnalysis.assicurazione,
    marca: primaryAnalysis?.marca ?? fallbackAnalysis.marca,
    modello: primaryAnalysis?.modello ?? fallbackAnalysis.modello,
    dataImmatricolazione:
      primaryAnalysis?.dataImmatricolazione ?? fallbackAnalysis.dataImmatricolazione,
    dataScadenza: primaryAnalysis?.dataScadenza ?? fallbackAnalysis.dataScadenza,
    dataUltimoCollaudo:
      primaryAnalysis?.dataUltimoCollaudo ?? fallbackAnalysis.dataUltimoCollaudo,
    dataScadenzaRevisione:
      primaryAnalysis?.dataScadenzaRevisione ?? fallbackAnalysis.dataScadenzaRevisione,
    riassuntoBreve: primaryAnalysis?.riassuntoBreve ?? fallbackAnalysis.riassuntoBreve,
    noteImportanti: uniqueStrings([
      ...(primaryAnalysis?.noteImportanti ?? []),
      ...(fallbackAnalysis.noteImportanti ?? []),
    ]),
    righe:
      primaryAnalysis?.righe?.length > 0 ? primaryAnalysis.righe : fallbackAnalysis.righe,
    warnings: [
      ...(primaryAnalysis?.warnings ?? []),
      ...(fallbackAnalysis.warnings ?? []),
    ],
    campiMancanti: [],
    testoEstrattoBreve: primaryAnalysis?.testoEstrattoBreve ?? fallbackAnalysis.testoEstrattoBreve,
  };

  return finalizeAnalysis(merged, merged.testoEstrattoBreve);
}

function buildProviderSystemPrompt(profile = "magazzino", subtype = null) {
  if (profile === "manutenzione") {
    return (
      "Sei il parser documentale OpenAI della nuova IA interna del gestionale. " +
      "Leggi fatture e DDT di officina o manutenzione mezzi. " +
      "Rispondi solo con JSON valido. " +
      "Non inventare mai dati: se un campo non e leggibile usa null. " +
      "Estrai solo dati utili alla review manutenzione: riassunto breve, targa, fornitore officina, data, totale, km se presenti, righe materiali/manodopera/ricambi e dubbi reali."
    );
  }

  if (profile === "documento_mezzo" && isLibrettoDocumentSubtype(subtype)) {
    return (
      "Sei il parser documentale OpenAI della nuova IA interna del gestionale. " +
      "Leggi libretti di circolazione svizzeri a template fisso con codici numerati. " +
      "Rispondi solo con JSON valido. " +
      "Non restituire mai null. " +
      "Non omettere mai nessuna delle 27 chiavi richieste. " +
      'Se un campo non e leggibile o assente restituisci sempre stringa vuota "". ' +
      "Non inventare, non dedurre e non tradurre i valori. " +
      "Estrai solo i 27 campi canonici del libretto richiesti dal client."
    );
  }

  if (profile === "documento_mezzo") {
    return (
      "Sei il parser documentale OpenAI della nuova IA interna del gestionale. " +
      "Leggi documenti mezzo come libretto, assicurazione, revisione e collaudo. " +
      "Rispondi solo con JSON valido. " +
      "Non inventare mai dati: se un campo non e leggibile usa null. " +
      "Estrai solo dati utili alla review e al possibile aggiornamento esplicito del mezzo: sottotipo documento, targa, telaio, proprietario, assicurazione/ente, marca, modello, date principali e dubbi reali."
    );
  }

  if (profile === "preventivo_magazzino") {
    return (
      "Sei il parser documentale OpenAI della nuova IA interna del gestionale. " +
      "Leggi preventivi di magazzino. " +
      "Rispondi solo con JSON valido. " +
      "Non inventare mai dati: se un campo non e leggibile usa null. " +
      "Estrai solo dati utili alla review archivistica del preventivo: fornitore, numero, data, totale, righe materiali e dubbi reali."
    );
  }

  if (profile === "preventivo_price_extract") {
    return (
      "Sei il parser documentale OpenAI della nuova IA interna del gestionale. " +
      "Leggi preventivi PDF o immagini e rispondi solo con JSON valido. " +
      "Non usare mai undefined: usa null se il dato non e disponibile. " +
      "Estrai solo il contratto preventivo_price_extract_v1 con document, supplier, items e warnings. " +
      "Date obbligatorie nel formato dd/mm/yyyy. " +
      "Valute ammesse solo CHF o EUR. " +
      "warnings.code puo contenere solo MISSING_CURRENCY, MISSING_UNIT_PRICE, LIKELY_TOTAL_PRICE, PARTIAL_TABLE, LOW_CONFIDENCE. " +
      "warnings.severity puo contenere solo info, warn, error. " +
      "confidence deve sempre essere un numero tra 0 e 1. " +
      "Non aggiungere testo fuori dal JSON."
    );
  }

  return (
    "Sei il parser documentale della nuova IA interna del gestionale. " +
    "Leggi fatture, DDT, preventivi e documenti materiali di magazzino. " +
    "Rispondi solo con JSON valido. " +
    "Non inventare mai dati: se un campo non e leggibile usa null. " +
    "Estrai solo righe materiali o economiche utili alla review operativa."
  );
}

function buildProviderUserInstructions(args) {
  const subtype = normalizeVehicleDocumentSubtype(args.documentSubtypeHint);

  if ((args.profile ?? "magazzino") === "manutenzione") {
    return JSON.stringify(
      {
        task: "Estrai dati documentali strutturati per review Manutenzione.",
        fileName: args.fileName,
        sourceHint: args.sourceHint,
        outputSchema: {
          document: {
            type: "fattura|ddt|altro|null",
            supplierName: "string|null",
            documentNumber: "string|null",
            documentDate: "dd/mm/yyyy|null",
            currency: "EUR|CHF|null",
            totalAmount: "number|null",
            plate: "string|null",
            odometerKm: "number|null",
            summary: "string|null",
            notes: ["string"],
          },
          items: [
            {
              description: "string|null",
              category: "materiali|manodopera|ricambi|altro|null",
              articleCode: "string|null",
              quantity: "number|null",
              uom: "string|null",
              unitPrice: "number|null",
              lineTotal: "number|null",
              currency: "EUR|CHF|null",
              confidence: "number|null",
              warnings: ["string"],
            },
          ],
          rawTextExcerpt: "string|null",
          warnings: [
            {
              code: "string",
              severity: "info|warn|error",
              message: "string",
            },
          ],
        },
        guardrails: [
          "Non aggiungere testo fuori dal JSON.",
          "Se il documento e ambiguo mantieni i campi null.",
          "Le quantita devono restare numeri, non stringhe.",
          "Non inventare la targa o il totale se non sono leggibili.",
        ],
      },
      null,
      2,
    );
  }

  if ((args.profile ?? "magazzino") === "documento_mezzo" && subtype === "libretto") {
    return JSON.stringify(
      {
        task: "Estrai i 27 campi canonici del libretto di circolazione svizzero.",
        fileName: args.fileName,
        sourceHint: args.sourceHint,
        documentSubtypeHint: subtype,
        outputSchema: Object.fromEntries(
          LIBRETTO_CANONICAL_FIELDS.map((field) => [field, "string"]),
        ),
        extractionRules: [
          "Il documento e un libretto di circolazione svizzero a template fisso con codici numerati a lato dei campi.",
          "Usa i codici numerati del libretto (03, 05, 08, 11, 13, 14, 15, 19, 21, 23, 25, 26, 28, 29, 30, 31, 35, 36, 37, 38, 39, 76, 77, 78) per localizzare i campi.",
          'Il veicolo puo essere rimorchio, trattore stradale, autocarro, autovettura o motoveicolo: se un campo non e presente o non e leggibile restituisci sempre "".',
          "Preserva la formattazione originale dei valori: punti, asterischi, maiuscole, spazi e date come sul documento.",
          "indirizzo e localita devono essere separati: indirizzo = via e numero civico, localita = CAP e citta.",
          'luogoDataRilascio (codice 38) deve essere luogo + data uniti da uno spazio, ad esempio "Camorino 09.04.2026".',
          'annotazioni (codici 13/14) deve riportare il testo integrale riga per riga, con "\\n" tra le righe se multilinea.',
          "Non usare la riga 39 come ultimoCollaudo: la riga 39 e prossimoCollaudoRevisione.",
          "ultimoCollaudo va letto dalla riga 38 come data di collaudo piu recente.",
          "Non inventare, non dedurre da altri campi, non normalizzare e non tradurre.",
          'Gli asterischi nei libretti svizzeri hanno due significati distinti: (a) uno o due asterischi PREFISSI a un valore numerico (es. "**4350", "*34650", "*39000") sono marcatori tipografici del valore stesso: il numero c\'e e va estratto SENZA gli asterischi (es. restituire "4350", "34650", "39000"); (b) una cella che contiene SOLO asterischi (es. "******") indica un campo non applicabile o non leggibile e va restituito come stringa vuota "".',
          "Il campo nAvs (codice 03, etichetta 'N. AVS / AHV-Nr') si trova sempre in alto a sinistra del libretto, nella sezione Detentore/Possessore, come prima riga della prima colonna. Il valore e tipicamente un numero con separatori a punto (es. '922.586'). Se leggibile va SEMPRE estratto in nAvs. Non confonderlo con altri numeri del documento.",
          "I campi pesi/carichi hanno codici specifici che NON vanno mai confusi: codice 30 'Peso a vuoto / Leergewicht' va in pesoVuoto; codice 31 'Carico utile / sella / Nutz-/Sattellast / Charge utile/sellette' va in caricoUtileSella; codice 35 'Peso totale / Gesamtgewicht / Poids total' va in pesoTotale; codice 36 'Peso totale del convoglio / Gewicht des Zuges / Poids de l ensemble' va in pesoTotaleRimorchio; codice 77 'Carico sul letto / Charge sur le toit' va in caricoSulLetto; codice 78 'Carico rimorchiabile / Chargia annexa / Anhangelast' va in pesoRimorchiabile. Leggi SEMPRE il codice numerico a sinistra del valore, non la posizione visiva. Se il codice non e chiaro, preferisci stringa vuota piuttosto che mettere il valore nel campo sbagliato.",
        ],
        guardrails: [
          "Non aggiungere testo fuori dal JSON.",
          "Mai null, sempre stringa.",
          "Mai omettere una delle 27 chiavi.",
          "Non inventare, non dedurre da altri campi.",
          "Se due campi peso hanno valori diversi, NON invertirli: ogni valore appartiene al codice numerico che lo precede sul libretto. In caso di dubbio sul codice, restituisci stringa vuota per quel campo, non un valore preso da un altro codice.",
        ],
      },
      null,
      2,
    );
  }

  if ((args.profile ?? "magazzino") === "documento_mezzo") {
    return JSON.stringify(
      {
        task: "Estrai dati documentali strutturati per review Documento mezzo.",
        fileName: args.fileName,
        sourceHint: args.sourceHint,
        documentSubtypeHint: args.documentSubtypeHint || null,
        outputSchema: {
          document: {
            documentSubtype: "libretto|assicurazione|revisione|collaudo|null",
            documentDate: "dd/mm/yyyy|null",
            plate: "string|null",
            vin: "string|null",
            ownerName: "string|null",
            insuranceCompany: "string|null",
            vehicleMake: "string|null",
            vehicleModel: "string|null",
            registrationDate: "dd/mm/yyyy|null",
            expirationDate: "dd/mm/yyyy|null",
            inspectionDate: "dd/mm/yyyy|null",
            reviewExpiryDate: "dd/mm/yyyy|null",
            summary: "string|null",
            notes: ["string"],
          },
          rawTextExcerpt: "string|null",
          warnings: [
            {
              code: "string",
              severity: "info|warn|error",
              message: "string",
            },
          ],
        },
        guardrails: [
          "Non aggiungere testo fuori dal JSON.",
          "Se il sottotipo non e chiaro usa null.",
          "Non inventare targa, telaio o scadenze se non sono leggibili.",
        ],
      },
      null,
      2,
    );
  }

  if ((args.profile ?? "magazzino") === "preventivo_magazzino") {
    return JSON.stringify(
      {
        task: "Estrai dati documentali strutturati per review Preventivo + Magazzino.",
        fileName: args.fileName,
        sourceHint: args.sourceHint,
        outputSchema: {
          document: {
            type: "preventivo|offerta|altro|null",
            supplierName: "string|null",
            documentNumber: "string|null",
            documentDate: "dd/mm/yyyy|null",
            currency: "EUR|CHF|null",
            totalAmount: "number|null",
            summary: "string|null",
            notes: ["string"],
          },
          items: [
            {
              description: "string|null",
              articleCode: "string|null",
              quantity: "number|null",
              uom: "string|null",
              unitPrice: "number|null",
              lineTotal: "number|null",
              currency: "EUR|CHF|null",
              confidence: "number|null",
              warnings: ["string"],
            },
          ],
          rawTextExcerpt: "string|null",
          warnings: [
            {
              code: "string",
              severity: "info|warn|error",
              message: "string",
            },
          ],
        },
        guardrails: [
          "Non aggiungere testo fuori dal JSON.",
          "Se il documento non e un preventivo mantieni type coerente ma non inventare.",
          "Le righe devono restare numeri e descrizioni utili alla review.",
        ],
      },
      null,
      2,
    );
  }

  if ((args.profile ?? "magazzino") === "preventivo_price_extract") {
    return JSON.stringify(
      {
        task: "Estrai il contratto legacy preventivo_price_extract_v1 da un preventivo.",
        fileName: args.fileName,
        sourceHint: args.sourceHint,
        outputSchema: {
          schemaVersion: "preventivo_price_extract_v1",
          document: {
            number: "string|null",
            date: "dd/mm/yyyy|null",
            currency: "CHF|EUR|null",
            confidence: "number(0..1)",
          },
          supplier: {
            name: "string|null",
            confidence: "number(0..1)",
          },
          items: [
            {
              description: "string|null",
              articleCode: "string|null",
              uom: "string|null",
              unitPrice: "number|null",
              currency: "CHF|EUR|null",
              confidence: "number(0..1)",
            },
          ],
          warnings: [
            {
              code:
                "MISSING_CURRENCY|MISSING_UNIT_PRICE|LIKELY_TOTAL_PRICE|PARTIAL_TABLE|LOW_CONFIDENCE",
              severity: "info|warn|error",
              message: "string",
            },
          ],
        },
        guardrails: [
          "Non aggiungere testo fuori dal JSON.",
          "Se un dato non e leggibile usa null, mai undefined.",
          "Date sempre in formato dd/mm/yyyy.",
          "Le valute ammesse sono solo CHF o EUR.",
          "unitPrice deve essere il prezzo unitario della riga, non il totale documento.",
          "Non introdurre codici warning diversi da quelli richiesti.",
        ],
      },
      null,
      2,
    );
  }

  return JSON.stringify(
    {
      task: "Estrai dati documentali strutturati per review Magazzino.",
      fileName: args.fileName,
      sourceHint: args.sourceHint,
      outputSchema: {
        document: {
          type: "fattura|ddt|preventivo|altro|null",
          supplierName: "string|null",
          documentNumber: "string|null",
          documentDate: "dd/mm/yyyy|null",
          recipientName: "string|null",
          currency: "EUR|CHF|null",
          imponibile: "number|null",
          ivaAmount: "number|null",
          ivaRate: "string|null",
          totalAmount: "number|null",
          notes: ["string"],
        },
        items: [
          {
            description: "string|null",
            articleCode: "string|null",
            quantity: "number|null",
            uom: "string|null",
            unitPrice: "number|null",
            lineTotal: "number|null",
            currency: "EUR|CHF|null",
            confidence: "number|null",
            warnings: ["string"],
          },
        ],
        rawTextExcerpt: "string|null",
        warnings: [
          {
            code: "string",
            severity: "info|warn|error",
            message: "string",
          },
        ],
      },
      guardrails: [
        "Non aggiungere testo fuori dal JSON.",
        "Se il documento e ambiguo mantieni i campi null.",
        "Le quantita devono restare numeri, non stringhe.",
      ],
    },
    null,
    2,
  );
}

async function runProviderTextExtraction(args) {
  const response = await args.providerClient.responses.create({
    model: args.providerTarget.model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: buildProviderSystemPrompt(args.profile, args.documentSubtypeHint),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildProviderUserInstructions(args),
          },
          {
            type: "input_text",
            text: args.rawText.slice(0, MAX_TEXT_FOR_PROVIDER),
          },
        ],
      },
    ],
  });

  return parseProviderJson(response.output_text);
}

async function runProviderBinaryExtraction(args) {
  const content = [
    {
      type: "input_text",
      text: buildProviderUserInstructions(args),
    },
  ];

  const pages =
    Array.isArray(args.pages) && args.pages.length > 0
      ? args.pages.filter(
          (page) =>
            page &&
            typeof page === "object" &&
            typeof page.contentBase64 === "string" &&
            page.contentBase64.trim(),
        )
      : null;

  if (pages?.length) {
    pages.forEach((page, index) => {
      const pageMimeType =
        typeof page.mimeType === "string" && page.mimeType.trim()
          ? page.mimeType.trim()
          : "application/octet-stream";
      const pageFileName =
        typeof page.fileName === "string" && page.fileName.trim()
          ? page.fileName.trim()
          : pageMimeType === "application/pdf"
            ? `pagina-${index + 1}.pdf`
            : `pagina-${index + 1}.jpg`;
      const pageContentBase64 = page.contentBase64.trim();

      if (
        pageMimeType === "application/pdf" ||
        normalizeText(pageFileName).toLowerCase().endsWith(".pdf")
      ) {
        content.push({
          type: "input_file",
          filename: pageFileName,
          file_data: `data:${pageMimeType || "application/pdf"};base64,${pageContentBase64}`,
        });
        return;
      }

      content.push({
        type: "input_image",
        image_url: pageContentBase64.startsWith("data:")
          ? pageContentBase64
          : `data:${pageMimeType || "image/jpeg"};base64,${pageContentBase64}`,
      });
    });
  } else if (args.isPdf) {
    content.push({
      type: "input_file",
      filename: args.fileName || "documento.pdf",
      file_data: `data:${args.mimeType || "application/pdf"};base64,${args.contentBase64}`,
    });
  } else {
    content.push({
      type: "input_image",
      image_url: args.contentBase64.startsWith("data:")
        ? args.contentBase64
        : `data:${args.mimeType || "image/jpeg"};base64,${args.contentBase64}`,
    });
  }

  const response = await args.providerClient.responses.create({
    model: args.providerTarget.model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: buildProviderSystemPrompt(args.profile, args.documentSubtypeHint),
          },
        ],
      },
      {
        role: "user",
        content,
      },
    ],
  });

  return parseProviderJson(response.output_text);
}

export async function extractPreventivoPriceFromDocument(args) {
  const normalizedPages =
    Array.isArray(args.pages) && args.pages.length > 0
      ? args.pages
          .map((page) => {
            if (!page || typeof page !== "object") {
              return null;
            }

            const fileName =
              typeof page.fileName === "string" && page.fileName.trim()
                ? page.fileName.trim()
                : null;
            const mimeType =
              typeof page.mimeType === "string" && page.mimeType.trim()
                ? page.mimeType.trim()
                : null;
            const contentBase64 =
              typeof page.contentBase64 === "string" && page.contentBase64.trim()
                ? page.contentBase64.trim()
                : null;

            if (!contentBase64) {
              return null;
            }

            return {
              fileName,
              mimeType,
              contentBase64,
            };
          })
          .filter((page) => Boolean(page))
      : [];
  const hasPages = normalizedPages.length > 0;
  const pagesContainPdf = normalizedPages.some(
    (page) =>
      normalizeText(page?.mimeType).toLowerCase() === "application/pdf" ||
      normalizeText(page?.fileName).toLowerCase().endsWith(".pdf"),
  );

  if (hasPages && pagesContainPdf) {
    throw new Error("Il payload pages[] supporta solo immagini per preventivo-extract.");
  }

  if (!args.providerClient) {
    throw new Error("Provider OpenAI non configurato per l'estrazione preventivo.");
  }

  const primaryPage = normalizedPages[0] ?? null;
  const effectiveContentBase64 = primaryPage?.contentBase64 ?? args.contentBase64;
  const effectiveMimeType = primaryPage?.mimeType ?? args.mimeType;
  const effectiveFileName =
    primaryPage?.fileName ??
    args.fileName ??
    (normalizeText(effectiveMimeType).toLowerCase() === "application/pdf"
      ? "preventivo.pdf"
      : "preventivo.jpg");

  if (!effectiveContentBase64) {
    throw new Error("Contenuto documento mancante per l'estrazione preventivo.");
  }

  const buffer = Buffer.from(effectiveContentBase64, "base64");
  let extractedText = null;

  if (
    normalizeText(effectiveMimeType).toLowerCase() === "application/pdf" ||
    normalizeText(effectiveFileName).toLowerCase().endsWith(".pdf")
  ) {
    try {
      const pdfResult = await extractTextFromPdf(buffer);
      extractedText = normalizeMultilineText(pdfResult.text);
    } catch {
      extractedText = null;
    }
  }

  const sourceHint = hasPages
    ? "image_document"
    : detectAttachmentSourceKind(effectiveFileName, effectiveMimeType, extractedText);
  let providerParsed = null;

  if (sourceHint === "image_document" || sourceHint === "pdf_scan") {
    providerParsed = await runProviderBinaryExtraction({
      providerClient: args.providerClient,
      providerTarget: args.providerTarget,
      profile: "preventivo_price_extract",
      fileName: effectiveFileName,
      mimeType: effectiveMimeType,
      contentBase64: effectiveContentBase64,
      pages: normalizedPages,
      sourceHint,
      isPdf: sourceHint === "pdf_scan",
    });
  } else if (extractedText) {
    providerParsed = await runProviderTextExtraction({
      providerClient: args.providerClient,
      providerTarget: args.providerTarget,
      fileName: effectiveFileName,
      sourceHint,
      profile: "preventivo_price_extract",
      rawText: extractedText,
    });
  }

  if (!providerParsed) {
    throw new Error("Il provider OpenAI non ha restituito un JSON valido per preventivo-extract.");
  }

  return normalizePreventivoPriceExtractOutput(providerParsed);
}

function detectAttachmentSourceKind(fileName, mimeType, text) {
  const normalizedMime = normalizeText(mimeType).toLowerCase();
  const lowerFileName = normalizeText(fileName).toLowerCase();

  if (normalizedMime === "application/pdf" || lowerFileName.endsWith(".pdf")) {
    return normalizeText(text).length >= 40 ? "pdf_text" : "pdf_scan";
  }

  if (normalizedMime.startsWith("image/")) {
    return "image_document";
  }

  if (normalizedMime.startsWith("text/")) {
    return "text_document";
  }

  return "other";
}

export async function extractInternalAiDocumentAnalysis(args) {
  const normalizedPages =
    Array.isArray(args.pages) && args.pages.length > 0
      ? args.pages
          .map((page) => {
            if (!page || typeof page !== "object") {
              return null;
            }

            const fileName =
              typeof page.fileName === "string" && page.fileName.trim()
                ? page.fileName.trim()
                : null;
            const mimeType =
              typeof page.mimeType === "string" && page.mimeType.trim()
                ? page.mimeType.trim()
                : null;
            const contentBase64 =
              typeof page.contentBase64 === "string" && page.contentBase64.trim()
                ? page.contentBase64.trim()
                : null;

            if (!contentBase64) {
              return null;
            }

            return {
              fileName,
              mimeType,
              contentBase64,
            };
          })
          .filter((page) => Boolean(page))
      : [];
  const hasPages = normalizedPages.length > 0;
  const pagesContainPdf = normalizedPages.some(
    (page) =>
      normalizeText(page?.mimeType).toLowerCase() === "application/pdf" ||
      normalizeText(page?.fileName).toLowerCase().endsWith(".pdf"),
  );
  const primaryPage = normalizedPages[0] ?? null;
  const effectiveContentBase64 = primaryPage?.contentBase64 ?? args.contentBase64;
  const effectiveMimeType = primaryPage?.mimeType ?? args.mimeType;
  const effectiveFileName = primaryPage?.fileName ?? args.fileName;
  const buffer = Buffer.from(effectiveContentBase64, "base64");
  const profile = args.profile ?? "magazzino";
  let extractedText = null;

  if (
    normalizeText(effectiveMimeType).toLowerCase() === "application/pdf" ||
    normalizeText(effectiveFileName).toLowerCase().endsWith(".pdf")
  ) {
    try {
      const pdfResult = await extractTextFromPdf(buffer);
      extractedText = normalizeMultilineText(pdfResult.text);
    } catch {
      extractedText = null;
    }
  } else if (normalizeText(effectiveMimeType).toLowerCase().startsWith("text/")) {
    extractedText = buffer.toString("utf8");
  } else {
    extractedText = normalizeText(args.textExcerpt);
  }

  const tipoSorgente = hasPages
    ? pagesContainPdf
      ? "pdf_scan"
      : "image_document"
    : detectAttachmentSourceKind(effectiveFileName, effectiveMimeType, extractedText);
  const heuristicAnalysis = buildHeuristicAnalysis({
    profilo: profile,
    text: extractedText,
    tipoSorgente,
    modalitaEstrazione: extractedText ? "parser_locale" : "fallback_locale",
    documentSubtypeHint: args.documentSubtypeHint,
  });

  if (!args.providerClient) {
    if (args.providerRequired) {
      throw new Error("Provider OpenAI non configurato per l'analisi documentale richiesta.");
    }
    if (tipoSorgente === "image_document" || tipoSorgente === "pdf_scan") {
      pushWarning(
        heuristicAnalysis.warnings,
        "PROVIDER_REQUIRED_FOR_VISION",
        "warn",
        "Documento immagine o PDF scansione senza provider server-side: estrazione solo parziale.",
      );
      return finalizeAnalysis(heuristicAnalysis, extractedText);
    }

    return finalizeAnalysis(heuristicAnalysis, extractedText);
  }

  try {
    let providerParsed = null;
    let modalitaEstrazione = "provider_text";

    if (tipoSorgente === "image_document") {
      modalitaEstrazione = "provider_image";
      providerParsed = await runProviderBinaryExtraction({
        providerClient: args.providerClient,
        providerTarget: args.providerTarget,
        profile,
        fileName: effectiveFileName,
        mimeType: effectiveMimeType,
        contentBase64: effectiveContentBase64,
        pages: normalizedPages,
        sourceHint: tipoSorgente,
        documentSubtypeHint: args.documentSubtypeHint,
        isPdf: false,
      });
    } else if (tipoSorgente === "pdf_scan") {
      modalitaEstrazione = "provider_pdf_scan";
      providerParsed = await runProviderBinaryExtraction({
        providerClient: args.providerClient,
        providerTarget: args.providerTarget,
        profile,
        fileName: effectiveFileName,
        mimeType: effectiveMimeType,
        contentBase64: effectiveContentBase64,
        pages: normalizedPages,
        sourceHint: tipoSorgente,
        documentSubtypeHint: args.documentSubtypeHint,
        isPdf: true,
      });
    } else if (extractedText) {
      providerParsed = await runProviderTextExtraction({
        providerClient: args.providerClient,
        providerTarget: args.providerTarget,
        fileName: effectiveFileName,
        sourceHint: tipoSorgente,
        profile,
        documentSubtypeHint: args.documentSubtypeHint,
        rawText: extractedText,
      });
    }

    if (!providerParsed) {
      if (args.providerRequired) {
        throw new Error("Il provider OpenAI non ha restituito un JSON valido per la review documento.");
      }
      pushWarning(
        heuristicAnalysis.warnings,
        "PROVIDER_JSON_EMPTY",
        "warn",
        "Il provider non ha restituito un JSON valido: resto sul parser prudente locale.",
      );
      return finalizeAnalysis(heuristicAnalysis, extractedText);
    }

    const providerAnalysis = normalizeProviderAnalysis(providerParsed, {
      profilo: profile,
      tipoSorgente,
      modalitaEstrazione,
      fallbackText: extractedText,
      documentSubtypeHint: args.documentSubtypeHint,
    });

    return mergeAnalyses(providerAnalysis, heuristicAnalysis);
  } catch (error) {
    if (args.providerRequired) {
      throw error;
    }
    pushWarning(
      heuristicAnalysis.warnings,
      "PROVIDER_EXTRACTION_FAILED",
      "warn",
      error instanceof Error
        ? `Parsing documentale server-side non completato: ${error.message}`
        : "Parsing documentale server-side non completato.",
    );
    return finalizeAnalysis(heuristicAnalysis, extractedText);
  }
}
