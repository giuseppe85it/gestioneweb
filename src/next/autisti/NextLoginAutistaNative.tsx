/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../autisti/autisti.css";
import { getItemSync } from "./nextAutistiStorageSync";
import { NEXT_AUTISTI_BASE_PATH } from "./nextAutistiCloneRuntime";
import {
  getAutistaLocal,
  getMezzoLocal,
  saveAutistaLocal,
} from "./nextAutistiSessionStorage";

export default function LoginAutista() {
  const navigate = useNavigate();

  const [badge, setBadge] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const autista = getAutistaLocal();
    const mezzo = getMezzoLocal();

    if (autista && mezzo) {
      navigate(NEXT_AUTISTI_BASE_PATH, { replace: true });
    }
  }, [navigate]);

  async function handleLogin() {
    if (!badge.trim()) {
      setErrore("Inserisci il badge");
      return;
    }

    setLoading(true);
    setErrore(null);

    try {
      const colleghi = (await getItemSync("@colleghi")) || [];
      const collega = Array.isArray(colleghi)
        ? colleghi.find((item: any) => String(item?.badge ?? "") === badge.trim())
        : null;

      if (!collega) {
        setErrore("Badge non valido");
        setLoading(false);
        return;
      }

      saveAutistaLocal({
        id: collega.id,
        nome: collega.nome,
        badge: badge.trim(),
      });

      navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`);
    } catch {
      setErrore("Errore durante il login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="autisti-container">
      <h1 className="autisti-title">Accesso Autisti</h1>

      <div className="autisti-card">
        <label className="autisti-label">Badge</label>

        <input
          className="autisti-input"
          type="number"
          placeholder="Inserisci badge"
          value={badge}
          onChange={(event) => setBadge(event.target.value)}
        />

        {errore ? <div className="autisti-error">{errore}</div> : null}

        <button className="autisti-button" onClick={handleLogin} disabled={loading}>
          {loading ? "Verifica..." : "ENTRA"}
        </button>
      </div>
    </div>
  );
}
