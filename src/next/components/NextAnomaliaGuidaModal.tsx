import { useEffect } from "react";
import type { AnomalyType } from "../types/centroControlloTypes";
import { ANOMALIE_GUIDA } from "../helpers/anomalieGuida";

type Props = {
  open: boolean;
  focusType: AnomalyType | null;
  onClose: () => void;
};

export default function NextAnomaliaGuidaModal({ open, focusType, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  // Se l'utente ha cliccato su una segnalazione precisa, la mostriamo per prima.
  const focusVoce = focusType
    ? ANOMALIE_GUIDA.find((voce) => voce.type === focusType)
    : undefined;
  const voci = focusVoce
    ? [focusVoce, ...ANOMALIE_GUIDA.filter((voce) => voce.type !== focusType)]
    : ANOMALIE_GUIDA;

  return (
    <div
      className="cc-investigation-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Guida alle segnalazioni"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cc-investigation-dialog">
        <div className="cc-investigation-header">
          <div>
            <h3>Cosa significano gli avvisi ⚠</h3>
            <p className="cc-investigation-subtitle">
              {focusVoce
                ? "Spiegazione di questa segnalazione (in cima) e di tutte le altre."
                : "Spiegazione semplice di ogni segnalazione, con un esempio."}
            </p>
          </div>
          <button
            type="button"
            className="cc-investigation-close"
            onClick={onClose}
            aria-label="Chiudi guida"
          >
            ×
          </button>
        </div>

        <div className="cc-investigation-body">
          {voci.map((voce) => (
            <section
              key={voce.type}
              className={`cc-investigation-card${
                focusType === voce.type ? " cc-investigation-pattern-card-warn" : ""
              }`}
            >
              <h4>
                {voce.emoji} {voce.titolo}
              </h4>
              <p>
                <strong>Cosa vuol dire:</strong> {voce.cosaVuolDire}
              </p>
              <p>
                <strong>Esempio:</strong> {voce.esempio}
              </p>
              <p>
                <strong>Cosa fare:</strong> {voce.cosaFare}
              </p>
            </section>
          ))}
        </div>

        <div className="cc-investigation-footer">
          <button type="button" className="cc-secondary-btn" onClick={onClose}>
            Ho capito
          </button>
        </div>
      </div>
    </div>
  );
}
