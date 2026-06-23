import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NEXT_IA_DOCUMENTI_PATH } from "../nextStructuralPaths";
import "../internal-ai/internal-ai.css";

const INTERNAL_AI_BACKEND_BASE = "http://127.0.0.1:4310/internal-ai-backend";

// Protocollo personale registrato sul PC (vedi scripts/archivista/archivista-protocol-register.ps1):
// un click apre "archivista://<azione>" e Windows esegue lo script corrispondente,
// anche quando il backend e' completamente spento. Il browser non puo' lanciare PowerShell
// direttamente, per questo si passa dal protocollo.
const ARCHIVISTA_PROTOCOL = "archivista";

type BackendStatus = "checking" | "online" | "offline";

// reloadAfter: l'azione riaccende il backend, quindi ricontrolliamo lo stato dopo qualche secondo.
type ArchivistaCommand = { id: string; label: string; action: string; reloadAfter?: boolean };

const ARCHIVISTA_COMMANDS: ArchivistaCommand[] = [
  { id: "restart", label: "Riavvia backend", action: "restart", reloadAfter: true },
  { id: "stop", label: "Ferma backend", action: "stop" },
  { id: "disable", label: "Spegni avvio automatico", action: "disable" },
  { id: "enable", label: "Riattiva avvio automatico", action: "enable", reloadAfter: true },
];

function getBackendStatusMeta(status: BackendStatus): { cls: string; label: string } {
  if (status === "online") {
    return { cls: "is-online", label: "Collegato" };
  }
  if (status === "offline") {
    return { cls: "is-offline", label: "Non collegato" };
  }
  return { cls: "is-checking", label: "Verifica…" };
}

type ArchivistaTipo = "fattura_ddt" | "preventivo" | "documento_mezzo";
type ArchivistaContesto = "magazzino" | "manutenzione" | "documento_mezzo";

type ArchivistaQuickAction = {
  id: string;
  label: string;
  descrizione: string;
  tipo: ArchivistaTipo;
  contesto: ArchivistaContesto;
};

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
  const ingressiAttivi = useMemo(() => ARCHIVISTA_V1_ACTIONS.length, []);

  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const checkBackend = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4000);
    try {
      // Qualsiasi risposta HTTP significa che il backend e' vivo e raggiungibile.
      await fetch(`${INTERNAL_AI_BACKEND_BASE}/health`, { signal: controller.signal });
      setBackendStatus("online");
    } catch {
      setBackendStatus("offline");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    void checkBackend();
    const intervalId = window.setInterval(() => {
      void checkBackend();
    }, 10000);
    return () => window.clearInterval(intervalId);
  }, [checkBackend]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const handleDocClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, [menuOpen]);

  const launchCommand = useCallback(
    (command: ArchivistaCommand) => {
      setMenuOpen(false);
      // Apre il protocollo locale: Windows esegue lo script collegato all'azione.
      window.location.href = `${ARCHIVISTA_PROTOCOL}://${command.action}`;
      setCommandFeedback(
        `"${command.label}" avviato. Se il browser chiede conferma, consenti l'apertura di "Archivista".`,
      );
      if (command.reloadAfter) {
        setBackendStatus("checking");
        window.setTimeout(() => void checkBackend(), 3500);
        window.setTimeout(() => void checkBackend(), 7000);
      }
      window.setTimeout(() => setCommandFeedback(null), 9000);
    },
    [checkBackend],
  );

  const statusMeta = getBackendStatusMeta(backendStatus);

  const handleOpenArchivista = (tipo?: ArchivistaTipo, contesto?: ArchivistaContesto) => {
    navigate(NEXT_IA_ARCHIVISTA_PATH, {
      state: tipo && contesto ? { archivistaPreset: { tipo, contesto } } : undefined,
    });
  };

  return (
    <div className="home-ia-launcher">
      <div className="home-ia-launcher__split">
        <section className="home-ia-launcher__panel home-ia-launcher__panel--archivista">
          <div className="home-ia-launcher__section-head">
            <div className="home-ia-launcher__title-wrap">
              <span
                className={`home-ia-launcher__status-dot ${statusMeta.cls}`}
                title={`Importa documenti: ${statusMeta.label}`}
              />
              <div>
                <p className="home-ia-launcher__eyebrow">IA 2</p>
                <strong className="home-ia-launcher__title">Importa documenti</strong>
              </div>
            </div>
            <div className="home-ia-launcher__head-right">
              <span className={`home-ia-launcher__conn-pill ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
              <div className="home-ia-launcher__menu" ref={menuRef}>
                <button
                  type="button"
                  className="home-ia-launcher__menu-btn"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Comandi Importa documenti"
                >
                  ⋮
                </button>
                {menuOpen && (
                  <div className="home-ia-launcher__menu-pop" role="menu">
                    <p className="home-ia-launcher__menu-hint">Controlla il backend (un click)</p>
                    {ARCHIVISTA_COMMANDS.map((command) => (
                      <button
                        key={command.id}
                        type="button"
                        role="menuitem"
                        className="home-ia-launcher__menu-item"
                        onClick={() => {
                          launchCommand(command);
                        }}
                      >
                        {command.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      className="home-ia-launcher__menu-item is-refresh"
                      onClick={() => {
                        setMenuOpen(false);
                        void checkBackend();
                      }}
                    >
                      Aggiorna stato
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {commandFeedback && (
            <p className="home-ia-launcher__cmd-feedback" role="status">
              {commandFeedback}
            </p>
          )}

          <p className="home-ia-launcher__intro">
            {backendStatus === "offline"
              ? "Importa documenti non collegato: parte da solo al prossimo accesso a Windows, oppure usa il menu ⋮ per riavviarlo. Prima scegli il tipo e il contesto, poi carichi il file."
              : "Prima scegli il tipo e il contesto. Poi carichi il file. Questa area non e una chat."}
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
                Apri Importa documenti
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
