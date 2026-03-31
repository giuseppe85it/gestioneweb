import { useEffect, useMemo, useRef, useState } from "react";
import "../pages/IA/IACoperturaLibretti.css";
import {
  readNextAnagraficheFlottaSnapshot,
  type NextAnagraficheFlottaMezzoItem,
  type NextAnagraficheFlottaSnapshot,
} from "./nextAnagraficheFlottaDomain";

type FilterMode = "ALL" | "MISSING_LIBRETTO" | "MISSING_FOTO" | "MISSING_BOTH";
type UrlReachabilityStatus = "idle" | "checking" | "ok" | "broken404" | "error";

type RowItem = {
  id: string;
  targa: string;
  targaNorm: string;
  categoria: string;
  hasLibretto: boolean;
  hasFoto: boolean;
  librettoUrl: string;
  librettoStoragePath: string;
  fotoUrl: string;
  fotoStoragePath: string;
  fotoPath: string;
  librettoReason: string;
  fotoReason: string;
};

const URL_CHECK_TIMEOUT_MS = 7000;

function normalizeTarga(value?: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

function hasValue(value?: string | null) {
  return Boolean(typeof value === "string" && value.trim().length > 0);
}

async function fetchWithTimeout(url: string, method: "HEAD" | "GET", timeoutMs = URL_CHECK_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

async function probeUrlReachability(url: string) {
  const target = String(url || "").trim();
  if (!target) {
    return { ok: false, status: null as number | null, reason: "URL vuoto" };
  }

  try {
    const head = await fetchWithTimeout(target, "HEAD");
    if (head.ok || head.status === 404) {
      return { ok: head.ok, status: head.status };
    }
  } catch (error: unknown) {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.warn("[NextIACoperturaLibrettiPage] HEAD fallita:", error);
    }
  }

  try {
    const get = await fetchWithTimeout(target, "GET");
    return { ok: get.ok, status: get.status };
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, status: null as number | null, reason: "timeout" };
    }

    return {
      ok: false,
      status: null as number | null,
      reason: error instanceof Error ? error.message : "errore rete",
    };
  }
}

function mapRow(item: NextAnagraficheFlottaMezzoItem): RowItem {
  const librettoUrl = item.librettoUrl ?? "";
  const librettoStoragePath = item.librettoStoragePath ?? "";
  const fotoUrl = item.fotoUrl ?? "";
  const fotoStoragePath = item.fotoStoragePath ?? "";
  const fotoPath = item.fotoPath ?? "";
  const hasLibretto = hasValue(librettoUrl) || hasValue(librettoStoragePath);
  const hasFoto = hasValue(fotoUrl) || hasValue(fotoStoragePath) || hasValue(fotoPath);

  return {
    id: item.id,
    targa: item.targa || "-",
    targaNorm: normalizeTarga(item.targa),
    categoria: item.categoria || "",
    hasLibretto,
    hasFoto,
    librettoUrl,
    librettoStoragePath,
    fotoUrl,
    fotoStoragePath,
    fotoPath,
    librettoReason: hasValue(librettoUrl)
      ? "librettoUrl valorizzato"
      : hasValue(librettoStoragePath)
        ? "solo librettoStoragePath valorizzato"
        : "mancano librettoUrl e librettoStoragePath",
    fotoReason: hasValue(fotoUrl)
      ? "fotoUrl valorizzato"
      : hasValue(fotoStoragePath) || hasValue(fotoPath)
        ? "solo fotoStoragePath/fotoPath valorizzato"
        : "mancano fotoUrl e fotoStoragePath/fotoPath",
  };
}

