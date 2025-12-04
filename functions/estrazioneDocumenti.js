const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

// 🔥 Modello e endpoint usati anche da estrazione_libretto
const MODEL_NAME = "gemini-2.5-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

/**
 * Schema JSON per qualunque tipo di documento (preventivo, fattura, magazzino, generico)
 */
const DOCUMENTO_DATA_SCHEMA = {
  type: "OBJECT",
  properties: {
    tipoDocumento: { type: "STRING" },

    fornitore: { type: "STRING" },
    numeroDocumento: { type: "STRING" },
    dataDocumento: { type: "STRING" },

    // Dati mezzo
    targa: { type: "STRING" },
    marca: { type: "STRING" },
    modello: { type: "STRING" },
    telaio: { type: "STRING" },
    km: { type: "STRING" },

    // Preventivo ↔ fattura
    riferimentoPreventivoNumero: { type: "STRING" },
    riferimentoPreventivoData: { type: "STRING" },

    // Voci
    voci: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          codice: { type: "STRING" },
          descrizione: { type: "STRING" },
          categoria: { type: "STRING" },
          quantita: { type: "STRING" },
          prezzoUnitario: { type: "STRING" },
          scontoPercentuale: { type: "STRING" },
          importo: { type: "STRING" }
        },
        required: ["descrizione"]
      }
    },

    // Totali
    imponibile: { type: "STRING" },
    ivaPercentuale: { type: "STRING" },
    ivaImporto: { type: "STRING" },
    totaleDocumento: { type: "STRING" },

    // Pagamento
    iban: { type: "STRING" },
    beneficiario: { type: "STRING" },
    riferimentoPagamento: { type: "STRING" },
    banca: { type: "STRING" },
    importoPagamento: { type: "STRING" },

    // Testo generico se non è un documento riconosciuto
    testo: { type: "STRING" }
  }
};


/**
 * PROMPT PER L'ESTRAZIONE DOCUMENTI
 */
const PROMPT_DOCUMENTO = `
Analizza il documento fornito (PDF o immagine).
Riconosci automaticamente se è:
- PREVENTIVO
- FATTURA
- MAGAZZINO
- GENERICO

Estrai tutte le informazioni nel formato JSON secondo lo schema fornito.
Se un dato non esiste, lascia una stringa vuota "".

NON AGGIUNGERE TESTO FUORI DAL JSON.
`;

/**
 * PROMPT PER CONFRONTO PREVENTIVI
 */
const PROMPT_CONFRONTO = `
Confronta i DUE preventivi forniti.
Produci JSON con:
- differenze di prezzo
- differenze manodopera/materiali
- voci presenti in uno ma non nell'altro
- scostamento percentuale
- preventivo più conveniente e motivo

Rispondi solo con JSON valido.
`;


/**
 * 🔥 NUOVA FUNCTION: estrazioneDocumenti
 */
exports.estrazioneDocumenti = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Gestione preflight CORS
      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        return res.status(200).send();
      }

      const { task, fileBase64, mimeType, documentoA, documentoB } = req.body;

      if (!task) return res.status(400).json({ error: "task mancante" });

      // Pulizia base64 (come fai tu in estrazione_libretto)
      const cleanBase64 =
        fileBase64?.includes(",") ? fileBase64.split(",")[1] : fileBase64;

      if (task === "estrazione_documento") {
        if (!cleanBase64 || !mimeType) {
          return res.status(400).json({ error: "fileBase64 o mimeType mancante" });
        }

        const payload = {
          contents: [
            {
              role: "user",
              parts: [
                { text: PROMPT_DOCUMENTO },
                {
                  inlineData: {
                    mimeType: mimeType,       // "application/pdf" oppure "image/jpeg"
                    data: cleanBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: DOCUMENTO_DATA_SCHEMA,
            temperature: 0
          }
        };

        const responseAI = await fetch(
          `${BASE_URL}?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await responseAI.json();

        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        res.set("Access-Control-Allow-Origin", "*");
        return res.status(200).send(JSON.parse(text));
      }


      /**
       * 2️⃣ CONFRONTO PREVENTIVI
       */
      if (task === "confronto_preventivi") {
        if (!documentoA || !documentoB) {
          return res.status(400).json({ error: "documentoA o documentoB mancante" });
        }

        const prompt = `
${PROMPT_CONFRONTO}

PREVENTIVO_A:
${JSON.stringify(documentoA)}

PREVENTIVO_B:
${JSON.stringify(documentoB)}
        `;

        const payload = {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0
          }
        };

        const responseAI = await fetch(
          `${BASE_URL}?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await responseAI.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

        res.set("Access-Control-Allow-Origin", "*");
        return res.status(200).send(JSON.parse(text));
      }


      // Se task non valido
      return res.status(400).json({ error: "task non valido" });

    } catch (err) {
      console.error("ERRORE estrazioneDocumenti:", err);
      res.set("Access-Control-Allow-Origin", "*");
      return res.status(500).json({ error: err.message });
    }
  });
});
