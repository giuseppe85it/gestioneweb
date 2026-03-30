/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getItemSync } from "./autisti/nextAutistiStorageSync";
import {
  getAutistaLocal,
  getLastHandledRevokedAt,
  getMezzoLocal,
  removeMezzoLocal,
  saveMezzoLocal,
  setLastHandledRevokedAt,
} from "./autisti/nextAutistiSessionStorage";
import { NEXT_AUTISTI_BASE_PATH } from "./autisti/nextAutistiCloneRuntime";
import { getNextAutistiCloneControlli } from "./autisti/nextAutistiCloneState";

const CONTROLLI_KEY = "@controlli_mezzo_autisti";
const SESSIONI_KEY = "@autisti_sessione_attive";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export default function NextAutistiGatePage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function checkRevoca(autistaArg?: any, mezzoArg?: any) {
      if (cancelled) {
        return false;
      }

      const autista: any =
        autistaArg ?? (await Promise.resolve((getAutistaLocal as any)()));
      if (!autista?.badge) {
        return false;
      }

      const mezzo: any =
        mezzoArg ?? (await Promise.resolve((getMezzoLocal as any)()));
      if (cancelled) {
        return false;
      }

      const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
      const sessioni = asArray<any>(sessioniRaw);
      const sessioneLive = sessioni.find(
        (sessione) => sessione?.badgeAutista === autista.badge,
      );
      const revokedAt =
        typeof sessioneLive?.revoked?.at === "number"
          ? sessioneLive.revoked.at
          : 0;

      if (!revokedAt) {
        return false;
      }

      const lastRevokedAt = getLastHandledRevokedAt(autista.badge);
      if (revokedAt <= lastRevokedAt) {
        return false;
      }

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
        scope === "MOTRICE"
          ? "motrice"
          : scope === "RIMORCHIO"
            ? "rimorchio"
            : "tutto";
      const reasonText = reason ? ` Motivo: ${reason}` : "";
      window.alert(`Sessione revocata (${scopeLabel}) da ${by}.${reasonText}`);

      if (scope === "TUTTO") {
        navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`, { replace: true });
        return true;
      }

      const mode = scope === "MOTRICE" ? "motrice" : "rimorchio";
      navigate(
        `${NEXT_AUTISTI_BASE_PATH}/setup-mezzo?mode=${encodeURIComponent(mode)}`,
        { replace: true },
      );
      return true;
    }

    async function checkFlow() {
      const autista: any = await Promise.resolve((getAutistaLocal as any)());
      const mezzo: any = await Promise.resolve((getMezzoLocal as any)());

      if (cancelled) {
        return;
      }

      if (!autista || !autista.badge) {
        navigate(`${NEXT_AUTISTI_BASE_PATH}/login`, { replace: true });
        return;
      }

      const revocata = await checkRevoca(autista, mezzo);
      if (cancelled || revocata) {
        return;
      }

      if (!mezzo || !mezzo.targaCamion) {
        navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo?mode=motrice`, {
          replace: true,
        });
        return;
      }

      const controlliRaw = (await getItemSync(CONTROLLI_KEY)) || [];
      const controlliRemoti = asArray<any>(controlliRaw);
      const controlliClone = getNextAutistiCloneControlli();
      const controlloValido =
        controlliRemoti
          .filter((controllo) => controllo?.obbligatorio === true)
          .some(
            (controllo) =>
              controllo?.badgeAutista === autista.badge &&
              controllo?.targaCamion === mezzo.targaCamion,
          ) ||
        controlliClone.some(
          (controllo) =>
            controllo?.obbligatorio === true &&
            controllo?.badgeAutista === autista.badge &&
            controllo?.targaCamion === mezzo.targaCamion,
        );

      if (!controlloValido) {
        navigate(`${NEXT_AUTISTI_BASE_PATH}/controllo`, { replace: true });
        return;
      }

      navigate(`${NEXT_AUTISTI_BASE_PATH}/home`, { replace: true });
    }

    checkFlow();
    const onFocus = () => {
      checkRevoca();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        checkRevoca();
      }
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
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [navigate]);

  return null;
}
