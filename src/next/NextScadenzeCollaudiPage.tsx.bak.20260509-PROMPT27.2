import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDateInput, formatDateUI } from "./nextDateFormat";
import {
  parseNextCentroControlloDate,
  readNextCentroControlloSnapshot,
  type D10PrenotazioneCollaudo,
  type D10PreCollaudo,
  type D10RevisionItem,
  type D10Snapshot,
} from "./domain/nextCentroControlloDomain";
import {
  readNextOfficineSnapshot,
  type NextOfficinaReadOnlyItem,
} from "./domain/nextOfficineDomain";
import { buildNextDossierPath } from "./nextStructuralPaths";
import {
  markRevisioneCompletata,
  setPreCollaudo,
  setPrenotazioneCollaudo,
} from "./nextScadenzeCollaudiWriter";

type ScadenzeMode = "tutte" | "urgenti";

type FeedbackState = {
  tone: "warning" | "danger" | "success";
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
  lavoriPrevisti: string;
};

type RevisioneFormState = {
  data: string;
  esito: string;
  note: string;
};

type Operation =
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

type PreCollaudoWithLavori = D10PreCollaudo & {
  lavoriPrevisti?: string | null;
};

function formatDateLabel(timestamp: number | null): string {
  if (timestamp == null) return "-";
  return formatDateUI(new Date(timestamp));
}

function formatEditableDate(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = parseNextCentroControlloDate(raw);
  if (!parsed) return raw;
  return formatDateUI(parsed);
}

function formatDateFieldValue(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = parseNextCentroControlloDate(raw);
  return parsed ? formatDateInput(parsed) : raw;
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
  if (!prenotazione) return "non prenotato";
  if (prenotazione.completata) {
    const completataIl = formatEditableDate(prenotazione.completataIl);
    return `completata${completataIl ? ` il ${completataIl}` : ""}`;
  }
  const dataLabel = formatEditableDate(prenotazione.data);
  const ora = String(prenotazione.ora ?? "").trim();
  const luogo = String(prenotazione.luogo ?? "").trim();
  const note = String(prenotazione.note ?? "").trim();
  return `prenotata per ${dataLabel || "data non disponibile"}${ora ? ` ${ora}` : ""}${
    luogo ? ` - ${luogo}` : ""
  }${note ? ` | ${note}` : ""}`;
}

function formatPreCollaudoSummary(preCollaudo: D10PreCollaudo | null): string {
  if (!preCollaudo) return "nessuno programmato";
  const dataLabel = formatEditableDate(preCollaudo.data);
  const officina = String(preCollaudo.officina ?? "").trim();
  return `${dataLabel || "data non disponibile"}${officina ? ` - ${officina}` : ""}`;
}

function getPreCollaudoLavori(preCollaudo: D10PreCollaudo | null): string {
  return String((preCollaudo as PreCollaudoWithLavori | null)?.lavoriPrevisti ?? "").trim();
}

function getRevisionStatusLabel(item: D10RevisionItem): string {
  if (item.giorni === null) return "Revisione";
  if (item.giorni < 0) return "Scaduta";
  if (item.giorni <= 30) return "In scadenza";
  return "Revisione";
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
): Operation {
  const current = item.prenotazioneCollaudo;
  return {
    kind: "prenotazione",
    item,
    variant,
    form: {
      data: formatDateFieldValue(current?.data),
      ora: String(current?.ora ?? "").trim(),
      luogo: String(current?.luogo ?? "").trim(),
      note: String(current?.note ?? "").trim(),
    },
  };
}

function buildPreCollaudoForm(
  item: D10RevisionItem,
  variant: "create" | "edit",
): Operation {
  const current = item.preCollaudo;
  return {
    kind: "pre-collaudo",
    item,
    variant,
    form: {
      data: formatDateFieldValue(current?.data),
      officina: String(current?.officina ?? "").trim(),
      lavoriPrevisti: getPreCollaudoLavori(current),
    },
  };
}

function buildRevisioneForm(item: D10RevisionItem): Operation {
  return {
    kind: "revisione",
    item,
    form: { data: "", esito: "", note: "" },
  };
}

function buildDeletePrenotazioneOperation(
  item: D10RevisionItem,
  prenotazione: D10PrenotazioneCollaudo,
): Operation {
  return {
    kind: "cancella-prenotazione",
    item,
    prenotazione,
  };
}

