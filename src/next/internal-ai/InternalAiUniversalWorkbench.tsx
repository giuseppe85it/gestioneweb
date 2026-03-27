import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { InternalAiChatAttachment } from "./internalAiTypes";
import { orchestrateInternalAiUniversalRequest } from "./internalAiUniversalOrchestrator";
import type { InternalAiUniversalOrchestrationResult } from "./internalAiUniversalTypes";

type InternalAiUniversalWorkbenchProps = {
  promptDraft: string;
  attachments: InternalAiChatAttachment[];
  preferredTarga?: string | null;
};

function getRequestKindLabel(kind: InternalAiUniversalOrchestrationResult["requestResolution"]["requestKind"]): string {
  switch (kind) {
    case "lookup_entita":
      return "Lookup entita";
    case "domanda_operativa":
      return "Domanda operativa";
    case "report_strutturato":
      return "Report strutturato";
    case "instradamento_documento":
      return "Instradamento documenti";
    case "richiesta_apertura_flusso":
      return "Apertura flusso";
    case "analisi_repo_flussi":
      return "Registry tecnico";
    default:
      return "Richiesta generica";
  }
}

function getCoverageLabel(result: InternalAiUniversalOrchestrationResult): string {
  const { fullyCoveredAdapters, partialAdapters, uncoveredGaps, trustLabel, readyHandoffs, inboxItems } =
    result.coverage;
  return `${trustLabel} | adapter assorbiti ${fullyCoveredAdapters}, parziali ${partialAdapters}, handoff pronti ${readyHandoffs}, inbox ${inboxItems}, gap ${uncoveredGaps}`;
}

