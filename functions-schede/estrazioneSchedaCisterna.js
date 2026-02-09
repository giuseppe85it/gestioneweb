/**
 * Firebase Function (Node 20) per estrazione scheda cisterna (campi ridotti)
 * Modello: gemini-2.5-pro
 */

const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fetch = require("node-fetch"); // NECESSARIO
const sharp = require("sharp"); // NECESSARIO

initializeApp();
const db = getFirestore();

/**
 * Recupero API key da Firestore (come fa estrazione_libretto)
 */
async function getGeminiApiKey() {
  const ref = db.doc("@impostazioni_app/gemini");
  const snap = await ref.get();
  const apiKey = snap.data()?.apiKey;

  if (!apiKey) throw new Error("API Key Gemini mancante");
  return apiKey;
}

const PROMPT_SCHEDA_CISTERNA = `
Riceverai 3 immagini per UNA singola riga, in ordine: DATA, TARGA (MACCHINA), LITRI.

Restituisci SOLO JSON valido (niente testo extra, niente markdown), ESATTAMENTE in questo formato:
[
  {
    "data_raw": "<stringa come appare nella cella data>",
    "targa_raw": "<TI + cifre come appare nella cella targa>",
    "litri_raw": "<solo numero intero come appare nella cella litri>"
  }
]

Regole:
- Non interpretare, non normalizzare, non correggere.
- Trascrivi esattamente come appare nelle celle (spazi o trattini inclusi).
- Se non leggibile, usa "" o null per quel campo.
- litri_raw: solo cifre dell'intero, nessuna unita o testo extra.
`;

const PROMPT_CELLS = `
Riceverai 3 immagini distinte nello stesso ordine:
1) DATA
2) TARGA
3) LITRI

Trascrivi SOLO ciò che leggi. Non correggere, non normalizzare, non dedurre.
Se non sei sicuro scrivi "INCERTO". Se la cella è vuota scrivi "".

Rispondi SOLO JSON:
{
  "data_raw": "testo o INCERTO o vuoto",
  "targa_raw": "testo o INCERTO o vuoto",
  "litri_raw": "testo o INCERTO o vuoto"
}

Regole:
- targa: se non vedi chiaramente "TI" e i numeri, usa INCERTO.
- litri: numero intero tipico 1-999, altrimenti INCERTO.
- Nessun testo extra fuori JSON.
`;

/**
 * CONFIG GEMINI
 */
const MODEL_NAME = "gemini-2.5-pro";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");
}

function isEmptyValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

function normalizeStatus(rawValue, kind) {
  const raw = rawValue === undefined || rawValue === null ? "" : String(rawValue).trim();
  if (!raw) {
    return { value: "", status: "VUOTO" };
  }
  if (raw.toUpperCase() === "INCERTO") {
    return { value: "INCERTO", status: "INCERTO" };
  }

  if (kind === "targa") {
    if (!/^TI\s*\d{6}$/i.test(raw)) {
      return { value: raw, status: "INCERTO" };
    }
  }

  if (kind === "litri") {
    if (!/^\d{1,4}$/.test(raw)) {
      return { value: raw, status: "INCERTO" };
    }
    const num = Number.parseInt(raw, 10);
    if (!Number.isFinite(num) || num < 1 || num > 999) {
      return { value: raw, status: "INCERTO" };
    }
  }

  return { value: raw, status: "OK" };
}

function buildCellRow(rawRow, rowIndex) {
  const dataEval = normalizeStatus(rawRow?.data_raw, "data");
  const targaEval = normalizeStatus(rawRow?.targa_raw, "targa");
  const litriEval = normalizeStatus(rawRow?.litri_raw, "litri");

  return {
    rowIndex,
    data_raw: dataEval.value,
    targa_raw: targaEval.value,
    litri_raw: litriEval.value,
    data_status: dataEval.status,
    targa_status: targaEval.status,
    litri_status: litriEval.status,
  };
}

function buildCellsResponse(rows, rawText, forceNeedsReview) {
  const total = rows.length;
  const reviewRows = rows.filter(
    (row) =>
      row?.data_status !== "OK" ||
      row?.targa_status !== "OK" ||
      row?.litri_status !== "OK"
  ).length;
  return {
    ok: true,
    needsReview: Boolean(forceNeedsReview) || reviewRows > 0,
    rows,
    stats: {
      total,
      okRows: total - reviewRows,
      reviewRows,
    },
    rawText: typeof rawText === "string" ? rawText : "",
  };
}

