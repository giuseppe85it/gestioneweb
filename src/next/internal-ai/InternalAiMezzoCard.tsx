import { useState } from "react";
import type { MezzoDossierCardData } from "./internalAiTypes";
import "./internalAiMezzoCard.css";

const LAVORI_PREVIEW = 5;
const MANUTENZ_PREVIEW = 3;

function revisioneBadge(
  timestamp: number | null,
): { label: string; cls: string } {
  if (timestamp === null) return { label: "data non disponibile", cls: "is-neutral" };
  const days = Math.floor((timestamp - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return { label: "scaduta", cls: "is-danger" };
  if (days <= 30) return { label: `in scadenza (${days} gg)`, cls: "is-warning" };
  return { label: `ok (${days} gg)`, cls: "is-positive" };
}

function urgenzaBadge(
  urgenza: "bassa" | "media" | "alta" | null,
): { label: string; cls: string } | null {
  if (!urgenza) return null;
  if (urgenza === "alta") return { label: "alta", cls: "is-danger" };
  if (urgenza === "media") return { label: "media", cls: "is-warning" };
  return { label: "bassa", cls: "is-neutral" };
}

function severityClass(severity: "danger" | "warning" | "info"): string {
  if (severity === "danger") return "is-danger";
  if (severity === "warning") return "is-warning";
  return "is-neutral";
}

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="internal-ai-mezzo-card__section">
      <button
        type="button"
        className="internal-ai-mezzo-card__section-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="internal-ai-mezzo-card__section-icon">{open ? "▼" : "▶"}</span>
        {title}
      </button>
      {open ? (
        <div className="internal-ai-mezzo-card__section-body">{children}</div>
      ) : null}
    </div>
  );
}

