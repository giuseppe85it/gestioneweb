import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NEXT_IA_DOCUMENTI_PATH,
  NEXT_INTERNAL_AI_PATH,
} from "../nextStructuralPaths";
import "../internal-ai/internal-ai.css";

type IATipoDocumento =
  | "fattura"
  | "libretto"
  | "cisterna"
  | "preventivo"
  | "manutenzione";

type IAMenuVoce =
  | {
      tipo: IATipoDocumento;
      label: string;
      descrizione: string;
      colore: string;
      attivo: true;
    }
  | {
      tipo: string;
      label: string;
      descrizione: string;
      attivo: false;
    };

const ACTIVE_MENU_ITEMS: IAMenuVoce[] = [
  {
    tipo: "fattura",
    label: "Fattura / DDT",
    descrizione: "Allega e analizza con IA",
    colore: "#185fa5",
    attivo: true,
  },
  {
    tipo: "libretto",
    label: "Libretto mezzo",
    descrizione: "Estrai dati carta di circolazione",
    colore: "#0f6e56",
    attivo: true,
  },
  {
    tipo: "cisterna",
    label: "Cisterna Caravate",
    descrizione: "Schede test e bollettini",
    colore: "#854f0b",
    attivo: true,
  },
  {
    tipo: "preventivo",
    label: "Preventivo fornitore",
    descrizione: "Allega e archivia",
    colore: "#993556",
    attivo: true,
  },
  {
    tipo: "manutenzione",
    label: "Documento manutenzione",
    descrizione: "Allega e collega al mezzo",
    colore: "#3b6d11",
    attivo: true,
  },
];

const INACTIVE_MENU_ITEMS: IAMenuVoce[] = [
  {
    tipo: "analisi-danni",
    label: "Analisi Danni",
    descrizione: "In arrivo",
    attivo: false,
  },
  {
    tipo: "diagnostica-ia",
    label: "Diagnostica IA",
    descrizione: "In arrivo",
    attivo: false,
  },
];

export default function HomeInternalAiLauncher() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [prompt, setPrompt] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const allMenuItems = useMemo(
    () => [...ACTIVE_MENU_ITEMS, ...INACTIVE_MENU_ITEMS],
    [],
  );

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [menuOpen]);

  const handlePromptSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const initialPrompt = prompt.trim();
    if (!initialPrompt) {
      return;
    }

    navigate(NEXT_INTERNAL_AI_PATH, {
      state: { initialPrompt },
    });
  };

  const handleUploadTrigger = (tipo: IATipoDocumento) => {
    navigate(NEXT_INTERNAL_AI_PATH, {
      state: { triggerUpload: tipo },
    });
  };

  return (
    <div ref={rootRef} className="home-ia-launcher">
      <div className="home-ia-launcher__header">
        <div className="home-ia-launcher__title-wrap">
          <span className="home-ia-launcher__status-dot" aria-hidden="true" />
          <strong className="home-ia-launcher__title">Assistente IA</strong>
        </div>
        <span className="home-ia-launcher__status-pill">Attivo</span>
      </div>

      <form className="home-ia-launcher__composer" onSubmit={handlePromptSubmit}>
        <div className="home-ia-launcher__composer-row">
          <div className="home-ia-launcher__menu-wrap">
            <button
              type="button"
              className="home-ia-launcher__menu-toggle"
              aria-expanded={menuOpen}
              aria-label="Apri funzioni IA"
              onClick={() => setMenuOpen((current) => !current)}
            >
              +
            </button>

            {menuOpen ? (
              <div className="home-ia-launcher__menu" role="menu" aria-label="Funzioni IA">
                {allMenuItems.map((item) =>
                  item.attivo ? (
                    <button
                      key={item.tipo}
                      type="button"
                      role="menuitem"
                      className="home-ia-launcher__menu-item"
                      onClick={() => handleUploadTrigger(item.tipo)}
                    >
                      <span
                        className="home-ia-launcher__menu-dot"
                        style={{ backgroundColor: item.colore }}
                        aria-hidden="true"
                      />
                      <span className="home-ia-launcher__menu-copy">
                        <strong>{item.label}</strong>
                        <span>{item.descrizione}</span>
                      </span>
                    </button>
                  ) : (
                    <div
                      key={item.tipo}
                      className="home-ia-launcher__menu-item is-disabled"
                      aria-disabled="true"
                    >
                      <span className="home-ia-launcher__menu-dot is-disabled" aria-hidden="true" />
                      <span className="home-ia-launcher__menu-copy">
                        <strong>{item.label}</strong>
                        <span>{item.descrizione}</span>
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : null}
          </div>

          <input
            type="text"
            className="home-ia-launcher__input"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Chiedi un report, una targa, un fornitore..."
            aria-label="Scrivi una richiesta per la IA interna"
          />

          <button
            type="submit"
            className="home-ia-launcher__submit"
            aria-label="Apri la IA interna con il prompt scritto"
          >
            →
          </button>
        </div>
      </form>

      <div className="home-ia-launcher__footer">
        <span className="home-ia-launcher__footer-copy">5 funzioni attive</span>
        <button
          type="button"
          className="home-ia-launcher__history-link"
          onClick={() => navigate(NEXT_IA_DOCUMENTI_PATH)}
        >
          Storico →
        </button>
      </div>
    </div>
  );
}
