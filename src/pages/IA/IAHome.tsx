import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import "./IAHome.css";

export default function IAHome() {
  const navigate = useNavigate();
  const db = getFirestore();

  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);

  // Controlla se esiste la API Key in Firestore
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const ref = doc(db, "@impostazioni_app", "gemini");
        const snap = await getDoc(ref);

        if (snap.exists() && snap.data().apiKey) {
          setApiKeyExists(true);
        } else {
          setApiKeyExists(false);
        }
      } catch (error) {
        console.error("Errore lettura API Key:", error);
        setApiKeyExists(false);
      }
    };

    checkApiKey();
  }, []);

  const handleNav = (path: string) => {
    if (!apiKeyExists && path !== "/ia/apikey") {
      alert("Configura prima la API Key per usare l’Intelligenza Artificiale.");
      return;
    }
    navigate(path);
  };

  return (
    <div className="ia-container">
      <h1 className="ia-title">Intelligenza Artificiale</h1>

      <div className="ia-grid">
        
        {/* Estrazione Libretto */}
        <div
          className={`ia-card ${!apiKeyExists ? "disabled" : ""}`}
          onClick={() => handleNav("/ia/libretto")}
        >
          <img src="/icons/ia/libretto.png" alt="Libretto" className="ia-icon" />
          <h3>Estrazione Libretto</h3>
          <p>Leggi automaticamente i dati del mezzo dal libretto.</p>
        </div>

        {/* Documenti IA */}
        <div
          className={`ia-card ${!apiKeyExists ? "disabled" : ""}`}
          onClick={() => handleNav("/ia/documenti")}
        >
          <img src="/icons/ia/documenti.png" alt="Documenti" className="ia-icon" />
          <h3>Documenti IA</h3>
          <p>Estrai dati da preventivi, fatture e documenti.</p>
        </div>

        {/* Foto Danni (disattivato) */}
        <div className="ia-card disabled">
          <img src="/icons/ia/danni.png" alt="Danni" className="ia-icon" />
          <h3>Analisi Danni</h3>
          <p>Funzione in arrivo.</p>
        </div>

        {/* Diagnostica IA (disattivato) */}
        <div className="ia-card disabled">
          <img src="/icons/ia/diagnostica.png" alt="Diag" className="ia-icon" />
          <h3>Diagnostica IA</h3>
          <p>Funzione in arrivo.</p>
        </div>

        {/* API Key */}
        <div className="ia-card" onClick={() => handleNav("/ia/apikey")}>
          <img src="/icons/ia/key.png" alt="API Key" className="ia-icon" />
          <h3>API Key IA</h3>
          <p>Gestisci la tua chiave Gemini.</p>
        </div>

        {/* Slot futuro */}
        <div className="ia-card disabled">
          <img src="/icons/ia/futuro.png" alt="Futuro" className="ia-icon" />
          <h3>In sviluppo</h3>
          <p>Nuove funzioni in arrivo.</p>
        </div>

      </div>
    </div>
  );
}
