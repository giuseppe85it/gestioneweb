// PROMPT 31.1 — modale di conferma soft-delete dall'Archivio Storico.
// Comportamento "soft": il record resta integro nelle altre viste,
// scompare solo dall'archivio (flag nascostoInArchivio=true).

import { useEffect, type MouseEvent as ReactMouseEvent, type ReactElement } from "react";
import "./styles/archivioStorico.css";

type Props = {
  open: boolean;
  kindLabel: string;
  recordTitle?: string | null;
  busy?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ArchivioConfirmDelete({
  open,
  kindLabel,
  recordTitle,
  busy,
  errorMessage,
  onConfirm,
  onCancel,
}: Props): ReactElement | null {
  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const stop = (e: ReactMouseEvent): void => {
    e.stopPropagation();
  };

  return (
    <div
      className="archivio-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Conferma eliminazione dall'archivio"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div className="archivio-confirm-modal" onClick={stop}>
        <h3 className="archivio-confirm-title">
          Eliminare questa {kindLabel.toLowerCase()} dall&apos;archivio?
        </h3>
        {recordTitle ? (
          <p className="archivio-confirm-record">{recordTitle}</p>
        ) : null}
        <p className="archivio-confirm-body">
          Il record resterà comunque disponibile nelle altre sezioni
          (Sinottica, modali, dettagli). Scomparirà soltanto da
          questo archivio storico.
        </p>
        {errorMessage ? (
          <div className="archivio-confirm-error" role="alert">
            {errorMessage}
          </div>
        ) : null}
        <div className="archivio-confirm-actions">
          <button
            type="button"
            className="archivio-confirm-btn"
            onClick={onCancel}
            disabled={busy === true}
          >
            Annulla
          </button>
          <button
            type="button"
            className="archivio-confirm-btn is-danger"
            onClick={onConfirm}
            disabled={busy === true}
          >
            {busy ? "Eliminazione…" : "Elimina"}
          </button>
        </div>
      </div>
    </div>
  );
}
