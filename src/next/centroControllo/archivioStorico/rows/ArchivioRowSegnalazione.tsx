// Archivio Storico NEXT — Step 3 (PROMPT 29.8) — ArchivioRowSegnalazione.
// Riga compatta sub-tab Segnalazioni. SPEC §5.3 + §15.1:
//  - D2: NIENTE colonna ID
//  - NIENTE riga "Da app autista, luogo X" (campo luogo non esiste)
//  - D4: step "Ricevuta" = pallino warn senza timestamp + tooltip
//        "Ricevuta dall'officina — orario non tracciato"
//  - Step "Manutenzione generata" reso solo per backlink migrati.

import type { ReactElement } from "react";

import type {
  ArchivioEventoModalRequest,
  ArchivioMezzoMeta,
  ArchivioRecord,
} from "../archivioTypes";
import { ArchivioKebabMenu } from "../ArchivioKebabMenu";
import { ArchivioVeicoloPhoto } from "../ArchivioVeicoloPhoto";
// PROMPT 52: frase storia visibile direttamente sulla riga base segnalazione
// (prima era solo dentro ArchivioRowExpanded dietro chevron, e Giuseppe non
// la vedeva). Allinea il rendering con ArchivioRowManutenzione (riga compact).
import { FraseStoriaRecord } from "../../../components/FraseStoriaRecord";
import { recordChiusoFromRaw } from "../../../helpers/frasestoriaRecord";
import { readLegameLavoro } from "../../../helpers/cicloLegame";
import "../styles/archivioStorico.css";
import {
  ArchivioBadgeFotoIcon,
  ArchivioExpandChevron,
} from "./ArchivioRowShared";
import {
  deriveSegnTipoChip,
  formatDateShort,
  formatTarga,
  formatTimelineStamp,
  segnTipoLabel,
} from "./ArchivioRowFormatters";

type Props = {
  record: Extract<ArchivioRecord, { kind: "segnalazione" }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  mezzoMeta?: ArchivioMezzoMeta | null;
  onOpenEventoModal?: (req: ArchivioEventoModalRequest) => void;
  onEliminaArchivio?: () => void;
  onRiapri?: () => void;
};

const TOOLTIP_RICEVUTA: string =
  "Ricevuta dall'officina — orario non tracciato";

function normalizeTargaCompare(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function ArchivioRowSegnalazione({
  record,
  isExpanded,
  onToggleExpand,
  mezzoMeta,
  onOpenEventoModal,
  onEliminaArchivio,
  onRiapri,
}: Props): ReactElement {
  const data = record.data;
  const dateLabel = formatDateShort(data.timestamp);
  const targaDisplay: string = formatTarga(data.targa);
  const targaKey: string = normalizeTargaCompare(data.targa);
  const targaCamionKey: string = normalizeTargaCompare(data.targaCamion);
  const showTraino: boolean =
    Boolean(targaCamionKey) &&
    targaCamionKey !== targaKey &&
    (String(data.ambito ?? "").trim().toLowerCase() === "rimorchio" || Boolean(targaKey));
  const trainoDisplay: string | null = showTraino ? formatTarga(data.targaCamion) : null;
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
  const migratedManutenzionePrefix: string = "from-" + "lavo" + "ro-";
  const linkedIds = readLegameLavoro(data as unknown as Record<string, unknown>);
  const linkedManutenzioneId: string | null =
    data.linkedLavoroId?.startsWith(migratedManutenzionePrefix)
      ? data.linkedLavoroId
      : null;
  const showGenerato: boolean =
    data.hasLinkedLavoro === true && (Boolean(linkedManutenzioneId) || linkedIds.length > 0);
  const linkedManutenzioneLabel: string = linkedManutenzioneId
    ? `Manutenzione ${linkedManutenzioneId.slice(0, 16)}`
    : linkedIds.length > 1
      ? `Manutenzioni (${linkedIds.length})`
      : "Manutenzione";

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
          {trainoDisplay ? (
            <span className="archivio-row-cat">trainato da {trainoDisplay}</span>
          ) : null}
          <span className={`archivio-row-type-chip ${tipoClass}`.trim()}>
            {segnTipoLabel(tipoKind)}
          </span>
          <span className="archivio-row-head-spacer" />
          <ArchivioKebabMenu
            onApriDettaglio={() => {
              if (onOpenEventoModal) {
                onOpenEventoModal({
                  tipo: "segnalazione",
                  segnalazioneId: data.id,
                  targa: data.targa,
                });
              }
            }}
            onElimina={() => {
              if (onEliminaArchivio) onEliminaArchivio();
            }}
            onRiapri={showChiusa ? onRiapri : undefined}
            apriDettaglioDisabled={!onOpenEventoModal}
          />
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

        {/* PROMPT 52: frase storia compatta. `recordChiusoFromRaw` con tipoOverride
            "segnalazione" + estensione per `stato === "chiusa"` (cfr. helper P52)
            produce la frase coerente: "Segnalazione di X del Y, eseguita il Z. ..." */}
        <FraseStoriaRecord
          {...recordChiusoFromRaw(data as unknown as Record<string, unknown>, "segnalazione")}
          compact
        />

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
                <span
                  className="archivio-tl-step is-gen"
                  title={linkedManutenzioneId ?? undefined}
                >
                  <span className="archivio-tl-dot" />
                  <span className="archivio-tl-lab">Generato</span>
                  <span className="archivio-tl-ts">{linkedManutenzioneLabel}</span>
                </span>
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
