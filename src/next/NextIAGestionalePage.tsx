import { Link, useLocation } from "react-router-dom";
import { buildNextPathWithRole, getNextRoleFromSearch } from "./nextAccess";
import { NEXT_AREAS } from "./nextData";

const questionGroups = [
  {
    title: "Priorita della giornata",
    description: "Domande utili per partire dal Centro di Controllo.",
    items: [
      "Quali mezzi richiedono attenzione oggi?",
      "Quali revisioni sono piu urgenti?",
      "Da dove conviene iniziare il lavoro di oggi?",
    ],
  },
  {
    title: "Dossier Mezzo",
    description: "Richieste contestuali per entrare nel mezzo giusto.",
    items: [
      "Riassumi lo stato del mezzo AB123CD",
      "Mostrami gli ultimi rifornimenti e manutenzioni",
      "Quali documenti devo controllare per questo mezzo?",
    ],
  },
  {
    title: "Operativita Globale",
    description: "Domande rapide sugli ordini e sulle code operative.",
    items: [
      "Quali ordini sono ancora in attesa?",
      "Dove ci sono arrivi parziali da completare?",
      "Quali fornitori hanno pratiche ancora aperte?",
    ],
  },
];

function NextIAGestionalePage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["ia-gestionale"];
  const buildRolePath = (pathname: string) => buildNextPathWithRole(pathname, role, location.search);

  return (
    <section className="next-page next-ia-shell">
      <header className="next-page__hero">
        <div className="next-page__hero-copy">
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Punto di ingresso per domande, sintesi e collegamenti ai record utili. Qui conta capire
            cosa chiedere, da dove partire e quale pagina aprire dopo.
          </p>
        </div>

        <div className="next-page__hero-actions">
          <div className="next-access-page__actions">
            <Link
              className="next-action-link next-action-link--primary"
              to={buildRolePath("/next/centro-controllo")}
            >
              Apri Home NEXT
            </Link>
            <Link className="next-action-link" to={buildRolePath("/next/mezzi-dossier")}>
              Apri Dossier
            </Link>
          </div>
        </div>
      </header>

      <section className="next-home-ia-band next-tone next-tone--accent">
        <div className="next-home-ia-band__main">
          <p className="next-summary-card__label">Ingresso rapido</p>
          <h2>Inizia con una domanda semplice e contestuale</h2>
          <p className="next-panel__description">
            Parti dal Centro di Controllo per le priorita del giorno o dal Dossier per il singolo
            mezzo. L'obiettivo e arrivare subito al record corretto.
          </p>

          <label className="next-data-search">
            <span className="next-search__label">Chiedi all'assistente</span>
            <input
              type="text"
              readOnly
              value=""
              placeholder="Es. Riassumi le priorita di oggi o apri il Dossier di AB123CD"
              aria-label="Campo richiesta assistente"
            />
          </label>
        </div>

        <div className="next-home-ia-band__side">
          <div className="next-control-list">
            <div className="next-control-list__item next-control-list__item--soft">
              <strong>1. Scegli il contesto</strong>
              <span>Centro per la giornata, Dossier per il singolo mezzo.</span>
            </div>
            <div className="next-control-list__item next-control-list__item--soft">
              <strong>2. Fai la domanda</strong>
              <span>Chiedi priorita, riepiloghi o verifiche mirate.</span>
            </div>
            <div className="next-control-list__item next-control-list__item--soft">
              <strong>3. Apri il record</strong>
              <span>Usa i collegamenti suggeriti per entrare nella pagina giusta.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="next-summary-grid next-summary-grid--compact">
        <article className="next-summary-card next-tone next-tone--accent">
          <p className="next-summary-card__label">Parti dal Centro</p>
          <strong className="next-summary-card__value">Priorita del giorno</strong>
          <p className="next-summary-card__meta">
            Per alert, scadenze e primi record da aprire.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--success">
          <p className="next-summary-card__label">Parti dal Dossier</p>
          <strong className="next-summary-card__value">Contesto mezzo</strong>
          <p className="next-summary-card__meta">
            Per capire stato, storico e documenti del mezzo.
          </p>
        </article>

        <article className="next-summary-card next-tone">
          <p className="next-summary-card__label">Esito atteso</p>
          <strong className="next-summary-card__value">Sintesi + link</strong>
          <p className="next-summary-card__meta">
            Una risposta utile deve dirti cosa guardare e dove andare.
          </p>
        </article>
      </section>

      <section className="next-cockpit-layout">
        <article className="next-panel next-cockpit-main next-tone next-tone--accent">
          <div className="next-panel__header">
            <h2>Cosa puoi chiedere</h2>
          </div>
          <p className="next-panel__description">
            Usa richieste corte e orientate al lavoro. Da qui l'assistente deve portarti alla
            risposta utile e al record giusto.
          </p>

          <div className="next-control-list">
            {questionGroups.map((entry) => (
              <div key={entry.title} className="next-control-list__item">
                <strong>{entry.title}</strong>
                <span>{entry.description}</span>
                <span>{entry.items.join(" | ")}</span>
              </div>
            ))}
          </div>
        </article>

        <div className="next-cockpit-side">
          <article className="next-panel next-tone next-tone--success">
            <div className="next-panel__header">
              <h2>Azioni rapide</h2>
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
              <Link
                className="next-action-link"
                to={buildRolePath("/next/operativita-globale")}
              >
                Operativita
              </Link>
            </div>
          </article>

          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Che risposta aspettarti</h2>
            </div>
            <ul className="next-panel__list">
              <li>sintesi breve del contesto</li>
              <li>record o pagina da aprire subito</li>
              <li>elementi da verificare prima di decidere</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="next-inline-grid">
        <article className="next-inline-panel">
          <h3>Quando partire dal Centro</h3>
          <p>
            Se devi capire cosa conta oggi, quali alert aprire e quali mezzi richiedono attenzione.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Quando partire dal Dossier</h3>
          <p>
            Se la tua domanda riguarda un mezzo preciso, il suo storico o i documenti collegati.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Quando usare Operativita</h3>
          <p>
            Se stai seguendo ordini, fornitori e avanzamento di pratiche condivise.
          </p>
        </article>
      </section>
    </section>
  );
}

export default NextIAGestionalePage;
