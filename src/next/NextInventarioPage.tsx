import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import NextInventarioReadOnlyPanel from "./NextInventarioReadOnlyPanel";
import { readNextInventarioSnapshot, type NextInventarioSnapshot } from "./domain/nextInventarioDomain";
import { NEXT_GESTIONE_OPERATIVA_PATH } from "./nextStructuralPaths";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";

export default function NextInventarioPage() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.operativita",
  });
  const location = useLocation();
  const [snapshot, setSnapshot] = useState<NextInventarioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lifecycleRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextInventarioSnapshot();
        if (cancelled) {
          return;
        }
        setSnapshot(nextSnapshot);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setSnapshot(null);
        setError(loadError instanceof Error ? loadError.message : "Impossibile leggere l'inventario clone-safe.");
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
  }, []);

  const locationQuery = useMemo(
    () => new URLSearchParams(location.search).get("queryMateriale"),
    [location.search],
  );
  const initialQuery = handoff.state.status === "ready"
    ? handoff.state.prefill.queryMateriale ?? handoff.state.prefill.materiale ?? locationQuery
    : locationQuery;

  useEffect(() => {
    if (handoff.state.status !== "ready" || !snapshot) {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "prefill_applicato",
      "L'inventario clone-safe ha applicato il filtro materiale proveniente dal payload IA.",
    );
    if (handoff.state.requiresVerification) {
      handoff.acknowledge(
        "da_verificare",
        "Il pannello inventario e stato aperto con prefill ma richiede ancora verifica sui campi indicati.",
      );
    } else {
      handoff.acknowledge(
        "completato",
        "Il pannello inventario del clone ha agganciato il payload IA e mostra il punto corretto della UI.",
      );
    }
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff, snapshot]);

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Inventario"
      title="Inventario"
      description="Vista clone-safe dell'inventario con filtri applicabili dal payload IA universale."
      backTo={NEXT_GESTIONE_OPERATIVA_PATH}
      backLabel="Gestione Operativa"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {handoff.state.status === "ready" ? (
            <InternalAiUniversalHandoffBanner
              title="Handoff IA consumato su Inventario"
              description="Il route consumer NEXT applica il prefill canonico al pannello inventario senza riaprire scritture o carichi di magazzino."
              payload={handoff.state.payload}
            />
          ) : null}
          {handoff.state.status === "error" ? (
            <div className="next-clone-placeholder">{handoff.state.errorMessage}</div>
          ) : null}
          <p>
            Nel clone l&apos;inventario resta consultabile in sola lettura. Carichi, scarichi,
            variazioni stock e PDF operativi restano bloccati.
          </p>
        </div>
      }
    >
      {loading ? <div className="next-clone-placeholder">Caricamento inventario...</div> : null}
      {error ? <div className="next-clone-placeholder">{error}</div> : null}
      {snapshot ? (
        <NextInventarioReadOnlyPanel
          snapshot={snapshot}
          blockedReason="Clone read-only: le azioni di magazzino restano bloccate."
          initialQuery={initialQuery}
        />
      ) : null}
    </NextClonePageScaffold>
  );
}
