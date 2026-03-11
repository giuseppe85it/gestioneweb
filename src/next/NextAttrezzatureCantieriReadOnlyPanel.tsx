import { useMemo, useState } from "react";
import {
  buildNextAttrezzatureRegistroView,
  buildNextAttrezzatureStatoView,
  formatNextAttrezzatureQuantita,
  type NextAttrezzatureCantieriSnapshot,
} from "./domain/nextAttrezzatureCantieriDomain";
import "../pages/AttrezzatureCantieri.css";

type NextAttrezzatureCantieriReadOnlyPanelProps = {
  snapshot: NextAttrezzatureCantieriSnapshot;
  blockedReason: string;
};

export default function NextAttrezzatureCantieriReadOnlyPanel({
  snapshot,
  blockedReason,
}: NextAttrezzatureCantieriReadOnlyPanelProps) {
  const [filterText, setFilterText] = useState("");
  const [filterTipo, setFilterTipo] = useState<"tutti" | (typeof snapshot.movementTypes)[number]>(
    "tutti"
  );
  const [filterCategoria, setFilterCategoria] = useState("tutte");
  const [showAllStato, setShowAllStato] = useState(false);
  const [showAllRegistro, setShowAllRegistro] = useState(false);

  const normalizedCategoria = filterCategoria === "tutte" ? null : filterCategoria;
  const movimenti = useMemo(
    () =>
      buildNextAttrezzatureRegistroView(snapshot, {
        query: filterText,
        tipo: filterTipo,
        categoria: normalizedCategoria,
      }),
    [filterText, filterTipo, normalizedCategoria, snapshot]
  );
  const statoAttuale = useMemo(
    () =>
      buildNextAttrezzatureStatoView(snapshot, {
        query: filterText,
        categoria: normalizedCategoria,
      }),
    [filterText, normalizedCategoria, snapshot]
  );
  const statoVisibile = showAllStato ? statoAttuale : statoAttuale.slice(0, 5);
  const movimentiVisibili = showAllRegistro ? movimenti : movimenti.slice(0, 5);

  return (
    <div className="ac-grid">
      <div className="ac-col">
        <section className="ac-section ac-form-section">
          <div className="ac-section-head">
            <div>
              <h2>Nuovo movimento</h2>
              <span>Consegna, spostamento o ritiro attrezzature</span>
            </div>
          </div>

          <div className="go-badge" style={{ marginBottom: 12 }}>
            {blockedReason}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="ac-primary-btn" type="button" disabled title={blockedReason}>
              Salva movimento
            </button>
            <button className="ac-secondary-btn" type="button" disabled title={blockedReason}>
              Upload foto
            </button>
            <button className="ac-danger-btn" type="button" disabled title={blockedReason}>
              Elimina
            </button>
          </div>
        </section>

        <section className="ac-section ac-stato-section">
          <div className="ac-section-head">
            <div>
              <h2>Stato attuale</h2>
              <span>Dove sono le attrezzature ora</span>
            </div>
            {statoAttuale.length > 5 ? (
              <button
                className="ac-link-btn"
                type="button"
                onClick={() => setShowAllStato((prev) => !prev)}
              >
                {showAllStato ? "Mostra meno" : "Mostra tutto"}
              </button>
            ) : null}
          </div>

          {statoAttuale.length === 0 ? (
            <div className="ac-empty">Nessun movimento registrato.</div>
          ) : (
            <div className="ac-status-grid">
              {statoVisibile.map((cantiere) => (
                <div className="ac-status-card" key={`${cantiere.id}-${cantiere.label}`}>
                  <div className="ac-status-head">
                    <div className="ac-status-title">{cantiere.label}</div>
                    <div className="ac-status-sub">{cantiere.id}</div>
                  </div>
                  <div className="ac-status-list">
                    {cantiere.materiali.map((materiale) => (
                      <div
                        key={`${cantiere.id}-${materiale.descrizione}-${materiale.unita}`}
                        className="ac-status-row"
                      >
                        <span>{materiale.descrizione}</span>
                        <span className="ac-qty">
                          {formatNextAttrezzatureQuantita(materiale.quantita)} {materiale.unita}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="ac-col">
        <section className="ac-section ac-registro-section">
          <div className="ac-section-head">
            <div>
              <h2>Registro movimenti</h2>
              <span>{movimenti.length} movimenti</span>
            </div>
            {movimenti.length > 5 ? (
              <button
                className="ac-link-btn"
                type="button"
                onClick={() => setShowAllRegistro((prev) => !prev)}
              >
                {showAllRegistro ? "Mostra meno" : "Mostra tutto"}
              </button>
            ) : null}
          </div>

          <div className="ac-filters">
            <label className="ac-label">
              Ricerca
              <input
                className="ac-input"
                type="text"
                placeholder="cantiere, descrizione"
                value={filterText}
                onChange={(event) => setFilterText(event.target.value)}
              />
            </label>

            <label className="ac-label">
              Tipo
              <select
                className="ac-input"
                value={filterTipo}
                onChange={(event) =>
                  setFilterTipo(event.target.value as "tutti" | (typeof snapshot.movementTypes)[number])
                }
              >
                <option value="tutti">tutti</option>
                {snapshot.movementTypes.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </label>

            <label className="ac-label">
              Categoria
              <select
                className="ac-input"
                value={filterCategoria}
                onChange={(event) => setFilterCategoria(event.target.value)}
              >
                <option value="tutte">tutte</option>
                {snapshot.categories.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="ac-registro-list">
            {movimenti.length === 0 ? (
              <div className="ac-empty">Nessun movimento registrato.</div>
            ) : (
              movimentiVisibili.map((item) => (
                <div key={item.id} className="ac-registro-row">
                  <div className="ac-registro-main">
                    <div className="ac-registro-head">
                      <span className="ac-date">{item.data ?? "-"}</span>
                      <span className={`ac-badge is-${item.tipo.toLowerCase()}`}>{item.tipo}</span>
                    </div>
                    <div className="ac-registro-title">{item.descrizione}</div>
                    <div className="ac-registro-meta">
                      <span className="ac-meta-item">{item.materialeCategoria || "-"}</span>
                      <span className="ac-meta-item">
                        {formatNextAttrezzatureQuantita(item.quantita)} {item.unita}
                      </span>
                      <span className="ac-meta-item">{item.cantiereLabel || item.cantiereId}</span>
                    </div>
                    {item.tipo === "SPOSTATO" &&
                    (item.sourceCantiereId || item.sourceCantiereLabel) ? (
                      <div className="ac-registro-meta">
                        <span className="ac-meta-item">
                          Da: {item.sourceCantiereLabel || item.sourceCantiereId}
                        </span>
                      </div>
                    ) : null}
                    {item.note ? <div className="ac-note">{item.note}</div> : null}
                    {item.fotoUrl ? (
                      <div className="ac-photo-thumb">
                        <img src={item.fotoUrl} alt="Foto movimento" />
                      </div>
                    ) : null}
                  </div>

                  <div className="ac-registro-actions">
                    <button
                      className="ac-secondary-btn"
                      type="button"
                      disabled
                      title={blockedReason}
                    >
                      Modifica
                    </button>
                    <button
                      className="ac-danger-btn"
                      type="button"
                      disabled
                      title={blockedReason}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
