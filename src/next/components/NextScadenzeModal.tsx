import { useEffect, useMemo, useState } from "react";
import { formatDateUI } from "../nextDateFormat";
import {
  parseNextCentroControlloDate,
  readNextCentroControlloSnapshot,
  type D10PrenotazioneCollaudo,
  type D10PreCollaudo,
  type D10RevisionItem,
  type D10Snapshot,
} from "../domain/nextCentroControlloDomain";

type NextScadenzeModalMode = "tutte" | "urgenti";

type NextScadenzeModalProps = {
  mode: NextScadenzeModalMode;
  onClose: () => void;
};

type NextScadenzeFeedback = {
  tone: "warning" | "danger";
  text: string;
};

type PrenotazioneFormState = {
  data: string;
  ora: string;
  luogo: string;
  note: string;
};

type PreCollaudoFormState = {
  data: string;
  officina: string;
};

type RevisioneFormState = {
  data: string;
  esito: string;
  note: string;
};

type NextScadenzeOperation =
  | {
      kind: "prenotazione";
      item: D10RevisionItem;
      variant: "create" | "edit";
      form: PrenotazioneFormState;
    }
  | {
      kind: "pre-collaudo";
      item: D10RevisionItem;
      variant: "create" | "edit";
      form: PreCollaudoFormState;
    }
  | {
      kind: "revisione";
      item: D10RevisionItem;
      form: RevisioneFormState;
    }
  | {
      kind: "cancella-prenotazione";
      item: D10RevisionItem;
      prenotazione: D10PrenotazioneCollaudo;
    };

function formatDateLabel(timestamp: number | null): string {
  if (timestamp == null) {
    return "-";
  }

  return formatDateUI(new Date(timestamp));
}

function formatEditableDate(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }

  const parsed = parseNextCentroControlloDate(raw);
  if (!parsed) {
    return raw;
  }

  return formatDateUI(parsed);
}

function formatGiorniLabel(giorni: number | null): string {
  if (giorni === null) return "n.d.";
  if (giorni === 0) return "oggi";
  const abs = Math.abs(giorni);
  const base = abs === 1 ? "1 giorno" : `${abs} giorni`;
  return giorni < 0 ? `${base} fa` : `tra ${base}`;
}

function sanitizeBookingTime(rawValue: string): string | null {
  let value = rawValue.replace(/\u00A0/g, " ").trim().replace(/\./g, ":");
  if (!value) return "";
  if (value.length >= 5) value = value.slice(0, 5);
  if (/^[0-9]:[0-5]\d$/.test(value)) value = `0${value}`;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  return value;
}

function formatPrenotazioneSummary(prenotazione: D10PrenotazioneCollaudo | null): string {
  if (!prenotazione) {
    return "NON PRENOTATO";
  }

  if (prenotazione.completata) {
    const completataIl = formatEditableDate(prenotazione.completataIl);
    return `COMPLETATA${completataIl ? ` il ${completataIl}` : ""}`;
  }

  const dataLabel = formatEditableDate(prenotazione.data);
  const ora = String(prenotazione.ora ?? "").trim();
  const luogo = String(prenotazione.luogo ?? "").trim();
  const note = String(prenotazione.note ?? "").trim();
  return `PRENOTATA per ${dataLabel || "Data non disponibile"}${ora ? ` ${ora}` : ""}${
    luogo ? ` - ${luogo}` : ""
  }${note ? ` | ${note}` : ""}`;
}

function formatPreCollaudoSummary(preCollaudo: D10PreCollaudo | null): string {
  if (!preCollaudo) {
    return "";
  }

  const dataLabel = formatEditableDate(preCollaudo.data);
  const officina = String(preCollaudo.officina ?? "").trim();
  return `${dataLabel || "Data non disponibile"}${officina ? ` - ${officina}` : ""}`;
}

function getRevisionStatusLabel(item: D10RevisionItem): string {
  if (item.giorni === null) return "REVISIONE";
  if (item.giorni < 0) return "REVISIONE SCADUTA";
  if (item.giorni <= 30) return "REVISIONE IN SCADENZA";
  return "REVISIONE";
}

