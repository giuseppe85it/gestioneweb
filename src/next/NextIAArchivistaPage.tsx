import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ArchivistaDocumentoMezzoBridge, {
  type ArchivistaDocumentoMezzoSubtype,
} from "./internal-ai/ArchivistaDocumentoMezzoBridge";
import ArchivistaMagazzinoBridge from "./internal-ai/ArchivistaMagazzinoBridge";
import ArchivistaManutenzioneBridge from "./internal-ai/ArchivistaManutenzioneBridge";
import ArchivistaPreventivoMagazzinoBridge from "./internal-ai/ArchivistaPreventivoMagazzinoBridge";
import ArchivistaPreventivoManutenzioneBridge from "./internal-ai/ArchivistaPreventivoManutenzioneBridge";
import { NEXT_IA_DOCUMENTI_PATH } from "./nextStructuralPaths";
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

type DestinationOption = {
  id: string;
  label: string;
  tipo: ArchivistaTipo;
  contesto: ArchivistaContesto;
  availability: ArchivistaAvailability;
};

const DESTINATION_OPTIONS: Array<DestinationOption> = [
  {
    id: "fattura_ddt_magazzino",
    label: "Fattura / DDT → Magazzino",
    tipo: "fattura_ddt",
    contesto: "magazzino",
    availability: "active",
  },
  {
    id: "fattura_ddt_manutenzione",
    label: "Fattura / DDT → Manutenzione",
    tipo: "fattura_ddt",
    contesto: "manutenzione",
    availability: "active",
  },
  {
    id: "documento_mezzo",
    label: "Documento mezzo",
    tipo: "documento_mezzo",
    contesto: "documento_mezzo",
    availability: "active",
  },
  {
    id: "preventivo_magazzino",
    label: "Preventivo → Magazzino",
    tipo: "preventivo",
    contesto: "magazzino",
    availability: "active",
  },
  {
    id: "preventivo_manutenzione",
    label: "Preventivo → Manutenzione",
    tipo: "preventivo",
    contesto: "manutenzione",
    availability: "active",
  },
];

const FLOW_MATRIX: Partial<Record<`${ArchivistaTipo}:${ArchivistaContesto}`, ArchivistaFlowState>> = {
  "fattura_ddt:magazzino": {
    availability: "active",
    titolo: "Fattura / DDT + Magazzino",
    descrizione:
      "Review documentale e archiviazione finale del ramo Magazzino.",
    badge: "Attivo ora",
  },
  "fattura_ddt:manutenzione": {
    availability: "active",
    titolo: "Fattura / DDT + Manutenzione",
    descrizione: "Review documentale dedicata alla manutenzione con backend OpenAI separato.",
    badge: "Attivo ora",
  },
  "preventivo:magazzino": {
    availability: "active",
    titolo: "Preventivo + Magazzino",
    descrizione:
      "Review, duplicati e archiviazione finale nel ramo preventivi, senza update listino automatico.",
    badge: "Attivo ora",
  },
  "preventivo:manutenzione": {
    availability: "active",
    titolo: "Preventivo + Manutenzione",
    descrizione:
      "Review preventivo officina con campi mezzo-centrici e archiviazione finale nel ramo preventivi.",
    badge: "Attivo ora",
  },
  "documento_mezzo:documento_mezzo": {
    availability: "active",
    titolo: "Documento mezzo",
    descrizione:
      "Analisi e archivio dei documenti mezzo con possibile aggiornamento mezzo su conferma.",
    badge: "Attivo ora",
  },
};

function isContextAllowed(tipo: ArchivistaTipo, contesto: ArchivistaContesto) {
  if (tipo === "fattura_ddt") {
    return contesto === "magazzino" || contesto === "manutenzione";
  }

  if (tipo === "preventivo") {
    return contesto === "magazzino" || contesto === "manutenzione";
  }

  return contesto === "documento_mezzo";
}

