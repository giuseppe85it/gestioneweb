import { useEffect, useMemo, useState } from "react";
import { getItemSync } from "../../utils/storageSync";
import "./IACoperturaLibretti.css";

type FilterMode = "ALL" | "MISSING_LIBRETTO" | "MISSING_FOTO" | "MISSING_BOTH";

type MezzoRecord = {
  id?: string;
  targa?: string;
  categoria?: string;
  librettoUrl?: string | null;
  fotoUrl?: string | null;
};

type RowItem = {
  id: string;
  targa: string;
  targaNorm: string;
  categoria: string;
  hasLibretto: boolean;
  hasFoto: boolean;
  librettoUrl: string;
};

const normalizeTarga = (value?: string | null) =>
  String(value ?? "").trim().toUpperCase();

const hasValue = (value?: string | null) =>
  Boolean(typeof value === "string" && value.trim().length > 0);

export default function IACoperturaLibretti() {
  const [mezzi, setMezzi] = useState<MezzoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("ALL");

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

      return {
        id: String(mezzo?.id ?? `${targaNorm}_${index}`),
        targa: targaRaw || "-",
        targaNorm,
        categoria,
        hasLibretto,
        hasFoto,
        librettoUrl,
      };
    });
  }, [mezzi]);

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
          </div>

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
                        {row.hasLibretto ? (
                          <button
                            type="button"
                            className="iacover-action"
                            onClick={() => handleOpenLibretto(row.librettoUrl)}
                          >
                            Apri libretto
                          </button>
                        ) : (
                          <span className="iacover-muted">-</span>
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
