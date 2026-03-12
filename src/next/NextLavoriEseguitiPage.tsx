import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { formatDateUI } from "../utils/dateFormat";
import "../pages/LavoriEseguiti.css";
import "./next-shell.css";
import {
  buildNextDettaglioLavoroPath,
  readNextLavoriEseguitiSnapshot,
  type NextLavoriListaGroup,
  type NextLavoriListaRow,
  type NextLavoriListaRouteId,
  type NextLavoroUrgenza,
} from "./domain/nextLavoriDomain";

type UrgencyBucket = "alta" | "media" | "bassa";

function getUrgencyBucket(value: NextLavoroUrgenza): UrgencyBucket {
  if (value === "alta" || value === "media" || value === "bassa") return value;
  return "media";
}

function getUrgencyClass(value: NextLavoroUrgenza): string {
  if (value === "alta") return "lavori-badge lavori-badge-alta";
  if (value === "bassa") return "lavori-badge lavori-badge-bassa";
  return "lavori-badge lavori-badge-media";
}

function getUrgencyLabel(value: NextLavoroUrgenza): string {
  if (value === "alta" || value === "media" || value === "bassa") {
    return value.toUpperCase();
  }
  return "MEDIA";
}

function formatDateLabel(timestamp: number | null, fallback: string | null): string {
  if (timestamp) return formatDateUI(timestamp);
  return fallback || "-";
}

function splitRowsByUrgency(rows: NextLavoriListaRow[]): Record<UrgencyBucket, NextLavoriListaRow[]> {
  const buckets: Record<UrgencyBucket, NextLavoriListaRow[]> = {
    alta: [],
    media: [],
    bassa: [],
  };

  rows.forEach((row) => {
    buckets[getUrgencyBucket(row.urgenza)].push(row);
  });

  return buckets;
}

function renderSection(
  title: string,
  rows: NextLavoriListaRow[],
  buildDetailPath: (lavoroId: string) => string
) {
  if (rows.length === 0) return null;

  return (
    <div className="lavori-urgency-section">
      <div className="lavori-urgency-title">
        {title} ({rows.length})
      </div>
      <div className="lavori-rows">
        {rows.map((row) => {
          const metaParts = [`Inserito: ${formatDateLabel(row.timestampInserimento, row.dataInserimento)}`];
          if (row.dataEsecuzione || row.timestampEsecuzione) {
            metaParts.push(
              `Eseguito: ${formatDateLabel(row.timestampEsecuzione, row.dataEsecuzione)}`
            );
          }
          if (row.chiHaEseguito) metaParts.push(`Esecutore: ${row.chiHaEseguito}`);

          return (
            <Link
              key={row.id}
              to={buildDetailPath(row.id)}
              className={`lavori-row lavori-row--${getUrgencyBucket(row.urgenza)}`}
              style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
            >
              <div className="lavori-row-main">
                <div className="lavori-row-desc">{row.descrizione}</div>
                <div className="lavori-row-meta">{metaParts.join(" - ")}</div>
              </div>
              <span className={getUrgencyClass(row.urgenza)}>{getUrgencyLabel(row.urgenza)}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function renderGroup(
  group: NextLavoriListaGroup,
  buildDetailPath: (lavoroId: string) => string
) {
  const sections = splitRowsByUrgency(group.items);
  const mezzoMeta = group.mezzo
    ? [group.mezzo.categoria, group.mezzo.marcaModello].filter(Boolean).join(" - ")
    : "Lavori senza targa o di magazzino";

  return (
    <div key={group.key} className="mezzo-card is-open">
      <div className="mezzo-card-header" style={{ cursor: "default" }}>
        <div className="mezzo-photo">
          {group.mezzo?.fotoUrl ? (
            <img
              src={group.mezzo.fotoUrl}
              alt={`foto ${group.label}`}
              className="mezzo-photo-img"
            />
          ) : (
            <div className="mezzo-photo-placeholder">
              {group.kind === "magazzino" ? "MAG" : "MEZZO"}
            </div>
          )}
        </div>
        <div className="mezzo-info">
          <div className="mezzo-targa">{group.label}</div>
          <div className="mezzo-meta">{mezzoMeta || "-"}</div>
        </div>
        <div className="mezzo-actions">
          <span className="lavori-group-title">{group.counts.total} lavori</span>
        </div>
      </div>
      <div className="mezzo-body">
        {renderSection("ALTA", sections.alta, buildDetailPath)}
        {renderSection("MEDIA", sections.media, buildDetailPath)}
        {renderSection("BASSA", sections.bassa, buildDetailPath)}
      </div>
    </div>
  );
}

function NextLavoriEseguitiPage() {
  const routeId: NextLavoriListaRouteId = "lavori-eseguiti";
  const location = useLocation();
  const backToHome = location.search
    ? `/next${location.search}`
    : "/next";
  const [groups, setGroups] = useState<NextLavoriListaGroup[]>([]);
  const [totalLavori, setTotalLavori] = useState(0);
  const [totalGruppi, setTotalGruppi] = useState(0);
  const [limitNote, setLimitNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const snapshot = await readNextLavoriEseguitiSnapshot();
        if (cancelled) return;
        setGroups(snapshot.groups);
        setTotalLavori(snapshot.counts.totalLavori);
        setTotalGruppi(snapshot.counts.totalGruppi);
        setLimitNote(snapshot.limitations[0] ?? null);
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Impossibile leggere i lavori eseguiti.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const buildDetailPath = (lavoroId: string) =>
    buildNextDettaglioLavoroPath({
      lavoroId,
      search: location.search,
      from: routeId,
    });

  return (
    <div className="le-page">
      <div className="le-container">
        <div className="lavori-header lavori-header--centered">
          <img src="/logo.png" alt="logo" className="lavori-header-logo" />
          <div className="lavori-header-text lavori-header-text--centered">
            <div className="lavori-header-eyebrow">LAVORI</div>
            <div className="lavori-header-title">Lavori eseguiti</div>
          </div>
        </div>

        <section className="next-clone-placeholder" style={{ marginBottom: 16, padding: 18 }}>
          <p>Lista globale read-only dei lavori chiusi (`eseguito === true`).</p>
          <p style={{ marginTop: 12 }}>
            Il dettaglio si apre ora in sola lettura; restano bloccati modifica, chiusura,
            PDF e azioni esterne.
          </p>
          <p style={{ marginTop: 12 }}>
            <Link to={backToHome}>Torna alla Home clone</Link>
          </p>
        </section>

        <div className="lavori-group-title" style={{ marginBottom: 12 }}>
          Gruppi: {totalGruppi} - Lavori: {totalLavori}
        </div>

        {limitNote ? (
          <div className="lavori-empty" style={{ marginBottom: 16 }}>
            {limitNote}
          </div>
        ) : null}

        {loading ? (
          <div className="lavori-empty">Caricamento lavori...</div>
        ) : error ? (
          <div className="lavori-empty">{error}</div>
        ) : groups.length === 0 ? (
          <div className="lavori-empty">Nessun lavoro eseguito leggibile.</div>
        ) : (
          <div className="lavori-accordion">
            {groups.map((group) => renderGroup(group, buildDetailPath))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NextLavoriEseguitiPage;
