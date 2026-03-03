import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../../firebase";
import { getItemSync } from "../../utils/storageSync";
import "./IACoperturaLibretti.css";

type FilterMode = "ALL" | "MISSING_LIBRETTO" | "MISSING_FOTO" | "MISSING_BOTH";

type MezzoRecord = {
  id?: string;
  targa?: string;
  categoria?: string;
  librettoUrl?: string | null;
  librettoStoragePath?: string | null;
  fotoUrl?: string | null;
};

type RowItem = {
  id: string;
  mezzoId: string;
  sourceIndex: number;
  targa: string;
  targaNorm: string;
  categoria: string;
  hasLibretto: boolean;
  hasFoto: boolean;
  librettoUrl: string;
  librettoStoragePath: string;
};

type UrlReachabilityStatus = "idle" | "checking" | "ok" | "broken404" | "error";

const URL_CHECK_TIMEOUT_MS = 7000;

const normalizeTarga = (value?: string | null) =>
  String(value ?? "").trim().toUpperCase();

const hasValue = (value?: string | null) =>
  Boolean(typeof value === "string" && value.trim().length > 0);

const fetchWithTimeout = async (
  url: string,
  method: "HEAD" | "GET",
  timeoutMs = URL_CHECK_TIMEOUT_MS
) => {
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
};

const probeUrlReachability = async (url: string) => {
  const target = String(url || "").trim();
  if (!target) {
    return { ok: false, status: null as number | null, reason: "URL vuoto" };
  }

  try {
    const head = await fetchWithTimeout(target, "HEAD");
    if (head.ok || head.status === 404) {
      return { ok: head.ok, status: head.status };
    }
  } catch (err: any) {
    // fallback GET
    if (err?.name !== "AbortError") {
      console.warn("[IACoperturaLibretti] HEAD fallita:", err);
    }
  }

  try {
    const get = await fetchWithTimeout(target, "GET");
    return { ok: get.ok, status: get.status };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return { ok: false, status: null as number | null, reason: "timeout" };
    }
    return {
      ok: false,
      status: null as number | null,
      reason: err?.message || "errore rete",
    };
  }
};

