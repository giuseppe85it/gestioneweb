import type { Ref } from "react";
import type { HomeEvent } from "../../../utils/homeEvents";
import { formatDateTimeUI } from "../../nextDateFormat";

type Props = {
  events: HomeEvent[];
  onOpenAll: () => void;
  onOpenDetail: (event: HomeEvent) => void;
  cardRef?: Ref<HTMLDivElement>;
};

function formatTime(ts: number) {
  return formatDateTimeUI(ts);
}

function getTarga(e: HomeEvent) {
  const payload = e.payload as Record<string, unknown> | undefined;
  const targa =
    payload?.targaCamion ??
    payload?.targaMotrice ??
    payload?.mezzoTarga ??
    e.targa ??
    "-";
  return targa ? String(targa) : "-";
}

function getLitri(payload: Record<string, unknown> | undefined) {
  const value = payload?.litri ?? payload?.quantita ?? null;
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function getKmText(payload: Record<string, unknown> | undefined) {
  const value = payload?.km ?? null;
  if (value === null || value === undefined || value === "") return "";
  return ` | ${value} km`;
}

export default function NextRifornimentiCard({
  events,
  onOpenAll,
  onOpenDetail,
  cardRef,
}: Props) {
  return (
    <div className="daily-card" ref={cardRef}>
      <div className="daily-card-head">
        <h2>Rifornimenti</h2>
        <button
          className="daily-more"
          disabled={events.length <= 5}
          onClick={onOpenAll}
          title={events.length <= 5 ? "Niente altro" : "Vedi tutto"}
        >
          Vedi tutto
        </button>
      </div>

      {events.length === 0 ? (
        <div className="daily-item empty">Nessun rifornimento</div>
      ) : (
        events.slice(0, 5).map((event) => {
          const payload = event.payload as Record<string, unknown> | undefined;
          const targa = getTarga(event);
          const litri = getLitri(payload);
          const kmText = getKmText(payload);
          const key =
            event.id ?? `${event.tipo ?? "r"}-${event.timestamp ?? 0}-${targa}-${litri}`;
          return (
            <div
              key={key}
              className="daily-item"
              onClick={() => onOpenDetail(event)}
              role="button"
              tabIndex={0}
              onKeyDown={(keyboardEvent) => {
                if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                  onOpenDetail(event);
                }
              }}
            >
              {formatTime(event.timestamp)} - {targa} - {litri} lt{kmText}
            </div>
          );
        })
      )}
    </div>
  );
}
