import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../../firebase";
import { CISTERNA_DOCUMENTI_COLLECTION } from "../../cisterna/collections";
import { extractCisternaFromFileUrl } from "../../cisterna/iaClient";
import type { CisternaDocumento, Currency } from "../../cisterna/types";
import "./CisternaCaravateIA.css";

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_");
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCurrency(value: unknown): Currency {
  const raw = String(value ?? "").toUpperCase().trim();
  if (raw.includes("EUR") || raw.includes("€")) return "EUR";
  if (raw.includes("CHF") || raw.includes("FR")) return "CHF";
  return "UNKNOWN";
}

export default function CisternaCaravateIA() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [results, setResults] = useState<CisternaDocumento | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setFileUrl(null);
    setResults(null);
    setSavedDocId("");
    setError("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Seleziona un file prima dell'analisi.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);
    setSavedDocId("");

    try {
      const now = new Date();
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const safeName = sanitizeFileName(selectedFile.name);
      const path = `documenti_pdf/cisterna/${yyyy}/${mm}/${Date.now()}_${safeName}`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(storageRef);
      setFileUrl(downloadUrl);

      const analyzed = await extractCisternaFromFileUrl({
        fileUrl: downloadUrl,
        mimeType: selectedFile.type || "application/octet-stream",
        nomeFile: selectedFile.name,
      });

      setResults(analyzed);
    } catch (err: any) {
      setError(err?.message || "Errore durante analisi IA cisterna.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!results || !fileUrl) {
      setError("Analizza prima il documento.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const litri15C = toNumberOrNull(results.litri15C);
      const litriAmbiente = toNumberOrNull(results.litriAmbiente);
      const currency = normalizeCurrency(results.currency ?? results.valuta);
      const payload = {
        ...results,
        litri15C,
        litriAmbiente,
        valuta: currency,
        currency,
        fileUrl,
        nomeFile: selectedFile?.name ?? results.nomeFile ?? null,
        createdAt: serverTimestamp(),
        fonte: "IA",
        ...(litri15C == null
          ? {
              daVerificare: true,
              motivoVerifica: "litri_non_trovati",
            }
          : {}),
      };

      const savedRef = await addDoc(
        collection(db, CISTERNA_DOCUMENTI_COLLECTION),
        payload
      );
      setSavedDocId(savedRef.id);
    } catch (err: any) {
      setError(err?.message || "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cisterna-ia-page">
      <div className="cisterna-ia-shell">
        <header className="cisterna-ia-head">
          <div>
            <h1>Cisterna Caravate IA</h1>
            <p>
              Upload documento, estrazione automatica e salvataggio in
              <code> @documenti_cisterna</code>.
            </p>
          </div>
          <div className="cisterna-ia-actions">
            <button type="button" onClick={() => navigate("/cisterna")}>
              Vai a Cisterna
            </button>
            <button type="button" onClick={() => navigate("/ia")}>
              Torna a IA
            </button>
          </div>
        </header>

        <section className="cisterna-ia-card">
          <label className="cisterna-ia-field">
            <span>File documento (PDF o immagine)</span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFile}
              disabled={loading || saving}
            />
          </label>

          <div className="cisterna-ia-row">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!selectedFile || loading || saving}
            >
              {loading ? "Analisi in corso..." : "Analizza con IA"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!results || !fileUrl || loading || saving}
            >
              {saving ? "Salvataggio..." : "Salva in archivio cisterna"}
            </button>
          </div>

          {error ? <div className="cisterna-ia-error">{error}</div> : null}
          {savedDocId ? (
            <div className="cisterna-ia-ok">
              Documento salvato con id: <strong>{savedDocId}</strong>
            </div>
          ) : null}
        </section>

        {results ? (
          <section className="cisterna-ia-card">
            <h2>Risultato estrazione</h2>
            <div className="cisterna-ia-grid">
              <div>
                <strong>Tipo documento</strong>
                <span>{results.tipoDocumento || "-"}</span>
              </div>
              <div>
                <strong>Data documento</strong>
                <span>{results.dataDocumento || "-"}</span>
              </div>
              <div>
                <strong>Fornitore</strong>
                <span>{results.fornitore || "-"}</span>
              </div>
              <div>
                <strong>Luogo consegna</strong>
                <span>{results.luogoConsegna || "-"}</span>
              </div>
              <div>
                <strong>Prodotto</strong>
                <span>{results.prodotto || "-"}</span>
              </div>
              <div>
                <strong>Litri 15°C</strong>
                <span>{results.litri15C ?? "-"}</span>
              </div>
              <div>
                <strong>Litri ambiente</strong>
                <span>{results.litriAmbiente ?? "-"}</span>
              </div>
              <div>
                <strong>Numero documento</strong>
                <span>{results.numeroDocumento || "-"}</span>
              </div>
              <div>
                <strong>Totale documento</strong>
                <span>{results.totaleDocumento ?? "-"}</span>
              </div>
              <div>
                <strong>Valuta</strong>
                <span>{results.currency || results.valuta || "-"}</span>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

