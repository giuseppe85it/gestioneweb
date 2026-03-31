/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../autisti/autisti.css";
import { getItemSync } from "./nextAutistiStorageSync";
import NextGommeAutistaModal from "./NextGommeAutistaModal";
import { NEXT_AUTISTI_BASE_PATH } from "./nextAutistiCloneRuntime";
import {
  clearLastHandledRevokedAt,
  getAutistaLocal,
  getLastHandledRevokedAt,
  getMezzoLocal,
  removeAutistaLocal,
  removeMezzoLocal,
  saveMezzoLocal,
  setLastHandledRevokedAt,
} from "./nextAutistiSessionStorage";

const SESSIONI_KEY = "@autisti_sessione_attive";

export default function HomeAutista() {
  const navigate = useNavigate();

  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);
  const [gommeOpen, setGommeOpen] = useState(false);
  const [sgancioOpen, setSgancioOpen] = useState(false);
  const [sgancioLuogoPreset, setSgancioLuogoPreset] = useState<"STABIO" | "MEV" | "ALTRO">(
    "STABIO",
  );
  const [sgancioLuogoAltro, setSgancioLuogoAltro] = useState("");
  const [sgancioErrore, setSgancioErrore] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function checkRevocaAndCoerenza() {
      if (cancelled) {
        return;
      }

      const autistaLocale = getAutistaLocal();
      if (!autistaLocale?.badge) {
        return;
      }

      const mezzoLocale = getMezzoLocal();
      const sessioniRaw = (await getItemSync(SESSIONI_KEY)) || [];
      const sessioni = Array.isArray(sessioniRaw) ? sessioniRaw : [];
      const badgeKey = String(autistaLocale.badge).trim();
      const sessioneLive = sessioni.find(
        (item: any) => String(item?.badgeAutista ?? item?.badge ?? "").trim() === badgeKey,
      );
      if (!sessioneLive) {
        return;
      }

      const revokedAt =
        typeof sessioneLive?.revoked?.at === "number" ? sessioneLive.revoked.at : 0;
      const lastHandled = getLastHandledRevokedAt(badgeKey);
      if (revokedAt && revokedAt > lastHandled) {
        const scope = String(sessioneLive?.revoked?.scope ?? "TUTTO");
        const by = String(sessioneLive?.revoked?.by ?? "ADMIN");
        const reason = String(sessioneLive?.revoked?.reason ?? "");

        if (scope === "RIMORCHIO") {
          if (mezzoLocale?.targaCamion) {
            const updated = { ...mezzoLocale, targaRimorchio: null };
            saveMezzoLocal(updated);
            setMezzo(updated);
          } else {
            removeMezzoLocal();
            setMezzo(null);
          }
        } else if (scope === "MOTRICE") {
          if (mezzoLocale?.targaRimorchio) {
            const updated = { ...mezzoLocale, targaCamion: null };
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
          navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`, { replace: true });
          return;
        }

        const mode = scope === "MOTRICE" ? "motrice" : "rimorchio";
        navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo?mode=${encodeURIComponent(mode)}`, {
          replace: true,
        });
        return;
      }

      const liveMotrice = sessioneLive?.targaMotrice ?? null;
      const liveRimorchio = sessioneLive?.targaRimorchio ?? null;

      if (!liveMotrice && mezzoLocale?.targaCamion) {
        const updated = { ...mezzoLocale, targaCamion: null };
        if (updated.targaRimorchio) {
          saveMezzoLocal(updated);
          setMezzo(updated);
        } else {
          removeMezzoLocal();
          setMezzo(null);
        }
        window.alert("Motrice revocata da admin: reimposta la motrice.");
        navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo?mode=motrice`, { replace: true });
        return;
      }

      if (!liveRimorchio && mezzoLocale?.targaRimorchio) {
        const updated = { ...mezzoLocale, targaRimorchio: null };
        if (updated.targaCamion) {
          saveMezzoLocal(updated);
          setMezzo(updated);
        } else {
          removeMezzoLocal();
          setMezzo(null);
        }
        window.alert("Rimorchio revocato da admin: reimposta il rimorchio.");
        navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo?mode=rimorchio`, { replace: true });
      }
    }

    void checkRevocaAndCoerenza();
    const onFocus = () => {
      void checkRevocaAndCoerenza();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void checkRevocaAndCoerenza();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    intervalId = window.setInterval(() => {
      void checkRevocaAndCoerenza();
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

  useEffect(() => {
    const autistaLocale = getAutistaLocal();
    const mezzoLocale = getMezzoLocal();

    if (!autistaLocale?.badge) {
      navigate(`${NEXT_AUTISTI_BASE_PATH}/login`, { replace: true });
      return;
    }

    if (!mezzoLocale?.targaCamion) {
      navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo`, { replace: true });
      return;
    }

    setAutista(autistaLocale);
    setMezzo(mezzoLocale);
  }, [navigate]);

  function handleLogout() {
    const autistaLocale = getAutistaLocal();
    if (!autistaLocale?.badge) {
      return;
    }

    clearLastHandledRevokedAt(autistaLocale.badge);
    removeAutistaLocal();
    removeMezzoLocal();
    navigate(`${NEXT_AUTISTI_BASE_PATH}/login`, { replace: true });
  }

  function handleSgancioMotriceConfirm() {
    if (sgancioLuogoPreset === "ALTRO" && !sgancioLuogoAltro.trim()) {
      setSgancioErrore("Inserisci dove lasci la motrice.");
      return;
    }

    setSgancioErrore("Clone NEXT in sola lettura: lo sgancio motrice non viene applicato.");
  }

  if (!autista || !mezzo) {
    return null;
  }

  return (
    <div className="autisti-home">
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

      <div className="autisti-mezzo-attivo">
        <h2>Mezzo attivo</h2>
        <div className="autisti-mezzo-card">
          <div>
            <strong>Motrice:</strong> {mezzo.targaCamion || "-"}
          </div>
          {mezzo.targaRimorchio ? (
            <div>
              <strong>Rimorchio:</strong> {mezzo.targaRimorchio}
            </div>
          ) : null}
        </div>
      </div>

      <div className="autisti-actions">
        <button onClick={() => navigate(`${NEXT_AUTISTI_BASE_PATH}/rifornimento`)}>
          Rifornimento
        </button>

        <button onClick={() => navigate(`${NEXT_AUTISTI_BASE_PATH}/segnalazioni`)}>
          Segnalazioni
        </button>

        <button onClick={() => setGommeOpen(true)}>Gomme</button>

        <button onClick={() => navigate(`${NEXT_AUTISTI_BASE_PATH}/richiesta-attrezzature`)}>
          Richiesta attrezzature
        </button>

        {!mezzo.targaRimorchio ? (
          <button onClick={() => navigate(`${NEXT_AUTISTI_BASE_PATH}/setup-mezzo?mode=rimorchio`)}>
            AGGANCIA RIMORCHIO
          </button>
        ) : null}

        {mezzo.targaCamion ? (
          <button onClick={() => setSgancioOpen(true)}>SGANCIA MOTRICE</button>
        ) : null}

        <button onClick={() => navigate(`${NEXT_AUTISTI_BASE_PATH}/cambio-mezzo`)}>
          Cambio mezzo
        </button>
      </div>

      {sgancioOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
              textAlign: "left",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Sgancio motrice</h3>
            <div style={{ marginBottom: 12 }}>
              <label className="autisti-label">Dove la lascio?</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {(["STABIO", "MEV", "ALTRO"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="autisti-button secondary"
                    style={{
                      width: "auto",
                      padding: "10px 14px",
                      fontSize: 14,
                      background: sgancioLuogoPreset === option ? "#2e7d32" : undefined,
                      color: sgancioLuogoPreset === option ? "#fff" : undefined,
                    }}
                    onClick={() => setSgancioLuogoPreset(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {sgancioLuogoPreset === "ALTRO" ? (
                <input
                  className="autisti-input"
                  type="text"
                  placeholder="Inserisci luogo"
                  value={sgancioLuogoAltro}
                  onChange={(event) => setSgancioLuogoAltro(event.target.value)}
                />
              ) : null}
            </div>
            {sgancioErrore ? <div className="autisti-error">{sgancioErrore}</div> : null}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="autisti-button" onClick={handleSgancioMotriceConfirm}>
                CONFERMA
              </button>
              <button
                className="autisti-button secondary"
                onClick={() => {
                  setSgancioOpen(false);
                  setSgancioLuogoPreset("STABIO");
                  setSgancioLuogoAltro("");
                  setSgancioErrore(null);
                }}
              >
                ANNULLA
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <NextGommeAutistaModal open={gommeOpen} onClose={() => setGommeOpen(false)} />
    </div>
  );
}
