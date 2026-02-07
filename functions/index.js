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

/**
 * ENDPOINT PUBBLICO:
 * https://us-central1-<PROJECT_ID>.cloudfunctions.net/estrazione_libretto
 */
exports.estrazioneDocumenti = require("./estrazioneDocumenti").estrazioneDocumenti;
exports.ia_cisterna_extract = require("./iaCisternaExtract").ia_cisterna_extract;
exports.analisi_economica_mezzo = analisiEconomica.analisi_economica_mezzo;
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



