// Archivio Storico NEXT — Step 3 (PROMPT 29.8) — ArchivioRowLavoro.
// Riga compatta sub-tab Lavori. SPEC §5.1 + esclusioni §15.1:
//  - D2: NIENTE colonna ID
//  - D3: NIENTE badge Materiali sui Lavori
//  - D4: NIENTE step "Presa/Ricevuta" (non tracciato sui Lavori)
//  - Reader Step 1 espone NextLavoriListaRow (no source.*), quindi
//    NIENTE step "Lavoro generato"; il link inverso e' sulla riga
//    Segnalazione via `linkedLavoroId`.

import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { buildNextDettaglioLavoroPath } from "../../../domain/nextLavoriDomain";
import type { ArchivioMezzoMeta, ArchivioRecord } from "../archivioTypes";
import { ArchivioKebabMenu } from "../ArchivioKebabMenu";
import { ArchivioVeicoloPhoto } from "../ArchivioVeicoloPhoto";
import "../styles/archivioStorico.css";
import {
  ArchivioExpandChevron,
  formatDateShort,
  formatTarga,
  formatTimelineStamp,
} from "./ArchivioRowShared";

type Props = {
  record: Extract<ArchivioRecord, { kind: "lavoro" }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  mezzoMeta?: ArchivioMezzoMeta | null;
  onEliminaArchivio?: () => void;
};

function urgenzaClass(
  urgenza: "bassa" | "media" | "alta" | null,
): "is-alta" | "is-media" | "is-bassa" {
  if (urgenza === "alta") return "is-alta";
  if (urgenza === "media") return "is-media";
  return "is-bassa";
}

function urgenzaLabel(urgenza: "bassa" | "media" | "alta" | null): string {
  if (urgenza === "alta") return "Alta urgenza";
  if (urgenza === "media") return "Media";
  return "Bassa";
}

function rowUrgClass(urgenza: "bassa" | "media" | "alta" | null): string {
  if (urgenza === "alta") return "is-urg-alta";
  if (urgenza === "media") return "is-urg-media";
  return "";
}

export function ArchivioRowLavoro({
  record,
  isExpanded,
  onToggleExpand,
  mezzoMeta,
  onEliminaArchivio,
}: Props): ReactElement {
  const navigate = useNavigate();
  const data = record.data;
  const dateLabel = formatDateShort(data.timestampInserimento);
  const targaDisplay: string = formatTarga(data.mezzoTarga ?? data.targa);
  const urgClass: string = urgenzaClass(data.urgenza);
  const urgLabelText: string = urgenzaLabel(data.urgenza);
  const rowUrg: string = rowUrgClass(data.urgenza);
  const rowClassName: string = [
    "archivio-row",
    rowUrg,
    isExpanded ? "is-expanded" : "",
  ]
    .filter((c: string) => c.length > 0)
    .join(" ");

  const segnalatoDa: string | null = data.segnalatoDa;
  const chiHaEseguito: string | null = data.chiHaEseguito;
  const hasOriginPeople: boolean = Boolean(segnalatoDa) || Boolean(chiHaEseguito);

  const showChiusa: boolean = data.eseguito === true;

  return (
    <article className={rowClassName} onClick={onToggleExpand}>
      <div className="archivio-row-date">
        <div className="archivio-row-date-d">{dateLabel.d}</div>
        <div className="archivio-row-date-y">{dateLabel.y}</div>
        <div className="archivio-row-date-t">{dateLabel.t}</div>
      </div>

      <ArchivioVeicoloPhoto
        targa={data.mezzoTarga ?? data.targa ?? null}
        categoria={mezzoMeta?.categoria ?? null}
        fotoUrl={mezzoMeta?.fotoUrl ?? null}
      />

      <div className="archivio-row-body">
        <header className="archivio-row-head">
          <span className="archivio-row-targa">{targaDisplay}</span>
          <span className={`archivio-row-urg-pill ${urgClass}`}>
            {urgLabelText}
          </span>
          <span className="archivio-row-head-spacer" />
          <ArchivioKebabMenu
            onApriDettaglio={() => {
              navigate(buildNextDettaglioLavoroPath({ lavoroId: data.id }));
            }}
            onElimina={() => {
              if (onEliminaArchivio) onEliminaArchivio();
            }}
            apriDettaglioDisabled={false}
          />
          <ArchivioExpandChevron onClick={onToggleExpand} />
        </header>

        <div className="archivio-row-title">{data.descrizione}</div>

        {hasOriginPeople ? (
          <div className="archivio-row-people">
            {segnalatoDa ? (
              <span>
                Aperto da <strong>{segnalatoDa}</strong>
              </span>
            ) : null}
            {segnalatoDa && chiHaEseguito ? (
              <span className="archivio-row-people-sep">·</span>
            ) : null}
            {chiHaEseguito ? (
              <span>
                Eseguito da <strong>{chiHaEseguito}</strong>
              </span>
            ) : null}
          </div>
        ) : null}

        <footer className="archivio-row-foot">
          <div className="archivio-timeline">
            <span className="archivio-tl-step is-open">
              <span className="archivio-tl-dot" />
              <span className="archivio-tl-lab">Aperta</span>
              <span className="archivio-tl-ts">
                {formatTimelineStamp(data.timestampInserimento)}
              </span>
            </span>
            {showChiusa ? (
              <>
                <span className="archivio-tl-line is-done" />
                <span className="archivio-tl-step is-closed">
                  <span className="archivio-tl-dot" />
                  <span className="archivio-tl-lab">Chiusa</span>
                  <span className="archivio-tl-ts">
                    {formatTimelineStamp(data.timestampEsecuzione)}
                  </span>
                </span>
              </>
            ) : null}
          </div>
        </footer>
      </div>
    </article>
  );
}
