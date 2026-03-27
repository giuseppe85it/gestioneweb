import type { ReactNode } from "react";
import type { InternalAiUniversalHandoffPayload } from "./internalAiUniversalTypes";

function renderPrefillValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null || value === undefined || value === "") {
    return "n/d";
  }

  return String(value);
}

function getStatusTone(status: InternalAiUniversalHandoffPayload["statoConsumo"]) {
  if (status === "completato") return { border: "#bbf7d0", background: "#f0fdf4", color: "#166534" };
  if (status === "errore") return { border: "#fecaca", background: "#fef2f2", color: "#991b1b" };
  if (status === "da_verificare") return { border: "#fde68a", background: "#fffbeb", color: "#92400e" };
  return { border: "#dbeafe", background: "#eff6ff", color: "#1d4ed8" };
}

export default function InternalAiUniversalHandoffBanner(props: {
  title: string;
  description: string;
  payload: InternalAiUniversalHandoffPayload;
  children?: ReactNode;
}) {
  const tone = getStatusTone(props.payload.statoConsumo);

  return (
    <section
      style={{
        display: "grid",
        gap: 12,
        marginBottom: 16,
        padding: "14px 16px",
        borderRadius: 14,
        border: `1px solid ${tone.border}`,
        background: tone.background,
        color: tone.color,
      }}
    >
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <strong>{props.title}</strong>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>
          {props.payload.statoConsumo.toUpperCase()}
        </span>
        <span style={{ fontSize: 12 }}>
          Handoff {props.payload.handoffId}
        </span>
      </div>
      <p style={{ margin: 0 }}>{props.description}</p>
      <p style={{ margin: 0 }}>{props.payload.motivoInstradamento}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13 }}>
          Entita:{" "}
          {props.payload.entityRef
            ? `${props.payload.entityRef.entityKind} - ${props.payload.entityRef.label}`
            : "nessuna"}
        </span>
        <span style={{ fontSize: 13 }}>Azione: {props.payload.azioneRichiesta}</span>
        <span style={{ fontSize: 13 }}>
          Capability: {props.payload.capabilityRiutilizzata ?? "nessuna"}
        </span>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {Object.entries(props.payload.prefillCanonico)
          .slice(0, 6)
          .map(([key, value]) => (
            <div key={`${props.payload.handoffId}:${key}`} style={{ fontSize: 13 }}>
              <strong>{key}</strong>: {renderPrefillValue(value)}
            </div>
          ))}
      </div>
      {props.payload.campiMancanti.length ? (
        <div style={{ fontSize: 13 }}>
          <strong>Campi mancanti:</strong> {props.payload.campiMancanti.join(", ")}
        </div>
      ) : null}
      {props.payload.campiDaVerificare.length ? (
        <div style={{ fontSize: 13 }}>
          <strong>Da verificare:</strong> {props.payload.campiDaVerificare.join(", ")}
        </div>
      ) : null}
      {props.children}
    </section>
  );
}
