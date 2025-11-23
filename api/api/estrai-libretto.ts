// api/estrai-libretto.ts
import { OpenAI } from "openai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Inizializzazione client OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Metodo non consentito" });
    }

    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 mancante" });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `Sei un estrattore dati per libretti di circolazione svizzeri.
            Restituisci SOLO JSON con:
            {
              targa, marcaModello, tipoVeicolo, carrozzeria, colore,
              numeroTelaio, cilindrata, potenzaKw,
              pesoVuoto, pesoTotale, pesoRimorchiabile, pesoComplessivo,
              omologazione, codiceEmissioni, proprietario, assicurazione,
              dataImmatricolazione, ultimaRevisione, note,
              luogoRilascio, dataRilascio
            }`
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analizza il libretto e restituisci il JSON richiesto." },
            { type: "image_url", image_url: imageBase64 }
          ]
        }
      ]
    });

    const aiText = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(aiText);

    return res.status(200).json(parsed);

  } catch (error) {
    console.error("❌ Errore estrai-libretto:", error);
    return res.status(500).json({ error: "Errore IA" });
  }
}
