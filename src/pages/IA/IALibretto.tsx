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
    const refMezzi = doc(db, "@mezzi_aziendali", "storage");
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
    return <div className="ialibretto-loading">Caricamento...</div>;

  if (apiKeyExists === false) {
    return (
      <div className="ialibretto-nokey">
        <h2>API Key IA mancante</h2>
        <p>Prima di usare questa funzione devi inserire la tua chiave Gemini.</p>
        <button onClick={() => navigate("/ia/apikey")}>
          Vai a API Key IA
        </button>
      </div>
    );
  }

  return (
    <div className="ialibretto-page">
      <div className="ialibretto-card">
        <h1 className="ialibretto-title">Estrazione Libretto Mezzo (IA)</h1>

        {/* UPLOAD */}
        <div className="ialibretto-upload">
          <label className="upload-label">
            Carica foto del libretto
            <input type="file" accept="image/*" onChange={handleFile} />
          </label>

          {preview && (
            <img src={preview} className="ialibretto-preview" alt="preview" />
          )}
        </div>

        {/* ERRORE */}
        {errorMessage && (
          <div className="ialibretto-error">{errorMessage}</div>
        )}

        {/* ANALIZZA */}
        <button
          className="ialibretto-analyze"
          onClick={handleAnalyze}
          disabled={!selectedFile || loading}
        >
          {loading ? "Analisi in corso..." : "Analizza con IA"}
        </button>

        {/* RISULTATI */}
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

            <button className="ialibretto-save" onClick={handleSave}>
              Salva nei documenti del mezzo
            </button>
          </div>
        )}

        <button className="ialibretto-back" onClick={() => navigate("/ia")}>
          Torna al menu IA
        </button>
      </div>
    </div>
  );
};

export default IALibretto;
