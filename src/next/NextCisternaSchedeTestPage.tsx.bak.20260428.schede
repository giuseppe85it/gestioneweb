import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { monthLabel } from "../cisterna/collections";
import {
  readNextCisternaSchedaDetail,
  readNextCisternaSnapshot,
  type NextCisternaSchedaDetail,
  type NextCisternaSnapshot,
} from "./domain/nextCisternaDomain";
import { formatEditableDateUI } from "./nextDateFormat";
import "../pages/CisternaCaravate/CisternaSchedeTest.css";

type Mode = "manual" | "ia";
type AziendaOption = "cementi" | "import";
type RowStatus = "OK" | "INCERTO" | "VUOTO";

type ManualRow = {
  id: string;
  data: string;
  targa: string;
  nome: string;
  litri: string;
  azienda: AziendaOption;
  aziendaConfirmed: boolean;
};

type IaRow = {
  id: string;
  data: string;
  targa: string;
  litri: string;
  note: string;
  dataStatus: RowStatus;
  targaStatus: RowStatus;
  litriStatus: RowStatus;
  verified: boolean;
};

type PendingSaveState = {
  mode: Mode;
  rowCount: number;
  verifiedCount: number;
  unverifiedCount: number;
};

type ActivePreview = {
  src: string;
  label: string;
};

const YEAR_MONTH_REGEX = /^(\d{4})-(\d{2})$/;
const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const DEFAULT_MANUAL_ROWS = 6;

function makeRowId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDateInput(value: string): string {
  const cleaned = String(value ?? "").replace(/[^\d/]/g, "");
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 8 && !cleaned.includes("/")) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  return cleaned;
}

function isValidDate(value: string): boolean {
  return DATE_REGEX.test(String(value ?? "").trim());
}

