// -------------------------------------------------------
// IMPORT
// -------------------------------------------------------
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
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
      // 1) ESTRAZIONE LIBRETTO (VISION GPT-4o)
      // ---------------------------------------------------
      if (task === "estrazione_libretto") {
        const base64 = payload?.imageBase64;

        if (!base64) {
          throw new HttpsError("invalid-argument", "imageBase64 mancante");
        }

        const prompt = `
Sei un sistema per l'estrazione dei dati dal libretto di circolazione.

Restituisci SOLO un JSON valido con queste chiavi:

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

Nessun testo fuori dal JSON.
`.trim();

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "input_image",
                  image_url: `data:image/jpeg;base64,${base64}`,
                },
              ],
            },
          ],
          temperature: 0.1,
        });

        const raw = aiResponse.choices?.[0]?.message?.content || "";

        let json;
        try {
          json = JSON.parse(raw);
        } catch (e) {
          json = { raw };
        }

        return {
          ok: true,
          type: "estrazione_libretto",
          data: json,
        };
      }

      // ---------------------------------------------------
      // 2) PDF IA (VISION GPT-4o / TEXT GPT-4o)
      // ---------------------------------------------------
      if (task === "pdf_ia") {
        const { tipo, dati, imageBase64 } = payload || {};

        if (!tipo) throw new HttpsError("invalid-argument", "tipo mancante");
        if (!dati) throw new HttpsError("invalid-argument", "dati mancanti");

        const prompt = `
Genera un JSON perfettamente formattato per creare un PDF aziendale.

Il PDF deve contenere:
- Titolo
- Sottotitolo
- Descrizione
- Sezioni (lista di sezioni con titolo e contenuto)
- Riassunto finale

STRUTTURA OBBLIGATORIA DEL JSON:

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
- Nessuna frase fuori dal JSON
- Nessun commento
- Nessuna spiegazione
- Solo JSON puro
- Adatta i contenuti al tipo: ${tipo}
`.trim();

        const messageContent = [
          { type: "text", text: prompt },
          {
            type: "text",
            text: `DATI DA USARE: ${JSON.stringify(dati)}`,
          },
        ];

        if (imageBase64) {
          messageContent.push({
            type: "input_image",
            image_url: imageBase64.startsWith("data:")
              ? imageBase64
              : `data:image/jpeg;base64,${imageBase64}`,
          });
        }

        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: messageContent,
            },
          ],
          temperature: 0.1,
        });

        const raw = aiResponse.choices?.[0]?.message?.content || "";

        let json;
        try {
          json = JSON.parse(raw);
        } catch (e) {
          json = { raw };
        }

        return {
          ok: true,
          type: "pdf_ia",
          data: json,
        };
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
    } catch (err) {
      console.error("Errore aiCore:", err);
      throw new HttpsError(
        "internal",
        "ERRORE_INTERNO_AI_CORE",
        String(err?.message || err)
      );
    }
  }
);
