import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  readNextCisternaSchedaDetail,
  readNextCisternaSnapshot,
  type NextCisternaSchedaDetail,
  type NextCisternaSnapshot,
} from "./domain/nextCisternaDomain";
import "../pages/CisternaCaravate/CisternaSchedeTest.css";

type Mode = "manual" | "ia";
type ManualRow = {
  id: string;
  data: string;
  targa: string;
  nome: string;
  litri: string;
  azienda: "cementi" | "import";
};

function makeRowId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyRow(): ManualRow {
  return {
    id: makeRowId(),
    data: "",
    targa: "",
    nome: "",
    litri: "",
    azienda: "cementi",
  };
}

function readMonthParam(search: string) {
  const value = String(new URLSearchParams(search).get("month") ?? "").trim();
  return /^\d{4}-\d{2}$/.test(value) ? value : null;
}

function readEditParam(search: string) {
  return String(new URLSearchParams(search).get("edit") ?? "").trim() || null;
}

export default function NextCisternaSchedeTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const requestedMonth = useMemo(() => readMonthParam(location.search), [location.search]);
  const editId = useMemo(() => readEditParam(location.search), [location.search]);
  const [mode, setMode] = useState<Mode>("manual");
  const [snapshot, setSnapshot] = useState<NextCisternaSnapshot | null>(null);
  const [detail, setDetail] = useState<NextCisternaSchedaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(requestedMonth ?? "");
  const [manualRows, setManualRows] = useState<ManualRow[]>(() =>
    Array.from({ length: 6 }, () => createEmptyRow()),
  );
  const [iaFileName, setIaFileName] = useState("");
  const [iaPreviewUrl, setIaPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const nextSnapshot = await readNextCisternaSnapshot(selectedMonth || requestedMonth || undefined);
        if (cancelled) {
          return;
        }
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

  useEffect(() => {
    if (!editId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const nextDetail = await readNextCisternaSchedaDetail(editId);
      if (!cancelled) {
        setDetail(nextDetail);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  return (
    <NextClonePageScaffold
      eyebrow="Cisterna / Schede"
      title="Cisterna Schede Test"
      description="Pagina NEXT nativa per schede carburante: archivio, apertura scheda e compilazione clone-safe senza writer o OCR legacy."
      backTo="/next/cisterna"
      backLabel="Torna a Cisterna"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
          {loading ? <div className="next-clone-placeholder">Caricamento schede cisterna...</div> : null}
          {detail ? (
            <div className="next-clone-placeholder">
              Scheda aperta: {detail.id} | Righe {detail.rowCount} | Fonte {detail.sourceLabel}
            </div>
          ) : null}
        </div>
      }
      actions={
        <button type="button" className="next-clone-header-action" onClick={() => navigate("/next/cisterna/ia")}>
          IA Cisterna
        </button>
      }
    >
      <div className="cisterna-schede-page">
        <div className="cisterna-schede-shell">
          <section className="cisterna-schede-card">
            <div className="cisterna-schede-head">
              <h2>Controllo schede</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <select
                  value={snapshot?.monthKey ?? selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                >
                  {(snapshot?.availableMonths ?? []).map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <button type="button" className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>
                  Manuale
                </button>
                <button type="button" className={mode === "ia" ? "active" : ""} onClick={() => setMode("ia")}>
                  IA
                </button>
              </div>
            </div>

            {mode === "manual" ? (
              <div className="cisterna-schede-table-wrap">
                <table className="cisterna-schede-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Targa</th>
                      <th>Nome</th>
                      <th>Litri</th>
                      <th>Azienda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualRows.map((row) => (
                      <tr key={row.id}>
                        <td><input value={row.data} onChange={(event) => setManualRows((current) => current.map((entry) => entry.id === row.id ? { ...entry, data: event.target.value } : entry))} /></td>
                        <td><input value={row.targa} onChange={(event) => setManualRows((current) => current.map((entry) => entry.id === row.id ? { ...entry, targa: event.target.value.toUpperCase() } : entry))} /></td>
                        <td><input value={row.nome} onChange={(event) => setManualRows((current) => current.map((entry) => entry.id === row.id ? { ...entry, nome: event.target.value } : entry))} /></td>
                        <td><input value={row.litri} onChange={(event) => setManualRows((current) => current.map((entry) => entry.id === row.id ? { ...entry, litri: event.target.value } : entry))} /></td>
                        <td>
                          <select value={row.azienda} onChange={(event) => setManualRows((current) => current.map((entry) => entry.id === row.id ? { ...entry, azienda: event.target.value as ManualRow["azienda"] } : entry))}>
                            <option value="cementi">GHIELMICEMENTI</option>
                            <option value="import">GHIELMIIMPORT</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  <button type="button" onClick={() => setManualRows((current) => [...current, createEmptyRow()])}>
                    Aggiungi riga
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNotice("Nel clone il salvataggio delle schede manuali resta bloccato: nessuna scrittura sulla collection cisterna.")
                    }
                  >
                    Conferma e salva
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setIaFileName(file?.name ?? "");
                    if (file?.type.startsWith("image/")) {
                      const reader = new FileReader();
                      reader.onload = () => setIaPreviewUrl(typeof reader.result === "string" ? reader.result : null);
                      reader.readAsDataURL(file);
                    } else {
                      setIaPreviewUrl(null);
                    }
                  }}
                />
                {iaFileName ? <div>File selezionato: {iaFileName}</div> : null}
                {iaPreviewUrl ? <img src={iaPreviewUrl} alt={iaFileName} style={{ maxWidth: 360, borderRadius: 12 }} /> : null}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setNotice(
                        iaFileName
                          ? "Nel clone l'estrazione IA delle schede resta bloccata: la route mostra solo archivio e preview locale."
                          : "Seleziona prima una scheda da testare.",
                      )
                    }
                  >
                    Estrai con IA
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNotice("Nel clone il salvataggio della scheda IA resta bloccato.")
                    }
                  >
                    Conferma e salva
                  </button>
                </div>
              </div>
            )}
          </section>

          {detail ? (
            <section className="cisterna-schede-card">
              <h2>Scheda aperta</h2>
              <p>
                ID {detail.id} | Fonte {detail.sourceLabel} | Mese {detail.monthKey || "-"} | Review {detail.needsReview ? "SI" : "NO"}
              </p>
              {detail.rows.length === 0 ? (
                <p>Nessuna riga leggibile.</p>
              ) : (
                <div className="cisterna-schede-table-wrap">
                  <table className="cisterna-schede-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Data</th>
                        <th>Targa</th>
                        <th>Nome</th>
                        <th>Litri</th>
                        <th>Azienda</th>
                        <th>Stato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.rows.map((row) => (
                        <tr key={`${detail.id}-${row.index}`}>
                          <td>{row.index + 1}</td>
                          <td>{row.data}</td>
                          <td>{row.targa}</td>
                          <td>{row.nome}</td>
                          <td>{row.litri == null ? "-" : row.litri}</td>
                          <td>{row.azienda}</td>
                          <td>{row.statoRevisione}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {snapshot ? (
            <section className="cisterna-schede-card">
              <h2>Archivio schede del mese</h2>
              {snapshot.archive.schede.length === 0 ? (
                <p>Nessuna scheda disponibile.</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {snapshot.archive.schede.map((item) => (
                    <div key={item.id} className="next-clone-placeholder">
                      <strong>{item.dateLabel}</strong> - {item.sourceLabel} - {item.rowCount} righe
                      {item.targa ? <span style={{ marginLeft: 8 }}>Targa: {item.targa}</span> : null}
                      <button
                        type="button"
                        style={{ marginLeft: 8 }}
                        onClick={() =>
                          navigate(`/next/cisterna/schede-test?edit=${encodeURIComponent(item.id)}&month=${encodeURIComponent(snapshot.monthKey)}`)
                        }
                      >
                        Apri/Modifica
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </NextClonePageScaffold>
  );
}
