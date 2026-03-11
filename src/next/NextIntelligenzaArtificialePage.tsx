import { Link, useLocation } from "react-router-dom";
import "../pages/IA/IAHome.css";
import "./next-shell.css";

type CloneHubCard = {
  title: string;
  description: string;
  reason: string;
  iconSrc: string;
  iconAlt: string;
  status: string;
  to?: string;
};

const CLONE_ACTIVE_TOOL: CloneHubCard = {
  title: "Libretti (Export PDF)",
  description: "Seleziona piu targhe e genera un PDF unico con anteprima.",
  reason:
    "Aperto nel clone in perimetro minimo: lista mezzi con libretto, selezione e anteprima locale senza share o download.",
  iconSrc: "/icons/ia/libretto.png",
  iconAlt: "Libretti Export PDF",
  status: "READ-ONLY",
  to: "/next/libretti-export",
};

const CLONE_BLOCKED_TOOLS: CloneHubCard[] = [
  {
    title: "Estrazione Libretto",
    description: "Leggi automaticamente i dati del mezzo dal libretto.",
    reason: "Bloccato nel clone: upload, estrazione e salvataggio su @mezzi_aziendali.",
    iconSrc: "/icons/ia/libretto.png",
    iconAlt: "Libretto",
    status: "BLOCCATO",
  },
  {
    title: "Archivio Libretti",
    description: "Consulta i libretti gia scansionati per targa.",
    reason: "Bloccato nel clone: la route madre condivide viewer e writer nello stesso modulo.",
    iconSrc: "/icons/ia/libretto.png",
    iconAlt: "Archivio",
    status: "BLOCCATO",
  },
  {
    title: "Copertura Libretti + Foto",
    description: "Verifica i mezzi con libretto o foto mancanti.",
    reason: "Bloccato nel clone: repair URL, upload file e riscrittura del dataset mezzi.",
    iconSrc: "/icons/ia/libretto.png",
    iconAlt: "Copertura",
    status: "BLOCCATO",
  },
  {
    title: "Documenti IA",
    description: "Estrai dati da preventivi, fatture e documenti.",
    reason: "Bloccato nel clone: upload file, runtime esterno, salvataggi documentali e sync inventario.",
    iconSrc: "/icons/ia/documenti.png",
    iconAlt: "Documenti",
    status: "BLOCCATO",
  },
  {
    title: "Cisterna Caravate IA",
    description: "Carica documenti cisterna e salva in archivio dedicato.",
    reason: "Bloccato nel clone: upload, estrazione e scrittura su archivio cisterna dedicato.",
    iconSrc: "/cisterna.png",
    iconAlt: "Cisterna",
    status: "BLOCCATO",
  },
  {
    title: "API Key IA",
    description: "Gestisci la tua chiave Gemini.",
    reason: "Bloccato nel clone: configurazione sensibile su @impostazioni_app/gemini.",
    iconSrc: "/icons/ia/key.png",
    iconAlt: "API Key",
    status: "BLOCCATO",
  },
];

const FUTURE_TOOLS: CloneHubCard[] = [
  {
    title: "Analisi Danni",
    description: "Funzione in arrivo.",
    reason: "Gia disattivata nella madre.",
    iconSrc: "/icons/ia/danni.png",
    iconAlt: "Danni",
    status: "DISATTIVATO",
  },
  {
    title: "Diagnostica IA",
    description: "Funzione in arrivo.",
    reason: "Gia disattivata nella madre.",
    iconSrc: "/icons/ia/diagnostica.png",
    iconAlt: "Diagnostica",
    status: "DISATTIVATO",
  },
  {
    title: "In sviluppo",
    description: "Nuove funzioni in arrivo.",
    reason: "Gia disattivata nella madre.",
    iconSrc: "/icons/ia/futuro.png",
    iconAlt: "Futuro",
    status: "DISATTIVATO",
  },
];

function NextIntelligenzaArtificialePage() {
  const location = useLocation();
  const backToHome = location.search
    ? `/next/centro-controllo${location.search}`
    : "/next/centro-controllo";
  const librettiExportPath = location.search
    ? `${CLONE_ACTIVE_TOOL.to}${location.search}`
    : CLONE_ACTIVE_TOOL.to ?? "/next/libretti-export";

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
            Il clone apre l&apos;hub reale della madre e il solo sotto-modulo clone-safe
            `Libretti (Export PDF)`.
          </p>
          <p style={{ marginTop: 12 }}>
            Le altre route figlie restano visibili ma bloccate finche non saranno
            isolate da configurazione, upload, salvataggi o runtime esterni.
          </p>
          <p style={{ marginTop: 12 }}>
            <Link to={backToHome}>Torna alla Home clone</Link>
          </p>
        </section>

        <section className="ia-section">
          <div className="ia-section-head">
            <div>
              <h2>Strumenti attivi</h2>
              <span>
                Nel clone e apribile solo il perimetro minimo read-only di `Libretti Export`.
              </span>
            </div>
          </div>
          <div className="ia-grid">
            <Link
              to={librettiExportPath}
              className="ia-card"
              style={{ textDecoration: "none", color: "inherit" }}
              title={CLONE_ACTIVE_TOOL.reason}
            >
              <span className="ia-card-status on">{CLONE_ACTIVE_TOOL.status}</span>
              <img
                src={CLONE_ACTIVE_TOOL.iconSrc}
                alt={CLONE_ACTIVE_TOOL.iconAlt}
                className="ia-icon"
              />
              <h3>{CLONE_ACTIVE_TOOL.title}</h3>
              <p>{CLONE_ACTIVE_TOOL.description}</p>
              <p style={{ marginTop: 10, fontSize: 12, color: "#20543c" }}>
                {CLONE_ACTIVE_TOOL.reason}
              </p>
            </Link>
            {CLONE_BLOCKED_TOOLS.map((card) => (
              <article
                key={card.title}
                className="ia-card disabled next-clone-card-disabled"
                aria-disabled="true"
                title={card.reason}
              >
                <span className="ia-card-status off">{card.status}</span>
                <img src={card.iconSrc} alt={card.iconAlt} className="ia-icon" />
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <p style={{ marginTop: 10, fontSize: 12, color: "#7a2020" }}>{card.reason}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ia-section ia-section-secondary">
          <div className="ia-section-head">
            <div>
              <h2>In arrivo</h2>
              <span>Stessa sezione gia disattivata nella madre, lasciata invariata nel clone.</span>
            </div>
          </div>
          <div className="ia-grid">
            {FUTURE_TOOLS.map((card) => (
              <article key={card.title} className="ia-card disabled" aria-disabled="true">
                <span className="ia-card-status off">{card.status}</span>
                <img src={card.iconSrc} alt={card.iconAlt} className="ia-icon" />
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default NextIntelligenzaArtificialePage;
