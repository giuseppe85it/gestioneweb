import { useMemo } from "react";
import { Navigate, NavLink, useLocation } from "react-router-dom";
import "./next-home.css";
import { getNextRoleFromSearch } from "./nextAccess";
import { NEXT_AUTISTI_APP_PATH } from "./nextStructuralPaths";

type StatCard = {
  label: string;
  value: string;
  detail: string;
};

type StatusTone = "ok" | "warning" | "danger" | "idle" | "info";

type FleetRow = {
  code: string;
  detail: string;
  tone: StatusTone;
  badge: string;
};

type TaskRow = {
  title: string;
  detail: string;
  tone: StatusTone;
  badge: string;
};

const STAT_CARDS: StatCard[] = [
  { label: "Mezzi attivi", value: "12", detail: "su 15 totali" },
  { label: "Lavori aperti", value: "7", detail: "2 urgenti" },
  { label: "Ordini in attesa", value: "4", detail: "1 in arrivo oggi" },
  { label: "Segnalazioni", value: "3", detail: "da gestire" },
];

const MOTRICI_ROWS: FleetRow[] = [
  { code: "MO 123 AB", detail: "in servizio", tone: "ok", badge: "ok" },
  { code: "MO 456 CD", detail: "Perdita olio", tone: "danger", badge: "urgente" },
  { code: "MO 789 EF", detail: "in officina", tone: "idle", badge: "fermo" },
];

const RIMORCHI_ROWS: FleetRow[] = [
  { code: "RI 001 AA", detail: "agganciato a MO 123 AB", tone: "ok", badge: "ok" },
  { code: "RI 003 CC", detail: "non agganciato", tone: "danger", badge: "anomalia" },
  { code: "RI 005 EE", detail: "in officina", tone: "idle", badge: "fermo" },
];

const LAVORI_ROWS: TaskRow[] = [
  { title: "Perdita olio", detail: "MO 789", tone: "danger", badge: "urgente" },
  { title: "Fanale rotto", detail: "MO 321", tone: "warning", badge: "da fare" },
  { title: "Tagliando", detail: "RI 002 BB", tone: "idle", badge: "in attesa" },
];

const MAGAZZINO_ROWS: TaskRow[] = [
  { title: "Filtri olio", detail: "riordino consigliato", tone: "warning", badge: "riordinare" },
  { title: "Ordine #204", detail: "consegna prevista", tone: "info", badge: "oggi" },
  { title: "Pastiglie freno", detail: "scorta minima stabile", tone: "ok", badge: "disponibile" },
];

