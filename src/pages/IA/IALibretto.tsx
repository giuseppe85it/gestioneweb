import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { doc, getDoc, setDoc } from "firebase/firestore";

import {
  ref,
  uploadString,
  getDownloadURL,
} from "firebase/storage";

import { db, storage } from "../../firebase";
import "./IALibretto.css";

const IALibretto: React.FC = () => {
  const navigate = useNavigate();

  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Verifica API KEY GEMINI
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const refApi = doc(db, "@impostazioni_app", "gemini");
        const snap = await getDoc(refApi);

        if (!snap.exists() || !snap.data().apiKey) {
          setApiKeyExists(false);
        } else {
          setApiKeyExists(true);
        }
      } catch (err) {
        console.error("Errore lettura API Key:", err);
        setApiKeyExists(false);
      }
    };
    void loadApiKey();
  }, []);

  // Upload immagine
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Carica solo immagini (JPG o PNG).");
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Analisi IA libretto
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage("Carica una foto prima di analizzare.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Converti immagine → base64
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject("Errore lettura immagine");
        reader.readAsDataURL(selectedFile);
      });

      if (!base64) throw new Error("Immagine non letta correttamente.");

      // Converti PNG → JPEG
      const jpegBase64 = base64.startsWith("data:image/png")
        ? base64.replace("data:image/png", "data:image/jpeg")
        : base64;

      const url = "https://estrazione-libretto-7bo6jdsreq-uc.a.run.app";

      console.log("### DEBUG jpegBase64 ###", jpegBase64.substring(0, 100));

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: jpegBase64,
          mimeType: "image/jpeg",
        }),
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error("Errore HTTP: " + response.status + " → " + txt);
      }

     

        const json = await response.json();
      if (!json.success) throw new Error(json.error || "Errore backend");

      // LASCIA PASSARE TUTTI I CAMPI CHE ARRIVANO DALL'IA
      setResults(json.data);

    }    catch (err: any) {
      console.error("Errore durante l'analisi:", err);
      setErrorMessage(
        err?.message ||
          "Errore durante l'analisi. Controlla la connessione e riprova."
      );
    } finally {
      setLoading(false);
    }
  };

  // Salvataggio libretto → Mezzi
