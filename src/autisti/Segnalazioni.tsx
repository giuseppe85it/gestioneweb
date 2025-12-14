// src/autisti/Segnalazioni.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./autisti.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

export default function Segnalazioni() {
  const navigate = useNavigate();
  const [testo, setTesto] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [errore, setErrore] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setErrore("");

    if (!testo.trim()) {
      setErrore("Inserisci una descrizione");
      return;
    }
    if (!foto) {
      setErrore("Foto obbligatoria");
      return;
    }

    setLoading(true);

    const autista = await getItemSync("@autista_attivo");
    const mezzo = await getItemSync("@mezzo_attivo_autista");

    const storageRef = ref(
      storage,
      `segnalazioni_autisti/${Date.now()}_${foto.name}`
    );

    await uploadBytes(storageRef, foto);
    const fotoUrl = await getDownloadURL(storageRef);

    await setItemSync("@segnalazioni_autisti_tmp", {
      autista,
      mezzo,
      descrizione: testo.trim(),
      fotoUrl,
      timestamp: Date.now(),
    });

    setLoading(false);
    navigate("/autisti/home");
  }

  return (
    <div className="autisti-container">
      <h1 className="autisti-title">Segnalazioni</h1>

      <textarea
        className="autisti-input"
        placeholder="Descrivi il problema"
        value={testo}
        onChange={(e) => setTesto(e.target.value)}
        rows={4}
      />

      <input
        className="autisti-input"
        type="file"
        accept="image/*"
        onChange={(e) => setFoto(e.target.files?.[0] || null)}
      />

      {errore && <div className="autisti-error">{errore}</div>}

      <button
        className="autisti-button"
        onClick={handleSave}
        disabled={loading}
      >
        {loading ? "Invio..." : "Invia segnalazione"}
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
