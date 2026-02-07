import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Cropper, { type Area } from "react-easy-crop";
import { db, storage } from "../../firebase";
import {
  CISTERNA_SCHEDE_COLLECTION,
  monthKeyFromDate,
} from "../../cisterna/collections";
import { callEstrattiSchedaCisterna } from "../../cisterna/iaClient";
import type {
  CisternaSchedaExtractResult,
  CisternaSchedaRow,
} from "../../cisterna/types";
import "./CisternaSchedeTest.css";

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_");
}

function formatNumber(value: number | null): string {
  if (value == null) return "-";
  return Number.isFinite(value) ? value.toString() : "-";
}

function isLowConfidence(row: CisternaSchedaRow, field: string): boolean {
  return row.fieldFlags?.[field] === "LOW_CONFIDENCE";
}

function cellClass(row: CisternaSchedaRow, field: string): string {
  return isLowConfidence(row, field) ? "cisterna-schede-cell-low" : "";
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Impossibile creare il canvas per il ritaglio.");
  }
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Impossibile creare il ritaglio."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

export default function CisternaSchedeTest() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [results, setResults] = useState<CisternaSchedaExtractResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [inputKey, setInputKey] = useState<number>(Date.now());
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropSaving, setCropSaving] = useState(false);
  const [cropError, setCropError] = useState<string>("");

  const d = (results ?? {}) as any;
  const tsvLines = Array.isArray(d.tsv_lines) ? d.tsv_lines : [];
  const rawLines = Array.isArray(d.raw_lines)
    ? d.raw_lines
    : tsvLines.length > 0
    ? tsvLines
    : Array.isArray(d.lines)
    ? d.lines
    : [];
  const rowsExtracted = d.rowsExtracted ?? d.summary?.rowsExtracted ?? rawLines.length ?? 0;
  const rowsProblematic =
    d.rowsProblematic ?? d.rowsWithIssues ?? d.summary?.rowsWithIssues ?? 0;
  const needsReview = d.needsReview ?? d.summary?.needsReview ?? (d.reviewRequired ?? false);
  const notes = d.notes ?? "";
  const structuredRows: CisternaSchedaRow[] = Array.isArray(d.rows) ? d.rows : [];
  const hasStructuredTable = Array.isArray(d.rows);
  type TsvRow = {
    data: string;
    ora: string;
    targa: string;
    contIni: string;
    litri: string;
    contFin: string;
    autista: string;
  };

  const tsvRows: TsvRow[] = tsvLines
    .filter((line: unknown) => typeof line === "string" && String(line).trim() !== "")
    .filter((line: string) => !line.toUpperCase().startsWith("DATA\tORA\tTARGA"))
    .map((line: string) => {
      const parts = line.split("\t");
      const padded = [...parts, "", "", "", "", "", "", ""].slice(0, 7);
      return {
        data: padded[0] || "-",
        ora: padded[1] || "-",
        targa: padded[2] || "-",
        contIni: padded[3] || "-",
        litri: padded[4] || "-",
        contFin: padded[5] || "-",
        autista: padded[6] || "-",
      };
    });
  const hasTsvTable = tsvRows.length > 0;

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResults(null);
    setFileUrl(null);
    setSavedId("");
    setError("");
    setCropError("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (croppedPreview) {
      URL.revokeObjectURL(croppedPreview);
      setCroppedPreview(null);
    }

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setError("Seleziona una foto prima di estrarre.");
      return;
    }
    if (!fileUrl) {
      setError("Salva un ritaglio prima di estrarre.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);
    setSavedId("");

    try {
      const extracted = await callEstrattiSchedaCisterna(fileUrl);
      setResults(extracted);
    } catch (err: any) {
      setError(err?.message || "Errore estrazione scheda cisterna.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!results || !fileUrl) {
      setError("Esegui prima l'estrazione.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        fileUrl,
        nomeFile: selectedFile?.name ?? null,
        createdAt: serverTimestamp(),
        fonte: "IA",
        mode: results.mode,
        rows: results.rows,
        needsReview: results.needsReview,
        summary: results.summary,
        mese: monthKeyFromDate(new Date()),
      };

      const savedRef = await addDoc(
        collection(db, CISTERNA_SCHEDE_COLLECTION),
        payload
      );

      setSavedId(savedRef.id);
    } catch (err: any) {
      setError(err?.message || "Errore salvataggio scheda.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    if (croppedPreview) {
      URL.revokeObjectURL(croppedPreview);
    }
    setCroppedPreview(null);
    setFileUrl(null);
    setResults(null);
    setSavedId("");
    setError("");
    setCropError("");
    setInputKey(Date.now());
  };

  const handleSaveCrop = async () => {
    if (!preview || !croppedAreaPixels || !selectedFile) {
      setCropError("Seleziona un'area di ritaglio prima di salvare.");
      return;
    }

    setCropSaving(true);
    setCropError("");

    try {
      const blob = await getCroppedBlob(preview, croppedAreaPixels);
      const now = new Date();
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const safeName = sanitizeFileName(selectedFile.name || "scheda");
      const path = `documenti_pdf/cisterna_schede/${yyyy}/${mm}/${Date.now()}_${safeName}_crop.jpg`;
      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
      const downloadUrl = await getDownloadURL(storageRef);
      setFileUrl(downloadUrl);

      if (croppedPreview) {
        URL.revokeObjectURL(croppedPreview);
      }
      setCroppedPreview(URL.createObjectURL(blob));
    } catch (err: any) {
      setCropError(err?.message || "Errore salvataggio ritaglio.");
    } finally {
      setCropSaving(false);
    }
  };

  return (
    <div className="cisterna-schede-page">
      <div className="cisterna-schede-shell">
        <header className="cisterna-schede-head">
          <div>
            <h1>Schede Cisterna (IA)</h1>
            <p>
              Test dedicato: estrazione delle ultime 10 righe da scheda cartacea.
            </p>
          </div>
          <div className="cisterna-schede-actions">
            <button type="button" onClick={() => navigate("/cisterna")}>
              Torna a Cisterna
            </button>
            <button type="button" onClick={() => navigate("/cisterna/ia")}>
              IA Cisterna
            </button>
          </div>
        </header>

        <section className="cisterna-schede-card">
          <label className="cisterna-schede-field">
            <span>Foto scheda cartacea</span>
            <input
              key={inputKey}
              type="file"
              accept="image/*"
              onChange={handleFile}
              disabled={loading || saving}
            />
          </label>

          <div className="cisterna-schede-row">
            <button
              type="button"
              onClick={handleExtract}
              disabled={!selectedFile || !fileUrl || loading || saving || cropSaving}
            >
              {loading ? "Estrazione in corso..." : "Estrai da ritaglio"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!results || !fileUrl || loading || saving}
            >
              {saving ? "Salvataggio..." : "Conferma e salva"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={handleReset}
              disabled={loading || saving}
            >
              Annulla
            </button>
          </div>

          {error ? <div className="cisterna-schede-error">{error}</div> : null}
          {savedId ? (
            <div className="cisterna-schede-ok">
              Scheda salvata con id: <strong>{savedId}</strong>
            </div>
          ) : null}

          {preview ? (
            <div className="cisterna-schede-crop">
              <div className="cisterna-schede-cropper">
                <Cropper
                  image={preview}
                  crop={crop}
                  zoom={zoom}
                  aspect={3 / 1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                />
              </div>
              <div className="cisterna-schede-crop-controls">
                <label className="cisterna-schede-zoom">
                  Zoom
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  disabled={cropSaving || loading || saving}
                >
                  {cropSaving ? "Salvataggio ritaglio..." : "Salva ritaglio"}
                </button>
              </div>
              {cropError ? (
                <div className="cisterna-schede-error">{cropError}</div>
              ) : null}
              {croppedPreview ? (
                <div className="cisterna-schede-preview">
                  <img src={croppedPreview} alt="Preview ritaglio" />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {results ? (
          <section className="cisterna-schede-card">
            <div className="cisterna-schede-summary">
              <div>
                <strong>Righe estratte</strong>
                <span>{rowsExtracted}</span>
              </div>
              <div>
                <strong>Righe con problemi</strong>
                <span>{rowsProblematic}</span>
              </div>
              <div>
                <strong>Revisione richiesta</strong>
                <span>{needsReview ? "Si" : "No"}</span>
              </div>
            </div>

            {hasTsvTable ? (
              <div className="cisterna-schede-table-wrap">
                <table className="cisterna-schede-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Ora</th>
                      <th>Targa</th>
                      <th>Contatore iniziale</th>
                      <th>Litri</th>
                      <th>Contatore finale</th>
                      <th>Autista</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tsvRows.map((row, index) => (
                      <tr key={`tsv-${index}`}>
                        <td>{row.data}</td>
                        <td>{row.ora}</td>
                        <td>{row.targa}</td>
                        <td>{row.contIni}</td>
                        <td>{row.litri}</td>
                        <td>{row.contFin}</td>
                        <td>{row.autista}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {hasStructuredTable ? (
              <div className="cisterna-schede-table-wrap">
                <table className="cisterna-schede-table">
                  <thead>
                    <tr>
                      <th>Riga</th>
                      <th>Data</th>
                      <th>Ora</th>
                      <th>Targa</th>
                      <th>Litri</th>
                      <th>Contatore</th>
                      <th>Autista</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structuredRows.length === 0 ? (
                      <tr>
                        <td colSpan={8}>Nessuna riga trovata.</td>
                      </tr>
                    ) : (
                      structuredRows.map((row, index) => (
                        <Fragment key={`${row.rowIndexFromTop ?? "row"}-${index}`}>
                          {row.separatorBefore ? (
                            <tr className="cisterna-schede-separator">
                              <td colSpan={8}>
                                {row.data ? `Cambio data: ${row.data}` : "Cambio data"}
                              </td>
                            </tr>
                          ) : null}
                          <tr>
                            <td>{row.rowIndexFromTop ?? "-"}</td>
                            <td className={cellClass(row, "data")}>
                              {row.data ?? "-"}
                            </td>
                            <td>{row.ora ?? "-"}</td>
                            <td className={cellClass(row, "targa")}>
                              {row.targa ?? "-"}
                            </td>
                            <td className={cellClass(row, "litriErogati")}>
                              {formatNumber(row.litriErogati)}
                            </td>
                            <td className={cellClass(row, "contatore")}>
                              {formatNumber(row.contatore)}
                            </td>
                            <td>{row.autistaNome ?? "-"}</td>
                            <td className="cisterna-schede-raw">
                              {row.rawText ?? "-"}
                            </td>
                          </tr>
                        </Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}

            {rawLines.length > 0 ? (
              <div className="cisterna-schede-rawblock">
                <h3>Righe trascritte (RAW)</h3>
                <div>
                  {rawLines.map((line: string, index: number) => (
                    <Fragment key={`raw-${index}`}>
                      <div>{line || "-"}</div>
                      {index < rawLines.length - 1 ? <hr /> : null}
                    </Fragment>
                  ))}
                </div>
                {notes ? <div>Note: {notes}</div> : null}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}

