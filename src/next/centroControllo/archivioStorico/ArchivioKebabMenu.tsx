// PROMPT 31.1 — kebab menu riusabile per le 4 righe Archivio.
// Bottone "⋮" + dropdown con 2 voci: "Apri dettaglio" e "Elimina".
// La voce "Elimina" è marcata is-danger (testo rosso).
// Click fuori → chiude. Esc → chiude. Stop-propagation per non
// triggherare il click sulla riga (toggle expand).

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from "react";
import "./styles/archivioStorico.css";

type Props = {
  onApriDettaglio: () => void;
  onElimina: () => void;
  onRiapri?: () => void;
  apriDettaglioDisabled?: boolean;
};

export function ArchivioKebabMenu({
  onApriDettaglio,
  onElimina,
  onRiapri,
  apriDettaglioDisabled,
}: Props): ReactElement {
  const [open, setOpen] = useState<boolean>(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (ev: globalThis.MouseEvent): void => {
      const target = ev.target as Node | null;
      if (!target) return;
      if (wrapRef.current && !wrapRef.current.contains(target)) {
        setOpen(false);
      }
    };
    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleToggle = useCallback((e: ReactMouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setOpen((v: boolean) => !v);
  }, []);

  const handleApri = useCallback((e: ReactMouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setOpen(false);
    onApriDettaglio();
  }, [onApriDettaglio]);

  const handleElimina = useCallback((e: ReactMouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setOpen(false);
    onElimina();
  }, [onElimina]);

  const handleRiapri = useCallback((e: ReactMouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setOpen(false);
    if (onRiapri) onRiapri();
  }, [onRiapri]);

  return (
    <div
      className={`archivio-kebab ${open ? "is-open" : ""}`}
      ref={wrapRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="archivio-kebab-btn"
        aria-label="Apri menu riga"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
          width="18"
          height="18"
        >
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open ? (
        <div className="archivio-kebab-menu" role="menu">
          <button
            type="button"
            className="archivio-kebab-item"
            role="menuitem"
            onClick={handleApri}
            disabled={apriDettaglioDisabled === true}
          >
            Apri dettaglio
          </button>
          {onRiapri ? (
            <button
              type="button"
              className="archivio-kebab-item"
              role="menuitem"
              onClick={handleRiapri}
            >
              Riapri
            </button>
          ) : null}
          <button
            type="button"
            className="archivio-kebab-item is-danger"
            role="menuitem"
            onClick={handleElimina}
          >
            Elimina
          </button>
        </div>
      ) : null}
    </div>
  );
}
