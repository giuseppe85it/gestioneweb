import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  NEXT_IA_PATH,
} from "./nextStructuralPaths";
import "../pages/IA/IAApiKey.css";
import NextClonePageScaffold from "./NextClonePageScaffold";

type Status = "idle" | "loading" | "success" | "error";

export default function NextIAApiKeyPage() {
  const [apiKey, setApiKey] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

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
        console.error("Errore lettura API Key Gemini clone:", error);
        setStatus("error");
        setMessage("Errore nel recupero della chiave.");
      }
    };

    void loadApiKey();
  }, []);

  return (
    <NextClonePageScaffold
      eyebrow="IA"
      title="Impostazioni IA (Gemini)"
      description="Route clone autonoma della pagina madre API key. La chiave resta leggibile, ma il salvataggio e bloccato."
      backTo={NEXT_IA_PATH}
      backLabel="Hub IA"
      notice={<p>Configurazione sensibile visibile ma non modificabile nel clone.</p>}
    >
      <div className="ia-apikey-page" style={{ padding: 0 }}>
        <div className="ia-apikey-card">
          <div className="ia-apikey-header">
            <div className="ia-apikey-kicker">Configurazione</div>
            <h1>Impostazioni IA (Gemini)</h1>
            <p>La chiave attuale puo essere consultata, ma non salvata o modificata dal clone.</p>
          </div>

          <form className="ia-apikey-form" onSubmit={(event) => event.preventDefault()}>
            <label className="ia-apikey-label" htmlFor="next-gemini-api-key">
              API Key Gemini
            </label>

            <div className="ia-apikey-input-row">
              <input
                id="next-gemini-api-key"
                type={isVisible ? "text" : "password"}
                className="ia-apikey-input"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="API key non disponibile"
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

            {message ? (
              <div className={`ia-apikey-message ${status === "error" ? "error" : "success"}`}>
                {message}
              </div>
            ) : null}

            <div className="ia-apikey-actions">
              <button type="submit" className="ia-apikey-save" disabled title="Clone read-only">
                Salva chiave
              </button>
            </div>
          </form>
        </div>
      </div>
    </NextClonePageScaffold>
  );
}

