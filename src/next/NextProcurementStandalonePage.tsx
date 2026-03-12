import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import NextProcurementReadOnlyPanel from "./NextProcurementReadOnlyPanel";
import type { NextProcurementCloneTab, NextProcurementListTab } from "./domain/nextProcurementDomain";
import {
  buildNextDettaglioOrdinePath,
  NEXT_ACQUISTI_PATH,
  NEXT_GESTIONE_OPERATIVA_PATH,
  NEXT_ORDINI_ARRIVATI_PATH,
  NEXT_ORDINI_IN_ATTESA_PATH,
} from "./nextStructuralPaths";
import { useNextOperativitaSnapshot } from "./useNextOperativitaSnapshot";

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

function getActiveTab(mode: ProcurementPageMode): NextProcurementCloneTab {
  if (mode === "ordine-materiali") return "ordine-materiali";
  if (mode === "arrivi") return "arrivi";
  if (mode === "dettaglio") return "ordini";
  return "ordini";
}

export default function NextProcurementStandalonePage({
  mode,
}: {
  mode: ProcurementPageMode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { ordineId } = useParams<{ ordineId: string }>();
  const { snapshot, loading, error } = useNextOperativitaSnapshot();

  const detailBackTab = useMemo<NextProcurementListTab>(() => {
    const params = new URLSearchParams(location.search);
    return params.get("from") === "arrivi" ? "arrivi" : "ordini";
  }, [location.search]);

  const activeTab = getActiveTab(mode);
  const panelOrderId = mode === "dettaglio" ? ordineId ?? null : null;

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa / Procurement"
      title={getTitle(mode)}
      description={getDescription(mode)}
      backTo={getBackPath(mode, detailBackTab)}
      backLabel={getBackLabel(mode)}
      notice={
        <p>
          La pagina mantiene l&apos;autonomia di routing della madre. Creazione ordini, preventivi,
          listino, PDF operativi e modifiche restano bloccati nel clone.
        </p>
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
          onTabChange={() => {
            return;
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
