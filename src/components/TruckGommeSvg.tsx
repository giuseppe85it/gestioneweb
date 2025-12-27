// src/components/TruckGommeSvg.tsx
import type { FC, PointerEvent, Ref } from "react";

interface TruckWheelGeom {
  id: string;
  axisId: string;
  x: number;
  y: number;
}

interface TruckGommeSvgProps {
  // mantenuto per compatibilità, anche se la grafica non lo usa direttamente
  isRimorchio: boolean;
  // nuova: immagine tecnica di sfondo
  backgroundImage: string;
  // geometria ruote già calcolata dal chiamante
  wheels: TruckWheelGeom[];
  selectedWheelIds: string[];
  selectedAxisId: string | null;
  modalita: "ordinario" | "straordinario";
  onToggleWheel: (wheelId: string) => void;
  calibraActive?: boolean;
  draggingWheelId?: string | null;
  onWheelPointerDown?: (wheelId: string, event: PointerEvent<SVGCircleElement>) => void;
  svgRef?: Ref<SVGSVGElement>;
}

const TruckGommeSvg: FC<TruckGommeSvgProps> = ({
  backgroundImage,
  wheels,
  selectedWheelIds,
  selectedAxisId,
  modalita,
  onToggleWheel,
  calibraActive,
  draggingWheelId,
  onWheelPointerDown,
  svgRef,
}) => {
  return (
    <svg ref={svgRef} viewBox="0 0 360 180" className="mg-truck-svg">
      {/* immagine tecnica reale del mezzo */}
      {backgroundImage && (
        <image
          href={backgroundImage}
          x={0}
          y={0}
          width={360}
          height={180}
          preserveAspectRatio="xMidYMid meet"
          className="mg-truck-bg"
        />
      )}

      {/* ruote cliccabili */}
      {wheels.map((w) => {
        const active =
          modalita === "ordinario"
            ? w.axisId === selectedAxisId
            : selectedWheelIds.includes(w.id);

        const dragging = draggingWheelId === w.id;

        return (
          <g key={w.id}>
            <circle
              cx={w.x}
              cy={w.y}
              r={8}
              fill="none"
              className={
                "mg-wheel-ring" +
                (active ? " mg-wheel-ring--active" : "") +
                (dragging ? " mg-wheel-ring--dragging" : "")
              }
            />
            <circle
              cx={w.x}
              cy={w.y}
              r={18}
              fill="transparent"
              stroke="transparent"
              className={
                "mg-wheel-hit" +
                (modalita === "straordinario" ? " mg-wheel-clickable" : "") +
                (dragging ? " mg-wheel-hit--dragging" : "")
              }
              onPointerDown={
                calibraActive
                  ? (e) => onWheelPointerDown?.(w.id, e)
                  : undefined
              }
              onClick={
                calibraActive ? undefined : () => onToggleWheel(w.id)
              }
            />
          </g>
        );
      })}
    </svg>
  );
};

export default TruckGommeSvg;
