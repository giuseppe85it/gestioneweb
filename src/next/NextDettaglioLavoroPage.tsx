import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { formatDateUI } from "../utils/dateFormat";
import "../pages/DettaglioLavoro.css";
import "./next-shell.css";
import {
  readNextDettaglioLavoroSnapshot,
  type NextLavoriDetailItem,
  type NextLavoriDetailSnapshot,
  type NextLavoriListaRouteId,
} from "./domain/nextLavoriDomain";

function formatDateLabel(timestamp: number | null, fallback: string | null): string {
  if (timestamp) return formatDateUI(timestamp);
  return fallback || "-";
}

function isListaRouteId(value: string | null): value is NextLavoriListaRouteId {
  return value === "lavori-in-attesa" || value === "lavori-eseguiti";
}

function buildBackPath(args: {
  search: string;
  from: string | null;
  snapshot: NextLavoriDetailSnapshot | null;
}): string {
  const params = new URLSearchParams(args.search);
  params.delete("from");

  const explicitFrom = isListaRouteId(args.from) ? args.from : null;
  const inferredFrom =
    args.snapshot?.target.eseguito === true ? "lavori-eseguiti" : "lavori-in-attesa";
  const routeId = explicitFrom ?? inferredFrom;
  const pathname = `/next/${routeId}`;
  const serialized = params.toString();

  return serialized ? `${pathname}?${serialized}` : pathname;
}

function renderFlags(item: NextLavoriDetailItem) {
  if (item.flags.length === 0 && item.quality === "certo") return null;

  return (
    <div className="lavoro-dettaglio" style={{ marginTop: 10 }}>
      <strong>Qualita dato:</strong> {item.quality.replace(/_/g, " ")}
      {item.flags.length > 0 ? ` - ${item.flags.join(", ")}` : ""}
    </div>
  );
}

function renderDetailCard(item: NextLavoriDetailItem) {
  return (
    <div
      key={item.id}
      className={`lavoro-card ${item.eseguito ? "lavoro-card-eseguito" : ""}`}
      style={item.isPrimary ? { borderColor: "#2d6a4f", boxShadow: "0 0 0 2px rgba(45,106,79,0.16)" } : undefined}
    >
      <div className="lavoro-top-row">
        <div className="lavoro-descrizione">{item.descrizione}</div>
        <span
          className={
            item.urgenza === "alta"
              ? "lavori-badge lavori-badge-alta"
              : item.urgenza === "bassa"
                ? "lavori-badge lavori-badge-bassa"
                : "lavori-badge lavori-badge-media"
          }
        >
          {(item.urgenza ?? "media").toUpperCase()}
        </span>
      </div>

      {item.isPrimary ? (
        <div className="lavoro-dettaglio" style={{ fontWeight: 800, color: "#2d6a4f" }}>
          Record richiesto
        </div>
      ) : null}

      <div className="lavoro-dettaglio">
        <strong>Stato:</strong> {item.eseguito ? "Eseguito" : "In attesa"}
      </div>
      <div className="lavoro-dettaglio">
        <strong>Inserito:</strong> {formatDateLabel(item.timestampInserimento, item.dataInserimento)}
      </div>
      {item.targa ? (
        <div className="lavoro-dettaglio">
          <strong>Targa:</strong> {item.targa}
        </div>
      ) : (
        <div className="lavoro-dettaglio">
          <strong>Gruppo:</strong> MAGAZZINO / senza targa
        </div>
      )}
      {item.segnalatoDa ? (
        <div className="lavoro-dettaglio">
          <strong>Segnalato da:</strong> {item.segnalatoDa}
        </div>
      ) : null}
      {item.dataEsecuzione || item.timestampEsecuzione ? (
        <div className="lavoro-dettaglio">
          <strong>Eseguito il:</strong> {formatDateLabel(item.timestampEsecuzione, item.dataEsecuzione)}
        </div>
      ) : null}
      {item.chiHaEseguito ? (
        <div className="lavoro-dettaglio">
          <strong>Esecutore:</strong> {item.chiHaEseguito}
        </div>
      ) : null}
      {item.dettagli ? (
        <div className="lavoro-dettaglio">
          <strong>Dettagli:</strong> {item.dettagli}
        </div>
      ) : null}
      {item.sottoElementiCount > 0 ? (
        <div className="lavoro-dettaglio">
          <strong>Sottoelementi:</strong> {item.sottoElementiCount}
        </div>
      ) : null}
      {renderFlags(item)}
    </div>
  );
}

