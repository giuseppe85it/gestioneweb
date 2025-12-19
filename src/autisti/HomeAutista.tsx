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
  removeAutistaLocal,
  removeMezzoLocal,
} from "./autistiStorage";

const SESSIONI_KEY = "@autisti_sessione_attive";

export default function HomeAutista() {
  const navigate = useNavigate();

  const [autista, setAutista] = useState<any>(null);
  const [mezzo, setMezzo] = useState<any>(null);

  // ======================================================
  // LOAD SESSIONE
  // ======================================================
  useEffect(() => {
    async function load() {
      const a = await getAutistaLocal();
      const m = await getItemSync("@mezzo_attivo_autista");

      if (!a || !m) {
        navigate("/autisti/login");
        return;
      }

      setAutista(a);
      setMezzo(m);
    }

    load();
  }, [navigate]);

  // ======================================================
  // LOGOUT
  // ======================================================
  async function handleLogout() {
    if (!autista) return;

    // 1. rimuove sessione attiva Firestore
    const sessioni = (await getItemSync(SESSIONI_KEY)) || [];
    const aggiornate = sessioni.filter(
      (s: any) => s.badgeAutista !== autista.badge
    );
    await setItemSync(SESSIONI_KEY, aggiornate);

    // 2. pulizia locale
    removeAutistaLocal();
    removeMezzoLocal();

    navigate("/autisti/login");
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
            <strong>Motrice:</strong>{" "}
            {mezzo.targaCamion || "-"}
          </div>
          {mezzo.targaRimorchio && (
            <div>
              <strong>Rimorchio:</strong>{" "}
              {mezzo.targaRimorchio}
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
