import { Link, useLocation } from "react-router-dom";
import {
  NEXT_AREA_ACCESS,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
} from "./nextAccess";
import { NEXT_AREAS, type NextAreaTone } from "./nextData";

type NextGlobalPanel = {
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

const domainPanels: NextGlobalPanel[] = [
  {
    title: "Acquisti e Magazzino",
    description:
      "La shell globale deve tenere insieme fabbisogni, ordini, arrivi e attrezzature come sottosezioni coerenti, non come pagine scollegate.",
    items: [
      "fabbisogni materiali come funzione interna",
      "ordini, attese e arrivi come flusso unitario",
      "toolbar filtri e stato flusso sempre visibili",
    ],
    tone: "accent",
  },
  {
    title: "Inventario e movimenti materiali",
    description:
      "Stock, disponibilita e movimenti restano domini globali fino a quando non emerge una relazione forte con una targa o un intervento mezzo-centrico.",
    items: [
      "inventario come dominio condiviso",
      "consegne e movimenti letti come flusso globale",
      "ponte al Dossier solo quando il record diventa mezzo-correlato",
    ],
    tone: "success",
  },
  {
    title: "Documenti globali e amministrativi",
    description:
      "Preventivi, documenti magazzino e altra documentazione amministrativa non nascono sempre dal singolo mezzo e non vanno forzati nel Dossier.",
    items: [
      "documenti di acquisto e magazzino",
      "preventivi e allegati come parte del flusso globale",
      "PDF e IA contestuali, non centro della shell",
    ],
    tone: "warning",
  },
  {
    title: "Flussi che impattano il sistema",
    description:
      "Ordini, arrivi, stock, consegne e passaggi amministrativi impattano il sistema intero anche quando non partono da una targa specifica.",
    items: [
      "flussi globali con effetti su piu moduli",
      "workbench e stato flusso prima del dettaglio",
      "nessuna riduzione a dashboard numerica finta",
    ],
  },
];

const boundaryPanels: NextGlobalPanel[] = [
  {
    title: "Cosa resta globale",
    description:
      "Se il flusso governa stock, ordini, fabbisogni o documenti amministrativi, il suo centro di gravita resta qui.",
    items: [
      "fabbisogni, ordini, attese, arrivi e attrezzature",
      "inventario e stock condiviso",
      "documenti senza relazione mezzo forte",
    ],
    tone: "accent",
  },
  {
    title: "Cosa converge nel Dossier",
    description:
      "Quando un record assume una relazione forte con la targa o con un intervento mezzo-centrico, la lettura completa deve spostarsi nel Dossier.",
    items: [
      "materiali consegnati a una targa o a un lavoro",
      "documenti e costi realmente associati al mezzo",
      "passaggi che richiedono il contesto completo della targa",
    ],
    tone: "success",
  },
  {
    title: "IA futura su area globale",
    description:
      "Qui la IA potra aiutare dopo la v1 su documenti, preventivi, disponibilita, anomalie inventario e lettura dei flussi globali.",
    items: [
      "supporto contestuale, non launcher dominante",
      "lettura assistita di documenti e report globali",
      "separazione dalla v1 che parte da Centro e Dossier",
    ],
    tone: "warning",
  },
  {
    title: "Perche non e un miscuglio",
    description:
      "La macro-area governa domini globali precisi con sottosezioni e confini leggibili verso Dossier, Centro di Controllo e strumenti trasversali.",
    items: [
      "shell workflow globale come famiglia visiva",
      "sezioni coerenti invece di pagine isolate",
      "ponte al mezzo solo quando davvero necessario",
    ],
  },
];

function NextOperativitaGlobalePage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["operativita-globale"];
  const access = NEXT_AREA_ACCESS["operativita-globale"];
  const allowedRoleLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);
  const buildRolePath = (pathname: string) => buildNextPathWithRole(pathname, role, location.search);

  return (
    <section className="next-page next-operations-shell">
      <header className="next-page__hero">
        <div>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Prima struttura reale della macro-area globale oltre il placeholder generico.
            Qui `Operativita Globale` viene fissata come contenitore dei domini non
            mezzo-centrici: acquisti, magazzino, inventario, documenti amministrativi e
            flussi condivisi, sempre in modalita read-only.
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

      <nav className="next-section-tabs" aria-label="Sezioni Operativita Globale">
        <a className="next-section-tabs__link" href="#domini-globali">
          Domini globali
        </a>
        <a className="next-section-tabs__link" href="#confine-dossier">
          Confine con Dossier
        </a>
        <a className="next-section-tabs__link" href="#collegamenti-operativi">
          Collegamenti
        </a>
        <a className="next-section-tabs__link" href="#ia-evoluzione">
          IA futura
        </a>
      </nav>

      <section className="next-summary-grid next-summary-grid--wide">
        <article className="next-summary-card next-tone next-tone--accent">
          <p className="next-summary-card__label">Ruolo pagina</p>
          <strong className="next-summary-card__value">Contenitore globale</strong>
          <p className="next-summary-card__meta">
            Governa domini condivisi che non sono centrati sul singolo mezzo e non
            devono essere schiacciati dentro il Dossier.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--success">
          <p className="next-summary-card__label">Famiglia visiva</p>
          <strong className="next-summary-card__value">Workflow shell</strong>
          <p className="next-summary-card__meta">
            Ispirata a `Acquisti`: sottosezioni, stato flusso, filtri e tavoli di
            lavoro, non grandi card narrative.
          </p>
        </article>

        <article className="next-summary-card next-tone">
          <p className="next-summary-card__label">Ponte al dettaglio</p>
          <strong className="next-summary-card__value">Solo quando serve</strong>
          <p className="next-summary-card__meta">
            Il Dossier si apre quando emerge una relazione targa forte; qui resta il
            governo del flusso globale.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--warning">
          <p className="next-summary-card__label">Stato migrazione</p>
          <strong className="next-summary-card__value">UI strutturata</strong>
          <p className="next-summary-card__meta">
            Nessun reader runtime, nessuna logica `Acquisti` o `Inventario` importata,
            nessuna scrittura o dashboard finta.
          </p>
        </article>
      </section>

      <section id="domini-globali" className="next-global-layout">
        <article className="next-panel next-global-main next-tone">
          <div className="next-panel__header">
            <h2>Cosa rientra in Operativita Globale</h2>
          </div>
          <p className="next-panel__description">
            Questa macro-area tiene insieme i domini di sistema che hanno effetti
            operativi ampi ma non nascono dal singolo mezzo. Il focus e il flusso
            globale: approvvigionamento, stock, documenti amministrativi, consegne e
            workbench di gestione condivisi.
          </p>

          <div className="next-global-flow">
            <div className="next-global-flow__step">
              <strong>Fabbisogni</strong>
              <span>Domanda materiali e richieste operative da trasformare in ordine.</span>
            </div>
            <div className="next-global-flow__step">
              <strong>Ordini e arrivi</strong>
              <span>Stato ordini, attese, arrivi e documenti collegati al procurement.</span>
            </div>
            <div className="next-global-flow__step">
              <strong>Inventario e stock</strong>
              <span>Disponibilita, movimenti, giacenze e lettura operativa del magazzino.</span>
            </div>
            <div className="next-global-flow__step">
              <strong>Consegne / attrezzature</strong>
              <span>Passaggio dal dominio globale alla consegna o all'uso operativo.</span>
            </div>
          </div>
        </article>

        <div className="next-global-side">
          <article className="next-panel next-tone next-tone--success">
            <div className="next-panel__header">
              <h2>Read-only / shell / in costruzione</h2>
            </div>
            <p className="next-panel__description">
              La struttura e gia pronta, ma non legge ordini, stock o documenti reali.
              Serve a fissare i confini della macro-area prima di importare singole
              sottosezioni o viste read-only.
            </p>
          </article>

          <article className="next-panel next-tone next-tone--warning">
            <div className="next-panel__header">
              <h2>Cosa non stiamo facendo</h2>
            </div>
            <ul className="next-panel__list">
              <li>nessuna copia 1:1 di `Acquisti`, `Inventario` o `MaterialiDaOrdinare`</li>
              <li>nessuna tabella con numeri casuali o ordini finti</li>
              <li>nessuna lettura o scrittura dati</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="next-section-grid next-section-grid--wide">
        {domainPanels.map((panel) => (
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

      <section id="confine-dossier" className="next-global-layout">
        <article className="next-panel next-global-main next-tone next-tone--accent">
          <div className="next-panel__header">
            <h2>Confine chiaro tra globale e Dossier</h2>
          </div>
          <p className="next-panel__description">
            `Operativita Globale` non sostituisce il Dossier e non deve mangiarsi tutto
            cio che tocca una targa. Governa il dominio generale, mentre il Dossier
            prende in carico la lettura completa quando un record diventa davvero
            mezzo-centrico.
          </p>

          <div className="next-control-list">
            <div className="next-control-list__item">
              <strong>Resta qui</strong>
              <span>
                Fabbisogni, ordini, stock, inventario, documenti amministrativi e
                processi che governano il sistema intero o una risorsa condivisa.
              </span>
            </div>
            <div className="next-control-list__item">
              <strong>Va al Dossier</strong>
              <span>
                Materiali consegnati a una targa, costi associati al mezzo, documenti
                mezzo-correlati e passaggi che richiedono il contesto completo della targa.
              </span>
            </div>
            <div className="next-control-list__item">
              <strong>Ponte obbligatorio</strong>
              <span>
                Quando il record e targa-correlato il link al Dossier deve esserci, ma
                non deve dominare le viste globali o snaturare la shell workflow.
              </span>
            </div>
          </div>
        </article>

        <div className="next-global-side">
          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Sottosezioni previste</h2>
            </div>
            <div className="next-global-pillbar" aria-label="Sottosezioni previste">
              <span className="next-chip next-chip--accent">Fabbisogni</span>
              <span className="next-chip">Ordini</span>
              <span className="next-chip next-chip--success">Inventario</span>
              <span className="next-chip">Consegne</span>
              <span className="next-chip next-chip--warning">Documenti</span>
              <span className="next-chip">Attrezzature</span>
            </div>
            <p className="next-panel__description">
              Il linguaggio corretto e quello di una shell globale a sottosezioni,
              coerente con `Acquisti & Magazzino`, non una collezione di pagine isolate.
            </p>
          </article>
        </div>
      </section>

      <section id="collegamenti-operativi" className="next-global-layout">
        <article className="next-panel next-global-main next-tone next-tone--success">
          <div className="next-panel__header">
            <h2>Dialogo con le altre macro-aree</h2>
          </div>
          <p className="next-panel__description">
            La macro-area globale riceve priorita dal `Centro di Controllo`, apre il
            `Dossier` quando emerge una targa forte e in futuro potra essere assistita
            dalla `IA Gestionale` su documenti, fabbisogni e anomalie di flusso.
          </p>

          <div className="next-control-list">
            <div className="next-control-list__item">
              <strong>Con Centro di Controllo</strong>
              <span>
                Il cockpit segnala priorita e code; `Operativita Globale` governa il
                workbench e il flusso completo del dominio condiviso.
              </span>
            </div>
            <div className="next-control-list__item">
              <strong>Con Mezzi / Dossier</strong>
              <span>
                Il Dossier entra solo quando c'e relazione mezzo forte. Qui resta il
                governo del processo globale e dei suoi stati.
              </span>
            </div>
            <div className="next-control-list__item">
              <strong>Con IA Gestionale futura</strong>
              <span>
                L'assistenza qui non parte in v1 come superficie primaria, ma potra
                arrivare per leggere documenti, preventivi, disponibilita e anomalie.
              </span>
            </div>
          </div>
        </article>

        <div className="next-global-side">
          <article className="next-panel next-tone">
            <div className="next-panel__header">
              <h2>Destinazioni previste</h2>
            </div>
            <p className="next-panel__description">
              Questi collegamenti simulano la grammatica corretta tra le macro-aree
              NEXT mantenendo il ruolo selezionato nella shell.
            </p>
            <div className="next-access-page__actions next-cockpit-links">
              <Link className="next-action-link next-action-link--primary" to={buildRolePath("/next/centro-controllo")}>
                Apri Centro di Controllo
              </Link>
              <Link className="next-action-link" to={buildRolePath("/next/mezzi-dossier")}>
                Vai a Mezzi / Dossier
              </Link>
              <Link className="next-action-link" to={buildRolePath("/next/ia-gestionale")}>
                Apri IA Gestionale
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section id="ia-evoluzione" className="next-section-grid next-section-grid--wide">
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
            Permission key: <code>{access.permissionKey}</code>. La macro-area e gia
            pronta per un futuro scope per modulo/azione, senza confondere il gating
            frontend con autorizzazione reale.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Perche questa pagina e utile davvero</h3>
          <p>
            Fissa una mappa chiara dei domini globali della NEXT: cosa resta qui, cosa
            passa al Dossier e dove si inseriscono documenti, inventario e acquisti.
          </p>
        </article>
        <article className="next-inline-panel">
          <h3>Prossimo step coerente</h3>
          <p>
            Importare una prima sottosezione read-only davvero utile, ad esempio una
            shell `Acquisti & Magazzino` o un blocco inventario, senza writer reali.
          </p>
        </article>
      </section>
    </section>
  );
}

export default NextOperativitaGlobalePage;
