import { useNavigate } from "react-router-dom";
import { useNextOperativitaSnapshot } from "./useNextOperativitaSnapshot";
import {
  NEXT_ATTREZZATURE_CANTIERI_PATH,
  NEXT_CENTRO_CONTROLLO_PATH,
  NEXT_HOME_PATH,
  NEXT_INVENTARIO_PATH,
  NEXT_MATERIALI_CONSEGNATI_PATH,
  NEXT_ORDINI_IN_ATTESA_PATH,
  NEXT_MANUTENZIONI_PATH,
} from "./nextStructuralPaths";
import "../pages/GestioneOperativa.css";

const INLINE_LINK_BUTTON_STYLE = {
  marginTop: 0,
  padding: "2px 8px",
  fontSize: "0.75rem",
} as const;

function formatQuantity(value: number | null, unit: string | null): string {
  if (value === null) return "-";
  const normalized = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString("it-IT", { maximumFractionDigits: 2 });
  return unit ? `${normalized} ${unit}` : normalized;
}

export default function NextGestioneOperativaPage() {
  const navigate = useNavigate();
  const { snapshot, loading, error } = useNextOperativitaSnapshot();

  const inventarioPreview = snapshot?.inventario.items.slice(0, 6) ?? [];
  const manutenzioniPreview = snapshot?.manutenzioni.items.slice(0, 5) ?? [];
  const materialiCritici = snapshot?.inventario.counts.critical ?? 0;
  const numeroConsegne = snapshot?.materialiMovimenti.counts.total ?? 0;

  return (
    <div className="go-page">
      <div className="go-card">
        <div className="go-header">
          <div className="go-logo-title">
            <img
              src="/logo.png"
              alt="Logo"
              className="go-logo"
              onClick={() => navigate(NEXT_HOME_PATH)}
            />
            <div>
              <h1 className="go-title">Gestione Operativa</h1>
              <p className="go-subtitle">Centro di controllo magazzino e manutenzioni</p>
            </div>
          </div>

          <div className="go-badges">
            {materialiCritici > 0 ? (
              <span className="go-badge danger">{materialiCritici} materiali critici</span>
            ) : null}
            {numeroConsegne > 0 ? (
              <span className="go-badge">{numeroConsegne} consegne registrate</span>
            ) : null}
            <span className="next-clone-readonly-badge">CLONE READ-ONLY</span>
          </div>
        </div>

        {error ? (
          <div className="go-section">
            <div className="go-badge danger">{error}</div>
          </div>
        ) : null}

        <div className="go-section">
          <h2 className="go-section-title">Stato magazzino</h2>

          <div className="go-inventario-preview">
            {loading ? (
              <div className="go-inventario-row">
                <span className="go-inv-desc">Caricamento inventario...</span>
                <span className="go-inv-qty">-</span>
              </div>
            ) : inventarioPreview.length > 0 ? (
              inventarioPreview.map((item) => (
                <div key={item.id} className="go-inventario-row" style={{ alignItems: "flex-start" }}>
                  <span className="go-inv-desc">
                    {item.descrizione}
                    <br />
                    <small>{item.fornitore ?? "Fornitore non indicato"}</small>
                  </span>
                  <span className="go-inv-qty">{formatQuantity(item.quantita, item.unita)}</span>
                </div>
              ))
            ) : (
              <div className="go-inventario-row">
                <span className="go-inv-desc">Nessun articolo inventario leggibile</span>
                <span className="go-inv-qty">-</span>
              </div>
            )}
          </div>

          <button className="go-link-btn" type="button" onClick={() => navigate(NEXT_INVENTARIO_PATH)}>
            Apri inventario completo
          </button>
        </div>

        <div className="go-actions-section">
          <div className="go-actions-title">AZIONI OPERATIVE</div>

          <div className="go-actions">
            <div className="go-action-card use-materiale">
              <h3>Usa materiale</h3>
              <p>Consulta le uscite magazzino e i movimenti materiali in sola lettura.</p>
              <button className="go-primary-btn" type="button" onClick={() => navigate(NEXT_MATERIALI_CONSEGNATI_PATH)}>
                Vai a materiali consegnati
              </button>
            </div>

            <div className="go-action-card manutenzione">
              <h3>Registro manutenzioni</h3>
              <p>Apri lo storico manutenzioni globale e salta ai dossier mezzo.</p>
              <button className="go-primary-btn" type="button" onClick={() => navigate(NEXT_MANUTENZIONI_PATH)}>
                Vai a manutenzioni
              </button>
            </div>

            <div className="go-action-card">
              <h3>Acquisti / Ordini</h3>
              <p>Apri il workbench procurement clone-safe con ordini, arrivi e dettaglio read-only.</p>
              <button className="go-primary-btn" type="button" onClick={() => navigate(NEXT_ORDINI_IN_ATTESA_PATH)}>
                Vai ad acquisti
              </button>
            </div>

            <div className="go-action-card">
              <h3>Centro Controllo</h3>
              <p>Monitora manutenzioni programmate e report rifornimenti mensili.</p>
              <button className="go-primary-btn" type="button" onClick={() => navigate(NEXT_CENTRO_CONTROLLO_PATH)}>
                Apri Centro Controllo
              </button>
            </div>

            <div className="go-action-card">
              <h3>Attrezzature cantieri</h3>
              <p>Registra consegne, spostamenti e ritiro attrezzature.</p>
              <button className="go-primary-btn" type="button" onClick={() => navigate(NEXT_ATTREZZATURE_CANTIERI_PATH)}>
                Vai ad attrezzature cantieri
              </button>
            </div>
          </div>
        </div>

        <div className="go-section">
          <h2 className="go-section-title">Ultime attivita</h2>
          <div className="go-storico">
            {loading ? (
              <div className="go-storico-row">
                <span>-</span>
                <span>-</span>
                <span>Caricamento manutenzioni...</span>
              </div>
            ) : manutenzioniPreview.length > 0 ? (
              manutenzioniPreview.map((item) => (
                <div key={item.id} className="go-storico-row">
                  <span>{item.data ?? "-"}</span>
                  <span>
                    {item.targa ? (
                      <button
                        type="button"
                        className="go-link-btn"
                        style={INLINE_LINK_BUTTON_STYLE}
                        onClick={() => navigate(`/next/dossier/${encodeURIComponent(item.targa as string)}`)}
                      >
                        {item.targa}
                      </button>
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
            ) : (
              <div className="go-storico-row">
                <span>-</span>
                <span>-</span>
                <span>Nessuna manutenzione leggibile</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