function NextDettaglioLavoroPage() {
  const { lavoroId } = useParams<{ lavoroId: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const [snapshot, setSnapshot] = useState<NextLavoriDetailSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!lavoroId) {
        setError("Identificativo lavoro non specificato.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const detail = await readNextDettaglioLavoroSnapshot(lavoroId);
        if (cancelled) return;

        if (!detail) {
          setSnapshot(null);
          setError("Lavoro non trovato nel dataset clone-safe.");
          setLoading(false);
          return;
        }

        setSnapshot(detail);
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Impossibile leggere il dettaglio lavoro.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [lavoroId]);

  const backPath = buildBackPath({
    search: location.search,
    from,
    snapshot,
  });

  return (
    <div className="dl-page">
      <div className="dl-container">
        <div className="lavori-header">
          <img src="/logo.png" alt="logo" className="lavori-header-logo" />
          <div className="lavori-header-text">
            <div className="lavori-header-eyebrow">LAVORI</div>
            <div className="lavori-header-title">Dettaglio lavoro</div>
          </div>
        </div>

        <section className="next-clone-placeholder" style={{ marginBottom: 16, padding: 18 }}>
          <p>Dettaglio clone-safe in sola lettura della route madre `DettaglioLavoro`.</p>
          <p style={{ marginTop: 12 }}>
            Nel clone restano bloccati modifica, elimina, esegui e qualsiasi scrittura su `@lavori`.
          </p>
          <p style={{ marginTop: 12 }}>
            <Link to={backPath}>Torna alla lista clone</Link>
          </p>
        </section>

        {loading ? <div className="lavori-empty">Caricamento dettaglio lavoro...</div> : null}
        {!loading && error ? <div className="lavori-empty">{error}</div> : null}

        {!loading && !error && snapshot ? (
          <>
            <div className="lavori-group-title" style={{ marginBottom: 12 }}>
              {snapshot.detailGroup.resolution === "group-by-gruppo-id"
                ? `Gruppo ricostruito da gruppoId - ${snapshot.counts.totalItems} record`
                : "Record singolo - gruppo non ricostruibile in modo affidabile"}
            </div>

            <div className="lavoro-card" style={{ marginTop: 0 }}>
              <div className="lavoro-dettaglio">
                <strong>Raggruppamento:</strong> {snapshot.detailGroup.label}
              </div>
              <div className="lavoro-dettaglio">
                <strong>Chiave gruppo:</strong> {snapshot.detailGroup.key}
              </div>
              <div className="lavoro-dettaglio">
                <strong>gruppoId:</strong> {snapshot.detailGroup.gruppoId ?? "non disponibile"}
              </div>
              <div className="lavoro-dettaglio">
                <strong>Record aperti:</strong> {snapshot.counts.aperti} - <strong>Eseguiti:</strong>{" "}
                {snapshot.counts.eseguiti}
              </div>
              {snapshot.detailGroup.mezzo ? (
                <div className="lavoro-dettaglio">
                  <strong>Mezzo:</strong> {snapshot.detailGroup.mezzo.targa}
                  {snapshot.detailGroup.mezzo.categoria || snapshot.detailGroup.mezzo.marcaModello
                    ? ` - ${[snapshot.detailGroup.mezzo.categoria, snapshot.detailGroup.mezzo.marcaModello]
                        .filter(Boolean)
                        .join(" - ")}`
                    : ""}
                </div>
              ) : null}
            </div>

            {snapshot.limitations.length > 0 ? (
              <div className="lavori-empty" style={{ marginBottom: 16 }}>
                {snapshot.limitations.map((entry) => (
                  <div key={entry} style={{ marginBottom: 6 }}>
                    {entry}
                  </div>
                ))}
              </div>
            ) : null}

            {snapshot.items.map(renderDetailCard)}
          </>
        ) : null}

        <Link to={backPath} className="btn-indietro lavori-btn is-primary">
          Torna alla lista
        </Link>
      </div>
    </div>
  );
}

export default NextDettaglioLavoroPage;
