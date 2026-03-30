import { useEffect, useMemo, useRef, useState } from "react";
import NextClonePageScaffold from "./NextClonePageScaffold";
import {
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaMezzoItem,
  type NextAnagraficheFlottaSnapshot,
} from "./nextAnagraficheFlottaDomain";
import { formatDateUI } from "./nextDateFormat";
import { upsertNextFlottaClonePatch } from "./nextFlottaCloneState";
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

function buildCloneLibrettoDataUrl(targa: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520" viewBox="0 0 900 520">
      <rect width="900" height="520" rx="32" fill="#0f172a" />
      <rect x="28" y="28" width="844" height="464" rx="24" fill="#e2e8f0" />
      <text x="68" y="120" font-family="Arial, sans-serif" font-size="28" fill="#0f172a">Libretto clone locale</text>
      <text x="68" y="200" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#111827">${targa}</text>
      <text x="68" y="276" font-family="Arial, sans-serif" font-size="24" fill="#334155">Riparazione eseguita nel clone NEXT</text>
      <text x="68" y="330" font-family="Arial, sans-serif" font-size="20" fill="#475569">Data: ${formatDateUI(new Date())}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function NextIACoperturaLibrettiPage() {
  const [snapshot, setSnapshot] = useState<NextAnagraficheFlottaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [repairIdsInput, setRepairIdsInput] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const [uploadTarget, setUploadTarget] = useState<NextAnagraficheFlottaMezzoItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  }, [refreshTick]);

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
                  onClick={() => {
                    const requestedIds = repairIdsInput
                      .split(/\r?\n/)
                      .map((entry) => entry.trim())
                      .filter(Boolean);
                    if (requestedIds.length === 0) {
                      setNotice("Incolla almeno un ID prima di eseguire la riparazione.");
                      return;
                    }
                    const matchingRows = rows.filter(
                      (row) => requestedIds.includes(row.id) || requestedIds.includes(row.targa),
                    );
                    if (matchingRows.length === 0) {
                      setNotice("Nessun mezzo del clone corrisponde agli ID indicati.");
                      return;
                    }
                    matchingRows.forEach((row) => {
                      upsertNextFlottaClonePatch({
                        mezzoId: row.id,
                        targa: row.targa,
                        librettoUrl: buildCloneLibrettoDataUrl(row.targa),
                        librettoStoragePath: `next-clone/libretti/${row.targa}/repair-batch.svg`,
                        updatedAt: Date.now(),
                        source: "ia-copertura",
                      });
                    });
                    setNotice(`Riparazione clone completata per ${matchingRows.length} mezzi.`);
                    setRefreshTick((current) => current + 1);
                  }}
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
                                onClick={() => {
                                  setUploadTarget(row);
                                  fileInputRef.current?.click();
                                }}
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          const target = uploadTarget;
          event.target.value = "";
          if (!file || !target) {
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : null;
            if (!result) {
              setNotice(`Impossibile leggere il file selezionato per ${target.targa}.`);
              return;
            }
            upsertNextFlottaClonePatch({
              mezzoId: target.id,
              targa: target.targa,
              librettoUrl: result,
              librettoStoragePath: `next-clone/libretti/${target.targa}/${file.name}`,
              updatedAt: Date.now(),
              source: "ia-copertura",
            });
            setNotice(`Libretto locale caricato nel clone per ${target.targa}.`);
            setRefreshTick((current) => current + 1);
            setUploadTarget(null);
          };
          reader.readAsDataURL(file);
        }}
      />
    </NextClonePageScaffold>
  );
}
