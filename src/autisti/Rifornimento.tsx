// src/autisti/Rifornimento.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../autisti/autisti.css";
import { getItemSync, setItemSync } from "../utils/storageSync";

export default function Rifornimento() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);

    const autista = await getItemSync("@autista_attivo");
    const mezzo = await getItemSync("@mezzo_attivo_autista");

    await setItemSync("@rifornimenti_autisti_tmp", {
      autista,
      mezzo,
      timestamp: Date.now(),
    });

    setLoading(false);
    navigate("/autisti/home");
  }

  return (
    <div className="autisti-container">
      <h1 className="autisti-title">Rifornimento</h1>

      <p className="autisti-text">
        Funzione in fase iniziale.
      </p>

      <button
        className="autisti-button"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Salvataggio..." : "Registra rifornimento"}
      </button>

      <button
        className="autisti-button secondary"
        onClick={() => navigate("/autisti/home")}
      >
        Indietro
      </button>
    </div>
  );
}
