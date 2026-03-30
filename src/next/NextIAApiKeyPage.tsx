import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/IA/IAApiKey.css";
import {
  readNextIaConfigSnapshot,
  saveNextIaConfigSnapshot,
} from "./domain/nextIaConfigDomain";

type Status = "idle" | "loading" | "success" | "error";

export default function NextIAApiKeyPage() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const isMissingKey = !apiKey.trim();
  const showMissingBanner = isMissingKey && status !== "loading";

  useEffect(() => {
    let cancelled = false;

    const loadApiKey = async () => {
      setStatus("loading");
      setMessage(null);

      try {
        const snapshot = await readNextIaConfigSnapshot();
        if (cancelled) return;

        if (snapshot.apiKeyConfigured) {
          setApiKey(snapshot.apiKey);
          setStatus("success");
          setMessage("Chiave IA caricata correttamente.");
          return;
        }

        setStatus("idle");
      } catch (error) {
        console.error("Errore lettura API Key Gemini clone:", error);
        if (!cancelled) {
          setStatus("error");
          setMessage("Errore nel recupero della chiave. Riprova.");
        }
      }
    };

    void loadApiKey();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();

    const trimmed = apiKey.trim();
    if (!trimmed) {
      setMessage("Inserisci una chiave valida prima di salvare.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      await saveNextIaConfigSnapshot(trimmed);
      setApiKey(trimmed);
      setStatus("success");
      setMessage("Chiave salvata correttamente.");
    } catch (error) {
      console.error("Errore salvataggio API Key Gemini clone:", error);
      setStatus("error");
      setMessage("Errore nel salvataggio della chiave. Riprova.");
    }
  };

  return (
    <div className="ia-apikey-page">
      <div className="ia-apikey-card">
        <div className="ia-apikey-header">
          <div className="ia-apikey-kicker">Configurazione</div>
          <h1>Impostazioni IA (Gemini)</h1>
          <p>
            Inserisci la tua API Key Gemini. Senza questa chiave tutte le funzioni IA restano
            disattivate.
          </p>
        </div>

        {showMissingBanner ? (
          <div className="ia-apikey-banner">
            API Key mancante: inserisci la chiave per attivare i moduli IA.
          </div>
        ) : null}

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
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Inserisci la tua API key..."
              autoComplete="off"
            />

            <button
              type="button"
              className="ia-apikey-toggle"
              onClick={() => setIsVisible((current) => !current)}
            >
              {isVisible ? "Nascondi" : "Mostra"}
            </button>
          </div>

          {message && (
            <div className={`ia-apikey-message ${status === "error" ? "error" : "success"}`}>
              {message}
            </div>
          )}

          <div className="ia-apikey-actions">
            <button type="submit" className="ia-apikey-save" disabled={status === "loading"}>
              {status === "loading" ? "Salvataggio..." : "Salva chiave"}
            </button>

            <button type="button" className="ia-apikey-back" onClick={() => navigate("/next/ia")}>
              Torna al menu IA
            </button>
          </div>
        </form>

        <div className="ia-apikey-note">
          <p>
            La chiave viene salvata in Firestore nella collection <code>@impostazioni_app</code>,
            documento <code>gemini</code>, campo <code>apiKey</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
