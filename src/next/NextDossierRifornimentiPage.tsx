import { useNavigate, useParams } from "react-router-dom";
import NextRifornimentiEconomiaSection from "./NextRifornimentiEconomiaSection";
import { buildNextDossierPath, NEXT_DOSSIER_LISTA_PATH } from "./nextStructuralPaths";
import "../pages/DossierMezzo.css";
import "./next-shell.css";

export default function NextDossierRifornimentiPage() {
  const { targa } = useParams<{ targa: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    if (!targa) {
      navigate(NEXT_DOSSIER_LISTA_PATH);
      return;
    }

    navigate(buildNextDossierPath(targa));
  };

  return (
    <div className="dossier-wrapper">
      <div className="dossier-header-bar">
        <button className="dossier-button ghost" type="button" onClick={handleBack}>
          &larr; Dossier
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
        {targa ? (
          <NextRifornimentiEconomiaSection targa={targa} dataScope="legacy_parity" />
        ) : null}
      </div>
    </div>
  );
}
