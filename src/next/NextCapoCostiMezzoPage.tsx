import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDateUI } from "../utils/dateFormat";
import { generatePreventiviCapoPDFBlob } from "../utils/pdfEngine";
import PdfPreviewModal from "../components/PdfPreviewModal";
import {
  buildPdfShareText,
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  openPreview,
  revokePdfPreviewUrl,
  sharePdfFile,
} from "../utils/pdfPreview";
import "../pages/CapoCostiMezzo.css";
import "./next-shell.css";
import {
  readNextCapoCostiMezzoSnapshot,
  type NextCapoCostiRecord,
} from "./domain/nextCapoDomain";
import type { NextDocumentiCostiCurrency } from "./domain/nextDocumentiCostiDomain";
import { upsertNextCapoCloneApproval } from "./nextCapoCloneState";

function readErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

type ComputedCapoCostiRecord = NextCapoCostiRecord & {
  dateValue: Date | null;
  importoValue: number | null;
  importoValid: boolean;
  dateValid: boolean;
};

type Currency = NextDocumentiCostiCurrency;
type ActiveTab = "FATTURE" | "PREVENTIVI" | "TUTTI";

function parseDateFlexible(value: string | null | undefined): Date | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const dmyMatch = raw.match(/^(\d{1,2})[./\-\s](\d{1,2})[./\-\s](\d{2,4})$/);
  if (!dmyMatch) return null;

  const yearRaw = Number(dmyMatch[3]);
  const year = dmyMatch[3].length === 2 ? Number(`20${yearRaw}`) : yearRaw;
  const month = Number(dmyMatch[2]) - 1;
  const day = Number(dmyMatch[1]);
  const date = new Date(year, month, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAmountValue(value: number) {
  return value.toFixed(2);
}

function renderAmountWithCurrency(value: number | undefined, currency: Currency) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Importo n/d";

  if (currency === "UNKNOWN") {
    return (
      <>
        {formatAmountValue(value)}
        <span className="capo-chip info" style={{ marginLeft: "6px" }}>
          VALUTA DA VERIFICARE
        </span>
      </>
    );
  }

  return `${formatAmountValue(value)} ${currency}`;
}

function formatDateShort(value: string | null, timestamp: number | null): string {
  const parsed = timestamp ? new Date(timestamp) : parseDateFlexible(value);
  return formatDateUI(parsed);
}

