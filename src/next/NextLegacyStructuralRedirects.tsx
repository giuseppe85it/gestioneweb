import { Navigate, useLocation, useParams } from "react-router-dom";
import {
  buildNextDossierPath,
  NEXT_MANUTENZIONI_PATH,
  NEXT_MEZZI_PATH,
  resolveNextOperativitaLegacyPath,
} from "./nextStructuralPaths";

export function NextOperativitaLegacyRedirect() {
  const location = useLocation();
  return <Navigate replace to={resolveNextOperativitaLegacyPath(location.search)} />;
}

export function NextMezziDossierLegacyRedirect() {
  const location = useLocation();
  return (
    <Navigate
      replace
      to={{
        pathname: NEXT_MEZZI_PATH,
        search: location.search,
      }}
    />
  );
}

export function NextMezziDossierDetailLegacyRedirect() {
  const location = useLocation();
  const { targa } = useParams<{ targa: string }>();
  return (
    <Navigate
      replace
      to={{
        pathname: targa ? buildNextDossierPath(targa) : NEXT_MEZZI_PATH,
        search: location.search,
      }}
    />
  );
}

export function NextDettaglioLavoroLegacyRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const lavoroId = params.get("lavoroId");
  if (!lavoroId) {
    return <Navigate replace to={NEXT_MANUTENZIONI_PATH} />;
  }
  const next = new URLSearchParams(location.search);
  next.delete("lavoroId");
  next.set(
    "recordId",
    lavoroId.startsWith("from-lavoro-")
      ? lavoroId
      : `from-lavoro-${lavoroId}`,
  );
  const serialized = next.toString();
  const target = NEXT_MANUTENZIONI_PATH;
  return <Navigate replace to={serialized ? `${target}?${serialized}` : target} />;
}
