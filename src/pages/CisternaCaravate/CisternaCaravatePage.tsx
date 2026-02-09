import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  CISTERNA_DOCUMENTI_COLLECTION,
  CISTERNA_PARAMETRI_COLLECTION,
  CISTERNA_REFUEL_TAG,
  CISTERNA_SCHEDE_COLLECTION,
  currentMonthKey,
  monthLabel,
  monthKeyFromDate,
  RIFORNIMENTI_AUTISTI_KEY,
} from "../../cisterna/collections";
import type {
  CisternaDocumento,
  CisternaParametroMensile,
  RifornimentoAutistaRecord,
} from "../../cisterna/types";
import "./CisternaCaravatePage.css";

type TabKey = "archivio" | "report" | "targhe";

type CisternaSchedaRow = {
  data?: string | null;
  targa?: string | null;
  litri?: number | null;
  nome?: string | null;
};

type CisternaSchedaDoc = {
  id: string;
  createdAt?: unknown;
  source?: "manual" | "ia" | string | null;
  rowCount?: number | null;
  rows?: CisternaSchedaRow[] | null;
  needsReview?: boolean;
  mese?: string | null;
  yearMonth?: string | null;
};

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toDateFromUnknown(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    const ms = value > 1_000_000_000_000 ? value : value * 1000;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;

    const m = value.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]) - 1;
      const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
      const d = new Date(year, month, day);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  if (typeof value === "object" && value !== null) {
    const maybeTs = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };
    if (typeof maybeTs.toDate === "function") {
      const d = maybeTs.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof maybeTs.seconds === "number") {
      const d = new Date(maybeTs.seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof maybeTs._seconds === "number") {
      const d = new Date(maybeTs._seconds * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }

  return null;
}

function getDocDate(docItem: CisternaDocumento): Date | null {
  const fromData = toDateFromUnknown(docItem.dataDocumento);
  if (fromData) return fromData;
  return toDateFromUnknown(docItem.createdAt);
}

function getRefuelDate(record: RifornimentoAutistaRecord): Date | null {
  return (
    toDateFromUnknown(record.data) ||
    toDateFromUnknown(record.timestamp) ||
    null
  );
}

function getRefuelTarga(record: RifornimentoAutistaRecord): string {
  const raw =
    record.targaCamion ?? record.targaMotrice ?? record.mezzoTarga ?? "";
  return String(raw).trim().toUpperCase();
}

function getRefuelAutista(record: RifornimentoAutistaRecord): string {
  const direct = [
    record.autistaNome,
    record.nomeAutista,
    typeof record.autista === "string" ? record.autista : null,
    typeof record.autista === "object" && record.autista
      ? record.autista.nome
      : null,
  ]
    .map((value) => String(value ?? "").trim())
    .find((value) => value !== "");

  return direct || "—";
}

function formatLitri(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "-";
  const rounded = Math.round(value * 100) / 100;
  const text = rounded.toFixed(2);
  return text.replace(/\.?0+$/, "");
}

function getSchedaDate(docItem: CisternaSchedaDoc): Date | null {
  const fromCreated = toDateFromUnknown(docItem.createdAt);
  if (fromCreated) return fromCreated;
  const firstRow = Array.isArray(docItem.rows) ? docItem.rows[0] : null;
  if (firstRow?.data) return toDateFromUnknown(firstRow.data);
  return null;
}

function getSchedaTarga(docItem: CisternaSchedaDoc): string {
  const firstRow = Array.isArray(docItem.rows) ? docItem.rows[0] : null;
  return String(firstRow?.targa ?? "").trim().toUpperCase();
}

function isFatturaDoc(docItem: CisternaDocumento): boolean {
  const tipo = String(docItem.tipoDocumento ?? "").trim().toLowerCase();
  const nomeFile = String(docItem.nomeFile ?? "").trim().toLowerCase();
  return tipo.includes("fattur") || nomeFile.includes("fattur");
}

function isBollettinoDoc(docItem: CisternaDocumento): boolean {
  const tipo = String(docItem.tipoDocumento ?? "").trim().toLowerCase();
  const nomeFile = String(docItem.nomeFile ?? "").trim().toLowerCase();
  return (
    tipo.includes("bollett") ||
    tipo.includes("bolla") ||
    tipo.includes("ddt") ||
    nomeFile.includes("bollett") ||
    nomeFile.includes("bolla") ||
    nomeFile.includes("ddt")
  );
}

export default function CisternaCaravatePage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabKey>("archivio");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey());

  const [docs, setDocs] = useState<CisternaDocumento[]>([]);
  const [docsLoading, setDocsLoading] = useState<boolean>(true);
  const [docsError, setDocsError] = useState<string>("");

  const [refuels, setRefuels] = useState<RifornimentoAutistaRecord[]>([]);
  const [refuelsLoading, setRefuelsLoading] = useState<boolean>(true);
  const [refuelsError, setRefuelsError] = useState<string>("");

  const [schedeDocs, setSchedeDocs] = useState<CisternaSchedaDoc[]>([]);
  const [schedeLoading, setSchedeLoading] = useState<boolean>(true);
  const [schedeError, setSchedeError] = useState<string>("");

  const [cambioInput, setCambioInput] = useState<string>("");
  const [savingCambio, setSavingCambio] = useState<boolean>(false);
  const [cambioStatus, setCambioStatus] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const loadDocs = async () => {
      setDocsLoading(true);
      setDocsError("");
      try {
        const snap = await getDocs(collection(db, CISTERNA_DOCUMENTI_COLLECTION));
        const rows: CisternaDocumento[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data() as Partial<CisternaDocumento>;
          rows.push({
            id: docSnap.id,
            ...raw,
            litri15C: toNumberOrNull(raw.litri15C),
            litriAmbiente: toNumberOrNull(raw.litriAmbiente),
          });
        });

        rows.sort((a, b) => {
          const aMs = getDocDate(a)?.getTime() ?? 0;
          const bMs = getDocDate(b)?.getTime() ?? 0;
          return bMs - aMs;
        });

        if (!cancelled) {
          setDocs(rows);
          setDocsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setDocsError(err?.message || "Errore caricamento documenti cisterna.");
          setDocsLoading(false);
        }
      }
    };

    void loadDocs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRefuels = async () => {
      setRefuelsLoading(true);
      setRefuelsError("");
      try {
        const ref = doc(db, "storage", RIFORNIMENTI_AUTISTI_KEY);
        const snap = await getDoc(ref);
        const raw = snap.exists() ? snap.data() : {};
        const value = Array.isArray(raw?.value)
          ? raw.value
          : Array.isArray(raw)
          ? raw
          : [];
        if (!cancelled) {
          setRefuels(value as RifornimentoAutistaRecord[]);
          setRefuelsLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setRefuelsError(
            err?.message || "Errore caricamento rifornimenti autisti."
          );
          setRefuelsLoading(false);
        }
      }
    };

    void loadRefuels();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSchede = async () => {
      setSchedeLoading(true);
      setSchedeError("");
      try {
        const snap = await getDocs(collection(db, CISTERNA_SCHEDE_COLLECTION));
        const rows: CisternaSchedaDoc[] = [];
        snap.forEach((docSnap) => {
          const raw = docSnap.data() as Partial<CisternaSchedaDoc>;
          rows.push({
            id: docSnap.id,
            ...raw,
          });
        });

        rows.sort((a, b) => {
          const aMs = getSchedaDate(a)?.getTime() ?? 0;
          const bMs = getSchedaDate(b)?.getTime() ?? 0;
          if (bMs !== aMs) return bMs - aMs;
          return getSchedaTarga(a).localeCompare(getSchedaTarga(b));
        });

        if (!cancelled) {
          setSchedeDocs(rows);
          setSchedeLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setSchedeError(err?.message || "Errore caricamento schede carburante.");
          setSchedeLoading(false);
        }
      }
    };

    void loadSchede();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCambio = async () => {
      setCambioStatus("");
      try {
        const ref = doc(db, CISTERNA_PARAMETRI_COLLECTION, selectedMonth);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (!cancelled) setCambioInput("");
          return;
        }
        const data = snap.data() as Partial<CisternaParametroMensile>;
        const value = toNumberOrNull(data.cambioEurChf);
        if (!cancelled) {
          setCambioInput(value == null ? "" : String(value));
        }
      } catch (err: any) {
        if (!cancelled) {
          setCambioStatus(
            err?.message || "Errore lettura parametro mensile EUR→CHF."
          );
        }
      }
    };

    void loadCambio();

    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  const docsOfMonth = useMemo(() => {
    return docs.filter((item) => {
      const d = getDocDate(item);
      if (!d) return false;
      return monthKeyFromDate(d) === selectedMonth;
    });
  }, [docs, selectedMonth]);

  const refuelsCaravateOfMonth = useMemo(() => {
    return refuels.filter((item) => {
      const tipo = String(item.tipo ?? "").trim().toLowerCase();
      if (tipo !== CISTERNA_REFUEL_TAG) return false;
      const d = getRefuelDate(item);
      if (!d) return false;
      return monthKeyFromDate(d) === selectedMonth;
    });
  }, [refuels, selectedMonth]);

  const refuelsMonthlyRows = useMemo(() => {
    return [...refuelsCaravateOfMonth]
      .map((item, index) => {
        const d = getRefuelDate(item);
        const dateLabel = d ? d.toLocaleDateString("it-CH") : "-";
        return {
          id: String(item.id ?? `${index}_${dateLabel}_${getRefuelTarga(item)}`),
          date: d,
          dateLabel,
          targa: getRefuelTarga(item) || "NON INDICATA",
          litri: toNumberOrNull(item.litri) ?? 0,
          autista: getRefuelAutista(item),
        };
      })
      .sort((a, b) => {
        const aMs = a.date?.getTime() ?? 0;
        const bMs = b.date?.getTime() ?? 0;
        if (bMs !== aMs) return bMs - aMs;
        return a.targa.localeCompare(b.targa);
      });
  }, [refuelsCaravateOfMonth]);

  const schedeOfMonth = useMemo(() => {
    return schedeDocs.filter((item) => {
      const ym = String(item.yearMonth ?? item.mese ?? "").trim();
      if (ym) return ym === selectedMonth;
      const d = getSchedaDate(item);
      if (!d) return false;
      return monthKeyFromDate(d) === selectedMonth;
    });
  }, [schedeDocs, selectedMonth]);

  const schedeOfMonthSorted = useMemo(() => {
    return [...schedeOfMonth].sort((a, b) => {
      const aMs = getSchedaDate(a)?.getTime() ?? 0;
      const bMs = getSchedaDate(b)?.getTime() ?? 0;
      if (bMs !== aMs) return bMs - aMs;
      return getSchedaTarga(a).localeCompare(getSchedaTarga(b));
    });
  }, [schedeOfMonth]);

  const fattureDocs = useMemo(() => {
    return docsOfMonth
      .filter((docItem) => isFatturaDoc(docItem))
      .sort((a, b) => {
        const aMs = getDocDate(a)?.getTime() ?? 0;
        const bMs = getDocDate(b)?.getTime() ?? 0;
        if (bMs !== aMs) return bMs - aMs;
        return String(a.fornitore ?? "").localeCompare(String(b.fornitore ?? ""));
      });
  }, [docsOfMonth]);

  const bollettiniDocs = useMemo(() => {
    return docsOfMonth
      .filter((docItem) => isBollettinoDoc(docItem))
      .sort((a, b) => {
        const aMs = getDocDate(a)?.getTime() ?? 0;
        const bMs = getDocDate(b)?.getTime() ?? 0;
        if (bMs !== aMs) return bMs - aMs;
        return String(a.fornitore ?? "").localeCompare(String(b.fornitore ?? ""));
      });
  }, [docsOfMonth]);

  const litriCaricati = useMemo(
    () =>
      docsOfMonth.reduce((sum, item) => sum + (toNumberOrNull(item.litri15C) ?? 0), 0),
    [docsOfMonth]
  );

  const litriErogati = useMemo(
    () =>
      refuelsCaravateOfMonth.reduce(
        (sum, item) => sum + (toNumberOrNull(item.litri) ?? 0),
        0
      ),
    [refuelsCaravateOfMonth]
  );

  const deltaLitri = litriCaricati - litriErogati;

  const litriPerTarga = useMemo(() => {
    const map = new Map<string, number>();
    refuelsCaravateOfMonth.forEach((item) => {
      const targa = getRefuelTarga(item) || "NON INDICATA";
      const litri = toNumberOrNull(item.litri) ?? 0;
      map.set(targa, (map.get(targa) ?? 0) + litri);
    });
    return Array.from(map.entries())
      .map(([targa, litri]) => ({ targa, litri }))
      .sort((a, b) => a.targa.localeCompare(b.targa));
  }, [refuelsCaravateOfMonth]);

  const detailRows = useMemo(() => {
    return [...refuelsCaravateOfMonth]
      .sort((a, b) => {
        const aMs = getRefuelDate(a)?.getTime() ?? 0;
        const bMs = getRefuelDate(b)?.getTime() ?? 0;
        if (bMs !== aMs) return bMs - aMs;
        return getRefuelTarga(a).localeCompare(getRefuelTarga(b));
      })
      .map((item) => {
        const d = getRefuelDate(item);
        const dateLabel = d ? d.toLocaleDateString("it-CH") : "-";
        return {
          id: String(item.id ?? `${dateLabel}_${getRefuelTarga(item)}_${item.litri ?? ""}`),
          data: dateLabel,
          targa: getRefuelTarga(item) || "NON INDICATA",
          litri: toNumberOrNull(item.litri) ?? 0,
          autista: getRefuelAutista(item),
        };
      });
  }, [refuelsCaravateOfMonth]);

  const handleSaveCambio = async () => {
    setSavingCambio(true);
    setCambioStatus("");
    try {
      const cambio = toNumberOrNull(cambioInput);
      await setDoc(
        doc(db, CISTERNA_PARAMETRI_COLLECTION, selectedMonth),
        {
          mese: selectedMonth,
          cambioEurChf: cambio,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setCambioStatus("Cambio EUR→CHF salvato.");
    } catch (err: any) {
      setCambioStatus(err?.message || "Errore salvataggio cambio EUR→CHF.");
    } finally {
      setSavingCambio(false);
    }
  };

  return (
    <div className="cisterna-page">
      <div className="cisterna-shell">
        <header className="cisterna-head">
          <div>
            <h1>Cisterna Caravate</h1>
            <p>
              Archivio separato documenti e report quantitativo mensile.
            </p>
          </div>
          <div className="cisterna-head-actions">
            <button type="button" onClick={() => navigate("/cisterna/ia")}>
              Apri IA Cisterna
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(`/cisterna/schede-test?month=${encodeURIComponent(selectedMonth)}`)
              }
            >
              Test Scheda (IA)
            </button>
            <button type="button" onClick={() => navigate("/")}>
              Home
            </button>
          </div>
        </header>

        <section className="cisterna-controls">
          <label>
            Mese
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </label>

          <div className="cisterna-cambio-box">
            <div className="cisterna-cambio-title">Cambio EUR→CHF (manuale)</div>
            <div className="cisterna-cambio-row">
              <input
                type="number"
                step="0.0001"
                placeholder="Es. 0.96"
                value={cambioInput}
                onChange={(e) => setCambioInput(e.target.value)}
              />
              <button
                type="button"
                onClick={handleSaveCambio}
                disabled={savingCambio}
              >
                {savingCambio ? "Salvataggio..." : "Salva"}
              </button>
            </div>
            {cambioStatus ? (
              <div className="cisterna-cambio-status">{cambioStatus}</div>
            ) : null}
          </div>
        </section>

        <nav className="cisterna-tabs">
          <button
            type="button"
            className={activeTab === "archivio" ? "active" : ""}
            onClick={() => setActiveTab("archivio")}
          >
            Archivio
          </button>
          <button
            type="button"
            className={activeTab === "report" ? "active" : ""}
            onClick={() => setActiveTab("report")}
          >
            Report Mensile
          </button>
          <button
            type="button"
            className={activeTab === "targhe" ? "active" : ""}
            onClick={() => setActiveTab("targhe")}
          >
            Targhe + Dettaglio
          </button>
        </nav>

                        {activeTab === "archivio" ? (
          <section className="cisterna-card">
            <h2>Archivio mensile - {monthLabel(selectedMonth)}</h2>
            <div className="cisterna-archivio-grid">
              <article className="cisterna-archivio-block">
                <div className="cisterna-archivio-head">
                  <h3>Rifornimenti autisti</h3>
                  <span className="cisterna-archivio-count">
                    {refuelsMonthlyRows.length}
                  </span>
                </div>
                <p className="cisterna-archivio-note">
                  Supporto archivio: quando presente, fa fede la scheda manuale.
                </p>
                {refuelsLoading ? <div>Caricamento rifornimenti...</div> : null}
                {refuelsError ? (
                  <div className="cisterna-error">{refuelsError}</div>
                ) : null}
                {!refuelsLoading && !refuelsError && refuelsMonthlyRows.length === 0 ? (
                  <div>Nessun rifornimento autisti per questo mese.</div>
                ) : null}
                {!refuelsLoading && !refuelsError && refuelsMonthlyRows.length > 0 ? (
                  <ul className="cisterna-archivio-list">
                    {refuelsMonthlyRows.map((row) => (
                      <li key={row.id} className="cisterna-archivio-item">
                        <div className="cisterna-archivio-main">
                          <strong>{row.dateLabel}</strong>
                          <span>{row.targa}</span>
                        </div>
                        <div className="cisterna-archivio-meta">
                          <span>{formatLitri(row.litri)} L</span>
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
                  <span className="cisterna-archivio-count">
                    {fattureDocs.length}
                  </span>
                </div>
                {docsLoading ? <div>Caricamento documenti...</div> : null}
                {docsError ? <div className="cisterna-error">{docsError}</div> : null}
                {!docsLoading && !docsError && fattureDocs.length === 0 ? (
                  <div>Nessuna fattura per questo mese.</div>
                ) : null}
                {!docsLoading && !docsError && fattureDocs.length > 0 ? (
                  <ul className="cisterna-archivio-list">
                    {fattureDocs.map((item) => {
                      const d = getDocDate(item);
                      const dateLabel = d ? d.toLocaleDateString("it-CH") : "-";
                      return (
                        <li key={item.id} className="cisterna-archivio-item">
                          <div className="cisterna-archivio-main">
                            <strong>{dateLabel}</strong>
                            <span>{item.fornitore || "-"}</span>
                            <span>{item.prodotto || "-"}</span>
                          </div>
                          <div className="cisterna-archivio-meta">
                            <span>{formatLitri(item.litri15C ?? null)} L</span>
                            {item.fileUrl ? (
                              <a
                                className="cisterna-archivio-link"
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Apri
                              </a>
                            ) : (
                              <span>-</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </article>

              <article className="cisterna-archivio-block">
                <div className="cisterna-archivio-head">
                  <h3>Bollettini</h3>
                  <span className="cisterna-archivio-count">
                    {bollettiniDocs.length}
                  </span>
                </div>
                {docsLoading ? <div>Caricamento documenti...</div> : null}
                {docsError ? <div className="cisterna-error">{docsError}</div> : null}
                {!docsLoading && !docsError && bollettiniDocs.length === 0 ? (
                  <div>Nessun bollettino per questo mese.</div>
                ) : null}
                {!docsLoading && !docsError && bollettiniDocs.length > 0 ? (
                  <ul className="cisterna-archivio-list">
                    {bollettiniDocs.map((item) => {
                      const d = getDocDate(item);
                      const dateLabel = d ? d.toLocaleDateString("it-CH") : "-";
                      return (
                        <li key={item.id} className="cisterna-archivio-item">
                          <div className="cisterna-archivio-main">
                            <strong>{dateLabel}</strong>
                            <span>{item.fornitore || "-"}</span>
                            <span>{item.prodotto || "-"}</span>
                          </div>
                          <div className="cisterna-archivio-meta">
                            <span>{formatLitri(item.litri15C ?? null)} L</span>
                            {item.fileUrl ? (
                              <a
                                className="cisterna-archivio-link"
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Apri
                              </a>
                            ) : (
                              <span>-</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </article>
            </div>

            <h3 className="cisterna-subtitle">
              Archivio documenti - {monthLabel(selectedMonth)}
            </h3>
            {docsLoading ? <div>Caricamento documenti...</div> : null}
            {docsError ? <div className="cisterna-error">{docsError}</div> : null}
            {!docsLoading && !docsError && docsOfMonth.length === 0 ? (
              <div>Nessun documento in questo mese.</div>
            ) : null}
            {!docsLoading && !docsError && docsOfMonth.length > 0 ? (
              <div className="cisterna-table-wrap">
                <table className="cisterna-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Fornitore</th>
                      <th>Prodotto</th>
                      <th>Litri 15°C</th>
                      <th>Luogo consegna</th>
                      <th>File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsOfMonth.map((item) => (
                      <tr key={item.id}>
                        <td>{item.dataDocumento || "-"}</td>
                        <td>{item.tipoDocumento || "-"}</td>
                        <td>{item.fornitore || "-"}</td>
                        <td>{item.prodotto || "-"}</td>
                        <td>{item.litri15C ?? "-"}</td>
                        <td>{item.luogoConsegna || "-"}</td>
                        <td>
                          {item.fileUrl ? (
                            <a
                              href={item.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
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

            <h3 className="cisterna-subtitle">
              Schede carburante - {monthLabel(selectedMonth)}
            </h3>
            {schedeLoading ? <div>Caricamento schede...</div> : null}
            {schedeError ? (
              <div className="cisterna-error">{schedeError}</div>
            ) : null}
            {!schedeLoading && !schedeError && schedeOfMonthSorted.length === 0 ? (
              <div>Nessuna scheda per questo mese.</div>
            ) : null}
            {!schedeLoading && !schedeError && schedeOfMonthSorted.length > 0 ? (
              <ul className="cisterna-archivio-list">
                {schedeOfMonthSorted.map((item) => {
                  const created = getSchedaDate(item);
                  const dateLabel = created
                    ? created.toLocaleString("it-CH")
                    : item.yearMonth || item.mese || "-";
                  const sourceLabel =
                    item.source === "manual"
                      ? "Manuale"
                      : item.source === "ia"
                      ? "IA"
                      : item.source || "-";
                  const rowsCount =
                    item.rowCount ?? (Array.isArray(item.rows) ? item.rows.length : 0);
                  return (
                    <li key={item.id} className="cisterna-archivio-item">
                      <div className="cisterna-archivio-main">
                        <strong>{dateLabel}</strong>
                        <span>
                          {sourceLabel} - {rowsCount} righe
                        </span>
                        {getSchedaTarga(item) ? (
                          <span>Targa: {getSchedaTarga(item)}</span>
                        ) : null}
                      </div>
                      <div className="cisterna-archivio-meta">
                        <span
                          className={`cisterna-archivio-badge ${
                            item.needsReview ? "warn" : "ok"
                          }`}
                        >
                          {item.needsReview ? "Da verificare" : "OK"}
                        </span>
                        <div className="cisterna-archivio-actions">
                          <button
                            type="button"
                            className="cisterna-archivio-action"
                            onClick={() =>
                              navigate(
                                `/cisterna/schede-test?edit=${encodeURIComponent(item.id)}&month=${encodeURIComponent(selectedMonth)}`
                              )
                            }
                            title="Apri o modifica questa scheda"
                          >
                            Apri/Modifica
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        ) : null}

        {activeTab === "report" ? (
          <section className="cisterna-card">
            <h2>Report Mensile - {monthLabel(selectedMonth)}</h2>
            {refuelsLoading ? <div>Caricamento rifornimenti...</div> : null}
            {refuelsError ? (
              <div className="cisterna-error">{refuelsError}</div>
            ) : null}
            <div className="cisterna-kpi-grid">
              <article>
                <span>Litri caricati (documenti cisterna)</span>
                <strong>{litriCaricati.toFixed(2)} L</strong>
              </article>
              <article>
                <span>Litri erogati (rifornimenti autisti, tipo=caravate)</span>
                <strong>{litriErogati.toFixed(2)} L</strong>
              </article>
              <article>
                <span>Delta litri</span>
                <strong>{deltaLitri.toFixed(2)} L</strong>
              </article>
            </div>
            <p className="cisterna-note">
              Sorgente erogati: <code>storage/{RIFORNIMENTI_AUTISTI_KEY}</code>,
              filtro su campo <code>tipo = "caravate"</code>.
            </p>
          </section>
        ) : null}

        {activeTab === "targhe" ? (
          <section className="cisterna-card">
            <h2>Targhe + Dettaglio - {monthLabel(selectedMonth)}</h2>
            {litriPerTarga.length === 0 ? (
              <div>Nessun rifornimento caravate trovato nel mese.</div>
            ) : (
              <div className="cisterna-table-wrap">
                <table className="cisterna-table">
                  <thead>
                    <tr>
                      <th>Targa</th>
                      <th>Litri erogati</th>
                    </tr>
                  </thead>
                  <tbody>
                    {litriPerTarga.map((row) => (
                      <tr key={row.targa}>
                        <td>{row.targa}</td>
                        <td>{row.litri.toFixed(2)} L</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 className="cisterna-subtitle">Dettaglio rifornimenti del mese</h3>
            {detailRows.length === 0 ? (
              <div>Nessun dettaglio disponibile per il mese selezionato.</div>
            ) : (
              <div className="cisterna-table-wrap">
                <table className="cisterna-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Targa</th>
                      <th>Litri</th>
                      <th>Autista</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.data}</td>
                        <td>{row.targa}</td>
                        <td>{row.litri.toFixed(2)} L</td>
                        <td>{row.autista}</td>
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
