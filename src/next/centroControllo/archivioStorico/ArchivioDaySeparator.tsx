// Archivio Storico NEXT — Step 4 (PROMPT 29.9) — ArchivioDaySeparator.
// Separatore di giorno/periodo nel feed. Sticky CSS, replica mockup
// `.day-sep` (etichetta + filo + count). Il padre calcola la label
// e il count gia' formattati.

import type { ReactElement } from "react";

import "./styles/archivioStorico.css";

type Props = {
  label: string;
  sublabel?: string;
  count: number;
};

export function ArchivioDaySeparator({
  label,
  sublabel,
  count,
}: Props): ReactElement {
  const countText: string = count === 1 ? "1 record" : `${count} record`;
  return (
    <div className="archivio-day-sep">
      <span className="archivio-day-sep-label">
        <strong>{label}</strong>
        {sublabel ? <> · {sublabel}</> : null}
      </span>
      <span className="archivio-day-sep-rule" />
      <span className="archivio-day-sep-count">{countText}</span>
    </div>
  );
}
