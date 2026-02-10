const { getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fetch = require("node-fetch");

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const MODEL_NAME = "gemini-2.5-pro";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

const PROMPT_DOCUMENTI = `
Analizza il documento allegato (FATTURA oppure BOLLETTINO/DAS carburante).
Rispondi SOLO con JSON valido, senza testo extra, in questo formato:
{
  "tipoDocumento": "fattura" | "bollettino" | null,
  "fornitore": string | null,
  "destinatario": string | null,
  "numeroDocumento": string | null,
  "dataDocumento": string | null,
  "litriTotali": number | null,
  "totaleDocumento": number | null,
  "valuta": "EUR" | "CHF" | null,
  "prodotto": string | null,
  "testo": string | null,
  "daVerificare": boolean,
  "motivoVerifica": string | null
}

Regole obbligatorie:
- dataDocumento deve essere in formato gg/mm/aaaa quando leggibile.
- Se un campo non e chiaramente leggibile: imposta null.
- Se ci sono dubbi su almeno un campo chiave (tipoDocumento, dataDocumento, litriTotali, valuta):
  daVerificare=true e motivoVerifica breve.
- Valuta: usa EUR o CHF solo se certo, altrimenti null.
- Litri fattura: somma solo righe pertinenti a gasolio con UM in litri (L), se non certo usa null.
- Per bollettino/DAS totaleDocumento puo essere null.
`;

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");
  res.set("Vary", "Origin");
}

function stripDataUrl(input) {
  if (!input) return "";
  const raw = String(input);
  const commaIndex = raw.indexOf(",");
  return commaIndex >= 0 ? raw.slice(commaIndex + 1) : raw;
}

