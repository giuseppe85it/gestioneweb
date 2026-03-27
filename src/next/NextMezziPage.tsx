import { useEffect, useRef } from "react";
import NextMezziDossierPage from "./NextMezziDossierPage";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";

export default function NextMezziPage() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.dossier",
  });
  const lifecycleRef = useRef<string | null>(null);

  useEffect(() => {
    if (handoff.state.status !== "ready") {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "prefill_applicato",
      "Il modulo Mezzi ha applicato il prefill targa/mezzo gia supportato dalla UI clone-safe.",
    );
    if (handoff.state.requiresVerification) {
      handoff.acknowledge(
        "da_verificare",
        "Il modulo Mezzi e stato aperto con prefill ma richiede ancora verifica sui campi segnalati.",
      );
    } else {
      handoff.acknowledge(
        "completato",
        "Il modulo Mezzi del clone ha agganciato il payload IA e pre-seleziona il mezzo corretto.",
      );
    }
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff]);

  return (
    <>
      {handoff.state.status === "ready" ? (
        <InternalAiUniversalHandoffBanner
          title="Handoff IA consumato su Mezzi"
          description="Il modulo Mezzi clone-safe legge il payload e usa il prefill route-driven per aprire il mezzo corretto."
          payload={handoff.state.payload}
        />
      ) : null}
      {handoff.state.status === "error" ? (
        <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
          {handoff.state.errorMessage}
        </div>
      ) : null}
      <NextMezziDossierPage />
    </>
  );
}
