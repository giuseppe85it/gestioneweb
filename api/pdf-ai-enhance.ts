// api/pdf-ai-enhance.ts
import OpenAI from "openai";

export const config = {
  runtime: "edge", // funzione Edge su Vercel
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Only POST allowed", { status: 405 });
  }

  try {
    const body = await req.json();

    const inputText: string | undefined = body.inputText;
    const imageBase64: string | undefined = body.imageBase64;

    if (!inputText && !imageBase64) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Devi passare almeno inputText o imageBase64",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const content: any[] = [];

    if (inputText) {
      content.push({
        type: "text",
        text: inputText,
      });
    }

    if (imageBase64) {
      content.push({
        type: "image_url",
        image_url: {
          // se il frontend manda solo il base64 nudo, aggiungo il prefisso
          url: imageBase64.startsWith("data:")
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`,
        },
      });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o", // Vision, ottimo per libretti/fatture/preventivi
      messages: [
        {
          role: "system",
          content:
            "Sei un assistente che legge documenti (preventivi, fatture, libretti di circolazione, documenti di officina) e restituisce SEMPRE un JSON ben formato, pronto per essere salvato su Firestore. Non aggiungere testo fuori dal JSON.",
        },
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.1,
    });

    const result = completion.choices[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({
        ok: true,
        result, // il JSON (come stringa) che poi la tua app potrà parsare
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("AI error in pdf-ai-enhance:", err);

    return new Response(
      JSON.stringify({
        ok: false,
        error: err?.message ?? "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
