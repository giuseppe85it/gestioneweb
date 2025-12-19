// ======================================================
// HomeAutista.tsx
// HOME PRINCIPALE APP AUTISTI
// ======================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./autisti.css";
import { getItemSync, setItemSync } from "../utils/storageSync";
import {
  getAutistaLocal,
  getMezzoLocal,
  removeAutistaLocal,
  removeMezzoLocal,
} from "./autistiStorage";

const SESSIONI_KEY = "@autisti_sessione_attive";

export default function HomeAutista() {
  const navigate = useNavigate();

  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);

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
            {autista.nome} · Badge {autista.badge}
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

        <button onClick={() => navigate("/autisti/controllo")}>
          Controllo mezzo
        </button>

        <button onClick={() => navigate("/autisti/cambio-mezzo")}>
          Cambio mezzo
        </button>
      </div>
    </div>
  );
}
