// api/estrai-libretto.ts
// IA Libretto – Versione ULTRA VELOCE COMPATIBILE NODE
// - Compress WebP (Sharp)
// - gpt-4o (OCR molto veloce)
// - CORS completo
// - Runtime Node (corretto per immagini pesanti)

import sharp from "sharp";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: Request): Promise<Response> {
  // -------------------------------------------------
  // CORS
  // -------------------------------------------------
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

    // -------------------------------------------------
    // BASE64 → BINARY BUFFER
    // -------------------------------------------------
    const base64data = imageBase64.split(",").pop()!;
    const buffer = Buffer.from(base64data, "base64");

    // -------------------------------------------------
    // COMPRESS WEBP (SHARP - PERFETTO PER NODE)
    // -------------------------------------------------
    const compressedBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const compressedBase64 =
      "data:image/webp;base64," + compressedBuffer.toString("base64");

    // -------------------------------------------------
    // IA (GPT-4O) – VELOCISSIMA
    // -------------------------------------------------
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `Estrai SOLO questi campi in JSON:
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

Se non c’è, restituisci "".`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analizza questo libretto svizzero." },
              {
                type: "image_url",
                image_url: compressedBase64,
              },
            ],
          },
        ],
      }),
    });

    const out = await aiRes.json();

    if (!aiRes.ok) {
      return new Response(
        JSON.stringify({
          error: "OpenAI error",
          status: aiRes.status,
          details: out,
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

    return new Response(JSON.stringify(out), {
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
