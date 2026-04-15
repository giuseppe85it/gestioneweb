import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ArchivistaDocumentoMezzoBridge from "./internal-ai/ArchivistaDocumentoMezzoBridge";
import ArchivistaMagazzinoBridge from "./internal-ai/ArchivistaMagazzinoBridge";
import ArchivistaManutenzioneBridge from "./internal-ai/ArchivistaManutenzioneBridge";
import ArchivistaPreventivoMagazzinoBridge from "./internal-ai/ArchivistaPreventivoMagazzinoBridge";
import {
  NEXT_IA_DOCUMENTI_PATH,
  NEXT_INTERNAL_AI_PATH,
} from "./nextStructuralPaths";
import "./internal-ai/internal-ai.css";

type ArchivistaTipo = "fattura_ddt" | "preventivo" | "documento_mezzo";
type ArchivistaContesto = "magazzino" | "manutenzione" | "documento_mezzo";
type ArchivistaAvailability = "active" | "coming_soon" | "out_of_scope" | "not_available";

type ArchivistaPreset = {
  tipo?: ArchivistaTipo;
  contesto?: ArchivistaContesto;
};

type ArchivistaNavigationState = {
  archivistaPreset?: ArchivistaPreset;
};

type ArchivistaFlowState = {
  availability: ArchivistaAvailability;
  titolo: string;
  descrizione: string;
  badge: string;
};

const TYPE_OPTIONS: Array<{ id: ArchivistaTipo; label: string; description: string }> = [
  {
    id: "fattura_ddt",
    label: "Fattura / DDT",
    description: "Materiali, fornitori e documenti di acquisto.",
  },
  {
    id: "preventivo",
    label: "Preventivo",
    description: "Preventivi da archiviare prima di ogni decisione.",
  },
  {
    id: "documento_mezzo",
    label: "Documento mezzo",
    description: "Libretto, assicurazione, revisione e collaudo.",
  },
];

const CONTEXT_OPTIONS: Array<{
  id: ArchivistaContesto;
  label: string;
  description: string;
}> = [
  {
    id: "magazzino",
    label: "Magazzino",
    description: "Ricambi, materiali, DDT e fatture di acquisto.",
  },
  {
    id: "manutenzione",
    label: "Manutenzione",
    description: "Documenti legati a lavori officina e interventi sul mezzo.",
  },
  {
    id: "documento_mezzo",
    label: "Documento mezzo",
    description: "Archivio del mezzo con conferma finale dell'utente.",
  },
];

const FLOW_MATRIX: Record<`${ArchivistaTipo}:${ArchivistaContesto}`, ArchivistaFlowState> = {
  "fattura_ddt:magazzino": {
    availability: "active",
    titolo: "Fattura / DDT magazzino",
    descrizione:
      "Analisi reale per fatture e DDT di acquisto. La review resta dentro Archivista, senza chat e senza azioni finali automatiche.",
    badge: "Attivo ora",
  },
  "fattura_ddt:manutenzione": {
    availability: "active",
    titolo: "Fattura / DDT manutenzione",
    descrizione:
      "Analisi reale per documenti officina e costi manutenzione. La review e separata da Magazzino e non crea ancora alcuna manutenzione.",
    badge: "Attivo ora",
  },
  "fattura_ddt:documento_mezzo": {
    availability: "not_available",
    titolo: "Fattura / DDT + Documento mezzo",
    descrizione: "Questa combinazione non fa parte del perimetro V1.",
    badge: "Non disponibile",
  },
  "preventivo:magazzino": {
    availability: "active",
    titolo: "Preventivo magazzino",
    descrizione:
      "Analisi reale per preventivi di magazzino con review dedicata, regola duplicati e archiviazione finale nel ramo preventivi.",
    badge: "Attivo ora",
  },
  "preventivo:manutenzione": {
    availability: "out_of_scope",
    titolo: "Preventivo manutenzione",
    descrizione: "Questo ramo resta fuori V1 e non viene attivato in Archivista.",
    badge: "Fuori V1",
  },
  "preventivo:documento_mezzo": {
    availability: "not_available",
    titolo: "Preventivo + Documento mezzo",
    descrizione: "Questa combinazione non fa parte del perimetro V1.",
    badge: "Non disponibile",
  },
  "documento_mezzo:magazzino": {
    availability: "not_available",
    titolo: "Documento mezzo + Magazzino",
    descrizione: "Questa combinazione non fa parte del perimetro V1.",
    badge: "Non disponibile",
  },
  "documento_mezzo:manutenzione": {
    availability: "not_available",
    titolo: "Documento mezzo + Manutenzione",
    descrizione: "Questa combinazione non fa parte del perimetro V1.",
    badge: "Non disponibile",
  },
  "documento_mezzo:documento_mezzo": {
    availability: "active",
    titolo: "Documento mezzo",
    descrizione:
      "Analisi reale per libretto, assicurazione, revisione e collaudo. L'archivio parte prima e l'update del mezzo resta sempre esplicito.",
    badge: "Attivo ora",
  },
};

