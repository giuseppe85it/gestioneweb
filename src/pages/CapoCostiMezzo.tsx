import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getItemSync, setItemSync } from "../utils/storageSync";
import { generatePreventiviCapoPDF } from "../utils/pdfEngine";
import { formatDateUI } from "../utils/dateFormat";
import "./CapoCostiMezzo.css";

type CostRecord = {
  id?: string;
  targa: string;
  tipo: "FATTURA" | "PREVENTIVO";
  data?: string;
  importo?: number;
  currency?: Currency;
  valuta?: Currency;
  fornitore?: string;
  fileUrl?: string | null;
  sourceKey?: string;
  sourceDocId?: string;
};

type ApprovalStatus = "pending" | "approved" | "rejected";

type ApprovalEntry = {
  id: string;
  targa: string;
  status: ApprovalStatus;
  updatedAt: string;
};

type Currency = "EUR" | "CHF" | "UNKNOWN";

const IA_COLLECTIONS = [
  "@documenti_mezzi",
  "@documenti_magazzino",
  "@documenti_generici",
];

const normalizeTarga = (value?: unknown): string => {
  if (typeof value !== "string") return "";
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
};

const normalizeTipo = (value?: unknown): string => {
  if (typeof value !== "string") return "";
  return value.toUpperCase().replace(/\s+/g, "").trim();
};

const detectCurrencyFromText = (input: unknown): Currency => {
  if (!input) return "UNKNOWN";
  const text = String(input).toUpperCase();
  if (text.includes("€") || text.includes("EUR")) return "EUR";
  if (text.includes("CHF") || text.includes("FR.")) return "CHF";
  return "UNKNOWN";
};

const resolveCurrencyFromRecord = (record: any): Currency => {
  const direct = detectCurrencyFromText(record?.valuta ?? record?.currency);
  if (direct !== "UNKNOWN") return direct;
  const source = [
    record?.totaleDocumento,
    record?.importo,
    record?.testo,
    record?.imponibile,
    record?.ivaImporto,
    record?.importoPagamento,
    record?.numeroDocumento,
    record?.fornitoreLabel,
    record?.descrizione,
  ]
    .filter(Boolean)
    .join(" ");
  return detectCurrencyFromText(source);
};

const parseDateAny = (value?: string): Date | null => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  let match = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    const ts = new Date(`${yyyy}-${mm}-${dd}`).getTime();
    return Number.isNaN(ts) ? null : new Date(ts);
  }

  match = raw.match(/^(\d{2})\s+(\d{2})\s+(\d{4})/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    const ts = new Date(`${yyyy}-${mm}-${dd}`).getTime();
    return Number.isNaN(ts) ? null : new Date(ts);
  }

  const ts = Date.parse(raw);
  if (Number.isNaN(ts)) return null;
  return new Date(ts);
};