function getRevisionStatusTone(item: D10RevisionItem): "neutral" | "warning" | "danger" {
  if (item.giorni === null) return "neutral";
  if (item.giorni < 0) return "danger";
  if (item.giorni <= 30) return "warning";
  return "neutral";
}

function isUrgentRevision(item: D10RevisionItem): boolean {
  return item.giorni !== null && item.giorni <= 30 && item.prenotazioneCollaudo?.completata !== true;
}

function sortRevisionItems(items: D10RevisionItem[]): D10RevisionItem[] {
  return [...items].sort((left, right) => {
    if (left.giorni === null && right.giorni === null) return 0;
    if (left.giorni === null) return 1;
    if (right.giorni === null) return -1;
    return left.giorni - right.giorni;
  });
}

function buildPrenotazioneForm(
  item: D10RevisionItem,
  variant: "create" | "edit",
): NextScadenzeOperation {
  const current = item.prenotazioneCollaudo;
  return {
    kind: "prenotazione",
    item,
    variant,
    form: {
      data: formatEditableDate(current?.data),
      ora: String(current?.ora ?? "").trim(),
      luogo: String(current?.luogo ?? "").trim(),
      note: String(current?.note ?? "").trim(),
    },
  };
}

function buildPreCollaudoForm(
  item: D10RevisionItem,
  variant: "create" | "edit",
): NextScadenzeOperation {
  const current = item.preCollaudo;
  return {
    kind: "pre-collaudo",
    item,
    variant,
    form: {
      data: formatEditableDate(current?.data),
      officina: String(current?.officina ?? "").trim(),
    },
  };
}

function buildRevisioneForm(item: D10RevisionItem): NextScadenzeOperation {
  return {
    kind: "revisione",
    item,
    form: { data: "", esito: "", note: "" },
  };
}

function buildDeletePrenotazioneOperation(
  item: D10RevisionItem,
  prenotazione: D10PrenotazioneCollaudo,
): NextScadenzeOperation {
  return {
    kind: "cancella-prenotazione",
    item,
    prenotazione,
  };
}

