import { useEffect, useMemo, useState } from "react";
import "./ModalGomme.css";
import TruckGommeSvg from "../components/TruckGommeSvg";
import { wheelGeom, type WheelPoint } from "../components/wheels";

export type ModalitaCambioGomme = "ordinario" | "straordinario";

export interface CambioGommeData {
  targa: string;
  categoria?: string;
  modalita: ModalitaCambioGomme;
  asseId: string | null;
  asseLabel: string | null;
  numeroGomme: number;
  gommeIds: string[];
  marca: string;
  km: string;
}

interface ModalGommeProps {
  open: boolean;
  targa: string;
  categoria?: string;
  kmIniziale?: string;
  onClose: () => void;
  onConfirm: (data: CambioGommeData) => void;
}

interface AsseConfig {
  id: string;
  label: string;
  wheelsCount: number; // 2 o 4 (totale asse)
}

interface ConfigGomme {
  tipoLabel: string;
  assi: AsseConfig[];
}

// Costruisce la configurazione assi/gomme in base alla categoria del mezzo
function buildConfig(categoria?: string): ConfigGomme {
  const cat = (categoria || "").toLowerCase();

  let config: ConfigGomme = {
    tipoLabel: categoria || "Mezzo",
    assi: [],
  };

  if (cat.includes("trattore")) {
    config = {
      tipoLabel: "Trattore",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "posteriore", label: "Posteriore", wheelsCount: 4 },
      ],
    };
  } else if (cat.includes("motrice 4")) {
    config = {
      tipoLabel: "Motrice 4 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1° asse", wheelsCount: 2 },
        { id: "asse2", label: "2° asse", wheelsCount: 4 },
        { id: "asse3", label: "3° asse", wheelsCount: 4 },
      ],
    };
  } else if (cat.includes("motrice 3")) {
    config = {
      tipoLabel: "Motrice 3 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1° asse", wheelsCount: 4 },
        { id: "asse2", label: "2° asse", wheelsCount: 2 },
      ],
    };
  } else if (cat.includes("motrice 2")) {
    config = {
      tipoLabel: "Motrice 2 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1° asse", wheelsCount: 4 },
      ],
    };
  } else if (cat.includes("biga")) {
    // biga = rimorchio 2 assi, 2 gomme per lato
    config = {
      tipoLabel: "Rimorchio 2 assi",
      assi: [
        { id: "asse1", label: "1° asse", wheelsCount: 4 },
        { id: "asse2", label: "2° asse", wheelsCount: 4 },
      ],
    };
  } else if (
    cat.includes("rimorchio") || // include "semirimorchio"
    cat.includes("pianale") ||
    cat.includes("centina") ||
    cat.includes("vasca")
  ) {
    // semirimorchi 3 assi
    config = {
      tipoLabel: "Rimorchio 3 assi",
      assi: [
        { id: "asse1", label: "1° asse", wheelsCount: 4 },
        { id: "asse2", label: "2° asse", wheelsCount: 4 },
        { id: "asse3", label: "3° asse", wheelsCount: 4 },
      ],
    };
  }

  return config;
}

type WheelGeomKey = keyof typeof wheelGeom;

function resolveWheelGeomKey(categoria?: string): WheelGeomKey | undefined {
  const cat = (categoria || "").toLowerCase();
  if (!cat) return undefined;

  if (cat.includes("motrice 4")) return "motrice4assi";
  if (cat.includes("motrice 3")) return "motrice3assi";
  if (cat.includes("motrice 2")) return "motrice2assi";
  if (cat.includes("biga")) return "biga";
  if (cat.includes("pianale")) return "pianale";
  if (cat.includes("vasca")) return "vasca";
  if (cat.includes("centina")) return "centina";
  if (cat.includes("semirimorchio") && cat.includes("sterz"))
    return "semirimorchioSterzante";
  if (cat.includes("semirimorchio")) return "semirimorchioFissi";
  if (cat.includes("trattore")) return "trattore";

  return undefined;
}

// Distribuisce i punti ruota (per lato) sugli assi definiti in config.assi
interface TruckWheelGeom {
  id: string;
  axisId: string;
  x: number;
  y: number;
}

