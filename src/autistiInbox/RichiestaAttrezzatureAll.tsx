import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../autisti/autisti.css";
import "./RichiestaAttrezzatureAll.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal, getMezzoLocal } from "../autisti/autistiStorage";

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

    const now = Date.now();
    const record = {
      id: genId(),
      testo: msg,

      autistaNome: autista?.nome ?? null,
      badgeAutista: autista?.badge ?? null,

      targaCamion: mezzo?.targaCamion ?? null,
      targaRimorchio: mezzo?.targaRimorchio ?? null,

      fotoDataUrl: fotoDataUrl ?? null,

      timestamp: now,
      stato: "nuova",
      letta: false,
    };

    try {
      const current = (await getItemSync(KEY_RICHIESTE)) || [];
      const next = Array.isArray(current) ? [...current, record] : [record];
      await setItemSync(KEY_RICHIESTE, next);

      setTesto("");
      setFotoDataUrl(null);
      window.alert("Richiesta inviata");
      setLoading(false);
      navigate("/autisti/home", { replace: true });
    } catch {
      setLoading(false);
      setErrore("Errore invio richiesta");
    }
  }

  if (!autista || !mezzo) return null;

  return (
    <div className="autisti-container richiesta-attrezzature-page">
      <div className="richiesta-header">
        <button
          className="autisti-button secondary richiesta-back"
          type="button"
          onClick={() => navigate("/autisti/home")}
        >
          Indietro
        </button>
        <h1 className="autisti-title">Richiesta attrezzature</h1>
      </div>

      <div className="richiesta-meta">
        <div>
          <strong>Motrice:</strong> {mezzo?.targaCamion || "-"}
        </div>
        <div>
          <strong>Rimorchio:</strong> {mezzo?.targaRimorchio || "-"}
        </div>
        <div>
          <strong>Autista:</strong> {autista?.nome || "-"}
        </div>
      </div>

      <label className="richiesta-label" htmlFor="richiesta-testo">
        Messaggio
      </label>
      <textarea
        id="richiesta-testo"
        className="richiesta-textarea"
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        placeholder="Cosa ti serve?"
      />

      <div className="richiesta-foto">
        <label className="autisti-button secondary richiesta-foto-btn">
          Aggiungi foto
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFoto}
            style={{ display: "none" }}
          />
        </label>

        {fotoDataUrl && (
          <div className="richiesta-foto-preview">
            <img src={fotoDataUrl} alt="foto" />
            <button
              className="autisti-button secondary"
              type="button"
              onClick={() => setFotoDataUrl(null)}
            >
              Rimuovi foto
            </button>
          </div>
        )}
      </div>

      {errore && <div className="richiesta-errore">{errore}</div>}

      <button
        className="autisti-button richiesta-submit"
        type="button"
        onClick={invia}
        disabled={loading}
      >
        {loading ? "INVIO..." : "INVIA RICHIESTA"}
      </button>
    </div>
  );
}
