import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/Fornitori.css";
import "./next-shell.css";
import {
  readNextFornitoriSnapshot,
  type NextFornitoreReadOnlyItem,
} from "./domain/nextFornitoriDomain";

const CLONE_BLOCKED_REASON =
  "Clone read-only: aggiunta, modifica, eliminazione e PDF restano bloccati.";

function NextFornitoriPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NextFornitoreReadOnlyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const snapshot = await readNextFornitoriSnapshot();
        if (cancelled) return;
        setItems(snapshot.items);
      } catch (loadError: any) {
        if (cancelled) return;
        setItems([]);
        setError(loadError?.message || "Errore durante il caricamento dei fornitori.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="forn-page">
      <div className="forn-card">
        <header className="forn-header">
          <div className="forn-header-left">
            <img
              src="/logo.png"
              className="forn-logo"
              alt="logo"
              onClick={() => navigate("/next")}
            />
            <h1 className="forn-title">Fornitori</h1>
          </div>
        </header>

        <div className="forn-empty" style={{ marginBottom: 16 }}>
          Clone read-only: puoi consultare l'anagrafica fornitori, ma nessuna azione scrivente viene inoltrata alla madre.
        </div>

        {error && <div className="forn-error">{error}</div>}

        <fieldset className="next-clone-fieldset" disabled aria-label="Form fornitore bloccato nel clone">
          <div className="forn-form next-clone-row-disabled" title={CLONE_BLOCKED_REASON}>
            <div className="forn-field">
              <label>Nome fornitore</label>
              <input type="text" value="" readOnly placeholder="NOME" />
            </div>

            <div className="forn-grid">
              <div className="forn-field">
                <label>Telefono</label>
                <input type="tel" value="" readOnly placeholder="Telefono" />
              </div>
              <div className="forn-field">
                <label>Badge</label>
                <input type="text" value="" readOnly placeholder="Badge" />
              </div>
              <div className="forn-field">
                <label>Codice</label>
                <input type="text" value="" readOnly placeholder="Codice" />
              </div>
            </div>

            <div className="forn-field">
              <label>Descrizione / Note</label>
              <textarea value="" readOnly rows={2} placeholder="Note aggiuntive" />
            </div>

            <div className="forn-actions">
              <button
                className="btn-primary next-clone-button-disabled"
                disabled
                title={CLONE_BLOCKED_REASON}
              >
                AGGIUNGI FORNITORE
              </button>
            </div>
          </div>
        </fieldset>

        <div className="forn-list">
          <div className="forn-list-header">
            <span>Fornitori</span>
            <span>{items.length}</span>
          </div>

          {loading ? (
            <div className="forn-empty">Caricamento fornitori...</div>
          ) : items.length === 0 ? (
            <div className="forn-empty">Nessun fornitore inserito.</div>
          ) : (
            <div className="forn-list-scroll">
              {items.map((item) => (
                <div key={item.id} className="forn-item">
                  <div className="forn-item-main">
                    <div className="forn-item-name">{item.nome}</div>
                    <div className="forn-item-line">
                      {item.telefono && (
                        <span className="forn-tag">
                          Tel: <strong>{item.telefono}</strong>
                        </span>
                      )}
                      {item.badge && (
                        <span className="forn-tag">
                          Badge: <strong>{item.badge}</strong>
                        </span>
                      )}
                      {item.codice && (
                        <span className="forn-tag">
                          Codice: <strong>{item.codice}</strong>
                        </span>
                      )}
                    </div>
                    {item.descrizione && <div className="forn-item-desc">{item.descrizione}</div>}
                  </div>

                  <div className="forn-item-actions">
                    <button
                      className="btn-secondary next-clone-button-disabled"
                      disabled
                      title={CLONE_BLOCKED_REASON}
                    >
                      Modifica
                    </button>
                    <button
                      className="btn-secondary next-clone-button-disabled"
                      disabled
                      title={CLONE_BLOCKED_REASON}
                    >
                      PDF
                    </button>
                    <button
                      className="btn-danger next-clone-button-disabled"
                      disabled
                      title={CLONE_BLOCKED_REASON}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NextFornitoriPage;
