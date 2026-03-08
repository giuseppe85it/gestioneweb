import { Link, useLocation } from "react-router-dom";
import {
  NEXT_AREA_ACCESS,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
} from "./nextAccess";
import { NEXT_AREAS, type NextAreaTone } from "./nextData";

type NextControlPanel = {
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

const priorityPanels: NextControlPanel[] = [
  {
    title: "Priorita operative oggi",
    description:
      "La fascia alta del Centro di Controllo deve mostrare cosa richiede presa in carico immediata, senza costringere a visitare piu moduli prima di capire la giornata.",
    items: [
      "mezzi che richiedono attenzione o follow-up",
      "code operative che non possono aspettare",
      "punti caldi che devono aprire un dettaglio o un Dossier",
    ],
    tone: "accent",
  },
  {
    title: "Alert e anomalie",
    description:
      "Qui convergono segnali da moduli diversi: eventi autisti, stati anomali, dati mancanti e criticita che devono emergere con contesto minimo e destinazione chiara.",
    items: [
      "eventi autisti o rettifiche da presidiare",
      "documenti, dati o passaggi da verificare",
      "warning che non devono restare dispersi nei moduli sorgente",
    ],
    tone: "warning",
  },
  {
    title: "Scadenze ed elementi da attenzionare",
    description:
      "Le scadenze non sostituiscono i moduli di dettaglio: il Centro di Controllo le mette in evidenza e le instrada verso il punto giusto della piattaforma.",
    items: [
      "scadenze mezzo-centriche che aprono il Dossier",
      "attivita globali che aprono workflow o code operative",
      "promemoria e reminder da presidiare senza rumore inutile",
    ],
    tone: "success",
  },
  {
    title: "Accessi rapidi e report sintetici",
    description:
      "La pagina deve offrire scorciatoie e letture veloci, ma senza trasformarsi in un contenitore di tabelle casuali o widget storici secondari.",
    items: [
      "launcher verso macro-aree e record critici",
      "report sintetici e tabelle secondarie",
      "export contestuali, non pulsanti dominanti di pagina",
    ],
  },
];

const convergencePanels: NextControlPanel[] = [
  {
    title: "Verso Mezzi / Dossier",
    description:
      "Ogni alert o record targa-correlato deve offrire un ponte diretto al Dossier. Il cockpit governa la priorita, il Dossier governa il contesto completo del mezzo.",
    items: [
      "drill-down diretto al Dossier Mezzo",
      "scadenze e anomalie mezzo-centriche",
      "lettura rapida prima della vista detail-first",
    ],
    tone: "accent",
  },
  {
    title: "Verso Operativita Globale",
    description:
      "Le code e i backlog restano nei moduli operativi. Il Centro di Controllo li sintetizza, li ordina per priorita e li collega al workflow corretto.",
    items: [
      "code aperte e task da presidiare",
      "backlog e monitor operativi globali",
      "nessuna sostituzione dei workflow completi",
    ],
    tone: "success",
  },
  {
    title: "Spazio per IA Gestionale futura",
    description:
      "Questa e una delle due superfici ufficiali della IA Business v1. Qui la IA dovra riassumere stato sistema, priorita e anomalie con risposta spiegabile e read-only.",
    items: [
      "suggerimenti motivati e non opachi",
      "fonte dati, modulo sorgente e periodo visibili",
      "marcatura DA VERIFICARE quando l'affidabilita non e piena",
    ],
    tone: "warning",
  },
  {
    title: "Relazione con strumenti trasversali",
    description:
      "PDF standard, ricerca globale, supporto tecnico e governance restano capability trasversali. Il Centro di Controllo li usa come strumenti contestuali, non come fine della pagina.",
    items: [
      "ricerca globale pronta per targa, badge e id forti",
      "PDF contestuali dentro widget o report",
      "supporti tecnici fuori dal nucleo operativo del cockpit",
    ],
  },
];

function NextCentroControlloPage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["centro-controllo"];
  const access = NEXT_AREA_ACCESS["centro-controllo"];
  const allowedRoleLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);
  const buildRolePath = (pathname: string) => buildNextPathWithRole(pathname, role, location.search);

  return (
    <section className="next-page next-control-center-shell">
      <header className="next-page__hero">
        <div>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Prima struttura reale del cockpit NEXT oltre il placeholder generico.
            Questa pagina fissa il Centro di Controllo come cabina di regia del
            sistema: visione globale, priorita, alert, scadenze, convergenza dei
            flussi e ponte forte verso Dossier, Operativita e IA futura, sempre in
            modalita read-only.
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
          <span className="next-chip next-chip--warning">Nessun dataset collegato</span>
        </div>
      </header>

      <nav className="next-section-tabs" aria-label="Sezioni Centro di Controllo">
        <a className="next-section-tabs__link" href="#visione-sistema">
          Visione sistema
        </a>
        <a className="next-section-tabs__link" href="#priorita-operativa">
          Priorita e alert
        </a>
        <a className="next-section-tabs__link" href="#collegamenti-macroaree">
          Collegamenti
        </a>
        <a className="next-section-tabs__link" href="#ia-futura">
          IA futura
        </a>
      </nav>

      <section className="next-summary-grid next-summary-grid--wide">
        <article className="next-summary-card next-tone next-tone--accent">
          <p className="next-summary-card__label">Ruolo pagina</p>
          <strong className="next-summary-card__value">Cabina di regia</strong>
          <p className="next-summary-card__meta">
            Non e una home generica: governa priorita, code, alert e destinazioni
            operative del giorno.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--success">
          <p className="next-summary-card__label">Cosa aggrega</p>
          <strong className="next-summary-card__value">Segnali trasversali</strong>
          <p className="next-summary-card__meta">
            Priorita, scadenze, anomalie, code operative e accessi rapidi ai punti
            critici del sistema.
          </p>
        </article>

        <article className="next-summary-card next-tone">
          <p className="next-summary-card__label">Ponte al dettaglio</p>
          <strong className="next-summary-card__value">Drill-down controllato</strong>
          <p className="next-summary-card__meta">
            I record targa-correlati devono aprire il Dossier; i workflow completi
            restano dentro le aree modulo.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--warning">
          <p className="next-summary-card__label">Stato migrazione</p>
          <strong className="next-summary-card__value">UI strutturata</strong>
          <p className="next-summary-card__meta">
            Layout reale della macro-area senza numeri finti, senza letture dati e
            senza clonare `Home` o `CentroControllo` legacy.
          </p>
        </article>
      </section>

      <section id="visione-sistema" className="next-cockpit-layout">
        <article className="next-panel next-cockpit-main next-tone">
          <div className="next-panel__header">
            <h2>Visione generale del sistema</h2>
          </div>
          <p className="next-panel__description">
            Il Centro di Controllo legge il sistema dall&apos;alto: mostra cosa richiede
            attenzione subito, cosa deve essere preso in carico oggi e quale macro-area
            o Dossier aprire per scendere nel dettaglio corretto.
          </p>

          <div className="next-control-list">
            <div className="next-control-list__item">
              <strong>Cosa si vede qui</strong>
              <span>
                Sintesi stato sistema, priorita operative, alert critici, scadenze e
                accessi rapidi ai punti che meritano drill-down immediato.
              </span>
            </div>
            <div className="next-control-list__item">
              <strong>Cosa resta nei moduli</strong>
              <span>
                Il dettaglio completo di lavori, ordini, materiali, documenti,
                rettifiche e workflow non si sposta qui: resta nelle macro-aree che lo
                governano davvero.
              </span>
            </div>
            <div className="next-control-list__item">
              <strong>Cosa viene aggregato qui</strong>
              <span>
                Segnali provenienti da piu flussi: eventi autisti, scadenze mezzo,
                anomalie, code operative, report sintetici e ingressi rapidi ai record
                targa-correlati.
              </span>
            </div>
            <div className="next-control-list__item">
              <strong>Perche non e una home generica</strong>
              <span>
                La pagina ha una gerarchia precisa: prima stato e priorita, poi code e
                scorciatoie, infine report secondari. Non e un collage di widget o un
                contenitore di numeri casuali.
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
              La grammatica visiva e gia pronta, ma nessun alert, filtro o scadenza
              legge dataset runtime. Questa pagina fissa struttura e priorita, non
              implementa ancora il cockpit operativo vero.
            </p>
          </article>

          <article className="next-panel next-tone next-tone--warning">
            <div className="next-panel__header">
              <h2>Cosa non stiamo facendo</h2>
            </div>
            <ul className="next-panel__list">
              <li>nessuna copia 1:1 di `Home` o `CentroControllo` legacy</li>
              <li>nessun numero inventato per simulare KPI reali</li>
              <li>nessuna lettura o scrittura dati</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="priorita-operativa" className="next-section-grid next-section-grid--wide">
        {priorityPanels.map((panel) => (
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

      <section id="collegamenti-macroaree" className="next-cockpit-layout">
        <article className="next-panel next-cockpit-main next-tone next-tone--accent">
          <div className="next-panel__header">
            <h2>Collegamenti chiari verso Dossier e macro-aree</h2>
          </div>
          <p className="next-panel__description">
            Il Centro di Controllo non trattiene l&apos;utente dentro se stesso. Deve
            capire dove portarlo: al Dossier quando il record e mezzo-centrico, ai
            workflow quando il problema e globale, alla futura IA quando serve lettura
            assistita e agli strumenti trasversali quando conta la governance.
          </p>

          <div className="next-control-list">
            <div className="next-control-list__item">
              <strong>Record targa-correlati</strong>
              <span>
                Aprono `Mezzi / Dossier`, perche il Centro di Controllo segnala il
                problema ma non sostituisce il contesto completo del mezzo.
              </span>
            </div>
            <div className="next-control-list__item">
              <strong>Code e workflow</strong>
              <span>
                Aprono `Operativita Globale`, che resta il contenitore corretto per
                backlog, task, presa in carico e avanzamento.
              </span>
            </div>
            <div className="next-control-list__item">
              <strong>Lettura assistita</strong>
              <span>
                La futura `IA Gestionale` non parte come launcher dominante: qui entra
                come supporto contestuale a sintesi, anomalie e priorita spiegabili.
              </span>
            </div>
            <div className="next-control-list__item">
              <strong>Supporti tecnici</strong>
              <span>
                Ricerca globale, PDF standard e governo visibilita restano capability
                trasversali e non devono occupare il centro della scena operativa.
              </span>
            </div>
          </div>
        </article>

        <div className="next-cockpit-side">
          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Destinazioni previste</h2>
            </div>
            <p className="next-panel__description">
              Questi collegamenti simulano la grammatica corretta della cabina di
              regia, mantenendo il ruolo selezionato nella shell NEXT.
            </p>
            <div className="next-access-page__actions next-cockpit-links">
              <Link className="next-action-link next-action-link--primary" to={buildRolePath("/next/mezzi-dossier")}>
                Apri Mezzi / Dossier
              </Link>
              <Link className="next-action-link" to={buildRolePath("/next/operativita-globale")}>
                Vai a Operativita
              </Link>
              <Link className="next-action-link" to={buildRolePath("/next/ia-gestionale")}>
                Apri IA Gestionale
              </Link>
            </div>
          </article>

          <article className="next-panel next-tone next-tone--warning">
            <div className="next-panel__header">
              <h2>Export e ricerca</h2>
            </div>
            <p className="next-panel__description">
              PDF standard ed export vivranno dentro singoli blocchi o report. La
              ricerca globale resta in header come capability pronta, non come mega
              pannello che ruba spazio alle priorita del giorno.
            </p>
          </article>
        </div>
      </section>

      <section id="ia-futura" className="next-section-grid next-section-grid--wide">
        {convergencePanels.map((panel) => (
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
            pronta per visibilita differenziata per ruolo, ma senza confondere il
            gating frontend con auth o sicurezza reale.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Perche questa pagina e utile davvero</h3>
          <p>
            Fissa la grammatica del cockpit prima dei dati reali: cosa si aggrega qui,
            cosa resta nei moduli, dove si apre il Dossier e dove trovera spazio la IA
            Business v1.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Prossimo step coerente</h3>
          <p>
            Introdurre i primi segnali reali read-only del cockpit senza inventare KPI:
            alert, priorita o scadenze canoniche che abbiano gia una destinazione chiara
            verso Dossier o macro-area corretta.
          </p>
        </article>
      </section>
    </section>
  );
}

export default NextCentroControlloPage;