export default function InternalAiMezzoCard({ data }: { data: MezzoDossierCardData }) {
  const [showAllLavori, setShowAllLavori] = useState(false);
  const [showAllManutenzioni, setShowAllManutenzioni] = useState(false);
  const [showLavoriChiusi, setShowLavoriChiusi] = useState(false);

  const rev = revisioneBadge(data.dataScadenzaRevisioneTimestamp);
  const visibleLavori = showAllLavori
    ? data.lavoriAperti
    : data.lavoriAperti.slice(0, LAVORI_PREVIEW);
  const visibleManutenzioni = showAllManutenzioni
    ? data.manutenzioniD02
    : data.manutenzioniD02.slice(0, MANUTENZ_PREVIEW);

  return (
    <div className="internal-ai-mezzo-card">

      {/* Sezione 1 — Identità mezzo (sempre aperta) */}
      <div className="internal-ai-mezzo-card__identity">
        <div className="internal-ai-mezzo-card__identity-main">
          <div className="internal-ai-mezzo-card__identity-left">
            <div className="internal-ai-mezzo-card__targa">{data.targa}</div>
            <div className="internal-ai-mezzo-card__subtitle">
              {data.categoria}
              {data.marcaModello ? ` — ${data.marcaModello}` : ""}
            </div>
            <div className="internal-ai-pill-row" style={{ marginTop: 8 }}>
              {data.anno ? (
                <span className="internal-ai-pill is-neutral">Anno {data.anno}</span>
              ) : null}
              {data.tipo ? (
                <span className="internal-ai-pill is-neutral">{data.tipo}</span>
              ) : null}
            </div>
            {data.autistaNome ? (
              <div className="internal-ai-mezzo-card__autista">
                Autista: <strong>{data.autistaNome}</strong>
              </div>
            ) : null}
          </div>
          {data.fotoUrl ? (
            <img
              className="internal-ai-mezzo-card__foto"
              src={data.fotoUrl}
              alt={`Foto mezzo ${data.targa}`}
            />
          ) : null}
        </div>
      </div>

      {/* Sezione 2 — Scadenze e stato */}
      <CollapsibleSection title="Scadenze e stato">
        <div className="internal-ai-mezzo-card__field-row">
          <span className="internal-ai-mezzo-card__field-label">Revisione</span>
          <span className="internal-ai-mezzo-card__field-value">
            {data.dataScadenzaRevisione || "non disponibile"}
            <span className={`internal-ai-pill ${rev.cls}`}>{rev.label}</span>
          </span>
        </div>

        {data.manutenzioneProgrammata ? (
          <div className="internal-ai-mezzo-card__field-row">
            <span className="internal-ai-mezzo-card__field-label">Manutenzione progr.</span>
            <span className="internal-ai-mezzo-card__field-value">
              {data.manutenzioneDataFine || "data non disponibile"}
              {data.manutenzioneKmMax
                ? ` | Km max: ${data.manutenzioneKmMax}`
                : ""}
            </span>
          </div>
        ) : null}

        {data.alerts.length > 0 ? (
          <div className="internal-ai-mezzo-card__alert-list">
            <div className="internal-ai-mezzo-card__list-label">Alert D10</div>
            {data.alerts.map((alert) => (
              <div key={alert.id} className="internal-ai-mezzo-card__alert-row">
                <span className={`internal-ai-pill ${severityClass(alert.severity)}`}>
                  Alert
                </span>
                <span className="internal-ai-mezzo-card__alert-title">{alert.title}</span>
                {alert.detailText ? (
                  <span className="internal-ai-mezzo-card__alert-detail">
                    {alert.detailText}
                  </span>
                ) : null}
                {alert.dateLabel ? (
                  <span className="internal-ai-mezzo-card__alert-date">{alert.dateLabel}</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {data.focusItems.length > 0 ? (
          <div className="internal-ai-mezzo-card__alert-list">
            <div className="internal-ai-mezzo-card__list-label">Focus D10</div>
            {data.focusItems.map((focus) => (
              <div key={focus.id} className="internal-ai-mezzo-card__alert-row">
                <span className={`internal-ai-pill ${severityClass(focus.severity)}`}>
                  Focus
                </span>
                <span className="internal-ai-mezzo-card__alert-title">{focus.title}</span>
                {focus.detailText ? (
                  <span className="internal-ai-mezzo-card__alert-detail">
                    {focus.detailText}
                  </span>
                ) : null}
                {focus.dateLabel ? (
                  <span className="internal-ai-mezzo-card__alert-date">{focus.dateLabel}</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {data.alerts.length === 0 && data.focusItems.length === 0 ? (
          <div className="internal-ai-mezzo-card__empty-note">
            Nessun alert o focus D10 collegato in modo certo.
          </div>
        ) : null}
      </CollapsibleSection>

      {/* Sezione 3 — Lavori e manutenzioni D02 */}
      <CollapsibleSection title="Lavori e manutenzioni D02">
        <div className="internal-ai-mezzo-card__counters">
          {"Lavori aperti: "}
          <strong>{data.counts.lavoriAperti}</strong>
          {" | Lavori chiusi: "}
          <strong>{data.counts.lavoriChiusi}</strong>
          {" | Manutenzioni: "}
          <strong>{data.counts.manutenzioni}</strong>
        </div>

        {data.lavoriAperti.length > 0 ? (
          <div className="internal-ai-mezzo-card__sub-list">
            <div className="internal-ai-mezzo-card__list-label">Lavori aperti</div>
            {visibleLavori.map((lavoro) => {
              const badge = urgenzaBadge(lavoro.urgenza);
              return (
                <div key={lavoro.id} className="internal-ai-mezzo-card__lavoro-row">
                  <span className="internal-ai-mezzo-card__lavoro-desc">
                    {lavoro.descrizione || "Descrizione non disponibile"}
                  </span>
                  {badge ? (
                    <span className={`internal-ai-pill ${badge.cls}`}>{badge.label}</span>
                  ) : null}
                  {lavoro.dataInserimento ? (
                    <span className="internal-ai-mezzo-card__lavoro-date">
                      {lavoro.dataInserimento}
                    </span>
                  ) : null}
                </div>
              );
            })}
            {data.lavoriAperti.length > LAVORI_PREVIEW && !showAllLavori ? (
              <button
                type="button"
                className="internal-ai-mezzo-card__show-more"
                onClick={() => setShowAllLavori(true)}
              >
                Mostra tutti ({data.lavoriAperti.length})
              </button>
            ) : null}
          </div>
        ) : (
          <div className="internal-ai-mezzo-card__empty-note">
            Nessun lavoro aperto su D02.
          </div>
        )}

        {data.manutenzioniD02.length > 0 ? (
          <div className="internal-ai-mezzo-card__sub-list">
            <div className="internal-ai-mezzo-card__list-label">Manutenzioni D02</div>
            {visibleManutenzioni.map((m) => (
              <div key={m.id} className="internal-ai-mezzo-card__lavoro-row">
                <span className="internal-ai-mezzo-card__lavoro-desc">
                  {m.descrizione ?? m.tipo ?? "Tipo non disponibile"}
                </span>
                {m.data ? (
                  <span className="internal-ai-mezzo-card__lavoro-date">{m.data}</span>
                ) : null}
                {m.km !== null ? (
                  <span className="internal-ai-pill is-neutral">{m.km} km</span>
                ) : null}
              </div>
            ))}
            {data.manutenzioniD02.length > MANUTENZ_PREVIEW && !showAllManutenzioni ? (
              <button
                type="button"
                className="internal-ai-mezzo-card__show-more"
                onClick={() => setShowAllManutenzioni(true)}
              >
                Mostra tutte ({data.manutenzioniD02.length})
              </button>
            ) : null}
          </div>
        ) : (
          <div className="internal-ai-mezzo-card__empty-note">
            Nessuna manutenzione su D02.
          </div>
        )}

        {data.lavoriChiusi.length > 0 ? (
          <div className="internal-ai-mezzo-card__sub-list">
            <button
              type="button"
              className="internal-ai-mezzo-card__section-toggle internal-ai-mezzo-card__section-toggle--sub"
              onClick={() => setShowLavoriChiusi((v) => !v)}
            >
              <span className="internal-ai-mezzo-card__section-icon">
                {showLavoriChiusi ? "▼" : "▶"}
              </span>
              {`Lavori chiusi: ${data.counts.lavoriChiusi}`}
            </button>
            {showLavoriChiusi
              ? data.lavoriChiusi.map((lavoro) => {
                  const badge = urgenzaBadge(lavoro.urgenza);
                  return (
                    <div key={lavoro.id} className="internal-ai-mezzo-card__lavoro-row">
                      <span className="internal-ai-mezzo-card__lavoro-desc">
                        {lavoro.descrizione || "Descrizione non disponibile"}
                      </span>
                      {badge ? (
                        <span className={`internal-ai-pill ${badge.cls}`}>{badge.label}</span>
                      ) : null}
                      {lavoro.dataInserimento ? (
                        <span className="internal-ai-mezzo-card__lavoro-date">
                          {lavoro.dataInserimento}
                        </span>
                      ) : null}
                    </div>
                  );
                })
              : null}
          </div>
        ) : null}
      </CollapsibleSection>

      {/* Sezione 4 — Documenti e link */}
      <CollapsibleSection title="Documenti e link">
        {data.librettoUrl ? (
          <a
            href={data.librettoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="internal-ai-mezzo-card__doc-link"
          >
            Libretto mezzo →
          </a>
        ) : (
          <div className="internal-ai-mezzo-card__empty-note">
            Nessun documento collegato.
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