const monthOptions = [
  { value: 1, label: "Gennaio" },
  { value: 2, label: "Febbraio" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Aprile" },
  { value: 5, label: "Maggio" },
  { value: 6, label: "Giugno" },
  { value: 7, label: "Luglio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Settembre" },
  { value: 10, label: "Ottobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Dicembre" },
] as const;

const monthShortLabels = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"] as const;

export default function NextCapoCostiMezzoPage() {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);

  const [records, setRecords] = useState<NextCapoCostiRecord[]>([]);
  const [mezzoLabel, setMezzoLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("FATTURE");
  const [showPendingOnly, setShowPendingOnly] = useState(true);
  const [exportAllYear, setExportAllYear] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBlob, setPdfPreviewBlob] = useState<Blob | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState("preventivi-mezzo.pdf");
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Anteprima PDF");
  const [pdfShareContext, setPdfShareContext] = useState("Costi mezzo");
  const [pdfShareHint, setPdfShareHint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!targa) {
        setError("Targa non specificata.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const snapshot = await readNextCapoCostiMezzoSnapshot(targa);

        if (cancelled) return;

        setRecords(snapshot.items);
        setMezzoLabel(snapshot.mezzo?.targa || snapshot.mezzoTarga);
        setLoading(false);
      } catch (loadError: unknown) {
        if (cancelled) return;
        setError(readErrorMessage(loadError, "Errore caricamento costi."));
        setRecords([]);
        setMezzoLabel("");
        setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [targa]);

  const yearOptions = useMemo(() => {
    const current = now.getFullYear();
    return Array.from({ length: 6 }, (_, index) => current - index);
  }, [now]);

  const formatFileDate = () => {
    const date = new Date();
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const resolveUrlFileName = (url: string, fallback: string) => {
    try {
      const parsed = new URL(url);
      const candidate = parsed.pathname.split("/").pop();
      if (!candidate) return fallback;
      return decodeURIComponent(candidate);
    } catch {
      return fallback;
    }
  };

  const closePdfPreview = () => {
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewOpen(false);
    setPdfPreviewUrl(null);
    setPdfPreviewBlob(null);
    setPdfShareHint(null);
  };

  const openPdfUrlPreview = (url: string, title: string, contextLabel: string) => {
    setPdfShareHint(null);
    revokePdfPreviewUrl(pdfPreviewUrl);
    setPdfPreviewBlob(null);
    setPdfPreviewTitle(title);
    setPdfShareContext(contextLabel);
    setPdfPreviewFileName(resolveUrlFileName(url, `documento-${formatFileDate()}.pdf`));
    setPdfPreviewUrl(url);
    setPdfPreviewOpen(true);
  };

  const buildPdfShareMessage = () =>
    buildPdfShareText({
      contextLabel: pdfShareContext || "Costi mezzo",
      dateLabel: formatFileDate(),
      fileName: pdfPreviewFileName || "preventivi-mezzo.pdf",
      url: pdfPreviewUrl,
    });

  const handleSharePDF = async () => {
    if (!pdfPreviewBlob) {
      const copied = await copyTextToClipboard(buildPdfShareMessage());
      setPdfShareHint(copied ? "Link copiato." : "Apri prima un'anteprima PDF.");
      return;
    }

    const result = await sharePdfFile({
      blob: pdfPreviewBlob,
      fileName: pdfPreviewFileName || "preventivi-mezzo.pdf",
      title: pdfPreviewTitle || "Anteprima PDF",
      text: buildPdfShareMessage(),
    });

    if (result.status === "shared") {
      setPdfShareHint("PDF condiviso.");
      return;
    }
    if (result.status === "aborted") return;

    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Condivisione non disponibile: testo copiato." : "Condivisione non disponibile.");
  };

  const handleCopyPDFText = async () => {
    const copied = await copyTextToClipboard(buildPdfShareMessage());
    setPdfShareHint(copied ? "Testo copiato." : "Copia non disponibile.");
  };

  const handleWhatsAppPDF = () => {
    const text = buildPdfShareMessage();
    window.open(buildWhatsAppShareUrl(text), "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    return () => {
      revokePdfPreviewUrl(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const computed = useMemo(() => {
    const summary = records.reduce(
      (accumulator, record) => {
        const dateValue = record.timestamp ? new Date(record.timestamp) : parseDateFlexible(record.data);
        const importoValue =
          typeof record.amount === "number" && Number.isFinite(record.amount) ? record.amount : null;
        const importoValid = importoValue !== null;
        const dateValid = dateValue instanceof Date && !Number.isNaN(dateValue.getTime());
        const currency = record.currency ?? "UNKNOWN";
        const enrichedRecord: ComputedCapoCostiRecord = {
          ...record,
          dateValue,
          importoValue,
          importoValid,
          dateValid,
        };

        accumulator.enriched.push(enrichedRecord);

        if ((record.category === "preventivo" || record.category === "fattura") && (!importoValid || !dateValid)) {
          accumulator.incomplete += 1;
          return accumulator;
        }

        if ((record.category === "preventivo" || record.category === "fattura") && currency === "UNKNOWN") {
          accumulator.currencyUnknown += 1;
          return accumulator;
        }

        if (
          (record.category === "preventivo" || record.category === "fattura") &&
          dateValue &&
          importoValue !== null &&
          dateValue.getFullYear() === selectedYear
        ) {
          if (record.category === "fattura") {
            if (currency === "CHF") {
              accumulator.fattureYearCHF += importoValue;
              if (dateValue.getMonth() + 1 === selectedMonth) accumulator.fattureMonthCHF += importoValue;
            } else {
              accumulator.fattureYearEUR += importoValue;
              if (dateValue.getMonth() + 1 === selectedMonth) accumulator.fattureMonthEUR += importoValue;
            }
          } else if (currency === "CHF") {
            accumulator.preventiviYearCHF += importoValue;
            if (dateValue.getMonth() + 1 === selectedMonth) accumulator.preventiviMonthCHF += importoValue;
          } else {
            accumulator.preventiviYearEUR += importoValue;
            if (dateValue.getMonth() + 1 === selectedMonth) accumulator.preventiviMonthEUR += importoValue;
          }
        }

        return accumulator;
      },
      {
        fattureMonthCHF: 0,
        fattureMonthEUR: 0,
        fattureYearCHF: 0,
        fattureYearEUR: 0,
        preventiviMonthCHF: 0,
        preventiviMonthEUR: 0,
        preventiviYearCHF: 0,
        preventiviYearEUR: 0,
        incomplete: 0,
        currencyUnknown: 0,
        enriched: [] as ComputedCapoCostiRecord[],
      }
    );

    const periodFiltered = summary.enriched
      .filter((record) => record.dateValid)
      .filter((record) => {
        const date = record.dateValue;
        if (!date) return false;
        return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
      })
      .sort((left, right) => {
        const byDate = (right.dateValue?.getTime() ?? 0) - (left.dateValue?.getTime() ?? 0);
        if (byDate !== 0) return byDate;
        return (right.importoValue ?? 0) - (left.importoValue ?? 0);
      });

    const filtered = periodFiltered.filter((record) => {
      if (activeTab === "TUTTI") return true;
      if (activeTab === "FATTURE") return record.category === "fattura";
      return record.category === "preventivo";
    });

    const fattureCount = periodFiltered.filter((record) => record.category === "fattura").length;
    const preventiviCount = periodFiltered.filter((record) => record.category === "preventivo").length;
    const monthCounts = monthShortLabels.map((_, index) => {
      const monthIndex = index + 1;
      return summary.enriched.filter((record) => {
        if (!record.dateValid) return false;
        const date = record.dateValue;
        if (!date) return false;
        if (date.getFullYear() !== selectedYear || date.getMonth() + 1 !== monthIndex) return false;
        if (activeTab === "TUTTI") {
          return record.category === "fattura" || record.category === "preventivo";
        }
        if (activeTab === "FATTURE") return record.category === "fattura";
        return record.category === "preventivo";
      }).length;
    });

    return {
      fattureMonthCHF: summary.fattureMonthCHF,
      fattureMonthEUR: summary.fattureMonthEUR,
      fattureYearCHF: summary.fattureYearCHF,
      fattureYearEUR: summary.fattureYearEUR,
      preventiviMonthCHF: summary.preventiviMonthCHF,
      preventiviMonthEUR: summary.preventiviMonthEUR,
      preventiviYearCHF: summary.preventiviYearCHF,
      preventiviYearEUR: summary.preventiviYearEUR,
      incomplete: summary.incomplete,
      currencyUnknown: summary.currencyUnknown,
      filtered,
      fattureCount,
      preventiviCount,
      monthCounts,
    };
  }, [records, selectedYear, selectedMonth, activeTab]);

  const preventiviItems = useMemo(
    () =>
      records
        .filter((record) => record.category === "preventivo")
        .sort((left, right) => {
          const byDate = (right.timestamp ?? 0) - (left.timestamp ?? 0);
          if (byDate !== 0) return byDate;
          return (right.amount ?? 0) - (left.amount ?? 0);
        })
        .filter((record) => !showPendingOnly || record.approvalStatus === "pending"),
    [records, showPendingOnly]
  );

  const exportPreventivi = useMemo(() => {
    return records
      .filter((record) => record.category === "preventivo")
      .map((record) => {
        const dateValue = record.timestamp ? new Date(record.timestamp) : parseDateFlexible(record.data);
        const status =
          record.approvalStatus === "approved"
            ? "APPROVATO"
            : record.approvalStatus === "rejected"
            ? "RIFIUTATO"
            : "";
        return {
          data: record.data,
          fornitore: record.supplier || "",
          importo: record.amount ?? undefined,
          status,
          dateValue,
        };
      })
      .filter((item) => {
        if (!item.dateValue) return false;
        const year = item.dateValue.getFullYear();
        if (year !== selectedYear) return false;
        if (exportAllYear) return true;
        return item.dateValue.getMonth() + 1 === selectedMonth;
      })
      .sort((left, right) => {
        const byDate = (right.dateValue?.getTime() ?? 0) - (left.dateValue?.getTime() ?? 0);
        if (byDate !== 0) return byDate;
        return (right.importo ?? 0) - (left.importo ?? 0);
      });
  }, [records, selectedYear, selectedMonth, exportAllYear]);

  const handleApprovalChange = (record: NextCapoCostiRecord, status: "pending" | "approved" | "rejected") => {
    const targaKey = String(targa ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const approvalKey =
      record.approvalKey ??
      `${targaKey}__${record.sourceKey || "manual"}__${record.sourceDocId || record.id || "manual"}`;
    const updatedAt = new Date().toISOString();

    upsertNextCapoCloneApproval({
      id: approvalKey,
      targa: targaKey,
      status,
      updatedAt,
    });

    setRecords((prev) =>
      prev.map((item) =>
        (item.approvalKey ?? `${targaKey}__${item.sourceKey || "manual"}__${item.sourceDocId || item.id || "manual"}`) === approvalKey
          ? {
              ...item,
              approvalKey,
              approvalStatus: status,
              approvalUpdatedAt: updatedAt,
              approvalUpdatedAtTimestamp: Date.parse(updatedAt),
            }
          : item
      )
    );
  };

  const handleExportPreventivi = async () => {
    const targaKey = String(targa ?? "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    const payload = {
      targa: targaKey,
      anno: selectedYear,
      mese: exportAllYear ? undefined : selectedMonth,
      listaPreventivi: exportPreventivi.map((item) => ({
        data: formatDateShort(item.data, item.dateValue?.getTime() ?? null),
        fornitore: item.fornitore || "-",
        importo: item.importo,
        status: item.status || "",
      })),
    };

    try {
      const fileDate = formatFileDate();
      const preview = await openPreview({
        source: async () => generatePreventiviCapoPDFBlob(payload),
        fileName: `preventivi-mezzo-${targaKey || "targa"}-${fileDate}.pdf`,
        previousUrl: pdfPreviewUrl,
      });
      setPdfShareHint(null);
      setPdfPreviewBlob(preview.blob);
      setPdfPreviewFileName(preview.fileName);
      setPdfPreviewTitle(`Anteprima PDF preventivi ${targaKey || ""}`.trim());
      setPdfShareContext(`Preventivi mezzo ${targaKey || ""}`.trim());
      setPdfPreviewUrl(preview.url);
      setPdfPreviewOpen(true);
    } catch {
      window.alert("Errore durante la generazione dell'anteprima PDF.");
    }
  };

  const handleDownloadStamped = async (item: NextCapoCostiRecord) => {
    if (!item.fileUrl) {
      window.alert("Errore anteprima PDF timbrato.");
      return;
    }

    const status =
      item.approvalStatus === "approved"
        ? "APPROVATO"
        : item.approvalStatus === "rejected"
        ? "RIFIUTATO"
        : null;
    if (!status) return;

    const stampTimeHHmm = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    try {
      const response = await fetch(
        "https://us-central1-gestionemanutenzione-934ef.cloudfunctions.net/stamp_pdf",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileUrl: item.fileUrl,
            status,
            stampTimeHHmm,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`stamp_pdf failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data?.stampedUrl) {
        throw new Error("stamp_pdf missing stampedUrl");
      }

      openPdfUrlPreview(
        data.stampedUrl,
        `Anteprima PDF timbrato ${status}`,
        `Preventivo timbrato ${status}`
      );
    } catch {
      window.alert("Errore timbro");
    }
  };

  return (
    <div className="capo-costi-wrapper">
      <div className="capo-costi-shell">
        <header className="capo-costi-header">
          <div className="capo-costi-title">
            <button
              type="button"
              className="capo-logo-button"
              onClick={() => navigate("/next")}
              aria-label="Vai alla Home"
            >
              <img src="/logo.png" alt="Logo" />
            </button>
            <h1>Costi Mezzo</h1>
            <span>{mezzoLabel || String(targa || "").toUpperCase()}</span>
          </div>
          <button
            className="capo-button ghost"
            type="button"
            onClick={() => navigate("/next/capo/mezzi")}
          >
            Torna ai Mezzi
          </button>
        </header>

        <div className="capo-costi-filters">
          <label>
            Mese
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Anno
            <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))}>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!loading && !error && (
          <div className="capo-month-grid">
            {monthShortLabels.map((label, index) => {
              const monthIndex = index + 1;
              const count = computed.monthCounts[index] ?? 0;
              return (
                <button
                  key={label}
                  type="button"
                  className={`capo-month-chip ${selectedMonth === monthIndex ? "active" : ""} ${
                    count === 0 ? "muted" : ""
                  }`}
                  onClick={() => setSelectedMonth(monthIndex)}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {loading && <div className="capo-costi-state">Caricamento costi...</div>}
        {error && !loading && <div className="capo-costi-state error">{error}</div>}

        {!loading && !error && (
          <>
            <div className="capo-costi-kpi">
              <div className="capo-kpi-card">
                <span>Totale mese (fatture)</span>
                <strong>CHF {formatAmountValue(computed.fattureMonthCHF)}</strong>
                <div className="capo-meta-muted">EUR {formatAmountValue(computed.fattureMonthEUR)}</div>
              </div>
              <div className="capo-kpi-card">
                <span>Totale anno (fatture)</span>
                <strong>CHF {formatAmountValue(computed.fattureYearCHF)}</strong>
                <div className="capo-meta-muted">EUR {formatAmountValue(computed.fattureYearEUR)}</div>
              </div>
              <div className="capo-kpi-card">
                <span>Preventivi mese</span>
                <strong>CHF {formatAmountValue(computed.preventiviMonthCHF)}</strong>
                <div className="capo-meta-muted">EUR {formatAmountValue(computed.preventiviMonthEUR)}</div>
              </div>
              <div className="capo-kpi-card">
                <span>Preventivi anno</span>
                <strong>CHF {formatAmountValue(computed.preventiviYearCHF)}</strong>
                <div className="capo-meta-muted">EUR {formatAmountValue(computed.preventiviYearEUR)}</div>
              </div>
              {computed.incomplete > 0 && (
                <div className="capo-kpi-badge">Dati incompleti ({computed.incomplete})</div>
              )}
              {computed.currencyUnknown > 0 && (
                <div className="capo-kpi-badge">Valuta da verificare ({computed.currencyUnknown})</div>
              )}
            </div>

            <section className="capo-approvazioni">
              <div className="capo-approvazioni-head">
                <h2>Approvazione Preventivi</h2>
                <div className="capo-approvazioni-controls">
                  <label className="capo-approvazioni-toggle">
                    <input
                      type="checkbox"
                      checked={showPendingOnly}
                      onChange={(event) => setShowPendingOnly(event.target.checked)}
                    />
                    Solo da valutare
                  </label>
                  <label className="capo-approvazioni-toggle">
                    <input
                      type="checkbox"
                      checked={exportAllYear}
                      onChange={(event) => setExportAllYear(event.target.checked)}
                    />
                    Tutto l'anno
                  </label>
                  <button
                    type="button"
                    className="capo-button"
                    onClick={handleExportPreventivi}
                  >
                    ANTEPRIMA PDF PREVENTIVI
                  </button>
                </div>
              </div>

              {preventiviItems.length === 0 ? (
                <div className="capo-costi-state">
                  {showPendingOnly
                    ? "Nessun preventivo da valutare."
                    : "Nessun preventivo disponibile."}
                </div>
              ) : (
                <div className="capo-approvazioni-list">
                  {preventiviItems.map((item) => (
                    <div key={item.id} className="capo-approvazioni-card">
                      <div className="capo-approvazioni-top">
                        <span className={`capo-approvazioni-status ${item.approvalStatus}`}>
                          {item.approvalStatus === "approved"
                            ? "APPROVATO"
                            : item.approvalStatus === "rejected"
                            ? "RIFIUTATO"
                            : "DA VALUTARE"}
                        </span>
                        <span className="capo-approvazioni-date">
                          {formatDateShort(item.data, item.timestamp)}
                        </span>
                      </div>

                      <div className="capo-approvazioni-main">
                        <strong>{item.supplier || "Fornitore n/d"}</strong>
                        <span>
                          {renderAmountWithCurrency(item.amount ?? undefined, item.currency ?? "UNKNOWN")}
                        </span>
                      </div>

                      <div className="capo-approvazioni-actions">
                        <button
                          type="button"
                          className="capo-action approve"
                          onClick={() => handleApprovalChange(item, "approved")}
                        >
                          APPROVA
                        </button>
                        <button
                          type="button"
                          className="capo-action reject"
                          onClick={() => handleApprovalChange(item, "rejected")}
                        >
                          RIFIUTA
                        </button>
                        <button
                          type="button"
                          className="capo-action pending"
                          onClick={() => handleApprovalChange(item, "pending")}
                        >
                          DA VALUTARE
                        </button>
                      </div>

                      <div className="capo-approvazioni-footer">
                        {item.fileUrl ? (
                          <>
                            <button
                              type="button"
                              className="capo-button"
                              onClick={() =>
                                openPdfUrlPreview(
                                  String(item.fileUrl),
                                  "Anteprima PDF documento",
                                  "Documento preventivo"
                                )
                              }
                            >
                              ANTEPRIMA PDF
                            </button>
                            {item.approvalStatus !== "pending" ? (
                              <button
                                type="button"
                                className="capo-button secondary"
                                onClick={() => handleDownloadStamped(item)}
                              >
                                ANTEPRIMA TIMBRATO
                              </button>
                            ) : null}
                          </>
                        ) : (
                          <span className="capo-meta-muted">Nessun PDF</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="capo-costi-list">
              <div className="capo-list-header">
                <h2>Documenti del periodo</h2>
                <span>
                  {monthOptions.find((month) => month.value === selectedMonth)?.label} {selectedYear} |
                  {" "}Fatture: {computed.fattureCount} | Preventivi: {computed.preventiviCount}
                </span>
              </div>

              <div className="capo-tabs">
                {[
                  { key: "FATTURE", label: "Fatture" },
                  { key: "PREVENTIVI", label: "Preventivi" },
                  { key: "TUTTI", label: "Tutti" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`capo-tab ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key as ActiveTab)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {computed.filtered.length === 0 ? (
                <div className="capo-costi-state">Nessun documento nel periodo selezionato.</div>
              ) : (
                <ul className="capo-list">
                  {computed.filtered.map((item) => (
                    <li key={item.id} className="capo-list-item">
                      <div className="capo-doc-card">
                        <div className="capo-doc-head">
                          <span className={`capo-chip ${item.category === "fattura" ? "danger" : "info"}`}>
                            {item.category === "fattura"
                              ? "FATTURA"
                              : item.category === "preventivo"
                              ? "PREVENTIVO"
                              : "DOCUMENTO"}
                          </span>
                          <span className="capo-doc-date">
                            {formatDateShort(item.data, item.timestamp)}
                          </span>
                        </div>

                        <div className="capo-doc-main">
                          <strong>{item.supplier || "Fornitore n/d"}</strong>
                          <span className="capo-doc-amount">
                            {typeof item.amount === "number"
                              ? renderAmountWithCurrency(item.amount, item.currency ?? "UNKNOWN")
                              : "Importo n/d"}
                          </span>
                        </div>

                        <div className="capo-doc-actions">
                          {item.fileUrl ? (
                            <button
                              type="button"
                              className="capo-button"
                              onClick={() =>
                                openPdfUrlPreview(
                                  String(item.fileUrl),
                                  "Anteprima PDF documento",
                                  "Documento costi mezzo"
                                )
                              }
                            >
                              ANTEPRIMA PDF
                            </button>
                          ) : (
                            <span className="capo-meta-muted">Nessun PDF</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
        <PdfPreviewModal
          open={pdfPreviewOpen}
          title={pdfPreviewTitle}
          pdfUrl={pdfPreviewUrl}
          fileName={pdfPreviewFileName}
          hint={pdfShareHint}
          onClose={closePdfPreview}
          onShare={handleSharePDF}
          onCopyLink={handleCopyPDFText}
          onWhatsApp={handleWhatsAppPDF}
        />
      </div>
    </div>
  );
}
