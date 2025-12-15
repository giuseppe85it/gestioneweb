// src/autisti/HomeAutista.tsx

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getItemSync } from "../utils/storageSync";
import "../autisti/autisti.css";

export default function HomeAutista() {
  const navigate = useNavigate();
  const [nomeAutista, setNomeAutista] = useState<string | null>(null);

  useEffect(() => {
    async function loadAutista() {
      const autista = await getItemSync("@autista_attivo");
      if (autista?.nome) {
        setNomeAutista(autista.nome);
      }
    }
    loadAutista();
  }, []);

  return (
    <div className="autisti-container">
      <h1 className="autisti-title">
        {nomeAutista ? `Ciao ${nomeAutista}` : "Ciao"}
      </h1>

      <div
        className="autisti-card"
        onClick={() => navigate("/autisti/setup-mezzo")}
      >
        <h2>Imposta Mezzo</h2>
      </div>

    <div
  className="autisti-card"
  onClick={() => navigate("/autisti/cambio-mezzo")}
>
  <h2>Cambio Mezzo</h2>
  <p>Rimorchio o motrice</p>
</div>


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
