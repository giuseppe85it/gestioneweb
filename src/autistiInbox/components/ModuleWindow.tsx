import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  toolbar?: ReactNode;
  datebar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * Finestra dedicata che ospita una singola sezione ("modulo").
 * Riusa le classi modale del progetto (.aix-*) con una variante di dimensione.
 */
export default function ModuleWindow({
  open,
  title,
  icon,
  onClose,
  toolbar,
  datebar,
  footer,
  children,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="aix-backdrop aa-module-backdrop" onMouseDown={onClose}>
      <div
        className="aix-modal aa-module-window"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="aix-head aa-module-window-head">
          {icon ? <span className="aa-module-window-icon">{icon}</span> : null}
          <h3>{title}</h3>
          <button type="button" className="aix-close" onClick={onClose} aria-label="Chiudi">
            &times;
          </button>
        </div>
        <div className="aa-module-window-body">
          {datebar}
          {toolbar}
          {children}
        </div>
        {footer ? <div className="aa-module-window-foot">{footer}</div> : null}
      </div>
    </div>
  );
}
