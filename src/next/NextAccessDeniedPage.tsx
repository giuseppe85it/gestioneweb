import { Link, useLocation } from "react-router-dom";
import {
  NEXT_AREA_ACCESS,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleLandingPath,
  type NextRole,
} from "./nextAccess";
import { NEXT_AREAS, type NextAreaId } from "./nextData";

type NextAccessDeniedPageProps = {
  areaId: NextAreaId;
  role: NextRole;
};

function NextAccessDeniedPage({ areaId, role }: NextAccessDeniedPageProps) {
  const location = useLocation();
  const area = NEXT_AREAS[areaId];
  const access = NEXT_AREA_ACCESS[areaId];
  const rolePreset = NEXT_ROLE_PRESETS[role];
  const allowedLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);
  const fallbackPath = buildNextPathWithRole(
    getNextRoleLandingPath(role),
    role,
    location.search,
  );

  return (
    <section className="next-page next-access-page">
      <header className="next-page__hero">
        <div>
          <p className="next-page__eyebrow">Accesso non consentito</p>
          <h1>{area.navLabel}</h1>
          <p className="next-page__description">
            Il ruolo simulato <strong>{rolePreset.label}</strong> non puo entrare in
            questa macro-area della shell NEXT. Il blocco e intenzionale e serve a
            fissare subito la differenza tra visibilita amministrativa e accesso
            operativo limitato.
          </p>
        </div>

        <div className="next-page__meta">
          <span className="next-chip next-chip--warning">Route bloccata lato frontend</span>
          <span className="next-chip">Ruolo simulato: {rolePreset.shortLabel}</span>
          <span className="next-chip next-chip--subtle">Nessuna auth reale</span>
        </div>
      </header>

      <section className="next-inline-grid">
        <article className="next-inline-panel">
          <h3>Ruoli ammessi oggi</h3>
          <p>{allowedLabels.join(" - ")}</p>
        </article>

        <article className="next-inline-panel">
          <h3>Scope futuro</h3>
          <p>{access.futureScope}</p>
        </article>
      </section>

      <section className="next-access-callout">
        <h3>Perche questo blocco esiste gia nella shell</h3>
        <p>
          La NEXT deve crescere con una visibilita coerente per ruolo, senza
          affidarsi a una sola UI uguale per tutti. Questo gating e solo tecnico e
          non sostituisce i futuri controlli reali lato autenticazione o backend.
        </p>
      </section>

      <div className="next-access-page__actions">
        <Link className="next-action-link next-action-link--primary" to={fallbackPath}>
          Torna alla tua area consentita
        </Link>
      </div>
    </section>
  );
}

export default NextAccessDeniedPage;
