import { useMemo, useState } from "react";
import TruckGommeSvg from "../../components/TruckGommeSvg";
import { wheelGeom, type WheelPoint } from "../../components/wheels";
import "./next-modal-gomme.css";

export type NextModalitaCambioGomme = "ordinario" | "straordinario";
export type NextGommeSelectionSide = "destra" | "sinistra";

export type NextGommeSelectionV2Wheel = {
  id: string;
  lato: NextGommeSelectionSide;
  posizione: number;
};

export type NextGommeSelectionV2 = {
  versione: 2;
  asseId: string;
  ruote: NextGommeSelectionV2Wheel[];
};

export interface NextCambioGommeData {
  targa: string;
  categoria?: string;
  modalita: NextModalitaCambioGomme;
  asseId: string | null;
  asseLabel: string | null;
  numeroGomme: number;
  gommeIds: string[];
  marca: string;
  km: string;
  selezioneGommeV2: NextGommeSelectionV2 | null;
}

type NextModalGommeProps = {
  open: boolean;
  targa: string;
  categoria?: string | null;
  kmIniziale?: string;
  defaultModalita?: NextModalitaCambioGomme;
  initialData?: NextCambioGommeData | null;
  onClose: () => void;
  onConfirm: (data: NextCambioGommeData) => void;
};

type AsseConfig = {
  id: string;
  label: string;
  wheelsCount: number;
};

type ConfigGomme = {
  tipoLabel: string;
  assi: AsseConfig[];
};

type WheelGeomKey = keyof typeof wheelGeom;

type TruckWheelGeom = {
  id: string;
  axisId: string;
  x: number;
  y: number;
  lato: NextGommeSelectionSide;
  posizione: number;
};

function buildConfig(categoria?: string | null): ConfigGomme {
  const cat = (categoria || "").toLowerCase();

  if (cat.includes("trattore")) {
    return {
      tipoLabel: "Trattore",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "posteriore", label: "Posteriore", wheelsCount: 4 },
      ],
    };
  }

  if (cat.includes("motrice 4")) {
    return {
      tipoLabel: "Motrice 4 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 2 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
        { id: "asse3", label: "3 asse", wheelsCount: 4 },
      ],
    };
  }

  if (cat.includes("motrice 3")) {
    return {
      tipoLabel: "Motrice 3 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 2 },
      ],
    };
  }

  if (cat.includes("motrice 2")) {
    return {
      tipoLabel: "Motrice 2 assi",
      assi: [
        { id: "anteriore", label: "Anteriore", wheelsCount: 2 },
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
      ],
    };
  }

  if (cat.includes("biga")) {
    return {
      tipoLabel: "Rimorchio 2 assi",
      assi: [
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
      ],
    };
  }

  if (
    cat.includes("rimorchio") ||
    cat.includes("porta silo container") ||
    cat.includes("pianale") ||
    cat.includes("centina") ||
    cat.includes("vasca")
  ) {
    return {
      tipoLabel: "Rimorchio 3 assi",
      assi: [
        { id: "asse1", label: "1 asse", wheelsCount: 4 },
        { id: "asse2", label: "2 asse", wheelsCount: 4 },
        { id: "asse3", label: "3 asse", wheelsCount: 4 },
      ],
    };
  }

  return {
    tipoLabel: categoria || "Mezzo",
    assi: [],
  };
}

function resolveWheelGeomKey(categoria?: string | null): WheelGeomKey | undefined {
  const cat = (categoria || "").toLowerCase();
  if (cat.includes("trattore")) return "trattore";
  if (cat.includes("motrice 4")) return "motrice4assi";
  if (cat.includes("motrice 3")) return "motrice3assi";
  if (cat.includes("motrice 2")) return "motrice2assi";
  if (cat.includes("biga")) return "biga";
  if (cat.includes("semirimorchio")) return "semirimorchioFissi";
  if (
    cat.includes("rimorchio") ||
    cat.includes("porta silo container") ||
    cat.includes("pianale") ||
    cat.includes("centina") ||
    cat.includes("vasca")
  ) {
    return "semirimorchioFissi";
  }
  return undefined;
}

function buildWheelsForSvg(
  config: ConfigGomme,
  points: WheelPoint[],
  key: string,
  lato: NextGommeSelectionSide,
): TruckWheelGeom[] {
  if (!config.assi.length || !points.length) return [];

  const totalPoints = points.length;
  let perSideCounts = config.assi.map((asse) => Math.max(1, Math.round(asse.wheelsCount / 2)));
  const sum = perSideCounts.reduce((total, count) => total + count, 0);

  if (sum !== totalPoints) {
    const base = Math.floor(totalPoints / config.assi.length);
    const rest = totalPoints % config.assi.length;
    perSideCounts = config.assi.map((_, index) => base + (index < rest ? 1 : 0));
  }

  const result: TruckWheelGeom[] = [];
  let cursor = 0;

  config.assi.forEach((asse, axisIndex) => {
    const count = perSideCounts[axisIndex];
    for (let position = 0; position < count && cursor < totalPoints; position += 1, cursor += 1) {
      const point = points[cursor];
      result.push({
        id: `${key}-${lato}-${asse.id}-${cursor}`,
        axisId: asse.id,
        x: point.cx,
        y: point.cy,
        lato,
        posizione: cursor,
      });
    }
  });

  return result;
}

