import type { ReactNode } from "react";
import ActionMenu, { type ActionItem } from "./ActionMenu";

/** Intestazione di colonne per una lista schematizzata. */
export function SchemaHead({ template, labels }: { template: string; labels: string[] }) {
  return (
    <div className="aa-thead" style={{ gridTemplateColumns: `${template} 168px` }}>
      {labels.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
      <div className="aa-th-act">Azioni</div>
    </div>
  );
}

type RowProps = {
  template: string;
  cells: ReactNode[];
  tone?: "danger" | "ok" | "neutral";
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  primaryTitle?: string;
  actions?: ActionItem[];
  onRowClick?: () => void;
};

/**
 * Riga a colonne allineate: ogni cella in una colonna, azione primaria + menu "…"
 * sempre nell'ultima colonna a destra. Sola presentazione.
 */
export default function SchemaRow({
  template,
  cells,
  tone = "neutral",
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryTitle,
  actions = [],
  onRowClick,
}: RowProps) {
  return (
    <div
      className={`aa-trow${tone !== "neutral" ? ` aa-trow--${tone}` : ""}${onRowClick ? " aa-trow--clickable" : ""}`}
      style={{ gridTemplateColumns: `${template} 168px` }}
      onClick={onRowClick}
      role={onRowClick ? "button" : undefined}
      tabIndex={onRowClick ? 0 : undefined}
      onKeyDown={
        onRowClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onRowClick();
            }
          : undefined
      }
    >
      {cells.map((c, i) => (
        <div className="aa-td" key={i}>
          {c}
        </div>
      ))}
      <div className="aa-td-act" onClick={(e) => e.stopPropagation()}>
        {primaryLabel ? (
          <button
            type="button"
            className="edit aa-crow-primary"
            onClick={onPrimary}
            disabled={primaryDisabled}
            title={primaryTitle}
          >
            {primaryLabel}
          </button>
        ) : null}
        <ActionMenu items={actions} />
      </div>
    </div>
  );
}
