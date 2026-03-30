import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/IA/IAHome.css";
import { readNextIaConfigSnapshot } from "./domain/nextIaConfigDomain";
import {
  NEXT_CISTERNA_IA_PATH,
  NEXT_IA_APIKEY_PATH,
  NEXT_IA_COPERTURA_LIBRETTI_PATH,
  NEXT_IA_DOCUMENTI_PATH,
  NEXT_IA_LIBRETTO_PATH,
  NEXT_LIBRETTI_EXPORT_PATH,
} from "./nextStructuralPaths";

export default function NextIntelligenzaArtificialePage() {
  const navigate = useNavigate();
  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkApiKey = async () => {
      try {
        const snapshot = await readNextIaConfigSnapshot();
        if (!cancelled) {
          setApiKeyExists(snapshot.apiKeyConfigured);
        }
      } catch (error) {
        console.error("Errore lettura API Key clone:", error);
        if (!cancelled) {
          setApiKeyExists(false);
        }
      }
    };

    void checkApiKey();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNav = (path: string) => {
    if (!apiKeyExists && path !== NEXT_IA_APIKEY_PATH) {
      window.alert("Configura prima la API Key per usare l'Intelligenza Artificiale.");
      return;
    }
    navigate(path);
  };

  const apiKeyOk = apiKeyExists === true;
  const apiKeyLabel = apiKeyOk ? "OK" : "MANCANTE";
  const toolStatus = apiKeyOk ? "ATTIVO" : "DISATTIVATO";

  return (
    <div className="ia-page">
      <div className="ia-shell">
        <header className="ia-hero">
          <div className="ia-hero-main">
            <div className="ia-kicker">Modulo IA</div>
            <h1 className="ia-title">Intelligenza Artificiale</h1>
            <p className="ia-subtitle">
              Estrazione dati e documenti con flusso guidato per il dossier mezzi.
            </p>
          </div>
          <div className={`ia-key-badge ${apiKeyOk ? "ok" : "missing"}`}>
            API KEY: {apiKeyLabel}
          </div>
        </header>

        <section className="ia-section">
          <div className="ia-section-head">
            <div>
              <h2>Strumenti attivi</h2>
              <span>Funzioni operative per analisi e import dati</span>
            </div>
          </div>
          <div className="ia-grid">
            <div
              className={`ia-card ${!apiKeyOk ? "disabled" : ""}`}
              onClick={() => handleNav(NEXT_IA_LIBRETTO_PATH)}
            >
              <span className={`ia-card-status ${apiKeyOk ? "on" : "off"}`}>{toolStatus}</span>
              <img src="/icons/ia/libretto.png" alt="Libretto" className="ia-icon" />
              <h3>Estrazione Libretto</h3>
              <p>Leggi automaticamente i dati del mezzo dal libretto.</p>
            </div>

            <div
              className={`ia-card ${!apiKeyOk ? "disabled" : ""}`}
              onClick={() => handleNav(`${NEXT_IA_LIBRETTO_PATH}?archive=1`)}
            >
              <span className={`ia-card-status ${apiKeyOk ? "on" : "off"}`}>{toolStatus}</span>
              <img src="/icons/ia/libretto.png" alt="Archivio" className="ia-icon" />
              <h3>Archivio Libretti</h3>
              <p>Consulta i libretti gia scansionati per targa.</p>
            </div>

            <div
              className={`ia-card ${!apiKeyOk ? "disabled" : ""}`}
              onClick={() => handleNav(NEXT_IA_COPERTURA_LIBRETTI_PATH)}
            >
              <span className={`ia-card-status ${apiKeyOk ? "on" : "off"}`}>{toolStatus}</span>
              <img src="/icons/ia/libretto.png" alt="Copertura" className="ia-icon" />
              <h3>Copertura Libretti + Foto</h3>
              <p>Verifica i mezzi con libretto o foto mancanti.</p>
            </div>

            <div
              className={`ia-card ${!apiKeyOk ? "disabled" : ""}`}
              onClick={() => handleNav(NEXT_LIBRETTI_EXPORT_PATH)}
            >
              <span className={`ia-card-status ${apiKeyOk ? "on" : "off"}`}>{toolStatus}</span>
              <img src="/icons/ia/libretto.png" alt="Libretti Export PDF" className="ia-icon" />
              <h3>Libretti (Export PDF)</h3>
              <p>Seleziona piu targhe e genera un PDF unico con anteprima.</p>
            </div>

            <div
              className={`ia-card ${!apiKeyOk ? "disabled" : ""}`}
              onClick={() => handleNav(NEXT_IA_DOCUMENTI_PATH)}
            >
              <span className={`ia-card-status ${apiKeyOk ? "on" : "off"}`}>{toolStatus}</span>
              <img src="/icons/ia/documenti.png" alt="Documenti" className="ia-icon" />
              <h3>Documenti IA</h3>
              <p>Estrai dati da preventivi, fatture e documenti.</p>
            </div>

            <div
              className={`ia-card ${!apiKeyOk ? "disabled" : ""}`}
              onClick={() => handleNav(NEXT_CISTERNA_IA_PATH)}
            >
              <span className={`ia-card-status ${apiKeyOk ? "on" : "off"}`}>{toolStatus}</span>
              <img src="/cisterna.png" alt="Cisterna" className="ia-icon" />
              <h3>Cisterna Caravate IA</h3>
              <p>Carica documenti cisterna e salva in archivio dedicato.</p>
            </div>

            <div className="ia-card" onClick={() => handleNav(NEXT_IA_APIKEY_PATH)}>
              <span className="ia-card-status on">ATTIVO</span>
              <img src="/icons/ia/key.png" alt="API Key" className="ia-icon" />
              <h3>API Key IA</h3>
              <p>Gestisci la tua chiave Gemini.</p>
            </div>
          </div>
        </section>

        <section className="ia-section ia-section-secondary">
          <div className="ia-section-head">
            <div>
              <h2>In arrivo</h2>
              <span>Funzionalita pronte, attivazione in una fase successiva</span>
            </div>
          </div>
          <div className="ia-grid">
            <div className="ia-card disabled">
              <span className="ia-card-status off">DISATTIVATO</span>
              <img src="/icons/ia/danni.png" alt="Danni" className="ia-icon" />
              <h3>Analisi Danni</h3>
              <p>Funzione in arrivo.</p>
            </div>

            <div className="ia-card disabled">
              <span className="ia-card-status off">DISATTIVATO</span>
              <img src="/icons/ia/diagnostica.png" alt="Diag" className="ia-icon" />
              <h3>Diagnostica IA</h3>
              <p>Funzione in arrivo.</p>
            </div>

            <div className="ia-card disabled">
              <span className="ia-card-status off">DISATTIVATO</span>
              <img src="/icons/ia/futuro.png" alt="Futuro" className="ia-icon" />
              <h3>In sviluppo</h3>
              <p>Nuove funzioni in arrivo.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
