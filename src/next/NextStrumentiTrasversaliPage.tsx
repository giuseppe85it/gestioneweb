import { Link, useLocation } from "react-router-dom";
import { buildNextPathWithRole, getNextRoleFromSearch } from "./nextAccess";
import { NEXT_AREAS } from "./nextData";

const servicePortfolio = [
  {
    title: "PDF standard",
    description: "Anteprime ed export condivisi, senza aprire moduli dedicati.",
  },
  {
    title: "Percorsi rapidi",
    description: "Collegamenti chiari verso Home, Dossier e area operativa.",
  },
  {
    title: "Supporto accessi",
    description: "Vista di servizio per entrare nelle aree corrette senza rumore operativo.",
  },
];

function NextStrumentiTrasversaliPage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["strumenti-trasversali"];
  const buildRolePath = (pathname: string) => buildNextPathWithRole(pathname, role, location.search);

  return (
    <section className="next-page next-tools-shell">
      <header className="next-page__hero">
        <div className="next-page__hero-copy">
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Servizi comuni della piattaforma: utili quando ti servono, secondari rispetto al lavoro
            quotidiano nelle aree operative.
          </p>
        </div>

        <div className="next-page__hero-actions">
          <div className="next-access-page__actions">
            <Link
              className="next-action-link next-action-link--primary"
              to={buildRolePath("/next/centro-controllo")}
            >
              Torna alla Home
            </Link>
            <Link className="next-action-link" to={buildRolePath("/next/operativita-globale")}>
              Vai a Operativita
            </Link>
          </div>
        </div>
      </header>

      <section className="next-summary-grid next-summary-grid--compact">
        <article className="next-summary-card next-tone next-tone--success">
          <p className="next-summary-card__label">PDF standard</p>
          <strong className="next-summary-card__value">Anteprime ed export</strong>
          <p className="next-summary-card__meta">
            Documenti tecnici condivisi e pronti da richiamare quando servono.
          </p>
        </article>

        <article className="next-summary-card next-tone">
          <p className="next-summary-card__label">Percorsi rapidi</p>
          <strong className="next-summary-card__value">Accesso pulito</strong>
          <p className="next-summary-card__meta">
            Collegamenti coerenti verso le aree che contano davvero.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--accent">
          <p className="next-summary-card__label">Supporto accessi</p>
          <strong className="next-summary-card__value">Ingresso guidato</strong>
          <p className="next-summary-card__meta">
            Pagina di servizio, non area operativa da presidiare ogni giorno.
          </p>
        </article>
      </section>

      <section className="next-global-layout">
        <article className="next-panel next-global-main next-tone next-tone--accent">
          <div className="next-panel__header">
            <h2>Servizi condivisi</h2>
          </div>
          <p className="next-panel__description">
            Qui raccogli solo cio che aiuta piu aree della piattaforma, senza occupare la scena
            delle pagine operative.
          </p>

          <div className="next-status-board">
            {servicePortfolio.map((item) => (
              <div key={item.title} className="next-order-card">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        </article>

        <div className="next-global-side">
          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Da qui puoi</h2>
            </div>
            <div className="next-access-page__actions">
              <Link
                className="next-action-link next-action-link--primary"
                to={buildRolePath("/next/centro-controllo")}
              >
                Centro di Controllo
              </Link>
              <Link className="next-action-link" to={buildRolePath("/next/mezzi-dossier")}>
                Mezzi / Dossier
              </Link>
              <Link className="next-action-link" to={buildRolePath("/next/ia-gestionale")}>
                IA Gestionale
              </Link>
            </div>
          </article>
        </div>
      </section>
    </section>
  );
}

export default NextStrumentiTrasversaliPage;
