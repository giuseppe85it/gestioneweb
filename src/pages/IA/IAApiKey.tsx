import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./IAApiKey.css";

type Status = "idle" | "loading" | "success" | "error";

const IAApiKey: React.FC = () => {
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadApiKey = async () => {
      setStatus("loading");
      setMessage(null);

      try {
        const ref = doc(db, "@impostazioni_app", "gemini");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data() as { apiKey?: string };
          if (data.apiKey) {
            setApiKey(data.apiKey);
            setStatus("success");
            setMessage("Chiave IA caricata correttamente.");
          } else {
            setStatus("idle");
          }
        } else {
          setStatus("idle");
        }
      } catch (error) {
        console.error("Errore lettura API Key Gemini:", error);
        setStatus("error");
        setMessage("Errore nel recupero della chiave. Riprova.");
      }
    };

    void loadApiKey();
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = apiKey.trim();
    if (!trimmed) {
      setMessage("Inserisci una chiave valida prima di salvare.");
      setStatus("error");
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const ref = doc(db, "@impostazioni_app", "gemini");
      await setDoc(
        ref,
        {
          apiKey: trimmed,
        },
        { merge: true }
      );

      setStatus("success");
      setMessage("Chiave salvata correttamente.");
    } catch (error) {
      console.error("Errore salvataggio API Key Gemini:", error);
      setStatus("error");
      setMessage("Errore nel salvataggio. Controlla la connessione e riprova.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ia-apikey-page">
      <div className="ia-apikey-card">
        <div className="ia-apikey-header">
          <h1>Impostazioni IA (Gemini)</h1>
          <p>
            Inserisci la tua API Key Gemini. Senza questa chiave tutte le
            funzioni IA restano disattivate.
          </p>
        </div>

        <form className="ia-apikey-form" onSubmit={handleSave}>
          <label className="ia-apikey-label" htmlFor="gemini-api-key">
            API Key Gemini
          </label>

          <div className="ia-apikey-input-row">
            <input
              id="gemini-api-key"
              type={isVisible ? "text" : "password"}
              className="ia-apikey-input"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Inserisci la tua API key..."
              autoComplete="off"
            />

            <button
              type="button"
              className="ia-apikey-toggle"
              onClick={() => setIsVisible((prev) => !prev)}
            >
              {isVisible ? "Nascondi" : "Mostra"}
            </button>
          </div>

          {message && (
            <div
              className={`ia-apikey-message ${
                status === "error" ? "error" : "success"
              }`}
            >
              {message}
            </div>
          )}

          <div className="ia-apikey-actions">
            <button
              type="submit"
              className="ia-apikey-save"
              disabled={isSaving}
            >
              {isSaving ? "Salvataggio..." : "Salva chiave"}
            </button>

            <button
              type="button"
              className="ia-apikey-back"
              onClick={() => navigate("/ia")}
            >
              Torna al menu IA
            </button>
          </div>
        </form>

        <div className="ia-apikey-note">
          <p>
            La chiave viene salvata in Firestore nella collection{" "}
            <code>@impostazioni_app</code>, documento <code>gemini</code>,
            campo <code>apiKey</code>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IAApiKey;
