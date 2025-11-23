// api/estrai-libretto.ts
// IA Libretto – Versione ULTRA VELOCE
// - Compress WebP
// - gpt-4o
// - CORS completo
// - Runtime Node (veloce per immagini pesanti)

export const config = {
  runtime: "nodejs" as const,
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
    // CONVERSIONE IN BLOB PER COMPRESSIONE WEBP
    // -------------------------------------------------
    const binary = Uint8Array.from(
      atob(imageBase64.split(",").pop() as string),
      (c) => c.charCodeAt(0)
    );

    const originalBlob = new Blob([binary], { type: "image/jpeg" });

    // -------------------------------------------------
    // COMPRESS WEBP (85% qualità, ultra veloce)
    // -------------------------------------------------
    const webpBlob = await new Promise<Blob>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = new OffscreenCanvas(img.width, img.height);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        canvas.convertToBlob({ type: "image/webp", quality: 0.85 }).then(resolve);
      };
      img.src = URL.createObjectURL(originalBlob);
    });

    // Blob → Base64 WebP
    const compressedBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(webpBlob);
    });

    // -------------------------------------------------
    // IA (gpt-4o) — velocissimo e molto più preciso
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
            content: `Estrai dal libretto SOLO questi campi in JSON pulito:
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

Se un valore non esiste → restituisci stringa vuota "".

Rispondi SOLO in JSON puro.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Ecco la foto del libretto da analizzare." },
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

    // -------------------------------------------------
    // RESPONSE OK
    // -------------------------------------------------
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
