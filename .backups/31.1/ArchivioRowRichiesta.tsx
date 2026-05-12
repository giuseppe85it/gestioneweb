// Archivio Storico NEXT — Step 3 (PROMPT 29.8) — ArchivioRowRichiesta.
// Riga compatta sub-tab Richieste. SPEC §5.4 + §15.1:
//  - D2: NIENTE colonna ID
//  - NIENTE type-chip tipologia (campo tipo non esiste su richieste)
//  - D4: step "Ricevuta" come per Segnalazioni (pallino warn senza
//        timestamp, tooltip "orario non tracciato")
//  - NIENTE step "Lavoro generato" (richieste non generano lavori)
//  - Badge Foto: hasFoto e' boolean -> mostriamo badge generico
//    "Foto" senza counter quando true.

import type { ReactElement } from "react";

import type {
  ArchivioEventoModalRequest,
  ArchivioMezzoMeta,
  ArchivioRecord,
} from "../archivioTypes";
import { ArchivioVeicoloPhoto } from "../ArchivioVeicoloPhoto";
import "../styles/archivioStorico.css";
import {
  ArchivioBadgeFotoIcon,
  ArchivioExpandChevron,
  formatDateShort,
  formatTarga,
  formatTimelineStamp,
} from "./ArchivioRowShared";

type Props = {
  record: Extract<ArchivioRecord, { kind: "richiesta" }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  mezzoMeta?: ArchivioMezzoMeta | null;
  onOpenEventoModal?: (req: ArchivioEventoModalRequest) => void;
};

const TOOLTIP_RICEVUTA: string =
  "Ricevuta dall'officina — orario non tracciato";

export function ArchivioRowRichiesta({
  record,
  isExpanded,
  onToggleExpand,
  mezzoMeta,
  onOpenEventoModal,
}: Props): ReactElement {
  const data = record.data;
  const dateLabel = formatDateShort(data.timestamp);
  const targaDisplay: string = formatTarga(data.targa);
  const rowClassName: string = ["archivio-row", isExpanded ? "is-expanded" : ""]
    .filter((c: string) => c.length > 0)
    .join(" ");

  const showRicevuta: boolean = data.letta === true;
  const showEvasa: boolean = data.evasa === true;

  return (
    <article className={rowClassName} onClick={onToggleExpand}>
      <div className="archivio-row-date">
        <div className="archivio-row-date-d">{dateLabel.d}</div>
        <div className="archivio-row-date-y">{dateLabel.y}</div>
        <div className="archivio-row-date-t">{dateLabel.t}</div>
      </div>

      <ArchivioVeicoloPhoto
        targa={data.targa ?? null}
        categoria={mezzoMeta?.categoria ?? null}
        fotoUrl={mezzoMeta?.fotoUrl ?? null}
      />

      <div className="archivio-row-body">
        <header className="archivio-row-head">
          <span className="archivio-row-targa">{targaDisplay}</span>
          <span className="archivio-row-head-spacer" />
          <button
            type="button"
            className="archivio-row-open-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenEventoModal) {
                onOpenEventoModal({
                  tipo: "richiesta_attrezzature",
                  richiestaId: data.id,
                  targa: data.targa,
                });
              }
            }}
            disabled={!onOpenEventoModal}
          >
            Apri dettaglio →
          </button>
          <ArchivioExpandChevron onClick={onToggleExpand} />
        </header>

        <div className="archivio-row-title">{data.testo}</div>

        {data.autistaNome ? (
          <div className="archivio-row-people">
            <span>
              Aperta da <strong>{data.autistaNome}</strong>
            </span>
          </div>
        ) : null}

        <footer className="archivio-row-foot">
          <div className="archivio-timeline">
            <span className="archivio-tl-step is-open">
              <span className="archivio-tl-dot" />
              <span className="archivio-tl-lab">Aperta</span>
              <span className="archivio-tl-ts">
                {formatTimelineStamp(data.timestamp)}
              </span>
            </span>
            {showRicevuta ? (
              <>
                <span className="archivio-tl-line is-done" />
                <span
                  className="archivio-tl-step is-taken-no-ts"
                  title={TOOLTIP_RICEVUTA}
                >
                  <span className="archivio-tl-dot" />
                  <span className="archivio-tl-lab">Ricevuta</span>
                  <span className="archivio-tl-ts">—</span>
                </span>
              </>
            ) : null}
            {showEvasa ? (
              <>
                <span className="archivio-tl-line is-done" />
                <span className="archivio-tl-step is-closed">
                  <span className="archivio-tl-dot" />
                  <span className="archivio-tl-lab">Evasa</span>
                  <span className="archivio-tl-ts">
                    {formatTimelineStamp(data.dataEvasione)}
                  </span>
                </span>
              </>
            ) : null}
          </div>
          {data.hasFoto ? (
            <div className="archivio-badges">
              <span className="archivio-badge" title="Allegate foto">
                <ArchivioBadgeFotoIcon />
                Foto
              </span>
            </div>
          ) : null}
        </footer>
      </div>
    </article>
  );
}
