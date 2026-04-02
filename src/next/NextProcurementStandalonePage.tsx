import { Navigate, useLocation, useParams } from "react-router-dom";
import {
  NEXT_MATERIALI_DA_ORDINARE_PATH,
} from "./nextStructuralPaths";

type ProcurementPageMode =
  | "acquisti"
  | "ordine-materiali"
  | "ordini"
  | "arrivi"
  | "dettaglio";

function resolveCanonicalTab(
  mode: ProcurementPageMode,
  search: URLSearchParams,
): "fabbisogni" | "ordini" | "arrivi" | "preventivi" | "listino" {
  if (mode === "ordine-materiali") return "fabbisogni";
  if (mode === "ordini") return "ordini";
  if (mode === "arrivi") return "arrivi";
  if (mode === "dettaglio") {
    return search.get("from") === "arrivi" ? "arrivi" : "ordini";
  }

  const requestedTab = search.get("tab");
  if (requestedTab === "fabbisogni" || requestedTab === "ordine-materiali") {
    return "fabbisogni";
  }
  if (requestedTab === "arrivi") return "arrivi";
  if (requestedTab === "preventivi") return "preventivi";
  if (requestedTab === "listino") return "listino";
  return "ordini";
}

export default function NextProcurementStandalonePage({
  mode,
}: {
  mode: ProcurementPageMode;
}) {
  const location = useLocation();
  const { ordineId } = useParams<{ ordineId: string }>();
  const currentSearch = new URLSearchParams(location.search);
  const nextSearch = new URLSearchParams();
  const iaHandoff = currentSearch.get("iaHandoff");

  if (iaHandoff) {
    nextSearch.set("iaHandoff", iaHandoff);
  }

  const tab = resolveCanonicalTab(mode, currentSearch);
  if (tab !== "fabbisogni") {
    nextSearch.set("tab", tab);
  }

  if (mode === "dettaglio" && ordineId) {
    nextSearch.set("orderId", ordineId);
    nextSearch.set("from", currentSearch.get("from") === "arrivi" ? "arrivi" : "ordini");
  }

  const destination = `${NEXT_MATERIALI_DA_ORDINARE_PATH}${
    nextSearch.toString() ? `?${nextSearch.toString()}` : ""
  }`;

  return <Navigate replace to={destination} />;
}
