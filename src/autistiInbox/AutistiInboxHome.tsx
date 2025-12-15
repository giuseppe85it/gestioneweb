// src/autistiInbox/AutistiInboxHome.tsx
// Pagina principale sezione AUTISTI
// Stile premium, solo navigazione verso le sotto-sezioni

import { useNavigate } from "react-router-dom";
import "./AutistiInboxHome.css";

export default function AutistiInboxHome() {
  const navigate = useNavigate();

  return (
    <div className="autisti-inbox-container">
      <h1 className="autisti-inbox-title">Autisti</h1>

      <div className="autisti-inbox-grid">

      {/* CAMBIO MEZZO */}
<div
  className="autisti-inbox-card"
  onClick={() => navigate("/autisti-inbox/cambio-mezzo")}
>
  <h2>Cambio Mezzo</h2>
  <p>Rimorchi e motrici dagli autisti</p>
</div>

        {/* SPAZIO FUTURO */}
        <div className="autisti-inbox-card disabled">
          <h2>Segnalazioni</h2>
          <p>In arrivo</p>
        </div>

        <div className="autisti-inbox-card disabled">
          <h2>Controlli Mezzo</h2>
          <p>In arrivo</p>
        </div>

        <div className="autisti-inbox-card disabled">
          <h2>Rifornimenti</h2>
          <p>In arrivo</p>
        </div>

      </div>
    </div>
  );
}