function normalizeOutputRow(rawRow, debug) {
  const isValidObject = rawRow && typeof rawRow === "object";
  const dataRaw = isValidObject ? rawRow.data_raw : "";
  const targaRaw = isValidObject ? rawRow.targa_raw : "";
  const litriRaw = isValidObject ? rawRow.litri_raw : "";

  const flags = [];
  if (!isValidObject) flags.push("riga_invalid");
  if (isEmptyValue(dataRaw)) flags.push("data_illeggibile");
  if (isEmptyValue(targaRaw)) flags.push("targa_illeggibile");
  if (isEmptyValue(litriRaw)) flags.push("litri_illeggibile");

  return {
    data_raw: dataRaw === undefined ? "" : dataRaw,
    targa_raw: targaRaw === undefined ? "" : targaRaw,
    litri_raw: litriRaw === undefined ? "" : litriRaw,
    macchina_raw: targaRaw === undefined ? "" : targaRaw,
    litri_erogati_raw: litriRaw === undefined ? "" : litriRaw,
    data: dataRaw === undefined ? null : dataRaw,
    targa: targaRaw === undefined ? null : targaRaw,
    litri: litriRaw === undefined ? null : litriRaw,
    flags,
    DEBUG: debug || { data_b64: "", targa_b64: "", litri_b64: "" },
  };
}

function buildResponse(rows, rawText, forceNeedsReview) {
  const total = rows.length;
  const needsReviewCount = rows.filter((row) => (row.flags || []).length > 0).length;
  return {
    ok: true,
    needsReview: Boolean(forceNeedsReview) || needsReviewCount > 0,
    rows,
    stats: {
      total,
      okRows: total - needsReviewCount,
      reviewRows: needsReviewCount,
    },
    rawText: typeof rawText === "string" ? rawText : "",
  };
}

function stripDataUrl(input) {
  if (!input) return "";
  const raw = String(input);
  const comma = raw.indexOf(",");
  return comma >= 0 ? raw.slice(comma + 1) : raw;
}

async function extractRowFromCells(row, apiKey, rowIndex) {
  const dataImg = stripDataUrl(row?.dataImg);
  const targaImg = stripDataUrl(row?.targaImg);
  const litriImg = stripDataUrl(row?.litriImg);
  const debug = {
    data_b64: dataImg || "",
    targa_b64: targaImg || "",
    litri_b64: litriImg || "",
  };

  if (!dataImg || !targaImg || !litriImg) {
    return {
      row: normalizeOutputRow({ data_raw: "", targa_raw: "", litri_raw: "" }, debug),
      rawText: "",
    };
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT_SCHEDA_CISTERNA },
          { inlineData: { mimeType: "image/jpeg", data: dataImg } },
          { inlineData: { mimeType: "image/jpeg", data: targaImg } },
          { inlineData: { mimeType: "image/jpeg", data: litriImg } },
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
  const text =
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    result?.candidates?.[0]?.content?.parts?.[0]?.functionCall?.args?.json ??
    result?.candidates?.[0]?.content?.parts?.[0]?.structuredResponse?.json ??
    null;

  const parsed = safeParseJson(text);
  if (!parsed.ok) {
    return {
      error: {
        code: "MODEL_OUTPUT_NOT_JSON",
        rawText: parsed.rawText,
        rowIndex,
      },
    };
  }

  if (!Array.isArray(parsed.value) || parsed.value.length === 0) {
    return {
      error: {
        code: "MODEL_OUTPUT_NOT_JSON",
        rawText: parsed.rawText,
        rowIndex,
      },
    };
  }

  const first = parsed.value[0];
  if (!first || typeof first !== "object") {
    return {
      error: {
        code: "MODEL_OUTPUT_NOT_JSON",
        rawText: parsed.rawText,
        rowIndex,
      },
    };
  }

  const candidate = {
    data_raw: first.data_raw,
    targa_raw: first.targa_raw,
    litri_raw: first.litri_raw,
  };

  return {
    row: normalizeOutputRow(candidate, debug),
    rawText: typeof parsed.rawText === "string" ? parsed.rawText : "",
  };
}

async function extractRowFromCellImages(cell, apiKey, rowIndex) {
  const dataImg = stripDataUrl(cell?.data_b64);
  const targaImg = stripDataUrl(cell?.targa_b64);
  const litriImg = stripDataUrl(cell?.litri_b64);

  if (!dataImg || !targaImg || !litriImg) {
    return { row: buildCellRow({ data_raw: "", targa_raw: "", litri_raw: "" }, rowIndex) };
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT_CELLS },
          { inlineData: { mimeType: "image/jpeg", data: dataImg } },
          { inlineData: { mimeType: "image/jpeg", data: targaImg } },
          { inlineData: { mimeType: "image/jpeg", data: litriImg } },
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
  const text =
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    result?.candidates?.[0]?.content?.parts?.[0]?.functionCall?.args?.json ??
    result?.candidates?.[0]?.content?.parts?.[0]?.structuredResponse?.json ??
    null;

  const parsed = safeParseJson(text);
  if (!parsed.ok) {
    return {
      row: buildCellRow(
        { data_raw: "INCERTO", targa_raw: "INCERTO", litri_raw: "INCERTO" },
        rowIndex
      ),
      rawText: parsed.rawText,
    };
  }

  let candidate = parsed.value || {};
  if (Array.isArray(candidate)) {
    candidate = candidate[0] || {};
  }
  return {
    row: buildCellRow(candidate, rowIndex),
    rawText: typeof parsed.rawText === "string" ? parsed.rawText : "",
  };
}

