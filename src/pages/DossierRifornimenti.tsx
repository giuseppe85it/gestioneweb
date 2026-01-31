import { useNavigate, useParams } from "react-router-dom";
import "./DossierMezzo.css";
import RifornimentiEconomiaSection from "./RifornimentiEconomiaSection";

export default function DossierRifornimenti() {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();

  return (
    <div className="dossier-wrapper">
      <div className="dossier-header-bar">
        <button className="dossier-button ghost" onClick={() => navigate(-1)}>
          ⟵ Dossier
        </button>

        <div className="dossier-header-center">
          <img src="/logo.png" alt="Logo" className="dossier-logo" />
          <div className="dossier-header-text">
            <span className="dossier-header-label">RIFORNIMENTI</span>
            <h1 className="dossier-header-title">{targa}</h1>
          </div>
        </div>

        <div style={{ width: 120 }}></div>
      </div>

      <div className="dossier-grid">
        {targa ? <RifornimentiEconomiaSection targa={targa} /> : null}
      </div>
    </div>
  );
}
