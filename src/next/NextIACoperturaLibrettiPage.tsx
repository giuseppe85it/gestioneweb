import { useEffect, useMemo, useState } from "react";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaMezzoItem,
  type NextAnagraficheFlottaSnapshot,
} from "./nextAnagraficheFlottaDomain";
import "../pages/IA/IACoperturaLibretti.css";

type FilterMode = "ALL" | "MISSING_LIBRETTO" | "MISSING_FOTO" | "MISSING_BOTH";

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toUpperCase();
}

function hasLibretto(item: NextAnagraficheFlottaMezzoItem) {
  return Boolean(item.librettoUrl);
}

function hasFoto(item: NextAnagraficheFlottaMezzoItem) {
  return Boolean(item.fotoUrl);
}

export default function NextIACoperturaLibrettiPage() {
  const [snapshot, setSnapshot] = useState<NextAnagraficheFlottaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [repairIdsInput, setRepairIdsInput] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextAnagraficheFlottaSnapshot();
        if (cancelled) {
          return;
        }
        setSnapshot(nextSnapshot);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Errore caricamento mezzi.");
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
  }, []);

  const rows = useMemo(() => snapshot?.items ?? [], [snapshot]);
  const counts = useMemo(() => {
    const missingLibretto = rows.filter((item) => !hasLibretto(item)).length;
    const missingFoto = rows.filter((item) => !hasFoto(item)).length;
    const missingBoth = rows.filter((item) => !hasLibretto(item) && !hasFoto(item)).length;
    return {
      total: rows.length,
      missingLibretto,
      missingFoto,
      missingBoth,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const query = normalizeText(search);
    return rows.filter((item) => {
      const matchesSearch = !query || normalizeText(item.targa).includes(query);
      if (!matchesSearch) {
        return false;
      }

      if (filterMode === "MISSING_LIBRETTO") {
        return !hasLibretto(item);
      }
      if (filterMode === "MISSING_FOTO") {
        return !hasFoto(item);
      }
      if (filterMode === "MISSING_BOTH") {
        return !hasLibretto(item) && !hasFoto(item);
      }
      return true;
    });
  }, [filterMode, rows, search]);

  return (
    <NextClonePageScaffold
      eyebrow="IA / Copertura"
      title="Copertura Libretti + Foto"
      description="Pagina NEXT nativa della copertura flotta: stessa vista di controllo madre, ma sopra D01 clone-safe senza upload o repair writer sulla madre."
      backTo="/next/ia"
      backLabel="Torna a IA"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {notice ? <div className="next-clone-placeholder">{notice}</div> : null}
          {loading ? <div className="next-clone-placeholder">Caricamento mezzi...</div> : null}
          {error ? <div className="next-clone-placeholder">{error}</div> : null}
        </div>
      }
    >
      <div className="iacover-page">
        <div className="iacover-shell">
          <div className="iacover-card">
            <h1 className="iacover-title">COPERTURA LIBRETTI + FOTO</h1>

            <div className="iacover-controls">
              <div className="iacover-control">
                <label htmlFor="iacover-search-next">Cerca per targa...</label>
                <input
                  id="iacover-search-next"
                  className="iacover-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cerca per targa..."
                />
              </div>

              <div className="iacover-control">
                <label htmlFor="iacover-filter-next">Mostra</label>
                <select
                  id="iacover-filter-next"
                  className="iacover-select"
                  value={filterMode}
                  onChange={(event) => setFilterMode(event.target.value as FilterMode)}
                >
                  <option value="ALL">Tutti ({counts.total})</option>
                  <option value="MISSING_LIBRETTO">Libretti mancanti ({counts.missingLibretto})</option>
                  <option value="MISSING_FOTO">Foto mancanti ({counts.missingFoto})</option>
                  <option value="MISSING_BOTH">Mancano entrambi ({counts.missingBoth})</option>
                </select>
              </div>
            </div>

            <div className="iacover-state" style={{ textAlign: "left", marginBottom: 12 }}>
              <strong>Ripara libretti da lista ID</strong>
              <div style={{ marginTop: 8 }}>
                <textarea
                  value={repairIdsInput}
                  onChange={(event) => setRepairIdsInput(event.target.value)}
                  placeholder={"Incolla gli ID cartella (uno per riga)\nEsempio:\n1765650279666\nMEZZO-1764192368638"}
                  rows={6}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="iacover-action"
                  onClick={() =>
                    setNotice(
                      repairIdsInput.trim()
                        ? "Nel clone la riparazione batch dei libretti resta bloccata: nessun upload o update sulla madre."
                        : "Incolla almeno un ID per simulare il flusso di riparazione nel clone.",
                    )
                  }
                >
                  ESEGUI RIPARAZIONE
                </button>
              </div>
            </div>

            {loading ? (
              <div className="iacover-state">Caricamento mezzi...</div>
            ) : filtered.length === 0 ? (
              <div className="iacover-state">Nessun mezzo trovato.</div>
            ) : (
              <div className="iacover-table-wrap">
                <table className="iacover-table">
                  <thead>
                    <tr>
                      <th>Targa</th>
                      <th>Categoria</th>
                      <th>Libretto</th>
                      <th>Foto</th>
                      <th>Azione</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const librettoOk = hasLibretto(row);
                      const fotoOk = hasFoto(row);
                      return (
                        <tr key={row.id}>
                          <td className="iacover-strong">{row.targa}</td>
                          <td>{row.categoria || "-"}</td>
                          <td>
                            <span className={`iacover-badge ${librettoOk ? "ok" : "ko"}`}>
                              {librettoOk ? "OK" : "NO"}
                            </span>
                          </td>
                          <td>
                            <span className={`iacover-badge ${fotoOk ? "ok" : "ko"}`}>
                              {fotoOk ? "OK" : "NO"}
                            </span>
                          </td>
                          <td>
                            {librettoOk ? (
                              <button
                                type="button"
                                className="iacover-action"
                                onClick={() => window.open(row.librettoUrl ?? "", "_blank", "noopener,noreferrer")}
                              >
                                Apri libretto
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="iacover-action"
                                onClick={() =>
                                  setNotice(`Nel clone il caricamento/ripristino del libretto di ${row.targa} resta bloccato.`)
                                }
                              >
                                Carica libretto
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {snapshot?.limitations.length ? (
              <div className="iacover-state" style={{ textAlign: "left", marginTop: 12 }}>
                <strong>Limiti del layer flotta</strong>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  {snapshot.limitations.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </NextClonePageScaffold>
  );
}
