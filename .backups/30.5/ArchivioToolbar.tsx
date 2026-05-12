// Archivio Storico NEXT — Step 5 (PROMPT 29.9) — ArchivioToolbar.
// Toolbar sticky con 4 filtri (Autista, Targa, Cerca, Periodo) +
// chip "N filtri attivi · azzera" + meta destra "N risultati".
// Search input ha debounce locale 200ms (SPEC §7.4 + §6.3).

import { useEffect, useRef, useState, type ReactElement } from "react";

import type { ArchivioFilters, ArchivioPeriodo } from "./archivioTypes";
import "./styles/archivioStorico.css";

type Props = {
  filters: ArchivioFilters;
  defaultPeriodo: ArchivioPeriodo;
  setAutista: (value: string | null) => void;
  setTarga: (value: string | null) => void;
  setPeriodo: (periodo: ArchivioPeriodo) => void;
  setSearch: (value: string) => void;
  resetFilters: () => void;
  countActiveFilters: number;
  resultsTotalCount: number;
  autistaOptions: string[];
  targaOptions: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const SEARCH_DEBOUNCE_MS = 200;

type PeriodPreset = "7d" | "30d" | "90d" | "12m" | "all" | "custom";

function buildPresetPeriodo(preset: PeriodPreset): ArchivioPeriodo {
  const now: number = Date.now();
  if (preset === "all") {
    return { fromTs: 0, toTs: now };
  }
  let days: number = 30;
  if (preset === "7d") days = 7;
  else if (preset === "30d") days = 30;
  else if (preset === "90d") days = 90;
  else if (preset === "12m") days = 365;
  return { fromTs: now - days * DAY_MS, toTs: now };
}

function formatPeriodoLabel(
  periodo: ArchivioPeriodo,
  defaultPeriodo: ArchivioPeriodo,
): string {
  if (
    periodo.fromTs === defaultPeriodo.fromTs &&
    periodo.toTs === defaultPeriodo.toTs
  ) {
    return "Ultimi 30 giorni";
  }
  if (periodo.fromTs === 0) {
    return "Tutto lo storico";
  }
  const from: Date = new Date(periodo.fromTs);
  const to: Date = new Date(periodo.toTs);
  const fmt = (d: Date): string =>
    `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  return `${fmt(from)} → ${fmt(to)}`;
}

function toDateInputValue(ts: number): string {
  if (ts === 0) return "";
  const d: Date = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fromDateInputValue(value: string): number | null {
  if (!value) return null;
  const parsed: number = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function ArchivioToolbar({
  filters,
  defaultPeriodo,
  setAutista,
  setTarga,
  setPeriodo,
  setSearch,
  resetFilters,
  countActiveFilters,
  resultsTotalCount,
  autistaOptions,
  targaOptions,
}: Props): ReactElement {
  const [searchLocal, setSearchLocal] = useState<string>(filters.search);
  const [periodOpen, setPeriodOpen] = useState<boolean>(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setSearch(searchLocal);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [searchLocal, setSearch]);

  // Sync se reset esterno (es. click chip "azzera"). Dipendenza solo
  // su `filters.search`: NON includere `searchLocal` in dep list,
  // altrimenti l'effect resetterebbe il valore digitato dall'utente
  // prima che il debounce abbia tempo di propagarlo a `filters.search`.
  useEffect(() => {
    if (filters.search === "") {
      setSearchLocal("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const periodoLabel: string = formatPeriodoLabel(filters.periodo, defaultPeriodo);
  const periodoIsActive: boolean =
    filters.periodo.fromTs !== defaultPeriodo.fromTs ||
    filters.periodo.toTs !== defaultPeriodo.toTs;

  const applyPreset = (preset: PeriodPreset): void => {
    setPeriodo(buildPresetPeriodo(preset));
    setPeriodOpen(false);
  };

  return (
    <section className="archivio-toolbar" aria-label="Filtri archivio">
      <label className="archivio-ff">
        <span className="archivio-ff-label">Autista</span>
        <select
          className="archivio-ff-select"
          value={filters.autista ?? ""}
          onChange={(e) => setAutista(e.target.value || null)}
        >
          <option value="">Tutti</option>
          {autistaOptions.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <label className="archivio-ff">
        <span className="archivio-ff-label">Targa</span>
        <select
          className="archivio-ff-select"
          value={filters.targa ?? ""}
          onChange={(e) => setTarga(e.target.value || null)}
        >
          <option value="">Tutte</option>
          {targaOptions.map((opt: string) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <label className="archivio-ff archivio-ff-search">
        <svg
          className="archivio-ff-search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="archivio-ff-label">Cerca</span>
        <input
          type="search"
          autoComplete="off"
          spellCheck={false}
          placeholder="targa, autista, descrizione…"
          value={searchLocal}
          onChange={(e) => setSearchLocal(e.target.value)}
        />
      </label>

      <div className={`archivio-ff archivio-ff-period ${periodoIsActive ? "is-set" : ""}`}>
        <button
          type="button"
          className="archivio-ff-period-trigger"
          onClick={() => setPeriodOpen((v: boolean) => !v)}
        >
          <span className="archivio-ff-label">Periodo</span>
          <span className="archivio-ff-value">{periodoLabel}</span>
        </button>
        {periodOpen ? (
          <div className="archivio-ff-period-pop">
            <div className="archivio-ff-period-presets">
              <button type="button" onClick={() => applyPreset("7d")}>
                Ultimi 7 gg
              </button>
              <button type="button" onClick={() => applyPreset("30d")}>
                Ultimi 30 gg
              </button>
              <button type="button" onClick={() => applyPreset("90d")}>
                Ultimi 90 gg
              </button>
              <button type="button" onClick={() => applyPreset("12m")}>
                Ultimi 12 mesi
              </button>
              <button type="button" onClick={() => applyPreset("all")}>
                Tutto lo storico
              </button>
            </div>
            <div className="archivio-ff-period-custom">
              <label>
                Da
                <input
                  type="date"
                  value={toDateInputValue(filters.periodo.fromTs)}
                  onChange={(e) => {
                    const next: number | null = fromDateInputValue(e.target.value);
                    if (next !== null) {
                      setPeriodo({ ...filters.periodo, fromTs: next });
                    }
                  }}
                />
              </label>
              <label>
                A
                <input
                  type="date"
                  value={toDateInputValue(filters.periodo.toTs)}
                  onChange={(e) => {
                    const next: number | null = fromDateInputValue(e.target.value);
                    if (next !== null) {
                      setPeriodo({ ...filters.periodo, toTs: next });
                    }
                  }}
                />
              </label>
              <button
                type="button"
                className="archivio-ff-period-close"
                onClick={() => setPeriodOpen(false)}
              >
                Chiudi
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {countActiveFilters > 0 ? (
        <div className="archivio-filter-state">
          <span>
            <span className="archivio-filter-state-ct">{countActiveFilters}</span>{" "}
            {countActiveFilters === 1 ? "filtro attivo" : "filtri attivi"}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchLocal("");
              resetFilters();
            }}
          >
            azzera
          </button>
        </div>
      ) : null}

      <div className="archivio-toolbar-spacer" />

      <div className="archivio-toolbar-meta">
        <span>
          <strong>{resultsTotalCount}</strong> risultati
        </span>
      </div>
    </section>
  );
}