function readModeFromSearch(search: string): ScadenzeMode {
  const value = new URLSearchParams(search).get("mode");
  return value === "urgenti" ? "urgenti" : "tutte";
}

function filterOfficine(items: NextOfficinaReadOnlyItem[], query: string): NextOfficinaReadOnlyItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase("it");
  if (!normalizedQuery) return items.slice(0, 8);
  return items
    .filter((item) => {
      const target = [item.nome, item.citta, item.telefono]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("it");
      return target.includes(normalizedQuery);
    })
    .slice(0, 8);
}

function formatOfficinaMeta(item: NextOfficinaReadOnlyItem): string {
  return [item.citta, item.telefono].filter(Boolean).join(" - ");
}

export default function NextScadenzeCollaudiPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = readModeFromSearch(location.search);
  const operationPanelRef = useRef<HTMLElement | null>(null);

  const [snapshot, setSnapshot] = useState<D10Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [officine, setOfficine] = useState<NextOfficinaReadOnlyItem[]>([]);
  const [officineOpen, setOfficineOpen] = useState(false);

  const loadSnapshot = async () => {
    setLoading(true);
    try {
      const nextSnapshot = await readNextCentroControlloSnapshot(Date.now());
      setSnapshot(nextSnapshot);
    } catch {
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const nextSnapshot = await readNextCentroControlloSnapshot(Date.now());
        if (!active) return;
        setSnapshot(nextSnapshot);
      } catch {
        if (!active) return;
        setSnapshot(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const officineSnapshot = await readNextOfficineSnapshot({ includeCloneOverlays: false });
        if (active) setOfficine(officineSnapshot.items);
      } catch {
        if (active) setOfficine([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && operation) {
        setOperation(null);
        setFeedback(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [operation]);

  useEffect(() => {
    if (!operation) return;
    window.requestAnimationFrame(() => {
      operationPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [operation]);

  const rows = useMemo(() => {
    const source = snapshot?.revisioni ?? [];
    const filtered = mode === "urgenti" ? source.filter(isUrgentRevision) : source;
    return sortRevisionItems(filtered);
  }, [mode, snapshot]);

  const filteredOfficine = useMemo(() => {
    if (!operation || operation.kind !== "pre-collaudo") return [];
    return filterOfficine(officine, operation.form.officina);
  }, [officine, operation]);

  const counters = snapshot?.counters ?? null;
  const subtitle =
    mode === "urgenti"
      ? "Solo revisioni urgenti non completate"
      : "Vista completa ordinata per scadenza";

  const setMode = (nextMode: ScadenzeMode) => {
    const params = new URLSearchParams(location.search);
    if (nextMode === "urgenti") {
      params.set("mode", "urgenti");
    } else {
      params.delete("mode");
    }
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : "",
      },
      { replace: true },
    );
  };

  const openOperation = (nextOperation: Operation) => {
    setOperation(nextOperation);
    setFeedback(null);
    setOfficineOpen(nextOperation.kind === "pre-collaudo");
  };

  const closeOperation = () => {
    setOperation(null);
    setFeedback(null);
    setOfficineOpen(false);
  };

  const showValidationError = (text: string) => {
    setFeedback({ tone: "danger", text });
  };

  const showSuccess = (text: string) => {
    setFeedback({ tone: "success", text });
  };

  const handlePrenotazioneSubmit = async () => {
    if (!operation || operation.kind !== "prenotazione") return;
    const dataInput = operation.form.data.trim();
    if (!dataInput) {
      showValidationError("Inserisci la data della prenotazione collaudo.");
      return;
    }
    if (!parseNextCentroControlloDate(dataInput)) {
      showValidationError("Data non valida. Usa formato gg/mm/aaaa oppure YYYY-MM-DD.");
      return;
    }
    const ora = sanitizeBookingTime(operation.form.ora);
    if (ora === null) {
      showValidationError("Ora non valida. Usa formato HH:mm.");
      return;
    }
    const targa = operation.item.targa;
    if (!targa) {
      showValidationError("Targa mancante per il mezzo selezionato.");
      return;
    }
    const luogo = operation.form.luogo.trim();
    const note = operation.form.note.trim();
    setSubmitting(true);
    try {
      await setPrenotazioneCollaudo(targa, {
        data: dataInput,
        ora,
        ...(luogo ? { luogo } : {}),
        ...(note ? { note } : {}),
      });
      await loadSnapshot();
      setOperation(null);
      showSuccess("Prenotazione collaudo salvata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante il salvataggio.";
      showValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreCollaudoSubmit = async () => {
    if (!operation || operation.kind !== "pre-collaudo") return;
    const dataInput = operation.form.data.trim();
    if (!dataInput) {
      showValidationError("Inserisci la data del pre-collaudo.");
      return;
    }
    if (!parseNextCentroControlloDate(dataInput)) {
      showValidationError("Data non valida. Usa formato gg/mm/aaaa oppure YYYY-MM-DD.");
      return;
    }
    const officina = operation.form.officina.trim();
    if (!officina) {
      showValidationError("Inserisci l'officina del pre-collaudo.");
      return;
    }
    const targa = operation.item.targa;
    if (!targa) {
      showValidationError("Targa mancante per il mezzo selezionato.");
      return;
    }
    const lavoriPrevisti = operation.form.lavoriPrevisti.trim();
    setSubmitting(true);
    try {
      await setPreCollaudo(targa, {
        data: dataInput,
        officina,
        ...(lavoriPrevisti ? { lavoriPrevisti } : {}),
      });
      await loadSnapshot();
      setOperation(null);
      showSuccess("Pre-collaudo salvato.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante il salvataggio.";
      showValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevisioneSubmit = async () => {
    if (!operation || operation.kind !== "revisione") return;
    const dataInput = operation.form.data.trim();
    if (!dataInput) {
      showValidationError("Inserisci la data della revisione.");
      return;
    }
    if (!parseNextCentroControlloDate(dataInput)) {
      showValidationError("Data non valida. Usa formato gg/mm/aaaa oppure YYYY-MM-DD.");
      return;
    }
    const esito = operation.form.esito.trim();
    if (!esito) {
      showValidationError("Inserisci l'esito della revisione.");
      return;
    }
    const targa = operation.item.targa;
    if (!targa) {
      showValidationError("Targa mancante per il mezzo selezionato.");
      return;
    }
    const note = operation.form.note.trim();
    setSubmitting(true);
    try {
      await markRevisioneCompletata(targa, {
        data: dataInput,
        esito,
        ...(note ? { note } : {}),
      });
      await loadSnapshot();
      setOperation(null);
      showSuccess("Revisione registrata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante il salvataggio.";
      showValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrenotazioneSubmit = async () => {
    if (!operation || operation.kind !== "cancella-prenotazione") return;
    const targa = operation.item.targa;
    if (!targa) {
      showValidationError("Targa mancante per il mezzo selezionato.");
      return;
    }
    setSubmitting(true);
    try {
      await setPrenotazioneCollaudo(targa, null);
      await loadSnapshot();
      setOperation(null);
      showSuccess("Prenotazione collaudo cancellata.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore durante la cancellazione.";
      showValidationError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderFeedback = () =>
    feedback ? (
      <div className={`next-shell__scadenze-feedback next-shell__scadenze-feedback--${feedback.tone}`}>
        {feedback.text}
      </div>
    ) : null;

  const renderFieldLabel = (label: string, optional = false) => (
    <span className="next-shell__scadenze-field-label">
      {label}
      {optional ? <span> (opzionale)</span> : null}
    </span>
  );

  const renderOperationPanel = (itemId: string) => {
    if (!operation || operation.item.id !== itemId) return null;
    const targa = operation.item.targa || "-";

    if (operation.kind === "prenotazione") {
      return (
        <section className="next-shell__scadenze-operation" ref={operationPanelRef}>
          <div className="next-shell__scadenze-operation-head">
            <div className="next-shell__scadenze-operation-title">
              {operation.variant === "edit" ? "Modifica prenotazione" : "Prenota collaudo"}{" "}
              <span>-</span> {targa}
            </div>
            <button type="button" className="next-shell__scadenze-operation-cancel" onClick={closeOperation}>
              Annulla
            </button>
          </div>
          <div className="next-shell__scadenze-form-grid">
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Data prenotazione")}
              <input
                className="next-shell__scadenze-input"
                type="date"
                value={operation.form.data}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, data: value } }
                      : current,
                  );
                }}
              />
            </label>
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Ora", true)}
              <input
                className="next-shell__scadenze-input"
                type="time"
                value={operation.form.ora}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, ora: value } }
                      : current,
                  );
                }}
              />
            </label>
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Luogo", true)}
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
                placeholder="es. Officina Rossi, Lugano"
              />
            </label>
            <label className="next-shell__scadenze-field next-shell__scadenze-field--wide">
              {renderFieldLabel("Note", true)}
              <textarea
                className="next-shell__scadenze-textarea"
                value={operation.form.note}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "prenotazione"
                      ? { ...current, form: { ...current.form, note: value } }
                      : current,
                  );
                }}
              />
            </label>
          </div>
          {renderFeedback()}
          <div className="next-shell__scadenze-form-actions">
            <button
              type="button"
              className="next-shell__scadenze-action"
              onClick={closeOperation}
              disabled={submitting}
            >
              Annulla
            </button>
            <button
              type="button"
              className="next-shell__scadenze-action next-shell__scadenze-action--primary"
              onClick={() => void handlePrenotazioneSubmit()}
              disabled={submitting}
            >
              {submitting ? "Salvataggio..." : "Salva prenotazione"}
            </button>
          </div>
        </section>
      );
    }

    if (operation.kind === "pre-collaudo") {
      return (
        <section className="next-shell__scadenze-operation" ref={operationPanelRef}>
          <div className="next-shell__scadenze-operation-head">
            <div className="next-shell__scadenze-operation-title">
              Pre-collaudo <span>-</span> {targa}
            </div>
            <button type="button" className="next-shell__scadenze-operation-cancel" onClick={closeOperation}>
              Annulla
            </button>
          </div>
          <div className="next-shell__scadenze-form-grid">
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Data pre-collaudo")}
              <input
                className="next-shell__scadenze-input"
                type="date"
                value={operation.form.data}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "pre-collaudo"
                      ? { ...current, form: { ...current.form, data: value } }
                      : current,
                  );
                }}
              />
            </label>
            <label className="next-shell__scadenze-field next-shell__scadenze-autocomplete">
              {renderFieldLabel("Officina")}
              <input
                className="next-shell__scadenze-input"
                value={operation.form.officina}
                onFocus={() => setOfficineOpen(true)}
                onBlur={() => setOfficineOpen(false)}
                onChange={(event) => {
                  const value = event.target.value;
                  setOfficineOpen(true);
                  setOperation((current) =>
                    current && current.kind === "pre-collaudo"
                      ? { ...current, form: { ...current.form, officina: value } }
                      : current,
                  );
                }}
                placeholder="Digita o seleziona un'officina"
                autoComplete="off"
              />
              {officineOpen && officine.length > 0 && filteredOfficine.length > 0 ? (
                <div className="next-shell__scadenze-autocomplete-menu">
                  {filteredOfficine.map((officina) => (
                    <button
                      key={officina.id}
                      type="button"
                      className="next-shell__scadenze-autocomplete-option"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setOperation((current) =>
                          current && current.kind === "pre-collaudo"
                            ? { ...current, form: { ...current.form, officina: officina.nome } }
                            : current,
                        );
                        setOfficineOpen(false);
                      }}
                    >
                      <span>{officina.nome}</span>
                      {formatOfficinaMeta(officina) ? <small>{formatOfficinaMeta(officina)}</small> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </label>
            <label className="next-shell__scadenze-field next-shell__scadenze-field--wide">
              {renderFieldLabel("Lavori previsti", true)}
              <textarea
                className="next-shell__scadenze-textarea next-shell__scadenze-textarea--short"
                value={operation.form.lavoriPrevisti}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "pre-collaudo"
                      ? { ...current, form: { ...current.form, lavoriPrevisti: value } }
                      : current,
                  );
                }}
                placeholder="es. prova freni, preparazione collaudo, controllo luci"
              />
            </label>
          </div>
          {renderFeedback()}
          <div className="next-shell__scadenze-form-actions">
            <button
              type="button"
              className="next-shell__scadenze-action"
              onClick={closeOperation}
              disabled={submitting}
            >
              Annulla
            </button>
            <button
              type="button"
              className="next-shell__scadenze-action next-shell__scadenze-action--primary"
              onClick={() => void handlePreCollaudoSubmit()}
              disabled={submitting}
            >
              {submitting ? "Salvataggio..." : "Salva pre-collaudo"}
            </button>
          </div>
        </section>
      );
    }

    if (operation.kind === "revisione") {
      return (
        <section className="next-shell__scadenze-operation" ref={operationPanelRef}>
          <div className="next-shell__scadenze-operation-head">
            <div className="next-shell__scadenze-operation-title">
              Segna revisione fatta <span>-</span> {targa}
            </div>
            <button type="button" className="next-shell__scadenze-operation-cancel" onClick={closeOperation}>
              Annulla
            </button>
          </div>
          <div className="next-shell__scadenze-form-grid">
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Data revisione")}
              <input
                className="next-shell__scadenze-input"
                type="date"
                value={operation.form.data}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "revisione"
                      ? { ...current, form: { ...current.form, data: value } }
                      : current,
                  );
                }}
              />
            </label>
            <label className="next-shell__scadenze-field">
              {renderFieldLabel("Esito")}
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
                placeholder="es. Superata"
              />
            </label>
            <label className="next-shell__scadenze-field next-shell__scadenze-field--wide">
              {renderFieldLabel("Note", true)}
              <textarea
                className="next-shell__scadenze-textarea"
                value={operation.form.note}
                onChange={(event) => {
                  const value = event.target.value;
                  setOperation((current) =>
                    current && current.kind === "revisione"
                      ? { ...current, form: { ...current.form, note: value } }
                      : current,
                  );
                }}
              />
            </label>
          </div>
          {renderFeedback()}
          <div className="next-shell__scadenze-form-actions">
            <button
              type="button"
              className="next-shell__scadenze-action"
              onClick={closeOperation}
              disabled={submitting}
            >
              Annulla
            </button>
            <button
              type="button"
              className="next-shell__scadenze-action next-shell__scadenze-action--primary"
              onClick={() => void handleRevisioneSubmit()}
              disabled={submitting}
            >
              {submitting ? "Salvataggio..." : "Salva revisione"}
            </button>
          </div>
        </section>
      );
    }

    return (
      <section
        className="next-shell__scadenze-operation next-shell__scadenze-operation--danger"
        ref={operationPanelRef}
      >
        <div className="next-shell__scadenze-operation-head">
          <div>
            <div className="next-shell__scadenze-operation-title">
              Cancellare la prenotazione collaudo?
            </div>
            <div className="next-shell__scadenze-operation-subtitle">
              Mezzo {targa} - prenotazione del {formatEditableDate(operation.prenotazione.data) || "-"}
            </div>
          </div>
        </div>
        {renderFeedback()}
        <div className="next-shell__scadenze-form-actions">
          <button
            type="button"
            className="next-shell__scadenze-action"
            onClick={closeOperation}
            disabled={submitting}
          >
            Annulla
          </button>
          <button
            type="button"
            className="next-shell__scadenze-action next-shell__scadenze-action--danger-fill"
            onClick={() => void handleDeletePrenotazioneSubmit()}
            disabled={submitting}
          >
            {submitting ? "Cancellazione..." : "Conferma cancellazione"}
          </button>
        </div>
      </section>
    );
  };

  return (
    <main className="next-shell__scadenze-page">
      <header className="next-shell__scadenze-page-head">
        <div>
          <h1 className="next-shell__scadenze-page-title">Scadenze collaudi</h1>
          <div className="next-shell__scadenze-page-subtitle">{subtitle}</div>
        </div>
        <div className="next-shell__scadenze-mode-switch" role="tablist" aria-label="Filtro scadenze">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "tutte"}
            className={`next-shell__scadenze-mode-tab${
              mode === "tutte" ? " next-shell__scadenze-mode-tab--active" : ""
            }`}
            onClick={() => setMode("tutte")}
          >
            Tutte
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "urgenti"}
            className={`next-shell__scadenze-mode-tab${
              mode === "urgenti" ? " next-shell__scadenze-mode-tab--active" : ""
            }`}
            onClick={() => setMode("urgenti")}
          >
            Urgenti
          </button>
        </div>
      </header>

      {!operation && feedback ? renderFeedback() : null}

      <div className="next-shell__scadenze-stats">
        <div className="next-shell__scadenze-stat next-shell__scadenze-stat--danger">
          <span className="next-shell__scadenze-stat-label">Scadute</span>
          <span className="next-shell__scadenze-stat-value">
            {counters?.revisioniScadute ?? "-"}
          </span>
        </div>
        <div className="next-shell__scadenze-stat next-shell__scadenze-stat--warning">
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
            const tone = getRevisionStatusTone(item);
            const isActive = operation?.item.id === item.id;

            return (
              <article
                key={item.id}
                className={`next-shell__scadenze-row next-shell__scadenze-row--${tone}${
                  isActive ? " next-shell__scadenze-row--active" : ""
                }`}
              >
                <div className="next-shell__scadenze-row-top">
                  <div className="next-shell__scadenze-row-main">
                    {item.targa ? (
                      <button
                        type="button"
                        className="next-shell__scadenze-targa"
                        onClick={() => navigate(buildNextDossierPath(item.targa || ""))}
                      >
                        {item.targa}
                      </button>
                    ) : (
                      <div className="next-shell__scadenze-targa">-</div>
                    )}
                    <div className="next-shell__scadenze-mezzo">
                      {mezzoLabel || "Mezzo non indicato"}
                    </div>
                  </div>
                  <span
                    className={`next-shell__scadenze-status-pill next-shell__scadenze-status-pill--${tone}`}
                  >
                    {getRevisionStatusLabel(item)}
                  </span>
                </div>

                <div className="next-shell__scadenze-meta-grid">
                  <span className="next-shell__scadenze-meta-label">Scadenza</span>
                  <span>{formatDateLabel(item.scadenzaTs)}</span>
                  <span className="next-shell__scadenze-meta-label">Delta</span>
                  <span className={`next-shell__scadenze-delta next-shell__scadenze-delta--${tone}`}>
                    {formatGiorniLabel(item.giorni)}
                  </span>
                  <span className="next-shell__scadenze-meta-label">Prenotazione</span>
                  <span
                    className={`next-shell__scadenze-meta-value next-shell__scadenze-meta-value--wide${
                      prenotazione ? "" : " next-shell__scadenze-meta-value--muted"
                    }`}
                  >
                    {formatPrenotazioneSummary(prenotazione)}
                  </span>
                  <span className="next-shell__scadenze-meta-label">Pre-collaudo</span>
                  <span
                    className={`next-shell__scadenze-meta-value next-shell__scadenze-meta-value--wide${
                      preCollaudo ? "" : " next-shell__scadenze-meta-value--muted"
                    }`}
                  >
                    {formatPreCollaudoSummary(preCollaudo)}
                  </span>
                </div>

                {canOperate ? (
                  <div className="next-shell__scadenze-actions">
                    {!prenCompletata ? (
                      <button
                        type="button"
                        className="next-shell__scadenze-action next-shell__scadenze-action--primary"
                        onClick={() => openOperation(buildRevisioneForm(item))}
                      >
                        Segna revisione fatta
                      </button>
                    ) : null}
                    {prenotazione && !prenCompletata ? (
                      <>
                        <button
                          type="button"
                          className="next-shell__scadenze-action"
                          onClick={() => openOperation(buildPrenotazioneForm(item, "edit"))}
                        >
                          Modifica prenotazione
                        </button>
                        <button
                          type="button"
                          className="next-shell__scadenze-action next-shell__scadenze-action--danger"
                          onClick={() => openOperation(buildDeletePrenotazioneOperation(item, prenotazione))}
                        >
                          Cancella
                        </button>
                      </>
                    ) : !prenotazione ? (
                      <button
                        type="button"
                        className="next-shell__scadenze-action"
                        onClick={() => openOperation(buildPrenotazioneForm(item, "create"))}
                      >
                        Prenota collaudo
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="next-shell__scadenze-action"
                      onClick={() => openOperation(buildPreCollaudoForm(item, hasPreCollaudo ? "edit" : "create"))}
                    >
                      Pre-collaudo
                    </button>
                  </div>
                ) : null}

                {renderOperationPanel(item.id)}
              </article>
            );
          })
        )}
      </div>
    </main>
  );
}
