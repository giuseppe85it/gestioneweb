// src/autisti/ControlloMezzo.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./autisti.css";
import { getItemSync, setItemSync } from "../utils/storageSync";

export default function ControlloMezzo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);

    const autista = await getItemSync("@autista_attivo");
    const mezzo = await getItemSync("@mezzo_attivo_autista");

    await setItemSync("@controlli_mezzo_autisti_tmp", {
      autista,
      mezzo,
      timestamp: Date.now(),
      esito: "OK", // per ora fisso
    });

    setLoading(false);
    navigate("/autisti/home");
  }

  return (
    <div className="autisti-container">
      <h1 className="autisti-title">Controllo Mezzo</h1>

      <p className="autisti-text">
        Controllo rapido del mezzo. Versione iniziale.
      </p>

      <button
        className="autisti-button"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Salvataggio..." : "Conferma controllo"}
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
