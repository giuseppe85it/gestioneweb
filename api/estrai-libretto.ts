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

    // -----------------------------
    // Import dinamico di sharp (safe per Vercel)
    // -----------------------------
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default || sharpModule;

    const base64data = imageBase64.split(",").pop()!;
    const buffer = Buffer.from(base64data, "base64");

    const compressedBuffer = await sharp(buffer)
      .resize({ width: 1024, height: 1024, fit: "inside" })
      .webp({ quality: 70 })
      .toBuffer();

    const compressedBase64 =
      "data:image/webp;base64," + compressedBuffer.toString("base64");

    // -----------------------------
    // IA con timeout 8.5s
    // -----------------------------
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

Se non presente → "".`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analizza la foto del libretto." },
              { type: "image_url", image_url: compressedBase64 },
            ],
          },
        ],
      }),
    });

    const aiRes: any = await Promise.race([aiCall, abortAfter(8500)]);
    const json = await aiRes.json();

    if (!aiRes.ok) {
      return new Response(
        JSON.stringify({ error: "OpenAI error", details: json }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

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
