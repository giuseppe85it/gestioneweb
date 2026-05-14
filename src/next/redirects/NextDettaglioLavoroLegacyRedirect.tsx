import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NEXT_MANUTENZIONI_PATH } from "../nextStructuralPaths";

export default function NextDettaglioLavoroLegacyRedirect() {
  const navigate = useNavigate();
  const { lavoroId } = useParams<{ lavoroId?: string }>();

  useEffect(() => {
    const rawId = String(lavoroId ?? "").trim();
    if (!rawId) {
      navigate(NEXT_MANUTENZIONI_PATH, { replace: true });
      return;
    }

    const recordId = rawId.startsWith("from-lavoro-") ? rawId : `from-lavoro-${rawId}`;
    navigate(`${NEXT_MANUTENZIONI_PATH}?recordId=${encodeURIComponent(recordId)}`, {
      replace: true,
    });
  }, [lavoroId, navigate]);

  return <div className="next-clone-placeholder">Reindirizzamento a Manutenzioni...</div>;
}