function parseJsonLoose(input) {
  if (input && typeof input === "object") return input;
  if (typeof input !== "string") return null;
  const raw = input.trim();
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function parseNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const text = String(value).trim();
  if (!text) return null;
  const normalized = text.replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function normalizeDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const it = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (it) {
    const day = Number(it[1]);
    const month = Number(it[2]);
    let year = Number(it[3]);
    if (it[3].length === 2) year += 2000;
    const d = new Date(year, month - 1, day);
    if (
      d.getFullYear() === year &&
      d.getMonth() === month - 1 &&
      d.getDate() === day
    ) {
      return `${pad2(day)}/${pad2(month)}/${year}`;
    }
    return null;
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const d = new Date(year, month - 1, day);
    if (
      d.getFullYear() === year &&
      d.getMonth() === month - 1 &&
      d.getDate() === day
    ) {
      return `${pad2(day)}/${pad2(month)}/${year}`;
    }
    return null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${pad2(parsed.getDate())}/${pad2(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
}

function yearMonthFromDate(dataDocumento) {
  if (!dataDocumento) return null;
  const match = String(dataDocumento).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}`;
}

function normalizeTipo(value, nomeFile) {
  const text = `${String(value ?? "")} ${String(nomeFile ?? "")}`.toLowerCase();
  if (!text.trim()) return null;
  if (text.includes("fattur")) return "fattura";
  if (
    text.includes("bollett") ||
    text.includes("bolla") ||
    text.includes("das") ||
    text.includes("ddt")
  ) {
    return "bollettino";
  }
  return null;
}

function normalizeValuta(value) {
  const raw = String(value ?? "").toUpperCase().trim();
  if (!raw) return null;
  if (raw.includes("EUR") || raw.includes("\u20ac")) return "EUR";
  if (raw.includes("CHF") || raw.includes("FR")) return "CHF";
  return null;
}

function toNullableString(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function isHeic(mimeType, nomeFile) {
  const mime = String(mimeType ?? "").toLowerCase();
  const file = String(nomeFile ?? "").toLowerCase();
  return (
    mime.includes("heic") ||
    mime.includes("heif") ||
    file.endsWith(".heic") ||
    file.endsWith(".heif")
  );
}

function isSupportedMime(mimeType) {
  const mime = String(mimeType ?? "").toLowerCase();
  return (
    mime === "application/pdf" ||
    mime === "image/jpeg" ||
    mime === "image/jpg" ||
    mime === "image/png" ||
    mime === "image/webp"
  );
}

function inferMimeType(mimeType, nomeFile) {
  const fromReq = String(mimeType ?? "").trim().toLowerCase();
  if (fromReq) return fromReq;
  const lower = String(nomeFile ?? "").toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  return "application/octet-stream";
}

async function getGeminiApiKey() {
  const ref = db.doc("@impostazioni_app/gemini");
  const snap = await ref.get();
  const apiKey = snap.data()?.apiKey;
  if (!apiKey) {
    throw new Error("API Key Gemini mancante.");
  }
  return apiKey;
}

async function loadFileInput({ fileUrl, fileBase64, mimeType }) {
  if (fileBase64) {
    const base64 = stripDataUrl(fileBase64);
    if (!base64) throw new Error("fileBase64 vuoto.");
    return { base64, mimeType };
  }
  if (!fileUrl) {
    throw new Error("Manca fileUrl o fileBase64.");
  }

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Download file fallito: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return { base64: buffer.toString("base64"), mimeType };
}

function normalizeExtractResult(raw, nomeFile) {
  const source = raw && typeof raw === "object" ? raw : {};
  const tipoDocumento = normalizeTipo(source.tipoDocumento, nomeFile);
  const dataDocumento = normalizeDate(source.dataDocumento);
  const litriTotali = parseNumberOrNull(source.litriTotali);
  const totaleDocumento = parseNumberOrNull(source.totaleDocumento);
  const valuta = normalizeValuta(source.valuta);
  const fornitore = toNullableString(source.fornitore);
  const destinatario = toNullableString(source.destinatario);
  const numeroDocumento = toNullableString(source.numeroDocumento);
  const prodotto = toNullableString(source.prodotto);
  const testo = toNullableString(source.testo);
  const yearMonth = yearMonthFromDate(dataDocumento);
  const forcedReview = Boolean(source.daVerificare);
  const reasonFromModel = toNullableString(source.motivoVerifica);

  const reasons = [];
  if (!tipoDocumento) reasons.push("tipo_documento_non_chiaro");
  if (!dataDocumento) reasons.push("data_non_leggibile");
  if (litriTotali === null) reasons.push("litri_non_leggibili");
  if (valuta === null) reasons.push("valuta_non_chiara");
  if (tipoDocumento === "fattura" && totaleDocumento === null) {
    reasons.push("totale_non_leggibile");
  }
  if (reasonFromModel) reasons.push(reasonFromModel);

  const uniqueReasons = Array.from(new Set(reasons));
  const daVerificare = forcedReview || uniqueReasons.length > 0;

  return {
    tipoDocumento,
    fornitore,
    destinatario,
    numeroDocumento,
    dataDocumento,
    yearMonth,
    litriTotali,
    totaleDocumento,
    valuta,
    prodotto,
    testo,
    daVerificare,
    motivoVerifica: uniqueReasons.length > 0 ? uniqueReasons.join(", ") : null,
  };
}

async function callGeminiExtract({ apiKey, mimeType, base64 }) {
  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT_DOCUMENTI },
          { inlineData: { mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  };

  const response = await fetch(`${BASE_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    const message =
      result?.error?.message || result?.error || `Errore Gemini HTTP ${response.status}`;
    throw new Error(String(message));
  }

  const text =
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    result?.candidates?.[0]?.content?.parts?.[0]?.functionCall?.args?.json ??
    result?.candidates?.[0]?.content?.parts?.[0]?.structuredResponse?.json ??
    null;
  const parsed = parseJsonLoose(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Risposta IA non valida.");
  }
  return parsed;
}

async function cisternaDocumentiExtractHandler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Metodo non consentito." });
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const nomeFile = String(body.nomeFile ?? "").trim();
    const mimeType = inferMimeType(body.mimeType, nomeFile);
    const fileUrl = toNullableString(body.fileUrl);
    const fileBase64 = toNullableString(body.fileBase64);

    if (isHeic(mimeType, nomeFile)) {
      return res.status(400).json({
        success: false,
        error: "Formato HEIC/HEIF non supportato. Converti in JPG/PNG o PDF.",
      });
    }
    if (!isSupportedMime(mimeType)) {
      return res.status(400).json({
        success: false,
        error: "Formato non supportato. Usa PDF, JPG o PNG.",
      });
    }

    const { base64 } = await loadFileInput({ fileUrl, fileBase64, mimeType });
    const apiKey = await getGeminiApiKey();
    const rawExtract = await callGeminiExtract({ apiKey, mimeType, base64 });
    const data = normalizeExtractResult(rawExtract, nomeFile);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const message = err && err.message ? err.message : "Errore estrazione documento.";
    setCors(res);
    return res.status(200).json({ success: false, error: String(message) });
  }
}

module.exports = { cisternaDocumentiExtractHandler };
