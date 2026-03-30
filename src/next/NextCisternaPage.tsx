import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  readNextCisternaSnapshot,
  type NextCisternaSnapshot,
} from "./domain/nextCisternaDomain";
import { upsertNextCisternaCloneParametro } from "./nextCisternaCloneState";
import "../pages/CisternaCaravate/CisternaCaravatePage.css";

type TabKey = "archivio" | "report" | "targhe";

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

function companyClass(label: string) {
  const raw = String(label ?? "").toLowerCase();
  if (raw.includes("import")) return "import";
  if (raw.includes("cement")) return "cementi";
  return "neutral";
}

function monthParam(search: string) {
  const value = String(new URLSearchParams(search).get("month") ?? "").trim();
  return /^\d{4}-\d{2}$/.test(value) ? value : null;
}

function exportPdf(snapshot: NextCisternaSnapshot) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  pdf.setFontSize(18);
  pdf.text("Cisterna Caravate - Report Mensile", 36, 40);
  pdf.setFontSize(11);
  pdf.text(`Mese: ${snapshot.monthLabel}`, 36, 58);
  autoTable(pdf, {
    startY: 76,
    head: [["Voce", "Valore"]],
    body: [
      ["Litri mese", `${snapshot.report.litriTotaliMese.toFixed(2)} L`],
      ["Litri documenti", `${snapshot.report.litriDocumentiMese.toFixed(2)} L`],
      ["Litri supporto", `${snapshot.report.litriSupportoMese.toFixed(2)} L`],
      [
        "Totale fatture",
        snapshot.report.costi.baseCurrency && snapshot.report.costi.totalFatturaValuta != null
          ? money(snapshot.report.costi.totalFatturaValuta, snapshot.report.costi.baseCurrency)
          : "N/D",
      ],
      ["Totale CHF", money(snapshot.report.costi.totalChfNormalized, "CHF")],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 125, 50] },
    theme: "grid",
    margin: { left: 36, right: 36 },
  });
  autoTable(pdf, {
    startY: ((pdf as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100) + 18,
    head: [["Targa", "Azienda", "Litri", "Costo valuta", "Costo CHF"]],
    body: snapshot.report.perTarga.map((row) => [
      row.targa,
      row.aziendaLabel,
      `${row.litri.toFixed(2)} L`,
      snapshot.report.costi.baseCurrency ? money(row.costoStimatoValuta, snapshot.report.costi.baseCurrency) : "N/D",
      money(row.costoStimatoChf, "CHF"),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [30, 64, 175] },
    theme: "striped",
    margin: { left: 36, right: 36 },
  });
  pdf.save(`cisterna-report-mensile-${snapshot.monthKey}.pdf`);
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
  const [notice, setNotice] = useState<string>("");
  const [cambioInput, setCambioInput] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextCisternaSnapshot(selectedMonth || requestedMonth || undefined);
        if (cancelled) return;
        setSnapshot(nextSnapshot);
        setSelectedMonth(nextSnapshot.monthKey);
      } catch (loadError) {
        if (cancelled) return;
        setSnapshot(null);
        setError(loadError instanceof Error ? loadError.message : "Impossibile leggere il dominio cisterna.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [requestedMonth, selectedMonth]);

  const scaffoldNotice = (
    <div style={{ display: "grid", gap: 12 }}>
      {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
      {loading ? <div className="next-clone-placeholder">Caricamento dominio cisterna...</div> : null}
      {error ? <div className="next-clone-placeholder">{error}</div> : null}
      {snapshot ? (
        <p style={{ margin: 0 }}>
          Mese {snapshot.monthLabel} | Documenti {snapshot.counts.documents} | Schede {snapshot.counts.schede} |
          Supporto rifornimenti {snapshot.counts.supportRefuels}
        </p>
      ) : null}
    </div>
  );

  return (
    <NextClonePageScaffold
      eyebrow="Operativita / Cisterna"
      title="Cisterna Caravate"
      description="Pagina NEXT nativa del verticale cisterna: archivio, report mensile e dettaglio targhe sopra D09 clone-safe."
      backTo="/next"
      backLabel="Home"
      notice={scaffoldNotice}
      actions={
        <>
          <button type="button" className="next-clone-header-action" onClick={() => navigate("/next/cisterna/ia")}>
            IA Cisterna
          </button>
          <button
            type="button"
            className="next-clone-header-action"
            onClick={() => navigate(`/next/cisterna/schede-test?month=${encodeURIComponent(snapshot?.monthKey ?? selectedMonth)}`)}
          >
            Scheda carburante
          </button>
        </>
      }
    >
      {snapshot ? (
        <div className="cisterna-page">
          <div className="cisterna-shell" style={{ padding: 0, background: "transparent" }}>
            <section className="cisterna-controls">
              <div className="cisterna-month-picker">
                <span className="cisterna-month-picker-label">Mese</span>
                <select
                  className="cisterna-month-picker-trigger"
                  value={snapshot.monthKey}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                >
                  {snapshot.availableMonths.map((monthKey) => (
                    <option key={monthKey} value={monthKey}>
                      {monthKey === snapshot.monthKey ? snapshot.monthLabel : monthKey}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cisterna-cambio-box">
                <div className="cisterna-cambio-title">Cambio EUR-&gt;CHF (manuale)</div>
                <div className="cisterna-cambio-row">
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Es. 0.96"
                    value={cambioInput}
                    onChange={(event) => setCambioInput(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = Number(String(cambioInput).replace(",", "."));
                      if (!Number.isFinite(parsed) || parsed <= 0) {
                        setNotice("Inserisci un cambio EUR/CHF valido prima di salvare.");
                        return;
                      }
                      upsertNextCisternaCloneParametro({
                        monthKey: snapshot.monthKey,
                        cambioEurChf: parsed,
                        updatedAt: Date.now(),
                      });
                      setNotice(`Cambio EUR/CHF clone salvato per ${snapshot.monthLabel}.`);
                      setSelectedMonth(snapshot.monthKey);
                    }}
                  >
                    Salva
                  </button>
                </div>
                <div className="cisterna-cambio-preview">
                  {snapshot.report.cambioEurChf != null ? `Cambio letto: ${snapshot.report.cambioEurChf}` : "Nessun cambio salvato nel mese."}
                </div>
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

            {activeTab === "archivio" ? (
              <section className="cisterna-card">
                <h2>Archivio mensile - {snapshot.monthLabel}</h2>
                <div className="cisterna-archivio-grid">
                  <article className="cisterna-archivio-block">
                    <div className="cisterna-archivio-head">
                      <h3>Rifornimenti autisti</h3>
                      <span className="cisterna-archivio-count">{snapshot.archive.supportRefuels.length}</span>
                    </div>
                    <ul className="cisterna-archivio-list">
                      {snapshot.archive.supportRefuels.slice(0, 20).map((row) => (
                        <li key={row.id} className="cisterna-archivio-item">
                          <div className="cisterna-archivio-main">
                            <strong>{row.dateLabel}</strong>
                            <span>{row.targa}</span>
                          </div>
                          <div className="cisterna-archivio-meta">
                            <span>{row.litri} L</span>
                            <span>{row.autista}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </article>
                  <article className="cisterna-archivio-block">
                    <div className="cisterna-archivio-head">
                      <h3>Fatture</h3>
                      <span className="cisterna-archivio-count">{snapshot.archive.fatture.length}</span>
                    </div>
                    <ul className="cisterna-archivio-list">
                      {snapshot.archive.fatture.slice(0, 20).map((item) => (
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
                  </article>
                  <article className="cisterna-archivio-block">
                    <div className="cisterna-archivio-head">
                      <h3>Bollettini</h3>
                      <span className="cisterna-archivio-count">{snapshot.archive.bollettiniEffective.length}</span>
                    </div>
                    {snapshot.archive.duplicateGroups.length ? (
                      <div className="cisterna-dup-warning" style={{ marginBottom: 12 }}>
                        Doppio bollettino presente: nel clone si usa solo la risoluzione read-only del layer NEXT.
                      </div>
                    ) : null}
                    <ul className="cisterna-archivio-list">
                      {snapshot.archive.bollettiniEffective.slice(0, 20).map((item) => (
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
                  </article>
                </div>

                <h3 className="cisterna-subtitle">Schede carburante - {snapshot.monthLabel}</h3>
                <ul className="cisterna-archivio-list">
                  {snapshot.archive.schede.map((item) => (
                    <li key={item.id} className="cisterna-archivio-item">
                      <div className="cisterna-archivio-main">
                        <strong>{item.dateLabel}</strong>
                        <span>{item.sourceLabel} - {item.rowCount} righe</span>
                        {item.targa ? <span>Targa: {item.targa}</span> : null}
                      </div>
                      <div className="cisterna-archivio-meta">
                        <span className={`cisterna-archivio-badge ${item.needsReview ? "warn" : "ok"}`}>
                          {item.needsReview ? "Da verificare" : "OK"}
                        </span>
                        <button
                          type="button"
                          className="cisterna-archivio-action"
                          onClick={() =>
                            navigate(`/next/cisterna/schede-test?edit=${encodeURIComponent(item.id)}&month=${encodeURIComponent(snapshot.monthKey)}`)
                          }
                        >
                          Apri/Modifica
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {activeTab === "report" ? (
              <section className="cisterna-card">
                <div className="cisterna-report-head">
                  <h2>Report Mensile - {snapshot.monthLabel}</h2>
                  <button type="button" className="cisterna-report-export" onClick={() => exportPdf(snapshot)}>
                    Esporta PDF
                  </button>
                </div>
                <p className="cisterna-source-banner">Fonte litri: {snapshot.report.sourceTruthLabel}</p>
                <div className="cisterna-kpi-grid">
                  <article>
                    <span>Litri totali mese</span>
                    <strong>{snapshot.report.litriTotaliMese.toFixed(2)} L</strong>
                  </article>
                  <article>
                    <span>Totale fatture</span>
                    <strong>
                      {snapshot.report.costi.baseCurrency && snapshot.report.costi.totalFatturaValuta != null
                        ? money(snapshot.report.costi.totalFatturaValuta, snapshot.report.costi.baseCurrency)
                        : "N/D"}
                    </strong>
                  </article>
                  <article>
                    <span>Totale CHF</span>
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
                <div className="cisterna-table-wrap">
                  <table className="cisterna-table">
                    <thead>
                      <tr>
                        <th>Azienda</th>
                        <th>Litri</th>
                        <th>Costo valuta</th>
                        <th>Costo CHF</th>
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
                {snapshot.report.notes.map((note) => (
                  <p key={note} className="cisterna-note">
                    {note}
                  </p>
                ))}
              </section>
            ) : null}

            {activeTab === "targhe" ? (
              <section className="cisterna-card">
                <h2>Targhe + Dettaglio - {snapshot.monthLabel}</h2>
                <div className="cisterna-table-wrap">
                  <table className="cisterna-table">
                    <thead>
                      <tr>
                        <th>Targa</th>
                        <th>Azienda</th>
                        <th>Litri</th>
                        <th>Costo valuta</th>
                        <th>Costo CHF</th>
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
                <h3 className="cisterna-subtitle">Dettaglio litri del mese</h3>
                <div className="cisterna-table-wrap">
                  <table className="cisterna-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Targa</th>
                        <th>Litri</th>
                        <th>Autista</th>
                        <th>Azienda</th>
                        <th>Supporto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.report.detailRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.data}</td>
                          <td>{row.targa}</td>
                          <td>{row.litri.toFixed(2)} L</td>
                          <td>{row.autista || row.nome || "-"}</td>
                          <td>
                            <span className={`company-pill ${companyClass(row.aziendaLabel)}`}>{row.aziendaLabel}</span>
                          </td>
                          <td>
                            {row.supportLitri == null ? "Nessun match" : `${row.supportStatus} · ${row.supportLitri.toFixed(2)} L`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {snapshot.limitations.length ? (
              <div className="next-clone-placeholder" style={{ marginTop: 16 }}>
                <strong>Limiti del layer D09</strong>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  {snapshot.limitations.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </NextClonePageScaffold>
  );
}