const handleSave = async () => {
  if (!results || !results.targa) {
    alert("Nessun dato valido da salvare.");
    return;
  }

  setLoading(true);
  setErrorMessage("");

  try {
    const targa = results.targa.toUpperCase().replace(/\s+/g, "");
const refMezzi = doc(db, "storage", "@mezzi_aziendali");
    const snap = await getDoc(refMezzi);

    let mezzi = snap.exists() ? snap.data().value || [] : [];

    // 1) Cerca mezzo esistente
    const index = mezzi.findIndex(
      (m: any) => m.targa?.toUpperCase() === targa
    );

    let mezzo;

    if (index >= 0) {
      mezzo = { ...mezzi[index] };
    } else {
      mezzo = {
        id: `MEZZO-${Date.now()}`,
        fotoUrl: null,
        tipo: "motrice",
        categoria: "",

        targa,
        marca: "",
        modello: "",
        telaio: "",
        colore: "",
        cilindrata: "",
        potenza: "",
        massaComplessiva: "",
        proprietario: "",
        assicurazione: "",
        dataImmatricolazione: "",
        dataScadenzaRevisione: "",
        dataUltimoCollaudo: "",   // <--- CAMPO AGGIUNTO

        manutenzioneProgrammata: false,
        manutenzioneDataInizio: "",
        manutenzioneDataFine: "",
        manutenzioneKmMax: "",
        manutenzioneContratto: "",
        note: "",

        autistaId: null,
        autistaNome: null,

        marcaModello: "",
        anno: "",
      };

      mezzi.push(mezzo);
    }

    // 2) MAPPA DEFINITIVA IA → MEZZI
    const mappaCampi: Record<string, string> = {
      marca: "marca",
      modello: "modello",
      telaio: "telaio",
      colore: "colore",
      categoria: "categoria",

      cilindrata: "cilindrica",    // IA usa "cilindrica"
      potenza: "potenza",

      massaComplessiva: "pesoTotale",

      proprietario: "proprietario",
      assicurazione: "assicurazione",

      dataImmatricolazione: "immatricolazione",

      dataUltimoCollaudo: "revisione",  // 🔥 ultimo collaudo

      dataScadenzaRevisione: "dataScadenzaRevisione",

      note: "note",
    };

    // 3) AGGIORNAMENTO AUTOMATICO E SICURO
    Object.entries(mappaCampi).forEach(([campoMezzo, campoIA]) => {
      const valore = results[campoIA];

      if (
        valore !== undefined &&
        valore !== null &&
        String(valore).trim() !== ""
      ) {
        mezzo[campoMezzo] = String(valore).trim();
      }
    });

    // 4) MARCA + MODELLO derivati
    mezzo.marcaModello = `${mezzo.marca} ${mezzo.modello}`.trim();

    // 5) Estrai anno da dataImmatricolazione (17.01.2012 → 2012)
    if (mezzo.dataImmatricolazione) {
      const parti = mezzo.dataImmatricolazione.split(".");
      if (parti.length === 3) mezzo.anno = parti[2];
    }

    // 6) Salvataggio foto libretto
    if (preview) {
      const path = `mezzi_aziendali/${mezzo.id}/libretto.jpg`;
      const storageRef = ref(storage, path);
      await uploadString(storageRef, preview, "data_url");
      const url = await getDownloadURL(storageRef);
      mezzo.librettoUrl = url;
    }

    // 7) Sanitizzazione per Firestore
    Object.keys(mezzo).forEach((k) => {
      if (mezzo[k] === undefined) mezzo[k] = null;
    });

    // 8) Riscrivi array mezzi
    mezzi[index >= 0 ? index : mezzi.length - 1] = mezzo;

    await setDoc(refMezzi, { value: mezzi });

    alert("Dati libretto salvati correttamente.");

  } catch (err: any) {
    console.error("Errore salvataggio:", err);
    setErrorMessage(err.message || "Errore durante il salvataggio.");
  } finally {
    setLoading(false);
  }
};


  // UI
  if (apiKeyExists === null)
    return (
      <div className="ialibretto-page">
        <div className="ialibretto-shell">
          <div className="ialibretto-card ia-state-card">
            <div className="ia-state-title">Caricamento...</div>
          </div>
        </div>
      </div>
    );

  if (apiKeyExists === false) {
    return (
      <div className="ialibretto-page">
        <div className="ialibretto-shell">
          <div className="ialibretto-card ia-state-card">
            <div className="ia-state-title">API Key IA mancante</div>
            <p className="ia-state-text">
              Prima di usare questa funzione devi inserire la tua chiave Gemini.
            </p>
            <button className="ia-btn primary" onClick={() => navigate("/ia/apikey")}>
              Vai a API Key IA
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ialibretto-page">
      <div className="ialibretto-shell">
        <header className="ia-page-head">
          <div>
            <div className="ia-kicker">Modulo IA</div>
            <h1 className="ialibretto-title">Estrazione Libretto Mezzo</h1>
            <p className="ia-subtitle">
              Carica una foto, analizza con IA e verifica i dati estratti.
            </p>
          </div>
          <div className="ia-steps">
            <span>1 Carica</span>
            <span>2 Analizza</span>
            <span>3 Verifica</span>
            <span>4 Salva</span>
          </div>
        </header>

        <div className="ialibretto-grid">
          <div className="ialibretto-panel">
            <div className="ia-panel-head">
              <h2>Caricamento libretto</h2>
              <span>JPG o PNG, foto nitida</span>
            </div>

            <label className="upload-label">
              Carica foto del libretto
              <input type="file" accept="image/*" onChange={handleFile} />
            </label>

            {errorMessage && (
              <div className="ialibretto-error">{errorMessage}</div>
            )}

            <button
              className="ia-btn primary"
              onClick={handleAnalyze}
              disabled={!selectedFile || loading}
            >
              {loading ? "Analisi in corso..." : "Analizza con IA"}
            </button>

            <button className="ia-btn outline" onClick={() => navigate("/ia")}>
              Torna al menu IA
            </button>
          </div>

          <div className="ialibretto-panel">
            <div className="ia-panel-head">
              <h2>Anteprima e risultati</h2>
              <span>Verifica e correggi prima di salvare</span>
            </div>

            {preview ? (
              <img src={preview} className="ialibretto-preview" alt="preview" />
            ) : (
              <div className="ialibretto-empty">Nessuna anteprima</div>
            )}

            {results && (
              <div className="ialibretto-results">
                <h2>Dati estratti</h2>

                {Object.entries(results).map(([key, value]) => (
                  <div key={key} className="ialibretto-field">
                    <label>{key}</label>
                    <input
                      value={String(value ?? "")}
                      onChange={(e) =>
                        setResults({ ...results, [key]: e.target.value })
                      }
                    />
                  </div>
                ))}

                <button className="ia-btn primary" onClick={handleSave}>
                  Salva nei documenti del mezzo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IALibretto;
