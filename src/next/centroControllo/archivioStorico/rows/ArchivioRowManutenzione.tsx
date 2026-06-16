// Archivio Storico NEXT — Step 3 (PROMPT 29.8) — ArchivioRowManutenzione.
// Riga compatta sub-tab Manutenzioni. SPEC §5.2 + §15.1:
//  - D2: NIENTE colonna ID
//  - NIENTE badge Foto (nessun campo foto sui record manutenzione)
//  - Timeline: Aperta e Eseguita coincidono (record creato a posteriori)

import type { CSSProperties, ReactElement } from "react";
import { useNavigate } from "react-router-dom";

import {
  extractTimestamp,
  type ArchivioMezzoMeta,
  type ArchivioRecord,
} from "../archivioTypes";
import type { NextManutenzioneStato } from "../../../domain/nextManutenzioniDomain";
import { formatDateTimeUI } from "../../../nextDateFormat";
import { ArchivioKebabMenu } from "../ArchivioKebabMenu";
import { ArchivioVeicoloPhoto } from "../ArchivioVeicoloPhoto";
import { FraseStoriaRecord } from "../../../components/FraseStoriaRecord";
import { recordChiusoFromRaw } from "../../../helpers/frasestoriaRecord";
// PROMPT 49: cross-read sorgente per frase storia coerente quando la manutenzione
// ha back-link a una segnalazione/controllo (origineRefId).
import { useSorgentiManutenzione } from "../../../helpers/useSorgenteManutenzione";
import "../styles/archivioStorico.css";
import {
  ArchivioBadgeMaterialiIcon,
  ArchivioExpandChevron,
} from "./ArchivioRowShared";
import {
  formatDateShort,
  formatImporto,
  formatTarga,
  formatTimelineStamp,
} from "./ArchivioRowFormatters";

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

function statoLabel(stato: NextManutenzioneStato | null | undefined): string {
  if (stato === "daFare") return "DA FARE";
  if (stato === "programmata") return "PROGRAMMATA";
  if (stato === "chiusa_da_evento") return "CHIUSA DA EVENTO";
  if (stato === "eseguita") return "ESEGUITA";
  // PROMPT 44 — D6: record legacy senza stato → etichetta "Storico" (solo
  // display, zero scritture Firestore sui 55/73 record migrati).
  return "STORICO";
}

function statoStyle(stato: NextManutenzioneStato | null | undefined): CSSProperties {
  if (stato === "daFare") {
    return { background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" };
  }
  if (stato === "programmata") {
    return { background: "#dbeafe", color: "#1e40af", borderColor: "#bfdbfe" };
  }
  if (stato === "chiusa_da_evento") {
    return { background: "#f3f4f6", color: "#374151", borderColor: "#d1d5db" };
  }
  if (stato === "eseguita") {
    return { background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" };
  }
  // PROMPT 44 — D6: stato "Storico" (legacy senza stato) — grigio neutro.
  return { background: "#e5e7eb", color: "#4b5563", borderColor: "#d1d5db" };
}

function formatChiusuraEventoTipo(value: string | null | undefined): string {
  if (value === "gomme_evento") return "cambio gomme";
  if (value === "manutenzione_eseguita") return "manutenzione eseguita";
  return value ? value.replace(/_/g, " ") : "evento";
}

function statoTitle(
  stato: NextManutenzioneStato | null | undefined,
  chiusuraDi: string | null | undefined,
  chiusuraData: number | null | undefined,
): string | undefined {
  if (stato !== "chiusa_da_evento") return undefined;
  const evento = formatChiusuraEventoTipo(chiusuraDi);
  const data = chiusuraData ? formatDateTimeUI(chiusuraData) : "-";
  return data && data !== "-"
    ? `Chiusa dal ${evento} del ${data}`
    : `Chiusa dal ${evento}`;
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
  // PROMPT 44 — D6: il default storico era "eseguita" (mascherava 55/73 record
  // legacy come "ESEGUITA"). Ora passa null al label/style che mostra "STORICO".
  const stato = data.stato ?? null;
  // PROMPT 49: cross-read sorgente per frase storia coerente. Quando la manutenzione
  // ha `origineRefId` (= nata da/agganciata a segnalazione o controllo), la frase
  // pesca data + autore dalla sorgente. Senza back-link, fallback al record stesso.
  const sourceRecords = useSorgentiManutenzione(data as unknown as Record<string, unknown>);
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
          <span
            className="archivio-row-type-chip"
            style={statoStyle(stato)}
            title={statoTitle(stato, data.chiusuraDi, data.chiusuraData)}
          >
            {statoLabel(stato)}
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
        <FraseStoriaRecord
          {...recordChiusoFromRaw(
            data as unknown as Record<string, unknown>,
            undefined,
            { sourceRecords },
          )}
          compact
        />

        {(fornitore || showImporto) ? (
          <div className="archivio-row-people">
            {fornitore ? (
              <span>
                Officina <strong>{fornitore}</strong>
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
              <span className="archivio-tl-lab">{statoLabel(stato)}</span>
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
