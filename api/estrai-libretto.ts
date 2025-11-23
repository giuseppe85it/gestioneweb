export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  // -----------------------
  // CORS
  // -----------------------
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST allowed" }),
      {
        status: 405,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing imageBase64" }),
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // -----------------------
    // IA: analisi libretto
    // -----------------------
    const openaiRes = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          input: `
            Estrai dal libretto SOLO questi campi:

            - targa
            - marca
            - modello
            - telaio
            - colore
            - cilindrata
            - potenza
            - massa complessiva
            - data immatricolazione
            - assicurazione
            - proprietario

            Se un campo non esiste, restituisci "".

            Rispondi SOLO in JSON.
          `,
          image: [imageBase64],
        }),
      }
    );

    const data = await openaiRes.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}
