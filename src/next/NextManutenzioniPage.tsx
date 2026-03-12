import { Link } from "react-router-dom";
import NextClonePageScaffold from "./NextClonePageScaffold";
import { buildNextDossierPath, NEXT_GESTIONE_OPERATIVA_PATH } from "./nextStructuralPaths";
import { useNextOperativitaSnapshot } from "./useNextOperativitaSnapshot";
import "../pages/GestioneOperativa.css";

export default function NextManutenzioniPage() {
  const { snapshot, loading, error } = useNextOperativitaSnapshot();
  const items = snapshot?.manutenzioni.items ?? [];
  const limitations = snapshot?.manutenzioni.limitations ?? [];

  return (
    <NextClonePageScaffold
      eyebrow="Gestione Operativa"
      title="Manutenzioni"
      description="Route clone autonoma del registro manutenzioni della madre, con consultazione reale e scritture neutralizzate."
      backTo={NEXT_GESTIONE_OPERATIVA_PATH}
      backLabel="Gestione Operativa"
      notice={
        <>
          <p>
            Il clone apre la pagina come schermata vera. Salvataggio manutenzione, movimenti
            inventario, consegne e delete restano bloccati.
          </p>
          {limitations.length > 0 ? (
            <div className="next-structural-page__pill-row">
              {limitations.slice(0, 4).map((item) => (
                <span key={item} className="next-structural-page__pill">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </>
      }
    >
      {loading ? <div className="next-clone-placeholder">Caricamento manutenzioni...</div> : null}
      {error ? <div className="next-clone-placeholder">{error}</div> : null}
      {!loading && !error ? (
        <div className="go-card">
          <div className="go-section">
            <h2 className="go-section-title">Registro manutenzioni</h2>
            <div className="go-storico">
              {items.length === 0 ? (
                <div className="go-storico-row">
                  <span>-</span>
                  <span>-</span>
                  <span>Nessuna manutenzione leggibile</span>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="go-storico-row">
                    <span>{item.data ?? "-"}</span>
                    <span>
                      {item.targa ? (
                        <Link className="go-link-btn" to={buildNextDossierPath(item.targa)}>
                          {item.targa}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </span>
                    <span>
                      {item.descrizione ?? "-"}
                      {item.materialiCount > 0 ? ` - materiali ${item.materialiCount}` : ""}
                      {item.fornitore ? ` - ${item.fornitore}` : ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </NextClonePageScaffold>
  );
}