export default function NextIACoperturaLibrettiPage() {
  const debugAvailable = import.meta.env.DEV;
  const urlStatusCacheRef = useRef<Record<string, UrlReachabilityStatus>>({});

  const [snapshot, setSnapshot] = useState<NextAnagraficheFlottaSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugRowId, setDebugRowId] = useState("");
  const [repairIdsInput, setRepairIdsInput] = useState("");
  const [urlStatusByRowId, setUrlStatusByRowId] = useState<Record<string, UrlReachabilityStatus>>({});
  const [rowErrorById, setRowErrorById] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextAnagraficheFlottaSnapshot({ includeClonePatches: false });
        if (!alive) return;
        setSnapshot(nextSnapshot);
      } catch (loadError) {
        if (!alive) return;
        setError(loadError instanceof Error ? loadError.message : "Errore caricamento mezzi.");
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo(() => (snapshot?.items ?? []).map(mapRow), [snapshot]);

  useEffect(() => {
    let alive = true;
    const withLibrettoUrl = rows.filter((row) => row.hasLibretto && row.librettoUrl);

    if (withLibrettoUrl.length === 0) {
      setUrlStatusByRowId({});
      return () => {
        alive = false;
      };
    }

    const run = async () => {
      await Promise.all(
        withLibrettoUrl.map(async (row) => {
          const cached = urlStatusCacheRef.current[row.librettoUrl];
          if (cached) {
            if (alive) {
              setUrlStatusByRowId((prev) =>
                prev[row.id] === cached ? prev : { ...prev, [row.id]: cached },
              );
            }
            return;
          }

          if (alive) {
            setUrlStatusByRowId((prev) => ({ ...prev, [row.id]: "checking" }));
          }

          const probe = await probeUrlReachability(row.librettoUrl);
          const status: UrlReachabilityStatus = probe.ok
            ? "ok"
            : probe.status === 404
              ? "broken404"
              : "error";

          urlStatusCacheRef.current[row.librettoUrl] = status;

          if (!alive) return;

          setUrlStatusByRowId((prev) => ({ ...prev, [row.id]: status }));
          if (status === "error") {
            setRowErrorById((prev) => ({
              ...prev,
              [row.id]: `Verifica URL non riuscita (${probe.reason || probe.status || "errore"}).`,
            }));
          } else {
            setRowErrorById((prev) => {
              if (!prev[row.id]) return prev;
              const next = { ...prev };
              delete next[row.id];
              return next;
            });
          }
        }),
      );
    };

    void run();
    return () => {
      alive = false;
    };
  }, [rows]);

  const counts = useMemo(() => {
    const missingLibretto = rows.filter((row) => !row.hasLibretto).length;
    const missingFoto = rows.filter((row) => !row.hasFoto).length;
    const missingBoth = rows.filter((row) => !row.hasLibretto && !row.hasFoto).length;

    return {
      total: rows.length,
      missingLibretto,
      missingFoto,
      missingBoth,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const query = normalizeTarga(search);
    let output = rows;

    if (query) {
      output = output.filter((row) => row.targaNorm.includes(query));
    }

    if (filterMode === "MISSING_LIBRETTO") {
      output = output.filter((row) => !row.hasLibretto);
    } else if (filterMode === "MISSING_FOTO") {
      output = output.filter((row) => !row.hasFoto);
    } else if (filterMode === "MISSING_BOTH") {
      output = output.filter((row) => !row.hasLibretto && !row.hasFoto);
    }

    return [...output].sort((left, right) => left.targaNorm.localeCompare(right.targaNorm, "it"));
  }, [filterMode, rows, search]);

  const debugRows = useMemo(() => {
    return [...rows]
      .sort((left, right) => left.targaNorm.localeCompare(right.targaNorm, "it"))
      .map((row) => ({
        id: row.id,
        targa: row.targa,
        targaNorm: row.targaNorm,
        hasLibretto: row.hasLibretto,
        hasFoto: row.hasFoto,
        fotoUrl: row.fotoUrl,
        fotoStoragePath: row.fotoStoragePath,
        fotoPath: row.fotoPath,
        librettoUrl: row.librettoUrl,
        librettoStoragePath: row.librettoStoragePath,
        librettoReason: row.librettoReason,
        fotoReason: row.fotoReason,
        librettoUrlShort: row.librettoUrl ? row.librettoUrl.slice(0, 60) : "",
      }));
  }, [rows]);

  const debugSelectedRow = debugRows.find((row) => row.id === debugRowId) ?? debugRows[0] ?? null;

  useEffect(() => {
    if (!debugEnabled) return;
    if (debugRowId && debugRows.some((row) => row.id === debugRowId)) return;
    setDebugRowId(debugRows[0]?.id ?? "");
  }, [debugEnabled, debugRowId, debugRows]);

  const handleRepairFromIdList = () => {
    const folderIds = Array.from(
      new Set(
        repairIdsInput
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean),
      ),
    );

    if (folderIds.length === 0) {
      setNotice("Incolla almeno un ID (uno per riga).");
      return;
    }

    setNotice(
      "Clone read-only: ESEGUI RIPARAZIONE resta visibile come nella madre, ma non aggiorna @mezzi_aziendali, Storage o patch locali.",
    );
  };

  const handleBlockedUpload = (row: RowItem, actionLabel: "Carica libretto" | "Ripara libretto") => {
    setNotice(
      `Clone read-only: ${actionLabel} resta visibile per ${row.targa}, ma non carica file e non aggiorna il dataset reale.`,
    );
  };

  const handleOpenLibretto = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
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

            {debugAvailable ? (
              <div className="iacover-control">
                <label htmlFor="iacover-debug-next">DEBUG</label>
                <input
                  id="iacover-debug-next"
                  type="checkbox"
                  checked={debugEnabled}
                  onChange={(event) => setDebugEnabled(event.target.checked)}
                />
              </div>
            ) : null}
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
              <button type="button" className="iacover-action" onClick={handleRepairFromIdList}>
                ESEGUI RIPARAZIONE
              </button>
            </div>
          </div>

          {notice ? <div className="iacover-state">{notice}</div> : null}
          {loading ? <div className="iacover-state">Caricamento mezzi...</div> : null}
          {error ? <div className="iacover-state error">{error}</div> : null}

          {debugAvailable && debugEnabled ? (
            <div className="iacover-state" style={{ textAlign: "left" }}>
              <strong>DEBUG dataset mezzi (@mezzi_aziendali)</strong>
              <div style={{ margin: "8px 0" }}>
                <label htmlFor="iacover-debug-row-next" style={{ marginRight: 8 }}>
                  Riga debug:
                </label>
                <select
                  id="iacover-debug-row-next"
                  value={debugSelectedRow?.id ?? ""}
                  onChange={(event) => setDebugRowId(event.target.value)}
                >
                  {debugRows.map((row) => (
                    <option key={`dbg_next_${row.id}`} value={row.id}>
                      {row.targa} ({row.id})
                    </option>
                  ))}
                </select>
              </div>
              {debugSelectedRow ? (
                <div style={{ marginBottom: 10, lineHeight: 1.45 }}>
                  <div>
                    <strong>targa originale:</strong> {debugSelectedRow.targa}
                  </div>
                  <div>
                    <strong>targa normalizzata:</strong> {debugSelectedRow.targaNorm}
                  </div>
                  <div>
                    <strong>fotoUrl:</strong> {debugSelectedRow.fotoUrl || "-"}
                  </div>
                  <div>
                    <strong>fotoStoragePath:</strong> {debugSelectedRow.fotoStoragePath || "-"}
                  </div>
                  <div>
                    <strong>fotoPath:</strong> {debugSelectedRow.fotoPath || "-"}
                  </div>
                  <div>
                    <strong>librettoUrl:</strong> {debugSelectedRow.librettoUrl || "-"}
                  </div>
                  <div>
                    <strong>librettoStoragePath:</strong> {debugSelectedRow.librettoStoragePath || "-"}
                  </div>
                  <div>
                    <strong>matcher foto:</strong> {debugSelectedRow.fotoReason} (hasFoto=
                    {String(debugSelectedRow.hasFoto)})
                  </div>
                  <div>
                    <strong>matcher libretto:</strong> {debugSelectedRow.librettoReason} (hasLibretto=
                    {String(debugSelectedRow.hasLibretto)})
                  </div>
                </div>
              ) : null}
              {debugRows.map((row) => (
                <div key={`debug_next_${row.id}`}>
                  {row.targa} | haLibretto={String(row.hasLibretto)} | librettoUrl=
                  {row.librettoUrlShort || "-"}
                </div>
              ))}
            </div>
          ) : null}

          {!loading && !error ? (
            filtered.length === 0 ? (
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
                    {filtered.map((row) => (
                      <tr key={row.id}>
                        <td className="iacover-strong">{row.targa}</td>
                        <td>{row.categoria || "-"}</td>
                        <td>
                          <span className={`iacover-badge ${row.hasLibretto ? "ok" : "ko"}`}>
                            {row.hasLibretto ? "OK" : "NO"}
                          </span>
                        </td>
                        <td>
                          <span className={`iacover-badge ${row.hasFoto ? "ok" : "ko"}`}>
                            {row.hasFoto ? "OK" : "NO"}
                          </span>
                        </td>
                        <td>
                          {row.hasLibretto && urlStatusByRowId[row.id] === "broken404" ? (
                            <span className="iacover-badge ko" style={{ marginRight: 8, minWidth: 84 }}>
                              URL ROTTO
                            </span>
                          ) : null}

                          {!row.hasLibretto ? (
                            <button
                              type="button"
                              className="iacover-action"
                              onClick={() => handleBlockedUpload(row, "Carica libretto")}
                            >
                              Carica libretto
                            </button>
                          ) : !row.librettoUrl ? (
                            <button
                              type="button"
                              className="iacover-action"
                              onClick={() => handleBlockedUpload(row, "Ripara libretto")}
                            >
                              Ripara libretto
                            </button>
                          ) : urlStatusByRowId[row.id] === "broken404" ? (
                            <button
                              type="button"
                              className="iacover-action"
                              onClick={() => handleBlockedUpload(row, "Ripara libretto")}
                            >
                              Ripara libretto
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="iacover-action"
                                onClick={() => handleOpenLibretto(row.librettoUrl)}
                              >
                                Apri libretto
                              </button>
                              {urlStatusByRowId[row.id] === "checking" ? (
                                <span className="iacover-muted" style={{ marginLeft: 8 }}>
                                  Verifica...
                                </span>
                              ) : null}
                            </>
                          )}

                          {rowErrorById[row.id] ? (
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 11,
                                color: "#7a2020",
                                maxWidth: 260,
                              }}
                            >
                              {rowErrorById[row.id]}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : null}

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
  );
}
