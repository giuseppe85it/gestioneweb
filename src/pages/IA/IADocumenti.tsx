import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";  
import "./IADocumenti.css";
// TIPI

type TipoDocumento = "PREVENTIVO" | "FATTURA" | "MAGAZZINO" | "GENERICO";
type CategoriaArchivio = "MEZZO" | "MAGAZZINO" | "GENERICO";

interface VoceDocumento {
  codice?: string;
  descrizione: string;
  categoria?: string; // es. "MANODOPERA", "RICAMBIO", "TASSA"
  quantita?: number;
  prezzoUnitario?: number;
  scontoPercentuale?: number;
  importo?: number;
}

interface PagamentoInfo {
  iban?: string;
  beneficiario?: string;
  riferimento?: string;
  banca?: string;
  scadenza?: string;
  importo?: number;
}

interface DocumentoAnalizzato {
  tipoDocumento: TipoDocumento;
  categoriaArchivio: CategoriaArchivio;

  fornitore: string;
  numeroDocumento: string;
  dataDocumento: string;

  targa?: string;
  mezzoMarca?: string;
  mezzoModello?: string;
  telaio?: string;
  km?: string;
  dataPrimaEntrata?: string;

  riferimentoPreventivoNumero?: string;
  riferimentoPreventivoData?: string;

  imponibile?: number;
  ivaPercentuale?: number;
  ivaImporto?: number;
  totaleDocumento?: number;

  voci: VoceDocumento[];

  pagamento?: PagamentoInfo;

  testo?: string;

  rawIaJson?: any;
}

const IADocumenti: React.FC = () => {
  const navigate = useNavigate();

  const [apiKeyExists, setApiKeyExists] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tipoArchivio, setTipoArchivio] = useState<CategoriaArchivio>("GENERICO");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DocumentoAnalizzato | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Controllo API KEY IA (stessa logica di IAApiKey / IALibretto)
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
    setResults(null);

    // Preview solo immagini, non PDF
    if (f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = () => setPreview(r.result as string);
      r.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  // Converte il file in base64 (senza "data:...")
  const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Errore lettura file"));
      reader.onload = () => {
        const res = reader.result as string;
        // res è "data:xxx/yyy;base64,AAAA..."
        const parts = res.split(",");
        if (parts.length !== 2) {
          reject(new Error("Formato base64 non valido"));
          return;
        }
        resolve({ base64: parts[1], mimeType: file.type || "application/octet-stream" });
      };

      reader.readAsDataURL(file);
    });
  };

const analyzeDocumentoConIA = async (
  base64: string,
  mimeType: string,
  categoriaArchivio: CategoriaArchivio | null
): Promise<any> => {
 
  try {
    setLoading(true);

    const response = await fetch(
      "https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "estrazione_documento",
          fileBase64: base64,
          mimeType: mimeType,
          categoriaArchivio: categoriaArchivio || null,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Errore HTTP:", errorText);
      throw new Error("Errore IA");
    }

    const data = await response.json();
    setResults(data);
    return data;

  } catch (error) {
    console.error("Errore analisi IA documenti:", error);
    alert("Errore nell'analisi del documento.");
  } finally {
    setLoading(false);
  }
};


  // Pulsante "Analizza"
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setErrorMessage("Carica un file prima.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      setResults(null);

      const { base64, mimeType } = await fileToBase64(selectedFile);
      const analyzed = await analyzeDocumentoConIA(base64, mimeType, tipoArchivio);
      setResults(analyzed);
    } catch (err: any) {
      console.error("Errore analisi IA documenti:", err);
      setErrorMessage(
        err?.message || "Errore durante l'analisi del documento con IA."
      );
    } finally {
      setLoading(false);
    }
  };

  // Salvataggio su Firestore
  const handleSave = async () => {
    if (!results) {
      setErrorMessage("Nessun risultato da salvare.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      let collectionName = "@documenti_generici";
      if (results.categoriaArchivio === "MEZZO") {
        collectionName = "@documenti_mezzi";
      } else if (results.categoriaArchivio === "MAGAZZINO") {
        collectionName = "@documenti_magazzino";
      }

      const payload = {
        ...results,
        createdAt: serverTimestamp(),
        fonte: "IA",
      };

      await addDoc(collection(db, collectionName), payload);

      alert("Documento salvato correttamente.");
    } catch (err: any) {
      console.error("Errore salvataggio documento:", err);
      setErrorMessage(
        err?.message || "Errore durante il salvataggio del documento."
      );
    } finally {
      setLoading(false);
    }
  };

  // Nessuna API KEY
  if (apiKeyExists === false) {
    return (
      <div className="iadoc-nokey">
        <h2>API Key IA mancante</h2>
        <p>Inserisci la tua chiave Gemini per usare i documenti IA.</p>
        <button onClick={() => navigate("/ia/apikey")}>
          Vai alla pagina API Key
        </button>
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

        {/* Selettore tipo archivio */}
        <select
          className="iadoc-select"
          value={tipoArchivio}
          onChange={(e) => setTipoArchivio(e.target.value as CategoriaArchivio)}
        >
          <option value="GENERICO">Generico</option>
          <option value="MEZZO">Mezzo</option>
          <option value="MAGAZZINO">Magazzino</option>
        </select>

        {/* Upload */}
        <label className="iadoc-upload">
          Carica PDF o Immagine
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFile}
          />
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

            <label>Tipo documento</label>
            <input value={results.tipoDocumento} disabled />

            <label>Fornitore</label>
            <input
              value={results.fornitore}
              onChange={(e) =>
                setResults({ ...results, fornitore: e.target.value })
              }
            />

            <label>Numero documento</label>
            <input
              value={results.numeroDocumento}
              onChange={(e) =>
                setResults({ ...results, numeroDocumento: e.target.value })
              }
            />

            <label>Data documento</label>
            <input
              value={results.dataDocumento}
              onChange={(e) =>
                setResults({ ...results, dataDocumento: e.target.value })
              }
            />

            <label>Targa</label>
            <input
              value={results.targa || ""}
              onChange={(e) =>
                setResults({ ...results, targa: e.target.value })
              }
            />

            <label>Totale documento</label>
            <input
              value={
                results.totaleDocumento !== undefined
                  ? String(results.totaleDocumento)
                  : ""
              }
              onChange={(e) =>
                setResults({
                  ...results,
                  totaleDocumento: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
            />

            <label>Categoria archivio</label>
            <input value={results.categoriaArchivio} disabled />

            <button className="iadoc-save" onClick={handleSave} disabled={loading}>
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
