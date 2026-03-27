import { useEffect, useRef } from "react";
import IALibretto from "../pages/IA/IALibretto";
import NextMotherPage from "./NextMotherPage";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";

export default function NextIALibrettoPage() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.ia_hub",
  });
  const lifecycleRef = useRef<string | null>(null);

  useEffect(() => {
    if (handoff.state.status !== "ready") {
      return;
    }

    if (handoff.state.payload.documentType !== "libretto_mezzo") {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "prefill_applicato",
      "Il flusso Libretto ha applicato il prefill targa gia supportato dalla route clone-safe.",
    );
    if (handoff.state.requiresVerification) {
      handoff.acknowledge(
        "da_verificare",
        "Il flusso Libretto e stato aperto con prefill ma richiede ancora verifica sui campi segnalati.",
      );
    } else {
      handoff.acknowledge(
        "completato",
        "Il flusso Libretto del clone ha agganciato il payload IA e apre il punto corretto della UI.",
      );
    }

    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff]);

  return (
    <>
      {handoff.state.status === "ready" && handoff.state.payload.documentType === "libretto_mezzo" ? (
        <InternalAiUniversalHandoffBanner
          title="Handoff IA consumato su Libretto"
          description="La route clone-safe usa il payload per filtrare la targa corretta e mantenere il flusso libretto nel punto giusto."
          payload={handoff.state.payload}
        />
      ) : null}
      {handoff.state.status === "error" ? (
        <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
          {handoff.state.errorMessage}
        </div>
      ) : null}
      <NextMotherPage pageId="ia-libretto">
        <IALibretto />
      </NextMotherPage>
    </>
  );
}
