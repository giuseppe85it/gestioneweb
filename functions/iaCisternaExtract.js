const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const MODEL_NAME = "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

async function getGeminiApiKey() {
  const snap = await db.doc("@impostazioni_app/gemini").get();
  const apiKey = snap.data()?.apiKey;
  if (!apiKey) throw new Error("API Key Gemini mancante");
  return apiKey;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCurrency(value) {
  const raw = String(value ?? "").toUpperCase().trim();
  if (!raw) return "UNKNOWN";
  if (raw.includes("EUR") || raw.includes("€")) return "EUR";
  if (raw.includes("CHF") || raw.includes("FR")) return "CHF";
  return "UNKNOWN";
}

function parseGeminiPart(result) {
  const firstPart = result?.candidates?.[0]?.content?.parts?.[0];
  if (!firstPart) return null;
  if (typeof firstPart.text === "string") return firstPart.text;
  if (firstPart.functionCall?.args?.json) return firstPart.functionCall.args.json;
  if (firstPart.structuredResponse?.json) return firstPart.structuredResponse.json;
  return null;
}

async function readFileInput(body) {
  const mimeType = String(body?.mimeType || "application/pdf");
  const providedBase64 = body?.fileBase64;
  const fileUrl = body?.fileUrl;

  if (typeof providedBase64 === "string" && providedBase64.trim()) {
    const cleanBase64 = providedBase64.includes(",")
      ? providedBase64.split(",")[1]
      : providedBase64;
    return { base64: cleanBase64, mimeType };
  }

  if (typeof fileUrl !== "string" || !fileUrl.trim()) {
    throw new Error("fileUrl o fileBase64 mancante");
  }

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Download file fallito: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const detectedMime = response.headers.get("content-type") || mimeType;
  return { base64, mimeType: detectedMime };
}

function buildPrompt() {
  return `
Leggi il documento di carico carburante cisterna.

Estrai solo i dati presenti nel documento.
Rispondi SOLO con JSON valido e senza testo fuori JSON.

Campi richiesti:
{
  "tipoDocumento": "string",
  "dataDocumento": "string",
  "fornitore": "string",
  "luogoConsegna": "string",
  "prodotto": "string",
  "litri15C": "number",
  "litriAmbiente": "number|null",
  "valuta": "string",
  "currency": "string",
  "totaleDocumento": "string|number|null",
  "numeroDocumento": "string",
  "testo": "string"
}

Se un campo non esiste, usa null o stringa vuota.
`;
}

function normalizeOutput(parsed) {
  const litri15C = toNumberOrNull(
    parsed?.litri15C ?? parsed?.litri15c ?? parsed?.litri_15c ?? parsed?.litri
  );
  const litriAmbiente = toNumberOrNull(
    parsed?.litriAmbiente ?? parsed?.litri_ambiente
  );
  const currency = normalizeCurrency(parsed?.currency ?? parsed?.valuta);

  const normalized = {
    tipoDocumento: String(parsed?.tipoDocumento ?? "").trim(),
    dataDocumento: String(parsed?.dataDocumento ?? "").trim(),
    fornitore: String(parsed?.fornitore ?? "").trim(),
    luogoConsegna: String(parsed?.luogoConsegna ?? "").trim(),
    prodotto: String(parsed?.prodotto ?? "").trim(),
    litri15C,
    litriAmbiente,
    valuta: currency,
    currency,
    totaleDocumento: parsed?.totaleDocumento ?? null,
    numeroDocumento: String(parsed?.numeroDocumento ?? "").trim(),
    testo: String(parsed?.testo ?? "").trim(),
  };

  if (litri15C == null) {
    normalized.daVerificare = true;
    normalized.motivoVerifica = "litri_non_trovati";
  }

  return normalized;
}

exports.ia_cisterna_extract = functions.https.onRequest(async (req, res) => {
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

  try {
    const apiKey = await getGeminiApiKey();
    const fileInput = await readFileInput(req.body || {});
    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPrompt() },
            {
              inlineData: {
                mimeType: fileInput.mimeType,
                data: fileInput.base64,
              },
            },
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
      return res.status(500).json({
        success: false,
        error: result?.error?.message || "Errore API Gemini",
      });
    }

    const raw = parseGeminiPart(result);
    if (!raw) {
      return res.status(500).json({
        success: false,
        error: "Risposta IA vuota",
      });
    }

    let parsed;
    if (typeof raw === "string") {
      parsed = JSON.parse(raw);
    } else if (typeof raw === "object") {
      parsed = raw;
    } else {
      throw new Error("Formato risposta IA non valido");
    }

    const normalized = normalizeOutput(parsed || {});
    return res.status(200).json({
      success: true,
      data: normalized,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Errore interno ia_cisterna_extract",
    });
  }
});

