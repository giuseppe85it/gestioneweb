import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_TEXT_FOR_PROVIDER = 18000;
const SUPPORTED_OUTPUT_VERSION = 1;

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
    stato: args.stato,
    tipoSorgente: args.tipoSorgente,
    modalitaEstrazione: args.modalitaEstrazione,
    providerUsato: Boolean(args.providerUsato),
    tipoDocumento: null,
    fornitore: null,
    numeroDocumento: null,
    dataDocumento: null,
    destinatario: null,
    valuta: null,
    imponibile: null,
    ivaImporto: null,
    ivaPercentuale: null,
    totaleDocumento: null,
    noteImportanti: [],
    righe: [],
    warnings: [],
    campiMancanti: [],
    testoEstrattoBreve: null,
  };
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

function finalizeAnalysis(analysis, fallbackText = null) {
  const next = {
    ...analysis,
    tipoDocumento: normalizeDocumentType(analysis.tipoDocumento),
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
    noteImportanti: uniqueStrings(analysis.noteImportanti ?? []),
    righe: Array.isArray(analysis.righe)
      ? analysis.righe.filter(Boolean).map((row, index) => normalizeRow(row, index, analysis.valuta)).filter(Boolean)
      : [],
    warnings: Array.isArray(analysis.warnings)
      ? analysis.warnings.filter((entry) => entry && entry.code && entry.message)
      : [],
    testoEstrattoBreve: toNullIfEmpty(analysis.testoEstrattoBreve ?? fallbackText)?.slice(0, 2000) ?? null,
  };

  next.campiMancanti = buildMissingFields(next);

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
  const analysis = buildBaseAnalysis({
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
  const rawItems = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.righe)
      ? source.righe
      : Array.isArray(source.rows)
        ? source.rows
        : Array.isArray(source.voci)
          ? source.voci
          : [];

  const analysis = buildBaseAnalysis({
    stato: "partial",
    tipoSorgente: args.tipoSorgente,
    modalitaEstrazione: args.modalitaEstrazione,
    providerUsato: true,
  });

  analysis.tipoDocumento = normalizeDocumentType(
    rawDocument.type ?? rawDocument.tipoDocumento ?? source.tipoDocumento,
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
  const base = buildBaseAnalysis({
    stato: "partial",
    tipoSorgente: primaryAnalysis?.tipoSorgente ?? fallbackAnalysis.tipoSorgente,
    modalitaEstrazione: primaryAnalysis?.modalitaEstrazione ?? fallbackAnalysis.modalitaEstrazione,
    providerUsato: Boolean(primaryAnalysis?.providerUsato),
  });

  const merged = {
    ...base,
    tipoDocumento: primaryAnalysis?.tipoDocumento ?? fallbackAnalysis.tipoDocumento,
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

function buildProviderSystemPrompt() {
  return (
    "Sei il parser documentale della nuova IA interna del gestionale. " +
    "Leggi fatture, DDT, preventivi e documenti materiali di magazzino. " +
    "Rispondi solo con JSON valido. " +
    "Non inventare mai dati: se un campo non e leggibile usa null. " +
    "Estrai solo righe materiali o economiche utili alla review operativa."
  );
}

function buildProviderUserInstructions(fileName, sourceHint) {
  return JSON.stringify(
    {
      task: "Estrai dati documentali strutturati per review Magazzino.",
      fileName,
      sourceHint,
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
            text: buildProviderSystemPrompt(),
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildProviderUserInstructions(args.fileName, args.sourceHint),
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
      text: buildProviderUserInstructions(args.fileName, args.sourceHint),
    },
  ];

  if (args.isPdf) {
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
            text: buildProviderSystemPrompt(),
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
  const buffer = Buffer.from(args.contentBase64, "base64");
  let extractedText = null;

  if (
    normalizeText(args.mimeType).toLowerCase() === "application/pdf" ||
    normalizeText(args.fileName).toLowerCase().endsWith(".pdf")
  ) {
    try {
      const pdfResult = await extractTextFromPdf(buffer);
      extractedText = normalizeMultilineText(pdfResult.text);
    } catch {
      extractedText = null;
    }
  } else if (normalizeText(args.mimeType).toLowerCase().startsWith("text/")) {
    extractedText = buffer.toString("utf8");
  } else {
    extractedText = normalizeText(args.textExcerpt);
  }

  const tipoSorgente = detectAttachmentSourceKind(args.fileName, args.mimeType, extractedText);
  const heuristicAnalysis = buildHeuristicAnalysis({
    text: extractedText,
    tipoSorgente,
    modalitaEstrazione: extractedText ? "parser_locale" : "fallback_locale",
  });

  if (!args.providerClient) {
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
        fileName: args.fileName,
        mimeType: args.mimeType,
        contentBase64: args.contentBase64,
        sourceHint: tipoSorgente,
        isPdf: false,
      });
    } else if (tipoSorgente === "pdf_scan") {
      modalitaEstrazione = "provider_pdf_scan";
      providerParsed = await runProviderBinaryExtraction({
        providerClient: args.providerClient,
        providerTarget: args.providerTarget,
        fileName: args.fileName,
        mimeType: args.mimeType,
        contentBase64: args.contentBase64,
        sourceHint: tipoSorgente,
        isPdf: true,
      });
    } else if (extractedText) {
      providerParsed = await runProviderTextExtraction({
        providerClient: args.providerClient,
        providerTarget: args.providerTarget,
        fileName: args.fileName,
        sourceHint: tipoSorgente,
        rawText: extractedText,
      });
    }

    if (!providerParsed) {
      pushWarning(
        heuristicAnalysis.warnings,
        "PROVIDER_JSON_EMPTY",
        "warn",
        "Il provider non ha restituito un JSON valido: resto sul parser prudente locale.",
      );
      return finalizeAnalysis(heuristicAnalysis, extractedText);
    }

    const providerAnalysis = normalizeProviderAnalysis(providerParsed, {
      tipoSorgente,
      modalitaEstrazione,
      fallbackText: extractedText,
    });

    return mergeAnalyses(providerAnalysis, heuristicAnalysis);
  } catch (error) {
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
