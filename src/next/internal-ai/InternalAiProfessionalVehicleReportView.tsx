import { useEffect, useState } from "react";
import TruckGommeSvg from "../../components/TruckGommeSvg";
import "../../pages/ModalGomme.css";
import type { InternalAiServerReportSummaryWorkflow } from "./internalAiServerReportSummaryClient";
import {
  readInternalAiProfessionalVehicleReport,
  type InternalAiProfessionalVehicleReport,
} from "./internalAiProfessionalVehicleReport";
import type { InternalAiVehicleReportPreview } from "./internalAiTypes";

type InternalAiProfessionalVehicleReportViewProps = {
  report: InternalAiVehicleReportPreview;
  workflow: InternalAiServerReportSummaryWorkflow | null;
};

type ViewState =
  | { status: "loading"; report: null; message: string | null }
  | { status: "ready"; report: InternalAiProfessionalVehicleReport; message: string | null }
  | { status: "error"; report: null; message: string };

function renderMediaCard(media: InternalAiProfessionalVehicleReport["vehicle"]) {
  const identityLine = [media.categoria, media.marcaModello].filter(Boolean).join(" · ");

  return (
    <article className="internal-ai-operational-report__media-card">
      <div className="internal-ai-operational-report__media-head">
        <div>
          <p className="internal-ai-card__eyebrow">{media.label}</p>
          <h3>{media.targa}</h3>
          <p className="internal-ai-operational-report__identity-line">
            {identityLine || "Identita mezzo non disponibile"}
          </p>
        </div>
        <span className="internal-ai-pill is-neutral">
          {media.photoStatus === "available" ? "Foto disponibile" : "Foto non disponibile"}
        </span>
      </div>

      <div className="internal-ai-operational-report__media-grid">
        <div className="internal-ai-operational-report__media-copy">
          <div className="internal-ai-operational-report__kv-grid">
            <div>
              <span className="internal-ai-operational-report__kv-label">Categoria</span>
              <strong>{media.categoria || "non disponibile"}</strong>
            </div>
            <div>
              <span className="internal-ai-operational-report__kv-label">Marca / modello</span>
              <strong>{media.marcaModello || "non disponibile"}</strong>
            </div>
            <div>
              <span className="internal-ai-operational-report__kv-label">Autista associato</span>
              <strong>{media.autistaNome || "non disponibile"}</strong>
            </div>
            <div>
              <span className="internal-ai-operational-report__kv-label">Revisione</span>
              <strong>{media.revisione || "non disponibile"}</strong>
            </div>
            <div>
              <span className="internal-ai-operational-report__kv-label">Ultimo collaudo</span>
              <strong>{media.collaudo || "non disponibile"}</strong>
            </div>
            <div>
              <span className="internal-ai-operational-report__kv-label">Pre-collaudo</span>
              <strong>{media.precollaudo || "non disponibile"}</strong>
            </div>
          </div>
        </div>

        <div className="internal-ai-operational-report__photo-shell">
          {media.photoUrl ? (
            <img
              src={media.photoUrl}
              alt={`${media.label} ${media.targa}`}
              className="internal-ai-operational-report__photo"
            />
          ) : (
            <div className="internal-ai-operational-report__photo-placeholder">
              <span>non disponibile</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function InternalAiProfessionalVehicleReportView({
  report,
  workflow,
}: InternalAiProfessionalVehicleReportViewProps) {
  const [state, setState] = useState<ViewState>({
    status: "loading",
    report: null,
    message: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadPresentation = async () => {
      setState({
        status: "loading",
        report: null,
        message: "Sto preparando il report gestionale con foto, sezioni operative e allegati utili.",
      });

      try {
        const presentation = await readInternalAiProfessionalVehicleReport(report, workflow);
        if (cancelled) {
          return;
        }
        setState({
          status: "ready",
          report: presentation,
          message: null,
        });
      } catch (error) {
        if (cancelled) {
          return;
        }
        setState({
          status: "error",
          report: null,
          message:
            error instanceof Error
              ? `Impossibile preparare il report gestionale: ${error.message}`
              : "Impossibile preparare il report gestionale.",
        });
      }
    };

    void loadPresentation();

    return () => {
      cancelled = true;
    };
  }, [report, workflow]);

  if (state.status === "loading") {
    return (
      <div className="next-clone-placeholder internal-ai-empty">
        <p>{state.message || "Sto preparando il report gestionale."}</p>
      </div>
    );
  }

  if (state.status === "error" || !state.report) {
    return (
      <div className="next-clone-placeholder internal-ai-empty">
        <p>{state.message || "Impossibile caricare il report gestionale."}</p>
      </div>
    );
  }

  const presentation = state.report;

  return (
    <div className="internal-ai-operational-report">
      <header className="internal-ai-operational-report__header">
        <div className="internal-ai-operational-report__brand">
          <img src="/logo.png" alt="Ghielmicementi SA" className="internal-ai-operational-report__logo" />
          <div>
            <p className="internal-ai-card__eyebrow">Report gestionale</p>
            <h2>{presentation.displayTitle}</h2>
            <p className="next-panel__description">{presentation.displaySubtitle}</p>
          </div>
        </div>
        <div className="internal-ai-pill-row">
          <span className="internal-ai-pill is-neutral">Targa {presentation.targetLabel}</span>
          <span className="internal-ai-pill is-neutral">Generato il {presentation.generatedAtLabel}</span>
          <span className="internal-ai-pill is-neutral">Periodo {presentation.periodLabel}</span>
        </div>
      </header>

      <section className="internal-ai-operational-report__media-stack">
        {renderMediaCard(presentation.vehicle)}
        {presentation.relatedAsset ? renderMediaCard(presentation.relatedAsset) : null}
      </section>

      <section className="next-panel internal-ai-operational-report__summary-card">
        <div className="next-panel__header">
          <h2>Sintesi esecutiva</h2>
        </div>
        <ul className="internal-ai-inline-list internal-ai-operational-report__summary-list">
          {presentation.executiveSummary.map((entry) => (
            <li key={entry}>{entry}</li>
          ))}
        </ul>
      </section>

      {presentation.tyreVisual ? (
        <section className="next-panel internal-ai-operational-report__tyre-card">
          <div className="next-panel__header">
            <h2>{presentation.tyreVisual.title}</h2>
          </div>
          <p className="next-panel__description">{presentation.tyreVisual.subtitle}</p>
          <div className="internal-ai-operational-report__tyre-layout">
            <div className="mg-svg-wrapper internal-ai-operational-report__tyre-visual">
              <TruckGommeSvg
                isRimorchio={presentation.tyreVisual.isRimorchio}
                backgroundImage={presentation.tyreVisual.backgroundImageUrl ?? ""}
                wheels={presentation.tyreVisual.wheels}
                selectedWheelIds={presentation.tyreVisual.selectedWheelIds}
                selectedAxisId={presentation.tyreVisual.selectedAxisId}
                modalita={presentation.tyreVisual.modalita}
                onToggleWheel={() => undefined}
              />
            </div>
            <div className="internal-ai-operational-report__tyre-details">
              <div className="internal-ai-pill-row">
                {presentation.tyreVisual.highlights.map((entry) => (
                  <span key={entry} className="internal-ai-pill is-neutral">
                    {entry}
                  </span>
                ))}
              </div>
              <div className="internal-ai-operational-report__kv-grid">
                {presentation.tyreVisual.details.map((entry) => (
                  <div key={entry.label}>
                    <span className="internal-ai-operational-report__kv-label">{entry.label}</span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="internal-ai-operational-report__sections">
        {presentation.sections.map((section) => (
          <article key={section.id} className="next-panel internal-ai-operational-report__section-card">
            <div className="next-panel__header">
              <h2>{section.title}</h2>
            </div>
            <p className="internal-ai-operational-report__section-summary">{section.summary}</p>
            {section.bullets.length ? (
              <ul className="internal-ai-inline-list">
                {section.bullets.map((bullet) => (
                  <li key={`${section.id}:${bullet}`}>{bullet}</li>
                ))}
              </ul>
            ) : (
              <p className="internal-ai-card__meta">{section.emptyLabel || "non disponibile"}</p>
            )}
          </article>
        ))}
      </section>

    </div>
  );
}