export default function NextScadenzeModal({ mode, onClose }: NextScadenzeModalProps) {
  const [snapshot, setSnapshot] = useState<D10Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<NextScadenzeOperation | null>(null);
  const [feedback, setFeedback] = useState<NextScadenzeFeedback | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const nextSnapshot = await readNextCentroControlloSnapshot(Date.now());
        if (!active) return;
        setSnapshot(nextSnapshot);
      } catch {
        if (!active) return;
        setSnapshot(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (operation) {
          setOperation(null);
          setFeedback(null);
          return;
        }
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, operation]);

  const rows = useMemo(() => {
    const source = snapshot?.revisioni ?? [];
    const filtered = mode === "urgenti" ? source.filter(isUrgentRevision) : source;
    return sortRevisionItems(filtered);
  }, [mode, snapshot]);

  const counters = snapshot?.counters ?? null;
  const subtitle =
    mode === "urgenti"
      ? "Solo revisioni urgenti non completate"
      : "Vista completa ordinata per scadenza";

  const closeOperation = () => {
    setOperation(null);
    setFeedback(null);
  };

  const showReadOnlyBlocked = (text: string) => {
    setFeedback({ tone: "warning", text });
  };

  const showValidationError = (text: string) => {
    setFeedback({ tone: "danger", text });
  };

  const handlePrenotazioneSubmit = () => {
    if (!operation || operation.kind !== "prenotazione") return;
    const data = operation.form.data.trim();
    if (!data) {
      showValidationError("Inserisci la data della prenotazione collaudo.");
      return;
    }
    if (!parseNextCentroControlloDate(data)) {
      showValidationError("Data non valida. Usa formato gg/mm/aaaa oppure YYYY-MM-DD.");
      return;
    }
    const ora = sanitizeBookingTime(operation.form.ora);
    if (ora === null) {
      showValidationError("Ora non valida. Usa formato HH:mm.");
      return;
    }
    showReadOnlyBlocked(
      "Clone NEXT in sola lettura: prenotazione collaudo non salvata su @mezzi_aziendali.",
    );
  };

  const handlePreCollaudoSubmit = () => {
    if (!operation || operation.kind !== "pre-collaudo") return;
    const data = operation.form.data.trim();
    if (!data) {
      showValidationError("Inserisci la data del pre-collaudo.");
      return;
    }
    if (!parseNextCentroControlloDate(data)) {
      showValidationError("Data non valida. Usa formato gg/mm/aaaa oppure YYYY-MM-DD.");
      return;
    }
    if (!operation.form.officina.trim()) {
      showValidationError("Inserisci l'officina del pre-collaudo.");
      return;
    }
    showReadOnlyBlocked(
      "Clone NEXT in sola lettura: programmazione pre-collaudo non salvata su @mezzi_aziendali.",
    );
  };

  const handleRevisioneSubmit = () => {
    if (!operation || operation.kind !== "revisione") return;
    const data = operation.form.data.trim();
    if (!data) {
      showValidationError("Inserisci la data della revisione.");
      return;
    }
    if (!parseNextCentroControlloDate(data)) {
      showValidationError("Data non valida. Usa formato gg/mm/aaaa oppure YYYY-MM-DD.");
      return;
    }
    if (!operation.form.esito.trim()) {
      showValidationError("Inserisci l'esito della revisione.");
      return;
    }
    showReadOnlyBlocked(
      "Clone NEXT in sola lettura: revisione segnata come fatta solo a livello UX, senza scrittura reale su @mezzi_aziendali.",
    );
  };

  const handleDeletePrenotazioneSubmit = () => {
    if (!operation || operation.kind !== "cancella-prenotazione") return;
    showReadOnlyBlocked(
      "Clone NEXT in sola lettura: cancellazione prenotazione non eseguita su @mezzi_aziendali.",
    );
  };

  const renderFeedback = () =>
    feedback ? (
      <div className={`next-shell__scadenze-feedback next-shell__scadenze-feedback--${feedback.tone}`}>
        {feedback.text}
      </div>
    ) : null;

  const renderOperationPanel = () => {
    if (!operation) return null;
    const targa = operation.item.targa || "-";

    if (operation.kind === "prenotazione") {
      return (
        <section className="next-shell__scadenze-operation">
          <div className="next-shell__scadenze-operation-head">
            <div>
              <div className="next-shell__scadenze-operation-title">
                {operation.variant === "edit" ? "Prenotazione collaudo" : "Nuova prenotazione collaudo"}
              </div>
              <div className="next-shell__scadenze-operation-subtitle">
                Targa <span className="next-shell__scadenze-inline-targa">{targa}</span>
              </div>
            </div>
          </div>
          <div className="next-shell__scadenze-form-grid">
            <label className="next-shell__scadenze-field">
              <span className="next-shell__scadenze-field-label">Data</span>
              <input
                className="next-shell__scadenze-input"
                value={operation.form.data}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, data: value } }
                      : current,
                  );
                }}
                placeholder="gg/mm/aaaa oppure YYYY-MM-DD"
              />
            </label>
            <label className="next-shell__scadenze-field">
              <span className="next-shell__scadenze-field-label">Ora (opzionale)</span>
              <input
                className="next-shell__scadenze-input"
                value={operation.form.ora}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, ora: value } }
                      : current,
                  );
                }}
                placeholder="HH:mm"
              />
            </label>
            <label className="next-shell__scadenze-field">
              <span className="next-shell__scadenze-field-label">Luogo (opzionale)</span>
              <input
                className="next-shell__scadenze-input"
                value={operation.form.luogo}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, luogo: value } }
                      : current,
                  );
                }}
                placeholder="Motorizzazione / officina / ..."
              />
            </label>
            <label className="next-shell__scadenze-field next-shell__scadenze-field--wide">
              <span className="next-shell__scadenze-field-label">Note (opzionale)</span>
              <textarea
                className="next-shell__scadenze-textarea"
                rows={3}
                value={operation.form.note}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, note: value } }
                      : current,
                  );
                }}
                placeholder="Note brevi..."
              />
            </label>
          </div>
          {renderFeedback()}
          <div className="next-shell__scadenze-form-actions">
            <button type="button" className="next-shell__scadenze-action" onClick={closeOperation}>
              Annulla
            </button>
            <button
              type="button"
              className="next-shell__scadenze-action next-shell__scadenze-action--primary"
              onClick={handlePrenotazioneSubmit}
            >
              Salva
            </button>
          </div>
        </section>
      );
    }

    if (operation.kind === "pre-collaudo") {
      return (
        <section className="next-shell__scadenze-operation">
          <div className="next-shell__scadenze-operation-head">
            <div>
              <div className="next-shell__scadenze-operation-title">
                {operation.variant === "edit" ? "Programmazione Pre-collaudo" : "Nuovo Pre-collaudo"}
              </div>
              <div className="next-shell__scadenze-operation-subtitle">
                Targa <span className="next-shell__scadenze-inline-targa">{targa}</span>
              </div>
            </div>
          </div>
          <div className="next-shell__scadenze-form-grid">
            <label className="next-shell__scadenze-field">
              <span className="next-shell__scadenze-field-label">Data</span>
              <input
                className="next-shell__scadenze-input"
                value={operation.form.data}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "pre-collaudo"
                      ? { ...current, form: { ...current.form, data: value } }
                      : current,
                  );
                }}
                placeholder="gg/mm/aaaa oppure YYYY-MM-DD"
              />
            </label>
            <label className="next-shell__scadenze-field">
              <span className="next-shell__scadenze-field-label">Officina</span>
              <input
                className="next-shell__scadenze-input"
                value={operation.form.officina}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "pre-collaudo"
                      ? { ...current, form: { ...current.form, officina: value } }
                      : current,
                  );
                }}
                placeholder="Officina / luogo..."
              />
            </label>
          </div>
          {renderFeedback()}
          <div className="next-shell__scadenze-form-actions">
            <button type="button" className="next-shell__scadenze-action" onClick={closeOperation}>
              Annulla
            </button>
            <button
              type="button"
              className="next-shell__scadenze-action next-shell__scadenze-action--primary"
              onClick={handlePreCollaudoSubmit}
            >
              Salva
            </button>
          </div>
        </section>
      );
    }

    if (operation.kind === "revisione") {
      return (
        <section className="next-shell__scadenze-operation">
          <div className="next-shell__scadenze-operation-head">
            <div>
              <div className="next-shell__scadenze-operation-title">Segna revisione fatta</div>
              <div className="next-shell__scadenze-operation-subtitle">
                Targa <span className="next-shell__scadenze-inline-targa">{targa}</span>
              </div>
            </div>
          </div>
          <div className="next-shell__scadenze-form-grid">
            <label className="next-shell__scadenze-field">
              <span className="next-shell__scadenze-field-label">Data</span>
              <input
                className="next-shell__scadenze-input"
                value={operation.form.data}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "revisione"
                      ? { ...current, form: { ...current.form, data: value } }
                      : current,
                  );
                }}
                placeholder="gg/mm/aaaa oppure YYYY-MM-DD"
              />
            </label>
            <label className="next-shell__scadenze-field">
              <span className="next-shell__scadenze-field-label">Esito</span>
              <input
                className="next-shell__scadenze-input"
                value={operation.form.esito}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "revisione"
                      ? { ...current, form: { ...current.form, esito: value } }
                      : current,
                  );
                }}
                placeholder="Es. OK / Respinta / ..."
              />
            </label>
            <label className="next-shell__scadenze-field next-shell__scadenze-field--wide">
              <span className="next-shell__scadenze-field-label">Note (opzionale)</span>
              <textarea
                className="next-shell__scadenze-textarea"
                rows={3}
                value={operation.form.note}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "revisione"
                      ? { ...current, form: { ...current.form, note: value } }
                      : current,
                  );
                }}
                placeholder="Note brevi..."
              />
            </label>
          </div>
          {renderFeedback()}
          <div className="next-shell__scadenze-form-actions">
            <button type="button" className="next-shell__scadenze-action" onClick={closeOperation}>
              Annulla
            </button>
            <button
              type="button"
              className="next-shell__scadenze-action next-shell__scadenze-action--primary"
              onClick={handleRevisioneSubmit}
            >
              Salva
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="next-shell__scadenze-operation">
        <div className="next-shell__scadenze-operation-head">
          <div>
            <div className="next-shell__scadenze-operation-title">Cancella prenotazione collaudo</div>
            <div className="next-shell__scadenze-operation-subtitle">
              Targa <span className="next-shell__scadenze-inline-targa">{targa}</span>
            </div>
          </div>
        </div>
        <div className="next-shell__scadenze-confirm-copy">
          Stai per rimuovere la prenotazione corrente:
          <strong> {formatPrenotazioneSummary(operation.prenotazione)}</strong>
        </div>
        {renderFeedback()}
        <div className="next-shell__scadenze-form-actions">
          <button type="button" className="next-shell__scadenze-action" onClick={closeOperation}>
            Annulla
          </button>
          <button
            type="button"
            className="next-shell__scadenze-action next-shell__scadenze-action--danger"
            onClick={handleDeletePrenotazioneSubmit}
          >
            Cancella
          </button>
        </div>
      </section>
    );
  };

  return (
    <div className="next-shell__modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="next-shell__modal next-shell__modal--scadenze"
        role="dialog"
        aria-modal="true"
        aria-label="Scadenze revisioni"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="next-shell__modal-head">
          <div>
            <div className="next-shell__modal-title">Scadenze revisioni</div>
            <div className="next-shell__modal-subtitle">{subtitle}</div>
          </div>
          <button type="button" className="next-shell__modal-close" onClick={onClose}>
            Chiudi
          </button>
        </div>

        <div className="next-shell__modal-body">
          {renderOperationPanel()}

          <div className="next-shell__scadenze-stats">
            <div className="next-shell__scadenze-stat">
              <span className="next-shell__scadenze-stat-label">Scadute</span>
              <span className="next-shell__scadenze-stat-value">
                {counters?.revisioniScadute ?? "-"}
              </span>
            </div>
            <div className="next-shell__scadenze-stat">
              <span className="next-shell__scadenze-stat-label">In scadenza</span>
              <span className="next-shell__scadenze-stat-value">
                {counters?.revisioniInScadenza ?? "-"}
              </span>
            </div>
          </div>

          <div className="next-shell__scadenze-list">
            {loading ? (
              <div className="next-shell__scadenze-empty">Caricamento scadenze...</div>
            ) : rows.length === 0 ? (
              <div className="next-shell__scadenze-empty">
                {mode === "urgenti"
                  ? "Nessuna revisione urgente da mostrare"
                  : "Nessuna scadenza revisione disponibile"}
              </div>
            ) : (
              rows.map((item) => {
                const mezzoLabel = [item.marca, item.modello].filter(Boolean).join(" ");
                const prenotazione = item.prenotazioneCollaudo;
                const preCollaudo = item.preCollaudo;
                const prenCompletata = prenotazione?.completata === true;
                const hasPreCollaudo = Boolean(preCollaudo);
                const canOperate = Boolean(item.targa);
                const isActive = operation?.item.id === item.id;

                return (
                  <article
                    key={item.id}
                    className={`next-shell__scadenze-row ${
                      isActive ? "next-shell__scadenze-row--active" : ""
                    }`}
                  >
                    <div className="next-shell__scadenze-row-top">
                      <div className="next-shell__scadenze-row-main">
                        <div className="next-shell__scadenze-targa">{item.targa || "-"}</div>
                        <div className="next-shell__scadenze-mezzo">
                          {mezzoLabel || "Mezzo non indicato"}
                        </div>
                      </div>
                      <div className="next-shell__scadenze-status">
                        <span
                          className={`next-shell__scadenze-status-pill next-shell__scadenze-status-pill--${getRevisionStatusTone(
                            item,
                          )}`}
                        >
                          {getRevisionStatusLabel(item)}
                        </span>
                      </div>
                    </div>

                    <div className="next-shell__scadenze-meta-grid">
                      <div className="next-shell__scadenze-meta-item">
                        <span className="next-shell__scadenze-meta-label">Scadenza</span>
                        <span>{formatDateLabel(item.scadenzaTs)}</span>
                      </div>
                      <div className="next-shell__scadenze-meta-item">
                        <span className="next-shell__scadenze-meta-label">Delta</span>
                        <span>{formatGiorniLabel(item.giorni)}</span>
                      </div>
                      <div className="next-shell__scadenze-meta-item next-shell__scadenze-meta-item--wide">
                        <span className="next-shell__scadenze-meta-label">Prenotazione collaudo</span>
                        <span>{formatPrenotazioneSummary(prenotazione)}</span>
                      </div>
                    </div>

                    <div className="next-shell__scadenze-booking">
                      <div className="next-shell__scadenze-booking-line">
                        <span className="next-shell__scadenze-booking-label">Prenotazione collaudo</span>
                        {prenotazione ? (
                          <span className="next-shell__scadenze-booking-value">
                            {formatPrenotazioneSummary(prenotazione)}
                          </span>
                        ) : (
                          <span className="next-shell__scadenze-booking-missing">NON PRENOTATO</span>
                        )}
                        {canOperate ? (
                          <span className="next-shell__scadenze-actions">
                            {!prenCompletata ? (
                              <button
                                type="button"
                                className="next-shell__scadenze-action next-shell__scadenze-action--primary"
                                onClick={() => {
                                  setOperation(buildRevisioneForm(item));
                                  setFeedback(null);
                                }}
                              >
                                Segna revisione fatta
                              </button>
                            ) : null}
                            {prenotazione && !prenCompletata ? (
                              <>
                                <button
                                  type="button"
                                  className="next-shell__scadenze-action"
                                  onClick={() => {
                                    setOperation(buildPrenotazioneForm(item, "edit"));
                                    setFeedback(null);
                                  }}
                                >
                                  Modifica
                                </button>
                                <button
                                  type="button"
                                  className="next-shell__scadenze-action next-shell__scadenze-action--danger"
                                  onClick={() => {
                                    setOperation(buildDeletePrenotazioneOperation(item, prenotazione));
                                    setFeedback(null);
                                  }}
                                >
                                  Cancella
                                </button>
                              </>
                            ) : !prenotazione ? (
                              <button
                                type="button"
                                className="next-shell__scadenze-action"
                                onClick={() => {
                                  setOperation(buildPrenotazioneForm(item, "create"));
                                  setFeedback(null);
                                }}
                              >
                                Prenota
                              </button>
                            ) : null}
                          </span>
                        ) : null}
                      </div>

                      <div className="next-shell__scadenze-booking-line">
                        <span className="next-shell__scadenze-booking-label">Pre-collaudo</span>
                        {hasPreCollaudo ? (
                          <>
                            <span className="next-shell__scadenze-flag">Pre-collaudo programmato</span>
                            <span className="next-shell__scadenze-booking-value">
                              {formatPreCollaudoSummary(preCollaudo)}
                            </span>
                          </>
                        ) : (
                          <span className="next-shell__scadenze-booking-muted">
                            Nessun pre-collaudo programmato
                          </span>
                        )}
                        {canOperate ? (
                          <span className="next-shell__scadenze-actions">
                            {hasPreCollaudo ? (
                              <button
                                type="button"
                                className="next-shell__scadenze-action"
                                onClick={() => {
                                  setOperation(buildPreCollaudoForm(item, "edit"));
                                  setFeedback(null);
                                }}
                              >
                                Modifica
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="next-shell__scadenze-action"
                                onClick={() => {
                                  setOperation(buildPreCollaudoForm(item, "create"));
                                  setFeedback(null);
                                }}
                              >
                                Pre-collaudo
                              </button>
                            )}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
