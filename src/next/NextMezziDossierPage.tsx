import { useLocation } from "react-router-dom";
import { NEXT_AREA_ACCESS, NEXT_ROLE_PRESETS, getNextRoleFromSearch } from "./nextAccess";
import { NEXT_AREAS, type NextAreaTone } from "./nextData";

type NextStructuredPanel = {
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

const convergencePanels: NextStructuredPanel[] = [
  {
    title: "Lavori e manutenzioni",
    description:
      "Tutto cio che nasce come intervento sulla targa deve poter essere letto nel Dossier senza trasformare l'area Mezzi in una coda operativa.",
    items: [
      "Backlog lavori e stato interventi",
      "Manutenzioni e note tecniche rilevanti",
      "Ponte a materiali consegnati quando il record e mezzo-correlato",
    ],
    tone: "accent",
  },
  {
    title: "Rifornimenti e scadenze",
    description:
      "I flussi che cambiano lo stato quotidiano del mezzo devono emergere nel contesto dossier, non restare dispersi tra feed temporanei e viste globali.",
    items: [
      "Storico rifornimenti sintetico",
      "Reminder e anomalie mezzo-centriche",
      "Banda stato/scadenze nella parte alta del Dossier",
    ],
    tone: "success",
  },
  {
    title: "Documenti, costi e IA",
    description:
      "Documenti mezzo, costi associati e supporto IA v1 sono parte del cuore decisionale della targa, non un sotto-modulo separato.",
    items: [
      "Documenti e libretti collegati al mezzo",
      "Costi e analisi economica come estensione del Dossier",
      "PDF e IA contestuali, non dominanti sull'elenco mezzi",
    ],
    tone: "warning",
  },
  {
    title: "Eventi autisti e viste 360",
    description:
      "Gli eventi di campo devono poter finire nel contesto mezzo quando hanno legame forte con la targa, pur restando governati da flussi separati lato autisti/admin.",
    items: [
      "Controlli, segnalazioni e rifornimenti con targa",
      "Ponte a Mezzo360/Autista360 quando serve",
      "Separazione chiara tra feed globale e lettura contestuale nel Dossier",
    ],
  },
];

const futureModulePanels: NextStructuredPanel[] = [
  {
    title: "Ingresso Flotta",
    description:
      "Elenco mezzi, filtri per stato/categoria/targa e overview flotta. Serve a trovare il mezzo giusto, non a raccontare gia tutta la sua storia.",
    items: [
      "Filtro targa come primo accesso",
      "Stati sintetici e KPI flotta",
      "CTA primaria sempre orientata a `Apri Dossier`",
    ],
    tone: "accent",
  },
  {
    title: "Dossier Mezzo",
    description:
      "Header mezzo forte, overview, scadenze, pannelli lavori/documenti/costi e timeline contestuale. Questa resta la vista detail-first di riferimento.",
    items: [
      "Header mezzo + badge stato",
      "Overview prima del dettaglio storico",
      "Azioni contestuali per PDF e IA",
    ],
    tone: "success",
  },
  {
    title: "Analisi e costo per targa",
    description:
      "Analisi economica, costi e riepiloghi non vivono come pagina isolata della flotta: estendono la lettura del Dossier.",
    items: [
      "KPI e anomalie economiche",
      "Confronti periodo e trend",
      "Export PDF e report contestuali",
    ],
  },
  {
    title: "Supporti trasversali",
    description:
      "Questa macro-area deve dialogare con IA, PDF standard e ricerca globale, ma senza trasformarsi in un contenitore indistinto di strumenti.",
    items: [
      "IA v1 nel Dossier come assistenza read-only",
      "PDF standard disponibili come azioni contestuali",
      "Ricerca globale targa -> ingresso diretto al Dossier",
    ],
    tone: "warning",
  },
];

function NextMezziDossierPage() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["mezzi-dossier"];
  const access = NEXT_AREA_ACCESS["mezzi-dossier"];
  const allowedRoleLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);

  return (
    <section className="next-page next-dossier-shell">
      <header className="next-page__hero">
        <div>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{area.title}</h1>
          <p className="next-page__description">
            Prima area shell reale della NEXT costruita oltre il placeholder generico.
            Qui la pagina chiarisce la gerarchia corretta: ingresso mezzi globale,
            Dossier come cuore del sistema, convergenze mezzo-centriche e moduli futuri
            collegati, tutto in modalita `read-only`.
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
          <span className="next-chip next-chip--warning">Dati reali non collegati</span>
        </div>
      </header>

      <nav className="next-section-tabs" aria-label="Sezioni area Mezzi / Dossier">
        <a className="next-section-tabs__link" href="#ingresso-mezzi">
          Ingresso mezzi
        </a>
        <a className="next-section-tabs__link" href="#dossier-cuore">
          Dossier cuore
        </a>
        <a className="next-section-tabs__link" href="#convergenze-dossier">
          Convergenze
        </a>
        <a className="next-section-tabs__link" href="#moduli-futuri">
          Moduli futuri
        </a>
      </nav>

      <section className="next-summary-grid next-summary-grid--wide">
        <article className="next-summary-card next-tone next-tone--accent">
          <p className="next-summary-card__label">Ingresso area</p>
          <strong className="next-summary-card__value">Elenco mezzi</strong>
          <p className="next-summary-card__meta">
            Filtri, ricerca targa e overview flotta servono a trovare il mezzo giusto,
            non a sostituire la lettura completa della targa.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--success">
          <p className="next-summary-card__label">Cuore del sistema</p>
          <strong className="next-summary-card__value">Dossier Mezzo</strong>
          <p className="next-summary-card__meta">
            Vista decisionale detail-first con header mezzo, scadenze, documenti,
            costi, timeline e strumenti contestuali.
          </p>
        </article>

        <article className="next-summary-card next-tone">
          <p className="next-summary-card__label">Flussi convergenti</p>
          <strong className="next-summary-card__value">4 famiglie chiave</strong>
          <p className="next-summary-card__meta">
            Lavori/manutenzioni, rifornimenti/scadenze, documenti/costi/IA, eventi
            autisti mezzo-correlati.
          </p>
        </article>

        <article className="next-summary-card next-tone next-tone--warning">
          <p className="next-summary-card__label">Stato migrazione</p>
          <strong className="next-summary-card__value">UI strutturata</strong>
          <p className="next-summary-card__meta">
            Prima area vera della NEXT senza dati reali, writer o clonazione del
            `DossierMezzo` legacy.
          </p>
        </article>
      </section>

      <section id="ingresso-mezzi" className="next-dossier-layout">
        <article className="next-panel next-dossier-main next-tone">
          <div className="next-panel__header">
            <h2>Ingresso area mezzi</h2>
          </div>
          <p className="next-panel__description">
            L&apos;area `Mezzi / Dossier` inizia da una vista globale di accesso ai mezzi.
            Questa parte serve a cercare, filtrare e capire rapidamente quale targa
            aprire, ma non deve diventare un dossier compresso.
          </p>

          <div className="next-dossier-map">
            <div className="next-dossier-map__row">
              <strong>Elenco mezzi</strong>
              <span>Card o tabella con stato sintetico, categoria, targa e accesso rapido.</span>
            </div>
            <div className="next-dossier-map__row">
              <strong>Filtri e ricerca</strong>
              <span>Ricerca targa, stato mezzo, categoria e accessi rapidi ai record piu usati.</span>
            </div>
            <div className="next-dossier-map__row">
              <strong>CTA primaria</strong>
              <span>`Apri Dossier` sempre piu importante di azioni secondarie o tecniche.</span>
            </div>
          </div>
        </article>

        <div className="next-dossier-side">
          <article className="next-panel next-tone next-tone--success">
            <div className="next-panel__header">
              <h2>Differenza da un semplice elenco</h2>
            </div>
            <p className="next-panel__description">
              L&apos;elenco mezzi governa il passaggio dalla vista globale alla targa.
              Il Dossier prende il controllo solo dopo questa scelta.
            </p>
            <ul className="next-panel__list">
              <li>Globale, rapido, orientato alla ricerca</li>
              <li>Nessun dettaglio storico profondo in questa fascia</li>
              <li>Ogni riga o card deve avere ponte diretto al Dossier</li>
            </ul>
          </article>

          <article className="next-panel next-tone next-tone--warning">
            <div className="next-panel__header">
              <h2>Non ancora incluso</h2>
            </div>
            <p className="next-panel__description">
              Nessun reader reale mezzi, nessuna lista targa runtime, nessun motore di
              ricerca collegato a Firestore o `storageSync`.
            </p>
          </article>
        </div>
      </section>

      <section id="dossier-cuore" className="next-dossier-layout">
        <article className="next-panel next-dossier-main next-tone next-tone--accent">
          <div className="next-panel__header">
            <h2>Dossier Mezzo come cuore del sistema</h2>
          </div>
          <p className="next-panel__description">
            Il Dossier non e il secondo nome dell&apos;elenco mezzi. E la vista mezzo-centrica
            completa, orientata alla decisione, dove confluiscono contesto, storico,
            documenti, costi, scadenze e strumenti contestuali.
          </p>

          <div className="next-dossier-map">
            <div className="next-dossier-map__row">
              <strong>Header mezzo forte</strong>
              <span>Targa, stato, categoria, badge e CTA contestuali su un singolo mezzo.</span>
            </div>
            <div className="next-dossier-map__row">
              <strong>Overview e reminder</strong>
              <span>Scadenze, anomalie, stato sintetico e priorita prima del dettaglio storico.</span>
            </div>
            <div className="next-dossier-map__row">
              <strong>Pannelli principali</strong>
              <span>Lavori, manutenzioni, rifornimenti, documenti, costi e materiali mezzo-correlati.</span>
            </div>
            <div className="next-dossier-map__row">
              <strong>Timeline e approfondimenti</strong>
              <span>Storico operativo, eventi autisti, analisi, PDF e IA come estensioni contestuali.</span>
            </div>
          </div>
        </article>

        <div className="next-dossier-side">
          <article className="next-panel next-tone next-tone--success">
            <div className="next-panel__header">
              <h2>IA / PDF / scadenze</h2>
            </div>
            <p className="next-panel__description">
              Qui devono vivere come strumenti contestuali: IA read-only v1, PDF
              standard e reminder mezzo-centrici, senza trasformarsi in moduli isolati.
            </p>
          </article>

          <article className="next-panel next-tone next-tone--warning">
            <div className="next-panel__header">
              <h2>Limite attuale della pagina</h2>
            </div>
            <p className="next-panel__description">
              Questa struttura non clona `DossierMezzo` legacy: fissa solo la grammatica
              reale della macro-area e prepara il futuro import `read-only`.
            </p>
          </article>
        </div>
      </section>

      <section id="convergenze-dossier" className="next-section-grid next-section-grid--wide">
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

      <section className="next-section-grid">
        <article className="next-panel">
          <div className="next-panel__header">
            <h2>Vista elenco mezzi</h2>
          </div>
          <p className="next-panel__description">
            Serve a scegliere la targa, applicare filtri e leggere uno stato sintetico.
            La profondita resta minima e orientata all&apos;accesso.
          </p>
          <ul className="next-panel__list">
            <li>globale</li>
            <li>ricerca e filtri prima del dettaglio</li>
            <li>CTA principale: aprire il Dossier</li>
          </ul>
        </article>

        <article className="next-panel next-tone next-tone--success">
          <div className="next-panel__header">
            <h2>Vista Dossier Mezzo</h2>
          </div>
          <p className="next-panel__description">
            Serve a decidere sul singolo mezzo, con contesto pieno, scadenze, storico,
            documenti, costi e strumenti contestuali.
          </p>
          <ul className="next-panel__list">
            <li>mezzo-centrica</li>
            <li>overview prima del dettaglio</li>
            <li>contesto completo della targa</li>
          </ul>
        </article>

        <article className="next-panel next-tone next-tone--warning">
          <div className="next-panel__header">
            <h2>Differenza da Operativita Globale</h2>
          </div>
          <p className="next-panel__description">
            `Operativita Globale` governa task e code trasversali. `Mezzi / Dossier`
            governa invece il contesto della targa e il punto di convergenza dei flussi
            mezzo-centrici.
          </p>
          <ul className="next-panel__list">
            <li>Operativita = workflow e backlog</li>
            <li>Mezzi / Dossier = contesto e stato del mezzo</li>
            <li>Le code aprono il Dossier, non il contrario</li>
          </ul>
        </article>
      </section>

      <section id="moduli-futuri" className="next-section-grid next-section-grid--wide">
        {futureModulePanels.map((panel) => (
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
            Permission key: <code>{access.permissionKey}</code>. L&apos;area e gia pronta
            per la matrice permessi futura, ma resta solo una shell `read-only`.
          </p>
        </article>

        <article className="next-inline-panel">
          <h3>Perche questa pagina e utile davvero</h3>
          <p>
            Fissa la differenza tra `ingresso mezzi`, `Dossier come cuore` e `convergenze
            dei flussi`, cosi i prossimi import della NEXT non partono da un placeholder
            ambiguo o da una copia diretta della legacy.
          </p>
        </article>

        <article className="next-inline-panel">
          <h3>Prossimo step coerente</h3>
          <p>
            Importare in modo controllato un primo blocco `read-only` reale del Dossier,
            mantenendo separati elenco mezzi, dettaglio targa e workflow globali.
          </p>
        </article>
      </section>
    </section>
  );
}

export default NextMezziDossierPage;
