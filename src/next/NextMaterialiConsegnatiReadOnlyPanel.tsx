import { useMemo, useState } from "react";
import {
  buildNextMaterialiConsegnatiDestinatariView,
  type NextMaterialeMovimentoReadOnlyItem,
  type NextMaterialiConsegnatiDestinatarioView,
  type NextMaterialiMovimentiSnapshot,
} from "./domain/nextMaterialiMovimentiDomain";
import "../pages/MaterialiConsegnati.css";

type NextMaterialiConsegnatiReadOnlyPanelProps = {
  snapshot: NextMaterialiMovimentiSnapshot;
  blockedReason: string;
  onOpenDossier: (targa: string | null) => void;
  preferredTarga?: string | null;
  preferredLabel?: string | null;
  preferredMateriale?: string | null;
};

function formatQuantity(value: number | null, unit: string | null): string {
  if (value === null) return "-";
  const normalized = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("it-IT", { maximumFractionDigits: 2 });
  return unit ? `${normalized} ${unit}` : normalized;
}

function getDestLabel(item: NextMaterialeMovimentoReadOnlyItem): string {
  return item.destinatario.label ?? item.target ?? item.destinatario.refId ?? "Destinatario";
}

export default function NextMaterialiConsegnatiReadOnlyPanel({
  snapshot,
  blockedReason,
  onOpenDossier,
  preferredTarga = null,
  preferredLabel = null,
  preferredMateriale = null,
}: NextMaterialiConsegnatiReadOnlyPanelProps) {
  const destinatari = useMemo(
    () => buildNextMaterialiConsegnatiDestinatariView(snapshot),
    [snapshot]
  );
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);
  const preferredDestId = useMemo(() => {
    if (!destinatari.length) {
      return null;
    }

    const preferred = destinatari.find((dest) => {
      const label = dest.label.toLowerCase();
      const matchesLabel = preferredLabel ? label.includes(preferredLabel.toLowerCase()) : false;
      const matchesTarga = preferredTarga ? label.includes(preferredTarga.toLowerCase()) : false;
      const matchesMateriale = preferredMateriale
        ? dest.items.some((item) =>
            `${item.descrizione ?? ""} ${item.materiale ?? ""}`
              .toLowerCase()
              .includes(preferredMateriale.toLowerCase()),
          )
        : false;
      return matchesLabel || matchesTarga || matchesMateriale;
    });

    return preferred?.id ?? destinatari[0].id;
  }, [destinatari, preferredLabel, preferredMateriale, preferredTarga]);

  const effectiveSelectedDestId = useMemo(() => {
    if (!destinatari.length) {
      return null;
    }

    if (selectedDestId && destinatari.some((dest) => dest.id === selectedDestId)) {
      return selectedDestId;
    }

    return preferredDestId;
  }, [destinatari, preferredDestId, selectedDestId]);

  const selectedDest = useMemo<NextMaterialiConsegnatiDestinatarioView | null>(
    () => destinatari.find((dest) => dest.id === effectiveSelectedDestId) ?? null,
    [destinatari, effectiveSelectedDestId]
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="mc-form" style={{ opacity: 0.85 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="mc-add-btn" type="button" disabled title={blockedReason}>
            Registra consegna
          </button>
          <button className="mc-pdf-global-btn" type="button" disabled title={blockedReason}>
            Scarica PDF
          </button>
        </div>
        <div className="go-badge" style={{ marginTop: 12 }}>
          {blockedReason}
        </div>
      </div>

      <div className="mc-list-wrapper">
        {!destinatari.length ? (
          <div className="mc-empty">Nessuna consegna registrata.</div>
        ) : (
          <>
            <div className="mc-dest-list">
              {destinatari.map((dest) => (
                <button
                  key={dest.id}
                  className={`mc-dest-row${effectiveSelectedDestId === dest.id ? " mc-dest-row-active" : ""}`}
                  type="button"
                  onClick={() =>
                    setSelectedDestId((current) => (current === dest.id ? null : dest.id))
                  }
                >
                  <div className="mc-dest-main">
                    <span className="mc-dest-name">{dest.label}</span>
                    <span className="mc-dest-badge">Tot: {dest.totalQuantita}</span>
                  </div>
                  <div className="mc-dest-meta">
                    <span className="mc-dest-meta-text">Movimenti: {dest.movementCount}</span>
                    <span className="mc-dest-meta-link">Dettaglio ▾</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedDest ? (
              <div className="mc-detail-panel">
                <div className="mc-detail-header">
                  <div>
                    <h2 className="mc-detail-title">{selectedDest.label}</h2>
                    <p className="mc-detail-subtitle">Storico materiali consegnati</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="mc-pdf-btn"
                      type="button"
                      disabled
                      title={blockedReason}
                      style={{ background: "#2d6a4f", color: "#fdfaf4" }}
                    >
                      Anteprima
                    </button>
                    <button className="mc-pdf-btn" type="button" disabled title={blockedReason}>
                      Scarica PDF
                    </button>
                  </div>
                </div>

                <div className="mc-detail-list">
                  {selectedDest.items.map((item) => (
                    <div key={item.id} className="mc-detail-row">
                      <div className="mc-detail-main">
                        <span className="mc-detail-date">{item.data ?? "-"}</span>
                        <span className="mc-detail-desc">
                          {item.descrizione ?? item.materiale ?? "-"} -{" "}
                          {formatQuantity(item.quantita, item.unita)}
                        </span>
                        {item.fornitore ? (
                          <span className="mc-detail-motivo">Fornitore: {item.fornitore}</span>
                        ) : null}
                        {item.motivo ? (
                          <span className="mc-detail-motivo">{item.motivo}</span>
                        ) : null}
                        <span className="mc-detail-motivo">
                          Destinatario: {getDestLabel(item)}
                        </span>
                        {item.targa ? (
                          <div style={{ marginTop: 6 }}>
                            <button
                              type="button"
                              className="go-link-btn"
                              onClick={() => onOpenDossier(item.targa)}
                            >
                              Apri dossier {item.targa}
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <button
                        className="mc-delete-btn"
                        type="button"
                        disabled
                        title={blockedReason}
                      >
                        Elimina
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
