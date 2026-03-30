import { useEffect, useMemo, useRef, useState } from "react";
import AutistiAdmin from "./autistiInbox/NextAutistiAdminNative";
import {
  readNextAutistiReadOnlySnapshot,
  type NextAutistiReadOnlySnapshot,
} from "./domain/nextAutistiDomain";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";
import NextLegacyStorageBoundary from "./NextLegacyStorageBoundary";

function normalizeText(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export default function NextAutistiAdminPage() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.autisti",
  });
  const [snapshot, setSnapshot] = useState<NextAutistiReadOnlySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lifecycleRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setError(null);
        const nextSnapshot = await readNextAutistiReadOnlySnapshot();
        if (cancelled) {
          return;
        }
        setSnapshot(nextSnapshot);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setSnapshot(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossibile leggere il contesto autisti clone-safe.",
        );
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSummary = useMemo(() => {
    if (!snapshot || handoff.state.status !== "ready") {
      return null;
    }

    const autistaQuery = normalizeText(handoff.state.prefill.autista);
    const badgeQuery = normalizeText(handoff.state.prefill.badge);
    const targaQuery = normalizeText(handoff.state.prefill.targa);

    const assignments = snapshot.assignments.filter((entry) => {
      const matchesAutista = autistaQuery
        ? normalizeText(entry.autistaNome).includes(autistaQuery)
        : true;
      const matchesBadge = badgeQuery ? normalizeText(entry.badgeAutista).includes(badgeQuery) : true;
      const matchesTarga = targaQuery ? normalizeText(entry.mezzoTarga).includes(targaQuery) : true;
      return matchesAutista && matchesBadge && matchesTarga;
    });
    const signals = snapshot.signals.filter((entry) => {
      const matchesAutista = autistaQuery
        ? normalizeText(entry.autistaNome).includes(autistaQuery)
        : true;
      const matchesBadge = badgeQuery ? normalizeText(entry.badgeAutista).includes(badgeQuery) : true;
      const matchesTarga = targaQuery ? normalizeText(entry.mezzoTarga).includes(targaQuery) : true;
      return matchesAutista && matchesBadge && matchesTarga;
    });

    return {
      assignments,
      signals,
    };
  }, [handoff.state, snapshot]);

  useEffect(() => {
    if (handoff.state.status !== "ready" || !snapshot) {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "prefill_applicato",
      "Autisti admin ha agganciato il payload standard e il contesto badge/targa nel boundary NEXT.",
    );
    handoff.acknowledge(
      handoff.state.requiresVerification ? "da_verificare" : "completato",
      handoff.state.requiresVerification
        ? "Autisti admin e stato aperto con prefill ma richiede ancora verifica dei campi segnalati."
        : "Autisti admin ha consumato il payload standard e mostra il contesto corretto del clone.",
    );
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff, snapshot]);

  return (
    <NextLegacyStorageBoundary presets={["flotta", "autisti", "lavori", "manutenzioni"]}>
      <>
        {handoff.state.status === "ready" ? (
          <InternalAiUniversalHandoffBanner
            title="Handoff IA consumato su Autisti Admin"
            description="Il boundary NEXT applica badge, autista e targa del payload e mantiene il modulo admin nel perimetro clone-safe."
            payload={handoff.state.payload}
          />
        ) : null}
        {filteredSummary ? (
          <div
            style={{
              display: "grid",
              gap: 10,
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#f8fafc",
            }}
          >
            <strong>Contesto autisti agganciato</strong>
            <p style={{ margin: 0 }}>
              Assegnazioni rilevanti {filteredSummary.assignments.length} | Segnali rilevanti {filteredSummary.signals.length}
            </p>
            <p style={{ margin: 0 }}>
              Top segnali: {filteredSummary.signals.slice(0, 3).map((entry) => entry.titolo).join(" | ") || "nessuno"}
            </p>
          </div>
        ) : null}
        {error ? (
          <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
            {error}
          </div>
        ) : null}
        {handoff.state.status === "error" ? (
          <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
            {handoff.state.errorMessage}
          </div>
        ) : null}
        <AutistiAdmin />
      </>
    </NextLegacyStorageBoundary>
  );
}
