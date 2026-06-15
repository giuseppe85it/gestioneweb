import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  count?: number | null;
  /** Etichetta del contatore (es. "9 oggi", "5 nuove", "3 KO") */
  countLabel?: string;
  /** Se true, evidenzia il contatore come urgente */
  urgent?: boolean;
  onClick: () => void;
  disabled?: boolean;
};

/** Tessera della griglia "moduli" nella home admin. */
export default function ModuleTile({
  icon,
  label,
  count,
  countLabel,
  urgent,
  onClick,
  disabled,
}: Props) {
  const badge = countLabel ?? (count != null ? String(count) : null);
  return (
    <button type="button" className="aa-module-tile" onClick={onClick} disabled={disabled}>
      <span className="aa-module-tile-top">
        <span className="aa-module-tile-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="aa-module-tile-name">{label}</span>
      </span>
      <span className="aa-module-tile-foot">
        {badge != null ? (
          <span className={`pill ${urgent ? "pill-danger" : "pill-neutral"}`}>{badge}</span>
        ) : (
          <span />
        )}
        <span className="aa-module-tile-open">Apri &rarr;</span>
      </span>
    </button>
  );
}
