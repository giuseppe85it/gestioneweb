import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { monthLabel } from "../cisterna/collections";
import "../pages/CisternaCaravate/CisternaCaravatePage.css";
import "./next-shell.css";
import {
  readNextCisternaSnapshot,
  type NextCisternaDetailRow,
  type NextCisternaDocumentItem,
  type NextCisternaDuplicateGroup,
  type NextCisternaPerTargaItem,
  type NextCisternaQuality,
  type NextCisternaSchedaItem,
  type NextCisternaSnapshot,
  type NextCisternaSupportItem,
} from "./domain/nextCisternaDomain";

type TabKey = "archivio" | "report" | "targhe";

function normalizeMonthParam(value: string | null): string | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? `${match[1]}-${match[2]}` : null;
}

function formatLitri(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "N/D";
  return `${value.toFixed(2)} L`;
}

function formatMoney(value: number | null, currency: "EUR" | "CHF"): string {
  if (value == null || !Number.isFinite(value)) return "N/D";
  return new Intl.NumberFormat("it-CH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDiff(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "-";
  const normalized = Math.round(value * 100) / 100;
  return `${normalized > 0 ? "+" : ""}${normalized.toFixed(2)} L`;
}

function getQualityLabel(value: NextCisternaQuality): string {
  if (value === "certo") return "Completo";
  if (value === "parziale") return "Parziale";
  return "Da verificare";
}

function getCompanyClass(label: string): "cementi" | "import" | "neutral" {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("import")) return "import";
  if (normalized.includes("cement")) return "cementi";
  return "neutral";
}

function renderSupportItem(item: NextCisternaSupportItem) {
  return (
    <li key={item.id} className="cisterna-archivio-item">
      <div className="cisterna-archivio-main">
        <strong>{item.targa}</strong>
        <span>{item.autista || "-"}</span>
      </div>
      <div className="cisterna-archivio-meta">
        <span>{item.dateLabel}</span>
        <span>{formatLitri(item.litri)}</span>
      </div>
    </li>
  );
}

function renderArchiveDocumentItem(item: NextCisternaDocumentItem) {
  return (
    <li key={item.id} className="cisterna-archivio-item">
      <div className="cisterna-archivio-main">
        <strong>{item.tipoDocumento || "Documento"}</strong>
        <span>{[item.fornitore, item.prodotto].filter(Boolean).join(" - ") || "Archivio cisterna"}</span>
      </div>
      <div className="cisterna-archivio-meta">
        <span>{item.dateLabel}</span>
        <span>{item.litriLabel}</span>
        {item.fileUrl ? (
          <a
            className="cisterna-archivio-link"
            href={item.fileUrl}
            target="_blank"
            rel="noreferrer"
          >
            Apri file
          </a>
        ) : null}
      </div>
    </li>
  );
}

function renderSchedaItem(item: NextCisternaSchedaItem) {
  return (
    <li key={item.id} className="cisterna-archivio-item">
      <div className="cisterna-archivio-main">
        <strong>{item.targa || "Scheda senza targa"}</strong>
        <span>{item.sourceLabel}</span>
      </div>
      <div className="cisterna-archivio-meta">
        <span>{item.dateLabel}</span>
        <span>{item.rowCount} righe</span>
        <span className={`cisterna-archivio-badge ${item.needsReview ? "warn" : "ok"}`}>
          {item.needsReview ? "Da verificare" : "OK"}
        </span>
      </div>
    </li>
  );
}

