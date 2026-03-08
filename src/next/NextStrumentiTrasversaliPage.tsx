import { Link, useLocation } from "react-router-dom";
import {
  NEXT_AREA_ACCESS,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
} from "./nextAccess";
import { NEXT_AREAS, type NextAreaTone } from "./nextData";

type NextToolPanel = {
  title: string;
  description: string;
  items: string[];
  tone?: NextAreaTone;
};

const toneClassName = (tone?: NextAreaTone) => {
  switch (tone) {
    case "accent":
      return "next-tone next-tone--accent";
    case "warning":
      return "next-tone next-tone--warning";
    case "success":
      return "next-tone next-tone--success";
    default:
      return "next-tone";
  }
};

const toolPanels: NextToolPanel[] = [
  {
    title: "PDF standard / export tecnici",
    description:
      "Qui vive il tooling PDF comune della piattaforma: export, preview e comportamenti tecnici coerenti, non i report assistiti dell'IA.",
    items: [
      "motore PDF trasversale e naming comune",
      "preview e export tecnici condivisi",
      "separazione dai PDF intelligenti o report assistiti",
    ],
    tone: "accent",
  },
  {
    title: "Utility comuni",
    description:
      "Rientrano in questa macro-area i pezzi di supporto che non sono moduli business autonomi ma servono a piu aree della NEXT.",
    items: [
      "ricerca globale e accessi rapidi",
      "notifiche, supporto e strumenti di servizio",
      "componenti canonici riusabili da piu pagine",
    ],
    tone: "success",
  },
  {
    title: "Servizi condivisi di supporto",
    description:
      "La shell prepara il posto corretto per servizi comuni di governance o supporto tecnico senza sporcare le aree business.",
    items: [
      "visibilita moduli e scope futuri",
      "strumenti di sistema e configurazioni",
      "supporto tecnico e capability non mezzo-centriche",
    ],
  },
  {
    title: "Riuso cross-area",
    description:
      "Questi strumenti devono poter essere richiamati da cockpit, dossier e workflow globali senza duplicare logiche o inventare pagine parallele.",
    items: [
      "invocazione dai moduli, non protagonismo autonomo",
      "regole comuni per output e utility",
      "grammatica condivisa della shell NEXT",
    ],
    tone: "warning",
  },
];

const boundaryPanels: NextToolPanel[] = [
  {
    title: "Cosa vive qui",
    description:
      "Vivono qui i servizi condivisi della piattaforma che servono a piu moduli ma non coincidono con un dominio business o con la IA runtime.",
    items: [
      "PDF standard e export tecnici",
      "utility comuni di ricerca e supporto",
      "strumenti di governance e servizi riusabili",
    ],
    tone: "accent",
  },
  {
    title: "Cosa resta nei moduli",
    description:
      "Se una funzione appartiene davvero al contesto operativo del modulo, deve restare dentro la sua area e richiamare qui solo il servizio necessario.",
    items: [
      "il Dossier resta proprietario del contesto mezzo",
      "il Centro governa priorita e alert",
      "Operativita Globale governa i workflow condivisi",
    ],
    tone: "success",
  },
  {
    title: "Cosa resta nell'IA",
    description:
      "L'IA conserva sintesi, suggerimenti motivati, report assistiti e letture contestuali. `Strumenti Trasversali` non deve assorbirne il ruolo.",
    items: [
      "no IA business qui dentro",
      "no chat o audit tecnico runtime",
      "PDF intelligenti fuori dal tooling tecnico",
    ],
    tone: "warning",
  },
  {
    title: "Perche non e una pagina tecnica vuota",
    description:
      "Serve a fissare il posto corretto delle utility condivise e a evitare che finiscano distribuite in modo incoerente tra tutte le macro-aree.",
    items: [
      "shell leggibile anche senza servizi reali attivi",
      "confine netto tra strumenti e moduli",
      "base per future integrazioni controllate",
    ],
  },
];