export default function InternalAiUniversalWorkbench(
  props: InternalAiUniversalWorkbenchProps,
) {
  const [state, setState] = useState<{
    status: "idle" | "loading" | "ready" | "error";
    result: InternalAiUniversalOrchestrationResult | null;
    message: string | null;
  }>({
    status: "idle",
    result: null,
    message: null,
  });

  useEffect(() => {
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setState((current) => ({
        status: "loading",
        result: current.result,
        message: current.message,
      }));

      void orchestrateInternalAiUniversalRequest({
        prompt: props.promptDraft.trim() || "stato universale clone next",
        attachments: props.attachments,
        preferredTarga: props.preferredTarga ?? null,
      })
        .then((result) => {
          if (cancelled) {
            return;
          }
          setState({
            status: "ready",
            result,
            message:
              "Resolver, handoff standard, inbox documentale e gate moduli futuri aggiornati sullo stato corrente.",
          });
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }
          setState({
            status: "error",
            result: null,
            message:
              error instanceof Error
                ? `Errore nel layer universale: ${error.message}`
                : "Errore nel layer universale.",
          });
        });
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [props.attachments, props.preferredTarga, props.promptDraft]);

  const result = state.result;

  return (
    <article className="next-panel internal-ai-card" style={{ display: "grid", gap: 16 }}>
      <div className="internal-ai-chat__message-header">
        <div>
          <p className="internal-ai-card__eyebrow">Sistema universale clone/NEXT</p>
          <h3 style={{ margin: 0 }}>Registry totale + resolver + router documenti</h3>
        </div>
        <div className="internal-ai-pill-row">
          <span className="internal-ai-pill is-neutral">Read-only</span>
          {state.message ? <span className="internal-ai-muted">{state.message}</span> : null}
        </div>
      </div>

      {result ? (
        <>
          <div className="internal-ai-grid">
            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Perimetro censito</p>
              <h3>{result.registry.counts.modules} moduli</h3>
              <p className="internal-ai-card__meta">
                Route {result.registry.counts.routes}, hook UI {result.registry.counts.uiHooks},
                adapter {result.registry.counts.adapters}, capability deployate{" "}
                {result.registry.counts.aiCapabilities}.
              </p>
            </article>
            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Richiesta corrente</p>
              <h3>{getRequestKindLabel(result.requestResolution.requestKind)}</h3>
              <p className="internal-ai-card__meta">{result.requestResolution.focusLabel}</p>
            </article>
            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Copertura</p>
              <h3>{result.coverage.trustLabel}</h3>
              <p className="internal-ai-card__meta">{getCoverageLabel(result)}</p>
            </article>
            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Gate moduli futuri</p>
              <h3>{result.conformance.gateStatus}</h3>
              <p className="internal-ai-card__meta">{result.conformance.ruleLabel}</p>
            </article>
          </div>

          <div className="internal-ai-grid">
            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Entity resolver</p>
              {result.entityResolution.matches.length ? (
                <ul className="internal-ai-inline-list">
                  {result.entityResolution.matches.slice(0, 6).map((entry) => (
                    <li key={`${entry.entityKind}:${entry.normalizedValue}:${entry.matchedId ?? "none"}`}>
                      <strong>{entry.entityKind}</strong>: {entry.matchedLabel ?? entry.normalizedValue}
                      {" | "}
                      {entry.confidence}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="internal-ai-card__meta">
                  Nessuna entita forte risolta. Il sistema resta prudente e multi-modulo.
                </p>
              )}
            </article>

            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Adapter selezionati</p>
              {result.selectedAdapters.length ? (
                <ul className="internal-ai-inline-list">
                  {result.selectedAdapters.map((adapter) => (
                    <li key={adapter.adapterId}>
                      <strong>{adapter.domainCode}</strong> {adapter.moduleLabel}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="internal-ai-card__meta">
                  Nessun adapter forte. Resta il gateway universale in fallback prudente.
                </p>
              )}
            </article>

            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Composer unico</p>
              <p className="internal-ai-card__meta" style={{ whiteSpace: "pre-line" }}>
                {result.composerText}
              </p>
            </article>
          </div>

          <div className="internal-ai-grid">
            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Action intent</p>
              {result.actionIntents.length ? (
                <div className="internal-ai-list">
                  {result.actionIntents.slice(0, 4).map((entry, index) => (
                    <div key={`${entry.type}:${entry.path}:${index}`}>
                      <strong>{entry.label}</strong>
                      <p className="internal-ai-card__meta">{entry.reason}</p>
                      {entry.handoff ? (
                        <p className="internal-ai-card__meta">
                          Handoff {entry.handoff.handoffId} | stato {entry.handoff.statoRichiesta}
                        </p>
                      ) : null}
                      <Link to={entry.path} className="internal-ai-chat__reference">
                        Apri {entry.path}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="internal-ai-card__meta">
                  Nessun aggancio UI prioritario per la richiesta corrente.
                </p>
              )}
            </article>

            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Router documenti</p>
              {result.documentRoutes.length ? (
                <div className="internal-ai-list">
                  {result.documentRoutes.map((entry) => (
                    <div key={entry.attachmentId}>
                      <strong>{entry.fileName}</strong>
                      <p className="internal-ai-card__meta">
                        {entry.classification} | {entry.confidence} | {entry.targetPath}
                      </p>
                      <p className="internal-ai-card__meta">
                        Stato {entry.status} | Modulo suggerito {entry.suggestedModuleLabel}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="internal-ai-card__meta">
                  Nessun allegato nel thread. Quando arriva un file, il router lo collega qui al
                  modulo corretto del clone.
                </p>
              )}
            </article>

            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Handoff standard</p>
              {result.handoffPayloads.length ? (
                <div className="internal-ai-list">
                  {result.handoffPayloads.slice(0, 4).map((entry) => (
                    <div key={entry.handoffId}>
                      <strong>{entry.moduloTarget}</strong>
                      <p className="internal-ai-card__meta">
                        {entry.statoRichiesta} | {entry.routeTarget}
                      </p>
                      <p className="internal-ai-card__meta">
                        Prefill:{" "}
                        {Object.entries(entry.prefillCanonico)
                          .slice(0, 4)
                          .map(([key, value]) =>
                            `${key}=${Array.isArray(value) ? value.join(", ") : String(value)}`,
                          )
                          .join(" | ")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="internal-ai-card__meta">
                  Nessun handoff ancora materializzato per il contesto corrente.
                </p>
              )}
            </article>
          </div>

          <div className="internal-ai-grid">
            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Inbox documentale</p>
              {result.documentInboxItems.length ? (
                <div className="internal-ai-list">
                  {result.documentInboxItems.slice(0, 4).map((entry) => (
                    <div key={entry.inboxId}>
                      <strong>{entry.fileName}</strong>
                      <p className="internal-ai-card__meta">
                        {entry.status} | {entry.suggestedModuleLabel}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="internal-ai-card__meta">
                  Nessun documento in inbox per il contesto corrente.
                </p>
              )}
            </article>

            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Capability assorbite</p>
              <h3>{result.registry.counts.absorbedAiCapabilities}</h3>
              <p className="internal-ai-card__meta">
                Gia attive o riusate dal sistema universale sopra il clone/NEXT.
              </p>
            </article>

            <article className="internal-ai-card">
              <p className="internal-ai-card__eyebrow">Buchi reali</p>
              {result.gaps.length ? (
                <ul className="internal-ai-inline-list">
                  {result.gaps.map((gap) => (
                    <li key={gap.gapId}>
                      <strong>{gap.label}</strong>: {gap.nextWorkPackage}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="internal-ai-card__meta">
                  Nessun gap strutturale attivo oltre ai limiti di live-read dichiarati.
                </p>
              )}
            </article>
          </div>
        </>
      ) : (
        <p className="internal-ai-card__meta">
          {state.status === "error"
            ? state.message
            : "Sto preparando il registry totale e il piano di lettura universale del clone."}
        </p>
      )}
    </article>
  );
}
