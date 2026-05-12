// Archivio Storico NEXT — Step 4 (PROMPT 29.9) — ArchivioMiniTimeline.
// Mini-timeline orizzontale degli eventi (Aperta · Ricevuta · Chiusa ·
// Generato). Pattern controlled: il padre dichiara gli step da
// renderizzare; il componente NON conosce la semantica della
// collezione, gestisce solo il rendering visuale.
//
// Variante "is-taken-no-ts" (D4): pallino warn senza timestamp,
// tooltip "orario non tracciato".
// Variante "is-gen": romboide brand + linea dashed.

import type { ReactElement } from "react";

import "./styles/archivioStorico.css";

export type ArchivioTimelineStepKind =
  | "open"
  | "taken"
  | "taken-no-ts"
  | "closed"
  | "gen";

export type ArchivioTimelineStep = {
  kind: ArchivioTimelineStepKind;
  label: string;
  timestamp?: string | null;
  tooltip?: string;
  linkLabel?: string;
};

type Props = {
  steps: ArchivioTimelineStep[];
};

function stepClassName(kind: ArchivioTimelineStepKind): string {
  switch (kind) {
    case "open":
      return "archivio-tl-step is-open";
    case "taken":
      return "archivio-tl-step is-taken";
    case "taken-no-ts":
      return "archivio-tl-step is-taken-no-ts";
    case "closed":
      return "archivio-tl-step is-closed";
    case "gen":
      return "archivio-tl-step is-gen";
  }
}

function lineClassName(prev: ArchivioTimelineStepKind): string {
  return prev === "gen" || prev === "taken-no-ts"
    ? "archivio-tl-line is-gen"
    : "archivio-tl-line is-done";
}

export function ArchivioMiniTimeline({ steps }: Props): ReactElement | null {
  if (steps.length === 0) return null;
  return (
    <div className="archivio-timeline">
      {steps.map((step: ArchivioTimelineStep, idx: number) => {
        const tsText: string =
          step.linkLabel ??
          (step.kind === "taken-no-ts" ? "—" : step.timestamp ?? "—");
        const elements: ReactElement[] = [];
        if (idx > 0) {
          const lineClass: string =
            steps[idx].kind === "gen"
              ? "archivio-tl-line is-gen"
              : lineClassName(steps[idx - 1].kind);
          elements.push(
            <span key={`line-${idx}`} className={lineClass} />,
          );
        }
        elements.push(
          <span
            key={`step-${idx}`}
            className={stepClassName(step.kind)}
            title={step.tooltip}
          >
            <span className="archivio-tl-dot" />
            <span className="archivio-tl-lab">{step.label}</span>
            <span className="archivio-tl-ts">{tsText}</span>
          </span>,
        );
        return <span key={`g-${idx}`}>{elements}</span>;
      })}
    </div>
  );
}
