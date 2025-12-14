// src/autisti/HomeAutista.tsx

import { useNavigate } from "react-router-dom";
import "../autisti/autisti.css";

export default function HomeAutista() {
  const navigate = useNavigate();

  return (
    <div className="autisti-container">
      <h1 className="autisti-title">Home Autista</h1>

      <div
        className="autisti-card"
        onClick={() => navigate("/autisti/rifornimento")}
      >
        <h2>Rifornimento</h2>
      </div>

      <div
        className="autisti-card"
        onClick={() => navigate("/autisti/controllo")}
      >
        <h2>Controllo Mezzo</h2>
      </div>

      <div
        className="autisti-card"
        onClick={() => navigate("/autisti/segnalazioni")}
      >
        <h2>Segnalazioni</h2>
      </div>
    </div>
  );
}
