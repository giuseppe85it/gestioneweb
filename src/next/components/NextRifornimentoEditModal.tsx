import { useEffect, useState } from "react";
import {
  updateNextRifornimento,
  type NextRifornimentoEditablePayload,
} from "../nextRifornimentiWriter";

type RowSubset = {
  id: string;
  originId: string;
  targa: string;
  autistaNome: string | null;
  dateObj: Date;
  litri: number | null;
  km: number | null;
  note: string;
  tipoRaw: string | null;
  metodoPagamento: "piccadilly" | "eni" | "contanti" | null;
  paese: "IT" | "CH" | null;
};

type Props = {
  open: boolean;
  row: RowSubset | null;
  onClose: () => void;
  onSaved: () => void;
};

type TipoFilter = "caravate" | "distributore";

function formatDateItDisplay(value: Date | null): string {
  if (!value) return "--/--/----";
  const dd = String(value.getDate()).padStart(2, "0");
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  const yyyy = value.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function deriveTipoInitial(row: RowSubset | null): TipoFilter {
  const raw = (row?.tipoRaw ?? "").toLowerCase().trim();
  if (raw === "distributore") return "distributore";
  return "caravate";
}

function parseNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatNumberInput(value: number | null): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export default function NextRifornimentoEditModal({
  open,
  row,
  onClose,
  onSaved,
}: Props) {
  const [tipo, setTipo] = useState<TipoFilter>("caravate");
  const [metodo, setMetodo] = useState<"piccadilly" | "eni" | "contanti" | "">("");
  const [paese, setPaese] = useState<"IT" | "CH" | "">("");
  const [km, setKm] = useState<string>("");
  const [litri, setLitri] = useState<string>("");
  const [importo, setImporto] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [dirty, setDirty] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !row) return;
    setTipo(deriveTipoInitial(row));
    setMetodo(row.metodoPagamento ?? "");
    setPaese(row.paese ?? "");
    setKm(formatNumberInput(row.km));
    setLitri(formatNumberInput(row.litri));
    setImporto("");
    setNote(row.note ?? "");
    setDirty(false);
    setSubmitting(false);
    setErrorMessage(null);
  }, [open, row]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        attemptClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  const markDirty = () => {
    if (!dirty) setDirty(true);
    if (errorMessage) setErrorMessage(null);
  };

  const attemptClose = () => {
    if (submitting) return;
    if (!dirty) {
      onClose();
      return;
    }
    const ok = window.confirm("Hai modifiche non salvate. Vuoi davvero uscire?");
    if (ok) onClose();
  };

  const handleSave = async () => {
    if (!row || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);

    const payload: NextRifornimentoEditablePayload = {
      tipo,
      metodoPagamento: tipo === "distributore" ? (metodo || null) : null,
      paese: tipo === "distributore" ? (paese || null) : null,
      km: parseNumberOrNull(km),
      litri: parseNumberOrNull(litri),
      importo:
        tipo === "distributore" && metodo === "contanti"
          ? parseNumberOrNull(importo)
          : null,
      note: note ?? "",
    };

    const idForWriter = row.originId || row.id;
    const result = await updateNextRifornimento(idForWriter, payload);

    if (result.ok) {
      setSubmitting(false);
      setDirty(false);
      onSaved();
      return;
    }
    setSubmitting(false);
    setErrorMessage(result.error ?? "Errore salvataggio rifornimento.");
  };

  if (!open || !row) return null;

  const showImportoField = tipo === "distributore" && metodo === "contanti";

  return (
    <div
      className="cc-edit-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Modifica rifornimento"
      onClick={(e) => {
        if (e.target === e.currentTarget) attemptClose();
      }}
    >
      <div className="cc-edit-dialog">
        <div className="cc-edit-header">
          <div>
            <h3>Modifica rifornimento</h3>
            <p className="cc-edit-subtitle">
              {row.targa} · {formatDateItDisplay(row.dateObj)} ·{" "}
              {row.autistaNome ?? "—"}
            </p>
          </div>
          <button
            type="button"
            className="cc-investigation-close"
            onClick={attemptClose}
            aria-label="Chiudi modale"
          >
            ×
          </button>
        </div>

        <div className="cc-edit-body">
          <div className="cc-edit-grid">
            <div className="cc-edit-col">
              <div className="cc-edit-field">
                <label htmlFor="cc-edit-tipo">Tipo</label>
                <select
                  id="cc-edit-tipo"
                  value={tipo}
                  onChange={(e) => {
                    setTipo(e.target.value as TipoFilter);
                    markDirty();
                  }}
                >
                  <option value="caravate">Caravate</option>
                  <option value="distributore">Distributore</option>
                </select>
              </div>

              {tipo === "distributore" && (
                <>
                  <div className="cc-edit-field">
                    <label htmlFor="cc-edit-metodo">Metodo pagamento</label>
                    <select
                      id="cc-edit-metodo"
                      value={metodo}
                      onChange={(e) => {
                        setMetodo(e.target.value as
                          | "piccadilly"
                          | "eni"
                          | "contanti"
                          | "");
                        markDirty();
                      }}
                    >
                      <option value="">—</option>
                      <option value="piccadilly">Piccadilly</option>
                      <option value="eni">Eni</option>
                      <option value="contanti">Contanti</option>
                    </select>
                  </div>

                  <div className="cc-edit-field">
                    <label htmlFor="cc-edit-paese">Paese</label>
                    <select
                      id="cc-edit-paese"
                      value={paese}
                      onChange={(e) => {
                        setPaese(e.target.value as "IT" | "CH" | "");
                        markDirty();
                      }}
                    >
                      <option value="">—</option>
                      <option value="IT">IT</option>
                      <option value="CH">CH</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="cc-edit-col">
              <div className="cc-edit-field">
                <label htmlFor="cc-edit-km">Km</label>
                <input
                  id="cc-edit-km"
                  type="number"
                  step="1"
                  value={km}
                  onChange={(e) => {
                    setKm(e.target.value);
                    markDirty();
                  }}
                />
              </div>

              <div className="cc-edit-field">
                <label htmlFor="cc-edit-litri">Litri</label>
                <input
                  id="cc-edit-litri"
                  type="number"
                  step="0.01"
                  value={litri}
                  onChange={(e) => {
                    setLitri(e.target.value);
                    markDirty();
                  }}
                />
              </div>

              {showImportoField && (
                <div className="cc-edit-field">
                  <label htmlFor="cc-edit-importo">Importo (contanti)</label>
                  <input
                    id="cc-edit-importo"
                    type="number"
                    step="0.01"
                    value={importo}
                    onChange={(e) => {
                      setImporto(e.target.value);
                      markDirty();
                    }}
                  />
                </div>
              )}

              <div className="cc-edit-field">
                <label htmlFor="cc-edit-note">Note</label>
                <textarea
                  id="cc-edit-note"
                  rows={3}
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    markDirty();
                  }}
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="cc-edit-error" role="alert">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="cc-edit-footer">
          <button
            type="button"
            className="cc-secondary-btn"
            onClick={attemptClose}
            disabled={submitting}
          >
            Annulla
          </button>
          <button
            type="button"
            className="cc-primary-btn"
            onClick={() => void handleSave()}
            disabled={!dirty || submitting}
          >
            {submitting ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </div>
    </div>
  );
}
