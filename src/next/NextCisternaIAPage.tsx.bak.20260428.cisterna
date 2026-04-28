import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { currentMonthKey } from "../cisterna/collections";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";
import "../pages/CisternaCaravate/CisternaCaravateIA.css";

type DocumentoForm = {
  tipoDocumento: "fattura" | "bollettino";
  fornitore: string;
  destinatario: string;
  numeroDocumento: string;
  dataDocumento: string;
  litriTotali: string;
  totaleDocumento: string;
  valuta: "" | "EUR" | "CHF";
  prodotto: string;
  testo: string;
  daVerificare: boolean;
  motivoVerifica: string;
};

const YEAR_MONTH_REGEX = /^(\d{4})-(\d{2})$/;

function isValidYearMonth(value: string): boolean {
  const match = String(value || "").match(YEAR_MONTH_REGEX);
  if (!match) return false;
  const month = Number(match[2]);
  return month >= 1 && month <= 12;
}

function isHeicFile(file: File): boolean {
  const mime = String(file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  return (
    mime.includes("heic") ||
    mime.includes("heif") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

function isImage(file: File): boolean {
  return String(file.type || "").toLowerCase().startsWith("image/");
}

function buildBlockedPreviewForm(fileName: string): DocumentoForm {
  const lower = fileName.toLowerCase();
  return {
    tipoDocumento: lower.includes("boll") || lower.includes("ddt") ? "bollettino" : "fattura",
    fornitore: "",
    destinatario: "",
    numeroDocumento: "",
    dataDocumento: "",
    litriTotali: "",
    totaleDocumento: "",
    valuta: "",
    prodotto: "",
    testo: "",
    daVerificare: true,
    motivoVerifica: "preview_read_only",
  };
}

export default function NextCisternaIAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.cisterna",
  });
  const lifecycleRef = useRef<string | null>(null);

  const monthFromQuery = useMemo(() => {
    const raw = new URLSearchParams(location.search).get("month");
    const value = String(raw ?? "").trim();
    return isValidYearMonth(value) ? value : "";
  }, [location.search]);
  const fallbackYearMonth = monthFromQuery || currentMonthKey();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [form, setForm] = useState<DocumentoForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDocId, setSavedDocId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (handoff.state.status !== "ready") {
      return;
    }
    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }
    handoff.acknowledge(
      "prefill_applicato",
      "Cisterna IA ha agganciato il payload standard e apre il contesto specialistico del clone.",
    );
    handoff.acknowledge(
      handoff.state.requiresVerification ? "da_verificare" : "completato",
      handoff.state.requiresVerification
        ? "Cisterna IA aperta con prefill ma ancora da verificare."
        : "Cisterna IA aperta nel verticale corretto del clone.",
    );
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setForm(null);
    setSavedDocId("");
    setError("");
    if (file && isImage(file)) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl("");
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Seleziona un file prima dell'analisi.");
      return;
    }
    if (isHeicFile(selectedFile)) {
      setError("Formato HEIC/HEIF non supportato. Converti in JPG/PNG o PDF.");
      return;
    }

    setLoading(true);
    setError("");
    setSavedDocId("");

    try {
      setForm(buildBlockedPreviewForm(selectedFile.name));
      setError("Nel clone l'upload e l'analisi IA non vengono eseguiti sulla madre.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = <K extends keyof DocumentoForm>(
    key: K,
    value: DocumentoForm[K],
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
    setSavedDocId("");
  };

  const handleSave = async () => {
    if (!form || !selectedFile) {
      setError("Analizza prima il documento.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      setError("Nel clone il salvataggio nell'archivio Cisterna resta bloccato.");
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = form?.daVerificare ? "DA VERIFICARE" : "OK";
  const statusClass = form?.daVerificare ? "is-warning" : "is-ok";

  return (
    <div className="cisterna-ia-page">
      <div className="cisterna-ia-shell">
        <header className="cisterna-ia-head">
          <div>
            <h1>Cisterna Caravate IA</h1>
            <p>
              Upload, estrazione e salvataggio in
              <code> @documenti_cisterna</code>.
            </p>
            <p style={{ marginTop: 8, color: "#4a6078" }}>
              Nel clone la pagina resta navigabile, ma upload, analisi IA e salvataggio
              archivio vengono fermati dalla barriera no-write.
            </p>
          </div>
          <div className="cisterna-ia-actions">
            <button type="button" onClick={() => navigate(`/next/cisterna?month=${encodeURIComponent(fallbackYearMonth)}`)}>
              Vai a Cisterna
            </button>
            <button type="button" onClick={() => navigate("/next/ia")}>
              Torna a IA
            </button>
          </div>
        </header>

        <section className="cisterna-ia-card">
          <h2>Fatture e Bollettini</h2>
          <label className="cisterna-ia-field">
            <span>File documento (PDF o immagine)</span>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFile}
              disabled={loading || saving}
            />
          </label>

          {selectedFile ? (
            <div className="cisterna-ia-preview">
              {previewUrl ? (
                <img src={previewUrl} alt={selectedFile.name} />
              ) : (
                <div className="cisterna-ia-preview-file">
                  <strong>{selectedFile.name}</strong>
                  <span>Anteprima immagine non disponibile (file PDF o non immagine).</span>
                </div>
              )}
            </div>
          ) : null}

          <div className="cisterna-ia-row">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!selectedFile || loading || saving}
            >
              {loading ? "Analisi in corso..." : "Analizza documento (IA)"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!form || loading || saving}
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

        {form ? (
          <section className="cisterna-ia-card">
            <div className="cisterna-ia-result-head">
              <h2>Risultato estrazione</h2>
              <span className={`cisterna-ia-badge ${statusClass}`}>{statusLabel}</span>
            </div>

            <div className="cisterna-ia-form-grid">
              <label className="cisterna-ia-field">
                <span>Tipo documento</span>
                <select
                  value={form.tipoDocumento}
                  onChange={(event) =>
                    handleFormChange(
                      "tipoDocumento",
                      event.target.value as DocumentoForm["tipoDocumento"],
                    )
                  }
                >
                  <option value="fattura">Fattura</option>
                  <option value="bollettino">Bollettino / DAS</option>
                </select>
              </label>

              <label className="cisterna-ia-field">
                <span>Data documento</span>
                <input
                  value={form.dataDocumento}
                  onChange={(event) => handleFormChange("dataDocumento", event.target.value)}
                  placeholder="gg/mm/aaaa"
                />
              </label>

              <label className="cisterna-ia-field">
                <span>Litri totali</span>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  value={form.litriTotali}
                  onChange={(event) => handleFormChange("litriTotali", event.target.value)}
                />
              </label>

              <label className="cisterna-ia-field">
                <span>Totale documento</span>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  value={form.totaleDocumento}
                  onChange={(event) => handleFormChange("totaleDocumento", event.target.value)}
                />
              </label>

              <label className="cisterna-ia-field">
                <span>Valuta</span>
                <select
                  value={form.valuta}
                  onChange={(event) =>
                    handleFormChange("valuta", event.target.value as DocumentoForm["valuta"])
                  }
                >
                  <option value="">Non definita</option>
                  <option value="EUR">EUR</option>
                  <option value="CHF">CHF</option>
                </select>
              </label>

              <label className="cisterna-ia-field">
                <span>Numero documento</span>
                <input
                  value={form.numeroDocumento}
                  onChange={(event) => handleFormChange("numeroDocumento", event.target.value)}
                />
              </label>

              <label className="cisterna-ia-field">
                <span>Fornitore</span>
                <input
                  value={form.fornitore}
                  onChange={(event) => handleFormChange("fornitore", event.target.value)}
                />
              </label>

              <label className="cisterna-ia-field">
                <span>Destinatario</span>
                <input
                  value={form.destinatario}
                  onChange={(event) => handleFormChange("destinatario", event.target.value)}
                />
              </label>

              <label className="cisterna-ia-field">
                <span>Prodotto</span>
                <input
                  value={form.prodotto}
                  onChange={(event) => handleFormChange("prodotto", event.target.value)}
                />
              </label>
            </div>

            <label className="cisterna-ia-field">
              <span>Testo estratto (opzionale)</span>
              <textarea
                rows={4}
                value={form.testo}
                onChange={(event) => handleFormChange("testo", event.target.value)}
              />
            </label>

            <div className="cisterna-ia-review">
              <label>
                <input
                  type="checkbox"
                  checked={form.daVerificare}
                  onChange={(event) => handleFormChange("daVerificare", event.target.checked)}
                />
                <span>Marca come da verificare</span>
              </label>
            </div>

            <label className="cisterna-ia-field">
              <span>Motivo verifica</span>
              <input
                value={form.motivoVerifica}
                onChange={(event) => handleFormChange("motivoVerifica", event.target.value)}
                placeholder="Es. data poco leggibile"
              />
            </label>
          </section>
        ) : null}
      </div>
    </div>
  );
}
