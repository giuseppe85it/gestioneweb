import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import NextMaterialiConsegnatiReadOnlyPanel from "./NextMaterialiConsegnatiReadOnlyPanel";
import {
  readNextMaterialiMovimentiSnapshot,
  type NextMaterialiMovimentiSnapshot,
} from "./domain/nextMaterialiMovimentiDomain";
import { NEXT_GESTIONE_OPERATIVA_PATH } from "./nextStructuralPaths";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";

export default function NextMaterialiConsegnatiPage() {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.operativita",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<NextMaterialiMovimentiSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lifecycleRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextMaterialiMovimentiSnapshot();
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
            : "Impossibile leggere i movimenti materiali clone-safe.",
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
  }, []);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const preferredTarga = handoff.state.status === "ready"
    ? handoff.state.prefill.targa ?? searchParams.get("targa")
    : searchParams.get("targa");
  const preferredMateriale = handoff.state.status === "ready"
    ? handoff.state.prefill.queryMateriale ?? handoff.state.prefill.materiale ?? searchParams.get("queryMateriale")
    : searchParams.get("queryMateriale");

  useEffect(() => {
    if (handoff.state.status !== "ready" || !snapshot) {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "prefill_applicato",
      "Il modulo materiali ha applicato il filtro destinatario/materiale derivato dal payload IA.",
    );
    if (handoff.state.requiresVerification) {
      handoff.acknowledge(
        "da_verificare",
        "Il modulo materiali e stato aperto con prefill, ma richiede ancora verifica sui campi segnalati.",
      );
    } else {
      handoff.acknowledge(
        "completato",
        "Il modulo materiali del clone ha agganciato il payload IA e mostra il contesto corretto.",
      );
    }
    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff, snapshot]);

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Materiali"
      title="Materiali consegnati"
      description="Vista clone-safe dei movimenti materiali con aggancio diretto al payload IA universale."
      backTo={NEXT_GESTIONE_OPERATIVA_PATH}
      backLabel="Gestione Operativa"
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {handoff.state.status === "ready" ? (
            <InternalAiUniversalHandoffBanner
              title="Handoff IA consumato su Materiali"
              description="Il route consumer NEXT porta il payload nel pannello materiali e nel destinatario corretto, senza riaprire scritture di magazzino."
              payload={handoff.state.payload}
            />
          ) : null}
          {handoff.state.status === "error" ? (
            <div className="next-clone-placeholder">{handoff.state.errorMessage}</div>
          ) : null}
          <p>
            La pagina resta in sola lettura: registrazioni consegna, eliminazioni e PDF operativi
            restano fuori dal perimetro del clone.
          </p>
        </div>
      }
    >
      {loading ? <div className="next-clone-placeholder">Caricamento movimenti materiali...</div> : null}
      {error ? <div className="next-clone-placeholder">{error}</div> : null}
      {snapshot ? (
        <NextMaterialiConsegnatiReadOnlyPanel
          snapshot={snapshot}
          blockedReason="Clone read-only: le consegne materiali restano bloccate."
          onOpenDossier={(targa) => {
            if (!targa) {
              return;
            }
            navigate(`/next/dossier/${encodeURIComponent(targa)}`);
          }}
          preferredTarga={preferredTarga}
          preferredMateriale={preferredMateriale}
          preferredLabel={handoff.state.status === "ready" ? handoff.state.prefill.autista : null}
        />
      ) : null}
    </NextClonePageScaffold>
  );
}
