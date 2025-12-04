import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./IADocumenti.css";

const IADocumenti: React.FC = () => {
  const navigate = useNavigate();

  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tipo, setTipo] = useState("GENERICO");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Controllo API KEY IA
  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, "@impostazioni_app", "gemini");
        const snap = await getDoc(ref);
        if (!snap.exists() || !snap.data().apiKey) setApiKeyExists(false);
        else setApiKeyExists(true);
      } catch {
        setApiKeyExists(false);
      }
    };
    load();
  }, []);

  // Upload file
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setSelectedFile(f);
    setErrorMessage(null);

    // Preview solo immagini, non PDF
    if (f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = () => setPreview(r.result as string);
      r.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  // Pulsante "Analizza"
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage("Carica un file prima.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // Qui andrà la chiamata IA reale
    // Per ora metto risultati finti corretti per test
    setTimeout(() => {
      setResults({
        fornitore: "",
        numero: "",
        data: "",
        importo: "",
        materiali: [],
        categoria: tipo,
        testo: "",
      });
      setLoading(false);
    }, 800);
  };

  // Salvataggio futuro
  const handleSave = () => {
    alert("Funzione di salvataggio pronta per integrazione.");
  };

  // Nessuna API KEY
  if (apiKeyExists === false) {
    return (
      <div className="iadoc-nokey">
        <h2>API Key IA mancante</h2>
        <p>Inserisci la tua chiave Gemini per usare i documenti IA.</p>
        <button onClick={() => navigate("/ia/apikey")}>Vai alla pagina API Key</button>
      </div>
    );
  }

  // Caricamento iniziale
  if (apiKeyExists === null) {
    return <div className="iadoc-loading">Caricamento…</div>;
  }

  return (
    <div className="iadoc-page">
      <div className="iadoc-card">
        <h1 className="iadoc-title">Documenti IA</h1>

        {/* Selettore tipo */}
        <select
          className="iadoc-select"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="GENERICO">Generico</option>
          <option value="MEZZO">Mezzo</option>
          <option value="MAGAZZINO">Magazzino</option>
        </select>

        {/* Upload */}
        <label className="iadoc-upload">
          Carica PDF o Immagine
          <input type="file" accept="image/*,application/pdf" onChange={handleFile} />
        </label>

        {preview && (
          <img src={preview} alt="preview" className="iadoc-preview" />
        )}

        {/* Errore */}
        {errorMessage && <div className="iadoc-error">{errorMessage}</div>}

        {/* Analizza */}
        <button
          className="iadoc-analyze"
          disabled={!selectedFile || loading}
          onClick={handleAnalyze}
        >
          {loading ? "Analisi..." : "Analizza con IA"}
        </button>

        {/* Risultati */}
        {results && (
          <div className="iadoc-results">
            <h2>Risultati Analisi</h2>

            <label>Fornitore</label>
            <input
              value={results.fornitore}
              onChange={(e) => setResults({ ...results, fornitore: e.target.value })}
            />

            <label>Numero Documento</label>
            <input
              value={results.numero}
              onChange={(e) => setResults({ ...results, numero: e.target.value })}
            />

            <label>Data</label>
            <input
              value={results.data}
              onChange={(e) => setResults({ ...results, data: e.target.value })}
            />

            <label>Importo Totale</label>
            <input
              value={results.importo}
              onChange={(e) => setResults({ ...results, importo: e.target.value })}
            />

            <label>Categoria</label>
            <input value={tipo} disabled />

            <button className="iadoc-save" onClick={handleSave}>
              Salva Documento
            </button>
          </div>
        )}

        <button className="iadoc-back" onClick={() => navigate("/ia")}>
          Torna al menu IA
        </button>
      </div>
    </div>
  );
};

export default IADocumenti;
