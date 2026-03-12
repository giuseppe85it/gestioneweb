import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatDateUI } from "../utils/dateFormat";
import "../pages/CapoCostiMezzo.css";
import "./next-shell.css";
import {
  readNextCapoCostiMezzoSnapshot,
  type NextCapoCostiRecord,
} from "./domain/nextCapoDomain";
import type { NextDocumentiCostiCurrency } from "./domain/nextDocumentiCostiDomain";

const CLONE_BLOCKED_REASON =
  "Clone read-only: approvazioni, stati preventivi e PDF timbrati restano bloccati.";

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

function openPdfPreview(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
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
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

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
      } catch (loadError: any) {
        if (cancelled) return;
        setError(loadError?.message || "Errore caricamento costi.");
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

  const computed = useMemo(() => {
    let fattureMonthCHF = 0;
    let fattureMonthEUR = 0;
    let fattureYearCHF = 0;
    let fattureYearEUR = 0;
    let preventiviMonthCHF = 0;
    let preventiviMonthEUR = 0;
    let preventiviYearCHF = 0;
    let preventiviYearEUR = 0;
    let incomplete = 0;
    let currencyUnknown = 0;

    const enriched = records.map((record) => {
      const dateValue = record.timestamp ? new Date(record.timestamp) : parseDateFlexible(record.data);
      const importoValue = typeof record.amount === "number" ? record.amount : null;
      const importoValid = Number.isFinite(importoValue as number);
      const dateValid = Boolean(dateValue) && !Number.isNaN((dateValue as Date).getTime());
      const currency = record.currency ?? "UNKNOWN";

      if ((record.category === "preventivo" || record.category === "fattura") && (!importoValid || !dateValid)) {
        incomplete += 1;
      } else if (
        (record.category === "preventivo" || record.category === "fattura") &&
        currency === "UNKNOWN"
      ) {
        currencyUnknown += 1;
      } else if (
        (record.category === "preventivo" || record.category === "fattura") &&
        dateValid &&
        importoValid
      ) {
        const date = dateValue as Date;
        if (date.getFullYear() === selectedYear) {
          const amount = importoValue as number;
          if (record.category === "fattura") {
            if (currency === "CHF") {
              fattureYearCHF += amount;
              if (date.getMonth() + 1 === selectedMonth) fattureMonthCHF += amount;
            } else {
              fattureYearEUR += amount;
              if (date.getMonth() + 1 === selectedMonth) fattureMonthEUR += amount;
            }
          } else if (currency === "CHF") {
            preventiviYearCHF += amount;
            if (date.getMonth() + 1 === selectedMonth) preventiviMonthCHF += amount;
          } else {
            preventiviYearEUR += amount;
            if (date.getMonth() + 1 === selectedMonth) preventiviMonthEUR += amount;
          }
        }
      }

      return {
        ...record,
        dateValue,
        importoValue,
        importoValid,
        dateValid,
      };
    });

    const periodFiltered = enriched
      .filter((record) => record.dateValid)
      .filter((record) => {
        const date = record.dateValue as Date;
        return date.getFullYear() === selectedYear && date.getMonth() + 1 === selectedMonth;
      })
      .sort((left, right) => {
        const byDate = ((right.dateValue as Date)?.getTime?.() ?? 0) - ((left.dateValue as Date)?.getTime?.() ?? 0);
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
      return enriched.filter((record) => {
        if (!record.dateValid) return false;
        const date = record.dateValue as Date;
        if (date.getFullYear() !== selectedYear || date.getMonth() + 1 !== monthIndex) return false;
        if (activeTab === "TUTTI") {
          return record.category === "fattura" || record.category === "preventivo";
        }
        if (activeTab === "FATTURE") return record.category === "fattura";
        return record.category === "preventivo";
      }).length;
    });

    return {
      fattureMonthCHF,
      fattureMonthEUR,
      fattureYearCHF,
      fattureYearEUR,
      preventiviMonthCHF,
      preventiviMonthEUR,
      preventiviYearCHF,
      preventiviYearEUR,
      incomplete,
      currencyUnknown,
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

  return (
    <div className="capo-costi-wrapper">
      <div className="capo-costi-shell">
        <header className="capo-costi-header">
          <div className="capo-costi-title">
            <button
              type="button"
              className="capo-logo-button"
              onClick={() => navigate("/next")}
              aria-label="Vai alla Home clone"
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
                </div>
              </div>

              <div className="capo-costi-state" style={{ marginBottom: "12px" }}>
                {CLONE_BLOCKED_REASON}
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
                          disabled
                          title={CLONE_BLOCKED_REASON}
                          style={{ opacity: 0.55, cursor: "not-allowed" }}
                        >
                          APPROVA
                        </button>
                        <button
                          type="button"
                          className="capo-action reject"
                          disabled
                          title={CLONE_BLOCKED_REASON}
                          style={{ opacity: 0.55, cursor: "not-allowed" }}
                        >
                          RIFIUTA
                        </button>
                        <button
                          type="button"
                          className="capo-action pending"
                          disabled
                          title={CLONE_BLOCKED_REASON}
                          style={{ opacity: 0.55, cursor: "not-allowed" }}
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
                              onClick={() => openPdfPreview(String(item.fileUrl))}
                            >
                              ANTEPRIMA PDF
                            </button>
                            <button
                              type="button"
                              className="capo-button secondary"
                              disabled
                              title="Clone read-only: `stamp_pdf` e PDF timbrati restano bloccati."
                              style={{ opacity: 0.55, cursor: "not-allowed" }}
                            >
                              ANTEPRIMA TIMBRATO
                            </button>
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
                              onClick={() => openPdfPreview(String(item.fileUrl))}
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
      </div>
    </div>
  );
}
