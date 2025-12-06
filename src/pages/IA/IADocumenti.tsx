import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  descrizione?: string;
  categoria?: string; // es. "MANODOPERA", "RICAMBIO", "TASSA"
  quantita?: string;
  prezzoUnitario?: string;
  scontoPercentuale?: string;
  importo?: string;
}

interface DocumentoAnalizzato {
  tipoDocumento: TipoDocumento;
  categoriaArchivio: CategoriaArchivio;

  fornitore: string;
  numeroDocumento: string;
  dataDocumento: string;

  // Dati mezzo
  targa?: string;
  marca?: string;
  modello?: string;
  telaio?: string;
  km?: string;

  // Collegamento a preventivo
  riferimentoPreventivoNumero?: string;
  riferimentoPreventivoData?: string;

  // Totali documento
  imponibile?: string;
  ivaPercentuale?: string;
  ivaImporto?: string;
  totaleDocumento?: string;

  // Voci di dettaglio
  voci?: VoceDocumento[];

  // Pagamento
  iban?: string;
  beneficiario?: string;
  riferimentoPagamento?: string;
  banca?: string;
  importoPagamento?: string;

  // Testo generico
  testo?: string;
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
  mimeType: string
): Promise<any> => {
 
  try {
    setLoading(true);

    const response = await fetch(
      "https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/estrazioneDocumenti",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
  fileBase64: base64,
  mimeType: mimeType
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
    const analyzed = await analyzeDocumentoConIA(
      base64,
      mimeType,
        );

if (analyzed) {
  console.log("### DEBUG RISULTATO IA ###", analyzed);

setResults({
  ...analyzed.data,
  categoriaArchivio: tipoArchivio,
});
}
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
  if (!results || !selectedFile) {
    setErrorMessage("Nessun risultato o file mancante.");
    return;
  }

  try {
    setLoading(true);
    setErrorMessage(null);

    // 1. Carica PDF su Firebase Storage
    const storage = getStorage();
    const fileRef = ref(storage, `documenti_pdf/${Date.now()}_${selectedFile.name}`);
    await uploadBytes(fileRef, selectedFile);
    const fileUrl = await getDownloadURL(fileRef);


const payload = {
  ...results,
  fileUrl,                  // ← AGGIUNTO
  nomeFile: selectedFile.name,
  createdAt: serverTimestamp(),
  fonte: "IA",
};
// Collection già esistenti nel progetto (non modificate)
const targetCollection =
  results.categoriaArchivio === "MEZZO"
    ? "@documenti_mezzi"
    : results.categoriaArchivio === "MAGAZZINO"
    ? "@documenti_magazzino"
    : "@documenti_generici";

await addDoc(collection(db, targetCollection), payload);



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
{/* Risultati */}
{results && (
  <div className="iadoc-results">
    <h2>Risultati Analisi</h2>

    {/* Documento */}
    <label>Tipo documento</label>
    <input
      value={results.tipoDocumento || ""}
      onChange={(e) =>
        setResults({
          ...results,
          tipoDocumento: e.target.value as TipoDocumento,
        })
      }
    />

    <label>Fornitore</label>
    <input
      value={results.fornitore || ""}
      onChange={(e) =>
        setResults({ ...results, fornitore: e.target.value })
      }
    />

    <label>Numero documento</label>
    <input
      value={results.numeroDocumento || ""}
      onChange={(e) =>
        setResults({ ...results, numeroDocumento: e.target.value })
      }
    />

    <label>Data documento</label>
    <input
      value={results.dataDocumento || ""}
      onChange={(e) =>
        setResults({ ...results, dataDocumento: e.target.value })
      }
    />

    {/* Mezzo */}
    <label>Targa</label>
    <input
      value={results.targa || ""}
      onChange={(e) =>
        setResults({ ...results, targa: e.target.value })
      }
    />

    <label>Marca</label>
    <input
      value={results.marca || ""}
      onChange={(e) =>
        setResults({ ...results, marca: e.target.value })
      }
    />

    <label>Modello</label>
    <input
      value={results.modello || ""}
      onChange={(e) =>
        setResults({ ...results, modello: e.target.value })
      }
    />

    <label>Telaio</label>
    <input
      value={results.telaio || ""}
      onChange={(e) =>
        setResults({ ...results, telaio: e.target.value })
      }
    />

    <label>KM</label>
    <input
      value={results.km || ""}
      onChange={(e) =>
        setResults({ ...results, km: e.target.value })
      }
    />

    {/* Collegamento preventivo */}
    <label>Numero preventivo</label>
    <input
      value={results.riferimentoPreventivoNumero || ""}
      onChange={(e) =>
        setResults({
          ...results,
          riferimentoPreventivoNumero: e.target.value,
        })
      }
    />

    <label>Data preventivo</label>
    <input
      value={results.riferimentoPreventivoData || ""}
      onChange={(e) =>
        setResults({
          ...results,
          riferimentoPreventivoData: e.target.value,
        })
      }
    />

    {/* Totali */}
    <label>Imponibile</label>
    <input
      value={results.imponibile || ""}
      onChange={(e) =>
        setResults({ ...results, imponibile: e.target.value })
      }
    />

    <label>IVA %</label>
    <input
      value={results.ivaPercentuale || ""}
      onChange={(e) =>
        setResults({ ...results, ivaPercentuale: e.target.value })
      }
    />

    <label>IVA importo</label>
    <input
      value={results.ivaImporto || ""}
      onChange={(e) =>
        setResults({ ...results, ivaImporto: e.target.value })
      }
    />

    <label>Totale documento</label>
    <input
      value={results.totaleDocumento || ""}
      onChange={(e) =>
        setResults({ ...results, totaleDocumento: e.target.value })
      }
    />

    {/* Pagamento */}
    <label>IBAN</label>
    <input
      value={results.iban || ""}
      onChange={(e) =>
        setResults({ ...results, iban: e.target.value })
      }
    />

    <label>Beneficiario</label>
    <input
      value={results.beneficiario || ""}
      onChange={(e) =>
        setResults({ ...results, beneficiario: e.target.value })
      }
    />

    <label>Riferimento pagamento</label>
    <input
      value={results.riferimentoPagamento || ""}
      onChange={(e) =>
        setResults({
          ...results,
          riferimentoPagamento: e.target.value,
        })
      }
    />

    <label>Banca</label>
    <input
      value={results.banca || ""}
      onChange={(e) =>
        setResults({ ...results, banca: e.target.value })
      }
    />

    <label>Importo pagamento</label>
    <input
      value={results.importoPagamento || ""}
      onChange={(e) =>
        setResults({
          ...results,
          importoPagamento: e.target.value,
        })
      }
    />

    {/* Testo / note */}
    <label>Testo / Note</label>
    <textarea
      className="iadoc-textarea"
      value={results.testo || ""}
      onChange={(e) =>
        setResults({ ...results, testo: e.target.value })
      }
    />

    {/* Voci */}
    {results.voci && results.voci.length > 0 && (
      <>
        <h3>Voci documento</h3>
        {results.voci.map((voce, index) => (
          <div key={index} className="iadoc-voce-row">
            <input
              placeholder="Descrizione"
              value={voce.descrizione || ""}
              onChange={(e) => {
                const newVoci = [...(results.voci || [])];
                newVoci[index] = {
                  ...newVoci[index],
                  descrizione: e.target.value,
                };
                setResults({ ...results, voci: newVoci });
              }}
            />
            <input
              placeholder="Quantità"
              value={voce.quantita || ""}
              onChange={(e) => {
                const newVoci = [...(results.voci || [])];
                newVoci[index] = {
                  ...newVoci[index],
                  quantita: e.target.value,
                };
                setResults({ ...results, voci: newVoci });
              }}
            />
            <input
              placeholder="Prezzo unitario"
              value={voce.prezzoUnitario || ""}
              onChange={(e) => {
                const newVoci = [...(results.voci || [])];
                newVoci[index] = {
                  ...newVoci[index],
                  prezzoUnitario: e.target.value,
                };
                setResults({ ...results, voci: newVoci });
              }}
            />
            <input
              placeholder="Importo"
              value={voce.importo || ""}
              onChange={(e) => {
                const newVoci = [...(results.voci || [])];
                newVoci[index] = {
                  ...newVoci[index],
                  importo: e.target.value,
                };
                setResults({ ...results, voci: newVoci });
              }}
            />
          </div>
        ))}
      </>
    )}

    <label>Categoria archivio</label>
    <input value={results.categoriaArchivio} disabled />

        <button
      className="iadoc-save"
      onClick={handleSave}
      disabled={loading}
    >
      Salva Documento
    </button>
  </div>
)}

      </div>
    </div>
  );
}


export default IADocumenti;