function isContextAllowed(tipo: ArchivistaTipo, contesto: ArchivistaContesto) {
  if (tipo === "fattura_ddt") {
    return contesto === "magazzino" || contesto === "manutenzione";
  }

  if (tipo === "preventivo") {
    return contesto === "magazzino";
  }

  return contesto === "documento_mezzo";
}

function getDefaultContextForType(tipo: ArchivistaTipo): ArchivistaContesto {
  if (tipo === "fattura_ddt") {
    return "magazzino";
  }

  if (tipo === "preventivo") {
    return "magazzino";
  }

  return "documento_mezzo";
}

function buildFlowKey(tipo: ArchivistaTipo, contesto: ArchivistaContesto) {
  return `${tipo}:${contesto}` as const;
}

function normalizePreset(
  preset: ArchivistaPreset | undefined,
): { tipo: ArchivistaTipo; contesto: ArchivistaContesto } {
  const tipo = preset?.tipo ?? "fattura_ddt";
  const fallbackContesto = getDefaultContextForType(tipo);
  const contesto =
    preset?.contesto && isContextAllowed(tipo, preset.contesto)
      ? preset.contesto
      : fallbackContesto;

  return { tipo, contesto };
}

function getAvailabilityClass(availability: ArchivistaAvailability) {
  if (availability === "active") return "is-active";
  if (availability === "coming_soon") return "is-coming";
  if (availability === "out_of_scope") return "is-out-of-scope";
  return "is-disabled";
}

