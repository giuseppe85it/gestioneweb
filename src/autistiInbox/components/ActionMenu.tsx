import { useEffect, useRef, useState } from "react";

export type ActionItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  /** Separatore visivo PRIMA di questa voce */
  separatorBefore?: boolean;
};

type Props = {
  items: ActionItem[];
  /** Etichetta accessibile del bottone "altre azioni" */
  label?: string;
};

/**
 * Bottone "…" che apre un menu con le azioni secondarie di una riga.
 * Componente di sola presentazione: ogni voce invoca l'handler passato via props.
 * Il popover usa posizione fixed per non essere tagliato dentro contenitori con scroll.
 */
export default function ActionMenu({ items, label = "Altre azioni" }: Props) {
  const visible = items.filter((it) => !it.hidden);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (visible.length === 0) return null;

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    setOpen(true);
  };

  return (
    <span className="aa-actionmenu">
      <button
        ref={btnRef}
        type="button"
        className="aa-actionmenu-trigger"
        aria-label={label}
        title={label}
        onClick={toggle}
      >
        &#8943;
      </button>
      {open && pos ? (
        <div
          className="aa-actionmenu-pop"
          style={{ top: pos.top, right: pos.right }}
          onClick={(e) => e.stopPropagation()}
        >
          {visible.map((it, idx) => (
            <span key={`${it.label}_${idx}`}>
              {it.separatorBefore ? <span className="aa-actionmenu-sep" /> : null}
              <button
                type="button"
                className={`aa-actionmenu-item${it.danger ? " danger" : ""}`}
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
              >
                {it.label}
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </span>
  );
}
