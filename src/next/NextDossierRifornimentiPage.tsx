import { useNavigate, useParams } from "react-router-dom";
import NextRifornimentiEconomiaSection from "./NextRifornimentiEconomiaSection";
import "../pages/DossierMezzo.css";
import "./next-shell.css";

export default function NextDossierRifornimentiPage() {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    if (!targa) {
      navigate("/next/mezzi-dossier");
      return;
    }

    navigate(`/next/mezzi-dossier/${encodeURIComponent(targa)}`);
  };

  return (
    <div className="dossier-wrapper">
      <div className="dossier-header-bar">
        <button className="dossier-button ghost" type="button" onClick={handleBack}>
          Dossier
        </button>

        <div className="dossier-header-center">
          <img src="/logo.png" alt="Logo" className="dossier-logo" />
          <div className="dossier-header-text">
            <span className="dossier-header-label">RIFORNIMENTI</span>
            <h1 className="dossier-header-title">{targa || "-"}</h1>
          </div>
        </div>

        <div style={{ width: 120 }} />
      </div>

      <div className="dossier-grid">
        {targa ? <NextRifornimentiEconomiaSection targa={targa} /> : null}
      </div>
    </div>
  );
}
