import { useEffect, useMemo, useState } from "react";
import {
  readNextFornitoriSnapshot,
  type NextFornitoreReadOnlyItem,
} from "./domain/nextFornitoriDomain";
import { readNextProcurementSnapshot } from "./domain/nextProcurementDomain";
import {
  extractPreventivoIaFromImages,
  extractPreventivoIaFromPdf,
  PreventivoIaClientError,
} from "./nextPreventivoIaClient";
import {
  computeRowAnalysis,
  extractDateToInputValue,
  mapExtractedRowsToReviewItems,
  normalizeExtractCurrency,
  resolveFornitoreFromExtract,
  type PreventivoPriceExtractResult,
  type ReviewRow,
} from "./nextPreventivoIaHelpers";
import { saveAndUpsert, type Valuta } from "./nextPreventivoManualeWriter";

type UploadMode = "pdf" | "images";
type ModalStep = "upload" | "review";

type ReviewValidationState = {
  fornitoreId?: string;
  numeroPreventivo?: string;
  dataPreventivo?: string;
  righe?: string;
  rows: Array<{
    descrizione?: string;
    unita?: string;
    prezzoUnitario?: string;
  }>;
};

const emptyValidationState = (): ReviewValidationState => ({
  rows: [],
});

function buildLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildEmptyReviewRow(): ReviewRow {
  return {
    id: buildLocalId("preventivo-ia-manual-row"),
    descrizione: "",
    codiceArticolo: "",
    unita: "",
    prezzoUnitario: "",
    note: "",
  };
}

function fieldStyle(hasError: boolean) {
  if (!hasError) return undefined;
  return { borderColor: "#b42318" };
}

function readGenericErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : fallback;
}

function parsePriceValue(value: string) {
  const normalized = String(value || "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildReviewValidationState(args: {
  fornitoreId: string;
  numeroPreventivo: string;
  dataPreventivo: string;
  rows: ReviewRow[];
}): ReviewValidationState {
  const next = emptyValidationState();

  if (!String(args.fornitoreId || "").trim()) {
    next.fornitoreId = "Seleziona un fornitore.";
  }
  if (!String(args.numeroPreventivo || "").trim()) {
    next.numeroPreventivo = "Inserisci il numero preventivo.";
  }
  if (!String(args.dataPreventivo || "").trim()) {
    next.dataPreventivo = "Inserisci la data preventivo.";
  }
  if (args.rows.length === 0) {
    next.righe = "Inserisci almeno una riga articolo.";
  }

  next.rows = args.rows.map((row) => {
    const rowErrors: ReviewValidationState["rows"][number] = {};
    if (!String(row.descrizione || "").trim()) {
      rowErrors.descrizione = "Inserisci la descrizione.";
    }
    if (!String(row.unita || "").trim()) {
      rowErrors.unita = "Inserisci l'unità.";
    }
    const prezzo = parsePriceValue(row.prezzoUnitario);
    if (prezzo === null || prezzo <= 0) {
      rowErrors.prezzoUnitario = "Inserisci un prezzo unitario valido.";
    }
    return rowErrors;
  });

  return next;
}

function hasValidationErrors(validationState: ReviewValidationState) {
  if (
    validationState.fornitoreId ||
    validationState.numeroPreventivo ||
    validationState.dataPreventivo ||
    validationState.righe
  ) {
    return true;
  }

  return validationState.rows.some(
    (row) => row.descrizione || row.unita || row.prezzoUnitario,
  );
}

function formatAnalysisStatus(status: "NUOVO" | "GIA_ESISTE_CODICE" | "GIA_ESISTE_DESCRIZIONE") {
  if (status === "GIA_ESISTE_CODICE") return "GIA ESISTE (codice)";
  if (status === "GIA_ESISTE_DESCRIZIONE") return "GIA ESISTE (descrizione)";
  return "NUOVO";
}

function formatDeltaLabel(delta: number | null) {
  if (delta === null) return "—";
  if (delta > 0) return `+${delta.toFixed(2)}`;
  if (delta < 0) return delta.toFixed(2);
  return "=0.00";
}

function formatSelectedFileLabel(file: File) {
  return `${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)`;
}

