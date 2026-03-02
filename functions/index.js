/**
 * Firebase Function (Node 20) per l'estrazione dati dal libretto
 * Modello: gemini-2.5-flash (stabile e presente nella tua API key)
 */

const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { PDFDocument, StandardFonts, degrees, rgb } = require("pdf-lib");
const { randomUUID } = require("crypto");
const analisiEconomica = require("./analisiEconomica");

initializeApp();
const db = getFirestore();
const storage = getStorage();

// 🔥 MODELLO CONFERMATO DALLA TUA LISTA MODELLI
const MODEL_NAME = "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// Schema JSON completo per estrazione libretto svizzero
const VEHICLE_DATA_SCHEMA = {
  type: "OBJECT",
  properties: {
    targa: { type: "STRING" },
    marca: { type: "STRING" },
    modello: { type: "STRING" },
    telaio: { type: "STRING" },

    colore: { type: "STRING" },
    categoria: { type: "STRING" },

    cilindrata: { type: "STRING" },
    potenza: { type: "STRING" },

    pesoVuoto: { type: "STRING" },
    pesoTotale: { type: "STRING" },

    proprietario: { type: "STRING" },
    assicurazione: { type: "STRING" },

    immatricolazione: { type: "STRING" },

    ultimoCollaudo: { type: "STRING" },

    note: { type: "STRING" }
  },
  required: ["targa", "marca", "modello", "telaio"]
};

// Recupero API key
async function getGeminiApiKey() {
  const ref = db.doc("@impostazioni_app/gemini");
  const snap = await ref.get();
  const apiKey = snap.data()?.apiKey;

  if (!apiKey) throw new Error("API Key Gemini mancante");
  return apiKey;
}

function parseStorageInfo(fileUrl) {
  if (typeof fileUrl !== "string") return null;

  if (fileUrl.startsWith("gs://")) {
    const withoutPrefix = fileUrl.slice("gs://".length);
    const slashIndex = withoutPrefix.indexOf("/");
    if (slashIndex === -1) return null;
    return {
      bucketName: withoutPrefix.slice(0, slashIndex),
      objectPath: withoutPrefix.slice(slashIndex + 1),
    };
  }

  try {
    const url = new URL(fileUrl);
    const match = url.pathname.match(/\/b\/([^/]+)\/o\/([^?]+)/);
    if (!match) return null;
    return {
      bucketName: match[1],
      objectPath: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

function buildStampedPath(originalPath, status) {
  const suffix = `_STAMP_${status}_${Date.now()}`;
  if (originalPath) {
    const dotIndex = originalPath.lastIndexOf(".");
    if (dotIndex === -1) {
      return `${originalPath}${suffix}.pdf`;
    }
    return `${originalPath.slice(0, dotIndex)}${suffix}${originalPath.slice(dotIndex)}`;
  }
  return `stamped/${Date.now()}_${status}.pdf`;
}

const PREVENTIVO_WARNING_CODES = new Set([
  "MISSING_CURRENCY",
  "MISSING_UNIT_PRICE",
  "LIKELY_TOTAL_PRICE",
  "PARTIAL_TABLE",
  "LOW_CONFIDENCE",
]);

function toNullIfEmpty(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function clampConfidence(value, fallback = 0.3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalizeCurrency(value) {
  const raw = String(value ?? "").toUpperCase().trim();
  if (!raw) return null;
  if (raw.includes("CHF") || raw.includes("FR")) return "CHF";
  if (raw.includes("EUR") || raw.includes("€")) return "EUR";
  return null;
}

function normalizeDateToDDMMYYYY(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const dmy = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[2].padStart(2, "0");
    return `${dd}/${mm}/${dmy[3]}`;
  }

  const ymd = raw.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (ymd) {
    const dd = ymd[3].padStart(2, "0");
    const mm = ymd[2].padStart(2, "0");
    return `${dd}/${mm}/${ymd[1]}`;
  }

  return null;
}

function parseLocalizedNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  let text = String(value).trim();
  if (!text) return null;

  text = text
    .replace(/\s+/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!text) return null;

  const hasComma = text.includes(",");
  const hasDot = text.includes(".");

  if (hasComma && hasDot) {
    if (text.lastIndexOf(",") > text.lastIndexOf(".")) {
      text = text.replace(/\./g, "").replace(",", ".");
    } else {
      text = text.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    text = text.replace(",", ".");
  } else if (!hasComma && hasDot) {
    const parts = text.split(".");
    if (parts.length > 2) {
      const decimal = parts.pop();
      text = `${parts.join("")}.${decimal}`;
    } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
      text = text.replace(/\./g, "");
    }
  }

  const num = Number.parseFloat(text);
  return Number.isFinite(num) ? num : null;
}

function sanitizeUndefinedToNull(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((item) => sanitizeUndefinedToNull(item));
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeUndefinedToNull(v);
    }
    return out;
  }
  return value;
}

function pushWarning(warnings, code, severity, message) {
  if (!PREVENTIVO_WARNING_CODES.has(code)) return;
  const exists = warnings.some((w) => w.code === code && w.message === message);
  if (!exists) warnings.push({ code, severity, message });
}

function extractFirstJsonObject(text) {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function parseGeminiJson(result) {
  const parts = result?.candidates?.[0]?.content?.parts || [];
  let raw = null;

  for (const part of parts) {
    if (typeof part?.text === "string" && part.text.trim()) {
      raw = part.text;
      break;
    }
    if (part?.functionCall?.args?.json) {
      raw = part.functionCall.args.json;
      break;
    }
    if (part?.structuredResponse?.json) {
      raw = part.structuredResponse.json;
      break;
    }
  }

  if (!raw) return null;
  if (typeof raw === "object") return raw;

  try {
    return JSON.parse(raw);
  } catch {
    const extracted = extractFirstJsonObject(raw);
    if (!extracted) return null;
    return JSON.parse(extracted);
  }
}

function guessMimeTypeFromPath(path, fallback) {
  const clean = String(path ?? "").toLowerCase();
  if (clean.endsWith(".pdf")) return "application/pdf";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".webp")) return "image/webp";
  return fallback || "application/octet-stream";
}

