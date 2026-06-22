import { useMemo, useState } from "react";
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
  assiIds?: string[];
  assiLabels?: string[];
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
  confirmLabel?: string;
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

type SideKey = "dx" | "sx";

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
  if (cat.includes("pianale")) return "pianale";
  if (cat.includes("vasca")) return "vasca";
  if (cat.includes("centina")) return "centina";
  if (cat.includes("porta silo container")) return "semirimorchioSterzante";
  if (cat.includes("semirimorchio") && cat.includes("sterz")) return "semirimorchioSterzante";
  if (cat.includes("semirimorchio")) return "semirimorchioFissi";
  if (cat.includes("rimorchio")) return "semirimorchioFissi";
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

function uniqueAxisIdsFromWheelIds(wheelIds: string[], wheels: TruckWheelGeom[]): string[] {
  const byId = new Map(wheels.map((wheel) => [wheel.id, wheel] as const));
  return Array.from(
    new Set(
      wheelIds
        .map((id) => byId.get(id)?.axisId ?? null)
        .filter((axisId): axisId is string => Boolean(axisId)),
    ),
  );
}

function normalizeInitialIds(initialData: NextCambioGommeData | null | undefined): string[] {
  if (!initialData) return [];
  if (initialData.selezioneGommeV2?.ruote?.length) {
    return initialData.selezioneGommeV2.ruote.map((wheel) => wheel.id);
  }
  return initialData.gommeIds ?? [];
}

function initialSideFromIds(ids: string[]): SideKey {
  return ids.some((id) => id.includes("-sinistra-")) ? "sx" : "dx";
}

function sideLabel(lato: NextGommeSelectionSide): string {
  return lato === "sinistra" ? "Sinistro" : "Destro";
}

function sideShortLabel(lato: NextGommeSelectionSide): string {
  return lato === "sinistra" ? "SX" : "DX";
}

function sideFromKey(side: SideKey): NextGommeSelectionSide {
  return side === "sx" ? "sinistra" : "destra";
}

function wheelOrderLabel(wheel: TruckWheelGeom, allWheels: TruckWheelGeom[]): string {
  const sameAxisSide = allWheels
    .filter((entry) => entry.axisId === wheel.axisId && entry.lato === wheel.lato)
    .sort((a, b) => a.posizione - b.posizione);
  if (sameAxisSide.length <= 1) return sideShortLabel(wheel.lato);
  const index = sameAxisSide.findIndex((entry) => entry.id === wheel.id);
  if (index === 0) return "Est";
  if (index === 1) return "Int";
  return String(index + 1);
}

function describeWheel(wheel: TruckWheelGeom, config: ConfigGomme, allWheels: TruckWheelGeom[]): string {
  const axisLabel = config.assi.find((asse) => asse.id === wheel.axisId)?.label ?? "Asse";
  const sameAxisSide = allWheels.filter((entry) => entry.axisId === wheel.axisId && entry.lato === wheel.lato);
  const order = sameAxisSide.length > 1 ? `${wheelOrderLabel(wheel, allWheels)} ` : "";
  return `${axisLabel} ${order}${sideShortLabel(wheel.lato)}`.trim();
}

