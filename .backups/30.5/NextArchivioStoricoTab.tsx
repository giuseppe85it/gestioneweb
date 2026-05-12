// Archivio Storico NEXT — Step 7 (PROMPT 29.9) — NextArchivioStoricoTab.
// Host top-level del modulo. Monta ArchivioFeed sotto lo scope CSS
// dedicato `.cc-archivio-scope-v1`. Auto-contenuto: non riceve props,
// gestisce internamente loading/error/empty via ArchivioFeed.

import type { ReactElement } from "react";

import type { ArchivioEventoModalRequest } from "./archivioTypes";
import { ArchivioFeed } from "./ArchivioFeed";
import "./styles/archivioStorico.css";

type Props = {
  onOpenEventoModal?: (req: ArchivioEventoModalRequest) => void;
};

export function NextArchivioStoricoTab({
  onOpenEventoModal,
}: Props): ReactElement {
  return (
    <div className="cc-archivio-scope-v1">
      <ArchivioFeed onOpenEventoModal={onOpenEventoModal} />
    </div>
  );
}
