import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CentroControllo from "../pages/CentroControllo";
import { NEXT_GESTIONE_OPERATIVA_PATH } from "./nextStructuralPaths";

export default function NextCentroControlloClonePage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const interceptLegacyBack = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".cc-back")) return;
      event.preventDefault();
      event.stopPropagation();
      navigate(NEXT_GESTIONE_OPERATIVA_PATH);
    };

    root.addEventListener("click", interceptLegacyBack, true);
    return () => {
      root.removeEventListener("click", interceptLegacyBack, true);
    };
  }, [navigate]);

  return <div ref={rootRef}><CentroControllo /></div>;
}

