import type { Ref } from "react";
import type { HomeEvent } from "../../utils/homeEvents";
import { formatDateTimeUI } from "../../utils/dateFormat";

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
  const p: any = e.payload || {};
  const t =
    p?.targaCamion ?? p?.targaMotrice ?? p?.mezzoTarga ?? e.targa ?? "-";
  return t ? String(t) : "-";
}

function getLitri(p: any) {
  const v = p?.litri ?? p?.quantita ?? null;
  if (v === null || v === undefined || v === "") return "-";
  return String(v);
}

function getKmText(p: any) {
  const v = p?.km ?? null;
  if (v === null || v === undefined || v === "") return "";
  return ` | ${v} km`;
}

export default function RifornimentiCard({
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
        events.slice(0, 5).map((r) => {
          const p: any = r.payload || {};
          const targa = getTarga(r);
          const litri = getLitri(p);
          const kmText = getKmText(p);
          const key =
            r.id ?? `${r.tipo ?? "r"}-${r.timestamp ?? 0}-${targa}-${litri}`;
          return (
            <div
              key={key}
              className="daily-item"
              onClick={() => onOpenDetail(r)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpenDetail(r);
              }}
            >
              {formatTime(r.timestamp)} - {targa} - {litri} lt{kmText}
            </div>
          );
        })
      )}
    </div>
  );
}
