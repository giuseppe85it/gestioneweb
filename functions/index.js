// -------------------------------------------------------
// IMPORT
// -------------------------------------------------------
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { OpenAI } = require("openai");

// -------------------------------------------------------
// FIREBASE ADMIN
// -------------------------------------------------------
if (!admin.apps.length) {
  admin.initializeApp();
}

// -------------------------------------------------------
// SECRET OPENAI
// -------------------------------------------------------
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

function getOpenAIClient() {
  return new OpenAI({
    apiKey: OPENAI_API_KEY.value(),
  });
}

// -------------------------------------------------------
// IA CENTRALE
// -------------------------------------------------------
exports.aiCore = onCall(
  {
    region: "europe-west3",
    secrets: [OPENAI_API_KEY],
    timeoutSeconds: 540,
    memory: "1GiB",
  },
  async (request) => {
    const data = request.data || {};
    const { task, payload } = data;

    if (!task) throw new HttpsError("invalid-argument", "TASK_MANCANTE");

    const openai = getOpenAIClient();

    try {
      // ---------------------------------------------------
      // 1) ESTRAZIONE LIBRETTO (VISION GPT-4o-mini)
      // ---------------------------------------------------
      if (task === "estrazione_libretto") {
        const base64 = payload?.imageBase64;

        if (!base64) {
          throw new HttpsError("invalid-argument", "imageBase64 mancante");
        }

        const imageUrl = `data:image/jpeg;base64,${base64}`;

        const prompt = `
Leggi attentamente il libretto del veicolo presente nell'immagine.

Estrai SOLO un JSON valido con queste chiavi:

{
  "proprietario": "",
  "indirizzo_proprietario": "",
  "tipo_veicolo": "",
  "marca": "",
  "modello": "",
  "variante": "",
  "carrozzeria": "",
  "colore": "",
  "telaio": "",
  "targa": "",
  "omologazione": "",
  "posti": "",
  "peso_vuoto": "",
  "peso_totale": "",
  "peso_rimorchiabile": "",
  "data_prima_immatricolazione": "",
  "data_ultima_revisione": ""
}

Regole:
- Nessun commento
- Nessuna frase
- Nessun markdown
- Solo JSON puro
`.trim();

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "input_image",
                  image_url: imageUrl
                }
              ]
            }
          ]
        });

        const message = aiResponse.choices?.[0]?.message;

        let content = "";

        // ------------ PARSER UNIVERSALE GPT-4o-MINI ---------------
        if (Array.isArray(message?.content)) {
          content = message.content
            .map((part) => (part?.text ? part.text : ""))
            .join("\n")
            .trim();
        } else if (typeof message?.content === "string") {
          content = message.content.trim();
        } else if (typeof message?.content === "object" && message?.content?.text) {
          content = message.content.text.trim();
        } else {
          content = "";
        }

        let json;
        try {
          json = JSON.parse(content);
        } catch {
          json = { raw: content };
        }

        return {
          ok: true,
          type: "estrazione_libretto",
          data: json,
        };
      }

      // ---------------------------------------------------
      // 2) PDF IA
      // ---------------------------------------------------
      if (task === "pdf_ia") {
        const { tipo, dati } = payload || {};

        if (!tipo || !dati)
          throw new HttpsError("invalid-argument", "tipo o dati mancanti");

        const prompt = `
Genera il contenuto in JSON per un PDF aziendale.

Il JSON deve avere questa forma:

{
  "titolo": "",
  "sottotitolo": "",
  "descrizione": "",
  "sezioni": [
    {
      "titolo": "",
      "contenuto": ""
    }
  ],
  "riassunto_finale": ""
}

Regole:
- Nessun markdown
- Nessun testo fuori dal JSON
- Adatta i contenuti al tipo: ${tipo}
`.trim();

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [{ type: "text", text: prompt }]
            }
          ]
        });

        const raw = aiResponse.choices?.[0]?.message?.content || "";
        let json;

        try {
          json = JSON.parse(raw);
        } catch {
          json = { raw };
        }

        return { ok: true, type: "pdf_ia", data: json };
      }

      // ---------------------------------------------------
      // ALTRI TASK (STUB)
      // ---------------------------------------------------
      if (task === "analisi_danno")
        return { ok: true, type: "analisi_danno", message: "Stub pronto." };

      if (task === "segnalazione_collega")
        return { ok: true, type: "segnalazione_collega", message: "Stub pronto." };

      if (task === "preventivi")
        return { ok: true, type: "preventivi", message: "Stub pronto." };

      if (task === "fatture")
        return { ok: true, type: "fatture", message: "Stub pronto." };

      if (task === "rifornimenti")
        return { ok: true, type: "rifornimenti", message: "Stub pronto." };

      if (task === "manutenzione_intelligente")
        return { ok: true, type: "manutenzione_intelligente", message: "Stub pronto." };

      if (task === "alert")
        return { ok: true, type: "alert", message: "Stub pronto." };

      throw new HttpsError("invalid-argument", `TASK_NON_SUPPORTATO: ${task}`);
    }

    catch (err) {
      console.error("Errore aiCore:", err);
      throw new HttpsError(
        "internal",
        "ERRORE_INTERNO_AI_CORE",
        String(err?.message || err)
      );
    }
  }
);
