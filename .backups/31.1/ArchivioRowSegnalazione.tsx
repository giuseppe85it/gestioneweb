// Archivio Storico NEXT — Step 3 (PROMPT 29.8) — ArchivioRowSegnalazione.
// Riga compatta sub-tab Segnalazioni. SPEC §5.3 + §15.1:
//  - D2: NIENTE colonna ID
//  - NIENTE riga "Da app autista, luogo X" (campo luogo non esiste)
//  - D4: step "Ricevuta" = pallino warn senza timestamp + tooltip
//        "Ricevuta dall'officina — orario non tracciato"
//  - Step "Lavoro generato" reso quando hasLinkedLavoro === true,
//    link inverso a Lavoro (onClick NOOP in Step 3).

import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import { buildNextDettaglioLavoroPath } from "../../../domain/nextLavoriDomain";
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
  deriveSegnTipoChip,
  formatDateShort,
  formatTarga,
  formatTimelineStamp,
  segnTipoLabel,
} from "./ArchivioRowShared";

type Props = {
  record: Extract<ArchivioRecord, { kind: "segnalazione" }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  mezzoMeta?: ArchivioMezzoMeta | null;
  onOpenEventoModal?: (req: ArchivioEventoModalRequest) => void;
};

const TOOLTIP_RICEVUTA: string =
  "Ricevuta dall'officina — orario non tracciato";

export function ArchivioRowSegnalazione({
  record,
  isExpanded,
  onToggleExpand,
  mezzoMeta,
  onOpenEventoModal,
}: Props): ReactElement {
  const navigate = useNavigate();
  const data = record.data;
  const dateLabel = formatDateShort(data.timestamp);
  const targaDisplay: string = formatTarga(data.targa);
  const tipoKind: "freni" | "gomme" | "elettrico" | "altro" =
    deriveSegnTipoChip(data.tipo);
  const tipoClass: string =
    tipoKind === "freni"
      ? "is-freni"
      : tipoKind === "gomme"
        ? "is-gomme"
        : tipoKind === "elettrico"
          ? "is-elett"
          : "";
  const rowClassName: string = ["archivio-row", isExpanded ? "is-expanded" : ""]
    .filter((c: string) => c.length > 0)
    .join(" ");

  const showRicevuta: boolean =
    data.letta === true || data.stato === "presa_in_carico";
  const showChiusa: boolean = data.chiusa === true;
  const showGenerato: boolean = data.hasLinkedLavoro === true;
  const linkedLavoroLabel: string = data.linkedLavoroId
    ? `Lavoro ${data.linkedLavoroId.slice(0, 8)}`
    : "Lavoro";

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
          <span className={`archivio-row-type-chip ${tipoClass}`.trim()}>
            {segnTipoLabel(tipoKind)}
          </span>
          <span className="archivio-row-head-spacer" />
          <button
            type="button"
            className="archivio-row-open-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenEventoModal) {
                onOpenEventoModal({
                  tipo: "segnalazione",
                  segnalazioneId: data.id,
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

        <div className="archivio-row-title">{data.descrizione}</div>

        {data.autistaNome ? (
          <div className="archivio-row-people">
            <span>
              Aperta da <strong>{data.autistaNome}</strong>
              {data.badgeAutista ? (
                <> (badge <span style={{ fontFamily: "var(--font-mono)" }}>{data.badgeAutista}</span>)</>
              ) : null}
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
            {showChiusa ? (
              <>
                <span className="archivio-tl-line is-done" />
                <span className="archivio-tl-step is-closed">
                  <span className="archivio-tl-dot" />
                  <span className="archivio-tl-lab">Chiusa</span>
                  <span className="archivio-tl-ts">
                    {formatTimelineStamp(data.dataChiusura)}
                  </span>
                </span>
              </>
            ) : null}
            {showGenerato ? (
              <>
                <span className="archivio-tl-line is-gen" />
                <button
                  type="button"
                  className="archivio-tl-step is-gen archivio-tl-step-clickable"
                  title={
                    data.linkedLavoroId
                      ? `Apri lavoro #${data.linkedLavoroId}`
                      : undefined
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (data.linkedLavoroId) {
                      navigate(
                        buildNextDettaglioLavoroPath({
                          lavoroId: data.linkedLavoroId,
                        }),
                      );
                    }
                  }}
                >
                  <span className="archivio-tl-dot" />
                  <span className="archivio-tl-lab">Generato</span>
                  <span className="archivio-tl-ts">{linkedLavoroLabel}</span>
                </button>
              </>
            ) : null}
          </div>
          {data.fotoCount > 0 ? (
            <div className="archivio-badges">
              <span className="archivio-badge" title={`${data.fotoCount} foto allegate`}>
                <ArchivioBadgeFotoIcon />
                Foto <span className="archivio-badge-n">{data.fotoCount}</span>
              </span>
            </div>
          ) : null}
        </footer>
      </div>
    </article>
  );
}
