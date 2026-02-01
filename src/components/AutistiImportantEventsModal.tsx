import type { HomeEvent } from "../utils/homeEvents";
import { formatDateTimeUI } from "../utils/dateFormat";

export type ImportantAutistiEventItem = {
  id: string;
  event: HomeEvent;
  ts: number;
  targa: string;
  tipo: string;
  preview: string;
};

type AutistiImportantEventsModalProps = {
  open: boolean;
  items: ImportantAutistiEventItem[];
  onClose: () => void;
  onSelect: (event: HomeEvent) => void;
};

function formatDateTime(ts: number): string {
  return formatDateTimeUI(ts);
}

export default function AutistiImportantEventsModal({
  open,
  items,
  onClose,
  onSelect,
}: AutistiImportantEventsModalProps) {
  if (!open) return null;

  return (
    <div className="home-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="home-modal missing-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Eventi importanti autisti"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="home-modal-head">
          <div className="home-modal-title">Eventi importanti autisti</div>
          <div className="home-modal-subtitle">
            {items.length} eventi totali
          </div>
        </div>

        <div className="home-modal-body missing-modal-body">
          {items.length === 0 ? (
            <div className="panel-row panel-row-empty">
              Nessun evento importante
            </div>
          ) : (
            <div className="missing-list" style={{ maxHeight: "60vh", overflow: "auto" }}>
              {items.map((item) => {
                const targaLabel = item.targa || "-";
                const preview = item.preview || "-";
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="missing-item"
                    onClick={() => {
                      onSelect(item.event);
                      onClose();
                    }}
                  >
                    <div className="missing-item-main">
                      <div className="missing-item-title">
                        <span className="targa">{targaLabel}</span>
                        <span className="missing-sep">-</span>
                        <span className="missing-label">{item.tipo}</span>
                      </div>
                      <div className="missing-item-meta">
                        <span className="missing-label">Data:</span>
                        <span>{formatDateTime(item.ts)}</span>
                        <span className="missing-sep">-</span>
                        <span>{preview}</span>
                      </div>
                    </div>
                    <span className="row-arrow">-&gt;</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="home-modal-actions">
          <button type="button" className="home-modal-btn" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
