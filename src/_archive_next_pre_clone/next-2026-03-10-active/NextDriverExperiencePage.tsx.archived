import { Link, useLocation } from "react-router-dom";
import {
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
  getNextRoleLandingPath,
} from "./nextAccess";

function NextDriverExperiencePage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const rolePreset = NEXT_ROLE_PRESETS[role];
  const fallbackPath = buildNextPathWithRole(
    getNextRoleLandingPath(role === "autista" ? "admin" : role),
    role === "autista" ? "admin" : role,
    location.search,
  );

  return (
    <section className="next-page next-driver-page">
      <header className="next-page__hero">
        <div>
          <p className="next-page__eyebrow">Esperienza separata</p>
          <h1>Area Autista non inglobata nella shell gestionale</h1>
          <p className="next-page__description">
            Questa vista tecnica serve a rendere esplicito un vincolo architetturale:
            l&apos;autista non entra nella NEXT amministrativa come utente ridotto, ma
            mantiene una esperienza dedicata e separata dal backoffice.
          </p>
        </div>

        <div className="next-page__meta">
          <span className="next-chip next-chip--accent">Ruolo simulato: {rolePreset.shortLabel}</span>
          <span className="next-chip next-chip--warning">Percorso tecnico, non auth reale</span>
          <span className="next-chip next-chip--subtle">Legacy autisti invariata</span>
        </div>
      </header>

      <section className="next-driver-grid">
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Cosa significa oggi</h2>
          </div>
          <p className="next-panel__description">
            Il ruolo autista non vede le 5 macro-aree della shell gestionale NEXT. La
            simulazione corrente lo porta qui per evitare ambiguita sul perimetro.
          </p>
        </article>

        <article className="next-panel next-tone--accent">
          <div className="next-panel__header">
            <h2>Dove continuera a vivere</h2>
          </div>
          <p className="next-panel__description">
            L&apos;esperienza autisti reale resta sulle route dedicate legacy
            <code> /autisti/* </code> finche non verra progettata una migrazione
            specifica e autonoma.
          </p>
        </article>

        <article className="next-panel next-tone--warning">
          <div className="next-panel__header">
            <h2>Struttura pronta per il futuro</h2>
          </div>
          <p className="next-panel__description">
            La shell NEXT ora distingue gia ruoli, visibilita e accesso. In seguito la
            simulazione potra essere sostituita da una vera matrice permessi per
            utenza senza dover rifare la navigazione da zero.
          </p>
        </article>
      </section>

      <section className="next-access-callout">
        <h3>Perimetro del task</h3>
        <p>
          Questa non e una nuova app autisti. E solo una prova di architettura
          frontend che separa chiaramente area gestionale e area autisti, senza
          toccare autenticazione reale, backend o flussi legacy.
        </p>
      </section>

      <div className="next-access-page__actions">
        <Link className="next-action-link" to={fallbackPath}>
          Apri una vista gestionale simulata
        </Link>
      </div>
    </section>
  );
}

export default NextDriverExperiencePage;
