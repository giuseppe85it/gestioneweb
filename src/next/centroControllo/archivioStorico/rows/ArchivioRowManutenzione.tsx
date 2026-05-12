// Archivio Storico NEXT — Step 3 (PROMPT 29.8) — ArchivioRowManutenzione.
// Riga compatta sub-tab Manutenzioni. SPEC §5.2 + §15.1:
//  - D2: NIENTE colonna ID
//  - NIENTE badge Foto (nessun campo foto sui record manutenzione)
//  - Timeline: Aperta e Eseguita coincidono (record creato a posteriori)

import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import {
  extractTimestamp,
  type ArchivioMezzoMeta,
  type ArchivioRecord,
} from "../archivioTypes";
import { ArchivioKebabMenu } from "../ArchivioKebabMenu";
import { ArchivioVeicoloPhoto } from "../ArchivioVeicoloPhoto";
import "../styles/archivioStorico.css";
import {
  ArchivioBadgeMaterialiIcon,
  ArchivioExpandChevron,
  formatDateShort,
  formatImporto,
  formatTarga,
  formatTimelineStamp,
} from "./ArchivioRowShared";

type Props = {
  record: Extract<ArchivioRecord, { kind: "manutenzione" }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  mezzoMeta?: ArchivioMezzoMeta | null;
  onEliminaArchivio?: () => void;
};

function typeChipLabel(
  tipo: "mezzo" | "compressore" | "attrezzature",
): string {
  switch (tipo) {
    case "mezzo":
      return "Mezzo";
    case "compressore":
      return "Compressore";
    case "attrezzature":
      return "Attrezzature";
  }
}

export function ArchivioRowManutenzione({
  record,
  isExpanded,
  onToggleExpand,
  mezzoMeta,
  onEliminaArchivio,
}: Props): ReactElement {
  const navigate = useNavigate();
  const data = record.data;
  const ts: number = extractTimestamp(record);
  const safeTs: number | null = ts > 0 ? ts : null;
  const dateLabel = formatDateShort(safeTs);
  const targaRaw: string = String(data.targa ?? "").trim();
  const targaDisplay: string = targaRaw ? formatTarga(targaRaw) : "—";
  const rowClassName: string = ["archivio-row", isExpanded ? "is-expanded" : ""]
    .filter((c: string) => c.length > 0)
    .join(" ");

  const fornitore: string = String(data.fornitore ?? "").trim();
  const materialiCount: number = Array.isArray(data.materiali)
    ? data.materiali.length
    : 0;

  const importoInfo = formatImporto(data.importo, data.sourceDocumentCurrency);
  const showImporto: boolean = importoInfo.value !== "—";
  const timelineStamp: string = formatTimelineStamp(safeTs);

  return (
    <article className={rowClassName} onClick={onToggleExpand}>
      <div className="archivio-row-date">
        <div className="archivio-row-date-d">{dateLabel.d}</div>
        <div className="archivio-row-date-y">{dateLabel.y}</div>
        <div className="archivio-row-date-t">{dateLabel.t}</div>
      </div>

      <ArchivioVeicoloPhoto
        targa={data.targa ?? null}
        categoria={
          mezzoMeta?.categoria ??
          (data.tipo === "compressore"
            ? "compressore"
            : data.tipo === "attrezzature"
              ? "attrezzature"
              : null)
        }
        fotoUrl={mezzoMeta?.fotoUrl ?? null}
      />

      <div className="archivio-row-body">
        <header className="archivio-row-head">
          <span className="archivio-row-targa">{targaDisplay}</span>
          <span className="archivio-row-type-chip">
            {typeChipLabel(data.tipo)}
          </span>
          <span className="archivio-row-head-spacer" />
          <ArchivioKebabMenu
            onApriDettaglio={() => {
              navigate(
                `/next/manutenzioni?recordId=${encodeURIComponent(data.id)}`,
              );
            }}
            onElimina={() => {
              if (onEliminaArchivio) onEliminaArchivio();
            }}
            apriDettaglioDisabled={false}
          />
          <ArchivioExpandChevron onClick={onToggleExpand} />
        </header>

        <div className="archivio-row-title">{data.descrizione}</div>

        {(fornitore || showImporto) ? (
          <div className="archivio-row-people">
            {fornitore ? (
              <span>
                Fornitore <strong>{fornitore}</strong>
              </span>
            ) : null}
            {showImporto ? (
              <span className="archivio-row-importo">
                <span className="archivio-row-importo-ccy">
                  {importoInfo.ccy}
                </span>
                {importoInfo.value}
                {importoInfo.isContratto ? (
                  <span className="archivio-row-importo-contratto">
                    contratto
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>
        ) : null}

        <footer className="archivio-row-foot">
          <div className="archivio-timeline">
            <span className="archivio-tl-step is-open">
              <span className="archivio-tl-dot" />
              <span className="archivio-tl-lab">Aperta</span>
              <span className="archivio-tl-ts">{timelineStamp}</span>
            </span>
            <span className="archivio-tl-line is-done" />
            <span className="archivio-tl-step is-closed">
              <span className="archivio-tl-dot" />
              <span className="archivio-tl-lab">Eseguita</span>
              <span className="archivio-tl-ts">{timelineStamp}</span>
            </span>
          </div>
          {materialiCount > 0 ? (
            <div className="archivio-badges">
              <span className="archivio-badge" title={`${materialiCount} materiali utilizzati`}>
                <ArchivioBadgeMaterialiIcon />
                Materiali <span className="archivio-badge-n">{materialiCount}</span>
              </span>
            </div>
          ) : null}
        </footer>
      </div>
    </article>
  );
}