export default function IACoperturaLibretti() {
  const debugAvailable = import.meta.env.DEV;
  const [mezzi, setMezzi] = useState<MezzoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [uploadingRowId, setUploadingRowId] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<RowItem | null>(null);
  const [uploadMode, setUploadMode] = useState<"upload" | "repair">("upload");
  const [urlStatusByRowId, setUrlStatusByRowId] = useState<
    Record<string, UrlReachabilityStatus>
  >({});
  const [rowErrorById, setRowErrorById] = useState<Record<string, string>>({});
  const urlStatusCacheRef = useRef<Record<string, UrlReachabilityStatus>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const raw = await getItemSync("@mezzi_aziendali");
        const list = Array.isArray(raw)
          ? raw
          : raw && Array.isArray((raw as any).value)
          ? (raw as any).value
          : [];

        if (!alive) return;
        setMezzi(list as MezzoRecord[]);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || "Errore caricamento mezzi.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo<RowItem[]>(() => {
    return mezzi.map((mezzo, index) => {
      const targaRaw =
        typeof mezzo?.targa === "string" ? mezzo.targa : "";
      const targaNorm = normalizeTarga(targaRaw);
      const hasLibretto = hasValue(mezzo?.librettoUrl);
      const hasFoto = hasValue(mezzo?.fotoUrl);
      const categoria =
        typeof mezzo?.categoria === "string" ? mezzo.categoria : "";
      const librettoUrl =
        typeof mezzo?.librettoUrl === "string"
          ? mezzo.librettoUrl.trim()
          : "";
      const librettoStoragePath =
        typeof mezzo?.librettoStoragePath === "string"
          ? mezzo.librettoStoragePath.trim()
          : "";

      return {
        id: String(mezzo?.id ?? `${targaNorm}_${index}`),
        mezzoId: String(mezzo?.id ?? ""),
        sourceIndex: index,
        targa: targaRaw || "-",
        targaNorm,
        categoria,
        hasLibretto,
        hasFoto,
        librettoUrl,
        librettoStoragePath,
      };
    });
  }, [mezzi]);

  useEffect(() => {
    let alive = true;
    const withLibretto = rows.filter((row) => row.hasLibretto && row.librettoUrl);

    if (withLibretto.length === 0) {
      setUrlStatusByRowId({});
      return () => {
        alive = false;
      };
    }

    const run = async () => {
      await Promise.all(
        withLibretto.map(async (row) => {
          const cached = urlStatusCacheRef.current[row.librettoUrl];
          if (cached) {
            if (alive) {
              setUrlStatusByRowId((prev) =>
                prev[row.id] === cached ? prev : { ...prev, [row.id]: cached }
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
        })
      );
    };

    void run();
    return () => {
      alive = false;
    };
  }, [rows]);

  const counts = useMemo(() => {
    const missingLibretto = rows.filter((r) => !r.hasLibretto).length;
    const missingFoto = rows.filter((r) => !r.hasFoto).length;
    const missingBoth = rows.filter((r) => !r.hasLibretto && !r.hasFoto).length;
    return {
      total: rows.length,
      missingLibretto,
      missingFoto,
      missingBoth,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const query = normalizeTarga(search);
    let out = rows;

    if (query) {
      out = out.filter((r) => r.targaNorm.includes(query));
    }

    if (filterMode === "MISSING_LIBRETTO") {
      out = out.filter((r) => !r.hasLibretto);
    } else if (filterMode === "MISSING_FOTO") {
      out = out.filter((r) => !r.hasFoto);
    } else if (filterMode === "MISSING_BOTH") {
      out = out.filter((r) => !r.hasLibretto && !r.hasFoto);
    }

    return [...out].sort((a, b) => a.targaNorm.localeCompare(b.targaNorm));
  }, [rows, search, filterMode]);

  const debugRows = useMemo(() => {
    return [...rows]
      .sort((a, b) => a.targaNorm.localeCompare(b.targaNorm))
      .map((row) => ({
        id: row.id,
        targa: row.targa,
        hasLibretto: Boolean(row.librettoUrl && row.librettoUrl.trim()),
        librettoUrlShort: row.librettoUrl ? row.librettoUrl.slice(0, 60) : "",
      }));
  }, [rows]);

  const handleOpenLibretto = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openUploadPicker = (row: RowItem, mode: "upload" | "repair") => {
    if (uploadingRowId) return;
    setUploadMode(mode);
    setUploadTarget(row);
    fileInputRef.current?.click();
  };

  const handleUploadSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file || !uploadTarget) return;
    const actionMode = uploadMode;

    if (!file.type.startsWith("image/")) {
      alert("Seleziona un file immagine valido.");
      return;
    }

    try {
      setUploadingRowId(uploadTarget.id);

      const refMezzi = doc(db, "storage", "@mezzi_aziendali");
      const snap = await getDoc(refMezzi);
      const raw = snap.exists() ? snap.data().value || [] : [];
      const mezziList = Array.isArray(raw) ? raw : [];

      let index = -1;
      if (uploadTarget.mezzoId) {
        index = mezziList.findIndex(
          (m: any) => String(m?.id ?? "") === uploadTarget.mezzoId
        );
      }
      if (index < 0 && uploadTarget.sourceIndex < mezziList.length) {
        const candidate = mezziList[uploadTarget.sourceIndex];
        if (normalizeTarga(candidate?.targa) === uploadTarget.targaNorm) {
          index = uploadTarget.sourceIndex;
        }
      }
      if (index < 0) {
        index = mezziList.findIndex(
          (m: any) => normalizeTarga(m?.targa) === uploadTarget.targaNorm
        );
      }

      if (index < 0 || index >= mezziList.length) {
        throw new Error("Mezzo non trovato per aggiornare il libretto.");
      }

      const mezzo = { ...(mezziList[index] || {}) } as MezzoRecord & { id?: string };
      const mezzoId = String(mezzo.id ?? "").trim();
      if (!mezzoId) {
        throw new Error(
          "Mezzo.id mancante: impossibile salvare nel path mezzi_aziendali/${mezzo.id}/libretto.jpg."
        );
      }

      const path = `mezzi_aziendali/${mezzoId}/libretto.jpg`;
      const storageRef = ref(storage, path);

      try {
        await uploadBytes(storageRef, file);
      } catch (uploadErr) {
        console.error("Errore upload libretto:", uploadErr);
        throw new Error("Upload libretto fallito.");
      }

      const url = await getDownloadURL(storageRef);
      mezzo.librettoUrl = url;
      mezzo.librettoStoragePath = path;
      mezziList[index] = mezzo;

      try {
        await setDoc(refMezzi, { value: mezziList });
      } catch (writeErr) {
        console.error("Errore salvataggio libretto su Firestore:", writeErr);
        throw new Error("Salvataggio libretto su Firestore fallito.");
      }

      setMezzi(mezziList as MezzoRecord[]);
      urlStatusCacheRef.current[url] = "ok";
      setUrlStatusByRowId((prev) => ({ ...prev, [uploadTarget.id]: "ok" }));
      setRowErrorById((prev) => {
        if (!prev[uploadTarget.id]) return prev;
        const next = { ...prev };
        delete next[uploadTarget.id];
        return next;
      });
      alert(
        actionMode === "repair"
          ? "Libretto riparato correttamente."
          : "Libretto caricato correttamente."
      );
    } catch (err: any) {
      console.error("Errore caricamento libretto:", err);
      if (uploadTarget?.id) {
        setRowErrorById((prev) => ({
          ...prev,
          [uploadTarget.id]:
            err?.message || "Errore durante il caricamento del libretto.",
        }));
      }
      alert(err?.message || "Errore durante il caricamento del libretto.");
    } finally {
      setUploadingRowId(null);
      setUploadTarget(null);
      setUploadMode("upload");
    }
  };

  return (
    <div className="iacover-page">
      <div className="iacover-shell">
        <div className="iacover-card">
          <h1 className="iacover-title">COPERTURA LIBRETTI + FOTO</h1>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleUploadSelected}
          />

          <div className="iacover-controls">
            <div className="iacover-control">
              <label htmlFor="iacover-search">Cerca per targa...</label>
              <input
                id="iacover-search"
                className="iacover-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca per targa..."
              />
            </div>

            <div className="iacover-control">
              <label htmlFor="iacover-filter">Mostra</label>
              <select
                id="iacover-filter"
                className="iacover-select"
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value as FilterMode)}
              >
                <option value="ALL">Tutti ({counts.total})</option>
                <option value="MISSING_LIBRETTO">
                  Libretti mancanti ({counts.missingLibretto})
                </option>
                <option value="MISSING_FOTO">
                  Foto mancanti ({counts.missingFoto})
                </option>
                <option value="MISSING_BOTH">
                  Mancano entrambi ({counts.missingBoth})
                </option>
              </select>
            </div>

            {debugAvailable && (
              <div className="iacover-control">
                <label htmlFor="iacover-debug">DEBUG</label>
                <input
                  id="iacover-debug"
                  type="checkbox"
                  checked={debugEnabled}
                  onChange={(e) => setDebugEnabled(e.target.checked)}
                />
              </div>
            )}
          </div>

          {debugAvailable && debugEnabled && (
            <div className="iacover-state" style={{ textAlign: "left" }}>
              <strong>DEBUG dataset mezzi (@mezzi_aziendali)</strong>
              {debugRows.map((row) => (
                <div key={`debug_${row.id}`}>
                  {row.targa} | haLibretto={String(row.hasLibretto)} | librettoUrl=
                  {row.librettoUrlShort || "-"}
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="iacover-state">Caricamento mezzi...</div>
          ) : error ? (
            <div className="iacover-state error">{error}</div>
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
                  {filtered.map((row) => (
                    <tr key={row.id}>
                      <td className="iacover-strong">{row.targa}</td>
                      <td>{row.categoria || "-"}</td>
                      <td>
                        <span
                          className={`iacover-badge ${
                            row.hasLibretto ? "ok" : "ko"
                          }`}
                        >
                          {row.hasLibretto ? "✅" : "❌"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`iacover-badge ${
                            row.hasFoto ? "ok" : "ko"
                          }`}
                        >
                          {row.hasFoto ? "✅" : "❌"}
                        </span>
                      </td>
                      <td>
                        {row.hasLibretto &&
                          urlStatusByRowId[row.id] === "broken404" && (
                            <span
                              className="iacover-badge ko"
                              style={{ marginRight: 8, minWidth: 84 }}
                            >
                              URL ROTTO
                            </span>
                          )}
                        {!row.hasLibretto ? (
                          <button
                            type="button"
                            className="iacover-action"
                            onClick={() => openUploadPicker(row, "upload")}
                            disabled={uploadingRowId !== null}
                          >
                            {uploadingRowId === row.id ? "Caricamento..." : "Carica libretto"}
                          </button>
                        ) : urlStatusByRowId[row.id] === "broken404" ? (
                          <button
                            type="button"
                            className="iacover-action"
                            onClick={() => openUploadPicker(row, "repair")}
                            disabled={uploadingRowId !== null}
                          >
                            {uploadingRowId === row.id ? "Caricamento..." : "Ripara libretto"}
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
                            {urlStatusByRowId[row.id] === "checking" && (
                              <span className="iacover-muted" style={{ marginLeft: 8 }}>
                                Verifica...
                              </span>
                            )}
                          </>
                        )}
                        {rowErrorById[row.id] && (
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
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
