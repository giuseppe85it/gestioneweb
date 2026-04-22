import { useEffect, useMemo, useState } from "react";
import { readNextFornitoriSnapshot, type NextFornitoreReadOnlyItem } from "./domain/nextFornitoriDomain";
import { saveAndUpsert, type Valuta } from "./nextPreventivoManualeWriter";

type PreventivoManualeRowFormState = {
  descrizione: string;
  codiceArticolo: string;
  unita: string;
  prezzoUnitario: string;
  note: string;
};

type PreventivoManualeValidationState = {
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

const emptyValidationState = (): PreventivoManualeValidationState => ({
  rows: [],
});

function buildTodayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function buildDefaultNumeroPreventivo() {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}${now.getFullYear()}`;
}

function buildEmptyRow(): PreventivoManualeRowFormState {
  return {
    descrizione: "",
    codiceArticolo: "",
    unita: "",
    prezzoUnitario: "",
    note: "",
  };
}

function readErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Errore durante il caricamento dei fornitori.";
}

function buildValidationState(args: {
  fornitoreId: string;
  numeroPreventivo: string;
  dataPreventivo: string;
  rows: PreventivoManualeRowFormState[];
}): PreventivoManualeValidationState {
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
    const rowErrors: PreventivoManualeValidationState["rows"][number] = {};
    if (!String(row.descrizione || "").trim()) {
      rowErrors.descrizione = "Inserisci la descrizione.";
    }
    if (!String(row.unita || "").trim()) {
      rowErrors.unita = "Inserisci l'unità.";
    }
    const prezzo = Number(String(row.prezzoUnitario || "").replace(",", "."));
    if (!Number.isFinite(prezzo) || prezzo <= 0) {
      rowErrors.prezzoUnitario = "Inserisci un prezzo unitario valido.";
    }
    return rowErrors;
  });

  return next;
}

function hasValidationErrors(validationState: PreventivoManualeValidationState) {
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

function fieldStyle(hasError: boolean) {
  if (!hasError) return undefined;
  return { borderColor: "#b42318" };
}

export default function NextPreventivoManualeModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
}) {
  const [fornitori, setFornitori] = useState<NextFornitoreReadOnlyItem[]>([]);
  const [loadingFornitori, setLoadingFornitori] = useState(true);
  const [fornitoriError, setFornitoriError] = useState<string | null>(null);
  const [fornitoreId, setFornitoreId] = useState("");
  const [numeroPreventivo, setNumeroPreventivo] = useState(buildDefaultNumeroPreventivo);
  const [dataPreventivo, setDataPreventivo] = useState(buildTodayInputValue);
  const [valuta, setValuta] = useState<Valuta>("CHF");
  const [rows, setRows] = useState<PreventivoManualeRowFormState[]>([buildEmptyRow()]);
  const [foto, setFoto] = useState<File[]>([]);
  const [validationState, setValidationState] = useState<PreventivoManualeValidationState>(emptyValidationState);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFornitori = async () => {
      try {
        setLoadingFornitori(true);
        setFornitoriError(null);
        const snapshot = await readNextFornitoriSnapshot({
          includeCloneOverlays: false,
        });
        if (cancelled) return;
        setFornitori(snapshot.items);
      } catch (error) {
        if (cancelled) return;
        setFornitori([]);
        setFornitoriError(readErrorMessage(error));
      } finally {
        if (!cancelled) {
          setLoadingFornitori(false);
        }
      }
    };

    void loadFornitori();
    return () => {
      cancelled = true;
    };
  }, []);

  const fotoPreviewUrls = useMemo(
    () => foto.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [foto],
  );

  useEffect(() => {
    return () => {
      fotoPreviewUrls.forEach((entry) => URL.revokeObjectURL(entry.url));
    };
  }, [fotoPreviewUrls]);

  const canSubmit = !saving && !loadingFornitori;

  const handleRowChange = (
    index: number,
    field: keyof PreventivoManualeRowFormState,
    value: string,
  ) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
    setValidationState((current) => {
      const next = {
        ...current,
        rows: [...current.rows],
      };
      if (!next.rows[index]) next.rows[index] = {};
      next.rows[index] = {
        ...next.rows[index],
        ...(field === "descrizione" ? { descrizione: undefined } : {}),
        ...(field === "unita" ? { unita: undefined } : {}),
        ...(field === "prezzoUnitario" ? { prezzoUnitario: undefined } : {}),
      };
      return next;
    });
  };

  const handleAddRow = () => {
    setRows((current) => [...current, buildEmptyRow()]);
    setValidationState((current) => ({
      ...current,
      righe: undefined,
      rows: [...current.rows, {}],
    }));
  };

  const handleRemoveRow = (index: number) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setValidationState((current) => ({
      ...current,
      rows: current.rows.filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const handleAddFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setFoto((current) => [...current, ...files]);
    event.currentTarget.value = "";
  };

  const handleRemoveFoto = (index: number) => {
    setFoto((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextValidationState = buildValidationState({
      fornitoreId,
      numeroPreventivo,
      dataPreventivo,
      rows,
    });
    setValidationState(nextValidationState);
    setSubmitError(null);
    setSuccessMessage(null);

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
          prezzoUnitario: Number(String(row.prezzoUnitario || "").replace(",", ".")),
          note: row.note.trim() || undefined,
        })),
        valuta,
        foto,
      });
      setSuccessMessage("Preventivo salvato e listino aggiornato");
      if (onSaved) {
        await onSaved();
      }
      onClose();
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Errore durante il salvataggio del preventivo.";
      setSubmitError(message);
      window.alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="acq-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Nuovo preventivo manuale"
      onClick={(event) => {
        if (saving) return;
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="acq-modal-card"
        style={{ width: "min(980px, calc(100vw - 32px))", maxHeight: "calc(100vh - 32px)", overflow: "auto" }}
      >
        <div className="acq-link-foto-head">
          <div>
            <h4>Nuovo preventivo manuale</h4>
          </div>
          <button
            type="button"
            className="acq-btn acq-btn--small"
            onClick={onClose}
            aria-label="Chiudi"
            disabled={saving}
          >
            ×
          </button>
        </div>

        {fornitoriError ? <div className="acq-list-error">{fornitoriError}</div> : null}
        {submitError ? <div className="acq-list-error">{submitError}</div> : null}
        {successMessage ? <div className="acq-clean-result">{successMessage}</div> : null}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div className="acq-modal-grid">
            <label className="acq-prev-field">
              <span>Fornitore</span>
              <select
                value={fornitoreId}
                onChange={(event) => {
                  setFornitoreId(event.target.value);
                  setValidationState((current) => ({ ...current, fornitoreId: undefined }));
                }}
                disabled={loadingFornitori || saving}
                style={fieldStyle(Boolean(validationState.fornitoreId))}
              >
                <option value="">{loadingFornitori ? "Caricamento..." : "Seleziona"}</option>
                {fornitori.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
              {validationState.fornitoreId ? <small style={{ color: "#b42318" }}>{validationState.fornitoreId}</small> : null}
            </label>

            <label className="acq-prev-field">
              <span>Numero preventivo</span>
              <input
                type="text"
                value={numeroPreventivo}
                onChange={(event) => {
                  setNumeroPreventivo(event.target.value);
                  setValidationState((current) => ({ ...current, numeroPreventivo: undefined }));
                }}
                disabled={saving}
                style={fieldStyle(Boolean(validationState.numeroPreventivo))}
              />
              {validationState.numeroPreventivo ? <small style={{ color: "#b42318" }}>{validationState.numeroPreventivo}</small> : null}
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
                disabled={saving}
                style={fieldStyle(Boolean(validationState.dataPreventivo))}
              />
              {validationState.dataPreventivo ? <small style={{ color: "#b42318" }}>{validationState.dataPreventivo}</small> : null}
            </label>

            <label className="acq-prev-field">
              <span>Valuta</span>
              <select
                value={valuta}
                onChange={(event) => setValuta(event.target.value as Valuta)}
                disabled={saving}
              >
                <option value="CHF">CHF</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>

          <div className="acq-prev-righe-box">
            <h4>Articoli</h4>
            {validationState.righe ? <div className="acq-list-error">{validationState.righe}</div> : null}
            {rows.map((row, index) => (
              <div
                key={`preventivo-manuale-row:${index}`}
                style={{
                  display: "grid",
                  gap: 10,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid rgba(180, 167, 144, 0.35)",
                  background: "rgba(255, 255, 255, 0.72)",
                }}
              >
                <div className="acq-modal-grid">
                  <label className="acq-prev-field">
                    <span>Descrizione</span>
                    <input
                      type="text"
                      value={row.descrizione}
                      onChange={(event) => handleRowChange(index, "descrizione", event.target.value)}
                      disabled={saving}
                      style={fieldStyle(Boolean(validationState.rows[index]?.descrizione))}
                    />
                    {validationState.rows[index]?.descrizione ? <small style={{ color: "#b42318" }}>{validationState.rows[index]?.descrizione}</small> : null}
                  </label>

                  <label className="acq-prev-field">
                    <span>Codice articolo (opzionale)</span>
                    <input
                      type="text"
                      value={row.codiceArticolo}
                      onChange={(event) => handleRowChange(index, "codiceArticolo", event.target.value)}
                      disabled={saving}
                    />
                  </label>

                  <label className="acq-prev-field">
                    <span>Unità</span>
                    <input
                      type="text"
                      value={row.unita}
                      onChange={(event) => handleRowChange(index, "unita", event.target.value)}
                      disabled={saving}
                      style={fieldStyle(Boolean(validationState.rows[index]?.unita))}
                    />
                    {validationState.rows[index]?.unita ? <small style={{ color: "#b42318" }}>{validationState.rows[index]?.unita}</small> : null}
                  </label>

                  <label className="acq-prev-field">
                    <span>Prezzo unitario</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.prezzoUnitario}
                      onChange={(event) => handleRowChange(index, "prezzoUnitario", event.target.value)}
                      disabled={saving}
                      style={fieldStyle(Boolean(validationState.rows[index]?.prezzoUnitario))}
                    />
                    {validationState.rows[index]?.prezzoUnitario ? <small style={{ color: "#b42318" }}>{validationState.rows[index]?.prezzoUnitario}</small> : null}
                  </label>
                </div>

                <label className="acq-prev-field">
                  <span>Note (opzionale)</span>
                  <textarea
                    value={row.note}
                    onChange={(event) => handleRowChange(index, "note", event.target.value)}
                    disabled={saving}
                    style={{
                      minHeight: 82,
                      borderRadius: 10,
                      border: "1px solid rgba(180, 167, 144, 0.45)",
                      background: "rgba(255, 255, 255, 0.95)",
                      padding: 10,
                      boxSizing: "border-box",
                      color: "#3a352b",
                      fontSize: 13,
                      resize: "vertical",
                    }}
                  />
                </label>

                {rows.length >= 2 ? (
                  <div className="acq-prev-actions" style={{ justifyContent: "space-between" }}>
                    <span />
                    <button
                      type="button"
                      className="acq-btn"
                      onClick={() => handleRemoveRow(index)}
                      disabled={saving}
                    >
                      ×
                    </button>
                  </div>
                ) : null}
              </div>
            ))}

            <div className="acq-prev-actions" style={{ justifyContent: "flex-start" }}>
              <button type="button" className="acq-btn" onClick={handleAddRow} disabled={saving}>
                + Aggiungi riga
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <label className="acq-prev-field">
              <span>Allegati foto (opzionale)</span>
              <div className="acq-prev-actions" style={{ justifyContent: "flex-start" }}>
                <label className="acq-btn" style={{ cursor: saving ? "not-allowed" : "pointer" }}>
                  Aggiungi foto
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAddFoto}
                    disabled={saving}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </label>

            {fotoPreviewUrls.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 10,
                }}
              >
                {fotoPreviewUrls.map((entry, index) => (
                  <div
                    key={`${entry.file.name}:${entry.file.size}:${index}`}
                    style={{
                      display: "grid",
                      gap: 8,
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid rgba(180, 167, 144, 0.35)",
                      background: "rgba(255, 255, 255, 0.72)",
                    }}
                  >
                    <img
                      src={entry.url}
                      alt={entry.file.name}
                      style={{
                        width: "100%",
                        height: 110,
                        objectFit: "cover",
                        borderRadius: 10,
                        background: "#f7f0e5",
                      }}
                    />
                    <div style={{ fontSize: 12, color: "#5b574c", wordBreak: "break-word" }}>
                      {entry.file.name}
                    </div>
                    <div className="acq-prev-actions" style={{ justifyContent: "flex-start" }}>
                      <button
                        type="button"
                        className="acq-btn"
                        onClick={() => handleRemoveFoto(index)}
                        disabled={saving}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="acq-prev-actions">
            <button type="button" className="acq-btn" onClick={onClose} disabled={saving}>
              Annulla
            </button>
            <button type="submit" className="acq-btn acq-btn--primary" disabled={!canSubmit}>
              {saving ? "Salvataggio in corso..." : "Salva preventivo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
