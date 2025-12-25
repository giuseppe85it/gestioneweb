import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAutistaLocal,
  getLastHandledRevokedAt,
  getMezzoLocal,
  removeMezzoLocal,
  saveMezzoLocal,
  setLastHandledRevokedAt,
} from "./autistiStorage";
import { getItemSync } from "../utils/storageSync";

const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const SESSIONI_KEY = "@autisti_sessione_attive";

export default function AutistiGate() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function checkRevoca(autistaArg?: any, mezzoArg?: any) {
      if (cancelled) return false;
      const autista: any =
        autistaArg ?? (await Promise.resolve((getAutistaLocal as any)()));
      if (!autista?.badge) return false;
      const mezzo: any = mezzoArg ?? (await Promise.resolve((getMezzoLocal as any)()));
      if (cancelled) return false;

      const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
      const sessioni = Array.isArray(sessioniRaw) ? sessioniRaw : [];
      const sessioneLive = sessioni.find((s: any) => s?.badgeAutista === autista.badge);
      const revokedAt =
        typeof sessioneLive?.revoked?.at === "number" ? sessioneLive.revoked.at : 0;
      if (revokedAt) {
        const lastRevokedAt = getLastHandledRevokedAt(autista.badge);
        if (revokedAt > lastRevokedAt) {
          const scope = String(sessioneLive?.revoked?.scope ?? "TUTTO");
          const by = String(sessioneLive?.revoked?.by ?? "ADMIN");
          const reason = String(sessioneLive?.revoked?.reason ?? "");
          if (scope === "RIMORCHIO") {
            if (mezzo?.targaCamion) {
              saveMezzoLocal({
                ...mezzo,
                targaRimorchio: null,
              });
            } else {
              removeMezzoLocal();
            }
          } else if (scope === "MOTRICE") {
            if (mezzo?.targaRimorchio) {
              saveMezzoLocal({
                ...mezzo,
                targaCamion: null,
              });
            } else {
              removeMezzoLocal();
            }
          } else {
            removeMezzoLocal();
          }

          setLastHandledRevokedAt(autista.badge, revokedAt);
          const scopeLabel =
            scope === "MOTRICE" ? "motrice" : scope === "RIMORCHIO" ? "rimorchio" : "tutto";
          const reasonText = reason ? ` Motivo: ${reason}` : "";
          window.alert(`Sessione revocata (${scopeLabel}) da ${by}.${reasonText}`);

          if (scope === "TUTTO") {
            navigate("/autisti/setup-mezzo", { replace: true });
            return true;
          }

          const mode = scope === "MOTRICE" ? "motrice" : "rimorchio";
          navigate(`/autisti/setup-mezzo?mode=${encodeURIComponent(mode)}`, { replace: true });
          return true;
        }
      }

      return false;
    }

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

      const revocata = await checkRevoca(autista, mezzo);
      if (cancelled || revocata) return;

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
    const onFocus = () => {
      checkRevoca();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkRevoca();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    intervalId = window.setInterval(() => {
      checkRevoca();
    }, 15000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [navigate]);

  return null;
}
