import { useEffect, useRef, useState } from "react";
import CisternaCaravateIA from "../pages/CisternaCaravate/CisternaCaravateIA";
import { readNextCisternaSnapshot, type NextCisternaSnapshot } from "./domain/nextCisternaDomain";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";

export default function NextCisternaIAPage() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.cisterna",
  });
  const [snapshot, setSnapshot] = useState<NextCisternaSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lifecycleRef = useRef<string | null>(null);

  useEffect(() => {
    if (handoff.state.status !== "ready") {
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextCisternaSnapshot();
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
            : "Impossibile leggere il contesto cisterna clone-safe.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [handoff.state]);

  useEffect(() => {
    if (handoff.state.status !== "ready") {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "prefill_applicato",
      "Cisterna IA ha agganciato il payload standard e il contesto targa/documento nel boundary NEXT.",
    );
    handoff.acknowledge(
      handoff.state.requiresVerification ? "da_verificare" : "completato",
      handoff.state.requiresVerification
        ? "Cisterna IA e aperta con prefill ma richiede ancora verifica dei campi segnalati."
        : "Cisterna IA ha consumato il payload standard e apre il verticale corretto del clone.",
    );
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff]);

  return (
    <>
      {handoff.state.status === "ready" ? (
        <InternalAiUniversalHandoffBanner
          title="Handoff IA consumato su Cisterna"
          description="Il verticale cisterna del clone aggancia il payload standard e mostra subito il contesto specialistico corretto."
          payload={handoff.state.payload}
        />
      ) : null}
      {loading ? (
        <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
          Caricamento contesto cisterna...
        </div>
      ) : null}
      {error ? (
        <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
          {error}
        </div>
      ) : null}
      {snapshot ? (
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
          <strong>Contesto cisterna agganciato</strong>
          <p style={{ margin: 0 }}>
            Mese {snapshot.monthLabel} | Documenti {snapshot.counts.documents} | Schede {snapshot.counts.schede} |
            Supporto rifornimenti {snapshot.counts.supportRefuels}
          </p>
          <p style={{ margin: 0 }}>
            Targhe mese: {snapshot.report.perTarga.slice(0, 4).map((item) => item.targa).join(", ") || "nessuna"}
          </p>
        </div>
      ) : null}
      {handoff.state.status === "error" ? (
        <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
          {handoff.state.errorMessage}
        </div>
      ) : null}
      <CisternaCaravateIA />
    </>
  );
}