function resolveStoragePathInfo(storagePath) {
  const normalized = String(storagePath ?? "").trim();
  if (!normalized) return null;

  const parsed = parseStorageInfo(normalized);
  if (parsed?.objectPath) {
    return {
      bucketName: parsed.bucketName || null,
      objectPath: parsed.objectPath,
    };
  }

  return {
    bucketName: null,
    objectPath: normalized.replace(/^\/+/, ""),
  };
}

async function downloadStorageAsInlineData(storagePath, fallbackMimeType) {
  const info = resolveStoragePathInfo(storagePath);
  if (!info?.objectPath) {
    throw new Error("storagePath non valido");
  }

  const bucket = info.bucketName ? storage.bucket(info.bucketName) : storage.bucket();
  const file = bucket.file(info.objectPath);

  let contentType = null;
  try {
    const [metadata] = await file.getMetadata();
    contentType = metadata?.contentType || null;
  } catch {
    contentType = null;
  }

  const [buffer] = await file.download();
  return {
    mimeType: contentType || guessMimeTypeFromPath(info.objectPath, fallbackMimeType),
    data: buffer.toString("base64"),
  };
}

function buildPreventivoPrompt(originalFileName) {
  const fileHint = toNullIfEmpty(originalFileName);
  return `
Leggi il documento di preventivo allegato (PDF o immagini).
Estrai SOLO dati prezzo utili e rispondi SOLO con JSON valido.
Non usare mai undefined: usa null se il dato non e disponibile.
Date nel formato dd/mm/yyyy.
Valute ammesse: CHF o EUR.

Schema obbligatorio:
{
  "schemaVersion": "preventivo_price_extract_v1",
  "document": {
    "number": "string|null",
    "date": "dd/mm/yyyy|null",
    "currency": "CHF|EUR|null",
    "confidence": 0.0
  },
  "supplier": {
    "name": "string|null",
    "confidence": 0.0
  },
  "items": [
    {
      "description": "string|null",
      "articleCode": "string|null",
      "uom": "string|null",
      "unitPrice": "number|null",
      "currency": "CHF|EUR|null",
      "confidence": 0.0
    }
  ],
  "warnings": [
    {
      "code": "MISSING_CURRENCY|MISSING_UNIT_PRICE|LIKELY_TOTAL_PRICE|PARTIAL_TABLE|LOW_CONFIDENCE",
      "severity": "info|warn|error",
      "message": "string"
    }
  ]
}
${fileHint ? `File originale: ${fileHint}` : ""}
`;
}

