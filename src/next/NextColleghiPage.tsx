import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../pages/Colleghi.css";
import "./next-shell.css";
import {
  readNextColleghiSnapshot,
  type NextCollegaReadOnlyItem,
} from "./domain/nextColleghiDomain";

const CLONE_BLOCKED_REASON =
  "Clone read-only: aggiunta, modifica, eliminazione e PDF restano bloccati.";

function NextColleghiPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NextCollegaReadOnlyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollega, setSelectedCollega] = useState<NextCollegaReadOnlyItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const snapshot = await readNextColleghiSnapshot();
        if (cancelled) return;
        setItems(snapshot.items);
      } catch (loadError: any) {
        if (cancelled) return;
        setItems([]);
        setError(loadError?.message || "Errore durante il caricamento dei colleghi.");
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
    <div className="coll-page">
      <div className="coll-card">
        <header className="coll-header">
          <div className="coll-header-left">
            <img
              src="/logo.png"
              className="coll-logo"
              alt="logo"
              onClick={() => navigate("/next")}
            />
            <h1 className="coll-title">Colleghi</h1>
          </div>
        </header>

        <div className="coll-empty" style={{ marginBottom: 16 }}>
          Clone read-only: puoi consultare anagrafica e dettagli, ma le azioni sulla madre restano bloccate.
        </div>

        {error && <div className="coll-error">{error}</div>}

        <fieldset className="next-clone-fieldset" disabled aria-label="Form collega bloccato nel clone">
          <div className="coll-form next-clone-row-disabled" title={CLONE_BLOCKED_REASON}>
            <div className="coll-field">
              <label>Nome collega</label>
              <input type="text" value="" readOnly placeholder="NOME" />
            </div>

            <div className="coll-grid">
              <div className="coll-field">
                <label>Telefono</label>
                <input type="tel" value="" readOnly placeholder="Telefono" />
              </div>
              <div className="coll-field">
                <label>Badge</label>
                <input type="text" value="" readOnly placeholder="Badge" />
              </div>
              <div className="coll-field">
                <label>Codice</label>
                <input type="text" value="" readOnly placeholder="Codice" />
              </div>
            </div>

            <div className="coll-field">
              <label>Telefono privato</label>
              <input type="tel" value="" readOnly placeholder="Numero privato" />
            </div>

            <div className="coll-grid-2">
              <div className="coll-field">
                <label>PIN SIM</label>
                <input type="text" value="" readOnly placeholder="PIN SIM" />
              </div>
              <div className="coll-field">
                <label>PUK SIM</label>
                <input type="text" value="" readOnly placeholder="PUK SIM" />
              </div>
            </div>

            <div className="coll-field">
              <label>Schede carburante</label>
            </div>
            <div className="coll-fuel-list">
              <button
                type="button"
                className="coll-btn-add-fuel next-clone-button-disabled"
                disabled
                title={CLONE_BLOCKED_REASON}
              >
                + Aggiungi scheda carburante
              </button>
            </div>

            <div className="coll-field">
              <label>Descrizione / Note</label>
              <textarea value="" readOnly rows={2} placeholder="Note aggiuntive" />
            </div>

            <div className="coll-actions">
              <button
                className="btn-primary next-clone-button-disabled"
                disabled
                title={CLONE_BLOCKED_REASON}
              >
                AGGIUNGI COLLEGA
              </button>
            </div>
          </div>
        </fieldset>

        <div className="coll-list">
          <div className="coll-list-header">
            <span>Colleghi</span>
            <span>{items.length}</span>
          </div>

          {loading ? (
            <div className="coll-empty">Caricamento colleghi...</div>
          ) : items.length === 0 ? (
            <div className="coll-empty">Nessun collega inserito.</div>
          ) : (
            <div className="coll-list-scroll">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="coll-item"
                  onClick={() => setSelectedCollega(item)}
                >
                  <div className="coll-item-main">
                    <div className="coll-item-name">{item.nome}</div>
                    <div className="coll-item-line">
                      {item.telefono && (
                        <span className="coll-tag">
                          Tel: <strong>{item.telefono}</strong>
                        </span>
                      )}
                      {item.telefonoPrivato && (
                        <span className="coll-tag">
                          Privato: <strong>{item.telefonoPrivato}</strong>
                        </span>
                      )}
                      {item.badge && (
                        <span className="coll-tag">
                          Badge: <strong>{item.badge}</strong>
                        </span>
                      )}
                      {item.codice && (
                        <span className="coll-tag">
                          Codice: <strong>{item.codice}</strong>
                        </span>
                      )}
                    </div>
                    {item.descrizione && <div className="coll-item-desc">{item.descrizione}</div>}
                  </div>

                  <div className="coll-item-actions">
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

      {selectedCollega && (
        <div className="modal-overlay" onClick={() => setSelectedCollega(null)}>
          <div className="modal-container" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <img
                src="/logo.png"
                alt="logo"
                className="modal-logo"
                onClick={() => navigate("/next")}
              />
              <h2 className="modal-title">Dettagli collega</h2>
            </div>

            <div className="modal-content">
              <div className="modal-card">
                <div className="modal-section">
                  <label>Nome</label>
                  <p>{selectedCollega.nome}</p>
                </div>

                {selectedCollega.telefono && (
                  <div className="modal-section">
                    <label>Telefono aziendale</label>
                    <p>{selectedCollega.telefono}</p>
                  </div>
                )}

                {selectedCollega.telefonoPrivato && (
                  <div className="modal-section">
                    <label>Telefono privato</label>
                    <p>{selectedCollega.telefonoPrivato}</p>
                  </div>
                )}

                {selectedCollega.pinSim && (
                  <div className="modal-section">
                    <label>PIN SIM</label>
                    <p>{selectedCollega.pinSim}</p>
                  </div>
                )}

                {selectedCollega.pukSim && (
                  <div className="modal-section">
                    <label>PUK SIM</label>
                    <p>{selectedCollega.pukSim}</p>
                  </div>
                )}

                {selectedCollega.badge && (
                  <div className="modal-section">
                    <label>Badge</label>
                    <p>{selectedCollega.badge}</p>
                  </div>
                )}

                {selectedCollega.codice && (
                  <div className="modal-section">
                    <label>Codice</label>
                    <p>{selectedCollega.codice}</p>
                  </div>
                )}

                {selectedCollega.descrizione && (
                  <div className="modal-section">
                    <label>Note</label>
                    <p>{selectedCollega.descrizione}</p>
                  </div>
                )}

                {selectedCollega.schedeCarburante.length > 0 && (
                  <>
                    <h3 className="modal-subtitle">Schede carburante</h3>
                    {selectedCollega.schedeCarburante.map((scheda, index) => (
                      <div key={scheda.id} className="modal-section fuel-card">
                        <label>Scheda {index + 1}</label>
                        <p>
                          <strong>Carta:</strong> {scheda.nomeCarta || "-"}
                        </p>
                        <p>
                          <strong>PIN:</strong> {scheda.pinCarta || "-"}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <button className="modal-close-btn" onClick={() => setSelectedCollega(null)}>
              CHIUDI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NextColleghiPage;
