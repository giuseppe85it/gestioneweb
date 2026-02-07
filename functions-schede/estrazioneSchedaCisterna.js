/**
 * Firebase Function (Node 20) per estrazione ultime 10 righe scheda cisterna
 * Modello: gemini-2.5-flash
 */

const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const cors = require("cors")({ origin: true });
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
TRASCRIZIONE FEDELE della tabella scheda carburante Caravate.

Devi trascrivere SOLO la tabella, una riga per riga scheda.
Non inventare. Non interpretare. Non correggere. Non completare.
Se un valore e incerto usa "?" nel campo.
Mantieni il punto decimale se presente (es. 349.775).
NON unire token: la targa e sempre separata dai contatori.
DATA deve essere ESATTAMENTE come scritto (gg/mm o gg/mm/aa). Non scrivere "/26" al posto del mese.

Restituisci SOLO JSON con questa struttura:

{
  "tsv_lines": [
    "DATA\tORA\tTARGA\tCONT_INI\tLITRI\tCONT_FIN\tAUTISTA"
  ],
  "needsReview": true|false,
  "notes": "max 1 frase"
}

Regole:
- "tsv_lines" in ordine dall'alto verso il basso dell'immagine.
- Ogni riga ha 7 colonne separate da TAB: DATA, ORA, TARGA, CONT_INI, LITRI, CONT_FIN, AUTISTA.
- "needsReview" true se c'e almeno un "?" o se il testo e molto ambiguo.
- "notes" max 1 frase.
NON aggiungere testo fuori dal JSON.
`;

/**
 * CONFIG GEMINI
 */
const MODEL_NAME = "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

function toStringOrNull(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const raw = String(value).replace(/\s+/g, "").replace(/,/g, ".");
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeFieldFlags(flags) {
  if (!flags || typeof flags !== "object") return undefined;
  const entries = Object.entries(flags).filter(([, value]) => value === "LOW_CONFIDENCE");
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries);
}

function normalizeRow(raw) {
  const rowIndex = Number.isFinite(Number(raw?.rowIndexFromTop))
    ? Number(raw.rowIndexFromTop)
    : null;
  const data = toStringOrNull(raw?.data);
  const ora = toStringOrNull(raw?.ora);
  const targa = toStringOrNull(raw?.targa)?.toUpperCase() ?? null;
  const litriErogati = toNumberOrNull(raw?.litriErogati);
  const contatore = toNumberOrNull(raw?.contatore);
  const autistaNome = toStringOrNull(raw?.autistaNome);
  const rawText = toStringOrNull(raw?.rawText);
  const separatorBefore = Boolean(raw?.separatorBefore);
  const fieldFlags = normalizeFieldFlags(raw?.fieldFlags);

  return {
    rowIndexFromTop: rowIndex,
    separatorBefore,
    data,
    ora,
    targa,
    litriErogati,
    contatore,
    autistaNome,
    rawText,
    fieldFlags,
  };
}

function ensureFieldFlags(row) {
  const requiredFields = ["data", "targa", "litriErogati", "contatore"];
  const flags = { ...(row.fieldFlags || {}) };
  requiredFields.forEach((field) => {
    if (row[field] == null) {
      flags[field] = "LOW_CONFIDENCE";
    }
  });

  const cleaned = normalizeFieldFlags(flags);
  return {
    ...row,
    fieldFlags: cleaned,
  };
}

function normalizeRows(rawRows) {
  const list = Array.isArray(rawRows) ? rawRows.map(normalizeRow) : [];
  const allHaveIndex = list.length > 0 && list.every((row) => row.rowIndexFromTop !== null);
  const ordered = allHaveIndex
    ? [...list].sort((a, b) => (a.rowIndexFromTop ?? 0) - (b.rowIndexFromTop ?? 0))
    : list;

  const limited = ordered.length > 10 ? ordered.slice(ordered.length - 10) : ordered;

  const withSeparators = limited.map((row, index) => {
    if (index === 0) {
      return { ...row, separatorBefore: false };
    }
    const prev = limited[index - 1];
    if (row.data && prev.data) {
      return { ...row, separatorBefore: row.data !== prev.data };
    }
    return row;
  });

  return withSeparators.map(ensureFieldFlags);
}

function computeSummary(rows) {
  const rowsWithIssues = rows.filter((row) => {
    const hasNull =
      row.data == null ||
      row.targa == null ||
      row.litriErogati == null ||
      row.contatore == null;
    const flags = row.fieldFlags || {};
    const hasFlags =
      flags.data === "LOW_CONFIDENCE" ||
      flags.targa === "LOW_CONFIDENCE" ||
      flags.litriErogati === "LOW_CONFIDENCE" ||
      flags.contatore === "LOW_CONFIDENCE";
    return hasNull || hasFlags;
  });

  return {
    rowsExtracted: rows.length,
    rowsWithIssues: rowsWithIssues.length,
    needsReview: rowsWithIssues.length > 0,
  };
}

async function fetchFileBase64(fileUrl) {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Download file fallito: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const processed = sharp(inputBuffer)
    .rotate()
    .grayscale()
    .normalize()
    .resize({ width: 1800, withoutEnlargement: false });

  const metadata = await processed.metadata();
  const width = metadata.width;
  const height = metadata.height;
  if (!width || !height) {
    throw new Error("Impossibile leggere dimensioni immagine");
  }

  const bottomTop = Math.min(height - 1, Math.round(height * 0.60));
  const bottomHeight = Math.max(1, Math.min(Math.round(height * 0.40), height - bottomTop));
  const centerTop = Math.min(height - 1, Math.round(height * 0.15));
  const centerHeight = Math.max(1, Math.min(Math.round(height * 0.70), height - centerTop));

  const cropBottomBuffer = await processed
    .clone()
    .extract({ left: 0, top: bottomTop, width, height: bottomHeight })
    .jpeg()
    .toBuffer();

  await processed
    .clone()
    .extract({ left: 0, top: centerTop, width, height: centerHeight })
    .jpeg()
    .toBuffer();

  const base64 = cropBottomBuffer.toString("base64");
  const mimeType = "image/jpeg";
  return { base64, mimeType };
}

/**
 * FUNCTION estrazioneSchedaCisterna
 */
exports.estrazioneSchedaCisterna = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // CORS
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.set("Access-Control-Max-Age", "3600");

      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
      }

      const { fileUrl } = req.body;

      if (!fileUrl) {
        return res.status(400).json({ error: "fileUrl mancante" });
      }

      const { base64, mimeType } = await fetchFileBase64(fileUrl);

      // Recupero API key
      const apiKey = await getGeminiApiKey();

      // Payload Gemini CORRETTO
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: PROMPT_SCHEDA_CISTERNA },
              {
                inlineData: {
                  mimeType,
                  data: base64,
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

      // Estrazione testo JSON compatibile con TUTTI i formati Gemini
      const text =
        result?.candidates?.[0]?.content?.parts?.[0]?.text ||
        result?.candidates?.[0]?.content?.parts?.[0]?.functionCall?.args?.json ||
        result?.candidates?.[0]?.content?.parts?.[0]?.structuredResponse?.json;

      if (!text) {
        console.error("Risposta IA vuota:", result);
        return res.status(500).json({ error: "Risposta IA vuota" });
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        console.error("JSON IA non valido:", text);
        return res.status(500).json({ error: "JSON IA non valido" });
      }

      return res.status(200).json({
        success: true,
        data: parsed,
      });
    } catch (err) {
      console.error("ERRORE estrazioneSchedaCisterna:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});


