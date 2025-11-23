export default async function handler(
  req: { method: string; body: any },
  res: { status: (code: number) => { json: (data: any) => any } }
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Nessuna immagine ricevuta" });
    }

    return res.status(200).json({
      ok: true,
      message: "API attiva. Nessuna IA automatica ancora collegata.",
    });
  } catch (err) {
    return res.status(500).json({ error: "Errore server", details: err });
  }
}