function buildWheelsForSvg(
  config: ConfigGomme,
  points: WheelPoint[],
  key: string
): TruckWheelGeom[] {
  if (!config.assi.length || !points.length) return [];

  const totalPoints = points.length;

  // stima gomme per lato per asse (wheelsCount è totale asse → /2)
  let perSideCounts = config.assi.map((a) =>
    Math.max(1, Math.round(a.wheelsCount / 2))
  );
  const sum = perSideCounts.reduce((a, b) => a + b, 0);

  if (sum !== totalPoints) {
    // fallback: distribuisci i punti in modo uniforme tra gli assi
    const base = Math.floor(totalPoints / config.assi.length);
    const rest = totalPoints % config.assi.length;
    perSideCounts = config.assi.map((_, idx) => base + (idx < rest ? 1 : 0));
  }

  const result: TruckWheelGeom[] = [];
  let idx = 0;

  config.assi.forEach((asse, axisIndex) => {
    const count = perSideCounts[axisIndex];
    for (let i = 0; i < count && idx < totalPoints; i++, idx++) {
      const p = points[idx];
      result.push({
        id: `${key}-${asse.id}-${idx}`,
        axisId: asse.id,
        x: p.cx,
        y: p.cy,
      });
    }
  });

  return result;
}

const ModalGomme: React.FC<ModalGommeProps> = ({
  open,
  targa,
  categoria,
  kmIniziale,
  onClose,
  onConfirm,
}) => {
  const [modalita, setModalita] = useState<ModalitaCambioGomme>("ordinario");
  const [selectedAxisId, setSelectedAxisId] = useState<string | null>(null);
  const [selectedWheelIds, setSelectedWheelIds] = useState<string[]>([]);
  const [marca, setMarca] = useState("");
  const [km, setKm] = useState(kmIniziale || "");
  const [lato, setLato] = useState<"dx" | "sx">("dx");

  const config = useMemo(() => buildConfig(categoria), [categoria]);

  const isRimorchio = useMemo(
    () => config.tipoLabel.toLowerCase().includes("rimorchio"),
    [config.tipoLabel]
  );

  const { wheelsSvg, backgroundImage } = useMemo(() => {
    const key = resolveWheelGeomKey(categoria);
    if (!key) {
      return {
        wheelsSvg: [] as TruckWheelGeom[],
        backgroundImage: "",
      };
    }

    const entry = wheelGeom[key];
    const points = lato === "dx" ? entry.dx : entry.sx;
    const wheels = buildWheelsForSvg(config, points, key);

    const imgName = lato === "dx" ? entry.imageDX : entry.imageSX;
    const bg =
      imgName && !imgName.startsWith("/")
        ? `/gomme/${imgName}`
        : imgName || "";

    return {
      wheelsSvg: wheels,
      backgroundImage: bg,
    };
  }, [categoria, lato, config]);

  // default selezione asse / ruote
  useEffect(() => {
    if (!config.assi.length || !wheelsSvg.length) return;

    const firstAxisId = config.assi[0].id;
    setSelectedAxisId(firstAxisId);

    if (modalita === "ordinario") {
      const wheelsForAxis = wheelsSvg
        .filter((w) => w.axisId === firstAxisId)
        .map((w) => w.id);
      setSelectedWheelIds(wheelsForAxis);
    } else {
      setSelectedWheelIds([]);
    }
  }, [config, wheelsSvg, modalita]);

  if (!open) return null;

  const handleSelectAxis = (axisId: string) => {
    setSelectedAxisId(axisId);
    if (modalita === "ordinario") {
      const wheelsForAxis = wheelsSvg
        .filter((w) => w.axisId === axisId)
        .map((w) => w.id);
      setSelectedWheelIds(wheelsForAxis);
    }
  };

  const handleToggleWheel = (wheelId: string) => {
    if (modalita === "ordinario") return;
    setSelectedWheelIds((prev) =>
      prev.includes(wheelId)
        ? prev.filter((id) => id !== wheelId)
        : [...prev, wheelId]
    );
  };

  const numeroGomme = selectedWheelIds.length;

  const handleConfirm = () => {
    if (!numeroGomme) return;

    const axis =
      selectedAxisId != null
        ? config.assi.find((a) => a.id === selectedAxisId) || null
        : null;

    const data: CambioGommeData = {
      targa,
      categoria,
      modalita,
      asseId: selectedAxisId,
      asseLabel: axis ? axis.label : null,
      numeroGomme,
      gommeIds: selectedWheelIds,
      marca: marca.trim(),
      km: km.trim(),
    };

    onConfirm(data);
  };

  const titolo =
    config.tipoLabel && config.tipoLabel !== "Mezzo"
      ? `Gestione gomme – ${config.tipoLabel}`
      : "Gestione gomme";

  return (
    <div className="mg-overlay">
      <div className="mg-modal">
        <div className="mg-header">
          <div>
            <div className="mg-subtitle">Targa</div>
            <div className="mg-targa">{targa}</div>
          </div>
          <div className="mg-header-title">{titolo}</div>
          <button className="mg-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mg-body">
          {/* Modalità */}
          <div className="mg-row mg-mode-row">
            <label className="mg-radio">
              <input
                type="radio"
                value="ordinario"
                checked={modalita === "ordinario"}
                onChange={() => setModalita("ordinario")}
              />
              <span>Cambio ordinario (asse completo)</span>
            </label>
            <label className="mg-radio">
              <input
                type="radio"
                value="straordinario"
                checked={modalita === "straordinario"}
                onChange={() => setModalita("straordinario")}
              />
              <span>Straordinario (foratura / singola gomma)</span>
            </label>
          </div>

          {/* Selettore lato */}
          <div className="mg-row mg-side-row">
            <button
              type="button"
              className={
                "mg-side-btn" + (lato === "dx" ? " mg-side-btn-active" : "")
              }
              onClick={() => setLato("dx")}
            >
              Lato destro
            </button>
            <button
              type="button"
              className={
                "mg-side-btn" + (lato === "sx" ? " mg-side-btn-active" : "")
              }
              onClick={() => setLato("sx")}
            >
              Lato sinistro
            </button>
          </div>

          <div className="mg-main">
            {/* SVG camion / rimorchio con immagine tecnica */}
            <div className="mg-svg-wrapper">
              <TruckGommeSvg
                isRimorchio={isRimorchio}
                backgroundImage={backgroundImage}
                wheels={wheelsSvg}
                selectedWheelIds={selectedWheelIds}
                selectedAxisId={selectedAxisId}
                modalita={modalita}
                onToggleWheel={handleToggleWheel}
              />

              {/* legenda assi */}
              <div className="mg-axis-list">
                {config.assi.map((asse) => {
                  const wheelsForAxis = wheelsSvg.filter(
                    (w) => w.axisId === asse.id
                  );
                  const anySelected =
                    modalita === "ordinario"
                      ? selectedAxisId === asse.id
                      : wheelsForAxis.some((w) =>
                          selectedWheelIds.includes(w.id)
                        );

                  return (
                    <button
                      key={asse.id}
                      type="button"
                      className={
                        "mg-axis-item" +
                        (anySelected ? " mg-axis-item-active" : "")
                      }
                      onClick={() => handleSelectAxis(asse.id)}
                    >
                      <span className="mg-axis-label">{asse.label}</span>
                      <span className="mg-axis-wheels">
                        {wheelsForAxis.map((w) => {
                          const sel = selectedWheelIds.includes(w.id);
                          return (
                            <span
                              key={w.id}
                              className={
                                "mg-axis-dot" +
                                (sel ? " mg-axis-dot-active" : "")
                              }
                            />
                          );
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* pannello dati */}
            <div className="mg-panel">
              <div className="mg-field">
                <label className="mg-label">Asse selezionato</label>
                <div className="mg-value">
                  {selectedAxisId
                    ? config.assi.find((a) => a.id === selectedAxisId)?.label ||
                      "-"
                    : "-"}
                </div>
              </div>

              <div className="mg-field">
                <label className="mg-label">Numero gomme cambiate</label>
                <div className="mg-value">{numeroGomme || "-"}</div>
              </div>

              <div className="mg-field">
                <label className="mg-label">Marca gomme</label>
                <input
                  className="mg-input"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Es. MICHELIN X MULTI..."
                />
              </div>

              <div className="mg-field">
                <label className="mg-label">Km mezzo</label>
                <input
                  className="mg-input"
                  value={km}
                  onChange={(e) => setKm(e.target.value)}
                  placeholder="Es. 325000"
                  inputMode="numeric"
                />
              </div>

              <div className="mg-hint">
                I costi verranno associati tramite fattura e IA, in base alla
                targa.
              </div>
            </div>
          </div>
        </div>

        <div className="mg-footer">
          <button className="mg-btn ghost" onClick={onClose}>
            Annulla
          </button>
          <button
            className="mg-btn primary"
            onClick={handleConfirm}
            disabled={!numeroGomme}
          >
            Conferma cambio gomme
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalGomme;