export default function NextModalGomme({
  open,
  targa,
  categoria,
  kmIniziale,
  defaultModalita = "ordinario",
  initialData,
  confirmLabel = "Conferma cambio gomme",
  onClose,
  onConfirm,
}: NextModalGommeProps) {
  const config = useMemo(() => buildConfig(categoria), [categoria]);
  const geomKey = useMemo(() => resolveWheelGeomKey(categoria), [categoria]);

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
  const [lato, setLato] = useState<SideKey>(initialSideFromIds(initialSelectedIds));

  if (!open) return null;

  const entry = geomKey ? wheelGeom[geomKey] : null;
  const wheelsSvg = lato === "dx" ? allWheels.dx : allWheels.sx;
  const backgroundImage = entry
    ? `/gomme/${lato === "dx" ? entry.imageDX : entry.imageSX}`
    : "";
  const selectedWheelSet = new Set(selectedWheelIds);
  const numeroGomme = selectedWheelIds.length;
  const selectedAxisIds = uniqueAxisIdsFromWheelIds(selectedWheelIds, allWheels.all);
  const effectiveSelectedAxisId =
    selectedAxisId && selectedAxisIds.includes(selectedAxisId)
      ? selectedAxisId
      : selectedAxisIds[0] ?? selectedAxisId ?? null;
  const axis = effectiveSelectedAxisId ? config.assi.find((item) => item.id === effectiveSelectedAxisId) ?? null : null;
  const selectedAxes = selectedAxisIds
    .map((axisId) => config.assi.find((item) => item.id === axisId) ?? null)
    .filter((item): item is AsseConfig => Boolean(item));
  const wheelsById = new Map(allWheels.all.map((wheel) => [wheel.id, wheel] as const));
  const selectedWheels = selectedWheelIds
    .map((id) => wheelsById.get(id))
    .filter((wheel): wheel is TruckWheelGeom => Boolean(wheel));
  const selectedSingleWheel = selectedWheels.length === 1 ? selectedWheels[0] : null;
  const positionLabel =
    modalita === "ordinario"
      ? selectedAxes.length > 1
        ? `${selectedAxes.map((entry) => entry.label).join(", ")} completi SX + DX`
        : axis
          ? `${axis.label} completo SX + DX`
          : "-"
      : selectedSingleWheel
        ? describeWheel(selectedSingleWheel, config, allWheels.all)
        : selectedWheels.length > 1
          ? "Gomme singole"
          : "-";
  const modeLabel = modalita === "ordinario" ? "Ordinario per asse" : "Straordinario";
  const sideLabelCurrent = sideLabel(sideFromKey(lato));
  const hasInitialRecord = Boolean(initialData);

  const setOrdinaryMode = () => {
    const axisId = selectedAxisIds[0] ?? selectedAxisId ?? config.assi[0]?.id ?? null;
    setModalita("ordinario");
    if (axisId) {
      setSelectedAxisId(axisId);
      const axisIds = selectedAxisIds.length > 0 ? selectedAxisIds : [axisId];
      setSelectedWheelIds(axisIds.flatMap((entry) => buildSelectionForAxis(entry, allWheels.all)));
    }
  };

  const setExtraMode = () => {
    setModalita("straordinario");
    setSelectedWheelIds([]);
  };

  const handleToggleWheel = (wheelId: string) => {
    const wheel = wheelsById.get(wheelId);
    if (!wheel) return;
    setSelectedAxisId(wheel.axisId);
    setLato(wheel.lato === "sinistra" ? "sx" : "dx");
    if (modalita === "ordinario") {
      const axisWheelIds = buildSelectionForAxis(wheel.axisId, allWheels.all);
      const axisAlreadyComplete = axisWheelIds.every((id) => selectedWheelSet.has(id));
      setSelectedWheelIds((current) => {
        if (axisAlreadyComplete) {
          return current.filter((id) => !axisWheelIds.includes(id));
        }
        return Array.from(new Set([...current, ...axisWheelIds]));
      });
      return;
    }
    setSelectedWheelIds((current) =>
      current.includes(wheelId)
        ? current.filter((entryId) => entryId !== wheelId)
        : [...current, wheelId],
    );
  };

  const buildSelectionV2 = (): NextGommeSelectionV2 | null => {
    if (!effectiveSelectedAxisId || selectedWheelIds.length === 0 || selectedAxisIds.length !== 1) return null;
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
      asseId: effectiveSelectedAxisId,
      ruote,
    };
  };

  const handleConfirm = () => {
    if (!numeroGomme) return;
    onConfirm({
      targa,
      categoria: categoria ?? undefined,
      modalita,
      asseId: selectedAxisIds.length === 1 ? selectedAxisIds[0] : null,
      asseLabel: selectedAxes.length === 1 ? selectedAxes[0].label : selectedAxes.length > 1 ? "Piu assi" : null,
      assiIds: selectedAxisIds,
      assiLabels: selectedAxes.map((entry) => entry.label),
      numeroGomme,
      gommeIds: selectedWheelIds,
      marca: marca.trim(),
      km: km.trim(),
      selezioneGommeV2: buildSelectionV2(),
    });
  };

  const axisGridColumns = `70px repeat(${Math.max(1, config.assi.length)}, minmax(0, 1fr))`;

  return (
    <div className="next-modal-gomme mg-overlay" role="dialog" aria-modal="true" aria-label="Selezione gomme">
      <div className="mg-modal">
        <header className="mg-header">
          <div>
            <div className="mg-subtitle">Manutenzione gomme</div>
            <h2 className="mg-header-title">Selezione gomme manutenzione</h2>
            <div className="mg-meta-row">
              <span className="mg-meta mg-meta-real">{targa}</span>
              <span className="mg-meta">{config.tipoLabel}</span>
              {categoria ? <span className="mg-meta">{categoria}</span> : null}
              <span className={`mg-meta ${modalita === "straordinario" ? "mg-meta-extra" : "mg-meta-ordinary"}`}>
                {modeLabel}
              </span>
            </div>
            <div className="mg-top-mode" role="group" aria-label="Tipo intervento gomme">
              <button
                type="button"
                className={`mg-top-mode-btn${modalita === "ordinario" ? " active ordinary" : ""}`}
                onClick={setOrdinaryMode}
              >
                Ordinario per asse
              </button>
              <button
                type="button"
                className={`mg-top-mode-btn${modalita === "straordinario" ? " active extra" : ""}`}
                onClick={setExtraMode}
              >
                Straordinario
              </button>
              <span className="mg-mode-helper">
                {modalita === "ordinario"
                  ? "Ordinario: seleziona l'asse completo SX + DX"
                  : "Straordinario: scegli una o più gomme puntuali"}
              </span>
            </div>
          </div>
          <button type="button" className="mg-close-btn" onClick={onClose} aria-label="Chiudi selezione gomme">
            X
          </button>
        </header>

        <div className="mg-body">
          <section className="mg-map-panel">
            <div className="mg-map-head">
              <div>
                <strong>Foto tecnica con slot selezionabili</strong>
                <small>
                  {modalita === "ordinario"
                    ? "Asse completo visibile nella vista dall'alto su SX + DX"
                    : `Lato ${sideLabelCurrent.toLowerCase()} - selezione puntuale`}
                </small>
              </div>
              <div className="mg-side-switch" role="group" aria-label="Lato mezzo">
                <button
                  type="button"
                  className={lato === "dx" ? "active" : ""}
                  onClick={() => setLato("dx")}
                >
                  Destro
                </button>
                <button
                  type="button"
                  className={lato === "sx" ? "active" : ""}
                  onClick={() => setLato("sx")}
                >
                  Sinistro
                </button>
              </div>
            </div>

            <div className="mg-photo-stage">
              <div className="mg-photo-card">
                {backgroundImage ? (
                  <svg className="mg-vehicle-svg" viewBox="0 0 360 180" aria-label={`Schema gomme ${sideLabelCurrent}`}>
                    <image
                      className="mg-vehicle-image"
                      href={backgroundImage}
                      x="0"
                      y="0"
                      width="360"
                      height="180"
                      preserveAspectRatio="xMidYMid meet"
                    />
                    {wheelsSvg.map((wheel) => {
                      const selected = selectedWheelSet.has(wheel.id);
                      return (
                        <g
                          key={wheel.id}
                          className={`mg-side-wheel${selected ? " selected" : ""}`}
                          onClick={() => handleToggleWheel(wheel.id)}
                        >
                          <circle className="mg-side-wheel-ring" cx={wheel.x} cy={wheel.y} r="8.5" />
                          <circle className="mg-side-wheel-hit" cx={wheel.x} cy={wheel.y} r="18" />
                          <text className="mg-side-wheel-label" x={wheel.x} y={wheel.y - 13}>
                            {describeWheel(wheel, config, allWheels.all)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                ) : (
                  <div className="mg-unavailable">Schema gomme non disponibile per questa categoria.</div>
                )}
              </div>

              <div className="mg-top-card">
                <div className="mg-top-head">
                  <strong>Vista dall'alto</strong>
                  <span>{config.assi.map((asse) => `${asse.wheelsCount} ${asse.label.toLowerCase()}`).join(" - ")}</span>
                </div>
                <div className="mg-top-vehicle" style={{ gridTemplateColumns: axisGridColumns }}>
                  <div className="mg-top-cab">Cabina</div>
                  {config.assi.map((asse) => {
                    const sxWheels = allWheels.sx.filter((wheel) => wheel.axisId === asse.id);
                    const dxWheels = allWheels.dx.filter((wheel) => wheel.axisId === asse.id);
                    return (
                      <div key={asse.id} className="mg-top-axle">
                        <div className={`mg-top-wheel-row top${sxWheels.length > 1 ? " twins" : ""}`}>
                          {sxWheels.map((wheel) => {
                            const sideMatches = lato === "sx";
                            return (
                              <button
                                key={wheel.id}
                                type="button"
                                className={`mg-top-wheel${selectedWheelSet.has(wheel.id) ? " selected" : ""}${
                                  modalita !== "ordinario" && !sideMatches ? " side-muted" : ""
                                }`}
                                onClick={() => handleToggleWheel(wheel.id)}
                              >
                                <span>{wheelOrderLabel(wheel, allWheels.all)}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mg-top-axle-line" />
                        <div className={`mg-top-wheel-row bottom${dxWheels.length > 1 ? " twins" : ""}`}>
                          {dxWheels.map((wheel) => {
                            const sideMatches = lato === "dx";
                            return (
                              <button
                                key={wheel.id}
                                type="button"
                                className={`mg-top-wheel${selectedWheelSet.has(wheel.id) ? " selected" : ""}${
                                  modalita !== "ordinario" && !sideMatches ? " side-muted" : ""
                                }`}
                                onClick={() => handleToggleWheel(wheel.id)}
                              >
                                <span>{wheelOrderLabel(wheel, allWheels.all)}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mg-top-axle-label">{asse.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </section>

          <aside className="mg-detail-panel">
            <div className="mg-detail-head">
              <span>{hasInitialRecord ? "Record manutenzione" : "Nuova selezione"}</span>
              <strong>{positionLabel}</strong>
              <small>Riepilogo intervento</small>
            </div>
            <div className="mg-fields">
              <label>
                Asse / posizione
                <input value={positionLabel} readOnly />
              </label>
              <label>
                Numero gomme cambiate
                <input value={numeroGomme || ""} readOnly />
              </label>
              <label>
                Marca gomme
                <input
                  value={marca}
                  onChange={(event) => setMarca(event.target.value)}
                  placeholder="Es. MICHELIN X MULTI..."
                />
              </label>
              <label>
                Km mezzo
                <input
                  value={km}
                  onChange={(event) => setKm(event.target.value)}
                  placeholder="Es. 325000"
                  inputMode="numeric"
                />
              </label>
            </div>
            <div className="mg-receipt">
              <div className="mg-receipt-row">
                <span>Modalità</span>
                <strong>{modeLabel}</strong>
              </div>
              <div className="mg-receipt-row">
                <span>Lato</span>
                <strong>{modalita === "ordinario" ? "SX + DX" : sideLabelCurrent}</strong>
              </div>
              <div className="mg-tags">
                {selectedAxes.length > 0
                  ? selectedAxes.map((entry) => (
                      <span key={entry.id} className="mg-tag">
                        {entry.label}
                      </span>
                    ))
                  : axis
                    ? <span className="mg-tag">{axis.label}</span>
                    : null}
                <span className={`mg-tag ${modalita === "straordinario" ? "amber" : ""}`}>
                  {modalita === "ordinario" ? "Asse completo" : "Puntuale"}
                </span>
                <span className="mg-tag">{numeroGomme} gomme</span>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mg-footer">
          <button type="button" className="mg-btn ghost" onClick={onClose}>
            Annulla
          </button>
          <button type="button" className="mg-btn primary" onClick={handleConfirm} disabled={!numeroGomme}>
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