function getDefaultContextForType(tipo: ArchivistaTipo): ArchivistaContesto {
  if (tipo === "documento_mezzo") {
    return "documento_mezzo";
  }

  return "magazzino";
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

function getTypeLabel(tipo: ArchivistaTipo) {
  if (tipo === "fattura_ddt") return "Fattura / DDT";
  if (tipo === "documento_mezzo") return "Documento mezzo";
  return "Preventivo";
}

function getContextLabel(contesto: ArchivistaContesto) {
  if (contesto === "documento_mezzo") return "Documento mezzo";
  return contesto === "magazzino" ? "Magazzino" : "Manutenzione";
}

function mapArchivistaDestinationSelection(
  destination: string,
): { tipo: ArchivistaTipo; contesto: ArchivistaContesto } | null {
  if (destination === "fattura_ddt_magazzino") {
    return { tipo: "fattura_ddt", contesto: "magazzino" };
  }
  if (destination === "fattura_ddt_manutenzione") {
    return { tipo: "fattura_ddt", contesto: "manutenzione" };
  }
  if (destination === "preventivo_magazzino") {
    return { tipo: "preventivo", contesto: "magazzino" };
  }
  if (destination === "preventivo_manutenzione") {
    return { tipo: "preventivo", contesto: "manutenzione" };
  }
  if (destination === "documento_mezzo") {
    return { tipo: "documento_mezzo", contesto: "documento_mezzo" };
  }

  return null;
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
  const [documentoMezzoSubtype, setDocumentoMezzoSubtype] =
    useState<ArchivistaDocumentoMezzoSubtype>("libretto");
  const activeFlow = FLOW_MATRIX[buildFlowKey(tipo, contesto)]!;
  const currentTypeLabel = getTypeLabel(tipo);
  const currentContextLabel = getContextLabel(contesto);
  const isArchivistaDocumentoMezzoLibretto =
    activeFlow.availability === "active" &&
    tipo === "documento_mezzo" &&
    contesto === "documento_mezzo" &&
    documentoMezzoSubtype === "libretto";
  const archivistaLibrettoDestinationOptions = [
    { destination: "fattura_ddt_magazzino", label: "Fattura / DDT → Magazzino" },
    { destination: "fattura_ddt_manutenzione", label: "Fattura / DDT → Manutenzione" },
    { destination: "preventivo_magazzino", label: "Preventivo → Magazzino" },
    { destination: "preventivo_manutenzione", label: "Preventivo → Manutenzione" },
  ];

  if (isArchivistaDocumentoMezzoLibretto) {
    return (
      <section className="next-page internal-ai-page">
        <ArchivistaDocumentoMezzoBridge
          destinationOptions={archivistaLibrettoDestinationOptions}
          onSelectDestination={(destination) => {
            const nextDestination = mapArchivistaDestinationSelection(destination);
            if (!nextDestination) {
              return;
            }
            setTipo(nextDestination.tipo);
            setContesto(nextDestination.contesto);
          }}
          onSubtypeChange={setDocumentoMezzoSubtype}
          selectedSubtype={documentoMezzoSubtype}
        />
      </section>
    );
  }

  return (
    <section className="next-page internal-ai-page iai-page">
      <div className="iai-topbar">
        <span className="iai-topbar-label">IA 2</span>
        <Link
          to={NEXT_IA_DOCUMENTI_PATH}
          className="iai-btn-storico"
          title="Vai allo storico documenti"
        >
          Vai a storico →
        </Link>
      </div>

      <header className="iai-hero">
        <h1>Importa documenti</h1>
        <p className="iai-sec-label">Upload e conferma documentale in un'unica schermata.</p>
      </header>

      <div className="iai-content">
        <article className="iai-card">
          <div className="iai-sec-label">DESTINAZIONE RILEVATA</div>
          <div className="iai-dest-row">
            <div className="iai-dest-badge">
              <span className="iai-dest-dot" aria-hidden="true" />
              <span className="iai-dest-name">{currentTypeLabel}</span>
              <span className="iai-dest-arrow" aria-hidden="true">
                →
              </span>
              <span className="iai-dest-ctx">{currentContextLabel}</span>
            </div>
            <details className="iai-dest-control">
              <summary className="iai-btn-cambia">Destinazione errata? Cambia ▾</summary>
              <div className="iai-dest-dropdown">
                {DESTINATION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="iai-dd-item"
                    onClick={() => {
                      setTipo(option.tipo);
                      setContesto(option.contesto);
                    }}
                    title={FLOW_MATRIX[buildFlowKey(option.tipo, option.contesto)]?.descrizione}
                    disabled={option.availability !== "active"}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </details>
            <span className="iai-chip-badge">{activeFlow.badge}</span>
          </div>
        </article>

        <div className="ia-archivista__bridge-host">
          {activeFlow.availability === "active" && tipo === "fattura_ddt" && contesto === "magazzino" ? (
            <ArchivistaMagazzinoBridge />
          ) : activeFlow.availability === "active" &&
            tipo === "fattura_ddt" &&
            contesto === "manutenzione" ? (
              <ArchivistaManutenzioneBridge />
          ) : activeFlow.availability === "active" &&
            tipo === "documento_mezzo" &&
            contesto === "documento_mezzo" ? (
              <ArchivistaDocumentoMezzoBridge
                destinationOptions={archivistaLibrettoDestinationOptions}
                onSelectDestination={(destination) => {
                  const nextDestination = mapArchivistaDestinationSelection(destination);
                  if (!nextDestination) {
                    return;
                  }
                  setTipo(nextDestination.tipo);
                  setContesto(nextDestination.contesto);
                }}
                onSubtypeChange={setDocumentoMezzoSubtype}
                selectedSubtype={documentoMezzoSubtype}
              />
          ) : activeFlow.availability === "active" &&
              tipo === "preventivo" &&
              contesto === "magazzino" ? (
            <ArchivistaPreventivoMagazzinoBridge />
          ) : activeFlow.availability === "active" &&
            tipo === "preventivo" &&
            contesto === "manutenzione" ? (
            <ArchivistaPreventivoManutenzioneBridge />
          ) : (
            <div className={`iai-card ia-archivista__inactive-shell ${getAvailabilityClass(activeFlow.availability)}`}>
              <div className="iai-righe-header">
                <div>
                  <p className="iai-sec-label">Ramo non attivo</p>
                  <strong>{activeFlow.titolo}</strong>
                </div>
              </div>
              <p className="iai-upload-hint">{activeFlow.descrizione}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
