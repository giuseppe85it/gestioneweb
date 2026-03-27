import { useMemo, useState } from "react";
import {
  buildNextInventarioReadOnlyView,
  type NextInventarioReadOnlyItem,
  type NextInventarioSnapshot,
} from "./domain/nextInventarioDomain";
import "../pages/Inventario.css";

type NextInventarioReadOnlyPanelProps = {
  snapshot: NextInventarioSnapshot;
  blockedReason: string;
  initialQuery?: string | null;
};

function formatQuantity(value: number | null): string {
  if (value === null) return "-";
  return Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("it-IT", { maximumFractionDigits: 2 });
}

function renderActions(item: NextInventarioReadOnlyItem, blockedReason: string) {
  return (
    <div className="inventario-row-actions">
      <button
        className="inventario-delete-button"
        type="button"
        disabled
        title={blockedReason}
      >
        Elimina
      </button>
      <button
        className="inventario-edit-button"
        type="button"
        disabled
        title={blockedReason}
      >
        Modifica
      </button>
      {item.fotoUrl ? (
        <button
          className="inventario-edit-button"
          type="button"
          disabled
          title={blockedReason}
        >
          Rimuovi foto
        </button>
      ) : null}
    </div>
  );
}

export default function NextInventarioReadOnlyPanel({
  snapshot,
  blockedReason,
  initialQuery = null,
}: NextInventarioReadOnlyPanelProps) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [criticalOnly, setCriticalOnly] = useState(false);

  const items = useMemo(
    () => buildNextInventarioReadOnlyView(snapshot, { query, criticalOnly }),
    [criticalOnly, query, snapshot]
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="inventario-form" style={{ opacity: 0.85 }}>
        <label className="inventario-label">
          Ricerca materiale o fornitore
          <input
            type="text"
            className="inventario-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Es. tubo / fornitore"
          />
        </label>

        <div className="inventario-inline" style={{ alignItems: "center" }}>
          <label className="inventario-label flex1">
            Vista
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minHeight: 42,
              }}
            >
              <input
                type="checkbox"
                checked={criticalOnly}
                onChange={(event) => setCriticalOnly(event.target.checked)}
              />
              <span>Mostra solo materiali critici</span>
            </div>
          </label>

          <label className="inventario-label flex1">
            Azioni bloccate
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="inventario-add-button"
                type="button"
                disabled
                title={blockedReason}
                style={{ marginTop: 0 }}
              >
                Aggiungi al magazzino
              </button>
              <button
                className="inventario-pdf-button"
                type="button"
                disabled
                title={blockedReason}
              >
                Anteprima PDF
              </button>
            </div>
          </label>
        </div>
      </div>

      <div className="inventario-list-wrapper">
        {items.length === 0 ? (
          <div className="inventario-empty">Nessun articolo inventario disponibile.</div>
        ) : (
          <div className="inventario-list">
            {items.map((item) => (
              <div key={item.id} className="inventario-row">
                <div className="inventario-row-foto">
                  {item.fotoUrl ? (
                    <img src={item.fotoUrl} className="inventario-thumb" alt={item.descrizione} />
                  ) : (
                    <div className="inventario-thumb placeholder">FOTO</div>
                  )}
                </div>

                <div className="inventario-row-details">
                  <span className="inventario-row-descrizione">
                    {item.descrizione}
                    {item.fornitore ? (
                      <span className="inventario-row-fornitore-inline"> - {item.fornitore}</span>
                    ) : null}
                  </span>

                  <div className="inventario-row-quantita-block">
                    <span className="inventario-row-quantita-label">Quantita</span>

                    <div className="inventario-row-quantita-controls">
                      <button
                        className="inventario-qty-btn"
                        type="button"
                        disabled
                        title={blockedReason}
                      >
                        -
                      </button>
                      <input
                        type="text"
                        className="inventario-qty-input"
                        value={formatQuantity(item.quantita)}
                        readOnly
                      />
                      <button
                        className="inventario-qty-btn"
                        type="button"
                        disabled
                        title={blockedReason}
                      >
                        +
                      </button>
                      <span className="inventario-row-unita">{item.unita ?? "-"}</span>
                    </div>
                  </div>

                  {item.flags.length > 0 ? (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {item.flags.slice(0, 2).map((flag) => (
                        <span key={`${item.id}:${flag}`} className="go-badge">
                          {flag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {renderActions(item, blockedReason)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