function parseLitri(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(String(value).replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function formatLitri(value: string | number | null | undefined): string {
  const parsed = parseLitri(value);
  if (parsed == null) return "-";
  return parsed.toFixed(2).replace(/\.?0+$/, "");
}

function normalizeAzienda(value: string | null | undefined): AziendaOption {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "import" || raw === "ghielmiimport" || raw === "ghielmimport"
    ? "import"
    : "cementi";
}

function createEmptyManualRow(seedDate = ""): ManualRow {
  return {
    id: makeRowId(),
    data: seedDate,
    targa: "",
    nome: "",
    litri: "",
    azienda: "cementi",
    aziendaConfirmed: false,
  };
}

function createInitialManualRows(seedDate: string): ManualRow[] {
  return Array.from({ length: DEFAULT_MANUAL_ROWS }, (_, index) =>
    createEmptyManualRow(index === 0 ? seedDate : ""),
  );
}

function normalizeRowStatus(value: string, isKnownTarga = true): RowStatus {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "VUOTO";
  if (!isKnownTarga) return "INCERTO";
  return "OK";
}

function detailRowToManualRow(row: NextCisternaSchedaDetail["rows"][number]): ManualRow {
  return {
    id: makeRowId(),
    data: row.data === "-" ? "" : row.data,
    targa: row.targa === "-" ? "" : row.targa,
    nome: row.nome === "-" ? "" : row.nome,
    litri: row.litri == null ? "" : String(row.litri),
    azienda: normalizeAzienda(row.azienda),
    aziendaConfirmed: true,
  };
}

function detailRowToIaRow(
  row: NextCisternaSchedaDetail["rows"][number],
  knownTarghe: Set<string>,
): IaRow {
  const data = row.data === "-" ? "" : row.data;
  const targa = row.targa === "-" ? "" : row.targa;
  const litri = row.litri == null ? "" : String(row.litri);
  const normalizedTarga = targa.trim().toUpperCase();
  const known = !normalizedTarga || knownTarghe.has(normalizedTarga);
  const reviewRaw = String(row.statoRevisione ?? "").toLowerCase();

  return {
    id: makeRowId(),
    data,
    targa,
    litri,
    note: row.note || (reviewRaw && reviewRaw !== "n/d" ? row.statoRevisione : ""),
    dataStatus: normalizeRowStatus(data),
    targaStatus: normalizeRowStatus(targa, known),
    litriStatus: normalizeRowStatus(litri),
    verified:
      data.trim() !== "" &&
      targa.trim() !== "" &&
      parseLitri(litri) != null &&
      !reviewRaw.includes("verifica") &&
      !reviewRaw.includes("incerto"),
  };
}

function readMonthParam(search: string) {
  const value = String(new URLSearchParams(search).get("month") ?? "").trim();
  return YEAR_MONTH_REGEX.test(value) ? value : null;
}

function readEditParam(search: string) {
  return String(new URLSearchParams(search).get("edit") ?? "").trim() || null;
}

function getMonthLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return YEAR_MONTH_REGEX.test(value) ? monthLabel(value) : null;
}

function hasManualValues(row: ManualRow): boolean {
  return Boolean(row.data || row.targa || row.nome || row.litri);
}

function buildManualValidation(rows: ManualRow[], knownTarghe: Set<string>) {
  const reasonsByRow: Record<number, string[]> = {};
  rows.forEach((row, index) => {
    if (!hasManualValues(row)) return;
    const reasons: string[] = [];
    const normalizedDate = normalizeDateInput(row.data);
    const normalizedTarga = row.targa.trim().toUpperCase();
    const litriValue = parseLitri(row.litri);
    const targaKnown = normalizedTarga ? knownTarghe.has(normalizedTarga) : false;

    if (!normalizedDate) {
      reasons.push("Data mancante");
    } else if (!isValidDate(normalizedDate)) {
      reasons.push("Data non valida");
    }

    if (!normalizedTarga) {
      reasons.push("Targa mancante");
    }

    if (!row.litri.trim()) {
      reasons.push("Litri mancanti");
    } else if (litriValue == null || litriValue <= 0) {
      reasons.push("Litri non validi");
    }

    if (normalizedTarga && !targaKnown && !row.aziendaConfirmed) {
      reasons.push("Azienda obbligatoria per targa non in elenco");
    }

    if (reasons.length > 0) {
      reasonsByRow[index] = reasons;
    }
  });

  return reasonsByRow;
}

function buildManualValidationMessage(reasonsByRow: Record<number, string[]>): string {
  const indexes = Object.keys(reasonsByRow)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

  if (indexes.length === 0) return "";

  const rowsLabel = indexes.map((index) => index + 1).join(", ");
  const reasonSet = new Set<string>();
  indexes.forEach((index) => {
    (reasonsByRow[index] ?? []).forEach((reason) => reasonSet.add(reason));
  });

  const parts = [`Errore: controlla le righe ${rowsLabel}.`];
  if (reasonSet.has("Data mancante") || reasonSet.has("Data non valida")) {
    parts.push("Verifica il campo Data.");
  }
  if (reasonSet.has("Targa mancante")) {
    parts.push("Compila la Targa.");
  }
  if (reasonSet.has("Litri mancanti") || reasonSet.has("Litri non validi")) {
    parts.push("Compila i Litri con un valore valido.");
  }
  if (reasonSet.has("Azienda obbligatoria per targa non in elenco")) {
    parts.push("Per le targhe non in elenco seleziona l'azienda.");
  }

  return parts.join(" ");
}

function buildSupportMatches(snapshot: NextCisternaSnapshot | null, row: ManualRow) {
  if (!snapshot) {
    return {
      status: "missing" as const,
      items: [] as NextCisternaSnapshot["archive"]["supportRefuels"],
      total: 0,
      diff: null as number | null,
    };
  }

  const normalizedDate = normalizeDateInput(row.data);
  const normalizedTarga = row.targa.trim().toUpperCase();
  if (!normalizedDate && !normalizedTarga) {
    return {
      status: "missing" as const,
      items: [] as NextCisternaSnapshot["archive"]["supportRefuels"],
      total: 0,
      diff: null as number | null,
    };
  }

  const items = snapshot.archive.supportRefuels.filter((item) => {
    const sameDate = normalizedDate ? item.dateLabel === normalizedDate : true;
    const sameTarga = normalizedTarga ? item.targa === normalizedTarga : true;
    return sameDate && sameTarga;
  });

  if (items.length === 0) {
    return { status: "none" as const, items, total: 0, diff: null as number | null };
  }

  const total = items.reduce((sum, item) => sum + item.litri, 0);
  const litriValue = parseLitri(row.litri);
  const diff = litriValue == null ? null : litriValue - total;

  return {
    status:
      diff == null ? ("match" as const) : Math.abs(diff) <= 2 ? ("match" as const) : ("diff" as const),
    items,
    total,
    diff,
  };
}

export default function NextCisternaSchedeTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedMonth = useMemo(() => readMonthParam(location.search), [location.search]);
  const editId = useMemo(() => readEditParam(location.search), [location.search]);
  const todayLabel = useMemo(() => formatEditableDateUI(new Date()), []);
  const [mode, setMode] = useState<Mode>("manual");
  const [snapshot, setSnapshot] = useState<NextCisternaSnapshot | null>(null);
  const [detail, setDetail] = useState<NextCisternaSchedaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(requestedMonth ?? "");
  const [manualRows, setManualRows] = useState<ManualRow[]>(() => createInitialManualRows(todayLabel));
  const [manualError, setManualError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [croppedPreview, setCroppedPreview] = useState("");
  const [rowCountInput, setRowCountInput] = useState(35);
  const [showGrid, setShowGrid] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const [iaRows, setIaRows] = useState<IaRow[]>([]);
  const [iaError, setIaError] = useState("");
  const [activePreview, setActivePreview] = useState<ActivePreview | null>(null);
  const [pendingSave, setPendingSave] = useState<PendingSaveState | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const nextSnapshot = await readNextCisternaSnapshot(
          selectedMonth || requestedMonth || undefined,
          { includeCloneOverlays: false },
        );
        if (cancelled) return;
        setSnapshot(nextSnapshot);
        setSelectedMonth(nextSnapshot.monthKey);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [requestedMonth, selectedMonth]);

  const knownTarghe = useMemo(() => {
    const next = new Set<string>();
    snapshot?.archive.supportRefuels.forEach((item) => {
      if (item.targa) next.add(item.targa.trim().toUpperCase());
    });
    snapshot?.archive.schede.forEach((item) => {
      if (item.targa) next.add(item.targa.trim().toUpperCase());
    });
    snapshot?.report.perTarga.forEach((item) => {
      if (item.targa) next.add(item.targa.trim().toUpperCase());
    });
    detail?.rows.forEach((row) => {
      if (row.targa && row.targa !== "-") next.add(row.targa.trim().toUpperCase());
    });
    return next;
  }, [detail, snapshot]);

  useEffect(() => {
    if (!editId) {
      setDetail(null);
      setEditError("");
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setEditLoading(true);
        setEditError("");
        const nextDetail = await readNextCisternaSchedaDetail(editId, {
          includeCloneOverlays: false,
        });
        if (cancelled) return;
        if (!nextDetail) {
          setDetail(null);
          setEditError("Scheda non trovata nell'archivio reale del modulo.");
          return;
        }
        setDetail(nextDetail);
      } catch {
        if (!cancelled) {
          setEditError("Errore durante il caricamento della scheda.");
          setDetail(null);
        }
      } finally {
        if (!cancelled) {
          setEditLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  useEffect(() => {
    if (!detail) {
      if (!editId) {
        setMode("manual");
        setManualRows(createInitialManualRows(todayLabel));
        setIaRows([]);
      }
      return;
    }

    const nextMode: Mode = detail.sourceLabel === "IA" ? "ia" : "manual";
    const nextManualRows =
      detail.rows.length > 0
        ? detail.rows.map((row) => detailRowToManualRow(row))
        : createInitialManualRows(todayLabel);
    const nextIaRows = detail.rows.map((row) => detailRowToIaRow(row, knownTarghe));

    setMode(nextMode);
    setManualRows(nextManualRows);
    setIaRows(nextIaRows);
  }, [detail, editId, knownTarghe, todayLabel]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const currentMonthKey = snapshot?.monthKey ?? selectedMonth ?? requestedMonth ?? "";
  const currentMonthLabel = snapshot?.monthLabel ?? getMonthLabel(currentMonthKey) ?? currentMonthKey;
  const pageTitle = editId
    ? detail?.monthKey
      ? `Modifica scheda (${getMonthLabel(detail.monthKey) ?? detail.monthKey})`
      : "Modifica scheda"
    : "Schede Carburante (Cisterna Caravate)";
  const cisternaPath = currentMonthKey
    ? `/next/cisterna?month=${encodeURIComponent(currentMonthKey)}`
    : "/next/cisterna";
  const cisternaIaPath = currentMonthKey
    ? `/next/cisterna/ia?month=${encodeURIComponent(currentMonthKey)}`
    : "/next/cisterna/ia";

  const manualValidation = useMemo(
    () => buildManualValidation(manualRows, knownTarghe),
    [knownTarghe, manualRows],
  );
  const manualRowsForSave = useMemo(
    () => manualRows.filter((row) => hasManualValues(row)),
    [manualRows],
  );
  const manualInvalidCount = useMemo(
    () => Object.keys(manualValidation).length,
    [manualValidation],
  );
  const iaRowsProblematic = useMemo(
    () =>
      iaRows.filter(
        (row) =>
          row.dataStatus !== "OK" || row.targaStatus !== "OK" || row.litriStatus !== "OK",
      ).length,
    [iaRows],
  );
  const iaNeedsReview = Boolean(detail?.needsReview) || iaRowsProblematic > 0 || iaRows.some((row) => !row.verified);
  const rawLines = useMemo(
    () =>
      iaRows.map((row) =>
        [row.data || "-", row.targa || "-", row.litri || "-", row.note || "-"].join(" | "),
      ),
    [iaRows],
  );

  const clearRuntimeErrors = () => {
    setManualError("");
    setIaError("");
  };

  const handleMonthChange = (value: string) => {
    clearRuntimeErrors();
    setSelectedMonth(value);
    if (!editId) return;
    navigate(`/next/cisterna/schede-test?month=${encodeURIComponent(value)}`, {
      replace: false,
    });
  };

  const updateManualRow = (rowId: string, patch: Partial<ManualRow>) => {
    clearRuntimeErrors();
    setManualRows((current) =>
      current.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  };

  const addManualRow = () => {
    clearRuntimeErrors();
    setManualRows((current) => [...current, createEmptyManualRow("")]);
  };

  const removeManualRow = (rowId: string) => {
    clearRuntimeErrors();
    setManualRows((current) => current.filter((row) => row.id !== rowId));
  };

  const openManualConfirm = () => {
    clearRuntimeErrors();
    if (manualRowsForSave.length === 0) {
      setManualError("Aggiungi righe per salvare.");
      return;
    }
    if (manualInvalidCount > 0) {
      setManualError(buildManualValidationMessage(manualValidation));
      return;
    }
    setPendingSave({
      mode: "manual",
      rowCount: manualRowsForSave.length,
      verifiedCount: manualRowsForSave.length,
      unverifiedCount: 0,
    });
  };

  const handleFile = (file: File | null) => {
    clearRuntimeErrors();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(file);
    setActivePreview(null);
    setCalibrationMode(false);
    setCalibrationStep(0);
    setCalibrationComplete(false);
    if (file && String(file.type || "").startsWith("image/")) {
      const nextPreview = URL.createObjectURL(file);
      setPreviewUrl(nextPreview);
      setCroppedPreview(nextPreview);
      return;
    }
    setPreviewUrl("");
    setCroppedPreview("");
  };

  const handleIaFieldChange = (rowId: string, patch: Partial<IaRow>) => {
    clearRuntimeErrors();
    setIaRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;
        const next = { ...row, ...patch };
        const normalizedTarga = next.targa.trim().toUpperCase();
        const known = !normalizedTarga || knownTarghe.has(normalizedTarga);
        return {
          ...next,
          dataStatus: normalizeRowStatus(next.data),
          targaStatus: normalizeRowStatus(next.targa, known),
          litriStatus: normalizeRowStatus(next.litri),
        };
      }),
    );
  };

  const resetIaLocalState = () => {
    clearRuntimeErrors();
    setPendingSave(null);
    setSelectedFile(null);
    setActivePreview(null);
    setCalibrationMode(false);
    setCalibrationStep(0);
    setCalibrationComplete(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    setCroppedPreview("");
    if (detail) {
      setIaRows(detail.rows.map((row) => detailRowToIaRow(row, knownTarghe)));
      return;
    }
    setIaRows([]);
  };

  const handleBlockedAction = (message: string) => {
    setIaError(message);
  };

  const handleExtract = () => {
    if (!selectedFile || !croppedPreview) {
      setIaError("Seleziona prima una foto scheda cartacea.");
      return;
    }
    handleBlockedAction(
      "Nel clone read-only l'estrazione IA delle schede viene fermata prima di upload, handoff o salvataggi.",
    );
  };

  const handleQuickTest = () => {
    if (!croppedPreview) {
      setIaError("Carica prima una foto per attivare il test.");
      return;
    }
    handleBlockedAction(
      "Nel clone read-only il test rapido dell'estrazione resta bloccato: nessuna chiamata IA viene eseguita.",
    );
  };

  const openIaConfirm = () => {
    clearRuntimeErrors();
    if (iaRows.length === 0) {
      setIaError("Nessuna riga disponibile da confermare.");
      return;
    }
    const verifiedCount = iaRows.filter((row) => row.verified).length;
    setPendingSave({
      mode: "ia",
      rowCount: iaRows.length,
      verifiedCount,
      unverifiedCount: iaRows.length - verifiedCount,
    });
  };

  const confirmBlockedSave = () => {
    if (!pendingSave) return;
    if (pendingSave.mode === "manual") {
      setManualError(
        "Nel clone read-only il salvataggio della scheda resta bloccato: nessuna scrittura reale o clone-only viene eseguita.",
      );
    } else {
      setIaError(
        "Nel clone read-only conferma finale, salvataggio e aggiornamento della scheda restano bloccati.",
      );
    }
    setPendingSave(null);
  };

  const archiveItems = snapshot?.archive.schede ?? [];

  return (
    <div className="cisterna-schede-page">
      <div className="cisterna-schede-shell">
        <header className="cisterna-schede-head">
          <div className="cisterna-schede-title">
            <img
              src="/logo.png"
              alt="Logo"
              className="cisterna-schede-logo"
              onClick={() => navigate("/next/centro-controllo")}
            />
            <div>
              <h1>{pageTitle}</h1>
              <p>Inserimento manuale e digitalizzazione da foto con correzione assistita.</p>
              <p style={{ marginTop: 8, color: "#4a6078" }}>
                Nel clone restano disponibili archivio reale, form locale, crop e
                calibrazione visiva, ma estrazione IA, upload ritaglio e save/update
                vengono fermati dalla barriera read-only.
              </p>
            </div>
          </div>
          <div className="cisterna-schede-actions">
            {editId ? (
              <button type="button" onClick={() => navigate(cisternaPath)}>
                Annulla
              </button>
            ) : null}
            <button type="button" onClick={() => navigate(cisternaPath)}>
              Torna a Cisterna
            </button>
            <button type="button" onClick={() => navigate(cisternaIaPath)}>
              IA Cisterna
            </button>
          </div>
        </header>

        <div className="cisterna-schede-monthbar">
          <label className="cisterna-schede-month-label" htmlFor="cisterna-schede-month">
            Mese scheda
          </label>
          <select
            id="cisterna-schede-month"
            className="cisterna-schede-month-select"
            value={currentMonthKey}
            onChange={(event) => handleMonthChange(event.target.value)}
          >
            {(snapshot?.availableMonths ?? [currentMonthKey].filter(Boolean)).map((monthKeyValue) => (
              <option key={monthKeyValue} value={monthKeyValue}>
                {getMonthLabel(monthKeyValue) ?? monthKeyValue}
              </option>
            ))}
          </select>
        </div>

        {editId ? (
          <div className="cisterna-schede-edit-info">
            <span className="cisterna-schede-edit-badge">EDIT MODE</span>
            {editLoading ? <span>Caricamento scheda...</span> : null}
            {detail ? (
              <span>
                {detail.sourceLabel} | {detail.rowCount} righe |{" "}
                {detail.createdAtLabel ?? getMonthLabel(detail.monthKey) ?? "-"}
              </span>
            ) : null}
            {editError ? (
              <div className="cisterna-schede-edit-error">
                <span>{editError}</span>
                <button type="button" onClick={() => navigate(cisternaPath)}>
                  Torna a Archivio
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <section className="cisterna-schede-card">
          <div className="cisterna-schede-manual-head">
            <div>
              <h2>Archivio schede del mese</h2>
              <p>
                Storico reale delle schede disponibili per{" "}
                {currentMonthLabel || "il mese selezionato"}.
              </p>
            </div>
          </div>
          {loading ? <div className="cisterna-schede-ok">Caricamento archivio schede...</div> : null}
          {archiveItems.length === 0 ? (
            <div className="cisterna-schede-error">
              Nessuna scheda disponibile per il mese selezionato.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {archiveItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #dce8f6",
                    borderRadius: 10,
                    padding: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "center",
                    background: "#f7fbff",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong>{item.dateLabel}</strong>
                    <span>
                      {item.sourceLabel} - {item.rowCount} righe
                    </span>
                    {item.targa ? <span>Targa: {item.targa}</span> : null}
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}
                  >
                    <span
                      className={`cisterna-schede-badge ${item.needsReview ? "warn" : "ok"}`}
                    >
                      {item.needsReview ? "Da verificare" : "OK"}
                    </span>
                    <button
                      type="button"
                      className="cisterna-schede-suggest-btn"
                      onClick={() =>
                        navigate(
                          `/next/cisterna/schede-test?edit=${encodeURIComponent(item.id)}&month=${encodeURIComponent(currentMonthKey)}`,
                        )
                      }
                      title="Apri o modifica questa scheda"
                    >
                      Apri/Modifica
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="cisterna-schede-tabs">
          <button
            type="button"
            className={mode === "manual" ? "active" : ""}
            onClick={() => {
              clearRuntimeErrors();
              setMode("manual");
            }}
          >
            Inserimento manuale
          </button>
          <button
            type="button"
            className={mode === "ia" ? "active" : ""}
            onClick={() => {
              clearRuntimeErrors();
              setMode("ia");
            }}
          >
            Da foto (IA)
          </button>
        </div>

        {mode === "manual" ? (
          <section className="cisterna-schede-card">
            <div className="cisterna-schede-manual-head">
              <div>
                <h2>Inserimento manuale</h2>
                <p>Compila la scheda carburante come da modulo cartaceo.</p>
              </div>
              <div className="cisterna-schede-manual-head-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setManualError(
                      "Nel clone read-only la precompilazione da Autisti resta bloccata prima di qualsiasi scrittura o patch locale.",
                    )
                  }
                >
                  Precompila da Autisti (supporto)
                </button>
                <button type="button" onClick={addManualRow}>
                  Aggiungi riga
                </button>
              </div>
            </div>

            {manualError ? <div className="cisterna-schede-error">{manualError}</div> : null}

            <div className="cisterna-schede-table-wrap">
              <table className="cisterna-schede-table cisterna-schede-table--manual">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Targa</th>
                    <th>Nome</th>
                    <th>Azienda</th>
                    <th>Litri</th>
                    <th>Autisti (dettaglio)</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row, index) => {
                    const reasons = manualValidation[index] ?? [];
                    const isInvalid = reasons.length > 0;
                    const normalizedTarga = row.targa.trim().toUpperCase();
                    const targaKnown = normalizedTarga ? knownTarghe.has(normalizedTarga) : true;
                    const supportMatch = buildSupportMatches(snapshot, row);
                    const litriValue = parseLitri(row.litri);
                    const needsAzienda = reasons.includes(
                      "Azienda obbligatoria per targa non in elenco",
                    );

                    return (
                      <tr
                        key={row.id}
                        className={
                          isInvalid
                            ? "cisterna-row-invalid"
                            : supportMatch.status === "diff"
                              ? "cisterna-schede-row-verify"
                              : undefined
                        }
                      >
                        <td>
                          <div className="cisterna-schede-cell-edit cisterna-schede-cell-edit--date">
                            <div className="cisterna-date-cell">
                              <input
                                className={`cisterna-schede-input ${
                                  reasons.some((reason) => reason.startsWith("Data")) ? "invalid" : ""
                                }`}
                                value={row.data}
                                onChange={(event) =>
                                  updateManualRow(row.id, {
                                    data: normalizeDateInput(event.target.value),
                                  })
                                }
                                placeholder="gg/mm/aaaa"
                                aria-label={`Data riga ${index + 1}`}
                              />
                              <div className="cisterna-schede-date-tools">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateManualRow(row.id, {
                                      data: formatEditableDateUI(new Date()),
                                    })
                                  }
                                >
                                  Oggi
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const date = new Date();
                                    date.setDate(date.getDate() - 1);
                                    updateManualRow(row.id, {
                                      data: formatEditableDateUI(date),
                                    });
                                  }}
                                >
                                  Ieri
                                </button>
                              </div>
                            </div>
                            {row.data.trim() && !isValidDate(normalizeDateInput(row.data)) ? (
                              <span className="cisterna-schede-badge incerto">Formato</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-cell-edit">
                            <input
                              className={`cisterna-schede-input ${
                                reasons.some((reason) => reason.startsWith("Targa")) ? "invalid" : ""
                              }`}
                              value={row.targa}
                              onChange={(event) =>
                                updateManualRow(row.id, {
                                  targa: event.target.value.toUpperCase(),
                                  aziendaConfirmed: row.aziendaConfirmed,
                                })
                              }
                              placeholder="Targa"
                              aria-label={`Targa riga ${index + 1}`}
                            />
                            {normalizedTarga && !targaKnown ? (
                              <span className="cisterna-schede-badge incerto">NON IN ELENCO</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-cell-edit">
                            <input
                              className="cisterna-schede-input"
                              value={row.nome}
                              onChange={(event) =>
                                updateManualRow(row.id, { nome: event.target.value })
                              }
                              placeholder="Nome"
                              aria-label={`Nome riga ${index + 1}`}
                            />
                            {row.targa.trim() && !row.nome.trim() ? (
                              <span className="cisterna-schede-badge incerto">DA VERIFICARE</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-cell-edit">
                            <select
                              className={`cisterna-schede-input ${needsAzienda ? "invalid" : ""}`}
                              value={row.azienda}
                              onChange={(event) =>
                                updateManualRow(row.id, {
                                  azienda: normalizeAzienda(event.target.value),
                                  aziendaConfirmed: true,
                                })
                              }
                            >
                              <option value="cementi">GHIELMICEMENTI</option>
                              <option value="import">GHIELMIIMPORT</option>
                            </select>
                            {needsAzienda ? (
                              <span className="cisterna-schede-badge warn">SELEZIONA AZIENDA</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-cell-edit">
                            <input
                              className={`cisterna-schede-input ${
                                reasons.some((reason) => reason.startsWith("Litri")) ? "invalid" : ""
                              }`}
                              type="number"
                              min={0}
                              step={0.1}
                              value={row.litri}
                              onChange={(event) =>
                                updateManualRow(row.id, { litri: event.target.value })
                              }
                              aria-label={`Litri riga ${index + 1}`}
                            />
                            {row.litri.trim() && (litriValue == null || litriValue <= 0) ? (
                              <span className="cisterna-schede-badge incerto">Valore</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-autisti">
                            {supportMatch.status === "missing" ? (
                              <span className="cisterna-schede-autisti-empty">-</span>
                            ) : supportMatch.status === "none" ? (
                              <span className="cisterna-schede-autisti-empty">
                                Nessun dato autisti
                              </span>
                            ) : (
                              <>
                                <div className="cisterna-schede-autisti-list">
                                  {supportMatch.items.slice(0, 5).map((item) => (
                                    <div key={item.id} className="cisterna-schede-autisti-item">
                                      <span>{item.autista || "-"}</span>
                                      <strong>{formatLitri(item.litri)}</strong>
                                    </div>
                                  ))}
                                </div>
                                <div className="cisterna-schede-autisti-meta">
                                  <span>Somma autisti: {formatLitri(supportMatch.total)}</span>
                                  <span>
                                    Differenza:{" "}
                                    {supportMatch.diff == null ? "-" : formatLitri(supportMatch.diff)}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="cisterna-schede-manual-actions">
                            <button type="button" className="secondary" onClick={() => removeManualRow(row.id)}>
                              Rimuovi
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
        {mode === "ia" ? (
          <>
            <section className="cisterna-schede-card">
              <label className="cisterna-schede-field">
                <span>Foto scheda cartacea</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                />
              </label>

              <div className="cisterna-schede-row">
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={!selectedFile || !croppedPreview}
                >
                  Estrai da ritaglio
                </button>
                <button
                  type="button"
                  onClick={handleQuickTest}
                  disabled={!croppedPreview}
                >
                  Estrai rapido (senza upload)
                </button>
                <button
                  type="button"
                  onClick={openIaConfirm}
                  disabled={iaRows.length === 0}
                >
                  {editId ? "Salva modifiche" : "Conferma e salva"}
                </button>
                <button type="button" className="secondary" onClick={resetIaLocalState}>
                  Annulla
                </button>
              </div>

              {iaError ? <div className="cisterna-schede-error">{iaError}</div> : null}

              {croppedPreview ? (
                <div className="cisterna-schede-crop">
                  <div className="cisterna-schede-preview">
                    <img src={croppedPreview} alt="Preview scheda" />
                    {calibrationMode ? (
                      <svg
                        className={`cisterna-schede-calib-svg ${calibrationMode ? "active" : ""}`}
                        viewBox="0 0 1 1"
                        preserveAspectRatio="none"
                      >
                        {showGrid
                          ? Array.from({ length: Math.max(0, rowCountInput - 1) }).map((_, index) => {
                              const y = (index + 1) / rowCountInput;
                              return (
                                <line
                                  key={`grid-${index}`}
                                  x1="0"
                                  y1={y}
                                  x2="1"
                                  y2={y}
                                  className="cisterna-schede-grid-line"
                                />
                              );
                            })
                          : null}
                        <polygon
                          points="0.06,0.08 0.32,0.08 0.32,0.94 0.06,0.94"
                          className="cisterna-schede-calib-poly data active"
                        />
                        <polygon
                          points="0.35,0.08 0.66,0.08 0.66,0.94 0.35,0.94"
                          className="cisterna-schede-calib-poly targa active"
                        />
                        <polygon
                          points="0.7,0.08 0.92,0.08 0.92,0.94 0.7,0.94"
                          className="cisterna-schede-calib-poly litri active"
                        />
                      </svg>
                    ) : null}
                  </div>

                  <div className="cisterna-schede-crop-controls">
                    <label className="cisterna-schede-zoom">
                      Zoom
                      <input type="range" min={1} max={3} step={0.05} value={1} readOnly />
                    </label>
                    <button type="button" onClick={() => setCroppedPreview(previewUrl)}>
                      Adatta alla tabella
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setIaError(
                          "Nel clone read-only il salvataggio del ritaglio su archivio resta bloccato.",
                        )
                      }
                    >
                      Salva ritaglio
                    </button>
                    <label className="cisterna-schede-rowcount">
                      Righe tabella
                      <input
                        type="number"
                        min={5}
                        max={80}
                        value={rowCountInput}
                        onChange={(event) => {
                          clearRuntimeErrors();
                          setRowCountInput(Number(event.target.value));
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        clearRuntimeErrors();
                        setCalibrationMode(true);
                        setCalibrationStep(0);
                        setCalibrationComplete(false);
                      }}
                    >
                      Calibra colonne (prospettiva)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearRuntimeErrors();
                        setCalibrationMode(false);
                        setCalibrationStep(0);
                        setCalibrationComplete(false);
                      }}
                      disabled={!calibrationMode && !calibrationComplete}
                    >
                      Cancella calibrazione
                    </button>
                    <label className="cisterna-schede-toggle">
                      <input
                        type="checkbox"
                        checked={showGrid}
                        onChange={(event) => {
                          clearRuntimeErrors();
                          setShowGrid(event.target.checked);
                        }}
                      />
                      Mostra griglia
                    </label>
                  </div>

                  {calibrationMode ? (
                    <>
                      <div className="cisterna-schede-calib-hint">
                        {calibrationComplete ? (
                          "Calibrazione completa: salva per usarla nell'estrazione."
                        ) : (
                          <>
                            Seleziona colonna: {["DATA", "TARGA", "LITRI"][calibrationStep]} (4
                            punti: TL, TR, BR, BL)
                          </>
                        )}
                      </div>
                      <div className="cisterna-schede-calib-tools">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            clearRuntimeErrors();
                            setCalibrationStep((current) => Math.max(0, current - 1));
                            setCalibrationComplete(false);
                          }}
                        >
                          Annulla ultimo punto
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            clearRuntimeErrors();
                            setCalibrationComplete(false);
                          }}
                        >
                          Reset colonna
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            clearRuntimeErrors();
                            setCalibrationStep(0);
                            setCalibrationComplete(false);
                          }}
                        >
                          Reset tutto
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setIaError(
                              "Nel clone read-only il salvataggio della calibrazione resta bloccato.",
                            )
                          }
                        >
                          Salva calibrazione
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            clearRuntimeErrors();
                            setCalibrationStep((current) => {
                              const next = Math.min(2, current + 1);
                              setCalibrationComplete(next === 2);
                              return next;
                            });
                          }}
                        >
                          Avanza nella preview
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </section>

            {iaRows.length > 0 ? (
              <section className="cisterna-schede-card">
                <div className="cisterna-schede-summary">
                  <div>
                    <strong>Righe estratte</strong>
                    <span>{iaRows.length}</span>
                  </div>
                  <div>
                    <strong>Righe con problemi</strong>
                    <span>{iaRowsProblematic}</span>
                  </div>
                  <div>
                    <strong>Righe verificate</strong>
                    <span>{iaRows.filter((row) => row.verified).length}</span>
                  </div>
                  <div>
                    <strong>Revisione richiesta</strong>
                    <span>{iaNeedsReview ? "Si" : "No"}</span>
                  </div>
                </div>

                <div className="cisterna-schede-table-wrap">
                  <table className="cisterna-schede-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Targa</th>
                        <th>Litri</th>
                        <th>Note</th>
                        <th>Verificato</th>
                        <th>Anteprima</th>
                      </tr>
                    </thead>
                    <tbody>
                      {iaRows.map((row, index) => {
                        const invalid =
                          row.dataStatus !== "OK" ||
                          row.targaStatus !== "OK" ||
                          row.litriStatus !== "OK";
                        return (
                          <tr
                            key={row.id}
                            className={
                              invalid
                                ? "cisterna-row-invalid"
                                : row.verified
                                  ? undefined
                                  : "cisterna-schede-row-dubious"
                            }
                          >
                            <td>
                              <div className="cisterna-schede-cell-edit">
                                <input
                                  className={`cisterna-schede-input ${
                                    row.dataStatus !== "OK" ? "invalid" : ""
                                  }`}
                                  value={row.data}
                                  onChange={(event) =>
                                    handleIaFieldChange(row.id, {
                                      data: normalizeDateInput(event.target.value),
                                    })
                                  }
                                  placeholder="gg/mm/aaaa"
                                  aria-label={`Data riga IA ${index + 1}`}
                                />
                                <span
                                  className={`cisterna-schede-badge ${row.dataStatus.toLowerCase()}`}
                                >
                                  {row.dataStatus}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="cisterna-schede-cell-edit">
                                <input
                                  className={`cisterna-schede-input ${
                                    row.targaStatus !== "OK" ? "invalid" : ""
                                  }`}
                                  value={row.targa}
                                  onChange={(event) =>
                                    handleIaFieldChange(row.id, {
                                      targa: event.target.value.toUpperCase(),
                                    })
                                  }
                                  placeholder="Targa"
                                  aria-label={`Targa riga IA ${index + 1}`}
                                />
                                <span
                                  className={`cisterna-schede-badge ${row.targaStatus.toLowerCase()}`}
                                >
                                  {row.targaStatus}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="cisterna-schede-cell-edit">
                                <input
                                  className={`cisterna-schede-input ${
                                    row.litriStatus !== "OK" ? "invalid" : ""
                                  }`}
                                  type="number"
                                  min={0}
                                  step={0.1}
                                  value={row.litri}
                                  onChange={(event) =>
                                    handleIaFieldChange(row.id, {
                                      litri: event.target.value,
                                    })
                                  }
                                  aria-label={`Litri riga IA ${index + 1}`}
                                />
                                <span
                                  className={`cisterna-schede-badge ${row.litriStatus.toLowerCase()}`}
                                >
                                  {row.litriStatus}
                                </span>
                              </div>
                            </td>
                            <td>
                              <input
                                className="cisterna-schede-input"
                                value={row.note}
                                onChange={(event) =>
                                  handleIaFieldChange(row.id, {
                                    note: event.target.value,
                                  })
                                }
                                placeholder="Note"
                                aria-label={`Note riga IA ${index + 1}`}
                              />
                            </td>
                            <td>
                              <label className="cisterna-schede-verify">
                                <input
                                  type="checkbox"
                                  checked={row.verified}
                                  onChange={(event) =>
                                    handleIaFieldChange(row.id, {
                                      verified: event.target.checked,
                                    })
                                  }
                                />
                                <span>Verificato</span>
                              </label>
                            </td>
                            <td>
                              {croppedPreview ? (
                                <div className="cisterna-schede-cell">
                                  <button
                                    type="button"
                                    className="cisterna-schede-thumb-btn"
                                    onClick={() =>
                                      setActivePreview({
                                        src: croppedPreview,
                                        label: `Riga ${index + 1}`,
                                      })
                                    }
                                  >
                                    <img src={croppedPreview} alt={`Riga ${index + 1}`} />
                                  </button>
                                </div>
                              ) : (
                                <span>-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {rawLines.length > 0 ? (
                  <div className="cisterna-schede-rawblock">
                    <h3>Righe trascritte (RAW)</h3>
                    <div>
                      {rawLines.map((line, index) => (
                        <div key={`raw-${index}`}>{line || "-"}</div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}
          </>
        ) : null}
        {activePreview ? (
          <div className="cisterna-schede-modal" onClick={() => setActivePreview(null)}>
            <div
              className="cisterna-schede-modal-inner"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="cisterna-schede-modal-head">
                <strong>{activePreview.label}</strong>
                <button type="button" onClick={() => setActivePreview(null)}>
                  Chiudi
                </button>
              </div>
              <img src={activePreview.src} alt={activePreview.label} />
            </div>
          </div>
        ) : null}

        {pendingSave ? (
          <div
            className="cisterna-schede-modal cisterna-schede-confirm"
            onClick={() => setPendingSave(null)}
          >
            <div
              className="cisterna-schede-modal-inner"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="cisterna-schede-modal-head">
                <strong>Riepilogo salvataggio</strong>
                <button type="button" onClick={() => setPendingSave(null)}>
                  Chiudi
                </button>
              </div>
              <div className="cisterna-schede-confirm-body">
                <div className="cisterna-schede-summary">
                  <div>
                    <strong>Righe totali</strong>
                    <span>{pendingSave.rowCount}</span>
                  </div>
                  <div>
                    <strong>Righe verificate</strong>
                    <span>{pendingSave.verifiedCount}</span>
                  </div>
                  <div>
                    <strong>Righe non verificate</strong>
                    <span>{pendingSave.unverifiedCount}</span>
                  </div>
                </div>
                {pendingSave.unverifiedCount > 0 ? (
                  <div className="cisterna-schede-warning">
                    Attenzione: alcune righe non sono verificate.
                  </div>
                ) : null}
                <div className="cisterna-schede-confirm-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setPendingSave(null)}
                  >
                    Annulla
                  </button>
                  <button type="button" onClick={confirmBlockedSave}>
                    {editId ? "Conferma modifiche" : "Conferma e salva"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {mode === "manual" ? (
        <div className="cisterna-schede-savebar">
          <div>
            <strong>{manualRowsForSave.length} righe</strong>
            <span>
              {manualRowsForSave.length === 0
                ? "Aggiungi righe per salvare"
                : manualInvalidCount > 0
                  ? `Righe non valide: ${manualInvalidCount}`
                  : "Tutte le righe sono valide"}
            </span>
          </div>
          <button
            type="button"
            onClick={openManualConfirm}
            disabled={manualRowsForSave.length === 0}
          >
            {editId ? "Salva modifiche" : "Conferma e salva"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
