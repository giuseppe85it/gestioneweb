// /api/pdf-ai-enhance.ts
// ======================================================
// API universale IA → migliora contenuti dei PDF
// Compatibile Vercel, senza @vercel/node
// ======================================================

export const config = {
  runtime: "edge", // VERCEL EDGE RUNTIME (veloce, leggero, zero dipendenze)
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ------------------------------------------
// Utility: chiamata alla IA
// ------------------------------------------
async function callAI(prompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY non configurata nelle Environment Variables.");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // modello leggero, economico, perfetto per questo task
      messages: [
        {
          role: "system",
          content: `Sei un assistente tecnico professionale. 
Genera testi chiari, tecnici, professionali e perfetti per un PDF ufficiale aziendale.
Non inventare dati numerici. Migliora solo ciò che ricevi. Formato breve e pulito.`,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 600,
    }),
  });

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

// ------------------------------------------
// Handler API
// ------------------------------------------
export default async function handler(req: Request): Promise<Response> {
  try {
    const { kind, input, prompt } = await req.json();

    // Prompt di base generico
    let basePrompt = `
Analizza e migliora i dati seguenti per inserirli in un PDF aziendale.

Tipo PDF: ${kind}

Dati:

${JSON.stringify(input, null, 2)}

Regole:
- Mantieni significato e dati corretti
- Migliora forma, ordine, chiarezza e linguaggio tecnico
- NON cambiare date
- NON modificare numeri di telaio, targa, quantità, scadenze
- Non inventare nulla
`;

    // Prompt aggiuntivo opzionale
    if (prompt) {
      basePrompt += `\nIstruzioni aggiuntive:\n${prompt}\n`;
    }

    // Chiamata IA
    const aiText = await callAI(basePrompt);

    // Risposta: il PDF engine la riceve e la applica
    return new Response(
      JSON.stringify({
        enhancedText: aiText,
        enhancedNotes: aiText,
        // Qui puoi aggiungere altre trasformazioni automatiche
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
