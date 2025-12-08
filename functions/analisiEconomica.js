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

exports.analisi_economica_mezzo = functions.https.onRequest(async (req, res) => {
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

  const { input } = req.body;
console.log("### DEBUG INPUT DA REACT ###", JSON.stringify(input, null, 2));
  if (!input) {
    return res.status(400).json({ error: "input mancante" });
  }

  try {
    const apiKey = await getGeminiApiKey();

const prompt = `
Sei un analista aziendale. Nel campo "documenti" hai a disposizione i dati completi estratti dai PDF:
- tipoDocumento (FATTURA/PREVENTIVO)
- totaleDocumento, imponibile, IVA, voci riga
- fornitore, dataDocumento
- testo estratto
- eventuali collegamenti preventivo/fattura (riferimentoPreventivoNumero/Data)

IMPORTANTE:
- Non inventare nessun dato.
- Usa solo ciò che trovi nei documenti.
- I preventivi non sono costi reali.
- Le fatture sono costi reali.
- Non convertire EUR/CHF.
- Se la valuta non è indicata nel documento, segnala “valuta non specificata”.

Obiettivi:
1. Identifica e somma i costi reali da tutte le fatture.
2. Se un preventivo appartiene allo stesso intervento della fattura (stesso fornitore, descrizione simile, riferimento preventivo), collegali.
3. Evidenzia scostamenti preventivo → fattura.
4. Riconosci anomalie: importi inconsistenti, mancanza valuta, differenze eccessive, pratiche sospette.
5. Riassumi tutto in linguaggio chiaro e professionale.

OUTPUT JSON (OBBLIGATORIO):
{
  "riepilogoBreve": "",
  "analisiCosti": "",
  "anomalie": "",
  "fornitoriNotevoli": ""
}

Non aggiungere testo fuori dal JSON.
`;




const payload = {
  contents: [
    {
      role: "user",
      parts: [
        { text: prompt },
        { text: "\n\n### DOCUMENTI ###\n" + JSON.stringify(input.documenti || [], null, 2) }
      ]
    }
  ],
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.3
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
      return res.status(500).json({ success: false, error: result.error });
    }

// Gemini restituisce il testo JSON in formato stringa dentro parts[].text
const raw = result.candidates?.[0]?.content?.parts?.[0]?.text;

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  throw new Error("JSON IA non valido");
}

return res.status(200).json({
  success: true,
  data: parsed
});

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});