function estimateDocConfidence(documentData, validItemsCount) {
  const found = [documentData.number, documentData.date, documentData.currency].filter(Boolean).length;
  if (found === 3 && validItemsCount >= 1) return 0.9;
  if (found >= 1 && validItemsCount >= 1) return 0.6;
  return 0.3;
}

function normalizePreventivoOutput(parsed) {
  const warnings = [];
  const source = parsed && typeof parsed === "object" ? parsed : {};

  const rawDocument = source.document && typeof source.document === "object" ? source.document : {};
  const rawSupplier = source.supplier && typeof source.supplier === "object" ? source.supplier : {};
  const rawItems = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.righe)
      ? source.righe
      : Array.isArray(source.voci)
        ? source.voci
        : [];

  const documentData = {
    number: toNullIfEmpty(
      rawDocument.number ?? source.numeroPreventivo ?? source.numeroDocumento ?? source.number
    ),
    date: normalizeDateToDDMMYYYY(
      rawDocument.date ?? source.dataPreventivo ?? source.dataDocumento ?? source.date
    ),
    currency: normalizeCurrency(rawDocument.currency ?? source.currency ?? source.valuta),
    confidence: 0.3,
  };

  const supplierData = {
    name: toNullIfEmpty(rawSupplier.name ?? source.fornitore ?? source.supplierName),
    confidence: clampConfidence(rawSupplier.confidence, 0.3),
  };

  const normalizedItems = [];
  let missingUnitPriceCount = 0;
  let removedRowsCount = 0;
  let hasLikelyTotalPrice = false;

  for (const item of rawItems) {
    const entry = item && typeof item === "object" ? item : {};
    const description = toNullIfEmpty(entry.description ?? entry.descrizione ?? entry.articolo);
    const articleCode = toNullIfEmpty(entry.articleCode ?? entry.codiceArticolo ?? entry.codice);
    const uom = toNullIfEmpty(entry.uom ?? entry.unita ?? entry.um);
    const unitPriceRaw =
      entry.unitPrice ??
      entry.prezzoUnitario ??
      entry.prezzo_unitario ??
      entry.prezzo ??
      null;
    const unitPriceParsed = parseLocalizedNumber(unitPriceRaw);
    const unitPrice = unitPriceParsed !== null && unitPriceParsed > 0 ? unitPriceParsed : null;
    const itemCurrency = normalizeCurrency(entry.currency ?? entry.valuta) || documentData.currency;

    if (!description && unitPrice === null) {
      removedRowsCount += 1;
      continue;
    }

    if (unitPrice === null) {
      missingUnitPriceCount += 1;
      const totalCandidate = parseLocalizedNumber(entry.totale ?? entry.importo ?? entry.total);
      if (totalCandidate !== null) {
        hasLikelyTotalPrice = true;
      }
    }

    const itemConfidence = clampConfidence(
      entry.confidence,
      description && unitPrice !== null ? 0.9 : 0.6
    );

    normalizedItems.push({
      description,
      articleCode,
      uom,
      unitPrice,
      currency: itemCurrency,
      confidence: itemConfidence,
    });
  }

  if (!documentData.currency && normalizedItems.length > 0) {
    pushWarning(
      warnings,
      "MISSING_CURRENCY",
      "warn",
      "Valuta documento non identificata."
    );
  }

  if (missingUnitPriceCount > 0) {
    pushWarning(
      warnings,
      "MISSING_UNIT_PRICE",
      "warn",
      `Prezzo unitario mancante per ${missingUnitPriceCount} righe.`
    );
  }

  if (hasLikelyTotalPrice) {
    pushWarning(
      warnings,
      "LIKELY_TOTAL_PRICE",
      "info",
      "Alcune righe sembrano avere solo il totale e non il prezzo unitario."
    );
  }

  if (removedRowsCount > 0) {
    pushWarning(
      warnings,
      "PARTIAL_TABLE",
      "info",
      `Scartate ${removedRowsCount} righe senza descrizione e senza prezzo.`
    );
  }

  documentData.confidence = clampConfidence(
    rawDocument.confidence,
    estimateDocConfidence(documentData, normalizedItems.length)
  );

  if (documentData.confidence < 0.5 || supplierData.confidence < 0.5) {
    pushWarning(
      warnings,
      "LOW_CONFIDENCE",
      "warn",
      "Affidabilita estrazione bassa: verificare i dati."
    );
  }

  return sanitizeUndefinedToNull({
    schemaVersion: "preventivo_price_extract_v1",
    document: documentData,
    supplier: supplierData,
    items: normalizedItems,
    warnings,
  });
}

