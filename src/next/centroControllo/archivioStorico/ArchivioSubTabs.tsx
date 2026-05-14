// Archivio Storico NEXT — Step 5 (PROMPT 29.9) — ArchivioSubTabs.
// 3 sub-tab (Manutenzioni | Segnalazioni | Richieste) con
// count badge dinamico + density toggle a destra.

import type { ReactElement } from "react";

import type { ArchivioRecordKind } from "./archivioTypes";
import type { ArchivioCountsByKind } from "./hooks/useArchivioSearch";
import "./styles/archivioStorico.css";

export type ArchivioDensity = "comoda" | "compatta";

type Props = {
  activeKind: ArchivioRecordKind;
  setActiveKind: (kind: ArchivioRecordKind) => void;
  counts: ArchivioCountsByKind;
  density: ArchivioDensity;
  setDensity: (d: ArchivioDensity) => void;
};

type SubTabDef = {
  kind: ArchivioRecordKind;
  label: string;
};

const SUBTABS: ReadonlyArray<SubTabDef> = [
  { kind: "manutenzione", label: "Manutenzioni" },
  { kind: "segnalazione", label: "Segnalazioni" },
  { kind: "richiesta", label: "Richieste" },
];

export function ArchivioSubTabs({
  activeKind,
  setActiveKind,
  counts,
  density,
  setDensity,
}: Props): ReactElement {
  return (
    <div className="archivio-subtabs" role="tablist">
      {SUBTABS.map((tab: SubTabDef) => {
        const isActive: boolean = activeKind === tab.kind;
        const n: number = counts[tab.kind];
        return (
          <button
            key={tab.kind}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`archivio-tab ${isActive ? "is-active" : ""}`}
            onClick={() => setActiveKind(tab.kind)}
          >
            {tab.label} <span className="archivio-ct">{n}</span>
          </button>
        );
      })}
      <div className="archivio-tabs-spacer" />
      <div className="archivio-density-toggle" role="group" aria-label="Densità lista">
        <button
          type="button"
          className={density === "comoda" ? "is-active" : ""}
          onClick={() => setDensity("comoda")}
        >
          Comoda
        </button>
        <button
          type="button"
          className={density === "compatta" ? "is-active" : ""}
          onClick={() => setDensity("compatta")}
        >
          Compatta
        </button>
      </div>
    </div>
  );
}