function buildSelectionForAxis(axisId: string, wheels: TruckWheelGeom[]): string[] {
  return wheels.filter((wheel) => wheel.axisId === axisId).map((wheel) => wheel.id);
}

function normalizeInitialIds(initialData: NextCambioGommeData | null | undefined): string[] {
  if (!initialData) return [];
  if (initialData.selezioneGommeV2?.ruote?.length) {
    return initialData.selezioneGommeV2.ruote.map((wheel) => wheel.id);
  }
  return initialData.gommeIds ?? [];
}

export default function NextModalGomme({
  open,
  targa,
  categoria,
  kmIniziale,
  defaultModalita = "ordinario",
  initialData,
  onClose,
  onConfirm,
}: NextModalGommeProps) {
  const config = useMemo(() => buildConfig(categoria), [categoria]);
  const geomKey = useMemo(() => resolveWheelGeomKey(categoria), [categoria]);
  const isRimorchio = useMemo(
    () => config.tipoLabel.toLowerCase().includes("rimorchio"),
    [config.tipoLabel],
  );

  const allWheels = useMemo(() => {
    if (!geomKey) return { dx: [] as TruckWheelGeom[], sx: [] as TruckWheelGeom[], all: [] as TruckWheelGeom[] };
    const entry = wheelGeom[geomKey];
    const dx = buildWheelsForSvg(config, entry.dx, geomKey, "destra");
    const sx = buildWheelsForSvg(config, entry.sx, geomKey, "sinistra");
    return { dx, sx, all: [...dx, ...sx] };
  }, [config, geomKey]);

  const initialAxisId = initialData?.asseId ?? config.assi[0]?.id ?? null;
  const initialSelectedIds = normalizeInitialIds(initialData);
  const [modalita, setModalita] = useState<NextModalitaCambioGomme>(initialData?.modalita ?? defaultModalita);
  const [selectedAxisId, setSelectedAxisId] = useState<string | null>(initialAxisId);
  const [selectedWheelIds, setSelectedWheelIds] = useState<string[]>(
    initialSelectedIds.length > 0
      ? initialSelectedIds
      : initialAxisId
        ? buildSelectionForAxis(initialAxisId, allWheels.all)
        : [],
  );
  const [marca, setMarca] = useState(initialData?.marca ?? "");
  const [km, setKm] = useState(initialData?.km || kmIniziale || "");
  const [lato, setLato] = useState<"dx" | "sx">("dx");

  const wheelsSvg = lato === "dx" ? allWheels.dx : allWheels.sx;
  const backgroundImage = useMemo(() => {
    if (!geomKey) return "";
    const entry = wheelGeom[geomKey];
    const imageName = lato === "dx" ? entry.imageDX : entry.imageSX;
    return imageName && !imageName.startsWith("/") ? `/gomme/${imageName}` : imageName || "";
  }, [geomKey, lato]);

  if (!open) return null;

  const handleSelectAxis = (axisId: string) => {
    setSelectedAxisId(axisId);
    if (modalita === "ordinario") {
      setSelectedWheelIds(buildSelectionForAxis(axisId, allWheels.all));
    }
  };

  const handleToggleWheel = (wheelId: string) => {
    if (modalita === "ordinario") return;
    setSelectedWheelIds((current) =>
      current.includes(wheelId)
        ? current.filter((entry) => entry !== wheelId)
        : [...current, wheelId],
    );
  };

  const selectedWheelSet = new Set(selectedWheelIds);
  const numeroGomme = selectedWheelIds.length;

  const buildSelectionV2 = (): NextGommeSelectionV2 | null => {
    if (!selectedAxisId || selectedWheelIds.length === 0) return null;
    const wheelsById = new Map(allWheels.all.map((wheel) => [wheel.id, wheel] as const));
    const ruote = selectedWheelIds
      .map((id) => wheelsById.get(id))
      .filter((wheel): wheel is TruckWheelGeom => Boolean(wheel))
      .map((wheel) => ({
        id: wheel.id,
        lato: wheel.lato,
        posizione: wheel.posizione,
      }));
    if (ruote.length !== selectedWheelIds.length) return null;
    return {
      versione: 2,
      asseId: selectedAxisId,
      ruote,
    };
  };

  const handleConfirm = () => {
    if (!numeroGomme) return;
    const axis = selectedAxisId ? config.assi.find((entry) => entry.id === selectedAxisId) ?? null : null;
    onConfirm({
      targa,
      categoria: categoria ?? undefined,
      modalita,
      asseId: selectedAxisId,
      asseLabel: axis?.label ?? null,
      numeroGomme,
      gommeIds: selectedWheelIds,
      marca: marca.trim(),
      km: km.trim(),
      selezioneGommeV2: buildSelectionV2(),
    });
  };

  const titolo =
    config.tipoLabel && config.tipoLabel !== "Mezzo"
      ? `Gestione gomme - ${config.tipoLabel}`
      : "Gestione gomme";

  return (
    <div className="next-modal-gomme mg-overlay">
      <div className="mg-modal">
        <div className="mg-header">
          <div>
            <div className="mg-subtitle">Targa</div>
            <div className="mg-targa">{targa}</div>
          </div>
          <div className="mg-header-title">{titolo}</div>
          <button type="button" className="mg-close-btn" onClick={onClose} aria-label="Chiudi selezione gomme">
            x
          </button>
        </div>

        <div className="mg-body">
          <div className="mg-row mg-mode-row">
            <label className="mg-radio">
              <input
                type="radio"
                value="ordinario"
                checked={modalita === "ordinario"}
                onChange={() => {
                  const axisId = selectedAxisId ?? config.assi[0]?.id ?? null;
                  setModalita("ordinario");
                  if (axisId) {
                    setSelectedAxisId(axisId);
                    setSelectedWheelIds(buildSelectionForAxis(axisId, allWheels.all));
                  }
                }}
              />
              <span>Cambio ordinario (asse completo)</span>
            </label>
            <label className="mg-radio">
              <input
                type="radio"
                value="straordinario"
                checked={modalita === "straordinario"}
                onChange={() => {
                  setModalita("straordinario");
                  setSelectedWheelIds([]);
                }}
              />
              <span>Straordinario (foratura / singola gomma)</span>
            </label>
          </div>

          {modalita === "straordinario" ? (
            <div className="mg-row mg-side-row">
              <button
                type="button"
                className={`mg-side-btn${lato === "dx" ? " mg-side-btn-active" : ""}`}
                onClick={() => setLato("dx")}
              >
                Lato destro
              </button>
              <button
                type="button"
                className={`mg-side-btn${lato === "sx" ? " mg-side-btn-active" : ""}`}
                onClick={() => setLato("sx")}
              >
                Lato sinistro
              </button>
            </div>
          ) : null}

          <div className="mg-main">
            <div className="mg-svg-wrapper">
              <TruckGommeSvg
                isRimorchio={isRimorchio}
                backgroundImage={backgroundImage}
                wheels={wheelsSvg}
                selectedWheelIds={selectedWheelIds}
                selectedAxisId={selectedAxisId}
                modalita={modalita}
                onToggleWheel={handleToggleWheel}
                calibraActive={false}
                draggingWheelId={null}
                onWheelPointerDown={() => undefined}
                svgRef={{ current: null }}
              />

              <div className="mg-axis-list">
                {config.assi.map((asse) => {
                  const wheelsForAxis = wheelsSvg.filter((wheel) => wheel.axisId === asse.id);
                  const anySelected =
                    modalita === "ordinario"
                      ? selectedAxisId === asse.id
                      : wheelsForAxis.some((wheel) => selectedWheelSet.has(wheel.id));

                  return (
                    <button
                      key={asse.id}
                      type="button"
                      className={`mg-axis-item${anySelected ? " mg-axis-item-active" : ""}`}
                      onClick={() => handleSelectAxis(asse.id)}
                    >
                      <span className="mg-axis-label">{asse.label}</span>
                      <span className="mg-axis-wheels">
                        {wheelsForAxis.map((wheel) => (
                          <span
                            key={wheel.id}
                            className={`mg-axis-dot${selectedWheelSet.has(wheel.id) ? " mg-axis-dot-active" : ""}`}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mg-panel">
              <div className="mg-field">
                <label className="mg-label">Asse selezionato</label>
                <div className="mg-value">
                  {selectedAxisId ? config.assi.find((asse) => asse.id === selectedAxisId)?.label || "-" : "-"}
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
                  onChange={(event) => setMarca(event.target.value)}
                  placeholder="Es. MICHELIN X MULTI..."
                />
              </div>

              <div className="mg-field">
                <label className="mg-label">Km mezzo</label>
                <input
                  className="mg-input"
                  value={km}
                  onChange={(event) => setKm(event.target.value)}
                  placeholder="Es. 325000"
                  inputMode="numeric"
                />
              </div>

              <div className="mg-hint">
                La selezione viene salvata sulla manutenzione e usata nel dettaglio tecnico gomme.
              </div>
            </div>
          </div>
        </div>

        <div className="mg-footer">
          <button type="button" className="mg-btn ghost" onClick={onClose}>
            Annulla
          </button>
          <button type="button" className="mg-btn primary" onClick={handleConfirm} disabled={!numeroGomme}>
            Conferma cambio gomme
          </button>
        </div>
      </div>
    </div>
  );
}
