/**
 * Firebase Function (Node 20) per l'estrazione documenti PDF
 * Modello: gemini-2.5-flash
 */

const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const cors = require("cors")({ origin: true });
const fetch = require("node-fetch"); // NECESSARIO

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

/**
 * PROMPT NON RIGIDO PER LETTURA PDF
 */
const PROMPT_DOCUMENTO = `
Leggi completamente il documento PDF o immagine.

1. Estrai il testo completo.
2. Identifica se presenti:
   - fornitore
   - numero documento
   - data
   - targa del mezzo
   - totale
3. Estrai eventuali voci di dettaglio (descrizione, quantità, prezzo, importo).

Restituisci SOLO JSON con questa struttura (puoi omettere campi o aggiungerne se necessari):

{
  "tipoDocumento": "...",
  "fornitore": "...",
  "numeroDocumento": "...",
  "dataDocumento": "...",
  "targa": "...",
  "marca": "...",
  "modello": "...",
  "telaio": "...",
  "km": "...",
  "imponibile": "...",
  "ivaPercentuale": "...",
  "ivaImporto": "...",
  "totaleDocumento": "...",
  "voci": [...],
  "testo": "..."
}

NON aggiungere testo fuori dal JSON.
`;

/**
 * CONFIG GEMINI
 */
const MODEL_NAME = "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

/**
 * FUNCTION estrazioneDocumenti — CORRETTA
 */
exports.estrazioneDocumenti = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
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

      const { fileBase64, mimeType = "application/pdf" } = req.body;

      if (!fileBase64) {
        return res.status(400).json({ error: "fileBase64 mancante" });
      }

      // Rimuove eventuale prefisso data:...
      const cleanBase64 =
        fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;

      // Recupero API key
      const apiKey = await getGeminiApiKey();

      // Payload Gemini CORRETTO
      const payload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: PROMPT_DOCUMENTO },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
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

      // Estrazione testo JSON — compatibile con TUTTI i formati Gemini
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
      console.error("ERRORE estrazioneDocumenti:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});
