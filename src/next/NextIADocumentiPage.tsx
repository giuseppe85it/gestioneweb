import { useEffect, useRef, useState } from "react";
import IADocumenti from "../pages/IA/IADocumenti";
import {
  readNextMezzoDocumentiCostiSnapshot,
  type NextMezzoDocumentiCostiSnapshot,
} from "./domain/nextDocumentiCostiDomain";
import NextMotherPage from "./NextMotherPage";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";

export default function NextIADocumentiPage() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.ia_hub",
  });
  const [snapshot, setSnapshot] = useState<NextMezzoDocumentiCostiSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lifecycleRef = useRef<string | null>(null);

  useEffect(() => {
    if (handoff.state.status !== "ready" || handoff.state.payload.documentType !== "documento_mezzo") {
      return;
    }

    const targetTarga = handoff.state.prefill.targa;
    if (!targetTarga) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextMezzoDocumentiCostiSnapshot(targetTarga);
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
            : "Impossibile leggere il contesto documentale del mezzo selezionato.",
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
    if (handoff.state.status !== "ready" || handoff.state.payload.documentType !== "documento_mezzo") {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    if (handoff.state.prefill.targa) {
      handoff.acknowledge(
        "prefill_applicato",
        "Documenti IA ha agganciato il contesto targa del payload tramite il boundary NEXT del modulo.",
      );
    }
    handoff.acknowledge(
      handoff.state.requiresVerification ? "da_verificare" : "completato",
      handoff.state.requiresVerification
        ? "Documenti IA ha aperto il contesto corretto ma mantiene la verifica sui campi segnalati."
        : "Documenti IA ha consumato il payload standard e mostra il contesto documentale corretto.",
    );
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff]);

  return (
    <>
      {handoff.state.status === "ready" && handoff.state.payload.documentType === "documento_mezzo" ? (
        <InternalAiUniversalHandoffBanner
          title="Handoff IA consumato su Documenti"
          description="Il boundary NEXT del modulo documenti aggancia la targa e mostra subito il contesto documentale rilevante."
          payload={handoff.state.payload}
        />
      ) : null}
      {loading ? (
        <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
          Caricamento contesto documentale...
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
          <strong>Contesto documentale agganciato</strong>
          <p style={{ margin: 0 }}>
            Targa {snapshot.mezzoTarga} | Documenti totali {snapshot.counts.total} | Preventivi {snapshot.counts.preventivi} |
            Fatture {snapshot.counts.fatture}
          </p>
          <p style={{ margin: 0 }}>
            Ultimi documenti:{" "}
            {snapshot.items.slice(0, 3).map((item) => item.title).join(" | ") || "nessuno"}
          </p>
        </div>
      ) : null}
      {handoff.state.status === "error" ? (
        <div className="next-clone-placeholder" style={{ marginBottom: 16 }}>
          {handoff.state.errorMessage}
        </div>
      ) : null}
      <NextMotherPage pageId="ia-documenti">
        <IADocumenti />
      </NextMotherPage>
    </>
  );
}
