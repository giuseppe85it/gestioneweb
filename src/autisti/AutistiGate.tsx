import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAutistaLocal, getMezzoLocal } from "./autistiStorage";
import { getItemSync } from "../utils/storageSync";

const CONTROLLI_KEY = "@controlli_mezzo_autisti";

export default function AutistiGate() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function checkFlow() {
      // Supporta sia funzioni sync che async (se autistiStorage cambia)
      const autista: any = await Promise.resolve((getAutistaLocal as any)());
      const mezzo: any = await Promise.resolve((getMezzoLocal as any)());

      if (cancelled) return;

      // 1) Nessun autista locale -> login
      if (!autista || !autista.badge) {
        navigate("/autisti/login", { replace: true });
        return;
      }

      // 2) Nessun mezzo locale o nessuna motrice -> setup
      if (!mezzo || !mezzo.targaCamion) {
        navigate("/autisti/setup-mezzo", { replace: true });
        return;
      }

      // 3) Controllo mezzo obbligatorio (solo se esiste la lista)
      const controlliRaw = (await getItemSync(CONTROLLI_KEY)) || [];
      const controlli = Array.isArray(controlliRaw) ? controlliRaw : [];

      const controlloValido = controlli
        .filter((c: any) => c?.obbligatorio === true)
        .find(
          (c: any) =>
            c?.badgeAutista === autista.badge &&
            c?.targaCamion === mezzo.targaCamion
        );

      if (!controlloValido) {
        navigate("/autisti/controllo", { replace: true });
        return;
      }

      // 4) OK -> home
      navigate("/autisti/home", { replace: true });
    }

    checkFlow();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return null;
}
