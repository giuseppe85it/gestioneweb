import { useState, type ReactNode } from "react";

type Props = {
  title: string;
  count: number;
  tone?: "danger" | "ok" | "neutral";
  defaultOpen?: boolean;
  children: ReactNode;
};

/**
 * Gruppo richiudibile con intestazione + contatore.
 * Lo stato aperto/chiuso è puro stato UI locale.
 */
export default function CollapsibleGroup({
  title,
  count,
  tone = "neutral",
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`aa-group${open ? "" : " collapsed"}${tone === "danger" ? " aa-group--danger" : ""}`}>
      <button
        type="button"
        className="aa-group-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="aa-group-caret" aria-hidden="true">
          &#9662;
        </span>
        <span className="aa-group-title">{title}</span>
        <span className="aa-group-count">{count}</span>
      </button>
      <div className="aa-group-body">{children}</div>
    </div>
  );
}