export default function NextIAArchivistaPage() {
  const location = useLocation();
  const navigationState = (location.state ?? null) as ArchivistaNavigationState | null;
  const normalizedPreset = useMemo(
    () => normalizePreset(navigationState?.archivistaPreset),
    [navigationState],
  );

  const [tipo, setTipo] = useState<ArchivistaTipo>(normalizedPreset.tipo);
  const [contesto, setContesto] = useState<ArchivistaContesto>(normalizedPreset.contesto);
  const activeFlow = FLOW_MATRIX[buildFlowKey(tipo, contesto)];

  return (
    <section className="next-page internal-ai-page ia-archivista-page">
      <header className="ia-archivista__hero next-panel">
        <div>
          <p className="next-page__eyebrow">IA 2</p>
          <h1>Archivista documenti</h1>
          <p className="next-page__description">
            Questa e l&apos;area per caricare e archiviare documenti. Non e una chat: prima scegli
            tipo e contesto, poi carichi il file.
          </p>
        </div>

        <div className="ia-archivista__hero-actions">
          <Link to={NEXT_INTERNAL_AI_PATH} className="internal-ai-nav__link">
            Vai a IA Report
          </Link>
          <Link to={NEXT_IA_DOCUMENTI_PATH} className="internal-ai-nav__link">
            Apri storico documenti
          </Link>
        </div>
      </header>

      <div className="ia-archivista__meta-grid">
        <article className="internal-ai-card ia-archivista__meta-card">
          <p className="internal-ai-card__eyebrow">Rami attivi ora</p>
          <strong>Fattura / DDT + Magazzino, Fattura / DDT + Manutenzione, Documento mezzo, Preventivo + Magazzino</strong>
          <p className="internal-ai-card__meta">
            In questo step Archivista analizza davvero le quattro famiglie V1 e chiude il lato documenti con review, duplicati e archiviazione confermata.
          </p>
        </article>
        <article className="internal-ai-card ia-archivista__meta-card">
          <p className="internal-ai-card__eyebrow">Visibili ma fuori attivazione</p>
          <strong>Preventivo manutenzione</strong>
          <p className="internal-ai-card__meta">
            Resta visibile come direzione futura ma non entra in Archivista V1.
          </p>
        </article>
        <article className="internal-ai-card ia-archivista__meta-card">
          <p className="internal-ai-card__eyebrow">Fuori V1</p>
          <strong>Preventivo manutenzione, Cisterna, Euromecc, Carburante</strong>
          <p className="internal-ai-card__meta">
            Restano fuori dal primo passo dell&apos;Archivista e non compaiono come rami operativi.
          </p>
        </article>
      </div>

      <div className="ia-archivista__layout">
        <article className="next-panel ia-archivista__panel">
          <div className="ia-archivista__panel-head">
            <div>
              <p className="internal-ai-card__eyebrow">Passo 1</p>
              <h2>Tipo documento</h2>
            </div>
            <span className={`ia-archivista__flow-badge ${getAvailabilityClass(activeFlow.availability)}`}>
              {activeFlow.badge}
            </span>
          </div>

          <div className="ia-archivista__option-grid" role="radiogroup" aria-label="Tipo documento">
            {TYPE_OPTIONS.map((option) => {
              const active = option.id === tipo;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`ia-archivista__option ${active ? "is-active" : ""}`}
                  onClick={() => {
                    const nextContesto = isContextAllowed(option.id, contesto)
                      ? contesto
                      : getDefaultContextForType(option.id);
                    setTipo(option.id);
                    setContesto(nextContesto);
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              );
            })}
          </div>

          <div className="ia-archivista__panel-head">
            <div>
              <p className="internal-ai-card__eyebrow">Passo 2</p>
              <h2>Contesto</h2>
            </div>
          </div>

          <div className="ia-archivista__option-grid" role="radiogroup" aria-label="Contesto documento">
            {CONTEXT_OPTIONS.map((option) => {
              const disabled = !isContextAllowed(tipo, option.id);
              const active = option.id === contesto;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`ia-archivista__option ${active ? "is-active" : ""} ${
                    disabled ? "is-disabled" : ""
                  }`}
                  onClick={() => {
                    if (disabled) {
                      return;
                    }
                    setContesto(option.id);
                  }}
                  aria-disabled={disabled}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              );
            })}
          </div>
        </article>

        <article className="next-panel ia-archivista__panel">
          <div className="ia-archivista__panel-head">
            <div>
              <p className="internal-ai-card__eyebrow">Passo 3</p>
              <h2>{activeFlow.titolo}</h2>
            </div>
            <span className={`ia-archivista__flow-badge ${getAvailabilityClass(activeFlow.availability)}`}>
              {activeFlow.badge}
            </span>
          </div>

          <div className="ia-archivista__flow-summary">
            <p className="internal-ai-card__eyebrow">Flusso selezionato</p>
            <h3>{activeFlow.titolo}</h3>
            <p>{activeFlow.descrizione}</p>
          </div>

          {activeFlow.availability === "active" && tipo === "fattura_ddt" && contesto === "magazzino" ? (
            <ArchivistaMagazzinoBridge />
          ) : activeFlow.availability === "active" &&
            tipo === "fattura_ddt" &&
            contesto === "manutenzione" ? (
            <ArchivistaManutenzioneBridge />
          ) : activeFlow.availability === "active" &&
            tipo === "documento_mezzo" &&
            contesto === "documento_mezzo" ? (
            <ArchivistaDocumentoMezzoBridge />
          ) : activeFlow.availability === "active" &&
            tipo === "preventivo" &&
            contesto === "magazzino" ? (
            <ArchivistaPreventivoMagazzinoBridge />
          ) : (
            <div className={`ia-archivista__inactive-shell ${getAvailabilityClass(activeFlow.availability)}`}>
              <p className="internal-ai-card__eyebrow">{activeFlow.badge}</p>
              <h3>{activeFlow.titolo}</h3>
              <p>{activeFlow.descrizione}</p>
              <p className="internal-ai-card__meta">
                In questo step partono solo i rami gia attivi di Archivista. Qui non parte ancora
                nessuna analisi nuova.
              </p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
