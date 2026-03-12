import { Link } from "react-router-dom";
import "../pages/IA/IAHome.css";
import "./next-shell.css";
import {
  NEXT_CISTERNA_IA_PATH,
  NEXT_HOME_PATH,
  NEXT_IA_APIKEY_PATH,
  NEXT_IA_COPERTURA_LIBRETTI_PATH,
  NEXT_IA_DOCUMENTI_PATH,
  NEXT_IA_LIBRETTO_PATH,
  NEXT_LIBRETTI_EXPORT_PATH,
} from "./nextStructuralPaths";

type CloneHubCard = {
  title: string;
  description: string;
  note: string;
  iconSrc: string;
  iconAlt: string;
  status: string;
  to?: string;
};

const ACTIVE_TOOLS: CloneHubCard[] = [
  {
    title: "Estrazione Libretto",
    description: "Leggi automaticamente i dati del mezzo dal libretto.",
    note: "Route clone autonoma attiva. Upload, estrazione e salvataggio su mezzi restano neutralizzati.",
    iconSrc: "/icons/ia/libretto.png",
    iconAlt: "Libretto",
    status: "READ-ONLY",
    to: NEXT_IA_LIBRETTO_PATH,
  },
  {
    title: "Archivio Libretti",
    description: "Consulta i libretti gia scansionati per targa.",
    note: "Usa la stessa route clone del modulo libretto in modalita archivio, come nella madre.",
    iconSrc: "/icons/ia/libretto.png",
    iconAlt: "Archivio",
    status: "READ-ONLY",
    to: `${NEXT_IA_LIBRETTO_PATH}?archive=1`,
  },
  {
    title: "Copertura Libretti + Foto",
    description: "Verifica i mezzi con libretto o foto mancanti.",
    note: "La pagina clone esiste davvero: espone lo stato di copertura ma non permette repair, upload o scritture.",
    iconSrc: "/icons/ia/libretto.png",
    iconAlt: "Copertura",
    status: "READ-ONLY",
    to: NEXT_IA_COPERTURA_LIBRETTI_PATH,
  },
  {
    title: "Libretti (Export PDF)",
    description: "Seleziona piu targhe e genera un PDF unico con anteprima.",
    note: "Perimetro clone-safe piu maturo: lista, selezione e anteprima locale.",
    iconSrc: "/icons/ia/libretto.png",
    iconAlt: "Libretti Export PDF",
    status: "READ-ONLY",
    to: NEXT_LIBRETTI_EXPORT_PATH,
  },
  {
    title: "Documenti IA",
    description: "Estrai dati da preventivi, fatture e documenti.",
    note: "Route clone autonoma attiva. Upload file, analisi e salvataggi restano bloccati.",
    iconSrc: "/icons/ia/documenti.png",
    iconAlt: "Documenti",
    status: "READ-ONLY",
    to: NEXT_IA_DOCUMENTI_PATH,
  },
  {
    title: "Cisterna Caravate IA",
    description: "Carica documenti cisterna e salva in archivio dedicato.",
    note: "La sottoroute clone esiste: la pagina si apre, ma upload, analisi e salvataggi restano neutralizzati.",
    iconSrc: "/cisterna.png",
    iconAlt: "Cisterna",
    status: "READ-ONLY",
    to: NEXT_CISTERNA_IA_PATH,
  },
  {
    title: "API Key IA",
    description: "Gestisci la tua chiave Gemini.",
    note: "La route clone legge la configurazione esistente ma non permette modifiche o salvataggi.",
    iconSrc: "/icons/ia/key.png",
    iconAlt: "API Key",
    status: "READ-ONLY",
    to: NEXT_IA_APIKEY_PATH,
  },
];

const FUTURE_TOOLS: CloneHubCard[] = [
  {
    title: "Analisi Danni",
    description: "Funzione in arrivo.",
    note: "Gia disattivata nella madre.",
    iconSrc: "/icons/ia/danni.png",
    iconAlt: "Danni",
    status: "DISATTIVATO",
  },
  {
    title: "Diagnostica IA",
    description: "Funzione in arrivo.",
    note: "Gia disattivata nella madre.",
    iconSrc: "/icons/ia/diagnostica.png",
    iconAlt: "Diagnostica",
    status: "DISATTIVATO",
  },
  {
    title: "In sviluppo",
    description: "Nuove funzioni in arrivo.",
    note: "Gia disattivata nella madre.",
    iconSrc: "/icons/ia/futuro.png",
    iconAlt: "Futuro",
    status: "DISATTIVATO",
  },
];

function renderCard(card: CloneHubCard) {
  const content = (
    <>
      <span className={`ia-card-status ${card.to ? "on" : "off"}`}>{card.status}</span>
      <img src={card.iconSrc} alt={card.iconAlt} className="ia-icon" />
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      <p style={{ marginTop: 10, fontSize: 12, color: card.to ? "#20543c" : "#7a2020" }}>
        {card.note}
      </p>
    </>
  );

  if (!card.to) {
    return (
      <article key={card.title} className="ia-card disabled" aria-disabled="true">
        {content}
      </article>
    );
  }

  return (
    <Link
      key={card.title}
      to={card.to}
      className="ia-card"
      style={{ textDecoration: "none", color: "inherit" }}
      title={card.note}
    >
      {content}
    </Link>
  );
}

function NextIntelligenzaArtificialePage() {
  return (
    <div className="ia-page">
      <div className="ia-shell">
        <header className="ia-hero">
          <div className="ia-hero-main">
            <div className="ia-kicker">Modulo IA</div>
            <h1 className="ia-title">Intelligenza Artificiale</h1>
            <p className="ia-subtitle">
              Estrazione dati e documenti con flusso guidato per il dossier mezzi.
            </p>
          </div>
          <div className="ia-key-badge">CLONE READ-ONLY</div>
        </header>

        <section className="next-clone-placeholder" style={{ marginBottom: 20 }}>
          <p>
            L&apos;hub clone mantiene ora la stessa famiglia di pagine della madre: le child route
            si aprono davvero, ma configurazioni sensibili, upload, analisi e scritture restano
            neutralizzati.
          </p>
          <p style={{ marginTop: 12 }}>
            <Link to={NEXT_HOME_PATH}>Torna alla Home clone</Link>
          </p>
        </section>

        <section className="ia-section">
          <div className="ia-section-head">
            <div>
              <h2>Strumenti attivi</h2>
              <span>Stessa famiglia di pagine della madre, con perimetro clone read-only.</span>
            </div>
          </div>
          <div className="ia-grid">{ACTIVE_TOOLS.map(renderCard)}</div>
        </section>

        <section className="ia-section ia-section-secondary">
          <div className="ia-section-head">
            <div>
              <h2>In arrivo</h2>
              <span>Stessa sezione gia disattivata nella madre, lasciata invariata nel clone.</span>
            </div>
          </div>
          <div className="ia-grid">{FUTURE_TOOLS.map(renderCard)}</div>
        </section>
      </div>
    </div>
  );
}

export default NextIntelligenzaArtificialePage;
