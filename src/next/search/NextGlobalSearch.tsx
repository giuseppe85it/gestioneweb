// Barra di ricerca globale NEXT — sempre visibile nella topbar della shell.
// Digitando una targa o il nome/badge di un autista mostra suggerimenti
// raggruppati (Autisti / Mezzi) e naviga alla scheda corrispondente,
// preservando il ruolo simulato nella query string.

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { buildNextPathWithRole, getNextRoleFromSearch } from "../nextAccess";
import {
  useNextGlobalSearch,
  type NextGlobalSearchResult,
} from "./useNextGlobalSearch";
import "./next-global-search.css";

const SEARCH_DEBOUNCE_MS = 180;

function NextGlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const search = useNextGlobalSearch();
  const { setQuery } = search;

  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Debounce: la query che filtra l'indice segue l'input con un piccolo ritardo.
  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(inputValue), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [inputValue, setQuery]);

  // Chiusura del pannello al click fuori dal contenitore.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const trimmed = inputValue.trim();
  const dropdownOpen = open && trimmed.length > 0;

  const goTo = (result: NextGlobalSearchResult) => {
    const role = getNextRoleFromSearch(location.search);
    navigate(buildNextPathWithRole(result.targetPath, role));
    setInputValue("");
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const flat = search.flat;
    if (event.key === "ArrowDown") {
      if (flat.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, flat.length - 1));
    } else if (event.key === "ArrowUp") {
      if (flat.length === 0) return;
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      const target = activeIndex >= 0 ? flat[activeIndex] : flat[0];
      if (target) {
        event.preventDefault();
        goTo(target);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  };

  const renderGroup = (
    title: string,
    items: NextGlobalSearchResult[],
    offset: number,
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="next-gsearch__group">
        <div className="next-gsearch__group-title">{title}</div>
        {items.map((result, position) => {
          const flatIndex = offset + position;
          const isActive = flatIndex === activeIndex;
          return (
            <button
              key={`${result.kind}:${result.id}`}
              type="button"
              role="option"
              aria-selected={isActive}
              className={
                isActive
                  ? "next-gsearch__option next-gsearch__option--active"
                  : "next-gsearch__option"
              }
              // mousedown preventDefault: evita il blur dell'input prima del click.
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(flatIndex)}
              onClick={() => goTo(result)}
            >
              <span className="next-gsearch__option-label">{result.label}</span>
              <span className="next-gsearch__option-sub">{result.sublabel}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="next-gsearch" ref={containerRef}>
      <div className="next-gsearch__field">
        <svg
          className="next-gsearch__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <line
            x1="16.5"
            y1="16.5"
            x2="21"
            y2="21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          type="search"
          className="next-gsearch__input"
          placeholder="Cerca targa o autista…"
          value={inputValue}
          autoComplete="off"
          spellCheck={false}
          aria-label="Cerca targa o autista"
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-controls="next-gsearch-listbox"
          onChange={(event) => {
            search.ensureLoaded();
            setInputValue(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            search.ensureLoaded();
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {dropdownOpen ? (
        <div
          className="next-gsearch__panel"
          id="next-gsearch-listbox"
          role="listbox"
        >
          {search.loading ? (
            <div className="next-gsearch__hint">Carico l'indice…</div>
          ) : null}
          {search.error ? (
            <div className="next-gsearch__hint">
              Impossibile caricare i dati di ricerca.
            </div>
          ) : null}
          {!search.loading && !search.error && search.totalCount === 0 ? (
            <div className="next-gsearch__hint">Nessun risultato.</div>
          ) : null}
          {renderGroup("Autisti", search.autisti, 0)}
          {renderGroup("Mezzi", search.mezzi, search.autisti.length)}
        </div>
      ) : null}
    </div>
  );
}

export default NextGlobalSearch;
