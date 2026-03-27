import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { readInternalAiUniversalConformanceSummary } from "./internalAiUniversalConformance";
import InternalAiUniversalHandoffBanner from "./InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internalAiUniversalHandoffConsumer";
import {
  readInternalAiUniversalRequestsRepositorySnapshot,
  subscribeInternalAiUniversalRequestsRepository,
} from "./internalAiUniversalRequestsRepository";

function formatPrefillValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null || value === undefined || value === "") {
    return "n/d";
  }

  return String(value);
}

export default function InternalAiUniversalRequestsPanel() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.ia_interna",
  });
  const snapshot = useSyncExternalStore(
    subscribeInternalAiUniversalRequestsRepository,
    readInternalAiUniversalRequestsRepositorySnapshot,
    readInternalAiUniversalRequestsRepositorySnapshot,
  );
  const conformance = readInternalAiUniversalConformanceSummary();
  const lifecycleRef = useRef<string | null>(null);
  const selectedHandoffId = handoff.state.status === "ready" ? handoff.state.payload.handoffId : null;
  const selectedInboxId = useMemo(
    () =>
      selectedHandoffId
        ? snapshot.inboxItems.find((item) => item.handoffPayload.handoffId === selectedHandoffId)?.inboxId ?? null
        : null,
    [selectedHandoffId, snapshot.inboxItems],
  );

  useEffect(() => {
    if (handoff.state.status !== "ready") {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "da_verificare",
      "La inbox documentale universale ha caricato il payload e lo ha reso disponibile per verifica manuale.",
    );
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff]);

  return (
    <div className="next-section-grid">
      <article className="next-panel internal-ai-card">
        <div className="next-panel__header">
          <h2>Inbox documentale universale</h2>
        </div>
        <p className="next-panel__description">
          Qui arrivano i documenti ambigui o da verificare. Nessun invio automatico al modulo
          sbagliato: il sistema conserva motivo, suggerimento modulo, entita candidate e payload di
          handoff.
        </p>
        {handoff.state.status === "ready" ? (
          <div style={{ marginBottom: 12 }}>
            <InternalAiUniversalHandoffBanner
              title="Payload selezionato nella inbox documentale"
              description="La route richieste ha consumato il payload `iaHandoff` e lo espone nel pannello corretto per verifica manuale."
              payload={handoff.state.payload}
            />
          </div>
        ) : null}
        {handoff.state.status === "error" ? (
          <div className="next-clone-placeholder" style={{ marginBottom: 12 }}>
            {handoff.state.errorMessage}
          </div>
        ) : null}
        <div className="internal-ai-pill-row" style={{ marginBottom: 12 }}>
          <span className="internal-ai-pill is-neutral">
            {snapshot.inboxItems.length} elementi in inbox
          </span>
          <span className="internal-ai-pill is-neutral">
            {snapshot.mode === "local_storage_isolated" ? "Persistenza locale isolata" : "Memoria locale"}
          </span>
        </div>
        {snapshot.inboxItems.length ? (
          <div className="internal-ai-list">
            {snapshot.inboxItems.map((item) => (
              <div
                key={item.inboxId}
                className="internal-ai-list__row"
                style={
                  item.inboxId === selectedInboxId
                    ? {
                        borderColor: "#2d6a4f",
                        boxShadow: "0 0 0 1px rgba(45, 106, 79, 0.2)",
                        background: "rgba(240, 253, 244, 0.55)",
                      }
                    : undefined
                }
              >
                <div className="internal-ai-list__row-header">
                  <strong>{item.fileName}</strong>
                  <div className="internal-ai-pill-row">
                    {item.inboxId === selectedInboxId ? (
                      <span className="internal-ai-pill is-success">Payload attivo</span>
                    ) : null}
                    <span className="internal-ai-pill is-warning">{item.status}</span>
                  </div>
                </div>
                <p className="internal-ai-card__meta">
                  Classificazione: {item.classification} | Modulo suggerito: {item.suggestedModuleLabel}
                </p>
                <p className="internal-ai-card__meta">
                  Entita candidate:{" "}
                  {item.entityCandidateLabels.length ? item.entityCandidateLabels.join(", ") : "nessuna"}
                </p>
                <ul className="internal-ai-inline-list">
                  {item.motivoClassificazione.map((reason, index) => (
                    <li key={`${item.inboxId}:reason:${index}`}>{reason}</li>
                  ))}
                </ul>
                <div className="internal-ai-list">
                  {item.azioniPossibili.map((action, index) => (
                    <div key={`${item.inboxId}:action:${index}`}>
                      <strong>{action.label}</strong>
                      <p className="internal-ai-card__meta">{action.reason}</p>
                      <Link to={action.path} className="internal-ai-chat__reference">
                        Apri {action.path}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="internal-ai-card__meta">
            Nessun documento ambiguo in inbox. I nuovi file da verificare verranno tracciati qui.
          </p>
        )}
      </article>

      <article className="next-panel internal-ai-card">
        <div className="next-panel__header">
          <h2>Handoff standard e prefill canonico</h2>
        </div>
        <p className="next-panel__description">
          Payload uniforme chat -&gt; modulo target. Ogni handoff espone route, entita, capability
          riusata, campi mancanti e prefill canonico senza logiche sparse.
        </p>
        <div className="internal-ai-pill-row" style={{ marginBottom: 12 }}>
          <span className="internal-ai-pill is-neutral">
            {snapshot.handoffs.length} handoff tracciati
          </span>
          <span
            className={
              conformance.gateStatus === "attivo"
                ? "internal-ai-pill is-success"
                : "internal-ai-pill is-warning"
            }
          >
            Gate moduli futuri {conformance.gateStatus}
          </span>
        </div>
        {snapshot.handoffs.length ? (
          <div className="internal-ai-list">
            {snapshot.handoffs.map((handoff) => (
              <div
                key={handoff.handoffId}
                className="internal-ai-list__row"
                style={
                  handoff.handoffId === selectedHandoffId
                    ? {
                        borderColor: "#2d6a4f",
                        boxShadow: "0 0 0 1px rgba(45, 106, 79, 0.2)",
                        background: "rgba(240, 253, 244, 0.55)",
                      }
                    : undefined
                }
              >
                <div className="internal-ai-list__row-header">
                  <strong>{handoff.moduloTarget}</strong>
                  <div className="internal-ai-pill-row">
                    {handoff.handoffId === selectedHandoffId ? (
                      <span className="internal-ai-pill is-success">Selezionato</span>
                    ) : null}
                    <span className="internal-ai-pill is-neutral">{handoff.statoRichiesta}</span>
                    <span className="internal-ai-pill is-neutral">{handoff.statoConsumo}</span>
                  </div>
                </div>
                <p className="internal-ai-card__meta">
                  Route: {handoff.routeTarget} | Azione: {handoff.azioneRichiesta}
                </p>
                <p className="internal-ai-card__meta">
                  Entita: {handoff.entityRef ? `${handoff.entityRef.entityKind} - ${handoff.entityRef.label}` : "nessuna"} | Capability:{" "}
                  {handoff.capabilityRiutilizzata ?? "nessuna"}
                </p>
                <p className="internal-ai-card__meta">
                  Ultimo consumo: {handoff.ultimoModuloConsumatore ?? "n/d"} | Path:{" "}
                  {handoff.ultimoPathConsumatore ?? "n/d"} | Aggiornato:{" "}
                  {handoff.ultimoAggiornamento ? new Date(handoff.ultimoAggiornamento).toLocaleString("it-IT") : "n/d"}
                </p>
                <div className="internal-ai-list">
                  {Object.entries(handoff.prefillCanonico)
                    .slice(0, 6)
                    .map(([key, value]) => (
                      <div key={`${handoff.handoffId}:${key}`}>
                        <strong>{key}</strong>
                        <p className="internal-ai-card__meta">{formatPrefillValue(value)}</p>
                      </div>
                    ))}
                </div>
                {handoff.campiMancanti.length ? (
                  <p className="internal-ai-card__meta">
                    Campi mancanti: {handoff.campiMancanti.join(", ")}
                  </p>
                ) : null}
                {handoff.campiDaVerificare.length ? (
                  <p className="internal-ai-card__meta">
                    Da verificare: {handoff.campiDaVerificare.join(", ")}
                  </p>
                ) : null}
                {handoff.cronologiaConsumo.length ? (
                  <div className="internal-ai-list">
                    {handoff.cronologiaConsumo.slice(-4).reverse().map((entry, index) => (
                      <div key={`${handoff.handoffId}:history:${index}`}>
                        <strong>{entry.status}</strong>
                        <p className="internal-ai-card__meta">
                          {new Date(entry.at).toLocaleString("it-IT")} | {entry.moduleId ?? "n/d"} |{" "}
                          {entry.routePath ?? "n/d"}
                        </p>
                        {entry.note ? (
                          <p className="internal-ai-card__meta">{entry.note}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                <Link to={handoff.routeTarget} className="internal-ai-chat__reference">
                  Apri {handoff.routeTarget}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="internal-ai-card__meta">
            Nessun handoff tracciato ancora. Invia una richiesta o un documento dalla chat
            universale per materializzare payload e prefill.
          </p>
        )}
      </article>
    </div>
  );
}