function safeParseJson(input) {
  if (input && typeof input === "object") {
    return { ok: true, value: input, rawText: JSON.stringify(input) };
  }
  if (typeof input !== "string") {
    return { ok: false, value: null, rawText: String(input ?? "") };
  }
  const rawText = input;
  try {
    return { ok: true, value: JSON.parse(rawText), rawText };
  } catch {
    return { ok: false, value: null, rawText };
  }
}

async function fetchFileBase64(fileUrl) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Download file fallito: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  const meta = await sharp(inputBuffer).metadata();
  const originalWidth = meta.width || 0;
  const targetWidth = originalWidth > 0 ? Math.round(originalWidth * 3) : 1800;

  const processedBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({ width: targetWidth, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .jpeg({ quality: 90 })
    .toBuffer();

  console.log("SchedaCisterna preprocess size", {
    originalBytes: inputBuffer.length,
    processedBytes: processedBuffer.length,
    targetWidth,
  });

  const base64 = processedBuffer.toString("base64");
  const mimeType = "image/jpeg";
  return { base64, mimeType };
}

/**
 * FUNCTION estrazioneSchedaCisterna
 */
const estrazioneSchedaCisternaHandler = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    if (req.method !== "POST") {
      return res.status(200).json(buildResponse([], "", true));
    }

    const { mode, rows, cells } = req.body || {};

    if (mode === "cells") {
      if (!Array.isArray(cells) || cells.length === 0) {
        return res.status(200).json(buildCellsResponse([], "", true));
      }

      const apiKey = await getGeminiApiKey();
      const normalizedRows = [];
      const rawTexts = [];
      for (let i = 0; i < cells.length; i += 1) {
        const cell = cells[i];
        // eslint-disable-next-line no-await-in-loop
        const extracted = await extractRowFromCellImages(cell, apiKey, cell?.rowIndex ?? i);
        normalizedRows.push(extracted.row);
        if (extracted.rawText) rawTexts.push(extracted.rawText);
      }

      console.log("estrazioneSchedaCisterna cells", {
        total: normalizedRows.length,
        dubbi: normalizedRows.filter(
          (row) =>
            row?.data_status !== "OK" ||
            row?.targa_status !== "OK" ||
            row?.litri_status !== "OK"
        ).length,
      });

      return res
        .status(200)
        .json(buildCellsResponse(normalizedRows, rawTexts.join("\n"), false));
    }

    if (mode && mode !== "cells_v1") {
      return res.status(200).json(buildResponse([], "", true));
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(200).json(buildResponse([], "", true));
    }

    const apiKey = await getGeminiApiKey();
    const normalizedRows = [];
    const rawTexts = [];
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      // eslint-disable-next-line no-await-in-loop
      const extracted = await extractRowFromCells(row, apiKey, i);
      if (extracted?.error) {
        return res.status(200).json({
          ok: false,
          error: extracted.error.code || "MODEL_OUTPUT_NOT_JSON",
          rawText: extracted.error.rawText || "",
          rowIndex: extracted.error.rowIndex ?? i,
        });
      }
      normalizedRows.push(extracted.row);
      if (extracted.rawText) rawTexts.push(extracted.rawText);
    }

    console.log("estrazioneSchedaCisterna rows", {
      total: normalizedRows.length,
      dubbi: normalizedRows.filter((row) => (row.flags || []).length > 0).length,
    });

    return res.status(200).json(buildResponse(normalizedRows, rawTexts.join("\n"), false));
  } catch (err) {
    console.error("estrazioneSchedaCisterna ERROR", err?.stack || err);
    setCors(res);
    const mode = req?.body?.mode;
    if (mode === "cells") {
      return res
        .status(200)
        .json(buildCellsResponse([], String(err?.message || err || ""), true));
    }
    return res.status(200).json(buildResponse([], String(err?.message || err || ""), true));
  }
};

exports.estrazioneSchedaCisternaHandler = estrazioneSchedaCisternaHandler;
exports.estrazioneSchedaCisterna = functions.https.onRequest(estrazioneSchedaCisternaHandler);


