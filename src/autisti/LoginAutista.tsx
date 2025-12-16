// src/autisti/LoginAutista.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../autisti/autisti.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { saveAutistaLocal } from "./autistiStorage";

const COLLEGHI_KEY = "@colleghi";

interface Collega {
  id: string;
  nome: string;
  badge?: string;
}

export default function LoginAutista() {
  const navigate = useNavigate();
  const [badge, setBadge] = useState("");
  const [errore, setErrore] = useState("");

 async function handleLogin() {

    setErrore("");

    if (!badge.trim()) {
      setErrore("Inserisci il badge");
      return;
    }

   const colleghi: Collega[] = (await getItemSync(COLLEGHI_KEY)) || [];


    const collega = colleghi.find(
      (c) => c.badge?.trim() === badge.trim()
    );

    if (!collega) {
      setErrore("Badge non valido");
      return;
    }

    setItemSync("@autista_attivo", {
      id: collega.id,
      nome: collega.nome,
      badge: badge.trim(),
      timestamp: Date.now(),
    });
saveAutistaLocal({
  id: collega.id,
  nome: collega.nome,
  badge: badge.trim(),
});

    navigate("/autisti/setup-mezzo");
  }

  return (
    <div className="autisti-container">
      <h1 className="autisti-title">Accesso Autista</h1>

      <input
        className="autisti-input"
        type="text"
        placeholder="Numero badge"
        value={badge}
        onChange={(e) => setBadge(e.target.value)}
      />

      {errore && <div className="autisti-error">{errore}</div>}

      <button className="autisti-button" onClick={handleLogin}>
        Entra
      </button>
    </div>
  );
}