/**
 * ENDPOINT PUBBLICO:
 * https://us-central1-<PROJECT_ID>.cloudfunctions.net/estrazione_libretto
 */
exports.estrazioneDocumenti = require("./estrazioneDocumenti").estrazioneDocumenti;
exports.ia_cisterna_extract = require("./iaCisternaExtract").ia_cisterna_extract;
exports.analisi_economica_mezzo = analisiEconomica.analisi_economica_mezzo;
exports.estraiPreventivoIA = functions.https.onCall(async (data, context) => {
  void context;

  try {
    const bodyRaw = data || {};
    const body =
      bodyRaw &&
      typeof bodyRaw === "object" &&
      bodyRaw.data &&
      typeof bodyRaw.data === "object"
        ? bodyRaw.data
        : bodyRaw;
    const pdfStoragePath = toNullIfEmpty(body.pdfStoragePath);
    const imageStoragePaths = Array.isArray(body.imageStoragePaths)
      ? body.imageStoragePaths.map((p) => toNullIfEmpty(p)).filter(Boolean)
      : [];

    const hasPdf = Boolean(pdfStoragePath);
    const hasImages = imageStoragePaths.length > 0;

    if (hasPdf === hasImages) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Fornire solo pdfStoragePath oppure imageStoragePaths[]"
      );
    }

    if (imageStoragePaths.length > 10) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "imageStoragePaths supporta massimo 10 immagini"
      );
    }

    const apiKey = await getGeminiApiKey();
    const inlineParts = [];

    if (hasPdf) {
      inlineParts.push(await downloadStorageAsInlineData(pdfStoragePath, "application/pdf"));
    } else {
      for (const imagePath of imageStoragePaths) {
        inlineParts.push(await downloadStorageAsInlineData(imagePath, "image/jpeg"));
      }
    }

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPreventivoPrompt(body.originalFileName) },
            ...inlineParts.map((item) => ({
              inlineData: {
                mimeType: item.mimeType,
                data: item.data,
              },
            })),
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    };

    const url = `${BASE_URL}?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      console.error("Errore API Gemini (estraiPreventivoIA):", result?.error?.message || result);
      throw new functions.https.HttpsError(
        "internal",
        result?.error?.message || "Errore API Gemini"
      );
    }

    const parsed = parseGeminiJson(result);
    if (!parsed) {
      throw new functions.https.HttpsError(
        "internal",
        "Risposta IA non valida o non parseabile"
      );
    }

    return normalizePreventivoOutput(parsed);
  } catch (err) {
    if (err instanceof functions.https.HttpsError) {
      throw err;
    }
    console.error("ERRORE estraiPreventivoIA:", err?.message || err);
    throw new functions.https.HttpsError(
      "internal",
      err?.message || "Errore interno estraiPreventivoIA"
    );
  }
});
exports.stamp_pdf = functions.https.onRequest(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  res.set("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { fileUrl, status, stampTimeHHmm } = req.body || {};

  if (!fileUrl || typeof fileUrl !== "string") {
    return res.status(400).json({ error: "fileUrl mancante" });
  }

  const normalizedStatus = String(status || "").toUpperCase();
  if (normalizedStatus !== "APPROVATO" && normalizedStatus !== "RIFIUTATO") {
    return res.status(400).json({ error: "status non valido" });
  }

  if (
    !stampTimeHHmm ||
    typeof stampTimeHHmm !== "string" ||
    !/^\d{2}:\d{2}$/.test(stampTimeHHmm)
  ) {
    return res.status(400).json({ error: "stampTimeHHmm non valido" });
  }

  try {
    const storageInfo = parseStorageInfo(fileUrl);
    const bucket = storageInfo?.bucketName
      ? storage.bucket(storageInfo.bucketName)
      : storage.bucket();

    let pdfBuffer;
    if (storageInfo?.objectPath && fileUrl.startsWith("gs://")) {
      const [buffer] = await bucket.file(storageInfo.objectPath).download();
      pdfBuffer = buffer;
    } else {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return res.status(502).json({
          error: `Download PDF fallito: ${response.status} ${response.statusText}`,
        });
      }
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const stampFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const stampColor =
      normalizedStatus === "APPROVATO" ? rgb(0.2, 0.6, 0.2) : rgb(0.75, 0.15, 0.15);
    const stampOpacity = 0.16;
    const angleDeg = -35;

    pdfDoc.getPages().forEach((page) => {
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) * 0.18;
      const textWidth = stampFont.widthOfTextAtSize(normalizedStatus, fontSize);
      const textHeight = stampFont.heightAtSize(fontSize);
      const x = (width - textWidth) / 2;
      const y = (height - textHeight) / 2;

      page.drawText(normalizedStatus, {
        x,
        y,
        size: fontSize,
        font: stampFont,
        color: stampColor,
        rotate: degrees(angleDeg),
        opacity: stampOpacity,
      });
    });

    const pdfBytes = await pdfDoc.save();
    const stampedPath = buildStampedPath(storageInfo?.objectPath, normalizedStatus);
    const stampedFile = bucket.file(stampedPath);
    const token = randomUUID();

    await stampedFile.save(Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      metadata: {
        metadata: {
          firebaseStorageDownloadTokens: token,
        },
      },
    });

    const stampedUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      stampedPath
    )}?alt=media&token=${token}`;

    return res.status(200).json({ stampedUrl, stampedPath });
  } catch (err) {
    console.error("ERRORE stamp_pdf:", err);
    return res.status(500).json({ error: err.message });
  }
});
exports.estrazione_libretto = functions.https.onRequest(async (req, res) => {
  // CORS
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  res.set("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { base64Image, mimeType = "image/jpeg" } = req.body;

  if (!base64Image) {
    return res.status(400).json({ error: "base64Image mancante" });
  }

  try {
    const apiKey = await getGeminiApiKey();

    // Rimuove eventuale prefisso "data:image/jpeg;base64,"
    const cleanBase64 =
      base64Image.includes(",") ? base64Image.split(",")[1] : base64Image;

    // Payload per Gemini - REST API
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Estrai i dati del veicolo dal seguente libretto. Rispetta esattamente lo schema JSON richiesto."
            },
            {
              inlineData: {
                mimeType,
                data: cleanBase64
              }
            }
          ]
        }
      ],
      // OUTPUT JSON GARANTITO
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: VEHICLE_DATA_SCHEMA,
        temperature: 0
      }
    };

    const url = `${BASE_URL}?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Errore API Gemini:", result);
      return res.status(500).json({
        success: false,
        error: result.error?.message || "Errore API Gemini"
      });
    }

    // Estraggo JSON direttamente (schema garantisce correttezza)
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        success: false,
        error: "Risposta senza contenuto"
      });
    }

    const parsed = JSON.parse(text);

    return res.status(200).json({
      success: true,
      data: parsed
    });
  } catch (err) {
    console.error("Errore Function:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});



