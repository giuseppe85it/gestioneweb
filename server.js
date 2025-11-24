import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.post("/api/pdf-ai-enhance", async (req, res) => {
  try {
    const { kind, input, prompt } = req.body;

    const basePrompt = `
Analizza e migliora i dati seguenti per inserirli in un PDF professionale.

Tipo PDF: ${kind}

Dati:
${JSON.stringify(input, null, 2)}

Regole:
- Migliora ordine, chiarezza e linguaggio
- NON inventare numeri o date
- NON modificare identificativi
- Stile aziendale tecnico, pulito
${prompt || ""}
`;

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Migliora testi per PDF professionali." },
          { role: "user", content: basePrompt },
        ],
        max_tokens: 500,
      }),
    });

    const data = await aiRes.json();
    const enhanced =
      data?.choices?.[0]?.message?.content?.trim() || "";

    res.json({
      enhancedText: enhanced,
      enhancedNotes: enhanced,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log("🔥 IA API attiva su http://localhost:3001/api/pdf-ai-enhance");
});