export default function NextPreventivoIaModal({
  open,
  onClose,
  onPreventivoSaved,
}: {
  open: boolean;
  onClose: () => void;
  onPreventivoSaved: () => void | Promise<void>;
}) {
  const [step, setStep] = useState<ModalStep>("upload");
  const [uploadMode, setUploadMode] = useState<UploadMode>("pdf");
  const [fornitori, setFornitori] = useState<NextFornitoreReadOnlyItem[]>([]);
  const [fornitoriLoading, setFornitoriLoading] = useState(false);
  const [fornitoriError, setFornitoriError] = useState<string | null>(null);
  const [listino, setListino] = useState<Awaited<ReturnType<typeof readNextProcurementSnapshot>>["listino"]>([]);
  const [procurementError, setProcurementError] = useState<string | null>(null);
  const [fornitoreId, setFornitoreId] = useState("");
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [numeroPreventivo, setNumeroPreventivo] = useState("");
  const [dataPreventivo, setDataPreventivo] = useState("");
  const [valuta, setValuta] = useState<Valuta>("CHF");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<PreventivoPriceExtractResult | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<ReviewValidationState>(emptyValidationState);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setStep("upload");
    setUploadMode("pdf");
    setFornitoreId("");
    setSelectedPdf(null);
    setSelectedImages([]);
    setNumeroPreventivo("");
    setDataPreventivo("");
    setValuta("CHF");
    setRows([]);
    setEditingRowId(null);
    setExtractedResult(null);
    setExtractionError(null);
    setSubmitError(null);
    setValidationState(emptyValidationState());

    let cancelled = false;

    const loadDependencies = async () => {
      try {
        setFornitoriLoading(true);
        setFornitoriError(null);
        const [fornitoriSnapshot, procurementSnapshot] = await Promise.all([
          readNextFornitoriSnapshot({ includeCloneOverlays: false }),
          readNextProcurementSnapshot({ includeCloneOverlays: false }),
        ]);
        if (cancelled) return;
        setFornitori(fornitoriSnapshot.items);
        setListino(procurementSnapshot.listino);
        setProcurementError(null);
      } catch (error) {
        if (cancelled) return;
        setFornitori([]);
        setListino([]);
        setFornitoriError(readGenericErrorMessage(error, "Errore durante il caricamento dei fornitori."));
        setProcurementError(readGenericErrorMessage(error, "Snapshot procurement clone non disponibile."));
      } finally {
        if (!cancelled) {
          setFornitoriLoading(false);
        }
      }
    };

    void loadDependencies();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (step !== "review") return;
    if (String(fornitoreId || "").trim()) return;
    if (!extractedResult?.supplier?.name) return;
    if (fornitori.length === 0) return;

    const matchedId = resolveFornitoreFromExtract(
      extractedResult.supplier.name,
      fornitori,
    );
    if (matchedId) {
      setFornitoreId(matchedId);
    }
  }, [extractedResult, fornitoreId, fornitori, step]);

  const analysisByRowId = useMemo(() => {
    const analysis = computeRowAnalysis(rows, fornitoreId || null, listino, valuta);
    return new Map(analysis.map((entry) => [entry.rowId, entry]));
  }, [fornitoreId, listino, rows, valuta]);

  if (!open) return null;

  const busy = extracting || saving;

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const handleUploadModeChange = (nextMode: UploadMode) => {
    if (busy) return;
    setUploadMode(nextMode);
    setSelectedPdf(null);
    setSelectedImages([]);
    setExtractionError(null);
  };

  const handlePdfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    setSelectedPdf(file);
    setExtractionError(null);
    event.currentTarget.value = "";
  };

  const handleImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) return;
    const nextImages = [...selectedImages, ...files].slice(0, 10);
    setSelectedImages(nextImages);
    setExtractionError(
      files.length + selectedImages.length > 10
        ? "Puoi caricare al massimo 10 immagini."
        : null,
    );
  };

  const handleRunExtraction = async () => {
    if (busy) return;
    if (uploadMode === "pdf" && !selectedPdf) return;
    if (uploadMode === "images" && selectedImages.length === 0) return;

    setExtracting(true);
    setExtractionError(null);
    setSubmitError(null);

    try {
      const result =
        uploadMode === "pdf" && selectedPdf
          ? await extractPreventivoIaFromPdf(selectedPdf, selectedPdf.name)
          : await extractPreventivoIaFromImages(selectedImages, selectedImages[0]?.name);
      const matchedFornitoreId =
        String(fornitoreId || "").trim() ||
        resolveFornitoreFromExtract(result.supplier.name, fornitori) ||
        "";
      const mappedRows = mapExtractedRowsToReviewItems(result);

      setExtractedResult(result);
      setStep("review");
      setFornitoreId(matchedFornitoreId);
      setNumeroPreventivo(String(result.document.number || "").trim());
      setDataPreventivo(extractDateToInputValue(result.document.date));
      setValuta(normalizeExtractCurrency(result.document.currency) ?? "CHF");
      setRows(mappedRows);
      setEditingRowId(mappedRows[0]?.id ?? null);
      setValidationState(emptyValidationState());
    } catch (error) {
      if (error instanceof PreventivoIaClientError) {
        setExtractionError(error.message);
      } else {
        setExtractionError("Estrazione IA non riuscita. Verifica file e riprova.");
      }
    } finally {
      setExtracting(false);
    }
  };

  const updateRow = (rowId: string, updater: (row: ReviewRow) => ReviewRow) => {
    setRows((current) =>
      current.map((row) => (row.id === rowId ? updater(row) : row)),
    );
    setValidationState((current) => ({
      ...current,
      righe: undefined,
      rows: [],
    }));
  };

  const handleDeleteRow = (rowId: string) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
    setEditingRowId((current) => (current === rowId ? null : current));
    setValidationState((current) => ({
      ...current,
      righe: undefined,
      rows: [],
    }));
  };

  const handleAddRow = () => {
    const nextRow = buildEmptyReviewRow();
    setRows((current) => [...current, nextRow]);
    setEditingRowId(nextRow.id);
    setValidationState((current) => ({
      ...current,
      righe: undefined,
      rows: [],
    }));
  };

  const handleSave = async () => {
    const nextValidationState = buildReviewValidationState({
      fornitoreId,
      numeroPreventivo,
      dataPreventivo,
      rows,
    });
    setValidationState(nextValidationState);
    setSubmitError(null);

    if (hasValidationErrors(nextValidationState)) {
      return;
    }

    const selectedFornitore = fornitori.find((item) => item.id === fornitoreId);
    if (!selectedFornitore) {
      setValidationState((current) => ({
        ...current,
        fornitoreId: "Seleziona un fornitore.",
      }));
      return;
    }

    setSaving(true);
    try {
      await saveAndUpsert({
        testata: {
          fornitoreId: selectedFornitore.id,
          fornitoreNome: selectedFornitore.nome,
          numeroPreventivo: numeroPreventivo.trim(),
          dataPreventivo,
        },
        righe: rows.map((row) => ({
          descrizione: row.descrizione.trim(),
          codiceArticolo: row.codiceArticolo.trim() || undefined,
          unita: row.unita.trim(),
          prezzoUnitario: parsePriceValue(row.prezzoUnitario) ?? 0,
          note: row.note.trim() || undefined,
        })),
        valuta,
        foto: uploadMode === "images" ? selectedImages : [],
        pdfFile: uploadMode === "pdf" ? selectedPdf : null,
        imageStoragePrefix: "preventivi/ia/",
        fonteAttualeUsesPreventivoPdf: true,
      });
      await onPreventivoSaved();
      onClose();
    } catch (error) {
      const message = readGenericErrorMessage(
        error,
        "Errore durante il salvataggio del preventivo.",
      );
      setSubmitError(message);
      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  const uploadStepReady =
    (uploadMode === "pdf" && Boolean(selectedPdf)) ||
    (uploadMode === "images" && selectedImages.length > 0);

  return (
    <div
      className="acq-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Estrazione preventivo con IA"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className="acq-modal-card"
        style={{
          width: "min(1120px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 32px)",
          overflow: "auto",
          position: "relative",
        }}
      >
        {busy ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255, 255, 255, 0.72)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              textAlign: "center",
              fontWeight: 700,
            }}
          >
            {extracting ? "Estrazione IA in corso..." : "Salvataggio in corso..."}
          </div>
        ) : null}

        <div className="acq-link-foto-head">
          <div>
            <h4>Estrazione preventivo con IA</h4>
            <p className="acq-prev-draft-meta">
              {step === "upload"
                ? "Carica un PDF o fino a 10 immagini e avvia l'estrazione."
                : "Controlla i dati estratti, correggi le righe e salva."}
            </p>
          </div>
          <button
            type="button"
            className="acq-btn acq-btn--small"
            onClick={handleClose}
            aria-label="Chiudi"
            disabled={busy}
          >
            ×
          </button>
        </div>

        {fornitoriError ? <div className="acq-list-error">{fornitoriError}</div> : null}
        {procurementError ? <div className="acq-list-error">{procurementError}</div> : null}
        {extractionError ? <div className="acq-list-error">{extractionError}</div> : null}
        {submitError ? <div className="acq-list-error">{submitError}</div> : null}

        <div style={{ display: "grid", gap: 16 }}>
          <div className="acq-modal-grid">
            <label className="acq-prev-field">
              <span>Fornitore</span>
              <select
                value={fornitoreId}
                onChange={(event) => {
                  setFornitoreId(event.target.value);
                  setValidationState((current) => ({ ...current, fornitoreId: undefined }));
                }}
                disabled={fornitoriLoading || busy}
                style={fieldStyle(Boolean(validationState.fornitoreId))}
              >
                <option value="">{fornitoriLoading ? "Caricamento..." : "Seleziona"}</option>
                {fornitori.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
              {validationState.fornitoreId ? (
                <small style={{ color: "#b42318" }}>{validationState.fornitoreId}</small>
              ) : null}
            </label>

            {step === "review" ? (
              <>
                <label className="acq-prev-field">
                  <span>Numero preventivo</span>
                  <input
                    type="text"
                    value={numeroPreventivo}
                    onChange={(event) => {
                      setNumeroPreventivo(event.target.value);
                      setValidationState((current) => ({ ...current, numeroPreventivo: undefined }));
                    }}
                    disabled={busy}
                    style={fieldStyle(Boolean(validationState.numeroPreventivo))}
                  />
                  {validationState.numeroPreventivo ? (
                    <small style={{ color: "#b42318" }}>{validationState.numeroPreventivo}</small>
                  ) : null}
                </label>

                <label className="acq-prev-field">
                  <span>Data preventivo</span>
                  <input
                    type="date"
                    value={dataPreventivo}
                    onChange={(event) => {
                      setDataPreventivo(event.target.value);
                      setValidationState((current) => ({ ...current, dataPreventivo: undefined }));
                    }}
                    disabled={busy}
                    style={fieldStyle(Boolean(validationState.dataPreventivo))}
                  />
                  {validationState.dataPreventivo ? (
                    <small style={{ color: "#b42318" }}>{validationState.dataPreventivo}</small>
                  ) : null}
                </label>

                <label className="acq-prev-field">
                  <span>Valuta</span>
                  <select
                    value={valuta}
                    onChange={(event) => setValuta(event.target.value as Valuta)}
                    disabled={busy}
                  >
                    <option value="CHF">CHF</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
              </>
            ) : null}
          </div>

          {step === "upload" ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="radio"
                    checked={uploadMode === "pdf"}
                    onChange={() => handleUploadModeChange("pdf")}
                    disabled={busy}
                  />
                  PDF
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="radio"
                    checked={uploadMode === "images"}
                    onChange={() => handleUploadModeChange("images")}
                    disabled={busy}
                  />
                  Immagini (max 10)
                </label>
              </div>

              <label className="acq-prev-field">
                <span>{uploadMode === "pdf" ? "Seleziona PDF" : "Seleziona immagini"}</span>
                <input
                  type="file"
                  accept={uploadMode === "pdf" ? "application/pdf" : "image/*"}
                  multiple={uploadMode === "images"}
                  onChange={uploadMode === "pdf" ? handlePdfChange : handleImagesChange}
                  disabled={busy}
                />
              </label>

              {uploadMode === "pdf" && selectedPdf ? (
                <div className="acq-prev-card" style={{ padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span>{formatSelectedFileLabel(selectedPdf)}</span>
                    <button
                      type="button"
                      className="acq-btn acq-btn--small"
                      onClick={() => setSelectedPdf(null)}
                      disabled={busy}
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              ) : null}

              {uploadMode === "images" && selectedImages.length > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {selectedImages.map((image, index) => (
                    <div key={`${image.name}-${index}`} className="acq-prev-card" style={{ padding: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span>{formatSelectedFileLabel(image)}</span>
                        <button
                          type="button"
                          className="acq-btn acq-btn--small"
                          onClick={() =>
                            setSelectedImages((current) =>
                              current.filter((_, currentIndex) => currentIndex !== index),
                            )
                          }
                          disabled={busy}
                        >
                          Rimuovi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="acq-prev-actions">
                <button
                  type="button"
                  className="acq-btn"
                  onClick={handleClose}
                  disabled={busy}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="acq-btn acq-btn--primary"
                  onClick={handleRunExtraction}
                  disabled={busy || !uploadStepReady}
                >
                  Esegui estrazione IA
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <div className="acq-prev-table-wrap">
                <table className="acq-prev-table">
                  <thead>
                    <tr>
                      <th>Descrizione</th>
                      <th>Codice articolo</th>
                      <th>Unità</th>
                      <th>Prezzo unitario</th>
                      <th>Stato</th>
                      <th>Delta</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          Nessuna riga valida estratta. Aggiungi almeno una riga manuale.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, index) => {
                        const analysis = analysisByRowId.get(row.id);
                        const isEditing = editingRowId === row.id;
                        return (
                          <tr key={row.id}>
                            <td>
                              {isEditing ? (
                                <>
                                  <input
                                    type="text"
                                    value={row.descrizione}
                                    onChange={(event) =>
                                      updateRow(row.id, (current) => ({
                                        ...current,
                                        descrizione: event.target.value,
                                      }))
                                    }
                                    disabled={busy}
                                    style={fieldStyle(Boolean(validationState.rows[index]?.descrizione))}
                                  />
                                  <input
                                    type="text"
                                    value={row.note}
                                    onChange={(event) =>
                                      updateRow(row.id, (current) => ({
                                        ...current,
                                        note: event.target.value,
                                      }))
                                    }
                                    disabled={busy}
                                    placeholder="Note"
                                    style={{ marginTop: 6 }}
                                  />
                                  {validationState.rows[index]?.descrizione ? (
                                    <small style={{ color: "#b42318" }}>
                                      {validationState.rows[index]?.descrizione}
                                    </small>
                                  ) : null}
                                </>
                              ) : (
                                <div style={{ display: "grid", gap: 4 }}>
                                  <span>{row.descrizione || "-"}</span>
                                  {row.note ? (
                                    <small style={{ color: "#667085" }}>{row.note}</small>
                                  ) : null}
                                </div>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={row.codiceArticolo}
                                  onChange={(event) =>
                                    updateRow(row.id, (current) => ({
                                      ...current,
                                      codiceArticolo: event.target.value,
                                    }))
                                  }
                                  disabled={busy}
                                />
                              ) : (
                                row.codiceArticolo || "-"
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <>
                                  <input
                                    type="text"
                                    value={row.unita}
                                    onChange={(event) =>
                                      updateRow(row.id, (current) => ({
                                        ...current,
                                        unita: event.target.value,
                                      }))
                                    }
                                    disabled={busy}
                                    style={fieldStyle(Boolean(validationState.rows[index]?.unita))}
                                  />
                                  {validationState.rows[index]?.unita ? (
                                    <small style={{ color: "#b42318" }}>
                                      {validationState.rows[index]?.unita}
                                    </small>
                                  ) : null}
                                </>
                              ) : (
                                row.unita || "-"
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <>
                                  <input
                                    type="text"
                                    value={row.prezzoUnitario}
                                    onChange={(event) =>
                                      updateRow(row.id, (current) => ({
                                        ...current,
                                        prezzoUnitario: event.target.value,
                                      }))
                                    }
                                    disabled={busy}
                                    style={fieldStyle(Boolean(validationState.rows[index]?.prezzoUnitario))}
                                  />
                                  {validationState.rows[index]?.prezzoUnitario ? (
                                    <small style={{ color: "#b42318" }}>
                                      {validationState.rows[index]?.prezzoUnitario}
                                    </small>
                                  ) : null}
                                </>
                              ) : (
                                row.prezzoUnitario || "-"
                              )}
                            </td>
                            <td>
                              {analysis ? (
                                <span className="acq-pill is-warn">
                                  {formatAnalysisStatus(analysis.status)}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {analysis ? (
                                <div style={{ display: "grid", gap: 4 }}>
                                  <span>{formatDeltaLabel(analysis.delta)}</span>
                                  {analysis.referenceLabel && analysis.previousPrice !== null ? (
                                    <small style={{ color: "#667085" }}>
                                      {analysis.previousPrice.toFixed(2)}
                                      {analysis.previousCurrency ? ` ${analysis.previousCurrency}` : ""}
                                      {` · ${analysis.referenceLabel}`}
                                    </small>
                                  ) : null}
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <div className="acq-prev-actions" style={{ justifyContent: "flex-start" }}>
                                <button
                                  type="button"
                                  className="acq-btn acq-btn--small"
                                  onClick={() =>
                                    setEditingRowId((current) =>
                                      current === row.id ? null : row.id,
                                    )
                                  }
                                  disabled={busy}
                                >
                                  {isEditing ? "Fine" : "Modifica"}
                                </button>
                                <button
                                  type="button"
                                  className="acq-btn acq-btn--small"
                                  onClick={() => handleDeleteRow(row.id)}
                                  disabled={busy}
                                >
                                  Elimina
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {validationState.righe ? (
                <div className="acq-list-error">{validationState.righe}</div>
              ) : null}

              <div className="acq-prev-actions">
                <button
                  type="button"
                  className="acq-btn"
                  onClick={handleAddRow}
                  disabled={busy}
                >
                  Aggiungi riga
                </button>
              </div>

              <div className="acq-prev-actions">
                <button
                  type="button"
                  className="acq-btn"
                  onClick={handleClose}
                  disabled={busy}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="acq-btn acq-btn--primary"
                  onClick={handleSave}
                  disabled={busy}
                >
                  Salva preventivo e aggiorna listino
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
