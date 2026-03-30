import { useNavigate } from "react-router-dom";
import "../pages/GestioneOperativa.css";
import { useNextOperativitaSnapshot } from "./useNextOperativitaSnapshot";

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
              onClick={() => navigate("/next")}
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
                <div key={item.id} className="go-inventario-row">
                  <span className="go-inv-desc">{item.descrizione}</span>
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

          <button className="go-link-btn" type="button" onClick={() => navigate("/next/inventario")}>
            Apri inventario completo
          </button>
        </div>

        <div className="go-actions-section">
          <div className="go-actions-title">AZIONI OPERATIVE</div>

          <div className="go-actions">
            <div className="go-action-card use-materiale">
              <h3>Usa materiale</h3>
              <p>Registra un'uscita dal magazzino</p>
              <button
                className="go-primary-btn"
                type="button"
                onClick={() => navigate("/next/materiali-consegnati")}
              >
                Vai a materiali consegnati
              </button>
            </div>

            <div className="go-action-card manutenzione">
              <h3>Registra manutenzione</h3>
              <p>Inserisci un intervento su mezzo</p>
              <button
                className="go-primary-btn"
                type="button"
                onClick={() => navigate("/next/manutenzioni")}
              >
                Vai a manutenzioni
              </button>
            </div>

            <div className="go-action-card">
              <h3>Centro Controllo</h3>
              <p>Monitora manutenzioni programmate e report rifornimenti mensili</p>
              <button
                className="go-primary-btn"
                type="button"
                onClick={() => navigate("/next/centro-controllo")}
              >
                Apri Centro Controllo
              </button>
            </div>

            <div className="go-action-card">
              <h3>Attrezzature cantieri</h3>
              <p>Registra consegne, spostamenti e ritiro attrezzature</p>
              <button
                className="go-primary-btn"
                type="button"
                onClick={() => navigate("/next/attrezzature-cantieri")}
              >
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
                <span>...</span>
                <span>Caricamento</span>
                <span>Storico manutenzioni</span>
              </div>
            ) : manutenzioniPreview.length > 0 ? (
              manutenzioniPreview.map((item) => (
                <div key={item.id} className="go-storico-row">
                  <span>{item.data ?? "-"}</span>
                  <span>{item.targa ?? "-"}</span>
                  <span>{item.descrizione ?? "-"}</span>
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