function NextStrumentiTrasversaliPage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["strumenti-trasversali"];
  const access = NEXT_AREA_ACCESS["strumenti-trasversali"];
  const allowedRoleLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);
  const buildRolePath = (pathname: string) => buildNextPathWithRole(pathname, role, location.search);

  return (
    <section className="next-page next-tools-shell">
      <header className="next-page__hero">
        <div>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Prima struttura reale della macro-area oltre il placeholder generico. Questa
            pagina chiarisce il ruolo di `Strumenti Trasversali` come contenitore dei
            servizi e delle utility comuni della piattaforma, distinto dalla `IA
            Gestionale` e separato dai moduli business.
          </p>
        </div>

        <div className="next-page__meta">
          <span className="next-chip next-chip--accent">IMPORTATO SOLO UI</span>
          {allowedRoleLabels.map((scope) => (
            <span key={scope} className="next-chip">
              {scope}
            </span>
          ))}
          <span className="next-chip next-chip--subtle">
            Ruolo simulato: {NEXT_ROLE_PRESETS[role].shortLabel}
          </span>
          <span className="next-chip next-chip--warning">Nessun servizio reale collegato</span>
        </div>
      </header>

      <nav className="next-section-tabs" aria-label="Sezioni Strumenti Trasversali">
        <a className="next-section-tabs__link" href="#servizi-condivisi">
          Servizi condivisi
        </a>
        <a className="next-section-tabs__link" href="#distinzione-ia">
          Distinzione con IA
        </a>
        <a className="next-section-tabs__link" href="#richiami-cross-area">
          Richiami cross-area
        </a>
        <a className="next-section-tabs__link" href="#confini-area">
          Confini area
        </a>
      </nav>

      <section className="next-summary-grid next-summary-grid--wide">
        <article className="next-summary-card next-tone next-tone--accent">
          <p className="next-summary-card__label">Ruolo area</p>
          <strong className="next-summary-card__value">Servizi condivisi</strong>
          <p className="next-summary-card__meta">
            Utility e capability comuni richiamabili da piu macro-aree senza diventare
            un modulo business autonomo.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--success">
          <p className="next-summary-card__label">PDF standard</p>
          <strong className="next-summary-card__value">Tooling tecnico</strong>
          <p className="next-summary-card__meta">
            Preview ed export comuni stanno qui; i PDF intelligenti restano nel
            perimetro dell'IA Gestionale.
          </p>
        </article>

        <article className="next-summary-card next-tone">
          <p className="next-summary-card__label">Uso cross-area</p>
          <strong className="next-summary-card__value">Dossier + Centro + Operativita</strong>
          <p className="next-summary-card__meta">
            Gli strumenti nascono qui ma vengono richiamati dalle aree operative senza
            snaturarne il contesto.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--warning">
          <p className="next-summary-card__label">Stato migrazione</p>
          <strong className="next-summary-card__value">UI strutturata</strong>
          <p className="next-summary-card__meta">
            Nessun servizio reale, nessun export vivo, nessuna ricerca runtime e nessun
            mock tecnico ingannevole.
          </p>
        </article>
      </section>

      <section id="servizi-condivisi" className="next-global-layout">
        <article className="next-panel next-global-main next-tone">
          <div className="next-panel__header">
            <h2>Cosa contiene davvero questa macro-area</h2>
          </div>
          <p className="next-panel__description">
            `Strumenti Trasversali` contiene i servizi comuni della piattaforma: utility,
            export, supporto e capability tecniche riusabili da piu aree. Non governa
            il processo business del singolo modulo e non sostituisce l'assistenza
            contestuale dell'IA.
          </p>

          <div className="next-global-flow">
            <div className="next-global-flow__step">
              <strong>PDF standard</strong>
              <span>Export, preview e comportamento tecnico comune tra aree.</span>
            </div>
            <div className="next-global-flow__step">
              <strong>Utility comuni</strong>
              <span>Ricerca, supporto, accessi rapidi e strumenti condivisi.</span>
            </div>
            <div className="next-global-flow__step">
              <strong>Servizi di supporto</strong>
              <span>Elementi trasversali richiamabili da cockpit, dossier e workflow.</span>
            </div>
            <div className="next-global-flow__step">
              <strong>Governance tecnica</strong>
              <span>Perimetro chiaro per scope futuri e funzioni di sistema.</span>
            </div>
          </div>
        </article>

        <div className="next-global-side">
          <article className="next-panel next-tone next-tone--success">
            <div className="next-panel__header">
              <h2>Read-only / shell / in costruzione</h2>
            </div>
            <p className="next-panel__description">
              La shell e pronta ma non attiva servizi runtime. Serve a fissare il posto
              corretto di PDF standard, utility e supporto condiviso prima di collegare
              tool reali.
            </p>
          </article>

          <article className="next-panel next-tone next-tone--warning">
            <div className="next-panel__header">
              <h2>Cosa non stiamo facendo</h2>
            </div>
            <ul className="next-panel__list">
              <li>nessun clone di tool o pagine legacy</li>
              <li>nessun export o supporto realmente collegato</li>
              <li>nessuna ricerca globale runtime</li>
              <li>nessun mock tecnico che sembri gia operativo</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="next-section-grid next-section-grid--wide">
        {toolPanels.map((panel) => (
          <article key={panel.title} className={`next-panel ${toneClassName(panel.tone)}`}>
            <div className="next-panel__header">
              <h2>{panel.title}</h2>
            </div>
            <p className="next-panel__description">{panel.description}</p>
            <ul className="next-panel__list">
              {panel.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section id="distinzione-ia" className="next-global-layout">
        <article className="next-panel next-global-main next-tone next-tone--accent">
          <div className="next-panel__header">
            <h2>Distinzione chiara rispetto a IA Gestionale</h2>
          </div>
          <p className="next-panel__description">
            Questa macro-area governa strumenti tecnici e servizi riusabili. L'`IA
            Gestionale` governa invece sintesi, suggerimenti motivati, spiegabilita e
            output assistiti. Mescolare i due piani renderebbe la shell ambigua.
          </p>

          <div className="next-control-list">
            <div className="next-control-list__item">
              <strong>Qui</strong>
              <span>PDF standard, utility comuni, servizi condivisi e supporto tecnico.</span>
            </div>
            <div className="next-control-list__item">
              <strong>Nell'IA</strong>
              <span>Riassunti, anomalie, priorita, spiegabilita e report assistiti.</span>
            </div>
            <div className="next-control-list__item">
              <strong>Nei moduli</strong>
              <span>
                Contesto business, workflow e decisione operativa: Dossier, Centro e
                Operativita restano i proprietari del processo.
              </span>
            </div>
          </div>
        </article>

        <div className="next-global-side">
          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Regola di composizione</h2>
            </div>
            <p className="next-panel__description">
              Gli strumenti non devono divorare il modulo. Devono essere richiamati dal
              modulo quando servono, restando servizi comuni della piattaforma.
            </p>
          </article>
        </div>
      </section>

      <section id="richiami-cross-area" className="next-global-layout">
        <article className="next-panel next-global-main next-tone next-tone--success">
          <div className="next-panel__header">
            <h2>Come verranno richiamati dalle altre macro-aree</h2>
          </div>
          <p className="next-panel__description">
            `Strumenti Trasversali` non vive isolata. Prepara i servizi che verranno
            richiamati da `Dossier`, `Centro di Controllo` e `Operativita Globale` senza
            replicare gli stessi pezzi in piu punti della NEXT.
          </p>

          <div className="next-control-list">
            <div className="next-control-list__item">
              <strong>Da Mezzi / Dossier</strong>
              <span>PDF standard, utility di supporto e servizi comuni legati al contesto mezzo.</span>
            </div>
            <div className="next-control-list__item">
              <strong>Da Centro di Controllo</strong>
              <span>Ricerca globale, export tecnici e capability di supporto alla regia del sistema.</span>
            </div>
            <div className="next-control-list__item">
              <strong>Da Operativita Globale</strong>
              <span>Tool comuni per workflow, documenti tecnici e servizi riusabili di processo.</span>
            </div>
          </div>
        </article>

        <div className="next-global-side">
          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Destinazioni simulate</h2>
            </div>
            <p className="next-panel__description">
              Questi collegamenti mantengono il ruolo attivo e mostrano come i servizi
              comuni dialogheranno con le aree business della NEXT.
            </p>
            <div className="next-access-page__actions next-cockpit-links">
              <Link className="next-action-link next-action-link--primary" to={buildRolePath("/next/centro-controllo")}>
                Apri Centro di Controllo
              </Link>
              <Link className="next-action-link" to={buildRolePath("/next/mezzi-dossier")}>
                Vai a Mezzi / Dossier
              </Link>
              <Link className="next-action-link" to={buildRolePath("/next/operativita-globale")}>
                Apri Operativita Globale
              </Link>
              <Link className="next-action-link" to={buildRolePath("/next/ia-gestionale")}>
                Vedi IA Gestionale
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section id="confini-area" className="next-section-grid next-section-grid--wide">
        {boundaryPanels.map((panel) => (
          <article key={panel.title} className={`next-panel ${toneClassName(panel.tone)}`}>
            <div className="next-panel__header">
              <h2>{panel.title}</h2>
            </div>
            <p className="next-panel__description">{panel.description}</p>
            <ul className="next-panel__list">
              {panel.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="next-inline-grid">
        <article className="next-inline-panel">
          <h3>Visibilita e accesso</h3>
          <p>
            Permission key: <code>{access.permissionKey}</code>. La macro-area resta
            amministrativa e pronta a scope futuri senza confondere il gating frontend
            con un'autorizzazione reale server-side.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Perche questa pagina e utile davvero</h3>
          <p>
            Evita che PDF standard, utility e servizi condivisi finiscano sparsi in modo
            incoerente dentro tutte le aree della NEXT o confusi con la IA.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Prossimo step coerente</h3>
          <p>
            Importare in una fase successiva il primo servizio tecnico comune davvero
            utile, ad esempio la grammatica PDF standard o una shell di ricerca globale,
            sempre senza writer reali.
          </p>
        </article>
      </section>
    </section>
  );
}

export default NextStrumentiTrasversaliPage;
