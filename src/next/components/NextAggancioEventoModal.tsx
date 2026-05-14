import { useEffect, useMemo, useState, type ReactElement } from "react";

import {
  getEventiCompatibiliPerChiusura,
  type EventoCompatibile,
  type TipoEventoChiusuraCompatibile,
} from "../helpers/eventiCompatibili";
import { formatDateTimeUI } from "../nextDateFormat";

export type AggancioEventoTipoRecord = "manutenzione" | "segnalazione" | "controllo";

export type AggancioEventoRecord = {
  id: string;
  targa: string;
  dataRiferimento: number;
  titolo?: string | null;
};

type Props = {
  record: AggancioEventoRecord;
  tipoRecord: AggancioEventoTipoRecord;
  tipoEvento?: TipoEventoChiusuraCompatibile;
  busy?: boolean;
  onConfirm: (evento: EventoCompatibile) => void;
  onCancel: () => void;
};

function formatTipoRecord(value: AggancioEventoTipoRecord): string {
  if (value === "segnalazione") return "segnalazione";
  if (value === "controllo") return "controllo";
  return "manutenzione";
}

function buildDistanceLabel(evento: EventoCompatibile): string {
  if (evento.distanzaGiorni === 0) return "stesso giorno";
  if (evento.distanzaGiorni === 1) return "1 giorno dopo";
  return `${evento.distanzaGiorni} giorni dopo`;
}

export function NextAggancioEventoModal({
  record,
  tipoRecord,
  tipoEvento = "gomme_evento",
  busy = false,
  onConfirm,
  onCancel,
}: Props): ReactElement {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventi, setEventi] = useState<EventoCompatibile[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function loadEventi() {
      setLoading(true);
      setError(null);
      try {
        const nextEventi = await getEventiCompatibiliPerChiusura(
          record.targa,
          record.dataRiferimento,
          tipoEvento,
        );
        if (cancelled) return;
        setEventi(nextEventi);
        setSelectedId(nextEventi.find((entry) => entry.suggerito)?.id ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Errore lettura eventi compatibili.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadEventi();
    return () => {
      cancelled = true;
    };
  }, [record.dataRiferimento, record.targa, tipoEvento]);

  const suggested = useMemo(() => eventi.filter((entry) => entry.suggerito), [eventi]);
  const others = useMemo(() => eventi.filter((entry) => !entry.suggerito), [eventi]);
  const selectedEvento = eventi.find((entry) => entry.id === selectedId) ?? null;
  const tipoRecordLabel = formatTipoRecord(tipoRecord);

  const confirm = (): void => {
    if (!selectedEvento) return;
    onConfirm(selectedEvento);
  };

  const renderEvento = (evento: EventoCompatibile): ReactElement => (
    <label
      key={evento.id}
      style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0" }}
    >
      <input
        type="radio"
        name="aggancio-evento"
        checked={selectedId === evento.id}
        onChange={() => setSelectedId(evento.id)}
        disabled={busy}
      />
      <span>
        <strong>{evento.descrizione}</strong>
        <span style={{ display: "block", color: "#64748b", fontSize: 12 }}>
          {formatDateTimeUI(evento.data)} - {buildDistanceLabel(evento)}
          {evento.asse ? ` - ${evento.asse}` : ""}
          {evento.km !== null ? ` - km ${evento.km}` : ""}
        </span>
      </span>
    </label>
  );

  return (
    <div className="aix-backdrop" onMouseDown={busy ? undefined : onCancel}>
      <div className="aix-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="aix-head">
          <h3>Aggancia evento</h3>
          <button className="aix-close" type="button" onClick={onCancel} disabled={busy}>
            CHIUDI
          </button>
        </div>
        <div className="aix-body">
          <p style={{ marginTop: 0 }}>
            Aggancia un cambio gomme esistente a questa {tipoRecordLabel}.
          </p>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Targa <strong>{record.targa || "-"}</strong>
            {" - "}
            riferimento {formatDateTimeUI(record.dataRiferimento)}
            {record.titolo ? ` - ${record.titolo}` : ""}
          </p>

          {loading ? <p>Caricamento cambi gomme compatibili...</p> : null}
          {error ? <div className="admin-error">{error}</div> : null}
          {!loading && !error && eventi.length === 0 ? (
            <p>Nessun cambio gomme posteriore per questo mezzo. Niente da agganciare.</p>
          ) : null}

          {suggested.length > 0 ? (
            <section>
              <h4>Suggeriti entro 30 giorni</h4>
              {suggested.map(renderEvento)}
            </section>
          ) : null}

          {others.length > 0 ? (
            <section>
              <h4>Altri cambi gomme successivi</h4>
              {others.map(renderEvento)}
            </section>
          ) : null}

          <div className="aix-actions">
            <button className="edit" type="button" onClick={onCancel} disabled={busy}>
              ANNULLA
            </button>
            <button
              className="edit"
              type="button"
              onClick={confirm}
              disabled={busy || loading || !selectedEvento}
            >
              CONFERMA AGGANCIO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