function renderDuplicateGroup(group: NextCisternaDuplicateGroup) {
  return (
    <article key={group.key} className="cisterna-dup-card">
      <div className="cisterna-dup-head">
        {group.dateLabel} - {group.resolution === "persisted" ? "scelta persistita" : "fallback max litri"}
      </div>
      <div className="cisterna-dup-warning">{group.note}</div>
      <div className="cisterna-dup-list">
        {group.items.map((item) => (
          <div
            key={item.id}
            className={`cisterna-dup-item ${item.duplicateState === "value" ? "selected" : ""}`}
          >
            <div className={`cisterna-dup-badge ${item.duplicateState}`}>
              {item.duplicateState === "value" ? "Valido" : "Ignorato"}
            </div>
            <div className="cisterna-dup-meta">
              <strong>{item.fornitore || item.tipoDocumento || "Documento"}</strong>
              <span>{[item.dateLabel, item.litriLabel, item.prodotto].filter(Boolean).join(" - ")}</span>
            </div>
            <div className="cisterna-dup-actions">
              {item.fileUrl ? (
                <a
                  className="cisterna-archivio-link"
                  href={item.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Apri file
                </a>
              ) : (
                <span>-</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function renderPerTargaRows(items: NextCisternaPerTargaItem[], currency: "EUR" | "CHF" | null) {
  if (items.length === 0) {
    return <p className="cisterna-note">Nessuna ripartizione per targa disponibile.</p>;
  }

  return (
    <div className="cisterna-table-wrap">
      <table className="cisterna-table">
        <thead>
          <tr>
            <th>Targa</th>
            <th>Azienda</th>
            <th>Litri</th>
            <th>Costo stimato ({currency || "valuta"})</th>
            <th>Costo stimato (CHF)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.targa}>
              <td>{item.targa}</td>
              <td>
                <span className={`company-pill ${getCompanyClass(item.aziendaLabel)}`}>
                  {item.aziendaLabel}
                </span>
              </td>
              <td>{formatLitri(item.litri)}</td>
              <td>{currency ? formatMoney(item.costoStimatoValuta, currency) : "N/D"}</td>
              <td>{formatMoney(item.costoStimatoChf, "CHF")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderDetailRows(items: NextCisternaDetailRow[]) {
  if (items.length === 0) {
    return (
      <p className="cisterna-note">
        Nessun dettaglio mese ricostruibile in modo affidabile per il periodo selezionato.
      </p>
    );
  }

  return (
    <div className="cisterna-table-wrap">
      <table className="cisterna-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Targa</th>
            <th>Azienda</th>
            <th>Litri</th>
            <th>Autista</th>
            <th>Supporto autisti</th>
            <th>Stato</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.data}</td>
              <td>{item.targa}</td>
              <td>
                <span className={`company-pill ${getCompanyClass(item.aziendaLabel)}`}>
                  {item.aziendaLabel}
                </span>
              </td>
              <td>{formatLitri(item.litri)}</td>
              <td>{item.autista !== "-" ? item.autista : item.nome}</td>
              <td>
                {item.supportLitri == null
                  ? "-"
                  : `${formatLitri(item.supportLitri)} (${item.supportCount})`}
              </td>
              <td>{item.supportStatus}</td>
              <td>{formatDiff(item.diff)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NextCisternaPage() {
  const location = useLocation();
  const initialMonth = useMemo(
    () => normalizeMonthParam(new URLSearchParams(location.search).get("month")) ?? "",
    [location.search],
  );
  const backToHome = location.search
    ? `/next${location.search}`
    : "/next";

  const [activeTab, setActiveTab] = useState<TabKey>("archivio");
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [snapshot, setSnapshot] = useState<NextCisternaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cisternaIaPath = selectedMonth
    ? `/next/cisterna/ia?month=${selectedMonth}`
    : "/next/cisterna/ia";
  const cisternaSchedeTestPath = selectedMonth
    ? `/next/cisterna/schede-test?month=${selectedMonth}`
    : "/next/cisterna/schede-test";

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextCisternaSnapshot(selectedMonth || null);
        if (cancelled) return;
        setSnapshot(nextSnapshot);
        if (!selectedMonth || selectedMonth !== nextSnapshot.monthKey) {
          setSelectedMonth(nextSnapshot.monthKey);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossibile leggere il report Cisterna in sola lettura.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  const limitations = snapshot?.limitations ?? [];
  const derivationNotes = snapshot?.derivationNotes ?? [];
  const reportNotes = snapshot?.report.notes ?? [];
  const monthOptions = snapshot?.availableMonths?.length
    ? snapshot.availableMonths
    : selectedMonth
      ? [selectedMonth]
      : [];

  return (
    <div className="cisterna-page">
      <div className="cisterna-shell">
        <header className="cisterna-head">
          <div className="cisterna-head-title">
            <img src="/logo.png" alt="logo" className="cisterna-head-logo" />
            <div>
              <h1>Cisterna Caravate</h1>
              <p>
                Archivio, report mensile e ripartizioni per targa aperti nel clone solo in
                consultazione.
              </p>
            </div>
          </div>
          <div className="next-clone-readonly-badge">{snapshot ? getQualityLabel(snapshot.quality) : "READ-ONLY"}</div>
        </header>

        <section className="next-clone-placeholder">
          <p>
            Nel clone sono aperte la route base `Cisterna`, il modulo `Cisterna IA` e ora
            anche `Schede Test` in forma clone-safe, mantenendo fuori solo le azioni che
            scriverebbero sulla madre.
          </p>
          <p style={{ marginTop: 12 }}>
            Restano bloccati conferma duplicati, salvataggio cambio EUR/CHF, estrazione IA
            reale, upload crop/immagini, save/update schede ed export PDF.
          </p>
          <p style={{ marginTop: 12 }}>
            <Link to={cisternaIaPath}>Apri Cisterna IA nel clone</Link>
          </p>
          <p style={{ marginTop: 12 }}>
            <Link to={cisternaSchedeTestPath}>Apri Schede Test nel clone</Link>
          </p>
          <p style={{ marginTop: 12 }}>
            <Link to={backToHome}>Torna alla Home clone</Link>
          </p>
        </section>

        <section className="cisterna-controls">
          <label>
            <span>Mese</span>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              style={{
                minWidth: 220,
                border: "1px solid #c7d6e8",
                borderRadius: 12,
                padding: "10px 12px",
                background: "#fff",
              }}
            >
              {monthOptions.length > 0 ? (
                monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {monthLabel(month)}
                  </option>
                ))
              ) : (
                <option value="">Caricamento mesi...</option>
              )}
            </select>
          </label>
          <div className="cisterna-cambio-box">
            <div className="cisterna-cambio-title">Stato report clone</div>
            <div className="cisterna-cambio-preview">
              {snapshot
                ? `${snapshot.monthLabel} - Documenti ${snapshot.counts.documents}, Schede ${snapshot.counts.schede}, Supporto ${snapshot.counts.supportRefuels}`
                : "Caricamento snapshot cisterna..."}
            </div>
            {snapshot ? (
              <div className="cisterna-cambio-preview">
                Fonte verita: {snapshot.report.sourceTruthLabel} | Cambio EUR/CHF:{" "}
                {snapshot.report.cambioEurChf ?? "N/D"}
              </div>
            ) : null}
          </div>
        </section>

        {snapshot ? (
          <div className="cisterna-tabs">
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
              Report mensile
            </button>
            <button
              type="button"
              className={activeTab === "targhe" ? "active" : ""}
              onClick={() => setActiveTab("targhe")}
            >
              Targhe + dettaglio
            </button>
          </div>
        ) : null}

        {loading ? <section className="cisterna-card">Caricamento Cisterna...</section> : null}
        {error ? <section className="cisterna-error">{error}</section> : null}

        {!loading && !error && snapshot ? (
          <>
            {limitations.length > 0 ? (
              <section className="cisterna-card">
                <h2>Avvisi di ricostruzione</h2>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#4a6078" }}>
                  {limitations.map((item) => (
                    <li key={item} style={{ marginTop: 6 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {derivationNotes.length > 0 ? (
              <section className="cisterna-card">
                <h2>Regole di derivazione clone</h2>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#4a6078" }}>
                  {derivationNotes.map((item) => (
                    <li key={item} style={{ marginTop: 6 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {activeTab === "archivio" ? (
              <section className="cisterna-card">
                <h2>Archivio del mese</h2>
                <div className="cisterna-archivio-grid">
                  <article className="cisterna-archivio-block">
                    <div className="cisterna-archivio-head">
                      <h3>Supporto autisti</h3>
                      <span className="cisterna-archivio-count">
                        {snapshot.archive.supportRefuels.length}
                      </span>
                    </div>
                    <p className="cisterna-archivio-note">
                      Supporto read-only dai rifornimenti autisti temporanei del mese.
                    </p>
                    {snapshot.archive.supportRefuels.length > 0 ? (
                      <ul className="cisterna-archivio-list">
                        {snapshot.archive.supportRefuels.map(renderSupportItem)}
                      </ul>
                    ) : (
                      <p className="cisterna-note">Nessun supporto autisti disponibile.</p>
                    )}
                  </article>

                  <article className="cisterna-archivio-block">
                    <div className="cisterna-archivio-head">
                      <h3>Fatture</h3>
                      <span className="cisterna-archivio-count">{snapshot.archive.fatture.length}</span>
                    </div>
                    <p className="cisterna-archivio-note">
                      Documenti di costo letti in sola lettura dal mese selezionato.
                    </p>
                    {snapshot.archive.fatture.length > 0 ? (
                      <ul className="cisterna-archivio-list">
                        {snapshot.archive.fatture.map(renderArchiveDocumentItem)}
                      </ul>
                    ) : (
                      <p className="cisterna-note">Nessuna fattura disponibile.</p>
                    )}
                  </article>

                  <article className="cisterna-archivio-block">
                    <div className="cisterna-archivio-head">
                      <h3>Bollettini effettivi</h3>
                      <span className="cisterna-archivio-count">
                        {snapshot.archive.bollettiniEffective.length}
                      </span>
                    </div>
                    <p className="cisterna-archivio-note">
                      Il clone mostra solo i bollettini validi dopo la risoluzione read-only dei duplicati.
                    </p>
                    {snapshot.archive.bollettiniEffective.length > 0 ? (
                      <ul className="cisterna-archivio-list">
                        {snapshot.archive.bollettiniEffective.map(renderArchiveDocumentItem)}
                      </ul>
                    ) : (
                      <p className="cisterna-note">Nessun bollettino effettivo disponibile.</p>
                    )}
                  </article>

                  <article className="cisterna-archivio-block">
                    <div className="cisterna-archivio-head">
                      <h3>Schede mese</h3>
                      <span className="cisterna-archivio-count">{snapshot.archive.schede.length}</span>
                    </div>
                    <p className="cisterna-archivio-note">
                      Storico schede in sola lettura, senza link di modifica o apertura dell'editor.
                    </p>
                    {snapshot.archive.schede.length > 0 ? (
                      <ul className="cisterna-archivio-list">
                        {snapshot.archive.schede.map(renderSchedaItem)}
                      </ul>
                    ) : (
                      <p className="cisterna-note">Nessuna scheda nel mese selezionato.</p>
                    )}
                  </article>
                </div>

                {snapshot.archive.duplicateGroups.length > 0 ? (
                  <div className="cisterna-dup-section">
                    <p>
                      Duplicati bollettini: il clone li mostra in sola lettura e non consente
                      conferme o correzioni.
                    </p>
                    {snapshot.archive.duplicateGroups.map(renderDuplicateGroup)}
                  </div>
                ) : null}

                <h3 className="cisterna-subtitle">Archivio documenti del mese</h3>
                <div className="cisterna-table-wrap">
                  <table className="cisterna-table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>Fornitore</th>
                        <th>Prodotto</th>
                        <th>Litri</th>
                        <th>Luogo</th>
                        <th>File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.archive.documents.length > 0 ? (
                        snapshot.archive.documents.map((item) => (
                          <tr key={item.id}>
                            <td>{item.dateLabel}</td>
                            <td>{item.tipoDocumento || "-"}</td>
                            <td>{item.fornitore || "-"}</td>
                            <td>{item.prodotto || "-"}</td>
                            <td>{item.litriLabel}</td>
                            <td>{item.luogoConsegna || "-"}</td>
                            <td>
                              {item.fileUrl ? (
                                <a
                                  className="cisterna-archivio-link"
                                  href={item.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Apri
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7}>Nessun documento disponibile nel mese.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {activeTab === "report" ? (
              <section className="cisterna-card">
                <div className="cisterna-report-head">
                  <div>
                    <h2>Report mensile</h2>
                    <p className="cisterna-note" style={{ marginTop: 6 }}>
                      Nessun export PDF nel clone. Il report resta solo consultivo.
                    </p>
                  </div>
                </div>

                <div className="cisterna-source-banner">
                  Fonte verita: {snapshot.report.sourceTruthLabel}
                  {snapshot.report.hasManualTruth ? "" : " (nessuna scheda manuale nel mese)"}
                </div>

                <div className="cisterna-kpi-grid">
                  <article>
                    <span>Litri mese</span>
                    <strong>{formatLitri(snapshot.report.litriTotaliMese)}</strong>
                  </article>
                  <article>
                    <span>Litri documenti</span>
                    <strong>{formatLitri(snapshot.report.litriDocumentiMese)}</strong>
                  </article>
                  <article>
                    <span>Supporto autisti</span>
                    <strong>{formatLitri(snapshot.report.litriSupportoMese)}</strong>
                  </article>
                  <article>
                    <span>Delta supporto</span>
                    <strong>{formatDiff(snapshot.report.deltaLitriSupporto)}</strong>
                  </article>
                </div>

                <p className="cisterna-report-summary-line">
                  Totale fatture:{" "}
                  {snapshot.report.costi.baseCurrency
                    ? formatMoney(
                        snapshot.report.costi.totalFatturaValuta,
                        snapshot.report.costi.baseCurrency,
                      )
                    : "N/D"}
                  {" | "}Cambio EUR/CHF: {snapshot.report.cambioEurChf ?? "N/D"}
                  {" | "}Totale CHF: {formatMoney(snapshot.report.costi.totalChfNormalized, "CHF")}
                  {" | "}Costo/lt:{" "}
                  {snapshot.report.costi.baseCurrency
                    ? formatMoney(
                        snapshot.report.costi.costoPerLitroValuta,
                        snapshot.report.costi.baseCurrency,
                      )
                    : "N/D"}
                  {" / "}
                  {formatMoney(snapshot.report.costi.costoPerLitroChf, "CHF")}
                </p>

                <div className="cisterna-company-split">
                  <h3>Ripartizione per azienda</h3>
                  <div className="cisterna-table-wrap">
                    <table className="cisterna-table">
                      <thead>
                        <tr>
                          <th>Azienda</th>
                          <th>Litri</th>
                          <th>Costo ({snapshot.report.costi.baseCurrency || "valuta"})</th>
                          <th>Costo (CHF)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="cisterna-company-box cementi">
                          <td>
                            <span className="company-pill cementi">GHIELMICEMENTI</span>
                          </td>
                          <td>{formatLitri(snapshot.report.ripartizioneAzienda.cementi.litri)}</td>
                          <td>
                            {snapshot.report.costi.baseCurrency
                              ? formatMoney(
                                  snapshot.report.ripartizioneAzienda.cementi.costoValuta,
                                  snapshot.report.costi.baseCurrency,
                                )
                              : "N/D"}
                          </td>
                          <td>
                            {formatMoney(
                              snapshot.report.ripartizioneAzienda.cementi.costoChf,
                              "CHF",
                            )}
                          </td>
                        </tr>
                        <tr className="cisterna-company-box import">
                          <td>
                            <span className="company-pill import">GHIELMIIMPORT</span>
                          </td>
                          <td>{formatLitri(snapshot.report.ripartizioneAzienda.import.litri)}</td>
                          <td>
                            {snapshot.report.costi.baseCurrency
                              ? formatMoney(
                                  snapshot.report.ripartizioneAzienda.import.costoValuta,
                                  snapshot.report.costi.baseCurrency,
                                )
                              : "N/D"}
                          </td>
                          <td>
                            {formatMoney(
                              snapshot.report.ripartizioneAzienda.import.costoChf,
                              "CHF",
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {reportNotes.length > 0 ? (
                  <div className="cisterna-note">
                    <strong>Note di derivazione</strong>
                    <ul style={{ marginBottom: 0 }}>
                      {reportNotes.map((item) => (
                        <li key={item} style={{ marginTop: 6 }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            {activeTab === "targhe" ? (
              <section className="cisterna-card">
                <h2>Targhe + dettaglio mese</h2>
                <p className="cisterna-note">
                  Il clone espone solo le tabelle consultive derivate; nessun link verso editor
                  schede o workflow IA.
                </p>
                <h3 className="cisterna-subtitle">Ripartizione per targa</h3>
                {renderPerTargaRows(
                  snapshot.report.perTarga,
                  snapshot.report.costi.baseCurrency,
                )}
                <h3 className="cisterna-subtitle">Dettaglio mese</h3>
                {renderDetailRows(snapshot.report.detailRows)}
              </section>
            ) : null}

            <section className="cisterna-card">
              <h2>Azioni volutamente bloccate</h2>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#4a6078" }}>
                {snapshot.blockedActions
                  .filter((item) => {
                    const normalized = item.trim().toLowerCase();
                    return !normalized.includes("cisterna ia") && !normalized.includes("schede test");
                  })
                  .map((item) => (
                  <li key={item} style={{ marginTop: 6 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default NextCisternaPage;
