// Archivio Storico NEXT — Step 7 (PROMPT 29.9) — NextArchivioStoricoTab.
// Host top-level del modulo. Monta ArchivioFeed sotto lo scope CSS
// dedicato `.cc-archivio-scope-v1`. Auto-contenuto: non riceve props,
// gestisce internamente loading/error/empty via ArchivioFeed.

import type { ReactElement } from "react";

import { ArchivioFeed } from "./ArchivioFeed";
import "./styles/archivioStorico.css";

export function NextArchivioStoricoTab(): ReactElement {
  return (
    <div className="cc-archivio-scope-v1">
      <ArchivioFeed />
    </div>
  );
}
