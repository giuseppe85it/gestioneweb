// src/components/TruckGommeSvg.tsx
import type { FC } from "react";

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
}

const TruckGommeSvg: FC<TruckGommeSvgProps> = ({
  backgroundImage,
  wheels,
  selectedWheelIds,
  selectedAxisId,
  modalita,
  onToggleWheel,
}) => {
  return (
    <svg viewBox="0 0 360 180" className="mg-truck-svg">
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

        return (
          <circle
            key={w.id}
            cx={w.x}
            cy={w.y}
            r={8}
            className={
              "mg-wheel" +
              (active ? " mg-wheel-selected" : "") +
              (modalita === "straordinario" ? " mg-wheel-clickable" : "")
            }
            onClick={() => onToggleWheel(w.id)}
          />
        );
      })}
    </svg>
  );
};

export default TruckGommeSvg;