function formatCurrentDate(date: Date) {
  const weekday = new Intl.DateTimeFormat("it-IT", { weekday: "long" }).format(date);
  const day = new Intl.DateTimeFormat("it-IT", { day: "numeric" }).format(date);
  const month = new Intl.DateTimeFormat("it-IT", { month: "short" })
    .format(date)
    .replace(".", "");
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${day} ${month}`;
}

export default function NextHomePage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const currentDateLabel = useMemo(() => formatCurrentDate(new Date()), []);

  if (role === "autista") {
    return <Navigate replace to={`${NEXT_AUTISTI_APP_PATH}${location.search || ""}`} />;
  }

  return (
    <main className="next-home">
      <header className="next-home__topbar">
        <h1>Dashboard</h1>
        <div className="next-home__date">{currentDateLabel}</div>
      </header>

      <section className="next-home__alert-banner" aria-label="Avviso dashboard">
        <span className="next-home__alert-dot" aria-hidden="true" />
        <span>
          3 manutenzioni in scadenza questa settimana &middot; 1 rimorchio senza aggancio da 4h
        </span>
      </section>

      <section className="next-home__ai-card" aria-label="Pannello IA interna">
        <div className="next-home__ai-head">
          <div className="next-home__ai-title-wrap">
            <span className="next-home__ai-status-dot" aria-hidden="true" />
            <div className="next-home__ai-title">IA interna</div>
          </div>
          <div className="next-home__ai-status">online &middot; pronta</div>
        </div>

        <div className="next-home__chat">
          <div className="next-home__chat-bubble next-home__chat-bubble--assistant">
            Ciao, sono operativa. Dimmi cosa vuoi fare: apro moduli, incrocio dati, genero report.
          </div>
          <div className="next-home__chat-bubble next-home__chat-bubble--user">
            Mostrami i mezzi con scadenza assicurazione entro 30 giorni
          </div>
          <div className="next-home__chat-bubble next-home__chat-bubble--assistant">
            Trovati 2 mezzi: MO 456 CD (scadenza 18/04) e RI 001 AA (scadenza 28/04). Apro il
            dossier?
          </div>
        </div>

        <div className="next-home__ai-input-row">
          <input
            type="text"
            className="next-home__ai-input"
            placeholder="Scrivi un comando o una domanda..."
            aria-label="Comando IA interna"
          />
          <button type="button" className="next-home__ai-send" aria-label="Invia messaggio">
            <span aria-hidden="true">-&gt;</span>
          </button>
        </div>
      </section>

      <section className="next-home__stats-grid" aria-label="Statistiche dashboard">
        {STAT_CARDS.map((card) => (
          <article key={card.label} className="next-home__stat-card">
            <div className="next-home__stat-label">{card.label}</div>
            <div className="next-home__stat-value">{card.value}</div>
            <div className="next-home__stat-detail">{card.detail}</div>
          </article>
        ))}
      </section>

      <section className="next-home__widgets-grid" aria-label="Widget flotta">
        <article className="next-home__widget">
          <div className="next-home__widget-head">
            <h2>Motrici e trattori</h2>
            <NavLink to="/next/mezzi" className="next-home__widget-link">
              Vai -&gt;
            </NavLink>
          </div>
          <div className="next-home__widget-list">
            {MOTRICI_ROWS.map((row) => (
              <div key={row.code} className="next-home__fleet-row">
                <div className={`next-home__tone-dot next-home__tone-dot--${row.tone}`} />
                <div className="next-home__fleet-code">{row.code}</div>
                <div className="next-home__fleet-detail">{row.detail}</div>
                <div className={`next-home__badge next-home__badge--${row.tone}`}>{row.badge}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="next-home__widget">
          <div className="next-home__widget-head">
            <h2>Rimorchi</h2>
            <span className="next-home__widget-link next-home__widget-link--disabled">
              Vai -&gt;
            </span>
          </div>
          <div className="next-home__widget-list">
            {RIMORCHI_ROWS.map((row) => (
              <div key={row.code} className="next-home__fleet-row">
                <div className={`next-home__tone-dot next-home__tone-dot--${row.tone}`} />
                <div className="next-home__fleet-code">{row.code}</div>
                <div className="next-home__fleet-detail">{row.detail}</div>
                <div className={`next-home__badge next-home__badge--${row.tone}`}>{row.badge}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="next-home__widgets-grid" aria-label="Widget operativi">
        <article className="next-home__widget">
          <div className="next-home__widget-head">
            <h2>Lavori aperti</h2>
            <NavLink to="/next/lavori-da-eseguire" className="next-home__widget-link">
              Tutti -&gt;
            </NavLink>
          </div>
          <div className="next-home__widget-list next-home__widget-list--tasks">
            {LAVORI_ROWS.map((row) => (
              <div key={row.title} className="next-home__task-row">
                <div>
                  <div className="next-home__task-title">{row.title}</div>
                  <div className="next-home__task-detail">{row.detail}</div>
                </div>
                <div className={`next-home__badge next-home__badge--${row.tone}`}>{row.badge}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="next-home__widget">
          <div className="next-home__widget-head">
            <h2>Magazzino</h2>
            <NavLink to="/next/materiali-da-ordinare" className="next-home__widget-link">
              Vai -&gt;
            </NavLink>
          </div>
          <div className="next-home__widget-list next-home__widget-list--tasks">
            {MAGAZZINO_ROWS.map((row) => (
              <div key={row.title} className="next-home__task-row">
                <div>
                  <div className="next-home__task-title">{row.title}</div>
                  <div className="next-home__task-detail">{row.detail}</div>
                </div>
                <div className={`next-home__badge next-home__badge--${row.tone}`}>{row.badge}</div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
