import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { buildNextPathWithRole, getNextRoleFromSearch } from "./nextAccess";
import { NEXT_AREAS } from "./nextData";
import { readNextUsageSummary, type NextUsageSummary } from "./nextUsageTracking";

const servicePortfolio = [
  {
    title: "PDF standard",
    description: "Anteprime ed export condivisi, senza aprire moduli dedicati.",
  },
  {
    title: "Percorsi rapidi",
    description: "Collegamenti chiari verso Centro di Controllo, Dossier e Operativita.",
  },
  {
    title: "Tracking locale NEXT",
    description: "Lettura prudente di aree aperte, transizioni frequenti e ultimi passaggi.",
  },
];

function formatUsageDate(value: number): string {
  return new Date(value).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NextStrumentiTrasversaliPage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["strumenti-trasversali"];
  const buildRolePath = (pathname: string) => buildNextPathWithRole(pathname, role, location.search);
  const [usageSummary, setUsageSummary] = useState<NextUsageSummary>(() => readNextUsageSummary());

  useEffect(() => {
    setUsageSummary(readNextUsageSummary());
  }, [location.key]);

  return (
    <section className="next-page next-tools-shell">
      <header className="next-page__hero">
        <div className="next-page__hero-copy">
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Servizi comuni della piattaforma: utili quando servono, senza togliere spazio alle
            aree operative.
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
          <p className="next-summary-card__label">Aree tracciate</p>
          <strong className="next-summary-card__value">{usageSummary.trackedAreas.length}</strong>
          <p className="next-summary-card__meta">
            Macro-aree NEXT gia visitate in questa macchina.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--accent">
          <p className="next-summary-card__label">Passaggi registrati</p>
          <strong className="next-summary-card__value">{usageSummary.totalVisits}</strong>
          <p className="next-summary-card__meta">
            Navigazioni lette solo dentro la NEXT, senza impatto sui dati business.
          </p>
        </article>
      </section>

      <section className="next-global-layout">
        <article className="next-panel next-global-main next-tone next-tone--accent">
          <div className="next-panel__header">
            <h2>Servizi condivisi</h2>
          </div>
          <p className="next-panel__description">
            Qui trovi solo strumenti che aiutano piu aree della piattaforma, senza occupare la
            scena delle pagine operative.
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
          <article className="next-panel next-tone next-tone--accent">
            <div className="next-panel__header">
              <h2>Uso recente della NEXT</h2>
            </div>
            <p className="next-panel__description">
              Tracciamento locale e leggero: aree aperte, moduli piu usati e passaggi piu
              frequenti.
            </p>
            {usageSummary.recentVisits.length === 0 ? (
              <div className="next-data-state">
                <strong>Nessun percorso registrato</strong>
                <span>Apri le aree operative della NEXT per iniziare a leggere i flussi reali.</span>
              </div>
            ) : (
              <div className="next-control-list">
                {usageSummary.recentVisits.slice(0, 4).map((entry) => (
                  <div key={`${entry.pathKey}:${entry.ts}`} className="next-control-list__item next-control-list__item--soft">
                    <strong>{entry.pageLabel}</strong>
                    <span>
                      {entry.areaLabel} | {formatUsageDate(entry.ts)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Aree piu aperte</h2>
            </div>
            {usageSummary.trackedAreas.length === 0 ? (
              <div className="next-data-state">
                <strong>Nessun dato ancora disponibile</strong>
                <span>Il riepilogo si popola dopo le prime navigazioni nella NEXT.</span>
              </div>
            ) : (
              <div className="next-control-list">
                {usageSummary.trackedAreas.slice(0, 4).map((entry) => (
                  <div key={entry.areaId} className="next-control-list__item next-control-list__item--soft">
                    <strong>{entry.areaLabel}</strong>
                    <span>{entry.count} aperture registrate</span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Percorsi piu usati</h2>
            </div>
            {usageSummary.topTransitions.length === 0 ? (
              <div className="next-data-state">
                <strong>Nessuna transizione letta</strong>
                <span>Il pannello si riempie quando inizi a passare tra le aree della NEXT.</span>
              </div>
            ) : (
              <div className="next-control-list">
                {usageSummary.topTransitions.slice(0, 4).map((entry) => (
                  <div key={`${entry.fromPathKey}:${entry.toPathKey}`} className="next-control-list__item next-control-list__item--soft">
                    <strong>
                      {entry.fromPathLabel} {"->"} {entry.toPathLabel}
                    </strong>
                    <span>{entry.count} passaggi registrati</span>
                  </div>
                ))}
              </div>
            )}
          </article>

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
