// src/autisti/SetupMezzo.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../autisti/autisti.css";
import { setItemSync } from "../utils/storageSync";

export default function SetupMezzo() {
  const navigate = useNavigate();
  const [targaCamion, setTargaCamion] = useState("");
  const [targaRimorchio, setTargaRimorchio] = useState("");
  const [errore, setErrore] = useState("");

  async function handleConfirm() {
    setErrore("");

    if (!targaCamion.trim()) {
      setErrore("Inserisci la targa del camion");
      return;
    }

    await setItemSync("@mezzo_attivo_autista", {
      targaCamion: targaCamion.trim().toUpperCase(),
      targaRimorchio: targaRimorchio.trim().toUpperCase() || null,
      timestamp: Date.now(),
    });

    navigate("/autisti/home");
  }

  return (
    <div className="autisti-container">
      <h1 className="autisti-title">Mezzo in uso</h1>

      <input
        className="autisti-input"
        type="text"
        placeholder="Targa camion"
        value={targaCamion}
        onChange={(e) => setTargaCamion(e.target.value)}
      />

      <input
        className="autisti-input"
        type="text"
        placeholder="Targa rimorchio (opzionale)"
        value={targaRimorchio}
        onChange={(e) => setTargaRimorchio(e.target.value)}
      />

      {errore && <div className="autisti-error">{errore}</div>}

      <button className="autisti-button" onClick={handleConfirm}>
        OK
      </button>
    </div>
  );
}
