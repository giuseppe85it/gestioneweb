// api/estrai-libretto.ts
// Versione UltraFast compatibile con Vercel Free (≤10s)
// - Resize immagine max 1024px
// - Compress WebP qualità 70
// - gpt-4o-mini (molto più veloce sulle immagini)
// - Timeout interno a 8.5 secondi
// - Runtime Node stable

import sharp from "sharp";

export const config = {
  runtime: "nodejs",
};

function abortAfter(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT_8500MS")), ms)
  );
}

export default async function handler(req: Request): Promise<Response> {
  // CORS preflight
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
    return new Response(JSON.stringify({ error: "Only POST allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Missing imageBase64" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // -------------------------------------------------------------
    // BASE64 → BUFFER
    // -------------------------------------------------------------
    const base64data = imageBase64.split(",").pop()!;
    const buffer = Buffer.from(base64data, "base64");

    // -------------------------------------------------------------
    // RESIZE + COMPRESS WEBP ULTRA FAST
    // - max 1024px
    // - qualità 70
    // - output leggero
    // -------------------------------------------------------------
    const compressedBuffer = await sharp(buffer)
      .resize({ width: 1024, height: 1024, fit: "inside" })
      .webp({ quality: 70 })
      .toBuffer();

    const compressedBase64 =
      "data:image/webp;base64," + compressedBuffer.toString("base64");

    // -------------------------------------------------------------
    // CHIAMATA IA CON TIMEOUT 8500ms (8.5 secondi)
    // -------------------------------------------------------------
    const aiCall = fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 350,
        messages: [
          {
            role: "system",
            content: `Estrai SOLO questi campi del libretto, in JSON:
- targa
- marca
- modello
- telaio
- colore
- cilindrata
- potenza
- massa_complessiva
- data_immatricolazione
- assicurazione
- proprietario

Se non presente → restituisci "".

Rispondi SOLO con JSON.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analizza questa immagine del libretto." },
              {
                type: "image_url",
                image_url: compressedBase64,
              },
            ],
          },
        ],
      }),
    });

    // Race: AI vs Timeout
    const aiRes = await Promise.race([aiCall, abortAfter(8500)]);

    const json = await aiRes.json();

    // Timeout interno
    if (json?.message === "TIMEOUT_8500MS") {
      return new Response(
        JSON.stringify({
          error: "IA timeout (8.5s). Riprova con una foto più vicina.",
        }),
        {
          status: 504,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // OpenAI error
    if (!aiRes.ok) {
      return new Response(
        JSON.stringify({
          error: "OpenAI error",
          status: aiRes.status,
          details: json,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // OK
    return new Response(JSON.stringify(json), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Unexpected error",
        message: err?.message || String(err),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
