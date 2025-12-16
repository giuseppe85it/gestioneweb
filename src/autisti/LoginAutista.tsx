import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Autisti.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { getAutistaLocal, getMezzoLocal, saveAutistaLocal } from "./autistiStorage";

export default function LoginAutista() {
  const navigate = useNavigate();

  const [badge, setBadge] = useState("");
  const [errore, setErrore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 🔒 REDIRECT AUTOMATICO SE GIÀ LOGGATO
  useEffect(() => {
    const autista = getAutistaLocal();
    const mezzo = getMezzoLocal();

    if (autista && mezzo) {
      navigate("/autisti/home", { replace: true });
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
      const collega = colleghi.find(
        (c: any) => String(c.badge) === badge.trim()
      );

      if (!collega) {
        setErrore("Badge non valido");
        setLoading(false);
        return;
      }

      const autista = {
        id: collega.id,
        nome: collega.nome,
        badge: badge.trim(),
      };

      // 🔹 SALVATAGGIO PER ADMIN / STORICO
      await setItemSync("@autista_attivo", {
        ...autista,
        timestamp: Date.now(),
      });

      // 🔹 SALVATAGGIO LOCALE PER SESSIONE
      saveAutistaLocal(autista);

      navigate("/autisti/setup-mezzo");
    } catch (e) {
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
          onChange={(e) => setBadge(e.target.value)}
        />

        {errore && <div className="autisti-error">{errore}</div>}

        <button
          className="autisti-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Verifica..." : "ENTRA"}
        </button>
      </div>
    </div>
  );
}
