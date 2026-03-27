import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import NextProcurementReadOnlyPanel from "./NextProcurementReadOnlyPanel";
import type { NextProcurementCloneTab, NextProcurementListTab } from "./domain/nextProcurementDomain";
import {
  buildNextDettaglioOrdinePath,
  NEXT_ACQUISTI_PATH,
  NEXT_GESTIONE_OPERATIVA_PATH,
  NEXT_MATERIALI_DA_ORDINARE_PATH,
  NEXT_ORDINI_ARRIVATI_PATH,
  NEXT_ORDINI_IN_ATTESA_PATH,
} from "./nextStructuralPaths";
import { useNextOperativitaSnapshot } from "./useNextOperativitaSnapshot";
import InternalAiUniversalHandoffBanner from "./internal-ai/InternalAiUniversalHandoffBanner";
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

function getTitle(mode: ProcurementPageMode) {
  if (mode === "ordine-materiali") return "Materiali da ordinare";
  if (mode === "ordini") return "Ordini in attesa";
  if (mode === "arrivi") return "Ordini arrivati";
  if (mode === "dettaglio") return "Dettaglio ordine";
  return "Acquisti";
}

function getDescription(mode: ProcurementPageMode) {
  if (mode === "ordine-materiali") {
    return "La route clone esiste come pagina vera della madre, ma il flusso resta neutralizzato per evitare scritture o bozze ingannevoli.";
  }
  if (mode === "ordini") {
    return "Lista clone autonoma degli ordini in attesa, separata dal vecchio hub query-driven.";
  }
  if (mode === "arrivi") {
    return "Lista clone autonoma degli ordini arrivati, con dettaglio leggibile e azioni bloccate.";
  }
  if (mode === "dettaglio") {
    return "Dettaglio ordine clone-safe su route dedicata, in sola lettura.";
  }
  return "Controparte clone read-only della pagina madre Acquisti, ora raggiungibile con route autonoma.";
}

function getBackPath(mode: ProcurementPageMode, backTab: NextProcurementListTab) {
  if (mode === "ordine-materiali") return NEXT_GESTIONE_OPERATIVA_PATH;
  if (mode === "ordini" || mode === "arrivi") return NEXT_ACQUISTI_PATH;
  if (mode === "dettaglio") return PROCUREMENT_PATH_BY_TAB[backTab];
  return NEXT_GESTIONE_OPERATIVA_PATH;
}

function getBackLabel(mode: ProcurementPageMode) {
  if (mode === "ordine-materiali") return "Gestione Operativa";
  if (mode === "ordini" || mode === "arrivi") return "Acquisti";
  if (mode === "dettaglio") return "Torna alla lista";
  return "Gestione Operativa";
}

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
  const { snapshot, loading, error } = useNextOperativitaSnapshot();
  const lifecycleRef = useRef<string | null>(null);

  const detailBackTab = useMemo<NextProcurementListTab>(() => {
    const params = new URLSearchParams(location.search);
    return params.get("from") === "arrivi" ? "arrivi" : "ordini";
  }, [location.search]);

  const handoffOrderId = useMemo(() => {
    if (handoff.state.status !== "ready") {
      return null;
    }

    return handoff.state.payload.entityRef?.entityKind === "ordine"
      ? handoff.state.payload.entityRef.matchedId ?? handoff.state.payload.entityRef.normalizedValue
      : null;
  }, [handoff.state]);

  const activeTab = useMemo<NextProcurementCloneTab>(() => {
    if (mode === "dettaglio") {
      return "ordini";
    }

    const requestedTab = new URLSearchParams(location.search).get("tab");
    if (requestedTab === "arrivi" || requestedTab === "ordini") {
      return requestedTab;
    }

    return "ordini";
  }, [location.search, mode]);

  const panelOrderId = mode === "dettaglio" ? ordineId ?? handoffOrderId ?? null : handoffOrderId;

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

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Procurement"
      title={getTitle(mode)}
      description={getDescription(mode)}
      backTo={getBackPath(mode, detailBackTab)}
      backLabel={getBackLabel(mode)}
      notice={
        <div style={{ display: "grid", gap: 12 }}>
          {handoff.state.status === "ready" ? (
            <InternalAiUniversalHandoffBanner
              title="Handoff IA standard consumato"
              description="Il procurement clone-safe legge il payload, applica il prefill coerente e mantiene il flusso in sola lettura."
              payload={handoff.state.payload}
            />
          ) : null}
          {handoff.state.status === "error" ? (
            <div className="next-clone-placeholder">{handoff.state.errorMessage}</div>
          ) : null}
          <p>
            La pagina mantiene l&apos;autonomia di routing della madre. Creazione ordini, preventivi,
            listino, PDF operativi e modifiche restano bloccati nel clone.
          </p>
        </div>
      }
    >
      {loading ? <div className="next-clone-placeholder">Caricamento procurement...</div> : null}
      {error ? <div className="next-clone-placeholder">{error}</div> : null}
      {snapshot ? (
        <NextProcurementReadOnlyPanel
          snapshot={snapshot.procurement}
          activeTab={activeTab}
          orderId={panelOrderId}
          detailBackTab={detailBackTab}
          iaPrefill={iaPrefill}
          onTabChange={(tab) => {
            if (tab === "ordine-materiali") {
              navigate(NEXT_MATERIALI_DA_ORDINARE_PATH);
              return;
            }

            if (tab === "arrivi") {
              navigate(NEXT_ORDINI_ARRIVATI_PATH);
              return;
            }

            if (tab === "ordini") {
              navigate(NEXT_ORDINI_IN_ATTESA_PATH);
              return;
            }

            navigate(`${NEXT_ACQUISTI_PATH}?tab=${encodeURIComponent(tab)}`);
          }}
          onOpenOrder={(orderId, fromTab) => {
            navigate(`${buildNextDettaglioOrdinePath(orderId)}?from=${encodeURIComponent(fromTab)}`);
          }}
          onCloseOrder={(backTab) => {
            navigate(PROCUREMENT_PATH_BY_TAB[backTab]);
          }}
        />
      ) : null}
    </NextClonePageScaffold>
  );
}
