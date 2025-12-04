/**
 * Firebase Function (Node 20) per l'estrazione dati dal libretto
 * Modello: gemini-2.5-flash (stabile e presente nella tua API key)
 */

const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

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

/**
 * ENDPOINT PUBBLICO:
 * https://us-central1-<PROJECT_ID>.cloudfunctions.net/estrazione_libretto
 */
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
exports.estrazioneDocumenti = require("./estrazioneDocumenti").estrazioneDocumenti;


