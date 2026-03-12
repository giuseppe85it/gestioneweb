import { useNavigate, useParams } from "react-router-dom";
import NextGommeEconomiaSection from "./NextGommeEconomiaSection";
import { buildNextDossierPath, NEXT_DOSSIER_LISTA_PATH } from "./nextStructuralPaths";
import "../pages/DossierMezzo.css";
import "./next-shell.css";

export default function NextDossierGommePage() {
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
          Dossier
        </button>

        <div className="dossier-header-center">
          <img src="/logo.png" alt="Logo" className="dossier-logo" />
          <div className="dossier-header-text">
            <span className="dossier-header-label">MANUTENZIONE GOMME</span>
            <h1 className="dossier-header-title">{targa || "-"}</h1>
          </div>
        </div>

        <div style={{ width: 120 }} />
      </div>

      <div className="dossier-grid">
        {targa ? <NextGommeEconomiaSection targa={targa} /> : null}
      </div>
    </div>
  );
}
