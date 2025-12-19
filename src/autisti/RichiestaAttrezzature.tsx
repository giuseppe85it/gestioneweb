import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../autisti/autisti.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal, getMezzoLocal } from "./autistiStorage";

const KEY_RICHIESTE = "@richieste_attrezzature_autisti_tmp";

function genId() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function RichiestaAttrezzature() {
  const navigate = useNavigate();
  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);

  const [testo, setTesto] = useState("");
  const [fotoDataUrl, setFotoDataUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    const a = getAutistaLocal();
    const m = getMezzoLocal();

    if (!a?.badge) {
      navigate("/autisti/login", { replace: true });
      return;
    }
    if (!m?.targaCamion) {
      navigate("/autisti/setup-mezzo", { replace: true });
      return;
    }

    setAutista(a);
    setMezzo(m);
  }, [navigate]);

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("Errore lettura foto"));
        r.readAsDataURL(file);
      });
      setFotoDataUrl(dataUrl);
    } catch {
      setErrore("Errore caricamento foto");
    } finally {
      e.target.value = "";
    }
  }

  async function invia() {
    setErrore(null);

    const msg = testo.trim();
    if (msg.length < 3) {
      setErrore("Scrivi cosa ti serve");
      return;
    }

    setLoading(true);

    const record = {
      id: genId(),
      testo: msg,

      autistaNome: autista?.nome || null,
      badgeAutista: autista?.badge || null,

      targaCamion: mezzo?.targaCamion || null,
      targaRimorchio: mezzo?.targaRimorchio || null,

      fotoDataUrl: fotoDataUrl || null,

      timestamp: Date.now(),
      stato: "nuova",
      letta: false,
    };

    try {
      const current = (await getItemSync(KEY_RICHIESTE)) || [];
      const next = Array.isArray(current) ? [...current, record] : [record];
      await setItemSync(KEY_RICHIESTE, next);

      setLoading(false);
      navigate("/autisti/home", { replace: true });
    } catch {
      setLoading(false);
      setErrore("Errore invio richiesta");
    }
  }

  if (!autista || !mezzo) return null;

  return (
    <div className="autisti-container">
      <h1 className="autisti-title">Cosa ti serve?</h1>

      <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 10 }}>
        {mezzo?.targaCamion ? `Motrice: ${mezzo.targaCamion}` : ""}{" "}
        {mezzo?.targaRimorchio ? `• Rimorchio: ${mezzo.targaRimorchio}` : ""}{" "}
        {autista?.nome ? `• Autista: ${autista.nome}` : ""}
      </div>

      <textarea
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        placeholder="Scrivi semplice: cosa ti serve, quantità, dove sei."
        style={{
          width: "100%",
          minHeight: 160,
          fontSize: 18,
          padding: 12,
          borderRadius: 12,
        }}
      />

      <div style={{ marginTop: 12 }}>
        <label className="autisti-button secondary" style={{ display: "inline-block" }}>
          + FOTO (OPZIONALE)
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFoto}
            style={{ display: "none" }}
          />
        </label>

        {fotoDataUrl && (
          <div style={{ marginTop: 10 }}>
            <img src={fotoDataUrl} alt="foto" style={{ width: "100%", borderRadius: 12 }} />
            <button
              className="autisti-button secondary"
              style={{ marginTop: 8 }}
              onClick={() => setFotoDataUrl(null)}
            >
              RIMUOVI FOTO
            </button>
          </div>
        )}
      </div>

      {errore && <div style={{ marginTop: 10, color: "crimson", fontWeight: 700 }}>{errore}</div>}

      <button className="autisti-button" style={{ marginTop: 14 }} onClick={invia} disabled={loading}>
        {loading ? "INVIO..." : "INVIA RICHIESTA"}
      </button>

      <button className="autisti-button secondary" style={{ marginTop: 10 }} onClick={() => navigate("/autisti/home")}>
        Indietro
      </button>
    </div>
  );
}
