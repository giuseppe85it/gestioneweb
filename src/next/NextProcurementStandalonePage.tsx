import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import NextProcurementReadOnlyPanel from "./NextProcurementReadOnlyPanel";
import {
  readNextProcurementSnapshot,
  type NextProcurementCloneTab,
  type NextProcurementListTab,
  type NextProcurementSnapshot,
} from "./domain/nextProcurementDomain";
import {
  buildNextDettaglioOrdinePath,
  NEXT_ACQUISTI_PATH,
  NEXT_ORDINI_ARRIVATI_PATH,
  NEXT_ORDINI_IN_ATTESA_PATH,
} from "./nextStructuralPaths";
import { useInternalAiUniversalHandoffConsumer } from "./internal-ai/internalAiUniversalHandoffConsumer";

type ProcurementPageMode =
  | "acquisti"
  | "ordine-materiali"
  | "ordini"
  | "arrivi"
  | "dettaglio";

const PROCUREMENT_PATH_BY_TAB: Record<NextProcurementListTab, string> = {
  ordini: NEXT_ORDINI_IN_ATTESA_PATH,
  arrivi: NEXT_ORDINI_ARRIVATI_PATH,
};

export default function NextProcurementStandalonePage({
  mode,
}: {
  mode: ProcurementPageMode;
}) {
  const handoff = useInternalAiUniversalHandoffConsumer({
    moduleId: "next.procurement",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { ordineId } = useParams<{ ordineId: string }>();
  const [snapshot, setSnapshot] = useState<NextProcurementSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lifecycleRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextProcurementSnapshot({
          includeCloneOverlays: false,
        });
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
          loadError instanceof Error && loadError.message
            ? loadError.message
            : "Impossibile leggere il workbench procurement in sola lettura.",
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

  const detailBackTab = useMemo<NextProcurementListTab>(() => {
    const params = new URLSearchParams(location.search);
    return params.get("from") === "arrivi" ? "arrivi" : "ordini";
  }, [location.search]);

  const handoffOrderId = useMemo(() => {
    if (handoff.state.status !== "ready") {
      return null;
    }

    return handoff.state.payload.entityRef?.entityKind === "ordine"
      ? handoff.state.payload.entityRef.matchedId ??
          handoff.state.payload.entityRef.normalizedValue
      : null;
  }, [handoff.state]);

  const activeTab = useMemo<NextProcurementCloneTab>(() => {
    if (mode === "dettaglio") {
      return detailBackTab === "arrivi" ? "arrivi" : "ordini";
    }

    if (mode === "ordine-materiali") {
      return "ordine-materiali";
    }

    if (mode === "ordini") {
      return "ordini";
    }

    if (mode === "arrivi") {
      return "arrivi";
    }

    const requestedTab = new URLSearchParams(location.search).get("tab");
    if (
      requestedTab === "ordine-materiali" ||
      requestedTab === "ordini" ||
      requestedTab === "arrivi" ||
      requestedTab === "preventivi" ||
      requestedTab === "listino"
    ) {
      return requestedTab;
    }

    return "ordini";
  }, [detailBackTab, location.search, mode]);

  const panelOrderId =
    mode === "dettaglio" ? ordineId ?? handoffOrderId ?? null : handoffOrderId;

  const iaPrefill = useMemo(() => {
    if (handoff.state.status !== "ready") {
      return null;
    }

    return {
      handoffId: handoff.state.payload.handoffId,
      fornitore: handoff.state.prefill.fornitore,
      materiale: handoff.state.prefill.materiale,
      documentoNome: handoff.state.prefill.documentoNome,
      note: handoff.state.payload.motivoInstradamento,
      statusLabel: handoff.state.payload.statoConsumo,
      missingFields: handoff.state.payload.campiMancanti,
      verifyFields: handoff.state.payload.campiDaVerificare,
    };
  }, [handoff.state]);

  useEffect(() => {
    if (handoff.state.status !== "ready" || !snapshot) {
      return;
    }

    if (lifecycleRef.current === handoff.state.payload.handoffId) {
      return;
    }

    handoff.acknowledge(
      "prefill_applicato",
      "Il modulo procurement ha applicato tab, filtro fornitore/materiale e contesto ordine del payload IA.",
    );

    if (handoff.state.requiresVerification) {
      handoff.acknowledge(
        "da_verificare",
        "Il procurement e stato aperto con prefill, ma richiede ancora verifica dei campi segnalati dal payload.",
      );
    } else {
      handoff.acknowledge(
        "completato",
        "Il procurement del clone ha agganciato il payload standard e mostra il punto corretto della UI.",
      );
    }

    lifecycleRef.current = handoff.state.payload.handoffId;
  }, [handoff, snapshot]);

  if (loading) {
    return (
      <div className="acq-page">
        <div className="acq-shell">
          <div className="acq-list-empty">
            Caricamento workbench procurement in sola lettura...
          </div>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="acq-page">
        <div className="acq-shell">
          <div className="acq-list-empty">
            {error || "Workbench procurement in sola lettura non disponibile."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <NextProcurementReadOnlyPanel
      snapshot={snapshot}
      activeTab={activeTab}
      orderId={panelOrderId}
      detailBackTab={detailBackTab}
      iaPrefill={iaPrefill}
      onTabChange={(tab) => {
        if (tab === "ordini") {
          navigate(NEXT_ORDINI_IN_ATTESA_PATH);
          return;
        }

        if (tab === "arrivi") {
          navigate(NEXT_ORDINI_ARRIVATI_PATH);
          return;
        }

        navigate(`${NEXT_ACQUISTI_PATH}?tab=${encodeURIComponent(tab)}`);
      }}
      onOpenOrder={(orderIdToOpen, fromTab) => {
        navigate(
          `${buildNextDettaglioOrdinePath(orderIdToOpen)}?from=${encodeURIComponent(
            fromTab,
          )}`,
        );
      }}
      onCloseOrder={(backTab) => {
        navigate(PROCUREMENT_PATH_BY_TAB[backTab]);
      }}
    />
  );
}
