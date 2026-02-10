import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../../firebase";
import {
  CISTERNA_DOCUMENTI_COLLECTION,
  currentMonthKey,
} from "../../cisterna/collections";
import { extractCisternaDocumento } from "../../cisterna/iaClient";
import type { CisternaDocumentoExtractData } from "../../cisterna/types";
import "./CisternaCaravateIA.css";

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

const DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const YEAR_MONTH_REGEX = /^(\d{4})-(\d{2})$/;

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, "_");
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function sanitizeForFirestore<T>(value: T, inArray = false): T {
  if (value === undefined) {
    return (inArray ? null : undefined) as T;
  }
  if (value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item, true)) as T;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    Object.entries(obj).forEach(([key, val]) => {
      const cleaned = sanitizeForFirestore(val, false);
      if (cleaned !== undefined) {
        next[key] = cleaned;
      }
    });
    return next as T;
  }
  return value;
}

function parseNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value).trim();
  if (!text) return null;
  const normalized = text
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function normalizeDataDocumento(value: string): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const it = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (it) {
    const day = Number(it[1]);
    const month = Number(it[2]);
    let year = Number(it[3]);
    if (it[3].length === 2) year += 2000;
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return `${pad2(day)}/${pad2(month)}/${year}`;
    }
    return null;
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return `${pad2(day)}/${pad2(month)}/${year}`;
    }
    return null;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function yearMonthFromDataDocumento(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(DATE_REGEX);
  if (!match) return null;
  return `${match[3]}-${match[2]}`;
}

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

function asInputString(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function buildFormFromExtract(data: CisternaDocumentoExtractData): DocumentoForm {
  return {
    tipoDocumento: data.tipoDocumento === "bollettino" ? "bollettino" : "fattura",
    fornitore: String(data.fornitore ?? ""),
    destinatario: String(data.destinatario ?? ""),
    numeroDocumento: String(data.numeroDocumento ?? ""),
    dataDocumento: String(data.dataDocumento ?? ""),
    litriTotali: asInputString(data.litriTotali),
    totaleDocumento: asInputString(data.totaleDocumento),
    valuta: data.valuta ?? "",
    prodotto: String(data.prodotto ?? ""),
    testo: String(data.testo ?? ""),
    daVerificare: Boolean(data.daVerificare),
    motivoVerifica: String(data.motivoVerifica ?? ""),
  };
}

export default function CisternaCaravateIA() {
  const navigate = useNavigate();
  const location = useLocation();
  const monthFromQuery = useMemo(() => {
    const raw = new URLSearchParams(location.search).get("month");
    const value = String(raw ?? "").trim();
    return isValidYearMonth(value) ? value : "";
  }, [location.search]);
  const fallbackYearMonth = monthFromQuery || currentMonthKey();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [storageFileUrl, setStorageFileUrl] = useState<string>("");
  const [storagePath, setStoragePath] = useState<string>("");
  const [form, setForm] = useState<DocumentoForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedDocId, setSavedDocId] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setStorageFileUrl("");
    setStoragePath("");
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
    setForm(null);
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
      setStorageFileUrl(downloadUrl);
      setStoragePath(path);

      const extracted = await extractCisternaDocumento({
        fileUrl: downloadUrl,
        mimeType: selectedFile.type || "application/octet-stream",
        nomeFile: selectedFile.name,
      });

      setForm(buildFormFromExtract(extracted));
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Errore durante analisi IA documento."));
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = <K extends keyof DocumentoForm>(
    key: K,
    value: DocumentoForm[K]
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
    setSavedDocId("");
  };

  const handleSave = async () => {
    if (!form || !storageFileUrl || !selectedFile) {
      setError("Analizza prima il documento.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const normalizedDataDocumento = normalizeDataDocumento(form.dataDocumento);
      const yearMonth =
        yearMonthFromDataDocumento(normalizedDataDocumento) ||
        fallbackYearMonth ||
        currentMonthKey();
      const litriTotali = parseNumberOrNull(form.litriTotali);
      const totaleDocumento = parseNumberOrNull(form.totaleDocumento);
      const valuta = form.valuta || null;

      const autoReasons: string[] = [];
      if (!normalizedDataDocumento) autoReasons.push("data_non_valida");
      if (litriTotali === null) autoReasons.push("litri_non_validi");
      if (!valuta) autoReasons.push("valuta_non_definita");
      if (form.tipoDocumento === "fattura" && totaleDocumento === null) {
        autoReasons.push("totale_non_valido");
      }

      const manualReason = form.motivoVerifica.trim();
      const reasonSet = new Set<string>();
      autoReasons.forEach((reason) => reasonSet.add(reason));
      if (manualReason) {
        reasonSet.add(manualReason);
      }
      const reasons = Array.from(reasonSet);
      const daVerificare = form.daVerificare || reasons.length > 0;

      const payload = sanitizeForFirestore({
        tipoDocumento: form.tipoDocumento,
        fornitore: form.fornitore.trim() || null,
        destinatario: form.destinatario.trim() || null,
        numeroDocumento: form.numeroDocumento.trim() || null,
        dataDocumento: normalizedDataDocumento,
        yearMonth,
        mese: yearMonth,
        litriTotali,
        litri15C: litriTotali,
        totaleDocumento,
        valuta,
        currency: valuta,
        prodotto: form.prodotto.trim() || null,
        testo: form.testo.trim() || null,
        daVerificare,
        motivoVerifica: reasons.length > 0 ? reasons.join(", ") : null,
        fileUrl: storageFileUrl,
        storagePath: storagePath || null,
        nomeFile: selectedFile.name || null,
        fonte: "IA",
        createdAt: serverTimestamp(),
      });

      const savedRef = await addDoc(
        collection(db, CISTERNA_DOCUMENTI_COLLECTION),
        payload
      );
      setSavedDocId(savedRef.id);
    } catch (err: unknown) {
      setError(toErrorMessage(err, "Errore durante il salvataggio."));
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
              disabled={!form || !storageFileUrl || loading || saving}
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
                      event.target.value as DocumentoForm["tipoDocumento"]
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
