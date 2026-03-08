import { Link, useLocation } from "react-router-dom";
import {
  NEXT_AREA_ACCESS,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
} from "./nextAccess";
import { NEXT_AREAS, type NextAreaTone } from "./nextData";

type NextIAPanel = {
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

const perimeterPanels: NextIAPanel[] = [
  {
    title: "Superficie iniziale: Dossier Mezzo",
    description:
      "Il Dossier e il punto piu naturale per una lettura assistita del mezzo: contesto forte, convergenza dei flussi e bisogno reale di sintesi operativa.",
    items: [
      "riassunto stato mezzo e blocchi da attenzionare",
      "anomalia o scadenza collegata al contesto targa",
      "suggerimenti motivati senza cambiare dati o workflow",
    ],
    tone: "success",
  },
  {
    title: "Superficie iniziale: Centro di Controllo",
    description:
      "Il cockpit e la seconda superficie ufficiale della v1 perche aggrega priorita, alert, code e segnali globali prima dell'apertura del dettaglio.",
    items: [
      "riassunto stato sistema",
      "priorita operative e alert",
      "instradamento chiaro verso Dossier o moduli futuri",
    ],
    tone: "accent",
  },
  {
    title: "Output attesi in v1",
    description:
      "La IA Business non produce azioni automatiche: restituisce letture utili, spiegate e verificabili da chi opera nel gestionale.",
    items: [
      "riassunti leggibili",
      "scadenze e anomalie",
      "priorita e suggerimenti motivati",
    ],
  },
  {
    title: "Perche non partire da documenti o PDF",
    description:
      "Documenti, report assistiti e output intelligenti restano estensioni successive: oggi i flussi piu affidabili per partire bene sono Dossier e Centro di Controllo.",
    items: [
      "prima servono superfici stabili e leggibili",
      "evitare una chat onnisciente non governata",
      "ridurre rischio su flussi ancora non canonici",
    ],
    tone: "warning",
  },
];

const futurePanels: NextIAPanel[] = [
  {
    title: "Documenti",
    description:
      "Estensione futura per leggere, confrontare e sintetizzare documenti operativi o amministrativi senza mescolare subito tutto nella v1.",
    items: [
      "supporto contestuale ai documenti del mezzo",
      "lettura assistita di documenti globali",
      "nessuna promessa di copertura completa oggi",
    ],
    tone: "accent",
  },
  {
    title: "PDF intelligenti / report assistiti",
    description:
      "Diversi dai PDF standard tecnici: qui rientrano report assistiti, sintesi intelligenti e output costruiti sopra letture motivate dei dati.",
    items: [
      "report assistiti da Dossier e Centro",
      "output leggibili e spiegabili",
      "separazione netta dai PDF tecnici trasversali",
    ],
    tone: "success",
  },
  {
    title: "Acquisti / inventario",
    description:
      "Potranno entrare dopo la v1 per leggere fabbisogni, ordini, stock e anomalie di flusso, ma solo quando il dominio globale sara piu consolidato.",
    items: [
      "supporto ai domini globali",
      "anomalie stock o passaggi critici",
      "nessuna automazione correttiva",
    ],
    tone: "warning",
  },
  {
    title: "Supporto piu ampio ai moduli",
    description:
      "L'area e pensata per crescere come capability trasversale della NEXT, non come singola pagina di chat isolata.",
    items: [
      "rollout progressivo e controllato",
      "integrazione per superfici, non big bang",
      "sempre separata dalla capability di audit tecnico",
    ],
  },
];

function NextIAGestionalePage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["ia-gestionale"];
  const access = NEXT_AREA_ACCESS["ia-gestionale"];
  const allowedRoleLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);
  const buildRolePath = (pathname: string) => buildNextPathWithRole(pathname, role, location.search);

  return (
    <section className="next-page next-ia-shell">
      <header className="next-page__hero">
        <div>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Prima struttura reale della macro-area oltre il placeholder generico. Questa
            pagina rende visibile la futura `IA Gestionale` come assistente business
            read-only della NEXT: utile per leggere meglio il sistema, non per scrivere,
            correggere o agire al posto dell'utente.
          </p>
        </div>

        <div className="next-page__meta">
          <span className="next-chip next-chip--warning">IMPORTATO SOLO UI</span>
          {allowedRoleLabels.map((scope) => (
            <span key={scope} className="next-chip">
              {scope}
            </span>
          ))}
          <span className="next-chip next-chip--subtle">
            Ruolo simulato: {NEXT_ROLE_PRESETS[role].shortLabel}
          </span>
          <span className="next-chip next-chip--accent">Nessuna IA runtime collegata</span>
        </div>
      </header>

      <nav className="next-section-tabs" aria-label="Sezioni IA Gestionale">
        <a className="next-section-tabs__link" href="#missione-ia">
          Missione
        </a>
        <a className="next-section-tabs__link" href="#perimetro-v1">
          Perimetro v1
        </a>
        <a className="next-section-tabs__link" href="#spiegabilita">
          Spiegabilita
        </a>
        <a className="next-section-tabs__link" href="#evoluzione-futura">
          Evoluzione futura
        </a>
      </nav>

      <section className="next-summary-grid next-summary-grid--wide">
        <article className="next-summary-card next-tone next-tone--accent">
          <p className="next-summary-card__label">Missione</p>
          <strong className="next-summary-card__value">Assistente business</strong>
          <p className="next-summary-card__meta">
            Legge segnali e li restituisce in forma utile, motivata e verificabile
            dentro la NEXT.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--warning">
          <p className="next-summary-card__label">Perimetro v1</p>
          <strong className="next-summary-card__value">Read-only</strong>
          <p className="next-summary-card__meta">
            Nessuna scrittura, nessuna correzione dati, nessuna patch, nessun backend o
            modello collegato in questa fase.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--success">
          <p className="next-summary-card__label">Superfici iniziali</p>
          <strong className="next-summary-card__value">Dossier + Centro</strong>
          <p className="next-summary-card__meta">
            Le prime due superfici sensate per partire bene senza allargare troppo il
            dominio della v1.
          </p>
        </article>

        <article className="next-summary-card next-tone">
          <p className="next-summary-card__label">Governance</p>
          <strong className="next-summary-card__value">Segnala e motiva</strong>
          <p className="next-summary-card__meta">
            La IA aiuta a leggere e interpretare. La decisione resta all'utente e la
            capability di audit tecnico resta separata.
          </p>
        </article>
      </section>

      <section id="missione-ia" className="next-cockpit-layout">
        <article className="next-panel next-cockpit-main next-tone">
          <div className="next-panel__header">
            <h2>Cosa fa davvero questa macro-area</h2>
          </div>
          <p className="next-panel__description">
            `IA Gestionale` non nasce come chat onnisciente. Nasce come assistente
            operativo della NEXT, capace di leggere il contesto e restituire sintesi,
            priorita e punti da attenzionare nei punti giusti della piattaforma.
          </p>

          <div className="next-control-list">
            <div className="next-control-list__item">
              <strong>Legge il contesto</strong>
              <span>Dossier o Centro di Controllo come superfici iniziali della v1.</span>
            </div>
            <div className="next-control-list__item">
              <strong>Sintetizza</strong>
              <span>Riassunti chiari, priorita, scadenze e anomalie rilevanti.</span>
            </div>
            <div className="next-control-list__item">
              <strong>Motiva</strong>
              <span>Ogni output deve spiegare da dove arriva e con quale affidabilita.</span>
            </div>
            <div className="next-control-list__item">
              <strong>Instrada</strong>
              <span>
                Aiuta ad aprire il dettaglio giusto, senza sostituire il Dossier o i
                moduli business.
              </span>
            </div>
          </div>
        </article>

        <div className="next-cockpit-side">
          <article className="next-panel next-tone next-tone--success">
            <div className="next-panel__header">
              <h2>Read-only / shell / in costruzione</h2>
            </div>
            <p className="next-panel__description">
              La struttura e pronta, ma qui non gira ancora nessuna IA reale. La pagina
              serve a fissare ruolo, confini e ordine di crescita prima di collegare
              qualsiasi dato o capability runtime.
            </p>
          </article>

          <article className="next-panel next-tone next-tone--warning">
            <div className="next-panel__header">
              <h2>Cosa non fa ancora</h2>
            </div>
            <ul className="next-panel__list">
              <li>non legge Firestore, Storage o documenti reali</li>
              <li>non genera conversazioni o risposte finte</li>
              <li>non scrive, corregge o patcha dati e moduli</li>
              <li>non sostituisce la futura capability di audit tecnico</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="perimetro-v1" className="next-section-grid next-section-grid--wide">
        {perimeterPanels.map((panel) => (
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

      <section className="next-cockpit-layout">
        <article className="next-panel next-cockpit-main next-tone next-tone--accent">
          <div className="next-panel__header">
            <h2>Percorso iniziale dentro la NEXT</h2>
          </div>
          <p className="next-panel__description">
            La v1 parte da due superfici ad alto valore e piu controllabili. Qui la IA
            spiega meglio il sistema; non allarga subito il raggio a tutti i moduli o a
            flussi ancora ambigui.
          </p>

          <div className="next-access-page__actions next-cockpit-links">
            <Link
              className="next-action-link next-action-link--primary"
              to={buildRolePath("/next/mezzi-dossier")}
            >
              Vai a Mezzi / Dossier
            </Link>
            <Link className="next-action-link" to={buildRolePath("/next/centro-controllo")}>
              Apri Centro di Controllo
            </Link>
            <Link className="next-action-link" to={buildRolePath("/next/operativita-globale")}>
              Vedi Operativita Globale
            </Link>
          </div>
        </article>

        <div className="next-cockpit-side">
          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Perche non e una home generica</h2>
            </div>
            <p className="next-panel__description">
              Questa pagina non e un contenitore vuoto di slogan. Fissa i criteri con
              cui la IA potra crescere nella NEXT senza trasformarsi in una funzione
              opaca o ingestibile.
            </p>
          </article>
        </div>
      </section>

      <section id="spiegabilita" className="next-cockpit-layout">
        <article className="next-panel next-cockpit-main next-tone next-tone--success">
          <div className="next-panel__header">
            <h2>Spiegabilita obbligatoria della risposta</h2>
          </div>
          <p className="next-panel__description">
            Ogni output della futura IA Business v1 deve essere leggibile e controllabile
            da chi usa il gestionale. Senza spiegabilita, l'assistenza non e utile.
          </p>

          <div className="next-control-list">
            <div className="next-control-list__item">
              <strong>Fonte dati</strong>
              <span>Da quale dataset o blocco informativo nasce la lettura.</span>
            </div>
            <div className="next-control-list__item">
              <strong>Modulo sorgente</strong>
              <span>Se il segnale arriva da Dossier, Centro di Controllo o altro modulo futuro.</span>
            </div>
            <div className="next-control-list__item">
              <strong>Periodo letto</strong>
              <span>Finestra temporale della sintesi, per non confondere vecchio e nuovo.</span>
            </div>
            <div className="next-control-list__item">
              <strong>Marcatura DA VERIFICARE</strong>
              <span>
                Obbligatoria quando il legame tra i dati non e pienamente affidabile o il
                flusso non e ancora canonico.
              </span>
            </div>
          </div>
        </article>

        <div className="next-cockpit-side">
          <article className="next-panel next-tone next-tone--warning">
            <div className="next-panel__header">
              <h2>Separazione da IA Audit Tecnico</h2>
            </div>
            <p className="next-panel__description">
              Leggere repo, confrontare docs/moduli/dati e segnalare incoerenze
              architetturali e una capability diversa. Utile, ma non dentro la stessa UX
              runtime dell'assistente business.
            </p>
          </article>

          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Non fare subito</h2>
            </div>
            <ul className="next-panel__list">
              <li>nessuna chat onnisciente su tutto il gestionale</li>
              <li>nessun audit repo/docs nella stessa runtime utente</li>
              <li>nessuna scrittura automatica o correzione dati</li>
              <li>nessun supporto dichiarato come completo su flussi non canonici</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="evoluzione-futura" className="next-section-grid next-section-grid--wide">
        {futurePanels.map((panel) => (
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
            Permission key: <code>{access.permissionKey}</code>. La macro-area e gia
            pronta per futuri scope dedicati, senza confondere il gating frontend con
            autorizzazione reale o sicurezza backend.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Perche questa pagina e utile davvero</h3>
          <p>
            Blocca una deriva frequente: trattare l'IA come chat generica o promessa
            vaga. Qui il perimetro e leggibile, governato e coerente con la roadmap NEXT.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Prossimo step coerente</h3>
          <p>
            Portare in una fase successiva un primo innesto read-only contestuale dentro
            `Dossier` o `Centro di Controllo`, senza attivare ancora modelli, writer o
            documenti runtime.
          </p>
        </article>
      </section>
    </section>
  );
}

export default NextIAGestionalePage;