const parseAmountAny = (value: unknown): number | null => {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  let raw = String(value).trim();
  if (!raw) return null;
  raw = raw.toUpperCase();
  raw = raw.replace(/CHF|EUR|€|EURO/g, "");
  raw = raw.replace(/[\s'\u00A0]/g, "");

  if (raw.includes(",") && raw.includes(".")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",")) {
    raw = raw.replace(",", ".");
  }

  raw = raw.replace(/[^0-9.-]/g, "");
  if (!raw) return null;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractImportoFromRaw = (d: any): number | undefined => {
  const candidates = [
    d?.importo,
    d?.totaleDocumento,
    d?.totale,
    d?.importoTotale,
    d?.totaleFattura,
    d?.totale_con_iva,
    d?.importoTotaleDocumento,
  ];

  for (const raw of candidates) {
    const parsed = parseAmountAny(raw);
    if (parsed != null) return parsed;
  }
  return undefined;
};

const formatAmountValue = (value: number) => value.toFixed(2);

const renderAmountWithCurrency = (
  value: number | undefined,
  currency: Currency
) => {
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
};

const formatDateShort = (value?: string): string => {
  const dateValue = parseDateAny(value);
  return formatDateUI(dateValue);
};

const buildApprovalKey = (targaKey: string, record: CostRecord): string => {
  const idBase = record.sourceDocId || record.id || "manual";
  const sourceKey = record.sourceKey || "manual";
  return `${targaKey}__${sourceKey}__${idBase}`;
};

const CapoCostiMezzo: React.FC = () => {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<CostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"FATTURE" | "PREVENTIVI" | "TUTTI">("FATTURE");
  const [approvalsMap, setApprovalsMap] = useState<Record<string, ApprovalEntry>>({});
  const [showPendingOnly, setShowPendingOnly] = useState(true);
  const [exportAllYear, setExportAllYear] = useState(false);

  const now = useMemo(() => new Date(), []);
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

        const targaNorm = normalizeTarga(targa);

        const costiDocRef = doc(db, "storage", "@costiMezzo");
        const costiSnap = await getDoc(costiDocRef);
        const costiData = costiSnap.data() || {};
        const costiArray = (costiData.items || []) as any[];

        const manualCosts: CostRecord[] = costiArray
          .filter((c) => normalizeTarga(c?.mezzoTarga) === targaNorm)
          .map((c) => ({
            id: String(c?.id ?? ""),
            targa: targaNorm,
            tipo: c?.tipo === "PREVENTIVO" ? "PREVENTIVO" : "FATTURA",
            data: c?.data || "",
            importo: parseAmountAny(c?.importo) ?? undefined,
            currency: resolveCurrencyFromRecord(c),
            fornitore: c?.fornitoreLabel || "",
            fileUrl: c?.fileUrl || null,
            sourceKey: "@costiMezzo",
            sourceDocId: String(c?.id ?? ""),
          }));

        const iaDocs: any[] = [];
        for (const colName of IA_COLLECTIONS) {
          try {
            const snap = await getDocs(collection(db, colName));
            snap.forEach((docSnap) => {
              const d = docSnap.data() || {};
              const docTipo = normalizeTipo(d.tipoDocumento);
              const docTarga = normalizeTarga(d.targa || "");
              const isDocValid = docTipo === "FATTURA" || docTipo === "PREVENTIVO";
              if (!isDocValid || docTarga !== targaNorm) return;
              iaDocs.push({
                ...d,
                tipoDocumento: docTipo,
                targa: docTarga,
                sourceKey: colName,
                sourceDocId: docSnap.id,
              });
            });
          } catch {
          }
        }

        const iaCosts: CostRecord[] = iaDocs.map((d) => ({
          id: String(d?.id ?? d?.sourceDocId ?? ""),
          targa: targaNorm,
          tipo: d.tipoDocumento === "PREVENTIVO" ? "PREVENTIVO" : "FATTURA",
          data: d.dataDocumento || "",
          importo: extractImportoFromRaw(d),
          currency: resolveCurrencyFromRecord(d),
          fornitore: d.fornitore || "",
          fileUrl: d.fileUrl || null,
          sourceKey: d.sourceKey,
          sourceDocId: d.sourceDocId,
        }));

        const merged = [...manualCosts, ...iaCosts];
        const dedupKeys = new Set<string>();
        const deduped = merged.filter((item) => {
          const docId = item.sourceDocId ?? item.id ?? "";
          if (!docId) return true;
          const sourceKey = item.sourceKey ?? "";
          const key = sourceKey ? `${sourceKey}:${docId}` : String(docId);
          if (dedupKeys.has(key)) return false;
          dedupKeys.add(key);
          return true;
        });

        if (!cancelled) {
          setRecords(deduped);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Errore caricamento costi.");
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [targa]);

  useEffect(() => {
    let cancelled = false;

    const loadApprovals = async () => {
      const raw = await getItemSync("@preventivi_approvazioni");
      const list = Array.isArray(raw) ? raw : [];
      const nextMap: Record<string, ApprovalEntry> = {};
      list.forEach((item: any) => {
        if (!item?.id) return;
        nextMap[String(item.id)] = {
          id: String(item.id),
          targa: String(item.targa || ""),
          status: item.status === "approved" || item.status === "rejected" ? item.status : "pending",
          updatedAt: String(item.updatedAt || ""),
        };
      });
      if (!cancelled) {
        setApprovalsMap(nextMap);
      }
    };

    void loadApprovals();
    return () => {
      cancelled = true;
    };
  }, []);

  const yearOptions = useMemo(() => {
    const current = now.getFullYear();
    return Array.from({ length: 6 }, (_, idx) => current - idx);
  }, [now]);

  const monthOptions = useMemo(
    () => [
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
    ],
    []
  );

  const monthShortLabels = useMemo(
    () => ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
    []
  );

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

    const enriched = records.map((r) => {
      const dateValue = parseDateAny(r.data);
      const importoValue = parseAmountAny(r.importo);
      const importoValid = Number.isFinite(importoValue as number);
      const dateValid = !!dateValue;
      const currency = r.currency ?? resolveCurrencyFromRecord(r);
      if (!importoValid || !dateValid) {
        incomplete += 1;
      } else if (currency === "UNKNOWN") {
        currencyUnknown += 1;
      } else {
        const d = dateValue as Date;
        if (d.getFullYear() === selectedYear) {
          const amount = importoValue as number;
          if (r.tipo === "FATTURA") {
            if (currency === "CHF") {
              fattureYearCHF += amount;
              if (d.getMonth() + 1 === selectedMonth) {
                fattureMonthCHF += amount;
              }
            } else {
              fattureYearEUR += amount;
              if (d.getMonth() + 1 === selectedMonth) {
                fattureMonthEUR += amount;
              }
            }
          } else {
            if (currency === "CHF") {
              preventiviYearCHF += amount;
              if (d.getMonth() + 1 === selectedMonth) {
                preventiviMonthCHF += amount;
              }
            } else {
              preventiviYearEUR += amount;
              if (d.getMonth() + 1 === selectedMonth) {
                preventiviMonthEUR += amount;
              }
            }
          }
        }
      }
      return {
        ...r,
        dateValue,
        importoValue,
        importoValid,
        dateValid,
        currency,
      };
    });

    const periodFiltered = enriched
      .filter((r) => r.dateValid)
      .filter((r) => {
        const d = r.dateValue as Date;
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
      })
      .sort((a, b) => {
        const ta = (a.dateValue as Date).getTime();
        const tb = (b.dateValue as Date).getTime();
        if (tb !== ta) return tb - ta;
        const ia = a.importoValue ?? 0;
        const ib = b.importoValue ?? 0;
        return ib - ia;
      });

    const filtered = periodFiltered.filter((r) => {
      if (activeTab === "TUTTI") return true;
      if (activeTab === "FATTURE") return r.tipo === "FATTURA";
      return r.tipo === "PREVENTIVO";
    });

    const fattureCount = periodFiltered.filter((r) => r.tipo === "FATTURA").length;
    const preventiviCount = periodFiltered.filter((r) => r.tipo === "PREVENTIVO").length;

    const monthCounts = monthShortLabels.map((_, idx) => {
      const monthIndex = idx + 1;
      return enriched.filter((r) => {
        if (!r.dateValid) return false;
        const d = r.dateValue as Date;
        if (d.getFullYear() !== selectedYear || d.getMonth() + 1 !== monthIndex) return false;
        if (activeTab === "TUTTI") return true;
        if (activeTab === "FATTURE") return r.tipo === "FATTURA";
        return r.tipo === "PREVENTIVO";
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
  }, [records, selectedMonth, selectedYear, activeTab, monthShortLabels]);

  const preventiviItems = useMemo(() => {
    const targaKey = normalizeTarga(targa);
    const list = records
      .filter((r) => r.tipo === "PREVENTIVO")
      .map((r) => {
        const dateValue = parseDateAny(r.data);
        const importoValue = parseAmountAny(r.importo);
        const currency = r.currency ?? resolveCurrencyFromRecord(r);
        const key = buildApprovalKey(targaKey, r);
        const approval = approvalsMap[key];
        return {
          ...r,
          dateValue,
          importoValue,
          currency,
          approvalStatus: approval?.status ?? "pending",
          approvalKey: key,
        };
      })
      .sort((a, b) => {
        const ta = a.dateValue ? a.dateValue.getTime() : 0;
        const tb = b.dateValue ? b.dateValue.getTime() : 0;
        if (tb !== ta) return tb - ta;
        const ia = a.importoValue ?? 0;
        const ib = b.importoValue ?? 0;
        return ib - ia;
      });

    if (!showPendingOnly) return list;
    return list.filter((item) => item.approvalStatus === "pending");
  }, [records, targa, approvalsMap, showPendingOnly]);

  const exportPreventivi = useMemo(() => {
    const targaKey = normalizeTarga(targa);
    return records
      .filter((r) => r.tipo === "PREVENTIVO")
      .map((r) => {
        const dateValue = parseDateAny(r.data);
        const importoValue = parseAmountAny(r.importo);
        const approval = approvalsMap[buildApprovalKey(targaKey, r)];
        const status =
          approval?.status === "approved"
            ? "APPROVATO"
            : approval?.status === "rejected"
            ? "RIFIUTATO"
            : "";
        return {
          data: r.data,
          fornitore: r.fornitore || "",
          importo: importoValue ?? undefined,
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
      .sort((a, b) => {
        const ta = a.dateValue ? a.dateValue.getTime() : 0;
        const tb = b.dateValue ? b.dateValue.getTime() : 0;
        if (tb !== ta) return tb - ta;
        const ia = a.importo ?? 0;
        const ib = b.importo ?? 0;
        return ib - ia;
      });
  }, [records, approvalsMap, targa, selectedYear, selectedMonth, exportAllYear]);

  const handleApprovalChange = async (record: CostRecord, status: ApprovalStatus) => {
    const targaKey = normalizeTarga(targa);
    const key = buildApprovalKey(targaKey, record);
    const entry: ApprovalEntry = {
      id: key,
      targa: targaKey,
      status,
      updatedAt: new Date().toISOString(),
    };

    setApprovalsMap((prev) => {
      const next = { ...prev, [key]: entry };
      void setItemSync("@preventivi_approvazioni", Object.values(next));
      return next;
    });
  };

  const handleExportPreventivi = async () => {
    const targaKey = normalizeTarga(targa);
    await generatePreventiviCapoPDF({
      targa: targaKey,
      anno: selectedYear,
      mese: exportAllYear ? undefined : selectedMonth,
      listaPreventivi: exportPreventivi.map((item) => ({
        data: formatDateShort(item.data),
        fornitore: item.fornitore || "-",
        importo: item.importo,
        status: item.status || "",
      })),
    });
  };

  const handleDownloadStamped = async (item: any) => {
    if (!item.fileUrl) {
      window.alert("Errore scaricamento PDF timbrato.");
      return;
    }
    const status =
      item.approvalStatus === "approved"
        ? "APPROVATO"
        : item.approvalStatus === "rejected"
        ? "RIFIUTATO"
        : null;
    if (!status) return;

    const now = new Date();
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

      window.open(data.stampedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
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
              onClick={() => navigate("/")}
              aria-label="Vai alla Home"
            >
              <img src="/logo.png" alt="Logo" />
            </button>
            <h1>Costi Mezzo</h1>
            <span>{normalizeTarga(targa)}</span>
          </div>
          <button className="capo-button ghost" type="button" onClick={() => navigate("/capo/mezzi")}>
            Torna ai Mezzi
          </button>
        </header>

        <div className="capo-costi-filters">
          <label>
            Mese
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Anno
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!loading && !error && (
          <div className="capo-month-grid">
            {monthShortLabels.map((label, idx) => {
              const monthIndex = idx + 1;
              const count = computed.monthCounts[idx] ?? 0;
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
                <div className="capo-meta-muted">
                  EUR {formatAmountValue(computed.fattureMonthEUR)}
                </div>
              </div>
              <div className="capo-kpi-card">
                <span>Totale anno (fatture)</span>
                <strong>CHF {formatAmountValue(computed.fattureYearCHF)}</strong>
                <div className="capo-meta-muted">
                  EUR {formatAmountValue(computed.fattureYearEUR)}
                </div>
              </div>
              <div className="capo-kpi-card">
                <span>Preventivi mese</span>
                <strong>CHF {formatAmountValue(computed.preventiviMonthCHF)}</strong>
                <div className="capo-meta-muted">
                  EUR {formatAmountValue(computed.preventiviMonthEUR)}
                </div>
              </div>
              <div className="capo-kpi-card">
                <span>Preventivi anno</span>
                <strong>CHF {formatAmountValue(computed.preventiviYearCHF)}</strong>
                <div className="capo-meta-muted">
                  EUR {formatAmountValue(computed.preventiviYearEUR)}
                </div>
              </div>
              {computed.incomplete > 0 && (
                <div className="capo-kpi-badge">
                  Dati incompleti ({computed.incomplete})
                </div>
              )}
              {computed.currencyUnknown > 0 && (
                <div className="capo-kpi-badge">
                  Valuta da verificare ({computed.currencyUnknown})
                </div>
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
                      onChange={(e) => setShowPendingOnly(e.target.checked)}
                    />
                    Solo da valutare
                  </label>
                  <label className="capo-approvazioni-toggle">
                    <input
                      type="checkbox"
                      checked={exportAllYear}
                      onChange={(e) => setExportAllYear(e.target.checked)}
                    />
                    Tutto l'anno
                  </label>
                  <button
                    type="button"
                    className="capo-button"
                    onClick={handleExportPreventivi}
                  >
                    ESPORTA PDF PREVENTIVI
                  </button>
                </div>
              </div>

              {preventiviItems.length === 0 ? (
                <div className="capo-costi-state">
                  {showPendingOnly ? "Nessun preventivo da valutare." : "Nessun preventivo disponibile."}
                </div>
              ) : (
                <div className="capo-approvazioni-list">
                  {preventiviItems.map((item, index) => (
                    <div key={item.approvalKey ?? `${item.id}-${index}`} className="capo-approvazioni-card">
                      <div className="capo-approvazioni-top">
                        <span className={`capo-approvazioni-status ${item.approvalStatus}`}>
                          {item.approvalStatus === "approved"
                            ? "APPROVATO"
                            : item.approvalStatus === "rejected"
                            ? "RIFIUTATO"
                            : "DA VALUTARE"}
                        </span>
                        <span className="capo-approvazioni-date">{formatDateShort(item.data)}</span>
                      </div>

                      <div className="capo-approvazioni-main">
                        <strong>{item.fornitore || "Fornitore n/d"}</strong>
                        <span>
                          {renderAmountWithCurrency(
                            item.importoValue ?? undefined,
                            item.currency ?? "UNKNOWN"
                          )}
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
                            <a className="capo-button" href={item.fileUrl} target="_blank" rel="noreferrer">
                              APRI PDF
                            </a>
                            {item.approvalStatus !== "pending" && (
                              <button
                                type="button"
                                className="capo-button secondary"
                                onClick={() => handleDownloadStamped(item)}
                              >
                                SCARICA TIMBRATO
                              </button>
                            )}
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
                  {monthOptions.find((m) => m.value === selectedMonth)?.label} {selectedYear} | Fatture:{" "}
                  {computed.fattureCount} | Preventivi: {computed.preventiviCount}
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
                    onClick={() => setActiveTab(tab.key as "FATTURE" | "PREVENTIVI" | "TUTTI")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {computed.filtered.length === 0 ? (
                <div className="capo-costi-state">Nessun documento nel periodo selezionato.</div>
              ) : (
                <ul className="capo-list">
                  {computed.filtered.map((item, index) => (
                    <li key={item.id ?? `${item.tipo}-${index}`} className="capo-list-item">
                      <div className="capo-doc-card">
                        <div className="capo-doc-head">
                          <span className={`capo-chip ${item.tipo === "FATTURA" ? "danger" : "info"}`}>
                            {item.tipo}
                          </span>
                          <span className="capo-doc-date">{formatDateShort(item.data)}</span>
                        </div>

                        <div className="capo-doc-main">
                          <strong>{item.fornitore || "Fornitore n/d"}</strong>
                          <span className="capo-doc-amount">
                            {item.importoValid
                              ? renderAmountWithCurrency(
                                  item.importoValue as number,
                                  item.currency ?? "UNKNOWN"
                                )
                              : "Importo n/d"}
                          </span>
                        </div>

                        <div className="capo-doc-actions">
                          {item.fileUrl ? (
                            <a className="capo-button" href={item.fileUrl} target="_blank" rel="noreferrer">
                              APRI PDF
                            </a>
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
};

export default CapoCostiMezzo;
