import { type FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NEXT_IA_DOCUMENTI_PATH } from "../nextStructuralPaths";
import "../internal-ai/internal-ai.css";

type ArchivistaTipo = "fattura_ddt" | "preventivo" | "documento_mezzo";
type ArchivistaContesto = "magazzino" | "manutenzione" | "documento_mezzo";

type ArchivistaQuickAction = {
  id: string;
  label: string;
  descrizione: string;
  tipo: ArchivistaTipo;
  contesto: ArchivistaContesto;
};

const NEXT_IA_REPORT_PATH = "/next/chat";
const NEXT_IA_ARCHIVISTA_PATH = "/next/ia/archivista";
const NEXT_CISTERNA_IA_PATH = "/next/cisterna/ia";

const ARCHIVISTA_V1_ACTIONS: ArchivistaQuickAction[] = [
  {
    id: "fattura-magazzino",
    label: "Fattura / DDT magazzino",
    descrizione: "Ricambi, materiali e documenti fornitore.",
    tipo: "fattura_ddt",
    contesto: "magazzino",
  },
  {
    id: "fattura-manutenzione",
    label: "Fattura manutenzione",
    descrizione: "Documento officina da archiviare prima di ogni azione.",
    tipo: "fattura_ddt",
    contesto: "manutenzione",
  },
  {
    id: "preventivo-magazzino",
    label: "Preventivo magazzino",
    descrizione: "Preventivo fornitore della V1 attiva.",
    tipo: "preventivo",
    contesto: "magazzino",
  },
  {
    id: "documento-mezzo",
    label: "Documento mezzo",
    descrizione: "Libretto, assicurazione, revisione e collaudo.",
    tipo: "documento_mezzo",
    contesto: "documento_mezzo",
  },
];

export default function HomeInternalAiLauncher() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const ingressiAttivi = useMemo(() => ARCHIVISTA_V1_ACTIONS.length, []);

  const handlePromptSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const initialPrompt = prompt.trim();
    if (!initialPrompt) {
      return;
    }

    navigate(NEXT_IA_REPORT_PATH, {
      state: { initialPrompt },
    });
  };

  const handleOpenArchivista = (tipo?: ArchivistaTipo, contesto?: ArchivistaContesto) => {
    navigate(NEXT_IA_ARCHIVISTA_PATH, {
      state: tipo && contesto ? { archivistaPreset: { tipo, contesto } } : undefined,
    });
  };

  return (
    <div className="home-ia-launcher">
      <div className="home-ia-launcher__split">
        <section className="home-ia-launcher__panel">
          <div className="home-ia-launcher__section-head">
            <div className="home-ia-launcher__title-wrap">
              <span className="home-ia-launcher__status-dot" aria-hidden="true" />
              <div>
                <p className="home-ia-launcher__eyebrow">IA 1</p>
                <strong className="home-ia-launcher__title">IA Report</strong>
              </div>
            </div>
            <span className="home-ia-launcher__status-pill">Sola lettura</span>
          </div>

          <p className="home-ia-launcher__intro">
            Chiedi report, controlli o sintesi. Questa area resta la parte chat e non e
            l&apos;archivista documenti.
          </p>

          <form className="home-ia-launcher__composer" onSubmit={handlePromptSubmit}>
            <div className="home-ia-launcher__composer-row">
              <input
                type="text"
                className="home-ia-launcher__input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Chiedi un report, una targa, un fornitore..."
                aria-label="Scrivi una richiesta per IA Report"
              />

              <button
                type="submit"
                className="home-ia-launcher__submit"
                aria-label="Apri IA Report con il prompt scritto"
              >
                Apri
              </button>
            </div>
          </form>

          <div className="home-ia-launcher__panel-footer">
            <span className="home-ia-launcher__footnote">Chat e report senza scritture business</span>
            <button
              type="button"
              className="home-ia-launcher__history-link"
              onClick={() => navigate(NEXT_IA_REPORT_PATH)}
            >
              Apri IA Report
            </button>
          </div>
        </section>

        <section className="home-ia-launcher__panel home-ia-launcher__panel--archivista">
          <div className="home-ia-launcher__section-head">
            <div className="home-ia-launcher__title-wrap">
              <span className="home-ia-launcher__status-dot" aria-hidden="true" />
              <div>
                <p className="home-ia-launcher__eyebrow">IA 2</p>
                <strong className="home-ia-launcher__title">Archivista documenti</strong>
              </div>
            </div>
            <span className="home-ia-launcher__status-pill is-archivista">Flusso guidato</span>
          </div>

          <p className="home-ia-launcher__intro">
            Prima scegli il tipo e il contesto. Poi carichi il file. Questa area non e una chat.
          </p>

          <div className="home-ia-launcher__quick-grid">
            {ARCHIVISTA_V1_ACTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="home-ia-launcher__quick-action"
                onClick={() => handleOpenArchivista(item.tipo, item.contesto)}
              >
                <span className="home-ia-launcher__quick-copy">
                  <strong>{item.label}</strong>
                  <span>{item.descrizione}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="home-ia-launcher__panel-footer">
            <span className="home-ia-launcher__footnote">{ingressiAttivi} ingressi V1 attivi</span>
            <div className="home-ia-launcher__panel-actions">
              <button
                type="button"
                className="home-ia-launcher__history-link"
                onClick={() => handleOpenArchivista()}
              >
                Apri Archivista
              </button>
              <button
                type="button"
                className="home-ia-launcher__history-link"
                onClick={() => navigate(NEXT_IA_DOCUMENTI_PATH)}
              >
                Storico documenti
              </button>
            </div>
          </div>

          <div className="home-ia-launcher__subtools">
            <span className="home-ia-launcher__subtools-label">Fuori V1</span>
            <button
              type="button"
              className="home-ia-launcher__secondary-chip"
              onClick={() => navigate(NEXT_CISTERNA_IA_PATH)}
            >
              Cisterna Caravate
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
