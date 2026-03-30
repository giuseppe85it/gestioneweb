/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState } from "react";
import "../../pages/ModalGomme.css";
import TruckGommeSvg from "../../components/TruckGommeSvg";
import { wheelGeom, type WheelPoint } from "../../components/wheels";

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

type ModalGommeProps = {
  open: boolean;
  targa: string;
  categoria?: string;
  kmIniziale?: string;
  enableCalibration?: boolean;
  onClose: () => void;
  onConfirm: (data: CambioGommeData) => void;
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

type TruckWheelGeom = {
  id: string;
  axisId: string;
  x: number;
  y: number;
};

type WheelOverridePoint = { x: number; y: number };
type WheelOverrideSide = Record<string, WheelOverridePoint>;
type WheelOverrideEntry = { dx?: WheelOverrideSide; sx?: WheelOverrideSide };
type WheelOverrideStore = Record<string, WheelOverrideEntry>;

const OVERRIDE_KEY = "@wheelGeom_override_v1";

function buildConfig(categoria?: string): ConfigGomme {
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
    cat.includes("rimorchio")
    || cat.includes("porta silo container")
    || cat.includes("pianale")
    || cat.includes("centina")
    || cat.includes("vasca")
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
  if (cat.includes("porta silo container")) return "semirimorchioSterzante";
  if (cat.includes("semirimorchio") && cat.includes("sterz")) return "semirimorchioSterzante";
  if (cat.includes("semirimorchio")) return "semirimorchioFissi";
  if (cat.includes("trattore")) return "trattore";
  return undefined;
}

function buildWheelsForSvg(config: ConfigGomme, points: WheelPoint[], key: string): TruckWheelGeom[] {
  if (!config.assi.length || !points.length) return [];

  const totalPoints = points.length;
  let perSideCounts = config.assi.map((asse) => Math.max(1, Math.round(asse.wheelsCount / 2)));
  const sum = perSideCounts.reduce((acc, value) => acc + value, 0);

  if (sum !== totalPoints) {
    const base = Math.floor(totalPoints / config.assi.length);
    const rest = totalPoints % config.assi.length;
    perSideCounts = config.assi.map((_, index) => base + (index < rest ? 1 : 0));
  }

  const result: TruckWheelGeom[] = [];
  let cursor = 0;
  config.assi.forEach((asse, axisIndex) => {
    const count = perSideCounts[axisIndex];
    for (let index = 0; index < count && cursor < totalPoints; index += 1, cursor += 1) {
      const point = points[cursor];
      result.push({
        id: `${key}-${asse.id}-${cursor}`,
        axisId: asse.id,
        x: point.cx,
        y: point.cy,
      });
    }
  });

  return result;
}

export default function NextModalGomme({
  open,
  targa,
  categoria,
  kmIniziale,
  enableCalibration = true,
  onClose,
  onConfirm,
}: ModalGommeProps) {
  const [modalita, setModalita] = useState<ModalitaCambioGomme>("ordinario");
  const [selectedAxisId, setSelectedAxisId] = useState<string | null>(null);
  const [selectedWheelIds, setSelectedWheelIds] = useState<string[]>([]);
  const [marca, setMarca] = useState("");
  const [km, setKm] = useState(kmIniziale || "");
  const [lato, setLato] = useState<"dx" | "sx">("dx");
  const [calibra, setCalibra] = useState(false);
  const [draggingWheelId, setDraggingWheelId] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<WheelOverrideStore>({});
  const [overrideDraft, setOverrideDraft] = useState<WheelOverrideSide>({});
  const svgRef = useRef<SVGSVGElement | null>(null);

  const config = useMemo(() => buildConfig(categoria), [categoria]);
  const geomKey = useMemo(() => resolveWheelGeomKey(categoria), [categoria]);

  const isRimorchio = useMemo(
    () => config.tipoLabel.toLowerCase().includes("rimorchio"),
    [config.tipoLabel],
  );

  const { wheelsSvg, backgroundImage } = useMemo(() => {
    if (!geomKey) {
      return { wheelsSvg: [] as TruckWheelGeom[], backgroundImage: "" };
    }

    const entry = wheelGeom[geomKey];
    const points = lato === "dx" ? entry.dx : entry.sx;
    const baseWheels = buildWheelsForSvg(config, points, geomKey);
    const sideOverrides = enableCalibration && calibra
      ? overrideDraft
      : overrides[geomKey]?.[lato] || {};
    const wheels = baseWheels.map((wheel) => {
      const override = sideOverrides[wheel.id];
      return override ? { ...wheel, x: override.x, y: override.y } : wheel;
    });

    const imageName = lato === "dx" ? entry.imageDX : entry.imageSX;
    const bg = imageName && !imageName.startsWith("/") ? `/gomme/${imageName}` : imageName || "";

    return { wheelsSvg: wheels, backgroundImage: bg };
  }, [calibra, config, enableCalibration, geomKey, lato, overrideDraft, overrides]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(OVERRIDE_KEY);
      const parsed = raw ? (JSON.parse(raw) as WheelOverrideStore) : {};
      setOverrides(parsed || {});
    } catch {
      setOverrides({});
    }
    setModalita("ordinario");
    setSelectedAxisId(null);
    setSelectedWheelIds([]);
    setMarca("");
    setKm(kmIniziale || "");
    setLato("dx");
    setCalibra(false);
    setDraggingWheelId(null);
  }, [kmIniziale, open]);

  useEffect(() => {
    if (!enableCalibration || !calibra || !geomKey) {
      setOverrideDraft({});
      return;
    }

    const current = overrides[geomKey]?.[lato];
    setOverrideDraft(current ? { ...current } : {});
  }, [calibra, enableCalibration, geomKey, lato, overrides]);

  useEffect(() => {
    if (!enableCalibration || !calibra || !draggingWheelId) {
      return;
    }

    const toSvgCoords = (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const vb = svg.viewBox?.baseVal;
      const width = vb?.width || 360;
      const height = vb?.height || 180;
      let x = ((clientX - rect.left) * width) / rect.width;
      let y = ((clientY - rect.top) * height) / rect.height;
      x = Math.max(0, Math.min(width, x));
      y = Math.max(0, Math.min(height, y));
      return { x, y };
    };

    const onMove = (event: PointerEvent) => {
      const position = toSvgCoords(event.clientX, event.clientY);
      if (!position) return;
      setOverrideDraft((current) => ({
        ...current,
        [draggingWheelId]: position,
      }));
    };

    const onUp = () => setDraggingWheelId(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [calibra, draggingWheelId, enableCalibration]);

  if (!open) {
    return null;
  }

  const selectedAxis = config.assi.find((asse) => asse.id === selectedAxisId) ?? null;
  const selectedCount = selectedWheelIds.length;

  function toggleWheelSelection(wheelId: string) {
    if (modalita === "ordinario" && selectedAxisId) {
      setSelectedWheelIds((current) =>
        current.includes(wheelId) ? current.filter((entry) => entry !== wheelId) : [...current, wheelId],
      );
      return;
    }

    setSelectedWheelIds((current) =>
      current.includes(wheelId) ? current.filter((entry) => entry !== wheelId) : [...current, wheelId],
    );
  }

  function handleConfirm() {
    if (!selectedAxis) {
      return;
    }

    onConfirm({
      targa,
      categoria,
      modalita,
      asseId: selectedAxis.id,
      asseLabel: selectedAxis.label,
      numeroGomme: selectedCount,
      gommeIds: selectedWheelIds,
      marca: marca.trim(),
      km: km.trim(),
    });
  }

  function handleSaveCalibration() {
    if (!geomKey) return;
    const nextOverrides: WheelOverrideStore = {
      ...overrides,
      [geomKey]: {
        ...(overrides[geomKey] || {}),
        [lato]: overrideDraft,
      },
    };
    setOverrides(nextOverrides);
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(nextOverrides));
    setCalibra(false);
  }

  return (
    <div className="mg-backdrop">
      <div className="mg-modal">
        <div className="mg-topbar">
          <div>
            <div className="mg-title">Selezione gomme</div>
            <div className="mg-subtitle">
              {targa} · {categoria || "Categoria non disponibile"}
            </div>
          </div>
          <button type="button" className="mg-close" onClick={onClose}>
            Chiudi
          </button>
        </div>

        <div className="mg-toolbar">
          <label>
            Modalita
            <select value={modalita} onChange={(event) => setModalita(event.target.value as ModalitaCambioGomme)}>
              <option value="ordinario">Ordinario</option>
              <option value="straordinario">Straordinario</option>
            </select>
          </label>
          <label>
            KM
            <input value={km} onChange={(event) => setKm(event.target.value)} />
          </label>
          <label>
            Marca
            <input value={marca} onChange={(event) => setMarca(event.target.value)} />
          </label>
          <label>
            Asse
            <select
              value={selectedAxisId ?? ""}
              onChange={(event) => {
                setSelectedAxisId(event.target.value || null);
                setSelectedWheelIds([]);
              }}
            >
              <option value="">Seleziona asse</option>
              {config.assi.map((asse) => (
                <option key={asse.id} value={asse.id}>
                  {asse.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Lato
            <select value={lato} onChange={(event) => setLato(event.target.value as "dx" | "sx")}>
              <option value="dx">DX</option>
              <option value="sx">SX</option>
            </select>
          </label>
          {enableCalibration ? (
            <label className="mg-checkbox">
              <input type="checkbox" checked={calibra} onChange={(event) => setCalibra(event.target.checked)} />
              Calibrazione
            </label>
          ) : null}
          {calibra ? (
            <button type="button" onClick={handleSaveCalibration}>
              Salva calibrazione
            </button>
          ) : null}
        </div>

        <div className="mg-content">
          {backgroundImage ? (
            <TruckGommeSvg
              svgRef={svgRef}
              isRimorchio={isRimorchio}
              backgroundImage={backgroundImage}
              wheels={wheelsSvg}
              selectedWheelIds={selectedWheelIds}
              selectedAxisId={selectedAxisId}
              modalita={modalita}
              calibraActive={calibra}
              draggingWheelId={draggingWheelId}
              onWheelPointerDown={(wheelId) => setDraggingWheelId(wheelId)}
              onToggleWheel={toggleWheelSelection}
            />
          ) : (
            <div className="mg-empty">Categoria non supportata per il disegno gomme.</div>
          )}
        </div>

        <div className="mg-footer">
          <div className="mg-selection">
            {selectedAxis ? `Asse: ${selectedAxis.label}` : "Seleziona un asse"}
            {" · "}
            {selectedCount > 0 ? `${selectedCount} gomme selezionate` : "nessuna gomma selezionata"}
          </div>
          <div className="mg-actions">
            <button type="button" onClick={onClose}>
              Annulla
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedAxis || selectedWheelIds.length === 0 || !km.trim()}
            >
              Conferma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
