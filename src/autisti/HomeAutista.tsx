// ======================================================
// HomeAutista.tsx
// HOME PRINCIPALE APP AUTISTI
// ======================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./autisti.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import GommeAutistaModal from "./GommeAutistaModal";
import {
  clearLastHandledRevokedAt,
  getAutistaLocal,
  getLastHandledRevokedAt,
  getMezzoLocal,
  removeAutistaLocal,
  removeMezzoLocal,
  saveMezzoLocal,
  setLastHandledRevokedAt,
} from "./autistiStorage";

const SESSIONI_KEY = "@autisti_sessione_attive";

export default function HomeAutista() {
  const navigate = useNavigate();

  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);
  const [gommeOpen, setGommeOpen] = useState(false);

  // ======================================================
  // REVOCHE + COERENZA LIVE/LOCALE
  // ======================================================
  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function checkRevocaAndCoerenza() {
      if (cancelled) return;
      const a = getAutistaLocal();
      if (!a?.badge) return;
      const m = getMezzoLocal();

      const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
      const sessioni = Array.isArray(sessioniRaw) ? sessioniRaw : [];
      const badgeKey = String(a.badge).trim();
      const sessioneLive = sessioni.find(
        (s: any) => String(s?.badgeAutista ?? s?.badge ?? "").trim() === badgeKey
      );
      if (!sessioneLive) return;

      const revokedAt =
        typeof sessioneLive?.revoked?.at === "number" ? sessioneLive.revoked.at : 0;
      const lastHandled = getLastHandledRevokedAt(badgeKey);
      if (revokedAt && revokedAt > lastHandled) {
        const scope = String(sessioneLive?.revoked?.scope ?? "TUTTO");
        const by = String(sessioneLive?.revoked?.by ?? "ADMIN");
        const reason = String(sessioneLive?.revoked?.reason ?? "");
        if (scope === "RIMORCHIO") {
          if (m?.targaCamion) {
            const updated = { ...m, targaRimorchio: null };
            saveMezzoLocal(updated);
            setMezzo(updated);
          } else {
            removeMezzoLocal();
            setMezzo(null);
          }
        } else if (scope === "MOTRICE") {
          if (m?.targaRimorchio) {
            const updated = { ...m, targaCamion: null };
            saveMezzoLocal(updated);
            setMezzo(updated);
          } else {
            removeMezzoLocal();
            setMezzo(null);
          }
        } else {
          removeMezzoLocal();
          setMezzo(null);
        }

        setLastHandledRevokedAt(badgeKey, revokedAt);
        const scopeLabel =
          scope === "MOTRICE" ? "motrice" : scope === "RIMORCHIO" ? "rimorchio" : "tutto";
        const reasonText = reason ? ` Motivo: ${reason}` : "";
        window.alert(`Sessione revocata (${scopeLabel}) da ${by}.${reasonText}`);

        if (scope === "TUTTO") {
          navigate("/autisti/setup-mezzo", { replace: true });
          return;
        }

        const mode = scope === "MOTRICE" ? "motrice" : "rimorchio";
        navigate(`/autisti/setup-mezzo?mode=${encodeURIComponent(mode)}`, { replace: true });
        return;
      }

      const liveMotrice = sessioneLive?.targaMotrice ?? null;
      const liveRimorchio = sessioneLive?.targaRimorchio ?? null;

      if (!liveMotrice && m?.targaCamion) {
        const updated = { ...m, targaCamion: null };
        if (updated.targaRimorchio) {
          saveMezzoLocal(updated);
          setMezzo(updated);
        } else {
          removeMezzoLocal();
          setMezzo(null);
        }
        window.alert("Motrice revocata da admin: reimposta la motrice.");
        navigate("/autisti/setup-mezzo?mode=motrice", { replace: true });
        return;
      }

      if (!liveRimorchio && m?.targaRimorchio) {
        const updated = { ...m, targaRimorchio: null };
        if (updated.targaCamion) {
          saveMezzoLocal(updated);
          setMezzo(updated);
        } else {
          removeMezzoLocal();
          setMezzo(null);
        }
        window.alert("Rimorchio revocato da admin: reimposta il rimorchio.");
        navigate("/autisti/setup-mezzo?mode=rimorchio", { replace: true });
      }
    }

    checkRevocaAndCoerenza();
    const onFocus = () => {
      checkRevocaAndCoerenza();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkRevocaAndCoerenza();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    intervalId = window.setInterval(() => {
      checkRevocaAndCoerenza();
    }, 15000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [navigate]);

  // ======================================================
  // LOAD SESSIONE (SOLO LOCALE)
  // ======================================================
  useEffect(() => {
    const a = getAutistaLocal();
    const m = getMezzoLocal();

    if (!a || !a.badge) {
      navigate("/autisti/login", { replace: true });
      return;
    }

    // autista ok ma mezzo non selezionato -> setup
    if (!m || !m.targaCamion) {
      navigate("/autisti/setup-mezzo", { replace: true });
      return;
    }

    setAutista(a);
    setMezzo(m);
  }, [navigate]);

  // ======================================================
  // LOGOUT
  // ======================================================
  async function handleLogout() {
    const a = getAutistaLocal();
    if (!a?.badge) return;

    // opzionale: pulizia sessione attiva lato Firestore (non usata per gating)
    const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
    const sessioni = Array.isArray(sessioniRaw) ? sessioniRaw : [];
    const aggiornate = sessioni.filter((s: any) => s?.badgeAutista !== a.badge);
    await setItemSync(SESSIONI_KEY, aggiornate);

    // pulizia locale (questa è quella che conta)
    clearLastHandledRevokedAt(a.badge);
    removeAutistaLocal();
    removeMezzoLocal();

    navigate("/autisti/login", { replace: true });
  }

  if (!autista || !mezzo) return null;

  return (
    <div className="autisti-home">
      {/* HEADER */}
      <div className="autisti-header">
        <div>
          <h1>Area Autista</h1>
          <div className="autisti-sub">
            {autista.nome} - Badge {autista.badge}
          </div>
        </div>

        <button className="autisti-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* MEZZO ATTIVO */}
      <div className="autisti-mezzo-attivo">
        <h2>Mezzo attivo</h2>
        <div className="autisti-mezzo-card">
          <div>
            <strong>Motrice:</strong> {mezzo.targaCamion || "-"}
          </div>
          {mezzo.targaRimorchio && (
            <div>
              <strong>Rimorchio:</strong> {mezzo.targaRimorchio}
            </div>
          )}
        </div>
      </div>

      {/* AZIONI */}
      <div className="autisti-actions">
        <button onClick={() => navigate("/autisti/rifornimento")}>
          Rifornimento
        </button>

        <button onClick={() => navigate("/autisti/segnalazioni")}>
          Segnalazioni
        </button>

        <button onClick={() => setGommeOpen(true)}>
          Gomme
        </button>

        <button onClick={() => navigate("/autisti/richiesta-attrezzature")}>
          Richiesta attrezzature
        </button>

        {!mezzo.targaRimorchio && (
          <button onClick={() => navigate("/autisti/setup-mezzo?mode=rimorchio")}>
            AGGANCIA RIMORCHIO
          </button>
        )}

        <button onClick={() => navigate("/autisti/cambio-mezzo")}>
          Cambio mezzo
        </button>
      </div>

      <GommeAutistaModal open={gommeOpen} onClose={() => setGommeOpen(false)} />
    </div>
  );
}
