import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import {
  readNextCisternaSnapshot,
  type NextCisternaDocumentItem,
  type NextCisternaDuplicateGroup,
  type NextCisternaSnapshot,
} from "./domain/nextCisternaDomain";
import {
  saveNextCisternaMonthlyExchange,
  updateNextCisternaDuplicateChoice,
} from "./nextCisternaWriter";
import { toDisplay } from "./helpers/dateUnica";
import "../pages/CisternaCaravate/CisternaCaravatePage.css";

type TabKey = "archivio" | "report" | "targhe";
type PdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};

function money(value: number | null, currency: "EUR" | "CHF", empty = "N/D") {
  if (value == null || !Number.isFinite(value)) return empty;
  return new Intl.NumberFormat("it-CH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function ratio(value: number | null, currency: "EUR" | "CHF") {
  if (value == null || !Number.isFinite(value)) return "N/D";
  return `${new Intl.NumberFormat("it-CH", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value)} ${currency}/L`;
}

async function toDataUrlFromAsset(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function liters(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "-";
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function companyClass(label: string) {
  const raw = String(label ?? "").toLowerCase();
  if (raw.includes("import")) return "import";
  if (raw.includes("cement")) return "cementi";
  return "neutral";
}

function formatAziendaLabel(value: "cementi" | "import"): string {
  return value === "import" ? "GHIELMIIMPORT" : "GHIELMICEMENTI";
}

const MONTH_NAMES_IT = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
] as const;

function monthParam(search: string) {
  const value = String(new URLSearchParams(search).get("month") ?? "").trim();
  return /^\d{4}-\d{2}$/.test(value) ? value : null;
}

function monthLabelFromKey(monthKey: string) {
  const match = String(monthKey ?? "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return monthKey || "-";
  const monthIndex = Number(match[2]) - 1;
  const label = MONTH_NAMES_IT[monthIndex];
  return label ? `${label} ${match[1]}` : monthKey || "-";
}

function yearFromMonthKey(monthKey: string | null) {
  const match = String(monthKey ?? "").match(/^(\d{4})-(\d{2})$/);
  if (!match) return new Date().getFullYear();
  return Number(match[1]);
}

function initialDuplicateChoices(groups: NextCisternaDuplicateGroup[]) {
  return groups.reduce<Record<string, string>>((acc, group) => {
    const chosen = group.items.find((item) => item.duplicateState === "value");
    acc[group.key] = chosen?.id ?? group.items[0]?.id ?? "";
    return acc;
  }, {});
}

function duplicateBadge(item: NextCisternaDocumentItem) {
  return item.duplicateState === "value"
    ? { className: "value", label: "VALORE" }
    : { className: "ignored", label: "IGNORATO" };
}

function getLastAutoTableFinalY(pdf: jsPDF, fallback: number): number {
  const finalY = (pdf as PdfWithAutoTable).lastAutoTable?.finalY;
  return typeof finalY === "number" && Number.isFinite(finalY) ? finalY : fallback;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export default function NextCisternaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedMonth = useMemo(() => monthParam(location.search), [location.search]);

  const [selectedMonth, setSelectedMonth] = useState(requestedMonth ?? "");
  const [activeTab, setActiveTab] = useState<TabKey>("archivio");
  const [snapshot, setSnapshot] = useState<NextCisternaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [cambioInput, setCambioInput] = useState("");
  const [cambioStatus, setCambioStatus] = useState("");
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [monthPickerYear, setMonthPickerYear] = useState(yearFromMonthKey(requestedMonth));
  const [dupChoiceByGroup, setDupChoiceByGroup] = useState<Record<string, string>>({});
  const [dupStatusByGroup, setDupStatusByGroup] = useState<Record<string, string>>({});
  const monthPickerRef = useRef<HTMLDivElement | null>(null);

  const applySnapshot = useCallback((nextSnapshot: NextCisternaSnapshot) => {
    setSnapshot(nextSnapshot);
    setSelectedMonth((previous) => (previous === nextSnapshot.monthKey ? previous : nextSnapshot.monthKey));
    setCambioInput(nextSnapshot.report.cambioEurChf == null ? "" : String(nextSnapshot.report.cambioEurChf));
    setCambioStatus("");
    setDupChoiceByGroup(initialDuplicateChoices(nextSnapshot.archive.duplicateGroups));
    setDupStatusByGroup({});
  }, []);

  const refreshSnapshot = useCallback(
    async (monthKey: string | null | undefined) => {
      const nextSnapshot = await readNextCisternaSnapshot(monthKey || undefined, {
        includeCloneOverlays: false,
      });
      applySnapshot(nextSnapshot);
      return nextSnapshot;
    },
    [applySnapshot],
  );

  const currentMonthKeyForActions = useCallback(
    () => selectedMonth || snapshot?.monthKey || requestedMonth || "",
    [requestedMonth, selectedMonth, snapshot?.monthKey],
  );

  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        MONTH_NAMES_IT[index] ?? String(index + 1).padStart(2, "0"),
      ),
    [],
  );

  useEffect(() => {
    if (requestedMonth && requestedMonth !== selectedMonth) {
      setSelectedMonth(requestedMonth);
    }
  }, [requestedMonth, selectedMonth]);

  useEffect(() => {
    const nextYear = yearFromMonthKey(selectedMonth || requestedMonth);
    if (nextYear !== monthPickerYear) {
      setMonthPickerYear(nextYear);
    }
  }, [monthPickerYear, requestedMonth, selectedMonth]);

  useEffect(() => {
    if (!monthPickerOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (monthPickerRef.current?.contains(target)) return;
      setMonthPickerOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [monthPickerOpen]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextCisternaSnapshot(selectedMonth || requestedMonth || undefined, {
          includeCloneOverlays: false,
        });
        if (cancelled) return;

        applySnapshot(nextSnapshot);
      } catch (loadError) {
        if (cancelled) return;
        setSnapshot(null);
        setError(loadError instanceof Error ? loadError.message : "Impossibile leggere il dominio cisterna.");
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
  }, [applySnapshot, requestedMonth, selectedMonth]);

  const displayedMonthLabel = snapshot?.monthLabel ?? monthLabelFromKey(selectedMonth || requestedMonth || "");

  const costoSummaryLine = useMemo(() => {
    if (!snapshot) return "";

    const totalValutaLabel =
      snapshot.report.costi.baseCurrency && snapshot.report.costi.totalFatturaValuta != null
        ? money(snapshot.report.costi.totalFatturaValuta, snapshot.report.costi.baseCurrency)
        : "N/D";
    const cambioLabel =
      snapshot.report.cambioEurChf != null && snapshot.report.cambioEurChf > 0
        ? new Intl.NumberFormat("it-CH", {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          }).format(snapshot.report.cambioEurChf)
        : "N/D";
    const totaleChfLabel = money(snapshot.report.costi.totalChfNormalized, "CHF");
    const costoLtValutaLabel = snapshot.report.costi.baseCurrency
      ? ratio(snapshot.report.costi.costoPerLitroValuta, snapshot.report.costi.baseCurrency)
      : "N/D";
    const costoLtChfLabel = ratio(snapshot.report.costi.costoPerLitroChf, "CHF");

    return `Totale fatture: ${totalValutaLabel} | Cambio: ${cambioLabel} | Totale CHF: ${totaleChfLabel} | Costo/lt: ${costoLtValutaLabel} / ${costoLtChfLabel}`;
  }, [snapshot]);

  const reportSourceLabel = snapshot?.report.hasManualTruth
    ? "Scheda carburante"
    : "Autisti (nessuna scheda carburante nel mese)";

  const handleSaveCambio = async () => {
    const monthKey = currentMonthKeyForActions();
    if (!monthKey) {
      setCambioStatus("Errore salvataggio cambio EUR->CHF.");
      return;
    }

    setCambioStatus("");
    setNotice("");

    try {
      await saveNextCisternaMonthlyExchange({
        monthKey,
        cambioEurChf: toNumberOrNull(cambioInput),
      });
      await refreshSnapshot(monthKey);
      setCambioStatus("Cambio EUR->CHF salvato.");
    } catch (saveError) {
      setCambioStatus(toErrorMessage(saveError, "Errore salvataggio cambio EUR->CHF."));
    }
  };

  const handleConfirmDuplicateChoice = async (group: NextCisternaDuplicateGroup) => {
    const chosenDocumentId = dupChoiceByGroup[group.key] ?? group.items[0]?.id ?? "";
    if (!chosenDocumentId) return;

    setDupStatusByGroup((previous) => ({
      ...previous,
      [group.key]: "",
    }));
    setNotice("");

    try {
      await updateNextCisternaDuplicateChoice({
        groupKey: group.key,
        chosenDocumentId,
        documentIds: group.items.map((item) => item.id),
      });
      await refreshSnapshot(currentMonthKeyForActions());
      setDupStatusByGroup((previous) => ({
        ...previous,
        [group.key]: "Scelta duplicato salvata.",
      }));
    } catch (saveError) {
      setDupStatusByGroup((previous) => ({
        ...previous,
        [group.key]: toErrorMessage(saveError, "Errore durante il salvataggio della scelta."),
      }));
    }
  };

  const handleExportReportPdf = async () => {
    if (!snapshot) return;

    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const marginX = 40;
    let y = 44;

    const logoDataUrl = await toDataUrlFromAsset("/logo.png");
    if (logoDataUrl) {
      pdf.addImage(logoDataUrl, "PNG", marginX, y - 14, 34, 34);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.text("Cisterna Caravate - Report Mensile", marginX + (logoDataUrl ? 44 : 0), y);
    y += 22;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Mese: ${snapshot.monthLabel}`, marginX + (logoDataUrl ? 44 : 0), y);
    y += 22;

    const summaryRows: Array<[string, string]> = [
      ["Fonte litri", reportSourceLabel],
      ["Litri totali mese", `${snapshot.report.litriTotaliMese.toFixed(2)} L`],
      [
        "Totale fatture (valuta)",
        snapshot.report.costi.baseCurrency && snapshot.report.costi.totalFatturaValuta != null
          ? money(snapshot.report.costi.totalFatturaValuta, snapshot.report.costi.baseCurrency)
          : "N/D",
      ],
      [
        "Cambio EUR->CHF",
        snapshot.report.cambioEurChf != null && snapshot.report.cambioEurChf > 0
          ? String(snapshot.report.cambioEurChf)
          : "N/D",
      ],
      ["Totale convertito CHF", money(snapshot.report.costi.totalChfNormalized, "CHF")],
      [
        "Prezzo/lt (valuta)",
        snapshot.report.costi.baseCurrency
          ? ratio(snapshot.report.costi.costoPerLitroValuta, snapshot.report.costi.baseCurrency)
          : "N/D",
      ],
      ["Prezzo/lt (CHF)", ratio(snapshot.report.costi.costoPerLitroChf, "CHF")],
    ];

    autoTable(pdf, {
      startY: y,
      margin: { left: marginX, right: marginX },
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        lineColor: [220, 227, 238],
      },
      columnStyles: {
        0: { fillColor: [247, 251, 255], fontStyle: "bold", cellWidth: 170 },
        1: { cellWidth: "auto" },
      },
      body: summaryRows,
    });

    const afterSummaryY = getLastAutoTableFinalY(pdf, y + 104) + 16;
    autoTable(pdf, {
      startY: afterSummaryY,
      margin: { left: marginX, right: marginX },
      head: [["Ripartizione per azienda", "Litri", "Costo (valuta)", "Costo (CHF)"]],
      body: [
        [
          formatAziendaLabel("cementi"),
          `${snapshot.report.ripartizioneAzienda.cementi.litri.toFixed(2)} L`,
          snapshot.report.costi.baseCurrency
            ? money(
                snapshot.report.ripartizioneAzienda.cementi.costoValuta,
                snapshot.report.costi.baseCurrency,
              )
            : "N/D",
          money(snapshot.report.ripartizioneAzienda.cementi.costoChf, "CHF"),
        ],
        [
          formatAziendaLabel("import"),
          `${snapshot.report.ripartizioneAzienda.import.litri.toFixed(2)} L`,
          snapshot.report.costi.baseCurrency
            ? money(
                snapshot.report.ripartizioneAzienda.import.costoValuta,
                snapshot.report.costi.baseCurrency,
              )
            : "N/D",
          money(snapshot.report.ripartizioneAzienda.import.costoChf, "CHF"),
        ],
      ],
      headStyles: { fillColor: [13, 93, 166], textColor: [255, 255, 255] },
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        lineColor: [220, 227, 238],
      },
      alternateRowStyles: { fillColor: [250, 252, 255] },
      didParseCell: (hookData: CellHookData) => {
        if (hookData.section !== "body") return;
        const rowIndex = hookData.row?.index;
        if (rowIndex === 0) {
          hookData.cell.styles.fillColor = [234, 247, 239];
          hookData.cell.styles.textColor = [31, 95, 52];
        } else if (rowIndex === 1) {
          hookData.cell.styles.fillColor = [238, 244, 255];
          hookData.cell.styles.textColor = [47, 79, 143];
        }
      },
    });

    const afterRipartizioneY = getLastAutoTableFinalY(pdf, afterSummaryY + 104) + 16;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Tabella targhe", marginX, afterRipartizioneY);

    autoTable(pdf, {
      startY: afterRipartizioneY + 8,
      margin: { left: marginX, right: marginX },
      head: [["Targa", "Azienda", "Litri", "Costo stimato (valuta)", "Costo stimato (CHF)"]],
      body: snapshot.report.perTarga.map((row) => [
        row.targa,
        row.aziendaLabel,
        `${row.litri.toFixed(2)} L`,
        snapshot.report.costi.baseCurrency
          ? money(row.costoStimatoValuta, snapshot.report.costi.baseCurrency)
          : "N/D",
        money(row.costoStimatoChf, "CHF"),
      ]),
      headStyles: { fillColor: [13, 93, 166], textColor: [255, 255, 255] },
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 6,
        lineColor: [220, 227, 238],
      },
      alternateRowStyles: { fillColor: [250, 252, 255] },
      didParseCell: (hookData: CellHookData) => {
        if (hookData.section !== "body") return;
        if (hookData.column?.index !== 1) return;
        const label = String(hookData.cell?.raw ?? "");
        const aziendaClass = companyClass(label);
        if (aziendaClass === "cementi") {
          hookData.cell.styles.fillColor = [234, 247, 239];
          hookData.cell.styles.textColor = [31, 95, 52];
        } else if (aziendaClass === "import") {
          hookData.cell.styles.fillColor = [238, 244, 255];
          hookData.cell.styles.textColor = [47, 79, 143];
        } else {
          hookData.cell.styles.fillColor = [243, 246, 251];
          hookData.cell.styles.textColor = [79, 96, 117];
        }
      },
    });

    const footerY = pdf.internal.pageSize.getHeight() - 24;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(
      costoSummaryLine.length > 140 ? `${costoSummaryLine.slice(0, 140)}...` : costoSummaryLine,
      marginX,
      footerY,
      { maxWidth: pageWidth - marginX * 2 },
    );
    pdf.save(`cisterna-report-mensile-${snapshot.monthKey}.pdf`);
  };

  return (
    <div className="cisterna-page">
      <div className="cisterna-shell">
        <header className="cisterna-head">
          <div className="cisterna-head-title">
            <img
              src="/logo.png"
              alt="Logo"
              className="cisterna-head-logo"
              onClick={() => navigate("/next")}
            />
            <div>
              <h1>Cisterna Caravate</h1>
              <p>Archivio separato documenti e report quantitativo mensile.</p>
            </div>
          </div>
          <div className="cisterna-head-actions">
            <button
              type="button"
              onClick={() =>
                navigate(`/next/cisterna/ia?month=${encodeURIComponent(currentMonthKeyForActions())}`)
              }
            >
              Apri IA Cisterna
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(`/next/cisterna/schede-test?month=${encodeURIComponent(currentMonthKeyForActions())}`)
              }
            >
              Scheda carburante
            </button>
            <button type="button" onClick={() => navigate("/next")}>
              Home
            </button>
          </div>
        </header>

        {notice ? <div className="cisterna-note">{notice}</div> : null}
        {error ? <div className="cisterna-error">{error}</div> : null}

        <section className="cisterna-controls">
          <div className="cisterna-month-picker" ref={monthPickerRef}>
            <span className="cisterna-month-picker-label">Mese</span>
            <button
              type="button"
              className="cisterna-month-picker-trigger"
              onClick={() => setMonthPickerOpen((previous) => !previous)}
              aria-haspopup="dialog"
              aria-expanded={monthPickerOpen}
            >
              <span>{displayedMonthLabel}</span>
              <span aria-hidden className="cisterna-month-picker-icon">
                v
              </span>
            </button>

            {monthPickerOpen ? (
              <div className="cisterna-month-popover" role="dialog" aria-label="Selettore mese">
                <div className="cisterna-month-popover-head">
                  <button
                    type="button"
                    className="cisterna-month-nav"
                    onClick={() => setMonthPickerYear((previous) => previous - 1)}
                    aria-label="Anno precedente"
                  >
                    {"<"}
                  </button>
                  <strong>{monthPickerYear}</strong>
                  <button
                    type="button"
                    className="cisterna-month-nav"
                    onClick={() => setMonthPickerYear((previous) => previous + 1)}
                    aria-label="Anno successivo"
                  >
                    {">"}
                  </button>
                </div>
                <div className="cisterna-month-grid">
                  {monthNames.map((name, index) => {
                    const monthKey = `${monthPickerYear}-${String(index + 1).padStart(2, "0")}`;
                    const isSelected = monthKey === (snapshot?.monthKey ?? selectedMonth);
                    return (
                      <button
                        key={monthKey}
                        type="button"
                        className={`cisterna-month-cell ${isSelected ? "is-selected" : ""}`}
                        onClick={() => {
                          setSelectedMonth(monthKey);
                          setMonthPickerOpen(false);
                        }}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="cisterna-cambio-box">
            <div className="cisterna-cambio-title">{"Cambio EUR->CHF (manuale)"}</div>
            <div className="cisterna-cambio-row">
              <input
                type="number"
                step="0.0001"
                placeholder="Es. 0.96"
                value={cambioInput}
                onChange={(event) => setCambioInput(event.target.value)}
              />
              <button type="button" onClick={handleSaveCambio}>
                Salva
              </button>
            </div>
            {cambioStatus ? <div className="cisterna-cambio-status">{cambioStatus}</div> : null}
            {snapshot?.report.costi.baseCurrency === "EUR" ? (
              <div className="cisterna-cambio-preview">
                Importo convertito CHF: {money(snapshot.report.costi.totalChfNormalized, "CHF")}
              </div>
            ) : null}
          </div>
        </section>

        <nav className="cisterna-tabs">
          <button type="button" className={activeTab === "archivio" ? "active" : ""} onClick={() => setActiveTab("archivio")}>
            Archivio
          </button>
          <button type="button" className={activeTab === "report" ? "active" : ""} onClick={() => setActiveTab("report")}>
            Report Mensile
          </button>
          <button type="button" className={activeTab === "targhe" ? "active" : ""} onClick={() => setActiveTab("targhe")}>
            Targhe + Dettaglio
          </button>
        </nav>

        {loading && !snapshot ? <div>Caricamento dominio cisterna...</div> : null}

        {!loading && snapshot && activeTab === "archivio" ? (
          <section className="cisterna-card">
            <h2>Archivio mensile - {snapshot.monthLabel}</h2>
            <div className="cisterna-archivio-grid">
              <article className="cisterna-archivio-block">
                <div className="cisterna-archivio-head">
                  <h3>Rifornimenti autisti</h3>
                  <span className="cisterna-archivio-count">{snapshot.archive.supportRefuels.length}</span>
                </div>
                {snapshot.archive.supportRefuels.length === 0 ? <div>Nessun rifornimento per questo mese.</div> : null}
                {snapshot.archive.supportRefuels.length > 0 ? (
                  <ul className="cisterna-archivio-list">
                    {snapshot.archive.supportRefuels.map((row) => (
                      <li key={row.id} className="cisterna-archivio-item">
                        <div className="cisterna-archivio-main">
                          <strong>{row.dateLabel}</strong>
                          <span>{row.targa}</span>
                        </div>
                        <div className="cisterna-archivio-meta">
                          <span>{liters(row.litri)} L</span>
                          <span>{row.autista}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>

              <article className="cisterna-archivio-block">
                <div className="cisterna-archivio-head">
                  <h3>Fatture</h3>
                  <span className="cisterna-archivio-count">{snapshot.archive.fatture.length}</span>
                </div>
                {snapshot.archive.fatture.length === 0 ? <div>Nessuna fattura per questo mese.</div> : null}
                {snapshot.archive.fatture.length > 0 ? (
                  <ul className="cisterna-archivio-list">
                    {snapshot.archive.fatture.map((item) => (
                      <li key={item.id} className="cisterna-archivio-item">
                        <div className="cisterna-archivio-main">
                          <strong>{item.dateLabel}</strong>
                          <span>{item.fornitore || "-"}</span>
                          <span>{item.prodotto || "-"}</span>
                        </div>
                        <div className="cisterna-archivio-meta">
                          <span>{item.litriLabel}</span>
                          {item.fileUrl ? (
                            <a className="cisterna-archivio-link" href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                              Apri
                            </a>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>

              <article className="cisterna-archivio-block">
                <div className="cisterna-archivio-head">
                  <h3>Bollettini</h3>
                  <span className="cisterna-archivio-count">{snapshot.archive.bollettiniEffective.length}</span>
                </div>
                {snapshot.archive.duplicateGroups.length > 0 ? (
                  <div className="cisterna-dup-section">
                    <strong>DOPPIO BOLLETTINO</strong>
                    <p>
                      Sono presenti piu bollettini per la stessa data. Scegli quello valido. Gli altri verranno ignorati nei conteggi.
                    </p>
                    {snapshot.archive.duplicateGroups.map((group) => {
                      const currentChoice = dupChoiceByGroup[group.key] ?? group.items[0]?.id ?? "";
                      const hasPersistedChoice = group.resolution === "persisted";
                      const inputName = `dup-${group.key.replace(/[^\w-]/g, "_")}`;
                      return (
                        <div key={group.key} className="cisterna-dup-card">
                          <div className="cisterna-dup-head">DOPPIO BOLLETTINO - {group.dateLabel}</div>
                          {!hasPersistedChoice ? (
                            <div className="cisterna-dup-warning">
                              Scelta non confermata: verra usato il bollettino con piu litri finche non confermi.
                            </div>
                          ) : null}
                          {hasPersistedChoice ? <div className="cisterna-note">{group.note}</div> : null}
                          <div className="cisterna-dup-list">
                            {group.items.map((item) => {
                              const badge = duplicateBadge(item);
                              return (
                                <label key={item.id} className={`cisterna-dup-item ${currentChoice === item.id ? "selected" : ""}`}>
                                  <input
                                    type="radio"
                                    name={inputName}
                                    checked={currentChoice === item.id}
                                    onChange={() =>
                                      setDupChoiceByGroup((previous) => ({
                                        ...previous,
                                        [group.key]: item.id,
                                      }))
                                    }
                                  />
                                  <div className="cisterna-dup-meta">
                                    <strong>{item.litriLabel}</strong>
                                    <span>Numero: {item.numeroDocumento || "-"}</span>
                                    <span>Fornitore: {item.fornitore || "-"}</span>
                                  </div>
                                  <div className="cisterna-dup-actions">
                                    <span className={`cisterna-dup-badge ${badge.className}`}>{badge.label}</span>
                                    {item.fileUrl ? (
                                      <a className="cisterna-archivio-link" href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                                        Apri file
                                      </a>
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                          {dupStatusByGroup[group.key] ? <div className="cisterna-error">{dupStatusByGroup[group.key]}</div> : null}
                          <div className="cisterna-dup-confirm">
                            <button type="button" onClick={() => handleConfirmDuplicateChoice(group)}>
                              Conferma scelta
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {snapshot.archive.bollettini.length === 0 ? <div>Nessun bollettino per questo mese.</div> : null}
                {snapshot.archive.bollettini.length > 0 ? (
                  <ul className="cisterna-archivio-list">
                    {snapshot.archive.bollettini.map((item) => (
                      <li key={item.id} className="cisterna-archivio-item">
                        <div className="cisterna-archivio-main">
                          <strong>{item.dateLabel}</strong>
                          <span>{item.fornitore || "-"}</span>
                          <span>{item.prodotto || "-"}</span>
                        </div>
                        <div className="cisterna-archivio-meta">
                          <span>{item.litriLabel}</span>
                          {item.fileUrl ? (
                            <a className="cisterna-archivio-link" href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                              Apri
                            </a>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </div>

            <h3 className="cisterna-subtitle">Archivio documenti - {snapshot.monthLabel}</h3>
            {snapshot.archive.documents.length === 0 ? <div>Nessun documento in questo mese.</div> : null}
            {snapshot.archive.documents.length > 0 ? (
              <div className="cisterna-table-wrap">
                <table className="cisterna-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Fornitore</th>
                      <th>Prodotto</th>
                      <th>Litri 15C</th>
                      <th>Luogo consegna</th>
                      <th>File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.archive.documents.map((item) => (
                      <tr key={item.id}>
                        <td>{item.dateLabel}</td>
                        <td>{item.tipoDocumento || "-"}</td>
                        <td>{item.fornitore || "-"}</td>
                        <td>{item.prodotto || "-"}</td>
                        <td>{item.litriLabel}</td>
                        <td>{item.luogoConsegna || "-"}</td>
                        <td>
                          {item.fileUrl ? (
                            <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                              Apri
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <h3 className="cisterna-subtitle">Schede carburante - {snapshot.monthLabel}</h3>
            {snapshot.archive.schede.length === 0 ? <div>Nessuna scheda per questo mese.</div> : null}
            {snapshot.archive.schede.length > 0 ? (
              <ul className="cisterna-archivio-list">
                {snapshot.archive.schede.map((item) => (
                  <li key={item.id} className="cisterna-archivio-item">
                    <div className="cisterna-archivio-main">
                      <strong>{item.dateLabel}</strong>
                      <span>
                        {item.sourceLabel} - {item.rowCount} righe
                      </span>
                      {item.targa ? <span>Targa: {item.targa}</span> : null}
                    </div>
                    <div className="cisterna-archivio-meta">
                      <span className={`cisterna-archivio-badge ${item.needsReview ? "warn" : "ok"}`}>
                        {item.needsReview ? "Da verificare" : "OK"}
                      </span>
                      <div className="cisterna-archivio-actions">
                        <button
                          type="button"
                          className="cisterna-archivio-action"
                          onClick={() =>
                            navigate(
                              `/next/cisterna/schede-test?edit=${encodeURIComponent(item.id)}&month=${encodeURIComponent(
                                currentMonthKeyForActions(),
                              )}`,
                            )
                          }
                          title="Apri o modifica questa scheda"
                        >
                          Apri/Modifica
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        {!loading && snapshot && activeTab === "report" ? (
          <section className="cisterna-card">
            <div className="cisterna-report-head">
              <h2>Report Mensile - {snapshot.monthLabel}</h2>
              <button
                type="button"
                className="cisterna-report-export"
                onClick={handleExportReportPdf}
              >
                Esporta PDF
              </button>
            </div>
            <p className="cisterna-source-banner">Fonte litri: {reportSourceLabel}</p>
            {!snapshot.report.hasManualTruth ? (
              <p className="cisterna-note">In assenza di scheda carburante, i litri del mese sono attribuiti a GHIELMICEMENTI.</p>
            ) : null}
            <div className="cisterna-kpi-grid">
              <article>
                <span>Litri totali mese (verita)</span>
                <strong>{snapshot.report.litriTotaliMese.toFixed(2)} L</strong>
              </article>
              <article>
                <span>Totale fatture (valuta)</span>
                <strong>
                  {snapshot.report.costi.baseCurrency && snapshot.report.costi.totalFatturaValuta != null
                    ? money(snapshot.report.costi.totalFatturaValuta, snapshot.report.costi.baseCurrency)
                    : "N/D"}
                </strong>
              </article>
              <article>
                <span>Importo convertito CHF</span>
                <strong>{money(snapshot.report.costi.totalChfNormalized, "CHF")}</strong>
              </article>
              <article>
                <span>Prezzo/lt</span>
                <strong className="cisterna-money-stack">
                  <span>
                    {snapshot.report.costi.baseCurrency
                      ? ratio(snapshot.report.costi.costoPerLitroValuta, snapshot.report.costi.baseCurrency)
                      : "N/D"}
                  </span>
                  <span>{ratio(snapshot.report.costi.costoPerLitroChf, "CHF")}</span>
                </strong>
              </article>
            </div>
            <p className="cisterna-report-summary-line">{costoSummaryLine}</p>
            <div className="cisterna-company-split">
              <h3>Ripartizione per azienda</h3>
              <div className="cisterna-table-wrap">
                <table className="cisterna-table">
                  <thead>
                    <tr>
                      <th>Azienda</th>
                      <th>Litri</th>
                      <th>Costo (valuta)</th>
                      <th>Costo (CHF)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="cisterna-company-box cementi">
                      <td>GHIELMICEMENTI</td>
                      <td>{snapshot.report.ripartizioneAzienda.cementi.litri.toFixed(2)} L</td>
                      <td>
                        {snapshot.report.costi.baseCurrency
                          ? money(snapshot.report.ripartizioneAzienda.cementi.costoValuta, snapshot.report.costi.baseCurrency)
                          : "N/D"}
                      </td>
                      <td>{money(snapshot.report.ripartizioneAzienda.cementi.costoChf, "CHF")}</td>
                    </tr>
                    <tr className="cisterna-company-box import">
                      <td>GHIELMIIMPORT</td>
                      <td>{snapshot.report.ripartizioneAzienda.import.litri.toFixed(2)} L</td>
                      <td>
                        {snapshot.report.costi.baseCurrency
                          ? money(snapshot.report.ripartizioneAzienda.import.costoValuta, snapshot.report.costi.baseCurrency)
                          : "N/D"}
                      </td>
                      <td>{money(snapshot.report.ripartizioneAzienda.import.costoChf, "CHF")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {snapshot.report.hasManualTruth && snapshot.report.deltaLitriSupporto != null ? (
              <p className="cisterna-note">
                Supporto autisti: {snapshot.report.litriSupportoMese.toFixed(2)} L. Differenza con scheda carburante:{" "}
                {snapshot.report.deltaLitriSupporto.toFixed(2)} L.
              </p>
            ) : null}
            {!snapshot.report.costi.hasFatture ? (
              <p className="cisterna-note">Costo/lt non disponibile (manca fattura).</p>
            ) : null}
            {snapshot.report.costi.hasFatture && snapshot.report.costi.missingTotalCount > 0 ? (
              <p className="cisterna-note">
                Costo/lt non disponibile (totale documento mancante in almeno una fattura).
              </p>
            ) : null}
            {snapshot.report.costi.hasFatture && snapshot.report.costi.unknownCurrencyCount > 0 ? (
              <p className="cisterna-note">Costo/lt non disponibile (valuta documento non riconosciuta).</p>
            ) : null}
            {snapshot.report.costi.hasFatture && snapshot.report.costi.mixedCurrency ? (
              <p className="cisterna-note">Costo/lt non disponibile (valute miste nelle fatture del mese).</p>
            ) : null}
            {snapshot.report.costi.hasFatture && snapshot.report.costi.needsCambioForChf ? (
              <p className="cisterna-note">Totale CHF non disponibile: imposta il cambio EUR-&gt;CHF.</p>
            ) : null}
            {snapshot.report.costi.hasFatture &&
            snapshot.report.costi.hasValidFattura &&
            snapshot.report.litriTotaliMese <= 0 ? (
              <p className="cisterna-note">Costo/lt non disponibile (litri totali mese pari a zero).</p>
            ) : null}
            <p className="cisterna-note">
              Litri documenti cisterna (con gestione duplicati bollettini): {snapshot.report.litriDocumentiMese.toFixed(2)} L.
            </p>
          </section>
        ) : null}

        {!loading && snapshot && activeTab === "targhe" ? (
          <section className="cisterna-card">
            <h2>Targhe + Dettaglio - {snapshot.monthLabel}</h2>
            <p className="cisterna-source-banner">Fonte litri: {reportSourceLabel}</p>
            {snapshot.report.perTarga.length === 0 ? (
              <div>Nessun dato disponibile nel mese selezionato.</div>
            ) : (
              <div className="cisterna-table-wrap">
                <table className="cisterna-table">
                  <thead>
                    <tr>
                      <th>Targa</th>
                      <th>Azienda</th>
                      <th>Litri</th>
                      <th>Costo stimato (valuta)</th>
                      <th>Costo stimato (CHF)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.report.perTarga.map((row) => (
                      <tr key={row.targa}>
                        <td>{row.targa}</td>
                        <td>
                          <span className={`company-pill ${companyClass(row.aziendaLabel)}`}>{row.aziendaLabel}</span>
                        </td>
                        <td>{row.litri.toFixed(2)} L</td>
                        <td>
                          {snapshot.report.costi.baseCurrency
                            ? money(row.costoStimatoValuta, snapshot.report.costi.baseCurrency)
                            : "N/D"}
                        </td>
                        <td>{money(row.costoStimatoChf, "CHF")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 className="cisterna-subtitle">Dettaglio litri del mese</h3>
            {snapshot.report.detailRows.length === 0 ? (
              <div>Nessun dettaglio disponibile per il mese selezionato.</div>
            ) : (
              <div className="cisterna-table-wrap">
                <table className="cisterna-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Targa</th>
                      <th>Litri</th>
                      <th>Nome/Autista</th>
                      <th>Azienda</th>
                      {snapshot.report.hasManualTruth ? (
                        <th>
                          <span className="cisterna-th-with-help">
                            Scheda carburante (confronto)
                            <span
                              className="cisterna-th-help"
                              title="Confronto con scheda carburante per stessa data e targa. MATCH = nessuna differenza. DIFFERENZA = scostamento litri."
                            >
                              i
                            </span>
                          </span>
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.report.detailRows.map((row) => (
                      <tr key={row.id}>
                        <td>{toDisplay(row.data) || row.data}</td>
                        <td>{row.targa}</td>
                        <td>{row.litri.toFixed(2)} L</td>
                        <td>{row.nome || row.autista || "-"}</td>
                        <td>
                          <span className={`company-pill ${companyClass(row.aziendaLabel)}`}>{row.aziendaLabel}</span>
                        </td>
                        {snapshot.report.hasManualTruth ? (
                          <td>
                            {row.supportLitri == null ? (
                              <div className="cisterna-support-empty">Nessun match</div>
                            ) : (
                              <div className="cisterna-support-box">
                                <strong>{row.supportLitri.toFixed(2)} L</strong>
                                <span>{row.supportStatus}</span>
                                <span>Diff: {row.diff == null ? "-" : row.diff.toFixed(2)} L</span>
                              </div>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
